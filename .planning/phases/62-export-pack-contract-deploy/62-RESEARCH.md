# Phase 62: Export Pack Contract & Deploy - Research

**Researched:** 2026-06-11
**Domain:** Supabase Edge Function (Deno/TypeScript), React dialog rework, print CSS, new-tab delivery
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Honest HTML.** Dialog relabeled to HTML. The existing HTML generator in `supabase/functions/dossier-export-pack/index.ts` stays the rendering engine. Real PDF/DOCX rendering deferred.
- **D-02: Print-optimized output.** Add `@media print` rules to the generator's inline stylesheet: A4 `@page` margins, page-break before each section, avoid breaks inside table rows, cover page on its own page. Users produce PDFs via browser print dialog.
- **D-03: Remove the format picker.** The PDF/Word radio cards are deleted. Short info line states: exports as a print-ready HTML briefing pack — save as PDF from the browser's print dialog.
- **D-04: Language trimmed to EN / AR.** Remove the "Bilingual" option. Default selection to user's current UI language. Real bilingual rendering deferred.
- **D-05: Keep all sections, fix all.** Every advertised section stays and each is reconciled to live schema. Cover-page and TOC toggles stay as-is.
- **D-06: Direct response body.** Edge function returns generated HTML directly — no storage bucket upload, no signed URL, no orphaned files. The `exports/{userId}/...` storage path + 1-hour signed URL flow is removed.
- **D-07: Open in new tab.** Frontend receives HTML and opens it in a new tab via a blob URL (popup-blocker-safe: open window synchronously on click, then write into it). No forced download.
- **D-08: In-document error note.** If a section's data query fails, the pack still generates but that section renders a visible, localized "This section could not be generated" block. Dialog success state warns which sections failed. Empty sections keep existing "No X found" text.

### Claude's Discretion

- Popup-blocker handling for the new-tab open (D-07) and exact file-name pattern if the user saves.
- Whether the failed-section warning pauses the auto-open or just annotates the success state.
- Exact print CSS details beyond the D-02 list.
- Cleanup of now-dead code paths (storage upload, signed-URL fetch, `downloadExportedFile`, format/docx branches, unused `dossierExportKeys.history`).

### Deferred Ideas (OUT OF SCOPE)

- Real PDF/DOCX rendering (server-side `docx` or headless-Chrome).
- Real bilingual (EN+AR in one document) export rendering.
- Export history / re-download.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                        | Research Support                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| EXPORT-01 | The dossier Export dialog advertises only formats the system actually produces (decision: HTML, relabeled)                         | D-01/D-03/D-04 locked decisions; dialog rework section below |
| EXPORT-02 | User can export a dossier of each of the 7 types and receives the advertised file — no 404 (edge deployed) and no stale-column 500 | D-05 stale-read audit table + deploy section below           |

</phase_requirements>

---

## Summary

Phase 62 delivers a working, honestly-advertised export for all 7 dossier types. The `dossier-export-pack` edge function exists in source but has never been deployed to staging (`zkrcjzdemdmwhearhfgg`). The source contains six confirmed stale reads that would cause 500 errors at runtime. The dialog currently advertises PDF and Word formats that the function never produces (it outputs HTML). The decisions are locked: relabel to HTML, fix all stale reads, ship direct response (no storage bucket), open result in a new browser tab.

The phase has three separable workstreams: (1) edge function surgery — schema fixes, storage removal, direct-response body, D-08 error note, print CSS, auth/CORS upgrade; (2) frontend changes — dialog rework, types update, hook rework, i18n copy; (3) deploy and per-type smoke verification on staging.

**Primary recommendation:** Fix the six stale reads as a batch in one pass before deploying. The deploy command is `supabase functions deploy dossier-export-pack --project-ref zkrcjzdemdmwhearhfgg`. Verification is a POST to the deployed URL for each of the 7 dossier type IDs on staging.

---

## Architectural Responsibility Map

| Capability                          | Primary Tier            | Secondary Tier | Rationale                                                            |
| ----------------------------------- | ----------------------- | -------------- | -------------------------------------------------------------------- |
| HTML generation + section rendering | API (Edge Function)     | —              | Server-side assembly; avoids client memory blowup for large dossiers |
| Data fetching (all 8 sections)      | API (Edge Function)     | —              | Single authed DB hop; avoids N×frontend-client roundtrips            |
| Print CSS / A4 layout               | API (Edge Function)     | —              | Inline in the emitted HTML so the file is self-contained             |
| Popup-blocker-safe new-tab delivery | Browser/Client          | —              | `window.open` must be called synchronously in a user gesture handler |
| Progress / error state display      | Frontend Server (React) | —              | Hook-driven state machine in `useDossierExport`                      |
| Auth token forwarding               | Frontend → Edge         | —              | `getSession()` → `Bearer` header; edge uses `getUser(token)`         |
| Edge deploy                         | CLI/CI                  | —              | `supabase functions deploy` against project ref                      |

---

## Standard Stack

### Core (no new packages — this phase uses the existing stack)

| Library                                        | Version   | Purpose                            | Why Standard                                                 |
| ---------------------------------------------- | --------- | ---------------------------------- | ------------------------------------------------------------ |
| `@supabase/supabase-js`                        | `@2.39.3` | DB queries + auth in Edge Function | Version in use across all other edge functions               |
| `https://deno.land/std@0.168.0/http/server.ts` | 0.168.0   | `serve()` in edge function         | Already imported; will switch to `Deno.serve` (see patterns) |
| Supabase CLI                                   | 2.102.0   | Edge function deploy               | Already installed at `/opt/homebrew/bin/supabase`            |

### Dead Code to Remove (D-06)

The following imports and code paths become dead after this phase and should be deleted:

