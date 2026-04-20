---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Design System Adoption
status: executing_phase
stopped_at: Phase 33 Wave 3 partially complete (33-05 PASS, 33-07 PARTIAL Tier A only, 33-08 deferred) — Wave 4 (33-09) pending along with 33-07 Tier B–E follow-up
last_updated: '2026-04-20T12:00:00.000Z'
last_activity: 2026-04-20 -- Wave 3 critical path executed inline; 33-05 heroui wrappers now use real @heroui/react primitives (11/11 tests); 33-07 Tier A (index.css -984 lines, shim collapse, D-10 wipe) landed; 33-07 Tier B–E + 33-08 deferred per user decision
resume_file: .planning/phases/33-token-engine/33-07-legacy-cut-SUMMARY.md
resume_command: /gsd-execute-phase 33 --wave 4 (or follow-up session for 33-07 Tier B–E + 33-08 storybook bootstrap)
progress:
  total_phases: 11
  completed_phases: 0
  total_plans: 4.5
  completed_plans: 5.5
  percent: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Unified intelligence management for diplomatic operations
**Current focus:** Milestone v6.0 — Design System Adoption (ready to execute)

## Current Position

Phase: Phase 33 (token-engine) — Waves 1+2 complete, Wave 3 partial, Wave 4 pending
Plan: 33-05 PASS (11/11 heroui-wrapper unit tests, zero-override audit clean); 33-07 PARTIAL — Tier A done (index.css 1468→484 lines, theme-provider shim, useTheme shim, ThemeErrorBoundary rename, D-10 wipeLegacyThemeKeys wired into DesignProvider); 33-08 deferred (storybook packages not installed — needs fresh session)
Status: Ready for `/gsd-execute-phase 33 --wave 4` for E2E SC-1..SC-5 verification + build-crash investigation. Also pending: 33-07 Tier B–E (preference-sync / i18n / AppearanceSection / layout call-sites / 5 integration tests / DESIGN_SYSTEM_MIGRATION.md) and 33-08 storybook + TokenGrid VRT.
Last activity: 2026-04-20 — Wave 3 executed inline sequentially (sequential-inline mode, no worktrees). 33-07 Tier B–E + 33-08 deferred per user decision to keep session focused on critical path. Typecheck net −8 errors vs baseline (1586 → 1578). HeroUI wrappers + RegexedData-theme sweep clean.

Progress: [█░░░░░░░░░] ~5% (Phase 33: 5.5 of 9 plans complete)

### Wave-level status for Phase 33

| Wave | Plans | Status | Notes |
| ---- | ----- | ------ | ----- |
| 1    | 33-01, 33-04 | complete (33-01 PASS, 33-04 PARTIAL) | Worktree isolation runtime bug found; workaround: non-worktree subagents or inline |
| 2    | 33-02, 33-03, 33-06 | complete (all PASS) | 33-03 CSP decision: option-c (external blocking script, no CSP added); 33-06 24 baselines user-approved + rerun-stable; @tailwindcss/vite build crash deferred to 33-09 |
| 3    | 33-05, 33-07, 33-08 | partial (33-05 PASS; 33-07 PARTIAL Tier A; 33-08 deferred) | Executed sequential-inline to sidestep worktree runtime bug. 33-05 heroui wrappers rewritten against real @heroui/react primitives (11/11 tests, zero-override audit clean). 33-07 Tier A only — index.css surgery + shim collapse + D-10 wipe; Tier B–E (preference-sync, i18n, AppearanceSection, layout sites, 5 tests, migration doc) deferred. 33-08 storybook bootstrap + TokenGrid VRT deferred — packages not installed, 33-06 baselines + 33-09 E2E cover SC verification. |
| 4    | 33-09 | pending | E2E verification across SC-1..SC-5 + build-crash investigation |

### Wave 1 commits (branch DesignV2)

- `8a4bca97` chore: regenerate routeTree
- `fc097519` chore(33-04): install @heroui/react@3.0.3 + @heroui/styles@3.0.3 (exact pins)
- `84b3b0a5` feat(33-04): wire HeroUI v3 @plugin + :root semantic bridge in index.css
- `fbd4b441` feat(33-01): initial attempt (wrong schema — audit-trail only)
- `39f87f49` test(33-01): initial tests (wrong schema — audit-trail only)
- `a5c14094` docs(33-01): initial summary (superseded)
- `f161832a` fix(33-01): rewrite token engine against authoritative schema — 96/96 tests pass
- `7d5edf53` docs(33): Wave 1 summaries (33-01 PASS + 33-04 PARTIAL)

