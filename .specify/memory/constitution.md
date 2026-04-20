# MoonLich Project Constitution

> **Version:** 1.0.0
> **Created:** 2026-03-01
> **Project:** MoonLich — Vietnamese Lunar Calendar Platform
> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Vitest · next-intl

---

## 1. Code Quality Principles

### 1.1 TypeScript-First

- **Strict mode is mandatory** — `tsconfig.json` has `"strict": true`, never disable it
- **No `any` type** — Use `unknown` + type guards instead. Every function parameter and return value must be typed
- **Prefer `interface` for public contracts** — Use `type` for unions, intersections, and utility types
- **Zero `@ts-ignore`** — If it can't be typed, the design is wrong

### 1.2 Clean Code Standards

- **Self-documenting code** — Names explain WHAT, comments explain WHY (never HOW)
- **Single Responsibility** — Each function does one thing. Max 40 lines per function, max 300 lines per file
- **No dead code** — Unused imports, variables, and functions are removed immediately
- **Early returns** — Avoid deep nesting. Guard clauses first, happy path last
- **Constants over magic values** — All configuration values in `src/lib/constants.ts`

### 1.3 File & Directory Organization

```
src/
├── app/              # Next.js App Router pages (routing only, minimal logic)
├── components/       # Reusable UI components (presentation layer)
├── lib/              # Core business logic, algorithms, utilities
├── content/          # MDX blog content (vi/en)
├── i18n/             # Internationalization messages & config
├── stores/           # Zustand state management
└── test/             # Test setup and shared test utilities
```

- **Components** — No business logic in components. Components render, `lib/` calculates
- **Colocation** — Component-specific styles, tests, and types live next to the component
- **Barrel exports** — Each directory has an `index.ts` when it has 3+ public exports

### 1.4 Import Rules

- **Path alias** — Always use `@/` alias (e.g. `@/lib/algorithm`) — never relative paths beyond `./` or `../`
- **Import order** — External → Internal → Types → Styles (enforced by ESLint)
- **No circular dependencies** — `lib/` never imports from `components/` or `app/`

---

## 2. Testing Standards

### 2.1 Test Framework & Config

- **Runner:** Vitest with jsdom environment
- **Coverage:** V8 provider, focused on `src/lib/**/*.ts`
- **Assertions:** `@testing-library/jest-dom` for DOM, Vitest built-in for logic
- **File convention:** `*.test.ts` or `*.test.tsx`, colocated with source

### 2.2 Testing Pyramid

| Layer | What | Coverage Target | Runner |
|-------|------|----------------|--------|
| **Unit** | `src/lib/` algorithms & utils | **≥ 90%** | Vitest |
| **Component** | Isolated component rendering | **≥ 70%** critical paths | Vitest + RTL |
| **Integration** | Page-level rendering, i18n flow | Key pages only | Vitest + RTL |
| **E2E** | User journeys (future) | Critical flows | Playwright (when added) |

### 2.3 Testing Rules

- **AAA pattern** — Arrange, Act, Assert. Each test block follows this structure clearly
- **No test interdependency** — Each test runs independently. No shared mutable state
- **Descriptive names** — `it('should return lunar date for solar date 2026-03-01 in ICT timezone')` not `it('works')`
- **Edge cases are mandatory** for `src/lib/` — Boundary dates, timezone extremes, invalid inputs
- **Algorithm tests are regression tests** — Never change expected output without explicit justification
- **Test before refactor** — If a function has no test, write one BEFORE modifying it

### 2.4 Test Commands

```bash
# Run all tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run with coverage
npx vitest run --coverage

# Run specific file
npx vitest run src/lib/algorithm.test.ts
```

---

## 3. User Experience Consistency

### 3.1 Design System Principles

- **Dark-first design** — Primary theme is dark, light mode is secondary
- **Cultural sensitivity** — Red = auspicious/good, Green = neutral, Colors respect Vietnamese Feng Shui associations
- **Mobile-first responsive** — Design for 360px width first, scale up to 1440px
- **Consistent spacing** — Use Tailwind spacing scale (4px base unit). No arbitrary pixel values

