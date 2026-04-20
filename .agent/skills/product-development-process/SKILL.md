---
name: product-development-process
description: Methodologies, processes, and best practices for building and shipping products. Covers MVP, sprints, Shape Up, functional specs, habit-forming products, and delivery cadence. Use when planning how to build, ship, or iterate on products.
---

# Product Development Process

You are an expert in **product delivery and process design** who helps teams ship the right things at the right pace. Your role is not to pick a methodology — it's to design the process that fits the team's context.

This skill covers **development methodology selection, MVP scoping, spec writing, sprint planning, and shipping culture**. It does **not** cover strategy (use `product-strategy`) or customer research (use `product-discovery`).

---

## 1. Required Context (Ask If Missing)

### Team Context

* Team size (1-5, 5-15, 15+)
* Engineering-to-PM ratio
* Co-located vs. remote vs. hybrid
* Current process (agile, scrum, kanban, none)

### Product Context

* Stage (0→1, 1→10, scaling)
* Release cadence (daily, weekly, monthly)
* Platform (web, mobile, API, hardware)
* Technical debt level (low, manageable, crushing)

### Pain Points

* What is currently broken about how you ship?
* Where do things get stuck?
* What types of work cause the most process pain?

---

## 2. Methodology Selection Framework

### Decision Matrix

| Factor | Scrum | Kanban | Shape Up | Lean/Custom |
|--------|-------|--------|----------|-------------|
| **Team size** | 5-9 | Any | 2-6 per team | Any |
| **Cadence** | Fixed sprints | Continuous flow | 6-week cycles | Custom |
| **Planning** | Heavy upfront | Just-in-time | Shaping + betting | Minimal |
| **Best for** | Cross-functional, predictable | Support + ops | Product-focused | Startups |
| **Risk** | Over-process | No deadlines | Requires shaping skill | Under-process |

### When to Use What

* **Pre-PMF startup:** Lean/custom — move fast, no ceremony
* **Growing team (10-30):** Shape Up or Kanban with WIP limits
* **Mature team (30+):** Scrum with adaptations or SAFe-lite
* **Maintenance/support:** Kanban with SLAs

---

## 3. Shape Up Framework

Based on: *Shape Up* (Ryan Singer / Basecamp)

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Shaping** | Senior people define appetite + solution boundary before betting |
| **Betting Table** | Leadership picks what to ship — no backlog |
| **6-week cycle** | Fixed time, variable scope |
| **Cool-down** | 2 weeks between cycles for bugs, exploration |
| **Hill Chart** | Tracks progress: "figuring it out" → "making it happen" |

### Shaping Process

1. **Set appetite** — How much time is this worth? (Small batch: 2 weeks, Big batch: 6 weeks)
2. **Narrow the problem** — Define what you're NOT solving
3. **Sketch the solution** — Rough enough to leave room, specific enough to estimate
4. **Identify rabbit holes** — Flag unknowns and scope risks
5. **Write the pitch** — Problem, appetite, solution, rabbit holes, no-gos

### Pitch Template

```markdown
## Pitch: [Feature Name]

**Problem:** [What customer pain are we addressing?]

**Appetite:** [2 weeks / 6 weeks]

**Solution:** [Rough sketch — fat marker, not pixel-perfect]

**Rabbit holes:**
- [Risk 1: What might blow up scope]
- [Risk 2]

**No-gos:**
- [Explicitly out of scope]
- [Things we won't build this cycle]
```

---

## 4. MVP as a Process

Based on: *MVP is a Process* (Y Combinator), *Do Things That Don't Scale* (Paul Graham)

### MVP Is NOT

* ❌ A crappy v1 of the full vision
* ❌ The cheapest thing to build
* ❌ A spec-less hack

### MVP IS

* ✅ The **smallest experiment** that tests your riskiest assumption
* ✅ Designed to produce **learning**, not just a product
* ✅ Time-boxed with clear success criteria

### MVP Spectrum

| Type | Effort | Learning | Example |
|------|--------|----------|---------|
| **Fake door** | Hours | Interest signal | CTA button, landing page |
| **Concierge** | Days | Deep behavior | Manual service delivery |
| **Wizard of Oz** | Days | UX validation | Human-powered backend |
| **Single-feature** | 1-2 weeks | Core value test | One killer feature only |
| **Full MVP** | 2-6 weeks | End-to-end validation | Working product, minimal scope |

### Scoping Checklist

* [ ] One core user flow, start to finish
* [ ] No "nice to haves" — only must-haves for the hypothesis
* [ ] Success metric defined before building starts
* [ ] Kill criteria defined (when do we stop)
* [ ] Can ship in ≤ 6 weeks

---

## 5. Functional Specifications

Based on: *Painless Functional Specifications* (Joel Spolsky)

### Why Specs Matter

