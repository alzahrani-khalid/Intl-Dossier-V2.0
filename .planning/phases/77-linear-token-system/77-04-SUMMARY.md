---
phase: 77-linear-token-system
plan: 04
subsystem: design-tokens
tags:
  [
    linear,
    activation,
    coercion,
    bootstrap,
    byte-match,
    foucguard,
    dark-canonical,
    fonts,
    rtl,
    tajawal,
  ]

# Dependency graph
requires:
  - phase: 77-linear-token-system
    provides: 77-03 PALETTES.linear + FONTS.linear (verbatim dark + derived light + TOKEN-03 palettes) byte-mirrored in bootstrap.js; ThemeErrorBoundary/settings unions widened to 'linear'
  - phase: 77-linear-token-system
    provides: 77-02 scripts/check-bootstrap-parity.mjs byte-match guard (v1) + bad-bootstrap fixture + CI/lint wiring
  - phase: 33-design-system
    provides: token engine (DesignProvider + tokens/{directions,buildTokens,applyTokens}) + public/bootstrap.js FOUC script + index.css @theme/:root
provides:
  - Linear is the LIVE first-paint + steady-state direction for every user (bootstrap + DesignProvider coerce any legacy id.dir → 'linear' with write-back, same commit)
  - dark-canonical default (unset id.theme → dark; explicit id.theme='light' preserved) across bootstrap + DesignProvider + App.tsx + ThemeErrorBoundary
  - index.css :root re-synced to Linear-dark literals (drifted #9a9082/oklch(99% 0.01 32) retired) + @theme mappings for the new tier/accent-hover/status vars
  - .dir-bureau → .dir-linear CSS rename (chancery/situation/ministerial rule blocks deleted) across index/list-pages/dashboard/calendar
  - parity guard v2 (linear byte-match + 5 coercion probes + :root third-copy enforcement) — every flip invariant is build-breaking
  - coercion.test.ts (8 vm-harness cases) + font-registration.spec.ts (Inter/JetBrains Variable resolve LTR, Tajawal wins RTL)
affects:
  [77-05, 77-06, 77-07, 77-08, 80-visual-verification, linear-reskin, switcher-retirement, doc-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Dual-layer legacy coercion in one atomic commit: bootstrap.js (ES5, try-guarded write-back) AND DesignProvider (constant "linear" init + WR-10 one-time write-back effect, no writes in lazy initializers) — the old per-direction fallback vanished with the swap, so both layers must coerce or first paint loses all tokens'
    - 'Guard v2 shape after coercion: since bootstrap paints Linear for ANY seeded id.dir, the all-directions byte-match is retired in favor of (a) linear-only byte-match, (b) explicit coercion probes (retired dirs + unset → linear-dark paint + setItem write-back recorded), (c) an ENFORCED :root third-copy check vs PALETTES.linear.dark / FONTS.linear'
    - 'postcss selector-aware CSS migration: drop rules whose entire selector list is a retired direction, prune retired selectors from mixed lists, rename .dir-bureau → .dir-linear — safer than 30+ hand deletions, validated by a green production build'

key-files:
  created:
    - frontend/tests/bootstrap/coercion.test.ts
    - frontend/tests/e2e/font-registration.spec.ts
  modified:
    - frontend/public/bootstrap.js
    - frontend/src/design-system/DesignProvider.tsx
    - frontend/src/App.tsx
    - frontend/src/index.css
    - frontend/src/styles/list-pages.css
    - frontend/src/pages/Dashboard/widgets/dashboard.css
    - frontend/src/components/calendar/calendar.css
    - frontend/src/pages/Dashboard/widgets/WidgetCard.tsx
    - scripts/check-bootstrap-parity.mjs
    - tools/bootstrap-fixtures/bad-bootstrap.js
    - frontend/tests/unit/design-system/DesignProvider.test.tsx
    - frontend/tests/unit/design-system/fouc-bootstrap.test.ts
    - frontend/tests/unit/design-system/handoff-css-contract.test.ts
    - frontend/tests/unit/design-system/tajawal-cascade.test.ts

key-decisions:
  - "Direction lock via Option A: DesignProvider direction is a constant 'linear' init (initialDirection prop kept for API compat but not destructured); setDirection stays functional so the not-yet-removed switcher + its mocked unit tests don't break. The storage listener guard (isDirection) narrows to 'linear' only."
  - 'bootstrap P/F tables collapsed to linear-only (the coercion makes the 4 legacy entries dead); guard v2 byte-matches linear only to match.'
  - "--shadow-sm → 'none' in bootstrap + :root (Linear forbids card shadows); --shadow (hovered rows) and --shadow-lg/--shadow-drawer (drawers) kept."
  - "index.css :root gained literal --font-display/body/mono + all extended vars so it is a complete Linear-dark first-frame fallback and the guard's :root check is meaningful."
  - "Added fallbackColorMode='dark' to ThemeErrorBoundary alongside fallbackDirection='linear' for dark-canonical consistency (beyond the 3 required App.tsx props)."

patterns-established:
  - 'Atomic flip: coercion (both layers) + dark default + :root re-sync + .dir-class rename + enumerated test updates all ride ONE commit so the branch never sits in a dead-CSS / half-coerced intermediate state'
  - "Honest font verification: probe the REGISTERED variable-font family names ('Inter Variable'/'JetBrains Mono Variable') via document.fonts.check, not the unregistered 'Inter'/'JetBrains Mono' that silently fell back to system-ui"

requirements-completed: [TOKEN-04, TOKEN-02, FOUC-01, TOKEN-05, TOKEN-01]

# Metrics
duration: 75 min
completed: 2026-07-02
---

# Phase 77 Plan 04: Activate Linear (dual-layer id.dir coercion + dark default) Summary

**Linear is now what the app paints for everyone: bootstrap.js + DesignProvider coerce every legacy `id.dir` to `linear` (with write-back) in one atomic commit, unset `id.theme` defaults dark (explicit light preserved), the `:root` third copy is re-synced to Linear-dark literals, `.dir-bureau` is renamed to `.dir-linear` (retired blocks deleted), and guard v2 + coercion tests + a font probe lock every invariant as build-breaking.**

## Performance

- **Duration:** ~75 min
- **Completed:** 2026-07-02
- **Tasks:** 3 (all `<verify>` blocks green)
- **Files:** 16 (14 modified, 2 created)

## Accomplishments

- **Task 1 — the atomic flip (`2f04f9f4`):** bootstrap.js rewritten (linear-only P/F, `id.dir` coercion + try-guarded write-back, `id.theme` default `dark` + whitelist, id.hue read removed, full linear paint incl. tiers/accent/semantic/sla/status, `--shadow-sm: none`); DesignProvider constant-`linear` init + WR-10 write-back effect + `initialMode` default `dark` + storage-listener guard narrowed to `linear` + dynamic `dir-*` class cleanup; App.tsx `initialDirection/initialMode/fallbackDirection` = linear/dark/linear (+ `fallbackColorMode="dark"`); index.css `:root` → Linear-dark literals + fonts + extended vars, `@theme` extended (surface-3/4, ink-tertiary, line-strong, accent-hover, status-1..6+soft), RTL cascade `'Inter'`→`'Inter Variable'` / `'JetBrains Mono'`→`'JetBrains Mono Variable'`; `.dir-bureau`→`.dir-linear` rename + retired-block deletion across 4 stylesheets. 5 enumerated test files kept green.
- **Task 2 — guard v2 + coercion test (`23ad61d9`):** parity guard rebuilt for the post-coercion world — linear-only byte-match (6 combos × 56 vars) + 5 coercion probes (bureau/chancery/situation/ministerial/unset → linear-dark paint + `setItem('id.dir','linear')`) + ENFORCED `:root` third-copy check (51 vars vs PALETTES.linear.dark/FONTS.linear). `bad-bootstrap.js` refreshed as the new bootstrap with `#010102`→`#010103`; guard exits 1 on it. `coercion.test.ts` (8 vm cases) added.
- **Task 3 — font probe (`45917772`):** `font-registration.spec.ts` asserts `document.fonts.check` for `'Inter Variable'` + `'JetBrains Mono Variable'` (LTR, computed body family includes Inter Variable) and, under `?lng=ar`, `dir=rtl` + Tajawal resolves + computed body family starts with Tajawal. Both pass against the live dev server — confirming the flip is served end-to-end.

## Task Commits

1. **Task 1: The flip commit (coercion + dark default + linear paint + :root + CSS dir-class rename)** — `2f04f9f4` (feat) — 12 files
2. **Task 2: Guard v2 + coercion regression test** — `23ad61d9` (feat) — 3 files
3. **Task 3: Font-registration e2e probe** — `45917772` (test) — 1 file

## Files Created/Modified

- `frontend/public/bootstrap.js` — linear-only ES5 tables, id.dir coercion + write-back, dark default, full linear paint, `--shadow-sm: none`, no id.hue read
- `frontend/src/design-system/DesignProvider.tsx` — constant `linear` init, WR-10 write-back effect, `initialMode` default `dark`, storage guard → linear-only, dynamic `dir-*` cleanup
- `frontend/src/App.tsx` — `initialDirection/initialMode/fallbackDirection` = linear/dark/linear (+ `fallbackColorMode="dark"`)
- `frontend/src/index.css` — `:root` Linear-dark literals + fonts + extended vars; `@theme` new color mappings; RTL cascade Variable font names + `.dir-linear`
- `frontend/src/styles/list-pages.css`, `.../widgets/dashboard.css`, `.../calendar/calendar.css` — `.dir-bureau`→`.dir-linear`, retired-direction rule blocks deleted (34 rules removed, 64 selectors renamed)
- `frontend/src/pages/Dashboard/widgets/WidgetCard.tsx` — doc-comment `.dir-bureau`→`.dir-linear` (deviation, see below)
- `scripts/check-bootstrap-parity.mjs` — guard v2 (byte-match + coercion probes + :root check)
- `tools/bootstrap-fixtures/bad-bootstrap.js` — refreshed positive-failure fixture (linear dark bg diverged one byte)
- `frontend/tests/bootstrap/coercion.test.ts` — 8-case coercion/dark-default vm-harness regression (created)
- `frontend/tests/e2e/font-registration.spec.ts` — TOKEN-05 honest font probe (created)
- `frontend/tests/unit/design-system/{DesignProvider,fouc-bootstrap,handoff-css-contract,tajawal-cascade}.test.ts` — expectations updated to linear/dark

## Decisions Made

See `key-decisions` frontmatter. Headline: **Option A direction lock** (constant `linear` init, `setDirection` retained functional) minimizes blast radius — the switcher surfaces (Topbar/TweaksDrawer/Appearance) and their mocked tests are untouched and will be removed in a later plan; only `DesignProvider.test.tsx` exercises real direction behavior and was updated to assert "always linear on init + retired cross-tab values ignored".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] WidgetCard.tsx comment not in plan file list**

- **Found during:** Task 1 (CSS-clean acceptance)
- **Issue:** The acceptance grep requires ZERO `.dir-bureau|chancery|situation|ministerial` refs under `frontend/src`, but `WidgetCard.tsx:11` carried a `.dir-bureau .card` doc-comment; the file was not in the plan's Task 1 `<files>` list.
- **Fix:** Renamed the comment reference to `.dir-linear`.
- **Verification:** `grep -rn "dir-bureau|…" frontend/src frontend/public | wc -l` == 0.
- **Committed in:** `2f04f9f4` (Task 1).

**2. [Rule 2 - Missing Critical] tajawal-cascade.test.ts not in plan file list**

- **Found during:** Task 1 (font-family rename)
- **Issue:** The plan mandates `'JetBrains Mono'`→`'JetBrains Mono Variable'` in the index.css RTL cascade, which breaks `tajawal-cascade.test.ts`'s TYPO-04 regex (`'JetBrains Mono'` with a closing quote no longer matches). The test was not in the plan's Task 1 `<files>` list.
- **Fix:** Updated the regex to `'JetBrains Mono Variable'`.
- **Verification:** `vitest run tests/unit/design-system` green (240 tests).
- **Committed in:** `2f04f9f4` (Task 1).

**3. [Rule 1 - Scope-correct: less work than planned] applyTokens.test.ts + migrator.test.ts needed no change**

- **Found during:** Task 1
- **Issue:** The plan listed both for update. In reality 77-04 does NOT remove the 4 legacy palettes from `directions.ts`, so `applyTokens.test.ts` (uses chancery/bureau/situation, all still valid) passes unchanged; `migrator.test.ts` asserts only locale/classif migration (no palette/direction) and passes unchanged (the added coercion write-back does not affect its assertions).
- **Fix:** Left both unmodified; verified green.
- **Verification:** included in the 240-test suite pass.
- **Committed in:** n/a (no change).

---

**Total deviations:** 2 auto-fixed (both Rule 2 — missing critical files needed to satisfy the plan's own acceptance criteria) + 1 scope-correction note. **Impact:** No scope creep; both fixes are the minimum needed to clear the CSS-clean grep and keep vitest green.

## Issues Encountered

- The scratchpad postcss transform could not resolve the bare `postcss` specifier (ESM resolves from the script's location); pointed the import at the absolute `frontend/node_modules/postcss/lib/postcss.mjs` and it ran clean.
- macOS `wc -l` pads output with spaces, breaking a `grep -qx 0` check — used a `tr -d ' '` + numeric comparison instead. No code impact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Linear is fully activated and locked in (guard v2 makes coercion / dark-default / three-copy drift build-breaking). Ready for 77-05+ (switcher-surface retirement: Topbar/TweaksDrawer/AppearanceSettingsSection + hue axis; the `setDirection` setter can then be removed) and 77-06 (`components/ui/*` re-skin).
- Note for Phase 80 (visual re-compare): the default flipped light→dark and `'Inter'`→`'Inter Variable'` now renders honestly — both are intended deltas against the 77-01 Bureau/light baseline.
- Not touched by this plan (later scope): DOC-01 doc prose still mentions Bureau in a few CSS comments (e.g. dashboard.css "Bureau is the design's default direction"); directions.ts still carries the 4 legacy palettes (removed with the switcher).

---

_Phase: 77-linear-token-system_
_Completed: 2026-07-02_
