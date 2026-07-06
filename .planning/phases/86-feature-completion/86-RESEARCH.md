# Phase 86: Feature Completion - Research

**Researched:** 2026-07-06
**Domain:** Frontend feature wiring (React 19 + TanStack + Supabase edge functions) — no new backend design
**Confidence:** HIGH (all findings verified directly against the codebase, migrations, and STATE.md/PR records this session)

## Summary

Phase 86 closes three honest-disabled surfaces. The single most important discovery: **the MoU create backend is already done and live** — PR #85 (2026-06-29) rebuilt the `mous` insert triggers (SECURITY DEFINER), fixed the org-isolation RLS to resolve the tenant org from `profiles`, rewrote the `mous` edge fn to the live schema, deployed it (v10) to staging, and verified a real MoU created end-to-end. FEAT-01 is therefore **pure frontend work**: a create dialog mirroring the existing `NewPositionDialog` pattern, a small `domains/mous` repository+hook, and enabling the disabled button at `MousPage.tsx:209`.

FEAT-02/03 (user management) is also mostly wiring: the L1-hardened edge functions (`create-user` v2, `deactivate-user` v1, `reactivate-user` v1, `user-permissions` v2) were deployed to staging 2026-06-28; `assign-role` exists but its deployment was intentionally skipped in that sweep (unchanged) and must be verified. The client-side types for every one of these calls **already exist** in `frontend/src/services/user-management-api.ts` — only the invoke methods, routes (`/users/create`, `/users/$id`), and pages are missing. Rich EN+AR i18n already exists in the registered `user-management` namespace (one gap: `roles.editor` is missing).

FEAT-04 (ConsistencyPanel) is the phase's one real product decision. The evidence (detailed in its own section) shows a fully-built DB layer and a substantial 979-line edge function — but the function's two value-bearing legs (vector similarity and on-prem LLM) are both inert today (nothing writes `position_embeddings`; `VLLM_BASE_URL` is GPU-gated until Phase 91), leaving only a keyword heuristic that is demonstrably a false-positive generator. **Recommendation: DELETE the panel now (small, fully satisfies FEAT-04), retain the backend assets, record a revisit trigger post-LIVE-01.**

**Primary recommendation:** Treat this phase as three frontend wiring tracks against already-hardened backends, plus one small deletion. No new packages. No new migrations expected (one optional view tweak flagged below).

## Architectural Responsibility Map

| Capability                                      | Primary Tier                                                         | Secondary Tier                  | Rationale                                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| MoU create form + validation                    | Frontend (React)                                                     | —                               | Zod + react-hook-form client validation; edge fn re-validates                                                                                  |
| MoU insert, org resolution, reference numbering | Edge Function (`mous`)                                               | Database (RLS + triggers)       | PR #85 path: fn resolves org from `profiles`, RLS `mous_org_isolation_insert` enforces it; DO NOT insert into `mous` directly from the browser |
| MoU list refresh                                | Frontend (TanStack Query)                                            | Database (`mous_frontend` view) | Invalidate `['mous']`; list reads the view ordered `created_at desc`                                                                           |
| User create (auth account + role + clearance)   | Edge Function (`create-user`)                                        | Database (service-role writes)  | Admin-gated, service-role writes to `auth.users`/`public.users`/`profiles` — never client-side                                                 |
| User role/status changes                        | Edge Functions (`assign-role`, `deactivate-user`, `reactivate-user`) | —                               | All privileged writes go through hardened fns; UI only invokes                                                                                 |
| User detail read                                | Frontend (direct `public.users` select)                              | Database RLS                    | Same pattern the existing `UsersListPage` uses                                                                                                 |
| Admin route gating                              | Frontend (`requireAdmin` beforeLoad)                                 | Edge Functions (403 non-admin)  | Client guard is UX; each edge fn independently enforces `public.users.role === 'admin'`                                                        |
| Consistency check (FEAT-04)                     | — (recommend delete)                                                 | Edge Function retained dormant  | See FEAT-04 decision section                                                                                                                   |

<phase_requirements>

## Phase Requirements

