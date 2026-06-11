---
phase: 62-export-pack-contract-deploy
fixed_at: 2026-06-11T17:10:44Z
review_path: .planning/phases/62-export-pack-contract-deploy/62-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 62: Code Review Fix Report

**Fixed at:** 2026-06-11T17:10:44Z
**Source review:** .planning/phases/62-export-pack-contract-deploy/62-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 7 (fix_scope: critical_warning — IN-01..IN-06 excluded by scope)
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Unescaped values interpolated into the briefing-pack HTML (XSS sink in app origin)

**Files modified:** `supabase/functions/dossier-export-pack/index.ts`
**Commit:** 5788d4e9
**Applied fix:** Wrapped the `getStatusBadge` interpolation in `escapeHtml(status)` and the
footer interpolation in `escapeHtml(config.footerText)`. `escapeHtml` returns `''` for
null/undefined, so the `|| 'GASTAT - International Dossier System'` fallback still applies.
Verified with `deno check` (clean).

### WR-01: `executive_summary` is in the TOC and enabled by default, but the body never renders it

**Files modified:** `supabase/functions/dossier-export-pack/index.ts`
**Commit:** 3f8be7b5
**Applied fix:** Added `generateExecutiveSummarySection(dossier, stats, isRTL)` (built entirely
from the already-fetched dossier description + stats counts, all values escaped) and a
`case 'executive_summary':` in the `generateHTMLDocument` switch. TOC and body are now in
lockstep and the dialog's "Executive Summary" checkbox controls real output. Note for UAT:
the new Arabic summary sentence (numeral-list form with "من + definite plural") should get a
native-speaker glance.

### WR-02: Request `config` is never validated; malformed config crashes to a generic 500

**Files modified:** `supabase/functions/dossier-export-pack/index.ts`
**Commit:** 59659f4e
**Applied fix:** Added boundary validation after the `dossier_id` UUID check: rejects
missing/null `config`, non-array `config.sections`, and any `language` other than
`'en'`/`'ar'` with a bilingual `400 INVALID_REQUEST` response instead of a generic
`INTERNAL_ERROR` 500.

### WR-03: Stale `format`/`'both'` contract fields contradict the new HTML contract

**Files modified:** `supabase/functions/dossier-export-pack/index.ts`
**Commit:** 4882179c
**Applied fix:** Removed `format: 'pdf' | 'docx'` from the edge `ExportConfig`, narrowed
`language` to `'en' | 'ar'`, and simplified the `<html lang>` attribute to
`lang="${config.language}"` (the `'both'` branch was unreachable). Grep confirms no residual
`format`/`'both'` references in the file.

### WR-04: Briefing-pack dates use `ar-SA`, which renders Hijri-calendar / non-Latin digits

**Files modified:** `supabase/functions/dossier-export-pack/index.ts`
**Commit:** 0c95149a
**Applied fix:** Changed the Arabic locale in `formatDate` to `'ar-SA-u-ca-gregory-nu-latn'`
(repo standard: Gregorian calendar + Latin digits) with an explanatory comment. Verified
behaviorally in the Deno runtime: new locale renders `28 أبريل 2026` vs the old
Arabic-Indic-digit output `٢٨ أبريل ٢٠٢٦`.

### WR-05: Progress stages 10% and 30% are set synchronously before the await and never render

**Files modified:** `frontend/src/hooks/useDossierExport.ts`
**Commit:** 24765e2c
**Applied fix:** Collapsed the three back-to-back synchronous `updateProgress` calls
(preparing 10% / fetching 30% / generating 60%) into a single honest `generating` stage at
60% — preserving the exact visible behavior (the UI only ever rendered 60% then 100%) while
deleting the unreachable fake stages. `tsc --noEmit` clean (0 errors).

### WR-06: Auto-close `setTimeout` is not cleared and calls `setState` after potential unmount

**Files modified:** `frontend/src/components/dossier/ExportDossierDialog.tsx`
**Commit:** c7b8e817
**Applied fix:** Added `autoCloseTimerRef` + a `clearAutoCloseTimer` callback; the success
auto-close timer id is now stored and cleared in a `useEffect` unmount cleanup, in
`handleClose`, and at the start of `handleExport` (re-export guard). The timer callback also
nulls the ref before firing. `tsc --noEmit` and ESLint (`--max-warnings 0`) both clean.

## Notes

- The edge function file fails `prettier --check` **pre-existing at main** (the whole file
  uses semicolons against the repo's no-semicolon config). Fix edits intentionally matched
  the file's existing semicolon style; a whole-file reformat was out of scope.
- Info findings IN-01 through IN-06 were not addressed (excluded by `fix_scope: critical_warning`).
- The edge function was NOT deployed — code changes only, per instructions.

---

_Fixed: 2026-06-11T17:10:44Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
