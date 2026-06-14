---
phase: 69
slug: signals
status: executed
nyquist_compliant: false
wave_0_complete: true
created: 2026-06-14
---

# Phase 69 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Execution status (2026-06-14):** Wave 0 closed (migration applied live + i18n + types).
> Data-layer / agent-tool rows **VERIFIED LIVE** on staging via Supabase MCP impersonation —
> SIGNAL-06 (`read_signals` clearance + per-dossier, no 42804) and the SIGNAL-02/04 clearance
> core (above-clearance hidden) pass; a critical `profiles.id`→`user_id` RLS bug was caught
> here and fixed. UI rows (SIGNAL-01 create, SIGNAL-03 keyboard-AR triage, SIGNAL-05
> escalate→Kanban) are build-green and **pending the user's live spot-check** (finalize-now
> decision) — `nyquist_compliant` stays false until those are confirmed live.
> Derived from `69-RESEARCH.md` → "## Validation Architecture". Task IDs are
> assigned by the planner; rows below are requirement-keyed until plans exist.

---

## Test Infrastructure

| Property               | Value                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (unit/integration) · Playwright (E2E) · live-staging UAT (Supabase MCP + CDP forced-error) |
| **Config file**        | `frontend/vitest.config.ts`                                                                       |
| **Quick run command**  | `pnpm --filter frontend typecheck && pnpm --filter frontend lint`                                 |
| **Full suite command** | `pnpm --filter frontend test --run`                                                               |
| **Estimated runtime**  | ~60–120 seconds (frontend unit)                                                                   |

> **Note on this phase's verification shape.** SIGNAL-01..06 are predominantly
> RLS / clearance / keyboard / RPC _behaviors_ against the live database — they are
> verified by live-staging UAT (seed → observe → restore, EN+AR) and the CDP
> `Network.setBlockedURLs` forced-error protocol, **not** by unit tests. RLS denial
> returns empty `200`s, so assertions are on `role="alert"`/empty-state, never HTTP
> status. The unit-testable surface is narrow: keyboard-nav hook logic, escalate-dialog
> prefill mapping (`severity → priority`), and type/DTO mappers.

---

## Sampling Rate

- **After every task commit:** `pnpm --filter frontend typecheck && pnpm --filter frontend lint`
- **After every plan wave:** `pnpm --filter frontend test --run`
- **Before `/gsd:verify-work`:** Full frontend suite green **AND** all 6 UAT scenarios manually verified on staging `zkrcjzdemdmwhearhfgg` in **both** EN and AR.
- **Max feedback latency:** ~120 seconds (unit); manual UAT is the phase gate, not per-commit.

---

## Per-Task Verification Map

> Requirement-keyed until the planner assigns task IDs. The planner MUST attach each
> row's automated/manual verify to the task that implements it and refine `Task ID`.

