# Stack Research

**Domain:** Design-system migration (shadcn/ui RTL + Linear token system + HeroUI v3 + Aceternity removal) on an existing React 19 + Vite + Tailwind v4 + Supabase app
**Researched:** 2026-07-01
**Confidence:** HIGH (verified against live `frontend/` deps, npm registry, and official shadcn/HeroUI/React-Aria docs)

## Executive correction (read first)

The milestone brief describes several things that are **already true in the codebase** or **stated wrong**. Verifying against `frontend/package.json` and the live docs changes the plan materially:

| Brief claim                                                                            | Verified reality                                                                                                                                                                                                                                                                                | Impact                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "migrating from HeroUI **v2** to **v3** (beta), no v2 migration tool"                  | `@heroui/react@3.0.5` + `@heroui/styles@3.0.5` are **already installed**; there is **no HeroUI v2** and **no `HeroUIProvider`** anywhere in `src/`. v3 is **GA** (npm `latest: 3.2.1`), not beta.                                                                                               | This is **not** a v2→v3 migration. It is a **3.0.5 → 3.2.1 minor bump** plus adopting v3's compound-component API where wrappers still use old shapes. No mass rewrite, no provider to remove.                                                                        |
| "shadcn RTL shipped Jan 2026 — enable `rtl: true` + `migrate rtl` + DirectionProvider" | Correct and current. But the repo's `components.json` uses `"style": "new-york"`; **automatic CLI RTL transforms are only guaranteed for the new `*-nova` styles**. On `new-york`, `migrate rtl` still runs but you must treat its output as a **first pass to review**, not a trusted rewrite. | The app **already enforces logical properties via ESLint** (`rtl-friendly`, zero physical classes in `frontend/**`). So `migrate rtl`'s main value here is limited to the `components/ui/**` wrappers (which are ESLint-exempt) — most app code is already RTL-clean. |
| "derive a token system ... plus a bootstrap.js FOUC script"                            | `public/bootstrap.js` (7.9 KB) and the `@theme` block in `src/index.css` **already exist** from v6.0. The FOUC bootstrap **byte-mirror invariant** (literals must match `tokens/directions.ts`) is an established, load-bearing constraint.                                                     | You are **re-skinning an existing token engine to the Linear palette**, not building one. Add a new `linear` (or renamed `bureau`) direction to `tokens/directions.ts` + mirror it in `bootstrap.js`. Do not introduce a parallel system.                             |
| "removing Aceternity from 5 form components"                                           | **8** files import Aceternity (`SmartInput`, `SearchableSelect`, `FormFieldWithValidation`, + 5 `Form*Aceternity.tsx`). Aceternity is **already ESLint-banned** via `no-restricted-imports`; the `@aceternity-pro` registry is still in `components.json`.                                      | Scope is 8 files, not 5. The ban already exists — removal closes the last live imports and drops the registry entry.                                                                                                                                                  |
| "tw-animate-css if it's still broken for RTL"                                          | `tw-animate-css@1.4.0` is installed and imported in `index.css`. The RTL bug is **real and current** (shadcn docs: logical slide utilities don't work).                                                                                                                                         | Keep `tw-animate-css` (don't rip it out — it's wired into HeroUI's CSS composition), but apply the documented workaround: pass `dir="rtl"` directly to portal content (`PopoverContent`, `TooltipContent`, dialog/drawer portals).                                    |

**Net:** this milestone is a **re-skin + minor version bumps + dead-import removal**, not four large migrations. The stack additions below are small.

## Recommended Stack

### Core Technologies

