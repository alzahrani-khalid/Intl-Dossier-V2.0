---
phase: 33-token-engine
plan: 06
type: execute
wave: 2
depends_on: ['33-01', '33-04']
files_modified:
  - frontend/src/index.css
  - frontend/tailwind.config.ts
  - frontend/tests/e2e/tailwind-remap-visual.spec.ts
  - frontend/tests/e2e/__screenshots__/ (baselines)
autonomous: false
requirements: [TOKEN-04]
must_haves:
  truths:
    - "'bg-primary' resolves to var(--accent), 'text-foreground' → var(--ink), 'border-border' → var(--line), 'bg-card' → var(--surface), 'bg-background' → var(--bg), 'text-muted-foreground' → var(--ink-mute), 'bg-popover' → var(--surface-raised)"
    - 'New utilities exist: bg-surface, bg-surface-raised, bg-accent, bg-accent-soft, bg-sidebar, bg-danger, bg-ok, bg-warn, bg-info, text-ink, text-ink-mute, text-ink-faint, text-accent, text-accent-ink, text-accent-fg, text-sidebar-ink, border-line, border-line-soft, bg-sla-ok, bg-sla-risk, bg-sla-bad, shadow-drawer, shadow-card'
    - 'Playwright screenshot sweep across 3 routes × 2 modes × 2 locales × 2 viewports = 24 baselines match or planned-delta-approved'
  artifacts:
    - path: 'frontend/src/index.css'
      provides: '@theme block exposing all D-16 utilities'
    - path: 'frontend/tailwind.config.ts'
      provides: 'semantic remap (or removed in favor of @theme)'
  key_links:
    - from: 'frontend/src/index.css'
      to: 'runtime --accent / --ink / --line vars'
      via: '@theme --color-primary: var(--accent)'
      pattern: '--color-primary'
---

# Plan 33-06: Tailwind v4 Semantic Remap (Load-Bearing)

**Phase:** 33 (token-engine)
**Wave:** 2
**Depends on:** 33-01 (for var names), 33-04 (for `@plugin` ordering)
**Type:** config + visual regression
**TDD:** false
**Estimated effort:** M (3–4 h + ~1 h screenshot review)

## Goal

Remap Tailwind's semantic classes (`bg-primary`, `text-foreground`, `border-border`, `bg-card`, `bg-background`, `bg-popover`, `text-muted-foreground`, etc.) to the new engine's vars via Tailwind v4's `@theme` directive in `frontend/src/index.css`. Add the full D-16 utility set (`bg-surface`, `text-accent`, `border-line`, `bg-accent-soft`, `bg-sla-risk`, etc.). Decide `@theme`-in-CSS vs `tailwind.config.ts` as source of truth and document.

**This plan is load-bearing** (RESEARCH Q7): 250+ files / 1,437 occurrences use `bg-primary / text-foreground / border-border`. Without this remap, the entire UI visually breaks on Phase 33 deploy.

## Why this plan has a checkpoint (autonomous: false)

Task 5 is a **checkpoint:human-verify** — 24 Playwright screenshot baselines require human approval of expected visual deltas. The new palette WILL differ slightly (new Chancery-light is not identical to the old "canvas" theme). A human confirms each diff is intentional, not a regression.

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-RESEARCH.md
@frontend/src/index.css
@frontend/tailwind.config.ts

