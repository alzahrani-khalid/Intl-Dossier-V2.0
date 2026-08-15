# Phase 93: Failure Visibility - Context

**Gathered:** 2026-08-15
**Status:** Ready for planning

<domain>
## Phase Boundary

**No surface renders a confident empty state over a request that failed.**

This phase makes failures _visible_. It does not make failing features _correct_. Those are different
jobs and the distinction decides several scope calls below: a page that errors honestly satisfies this
phase; a page that renders the right data is a later phase's business.

**In scope:** the frontend data layer's error propagation (`TRUST-01`); the four audited surfaces that
show confident emptiness over failure (`TRUST-02`); page-level not-found for well-formed-but-absent
IDs (`TRUST-03`); the degraded state for an engagement missing its extension row plus the
internal-string leak (`TRUST-04`); and the four defects Phase 92 unmasked and filed forward
(`DELEG-01`, `DR-42501`, `AUDIT-42703`, `PIN-2390-01`).

**Out of scope, explicitly:** seeding data so an empty screen becomes a populated one
(`SEED-DELEG-01`, Phase 102); choosing which relation the delegations model should read
(`DELEG-02`, Phase 102); rewriting the 11 `auth.users` RLS policies no Phase 93 criterion exercises
(`RLS-AUTHUSERS-01`, Phase 100); production deployment of anything (staging only, as in Phase 92).

</domain>

<decisions>
## Implementation Decisions

### Rejection propagation — how a failed query reaches the caller

- **D-01: Repositories propagate rejections by DELETING the swallow, not by introducing a result
  union.** The transport already throws: `frontend/src/lib/api-client.ts:111-118` — `apiGet` calls
  `handleResponse`, which throws `toApiError(response)` on a non-OK response. Every consumer reaches
  the data through TanStack Query, whose `isError` branch only fires on a **rejected** promise.
  Criterion 1's stated goal — _"so the `isError` branches already written in the pages stop being dead
  code"_ — is therefore satisfied by letting the rejection through and by nothing else. The global
  `{ ok } | { ok: false, error }` convention in `CLAUDE.md` is not applied here: its own second clause
  ("never mix exceptions and result unions within one API") forbids grafting a union onto an
  exception-based client, and converting the whole API surface is a refactor this phase did not ask
  for. Logging may stay; the `return` must go.

- **D-02: The `TRUST-01` population is defined as — every `catch` block on the frontend data path
  that converts a rejected request into a plausible SUCCESS value.** Derived mechanically over
  `frontend/src/{domains,hooks,services,lib,components,routes}`, 1,411 `.ts`/`.tsx` files: **12
  catch-and-return sites** (a `catch` body that returns without rethrowing). Of those, **6 are in the
  class**:

  <!-- prettier-ignore -->
  | site | what it fakes |
  | --- | --- |
  | `domains/analytics/repositories/analytics.repository.ts:13` | `{ data: null }` |
  | `domains/analytics/repositories/analytics.repository.ts:25` | `{ data: null }` |
  | `domains/analytics/repositories/analytics.repository.ts:37` | `{ data: null }` |
  | `domains/dossiers/hooks/useDossier.ts:683` | `emptyCounts` |
  | `domains/dossiers/hooks/useDossier.ts:738` | `0` |
  | `hooks/useWidgetDashboard.ts:726` | a zero-filled stats object |

  **What falls OUTSIDE the population, and why — this is part of the definition, not a footnote:**
  `hooks/useSessionStorage.ts:39` (a storage read, not a request — the fallback is correct);
  `hooks/useBulkActions.ts:271` (returns an explicit _failure_ result, which is the opposite of the
  defect); `services/push-subscription.ts:96` (returns `null` to a non-rendering caller);
  `components/positions/NewPositionDialog.tsx:283`,
  `routes/_protected/after-actions/$afterActionId.tsx:101`,
  `routes/_protected/engagements/$engagementId/after-action.tsx:95` (all three already surface the
  error via toast before returning). **`6` is the count of the defect; `12` is the count of the shape.
  Any closing derivation must state which of the two it measured.**

  Also outside: any site the scan cannot see — a swallow expressed as `.catch(() => fallback)`, a
  `try` whose fallback is assigned rather than returned, or an error absorbed inside a TanStack Query
  `select`/`placeholderData`. The scan matched `catch (…) {` blocks only. Research must widen it and
  restate the number; `6` is a floor.

