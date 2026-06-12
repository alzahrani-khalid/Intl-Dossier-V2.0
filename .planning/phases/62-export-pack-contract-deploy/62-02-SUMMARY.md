---
phase: 62-export-pack-contract-deploy
plan: 02
subsystem: dossier-export
tags: [frontend, export, i18n, rtl, tdd, dialog]
requires:
  - dossier-export-pack edge function returning text/html + X-Failed-Sections (Plan 62-01)
provides:
  - Honest-HTML export dialog (HTML-only, EN/AR, new-tab delivery)
  - exportDossier service returning { html, failedSections }
  - useDossierExport hook exposing failedSections with no window/document side effects
  - EXPORT-01 component test locking the contract
affects:
  - frontend/src/components/dossier/ExportDossierDialog.tsx
  - frontend/src/hooks/useDossierExport.ts
  - frontend/src/services/dossier-export.service.ts
  - frontend/src/types/dossier-export.types.ts
  - frontend/src/i18n/{en,ar}/dossier-export.json
tech-stack:
  added: []
  patterns:
    - Popup-blocker-safe new-tab delivery (synchronous window.open before await)
    - X-Failed-Sections response header → per-section warning banner
    - TDD red→green for the dialog contract (5 EXPORT-01 behaviors)
key-files:
  created:
    - frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx
  modified:
    - frontend/src/types/dossier-export.types.ts
    - frontend/src/services/dossier-export.service.ts
    - frontend/src/hooks/useDossierExport.ts
    - frontend/src/components/dossier/ExportDossierDialog.tsx
    - frontend/src/i18n/en/dossier-export.json
    - frontend/src/i18n/ar/dossier-export.json
decisions:
  - HTML-only contract — removed pdf/docx format picker; format is no longer configurable (D-01/D-03)
  - Single-language pack — removed the 'both' (bilingual) option; default = current UI language (D-04)
  - New-tab delivery owned by the dialog; the hook performs no window/document side effects (D-07)
  - Failed sections suppress the dialog's 1500ms auto-close so the warning is readable (D-08)
metrics:
  duration: ~25m
  completed: 2026-06-11
  tasks: 3
  files: 7
  commits: 3
requirements: [EXPORT-01]
---

# Phase 62 Plan 02: Export Pack Frontend Contract Summary

Reworked the dossier export frontend to advertise only what the system actually produces — a print-ready HTML briefing pack delivered in a new tab — and locked the EXPORT-01 contract with a 5-behavior component test.

## What Was Built

**Task 1 — types/service/hook (commit 264b85aa).** Trimmed `dossier-export.types.ts` to the real contract: deleted the `DossierExportFormat` ('pdf' | 'docx') type and the `format` config field, narrowed `ExportLanguage` to `'en' | 'ar'`, dropped the `'uploading'` status, and replaced the storage-era `DossierExportResponse` (download_url/file_name/content_base64/…) with `{ success, failed_sections?, error? }`. `DEFAULT_EXPORT_CONFIG.language` is now `'en'` (the dialog overrides it). The service `exportDossier` now reads `response.text()` for the pack HTML and parses the `X-Failed-Sections` header into `failedSections`, returning the new `ExportDossierResult` interface; `downloadExportedFile` and `dossierExportKeys.history` were removed. The hook adds `failedSections` state, drops the `content_base64`/`download_url` decode block and the `'uploading'` stage (stages are now preparing → fetching → generating → ready), resolves `{ html, failedSections }`, simplifies `quickExport` (no format arg), and performs no window/document side effects.

**Task 2 — i18n (commit 8b655cbe).** Applied the UI-SPEC copy diff to both EN and AR with full key parity: added `format.html`, `format.html_info`, `warning.failedSections`, `newTab.generating`, `popupBlocked`; changed `success` to the new-tab copy, dropped the exclamation from `progress.ready`, and changed the `cancel` value to `Close` / `إغلاق`; removed `format.pdf`, `format.docx`, `language.both`, `progress.uploading`.

**Task 3 — dialog + test (commit 33ecc7c2, TDD).** Wrote the EXPORT-01 component test first (run red, then green): no PDF/Word option, exactly two language options (EN/AR, no Bilingual), the HTML info line, default language follows `i18n.language`, and a `role="alert"` failed-sections warning in the ready state. Reworked `ExportDossierDialog.tsx`: replaced the format `RadioGroup` with a neutral `Info`-icon info line (`format.html_info`), trimmed the language group to `['en','ar']` initialized from the current UI language, and implemented the popup-blocker-safe delivery in `handleExport` — synchronous `window.open('', '_blank')` → placeholder document write → `await exportDossier` → write the pack into the tab, or fall back to a `text/html` blob download named `briefing-pack-{slug}-{YYYYMMDD}.html` with `URL.revokeObjectURL` and the `popupBlocked` notice. The success banner is `role="status" aria-live="polite"`; the failed-sections warning (`role="alert"`, `var(--warn)` tokens) renders below it with localized section names and suppresses the 1500ms auto-close; the error banner reuses the `error` i18n key. On error the placeholder tab is closed. Advanced options and the props interface are unchanged, so the `DossierShell`/`DossierDetailLayout` call sites compile untouched.

## Deviations from Plan

None — plan executed as written.

Notes on environment handling (not plan deviations):

- The worktree had no `node_modules`; ran `pnpm install --frozen-lockfile --prefer-offline` (13s from the offline store) to enable the build/test toolchain.
- The plan's verify commands hard-code the main-repo absolute path; all verification was run from the worktree root instead so it checked the actual edited files.
- Each pre-commit build regenerated `frontend/src/routeTree.gen.ts` with pure prettier/codegen formatting churn (no route changes); reverted after every commit to keep the diff limited to the 7 in-scope files.

## Verification

- Task 1: types/service contain zero `'pdf'`/`'docx'`/`'both'`/`'uploading'`/`content_base64`/`download_url`/`downloadExportedFile`/`history:`; service has `response.text()` + `X-Failed-Sections`; hook exposes `failedSections`. `pnpm --filter intake-frontend build` exits 0.
- Task 2: flattened EN/AR key sets identical (parity script prints `I18N-PASS`); new keys present, dead keys absent; `cancel` = Close / إغلاق; `progress.ready` has no `!`.
- Task 3: `vitest run ExportDossierDialog.test.tsx` → 5/5 pass; dialog has 0 dead tokens, `window.open('', '_blank')` precedes the awaited export, `role="alert"` + `var(--warn)` present, 0 physical-direction utilities; build exits 0.
- Scope: `git diff --name-only <base> HEAD` lists exactly the 7 `files_modified`; no `*overview*`/`DossierOverview` files touched.

## TDD Gate Compliance

Task 3 (`tdd="true"`) followed RED → GREEN: the test file was written and run against the unreworked dialog (5 failures) before the dialog rework was implemented and the same 5 tests passed. Test and implementation are committed together in `33ecc7c2` (feat) as the GREEN gate; no separate refactor was needed.

## Known Stubs

None. The new-tab "placeholder" document is a real, working transient state per UI-SPEC Surface 3, not an unwired stub.

## Self-Check: PASSED
