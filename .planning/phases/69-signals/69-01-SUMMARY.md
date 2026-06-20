---
phase: 69-signals
plan: 01
subsystem: database
tags:
  [
    supabase,
    postgres,
    rls,
    clearance,
    security-invoker,
    rpc,
    i18n,
    typescript,
    intelligence-signals,
  ]

# Dependency graph
requires:
  - phase: 68-ai-foundations-remediation
    provides: profiles.clearance_level (integer 1–4), canonical clearance RLS expression, SECURITY INVOKER RPC precedent
  - phase: 54-intelligence-engine-groundwork
    provides: intelligence_event table + signal_source_type enum + intelligence_event_dossiers polymorphic junction
provides:
  - 'intelligence_event extended with title, sensitivity_level, status, category, ai_confidence, escalated_task_id (migration written + committed; LIVE APPLY delegated to orchestrator)'
  - 'Clearance-keyed RLS replacing role-locked policies on intelligence_event (4) + intelligence_event_dossiers (3) — D-05 loosened writes to any-cleared-user'
  - 'read_signals SECURITY INVOKER RPC (per-dossier, status, since filters; source_type::text cast)'
  - 'intelligence-signals i18n namespace (en + ar, 55 keys each) registered in BOTH resources blocks'
  - 'frontend/src/domains/signals base types (Signal, SignalStatus, SignalCategory, SignalSeverity, SignalSourceType, SignalFilters, CreateSignalInput, UpdateSignalStatusInput, EscalateSignalInput, signalKeys)'
affects:
  [69-02, 69-03, 69-04, signals-hooks, signals-queue, dossier-signals-tab, read_signals-agent-tool]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Clearance-gated RLS via canonical sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())'
    - 'EXISTS-on-parent junction RLS that re-checks parent clearance (not just tenancy)'
    - 'SECURITY INVOKER RPC with enum::text cast to dodge 42804'
    - 'Hyphenated i18n namespace registered in both resources.en and resources.ar'
    - 'Domain type module + barrel under frontend/src/domains/{feature}'

key-files:
  created:
    - supabase/migrations/20260614_phase69_signals_extend.sql
    - frontend/src/i18n/en/intelligence-signals.json
    - frontend/src/i18n/ar/intelligence-signals.json
    - frontend/src/domains/signals/types/signal.types.ts
    - frontend/src/domains/signals/index.ts
  modified:
    - frontend/src/i18n/index.ts

key-decisions:
  - 'D-06: extend intelligence_event in place (NOT a new curated table); intelligence_signals plural left untouched (dead)'
  - 'D-03: add status column with lean new→acknowledged|dismissed|escalated lifecycle'
  - 'D-05: loosen writes from admin/editor to any-cleared-user (sensitivity_level <= clearance_level + created_by=auth.uid())'
  - 'D-07: fixed category enum political/economic/security/diplomatic/other (DB CHECK + i18n labels + TS union aligned)'
  - 'D-08: ai_confidence NUMERIC(3,2) 0.00–1.00, null for human_entered'
  - 'D-09: single-language free-text title/body (no title_en/title_ar/language column)'
  - 'D-14: read_signals SECURITY INVOKER (never DEFINER); source_type::text cast mandatory'

patterns-established:
  - 'Clearance RLS: EXISTS-on-parent junction policy re-checks parent sensitivity_level, not just tenancy'
  - 'INVOKER RPC enum::text cast prevents recurring 42804 trap'

requirements-completed: [SIGNAL-01, SIGNAL-02, SIGNAL-03, SIGNAL-04, SIGNAL-05, SIGNAL-06]

# Metrics
duration: 6min
completed: 2026-06-14
---

# Phase 69 Plan 01: Data Layer, i18n Foundation, and Base Types Summary

**intelligence_event extended with 6 signal columns + clearance-keyed RLS + read_signals INVOKER RPC (migration committed, live apply delegated); intelligence-signals i18n namespace (en+ar, 55 keys) registered; signals domain base types established**

## Pending orchestrator action

Migration file `supabase/migrations/20260614_phase69_signals_extend.sql` was written and committed (`9b2a7ec7`). The **LIVE APPLY to staging `zkrcjzdemdmwhearhfgg` is delegated to the orchestrator** — this executor has no Supabase MCP tool grant and could not run `mcp__supabase__apply_migration`. The orchestrator must apply the migration and verify, on live staging:

1. 6 columns exist on `intelligence_event` (`title`, `sensitivity_level`, `status`, `category`, `ai_confidence`, `escalated_task_id`)
2. `pg_policies` shows the new clearance-keyed names (`intelligence_event_select_clearance`, `intelligence_event_insert_cleared`, `intelligence_event_update_cleared`, `intelligence_event_delete_admin`) and NOT the old role-locked ones (`intelligence_event_select_org`, `intelligence_event_insert_editor`, `intelligence_event_update_editor`)
3. The 3 new `intelligence_event_dossiers` policies are present
4. `read_signals` exists with `security_type='INVOKER'`

