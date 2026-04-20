---
description: Quality hub. Test, review, debug, security audit, và performance profiling. Hub được cross-reference nhiều nhất trong mesh network.
---

# /quality — Quality Hub ✅

$ARGUMENTS

---

## Session Start: Plugin Check (RUN FIRST)

> [!IMPORTANT]
> Trước khi execute bất kỳ sub-command nào:
> 1. Đọc skill `superpowers-check` → EXECUTE detection logic
> 2. Ghi nhận kết quả: `SUPERPOWERS_AVAILABLE = true/false`
> 3. Kết quả ảnh hưởng execution strategy (parallel subagents vs sequential)

---

## Subagent Execution Protocol (If SUPERPOWERS_AVAILABLE)

> [!NOTE]
> Khi `SUPERPOWERS_AVAILABLE = true`, quality checks có thể chạy song song.
> **Max 3 subagents concurrent.**

### Dispatch Pattern for `/quality audit`:
```
Subagent 1: Tests + Coverage (🧪)
  - Run test suite, generate coverage report
  - Flag uncovered critical paths

Subagent 2: Security + Lint (🔒)
  - vulnerability-scanner skill
  - ESLint / detected linter
  - Hardcoded secrets scan

Subagent 3: Performance + CleanCode + SpecAlign (📐)
  - Bundle analysis, critical path profiling
  - clean-code skill review
  - Spec alignment check (requirement → test → code mapping)
```

### Nếu SUPERPOWERS NOT AVAILABLE:
- Run all checks sequentially in same context
- No parallel dispatch

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched sub-command.**
> "EXECUTE" means run ALL steps of that sub-command right now. Do NOT just describe or list options.

| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ EXECUTE `/quality audit`** — Run ALL quality checks |
| `audit` | → EXECUTE `/quality audit` |
| `test [target]` | → EXECUTE `/quality test` |
| `review [target]` | → EXECUTE `/quality review` |
| `debug <problem>` | → EXECUTE `/quality debug` |
| `secure` | → EXECUTE `/quality secure` |
| `perf [target]` | → EXECUTE `/quality perf` |
| `analyze` | → EXECUTE `/quality analyze` |

---

## Purpose

`/quality` là hub trung tâm của mesh network — **mọi workflow đều gọi** `/quality` ở một thời điểm nào đó. Tập hợp tất cả quality concerns vào 1 nơi: testing, code review, debugging, security audit, performance profiling, cross-artifact analysis.

**Đây là "mesh point" quan trọng nhất** — gateway bắt buộc trước khi ship bất cứ gì ra production.

---

## Sub-commands

```
/quality                     Auto-detect problem context (default)
/quality audit               Run ALL quality checks
/quality test [target]       Generate + run tests
/quality review [target]     Code review
/quality debug <problem>     Systematic debugging
/quality secure              Security audit
/quality perf [target]       Performance profiling
/quality analyze             Cross-artifact consistency (speckit.analyze)
```

---

## Mesh Connections

```
/quality ────► /build          (fix needed → gọi build)
  │     ────► /spec clarify    (spec issue found → callback)
  │     ────► /launch          (BLOCKS if security fails)
  │     ────► problem-solving  (creative debug approaches)
  │     ────► vulnerability-scanner (OWASP, supply chain)
  │     ────► tdd-workflow     (TDD enforcement for test generation)
  │     ────► chrome-devtools  (browser testing)
  │
  │     ◄──── /cook            (Phase 5: quality gate)
  │     ◄──── /ship            (Step 3: quality gate)
  │     ◄──── /build           (Error → auto-debug)
  │     ◄──── /launch          (pre-flight checks)
  │     ◄──── /market          (performance for marketing)
```

---

## /quality audit — Full Quality Check

Run ALL quality checks in one pass. This is the **gateway check** before any deployment.

### Execution

**IF SUPERPOWERS_AVAILABLE:**

Dispatch 3 parallel subagents:

| Subagent | Checks | Pass Criteria |
|----------|--------|---------------|
| 🧪 Subagent 1: Tests + Coverage | Run test suite, coverage report | All pass, coverage ≥ threshold |
| 🔒 Subagent 2: Security + Lint | `vulnerability-scanner`, ESLint, secret scan | No CRITICAL/HIGH, no lint errors |
| 📐 Subagent 3: Perf + CleanCode + SpecAlign | Bundle analysis, `clean-code` review, spec check | No regressions, ≥ 80% spec coverage |

Wait for all 3 → merge reports → gate decision.

**IF NOT SUPERPOWERS_AVAILABLE:**

Run checks sequentially:

