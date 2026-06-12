---
phase: 64-new-position-from-dossier
plan: 06
subsystem: testing
tags: [live-verification, staging, rtl, positions, uat]

requires:
  - phase: 64-new-position-from-dossier
    provides: plans 64-01 (RLS restore), 64-04 (submit flow), 64-05 (tab rewire)
provides:
  - Live phase-gate verification matrix for POSNEW-01/POSNEW-02 on staging
  - AR/RTL + translate-failure + width evidence
  - Gate outputs (suite, types, bundle) and staging cleanup confirmation
affects: [65, verify-work, engagement-positions]

tech-stack:
  added: []
  patterns: [live staging UAT via agent-browser + Supabase MCP with full cleanup]

key-files:
  created: []
  modified: []

key-decisions:
  - 'Coordinate clicks on the scrolled-out dialog footer close the Radix dialog (outside-pointer-down) — automation must scrollIntoView the submit button first; real users scroll natively'
  - 'Translate failure path verified live (AnythingLLM down on staging) — the D-07 posture holds'

patterns-established:
  - 'Live UAT protocol: browser create → edge-log/DB verify → dependency-ordered cleanup → SELECT-count-0 confirmation'

requirements-completed: [POSNEW-01, POSNEW-02]

duration: 45min
completed: 2026-06-12
---

# Phase 64 Plan 06: Live phase-gate verification Summary

**Both entry points create+link positions live on staging (DB-verified applies_to rows), the tab refreshes without reload, the bilingual/RTL contract holds, translate failure is non-blocking, and all gates are green with zero staging residue.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-06-12
- **Tasks:** 3/3

## Task 1 — Entry-point matrix (POSNEW-02)

| Entry                               | Position id                          | Toast                                     | Tab refresh w/o reload                           | Link row                                        | Audience round-trip                                    |
| ----------------------------------- | ------------------------------------ | ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------ |
| 2 — Positions tab "Create position" | 3240260a-0620-4d2b-849a-2e8854b3c6c2 | "Position created" + Open position action | ✓ (count 0→1, card rendered in same SPA session) | dossier 9b9a04af…74ab, link_type **applies_to** | All Staff (default)                                    |
| 1 — Add to Dossier → New Position   | 68c0a5a7-80f9-484c-bdf8-e9d34ed6384b | "Position created"                        | ✓ (card rendered in list)                        | dossier 9b9a04af…74ab, link_type **applies_to** | **Management only** (non-default, unchecked All Staff) |

DB evidence (service-role SQL, verbatim fields): both rows `status='draft'`, `author_id=de2734cf-…` (test user), `type_name='Standard Position'`, non-empty `title_ar` (`تحقق المرحلة ٦٤ أ` / `…ب`). D-05/D-06 defaults observed in-dialog (Standard Position preselected, All Staff prechecked, submit disabled until both titles valid).

Screenshots: `/tmp/uat64-1-tab-before.png` (0 positions), `/tmp/uat64-6-after-submit-real.png` (toast + card, count 1), `/tmp/uat64-7-after-submit-B.png` (B card).

## Task 2 — Bilingual/RTL + translate failure + widths

- **EN locale per-field direction:** `title_ar`/`content_ar` render `dir=rtl` with Tajawal; `title_en`/`content_en` `dir=ltr` with Inter (computed-style evidence).
- **Translate failure (D-07, AnythingLLM down on staging):** clicking "Translate to Arabic" with EN text produced the localized toast **"Translation unavailable. Enter the text manually."** and `title_ar` stayed empty — no placeholder text injected; manual entry still enables submit. Screenshot `/tmp/uat64-8-translate-toast.png`.
- **AR locale:** `document.dir=rtl`, `lang=ar`, Tajawal body font. All dialog labels Arabic (نوع الموقف / العنوان (إنجليزي|عربي) / المحتوى / مجموعات الجمهور), audience names from `name_ar` (جميع الموظفين، الإدارة…), submit = إنشاء موقف. Tab buttons: إنشاء موقف + إرفاق موقف موجود. `title_en` still `dir=ltr`. Arabic validation message on touched-empty title_ar: **العنوان العربي مطلوب**. Screenshot `/tmp/uat64-9-ar-dialog.png`.
- **Widths:** dialog screenshots at 1280 and 1024 in both locales (`uat64-10-ar-1280`, `uat64-11-ar-1024`, `uat64-12-en-1024`, `uat64-13-en-1280`); `scrollWidth <= clientWidth` (no horizontal overflow) at every combination; footer buttons reachable.

### UX observation (recorded, non-blocking)

The dialog footer (Cancel / Create position) lives INSIDE the `overflow-y-auto` form region, so at short window heights the submit button needs an in-form scroll to reach. Live coordinate clicks aimed at its stale position land on the Radix overlay and CLOSE the dialog (outside-pointer-down) — this is how the first automated submit attempt silently no-opped. Real users scroll natively and are unaffected; form state correctly persists across the accidental close. Candidate polish item for a later phase: sticky DialogFooter outside the scroll region.

## Task 3 — Gates + cleanup

- Full frontend suite: **1283 passed / 0 failed** (25 todo, 4 skipped files)
- `pnpm type-check`: exit 0
- `pnpm exec size-limit`: **zero `exceeded` matches** in the full log (closest budget: signature-visuals/d3-geospatial 54.28/55 kB)
- Cleanup (dependency order: links → audience_groups → versions → positions): SELECT counts for both ids across all four tables = **0 / 0 / 0 / 0**

## Accepted coverage notes (honest posture per VALIDATION.md)

- Translate HAPPY path and D-11 partial-failure path: unit-tested (mocked) only — partial failure cannot be safely forced on live staging.
- Positions tab exists only on country/topic dossiers (Pitfall 6); other types create+link correctly via the menu but render no tab — phase scope.
- No secrets recorded; login via .env.test env vars only.

## Self-Check: PASSED

- Both live criteria (DB link rows, no-reload tab refresh) observed and recorded: VERIFIED
- Gates: suite 0 fail / types 0 / bundle 0 exceeded: VERIFIED
- Staging residue: 0 rows confirmed: VERIFIED
