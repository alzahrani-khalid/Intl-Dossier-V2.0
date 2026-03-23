# Feature Landscape

**Domain:** Production-quality hardening for a bilingual (Arabic/English) diplomatic dossier management app
**Researched:** 2026-03-23

## Table Stakes

Features users (and operators) expect. Missing = production fragility, security exposure, or professional embarrassment.

### Code Quality & Dead Code

| Feature                                | Why Expected                                                                 | Complexity | Notes                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Dead code detection with Knip          | Unused exports, files, and dependencies bloat bundle and confuse maintainers | Low        | Knip is the standard tool (ts-prune deprecated). Run `npx knip` -- works out of the box for most projects. Add to CI. |
| Unused dependency removal              | Large dep tree (AI/ML libs, PDF, multiple ORMs) likely has orphans           | Low        | Knip detects unused deps in package.json. Cross-reference with `pnpm why`.                                            |
| Consistent hook naming                 | Mix of `useAuth.ts` and `use-compliance.ts` naming conventions               | Low        | Pick one (kebab-case per modern convention), rename systematically.                                                   |
| ESLint zero-warnings CI gate           | Warnings accumulate into real bugs when ignored                              | Low        | Already have good ESLint config; enforce `--max-warnings 0` in CI.                                                    |
| TypeScript strict mode audit           | Strict mode enabled but `any` casts may exist via escape hatches             | Med        | Run grep for `as any` and `@ts-ignore` to find escape hatches. Eliminate or document each.                            |
| Pre-commit hooks (husky + lint-staged) | Prevent broken code from being committed                                     | Low        | Standard setup, enforces all lint/format rules before commit.                                                         |

### Security Hardening

| Feature                                           | Why Expected                                                      | Complexity | Notes                                                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| RLS policy audit on ALL tables                    | Supabase tables without RLS = public data. CONCERNS.md flags gaps | High       | Use Supabase dashboard to list tables, verify every table has RLS enabled with non-trivial policies. Test with different user roles.    |
| Helmet with strict CSP                            | Express must set Content-Security-Policy, X-Frame-Options, etc.   | Med        | Use `helmet()` with custom CSP. Test in report-only mode first. CSP is the strongest XSS protection but breaks things if misconfigured. |
| CORS explicit origin allowlist                    | Misconfigured CORS is a top data exposure vector                  | Low        | Replace wildcard `*` with explicit frontend origin(s).                                                                                  |
| Input validation on all endpoints                 | CONCERNS.md flags missing validation on several services          | High       | Use Zod schemas for request body/params validation. Every Express route handler must validate before processing.                        |
| Auth edge case hardening                          | JWT expiry, refresh token rotation, session invalidation          | Med        | Supabase Auth handles most of this, but verify: expired token handling, concurrent session limits, logout clears all tokens.            |
| Clearance-level middleware implementation         | Currently a placeholder that allows all access (CONCERNS.md)      | High       | Implement real clearance checks with `clearance_level` column on users. Security-critical for classified diplomatic data.               |
| Organization isolation enforcement                | `organization-check.ts` not implemented (CONCERNS.md)             | High       | Without this, data leaks between organizations. Must query org mapping and validate before every entity access.                         |
| Secrets/env audit                                 | 7+ .env files across directories (CONCERNS.md)                    | Low        | Verify all in .gitignore. Consolidate to single source of truth per environment. Remove any committed secrets from git history.         |
| Console.log audit for PII                         | Email content, request data logged to stdout (CONCERNS.md)        | Med        | Replace all `console.log` with structured Winston logger. Strip sensitive fields (email body, auth tokens, PII).                        |
| Security static analysis (eslint-plugin-security) | Catch eval, path injection, CSRF ordering in Express              | Low        | Single ESLint plugin addition. Catches common Node.js security anti-patterns.                                                           |

### Performance

