---
phase: 4
title: "Admin UI"
status: pending
priority: P2
effort: "2h"
dependencies: [2]
---

# Phase 4: Admin UI

## Overview

Cập nhật Admin Community page để hiển thị dual-layer preview (source + skeleton) trong danh sách poses, kèm badge trạng thái extraction. Form upload không thay đổi (vẫn 1 input file).

## Requirements

- Functional: Mỗi Pose Card trong danh sách hiển thị ảnh gốc (source) làm background.
- Functional: Nếu skeleton đã sẵn sàng, overlay skeleton lên ảnh gốc (opacity 70%).
- Functional: Badge trạng thái: "EXTRACTING" (vàng) khi chưa có skeleton, "READY" (xanh) khi có cả 2.
- Functional: Form upload giữ nguyên — không đổi.

## Related Code Files

- Modify: `web/admin-ui/src/app/admin/community/page.js` — Pose list rendering

## Implementation Steps

1. **Pose Card rendering** — Sửa phần grid hiển thị (line 239-271):
   ```jsx
   <div className="aspect-square bg-gray-100 overflow-hidden relative">
     {/* Source image (background) */}
     {pose.sourceImagePath && (
       <img
         src={pose.sourceImagePath}
         alt={pose.name}
         className="w-full h-full object-cover"
       />
     )}
     {/* Skeleton overlay */}
     {pose.imagePath && (
       <img
         src={pose.imagePath}
         alt={`${pose.name} skeleton`}
         className="w-full h-full object-contain absolute inset-0 opacity-70"
         style={{ mixBlendMode: 'multiply' }}
       />
     )}
     {/* Fallback: no images yet */}
     {!pose.sourceImagePath && !pose.imagePath && (
       <div className="w-full h-full flex items-center justify-center opacity-20">
         <Upload size={24} />
       </div>
     )}
   </div>
   ```

2. **Status badge** — Thêm logic trạng thái:
   ```jsx
   const getExtractionStatus = (pose) => {
     if (pose.imagePath && pose.sourceImagePath) return { label: 'READY', bg: 'bg-accent-green' };
     if (pose.sourceImagePath && !pose.imagePath) return { label: 'EXTRACTING', bg: 'bg-accent-yellow' };
     return { label: 'NO IMAGE', bg: 'bg-gray-200' };
   };
   ```

3. **Info section** — Hiển thị extraction status badge bên cạnh draft/published:
   ```jsx
   <div className="flex items-center gap-1 flex-wrap">
     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md neo-border ${STATUS_BADGE[pose.status]}`}>
       {pose.status?.toUpperCase()}
     </span>
     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md neo-border ${extractionStatus.bg}`}>
       {extractionStatus.label}
     </span>
   </div>
   ```

4. **Auto-refresh** — Khi có poses ở trạng thái "EXTRACTING", auto-refresh list mỗi 10s:
   ```js
   useEffect(() => {
     const hasPending = poses.some(p => p.sourceImagePath && !p.imagePath);
     if (!hasPending) return;
     const interval = setInterval(fetchPoses, 10_000);
     return () => clearInterval(interval);
   }, [poses, fetchPoses]);
   ```

## Success Criteria

- [ ] Pose card hiển thị ảnh gốc làm background
- [ ] Skeleton overlay đè lên ảnh gốc khi có
- [ ] Badge "EXTRACTING" hiển thị khi skeleton chưa ready
- [ ] Badge "READY" hiển thị khi có cả 2 ảnh
- [ ] Auto-refresh khi có pose đang extracting
- [ ] Form upload giữ nguyên, không break

## Risk Assessment

- Risk: Ảnh skeleton có nền trắng (không trong suốt) → overlay che hết ảnh gốc.
  Mitigation: Dùng `mix-blend-mode: multiply` (trắng biến mất, đen giữ lại). Hoặc yêu cầu skeleton output là PNG transparent.
- Risk: Nhiều pose đang extracting → auto-refresh gây load cao.
  Mitigation: Giới hạn refresh rate 10s, chỉ khi tab active (document.visibilityState).
