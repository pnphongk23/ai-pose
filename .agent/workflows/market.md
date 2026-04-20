---
description: Marketing hub. Campaign creation, content marketing, SEO, growth hacking, competitor analysis, và analytics. Tất cả marketing workflows trong 1 mesh hub.
---

# /market — Marketing Hub 📈

$ARGUMENTS

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched sub-command.**
> "EXECUTE" means run ALL steps of that sub-command right now. Do NOT just describe or list options.

### Core
| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ EXECUTE marketing overview** — Phân tích hiện trạng marketing, đề xuất priorities |
| `campaign <description>` | → EXECUTE `/market campaign` |
| `content <type>` | → EXECUTE `/market content` |
| `analyze` | → EXECUTE `/market analyze` |

### Conversion & Retention
| Pattern | Action |
|---|---|
| `cro <target>` | → EXECUTE `/market cro` |
| `signup` | → EXECUTE `/market signup` |
| `onboard` | → EXECUTE `/market onboard` |
| `churn` | → EXECUTE `/market churn` |

### SEO & Discovery
| Pattern | Action |
|---|---|
| `seo [flags]` | → EXECUTE `/market seo` với flags |
| `compete <competitor>` | → EXECUTE `/market compete` |

### Content & Copy
| Pattern | Action |
|---|---|
| `copy <page-type>` | → EXECUTE `/market copy` |
| `edit <target>` | → EXECUTE `/market edit` |
| `email <type>` | → EXECUTE `/market email` |
| `social <platform>` | → EXECUTE `/market social` |

### Paid & Ads
| Pattern | Action |
|---|---|
| `ads <platform>` | → EXECUTE `/market ads` |
| `ad-creative` | → EXECUTE `/market ad-creative` |

### Growth & Strategy
| Pattern | Action |
|---|---|
| `growth [stage]` | → EXECUTE `/market growth` |
| `tool <idea>` | → EXECUTE `/market tool` |
| `ab-test <hypothesis>` | → EXECUTE `/market ab-test` |

### Sales & Revenue
| Pattern | Action |
|---|---|
| `sales <asset>` | → EXECUTE `/market sales` |
| `revops` | → EXECUTE `/market revops` |

---

## Purpose

`/market` là hub tổng hợp mọi hoạt động marketing — từ nghiên cứu đối thủ, tạo chiến dịch, sản xuất content, tối ưu SEO/AEO, đến sales enablement và growth engineering. Mỗi sub-command là 1 chuyên gia, tất cả chia sẻ context và gọi chéo nhau.

> **Skills source:** [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) + Antigravity built-in marketing skills.

---

## Sub-commands

### Core
```
/market                          Overview: hiện trạng marketing (default)
/market campaign <description>   Tạo marketing campaign
/market content <type>           Content creation (blog, social, email, video)
/market analyze                  Marketing analytics & performance
```

### Conversion & Retention
```
/market cro <target>             CRO (any page: homepage, landing, pricing, feature)
/market signup                   Signup/registration flow optimization
/market onboard                  Post-signup activation optimization
/market churn                    Churn prevention (cancel flows, dunning, win-back)
```

### SEO & Discovery
```
/market seo [--ai] [--schema] [--pseo] [--arch]   SEO audit (flags: AI SEO, schema, programmatic, site architecture)
/market compete <competitor>                        Competitor teardown + alternative pages
```

### Content & Copy
```
/market copy <page-type>         Marketing copywriting (homepage, landing, pricing, feature, about)
/market edit <target>            Edit/polish existing copy (multi-pass review)
/market email <type>             Email sequences (nurture, cold, launch, winback)
/market social <platform>        Social content (LinkedIn, Twitter/X, Instagram, TikTok)
```

### Paid & Ads
```
/market ads <platform>           Paid ads (Google, Meta, LinkedIn, TikTok)
/market ad-creative              Bulk ad creative generation + iteration
```

### Growth & Strategy
```
/market growth [stage]           Growth experiments + AARRR + launch + pricing + ideas
/market tool <idea>              Free tool strategy (engineering as marketing)
/market ab-test <hypothesis>     A/B test design & statistical setup
```

### Sales & Revenue
```
/market sales <asset>            Sales enablement (deck, one-pager, proposal, demo-script, battlecard)
/market revops                   Revenue operations (lead scoring, routing, pipeline, CRM automation)
```

---

## Mesh Connections

