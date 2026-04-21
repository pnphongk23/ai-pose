import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getEnv, resetEnvCache } from "./env";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_PATH: process.env.DATABASE_PATH,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX
};

beforeEach(() => {
  resetEnvCache();
});

afterEach(() => {
  if (originalEnv.NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  }

  if (originalEnv.PORT === undefined) {
    delete process.env.PORT;
  } else {
    process.env.PORT = originalEnv.PORT;
  }

  if (originalEnv.DATABASE_PATH === undefined) {
    delete process.env.DATABASE_PATH;
  } else {
    process.env.DATABASE_PATH = originalEnv.DATABASE_PATH;
  }

  if (originalEnv.ADMIN_SECRET === undefined) {
    delete process.env.ADMIN_SECRET;
  } else {
    process.env.ADMIN_SECRET = originalEnv.ADMIN_SECRET;
  }

  if (originalEnv.RATE_LIMIT_WINDOW_MS === undefined) {
    delete process.env.RATE_LIMIT_WINDOW_MS;
  } else {
    process.env.RATE_LIMIT_WINDOW_MS = originalEnv.RATE_LIMIT_WINDOW_MS;
  }

  if (originalEnv.RATE_LIMIT_MAX === undefined) {
    delete process.env.RATE_LIMIT_MAX;
  } else {
    process.env.RATE_LIMIT_MAX = originalEnv.RATE_LIMIT_MAX;
  }
});

describe("getEnv", () => {
  it("uses schema defaults when NODE_ENV and PORT are missing", () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    process.env.DATABASE_PATH = "./data/defaults.db";
    process.env.ADMIN_SECRET = "secret-value";

    const env = getEnv();

    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_PATH).toBe("./data/defaults.db");
    expect(env.ADMIN_SECRET).toBe("secret-value");
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(env.RATE_LIMIT_MAX).toBe(10);
  });

  it("reads NODE_ENV and PORT from current process env", () => {
    process.env.NODE_ENV = "production";
    process.env.PORT = "4567";
    process.env.DATABASE_PATH = "./data/current-env.db";
    process.env.ADMIN_SECRET = "prod-secret";
    process.env.RATE_LIMIT_WINDOW_MS = "120000";
    process.env.RATE_LIMIT_MAX = "25";

    const env = getEnv();

    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(4567);
    expect(env.DATABASE_PATH).toBe("./data/current-env.db");
    expect(env.ADMIN_SECRET).toBe("prod-secret");
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(120000);
    expect(env.RATE_LIMIT_MAX).toBe(25);
  });

  it("throws on invalid environment variables", () => {
    expect(() =>
      getEnv({
        ADMIN_SECRET: "",
        DATABASE_PATH: ""
      })
    ).toThrowError(/Invalid environment variables/);
  });

  it("parses COMMUNITY_UPLOAD_DIR", () => {
    resetEnvCache();
    const env = getEnv({
      DATABASE_PATH: "/tmp/test.db",
      ADMIN_SECRET: "secret",
      COMMUNITY_UPLOAD_DIR: "/tmp/community",
    });

    expect(env.COMMUNITY_UPLOAD_DIR).toBe("/tmp/community");
    resetEnvCache();
  });

  it("defaults COMMUNITY_UPLOAD_DIR to data/community", () => {
    resetEnvCache();
    const env = getEnv({
      DATABASE_PATH: "/tmp/test.db",
      ADMIN_SECRET: "secret",
    });

    expect(env.COMMUNITY_UPLOAD_DIR).toBe("data/community");
    resetEnvCache();
  });
});
