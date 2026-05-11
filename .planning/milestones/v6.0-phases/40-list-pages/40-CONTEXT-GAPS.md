# Phase 40: list-pages — Gap-Closure Context

**Mode:** Gap closure (`--gaps DesignV2`)
**Source:** `.planning/phases/40-list-pages/40-HUMAN-UAT.md` + `.planning/phases/40-list-pages/VERIFICATION.md`
**Goal:** Flip Phase 40 verdict from `PASS-WITH-DEVIATION` → `PASS` by closing the 8 gap items (G1–G8) surfaced in the 2026-04-26 live E2E run.
**Locked:** 2026-04-26
**Workspace:** DesignV2

This addendum supplements `40-CONTEXT.md` and `40-VALIDATION.md`. It does NOT add new requirements — LIST-01..04 already PASS via existing plans. It locks the resolution direction for 4 gray-area decisions so the planner can author concrete tasks.

<domain>
## Gap-Closure Boundary

**In scope:**

- Fix the 30 E2E spec failures the 2026-04-26 live run surfaced
- Stabilize the 14 visual baselines so they can be approved as the gate-of-record
- Reconcile spec assertions with the actual shipped implementation (per-plan SUMMARY Rule-3 deviations)
- Keep all 66/66 vitest unit tests green and all 6 existing E2E spec files

**Out of scope:**

- New features, new routes, new dossier types, schema migrations beyond the working_groups seed
- Refactoring legacy tables (Phase 43 QA owns that — see 40-CONTEXT.md D-13)
- Any change that risks LIST-01..04 PASS verdicts on existing plans

**Done means:**

- 0 E2E spec failures on chromium-darwin against running dev server
- 14/14 visual baselines stable across 3 consecutive replays
- axe-core: 0 violations on all 7 pages × LTR + AR
- VERIFICATION.md verdict updates from `PASS-WITH-DEVIATION` to `PASS`
- HUMAN-UAT.md items 1–10 all marked complete
  </domain>

<decisions>
## Locked Gap-Closure Decisions

### G1 — Horizontal overflow at <1280px (12 specs failing)

- **Locked:** Audit `frontend/src/components/list-page/ListPageShell.tsx` and `frontend/src/components/list-page/DossierTable.tsx` for any flex/grid child missing `min-w-0`. Apply `min-w-0` to the offending wrapper(s). If a single fix is insufficient, also add `overflow-x-hidden` to the outermost shell container.
- **Verification:** Spec `list-pages-render` passes at 320×720, 768×1024, 1280×800 viewports for all 7 pages × LTR + AR (84 cases).
- **Files in scope:** `ListPageShell.tsx`, `DossierTable.tsx`, `EngagementsList.tsx`, `PersonsGrid.tsx`.

### G2 — axe-core a11y violations on all 7 pages × LTR + AR (14 specs failing)

- **Locked:** Itemize violations first via `pnpm playwright test list-pages-a11y --reporter=html`, then fix in order:
  1. Add `<main>` landmark wrapping ListPageShell content (page-level role).
  2. Toggle `<html lang>` attribute to `ar` on AR runs (likely already wired in i18n provider — verify and fix if not).
  3. Audit chip color-contrast tokens against WCAG AA 4.5:1 (focus on `bg-warn-soft`, `bg-info-soft`, `border-line-soft`); adjust foreground tokens or chip variants as needed in `frontend/src/styles/tokens.css`.
- **Verification:** axe `AxeBuilder().analyze()` returns `violations: []` for all 7 pages × LTR + AR.

### G3 — RTL chevron `scaleX(-1)` not present on `/dossiers/countries`

- **Locked:** **Change the primitive**, not the spec. Replace Tailwind `rotate-180` with an inline `transform: scaleX(-1)` style (or a custom `.scale-x-flip` utility added to tailwind theme) on the row chevron in `DossierTable.tsx` (and any other primitive that flips a chevron in RTL).
- **Rationale:** Matches handoff CSS convention as decided in 40-CONTEXT.md and preserves spec strictness for handoff parity.
- **Verification:** Computed style `transform` on `[data-testid="row-chevron"]` matches `matrix(-1, 0, 0, 1, 0, 0)` (or equivalent scaleX form) on RTL runs across all 7 pages.

### G4 — Engagements filter pills `aria-pressed` toggle (2 specs failing)

