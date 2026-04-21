import type { NextFunction, Request, Response } from "express";
import express from "express";
import fs from "node:fs";

import { createAdminRoutes } from "./routes/adminRoutes";
import { createExtractPoseRoutes } from "./routes/extractPoseRoutes";
import { createCommunityRoutes } from "./routes/communityRoutes";
import { createAdminCommunityRoutes } from "./routes/adminCommunityRoutes";
import { AppError } from "./services/errors";
import type { KeyPoolManager } from "./services/keyPoolManager";
import type { KeyStore } from "./services/keyStore";
import type { CommunityStore } from "./db/communityStore";
import { logger } from "./utils/logger";

interface GeminiServiceLike {
  extractPoseImage(input: {
    apiKey: string;
    sourceImageBase64: string;
    sourceMimeType: string;
  }): Promise<{ imageBase64: string; mimeType: "image/png" | "image/jpeg" | "image/webp" }>;
}

interface CreateAppOptions {
  version: string;
  startedAtMs?: number;
  adminSecret?: string;
  keyStore?: KeyStore;
  keyPoolManager?: KeyPoolManager;
  geminiService?: GeminiServiceLike;
  adminRateLimitWindowMs?: number;
  adminRateLimitMaxRequests?: number;
  extractRateLimitWindowMs?: number;
  extractRateLimitMaxRequests?: number;
  communityStore?: CommunityStore;
  communityUploadDir?: string;
}

export function createApp(options: CreateAppOptions): express.Express {
  const app = express();
  const startedAtMs = options.startedAtMs ?? Date.now();

  // Railway sits behind at least one reverse proxy hop.
  app.set("trust proxy", 1);
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    const uptime = Math.max((Date.now() - startedAtMs) / 1000, 0);
    res.json({
      status: "ok",
      uptime,
      version: options.version
    });
  });

  if (options.adminSecret && options.keyStore) {
    app.use(
      "/api/admin",
      createAdminRoutes({
        adminSecret: options.adminSecret,
        keyStore: options.keyStore,
        rateLimitWindowMs: options.adminRateLimitWindowMs,
        rateLimitMaxRequests: options.adminRateLimitMaxRequests
      })
    );
  }

  if (options.keyStore && options.keyPoolManager && options.geminiService) {
    app.use(
      "/api/extract-pose",
      createExtractPoseRoutes({
        keyStore: options.keyStore,
        keyPoolManager: options.keyPoolManager,
        geminiService: options.geminiService,
        rateLimitWindowMs: options.extractRateLimitWindowMs,
        rateLimitMaxRequests: options.extractRateLimitMaxRequests
      })
    );
  }

  // Community public routes
  if (options.communityStore) {
    app.use("/api/community/poses", createCommunityRoutes(options.communityStore));
  }

  // Admin community routes
  if (options.adminSecret && options.communityStore && options.communityUploadDir) {
    app.use(
      "/api/admin/community/poses",
      createAdminCommunityRoutes({
        adminSecret: options.adminSecret,
        communityStore: options.communityStore,
        uploadDir: options.communityUploadDir,
      })
    );
  }

  // Serve uploaded community images as static files
  if (options.communityUploadDir) {
    const uploadDir = options.communityUploadDir;
    fs.mkdirSync(uploadDir, { recursive: true });
    app.use("/community", express.static(uploadDir));
  }

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found"
      }
    });
  });

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
      return;
    }

    logger.error({ err: error }, "Unhandled application error");
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error"
      }
    });
  });

  return app;
}
