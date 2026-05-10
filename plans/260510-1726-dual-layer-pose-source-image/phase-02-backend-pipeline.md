---
phase: 2
title: "Backend Pipeline"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Backend Pipeline

## Overview

Sửa admin route `POST /api/admin/community/poses` để upload ảnh gốc lên R2 (`source/` prefix) trước khi enqueue extraction job. Lưu `source_image_path` vào DB ngay lập tức. Skeleton path sẽ được update bởi Worker (Phase 3).

## Requirements

- Functional: Admin upload 1 ảnh → ảnh gốc được lưu lên R2 `community/source/<uuid>.<ext>`.
- Functional: DB record có `source_image_path` = R2 public URL ngay sau khi tạo.
- Functional: `image_path` (skeleton) có thể = null ban đầu nếu extraction chưa xong (sẽ được worker update).
- Non-functional: Không break existing upload flow; backward compat với response format hiện tại.

## Architecture

```
Admin POST multipart(image + metadata)
  │
  ├─[1] Upload ảnh gốc → R2 community/source/<uuid>.<ext>
  │     → sourceImagePath = buildPublicUrl(r2PublicUrl, sourceFileKey)
  │
  ├─[2] Enqueue extraction job (base64 từ req.file.buffer)
  │     → jobId, jobStatus
  │
  └─[3] createPose({
           sourceImagePath,
           imagePath: null,     ← skeleton chưa có, worker sẽ update
           ...metadata
         })
         → Response 202: { data: { pose, jobId, status } }
```

## Related Code Files

- Modify: `web/services/pose-extract-server/src/routes/adminCommunityRoutes.ts` — upload source + pass sourceImagePath
- Modify: `web/services/pose-extract-server/src/services/r2Storage.ts` — thêm function `uploadBuffer()` (upload trực tiếp từ buffer, không qua presigned URL)
- Modify: `web/services/pose-extract-server/src/db/communityStore.ts` — (đã xong ở Phase 1)

## Implementation Steps

1. **r2Storage.ts** — Thêm `uploadBuffer()`:
   ```ts
   export async function uploadBuffer(input: {
     fileKey: string;
     buffer: Buffer;
     mimeType: string;
   }): Promise<void> {
     const env = getEnv();
     await getR2Client().send(
       new PutObjectCommand({
         Bucket: env.R2_BUCKET,
         Key: input.fileKey,
         Body: input.buffer,
         ContentType: input.mimeType,
       })
     );
   }
   ```

2. **adminCommunityRoutes.ts** — Sửa `POST /` handler:
   ```ts
   // Sau khi validate metadata...
   
   // [1] Upload source image trực tiếp lên R2
   const sourceFileKey = `community/source/${randomUUID()}${ext}`;
   await uploadBuffer({
     fileKey: sourceFileKey,
     buffer: req.file.buffer,
     mimeType: req.file.mimetype,
   });
   const sourceImagePath = buildPublicUrl(r2PublicUrl, sourceFileKey);
   
   // [2] Enqueue extraction job (giữ nguyên)
   const job = jobStore.enqueue({
     sourceImageBase64: req.file.buffer.toString("base64"),
     sourceMimeType: req.file.mimetype,
   });
   
   // [3] Create pose with sourceImagePath, imagePath = null (pending)
   const pose = communityStore.createPose({
     name,
     imagePath: "",       // Placeholder, worker sẽ update
     sourceImagePath,     // NEW — ảnh gốc URL
     thumbnailPath: null,
     tags, difficulty, description, bodyParts, status,
   });
   ```

3. **adminCommunityRoutes.ts** — Thêm `community_pose_id` vào extraction job để worker biết update pose nào:
   - **Option A (simple)**: Thêm column `pose_id` vào `extraction_jobs` table
   - **Option B (no schema change)**: Dùng naming convention — fileKey chứa pose ID, worker lookup theo convention
   - **Recommended**: Option A — rõ ràng, truy vấn dễ

4. **extraction_jobs schema** — Thêm cột liên kết:
   ```sql
   ALTER TABLE extraction_jobs ADD COLUMN pose_id TEXT;
   ```
   
5. **extractionJobStore.ts** — Update `enqueue()` để nhận `poseId`:
   ```ts
   enqueue(input: {
     sourceImageBase64: string;
     sourceMimeType: string;
     poseId?: string;         // NEW
     maxAttempts?: number;
   })
   ```

6. **Response format** — Thêm `sourceImagePath` vào response:
   ```json
   {
     "data": {
       "pose": { ...existingFields, "sourceImagePath": "https://..." },
       "jobId": "...",
       "status": "queued"
     }
   }
   ```

## Success Criteria

- [ ] Admin upload 1 ảnh → R2 `community/source/` có file mới
- [ ] DB `community_poses` record có `source_image_path` = R2 URL
- [ ] Extraction job enqueued với `pose_id` liên kết
- [ ] Response 202 chứa `sourceImagePath`
- [ ] Existing admin tests vẫn pass (hoặc update test)

## Risk Assessment

- Risk: Upload R2 fail → pose tạo không có source image.
  Mitigation: Upload R2 trước createPose. Nếu upload fail → return 500, không tạo pose.
- Risk: `imagePath = ""` placeholder gây lỗi ở mobile app cũ.
  Mitigation: Xem xét dùng `imagePath = sourceImagePath` tạm (fallback hiển thị ảnh gốc cho đến khi skeleton ready).
