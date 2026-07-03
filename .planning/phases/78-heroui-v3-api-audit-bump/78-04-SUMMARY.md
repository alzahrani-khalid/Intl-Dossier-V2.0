---
phase: 78-heroui-v3-api-audit-bump
plan: 04
subsystem: ui
tags: [heroui, bundle-size, size-limit, regression-sweep, rtl, smoke, verification, evidence]

# Dependency graph
requires:
  - phase: 78-01
    provides: '@heroui/react + @heroui/styles bumped to 3.2.1 in lockstep (react-aria externalized)'
  - phase: 78-02
    provides: 'HeroUIFormCheckbox/HeroUIFormSwitch migrated to v3.2 *.Content composition'
  - phase: 78-03
    provides: 'Phase 75 protocol re-run holds on 3.2.1 (8 import sites, 0 stragglers)'
provides:
  - 'Green production build on 3.2.1 (frontend/dist/index.html produced)'
  - 'REQUIRED Bundle Size Check green — all 10 budgets pass; per-budget gzip numbers recorded as Phase 80 baseline'
  - 'EN + AR drawer render smoke: dashboard + AppShell drawer + TweaksDrawer, 0/0 app console errors, dir=rtl + Tajawal confirmed in AR'
  - 'Pre-recorded drawer thin-scrollbar delta acknowledged as the one expected upstream change (not chased, no app CSS added)'
affects: [79, 80]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'react-aria externalization (3.2.1) drops heroui-vendor to 3.56 KB gzip; the weight lands in the vendor catch-all (no named budget) and only Total JS sees it (2.65 MB / 2.78 MB) — exactly the RESEARCH §Bundle Size A2 prediction'
    - 'EN/AR drawer smoke via browser-harness + dedicated headless Chrome (:9222, localhost not 127.0.0.1 — Chrome bound IPv6/localhost); console-error collector installed via Page.addScriptToEvaluateOnNewDocument before first paint'
    - 'React login form filled via native-setter injection (single js() round-trip per field) — avoids the IPC socket timeout that char-by-char key events triggered'

key-files:
  created:
    - .planning/phases/78-heroui-v3-api-audit-bump/78-04-SUMMARY.md
    # 4 smoke screenshots under 78-04-smoke/ are on disk but gitignored (.gitignore *.png) — evidence, not committed
  modified: []

key-decisions:
  - 'App-console-error gate metric is 0/0 (console.error + window.onerror + unhandledrejection = 0 in both EN and AR). The 8 EN / 6 AR browser network-layer entries are ALL pre-existing CORS failures on ONE Supabase edge function (tasks-get; localhost:5174 not in its ALLOWED_ORIGINS) — infrastructure config gap, unrelated to the HeroUI bump, recorded but non-blocking per the plan.'
  - 'The drawer thin-scrollbar delta is applied via @apply scrollbar INLINED into the compiled drawer-body CSS rule (not a literal DOM class) — a class-name probe correctly returns false; the delta is real, pre-recorded as expected, and NOT countered with app CSS.'

patterns-established:
  - 'A read-only phase-gate plan closes its requirement with a committed evidence artifact (build/size/lint exits + per-budget gzip table + EN/AR console counts + dir/font assertions + screenshot paths), zero source-code changes.'

requirements-completed: [HEROUI-01]

# Metrics
duration: 20 min
completed: 2026-07-03
---

# Phase 78 Plan 04: Final Gate — Build + Size + EN/AR Drawer Smoke Summary

**Proved the 3.2.1 tree builds green, holds every REQUIRED bundle budget (heroui-vendor collapsed to 3.56 KB gzip as react-aria externalized; Total JS 2.65 MB under the 2.78 MB cap), and the live HeroUI drawer surface (AppShell drawer + TweaksDrawer) renders in EN and AR with 0/0 app console errors, dir=rtl, and Tajawal computed on visible text — with the one expected upstream thin-scrollbar delta acknowledged, not chased.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2 (both verification-only)
- **Files modified:** 0 source files; 1 SUMMARY + 4 smoke screenshots created

## Accomplishments

- **Production build green on 3.2.1** — `pnpm --dir frontend build` exit 0, `frontend/dist/index.html` produced, built in 12.86s.
- **REQUIRED Bundle Size Check green** — `pnpm --dir frontend size` exit 0, all 10 budgets pass, zero `exceeded` lines (grepped the full output for hidden stacked breaches — none).
- **Chunk-movement prediction confirmed** — `heroui-vendor` shrank to **3.56 KB gzip** (was budgeted 9 KB) because 3.2.1 stopped vendoring react-aria; that weight fell into the `vendor` catch-all (2.34 MB raw / 745 KB gzip, no named budget) and only **Total JS** absorbed the shift, landing at **2.65 MB / 2.78 MB**.
- **Lint green** — `pnpm --dir frontend lint` exit 0: i18n namespace check OK, duplicate-rtl check OK, bootstrap-parity byte-match OK (6 linear combos + 5 coercion probes + 51 `:root` literal checks). This phase touched none of those inputs; they stayed green.
- **EN + AR drawer smoke passed** — dashboard + AppShell drawer + TweaksDrawer open and dismiss in both languages; **app console-error count 0/0**; AR asserted `html[dir=rtl]`, `lang=ar`, and computed `font-family` = `Tajawal, "Inter Variable", system-ui, sans-serif` (Tajawal primary).
- **ConcurrentDrawers re-bound to the final tree** — `pnpm --dir frontend test run ConcurrentDrawers` exit 0, 3/3 passed.

