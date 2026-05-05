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
Rollout an toàn lên Railway theo thứ tự và có rollback rõ nếu lỗi runtime.

## Requirements
- Functional: deploy backend + admin lên path mới thành công.
- Functional: production smoke pass.
- Operational: tuân thủ rule clear deployment đang BUILDING trước deploy mới.

## Architecture
Deploy order:
1) backend
2) admin-ui
Then verify logs and route health.

## Related Code Files
- Modify: Railway service settings (dashboard/cli), optional `railway.toml` paths

## Implementation Steps
1. Trước mỗi deploy: nếu deployment trước đang BUILDING -> clear/hủy.
2. Deploy backend từ `web/services/pose-extract-server`.
3. Verify backend health/log.
4. Deploy admin từ `web/admin-ui`.
5. Verify `/admin/community` production.
6. Rollback ngay nếu smoke fail.

## Success Criteria
- [ ] Cả 2 service RUNNING ổn định.
- [ ] Upload flow production hoạt động.
- [ ] Có rollback steps đã test dry-run.

## Risk Assessment
Risk: mismatch version giữa backend/admin khi rollout lệch.
Mitigation: giữ deploy window ngắn, verify ngay mỗi bước, rollback nhanh.