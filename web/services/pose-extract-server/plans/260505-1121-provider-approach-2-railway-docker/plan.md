---
title: "provider approach 2 queue browser worker railway docker"
description: "Implement queue-based browser worker extraction pipeline for admin/community direct upload flow using Railway + Docker"
status: completed
priority: P1
branch: "develop"
tags: [provider, queue, browser-worker, railway, docker]
blockedBy: []
blocks: []
created: "2026-05-05T04:21:42.497Z"
createdBy: "ck:plan"
source: skill
---

# provider approach 2 queue browser worker railway docker

## Overview
Implement provider approach 2: API receives image+metadata from `/admin/community`, enqueues extraction job, and browser worker pool executes Gemini Web App automation to produce output image. Deploy as split services on Railway with Docker while keeping boundaries strict between admin UI, API, queue state, and worker runtime.

## Scope
- In scope: queue schema, API enqueue/status endpoints, worker claim/process/retry, Playwright-based browser flow, Docker images, Railway runtime wiring, rollout and verification.
- Out of scope: multi-provider plugin framework, user-facing OAuth management UI, full autoscaling optimizer, historical migration of old extraction jobs.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research](./phase-01-research.md) | Completed |
| 2 | [Architecture & Contracts](./phase-02-architecture-contracts.md) | Completed |
| 3 | [API Queue Integration](./phase-03-api-queue-integration.md) | Completed |
| 4 | [Browser Worker Implementation](./phase-04-browser-worker-implementation.md) | Completed |
| 5 | [Docker & Railway Deployment](./phase-05-docker-railway-deployment.md) | Completed |
| 6 | [Testing & Rollout](./phase-06-testing-rollout.md) | Completed |

## Dependencies
- No hard cross-plan dependency detected in current project scope.
- Optional coordination: prior admin UI deploy task to ensure endpoint URLs and secrets are aligned.

## Success Definition
- `/api/admin/community/poses` returns `202` with `jobId` for valid upload.
- Worker completes extraction and stores output with status transitions observable.
- Railway deployment stable with restart-safe queue semantics and persistent browser profile.
- Throughput target supports >30 jobs/hour in staging smoke scenario.
