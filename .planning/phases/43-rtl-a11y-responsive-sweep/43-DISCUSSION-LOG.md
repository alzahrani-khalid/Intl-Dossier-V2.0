# Phase 43: rtl-a11y-responsive-sweep — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 43-rtl-a11y-responsive-sweep
**Areas discussed:** Test architecture, Responsive sweep depth, rtl-icons.md scope, Direction × mode matrix, CI gate enforcement

---

## Test Architecture

| Option                                           | Description                                                                                                                                                 | Selected |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Hybrid: shared helpers + cross-cutting axe sweep | Keep per-phase specs; add helpers + cross-cutting `qa-sweep-axe` + `qa-sweep-keyboard`. Failure isolation per phase preserved; cross-cutting catches drift. | ✓        |
| Aggregate single sweep                           | Replace per-phase specs with one mega-spec looping all routes × all dims. Simpler matrix; harder to debug; deletes well-tuned specs.                        |          |
| Per-phase extension                              | Extend each phase's existing spec with 6-bp + keyboard. Best isolation; 13 PRs of churn; duplicated axe setup.                                              |          |

**User's choice:** Hybrid (recommended)
**Notes:** Followed up with route-registry location — chose `tests/e2e/helpers/v6-routes.ts` (typed TS module) over runtime `routeTree.gen.ts` derivation or JSON co-location.

---

## Responsive Sweep Depth

| Option                                           | Description                                                                                                                 | Selected |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| Render-assertions at 5 bps; keep 1280 visual     | Carry forward Phase 38/40/41/42 precedent. Existing 1280 LTR+AR baselines stay; render-assertions at 320/640/768/1024/1536. | ✓        |
| Visual baselines at all 6 breakpoints × LTR+AR   | 156 baselines. Catches every pixel shift; maintenance burden heavy; CI runtime balloons.                                    |          |
| Render-assertions only (drop 1280 visual)        | No new visual regression. Lowest cost, lowest catch.                                                                        |          |
| Hybrid: 1280 + 768 visual; render-assert other 4 | 52 baselines. Mid cost.                                                                                                     |          |

**User's choice:** Render-assertions at 5 bps; keep 1280 visual (recommended)

### Render-Assertion Battery (multiSelect)

| Assertion                                                      | Selected |
| -------------------------------------------------------------- | -------- |
| No horizontal scroll on body/main                              | ✓        |
| All interactive elements ≥44×44px                              | ✓        |
| Key landmarks visible (`<main>`, `<nav>`, `<h1>`, primary CTA) | ✓        |
| Sidebar collapse / mobile drawer behavior at ≤768px            | ✓        |

**User's choice:** All four assertions enabled

---

## rtl-icons.md Scope & Format

| Option                                    | Description                                                                                        | Selected |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Comprehensive table + LTR/RTL screenshots | Full audit of every directional glyph + flip mechanisms section + paired screenshots. Audit-grade. | ✓        |
| Minimal one-pager                         | Just 5 named items + sparkline rule. ~30 lines.                                                    |          |
| ADR-style decision record                 | Context + decision + consequences. Harder to discover for ICs.                                     |          |
| Living component-story format             | Per-icon Storybook stories. Requires Storybook bootstrap (33-08 deferred).                         |          |

**User's choice:** Comprehensive (recommended)

### Screenshot Generation

| Option                                                          | Description                                                                                      | Selected |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Generated by Playwright spec; committed under `docs/rtl-icons/` | Opt-in `qa-sweep-icon-screenshots.spec.ts`; regenerable on token changes; reviewable as PR diff. | ✓        |
| Manual screenshots, committed                                   | Zero infra; drifts on token changes.                                                             |          |
| Inline SVG snippets                                             | Always current; misses composed surface (icon inside row with text).                             |          |

**User's choice:** Generated by Playwright spec (recommended)

---

## Direction × Mode × Locale Matrix

### axe-core Scope

