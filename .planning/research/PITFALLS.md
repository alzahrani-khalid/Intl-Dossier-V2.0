# Domain Pitfalls

**Domain:** Production hardening of React 19 + Express + Supabase diplomatic dossier app
**Researched:** 2026-03-23

## Critical Pitfalls

Mistakes that cause regressions, security breaches, or require significant rework.

### Pitfall 1: Dead Code Removal Breaks Re-Export Chains

**What goes wrong:** The codebase uses a shadcn re-export pattern (`button.tsx` re-exports from `heroui-button.tsx`). Automated dead code tools (knip, ts-prune) flag intermediate re-export files as "unused" because no direct import targets them. Removing these breaks all 500+ consumers that import from the re-export path.

**Why it happens:** Static analysis tools trace direct imports, not transitive re-exports. The HeroUI wrapper layer adds an indirection that confuses these tools.

**Consequences:** Every component importing from `@/components/ui/button` breaks simultaneously. Build fails across the entire frontend.

**Prevention:**

1. Before removing ANY file flagged as dead code, trace its full import chain: `grep -r "from.*filename" frontend/src/`
2. Create an allowlist for the `components/ui/` re-export layer in your dead code tool config
3. Run `pnpm build` after every batch of removals (not just at the end)
4. Remove in small commits (10-20 files max) so regressions are easy to bisect

**Detection:** Build failures referencing `@/components/ui/*` imports. TypeScript errors about missing exports.

**Phase:** Dead code removal phase. HIGH priority.

### Pitfall 2: RLS Policy Audit Creates Data Access Blackouts

**What goes wrong:** Tightening Supabase RLS policies locks out legitimate users. Tables with RLS enabled but no policies deny ALL access by default. Adding restrictive policies without testing through the actual Supabase client SDK (not the SQL editor, which runs as postgres superuser and bypasses RLS) means the app silently returns empty results.

**Why it happens:** The Supabase SQL Editor bypasses RLS, so queries work there but fail for real users. Developers test in the wrong context and ship policies that block legitimate access. Per CONCERNS.md, clearance-check middleware is a placeholder -- tightening RLS without fixing this creates double-lockout.

**Consequences:** Users see empty dossier lists, blank dashboards, zero search results. No error is thrown -- queries succeed but return zero rows. This is especially dangerous for diplomatic data where missing information could affect real decisions.

**Prevention:**

1. Test EVERY policy change through the Supabase client SDK with a real authenticated user token, never through the SQL editor
2. Add integration tests that assert non-empty result sets for known test data with known user roles
3. Create an RLS policy audit checklist: table name, current policies, proposed change, tested via SDK (yes/no)
4. Index every column referenced in RLS policies (user_id, org_id, etc.) -- missing indexes cause timeouts on large tables
5. Deploy RLS changes to staging first with a 24-hour soak period

**Detection:** Empty API responses where data should exist. Dashboard widgets showing zero counts. Users reporting "everything disappeared."

**Phase:** Security hardening phase. CRITICAL priority.

### Pitfall 3: RTL Logical Property Migration Breaks Existing LTR Layout

**What goes wrong:** Replacing physical CSS properties (`ml-4`, `mr-4`, `text-right`) with logical properties (`ms-4`, `me-4`, `text-end`) fixes Arabic RTL but breaks English LTR layouts when the `dir` attribute is missing or incorrectly inherited. Components that previously rendered correctly in English now have reversed spacing.

**Why it happens:** Logical properties depend on the `dir` attribute being correctly set on the nearest ancestor. If a component is rendered outside a `dir="ltr"` context (e.g., in a portal, modal, or tooltip that renders at `<body>` level), logical properties default to LTR but may interact unexpectedly with parent direction contexts. The codebase has inconsistent RTL approaches per CONCERNS.md.

**Consequences:** English layout regressions: icons on wrong side of buttons, text aligned to wrong edge, spacing flipped. These are visually obvious but only caught if someone actually tests in English after the RTL fixes.

**Prevention:**

1. Ensure `<html dir="ltr">` or `<html dir="rtl">` is always set at document root
2. For portals/modals, explicitly set `dir` on the portal container
3. After EVERY logical property conversion, test in BOTH `dir="ltr"` AND `dir="rtl"` -- not just RTL
4. Use Stylelint `declaration-property-value-disallowed-list` to flag new physical property usage going forward
5. Convert shared components first (buttons, cards, inputs), then page layouts -- never both at once

**Detection:** Visual regression in English layouts. Spacing/alignment issues visible in screenshots. Directional icons pointing wrong way in LTR mode.

**Phase:** RTL/LTR theming consistency phase. HIGH priority.

### Pitfall 4: Security Middleware Ordering Breaks CORS/Preflight

