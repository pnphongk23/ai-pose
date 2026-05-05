---
phase: 5
title: "ValidationTests"
status: pending
priority: P1
effort: "4h"
dependencies: [2,3,4]
---

# Phase 5: ValidationTests

## Overview
Bổ sung test và checklist verify để đảm bảo flow mới chạy đúng và không regress.

## Requirements
- Functional: test happy path multipart end-to-end ở backend route.
- Functional: test fail path (mime sai, thiếu file, extract fail).
- Non-functional: đảm bảo no-create-on-fail bằng assert DB count.

## Architecture
- Unit/integration ở backend bằng vitest + supertest.
- Frontend/manual verification qua `/admin/community` UI.

## Related Code Files
- Modify: `services/pose-extract-server/src/routes/adminCommunityRoutes.test.ts`
- Optional modify: `src/app/admin/community/page.js` (nếu cần instrumentation nhỏ cho debug)

## Implementation Steps
1. Thêm test POST multipart success (`attach('image', ...)` + fields).
2. Thêm test thiếu image => 400.
3. Thêm test mime invalid => 400.
4. Mock extract fail => assert status lỗi + DB không tăng record.
5. Chạy:
   - Backend: `npm test` tại `services/pose-extract-server`
   - Frontend: `npm run build` tại root.
6. Manual test UI upload thực tế trên local hoặc Railway environment.

## Success Criteria
- [ ] Test backend mới pass.
- [ ] Build frontend pass.
- [ ] Manual flow `/admin/community` upload thành công với ảnh thật.
- [ ] Manual fail cases hiển thị lỗi đúng.

## Risk Assessment
- Risk: flaky tests do mock extract service.
- Mitigation: giữ mock deterministic, assert theo error code thay vì message động.