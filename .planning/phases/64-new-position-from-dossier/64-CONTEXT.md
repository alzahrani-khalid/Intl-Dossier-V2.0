# Phase 64: New Position from Dossier - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A user choosing "New Position" from any dossier (via the Add-to-Dossier menu) gets a working quick-create dialog whose submission satisfies `positions-create` validation — real position-type picker, bilingual titles, audience-group selection — and after create, a `position_dossier_links` row exists for the originating dossier (DB-verified on staging) and the new position appears on the dossier's Positions tab without manual refresh (live-verified). Covers POSNEW-01 and POSNEW-02, plus rewiring the Positions tab's mislabeled "Create position" button to this dialog. Does NOT cover: a dedicated position-editor page, the engagement Positions tab (Phase 65), or changes to the positions approval workflow.

</domain>

<decisions>
## Implementation Decisions

### Form scope & required fields (POSNEW-01)

- **D-01:** **Quick-create dialog, not a page.** The existing `PositionDialog` modal in `AddToDossierDialogs.tsx` is fixed in place: add a position-type picker, an Arabic title field, and audience-group selection. It stays consistent in weight with the sibling commitment/event dialogs. No dedicated create page this phase.
- **D-02:** **Optional bilingual content.** Two optional textareas (`content_en`, `content_ar`) replace the current EN-only one. Neither blocks submission — but the AR-required/AR-impossible inconsistency is removed.
- **D-03:** **Audience groups as multi-select checkboxes.** All groups visible at a glance (staging has 4: All Staff, External Relations, Management, Policy Officers). `positions-create` requires ≥1 selected.
- **D-04:** **Client-side inline validation.** Required fields (type, title_en, title_ar, ≥1 audience group) validated before submit with localized inline messages; submit disabled until valid. Follows the project's React Hook Form + Zod convention. Edge-function bilingual errors still surface as a toast fallback.

### Defaults & bilingual titles

- **D-05:** **Position type defaults to Standard Position.** Picker preselects Standard; user switches to Critical (or future types) deliberately. Resolve the default robustly (by name match with fallback to first type), not by hard-coded UUID.
- **D-06:** **Audience defaults to All Staff pre-checked.** User narrows for sensitive positions. Same robust-resolution caveat as D-05.
- **D-07:** **AI-assisted translation, draft-fill, both directions.** A translate button on each title field (EN→AR and AR→EN) fills the counterpart field as an _editable draft_ via the existing `translate-content` edge function. Both title fields remain required and user-editable; if translation fails or is unavailable, the user types manually — **submission must never depend on the AI**.
- **D-08:** **Translate assist covers content too.** The same draft-fill pattern applies to the optional content field pair (`translate-content` already supports `content_type: 'content'` and `'title'`).

### Dossier link semantics & failure honesty (POSNEW-02)

- **D-09:** **Fixed `link_type: 'applies_to'`, written silently.** A position created FROM a dossier applies to it. No link-type field in the dialog — the link is an implementation detail of "create from here". (Live DB CHECK allows `applies_to / related_to / endorsed_by / opposed_by`.)
- **D-10:** **Two-step from the client.** Dialog calls `positions-create`, then the existing `positions-dossiers-create` attach edge (v11, battle-tested rounds 12/13) to write the link. Do not extend `positions-create` server-side.
- **D-11:** **Honest partial-success warning.** If the position creates but the link write fails: a warning toast states the position was created but not linked to this dossier, with a retry-link action or a pointer to attach manually. Failure is never rendered as clean success (Phase 62 honesty precedent).

### Post-create flow & entry points

- **D-12:** **Stay on the dossier; toast with action.** On success the dialog closes, the Positions tab data refreshes without manual reload (the POSNEW-02 live criterion), and the success toast carries an "Open position" action for users who want to continue drafting. No forced navigation.
- **D-13:** **Rewire the Positions tab "Create position" button.** It currently opens the attach-existing dialog (mislabeled). This phase points it at the fixed New Position dialog; attach-existing remains available as a separate/secondary action. The Add-to-Dossier menu already shows the Position action for all dossier types (static `ACTION_GROUPS`) — no per-type gating needed.

### Claude's Discretion

- Exact query keys to invalidate so the Positions tab refreshes (the tab reads `useDossierPositionLinks(dossierId, …)`; `useCreatePosition` currently only invalidates `['positions', 'list']` and `useCreatePositionDossierLink` invalidates by `positionId` — researcher must map the dossier-scoped key).
- Translate-button UX details: loading state, error toast copy, debounce/disable while in flight, confidence display (the edge returns a confidence score — showing it is optional).
- How the attach-existing action is surfaced on the Positions tab after D-13 (secondary button vs menu item).
- Retry mechanics for the D-11 partial-failure path (inline retry vs deep-link to the attach dialog).
- Zod schema shape and how validation errors localize (EN+AR).
- Whether the dialog needs `thematic_category` exposed (edge accepts it optionally — default: omit).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase source & requirements

- `.planning/dossier-workflow-backlog-phases-2026-06-11.md` §Phase P3 — originating backlog item (R6-03): evidence, scope, acceptance, touched files
- `.planning/REQUIREMENTS.md` §New Position from Dossier — POSNEW-01, POSNEW-02 exact wording

