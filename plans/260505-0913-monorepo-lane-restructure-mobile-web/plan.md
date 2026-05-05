---
title: "monorepo-lane-restructure-mobile-web"
description: "Tái tổ chức monorepo theo lane /mobile và /web, tách env boundary chuẩn service, cập nhật build/deploy path và verify kỹ không regression."
status: pending
priority: P1
branch: "develop"
tags: ["monorepo", "restructure", "mobile", "web", "env", "railway"]
blockedBy: []
blocks: []
created: "2026-05-05T02:18:00.462Z"
createdBy: "ck:plan"
source: skill
---

# monorepo-lane-restructure-mobile-web

## Overview
Tổ chức lại repo theo 2 lane rõ: `/mobile` và `/web`; tách boundary env/config theo service runtime; update path build/deploy; verify kỹ backend + web + KMP path không regress.

## Approaches (2-3 options)
1) **Big-bang move một lần**
- Pros: xong nhanh, ít commit.
- Cons: blast radius lớn, rollback khó.

2) **Lane-first incremental (khuyến nghị)**
- Move theo phase: baseline -> move folder -> env split -> config/deploy update -> verify -> rollout.
- Pros: an toàn, rollback từng phase, dễ audit.
- Cons: nhiều bước hơn.

3) **Virtual lane only (không move thật, chỉ dùng convention + scripts)**
- Pros: ít thay đổi path.
- Cons: không đạt mục tiêu folder rõ `/mobile` `/web`, coupling còn cao.

**Khuyến nghị:** Option 2 theo YAGNI/KISS/DRY.

## Target Structure
```txt
/mobile
  /composeApp
  /shared
  /iosApp
/web
  /admin-ui
  /services
    /pose-extract-server
```

## Phase Plan
| Phase | Name | Status |
|---|---|---|
| 1 | [Baseline](./phase-01-baseline.md) | Pending |
| 2 | [FolderMove](./phase-02-foldermove.md) | Pending |
| 3 | [EnvBoundary](./phase-03-envboundary.md) | Pending |
| 4 | [BuildDeployConfig](./phase-04-builddeployconfig.md) | Pending |
| 5 | [Verification](./phase-05-verification.md) | Pending |
| 6 | [Rollout](./phase-06-rollout.md) | Pending |

## Dependencies
- P2 depends on P1
- P3 depends on P2
- P4 depends on P2+P3
- P5 depends on P4
- P6 depends on P5

## Risk Matrix
- High: path break ở Gradle/KMP settings.
- High: Railway rootDirectory/build context sai sau move.
- Medium: env leak/coupling do set biến sai scope.
- Medium: local scripts cũ fail do path hardcoded.

## Rollback Strategy
- Mỗi phase dùng commit riêng + tag tạm.
- Nếu fail ở P2/P3: rollback phase commit ngay.
- Nếu fail deploy: rollback service về deployment stable trước.
- Giữ branch migration riêng, không chạm main/develop cho tới khi verify xong.

## Baseline + Post Verification Summary
- Baseline trước migrate: backend tests, web build, local run, smoke /admin/community, KMP build path check.
- Post migrate: chạy lại full baseline + Railway smoke (staging/prod-safe).