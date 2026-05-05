---
phase: 6
title: "Rollout"
status: pending
priority: P2
effort: "2h"
dependencies: [5]
---

# Phase 6: Rollout

## Overview
Deploy an toàn lên Railway, verify runtime, và có rollback path rõ ràng.

## Requirements
- Functional: admin service chạy ổn sau deploy.
- Functional: upload pose từ production admin domain hoạt động.
- Operational: tuân thủ rule deploy hiện có (clear build trước nếu đang BUILDING).

## Architecture
- Deploy service `admin-ui` + backend service liên quan (nếu backend đổi code).
- Verify logs và health theo deployment id.

## Related Code Files
- No mandatory code changes.
- Operational config tham chiếu: `railway.toml`, `Dockerfile`.

## Implementation Steps
1. Trước deploy mới: check deployment gần nhất, nếu `BUILDING` thì hủy/xóa theo rule dự án.
2. Deploy backend trước (nếu backend route đổi), rồi deploy admin-ui.
3. Verify status `RUNNING` cho cả 2 services.
4. Verify flow thật tại `/admin/community` trên domain production.
5. Nếu fail: rollback về deployment stable gần nhất.

## Success Criteria
- [ ] Deployment RUNNING ổn định.
- [ ] Upload flow production pass.
- [ ] Có log evidence cho request thành công/thất bại chuẩn.

## Risk Assessment
- Risk: mismatch version giữa admin và backend trong cửa sổ deploy.
- Mitigation: deploy theo thứ tự backend -> admin, verify ngay sau mỗi bước.