---
description: Meta-orchestrator. Gõ 1 lệnh, AI tự chạy toàn bộ pipeline từ spec → architecture → build → quality → launch. Mesh hub chính của hệ thống.
---

# /cook — Meta-Orchestrator 🍳

$ARGUMENTS

---

## Session Start: Plugin Check (RUN FIRST)

> [!IMPORTANT]
> Trước khi execute bất kỳ sub-command nào:
> 1. Đọc skill `superpowers-check` → EXECUTE detection logic
> 2. Ghi nhận kết quả: `SUPERPOWERS_AVAILABLE = true/false`
> 3. Kết quả ảnh hưởng execution strategy trong các phase sau

---

## Subagent Execution Protocol (If SUPERPOWERS_AVAILABLE)

> [!NOTE]
> Khi `SUPERPOWERS_AVAILABLE = true`, các phase có thể chạy song song
> sẽ được dispatch tới subagents. **Max 3 subagents concurrent.**

### Dispatch Pattern:
1. Coordinator identifies parallelizable tasks
2. For each batch (max 3):
   - Dispatch subagent with: task description + relevant context + TDD instructions
   - Subagent implements, tests, commits, self-reviews
   - Coordinator reviews: spec compliance → code quality
3. Wait for batch to complete before next batch
4. Use `superpowers:subagent-driven-development` for dispatch templates

### Subagent Failure Protocol:
- DONE → proceed to review
- DONE_WITH_CONCERNS → read concerns, address if critical
- NEEDS_CONTEXT → provide context, re-dispatch
- BLOCKED → **AskUserQuestion**: "[🔧 Provide context / 🔀 Break into smaller tasks / ❌ Escalate]"

### Nếu SUPERPOWERS NOT AVAILABLE:
- Execute inline, same context
- Follow tdd-workflow skill (Iron Law mode)
- Skip subagent dispatch — all tasks run sequentially

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched action.**
> "EXECUTE" means run ALL steps right now. Do NOT just describe or list options.

| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ ERROR:** "Cần mô tả feature. Ví dụ: `/cook thêm tính năng dark mode`" |
| `<description>` | → EXECUTE full pipeline (Phase 0→6) với description |
| `--from spec` | → Bắt đầu từ Phase 1 |
| `--from arch` | → Bắt đầu từ Phase 2 |
| `--from build` | → Bắt đầu từ Phase 3 |
| `--skip-quality` | → Bỏ qua Phase 5 (NOT recommended) |
| `--dry-run <desc>` | → Chỉ Phase 0-3 (plan only, không implement) |

---

## Purpose

`/cook` là workflow chỉ huy tổng — nhận mô tả feature bằng ngôn ngữ tự nhiên, tự động orchestrate toàn bộ pipeline từ specification đến deployment. Mỗi bước thông minh: tự biết skip gì, hỏi gì, gọi ai.

**Triết lý:** 1 lệnh → AI tự lo. User chỉ can thiệp khi cần quyết định (qua AskUserQuestion).

---

## Mesh Connections (Cross-Hub References)

```
/cook ────► /spec    (generate specification)
  │   ────► /arch    (plan architecture)
  │   ────► /build   (implement tasks)
  │   ────► /quality (test + review + secure)
  │   ────► /launch  (deploy if approved)
  │
  │   ◄──── /quality (fallback: debug errors during build)
  │   ◄──── /spec    (fallback: clarify unclear requirements)
```

**Skills invoked:** `brainstorming`, `intelligent-routing`, `plan-writing`, `clean-code`, `sequential-thinking`, `tdd-workflow`, `superpowers-check`

---

## Execution Flow

### Phase 0: Context Detection (Auto)

Before anything, detect what already exists:

```
Check project state:
├── spec.md exists?     → Skip Phase 1, go to Phase 2
├── plan.md exists?     → Skip Phase 1-2, go to Phase 3
├── tasks.md exists?    → Skip Phase 1-3, go to Phase 4
├── Implementation done? → Skip to Phase 5 (quality)
└── Nothing exists?     → Start from Phase 1
```

**Report to user:**
```markdown
🍳 **Cooking:** [feature description]

**Detected state:**
- [ ] Spec: [Not found / Found at path]
- [ ] Plan: [Not found / Found at path]
- [ ] Tasks: [Not found / Found at path]
- [ ] Superpowers: [Available ✅ / Not available ⚠️]

**Starting from Phase [N]...**
```

### Phase 0.5: Plugin Enhancement Check

> [!IMPORTANT]
> Nếu chưa kiểm tra ở Session Start, execute `superpowers-check` skill ngay.

