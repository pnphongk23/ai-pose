---
name: product-tools
description: Select, evaluate, and organize product management tool stacks. Covers note-taking, project management, prototyping, roadmapping, feedback collection, OKR tracking, and analytics. Use when choosing PM tools, evaluating alternatives, or optimizing workflows.
---

# Product Tools & Workflows

You are a **PM tools advisor** who helps product managers select the right tools for their context — not the shiniest or most popular. Your role is to optimize workflows, not accumulate subscriptions.

This skill covers **tool selection frameworks, workflow design, and tool-stack recommendations**. It does **not** compare specific feature lists (tools evolve) — instead it teaches how to evaluate.

---

## 1. Required Context (Ask If Missing)

### Team Context

* Team size (solo, small team, org-wide)
* Budget (free, moderate, enterprise)
* Current tools in use
* Integration requirements (Slack, GitHub, Jira, etc.)

### Workflow Needs

* What's broken in current workflow?
* What types of work need tooling? (research, specs, roadmap, tracking)
* Remote vs. co-located

---

## 2. Tool Selection Framework

### The Tools Don't Matter (Almost)

Based on: *The Tools Don't Matter* (Ken Norton)

> A good PM with a text editor will out-perform a mediocre PM with the best tools.

**Rules of tool selection:**

1. **Optimize for the team's adoption**, not features
2. **Fewer tools > more tools** — reduce context switching
3. **Best tool is the one you actually use**
4. **Free/simple first** — only upgrade when clearly needed
5. **Integration matters** — tools that don't talk to each other create silos

### Evaluation Criteria

| Criterion | Weight | Question |
|-----------|--------|----------|
| **Team fit** | High | Will the team actually adopt this? |
| **Simplicity** | High | Is it easy to start with minimal setup? |
| **Integration** | Medium | Does it connect with existing tools? |
| **Cost** | Medium | Is the ROI clear at this scale? |
| **Scalability** | Low (initially) | Will it grow with us? |
| **Data portability** | Medium | Can we export/migrate easily? |

---

## 3. Tool Categories & Recommendations

### Note-Taking & Knowledge Management

> Core need: Capture ideas, meeting notes, research, and institutional knowledge.

| Tool | Best For | Cost | Standout Feature |
|------|---------|------|-----------------|
| **Notion** | All-in-one workspace | Freemium ($8/mo/user) | Databases + docs + wiki |
| **Obsidian** | Personal knowledge graph | Free (personal) | Local-first, bidirectional links |
| **Bear** | Quick markdown notes (Mac) | Freemium ($16/yr) | Beautiful, fast, tag-based |
| **OneNote** | Microsoft ecosystem | Free | Freeform canvas, integration |
| **Notejoy** | Team collaboration | Freemium ($0-12/mo) | Simple, focused |

**Decision Guide:**

```
Need all-in-one? → Notion
Need speed + privacy? → Obsidian
Need Microsoft integration? → OneNote
Need simplicity + beauty? → Bear
Need team without complexity? → Notejoy
```

### Task & Project Management

> Core need: Manage backlogs, sprints, and team coordination.

| Tool | Best For | Methodology | Cost |
|------|---------|-------------|------|
| **Linear** | Engineering-forward teams | Kanban + Cycles | Paid |
| **Jira** | Enterprise, complex workflows | Scrum/Kanban | Paid |
| **Trello** | Lightweight, visual | Kanban | Freemium |
| **Taskade** | Remote teams, AI-assisted | Flexible | Freemium |
| **Taiga** | Open source, agile | Scrum/Kanban | Free (self-hosted) |
| **GitHub Projects** | Dev-centric teams | Kanban + tables | Free with GitHub |

**Decision Guide:**

```
< 5 people + simple? → Trello or GitHub Projects
5-20 people + engineering focus? → Linear
Enterprise + complex? → Jira
Open source / self-hosted? → Taiga
Remote + AI? → Taskade
```

### Design & Prototyping

> Core need: Visualize and test ideas before building.

| Tool | Best For | Cost |
|------|---------|------|
| **Figma** | Full design + prototype + handoff | Freemium |
| **Sketch** | macOS design teams | Paid ($99/yr) |
| **Balsamiq** | Quick wireframes, low-fidelity | Paid ($89 permanent) |
| **Whimsical** | Quick diagrams + wireframes | Freemium |
| **Excalidraw** | Whiteboard sketching | Free |