| Technology                               | Version                                                   | Purpose                                                          | Why Recommended                                                                                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@heroui/react` + `@heroui/styles`       | `3.2.1` (bump from `3.0.5`)                               | Accessible primitives on React Aria Components                   | Already the primary primitive layer. `3.2.x` has the improved RTL fixes across Table/pickers/MenuItem (v3 release notes). Bump both in lockstep — they are version-coupled.                                                                                      |
| `shadcn` (CLI, dev-only, via `pnpm dlx`) | `4.12.0` (`latest`)                                       | RTL migration + `direction` component scaffolding                | The Jan-2026 RTL feature (`migrate rtl`, `add direction`, `rtl: true`) lives in current CLI. Never pin as a dep — invoke with `pnpm dlx shadcn@latest`.                                                                                                          |
| `tailwindcss` + `@tailwindcss/vite`      | `4.3.0` (no change)                                       | CSS-first `@theme` token layer                                   | Already installed; HeroUI v3 and shadcn RTL both **require** v4. No upgrade needed. Linear tokens go into the existing `@theme` block in `src/index.css`.                                                                                                        |
| `@react-aria/i18n` (`I18nProvider`)      | `3.13.0` (transitive, **re-exported by `@heroui/react`**) | Set React Aria locale → derives RTL for all HeroUI v3 components | Verified: `require('@heroui/react').I18nProvider` resolves. HeroUI v3 has **no provider**, but React Aria components need a locale source for RTL. Wrapping in `<I18nProvider locale="ar">` is the single switch that makes every HeroUI picker/table/menu flip. |

### Supporting Libraries

| Library                               | Version                                        | Purpose                                                                             | When to Use                                                                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@radix-ui/react-direction`           | `^1.1.x` (pulled in by `shadcn add direction`) | Backs the shadcn `DirectionProvider`/`useDirection`                                 | Only if you adopt shadcn's generated `direction` component. Given the app already has `useDesignDirection`/`useLocale` in `design-system/hooks`, you likely **bridge existing hooks into a thin DirectionProvider** rather than adopt shadcn's verbatim. |
| `@fontsource-variable/inter`          | `^5.2.8` (**already installed**)               | Linear body/display font (Inter is the closest OSS analog to "Linear Display/Text") | Already present. Linear's own fonts are proprietary; Inter Variable is the standard substitute. Wire into `--font-body`/`--font-display`.                                                                                                                |
| `@fontsource-variable/jetbrains-mono` | `^5.2.8` (**already installed**)               | Linear Mono analog                                                                  | Already present. Wire into `--font-mono`. Keep `@fontsource/tajawal` for the Arabic cascade — Inter has no Arabic coverage.                                                                                                                              |
| `tw-animate-css`                      | `1.4.0` (no change, **keep**)                  | Enter/exit animations for shadcn + composed into HeroUI CSS                         | Keep it. Apply the `dir="rtl"` portal workaround for its broken logical slide utilities — do **not** remove it.                                                                                                                                          |

### Development Tools

