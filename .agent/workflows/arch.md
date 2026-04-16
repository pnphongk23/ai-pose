---
description: Architecture hub. Plan kiến trúc, research công nghệ, tạo data model và contracts. Gộp speckit.plan + research + design vào 1 workflow.
---

# /arch — Architecture Hub 🏗️

$ARGUMENTS

---

## Session Start: Plugin Check (RUN FIRST)

> [!IMPORTANT]
> Trước khi execute bất kỳ sub-command nào:
> 1. Đọc skill `superpowers-check` → EXECUTE detection logic
> 2. Ghi nhận kết quả: `SUPERPOWERS_AVAILABLE = true/false`
> 3. Kết quả ảnh hưởng research parallelization và design subagents

---

## Subagent Execution Protocol (If SUPERPOWERS_AVAILABLE)

> [!NOTE]
> `/arch` có 2 điểm có thể dùng subagents. **Max 3 concurrent.**

### Step 5 Research (3 parallel subagents):
```
Subagent 1: docs-seeker → Find documentation for unknown tech
Subagent 2: Web search → Latest best practices, comparisons
Subagent 3: repomix → Analyze reference implementations

Wait for all → consolidate into research.md
```

### Step 6 Design (2 parallel subagents):
```
Subagent 1: Data Model → entities, fields, relationships → data-model.md
Subagent 2: Interface Contracts → APIs, endpoints → contracts/

Wait for both → run constitution re-check
```

### Nếu SUPERPOWERS NOT AVAILABLE:
- Research sequentially (docs-seeker → web search → repomix)
- Design sequentially (data-model → contracts)

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched sub-command.**
> "EXECUTE" means run ALL steps of that sub-command right now. Do NOT just describe or list options.

| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ EXECUTE `/arch plan`** — Full architecture planning |
| `plan` | → EXECUTE `/arch plan` |
| `research <topic>` | → EXECUTE `/arch research` với topic |
| `model` | → EXECUTE `/arch model` |
| `contracts` | → EXECUTE `/arch contracts` |

---

## Purpose

`/arch` là hub quản lý toàn bộ việc thiết kế kiến trúc — từ research công nghệ, plan phases, tạo data model, đến define interface contracts. Nhận spec từ `/spec`, xuất plan cho `/build`.

---

## Sub-commands

```
/arch                        Plan architecture đầy đủ (default)
/arch plan                   Tạo implementation plan
/arch research <topic>       Research công nghệ cụ thể
/arch model                  Tạo data model từ spec
/arch contracts              Tạo interface contracts
```

---

## Mesh Connections

```
/arch ────► /build           (handoff: plan xong → build)
  │   ────► /spec clarify    (callback: spec thiếu info)
  │   ────► docs-seeker      (research documentation)
  │   ────► plan-writing     (structured task planning)
  │   ────► architecture     (ADR decisions)
  │   ────► database-design  (data model)
  │   ────► api-patterns     (API contracts)
  │
  │   ◄──── /cook           (cook gọi arch ở Phase 2)
  │   ◄──── /spec           (handoff after spec complete)
```

---

## /arch plan — Full Architecture Planning

### Step 1: Setup

```bash
.specify/scripts/bash/setup-plan.sh --json
```
Parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.

### Step 2: Load Context

1. Read FEATURE_SPEC (spec.md from `/spec`)
2. Load `.specify/memory/constitution.md` if exists
3. Load IMPL_PLAN template (already copied by setup script)

### Step 3: Technical Context Analysis

Fill technical context section — for each unknown item, mark as `NEEDS CLARIFICATION`:

| Context Item | Source |
|-------------|--------|
| Tech stack | From spec or project existing code |
| Dependencies | Package.json, requirements.txt, etc. |
| Constraints | Performance targets, budget, timeline |
| Integrations | External APIs, services |
| Infrastructure | Hosting, CI/CD, database |

### Step 4: Constitution Check

If constitution exists, validate architecture against principles:
- Each MUST principle → architecture must comply
- Each SHOULD principle → architecture should comply unless justified
- Violations without justification → **AskUserQuestion**: "Constitution violation: [principle]. [🔧 Fix architecture / ⏭ Override with justification / ❌ Abort]"