| Req ID    | Behavior                                                                                                                             | Test Type                                  | Automated Command                          | Manual?              | Status     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------ | -------------------- | ---------- |
| SIGNAL-01 | Manual signal inserts into `intelligence_event` + `intelligence_event_dossiers` junction row                                         | Live UAT (seed + observe)                  | —                                          | staging EN+AR        | ⬜ pending |
| SIGNAL-01 | Signal appears on the linked dossier's Signals tab (same data filtered)                                                              | Live UAT                                   | —                                          | staging              | ⬜ pending |
| SIGNAL-02 | `ai_generated` signal with non-null `ai_confidence` lands in the same triage queue (badge shown)                                     | Live UAT (seed via Supabase MCP)           | —                                          | staging              | ⬜ pending |
| SIGNAL-02 | Above-clearance `ai_generated` signal hidden from a lower-clearance account (indistinguishable empty)                                | CDP forced-error / second L1 account       | —                                          | staging              | ⬜ pending |
| SIGNAL-03 | `j`/`k` move focus + `a`/`d`/`e` act — keyboard-only, Arabic mode (`dir=rtl`, logical nav)                                           | Manual UAT (AR locale) + unit (hook logic) | `pnpm --filter frontend test --run` (hook) | staging AR           | ⬜ pending |
| SIGNAL-04 | Per-dossier clearance gate: L1 user cannot see L3 signal — empty result, no hint                                                     | CDP forced-error protocol                  | —                                          | staging              | ⬜ pending |
| SIGNAL-04 | Dismiss is reversible (status → restorable; nothing hard-deleted)                                                                    | Live UAT + unit (status reducer)           | `pnpm --filter frontend test --run`        | staging              | ⬜ pending |
| SIGNAL-05 | Escalate signal → `task` (`workflow_stage=todo`) visible on Kanban; dossier links copied to `work_item_dossiers`; bidirectional link | Live UAT                                   | —                                          | staging              | ⬜ pending |
| SIGNAL-05 | `severity → priority` 1:1 mapping in the escalate dialog prefill                                                                     | Unit                                       | `pnpm --filter frontend test --run`        | —                    | ⬜ pending |
| SIGNAL-06 | `read_signals({ p_dossier_id, p_status, p_since, p_limit })` returns only at/below caller clearance                                  | Direct RPC invocation (INVOKER)            | —                                          | staging (SQL editor) | ⬜ pending |
| SIGNAL-06 | `read_signals` per-dossier query composes with junction EXISTS; no 42804 (`source_type::text`)                                       | Direct RPC invocation                      | —                                          | staging              | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/i18n/en/intelligence-signals.json` — full key set, created **before** any component references the `intelligence-signals` namespace
- [ ] `frontend/src/i18n/ar/intelligence-signals.json` — full Arabic translation (status values: جديدة / مُستلمة / مُهملة / مُصعَّدة), registered (key `'intelligence-signals'`) in **both** `resources.en` and `resources.ar` of `frontend/src/i18n/index.ts`
- [ ] `supabase/migrations/20260614_phase69_signals_extend.sql` — applied via **Supabase MCP** (`mcp__supabase__apply_migration`) to staging **before** any frontend code references the new columns ([BLOCKING] — see Schema Push task in plans)
- [ ] `frontend/src/domains/signals/types/signal.types.ts` — base type definitions consumed by all hooks/components

---

## Manual-Only Verifications

| Behavior                                 | Requirement          | Why Manual                                                                                  | Test Instructions                                                                                                                                                                                                             |
| ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clearance hide (indistinguishable empty) | SIGNAL-02, SIGNAL-04 | RLS denial returns empty `200`; only observable against live data with two clearance levels | Seed an L3 signal; log in as an L1 account; confirm it is absent from both the triage queue and the dossier Signals tab with generic empty copy (no clearance mention). CDP `Network.setBlockedURLs` for forced-error states. |
| Keyboard-only triage in Arabic           | SIGNAL-03            | RTL + physical-keyboard behavior; logical nav must not assume LTR                           | Switch locale to AR (topbar ع), verify `dir=rtl` + Tajawal; drive the queue with `j`/`k`/`a`/`d`/`e` only (no mouse); confirm focus moves in reading order and actions fire.                                                  |
| Escalate → Kanban round-trip             | SIGNAL-05            | Cross-surface (signal → task → board) under caller JWT; dossier-link copy is RLS-gated      | Seed a signal linked to ≥1 dossier; press `e`, confirm; observe the new `task` in `/kanban` (todo column); confirm `work_item_dossiers` rows copied; confirm signal `status=escalated` + link back.                           |
| `read_signals` clearance correctness     | SIGNAL-06            | INVOKER RPC behavior depends on the caller's JWT clearance claim                            | Seed one L1 and one L3 signal on a dossier; call `read_signals({ p_dossier_id })` as an L1 user via the SQL editor / direct invocation; assert the L3 row is absent and no 42804 error.                                       |

---

## Validation Sign-Off

- [ ] Every task has an automated verify **or** an explicit Wave 0 dependency / manual-UAT entry above
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify (typecheck+lint counts)
- [ ] Wave 0 covers all MISSING references (i18n files, migration applied, base types)
- [ ] No watch-mode flags in any verify command
- [ ] Feedback latency < 120s (unit); manual UAT gate documented per scenario
- [ ] `nyquist_compliant: true` set in frontmatter once plans map every task to a row here

**Approval:** pending
