import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "../db/connection";
import { KeyStore } from "./keyStore";

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestStore(): KeyStore {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-keystore-"));
  tempDirs.push(tempDir);
  const db = createDatabase(path.join(tempDir, "keys.db"));
  return new KeyStore(db);
}

describe("KeyStore", () => {
  it("creates and lists keys", () => {
    const keyStore = createTestStore();

    const created = keyStore.createKey({
      name: "Primary",
      apiKey: "AIza-primary"
    });

    const keys = keyStore.listKeys();
    expect(created.status).toBe("active");
    expect(created.requestsToday).toBe(0);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toEqual(created);
  });

  it("updates key status and deletes key", () => {
    const keyStore = createTestStore();
    const created = keyStore.createKey({
      name: "Secondary",
      apiKey: "AIza-secondary"
    });

    const updated = keyStore.updateKeyStatus(created.id, "disabled");
    const wasDeleted = keyStore.deleteKey(created.id);

    expect(updated?.status).toBe("disabled");
    expect(wasDeleted).toBe(true);
    expect(keyStore.listKeys()).toHaveLength(0);
  });

  it("resets requests_today and only reactivates exhausted keys", () => {
    const keyStore = createTestStore();
    const active = keyStore.createKey({ name: "A", apiKey: "key-a" });
    const exhausted = keyStore.createKey({ name: "B", apiKey: "key-b" });
    const disabled = keyStore.createKey({ name: "C", apiKey: "key-c" });

    keyStore.incrementRequestsToday(active.id);
    keyStore.incrementRequestsToday(exhausted.id);
    keyStore.incrementRequestsToday(disabled.id);
    keyStore.updateKeyStatus(exhausted.id, "exhausted");
    keyStore.updateKeyStatus(disabled.id, "disabled");

    const affectedRows = keyStore.resetDailyCounters();
    const keys = keyStore.listKeys();

    const activeAfterReset = keys.find((item) => item.id === active.id);
    const exhaustedAfterReset = keys.find((item) => item.id === exhausted.id);
    const disabledAfterReset = keys.find((item) => item.id === disabled.id);

    expect(affectedRows).toBe(3);
    expect(activeAfterReset?.requestsToday).toBe(0);
    expect(activeAfterReset?.status).toBe("active");
    expect(exhaustedAfterReset?.requestsToday).toBe(0);
    expect(exhaustedAfterReset?.status).toBe("active");
    expect(disabledAfterReset?.requestsToday).toBe(0);
    expect(disabledAfterReset?.status).toBe("disabled");
  });
});
