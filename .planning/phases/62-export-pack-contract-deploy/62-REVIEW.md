---
phase: 62-export-pack-contract-deploy
reviewed: 2026-06-11T13:10:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - frontend/src/components/dossier/ExportDossierDialog.tsx
  - frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx
  - frontend/src/hooks/useDossierExport.ts
  - frontend/src/i18n/ar/dossier-export.json
  - frontend/src/i18n/en/dossier-export.json
  - frontend/src/services/dossier-export.service.ts
  - frontend/src/types/dossier-export.types.ts
  - supabase/functions/dossier-export-pack/index.ts
findings:
  critical: 1
  warning: 6
  info: 6
  total: 13
status: issues_found
---

# Phase 62: Code Review Report

**Reviewed:** 2026-06-11
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

The phase reworks dossier export to the "honest HTML" contract: the edge function returns `text/html` with an `X-Failed-Sections` header, and the dialog opens it in a new tab with a popup-blocker blob-download fallback. The contract plumbing (service header parsing, hook state, dialog delivery, i18n parity) is mostly clean and well-commented. EN/AR i18n key parity is intact.

However, the adversarial pass surfaced one security-class defect (an unescaped HTML interpolation that contradicts the file's own stated "XSS hardening invariant" and executes in the app's origin) and a correctness bug where the default-enabled `executive_summary` section is advertised in the table of contents but silently produces no body content because the edge function has no case for it. Several quality issues remain: stale `format`/`'both'` contract fields, fake progress stages that never render, and missing validation of the request `config`.

## Critical Issues

### CR-01: Unescaped values interpolated into the briefing-pack HTML (XSS sink in app origin)

**File:** `supabase/functions/dossier-export-pack/index.ts:98` (and `:1005`)

**Issue:** `getStatusBadge` interpolates the raw `status` value into HTML without escaping:

```ts
return `<span style="background-color: ${color}; ...">${status}</span>`
```

`${status}` is never passed through `escapeHtml`, unlike every sibling field (`escapeHtml(c.priority)`, `escapeHtml(e.location)`, etc.). It is called with DB-derived values: `dossier.status`, `pos.status`, `m.lifecycle_state`, `c.status`. The footer at line 1005 has the same gap with client-controlled input:

```ts
${config.footerText || 'GASTAT - International Dossier System'} | ...
```

`config.footerText` arrives from the request body and is interpolated unescaped.

Why this is a security finding and not cosmetic: the dialog delivers this HTML via `window.open('', '_blank')` followed by `newTab.document.write(html)` (`ExportDossierDialog.tsx:114,139`). An `about:blank` window opened that way **inherits the opener's origin**, so any `<script>` in the document executes in the app's origin with access to `localStorage` (the Supabase session/access token). The function's own comment (`:60-61`) claims a preserved "XSS hardening invariant" that these two sinks violate.

Exploitability caveat (stated honestly): the `status`/`lifecycle_state` columns are likely DB-enum/CHECK-constrained, which limits injection through them today, and `footerText` is currently never set by the frontend (self-supplied). But both are genuine escaping gaps at the trust boundary, the fix is one line each, and the delivery context turns any future free-text status column or wired footer into token theft. Treat as a blocker for hardening consistency.

**Fix:**

```ts
return `<span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${escapeHtml(status)}</span>`;
// and at the footer:
${escapeHtml(config.footerText) || 'GASTAT - International Dossier System'} | ...
```

## Warnings

### WR-01: `executive_summary` is in the TOC and enabled by default, but the body never renders it

**File:** `supabase/functions/dossier-export-pack/index.ts:597-633`; `frontend/src/types/dossier-export.types.ts:64-70`

**Issue:** `DEFAULT_EXPORT_SECTIONS[0]` is `executive_summary` with `enabled: true`. `generateTableOfContents` lists every enabled section (so the TOC shows "1. Executive Summary"), but the `switch (section.type)` in `generateHTMLDocument` has no `case 'executive_summary'` — it falls through and appends nothing. Every default export therefore advertises an Executive Summary in the TOC that does not exist in the document body, with no `X-Failed-Sections` entry (silent omission, not an honest failure note).

**Fix:** Either add a `case 'executive_summary':` that renders the section (even a summary built from `dossier` + `stats`), or remove `executive_summary` from `DEFAULT_EXPORT_SECTIONS` / mark it `enabled: false`, or filter unsupported section types out of `generateTableOfContents` so TOC and body stay in lockstep.

### WR-02: Request `config` is never validated; malformed config crashes to a generic 500

**File:** `supabase/functions/dossier-export-pack/index.ts:1331-1332,578`

**Issue:** Only `dossier_id` is validated (UUID check). `config` is taken from the body and used directly. If a caller (any authenticated user) posts `{ dossier_id: <valid>, config: null }` or omits `config`, `generateHTMLDocument` runs `config.sections.filter(...)` (`:578`) and throws `TypeError`, caught by the outer handler and returned as a generic `INTERNAL_ERROR` 500. This violates the project rule to validate at system boundaries and fail fast with a clear message.

**Fix:** Validate `config` shape before use (e.g., assert `Array.isArray(config?.sections)` and a valid `language`), returning a `400 INVALID_REQUEST` with a bilingual message, or default a missing `config` to `DEFAULT_EXPORT_CONFIG` server-side.

### WR-03: Stale `format`/`'both'` contract fields contradict the new HTML contract

**File:** `supabase/functions/dossier-export-pack/index.ts:28-38,638`