<interfaces>
<!-- All new Tailwind utilities exposed to 250+ call sites -->
<!-- Naming: `--color-<name>` in @theme → bg-<name>, text-<name>, border-<name>, ring-<name>, etc. -->
```
Surfaces/ink/lines:  bg-bg, bg-surface, bg-surface-raised, text-ink, text-ink-mute, text-ink-faint, border-line, border-line-soft, bg-sidebar, text-sidebar-ink
Accent family:       bg-accent, text-accent, text-accent-ink, bg-accent-soft, text-accent-fg
Semantic:            bg-danger, bg-ok, bg-warn, bg-info (+ their -foreground counterparts)
SLA:                 bg-sla-ok, bg-sla-risk, bg-sla-bad (+ soft variants)
Density (spacing):   h-row-h, p-pad-inline (via --spacing-*)
Radius:              rounded-radius, rounded-radius-sm, rounded-radius-lg, rounded-field
Shadow:              shadow-card, shadow-drawer
Focus:               ring-focus (via --ring-focus)

Legacy compat (REMAP — load-bearing):
bg-primary → var(--accent)
text-primary-foreground → var(--accent-fg)
text-foreground → var(--ink)
text-muted-foreground → var(--ink-mute)
border-border → var(--line)
bg-background → var(--bg)
bg-card → var(--surface)
text-card-foreground → var(--ink)
bg-popover → var(--surface-raised)
text-popover-foreground → var(--ink)
bg-destructive → var(--danger)

````
</interfaces>
</context>

## Files to create / modify

| Path | Action | Notes |
|---|---|---|
| `frontend/src/index.css` | modify | Add `@theme { ... }` block between `@plugin '@heroui/styles'` (from 33-04) and the `:root { }` block. Move all color/spacing/radius defs into `@theme`. |
| `frontend/tailwind.config.ts` | modify | Remove `extend.colors` entries that are now defined in `@theme` (to avoid conflict per RESEARCH Gotcha #2). Keep `content`, `plugins`, `darkMode`, RTL logical-property plugin, keyframes, fontFamily. |
| `frontend/tests/e2e/tailwind-remap-visual.spec.ts` | create | Playwright screenshot sweep |
| `frontend/tests/e2e/__screenshots__/` | create | 24 baseline PNGs committed after human approval |

## Decision — `@theme` vs `tailwind.config.ts` (locked here)

**Decision: Source of truth = `@theme` in `frontend/src/index.css`** (RESEARCH Q2 recommendation).

Rationale:
- Tailwind v4 idiom
- HeroUI v3 pattern match
- Single source of truth (avoids conflicts per Gotcha #2)
- `tailwind.config.ts` stays only for `content`, `plugins`, `darkMode`, custom keyframes/animations, and the RTL logical-property plugin

`@config "../tailwind.config.ts"` directive: **keep** — it's the bridge to the remaining config. Remove it later only if a future phase migrates animations/plugins into CSS.

## Implementation steps

### Task 1 (auto) — Write `@theme` block in `index.css`

Insert AFTER `@plugin '@heroui/styles'` (line added in Plan 33-04), BEFORE any `:root { }` remap block:

```css
@theme {
  /* Surfaces / ink / lines — generates bg-bg, bg-surface, text-ink, border-line, etc. */
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-ink: var(--ink);
  --color-ink-mute: var(--ink-mute);
  --color-ink-faint: var(--ink-faint);
  --color-line: var(--line);
  --color-line-soft: var(--line-soft);
  --color-sidebar: var(--sidebar);
  --color-sidebar-ink: var(--sidebar-ink);

  /* Accent family */
  --color-accent: var(--accent);
  --color-accent-ink: var(--accent-ink);
  --color-accent-soft: var(--accent-soft);
  --color-accent-fg: var(--accent-fg);

  /* Semantic */
  --color-danger: var(--danger);
  --color-danger-foreground: var(--accent-fg);
  --color-ok: var(--ok);
  --color-warn: var(--warn);
  --color-info: var(--info);

  /* SLA */
  --color-sla-ok: var(--sla-ok);
  --color-sla-risk: var(--sla-risk);
  --color-sla-bad: var(--sla-bad);

  /* Legacy semantic REMAP — load-bearing for 1,437 existing usages */
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
  --color-destructive: var(--danger);
  --color-destructive-foreground: var(--accent-fg);
  --color-muted: var(--surface);
  --color-accent-legacy: var(--accent); /* fallback if any code imported raw 'accent' */

  /* Spacing — density tokens as spacing utilities */
  --spacing-row-h: var(--row-h);
  --spacing-pad-inline: var(--pad-inline);
  --spacing-pad-block: var(--pad-block);
  --spacing-gap: var(--gap);

  /* Radius */
  --radius-sm: var(--radius-sm);
  --radius-DEFAULT: var(--radius);
  --radius-lg: var(--radius-lg);
  --radius-field: var(--field-radius);

  /* Shadow */
  --shadow-card: var(--shadow-card);
  --shadow-drawer: var(--shadow-drawer);

  /* Focus ring */
  --ring-focus: var(--focus-ring);
}
````

### Task 2 (auto) — Slim `tailwind.config.ts`

From `frontend/tailwind.config.ts`:

- **Remove** `theme.extend.colors` block entirely (lines 29-120 per PATTERNS.md). Every color is now defined in `@theme`.
- **Remove** `borderRadius` overrides that conflict with `@theme --radius-*`.
- **Keep** `darkMode: ['class']`, `content`, `plugins`, `screens`, `fontFamily` (Phase 35 updates this), `keyframes`, `animation`, RTL logical-property plugin (lines 205-268 per PATTERNS.md).

After edit, the file should be ~100 lines (down from ~270).

### Task 3 (auto) — Confirm `:root { }` block semantics

`frontend/src/index.css` after this plan has:

```
@import 'tailwindcss'      ← line 10 (existing)
@plugin '@heroui/styles'   ← from 33-04
@config "../tailwind.config.ts"  ← existing
@theme { ... }             ← this plan
:root { /* Chancery-light literal fallbacks for --bg, --surface, --ink, --line, --accent */ }  ← from 33-03 + 33-04
:root { --heroui-primary: var(--accent); ... }  ← from 33-04
```

No duplicate token definitions. All 19 `[data-theme=...]` blocks still present — Plan 33-07 removes them.

### Task 4 (auto) — Author visual-regression E2E test

