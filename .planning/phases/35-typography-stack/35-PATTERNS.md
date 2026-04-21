# Phase 35: typography-stack — Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 9 (3 NEW + 6 MODIFIED)
**Analogs found:** 8 / 9 (one file — `frontend/src/fonts.ts` — has no exact side-effect-import analog in-repo; nearest is `main.tsx`'s `import './index.css'`; closest documentation is fontsource's getting-started pattern)

## File Classification

| New/Modified File                                       | Type   | Role                       | Data Flow                                                                                                      | Closest Analog                                                                                                                        | Match Quality                                           |
| ------------------------------------------------------- | ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `frontend/src/fonts.ts`                                 | NEW    | boot-side-effect module    | build-time: fontsource CSS imports → `@font-face` injected at CSS parse → `:root` `--font-*` vars consume them | `frontend/src/main.tsx:3` (`import './index.css'`) + fontsource docs                                                                  | approximate (no in-repo side-effect-only module exists) |
| `frontend/tests/unit/design-system/fonts.test.ts`       | NEW    | unit test                  | static-analysis: read `package.json` + `fonts.ts`, assert 8 deps + 16 imports                                  | `frontend/tests/unit/design-system/fouc-bootstrap.test.ts`                                                                            | exact (same "read file → regex-grep → assert" pattern)  |
| `frontend/tests/e2e/typography.spec.ts`                 | NEW    | Playwright E2E             | runtime: `page.on('request')` network capture + `getComputedStyle` per direction × locale                      | `frontend/tests/e2e/rtl-switching.spec.ts` (locale seeding) + `frontend/tests/e2e/ai-degradation.spec.ts` (`page.route` interception) | role-match (combine two analogs)                        |
| `frontend/src/design-system/tokens/buildTokens.ts`      | MODIFY | pure token builder         | input `{dir, mode, hue, density}` → `TokenSet` (flat `Record<string, string>`)                                 | self (extend existing function)                                                                                                       | exact                                                   |
| `frontend/src/design-system/tokens/directions.ts`       | MODIFY | direction palette literals | const object → consumed by `buildTokens` palette lookup                                                        | self (extend same file with `FONTS` const)                                                                                            | exact                                                   |
| `frontend/src/design-system/tokens/types.ts`            | MODIFY | public types               | type-only                                                                                                      | self                                                                                                                                  | exact                                                   |
| `frontend/tests/unit/design-system/buildTokens.test.ts` | MODIFY | unit test suite            | assertion matrix over `buildTokens` output                                                                     | self (add 12 assertions)                                                                                                              | exact                                                   |
| `frontend/src/index.css`                                | MODIFY | global CSS                 | static CSS → `:root` vars + `@theme` bindings + RTL cascade                                                    | self (Phase 33 established the `@theme` pattern)                                                                                      | exact                                                   |
| `frontend/src/main.tsx`                                 | MODIFY | app entry                  | first-import ordering                                                                                          | self (line 3: `import './index.css'`)                                                                                                 | exact                                                   |
| `frontend/index.html`                                   | MODIFY | HTML shell                 | DELETE 6 `<link preload>` + 6 `<noscript><link>` + 2 `<link preconnect>` = 14 lines                            | self                                                                                                                                  | exact                                                   |
| `frontend/package.json`                                 | MODIFY | deps manifest              | `pnpm add` adds 8 deps                                                                                         | self                                                                                                                                  | exact                                                   |

---

## Pattern Assignments

### `frontend/src/fonts.ts` (NEW — boot-side-effect module, D-05)

**Primary analog (in-repo):** `frontend/src/main.tsx:3` — the existing "CSS import as side effect to inject rules into the cascade" pattern. No pure-side-effect-only module exists in the repo today; `fonts.ts` introduces the pattern.

**External analog (fontsource getting-started docs — `[CITED]` in RESEARCH §Pattern 1):** each `@fontsource*` CSS import is a side effect.

**Canonical implementation pattern** (RESEARCH §Pattern 1 lines 207-223, already verified byte-correct against tarball sub-paths):

```typescript
// frontend/src/fonts.ts
// Phase 35 — self-hosted font pipeline (TYPO-02). Side-effect imports.

// Variable-axis (wght only, per D-04) — 5 packages
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/public-sans/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'

// Classic per-weight — 3 packages (4+2+3 = 9 weight files)
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
```

