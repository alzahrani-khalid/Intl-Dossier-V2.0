---
phase: 33-token-engine
plan: 08
type: execute
wave: 3
depends_on: ['33-02', '33-04', '33-05', '33-06']
files_modified:
  - frontend/package.json
  - .storybook/main.ts
  - .storybook/preview.tsx
  - frontend/src/design-system/stories/TokenGrid.stories.tsx
  - frontend/tests/storybook/token-grid.spec.ts
autonomous: false
requirements: [TOKEN-05]
must_haves:
  truths:
    - '@storybook/react-vite is installed with HeroUI-compatible config'
    - 'DesignProvider wraps every story via a global decorator with toolbar globals for direction/mode/hue/density'
    - 'A single TokenGrid story renders all 8 HeroUI components across 4 directions × 2 modes × 3 densities × 3 hues'
    - 'Visual regression (Playwright test-runner) catches any per-component regression on token switch'
  artifacts:
    - path: '.storybook/main.ts'
      provides: 'Storybook 8+ config with viteFinal Tailwind v4 plugin'
    - path: '.storybook/preview.tsx'
      provides: 'DesignProvider decorator + globalTypes for dir/mode/density/hue'
    - path: 'frontend/src/design-system/stories/TokenGrid.stories.tsx'
      provides: 'the TOKEN-05 verification story'
  key_links:
    - from: 'TokenGrid.stories.tsx'
      to: '@heroui/react components + @/components/ui wrappers'
      via: 'story imports'
      pattern: "from '@heroui/react'"
---

# Plan 33-08: Storybook Install + Token Grid Story

**Phase:** 33 (token-engine)
**Wave:** 3
**Depends on:** 33-02 (DesignProvider), 33-04 (HeroUI + index.css), 33-05 (wrappers), 33-06 (Tailwind remap active)
**Type:** install + test
**TDD:** false
**Estimated effort:** M (4 h — Storybook config is fiddly but well-documented)

## Goal

Install Storybook 8+ configured for React 19 + Vite 7 + Tailwind v4 + HeroUI v3. Create a global `DesignProvider` decorator with toolbar controls for direction/mode/hue/density. Author one comprehensive story (`TokenGrid.stories.tsx`) rendering all 8 HeroUI components across every token combination. Add a Playwright test-runner assertion that catches per-component regressions on token switch.

This plan satisfies **TOKEN-05** (visual grid verification) and serves as the primary artifact proving SC-5 (zero per-component overrides).

## Why this plan has a checkpoint (autonomous: false)

Task 6 is a **checkpoint:decision** on the visual-regression tool (Storybook Test Runner vs Chromatic vs Playwright Component Tests) per RESEARCH Q6.

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-RESEARCH.md
@CLAUDE.md
@frontend/src/App.tsx
@frontend/src/design-system/DesignProvider.tsx
@frontend/src/components/ui/heroui-button.tsx
@frontend/src/components/ui/heroui-card.tsx
@frontend/src/components/ui/heroui-chip.tsx
@frontend/src/components/ui/heroui-skeleton.tsx
@frontend/src/components/ui/heroui-modal.tsx
@frontend/src/components/ui/heroui-forms.tsx

<interfaces>
<!-- Story Globals consumed by decorator -->
```typescript
declare module '@storybook/react' {
  interface Parameters {
    layout?: 'centered' | 'padded' | 'fullscreen'
  }
  interface Globals {
    direction: Direction
    mode: Mode
    density: Density
    hue: number
  }
}
```
</interfaces>
</context>

## Files to create / modify

| Path                                                       | Action | Notes                                                                                                                      |
| ---------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `frontend/package.json`                                    | modify | Add `@storybook/react-vite`, `@storybook/addon-essentials`, `@storybook/addon-themes`, `@storybook/test-runner` as devDeps |
| `.storybook/main.ts`                                       | create | Storybook 8+ config with `viteFinal` Tailwind v4 plugin wiring                                                             |
| `.storybook/preview.tsx`                                   | create | Import `../frontend/src/index.css`; DesignProvider decorator; globalTypes for toolbar                                      |
| `frontend/src/design-system/stories/TokenGrid.stories.tsx` | create | One story rendering all 8 HeroUI components as a grid                                                                      |
| `frontend/tests/storybook/token-grid.spec.ts`              | create | Playwright test-runner assertion per chosen tool (Task 6)                                                                  |

## Implementation steps

### Task 1 (auto) — Install Storybook

```bash
cd frontend
pnpm dlx storybook@latest init --framework react-vite --yes
```

Or manual:

```bash
pnpm --filter frontend add -D @storybook/react-vite @storybook/addon-essentials @storybook/addon-themes @storybook/test-runner playwright
```

Storybook init typically creates `.storybook/` at repo root; confirm path and `main.ts` location.