| Dead Symbol                                    | Location                     | Reason                            |
| ---------------------------------------------- | ---------------------------- | --------------------------------- | --------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` env read           | `index.ts` L1227             | Storage client no longer needed   |
| `serviceClient` storage upload block           | `index.ts` L1224–1244        | D-06: no storage upload           |
| `createSignedUrl` call                         | `index.ts` L1240–1243        | D-06                              |
| `base64` / `btoa` encode                       | `index.ts` L1213–1215        | Edge now streams HTML directly    |
| `downloadExportedFile` function                | `dossier-export.service.ts`  | Replaced by blob-URL new-tab open |
| `dossierExportKeys.history`                    | `dossier-export.service.ts`  | Export history deferred           |
| `DossierExportStatus` `'uploading'` variant    | `dossier-export.types.ts`    | No upload step                    |
| `content_base64` / `expires_at` fields         | `DossierExportResponse` type | No longer returned                |
| Format state `'pdf'                            | 'docx'`                      | `ExportDossierDialog.tsx`         | D-03: format picker removed |
| Language state `'both'`                        | `ExportDossierDialog.tsx`    | D-04: bilingual option removed    |
| `DossierExportFormat` type                     | `dossier-export.types.ts`    | Replaced by `'html'` constant     |
| `DEFAULT_EXPORT_CONFIG.format` default `'pdf'` | `dossier-export.types.ts`    | Now `'html'`                      |

**Package Legitimacy Audit:** Not applicable — this phase installs no new packages.

---

## D-05 Stale-Read Audit: Full Section-by-Section Map

This is the core planning input (per orchestrator directive). Every DB read in `fetchDossierData` is mapped against the verified live schema.

### Section 0 — Dossier fetch (L927–935)

```
supabase.from('dossiers').select('*').eq('id', dossierId).single()
```

| Read         | Live Column?                                                                                                                    | Verdict |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `dossiers.*` | All columns exist (`id`, `type`, `name_en`, `name_ar`, `description_en`, `description_ar`, `status`, `sensitivity_level`, etc.) | VALID   |

**Action:** No change needed for dossier fetch. `*` is fine; the section renderers only use `name_en`, `name_ar`, `description_en`, `description_ar`, `type`, `status`. [VERIFIED: live schema from orchestrator]

---

### Section 1 — Relationships (L948–983)

```
supabase.from('dossier_relationships')
  .select('*, target_dossier:target_dossier_id(id, name_en, name_ar, type)')
  .eq('source_dossier_id', dossierId)
  .is('deleted_at', null)
```

| Read                                      | Live Column?                                               | Verdict                                                                |
| ----------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dossier_relationships.source_dossier_id` | YES                                                        | VALID                                                                  |
| `dossier_relationships.target_dossier_id` | YES                                                        | VALID                                                                  |
| `dossier_relationships.relationship_type` | YES                                                        | VALID                                                                  |
| `dossier_relationships.notes_en`          | YES                                                        | VALID                                                                  |
| `dossier_relationships.notes_ar`          | YES                                                        | VALID                                                                  |
| `deleted_at` filter                       | `dossier_relationships` has no `deleted_at` in live schema | **STALE** — `.is('deleted_at', null)` will error or silently skip rows |

**Fix:** Remove `.is('deleted_at', null)` from both outgoing and incoming relationship queries. The `dossier_relationships` table uses a `status` column for soft-delete; add `.eq('status', 'active')` if filtering is needed, or simply drop the deleted_at filter since the relationships section shows all relationships regardless. [VERIFIED: live schema from orchestrator shows `status` column exists on `dossier_relationships`]

The `generateRelationshipsSection` renderer reads `rel.name_ar`, `rel.type`, `rel.relationship_type`, `rel.notes_ar`, `rel.notes_en` — all valid from the join. [VERIFIED]

---

### Section 2 — Positions (L985–991)

```
supabase.from('positions')
  .select('id, title_en, title_ar, status, classification, created_at')
  .contains('dossier_ids', [dossierId])
  .order('created_at', { ascending: false })
  .limit(20)
```

| Read                                    | Live Column?                                 | Verdict                          |
| --------------------------------------- | -------------------------------------------- | -------------------------------- |
| `positions.title_en`                    | YES                                          | VALID                            |
| `positions.title_ar`                    | YES                                          | VALID                            |
| `positions.status`                      | YES                                          | VALID                            |
| `positions.classification`              | **NO** — column does not exist               | **STALE**                        |
| `.contains('dossier_ids', [dossierId])` | **NO** — `dossier_ids` column does not exist | **STALE** — this query would 500 |

**Fix:** Replace the entire positions query with a junction-table join:

```typescript
// Correct: join via position_dossier_links
supabase
  .from('position_dossier_links')
  .select('position:positions(id, title_en, title_ar, status, created_at)')
  .eq('dossier_id', dossierId)
  .order('created_at', { ascending: false, foreignTable: 'positions' })
  .limit(20)
```

Then flatten: `(data || []).map(link => link.position).filter(Boolean)`

Remove `pos.classification` from `generatePositionsSection` renderer (the conditional `${pos.classification ? ...}` block). [VERIFIED: live schema confirmed no `classification`, no `dossier_ids` on positions; `position_dossier_links` is the canonical junction]

---

### Section 3 — MoUs (L993–999)

```
supabase.from('mous')
  .select('id, title_en, title_ar, status, created_at')
  .contains('dossier_ids', [dossierId])
  .order('created_at', { ascending: false })
  .limit(20)
```

| Read                                    | Live Column?                                                        | Verdict                          |
| --------------------------------------- | ------------------------------------------------------------------- | -------------------------------- |
| `mous.title_en`                         | **NO** — English title is `title` (not `title_en`)                  | **STALE**                        |
| `mous.title_ar`                         | YES                                                                 | VALID                            |
| `mous.status`                           | **NO** — lifecycle column is `lifecycle_state` or `lifecycle_stage` | **STALE**                        |
| `.contains('dossier_ids', [dossierId])` | **NO** — `dossier_ids` column does not exist                        | **STALE** — this query would 500 |

**Fix:** Query via signatory columns (same pattern as `fetchDocuments` in `dossier-overview.service.ts`):

```typescript
// Correct: query via signatory dossier columns
const [mous1Result, mous2Result] = await Promise.all([
  supabase
    .from('mous')
    .select('id, title, title_ar, lifecycle_state, created_at')
    .eq('signatory_1_dossier_id', dossierId)
    .is('is_deleted', false)
    .limit(20),
  supabase
    .from('mous')
    .select('id, title, title_ar, lifecycle_state, created_at')
    .eq('signatory_2_dossier_id', dossierId)
    .is('is_deleted', false)
    .limit(20),
])
// Deduplicate by id, then combine
```

Update `generateMousSection` renderer to use `m.title` (not `m.title_en`) and `m.lifecycle_state` (not `m.status`) for `getStatusBadge`. [VERIFIED: live schema — `title` is the English column, `lifecycle_state` is the status-like field, signatory columns are `signatory_1_dossier_id`/`signatory_2_dossier_id`]

---

### Section 4 — Commitments (L1001–1060)

