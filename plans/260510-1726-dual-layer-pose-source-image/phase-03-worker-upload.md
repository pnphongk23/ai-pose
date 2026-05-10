---
phase: 3
title: "Worker Upload"
status: pending
priority: P1
effort: "2h"
dependencies: [2]
---

# Phase 3: Worker Upload

## Overview

Sau khi extraction thành công, worker upload skeleton image lên R2 (`community/skeleton/` prefix) và update `community_poses.image_path` với skeleton URL. Hiện tại worker chỉ lưu `result_image_base64` trong `extraction_jobs` — cần thêm bước upload + DB update.

## Requirements

- Functional: Worker extract thành công → upload skeleton PNG lên R2 `community/skeleton/<uuid>.png`.
- Functional: Worker update `community_poses.image_path` = skeleton R2 URL (thông qua `pose_id` từ extraction job).
- Functional: Worker vẫn lưu `result_image_base64` trong `extraction_jobs` (backward compat).
- Non-functional: Nếu R2 upload fail sau extract thành công → retry-able, không mất kết quả extract.

## Architecture

```
Worker claimNext() → job (có pose_id)
  │
  ├─ extractPoseImage() → { imageBase64, mimeType }
  │
  ├─ uploadBuffer(skeleton/<uuid>.png, buffer)     [NEW]
  │   → skeletonUrl = buildPublicUrl(...)
  │
  ├─ communityStore.updateSkeletonPath(poseId, skeletonUrl)  [NEW]
  │
  └─ jobStore.markSucceeded(...)
```

## Related Code Files

- Modify: `web/services/pose-extract-server/src/worker/job-processor.ts` — thêm upload + DB update
- Modify: `web/services/pose-extract-server/src/worker/worker-main.ts` — inject communityStore + R2 deps
- Modify: `web/services/pose-extract-server/src/db/communityStore.ts` — thêm `updateSkeletonPath()`
- Use: `web/services/pose-extract-server/src/services/r2Storage.ts` — `uploadBuffer()` (từ Phase 2)

## Implementation Steps

1. **communityStore.ts** — Thêm method `updateSkeletonPath()`:
   ```ts
   updateSkeletonPath(poseId: string, skeletonPath: string): void {
     this.db
       .prepare(`UPDATE community_poses SET image_path = ? WHERE id = ?`)
       .run(skeletonPath, poseId);
   }
   ```

2. **extractionJobStore.ts** — Thêm `poseId` vào interface `ExtractionJob` + `enqueue()` + `toJob()`:
   ```ts
   // ExtractionJob interface
   poseId: string | null;
   
   // ExtractionJobRow
   pose_id: string | null;
   
   // enqueue() — INSERT thêm pose_id
   // toJob() — map pose_id
   ```

3. **job-processor.ts** — Sửa `processNextJob()`:
   ```ts
   export async function processNextJob(input: {
     jobStore: ExtractionJobStore;
     browserClient: GeminiBrowserClient;
     communityStore: CommunityStore;   // NEW
     r2PublicUrl: string;               // NEW
     staleLockSeconds: number;
   }): Promise<boolean> {
     // ... claim job ...
     
     try {
       const extracted = await input.browserClient.extractPoseImage({...});
       
       // [NEW] Upload skeleton to R2
       const skeletonBuffer = Buffer.from(extracted.imageBase64, "base64");
       const skeletonFileKey = `community/skeleton/${job.id}.png`;
       await uploadBuffer({
         fileKey: skeletonFileKey,
         buffer: skeletonBuffer,
         mimeType: extracted.mimeType,
       });
       const skeletonUrl = buildPublicUrl(input.r2PublicUrl, skeletonFileKey);
       
       // [NEW] Update community_poses.image_path
       if (job.poseId) {
         input.communityStore.updateSkeletonPath(job.poseId, skeletonUrl);
       }
       
       input.jobStore.markSucceeded(job.id, lockToken, extracted.imageBase64, extracted.mimeType);
     } catch (error) {
       // ... existing error handling ...
     }
   }
   ```

4. **worker-main.ts** — Inject dependencies:
   ```ts
   import { CommunityStore } from "../db/communityStore";
   
   const communityStore = new CommunityStore(db);
   const r2PublicUrl = env.R2_PUBLIC_URL;
   
   // Pass to processNextJob
   await processNextJob({
     jobStore,
     browserClient,
     communityStore,
     r2PublicUrl,
     staleLockSeconds: STALE_LOCK_SECONDS,
   });
   ```

5. **Error handling**: Nếu R2 upload fail nhưng extract đã thành công:
   - Vẫn `markSucceeded()` với `result_image_base64` (data không mất)
   - Log warning, để admin retry manually hoặc cron job upload lại sau
   - Hoặc: `markFailedOrRequeue()` để worker retry toàn bộ (simpler, nhưng tốn compute)

## Success Criteria

- [ ] Worker extract thành công → file xuất hiện ở R2 `community/skeleton/`
- [ ] `community_poses.image_path` được update = skeleton R2 URL
- [ ] Extraction job vẫn lưu `result_image_base64` (backward compat)
- [ ] Worker retry logic vẫn hoạt động đúng
- [ ] Worker không crash khi `pose_id = null` (edge case: job cũ không có pose_id)

## Risk Assessment

- Risk: R2 upload fail sau extract → skeleton lost.
  Mitigation: `result_image_base64` vẫn lưu trong DB, có thể re-upload manually.
- Risk: Worker không có R2 credentials.
  Mitigation: Đảm bảo env vars `R2_*` được inject vào worker container (Docker/Railway).
