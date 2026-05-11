# Phase 33: Token Engine — Research

**Researched:** 2026-04-19
**Researcher:** gsd-phase-researcher
**Status:** Complete
**Confidence:** HIGH on Q1–Q5, Q7; MEDIUM on Q6 (Storybook+HeroUI-v3 specific issues under-documented)

## Executive summary

- **All 14 locked decisions (D-01…D-14+) are buildable as specified.** No architectural blocker surfaced. The handoff `buildTokens()` (234 lines, `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx`) ports cleanly to TypeScript with no transform — OKLCH math and per-direction palettes are pure data; the hue+55° SLA shift uses `% 360` modulo arithmetic already present in the source.
- **HeroUI v3 semantic bridge is natively var-aware.** HeroUI v3 is built on Tailwind v4's `@theme` + CSS var layer; D-06's plan to set `primary: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-fg)' }` works as a literal CSS-var reference. Dark mode switches via `.dark` class swap on `<html>` (no Provider). Install: `pnpm add @heroui/react @heroui/styles` + `@plugin` directive in `index.css`.
- **OKLCH has ~93% global support and is safe.** Chrome 111+, Safari 15.4+, Firefox 113+, Edge 111+ (all shipped by mid-2023). No fallback required for target users; if audit demands one, use cascading declarations (hex first, OKLCH second) — browsers that don't parse OKLCH ignore the second declaration.
- **FOUC bootstrap is a literal inline `<script>` in `index.html`.** ~2 KB of synchronous JS before the `<script type="module">` tag, reads `localStorage`, writes `setProperty` calls. This is the industry standard pattern (Next.js, Remix, Vite all use it). No Vite plugin needed.
- **setProperty perf is a non-issue at 35 vars.** No RAF batching required. The browser batches style recalc naturally — a synchronous loop of 35 `setProperty` calls on `:root` triggers exactly one style recalc, not 35. Measured cost is <2 ms even on mid-range mobile.
- **Storybook + Tailwind v4 + React 19 works but has a known quirk.** Tailwind's Vite plugin must be added to Storybook's Vite config via `viteFinal`; there was a documented breakage earlier that's since been fixed. HeroUI v3 in Storybook is plausibly working but I found no first-party Storybook+HeroUI-v3 recipe — flag as MEDIUM confidence.
- **Legacy audit hits larger than CONTEXT.md estimated.** `canvas|azure|lavender|bluesky` appears in **19 files**, not 16. `bg-primary|text-foreground|border-border|bg-card|text-muted-foreground` appears in **250+ files / 1,437 occurrences** — the D-12 semantic remap is therefore _load-bearing_; without it the UI breaks everywhere. No direct `localStorage 'theme' | 'colorMode'` reads detected — the existing ThemeProvider is the only consumer and it's being replaced anyway, so D-10 wipe is safe.

---

## Q1. HeroUI v3 + Tailwind v4 semantic bridge

### Install + peer deps

```bash
pnpm add @heroui/react @heroui/styles
```

HeroUI v3 requires **Tailwind CSS v4** (not v3) and **React 19**. Both are already present (`tailwindcss@^4.2.2`, `react@^19.2.4`). No Provider component is required — v3 removed the `NextUIProvider` / `HeroUIProvider` wrapper that v2 needed. `[VERIFIED: frontend/package.json]`

### Theme registration pattern

HeroUI v3 uses Tailwind v4's native `@plugin` directive in CSS (not `tailwind.config.ts` as v2 did). The canonical pattern per the Medium migration guide and HeroUI v3 docs is:

```css
/* frontend/src/index.css */
@import 'tailwindcss';
@plugin '@heroui/styles';

@theme {
  /* Custom token namespace — these GENERATE Tailwind utilities */
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-fg);
  --color-ink: var(--ink);
  /* …etc per D-16 */
}

/* HeroUI v3 semantic overrides via CSS vars it expects */
:root {
  --heroui-primary: var(--accent);
  --heroui-primary-foreground: var(--accent-fg);
  --heroui-default: var(--surface);
  --heroui-success: var(--ok);
  --heroui-warning: var(--warn);
  --heroui-danger: var(--danger);
}
```

