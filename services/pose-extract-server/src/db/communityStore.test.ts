import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "./connection";
import { CommunityStore } from "./communityStore";

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestStore(): CommunityStore {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-community-"));
  tempDirs.push(tempDir);
  const db = createDatabase(path.join(tempDir, "test.db"));
  return new CommunityStore(db);
}

describe("CommunityStore", () => {
  it("creates and retrieves a pose by id", () => {
    const store = createTestStore();

    const created = store.createPose({
      name: "Warrior II",
      imagePath: "community/warrior2.png",
      thumbnailPath: "community/warrior2_thumb.png",
      tags: ["standing", "balance"],
      difficulty: "intermediate",
      description: "Classic yoga pose",
      bodyParts: ["legs", "arms"],
      status: "draft",
    });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Warrior II");
    expect(created.tags).toEqual(["standing", "balance"]);
    expect(created.bodyParts).toEqual(["legs", "arms"]);
    expect(created.downloadCount).toBe(0);
    expect(created.status).toBe("draft");

    const fetched = store.getPoseById(created.id);
    expect(fetched).toEqual(created);
  });

  it("returns null for unknown id", () => {
    const store = createTestStore();
    expect(store.getPoseById("nonexistent")).toBeNull();
  });

  it("lists only published poses by default", () => {
    const store = createTestStore();

    store.createPose({
      name: "Draft Pose",
      imagePath: "community/draft.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "draft",
    });

    const published = store.createPose({
      name: "Published Pose",
      imagePath: "community/pub.png",
      thumbnailPath: null,
      tags: ["standing"],
      difficulty: "beginner",
      description: null,
      bodyParts: ["legs"],
      status: "published",
    });

    const { poses, total } = store.listPoses({ status: "published", page: 1, limit: 10 });
    expect(poses).toHaveLength(1);
    expect(poses[0].id).toBe(published.id);
    expect(total).toBe(1);
  });

  it("filters by difficulty", () => {
    const store = createTestStore();

    store.createPose({
      name: "Easy Pose",
      imagePath: "community/easy.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    store.createPose({
      name: "Hard Pose",
      imagePath: "community/hard.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "advanced",
      description: null,
      bodyParts: [],
      status: "published",
    });

    const { poses, total } = store.listPoses({ status: "published", difficulty: "beginner", page: 1, limit: 10 });
    expect(poses).toHaveLength(1);
    expect(poses[0].name).toBe("Easy Pose");
    expect(total).toBe(1);
  });

  it("filters by tag", () => {
    const store = createTestStore();

    store.createPose({
      name: "Balance Pose",
      imagePath: "community/balance.png",
      thumbnailPath: null,
      tags: ["balance", "standing"],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    store.createPose({
      name: "Core Pose",
      imagePath: "community/core.png",
      thumbnailPath: null,
      tags: ["core"],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    const { poses } = store.listPoses({ status: "published", tag: "balance", page: 1, limit: 10 });
    expect(poses).toHaveLength(1);
    expect(poses[0].name).toBe("Balance Pose");
  });

  it("paginates results", () => {
    const store = createTestStore();

    for (let i = 0; i < 5; i++) {
      store.createPose({
        name: `Pose ${i}`,
        imagePath: `community/pose${i}.png`,
        thumbnailPath: null,
        tags: [],
        difficulty: "beginner",
        description: null,
        bodyParts: [],
        status: "published",
      });
    }

    const page1 = store.listPoses({ status: "published", page: 1, limit: 3 });
    const page2 = store.listPoses({ status: "published", page: 2, limit: 3 });

    expect(page1.poses).toHaveLength(3);
    expect(page2.poses).toHaveLength(2);
    expect(page1.total).toBe(5);
  });

  it("increments download count", () => {
    const store = createTestStore();

    const pose = store.createPose({
      name: "Popular Pose",
      imagePath: "community/popular.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    store.incrementDownload(pose.id);
    store.incrementDownload(pose.id);

    const updated = store.getPoseById(pose.id);
    expect(updated?.downloadCount).toBe(2);
  });
});
