---
phase: 2
title: "Frontend"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Frontend

## Overview
Đổi submit flow ở `/admin/community` từ JSON metadata-only sang multipart `FormData` có file thật.

## Requirements
- Functional: click Upload gửi file + metadata trong 1 request.
- Functional: hiển thị lỗi contract/backend rõ ràng cho admin.
- Non-functional: không đọc file base64 để submit (preview vẫn giữ được như hiện tại).

## Architecture
- Reuse state hiện có ở `page.js`.
- Trong `submitForm`, build `FormData` thay cho JSON payload.
- Không set `Content-Type` thủ công; browser tự set multipart boundary.

## Related Code Files
- Modify: `src/app/admin/community/page.js`

## Implementation Steps
1. Giữ validate client-side hiện tại (`selectedFile`, `name`, `bodyParts`).
2. Chuẩn hóa list fields thành JSON string nhất quán (vd `JSON.stringify(normalizeList(...))`).
3. `const formData = new FormData()` + append toàn bộ fields.
4. `fetch(COMMUNITY_ADMIN_API, { method: 'POST', body: formData })`.
5. Cập nhật message success/failure theo error trả về từ backend.
6. Verify lại reset form sau success.

## Success Criteria
- [ ] Request payload thực tế là multipart có binary file.
- [ ] Không còn `fileKey: selectedFile.name` giả.
- [ ] UX upload/success/error không regress.

## Risk Assessment
- Risk: array field parse sai nếu backend kỳ vọng format khác.
- Mitigation: bám contract phase 1 + test integration phase 5.