Verification SQL (from the plan's `<verify>` blocks):

```sql
SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='intelligence_event' AND column_name IN ('title','sensitivity_level','status','category','ai_confidence','escalated_task_id') ORDER BY column_name;  -- 6 rows
SELECT policyname FROM pg_policies WHERE tablename='intelligence_event' ORDER BY policyname;
SELECT routine_name, security_type FROM information_schema.routines WHERE routine_schema='public' AND routine_name='read_signals';  -- 1 row, INVOKER
```

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-14T15:38:07Z
- **Completed:** 2026-06-14T15:43:59Z
- **Tasks:** 3
- **Files modified:** 6 (5 created, 1 modified)

## Accomplishments

- Forward migration extending `intelligence_event` (6 columns, 3 indexes, 4 clearance-keyed policies, 3 junction policies, `read_signals` INVOKER RPC) — written verbatim from RESEARCH.md spec, committed
- `intelligence-signals` i18n namespace created (en + ar, 55 keys, full parity) and registered in BOTH `resources.en` and `resources.ar`; the repo's i18n namespace guard passes
- Signals domain base types + barrel established — the type contract every later hook/component imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the Phase 69 migration** - `9b2a7ec7` (feat) — live apply delegated to orchestrator
2. **Task 2: Create i18n namespace files and register in index.ts** - `3dd7b958` (feat)
3. **Task 3: Write base TypeScript types for signals domain** - `d598199d` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified

- `supabase/migrations/20260614_phase69_signals_extend.sql` - intelligence_event extension (6 cols), 3 indexes, clearance RLS rewrite (4 + 3 policies), read_signals SECURITY INVOKER RPC with source_type::text cast
- `frontend/src/i18n/en/intelligence-signals.json` - English keys (tab, queue, filters, actions, status, category, toast, dialog, form, badge, keyboard, columns) — 55 keys
- `frontend/src/i18n/ar/intelligence-signals.json` - Arabic mirror; status = جديدة / مُستلمة / مُهملة / مُصعَّدة — 55 keys, full parity
- `frontend/src/i18n/index.ts` - imported + registered `'intelligence-signals'` in both en and ar resources blocks
- `frontend/src/domains/signals/types/signal.types.ts` - 10 named exports (Signal, 4 unions, SignalFilters, CreateSignalInput, UpdateSignalStatusInput, EscalateSignalInput, signalKeys), 72 lines
- `frontend/src/domains/signals/index.ts` - barrel re-export

## Decisions Made

None beyond the plan's locked decisions. The migration body was copied verbatim from RESEARCH.md "Data Layer: Complete Migration Spec" (no re-derivation), the canonical clearance expression matches `20251022000009` byte-for-byte, and the type/i18n/category-enum surfaces were kept aligned with the UI-SPEC and DB CHECK.

## Deviations from Plan

None affecting scope — but two execution-time facts worth recording:

1. **[Not a deviation — environment] The migration's LIVE APPLY was delegated, not skipped.** Per the executor's explicit constraint, this agent has no Supabase MCP grant and cannot run `mcp__supabase__apply_migration`. The migration file is complete and committed; the orchestrator applies + verifies on staging (see "Pending orchestrator action"). No fake apply command was run.

2. **[Not a deviation — corrected invocation] Frontend verify commands.** The plan's `<verify>` blocks call `pnpm --filter frontend typecheck`. The actual workspace package is `intake-frontend` and the script is `type-check` (hyphenated); the lint script is `lint` (it runs eslint over `frontend/src/**` plus the `check-i18n-namespaces.mjs` guard). Ran `pnpm --filter intake-frontend type-check` and `pnpm --filter intake-frontend lint` — both exit 0. This is a command-name correction, not a behavior change.

---

**Total deviations:** 0 code deviations (Rules 1–4 not triggered).
**Impact on plan:** None. All three tasks landed exactly as specified.

## Issues Encountered

- `pnpm --filter frontend ...` matched no workspace (package is named `intake-frontend`). Resolved by using the correct package name; both type-check and lint pass.

## Threat Flags

None. All new surface (clearance RLS, INVOKER RPC) was specified in the plan's `<threat_model>` (T-69-01..05) and implemented as the `mitigate` dispositions require:

- T-69-01/02/05 — clearance gate on intelligence_event SELECT/INSERT/UPDATE (sensitivity_level <= clearance_level; INSERT also pins created_by=auth.uid())
- T-69-03 — read_signals is SECURITY INVOKER (caller JWT → RLS), GRANT EXECUTE TO authenticated
- T-69-04 — junction SELECT re-checks parent clearance via EXISTS

## Next Phase Readiness

- **Blocking on orchestrator:** Plans 69-02..04 (hooks, queue, escalate, per-dossier tab) read the new columns and call `read_signals` — they require the migration to be LIVE on staging. The orchestrator must apply + verify before those plans run.
- i18n namespace and base types are fully landed; later plans can import `@/domains/signals` and `useTranslation('intelligence-signals')` immediately.
- The `read_signals` RPC return shape matches the `Signal` interface 1:1 (incl. `source_type` as text), so the `useSignals` hook in a later plan can cast `data as Signal[]` directly.

---

_Phase: 69-signals_
_Completed: 2026-06-14_

## Self-Check: PASSED

All 7 created/modified files present on disk; all 3 task commits (`9b2a7ec7`, `3dd7b958`, `d598199d`) present in git history. Frontend `type-check` and `lint` (incl. i18n namespace guard) both exit 0.