**Landmines for the planner:**

- **Ordering matters (Pitfall 2):** `main.tsx` MUST do `import './fonts'` BEFORE `import './index.css'`. Inverting causes FOUT on first paint.
- **No default export.** Pure side effect. Consumers write `import './fonts'` not `import fonts from './fonts'`.
- **Pin versions** via `^5.2.x` bumps for each package (see §Shared Patterns — Package Matrix). `@fontsource-variable/fraunces` ships 5 axis files (`opsz.css`, `standard.css`, `wonk.css`, `soft.css`, `full.css`) — stick with `wght.css` per D-04.

---

### `frontend/tests/unit/design-system/fonts.test.ts` (NEW — unit test)

**Analog:** `frontend/tests/unit/design-system/fouc-bootstrap.test.ts` (exact match — same "read a source file via `readFileSync`, regex-grep, assert" pattern used for palette drift).

**Imports pattern** (lines 16-21 of fouc-bootstrap.test.ts):

```typescript
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { PALETTES } from '@/design-system/tokens/directions'
import type { Direction, Mode } from '@/design-system/tokens/types'
```

**File-read + regex-grep pattern** (lines 34 + 61-82):

```typescript
const BOOTSTRAP_PATH = resolve(__dirname, '../../../public/bootstrap.js')

describe('FOUC bootstrap palette drift guard', () => {
  const source = readFileSync(BOOTSTRAP_PATH, 'utf8')

  it('bootstrap.js exists and is non-empty', () => {
    expect(source.length).toBeGreaterThan(0)
  })

  it.each(DIRECTIONS.flatMap((dir) => MODES.map((mode) => [dir, mode] as const)))(
    'palette %s.%s matches directions.ts',
    (dir, mode) => {
      /* assertions */
    },
  )
})
```

**Adapt for Phase 35 (verify 8 deps present + 16 CSS imports resolve):**

- Replace `BOOTSTRAP_PATH` with path to `frontend/package.json` AND `frontend/src/fonts.ts`
- For each of the 8 required packages (table below), assert `packageJson.dependencies[name]` matches `^5.x`
- For each of 16 expected imports (`@fontsource-variable/inter/wght.css` etc.), assert the source of `fonts.ts` contains the literal import string
- Do NOT use `require.resolve()` — not needed; string grep is sufficient and avoids node module-resolution flakiness in vitest

**RESEARCH also proposes** a `tajawal-cascade.test.ts` sibling test (read `index.css`, grep for the D-07 48-line block byte-match). Planner decides whether to merge into `fonts.test.ts` or keep separate — precedent (`fouc-bootstrap.test.ts`) is "one file per drift guard".

---

### `frontend/tests/e2e/typography.spec.ts` (NEW — Playwright E2E)

**Analog 1 — locale + auth seeding** (`frontend/tests/e2e/rtl-switching.spec.ts` lines 1-20, exact pattern):

```typescript
import { test, expect, type Page } from '@playwright/test'

async function authBypass(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const payload = {
      state: {
        user: { id: 'test-user', email: 'test@example.com', name: 'Test' },
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

async function seedLocale(page: Page, locale: 'en' | 'ar'): Promise<void> {
  await page.addInitScript((l: 'en' | 'ar'): void => {
    localStorage.setItem('id.locale', l)
  }, locale)
}
```

**Adapt:** add `seedDirection(page, 'chancery' | 'situation' | 'ministerial' | 'bureau')` that writes `id.dir` to match seedLocale's shape. Use both in every test.

**Analog 2 — network interception** (`frontend/tests/e2e/ai-degradation.spec.ts` lines 30-49):

```typescript
await page.route('**/api/intake/ai/health', (route) => {
  route.fulfill({ status: 503, body: JSON.stringify({ status: 'unavailable' }) })
})
```

**Adapt for TYPO-02 "zero Google Fonts requests":** use `page.on('request')` (not `route.fulfill`) to COLLECT all requests, then assert the collection is empty of any `fonts.googleapis.com` / `fonts.gstatic.com` URL. Canonical recipe:

