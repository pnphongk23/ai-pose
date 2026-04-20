---
description: Implementation hub. Generate tasks, implement code, và tạo GitHub issues. Gộp speckit.tasks + speckit.implement + speckit.taskstoissues vào 1 workflow có sub-commands.
---

# /build — Implementation Hub 🔨

$ARGUMENTS

---

## Session Start: Plugin Check (RUN FIRST)

> [!IMPORTANT]
> Trước khi execute bất kỳ sub-command nào:
> 1. Đọc skill `superpowers-check` → EXECUTE detection logic
> 2. Ghi nhận kết quả: `SUPERPOWERS_AVAILABLE = true/false`
> 3. Kết quả ảnh hưởng execution strategy trong `/build implement`

---

## Subagent Execution Protocol (If SUPERPOWERS_AVAILABLE)

> [!NOTE]
> Khi `SUPERPOWERS_AVAILABLE = true`, tasks có thể chạy song song
> sẽ được dispatch tới subagents. **Max 3 subagents concurrent.**

### Dispatch Pattern:
1. Parse tasks → identify parallelizable tasks per phase
2. For each batch (max 3):
   - Dispatch subagent with: task description + relevant context + TDD instructions
   - Subagent implements, tests, commits, self-reviews
   - Coordinator reviews: spec compliance → code quality
3. Wait for batch → next batch or next phase
4. Use `superpowers:subagent-driven-development` for dispatch templates

### Nếu SUPERPOWERS NOT AVAILABLE:
- Execute inline, same context
- Follow tdd-workflow skill (Iron Law mode)
- Skip subagent dispatch — all tasks run sequentially

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched sub-command.**
> "EXECUTE" means run ALL steps of that sub-command right now. Do NOT just describe or list options.

| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ Auto-detect:** có `tasks.md` → EXECUTE `/build implement`, không có → EXECUTE `/build tasks` |
| `tasks` | → EXECUTE `/build tasks` |
| `implement` | → EXECUTE `/build implement` |
| `issues` | → EXECUTE `/build issues` |
| `resume` | → EXECUTE `/build resume` |

---

## Purpose

`/build` là hub quản lý toàn bộ việc implementation — từ generate task breakdown, thực thi code phase-by-phase, đến tạo GitHub issues cho team. Nhận plan từ `/arch`, gọi `/quality` khi gặp vấn đề.

---

## Sub-commands

```
/build                       Auto-detect: generate tasks nếu chưa có, implement nếu có
/build tasks                 Chỉ generate tasks.md từ plan
/build implement             Chỉ implement (cần tasks.md sẵn)
/build issues                Tạo GitHub issues từ tasks.md
/build resume                Resume implementation từ task cuối cùng bị fail
```

---

## Mesh Connections

```
/build ────► /quality debug    (gặp build error → auto-debug)
  │   ────► /quality review    (detect code smell → auto-review)
  │   ────► /spec clarify      (unclear requirement → callback)
  │   ────► intelligent-routing (chọn agent phù hợp: backend/frontend/mobile)
  │   ────► clean-code         (coding standards)
  │   ────► tdd-workflow       (Iron Law TDD enforcement)
  │
  │   ◄──── /cook              (cook gọi build ở Phase 3-4)
  │   ◄──── /ship              (ship gọi build trực tiếp)
  │   ◄──── /arch              (handoff after planning)
  │   ◄──── /quality           (fix needed → gọi build)
```

---

## /build tasks — Generate Task Breakdown

### Step 1: Setup

```bash
.specify/scripts/bash/check-prerequisites.sh --json
```
Parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.

### Step 2: Load Design Documents

| Document | Required? | Extract |
|----------|-----------|---------|
| plan.md | ✅ Required | Tech stack, libraries, structure |
| spec.md | ✅ Required | User stories with priorities |
| data-model.md | Optional | Entities, relationships |
| contracts/ | Optional | Interface contracts |
| research.md | Optional | Tech decisions |

### Step 3: Task Generation

Organize tasks by user story (not by technical layer):

**Phase Structure:**
- **Phase 1: Setup** — Project initialization, dependencies, config
- **Phase 2: Foundation** — Blocking prerequisites for all stories
- **Phase 3+: User Stories** — One phase per story, in priority order (P1, P2, P3)
- **Final Phase: Polish** — Cross-cutting concerns, documentation

