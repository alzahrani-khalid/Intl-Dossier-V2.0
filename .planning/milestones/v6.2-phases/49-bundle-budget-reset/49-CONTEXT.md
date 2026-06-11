# Phase 49: Bundle Budget Reset - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Lower the `frontend/.size-limit.json` Total JS ceiling from the symbolic 2.43 MB to an enforced budget, route-split heavy chunks via `React.lazy()` based on a fresh visualizer-driven audit, decompose the 1.9 MB raw `vendor` super-chunk into named sub-vendor chunks (each with documented rationale per BUNDLE-04), and restore `Bundle Size Check (size-limit)` as a PR-blocking CI gate via branch protection on `main`. Resolution is by real budget tuning and code-split surgery — no rule disabling, no `// @ts-*` masking, no symbolic ceiling raising to absorb drift. Scope is the existing manualChunks strategy in `frontend/vite.config.ts` and the existing `.size-limit.json` entries; introducing new build tools (esbuild swap, Rollup plugin churn, alternative bundlers) is explicitly out of scope.

Measured baseline on `main` 2026-05-12:

- Initial JS (entry app chunk): **411.98 KB gz** (under symbolic 517 KB)
- React vendor: **347.13 KB gz** (under symbolic 349 KB; near native floor)
- TanStack vendor: **50.1 KB gz** (under symbolic 51 KB)
- Total JS: **2.42 MB gz** (right at symbolic 2.43 MB ceiling)
- Vendor super-chunk: **1.9 MB raw** / large gzipped — catch-all bucket for non-categorized deps
- App chunk raw: **1.4 MB** — eagerly-imported non-route components

</domain>

<decisions>
## Implementation Decisions

### Budget target values (BUNDLE-01)

- **D-01:** Lock the **Initial JS (entry app chunk) ceiling at 450 KB gz** in `.size-limit.json` — ~10% headroom over the 411.98 KB measured baseline. Justifies the BUNDLE-01 "≤500 KB initial-route gzip proposal" while making the budget enforceable (not aspirational). A PR that pushes initial to 451 KB is rejected.
- **D-02:** Lock the **Total JS ceiling at 1.8 MB gz** in `.size-limit.json` — ~25% reduction from the 2.42 MB baseline. This is the real ceiling BUNDLE-01 calls for ("real budget, not aspirational"). Achievement path: vendor super-chunk decomposition (D-07..D-09) + route-split (D-04..D-06) recovers the gap. If the audit shows 1.8 MB is unattainable inside the phase, the planner escalates with measured numbers before raising the ceiling — never silently.
- **D-03:** Re-baseline per-chunk ceilings to **`min(current ceiling, measured + 5 KB)`** — never raise an existing ceiling, only lower. Where the current ceiling is already tighter than `measured + 5 KB`, keep it (tighter is better; satisfies the BUNDLE-03 enforcement spirit without absorbing drift). Targets (current → locked):
  - `React vendor` — 349 KB gz unchanged (measured 347; current already tight at +2 KB)
  - `TanStack vendor` — 51 KB gz unchanged (measured 50.1; current already tight at +0.9 KB)
  - `signature-visuals/d3-geospatial` — 55 KB gz unchanged (measured 54.15; current already tight at +0.85 KB)
  - `signature-visuals/static-primitives` — **64 KB → 12 KB** (measured 9; the only existing entry that needed lowering; symbolic oversized 64 dropped)
  - Sub-vendor chunks added in D-07 (heroui/sentry/dnd; optional pdf/editor) — each new ceiling = `measured + 5 KB` (these are additions, not raises)
    Tight ceilings make BUNDLE-03's "above-ceiling = reject" rule bite at small deltas. Loose ceilings absorb drift silently up to the slack budget; the slack between measured and ceiling is the documented absorption budget.

### Route-split + component lazy() scope (BUNDLE-02)

- **D-04:** Route-level code-splitting is **already satisfied** by `TanStackRouterVite({ autoCodeSplitting: true })` in `vite.config.ts`. Phase 49 does **not** add manual route-level `React.lazy()` per route file — the router already emits one chunk per route. The Phase 49 BUNDLE-02 work is at the **component layer below routes**, not the route layer.
- **D-05:** Run an `ANALYZE=true pnpm build` pass (rollup-plugin-visualizer is already wired) and treat `dist/stats.html` as the audit artifact. Commit the audit summary to `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` with: top-20 chunks by gz size, suspected culprits in the `app` chunk (eagerly-imported heavy components), and the proposed lazy() candidates. Without an audit-first artifact, lazy() picks become guesswork.
- **D-06:** Lazy() candidate threshold — a component is converted to `React.lazy()` when (a) its post-split chunk is **≥30 KB gz** on its own, AND (b) it is **not in the initial render path** of any route (no eager fallback render). Examples from the existing tree: `FullScreenGraphModal` (already lazy — keep), modals + drawers (`CalendarEntryForm`, `EntityLinkManager` at 48 KB raw, `DossierShell` only if not in initial path), heavy-chart components (`stakeholder-influence`, `sla-monitoring`, `custom-dashboard`, `workflow-automation`). Components below 30 KB gz stay eager — lazy() boundaries have their own overhead and Suspense fallback cost.

