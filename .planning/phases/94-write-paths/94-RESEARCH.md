# Phase 94: Write Paths - Research

**Researched:** 2026-08-16
**Domain:** Brownfield write-path repair — React 19 / TanStack Query v5 frontend, Supabase edge functions + RLS, dnd-kit kanban, i18next bilingual copy
**Confidence:** HIGH (every load-bearing claim carries a `file:line` or a live staging query result; instrument failures during derivation are recorded inline)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied from `.planning/phases/94-write-paths/94-CONTEXT.md` §Decisions. Numbering restarts per phase; **[inherited]** marks standing law from Phase 93.

**Scope and requirement mapping**

- **D-01: The phase closes 9 requirements.** `WRITE-01..06`, `AUDIT-DROP-01`, `AUDIT-ZERO-01`, `ARMA-01`. Source: `REQUIREMENTS.md` §WRITE and §`ARMA-01`; `ROADMAP.md` §Phase 94 as amended by `ba19751c6`.
- **D-02: `ARMA-01` rides inside the plan that closes `WRITE-06`, ordered strictly AFTER the `42P17` fix.** Not a separate plan, not a separate wave. The action is a **deletion**: arm (b) of `tests/e2e/93-report-notfound.spec.ts`'s `404 OR query-error-state` disjunction is removed and the 404 arm asserted alone.

**WRITE-04 — the kanban commitment drag**

- **D-03: The commitment lifecycle is FIVE values, and every document that said four was wrong.** `aa_commitments_status_check` is `status IN ('pending','in_progress','completed','cancelled','overdue')`. **Re-derive it again before writing the mapping.** (Re-derived by this research 2026-08-16 — confirmed five; see §WRITE-04 below.)
- **D-03a: The stage→status map is ONE cell, not four.** `todo→pending`, `in_progress→in_progress`, `done→completed` are already valid. Only `review→review` is rejected by the constraint.
- **D-03b: `WRITE-04`'s population definition states the REVERSE mapping** — where each of the five live statuses renders — or excludes one explicitly. Derived: `pending`→Todo, `in_progress`→In-progress, `completed`→Done, `cancelled`→not rendered (filtered at `WorkBoard.tsx:203`, deliberate), `overdue`→Todo via the `default` branch. Handling `overdue` is NOT Phase 94 work (`PARK-94-03`, filed to Phase 96 as `COUNT-04`).
- **D-03c: A `BEFORE UPDATE` trigger overwrites the kanban's commitment write — PARKED as `PARK-94-04`; it BLOCKS the criterion's wording.** `commitment_overdue_check` rewrites `NEW.status := 'overdue'` on every UPDATE of a past-due `pending`/`in_progress` row. 8 of 10 staging commitments are already `overdue`. Consequences the planner must not miss: (i) no `WRITE-04` oracle may assert persistence by asserting "no error"; (ii) a staging drag oracle is dragging a past-due card with probability 8/10; (iii) a round-trip oracle cannot restore the original stored value.
- **D-04: A commitment dragged to `review` — RULED (b) + (a)** (`RULING-P94-01` on `PARK-94-01`): non-droppable `review` for commitment cards, WITH the mutation-layer reject as safety net. The ruling explicitly does NOT establish that a per-card droppable predicate is expressible in the installed dnd-kit — **the oracle must PROVE it**; if not expressible, (a) alone is the fallback and the switch note says so. Adding `review` to the lifecycle stays refused (D-06).
- **D-05: The no-op guard is a SECOND, distinct defect, and the one that produces the false success.** `WorkBoard.tsx:307` compares `targetStage === item.workflow_stage`; `workflow_stage` is null for every commitment, so no commitment drag is ever a no-op. Fix: compare against `resolveBoardStage(item)`.
- **D-06: `aa_commitments`' columns and enums are never renamed or extended; the mapping lives at the mutation layer.** Source: `CLAUDE.md` §Source-Specific Column Carve-Outs.
- **D-07: The app-wide success toast — RULED NARROW.** Phase 94 fixes the no-op guard and does NOT edit the global handler (`query-client.ts:71`). Tracked as `COPY-06`, owner Phase 98. Any plan treating `COPY-06` as in-scope is wrong.

**What "a failed write says so" means**

- **D-08: A surfaced failure is a SPECIFIC TRANSLATED message, never a server-originated `error.message`.** [inherited — P93 D-08; reinforced as `RULING-P94-01` order 1, an ACCEPTANCE CRITERION]: the WRITE-04 reject message is a bilingual i18n key rendered with `role="alert"`, EN+AR under the key-set-equality gate. Two live violations in this phase's own files are in scope: `useUnifiedKanban.ts` onError toast (`description: error.message` + hardcoded English title) and `after-actions/$afterActionId.tsx:109`.
- **D-09: Error and success copy lands in BOTH locales, gated by the i18n key-set-equality pattern.** [inherited — P93 D-04.]
- **D-10: Every `t()` call this phase adds or repairs uses the COLON namespace form.** A fix that keeps the dot form and adds the key to the wrong namespace reproduces the bug silently.
- **D-11: Reuse the shared query-error component Phase 93 extracted.** [inherited — P93 D-03.] `role="alert"`, bilingual, internal-string-free.

**WRITE-02 — after-actions list and detail**

- **D-12: The list fix repoints the embed at the table that holds the FK.** Two failure modes addressed explicitly: the wrong relation, AND `!inner`, which hides any after-action whose join misses. (Research finding: NO table holds the FK — see §WRITE-02 below; the constraint set forces a rewrite, not a repoint.)
- **D-13: An after-action whose engagement row is missing is LISTED in a named degraded state, not hidden.** [inherited — P93 D-07.]

**WRITE-05 — /settings**

- **D-14: The `users` write becomes `.update(…).eq('id', user.id)`.** The `.upsert()` at `SettingsPage.tsx:211` omits NOT NULL `email`, so the INSERT tuple fails before conflict resolution — every Save.
- **D-15: The notification-bridge step is unreachable, not broken.** Steps 2–3 (`SettingsPage.tsx:225-280`) are correct and never execute. The acceptance criterion must observe the bridge's effect, not merely that Save stops erroring.
- **D-16: "Every `/settings` tab" is a POPULATION, derived and stated, never assumed.** The plan states which surfaces are in the population, which are outside, and why — including whether a child route counts as a "tab".

**The two audit-write defects**

- **D-17: Column maps are re-derived against live staging BEFORE the helper is written.** `public.audit_log` (singular, backend) and `public.audit_logs` (plural, edge) are different tables with different column sets; the plan must not assume one helper can span both runtimes.
- **D-18: The insert error is surfaced, not swallowed.** "Surfaced" = reaching a log with the failure distinguishable from success, and — where the audit write is a precondition — failing the action. Which sites are precondition-grade is a per-site planning call, stated in the plan.
- **D-19: A fixed edge function that is not REDEPLOYED has not been fixed.** Deploy via Supabase CLI/MCP; `scripts/probe-edge-auth.sh` exists for deploy evidence. Applies to `after-actions-list-all` too.
- **D-20: `AUDIT-ZERO-01`'s population is re-derived, and its stated blind spots are carried forward.** Widen the search or restate the exclusion — never inherit the number silently. (Re-derived and widened by this research — see §AUDIT below.)

**WRITE-06 — reports**

- **D-21: The `42P17` fix is a migration file applied through the Supabase MCP, never ad-hoc DDL.**
- **D-22: The recursion fix must not widen the visible row set, and that is asserted, not assumed.** The acceptance criterion is two-sided: no `42P17`, AND a user still sees only their own rows plus rows genuinely shared with them. The phase's sharpest security risk.

**Gates, oracles and derivations — standing law**

