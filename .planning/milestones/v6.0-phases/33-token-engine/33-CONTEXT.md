# Phase 33: Token Engine - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 33 delivers a reactive `:root` token system where four inputs — `direction` (Chancery / Situation Room / Ministerial / Bureau) × `mode` (light / dark) × `hue` (0–360°) × `density` (comfortable / compact / dense) — deterministically compute every surface / ink / accent / line / sidebar / SLA / density CSS variable via OKLCH math, and both **Tailwind v4** (via `@theme` bridge) and **HeroUI v3** (via `@heroui/styles`) consume the same vars with zero per-component overrides.

**In scope for Phase 33:** token engine module, runtime application pipeline, OKLCH math, Tailwind `@theme` binding, HeroUI v3 install + semantic bridge + 8 wrappers, legacy HSL token removal, `DesignProvider` + hooks, initial FOUC-safe bootstrap.

**Out of scope (owned by later phases):**

- Tweaks drawer UI / controls — **Phase 34**
- Per-direction font stacks (Fraunces, Space Grotesk, Public Sans, Inter, IBM Plex, JetBrains Mono, Tajawal) — **Phase 35**
- Shell chrome / sidebar / topbar — **Phase 36**
- Signature visuals (GlobeLoader, DossierGlyph, Sparkline, Donut) — **Phase 37**
- Removal of `/themes` route + `ThemeSelector.tsx` file — **Phase 34** (files become dead code after Phase 33 hard cut — see cross-phase note)

</domain>

<spec_lock>

## Requirements (locked via ROADMAP.md + REQUIREMENTS.md)

**6 requirements are locked.** See `.planning/ROADMAP.md` §Phase 33 and `.planning/REQUIREMENTS.md` §TOKEN for full requirements and acceptance criteria.

Downstream agents MUST read those files before planning. Requirements are not duplicated here.

**Locked requirement IDs:** TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06

**Dependencies:** None (foundation phase).

</spec_lock>

<decisions>
## Implementation Decisions

### Token Application Mechanism (Area 1)

