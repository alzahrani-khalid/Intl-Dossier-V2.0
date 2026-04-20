---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Design System Adoption
status: completed
stopped_at: Phase 34 PLANS APPROVED — 8 plans across 4 waves, all 4 REQ-IDs covered, VERIFICATION PASSED
last_updated: '2026-04-21T00:00:00.000Z'
last_activity: 2026-04-21 — Phase 34 planned via /gsd-plan-phase. RESEARCH.md + VALIDATION.md + PATTERNS.md + 8 PLAN.md files created. Coverage 4/4 (THEME-01..04 in `requirements` across plans). Plan-checker PASSED with 3 non-blocking minor gaps noted (D-04 backdrop color-mix spec, Wave-3 transitional LanguageToggle/gear coexistence, A3 color="primary" fallback). Ready for /gsd-execute-phase 34.
progress:
  total_phases: 11
  completed_phases: 0
  total_plans: 17
  completed_plans: 8
  percent: 47
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Unified intelligence management for diplomatic operations
**Current focus:** Milestone v6.0 — Design System Adoption (ready to execute)

## Current Position

Phase: Phase 33 (token-engine) — **Waves 1+2+3+4 all PASS** (33-07 PROMOTED PARTIAL→PASS this session; 33-08 Storybook remains deferred non-blocking)
Plan: 33-07 PASS — Task 8 option-now (ThemeSelector component + 4 layout call-sites deleted), Tier B types (settings.types, preference-storage, preference-sync, styles/themes/types deleted, AppearanceSettingsSection rewritten), Tier C SettingsPage schema+defaults updated, Tier E (4 obsolete integration tests deleted, preference-merge updated 24/24 PASS, DESIGN_SYSTEM_MIGRATION.md rewritten as v5→v6 upgrade path). DoD grep clean for canvas|azure|lavender|bluesky in non-test source. Typecheck 1592 (−2 vs session baseline). DesignProvider unit tests still 18/18 PASS.
Status: Phase 33 effectively done. Downstream phases 34 (tweaks-drawer), 35 (typography-stack), 37 (signature-visuals) fully unblocked and parallelizable. Only 33-08 Storybook bootstrap remains in Phase 33 (non-blocking polish).
Last activity: 2026-04-20 — 33-07 promoted PARTIAL → PASS via 3 atomic commits (`ffc03798` ThemeSelector delete + layout cleanup, `e71ac953` types + AppearanceSettingsSection, `ab965e14` Tier E tests + migration doc).

