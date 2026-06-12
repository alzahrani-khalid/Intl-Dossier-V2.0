# Phase 64: New Position from Dossier - Research

**Researched:** 2026-06-12
**Domain:** React 19 dialog form (RHF+Zod) + Supabase edge functions + TanStack Query cache orchestration + staging RLS
**Confidence:** HIGH (all critical claims verified live on staging or traced in code this session)

## Summary

The phase replaces the broken `PositionDialog` payload (`position_type_id = dossier_id`, blank `title_ar`, empty `audience_groups`, no link write) with a valid quick-create flow. All three edge functions are **deployed and reachable on staging** (verified live via authenticated probes + `supabase functions list`): `positions-create` v8, `positions-dossiers-create` v11, `translate-content` v2. The lookup tables for the two new pickers (`position_types`, `audience_groups`) are directly readable via the supabase client with a user token (verified live; bilingual names returned).

**One P0 blocker was discovered that no amount of frontend work can route around:** the live `positions` table **denies INSERT under RLS even for an admin user with a valid payload** (verified live: PostgREST 403/42501 and edge 500 "new row violates row-level security policy for table positions"). The repo migration `20250101011_rls_positions.sql` defines a permissive `drafters_insert_positions` policy (`auth.uid() = author_id AND status = 'draft'`) that this insert satisfies — so the live policy set has drifted from migrations (same class of drift as the persons org-isolation incident). `position_audience_groups` and `position_versions` INSERTs (steps 2–3 of the same edge flow) were verified to **succeed** with a user token, so the migration scope is exactly one policy on one table. The plan MUST open with a diagnose-and-fix migration task (via Supabase MCP) or every other task in the phase is unverifiable.

Second consequential finding: the **deployed `translate-content` differs from the repo source**. With the AI backend down (AnythingLLM is currently unreachable on staging), the deployed v2 returns **HTTP 503** with a structured fallback body (`error.code: 'AI_UNAVAILABLE'`, `translated_text: '[ترجمة مطلوبة] …'`, `confidence: 0.1`); the repo source would return 200. Since `api-client`'s `handleResponse` throws on any non-2xx, the translate buttons must treat any thrown error as "translation unavailable" — which is exactly D-07's non-blocking requirement. Do not redeploy `translate-content` from the repo source in this phase.

**Primary recommendation:** Plan three layers in order — (1) staging RLS migration restoring the `positions` INSERT policy, (2) rebuilt dialog (RHF+Zod, type picker, bilingual titles + translate assist, audience checkboxes) extracted into its own component consumed by both entry points, (3) two-step submit (`positions-create` → `positions-dossiers-create` with explicit `link_type: 'applies_to'`) with dossier-scoped invalidation of `['dossier-position-links', dossierId]` + `dossierOverviewKeys.detail(dossierId)`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Form scope & required fields (POSNEW-01)

- **D-01:** **Quick-create dialog, not a page.** The existing `PositionDialog` modal in `AddToDossierDialogs.tsx` is fixed in place: add a position-type picker, an Arabic title field, and audience-group selection. It stays consistent in weight with the sibling commitment/event dialogs. No dedicated create page this phase.
- **D-02:** **Optional bilingual content.** Two optional textareas (`content_en`, `content_ar`) replace the current EN-only one. Neither blocks submission — but the AR-required/AR-impossible inconsistency is removed.
- **D-03:** **Audience groups as multi-select checkboxes.** All groups visible at a glance (staging has 4: All Staff, External Relations, Management, Policy Officers). `positions-create` requires ≥1 selected.
- **D-04:** **Client-side inline validation.** Required fields (type, title_en, title_ar, ≥1 audience group) validated before submit with localized inline messages; submit disabled until valid. Follows the project's React Hook Form + Zod convention. Edge-function bilingual errors still surface as a toast fallback.

#### Defaults & bilingual titles

- **D-05:** **Position type defaults to Standard Position.** Picker preselects Standard; user switches to Critical (or future types) deliberately. Resolve the default robustly (by name match with fallback to first type), not by hard-coded UUID.
- **D-06:** **Audience defaults to All Staff pre-checked.** User narrows for sensitive positions. Same robust-resolution caveat as D-05.
- **D-07:** **AI-assisted translation, draft-fill, both directions.** A translate button on each title field (EN→AR and AR→EN) fills the counterpart field as an _editable draft_ via the existing `translate-content` edge function. Both title fields remain required and user-editable; if translation fails or is unavailable, the user types manually — **submission must never depend on the AI**.
- **D-08:** **Translate assist covers content too.** The same draft-fill pattern applies to the optional content field pair (`translate-content` already supports `content_type: 'content'` and `'title'`).

#### Dossier link semantics & failure honesty (POSNEW-02)

- **D-09:** **Fixed `link_type: 'applies_to'`, written silently.** A position created FROM a dossier applies to it. No link-type field in the dialog — the link is an implementation detail of "create from here". (Live DB CHECK allows `applies_to / related_to / endorsed_by / opposed_by`.)
- **D-10:** **Two-step from the client.** Dialog calls `positions-create`, then the existing `positions-dossiers-create` attach edge (v11, battle-tested rounds 12/13) to write the link. Do not extend `positions-create` server-side.
- **D-11:** **Honest partial-success warning.** If the position creates but the link write fails: a warning toast states the position was created but not linked to this dossier, with a retry-link action or a pointer to attach manually. Failure is never rendered as clean success (Phase 62 honesty precedent).

#### Post-create flow & entry points