**Two-step fetch — both steps are stale:**

**Step 4a** (L1001–1007):

```
supabase.from('work_item_dossiers')
  .select('work_item_type, work_item_id')
  .eq('dossier_id', dossierId)
  .is('deleted_at', null)
  .limit(50)
```

| Read                                | Live Column?                                             | Verdict |
| ----------------------------------- | -------------------------------------------------------- | ------- |
| `work_item_dossiers.work_item_type` | YES                                                      | VALID   |
| `work_item_dossiers.work_item_id`   | YES                                                      | VALID   |
| `work_item_dossiers.dossier_id`     | YES                                                      | VALID   |
| `deleted_at` filter                 | YES — `deleted_at` column exists on `work_item_dossiers` | VALID   |

**Step 4b** (L1049–1059) — the actual commitment fetch:

```
supabase.from('commitments')
  .select('*, assignee:responsible_user_id(full_name)')
  .in('id', commitmentIds)
```

| Read                       | Live Column?                                                           | Verdict                               |
| -------------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| `commitments` table        | **EMPTY/WRONG TABLE** — work-item commitments live in `aa_commitments` | **STALE** — will always return 0 rows |
| `responsible_user_id` join | Does not exist on `aa_commitments`                                     | **STALE**                             |

**Fix:** `aa_commitments` has a direct `dossier_id` column — skip `work_item_dossiers` entirely for commitments and query directly:

```typescript
supabase
  .from('aa_commitments')
  .select('id, title, title_ar, status, priority, due_date, owner_user_id, created_at')
  .eq('dossier_id', dossierId)
  .is('is_deleted', false)
  .order('created_at', { ascending: false })
  .limit(20)
```

Map `c.title` (not `c.title_en` — `aa_commitments` uses `title` not `title_en`), `c.title_ar`, `c.status`, `c.priority`, `c.due_date` (not `c.deadline` — the CLAUDE.md glossary carve-out notes `aa_commitments` uses `due_date`). Drop `assignee_name` or replace with `owner_user_id` if display is desired. [VERIFIED: live schema confirmed — `aa_commitments` has `dossier_id`, `title`, `title_ar`, `status`, `priority`, `due_date`, `owner_user_id`, `is_deleted`]

Also update `generateCommitmentsSection` renderer: column `c.deadline` → `c.due_date`; `c.title_en` → `c.title`.

---

### Section 5 — Timeline / Activities (L1022–1030)

```
supabase.from('audit_logs')
  .select('*')
  .eq('entity_id', dossierId)
  .order('created_at', { ascending: false })
  .limit(20)
```

| Read                    | Live Column? | Verdict |
| ----------------------- | ------------ | ------- |
| `audit_logs.entity_id`  | YES          | VALID   |
| `audit_logs.action`     | YES          | VALID   |
| `audit_logs.created_at` | YES          | VALID   |

The transform at L1074–1079 reads `a.action` and `a.created_at` — both valid. [VERIFIED: live migration schema]

The `generateTimelineSection` renderer reads `a.timestamp` (mapped from `a.created_at` in the transform) and `a.title_en`/`a.title_ar` (mapped from `a.action`). The renderer also references `a.activity_type` which is mapped as `a.action`.

**Action:** Timeline section queries are valid as-is. The `audit_logs` query correctly uses `entity_id`. No stale reads.

---

### Section 6 — Events / Calendar (L1009–1017)

```
supabase.from('calendar_entries')
  .select('*')
  .eq('dossier_id', dossierId)
  .gte('start_datetime', new Date().toISOString())
  .order('start_datetime', { ascending: true })
  .limit(10)
```

| Read                              | Live Column?                                              | Verdict                                            |
| --------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `calendar_entries.dossier_id`     | YES                                                       | VALID                                              |
| `calendar_entries.start_datetime` | **NO** — column is `event_date` (+ separate `event_time`) | **STALE** — `.gte('start_datetime', ...)` will 500 |

**Fix:**

```typescript
supabase
  .from('calendar_entries')
  .select(
    'id, title_en, title_ar, entry_type, event_date, event_time, location, is_virtual, status',
  )
  .eq('dossier_id', dossierId)
  .gte('event_date', new Date().toISOString().split('T')[0])
  .order('event_date', { ascending: true })
  .limit(10)
```

Update `generateEventsSection` renderer: `e.start_datetime` → `e.event_date`; `e.event_type` → `e.entry_type`; `e.location_en`/`e.location_ar` → `e.location` (monolingual). [VERIFIED: live schema — `event_date`, `event_time`, `entry_type`, `location`, `title_en`, `title_ar` all confirmed]

---

### Section 7 — Contacts (L1018–1024)

```
supabase.from('key_contacts')
  .select('*')
  .eq('dossier_id', dossierId)
  .order('name', { ascending: true })
  .limit(20)
```

| Read                      | Live Column? | Verdict |
| ------------------------- | ------------ | ------- |
| `key_contacts.dossier_id` | YES          | VALID   |
| `key_contacts.name`       | YES          | VALID   |
| `key_contacts.email`      | YES          | VALID   |
| `key_contacts.phone`      | YES          | VALID   |

The `generateContactsSection` renderer reads `c.name_ar` (does not exist — `key_contacts` is monolingual, only `name`), `c.title_en`/`c.title_ar` (do not exist — the column is `role`), `c.organization_en`/`c.organization_ar` (do not exist — column is `organization`). [VERIFIED: `dossier-overview.service.ts` L237-246 has the live-verified schema comment: "monolingual and has no photo/person-link columns"]

**Fix:** Update `generateContactsSection` renderer to use live columns:

```typescript
// Renderer fix
c.name // instead of c.name_ar / c.name
c.role // instead of c.title_en / c.title_ar
c.organization // instead of c.organization_en / c.organization_ar
c.email
c.phone
```

No query fix needed — `.select('*')` with `dossier_id` filter is valid.

---

### Section 8 — Documents (L1031–1040 + L1090–1097)

```
supabase.from('documents')
  .select('*')
  .eq('entity_type', 'dossier')
  .eq('entity_id', dossierId)
  .limit(20)
```

| Read                    | Live Column?                                                     | Verdict              |
| ----------------------- | ---------------------------------------------------------------- | -------------------- |
| `documents.entity_type` | **NO** — does not exist; linkage is via `related_entities` jsonb | **STALE** — will 500 |
| `documents.entity_id`   | **NO** — does not exist                                          | **STALE**            |