```typescript
test('TYPO-02 no google fonts CDN calls', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (req) => requests.push(req.url()))
  await page.goto('/responsive-demo')
  await page.waitForLoadState('networkidle')
  expect(requests.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([])
})
```

**Analog 3 — `getComputedStyle` asserts** (widespread; e.g. `frontend/tests/e2e/dossier-rtl-complete.spec.ts`, `bilingual-support-switch-locale.spec.ts`). Canonical shape:

```typescript
const fontFamily = await page.evaluate(() => {
  const el = document.querySelector('h1')
  return el ? window.getComputedStyle(el).fontFamily : ''
})
expect(fontFamily).toMatch(/^"?Fraunces"?/)
```

**TYPO-04 fixture** — per RESEARCH §Validation Architecture lines 582-598, create `frontend/e2e/fixtures/typo-04-fixture.html` with:

```html
<!doctype html>
<html dir="rtl">
  <head>
    <link rel="stylesheet" href="/src/index.css" />
  </head>
  <body>
    <p>هذا نص عربي</p>
    <span class="mono" dir="ltr" data-testid="typo04-probe">⌘K</span>
    <kbd dir="ltr" data-testid="typo04-kbd">T−3</kbd>
  </body>
</html>
```

Assert both probes `getComputedStyle().fontFamily.startsWith("JetBrains Mono")`.

**Landmines:**

- No `frontend/playwright.config.ts` (per Phase 34 outcome — RESEARCH §Test Framework). Match how rtl-switching.spec.ts runs today (likely via root `pnpm test:e2e:sc`).
- Per CLAUDE.md §"Arabic RTL Support": `dir="rtl"` is set on `<html>` by Phase 34's bootstrap when `id.locale=ar`. Don't set it manually in the test; seed `id.locale` instead.

---

### `frontend/src/design-system/tokens/buildTokens.ts` (MODIFY — extend with 3 font keys)

**Analog:** self. The existing function returns a flat `Record<string,string>`; D-01 adds 3 new entries.

**Current pattern — destructuring + palette lookup** (lines 26-32):

```typescript
export const buildTokens = ({ direction, mode, hue, density }: BuildInput): TokenSet => {
  const palette = PALETTES[direction][mode]
  const den = DENSITIES[density]
  const isDark = mode === 'dark'
  const h = hue
  const hRisk = (h + 55) % 360

  return {
    '--bg': palette.bg,
    // ...
  }
}
```

**Extension pattern (D-01)** — per RESEARCH §Pattern 2 lines 276-285:

```typescript
import { FONTS } from './directions' // NEW import

export const buildTokens = ({ direction, mode, hue, density }: BuildInput): TokenSet => {
  const palette = PALETTES[direction][mode]
  const fonts = FONTS[direction] // NEW — direction-keyed, NOT mode-keyed
  const den = DENSITIES[density]
  // ...existing OKLCH math unchanged...

  return {
    // ...existing 38 keys unchanged...
    '--shadow-card': '0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)',

    // Phase 35 — font-family triplet (direction-driven)
    '--font-display': fonts.display,
    '--font-body': fonts.body,
    '--font-mono': fonts.mono,
  }
}
```

**Landmine:** The keys MUST be added to the test's `REQUIRED_KEYS` list (line 23 of buildTokens.test.ts) at the same time — otherwise the 72-case matrix loop will NOT assert on them but will still pass (silently missing coverage).

---

### `frontend/src/design-system/tokens/directions.ts` (MODIFY — add `FONTS` const + export)

**Analog:** self — this file already exports `PALETTES: Record<Direction, DirectionPalette>`. `FONTS` mirrors the shape (keyed by `Direction`, value = triplet).

**Existing pattern** (lines 17-19):

```typescript
import type { Direction, DirectionPalette } from './types'

export const PALETTES: Record<Direction, DirectionPalette> = {
  chancery: {
    light: {
      /* ... */
    },
    dark: {
      /* ... */
    },
  },
  // ...
}
```

**Append (per RESEARCH §Pattern 2 lines 251-272):**