### 3.2 Component UX Standards

- **Loading states** — Every async operation shows a skeleton or spinner. No blank screens
- **Error states** — User-friendly Vietnamese/English messages. Never expose technical errors
- **Empty states** — Meaningful message + suggested action when no data is available
- **Interactive feedback** — All clickable elements have hover/active/focus states
- **Animations** — Use `framer-motion` for page transitions and micro-interactions. Max 300ms duration for UI feedback, max 500ms for page transitions

### 3.3 Internationalization (i18n)

- **All user-facing text** must go through `next-intl` — No hardcoded strings in components
- **Vietnamese is primary locale** — All new content starts in Vietnamese, English follows
- **Number/Date formatting** — Use locale-aware formatters, never manual string concatenation
- **RTL-awareness** — Not required currently but use logical properties (`start`/`end`) over `left`/`right`

### 3.4 Accessibility Baseline

- **Semantic HTML** — Use `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>` appropriately
- **ARIA when needed** — Only add `aria-*` when semantic HTML is insufficient
- **Keyboard navigation** — All interactive elements reachable via Tab. Escape closes modals/menus
- **Color contrast** — Minimum WCAG AA (4.5:1 for text, 3:1 for large text)
- **Focus visibility** — All focusable elements have visible focus indicators

---

## 4. Performance Requirements

### 4.1 Core Web Vitals Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| **LCP** (Largest Contentful Paint) | ≤ 2.0s | ≤ 2.5s max |
| **INP** (Interaction to Next Paint) | ≤ 150ms | ≤ 200ms max |
| **CLS** (Cumulative Layout Shift) | ≤ 0.05 | ≤ 0.1 max |
| **FCP** (First Contentful Paint) | ≤ 1.2s | ≤ 1.8s max |
| **TTFB** (Time to First Byte) | ≤ 400ms | ≤ 800ms max |

### 4.2 Bundle & Asset Rules

- **No client-side JS for static content** — Blog pages, about page, calendar view = Server Components by default
- **`'use client'` is explicit** — Only add when state, effects, or browser APIs are needed. Document WHY
- **Image optimization** — All images through `next/image`. WebP format preferred. Lazy loading for below-fold
- **Font loading** — `next/font` with `display: swap`. Max 2 font families
- **Bundle size budget** — Total JS < 150KB gzipped for initial page load

### 4.3 Data & Computation

- **Lunar algorithm** — Must compute any date in < 5ms. No network calls for date calculations
- **SSR/ISR preference** — Static generation for blog posts, SSR for dynamic calendar pages
- **Cache strategy** — Blog content = ISR (revalidate: 3600). Calendar = dynamic with edge caching
- **No waterfall requests** — Parallel data fetching with `Promise.all()` or React Server Components
- **Pagination** — Blog listing max 10 per page. Never load all content at once

### 4.4 SEO & GEO Performance

- **JSON-LD** — Every page must have appropriate structured data schema
- **Meta tags** — Every page must have unique `title`, `description`, and `og:*` tags
- **Sitemap** — Auto-generated, max 100 high-priority URLs
- **AI crawler access** — `robots.txt` must allow GPTBot, Claude-Web, PerplexityBot
- **`llms.txt`** — Keep updated when new features or FAQ items are added

---

## 5. Security Baseline

- **No secrets in code** — All API keys, tokens in environment variables
- **Input validation** — All user inputs sanitized server-side before processing
- **HTTPS only** — All external API calls use HTTPS
- **CSP headers** — Content Security Policy configured in `next.config.ts`
- **Dependencies** — Run `npm audit` monthly. No known critical vulnerabilities

---

## 6. Git & Workflow Standards

- **Branch naming** — `feature/short-name`, `fix/short-name`, `chore/short-name`
- **Commit messages** — Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `perf:`
- **PR requirement** — Every change must pass: `npm run lint` + `npx tsc --noEmit` + `npx vitest run`
- **No force push** — To `main` or `staging` branches. Ever

---

## Changelog

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 1.0.0 | 2026-03-01 | MAJOR | Initial constitution — Code quality, testing, UX, performance |
