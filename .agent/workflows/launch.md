---
description: Launch & Deploy hub. Pre-flight checks, deploy to staging/production, product launch announcement, và post-launch monitoring. Gateway cuối cùng trước production.
---

# /launch — Launch & Deploy Hub 🎯

$ARGUMENTS

---

## Session Start: Plugin Check (RUN FIRST)

> [!IMPORTANT]
> Trước khi execute bất kỳ sub-command nào:
> 1. Đọc skill `superpowers-check` → EXECUTE detection logic
> 2. Ghi nhận kết quả: `SUPERPOWERS_AVAILABLE = true/false`
> 3. Kết quả ảnh hưởng pre-flight parallelization

---

## Subagent Execution Protocol (If SUPERPOWERS_AVAILABLE)

> [!NOTE]
> `/launch check` có thể dùng 3 parallel subagents cho pre-flight checks.

### Pre-Flight (3 parallel subagents):
```
Subagent 1: Code Quality (TypeScript + ESLint + Tests)
Subagent 2: Security (secrets + deps audit + env vars)
Subagent 3: Performance + Docs (bundle + console.log + README + CHANGELOG)

Wait for all → aggregate → gate decision
```

### Nếu SUPERPOWERS NOT AVAILABLE:
- Run all pre-flight checks sequentially

---

## Argument Routing (MANDATORY — Execute FIRST)

> [!IMPORTANT]
> **Parse `$ARGUMENTS` IMMEDIATELY and EXECUTE the matched sub-command.**
> "EXECUTE" means run ALL steps of that sub-command right now. Do NOT just describe or list options.

| `$ARGUMENTS` Pattern | Action |
|---|---|
| *(empty)* | **→ EXECUTE `/launch check`** — Run pre-flight checks, then offer deploy options |
| `check` | → EXECUTE `/launch check` |
| `preview` | → EXECUTE `/launch preview` |
| `prod` | → EXECUTE `/launch prod` |
| `rollback` | → EXECUTE `/launch rollback` |
| `announce` | → EXECUTE `/launch announce` |
| `monitor` | → EXECUTE `/launch monitor` |

---

## Purpose

`/launch` là gateway cuối cùng trước production — kết hợp pre-flight quality checks, deployment execution, launch announcement, và post-launch monitoring. **Không thể deploy nếu `/quality` fail.**

---

## Sub-commands

```
/launch                      Interactive launch wizard (default)
/launch check                Run pre-flight checks only
/launch preview              Deploy to preview/staging
/launch prod                 Deploy to production
/launch rollback             Rollback to previous version
/launch announce             Create launch announcement
/launch monitor              Post-launch health monitoring
```

---

## Mesh Connections

```
/launch ────► /quality audit   (pre-flight: MUST pass before deploy)
  │    ────► /market content   (post-launch: blog post, announcement)
  │    ────► /market analyze   (post-launch: track metrics)
  │    ────► deployment-procedures (safe deploy patterns)
  │    ────► devops            (Docker, K8s, CI/CD)
  │    ────► launch-strategy   (launch playbook)
  │
  │    ◄──── /cook             (Phase 6: deploy offer)
  │    ◄──── /ship             (Step 4: deploy offer)
  │    ◄──── /quality          (all checks passed → ready)
```

**HARD RULE:** `/launch prod` ALWAYS runs `/quality audit` first. Cannot be skipped.

---

## /launch check — Pre-Flight Checks

### Automated Checks

```markdown
## 🚀 Pre-Deploy Checklist

### Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] ESLint passing (`npx eslint .`)
- [ ] All tests passing (`npm test`)

### Security
- [ ] No hardcoded secrets (→ /quality secure)
- [ ] Environment variables documented
- [ ] Dependencies audited (`npm audit`)

### Performance
- [ ] Bundle size acceptable
- [ ] No console.log statements in production
- [ ] Images optimized

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API docs current (if applicable)
```

### Gate Decision

| Result | Action |
|--------|--------|
| All ✅ | Proceed to deploy |
| Any ⚠️ | **AskUserQuestion**: "Pre-flight warnings: [list]. [✅ Proceed / 🔧 Fix / ❌ Abort]" |
| Any ❌ | **AskUserQuestion**: "Pre-flight FAILED: [details]. [🔧 Fix / ❌ Abort]" |
| Security ❌ | **HARD BLOCK** (cannot override) |