```typescript
import type { Direction, DirectionFonts } from './types' // +DirectionFonts

export const FONTS: Record<Direction, DirectionFonts> = {
  chancery: {
    display: "'Fraunces', serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  situation: {
    display: "'Space Grotesk', system-ui, sans-serif",
    body: "'IBM Plex Sans', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  ministerial: {
    display: "'Public Sans', system-ui, sans-serif",
    body: "'Public Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  bureau: {
    display: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
} as const
```

**Landmine:** D-06 says Tajawal is applied via CSS cascade (D-07), NOT via the `FONTS` map. Do NOT add a 5th "arabic" direction; do NOT branch on locale here.

---

### `frontend/src/design-system/tokens/types.ts` (MODIFY — add `DirectionFonts` interface)

**Analog:** self — existing `DirectionModePalette` + `DirectionPalette` interfaces (lines 35-52) exemplify the pattern.

**Existing pattern:**

```typescript
export interface DirectionModePalette {
  bg: string
  surface: string
  // ...
  radius: { sm: string; base: string; lg: string }
}

export interface DirectionPalette {
  light: DirectionModePalette
  dark: DirectionModePalette
}
```

**Append:**

```typescript
/** Phase 35 — per-direction font triplet (direction-invariant across modes) */
export interface DirectionFonts {
  display: string
  body: string
  mono: string
}
```

**Landmine:** Do NOT extend `TokenSet` itself — it's already `Record<string, string>`. Adding string keys is contract-compatible.

---

### `frontend/tests/unit/design-system/buildTokens.test.ts` (MODIFY — +12 font assertions)

**Analog:** self — line 23's `REQUIRED_KEYS` array + lines 96-128's nested loop already enforce "all required keys present per case". Add 3 entries to `REQUIRED_KEYS`; the existing loop emits 72×3 = 216 existence checks for free.

**Add to `REQUIRED_KEYS` array** (between lines 69-70):

```typescript
  // Derived
  '--field-radius',
  '--focus-ring',
  '--shadow-drawer',
  '--shadow-card',
  // Phase 35 — fonts (direction-driven, mode/hue/density-invariant)
  '--font-display',
  '--font-body',
  '--font-mono',
] as const
```

**Add a per-direction literal-assertion block** mirroring the existing radius `describe` block (lines 258-275):

```typescript
describe('buildTokens — Phase 35 per-direction font triplet', () => {
  const cases: Array<[Direction, { display: string; body: string; mono: string }]> = [
    [
      'chancery',
      {
        display: "'Fraunces', serif",
        body: "'Inter', system-ui, sans-serif",
        mono: "'JetBrains Mono', ui-monospace, monospace",
      },
    ],
    [
      'situation',
      {
        display: "'Space Grotesk', system-ui, sans-serif",
        body: "'IBM Plex Sans', system-ui, sans-serif",
        mono: "'IBM Plex Mono', ui-monospace, monospace",
      },
    ],
    [
      'ministerial',
      {
        display: "'Public Sans', system-ui, sans-serif",
        body: "'Public Sans', system-ui, sans-serif",
        mono: "'JetBrains Mono', ui-monospace, monospace",
      },
    ],
    [
      'bureau',
      {
        display: "'Inter', system-ui, sans-serif",
        body: "'Inter', system-ui, sans-serif",
        mono: "'JetBrains Mono', ui-monospace, monospace",
      },
    ],
  ]

  for (const [direction, expected] of cases) {
    it(`emits correct font triplet for ${direction}`, () => {
      const tokens = buildTokens({ direction, mode: 'light', hue: 22, density: 'comfortable' })
      expect(tokens['--font-display']).toBe(expected.display)
      expect(tokens['--font-body']).toBe(expected.body)
      expect(tokens['--font-mono']).toBe(expected.mono)
    })
  }
})
```

**Count check:** 4 `it()` blocks × 3 assertions = 12 literal cases, matching RESEARCH's TYPO-01 test promise.

---

### `frontend/src/index.css` (MODIFY — two separate mutations, two separate commits recommended)

**Analog:** self. Phase 33 established the `@theme` pattern already present in this file. Phase 35 extends it + appends RTL cascade.

**Mutation A — 13 legacy `font-family:` rewrites + 5 `:root` var deletions** (RESEARCH §"Line-by-line `index.css` mutation map (D-02)" lines 462-482 gives the exact line-by-line instructions). Summary:

