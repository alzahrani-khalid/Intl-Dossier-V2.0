# Phase 7: Performance Optimization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 07-performance-optimization
**Areas discussed:** Bundle budget, Web Vitals monitoring, Query optimization, Re-render elimination

---

## Bundle Budget

### Bundle budget enforcement

| Option                | Description                                                                                                     | Selected |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| CI gate (Recommended) | Fail the build in CI if initial JS exceeds 200KB gzipped. Uses bundlesize or size-limit in pipeline. Hard stop. | ✓        |
| Vite warning only     | Lower chunkSizeWarningLimit from 1500 to sensible threshold. Developers see warnings but builds pass.           |          |
| Both CI + warning     | Vite warns locally during dev, CI enforces in pipeline.                                                         |          |

**User's choice:** CI gate
**Notes:** None

### Heavy dependency lazy-loading

| Option           | Description                                                                                         | Selected |
| ---------------- | --------------------------------------------------------------------------------------------------- | -------- |
| framer-motion    | Animation library — already chunked as motion-vendor. Could lazy-load for pages without animations. |          |
| react-flow       | Network graph library — only used on relationship/visualization pages.                              |          |
| @sentry/react    | Error tracking — loaded on every page. Could defer init to after first paint.                       |          |
| i18n locale data | Arabic/English locale files. Could split so only active language loads.                             |          |

**User's choice:** "You decide" — Claude's discretion
**Notes:** Claude evaluates bundle analysis output and lazy-loads where impact is measurable.

### Bundle budget tooling

| Option                   | Description                                                                         | Selected |
| ------------------------ | ----------------------------------------------------------------------------------- | -------- |
| size-limit (Recommended) | Lightweight, JSON config in package.json, works well with Vite.                     | ✓        |
| bundlesize               | Posts size comparison as GitHub PR comments. More visual but requires GitHub token. |          |
| You decide               | Claude picks best fit for existing toolchain.                                       |          |

**User's choice:** size-limit
**Notes:** None

### Over budget behavior

| Option                  | Description                                                                    | Selected |
| ----------------------- | ------------------------------------------------------------------------------ | -------- |
| Hard fail (Recommended) | CI blocks the merge entirely. Forces developers to code-split or remove bloat. | ✓        |
| Warn + require approval | CI flags issue but allows merge with explicit approval.                        |          |

**User's choice:** Hard fail
**Notes:** None

---

## Web Vitals Monitoring

### Core Web Vitals tracking approach

| Option                           | Description                                                                              | Selected |
| -------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Sentry Performance (Recommended) | Enable Performance/RUM module. Tracks LCP, INP, CLS from real users. Dashboard built-in. | ✓        |
| web-vitals + custom              | Google's web-vitals library, send to own analytics. Full control, no vendor lock-in.     |          |
| Lighthouse CI                    | Synthetic testing in CI pipeline. Catches regressions before deploy.                     |          |

**User's choice:** Sentry Performance
**Notes:** Sentry already initialized — extend to performance module.

### Lighthouse CI alongside RUM

| Option                  | Description                                                                         | Selected |
| ----------------------- | ----------------------------------------------------------------------------------- | -------- |
| Yes, both (Recommended) | Sentry RUM for real-user data + Lighthouse CI in pipeline for regression detection. | ✓        |
| RUM only                | Real-user monitoring is sufficient.                                                 |          |
| You decide              | Claude determines whether added CI complexity is worth it.                          |          |

**User's choice:** Yes, both
**Notes:** None

### LCP optimization strategy

| Option                              | Description                                                                                                       | Selected |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| Defer non-critical JS (Recommended) | Defer Sentry init, analytics, animations until after first paint. Preload Tajawal font. Inline critical CSS.      | ✓        |
| SSR/prerender key pages             | Add server-side rendering or static prerendering for dashboard and dossier list. Significant architecture change. |          |
| You decide                          | Claude picks best LCP strategy given current SPA architecture.                                                    |          |

**User's choice:** Defer non-critical JS
**Notes:** None

---

## Query Optimization

### Slow query identification

| Option                          | Description                                                                                          | Selected |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| pg_stat + explain (Recommended) | Use pg_stat_statements to find slowest queries, then EXPLAIN ANALYZE each. Supabase dashboard tools. | ✓        |
| Sentry tracing spans            | Add Sentry performance spans around Supabase calls for production latency tracking.                  |          |
| Both approaches                 | pg_stat for DB-level audit + Sentry spans for application-level monitoring.                          |          |

**User's choice:** pg_stat + explain
**Notes:** None

### Redis cache reliability

| Option                   | Description                                                                                            | Selected |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | -------- |
| Fix + warm (Recommended) | Diagnose Redis connection issues, add health checks, implement cache warming for high-traffic queries. | ✓        |
| Remove Redis caching     | Remove Redis, rely on TanStack Query client-side caching + Supabase connection pooling.                |          |
| You decide               | Claude evaluates whether Redis adds enough value given reliability issues.                             |          |

**User's choice:** Fix + warm
**Notes:** None

### TanStack Query staleTime standardization

| Option                             | Description                                                                                  | Selected |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Yes, tiered defaults (Recommended) | 3 tiers: static data (30min), normal data (5min), live data (30sec). Each hook picks a tier. | ✓        |
| Keep per-hook values               | Current approach — each hook sets its own staleTime. More granular but inconsistent.         |          |
| You decide                         | Claude evaluates current staleTime spread and recommends.                                    |          |

**User's choice:** Tiered defaults
**Notes:** None

---

## Re-render Elimination

### Re-render elimination approach

| Option                           | Description                                                                                | Selected |
| -------------------------------- | ------------------------------------------------------------------------------------------ | -------- |
| Targeted profiling (Recommended) | Profile 3 key pages with React DevTools. Fix only verified issues with React.memo/useMemo. | ✓        |
| React Compiler                   | Enable React 19 experimental React Compiler for automatic memoization. Cutting-edge.       |          |
| Both targeted + compiler         | Enable compiler, then profile to verify and fix remaining issues.                          |          |

**User's choice:** Targeted profiling
**Notes:** None

### Pages to profile

| Option         | Description                                                                | Selected |
| -------------- | -------------------------------------------------------------------------- | -------- |
| Dashboard      | Landing page — multiple widgets, charts, recent activity.                  | ✓        |
| Dossier list   | Table/grid with filters, search, pagination.                               | ✓        |
| Dossier detail | Single dossier with tabs (overview, positions, engagements, intelligence). | ✓        |
| Kanban board   | Work items board with drag-and-drop. DnD interactions can cascade.         | ✓        |

**User's choice:** All four pages
**Notes:** None

### Context provider splitting

| Option                    | Description                                                                            | Selected |
| ------------------------- | -------------------------------------------------------------------------------------- | -------- |
| Audit first (Recommended) | Profile whether context changes cause unnecessary re-renders. Only split if confirmed. | ✓        |
| Split preemptively        | Separate frequently-changing values from stable ones upfront.                          |          |
| You decide                | Claude evaluates during profiling and splits where data shows it matters.              |          |

**User's choice:** Audit first
**Notes:** None

---

## Claude's Discretion

- Which heavy dependencies to lazy-load (framer-motion, react-flow, @sentry/react, i18n locale data) — based on bundle analysis output

## Deferred Ideas

None — discussion stayed within phase scope.
