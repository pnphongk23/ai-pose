import { Router } from "express";
import multer from "multer";

import { createExtractRateLimitMiddleware } from "../middleware/extractRateLimit";
import { AllKeysExhaustedError, GeminiQuotaExceededError, ImageTooLargeError, InvalidImageError } from "../services/errors";
import type { ApiKeyRecord, KeyStore } from "../services/keyStore";
import type { KeyPoolManager } from "../services/keyPoolManager";

interface GeminiServiceLike {
  extractPoseImage(input: {
    apiKey: string;
    sourceImageBase64: string;
    sourceMimeType: string;
  }): Promise<{ imageBase64: string; mimeType: "image/png" | "image/jpeg" | "image/webp" }>;
}

interface CreateExtractPoseRoutesOptions {
  keyStore: KeyStore;
  keyPoolManager: KeyPoolManager;
  geminiService: GeminiServiceLike;
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

function createUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      files: 1,
      fileSize: MAX_IMAGE_SIZE_BYTES
    },
    fileFilter(_req, file, callback) {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        callback(new InvalidImageError("Only JPEG/PNG images are supported"));
        return;
      }
      callback(null, true);
    }
  });
}

function mapUploadError(error: unknown): Error {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return new ImageTooLargeError("Image exceeds 10MB limit");
  }

  if (error instanceof InvalidImageError) {
    return error;
  }

  return new InvalidImageError();
}

function estimateQuotaRemaining(key: ApiKeyRecord): string {
  const consumed = key.requestsToday + 1;
  return `~${Math.max(0, 100 - Math.min(consumed, 100))}%`;
}

export function createExtractPoseRoutes(options: CreateExtractPoseRoutesOptions): Router {
  const router = Router();
  const rateLimit = createExtractRateLimitMiddleware({
    windowMs: options.rateLimitWindowMs,
    maxRequests: options.rateLimitMaxRequests
  });
  const upload = createUploadMiddleware();

  router.post(
    "/",
    rateLimit,
    (req, res, next) => {
      upload.single("image")(req, res, (error) => {
        if (error) {
          next(mapUploadError(error));
          return;
        }
        next();
      });
    },
    async (req, res, next) => {
      if (!req.file) {
        next(new InvalidImageError("Image field is required"));
        return;
      }

      const processingStart = Date.now();
      const sourceImageBase64 = req.file.buffer.toString("base64");
      const sourceMimeType = req.file.mimetype;

      while (true) {
        const key = await options.keyPoolManager.getNextActiveKey().catch((error: unknown) => {
          next(error);
          return null;
        });
        if (!key) {
          return;
        }

        try {
          const extracted = await options.geminiService.extractPoseImage({
            apiKey: key.apiKey,
            sourceImageBase64,
            sourceMimeType
          });

          options.keyStore.incrementRequestsToday(key.id);
          const processingTimeMs = Date.now() - processingStart;
          options.keyStore.logRequest({
            keyId: key.id,
            processingTimeMs,
            success: true,
            errorCode: null
          });

          res.json({
            success: true,
            data: {
              imageBase64: extracted.imageBase64,
              mimeType: extracted.mimeType,
              processingTimeMs
            },
            meta: {
              keyUsed: key.name,
              quotaRemaining: estimateQuotaRemaining(key)
            }
          });
          return;
        } catch (error) {
          if (error instanceof GeminiQuotaExceededError) {
            await options.keyPoolManager.markKeyExhausted(key.id);
            options.keyStore.logRequest({
              keyId: key.id,
              processingTimeMs: Date.now() - processingStart,
              success: false,
              errorCode: error.code
            });
            continue;
          }

          if (error instanceof AllKeysExhaustedError) {
            next(error);
            return;
          }

          options.keyStore.logRequest({
            keyId: key.id,
            processingTimeMs: Date.now() - processingStart,
            success: false,
            errorCode: error instanceof Error && "code" in error ? String((error as { code?: string }).code ?? null) : null
          });
          next(error);
          return;
        }
      }
    }
  );

  return router;
}