| Lines                   | Action                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 150-154                 | DELETE 5 `:root` declarations (`--display-family`, `--display-weight`, `--text-family`, `--text-family-rtl`, `--text-weight`) |
| 211, 216, 259, 286, 328 | `var(--text-family)` → `var(--font-body)`                                                                                     |
| 238, 302, 319           | `var(--display-family)` → `var(--font-display)`                                                                               |
| 266                     | hardcoded `ui-monospace, SFMono-Regular...` stack → `var(--font-mono)`                                                        |
| 291-295 (block)         | DELETE entire `html[dir='rtl']` body font-family block (D-07 cascade replaces)                                                |
| 310-314 (block)         | DELETE `html[dir='rtl'] h1..h6` block                                                                                         |
| 323-325 (block)         | DELETE `html[dir='rtl'] .font-display` block                                                                                  |
| 332-334 (block)         | DELETE `html[dir='rtl'] .font-text` block                                                                                     |

**Mutation B — `@theme` extension + 48-line Tajawal cascade append** (RESEARCH §Pattern 3 + §Code Examples lines 391-458):

```css
@theme {
  /* ...existing Phase 33 color/shadow tokens... */

  /* Phase 35 — font-family utilities (resolves to `font-display`/`font-body`/`font-mono` utilities). */
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);
}
```

Then append (byte-for-byte per D-07; source `/tmp/inteldossier-handoff/inteldossier/project/src/app.css:129-176`):

```css
/* ============ Arabic typography override: Tajawal ============ */
html[dir='rtl'],
html[dir='rtl'] body {
  font-family: 'Tajawal', 'Inter', system-ui, sans-serif;
}
html[dir='rtl'] * {
  font-family: 'Tajawal', 'Inter', system-ui, sans-serif;
}
html[dir='rtl'] [style*='--font-display'] {
  font-family: 'Tajawal', system-ui, sans-serif !important;
}
/* …48 lines total — full block in RESEARCH.md §Code Examples lines 395-458… */
html[dir='rtl'] [dir='ltr'].mono,
html[dir='rtl'] kbd[dir='ltr'] {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
/* …chip/label/tag block with `!important`… */
html[dir='rtl'] .tb-locale-btn,
.tb-locale-btn[data-lang='ar'] {
  font-family: 'Tajawal', system-ui, sans-serif;
}
```

**Landmines (CRITICAL):**

- **Pitfall 1 / Assumption A1 (HIGH severity):** The `@theme` self-reference `--font-display: var(--font-display)` pattern is ANALOGOUS to Phase 33-06's `--shadow-card: var(--shadow-card)` crash commit `e5fcacec`. RESEARCH flags this as UNVERIFIED — planner MUST include a Wave 0 smoke step: run `pnpm -C frontend dev` after the `@theme` edit; if it crashes with "… is not a function", fall back to distinct names (`--font-family-display: var(--font-display)`) OR inline literal fallbacks on LHS and rely on `applyTokens()` to override at runtime (matches Phase 33-06's shadow-pattern workaround).
- **Preserve `!important` in the chip/label/tag block verbatim (Pitfall 3).** Future phases that add font-family rules to `.chip`/`.kpi-label`/etc. must not add competing `!important` — otherwise AR breaks in Phase 43 QA.
- **TYPO-03 grep-verifiability:** The 48-line block must match `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` byte-for-byte (RESEARCH proposes a drift-guard test — `tajawal-cascade.test.ts` — that `readFileSync`s both files and `expect(actual.includes(expected)).toBe(true)`).

---

### `frontend/src/main.tsx` (MODIFY — prepend `import './fonts'`)

**Analog:** self, line 3.

