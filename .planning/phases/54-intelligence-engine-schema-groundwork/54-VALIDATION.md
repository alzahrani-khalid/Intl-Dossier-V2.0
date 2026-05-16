---
phase: 54
slug: intelligence-engine-schema-groundwork
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 54 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Detailed Req→Test mapping lives in `54-RESEARCH.md` § "Validation Architecture" — this file is the orchestration contract.

---

## Test Infrastructure

| Property               | Value                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 1.x + `@supabase/supabase-js` 2.100.1 (RLS integration); `tsc --noEmit` (TS gate); shell + Supabase MCP smoke checks |
| **Config file**        | `backend/vitest.integration.config.ts`, `frontend/vitest.config.ts`, root + per-workspace `tsconfig.json`                   |
| **Quick run command**  | `pnpm typecheck`                                                                                                            |
| **Full suite command** | `pnpm typecheck && pnpm --filter backend test:integration && pnpm test`                                                     |
| **Estimated runtime**  | ~120 seconds full suite (typecheck ~25s; integration ~70s; frontend unit ~25s)                                              |

---

## Sampling Rate

- **After every task commit:** `pnpm typecheck`
- **After every plan wave:** `pnpm typecheck && pnpm --filter backend test:integration`
- **Before `/gsd:verify-work`:** Full suite must be green; `cmp` of `database.types.ts` returns 0; `git tag -v phase-54-base` exits 0
- **Max feedback latency:** 30s (typecheck quick-run)

---

## Per-Task Verification Map

See `54-RESEARCH.md` § Validation Architecture → "Phase Requirements → Test Map" (lines 769–793). Each row maps a REQ-ID (INTEL-01..05) + lockstep rename + documentation + tag-provenance behavior to:

- A test type (smoke SQL via MCP / integration / unit / shell)
- An automated command
- A file-exists status (✅ existing, ❌ Wave 0, N/A shell)

Planner MUST attach the relevant rows from that map to each task's `<acceptance_criteria>` block. Status column starts ⬜ pending for every row and flips to ✅ green as plans land.

---

## Wave 0 Requirements

- [ ] `tests/integration/intelligence-event-rls.test.ts` — INTEL-01 + INTEL-02 RLS coverage (template: `tests/integration/polymorphic-document-rls.test.ts`)
- [ ] `tests/integration/intelligence-event-dossiers-rls.test.ts` — INTEL-03 polymorphic RLS + `dossier_type` CHECK + `ON DELETE CASCADE` coverage
- [ ] No framework install — Vitest + `@supabase/supabase-js` already on disk.

---

## Manual-Only Verifications

| Behavior                                       | Requirement                   | Why Manual                                                                                              | Test Instructions                                                                                                                              |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `phase-54-base` tag signed by enrolled SSH key | Provenance gate               | Local-only signing config (`~/.gitconfig` + `~/.ssh/allowed_signers`) is operator-machine state, not CI | `git tag -v phase-54-base` MUST print `Good "git" signature` and exit 0. Operator runs once at phase open per CLAUDE.md § "Tag signing setup". |
| Supabase MCP staging connectivity              | D-15 (all migrations via MCP) | MCP token + project access are user-session, not CI                                                     | Confirm `mcp__claude_ai_Supabase__list_tables` returns rows for project `zkrcjzdemdmwhearhfgg` before first `apply_migration`.                 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify command or Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers both new RLS integration files (INTEL-01..03)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for quick-run
- [ ] `nyquist_compliant: true` set in frontmatter once planner attaches map rows to every task

**Approval:** pending