- **D-12:** **Stay on the dossier; toast with action.** On success the dialog closes, the Positions tab data refreshes without manual reload (the POSNEW-02 live criterion), and the success toast carries an "Open position" action for users who want to continue drafting. No forced navigation.
- **D-13:** **Rewire the Positions tab "Create position" button.** It currently opens the attach-existing dialog (mislabeled). This phase points it at the fixed New Position dialog; attach-existing remains available as a separate/secondary action. The Add-to-Dossier menu already shows the Position action for all dossier types (static `ACTION_GROUPS`) — no per-type gating needed.

### Claude's Discretion

- Exact query keys to invalidate so the Positions tab refreshes (the tab reads `useDossierPositionLinks(dossierId, …)`; `useCreatePosition` currently only invalidates `['positions', 'list']` and `useCreatePositionDossierLink` invalidates by `positionId` — researcher must map the dossier-scoped key).
- Translate-button UX details: loading state, error toast copy, debounce/disable while in flight, confidence display (the edge returns a confidence score — showing it is optional).
- How the attach-existing action is surfaced on the Positions tab after D-13 (secondary button vs menu item).
- Retry mechanics for the D-11 partial-failure path (inline retry vs deep-link to the attach dialog).
- Zod schema shape and how validation errors localize (EN+AR).
- Whether the dialog needs `thematic_category` exposed (edge accepts it optionally — default: omit).

### Deferred Ideas (OUT OF SCOPE)

- **Dedicated position create/editor page** — rejected for this phase (D-01); the quick-create dialog is the contract. Revisit if positions need richer authoring (rationale, alignment notes, thematic category).
- **Auto-translate on blur** — considered and rejected (D-07); aggressive AI calls, surprising UX. The explicit button pattern could be revisited app-wide later.
- **`thematic_category` and rationale/alignment fields in the dialog** — edge accepts them; omitted to keep quick-create quick. Belongs with the editor-page idea.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                                                                                                                                         | Research Support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POSNEW-01 | User creating a position from a dossier gets a real position-type picker, bilingual title fields, and audience-group selection that satisfy `positions-create` (no more `position_type_id = dossier_id`, blank `title_ar`, empty `audience_groups`) | Edge validation contract verified live (400 with bilingual error on each missing field). Lookup tables readable with user token (2 position types, 4 audience groups, bilingual names). RHF+Zod convention traced (`TaskEditDialog` precedent — i18n keys as Zod messages). **Blocked until the live `positions` INSERT RLS policy is restored** (verified denial — see Pitfall 1).                                                                                                               |
| POSNEW-02 | After create, the `position_dossier_links` row is written and the new position appears on the dossier's Positions tab (live-verified)                                                                                                               | Attach edge v11 deployed and battle-tested; **defaults to `link_type: 'related_to'` so `'applies_to'` must be passed explicitly** (D-09). Tab read key mapped: `['dossier-position-links', dossierId, filters]` — prefix-invalidate `['dossier-position-links', dossierId]`. Overview also reads `position_dossier_links`, so `dossierOverviewKeys.detail(dossierId)` must be invalidated too. Positions tab routed only on `country`/`topic` dossiers — live verification must use one of those. |

</phase_requirements>

## Architectural Responsibility Map

| Capability                                       | Primary Tier                                 | Secondary Tier                       | Rationale                                                                                        |
| ------------------------------------------------ | -------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Form rendering, inline validation, submit gating | Browser/Client (React dialog)                | —                                    | D-04: client-side Zod validation, submit disabled until valid                                    |
| Position-type / audience-group lookups           | Browser/Client (supabase client → PostgREST) | Database (RLS `USING (true)` SELECT) | Verified directly readable with user token; no edge function needed                              |
| Position creation + audience + version rows      | API/Edge (`positions-create`)                | Database (RLS)                       | D-10: edge owns the multi-table create; do not extend it                                         |
| Dossier link write (`applies_to`)                | API/Edge (`positions-dossiers-create` v11)   | Database (CHECK + RLS)               | D-10: reuse battle-tested attach edge; client passes explicit link_type                          |
| Translation draft-fill                           | API/Edge (`translate-content` v2)            | Browser (graceful degradation)       | D-07: edge does AI call; client must survive 503/AI_UNAVAILABLE                                  |
| Tab/overview refresh after create                | Browser/Client (TanStack Query invalidation) | —                                    | Dossier-scoped key invalidation in the dialog's success path (event-dialog precedent)            |
| RLS policy restoration                           | Database (migration via Supabase MCP)        | —                                    | Live policy drift; only a migration fixes it (user CLAUDE.md: apply migrations via Supabase MCP) |

## Live Staging Verification Results (2026-06-12, project zkrcjzdemdmwhearhfgg)

All probes used the `.env.test` test user (admin role, clearance_level 3, profiles row present) unless noted. Every test row created was deleted and deletion confirmed.