### Wave 2 commits (branch DesignV2)

Plan 33-02 (DesignProvider + hooks — PASS, 18/18 tests):
- `1bba8f2e` feat(33-02): add DesignProvider + five design-system hooks
- `21a66427` refactor(33-02): add useDomDirection hook, migrate heroui-modal
- `bcabb640` feat(33-02): wrap App with DesignProvider above LanguageProvider
- `e1bff2d2` test(33-02): DesignProvider unit coverage (18 tests)
- `2aea6813` docs(33-02): design-provider plan summary — PASS, 18/18 tests

Plan 33-03 (FOUC bootstrap — PASS, option-c):
- `150063cf` feat(33-03): FOUC-safe inline bootstrap in index.html
- `abb06f78` style(33-03): :root Chancery-light fallback literals
- `cdd39122` feat(33-03): extract FOUC bootstrap to /bootstrap.js with blocking=render (option-c)
- `0fd065e2` test(33-03): pin FOUC bootstrap palette literals to directions.ts via regex scrape
- `a347e912` test(33-03): Playwright FOUC assertion (cold load, dark persistence)
- `95e39ff8` docs(33-03): FOUC bootstrap SUMMARY (verdict + option-c decision)

Plan 33-06 (Tailwind remap — PASS, 24 baselines approved):
- `d9f8c777` feat(33-06): @theme block exposing D-16 utilities via runtime vars
- `76f2ab34` refactor(33-06): remove tailwind.config.ts colors (owned by @theme)
- `d49c1c12` test(33-06): Playwright visual spec — 24-snapshot matrix (3 routes × 2 modes × 2 locales × 2 viewports)
- `b3707e5b` test(33-06): tailwind remap visual baselines (user-approved)
- `e5fcacec` fix(33-06): inline shadow literals in @theme to avoid self-reference
- `ec381691` docs(33-06): tailwind remap SUMMARY (verdict + 24 approved baselines)

### Wave 3 commits (branch DesignV2)

Plan 33-05 (HeroUI wrapper rewrites — PASS, 11/11 unit tests):
- `c5c80710` feat(33-05): rewrite heroui-button to use real @heroui/react Button primitive
- `6e09314c` feat(33-05): rewrite heroui-card to use HeroUI v3 Card compound components
- `73e88186` feat(33-05): rewrite heroui-chip to use real @heroui/react Chip + semantic tokens
- `97e4b374` feat(33-05): rewrite heroui-skeleton + relocate presets
- `205e01bd` feat(33-05): convert button.tsx + skeleton.tsx to re-export shims
- `(fix-up commit)` test(33-05): heroui-wrappers unit suite + remove ambient stub + prop-cast typecheck fixes
- `40303c75` docs(33-05): SUMMARY — heroui wrappers PASS (11/11 unit tests, zero-override audit clean)

Plan 33-07 (Legacy HSL + theme hard cut — PARTIAL, Tier A only):
- `79c7d2e9` refactor(33-07): delete 19 data-theme blocks + all HSL scales from index.css
- `7bf915d0` refactor(33-07): gut theme-provider + useTheme shims, rename fallbackDirection, wire D-10 wipe
- `20a6ce91` docs(33-07): SUMMARY — Tier A critical path PARTIAL, Tier B–E deferred

Plan 33-08 (Storybook + TokenGrid VRT — DEFERRED):
- No commits. Storybook packages not installed in package.json; .storybook/{main.ts,preview.tsx} stubs date from April 2. User elected to defer the full bootstrap + 128-baseline approval workflow to a fresh session. 33-06's 24 user-approved visual baselines + the Wave-4 33-09 E2E tests together cover SC-1..SC-5 for the token engine.

### Runtime issue to track

Worktree isolation via `Task(subagent_type=..., isolation="worktree")` forked agent worktrees from a stale commit (`49b225b8`, 9 commits behind `DesignV2` HEAD at session start) and did not actually isolate filesystem writes. Agents wrote into the main tree while their worktree git-state remained stale. For Waves 2-4, use `isolation` unset (shared main tree) and run subagents sequentially, or execute inline.

## Performance Metrics

**Velocity:**

- Total plans completed: 12
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
| ----- | ----- | ----- | -------- |
| 27    | 2     | —     | —        |
| 28    | 4     | —     | —        |
| 29    | 6     | —     | —        |

