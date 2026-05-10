---
phase: 5
title: "Public API & Mobile Contract"
status: pending
priority: P2
effort: "1h"
dependencies: [2, 3]
---

# Phase 5: Public API & Mobile Contract

## Overview

Expose `sourceImagePath` trong public API response (`GET /api/community/poses` và `GET /api/community/poses/:id`) và cập nhật docs API cho mobile team consume.

## Requirements

- Functional: Public API response bao gồm `sourceImagePath: string | null`.
- Functional: Backward compat — `imagePath` giữ nguyên (skeleton), app cũ không break.
- Functional: Docs `community-poses-api.md` cập nhật với field mới + hướng dẫn render dual-layer.

## Related Code Files

- Modify: `web/services/pose-extract-server/src/routes/communityRoutes.ts` — response serialization
- Modify: `docs/community-poses-api.md` — thêm field + mobile rendering guide

## Implementation Steps

1. **communityRoutes.ts** — Response đã tự map từ `CommunityStore.toRecord()`:
   - Nếu Phase 1 đã update `toRecord()` đúng → field `sourceImagePath` tự động xuất hiện trong response.
   - Verify bằng cách gọi `GET /api/community/poses` và check response JSON.

2. **community-poses-api.md** — Cập nhật Data Types:
   ```ts
   interface CommunityPose {
     id: string;
     name: string;
     imagePath: string;              // Skeleton image — use as overlay
     sourceImagePath: string | null; // NEW — Original photo — use as background
     thumbnailPath: string | null;
     tags: string[];
     difficulty: "beginner" | "intermediate" | "advanced" | null;
     description: string | null;
     bodyParts: string[];
     status: "draft" | "published";
     uploadedAt: string;
     downloadCount: number;
   }
   ```

3. **community-poses-api.md** — Thêm section "Mobile Rendering Guide":
   ```markdown
   ## Dual-Layer Rendering (Mobile)
   
   Each pose now provides two separate image layers:
   
   | Field | Purpose | Layer | Z-Index |
   |-------|---------|-------|---------|
   | `sourceImagePath` | Real photo of person posing | Background | 0 |
   | `imagePath` | Skeleton wireframe (PNG) | Overlay | 1 |
   
   ### Rendering Rules
   - If `sourceImagePath != null`: Render source as background, skeleton as overlay
   - If `sourceImagePath == null`: Fallback to skeleton on white background (legacy behavior)
   - Toggle button: Allow user to hide/show skeleton overlay
   
   ### Pose Library (Grid)
   - Card background = sourceImagePath (darkened 30%)
   - Skeleton overlay = imagePath (white wireframe, opacity 80%)
   
   ### Pose Detail
   - Full-size source image
   - Toggle button (top-right) to show/hide skeleton
   - Long-press to peek skeleton overlay
   ```

4. **Admin API response** — Verify `GET /api/admin/community/poses` cũng trả `sourceImagePath`.

## Success Criteria

- [ ] `GET /api/community/poses` response chứa `sourceImagePath` field
- [ ] `GET /api/community/poses/:id` response chứa `sourceImagePath` field
- [ ] `sourceImagePath = null` cho poses không có ảnh gốc (backward compat)
- [ ] Docs `community-poses-api.md` cập nhật đầy đủ
- [ ] Mobile team có đủ thông tin để implement dual-layer UI

## Risk Assessment

- Risk: Mobile app parse lỗi khi gặp field mới unexpected.
  Mitigation: `sourceImagePath` là nullable — JSON parsers (Swift Codable, Kotlin Moshi/Gson) sẽ ignore unknown fields hoặc decode null an toàn.
