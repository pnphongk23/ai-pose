---
phase: 3
title: "EnvBoundary"
status: pending
priority: P1
effort: "2h"
dependencies: [2]
---

# Phase 3: EnvBoundary

## Overview
Tách env theo service boundary để loại coupling sai scope giữa web và backend.

## Requirements
- Functional: `web/admin-ui/.env.local` chỉ web/proxy vars.
- Functional: `web/services/pose-extract-server/.env` chỉ backend vars.
- Non-functional: không để secrets backend tồn tại ở web env.

## Architecture
- Web reads only UI/BFF vars.
- Backend reads only service vars via local `.env` + Railway service vars.

## Related Code Files
- Modify: `web/admin-ui/.env.local`
- Modify: `web/services/pose-extract-server/.env`
- Modify: `web/services/pose-extract-server/.env.example`
- Modify: run scripts/docs references to env paths

## Implementation Steps
1. Dọn web env: giữ `POSE_EXTRACT_SERVER_URL`, `POSE_EXTRACT_ADMIN_SECRET`, web-only tokens.
2. Dọn backend env: `ADMIN_SECRET`, `DATABASE_PATH`, `R2_*`, `RATE_LIMIT_*`, `COMMUNITY_UPLOAD_DIR`.
3. Verify Next proxy still authenticates backend correctly.
4. Add quick lint check script for forbidden key leakage (optional).

## Success Criteria
- [ ] Web env không chứa backend runtime keys (DB/R2 secrets).
- [ ] Backend env đủ keys theo schema.
- [ ] Local request admin->backend không 401 vì scope mismatch.

## Risk Assessment
Risk: 401/500 do thiếu biến sau split.
Mitigation: run startup checks ngay sau split + explicit env validation.