---
title: "dual-layer-pose-source-image"
description: "Thêm source_image_path vào mỗi Pose để hỗ trợ dual-layer UI trên mobile (ảnh gốc làm background + skeleton làm overlay toggleable). Admin upload 1 ảnh, system tự lưu cả 2 path vào DB."
status: pending
priority: P1
branch: "main"
tags: ["feature", "admin", "community", "dual-layer", "r2", "schema", "mobile-ui"]
blockedBy: ["260505-0840-admin-community-multipart-sync-extract"]
blocks: []
created: "2026-05-10T10:27:26.287Z"
createdBy: "ck:plan"
source: skill
---

# dual-layer-pose-source-image

## Overview

**Problem:** Màn hình Pose Library/Detail trên mobile app hiện hiển thị stickman skeleton trên nền trắng — user không hình dung được "vibe" của pose, không có cảm hứng để thử.

**Solution:** Mỗi Pose cần lưu **2 ảnh riêng biệt**:
1. `source_image_path` — Ảnh gốc người thật (background layer)
2. `image_path` — Skeleton PNG đã extract (overlay layer)

Mobile app render 2 layer chồng nhau với nút toggle để ẩn/hiện skeleton. Admin chỉ cần upload 1 ảnh gốc — system tự xử lý phần còn lại.

## Context (từ Brainstorm)

- **Hiện trạng:** DB `community_poses` chỉ có `image_path` (skeleton). Ảnh gốc bị vứt bỏ sau extraction. R2 chỉ lưu 1 file/pose.
- **Thay đổi cốt lõi:** Thêm cột `source_image_path TEXT` (nullable) vào `community_poses`. Upload ảnh gốc lên R2 `source/` prefix ngay khi admin submit. Worker upload skeleton lên R2 `source/` → `skeleton/` prefix.
- **Backward compat:** `image_path` giữ nguyên = skeleton. App cũ không break. Khi `source_image_path = NULL` → mobile fallback về nền trắng như cũ.

## R2 Structure

```
community/
  source/<uuid>.<ext>      ← ảnh gốc (người thật)  [NEW]
  skeleton/<uuid>.png      ← ảnh khung xương       [NEW — thay vì community/<uuid>.png]
```

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Schema Migration](./phase-01-schema-migration.md) | Pending | 30m |
| 2 | [Backend Pipeline](./phase-02-backend-pipeline.md) | Pending | 3h |
| 3 | [Worker Upload](./phase-03-worker-upload.md) | Pending | 2h |
| 4 | [Admin UI](./phase-04-admin-ui.md) | Pending | 2h |
| 5 | [Public API & Mobile Contract](./phase-05-public-api-mobile-contract.md) | Pending | 1h |

## Phase Dependencies

- Phase 2 depends on Phase 1 (cần schema mới để persist `source_image_path`)
- Phase 3 depends on Phase 2 (worker cần biết skeleton path prefix mới)
- Phase 4 depends on Phase 2 (UI hiển thị trạng thái từ response mới)
- Phase 5 depends on Phase 2 + 3 (API expose cả 2 field khi cả 2 path sẵn sàng)

## Cross-Plan Dependencies

- **Blocked by** `260505-0840-admin-community-multipart-sync-extract`: Plan này thay đổi `adminCommunityRoutes.ts` và `communityStore`. Plan hiện tại cần merge/land trước để tránh conflict, hoặc implement song song trên branch riêng và merge sau.

## Deliverables

1. Schema có cột `source_image_path` (nullable, backward compat)
2. Admin upload 1 ảnh → DB lưu `source_image_path` ngay lập tức
3. Worker extract xong → upload skeleton lên R2 `skeleton/` → update `image_path`
4. Admin UI hiển thị dual-image preview + badge trạng thái
5. Public API response thêm `sourceImagePath` field (nullable)
6. Docs: cập nhật `community-poses-api.md` với field mới

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Conflict với plan multipart-sync-extract | High | Implement trên branch riêng, merge sau khi plan kia land |
| R2 storage tăng ~2x | Medium | Acceptable với volume hiện tại; xem xét lifecycle rule sau |
| Worker fail sau khi source đã upload | Medium | `source_image_path` lưu ngay, `image_path` = null khi pending; UI hiển thị "Extracting..." |
| SQLite ALTER TABLE trên production | Low | SQLite hỗ trợ ADD COLUMN nullable — không rebuild table |