### Step 5: Phase 0 — Research

1. **Extract unknowns** from Technical Context:
   - Each `NEEDS CLARIFICATION` → research task
   - Each dependency → best practices task
   - Each integration → patterns task

2. **Research using skills:**

   **IF SUPERPOWERS_AVAILABLE:**
   Dispatch up to 3 parallel subagents:
   - Subagent 1: `docs-seeker` — Find documentation for unknown tech
   - Subagent 2: Web search — Latest best practices
   - Subagent 3: `repomix` — Analyze reference implementations
   Wait for all → consolidate.

   **IF NOT SUPERPOWERS_AVAILABLE:**
   - `docs-seeker` — Find docs sequentially
   - Web search — Latest best practices
   - `repomix` — Analyze references if needed

3. **AskUserQuestion** if unknowns remain:
   ```
   Found [N] unknowns after research. [N] remain unresolved.
   [✅ Provide answers / ⏭ Skip unresolved / ❌ Abort]
   ```

### Step 6: Phase 1 — Design & Contracts

**Prerequisites:** research.md complete, all NEEDS CLARIFICATION resolved.

1. **Data Model** → `data-model.md`:
   - Extract entities from spec
   - Define fields, relationships, validation rules
   - State transitions if applicable

2. **Interface Contracts** → `contracts/`:
   - Public APIs for libraries
   - Endpoints for web services
   - Command schemas for CLI tools
   - UI contracts for applications
   - Skip if project is purely internal

   **IF SUPERPOWERS_AVAILABLE:**
   Data model + contracts can run as 2 parallel subagents.

3. **Agent Context Update:**
   ```bash
   .specify/scripts/bash/update-agent-context.sh claude
   ```

### Step 7: Re-validate Constitution

Post-design constitution check — ensure designed architecture still complies.

### Step 8: Report & Handoff

**AskUserQuestion:**
```
🏗️ Architecture Planned!

Artifacts created:
- plan.md ✅
- research.md ✅
- data-model.md [✅ / N/A]
- contracts/ [✅ / N/A]

Architecture Summary:
- Stack: [technologies]
- Phases: [N] phases
- Entities: [N] models
- Interfaces: [N] contracts

Key Decisions:
1. [Decision 1] — because [reason]
2. [Decision 2] — because [reason]

Options:
[🔨 Continue to /build tasks] / [📝 Review plan] / [⏹ Done for now]
```

---

## /arch research — Focused Research

Quick research on a specific tech topic without full planning:

```
/arch research next-intl vs react-i18next for Next.js 15
```

1. Use `docs-seeker` to find docs
2. Use web search for comparisons
3. Output decision table:

```markdown
## Research: [Topic]

| Criteria | Option A | Option B |
|----------|----------|----------|
| Bundle size | ... | ... |
| DX | ... | ... |
| Community | ... | ... |

**Recommendation:** Option [X] because [reason]
```

---

## /arch model — Data Model Only

Generate data model from existing spec without full planning:

1. Load spec.md
2. Extract entities, attributes, relationships
3. Generate `data-model.md` with:
   - Entity definitions (fields, types)
   - Relationships (1:1, 1:N, N:M)
   - Validation rules
   - State transitions
4. Visual diagram (mermaid ERD)

---

## /arch contracts — Interface Contracts Only

Generate interface contracts from existing spec + plan:

1. Identify what interfaces the project exposes
2. Document in appropriate format:
   - REST APIs: OpenAPI-style endpoints
   - GraphQL: Schema definitions
   - CLI: Command/argument schemas
   - Libraries: Public function signatures
3. Include request/response examples
4. Define error responses

---

## Key Rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
- If spec is missing detail → call back to `/spec clarify` (don't guess)
- Architecture decisions must have rationale (no "just because")
- Plan stops after Phase 1 design — does NOT implement

---

## Skills Used

- `plan-writing` — Structured task planning
- `docs-seeker` — Documentation research
- `architecture` — ADR decisions
- `database-design` — Data model patterns
- `api-patterns` — REST/GraphQL/tRPC design
- `sequential-thinking` — Complex decision analysis

---

## Usage Examples

```
/arch
/arch plan
/arch research "best practices for timezone handling in Node.js"
/arch model
/arch contracts
```