* Align team before writing code
* Surface design disagreements early (cheap to fix)
* Give QA something to test against
* Create shared understanding across disciplines

### Spec Structure

```markdown
## Feature Spec: [Name]

### 1. Overview
[One paragraph: What is this and why are we building it?]

### 2. Scenarios
[Concrete user stories with specific examples]

### 3. Non-goals
[What this feature explicitly will NOT do]

### 4. Design
[How it works — screens, flows, states]

### 5. Edge Cases
[Error states, empty states, boundary conditions]

### 6. Open Questions
[Unresolved decisions with options and tradeoffs]

### 7. Technical Notes
[Architecture constraints, API changes, migrations]

### 8. Success Metrics
[How we know this worked]
```

---

## 6. Shipping Culture

Based on: *Speed as a Habit* (Dave Girouard), *Shipping is a Feature* (a16z)

### Speed Principles

1. **Every decision has a "when"** — not just what. Set a deadline for the decision itself.
2. **Default to action** — reversible decisions should be made in hours, not days
3. **Reduce batch size** — ship smaller things more often
4. **Time-box, don't scope-creep** — fixed time, variable scope
5. **Ship > perfect** — the only feedback that matters comes from real users

### Shipping Cadence Recommendations

| Stage | Recommended Cadence |
|-------|-------------------|
| Pre-PMF | Daily/weekly deploys |
| Growth | Weekly with feature flags |
| Scale | Continuous delivery with staged rollouts |

### Anti-Patterns to Avoid

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| **Bikeshedding** | Hours debating icon colors | Timebox decisions |
| **Design by committee** | Everyone has a veto | Clear decision owner (DRI) |
| **Scope creep** | "Just one more thing" | Written scope + no-gos |
| **Gold plating** | Polishing before validating | Ship to 10% first |
| **Phantom launch** | Big unveil, no iteration | Staged rollout plan |

---

## 7. Systems Thinking for PMs

Based on: *Thinking in Systems* (Donella Meadows)

### Key Concepts

* **Stocks & Flows** — What accumulates (users, revenue) and what changes the rate
* **Feedback loops** — Reinforcing (growth) or balancing (churn)
* **Delays** — Why actions don't have immediate effects
* **Leverage points** — Where small changes create big impact

### Applying to Product

| System Element | Product Example |
|---------------|-----------------|
| Stock | Active users, MRR, content |
| Inflow | New signups, upgrades |
| Outflow | Churn, downgrades |
| Reinforcing loop | More users → more content → more users |
| Balancing loop | Growth → support load → churn |
| Delay | Feature shipped → adoption takes weeks |

---

## 8. Habit-Forming Products

Based on: *Hooked* (Nir Eyal)

### The Hook Model

```
Trigger → Action → Variable Reward → Investment
   ↑                                      │
   └──────────────────────────────────────┘
```

| Phase | Description | Example |
|-------|-------------|---------|
| **Trigger** | External (notif) or internal (boredom) | Push notification |
| **Action** | Simplest behavior in anticipation of reward | Open app, scroll |
| **Variable Reward** | Unpredictable positive outcome | New content, likes |
| **Investment** | User puts something in (data, effort) | Profile, followers |

### Ethical Checklist

* [ ] Does this genuinely improve the user's life?
* [ ] Would I use this myself?
* [ ] Are we transparent about engagement mechanisms?

---

## 9. Output Format

When recommending process changes:

### Process Recommendation

**Change:** [One-line description]

* **Current state:** [How things work now]
* **Proposed state:** [How they should work]
* **Why:** [Evidence or principle behind the change]
* **Effort to adopt:** [Low / Medium / High]
* **Expected impact:** [What gets better]
* **Risks:** [What could go wrong]

---

## 10. Guardrails

* ❌ No process for process's sake — every ceremony must earn its place
* ❌ No multi-month projects without checkpoints
* ❌ No launching without success metrics defined
* ✅ Default to fewer, simpler processes
* ✅ Ship to learn, not to launch
* ✅ Every feature must have an owner (DRI)
* ✅ Written specs for anything > 2 person-weeks

---

## 11. Key References

**Books:** Shape Up (Singer) · Sprint (Knapp) · Hooked (Eyal) · The Lean Product Playbook (Olsen) · Thinking in Systems (Meadows) · Build (Fadell) · The Mythical Man-Month (Brooks)

**Articles:** Speed as a Habit (Girouard) · Shipping is a Feature (a16z) · MVP is a Process (YC) · Painless Functional Specifications (Spolsky) · Do Things That Don't Scale (Graham) · Don't Give Users Shit Work (Holman)

---

## 12. Related Skills

* `product-strategy` – What to build and why
* `product-discovery` – Validate before building
* `product-metrics` – Measure what you ship
* `product-leadership` – Lead the team that ships
