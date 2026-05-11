---
plan_id: 40-18
phase: 40
phase_name: list-pages
mode: gap_closure
gaps_addressed: [G4, G8]
status: SUCCESS
date: 2026-04-26
files_modified:
  - frontend/tests/e2e/list-pages-render.spec.ts
  - frontend/tests/e2e/list-pages-rtl.spec.ts
  - frontend/tests/e2e/list-pages-engagements.spec.ts
  - frontend/tests/e2e/list-pages-a11y.spec.ts
  - frontend/tests/e2e/list-pages-touch-targets.spec.ts
---

# 40-18 — Reconcile 5 E2E specs with as-built primitives (G4 + G8)

## Outcome

SUCCESS. Five E2E specs reconciled against the actual primitives that landed
in 40-12 through 40-17. `pnpm exec eslint` clean on all 5 files; `tsc --noEmit`
clean on the spec inputs; `playwright test --list` resolves all 54 tests
across the 5 files.

## Per-spec reconciliation table

| Spec                               | Reconciliation                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Source plan         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `list-pages-render.spec.ts`        | Working-groups route → underscored `/dossiers/working_groups`. Added `[data-loading="false"]` ready-marker wait (40-13). Asserts `scrollWidth === clientWidth` AND a NEGATIVE contract: shell + first 2 descendant levels must NOT carry `overflow-x: auto/scroll` (40-14 clip-not-scroll posture).                                                                                                                                                                       | 40-08, 40-13, 40-14 |
| `list-pages-rtl.spec.ts`           | Selector flipped from `.icon-flip` → `[data-testid="row-chevron"]` (40-13 contract). Computed transform assertion tightened from regex match to exact `matrix(-1, 0, 0, 1, 0, 0)`. Added `[data-loading="false"]` settle. Removed dead `rotate-180` fallback branch (no longer rendered post-40-13).                                                                                                                                                                      | 40-13               |
| `list-pages-engagements.spec.ts`   | Filter taxonomy reconciled to the SHIPPED `FILTERS` array — 4 pills `all\|meeting\|call\|travel` (no `event`; the plan-asserted 5th pill is not in the component). Replaced `Confirmed/Pending` pill names with `meeting/call` regexes that match either i18n-localized or `defaultValue`-fallback labels. Added a parameterized harness asserting the clicked pill flips `aria-pressed='true'` while the rest stay `false`. Added `[data-loading="false"]` ready-marker. | 40-09, 40-16        |
| `list-pages-a11y.spec.ts`          | Working-groups underscored. Added explicit landmark assertion: `page.getByRole('region')` is visible + `aria-label` non-empty (40-15 chose `<section role="region">` because AppShell already renders the parent `<main>`). Added `<html lang>` and `<html dir>` sync assertions per locale (40-15 verified existing wiring in `src/i18n/index.ts`). Added focused `color-contrast/region/html-has-lang/valid-lang` violation gate to surface 40-15 regressions early.    | 40-08, 40-15        |
| `list-pages-touch-targets.spec.ts` | Working-groups underscored. Added engagement-row baseline `[data-testid="engagement-row"]` (40-16). Width assertion narrowed to chips/pills (compact controls); height ≥ 44 enforced for all rows (full-row buttons can have arbitrary column widths but must keep `min-h-11`).                                                                                                                                                                                           | 40-08, 40-14, 40-16 |

## Verification