| #   | Probe                                                                                                                        | Result                                                                                                                                                                           | Verdict                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `OPTIONS` + unauthenticated `POST` to `positions-create`, `translate-content`, `positions-dossiers-create`, `positions-list` | All OPTIONS 200; POST → gateway `UNAUTHORIZED_NO_AUTH_HEADER`. Control probe on a fake name → `NOT_FOUND`                                                                        | **All four DEPLOYED** [VERIFIED: live probe]                                                                                                            |
| 2   | `supabase functions list --project-ref zkrcjzdemdmwhearhfgg`                                                                 | `positions-create` ACTIVE **v8** (2025-10-02); `positions-dossiers-create` ACTIVE **v11** (2026-06-10); `translate-content` ACTIVE **v2** (2026-01-11)                           | Deploy versions confirmed [VERIFIED: supabase CLI]                                                                                                      |
| 3   | Authenticated empty-body POST to `positions-create`                                                                          | 400 `{"error":"position_type_id is required","error_ar":"معرف نوع الموقف مطلوب"}`                                                                                                | Auth works (no 401); validation contract matches repo source [VERIFIED: live probe]                                                                     |
| 4   | Authenticated **valid** create payload (Standard type, both titles, All Staff audience)                                      | 500 `{"error":"Failed to create position", "details":"new row violates row-level security policy for table \"positions\""}`                                                      | **P0 BLOCKER — live RLS denies position INSERT** [VERIFIED: live probe]                                                                                 |
| 5   | Direct PostgREST INSERT to `positions` with user token (`author_id` = self, `status: 'draft'`)                               | 403 / code 42501 RLS violation                                                                                                                                                   | Denial is table-level, not edge-specific [VERIFIED: live probe]                                                                                         |
| 6   | User-token INSERTs to `position_audience_groups` and `position_versions` (against a service-role-scaffolded position)        | Both **201**                                                                                                                                                                     | Only `positions` needs a policy fix; cleanup confirmed [VERIFIED: live probe]                                                                           |
| 7   | User-token SELECT `position_types`                                                                                           | 2 rows: Standard Position / موقف قياسي (id `558eb0dd-6eec-4a54-a990-e53cb2b402e9`, 3 stages), Critical Position / موقف حرج (id `6e3e3979-1cc8-4a0b-a86f-4ec0bd3ed365`, 5 stages) | Picker can read directly; IDs are reference-only — resolve by name per D-05 [VERIFIED: live probe]                                                      |
| 8   | User-token SELECT `audience_groups`                                                                                          | 4 rows, all bilingual: All Staff/جميع الموظفين (`583bb928-…`), Management/الإدارة, Policy Officers/موظفو السياسات, External Relations/العلاقات الخارجية                          | Checkbox labels bilingual out of the box [VERIFIED: live probe]                                                                                         |
| 9   | Authenticated POST to `translate-content` (`en_to_ar`, `content_type: 'title'`)                                              | **HTTP 503** with body `{translated_text: "[ترجمة مطلوبة] …", confidence: 0.1, error: {code: "AI_UNAVAILABLE", …}, metadata: {model_used: "fallback"}}`                          | Deployed build ≠ repo source (repo returns 200/confidence 0/different placeholder). AnythingLLM currently unreachable on staging [VERIFIED: live probe] |
| 10  | `positions` row count (service role)                                                                                         | 2 rows total, both `published` (seeded)                                                                                                                                          | Nobody has ever successfully created a position on staging — consistent with R6-03                                                                      |
| 11  | User-token SELECT `positions`                                                                                                | 200, published rows visible                                                                                                                                                      | SELECT policies work; author will see own draft via `drafters_view_own_drafts`                                                                          |

## Standard Stack

### Core (all already installed — no new packages)

| Library                               | Version  | Purpose                                                         | Why Standard                                                                                                                                                                                                                   |
| ------------------------------------- | -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| react-hook-form                       | ^7.76.1  | Dialog form state                                               | Project convention (D-04); precedent `TaskEditDialog.tsx` [VERIFIED: package.json]                                                                                                                                             |
| zod                                   | ^4.3.6   | Validation schema                                               | Project convention; Zod messages are i18n keys resolved at render [VERIFIED: package.json + TaskEditDialog]                                                                                                                    |
| @hookform/resolvers                   | ^5.4.0   | zodResolver                                                     | Already used with zod v4 in repo [VERIFIED: package.json]                                                                                                                                                                      |
| @tanstack/react-query                 | v5       | Lookups + mutations + invalidation                              | Project server-state layer [VERIFIED: codebase]                                                                                                                                                                                |
| sonner                                | ^2.0.7   | Toasts incl. action buttons                                     | Already the dialog file's toast lib; supports `toast.success(msg, { action: { label, onClick } })` for D-12/D-11 [VERIFIED: package.json; action API ASSUMED from sonner v2 docs knowledge — trivial to confirm at build time] |
| supabase-js client (`@/lib/supabase`) | existing | Direct PostgREST reads for `position_types` / `audience_groups` | Same pattern as `useDossierPositionLinks`; RLS verified readable [VERIFIED: live probe]                                                                                                                                        |

**Installation:** none. Zero new dependencies.

## Package Legitimacy Audit

No external packages are installed by this phase. All recommended libraries are already in `frontend/package.json`. slopcheck not run — nothing to check.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 User (country/topic dossier page)
   │
   ├─ Entry 1: AddToDossierMenu → PositionDialog (rebuilt)
   ├─ Entry 2: DossierPositionsTab "Create position" button (D-13 rewire) ─┐
   │                                                                       │
   ▼                                                                       ▼
 NewPositionDialog (extracted component; RHF + Zod)
   │  lookups: useQuery ['position-types'] ──► supabase client ─► position_types  (RLS USING(true))
   │           useQuery ['audience-groups'] ─► supabase client ─► audience_groups (RLS USING(true))
   │  translate buttons ──► apiPost /translate-content ─► AnythingLLM (or 503 AI_UNAVAILABLE → user types manually)
   │
   ▼  submit (validated payload)
 Step 1: apiPost /positions-create ──► positions (RLS: NEEDS MIGRATION) + position_audience_groups + position_versions
   │            │ 201 → position.id
   │            └ 4xx/5xx → error toast, dialog stays open
   ▼
 Step 2: createPositionDossierLink(position.id, { dossier_id, link_type: 'applies_to' })
   │            │ 201 → success path
   │            └ failure → WARNING toast "created but not linked" + retry action (D-11)
   ▼
 Success: close dialog, toast + "Open position" action, invalidate:
   ['dossier-position-links', dossierId]      ← DossierPositionsTab + PositionTrackerCard
   ['positions', 'list']                      ← positions library (already done by useCreatePosition)
   dossierOverviewKeys.detail(dossierId)      ← overview also reads position_dossier_links
   ['position-dossier-links', position.id]    ← inverse key (position detail page)
   │
   ▼
 DossierPositionsTab refetches ['dossier-position-links', dossierId, filters] → new row renders (POSNEW-02)
