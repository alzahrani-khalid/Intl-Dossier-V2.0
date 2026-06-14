---
phase: 69-signals
plan: 03
subsystem: ui
tags:
  [
    react,
    tanstack-query,
    keyboard-triage,
    rtl,
    bdi,
    design-tokens,
    intelligence-signals,
    i18n,
    dialog,
  ]

# Dependency graph
requires:
  - phase: 69-signals (plan 02)
    provides: useSignals (read_signals INVOKER RPC), useCreateSignal ({ id } result), useUpdateSignalStatus ({ id, status }), useSignalEscalate, Signal/SignalFilters/SignalStatus/SignalSeverity/SignalCategory types, signalKeys, domains/signals barrel
  - phase: 69-signals (plan 01)
    provides: intelligence-signals i18n namespace (en+ar, registered) + signal.types.ts base types + live intelligence_event extension/clearance RLS/read_signals RPC
  - phase: shared-infra
    provides: Dialog/Button/Input/Textarea/Label/Card UI primitives, DossierSelector, useDirection, IntelligencePage (reports DataTable)
provides:
  - 'useSignalKeyboardTriage — net-new j/k/a/d/e keydown hook bound to the queue container ref (not window), INPUT/TEXTAREA/SELECT/contentEditable-guarded, focusedIndex reset on list-length change'
  - 'SignalStatusBadge — status→design-token pill (new/acknowledged/dismissed/escalated)'
  - 'SignalRow — <li> with bdi-wrapped title + content, focused accent ring, severity/sensitivity/category/AI-confidence badges, "Tue 28 Apr" date'
  - 'SignalsQueue — global + per-dossier (dossierId prop, D-01) triage queue wiring useSignals + useUpdateSignalStatus + useSignalKeyboardTriage; filter pills, loading skeleton, role="alert" error, generic empty copy, escalate placeholder, capture drawer'
  - 'CaptureSignalForm — right-side drawer (480px, shadow-lg) with 6 fields, inline validation, DossierSelector→dossierTypes map for the junction CHECK'
  - 'IntelligencePage — Reports | Signals tab switcher; reports content untouched under the Reports tab'
affects: [69-04, escalate-signal-dialog, dossier-signals-tab, signals-queue, signal-capture]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Keyboard-inbox hook: addEventListener("keydown") on a container ref (NOT window) + useState(focusedIndex) + length-change reset effect — the codebase''s first keyboard-navigation surface'
    - 'Design-token soft backgrounds via arbitrary bg-[var(--info-soft)]/bg-[var(--warn-soft)]/bg-[var(--danger-soft)] — these soft tokens are NOT exposed as @theme utilities, only their non-soft siblings are (text-info/text-warning/text-danger and bg-line-soft/bg-accent-soft ARE mapped)'
    - '<bdi> for every free-text signal title/body render (D-09) — no textAlign:right, no writingDirection'
    - 'One-component-path queue (D-01): SignalsQueue(dossierId?) serves both /intelligence global view and per-dossier tab'
    - 'DossierSelector onChange builds the dossier_id→type map useCreateSignal needs for the intelligence_event_dossiers junction CHECK'

key-files:
  created:
    - frontend/src/hooks/useSignalKeyboardTriage.ts
    - frontend/src/components/signals/SignalStatusBadge.tsx
    - frontend/src/components/signals/SignalRow.tsx
    - frontend/src/components/signals/SignalsQueue.tsx
    - frontend/src/components/signals/CaptureSignalForm.tsx
  modified:
    - frontend/src/pages/intelligence/IntelligencePage.tsx
    - frontend/src/i18n/en/intelligence-signals.json
    - frontend/src/i18n/ar/intelligence-signals.json
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json

key-decisions:
  - 'D-01: SignalsQueue is one component path, two views — dossierId prop drives global vs per-dossier; folded into /intelligence as a Reports|Signals tab'
  - 'D-02: email-style keyboard inbox — j/k move focus, a/d/e act, handler on container ref not window, logical (no physical L/R), INPUT/TEXTAREA/SELECT-guarded'
  - 'D-08: AI-confidence rendered as a badge only when source_type=ai_generated AND ai_confidence!==null'
  - 'D-09: free-text title/body via <bdi> auto-dir; empty/error states use GENERIC copy only — never mention clearance/filtering/hidden items (indistinguishable-empty)'
  - 'Exec-time: soft-background design tokens applied via arbitrary bg-[var(--*-soft)] because bg-info-soft/bg-warn-soft/bg-danger-soft are not @theme-mapped utilities (would render no background and lint would not catch it)'