| Check                                                                                                         | Result                                                                                 |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm exec eslint` on the 5 specs                                                                             | **PASS** — clean, 0 warnings/errors                                                    |
| `pnpm exec tsc --noEmit` on the 5 spec inputs (jsx ESM bundler)                                               | **PASS** — 0 errors                                                                    |
| `pnpm exec playwright test list-pages-{render,rtl,engagements,a11y,touch-targets} --list`                     | **PASS** — 54 tests resolved across 5 files                                            |
| `grep -rn "working-groups" frontend/tests/e2e/list-pages-{render,rtl,engagements,a11y,touch-targets}.spec.ts` | **PASS** — 0 hyphenated occurrences in scope                                           |
| `grep -rEn "is_vip\|isVip" frontend/tests/e2e/list-pages-*.spec.ts`                                           | **PASS** — 0 occurrences (no fixture files in scope ever set this anyway)              |
| `grep -rn "icon-flip" frontend/tests/e2e/list-pages-*.spec.ts`                                                | **PASS** — only a comment reference in rtl spec (documenting the legacy class)         |
| Live Playwright execution                                                                                     | **DEFERRED to HUMAN-UAT** — auth gate per Phase 40 posture (40-11 PASS-WITH-DEVIATION) |

## Truth markers (must_haves)

- ☑ Engagements filter spec asserts pill labels `meeting/call/travel` (NOT
  Confirmed/Pending). The 4th `event` pill from the original CONTEXT-GAPS
  draft does not exist in the shipped FILTERS array — spec uses the
  4 pills that the component actually renders (`all/meeting/call/travel`).
- ☑ Each pill click toggles `aria-pressed`: clicked = `'true'`, others = `'false'`.
- ☑ Working_groups spec uses underscored `/dossiers/working_groups`.
- ☑ Spec assertions reference 40-13 chevron `data-testid="row-chevron"` with
  computed `matrix(-1, 0, 0, 1, 0, 0)` exact match.
- ☑ Spec assertions reference 40-14 overflow contract: `scrollWidth==clientWidth`
  AND no `overflow-x: auto/scroll` on the ListPageShell content area.
- ☑ Spec assertions reference 40-15 region landmark + html lang/dir sync.
- ☑ Spec assertions reference 40-16 engagement-row testid + loosened URL regex.

## Deviations

### [Rule 1 — Bug] Plan asked for 5 filter pills; component ships 4

- **Plan said:** Replace `Confirmed/Pending/Travel` (3 pills) with
  `meeting/call/travel/event` (4 pills) — implying the 4th pill `event`
  exists.
- **Reality (verified in `frontend/src/components/list-page/EngagementsList.tsx:48`):**
  The shipped FILTERS array has exactly 4 entries:
  `all`, `meeting`, `call`, `travel`. There is NO `event` pill.
- **Fix:** Spec asserts the 4 pills the component actually renders. The
  `4 filter pills render with aria-pressed` assertion (`toHaveCount(4)`)
  is preserved and remains correct. The new toggle harness iterates
  `['all', 'meeting', 'call', 'travel']`. If the product later adds an
  `event` pill, the spec assertion should be widened in a follow-up.

### [Rule 2 — Surgical] Engagement field-name reconciliation N/A in this list

- **Plan said:** Walk specs and replace `engagement.name` →
  `engagement.name_en`, etc., per shipped `EngagementListItem`.
- **Reality:** None of the 5 specs in scope reference engagement fields
  via JS variables — they query the DOM via roles/testids. The
  `EngagementListItem` shape with `name_en/host_country_en/...` is used
  inside the page's `toEngagementRow` mapper, NOT inside the specs.
  The list-page spec consumes the rendered `EngagementRow` shape
  (`title_en/title_ar/type/status`) only via DOM assertions, so no
  field-name rewrite is required at the spec layer.
- **Fix:** Documented; no spec edits needed for this category.

### [Rule 3 — Out of scope] `list-pages-visual.spec.ts` still hyphenated

- **Issue:** `frontend/tests/e2e/list-pages-visual.spec.ts:17` still
  references `/dossiers/working-groups`.
- **Reality:** The visual spec is owned by **40-17** (visual-determinism
  stack). 40-18's plan explicitly excludes the visual spec ("Do NOT run
  live Playwright"; visual gate deferred to HUMAN-UAT).
- **Fix:** Left untouched. Recommend a one-line follow-up patch in the
  next human-UAT pass or a follow-up plan that owns visual-baseline
  regeneration (currently scoped to 40-19).

### [Rule 3 — Surgical] No live Playwright run

- Per plan: "Do NOT run live Playwright (auth gate); spec lint +
  Playwright `--list` smoke is sufficient."
- Lint + typecheck + `--list` all green; live execution remains the
  HUMAN-UAT responsibility (matches 40-11 PASS-WITH-DEVIATION posture).

## Files modified

- `frontend/tests/e2e/list-pages-render.spec.ts` (+49/−9)
- `frontend/tests/e2e/list-pages-rtl.spec.ts` (+22/−10)
- `frontend/tests/e2e/list-pages-engagements.spec.ts` (+39/−7)
- `frontend/tests/e2e/list-pages-a11y.spec.ts` (+34/−5)
- `frontend/tests/e2e/list-pages-touch-targets.spec.ts` (+22/−7)

## Blockers

None. 40-18 closes G4 (engagement-pill taxonomy aligned to shipped FILTERS)
and G8 (specs reconciled with as-built primitives across 40-12..40-17).
