---
phase: 13
slug: feature-absorption
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 + @testing-library/react 16.3.2 |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | ABSORB-01 | unit | `cd frontend && pnpm vitest run tests/unit/components/AnalyticsWidget.test.tsx -x` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | ABSORB-02 | unit | `cd frontend && pnpm vitest run tests/unit/components/DocsTab.test.tsx -x` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 2 | ABSORB-03 | unit | `cd frontend && pnpm vitest run tests/unit/components/CommandPalette.test.tsx -x` | ❌ W0 | ⬜ pending |
| 13-04-01 | 04 | 2 | ABSORB-04 | unit | `cd frontend && pnpm vitest run tests/unit/components/FullScreenGraphModal.test.tsx -x` | ❌ W0 | ⬜ pending |
| 13-05-01 | 05 | 3 | ABSORB-05 | unit | `cd frontend && pnpm vitest run tests/unit/components/CalendarTab.test.tsx -x` | ❌ W0 | ⬜ pending |
| 13-06-01 | 06 | 3 | ABSORB-06 | unit | `cd frontend && pnpm vitest run tests/unit/components/DossierListActions.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/components/AnalyticsWidget.test.tsx` — stubs for ABSORB-01 dashboard widget rendering
- [ ] `tests/unit/components/CommandPalette.test.tsx` — stubs for ABSORB-03 enhanced search behavior
- [ ] `tests/unit/components/FullScreenGraphModal.test.tsx` — stubs for ABSORB-04 graph modal
- [ ] `tests/unit/components/CalendarTab.test.tsx` — stubs for ABSORB-05 calendar scheduling
- [ ] `tests/unit/components/DossierListActions.test.tsx` — stubs for ABSORB-06 export/import actions

*Framework is already installed (Vitest 4.1.2).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cmd+K empty state shows 5 recent + 5 commands | ABSORB-03 | Requires localStorage state + visual layout verification | 1. Open app 2. Visit 5 dossiers 3. Press Cmd+K 4. Verify recent items appear before typing |
| Mini-graph renders correctly in sidebar | ABSORB-04 | ReactFlow sizing requires visible DOM container | 1. Open dossier with relationships 2. Check sidebar shows mini-graph 3. Click "Expand" 4. Verify full modal opens |
| Old routes redirect correctly | ABSORB-01-06 | Redirect behavior requires browser navigation | 1. Navigate to /analytics 2. Verify redirect to /dashboard 3. Repeat for /briefing-books, /search, /relationships/graph |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