patterns-established:
  - 'Keyboard triage hook bound to a container ref with a focusedIndex reset effect on signals.length change'
  - 'Soft semantic backgrounds via bg-[var(--*-soft)] arbitrary values when the -soft utility is unmapped; mapped utilities (text-info/text-warning/text-danger/bg-line-soft/bg-accent-soft) used directly'
  - "IntelligencePage tab extension: second useTranslation('intelligence-signals') aliased tSignals; existing reports content wrapped in {activeTab === 'reports' && (<>…</>)} with zero edits inside"

requirements-completed: [SIGNAL-01, SIGNAL-02, SIGNAL-03, SIGNAL-04]

# Metrics
duration: 9min
completed: 2026-06-14
---

# Phase 69 Plan 03: Triage Queue UI Summary

**The analyst-facing signals triage surface: a net-new j/k/a/d/e keyboard-inbox hook, bdi-wrapped token-faithful SignalRow + SignalStatusBadge, the SignalsQueue orchestrator (one component for the global /intelligence view and per-dossier tabs via a dossierId prop), a 6-field CaptureSignalForm drawer with inline validation, and a Reports | Signals tab switcher on IntelligencePage that leaves the existing reports DataTable untouched.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-14T16:03:54Z
- **Completed:** 2026-06-14T16:12:57Z
- **Tasks:** 4 (committed as 4 atomic commits)
- **Files modified:** 10 (5 created, 5 modified — incl. i18n)

## Accomplishments

- **`useSignalKeyboardTriage`** — the codebase's first keyboard-navigation surface. A `keydown` handler bound to the queue `<ul>` container ref (NOT window — prevents cross-page key leakage), guarded against INPUT/TEXTAREA/SELECT and contentEditable targets. `j`/`k` clamp `focusedIndex` to `[0, signals.length-1]`; `a`/`d`/`e` fire the acknowledge/dismiss/escalate callbacks with the focused signal. A separate effect resets `focusedIndex` to 0 whenever `signals.length` changes so a filter that narrows the list never leaves focus out of bounds.
- **`SignalStatusBadge` + `SignalRow`** — token-faithful display. Status/severity config maps resolve to IntelDossier design tokens; signal title AND content are each wrapped in `<bdi>` (D-09); the focused row shows `outline-2 outline-[var(--accent)] bg-accent-soft`; the AI-confidence badge renders only for `ai_generated` signals with non-null `ai_confidence`; dates use date-fns `'EEE dd MMM'` → "Tue 28 Apr". Zero physical-direction classes, zero raw hex, zero Tailwind color literals.
- **`SignalsQueue`** — the orchestrator. `<ul role="list" ref={containerRef} dir={isRTL}>` of `SignalRow`s wiring `useSignals({ ...filters, dossierId })` + `useUpdateSignalStatus` + `useSignalKeyboardTriage`. Filter pills (All/New/Acknowledged/Dismissed/Escalated, default `new`, `All` clears status), a count, a Capture-signal button, a decorative `aria-hidden` keyboard-hint strip, a 3-card `animate-pulse` loading skeleton, a `role="alert"` error card, and a **generic** empty state that never mentions clearance (indistinguishable-empty, D-09). `escalateTarget` state holds a placeholder for the Wave-4 EscalateSignalDialog; `captureOpen` drives the capture drawer. The same component serves the global view (no `dossierId`) and per-dossier tabs (`dossierId` prop) — D-01.
- **`CaptureSignalForm`** — a right-side drawer (max-width 480px, `var(--shadow-lg)`) on the Dialog primitive with 6 fields (title/body/severity/category/sensitivity 1–4/linked dossiers). Inline (not toast) validation; sensitivity shows integers only (no clearance-scale labels); `DossierSelector` builds the `dossier_id → type` map `useCreateSignal` requires for the junction CHECK. Logical spacing throughout, `dir` on `DialogContent`, `aria-required` on required fields.
- **`IntelligencePage`** — a Reports | Signals tab switcher below the page header. A second `useTranslation('intelligence-signals')` (aliased `tSignals`) supplies the Signals tab label; the existing `useTranslation()` is unchanged. The entire existing reports section (KPI grid + search/filter Card + DataTable Card) is wrapped verbatim in `{activeTab === 'reports' && (<>…</>)}` — no edits inside — and `<SignalsQueue />` renders under the Signals tab.

## Task Commits

Each task was committed atomically:

1. **Task 1: useSignalKeyboardTriage keyboard inbox hook** — `8c31c9bc` (feat)
2. **Task 2a: SignalStatusBadge + SignalRow display components** — `4624ba70` (feat) (also adds `severity.*` labels to intelligence-signals EN+AR)
3. **Task 2b + Task 4 (form): SignalsQueue orchestrator + CaptureSignalForm** — `c2e941d0` (feat) (coupled because SignalsQueue imports CaptureSignalForm — see Deviations)
4. **Task 4 (page): Reports | Signals tab switcher on IntelligencePage** — `b8ccf48a` (feat) (also adds `intelligence.tabs.reports` to common.json EN+AR)