**What goes wrong:** Adding Helmet, stricter CORS, or CSP headers in the wrong middleware order causes preflight OPTIONS requests to fail. The frontend starts getting CORS errors on every API call. Supabase Realtime websocket connections may also break if CSP doesn't allow the websocket origin.

**Why it happens:** Express middleware executes in registration order. If CORS middleware runs before Helmet, OPTIONS preflight requests don't get security headers. If Helmet runs with default CSP, it blocks inline scripts (breaking Vite HMR in dev), external API calls to Supabase, and websocket connections to Supabase Realtime.

**Consequences:** Complete frontend-backend communication failure. Realtime subscriptions drop. Dev environment broken by CSP blocking Vite's hot module replacement.

**Prevention:**

1. Middleware order must be: Helmet -> CORS -> rate limiting -> auth -> routes
2. Configure Helmet CSP to whitelist Supabase domains (`*.supabase.co`), Sentry DSN, and AnythingLLM endpoints
3. Add `connectSrc` directive for websocket origins (`wss://*.supabase.co`)
4. Test in development mode first -- Vite HMR requires `'unsafe-eval'` in dev CSP (but NOT production)
5. Add a health check endpoint that verifies CORS headers are present in the response

**Detection:** Browser console showing CORS errors. Realtime subscriptions disconnecting. `net::ERR_BLOCKED_BY_RESPONSE` errors. Vite HMR failing in dev.

**Phase:** Security hardening phase. HIGH priority.

### Pitfall 5: Console.log Removal Silences Error Handling

**What goes wrong:** During cleanup, `console.log`/`console.warn` statements are removed for production hygiene (as flagged in CONCERNS.md). But some of these are the ONLY error handling in certain code paths -- particularly in Redis cache fallback, vector embedding failures, and search timeouts. Removing them without replacing with proper structured logging means errors vanish entirely.

**Why it happens:** Developers treat "remove console.log" as a mechanical find-and-replace task. They don't audit whether each console statement is debug noise vs. the only error signal in a catch block.

**Consequences:** Redis cache failures become completely silent. Vector embedding generation fails with no trace. Search timeouts return partial results with zero logging. Debugging production issues becomes impossible.

**Prevention:**

1. For each `console.*` removal, check: is this inside a `catch` block? Is there any other error handling here?
2. Replace with structured logger (`logInfo`/`logError` already available per CONCERNS.md) before removing
3. Never remove and replace in separate commits -- do both atomically
4. Grep for the pattern `catch.*console` to find console-as-error-handling specifically

**Detection:** Monitoring gaps -- errors that used to appear in logs stop appearing. Redis cache miss rate increases but no warnings logged.

**Phase:** Code architecture consolidation phase. MEDIUM priority.

## Moderate Pitfalls

### Pitfall 6: Bundle Splitting Causes Waterfall Loading

**What goes wrong:** Aggressive code splitting with `React.lazy()` (already applied to heavy routes per PROJECT.md) can create waterfall loading chains: route chunk -> component chunk -> library chunk. Each requires a separate network round-trip.

**Prevention:**

1. Use Vite's `build.rollupOptions.output.manualChunks` to group related dependencies (e.g., all TanStack libraries in one chunk, all chart libraries in another)
2. Add `<link rel="prefetch">` hints for likely next routes
3. Profile with Vite's `--report` flag to identify chunk size distribution
4. Target chunks between 50KB-200KB -- smaller creates waterfall, larger defeats the purpose

**Phase:** Performance optimization phase. MEDIUM priority.

### Pitfall 7: Responsive Audit Breaks Desktop While Fixing Mobile

**What goes wrong:** Fixing mobile layouts by adding `flex-col` on base breakpoint and `flex-row` on `sm:` accidentally removes desktop-specific spacing, alignment, or overflow handling that was previously implicit.

**Prevention:**

1. Audit top-down: start from `lg:` (desktop) and verify it still works, then check `md:`, `sm:`, and base
2. Use browser DevTools responsive mode to test at exact breakpoints: 320px, 640px, 768px, 1024px, 1280px
3. Test dashboards and data tables specifically -- they break most at tablet width (768-1024px)
4. Never change a component's flex direction without checking all breakpoints

**Phase:** Mobile/tablet responsiveness phase. MEDIUM priority.

### Pitfall 8: Deduplicating Logic Breaks Subtle Behavioral Differences

**What goes wrong:** Two similar-looking functions for different dossier types get merged into one "generic" version. But the original functions had intentional differences (different validation rules, different default values, different RLS implications) that are lost in the merge.

**Prevention:**

1. Before merging, diff the two implementations line-by-line -- document every difference
2. If differences exist in validation, keep them separate or make the generic version configurable
3. Write tests for each original call site BEFORE refactoring, then verify tests still pass after
4. Pay special attention to the 8 dossier types -- each has unique fields and behaviors