### The error state itself

- **D-03: One shared query-error component, reused across every surface this phase touches — not
  bespoke error markup per page.** The codebase has **13** empty-state components
  (`components/empty-states/*`, plus feature-local ones) and **no** shared query-error state; the only
  general-purpose primitive is `components/ui/alert.tsx`. Criteria 2 and 3 together name at least
  seven surfaces, so seven bespoke error blocks is how this phase would produce its own inconsistency
  debt.

- **D-04: The error state is bilingual, announced, and internal-string-free.** `role="alert"`; copy
  from i18n keys present in BOTH `frontend/src/i18n/en/*` and `frontend/src/i18n/ar/*` (i18n is
  statically bundled — an unregistered namespace silently falls back to English in _both_ languages,
  so a missing `ar` key is invisible at runtime and must be caught by a gate, not by looking);
  no stack, no SQL, no PostgREST code, no `error.message` from a server error. Visual specification is
  deferred to `93-UI-SPEC.md` (`/gsd-ui-phase 93`) — this decision fixes the contract, not the pixels.

- **D-05: A failed request and an absent record are different states with different renders.** A
  rejection renders the error state (D-03). A well-formed ID that resolves to no row renders
  page-level not-found. The two must not share a component, because collapsing them is precisely the
  bug criterion 3 describes ("Check your connection and try again" for a record that simply is not
  there).

- **D-06: Not-found reuses TanStack Router's `notFound()` — the precedent already in the tree.**
  `routes/__root.tsx` defines the boundary and `routes/_protected/positions/$id.tsx`,
  `routes/_protected/after-actions/$afterActionId.tsx`,
  `routes/_protected/engagements/$engagementId/after-action.tsx` already throw it. Criterion 3's three
  targets (dossier detail, engagement detail, report builder) adopt the same mechanism rather than a
  fourth invention.

- **D-07: `TRUST-04`'s degraded state is NAMED, not blank.** An engagement whose extension row is
  missing renders the record's identity plus an explicit "incomplete record" state — never chrome
  with an empty title. The engagement extension table is `engagement_dossiers`; a missing row there is
  the condition to detect.

- **D-08: No server-originated `error.message` reaches the user; the population is stated with its
  exclusion.** `frontend/src/{routes,pages,components}` render `error.message` inside JSX at **37
  sites across ~25 files**. **That number is NOT the defect count.** Form-validation messages
  (`components/forms/FormInput.tsx`, `FormSelect.tsx`, `FormErrorDisplay.tsx`, and their callers) are
  React Hook Form field errors — author-written, user-facing by design, and correct. The defect is the
  subset where the rendered `error` originates from a query/transport rejection, the exemplar being
  `frontend/src/pages/AssignmentQueue.tsx:48` (`{error.message || t('queue.error')}`), which backs
  `/tasks/queue` via `routes/_protected/tasks/queue.tsx`. Research must partition the 37 and state
  both halves.

### The four inherited defects — all four re-derived live, not inherited on trust

All four reproduce today against staging `zkrcjzdemdmwhearhfgg` with a real user JWT
(`scripts/probe-edge-auth.sh`): `data-retention → 500`, `audit-logs-viewer → 500`,
`my-delegations → 200`, `field-permissions → 200`.

