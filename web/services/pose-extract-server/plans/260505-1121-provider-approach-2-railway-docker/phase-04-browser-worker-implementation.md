---
phase: 4
title: "Browser Worker Implementation"
status: pending
priority: P1
effort: "1.5d"
dependencies: [2,3]
---

# Phase 4: Browser Worker Implementation

## Overview
Build worker runtime that claims queued jobs, automates Gemini Web App through Playwright, and writes output artifacts with robust retry/timeout logic.

## Requirements
- Functional: Worker claims jobs atomically and prevents duplicate processing.
- Functional: Browser flow uploads input and captures output image only.
- Functional: Worker updates job status and error metadata.
- Non-functional: Restart-safe processing and stale-lock recovery.

## Architecture
Worker loop:
1. Poll queue.
2. Claim one job with lock.
3. Launch/reuse persistent browser context.
4. Execute extraction script.
5. Save output + mark success, or classify failure + retry/failed.

Browser automation boundaries:
- No scraping extra account data.
- Only interact with required UI elements to generate/download image.
- Session stored in `BROWSER_PROFILE_DIR` persistent path.

## Related Code Files
- Create: `src/worker/worker-main.ts`
- Create: `src/worker/job-processor.ts`
- Create: `src/worker/gemini-browser-client.ts`
- Create: `src/worker/browser-session.ts`
- Create: `src/worker/error-codes.ts`
- Modify: `package.json` scripts for worker start

## Implementation Steps
1. Implement dequeue+lock repository methods with transaction safety.
2. Implement Playwright bootstrap with persistent context and health checks.
3. Implement Gemini flow steps (upload -> prompt -> wait -> download).
4. Implement retry policy (bounded attempts + exponential backoff).
5. Implement stale lock reset for interrupted jobs.
6. Add structured logging and correlation by `jobId`.

## Success Criteria
- [ ] Worker processes queued jobs end-to-end in staging.
- [ ] Retry and timeout behavior visible and predictable.
- [ ] Duplicate processing avoided under restart/retry scenarios.

## Risk Assessment
- Risk: Gemini UI selector changes break flow.
  - Mitigation: Centralize selectors + fallback selectors + explicit error code.
- Risk: Browser memory/cpu pressure on Railway.
  - Mitigation: Start `WORKER_CONCURRENCY=1`, scale after telemetry.
