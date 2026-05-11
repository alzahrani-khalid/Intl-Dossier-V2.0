---
phase: 33-token-engine
plan: 00
type: overview
wave: 0
depends_on: []
files_modified: []
autonomous: true
requirements: [TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06]
must_haves:
  truths: ['Plan DAG is explicit', 'Wave ordering is derivable']
  artifacts: []
  key_links: []
---

# Phase 33 — Token Engine — Plan Overview

**Goal:** Reactive `:root` token engine (direction × mode × hue × density → OKLCH vars) consumed by Tailwind v4 `@theme` and HeroUI v3 `@plugin '@heroui/styles'` with zero per-component overrides.

## Wave DAG

```
Wave 1 (foundation, no deps)
├── 33-01-token-module        (pure TS: buildTokens, applyTokens, types, directions, densities)
└── 33-04-heroui-install      (pnpm add @heroui/react @heroui/styles; @plugin in index.css)

Wave 2 (depends on Wave 1)
├── 33-02-design-provider     (needs 33-01 for applyTokens + types)
├── 33-03-fouc-bootstrap      (needs 33-01 palette literals)
└── 33-06-tailwind-remap      (needs 33-04 for @plugin order; needs 33-01 var names)

Wave 3 (depends on Wave 2)
├── 33-05-heroui-wrappers     (needs 33-02 for useDesignDirection, 33-04 for @heroui/react)
├── 33-07-legacy-cut          (needs 33-02 to replace ThemeProvider, 33-06 to keep semantics)
└── 33-08-storybook           (needs 33-02, 33-04, 33-05, 33-06 to render grid)

Wave 4 (verification)
└── 33-09-e2e-verification    (optional; E2E across 5 success criteria)
```

## Coverage map

| SC                                                       | Covered by                   |
| -------------------------------------------------------- | ---------------------------- |
| SC-1 direction setter updates all vars                   | 33-01, 33-02                 |
| SC-2 mode toggle flips OKLCH math                        | 33-01 (math), 33-02 (wiring) |
| SC-3 hue picker recomputes accent + SLA                  | 33-01, 33-02                 |
| SC-4 density switch updates row-h/pad/gap (RTL-safe)     | 33-01, 33-02                 |
| SC-5 HeroUI + Tailwind consume same vars, zero overrides | 33-04, 33-05, 33-06          |

| REQ                                       | Covered by   |
| ----------------------------------------- | ------------ |
| TOKEN-01 OKLCH engine                     | 33-01, 33-02 |
| TOKEN-02 FOUC bootstrap                   | 33-03        |
| TOKEN-03 Direction × mode × hue × density | 33-01, 33-02 |
| TOKEN-04 Tailwind + HeroUI bridge         | 33-04, 33-06 |
| TOKEN-05 Storybook verification           | 33-05, 33-08 |
| TOKEN-06 Legacy hard cut                  | 33-07        |

## Plan register

- 33-01-token-module-PLAN.md (Wave 1)
- 33-02-design-provider-PLAN.md (Wave 2, deps: 33-01)
- 33-03-fouc-bootstrap-PLAN.md (Wave 2, deps: 33-01)
- 33-04-heroui-install-PLAN.md (Wave 1)
- 33-05-heroui-wrappers-PLAN.md (Wave 3, deps: 33-02, 33-04)
- 33-06-tailwind-remap-PLAN.md (Wave 2, deps: 33-01, 33-04)
- 33-07-legacy-cut-PLAN.md (Wave 3, deps: 33-02, 33-06)
- 33-08-storybook-PLAN.md (Wave 3, deps: 33-02, 33-04, 33-05, 33-06)
- 33-09-e2e-verification-PLAN.md (Wave 4, deps: 33-02..33-08)

## Cross-cutting notes applied to all plans

- **D-06 correction:** No `frontend/heroui.config.ts` — HeroUI v3 config is CSS-native (`@plugin` + `@theme` in `index.css`). Confirmed by RESEARCH.md Q1.
- **Name collision resolution:** Existing `frontend/src/hooks/useDirection.ts` (reads `document.dir`) is renamed to `frontend/src/hooks/useDomDirection.ts`. New design-system hook is named `useDesignDirection` and lives at `frontend/src/design-system/hooks/useDesignDirection.ts`. Every call site updated in Plan 33-07.
- **No barrel files:** `frontend/src/design-system/tokens/index.ts` is OMITTED per PATTERNS.md — project convention is leaf-file imports.
- **250-file Tailwind remap is load-bearing:** Plan 33-06's DoD includes a Playwright screenshot sweep across 3 routes × 2 modes × 2 locales × 2 viewports (24 baselines).
- **Legacy audit is 25 files, not 16:** Plan 33-07 explicitly enumerates all 25.
- **CSP risk:** Plan 33-03 audits nginx / docker-compose CSP headers before committing to inline bootstrap.
