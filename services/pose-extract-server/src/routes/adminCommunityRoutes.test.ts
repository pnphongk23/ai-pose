import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "../db/connection";
import { CommunityStore } from "../db/communityStore";
import { createAdminCommunityRoutes } from "./adminCommunityRoutes";

const tempDirs: string[] = [];
const ADMIN_SECRET = "test-admin-secret";

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestApp() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-admin-community-"));
  tempDirs.push(tempDir);
  const uploadDir = path.join(tempDir, "community");
  const db = createDatabase(path.join(tempDir, "test.db"));
  const communityStore = new CommunityStore(db);

  const app = express();
  app.use(
    "/api/admin/community/poses",
    createAdminCommunityRoutes({
      adminSecret: ADMIN_SECRET,
      communityStore,
      uploadDir,
    })
  );

  return { app, communityStore, uploadDir };
}

describe("POST /api/admin/community/poses", () => {
  it("rejects request without auth", async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post("/api/admin/community/poses")
      .field("name", "Test Pose");

    expect(res.status).toBe(401);
  });

  it("rejects request without image", async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .field("name", "Test Pose")
      .field("tags", JSON.stringify(["standing"]))
      .field("difficulty", "beginner")
      .field("bodyParts", JSON.stringify(["legs"]))
      .field("status", "draft");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("rejects request without name", async () => {
    const { app } = createTestApp();

    const imageBuffer = Buffer.from("fake-image-data");

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .attach("image", imageBuffer, { filename: "pose.png", contentType: "image/png" })
      .field("tags", JSON.stringify(["standing"]))
      .field("difficulty", "beginner")
      .field("bodyParts", JSON.stringify(["legs"]))
      .field("status", "draft");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("creates pose and saves image file", async () => {
    const { app, uploadDir } = createTestApp();

    const imageBuffer = Buffer.from("fake-image-data");

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .attach("image", imageBuffer, { filename: "warrior2.png", contentType: "image/png" })
      .field("name", "Warrior II")
      .field("tags", JSON.stringify(["standing", "balance"]))
      .field("difficulty", "intermediate")
      .field("description", "Classic yoga pose")
      .field("bodyParts", JSON.stringify(["legs", "arms"]))
      .field("status", "draft");

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Warrior II");
    expect(res.body.data.tags).toEqual(["standing", "balance"]);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.downloadCount).toBe(0);

    // File must exist on disk
    const savedPath = path.join(uploadDir, path.basename(res.body.data.imagePath));
    expect(fs.existsSync(savedPath)).toBe(true);
  });
});