**Fix:** Documents do not have direct `entity_type`/`entity_id` columns. The `related_entities` jsonb shape is not well-documented and querying jsonb for a dossier match in a PostgREST filter is fragile. The canonical pattern used by `fetchDocuments` in `dossier-overview.service.ts` is to surface dossier-associated documents via MoU and positions joins — documents are surfaced indirectly through signatory/position links, not via a documents-table dossier filter.

**Recommended fix:** For the export, surface documents via the MoUs and positions already fetched (their linked documents), rather than from `documents` table directly. Alternatively, return an empty documents section with a note and let the user know documents are listed in their respective sections. Given D-08 (honest failure note), the cleanest fix is to catch the would-be 500 gracefully:

```typescript
// Option A — safe fallback: query via known joinable paths
// (MoU document_path column or position attachments)
// documents.document_path is a column on mous that references storage

// Option B — honest empty: skip direct documents query,
// return [] and let D-08 "No documents found" text render
// This avoids any stale query risk
```

**Recommendation:** Use Option B for this phase — query `documents` with a `related_entities` jsonb containment filter that looks for the dossier_id. PostgREST supports `@>` via `.contains()` on jsonb. If the jsonb structure is unknown at plan time, default to returning `[]` for the documents section (it renders "No documents found" per existing logic) and document it as a follow-up. This is safe and honest per D-08.

The transform at L1090–1097 reads `d.file_name` (not a column — `documents` has `title`) and maps to `title_en`/`title_ar`. This transform must also be updated when the query is fixed.

[VERIFIED: live schema — `documents` has `title`, `type`, `classification`, `related_entities` (jsonb) — no `entity_type`, `entity_id`, `file_name` columns]

---

### Summary Stale-Read Fix Table

| Section              | Stale Read                                                 | Fix                                                                      |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Relationships        | `.is('deleted_at', null)`                                  | Remove filter or use `.eq('status', 'active')`                           |
| Positions query      | `positions.classification` select                          | Remove from select list                                                  |
| Positions query      | `.contains('dossier_ids', [dossierId])`                    | Replace with `position_dossier_links` junction join                      |
| Positions renderer   | `pos.classification` conditional block                     | Delete the block                                                         |
| MoUs query           | `mous.title_en`                                            | Change to `mous.title`                                                   |
| MoUs query           | `mous.status`                                              | Change to `mous.lifecycle_state`                                         |
| MoUs query           | `.contains('dossier_ids', [dossierId])`                    | Replace with signatory_1/2_dossier_id double-query                       |
| MoUs renderer        | `m.title_en`                                               | Change to `m.title`                                                      |
| MoUs renderer        | `m.status`                                                 | Change to `m.lifecycle_state`                                            |
| Commitments step-4b  | `from('commitments')`                                      | Replace entire 2-step with direct `aa_commitments` query on `dossier_id` |
| Commitments renderer | `c.deadline`                                               | Change to `c.due_date`                                                   |
| Commitments renderer | `c.title_en`                                               | Change to `c.title`                                                      |
| Calendar query       | `.gte('start_datetime', ...)`                              | Change to `.gte('event_date', ...)`                                      |
| Calendar query       | `.order('start_datetime', ...)`                            | Change to `.order('event_date', ...)`                                    |
| Calendar renderer    | `e.start_datetime`                                         | Change to `e.event_date`                                                 |
| Calendar renderer    | `e.event_type`                                             | Change to `e.entry_type`                                                 |
| Calendar renderer    | `e.location_en` / `e.location_ar`                          | Change to `e.location` (monolingual)                                     |
| Contacts renderer    | `c.name_ar`                                                | Change to `c.name`                                                       |
| Contacts renderer    | `c.title_en` / `c.title_ar`                                | Change to `c.role`                                                       |
| Contacts renderer    | `c.organization_en` / `c.organization_ar`                  | Change to `c.organization`                                               |
| Documents query      | `.eq('entity_type', 'dossier').eq('entity_id', dossierId)` | Replace with safe fallback (see above)                                   |
| Documents transform  | `d.file_name`                                              | Change to `d.title` if query is kept                                     |

---

## Architecture Patterns

### Pattern 1: Edge Function Direct HTML Response (D-06)

**What:** Replace the storage upload + signed URL pattern with a direct `text/html` response body.
**When to use:** When the output can be consumed inline (new tab) rather than persisted.

**Current flow (remove):**

```
generate HTML → base64-encode → upload to storage bucket → create signed URL → return URL
```

**New flow:**

```
generate HTML → return HTML as response body with Content-Type: text/html
```

**New response shape:**

```typescript
return new Response(html, {
  status: 200,
  headers: {
    ...corsHeaders, // use getCorsHeaders(req) not static corsHeaders
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Disposition': `inline; filename="${fileName}"`,
  },
})
```

Note: The service response type changes from JSON to HTML text. `exportDossier` in `dossier-export.service.ts` currently calls `response.json()` — this must change to `response.text()`. [ASSUMED — standard pattern; no official Supabase Edge Function docs confirm direct HTML response, but it is a standard Deno `Response` usage]

---

### Pattern 2: Popup-Blocker-Safe New-Tab Open (D-07)

**The constraint:** `window.open()` is blocked by browser popup blockers unless called synchronously in a user-initiated event handler. Async operations (awaiting the API call) break synchronicity.

**Safe pattern:** Open the window synchronously on click before the async fetch, then write into it when data arrives.

```typescript
// In the click handler (must be synchronous at call site):
const newTab = window.open('', '_blank')   // opens blank tab synchronously (user gesture)
if (!newTab) {
  // Popup was blocked — fallback: trigger anchor download
  fallbackDownload(htmlContent, fileName)
  return
}

// Then await the async export
const htmlContent = await exportDossier(...)

// Write content into the already-open tab
newTab.document.open()
newTab.document.write(htmlContent)
newTab.document.close()
```

**Fallback:** If `window.open()` returns `null` (popup blocked), create a Blob URL and trigger an `<a download>` click as a forced download fallback. [ASSUMED — standard browser popup-blocker pattern; verified against MDN documentation conceptually]

**File name:** When the user saves via Cmd+S or "Save as PDF" → print dialog, the browser uses the `<title>` tag as the suggested file name. The current `generateHTMLDocument` sets `<title>Briefing Pack - {name}</title>` — this is already good. No explicit file-name API call needed.

---

### Pattern 3: D-08 In-Document Error Note