### Task 2 (auto) — `.storybook/main.ts`

```ts
import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  stories: ['../frontend/src/**/*.stories.@(ts|tsx|mdx)'],
  framework: { name: '@storybook/react-vite', options: {} },
  addons: ['@storybook/addon-essentials', '@storybook/addon-themes'],
  typescript: { reactDocgen: 'react-docgen-typescript' },
  viteFinal: async (cfg) => {
    cfg.plugins = cfg.plugins || []
    cfg.plugins.push(tailwindcss())
    // Ensure alias @ resolves to frontend/src
    cfg.resolve = cfg.resolve || {}
    cfg.resolve.alias = {
      ...(cfg.resolve.alias || {}),
      '@': new URL('../frontend/src', import.meta.url).pathname,
    }
    return cfg
  },
}
export default config
```

### Task 3 (auto) — `.storybook/preview.tsx`

```tsx
import type { Preview } from '@storybook/react'
import '../frontend/src/index.css' // picks up @plugin @heroui/styles + @theme {}
import { DesignProvider } from '@/design-system/DesignProvider'

const preview: Preview = {
  globalTypes: {
    direction: {
      name: 'Direction',
      defaultValue: 'chancery',
      toolbar: {
        items: [
          { value: 'chancery', title: 'Chancery' },
          { value: 'situation', title: 'Situation Room' },
          { value: 'ministerial', title: 'Ministerial' },
          { value: 'bureau', title: 'Bureau' },
        ],
      },
    },
    mode: { name: 'Mode', defaultValue: 'light', toolbar: { items: ['light', 'dark'] } },
    density: {
      name: 'Density',
      defaultValue: 'comfortable',
      toolbar: { items: ['comfortable', 'compact', 'dense'] },
    },
    hue: { name: 'Hue', defaultValue: 22 },
  },
  decorators: [
    (Story, ctx) => (
      <DesignProvider
        initialDirection={ctx.globals.direction}
        initialMode={ctx.globals.mode}
        initialDensity={ctx.globals.density}
        initialHue={ctx.globals.hue}
      >
        <Story />
      </DesignProvider>
    ),
  ],
}
export default preview
```

### Task 4 (auto) — `TokenGrid.stories.tsx`

Render every component × every surface × every signal:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { HeroUICard, HeroUICardHeader, HeroUICardBody } from '@/components/ui/heroui-card'
import { HeroUIChip } from '@/components/ui/heroui-chip'
import { Skeleton } from '@/components/ui/skeleton'
import { HeroUIModal } from '@/components/ui/heroui-modal'
import { TextField, Checkbox, Switch } from '@/components/ui/heroui-forms'

const meta: Meta = { title: 'DesignSystem/TokenGrid' }
export default meta
type Story = StoryObj

export const AllComponents: Story = {
  render: () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-gap p-pad-inline bg-bg text-ink">
      {/* Buttons — all variants + SLA accents */}
      <section className="space-y-gap p-pad-inline bg-surface rounded-DEFAULT shadow-card">
        <h3 className="text-ink">Buttons</h3>
        <Button variant="default">Primary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button className="bg-sla-ok text-accent-fg">SLA OK</Button>
        <Button className="bg-sla-risk text-accent-fg">SLA Risk</Button>
        <Button className="bg-sla-bad text-accent-fg">SLA Bad</Button>
      </section>

      {/* Cards */}
      <HeroUICard className="bg-surface border-line">
        <HeroUICardHeader>
          <h3>Card Header</h3>
        </HeroUICardHeader>
        <HeroUICardBody className="text-ink-mute">Body in ink-mute</HeroUICardBody>
      </HeroUICard>

      {/* Chips for semantic signals */}
      <section className="space-y-gap p-pad-inline bg-surface-raised">
        <HeroUIChip>Default</HeroUIChip>
        <HeroUIChip className="bg-ok text-accent-fg">OK</HeroUIChip>
        <HeroUIChip className="bg-warn text-accent-fg">Warn</HeroUIChip>
        <HeroUIChip className="bg-info text-accent-fg">Info</HeroUIChip>
        <HeroUIChip className="bg-danger text-accent-fg">Danger</HeroUIChip>
      </section>

      {/* Skeletons */}
      <section className="space-y-gap">
        <Skeleton className="h-row-h w-full" />
        <Skeleton className="h-pad-inline w-3/4" />
      </section>

      {/* Forms */}
      <section className="space-y-gap">
        <TextField label="Email" placeholder="you@example.com" />
        <Checkbox>Checkbox</Checkbox>
        <Switch>Switch</Switch>
      </section>

      {/* Modal trigger (closed by default in story, but renders token preview) */}
      <section>
        <HeroUIModal open={false} onOpenChange={() => {}}>
          <div>Modal preview</div>
        </HeroUIModal>
      </section>
    </div>
  ),
}
```

**NO per-component color overrides are allowed outside the `bg-sla-*` and semantic `bg-danger/ok/warn/info` tokens** — those ARE the engine's contract, not hacks.

### Task 5 (auto) — Boot Storybook and smoke-test

```bash
pnpm --filter frontend dlx storybook dev -p 6006
```

Navigate to `http://localhost:6006`, select `DesignSystem/TokenGrid/AllComponents`. Use the toolbar to flip direction, mode, density. Every visible pixel should update.