| Tool                                                        | Purpose                                                 | Notes                                                                                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dlx shadcn@latest migrate rtl "src/components/ui/**"` | One-shot logical-property conversion of the ui wrappers | Scope it to `components/ui/**` (the ESLint-exempt wrappers). App code is already logical-only, so a repo-wide run is noise. **Review the diff** — on `new-york` style it is best-effort, not authoritative. |
| `pnpm dlx shadcn@latest add direction`                      | Scaffolds `components/ui/direction.tsx` (Radix-backed)  | Optional. Prefer bridging your existing `useLocale` into it so there's one direction source, not two.                                                                                                       |
| ESLint `rtl-friendly` + `no-restricted-imports`             | Already-live gates                                      | The Aceternity ban and physical-class ban already exist. They will fail CI the moment a Linear re-skin reintroduces a raw hex or `ml-*` — lean on them as the regression net.                               |

## Installation

```bash
# HeroUI minor bump (lockstep — both packages)
pnpm --filter frontend up @heroui/react@3.2.1 @heroui/styles@3.2.1

# shadcn RTL is CLI-only — never add as a dependency
pnpm dlx shadcn@latest migrate rtl "src/components/ui/**"   # review the diff
pnpm dlx shadcn@latest add direction                        # optional; bridge to existing hooks

# No new runtime deps required for tokens/fonts/i18n:
#   - Inter/JetBrains-Mono/Tajawal @fontsource already installed
#   - @react-aria/i18n (I18nProvider) already transitive + re-exported by @heroui/react
#   - tailwindcss v4 + @theme already present
```

## Concrete integration details (for the downstream implementer)

### 1. Linear tokens in the existing Tailwind v4 `@theme` (CSS-first)

The `@theme` block in `src/index.css` maps semantic names to `var(--*)` runtime vars written by `DesignProvider` + `bootstrap.js`. **Do not put Linear hex directly in `@theme`** — put it in `tokens/directions.ts` (a new `linear` direction, dark-canonical) and byte-mirror it in `bootstrap.js`. The `@theme` remap layer stays as-is (it already remaps `--color-*` → `var(--bg/--surface/--ink/...)`, preserving ~1,437 existing call sites).

Runtime var values for the Linear dark direction (verbatim from `shadcn.io/design/linear/raw`):

```css
/* tokens/directions.ts → PALETTES.linear.dark (mirror in bootstrap.js literally) */
--bg: #010102; /* canvas */
--surface: #0f1011; /* surface-1 */
--surface-raised: #141516; /* surface-2 (drawers/popovers → #18191a / #191a1b for 3/4) */
--ink: #f7f8f8; /* primary text */
--ink-mute: #d0d6e0; /* muted */
--ink-faint: #8a8f98; /* subtle  (tertiary #62666d for the faintest tier) */
--line: #23252a; /* hairline */
--line-soft: #34343a; /* hairline-strong */
--accent: #5e6ad2; /* Linear lavender-blue */
--accent-fg: #ffffff; /* on-primary */
--accent-soft: #5e69d1; /* primary-focus (or a low-alpha 5e6ad2 wash) */
--ok: #27a644; /* semantic-success */
```

The `@theme` block **already exposes** `bg-bg / bg-surface / text-ink / border-line / bg-accent` etc. against these vars — so re-skinning to Linear is _setting new values in `directions.ts` + `bootstrap.js`_, with **zero churn** at the ~1,437 utility call sites. Radius (`--radius-sm/--radius/--radius-lg`) → Linear's `6/8/12` (pull the fuller `4/16/24/9999` ladder in only where components need it). Fonts: `--font-body`/`--font-display` → `'Inter Variable'`, `--font-mono` → `'JetBrains Mono Variable'`, keeping the Tajawal Arabic cascade for `dir="rtl"`.

**FOUC invariant (non-negotiable):** every literal above must byte-match between `tokens/directions.ts` and `public/bootstrap.js`. This is an established v6.0 constraint (`bootstrap.js` paints first-frame tokens synchronously before React mounts). A mismatch = a flash of the wrong palette.

**Linear type scale gap-fill** (from DESIGN.md, not yet in the token engine): the milestone brief flags "form errors + status-tag palette" as gaps. Linear ships `semantic-success #27a644` but **no error/warning hex** — you must derive a red/amber pair that sits in the same dark-surface luminance band (do not borrow a light-mode `--danger`). Status-tag palette (dossier status chips) likewise needs bespoke values keyed off the surface ladder.

### 2. HeroUI v3 RTL — `I18nProvider`, not a Provider

HeroUI v3 removed the v2 `HeroUIProvider` (already absent here). React Aria components derive RTL from **locale**, so mount `I18nProvider` inside the existing `App.tsx` chain, driven by the current language state:

```tsx
// import from @heroui/react (re-exported) — no new dependency
import { I18nProvider } from '@heroui/react'
// ...inside LanguageProvider, wrapping RTLWrapper/AppRouter:
;<I18nProvider locale={isArabic ? 'ar' : 'en'}>
  <RTLWrapper>{/* … */}</RTLWrapper>
</I18nProvider>
```

Locale `'ar'` → React Aria flips Table, pickers, MenuItem, Calendar automatically. This complements (does not replace) the existing `<html dir>` sync from `i18n/index.ts` and the `DesignProvider` direction. Place it inside `LanguageProvider` so it re-renders on language switch.