### Code under change

- `frontend/src/components/dossier/AddToDossierDialogs.tsx` — `PositionDialog` (~L604-695): the broken form posting `position_type_id = dossierContext.dossier_id`, `title_ar: ''`, `audience_groups: []`, no link write
- `frontend/src/components/dossier/AddToDossierMenu.tsx` — entry point; static `ACTION_GROUPS` (~L167-183) already exposes the position action for all dossier types
- `frontend/src/components/positions/DossierPositionsTab.tsx` — the tab that must refresh live (reads `useDossierPositionLinks(dossierId, …)`); its `handleCreatePosition` (~L51) currently opens `AttachPositionDialog` (D-13 rewire target)
- `frontend/src/domains/positions/hooks/useCreatePosition.ts` — create mutation (invalidates only `['positions', 'list']` today)
- `frontend/src/domains/positions/hooks/useCreatePositionDossierLink.ts` — attach mutation (invalidates `['position-dossier-links', positionId]` — positionId-scoped, not dossier-scoped)
- `frontend/src/domains/positions/repositories/positions.repository.ts` — repository layer the hooks delegate to

### Edge functions (verify deploy status on staging)

- `supabase/functions/positions-create/index.ts` — validation contract: valid `position_type_id` in `position_types`, both titles non-empty, ≥1 `audience_groups`; creates draft + `position_audience_groups` + `position_versions`. **Researcher: verify it is deployed on staging** (project memory: sibling functions have shipped undeployed before)
- `supabase/functions/positions-dossiers-create/index.ts` — the attach edge, v11, fixed in rounds 12/13 (D-10 reuses it; do not modify)
- `supabase/functions/translate-content/index.ts` — existing EN↔AR AI translation edge (supports `title`/`content` content types, returns confidence + metadata). **Zero frontend callers today; researcher must verify deploy status and auth pattern** (`@2` + `getUser(token)` per project memory)

### Live schema facts (verified 2026-06-12 on staging zkrcjzdemdmwhearhfgg)

- `position_types`: 2 rows — Standard Position / Critical Position (bilingual names)
- `audience_groups`: 4 rows — All Staff, External Relations, Management, Policy Officers
- `position_dossier_links.link_type` CHECK: `applies_to / related_to / endorsed_by / opposed_by` (matches `PositionDossierLinkType` in `frontend/src/domains/positions/types/index.ts:112`)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- The attach chain (`useCreatePositionDossierLink` → `positions-dossiers-create` v11) is fully fixed and live — D-10's step 2 is a straight reuse.
- `translate-content` edge is purpose-built for D-07/D-08 ("draft translations for user review and correction") — frontend wiring is the only new work.
- Sibling dialogs in `AddToDossierDialogs.tsx` (commitment, event) establish the dialog's layout/validation/toast patterns; the event dialog (~L743-752) shows the dossier-scoped invalidation precedent (R12-04 comment) to follow for D-12.
- `AttachPositionDialog` + `PositionDossierLinker` show existing position-selection UI patterns if needed for the D-13 secondary action.

### Established Patterns

- React Hook Form + Zod for form validation (project convention; D-04).
- Edge auth pattern: `@2` + `getUser(token)` — bare `getUser()` 401s on valid tokens (project memory; relevant when wiring `translate-content`).
- i18n: namespaces static-bundled in `frontend/src/i18n/index.ts`; use colon-form `t('positions:…')` (dot-form leaks raw keys); the dialog currently uses the `dossier` namespace — new keys need EN+AR in both bundles.
- Honest-UI precedent from Phase 62: no advertised-but-broken options, failure never rendered as success (D-11).
- Live verification on staging is the milestone norm (Phases 62/63 precedent): DB-verify the link row, live-verify the tab refresh.

### Integration Points

- Entry 1: `AddToDossierMenu` → `PositionDialog` (the phase's primary target).
- Entry 2: `DossierPositionsTab` "Create position" button → rewired to the same dialog (D-13).
- Data: dialog → `positions-create` edge → then `positions-dossiers-create` edge → `position_dossier_links` → read back by `useDossierPositionLinks(dossierId)` on the tab.
- AI: title/content translate buttons → `translate-content` edge (draft-fill only, never blocking).

</code_context>

<specifics>
## Specific Ideas

- The translate assist must behave as a _drafting aid_: it fills the counterpart field with editable text and the user remains the author of record — submission never waits on or requires the AI (D-07).
- The partial-failure toast should distinguish "position created, link failed" from a total failure — these are different states with different recoveries (D-11, echoing Phase 62's failure-vs-empty distinction).

</specifics>

<deferred>
## Deferred Ideas

- **Dedicated position create/editor page** — rejected for this phase (D-01); the quick-create dialog is the contract. Revisit if positions need richer authoring (rationale, alignment notes, thematic category).
- **Auto-translate on blur** — considered and rejected (D-07); aggressive AI calls, surprising UX. The explicit button pattern could be revisited app-wide later.
- **`thematic_category` and rationale/alignment fields in the dialog** — edge accepts them; omitted to keep quick-create quick. Belongs with the editor-page idea.

</deferred>

---

_Phase: 64-new-position-from-dossier_
_Context gathered: 2026-06-12_
