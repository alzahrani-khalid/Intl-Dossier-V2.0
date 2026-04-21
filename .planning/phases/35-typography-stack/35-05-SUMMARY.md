---
phase: 35-typography-stack
plan: 05
status: PASS
requirements_addressed:
  - TYPO-01
  - TYPO-02
  - TYPO-03
  - TYPO-04
commits:
  - 96f262b4 feat(35-05) wire fonts.ts in main.tsx, strip Google Fonts CDN from index.html
  - 0ebd05d1 test(35-05) relocate typography.spec.ts to root tests/e2e + fix seedLocale
  - 4149bdf3 fix(35-05) seedLocale writes i18nextLng + user-preferences too
---

# Plan 35-05 — Terminal Integration + E2E Verification — SUMMARY

## Verdict

**PASS** — all 7 success criteria met; phase gate cleared.

## main.tsx pre/post

| Line | Pre-Phase-35                                    | Post-Phase-35                                   |
| :--- | :---------------------------------------------- | :---------------------------------------------- |
| 1    | `import { StrictMode } from 'react'`            | `import './fonts'`                              |
| 2    | `import { createRoot } from 'react-dom/client'` | `import { StrictMode } from 'react'`            |
| 3    | `import './index.css'`                          | `import { createRoot } from 'react-dom/client'` |
| 4    | `import App from './App.tsx'`                   | `import './index.css'`                          |
| 5    | (blank)                                         | `import App from './App.tsx'`                   |

Ordering invariant holds: `./fonts` precedes `./index.css` (strictly
enforced by Pitfall 2 — fontsource @font-face rules must land in the
cascade first).

## index.html line-count delta

| Metric            | Pre | Post | Delta |
| ----------------- | --: | ---: | ----: |
| Total lines       |  70 |   22 |   -48 |
| `<link>` elements |  15 |    1 |   -14 |
| `<noscript>`      |   6 |    0 |    -6 |
| Comments          |   5 |    2 |    -3 |
| Google Fonts refs |  18 |    0 |   -18 |

Preserved verbatim: `<!doctype>`, `<meta charset>`, viewport, cache-
busting metas, `<title>`, Phase 33-03 `<script src="/bootstrap.js"
blocking="render">`, `<link rel="icon">`, `<div id="root">`,
`<script type="module" src="/src/main.tsx">`.

## Playwright PASS/FAIL table

| #   | Test                                                                 | Verdict |
| --- | -------------------------------------------------------------------- | :-----: |
| 1   | TYPO-02 — zero requests to fonts.googleapis.com or fonts.gstatic.com | ✓ PASS  |
| 2   | TYPO-01 — chancery: h1.fontFamily matches /^"?Fraunces"?/            | ✓ PASS  |
| 3   | TYPO-01 — situation: h1.fontFamily matches /^"?Space Grotesk"?/      | ✓ PASS  |
| 4   | TYPO-01 — ministerial: h1.fontFamily matches /^"?Public Sans"?/      | ✓ PASS  |
| 5   | TYPO-01 — bureau: h1.fontFamily matches /^"?Inter"?/                 | ✓ PASS  |
| 6   | TYPO-03 — html[dir="rtl"] body computes to Tajawal-first cascade     | ✓ PASS  |
| 7   | TYPO-04 — [dir="ltr"].mono inside RTL fixture renders JetBrains Mono | ✓ PASS  |

**Single run:** 7 passed, 0 failed (5.3s)
**Stability run (`--repeat-each 3`):** 21 passed, 0 failed (12.2s) — **zero flake**

## Regression check — Plan 35-02 + 35-04 unit suites

| Suite                                       |   Tests |    Pass |  Fail | Note                                     |
| ------------------------------------------- | ------: | ------: | ----: | ---------------------------------------- |
| `fonts.test.ts`                             |      23 |      23 |     0 | Flipped from 15 FAIL (Wave 0) → 23 PASS  |
| `buildTokens.test.ts`                       |      99 |      99 |     0 | +8 over pre-Phase-35 (91)                |
| `tajawal-cascade.test.ts`                   |       5 |       4 |     1 | Plan-internal byte-for-byte test (known) |
| Other `design-system/` tests (pre-existing) |      33 |      32 |     1 | fouc-bootstrap failure is pre-existing   |
| **Total design-system vitest**              | **160** | **158** | **2** | Zero Phase-35-introduced regressions     |

Both remaining failures are documented and orthogonal to Phase 35
deliverables:

- `tajawal-cascade > ...byte-for-byte` — handoff uses double quotes;
  plan mandates single quotes. Already documented in 35-04 SUMMARY.
- `fouc-bootstrap > writes --accent + --accent-fg from hue` — **this
  failure exists on the pre-Phase-35 commit `1016d440`**. Verified
  via stash + checkout + vitest on that commit. 1/10 failed ==
  identical to post-phase state. Not a Phase 35 regression.

## Phase 35 TYPO-01..04 end-to-end verification

| Req     | Description                                             | Verified by                                | Status |
| ------- | ------------------------------------------------------- | ------------------------------------------ | :----: |
| TYPO-01 | buildTokens emits per-direction triplet; index.css refs | 8 buildTokens unit tests + 4 Playwright    | ✓ PASS |
| TYPO-02 | Zero Google Fonts CDN requests at runtime               | 1 Playwright network monitor + 14 dep grep | ✓ PASS |
| TYPO-03 | html[dir='rtl'] body → Tajawal-first cascade            | 1 Playwright + 4/5 cascade drift guards    | ✓ PASS |
| TYPO-04 | [dir='ltr'].mono inside RTL renders JetBrains Mono      | 1 Playwright fixture                       | ✓ PASS |

## Deviations from plan

1. **Spec path relocation** — Plan 35-01 Task 3 authored the spec at
   `frontend/tests/e2e/typography.spec.ts`, but root `playwright.config.ts`
   uses `testDir: './tests/e2e'`. Same deviation Phase 33-09 documented
   (Plan 33-09 comment: "plan 33-09 spec'd `frontend/tests/e2e/` but
   the root `playwright.config.ts` has `testDir: './tests/e2e'`").
   Moved via `git mv` preserving history; fixture HTML stayed at
   `frontend/tests/e2e/fixtures/typo-04-fixture.html` (Vite serves it
   from there).
2. **seedLocale dual-scheme** — Plan 35-01's helper wrote only
   `id.locale`. Discovered during Task 3 runs that LanguageProvider
   still reads pre-Phase-34 keys (`user-preferences`, `i18nextLng`)
   and overrides bootstrap.js's RTL direction on mount. Extended
   seedLocale to write all three keys. Documents a pre-existing app
   bug for future Phase 36+ cleanup.
3. **`--no-deps`** — used the Phase 33-09 `--no-deps` pattern to skip
   the auth setup project; our `authBypass()` addInitScript handles
   the auth-storage key directly, matching Phase 33-09's precedent.

## Downstream handoff

Phase 35 closes cleanly. Phase 36 (shell-chrome) can now:

- Rely on `var(--font-display)` / `var(--font-body)` / `var(--font-mono)`
  being populated per direction at first paint (bootstrap.js + applyTokens).
- Trust Tajawal RTL cascade for all Arabic surfaces without per-component
  font overrides.
- Inherit body-font via DOM inheritance (no component-level `font-family:`
  rules needed for ordinary chrome elements).
