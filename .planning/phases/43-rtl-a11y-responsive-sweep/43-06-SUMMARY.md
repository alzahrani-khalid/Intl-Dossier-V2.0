---
phase: 43-rtl-a11y-responsive-sweep
plan: 06
subsystem: docs
tags: [qa, docs, rtl-icons, qa-04]
requirements: [QA-04]
dependency_graph:
  requires:
    - 43-00 (Wave 0 infra — V6_ROUTES registry & qa-sweep helpers)
    - Plan 43-05 (defines docs/rtl-icons/{icon}-{ltr|rtl}.png convention; PNGs themselves committed by Plan 43-07)
  provides:
    - Single source of truth for v6.0 directional-icon flip mechanisms
    - QA-04 documentation gate
    - Maintenance contract for adding new directional icons
  affects:
    - Plan 43-07 (Wave 2 rotate-180 → .icon-flip migrations are referenced by this audit)
    - Future v6.x phases that introduce new directional icons (must update §2 audit table)
tech_stack:
  added: []
  patterns:
    - Markdown audit-table pattern for cross-cutting QA documentation
    - PNG screenshot pairs (regenerable via opt-in Playwright spec) as visual evidence
key_files:
  created:
    - docs/rtl-icons.md
  modified: []
decisions:
  - Quoted source citations verbatim (CSS rule, Sparkline transform, Phase 40 G3 chevron) to anchor doc to code
  - Used relative image paths (`rtl-icons/{name}-{ltr|rtl}.png`) per Plan 43-05 convention so PNGs land alongside the doc under `docs/`
  - Documented `rotate-180` deprecation in §1 (NOT sanctioned) plus per-row "migrated from rotate-180 in Phase 43 W2" annotations in §2 to make the migration trail self-evident
metrics:
  duration: '~12 minutes'
  completed: 2026-05-03T20:50:00Z
  tasks_completed: 1
  files_changed: 1
---

# Phase 43 Plan 06: Directional-icon documentation Summary

One-liner: Authored `docs/rtl-icons.md` — a 118-line QA-04 reference that enumerates every directional glyph in the v6.0 surface, the three sanctioned flip mechanisms (`.icon-flip` class, inline `scaleX(-1)`, locale-driven SVG transform), an 11-row audit table with file:line citations, an out-of-scope appendix for pre-v6.0 surfaces, and a maintenance contract for future icon additions.

## What was built

`docs/rtl-icons.md` (118 lines) with four top-level sections:

1. **Flip mechanisms** — three sanctioned patterns A/B/C with verbatim source citations:
   - **A.** `.icon-flip` CSS class (`frontend/src/styles/list-pages.css:861-863`)
   - **B.** Inline `style={{ transform: 'scaleX(-1)' }}` (Phase 40 G3 belt-and-braces, `frontend/src/components/list-page/GenericListPage.tsx:121-124`)
   - **C.** Locale-driven SVG transform (`frontend/src/components/signature-visuals/Sparkline.tsx:92`)
   - Plus a deprecation note declaring `rotate-180` NOT sanctioned for RTL flipping
2. **Audit table** — 11 rows covering every directional glyph in the v6.0 surface (RESEARCH §6 inventory):
   - 5 entries from §6.A `.icon-flip` consumers (DossierTable, GenericListPage, DossierShell ×2 chevrons, DrawerCtaRow, AfterActionsTable)
   - 1 entry from §6.B (Sparkline polyline)
   - 5 entries from §6.C post-fix (VipVisits, OverdueCommitments, EngagementStageGroup, PersonsListPage, UnifiedCalendar) — each annotated "migrated from `rotate-180` in Phase 43 W2"
   - All rows reference `rtl-icons/{name}-{ltr|rtl}.png` per Plan 43-05 path convention
3. **Out of scope** — 8 pre-v6.0 directories that retain `rotate-180`, tracked as v6.1 follow-ups
4. **Adding a new directional icon** — 5-step maintenance contract (mitigates T-43-15 audit-table drift)

## Tasks executed

| #   | Name                     | Status | Commit   | Files               |
| --- | ------------------------ | ------ | -------- | ------------------- |
| 1   | Author docs/rtl-icons.md | done   | 49de0471 | `docs/rtl-icons.md` |

## Verification

All 14 automated checks from `<verify><automated>` block pass post-commit:

- File exists at `docs/rtl-icons.md`
- Three required section headers present (`## 1. Flip mechanisms`, `## 2. Audit table`, `## 3. Out of scope`)
- Canonical CSS rule quoted verbatim (`html[dir='rtl'] .icon-flip { transform: scaleX(-1); }`)
- All 6 component-file citations present (VipVisits, OverdueCommitments, EngagementStageGroup, PersonsListPage, UnifiedCalendar, Sparkline)
- `rotate-180` deprecation note present and machine-grep-able
- 118 lines (≥80 minimum)

## Deviations from Plan

**1. [Rule 3 - Blocking pattern] Reformulated the deprecation heading so the verify regex matches**

- **Found during:** Task 1 verification
- **Issue:** Plan asked for header `### Deprecation: \`rotate-180\` is **NOT sanctioned**`. The verify regex `rotate-180._ NOT sanctioned`failed because in the original markdown there is no literal space between the closing`\``of the inline-code rotate-180 and the`\*\*`emphasis opener;`._ NOT`requires a space immediately before`NOT`, which the bold-emphasis syntax `**NOT sanctioned**` does not provide.
- **Fix:** Changed the heading to `### Deprecation: \`rotate-180\` is NOT sanctioned`(NOT now plain text, with required leading space) and added a follow-up sentence`(\`rotate-180\` is **not sanctioned** for RTL flipping.)` to keep the visual emphasis the plan called for. Semantics unchanged; verify now passes.
- **Files modified:** `docs/rtl-icons.md`
- **Commit:** 49de0471

## Auth gates

None — this is a docs-only plan.

## Threat Flags

None — no new security-relevant surface introduced. The doc reveals only file paths already present in the open-source repo (T-43-14 accepted; standard convention).

## Self-Check: PASSED

- `docs/rtl-icons.md` — FOUND (118 lines)
- Commit `49de0471` — FOUND in git log
- All 14 plan-defined automated verification checks — PASS
