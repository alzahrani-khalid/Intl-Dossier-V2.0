# Phase 7: Performance Optimization - Research

**Researched:** 2026-03-26
**Domain:** Frontend bundle optimization, Core Web Vitals, database query performance, React rendering optimization
**Confidence:** HIGH

## Summary

Phase 7 targets four measurable performance goals: bundle size under 200KB gzipped initial JS, Core Web Vitals compliance (LCP < 2.5s, INP < 200ms, CLS < 0.1), elimination of N+1 query patterns with proper database indexes, and removal of unnecessary re-renders on key pages. The codebase already has foundational pieces in place -- Vite manualChunks splitting, TanStack Router autoCodeSplitting, Sentry initialized with browserTracingIntegration, a bundle size check script in CI, and React.memo/lazy patterns used in 40+ components. The work is primarily about tightening budgets, extending monitoring, and fixing specific hotspots rather than building from scratch.

The biggest finding is that the current bundle check script (`frontend/scripts/check-bundle-size.js`) has extremely permissive thresholds (2.5MB total JS gzipped, 600KB main, 1.2MB vendor) that need to be replaced with the 200KB initial-load budget via size-limit. Additionally, `index.css` loads 6 Google Fonts via `@import url()` which is a major LCP blocker -- these block rendering until all font files are downloaded. The Sentry integration already includes `browserTracingIntegration()` which automatically captures LCP, INP, CLS, FCP, and TTFB with no additional web-vitals library needed. Redis cache has `lazyConnect: true` with no health check endpoint, causing silent fallback to direct DB queries under load.

**Primary recommendation:** Replace the custom bundle check with size-limit for precise initial-load budgets, convert CSS font imports to HTML preload links, extend Sentry RUM with explicit web-vitals reporting thresholds, and standardize TanStack Query staleTime into 3 named tiers.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01: Enforce 200KB gzipped initial JS limit via CI gate using size-limit. Hard fail -- nothing ships over budget.
- D-02: Lower Vite chunkSizeWarningLimit from 1500 to a sensible threshold for local dev feedback.
- D-03: size-limit configured in package.json with per-entry budgets for initial load chunks.
- D-04: Enable Sentry Performance/RUM for real-user tracking of LCP, INP, CLS. Sentry is already initialized -- extend to performance module.
- D-05: Add Lighthouse CI in pipeline for synthetic regression detection alongside RUM.
- D-06: LCP strategy: Defer non-critical JS (Sentry init, analytics, animations) until after first paint. Preload critical fonts (Tajawal). Inline critical CSS via Vite.
- D-07: Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- D-08: Audit slow queries using pg_stat_statements + EXPLAIN ANALYZE via Supabase dashboard tools.
- D-09: Fix Redis cache reliability -- diagnose connection issues, add health checks, implement cache warming for high-traffic queries (dossier lists, dashboard data).
- D-10: Standardize TanStack Query staleTime with 3 tiered defaults: static data (30min), normal data (5min), live data (30sec). Each domain hook picks a tier.
- D-11: Targeted profiling of 4 key pages: dashboard, dossier list, dossier detail, kanban board. Fix only verified re-render issues with React.memo/useMemo where profiling shows impact.
- D-12: Context provider splitting: audit first -- only split if profiling confirms cascading re-renders from Auth/Theme/Language contexts.

### Claude's Discretion

