---
phase: 1
title: "Research"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Research

## Overview
Lock down provider approach constraints and operational assumptions before coding to avoid rework. Focus on browser automation reliability, queue semantics, and Railway runtime constraints.

## Requirements
- Functional: Confirm extraction path using Gemini Web App automation is viable with persistent login profile.
- Functional: Confirm queue contract and job lifecycle fields.
- Non-functional: Keep design minimal (YAGNI), avoid introducing extra services unless needed.
- Non-functional: Security baseline for secrets and output artifact handling.

## Architecture
Research delivers implementation guardrails, not runtime code. Output should specify: browser session strategy, queue locking strategy, failure taxonomy, and deployment topology (API service + worker service + DB + volume).

## Related Code Files
- Modify: `src/routes/extractPoseRoutes.ts`
- Modify: `src/app.ts`
- Modify: `src/index.ts`
- Read: `Dockerfile`
- Read: `railway.toml`
- Read: `package.json`

## Implementation Steps
1. Review current extraction flow and identify synchronous assumptions that conflict with queue model.
2. Define target job lifecycle (`queued -> processing -> succeeded|failed|retrying`) with retry caps.
3. Capture browser automation constraints: selector fragility, timeout windows, and login/session persistence model.
4. Define artifact policy: input/output paths, retention window, and cleanup ownership.
5. Define minimal observability set: structured logs by `jobId`, error codes, and stuck-job detection.

## Success Criteria
- [ ] Research notes produce explicit go/no-go constraints for browser worker.
- [ ] Queue state model and retry policy are unambiguous.
- [ ] Security and ops constraints for Railway+Docker are documented.

## Risk Assessment
- Risk: Browser automation assumptions drift from real UI behavior.
  - Mitigation: Plan selector abstraction and fallback strategy from start.
- Risk: Over-research delaying implementation.
  - Mitigation: Cap this phase to decisions that unblock phases 2-4 only.
