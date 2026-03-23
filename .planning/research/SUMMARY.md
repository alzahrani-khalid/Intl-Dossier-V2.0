# Project Research Summary

**Project:** Intl-Dossier v2.0 — Production Quality Milestone
**Domain:** Production hardening of a bilingual (Arabic/English) diplomatic dossier management app
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

This milestone is not a feature build — it is a hardening pass on an architecturally sound but inconsistently implemented codebase. The existing hexagonal backend, domain-driven frontend, and TanStack Router/Query data flow are fundamentally correct. The problem is that the patterns are not enforced: 90+ hooks bypass domain repositories, 3 naming conventions coexist in the same directories, mobile-era components were never cleaned up after the mobile app was cancelled, and critical security middleware (clearance checks, organization isolation) remains as placeholders. The recommended approach is to enforce the existing architecture rather than introduce new patterns.

The highest-risk gap is security: clearance-level middleware and organization isolation are unimplemented stubs, several Supabase tables lack proper RLS policies, and Express lacks Helmet/CSP hardening. These are blocking concerns for a diplomatic application handling classified data. The second-highest-risk area is the bilingual RTL/LTR implementation — physical CSS properties are scattered despite ESLint rules, `dir` attributes are set per-component instead of at the document root, and the four theme/direction combinations (dark/light x RTL/LTR) have no automated visual regression coverage.

The recommended execution order is driven by dependency: dead code removal must happen first to reduce surface area, then naming convention enforcement to stabilize the file structure, then security hardening (the critical blocker), then RTL/responsive consistency, then performance optimization, and finally accessibility compliance. Attempting security or RTL work before dead code removal wastes effort on files that will be deleted anyway.

## Key Findings

### Recommended Stack

The toolchain additions are targeted and conservative — no new frameworks, no bundler changes. The core additions are: ESLint 9 flat config (upgrade from v8) with typescript-eslint 8.x native config replacing the current `FlatCompat` shim; `eslint-plugin-security` for Node.js security patterns; `eslint-plugin-rtl-friendly` to replace the current fragile `no-restricted-syntax` regex approach; `prettier-plugin-tailwindcss` for class sorting; Knip v5 for dead code and dependency detection; `rollup-plugin-visualizer` for bundle analysis; `web-vitals` + Sentry Performance for real user metrics; and husky + lint-staged for pre-commit enforcement.

**Core technologies:**

- **ESLint 9 flat config**: Unified single root config — replace 3 separate workspace configs and all `.eslintrc.*` files
- **typescript-eslint 8.x**: Native flat config; remove `FlatCompat` shim from backend config
- **eslint-plugin-security 3.x**: 14 rules detecting eval, path injection, CSRF ordering — essential for Express backend
- **eslint-plugin-rtl-friendly**: Dedicated Tailwind RTL plugin with auto-fix; replaces fragile regex rules
- **prettier-plugin-tailwindcss**: Official Tailwind Labs class sorter; must be last in Prettier plugins array
- **Knip 5.x**: Dead code, unused exports, unused dependencies — the standard tool (ts-prune is deprecated)
- **rollup-plugin-visualizer 6.x**: Interactive bundle treemap for Vite; pin to v5 if Node < 22
- **web-vitals 4.x**: ~2KB; measures LCP/CLS/INP; Sentry captures automatically when configured
- **husky 9.x + lint-staged 15.x**: Pre-commit hooks; lint only staged files for fast feedback
- **@vitest/coverage-v8**: Coverage provider; thresholds — 70% statements, 60% branches

**Version alignment required:** ESLint 8.57 → 9.x in both frontend and backend workspaces.

**Do not use:** Biome (plugin gaps for tailwindcss/security), eslint-plugin-tailwindcss for class sorting (Tailwind v4 support incomplete), source-map-explorer (needs prod source maps), Snyk paid tier.

### Expected Features

The feature landscape is organized by risk priority, not by category.

**Must have — security (highest risk):**

