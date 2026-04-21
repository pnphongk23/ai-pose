import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "./connection";

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe("createDatabase", () => {
  it("creates sqlite db file and applies schema", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-db-"));
    tempDirs.push(tempDir);

    const databasePath = path.join(tempDir, "nested", "keys.db");
    const db = createDatabase(databasePath);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const sentinelRow = db
      .prepare("SELECT id FROM schema_bootstrap WHERE id = 1")
      .get() as { id: number } | undefined;

    expect(fs.existsSync(databasePath)).toBe(true);
    expect(tables.map((table) => table.name)).toContain("schema_bootstrap");
    expect(tables.map((table) => table.name)).toContain("api_keys");
    expect(tables.map((table) => table.name)).toContain("request_logs");
    expect(sentinelRow?.id).toBe(1);
  });

  it("creates community_poses table", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-schema-"));
    tempDirs.push(tempDir);

    const db = createDatabase(path.join(tempDir, "test.db"));

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='community_poses'")
      .all();

    expect(tables).toHaveLength(1);
    db.close();
  });

  it("community_poses has correct defaults and constraints", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-schema-constraints-"));
    tempDirs.push(tempDir);

    const db = createDatabase(path.join(tempDir, "test.db"));

    // Insert with minimal fields — should apply defaults
    db.prepare(
      "INSERT INTO community_poses (id, name, image_path) VALUES ('test-1', 'Test Pose', 'community/test.png')"
    ).run();

    const row = db.prepare("SELECT * FROM community_poses WHERE id = 'test-1'").get() as {
      status: string;
      download_count: number;
      tags: string;
      body_parts: string;
    };

    expect(row.status).toBe("draft");
    expect(row.download_count).toBe(0);
    expect(row.tags).toBe("[]");
    expect(row.body_parts).toBe("[]");

    // Invalid status should fail CHECK constraint
    expect(() => {
      db.prepare(
        "INSERT INTO community_poses (id, name, image_path, status) VALUES ('test-2', 'Bad', 'path', 'invalid')"
      ).run();
    }).toThrow();

    db.close();
  });
});