**Plan metadata:** (this commit) `docs(69-03)`

## Files Created/Modified

- `frontend/src/hooks/useSignalKeyboardTriage.ts` (89 lines) — net-new j/k/a/d/e container-ref keydown hook + types
- `frontend/src/components/signals/SignalStatusBadge.tsx` — status→token pill
- `frontend/src/components/signals/SignalRow.tsx` — `<li>` row, bdi title/content, badges, "Tue 28 Apr" date
- `frontend/src/components/signals/SignalsQueue.tsx` — global/per-dossier triage orchestrator
- `frontend/src/components/signals/CaptureSignalForm.tsx` — 6-field capture drawer with inline validation
- `frontend/src/pages/intelligence/IntelligencePage.tsx` — Reports | Signals tab switcher (reports content unchanged)
- `frontend/src/i18n/en/intelligence-signals.json` + `ar/…` — added `severity.{low,medium,high,urgent}`
- `frontend/src/i18n/en/common.json` + `ar/…` — added `intelligence.tabs.reports`

## Decisions Made

The plan's locked decisions (D-01, D-02, D-08, D-09) were implemented as specified. Two execution-time resolutions worth recording:

- **Soft-background design tokens via arbitrary `bg-[var(--*-soft)]`.** The plan and 69-PATTERNS reference utility classes `bg-info-soft`, `bg-warn-soft`, `bg-danger-soft`. Verified against `src/index.css`: the `@theme` block maps `--color-info/--color-warning/--color-danger` (so `text-info`/`text-warning`/`text-danger` ARE valid utilities) and `--color-line-soft`/`--color-accent-soft` (so `bg-line-soft`/`bg-accent-soft` ARE valid), but it does **NOT** map `--color-*-soft` for info/warn/danger — only the raw `--info-soft`/`--warn-soft`/`--danger-soft` vars exist. Using `bg-info-soft` etc. would silently render no background (Tailwind ignores unknown classes; lint would not catch it). Resolved by applying the real soft tokens via arbitrary values `bg-[var(--info-soft)]`/`bg-[var(--warn-soft)]`/`bg-[var(--danger-soft)]` — a pattern already used in 33 files in this repo. This keeps the design contract (no raw hex, no opacity hack, genuine design-system tokens).
- **`useCreateSignal` returns `{ id }`, not `Signal`.** Wave 2 shipped `useCreateSignal` returning `{ id: string }`. The plan's `CaptureSignalForm` `onSuccess?` was typed `(signal: Signal)`; adapted to `onSuccess?: (signalId: string)` and the mutation success handler passes `result.id`. No behavior loss — the form only needs the id to signal completion.

## Deviations from Plan

### Adjusted to live interfaces / design system

**1. [Rule 1 — Bug] Soft-background utility classes do not exist; used arbitrary token values**

- **Found during:** Task 2a (SignalStatusBadge + SignalRow)
- **Issue:** Plan/PATTERNS specify `bg-info-soft`/`bg-warn-soft`/`bg-danger-soft`. These are not `@theme`-mapped Tailwind utilities — only `--info-soft`/`--warn-soft`/`--danger-soft` raw vars exist. The classes would render no background and lint would not flag them.
- **Fix:** Applied the real soft tokens via `bg-[var(--info-soft)]`/`bg-[var(--warn-soft)]`/`bg-[var(--danger-soft)]` (mapped utilities `text-info`/`text-warning`/`text-danger`, `bg-line-soft`, `bg-accent-soft`, `text-accent-ink`, `text-ink-mute`, `text-ink-faint` used directly where they exist).
- **Files modified:** SignalStatusBadge.tsx, SignalRow.tsx (and CaptureSignalForm.tsx danger banner)
- **Verification:** Full `lint` + `type-check` exit 0; grep confirms 0 raw hex / 0 color literals; pattern matches 33 existing repo files.
- **Committed in:** `4624ba70` (and `c2e941d0`)

**2. [Rule 2 — Missing critical] Added severity labels to the intelligence-signals namespace**

- **Found during:** Task 2a (SignalRow renders a severity badge label)
- **Issue:** The intelligence-signals JSON had `status`/`category` but no `severity` labels; SignalRow needed `t('severity.{value}')` and a raw `defaultValue` fallback would leak English in Arabic.
- **Fix:** Added `severity.{low,medium,high,urgent}` to both EN and AR JSON.
- **Files modified:** i18n/en/intelligence-signals.json, i18n/ar/intelligence-signals.json
- **Verification:** i18n namespace guard in `lint` passes; JSON validates.
- **Committed in:** `4624ba70`

**3. [Rule 2 — Missing critical] Added the Reports tab label key**