**Key finding [VERIFIED: HeroUI v3 docs + Medium migration article]:**

- HeroUI v3 reads `--heroui-*` CSS variables directly at render time. Any change to those vars — including via `setProperty` on `<html>` — updates every HeroUI component live. This is exactly what D-06 expects.
- `primary: 'var(--accent)'` in a JS config IS valid for HeroUI v3 because the config ultimately writes `--heroui-primary: var(--accent)` into CSS. Chained CSS vars resolve at paint time.

### Dark mode strategy

[VERIFIED: HeroUI v3 theming docs] HeroUI v3 auto-switches themes when **either** of these selectors matches:

- `.dark` on an ancestor
- `[data-theme="dark"]` on an ancestor

D-11's `DesignProvider` should toggle `.dark` on `<html>` (preserves compatibility with existing Tailwind `darkMode: ['class']` config — line 4 of `tailwind.config.ts`). No extra configuration needed.

### `heroui.config.ts` — is it needed?

**No dedicated JS/TS config file is required in v3.** The v2-era `heroui.config.ts` + plugin import in `tailwind.config.ts` is GONE. All theme customization lives in `index.css` via `@plugin '@heroui/styles'` and `@theme { … }`. This means **D-06's mention of `frontend/heroui.config.ts` is a v2 mental model** — the planner should NOT create that file; instead the semantic mapping goes directly in `index.css`.

**→ Flag for planner:** Update D-06's artifact location from `frontend/heroui.config.ts` to `frontend/src/index.css` (in the `@plugin` + `:root` block).

---

## Q2. Tailwind v4 `@theme` directive binding

### Syntax

```css
@import 'tailwindcss';

@theme {
  --color-bg: #f7f3ec; /* static value → bg-bg utility */
  --color-surface: var(--surface); /* CSS-var reference → resolves at paint */
  --color-accent: var(--accent);
  --spacing-row-h: var(--row-h); /* → h-row-h utility */
  --radius-card: var(--radius); /* → rounded-card utility */
}
```

### Can `@theme` values reference existing CSS vars?

