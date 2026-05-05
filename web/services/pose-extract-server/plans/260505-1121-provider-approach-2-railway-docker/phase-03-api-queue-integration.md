---
phase: 3
title: "API Queue Integration"
status: pending
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 3: API Queue Integration

## Overview
Refactor admin/community upload flow from synchronous extract to asynchronous enqueue flow while preserving admin auth and validation boundaries.

## Requirements
- Functional: `POST /api/admin/community/poses` stores input and enqueues job.
- Functional: New status endpoint returns processing state and result metadata.
- Functional: Existing admin auth remains enforced.
- Non-functional: Upload handling resilient to malformed multipart and oversized files.

## Architecture
API pipeline:
1. Validate admin bearer token.
2. Validate multipart payload + metadata.
3. Store input artifact to configured path.
4. Insert `queued` job row.
5. Return `202 {jobId, status}`.

Status pipeline:
1. Validate admin auth.
2. Fetch job by id.
3. Return normalized status payload.

## Related Code Files
- Modify: `src/routes/extractPoseRoutes.ts`
- Modify: `src/services/*` extraction call site to enqueue instead
- Create: `src/routes/jobStatusRoutes.ts`
- Create: `src/storage/artifact-store.ts`
- Modify: `src/app.ts` route registration
- Modify: `src/config/env.ts`

## Implementation Steps
1. Add artifact store utility for input file persistence.
2. Replace direct `geminiService.extractPoseImage()` call with job enqueue call.
3. Implement status endpoint and map DB state to API response.
4. Add strict error taxonomy for enqueue flow (`INVALID_FILE`, `UNAUTHORIZED`, `QUEUE_WRITE_FAILED`).
5. Update integration tests for `202` asynchronous behavior.

## Success Criteria
- [ ] Upload endpoint returns `202` with `jobId`.
- [ ] No direct provider call in request-response path.
- [ ] Status endpoint accurately reflects DB state transitions.

## Risk Assessment
- Risk: Breaking existing admin UI assumptions expecting immediate result.
  - Mitigation: Return backward-compatible fields plus `status` and document polling behavior.
- Risk: Artifact write failures cause silent job corruption.
  - Mitigation: Fail fast before enqueue if file persistence fails.