| Check | Tool/Script | Pass Criteria |
|-------|-------------|---------------|
| 🧪 Tests | `npm test` / `pytest` / detected runner | All pass, coverage ≥ threshold |
| 🔒 Security | `vulnerability-scanner` skill | No CRITICAL/HIGH findings |
| 🧹 Lint | ESLint / Prettier / detected linter | No errors (warnings OK) |
| ⚡ Performance | Bundle analysis, critical path profiling | No regressions |
| 📐 Clean Code | `clean-code` skill principles | No major smells |
| 📋 Spec Alignment | `/quality analyze` logic | Coverage ≥ 80% |

### Enhanced Review Layer (If SUPERPOWERS_AVAILABLE)

After standard audit, ADD:

#### 1. Spec Compliance Review
- Đọc spec.md
- For each requirement → verify có test + implementation tương ứng
- Missing requirement → FLAG as ❌
- Extra feature (not in spec) → FLAG as ⚠️

#### 2. Code Quality Review
- Use superpowers:requesting-code-review template format
- Check: naming, structure, DRY, YAGNI, clean code
- Check: no TODO/FIXME/HACK in new code

### Gate Decision — AskUserQuestion if needed

```markdown
## ✅ Quality Audit Report

| Check      | Status | Details                    |
|------------|--------|----------------------------|
| Tests      | ✅     | 47/47 pass, 94% coverage   |
| Security   | ✅     | No vulnerabilities         |
| Lint       | ⚠️     | 3 warnings (non-blocking)  |
| Performance| ✅     | Bundle: 245KB, p95: 12ms   |
| Clean Code | ✅     | No smells detected         |
| Spec Align | ✅     | 95% coverage               |

### Gate Decision: ✅ PASS
```

**Gate logic:**
- All ✅ → PASS → auto-proceed
- Any ⚠️ with no ❌ → **AskUserQuestion**: "Quality warnings: [list]. [✅ Proceed / 🔧 Fix first / ❌ Abort]"
- Any ❌ → **AskUserQuestion**: "Quality FAILED: [details]. [🔧 Auto-fix / 📝 Manual fix / ⏭ Skip (dangerous)]"
- Security ❌ → **HARD BLOCK** (cannot override): **AskUserQuestion**: "[🔒 Must fix security issues before proceeding]"

### Verification Gate (MANDATORY — before declaring PASS)

Evidence required:
- [ ] Each test was seen failing then passing (not just "all tests pass")
- [ ] Spec alignment verified (requirement → test → code mapping)
- [ ] No TODO/FIXME/HACK in new code
- [ ] Lint clean
- [ ] Security scan clean (if applicable)

---

## /quality test — Test Generation & Execution

### When generating tests:

1. **Analyze target code:**
   - Identify functions, methods, classes
   - Find edge cases, boundary conditions
   - Detect dependencies to mock

2. **Generate test cases:**
   - Happy path tests
   - Error/exception cases
   - Edge cases (boundary values, null, empty)
   - Integration tests (if needed)

3. **Write tests** following project conventions:
   - Use detected test framework (Jest, Vitest, pytest, etc.)
   - Follow existing test patterns in codebase
   - Use AAA pattern (Arrange-Act-Assert)
   - One assertion per test (when practical)

4. **Run and report:**
   ```
   🧪 Running tests...
   ✅ auth.test.ts (5 passed)
   ✅ user.test.ts (8 passed)
   ❌ order.test.ts (2 passed, 1 failed)
   
   Failed:
     ✗ should calculate total with discount
       Expected: 90, Received: 100
   
   Total: 15 tests (14 passed, 1 failed)
   ```

### When running existing tests:

```
/quality test              Run all tests
/quality test coverage     Show coverage report
/quality test watch        Run in watch mode
/quality test <file>       Test specific file
```

---

## /quality review — Code Review

### Review Protocol

**IF SUPERPOWERS_AVAILABLE:**
Dispatch up to 3 parallel review subagents:
- Subagent 1: Security review (Priority 1)
- Subagent 2: Performance review (Priority 2)
- Subagent 3: Clean code + Best practices (Priority 3-4)

**IF NOT SUPERPOWERS_AVAILABLE:**
Run sequentially:

1. **Security review** (Priority 1):
   - Hardcoded secrets, API keys
   - SQL injection, XSS, CSRF
   - Auth/authz bypass
   - Dependency vulnerabilities

2. **Performance review** (Priority 2):
   - N+1 queries
   - Memory leaks
   - Unnecessary re-renders
   - Bundle size impact

3. **Clean code review** (Priority 3):
   - Code smells (god functions, deep nesting)
   - DRY violations
   - Naming clarity
   - Error handling completeness

4. **Best practices** (Priority 4):
   - Framework-specific patterns
   - TypeScript strict mode compliance
   - Test coverage for new code

### Output Format