### Task 6 (checkpoint:decision) — Visual-regression tool

<task type="checkpoint:decision" gate="blocking">
  <decision>Which visual regression tool for the token grid?</decision>
  <context>
    RESEARCH Q6 evaluated three options. The repo already uses `@playwright/test@^1.58.2`, so the Storybook
    Test Runner + Playwright path reuses existing infra. Chromatic is faster to set up but SaaS.
  </context>
  <options>
    <option id="option-test-runner">
      <name>Storybook Test Runner + Playwright snapshots (recommended)</name>
      <pros>Reuses existing Playwright; self-hosted; no SaaS cost; baselines live in git</pros>
      <cons>More config; CI runs ~2-3 min for 72 variants</cons>
    </option>
    <option id="option-chromatic">
      <name>Chromatic</name>
      <pros>Fastest setup; best DX; parallel runs</pros>
      <cons>SaaS; per-run cost; requires API key in CI secrets</cons>
    </option>
    <option id="option-playwright-ct">
      <name>Playwright Component Tests (no Storybook runner)</name>
      <pros>Most direct integration; no Storybook boot cost</pros>
      <cons>Component tests are a different mental model from stories; duplicate component definitions</cons>
    </option>
  </options>
  <resume-signal>Select: option-test-runner, option-chromatic, or option-playwright-ct</resume-signal>
</task>

### Task 7 (auto) — Apply chosen option and write the test

If option-test-runner:

```bash
pnpm --filter frontend add -D @storybook/test-runner
```

Create `frontend/tests/storybook/token-grid.spec.ts` that iterates the 4×2×3×3 = 72 global combinations and takes a screenshot per combination. Assert `maxDiffPixelRatio ≤ 0.02`.

If option-chromatic: add `chromatic` devDep + CI step.

If option-playwright-ct: migrate the story to a CT file.

### Task 8 (auto) — CI wiring

Add a `pnpm --filter frontend storybook:test` script to `package.json`. If CI config exists (`.github/workflows/`), add a Storybook test job gated on PR touching `frontend/src/design-system/` or `frontend/src/components/ui/`.

## Definition of done

- [ ] `pnpm --filter frontend storybook` starts Storybook without errors
- [ ] TokenGrid story renders at http://localhost:6006
- [ ] Toolbar controls flip direction/mode/density/hue globals; story visually updates within 100 ms
- [ ] 72 baseline screenshots captured, human-reviewed once
- [ ] `pnpm --filter frontend storybook:test` passes in a clean run
- [ ] `pnpm --filter frontend build` succeeds (Storybook install didn't break main build)
- [ ] `pnpm --filter frontend build-storybook` produces static Storybook output for deployment-preview if needed
- [ ] No per-component color overrides audit: `grep -rn "bg-\(red\|blue\|green\|yellow\|slate\|zinc\)" frontend/src/design-system/stories/` returns 0
- [ ] RTL toggle: switch story locale globals to AR (or add a `locale` global) — layout still renders correctly

## Requirements satisfied

- TOKEN-05 (full — Storybook-based visual verification)

## Success Criteria contribution

- SC-5 (primary verification): the grid story + 72-baseline snapshot is the living proof that all 8 components consume the tokens correctly across every combination. Any regression trips a CI failure.

## Risks / unknowns

- **HeroUI v3 + Storybook uncharted** (RESEARCH Q6 Gotcha): no first-party recipe. Mitigation: the CSS import in `preview.tsx` provides the same runtime environment as the app; if a component fails to render, debug in isolation.
- **72-baseline flake**: font loading, async layout. Mitigation: `await page.evaluate(() => document.fonts.ready)` before snapshot; `maxDiffPixelRatio: 0.02`.
- **Tailwind v4 + Storybook**: RESEARCH Q6 confirms `viteFinal` works — but earlier versions had a known breakage (tailwindlabs#16451). Pin Tailwind version.
- **Monorepo paths**: `.storybook/` at repo root references `../frontend/src`. If pnpm workspace resolution gets confused, move `.storybook/` under `frontend/` and adjust paths.

## Verification

```bash
pnpm --filter frontend storybook
# Manual: visit localhost:6006 → DesignSystem/TokenGrid/AllComponents → flip toolbar globals
pnpm --filter frontend build-storybook
pnpm --filter frontend storybook:test
```
