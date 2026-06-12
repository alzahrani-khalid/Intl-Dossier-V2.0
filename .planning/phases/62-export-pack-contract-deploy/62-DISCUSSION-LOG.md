# Phase 62: Export Pack Contract & Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 62-export-pack-contract-deploy
**Areas discussed:** Format contract, Dialog surface, Delivery & retention, Partial-failure honesty

---

## Format contract

### What format(s) should the export actually produce?

| Option                         | Description                                                                                                               | Selected |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| Honest HTML (Recommended)      | Relabel dialog to HTML, keep the existing 1281-line HTML generator, add print-optimized CSS; real PDF/DOCX a future phase | ✓        |
| HTML + print-to-PDF flow       | Same honest HTML plus an explicit "Open & print to PDF" affordance                                                        |          |
| Real DOCX, drop PDF            | Implement DOCX via the `docx` JS library in the edge function (works in Deno)                                             |          |
| Real PDF via external renderer | Headless-Chrome service (Gotenberg on droplet / hosted API) — new infra dependency                                        |          |

**User's choice:** Honest HTML
**Notes:** Hard constraint surfaced: Supabase Edge has no headless Chrome and pure-JS PDF libs don't shape Arabic — disqualifying for a bilingual briefing pack.

### Should the exported HTML be print-optimized for browser print-to-PDF?

| Option                        | Description                                                                                                        | Selected |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| Print-optimized (Recommended) | `@media print` rules: A4 `@page` margins, section page-breaks, no mid-table-row breaks, cover page on its own page | ✓        |
| As-is, polish later           | Ship the screen-styled HTML unchanged                                                                              |          |
| You decide                    | Claude's discretion during planning                                                                                |          |

**User's choice:** Print-optimized

---

## Dialog surface

### With HTML as the only format, what should the format section become?

| Option                             | Description                                                                                        | Selected |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Remove picker + note (Recommended) | Drop the radio cards; info line: "print-ready HTML — save as PDF from your browser's print dialog" | ✓        |
| Single HTML format card            | One pre-selected card for layout consistency                                                       |          |
| You decide                         | Claude's discretion                                                                                |          |

**User's choice:** Remove picker + note

### The Bilingual option renders plain English — what's the language contract?

| Option                        | Description                                                                               | Selected |
| ----------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Trim to EN / AR (Recommended) | Drop the broken Bilingual option; default to current UI language; real bilingual deferred | ✓        |
| Implement real bilingual      | Each section renders EN block + AR block — touches all 9 section renderers                |          |
| You decide                    | Claude's discretion                                                                       |          |

**User's choice:** Trim to EN / AR
**Notes:** Discovered during discussion: `isRTL = config.language === 'ar'` in the generator means 'both' silently produced English-only output — same advertised-but-broken class as PDF/Word.

### What happens to the section list and its toggles?

| Option                          | Description                                                                        | Selected |
| ------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Keep all, fix all (Recommended) | Every advertised section reconciled to live schema, incl. timeline/events/contacts | ✓        |
| Trim to verified core           | Keep summary + EXPORT-02 four; drop shaky sections                                 |          |
| You decide                      | Research each section's source, keep what resolves cleanly                         |          |

**User's choice:** Keep all, fix all

---

## Delivery & retention

### How should the generated HTML reach the user?

| Option                        | Description                                                                          | Selected |
| ----------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Direct response (Recommended) | Edge returns HTML in the response body — no bucket, no signed URL, no orphaned files | ✓        |
| Keep storage + signed URL     | Current flow; preserves re-download/history option but needs bucket on staging       |          |
| You decide                    | Claude's discretion                                                                  |          |

**User's choice:** Direct response

### What should the frontend do with the returned HTML?

| Option                        | Description                                                                  | Selected |
| ----------------------------- | ---------------------------------------------------------------------------- | -------- |
| Open in new tab (Recommended) | Blob URL in a new tab — one Cmd+P from Save-as-PDF, matching the dialog note | ✓        |
| Download .html file           | Current force-download behavior                                              |          |
| Both                          | Tab + a save affordance in the success state                                 |          |

**User's choice:** Open in new tab

---

## Partial-failure honesty

### When one section's data query fails during export, what should happen?

| Option                               | Description                                                                                                                 | Selected |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| In-document error note (Recommended) | Pack still generates; failed section renders a localized "could not be generated" block; dialog warns which sections failed | ✓        |
| Fail the whole export                | Any section error aborts with a clear dialog error                                                                          |          |
| You decide                           | Claude's discretion                                                                                                         |          |

**User's choice:** In-document error note

---

## Claude's Discretion

- Popup-blocker handling for the new-tab open; file-name pattern on manual save
- Whether the failed-section warning pauses the auto-open or annotates the success state
- Print CSS details beyond the agreed list
- Cleanup of dead code paths (storage upload, `downloadExportedFile`, format/docx branches, unused `dossierExportKeys.history`)

## Deferred Ideas

- Real PDF/DOCX rendering (server-side `docx` lib or external headless-Chrome renderer like Gotenberg) — future phase
- Real bilingual (EN+AR in one document) export rendering — future phase alongside PDF/DOCX
- Export history / re-download — requires persistence removed by the direct-response decision
