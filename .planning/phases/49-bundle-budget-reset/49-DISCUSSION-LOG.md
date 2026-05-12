# Phase 49: Bundle Budget Reset - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 49-bundle-budget-reset
**Areas discussed:** Budget target values, Route-split scope, Vendor super-chunk strategy, CI gate + branch protection

---

## Gray-area selection

| Option                      | Description                                                     | Selected |
| --------------------------- | --------------------------------------------------------------- | -------- |
| Budget target values        | Real ceilings (Initial, Total JS, per-chunk), headroom strategy | ✓        |
| Route-split scope           | Top-N audit-driven vs all \_protected/ routes                   | ✓        |
| Vendor super-chunk strategy | Split into sub-vendors vs accept + document                     | ✓        |
| CI gate + branch protection | Add as required context; PR delta behavior                      | ✓        |

**User's choice:** "Can you decide the best for all gray area" — full delegation to Claude across all four areas.

**Notes:** User invoked discuss-phase with no prior CONTEXT.md and immediately delegated. Phase 49 has fully locked requirements via REQUIREMENTS.md BUNDLE-01..04 and the ROADMAP §"Phase 49" success-criteria block, so the gray areas are purely about HOW to satisfy each requirement. Delegation is reasonable given the analyst already has measurements on `main` (Initial 412 KB gz, Total 2.42 MB gz, vendor super-chunk 1.9 MB raw) and the Phase 47/48 patterns to mirror.

---

## Budget target values (D-01..D-03)

| Option                                        | Description                                              | Selected |
| --------------------------------------------- | -------------------------------------------------------- | -------- |
| Initial ≤500 KB gz (REQUIREMENTS literal)     | Loose ceiling, ~88 KB headroom over baseline             |          |
| Initial 450 KB gz (~10% headroom over 412 KB) | Enforces real budget while allowing minor feature growth | ✓        |
| Initial 415 KB gz (~1% headroom)              | Tight; trips on any dep upgrade                          |          |

**Selected:** Initial 450 KB gz, Total 1.8 MB gz, per-chunk = measured + 5 KB.

**Rationale logged in CONTEXT.md D-01..D-03:** ≤500 KB is the floor the ROADMAP proposes; 450 KB locks a real budget below it. Total 1.8 MB requires the vendor decomposition + lazy() work to actually land — if the audit shows it's unachievable, planner escalates with numbers rather than silently raising. Per-chunk + 5 KB headroom mirrors the tightness the BUNDLE-03 "≥1 KB delta = reject" rule requires to be meaningful.

---

## Route-split scope (D-04..D-06)

| Option                                              | Description                                             | Selected |
| --------------------------------------------------- | ------------------------------------------------------- | -------- |
| Blanket lazy() on all \_protected/ route files      | High overhead, ignores existing autoCodeSplitting       |          |
| Audit-driven component lazy() (≥30 KB gz threshold) | Surgical, follows existing FullScreenGraphModal pattern | ✓        |
| Do nothing (rely on autoCodeSplitting alone)        | Fails BUNDLE-02 — heavy non-route components stay eager |          |

**Selected:** Audit-driven component-layer lazy() below the route layer.

**Rationale logged in CONTEXT.md D-04..D-06:** TanStack `autoCodeSplitting: true` already emits one chunk per route file — adding manual `React.lazy()` per route is duplicate work. The real bloat sits in the `app-*.js` (1.4 MB raw) chunk from eagerly-imported non-route components: modals, drawers, chart-heavy panels. `ANALYZE=true pnpm build` (rollup-plugin-visualizer is wired) produces the audit; threshold ≥30 KB gz + not-in-initial-path is the lazy() filter.

---

## Vendor super-chunk strategy (D-07..D-09)

| Option                                                    | Description                                                                         | Selected |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Decompose into named sub-vendors (heroui-, sentry-, dnd-) | Surfaces gz wins, makes BUNDLE-04 rationale concrete                                | ✓        |
| Accept 1.9 MB raw vendor bucket + document only           | Cheaper; fails BUNDLE-04 "every chunk >100 KB has rationale" if residual stays huge |          |
| Inline all vendor deps into app chunk                     | Reverses BUNDLE-02 goal; eliminates caching benefit                                 |          |

**Selected:** Decompose; required sub-vendors `heroui-vendor`, `sentry-vendor`, `dnd-vendor`; optional `pdf-vendor`, `editor-vendor` (planner verifies presence).

**Rationale logged in CONTEXT.md D-07..D-09:** The catch-all `vendor` chunk hides three or four heavy deps that cache-bust each other on minor upgrades. Splitting into named sub-vendors (a) recovers the Total JS reduction needed for D-02, (b) gives each chunk a row in `frontend/docs/bundle-budget.md` per BUNDLE-04, (c) means an HeroUI upgrade doesn't invalidate the Sentry chunk's CDN cache. Sibling doc beats JSON comments because the rationale is multi-sentence per chunk and `.size-limit.json` is read by tooling that doesn't tolerate JSONC universally.

---

## CI gate + branch protection (D-10..D-12)

| Option                                                  | Description                                                   | Selected |
| ------------------------------------------------------- | ------------------------------------------------------------- | -------- |
| Add bundle-size-check to required contexts on main      | Restores PR-blocking behavior; minimal change (settings only) | ✓        |
| Leave bundle-size-check non-blocking; rely on PR review | Fails BUNDLE-03 "PR-blocking CI gate"                         |          |
| Split into two CI jobs (initial + total)                | Adds CI minutes; same enforcement outcome                     |          |

**Selected:** Single job + branch-protection required context; two smoke PRs prove BLOCK.

**Rationale logged in CONTEXT.md D-10..D-12:** The `bundle-size-check` job already exists in `.github/workflows/ci.yml` (lines 270–296) with `needs: [lint, type-check]` — the chain Phase 48 established. Adding it to required contexts is a settings change (GitHub API or UI), not a workflow edit. `enforce_admins: true` from Phase 47/48 carries forward. Two smoke PRs (initial-chunk bloat + sub-vendor bloat) mirror Phase 48 D-16 and close out the BUNDLE-03 acceptance evidence — protection API response alone doesn't prove BLOCKS (Phase 47 D-13 / Phase 48 D-16 lesson).

---

## Claude's Discretion

- **Number of sub-plans** — recommended cleavage: 49-01 audit + budget calibration, 49-02 vendor decomposition + lazy() conversion, 49-03 CI gate + smoke PRs. Planner may merge or split.
- **Order of vendor decomposition vs component lazy()** — executor's call; vendor-first usually surfaces clearer gz wins in the audit.
- **`pnpm bundle:report` convenience script** — optional; useful for periodic audits, not required for the gate.
- **`signature-visuals/static-primitives` ceiling** — keep at 12 KB or drop the entry after audit; planner's call.

---

## Deferred Ideas

- Esbuild → SWC swap and alternative bundlers — separate tooling milestone.
- Promoting Lighthouse CI to PR-blocking — separate "Frontend Performance" milestone alongside per-route perf budgets (TTI, FCP, LCP).
- SSR / hydration cost reduction — v8+ concern.
- Dynamic feature-flag-driven imports (e.g., load Sentry only if `SENTRY_DSN` set at runtime) — one-line follow-up after D-07 puts Sentry in its own chunk.
