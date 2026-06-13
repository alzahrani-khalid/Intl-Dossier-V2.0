---
phase: 66
slug: overview-error-contract-timeline-cross-links
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 66 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source of truth: `66-RESEARCH.md` §Validation Architecture (+ §Open Question Answers).

---

## Test Infrastructure

| Property               | Value                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.1.7 + @testing-library/react (jsdom)                                                              |
| **Config file**        | `frontend/vitest.config.ts` (existing)                                                                     |
| **Quick run command**  | `cd frontend && pnpm exec vitest run src/pages/dossiers/overview-cards/__tests__/ src/services/__tests__/` |
| **Full suite command** | `cd frontend && pnpm exec vitest run` (1,315 pass / 0 fail at Phase 65 close)                              |
| **Estimated runtime**  | quick ~5 s · full ~20-25 s local                                                                           |

---

## Sampling Rate

- **After every task commit:** quick run of the touched test directories + `pnpm type-check`
- **After every plan wave:** full suite + type-check
- **Phase gate:** full suite + type-check + `pnpm exec size-limit` (zero `exceeded`) + live forced-error protocol before `/gsd:verify-work`
- **Max feedback latency:** ~120 s

---

## Per-Requirement Verification Map

| Req ID    | Behavior                                                                                                            | Test Type                    | Automated Command                                                                   | File Exists | Status     |
| --------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- | ----------- | ---------- |
| OVRERR-01 | Every section fetcher rejects (DossierOverviewAPIError) on PostgREST error; fetchActivityTimeline no longer catches | unit (mock supabase chain)   | `pnpm exec vitest run src/services/__tests__/dossier-overview.service.test.ts`      | ❌ W0       | ⬜ pending |
| OVRERR-01 | Forced isError renders role="alert" + overview.sectionError; empty copy ABSENT (per hook family + sweep)            | unit (vi.hoisted, RED-first) | `pnpm exec vitest run src/pages/dossiers/overview-cards/__tests__/`                 | ❌ W0       | ⬜ pending |
| OVRERR-01 | DossierDrawer error branch (not permanent skeleton)                                                                 | unit (extend existing)       | `pnpm exec vitest run 'src/components/dossier/DossierDrawer/__tests__/'`            | ✅ extend   | ⬜ pending |
| OVRERR-01 | overview.sectionError key parity EN↔AR                                                                              | unit (JSON parity)           | same card-test file                                                                 | ❌ W0       | ⬜ pending |
| OVRERR-02 | resolveTimelineNavUrl rejection/acceptance matrix (dead routes, scheme/`//`/`\` variants, mounted paths)            | unit                         | `pnpm exec vitest run src/lib/__tests__/timeline-navigation.test.ts`                | ❌ W0       | ⬜ pending |
| OVRERR-02 | TimelineEventCard/EnhancedVerticalTimelineCard suppress View details for unmountable navigation_url                 | unit (RTL render)            | `pnpm exec vitest run src/components/timeline/__tests__/`                           | ❌ W0       | ⬜ pending |
| OVRERR-02 | ActivityList guard extension keeps the existing rejection matrix green + mountedness cases                          | unit (extend existing)       | `pnpm exec vitest run src/components/activity-feed/__tests__/ActivityList.test.tsx` | ✅ extend   | ⬜ pending |
| OVRERR-02 | Edge emissions clean: no /calendar/$id, /mous/$id, or ?tab= in unified-timeline output                              | manual-only (live probe)     | — (MCP/curl at phase gate; Deno edges have no Vitest harness)                       | —           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/services/__tests__/dossier-overview.service.test.ts` (no service test exists today)
- [ ] Forced-error card tests in `src/pages/dossiers/overview-cards/__tests__/` (extend SharedRecentActivityCard.test.tsx; hook-family representatives)
- [ ] `frontend/src/lib/__tests__/timeline-navigation.test.ts`
- [ ] `src/components/timeline/__tests__/TimelineEventCard.test.tsx`
- [x] Staging probes — ANSWERED 2026-06-13 (RESEARCH §Open Question Answers): calendar_entries = 6 (dead /calendar/<uuid> link live-reproducible), mous = 0, activity_stream nav-url rows = 0; calendar disposition = SUPPRESS; relationship enrichment DEFERRED
- Framework install: none

---

## Manual-Only Verifications

| Behavior                                           | Requirement | Why Manual                                           | Test Instructions        |
| -------------------------------------------------- | ----------- | ---------------------------------------------------- | ------------------------ |
| Forced section fetch error renders error card live | OVRERR-01   | Real network-layer failure + TanStack cache behavior | Protocol steps 1-6 below |
| Empty-vs-failed visual distinction                 | OVRERR-01   | Visual judgment (China=data vs Saudi=empty)          | Step 3                   |
| Edge emissions clean after redeploy                | OVRERR-02   | Deno edge fns outside Vitest tree                    | Step 8                   |
| AR/RTL error copy + widths                         | OVRERR-01   | Visual                                               | Step 7 (1280/1024)       |

### Live forced-error protocol (client-side network blocking — NEVER RLS tampering; RLS denial returns empty 200s)

1. Local dev :5173 → staging, login per .env.test.
2. Block one section table's PostgREST pattern via CDP `Network.setBlockedURLs` (e.g. `*rest/v1/dossier_relationships*`).
3. Reload a data-rich country overview (China) AND an empty one (Saudi) — failed sections show the error line; genuinely empty sections show empty copy. Record the per-card blast radius (cards not consuming the blocked section render normally).
4. Expected: error line per affected card, role="alert", danger token, no zeroed "trustworthy" stats.
5. Unblock (`setBlockedURLs []`) → reload → recovery.
6. Repeat for `*rest/v1/calendar_entries*` and the dossier-activity-timeline function URL.
7. AR pass: ع toggle → Arabic error copy, dir=rtl, Tajawal, no overflow at 1280/1024.
8. OVRERR-02: after edge redeploy, fetch unified-timeline for the Indonesia engagement dossier — assert no /calendar/<uuid>, /mous/<uuid>, or ?tab= URLs; /activity rows without nav URLs stay non-interactive.
9. No staging rows are created by this protocol — no cleanup needed beyond unblocking.