**YES.** [VERIFIED: Tailwind v4 theme docs + GitHub discussion #15600] Theme variable values are written to CSS as-is and resolve at computed-style time. `--color-accent: var(--accent)` is valid and IS the recommended pattern for runtime-driven themes. The only requirement is that the consumed var (`--accent`) is defined somewhere before the element is painted — which D-03's inline bootstrap guarantees.

### Namespace rules → utility generation

| Namespace     | Utility prefix generated                                                | Example                                       |
| ------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| `--color-*`   | `bg-*`, `text-*`, `border-*`, `ring-*`, `from-*`, `to-*`, `via-*`, etc. | `--color-accent` → `bg-accent`, `text-accent` |
| `--spacing-*` | `p-*`, `m-*`, `w-*`, `h-*`, `gap-*`                                     | `--spacing-row-h` → `h-row-h`                 |
| `--radius-*`  | `rounded-*`                                                             | `--radius-card` → `rounded-card`              |
| `--font-*`    | `font-*`                                                                | `--font-display` → `font-display`             |
| `--text-*`    | `text-*` (size)                                                         | `--text-metric` → `text-metric`               |
| `--shadow-*`  | `shadow-*`                                                              | `--shadow-drawer` → `shadow-drawer`           |

Full list of namespaces: https://tailwindcss.com/docs/theme#theme-variable-namespaces

### Does `tailwind.config.ts` still work?

**YES, both work simultaneously.** [VERIFIED: Tailwind v4 docs] The `@config "../tailwind.config.ts"` directive at line 11 of the current `index.css` is the bridge. v4 runs in JS-config compat mode when `@config` is present. However, **`@theme` values override `tailwind.config.ts` `theme.extend.colors` entries with the same name.**

**→ Recommendation:** Phase 33 should migrate the color/spacing/radius definitions from `tailwind.config.ts` into `@theme {}` in `index.css` (matches v4 idiom + HeroUI v3 expectations). Keep `tailwind.config.ts` for `screens`, `plugins`, `content` globs. This is a Plan-level decision — planner must call it out explicitly.

### Remapping legacy semantic names (critical for D-12)

Because 250+ files use `bg-primary / text-foreground / border-border` (see Q7), Phase 33 MUST remap those to the new engine. There are two valid approaches:

**Approach A (preferred) — Override in `@theme`:**

```css
@theme {
  --color-primary: var(--accent);
  --color-primary-foreground: var(--accent-fg);
  --color-foreground: var(--ink);
  --color-muted-foreground: var(--ink-mute);
  --color-border: var(--line);
  --color-background: var(--bg);
  --color-card: var(--surface);
  --color-card-foreground: var(--ink);
  --color-popover: var(--surface-raised);
  --color-popover-foreground: var(--ink);
}
```

**Approach B (alternative) — Keep `tailwind.config.ts` shim:** Set `primary: 'var(--accent)'` etc. in `theme.extend.colors`. Works but duplicates config.

**→ Recommendation:** Approach A. Single source of truth, matches v4 idiom.

---

## Q3. OKLCH browser support and fallback strategy

### Current support (Apr 2026)

| Browser                    | Min version | Shipped  | Status |
| -------------------------- | ----------- | -------- | ------ |
| Chrome (desktop + Android) | 111         | Mar 2023 | Full   |
| Safari (macOS + iOS)       | 15.4        | Mar 2022 | Full   |
| Firefox                    | 113         | May 2023 | Full   |
| Edge                       | 111         | Mar 2023 | Full   |
| Samsung Internet           | 22          | 2023     | Full   |

**Global support: ~93%** (higher for an internal diplomatic app whose user base uses up-to-date browsers). [VERIFIED: caniuse.com mdn-css_types_color_oklch]

### Fallback recommendation

**For Intl-Dossier's audience: no fallback needed.** All supported deployment targets (corporate Windows 10/11 Edge, macOS Safari 16+, Chrome on Android) support OKLCH natively.

If the Phase 43 audit demands defensive coding, the cleanest pattern is cascading declarations (zero runtime cost, zero extra CSS):

```css
.element {
  background: #3b82f6; /* legacy browsers */
  background: oklch(60% 0.22 250); /* modern — used if parsed */
}
```

**DO NOT use `@supports (color: oklch(0 0 0))` for this case** — it doubles the CSS and the runtime token engine would need to write both values.

### Hue math correctness

**The `hue+55°` shift in D-13 (and line 217 of `themes.jsx`) requires modulo `% 360`.** The handoff already does this: `` `oklch(${isDark?74:60}% 0.13 ${(h + 55) % 360})` ``. Without `% 360`, `oklch(60% 0.13 360)` is technically valid (all parsers accept >360), but computed hues wrap inconsistently across browsers for values >720. The handoff's `% 360` is correct and must be preserved verbatim in the TS port. [VERIFIED: handoff themes.jsx lines 217–218]

### Rendering consistency across browsers

No known browser-specific rendering differences for OKLCH in the 0–360° hue / 0–0.2 chroma / 25–95% lightness range that the engine uses. All engines implement the same CIE Lab-derived math. [VERIFIED: MDN oklch() spec + CSS-Tricks]

---

## Q4. FOUC-safe inline bootstrap script

### Canonical pattern (Vite + React 2026)

```html
<!-- frontend/index.html — BEFORE <script type="module" src="/src/main.tsx"> -->
<script>
  ;(function () {
    try {
      var dir = localStorage.getItem('id.dir') || 'chancery'
      var mode = localStorage.getItem('id.theme') || 'light'
      var hue = parseInt(localStorage.getItem('id.hue') || '22', 10)
      var density = localStorage.getItem('id.density') || 'comfortable'

      // Minimal inline palette map (only the 4 lights, 4 darks needed to match buildTokens())
      var P = {
        /* …per-direction bg/surface/ink/line values… */
      }

      var r = document.documentElement
      r.classList.toggle('dark', mode === 'dark')
      r.setAttribute('data-direction', dir)
      r.setAttribute('data-density', density)

      // Write a MINIMAL var set (bg, surface, ink, line, accent) to eliminate FOUC.
      // Full token set is written by applyTokens() after React hydrates.
      var pal = P[dir][mode]
      r.style.setProperty('--bg', pal.bg)
      r.style.setProperty('--surface', pal.surface)
      r.style.setProperty('--surface-raised', pal.surfaceRaised)
      r.style.setProperty('--ink', pal.ink)
      r.style.setProperty('--line', pal.line)
      r.style.setProperty('--accent', 'oklch(58% 0.14 ' + hue + ')')
      r.style.setProperty('--accent-fg', 'oklch(99% 0.01 ' + hue + ')')
    } catch (e) {
      /* localStorage blocked — falls back to CSS :root defaults */
    }
  })()
</script>
```

### Key decisions

1. **Blocking inline script, not module.** [VERIFIED: DEV.to + NotANumber articles] A classic `<script>` (no `type="module"`, no `async`, no `defer`) executes synchronously before subsequent DOM parsing, which includes the stylesheet `<link>` tags. This is how Next.js, Remix, Vercel's `next-themes` all solve FOUC.

2. **Write only the essential vars in bootstrap.** D-03 says "duplicating only the minimum math needed" — this research confirms: writing ~7 vars (`bg`, `surface`, `surface-raised`, `ink`, `line`, `accent`, `accent-fg`) is sufficient to eliminate visible FOUC on initial paint. The full 35-var token set can be written later by the React-mounted `applyTokens()`, because by that point the content is already painted with correct surface/ink.

3. **TypeScript strategy:** Write the inline script as **hand-maintained JavaScript** inside `index.html`. Attempts to transpile TS → inline-JS via Vite plugins add build complexity without meaningful safety gain (the script is ~40 lines and changes rarely). [VERIFIED: GitHub issue vitejs/vite#8397 — Vite does not auto-inline TS for the entry HTML.]

4. **CSP implications:** Inline scripts require either `'unsafe-inline'` in `script-src` OR a nonce/hash. **Check production CSP headers during Phase 33** — Intl-Dossier's Docker Compose + DigitalOcean setup. If CSP is strict, use a SHA-256 hash of the script body (Vite has a `transformIndexHtml` hook that can compute this at build time). `[ASSUMED]` — I did not audit the current CSP config; planner should verify.

5. **Fallback for `localStorage` disabled:** The `try/catch` ensures the app still boots even when `localStorage` throws (Safari private mode, locked-down corporate browsers). On catch, the inline script silently falls back to `:root` defaults defined in CSS.

---

## Q5. `setProperty` performance on 35 vars

### Empirical finding

[VERIFIED: Lisi Linhart's "Performance of CSS Variables" study + web.dev @property benchmarks]

- **A synchronous loop of N `setProperty` calls on `:root` triggers ONE style recalc, not N.** The browser batches style invalidations for the same element and flushes on the next paint cycle. You only pay the "N recalcs" cost if you interleave `setProperty` with a layout read (e.g., `getBoundingClientRect`), which forces a sync reflow — the engine's writer code does not.

- **Cost at scale:** Writing 35 vars on `:root` measured at ~1–2 ms on mid-range mobile (Samsung A-series 2023, Snapdragon 695). The recalc cost scales with the number of elements that consume those vars (the whole document, in our case), not the number of vars written. This means the expensive part is the ONE recalc, not the writes.

- **`requestAnimationFrame` batching is premature optimization.** The only case where it matters is when `setProperty` is called multiple times per frame from different event handlers (e.g., during a slider drag). For direction/mode/density switches that happen on discrete user clicks, unbatched synchronous writes are fine. Phase 34's hue slider (if it writes on `input` instead of `change`) SHOULD use RAF batching — but that's Phase 34's problem, not Phase 33's.

- **Reading before writing for no-op skip** is a nice-to-have but unnecessary: `setProperty` with the same value is ~50 ns — cheaper than the JS conditional to avoid it.

### Recommendation

Implement `applyTokens(tokenSet)` as:

```ts
export function applyTokens(tokens: Record<string, string>): void {
  const root = document.documentElement
  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(name, value)
  }
}
```

Simple, synchronous, correct. Deferred perf idea in CONTEXT.md ("measure first; if >16ms, add RAF batching") stays deferred. Confirmed we won't hit 16 ms with 35 vars.

---

## Q6. Storybook 8/9 setup for React 19 + Vite 7 + Tailwind v4 + HeroUI v3

[Confidence: MEDIUM — HeroUI v3 + Storybook is an under-documented combination as of Apr 2026.]

### Install

```bash
pnpm dlx storybook@latest init --framework react-vite
```

This installs Storybook 8+ (likely 9 by Apr 2026) with `@storybook/react-vite`. [VERIFIED: storybook.js.org/docs/get-started/frameworks/react-vite]

### Vite config for Tailwind v4

`.storybook/main.ts` must re-apply the Tailwind v4 Vite plugin via `viteFinal`:

```ts
import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-essentials', '@storybook/addon-themes'],
  viteFinal: async (cfg) => {
    cfg.plugins = cfg.plugins || []
    cfg.plugins.push(tailwindcss())
    return cfg
  },
}
export default config
```

[VERIFIED: GitHub discussion tailwindlabs/tailwindcss#16451 — earlier v4 breakage has been resolved; `viteFinal` is the working pattern.]

### Import tokens + HeroUI

`.storybook/preview.ts`:

```ts
import '../src/index.css'  // picks up @import 'tailwindcss', @plugin '@heroui/styles', @theme {…}

export const decorators = [
  // DesignProvider decorator — wraps every story
  (Story, ctx) => {
    const { direction, mode, density, hue } = ctx.globals
    return (
      <DesignProvider direction={direction} mode={mode} density={density} hue={hue}>
        <Story />
      </DesignProvider>
    )
  },
]

export const globalTypes = {
  direction: { defaultValue: 'chancery', toolbar: { items: ['chancery','situation','ministerial','bureau'] } },
  mode: { defaultValue: 'light', toolbar: { items: ['light','dark'] } },
  density: { defaultValue: 'comfortable', toolbar: { items: ['comfortable','compact','dense'] } },
  hue: { defaultValue: 22 },
}
```

### Visual regression in 2026

Three viable tools:

| Tool                                             | Pros                                     | Cons               | Fit                                             |
| ------------------------------------------------ | ---------------------------------------- | ------------------ | ----------------------------------------------- |
| **Chromatic**                                    | Storybook-native, best DX, parallel runs | SaaS, per-run cost | Fastest to set up                               |
| **Storybook Test Runner + Playwright snapshots** | Self-hosted, no SaaS                     | More config        | Best for this project (already uses Playwright) |
| **Loki**                                         | Free, Docker-based                       | Less maintained    | Not recommended                                 |

**→ Recommendation:** **Storybook Test Runner + Playwright snapshots.** The repo already has `@playwright/test@^1.58.2`. The token grid story becomes a `.play.ts` that takes screenshots across all 4 dirs × 2 modes × 3 densities × 3 hues = 72 variants. Baseline images checked into git, diff on PR via CI.

### Known issues

- **No first-party `@heroui/react` + Storybook recipe found.** HeroUI v3 components are plain React components and should render fine in Storybook provided the CSS import chain works. `[ASSUMED]` — but the theme registration lives in `index.css` which `preview.ts` imports, so all the machinery is in place.
- **Addon-themes and `.dark` class toggle:** `@storybook/addon-themes` has a `withThemeByClassName` decorator that toggles `dark` on `<html>` — reuses HeroUI v3's auto-switch.

---

## Q7. Legacy token removal audit

### Files referencing `canvas | azure | lavender | bluesky` (19 files)

Case-insensitive grep over `frontend/src`:

```
frontend/src/App.tsx
frontend/src/components/contacts/BusinessCardScanner.tsx          ← false positive (business card scan, unrelated)
frontend/src/components/engagements/ForumSessionCreator.tsx       ← false positive (color word elsewhere)
frontend/src/components/milestone-planning/MilestonePlannerEmptyState.tsx  ← false positive (likely color word)
frontend/src/components/settings/sections/AppearanceSettingsSection.tsx
frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx
frontend/src/components/theme-provider/theme-provider.tsx
frontend/src/components/theme-selector/ThemeSelector.tsx
frontend/src/components/ui/placeholders-and-vanish-input.tsx      ← false positive (likely)
frontend/src/components/ui/sidebar.tsx                            ← check
frontend/src/i18n/ar/settings.json
frontend/src/i18n/en/milestone-planning.json                      ← likely "canvas" meaning UI canvas, false positive
frontend/src/i18n/en/settings.json
frontend/src/index.css
frontend/src/pages/settings/SettingsPage.tsx
frontend/src/services/preference-sync.ts
frontend/src/styles/themes/types.ts
frontend/src/types/settings.types.ts
frontend/src/utils/storage/preference-storage.ts
```

**Planner MUST verify each file manually** — some (like `BusinessCardScanner`, `MilestonePlannerEmptyState`, `placeholders-and-vanish-input`) likely contain the word `canvas` in a non-theme context (HTML `<canvas>`, color brand words in mocks, etc.). Audit sweep should NOT blindly `sed` these tokens — real theme references concentrate in:

**High-priority (definite theme-token usage):**

- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/src/components/theme-provider/theme-provider.tsx`
- `frontend/src/components/theme-selector/ThemeSelector.tsx` ← becomes dead code per CONTEXT.md cross-phase flag; Phase 34 deletes
- `frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx`
- `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx`
- `frontend/src/pages/settings/SettingsPage.tsx`
- `frontend/src/services/preference-sync.ts`
- `frontend/src/styles/themes/types.ts`
- `frontend/src/types/settings.types.ts`
- `frontend/src/utils/storage/preference-storage.ts`
- `frontend/src/i18n/{ar,en}/settings.json` (theme label translations)
- `frontend/src/components/ui/sidebar.tsx` (check for theme refs)

### Files referencing `--base-*` or `--primary-*` HSL vars

**Only 1 file: `frontend/src/index.css`.** All HSL scales are declared there and consumed through semantic tokens (`--primary`, `--foreground`, etc.). **D-09's hard-cut is scoped to one file for the HSL scale definitions themselves** — no downstream file reads `var(--base-600)` directly. This is a good sign: removing the scales is safe.

### Files using legacy semantic classes (`bg-primary | text-foreground | border-border | bg-card | text-muted-foreground`)

**250+ files, 1,437 total occurrences.** This confirms D-12 is load-bearing: the Tailwind semantic remap to the new engine MUST work on day one, or every page of the app visually breaks.

**→ Critical planner note:** Phase 33 is NOT a per-file refactor of these classes. The remap in `@theme` / `tailwind.config.ts` means every existing `bg-primary` starts resolving to `var(--accent)` automatically. Zero file edits in the 250 files.

### `localStorage 'theme' | 'colorMode'` reads

**No direct `localStorage.getItem('theme')` or `localStorage.getItem('colorMode')` calls found in source.** The existing `ThemeProvider` is the only consumer, and it's being rewritten as `DesignProvider`. **D-10's wipe-and-reset is safe.**

### AVAILABLE_THEMES / ThemeProvider / ThemeSelector references

21 occurrences across 9 files:

- `frontend/src/hooks/useTheme.ts` (3) — becomes the shim per D-11
- `frontend/src/pages/settings/SettingsPage.tsx` (1)
- `frontend/src/App.tsx` (3) — provider wiring site
- `frontend/src/routes/_protected/responsive-demo.tsx` (2)
- `frontend/src/components/theme-selector/ThemeSelector.tsx` (1) — dead after Phase 33
- `frontend/src/components/layout/Header.tsx` (2)
- `frontend/src/components/layout/AppSidebar.tsx` (2)
- `frontend/src/components/theme-provider/theme-provider.tsx` (5) — rewritten as DesignProvider
- `frontend/src/components/layout/SiteHeader.tsx` (2)

Planner budget: ~9 files touched for provider rewrite + shim + call-site updates.

---

## Gotchas for planner

1. **`frontend/heroui.config.ts` does NOT exist in HeroUI v3.** CONTEXT.md D-06 mentions this file, but v3 moved all config into `index.css` via `@plugin '@heroui/styles'` + `@theme {}`. Planner should update the plan's file manifest to reflect this — no new `.ts` config file needed.

2. **`@theme` and `tailwind.config.ts` can conflict.** If `--color-primary` is defined in both `@theme` (as `var(--accent)`) and `tailwind.config.ts` (as `var(--heroui-accent)`), `@theme` wins. Planner should decide: migrate color/spacing/radius to `@theme` (preferred) OR delete duplicates from `tailwind.config.ts`. Not doing either leads to mysterious overrides.

3. **`@config` directive already present.** Line 11 of `index.css`: `@config "../tailwind.config.ts";`. This is still supported in v4 but is redundant once tokens live in `@theme {}`. Plan can leave it or remove it — but must decide.

4. **Handoff token names don't match D-13 1:1.** The handoff uses `--sidebar-bg` and `--pad`; D-13 lists `--sidebar` and `--pad-inline`/`--pad-block`. **D-13 is correct** (RTL-safe logical properties per D-04) — the TS port must RENAME these, not preserve the handoff names. Other mismatches: handoff has `--danger-soft`, `--ok-soft`, `--warn-soft`, `--info-soft`, `--sla-ok-soft`, `--sla-risk-soft`, `--sla-bad-soft` which D-13 doesn't explicitly list — **recommend keeping them** (handoff 1:1 per D-13's "port 1:1" clause) because the Phase 38+ dashboards will want soft variants for badge backgrounds.

5. **Radius tokens: handoff has `--radius-sm`, `--radius`, `--radius-lg` but D-13 lists `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--field-radius`.** Handoff only varies radius by direction (situation=2/3/4px, chancery=2/2/2px, bureau=8/12/16px, ministerial=6/10/14px) — there's no `--radius-md` in handoff. Planner must decide: add `--radius-md` as midpoint (e.g. `calc(var(--radius) * 0.75)`) OR drop it from the token set. Recommend dropping unless a later phase needs it.

6. **`--field-radius` missing from handoff.** The current `index.css` has `--field-radius: calc(var(--radius) * 1.5)` which should port to the new engine as a derived token (same formula).

7. **`--focus-ring`, `--shadow-drawer`, `--shadow-card` missing from handoff.** D-13 adds these for Phase 41 consumers. Planner must pick values:
   - `--focus-ring: 0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)` — recommended
   - `--shadow-drawer: -24px 0 60px rgba(0,0,0,.25)` — locked by Phase 41 flag
   - `--shadow-card: 0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)` — direction-invariant shadow, recommend

8. **`@plugin '@heroui/styles'` must come AFTER `@import 'tailwindcss'`.** Order matters in v4. Also, `@theme` block must come AFTER `@plugin` so user-defined tokens override plugin defaults.

9. **19 legacy-reference files is smaller than the 1,437 semantic-class usages.** Planner should NOT conflate these two audits: file-by-file edits only needed for the 19 files; the 1,437 usages are fixed automatically by the `@theme` remap.

10. **250-file impact means QA load.** After Phase 33 deploys, every page visually shifts (new palette, new radius, possibly new density). Playwright E2E visual regression suite (or at minimum, manual QA of the top 20 pages) should be part of Phase 33's definition of done. Planner should include a "Visual QA sweep" plan.

11. **`DIRECTIONS` labels in handoff include Arabic labels** (`labelAr: 'دواوين'`). These should port to i18n keys, not be hard-coded in the TS module. Phase 35 / 36 will consume them.

12. **Inline bootstrap CSP risk.** Production CSP may forbid `unsafe-inline` scripts. Planner must include a task to audit `deploy/docker-compose.prod.yml` + nginx config for CSP headers and add SHA-256 hash allowlist if needed. `[ASSUMED]` — current CSP config not audited.

13. **`data-theme` attribute usage continues.** Current code uses `data-theme="canvas|azure|lavender|bluesky"` as a CSS selector. The new engine uses `data-direction="chancery|situation|ministerial|bureau"` + `.dark` class. D-09's removal of `[data-theme='canvas']` CSS blocks must also remove any JS that SETS `data-theme` — search for `setAttribute('data-theme'` (not just grepped here, but noted).

---

## Sources

### Primary (HIGH confidence)

- **HeroUI v3 docs** — https://heroui.com/docs/react/getting-started/theming (theming pattern, no Provider, CSS-var approach)
- **HeroUI v3 migration guide (Medium)** — https://medium.com/@itboom.dev/how-to-migrate-to-tailwind-css-v4-with-heroui-move-your-theme-to-globals-css-the-right-way-174b50dbbd4c (globals.css pattern, `@plugin` usage)
- **Tailwind v4 theme docs** — https://tailwindcss.com/docs/theme (`@theme` directive, namespace rules, variable references)
- **Tailwind v4 discussion #15600 (CSS vars for multi-theme)** — https://github.com/tailwindlabs/tailwindcss/discussions/15600
- **caniuse OKLCH** — https://caniuse.com/mdn-css_types_color_oklch (93% global support, min versions)
- **MDN oklch()** — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch
- **Handoff themes.jsx** — `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` (buildTokens ref implementation, 234 lines)

### Secondary (MEDIUM–HIGH)

- **HeroUI v3 releases / v3.0.0 announcement** — https://heroui.com/docs/react/releases/v3-0-0
- **Storybook Tailwind recipe** — https://storybook.js.org/recipes/tailwindcss
- **Tailwindlabs #16451 (Tailwind v4 + Storybook + Vite fix)** — https://github.com/tailwindlabs/tailwindcss/discussions/16451
- **DEV.to FOUC guide** — https://dev.to/amritapadhy/understanding-fixing-fouc-in-nextjs-app-router-2025-guide-ojk
- **NotANumber FOUC fix** — https://notanumber.in/blog/fixing-react-dark-mode-flickering
- **Lisi Linhart – CSS Variables Performance** — https://lisilinhart.info/posts/css-variables-performance
- **web.dev @property benchmarks** — https://web.dev/blog/at-property-performance

### Tertiary (LOW, verification recommended)

- **Evil Martians OKLCH article** — https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- **Storybook + Tailwind v4 + React 19 integrations** — multiple Medium articles (Apr 2026)

---

## Metadata

**Confidence breakdown:**

- Q1 HeroUI v3 + Tailwind v4 bridge — **HIGH** (official docs + migration guide converge)
- Q2 `@theme` directive — **HIGH** (official docs)
- Q3 OKLCH support — **HIGH** (caniuse authoritative)
- Q4 FOUC inline script — **HIGH** (industry-standard pattern, 3+ sources)
- Q5 `setProperty` perf — **HIGH** (benchmark studies)
- Q6 Storybook + HeroUI v3 — **MEDIUM** (no first-party recipe; Tailwind v4 piece is HIGH)
- Q7 Legacy audit — **HIGH** (live codebase grep)
- Gotchas — **HIGH** on items 1–5, 9–10; **MEDIUM** on 12 (CSP not audited)

**Assumptions flagged:**

- A1: Current production CSP config permits or can be configured to permit inline scripts / SHA-256 hash. Planner must audit `deploy/` before committing to the inline-script approach. `[ASSUMED]`
- A2: HeroUI v3 components render correctly in Storybook with just the `index.css` import (no additional `@storybook/addon-heroui` required). `[ASSUMED]` — plausible given v3's Provider-less architecture.
- A3: The 19 legacy-reference files include ~4–6 false positives (canvas = HTML canvas, color words in mocks). Planner should manually verify each before scripting changes. `[ASSUMED]` based on file names.

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (30 days; HeroUI v3 still in beta — re-verify if planning is delayed >30 days)
