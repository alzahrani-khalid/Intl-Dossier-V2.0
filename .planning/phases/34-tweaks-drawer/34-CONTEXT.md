# Phase 34: tweaks-drawer — Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 34 delivers a single Tweaks drawer — opened from the topbar — as the ONE place for a user to change Direction / Mode / Hue / Density / Classification / Locale. Selections persist via `localStorage` under the `id.*` key family established in Phase 33 (`id.dir`, `id.theme`, `id.hue`, `id.density`) with two new keys added here (`id.classif`, `id.locale`). Direction change auto-resets Mode + Hue to that direction's defaults. The drawer opens from the inline-end edge (logical property — flips correctly in RTL), traps focus, and dismisses on ESC. The legacy `/themes` route and its supporting files (`pages/Themes.tsx`, `routes/_protected/themes.tsx`) are deleted and replaced with a redirect to `/`; the existing `LanguageToggle` / `LanguageSwitcher` components are removed because the Tweaks drawer is now the sole locus of UI preference control.

**Phase 34 does NOT:**

- Render the classification chrome itself (Phase 36 owns the direction-specific marginalia/ribbon/chip formats)
- Build the full 56px topbar (Phase 36) — we inject a Tweaks button into the existing `SiteHeader.tsx` NOW
- Implement `⌘K` command palette / `C` new-engagement / `B` new-brief keyboard shortcuts (Phases 36+)
- Port the handoff's Preview Loader button (depends on Phase 37's `window.__showGlobeLoader`)
- Touch font stacks (Phase 35) or introduce new design tokens (Phase 33 already locked them)

</domain>

<decisions>
## Implementation Decisions

### Area 1: Drawer Foundation + Trigger

