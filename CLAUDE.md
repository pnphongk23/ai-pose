@AGENTS.md

## Rule bootstrap (bắt buộc)

Đây là **protocol** cho agent (không phải shell script chạy được). Mô phỏng cách Superpowers/skills chỉ nạp **metadata** trước, body rule sau.

```pseudo
// RULE_BOOTSTRAP — chạy khi bắt đầu task hoặc khi user yêu cầu áp rule
RULE_ROOT := ".rule"
STEP scan_frontmatter:
  FOR EACH path IN glob(RULE_ROOT + "/**/*.md"):
    IF path chứa "/_templates/": SKIP
    READ ONLY YAML frontmatter (--- ... ---) của path
    COLLECT { path, title, description, always }
STEP load_always:
  FOR EACH rule WHERE always == true:
    READ full file rule.path (áp dụng cho mọi task trong repo này)
STEP match_task:
  task_text := user request + ngữ cảnh file đang sửa (nếu có)
  FOR EACH rule WHERE always != true:
    IF task_text semantic-match rule.description:
      MARK rule as selected
STEP load_selected:
  READ full body chỉ các file selected (tối đa cần thiết; ưu tiên ít file)
STEP lazy_guides:
  IF một rule trỏ tới `.rule/guide/` hoặc file khác: chỉ READ khi bước implement cần
FORBIDDEN: READ toàn bộ tree `.rule/` một lúc trừ khi user yêu cầu audit rule
```

- Mỗi file rule: frontmatter bắt buộc `title`, `description`, `always` (boolean).
- Ưu tiên nội dung dự án: `memory-bank/`, `specs/`, rồi mới mở rộng rule khác.