---

## /launch preview — Deploy to Staging

1. Run pre-flight checks (abbreviated — skip manual items)
2. Build application:
   ```bash
   npm run build  # or detected build command
   ```
3. Deploy to preview environment:

   | Platform | Command | Auto-detect |
   |----------|---------|-------------|
   | Vercel | `vercel` | Next.js project |
   | Railway | `railway up` | Railway.toml exists |
   | Fly.io | `fly deploy` | fly.toml exists |
   | Docker | `docker compose up -d` | docker-compose.yml exists |
   | Netlify | `netlify deploy` | netlify.toml exists |

4. Health check after deploy:
   ```
   ✅ Preview deployed!
   🌐 URL: https://preview-abc123.vercel.app
   💚 Health: API responding (200 OK)
   ```

---

## /launch prod — Deploy to Production

**MANDATORY SEQUENCE:**

1. **Pre-flight** → `/quality audit` (MUST pass)
2. **Confirmation — AskUserQuestion:**
   ```
   🚀 Deploying to PRODUCTION
   
   ⚠️ This will affect real users.
   
   Changes:
   - [list of changes since last deploy]
   
   [🚀 Deploy to production] / [❌ Cancel]
   ```
3. **Build** → Production build
4. **Deploy** → Production platform
5. **Health check** → Verify all services responding
6. **Post-deploy verification:**
   - API endpoints responding
   - Database connected
   - Key user flows working

### Output

```markdown
## 🚀 Deployment Complete

### Summary
- **Version:** v1.2.3
- **Environment:** production
- **Duration:** 47 seconds
- **Platform:** Vercel

### URLs
- 🌐 Production: https://app.example.com
- 📊 Dashboard: https://vercel.com/project

### What Changed
- Added user profile feature
- Fixed login bug
- Updated dependencies

### Health Check
✅ API responding (200 OK)
✅ Database connected
✅ All services healthy

### Post-Deploy
▶ `/launch monitor` — Watch for issues
▶ `/market launch` — Create launch announcement
```

---

## /launch rollback — Rollback

1. Identify previous version
2. **AskUserQuestion**: "Rollback to [version]? [✅ Rollback / ❌ Cancel]"
3. Execute rollback:

   | Platform | Command |
   |----------|---------|
   | Vercel | Redeploy previous commit |
   | Railway | `railway rollback` |
   | Docker | `docker compose up -d --previous` |

4. Verify health after rollback

---

## /launch announce — Launch Announcement

Create launch communication:

1. **Generate changelog** from git commits since last release
2. **Draft announcement** for multiple channels:
   - Product Hunt launch post
   - Twitter/X thread
   - Blog post outline
   - Email to users
   - Discord/Slack message
3. **Handoff to `/market`** for full content creation

---

## /launch monitor — Post-Launch Monitoring

1. **Health checks** every 5 minutes for first hour:
   - HTTP status codes
   - Response times
   - Error rates
2. **Alert thresholds:**
   - Error rate > 5% → ⚠️ Warning
   - Error rate > 15% → ❌ Auto-rollback suggestion
   - Response time > 2x baseline → ⚠️ Warning
3. **Report + AskUserQuestion after monitoring period:**
   ```
   📊 Post-Launch Report (1 hour)
   
   ✅ Uptime: 100%
   ✅ Error rate: 0.2%
   ✅ Avg response: 145ms
   ✅ No anomalies detected
   
   Options:
   [📊 Continue monitoring] / [📣 Create announcement] / [⏹ Done]
   ```

---

## Error Handling

### Failed Deploy

```markdown
## ❌ Deployment Failed

### Error
Build failed at: TypeScript compilation

### Details
error TS2345: Argument of type 'string' is not assignable...

### Resolution
1. Fix TypeScript error in `src/services/user.ts:45`
2. Run `npm run build` locally to verify
3. Try `/launch` again

### Rollback Available
Previous version still active. Run `/launch rollback` if needed.
```

---

## Skills Used

- `deployment-procedures` — Safe deployment patterns
- `devops` — Docker, K8s, CI/CD, cloud platforms
- `launch-strategy` — Launch playbook
- `vulnerability-scanner` — Pre-deploy security

---

## Usage Examples

```
/launch
/launch check
/launch preview
/launch prod
/launch rollback
/launch announce
/launch monitor
```