- **Locked:** **Align spec to implemented type taxonomy.** Update `frontend/tests/e2e/list-pages-engagements.spec.ts` to assert against pill labels `meeting/call/travel/event` (matching shipped `EngagementsList` type-taxonomy filter). Verify `aria-pressed` toggles correctly between `false` ↔ `true` on click.
- **Rationale:** LIST-04 acceptance criterion is "search + filter pills" — taxonomy was never locked. Engagement-type taxonomy aligns with the real `engagement_type` column on `EngagementListItem` (per 40-09 SUMMARY's `toEngagementRow` mapper). No app code changes; spec-only.
- **Verification:** Spec `list-pages-engagements` clicks each of meeting/call/travel/event, asserts `aria-pressed="true"` on the clicked pill and `aria-pressed="false"` on the others, and asserts the filtered row count drops as expected.

### G5 — Engagement row click navigation fails (1 spec failing)

- **Locked:** Investigate whether the click target on `EngagementsList` rows bubbles correctly to the row's interactive element. Two failure modes possible:
  1. The clickable area is on a child `<button>` not the row wrapper — wrap the row content in a single `<button>` or `<Link>` so the entire row is clickable AND keyboard-accessible (44px min target enforced).
  2. The route shape `/dossiers/engagements/$id/overview` differs from the `/engagements/$id/overview` the spec asserts — align spec to actual TanStack Router config.
- **Verification:** Spec `list-pages-engagements` clicks the first row, `expect(page).toHaveURL(/\/(?:dossiers\/)?engagements\/[a-z0-9-]+\/overview/)` (loosen the regex if needed to accept the actual prefix), and asserts the engagement-detail page renders.

### G6 — `working_groups` page is empty (no seed data)

- **Locked:** **Seed 5–8 working_group test dossiers** to staging Supabase (project `zkrcjzdemdmwhearhfgg`) via a new migration `supabase/migrations/<timestamp>_seed_working_groups_test_data.sql` (or extend `supabase/seed.sql` if that's the project pattern — researcher to confirm). Bilingual `name_en`/`name_ar`, `status` variety covering all 4 chip mappings (`active`, `completed`, `planned`, `cancelled`), realistic `last_touch` timestamps spanning ~30 days.
- **Verification:** `curl https://zkrcjzdemdmwhearhfgg.supabase.co/rest/v1/dossiers?type=eq.working_group&select=count` returns ≥5; `working_groups` visual baseline file size ≈140 KB (parity with other pages).

### G7 — Visual baseline drift (9/14 specs replay-fail)

- **Locked:** **Full determinism stack:**
  1. **Clock freeze:** `await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })` in the `beforeEach` of `list-pages-visual.spec.ts` (Playwright 1.45+ feature).
  2. **Ready marker:** `ListPageShell.tsx` exposes `data-loading={isLoading ? 'true' : 'false'}` on its root container; specs `await page.waitForSelector('[data-loading="false"]')` before screenshot.
  3. **Transition suppression:** Add a test-only CSS injection `*, *::before, *::after { transition: none !important; animation: none !important; }` via `page.addStyleTag()` in `beforeEach`, OR a `data-testenv="true"` body attribute that triggers a CSS rule from a dedicated test-stylesheet (researcher picks the cleanest of the two).
- **Verification:** Run `pnpm playwright test list-pages-visual` 3 consecutive times; 14/14 baselines stable (0 pixel drift) across all 3 runs.

### G8 — Specs assume idealized props/taxonomies (reconciliation pass)

- **Locked:** Walk each Phase 40 SUMMARY's "Deviations" section and update the corresponding spec assertions in `frontend/tests/e2e/list-pages-*.spec.ts` to match shipped exports. Specific known-deviations to reconcile:
  - `EngagementListItem` field names: `name_en/name_ar/host_country_en/host_country_ar/engagement_type/engagement_status/participant_count` (per 40-02b + 40-09 SUMMARY)
  - `GenericListPageItem.statusChipClass` value mapping (per 40-06/07/08 SUMMARY)
  - Working-groups route directory: underscored `working_groups/` (per 40-08 SUMMARY)
  - `useTopics` shim signature wrapping `useDossiersByType('topic')` (per 40-07 SUMMARY)
  - VIP chip derivation from `importance_level >= 4` (per 40-05 SUMMARY) — no `is_vip` field
- **Verification:** All assertions in all 6 E2E spec files reference exports actually present in the shipped TypeScript types. `pnpm typecheck` of `frontend/tests/e2e/` passes (or `tsc --noEmit` on the spec files individually).
  </decisions>

<canonical_refs>

## Canonical References

### Gap source-of-truth (planner MUST read both)

- `.planning/phases/40-list-pages/40-HUMAN-UAT.md` — G1–G8 narrative + per-gap root-cause hypothesis
- `.planning/phases/40-list-pages/VERIFICATION.md` §"Live E2E run — 2026-04-26" — verdict, deviations, refined HUMAN-UAT items

### Per-plan deviations (planner MUST cross-reference for G8 reconciliation)

- `.planning/phases/40-list-pages/40-02b-SUMMARY.md` — Engagement-shape divergence
- `.planning/phases/40-list-pages/40-05-SUMMARY.md` — VIP chip derivation
- `.planning/phases/40-list-pages/40-06-SUMMARY.md` — Forums status mapping
- `.planning/phases/40-list-pages/40-07-SUMMARY.md` — Topics shim
- `.planning/phases/40-list-pages/40-08-SUMMARY.md` — Working-groups route + status mapping
- `.planning/phases/40-list-pages/40-09-SUMMARY.md` — `toEngagementRow` mapper

### Existing artifacts to fix (NOT recreate)

- `frontend/src/components/list-page/ListPageShell.tsx` (G1, G2, G7)
- `frontend/src/components/list-page/DossierTable.tsx` (G1, G3)
- `frontend/src/components/list-page/EngagementsList.tsx` (G1, G5)
- `frontend/src/components/list-page/PersonsGrid.tsx` (G1)
- `frontend/tests/e2e/list-pages-render.spec.ts` (G1)
- `frontend/tests/e2e/list-pages-a11y.spec.ts` (G2)
- `frontend/tests/e2e/list-pages-rtl.spec.ts` (G3)
- `frontend/tests/e2e/list-pages-engagements.spec.ts` (G4, G5, G8)
- `frontend/tests/e2e/list-pages-touch-targets.spec.ts` (G8)
- `frontend/tests/e2e/list-pages-visual.spec.ts` (G7)

### Originals (locked decisions still apply)

- `.planning/phases/40-list-pages/40-CONTEXT.md` — original phase context (RTL handoff convention, route shells, etc.)
- `.planning/phases/40-list-pages/40-VALIDATION.md` — Nyquist validation strategy (extend, do not replace)
- `.planning/REQUIREMENTS.md` §"List Pages (LIST)" — LIST-01..04 acceptance criteria
- `.planning/ROADMAP.md` §"Phase 40: list-pages" — phase goal + dependencies
  </canonical_refs>

<specifics>
## Wave Suggestion (planner may revise)

**Wave 0 (data + primitives — must land first):**

- G6: working_groups seed migration
- G3: chevron primitive scaleX(-1) swap
- G7 (a): `data-loading` ready-marker on ListPageShell

**Wave 1 (overflow + a11y — parallel, share ListPageShell so order matters):**

- G1: `min-w-0` audit + fix on ListPageShell/DossierTable/EngagementsList/PersonsGrid
- G2: a11y triage + fix landmarks/lang/contrast

**Wave 2 (engagements behavior — depends on G3 + G1):**

- G4: spec align to type taxonomy
- G5: row-click navigation fix (impl + spec)

**Wave 3 (test infra + spec reconciliation — depends on Wave 0/1/2):**

- G7 (b): clock.install + transition suppression in beforeEach
- G8: spec reconciliation pass against per-plan SUMMARY deviations

**Wave 4 (gate flip):**

- Re-run full E2E suite + capture stable baselines + flip VERIFICATION.md verdict to PASS
  </specifics>

<deferred>
## Deferred Ideas

- Legacy table cleanup (still Phase 43 QA per 40-CONTEXT.md D-13)
- Additional dossier types beyond the 8 already defined
- Status-axis filter for engagements (rejected in G4 decision)
- Production Supabase seeding (test data targets staging only)
  </deferred>

---

_Phase: 40-list-pages_
_Gap-closure context locked: 2026-04-26 via /gsd-plan-phase 40 --gaps DesignV2_
