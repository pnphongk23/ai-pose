import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";

import { createExtractRateLimitMiddleware } from "./extractRateLimit";

function createReq(ip: string): Request {
  return { ip } as Request;
}

describe("createExtractRateLimitMiddleware", () => {
  it("sweeps expired counters to avoid unbounded map growth", () => {
    let now = 0;
    const activeCounters: number[] = [];
    const middleware = createExtractRateLimitMiddleware({
      windowMs: 10,
      maxRequests: 1,
      cleanupEveryRequests: 3,
      nowProvider: () => now,
      keyProvider: (req) => req.ip || "unknown",
      onSweep: (size) => activeCounters.push(size)
    });

    const response = {} as Response;
    const nextCalls: unknown[] = [];
    const next: NextFunction = (error?: unknown) => {
      nextCalls.push(error);
    };

    middleware(createReq("ip-a"), response, next);
    middleware(createReq("ip-b"), response, next);
    expect(activeCounters).toHaveLength(0);

    now = 11;
    middleware(createReq("ip-c"), response, next);
    expect(activeCounters.at(-1)).toBe(0);
    expect(nextCalls).toHaveLength(3);
    expect(nextCalls.every((item) => item === undefined)).toBe(true);
  });
});