- RLS policy audit on all Supabase tables — missing policies deny all access; critical for classified diplomatic data
- Clearance-level middleware implementation — current placeholder allows all access (CONCERNS.md)
- Organization isolation enforcement — `organization-check.ts` not implemented; data leaks between orgs
- Helmet with strict CSP — whitelist Supabase, Sentry, AnythingLLM origins
- CORS explicit origin allowlist — replace wildcard `*` with frontend origin
- Input validation on all endpoints — Zod schemas for every Express route handler
- Secrets/env audit — 7+ `.env` files; verify gitignored, no committed secrets
- Console.log audit — replace all with structured Winston logger; strip PII

**Must have — code quality:**

- Dead code detection with Knip — run baseline, add to CI as zero-tolerance gate after cleanup
- ESLint zero-warnings CI gate (`--max-warnings 0`)
- Pre-commit hooks (husky + lint-staged)

**Must have — RTL/responsive/accessibility:**

- Full logical properties audit (Tailwind classes AND inline styles AND third-party overrides)
- `dir` attribute at document root only via DirectionProvider, not per-component
- Mobile-first audit at 320px, 640px, 768px, 1024px, 1280px — especially tables and data-heavy views
- Touch target compliance — 44x44px minimum (`min-h-11 min-w-11`)
- WCAG 2.2 Level AA — legally required since EAA June 2025

**Should have (differentiators):**

- Automated performance budgets in CI (Lighthouse CI + size-limit)
- Sentry RUM with web-vitals integration (5 lines of code, Sentry already installed)
- Visual regression tests for all 4 theme/direction combinations (dark/light x RTL/LTR)
- Accessibility CI gate (axe-core in Playwright, already installed)
- Authorization middleware tests before implementing real clearance checks
- Dependency update automation (Renovate/Dependabot — important given HeroUI v3 beta status)

**Defer to future milestones:**

- Duplicate detection — new feature, not hardening; document stubs only
- Notification system buildout — feature work; wire basic Sentry alerts only
- WCAG AAA compliance — aspirational; AA is the legal requirement
- Database migration rollback testing — important but lower risk than security gaps

### Architecture Approach

The existing architecture is correct and must be enforced, not redesigned. The backend uses hexagonal architecture (API → Services → Adapters → Core Domain). The frontend uses domain-driven structure (Routes → Domain Hooks → Domain Repositories → HTTP). The critical enforcement gap is that only 3 frontend domain repositories exist (document, engagement, relationship) while 90+ hooks call the API directly with raw `fetch()`. Every data fetch must be routed through a domain repository in `frontend/src/domains/{feature}/repositories/`.

**Major components:**

1. **DirectionProvider** — single `<html dir>` setter; eliminates per-component `dir` attribute duplication
2. **Domain Repositories** — one repository class per backend resource; all hooks become thin `useQuery` wrappers
3. **Query Key Factories** — `{domain}Keys` objects co-located in each domain; enables precise cache invalidation
4. **Layout Primitives** — `PageLayout`, `ResponsiveGrid`, `SplitLayout` encode responsive breakpoint contracts
5. **Unified Error Shape** — `{ error: { code, message, details } }` on all API endpoints; frontend maps to i18n keys
6. **ESLint flat config** — single root `eslint.config.js` with workspace file-pattern overrides; delete all `.eslintrc.*`

**Cleanup order (hard dependencies):**
Phase 1 (dead code) → Phase 2 (naming) → Phase 3 (domain repos) || Phase 4 (design system) → Phase 5 (backend service dedup). Phases 3 and 5 can run in parallel once Phase 2 is complete.

### Critical Pitfalls

1. **Dead code removal breaks re-export chains** — The shadcn re-export pattern (`button.tsx` → `heroui-button.tsx`) causes Knip to flag re-export files as "unused." Removing them breaks all 500+ consumers. Fix: add `components/ui/` to Knip allowlist; `grep -r` every candidate before deletion; `pnpm build` after every batch of 10-20 removals.

2. **RLS policy changes cause silent data blackouts** — Supabase SQL Editor runs as postgres superuser, bypassing RLS. Policies that look correct in the editor silently return zero rows for real users. Fix: test every policy change via Supabase client SDK with a real authenticated token, never via SQL editor. Deploy to staging with 24-hour soak. Index all RLS policy columns.

