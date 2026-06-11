---
phase: 62-export-pack-contract-deploy
verified: 2026-06-11T13:29:50Z
status: verified
human_verified: 2026-06-11T20:35:00Z
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: 'Popup-blocker fallback in Chrome with strict popup settings'
    expected: 'Block popups for staging origin, click Export — the .html file downloads and a popupBlocked notice appears in the dialog; then allow popups and confirm new-tab opens with placeholder → pack.'
    why_human: 'popup-blocker heuristics are browser/UI-state dependent; jsdom cannot reproduce them'
    result: 'PASS — 62-HUMAN-UAT.md test 1. Blocked path downloaded briefing-pack-saudi-arabia-20260611.html with popupBlocked notice; allowed path (trusted gesture) opened a new tab rendering the pack.'
  - test: 'Print pagination (Cmd+P, A4 preview) on an exported briefing pack'
    expected: 'Cover page alone on page 1; each section starts a new page; table rows unsplit; amber failure block (if any) unsplit and visible in grayscale'
    why_human: 'Print rendering is a browser print-engine behavior; cannot verify with grep or unit tests'
    result: 'PASS — 62-HUMAN-UAT.md test 2. printToPDF (A4) shows cover/TOC/8 sections each on own page; injected 40-row table split cleanly with repeating thead; amber section-error block intact and legible in grayscale. Minor cosmetic: 2 blank pages from empty Executive Summary section; fixed footer overlaps last dense row.'
---

# Phase 62: Export Pack Contract & Deploy Verification Report

**Phase Goal:** Exporting a dossier produces the advertised file format from a deployed, schema-correct `dossier-export-pack` edge function
**Verified:** 2026-06-11T13:29:50Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #        | Truth                                                                                                                                                                                           | Status                                        | Evidence                                                                                                                                                                                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (SC-1) | The Export dialog advertises only formats the system actually produces — HTML output with the decision recorded                                                                                 | VERIFIED                                      | `grep 'pdf\|docx\|DossierExportFormat' ExportDossierDialog.tsx` = 0; dialog has HTML info line only; 5/5 component tests green including EXPORT-01                                                                                                                                                            |
| 2 (SC-2) | Exporting a dossier of each of the 7 types on staging returns the advertised file — no 404 and no 500                                                                                           | VERIFIED (code-level) / HUMAN for live replay | All stale reads removed; function deployed (62-03-SUMMARY smoke matrix: all 7 types 200 + text/html, zero X-Failed-Sections). Live replay blocked by CLI token constraint — evidence is the committed smoke matrix.                                                                                           |
| 3 (SC-3) | Export content resolves against live schema: positions, MoUs, documents, commitments read current columns                                                                                       | VERIFIED                                      | Zero occurrences of `dossier_ids`, `start_datetime`, `entity_type`, `from('commitments')`, `m.title_en`, `c.deadline`, `e.event_type`, `organization_en`, `d.file_name` (comment-filtered). `from('position_dossier_links')`, `from('aa_commitments')`, `signatory_1/2_dossier_id`, `event_date` all present. |
| 4        | No query references stale columns from the D-05 audit (positions.classification, dossier_ids, mous.title_en/status, documents.entity_type, legacy commitments, calendar_entries.start_datetime) | VERIFIED                                      | All 7 stale patterns grep to 0 (comment-filtered). `grep -cE "dossier_ids\|start_datetime\|entity_type\|from\('commitments'\)\|SUPABASE_SERVICE_ROLE_KEY\|createSignedUrl"` = 0                                                                                                                               |
| 5        | Failed section renders a .section-error block in the pack and the section key appears in X-Failed-Sections header                                                                               | VERIFIED                                      | `section-error` = 4 occurrences, `border-inline-start: 4px solid #b45309` present, EN/AR failure copy both present, `X-Failed-Sections` = 3 occurrences, `sectionErrors` = 20 occurrences                                                                                                                     |
| 6        | No storage upload, signed URL, base64, or SUPABASE_SERVICE_ROLE_KEY usage in the function                                                                                                       | VERIFIED                                      | `SUPABASE_SERVICE_ROLE_KEY`, `createSignedUrl`, `btoa(`, `deno.land/std@0.168.0` all grep to 0 (comment-filtered)                                                                                                                                                                                             |
| 7        | Print CSS: A4 pages with each section on its own page and table rows unsplit                                                                                                                    | VERIFIED (code) / HUMAN for visual            | `@media print` block present, `break-before: page` for `.section`, `table-header-group` for thead, `print-color-adjust: exact`. Actual print rendering requires human                                                                                                                                         |
| 8        | Dialog EN/AR i18n key parity with approved copy and no dead keys                                                                                                                                | VERIFIED                                      | Parity script prints PASS (48 keys each); `format.pdf/docx`, `language.both`, `progress.uploading` GONE; `format.html`, `format.html_info`, `warning.failedSections`, `newTab.generating`, `popupBlocked` all FOUND; `cancel` = "Close" / "إغلاق"; `progress.ready` has no "!"                                |