```

### Component Responsibilities

| Concern                       | File                                                                                                                  | Action                                                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Broken dialog                 | `frontend/src/components/dossier/AddToDossierDialogs.tsx` L604-695                                                    | Replace `PositionDialog` internals; file is already 1,195 lines (>800-line rule) — **extract** the new dialog to its own component and render it from here                                                                   |
| New dialog component          | `frontend/src/components/positions/NewPositionDialog.tsx` (new; PascalCase per ESLint per-dir rule)                   | RHF+Zod form, pickers, translate buttons, two-step submit, invalidations                                                                                                                                                     |
| Tab rewire (D-13)             | `frontend/src/components/positions/DossierPositionsTab.tsx` `handleCreatePosition` (~L50)                             | Open NewPositionDialog instead of AttachPositionDialog; keep attach-existing as secondary action                                                                                                                             |
| Dossier context for tab entry | `useDossier(dossierId)` from `@/domains/dossiers/hooks/useDossier`                                                    | Shell already caches it (`dossierKeys.detail(id)`) — tab call is a cache hit; builds `DossierContextForAction` for the badge                                                                                                 |
| Lookup hooks (new)            | e.g. `frontend/src/domains/positions/hooks/usePositionTypes.ts`, `useAudienceGroups.ts`                               | `useQuery` + supabase client; long `staleTime` (lookup data)                                                                                                                                                                 |
| Create mutation               | `@/domains/positions` `useCreatePosition` (the `@/hooks/useCreatePosition` import in the dialog is a deprecated shim) | Reuse; it already invalidates `['positions','list']`                                                                                                                                                                         |
| Link write                    | `createPositionDossierLink(positionId, input)` repository function called directly                                    | The `useCreatePositionDossierLink(positionId)` hook takes positionId at hook-construction time — unusable when the id only exists post-create. Precedent: the tab's attach flow already calls the repo directly (R12-06 fix) |
| RLS migration                 | new `supabase/migrations/2026…_restore_positions_insert_policy.sql`, applied via Supabase MCP                         | Restore `drafters_insert_positions`-equivalent policy; idempotent (drop-if-exists + recreate)                                                                                                                                |

### Pattern 1: Zod schema with i18n-key messages (project convention)

```typescript
// Source: frontend/src/components/tasks/TaskEditDialog.tsx (in-repo precedent)
const newPositionSchema = z.object({
  position_type_id: z.string().min(1, 'positions:validation.typeRequired'),
  title_en: z.string().min(1, 'positions:validation.titleEnRequired').max(200, '…'),
  title_ar: z.string().min(1, 'positions:validation.titleArRequired').max(200, '…'),
  content_en: z.string().optional(),
  content_ar: z.string().optional(),
  audience_groups: z.array(z.string()).min(1, 'positions:validation.audienceRequired'),
})
// messages are i18n KEYS; render with t(errors.field.message) — EN+AR localization for free
```

### Pattern 2: Two-step submit with honest partial failure (D-10/D-11)

```typescript
// Step 1 — create (edge validates; client Zod should make 400s unreachable)
const position = await createPosition.mutateAsync(payload) // POST /positions-create
// Step 2 — link, isolated try/catch so failure is distinguishable
try {
  await createPositionDossierLink(position.id, {
    dossier_id: dossierContext.dossier_id,
    link_type: 'applies_to', // REQUIRED: edge defaults to 'related_to' if omitted (violates D-09)
  })
} catch {
  toast.warning(t('…positionCreatedLinkFailed'), {
    action: { label: t('…retryLink'), onClick: () => retryLink(position.id) },
  })
  // still invalidate ['positions','list']; do NOT show clean success
  return
}
// full success: invalidate dossier-scoped keys, close, success toast with "Open position" action
```

### Pattern 3: Dossier-scoped invalidation (event-dialog precedent, R12-04)

```typescript
// Source: AddToDossierDialogs.tsx EventDialog L747-752 (in-repo precedent)
await queryClient.invalidateQueries({
  queryKey: ['dossier-position-links', dossierContext.dossier_id],
})
await queryClient.invalidateQueries({
  queryKey: dossierOverviewKeys.detail(dossierContext.dossier_id),
})
// prefix match covers every filters variant of ['dossier-position-links', dossierId, filters]
```

### Pattern 4: Translate button resilient to deployed 503 contract (D-07/D-08)

```typescript
// apiPost throws on ANY non-2xx — and the DEPLOYED translate-content returns 503
// (with a fallback body) whenever AnythingLLM is down, which it currently is on staging.
const handleTranslate = async (
  text: string,
  direction: 'en_to_ar' | 'ar_to_en',
  kind: 'title' | 'content',
) => {
  setTranslating(kind, direction, true)
  try {
    const res = await apiPost<TranslateResponse>('/translate-content', {
      text,
      direction,
      content_type: kind,
    })
    setValue(targetField, res.translated_text, { shouldValidate: true, shouldDirty: true })
  } catch {
    toast.error(t('positions:translate.unavailable')) // user types manually — never blocks submit
  } finally {
    setTranslating(kind, direction, false)
  }
}
// Request contract (verified vs deployed): { text (≤10,000 chars), direction, content_type }
// Success contract: { translated_text, confidence, source_language, target_language, metadata }
```

### Anti-Patterns to Avoid

- **Hard-coding lookup UUIDs** — D-05/D-06 require name-match-with-fallback resolution (`name_en === 'Standard Position'` → else first row; `'All Staff'` → else first row). Staging IDs listed above are reference data for verification queries only.
- **Extending `positions-create` server-side** — explicitly forbidden by D-10. The stale v8 deploy (2025-10-02) matches the repo validation contract (verified live); leave it alone.
- **Using `useCreatePositionDossierLink(positionId)` inside the dialog** — hook signature needs the id before it exists. Call the repository function directly (existing precedent in the tab).
- **Redeploying `translate-content` from repo source** — the deployed v2 is newer/different (returns honest 503 + AI_UNAVAILABLE instead of repo's silent 200 fallback). Redeploying would regress the deployed contract.
- **Manual i18n raw keys / dot-form cross-namespace lookups** — use colon form (`t('positions:…')`) for any cross-ns key; the dialog itself is single-ns `useTranslation('dossier')` so plain keys are fine there. Both `dossier` and `positions` namespaces are registered in `i18n/index.ts` (en+ar) [VERIFIED: codebase].

## Don't Hand-Roll

| Problem                                         | Don't Build                              | Use Instead                                                                              | Why                                                                      |
| ----------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Form validation + submit gating                 | Manual useState validity tracking        | RHF `formState.isValid` + zodResolver                                                    | Project convention; localized error wiring exists                        |
| Bilingual error messages                        | Custom error-message map                 | Zod message = i18n key pattern                                                           | `TaskEditDialog` precedent; EN+AR for free                               |
| Toast with action button                        | Custom inline banner/modal               | sonner `toast(msg, { action })`                                                          | Already the toast lib in this file                                       |
| Link write + 409 dedupe                         | New edge function or direct table insert | `positions-dossiers-create` v11 via repository                                           | Battle-tested rounds 12/13; handles duplicate (409) and permission (403) |
| AR↔EN translation                               | Any client-side translation              | `translate-content` edge                                                                 | Purpose-built, logs AI interactions, enforces 10k char limit             |
| Dossier names for the context badge (tab entry) | New fetch                                | `useDossier(dossierId)` (cache hit — shell already loaded it under `dossierKeys.detail`) | Zero extra network                                                       |

## Common Pitfalls

### Pitfall 1 (P0): Live `positions` INSERT RLS denies all creates

**What goes wrong:** Even a perfectly valid payload from an admin user fails: edge returns 500 `new row violates row-level security policy for table "positions"`; direct PostgREST insert returns 403/42501. Verified live 2026-06-12.
**Why it happens:** Live policy drift — the repo's `drafters_insert_positions` policy (`WITH CHECK (auth.uid() = author_id AND status = 'draft')`) would pass this insert, so it is either missing on staging (RLS enabled + no INSERT policy = deny-all) or was replaced ad hoc with an unsatisfiable predicate. Repo migrations contain only that one INSERT policy for `positions`. Same drift class as the persons org-isolation incident (project memory).
**How to avoid:** First plan/wave: via Supabase MCP run `SELECT * FROM pg_policies WHERE tablename = 'positions'` to capture the live state, then apply an idempotent migration (`DROP POLICY IF EXISTS … ; CREATE POLICY …`) restoring an INSERT policy with `WITH CHECK (auth.uid() = author_id AND status = 'draft')`. Re-run the authenticated edge probe (a valid create that is then cleaned up) to confirm 201 before any frontend task claims completion. `position_audience_groups` and `position_versions` INSERTs already work (verified) — do not touch them.
**Warning signs:** Edge 500 with `details` mentioning row-level security; dialog error toast on every submit despite valid form.

### Pitfall 2: Attach edge silently defaults `link_type` to `'related_to'`

**What goes wrong:** Omitting `link_type` creates the link as `related_to`, violating D-09 and rendering the wrong badge on the tab.
**How to avoid:** Always pass `link_type: 'applies_to'` explicitly in the dialog's step 2. (The tab's attach-existing flow intentionally keeps the default.)

### Pitfall 3: `api-client` discards the edge's bilingual error body

**What goes wrong:** `handleResponse` throws `Error("API error 400: Bad Request")` — `error`/`error_ar` from `positions-create` never reach the UI, so the D-04 "edge bilingual errors as toast fallback" cannot show the server's message via plain `apiPost`.
**How to avoid:** Client-side Zod makes edge 400s practically unreachable; the fallback toast can be a localized generic message. If the planner wants the server's bilingual text, parse the response body in a scoped catch (or a thin wrapper) — do NOT change shared `api-client` behavior for every consumer in this phase.
**Warning signs:** English-only "API error 400" strings surfacing in AR mode.

### Pitfall 4: Deployed `translate-content` returns 503 when AI is down (and AI IS down on staging)

**What goes wrong:** Naive happy-path wiring treats every translate click as an exception; worse, code written against the REPO source (200 + fallback text) would paste "[الترجمة معلقة]…" placeholders into the field.
**How to avoid:** Treat any thrown `apiPost` error as "translation unavailable" → small error toast, field untouched, user types manually (D-07). Only fill the field on a 2xx response. Live verification of the translate happy path is currently impossible on staging — the failure path is what UAT will exercise (this is acceptable per D-07).
**Warning signs:** Placeholder Arabic text `[ترجمة مطلوبة]` appearing inside title fields.

### Pitfall 5: Invalidating only `['positions', 'list']` leaves the tab stale (the original bug class)

**What goes wrong:** The tab reads `['dossier-position-links', dossierId, filters]` (staleTime 2 min); overview cards (`PositionTrackerCard`, dossier overview service) also read `position_dossier_links` under `dossierOverviewKeys.detail(dossierId)`. None are touched by the existing mutation hooks.
**How to avoid:** Invalidate `['dossier-position-links', dossierId]` (prefix) + `dossierOverviewKeys.detail(dossierId)` + optionally `['position-dossier-links', position.id]` (inverse key used by the position detail page). Exact mapping verified in `hooks/useDossierPositionLinks.ts` L122, `services/dossier-overview.service.ts` L465-470, `domains/positions/hooks/useCreatePositionDossierLink.ts` L21.

### Pitfall 6: Positions tab is routed ONLY for `country` and `topic` dossiers

**What goes wrong:** Live verification on an organization/forum/person dossier fails — there is no Positions tab route (`routes/_protected/dossiers/{countries,topics}/$id/positions.tsx` are the only two; tabs come from per-type `*_EXTRA_TABS` configs). The Add-to-Dossier menu still offers New Position on all types (static `ACTION_GROUPS` — D-13 says no gating needed); the link row is still written and DB-verifiable.
**How to avoid:** Run POSNEW-02 live verification on a country (e.g., Saudi Arabia `9b9a04af-50b0-408c-878d-9d07f77a74ab`) or topic dossier. Do not add tab routes for other types this phase (scope).

### Pitfall 7: Draft positions are only visible to their author (and admins)

**What goes wrong:** Created positions are `status: 'draft'`; `drafters_view_own_drafts` limits SELECT to the author. A different verifier account will see an "empty" tab and call it a bug.
**How to avoid:** Live-verify with the same user who created the position. Note in the verification doc.

### Pitfall 8: Repo lint/convention traps for new files

**What goes wrong:** CI lint (`--max-warnings 0`, whole repo) fails on naming or typing violations that the staged-only pre-commit hook missed.
**How to avoid:** New components under `components/**` must be PascalCase files; hooks camelCase with `use` prefix; explicit return types on all functions; no `any`; no floating promises (await the invalidations); single quotes/no semicolons per Prettier. The pre-commit hook runs `pnpm build` but does NOT block on failure (project memory) — verify build output manually.

## Code Examples

### Lookup hooks (verified data shape)

```typescript
// Live-verified shape: position_types → [{ id, name_en, name_ar, approval_stages }]
// RLS: SELECT allowed for all authenticated (verified live with user token)
export function usePositionTypes() {
  return useQuery({
    queryKey: ['position-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('position_types')
        .select('id, name_en, name_ar, approval_stages')
        .order('name_en')
      if (error) throw new Error(error.message)
      return data
    },
    staleTime: 30 * 60 * 1000, // lookup data
  })
}
// Default resolution per D-05 (never hardcode the UUID):
// const standard = types.find((t) => t.name_en === 'Standard Position') ?? types[0]
```

### `positions-create` request/response contract (verified live, v8)

```typescript
// POST /functions/v1/positions-create   (Authorization: Bearer <user JWT>)
// Required: position_type_id (must exist in position_types), title_en, title_ar (non-empty),
//           audience_groups (string[] of audience_group ids, length ≥ 1)
// Optional: content_en, content_ar, rationale_en/ar, alignment_notes_en/ar, thematic_category
// 201 → the full positions row (status 'draft', current_stage 0, author_id = caller, version 1)
// 400 → { error, error_ar } per missing/invalid field (bilingual, verified live)
// 500 → { error, error_ar, details } (e.g., the current RLS denial)
```

### `positions-dossiers-create` contract (verified source + deploy v11)

```typescript
// POST /functions/v1/positions-dossiers-create?positionId=<uuid>
// Body: { dossier_id: string, link_type?: 'applies_to'|'related_to'|'endorsed_by'|'opposed_by', notes?: string }
// link_type DEFAULTS to 'related_to' — pass 'applies_to' explicitly (D-09)
// 201 → link row with embedded dossier; 409 → already linked; 403 → RLS denied
// Repository wrapper exists: createPositionDossierLink(positionId, input)
```

## State of the Art

| Old Approach (current code)                   | Current Approach (this phase)                          | When Changed                       | Impact                                         |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------------------- | ---------------------------------------------- |
| `position_type_id: dossierContext.dossier_id` | Real type picker resolving live `position_types`       | Phase 64                           | Edge 400 "Invalid position_type_id" eliminated |
| `title_ar: ''` hard-coded                     | Required AR title field + translate assist             | Phase 64                           | Edge 400 bilingual-title eliminated            |
| `audience_groups: []`                         | Multi-select checkboxes, All Staff pre-checked         | Phase 64                           | Edge 400 audience eliminated                   |
| No link write after create                    | Two-step create → attach (`applies_to`)                | Phase 64                           | POSNEW-02 satisfied                            |
| Tab "Create position" opens attach-existing   | Opens New Position dialog; attach demoted to secondary | Phase 64 (D-13)                    | Mislabel fixed                                 |
| `@/hooks/useCreatePosition` import            | `@/domains/positions` (shim is explicitly deprecated)  | Phase 64 (while touching the line) | Convention hygiene                             |

**Deprecated/outdated:**

- `frontend/src/hooks/useCreatePosition.ts` — deprecated re-export shim; the dialog should import from `@/domains/positions`.
- `MultiLanguageContentEditor`'s translate button — handler is a stub ("translateField API no longer available"); visual precedent only, do not copy its wiring.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                        | Section                    | Risk if Wrong                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A1  | sonner v2 `toast(msg, { action: { label, onClick } })` API shape (no in-repo usage of `action` yet)                                                                                                                          | Standard Stack / Pattern 2 | Trivial — confirm at build time; fall back to a custom toast body                                                                 |
| A2  | The live `positions` INSERT denial is policy-drift (missing/replaced policy) rather than an intentional product lockdown                                                                                                     | Pitfall 1                  | If intentional, the migration needs product sign-off; the MCP `pg_policies` diagnostic in the first plan resolves this either way |
| A3  | `/positions/$id` (editor page) is the right "Open position" target for D-12's continue-drafting intent (a duplicate `/positions/$positionId` detail route also exists — pre-existing route duplication, out of scope to fix) | Architecture               | Wrong deep-link target; one-line change                                                                                           |

## Open Questions

1. **What exactly is the live `positions` policy state?**
   - What we know: INSERT denied for admin w/ valid payload; SELECT works; repo migration policy would permit the insert; `position_audience_groups`/`position_versions` INSERTs work.
   - What's unclear: missing policy vs. broken ad-hoc replacement vs. a RESTRICTIVE policy ANDed in (pg_policies not readable via PostgREST).
   - Recommendation: first execution task runs `SELECT polname, polcmd, polpermissive, pg_get_expr(polqual, polrelid), pg_get_expr(polwithcheck, polrelid) FROM pg_policy JOIN pg_class ON pg_class.oid = polrelid WHERE relname = 'positions'` via Supabase MCP, records the result in the SUMMARY, then applies the idempotent restore migration.
2. **Will AnythingLLM be reachable on staging during phase verification?**
   - What we know: currently down (503 AI_UNAVAILABLE, verified). D-07 makes the feature non-blocking regardless.
   - Recommendation: verify the translate buttons' failure UX live; mark the happy path as code-reviewed + unit-tested (mocked) only.

## Environment Availability

| Dependency                              | Required By                                                | Available                      | Version                 | Fallback                                               |
| --------------------------------------- | ---------------------------------------------------------- | ------------------------------ | ----------------------- | ------------------------------------------------------ |
| Staging Supabase (zkrcjzdemdmwhearhfgg) | All live verification                                      | ✓                              | PG 17.x platform        | —                                                      |
| supabase CLI (authenticated)            | Function deploys/listing                                   | ✓                              | 2.102.0                 | Supabase MCP                                           |
| Supabase MCP (parent session)           | RLS migration (user CLAUDE.md mandates MCP for migrations) | ✓ (assumed per project config) | —                       | `supabase db push` via CLI                             |
| Test credentials (`.env.test`)          | Authenticated probes / UAT                                 | ✓                              | admin user, clearance 3 | —                                                      |
| AnythingLLM (staging AI backend)        | translate-content happy path                               | ✗                              | —                       | Failure-path UX (per D-07 design); user types manually |
| Node 22 / pnpm 10.29.1 / Vitest         | Build + tests                                              | ✓                              | per repo                | —                                                      |

**Missing dependencies with no fallback:** none (AnythingLLM unavailability is absorbed by D-07's design).

## Validation Architecture

### Test Framework

| Property           | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Framework          | Vitest (frontend workspace) + @testing-library/react                                     |
| Config file        | `frontend/vitest.config.ts` (existing)                                                   |
| Quick run command  | `cd frontend && pnpm exec vitest run <test-file>`                                        |
| Full suite command | `cd frontend && pnpm exec vitest run` (suite was 1,245 pass / 0 fail at last quick task) |
| Type check         | `cd frontend && pnpm type-check`                                                         |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                                                            | Test Type                                                       | Automated Command                                                                    | File Exists?                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| POSNEW-01 | Submit disabled until type + title_en + title_ar + ≥1 audience valid; payload carries real `position_type_id` and `audience_groups` | unit (RTL)                                                      | `pnpm exec vitest run src/components/positions/__tests__/NewPositionDialog.test.tsx` | ❌ Wave 0                                                                    |
| POSNEW-01 | Defaults: Standard preselected by name-match; All Staff pre-checked                                                                 | unit                                                            | same file                                                                            | ❌ Wave 0                                                                    |
| POSNEW-01 | Translate failure leaves field untouched + non-blocking                                                                             | unit (mocked apiPost rejection)                                 | same file                                                                            | ❌ Wave 0                                                                    |
| POSNEW-02 | Step 2 called with `link_type: 'applies_to'`; on success invalidates `['dossier-position-links', dossierId]` + overview key         | unit (mocked repo + queryClient spy)                            | same file                                                                            | ❌ Wave 0                                                                    |
| POSNEW-02 | Partial failure → warning toast (not success), retry callable                                                                       | unit                                                            | same file                                                                            | ❌ Wave 0                                                                    |
| POSNEW-02 | Link row exists in DB; tab renders without refresh                                                                                  | manual/live (staging) — milestone norm (Phases 62/63 precedent) | authenticated probe + browser verification on a country/topic dossier                | manual-only (justified: requires live staging RLS + realtime cache behavior) |

### Sampling Rate

- **Per task commit:** `pnpm exec vitest run src/components/positions/__tests__/NewPositionDialog.test.tsx` + `pnpm type-check`
- **Per wave merge:** `pnpm exec vitest run` (full frontend unit suite)
- **Phase gate:** full suite green + live staging verification (create → DB-verify link row with `link_type='applies_to'` → tab shows row without reload) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] RLS migration + live policy diagnostic (blocks everything; see Pitfall 1)
- [ ] `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` — covers POSNEW-01/02 unit rows above (no tests exist today for `AddToDossierDialogs` or `DossierPositionsTab`)
- Framework install: none needed

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies                       | Standard Control                                                                                                                                                                                                                                             |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | no (existing JWT flow reused) | `api-client` attaches session token; edges verify via `getUser()` (verified working live for these functions)                                                                                                                                                |
| V3 Session Management | no                            | unchanged                                                                                                                                                                                                                                                    |
| V4 Access Control     | **yes**                       | The restored INSERT policy must be minimally scoped: `WITH CHECK (auth.uid() = author_id AND status = 'draft')` — never `USING (true)`/`WITH CHECK (true)`. Link writes stay behind `positions-dossiers-create` RLS (403 on denial, verified in edge source) |
| V5 Input Validation   | yes                           | Zod client-side + edge-side field validation (both layers verified); audience IDs and type ID are validated server-side against real tables                                                                                                                  |
| V6 Cryptography       | no                            | none introduced                                                                                                                                                                                                                                              |

### Known Threat Patterns for this stack

| Pattern                                                      | STRIDE          | Standard Mitigation                                                                                                  |
| ------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| IDOR via arbitrary `dossier_id` in link write                | Elevation       | RLS on `position_dossier_links` (battle-tested v11 chain, round-12 clearance fix)                                    |
| Over-broad RLS restore (deny-all → allow-all overcorrection) | Elevation       | Policy predicate review in code review; live probe with a non-author payload should still fail                       |
| XSS via translated/AI text inserted into fields              | Tampering       | Values rendered through React (auto-escaped); never `dangerouslySetInnerHTML`; text goes into controlled inputs only |
| Prompt/content abuse of translate edge                       | DoS             | Edge enforces 10,000-char limit (verified in source); button disabled while in flight                                |
| Secrets in client                                            | Info disclosure | No new secrets; `.env.test` values must never be committed or echoed in test fixtures                                |

## Project Constraints (from CLAUDE.md)

- Migrations via **Supabase MCP** (user-level instruction: "use the supabase mcp to do it yourself"); no direct DB access changes.
- GSD workflow enforcement: implementation goes through `/gsd:execute-phase`.
- Stack frozen (React 19, TanStack v5, Tailwind v4, Supabase); HeroUI/Radix for primitives only — the dialog reuses existing `components/ui/dialog` primitives; Aceternity/Kibo/shadcn-defaults banned.
- Design tokens only (no raw hex, no Tailwind color literals); borders `1px solid var(--line)`; buttons mirror `.btn-primary`/`.btn-ghost`; row heights `var(--row-h)`; no emoji in copy; sentence case.
- RTL: logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`); `dir` driven by i18n; flip directional icons; verify AR with Tajawal.
- Both AR and EN must work after every change; new i18n keys land in BOTH `i18n/en/*` and `i18n/ar/*` (namespaces are static-bundled; `dossier` and `positions` ns already registered).
- ESLint: explicit function return types, no `any`, no floating promises, `strict-boolean-expressions`; filename case per directory (components/\*\* = PascalCase); Prettier single quotes / no semicolons / width 100.
- Work through existing terminology and dossier-centric patterns (`position_dossier_links` junction, `DossierContextBadge`).
- Desktop-primary: build at 1280px, verify 1024px; dialogs stay `sm:max-w-lg` weight per D-01.
- Code review checklist applies (no hardcoded secrets, error handling, tests for new functionality).

## Sources

### Primary (HIGH confidence — live probes & CLI, this session)

- Staging edge probes (deploy status, auth, validation contract, RLS denial, translate 503): `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/*`
- `supabase functions list --project-ref zkrcjzdemdmwhearhfgg` (v8 / v11 / v2 + dates)
- PostgREST probes with user + service tokens: `position_types`, `audience_groups`, `positions` (INSERT denial, columns, count), `position_audience_groups` + `position_versions` (INSERT allowed), `profiles`, `users` (role/clearance) — all probe rows deleted and confirmed gone

### Primary (HIGH confidence — repo code read this session)

- `frontend/src/components/dossier/AddToDossierDialogs.tsx` (PositionDialog L604-695; EventDialog invalidation precedent L743-752)
- `frontend/src/components/positions/DossierPositionsTab.tsx` (tab key, attach flow precedent, D-13 target)
- `frontend/src/hooks/useDossierPositionLinks.ts` (queryKey L122), `frontend/src/domains/positions/hooks/useCreatePosition.ts`, `useCreatePositionDossierLink.ts`, `repositories/positions.repository.ts`
- `frontend/src/services/dossier-overview.service.ts` (overview reads position_dossier_links L465-470; `dossierOverviewKeys` L1127-1137)
- `frontend/src/domains/dossiers/hooks/useDossier.ts` (`dossierKeys.detail`), `frontend/src/hooks/useAddToDossierActions.tsx` (`DossierContextForAction`)
- `supabase/functions/positions-create/index.ts`, `positions-dossiers-create/index.ts` (link_type default L88), `translate-content/index.ts`
- `supabase/migrations/20250101011_rls_positions.sql`, `20250101013_rls_attachments_consistency.sql`, `20250101015/16_seed_*.sql`
- `frontend/src/components/tasks/TaskEditDialog.tsx` (RHF+Zod i18n-key convention), `frontend/package.json` (versions)

### Secondary (MEDIUM confidence)

- Project memory (MEMORY.md): rounds 12/13 attach-chain fixes, edge auth 401 pattern, persons RLS-drift precedent — all consistent with this session's live findings

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — zero new packages; versions read from package.json
- Architecture: HIGH — every key/contract traced in code and/or verified live
- Pitfalls: HIGH — Pitfalls 1, 2, 4, 5, 6 verified live or in source this session
- RLS root cause: MEDIUM — denial is verified; the exact live policy text needs the MCP diagnostic at execution time

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (stable internal stack; re-verify staging RLS + translate-content deploy state at execution start — staging is actively mutated)