- **D-23: `GATE-STANDARD.md` C1–C10, including C9a and C9b, governs every gate from authoring.** [inherited.] `GATESTD-01` (the standard's sed defect) is Phase 102's — work around it.
- **D-24: Every closing derivation states its POPULATION DEFINITION and what falls outside it.** [inherited.]
- **D-25: Behavioural criteria carry behavioural oracles; producers ordered before consumers.** [inherited.]
- **D-26: Playwright oracles assert spec-file existence FIRST and hardcode the expected count.** Any command naming a project with `dependencies:` passes `--no-deps`, including `--list`.
- **D-27: No oracle may depend on the e2e `setup` project.** [inherited.] Route around per P92/P93 precedent (`--no-deps` + inline auth) or park.
- **D-28: C9b rows carry the mock-vs-real column from authoring.** A mocked consumer is a NON-ORACLE.
- **D-29: No two writers share an output path.**

### Claude's Discretion

Technical shape is the planner's and researcher's, within the constraints above: how the `42P17` recursion is broken (subject to D-22), whether the audit-write helper is one module or two (constrained by D-17's two-table finding), how the non-droppable predicate is expressed in dnd-kit, and the internal structure of the `after-actions-list-all` query.

### Deferred Ideas (OUT OF SCOPE)

- Global success toast literal → **`COPY-06`**, owner Phase 98. The requirement entry is the queue.
- Double-toast on a failed mutation (global + mutation-level onError both fire) — no Phase 94 criterion.
- `resolveBoardStage`'s dead `review` branch for commitments (`WorkBoard.tsx:97-98`) — clean up with the PARK-94-01 ruling's implementation, not before.
- Out-of-phase by prior ruling: `RETENTION-CAST-01`, `NOTFOUND-COMPONENT-01` → P95; `DR-SUBPATH-01`, `RLS-AUTHUSERS-01` → P100; `ORACLECAP-01`, `E2ECRED-01` → P101; `DELEG-02`, `GATESTD-01` → P102.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID            | Description                                                   | Research Support                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WRITE-01      | After-action create/save/publish from engagement UI           | §WRITE-01: route props gap pinned, form guard provenance, publish role-gating both sides, two-step publish shape                                                                              |
| WRITE-02      | `/after-actions` lists; detail renders translated copy        | §WRITE-02: live catalog proves NO FK exists (both embeds dead), `engagements` lacks the selected columns; i18n key map derived in both locales                                                |
| WRITE-03      | `/intake/new` submits                                         | §WRITE-03: real mechanism is Zod 4 `.uuid()` rejecting 35/44 staging dossier ids — proven with the installed zod against OECD's live id; the filed field-mismatch mechanism is measured FALSE |
| WRITE-04      | Kanban commitment drag persists; rejects surface real message | §WRITE-04: dnd-kit 6.3.1 per-card predicate IS expressible (types cited); collision-retarget hazard named; both defect seams + reject-path shape                                              |
| WRITE-05      | Every `/settings` tab saves and survives reload               | §WRITE-05: full population derived (9 sections + 5 child routes + callback); `users.email` NOT NULL + RLS verified live                                                                       |
| WRITE-06      | Report generation + scheduling without `42P17`                | §WRITE-06: full live policy text, the exact recursion cycle, three candidate fixes judged against D-22, `type` vs `template` pinned both sides, mock-POST hazard                              |
| AUDIT-DROP-01 | Backend security events actually insert                       | §AUDIT: `audit_log` columns re-derived live; two NOT NULL columns (tenant_id, entity_id) the filed fix does not supply; trigger precedent for the tenant source                               |
| AUDIT-ZERO-01 | Edge audit writers write a real shape                         | §AUDIT: population re-derived BOTH quote styles → 38 files, 36 writers, 27 broken (was "20 of 32"); per-file bad-key table; RLS insert constraints                                            |
| ARMA-01       | Delete arm (b) of the report-notfound spec                    | §ARMA-01: exact lines constituting arm (b) enumerated                                                                                                                                         |

</phase_requirements>

## Summary

Phase 94 is defect repair across five advertised write paths plus two never-functional audit sinks. This research answers the nine "actually unknown" questions with live-staging derivations and pins every seam. Three findings materially change what the planner should write:

1. **WRITE-02's filed mechanism is understated and WRITE-03's is wrong.** `after_action_records` carries **no FK at all** on `engagement_id` or `dossier_id` (live `pg_constraint`: only five `auth.users` FKs), so BOTH PostgREST embeds in `after-actions-list-all` (`engagements!inner` AND `dossiers!inner`) fail — and `public.engagements` doesn't even have the `title_en/title_ar/engagement_date` columns the embed selects. The fix is a query restructure (or a FK migration — but CONTEXT.md states the 42P17 policy fix is the phase's only schema-level change). For WRITE-03, the picker and the schema both use `dossierId` — the real defect is `z.string().uuid()` under **Zod 4.3.6**, which rejects 35 of 44 staging dossier ids (non-RFC-4122 seed UUIDs; OECD = `b0000001-0000-0000-0000-000000000005`, proven FAIL against the installed zod). The error message for that failure is exactly `dossier-context:validation.dossier_required` = "At least one dossier is required" — reproducing the audit symptom precisely.

2. **The dnd-kit question is answered YES, with a trap.** `@dnd-kit/core@6.3.1`'s `useDroppable` accepts `disabled?: boolean` and `useDndContext` (a public export) exposes the active drag's `data` — so a per-active-item droppable predicate IS expressible. But the provider uses `closestCenter` collision detection: a disabled `review` column means a release over it retargets to the nearest **enabled** droppable (it does not null out), and cards inside the review column are droppables of their own (`useSortable`, not disabled). The mutation-layer reject (candidate (a)) is therefore load-bearing regardless — exactly as the ruling anticipated.

3. **AUDIT-ZERO-01's population was quote-biased.** Re-derived with both quote styles: **38 files** reference `audit_logs`, **36 are writers**, **27 broken** (not 20 of 32). One backend writer (`mou.service.ts:636`, key `changes`) sits outside both filed populations. `audit_log` (singular) additionally requires `tenant_id` and `entity_id` — NOT NULL, no defaults — which the filed fix ("map `resource_type`→`entity_type`, `details`→`additional_context`") does not supply; the only successful writers today are DB triggers that take `tenant_id` from the audited row, and `users`/`profiles` have no tenant column, so the tenant source is a genuine open decision.

**Primary recommendation:** Plan the phase as five surface plans + one audit plan + one reports/ARMA plan, each with a behavioural write-then-read-back oracle (never "no error" — D-03c), reusing `mapToValidIntakeStatus` as the commitment-mapper template, Phase 93's `QueryErrorState` for error surfaces, and `scripts/probe-edge-auth.sh` for the deploy evidence of what will be a ~30-function redeploy round.

## Architectural Responsibility Map

| Capability                                    | Primary Tier                                    | Secondary Tier                                                                                         | Rationale                                                                        |
| --------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| After-action create/publish gating (WRITE-01) | Frontend (route + form component)               | Edge fn (`after-actions-create` hardcodes `draft`; `after-actions-publish` re-checks role server-side) | The defect is client-side wiring; server already enforces                        |
| After-actions list join (WRITE-02)            | Edge fn (`after-actions-list-all`)              | DB catalog (no FK exists)                                                                              | PostgREST embeds are resolved server-side; frontend already renders `error` prop |
| Intake submit validation (WRITE-03)           | Frontend (Zod schema in `IntakeForm.tsx`)       | —                                                                                                      | Blocked at `handleSubmit`; the camel→snake mapping downstream is already correct |
| Kanban drag mapping + reject (WRITE-04)       | Frontend mutation layer (`useUnifiedKanban.ts`) | Frontend board (droppable predicate); DB trigger owns `overdue`                                        | D-06: mapping lives at the mutation layer; DB enums never change                 |
| Settings save (WRITE-05)                      | Frontend (`SettingsPage.tsx` mutationFn)        | DB (`users` RLS `users_update_self` verified live)                                                     | `.update()` passes existing RLS; no schema change                                |
| Reports recursion (WRITE-06)                  | DB (RLS policies via migration)                 | Frontend/edge (field-name contract)                                                                    | 42P17 is a policy-graph property; D-21 migration-only                            |
| Audit writes                                  | Backend service + edge fns                      | DB (column sets, NOT NULLs, insert RLS)                                                                | Two different tables, two runtimes (D-17)                                        |

## Standard Stack

**No new packages.** Every fix uses libraries already installed. This phase must not add dependencies.

### Already-installed dependencies this phase leans on (versions verified against `node_modules`)

| Library                     | Version                                         | Used for                                                                                        |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@dnd-kit/core`             | 6.3.1 (installed; `package.json` pins `^6.3.1`) | `useDroppable({ disabled })`, `useDndContext` — the per-card predicate                          |
| `@dnd-kit/sortable`         | 10.0.0                                          | `useSortable({ disabled: { droppable } })` if card-level drop targets must also be disabled     |
| `zod`                       | 4.3.6 (installed)                               | WRITE-03 schema relaxation — Zod 4's `.uuid()` is RFC-9562-strict, the root cause               |
| `@tanstack/react-query`     | v5                                              | existing mutation/invalidation seams                                                            |
| `i18next` / `react-i18next` | installed                                       | colon-form keys; default NS `translation` is aliased to `common.json` (`i18n/index.ts:274,410`) |

### Package Legitimacy Audit

No packages are installed by this phase. slopcheck not run — nothing to check. Any plan that finds itself adding a dependency is out of scope by this research's finding and should stop.

## Answers to the Nine Unknowns

### 1. WRITE-01 — After-action create/save/publish

**What the route passes today** (`frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx:156-162`):
`engagementId`, `dossierId={(engagement as any).dossier_id ?? engagement.id}`, `availableUsers`, `onSave={handleSaveDraft}`, `onDirtyChange={setFormDirty}`. **It does NOT pass `canPublish` or `onPublish`** — confirming the requirement. It also passes no `initialData` (create mode).

**Real prop signatures** (`frontend/src/components/after-action-form/AfterActionForm.tsx:45-57`):

```typescript
onSave: (data: AfterActionFormData, isDraft: boolean) => Promise<void>
onPublish?: (data: AfterActionFormData) => Promise<void>
canPublish?: boolean          // default false (:66)
```

The publish button renders only when `canPublish && onPublish` (`:499`) and is `disabled={saving || publishing || !isFormValid()}` (`:503`); `isFormValid()` (`:296-305`) requires ≥1 attendee and ≥1 of decisions/commitments/risks/follow-ups.

**What gates the save button:** `:482` — `disabled={saving || publishing || !isDirty}`. `isDirty` is set only by the effect at `:130-134`:

```typescript
useEffect(() => {
  if (!initialData) return
  setIsDirty(true)
}, [formData, initialData])
```

In create mode `initialData` is undefined → `isDirty` stays false forever → Save Draft permanently disabled. That is the WRITE-01 defect, verbatim.

**Why the guard was there / what breaks if simply deleted:** `git log -L130,134` traces the guard to `307485dd3` (2026-02-08, "fix: resolve all TypeScript errors and apply pending migrations") — a bulk cleanup commit, **not a design decision**. If the guard is simply deleted, the effect fires after first mount (React effects run post-render on the initial `formData`), so `isDirty` becomes true immediately and Save enables on an untouched empty form. The clean fix reuses the content-derived dirtiness the file already computes: the second effect at `:140-151` builds a `hasContent` expression exactly for create mode (its own comment at `:136-139` says isDirty is "edit-mode"). Either gate the button on `isDirty || hasContent`-style logic, or convert the first effect to a skip-first-render pattern. **Note for C9b:** the shipped component tests work around this bug by passing `initialData={{}}` (`frontend/tests/component/AfterActionForm.test.tsx:375,399` and others) — they will keep passing after the fix; the plan should ADD create-mode (no `initialData`) tests rather than expect flips.

**Is publish role-gated?** Yes, on both sides, with a mismatch:

- Client precedent: `after-actions/$afterActionId.tsx:85` — `canPublish = ['supervisor','admin'].includes(user?.role || '')` (role from `useAuth`, unified on `public.users.role`).
- Server: `supabase/functions/after-actions-publish/index.ts:60-71` — allows `['staff','supervisor','admin']`; returns 403 otherwise.
- The engagement route should compute `canPublish` the same way the detail page does (or match the server's wider set — an explicit open question, see Assumptions Log A2).

**Publish-from-create shape:** `after-actions-create` hardcodes `publication_status: 'draft'` (`supabase/functions/after-actions-create/index.ts:134`) regardless of what the client sends — the route's current `publication_status: 'draft'` spread (`after-action.tsx:85`) is decorative. So `onPublish` in create mode must be a two-step: `useCreateAfterAction().mutateAsync(...)` then `usePublishAfterAction().mutateAsync({ afterActionId: created.id, isConfidential })` (`frontend/src/hooks/usePublishAfterAction.ts:19-22` invokes `after-actions-publish`). Both hooks exist and handle invalidation; no new data-layer code needed.

**In-scope D-08 violations in these files:** `after-action.tsx:103` — `toast.error((err instanceof Error ? err.message : null) ?? t('afterActions.saveFailed'))` renders raw server messages; same pattern at `$afterActionId.tsx:109`. Both are named by D-08.

### 2. WRITE-02 — the list embed and the detail i18n key

**Which table holds the FK — derived from the live catalog, and the answer is NONE:**

```sql
-- staging zkrcjzdemdmwhearhfgg, 2026-08-16
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'public.after_action_records'::regclass and contype = 'f';
-- → exactly 5 rows, ALL "REFERENCES auth.users(id)" (created_by, updated_by,
--   published_by, edit_requested_by, edit_approved_by).
-- NO FK on engagement_id. NO FK on dossier_id.
```

`engagement_id` and `dossier_id` are both `uuid NOT NULL` columns with no constraint. Therefore **both** embeds at `supabase/functions/after-actions-list-all/index.ts:89-90` — `engagement:engagements!inner (...)` AND `dossier:dossiers!inner (...)` — fail at PostgREST relationship resolution (PGRST200 "could not find a relationship"), the fn returns `500 { error: error.message }` (`:104-108`), and the list surface (`routes/_protected/after-actions/index.tsx:14` → `useAfterActionsAll` → `AfterActionsTable` with an `error` prop) renders its error state. The filed text ("repoint at the table that holds the FK") presumed a FK exists somewhere; it does not.

**Two additional facts that constrain the fix:**

- `public.engagements` (5 rows) has columns `id, engagement_type, engagement_category, location_en, location_ar, is_seed_data` — **no `title_en`, `title_ar`, or `engagement_date`**. Even with a FK, the current select list is invalid against it.
- The live `after_action_records` row (1 row: `905b6a3a…`) has `engagement_id = dossier_id = 7c0d830b…`, which exists in `public.dossiers` (type `engagement`, `name_en` "Bilateral engagement with ONS — census methodology exchange") AND in `public.engagements`, but NOT in `engagement_dossiers`. Titles live on `dossiers.name_en/name_ar`; dates on `engagement_dossiers.start_date` (that extension row is missing for this id — the P93 degraded-state class).

**The fix shape (Claude's discretion per CONTEXT, but constrained):** CONTEXT.md §Integration points states "The `42P17` policy fix is the only schema-level change in the phase" — which forecloses adding FKs by migration. The remaining option is restructuring the edge fn: query `after_action_records` alone, then batch-fetch `dossiers` by the collected `engagement_id`/`dossier_id` sets (`.in('id', ids)` — the established `aa_commitments`-no-FK precedent from project memory), and compose the join in code, emitting `engagement: null` / `dossier: null` for misses so the frontend can render the D-13 named degraded state instead of hiding the row. The response shape consumed by the frontend is `AfterActionRecordWithJoins` (`frontend/src/hooks/useAfterAction.ts:130-142`: `engagement.title_en/title_ar/engagement_date`, `dossier.name_en/name_ar`) — the planner must either keep that shape (sourcing `title_*` from `dossiers.name_*`, `engagement_date` from `engagement_dossiers.start_date` where present) or change hook + table together (C9b: `useAfterActionsAll.test.ts` asserts the invoke contract, mocked). **D-19 applies: this is an edge-function fix — redeploy or it has not happened.**

**The detail-page i18n key, derived precisely:**

- Call site: `after-actions/$afterActionId.tsx:65` — `t('afterActions.loadError')` with bare `useTranslation()`.
- The i18n init registers `translation: enCommon` / `translation: arCommon` (`frontend/src/i18n/index.ts:274,410`) — the default namespace IS `common.json`. `common.json` contains a 228-key `afterActions` subtree, **key-set equal in EN and AR**, so most dot-form `afterActions.*` calls on this page RESOLVE (e.g. `publishSuccess` = "After action published successfully" / "تم نشر ما بعد الإجراء بنجاح").
- **Missing from that subtree in BOTH locales:** `loadError`, `notFound`, `notFoundDescription`, and the whole `conflict.*` group — exactly the keys this page renders at `:65`, `:77-78`, `:106`, `:166-167`, `:179` (the conflict ones survive on inline English defaults, an AR-04a mask). So the raw key `afterActions.loadError` reaches the screen whenever the query errors.
- A separate `after-actions-page` namespace exists (registered `index.ts:384,520`) with only 9 keys (`error.list` among them) — used by the list route.
- The D-10-compliant fix: author the missing keys under `afterActions` in `common.json` EN+AR (preserving key-set equality) and convert the repaired call sites to colon form `t('common:afterActions.loadError')`; or move detail-error copy into `after-actions-page`. Either satisfies D-10; adding the key while keeping the dot form is the trap CONTEXT names.
- `:109` — the raw `err.message` preference over `t('afterActions.publishFailed')` — is the D-08 half; the fallback key EXISTS (verified above), it is simply nearly dead because the raw message wins.

### 3. WRITE-03 — the intake picker vs the schema

**The exact fields:** the picker writes RHF field **`dossierId`** (`frontend/src/components/intake-form/IntakeForm.tsx:82` — `setValue('dossierId', firstDossier.id)`), and the Zod schema reads **`dossierId`** (`:53`). **They are the same field — the filed field-name-mismatch mechanism is measured FALSE.** Downstream is also correct: `useCreateTicket` maps `dossier_id: data.dossierId` (`frontend/src/domains/intake/hooks/useIntakeApi.ts:60`) and `intake-tickets-create` accepts `dossier_id` (`supabase/functions/intake-tickets-create/index.ts:13,209`; `intake_tickets.dossier_id` exists — live catalog).

**The real mechanism, proven:** `:53` is `dossierId: z.string().uuid({ message: tDossier('validation.dossier_required') })`, and the installed **zod 4.3.6** enforces RFC-9562 version/variant bits in `.uuid()`. Live staging census: **35 of 44 dossiers have non-RFC ids** (version nibble 0). OECD is `b0000001-0000-0000-0000-000000000005` → run against the installed zod: **FAIL "Invalid UUID"** (while `7c0d830b…` PASSES). The Zod failure message is `dossier-context:validation.dossier_required` = EN "At least one dossier is required" / AR "مطلوب ملف واحد على الأقل" (`i18n/{en,ar}/dossier-context.json:121`), rendered at `:370` — while the badge at `:373-389` renders from the separate `selectedDossiers` React state. That is the exact "Linked to: OECD" + "At least one dossier is required" coexistence.

**Fix + secondary defect:** relax `:53` to a non-`.uuid()` string check (`z.string().min(1, …)` — project precedent: "never `.uuid()` a dossier id", Phase 86). Secondary: `setValue('dossierId', …)` at `:82/:85` passes no `{ shouldValidate: true }` (unlike `requestType`/`urgency` at `:192-195`, `:333-336`) — after one failed submit, picking a dossier leaves the stale error until the next submit. Add the option. **Consumers of either name:** `frontend/tests/component/IntakeForm.test.tsx` mocks `DossierSelector` (`:13-16`) and `useIntakeApi` but exercises the REAL schema ("zod blocks submit" test at `:49`) — a real oracle for the schema change; extend it with a non-RFC-uuid acceptance case. `IntakeFormData.dossierId?: string` (`frontend/src/types/intake.ts:64`) needs no change.

**What falls outside:** the dev-only "Fill with Mock Data" flow (`:457-478`) never sets `dossierId` — even post-fix it submits nothing until a dossier is picked (correct). Attachments are honestly disabled (`:402-410`). The `onSubmit` catch only `console.error`s but an inline error box on `createTicketMutation.isError` exists (`:435-439`) — verified valid in a prior sweep.

### 4. WRITE-04 — is the per-card droppable predicate expressible in `@dnd-kit/core@6.3.1`?

**YES — with the installed version's own types as evidence:**

```typescript
// frontend/node_modules/@dnd-kit/core/dist/hooks/useDroppable.d.ts
export interface UseDroppableArguments {
  id: UniqueIdentifier
  disabled?: boolean // ← per-droppable disable, re-evaluated per render
  data?: Data
  resizeObserverConfig?: ResizeObserverConfig
}
// dist/index.d.ts line 3: export { …, useDraggable, useDndContext, useDroppable } from './hooks';
// store/types.d.ts: interface Active { id: UniqueIdentifier; data: DataRef; rect: … }
```

`useDndContext()` is a public export whose return includes `active` (the dragged item, with `data`). The working mechanism for candidate (b): in `BoardColumn.tsx:138` (currently `useDroppable({ id: stage })`), read the active drag via `useDndContext()` (or the provider's own `KanbanActiveDragContext` + `data` lookup — the provider already tracks `activeCardId`, `KanbanProvider.tsx:130`), and pass `disabled: stage === 'review' && activeItem?.source === 'commitment'`. dnd-kit excludes disabled droppables from collision candidates, so no `isOver` ring paints on `review` during a commitment drag. `useDroppable`/`DragEndEvent` are already re-exported from `@/components/kanban` (`index.ts`); `useDndContext` must be added to that barrel — `@dnd-kit/core` imports are ESLint-banned outside `components/kanban/*`.

**Two hazards the plan must state (measured, not speculative):**

1. **`closestCenter` retargets, it does not nullify.** `KanbanProvider.tsx:286` sets `collisionDetection={closestCenter}`. With the `review` column disabled, a pointer release over it resolves `over` to the nearest ENABLED droppable — the drop does not fail; it lands on a neighboring column. A user aiming at Review may silently move a commitment to In-progress or Done.
2. **Cards inside the review column are droppables of their own.** `KanbanCard.tsx:23` uses `useSortable({ id })` with no `disabled`; dropping a commitment onto a task card sitting in Review yields `over` = that card, and `WorkBoard.tsx:299-302` resolves the target stage from the over-card → `review` → the mutation fires. Disabling the column alone does NOT make review unreachable. (`@dnd-kit/sortable@10.0.0` supports `disabled?: boolean | { draggable?, droppable? }` — `useSortable.d.ts:7` — so card-level droppable-disable IS also expressible, at the cost of plumbing a prop through `KanbanCard`.)

**Consequence (matches the ruling's own hedge):** (b) is expressible and worth doing for the affordance honesty, but **(a) — the mutation-layer reject — is the load-bearing guarantee** either way. The reject belongs in the `source === 'commitment'` branch of `useUnifiedKanbanStatusUpdate` (`useUnifiedKanban.ts:371-384`, currently writes `newStatus` raw), mirroring `mapToValidIntakeStatus` (`:303-327`) — a commitment mapper with an explicit reject for `review` (and an explicit decision for `overdue`, which is DB-owned; the mapper should never write it). The bilingual reject key (RULING-P94-01 order 1: i18n key, `role="alert"`, EN+AR) lands in `unified-kanban.json` (registered both locales, `i18n/index.ts:287`). The current `onError` toast (`useUnifiedKanban.ts:481-485`) has BOTH a hardcoded English title (`'Failed to update status'`) and `description: error.message` — the in-scope D-08 violation.

**D-05's no-op guard fix:** `WorkBoard.tsx:305` — `targetStage === item.workflow_stage` → compare `targetStage === resolveBoardStage(item)` (`:92-106`), which is the same function that placed the card.

**D-03 re-derivation (ordered by CONTEXT, performed 2026-08-16 by this research):** `aa_commitments_status_check` = `CHECK ((status = ANY (ARRAY['pending','in_progress','completed','cancelled','overdue'])))` — five values, confirmed. Triggers on `aa_commitments`, live: `commitment_overdue_check` (BEFORE UPDATE, every row), `commitment_status_audit` (BEFORE UPDATE OF status WHEN distinct), `set_aa_commitments_updated_at`, `sync_commitment_dossier_link` (AFTER INSERT/UPDATE OF dossier_id).

**Oracle constraints from D-03c (restated so no plan misses them):** the optimistic cache update (`useUnifiedKanban.ts:423-468`) applies the CLIENT's intended status; `onSettled` refetches (`:490`) and the server row may read `overdue` — so the card visually snaps back after a success toast for 8 of 10 staging commitments. Any persistence oracle must (i) write-then-READ-BACK the stored row, (ii) pick its fixture card by `due_date >= CURRENT_DATE` (or create one) to avoid the trigger, and (iii) never assert "no error" as success.

### 5. WRITE-05 — the `/settings` population, derived

`/settings` is a layout route (`routes/_protected/settings.tsx`): exact match renders `SettingsPage`; otherwise `<Outlet/>`.

**Population A — `SettingsPage` sections (the in-page "tabs", `SettingsLayout` nav):** 9 sections (`SettingsPage.tsx:358-415`): `profile`, `general`, `appearance`, `notifications`, `email-digest`, `integrations`, `accessibility`, `data-privacy`, `security`. ONE shared Save (`handleSave` → `saveMutation`) covers profile+general (the `users` write), the 8 notification toggles (bridge), and local-only fields; `appearance` is applied client-side in `onSuccess` (`setColorMode`, `:292-301`); `email-digest`/`integrations` sections embed components with their own save paths; `data-privacy` and `security` have no field writes through this mutation (`mfa_enabled` deliberately not written, comment at `:209-210`).

**The one broken save path, mechanism verified live:** `:211` `.upsert({ id, full_name, job_title_en, department, phone, avatar_url, language_preference, timezone, updated_at })` — no `email`. Live catalog: `users.email` is `NOT NULL` with **no default**; PostgREST upsert is `INSERT … ON CONFLICT DO UPDATE`, and the NOT NULL check on the INSERT tuple fires before conflict resolution → 23502, every Save, even for existing rows. (Belt-and-suspenders: the INSERT RLS policy `users_insert_trigger_or_service_role` would also deny a client insert.) The D-14 fix `.update(…).eq('id', user.id)` passes the live `users_update_self` UPDATE policy (`auth.uid() = id`, USING + WITH CHECK — verified in `pg_policies`). The repair comment at `:206-210` describes the PRIOR 23-column defect — CONTEXT's warning that the file "looks fixed and is not" is confirmed. D-15: steps 2–3 (`:225-280`, the category-prefs bridge and `writeLocalSettings`) are correct and unreachable; `notification_category_preferences` exists live (RLS on, 3 policies, `onConflict: 'user_id,category'` matches). **In-scope D-08 violation:** the mutation's `onError` (`:314-320`) puts raw `error.message` into the toast description.

**Population B — child routes under `/settings/` (6 files):**

| Route                         | Component                 | Save path                                                                                       | Status                       |
| ----------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------- |
| `/settings/calendar-sync`     | `CalendarSyncSettings`    | `useCalendarSync` hooks → `external_calendars` (live, RLS+2 policies)                           | not individually verified    |
| `/settings/email-digest`      | `EmailDigestSettings`     | upsert `email_notification_preferences` (`EmailDigestSettings.tsx:156`; table live, 3 policies) | not individually verified    |
| `/settings/integrations`      | `BotIntegrationsSettings` | update/delete `bot_user_links` (`:108,115`; table live, 1 policy)                               | not individually verified    |
| `/settings/notifications`     | `NotificationPreferences` | `useNotificationCenter` + `useEmailPreferences` (same category-prefs table as the bridge)       | prior fix precedent (PR #40) |
| `/settings/webhooks`          | `WebhooksPage`            | `useWebhooks` hooks → `webhooks` (live, 8 policies)                                             | not individually verified    |
| `/settings/calendar/callback` | OAuth callback            | n/a (redirect handler)                                                                          | outside "tab saves"          |

**Stated population for the criterion (D-16):** the criterion's honest population is **Population A's save-bearing surfaces through the one shared Save** (profile, general, notifications toggles + the localStorage-persisted fields, with appearance applied on success), because that is the single broken path the audit found; Population B surfaces each have their OWN save paths against live RLS-enabled tables and were NOT part of the filed defect. The plan must either include a per-child-route save oracle (expensive: OAuth flows, bot links need external state) or explicitly exclude Population B with this reasoning. **What falls outside either population:** `/settings/calendar/callback` (no save affordance), `security` (MFA enablement deliberately out per D-6 comment), `data-privacy` (action buttons, not saved values).

### 6. WRITE-06 — the recursion, live, and the field-name contract

**The exact SELECT policies (live `pg_policies`, staging, 2026-08-16):**

- `custom_reports` — "Users can view their own reports" (SELECT): `created_by = auth.uid() OR access_level = 'public' OR access_level = 'organization' OR auth.uid() = ANY (shared_with) OR EXISTS (SELECT 1 FROM report_shares WHERE report_shares.report_id = custom_reports.id AND report_shares.shared_with = auth.uid())`
- `report_shares` — "Users can view shares for their reports" (SELECT): `shared_with = auth.uid() OR shared_by = auth.uid() OR EXISTS (SELECT 1 FROM custom_reports WHERE custom_reports.id = report_shares.report_id AND custom_reports.created_by = auth.uid())`
- Also recursive on the write side: `custom_reports` UPDATE policy's edit-permission EXISTS over `report_shares`; `report_shares` INSERT WITH CHECK and DELETE both EXISTS over `custom_reports`; `report_executions` SELECT/INSERT both EXISTS over `custom_reports`.

**The cycle:** evaluating `custom_reports`' SELECT qual runs a subquery on `report_shares`, which applies `report_shares`' SELECT policy, whose qual runs a subquery on `custom_reports`, which re-applies `custom_reports`' SELECT policy → Postgres raises `42P17 infinite recursion detected in policy`. (Live reproduction as `authenticated` was not possible through the Management API — `SET ROLE authenticated` is denied to its user; the behavioural evidence stands on Phase 93's record: every `93-report-notfound` run took the rejection arm, `REQUIREMENTS.md` §ARMA-01.)

**Candidate fixes, each judged against D-22 (must NOT widen the visible row set):**

1. **RECOMMENDED — break one direction with a `SECURITY DEFINER` owner-check helper.** Replace the EXISTS inside `report_shares`' SELECT (and its INSERT/DELETE quals) with `is_report_owner(report_id)` — `SECURITY DEFINER, STABLE, SET search_path = ''`, body: `SELECT created_by = auth.uid() FROM public.custom_reports WHERE id = $1`. The definer bypasses `custom_reports` RLS **only to read `created_by` of one row and compare it to the caller** — semantically identical to the current predicate's intent, so the row set is unchanged by construction. Once `report_shares` policies no longer reference `custom_reports`, every path terminates (custom_reports → report_shares → helper → done). Precedent in this schema: `get_user_clearance_level` (`20260614000001_p68_clearance_canonical.sql`).
2. **Cheaper but invariant-dependent — delete the owner-EXISTS from `report_shares`' SELECT.** The INSERT WITH CHECK forces `shared_by = auth.uid() AND owner(auth.uid())` — i.e., `shared_by` is always the owner — making the owner-EXISTS redundant with `shared_by = auth.uid()`. Verified on data: 0 rows in both tables (nothing to violate). Risk: the invariant is enforced only by the current INSERT policy; a future policy change silently narrows owners' visibility. Also does NOT fix the `custom_reports` UPDATE-policy recursion or `report_executions` on its own.
3. **REFUSED by D-22 unless asserted two-sided — a broad `SECURITY DEFINER` view or dropping the share-based clause from `custom_reports`.** The first can widen (definer view bypasses RLS for all readers), the second narrows (shared-with-me reports disappear).

Whatever the shape: **one migration file via Supabase MCP (D-21)**, and the D-22 oracle needs fixtures — both tables hold **0 rows** on staging, so the "user B sees only shared rows, user C sees none" assertion requires creating a report as A, a share to B, then reading as B and C (two accounts — note `E2ECRED-01`/D-27: only `TEST_USER_*` is provisioned; a second seat may need the service-role client asserting through PostgREST with explicit user JWTs, or the criterion's negative half parks — see Open Questions Q3).

**The `type` vs `template` contract, pinned on both sides:**

- Client: `frontend/src/pages/reports/ReportsPage.tsx:186` — `supabase.functions.invoke('reports', { body: { template: templateId, format, parameters: params } })`.
- Function: `supabase/functions/reports/index.ts:258` — `if (!body.type || !body.format)` → 400 "Report type and format are required". Every generate from `/reports` 400s today.
- **Hazard the criterion wording must absorb:** the `reports` POST handler is a **mock** — it returns `202 { job_id, status: 'pending' }` from a `setTimeout` that only `console.log`s (`:266-285`), and the client `onSuccess` reads `data.url` (`:202`) which is never returned, marking a fabricated 'completed' entry. Renaming `template`→`type` (or vice versa) makes the 400 disappear and produces a **confident lie** — the exact class this milestone kills. "A report generates" honestly means either wiring the real path (the `custom-reports` fn's execution flow, or the Express `/report-builder/generate` path in `misc.repository.ts:125`) or scoping the criterion to the surface that IS real: `custom-reports` CRUD + schedules. See Open Questions Q2 — this is a criterion-wording decision the planner must make explicitly.
- Scheduled reports: `report_schedules` policies are self-contained (no recursion), but the create flow's report picker `useAvailableReports` (`frontend/src/hooks/useScheduledReports.ts:224-227`) SELECTs `custom_reports` → 42P17 today → fixing the policies unblocks it. `custom_reports` has 0 rows, so the schedule oracle must create a report first (the `custom-reports` fn insert at `index.ts:511` works once the policy fix lands — its `.select()` return path evaluates the SELECT policy).

### 7. AUDIT-DROP-01 / AUDIT-ZERO-01 — columns, populations, RLS

**`public.audit_log` (singular — backend), re-derived live 2026-08-16:**
`id (default gen_random_uuid), tenant_id uuid NOT NULL (no default), entity_type varchar NOT NULL, entity_id uuid NOT NULL, action varchar NOT NULL, user_id uuid NOT NULL, timestamp timestamptz NOT NULL (default now()), old_values jsonb, new_values jsonb, ip_address inet, user_agent text, session_id varchar, additional_context jsonb`. 75 rows. RLS ON; INSERT policy allows `authenticated` (`with_check true`), SELECT `authenticated`.

- The broken site, verbatim (`backend/src/services/auth.service.ts:846-856`): inserts `{ user_id, action, resource_type, details, timestamp }` via `supabaseAdmin`, inside try/catch → `logError` only. `resource_type`/`details` are not columns (PGRST204), so it has never written a row.
- **The filed fix is INCOMPLETE:** mapping `resource_type→entity_type`, `details→additional_context` still fails on **`tenant_id` and `entity_id` — NOT NULL, no defaults**. The only successful writers today are DB triggers (`audit_trigger_function`, attached to 11 tables) which take `NEW.tenant_id` from the audited row. Security events have no audited row; `users` has only `default_organization_id`, `profiles` only `organization_id` — **no tenant column anywhere on the user side**. Live tenants in the table: `b0000000-…aaaa` (66 rows, the seed tenant), plus two others. The tenant source for backend security events is an open planning decision (Assumptions Log A3); `entity_id` can honestly be the subject user's id.
- `supabaseAdmin` is service-role → RLS is not a factor for this writer.

**`public.audit_logs` (plural — edge), re-derived live 2026-08-16:**
`id, entity_type NOT NULL, entity_id NOT NULL, action NOT NULL, old_values, new_values, user_id NOT NULL, user_role NOT NULL (no default), ip_address, user_agent, required_mfa NOT NULL default false, mfa_verified NOT NULL default false, mfa_method, correlation_id, session_id, created_at default now()`. **0 rows.** RLS ON with 3 policies: INSERT `with_check (system_operation('any') OR user_id = auth.uid())` — where `system_operation` = "JWT role claim is service_role"; SELECT gated to auditors/admins/self-view; a service-role ALL bypass.

- **RLS consequence for the fix:** a JWT-scoped edge client can only insert rows whose `user_id = auth.uid()`; a service-role client (several fns use `supabaseAdmin`) passes unconditionally. The shared helper must take `user_id` as the caller's uid (and `user_role` is NOT NULL — the helper must fetch or receive it).

**AUDIT-ZERO-01 population, RE-DERIVED and WIDENED (D-20):**

_Population definition:_ files under `supabase/functions` whose source matches `from('audit_logs')` **or** `from("audit_logs")` (the filed derivation was single-quote-only — a live instrument bias caught during this research), with an `.insert(`/`.upsert(` chained within 900 chars; top-level object-literal keys diffed against the live column set.

_Result:_ **38 files match; 36 are writers; 27 broken; 9 clean; 2 read-only.**

| Verdict           | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BROKEN (27)**   | activate-account, approve-role-change, assign-role (representative, `index.ts:244`), assignments-manual-override, attachments-delete, auth-biometric-setup, auth-refresh-token, auth-step-up-complete, auth-step-up-initiate, certify-user-access, commitments-update-status, complete-access-review, create-user, deactivate-user, engagements-positions-attach, engagements-positions-detach, generate-access-review, inactive-users, initiate-password-reset, notifications-register-device, positions-unpublish, push-device-register, reactivate-user, reset-password, schedule-access-review, setup-mfa, verify-mfa-setup |
| **CLEAN (9)**     | auth-verify-step-up, delegate-permissions, intake-classification, intake-tickets-assign, intake-tickets-create, intake-tickets-get, intake-tickets-triage, intake-tickets-update, revoke-delegation                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **READ-ONLY (2)** | dossier-export-pack (`:1205`, timeline select), intake-audit-logs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

Bad-key classes observed (per-file lists preserved in the derivation): `event_type`/`resource_type`/`resource_id`/`target_user_id`/`metadata`/`changes`/`after` (the 20-file class REQUIREMENTS named), plus `details` (5 files), `actor_id` (2), `changed_by`, `assignee_id`/`override_reason`/`wip_status`/`capacity_warning` (assignments-manual-override).

_Blind spots — carried forward, partially closed:_ RPC-mediated audit writes: **searched, none found** (`rpc(…audit` → 0 matches). `.upsert()`: included in the scan (0 upsert sites found). Still outside: payloads built as variables and spread (`.insert(payload)` with keys assembled elsewhere — the parser reads literal objects only), and nested-key validation (moot for jsonb columns).

**A writer OUTSIDE both filed populations, found by this research:** `backend/src/services/mou.service.ts:636-645` (`logStateTransition`) inserts into `audit_logs` (plural, from the backend) with key `changes` (not a column) and no `user_role` (NOT NULL) — awaited without destructuring `error` → silent drop, same class. `backend/src/api/mous.ts:419` is a SELECT (timeline). `link.service.ts` writes `link_audit_logs` — a different table, outside this phase. The plan must include `mou.service.ts` or exclude it in writing.

**Helper shape (constrained by D-17):** two helpers, not one — the tables' shapes and runtimes differ (backend TS + `audit_log` + tenant question; Deno `_shared/audit.ts` + `audit_logs` + user_role/RLS question). No shared audit helper exists today in `supabase/functions/_shared/` (16 helpers, none audit). **D-19: every one of the 27 repaired functions must be redeployed** — a deploy round on the P92 precedent (139 deploys), with `scripts/probe-edge-auth.sh` as evidence instrument.

### 8. C9b consumer sweep — candidates and triage

_Roots derived, not named:_ `./tests`, `./e2e/tests`, `./frontend/tests`, `./backend/tests` (the GATE-STANDARD derivation), **plus colocated `frontend/src/**/**tests**/`and`backend/src/**/**tests**/`** — the standard's `find -maxdepth 3 -type d -name tests` structurally misses ~48 colocated `__tests__` dirs; this sweep added them (a C9b population-definition gap worth a line in the plan).

_Instrument notes from this derivation (record so no gate repeats them):_ (1) On this machine the interactive shell is **zsh** — unquoted `$ROOTS` does NOT word-split, so the GATE-STANDARD script silently searches a single nonexistent multi-line path and **fails open** (C9b instance-2 class). Gates must run the script under `bash` explicitly. (2) `grep` resolves to **ugrep** here — warnings differ from BSD/GNU grep; and the standard's sed escape line is broken on macOS (`GATESTD-01`) — this sweep used the fail-closed unsafe-id rejection instead, which flagged `auth.service`, `mou.service`, `93-report-notfound.spec` for hand triage (all triaged below). (3) tickmarkr gates run `bash -lc` where Node resolves to 20.11.1 (below the repo's engines floor) — gate commands must not invoke node-version-sensitive tooling bare.

**Candidate table (triaged — the script narrows, it does not answer):**

| Modified file                                           | Consumer(s)                                                                                                                                        | Mock vs real                                                                                                      | Triage                                                                                                                                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AfterActionForm.tsx`                                   | `frontend/tests/component/AfterActionForm.test.tsx`                                                                                                | REAL component, children + i18n mocked                                                                            | Renders the form, asserts Save/Publish enable/disable. Shipped tests dodge the bug via `initialData={{}}` (`:375,:399`) — expected to KEEP passing; plan adds create-mode cases in the same task                        |
| `engagements/$engagementId/after-action.tsx`            | `frontend/tests/e2e/log-after-action.spec.ts`, `after-action-create.spec.ts`, `ai-extraction.spec.ts`, a11y specs                                  | REAL (Playwright, frontend config, `TEST_USER_*` globalSetup)                                                     | Real-app consumers of the route DOM; run before/after (their current red/green status is unmeasured — part of the E2ESTALE ambient condition)                                                                           |
| `after-actions/$afterActionId.tsx`                      | `frontend/tests/e2e/after-action-publish.spec.ts`                                                                                                  | REAL (Playwright)                                                                                                 | Publishes via the detail page; the i18n/colon-form fix could touch strings it asserts — check its locators in-plan                                                                                                      |
| `useAfterAction.ts` / list-all fn                       | `frontend/src/hooks/__tests__/useAfterActionsAll.test.ts`                                                                                          | **MOCKED** (`supabase` mocked, asserts invoke name + body)                                                        | **NON-ORACLE** for the server fix; flips only if the hook's invoke contract changes — if the response shape changes, update in same task                                                                                |
|                                                         | `frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx`                                                                       | REAL component                                                                                                    | Asserts the table incl. `error` prop rendering — an oracle for the degraded-state render if the list shape changes                                                                                                      |
| `IntakeForm.tsx`                                        | `frontend/tests/component/IntakeForm.test.tsx`                                                                                                     | REAL schema, mocked selector + API                                                                                | Real Zod oracle; the "zod blocks submit" case must survive; add a non-RFC-uuid pass case                                                                                                                                |
| `WorkBoard.tsx` / `BoardColumn.tsx`                     | `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx`, `BoardColumn.test.tsx`, `KCard.test.tsx`                                              | WorkBoard.test **mocks `@/components/kanban` AND `useUnifiedKanban`** (captures `onDragEnd` at the boundary)      | The `handleDragEnd` no-op-guard change is directly exercised through the captured `onDragEnd` with mocked `mutate` — REAL oracle for D-05; will need updating in the same task (currently items carry `workflow_stage`) |
| kanban primitives (`KanbanBoard/Card/Provider`, barrel) | `frontend/src/components/kanban/__tests__/*` (3 files)                                                                                             | REAL components                                                                                                   | Extending props (droppable disable) must keep these green; extend in same task                                                                                                                                          |
|                                                         | `frontend/tests/e2e/kanban-render.spec.ts`, `kanban-a11y.spec.ts`, `tasks-tab-dnd.spec.ts`, `tasks-tab-keyboard.spec.ts`, `tasks-tab-a11y.spec.ts` | REAL (Playwright)                                                                                                 | Selector contract: `section.col`, `.col-head`, `data-droppable-id` (BoardColumn comment `:11-14`) — do not rename these hooks                                                                                           |
|                                                         | `frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts`                                                                                             | REAL                                                                                                              | Already half-red by DATA (`P52FIXTURE-01`, Phase 102) — a red here is pre-existing; do not chase                                                                                                                        |
| `SettingsPage.tsx`                                      | `frontend/tests/e2e/settings-page.spec.ts`                                                                                                         | REAL                                                                                                              | Asserts layout/nav CSS only — mutation fix unlikely to flip; named non-consumer of the save path                                                                                                                        |
|                                                         | `tests/e2e/92-signout.spec.ts`                                                                                                                     | REAL (root config — **`--no-deps` + inline auth required**, D-26/D-27)                                            | Uses /settings for sign-out; unaffected by the save fix in principle; named                                                                                                                                             |
| `reports/index.ts` (edge fn) + `ReportsPage.tsx`        | `backend/tests/contract/reports-generate.test.ts`, `reports-schedule.test.ts` etc.                                                                 | Contract tier — routed to the **non-required integration job** (`vitest.integration.config.ts`); many are ancient | Treat as NON-ORACLES unless individually shown green pre-phase; the `reports` identifier is a common-noun flood (50+ files matched) — only these two assert the generate/schedule contracts                             |
| `auth.service.ts`                                       | `backend/src/services/__tests__/auth.service.test.ts`                                                                                              | **NEVER RUNS** — colocated under `backend/src`, outside every vitest `include` glob (tests/CLAUDE.md)             | NON-ORACLE; the plan's new audit-write test must live under `backend/tests/`                                                                                                                                            |
| `mou.service.ts`                                        | none found (`logStateTransition` unreferenced in any test root)                                                                                    | —                                                                                                                 | No shipped consumer                                                                                                                                                                                                     |
| `tests/e2e/93-report-notfound.spec.ts`                  | itself (ARMA-01's subject)                                                                                                                         | REAL                                                                                                              | See §ARMA-01                                                                                                                                                                                                            |
| i18n `common.json` / `unified-kanban.json`              | key-set-equality gate (`scripts/check-i18n-namespaces.mjs` runs in `pnpm lint`); Phase 93's equality pattern                                       | mechanical                                                                                                        | EN/AR key sets must stay equal — the `afterActions` subtree is equal today (228/228); keep it so                                                                                                                        |

**The class this sweep cannot see (stated per the rule):** tests coupled by DOM shape alone — `getByRole('alert')` + text, naming no identifier. Residual defence: run the shipped suites before phase close and read the reds (E2ESTALE-01 already inventories 6 pre-existing reds so they are attributable, not new).

### 9. ARMA-01 — the exact lines of arm (b)

`tests/e2e/93-report-notfound.spec.ts` (96 lines, read in full). Arm (b) consists of, exactly:

- **Comment half:** lines 11–28 — the "HONEST DISJUNCTION" block; specifically lines 17–21 define arm (b) and lines 27–28 are the standing instruction ("PHASE 94 TIGHTENS THIS: once the policy recursion is fixed, delete arm (b) and assert the 404 arm only").
- **Code half:**
  - line 74: `const queryErrorState = page.getByTestId('query-error-state')` — arm (b)'s locator;
  - lines 77–82: the `expect.poll` summing `notFoundPage.count() + queryErrorState.count()` — the disjunction itself;
  - lines 85–90: the arm-recording block, whose line 88 is the arm-b string (`'B: query-error-state (read rejected — 42P17/WRITE-06, Phase 94)'`).
- **NOT arm (b), keep:** line 65 (`crypto.randomUUID()` absent id), line 73 (`notFoundPage` locator), line 93 (the unconditional `builderHeading` conjunct), the inline auth (lines 36–55, D-27-compliant), and `RETRY_BACKOFF_TIMEOUT` (lines 39–44) — its rationale (retry ladder on rejection) becomes stale after the fix but the budget is harmless for a slow 404; the plan may retighten or keep with an updated comment.
- **The tightened form:** replace lines 74–90 with a direct `await expect(notFoundPage).toBeVisible(...)` (or `.poll` on `notFoundPage.count()` alone), delete the arm-b locator and annotation, and update the header comment. Ordered strictly AFTER the migration lands (D-02) — before it, the tightened spec reds for the right reason at the wrong time.

## Don't Hand-Roll

| Problem                            | Don't Build             | Use Instead                                                           | Why                                                                                               |
| ---------------------------------- | ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Commitment status mapping + reject | a new validation layer  | mirror `mapToValidIntakeStatus` (`useUnifiedKanban.ts:303-327`)       | the intake branch already proved the pattern: source-specific mapper, explicit unknown-key branch |
| No-op detection                    | a new stage comparator  | `resolveBoardStage(item)` (`WorkBoard.tsx:92-106`)                    | it is already the function that places the card                                                   |
| Error surfaces                     | new error markup        | Phase 93's `QueryErrorState` (D-11)                                   | `role="alert"`, bilingual, internal-string-free, already tested                                   |
| Settings notification writes       | a new prefs writer      | `applySettingsTogglesToCategoryPrefs` (unreachable, not wrong — D-15) | correct read-modify-write bridge exists at `SettingsPage.tsx:245-266`                             |
| Deploy evidence                    | ad-hoc curl loops       | `scripts/probe-edge-auth.sh`                                          | P92's proven instrument, D-19                                                                     |
| Owner checks inside RLS            | inline recursive EXISTS | `SECURITY DEFINER STABLE` helper with pinned `search_path`            | the `get_user_clearance_level` precedent; breaks 42P17 without widening                           |
| Cross-table fetch without FK       | PostgREST embeds        | batched `.in('id', ids)` second query                                 | the `aa_commitments`-no-FK precedent; `after_action_records` has no FK to embed through           |

## Runtime State Inventory

> Included because this phase changes deployed functions, live policies, and is oracled against live staging data.

| Category                         | Items Found                                                                                                                                                                                                                                                                    | Action Required                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Deployed edge functions          | `after-actions-list-all`, `reports`, + 27 broken audit writers + any `_shared/audit.ts` importers — deployed bundles ≠ source after the fix                                                                                                                                    | Redeploy each (D-19); probe evidence via `scripts/probe-edge-auth.sh`                                                         |
| Live DB policies                 | `custom_reports`/`report_shares` recursive SELECT/UPDATE/INSERT/DELETE quals (full text above); `report_executions` references `custom_reports`                                                                                                                                | One migration via MCP (D-21); re-derive `pg_policies` after                                                                   |
| Live triggers                    | `commitment_overdue_check` (BEFORE UPDATE, rewrites status), `commitment_status_audit`, `sync_commitment_dossier_link`, `audit_trigger_function` on 11 tables                                                                                                                  | None — code must coexist with them (D-03c); oracle fixtures must dodge the overdue trigger                                    |
| Staging data that shapes oracles | 8/10 commitments `overdue`, 2 past-due `pending`; `custom_reports`/`report_shares` **0 rows**; `after_action_records` 1 row (draft) whose `engagement_dossiers` extension row is missing; 35/44 dossiers non-RFC uuids; `audit_logs` 0 rows / `audit_log` 75 (trigger-written) | Oracles create their own fixtures or pin ids; report D-22 oracle must seed report+share; audit oracle asserts a NEW row lands |
| Secrets/env                      | `TEST_USER_EMAIL/PASSWORD` in `.env.test` (only working e2e credentials — `E2ECRED-01`); `ALLOWED_ORIGINS` Supabase secret governs edge CORS                                                                                                                                   | None changed by this phase; oracles use inline auth + `--no-deps` (D-27)                                                      |
| Build artifacts                  | none — no rename, no package change                                                                                                                                                                                                                                            | None                                                                                                                          |

## Common Pitfalls

1. **Asserting "no error" as drag persistence.** The trigger overwrites the write and the app toasts success (D-03c). Oracles read the row back and choose non-past-due fixtures.
2. **`closestCenter` + disabled droppable = retarget, not refusal.** A release over disabled `review` lands on the nearest enabled column; review-column CARDS are separate droppables. The mutation-layer reject is the guarantee; the visual predicate is UX.
3. **Fixing the i18n key but keeping the dot form** (D-10) — the key resolves today only because `afterActions` lives inside `common.json`; the class stays alive.
4. **Adding `email` to the upsert instead of switching to `.update()`** — would "work" but writes an auth-owned column from the client and violates D-14's explicit shape.
5. **Renaming `template`→`type` and calling WRITE-06's generate half done** — the fn's POST is a mock; the 202 is fabricated. Criterion wording must not let a rename close it.
6. **A single audit helper across both runtimes** — different tables, different NOT NULLs (tenant_id vs user_role), different RLS postures (D-17).
7. **Trusting the C9b script as shipped** — zsh word-split fails it open; run under `bash`, keep the fail-closed id guard, include colocated `__tests__` roots.
8. **Zod `.uuid()` anywhere near dossier ids** — 35/44 staging ids fail RFC checks; the project rule is standing.
9. **Playwright commands without `--no-deps`** against root-config projects — the `setup` project throws on six absent env keys (`E2ECRED-01`); `--list` counts dependency projects too (GATE-STANDARD C6).
10. **PostgREST embeds assumed from column names** — embedding requires a real FK; `after_action_records` has none. Verify `pg_constraint` before writing any `select('*, other(…)')`.

## Validation Architecture

### Test Framework

| Property                     | Value                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frameworks                   | Vitest (unit/component; jsdom frontend, node backend) + Playwright (E2E)                                                                                                                                                                                                                                                                                                                          |
| Configs                      | `frontend/vitest.config.ts` (includes `**/*.test.{ts,tsx}`, excludes `*.spec.*`); `backend/vitest.config.ts` (unit, required CI) vs `backend/vitest.integration.config.ts` (non-required); root `playwright.config.ts` (testDir `tests/e2e`, has `setup` dependency — **always `--no-deps`**); `frontend/playwright.config.ts` (testDir `frontend/tests`, globalSetup logs in with `TEST_USER_*`) |
| Quick run                    | `pnpm -C frontend exec vitest run <file>` / `pnpm -C backend exec vitest run <file>`                                                                                                                                                                                                                                                                                                              |
| Full suite                   | `pnpm test` (Turbo — pass `--continue`); E2E: `pnpm -C frontend test:e2e` and root `pnpm exec playwright test <specs> --no-deps`                                                                                                                                                                                                                                                                  |
| Known instrument constraints | tickmarkr gates run `bash -lc` (Node 20.11.1 < engines floor — avoid bare `node` in gates); root `tests/` vitest alias `@`→`<root>/src` is broken (`ROOTALIAS-01`, P101) — new unit tests for frontend files go under `frontend/`, not root `tests/`                                                                                                                                              |

### Phase Requirements → Test Map

| Req ID        | Behavior                                                                                              | Test Type                                                                      | Automated Command                                                                                                                                                                    | File Exists?                                                |
| ------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| WRITE-01      | Create-mode Save enables on content; publish wired                                                    | component + e2e                                                                | `pnpm -C frontend exec vitest run tests/component/AfterActionForm.test.tsx` (extend); `pnpm -C frontend exec playwright test tests/e2e/after-action-create.spec.ts`                  | ✅ component (extend); e2e exists, current color unmeasured |
| WRITE-02      | List renders rows incl. degraded join; detail shows translated error                                  | e2e / probe                                                                    | new spec or authenticated probe against deployed `after-actions-list-all` (assert 200 + row shape); detail: new spec forcing query error, assert no raw key                          | ❌ Wave 0                                                   |
| WRITE-03      | `/intake/new` submits with a non-RFC-uuid dossier                                                     | component + e2e                                                                | `pnpm -C frontend exec vitest run tests/component/IntakeForm.test.tsx` (extend with non-RFC id case)                                                                                 | ✅ (extend)                                                 |
| WRITE-04      | Commitment drag persists (read-back); review rejects with bilingual alert; own-column drop is a no-op | unit (mapper) + component (WorkBoard onDragEnd capture) + live read-back probe | `pnpm -C frontend exec vitest run src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` (update in-task); mapper unit test new; staging read-back via SQL probe                          | ✅ WorkBoard.test (update); ❌ mapper test Wave 0           |
| WRITE-05      | Save succeeds; users row + category prefs read back changed; survives reload                          | e2e + probe                                                                    | new `settings-save` spec (frontend config, real login) asserting reload persistence; SQL read-back of `users.full_name` + `notification_category_preferences`                        | ❌ Wave 0                                                   |
| WRITE-06      | No 42P17 on report reads; D-22 two-sided visibility                                                   | SQL probe + e2e                                                                | post-migration probe: authenticated PostgREST reads of `custom_reports` (200, not 500/42P17); fixture-based A/B/C visibility assertion; `93-report-notfound.spec.ts` tightened green | spec ✅ (tightened); probes ❌ Wave 0                       |
| AUDIT-DROP-01 | `logSecurityEvent` lands a row; failure surfaced                                                      | backend unit/integration                                                       | new test under `backend/tests/` (NOT colocated — colocated never runs) + staging row-count delta probe                                                                               | ❌ Wave 0                                                   |
| AUDIT-ZERO-01 | Repaired writers insert valid shape; deployed                                                         | probe + derivation                                                             | re-run the both-quote-styles key-diff derivation → 0 broken; post-deploy probe exercising one representative (e.g. assign-role) then `select count(*) from audit_logs` > 0           | derivation exists in this doc; probe ❌ Wave 0              |
| ARMA-01       | Spec asserts 404 arm alone and passes                                                                 | e2e                                                                            | `pnpm exec playwright test tests/e2e/93-report-notfound.spec.ts --no-deps` (expect 1 passed, count hardcoded per D-26)                                                               | ✅ (edited in-plan, after the migration)                    |

### Sampling Rate

- **Per task commit:** the touched file's quick vitest run + `pnpm -C frontend type-check`
- **Per wave merge:** `pnpm lint` (carries the i18n key-set gate) + affected Playwright specs with `--no-deps`
- **Phase gate:** full vitest suites green (E2E judged against the E2ESTALE-01 known-red inventory, not absolute green — that is Phase 101's criterion), gate drill, deploy probes

### Wave 0 Gaps

- [ ] Commitment-mapper unit test (new, beside `useUnifiedKanban`)
- [ ] `settings-save` reload-persistence spec (frontend Playwright)
- [ ] After-actions list/deta il error-state spec or probe
- [ ] Backend audit-write test under `backend/tests/`
- [ ] D-22 two-sided visibility probe with seeded report/share fixtures (needs the second-seat decision — Open Questions Q3)
- [ ] Deploy-probe checklist for the redeploy round (reuse `scripts/probe-edge-auth.sh`)

## Security Domain

> `security_enforcement` not set in config → treated enabled. Scoped to what this phase touches.

| ASVS Category               | Applies                                    | Standard Control in this phase                                                                                                                                     |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V4 Access Control           | **yes — the phase's sharpest risk (D-22)** | RLS policy rewrite must not widen `custom_reports`/`report_shares` visibility; `SECURITY DEFINER` helpers pinned `search_path`, owner-check-only; two-sided oracle |
| V5 Input Validation         | yes                                        | Zod stays the validator; relaxing `.uuid()` must not remove requiredness (`min(1)`); server-side validation in `intake-tickets-create` unchanged                   |
| V7 Error Handling & Logging | yes                                        | D-08: no `error.message` to users (three named in-scope sites); audit writes stop being silently dropped (AUDIT-DROP/ZERO), failures logged distinguishably        |
| V2/V3 Auth/Sessions         | no new work                                | Publish role checks already server-side (`after-actions-publish:60-71`); do not weaken                                                                             |
| V6 Cryptography             | no                                         | —                                                                                                                                                                  |

Known threat patterns: RLS-widening via careless `SECURITY DEFINER` (Tampering/Info-disclosure — mitigate per D-22 above); client-trusted role gating (mitigated: server re-checks publish role).

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                   | Section       | Risk if Wrong                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | The 42P17 fires behaviourally on staging for authenticated reads (not reproduced this session — `SET ROLE` denied via Management API; relied on Phase 93's observed rejection record + policy-text analysis) [ASSUMED, high-confidence] | WRITE-06      | If some reads already succeed, the migration's RED baseline differs; probe as `authenticated` via PostgREST before the migration lands     |
| A2  | The engagement route's `canPublish` should mirror the detail page (`['supervisor','admin']`) rather than the server's wider `['staff',…]` set [ASSUMED — consistency argument]                                                          | WRITE-01      | A staff user sees publish on one surface and not the other; pick one in the plan and say why                                               |
| A3  | `audit_log.tenant_id` for backend security events sources from the dominant seed tenant or the user's `default_organization_id` [ASSUMED — no tenant column exists user-side]                                                           | AUDIT-DROP-01 | Wrong tenant scoping of security events; needs a one-line product decision in the plan                                                     |
| A4  | Population-B settings surfaces (calendar-sync, email-digest, integrations, notifications, webhooks) currently save correctly [ASSUMED — tables + policies exist live; write paths not individually exercised]                           | WRITE-05      | If one is broken, the criterion "every tab saves" catches it late; the plan's population statement makes the exclusion explicit either way |
| A5  | The `frontend/tests/e2e/after-action-*.spec.ts` suite's current color (they predate this phase; E2ESTALE inventories other reds) [ASSUMED unknown]                                                                                      | C9b           | Before/after attribution requires a baseline run at phase-94-base                                                                          |

## Open Questions

1. **WRITE-02 fix shape needs a one-line ruling nod:** CONTEXT's "only schema-level change is the 42P17 fix" vs D-12's "repoint the embed at the table that holds the FK" — the live catalog shows no FK exists, so the letter of D-12 is unsatisfiable. Recommended: two-query rewrite inside the fn (no schema change). Alternative: add the two FKs by migration (contradicts the CONTEXT sentence; also `engagements` lacks the needed columns regardless).
2. **What does "a report generates" mean, given the `reports` POST is a mock?** Options: (a) scope the criterion to the real surface (`custom-reports` CRUD + schedules unblocked by the policy fix) and file the mock generate as a DEAD/Phase-95-class finding; (b) wire the generate path for real (bigger than a write-path fix). Recommendation: (a) — a fabricated 202 is the confident-lie class, and renaming the field alone must not close the criterion.
3. **D-22's negative assertion needs a second identity.** Only `TEST_USER_*` credentials exist (`E2ECRED-01` parks the rest). Candidate: assert via PostgREST using two seeded auth users' JWTs minted with the service-role key inside a throwaway probe (no operator act needed), or park the "user C sees none" half explicitly.
4. **Precondition-grade audit sites (D-18):** which of the 27 edge sites should FAIL the action when the audit insert fails (candidates: assign-role, create-user, deactivate-user — privileged mutations) vs log-and-continue. Per-site call the plan must state.

## Environment Availability

| Dependency                            | Required By                    | Available                                                                                  | Version          | Fallback                                           |
| ------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ | ---------------- | -------------------------------------------------- |
| Supabase CLI (authed, project linked) | edge deploys (D-19)            | ✓                                                                                          | 2.106.0          | MCP deploy                                         |
| Supabase MCP / Management API         | migration (D-21), live catalog | ✓ (Management API exercised this session; MCP present in executor sessions per house rule) | —                | Management API `database/query` (read-only proven) |
| Node/pnpm/Vitest/Playwright           | all oracles                    | ✓ (repo toolchain)                                                                         | pnpm 10.29.1 pin | —                                                  |
| psql                                  | direct DB                      | ✓ (client 14.23)                                                                           | —                | not needed                                         |
| Staging creds `TEST_USER_*`           | e2e oracles                    | ✓ (`.env.test`, names only)                                                                | —                | inline auth pattern (D-27)                         |
| E2E role creds (`E2E_*`)              | root `setup` project           | ✗ (`E2ECRED-01`)                                                                           | —                | `--no-deps` + inline auth — REQUIRED, not optional |

**Missing with no fallback:** none for this phase's criteria (E2E role creds are routed around by standing decision D-27).

## Sources

### Primary (HIGH confidence)

- Live staging `zkrcjzdemdmwhearhfgg` catalog queries, 2026-08-16, via Supabase Management API (`pg_constraint`, `information_schema.columns`, `pg_policies`, `pg_trigger`, `pg_proc`, row censuses) — every SQL-derived claim above
- Installed package types: `@dnd-kit/core@6.3.1` `useDroppable.d.ts` / `index.d.ts` / `store/types.d.ts`; `@dnd-kit/sortable@10.0.0` `useSortable.d.ts`; `zod@4.3.6` runtime execution (three-id proof)
- Repo source at `milestone/v10.0-trust` HEAD (`fe380206c`) — all `file:line` pins
- `.planning/phases/94-write-paths/94-CONTEXT.md`, `.planning/REQUIREMENTS.md` §WRITE/§ARMA-01, `.planning/GATE-STANDARD.md`, `.tickmarkr/overseer/PARK-P94.md`, `tests/CLAUDE.md`, `supabase/CLAUDE.md`, `frontend/CLAUDE.md`

### Secondary (MEDIUM confidence)

- `git log -L` provenance of the isDirty guard (`307485dd3`)
- Phase 93 behavioural record for the 42P17 rejection arm (every observed run took arm B)

### Tertiary (LOW confidence)

- None — no WebSearch used; no claim rests on training data alone except the two Zod/dnd-kit behavioural notes, both then verified against installed code

## Metadata

**Confidence breakdown:**

- WRITE-01/02/03/05, ARMA-01: HIGH — code read in full + live catalog + runtime proof
- WRITE-04: HIGH on expressibility and seams (types cited); MEDIUM on the exact UX of `closestCenter` retargeting (inferred from collision-detection semantics + provider code; the plan's oracle proves it, per the ruling's own demand)
- WRITE-06: HIGH on policies/contract; the 42P17 live reproduction is inherited evidence (A1)
- AUDIT: HIGH on columns/RLS/populations; the derivation script's literal-object limitation is stated

**Research date:** 2026-08-16
**Valid until:** staging-derived facts (row censuses, policy text) are volatile — re-derive at plan execution; code pins valid until the named files change (anchor gates to `phase-94-base` per C7)

## RESEARCH COMPLETE