Log kết quả:
- `SUPERPOWERS_AVAILABLE = true` → Pipeline sẽ dùng subagent-driven execution
- `SUPERPOWERS_AVAILABLE = false` → Pipeline dùng built-in agkit TDD (Iron Law)

### Phase 1: Specification → DELEGATE to `/spec create`

> [!IMPORTANT]
> **DELEGATE** = Đọc file `spec.md` workflow và EXECUTE toàn bộ steps của `/spec create`.
> Coi như user vừa gọi `/spec create <feature description từ $ARGUMENTS>`.
> KHÔNG copy logic vào đây — luôn đọc workflow file gốc để đảm bảo sync.

1. **EXECUTE `/spec create <feature description>`:**
   - Đọc workflow file: `.agent/workflows/spec.md` → section `/spec create`
   - Chạy Step 1→5 đầy đủ (bao gồm Socratic Gate từ brainstorming skill)
   - Sử dụng output (spec.md) cho Phase 2

2. **Checkpoint — AskUserQuestion:**

   Dùng tool **AskUserQuestion**:
   ```
   ✏️ Spec created: [path to spec.md]
   
   📋 Summary:
   - [N] functional requirements
   - [N] user stories
   - [N] edge cases identified
   
   Options:
   [✅ Continue to Architecture] / [📝 Review spec first] / [⏹ Stop here]
   ```
   
   Chờ user response. KHÔNG auto-proceed.

3. **Git Worktree Suggestion — AskUserQuestion:**

   Dùng tool **AskUserQuestion**:
   ```
   🌿 Best Practice: Git Worktree
   
   Tạo isolated branch cho feature này?
   Giúp tách biệt code, dễ cleanup nếu cần.
   
   [✅ Yes - create worktree] / [⏭ No - work in current branch]
   ```
   
   If Yes: `git worktree add ./worktrees/<feature-name> -b feature/<feature-name>`

### Phase 2: Architecture → DELEGATE to `/arch plan`

> [!IMPORTANT]
> **DELEGATE** = Đọc file `arch.md` workflow và EXECUTE toàn bộ steps của `/arch plan`.
> KHÔNG copy logic — đọc workflow file gốc.

1. **EXECUTE `/arch plan`:**
   - Đọc workflow file: `.agent/workflows/arch.md` → section `/arch plan`
   - Chạy Step 1→8 đầy đủ (setup, context, research, design, report)
   - Sử dụng output (plan.md, data-model.md, contracts/) cho Phase 3

2. **Checkpoint — AskUserQuestion:**

   Dùng tool **AskUserQuestion**:
   ```
   🏗️ Architecture planned: [path to plan.md]
   
   📋 Artifacts created:
   - plan.md
   - data-model.md (if data involved)
   - contracts/ (if APIs involved)
   
   Options:
   [✅ Continue to Tasks] / [📝 Review plan first] / [⏹ Stop here]
   ```
   
   Chờ user response. KHÔNG auto-proceed.

### Phase 3: Task Generation → DELEGATE to `/build tasks`

> [!IMPORTANT]
> **DELEGATE** = Đọc file `build.md` workflow và EXECUTE `/build tasks`.
> Tasks PHẢI follow TDD step format (xem build.md Task Template).

1. **EXECUTE `/build tasks`:**
   - Đọc workflow file: `.agent/workflows/build.md` → section `/build tasks`
   - Chạy Step 1→6 đầy đủ
   - Mỗi task PHẢI include TDD steps (N.1→N.6)
   - Sử dụng output (tasks.md) cho Phase 4

2. **Auto-proceed** to Phase 4 (no checkpoint — tasks are derived from approved plan)

### Phase 4: Implementation → DELEGATE to `/build implement`

> [!IMPORTANT]
> **DELEGATE** = Đọc file `build.md` workflow và EXECUTE `/build implement`.
> Execution strategy depends on `SUPERPOWERS_AVAILABLE`.

**Execution Strategy:**

```
IF SUPERPOWERS_AVAILABLE AND task count > 3:
  → superpowers:subagent-driven-development
  → Fresh subagent per task (batch of max 3 concurrent)
  → Each subagent uses superpowers:test-driven-development
  → 2-stage review after each batch: spec compliance → code quality
  
  For each batch:
    Subagent 1: Task N   (implement + TDD + commit)
    Subagent 2: Task N+1 (implement + TDD + commit)
    Subagent 3: Task N+2 (implement + TDD + commit)
  
  After each batch:
    Review subagent: spec compliance check
    Review subagent: code quality check
  
  Wait → next batch

IF SUPERPOWERS_AVAILABLE AND task count ≤ 3:
  → superpowers:executing-plans
  → Inline execution with TDD checkpoints per task

IF NOT SUPERPOWERS_AVAILABLE:
  → agkit tdd-workflow skill (Iron Law mode)
  → Inline execution, same context
  → Verification Checklist before marking each task [x]
```

