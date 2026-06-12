# Phase 62: Export Pack Contract & Deploy - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

A user clicks Export on any of the 7 dossier types and receives a real, honestly-advertised file from a deployed, schema-correct `dossier-export-pack` edge function. Covers: the format/contract decision (EXPORT-01), schema reconciliation + edge deploy + 7-type staging verification (EXPORT-02), and the matching dialog rework. Does NOT cover: real PDF/DOCX rendering, bilingual single-document rendering, export history, or the Phase 66 overview error contract.

</domain>

<decisions>
## Implementation Decisions

### Format contract (EXPORT-01 — decision recorded)

- **D-01:** **Honest HTML.** The dialog is relabeled to HTML; the existing HTML generator in `supabase/functions/dossier-export-pack/index.ts` stays the rendering engine. Real PDF/DOCX rendering is formally deferred (see Deferred Ideas). The EXPORT-01 "decision recorded" requirement is satisfied by this choice.
- **D-02:** **Print-optimized output.** Add `@media print` rules to the generator's inline stylesheet: A4 `@page` margins, page-break before each section, avoid breaks inside table rows, cover page on its own page. The expectation is that users produce PDFs via the browser print dialog, so the printed result must look like a real briefing pack.

### Dialog surface

- **D-03:** **Remove the format picker.** The PDF/Word radio cards are deleted. A short info line states the contract: exports as a print-ready HTML briefing pack — save as PDF from the browser's print dialog. No dead choices, no single-option picker.
- **D-04:** **Language trimmed to EN / AR.** The "Bilingual" option is removed — the generator's `isRTL = config.language === 'ar'` means "both" silently rendered English-only (same advertised-but-broken class as PDF/Word). Default the selection to the user's current UI language. Real bilingual rendering is deferred.
- **D-05:** **Keep all sections, fix all.** Every advertised section stays (summary/stats, positions, MoUs, commitments, timeline, events, contacts, documents) and each is reconciled to live schema — not just the four named in EXPORT-02. Researcher must verify each section's source table/columns against the live staging schema. Cover-page and TOC toggles stay as-is.

### Delivery & retention

- **D-06:** **Direct response body.** The edge function returns the generated HTML directly in the response — no storage bucket upload, no signed URL, no orphaned files, one less staging deploy dependency. The current `exports/{userId}/...` storage path + 1-hour signed URL flow is removed.
- **D-07:** **Open in new tab.** The frontend receives the HTML and opens it in a new tab via a blob URL (popup-blocker-safe implementation is Claude's discretion — e.g., open the window synchronously on click, then write into it). No forced download; the user is one Cmd+P from Save-as-PDF, matching the dialog note (D-03).

### Partial-failure honesty

- **D-08:** **In-document error note.** If a section's data query fails during export, the pack still generates but that section renders a visible, localized "This section could not be generated" block — and the dialog's success state warns which sections failed. Empty sections keep their existing "No X found" text. Failure is never rendered as a clean empty section.

### Claude's Discretion

- Popup-blocker handling for the new-tab open (D-07) and exact file-name pattern if the user saves.
- Whether the failed-section warning pauses the auto-open or just annotates the success state.
- Exact print CSS details beyond the D-02 list.
- Cleanup of now-dead code paths (storage upload, signed-URL fetch, `downloadExportedFile`, format/docx branches, unused `dossierExportKeys.history`).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase source & requirements

- `.planning/dossier-workflow-backlog-phases-2026-06-11.md` §Phase P1 — the originating backlog item (R7-01): evidence, scope, acceptance, touched files
- `.planning/REQUIREMENTS.md` §Export / Briefing Pack — EXPORT-01, EXPORT-02 exact wording (stale columns enumerated)
- `reports/dossier-workflows-round*-inspection-*.md` — round-7 R7-01 evidence (edge not deployed, HTML-only output); round-17 no-new-finding export note

### Code under change

- `supabase/functions/dossier-export-pack/index.ts` — the 1281-line edge function: HTML generator (9 section renderers), stale reads at ~L988 (`positions.classification`, `.contains('dossier_ids')`), ~L996 (`mous` via `dossier_ids`), ~L1038 (`documents.entity_type`), ~L1051 (legacy `commitments`), storage upload at ~L1224-1256
- `frontend/src/components/dossier/ExportDossierDialog.tsx` — dialog to rework (format picker, language radio, advanced options)
- `frontend/src/services/dossier-export.service.ts` — fetch client + `downloadExportedFile` (to be replaced by new-tab flow)
- `frontend/src/types/dossier-export.types.ts` — `DossierExportFormat`, `ExportLanguage`, `DEFAULT_EXPORT_SECTIONS` contracts to update
- `frontend/src/hooks/useDossierExport.ts` — export hook orchestrating progress/success/error states
- `frontend/src/i18n/en/dossier-export.json` + `frontend/src/i18n/ar/dossier-export.json` — dialog copy to update for the new contract (both languages)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- The HTML generator already covers cover page, TOC, stats, and all 8 content sections with bilingual strings — D-01 keeps it; only schema reads, print CSS, and the failure-note pattern change.
- `escapeHtml` is already applied in section renderers (round-fkn security pass touched `@page` style-block XSS sinks — preserve that hardening when editing the stylesheet).

### Established Patterns

- Edge functions deploy via Supabase CLI/MCP to staging `zkrcjzdemdmwhearhfgg`; prior export-adjacent fixes (`dossier-activity-timeline` v3, `positions-dossiers-create` v11) followed this path.
- Known schema truths from prior phases: work-item commitments live in `aa_commitments` (legacy `commitments` is empty); canonical position↔dossier linkage is `position_dossier_links` (not `positions.dossier_ids`); `documents.entity_type` is a stale read per EXPORT-02.
- Edge auth pattern: `@2` + `getUser(token)` (bare `getUser()` 401s on valid tokens — project memory).
- i18n: namespaces must be registered in `frontend/src/i18n/index.ts` (static bundle, no http-backend); `dossier-export` namespace already exists in both languages.
- Dates in product copy follow `Tue 28 Apr` day-first format; `Intl` Arabic digits trap — use existing format helpers where applicable.

### Integration Points

- Export entry point: DossierShell header Export action (localized via `dossier:action.export`, fixed in quick 260607-j2e).
- Verification target: staging, all 7 dossier types, live (per success criteria — no 404, no 500, advertised format delivered).

</code_context>

<specifics>
## Specific Ideas

- The dialog's info note should read like the design system's voice (sentence case, no marketing): state plainly that the export is a print-ready HTML briefing pack and PDF is available via the browser print dialog.
- The failed-section block must be localized (EN+AR) and visually distinct from the "No X found" empty text — failure and emptiness are different states (D-08).

</specifics>

<deferred>
## Deferred Ideas

- **Real PDF/DOCX rendering** — server-side `docx` library or external headless-Chrome renderer (e.g., Gotenberg container on the droplet). Future phase; the format contract D-01 explicitly defers this.
- **Real bilingual (EN+AR in one document) export rendering** — would touch all 9 section renderers; deferred alongside PDF/DOCX.
- **Export history / re-download** — the unused `dossierExportKeys.history` query key hints at it; requires persistence that D-06 removes. Deferred.

</deferred>

---

_Phase: 62-export-pack-contract-deploy_
_Context gathered: 2026-06-11_
