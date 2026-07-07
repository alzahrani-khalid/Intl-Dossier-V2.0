---
phase: 87-linear-affordances
plan: 03
subsystem: ui
tags: [cmdk, command-palette, i18n, tanstack-router, keyboard-shortcuts, rtl]

# Dependency graph
requires:
  - phase: 86-user-management
    provides: /users/create + /dossiers/elected-officials/create routes the palette now targets
  - phase: 87-linear-affordances
    provides: F25 UI-SPEC copywriting + interaction contract; 87-RESEARCH F25 audit table
provides:
  - Audited ⌘K command menu — every advertised command navigates or executes (zero dead/half-dead targets)
  - 5 new commands (create-mou, create-user, create-elected-official, toggle-theme, switch-language) with EN+AR labels
  - Sentence-cased keyboard-shortcuts copy surface (EN + AR JSON + inline t() fallbacks)
  - MousPage ?action=create seam (validateSearch → CreateMouDialog, param stripped on consume)
  - CommandPalette.audit.test.tsx — table-driven regression lock for the audit verdicts
affects: [87-10-consolidated-signoff, list-controls, work-creation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Source-scan + exported-data regression test (reads CommandPalette.tsx + imports routeContexts) — avoids mounting the provider-heavy 1600-line component or fighting cmdk internals'
    - 'URL ?action=create seam: route validateSearch whitelist → useEffect opens dialog → navigate({search:{},replace:true}) strips the param'

key-files:
  created:
    - frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx
  modified:
    - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
    - frontend/src/i18n/en/keyboard-shortcuts.json
    - frontend/src/i18n/ar/keyboard-shortcuts.json
    - frontend/src/pages/MoUs/MousPage.tsx
    - frontend/src/routes/_protected/mous.tsx
    - frontend/src/routes/__root.tsx

key-decisions:
  - "Moved <CommandPalette /> inside <WorkCreationProvider> (it was a sibling AFTER the provider closed) so useWorkCreation().openPalette resolves — the plan's 'palette mounts inside the provider' claim was inaccurate"
  - "create-task/intake/commitment re-target to openPalette (unified work-creation palette), not new ?action=create page consumers — matches the plan's sanctioned seam and avoids 3 extra page seams"
  - 'Dead routeContexts suggested-action ids DELETED (never rendered — dead config); empty suggestedActions arrays are valid'
  - "create-elected-official grouped under category 'create-dossier' (a dossier type), create-mou/create-user under 'create' (primary create list)"
  - 'toggle-theme/switch-language added to quickActions (precedent: quickActions already holds non-nav cmd-* action commands)'

patterns-established:
  - 'F25 audit lock: exported routeContexts + pure resolver replica + navigateTo source scan gate any future dead-target reintroduction'

requirements-completed: [AFF-03]

# Metrics
duration: 20 min
completed: 2026-07-07
---

# Phase 87 Plan 03: F25 Command-Menu Audit Summary

**Audited the ⌘K command menu to zero dead/half-dead targets, added 5 high-value commands (Create MoU/user/elected official, Toggle theme, Switch language) with EN+AR labels, sentence-cased the whole keyboard-shortcuts copy surface, gave MousPage a `?action=create` seam, and regression-locked the audit with a table-driven test.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-07T13:36:00+03:00
- **Completed:** 2026-07-07T13:56:00+03:00
- **Tasks:** 3
- **Files modified:** 6 (5 modified + 1 created)

## Accomplishments

- **9 audit findings fixed/removed** (87-RESEARCH §F25): create-task/intake/commitment re-targeted to `useWorkCreation().openPalette` (findings 1–3); create-position removed (finding 4, no create UI); cmd-export-dossiers removed (finding 5, dead); cmd-view-network → `/relationships/graph` (finding 6); nav-analytics → `/analytics` (finding 7, matches the Alt+A binding); advertised-but-unbound ⌘N/⇧⌘I/⇧⌘D glyphs dropped (finding 8); the 8 dead routeContexts suggested-action ids pruned so every id resolves (finding 9).
- **5 commands added** with EN+AR labels + real Arabic: create-mou (`/mous?action=create`), create-user (`/users/create`, route's `requireAdmin` gate authorizes), create-elected-official (`/dossiers/elected-officials/create`), toggle-theme (`useMode`), switch-language (`switchLanguage`).
- **Sentence-case pass** across `keyboard-shortcuts.json` EN + AR + every inline `t(key, fallback)` in CommandPalette.tsx — zero Title Case leaks.
- **MousPage `?action=create` seam**: `validateSearch` whitelists `action==='create'`, MousPage opens CreateMouDialog and strips the param via `navigate({search:{},replace:true})`.
- **Regression lock**: CommandPalette.audit.test.tsx asserts (a)–(f) — 6 tests, all green.

## Task Commits

1. **Task 1 + Task 2: audit fixes + MousPage seam + 5 commands + sentence-case** — `700cf00d` (feat)
2. **Task 3: audit regression test** — `73c95df2` (test)

_Tasks 1 and 2 landed in one commit: they co-edit the same `createActions`/`quickActions` arrays and the same i18n files, so they are one atomic unit (splitting a single file's interleaved edits with `git add -p` would have created broken intermediate states)._

**Plan metadata:** this SUMMARY commit (docs).

## Files Created/Modified

- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` — audit fixes, 5 new commands, exported `routeContexts`, sentence-cased fallbacks, `useWorkCreation`/`useMode`/`switchLanguage` wiring
- `frontend/src/i18n/en/keyboard-shortcuts.json` — sentence-case pass + `newMou`/`newUser`/`commands.toggleTheme`/`commands.switchLanguage`
- `frontend/src/i18n/ar/keyboard-shortcuts.json` — mirrored key set with real Arabic translations
- `frontend/src/routes/_protected/mous.tsx` — `validateSearch` whitelisting `action?: 'create'` (T-87-07)
- `frontend/src/pages/MoUs/MousPage.tsx` — consumes `?action=create`, opens dialog, strips param
- `frontend/src/routes/__root.tsx` — moved `<CommandPalette />` inside `<WorkCreationProvider>`
- `frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx` — new regression lock

## Decisions Made

- **Provider mount fix** (see Deviations): CommandPalette moved inside WorkCreationProvider so `useWorkCreation()` resolves.
- **Re-target over new page seams**: task/intake/commitment use the existing work-creation palette rather than building `?action=create` consumers on three more pages (out of scope; the plan only adds the MoU consumer).
- **Delete dead config**: dead routeContexts ids removed rather than backfilled with fabricated commands.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CommandPalette was mounted OUTSIDE WorkCreationProvider**

- **Found during:** Task 1 (wiring `useWorkCreation().openPalette` for create-task/intake/commitment)
- **Issue:** The plan states (key_links + objective, 3×) that "CommandPalette renders INSIDE WorkCreationProvider — \_\_root.tsx:56-63 verified." It does not: `<CommandPalette />` (line 63) was a **sibling rendered after** `</WorkCreationProvider>` (line 61). Calling `useWorkCreation()` there throws "must be used within a WorkCreationProvider." The plan author mis-read the closing tag.
- **Fix:** Moved `<CommandPalette />` inside `<WorkCreationProvider>` (alongside `<Outlet />`). CommandPalette is a portalled overlay — tree position affects only context availability, not layout; all its other contexts (KeyboardShortcut, DossierContext, Tour) remain in scope. ⌘K binding is unchanged (registered by providers, not by palette DOM position).
- **Files modified:** frontend/src/routes/\_\_root.tsx (not in the plan's files_modified list)
- **Verification:** tsc exit 0, 9/9 palette tests green, full lint exit 0
- **Committed in:** 700cf00d (Task 1 commit)

**2. [Rule 1 - Bug] Route-scoped navigate reducer typed to `never`**

- **Found during:** Task 1 (MousPage param strip)
- **Issue:** `mousRoute.useNavigate()({ search: {} | () => ({}) })` failed tsc — the route-scoped search reducer resolved to `never`.
- **Fix:** Used the global `useNavigate()` with `navigate({ to: '/mous', search: {}, replace: true })` (search is all-optional → `{}` valid). Matches the EntityComparisonPage/DossierSearchPage precedent.
- **Files modified:** frontend/src/pages/MoUs/MousPage.tsx
- **Verification:** tsc exit 0
- **Committed in:** 700cf00d (Task 1 commit)

**3. [Rule 1 - Bug] createActions `.shortcut` access after dropping all shortcut fields**

- **Found during:** Task 2 (sentence-case + shortcut-glyph drop)
- **Issue:** Removing every `shortcut:` field from createActions narrowed the inferred element type so the two `action.shortcut != null` render sites errored (TS2339).
- **Fix:** Annotated `createActions = useMemo<QuickActionItem[]>(...)` (interface already declares `shortcut?`), keeping the shared render code valid.
- **Files modified:** frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
- **Verification:** tsc exit 0
- **Committed in:** 700cf00d (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** The provider-mount fix (Deviation 1) is load-bearing — without it the plan's headline re-target would crash at runtime. It adds one file (`__root.tsx`) beyond the plan's declared list. The other two are local type corrections. No scope creep.

## Issues Encountered

- `readFileSync(new URL(..., import.meta.url))` failed under vitest ("URL must be of scheme file"). Resolved by reading from `join(process.cwd(), 'src/...')` (vitest root = frontend workspace).

## Verification

- `pnpm --dir frontend exec vitest run src/components/keyboard-shortcuts` → **9 passed** (analyze 3 + audit 6)
- `pnpm --dir frontend lint` → **exit 0** (eslint --max-warnings 0 + i18n parity + duplicate-rtl + bootstrap-parity + date-format)
- `pnpm --dir frontend exec tsc --noEmit` → **exit 0**
- Task 1 acceptance greps: only `/mous?action=create` remains; create-position/cmd-export-dossiers absent; `/analytics` + `relationships/graph` present; validateSearch present — all pass
- Task 2 acceptance greps: zero Title Case leaks; new-key count 4 (en) = 4 (ar); 5 new ids present — all pass
- **Manual AR-RTL glyph check deferred to the 87-10 consolidated sign-off** (per plan `<verification>` — VALIDATION.md manual row). Cannot self-verify visual RTL rendering.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- AFF-03 delivered end-to-end and machine-checked; ready for the remaining Phase 87 plans and the 87-10 consolidated human render sign-off (AR-RTL glyph + visual pass).
- No blockers.

## Self-Check: PASSED

- Key file exists: `[ -f CommandPalette.audit.test.tsx ]` ✓
- Commits present: `git log --grep="87-03"` returns 700cf00d + 73c95df2 ✓
- All task `<acceptance_criteria>` re-run and pass (greps above) ✓
- Plan `<verification>` commands re-run: vitest 9/9, lint 0, tsc 0 ✓

---

_Phase: 87-linear-affordances_
_Completed: 2026-07-07_