3. **RTL logical property migration breaks LTR layouts** — Replacing `ml-4` with `ms-4` fixes RTL but breaks LTR when `dir` is missing (portals, modals rendered at `<body>` level). Fix: set `<html dir>` at root via DirectionProvider; explicitly set `dir` on portal containers; test BOTH directions after every change.

4. **Security middleware ordering breaks CORS/preflight** — Wrong middleware order causes OPTIONS preflight failures and drops Supabase Realtime websockets. Fix: enforce order Helmet → CORS → rate limiting → auth → routes. Whitelist `*.supabase.co` and `wss://*.supabase.co` in CSP. Dev CSP needs `'unsafe-eval'` for Vite HMR (strip in production).

5. **Console.log removal silences error handling** — Many `console.*` in catch blocks are the only error signal for Redis fallbacks, vector embedding failures, and search timeouts. Fix: audit each removal for `catch.*console` pattern; replace with structured logger atomically (never in separate commits).

## Implications for Roadmap

Based on combined research, the suggested phase structure is risk-driven and dependency-ordered.

### Phase 1: Foundation — Dead Code and Toolchain

**Rationale:** Dead code removal is a hard prerequisite — every pattern enforced on dead code is wasted effort. ESLint/Knip toolchain must be in place before code quality gates can enforce anything.
**Delivers:** Clean baseline with accurate dead code report; pre-commit hooks preventing new violations; single ESLint flat config replacing 3 separate configs.
**Addresses:** Dead code detection (Knip), unused dependency removal, pre-commit hooks (husky + lint-staged), ESLint zero-warnings gate, mobile-era component removal.
**Avoids:** Pitfall 1 (re-export chain breakage) — configure Knip allowlist for `ui/` wrappers before running; also Pitfall 12 (i18n key loss) — use `i18next-parser` before deleting any keys.

### Phase 2: Naming Conventions and File Structure

**Rationale:** Naming inconsistency (PascalCase vs kebab-case in same directories) must be resolved before domain repository consolidation can proceed — consistent names make the migration mechanical rather than ambiguous.
**Delivers:** Uniform naming across all layers via `git mv` with history preservation; no more autocomplete ambiguity; duplicate services identified and merged.
**Addresses:** Backend service naming (kebab-case.service.ts), frontend hook naming (camelCase), component naming (PascalCase), UI primitive naming (kebab-case).
**Avoids:** Pitfall 8 (deduplication loses behavioral nuance) — diff line-by-line before merging any service pair.

### Phase 3: Security Hardening

**Rationale:** The highest-risk gap in the codebase. Clearance middleware and org isolation are placeholders. RLS gaps expose classified diplomatic data. This phase is non-negotiable before any production use.
**Delivers:** Real clearance-level enforcement, org isolation, Helmet + CSP, CORS allowlist, input validation on all endpoints, secrets consolidation, eslint-plugin-security, structured logging replacing console.log.
**Addresses:** RLS policy audit, Helmet/CSP, CORS, Zod input validation, clearance middleware, org isolation, console.log/PII audit, auth edge cases.
**Avoids:** Pitfall 2 (RLS blackout — test via SDK, not SQL editor; staging soak) and Pitfall 4 (middleware ordering — Helmet first).
**Research flag:** Authorization middleware tests MUST be written before implementing real clearance checks.

### Phase 4: RTL/LTR Consistency

**Rationale:** Arabic is the primary user language. RTL inconsistencies cause daily friction. This phase consolidates all directional logic into the three-layer system (document root + logical properties + component exceptions only).
**Delivers:** DirectionProvider at document root, all physical CSS properties replaced with logical equivalents, per-component `dir` removed, icon direction audit complete, `eslint-plugin-rtl-friendly` enforcing going forward.
**Addresses:** Full logical properties audit, `dir` attribute consolidation, bidirectional text testing, icon direction audit (arrows/chevrons), theme switching visual regression (4 combinations).
**Avoids:** Pitfall 3 (logical properties break LTR) — test both directions after every change; set `dir` on portal/modal containers explicitly.

### Phase 5: Responsive Design and Touch Targets

