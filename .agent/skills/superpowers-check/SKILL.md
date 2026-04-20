---
name: superpowers-check
description: "Detect superpowers plugin availability at session start. Recommend installation via AskUserQuestion if not found. Sets SUPERPOWERS_AVAILABLE context flag. Auto-triggered by all workflows."
allowed-tools: Read, Bash
---

# Superpowers Plugin Check

> Auto-detect superpowers plugin. Recommend install if missing. Set context flag.

---

## When to Use

This skill is invoked **automatically at session start** by all workflow files (`/cook`, `/spec`, `/arch`, `/build`, `/quality`, `/launch`, `/ship`).

**Do NOT invoke manually** — workflows handle this.

---

## Detection Logic

### Step 1: Check Plugin Presence

Check if `superpowers` plugin is installed in Claude Code:

```
Detection methods (try in order):

1. Check .claude/settings.local.json for "superpowers" in enabledPlugins
2. Check ~/.claude/plugins/ directory for superpowers folder
3. Try referencing superpowers:test-driven-development — if recognized, installed
```

### Step 2: Set Context Flag

| Detection Result | Flag | Behavior |
|-----------------|------|----------|
| Plugin found | `SUPERPOWERS_AVAILABLE = true` | Enhanced execution: subagents, 2-stage review |
| Plugin NOT found | `SUPERPOWERS_AVAILABLE = false` | Standard execution: inline TDD, no subagents |

### Step 3: If NOT Installed → AskUserQuestion

Use tool **AskUserQuestion** to recommend installation:

```
⚡ Plugin Recommendation: superpowers (obra/superpowers)

Pipeline hoạt động tốt hơn với plugin "superpowers". Plugin cung cấp:

• ✅ Subagent-driven development (isolated agents per task, max 3 concurrent)
• ✅ 2-stage code review (spec compliance → code quality)
• ✅ Git worktree isolation (clean feature branches)
• ✅ Enhanced debugging (systematic 4-phase analysis)

Install?
[✅ Yes - Install superpowers] / [⏭ No - Continue without]
```

### Step 4: Handle Response

**If user chooses YES:**

```bash
# Primary method
/plugin install superpowers@claude-plugins-official

# Fallback if primary fails
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

After install → set `SUPERPOWERS_AVAILABLE = true`

**If user chooses NO:**

- Set `SUPERPOWERS_AVAILABLE = false`
- Log: "Continuing without superpowers. Using built-in TDD workflow."
- **Do NOT ask again** during this session

---

## Impact on Workflows

| Feature | SUPERPOWERS_AVAILABLE = true | SUPERPOWERS_AVAILABLE = false |
|---------|------------------------------|-------------------------------|
| TDD | superpowers:test-driven-development (Iron Law inherent) | agkit tdd-workflow (Iron Law upgraded) |
| Task execution | superpowers:subagent-driven-development (max 3 concurrent) | Inline execution, same context |
| Code review | 2-stage: spec compliance → code quality (per task) | /quality audit (after all tasks) |
| Git workflow | superpowers:using-git-worktrees (isolated branches) | Suggest worktree via AskUserQuestion |
| Plan execution | superpowers:executing-plans (with checkpoints) | Phase-by-phase inline |
| Debugging | superpowers:systematic-debugging (4-phase) | /quality debug (built-in) |

---

## Session Caching

Once detected, the result persists for the entire session:

- **First workflow call:** Run full detection + AskUserQuestion if needed
- **Subsequent workflow calls:** Skip detection, use cached `SUPERPOWERS_AVAILABLE` value
- **Tip:** Log result: `"🔌 Superpowers: [available/not available]"` for visibility
