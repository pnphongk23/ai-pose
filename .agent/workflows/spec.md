---
description: Specification hub. Tạo, clarify, và validate feature specs. Gộp specify + clarify + constitution + checklist vào 1 workflow có sub-commands.
---

# /spec — Specification Hub ✏️

$ARGUMENTS

---

## Session Start: Plugin Check (RUN FIRST)

> [!IMPORTANT]
> Trước khi execute bất kỳ sub-command nào:
> 1. Đọc skill `superpowers-check` → EXECUTE detection logic
> 2. Ghi nhận kết quả: `SUPERPOWERS_AVAILABLE = true/false`
> 3. Nếu superpowers available → dispatch subagent cho context analysis

---

## Subagent Execution Protocol (If SUPERPOWERS_AVAILABLE)

> [!NOTE]
> `/spec` is mostly sequential, but research context analysis can use subagents.

### Opportunities:
- `/spec create` Step 3 (Quality Validation): 1 subagent for parallel validation
- `/spec clarify` Step 2 (Ambiguity Scan): 1 subagent for deep analysis
- `/spec analyze`: up to 3 subagents for parallel detection passes

### Nếu SUPERPOWERS NOT AVAILABLE:
- Execute inline, same context

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched sub-command.**
> "EXECUTE" means run ALL steps of that sub-command right now. Do NOT just describe or list options.

| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ EXECUTE `/spec create`** — Hỏi user mô tả feature (hoặc lấy từ conversation context nếu đã có), rồi chạy toàn bộ create flow |
| `<text không match sub-command>` | **→ EXECUTE `/spec create <text>`** — Dùng text làm feature description |
| `create <description>` | → EXECUTE `/spec create` với description |
| `clarify` | → EXECUTE `/spec clarify` |
| `constitution` | → EXECUTE `/spec constitution` |
| `checklist <domain>` | → EXECUTE `/spec checklist` |
| `analyze` | → EXECUTE `/spec analyze` |

---

## Purpose

`/spec` là hub quản lý toàn bộ việc đặc tả tính năng — từ tạo spec ban đầu, clarify điểm mơ hồ, validate chất lượng requirements, đến quản lý constitution dự án. Tất cả trong 1 workflow.

---

## Sub-commands

```
/spec <description>          Tạo spec mới cho feature (default)
/spec create <description>   Tạo spec mới (explicit)
/spec clarify                Clarify spec hiện có
/spec constitution           Cập nhật project constitution
/spec checklist <domain>     Tạo requirements quality checklist
/spec analyze                Cross-artifact consistency check
```

---

## Mesh Connections

```
/spec ────► /arch         (handoff: spec xong → plan)
  │   ────► brainstorming (Socratic Gate questions)
  │   ────► sequential-thinking (ambiguity detection)
  │
  │   ◄──── /cook         (cook gọi spec ở Phase 1)
  │   ◄──── /arch         (arch gọi ngược khi spec thiếu info)
  │   ◄──── /build        (build phát hiện unclear requirement)
```

---

## /spec create — Tạo Specification mới

### Step 1: Generate Branch & Feature Name

1. **Parse feature description** from `$ARGUMENTS`
   - If empty: ERROR "No feature description provided"
   - Extract key concepts: actors, actions, data, constraints

2. **Generate short name** (2-4 words) for branch:
   - Action-noun format: "add-user-auth", "fix-payment-timeout"
   - Preserve technical terms (OAuth2, API, JWT)

3. **Check existing branches** before creating:
   ```bash
   git fetch --all --prune
   ```
   - Check remote: `git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
   - Check local: `git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
   - Check specs dirs: `specs/[0-9]+-<short-name>`
   - Use highest N+1 for new branch

4. **Run setup script:**
   ```bash
   .specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS" --number N --short-name "short-name" "Feature description"
   ```
   - Parse JSON for BRANCH_NAME and SPEC_FILE paths
   - For single quotes: use `'I'\''m Groot'` or `"I'm Groot"`

### Step 2: Load Template & Generate Spec

1. Load `.specify/templates/spec-template.md` for required sections
2. Fill template with concrete details from feature description:
   - **Functional Requirements** — each must be testable
   - **Non-Functional Requirements** — measurable criteria
   - **User Stories** — with acceptance criteria
   - **Success Criteria** — technology-agnostic outcomes
   - **Edge Cases** — boundary conditions
3. **Smart defaults** — Don't ask about:
   - Data retention (industry standard)
   - Performance targets (standard web expectations)
   - Error handling (user-friendly messages)
   - Auth method (session-based or OAuth2)
4. **Mark unclear points** — Maximum 3 `[NEEDS CLARIFICATION]` markers
   - Prioritize: scope > security > UX > technical

### Step 3: Quality Validation

1. Create `FEATURE_DIR/checklists/requirements.md` with:
   - Content quality checks (no implementation details)
   - Requirement completeness checks
   - Feature readiness checks
2. Run validation:
   - If all pass → proceed
   - If failures (not NEEDS CLARIFICATION) → auto-fix, retry up to 3x
   - If auto-fix fails 3x → **AskUserQuestion**: "Validation failed 3 times: [details]. [🔄 Retry / 📝 Manual fix / ⏭ Proceed anyway]"
   - If NEEDS CLARIFICATION remain → proceed to Step 4

### Step 4: Clarification Questions (if needed)

For each unclear point (max 3), use **AskUserQuestion**:

```
Question [N]/[total]: [Topic]

Context: [Quote relevant spec section]
What we need to know: [Specific question]

Suggested answers:
[A] [Answer 1] — [implications]
[B] [Answer 2] — [implications]
[C] Custom — provide your own answer
```

