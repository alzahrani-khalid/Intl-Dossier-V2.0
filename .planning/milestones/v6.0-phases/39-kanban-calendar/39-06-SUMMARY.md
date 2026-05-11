---
plan: 39-06
phase: 39
slug: kanban-calendar
wave: 1
title: CalendarEventPill — D-13 schema fallback
status: complete
completed: 2026-04-25
---

# Plan 39-06 — CalendarEventPill — SUMMARY

> Built the `.cal-ev` chip component rendered inside each `cal-cell`. Honors D-13 schema-fallback decision: live `CalendarEvent` schema does not expose `'travel'` / `'pending'` literals, so every event renders as the default accent-soft variant. `.travel` and `.pending` CSS rules ship orphaned so backend can wire them later without touching JSX.

## Outcome

- 3/3 task commits + RED→GREEN TDD gate
- 8/8 vitest unit tests passing (`src/components/calendar/__tests__/CalendarEventPill.test.tsx`)
- D-13 fallback honored — module-scoped `console.warn` fires once per page mount, naming the missing schema fields
- `.cal-ev` (default), `.cal-ev.travel`, `.cal-ev.pending` rules appended to `calendar.css` using design-system tokens (no hex)

## Commits

| SHA        | Message                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `bb55a8fa` | test(39-06): add failing CalendarEventPill tests for D-13 schema fallback |
| `9b9d2fdd` | feat(39-06): implement CalendarEventPill with D-13 schema fallback        |
| `a81fe499` | feat(39-06): append .cal-ev variant rules to calendar.css                 |

## Files

- Created: `frontend/src/components/calendar/__tests__/CalendarEventPill.test.tsx`
- Replaced (was 39-05 stub): `frontend/src/components/calendar/CalendarEventPill.tsx`
- Modified (append only): `frontend/src/components/calendar/calendar.css`

## Verification

```bash
cd frontend && pnpm test --run src/components/calendar/__tests__/CalendarEventPill.test.tsx
# → Test Files 1 passed (1) | Tests 8 passed (8)
```

## D-13 fallback details

- Module-scoped `let warned = false` guards the `console.warn` call so only the first render of the first pill warns. Subsequent renders are silent.
- Warning text references `'travel'` and `'pending'` so backend follow-up has a grep-able signpost.
- All events render with the default `.cal-ev` class. The orphan `.cal-ev.travel` / `.cal-ev.pending` CSS rules are present so backend can flip a single field on the schema and the chips will paint the new variants automatically.

## Deviations

- None of architectural significance.
- Tests use `vi.spyOn(console, 'warn').mockImplementation(() => {})` per plan guidance.

## Status

Complete — orchestrator may proceed to plan 39-07 (mobile responsive WeekListMobile).
