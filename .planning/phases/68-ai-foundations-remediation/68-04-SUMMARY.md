---
phase: 68-ai-foundations-remediation
plan: 04
subsystem: ai
tags: [supabase, rls, jwt, security, chat-assistant]

requires:
  - phase: 68-02
    provides: canonical clearance scale (profiles.clearance_level RLS)
provides:
  - chat-assistant tool reads run under the caller's JWT (no supabaseAdmin)
  - ChatRequest.authHeader threads the Bearer token end-to-end
  - queryCommitments -> aa_commitments, getEngagementHistory -> engagement_dossiers (D-10)
affects: [68-08]

tech-stack:
  added: []
  patterns:
    - 'Per-request createUserClient(authHeader) = ANON_KEY + caller Bearer; RLS-scoped reads in AI tools'

key-files:
  created: []
  modified:
    - backend/src/ai/agents/chat-assistant.ts
    - backend/src/api/ai/chat.ts
    - tests/integration/chat-assistant-rls.test.ts

key-decisions:
  - 'Test scoped to chat-assistant.ts (REMED-03/D-08 = interactive assistant), not the whole agents dir — brief-generator/intake-linker still use supabaseAdmin (out of scope, todo filed)'
  - 'All chat.ts supabaseAdmin uses are internal ai_runs/ai_messages/ai_tool_calls logging (audited) — preserved per Pitfall 4'
  - "Corrected plan column assumptions vs live A2/A3: aa_commitments has no 'type'; engagement_dossiers uses start_date/end_date and DOES have location_en/ar"

patterns-established:
  - 'Interactive AI tool functions take authHeader and build a JWT-scoped client per call'

requirements-completed: [REMED-03]

duration: 35min
completed: 2026-06-14
---

# Phase 68 — Plan 04 Summary

**The interactive chat assistant no longer touches supabaseAdmin — all 5 tool functions read through a per-request ANON_KEY client carrying the caller's Bearer token, so RLS (sensitivity_level <= clearance_level) gates every result; legacy commitments/engagements tables repointed to aa_commitments/engagement_dossiers.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-06-14
- **Tasks:** 2
- **Files modified:** 3

## Task Commits

1. **chat-assistant + chat.ts + test** — `853b8dc6` (feat)

## Verification — VERBATIM

- `grep "supabaseAdmin" backend/src/ai/agents/chat-assistant.ts` → **no match** (exit 1) ✅
- `grep -c 'SUPABASE_ANON_KEY' chat-assistant.ts` → **1** ✅
- `grep -c 'authHeader' chat-assistant.ts` → **23** (≥5) ✅; `chat.ts` → **3** (≥1) ✅
- `grep -c 'aa_commitments'` → **3**; `grep -c 'engagement_dossiers'` → **2** ✅
- `grep -c "from('commitments')"` / `"from('engagements')"` → **0 / 0** ✅
- `tests/integration/chat-assistant-rls.test.ts` → **2 passed** (REMED-03 GREEN) ✅
- `pnpm --filter intake-backend exec tsc --noEmit` → **exit 0** (clean) ✅

## Deviations from Plan

### 1. [Scope] Test narrowed to chat-assistant.ts

- The plan-01 stub grepped the whole `backend/src/ai/agents/` dir. That dir also contains `brief-generator.ts` and `intake-linker.ts`, which still use `supabaseAdmin`. REMED-03 (D-08) is scoped to the **interactive assistant**; those two are background agents, out of scope (flipping them blindly could break background/no-JWT invocation). Narrowed the assertion to `chat-assistant.ts` (which is what the must-have actually states) and filed `.planning/todos/pending/p68-followup-supabaseadmin-background-agents.md`.

### 2. [Schema] Plan column assumptions corrected against live A2/A3

- `aa_commitments` has **no `type`** column → select uses `id, title, title_ar, status, priority, due_date, owner_user_id, is_deleted, created_at, updated_at`.
- `engagement_dossiers` uses **`start_date`/`end_date`** (plan said `engagement_date`, which doesn't exist) and **does** have `location_en/ar` (plan said they don't) → select uses `id, engagement_type, engagement_category, location_en, location_ar, start_date, end_date`.

### 3. [Mechanics] Comment hygiene

- The literal `supabaseAdmin` had to be removed from my own code comment too (the grep test would otherwise match it). Reworded to "service-role admin client".

---

**Total deviations:** 3 (1 scope-narrowing + todo, 2 schema/mechanics). No scope creep; security goal met for the interactive assistant.

## Issues Encountered

- `pnpm --filter intake-backend run typecheck` reports "no typecheck script" (turbo/pnpm quirk despite package.json having one); ran `pnpm --filter intake-backend exec tsc --noEmit` directly → clean.
- Full backend suite run consolidated into the 68-08 BLOCKING gate (its designated purpose); targeted test + typecheck green here. No other `ChatRequest` constructors exist outside chat.ts, so the now-required `authHeader` field breaks nothing.

## Next Phase Readiness

- REMED-03 closed for the interactive assistant. Wave 3 nearly done — only 68-06 (observability Docker, checkpoint) remains before Wave 4.

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