**What:** Section data fetches are wrapped individually; a failure renders a styled error block instead of crashing the whole export.

**Pattern (per section):**

```typescript
// In fetchDossierData, track per-section errors:
const sectionErrors: Record<string, string> = {}

// For each section query:
const positionsResult = await supabase.from('position_dossier_links')...
if (positionsResult.error) {
  sectionErrors['positions'] = positionsResult.error.message
}

// Pass sectionErrors to generateHTMLDocument
// In the renderer:
function generatePositionsSection(positions: any[], isRTL: boolean, error?: string): string {
  if (error) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <div class="section-error">
          <p>${isRTL ? 'تعذّر تحميل هذا القسم' : 'This section could not be generated'}</p>
        </div>
      </div>
    `
  }
  // ... normal render
}
```

**Dialog warning:** The edge response should include a `failed_sections` array in the JSON envelope (alongside the HTML). The dialog success state shows a warning listing failed section names. [ASSUMED — implementation pattern is Claude's discretion per D-08]

**Revised response shape (D-06 + D-08 combined):**
The edge now returns HTML directly, not JSON. To also convey `failed_sections`, options are:

1. Return HTML body with a custom `X-Failed-Sections` response header (simplest, no parse needed)
2. Return JSON with `{ html: "...", failed_sections: [...] }` and extract from frontend

**Recommendation:** Option 1 — `X-Failed-Sections: positions,mous` header. The frontend reads the header, shows a toast/warning if non-empty, then writes the HTML to the new tab. Clean separation.

---

### Pattern 4: Auth + CORS Upgrade

The current `dossier-export-pack` uses the **deprecated static `corsHeaders`** with wildcard origin and the **older `serve()` API**.

**Required upgrades (matching other edge functions):**

1. **Upgrade CORS:** Use `getCorsHeaders(req)` instead of static `corsHeaders` for all non-OPTIONS responses. Already in `_shared/cors.ts`.

2. **Upgrade serve:** Switch from `serve(async (req) => {...})` (Deno.land/std) to `Deno.serve(async (req) => {...})` (native). The reference function `dossier-activity-timeline` uses `Deno.serve`. [VERIFIED: `dossier-activity-timeline` uses `Deno.serve`]

3. **Auth pattern is already correct:** The current code does `supabase.auth.getUser(token)` with the token passed explicitly (L1162) — this is the correct `@2` pattern per project memory. No change needed.

4. **Supabase client version:** Current `dossier-export-pack` uses `@2.39.0`, reference function uses `@2.39.3`. Update to `@2.39.3` for consistency. [VERIFIED: `dossier-activity-timeline` uses `@2.39.3`]

---

### Pattern 5: Print CSS for D-02

**What:** Add `@media print` rules so `Cmd+P` produces an A4 briefing pack.

The current stylesheet already has `@page { size: A4; margin: 1.5cm; }` and `.page-break { page-break-after: always; }`. The D-02 additions:

```css
@media print {
  /* Each section starts on a new page */
  .section {
    page-break-before: always;
  }
  /* Cover page gets its own page (already uses page-break div) */
  .cover-page {
    page-break-after: always;
  }
  /* TOC gets its own page */
  .toc {
    page-break-after: always;
  }
  /* Avoid row splits mid-row in tables */
  .data-table tr {
    page-break-inside: avoid;
  }
  /* Avoid splitting contact cards and position cards */
  .content-card,
  .contact-card {
    page-break-inside: avoid;
  }
  /* Hide the fixed footer in print (duplicate of @media print rule already present) */
  .document-footer {
    display: none;
  }
}
```

**XSS hardening preservation:** The round-fkn security pass flagged that CSS `@page` style-block values that interpolate user data are XSS sinks. In the current code, the inline `<style>` block includes dynamic values like `${isRTL ? 'right' : 'left'}` and `${direction}` and `${fontFamily}` — these come from config, not user DB data, so are safe. Do NOT introduce any user-DB-derived values into the stylesheet. Ensure `escapeHtml` is not removed from any user-data insertion points. [VERIFIED: code review of L595–902]

---

### Anti-Patterns to Avoid

- **Querying `commitments` table:** Always use `aa_commitments`. The legacy `commitments` table is empty.
- **Querying `calendar_events`:** Use `calendar_entries`. `calendar_events` is a separate empty forum model.
- **Using `positions.dossier_ids` or `positions.classification`:** These columns do not exist.
- **Using `mous.title_en` or `mous.status`:** Use `mous.title` and `mous.lifecycle_state`.
- **Using `documents.entity_type`/`entity_id`:** Use `related_entities` jsonb or avoid direct documents query.
- **Calling `window.open()` after `await`:** Popup blockers will reject it. Always open synchronously first.
- **Static `corsHeaders` with wildcard:** Use `getCorsHeaders(req)` for deployed functions per CLAUDE.md memory.

---

## Don't Hand-Roll

| Problem                   | Don't Build                   | Use Instead                                                           | Why                                  |
| ------------------------- | ----------------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| Blob URL for new-tab HTML | Custom base64 decode + anchor | Native `URL.createObjectURL(new Blob([html], { type: 'text/html' }))` | Standard browser API; handles memory |
| Print layout              | Custom pagination logic       | CSS `page-break-before: always` + `@media print`                      | Already in the stylesheet; extend it |
| Failed-section tracking   | Complex retry logic           | Per-section try/catch + `sectionErrors` map                           | Simpler, no retry needed for export  |

---

## Common Pitfalls

### Pitfall 1: `window.open()` Called After Await

**What goes wrong:** The browser blocks the popup because it's not in a synchronous user-gesture event.
**Why it happens:** The export fetch is async; `window.open()` called after `await exportDossier(...)` is no longer in the synchronous call stack of the click event.
**How to avoid:** Open `window.open('', '_blank')` synchronously in the click handler before any await. If `window.open` returns `null`, fall back to blob download.
**Warning signs:** Works in development (popup blockers often disabled or lenient) but fails in Chrome/Firefox with strict popup settings.

### Pitfall 2: `dossier-export-pack` Uses Deprecated `serve()` from Deno.land/std

**What goes wrong:** The function uses `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'` — this is the old pattern. New Supabase runtime prefers `Deno.serve()`.
**Why it happens:** Function was written before the Deno runtime update.
**How to avoid:** Replace `import { serve }` with native `Deno.serve`. Already done in other functions (e.g., `dossier-activity-timeline`).
**Warning signs:** Deploy warnings in Supabase CLI output.