1. **EXECUTE `/build implement`:**
   - Đọc workflow file: `.agent/workflows/build.md` → section `/build implement`
   - Chạy Step 1→7 đầy đủ (load, checklist gate, execute, error handling, validation)
   - Mark tasks `[x]` as completed (after Verification Checklist passes)

### Phase 5: Quality Gate → DELEGATE to `/quality audit`

> [!IMPORTANT]
> **DELEGATE** = Đọc file `quality.md` workflow và EXECUTE `/quality audit`.

**Execution Strategy:**

```
IF SUPERPOWERS_AVAILABLE:
  Dispatch 3 parallel subagents:
    Subagent 1: Run tests + coverage (🧪)
    Subagent 2: Security scan + lint (🔒)
    Subagent 3: CleanCode + spec alignment (📐)
  
  Wait for all 3 → aggregate report → gate decision
  
  After standard audit, ADD:
    Spec Compliance Review (does code match spec.md?)
    Code Quality Review (clean code, naming, structure)

IF NOT SUPERPOWERS_AVAILABLE:
  Run /quality audit inline (sequential checks)
```

1. **EXECUTE `/quality audit`:**
   - Đọc workflow file: `.agent/workflows/quality.md` → section `/quality audit`
   - Chạy toàn bộ checks (tests, security, lint, performance, clean code, spec alignment)

2. **Gate decision — AskUserQuestion if needed:**

   - All pass → Proceed to Phase 6
   - Warnings only → **AskUserQuestion**: "Quality warnings: [list]. [✅ Proceed / 🔧 Fix first / ❌ Abort]"
   - Failures → **AskUserQuestion**: "Quality FAILED: [details]. [🔧 Auto-fix / 📝 Manual fix / ⏭ Skip (dangerous)]"
   - Critical security issue → **BLOCK** deployment (no override)

### Phase 6: Launch Offer (/launch)

1. **AskUserQuestion:**
   ```
   🚀 Everything looks good! Deploy?
   
   Options:
   [🚀 Deploy to preview/staging]
   [🌐 Deploy to production]
   [⏭ Skip deployment for now]
   [📋 Create GitHub issues for remaining work]
   ```
   
2. **If deploy:** Follow `/launch` workflow
3. **If skip:** Report completion summary

---

## Completion Report

```markdown
🍳 **Cook Complete!**

### Feature: [name]
| Phase          | Status | Artifact          |
|----------------|--------|-------------------|
| Specification  | ✅     | spec.md           |
| Architecture   | ✅     | plan.md           |
| Tasks          | ✅     | tasks.md (12/12)  |
| Implementation | ✅     | [files changed]   |
| Quality        | ✅     | All checks passed |
| Deployment     | ⏭️     | Skipped           |

### Execution Mode
- Superpowers: [Available ✅ / Not available ⚠️]
- Execution: [Subagent-driven / Inline]
- TDD: Iron Law enforced ✅

### Files Changed
- Created: [N] files
- Modified: [N] files

### Next Steps
- `/market seo` — SEO check for new pages
- `/quality perf` — Deep performance profiling
- `/market content` — Create blog post about this feature
```

---

## Sub-commands

> Sub-commands đã được xử lý bởi Argument Routing block ở đầu file.
> Xem bảng routing ở trên để biết chi tiết.

---

## Error Handling

| Error | Auto-Recovery | **AskUserQuestion** Fallback |
|-------|--------------|------|
| Build error | → `/quality debug` → fix → retry | After 2 retries: **AskUserQuestion** "[🔧 Debug / ⏭ Skip task / ❌ Abort]" |
| Unclear requirement | → `/spec clarify` → update spec | **AskUserQuestion** "[📝 Clarify / 🗣 Answer directly / ⏭ Skip]" |
| Test failure | → analyze → auto-fix if simple | **AskUserQuestion** "[🔄 Retry / 🔧 Debug / ❌ Abort]" |
| Security issue | → **BLOCK** deployment | **AskUserQuestion** "[🔒 Must fix before proceed]" |
| Script not found | → Warn and skip step | **AskUserQuestion** "[📦 Install dependency / ⏭ Skip]" |
| Subagent BLOCKED | → Assess blocker | **AskUserQuestion** "[🔧 Provide context / 🔀 Break task / ❌ Escalate]" |

---

## Usage Examples

```
/cook thêm tính năng chuyển đổi âm lịch theo múi giờ quốc tế
/cook implement OAuth2 authentication for the API
/cook add dark mode with system preference detection
/cook fix and refactor the converter page for better performance
/cook --from build (when spec and plan already exist)
/cook --dry-run create a microservice for notifications
```
