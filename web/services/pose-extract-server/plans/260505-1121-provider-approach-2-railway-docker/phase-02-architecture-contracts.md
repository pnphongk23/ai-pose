---
phase: 2
title: "Architecture & Contracts"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 2: Architecture & Contracts

## Overview
Define strict contracts between API and worker so each service can evolve independently without cross-service coupling.

## Requirements
- Functional: API enqueue response contract and status query contract are finalized.
- Functional: Worker claim/update contract and lock semantics are finalized.
- Non-functional: Idempotent state transitions and restart-safe processing.
- Non-functional: Env boundaries are explicit and service-local.

## Architecture
Components:
1. API service (`pose-extract-server` HTTP).
2. Worker process (same repo, separate runtime entrypoint).
3. Job DB table in Railway Postgres.
4. Persistent filesystem path for browser profile and artifacts.

Data contracts:
- Create job input: admin metadata + file reference.
- Status output: `jobId`, `status`, optional `result`, optional error.
- Worker heartbeat fields: `locked_by`, `locked_at`, `attempt_count`.

## Related Code Files
- Create: `src/queue/job-repository.ts`
- Create: `src/queue/job-types.ts`
- Create: `src/queue/job-status.ts`
- Create: `src/worker/worker-main.ts`
- Modify: `src/types/*.ts` (if existing job/result types)

## Implementation Steps
1. Define TypeScript job model and status enum.
2. Design DB schema + indexes for dequeue and stale lock reclaim.
3. Define API DTOs for enqueue and status endpoints.
4. Define worker processing contract including timeout and retry rules.
5. Define env contract doc-in-code (`env.ts` split for api/worker).

## Success Criteria
- [ ] API ↔ worker boundary is defined without direct code-level coupling.
- [ ] Job schema supports lock/retry/recovery.
- [ ] Contracts are stable enough to implement independently.

## Risk Assessment
- Risk: Contract ambiguity causes API/worker mismatch.
  - Mitigation: Freeze DTO and job-state definitions before phase 3.
- Risk: Coupling via shared implicit assumptions.
  - Mitigation: Explicit `job-types.ts` and repository interfaces only.
