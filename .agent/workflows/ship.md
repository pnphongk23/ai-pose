---
description: Quick ship pipeline. Khi đã có spec/plan/tasks → build + quality + deploy nhanh nhất. Shortcut của /cook khi planning đã xong.
---

# /ship — Quick Ship Pipeline 🚀

$ARGUMENTS

---

## Session Start: Plugin Check (RUN FIRST)

> [!IMPORTANT]
> Trước khi execute bất kỳ sub-command nào:
> 1. Đọc skill `superpowers-check` → EXECUTE detection logic
> 2. Ghi nhận kết quả: `SUPERPOWERS_AVAILABLE = true/false`
> 3. Kết quả ảnh hưởng build execution strategy và quality parallelization

---

## Subagent Execution Protocol (If SUPERPOWERS_AVAILABLE)

> [!NOTE]
> `/ship` inherits subagent patterns from `/build implement` và `/quality audit`.
> **Max 3 subagents concurrent.**

### Build Phase (inherited from /build implement):
- Per-task subagents (max 3 concurrent)
- Each subagent: implement + TDD + commit + self-review
- 2-stage review after each batch

### Quality Phase (inherited from /quality audit):
- 3 parallel subagents: Tests + Security + CleanCode

### Nếu SUPERPOWERS NOT AVAILABLE:
- Execute inline with tdd-workflow (Iron Law)
- Quality checks run sequentially

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched action.**
> "EXECUTE" means run ALL steps right now. Do NOT just describe or list options.

| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ EXECUTE full ship pipeline** — Pre-flight detect → build → quality → deploy offer |
| `--no-quality` | → EXECUTE ship pipeline, skip quality gate (dangerous!) |
| `--preview` | → EXECUTE build + quality + deploy to preview |
| `--prod` | → EXECUTE build + quality + deploy to production |
| `--resume` | → EXECUTE resume from last failed task |

---

## Purpose

`/ship` là shortcut khi bạn đã có spec/plan/tasks sẵn — nhảy thẳng vào implementation mà không cần hỏi thêm. Nhanh, gọn, ship.

**Khác `/cook`:** `/cook` bắt đầu từ ý tưởng (cần Socratic Gate, spec, plan). `/ship` bắt đầu khi đã plan xong (chỉ build + quality + deploy).

---

## Mesh Connections

```
/ship ────► /build   (implement tasks)
  │   ────► /quality (test + review + secure)
  │   ────► /launch  (deploy)
  │
  │   ◄──── /cook    (cook delegates to ship when plan exists)
  │   ◄──── /quality (fallback: debug/fix during build)
```

---

## Pre-Flight Detection

Before starting, auto-detect available artifacts:

```
Scan for artifacts:
├── tasks.md?   → Use directly (preferred)
├── plan.md?    → Generate tasks first, then build
├── spec.md?    → Generate plan + tasks, then build
└── Nothing?    → **AskUserQuestion**: "No artifacts found. [🍳 Run /cook / ✏️ Create spec / ❌ Abort]"
```

**Decision matrix:**

| Has spec | Has plan | Has tasks | Action |
|----------|----------|-----------|--------|
| ❌ | ❌ | ❌ | ❌ Abort → suggest `/cook` |
| ✅ | ❌ | ❌ | Generate plan → tasks → build |
| ✅ | ✅ | ❌ | Generate tasks → build |
| ✅ | ✅ | ✅ | Build immediately ✅ |
| any | any | ✅ | Build from tasks ✅ |

---

## Execution Flow

### Step 1: Load Context

1. Run `.specify/scripts/bash/check-prerequisites.sh --json` if available
2. Parse available documents, extract absolute paths
3. Load tasks.md (primary), plan.md (for context), spec.md (for validation)
4. Count total tasks, completed tasks, remaining tasks

**Report:**
```markdown
🚀 **Ship Mode Activated**

📦 Found:
- spec.md ✅ (8 requirements)
- plan.md ✅ (3 phases)  
- tasks.md ✅ (12 tasks, 3 done, 9 remaining)

⚡ Starting from task T004...
```

### Step 2: Build (/build implement)

1. **Resume from last checkpoint** — Find first uncompleted task `- [ ]`
2. **Execute tasks phase-by-phase:**
   - Read each task description and target file
   - Implement following the plan's architecture
   - Mark `[x]` immediately after completion
   - Report progress every 3 tasks
3. **Error handling:**
   - Build error → Auto-debug (root cause analysis)
   - After fix → Resume from failed task
   - 2 consecutive failures → Pause and report

**Progress:**
```
🔨 Building... ████████████░░░░ 75%
✅ T004-T010 complete
🔄 T011 in progress...
```

### Step 3: Quality Gate (/quality audit)

1. **Run quality checks** (same as `/cook` Phase 5):
   - Tests → Coverage report
   - Security scan → Vulnerability check
   - Clean code → Smell detection
2. **Gate result:**
   - ✅ PASS → Proceed to deploy
   - ⚠️ WARN → **AskUserQuestion**: "Quality warnings: [list]. [✅ Proceed / 🔧 Fix first / ❌ Abort]"
   - ❌ FAIL → Auto-fix simple issues, block on critical

### Step 4: Deploy Offer (/launch)

**AskUserQuestion:**
```
✅ Ship ready!

| Check      | Status |
|------------|--------|
| Build      | ✅ 12/12 tasks |
| Tests      | ✅ 47/47 pass  |
| Security   | ✅ Clean       |

Options:
[🚀 Deploy to preview/staging]
[🌐 Deploy to production]
[⏹ Done for now — just commit]
```

---

## Sub-commands

```
/ship                 Ship everything (default)
/ship --no-quality    Skip quality gate (dangerous!)
/ship --preview       Build + quality + deploy to preview
/ship --prod          Build + quality + deploy to production
/ship --resume        Resume from last failed task
```

---

## Completion Report

```markdown
🚀 **Shipped!**

### Summary
- Tasks completed: 12/12
- Files created: [N]
- Files modified: [N]
- Tests: 47/47 passing
- Quality: All checks passed
- Deployed to: [preview/production/none]

### Duration
- Build: ~[N] minutes
- Quality: ~[N] minutes
- Total: ~[N] minutes
```

---

## Usage Examples

```
/ship
/ship --preview
/ship --prod
/ship --resume (after fixing a blocking issue)
/ship --no-quality (YOLO mode, not recommended)
```