`frontend/tests/e2e/tailwind-remap-visual.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const routes = ['/', '/dossiers', '/dossiers/some-id'] // 3 representative
const modes: Array<'light' | 'dark'> = ['light', 'dark']
const locales: Array<'en' | 'ar'> = ['en', 'ar']
const viewports = [
  { w: 375, h: 812 },
  { w: 1440, h: 900 },
] // mobile + desktop

for (const route of routes)
  for (const mode of modes)
    for (const locale of locales)
      for (const vp of viewports) {
        test(`remap ${route} ${mode} ${locale} ${vp.w}x${vp.h}`, async ({ page }) => {
          await page.setViewportSize({ width: vp.w, height: vp.h })
          await page.addInitScript(
            ([m, l]) => {
              localStorage.setItem('id.theme', m)
              localStorage.setItem('i18nextLng', l)
            },
            [mode, locale],
          )
          await page.goto(route)
          await page.waitForLoadState('networkidle')
          await expect(page).toHaveScreenshot(
            `remap-${route.replace(/\//g, '_')}-${mode}-${locale}-${vp.w}.png`,
            {
              maxDiffPixelRatio: 0.02,
            },
          )
        })
      }
```

### Task 5 (checkpoint:human-verify) — Review 24 screenshot baselines

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    24 Playwright screenshots of the 3 routes across 2 modes × 2 locales × 2 viewports, rendered with the new
    Chancery-light / Chancery-dark palettes via the @theme remap.
  </what-built>
  <how-to-verify>
    1. Run: `pnpm --filter frontend test:e2e tailwind-remap-visual --update-snapshots`
    2. Open `frontend/tests/e2e/__screenshots__/` and visually inspect each of the 24 PNGs
    3. For each image, confirm:
       - Backgrounds are the intended Chancery tone (not "canvas" legacy HSL)
       - Text contrast looks correct (no light-on-light)
       - Primary buttons/badges use the Chancery accent (warm OKLCH hue 22°)
       - Destructive elements use var(--danger)
       - Borders are subtle (var(--line))
    4. For Arabic locale: confirm logical-property padding/margin still positions icons correctly (start/end flipped)
    5. Approve all 24, OR list which routes need re-spec (return to planner)
  </how-to-verify>
  <resume-signal>Type "baselines approved" OR "regression: {route}"</resume-signal>
</task>

### Task 6 (auto) — Commit approved baselines

`git add frontend/tests/e2e/__screenshots__/ && git commit -m "test(33-06): tailwind remap visual baselines"`

## Definition of done

- [ ] `@theme { }` block in `frontend/src/index.css` exposes all D-16 utilities plus load-bearing legacy remaps (full list in Task 1)
- [ ] `tailwind.config.ts` ≤ 120 lines; no `extend.colors` block
- [ ] `pnpm --filter frontend build` succeeds; final CSS bundle contains generated utilities (`grep -o 'bg-accent' dist/assets/*.css` returns at least one match)
- [ ] `pnpm --filter frontend dev` — manual: inspect any button with `bg-primary` in DevTools → computed `background-color` uses `oklch(…)` from `--accent`
- [ ] 24 Playwright screenshot baselines captured and human-approved
- [ ] `pnpm --filter frontend test:e2e tailwind-remap-visual` passes with maxDiffPixelRatio ≤ 0.02 on a re-run
- [ ] RTL audit: navigate AR locale, confirm no `ml-/mr-/pl-/pr-` visible in inspector on touched components (logical properties must survive)
- [ ] Grep confirms no conflicting color defs: `grep -c 'primary:' frontend/tailwind.config.ts` returns 0

## Requirements satisfied

- TOKEN-04 (full, in concert with 33-04)

## Success Criteria contribution

- SC-5: Tailwind utilities `bg-surface / text-accent / border-line / bg-accent-soft` resolve to active direction+mode+hue. 250+ file legacy usages remain visually correct via `@theme` remap.

## Risks / unknowns

- **`@theme` + `@config` precedence**: if both define `--color-primary`, `@theme` wins (RESEARCH Q2). Verified by Task 2 removing duplicates.
- **Screenshot flakiness**: font loading may race tests. Add `page.waitForLoadState('networkidle')` and `await page.evaluate(() => document.fonts.ready)` before snapshot.
- **Large baseline file count**: 24 PNGs × ~200 KB each = ~5 MB in git. Acceptable; use git LFS if repo policy demands.
- **Breakage of unrelated tests**: some existing visual tests (if any) may snap against old HSL palette. Separate plan (possibly 33-07 or follow-up) handles deletion/refresh.

## Verification

```bash
pnpm --filter frontend build
pnpm --filter frontend test:e2e tailwind-remap-visual --update-snapshots
# Human reviews __screenshots__/ → approves
pnpm --filter frontend test:e2e tailwind-remap-visual
# Grep legacy conflict
grep -c 'primary\|foreground\|border-border' frontend/tailwind.config.ts
# Expect 0 (or only RTL plugin mentions, not color defs)
```