- **D-01** — **HeroUI v3 Drawer primitive** backs the Tweaks panel. Matches Phase 33 D-07 pattern (real HeroUI primitives behind shadcn-style facade). Brings React Aria focus trap + ESC dismissal + logical `placement` values out of the box, satisfying SC-4 with zero custom a11y code. `@heroui/react@3.0.3` already installed by Phase 33.
- **D-02** — **Rendered as compound components** per HeroUI v3 conventions: `Drawer.Root`, `Drawer.Content`, `Drawer.Header`, `Drawer.Body`, `Drawer.Footer`. Consult `mcp__heroui-react__get_component_docs` during research for exact API surface (compound names may differ from v2).
- **D-03** — **Drawer placement is edge-anchored inline-end** (`placement="right"` in LTR, HeroUI's React Aria layer auto-flips to physical left under `dir="rtl"`). Researcher MUST verify HeroUI v3 Drawer respects `dir` attribute for automatic RTL flip — if not, pass placement dynamically based on `i18n.dir()`.
- **D-04** — **Width**: fixed **360px** on ≥sm breakpoint; **100vw full-width overlay** at ≤640px. Backdrop renders with `color-mix(in srgb, var(--bg) 82%, transparent)` + `backdrop-filter: blur(3px)` consistent with handoff's overlay style.
- **D-05** — **Trigger location**: add a gear-icon button to `frontend/src/components/layout/SiteHeader.tsx`. No new `Topbar.tsx` stub — Phase 36 will reposition when it rebuilds the full 56px topbar. Zero throwaway work. Icon: `Settings2` from `lucide-react` (already in use elsewhere). Minimum 44×44px touch target.

### Area 2: Hue Input UX

- **D-06** — **Slider + 5 preset swatches** per handoff verbatim. Range slider 0–360 (step=1) + a row of 5 color swatches at `[22°, 158°, 190°, 258°, 330°]`. Swatches use `background: oklch(58% 0.14 <h>)` exactly as handoff. Swatch active state: `2px solid var(--ink)` border when `|currentHue - swatch| < 4`.
- **D-07** — **Live updates on every `change` event**. `applyTokens` already writes via `setProperty` (Phase 33 D-01) — browser coalesces paint per-frame. No debounce, no rAF throttle in v1. If profiling in Nyquist later reveals jank on slow hardware, revisit with rAF throttle.
- **D-08** — **Degree readout is rendered `dir="ltr"`** inline (`<span dir="ltr">{hue}°</span>`) regardless of locale so the degree symbol and number stay Western-Arabic-numeral even in RTL — matches handoff.
- **D-09** — **No numeric input, no color picker**. Scope-locked to slider + swatches. If user explicitly wants a specific hex/hue number, they can read the live degree readout while dragging the slider.

### Area 3: Classification + Locale Semantics

- **D-10** — **`id.classif` is a boolean** (`'true'` / `'false'` string in localStorage, boolean in-memory). `true` = show classification chrome, `false` = hide. Phase 36 reads this boolean and renders the direction-specific format (marginalia/ribbon/chip) when true. No level/label enum — simpler contract, no migration risk.
- **D-11** — **Tweaks drawer REPLACES `LanguageToggle` + `LanguageSwitcher`** as the sole locale control. Delete both components (`frontend/src/components/language-toggle/LanguageToggle.tsx` and `frontend/src/components/language-switcher/LanguageSwitcher.tsx`) and remove all their render sites from the codebase. Any `LanguageToggle` references must be grepped out before this phase can complete.
- **D-12** — **`id.locale` is canonical**. On first load after Phase 34 ships, run a one-time migrator in the inline bootstrap script (`frontend/index.html`): if `localStorage['i18nextLng']` exists and `localStorage['id.locale']` does not, copy the value to `id.locale` and `removeItem('i18nextLng')`. Going forward, `id.locale` is the single source of truth. Configure i18next's `LanguageDetector` to read from `id.locale` instead of its default `i18nextLng`. Same migration philosophy as Phase 33 D-10 (hard cut, default on miss).
- **D-13** — **Locale options are `'en'` and `'ar'`** only. Setter updates `id.locale`, calls `i18n.changeLanguage(lang)`, and sets `document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'` + `document.documentElement.lang = lang`.
- **D-14** — **Inline bootstrap script MUST be extended** to read `id.classif` + `id.locale` alongside Phase 33's dir/theme/hue/density keys so applied preferences take effect pre-paint (no flash of wrong direction, no flash of hidden classification chrome once Phase 36 ships).

### Area 4: Handoff Extras + Direction-Change UX + Legacy Cut

- **D-15** — **Defer handoff's Shortcuts cheatsheet and Preview Loader button**. Phase 34 drawer renders ONLY the 6 SC-1 controls. Shortcuts list re-enters when Phase 36 wires `⌘K` command palette. Preview Loader re-enters when Phase 37 creates `window.__showGlobeLoader`. Keeps Phase 34 surgical — no dead affordances.
- **D-16** — **Silent reset on direction change** per handoff. When user clicks a direction button, setDirection immediately writes the new direction AND also writes the mode + hue defaults for that direction (Chancery=light/22°, Situation=dark/190°, Ministerial=light/158°, Bureau=light/32°). The live UI flip IS the confirmation. No toast, no confirm dialog. Each direction button's secondary caption (tagline) communicates what that direction's palette looks like.
- **D-17** — **Direction button anatomy** per handoff: two-line stacked button with `fontWeight:600, fontSize:13` primary label + `fontSize:11, color:var(--ink-mute)` tagline. Active state: border `var(--accent)`, background `var(--accent-soft)`, text `var(--accent-ink)`. Inactive: border `var(--line)`, background `var(--surface)`, text `var(--ink)`.
- **D-18** — **Hard cut for `/themes`**:
  - Delete `frontend/src/pages/Themes.tsx`
  - Delete `frontend/src/routes/_protected/themes.tsx`
  - Add a TanStack Router redirect: a new `frontend/src/routes/_protected/themes.tsx` containing only a `beforeLoad` redirect to `/` (OR use `createFileRoute` with `loader: () => { throw redirect({ to: '/' }) }`). Researcher to confirm idiomatic TanStack Router v5 redirect pattern.
  - Regenerate `frontend/src/routeTree.gen.ts` after route changes (`pnpm run build` or TanStack Router's codegen command).
  - Grep the codebase for every `to="/themes"`, `navigate('/themes')`, `'/themes'` literal, and any `Themes` named imports; remove/replace each site.
  - Delete the `useTheme` legacy shim from Phase 33 D-11 — Phase 34 replaces its last consumer with direct `useDirection()` / `useMode()` calls from DesignProvider.

### Claude's Discretion

- **Exact i18n key names** for drawer labels (e.g., `tweaks.title`, `tweaks.direction`, `tweaks.theme.light`, `tweaks.density.comfortable`) — planner chooses, but label text ports from handoff `tweaks.jsx` `L` object verbatim (Arabic + English strings).
- **Drawer open animation duration** — HeroUI v3 Drawer default is fine unless it feels laggy; no specific frame budget.
- **Gear icon size in topbar** — 20–24px icon inside 44×44 button. Planner decides.
- **Focus return target** on drawer close — HeroUI v3 React Aria handles this natively (focus returns to trigger). No custom wiring needed.
- **Keyboard shortcut to open drawer** — NOT in scope for Phase 34. Phase 36 command palette owns global shortcuts.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-defining docs

- `.planning/ROADMAP.md` §Phase 34 — goal, SCs 1–5, dependencies
- `.planning/REQUIREMENTS.md` §Theme (THEME-01..04) — acceptance criteria for each requirement

### Prior phase context (LOCKED DECISIONS THAT FLOW INTO THIS PHASE)

- `.planning/phases/33-token-engine/33-CONTEXT.md` §Decisions — specifically D-01 (buildTokens runtime fn), D-03 (inline FOUC bootstrap reads `id.*` keys), D-10 (hard-cut migration philosophy), D-11 (`useTheme` shim removed in Phase 34), §Cross-Phase Flags (Phase 34 owns deleting `Themes.tsx` + `theme-selector`)

### Handoff bundle (design source of truth — port 1:1)

- `/tmp/inteldossier-handoff/inteldossier/project/src/tweaks.jsx` — **canonical drawer layout**: 6 sections, direction button anatomy, hue slider + 5 swatches, overlay click-to-close, close button (✕)
- `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` — direction defaults map (used for D-16 silent reset values)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` — `.tweaks-overlay` / `.tweaks-panel` / `.tweak-row` / `.tweak-hue` / `.on` class definitions (reference only; implement via Tailwind + HeroUI tokens, do not port CSS verbatim)

### Project conventions

- `CLAUDE.md` §UI Component Guidelines — HeroUI v3 compound component pattern (`Drawer.Root`/`Drawer.Content`/etc.), v3 BETA caveats, MCP workflow for v3 docs
- `CLAUDE.md` §Arabic RTL Support Guidelines — logical properties only (`ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*`); `dir={isRTL ? 'rtl' : 'ltr'}` on container; flip directional icons with `rotate-180` if needed
- `CLAUDE.md` §Mobile-First & Responsive Design — base→sm→md breakpoints; 44×44px minimum touch targets; 8px minimum gap

### External docs (fetch during research)

- HeroUI v3 Drawer component docs — call `mcp__heroui-react__get_component_docs` with `path: "/docs/react/components/drawer"` (or equivalent); verify compound API, `placement` prop behavior under `dir="rtl"`, and focus-trap semantics
- TanStack Router v5 redirect docs — idiomatic `createFileRoute` with `beforeLoad` / `loader` → `throw redirect({ to: '/' })` pattern for the `/themes` → `/` redirect
- i18next `LanguageDetector` custom `detection.order` + `detection.lookupLocalStorage` config — to point i18next at `id.locale` instead of default `i18nextLng`

### Current codebase integration points

- `frontend/src/components/layout/SiteHeader.tsx` — inject Tweaks gear button per D-05
- `frontend/src/components/layout/Header.tsx` — audit for whether a second trigger site is needed (researcher: determine which header renders on which routes)
- `frontend/src/components/language-toggle/LanguageToggle.tsx` — DELETE per D-11
- `frontend/src/components/language-switcher/LanguageSwitcher.tsx` — DELETE per D-11
- `frontend/src/pages/Themes.tsx` — DELETE per D-18
- `frontend/src/routes/_protected/themes.tsx` — REWRITE as redirect per D-18
- `frontend/src/routeTree.gen.ts` — regenerate after route change per D-18
- `frontend/index.html` — extend inline bootstrap script with `id.classif` + `id.locale` reads + one-time `i18nextLng → id.locale` migrator per D-12, D-14
- `frontend/src/design-system/` — Phase 33's `DesignProvider`, `useDirection`, `useMode`, `useHue`, `useDensity` hooks — Tweaks drawer consumes these directly
- `frontend/src/components/theme-provider/` — Phase 33's legacy `useTheme` shim lives here; DELETE per D-18 (last consumer replaced by Tweaks drawer's direct DesignProvider calls)
- `frontend/src/i18n/` (or wherever i18next is configured) — update `LanguageDetector` config per D-12

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **HeroUI v3 (`@heroui/react@3.0.3` + `@heroui/styles@3.0.3`)** — installed by Phase 33 D-05. Drawer primitive available with React Aria focus trap + ESC built-in.
- **DesignProvider** (`frontend/src/design-system/`) — Phase 33 D-11 exposes `useDirection()`, `useMode()`, `useHue()`, `useDensity()` with live setters. Tweaks drawer wires directly to these.
- **Phase 33 inline bootstrap** (`frontend/index.html`) — already reads `id.dir`/`id.theme`/`id.hue`/`id.density`. Phase 34 extends with `id.classif` + `id.locale` + `i18nextLng` migrator.
- **`lucide-react` icon set** — `Settings2` / `Settings` / `SlidersHorizontal` all available for the gear trigger.
- **i18next + react-i18next** — `useTranslation()` pattern already pervasive. `i18n.changeLanguage()` + `i18n.dir()` are the setters.
- **Tailwind v4 `@theme` block + utility set** from Phase 33 D-16 — `bg-surface / bg-accent-soft / text-ink / text-accent-ink / border-line / border-accent` all usable directly in drawer markup.

### Established Patterns

- **HeroUI shadcn-facade re-exports** (Phase 33 D-07) — planners should consider whether to add `heroui-drawer.tsx` + `drawer-new.tsx` re-export OR consume `@heroui/react` `Drawer` directly inside a `TweaksDrawer.tsx` component (since it's a single-site consumer, direct usage is likely simpler).
- **Logical-property CSS** — entire codebase uses `ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*` per CLAUDE.md rule. No physical `left`/`right` anywhere.
- **Provider wrap in `src/main.tsx` → `App.tsx`** — `DesignProvider` already at top level; drawer doesn't need its own provider.
- **Existing vaul-based `drawer.tsx`** — used by Commitments (`CommitmentFilterDrawer.tsx`, `CommitmentDetailDrawer.tsx`). Leave these alone — they're bottom-sheet UX; Tweaks drawer is edge-anchored and uses a different primitive.

### Integration Points

- **`SiteHeader.tsx` trigger site** — add gear button with `aria-label={t('tweaks.open')}`, `onClick={() => setTweaksOpen(true)}`. Tweaks open state can live in a tiny Zustand store or React Context at App level.
- **New component path**: `frontend/src/components/tweaks/TweaksDrawer.tsx` (co-located i18n keys under `tweaks.*` namespace).
- **Inline bootstrap script** (`frontend/index.html`) — 4 key reads extended to 6, plus migrator. Keep ~2 KB target from Phase 33 D-03.
- **TanStack Router redirect file** — replaces `src/routes/_protected/themes.tsx` with a minimal redirect route; `routeTree.gen.ts` regenerates on next `pnpm dev`/`pnpm build`.
- **Grep audit targets** — `to="/themes"` / `to='/themes'` / `navigate('/themes')` / `'/themes'` / `Themes` named imports — all must be removed or confirmed unused.

</code_context>

<specifics>
## Specific Ideas

- **Port handoff tweaks.jsx 1:1** (minus deferred Shortcuts + Loader preview). Arabic + English label pairs in handoff's `L` object transplant directly to i18next keys.
- **Direction button layout is exactly**: stacked 2-line button, primary label `fontWeight:600, fontSize:13`, tagline `fontSize:11, color:var(--ink-mute)`, padding `10px`, `border-radius: var(--radius-sm)`, logical-start text alignment.
- **Hue swatch row** is exactly 5 buttons with `flex:1, height:24, border-radius: var(--radius-sm)`, 2px active border in `var(--ink)` or transparent.
- **Degree readout** stays in LTR Western-Arabic numerals via inline `dir="ltr"` span even when the rest of the drawer is RTL.

</specifics>

<deferred>
## Deferred Ideas

- **`⌘K` command palette + C/B keyboard shortcuts** — deferred to Phase 36 (shell-chrome) when the topbar is fully built and global keymap infrastructure exists.
- **Preview Loader button** — deferred to Phase 37 (signature-visuals) which creates `window.__showGlobeLoader(ms)`.
- **Enum-based classification levels** (Internal / Confidential / Off) — if a future phase needs labeled levels, extend `id.classif` to `id.classif_level` or change the value shape via a migrator. Not in Phase 34.
- **Hue numeric input / full OKLCH picker** — not needed for the current user flow. Slider + swatches + live degree readout cover the discovery path.
- **Keyboard shortcut to open the drawer** (e.g., `g t`) — belongs with Phase 36's command palette / global keymap.
- **Second trigger site** (if Header.tsx needs one) — flagged for researcher to determine; may or may not need a second trigger. Default assumption: single trigger in SiteHeader is enough for Phase 34; Phase 36 will standardize on one topbar.

</deferred>

---

_Phase: 34-tweaks-drawer_
_Context gathered: 2026-04-20_
