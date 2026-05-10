---
phase: 1
title: "Schema Migration"
status: pending
priority: P1
effort: "30m"
dependencies: []
---

# Phase 1: Schema Migration

## Overview

Thêm cột `source_image_path TEXT` (nullable) vào bảng `community_poses` và cập nhật `CommunityStore` TypeScript types + queries để đọc/ghi field mới.

## Requirements

- Functional: DB chấp nhận `source_image_path` nullable cho cả record cũ lẫn mới.
- Functional: `CommunityStore.createPose()` nhận và persist `sourceImagePath`.
- Functional: `CommunityStore.toRecord()` map `source_image_path` → `sourceImagePath`.
- Non-functional: Migration không gây downtime, không rebuild table.

## Architecture

SQLite `ALTER TABLE ... ADD COLUMN` với giá trị mặc định `NULL` — không cần rebuild table, không lock, tương thích production.

## Related Code Files

- Modify: `web/services/pose-extract-server/src/db/schema.sql` — thêm ALTER TABLE
- Modify: `web/services/pose-extract-server/src/db/communityStore.ts` — types + queries

## Implementation Steps

1. **schema.sql** — Thêm migration statement:
   ```sql
   ALTER TABLE community_poses ADD COLUMN source_image_path TEXT;
   ```
   Lưu ý: SQLite không hỗ trợ `IF NOT EXISTS` cho `ALTER TABLE ADD COLUMN`. Cần wrap trong try-catch hoặc dùng `PRAGMA table_info` để check trước.

2. **communityStore.ts** — Cập nhật interfaces:
   ```ts
   // CommunityPoseRecord
   sourceImagePath: string | null;
   
   // CreatePoseInput
   sourceImagePath: string | null;
   
   // CommunityPoseRow
   source_image_path: string | null;
   ```

3. **communityStore.ts** — Cập nhật `createPose()` INSERT:
   ```sql
   INSERT INTO community_poses
     (id, name, image_path, thumbnail_path, tags, difficulty, description, body_parts, status, source_image_path)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ```

4. **communityStore.ts** — Cập nhật `toRecord()`:
   ```ts
   sourceImagePath: row.source_image_path,
   ```

5. **Test**: Chạy existing tests (`communityStore.test.ts`) — đảm bảo không break.

## Success Criteria

- [ ] `ALTER TABLE` chạy thành công trên DB hiện tại (production SQLite)
- [ ] `createPose()` với `sourceImagePath: "https://..."` → persist đúng
- [ ] `createPose()` với `sourceImagePath: null` → persist NULL (backward compat)
- [ ] `getPoseById()` / `listPoses()` trả về `sourceImagePath` field
- [ ] Existing tests pass

## Risk Assessment

- Risk: SQLite `ALTER TABLE ADD COLUMN` fail nếu column đã tồn tại (re-run migration).
- Mitigation: Dùng `PRAGMA table_info(community_poses)` check column existence trước khi ALTER, hoặc wrap trong try-catch ignore "duplicate column" error.
