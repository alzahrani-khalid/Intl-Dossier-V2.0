# Phase 7: Performance Optimization - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring the application to production performance budgets with measurable Core Web Vitals compliance. This covers four areas: bundle size enforcement, Core Web Vitals monitoring, database/cache query optimization, and React re-render elimination. The phase does NOT add new features — it optimizes what exists.

</domain>

<decisions>
## Implementation Decisions

### Bundle Budget Enforcement

- **D-01:** Enforce 200KB gzipped initial JS limit via **CI gate using size-limit**. Hard fail — nothing ships over budget.
- **D-02:** Lower Vite `chunkSizeWarningLimit` from 1500 to a sensible threshold for local dev feedback.
- **D-03:** size-limit configured in `package.json` with per-entry budgets for initial load chunks.

### Core Web Vitals Monitoring

- **D-04:** Enable **Sentry Performance/RUM** for real-user tracking of LCP, INP, CLS. Sentry is already initialized — extend to performance module.
- **D-05:** Add **Lighthouse CI** in pipeline for synthetic regression detection alongside RUM.
- **D-06:** LCP strategy: **Defer non-critical JS** (Sentry init, analytics, animations) until after first paint. Preload critical fonts (Tajawal). Inline critical CSS via Vite.
- **D-07:** Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.

### Query Optimization

- **D-08:** Audit slow queries using **pg_stat_statements + EXPLAIN ANALYZE** via Supabase dashboard tools.
- **D-09:** **Fix Redis cache reliability** — diagnose connection issues, add health checks, implement cache warming for high-traffic queries (dossier lists, dashboard data).
- **D-10:** Standardize TanStack Query staleTime with **3 tiered defaults**: static data (30min), normal data (5min), live data (30sec). Each domain hook picks a tier.

### Re-render Elimination

- **D-11:** **Targeted profiling** of 4 key pages: dashboard, dossier list, dossier detail, kanban board. Fix only verified re-render issues with React.memo/useMemo where profiling shows impact.
- **D-12:** Context provider splitting: **audit first** — only split if profiling confirms cascading re-renders from Auth/Theme/Language contexts.

### Claude's Discretion

- **D-13:** Which heavy dependencies to lazy-load or code-split (framer-motion, react-flow, @sentry/react, i18n locale data). Claude evaluates bundle analysis output and lazy-loads where impact is measurable.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Build & Bundle

- `.planning/codebase/STACK.md` — Full dependency inventory and versions
- `frontend/vite.config.ts` — Current Vite build config with manualChunks strategy
- `frontend/package.json` — Frontend dependencies affecting bundle size

### Performance Concerns

- `.planning/codebase/CONCERNS.md` §Performance Bottlenecks — Redis cache fallback, search timeout, vector embeddings issues

### Architecture

- `.planning/codebase/ARCHITECTURE.md` — Layer overview, data flow patterns, entry points
- `.planning/codebase/CONVENTIONS.md` — Code patterns that affect optimization approach

### Prior Phase Context

- `.planning/phases/06-architecture-consolidation/06-CONTEXT.md` — Repository pattern decisions (shared apiClient, domain hooks)

### Monitoring

- `frontend/src/lib/sentry.ts` — Current Sentry configuration (error-only, needs Performance extension)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Vite manualChunks**: Already splits react-vendor, tanstack-vendor, motion-vendor, radix-vendor, forms-vendor — can be refined
- **TanStack Router autoCodeSplitting**: Enabled — route-level code splitting is automatic
- **Bundle visualizer**: Available via `ANALYZE=true` env var with rollup-plugin-visualizer
- **Sentry integration**: `frontend/src/lib/sentry.ts` + ErrorBoundary wired up — extend to Performance module
- **React.memo usage**: Applied in carousel, collaboration components — pattern exists to follow
- **React.lazy usage**: CountryDossierDetail lazy-loads IntelligenceTabContent — pattern exists
- **Image optimization**: CountryMapImage uses `<picture>` + `srcSet` + `loading="lazy"` — good pattern

### Established Patterns

- **Domain repository pattern** (Phase 6): All data fetching via shared `apiClient` — single place to add Sentry spans
- **Per-hook staleTime**: Currently ad-hoc (30sec to 30min) — will be standardized to 3 tiers
- **Redis caching**: Backend uses ioredis with warn-on-failure fallback — needs reliability fix

### Integration Points

- **CI pipeline**: size-limit + Lighthouse CI need to be added to existing CI workflow
- **Sentry**: Extend `initSentry()` in `main.tsx` to include BrowserTracing and web-vitals
- **Supabase dashboard**: pg_stat_statements for query audit — no code change needed
- **TanStack Query**: Global `QueryClient` in `App.tsx` — add default staleTime tiers

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 07-performance-optimization_
_Context gathered: 2026-03-26_