| Feature                                     | Why Expected                                                             | Complexity | Notes                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Core Web Vitals compliance                  | LCP < 2.5s, INP < 200ms, CLS < 0.1 at 75th percentile                    | Med        | Measure with Lighthouse. Target 90+ Performance score. Current code splitting helps but needs verification.       |
| Bundle size budget (<200KB gzipped initial) | Large bundles kill LCP and INP. React 19 core ~45KB, budget for the rest | Med        | Use `vite-bundle-visualizer` to identify heavy chunks. Set up `size-limit` in CI to fail builds exceeding budget. |
| Route-level code splitting verification     | Already using React.lazy() but gaps may exist                            | Low        | Audit all routes. Heavy libs (React Flow, chart libs, PDF) must be lazy-loaded.                                   |
| Redis cache reliability                     | CONCERNS.md: 7 cache warning locations, frequent fallbacks to DB         | Med        | Monitor Redis connection stability. Implement cache warming for high-traffic queries. Add health metrics.         |
| Database query optimization                 | Search timeouts, partial results (CONCERNS.md)                           | Med        | Add `EXPLAIN ANALYZE` on slow queries. Add missing indexes per Supabase Performance Advisor.                      |
| Image/asset optimization                    | Diplomatic apps have logos, flags, document thumbnails                   | Low        | Use WebP/AVIF formats, lazy loading for images, proper `width`/`height` attributes to prevent CLS.                |

### RTL/LTR Theming Consistency

| Feature                           | Why Expected                                                                     | Complexity | Notes                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Full logical properties audit     | ESLint rules exist but may not catch everything (inline styles, third-party CSS) | Med        | ESLint catches Tailwind classes but not: inline `style={{ marginLeft }}`, third-party component overrides, or CSS-in-JS. Manual audit needed. |
| `dir` attribute on all containers | Pattern exists but inconsistently applied                                        | Med        | Every page layout container needs `dir={isRTL ? 'rtl' : 'ltr'}`. Audit all route components.                                                  |
| Bidirectional text testing        | Arabic text mixed with English names, numbers, URLs causes bidi quirks           | Med        | Test with realistic diplomatic content: "Meeting with Ambassador John Smith" in Arabic context. Check cursor behavior, wrapping.              |
| Icon direction audit              | Directional icons (arrows, chevrons) must flip in RTL                            | Low        | Audit all icon usage. Arrows/chevrons need `className={isRTL ? 'rotate-180' : ''}`.                                                           |
| Font/ligature verification        | Arabic fonts need proper joining rules, diacritics                               | Low        | Verify Tajawal font renders correctly with `writingDirection: "rtl"`. Test with tashkeel (diacritics).                                        |
| Theme switching visual regression | Dark/light mode + RTL/LTR = 4 combinations to test                               | Med        | Create visual regression tests for all 4 combinations. HeroUI oklch color system should handle dark mode; verify.                             |
| RTL-specific ESLint rules         | Automated enforcement of logical CSS properties beyond current config            | Med        | Consider eslint-plugin-rtl-friendly for additional coverage + auto-fix capability.                                                            |

### Responsive Design

| Feature                               | Why Expected                                                          | Complexity | Notes                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| Mobile-first audit (320px+)           | Mandated in CLAUDE.md but "not consistently implemented" (PROJECT.md) | High       | Every page needs testing at 320px, 640px, 768px, 1024px, 1280px. Most common gap: tables and data-heavy views. |
| Touch target compliance (44x44px min) | WCAG 2.2 AA requires 24x24px minimum; app standard is 44x44px         | Med        | Audit all buttons, links, interactive elements. `min-h-11 min-w-11` in Tailwind.                               |
| Breakpoint coverage for data tables   | Diplomatic data is table-heavy (contacts, work items, dossiers)       | High       | Tables must collapse to cards or horizontal scroll on mobile. This is the hardest responsive challenge.        |
| Viewport meta tag verification        | Basic but critical for mobile rendering                               | Low        | Verify `<meta name="viewport" content="width=device-width, initial-scale=1">` is set.                          |

### Accessibility

| Feature                           | Why Expected                                                              | Complexity | Notes                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| WCAG 2.2 Level AA baseline        | Legal requirement (EAA since June 2025) and professional standard         | High       | Focus on: keyboard navigation, focus management in SPA routing, color contrast (4.5:1 for text), aria-labels on icons. |
| Screen reader testing with Arabic | Arabic screen readers have different announcement patterns                | Med        | Test with VoiceOver (macOS) in Arabic mode. Verify `lang="ar"` on Arabic content sections.                             |
| Focus management on route changes | SPA routing does not trigger page announcements by default                | Med        | TanStack Router needs a focus management strategy: announce route changes, move focus to main content.                 |
| Form error accessibility          | Forms need proper `aria-describedby`, `aria-invalid`, error announcements | Med        | HeroUI TextField compound component handles this if used correctly. Verify all forms use it.                           |

### Testing Gaps (from CONCERNS.md)

