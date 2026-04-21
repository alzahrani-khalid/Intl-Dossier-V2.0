---
phase: 35-typography-stack
plan: 01
status: PASS
requirements_addressed:
  - TYPO-01
  - TYPO-02
  - TYPO-03
  - TYPO-04
commits:
  - c875865a chore(35-01) install 8 @fontsource packages
  - 772a3a4c feat(35-01) @theme font-var smoke probe — A1 verdict SAFE
  - (Task 3) test(35-01) Wave-0 drift guards + TYPO-04 fixture
---

# Plan 35-01 — Wave 0 Scaffolds — SUMMARY

## Verdict

**PASS** — all 6 success criteria met.

## A1 verdict: SAFE

`@theme { --font-display: var(--font-display); ... }` self-reference pattern
does NOT crash Tailwind v4's generator. Dev server `pnpm -C frontend dev`
booted in 828 ms; `curl http://localhost:5173/src/index.css` returned HTTP
**200**.

Contrast with Phase 33-06 shadow self-reference (`e5fcacec`) which crashed
with `y is not a function` — that failure was family-specific to box-shadow's
multi-layer parser. Font-family references are simpler string lookups and
the Tailwind v4 generator handles them correctly.

**Final `@theme` font-var form chosen:** **self-reference** (matches the
probe form). Plan 35-04 can hard-wire this shape without a fallback branch.

## Installed versions

| Package                             | Version pinned |
| ----------------------------------- | -------------- |
| @fontsource-variable/inter          | ^5.2.8         |
| @fontsource-variable/public-sans    | ^5.2.7         |
| @fontsource-variable/space-grotesk  | ^5.2.10        |
| @fontsource-variable/fraunces       | ^5.2.9         |
| @fontsource-variable/jetbrains-mono | ^5.2.8         |
| @fontsource/ibm-plex-sans           | ^5.2.8         |
| @fontsource/ibm-plex-mono           | ^5.2.7         |
| @fontsource/tajawal                 | ^5.2.7         |

All 14 expected CSS sub-paths present under `frontend/node_modules/`:
5 `wght.css` (variable families) + 4 IBM Plex Sans weights + 2 IBM Plex Mono
weights + 3 Tajawal weights.

`pnpm -C frontend install --frozen-lockfile` exits 0 — lockfile in sync.

## RED-state snapshot (Wave-0 expectation)

```
fonts.test.ts            Tests  15 failed | 8 passed (23)
                         8 dep-pin assertions PASS (Task 1 populated them)
                         15 fonts.ts-import assertions FAIL (Plan 35-03 creates fonts.ts)
tajawal-cascade.test.ts  5 drift-guard assertions FAIL (Plan 35-04 appends cascade)
typography.spec.ts       7 Playwright cases FAIL or ERROR (Plan 35-04/05 wire tokens + delete Google Fonts)
```

Plans 35-02 through 35-05 flip each red row to green.

## Acceptance criteria status (6/6 PASS)

- [x] 8 `@fontsource[-variable]/*` packages present in `frontend/package.json` with `^5.x` pins
- [x] 14 expected CSS sub-path files present under `frontend/node_modules/`
- [x] A1 verdict (SAFE) recorded in this SUMMARY
- [x] `frontend/src/index.css` `@theme` block contains 3 `--font-*` entries (self-ref form)
- [x] 4 Wave-0 files exist and are syntactically valid TypeScript/HTML
- [x] Threat T-35-01 (pnpm SHA-512 integrity) + T-35-04 (A1 smoke) mitigations in place

## Deviations from plan

None.

## Downstream handoff

- Plan 35-02 (Wave 1): consume `FONTS: Record<Direction, DirectionFonts>` plan
  with literals from handoff matrix; no blockers.
- Plan 35-03 (Wave 1): author `frontend/src/fonts.ts` with 16 import
  statements per the literal list in §`<interfaces>` of this plan. When
  written, flips 15 fonts.test.ts rows GREEN.
- Plan 35-04 (Wave 2): hard-wire the probe lines to their final form inside
  `@theme` — no fallback branch needed per A1 SAFE verdict.