## Task Commits

1. **Task 1 (build + size + lint) & Task 2 (EN/AR smoke):** verification-only, no source changes — evidence lands in this SUMMARY + the 4 smoke screenshots, committed as one atomic docs commit (`docs(78-04): …`). Pre-commit hook ran; `.planning/`-only change skips the build step.

## Task 1 — Bundle budgets (Phase 80 baseline)

`pnpm --dir frontend size` → **exit 0, all green.** Actual gzip vs limit:

| Budget                              | Limit   | Actual gzip | Headroom  |
| ----------------------------------- | ------- | ----------- | --------- |
| Initial JS (entry point)            | 476 KB  | 471.98 KB   | 4.02 KB   |
| React vendor                        | 285 KB  | 61.08 KB    | 223.92 KB |
| TanStack vendor                     | 63 KB   | 58.17 KB    | 4.83 KB   |
| **HeroUI vendor**                   | 9 KB    | **3.56 KB** | 5.44 KB   |
| Sentry vendor                       | 9 KB    | 3.94 KB     | 5.06 KB   |
| DnD vendor                          | 22 KB   | 16.55 KB    | 5.45 KB   |
| Copilot vendor (lazy)               | 145 KB  | 137.12 KB   | 7.88 KB   |
| **Total JS**                        | 2.78 MB | **2.65 MB** | ~0.13 MB  |
| signature-visuals/d3-geospatial     | 55 KB   | 54.15 KB    | 0.85 KB   |
| signature-visuals/static-primitives | 12 KB   | 8.04 KB     | 3.96 KB   |

- **No breach, none skipped.** `grep -i exceed` over the full log → 0 hits.
- **Mechanism verified (RESEARCH §Bundle Size, A2):** the build's `vendor-*.js` catch-all is 2,344.81 KB raw / 745.01 KB gzip — this is where the externalized `react-aria`/`react-aria-components` (RAC 1.17→1.18) resolved, matching no named `manualChunks` rule. `heroui-vendor` therefore shrank rather than grew, and no NON-heroui named budget breached. No `.size-limit.json` edit made.

## Task 2 — EN + AR drawer render smoke

Tooling: `browser-harness` → dedicated headless Chrome on `:9222` (launched with `--headless=new --disable-gpu`; connected via `BU_CDP_URL=http://localhost:9222` — Chrome bound IPv6/`localhost`, so `127.0.0.1` was NOT reachable). Console-error collector (`console.error` + `window.onerror` + `unhandledrejection`) installed via `Page.addScriptToEvaluateOnNewDocument` before first paint; CDP `Runtime`/`Log` domains also drained for exception/error entries. Viewport 900×900 so the `lg:hidden` hamburger (`.tb-menu`) engages the AppShell overlay drawer. Login via native-setter injection (no credential echoed to any artifact or screenshot).

| Pass | URL                 | dir | lang | Tajawal on body text                                  | AppShell drawer | Tweaks drawer   | App console errors |
| ---- | ------------------- | --- | ---- | ----------------------------------------------------- | --------------- | --------------- | ------------------ |
| EN   | `/dashboard`        | ltr | en   | — (Inter)                                             | open+dismiss ✅ | open+dismiss ✅ | **0**              |
| AR   | `/dashboard?lng=ar` | rtl | ar   | ✅ `Tajawal, "Inter Variable", system-ui, sans-serif` | open+dismiss ✅ | open+dismiss ✅ | **0**              |

Screenshots (open drawers, per language) — retained locally under `.planning/phases/78-heroui-v3-api-audit-bump/78-04-smoke/`; **not committed** because the repo `.gitignore` globally ignores `*.png` (line 153). Each was reviewed inline during execution and confirmed a correct render:

- `78-04-smoke/en-appshell-drawer.png` — AppShell nav drawer, Linear dark, tokens; dashboard KPIs behind
- `78-04-smoke/en-tweaks-drawer.png` — TweaksDrawer (Theme / Density / Reading Direction / Classification Ribbon / Shortcuts)
- `78-04-smoke/ar-appshell-drawer.png` — RTL: nav items in Arabic (الموقف/الارتباطات/التقويم/الملخصات…), Tajawal, mirrored shell
- `78-04-smoke/ar-tweaks-drawer.png` — RTL: `تخصيص` panel, all controls Arabic, drawer flipped side, Tajawal

### Console-error accounting (honest disclosure)

