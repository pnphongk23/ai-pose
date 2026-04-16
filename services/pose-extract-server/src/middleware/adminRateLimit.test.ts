import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";

import { createAdminRateLimitMiddleware } from "./adminRateLimit";

interface MiddlewareResult {
  statusCode: number | null;
  nextCalled: boolean;
  errorCode: string | null;
}

function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>
): MiddlewareResult {
  let statusCode: number | null = null;
  let errorCode: string | null = null;
  let nextCalled = false;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: { error?: { code?: string } }) {
      errorCode = payload.error?.code ?? null;
      return this;
    }
  } as unknown as Response;

  const next = () => {
    nextCalled = true;
  };

  middleware(req as Request, res, next);
  return { statusCode, nextCalled, errorCode };
}

describe("createAdminRateLimitMiddleware", () => {
  it("keeps current rate-limit behavior", () => {
    const middleware = createAdminRateLimitMiddleware({
      maxRequests: 2,
      windowMs: 10_000
    });

    const first = runMiddleware(middleware, { ip: "10.0.0.1" });
    const second = runMiddleware(middleware, { ip: "10.0.0.1" });
    const third = runMiddleware(middleware, { ip: "10.0.0.1" });

    expect(first.nextCalled).toBe(true);
    expect(second.nextCalled).toBe(true);
    expect(third.nextCalled).toBe(false);
    expect(third.statusCode).toBe(429);
    expect(third.errorCode).toBe("RATE_LIMITED");
  });

  it("evicts expired counters during sweep to prevent unbounded growth", () => {
    let now = 1_000;
    const sweepSizes: number[] = [];
    const middleware = createAdminRateLimitMiddleware({
      windowMs: 100,
      maxRequests: 1,
      cleanupEveryRequests: 1,
      nowProvider: () => now,
      keyProvider: (req) => String(req.headers?.["x-test-key"] ?? "unknown"),
      onSweep: (activeCounters) => sweepSizes.push(activeCounters)
    });

    runMiddleware(middleware, { headers: { "x-test-key": "ip-a" } });
    runMiddleware(middleware, { headers: { "x-test-key": "ip-b" } });
    expect(sweepSizes.at(-1)).toBe(1);

    now = 1_300;
    runMiddleware(middleware, { headers: { "x-test-key": "ip-c" } });
    expect(sweepSizes.at(-1)).toBe(0);

    runMiddleware(middleware, { headers: { "x-test-key": "ip-d" } });
    expect(sweepSizes.at(-1)).toBe(1);
  });
});
