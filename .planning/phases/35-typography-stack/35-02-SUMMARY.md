---
phase: 35-typography-stack
plan: 02
status: PASS
requirements_addressed:
  - TYPO-01
commits:
  - f1465f6f feat(35-02) emit --font-display/body/mono from buildTokens
---

# Plan 35-02 — buildTokens Font Triplet — SUMMARY

## Verdict

**PASS** — all 5 success criteria met.

## New exports

- `types.ts` — `DirectionFonts { display, body, mono }` interface
- `directions.ts` — `FONTS: Record<Direction, DirectionFonts>` const (4 × 3
  = 12 literal values; exports `as const` for type narrowing)
- `buildTokens.ts` — three new keys in TokenSet return: `--font-display`,
  `--font-body`, `--font-mono`

## Test count delta

| Metric                          | Before |        After | Delta           |
| ------------------------------- | -----: | -----------: | --------------- |
| `buildTokens.test.ts` PASS      |     91 |           99 | **+8**          |
| `buildTokens.test.ts` FAIL      |      0 |            0 | 0               |
| Free coverage via REQUIRED_KEYS |    72× | 72× (×3 new) | +216 assertions |

The +216 free assertions land because `REQUIRED_KEYS` is iterated inside the
72-case matrix; each new key multiplies existence checks by 72.

## Deviations from plan / RESEARCH §Pattern 2

**None.** The 12 literal font strings in `directions.ts` match the handoff
matrix byte-for-byte:

- Chancery: Fraunces / Inter / JetBrains Mono ✓
- Situation: Space Grotesk / IBM Plex Sans / IBM Plex Mono ✓
- Ministerial: Public Sans / Public Sans / JetBrains Mono ✓
- Bureau: Inter / Inter / JetBrains Mono ✓

Plan's Task 2 template suggested `import { PALETTES, DENSITIES, FONTS } from './directions'`
but the existing codebase imports `DENSITIES` from `./densities` (a
sibling file). Adapted the import to `import { PALETTES, FONTS } from './directions'`
while leaving the pre-existing `DENSITIES` import untouched. Not a
semantic deviation.

## Acceptance criteria status (5/5 PASS)

- [x] `DirectionFonts` interface exported from types.ts
- [x] `FONTS: Record<Direction, DirectionFonts>` exported with 12 literals
- [x] `buildTokens` emits `--font-display/body/mono` on every call
- [x] `buildTokens.test.ts` +8 `it()` cases GREEN (4 literals + 4 invariance)
- [x] `REQUIRED_KEYS` includes all 3 font keys

## Wave-0 RED state advanced

- `fonts.test.ts`: still 15 failing (Plan 35-03 will create fonts.ts)
- `tajawal-cascade.test.ts`: still 5 failing (Plan 35-04 will append cascade)
- `typography.spec.ts`: still red (Plan 35-04/05 wire tokens + delete CDN)

## Downstream handoff

- Plan 35-04: can now `var(--font-display)` etc. inside `index.css` —
  applyTokens()'s setProperty loop writes them on every direction change.
- Plan 36+ chrome components: inherit the triplet automatically via
  `font-family: var(--font-body)` at the `<body>` level.
