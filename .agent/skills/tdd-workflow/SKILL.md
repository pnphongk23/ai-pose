---
name: tdd-workflow
description: "Test-Driven Development with Iron Law enforcement. RED-GREEN-REFACTOR cycle. MANDATORY for all implementation tasks."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# TDD Workflow — Iron Law Enforcement

> Write tests first, code second. **No exceptions.**

---

## ⛔ The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? **Delete it. Start over.**

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means **delete**

Implement fresh from tests. Period.

---

## 1. The TDD Cycle

```
🔴 RED → Write failing test
    ↓
⏸️ VERIFY RED → Watch it fail (MANDATORY)
    ↓
🟢 GREEN → Write minimal code to pass
    ↓
⏸️ VERIFY GREEN → Watch it pass (MANDATORY)
    ↓
🔵 REFACTOR → Improve code quality
    ↓
   Repeat...
```

---

## 2. The Three Laws of TDD

1. Write production code only to make a failing test pass
2. Write only enough test to demonstrate failure
3. Write only enough code to make the test pass

---

## 3. RED Phase — Write Failing Test

### What to Write

| Focus | Example |
|-------|---------|
| Behavior | "should add two numbers" |
| Edge cases | "should handle empty input" |
| Error states | "should throw for invalid data" |

### RED Phase Rules

- Test must fail first
- Test name describes expected behavior
- One assertion per test (ideally)
- Use real code, not mocks (unless unavoidable)

---

## 4. ⏸️ Verify RED (MANDATORY — Never Skip)

```bash
npm test path/to/test.test.ts
# or: pytest, go test, etc.
```

**Confirm ALL:**
- [ ] Test **fails** (not errors — errors mean test is broken)
- [ ] Failure message is **expected** (matches what you intended)
- [ ] Fails because **feature is missing** (not typos, not import errors)

**Test passes immediately?** You're testing existing behavior. Fix the test.

**Test errors?** Fix the error, re-run until it fails correctly.

---

## 5. GREEN Phase — Minimal Code

### Minimum Code

| Principle | Meaning |
|-----------|---------|
| **YAGNI** | You Aren't Gonna Need It |
| **Simplest thing** | Write the minimum to pass |
| **No optimization** | Just make it work |

### GREEN Phase Rules

- Don't write unneeded code
- Don't optimize yet
- Don't add features beyond the test
- Don't refactor other code
- Pass the test, nothing more

---

## 6. ⏸️ Verify GREEN (MANDATORY — Never Skip)

```bash
npm test path/to/test.test.ts
# Run ALL tests, not just the new one
```

**Confirm ALL:**
- [ ] New test **passes**
- [ ] All **other tests still pass**
- [ ] Output is **pristine** (no errors, no warnings)

**New test fails?** Fix the code, **not the test.**

**Other tests fail?** Fix them now. Do not proceed with broken tests.

---

## 7. REFACTOR Phase

### What to Improve

| Area | Action |
|------|--------|
| Duplication | Extract common code |
| Naming | Make intent clear |
| Structure | Improve organization |
| Complexity | Simplify logic |

### REFACTOR Rules

- All tests must stay green
- Small incremental changes
- Commit after each refactor
- Don't add behavior — only restructure

---

## 8. AAA Pattern

Every test follows:

| Step | Purpose |
|------|---------|
| **Arrange** | Set up test data |
| **Act** | Execute code under test |
| **Assert** | Verify expected outcome |

---

## 9. When to Use TDD

| Scenario | TDD Required? |
|----------|---------------|
| New feature | ✅ **Always** |
| Bug fix | ✅ **Always** (write test reproducing bug first) |
| Complex logic | ✅ **Always** |
| Refactoring | ✅ **Always** (tests protect against regression) |
| Behavior change | ✅ **Always** |
| Exploratory spike | ⚠️ **Ask human partner** — spike is OK, but delete spike code and TDD from scratch |
| UI layout only | ⚠️ **Ask human partner** — visual-only changes may skip TDD |
| Config files | ⚠️ **Ask human partner** — generated/config may skip TDD |

Thinking "skip TDD just this once"? Stop. That's rationalization.

---

## 10. Test Prioritization

| Priority | Test Type |
|----------|-----------|
| 1 | Happy path |
| 2 | Error cases |
| 3 | Edge cases |
| 4 | Performance |

---

## 11. Common Rationalizations (STOP — These Are Traps)

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. You're testing what you built, not what's required. |
| "Need to explore first" | Fine. Throw away exploration. Start fresh with TDD. |
| "TDD will slow me down" | TDD is faster than debugging in production. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Keep as reference" | You'll adapt it. That's testing after. Delete means delete. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |

---

## 12. Red Flags — STOP and Start Over

If ANY of these happen, **delete the code and restart with TDD:**

- ❌ Code written before test
- ❌ Test written after implementation
- ❌ Test passes immediately (not expected)
- ❌ Can't explain why test failed
- ❌ Tests added "later"
- ❌ Rationalizing "just this once"
- ❌ "This is different because..."

**All of these mean: Delete code. Start over with TDD.**

---

## 13. Debugging Integration

Bug found? Follow this protocol:

1. **Write a failing test** that reproduces the bug
2. **Verify RED** — test fails with expected bug behavior
3. **Fix the bug** — minimal code change
4. **Verify GREEN** — test passes, all tests pass
5. **Refactor** — clean up if needed

**Never fix bugs without a test.** The test proves the fix and prevents regression.

---

## 14. Verification Checklist (Before Marking Task Complete)

Before declaring ANY task `[x]`, verify ALL:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, no warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

❌ Can't check all boxes? Task is NOT complete. Fix and re-verify.

---

## 15. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Skip the RED phase | Watch test fail first |
| Write tests after | Write tests before |
| Over-engineer initial | Keep it simple |
| Multiple asserts | One behavior per test |
| Test implementation | Test behavior |
| Test mock behavior | Test real behavior |
| Add test-only methods | Use proper interfaces |

---

## 16. AI-Augmented TDD

### Multi-Agent Pattern

| Agent | Role |
|-------|------|
| Agent A | Write failing tests (RED) |
| Agent B | Implement to pass (GREEN) |
| Agent C | Optimize (REFACTOR) |

### Subagent TDD (When superpowers available)

Each subagent MUST follow full TDD cycle:
1. Write failing test → Verify RED
2. Write minimal code → Verify GREEN
3. Refactor → Verify GREEN
4. Self-review → Verification Checklist
5. Commit

---

> **Remember:** The test is the specification. If you can't write a test, you don't understand the requirement.
> **The Iron Law:** Production code → test exists and failed first. Otherwise → not TDD. No exceptions without your human partner's permission.