- **D-09: `DR-42501`'s filed diagnosis is WRONG and the corrected one governs.** `REQUIREMENTS.md`
  says the 42501 comes from `index.ts:112`'s `from('users').select('role')` "before the
  `data_retention_policies` query at `:233` ever runs". Measured: `public.users` is fully readable by
  `authenticated` (table + column `SELECT` granted; policy `users_select_active_authenticated`); the
  `:112` call **discards its error** (`const { data: userRecord }` — no `error` destructured) and
  cannot 500 anything; and the live 500 body is `"Failed to fetch policies"` — the
  `data_retention_policies` query, i.e. the one the filed text says never runs. **Real cause:** that
  table's only RLS policy, `Admin can manage retention policies`, evaluates
  `EXISTS (SELECT 1 FROM auth.users …)`, and no client role may read `auth.users`, so the predicate
  raises `42501` before it compares anything. **The fix is a policy rewrite, not a handler change.**

- **D-10: Scope of the policy fix — the 4 policies this phase's criteria exercise, per
  `RULING-P93-01`.** `data_retention_policies` ×1, `tag_categories` ×2, `entity_tag_assignments` ×1.
  Each replaces the whole predicate with the project's unified authz read — `public.users.role` keyed
  on `auth.uid()` — and the `raw_user_meta_data` / `raw_app_meta_data` reads are **DELETED**, not kept
  alongside. Migrations via `apply_migration` only.

- **D-11: The class is 15 policies over 13 tables; 8 of them read the user-writable metadata role;
  the residual 11 are `RLS-AUTHUSERS-01` → Phase 100.** Population: every `pg_policy` in schema
  `public` whose `USING` or `WITH CHECK` text matches `auth\.users`, derived from the live catalog.
  **Outside the population and unsearched:** policies reaching `auth.users` through a
  `SECURITY DEFINER` function or a view, and non-`public` schemas — so 15 is a **lower bound**. The
  filed requirement must carry the enumeration, the exclusions, the fail-closed finding, and the
  refusal in D-12.

- **D-12: `GRANT SELECT ON auth.users` is REFUSED, and a gate enforces the refusal.** The 8
  metadata-role policies gate on `raw_user_meta_data`, which any session can set on itself via
  `auth.updateUser({ data })`. They are harmless **only** because they fail closed: `auth.users`
  `SELECT` is granted to exactly one grantee (`postgres`, which owns the tables and is not subject to
  their RLS; `relforcerowsecurity = false` on all 8), so no role is simultaneously subject to these
  policies and able to evaluate them. **Postgres's own error text proposes the exploit** — every
  probe ends `HINT: Grant the required privileges to the current role with: GRANT SELECT ON
auth.users TO authenticated;` — and taking that hint converts 8 dormant policies into a
  self-service admin escalation, six of them read/write, one reachable by `anon`. Per
  `RULING-P93-01 ADDENDUM 1`, the plan touching this class **carries a gate asserting `SELECT` on
  `auth.users` is granted to no role beyond `postgres`**, so a later hand taking the hint turns a gate
  red instead of a screen green.

- **D-13: `DELEG-01` is closed as VISIBILITY ONLY; the repoint is `DELEG-02` → Phase 102.**
  `supabase/functions/my-delegations/index.ts:130,151` query `public.delegations`, which does not
  exist; the PostgREST error is swallowed and the function returns
  `200 {"granted":[],"received":[],"total":0}`. This phase stops the swallow: a real error status with
  a bilingual body, and `/delegations` renders the error state. It does **not** pick a table —
  `permission_delegations` (14 cols) and `position_delegations` (8 cols) model different concepts,
  neither has the `is_active` or `source` columns the handler uses, and **both hold 0 rows**, so a
  repoint would buy an identical empty screen at the cost of a product guess. Phase 102 seeds, and the
  phase that seeds decides. **Recorded consequence: after this phase `/delegations` visibly ERRORS
  until Phase 102 lands. That is the intended outcome — an erroring page beats a lying page.**

