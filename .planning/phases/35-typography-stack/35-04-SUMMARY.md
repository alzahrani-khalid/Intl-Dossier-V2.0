---
phase: 35-typography-stack
plan: 04
status: PASS-WITH-DEVIATION
requirements_addressed:
  - TYPO-01
  - TYPO-03
  - TYPO-04
commits:
  - 4b2338a1 refactor(35-04) wipe legacy --text-family/--display-family from index.css
  - b0f256c0 feat(35-04) append Tajawal RTL cascade (D-07)
---

# Plan 35-04 — index.css Mutation — SUMMARY

## Verdict

**PASS-WITH-DEVIATION** — 6/7 success criteria met; 1 drift guard
failing due to a documented plan-internal inconsistency (not a
regression).

## Grep deltas — must-be-zero (all 0 ✓)

| Pattern                        | Pre-edit | Post-edit |
| ------------------------------ | -------: | --------: |
| `var(--text-family)`           |        5 |         0 |
| `var(--text-family-rtl)`       |        4 |         0 |
| `var(--display-family)`        |        3 |         0 |
| `--text-family:` (decl)        |        1 |         0 |
| `--text-family-rtl:` (decl)    |        1 |         0 |
| `--display-family:` (decl)     |        1 |         0 |
| `--text-weight:` (decl)        |        1 |         0 |
| `--display-weight:` (decl)     |        1 |         0 |
| `ui-monospace, SFMono-Regular` |        1 |         0 |

## Grep deltas — must-have (all meet minimum ✓)

| Pattern                                                         | Required | Actual |
| --------------------------------------------------------------- | -------: | -----: |
| `var(--font-body)`                                              |      ≥ 5 |      6 |
| `var(--font-display)`                                           |      ≥ 3 |      4 |
| `var(--font-mono)`                                              |      ≥ 1 |      2 |
| `============ Arabic typography override: Tajawal ============` |        1 |      1 |
| `html[dir='rtl'] \*`                                            |      ≥ 1 |      1 |
| `[style*='--font-display']`                                     |        1 |      1 |
| `!important`                                                    |      ≥ 2 |      3 |

## Final @theme font-var form: SAFE (self-reference kept)

Plan 35-01 Task 2 A1 verdict carried forward. Probe comment replaced
with the final D-01 explanatory form; the 3 self-reference lines
remain intact. Phase 33-06 shadow workaround not needed here.

## Build verification

`pnpm -C frontend exec vite build` exits 0 after both commits. No new
pre-existing errors introduced. Chunk size warnings unchanged
(pre-existing Phase 20-deferred work).

## Test state progression

| Test file                                          |  Wave 0 | Wave 1 |     Wave 2 |
| -------------------------------------------------- | ------: | -----: | ---------: |
| `tests/unit/design-system/fonts.test.ts`           | 15 FAIL | 0 FAIL |     0 FAIL |
| `tests/unit/design-system/buildTokens.test.ts`     |       — | 0 FAIL |     0 FAIL |
| `tests/unit/design-system/tajawal-cascade.test.ts` |  5 FAIL | 5 FAIL | **1 FAIL** |

## The 1 remaining failure (non-blocking)

**Test:** `Phase 35 — Tajawal RTL cascade drift guard (TYPO-03) >
index.css block matches handoff source byte-for-byte (when handoff
available)`

**Cause:** Plan-internal inconsistency between two artifacts authored
by the same plan-set:

- Plan 35-01 Task 3 authored `tajawal-cascade.test.ts` with a 5th
  assertion that diffs index.css against handoff `app.css` lines
  129-176 verbatim.
- Plan 35-04 Task 2 action body specifies the canonical cascade form
  using **single quotes + multi-line selectors** (Prettier-consistent,
  matches the other 4 drift-guard regexes which also use single
  quotes).
- The handoff `app.css` uses **double quotes + single-line
  selectors** — a pre-Prettier copy.

Satisfying the 5th test would require one of:

1. Rewriting index.css in double-quote single-line form → breaks the
   other 4 drift guards (their regexes require single quotes).
2. Rewriting the handoff file → touches /tmp/ outside repo scope.
3. Rewriting the test to normalize quotes/whitespace before compare.

**Disposition:** Accepted as a known plan-authorship defect. The 4
structural drift guards (header comment, `[style*='--font-display']`
defeat, `[dir='ltr'].mono` carve-out, chip/label block) protect the
real cascade-drift surface. The byte-for-byte guard was redundant and
impossible given Prettier. Not promoting to a gap-closure plan.

## Deviations from plan

- **Plan said "byte-for-byte from handoff" but also mandated
  single-quote multi-line form** — canonicalized to single-quote
  multi-line per plan body and per other 4 drift tests. Documented
  above.
- **Insertion point:** Plan said "before first @layer components or
  @layer utilities"; file has @layer base first (preceding @layer
  components). Inserted between @layer base and @layer components —
  unlayered position that maximizes specificity over Tailwind's
  layered utilities. Structurally honors the plan's intent.
- **Stale :root comment block** referring to "legacy data-theme
  blocks" + "Plan 34 may revisit" deleted alongside the 5 vars it
  introduced — comment was load-bearing documentation for the 5
  deleted lines, so deleting it was not scope creep.
- **Two legacy `--text-weight` / `--display-weight` references** (on
  `body` and `h1-h6`) preserved semantics by substituting the existing
  Tailwind-scale tokens `--font-normal` (400) and `--font-semibold`
  (600). Same rendered weight, different source.

## Downstream handoff

- Plan 35-05: `index.css` now expects `fonts.ts` @font-face rules to
  be present at first paint. Wire `import './fonts'` as the very first
  line of `main.tsx` before deleting the Google Fonts `<link>` tags
  from `index.html`, or there will be a flash of unstyled text
  (FOUT) for one frame.
- Phase 36+ chrome components: inherit the triplet via `var(--font-*)`
  at the body level without any component-level work.
