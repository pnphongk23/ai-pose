import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@aws-sdk/s3-presigned-post", () => ({
  createPresignedPost: vi.fn()
}));

// mockSend is stable across tests — we only reset calls/implementation per test
const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  const send = vi.fn();
  // We'll replace the reference in beforeEach via the captured mockSend
  return {
    S3Client: function S3Client() {
      return { send };
    },
    HeadObjectCommand: function HeadObjectCommand(input: unknown) {
      return { input };
    }
  };
});

vi.mock("../config/env", () => ({
  getEnv: vi.fn().mockReturnValue({
    R2_ACCOUNT_ID: "test-account",
    R2_ACCESS_KEY_ID: "test-key-id",
    R2_SECRET_ACCESS_KEY: "test-secret",
    R2_BUCKET: "test-bucket",
    R2_PUBLIC_URL: "https://cdn.example.com"
  })
}));

import { buildPublicUrl, createUploadUrl, objectExists } from "./r2Storage";

// Get a reference to the stubbed send so we can control it per-test
const s3Module = await vi.importMock<typeof import("@aws-sdk/client-s3")>("@aws-sdk/client-s3");
const stubClient = new s3Module.S3Client({} as never);
const stubSend = vi.mocked(stubClient.send);

describe("r2Storage", () => {
  beforeEach(() => {
    vi.mocked(createPresignedPost).mockReset();
    stubSend.mockReset();
  });

  describe("buildPublicUrl", () => {
    it("joins base and fileKey with a single slash", () => {
      expect(buildPublicUrl("https://cdn.example.com", "community/a.png")).toBe(
        "https://cdn.example.com/community/a.png"
      );
    });

    it("trims trailing slash from base and leading slash from fileKey", () => {
      expect(buildPublicUrl("https://cdn.example.com/", "/community/a.png")).toBe(
        "https://cdn.example.com/community/a.png"
      );
    });
  });

  describe("createUploadUrl", () => {
    it("returns uploadUrl, fileKey, and fields from presigned POST", async () => {
      vi.mocked(createPresignedPost).mockResolvedValue({
        url: "https://upload.example.com",
        fields: { key: "community/test.png", "Content-Type": "image/png" }
      });

      const payload = await createUploadUrl({ fileName: "test.png", mimeType: "image/png" });

      expect(payload.uploadUrl).toBe("https://upload.example.com");
      expect(payload.fileKey).toMatch(/^community\/.+\.png$/);
      expect(payload.fields).toMatchObject({ "Content-Type": "image/png" });
    });
  });

  describe("objectExists", () => {
    it("returns true when HeadObject succeeds", async () => {
      stubSend.mockResolvedValue({});

      await expect(objectExists("community/a.png")).resolves.toBe(true);
    });

    it("returns false when HeadObject throws", async () => {
      stubSend.mockRejectedValue(new Error("NotFound"));

      await expect(objectExists("community/missing.png")).resolves.toBe(false);
    });
  });
});