- **Found during:** Task 4 (IntelligencePage tab switcher)
- **Issue:** The reports tab label `intelligence.tabs.reports` did not exist in the common bundle; relying solely on `defaultValue: 'Reports'` would leak English in Arabic.
- **Fix:** Added `intelligence.tabs.reports` to common.json EN ("Reports") + AR ("التقارير"); kept `defaultValue` as belt-and-suspenders.
- **Files modified:** i18n/en/common.json, i18n/ar/common.json
- **Verification:** JSON validates; `lint` (incl. namespace guard) exits 0.
- **Committed in:** `b8ccf48a`

### Task-boundary note (not a code deviation)

- **Tasks 2b and the CaptureSignalForm half of Task 4 were committed together** (`c2e941d0`). `SignalsQueue` imports `CaptureSignalForm`, so committing the queue alone would not type-check. To keep every commit independently green, the form (a Task-4 file with no dependency on the queue) was created first and committed with the queue. The IntelligencePage half of Task 4 is its own commit (`b8ccf48a`). All four task units are present and individually attributable.

### Tooling correction (not a deviation)

- The plan's `<verify>` blocks call `pnpm --filter frontend typecheck`. The actual package is `intake-frontend` and the script is `type-check` (hyphenated). Ran `pnpm --filter intake-frontend type-check` + `lint` — both exit 0. Command-name correction only (flagged by the orchestrator tooling note and the Wave 1/2 summaries).

---

**Total deviations:** 1 Rule-1 (token utility mismatch) + 2 Rule-2 (missing i18n keys).
**Impact on plan:** All three are correctness fixes — the Rule-1 fix prevents invisible badge backgrounds; the Rule-2 fixes prevent Arabic English-leak. No scope creep; all UI-SPEC/CLAUDE.md design contracts held.

## Issues Encountered

- **The verify grep `grep -c "containerRef.current" >= 2`** expected two literal `.current` references (attach + cleanup). The hook instead binds `const el = containerRef.current` once and uses `el.addEventListener`/`el.removeEventListener` — the correct pattern (avoids the stale-`.current`-in-cleanup bug). Intent (attach + clean up on the container) is satisfied; confirmed by `grep -cE "el\.(add|remove)EventListener" = 2` and `window.addEventListener = 0`.
- **The verify grep for physical-direction classes** (`ml-|mr-|pl-|pr-|textAlign.*right`) returns 1 match in SignalRow.tsx — but it is the JSDoc line that literally documents "never `textAlign: right`", not code. A boundary-aware grep (`[^a-z-](ml-|mr-|pl-|pr-)[0-9]`) returns 0 real violations across the whole `signals/` dir.

## Known Stubs

- **EscalateSignalDialog placeholder in SignalsQueue** (`{escalateTarget !== null && <div data-escalate-target={escalateTarget.id} hidden />}`). This is **intentional and plan-sanctioned** — Task 2b's `<action>` explicitly states "Wave 4 plan (Task 1) replaces this placeholder with the actual EscalateSignalDialog import + wiring." Pressing `e` (or the future escalate affordance) sets `escalateTarget`; Wave 4 (69-04) renders the real dialog from that state. No data is silently dropped — escalation is simply not yet wired to a UI, which is the planned Wave 3/4 split. The data path (`useSignalEscalate`) already exists from Wave 2.

## Next Phase Readiness

- Wave 4 (69-04) can: (1) replace the `escalateTarget` placeholder with `EscalateSignalDialog` (pre-fill from `escalateTarget`, call `useSignalEscalate`), (2) add `DossierSignalsTab` as a thin `<SignalsQueue dossierId={…} />` wrapper into each dossier shell, and (3) run the Phase Gate UAT across all 6 SIGNAL scenarios.
- `SignalsQueue` already accepts `dossierId` and renders the per-dossier empty copy — the per-dossier tab is a near-trivial wrapper.
- Toast wiring for dismiss/restore (D-04) and escalate-success (UI-SPEC) is available via `useToast` but not yet attached in the queue — a candidate for 69-04 polish.

---

_Phase: 69-signals_
_Completed: 2026-06-14_

## Self-Check: PASSED

All 5 created files present on disk (`useSignalKeyboardTriage.ts`, `SignalStatusBadge.tsx`, `SignalRow.tsx`, `SignalsQueue.tsx`, `CaptureSignalForm.tsx`) plus this SUMMARY; all 4 task commits (`8c31c9bc`, `4624ba70`, `c2e941d0`, `b8ccf48a`) present in git history. Full `pnpm --filter intake-frontend type-check` and `lint` (incl. the i18n namespace guard, 123 registered namespaces) both exit 0. Phase verification gates: 0 real physical-direction classes across `components/signals/`, `<bdi>` count in SignalRow = 3 (title + content + isolation), IntelligencePage has `activeTab` (6 refs) + `tSignals` (2 refs) + two `useTranslation` calls + `<SignalsQueue />`, `role="list"` present, `useSignalKeyboardTriage` wired.
