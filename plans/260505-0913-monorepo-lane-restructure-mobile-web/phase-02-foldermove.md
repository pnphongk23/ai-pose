---
phase: 2
title: "FolderMove"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: FolderMove

## Overview
Thực hiện move folder theo lane `/mobile` và `/web` với commit atomic, hạn chế sửa logic.

## Requirements
- Functional: tree mới đúng target structure.
- Non-functional: preserve git history tối đa bằng `git mv`.

## Architecture
Move-only phase: không tối ưu logic, chỉ đổi layout vật lý + path imports/scripts tối thiểu để compile.

## Related Code Files
- Move: `composeApp` -> `mobile/composeApp`
- Move: `shared` -> `mobile/shared`
- Move: `iosApp` -> `mobile/iosApp`
- Move: web app root files -> `web/admin-ui/`
- Move: `services/pose-extract-server` -> `web/services/pose-extract-server`
- Modify: root `README.md`, root scripts wrappers

## Implementation Steps
1. Tạo `mobile/` và `web/`.
2. `git mv` các folder theo mapping.
3. Move toàn bộ Next app artifacts vào `web/admin-ui` (src/public/config/package files liên quan web).
4. Move backend service vào `web/services/pose-extract-server`.
5. Add root-level helper scripts (optional) để chạy nhanh.

## Success Criteria
- [ ] Tree đúng lane target.
- [ ] Không mất file/history quan trọng.
- [ ] Không còn module nằm sai lane.

## Risk Assessment
Risk: move nhầm file shared tooling.
Mitigation: pre-list file ownership trước `git mv` + commit nhỏ từng block.