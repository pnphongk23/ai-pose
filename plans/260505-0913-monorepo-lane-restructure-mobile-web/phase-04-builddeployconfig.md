---
phase: 4
title: "BuildDeployConfig"
status: pending
priority: P1
effort: "4h"
dependencies: [2,3]
---

# Phase 4: BuildDeployConfig

## Overview
Cập nhật toàn bộ path build/dev/deploy sau khi đổi layout folder.

## Requirements
- Functional: local build/run commands chạy từ path mới.
- Functional: Railway deploy path/rootDirectory đúng cho admin và backend.
- Non-functional: tránh downtime do deploy config sai context.

## Architecture
Update config references thay vì đổi business logic.

## Related Code Files
- Modify: `web/admin-ui/package.json` scripts (nếu cần)
- Modify: root `package.json` wrappers
- Modify: `web/admin-ui/next.config.mjs`
- Modify: `settings.gradle.kts` + Gradle include paths
- Modify: Railway configs (`railway.toml`, service-level settings)
- Modify: Dockerfile/.dockerignore context path (nếu deploy Docker)

## Implementation Steps
1. Update commands/scripts dùng đường dẫn mới.
2. Update Gradle settings cho `mobile/*` modules.
3. Update Railway service rootDirectory:
   - admin-ui -> `web/admin-ui`
   - pose-extract-server -> `web/services/pose-extract-server`
4. Validate Docker/Nixpacks configs tương ứng.
5. Dry-run build commands theo từng lane.

## Success Criteria
- [ ] Build commands thành công ở path mới.
- [ ] Railway config trỏ đúng service directories.
- [ ] KMP module include không broken.

## Risk Assessment
Risk: deploy build context sai sau move.
Mitigation: explicit rootDirectory + pre-deploy local build in same path.