## Accumulated Context

### Decisions

- [v5.0]: Compositional wizards with shared hook + per-type configs (not monolithic)
- [v5.0]: Elected official is Person variant with person_subtype, not separate type
- [v5.0]: Relationship linking via post-create API call (no new Edge Functions)
- [v5.0]: Phase 29 and 30 can run in parallel after Phase 28
- [v6.0]: Strategy (i) — full replacement of existing theme list; no coexistence with v5.0 themes
- [v6.0]: HeroUI v3 consumes new CSS vars via `@heroui/styles` (accent → primary; danger/ok/warn/info → semantic)
- [v6.0]: Dashboard pixel-exact to `reference/dashboard.png`; widgets wire to existing domain hooks (no mocked data)
- [v6.0]: Tweaks drawer lives in topbar only; `/themes` route + `pages/Themes.tsx` removed
- [v6.0]: Phase ordering: 33 is foundation → {34, 35, 37} parallelizable → 36 gates {38–42} → 43 is final QA sweep
- [v6.0/33-03]: FOUC bootstrap uses option-c (external `/bootstrap.js` with `blocking="render"`) — zero CSP changes, ~10-30ms FOUC cost on slow networks. Future hardening phase may revisit option-a (SHA-256 pin) when CSP is introduced; drift-guard already pins palette literals to `directions.ts`.
- [v6.0/33-06]: Tailwind v4 `@theme` block is the single source of truth for color utilities; `tailwind.config.ts` is slim (173 lines, no `extend.colors`). Variables reference `buildTokens.ts` real names (`--sidebar-bg`, `--focus-ring`). 24-snapshot Playwright matrix gates future color changes.
- [v6.0/33-06]: Production `pnpm build` crash (`@tailwindcss/vite:generate:build — y is not a function`) deferred to 33-09. Dev server + Playwright visual tests unaffected; pre-33-06 `dist/` contains `bg-accent`.

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Confirm `useDashboardStats` / `useDashboardTrends` / `useWeekAhead` / `usePersonalCommitments` / `useMyTasks` / `useRecentDossiers` / `useForums` hook names and return shapes before Phase 38 planning (DASH-09 requires real wiring, no mocks)
- [Research]: Verify `handoff/project/reference/GASTAT_LOGO.svg` is at expected path before Phase 36 (SHELL-05)
- [Research]: Confirm `@fontsource/fraunces`, `@fontsource/space-grotesk`, `@fontsource/public-sans`, `@fontsource/inter`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`, `@fontsource/jetbrains-mono`, `@fontsource/tajawal` packages resolve before Phase 35 (TYPO-02)

### Quick Tasks Completed

| #   | Description | Date | Commit | Directory |
| --- | ----------- | ---- | ------ | --------- |

## Session Continuity

Last session: 2026-04-19T00:00:00.000Z
Stopped at: Roadmap created — v6.0 has 11 phases (33-43), 52/52 requirements mapped, ready to begin discussion of Phase 33
Resume file: .planning/ROADMAP.md
Resume command: /gsd-discuss-phase 33

### v6.0 Phase Map (11 phases, 52 requirements)

| Phase | Name                      | Requirements  | Count |
| ----- | ------------------------- | ------------- | ----- |
| 33    | token-engine              | TOKEN-01..06  | 6     |
| 34    | tweaks-drawer             | THEME-01..04  | 4     |
| 35    | typography-stack          | TYPO-01..04   | 4     |
| 36    | shell-chrome              | SHELL-01..05  | 5     |
| 37    | signature-visuals         | VIZ-01..05    | 5     |
| 38    | dashboard-verbatim        | DASH-01..09   | 9     |
| 39    | kanban-calendar           | BOARD-01..03  | 3     |
| 40    | list-pages                | LIST-01..04   | 4     |
| 41    | dossier-drawer            | DRAWER-01..03 | 3     |
| 42    | remaining-pages           | PAGE-01..05   | 5     |
| 43    | rtl-a11y-responsive-sweep | QA-01..04     | 4     |

**Dependency graph summary:**

- Phase 33 (tokens) is the foundation — no deps
- Phases 34, 35, 37 each depend on 33 (parallelizable)
- Phase 36 depends on 33, 34, 35
- Phases 38–42 each depend on 33, 36, 37 (parallelizable after the gate)
- Phase 38 depends on 33, 37 (does not strictly require 36 but runs after for consistent chrome)
- Phase 43 is the final QA gate — depends on 33–42