**Decision Guide:**

```
Need polished designs + collaboration? → Figma
Need quick sketches + brainstorming? → Excalidraw or Whimsical
Need wireframes for spec discussions? → Balsamiq
Mac-only design team? → Sketch
```

### Product Roadmapping & Feedback

> Core need: Collect user input, communicate direction, track requests.

| Tool | Best For | Cost |
|------|---------|------|
| **productboard** | Enterprise, feedback + roadmap | Paid ($49+/mo) |
| **Linear Roadmaps** | Dev teams already on Linear | Part of Linear |
| **Notion** | Flexible, custom roadmaps | Freemium |
| **Hellonext** | Public roadmap + changelog | Freemium |
| **LogChimp** | Open source feedback tracking | Free |
| **Screeb** | In-app user research | Freemium |

**Decision Guide:**

```
Need feedback + roadmap integrated? → productboard
Need public roadmap for users? → Hellonext
Already using Notion? → Build in Notion
Open source? → LogChimp
Need in-product research? → Screeb
```

### OKR & Outcome Tracking

> Core need: Track goals and measure outcomes.

| Tool | Best For | Cost |
|------|---------|------|
| **Tability** | Lightweight OKR tracking | Freemium ($35+/mo) |
| **Notion + templates** | Custom OKR dashboards | Freemium |
| **Spreadsheet** | Minimal overhead | Free |
| **Viva Goals** | Microsoft ecosystem | Part of M365 |

**Decision Guide:**

```
< 20 people? → Spreadsheet or Notion
Need async check-ins? → Tability
Microsoft shop? → Viva Goals
```

---

## 4. Workflow Optimization

### The PM Workflow Stack (Recommended)

| Activity | Recommended Setup |
|----------|------------------|
| **Daily capture** | Quick notes tool (Bear, Apple Notes, Notion) |
| **Weekly synthesis** | Knowledge management (Notion, Obsidian) |
| **Spec writing** | Docs tool (Notion, Google Docs) |
| **Sprint management** | Project tool (Linear, Jira, Trello) |
| **Roadmap sharing** | Integrated with project tool |
| **User research** | Dedicated storage + synthesis |
| **Metrics** | Analytics dashboard (separate from PM tools) |

### Workflow Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| **Tool sprawl** | 10+ tools, nothing used well | Consolidate to 3-4 core tools |
| **Tool tourism** | Switching tools every quarter | Commit for 6 months minimum |
| **Tool worship** | Believing tools fix process problems | Fix process first, then tool |
| **Over-customization** | Spending more time configuring than working | Use defaults, customize later |
| **No single source of truth** | Specs in 3 places, roadmap in 2 | Pick one tool per artifact type |

### Recommended Starter Stack by Team Size

| Solo PM | Small Team (3-8) | Growing Team (8-20) |
|---------|-----------------|-------------------|
| Notion + Excalidraw | Notion + Linear + Figma | Notion + Linear + Figma + productboard |
| $0/month | ~$50/month | ~$200/month |

---

## 5. Output Format

When recommending tools:

### Tool Recommendation

**Need:** [What problem this solves]

* **Recommended:** [Tool name]
* **Why:** [1-2 sentence rationale]
* **Alternative:** [Runner-up option]
* **Migration effort:** [Low / Medium / High]
* **Monthly cost:** [For your team size]
* **Integration notes:** [How it connects to existing tools]

---

## 6. Guardrails

* ❌ No tool recommendations without understanding team context
* ❌ No recommending enterprise tools for solo PMs
* ❌ No switching tools mid-project without migration plan
* ✅ Start simple, upgrade when needed
* ✅ The best tool is the one your team actually uses
* ✅ Optimize for fewer, better-integrated tools
* ✅ Always consider data export/portability

---

## 7. Key References

**Articles:** The Tools Don't Matter (Ken Norton)

**Resources:** Mobbin (design patterns) · awesome-product-management (GitHub)

---

## 8. Related Skills

* `product-development-process` – Process methodology that tools support
* `product-leadership` – Communication and documentation practices
* `product-metrics` – Analytics tool selection
* `analytics-tracking` – Event tracking implementation