| Option                                                   | Description                                                                                           | Selected |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| 13 routes × LTR + AR @ Bureau-light                      | 26 sweeps. Sufficient for WCAG 2A/2AA semantics (roles/names/labels invariant across direction/mode). | ✓        |
| 13 routes × LTR + AR × 4 directions × 2 modes            | 208 sweeps. Heavy CI cost; mostly duplicate findings.                                                 |          |
| 13 routes × LTR + AR @ Bureau-light + AR @ Chancery-dark | 39 sweeps. Two contrast samples; mid-cost compromise.                                                 |          |

**User's choice:** 13 × LTR+AR @ Bureau-light (recommended)

### Focus-Outline Verification

| Option                                                  | Description                                                                                   | Selected |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| 1 representative route × 4 dirs × 2 modes = 8 baselines | Settings (most diverse primitives). Pair with programmatic `--focus-ring` contrast assertion. | ✓        |
| Programmatic only — read `--focus-ring` per combo       | No screenshots. Misses z-index / clip-path / overflow:hidden bugs.                            |          |
| Full 13 routes × 4 dirs × 2 modes = 104 baselines       | Comprehensive; per-route variation rare for global focus token.                               |          |
| Manual UAT checklist only                               | Lowest cost, no regression catch.                                                             |          |

**User's choice:** 8 baselines on Settings (recommended)

### Keyboard Navigation

| Option                                                      | Description                                                                                                                                 | Selected |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Per-route Tab-walk assertion in `qa-sweep-keyboard.spec.ts` | Count visible interactives, Tab N+1 times, assert each is reached exactly once (set membership). Catches focus-traps + hidden-but-tabbable. | ✓        |
| Tab-order serialization + golden-file diff                  | Order regressions caught; legitimate changes cause churn.                                                                                   |          |
| Spot-check key flows only                                   | Doesn't enforce 'reaches every target'.                                                                                                     |          |
| Skip dedicated keyboard spec; rely on axe + manual UAT      | axe doesn't trace Tab path; manual UAT drifts.                                                                                              |          |

**User's choice:** Per-route Tab-walk (recommended)

---

## CI Gate Enforcement (multiSelect)

| Gate                                       | Selected |
| ------------------------------------------ | -------- |
| ESLint rtl-friendly = block                | ✓        |
| axe-core zero violations = block           | ✓        |
| Render-assertions at 5 breakpoints = block | ✓        |
| Keyboard Tab-walk = block                  | ✓        |

**User's choice:** All four gates blocking
**Notes:** Focus-outline visual baselines and icon-screenshot specs run advisory only (not blocking) so token tweaks don't ship-block on cosmetic drift.

---

## Claude's Discretion

- Wave structure (3-wave: infra → parallel sweeps → gate + remediation) per Phase 38/40/41/42 precedent.
- Test runtime budget target <10 min on CI; shard by locale if needed.
- Mock data vs real: use existing dev server + `list-pages-auth.ts` helper.
- axe rule tolerance: zero violations on `wcag2a/2aa/21aa`; `best-practice` advisory only.
- Direction probe: reuse `window.__design` Phase 33-09 hatch.
- Tab-walk filter: exclude hidden / aria-hidden / display:none from interactive count.
- Touch-target tolerance: rendered `boundingBox`, not SVG glyph size.
- Bilingual digit rendering: `toArDigits` for any new fixture pages.

## Deferred Ideas

- Visual baselines at all 6 breakpoints (rejected — maintenance burden)
- Per-direction × per-mode axe sweep (rejected — semantic invariance)
- Per-route focus-outline visual baselines (rejected — global token)
- Storybook-backed living icon stories (Phase 33-08 still deferred)
- Tab-order golden-file diff (over-constrains)
- Replacing per-phase specs with aggregate sweep (failure isolation valued)
- `lucide-react` → Phase 37 `<Icon/>` migration (further deferred from Phase 42)
- Legacy primitive cleanup (DataTable etc. — Phase 40 D-13 carry-forward)
- Backend / admin / legacy non-v6.0 routes (out of scope)
- `best-practice` axe tag enforcement (informational only)
- Performance / Core Web Vitals gates (future perf phase)
- Automated screenshot regeneration in CI (PR noise on token tweaks)