- **D-14: `AUDIT-42703` targets `public.audit_log`, and the ruling's condition is DISCHARGED with
  its derivation.** `RULING-P93-01` made A1 conditional on proving `audit_log` is not stale history.
  Measured: `audit_log` holds **75 rows, newest `2026-08-14 21:53:05+00`**, written by trigger
  function `audit_trigger_function` attached to **11 tables** (`activities, briefs, commitments,
contacts, documents, intelligence, mous, relationships, tasks, thematic_areas, workspaces`) plus
  `log_link_operation` on `intake_entity_links`. The sibling `public.audit_logs` has **0 rows** despite
  20+ edge-function write sites — it is the aspirational table, not the live one. **A1 stands.** The
  handler is remapped onto the real columns (`entity_type`, `entity_id`, `action`, `timestamp`,
  `old_values`, `new_values`, `additional_context`); `user_email` / `user_role` are joined from
  `public.users` or dropped; `public.audit_statistics` **does not exist** and is replaced by an
  aggregate over `audit_log`.

- **D-15: The `audit-logs-viewer` internal-string leak is fixed unconditionally.** Its live 500 body
  is `{"details":{"code":"42703","message":"column audit_log.table_name does not exist"}}` — a direct
  criterion-5 violation, independent of how D-14 is implemented. Diagnostics go to logs; the caller
  gets a bilingual message and a code.

- **D-16: `PIN-2390-01` — bump both helpers and redeploy the six importers; widen the derivation.**
  `supabase/functions/_shared/ai-interaction-logger.ts:12` imports `createClient` as a **value** from
  `esm.sh/@supabase/supabase-js@2.39.0` and constructs a client at `:149`; it is imported by
  `ai-interaction-logs`, `ai-summary-generate`, `dossier-field-assist`,
  `positions-consistency-check`, `translate-content`. `dossier-stats/dashboard-aggregations.ts:1`
  imports `SupabaseClient` (type-only) and is imported by `dossier-stats/index.ts:4`. Both bump to
  `@2`; all six importers redeploy. **The closing derivation widens from `--include='index.ts'` to
  `--include='*.ts'`** — the narrow population is the whole reason this defect was invisible to
  Phase 92's green.

### Method — the Phase 92 instruments, mandatory from the first plan

- **D-17: `.planning/GATE-STANDARD.md` C1–C10 including C9a governs every gate, from authoring — not
  as a later repair round.** Both directions observed per gate: red on the undone tree AND green on a
  constructed done state, via `scripts/gate-drill.mjs`. A gate whose done state cannot be constructed
  is labelled **UNPROVEN / CANNOT CONSTRUCT with what it needs** — never folded into a pass. Zero
  vacuous guards: no `2>/dev/null` suppression, no unrooted `-eq 0`, no post-commit `git diff HEAD`
  (anchor scope diffs to `phase-93-base`).

- **D-18: Every closing derivation states its POPULATION DEFINITION and what falls outside it.**
  D-02, D-08, D-11 and D-16 are written that way on purpose — they are the template. A derivation
  whose scope is unstated is a finding, not a pass. This is the D-43/D-48 lesson: a correct command
  returns a correct number about the wrong set.

- **D-19: Behavioural criteria carry behavioural oracles, and producers are ordered before
  consumers.** Criteria 2–5 are render-state claims; a grep cannot close them. Each names how it is
  OBSERVED — Playwright spec, live probe, or explicitly manual-with-owner. An oracle that cannot run
  until execution is labelled as such. Any artifact one plan produces and another plan's gate consumes
  is positive-controlled against a synthetic row in the mandated shape before either plan runs (C9a).

- **D-20: No oracle may depend on the e2e `setup` project.** `E2ECRED-01` (credential rotation) is
  still outstanding with the operator and is NOT a Phase 93 dependency. Route around it as Phase 92
  did: Playwright `--no-deps` plus inline auth. Every code criterion in this phase must be closeable
  without the rotation.

### Claude's Discretion