**Rationale:** Mobile-first is mandated in CLAUDE.md but "not consistently implemented." Tables and data-heavy views are the hardest challenge and must be addressed systematically with layout primitives.
**Delivers:** PageLayout/ResponsiveGrid/SplitLayout primitives; all pages tested at 320px, 640px, 768px, 1024px, 1280px; touch targets at 44x44px minimum; data tables collapse to cards or scroll on mobile.
**Addresses:** Mobile-first audit, touch target compliance, breakpoint coverage for data tables, viewport meta verification.
**Avoids:** Pitfall 7 (desktop breaks while fixing mobile) — audit top-down from `lg:`, verify all breakpoints after every change.

### Phase 6: Domain Repository Consolidation

**Rationale:** The most impactful architectural pattern enforcement. Currently 90+ hooks bypass the domain repository layer. This phase makes data flow consistent and testable across all 13 backend API areas.
**Delivers:** Domain repositories for all 13 backend API areas (country, organization, forum, topic, working-group, person, elected-official, work-item, calendar, intelligence, position, search, ai-briefing); query key factories; all hooks become thin wrappers; raw `fetch()` eliminated from hooks.
**Addresses:** Domain repository pattern, query key factories, TanStack Query hook standardization.
**Avoids:** Pitfall 8 (deduplication loses nuance) — write tests for each call site before refactoring.

### Phase 7: Performance Optimization

**Rationale:** After the codebase is clean and architecture is enforced, performance optimization operates on a stable target. Bundle analysis is only meaningful after dead code is removed.
**Delivers:** Bundle under 200KB gzipped initial; CWV compliance (LCP < 2.5s, INP < 200ms, CLS < 0.1); Lighthouse CI in pipeline; Sentry RUM with web-vitals; Redis cache reliability monitoring.
**Addresses:** Core Web Vitals compliance, bundle size budget, route-level code splitting gaps, Redis cache reliability, database query optimization, image/asset optimization.
**Avoids:** Pitfall 6 (bundle splitting waterfall — group related deps in `manualChunks`); Pitfall 10 (over-memoization — profile first, trust React 19 compiler); Pitfall 11 (Tailwind v4 purge removes dynamic classes).

### Phase 8: Accessibility and WCAG AA

**Rationale:** EAA compliance has been legally required since June 2025. HeroUI v3 is React Aria-based and handles most accessibility correctly if used via compound component APIs. This phase audits and enforces compliance.
**Delivers:** WCAG 2.2 AA compliance, focus management on TanStack Router route changes, form error accessibility (`aria-describedby`, `aria-invalid`), Arabic screen reader testing (`lang="ar"` on Arabic content sections), accessibility CI gate (axe-core in Playwright).
**Addresses:** WCAG AA baseline, focus management on route changes, form error a11y, Arabic screen reader testing, coverage thresholds in CI.

### Phase Ordering Rationale

- Phase 1 (dead code) before everything else — Knip baseline on clean codebase is accurate; enforcing patterns on dead code wastes effort
- Phase 2 (naming) before Phase 6 (domain repos) — consistent names make repository migration mechanical
- Phase 3 (security) as early as possible — placeholder middleware is a production blocker regardless of code cleanliness
- Phase 4 (RTL) before Phase 5 (responsive) — direction system must be settled before layout primitives are built on top of it
- Phase 6 (domain repos) after naming — scaffolding 13 domains requires stable file naming first
- Phase 7 (performance) after dead code and domain repos — bundle analysis on clean, used code only
- Phase 8 (accessibility) last — HeroUI handles most a11y natively; this is verification and gap-filling

### Research Flags

Phases needing deeper research during planning:

- **Phase 3 (Security):** RLS audit requires a live Supabase dashboard review to enumerate tables without policies — this is a project-specific investigation, not researchable in advance
- **Phase 6 (Domain Repos):** Need to map which backend API routes exist per domain before scaffolding; 13 domains to create
- **Phase 8 (Accessibility):** Arabic screen reader behavior is under-documented; requires hands-on testing with VoiceOver in Arabic mode

Phases with standard patterns (skip research-phase):

