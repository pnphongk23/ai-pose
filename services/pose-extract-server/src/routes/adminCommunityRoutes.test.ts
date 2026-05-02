import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDatabase } from "../db/connection";
import { CommunityStore } from "../db/communityStore";
import { createAdminCommunityRoutes } from "./adminCommunityRoutes";

const tempDirs: string[] = [];
const ADMIN_SECRET = "test-admin-secret";
const R2_PUBLIC_URL = "https://cdn.example.com";

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestApp(overrides?: {
  createUploadUrl?: (input: { fileName: string; mimeType: string }) => Promise<{
    uploadUrl: string;
    fileKey: string;
    fields: Record<string, string>;
  }>;
  objectExists?: (fileKey: string) => Promise<boolean>;
}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-admin-community-"));
  tempDirs.push(tempDir);
  const db = createDatabase(path.join(tempDir, "test.db"));
  const communityStore = new CommunityStore(db);

  const createUploadUrl =
    overrides?.createUploadUrl ??
    (async ({ fileName, mimeType }) => ({
      uploadUrl: "https://r2.example.com/upload",
      fileKey: `community/generated-${fileName}`,
      fields: { "Content-Type": mimeType, key: `community/generated-${fileName}` },
    }));

  const objectExists = overrides?.objectExists ?? (async () => true);

  const app = express();
  app.use(express.json());
  app.use(
    "/api/admin/community/poses",
    createAdminCommunityRoutes({
      adminSecret: ADMIN_SECRET,
      communityStore,
      r2PublicUrl: R2_PUBLIC_URL,
      createUploadUrl,
      objectExists,
    })
  );

  return { app, communityStore };
}

describe("POST /api/admin/community/poses/upload-url", () => {
  it("rejects request without auth", async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post("/api/admin/community/poses/upload-url")
      .send({ fileName: "pose.png", mimeType: "image/png" });

    expect(res.status).toBe(401);
  });

  it("returns upload payload", async () => {
    const createUploadUrl = vi.fn(async ({ fileName, mimeType }) => ({
      uploadUrl: "https://r2.example.com/upload",
      fileKey: `community/${fileName}`,
      fields: { "Content-Type": mimeType },
    }));

    const { app } = createTestApp({ createUploadUrl });

    const res = await request(app)
      .post("/api/admin/community/poses/upload-url")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .send({ fileName: "pose.png", mimeType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      uploadUrl: "https://r2.example.com/upload",
      fileKey: "community/pose.png",
      fields: { "Content-Type": "image/png" },
    });
    expect(createUploadUrl).toHaveBeenCalledWith({ fileName: "pose.png", mimeType: "image/png" });
  });

  it("returns 400 for invalid mimeType", async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post("/api/admin/community/poses/upload-url")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .send({ fileName: "pose.txt", mimeType: "text/plain" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });
});

describe("POST /api/admin/community/poses", () => {
  it("rejects request without auth", async () => {
    const { app } = createTestApp();

    const res = await request(app).post("/api/admin/community/poses").send({
      name: "Test Pose",
      fileKey: "community/test.png",
      tags: ["standing"],
      difficulty: "beginner",
      bodyParts: ["legs"],
      status: "draft",
    });

    expect(res.status).toBe(401);
  });

  it("returns 409 when fileKey does not exist", async () => {
    const objectExists = vi.fn(async () => false);
    const { app } = createTestApp({ objectExists });

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .send({
        name: "Pose",
        fileKey: "community/missing.png",
        tags: [],
        bodyParts: [],
        status: "published",
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(objectExists).toHaveBeenCalledWith("community/missing.png");
  });

  it("creates pose with full public imagePath", async () => {
    const objectExists = vi.fn(async () => true);
    const { app } = createTestApp({ objectExists });

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .send({
        name: "Warrior II",
        fileKey: "community/warrior2.png",
        tags: ["standing", "balance"],
        difficulty: "intermediate",
        description: "Classic yoga pose",
        bodyParts: ["legs", "arms"],
        status: "draft",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Warrior II");
    expect(res.body.data.tags).toEqual(["standing", "balance"]);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.downloadCount).toBe(0);
    expect(res.body.data.imagePath).toBe("https://cdn.example.com/community/warrior2.png");
  });
});
