---
phase: 1
title: "Contract"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Contract

## Overview
Chốt API contract multipart thống nhất FE → Next proxy → Backend admin route, để loại bỏ ambiguity trước khi code.

## Requirements
- Functional: nhận 1 request multipart chứa file image + metadata pose.
- Functional: backend extract sync, extract fail thì không tạo pose.
- Non-functional: giới hạn file size/mime; timeout rõ ràng; error schema ổn định.

## Architecture
- Client gửi `FormData` fields:
  - `image` (file)
  - `name` (string)
  - `tags` (JSON string array hoặc csv chuẩn hóa)
  - `difficulty` (beginner|intermediate|advanced)
  - `bodyParts` (JSON string array)
  - `description` (optional)
  - `status` (draft|published)
- Next route nhận multipart, forward tới backend `/api/admin/community/poses` bằng auth bearer hiện có.
- Backend admin route:
  1) validate multipart
  2) gọi extract nội bộ/service
  3) upload extracted artifact (nếu business cần)
  4) create pose trong store
  5) trả payload pose

## Related Code Files
- Modify: `src/app/admin/community/page.js`
- Modify: `src/app/api/admin/community/poses/route.js`
- Modify: `src/lib/poseExtractAdminServer.js`
- Modify: `services/pose-extract-server/src/routes/adminCommunityRoutes.ts`

## Implementation Steps
1. Chốt format từng field và normalize rule cho list fields (`tags`, `bodyParts`).
2. Chốt error response envelope (code/message) theo style hiện tại.
3. Chốt timeout budget tổng (ví dụ 20s proxy + 15s backend extract window).
4. Chốt backward strategy cho route cũ `/upload-url` (deprecate ngay hoặc giữ tạm).

## Success Criteria
- [ ] Có contract text rõ ràng, dev frontend/backend implement không đoán.
- [ ] Field names đồng nhất giữa 3 tầng.
- [ ] Error cases chính có code cụ thể (BAD_REQUEST, TIMEOUT, EXTRACT_FAILED).

## Risk Assessment
- Risk: mismatch field format gây lỗi parse.
- Mitigation: parse thống nhất bằng helper, test integration ngay phase 5.