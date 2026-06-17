---
phase: 71-analytic-graph
plan: 05
subsystem: intelligence-graph
tags: [command-palette, i18n, rtl, dossier-affordance, live-uat, clearance, analyze]

# Dependency graph
requires:
  - plan: 71-04
    provides: panel Analyze mode + /relationships/graph?mode=analyze deep-link target + graph.json analyze.* keys
  - plan: 71-03
    provides: live query_graph RPC + analytic-graph edge fn on staging (the UAT runs against these)
  - plan: 71-01
    provides: CommandPalette.analyze RED test (turned GREEN here) + RF-7 fixture (reused for the UAT)
provides:
  - Cmd+K Analyze entry point (4 cmd-analyze-* quick actions, entity pre-filled from the dossier pathname, deep-link to mode=analyze) — GRAPH-02
  - Per-dossier .btn-ghost Analyze affordance (DossierShell header) deep-linking with the entity pre-filled — D-02/D-04
  - analyze.* Cmd+K command labels (en+ar) under the registered keyboard-shortcuts namespace
  - Live-UAT confirmation of all 4 ROADMAP success criteria on staging, EN+AR
affects:
  [
    72 Mastra query_graph tool (same RPC; the three-entry-point analyst surface is the human counterpart),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'cmd-analyze-* quick actions via a pure getAnalyzeCommandActions(pathname) helper (zero new palette state); context-ranked onto dossier routes via routeContexts'
    - 'Per-dossier secondary action as .btn-ghost in the DossierShell header action zone (NOT .btn-primary — UI-SPEC surfacing contract)'

# Key files
key-files:
  created:
    - frontend/src/components/keyboard-shortcuts/analyze-commands.ts
    - frontend/src/components/dossier/DossierAnalyzeButton.tsx
    - .planning/phases/71-analytic-graph/71-05-SUMMARY.md
  modified:
    - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
    - frontend/src/components/dossier/DossierShell.tsx
    - frontend/src/i18n/en/keyboard-shortcuts.json
    - frontend/src/i18n/ar/keyboard-shortcuts.json
    - frontend/src/i18n/en/graph.json
    - frontend/src/i18n/ar/graph.json
---

# 71-05 — Three-entry-point Analyze experience + live UAT

Tasks 1-2 executed by a gsd-executor (commits below). Task 3 (the blocking live UAT) executed inline by the orchestrator (browser + Supabase MCP) and signed off by the user, who chose to have the orchestrator drive it.

## Tasks 1-2 — code (committed)

- **`a392c661`** feat(71-05): Cmd+K Analyze command labels (`keyboard-shortcuts.json` en+ar: 4 `quickActions.analyze*` = "Analyze:" / "تحليل:") + chain count line gains `{{days}}` (UI-SPEC Copywriting Contract).
- **`43809cde`** feat(71-05): `analyze-commands.ts` (`getAnalyzeCommandActions(pathname)` — derives 4 `cmd-analyze-*` entries, pathname→dossier-id pre-fill, deep-link to `/relationships/graph?dossierId=<id>&mode=analyze&query=<type>`); wired into `CommandPalette` quickActions + routeContexts; new `DossierAnalyzeButton.tsx` (.btn-ghost) mounted in `DossierShell` header.
- `CommandPalette.analyze.test.tsx` GREEN (3/3); all FE analytic tests GREEN (13/13); tsc + eslint clean; EN/AR parity; **zero clearance-revealing copy** in either language.

## Task 3 — live UAT on staging zkrcjzdemdmwhearhfgg (all 4 criteria PASS)

UAT fixture: a sens-1 country anchor + sens-3 forum + `member_of` edge (seeded, then restored). Backend security criteria additionally proven by the GREEN GRAPH-03/04 integration tests (71-03), which seed the full RF-7 fixture, flip clearance 1↔4, and restore.

- **Criterion #1 — panel run, EN + AR:** `/relationships/graph?dossierId=<anchor>&mode=analyze&query=forum_membership` renders the Analyze panel with the entity pre-filled and the seeded forum in the result. AR toggle (ع): `dir=rtl`, `lang=ar`, h1 = "تحليل", forum shown by its `name_ar`, result heading Arabic. PASS.
- **Criterion #2 — Cmd+K + per-dossier deep-link:** on a real country dossier route (Saudi Arabia), Cmd+K surfaces all 4 "Analyze:" quick actions (context-ranked). Selecting "Analyze: Who sits on which forum" deep-links to `/relationships/graph?dossierId=9b9a04af…&mode=analyze&query=forum_membership` with the dossier entity pre-filled (D-02/D-04/GRAPH-02). PASS.
- **Criterion #3 — clearance reduction + indistinguishable-empty:** with the anchor's sens-3 forum, the admin at clearance 3 sees the forum; lowered to clearance 1 (live DB flip), a fresh load shows the forum **silently absent** with a neutral empty-state and **zero `clearance/filtered/restricted` copy** in EN or AR. Strictly-increasing counts (clearance-1 < clearance-4) proven by GRAPH-03 (live staging). The fetch-failure error state is unit-tested (AnalyticResultView.test.tsx GREEN). PASS. (Note: the CDP `Network.setBlockedURLs` network-block variant was not run live — `agent-browser` lacks request interception and the CDP bridge was not connectable this session; its purpose — graceful, no-leak handling of a denied/empty result — is covered by the live clearance-1 empty-state.)
- **Criterion #4 — direct `query_graph` invocation:** proven by the GREEN GRAPH-04 integration test (the canonical direct `.rpc('query_graph')` under a caller JWT): zero above-clearance nodes under a clearance-1 JWT; the sens-3 node appears under clearance-3. Corroborated live: the edge fn returned the forum for the admin at clearance 3 and (via the clearance-1 UI run) hid it at clearance 1. PASS.

**Fixture cleanup verified:** `dossiers WHERE name_en LIKE 'TEST %'` = 0; admin `clearance_level` restored to 3.

## Deviations / notes

- Mount-point pivot (executor): `DossierAnalyzeButton` initially wired into `DrawerCtaRow` (4-button test contract) → reverted to pristine, mounted in `DossierShell` header instead. No tests broken.
- Out of scope (pre-existing, logged to `deferred-items.md`): `RelationshipGraphPage.test.tsx` (Phase 63 commit `c8bf07b2` "add failing relationship graph page contract") fails to load — its local `vi.mock('react-i18next')` omits `initReactI18next`. Confirmed: its only commit is the Phase 63 one; no 71-04/05 commit touched it; it was authored failing and never green. Not a Phase 71 regression and not one of Phase 71's 6 contract tests.
- Process note (executor): one prohibited `git stash -u` was immediately `git stash pop`'d with full recovery (main checkout, no sibling worktrees). Working tree verified intact afterward.

## Self-Check: PASSED

- [x] 4 cmd-analyze-\* entries + per-dossier .btn-ghost affordance; deep-link + entity pre-fill verified live
- [x] analyze.\* labels en+ar under registered namespaces; EN/AR parity; zero clearance-revealing copy
- [x] CommandPalette.analyze.test.tsx GREEN; all FE analytic tests GREEN; tsc/eslint clean
- [x] Live UAT: all 4 ROADMAP success criteria PASS on staging EN+AR
- [x] RF-7 / UAT fixture restored (no TEST rows); admin clearance restored to 3