**Phase:** Code architecture consolidation phase. MEDIUM priority.

### Pitfall 9: Removing "Unused" Environment Variables Breaks Deployment

**What goes wrong:** CONCERNS.md flags `.env` files in 7 locations. Consolidation effort removes variables that appear unused in code but are consumed by Docker, Supabase Edge Functions, or deployment scripts.

**Prevention:**

1. Grep across ALL directories (not just `backend/` and `frontend/`) including `deploy/`, `docker/`, `supabase/functions/`
2. Check `docker-compose.prod.yml` for `environment:` and `env_file:` references
3. Check Supabase Edge Function deployment configs
4. Never remove an env var without confirming it's absent from Docker configs and deployment scripts

**Phase:** Code architecture consolidation phase. MEDIUM priority.

## Minor Pitfalls

### Pitfall 10: Over-Memoizing in React 19

**What goes wrong:** Adding `useMemo`/`useCallback` everywhere during performance optimization. React 19's compiler automatically memoizes, making manual memoization redundant and adding overhead.

**Prevention:** Profile first with React DevTools Profiler. Only add manual memoization where the compiler can't optimize (e.g., complex context patterns). Remove existing unnecessary `useMemo`/`useCallback` where the compiler handles it.

**Phase:** Performance optimization phase. LOW priority.

### Pitfall 11: Tailwind v4 Purge Removes Dynamic Classes

**What goes wrong:** Tailwind v4's content scanning misses dynamically constructed class names (e.g., `` `text-${color}-500` ``). After cleanup, some runtime-generated classes disappear from the CSS bundle.

**Prevention:** Use safelist in Tailwind config for any dynamic class patterns. Replace string interpolation with explicit class maps: `const colorMap = { red: 'text-red-500', blue: 'text-blue-500' }`.

**Phase:** Code architecture consolidation phase. LOW priority.

### Pitfall 12: i18n Key Cleanup Removes Keys Used Only in Arabic

**What goes wrong:** Dead code tools flag i18n keys as unused because they only scan code for `t('key')` calls. Keys that exist only in `ar.json` (Arabic-specific formality variations, gender forms) get removed.

**Prevention:** Compare both `en.json` and `ar.json` key sets before removing any key. Use `i18next-parser` to extract used keys rather than manual scanning.

**Phase:** Dead code removal phase. LOW priority.

## Phase-Specific Warnings

| Phase Topic         | Likely Pitfall                           | Mitigation                                        |
| ------------------- | ---------------------------------------- | ------------------------------------------------- |
| Dead code removal   | Re-export chain breakage (#1)            | Build after every batch; allowlist `ui/` wrappers |
| Dead code removal   | i18n key loss (#12)                      | Compare both locale files before deletion         |
| Code consolidation  | Console.log removal silences errors (#5) | Replace with structured logger before removing    |
| Code consolidation  | Logic deduplication loses nuance (#8)    | Diff line-by-line; test before and after          |
| Code consolidation  | Env var removal breaks deploy (#9)       | Grep Docker and Edge Function configs             |
| Performance         | Bundle waterfall (#6)                    | Manual chunks in Vite; prefetch hints             |
| Performance         | Over-memoization (#10)                   | Profile first; trust React 19 compiler            |
| Security hardening  | RLS blackout (#2)                        | Test via SDK not SQL editor; staging soak         |
| Security hardening  | Middleware order breaks CORS (#4)        | Helmet -> CORS -> rate limit -> auth -> routes    |
| RTL/LTR consistency | Logical properties break LTR (#3)        | Test both directions after every change           |
| Responsive audit    | Desktop breaks while fixing mobile (#7)  | Test all breakpoints top-down                     |

## Sources

- [2025 Supabase Security Best Practices - Common Misconfigs](https://github.com/orgs/supabase/discussions/38690) -- RLS pitfalls from real pentests
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- Official RLS guidance
- [170+ Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) -- Real-world RLS failure
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) -- Official Express security guide
- [Helmet + CORS Ordering Issue](https://github.com/expressjs/cors/issues/149) -- Middleware ordering bug
- [CSS Logical Properties for RTL](https://dev.to/web_dev-usman/stop-fighting-rtl-layouts-use-css-logical-properties-for-better-design-5g3m) -- Logical properties migration
- [React 19 Compiler Makes useMemo/useCallback Obsolete](https://isitdev.com/react-19-compiler-usememo-usecallback-dead-2025/) -- React 19 memoization
- [Remove Unused Code - web.dev](https://web.dev/articles/remove-unused-code) -- Bundle optimization guidance

---

_Concerns audit: 2026-03-23_