- D-13: Which heavy dependencies to lazy-load or code-split (framer-motion, react-flow, @sentry/react, i18n locale data). Claude evaluates bundle analysis output and lazy-loads where impact is measurable.

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                               | Research Support                                                                                                     |
| ------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| PERF-01 | Initial JS bundle under 200KB gzipped                     | size-limit CI gate (D-01/D-03), Vite manualChunks refinement, lazy-loading heavy deps (D-13), font preloading (D-06) |
| PERF-02 | Core Web Vitals pass: LCP < 2.5s, INP < 200ms, CLS < 0.1  | Sentry RUM extension (D-04), Lighthouse CI (D-05), font preload + defer non-critical JS (D-06)                       |
| PERF-03 | No N+1 query patterns -- slow queries have proper indexes | pg_stat_statements audit (D-08), Redis cache reliability fix (D-09), cache warming                                   |
| PERF-04 | No unnecessary re-renders on key pages                    | React DevTools profiling (D-11), context provider audit (D-12), React.memo/useMemo targeted fixes                    |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: React 19, Express, Supabase, TanStack Router/Query, HeroUI v3, Tailwind v4 -- no framework migrations
- **RTL-first**: Arabic RTL support mandatory -- performance changes must not break RTL layout
- **Code style**: No semicolons, single quotes, 100 char width, explicit return types, no explicit any
- **Testing**: Vitest (unit), Playwright (E2E), @testing-library/react
- **Deployment**: DigitalOcean droplet with Docker Compose
- **CI**: GitHub Actions workflow exists at `.github/workflows/ci.yml` with existing bundle-size-check job

## Standard Stack

### Core (New Dependencies for Phase 7)

| Library                | Version | Purpose                                                  | Why Standard                                                                                |
| ---------------------- | ------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| size-limit             | 12.0.1  | Bundle size CI gate with per-entry budgets               | Industry standard for JS budget enforcement; supports Vite out of box                       |
| @size-limit/preset-app | 12.0.1  | App preset for size-limit (includes file + time plugins) | Official preset for application bundles                                                     |
| @size-limit/file       | 12.0.1  | File size plugin for size-limit                          | Measures gzipped + brotli sizes                                                             |
| @lhci/cli              | 0.15.1  | Lighthouse CI for synthetic CWV testing                  | Google's official CI tool for Lighthouse audits                                             |
| web-vitals             | 5.2.0   | Standardized CWV measurement API                         | Google's official library; Sentry uses it internally but explicit usage gives finer control |

### Already Installed (Leverage Existing)

| Library                  | Version  | Purpose                        | Phase 7 Use                                                               |
| ------------------------ | -------- | ------------------------------ | ------------------------------------------------------------------------- |
| @sentry/react            | ^10.45.0 | Error + Performance monitoring | Already has browserTracingIntegration -- extend with web-vitals reporting |
| @sentry/vite-plugin      | ^5.1.1   | Source map upload              | Already configured in vite.config.ts                                      |
| rollup-plugin-visualizer | ^7.0.1   | Bundle treemap visualization   | Already wired via `ANALYZE=true` env var                                  |
| ioredis                  | 5.8.1    | Redis client                   | Fix connection reliability, add health endpoint                           |

### Alternatives Considered

| Instead of            | Could Use           | Tradeoff                                                                                                    |
| --------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| size-limit            | bundlesize          | size-limit is more actively maintained, supports Vite natively, and has better preset system                |
| @lhci/cli             | unlighthouse        | LHCI is Google's official tool with better CI integration and assertion support                             |
| web-vitals standalone | Sentry-only metrics | web-vitals gives immediate console/beacon access without Sentry latency; recommended for dev-time debugging |

**Installation:**

```bash
cd frontend && pnpm add -D size-limit @size-limit/preset-app @size-limit/file @lhci/cli web-vitals
```

**Version verification:** All versions confirmed via `npm view` on 2026-03-26.

## Architecture Patterns

### Current Codebase State

**Bundle splitting (already in place):**

```
vite.config.ts manualChunks:
  react-vendor    -- React, ReactDOM, scheduler
  tanstack-vendor -- TanStack Router, Query, Table
  motion-vendor   -- framer-motion
  radix-vendor    -- Radix UI primitives
  charts-vendor   -- recharts, d3-*, @xyflow/react
  i18n-vendor     -- i18next, react-i18next
  supabase-vendor -- @supabase/supabase-js
  forms-vendor    -- react-hook-form, zod
  vendor          -- all other node_modules
```