- **Phase 1 (Dead Code):** Knip is well-documented; configuration is mechanical
- **Phase 2 (Naming):** Pure rename operations via `git mv`
- **Phase 5 (Responsive):** Tailwind breakpoint patterns are established; layout primitives are standard
- **Phase 7 (Performance):** web-vitals + Sentry is 5 lines of code; Lighthouse CI is well-documented

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                          |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | All tools are official/stable releases; ESLint 9 and typescript-eslint 8 are current release lines. One caveat: verify `eslint-plugin-rtl-friendly` Tailwind v4 compatibility before enabling. |
| Features     | HIGH       | Feature list derived directly from CONCERNS.md audit + official Supabase production checklist. Security features are non-negotiable; responsive/a11y verified against EAA requirements.        |
| Architecture | HIGH       | Existing architecture is documented and sound. Cleanup phases are dependency-ordered based on static analysis. Domain repository pattern is standard TanStack Query guidance.                  |
| Pitfalls     | HIGH       | Sourced from real-world RLS exposure reports (170+ apps affected), official Express security guides, and known HeroUI re-export chain behavior documented in MEMORY.md.                        |

**Overall confidence:** HIGH

### Gaps to Address

- **eslint-plugin-rtl-friendly Tailwind v4 compatibility:** Verify the plugin works with Tailwind v4 CSS variable syntax before enabling. If incompatible, fall back to enhanced `no-restricted-syntax` rules until plugin is updated.
- **rollup-plugin-visualizer Node version:** Requires Node >= 22 in v6+. Project runs Node 18+ LTS. Pin to v5.x if Node < 22, or use `vite-plugin-bundle-analyzer` as alternative.
- **RLS policy current state:** Cannot enumerate which specific tables have RLS gaps without a live Supabase dashboard audit — Phase 3's first task.
- **clearance_level column existence:** Assumes this column exists on users table per CONCERNS.md. Verify schema before implementing clearance middleware.
- **i18n key audit:** Knip may flag Arabic-only keys as unused (Pitfall 12). Run `i18next-parser` to extract used keys before any i18n deletion.

## Sources

### Primary (HIGH confidence)

- [ESLint flat config](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/) — ESLint 9 flat config API
- [typescript-eslint getting started](https://typescript-eslint.io/getting-started/) — typescript-eslint 8.x native flat config
- [Knip official site](https://knip.dev/) — dead code detection and monorepo configuration
- [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) — official Tailwind Labs class sorting
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) — RLS, security, performance
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — RLS performance and pitfalls
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) — Helmet, CORS, middleware ordering
- [Core Web Vitals](https://web.dev/articles/vitals) — LCP, INP, CLS thresholds
- [web-vitals npm](https://www.npmjs.com/package/web-vitals) — RUM integration
- [ESLint CSS support](https://eslint.org/blog/2025/02/eslint-css-support/) — @eslint/css plugin
- [eslint-plugin-security GitHub](https://github.com/eslint-community/eslint-plugin-security) — Node.js security rules

### Secondary (MEDIUM confidence)

- [Tailwind CSS v4 RTL logical properties](https://flowbite.com/docs/customize/rtl/) — logical property migration
- [Clean Architecture in Express.js](https://merlino.agency/blog/clean-architecture-in-express-js-applications) — hexagonal pattern validation
- [React Design Patterns 2025](https://www.uxpin.com/studio/blog/react-design-patterns/) — domain repository pattern
- [eslint-plugin-rtl-friendly npm](https://www.npmjs.com/package/eslint-plugin-rtl-friendly) — RTL enforcement plugin (Tailwind v4 compat unverified)
- [Socket.dev](https://socket.dev/) — supply chain security
- [WCAG 2.2 Compliance Checklist](https://www.allaccessible.org/blog/wcag-22-compliance-checklist-implementation-roadmap) — AA requirements

### Tertiary (LOW confidence)

- [170+ Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — RLS failure severity context
- [Supabase Security Retro 2025](https://supaexplorer.com/dev-notes/supabase-security-2025-whats-new-and-how-to-stay-secure.html) — general security posture

---

_Research completed: 2026-03-23_
_Ready for roadmap: yes_
