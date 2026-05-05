---
phase: 3
title: "NextProxy"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 3: NextProxy

## Overview
Cập nhật Next API route để nhận multipart và forward pass-through tới backend admin endpoint.

## Requirements
- Functional: route POST không reject multipart.
- Functional: giữ auth flow qua `callPoseExtractAdmin`.
- Non-functional: tránh chuyển multipart thành JSON/base64 tại proxy.

## Architecture
- `route.js` đọc `request.formData()` hoặc stream body forward trực tiếp (ưu tiên pass-through đơn giản).
- `poseExtractAdminServer.js` hỗ trợ generic body/headers để forward multipart.
- JSON path cũ có thể giữ tạm trong transition ngắn, nhưng target là multipart-first.

## Related Code Files
- Modify: `src/app/api/admin/community/poses/route.js`
- Modify: `src/lib/poseExtractAdminServer.js`

## Implementation Steps
1. Đổi guard content-type: chấp nhận `multipart/form-data` cho POST.
2. Cập nhật helper `callPoseExtractAdmin`:
   - cho phép truyền `headers` override
   - chỉ auto-set `Content-Type: application/json` khi body là object JSON path.
3. Forward multipart body tới backend route.
4. Bảo toàn error mapping qua `mapProxyError`.

## Success Criteria
- [ ] POST multipart từ frontend đi qua Next route thành công.
- [ ] Không có lỗi `Unsupported Content-Type` ở `route.js`.
- [ ] Không có double-encode body ở helper.

## Risk Assessment
- Risk: fetch/body stream bị consume sai ở runtime.
- Mitigation: chọn 1 chiến lược rõ (FormData rebuild hoặc raw pass-through) và test e2e.