**Current pattern** (lines 1-4):

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
```

**Replace with** (per RESEARCH §Pattern 1 lines 226-231):

```typescript
import './fonts' // Phase 35 — MUST be first (Pitfall 2)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
```

**Landmine:** `./fonts` BEFORE `./index.css` is not negotiable. If reviewers suggest "group all CSS imports together", reject — the `@font-face` declarations must reach the cascade before `index.css` evaluates its `font-family: var(--font-body)` references.

---

### `frontend/index.html` (MODIFY — DELETE all Google Fonts links + preconnects)

**Analog:** self, lines 11-57.

**DELETE exactly these 14 lines:**

- Line 11 (`<!-- Font preloading: preconnect + load critical fonts without render-blocking -->` comment)
- Line 12 (`<link rel="preconnect" href="https://fonts.googleapis.com" />`)
- Line 13 (`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`)
- Line 14 (`<!-- Critical: Readex Pro for Arabic RTL text -->` comment)
- Lines 15-21 (Readex Pro `<link preload>` + `<noscript>`)
- Line 22 (`<!-- Non-critical fonts loaded async -->` comment)
- Lines 23-29 (Outfit)
- Lines 30-36 (Kumbh Sans)
- Lines 37-43 (Hedvig Letters Serif)
- Lines 44-50 (Poppins)
- Lines 51-57 (Plus Jakarta Sans)

**Keep (lines 1-10, 58-69):** `<!doctype>`, meta viewport, cache-busting meta, `<title>`, the Phase 33-03 bootstrap script (`<script src="/bootstrap.js" blocking="render">`), and the `<div id="root">` + main script.

**Landmine:** Scope addition from RESEARCH §Pitfall 4 — CONTEXT.md did not anticipate these 14 lines exist. Planner must list this as a separate plan action so it's not silently skipped. TYPO-02 E2E fails without this deletion.

---

### `frontend/package.json` (MODIFY — add 8 deps)

**Analog:** self.

**Add these 8 entries to `dependencies`** (versions pinned per RESEARCH §Standard Stack, verified against `registry.npmjs.org` on 2026-04-22):

```json
"@fontsource-variable/inter": "^5.2.8",
"@fontsource-variable/public-sans": "^5.2.7",
"@fontsource-variable/space-grotesk": "^5.2.10",
"@fontsource-variable/fraunces": "^5.2.9",
"@fontsource-variable/jetbrains-mono": "^5.2.8",
"@fontsource/ibm-plex-sans": "^5.2.8",
"@fontsource/ibm-plex-mono": "^5.2.7",
"@fontsource/tajawal": "^5.2.7"
```

**Canonical install command** (use this verbatim — RESEARCH lines 98-107):

```bash
pnpm -C frontend add \
  @fontsource-variable/inter@^5.2.8 \
  @fontsource-variable/public-sans@^5.2.7 \
  @fontsource-variable/space-grotesk@^5.2.10 \
  @fontsource-variable/fraunces@^5.2.9 \
  @fontsource-variable/jetbrains-mono@^5.2.8 \
  @fontsource/ibm-plex-sans@^5.2.8 \
  @fontsource/ibm-plex-mono@^5.2.7 \
  @fontsource/tajawal@^5.2.7