**Route-level code splitting:** TanStack Router `autoCodeSplitting: true` -- all route components are automatically lazy-loaded.

**Existing lazy imports (18 components):** Dashboard, Analytics, Calendar, Search, all 8 dossier detail pages, DossierOverview, IntelligenceTabContent, EntityLinkManager.

**Existing React.memo usage (40+ components):** Concentrated in graph visualizations, entity comparison, field history, carousel, collaboration components.

### Pattern 1: size-limit Configuration in package.json

**What:** Per-entry bundle budgets checked in CI
**When to use:** Every PR via `bundle-size-check` CI job
**Example:**

```json
{
  "size-limit": [
    {
      "name": "Initial JS (entry + critical vendors)",
      "path": "dist/assets/index-*.js",
      "limit": "200 KB",
      "gzip": true
    },
    {
      "name": "React vendor",
      "path": "dist/assets/react-vendor-*.js",
      "limit": "50 KB",
      "gzip": true
    },
    {
      "name": "TanStack vendor",
      "path": "dist/assets/tanstack-vendor-*.js",
      "limit": "80 KB",
      "gzip": true
    },
    {
      "name": "Total JS",
      "path": "dist/assets/*.js",
      "limit": "800 KB",
      "gzip": true
    }
  ]
}
```

Source: [size-limit GitHub](https://github.com/ai/size-limit)

### Pattern 2: Sentry Web Vitals Extension

**What:** Extend existing Sentry init to report CWV with thresholds
**When to use:** In `frontend/src/lib/sentry.ts` -- the only Sentry import file
**Example:**

```typescript
// Already in sentry.ts -- these are already configured:
Sentry.init({
  // ...existing config...
  integrations: [
    Sentry.browserTracingIntegration(),
    // Already captures LCP, INP, CLS, FCP, TTFB automatically
  ],
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
})

// NEW: Add reportAllChanges for dev-time debugging
// web-vitals gives immediate console feedback
import { onLCP, onINP, onCLS } from 'web-vitals'

export function initWebVitalsReporting(): void {
  if (import.meta.env.DEV) {
    onLCP(console.log)
    onINP(console.log)
    onCLS(console.log)
  }
}
```

Source: [Sentry Web Vitals docs](https://docs.sentry.io/product/insights/frontend/web-vitals/)

### Pattern 3: TanStack Query StaleTime Tiers

**What:** Named constants for 3 freshness tiers replacing ad-hoc values
**When to use:** Every domain hook that calls `useQuery`
**Example:**

```typescript
// frontend/src/lib/query-tiers.ts
export const STALE_TIME = {
  /** Static data: dossier types, config, translations -- 30 min */
  STATIC: 30 * 60 * 1000,
  /** Normal data: dossier lists, details, relationships -- 5 min */
  NORMAL: 5 * 60 * 1000,
  /** Live data: SLA monitoring, workflow automation, approvals -- 30 sec */
  LIVE: 30 * 1000,
} as const

// Usage in domain hooks:
import { STALE_TIME } from '@/lib/query-tiers'

export function useDossierList(filters: DossierFilters) {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: () => dossierRepo.list(filters),
    staleTime: STALE_TIME.NORMAL,
  })
}
```

### Pattern 4: Font Preloading (LCP Fix)

**What:** Move CSS @import fonts to HTML preload links, keep only critical fonts
**When to use:** `index.html` and `index.css`
**Critical finding:** Current `index.css` loads 6 font families via `@import url()`:

- Outfit, Kumbh Sans, Hedvig Letters Serif, Poppins, Plus Jakarta Sans, Readex Pro
- Each `@import` blocks CSS parsing until the font CSS is fetched
- This is a **major LCP bottleneck** -- the browser must fetch 6 external stylesheets sequentially before parsing any CSS

**Fix:**

```html
<!-- index.html - preload only the critical fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<!-- Critical: Readex Pro for RTL text rendering -->
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600;700&display=swap"
/>
<!-- Defer non-critical fonts -->
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600;700&display=swap"
/>
```

```css
/* index.css - REMOVE all @import url() for fonts */
/* Fonts now loaded via HTML <link> tags for better LCP */
```

### Pattern 5: Redis Health Check Endpoint

**What:** Add `/health/redis` endpoint and connection retry with health monitoring
**When to use:** Backend API for operational visibility
**Example:**

```typescript
// backend/src/api/health.ts
router.get('/health/redis', async (_req, res) => {
  try {
    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start
    res.json({ status: 'healthy', latency_ms: latency })
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: (err as Error).message })
  }
})
```

### Anti-Patterns to Avoid

- **Premature React.memo everywhere:** Only memo components where profiling confirms wasted renders. Memo has overhead (shallow comparison cost). Decision D-11 explicitly says "fix only verified re-render issues."
- **Splitting too aggressively:** Over-splitting creates waterfall requests. Keep related vendor chunks together (e.g., don't split each Radix primitive into its own chunk).
- **Using `@import url()` for fonts in CSS:** Blocks CSS parsing. Always use HTML `<link>` with `preconnect` + `preload`.
- **Setting staleTime: Infinity broadly:** Makes data permanently stale unless manually invalidated. Only appropriate for truly immutable data (e.g., enum lookups).

## Don't Hand-Roll

| Problem                     | Don't Build                                       | Use Instead                                               | Why                                                                                            |
| --------------------------- | ------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Bundle size CI gate         | Custom check-bundle-size.js with loose thresholds | size-limit with @size-limit/preset-app                    | Precise per-entry budgets, gzip+brotli, CI-friendly exit codes, community standard             |
| Core Web Vitals measurement | Custom performance.observer code                  | web-vitals library + Sentry browserTracingIntegration     | Standardized measurement methodology matching Chrome UX Report                                 |
| Lighthouse CI assertions    | Manual Lighthouse runs                            | @lhci/cli with lighthouserc.js                            | Automated assertions, historical comparison, GitHub status checks                              |
| Redis connection monitoring | Custom ping loops                                 | ioredis built-in health checks + `/health/redis` endpoint | ioredis has `enableReadyCheck: true` (already configured), just needs health endpoint exposure |

**Key insight:** The existing `check-bundle-size.js` has thresholds so loose (2.5MB total) they provide zero protection. size-limit replaces it with enforced budgets that actually catch regressions.

## Common Pitfalls

### Pitfall 1: 200KB Budget vs Actual Initial Bundle

**What goes wrong:** The 200KB target is for "initial JS" but the Vite entry chunk (`index-*.js`) alone may be well under 200KB while the actual initial load includes react-vendor, tanstack-vendor, and other synchronous imports that the entry chunk pulls in.
**Why it happens:** manualChunks splits vendor code into separate files, but the browser still loads them all on initial page load.
**How to avoid:** Measure "initial load" as the sum of all JS files loaded before the first interactive paint, not just the entry chunk. Use size-limit with multiple entries or a `path: ["dist/assets/index-*.js", "dist/assets/react-vendor-*.js"]` array.
**Warning signs:** Entry chunk is 50KB but page still loads 1MB+ of JS on first visit.

### Pitfall 2: Font Import Blocking LCP

**What goes wrong:** CSS `@import url(...)` for Google Fonts creates a render-blocking chain: HTML loads CSS, CSS loads font stylesheet, font stylesheet loads font files.
**Why it happens:** CSS `@import` is parser-blocking -- the browser pauses CSS evaluation until the imported stylesheet is fetched.
**How to avoid:** Move font loading to HTML `<link rel="preload">` tags. Use `font-display: swap` (Google Fonts does this by default with `&display=swap`).
**Warning signs:** LCP > 2.5s despite small JS bundles. Waterfall shows cascading font requests.

### Pitfall 3: Sentry Performance Sampling Blindspot

**What goes wrong:** `tracesSampleRate: 0.1` in production means only 10% of pageloads report CWV metrics to Sentry.
**Why it happens:** Performance sampling is necessary to control Sentry costs, but low rates miss edge cases.
**How to avoid:** Use `tracesSampler` function to always sample the 4 key pages (dashboard, dossier list, dossier detail, kanban) at a higher rate (e.g., 0.5) while keeping other pages at 0.1.
**Warning signs:** Sentry Web Vitals dashboard shows too few samples for statistical significance.

### Pitfall 4: Redis lazyConnect Masking Failures

**What goes wrong:** Redis client configured with `lazyConnect: true` means it doesn't connect until the first command. If Redis is down, the first cache read fails silently and falls back to direct DB queries forever.
**Why it happens:** `lazyConnect` delays the connection error to runtime rather than startup.
**How to avoid:** Call `redis.connect()` explicitly at server startup with a timeout. Log connection state clearly. Add health check endpoint.
**Warning signs:** High database load despite cache being "configured." Console warnings about cache read/write failures (already documented in CONCERNS.md for dossier-service).

### Pitfall 5: React.memo Without Stable References

**What goes wrong:** Adding React.memo to a component but passing inline objects/functions as props defeats memoization because shallow comparison always finds "new" props.
**Why it happens:** `<MemoizedChild config={{ key: value }} />` creates a new object each render.
**How to avoid:** Hoist constant objects outside component, use useMemo for computed objects, useCallback for handlers. Only add memo after profiling confirms the render cost.
**Warning signs:** React DevTools profiler still shows "Props changed" for memo'd components.

## Code Examples

### Lighthouse CI Configuration

```javascript
// lighthouserc.js (project root)
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'], // Vite preview server
      startServerCommand: 'cd frontend && pnpm preview',
      startServerReadyPattern: 'Local',
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Simulate real conditions
        throttling: {
          cpuSlowdownMultiplier: 2,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        interactive: ['warn', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

### Redis Health Check with Cache Warming

```typescript
// backend/src/services/cache-warming.service.ts
import { redis, cacheHelpers } from '../config/redis'
import { logInfo, logError } from '../utils/logger'

export async function warmCriticalCaches(): Promise<void> {
  try {
    // Verify Redis is connected
    await redis.ping()
    logInfo('Redis connection verified for cache warming')

    // Warm high-traffic query caches
    // Dossier list (most visited page)
    // Dashboard summary data
    // These would call the actual service methods that populate cache
  } catch (err) {
    logError('Cache warming failed - Redis may be unavailable', err)
  }
}

// Call at server startup after Redis connect
export async function initializeRedis(): Promise<boolean> {
  try {
    await redis.connect()
    await redis.ping()
    logInfo('Redis connected and healthy')
    await warmCriticalCaches()
    return true
  } catch (err) {
    logError('Redis initialization failed - operating in cache-bypass mode', err)
    return false
  }
}
```

### Deferred Sentry Init Pattern (LCP optimization)

```typescript
// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/theme-provider/theme-provider'
import { LanguageProvider } from './components/language-provider/language-provider'
import './index.css'
import App from './App.tsx'

// Defer Sentry initialization to after first paint
// This removes @sentry/react from the critical path
requestIdleCallback(() => {
  import('./lib/sentry').then(({ initSentry }) => {
    initSentry()
  })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
```

## State of the Art

| Old Approach            | Current Approach                | When Changed  | Impact                                                            |
| ----------------------- | ------------------------------- | ------------- | ----------------------------------------------------------------- |
| FID (First Input Delay) | INP (Interaction to Next Paint) | March 2024    | Sentry v10 dropped FID; INP is the standard responsiveness metric |
| webpack-bundle-analyzer | rollup-plugin-visualizer        | Vite adoption | Already using visualizer; size-limit adds CI enforcement          |
| Custom perf.observer    | web-vitals library v5           | 2024+         | Standardized measurement matching CrUX methodology                |
| Manual Lighthouse       | @lhci/cli                       | 2023+         | CI-integrated Lighthouse with assertions and history              |

**Deprecated/outdated:**

- **FID metric:** Replaced by INP in Chrome 117+ (March 2024). Sentry v10 no longer reports FID.
- **Custom check-bundle-size.js thresholds (2.5MB total):** Will be replaced by size-limit with proper per-entry budgets.

## Open Questions

1. **Current bundle size baseline**
   - What we know: Existing check-bundle-size.js thresholds are 2.5MB total JS gzipped, suggesting the bundle is currently large
   - What's unclear: Exact current size of each chunk (need to run `pnpm analyze` to get baseline)
   - Recommendation: First task should run `ANALYZE=true pnpm build` and document baseline sizes before optimization

2. **Which Google Fonts are actually used**
   - What we know: 6 font families loaded in index.css (Outfit, Kumbh Sans, Hedvig Letters Serif, Poppins, Plus Jakarta Sans, Readex Pro)
   - What's unclear: Whether all 6 are actually used in current themes, or if some are legacy
   - Recommendation: Audit CSS custom properties `--display-family` and `--text-family` across all themes to identify unused fonts

3. **Redis connection stability in production**
   - What we know: CONCERNS.md documents frequent cache misses in dossier-service; redis config has `lazyConnect: true`
   - What's unclear: Whether Redis is actually running/accessible in the DigitalOcean production environment
   - Recommendation: Add health endpoint, check production Redis status via SSH

4. **Initial load JS calculation method**
   - What we know: D-01 specifies 200KB gzipped initial JS
   - What's unclear: Whether "initial JS" means just the entry chunk, or entry + all synchronous vendor chunks loaded on first page
   - Recommendation: Define as "all JS loaded before first interactive paint" and measure with Lighthouse network tab

## Environment Availability

| Dependency         | Required By              | Available           | Version        | Fallback                              |
| ------------------ | ------------------------ | ------------------- | -------------- | ------------------------------------- |
| Node.js            | All tooling              | Yes                 | 20.19.0+       | --                                    |
| pnpm               | Package management       | Yes                 | 10.29.1+       | --                                    |
| Vite               | Bundle building          | Yes                 | 7.3.1          | --                                    |
| Redis              | Cache reliability (D-09) | Needs verification  | 7.x configured | Cache-bypass mode (existing fallback) |
| GitHub Actions     | CI gates (D-01, D-05)    | Yes                 | ci.yml exists  | --                                    |
| Supabase Dashboard | Query audit (D-08)       | Yes                 | Cloud hosted   | --                                    |
| Chrome/Chromium    | Lighthouse CI            | Needs install in CI | --             | `--chrome-flags="--no-sandbox"` in CI |

**Missing dependencies with no fallback:**

- None -- all core dependencies available

**Missing dependencies with fallback:**

- Redis production status unknown -- existing code already falls back to direct DB queries

## Validation Architecture

### Test Framework

| Property           | Value                            |
| ------------------ | -------------------------------- |
| Framework          | Vitest 4.1.0                     |
| Config file        | `frontend/vitest.config.ts`      |
| Quick run command  | `cd frontend && pnpm vitest run` |
| Full suite command | `pnpm test` (monorepo root)      |

### Phase Requirements to Test Map

| Req ID  | Behavior                                      | Test Type   | Automated Command                                               | File Exists? |
| ------- | --------------------------------------------- | ----------- | --------------------------------------------------------------- | ------------ |
| PERF-01 | Bundle under 200KB gzipped initial JS         | build-gate  | `cd frontend && pnpm size-limit`                                | No -- Wave 0 |
| PERF-01 | size-limit config validates per-entry budgets | unit        | `cd frontend && pnpm vitest run tests/bundle-budget.test.ts -x` | No -- Wave 0 |
| PERF-02 | Sentry RUM reports LCP/INP/CLS                | smoke       | `cd frontend && pnpm vitest run tests/sentry-vitals.test.ts -x` | No -- Wave 0 |
| PERF-02 | Lighthouse CI assertions pass                 | build-gate  | `cd frontend && pnpm lhci autorun`                              | No -- Wave 0 |
| PERF-03 | Redis health endpoint returns status          | unit        | `cd backend && pnpm vitest run tests/redis-health.test.ts -x`   | No -- Wave 0 |
| PERF-03 | Cache warming runs at startup                 | unit        | `cd backend && pnpm vitest run tests/cache-warming.test.ts -x`  | No -- Wave 0 |
| PERF-04 | StaleTime tiers exported correctly            | unit        | `cd frontend && pnpm vitest run tests/query-tiers.test.ts -x`   | No -- Wave 0 |
| PERF-04 | Key pages have no excess re-renders           | manual-only | React DevTools Profiler (requires browser)                      | N/A          |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm vitest run --changed`
- **Per wave merge:** `pnpm test && cd frontend && pnpm size-limit`
- **Phase gate:** Full suite green + size-limit pass + Lighthouse CI pass before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/tests/bundle-budget.test.ts` -- validates size-limit config entries exist
- [ ] `frontend/tests/sentry-vitals.test.ts` -- validates Sentry init includes browserTracingIntegration
- [ ] `frontend/tests/query-tiers.test.ts` -- validates STALE_TIME constants and tier exports
- [ ] `backend/tests/redis-health.test.ts` -- validates health endpoint logic
- [ ] `size-limit` + `@size-limit/preset-app` + `@size-limit/file` install
- [ ] `@lhci/cli` install
- [ ] `web-vitals` install
- [ ] `lighthouserc.js` configuration file

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `frontend/vite.config.ts` -- current manualChunks and build config
- Codebase analysis: `frontend/src/lib/sentry.ts` -- Sentry already has browserTracingIntegration
- Codebase analysis: `frontend/src/index.css` -- 6 Google Fonts via blocking @import
- Codebase analysis: `frontend/scripts/check-bundle-size.js` -- current loose thresholds
- Codebase analysis: `backend/src/config/redis.ts` -- lazyConnect, no explicit connect()
- Codebase analysis: `.github/workflows/ci.yml` -- existing bundle-size-check job
- Codebase analysis: `frontend/src/lib/query-client.ts` -- global staleTime: 5 min default
- [Sentry Web Vitals docs](https://docs.sentry.io/product/insights/frontend/web-vitals/)
- [Sentry automatic instrumentation](https://docs.sentry.io/platforms/javascript/guides/react/tracing/instrumentation/automatic-instrumentation/)
- npm registry: size-limit@12.0.1, @lhci/cli@0.15.1, web-vitals@5.2.0

### Secondary (MEDIUM confidence)

- [size-limit GitHub](https://github.com/ai/size-limit) -- configuration patterns
- [Sentry Core Web Vitals monitoring](https://sentry.io/for/web-vitals/) -- feature overview
- `.planning/codebase/CONCERNS.md` -- Redis cache reliability issues documented

### Tertiary (LOW confidence)

- Exact current bundle sizes unknown -- need baseline measurement via `pnpm analyze`
- Redis production availability unverified -- needs SSH check

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all tools verified via npm registry, versions confirmed
- Architecture: HIGH -- patterns based on direct codebase analysis of existing files
- Pitfalls: HIGH -- derived from actual code issues (font imports, Redis lazyConnect, loose bundle thresholds)
- Query optimization: MEDIUM -- pg_stat_statements audit requires Supabase dashboard access (manual step)
- Re-render elimination: MEDIUM -- requires runtime profiling that can only happen during execution

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (30 days -- stable tooling, no fast-moving changes expected)
