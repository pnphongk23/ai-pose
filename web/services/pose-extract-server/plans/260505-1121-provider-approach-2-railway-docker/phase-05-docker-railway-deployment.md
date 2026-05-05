---
phase: 5
title: "Docker & Railway Deployment"
status: pending
priority: P1
effort: "1d"
dependencies: [3,4]
---

# Phase 5: Docker & Railway Deployment

## Overview
Package and deploy API + worker as separate Railway services with Docker, persistent storage, and environment isolation.

## Requirements
- Functional: Build reproducible Docker images for api and worker runtimes.
- Functional: Railway services wired to same Postgres and required secrets.
- Functional: Persistent volume mounted for browser profile/artifacts.
- Non-functional: Health checks and restart behavior are safe.

## Architecture
Deployment topology:
- Service A: API (HTTP).
- Service B: Worker (background process).
- Shared: Postgres.
- Volume: worker `/data` (and API if result-serving requires it).

Env split:
- API env only includes HTTP/admin and enqueue configs.
- Worker env includes browser runtime/session configs.

## Related Code Files
- Modify: `Dockerfile` (multi-target or split strategy)
- Modify: `.dockerignore`
- Modify: `railway.toml` (if used for build/run settings)
- Create: `scripts/start-worker.ts` or equivalent entry script
- Modify: `package.json` scripts

## Implementation Steps
1. Define Docker build target(s): `api` and `worker`.
2. Install Playwright/Chromium deps only in worker image.
3. Add container healthcheck and startup command separation.
4. Configure Railway service variables and volume mounts.
5. Execute staging deploy and verify service logs + connectivity.

## Success Criteria
- [ ] Both services deploy successfully on Railway.
- [ ] Worker can persist session profile across restarts.
- [ ] API and worker share queue state correctly.

## Risk Assessment
- Risk: Image too large or boot too slow.
  - Mitigation: Slim base image, layer caching, install minimal browser deps.
- Risk: Misconfigured env causes auth/queue failures.
  - Mitigation: explicit env checklist and startup validation.