After each answer → integrate immediately into spec, save file.

### Step 5: Report & Handoff

**AskUserQuestion:**
```
✏️ Spec Created!

- Branch: [branch-name]
- Spec: [path to spec.md]
- Checklist: [path to requirements.md]
- Requirements: [N] functional, [N] non-functional
- User Stories: [N]
- NEEDS CLARIFICATION: [N] (if any)

Options:
[🏗 Continue to /arch] / [📝 Run /spec clarify] / [⏹ Done for now]
```

---

## /spec clarify — Clarify Existing Spec

### Purpose
Detect and reduce ambiguity in the active feature spec by asking up to 5 targeted questions and encoding answers back into spec.

### Step 1: Initialize
```bash
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```
Parse FEATURE_DIR and FEATURE_SPEC from JSON.

### Step 2: Ambiguity Scan

Load spec and scan across these categories (mark each as Clear / Partial / Missing):

| Category | What to check |
|----------|---------------|
| **Functional Scope** | Core user goals, out-of-scope declarations, user roles |
| **Data Model** | Entities, attributes, identity rules, state transitions |
| **UX Flow** | User journeys, error/empty/loading states, a11y |
| **Non-Functional** | Performance, scalability, reliability, security, compliance |
| **Integration** | External services, data formats, protocols |
| **Edge Cases** | Negative scenarios, rate limiting, conflict resolution |
| **Constraints** | Technical constraints, explicit tradeoffs |
| **Terminology** | Canonical terms, deprecated terms |

### Step 3: Sequential Questions (max 5)

- Present ONE question at a time via **AskUserQuestion**
- Each question must be answerable with short answer (≤5 words) or multiple choice (A-E)
- **Always provide a recommendation** with reasoning
- After answer: integrate immediately into spec, save file
- Stop when: all resolved, or user says "done", or 5 questions asked

For each question, use **AskUserQuestion**:
```
Clarification [N]/5: [Category]

[Specific question]
Recommendation: [recommended answer] because [reasoning]

[A] [option] / [B] [option] / [C] [option] / [Custom] Your answer
```

### Step 4: Integration

After each answer:
- Ensure `## Clarifications` section exists in spec
- Add `### Session YYYY-MM-DD` with `- Q: → A:` bullets
- Update the relevant spec section (functional, data model, edge cases, etc.)
- Replace any now-invalid statements (no duplicates)
- Save spec atomically after each integration

### Step 5: Report

**AskUserQuestion:**
```
✅ Clarification Complete

- Questions asked: [N]/5
- Sections updated: [list]
- Categories resolved: [N]/[total]
- Deferred: [list if any]

Options:
[🏗 Continue to /arch] / [📝 More clarification] / [⏹ Done]
```

---

## /spec constitution — Update Project Constitution

### Purpose
Update project constitution at `.specify/memory/constitution.md` — the non-negotiable principles governing the project.

### Flow
1. Load existing constitution (or copy from `.specify/templates/constitution-template.md`)
2. Identify placeholder tokens `[ALL_CAPS_IDENTIFIER]`
3. Collect values from user input or infer from repo context
4. Fill all placeholders with concrete text
5. Version management: MAJOR (removals) / MINOR (additions) / PATCH (clarifications)
6. Consistency propagation: check plan-template, spec-template, tasks-template
7. Produce Sync Impact Report
8. Write back and report

---

## /spec checklist — Requirements Quality Checklist

### Purpose
Create "unit tests for English" — validate the QUALITY of requirements, not the implementation.

### Key Concept

```
❌ WRONG: "Verify the button clicks correctly" (tests implementation)
✅ RIGHT: "Are hover state requirements consistent across all interactive elements?" (tests requirement quality)
```

### Flow
1. Run `.specify/scripts/bash/check-prerequisites.sh --json`
2. Ask up to 3 clarifying questions (scope, depth, audience)
3. Load feature context from spec/plan/tasks
4. Generate checklist with items organized by quality dimension:
   - Requirement Completeness
   - Requirement Clarity
   - Requirement Consistency
   - Acceptance Criteria Quality
   - Scenario Coverage
   - Edge Case Coverage
5. Save to `FEATURE_DIR/checklists/[domain].md`
6. Report item count and focus areas

---

## /spec analyze — Cross-Artifact Analysis

### Purpose
Read-only consistency check across spec.md, plan.md, and tasks.md. **NEVER modifies files.**

### Flow
1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`
2. Load all three artifacts + constitution
3. Build semantic models (requirements inventory, task coverage mapping)
4. Run detection passes:
   - Duplication detection
   - Ambiguity detection (vague adjectives, placeholders)
   - Underspecification
   - Constitution alignment
   - Coverage gaps
   - Inconsistency (terminology drift, ordering contradictions)
5. Assign severity: CRITICAL / HIGH / MEDIUM / LOW
6. Produce compact analysis report (max 50 findings)
7. Recommend next actions

---

## Guidelines

### For ALL Sub-commands
- Focus on **WHAT** users need and **WHY** — avoid HOW to implement
- Written for business stakeholders, not developers
- No embedded checklists in spec (separate command)
- Use absolute paths for all file operations
- For single quotes in args: use `'I'\''m Groot'` or `"I'm Groot"`

### Success Criteria Guidelines
Must be: Measurable, Technology-agnostic, User-focused, Verifiable

```
✅ "Users can complete checkout in under 3 minutes"
✅ "System supports 10,000 concurrent users"
❌ "API response time is under 200ms" (too technical)
❌ "Redis cache hit rate above 80%" (technology-specific)
```