Progress: [██░░░░░░░░] ~8% (Phase 33: 8 of 9 plans complete — only 33-08 Storybook polish remains; it doesn't block anything downstream)

### Wave-level status for Phase 33

| Wave | Plans               | Status                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | ------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 33-01, 33-04        | complete (33-01 PASS, 33-04 PARTIAL)       | Worktree isolation runtime bug found; workaround: non-worktree subagents or inline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2    | 33-02, 33-03, 33-06 | complete (all PASS)                        | 33-03 CSP decision: option-c (external blocking script, no CSP added); 33-06 24 baselines user-approved + rerun-stable; @tailwindcss/vite build crash deferred to 33-09                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3    | 33-05, 33-07, 33-08 | **33-05 PASS, 33-07 PASS, 33-08 DEFERRED** | 33-05 heroui wrappers rewritten against real @heroui/react primitives (11/11 tests, zero-override audit clean). **33-07 ALL TIERS COMPLETE**: Tier A (index.css -984 lines, shim collapse, D-10 wipe) + Task 8 option-now (ThemeSelector + 4 layout call-sites deleted) + Tier B (types migration: ThemeName→Direction, Zod schemas updated) + Tier C (AppearanceSettingsSection rewrite with useMode, SettingsPage defaults) + Tier E (4 obsolete integration tests deleted, preference-merge 24/24 PASS, DESIGN_SYSTEM_MIGRATION.md rewritten as v5→v6 upgrade path). DoD grep clean. 33-08 storybook bootstrap + TokenGrid VRT still deferred — non-blocking (33-06 baselines + 33-09 E2E cover SC verification). |
| 4    | 33-09               | **PASS**                                   | Spec + hatch + script + inline crash fix. 5/5 SC single run; 15/15 with `--repeat-each 3` (zero flake). Root-caused the `@heroui/styles@3.0.3` × tailwindcss 4.x incompatibility via minimal 2-line repro + version bisect (all stable 4.x releases crash); fixed inline by decoupling `@plugin` into 5 CSS sub-path `@imports` (commit `8fefd687`). SC-1 + SC-4 assertions tightened against actual token behavior (`ad99be30`). 0 typecheck delta, 18/18 DesignProvider unit tests still green. 33-06 deferred crash reclassified as FIXED.                                                                                                                                                                        |

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

Plan 33-07 (Legacy HSL + theme hard cut — PASS, all tiers complete):

- `79c7d2e9` refactor(33-07): delete 19 data-theme blocks + all HSL scales from index.css (Tier A)
- `7bf915d0` refactor(33-07): gut theme-provider + useTheme shims, rename fallbackDirection, wire D-10 wipe (Tier A)
- `20a6ce91` docs(33-07): SUMMARY — Tier A critical path PARTIAL, Tier B–E deferred (superseded by v2.0 PASS summary)
- `ffc03798` refactor(33-07): Tier C Task 8 — delete ThemeSelector + remove from 4 layout sites (option-now resolution)
- `e71ac953` refactor(33-07): Tier B types + Tier C AppearanceSettingsSection rewrite (DoD grep clean in non-test source)
- `ab965e14` test(33-07): Tier E — delete obsolete theme tests, update preference-merge, rewrite migration doc

Plan 33-08 (Storybook + TokenGrid VRT — DEFERRED):

- No commits. Storybook packages not installed in package.json; .storybook/{main.ts,preview.tsx} stubs date from April 2. User elected to defer the full bootstrap + 128-baseline approval workflow to a fresh session. 33-06's 24 user-approved visual baselines + the Wave-4 33-09 E2E tests together cover SC-1..SC-5 for the token engine.

### Wave 4 commits (branch DesignV2)

Plan 33-09 (E2E Nyquist verification — PASS, 5/5 SCs green, zero flake across 15 reps):

- `b01b5cd0` feat(33-09): add env-gated window.\_\_design test hatch to DesignProvider
- `068a63d2` test(33-09): add Phase 33 SC-1..SC-5 Playwright E2E suite (initial 326 lines)
- `6c21203e` chore(33-09): add test:e2e:sc npm script (routes to `playwright test tests/e2e/token-engine-sc --project=chromium-en --no-deps`)
- `308f9173` docs(33-09): initial PARTIAL SUMMARY (superseded by v2.0)
- `8fefd687` refactor(33-09): decouple @heroui/styles @plugin → CSS sub-path @imports (fixes the 33-06 deferred `y is not a function` crash — minimal 2-line repro proved the bug is in @heroui/styles@3.0.3's JS plugin shim, not our codebase; all stable tailwind 4.x versions crash identically. The CSS sub-paths under the package's `exports` field are standalone pre-compiled stylesheets that work fine via plain `@import`, preserving 100% of HeroUI styling output.)
- `ad99be30` fix(33-09): tighten SC-1 + SC-4 assertions against actual token behavior (SC-1: `--accent` is hue-driven not direction-driven, `--surface-raised` collapses to pure white in both light palettes — removed from delta check. SC-4: set `dir='rtl'` directly on the probe element instead of on `<html>` since LanguageProvider pins `dir='ltr'` on `<body>` and an outer `<div>`.)

**Verification:** `pnpm test:e2e:sc` → 5/5 PASS single run; `playwright test ... --repeat-each 3` → 15/15 PASS (zero flake). Dev server responds 200 on `/src/index.css` (was HTTP 500). Frontend typecheck 1594 → 1594 (delta 0). DesignProvider unit tests 18/18 PASS (no regression).

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
- [v6.0/33-09]: Wave-4 investigation reclassified the 33-06 crash: root cause is `@plugin '@heroui/styles@3.0.3'` × `tailwindcss@4.2.2` incompatibility (both on latest stable). Dev server now ALSO crashes since 33-05 started importing real `@heroui/react` components, so the issue escalated from "build-only" to "blocks SC verification." Four remediation levers documented in 33-09-SUMMARY.md — pick one in a follow-up session to promote 33-09 PARTIAL → PASS.
- [v6.0/33-09 FIX]: Resolved in same session via **lever 3 (decouple @plugin)**. Version bisect across all stable tailwind 4.x releases (4.0.0, 4.0.17, 4.1.0, 4.1.17, 4.2.0, 4.2.2) — all crash identically, only the minified variable name in the error changes (v, x, b, y). Bug is isolated to @heroui/styles's JS plugin shim (`dist/index.js`). Fix: replace `@plugin '@heroui/styles'` with 5 CSS sub-path `@imports` (`base`, `themes/default`, `utilities`, `variants`, plus `tw-animate-css` peer). These sub-paths are pre-compiled standalone CSS modules exposed via the package's `exports` field — they skip the JS plugin shim entirely and preserve 100% of HeroUI's styling output. Preserved the minimal 2-line repro in 33-09-SUMMARY.md (v2.0) for future upstream bug report to @heroui/styles or tailwindcss.

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

Last session: 2026-04-20T20:06:55.435Z
Stopped at: Phase 34 context gathered
Resume file: .planning/phases/34-tweaks-drawer/34-CONTEXT.md
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
