---
phase: 4
title: "BackendRoute"
status: pending
priority: P1
effort: "6h"
dependencies: [1,3]
---

# Phase 4: BackendRoute

## Overview
Refactor backend admin community POST để nhận multipart file thật, extract sync, rồi mới tạo pose (all-or-nothing).

## Requirements
- Functional: parse `image` + metadata từ multipart.
- Functional: call extract process ngay trong request lifecycle.
- Functional: chỉ `communityStore.createPose` khi extract thành công.
- Non-functional: validate mime/size; timeout rõ; error code rõ.

## Architecture
- Reuse pattern multer memoryStorage từ `extractPoseRoutes.ts`.
- Thêm upload middleware cho admin route POST `/api/admin/community/poses`.
- Flow:
  1) auth
  2) upload middleware + validate
  3) normalize metadata
  4) call extract (reuse service/router-level abstraction phù hợp)
  5) build final image path / optional extracted key
  6) create pose
  7) response 201

## Related Code Files
- Modify: `services/pose-extract-server/src/routes/adminCommunityRoutes.ts`
- Modify: `services/pose-extract-server/src/services/r2Storage.ts` (nếu cần helper upload extracted)
- Optional modify: `services/pose-extract-server/src/routes/extractPoseRoutes.ts` (nếu tách shared extract helper)

## Implementation Steps
1. Thay schema body JSON bằng multipart parsing cho POST `/`.
2. Validate file:
   - required
   - mime allowlist (jpeg/png/webp theo contract)
   - size cap (ví dụ 10MB).
3. Parse metadata strings thành typed values (`tags`, `bodyParts`, enums).
4. Gọi extract service sync.
5. Nếu extract fail: trả lỗi, không ghi DB.
6. Nếu extract success: ghi storage/path cần thiết + create pose.
7. Trả payload giống shape list/admin hiện có để FE không cần đổi nhiều.

## Success Criteria
- [ ] POST multipart tạo pose thành công khi extract success.
- [ ] Extract fail => không có record mới trong DB.
- [ ] Response codes/message ổn định theo contract.

## Risk Assessment
- Risk: memory overhead do multer memoryStorage.
- Mitigation: size cap cứng + timeout + cân nhắc stream/upload trực tiếp nếu tải cao (không làm ở scope hiện tại).
- Risk: route cũ `/upload-url` còn tồn tại gây confusion.
- Mitigation: đánh dấu deprecated rõ trong code/test + roadmap removal.