```

**Landmine:** Per project convention (CLAUDE.md §"Commands"), run `pnpm add` inside `frontend/` workspace, never at repo root — keeps the Turborepo lockfile scoped correctly.

---

## Shared Patterns

### Shared — Direction-driven record lookup (applied to 2 files)

**Source:** `frontend/src/design-system/tokens/directions.ts` lines 17-19 + `buildTokens.ts` line 27.
**Apply to:** `directions.ts` (`FONTS` const) + `buildTokens.ts` (`const fonts = FONTS[direction]`).
**Rule:** All direction-keyed constants use `Record<Direction, X>` shape with keys in this fixed order: `chancery, situation, ministerial, bureau`. `buildTokens` looks up with `MAP[direction]` — never switch/case.

### Shared — Pure builder + imperative applier separation

**Source:** `buildTokens.ts` (pure) + `applyTokens.ts` (DOM writer). Phase 35 does NOT modify `applyTokens.ts` — it already iterates every key in the returned `TokenSet`, so adding 3 string-valued keys flows through automatically.
**Apply to:** Mental model for the planner — no `applyTokens.ts` change needed; TYPO-01's "`:root` carries the 3 font vars" is achieved for free.

### Shared — Drift-guard test pattern

**Source:** `frontend/tests/unit/design-system/fouc-bootstrap.test.ts` (compares two sources of truth).
**Apply to:** `fonts.test.ts` (compares `package.json` ↔ `fonts.ts`) AND proposed `tajawal-cascade.test.ts` (compares `index.css` ↔ handoff `app.css`).
**Template:** `readFileSync` + regex-grep + `it.each([...])` parameterized assertion.

### Shared — E2E auth + locale + direction seeding

**Source:** `frontend/tests/e2e/rtl-switching.spec.ts` lines 3-20.
**Apply to:** `typography.spec.ts`. Define 3 helpers: `authBypass`, `seedLocale(page, 'en'|'ar')`, `seedDirection(page, 'chancery'|'situation'|'ministerial'|'bureau')`. Every test case = `auth × locale × direction` seeded pre-navigation.

### Shared — Network-request capture (Playwright)

**Source:** `frontend/tests/e2e/ai-degradation.spec.ts` lines 30-49 shows `page.route` for fulfillment; the TYPO-02 test needs `page.on('request')` for observation. Both ship in `@playwright/test` — no new helper needed.
**Apply to:** `typography.spec.ts` TYPO-02 assertion — collect request URLs, filter for `fonts.(googleapis|gstatic).com`, assert empty.

### Shared — Phase 33-06 `@theme` self-reference crash avoidance

**Source:** STATE.md lore / Phase 33-06 commit `e5fcacec`.
**Apply to:** `index.css` `@theme` edit. Pre-run smoke test (`pnpm dev`); on crash, use distinct names OR inline literals + runtime override.
**Severity:** HIGH — could block entire phase if triggered; fix is 5 minutes once identified.

### Shared — Package matrix (canonical versions)

| Package                               | Version   | Import path(s)                                 |
| ------------------------------------- | --------- | ---------------------------------------------- |
| `@fontsource-variable/inter`          | `^5.2.8`  | `/wght.css`                                    |
| `@fontsource-variable/public-sans`    | `^5.2.7`  | `/wght.css`                                    |
| `@fontsource-variable/space-grotesk`  | `^5.2.10` | `/wght.css`                                    |
| `@fontsource-variable/fraunces`       | `^5.2.9`  | `/wght.css`                                    |
| `@fontsource-variable/jetbrains-mono` | `^5.2.8`  | `/wght.css`                                    |
| `@fontsource/ibm-plex-sans`           | `^5.2.8`  | `/400.css`, `/500.css`, `/600.css`, `/700.css` |
| `@fontsource/ibm-plex-mono`           | `^5.2.7`  | `/400.css`, `/500.css`                         |
| `@fontsource/tajawal`                 | `^5.2.7`  | `/400.css`, `/500.css`, `/700.css`             |

Total: **16 CSS imports** across 8 packages in `fonts.ts`.

---

## No Analog Found

| File                    | Role                    | Data Flow                    | Reason                                                                                                                                                                                                                                                                               |
| ----------------------- | ----------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/fonts.ts` | boot-side-effect module | side-effect CSS imports only | No pure-side-effect-import module exists in-repo today. Nearest is `main.tsx:3` (`import './index.css'`) but that's a line, not a module. Phase 35 INTRODUCES the pattern — fontsource getting-started docs are the canonical external reference (`[CITED]` in RESEARCH §Pattern 1). |

---

## Metadata

**Analog search scope:**

- `frontend/src/design-system/tokens/` (token-engine analogs for D-01)
- `frontend/tests/unit/design-system/` (drift-guard test pattern)
- `frontend/tests/e2e/` (Playwright auth/locale seeding + network interception)
- `frontend/src/main.tsx`, `frontend/index.html`, `frontend/package.json` (self-modify analogs)

**Files read (pattern extraction):** 8

- `frontend/src/design-system/tokens/buildTokens.ts`
- `frontend/src/design-system/tokens/directions.ts`
- `frontend/src/design-system/tokens/types.ts`
- `frontend/tests/unit/design-system/buildTokens.test.ts`
- `frontend/tests/unit/design-system/fouc-bootstrap.test.ts`
- `frontend/tests/e2e/rtl-switching.spec.ts`
- `frontend/tests/e2e/ai-degradation.spec.ts` (lines 1-60 only — network interception pattern)
- `frontend/src/main.tsx`
- `frontend/index.html`

**Pattern extraction date:** 2026-04-21
**Phase:** 35-typography-stack
