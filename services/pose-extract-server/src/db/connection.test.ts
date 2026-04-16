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
});
