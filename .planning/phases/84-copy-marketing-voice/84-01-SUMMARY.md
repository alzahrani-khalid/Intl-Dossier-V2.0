---
phase: 84-copy-marketing-voice
plan: 01
subsystem: ui
tags: [i18n, copy, marketing-voice, arabic, rtl, empty-states, guided-tours]

# Dependency graph
requires:
  - phase: 77-08-DOC-01
    provides: "CLAUDE.md 'No marketing voice' voice rules (banned Discover/Easily/Unleash/'!')"
provides:
  - 'Marketing-voice-free copy in four en i18n namespaces (empty-states, guided-tours, relationships, progressive-disclosure)'
  - 'Arabic mirrors in the same calm register (en drives ar)'
affects: [copy-quality, i18n, phase-85-taste-calls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'en drives ar: only the same key paths whose en value changed get their ar counterpart reworded'

key-files:
  created:
    - .planning/phases/84-copy-marketing-voice/84-01-SUMMARY.md
  modified:
    - frontend/src/i18n/en/empty-states.json
    - frontend/src/i18n/en/guided-tours.json
    - frontend/src/i18n/en/relationships.json
    - frontend/src/i18n/en/progressive-disclosure.json
    - frontend/src/i18n/ar/empty-states.json
    - frontend/src/i18n/ar/guided-tours.json
    - frontend/src/i18n/ar/relationships.json
    - frontend/src/i18n/ar/progressive-disclosure.json

key-decisions:
  - 'Named sites only: reworded exactly the 27 en string values called out in the plan; no Title-Case or taste sweep (F16-F21 = Phase 85)'
  - "duplicate-detection.json (en+ar) left byte-untouched — 'cannot be easily undone' is a legitimate destructive-action warning (D-84-09 whitelist)"
  - "ar/progressive-disclosure.json 'اكتشاف التعارضات' (conflict detection) left untouched — its en counterpart was never in scope"

patterns-established:
  - 'Values-only i18n edits: en/ar leaf-key sets stay byte-identical; label-parity + leaf-key parity gates stay green'

requirements-completed: [COPY-01]

# Metrics
duration: 18min
completed: 2026-07-05
---

# Phase 84 Plan 01: Copy / Marketing Voice Summary

**Removed marketing voice (21 exclamation marks, 6 Discover/easily occurrences, 'Let us show you around') from four en i18n namespaces and mirrored the calm register into their ar counterparts — values only, keys byte-identical.**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-07-05
- **Tasks:** 2
- **Files modified:** 8 (4 en + 4 ar)

## Accomplishments

- en/empty-states.json: removed 7 exclamation marks, dropped "easily accessible" → "accessible", "easy discovery" → "easier to find"
- en/guided-tours.json: removed 14 exclamation marks, "Discover" → neutral verbs (find/see), "Let us show you around!" → "Start with a quick tour."; "Let's Go!" → "Get started"
- en/relationships.json L35: "Discover hidden patterns" → "Find hidden patterns"
- en/progressive-disclosure.json L21: "discover advanced features" → "explore advanced features"
- ar mirrors: removed the matching 7 + 14 Arabic exclamation marks and reworded the Arabic marketing equivalents (اكتشف / لاكتشاف / لسهولة الاكتشاف → للعثور على / تعرف على / لتسهيل العثور / لنبدأ), preserving formal Arabic and RTL
- All key sets unchanged; the D-84-09 whitelist file and the ar "conflict detection" false positive were left untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy-edit the four en namespaces (D-84-01..04)** - `4613b67c` (fix)
2. **Task 2: Mirror the corrected register into ar (D-84-05) + full gate battery** - `92621dd7` (fix)

**Plan metadata:** (final metadata commit — see below) (docs: complete plan)

## Files Created/Modified

- `frontend/src/i18n/en/empty-states.json` - 9 values reworded (7 `!` + "easily accessible" + "easy discovery")
- `frontend/src/i18n/en/guided-tours.json` - 16 values reworded (14 `!` + 2 "Discover")
- `frontend/src/i18n/en/relationships.json` - L35 connectDesc without "Discover"
- `frontend/src/i18n/en/progressive-disclosure.json` - L21 advanced hint without "discover"
- `frontend/src/i18n/ar/empty-states.json` - Arabic mirror (7 `!` removed + "سهولة الوصول"/"لسهولة الاكتشاف" reworded)
- `frontend/src/i18n/ar/guided-tours.json` - Arabic mirror (14 `!` removed + "اكتشف"/"لاكتشاف"/"دعنا نعرفك"/"هيا بنا" reworded)
- `frontend/src/i18n/ar/relationships.json` - L35 mirror ("اكتشف" → "اعثر على")
- `frontend/src/i18n/ar/progressive-disclosure.json` - L21 mirror ("لاكتشاف" → "لاستكشاف")

## Decisions Made

- **Named sites only.** Reworded exactly the 27 en string values named in the plan. Other Title-Case titles and taste calls (F16–F21) are deferred to Phase 85 per the scope-discipline note — not swept here.
- **letsGo/action CTA.** en "Let's Go!" → "Get started" (both key paths); ar mirror → "لنبدأ" (calm, matches "Get started" without the informal "هيا بنا").
- **"Be the First!" → "Be the first to contribute"** (ar "كن أول من يساهم") — sentence case, no `!`, meaning preserved from the accompanying description.

## Deviations from Plan

None - plan executed exactly as written. Values-only edits, no keys touched, no auto-fixes needed.

## Issues Encountered

None. All acceptance gates passed on the first run:

- `grep -c '!'` → 0 for en+ar empty-states and guided-tours
- `grep -rliE 'discover|easily|unleash' frontend/src/i18n/en/` → only duplicate-detection.json (D-84-09 whitelist)
- Leaf-key parity node check → "key parity OK" (318/157/210/92 baselines held)
- `pnpm vitest run src/i18n/label-parity.test.ts` → 2 passed
- `(cd frontend && pnpm type-check)` → exit 0
- `pnpm lint` → clean (eslint + check-i18n-namespaces + duplicate-rtl + bootstrap-parity + date-formatting all OK)
- duplicate-detection.json (en+ar) → byte-untouched
- ar/progressive-disclosure.json "اكتشاف التعارضات" → unchanged

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- COPY-01 satisfied; the four namespaces carry no marketing voice and ar mirrors follow en.
- Phase 85 owns the F16–F21 taste calls (Title-Case → sentence-case sweeps, other tone polish) — intentionally out of scope here.

## Self-Check: PASSED

- FOUND: .planning/phases/84-copy-marketing-voice/84-01-SUMMARY.md
- FOUND: commit 4613b67c (Task 1 — en)
- FOUND: commit 92621dd7 (Task 2 — ar)

---

_Phase: 84-copy-marketing-voice_
_Completed: 2026-07-05_