| Feature                          | Why Expected                                                          | Complexity | Notes                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| Authorization middleware tests   | "Critical - security-sensitive code" untested (CONCERNS.md)           | High       | Clearance checks and org isolation are untested. Must have tests before implementing the real middleware. |
| Background job integration tests | Health score refresh, overdue commitments fail silently (CONCERNS.md) | Med        | Mock Redis/Supabase, verify job behavior on success and failure paths.                                    |
| Visual regression testing        | 4 theme/direction combinations need automated checking                | Med        | Use Playwright screenshots or Chromatic. Compare across dark/light x RTL/LTR.                             |
| Search failure scenario tests    | Multi-entity search partial failures untested (CONCERNS.md)           | Med        | Test each entity type failing independently. Verify error reporting alongside partial results.            |
| Coverage thresholds in CI        | Prevent coverage regression                                           | Low        | Set reasonable thresholds (70% statements, 60% branches) in Vitest config.                                |

## Differentiators

Features that set the codebase apart from "it works" to "it is well-maintained." Not expected, but highly valued.

| Feature                             | Value Proposition                                                   | Complexity | Notes                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| Automated performance budgets in CI | Build fails if bundle exceeds limit or Lighthouse score drops       | Med        | Use `size-limit` for bundle budgets + Lighthouse CI for CWV. Prevents performance regressions.      |
| Knip in CI (dead code gate)         | Prevents new dead code from being introduced                        | Low        | `npx knip` in CI pipeline. Zero-tolerance for unused exports after initial cleanup.                 |
| Structured error taxonomy           | Consistent error codes across API + frontend error boundary mapping | Med        | Systematize: every endpoint returns typed errors that frontend can display in Arabic/English.       |
| Sentry performance monitoring (RUM) | Real user metrics for CWV, not just synthetic Lighthouse            | Low        | Sentry already installed; enable Performance Monitoring. Track real LCP/INP/CLS from production.    |
| Database migration rollback testing | Verify every migration can roll back cleanly                        | Med        | CONCERNS.md flags incomplete rollback logic. Test `up` then `down` for every migration.             |
| CSP violation reporting             | CSP violations reported to endpoint, not just blocked               | Low        | Helmet supports `reportUri`. Collect CSP violation reports to catch XSS attempts.                   |
| Dependency update automation        | Renovate/Dependabot for automated security patches                  | Low        | Especially important given HeroUI v3 beta status and React 19 security advisories (CVE-2025-55182). |
| API response time monitoring        | Track p50/p95/p99 for every endpoint                                | Med        | Winston + Sentry or Prometheus. Alert on degradation before users notice.                           |
| Accessibility CI gate               | axe-core in Playwright tests, fail on violations                    | Med        | Run `@axe-core/playwright` in E2E tests. Catch accessibility regressions automatically.             |
| Web Vitals field monitoring         | Real user data sent to Sentry for continuous tracking               | Low        | ~5 lines of code with `web-vitals` library + Sentry integration.                                    |
| prettier-plugin-tailwindcss         | Automated Tailwind class sorting                                    | Low        | Zero-effort class ordering consistency in pre-commit hooks.                                         |

## Anti-Features

Features to explicitly NOT build during this production-hardening milestone.

| Anti-Feature                          | Why Avoid                                                                                    | What to Do Instead                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| New dossier types or features         | Scope creep. Quality milestone is about hardening, not growth.                               | Document feature ideas in backlog. Build on clean foundation later.   |
| Full WCAG AAA compliance              | AAA is aspirational, not legally required. Diminishing returns for internal diplomatic tool. | Target AA. Note AAA gaps for future if needed.                        |
| Micro-frontend architecture           | Massive refactor for questionable benefit at current scale (~100 routes).                    | Keep monolith. Use code splitting and lazy loading for performance.   |
| Custom ESLint rules                   | High maintenance, fragile.                                                                   | Use existing plugins (rtl-friendly, security).                        |
| Biome migration                       | Plugin ecosystem gaps for tailwindcss, security.                                             | Stay on ESLint 9 + Prettier.                                          |
| GraphQL migration                     | Current REST + Supabase PostgREST works. GraphQL adds complexity without clear benefit.      | Optimize existing REST endpoints. Fix N+1 queries if found.           |
| Automated RTL CSS conversion (RTLCSS) | Already using CSS logical properties + ESLint enforcement. RTLCSS is for legacy codebases.   | Continue with logical properties approach. It is the modern standard. |
| Mobile native app                     | Cancelled (per MEMORY.md). Do not re-introduce.                                              | Ensure responsive web works well on mobile browsers.                  |
| Real-time collaborative editing       | High complexity, not core to dossier management.                                             | Keep existing Supabase Realtime for data sync.                        |
| Duplicate detection implementation    | Marked in CONCERNS.md but is a NEW FEATURE, not hardening.                                   | Document the stubs. Implement in a future feature milestone.          |
| Notification system buildout          | Multiple TODOs exist but this is feature work, not hardening.                                | Wire up basic Sentry alerts for critical failures only.               |
| Mandatory 100% test coverage          | Slows development, encourages bad tests.                                                     | Set reasonable thresholds (70% statements, 60% branches).             |
| Snyk paid tier                        | Cost for marginal benefit over free tools.                                                   | `pnpm audit` + Socket.dev GitHub App for dependency scanning.         |
| Custom Webpack config                 | Wrong bundler entirely.                                                                      | Project uses Vite -- use Vite-native tools only.                      |