**Score:** 8/8 truths verified (2 also need human browser confirmation for the live/visual aspects)

### Required Artifacts

| Artifact                                                                 | Expected                                                                   | Status   | Details                                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/dossier-export-pack/index.ts`                        | Schema-correct HTML briefing pack generator with direct text/html response | VERIFIED | 1420 lines; contains `Deno.serve`, `getCorsHeaders`, `aa_commitments`, `position_dossier_links`, `X-Failed-Sections`, `@media print`, `section-error`, `sectionErrors` (20 occurrences); `escapeHtml` count = 26 |
| `frontend/src/components/dossier/ExportDossierDialog.tsx`                | Honest HTML export dialog with new-tab delivery                            | VERIFIED | 401 lines; `window.open('', '_blank')` synchronous before `await`; `role="alert"` for warning banner; `var(--warn)` tokens; zero physical direction utilities (`ml-`, `mr-`, etc.)                               |
| `frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx` | EXPORT-01 component test (no format picker, EN/AR only, default language)  | VERIFIED | 141 lines (>30 min); 5 named behaviors; all 5 pass in vitest run (confirmed 2026-06-11T16:28:56)                                                                                                                 |
| `frontend/src/services/dossier-export.service.ts`                        | exportDossier returning { html, failedSections } from text/html response   | VERIFIED | `response.text()` + `headers.get('X-Failed-Sections')` both present; `ExportDossierResult` interface exported; `downloadExportedFile` gone                                                                       |
| `frontend/src/types/dossier-export.types.ts`                             | Trimmed to honest contract (no pdf/docx/both/uploading)                    | VERIFIED | All dead types absent; `ExportDossierDialogProps` unchanged (5-prop interface)                                                                                                                                   |
| `frontend/src/hooks/useDossierExport.ts`                                 | Hook exposing failedSections, no window/document side effects              | VERIFIED | `failedSections` = 6 occurrences; `exportDossierApi` called from service; hook resolves `{ html, failedSections }`                                                                                               |
| `frontend/src/i18n/en/dossier-export.json`                               | Approved copy, new keys, no dead keys                                      | VERIFIED | 68 lines; parity PASS                                                                                                                                                                                            |
| `frontend/src/i18n/ar/dossier-export.json`                               | Approved copy, new keys, no dead keys                                      | VERIFIED | 68 lines; parity PASS                                                                                                                                                                                            |

### Key Link Verification

| From                                                      | To                                                | Via                                                | Status   | Details                                                                        |
| --------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `supabase/functions/dossier-export-pack/index.ts`         | `position_dossier_links`                          | junction select with positions embed               | VERIFIED | `from('position_dossier_links')` present (1 occurrence)                        |
| `supabase/functions/dossier-export-pack/index.ts`         | `aa_commitments`                                  | direct dossier_id query                            | VERIFIED | `from('aa_commitments')` present (1 occurrence)                                |
| `supabase/functions/dossier-export-pack/index.ts`         | frontend fetch client                             | X-Failed-Sections in Access-Control-Expose-Headers | VERIFIED | `X-Failed-Sections` = 3 occurrences; `Access-Control-Expose-Headers` present   |
| `frontend/src/components/dossier/ExportDossierDialog.tsx` | `frontend/src/hooks/useDossierExport.ts`          | `useDossierExport` hook                            | VERIFIED | Imported at L42; destructured at L86                                           |
| `frontend/src/services/dossier-export.service.ts`         | `/functions/v1/dossier-export-pack`               | authed fetch POST                                  | VERIFIED | `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-export-pack` at L80 |
| `frontend/src/services/dossier-export.service.ts`         | X-Failed-Sections response header                 | `response.headers.get`                             | VERIFIED | `headers.get('X-Failed-Sections')` at L98; split → `failedSections`            |
| `frontend/src/hooks/useDossierExport.ts`                  | `frontend/src/services/dossier-export.service.ts` | `exportDossierApi` import                          | VERIFIED | Imported at L20; called at L96                                                 |

### Data-Flow Trace (Level 4)

| Artifact                                          | Data Variable      | Source                                                                             | Produces Real Data                                      | Status  |
| ------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------- | ------- |
| `ExportDossierDialog.tsx`                         | `html`             | `useDossierExport → exportDossierApi → response.text()` from edge function         | Yes — text/html body from live DB queries               | FLOWING |
| `ExportDossierDialog.tsx`                         | `failedSections`   | `response.headers.get('X-Failed-Sections')` parsed in service                      | Yes — real header from edge function per-section errors | FLOWING |
| `supabase/functions/dossier-export-pack/index.ts` | `data.positions`   | `from('position_dossier_links')` with positions embed                              | Yes — live PostgREST query against staging DB           | FLOWING |
| `supabase/functions/dossier-export-pack/index.ts` | `data.commitments` | `from('aa_commitments').eq('dossier_id', ...).is('is_deleted', false)`             | Yes — direct query on live `aa_commitments` table       | FLOWING |
| `supabase/functions/dossier-export-pack/index.ts` | `data.mous`        | Two-signatory queries on `signatory_1/2_dossier_id` with `.is('deleted_at', null)` | Yes — live mous table queries                           | FLOWING |

### Behavioral Spot-Checks

| Behavior                                     | Command                                                                                                                                               | Result                         | Status |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------ |
| EXPORT-01 component test (5 behaviors)       | `pnpm --filter intake-frontend exec vitest run src/components/dossier/__tests__/ExportDossierDialog.test.tsx`                                         | 5/5 passed, 1.11s              | PASS   |
| No stale DB column patterns in edge function | `grep -v '^\s*//' index.ts \| grep -cE "dossier_ids\|start_datetime\|entity_type\|from\('commitments'\)\|SUPABASE_SERVICE_ROLE_KEY\|createSignedUrl"` | 0                              | PASS   |
| Deno modern transport patterns present       | `grep -c "Deno.serve\|getCorsHeaders\|supabase-js@2.39.3\|getUser(token)"`                                                                            | 1 / 2 / 1 / 2                  | PASS   |
| i18n key parity                              | node parity script                                                                                                                                    | `PARITY PASS - total keys: 48` | PASS   |
| Dead type tokens absent from types/dialog    | grep for `'pdf'\|'docx'\|'both'\|'uploading'`                                                                                                         | 0                              | PASS   |

### Probe Execution

No probe files declared. Edge function verification performed via staging smoke (62-03-SUMMARY.md matrix). Live replay not re-executed — CLI secrets-path token constraint blocks `supabase secrets list`; the committed 7-type matrix (all 200 + text/html, zero X-Failed-Sections, all bodies contain `<title>Briefing Pack`) is the acceptance evidence.

### Requirements Coverage

| Requirement | Source Plan                  | Description                                                                                    | Status    | Evidence                                                                                                                                |
| ----------- | ---------------------------- | ---------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| EXPORT-01   | 62-02-PLAN.md                | Dialog advertises only formats the system actually produces                                    | SATISFIED | HTML-only dialog; format picker removed; component test 5/5 green                                                                       |
| EXPORT-02   | 62-01-PLAN.md, 62-03-PLAN.md | User can export each of the 7 dossier types without 404/500; all stale column reads reconciled | SATISFIED | Function deployed to staging (ACTIVE v1); smoke matrix 7/7 types 200+text/html; zero X-Failed-Sections; all stale reads removed in code |

No orphaned requirements. Both EXPORT-01 and EXPORT-02 are declared in plan frontmatter and traced in REQUIREMENTS.md. No other phase-62 requirements exist.

### Anti-Patterns Found

| File                                                      | Line    | Pattern                                                                                                                                                 | Severity | Impact                                                                                                                                                                                                            |
| --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/dossier-export-pack/index.ts`         | 98      | `${status}` unescaped in `getStatusBadge` HTML interpolation                                                                                            | WARNING  | XSS sink in app-origin document (via `document.write` to `about:blank` tab); DB enum constraints provide practical mitigation for current `status`/`lifecycle_state` values; `footerText` not wired by frontend   |
| `supabase/functions/dossier-export-pack/index.ts`         | 1005    | `${config.footerText}` unescaped in footer HTML                                                                                                         | WARNING  | Same XSS sink; `footerText` is currently never set by the frontend (self-supplied only)                                                                                                                           |
| `supabase/functions/dossier-export-pack/index.ts`         | 598-633 | `executive_summary` in `DEFAULT_EXPORT_SECTIONS` (enabled:true) has no `case` in the switch statement                                                   | WARNING  | TOC advertises "Executive Summary" as section 1; switch falls through silently to empty — TOC and body disagree. Pre-existing gap (not introduced by this phase). No X-Failed-Sections emitted — silent omission. |
| `frontend/src/hooks/useDossierExport.ts`                  | 71-93   | `updateProgress('preparing', 10)` and `updateProgress('fetching', 30)` set synchronously before await — React batches them; UI never shows these stages | INFO     | Fake progress theater; not a functional bug                                                                                                                                                                       |
| `frontend/src/components/dossier/ExportDossierDialog.tsx` | 155-160 | `setTimeout` for auto-close not stored or cleared                                                                                                       | INFO     | Potential setState-after-unmount on fast-close; low probability in practice                                                                                                                                       |

