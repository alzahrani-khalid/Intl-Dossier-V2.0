---
phase: 69-signals
plan: 04
subsystem: ui
tags:
  [
    react,
    tanstack-query,
    escalation,
    dossier-tabs,
    workspace-nav,
    rtl,
    rls,
    clearance,
    supabase-mcp,
    intelligence-signals,
  ]

# Dependency graph
requires:
  - phase: 69-signals (plan 03)
    provides: SignalsQueue (dossierId prop, escalateTarget placeholder), SignalRow/SignalStatusBadge/CaptureSignalForm, useSignalKeyboardTriage, IntelligencePage Reports|Signals tabs
  - phase: 69-signals (plan 02)
    provides: useSignalEscalate (3-step), useUpdateSignalStatus, useSignals
  - phase: 69-signals (plan 01)
    provides: live intelligence_event extension + clearance RLS + read_signals INVOKER RPC + intelligence-signals i18n
  - phase: shared-infra
    provides: EscalationDialog analog, DossierTabNav/BASE_DOSSIER_TABS, WorkspaceTabNav/WORKSPACE_TABS, dossier $id route pattern, work_item_dossiers + tasks-create edge fns
provides:
  - 'EscalateSignalDialog — compact escalate dialog mirroring EscalationDialog (RTL dir, logical ps-/pe-, h-11 targets); pre-fills title/body + priority=severity (1:1), assignee required; confirm → useSignalEscalate; onSuccess = setEscalateTarget(null) only (hook Step 3 owns status=escalated)'
  - 'DossierSignalsTab — thin <SignalsQueue dossierId={dossierId} /> wrapper (ONE data path, D-01)'
  - 'Per-dossier Signals tab on ALL 8 dossier types — 7 DossierShell types via DossierTabNav/BASE_DOSSIER_TABS + $id/signals.tsx child routes; engagement via WorkspaceTabNav/WORKSPACE_TABS + engagements/$engagementId/signals.tsx (engagementId == dossier id, shared-PK extension)'
affects: [phase-70-signals-digests, phase-72-agent-read-signals]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Two dossier-nav subsystems unified onto one Signals surface: DossierTabNav (BASE_DOSSIER_TABS) for the 7 DossierShell types + WorkspaceTabNav (WORKSPACE_TABS) for engagements — both render the same DossierSignalsTab → SignalsQueue → read_signals path'
    - 'engagement_dossiers is a 1:1 extension table sharing the dossiers PK, so an engagement route param IS its dossier_id — no resolution layer needed for read_signals p_dossier_id'

# Requirements
requirements:
  - SIGNAL-03
  - SIGNAL-04
  - SIGNAL-05
  - SIGNAL-06
---

# Plan 69-04 Summary — Escalate Dialog, Per-Dossier Tabs, read_signals Validation, Phase Gate

## What shipped