- **D-01** — **Runtime TS `buildTokens({direction, mode, hue, density})`** computes the full OKLCH var set and writes to `document.documentElement.style` via `setProperty` on every mutation. Matches handoff `themes.jsx` 1:1 and handles any hue 0–360° without pre-bake. Rejected alternatives: static pre-baked classes (can't satisfy free-form hue), pure `@theme` + `color-mix` (OKLCH lightness flip is awkward), hybrid static/runtime (two systems to maintain).
- **D-02** — **New module `frontend/src/design-system/tokens/`** with files:
  - `directions.ts` — per-direction palette objects (Chancery/Situation/Ministerial/Bureau)
  - `densities.ts` — density records (comfortable/compact/dense)
  - `buildTokens.ts` — pure function mapping `{dir, mode, hue, density}` → flat `Record<string, string>` of CSS var name/value pairs
  - `applyTokens.ts` — imperative writer that calls `documentElement.style.setProperty(name, value)` for each entry; returns a cleanup that removes all previously set vars
  - `types.ts` — `Direction`, `Mode`, `Hue`, `Density`, `TokenSet` types
  - `index.ts` — barrel export
- **D-03** — **Blocking inline script in `frontend/index.html`** reads `localStorage` keys (`id.dir`, `id.theme`, `id.hue`, `id.density`) and applies the initial token set to `<html>` BEFORE stylesheets load. Zero FOUC. The token math is inlined (not an ESM import) so it runs synchronously. Keep the inline script small (~2 KB) by duplicating only the minimum math needed; the full TS module owns subsequent updates.
- **D-04** — **Density exposes logical `--pad-inline`, `--pad-block`, `--gap`, `--row-h`**; consumers use `padding-inline: var(--pad-inline)` etc. RTL-safe by construction (no physical l/r pairs). Values: comfortable 52/20/16 → compact 40/14/12 → dense 32/10/8 (row-h/pad/gap).

### HeroUI v3 Bridge (Area 2)

- **D-05** — **Install `@heroui/react` + `@heroui/styles` in Phase 33**. Build full bridge + all 8 wrappers from CLAUDE.md (Button/Card/Chip/Modal/Skeleton/TextField/Switch/Checkbox). Satisfies TOKEN-05 in Phase 33's definition-of-done rather than amending SPEC.
- **D-06** — **`frontend/heroui.config.ts` uses direct `var(--*)` refs**: `primary: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-fg)' }`, `danger: 'var(--danger)'`, `success: 'var(--ok)'`, `warning: 'var(--warn)'`, `default: 'var(--surface)'`. Pure reference, no duplication — HeroUI auto-follows direction/hue/mode changes because it reads the same vars the engine writes.
- **D-07** — **Replace existing shadcn wrappers in-place**: `frontend/src/components/ui/heroui-button.tsx` (etc.) render real `@heroui/react` components; `frontend/src/components/ui/button.tsx` re-exports from them. Preserves `React.HTMLAttributes` pass-through and `asChild` via `@radix-ui/react-slot`. All existing call sites keep working.
- **D-08** — **Storybook token grid story** verifies TOKEN-05. One story renders all 8 HeroUI components across 4 directions × 2 modes × 3 densities × 3 sample hues. Visual diff + Chromatic-style snapshot (or Playwright component test) catches per-component regressions.
- **Scope add** — **Storybook install is new scope** for this phase. Add `@storybook/react-vite` + HeroUI-compatible config. Planner must include as its own plan.

### Legacy Theme Migration (Area 3)

- **D-09** — **Hard cut**: delete the entire HSL token system in Phase 33:
  - Remove `--base-50..1000` and `--primary-50..1000` HSL scales from `frontend/src/index.css`
  - Remove `canvas | azure | lavender | bluesky` theme enum + `AVAILABLE_THEMES` export
  - Remove HSL-era `[data-theme='canvas']` / `[data-theme='azure']` / etc. CSS blocks
  - Audit all 16 files referencing legacy theme names and update them
- **D-10** — **No migration**: wipe old `theme` / `colorMode` localStorage keys on first load after Phase 33 deploys; all users default to **Chancery / light / 22° / comfortable**. Migration banner/toast not worth the complexity.
- **D-11** — **Replace `ThemeProvider` with `DesignProvider`** exposing `useDirection()`, `useMode()`, `useHue()`, `useDensity()`, plus `useDesignTokens()` for read-only access to the resolved token set. Keep legacy `useTheme()` as a **thin shim** that calls `useDirection() + useMode()` and returns the old `{theme, colorMode, setTheme, setColorMode}` shape with a `console.warn('useTheme is deprecated')`. Shim is removed in Phase 34 when the Tweaks drawer replaces the last consumer.
- **D-12** — **Remap Tailwind semantic classes** (`tailwind.config.ts`): `primary → var(--accent)`, `primary-foreground → var(--accent-fg)`, `foreground → var(--ink)`, `muted-foreground → var(--ink-mute)`, `border → var(--line)`, `background → var(--bg)`, `card → var(--surface)`, `card-foreground → var(--ink)`, `popover → var(--surface-raised)`. Every existing `bg-primary / text-foreground / border-border` usage keeps rendering correctly, now following the new engine.

### Token Set Canonicalization (Area 4)

- **D-13** — **Port handoff set 1:1 + essential additions**. Final canonical list:
  - **Surfaces/ink/lines:** `--bg`, `--surface`, `--surface-raised`, `--ink`, `--ink-mute`, `--ink-faint`, `--line`, `--line-soft`, `--sidebar`, `--sidebar-ink`
  - **Accent family:** `--accent`, `--accent-ink`, `--accent-soft`, `--accent-fg`
  - **Semantic:** `--danger`, `--ok`, `--warn`, `--info`
  - **SLA:** `--sla-ok`, `--sla-risk` (hue+55° warm shift), `--sla-bad` (hue-locked red, e.g. `oklch(60% 0.2 25)`)
  - **Density:** `--row-h`, `--pad-inline`, `--pad-block`, `--gap`
  - **Radius:** `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--field-radius`
  - **Additions (for downstream phases):** `--focus-ring`, `--shadow-drawer` (`-24px 0 60px rgba(0,0,0,.25)` — needed by Phase 41), `--shadow-card`
- **D-14** — **Density controls only row-h/pad-inline/pad-block/gap**. Type scale stays fixed (direction-driven per Phase 35, not density-driven). Radius stays fixed (not density-driven).
- **D-15** — **Named semantic tokens only** — no numeric `--accent-50..900` scales. Mid-shades composed via `color-mix(in oklch, var(--accent), var(--bg) 50%)` where needed. Keeps `:root` lean (~30 vars).
- **D-16** — **Full Tailwind utility set** via `@theme`: every named token gets a utility binding. Exports at minimum: `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-accent`, `bg-accent-soft`, `bg-sidebar`, `bg-danger`, `bg-ok`, `bg-warn`, `bg-info`, `text-ink`, `text-ink-mute`, `text-ink-faint`, `text-accent`, `text-accent-ink`, `text-accent-fg`, `text-sidebar-ink`, `border-line`, `border-line-soft`, `bg-sla-ok`, `bg-sla-risk`, `bg-sla-bad`. Downstream phases (Phase 36 shell, Phase 38 dashboard, etc.) can compose directly in JSX.

### Claude's Discretion

- **Hue input surface** (slider + color puck vs numeric input): Phase 34 scope.
- **Exact direction palette values** (per-direction `bg`, `surface`, `ink`, `line`, `sidebar` defaults): port verbatim from `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` `buildTokens()`. Claude follows the handoff literally.
- **Direction defaults per REQ TOKEN (implied by Phase 34 SC-3)**: Chancery = light / 22°, Situation = dark / 190°, Ministerial = light / 158°, Bureau = light / 32°. Engine exposes these as `getDirectionDefaults(dir)`.
- **React hook re-render strategy** (context vs `useSyncExternalStore` on a token store): Claude picks at plan time based on perf measurement.

</decisions>

<cross_phase_notes>

## Cross-Phase Flags

- **Phase 34 flag**: `pages/Themes.tsx` + `routes/_protected/themes.tsx` + `components/theme-selector/ThemeSelector.tsx` become DEAD CODE after Phase 33's hard cut. Phase 34 SC-5 already owns deleting them — Phase 34 planner must confirm.
- **Phase 35 flag**: Phase 33 exposes `--font-display`, `--font-body`, `--font-mono` as EMPTY string vars (placeholders). Phase 35 populates them per direction. Until Phase 35 lands, fonts fall back to system-ui (acceptable transitional state).
- **Phase 41 flag**: Drawer shadow is hard-coded in handoff as `-24px 0 60px rgba(0,0,0,.25)`. Phase 33 exposes it as `--shadow-drawer` so Phase 41 consumes the token, not the literal.
- **Phase 43 flag**: RTL / a11y / responsive sweep phase will audit zero-override claim. If any HeroUI component needs a per-component override during later phases, log it here as a potential SPEC violation.

</cross_phase_notes>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-defining docs

- `.planning/ROADMAP.md` §Phase 33 — goal, SCs 1–5, dependencies
- `.planning/REQUIREMENTS.md` §Token Engine (TOKEN-01..06) — acceptance criteria for each requirement

### Handoff bundle (design source of truth)

- `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` — **the canonical `buildTokens()` implementation**. TS port must preserve OKLCH math, direction palettes, and density values exactly.
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` — handoff CSS consuming the vars; shows the shape the token engine must satisfy.
- `/tmp/inteldossier-handoff/inteldossier/project/src/tweaks.jsx` — reference for hue gradient (`oklch(58% 0.14 <h>)`); Phase 34 will consume this.

### Project conventions

- `CLAUDE.md` §UI Component Guidelines — HeroUI v3 wrapper pattern, component hierarchy, compound components
- `CLAUDE.md` §Arabic RTL Support — logical properties only; drives D-04 density decision
- `CLAUDE.md` §Mobile-First & Responsive Design — breakpoints & touch targets (relevant when Phase 36+ consumes tokens)

### External docs (to fetch during research)

- Tailwind CSS v4 `@theme` directive docs — required for D-12 + D-16
- HeroUI v3 `@heroui/styles` semantic color mapping docs — required for D-06
- OKLCH color space overview + `color-mix(in oklch, …)` browser support — informs D-15

### Current codebase integration points

- `frontend/src/index.css` — current HSL tokens to be removed per D-09
- `frontend/src/components/theme-provider/theme-provider.tsx` — to be rewritten as `DesignProvider` per D-11
- `frontend/src/components/theme-selector/ThemeSelector.tsx` — dead after Phase 33; Phase 34 deletes
- `frontend/tailwind.config.ts` — semantic class remap per D-12; `@theme` additions per D-16
- `frontend/index.html` — inline FOUC-prevention script per D-03
- `frontend/package.json` — add `@heroui/react`, `@heroui/styles`, `@storybook/react-vite` per D-05 + D-08

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Tailwind v4 (`^4.2.2`) already installed** — `@tailwindcss/vite` plugin configured; `frontend/src/index.css` has `@import 'tailwindcss'` + `@config` directive. `@theme` directive is available natively.
- **`ThemeProvider` pattern** (`frontend/src/components/theme-provider/theme-provider.tsx`) — existing React context + localStorage + `data-theme` attribute writer. Useful scaffold for `DesignProvider` structure; API completely rewritten.
- **Radix primitives** (`@radix-ui/react-*`) remain in place — used by current shadcn wrappers; HeroUI wrappers keep `@radix-ui/react-slot` for `asChild` per D-07.
- **`vite.config.ts`** — can extend with any inline-script-gen plugin if D-03 needs build-time token generation. (Likely not needed — inline literal is fine.)

### Established Patterns

- **Provider stack** (`frontend/src/main.tsx` → `App.tsx`) — `DesignProvider` drops in at the same level as the current `ThemeProvider`.
- **`useTranslation()` i18n pattern** — RTL detection (`isRTL = i18n.language === 'ar'`) is orthogonal to direction/mode; token engine stays locale-agnostic. Phase 35 adds the Tajawal override.
- **Shadcn-style re-export layer** (`components/ui/*.tsx` → `components/ui/heroui-*.tsx`) — D-07 keeps this pattern, swaps implementation behind the facade.
- **Zero HeroUI currently** — `@heroui/react` and `@heroui/styles` are NOT in `frontend/package.json` despite CLAUDE.md docs. Confirmed by grep. Phase 33 installs them per D-05.

### Integration Points

- **`frontend/src/index.css`** — replace HSL token blocks with:
  1. `@theme` block binding Tailwind utilities to new vars (D-16)
  2. Empty `:root { }` (vars set at runtime by applyTokens per D-03 bootstrap)
  3. Semantic remap block for legacy class compatibility (D-12)
- **`frontend/src/main.tsx`** — wrap root in `<DesignProvider>` (D-11).
- **`frontend/index.html`** — inline bootstrap script inserted before the main `<script type="module">` tag (D-03).
- **`frontend/tailwind.config.ts`** — semantic remap (D-12) + utility additions via `@theme` (D-16).
- **HeroUI wrappers** — populate `frontend/src/components/ui/heroui-{button,card,chip,modal,skeleton,textfield,switch,checkbox}.tsx` rendering real HeroUI components (D-07).

### Migration Risk Hotspots

- `16 files` reference legacy theme names (`canvas|azure|lavender|bluesky`) — planner must price in an audit sweep.
- `40 data-theme matches` across the codebase — mostly CSS selectors; grep + replace.
- `10+ files` use `bg-primary` / `text-foreground` / `border-border` semantic classes — D-12 makes these still work; no file-by-file changes needed for these classes.

</code_context>

<specifics>
## Specific Ideas

- **OKLCH math is non-negotiable** — port `buildTokens()` literally from `themes.jsx`. Don't translate to HSL or RGB.
- **`--sla-risk` = `oklch(58% 0.14 <hue+55°>)`** (accent shifted 55° warm). `--sla-bad` = hue-locked red.
- **Direction defaults match Phase 34 SC-3**: Chancery `{light, 22°}`, Situation `{dark, 190°}`, Ministerial `{light, 158°}`, Bureau `{light, 32°}`.
- **localStorage keys** fixed by Phase 34 SC-2 contract: `id.dir`, `id.theme`, `id.hue`, `id.density`, `id.classif`, `id.locale`. Phase 33 only owns the first four; `id.classif` and `id.locale` stay untouched.
- **Dark mode lightness rules** (Phase 33 SC-2): `--accent-ink` lightness flips (dark: 72%, light: 42%); `--accent-soft` chroma flips (dark: 0.08, light: 0.05); danger/ok/warn/info use dark-variant lightness values.

</specifics>

<deferred>
## Deferred Ideas

- **Per-component HeroUI overrides** — if any component needs an override during later phases, revisit as a SPEC violation (Phase 43 audits).
- **Scoped tokens per route** (e.g., dashboard uses different surface) — not in handoff; out of scope.
- **User-custom direction** (create-your-own 5th direction) — Phase 34+ backlog idea.
- **Runtime theme preview in dev tools** — would be nice for debugging; not required by any REQ.
- **Performance: batching `setProperty` calls** — measure first; if >16ms on direction switch, add `requestAnimationFrame` batching. Claude's discretion during plan execution.
- **Accent contrast auto-correction** — if user picks a hue that fails WCAG AA against surface, warn or clamp. Phase 43 may enforce.

</deferred>

---

_Phase: 33-token-engine_
_Context gathered: 2026-04-19_
