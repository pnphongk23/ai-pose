import { describe, expect, it } from "vitest";

import { AllKeysExhaustedError } from "./errors";
import { KeyPoolManager } from "./keyPoolManager";
import type { ApiKeyRecord } from "./types";

interface TestKeyStore {
  listKeys(): ApiKeyRecord[];
  updateKeyStatus(id: string, status: ApiKeyRecord["status"]): ApiKeyRecord | null;
}

function createKey(id: string, status: ApiKeyRecord["status"] = "active"): ApiKeyRecord {
  return {
    id,
    name: `Key ${id}`,
    apiKey: `AIza-${id}`,
    status,
    requestsToday: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastUsedAt: null
  };
}

function createStore(keys: ApiKeyRecord[]): TestKeyStore {
  return {
    listKeys() {
      return keys.map((key) => ({ ...key }));
    },
    updateKeyStatus(id, status) {
      const key = keys.find((item) => item.id === id);
      if (!key) {
        return null;
      }
      key.status = status;
      return { ...key };
    }
  };
}

describe("KeyPoolManager", () => {
  it("selects active keys in round-robin order", async () => {
    const keys = [createKey("a"), createKey("b"), createKey("c")];
    const manager = new KeyPoolManager(createStore(keys));

    const first = await manager.getNextActiveKey();
    const second = await manager.getNextActiveKey();
    const third = await manager.getNextActiveKey();
    const fourth = await manager.getNextActiveKey();

    expect(first.id).toBe("a");
    expect(second.id).toBe("b");
    expect(third.id).toBe("c");
    expect(fourth.id).toBe("a");
  });

  it("retries with next active key after mark exhausted", async () => {
    const keys = [createKey("a"), createKey("b"), createKey("c", "disabled")];
    const manager = new KeyPoolManager(createStore(keys));

    const first = await manager.getNextActiveKey();
    await manager.markKeyExhausted(first.id);
    const second = await manager.getNextActiveKey();

    expect(first.id).toBe("a");
    expect(second.id).toBe("b");
  });

  it("does not skip the immediate next key after exhausting current key in 3-key pool", async () => {
    const keys = [createKey("a"), createKey("b"), createKey("c")];
    const manager = new KeyPoolManager(createStore(keys));

    const first = await manager.getNextActiveKey();
    await manager.markKeyExhausted(first.id);
    const second = await manager.getNextActiveKey();

    expect(first.id).toBe("a");
    expect(second.id).toBe("b");
  });

  it("throws when all keys are exhausted or not active", async () => {
    const keys = [createKey("a", "disabled"), createKey("b", "exhausted")];
    const manager = new KeyPoolManager(createStore(keys));

    await expect(manager.getNextActiveKey()).rejects.toBeInstanceOf(AllKeysExhaustedError);
  });

  it("serializes concurrent mark/select operations to avoid race conditions", async () => {
    const keys = [createKey("a"), createKey("b")];
    const manager = new KeyPoolManager(createStore(keys));

    const first = await manager.getNextActiveKey();
    const [_, selectedAfterExhaustion] = await Promise.all([
      manager.markKeyExhausted(first.id),
      manager.getNextActiveKey()
    ]);

    expect(selectedAfterExhaustion.id).toBe("b");
  });
});
