---
title: "admin-community-multipart-sync-extract"
description: "Chuyển flow admin community upload sang multipart sync: frontend gửi file+metadata, backend extract ngay rồi mới tạo pose (all-or-nothing)."
status: pending
priority: P1
branch: "develop"
tags: ["admin", "community", "multipart", "extract", "railway"]
blockedBy: []
blocks: []
created: "2026-05-05T01:41:17.749Z"
createdBy: "ck:plan"
source: skill
---

# admin-community-multipart-sync-extract

## Overview
Mục tiêu: bỏ flow presigned upload-url + metadata riêng lẻ. `/admin/community` sẽ gửi 1 request multipart chứa image + metadata vào backend admin route; backend validate file, gọi extract API sync, chỉ tạo community pose khi extract thành công.

## Scope
- In-scope: admin upload flow, Next API proxy multipart pass-through, backend admin route orchestration, validation + tests.
- Out-of-scope: queue/background worker, async polling UI, retry orchestration phức tạp, thay đổi schema DB lớn.

## Existing code anchors
- Frontend submit JSON metadata-only: `src/app/admin/community/page.js:71`
- Next proxy chỉ nhận JSON: `src/app/api/admin/community/poses/route.js:13`
- Proxy helper auto-set JSON header/body stringify: `src/lib/poseExtractAdminServer.js:38`
- Backend admin route hiện dùng `fileKey` + objectExists: `services/pose-extract-server/src/routes/adminCommunityRoutes.ts:79`
- Extract route hiện nhận multipart field `image`: `services/pose-extract-server/src/routes/extractPoseRoutes.ts:69`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Contract](./phase-01-contract.md) | Pending |
| 2 | [Frontend](./phase-02-frontend.md) | Pending |
| 3 | [NextProxy](./phase-03-nextproxy.md) | Pending |
| 4 | [BackendRoute](./phase-04-backendroute.md) | Pending |
| 5 | [ValidationTests](./phase-05-validationtests.md) | Pending |
| 6 | [Rollout](./phase-06-rollout.md) | Pending |

## Phase dependencies
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1
- Phase 4 depends on Phase 1 and Phase 3
- Phase 5 depends on Phase 2, 3, 4
- Phase 6 depends on Phase 5

## Deliverables
- 1 endpoint contract rõ ràng cho multipart upload sync.
- Frontend submit `FormData` với UX lỗi/thành công rõ.
- Next proxy forward multipart stream đúng headers/auth.
- Backend route xử lý all-or-nothing.
- Test + runbook deploy/rollback an toàn trên Railway.

## Risks
- Timeout extract làm request admin treo lâu.
- Memory pressure nếu giữ ảnh trong RAM end-to-end.
- Sai lệch field names giữa FE/proxy/BE (`image`, `tags[]`, `bodyParts[]`).
- Regression từ flow cũ dùng `upload-url`.

## Mitigation
- Giới hạn size/mime từ cả FE và BE, timeout hard cap.
- Ưu tiên streaming/pass-through thay vì serialize base64 tại proxy.
- Chuẩn hóa contract và test integration.
- Giữ backward compatibility ngắn hạn route cũ nếu cần (chỉ nếu thật sự phải support song song trong rollout).