```
/market ────► /build           (SEO/schema tech → implement)
  │    ────► /quality perf     (Core Web Vitals → CRO)
  │    ────► /launch announce  (post-deploy → marketing activation)
  │    ────► /spec             (free tool spec from marketing insights)
  │    ────► ui-ux-pro-max     (campaign design, landing pages)
  │    ────► ai-multimodal     (image/video generation)
  │    ────► chrome-devtools   (screenshot, audit, heatmap capture)
  │
  │    ◄──── /launch           (post-launch → marketing activation)
  │    ◄──── /cook             (final step → marketing suggestions)
  │    ◄──── /quality          (perf data for CRO decisions)
```

### Internal Skill Mesh (skills auto-call each other)

```
┌─────────────────────────────────────────────────────────────────────┐
│  copywriting ←→ page-cro ←→ ab-test-setup ←→ analytics-tracking   │
│  seo-audit ←→ schema-markup ←→ ai-seo ←→ site-architecture        │
│  email-sequence ←→ cold-email ←→ social-content                    │
│  free-tool-strategy ←→ seo-audit ←→ analytics-tracking             │
│  churn-prevention ←→ email-sequence ←→ onboarding-cro              │
│  competitor-teardown ←→ competitor-alternatives ←→ pricing-strategy │
│  revops ←→ sales-enablement ←→ cold-email ←→ copywriting           │
│  product-marketing-context → (foundation for ALL skills above)     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Foundation: Product Marketing Context

> **RULE:** Trước MỌI sub-command → check `product-marketing-context.md`.

### Khi file CHƯA tồn tại

**Option 1 (Recommended): Auto-draft từ codebase**
Agent tự đọc README, landing pages, package.json, marketing copy, meta descriptions → draft V1 → user review + correct.

**Option 2: Hỏi từng mục**
Walk through 12 sections conversationally:

| # | Section | Key Info |
|---|---------|----------|
| 1 | Product | One-liner, category, type, pricing |
| 2 | Audience | Company type, decision-makers, JTBD |
| 3 | Personas | User, Champion, Decision Maker (B2B) |
| 4 | Pain Points | Core problem, cost of inaction, emotion |
| 5 | Competitors | Direct, secondary, indirect — how each falls short |
| 6 | Differentiation | Key diffs, why better, why choose us |
| 7 | Objections | Top 3 + responses, anti-persona |
| 8 | Switching | Push, Pull, Habit, Anxiety (JTBD 4 Forces) |
| 9 | Language | Verbatim phrases to use/avoid, glossary |
| 10 | Brand Voice | Tone, style, personality |
| 11 | Proof Points | Metrics, logos, testimonials |
| 12 | Goals | Primary goal, conversion action, current metrics |

Lưu `docs/product-marketing-context.md` → auto-load lần sau.

**Skill:** `product-marketing-context` (242 lines, with template)

---

## /market campaign — Marketing Campaign

### Flow
1. **Brief:** Goal · Audience · Budget · Timeline · KPIs
2. **Strategy:** Positioning · Messaging · Channels · Creative direction
3. **Asset creation:**
   | Asset | Via |
   |-------|-----|
   | Landing pages | `/market copy` + `ui-ux-pro-max` |
   | Ad creative | `/market ad-creative` + `ai-multimodal` |
   | Email sequences | `/market email nurture` |
   | Social content | `/market social` |
   | Blog/SEO | `/market content blog` |
   | Sales collateral | `/market sales deck` |
4. **Launch:** Tracking setup (UTMs, pixels, events → `analytics-tracking`) → A/B setup → go live
5. **Monitor & iterate:** `/market analyze` → double down on winners

**Optional:** HTML presentation → `ui-ux-pro-max` | Video ads → `video-automation` + Remotion

**Skills:** `content-marketing`, `social-media-expert`, `email-marketing`, `analytics-tracking`, `social-content`

---

## /market cro — Conversion Rate Optimization

### Analysis Framework (Impact Order)

1. **Value Proposition** — Strangers understand in 5s? Passes "So what?" test?
2. **CTA** — Visible above fold, outcome-focused copy, one per view?
3. **Social Proof** — Logos, testimonials with specifics, credible numbers?
4. **Friction** — How many form fields? Progressive disclosure? Transparent pricing?
5. **Messaging** — Benefit-driven? Scannable? Proactively addresses objections?

### Sub-types (auto-detected based on `<target>`)

| Target | Skill | Focus |
|--------|-------|-------|
| Homepage/Landing/Feature/Blog | `page-cro` | Full page audit |
| Signup/Registration form | `signup-flow-cro` | Reduce form friction |
| Post-signup flow | `onboarding-cro` | Time-to-value optimization |
| Lead forms (not signup) | `form-cro` | Field optimization, multi-step |
| Popups/modals | `popup-cro` | Trigger timing, exit intent |
| In-app upgrade screens | `paywall-upgrade-cro` | Upsell moments |

### Output Format

```markdown
### Quick Wins (now)       → Easy, immediate impact
### High-Impact (prioritize) → Bigger effort, bigger return
### Test Ideas             → Hypotheses for /market ab-test
### Copy Alternatives      → 2-3 headline/CTA options with rationale
```

**Skills:** `page-cro` (315 lines), `signup-flow-cro`, `onboarding-cro`, `form-cro` (429 lines), `popup-cro`, `paywall-upgrade-cro`

---

## /market churn — Churn Prevention

### Types

| Type | % | Solution |
|------|---|----------|
| **Voluntary** | 50-70% | Cancel flows, save offers, exit surveys |
| **Involuntary** | 30-50% | Dunning emails, smart retries, card updaters |

### Cancel Flow

```
Intent → Exit survey → Dynamic save offer → Pause option → Confirm → Win-back
```

| Cancel Reason | Dynamic Offer |
|--------------|---------------|
| Too expensive | Discount / downgrade / pause |
| Not using enough | Training / activation push |
| Missing feature | Roadmap commitment + timeline |
| Switching competitor | Competitive response + migration warning |

### Dunning (Payment Recovery)

```
Day 0:  Retry + "Payment issue" (friendly, card update link)
Day 3:  Retry + "Quick reminder"
Day 5:  Retry + "Access at risk" (urgency)
Day 7:  Final retry + "Last chance"
Day 10: Grace ends → downgrade/cancel
```

> **Reference data:** `churn-prevention/references/cancel-flow-patterns.md` + `dunning-playbook.md`

### Diagnostic Questions

1. Current churn rate? Monthly/annual breakdown?
2. Cancel flow exists or instant cancel?
3. Billing provider? (Stripe, Paddle, Chargebee)
4. Track feature usage per user?
5. B2B or B2C?

**Skills:** `churn-prevention` (424 lines), `email-sequence`, `onboarding-cro`, `analytics-tracking`

---

## /market seo — SEO & Discovery

### Flags

```
/market seo              Full SEO audit (technical + on-page)
/market seo --ai         + AI search optimization (AEO/GEO/LLMO)
/market seo --schema     + Structured data / JSON-LD
/market seo --pseo       + Programmatic SEO
/market seo --arch       + Site architecture / hierarchy
/market seo --all        Everything above
```

### Technical SEO Audit

Meta tags · Sitemap · Robots.txt · Core Web Vitals (LCP<2.5s, FID<100ms, CLS<0.1) · Mobile · Canonical · 404s

### On-Page SEO

H1 hierarchy → Image alt text → Internal linking → Content depth → Keyword distribution

### `--ai` AI Search Optimization

Optimize to be **cited by AI engines** (ChatGPT, Perplexity, Claude, AI Overviews):
- **Structure** for extraction (headers, lists, tables, FAQ format)
- **Authority signals** (Wikipedia, review sites, original data)
- **Direct answers** ("What is X?" → First sentence IS the answer)
- **Monitor** which queries cite you vs competitors

> **Deep guide:** `ai-seo/SKILL.md` — AEO/GEO/LLMO frameworks, entity optimization, monitoring setup

### `--schema` Structured Data

Audit + implement JSON-LD: FAQ, HowTo, Article, Product, BreadcrumbList, Organization

> **Examples:** `schema-markup/references/schema-examples.md`

### `--pseo` Programmatic SEO

Template pages at scale: pattern identification → template design → unique value per page → internal linking → quality gates

### `--arch` Site Architecture

Page hierarchy design (3-click rule), URL strategy, navigation structure, breadcrumbs, visual sitemap (Mermaid), internal linking strategy

> **Templates:** `site-architecture/references/site-type-templates.md`

### Implementation

Technical fixes → mesh to `/build`. Content fixes → create directly.

**Skills:** `seo-audit`, `geo-fundamentals`, `schema-markup` (179L), `programmatic-seo`, `keyword-research-deep`, `site-architecture` (358L), `ai-seo`

---

## /market email — Email Sequences

### Types

```
/market email nurture    Welcome/onboarding sequence
/market email cold       B2B cold outreach
/market email launch     Product launch announcement
/market email winback    Win-back churned users
```

### Cold Email (B2B)

**3 Rules:** Short (<100 words) · Relevant (personalized) · Asks little ("Worth a look?")

**Frameworks:**
- **Observation → Insight → Ask:** "Noticed X. Usually causes Y. Curious?"
- **Trigger → Insight → Ask:** "Congrats on [event]. Creates [challenge]."
- **Story → Bridge → Ask:** "[Company] had [problem]. [Solved it]. Relevant?"

**Subject Lines:** 2-4 words, lowercase, colleague-style

**Follow-ups:** 4-6 touches / 2-3 weeks. Each adds NEW angle. Breakup email: "Close the loop?"

> **Deep data:** `cold-email/references/` — benchmarks.md, frameworks.md, subject-lines.md, personalization.md, follow-up-sequences.md

### Nurture Sequence

Day 0: Welcome + quick win → Day 1: Core value → Day 3: Social proof → Day 5: Feature → Day 7: Objections → Day 10: Soft CTA → Day 14: Hard CTA

> **Templates:** `email-sequence/references/sequence-templates.md` + `copy-guidelines.md`

**Skills:** `email-sequence` (309L), `cold-email` (158L + 5 ref files), `email-marketing`, `copywriting`

---

## /market copy — Copywriting

### Frameworks by Page Type

| Page | Framework |
|------|-----------|
| Homepage | Problem → Solution → Proof → CTA |
| Landing | AIDA (Attention → Interest → Desire → Action) |
| Feature | Feature → Benefit → Proof |
| Pricing | Anchor → Compare → Recommend |
| About | Origin → Mission → Team → Values |

### Copy Quality

✅ Benefit-driven · ✅ Specific numbers · ✅ Conversational · ✅ Scannable · ✅ 1 CTA/section · ✅ Addresses objections
❌ No jargon · ❌ No "we" focus · ❌ No buzzwords · ❌ No "leading provider" clichés

### `/market edit` — Copy Editing (Multi-Pass)

Systematic editing through focused passes: Clarity → Structure → Persuasion → Voice → Polish

> **Reference:** `copy-editing/references/plain-english-alternatives.md` (447 lines of editing patterns)

**Skills:** `copywriting`, `copy-editing` (447L), `content-marketing`

---

## /market social — Social Media Content

### Platforms

```
/market social linkedin     Professional content, thought leadership
/market social twitter      Short-form, threads, engagement
/market social instagram    Visual stories, reels, carousels
/market social tiktok       Short-form video, trends
```

### Content Types: Thread · Carousel · Story · Poll · Video · Infographic · Behind-the-scenes

### Content Calendar: Generate 2-4 weeks of platform-specific posts from a single topic/event

> **Templates:** `social-content/references/post-templates.md` + `reverse-engineering.md` + `platforms.md`

**Skills:** `social-content` (278L), `social-media-expert`, `content-repurposing-pipeline`

---

## /market ads — Paid Advertising

### Platforms

```
/market ads google      Google (Search, Display, YouTube, PMax)
/market ads meta        Meta (Facebook, Instagram, Reels)
/market ads linkedin    LinkedIn (Sponsored Content, InMail)
/market ads tiktok      TikTok (In-Feed, TopView, Spark)
```

### Setup: Objective → Audience → Budget → Creative → Landing page → Tracking

> **Deep guides:** `paid-ads/references/` — platform-setup-checklists.md, audience-targeting.md, ad-copy-templates.md

### `/market ad-creative` — Bulk Generation

Generate at scale for testing:
- 5+ headline options + 3 descriptions + 3 visual concepts (→ `ai-multimodal`)
- Platform character limits enforced automatically
- Performance-based iteration (feed winners data → generate new variants)

> **Specs:** `ad-creative/references/platform-specs.md` + `generative-tools.md`

**Skills:** `paid-ads` (315L), `ad-creative` (362L), `analytics-tracking`

---

## /market growth — Growth & Strategy

### Modes

```
/market growth              AARRR funnel analysis + experiments (default)
/market growth launch       Product launch playbook
/market growth pricing      Pricing strategy & packaging
/market growth ideas        140+ SaaS marketing ideas
```

### AARRR Funnel

| Stage | Focus | Key Metric |
|-------|-------|------------|
| **Acquisition** | How users find us | CAC, traffic sources |
| **Activation** | First value experience | Activation rate, TTV |
| **Retention** | Users come back | DAU/MAU, churn, D7/D30 |
| **Referral** | Users tell others | Viral coefficient, NPS |
| **Revenue** | Users pay | ARPU, LTV, conversion |

### Experiment Loop

1. **Identify** weakest stage → `/market analyze`
2. **Ideate** 10+ experiments → `brainstorming`, `marketing-ideas`, `marketing-psychology`
3. **ICE score** — Impact × Confidence × Ease → prioritize top 3
4. **Design test** → `/market ab-test` (hypothesis, control, variant, sample)
5. **Run** 1-2 weeks → statistical significance
6. **Scale or kill** — Double down on winners

### Product Launch Playbook

**Pre-Launch (2w):** Teaser → waitlist → prep assets → line up distribution
**Launch Day:** Product Hunt + social blitz + email blast + community + founder outreach
**Post-Launch (2w):** Monitor → share wins → nurture leads → iterate

### Pricing Strategy

| Model | Best For |
|-------|----------|
| Freemium | Consumer, viral growth |
| Free trial | B2B SaaS |
| Usage-based | APIs, infrastructure |
| Tiered | Most SaaS |

Pricing page: Default recommended → annual toggle → feature table → FAQ → guarantee

**Skills:** `growth-hacking`, `marketing-ideas`, `marketing-psychology`, `launch-strategy`, `pricing-strategy`, `referral-program`, `viral-generator-builder`

---

## /market tool — Free Tool Strategy

### Engineering as Marketing

Build free tools that attract users, generate leads, and create SEO value.

### Ideation: Pain points? · Manual processes? · Pre-purchase needs? · Info gaps?
### Validation: Search demand? · 10x better? · Audience = buyers? · Ship <2 weeks?

| Type | Examples | Best For |
|------|----------|----------|
| Calculators | ROI, savings, pricing | Lead gen, SEO |
| Generators | Names, emails, prompts | Viral, shareability |
| Audit tools | SEO, security, speed | Authority, leads |
| Converters | Units, formats, dates | SEO, utility |

After build: `/market cro` → `/market seo` → `/market email nurture`

> **Reference:** `free-tool-strategy/references/tool-types.md`

**Skills:** `free-tool-strategy` (178L), `viral-generator-builder`, `analytics-tracking`

---

## /market compete — Competitor Analysis

### Teardown Process

1. **Website:** Design, messaging, features, pricing, UX
2. **Social media:** Platforms, frequency, engagement, content types
3. **Ads:** Meta Ad Library, Google Ads Transparency → active campaigns
4. **SEO:** Keywords, rankings, backlinks, content gaps
5. **Product:** Features, pricing tiers, positioning, free trial
6. **AI visibility:** Cited by AI engines? (→ `/market seo --ai`)

### Competitor Pages (SEO + Sales)

4 formats: `[Competitor] vs [You]` · `[Competitor] alternatives` · Feature comparison tables · Migration guides

> **Architecture:** `competitor-alternatives/references/content-architecture.md` + `templates.md`

**Skills:** `competitor-teardown-agent`, `competitor-monitor-alert`, `competitor-alternatives` (256L)

---

## /market sales — Sales Enablement ✨ NEW

### Asset Types

```
/market sales deck          Pitch deck (10-12 slide framework)
/market sales one-pager     One-pager / leave-behind (single page summary)
/market sales proposal      Proposal template (executive summary → solution → pricing → timeline)
/market sales objections    Objection handling doc (top objections + responses)
/market sales demo          Demo script + talk track
/market sales battlecard    Competitive battle card
/market sales roi           ROI calculator design
/market sales playbook      Sales playbook (full suite)
```

### Pitch Deck Framework (10-12 slides)

1. Current World Problem → 2. Cost of Problem → 3. The Shift → 4. Your Solution → 5. How It Works → 6. Results/Proof → 7. Social Proof → 8. Pricing → 9. Objection Handling → 10. Next Steps

### Persona-Specific Messaging

| Persona | Wants | Doesn't Care About |
|---------|-------|-------------------|
| Technical buyer | Architecture, security, API | ROI calculations |
| Economic buyer | ROI, payback, risk | Technical details |
| Champion | Quick wins, peer proof | Deep technical/financial |
| End user | Ease of use, workflow fit | Enterprise features |

### Case Study Format

Situation (2 sentences) → Challenge → Solution → Results (3 metrics before/after) → Pull quote → Tags (industry, size, persona)

> **Deep frameworks:** `sales-enablement/references/deck-frameworks.md`

**Skills:** `sales-enablement` (350L), `copywriting`, `competitor-alternatives`

---

## /market revops — Revenue Operations ✨ NEW

### Lead Lifecycle

```
Subscriber → Lead → MQL → SQL → Opportunity → Customer → Advocate
```

### Lead Scoring

| Dimension | Signals |
|-----------|---------|
| **Explicit (fit)** | Company size, industry, title, seniority, tech stack |
| **Implicit (engagement)** | Page visits (pricing=high), content downloads, email engagement |

### Routing Methods

| Method | Best For |
|--------|----------|
| Round-robin | Equal territories |
| Territory-based | Regional teams |
| Account-based | Named accounts |
| Hybrid | Score + territory |

### Pipeline Stages

Qualified → Discovery → Demo/Eval → Proposal → Negotiation → Closed Won/Lost

### CRM Automations

- Lifecycle stage auto-advance
- Task creation on MQL handoff
- SLA alerts (rep misses response time)
- Deal stage triggers (auto-proposals, forecast updates)
- Data hygiene (monthly: dedup, validate, archive stale)

### Key Metrics

| Metric | Benchmark |
|--------|-----------|
| Lead→MQL | 5-15% |
| MQL→SQL | 30-50% |
| SQL→Opp | 40-60% |
| Win rate | 20-35% |
| Speed-to-lead | <5 min |

> **Deep reference:** `revops/references/lifecycle-definitions.md` + `scoring-models.md`

**Skills:** `revops` (344L), `analytics-tracking`, `sales-enablement`, `cold-email`

---

## /market ab-test — A/B Test Design

### Setup

1. **Hypothesis:** "If [change], then [metric] will [improve] because [reason]"
2. **Variables:** What exactly changes?
3. **Sample size:** Calculate for statistical significance
4. **Duration:** Min 2 weeks, full business cycle
5. **Guard rails:** Secondary metrics that must not drop

### Common Tests

| Element | Variations |
|---------|-----------|
| Headlines | Benefit vs feature, question vs statement |
| CTAs | Copy, color, placement, size |
| Forms | Field count, layout, progressive disclosure |
| Pricing | Display, anchoring, plan names |
| Social proof | Logos vs testimonials vs numbers |

> **Reference:** `ab-test-setup/references/sample-size-guide.md` + `test-templates.md`

**Skills:** `ab-test-setup` (266L), `ab-test-dashboard`, `analytics-tracking`

---

## /market analyze — Analytics

### Data Sources

| Source | Metrics |
|--------|---------|
| GA4 | Sessions, sources, engagement, conversions |
| Ads | Spend, ROAS, CPA, CTR |
| Email | Open, CTR, revenue per send |
| Social | Reach, engagement rate, clicks |
| CRM | Leads, MQLs, pipeline, LTV |

### Framework

Working → scale · Not working → diagnose/cut · Trends → predict · Quick wins → implement · Experiments → `/market ab-test`

> **Event tracking:** `analytics-tracking/references/ga4-implementation.md` + `event-library.md` + `gtm-implementation.md`

**Skills:** `analytics-tracking` (309L), `conversion-optimization`

---

## Key Principles

1. **Context first** — Always load product marketing context before any work
2. **Data first** — Measure before optimizing, no opinion without data
3. **Cross-reference** — Skills call each other automatically via `Related Skills`
4. **Reference files** — Each skill has `references/` with deep tactical data (benchmarks, templates, frameworks)
5. **Test everything** — Use `/market ab-test` to validate changes
6. **Mesh integration** — Marketing feeds product, product feeds marketing

---

## Usage Examples

```
/market                                         # Overview
/market campaign Black Friday sale              # Full campaign
/market cro /pages/converter                    # CRO audit
/market churn cancel                            # Cancel flow design
/market seo --all                               # Complete SEO audit
/market copy homepage                           # Write homepage copy
/market edit /pages/pricing                     # Polish existing copy
/market email cold                              # B2B cold outreach
/market social linkedin                         # LinkedIn content
/market ads meta                                # Meta Ads campaign
/market ad-creative                             # Bulk ad generation
/market growth                                  # AARRR experiments
/market growth launch                           # Product launch playbook
/market tool "lunar calendar widget"            # Free tool strategy
/market compete moonphase.io                    # Competitor teardown
/market sales deck                              # Pitch deck creation
/market sales objections                        # Objection handling doc
/market revops                                  # Lead scoring + pipeline setup
/market ab-test "shorter form = more signups"   # Design A/B test
/market analyze                                 # Analytics review
```