**Within each User Story phase:**
```
Tests (if requested) → Models → Services → Endpoints → Integration
```

### Step 4: Task Format (STRICT — TDD Steps Mandatory)

Every task MUST follow this format:

```markdown
- [ ] [TaskID] [P?] [Story?] Description with file path

**Files:**
- Create: `exact/path/to/file.ts`
- Test: `tests/exact/path/to/file.test.ts`

**TDD Steps:**
- [ ] [TaskID].1: Write failing test cho [specific behavior]
- [ ] [TaskID].2: Run test → verify FAIL
  Run: `[exact test command]`
  Expected: FAIL with "[expected failure message]"
- [ ] [TaskID].3: Write minimal implementation
- [ ] [TaskID].4: Run test → verify PASS + all tests green
  Run: `[exact test command]`
  Expected: ALL PASS
- [ ] [TaskID].5: Refactor if needed (tests stay green)
- [ ] [TaskID].6: Commit
  ```bash
  git add [files]
  git commit -m "[conventional commit]"
  ```
```

| Component | Required | Example |
|-----------|----------|---------|
| Checkbox | Always | `- [ ]` |
| Task ID | Always | `T001`, `T002` |
| [P] marker | If parallelizable | `[P]` |
| [Story] label | In story phases only | `[US1]`, `[US2]` |
| Description | Always | With exact file path |
| TDD Steps | Always | `.1` through `.6` sub-steps |

### Step 5: Write tasks.md

Use `.specify/templates/tasks-template.md` as structure. Include:
- Correct feature name from plan.md
- All phases with tasks
- Dependencies section
- Parallel execution examples
- Implementation strategy

### Step 6: Report

```markdown
📋 **Tasks Generated!**

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 3 | 0 |
| Foundation | 4 | 2 |
| [US1] Login | 5 | 3 |
| [US2] Profile | 4 | 2 |
| Polish | 3 | 1 |
| **Total** | **19** | **8** |

▶ **Next:** `/build implement` or `/build issues`
```

---

## /build implement — Execute Implementation

### Step 1: Load Context

```bash
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

### Step 2: Git Worktree Suggestion

**AskUserQuestion:**
```
🌿 Best Practice: Git Worktree Isolation

Tạo isolated branch cho implementation?
Giúp tách biệt code, rollback dễ dàng.

[✅ Yes - create worktree] / [⏭ No - current branch]
```

If Yes: `git worktree add ./worktrees/<feature-name> -b feature/<feature-name>`

### Step 3: Checklist Gate (if checklists exist)

Scan `FEATURE_DIR/checklists/`:

```markdown
| Checklist   | Total | Done | Incomplete | Status |
|-------------|-------|------|------------|--------|
| ux.md       | 12    | 12   | 0          | ✓ PASS |
| security.md | 6     | 6    | 0          | ✓ PASS |
| test.md     | 8     | 5    | 3          | ✗ FAIL |
```

- All complete → auto-proceed
- Any incomplete → **AskUserQuestion**: "Checklist incomplete: [N] items remaining. [✅ Proceed anyway / 📋 Complete first / ❌ Stop]"

### Step 4: Load Implementation Context

| Source | Load |
|--------|------|
| tasks.md | ✅ Complete task list, execution plan |
| plan.md | ✅ Tech stack, architecture, file structure |
| data-model.md | If exists: entities, relationships |
| contracts/ | If exists: API specs, test requirements |
| research.md | If exists: tech decisions, constraints |

### Step 5: Project Setup Verification

Check and create ignore files based on detected tech stack:

| Detected | Create/Verify |
|----------|--------------|
| Git repo | `.gitignore` |
| Dockerfile | `.dockerignore` |
| ESLint config | `.eslintignore` |
| Prettier config | `.prettierignore` |
| Package.json | `.npmignore` (if publishing) |

### Step 6: Execute Phase-by-Phase

> [!IMPORTANT]
> Load `tdd-workflow` skill trước khi bắt đầu. TDD là bắt buộc, không có exception.

**Strategy Selection (Auto-decide):**

```
IF SUPERPOWERS_AVAILABLE AND task count > 3:
  → Path A: superpowers:subagent-driven-development
  → Fresh subagent per task (batch of max 3 concurrent)
  → Each subagent loads superpowers:test-driven-development
  → 2-stage review after each batch: spec compliance → code quality
  
  For each phase:
    Sequential tasks → dispatch 1 subagent each
    Parallel tasks [P] → batch dispatch (max 3 concurrent):
      Subagent 1: Task [P1]
      Subagent 2: Task [P2]
      Subagent 3: Task [P3]
    Wait for batch → review → next batch or next phase

