import { AllKeysExhaustedError } from "./errors";
import type { ApiKeyRecord } from "./types";

interface KeyStoreLike {
  listKeys(): ApiKeyRecord[];
  updateKeyStatus(id: string, status: ApiKeyRecord["status"]): ApiKeyRecord | null;
}

export class KeyPoolManager {
  private nextIndex = 0;
  private lock: Promise<void> = Promise.resolve();

  constructor(private readonly keyStore: KeyStoreLike) {}

  async getNextActiveKey(): Promise<ApiKeyRecord> {
    return this.runExclusive(() => {
      const activeKeys = this.keyStore.listKeys().filter((key) => key.status === "active");
      if (activeKeys.length === 0) {
        throw new AllKeysExhaustedError();
      }

      const selectedIndex = this.nextIndex % activeKeys.length;
      const selectedKey = activeKeys[selectedIndex];
      this.nextIndex = (selectedIndex + 1) % activeKeys.length;

      return selectedKey;
    });
  }

  async markKeyExhausted(keyId: string): Promise<void> {
    await this.runExclusive(() => {
      const activeBefore = this.keyStore.listKeys().filter((key) => key.status === "active");
      const removedIndex = activeBefore.findIndex((key) => key.id === keyId);
      const pointerBefore = this.nextIndex;

      const updated = this.keyStore.updateKeyStatus(keyId, "exhausted");
      if (!updated) {
        return;
      }

      const activeCount = this.keyStore.listKeys().filter((key) => key.status === "active").length;
      if (activeCount === 0) {
        this.nextIndex = 0;
        return;
      }

      if (removedIndex === -1) {
        this.nextIndex = pointerBefore % activeCount;
        return;
      }

      const adjustedPointer = removedIndex < pointerBefore ? pointerBefore - 1 : pointerBefore;
      this.nextIndex = ((adjustedPointer % activeCount) + activeCount) % activeCount;
    });
  }

  private async runExclusive<T>(operation: () => T | Promise<T>): Promise<T> {
    const previous = this.lock;
    let release = () => {};
    this.lock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
    }
  }
}