| ID      | Description                                                            | Research Support                                                                                                                                                                                                                                |
| ------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FEAT-01 | MoU create form writing `mous`; disabled "Add MoU" button becomes live | Backend verified live (PR #85, edge fn v10 on staging); exact request contract extracted from `supabase/functions/mous/index.ts`; form pattern = `NewPositionDialog`; picker = `work-creation/DossierPicker`; parties-display gotcha documented |
| FEAT-02 | `/users/create` against L1-hardened `create-user` edge fn              | `create-user` v2 deployed 2026-06-28; full request/response contract + validators extracted; client types already in `user-management-api.ts`; route restructure pattern = `engagements.tsx` layout                                             |
| FEAT-03 | `/users/:id` detail — role, status, profile                            | `assign-role`/`deactivate-user`/`reactivate-user`/`user-permissions` contracts extracted; dual-approval flow for admin grants documented; i18n `userDetail.*`/`userDeactivation.*` keys exist EN+AR                                             |
| FEAT-04 | ConsistencyPanel: wire real, or delete (component + i18n)              | Complete evidence dossier both ways below; recommendation = delete with recorded decision + revisit trigger; exact delete-scope file list provided                                                                                              |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Design system:** Linear (`frontend/DESIGN.md` + `frontend/src/design-system/`) — token-only colors (`var(--*)` / mapped utilities), no raw hex, no Tailwind palette literals (ESLint errors), borders `1px solid var(--line)`, no card shadows, no gradients, radii from `--radius-sm/--radius/--radius-lg` (6/8/12), row heights `var(--row-h)`, buttons mirror `.btn-primary`/`.btn-ghost`.
- **RTL:** logical properties only (`ms-*`, `ps-*`, `text-start`…) — physical classes are ESLint ERRORS in `frontend/**`; directional icons flipped with `isRTL ? 'rotate-180' : ''`; every surface verified with `dir="rtl"` + Tajawal.
- **i18n:** static bundle in `src/i18n/index.ts`; unregistered namespaces silently fall back to EN in BOTH languages; use COLON namespace form (`t('user-management:roles.admin')`) or the array-form `useTranslation('user-management')`; `public/locales` is DEAD.
- **Component cascade:** HeroUI v3 → Radix → build-it-yourself; Aceternity/Kibo banned; existing `components/ui/*` wrappers are the primitives to use (Dialog, Form, Select, Input already token-bound).
- **Voice:** no emoji, no marketing voice, sentence case; dates `Tue 28 Apr` via `lib/format-date` helpers (`formatDayFirst`, `formatDayFirstYear`).
- **Code style:** no semicolons, single quotes, explicit return types, no `any`, no floating promises; ESLint per-directory filename case (components/** PascalCase, ui/** kebab, hooks/\*\* camelCase) is CI-blocking.
- **DB:** migrations via Supabase MCP only (project `zkrcjzdemdmwhearhfgg`); edge fns deployed via CLI/MCP; `routeTree.gen.ts` is generated — never hand-edit.
- **GSD:** work must run through GSD commands; backwards compatibility (no regressions), bilingual correctness after every change.
- **Domain layering (frontend/CLAUDE.md):** repositories are the only network layer; hooks call repositories; query-key factories per domain.

## Standard Stack

### Core (all already installed — zero new dependencies)

| Library                        | Version         | Purpose                                       | Why Standard                                                              |
| ------------------------------ | --------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| react-hook-form                | ^7.76.1         | Form state for MoU create + user create       | House pattern (`NewPositionDialog`, `TaskEditDialog`, `CommitmentForm`)   |
| zod + @hookform/resolvers      | ^4.3.6 / ^5.4.0 | Schema validation, i18n-key error messages    | House pattern — messages are i18n KEYS rendered via `<FormMessage/>`      |
| @tanstack/react-query          | v5              | Mutations + cache invalidation                | House pattern; invalidate `['mous']` / `['users']` keys                   |
| @tanstack/react-router         | v5 (file-based) | New routes `users/create`, `users/$id`        | Existing `engagements.tsx` layout+`<Outlet/>` precedent                   |
| supabase-js (`@/lib/supabase`) | v2              | `supabase.functions.invoke` for user-mgmt fns | Same file (`user-management-api.ts`) already uses this for delegation fns |
| `@/lib/api-client` (`apiPost`) | in-repo         | Calling the `mous` edge fn                    | Centralized auth headers + `ApiError` with localized body                 |
| sonner (toast)                 | ^2.0.7          | Success/error feedback                        | House pattern in create dialogs                                           |

**Verification:** versions read from `frontend/package.json` this session `[VERIFIED: frontend/package.json]`. No `npm install` required — Package Legitimacy Gate not applicable.

### Alternatives Considered

| Instead of                              | Could Use                                              | Tradeoff                                                                                                                                                                                                           |
| --------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create **dialog** for MoU (recommended) | Full route `/mous/new` or a `CreateWizardShell` wizard | The dossier wizard is a multi-step machine built for the 8 dossier types; MoU has ~8 fields — a single dialog (NewPositionDialog precedent) is the smaller, proven shape. A route adds nothing here.               |
| `apiPost('/mous', …)` via api-client    | `supabase.functions.invoke('mous', …)`                 | Both work; api-client gives the structured `ApiError` (localized message + details) that forms consume. `invoke` is fine for the user-mgmt fns since that file already standardizes on it.                         |
| Direct `supabase.from('mous').insert()` | —                                                      | **Do not.** The edge fn resolves `organization_id`/`tenant_id` from the caller's profile and auto-generates `reference_number`; RLS insert policy requires the resolved org. The fn is the verified path (PR #85). |

## Package Legitimacy Audit

**No new packages are installed by this phase.** Every recommended library is already a committed dependency in `frontend/package.json` with an existing lockfile entry. slopcheck not run — not applicable.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
FEAT-01 (MoU create)
  [MousPage "Add MoU" btn] ──opens──> [CreateMouDialog (RHF+Zod)]
        │                                    │ submit
        │                                    v
        │                    [domains/mous/repository.createMou]
        │                                    │ apiPost('/mous', body)  (JWT via api-client)
        │                                    v
        │                    [edge fn `mous` POST  — deployed v10]
        │                       ├─ getUser(token) → profiles.organization_id
        │                       ├─ validate (title/title_ar/type/mou_category, sig1≠sig2, dates)
        │                       ├─ reference_number auto: MOU-YYYY-NNNN
        │                       └─ INSERT public.mous  ──RLS──> mous_org_isolation_insert
        │                             └─ AFTER-INSERT triggers (SECURITY DEFINER, fixed PR #85)
        │ onSuccess: invalidateQueries(['mous'])
        v
  [MousPage list query] ──reads──> [mous_frontend VIEW (parties jsonb → primary/secondary_party)]

FEAT-02/03 (user management)
  [/users (layout users.tsx, beforeLoad requireAdmin, <Outlet/>)]
     ├─ users/index.tsx  → UsersListPage (+ "Create user" btn, clickable rows)
     ├─ users/create.tsx → UserCreatePage ──createUser()──> [edge fn create-user v2]
     │                                        ├─ requester role==='admin' (public.users, service-role read)
     │                                        ├─ auth.admin.createUser (inactive, temp pwd)
     │                                        ├─ UPDATE public.users (role/username/full_name, rollback on miss)
     │                                        ├─ optional profiles.clearance_level (1-4)
     │                                        └─ audit_logs + notification; 201 {user_id, activation_sent}
     └─ users/$id.tsx    → UserDetailPage
              ├─ read: supabase.from('users').select(...).eq('id', id)
              ├─ role:   assignRole() ──> [assign-role] (admin grant ⇒ requires_approval dual-approval)
              └─ status: deactivateUser()/reactivateUser() ──> [deactivate-user v1 / reactivate-user v1]
                                                                (flip public.users.is_active)
```

### Recommended Project Structure (new files)

```
frontend/src/
├── domains/mous/
│   ├── repositories/mous.repository.ts   # createMou(payload) → apiPost('/mous', payload)
│   ├── hooks/useCreateMou.ts             # useMutation + invalidate ['mous']
│   ├── keys.ts                           # mouKeys.list() — align with existing ['mous', …] inline key
│   └── index.ts
├── components/mous/
│   └── CreateMouDialog.tsx               # RHF + zodResolver, mirrors NewPositionDialog
├── pages/users/
│   ├── UserCreatePage.tsx
│   └── UserDetailPage.tsx
└── routes/_protected/
    ├── users.tsx                         # CONVERTED: layout w/ <Outlet/>, keeps beforeLoad: requireAdmin
    └── users/
        ├── index.tsx                     # component: UsersPage (list)
        ├── create.tsx
        └── $id.tsx
```

(Filename case: `components/**` PascalCase, `pages/**` PascalCase, `routes/**` follows router conventions, `hooks/` inside domains camelCase — matches the ESLint check-file config.)

### Pattern 1: Create dialog (FEAT-01)

**What:** Controlled `Dialog` + `Form` primitives + `zodResolver` schema whose error messages are i18n keys; mutation hook does toast + invalidation.
**When to use:** Single-entity quick-create — exactly the MoU case.
**Canonical in-repo example:** `frontend/src/components/positions/NewPositionDialog.tsx` (Phase 64) — includes the props contract style, bilingual required titles, Select pickers, localized inline validation. `[VERIFIED: codebase]`

**MoU create request contract (from the live edge fn — this IS the live schema, PR #85):**

```ts
// Source: supabase/functions/mous/index.ts (deployed v10 to staging, verified live)
interface MoURequest {
  reference_number?: string // omit — fn auto-generates MOU-YYYY-NNNN
  title: string // required (EN — column is `title`, NOT title_en)
  title_ar: string // required
  type: 'bilateral' | 'multilateral' | 'framework' | 'technical' // required, mou_type enum
  mou_category: 'data_exchange' | 'capacity_building' | 'strategic' | 'technical' // required
  lifecycle_state?:
    | 'draft'
    | 'negotiation'
    | 'pending_approval'
    | 'signed'
    | 'active'
    | 'suspended'
    | 'expired'
    | 'terminated' // mou_state enum, default 'draft'
  description?: string
  country_id?: string | null
  signatory_1_dossier_id?: string | null // must differ from signatory_2 (fn-enforced 400)
  signatory_2_dossier_id?: string | null
  effective_date?: string | null // expiry must be > effective (fn-enforced 400)
  expiry_date?: string | null
  dates?: Record<string, unknown> // jsonb; view reads dates->>'signing_date'
  parties?: unknown // jsonb array; view reads parties->0/1->>name_en/name_ar
}
// organization_id / tenant_id / created_by / last_modified_by are resolved server-side.
```

**Critical display detail:** the list page reads `mous_frontend`, which renders party names from the `parties` **jsonb** (`parties->0->>'name_en'` etc.), NOT from the signatory dossier FKs. For the new MoU to show its parties in the list, the form must ALSO send `parties: [{name_en, name_ar}, {name_en, name_ar}]` derived from the two selected `DossierOption`s (DossierPicker's `onChange` hands back `{id, name_en, name_ar, type, status}`). The alternative — re-pointing the view to join dossiers on the signatory FKs — is a migration; only take it if the planner prefers correctness over the smaller diff. `[VERIFIED: supabase/migrations/036_update_mous_frontend_view.sql + DossierPicker.tsx]`

**Signatory selection:** reuse `@/components/work-creation/DossierPicker` (single-select ×2, `filterByDossierType={['country','organization']}` — Claude's discretion on the type filter; the fn accepts any dossier).

### Pattern 2: Route conversion to layout (FEAT-02/03)

**What:** Flat `users.tsx` becomes a layout route rendering `<Outlet/>`; children live in `routes/_protected/users/`.
**Canonical in-repo example:** `routes/_protected/engagements.tsx` (`component: () => <Outlet />`) + `engagements/index.tsx` + `engagements/$engagementId.tsx`. `[VERIFIED: codebase]`
**Guard:** keep `beforeLoad: requireAdmin` on the layout — TanStack runs parent `beforeLoad` for all children, so `/users`, `/users/create`, `/users/:id` are all admin-gated with one line. Each edge fn additionally 403s non-admins independently (`public.users.role !== 'admin'`), so the client guard is UX-only. `[VERIFIED: lib/auth/require-admin.ts + create-user/index.ts:216]`

### Pattern 3: Edge-fn client methods (FEAT-02/03)

**What:** Add the missing invoke methods to `frontend/src/services/user-management-api.ts` — the request/response interfaces (`CreateUserRequest`, `AssignRoleRequest/Response`, `DeactivateUserRequest/Response`, `ReactivateUserRequest/Response`, `UserPermissionsResponse`) **already exist in that file**; only the functions are missing. Mirror `delegatePermissions()` in the same file:

```ts
// Source pattern: frontend/src/services/user-management-api.ts (delegatePermissions)
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const { data: result, error } = await supabase.functions.invoke<CreateUserResponse>(
    'create-user',
    { body: data },
  )
  if (error) throw error
  if (!result) throw new Error('No response from create-user function')
  return result
}
```

**create-user validators (client Zod schema must mirror them):** email regex; username `^[a-z0-9_-]{3,50}$` (lowercase); full_name 2–100 chars; role ∈ `['admin','editor','viewer']`; optional clearance integer 1–4; `user_type: 'guest'` additionally requires future `expires_at` + non-empty `allowed_resources`. Duplicate email/username → 400 `DUPLICATE_EMAIL` / `DUPLICATE_USERNAME`. Rate limit 10/min. `[VERIFIED: supabase/functions/create-user/index.ts]`

**assign-role behavior the detail page must handle:** granting `admin` triggers a **dual-approval** flow — response is `{requires_approval: true, approval_request_id, pending_approvals}` instead of an immediate change; non-admin grants return `{role_changed, new_role, sessions_terminated}`. Recommendation: on `requires_approval`, toast "pending dual approval" and stop — do NOT build an approvals UI in this phase (`approve-role-change` fn exists for later; an `approvals` route dir already exists). `[VERIFIED: supabase/functions/assign-role/index.ts:19-33,210]`

**deactivate/reactivate:** flip `public.users.is_active` (D-11 fixed them off the non-existent `status` column); responses include `orphanedItems` / `sessionsTerminated` — i18n keys for all of it already exist under `userDeactivation.*`. `[VERIFIED: _impl-brief-L1-auth.md D-11 + user-management-api.ts types]`

### Anti-Patterns to Avoid

- **Direct `mous` table insert from the browser** — bypasses org resolution + reference numbering; the RLS will also block callers whose profile org isn't attached manually.
- **Reading role from `user_metadata`/`app_metadata`** — client-writable privilege-escalation vector; authz is `public.users.role` only (see `require-admin.ts` doc comment).
- **Offering `manager`/`staff` in the new role pickers** — the edge fns reject anything outside `['admin','editor','viewer']`; the list page's 4-role filter is pre-existing drift, don't propagate it into create/detail.
- **Hand-editing `routeTree.gen.ts`** — regenerates on dev/build.
- **Dot-form namespace keys** (`t('user-management.roles.admin')`) — reads as a nested lookup in `common` and leaks the raw key; use `useTranslation('user-management')` + plain keys, or colon form.
- **Refitting `MousPage`/`UsersListPage` to Linear styling wholesale** — out of scope; new surfaces follow Linear tokens, existing pages get only the minimal edits (enable button, add row-nav).

## FEAT-04: ConsistencyPanel — Build vs Delete (the delegated decision)

### Where it lives today

| Artifact     | Location                                                                                                                 | State                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Component    | `frontend/src/components/consistency-panel/ConsistencyPanel.tsx` (382 lines)                                             | Pure presentational; props `consistencyCheck`, `onResolveConflict(modify\|accept\|escalate)`, `onViewConflictingPosition`                                                                  |
| Mount points | **none**                                                                                                                 | Removed from `routes/_protected/positions/$id.tsx` in the L7 honest-disable; only a comment remains at :212 ("Consistency panel hidden until the check query + action handlers are wired") |
| Tests        | `components/__tests__/ConsistencyPanel.test.tsx`                                                                         | 17 tests, all against the OLD stub contract                                                                                                                                                |
| i18n         | `positions.json` `consistency.*` block — 43 top-level keys, **EN + AR symmetric**                                        | Only consumed by the panel + its test (repo-wide grep)                                                                                                                                     |
| Types        | `types/position.ts` `ConsistencyCheck` (:106) + `SubmitPositionResponse.consistency_check` (domains/positions/types:191) | The response type is a **lie** — `positions-submit` returns `{ position }` only `[VERIFIED: positions-submit/index.ts:75]`                                                                 |
| Hooks        | none — no `useConsistency`/`use-compliance` exists anywhere in `frontend/src`                                            | `[VERIFIED: repo grep]`                                                                                                                                                                    |

### Is there a real backend? YES — and it's substantial

- **Edge fn `positions-consistency-check`** (979 lines): auth'd, fetches the position + all approved/published positions, runs keyword conflict analysis (EN+AR contradiction/ambiguity/outdated), attempts vector similarity via `find_similar_positions` RPC, optionally calls the on-prem LLM (`VLLM_BASE_URL`, Phase-74 re-homed) for recommendations/gaps, computes score+risk, and **persists** to `position_consistency_checks`, updating `positions.last_consistency_check_id`/`consistency_score`. Gracefully degrades (`ai_service_available: false` + fallback recommendations). `[VERIFIED: full file read]`
- **DB layer complete** (migration `20260111100001_position_consistency_checker.sql`): `position_consistency_checks` table (score, risk_level, conflicts/recommendations/similar_positions/gaps jsonb, `review_status` enum pending_review→approved/rejected/revision_required, reviewed_by/at/notes), RLS policies, plus ready-made RPCs `get_latest_consistency_check(position_id)` and `can_auto_approve_position`. `[VERIFIED: migration read]`
- **i18n is pre-built for the REAL contract:** the `consistency.*` block includes `runCheck`, `overallScore`, `riskLevel`, `risk.critical`, `similarPositions`, `recommendations`, `relationship.duplicate`, `approve`/`requestRevision`/`reject`, `reviewNotesPlaceholder` — keys the current panel never uses but the edge-fn response needs. Someone prepared the wire-up in Jan 2026.
- **`positions-consistency-reconcile`** is a 13-line **501 stub** — the "resolve conflict" backend was never designed. `[VERIFIED: file read]`

### Why the "real check" isn't real today — the pivotal evidence

1. **The vector leg is dead.** `find_similar_positions` joins `position_embeddings` — and **nothing in the repo writes `position_embeddings`** (repo-wide grep: only type definitions reference it). The RPC returns empty; the fn's try/catch already swallows this. `[VERIFIED: repo grep]`
2. **The LLM leg is gated on Phase 91.** Recommendations require `VLLM_BASE_URL` (on-prem GPU stack = LIVE-01, the last phase of this milestone). Until then `ai_service_available: false` always.
3. **What remains is a false-positive engine.** `detectContradiction` flags a HIGH-severity contradiction whenever the new position contains ANY positive keyword (`support`, `increase`, `accept`, `allow`…) and an existing one contains ANY negative keyword (`reduce`, `deny`, `oppose`…) — near-certain co-occurrence across real policy prose, evaluated pairwise against EVERY approved position. Worse, `detectAmbiguity` inspects only the NEW position's text but emits a separate conflict row per existing position compared — one hedgy draft ("may", "could", "often" ×3) conflicts with the entire repository. Score deductions (−5 per low, −20 per high) then crater `overall_score` for essentially any submission. Shipping this as a visible "consistency score" would be **misleading UI replacing dead UI**. `[VERIFIED: analyzeConflict/detectContradiction/detectAmbiguity read in full]`
4. **Contract drift is total.** Panel expects `{consistency_score, check_trigger, conflicts[].conflict_position_id, severity high|med|low, description, suggested_resolution}` (the OLD `consistency_checks` table shape from migration 20250101008); the edge fn returns `{overall_score, risk_level, conflicts[].conflicting_position_id, 6 conflict types, 4 severities, description_en/ar, evidence_en/ar}`. Wiring = rewriting the panel's data layer AND its rendering (bilingual fields), not just adding a hook.
5. **Action semantics are undefined.** `modify`/`view` could be navigation (trivial), but `accept`/`escalate` have no backend meaning — reconcile is a 501 stub; the nearest honest mapping is check-level `review_status` updates, which is new UX design work on top of the rewrite.
6. **Deployment status of the check fn is unverified** (not in any recorded deploy sweep), and it still uses deprecated wildcard CORS + `supabase-js@2.39.0`.

### Cost comparison

| Option        | Work                                                                                                                                                                                                                                                                                                                                                                          | Size                            | Outcome                                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delete**    | Remove `components/consistency-panel/` + `components/__tests__/ConsistencyPanel.test.tsx`; delete the `consistency` block from `en/positions.json` + `ar/positions.json`; remove the stale comment in `positions/$id.tsx:212-213`; prune the dead `ConsistencyCheck` type + `SubmitPositionResponse.consistency_check` field (no other consumers — verified); record decision | **S** (~5 files, all deletions) | FEAT-04 fully satisfied ("formally retired, component + i18n keys deleted, decision recorded"). Backend assets (edge fn, table, RPCs) are NOT UI and are retained dormant for a future feature. |
| **Wire real** | New `useConsistencyCheck` hook (latest via `get_latest_consistency_check` + manual run via edge fn); rewrite panel to the edge contract (bilingual, 4 severities, 6 types, risk level, recommendations, similar positions); design + implement accept/escalate as `review_status` writes; verify/deploy the edge fn; rewrite 17 tests; EN/AR verification                     | **M–L**                         | A working panel whose only live signal is the noisy keyword heuristic until Phase 91 lands GPU inference AND someone builds a `position_embeddings` backfill (not scheduled in any phase).      |

### Recommendation (defensible, evidence-based)

**DELETE now.** Rationale: the wire-up's honest end-state this phase is a false-positive generator wearing an AI badge — strictly worse than the current absence. The genuinely valuable check needs two inputs that don't exist until at least Phase 91 (live LLM) plus an unscheduled embeddings backfill. Deleting is small, fully compliant with FEAT-04's retirement clause, and loses nothing: the DB schema, RPCs, and edge fn remain in the repo/migrations, and this research file + the recorded decision serve as the revisit map. **Revisit trigger:** after LIVE-01/LIVE-03 (Phase 91), if position consistency is still wanted, re-scope it as "LLM-backed consistency review" with an embeddings pipeline — do not resurrect the keyword heuristic.

If the user overrides toward "build": scope it as (a) panel rewrite to the edge contract, (b) manual `runCheck` button + latest-check display only on `positions/$id`, (c) actions = navigate (view/modify) + check-level `review_status` update (accept→`approved`, escalate→`revision_required` with `review_notes`), (d) suppress the score gauge when `ai_service_available === false` OR disable the contradiction/ambiguity heuristics server-side — never present keyword noise as a numeric score.

## Don't Hand-Roll

| Problem                                         | Don't Build                            | Use Instead                                           | Why                                                             |
| ----------------------------------------------- | -------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| MoU org/tenant resolution + reference numbering | client-side org lookup / ref generator | `mous` edge fn POST                                   | Already deployed + verified (PR #85); RLS-coupled               |
| Dossier signatory selection                     | new combobox                           | `work-creation/DossierPicker`                         | Search, type-filter, multi/single, RTL done                     |
| User create (auth + role + clearance + audit)   | any client-side auth admin call        | `create-user` edge fn                                 | Service-role only; has rollback-on-role-write-miss compensation |
| Form validation plumbing                        | ad-hoc validation                      | RHF + zodResolver + `<FormMessage/>` i18n-key pattern | House pattern, localized errors free                            |
| Admin gating                                    | per-page session checks                | `requireAdmin` beforeLoad on the layout route         | Single source, matches every edge fn's server check             |
| Date display                                    | `toLocaleDateString`                   | `lib/format-date` (`formatDayFirstYear`)              | Phase 82 Latin-digit policy D                                   |

**Key insight:** every backend this phase touches was already hardened by named prior work (PR #85, L1 lane, D-11/D-22/D-23). The phase is UI wiring; inventing parallel paths would re-open closed security work.

## Common Pitfalls

### Pitfall 1: Caller profile without `organization_id` → MoU create 400

**What goes wrong:** `mous` fn returns 400 "Caller has no organization on profile" before touching the DB.
**Why:** JWTs carry no org claim; the fn (and RLS) resolve org from `profiles.organization_id`.
**How to avoid:** verify the E2E/test user's profile has an org (PR #85's verification implies the staging admin does). Surface the 400 message in the dialog error state.
**Warning signs:** create works for one account, 400s for another.

### Pitfall 2: New MoU shows empty parties in the list

**What:** `mous_frontend` reads `parties` jsonb, not signatory FKs — omit `parties` on create and the list row renders blank party names (criterion 1 technically passes but looks broken).
**Avoid:** send `parties` derived from the selected dossiers (see Pattern 1).

### Pitfall 3: Role-list drift (admin/editor/viewer vs admin/manager/staff/viewer)

**What:** list-page filter + i18n `roles.*` carry `manager`/`staff`; edge fns validate `['admin','editor','viewer']`; DB `role` is free text. Also **`roles.editor` is MISSING from `user-management.json`** (EN and AR).
**Avoid:** new pickers use the edge-fn set; add `roles.editor` EN+AR. Do not "fix" the list filter beyond what FEAT-02/03 needs (pre-existing drift, out of scope — note it in the summary).

### Pitfall 4: `users.tsx` flat→layout conversion breaks the list route

**What:** adding `users/create.tsx` beside flat `users.tsx` makes `users.tsx` the parent layout; if it still renders `UsersPage` directly (no `<Outlet/>`), children never render.
**Avoid:** convert `users.tsx` to `component: () => <Outlet />` (keeping `beforeLoad: requireAdmin`) and move the list to `users/index.tsx` — exact `engagements.tsx` precedent. Let `routeTree.gen.ts` regenerate.

### Pitfall 5: i18n namespace/separator traps

**What:** unregistered namespaces fall back to EN in both languages; dot-form ns keys leak raw keys.
**Avoid:** `user-management` and `positions` are already registered; MoU form keys should extend the existing `mous.*` block in `common.json` (page already uses `t('mous.addMou')` in the default ns) — keep EN/AR symmetric.

### Pitfall 6: Edge-fn auth 401s on valid tokens

**What:** bare `getUser()` on a plain anon client 401s on older supabase-js.
**Avoid:** N/A for existing fns (all use header-injected clients or `getUser(token)`), but if any fn is edited+redeployed, preserve the pattern. Also `verify_jwt` defaults to true for all these fns (none carved out in config.toml).

### Pitfall 7: New user invisible in list

**What:** created users are `is_active: false` (pending activation) — a tester filtering "active" won't see them.
**Avoid:** E2E asserts with the default "all" filter (list orders `created_at desc`, new user is row 1). Note: the activation email itself is a stub (`console.log`) and there is **no `/activate` route** in the frontend — activation is a pre-existing gap explicitly OUT of FEAT-02's success criterion; record it, don't fix it.

### Pitfall 8: `assign-role` deployment unverified

**What:** the 2026-06-28 sweep deployed create-user/deactivate/reactivate/user-permissions but intentionally skipped `assign-role` ("unchanged"); its live version/state is unrecorded.
**Avoid:** early plan task — verify via Supabase MCP (`list_edge_functions`) and deploy if missing/stale, then smoke it before building the detail page's role control.

### Pitfall 9: CORS interaction with Phase 90

**What:** `mous` uses a local wildcard `corsHeaders`; create-user et al. use the deprecated shared wildcard. Phase 90 owns the migration to `getCorsHeaders(req)`.
**Avoid:** do NOT migrate CORS wholesale here; if a fn is edited+redeployed anyway, migrating just that fn is acceptable discretion (requires `ALLOWED_ORIGINS` secret present — CORS-01 verifies it in Phase 90).

### Pitfall 10: ESLint/CI gates

**What:** raw hex / palette literals / physical direction classes / filename case / unregistered i18n namespaces all FAIL CI (`--max-warnings 0`); pre-commit builds the frontend; Bundle Size Check is required.
**Avoid:** token classes only; the new pages are small (no lazy-loading needed, but keep heavy imports out); run `pnpm --dir frontend lint` + `type-check` per task.

## Code Examples

### MoU create mutation hook (house pattern)

```ts
// frontend/src/domains/mous/hooks/useCreateMou.ts — mirrors domains/* + NewPositionDialog flow
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMou } from '../repositories/mous.repository'
import type { CreateMouPayload, Mou } from '../types'

export const useCreateMou = (): ReturnType<typeof useMutation<Mou, Error, CreateMouPayload>> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMouPayload) => createMou(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mous'] }) // matches MousPage inline key
    },
  })
}
```

```ts
// frontend/src/domains/mous/repositories/mous.repository.ts
import { apiPost } from '@/lib/api-client'
export async function createMou(payload: CreateMouPayload): Promise<Mou> {
  return apiPost<Mou>('/mous', payload) // edge base URL; ApiError carries localized message
}
```

### Zod schema shape (messages are i18n keys — TaskEditDialog/NewPositionDialog precedent)

```ts
const createMouSchema = z
  .object({
    title: z.string().min(1, 'mous.form.errors.titleRequired'),
    title_ar: z.string().min(1, 'mous.form.errors.titleArRequired'),
    type: z.enum(['bilateral', 'multilateral', 'framework', 'technical']),
    mou_category: z.enum(['data_exchange', 'capacity_building', 'strategic', 'technical']),
    lifecycle_state: z
      .enum([
        'draft',
        'negotiation',
        'pending_approval',
        'signed',
        'active',
        'suspended',
        'expired',
        'terminated',
      ])
      .default('draft'),
    signatory_1_dossier_id: z.string().uuid().nullable().optional(),
    signatory_2_dossier_id: z.string().uuid().nullable().optional(),
    effective_date: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    description: z.string().optional(),
  })
  .refine(
    (v) => !v.signatory_1_dossier_id || v.signatory_1_dossier_id !== v.signatory_2_dossier_id,
    {
      message: 'mous.form.errors.signatoriesMustDiffer',
      path: ['signatory_2_dossier_id'],
    },
  )
  .refine(
    (v) =>
      !v.effective_date || !v.expiry_date || new Date(v.expiry_date) > new Date(v.effective_date),
    {
      message: 'mous.form.errors.expiryAfterEffective',
      path: ['expiry_date'],
    },
  )
```

### User-management invoke method (add beside existing delegation methods)

See Pattern 3 above — `supabase.functions.invoke('create-user', { body })`; types already present in `services/user-management-api.ts`.

## State of the Art

| Old Approach                                                    | Current Approach                                                                | When Changed        | Impact                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| MoU writes blocked (broken triggers + JWT-claim RLS)            | SECURITY DEFINER triggers + profile-resolved org RLS + rewritten edge fn v10    | PR #85, 2026-06-29  | FEAT-01 is frontend-only                       |
| user-mgmt fns targeting non-existent `status` col, no clearance | L1-hardened: `is_active`, optional clearance 1–4, role-write rollback, deployed | 2026-06-27/28 sweep | FEAT-02/03 backends ready (verify assign-role) |
| authz via user_metadata                                         | `public.users.role` single source (`require-admin.ts`)                          | prod-quality sweep  | Never reintroduce metadata roles               |
| `ar-SA` arab digits                                             | `toFormatLocale` → Latin digits both locales; `format-date` helpers             | Phase 82            | Use helpers in new pages                       |
| 4 design directions                                             | Linear-only, dark default, 6/8/12 radii                                         | Phases 77–85        | New surfaces token-only                        |

**Deprecated/outdated:** wildcard `corsHeaders` (Phase 90 owns migration); `consistency_checks` table shape (superseded by `position_consistency_checks`); the IntelDossier handoff prototype (historical).

## Assumptions Log

| #   | Claim                                                                                                                                                           | Section | Risk if Wrong                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| A1  | Migration `20260111100001_position_consistency_checker.sql` is applied on staging (canonical set, Jan-2026 era; not individually re-verified live this session) | FEAT-04 | Low — recommendation is delete; only matters if user overrides to build (then verify via MCP first)   |
| A2  | `assign-role` is deployed on staging at SOME version (memory says "unchanged this sweep", implying prior deploy)                                                | FEAT-03 | Role changes 404 at runtime — mitigated by the mandated early verify/deploy task (Pitfall 8)          |
| A3  | The staging admin/test user's `profiles.organization_id` is set (implied by PR #85's live MOU-001 verification)                                                 | FEAT-01 | MoU create 400s in E2E — check profile in test setup                                                  |
| A4  | `parties` jsonb column exists on live `mous` (the live `mous_frontend` view selects it and the view works today; edge fn spreads it conditionally)              | FEAT-01 | If absent, insert with `parties` errors — fallback: send only signatory ids + update the view instead |
| A5  | `public.users.created_at` is set by the on-signup trigger so new users sort first in the list                                                                   | FEAT-02 | E2E locator needs a search-by-email instead of row-1 assertion                                        |

All other claims are `[VERIFIED: codebase/migrations/STATE.md]` from direct reads this session.

## Open Questions

1. **FEAT-04 final call (user decision).** Research recommends DELETE with a post-Phase-91 revisit trigger; the build-scoped alternative is documented above. The planner should carry the recommendation but the decision record must note the user delegated it to research → plan.
2. **Signatory dossier type filter** — restrict DossierPicker to `country`/`organization`, or allow all 8 types? (Claude's discretion; fn accepts any. Recommend country+organization to match MoU semantics.)
3. **`user_type: guest` support in the create form** — the fn supports it (with expires_at + allowed_resources), i18n exists, but it adds conditional-field complexity. Recommend employee-only for this phase (omit the picker or hardcode `employee`), noting guest creation as follow-up.
4. **MoU dialog vs route** — recommendation is dialog (NewPositionDialog precedent); a `/mous/new` route is acceptable if the planner wants URL-addressable create.

## Environment Availability

| Dependency   | Required By                                    | Available                      | Version                        | Fallback     |
| ------------ | ---------------------------------------------- | ------------------------------ | ------------------------------ | ------------ |
| Node         | build/test                                     | ✓                              | v22.23.1                       | —            |
| pnpm         | monorepo                                       | ✓                              | 10.29.1                        | —            |
| Supabase CLI | edge fn deploy/verify                          | ✓                              | 2.106.0                        | Supabase MCP |
| Supabase MCP | migrations (none expected) + live verification | ✓ (orchestrator sessions)      | staging `zkrcjzdemdmwhearhfgg` | CLI          |
| Playwright   | E2E validation                                 | ✓ (configs at root + frontend) | —                              | —            |
| gsd-sdk      | commits/queries                                | ✓                              | —                              | —            |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest (unit/component) + Playwright (E2E/a11y/visual)                                                                                                                                        |
| Config files       | `frontend/vitest.config.ts`, `frontend/playwright.config.ts` (testDir `frontend/tests`, baseURL `E2E_BASE_URL` ?? `http://localhost:5173`), root `playwright.config.ts` (testDir `tests/e2e`) |
| Quick run command  | `pnpm --dir frontend test -- run <file>`                                                                                                                                                      |
| Full suite command | `pnpm --dir frontend test -- run` + `pnpm --dir frontend lint --max-warnings 0` + `pnpm --dir frontend type-check`                                                                            |

### Phase Requirements → Test Map

| Req ID                | Behavior                                                                                                                                                              | Test Type                                   | Automated Command                                                                                                                 | File Exists?                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| FEAT-01               | CreateMouDialog validates (bilingual titles, enum pickers, date/signatory refines) and submits payload incl. `parties`                                                | unit/component                              | `pnpm --dir frontend test -- run src/components/mous/__tests__/CreateMouDialog.test.tsx`                                          | ❌ Wave 0                                   |
| FEAT-01               | End-to-end: click Add MoU → fill → submit → new row visible in list                                                                                                   | e2e                                         | `pnpm --dir frontend exec playwright test tests/e2e/mou-create.spec.ts` (needs authed session + staging; profile org — Pitfall 1) | ❌ Wave 0                                   |
| FEAT-02               | Create form mirrors edge validators (username regex, role set admin/editor/viewer, clearance 1–4); success path invokes `create-user` and navigates to list           | unit/component                              | `pnpm --dir frontend test -- run src/pages/users/__tests__/UserCreatePage.test.tsx` (mock invoke)                                 | ❌ Wave 0                                   |
| FEAT-02               | Live smoke: admin creates user → 201 → row appears (inactive) in list                                                                                                 | e2e or scripted smoke                       | Playwright spec OR curl smoke against staging fn with admin JWT                                                                   | ❌ Wave 0                                   |
| FEAT-03               | Detail page renders user fields; role change handles both immediate and `requires_approval` responses; deactivate/reactivate flip status badge                        | unit/component                              | `pnpm --dir frontend test -- run src/pages/users/__tests__/UserDetailPage.test.tsx`                                               | ❌ Wave 0                                   |
| FEAT-04 (delete path) | No dangling references: repo grep for `ConsistencyPanel`, `consistency.` i18n keys, `consistency_check` field returns 0 in live code; full vitest green post-deletion | integration (grep gate + suite)             | `rg -l "ConsistencyPanel" frontend/src --glob '!**/.understand-anything/**'` (expect empty) + full vitest                         | gate command, no new file                   |
| EN/AR (criterion 5)   | New dialog/pages render in `dir="rtl"` with AR strings, logical properties                                                                                            | e2e (query `?lng=ar`) + manual render check | Playwright with `?lng=ar` + screenshot; human render sign-off per house practice                                                  | ❌ Wave 0 (can fold into the two e2e specs) |

**Manual-only:** final visual sign-off of the three new surfaces at 1400/1024, dark, EN+AR (house practice from Phases 81–85; automated pixel baselines are out of scope for new pages).

### Sampling Rate

- **Per task commit:** targeted vitest file + `pnpm --dir frontend type-check` (pre-commit hook also builds)
- **Per wave merge:** `pnpm --dir frontend test -- run` + `lint --max-warnings 0`
- **Phase gate:** full vitest + lint + type-check + the two E2E specs + FEAT-04 grep gate green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/mous/__tests__/CreateMouDialog.test.tsx` — FEAT-01 unit
- [ ] `frontend/tests/e2e/mou-create.spec.ts` — FEAT-01 e2e (auth via `.env.test` credentials)
- [ ] `frontend/src/pages/users/__tests__/UserCreatePage.test.tsx` — FEAT-02 unit
- [ ] `frontend/src/pages/users/__tests__/UserDetailPage.test.tsx` — FEAT-03 unit
- [ ] `frontend/tests/e2e/user-management.spec.ts` — FEAT-02/03 e2e (create → list → detail → role/status)
- Framework install: none (Vitest + Playwright already configured)

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies        | Standard Control                                                                                                               |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | yes            | Supabase Auth JWT; edge fns validate via header-injected client `getUser()`; `verify_jwt` default-on                           |
| V3 Session Management | yes            | `assign-role` terminates sessions on change (fn-owned); no client session logic added                                          |
| V4 Access Control     | yes            | `requireAdmin` beforeLoad (UX) + per-fn `public.users.role === 'admin'` (enforcement); MoU writes bounded by org-isolation RLS |
| V5 Input Validation   | yes            | Zod client-side mirroring the edge validators; edge fns re-validate server-side (never trust the form)                         |
| V6 Cryptography       | no new surface | temp passwords/activation via Supabase Auth admin API (existing)                                                               |

### Known Threat Patterns for this stack

| Pattern                                                    | STRIDE          | Standard Mitigation                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgREST filter-string injection via `.or(` interpolation | Tampering       | **Do not copy** the existing `MousPage`/`UsersListPage` search `.or(...ilike.%${term}%)` shape into new code — this exact class is SEC-01 (Phase 88, `UserPicker`). New code uses `.ilike()` builders or sanitized input. Existing pages' search is out of scope here. |
| Privilege escalation via client-writable metadata          | Elevation       | Role reads/writes only via `public.users.role` + service-role fns (already enforced)                                                                                                                                                                                   |
| Self-service admin grant                                   | Elevation       | `assign-role` dual-approval for admin grants; UI must not mask the `requires_approval` response                                                                                                                                                                        |
| IDOR on `/users/$id`                                       | Info disclosure | Route admin-gated; `public.users` RLS governs the read — verify a non-admin JWT cannot read arbitrary rows via the same select (smoke in E2E)                                                                                                                          |
| Wildcard CORS on touched fns                               | Info disclosure | Known debt owned by Phase 90 (CORS-01..03); don't widen it, optionally narrow touched fns                                                                                                                                                                              |

## Runtime State Inventory

Not a rename/refactor/migration phase — omitted. (FEAT-04 delete touches no stored data: `position_consistency_checks` rows, if any, are backend-only and retained.)

## Sources

### Primary (HIGH confidence — direct reads this session)

- `frontend/src/pages/MoUs/MousPage.tsx` (disabled button :209; list query/view usage)
- `supabase/functions/mous/index.ts` (v10 contract) + PR #85 commit `7c645635` (verified-live statement) + migrations `20260629000300/000400`
- `supabase/migrations/036_update_mous_frontend_view.sql` (parties jsonb rendering)
- `frontend/src/routes/_protected/users.tsx`, `pages/users/UsersListPage.tsx`, `services/user-management-api.ts`, `lib/auth/require-admin.ts`
- `supabase/functions/create-user/index.ts` (full), `assign-role/index.ts` (contract), `_impl-brief-L1-auth.md` (D-3/D-11/D-22/D-23 hardening scope)
- `supabase/functions/positions-consistency-check/index.ts` (full 979 lines), `positions-consistency-reconcile/index.ts` (501 stub), migrations `20250101008` + `20260111100001`
- `frontend/src/components/consistency-panel/ConsistencyPanel.tsx` + test; `routes/_protected/positions/$id.tsx`; positions domain repository/hooks/types
- `frontend/src/i18n/index.ts` + `en|ar/{common,positions,user-management}.json` key inventories
- `.planning/STATE.md`, `.planning/data-entry-assessment/{_BACKLOG,_PLAN-REMAINING}.md` (C-3/D-10/E-8 provenance)
- Project memory: edge-deploy record 2026-06-28 (fn versions), L7 relanding, auth-role unification

### Secondary (MEDIUM)

- `frontend/CLAUDE.md`, `supabase/CLAUDE.md` (house patterns, RLS/auth gotchas)

### Tertiary (LOW)

- none — no external web research needed (all-in-repo phase)

## Metadata

**Confidence breakdown:**

- FEAT-01 backend state: HIGH — PR #85 commit message records live verification (MOU-001 created via the fn, migrations applied, fn deployed v10)
- FEAT-02/03 backend state: HIGH for create/deactivate/reactivate deploys (recorded 2026-06-28); MEDIUM for assign-role deployment (A2)
- FEAT-04 evidence: HIGH (every artifact read in full); recommendation is judgment on verified evidence
- Pitfalls: HIGH — each traced to a specific file/line or recorded incident

**Research date:** 2026-07-06
**Valid until:** ~2026-08-05 (internal codebase facts; re-verify edge-fn versions if other phases deploy first)
