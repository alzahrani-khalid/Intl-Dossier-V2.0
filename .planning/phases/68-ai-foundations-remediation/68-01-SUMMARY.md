---
phase: 68-ai-foundations-remediation
plan: 01
subsystem: testing
tags: [vitest, rls, pgvector, i18n, supabase-mcp, tdd]

requires:
  - phase: 68-research
    provides: A1–A6 assumption log, validation strategy
provides:
  - Five Wave-0 RED test/script files gating all phase-68 implementation waves
  - A1–A6 live-DB introspection facts (verbatim below) for downstream plans
  - REMED-06 i18n namespace guard (string + array useTranslation forms)
affects: [68-02, 68-03, 68-04, 68-05, 68-07, 68-08]

tech-stack:
  added: []
  patterns:
    - 'Catalog-read helper RPC pattern (get_function_security) for prosecdef assertions over PostgREST'
    - 'i18n namespace registry guard parses resources.en keys via brace-walk'

key-files:
  created:
    - scripts/check-i18n-namespaces.mjs
    - tests/integration/search-clearance.test.ts
    - tests/integration/chat-assistant-rls.test.ts
    - tests/integration/embedding-dimension.test.ts
  modified:
    - tests/security/rls-audit.test.ts
    - frontend/src/components/waiting-queue/EscalationDialog.tsx

key-decisions:
  - 'search-clearance stub reads prosecdef via a get_function_security(p_proname) helper RPC (PostgREST cannot read pg_catalog); plan 68-03 creates both the helper and the gated RPC'
  - 'embedding-dimension RED test requires >=1 row; plan 68-05 must seed a persistent 1024-dim fixture row so it flips GREEN durably'
  - "EscalationDialog waitingQueue namespace was a genuine REMED-06 offender; fixed to useTranslation('common')"

patterns-established:
  - 'Wave-0 TDD: every REMED has a RED failing assertion before code ships'

requirements-completed: [] # Wave-0 establishes RED stubs; REMED-01/02/03/04/06 are completed by later plans

duration: 35min
completed: 2026-06-14
---

# Phase 68 — Plan 01 Summary

**Five Wave-0 RED test/script files plus confirmed A1–A6 live-DB facts that gate every implementation wave in phase 68; caught and fixed one real REMED-06 namespace offender.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-06-14
- **Tasks:** 2 (DB introspection + Wave-0 stubs)
- **Files modified:** 6 (4 created, 2 modified)

## A1–A6 Live-DB Facts (staging `zkrcjzdemdmwhearhfgg`) — VERBATIM, downstream plans depend on these

**A1 — fulltext/semantic RPC security mode** (`SELECT proname, prosecdef FROM pg_proc WHERE proname IN (...)`):

- `search_entities_fulltext` → `prosecdef = true` (**SECURITY DEFINER**)
- `search_entities_semantic` → `prosecdef = true` (**SECURITY DEFINER**)
- `search_semantic_clearance_gated` → does not exist (RED confirmed for plan 68-03)
- **CONSEQUENCE: A1 = DEFINER → plan 68-03 MUST create the conditional `20260614000003_p68_fulltext_invoker.sql` remediation.**

**A2 — `aa_commitments` columns:** id, after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, owner_contact_id, tracking_mode, due_date, completed_at, ai_confidence, created_at, updated_at, title, proof_url, proof_required, evidence_submitted_at, status_changed_at, completion_notes, created_by, updated_by, created_from_route, created_from_entity, is_deleted, title_ar.

- Confirms D-10: commitments use `due_date` + `owner_user_id`/`owner_contact_id` (NOT `deadline`/`assignee_id`). `dossier_id` FK present.

**A3 — `engagement_dossiers` columns:** id, engagement_type, engagement_category, start_date, end_date, timezone, location_en/ar, venue_en/ar, is_virtual, virtual_link, host_country_id, host_organization_id, delegation_size, delegation_level, objectives_en/ar, outcomes_en/ar, notes_en/ar, engagement_status, created_at, updated_at, lifecycle_stage, parent_forum_id.

- `engagement_dossiers.id` IS the dossier id (extension table). No separate engagement PK.

**A4 — BGE-M3 ONNX output dimension** (code assertion, `embeddings-service.ts:160–171` + `config.ts:134`):