**Issue:** The edge `ExportConfig` still declares `format: 'pdf' | 'docx'` and `language: 'en' | 'ar' | 'both'`, and the document `lang` attribute still branches on `config.language === 'both'` (`:638`). The reworked frontend (`dossier-export.types.ts`) has no `format` field and `ExportLanguage` is only `'en' | 'ar'`, so `format` is dead and the `'both'` branch is unreachable. This is contract drift that will mislead the next maintainer about what the function accepts.

**Fix:** Drop `format` from `ExportConfig`, narrow `language` to `'en' | 'ar'`, and remove the `'both'` branch at `:638`.

### WR-04: Briefing-pack dates use `ar-SA`, which renders Hijri-calendar / non-Latin digits

**File:** `supabase/functions/dossier-export-pack/index.ts:74-86`

**Issue:** `formatDate` calls `date.toLocaleDateString('ar-SA', ...)` for Arabic exports. In modern ICU (the Deno runtime), `ar-SA` defaults to the Islamic-Umalqura calendar and Arabic-Indic digits, so a diplomatic briefing pack's dates render as Hijri (e.g., a different year) rather than the Gregorian `Tue 28 Apr` style the project standardizes on. This is a correctness/expectation mismatch for analyst-facing output, and is consistent with the repo's documented `Intl`-locale digit traps.

**Fix:** Force the Gregorian calendar and the project's date style explicitly, e.g. `new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { day: '2-digit', month: 'short', year: 'numeric' })`, or reuse the app's `lib/format-locale` helper contract so EN/AR stay aligned.

### WR-05: Progress stages 10% and 30% are set synchronously before the await and never render

**File:** `frontend/src/hooks/useDossierExport.ts:71-93`

**Issue:** `updateProgress('preparing', 10)`, `updateProgress('fetching', 30)`, and `updateProgress('generating', 60)` all execute synchronously back-to-back before `await exportDossierApi(...)`. React batches these state updates, so the UI only ever shows 60% "generating", then jumps to 100%. The first two stages are fake progress theater — they cannot display. This is misleading UI and dead intent.

**Fix:** Either drive real progress from actual milestones (e.g., set "fetching" only when the request is dispatched and "generating" on first byte), or collapse to a single honest indeterminate/"generating" state and delete the unreachable stages.

### WR-06: Auto-close `setTimeout` is not cleared and calls `setState` after potential unmount

**File:** `frontend/src/components/dossier/ExportDossierDialog.tsx:155-160`

**Issue:** On clean success the dialog schedules `setTimeout(() => { onClose(); reset() }, 1500)`. The timer handle is never stored or cleared. If the user closes the dialog (or it unmounts) within 1.5s, `reset()` fires `setState` on an unmounted hook owner and the timer leaks. It also runs even if the user manually reopens/re-exports.

**Fix:** Store the timeout id and clear it in a `useEffect` cleanup (and on `handleClose`), or gate the callback on a mounted ref.

## Info

### IN-01: Popup-blocker detection only checks truthiness

**File:** `frontend/src/components/dossier/ExportDossierDialog.tsx:114,137`

**Issue:** `const newTab = window.open('', '_blank')` then `if (newTab)`. Some blockers return a window that is immediately closed rather than `null`, so the blob fallback may not trigger. Consider `if (!newTab || newTab.closed || typeof newTab.closed === 'undefined')` for the fallback path.

### IN-02: Edge `config` `headerText` is declared but never used; `documents` always computed

**File:** `supabase/functions/dossier-export-pack/index.ts:37,1203-1220`

**Issue:** `headerText` is in the interface but never rendered, and the derived `documents` array is built on every request even when the documents section is disabled by default. Minor dead-config / unnecessary work; tidy when touching the file.

### IN-03: Timeline `title_ar` is populated with the English action string

**File:** `supabase/functions/dossier-export-pack/index.ts:1188-1194`

**Issue:** `title_ar: a.action` stores the English `audit_logs.action` value, so the Arabic export's timeline entries are not actually Arabic. Acceptable as a degraded fallback, but worth a localized action map for AR packs.

### IN-04: i18n `progress.*` and `options.pageNumbers` keys are dead (dual source of truth)

**File:** `frontend/src/i18n/en/dossier-export.json:38-43`; `frontend/src/i18n/ar/dossier-export.json:38-43`

**Issue:** The dialog renders progress via `progress.message_en/_ar` hardcoded in `useDossierExport.ts`, so the i18n `progress.*` keys (and `options.pageNumbers`, since the page-numbers checkbox isn't rendered) are never read. Two sources of truth for the same copy; consider sourcing progress messages from i18n or removing the unused keys.

### IN-05: Raw hex colors in the placeholder-tab HTML

**File:** `frontend/src/components/dossier/ExportDossierDialog.tsx:122-123`

**Issue:** The "generating…" placeholder writes `background:#f7f6f4;color:#6b6459`. CLAUDE.md bans raw hex in UI. This is a standalone document outside the token system (like the edge-generated pack), so it's a defensible exception, but flag it: it would be cleaner to at least byte-match the Bureau bg/ink literals used elsewhere.

### IN-06: `handleExport` is a floating async handler; export critical path is untested

**File:** `frontend/src/components/dossier/ExportDossierDialog.tsx:384`; `frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx`

**Issue:** `onClick={handleExport}` invokes an `async` function whose returned promise is unhandled (errors are caught internally, so no unhandled rejection, but `@typescript-eslint/no-floating-promises` may flag it). Separately, the test suite mocks `useDossierExport` and never exercises `handleExport`, `window.open`, the popup-blocker blob fallback, the failed-section auto-close, or error rendering — the most defect-prone logic in the file is uncovered. Add a test that drives the export click and asserts new-tab write vs. blob fallback.

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
