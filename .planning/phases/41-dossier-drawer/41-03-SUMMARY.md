---
phase: 41
plan: 03
subsystem: dossier-drawer
tags: [drawer, wave-1, kpi-strip, summary, rtl, i18n, tdd]
requires:
  - frontend/src/types/dossier-overview.types.ts (DossierOverviewResponse — verified field shape)
  - frontend/src/lib/i18n/toArDigits.ts (Western → Arabic-Indic digit transformer)
  - frontend/src/components/ui/ltr-isolate.tsx (dir="ltr" wrapper for digits inside RTL)
  - frontend/src/i18n/{en,ar}/dossier-drawer.json (kpi.* + section.summary + empty.summary keys, supplied by Wave 0)
provides:
  - MiniKpiStrip — 4-cell handoff-anatomy KPI strip with locked D-04 mapping
  - SummarySection — italic-serif paragraph with bilingual fallback chain
affects:
  - frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx (replaces Wave 0 stub)
  - frontend/src/components/dossier/DossierDrawer/SummarySection.tsx (replaces Wave 0 stub)
tech-stack:
  added: []
  patterns:
    - LtrIsolate-wrapped digit rendering for RTL drawer rows
    - Locale-aware fallback chain (AR → AR text → EN → empty.summary key)
    - Inline style honoring CSS variable tokens (var(--font-display), var(--ink-mute))
key-files:
  created:
    - frontend/src/components/dossier/DossierDrawer/__tests__/MiniKpiStrip.test.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/SummarySection.test.tsx
  modified:
    - frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx
    - frontend/src/components/dossier/DossierDrawer/SummarySection.tsx
decisions:
  - D-04 locked KPI mapping shipped verbatim (no fallback filter on engagement_type yet — A1 verification deferred to Wave 2 manual check)
  - Per-test-file react-i18next override (i18nLanguageHolder pattern) used so tests can flip locale, since the global setup mock pins language to 'en'
metrics:
  duration_minutes: 18
  completed_date: 2026-05-02
  tasks_completed: 2
  files_changed: 4
requirements_completed: [DRAWER-02]
---

# Phase 41 Plan 03: KPI Strip + Summary Wave 1 Summary

Replaced Wave 0 stubs of `MiniKpiStrip.tsx` and `SummarySection.tsx` with full handoff-anatomy implementations: 4-cell baseline-aligned KPI strip with bilingual digit isolation and italic-serif summary paragraph with locale-aware fallback chain.

## What was built

### Task 1 — MiniKpiStrip (D-04 locked mapping)

`frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx`

- 4 cells in fixed order: `engagements`, `commitments`, `overdue`, `documents`
- Mapping locked per D-04 / RESEARCH §2:
  - engagements ← `overview.stats.calendar_events_count`
  - commitments ← `overview.work_items.by_source.commitments?.length ?? 0`
  - overdue    ← `overview.stats.overdue_work_items`
  - documents  ← `overview.stats.documents_count`
- Each cell: `<span class="kpi-mini-val"><LtrIsolate>{toArDigits(val, lang)}</LtrIsolate></span><span class="kpi-mini-label">{t('kpi.<key>')}</span>`
- Container `kpi-mini-strip` carries `data-testid="dossier-drawer-kpi-strip"` for higher-level integration tests.
- Defensive: `overview` undefined or `commitments` array missing both yield 0 — no throw.

### Task 2 — SummarySection (italic-serif + bilingual fallback)

`frontend/src/components/dossier/DossierDrawer/SummarySection.tsx`

- Heading: `<h3 class="t-label">{t('section.summary')}</h3>` with UPPERCASE label-token typography (10.5px font-size + 0.1em tracking + ink-mute color via CSS variable fallbacks).
- Paragraph: inline-styled `font-family: var(--font-display); font-style: italic; color: var(--ink-mute); font-size: 14px; line-height: 1.6` — verbatim port of handoff `app.css#L516`.
- Locale fallback chain:
  1. `lang === 'ar'` and `description_ar` non-empty → `description_ar`
  2. `description_en` non-empty → `description_en`
  3. `description_ar` non-empty (EN missing) → `description_ar`
  4. Both empty/null → `t('empty.summary')` (bilingual key supplied by Wave 0)
- No `textAlign` — paragraph inherits `dir` from the parent drawer.

## Integration smoke (recorded values)

For a synthetic `DossierOverviewResponse` fixture with stats `calendar_events_count=22, overdue_work_items=2, documents_count=7` and `work_items.by_source.commitments=[…3 items…]`:

| Cell        | Locale `en` | Locale `ar` |
| ----------- | ----------- | ----------- |
| engagements | `22`        | `٢٢`        |
| commitments | `3`         | `٣`         |
| overdue     | `2`         | `٢`         |
| documents   | `7`         | `٧`         |

Each value is wrapped in `<div dir="ltr">` (LtrIsolate) so digits stay LTR inside RTL drawer rows.

## A1 assumption status (calendar_events_count → engagements)

