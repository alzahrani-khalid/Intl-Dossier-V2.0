---
phase: 60
slug: schema-type-truth-restoration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-10
---

# Phase 60 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend unit), live staging SQL probes via Supabase MCP, node script for smoke test |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `pnpm --filter intake-frontend build` (build = the canonical post-commit gate per handoff) |
| **Full suite command** | `pnpm --filter intake-frontend exec tsc --noEmit && pnpm --filter intake-frontend build` |
| **Estimated runtime** | ~10-40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter intake-frontend build` (pre-commit hook does NOT block on failure — direct run is mandatory)
- **After every plan wave:** Run full suite command + staging SQL existence probes for objects touched in the wave
- **Before `/gsd:verify-work`:** Full suite green + every P1 object verified live + in repo + in types
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | | | Backlog P1 | | | sql-probe / build / script | see RESEARCH.md Validation Architecture | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements (build + tsc + MCP SQL probes; smoke-test script is itself a phase deliverable).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| EventsPage renders against new `event_details` view | Backlog P1 (events #4) | Needs running dev server + auth | Login on :5175, open /events, confirm list loads without 400/404 in network tab |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
