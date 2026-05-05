---
phase: 1
title: "Baseline"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Baseline

## Overview
Chụp baseline kỹ trước khi move folder để so sánh regression và có rollback confidence.

## Requirements
- Functional: có kết quả pass/fail hiện tại cho backend/web/KMP path.
- Non-functional: command baseline reproducible, log rõ.

## Architecture
Tạo snapshot “before” gồm: git tree trọng yếu, command outputs, Railway current config.

## Related Code Files
- Modify: `plans/260505-0913-monorepo-lane-restructure-mobile-web/*` (notes only)
- Read: `settings.gradle.kts`, `build.gradle.kts`, `package.json`, `services/pose-extract-server/package.json`, `railway.toml`, `services/pose-extract-server/railway.toml`

## Implementation Steps
1. Chạy baseline checks:
   - `npm --prefix services/pose-extract-server test`
   - `npm run build`
   - local run backend + admin UI
   - smoke `/admin/community` upload.
2. Kiểm tra KMP path references trong `settings.gradle.kts`, module includes.
3. Ghi lại Railway service config/rootDirectory hiện tại.

## Success Criteria
- [ ] Có baseline pass/fail rõ cho backend/web.
- [ ] Có danh sách path hardcoded cần sửa sau move.
- [ ] Có snapshot Railway config để rollback.

## Risk Assessment
Risk: baseline thiếu khiến khó chứng minh regression.
Mitigation: lock command list + lưu output path rõ ràng.