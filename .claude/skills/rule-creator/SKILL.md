---
name: rule-creator
description: "Tạo hoặc cập nhật file rule trong `.rule/` cho repo jazzcam: frontmatter title/description/always, nội dung ngắn MUST/MUST NOT, gợi ý thư mục architecture|convention|guide, tránh trùng rule, tách nội dung dài sang guide. Dùng khi user muốn thêm rule, chuẩn hóa rule, scaffold từ template, hoặc review cấu trúc `.rule/`."
---

# rule-creator

## Mục tiêu

Giữ `.rule/` đồng nhất với bootstrap trong `CLAUDE.md` / `GEMINI.md`: metadata trong frontmatter, body lazy-load.

## Trước khi viết

1. Grep `.rule/**/*.md` theo từ khóa trong `title` hoặc `description` để tránh trùng.
2. Ưu tiên **gộp** chủ đề liên quan vào một file ngắn (mục tiêu dưới ~80 dòng). Chỉ tách file khi chủ độc lập hoặc runbook dài → `.rule/guide/`.

## Frontmatter (bắt buộc)

```yaml
---
title: <ngắn, rõ>
description: <mô tả nội dung + khi nào áp dụng; dùng cho semantic match khi bootstrap>
always: true|false
---
```

- `always: true` chỉ cho rule nền (ranh giới module, placement, xcodegen, v.v.).
- `description` phải chứa trigger: "Dùng khi ...".

## Cấu trúc thư mục (tối giản)

| Nội dung | File gợi ý |
|----------|------------|
| Core/app/SwiftData/bootstrap | `.rule/architecture/core-app-data.md` |
| MVVM, SwiftUI, feature folders | `.rule/architecture/presentation-ui.md` |
| SDK init + service wrapper | `.rule/architecture/sdk-services.md` |
| Naming, placement, XcodeGen, spec, asset/L10n | `.rule/convention/repo.md` |
| Quy trình chi tiết | `.rule/guide/<tên>.md` (ví dụ `feature-slice.md`, `presentation-ui-sample.md`) |

Template: [`.rule/_templates/rule.md`](../../../.rule/_templates/rule.md)

## Nội dung body

- Section ngắn + bullet; nhãn **MUST** / **MUST NOT** / **SHOULD** (hoặc heading tương đương).
- Không tutorial dài; `See also` chỉ khi cần file khác.

## Port sang global (tuỳ chọn)

Sao chép thư mục `.claude/skills/rule-creator/` sang skill home của Codex/Cursor trên máy nếu muốn dùng cho repo khác; chỉnh `description` cho generic nếu cần.