### 3. shadcn `DirectionProvider` on Vite (not Next.js)

The shadcn Vite/TanStack pattern is `<DirectionProvider direction="rtl">` from `@/components/ui/direction` (Radix-backed), with `dir`/`lang` set on `<html>` separately. **This app already sets `<html dir>` and has `useLocale`/`useDesignDirection`.** Recommendation: `shadcn add direction`, then edit the generated component so `direction` comes from the existing `useLocale()` hook rather than a static prop — one direction source, wired into the `App.tsx` chain alongside `I18nProvider`. Avoid mounting two independent direction contexts that can disagree.

### 4. tw-animate-css RTL workaround (keep, patch usage)

Known-current bug: `tw-animate-css` logical slide utilities (`slide-in-from-end`) don't resolve under RTL. Workaround from shadcn docs: pass `dir="rtl"` **directly to portal content** — `PopoverContent`, `TooltipContent`, and the dialog/drawer portals. Do not remove `tw-animate-css` (it's composed into `index.css` alongside `@heroui/styles`).

### 5. Manual RTL patches: Calendar, Pagination, Sidebar

shadcn's auto-migration explicitly does **not** cover these three. The app has `react-day-picker@9.14.0` (shadcn Calendar's dep) — the Calendar patch is the RDP `dir` prop plus chevron flip. Budget explicit manual work for each per the component-specific RTL guides.

### 6. Aceternity removal (8 files, ban already live)

Rebuild on the primitive cascade (HeroUI v3 → Radix → custom): the 5 `Form*Aceternity.tsx` + `SmartInput` + `SearchableSelect` + `FormFieldWithValidation`. Then delete the `@aceternity-pro` registry entry from `components.json`. The `no-restricted-imports` ban already fails CI on any Aceternity import, so removal is verifiable by the existing gate. `validation-demo/ValidationDemoPage.tsx` also consumes these — migrate or delete it in the same pass.

## Alternatives Considered

| Recommended                                                      | Alternative                                                          | When to Use Alternative                                                                                                                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bridge existing `useLocale` into a thin `DirectionProvider`      | Adopt shadcn's verbatim `direction.tsx` with static `direction` prop | Only for a greenfield app with no existing direction state. Here it would create a second, desyncable direction source.                                |
| Re-skin the existing `@theme` + `directions.ts` engine to Linear | Build a fresh Linear token file / drop the OKLCH engine              | Never — the FOUC bootstrap, 1,437 call sites, and Tweaks drawer all depend on the current engine. A parallel system guarantees drift.                  |
| `I18nProvider` from `@heroui/react` for HeroUI RTL               | Install `@react-aria/i18n` directly                                  | The re-export is already resolvable; adding the direct dep is redundant weight and risks a version split from HeroUI's pinned React Aria.              |
| Keep `tw-animate-css` + `dir="rtl"` portal workaround            | Rip out `tw-animate-css`, hand-roll animations                       | Removing it would break the HeroUI CSS composition in `index.css` and lose shadcn's enter/exit conventions for more risk than the one-line portal fix. |

## What NOT to Use

| Avoid                                                 | Why                                                                                                                        | Use Instead                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Treating this as a HeroUI **v2→v3** migration         | v3.0.5 is already installed; there is no v2 and no `HeroUIProvider`. A "migration" plan wastes phases on work that's done. | A `3.0.5 → 3.2.1` minor bump + adopt compound API (`Card.Header`) where wrappers lag.                        |
| Re-adding `HeroUIProvider`                            | Removed in v3; does not exist in this package.                                                                             | `I18nProvider locale=…` for RTL; theming is CSS-only via `@heroui/styles`.                                   |
| Removing `tw-animate-css`                             | It's composed into `index.css` with `@heroui/styles`; its RTL bug is fixable, not fatal.                                   | `dir="rtl"` on portal content (`PopoverContent`/`TooltipContent`/dialog/drawer).                             |
| Raw Linear hex in the `@theme` block or in components | Breaks the FOUC byte-mirror invariant and the ESLint no-raw-hex gate (CI-blocking).                                        | Hex lives only in `directions.ts` + `bootstrap.js`; components use `bg-bg`/`text-ink`/`bg-accent` utilities. |
| Repo-wide `migrate rtl`                               | App code is already logical-only (ESLint-enforced); a global run is churn/noise and best-effort on `new-york` style.       | Scope to `src/components/ui/**` and review the diff.                                                         |
| `pnpm dlx shadcn@canary`/`@beta`                      | Unstable; RTL landed in stable `4.x`.                                                                                      | `pnpm dlx shadcn@latest` (4.12.0).                                                                           |
| Pinning `shadcn` as a project dependency              | It's a scaffolding CLI, not a runtime lib.                                                                                 | `pnpm dlx shadcn@latest …` per invocation.                                                                   |