Plan decomposition and task ordering; the internal shape of the shared error component; whether the
`audit_log` remap lands as one task or two; how the gate-drill evidence table is laid out. Visual
design of the error/not-found/degraded states belongs to `93-UI-SPEC.md`, not to discretion.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` §Phase 93 — the goal sentence and the five success criteria. The goal
  sentence ("No surface renders a confident empty state over a request that failed") is the scope
  arbiter for every call in this phase.
- `.planning/REQUIREMENTS.md` — `TRUST-01`..`TRUST-04` (lines 34–37), `DELEG-01` (49), `DR-42501`
  (50), `PIN-2390-01` (51), `AUDIT-42703` (52), `SEED-DELEG-01` (195). **`DR-42501`'s diagnosis in
  that file is superseded by D-09** — read D-09 alongside it.
- `.planning/STATE.md` — the "Not established by Phase 92" block: nothing was verified against
  production, RLS row-scoping was never verified behaviourally, Arabic was verified as JSON not as
  pixels. Phase 93 inherits none of those as done.

### Rulings binding on this phase

- `.tickmarkr/overseer/RULING-P93-01-PARKS.md` — candidate 1 on all three parks, with orders.
- `.tickmarkr/overseer/RULING-P93-01-PARKS.md` ADDENDUM 1 — 8-count adopted; LATENT-measured verdict
  adopted; the anti-grant gate is REQUIRED.
- `.tickmarkr/overseer/PARK-P93.md` — the evidence behind all three rulings, with re-runnable SQL.
- `.tickmarkr/overseer/PARK-P92-EXEC.md` §PARK-EXEC-02 — `DELEG-01`'s origin.

### Method and gates

- `.planning/GATE-STANDARD.md` — C1–C10 including **C9a**. Binding on every gate authored here.
- `scripts/gate-drill.mjs` — extracts, parses and runs every `<automated>` gate across the plan set.
- `scripts/decision-coverage.mjs` — the `D-NN` coverage scanner. It reads frontmatter
  `must_haves`/`truths`/`objective` and body headings matching those names **only**; a `D-NN` cited in
  a task body, `<read_first>`, or an acceptance criterion is invisible to it. Every plan therefore
  carries one citation truth in frontmatter `truths:` of the form
  `- 'Decisions covered — D-03: <short>; D-09: <short>'`. Never take the "Proceed anyway" override.
- `scripts/probe-edge-auth.sh` — mints a real user JWT and prints `<fn> -> <status>` per deployed
  function. Never echoes credentials.
- `.tickmarkr/overseer/P92-EXEC-REPORT.md` — the house style for the exec report and its evidence
  standard.

### Design (any UI this phase renders)

- `frontend/DESIGN.md` — the Linear spec: token tables, type, radii, recipes. Linear dark is the only
  direction.
- `frontend/src/design-system/CLAUDE.md` — the runtime token engine.
- `frontend/design-system/inteldossier_handoff_design/` — **historical reference, superseded 2026-07.
  Do NOT point new work at it.**

### Code seams named by the criteria

- `frontend/src/lib/api-client.ts:111-118` — `apiGet` throws; the basis for D-01.
- `frontend/src/domains/analytics/repositories/analytics.repository.ts` — criterion 1's exemplar.
- `frontend/src/pages/AssignmentQueue.tsx:48` — criterion 5's exemplar, reached via
  `frontend/src/routes/_protected/tasks/queue.tsx`.
- `frontend/src/routes/_protected/admin/field-permissions.tsx` — criterion 2's first surface (19 rules
  live; the function returns 200 today).
- `supabase/functions/{my-delegations,data-retention,audit-logs-viewer}/index.ts` — the three failing
  edge functions.
- `supabase/functions/_shared/ai-interaction-logger.ts:12,149` and
  `supabase/functions/dossier-stats/dashboard-aggregations.ts:1` — the `PIN-2390-01` sites.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`lib/api-client.ts`** — already throws on non-OK (`handleResponse` → `toApiError`). Nothing needs
  building for D-01; the work is deletion.
- **TanStack Router `notFound()`** — the boundary lives in `routes/__root.tsx` and three routes
  already throw it. Criterion 3 extends an existing mechanism.
- **`components/ui/alert.tsx`** — the only general-purpose alert primitive; the natural substrate for
  the shared error state (D-03).
- **`components/empty-states/EmptyState.tsx`** and 12 siblings — the _empty_ vocabulary already
  exists and is well-populated. The gap is precisely that no _error_ counterpart does, which is a
  plausible cause of the whole defect class: an empty state was the only component to hand.
- **`scripts/probe-edge-auth.sh`** — a working live oracle for every edge-function criterion, already
  proven in Phase 92 and re-run today.

### Established Patterns

- **Repositories are thin wrappers over `apiGet`/`apiPost`**; error handling belongs to TanStack
  Query at the hook layer, not inside the repository. `analytics.repository.ts` is the deviation, not
  the pattern.
- **i18n is statically bundled** (`frontend/src/i18n/index.ts`); `public/locales` is dead. An
  unregistered namespace falls back to English in **both** languages — silently. Namespace separator
  is `:` (colon); dot-form `t()` leaks raw keys.
- **Edge functions return bilingual error bodies** (`message_en` / `message_ar`) — `data-retention`
  already does this correctly and is the shape to copy; the defect there is the leaked `details`
  object, not the envelope.
- **Authz is unified on `public.users.role`.** `user_metadata` / `app_metadata` role reads were
  deliberately retired; the 8 policies in D-12 are surviving instances of the retired pattern.

### Integration Points

- **Repository → TanStack Query → page `isError` branch.** D-01 reconnects a chain that is already
  wired end-to-end and broken at exactly one link.
- **Edge function error body → frontend error state.** Criterion 5 spans both sides: the function
  must stop leaking, and the page must stop printing whatever it receives. Neither half alone closes
  it, and they belong to different plans — a C9a cross-plan coherence obligation.
- **RLS policy → PostgREST 42501 → edge-function 500 → surface.** D-09/D-10's migration is the only
  change in this phase whose effect is observable four layers up; its oracle must be the live probe,
  not a SQL assertion alone.

</code_context>

<specifics>
## Specific Ideas

- **The phrase that settles scope disputes** is the ruling's: _an erroring page beats a lying page._
  Where this phase must choose between showing an honest failure and doing more work to show correct
  data, it shows the failure and files the work.
- **`/delegations` will visibly error after this phase**, by design, until Phase 102 seeds and
  decides. That is recorded as an intended outcome, not a regression, so nobody "fixes" it back to a
  confident empty list.
- **The `HINT`-as-exploit finding** (D-12) is the phase's sharpest trap: the database itself suggests
  the dangerous remedy in the error text a developer will be staring at. The gate exists because the
  wrong fix is the one that looks authoritative.

</specifics>

<deferred>
## Deferred Ideas

- **`RLS-AUTHUSERS-01` → Phase 100** — the residual 11 `auth.users`-referencing RLS policies, with the
  full 15-row enumeration, the stated exclusions (SECURITY DEFINER / view indirection unsearched; the
  number is a lower bound), the fail-closed finding, and the explicit refusal of
  `GRANT SELECT ON auth.users`. Per `RULING-P93-01` order 2/3.
- **`DELEG-02` → Phase 102** — which relation `my-delegations` reads, decided beside
  `SEED-DELEG-01` because seeding forces the choice. Column evidence in `PARK-P93.md` §02.
- **NEW, found while discharging the AUDIT-42703 condition — awaiting an overseer ruling:**
  `backend/src/services/auth.service.ts:847` (`logSecurityEvent`) inserts `resource_type` and
  `details` into `public.audit_log`. **Neither column exists** (the real columns are `entity_type` and
  `additional_context`), and the insert is wrapped in a `catch` that only logs. Security audit events
  have therefore been silently dropped. It is the exact class this phase exists to kill, on a security
  path, but **no Phase 93 criterion names it**. Planning proceeds assuming it is FILED, not folded; if
  the ruling folds it in, it attaches to the `AUDIT-42703` plan.
- **Production verification** — everything here is staging-only, as Phase 92 was. The droplet is
  untouched and no criterion depends on it.

</deferred>

---

_Phase: 93-Failure Visibility_
_Context gathered: 2026-08-15_