### Pitfall 3: Static CORS Wildcard in Deployed Function

**What goes wrong:** Deployed function uses static `corsHeaders` with `'Access-Control-Allow-Origin': '*'`. In production, the `ALLOWED_ORIGINS` secret controls this but only if `getCorsHeaders(req)` is used.
**Why it happens:** The old `corsHeaders` import is still in the file.
**How to avoid:** Use `getCorsHeaders(req)` for all non-OPTIONS responses.

### Pitfall 4: `content_base64` Decode Loop in Hook

**What goes wrong:** Current `useDossierExport` hook has an `atob` + byte-array decode loop for base64 content. After D-06, the edge returns HTML text directly. If the hook still tries to parse `response.content_base64`, it will silently show nothing (the field is undefined).
**How to avoid:** Rewrite the hook to read `response.text()` not `response.json()`, and use the HTML string directly for the new-tab write.

### Pitfall 5: Commitments Stats Count Will Be 0

**What goes wrong:** If the `work_item_dossiers` intermediary step is kept for commitments count in `stats{}`, but the `commitments` table query returns 0 rows, `stats.commitments_count` is 0 on the cover page even when `aa_commitments` has records.
**How to avoid:** After switching to direct `aa_commitments` query, use `aaCommitmentsResult.data?.length || 0` for the count.

### Pitfall 6: `dossier-export-pack` Stdlibs Version Mismatch

**What goes wrong:** The import uses `deno.land/std@0.168.0` which is old. Supabase edge runtime pins a recent Deno version; the std library version should match or be omitted (use `Deno.serve` which is built-in).
**How to avoid:** Remove the `serve` import entirely when switching to `Deno.serve`.

---

## Code Examples

### New-Tab Open Pattern (D-07)

```typescript
// Source: [ASSUMED — standard browser popup-blocker safe pattern]
// In ExportDossierDialog click handler:
const handleExport = async () => {
  // MUST be synchronous before any await
  const newTab = window.open('', '_blank')

  try {
    const htmlContent = await exportDossier(dossierId, config)

    if (newTab) {
      newTab.document.open()
      newTab.document.write(htmlContent)
      newTab.document.close()
    } else {
      // Fallback for blocked popups
      const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `briefing-pack-${dossierName}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
  } catch (err) {
    newTab?.close()
    // show error state
  }
}
```

### Edge Function Direct HTML Response (D-06)

```typescript
// Source: [ASSUMED — standard Deno Response pattern]
// After generating html string:
const fileName = `briefing-pack-${dossierSlug}-${timestamp}.html`
const failedSectionsHeader = Object.keys(sectionErrors).join(',')

return new Response(html, {
  status: 200,
  headers: {
    ...getCorsHeaders(req),
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Disposition': `inline; filename="${fileName}"`,
    ...(failedSectionsHeader ? { 'X-Failed-Sections': failedSectionsHeader } : {}),
  },
})
```

### MoU Query Fix (signatory pattern)

```typescript
// Source: [VERIFIED — dossier-overview.service.ts L491-505 uses this exact pattern]
const [mous1Result, mous2Result] = await Promise.all([
  supabase
    .from('mous')
    .select('id, title, title_ar, lifecycle_state, created_at')
    .eq('signatory_1_dossier_id', dossierId)
    .is('is_deleted', false)
    .limit(10),
  supabase
    .from('mous')
    .select('id, title, title_ar, lifecycle_state, created_at')
    .eq('signatory_2_dossier_id', dossierId)
    .is('is_deleted', false)
    .limit(10),
])
// Deduplicate:
const mouIds = new Set<string>()
const mous: any[] = []
;[...(mous1Result.data || []), ...(mous2Result.data || [])].forEach((m) => {
  if (!mouIds.has(m.id)) {
    mouIds.add(m.id)
    mous.push(m)
  }
})
```

### Position Query Fix (junction table)

```typescript
// Source: [VERIFIED — dossier-overview.service.ts L466-473 uses position_dossier_links]
const posLinksResult = await supabase
  .from('position_dossier_links')
  .select('position:positions(id, title_en, title_ar, status, created_at)')
  .eq('dossier_id', dossierId)
  .limit(20)

const positions = ((posLinksResult.data || []) as any[])
  .map((link) => {
    const pos = link.position
    return Array.isArray(pos) ? pos[0] : pos
  })
  .filter(Boolean)
```

### aa_commitments Direct Query Fix

```typescript
// Source: [VERIFIED — live schema confirmed dossier_id column on aa_commitments]
const commitmentsResult = await supabase
  .from('aa_commitments')
  .select('id, title, title_ar, status, priority, due_date, owner_user_id, created_at')
  .eq('dossier_id', dossierId)
  .is('is_deleted', false)
  .order('created_at', { ascending: false })
  .limit(20)