```markdown
## 🔍 Code Review: [target]

### Critical Issues (must fix)
1. ❌ **[Security]** Hardcoded API key in `src/config.ts:23`
   → Move to environment variable

### Improvements (should fix)
1. ⚠️ **[Performance]** N+1 query in `UserService.getAll()`
   → Use JOIN or eager loading
2. ⚠️ **[Clean Code]** Function `processData` is 150 lines
   → Extract into smaller functions

### Suggestions (nice to have)
1. 💡 Consider using `useMemo` for expensive calculation in L45

### Summary
- Critical: 1 (must fix)
- Improvements: 2 (should fix)
- Suggestions: 1 (optional)
```

---

## /quality debug — Systematic Debugging

### Protocol (4-Phase)

**Phase 1: Gather Information**
```
- Error message (exact text)
- Reproduction steps
- Expected vs actual behavior
- Recent changes that might be related
- Relevant logs / stack traces
```

**Phase 2: Hypothesize**
```
List possible causes, ordered by likelihood:
1. ❓ [Most likely cause] — confidence: high
2. ❓ [Second possibility] — confidence: medium
3. ❓ [Less likely cause] — confidence: low
```

**Phase 3: Investigate**
```
For each hypothesis (in order):
  Test: [What I checked]
  Result: [Confirmed / Eliminated]
  Evidence: [Specific finding]
```

**Phase 4: Fix & Prevent**
```
🎯 Root Cause: [explanation]

Fix applied: [code change]
Prevention: [test added, guard added, etc.]
```

**After 3 iterations without resolution:**

**AskUserQuestion**: "Debug stuck after 3 iterations. Root cause unclear. [🔧 Try different approach / 🗣 Provide more context / ❌ Abort debugging]"

**Skills invoked:** `debugging`, `problem-solving`, `sequential-thinking`

**Mesh callback:** After fix, suggest `/quality test` to validate.

---

## /quality secure — Security Audit

### Audit Scope

1. **OWASP Top 10 scan:**
   - Injection (SQL, NoSQL, OS command)
   - Broken Authentication
   - Sensitive Data Exposure
   - Broken Access Control
   - Security Misconfiguration

2. **Supply chain audit:**
   ```bash
   npm audit
   ```
   - Check for known vulnerabilities in dependencies
   - Flag deprecated or unmaintained packages

3. **Secret detection:**
   - Scan for hardcoded passwords, API keys, tokens
   - Check `.env` files are in `.gitignore`
   - Verify no secrets in git history

4. **Output:**
   ```markdown
   ## 🔒 Security Audit
   
   | Category | Findings | Severity |
   |----------|----------|----------|
   | OWASP    | 0        | -        |
   | Deps     | 2        | LOW      |
   | Secrets  | 0        | -        |
   | Config   | 1        | MEDIUM   |
   
   Overall: ✅ PASS (no CRITICAL/HIGH)
   ```

**Skills invoked:** `vulnerability-scanner`, `red-team-tactics`

---

## /quality perf — Performance Profiling

### What It Measures

1. **Frontend:**
   - Bundle size analysis
   - Core Web Vitals (LCP, FID, CLS)
   - Lighthouse score
   - Render performance

2. **Backend:**
   - Response time (p50, p95, p99)
   - Database query performance
   - Memory usage
   - CPU profiling

3. **Output:**
   ```markdown
   ## ⚡ Performance Report
   
   ### Frontend
   | Metric | Value | Target | Status |
   |--------|-------|--------|--------|
   | Bundle | 245KB | <300KB | ✅     |
   | LCP    | 1.2s  | <2.5s  | ✅     |
   | FID    | 45ms  | <100ms | ✅     |
   | CLS    | 0.05  | <0.1   | ✅     |
   
   ### Backend
   | Endpoint | p95   | Target | Status |
   |----------|-------|--------|--------|
   | GET /api | 12ms  | <200ms | ✅     |
   ```

**Skills invoked:** `performance-profiling`, `chrome-devtools`

---

## /quality analyze — Cross-Artifact Analysis

Same logic as speckit.analyze — **read-only** consistency check:

1. Load spec.md, plan.md, tasks.md, constitution
2. Build semantic models
3. Run detection passes (duplication, ambiguity, gaps, inconsistency)
4. Severity assignment and report
5. **NEVER modify files**

See `/spec analyze` for full details.

---

## Key Principles

- **Quality is not optional** — it's built into every flow
- **Security blocks deployment** — no override for CRITICAL issues
- **Debug before guess** — systematic hypothesis testing
- **Test behavior, not implementation** — AAA pattern
- **Review for impact, not style** — focus on bugs, security, performance
- **TDD Iron Law** — no production code without failing test first

---

## Usage Examples

```
/quality audit
/quality test src/services/auth.ts
/quality review src/
/quality debug "converter shows wrong date for UTC+13"
/quality secure
/quality perf
/quality analyze
```