### Vendor super-chunk decomposition (BUNDLE-04)

- **D-07:** Decompose the catch-all `vendor` chunk in `vite.config.ts` `manualChunks` by adding **named sub-vendor chunks** for the heaviest grouped deps. Required additions:
  - `heroui-vendor` — `@heroui/*` (HeroUI v3 is the primary primitive cascade per CLAUDE.md)
  - `sentry-vendor` — `@sentry/*` (error tracking — heavy and not initial-path-critical)
  - `dnd-vendor` — `@dnd-kit/*` (kanban + reorder; not initial-path-critical)
  - `radix-vendor` — already present; keep
  - `forms-vendor` — already present; keep
    Optional (planner verifies presence via `pnpm list`):
  - `pdf-vendor` — `pdf-lib`, `pdfjs-dist`, or `jspdf` (if any is in the tree)
  - `editor-vendor` — `tiptap`, `prosemirror`, or `@codemirror` (if any is in the tree)
- **D-08:** After D-07, the residual `vendor` bucket should drop substantially. **If the residual `vendor` chunk is still >100 KB gz**, document each remaining dep ≥10 KB gz in `frontend/docs/bundle-budget.md` (per BUNDLE-04) with: dep name, gz cost, why it's still grouped (e.g., "used by 3+ vendors transitively, not worth its own chunk").
- **D-09:** Every chunk >100 KB gz (whether vendor or app-side) gets a row in `frontend/docs/bundle-budget.md` with: chunk name, gz size, current ceiling, rationale. This is the BUNDLE-04 "documented rationale" artifact. Use a sibling note (not `.size-limit.json` comments) because the rationale is long-form (multi-sentence per chunk), would bloat the JSON, and JSON has no native comment syntax (size-limit's CLI tolerates JSONC but tooling like `assert-size-limit-matches.mjs` reads raw JSON).

### CI gate restoration (BUNDLE-03)

- **D-10:** Add `Bundle Size Check (size-limit)` to the required-contexts list on `main` branch protection alongside `Lint`, `type-check`, and `Security Scan`. The job already exists in `.github/workflows/ci.yml` (lines 270–296) with `needs: [lint, type-check]` — that chain stays. The only change is the GitHub branch-protection setting (API/UI), not the workflow file. `enforce_admins: true` stays — Phase 47 D-09 / Phase 48 D-15 posture carries forward.
- **D-11:** size-limit's native fail-on-exceed behavior IS the BUNDLE-03 enforcement — a PR that pushes any measured chunk above its locked ceiling fails the `pnpm -C frontend size-limit` step → fails the `bundle-size-check` job → blocks merge via D-10. No custom baseline-delta calculator. Per-chunk ceilings (D-03 measured-or-tighter + D-07 sub-vendors measured + 5 KB) determine strictness: a PR adding less than the per-chunk slack passes silently; a PR pushing over the ceiling is rejected. Reviewers tighten ceilings further during PR review if a drift pattern emerges.
- **D-12:** **Two smoke PRs prove the gate BLOCKS** — mirrors Phase 48 D-16. PR-A: add an eager dynamic import of a heavy lib (e.g., `import * as d3 from 'd3'` at the top of `frontend/src/App.tsx`) to push Initial JS > 450 KB. PR-B: add a dummy import that pushes one sub-vendor chunk > its D-03 ceiling. Each PR must show `Bundle Size Check (size-limit)` as **failed** and `mergeStateStatus: BLOCKED`. Both close out the BUNDLE-03 acceptance evidence.

### Suspense fallback (carried into D-06 lazy work)

- **D-13:** Reuse the existing **`GlobeSpinner`** primitive (`frontend/design-system/inteldossier_handoff_design/src/loader.jsx` is the prototype reference; the production port lives in `frontend/src/components/ui/`) for any route-level Suspense fallback added in D-06. For embedded lazy components (modals, drawer panels, charts), use a lightweight token-styled skeleton — `border: 1px solid var(--line)`, no shadow, density-aware row heights (`var(--row-h)`). Both follow CLAUDE.md §"Design rules" verbatim.

### Suppression policy (carried from Phase 47 D-01 / Phase 48 D-17)

- **D-14:** **Zero net-new `eslint-disable` / `@ts-ignore` / `@ts-expect-error` / size-limit ceiling-raising introduced during Phase 49.** Executor greps the diff for new disable strings and ceiling increases before commit; failure if the count of either rises. Any genuinely required exception escalates to a named entry in the existing `EXCEPTIONS.md` ledger.

### Claude's Discretion

- Number of sub-plans (one plan, three plans, or split by audit / route-split / vendor-split / CI) is the planner's call. Natural cleavage: 49-01 audit + budget calibration (D-01..D-03 + D-05 + D-09), 49-02 vendor decomposition + lazy() conversion (D-04 + D-06 + D-07..D-08 + D-13), 49-03 CI gate + branch protection + smoke PRs (D-10..D-12). Mirrors the Phase 47/48 sequencing rhythm. Planner may merge or split.
- Order of D-07 vendor decomposition vs D-06 component lazy() — executor's call. Either order is safe; vendor-first usually surfaces clearer gz wins in the audit artifact.
- Whether to add a one-off `pnpm bundle:report` script that runs `ANALYZE=true pnpm build` and opens `dist/stats.html` — at the planner's discretion; useful for periodic audits, not required for the gate.
- Whether to keep `signature-visuals/static-primitives` ceiling at 12 KB gz or drop the entry entirely (it sits at 9 KB and may not warrant its own row) — planner's call after the audit.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` §"Phase 49: Bundle Budget Reset" — Goal, depends-on, success criteria.
- `.planning/REQUIREMENTS.md` §"Bundle (BUNDLE)" — BUNDLE-01..04 verbatim, including the "real budget, not aspirational" and "above-ceiling = reject" rules.
- `.planning/notes/v6.2-rationale.md` — Why v6.2 fixes bundle drift before v7.0; the historical 200 KB v2.0 target lineage and the 815 KB / 2.43 MB ceiling drift story.
- `.planning/STATE.md` — Phase 48 closure note; v6.2 phase map (47/48/49) and the v7.0 trigger ("v6.2 ships").

### Prior phase context (carried forward — read for posture)

- `.planning/phases/47-type-check-zero/47-CONTEXT.md` — D-01 (zero net-new suppression), D-08 (CI job split rationale), D-09 (branch-protection with `enforce_admins: true`), D-13 (smoke-test PR pattern).
- `.planning/phases/48-lint-config-alignment/48-CONTEXT.md` — D-14 (single CI job + `needs: [lint, type-check]` chain), D-15 (branch-protection required-contexts pattern), D-16 (two smoke PRs per workspace), D-17 (zero net-new eslint-disable count rule).

### Project conventions (non-negotiable)

- `CLAUDE.md` §"Design rules — non-negotiable" — 1px borders, no card shadows, density-aware row heights, no gradients. Drives the D-13 Suspense fallback styling.
- `CLAUDE.md` §"Component Library Strategy" — HeroUI v3 → Radix → custom primitive cascade. Justifies `heroui-vendor` and `radix-vendor` sub-vendor names in D-07.
- `CLAUDE.md` §"Logging" — Sentry frontend + backend (drives `sentry-vendor` as a heavy non-initial-path chunk in D-07).
- `CLAUDE.md` §"Karpathy Coding Principles" §3 "Surgical Changes" — bounds the audit-driven lazy() scope in D-05/D-06; no opportunistic refactors during bundle cleanup.

### Build + CI wiring (read before changing)

- `frontend/vite.config.ts` — current `manualChunks` strategy (lines ~120–185); `TanStackRouterVite({ autoCodeSplitting: true })` (line ~32); `chunkSizeWarningLimit: 500`; rollup-plugin-visualizer behind `ANALYZE=true`.
- `frontend/.size-limit.json` — current chunk entries the phase replaces (Initial 517 / React 349 / TanStack 51 / Total 2.43 MB / two signature-visuals rows).
- `frontend/scripts/assert-size-limit-matches.mjs` — sanity check that every `.size-limit.json` glob matches at least one built file. Phase 49 must keep this passing after vendor decomposition adds new chunk names.
- `.github/workflows/ci.yml` §`bundle-size-check` (lines 270–296) — existing job to wire into branch protection in D-10; do **not** edit its `needs: [lint, type-check]` chain.
- `frontend/package.json` `size-limit` and `analyze` scripts — confirm both stay working after `.size-limit.json` rewrite.

### Codebase maps (scout-quality references)

- `.planning/codebase/STRUCTURE.md` §"frontend/" — confirms `src/routes/` is file-based (TanStack auto-split) and `src/components/` is the right layer for D-06 component lazy() work.
- `.planning/codebase/STACK.md` — dep inventory for D-07 sub-vendor identification (HeroUI, Sentry, dnd-kit, charts, etc.).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`rollup-plugin-visualizer`** wired via `ANALYZE=true pnpm build` in `frontend/vite.config.ts` — D-05 uses this directly; no plugin install needed.
- **`TanStackRouterVite({ autoCodeSplitting: true })`** — D-04 confirms route-level splitting is already done; Phase 49 does not duplicate this.
- **Existing `manualChunks` strategy** — `react-vendor`, `tanstack-vendor`, `motion-vendor`, `radix-vendor`, `signature-visuals-d3`, `charts-vendor`, `i18n-vendor`, `supabase-vendor`, `forms-vendor` are already named. D-07 adds to this set, does not rewrite it.
- **`FullScreenGraphModal` lazy() pattern** (`frontend/src/components/graph/FullScreenGraphModal.tsx`) — the existing React.lazy() pattern with its 200 KB-budget header comment is the template for D-06 conversions. Copy its shape, not its hardcoded 200 KB number (that's stale v2.0 target lineage).
- **6 existing engagement tab lazy() uses** (`frontend/src/routes/_protected/engagements/$engagementId/{overview,calendar,audit,docs,tasks,context}.tsx`) — proves the team's React.lazy() + Suspense pattern; D-06 follows it.
- **`GlobeSpinner`** (`frontend/design-system/inteldossier_handoff_design/src/loader.jsx`) — D-13 Suspense fallback primitive.

### Established Patterns

- **Single CI job per concern + `needs: [lint, type-check]` chain** — Phase 48 D-14. D-10 carries this; the `bundle-size-check` job already follows it.
- **Branch protection with `enforce_admins: true` + required contexts** — Phase 47 D-09 / Phase 48 D-15. D-10 carries this.
- **Two smoke PRs per workspace prove gate BLOCKS** — Phase 48 D-16. D-12 carries this (one PR per failure surface: initial chunk + sub-vendor).
- **Zero net-new suppressions per milestone** — Phase 47 D-01 / Phase 48 D-17. D-14 (Phase 49) extends this to size-limit ceiling-raising.
- **Sibling note over inline JSON comments** — `.size-limit.json` is raw JSON read by `assert-size-limit-matches.mjs`; long-form rationale lives in `frontend/docs/bundle-budget.md`.

### Integration Points

- **`frontend/vite.config.ts` `manualChunks` arrow** — D-07 adds new `if (id.includes('@heroui'))`, `if (id.includes('@sentry'))`, `if (id.includes('@dnd-kit'))` branches before the final `return 'vendor'` fallback.
- **`frontend/.size-limit.json`** — D-01..D-03 rewrite ceilings; D-07 adds new sub-vendor entries.
- **`.github/branch-protection` setting on `main`** — D-10 updates required contexts via the GitHub API or UI (no code change in this repo; reference in the plan).
- **`frontend/docs/bundle-budget.md`** — new file, D-09 creates it. Index of every chunk >100 KB gz with rationale.

</code_context>

<specifics>
## Specific Ideas

- **Audit artifact lives in `.planning/`, not `frontend/`** — `49-BUNDLE-AUDIT.md` is a one-shot artifact (top-20 chunks at audit time, lazy() candidate list). It captures a moment in time; `frontend/docs/bundle-budget.md` is the living rationale doc.
- **Per-chunk + 5 KB headroom** is the tightness rule. Looser headroom (10%+ across the board) silently absorbs drift; tighter (0 KB) trips on every legitimate dep upgrade.
- **Total JS ceiling is computed, not negotiated** — sum the per-chunk ceilings + ~5% slack for unanticipated splits. D-02's 1.8 MB target is the reduction goal; the actual locked value is the larger of (1.8 MB, sum-of-chunk-ceilings + slack).

</specifics>

<deferred>
## Deferred Ideas

- **Esbuild → SWC swap, alternative bundlers, custom Rollup plugins** — out of scope. Phase 49 tunes the existing Vite + Rollup stack; tooling swaps belong in their own milestone.
- **Lighthouse CI as a PR-blocking gate** — `lighthouse-ci` job exists in `ci.yml` with `continue-on-error: true`. Promoting it to required-context is a separate concern (perf budgets, not just bundle size); revisit after BUNDLE-01..04 land.
- **Strict perf budgets per-route (TTI, FCP, LCP)** — beyond gz size of static chunks. Belongs in a future "Frontend Performance" milestone alongside Lighthouse promotion.
- **Server-side rendering / hydration cost reduction** — current app is fully client-rendered (SPA). SSR is a v8+ concern, not v6.2.
- **Dynamic feature-flag-driven imports** — interesting future direction (e.g., load Sentry only if `SENTRY_DSN` is set at runtime). Out of scope; D-07 puts Sentry in its own chunk so this is a one-line follow-up later.

</deferred>

---

_Phase: 49-bundle-budget-reset_
_Context gathered: 2026-05-12_