```

---

## Deploy Flow

### Command

```bash
supabase functions deploy dossier-export-pack --project-ref zkrcjzdemdmwhearhfgg
```

The Supabase CLI (v2.102.0) is installed at `/opt/homebrew/bin/supabase`. [VERIFIED: `command -v supabase` confirmed]

### Pre-deploy checklist

- [ ] All 6 stale reads fixed (see audit table above)
- [ ] Storage upload block removed
- [ ] `serve()` replaced with `Deno.serve()`
- [ ] `corsHeaders` static → `getCorsHeaders(req)` for non-OPTIONS responses
- [ ] `@supabase/supabase-js@2.39.0` → `@2.39.3`
- [ ] Response returns `text/html` body, not JSON
- [ ] `X-Failed-Sections` header logic in place

### Verification (7 dossier types)

After deploy, for each type, POST to:

```
POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/dossier-export-pack
```

with a valid Bearer token and a `dossier_id` from each type (country, organization, forum, engagement, topic, working_group, person/elected_official). Expected: HTTP 200 with `Content-Type: text/html`. A 404 means the deploy didn't complete. A 500 means a remaining stale read.

The 7 staging dossier IDs must be found from the staging DB before the verification wave runs. The planner should include a task to query staging for one dossier ID of each type.

---

## Frontend Changes Summary

### `frontend/src/types/dossier-export.types.ts`

- `DossierExportFormat = 'pdf' | 'docx'` → `DossierExportFormat = 'html'` (or remove type, use literal `'html'`)
- `ExportLanguage = 'en' | 'ar' | 'both'` → `ExportLanguage = 'en' | 'ar'`
- `DossierExportStatus`: remove `'uploading'` variant
- `DossierExportResponse`: remove `download_url`, `content_base64`, `expires_at`; add `failed_sections?: string[]`
- `DEFAULT_EXPORT_CONFIG.format`: `'pdf'` → `'html'`
- `DEFAULT_EXPORT_CONFIG.language`: `'both'` → default to user's current locale at hook/dialog level

### `frontend/src/components/dossier/ExportDossierDialog.tsx`

- Remove `format` state and the `<RadioGroup>` format picker (PDF / Word cards)
- Remove `language === 'both'` option from language `<RadioGroup>`
- Default language to current `i18n.language` (via `useTranslation`)
- Add a one-liner info note below the language picker (D-03): "This export produces a print-ready HTML briefing pack. To save as PDF, use your browser's print dialog."
- Success state: show any `failed_sections` as a warning list if non-empty
- Remove the `response.download_url` check in `handleExport`
- Move `window.open('', '_blank')` call to before the await (popup-blocker safe)

### `frontend/src/services/dossier-export.service.ts`

- `exportDossier`: change `response.json()` → `response.text()` (returns HTML string)
- Return type changes to `string` (the HTML)
- Remove `downloadExportedFile` function entirely (dead after D-06/D-07)
- Remove `dossierExportKeys.history` key (dead — export history deferred)
- Failed-sections: read from `response.headers.get('X-Failed-Sections')`

### `frontend/src/hooks/useDossierExport.ts`

- Remove `downloadExportedFile` import
- Remove the `if (response.download_url)` / `else if (response.content_base64)` download block
- Add new-tab open logic (blob URL or window.write pattern)
- Remove `'uploading'` progress stage message
- Update `progress` messages to match new 3-stage flow: preparing → generating → complete

### `frontend/src/i18n/en/dossier-export.json` and `ar/dossier-export.json`

New keys needed (add to both):

```json
{
  "format": {
    "html": "HTML Document",
    "html_info": "Exports as a print-ready HTML briefing pack. To save as PDF, use your browser's print dialog."
  },
  "sections": {
    "failed": "This section could not be generated"
  },
  "warning": {
    "failed_sections": "Some sections could not be generated: {{sections}}"
  }
}
```

Remove from both files: `format.pdf`, `format.docx`, `language.both`, `progress.uploading`.

---

## State of the Art

| Old Approach             | Current Approach                            | When Changed                              | Impact                       |
| ------------------------ | ------------------------------------------- | ----------------------------------------- | ---------------------------- |
| `serve()` from Deno std  | `Deno.serve()` built-in                     | Deno 1.35+ / Supabase Edge Runtime v1.36+ | Simpler; std lib dep removed |
| Static CORS `*` wildcard | `getCorsHeaders(req)` with origin allowlist | Round fkn security pass                   | Blocks cross-origin abuse    |
| `supabase-js@2.39.0`     | `supabase-js@2.39.3`                        | Already in other edge functions           | Minor fixes                  |
| `commitments` table      | `aa_commitments` table                      | Phase 34/35 data model                    | Legacy table is empty        |
| `positions.dossier_ids`  | `position_dossier_links` junction           | Phase 45 positions attach                 | New canonical pattern        |

---

## Assumptions Log

| #   | Claim                                                                                                      | Section                         | Risk if Wrong                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A1  | `window.open('', '_blank')` synchronously in click handler is popup-blocker safe in Chrome/Firefox/Safari  | Pattern 2: new-tab open         | If wrong, need alternative (e.g., service worker, anchor with `target=_blank`, or user gesture detection) |
| A2  | Edge function can return `text/html` body directly (not JSON) and CORS headers will pass through correctly | Pattern 1: direct HTML response | If CORS strips on text/html, must wrap in JSON envelope or use different Content-Type                     |
| A3  | `X-Failed-Sections` custom header survives CORS and is readable by the frontend fetch                      | Pattern 3 + D-08                | If CORS preflight strips it, must use JSON envelope instead                                               |
| A4  | `dossier_relationships` does not have a `deleted_at` column (only `status`)                                | Section 1 relationships         | If `deleted_at` does exist, the fix is wrong and current code is fine                                     |
| A5  | `related_entities` jsonb in `documents` table can be queried with `.contains()` for a dossier ID           | Section 8 documents             | If the jsonb shape doesn't have a top-level dossier_id key, the query would return 0 results regardless   |
| A6  | Supabase CLI `supabase functions deploy` against `zkrcjzdemdmwhearhfgg` works with current local setup     | Deploy flow                     | If the local Supabase login or project link is stale, need `supabase login` first                         |

---

## Open Questions

1. **`dossier_relationships.deleted_at` existence**
   - What we know: The verified live schema from the orchestrator lists `status` on `dossier_relationships` but does not explicitly confirm absence of `deleted_at`
   - What's unclear: Whether the filter `.is('deleted_at', null)` currently 500s or silently works (if the column exists as part of a soft-delete pattern not listed)
   - Recommendation: The planner should include a task to verify: `SELECT column_name FROM information_schema.columns WHERE table_name='dossier_relationships'` before fixing. The safe action either way: use `.eq('status', 'active')` which works regardless.

2. **`documents.related_entities` jsonb shape**
   - What we know: The column exists and is `Json | null` in `database.types.ts`
   - What's unclear: Whether it contains `{ dossier_id: "...", ... }` at the top level, or a nested structure like `{ entities: [{ type: "dossier", id: "..." }] }`
   - Recommendation: For this phase, default to returning `[]` for documents (Option B from Section 8 above). Plan a follow-up investigation of the jsonb shape.

3. **`X-Failed-Sections` header CORS exposure**
   - What we know: The `_shared/cors.ts` exposes `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`
   - What's unclear: Custom response headers like `X-Failed-Sections` may not be readable unless `Access-Control-Expose-Headers` is set
   - Recommendation: Add `'Access-Control-Expose-Headers': 'X-Failed-Sections'` to the edge response headers. Or use JSON envelope with the HTML as a field.

4. **Supabase CLI authentication for deploy**
   - What we know: `supabase` CLI v2.102.0 is installed
   - What's unclear: Whether the local CLI session is authenticated against `zkrcjzdemdmwhearhfgg`
   - Recommendation: The planner should include a verification task: `supabase projects list` to confirm auth state before the deploy task.

---

## Environment Availability

| Dependency                             | Required By               | Available                       | Version                          | Fallback                                              |
| -------------------------------------- | ------------------------- | ------------------------------- | -------------------------------- | ----------------------------------------------------- |
| Supabase CLI                           | Edge function deploy      | ✓                               | 2.102.0                          | —                                                     |
| Node.js / pnpm                         | Frontend build            | ✓                               | Node.js 22.22.0+ (per CLAUDE.md) | —                                                     |
| Staging project `zkrcjzdemdmwhearhfgg` | Deploy target             | ✓ (per orchestrator live check) | PostgreSQL 17.6.1.008            | —                                                     |
| `ALLOWED_ORIGINS` Supabase secret      | CORS for deployed edge fn | Unknown — must be set           | —                                | Edge returns localhost-only CORS (breaks staging app) |

**Missing dependencies with no fallback:**

- `ALLOWED_ORIGINS` Supabase secret must be set on the staging project for the deployed function to accept requests from the staging app origin. Per project memory: "Edge Function CORS = ALLOWED_ORIGINS Supabase secret, not the repo — unset secret silently falls back to localhost-only." Verify before smoke testing.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Framework          | Vitest (unit) + Playwright (E2E)                     |
| Config file        | `frontend/vitest.config.ts` / `playwright.config.ts` |
| Quick run command  | `pnpm test --filter frontend`                        |
| Full suite command | `pnpm test`                                          |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                       | Test Type            | Automated Command                                                                   | File Exists?         |
| --------- | -------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------- | -------------------- |
| EXPORT-01 | Dialog shows only HTML format, no PDF/Word radio               | unit (component)     | `pnpm test --filter frontend -- ExportDossierDialog`                                | ❌ Wave 0            |
| EXPORT-01 | Dialog shows only EN/AR language, no Bilingual                 | unit (component)     | `pnpm test --filter frontend -- ExportDossierDialog`                                | ❌ Wave 0            |
| EXPORT-02 | Edge function POST returns 200 text/html (no 404, no 500)      | smoke / manual       | `curl -X POST .../dossier-export-pack -H "Authorization: Bearer $TOKEN" -d '{...}'` | Manual staging check |
| EXPORT-02 | Positions section uses position_dossier_links (no dossier_ids) | unit (edge fn logic) | Deno test if available                                                              | ❌ Wave 0            |
| EXPORT-02 | Commitments section reads aa_commitments not commitments       | unit (edge fn logic) | Deno test if available                                                              | ❌ Wave 0            |

### Sampling Rate

- **Per task commit:** `pnpm typecheck --filter frontend`
- **Per wave merge:** `pnpm test --filter frontend`
- **Phase gate:** Full suite green + manual staging smoke verification before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx` — covers EXPORT-01 (format picker removed, language options correct)
- [ ] Deno unit tests for edge function section renderers are aspirational; the primary verification is the staging smoke check

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                        |
| --------------------- | ------- | ------------------------------------------------------- |
| V2 Authentication     | yes     | `supabase.auth.getUser(token)` — already correct        |
| V3 Session Management | no      | Stateless edge function                                 |
| V4 Access Control     | partial | Edge function reads only dossiers the user's RLS allows |
| V5 Input Validation   | yes     | `dossier_id` must be validated as UUID before DB query  |
| V6 Cryptography       | no      | No encryption in this phase                             |

