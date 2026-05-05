---
phase: 5
title: "Verification"
status: pending
priority: P1
effort: "3h"
dependencies: [4]
---

# Phase 5: Verification

## Overview
Thực hiện full regression checks sau migrate: backend, web, local integration, KMP path.

## Requirements
- Functional: backend tests pass.
- Functional: web build pass.
- Functional: local run backend + admin UI + smoke upload flow pass.
- Functional: KMP path check không regress.

## Architecture
Verification matrix theo lane:
- Web lane
- Backend lane
- Cross-lane integration
- Mobile lane path/build sanity

## Related Code Files
- Modify: test scripts/wrappers if needed
- No business logic change target

## Implementation Steps
1. Run backend tests:
   - `npm --prefix web/services/pose-extract-server test`
2. Run web build:
   - `npm --prefix web/admin-ui run build`
3. Run local servers:
   - backend dev + web dev.
4. Smoke `/admin/community` upload flow.
5. KMP sanity:
   - gradle module resolution check / assemble minimal target.
6. Compare with baseline and sign off.

## Success Criteria
- [ ] Backend tests pass 100%.
- [ ] Web build pass.
- [ ] Upload smoke test pass.
- [ ] KMP path resolution pass.

## Risk Assessment
Risk: hidden path regression chỉ lộ khi CI/deploy.
Mitigation: chạy command matrix gần với CI nhất có thể.