- `embedLocal` pools 'cls', normalizes, then `if (embedding.length > this.dimensions) embedding = embedding.slice(0, this.dimensions)`. **Truncation only when len > target; NO padding code exists.**
- `this.dimensions = parseInt(AI_EMBEDDING_DIMENSIONS || '1024')` = **1024**. BGE-M3 native = 1024 → slice is a no-op → **no pad/truncate corruption.** (REMED-04 write path is clean.)

**A5 — pgvector version** (`SELECT extversion FROM pg_extension WHERE extname='vector'`): **`0.8.0`** (supports HNSW + halfvec). ✓

**A6 — `embedding_owner_type` enum** (`SELECT enum_range(NULL::embedding_owner_type)`): **`{ticket, artifact}`**.

- NOTE: enum has NO `dossier` value. ai_embeddings are owned by ticket/artifact, not dossiers directly → plan 68-03's clearance join must reach dossiers transitively, not via owner_type='dossier'.

**Extra facts captured for plan 68-02:**

- `profiles.clearance_level` distribution: **L1 = 388, L3 = 5** (no L2 currently). Backfill guard `WHERE clearance_level = 1` protects the 5 manually-set L3 profiles.
- **6 policies** call `get_user_clearance_level()` (plan said 5): `view_wg_members_by_dossier_access`, `view_wg_deliverables_by_dossier_access`, `view_wg_meetings_by_dossier_access`, `view_wg_decisions_by_dossier_access`, `work_item_dossiers_select`, **`work_item_dossiers_insert`** (the 6th, not in the plan). The compat shim preserves the signature so all 6 keep working.
- `ai_embeddings.embedding` column type = `vector`; **0 rows** currently.

## Task Commits

1. **REMED-06 offender fix** — `a77dac1f` (fix)
2. **Wave-0 RED stubs + i18n guard** — `c9e4978f` (test)

## RED/GREEN verification (vitest, staging creds)

`vitest run` over the four files: **9 passed | 5 failed (intended RED) | 1 todo**:

- REMED-01: elevated user returns role-derived 3 vs profiles 1 → RED ✓ (nonexistent-user→1 → GREEN)
- REMED-02: `get_function_security` helper missing → RED ✓
- REMED-03: supabaseAdmin found + no authHeader → RED ✓ (×2)
- REMED-04: 0 rows → RED ✓ (reachable → GREEN)
- i18n guard: exit 0 on clean tree; exit 1 on injected `useTranslation('unregistered-ns')` ✓

## Decisions Made

- **search-clearance** reads `prosecdef` through a `get_function_security` helper RPC because PostgREST cannot query `pg_catalog`. Plan 68-03 creates the helper + the gated RPC.
- **embedding-dimension** requires ≥1 row → plan 68-05 must leave a persistent 1024-dim fixture (recorded as a 68-05 obligation).

## Deviations from Plan

### Auto-fixed Issues

**1. [Missing precondition] EscalationDialog unregistered `waitingQueue` namespace**

- **Found during:** Task 2 (running the new i18n guard on the clean codebase)
- **Issue:** `useTranslation(['common','waitingQueue'])` listed `waitingQueue` (a key in common.json) as a namespace. Unregistered → silent English fallback (REMED-06 bug class). Plan assumed the codebase was already clean; the guard found a real offender that would also break 68-07's CI wiring.
- **Fix:** Changed to `useTranslation('common')`, matching sibling components.
- **Verification:** Guard exits 0; EscalationDialog `t('waitingQueue.*')` keys still resolve in common.
- **Committed in:** `a77dac1f`

---

**Total deviations:** 1 auto-fixed (1 missing precondition)
**Impact:** Necessary for the guard to exit 0 and for 68-07. Genuine REMED-06 win. No scope creep.

## Issues Encountered

- `pnpm --filter backend` does not match (workspace is `intake-backend`; tests run via root `vitest.config.ts`). Used `pnpm exec vitest run --config ./vitest.config.ts <paths>`.

## Next Phase Readiness

- Wave-0 complete. A1–A6 facts confirmed. RED gates in place for REMED-01/02/03/04/06.
- Wave 2 (68-02 clearance migration, 68-07 i18n CI wiring) is unblocked.

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