### Known Threat Patterns

| Pattern                                      | STRIDE                 | Standard Mitigation                                                                                                                         |
| -------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS via user data in inline `<style>` block  | Tampering              | `escapeHtml` already applied; do NOT interpolate DB-sourced values into CSS properties — confirmed safe (config-only values in style block) |
| XSS via unsanitized HTML in section content  | Tampering              | `escapeHtml` wrapper already applied to all user-data insertions                                                                            |
| SSRF via malicious `dossier_id`              | Elevation              | Edge function only queries Supabase via the RLS-enforced client; no external HTTP calls                                                     |
| Unauthorized access to other users' dossiers | Information Disclosure | RLS on the Supabase client (user token) restricts rows; no service-role-key data access in the new flow (D-06 removes the service client)   |

**Security note on D-06 (removing service-role-key client):** The storage upload path required a `SUPABASE_SERVICE_ROLE_KEY` service client. Removing it reduces the attack surface — the new flow uses only the user-scoped anon-key client. This is a security improvement. [VERIFIED: code review — `SUPABASE_SERVICE_ROLE_KEY` is only used for storage, which is removed]

---

## Sources

### Primary (HIGH confidence)

- Live schema verified by orchestrator Supabase MCP query on 2026-06-11 — all column lists in the D-05 audit table
- `supabase/functions/dossier-export-pack/index.ts` — direct code read (full 1281 lines)
- `frontend/src/services/dossier-overview.service.ts` L464-511 — canonical MoU and positions query patterns (fetchDocuments)
- `supabase/functions/_shared/cors.ts` — CORS helper pattern
- `supabase/functions/dossier-activity-timeline/index.ts` — reference edge function for `Deno.serve`, `@2.39.3`, auth pattern
- `supabase/migrations/20250129007_create_audit_logs_table.sql` — `audit_logs` schema confirmation

### Secondary (MEDIUM confidence)

- `.planning/phases/62-export-pack-contract-deploy/62-CONTEXT.md` — locked decisions D-01..D-08
- `frontend/src/components/dossier/ExportDossierDialog.tsx` — current dialog state
- `frontend/src/hooks/useDossierExport.ts` — current hook flow
- `frontend/src/services/dossier-export.service.ts` — current service
- `frontend/src/types/dossier-export.types.ts` — current type contracts
- `CLAUDE.md` project memory entries (MEMORY.md) — `aa_commitments`, `position_dossier_links`, `calendar_entries`, edge auth pattern, CORS secret

### Tertiary (LOW confidence / [ASSUMED])

- Popup-blocker-safe `window.open` pattern (A1) — standard browser behavior, not verified in this codebase
- Direct `text/html` edge response CORS pass-through (A2) — standard Deno, not tested on Supabase
- `X-Failed-Sections` header readability (A3) — requires `Access-Control-Expose-Headers`

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new packages; existing stack confirmed
- Stale-read audit: HIGH — column-level verification against live schema from orchestrator
- Architecture: HIGH — patterns verified against working edge functions in the codebase
- New-tab popup pattern: MEDIUM — browser standard, not codebase-verified
- Deploy command: HIGH — CLI v2.102.0 confirmed installed, project ref known

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (30 days — stable schema; no fast-moving deps)