D-04 ships the locked mapping. Per CONTEXT.md, if `calendar_events_count` proves to also count non-engagement event types (deadlines, milestones), planner authorized a fallback filter on `work_items` by `engagement_type`. **No drift detected during synthetic-fixture verification.** Real-data drift verification is a manual checkpoint listed in UI-SPEC's "Calendar prefill mechanism (A1)" row and runs in Wave 2.

## Verification

- `cd frontend && pnpm exec vitest run MiniKpiStrip SummarySection` → **18/18 passed** (11 + 7)
- `grep -rE '\b(ml-[0-9]|mr-[0-9]|pl-[0-9]|pr-[0-9]|left-[0-9]|right-[0-9]|text-left|text-right)\b'` against the two component files → **0 matches**
- `grep -rE '#[0-9a-fA-F]{3,6}'` against the two component files → **0 matches** (no raw hex)
- `grep -rE 'dangerouslySetInnerHTML'` against the two component files → **0 matches** (XSS mitigation T-41-03-01)
- `tsc --noEmit` against the two component files → **0 errors**

## Commits

| Step | Hash       | Message                                                                            |
| ---- | ---------- | ---------------------------------------------------------------------------------- |
| RED  | `962c9a4e` | test(41-03): add failing tests for MiniKpiStrip locked D-04 KPI mapping            |
| GREEN| `820d2c2a` | feat(41-03): implement MiniKpiStrip with locked D-04 KPI mapping                   |
| RED  | `eaff4443` | test(41-03): add failing tests for SummarySection bilingual fallback + italic-serif|
| GREEN| `e918f180` | feat(41-03): implement SummarySection italic-serif paragraph + bilingual fallback  |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Verify command adapted from `pnpm test:unit -- … --reporter=basic`**

- **Found during:** Task 1 verification
- **Issue:** Plan referenced `pnpm test:unit` which is not defined in `frontend/package.json`. Vitest 4 also dropped the `basic` reporter, so the literal command in the plan would error out before executing any test.
- **Fix:** Adapted to `pnpm exec vitest run <pattern>` with the default reporter. Same scope, same gate, just the supported entry point in this monorepo.
- **Files modified:** none (command-line only)
- **Commit:** n/a (verification command, not code)

**2. [Rule 3 — Blocking] Worktree node_modules symlink**

- **Found during:** Task 1 verification (RED run)
- **Issue:** Worktree was missing both root-level and `frontend/` `node_modules`, so `pnpm test` failed with "vitest: command not found" and "MODULE_NOT_FOUND" for the workspace `.pnpm` virtual store.
- **Fix:** Symlinked `node_modules` and `frontend/node_modules` to the main repo's installed copies (`ln -s /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/{,frontend/}node_modules`). No package changes.
- **Files modified:** none committed (symlink lives outside Git's tracked tree).
- **Commit:** n/a

### Auto-added Critical Functionality

None — the plan's action template was complete; no security/correctness gaps detected during execution.

## Authentication gates

None — pure UI replacement, no backend or auth surface touched.

## Threat model compliance

| Threat ID  | Disposition | Mitigation status                                                                                                                                              |
| ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-41-03-01 | mitigate    | `description_*` rendered as JSX `{body}` text node — auto-escaped. **Verified:** grep for `dangerouslySetInnerHTML` returns 0 matches.                         |
| T-41-03-02 | mitigate    | `toArDigits` only converts ASCII digits to Arabic-Indic; output stays a plain string. No HTML risk.                                                            |
| T-41-03-03 | mitigate    | All field accesses match RESEARCH §2 verified types. TypeScript compile is clean; runtime `?? 0` handles missing optional fields.                              |
| T-41-03-04 | accept      | Backend RLS continues to enforce description visibility; if user lacks permission, the API returns null and the drawer falls back to `t('empty.summary')`.     |

No new threat surface introduced.

## TDD Gate Compliance

| Gate     | Hash       | Status |
| -------- | ---------- | ------ |
| RED 1    | `962c9a4e` | OK     |
| GREEN 1  | `820d2c2a` | OK     |
| RED 2    | `eaff4443` | OK     |
| GREEN 2  | `e918f180` | OK     |
| REFACTOR | —          | Skipped (implementations were minimal and clean on first pass; no refactor opportunity identified) |

## Known Stubs

None. Both files now hold full Wave 1 implementations; downstream Wave 1 plans (41-04, 41-05, 41-06, 41-07) replace the remaining stubs (`UpcomingSection`, `RecentActivitySection`, `OpenCommitmentsSection`, `DrawerHead`, `DrawerMetaStrip`, `DrawerCtaRow`).

## Self-Check: PASSED

- File `frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx` — FOUND (commit `820d2c2a`)
- File `frontend/src/components/dossier/DossierDrawer/SummarySection.tsx` — FOUND (commit `e918f180`)
- File `frontend/src/components/dossier/DossierDrawer/__tests__/MiniKpiStrip.test.tsx` — FOUND (commit `962c9a4e`)
- File `frontend/src/components/dossier/DossierDrawer/__tests__/SummarySection.test.tsx` — FOUND (commit `eaff4443`)
- Commits `962c9a4e`, `820d2c2a`, `eaff4443`, `e918f180` — all FOUND on the worktree branch.
