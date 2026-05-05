import type { NextFunction, Request, Response } from "express";

interface AdminRateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  cleanupEveryRequests?: number;
  nowProvider?: () => number;
  keyProvider?: (req: Request) => string;
  onSweep?: (activeCounters: number) => void;
}

interface CounterEntry {
  count: number;
  startedAtMs: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 30;
const DEFAULT_CLEANUP_EVERY_REQUESTS = 100;

function tooManyRequests(res: Response): void {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many admin requests"
    }
  });
}

export function createAdminRateLimitMiddleware(options: AdminRateLimitOptions = {}) {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const cleanupEveryRequests = Math.max(options.cleanupEveryRequests ?? DEFAULT_CLEANUP_EVERY_REQUESTS, 1);
  const nowProvider = options.nowProvider ?? Date.now;
  const keyProvider = options.keyProvider ?? ((req: Request) => req.ip || "unknown");
  const onSweep = options.onSweep;
  const counters = new Map<string, CounterEntry>();
  let seenRequests = 0;

  const sweepExpiredCounters = (now: number): void => {
    for (const [key, counter] of counters.entries()) {
      if (now - counter.startedAtMs >= windowMs) {
        counters.delete(key);
      }
    }
    onSweep?.(counters.size);
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = nowProvider();
    seenRequests += 1;
    if (seenRequests % cleanupEveryRequests === 0) {
      sweepExpiredCounters(now);
    }

    const key = keyProvider(req);
    const existing = counters.get(key);

    if (!existing || now - existing.startedAtMs >= windowMs) {
      counters.set(key, { count: 1, startedAtMs: now });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      tooManyRequests(res);
      return;
    }

    next();
  };
}