- **App-level console errors (the gate metric): 0 EN / 0 AR** — the injected collector caught zero `console.error`, `window.onerror`, or `unhandledrejection` events in either pass, before or after opening both drawers.
- **Browser network-layer entries: 8 EN / 6 AR — ALL pre-existing, NOT HeroUI.** Every one is a CORS failure on a single Supabase edge function: `Access to fetch at '…/functions/v1/tasks-get?…' from origin 'http://localhost:5174' has been blocked by CORS policy` + `net::ERR_FAILED`. This is the known edge-function `ALLOWED_ORIGINS` gap for the local dev origin (documented pattern), independent of the `@heroui` bump and identical in both languages. Recorded, non-blocking — no error traces to HeroUI, react-aria, or the drawers.

### Expected upstream delta — drawer thin scrollbar (acknowledged, not chased)

`@heroui/styles` 3.2.1 changed the drawer-body rule to `@apply min-h-0 flex-1 scrollbar` (thumb = `color-mix(foreground 15%)`). This is the ONE intentional visual change in the 3.0.5→3.2.1 range (RESEARCH §CSS Delta). Note: `@apply scrollbar` INLINES the `scrollbar` utility's declarations into the compiled drawer-body CSS rule — it does **not** add a literal `scrollbar` class name to the DOM element, so a DOM class-name probe correctly returns false while the delta is genuinely present in the computed styles. **Zero app CSS was added to counter it.** If design ever objects, the supported seam is the `--scrollbar-*` theme vars, not override CSS.

## Verification Evidence

Plan `<verification>` re-run at close:

- `pnpm --dir frontend build` → exit 0; `frontend/dist/index.html` exists — ✅
- `pnpm --dir frontend size` → exit 0, all budgets green, 0 `exceeded` lines — ✅
- `pnpm --dir frontend lint` → exit 0 (bootstrap-parity + i18n + duplicate-rtl green) — ✅
- EN smoke: dashboard + AppShell drawer + TweaksDrawer render, app console errors = 0 — ✅
- AR smoke: `?lng=ar` first-paint flip, `html[dir=rtl]` true, computed font includes `Tajawal`, both drawers render, app console errors = 0 — ✅
- Screenshots captured for both drawers in both languages — ✅
- Drawer thin-scrollbar delta acknowledged as expected; no app CSS added — ✅
- `pnpm --dir frontend test run ConcurrentDrawers` → exit 0, 3/3 passed — ✅

## Deviations from Plan

- **Dev server on `:5174`, not `:5173`.** The orchestrator provisioned a fresh Vite server on `:5174` (re-optimized deps for the 3.2.1 lockfile); the plan text names `:5173`. Used `:5174` per the executor briefing — it is the correct 3.2.1 tree.
- **Chrome CDP reached via `localhost` not `127.0.0.1`.** `--headless=new` bound the DevTools endpoint to IPv6/`localhost`; `BU_CDP_URL=http://localhost:9222` was used instead of the `127.0.0.1` example.
- **Login filled via native-setter injection instead of char-by-char key events.** `fill_input`'s per-character CDP key dispatch hit a transient IPC socket timeout that wedged the first Chrome instance; relaunched a fresh headless Chrome with `--disable-gpu` and switched to a single-shot native-setter `js()` fill (which the executor briefing also prescribes for React controlled inputs). Login then succeeded first try.

**Total deviations:** 3, all environmental/tooling — none altered what was verified or its result.

## Issues Encountered

- **First headless Chrome wedged** after the char-by-char key-event timeout (CDP HTTP endpoint stopped responding while the process stayed alive). Resolved by force-killing it and relaunching with `--disable-gpu`; the dedicated `:9222` Chrome was killed at the end. The orchestrator's `:5174` dev server was left running (confirmed HTTP 200 after cleanup).
- **No REAL regression surfaced** — no console error traced to HeroUI, no drawer failed to open/dismiss, no RTL breakage. Rollback reference (`git revert 10de0c95 && pnpm install`) NOT triggered.

## User Setup Required

None. (Separately noted for backlog, not this phase: the `tasks-get` edge function's `ALLOWED_ORIGINS` does not include the local dev origin — a pre-existing CORS config gap surfaced by the smoke, unrelated to HeroUI.)

## Next Phase Readiness

- **HEROUI-01 closed:** build + REQUIRED size gate + lint green on 3.2.1; live drawer surface renders EN + AR without regression at smoke depth.
- **Phase 80 baseline recorded:** the per-budget gzip table above (esp. `heroui-vendor` 3.56 KB, `Total JS` 2.65 MB) is the reference for Phase 80's full-route re-compare.
- **Phase 79 (Aceternity swap)** inherits a green, size-gated 3.2.1 tree.
- ROADMAP success criteria 1–3 all provable at phase close: lockstep 3.2.1 (78-01), Phase 75 confirmation holds (78-03), HeroUI routes render without regression in EN and AR (this plan) — with the REQUIRED Bundle Size Check green.

---

_Phase: 78-heroui-v3-api-audit-bump_
_Completed: 2026-07-03_

## Self-Check: PASSED