## Version Compatibility

| Package A                                  | Compatible With                       | Notes                                                                                                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@heroui/react@3.2.1`                      | `@heroui/styles@3.2.1`                | **Must** move in lockstep — version-coupled. Repo currently shows a `tailwind-merge` dedupe split (`3.4.0` vs `3.6.0`) across the two styles copies; bumping both cleans it.                                                                                                          |
| `@heroui/react@3.x`                        | `tailwindcss@4.3.0`                   | v3 **requires** Tailwind v4. Import order matters: `@import 'tailwindcss'` **before** `@heroui/styles`. Repo composes `@heroui/styles` sub-paths manually (the `@plugin '@heroui/styles'` JS shim crashes on Tailwind 4.x — documented in `index.css`); keep that manual composition. |
| shadcn RTL (`rtl: true`)                   | `components.json "style": "new-york"` | Auto-transform is **guaranteed** only for `*-nova` styles; on `new-york` `migrate rtl` runs best-effort — review output.                                                                                                                                                              |
| `I18nProvider` (`@react-aria/i18n@3.13.0`) | `@heroui/react@3.2.1`                 | Re-exported by HeroUI; use the re-export to avoid a version split.                                                                                                                                                                                                                    |
| `tw-animate-css@1.4.0`                     | RTL portals                           | Logical slide utils broken under RTL → `dir="rtl"` portal workaround required.                                                                                                                                                                                                        |

## Sources

- Live repo `frontend/package.json` + `pnpm ls` — verified HeroUI `3.0.5`, Tailwind `4.3.0`, Radix set, CVA, `tw-animate-css 1.4.0`, Inter/JetBrains/Tajawal `@fontsource`, `@react-aria/i18n 3.13.0` transitive; no `HeroUIProvider` in `src/` — HIGH
- `node -e "require('@heroui/react').I18nProvider"` → resolves — HIGH (empirical)
- npm registry (`npm view`) — `@heroui/react latest 3.2.1`; `shadcn latest 4.12.0`; `tw-animate-css 1.4.0` — HIGH
- https://www.shadcn.io/design/linear/raw — Linear palette/type/spacing/radius verbatim — HIGH
- https://ui.shadcn.com/docs/rtl + /rtl/start + /docs/changelog/2026-01-rtl — `rtl:true`, `migrate rtl`, `add direction`, tw-animate-css workaround, Calendar/Pagination/Sidebar manual patches, `*-nova` limitation — HIGH
- https://heroui.com/docs/react/releases/v3-0-0 + frameworks — v3 GA, no provider, compound components, `@heroui/styles` split, Tailwind v4 requirement, RTL improvements — HIGH
- https://react-aria.adobe.com/I18nProvider — `<I18nProvider locale="ar">` derives RTL from locale — HIGH
- `frontend/src/index.css`, `App.tsx`, `components.json`, `frontend/CLAUDE.md`, root `CLAUDE.md` — existing `@theme`/`bootstrap.js`/token engine, Aceternity ESLint ban, RTL logical-property gate — HIGH

---

_Stack research for: Linear design-system migration on React 19 + Vite + Tailwind v4 + HeroUI v3_
_Researched: 2026-07-01_