IF SUPERPOWERS_AVAILABLE AND task count ≤ 3:
  → Path B: superpowers:executing-plans
  → Inline execution with TDD checkpoints per task
  → Self-review + verification checklist after each task

IF NOT SUPERPOWERS_AVAILABLE:
  → Path C: agkit tdd-workflow (Iron Law mode)
  → Execute sequentially, same context
  → TDD cycle: RED → Verify FAIL → GREEN → Verify PASS → REFACTOR
  → Verification Checklist before marking [x]
```

**Progress tracking:**
```
🔨 Phase 2/4: User Story 1
✅ T005 Auth middleware
✅ T006 User model
🔄 T007 UserService...
⏳ T008 Login endpoint (waiting for T007)
```

**Mark completed:** Update tasks.md with `[x]` for each done task

### Step 7: Task Completion Verification Gate (MANDATORY)

> [!IMPORTANT]
> Before marking ANY task `[x]`, verify ALL boxes. **No exceptions.**

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, no warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

❌ Can't check all boxes? Task is NOT complete. Fix and re-verify.

### Step 8: Error Handling (Mesh Resilience)

| Error Type | Auto-Action | **AskUserQuestion** Fallback |
|------------|-------------|------|
| Build/compile error | → `/quality debug` logic → auto-fix | After 2 retries: "[🔧 Debug deeper / ⏭ Skip task / ❌ Abort]" |
| Test failure | → Analyze → auto-fix if simple | "[🔄 Retry / 🔧 Debug / ❌ Abort]" |
| Dependency missing | → Detect package manager | "[✅ Install [name] / ❌ Skip]" |
| Unclear requirement | → `/spec clarify` callback | "[📝 Clarify / 🗣 Answer directly / ⏭ Skip]" |
| Code smell detected | → `/quality review` suggestion | Continue, note concern |
| Subagent BLOCKED | → Assess blocker | "[🔧 Provide context / 🔀 Break task / ❌ Escalate]" |

### Step 9: Completion Validation

- All required tasks completed?
- Implementation matches original specification?
- Tests pass and coverage meets requirements?
- Implementation follows technical plan?

**AskUserQuestion:**
```
🔨 Build Complete!

| Metric | Value |
|--------|-------|
| Tasks completed | 19/19 |
| Files created | 12 |
| Files modified | 5 |
| Tests | 24 pass, 0 fail |
| Execution mode | [Subagent/Inline] |

Options:
[✅ Run /quality audit] / [📝 Review code] / [⏹ Done for now]
```

---

## /build issues — Create GitHub Issues

### Prerequisites
- tasks.md must exist
- Git remote must be a GitHub URL

### Flow

1. Load tasks from tasks.md
2. Get Git remote:
   ```bash
   git config --get remote.origin.url
   ```
3. **CAUTION:** Only proceed if remote is a GitHub URL
4. For each task → create GitHub issue via GitHub MCP server
5. **CAUTION:** NEVER create issues in repos that don't match the remote URL

---

## /build resume — Resume from Failure

1. Find last completed task in tasks.md (last `[x]`)
2. Start from next uncompleted task
3. Continue normal implementation flow (Step 6 onwards)
4. Use same execution strategy (subagent or inline) based on `SUPERPOWERS_AVAILABLE`

---

## Skills Used

- `tdd-workflow` — **Iron Law TDD enforcement** (RED → Verify → GREEN → Verify)
- `clean-code` — Coding standards and best practices
- `intelligent-routing` — Auto-select specialist agent (backend/frontend/mobile)
- `backend-development` — Server-side implementation
- `frontend-development` — Client-side implementation
- `databases` — Database operations
- `testing-patterns` — Test generation
- `superpowers-check` — Plugin detection at session start

---

## Usage Examples

```
/build
/build tasks
/build implement
/build issues
/build resume
```
