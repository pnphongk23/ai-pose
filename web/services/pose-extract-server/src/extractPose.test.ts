import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "./app";
import { createDatabase } from "./db/connection";
import { AllKeysExhaustedError, GeminiError, GeminiQuotaExceededError } from "./services/errors";
import { KeyPoolManager } from "./services/keyPoolManager";
import { KeyStore } from "./services/keyStore";

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestImageBuffer(): Buffer {
  return Buffer.from("fake-image-content");
}

type ExtractPoseImageMock = (input: {
  apiKey: string;
  sourceImageBase64: string;
  sourceMimeType: string;
}) => Promise<{
  imageBase64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
}>;

interface CreateExtractAppOptions {
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
  extractPoseImageMock?: ExtractPoseImageMock;
}

function createExtractApp(options: CreateExtractAppOptions = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-extract-api-"));
  tempDirs.push(tempDir);

  const db = createDatabase(path.join(tempDir, "keys.db"));
  const keyStore = new KeyStore(db);
  const keyPoolManager = new KeyPoolManager(keyStore);
  keyStore.createKey({ name: "key1", apiKey: "AIza-key1" });
  keyStore.createKey({ name: "key2", apiKey: "AIza-key2" });

  const extractPoseImageMock =
    options.extractPoseImageMock ??
    (vi.fn().mockResolvedValue({
      imageBase64: "dGVzdA==",
      mimeType: "image/png"
    }) as ExtractPoseImageMock);

  const app = createApp({
    version: "1.0.0-test",
    keyStore,
    keyPoolManager,
    geminiService: {
      extractPoseImage: extractPoseImageMock
    },
    extractRateLimitWindowMs: options.rateLimitWindowMs,
    extractRateLimitMaxRequests: options.rateLimitMaxRequests
  });

  return { app, keyStore, extractPoseImageMock };
}

describe("POST /api/extract-pose", () => {
  it("returns INVALID_IMAGE when image field is missing", async () => {
    const { app } = createExtractApp();

    const response = await request(app).post("/api/extract-pose");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_IMAGE");
  });

  it("returns INVALID_IMAGE for unsupported mime type", async () => {
    const { app } = createExtractApp();

    const response = await request(app)
      .post("/api/extract-pose")
      .attach("image", createTestImageBuffer(), {
        filename: "pose.gif",
        contentType: "image/gif"
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_IMAGE");
  });

  it("returns IMAGE_TOO_LARGE when file exceeds 10MB", async () => {
    const { app } = createExtractApp();
    const tooLarge = Buffer.alloc(10 * 1024 * 1024 + 1, 1);

    const response = await request(app)
      .post("/api/extract-pose")
      .attach("image", tooLarge, {
        filename: "large.png",
        contentType: "image/png"
      });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("IMAGE_TOO_LARGE");
  });

  it("returns RATE_LIMITED when endpoint rate limit is exceeded", async () => {
    const { app } = createExtractApp({
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 1
    });

    const first = await request(app)
      .post("/api/extract-pose")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });
    const second = await request(app)
      .post("/api/extract-pose")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe("RATE_LIMITED");
  });

  it("uses forwarded-for IP for rate-limit key when trust proxy is enabled", async () => {
    const { app } = createExtractApp({
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 1
    });

    const firstIp = await request(app)
      .post("/api/extract-pose")
      .set("X-Forwarded-For", "203.0.113.10")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });

    const secondIp = await request(app)
      .post("/api/extract-pose")
      .set("X-Forwarded-For", "198.51.100.8")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });

    expect(firstIp.status).toBe(200);
    expect(secondIp.status).toBe(200);
  });

  it("returns ALL_KEYS_EXHAUSTED when all provider keys are out of quota", async () => {
    const quotaError = new GeminiQuotaExceededError("quota");
    const { app } = createExtractApp({
      extractPoseImageMock: vi.fn().mockRejectedValue(quotaError) as ExtractPoseImageMock
    });

    const response = await request(app)
      .post("/api/extract-pose")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("ALL_KEYS_EXHAUSTED");
  });

  it("returns GEMINI_ERROR for non-quota provider failures", async () => {
    const { app } = createExtractApp({
      extractPoseImageMock: vi.fn().mockRejectedValue(new GeminiError("provider failed")) as ExtractPoseImageMock
    });

    const response = await request(app)
      .post("/api/extract-pose")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe("GEMINI_ERROR");
  });

  it("orchestrates failover: key1 quota exceeded then key2 success", async () => {
    const extractPoseImageMock = (vi
      .fn()
      .mockRejectedValueOnce(new GeminiQuotaExceededError("key1 exhausted"))
      .mockResolvedValueOnce({
        imageBase64: "cG9zZS1pbWFnZQ==",
        mimeType: "image/png"
      })) as ExtractPoseImageMock;

    const { app, keyStore } = createExtractApp({ extractPoseImageMock });
    const keys = keyStore.listKeys();
    const key1 = keys[0];

    const response = await request(app)
      .post("/api/extract-pose")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.keyUsed).toBe("key2");
    expect(extractPoseImageMock).toHaveBeenCalledTimes(2);

    const updatedKey1 = keyStore.listKeys().find((item) => item.id === key1.id);
    expect(updatedKey1?.status).toBe("exhausted");

    const logs = keyStore.listRequestLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      keyId: key1.id,
      success: false,
      errorCode: "GEMINI_QUOTA_EXCEEDED"
    });
    expect(logs[1]).toMatchObject({
      success: true,
      errorCode: null
    });
  });

  it("maps immediate no-active-key state to ALL_KEYS_EXHAUSTED", async () => {
    const { app, keyStore } = createExtractApp();
    for (const key of keyStore.listKeys()) {
      keyStore.updateKeyStatus(key.id, "exhausted");
    }

    const response = await request(app)
      .post("/api/extract-pose")
      .attach("image", createTestImageBuffer(), { filename: "pose.jpg", contentType: "image/jpeg" });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe(new AllKeysExhaustedError().code);
  });
});