**Debt marker audit:** Zero `TBD`, `FIXME`, or `XXX` markers in any of the 8 files modified by this phase. Two `placeholder` occurrences in ExportDossierDialog.tsx are code comments describing legitimate transient state — not stub indicators. No debt-marker blockers.

**CR-01 classification (WARNING, not BLOCKER):** The advisory code review identified these XSS sinks. They are genuine escaping gaps at the trust boundary. However: (1) no roadmap success criterion names XSS freedom as a condition; (2) the phase's own must-have acceptance gate is "escapeHtml count unchanged or higher" (26 = PASS, identical to the stated post-edit count); (3) the review's context instructions explicitly state these are "advisory findings, not phase-goal blockers"; (4) DB enum constraints currently limit exploitability through status columns; (5) footerText is not wired by any frontend call site. The gaps are tracked in 62-REVIEW.md for follow-up.

### Human Verification Required

#### 1. Popup-Blocker Fallback (D-07)

**Test:** In Chrome with popups blocked for the staging origin, trigger Export from a dossier detail page. After the export completes, verify:

- A `.html` file downloads (named `briefing-pack-{slug}-{YYYYMMDD}.html`)
- The dialog shows the `popupBlocked` notice in the correct language
- The dialog does not auto-close (1500ms suppressed by popupBlocked flag)