**Task 1 — EscalateSignalDialog** (`2f10556a`)
`frontend/src/components/signals/EscalateSignalDialog.tsx`: compact escalate dialog mirroring `EscalationDialog.tsx` (RTL `dir`, logical `ps-/pe-`, `h-11` touch targets, `flex-col-reverse` footer). Pre-fills title/body from the signal, `priority = signal.severity` (1:1), editable assignee (falls back to current user with an inline non-blocking warning), optional deadline. Confirm → `useSignalEscalate.mutateAsync(...)`; on success → toast + `setEscalateTarget(null)` **only** (the hook's Step 3 already sets `status='escalated'` — no redundant `updateStatus`). Wired into `SignalsQueue`, replacing Wave 3's placeholder. Added `form.assignee*`/`deadlineLabel` i18n keys (en+ar).

**Task 2 — DossierSignalsTab + all 8 dossier types** (`fa3e59c3`, `262b93ce`)
`DossierSignalsTab.tsx` is a thin `<SignalsQueue dossierId={dossierId} />` wrapper — one data path (D-01/SIGNAL-04). Wired into **all 8** dossier-type detail surfaces:

- **7 `DossierShell` types** (`fa3e59c3`): `signals` added to `BASE_DOSSIER_TABS` (`DossierTabNav`) + `$id/signals.tsx` child route each — countries, elected-officials, forums, organizations, persons, topics, working_groups. Tab label via `dossier-shell` namespace (`tabs.signals` en+ar).
- **engagement** (`262b93ce`): a separate subsystem — `signals` added to `WORKSPACE_TABS` (`WorkspaceTabNav`) + `engagements/$engagementId/signals.tsx`, label in the `workspace` namespace (en+ar). `engagementId == dossier id` (shared-PK extension), so it passes straight through to `read_signals`'s `p_dossier_id`.

**Task 3 — Phase Gate UAT:** see Verification.

## Verification

### Data layer / agent tool — VERIFIED LIVE on staging `zkrcjzdemdmwhearhfgg` (orchestrator, Supabase MCP)

- **Migration applied + introspected:** 6 new columns; `intelligence_event` policies are exactly the 4 clearance-keyed ones (old `*_org`/`*_editor` dropped — **no permissive-policy leak**); `read_signals` is `SECURITY INVOKER`; junction has all 4 policies.
- **🔴 Critical RLS bug found & fixed:** the migration's clearance subquery used `profiles WHERE id = auth.uid()`, but `profiles` keys on **`user_id`** (no `id` column) — `id` silently bound to the outer table → subquery NULL for every row → **every authenticated user would have seen an empty signals queue regardless of clearance/seed**. Type-check/lint/build pass clean; only live RLS testing exposes it. Fixed live (corrective MCP migration `phase69_signals_fix_clearance_subquery_user_id`) + in the repo migration (`fcd4e412`). Now matches the canonical `dossiers` clearance policies verbatim.
- **SIGNAL-06 — VERIFIED:** impersonating a clearance-3 org member, `read_signals(p_dossier_id, ...)` returned the sens-1 and sens-3 seeded signals and correctly **hid** the sens-4 one; per-dossier filter composes with the clearance gate; no 42804 (`source_type::text`). By monotonicity of `sensitivity_level <= clearance`, a lower-clearance caller sees strictly less.
- **SIGNAL-02 / SIGNAL-04 (clearance core) — VERIFIED:** above-clearance signal hidden from a lower-clearance caller (indistinguishable empty) at the data layer.

### UI scenarios — build-green, USER SPOT-CHECK PENDING (per finalize-now decision)

Not driven live this session (no dev server up; staging has sparse `organization_members` tenancy). Code ships type-check + lint + production-build green. To be confirmed by the user on a running app, EN + AR:

- **SIGNAL-01** — manual capture → appears in the global queue and the linked dossier's Signals tab.
- **SIGNAL-03** — keyboard-only triage (`j/k/a/d/e`) in Arabic (`dir=rtl`, Tajawal).
- **SIGNAL-05** — escalate → task in `/kanban` (todo) + `work_item_dossiers` links copied + signal `status=escalated`.

Exact reproduction steps for these three are in the checkpoint return (seed via Supabase MCP, CDP `Network.setBlockedURLs` for forced-error empty-state assertions). Note: a live login must use an `organization_members` account (tenant isolation), or seed signals in the test user's resolvable org.

## Deviations / decisions

1. **All 8 dossier types wired** (user elected to wire engagement before finalizing) — engagement uses the workspace-nav subsystem, not `DossierShell`.
2. **Migration corrected in place** (`id`→`user_id`) rather than as a second repo file — gives a future production apply the correct schema in one migration; staging already carries both the original + the corrective MCP migration.
3. UI UAT (SIGNAL-01/03/05) deferred to user spot-check per the finalize-now decision; backend + the security-critical clearance path are proven live.

## Gates

- `pnpm --filter intake-frontend type-check` exit 0 · `lint` (`--max-warnings 0` + i18n namespace guard) exit 0 · `build` (vite) exit 0 across all three commits.

## Post-review fixes (advisory code-review gate)

Code review: **0 CRITICAL / 0 HIGH**; security + RLS clean (caller-JWT only, INVOKER, clearance ceiling on INSERT, `user_id` fix confirmed). Two MEDIUM items fixed before close (`ab240490`):

1. **SIGNAL-05 dossier-link gap** — `SignalsQueue` never passed `dossierIds` to `EscalateSignalDialog`, so `useSignalEscalate` Step 2 was always skipped and escalated tasks got **zero** dossier links (would fail the SIGNAL-05 spot-check). Fixed: new `useSignalDossierLinks(signalId)` reads `intelligence_event_dossiers` under the caller JWT (RLS clearance-safe by construction) and feeds the IDs into the escalate call.
2. **Double-submit guard** — `useSignalKeyboardTriage` gained an `enabled` flag; `SignalsQueue` passes `enabled={escalateTarget === null}` so `e`/`a`/`d`/`j`/`k` go quiet while the escalate dialog is open.

Two LOW items → backlog (documented tradeoffs): (a) the non-transactional 3-step escalate can orphan a created task if Step 3 fails — needs a retry-with-existing-taskId recovery path; (b) `useSignalKeyboardTriage` action branches read `signals[focusedIndex]` from closure (correct today via the dep array, but asymmetric with the `j/k` functional form).

## Commits

- `2f10556a` feat(69-04): EscalateSignalDialog wired into SignalsQueue
- `fa3e59c3` feat(69-04): per-dossier Signals tab on all 7 DossierShell types
- `262b93ce` feat(69-04): wire engagement Signals tab (8th dossier type, workspace nav)
- `fcd4e412` fix(69-01): clearance subquery profiles.id → profiles.user_id (RLS was blocking all signal reads)
- `ab240490` fix(69-04): copy signal dossier links onto escalated task + guard double-submit
