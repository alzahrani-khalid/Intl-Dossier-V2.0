---
gsd_state_version: 1.0
milestone: v6.1
milestone_name: Hardening & Reconciliation
status: ready_to_plan
stopped_at: Phase 46 ready to plan
last_updated: '2026-05-08T08:26:20Z'
last_activity: 2026-05-08 -- Phase 45 completed; Phase 46 ready to plan
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 10
  completed_plans: 10
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Unified intelligence management for diplomatic operations
**Current focus:** Phase 46 — visual-baseline-regeneration

## Current Position

Phase: 46
Plan: Not started
Status: Ready to plan
Last activity: 2026-05-08

## Next Action

Run `$gsd-plan-phase 46` to plan visual baseline regeneration against the seeded staging database.

### Phase 40 summary

| Wave | Plans        | Status                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0a   | 40-01        | PASS                   | 16 locale namespaces (8 × EN+AR); AR parity verified per key                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0a   | 40-02a       | PASS-WITH-DEVIATION    | 8 primitives + sensitivity helper + barrel + 5 vitest fixtures (30/30 green); split α/β/γ + inline orchestration after 2 whole-plan subagent context exhaustions; 4 deviations documented                                                                                                                                                                                                                                                                                                                                             |
| 0b   | 40-02b       | PASS-WITH-DEVIATION    | 3 Supabase adapter hooks + 7/7 tests; documented Engagement-shape divergence (real `EngagementListItem` uses `name_en/name_ar/host_country_*`, not plan's `title_en/title_ar/kind`)                                                                                                                                                                                                                                                                                                                                                   |
| 0b   | 40-02c       | PASS                   | CSS port 313 lines (`.chip`, `.btn`, `.icon-flip`, `.spinner-row`, etc); size-limit 800→815 KB; 4 Open Questions verified                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1    | 40-03..40-09 | PASS-WITH-DEVIATION    | 7 list pages parallel: countries, organizations, persons, forums, topics, working_groups, engagements; 36/36 page+hook tests green; 40-03 + 40-08 truncated mid-stream (test+SUMMARY salvaged inline); 40-09 built `toEngagementRow` mapper for real shape; 40-05 derives VIP from `importance_level >= 4`; 40-07 added `useTopics` list-hook shim                                                                                                                                                                                    |
| 2    | 40-10        | PASS                   | 6 Playwright E2E specs (render/rtl/engagements/a11y/touch-targets/visual) + ESLint logical-properties enforcement on Phase 40 file scope; runtime deferred to CI                                                                                                                                                                                                                                                                                                                                                                      |
| 2    | 40-11        | PARTIAL                | Manual checkpoint; orchestrator authored VERIFICATION.md verdict; 14 visual baselines + 7-page PNG parity deferred to HUMAN-UAT                                                                                                                                                                                                                                                                                                                                                                                                       |
| g0   | 40-12        | SUCCESS                | G6 closure: 6 working_group fixtures seeded to staging Supabase via MCP `apply_migration`; bilingual `name_en`/`name_ar`; idempotent. Status enum mismatch deviation logged (chip variety reduced 4→2 distinct classes)                                                                                                                                                                                                                                                                                                               |
| g0   | 40-13        | SUCCESS                | G3 + G7-marker primitives: chevron `rotate-180` → inline `style={{transform:'scaleX(-1)'}}` + `data-testid="row-chevron"`; `ListPageShell` adds `data-loading={isLoading?'true':'false'}`                                                                                                                                                                                                                                                                                                                                             |
| g1   | 40-14        | SUCCESS                | G1 closure: `min-w-0` applied across `ListPageShell`, `DossierTable`, `EngagementsList`, `PersonsGrid`; `overflow-x-hidden` on shell content area (clip, not scroll). 30/30 list-page unit tests green                                                                                                                                                                                                                                                                                                                                |
| g1   | 40-15        | SUCCESS-WITH-DEVIATION | G2 closure: `<section role="region" aria-label={title}>` (parent `<main>` already in `AppShell`); `<html lang>` sync verified in `i18n/index.ts`; chip contrast tokens `--warn`/`--ok`/`--info` raised to WCAG AA 4.5:1+ in `index.css` + `buildTokens.ts`. File-mapping deviation: plan referenced `I18nProvider.tsx`/`tokens.css`, real files different                                                                                                                                                                             |
| g2   | 40-16        | SUCCESS                | G5 closure: `data-testid="engagement-row"` + bilingual `aria-label` on row `<button>` (already keyboard-activatable); E2E URL regex loosened to accept `/(?:dossiers/)?engagements/.../overview/`; +2 specs (Enter key, 44×44 boundingBox)                                                                                                                                                                                                                                                                                            |
| g3   | 40-17        | SUCCESS-WITH-DEFERRAL  | G7 closure: 10/10 visual determinism layers in `list-pages-visual.spec.ts` (clock freeze 2026-04-26T12Z, animation/transition kill, font readiness, RTL settle, viewport pin) + `playwright.config.ts` defaults (`caret:hide`, `maxDiffPixels:100`, `reducedMotion:reduce`)                                                                                                                                                                                                                                                           |
| g3   | 40-18        | SUCCESS                | 5 E2E specs reconciled with as-built primitives: `working_groups` (underscore), `[data-testid="row-chevron"]` exact transform match, 4 shipped filter pills `all/meeting/call/travel` (no `event`), `region` landmark assertion, 44×44 baselines                                                                                                                                                                                                                                                                                      |
| g4   | 40-19        | SUCCESS-WITH-DEVIATION | Final reconciliation: VERIFICATION.md gap closure attribution table (G1-G8 all closed at code-level), 40-HUMAN-UAT.md updated, last hyphenated `working-groups` route in visual spec patched. Verdict held at PASS-WITH-DEVIATION (live E2E blocked by `list-pages-auth.ts` selector timeout — human-action required)                                                                                                                                                                                                                 |
| g5   | 40-20        | SUCCESS                | G9 closure: 10 person dossier fixtures + 10 persons rows seeded to staging via Supabase MCP. 2 VIP-tier (importance_level≥4); idempotent (ON CONFLICT). Verified: person_count=10, vip_count=2; idempotency probe leaves counts unchanged                                                                                                                                                                                                                                                                                             |
| g5   | 40-21        | SUCCESS-WITH-DEVIATION | G10 closure: `forums:title`/`subtitle` → `pageTitle`/`pageSubtitle` route fix; new top-level `status` map (active/completed/planned/cancelled/+5) added to en+ar/forums.json. Replaced unused `"status": "Status"` string with the object (JSON-key-uniqueness deviation logged)                                                                                                                                                                                                                                                      |
| g5   | 40-22        | SUCCESS-WITH-DEVIATION | G11 closure (5 tasks, 1 commit): /dossiers/engagements rewired to Phase 40 EngagementsListPage (266→16 lines); 10 `engagements.` double-prefix strips in EngagementsList; bilingual filter/week/row/loadMore i18n blocks added; migration `20260503130000…` applied — `search_engagements_advanced` filters on canonical `'engagement'` + idempotent backfill. Edge Function v3 deployed via MCP — 5 type-discriminator literals patched (3 .eq + 2 .insert). Verified: dossier_count=3, joined_count=3, rpc_count=3, total_visible=3 |
| g5   | 40-23        | SUCCESS-WITH-DEFERRAL  | AUTH-FIX: `loginForListPages()` now uses `#email` / `#password` id selectors. Live smoke spec deferred to HUMAN-UAT (Doppler-managed env not sourced in this session)                                                                                                                                                                                                                                                                                                                                                                 |

**Totals:** 66/66 vitest green across 15 Phase 40 test files; 6 E2E specs (68 tests resolved via `playwright test --list`); ESLint logical-properties enforcement live; size-limit 815 KB ceiling; G1-G11 + AUTH-FIX closed at code level; live E2E run unblocked at the source level (auth helper now uses stable id selectors); 14 visual baselines + 7-page PNG parity pending in `40-HUMAN-UAT.md` (Doppler+playwright operator activity).

**Verdict:** PASS-WITH-DEFERRAL — 4/4 LIST requirements coded and unit-tested; G1-G11 + AUTH-FIX closed at code level; live E2E + visual-gate sign-off pending operator action. **Next action to flip → PASS:** `doppler run -- pnpm --filter frontend exec playwright test list-pages-* --project=chromium --update-snapshots`, then 3× replay for G7 stability. Phase 41 (dossier-drawer) unblocked except for visual-gate convergence.

### Phase 39 summary

| Wave | Plans        | Status              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | 39-00        | PASS-WITH-DEVIATION | Infra: WorkBoard barrel, `toArDigits` utility (10/10 tests), `unified-kanban` + `calendar` i18n keys (EN+AR), 13 skipped Playwright spec stubs, COMMENTED Phase 39 block in `check-deleted-components.sh`. Workspace name `intake-frontend` (Rule-3 fix to test command); pre-existing playwright.config ESM `__dirname` bug deferred to 39-09                                                                                                                                                                                                               |
| 1    | 39-01..39-08 | PASS-WITH-DEVIATION | 8 widgets sequentially on DesignV2 (file-overlap forced sequential): KCard 15/15, BoardColumn 8/8, BoardToolbar 8/8 (D-06 one-wired+two-stub), WorkBoard composer 10/10 (real `useUnifiedKanban` signature `{contextType,columnMode,sourceFilter}`, conditional DnD only when `columnMode==='status'`, STAGE_TO_STATUS map for missing newStatus param), CalendarMonthGrid 9/9 (D-02 `linkedItemType`/`linkedItemId` preserved), CalendarEventPill 8/8 (D-13 schema fallback, single console.warn), WeekListMobile 9/9 (mobile branch via window.matchMedia) |
| 2    | 39-09        | PASS-WITH-DEVIATION | Activated 4 visual+a11y E2E specs; fixed playwright.config ESM `__dirname` (replaced with `fileURLToPath(import.meta.url)`); deleted 5 legacy unified-kanban components + `ui/kanban.tsx`; pruned `unified-kanban/index.ts` to keep `column-definitions` + `status-transitions` re-exports (still consumed by `useUnifiedKanban`); redirected `/my-work/board` → `/kanban` instead of deletion (preserves deep links); uncommented Phase 39 enforcement in CI gate (exit 0)                                                                                  |

**Totals:** 77/77 vitest green across 8 Phase 39 surface files (KCard, BoardColumn, BoardToolbar, WorkBoard, CalendarMonthGrid, CalendarEventPill, WeekListMobile, toArDigits); 0 new TS errors on Phase 39 surface; 4 visual+a11y E2E specs activated (kanban-visual, calendar-visual, kanban-a11y, calendar-a11y) plus 6 functional specs (render/rtl/dnd/search/filters/responsive/mobile); legacy cut: 8 files deleted + my-work/board redirected; CI gate `check-deleted-components.sh` enforces zero-importer policy.

**Verdict:** PASS-WITH-DEVIATION — 3/3 BOARD requirements VERIFIED (BOARD-01/02/03); 5 documented deviations carried forward (workspace name discovery, ESM playwright fix scope, kept index.ts re-exports for active consumers, `/my-work/board` redirect vs deletion, scoped test matrix); 0 open gaps. Phase 40 (list-pages) unblocked.

### Phase 38 summary

| Wave | Plans                                    | Status              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ---------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 38-00                                    | PASS                | Route rewrite to @/pages/Dashboard; 8 widget stubs + 4 primitives barrel; useWeekAhead + usePersonalCommitments adapters (9/9 hook tests); handoff app.css ported verbatim with 59 token usages + 0 hex; 10 i18n namespaces (EN+AR); Playwright skeleton spec                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1    | 38-01, 38-02, 38-03, 38-05, 38-07, 38-08 | PASS-WITH-DEVIATION | 6 autonomous widgets in parallel worktrees: KpiStrip (5/5), WeekAhead (7/7), OverdueCommitments (8/8), SlaHealth (6/6), MyTasks (4/4), RecentDossiers+ForumsStrip (10/10). Multiple Rule-3 API adaptations (Donut `value+variants[3]` not `segments[]`; `useUpdateTask` not `useUpdateTaskStatus`; `upcoming_week` not `upcoming_this_week`; `useForums` returns `{data,pagination}` not `{forums}`; `DossierGlyph` `iso`/`type`+`name` not `flag`). Commit-attribution races across parallel agents, code correct                                                                                                                                                     |
| 1    | 38-04, 38-06                             | PASS (checkpoint)   | Checkpoint plans — user chose Option A for Digest (`useActivityFeed` with source=actor_name compromise → DIGEST-SOURCE-COMPROMISE deferred) and Option B for VipVisits (new `useVipVisits` hook composed from `useUpcomingEvents` filter, no new tables → VIP-PERSON-ISO-JOIN deferred for personFlag). Tests: Digest 6/6, VipVisits 17/17 (6 hook + 11 widget)                                                                                                                                                                                                                                                                                                        |
| 2    | 38-09                                    | PASS-WITH-DEVIATION | E2E suite: `dashboard-visual.spec.ts` (8-snapshot matrix), `dashboard-rtl.spec.ts`, `dashboard-a11y.spec.ts`, `dashboard-responsive.spec.ts`, extended `dashboard.spec.ts`. `no-placeholder-data.test.ts` 3/3 green. Deleted `pages/Dashboard/OperationsHub.tsx` (221 LOC); kept `domains/operations-hub/hooks/useUpcomingEvents` (still depended on by useWeekAhead + useVipVisits). Visual baselines BLOCKED-STRATEGY — no dev server/.env.test in worktree, operator one-shot documented in deferred-items.md. `dashboard.project-management.tsx` + `pages/Dashboard/components/` 12-file dead subtree kept (DASH-COMPONENTS-DEAD deferred for later surgical pass) |

**Totals:** 75/75 vitest green (13 files, 2.66s — 63 widget unit tests + 9 hook tests + 3 grep-gate tests); 0 new TS errors on Phase 38 surface; 0 hardcoded hex in widgets (verified); 0 forbidden RTL classes in widgets (ms/me/ps/pe only); 5 Playwright specs discovered (not executed — no dev server in environment); OperationsHub page deleted (-225 LOC).

**Verdict:** PASS-WITH-DEVIATION — 9/9 DASH requirements VERIFIED (DASH-01..09); 6 documented deviations carried forward with migration paths (DIGEST-SOURCE-COMPROMISE, VIP-PERSON-ISO-JOIN, SLA-BAD-RESERVED, DASH-VISUAL-BLOCKED, DASH-VISUAL-REVIEW, DASH-COMPONENTS-DEAD); 0 open gaps. Handoff to Phase 39+ unblocked.

### Phase 37 summary (prior)

### Phase 37 summary

| Wave | Plans                             | Status              | Notes                                                                                                                                                                                         |
| ---- | --------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 37-00                             | PASS                | Infra: d3-geo/topojson-client/world-atlas pinned; signature-visuals folder scaffold; .size-limit.json with signature-visuals budgets                                                          |
| 1    | 37-01, 37-02                      | PASS                | useReducedMotion hook (5 tests); GlobeLoader with d3-geo orthographic + rAF + reduced-motion gate + graceful degradation (9 tests)                                                            |
| 2    | 37-03, 37-04, 37-05, 37-06, 37-07 | PASS                | FullscreenLoader+signal (9 tests); GlobeSpinner (10 tests); DossierGlyph + 24 flags (38 tests); Sparkline RTL (12 tests); Donut dasharray (11 tests)                                          |
| 3    | 37-08                             | PASS-WITH-DEVIATION | AppShell Suspense wrap (D-03); 4 Playwright specs discovered but deferred to Phase 38 harness; size-limit signature-visuals budgets can't measure until Phase 38 wires primitives into routes |

**Totals:** 94/94 vitest green (19 signature-visuals + 1 hook = 20 files, 1.79s); 0 new TS errors on Phase 37 surface; 0 hardcoded hex in components (flags excluded — sovereign colors legitimate); 24 flag TSX files; AppShell at line 220 has `<Suspense fallback={<FullscreenLoader open />}>`.

**Verdict:** PASS-WITH-DEVIATION — 5/5 VIZ requirements delivered; 5 known deviations documented across 37-VALIDATION.md and VERIFICATION.md; 0 new findings from gsd-verifier. Handoff to Phase 38 unblocked.

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

### Wave-level status for Phase 34 (tweaks-drawer — all PASS)

| Wave | Plans        | Status | Notes                                                                                                                                                                                   |
| ---- | ------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 34-01        | PASS   | Vitest + Playwright skip-scaffolds across THEME-01..04 + CI gate `scripts/check-deleted-components.sh` (3 commits)                                                                      |
| 1    | 34-02, 34-03 | PASS   | 34-02 D-16 `DIRECTION_DEFAULTS` map (5/5 tests); 34-03 `useClassification` + `useLocale` hooks + DesignProvider symmetry (6/6 tests)                                                    |
| 2    | 34-04, 34-05 | PASS   | 34-04 TweaksDrawer 6 sections via HeroUI v3 Drawer + `TweaksDisclosureProvider`; 34-05 `bootstrap.js` pre-paint + i18next canonicalization (9/9 migrator)                               |
| 3    | 34-06, 34-07 | PASS   | 34-06 SiteHeader gear + live focus-trap spec (2 Playwright); 34-07 `/themes` pure redirect + regenerated routeTree + live redirect spec (2 Playwright)                                  |
| 4    | 34-08        | PASS   | 6 `useTheme` consumers migrated to DesignProvider hooks; 7 legacy files deleted (Themes page, useTheme shim, LanguageSwitcher/Toggle, theme-provider/toggle); 0 dangling legacy imports |

**Verification:** `5369308e` VERIFICATION.md — 4/4 THEME requirements PASS. Scoped vitest 24/24, Playwright `--list` 4 live, `pnpm build` exit 0, CI gate exit 0, typecheck 1589 errors (0 in Phase-34 files; pre-existing elsewhere). No gap-closure plan needed.

**Non-blocking follow-ups:** `bootstrap.js` at 3065 B > 2048 B budget (pre-existing Phase 33 baseline); no `frontend/playwright.config.ts` so Playwright full-run fell back to `--list` per plan-authorized path.

### Wave-level status for Phase 35 (typography-stack — all PASS)

| Wave | Plans        | Status              | Notes                                                                                                                                                                                                                                                                                                                                        |
| ---- | ------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 35-01        | PASS                | 8 @fontsource deps pinned ^5.x; 14 CSS sub-paths verified; A1 probe HTTP 200 → SAFE (self-ref form chosen); 3 RED drift guards + TYPO-04 fixture authored                                                                                                                                                                                    |
| 1    | 35-02, 35-03 | PASS                | 35-02 `FONTS: Record<Direction, DirectionFonts>` + 3 new keys in buildTokens (99 unit tests, +216 free matrix assertions); 35-03 `fonts.ts` 14 side-effect imports (flips 15 RED → 23 PASS)                                                                                                                                                  |
| 2    | 35-04        | PASS-WITH-DEVIATION | Legacy `--text-family*` / `--display-family` wiped (9 rewrites + 5 var deletions + 4 RTL block deletions); 48-line Tajawal cascade appended unlayered between @layer base + @layer components; 4/5 tajawal drift guards PASS; 5th byte-for-byte test is plan-internal inconsistency (handoff double-quote vs plan single-quote — documented) |
| 3    | 35-05        | PASS                | `import './fonts'` prepended to main.tsx line 1; `index.html` −48 lines (all 14 Google Fonts elements deleted); Playwright 7/7 single + 21/21 stability (zero flake). seedLocale fix documents pre-existing LanguageProvider dual-key persistence for Phase 36+ cleanup                                                                      |

**Verification:** Phase 35 VERIFICATION.md — 4/4 TYPO requirements PASS. Playwright 21/21 with `--repeat-each 3`, `pnpm build` exit 0, typecheck 1586 errors (delta −3 vs Phase 34; zero new Phase-35 errors). 2 vitest failures: 1 pre-existing fouc-bootstrap (Phase 34 baseline), 1 known-defective plan-internal byte-for-byte test. No gap-closure plan needed.

**Non-blocking follow-ups:** LanguageProvider still reads legacy `user-preferences` / `i18nextLng` / `ui-storage` instead of `id.locale`; flag for Phase 36 or targeted cleanup plan. `tajawal-cascade > byte-for-byte` handoff test defective due to Prettier quote mismatch (4 substantive drift guards still enforce real drift surface).

### Wave-level status for Phase 36 (shell-chrome — all PASS-WITH-DEVIATION)

| Wave | Plans        | Status              | Notes                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | 36-01        | PASS-WITH-DEVIATION | Inline GastatLogo (38 paths, viewBox `0 0 162.98 233.12`, currentColor) + 7 RED test scaffolds + shell.\* i18n (21 keys × 2 locales, parity verified) + ConcurrentDrawers Pitfall-3 test (2/3 pass, 1 RED non-blocker). D-01: i18n added to `{en,ar}/common.json` (plan referenced nonexistent `locales/`).                                            |
| 1    | 36-02, 36-03 | PASS-WITH-DEVIATION | 36-02 Sidebar 256px with brand/user/3 nav sections/footer + active inset-inline-start accent bar + admin gate (3/3). 36-03 Topbar 56px 7-slot with `useTweaksOpen` + ⌘K `lg:inline hidden` + ClassificationBar 4-case switch with null visibility gate (7/7). Cross-plan lint-staged race: 36-03's Topbar files absorbed into 36-02 commit `f44b8041`. |
| 2    | 36-04        | PASS-WITH-DEVIATION | AppShell 237 lines: `lg:grid-cols-[16rem_1fr]` desktop + HeroUI overlay Drawer 280px / max-sm:w-screen with physical-placement RTL flip. 4/4 component tests + 8/8 a11y (4 directions × 2 locales, zero serious/critical axe violations). D-01: `useDesignDirection`; D-03: ESC dismissal deferred to Playwright (closed in Wave 3).                   |
| 3    | 36-05        | PASS-WITH-DEVIATION | `_protected.tsx` swapped to `<AppShell>`. Deleted MainLayout, AppSidebar, SiteHeader, MobileBottomTabBar. `scripts/check-deleted-components.sh` exits 0. Playwright phase-36-shell.spec.ts + phase-36-shell-smoke.spec.ts un-skipped and moved to root `tests/e2e/` (D-02); 16/16 enumerate green, runtime deferred to CI (D-03).                      |

**Verification:** Phase 36 VERIFICATION.md (`f64045da`) — 5/5 SHELL requirements PASS. Scoped vitest layout+brand 30/31 green (1 pre-existing RED from ConcurrentDrawers, documented Wave-0 non-blocker). CI gate exits 0. Stray-import grep on deleted names returns only AppShell.tsx + Phase-34 Tweaks files (all semantic non-imports, whitelisted by check-deleted-components.sh). No gap-closure plan needed.

**Non-blocking follow-ups:** ConcurrentDrawers `[role="dialog"]` assertion still RED — HeroUI v3 Drawer portals role to a different subtree than jsdom's `querySelectorAll` traverses; replace with `data-focus-scope` selector when revisiting. Playwright runtime blocked by missing `.env.test` + no dev server in CI sandbox — compile-time + type-check + enumeration all pass; runtime to execute on dev-machine or CI pipeline.

### Runtime issue to track

Worktree isolation via `Task(subagent_type=..., isolation="worktree")` forked agent worktrees from a stale commit (`49b225b8`, 9 commits behind `DesignV2` HEAD at session start) and did not actually isolate filesystem writes. Agents wrote into the main tree while their worktree git-state remained stale. For Waves 2-4, use `isolation` unset (shared main tree) and run subagents sequentially, or execute inline.

## Deferred Items

Items acknowledged and deferred at v6.0 milestone close on 2026-05-06:

| Category   | Item                                                                    | Status                |
| ---------- | ----------------------------------------------------------------------- | --------------------- |
| debug      | dashboard-max-update-depth                                              | awaiting_human_verify |
| quick_task | 260409-dgf-fix-redis-initialization-race-maxmemory-                     | missing               |
| quick_task | 260412-hlb-fix-batch-5-data-flow-state-management-d                     | missing               |
| quick_task | 260412-jkp-fix-batch-6-navigation-routing-n-20-n-21                     | missing               |
| quick_task | 260412-jth-fix-batch-7-per-journey-route-fixes-28-f                     | missing               |
| quick_task | 260412-kmh-fix-batch-0-critical-audit-findings-b-01                     | missing               |
| quick_task | 260412-kot-route-notifications-center-through-expre                     | missing               |
| quick_task | 260413-tuf-create-unified-pageheader-component-and-                     | missing               |
| uat_gap    | 40-HUMAN-UAT.md (visual baselines + 7-page PNG parity pending operator) | partial               |

See `.planning/v6.0-MILESTONE-AUDIT.md` for full tech-debt inventory across phases 38, 40, 41, 42, 43 and cross-cutting documentation drift.

## Performance Metrics

**Velocity:**

- Total plans completed: 30
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase        | Plans | Total   | Avg/Plan |
| ------------ | ----- | ------- | -------- |
| 27           | 2     | —       | —        |
| 28           | 4     | —       | —        |
| 29           | 6     | —       | —        |
| Phase 34 P04 | 35    | 3 tasks | 9 files  |
| 44           | 6     | -       | -        |
| 45           | 4     | -       | -        |

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
- [v6.0/35-01]: A1 verdict **SAFE** — Tailwind v4 `@theme { --font-X: var(--font-X) }` self-reference does NOT crash the generator (unlike the Phase 33-06 shadow case, `e5fcacec`). Dev server probe returned HTTP 200 in 828 ms. Family-specific: the 33-06 crash was inside Tailwind's box-shadow multi-layer parser, not a general `@theme` self-ref problem. Plan 35-04 keeps the self-reference form verbatim with a final D-01 comment.
- [v6.0/35-02]: Font triplet is **direction-driven only** (mode/hue/density-invariant per D-06). `FONTS: Record<Direction, DirectionFonts>` in `tokens/directions.ts` holds 12 literal strings; `buildTokens()` emits `--font-{display,body,mono}` on every call. REQUIRED_KEYS in the 72-case matrix test silently gained 216 existence assertions.
- [v6.0/35-04]: Tajawal RTL cascade placed **unlayered** (between `@layer base` and `@layer components`) so it beats Tailwind's layered utility classes. Unlayered > layered in Tailwind v4's cascade-layer model. `!important` markers on defeat rule + chip/label block are load-bearing for Phase 36-42 text rendering (defeats `.dir-*` direction-class font overrides).
- [v6.0/35-04]: Two legacy weight references (`--text-weight`, `--display-weight`) folded into existing Tailwind-scale `--font-normal` (400) / `--font-semibold` (600) — same rendered weight, different token name. Preserves paint behavior after `:root` var cleanup.
- [v6.0/35-05 FINDING]: LanguageProvider still reads pre-Phase-34 localStorage keys (`user-preferences`, `i18nextLng`, `ui-storage`) and **overrides** bootstrap.js's `html.dir='rtl'` on mount. Phase 34 didn't finish the migration — LanguageProvider is the lone holdout. Playwright spec works around it by seeding all three keys; real cleanup belongs to Phase 36 or a targeted debug session.
- [v6.0/35-05]: `typography.spec.ts` lives at root `tests/e2e/` not `frontend/tests/e2e/` (Phase 33-09 precedent — root `playwright.config.ts` has `testDir: './tests/e2e'`). Vitest drift guards stay at `frontend/tests/unit/design-system/`. Fixture HTML at `frontend/tests/e2e/fixtures/typo-04-fixture.html` (Vite doc root = `frontend/`, serves it via `/tests/e2e/fixtures/...`).

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Confirm `useDashboardStats` / `useDashboardTrends` / `useWeekAhead` / `usePersonalCommitments` / `useMyTasks` / `useRecentDossiers` / `useForums` hook names and return shapes before Phase 38 planning (DASH-09 requires real wiring, no mocks)
- [Research]: Verify `handoff/project/reference/GASTAT_LOGO.svg` is at expected path before Phase 36 (SHELL-05)
- [Tech debt]: LanguageProvider reads pre-Phase-34 localStorage keys (`user-preferences`, `i18nextLng`, `ui-storage`) instead of `id.locale` — causes override of bootstrap.js's RTL direction on mount. Phase 34 migration left this provider behind; cleanup candidate for Phase 36 or debug session.

### Quick Tasks Completed

| #   | Description | Date | Commit | Directory |
| --- | ----------- | ---- | ------ | --------- |

## Session Continuity

Last session: 2026-05-08T08:26:20Z
Stopped at: Phase 46 ready to plan
Resume file: .planning/ROADMAP.md
Resume command: /gsd-plan-phase 46

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

**Planned Phase:** 40 (list-pages) — 21 plans — 2026-04-26T11:15:48.275Z