Then allow popups and re-export; verify the new tab opens with the placeholder text, then the pack HTML appears.

**Expected:** Blob download path works when window.open returns null; new-tab path works when allowed.
**Why human:** popup-blocker behavior is browser/UI-state dependent; jsdom simulates `window.open` differently; real Chrome popup heuristics cannot be reproduced in vitest.

#### 2. Print Pagination (D-02)

**Test:** Open any exported briefing pack HTML in the browser. Press Cmd+P (macOS) or Ctrl+P (Windows). In the print preview:

- Confirm the cover page appears alone on page 1
- Confirm each dossier section starts a new page (break-before: page)
- Confirm `.data-table` rows are not split across pages
- Confirm repeated table headers on each page
- Confirm the amber `.section-error` block (if shown) is not split

**Expected:** A4 print layout per the CSS rules added in 62-01 Task 2.
**Why human:** Print rendering depends on the browser's print engine; cannot be verified with grep or unit tests.

### Gaps Summary

No gaps blocking goal achievement. All 3 roadmap success criteria are satisfied:

1. **SC-1 (dialog honesty):** Dialog is HTML-only with EN/AR language cards; format picker removed; EXPORT-01 component test 5/5 green.
2. **SC-2 (deployed, 7-type smoke):** Function is ACTIVE on staging (v1, deployed 2026-06-11 13:01 UTC); 62-03-SUMMARY smoke matrix records 7/7 dossier types returning 200 + text/html with zero X-Failed-Sections and `<title>Briefing Pack` in every body.
3. **SC-3 (schema correctness):** All 6 stale read families from the D-05 audit removed; new queries target live schema columns (`position_dossier_links`, `aa_commitments`, `mous.title/lifecycle_state`, `calendar_entries.event_date`, `key_contacts.name/role/organization`, `dossier_relationships.status=active`).

Two items require human browser verification: the popup-blocker fallback delivery (D-07) and print pagination (D-02). These are both listed in 62-VALIDATION.md as "Manual-Only Verifications" and are expected to route through UAT.

---

_Verified: 2026-06-11T13:29:50Z_
_Verifier: Claude (gsd-verifier)_
