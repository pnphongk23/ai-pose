import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "../db/connection";
import { CommunityStore } from "../db/communityStore";
import { createCommunityRoutes } from "./communityRoutes";

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestApp() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-community-routes-"));
  tempDirs.push(tempDir);
  const db = createDatabase(path.join(tempDir, "test.db"));
  const communityStore = new CommunityStore(db);

  const app = express();
  app.use("/api/community/poses", createCommunityRoutes(communityStore));

  return { app, communityStore };
}

function seedPose(store: CommunityStore, overrides: Partial<Parameters<CommunityStore["createPose"]>[0]> = {}) {
  return store.createPose({
    name: "Test Pose",
    imagePath: "community/test.png",
    thumbnailPath: null,
    tags: ["standing"],
    difficulty: "beginner",
    description: "A test pose",
    bodyParts: ["legs"],
    status: "published",
    ...overrides,
  });
}

describe("GET /api/community/poses", () => {
  it("returns empty list when no poses", async () => {
    const { app } = createTestApp();

    const res = await request(app).get("/api/community/poses");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it("returns only published poses", async () => {
    const { app, communityStore } = createTestApp();
    seedPose(communityStore, { status: "published", name: "Published" });
    seedPose(communityStore, { status: "draft", name: "Draft" });

    const res = await request(app).get("/api/community/poses");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Published");
  });

  it("filters by difficulty query param", async () => {
    const { app, communityStore } = createTestApp();
    seedPose(communityStore, { difficulty: "beginner", name: "Easy" });
    seedPose(communityStore, { difficulty: "advanced", name: "Hard" });

    const res = await request(app).get("/api/community/poses?difficulty=beginner");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Easy");
  });

  it("filters by tag query param", async () => {
    const { app, communityStore } = createTestApp();
    seedPose(communityStore, { tags: ["balance"], name: "Balance" });
    seedPose(communityStore, { tags: ["core"], name: "Core" });

    const res = await request(app).get("/api/community/poses?tag=balance");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Balance");
  });

  it("paginates with page and limit params", async () => {
    const { app, communityStore } = createTestApp();
    for (let i = 0; i < 5; i++) {
      seedPose(communityStore, { name: `Pose ${i}` });
    }

    const res = await request(app).get("/api/community/poses?page=1&limit=3");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(3);
  });

  it("rejects invalid difficulty param", async () => {
    const { app } = createTestApp();

    const res = await request(app).get("/api/community/poses?difficulty=extreme");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/community/poses/:id", () => {
  it("returns 404 for unknown id", async () => {
    const { app } = createTestApp();

    const res = await request(app).get("/api/community/poses/nonexistent");

    expect(res.status).toBe(404);
  });

  it("returns pose and increments download count", async () => {
    const { app, communityStore } = createTestApp();
    const pose = seedPose(communityStore);

    const res1 = await request(app).get(`/api/community/poses/${pose.id}`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.id).toBe(pose.id);
    expect(res1.body.data.downloadCount).toBe(1);

    const res2 = await request(app).get(`/api/community/poses/${pose.id}`);
    expect(res2.body.data.downloadCount).toBe(2);
  });

  it("returns 404 for draft poses", async () => {
    const { app, communityStore } = createTestApp();
    const draft = seedPose(communityStore, { status: "draft" });

    const res = await request(app).get(`/api/community/poses/${draft.id}`);

    expect(res.status).toBe(404);
  });
});