## Feature Dependencies

```
Pre-commit hooks (husky) --> ESLint zero-warnings gate --> Dead code detection (Knip)
                                                       --> Unused dependency removal
                                                       --> Bundle size budget in CI

RLS policy audit --> Organization isolation enforcement --> Clearance-level middleware
                --> Input validation on all endpoints

Logical properties audit --> dir attribute audit --> Bidirectional text testing
                                                --> Theme switching visual regression (4 combos)

Mobile-first audit --> Touch target compliance --> Breakpoint coverage for data tables

WCAG AA baseline --> Focus management on route changes --> Screen reader testing (Arabic)
                --> Form error accessibility
                --> Accessibility CI gate (differentiator)

Helmet + CSP --> CSP reporting (differentiator)

Authorization middleware tests --> Clearance-level middleware implementation
                               --> Organization isolation enforcement

Core Web Vitals measurement --> Bundle size budget --> Automated performance budgets in CI
                            --> Route-level code splitting verification
                            --> Sentry RUM (differentiator)

Knip initial cleanup --> Knip in CI gate (differentiator)
```

## MVP Recommendation

Prioritize in this order (risk-driven):

1. **Security hardening** (RLS audit, Helmet/CSP, input validation, CORS) -- highest risk if missing
2. **Dead code + dependency cleanup** (Knip, unused deps, console.log audit) -- enables everything else
3. **Authorization middleware** (clearance checks, org isolation) -- blocking security concern from CONCERNS.md
4. **RTL/LTR consistency audit** (logical properties, dir attributes, icon direction) -- user-facing quality for Arabic users
5. **Responsive design audit** (mobile-first verification, touch targets, table layouts) -- user-facing quality
6. **Performance budgets** (bundle size, CWV measurement, lazy loading gaps) -- measurable quality
7. **Accessibility baseline** (WCAG AA, focus management, form errors) -- legal compliance (EAA 2025)
8. **Testing gaps** (auth middleware tests, visual regression, job tests) -- prevents regressions

Defer to future milestones:

- **Duplicate detection**: New feature, not hardening. Document stubs only.
- **Notification system**: Feature work. Wire basic Sentry alerts only.
- **Database migration rollback**: Important but lower risk than security gaps.

## Sources

- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) -- HIGH confidence
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- HIGH confidence
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) -- HIGH confidence
- [Helmet.js](https://helmetjs.github.io/) -- HIGH confidence
- [Knip Dead Code Detector](https://knip.dev/) -- HIGH confidence
- [Core Web Vitals](https://web.dev/articles/vitals) -- HIGH confidence
- [WCAG 2.2 Compliance Checklist](https://www.allaccessible.org/blog/wcag-22-compliance-checklist-implementation-roadmap) -- MEDIUM confidence
- [CSS Logical Properties for RTL](https://dev.to/web_dev-usman/stop-fighting-rtl-layouts-use-css-logical-properties-for-better-design-5g3m) -- MEDIUM confidence
- [React Performance Budgets](https://medium.com/@vasanthancomrads/performance-budgets-for-react-applications-7e796da09ef8) -- MEDIUM confidence
- [React Security Checklist 2025](https://www.propelcode.ai/blog/react-security-checklist-complete-guide-2025) -- MEDIUM confidence
- [RTL Styling 101](https://rtlstyling.com/posts/rtl-styling/) -- MEDIUM confidence
- [Supabase Security Retro 2025](https://supaexplorer.com/dev-notes/supabase-security-2025-whats-new-and-how-to-stay-secure.html) -- LOW confidence

---

_Feature landscape analysis: 2026-03-23_
