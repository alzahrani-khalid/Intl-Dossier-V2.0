# Phase 36: shell-chrome — Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Every page of the app renders inside the **new 256px sidebar + 56px topbar + direction-specific classification chrome**, using the real GASTAT brand mark, with correct responsive behavior down to 320px in both locales.

**In scope:**

- New `AppShell.tsx` that replaces `MainLayout.tsx` as the wrapper every route mounts inside
- 256px sidebar (SHELL-01): brand mark + app name + workspace + user card + 3 nav sections (Operations / Dossiers / Admin) + footer, with 2px accent bar at `inset-inline-start:0` on the active item
- 56px topbar (SHELL-02): search pill + ⌘K kbd, direction switcher (4 buttons), bell+badge, theme toggle, locale toggle, Tweaks button
- Direction-specific classification chrome (SHELL-03): Chancery=marginalia italics, Situation=full-width ribbon, Ministerial/Bureau=chip pill, all showing workspace + classification level + session info
- Responsive overlay drawer at ≤1024px (280px, backdrop, `translateX(-100%)` off-canvas, RTL flips to `translateX(100%)`); full-screen drawer + wrapped topbar at ≤640px (SHELL-04)
- Real `GASTAT_LOGO.svg` at 22×22 tinted via `currentColor` in the active accent color (SHELL-05)

**Out of scope (deferred to other phases):**

- ⌘K command palette behavior (Tweaks D-15 noted for future phase)
- Notification content / bell dropdown inner UI (Phase 42 page work)
- Dashboard page rendering inside the shell (Phase 38)
- Kanban / Calendar / List-page rendering inside the shell (Phases 39-42)
- `<GlobeLoader>` splash behavior (Phase 37 VIZ-01)

</domain>

<decisions>
## Implementation Decisions

### Area 1: Shell Composition Strategy

- **D-01** — **Fresh `AppShell.tsx` replaces `MainLayout.tsx` entirely.** Create new `frontend/src/components/layout/AppShell.tsx` as the top-level shell wrapper. It internally mounts the Phase-33 `DesignProvider` layer (unchanged), the Phase-34 `TweaksDisclosureProvider` (unchanged), a fresh `<Sidebar>` composition, a fresh `<Topbar>` composition, a new `<ClassificationBar>`, and a `<main>` slot. `MainLayout.tsx`, `AppSidebar.tsx`, and `MobileBottomTabBar.tsx` are **deleted** when AppShell lands in every route; `SiteHeader.tsx` is superseded by the new `Topbar.tsx` (Phase 34's Tweaks-gear wiring carries forward into the rewrite).
- **D-02** — **`components/ui/sidebar.tsx` (shadcn primitive) is preserved.** It provides `SidebarProvider`, `SidebarInset`, responsive-state cookie persistence, and the mobile-detection hook. AppShell composes on top of it rather than replacing it. This keeps the responsive scaffolding proven by Phases 1-32.
- **D-03** — **`navigation-config.ts` is preserved but extended.** Keep the existing route-definition shape (labels, icons, route paths) as the data source. Extend the config with a `section: 'operations' | 'dossiers' | 'admin'` discriminator so the new sidebar can group items into the three handoff-mandated sections. No new routing logic.
- **D-04** — **Every route's `_protected.tsx` layout switches from `MainLayout` to `AppShell`.** Grep every `import { MainLayout }` site and replace. Deletion of `MainLayout.tsx` is the final act of the phase; a CI gate (like Phase 34's `check-deleted-components.sh`) prevents reintroduction.

### Area 2: Mobile Navigation

- **D-05** — **Delete `MobileBottomTabBar.tsx`.** Aligned with SHELL-04: the ≤640px layout collapses the sidebar to a full-screen overlay drawer triggered by a hamburger button in the topbar. Single mobile-nav pattern instead of dual. Removes the tab-bar maintenance surface.
- **D-06** — **Reuse Phase 34's HeroUI `Drawer` primitive** for the sidebar's overlay mode. Same React Aria focus trap, ESC dismiss, and auto-flip behavior the Tweaks drawer already proved in Phase 34 (D-01 / D-03 / D-08). `placement="left"` in LTR (HeroUI auto-flips to right under `dir="rtl"`). Researcher confirms whether HeroUI v3 supports two concurrent `Drawer` instances (Tweaks + Sidebar) or whether the sidebar needs a distinct `Sheet`-style primitive.

### Area 3: Brand Logo Delivery

- **D-07** — **Inline React SVG component at `frontend/src/components/brand/GastatLogo.tsx`.** Convert `handoff/project/reference/GASTAT_LOGO.svg` to TSX by hand (or script — researcher's choice). Every `fill`, `stroke`, or color attribute becomes `"currentColor"` so the sidebar-branded container's `color: var(--accent)` tints the mark per SHELL-05. No new Vite plugin (`vite-plugin-svgr`) added — keeps dependency surface tight. Props: `className` + `size` (default 22). Usage inside sidebar: `<GastatLogo size={22} className="text-accent" />`.
- **D-08** — **The handoff `GASTAT_LOGO.svg` is the authoritative source.** Locate the file before Plan 36-01 lands (research gate); if the path in STATE.md's research note is wrong, treat as blocker. No placeholder logo ships.

### Claude's Discretion

These are technical decisions the planner / researcher resolve during phase prep. User deferred explicit choice — "Claude figures it out":

- **Classification chrome (SHELL-03) component shape.** Three fundamentally different DOM positions: Chancery=marginalia (absolutely-positioned side column), Situation=full-width ribbon (banner above `<main>`), Ministerial/Bureau=chip pill (inline). Researcher evaluates: (a) single `<ClassificationBar direction={...}>` with an internal `switch`, (b) four per-direction components rendered conditionally, or (c) CSS-only variants switched via `[data-direction]` selectors. Planner picks based on handoff source fidelity + RTL cascade interaction.
- **Nav section taxonomy — which routes map to Operations / Dossiers / Admin.** Researcher reads current `navigation-config.ts` + handoff sidebar JSX and emits a per-route mapping. Planner locks in plan doc.
- **Topbar item order (LTR JSX).** 6 items: search pill+⌘K, direction switcher, bell+badge, theme toggle, locale toggle, Tweaks. Claude uses Tailwind logical-property flex order; `forceRTL`-flipped `flex-direction: row` handles the RTL mirror automatically. Planner verifies handoff's item sequence.
- **Drawer trigger placement.** Hamburger icon in topbar's `inset-inline-start`. Planner picks the exact icon (Menu / PanelLeft) and size.
- **Active-nav-item 2px accent bar implementation.** Pseudo-element `::before` with `inset-inline-start:0; width:2px; height:100%;` is standard; planner may prefer a `border-inline-start: 2px solid var(--accent)` approach. Either works; picker is flexible.
- **User card anatomy.** Handoff shows avatar + name + role + (optional) org. Planner reads handoff JSX + Phase 32 Person schema and specifies fields.
- **Cookie/localStorage key for sidebar collapsed state.** Reuse existing `sidebar_state` (read by `MainLayout.tsx` today) unless conflicts surface.
- **Tweaks gear repositioning inside new Topbar.** Phase 34 D-05 put it in `SiteHeader.tsx`; Phase 36's Topbar rewrite owns the new location. Keep the same trigger API (`useTweaksOpen` hook).
- **`checkDeletedComponents` CI-gate script extension.** Add `MainLayout.tsx`, `AppSidebar.tsx`, `SiteHeader.tsx`, `MobileBottomTabBar.tsx` to the list of files that must not reappear after Phase 36 ships.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + Requirements

- `.planning/ROADMAP.md` §"Phase 36: shell-chrome" — 5 Success Criteria + goal statement (already copied verbatim into `<domain>` above)
- `.planning/REQUIREMENTS.md` §SHELL-01..SHELL-05 — 5 checkbox requirements (dependency graph: Phase 33 + 34 + 35)

### Handoff visual source of truth

- `/tmp/inteldossier-handoff/inteldossier/project/src/` — the handoff JSX for sidebar / topbar / classification variants (exact filenames to be located by researcher; likely `components/Sidebar.jsx`, `components/Topbar.jsx`, and direction-specific classification JSX inside `themes.jsx` or `app.jsx`)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/GASTAT_LOGO.svg` — authoritative brand mark (SHELL-05); MUST verify path before Plan 36-01

### Carry-forward decisions (prior-phase CONTEXT.md files)

- `.planning/phases/33-token-engine/33-CONTEXT.md` — `DesignProvider` is above `LanguageProvider` (D-02); `applyTokens()` writes CSS vars on `documentElement`; `@theme` self-reference pattern (A1 SAFE for fonts, UNSAFE for shadows)
- `.planning/phases/34-tweaks-drawer/34-CONTEXT.md` — HeroUI v3 Drawer primitive for overlays (D-01), `Drawer.Root/Content/Header/Body/Footer` compound pattern (D-02), auto-RTL flip via `placement` (D-03), 360px width / 100vw mobile (D-04), Tweaks gear at `SiteHeader.tsx` (D-05), `id.classif` boolean for classification visibility (D-10), `id.locale` canonical + bootstrap reads it (D-12)
- `.planning/phases/35-typography-stack/35-CONTEXT.md` — `--font-display/body/mono` drive nav + brand typography (D-01/02), Tajawal RTL cascade already handles Arabic sidebar labels (D-07), `fonts.ts` first-imported in `main.tsx` before `index.css` (D-05)

### Existing codebase scaffolding (not to re-invent)

- `frontend/src/components/ui/sidebar.tsx` — shadcn `SidebarProvider`/`SidebarInset`/`useSidebar` primitive; responsive state, cookie-persistence, mobile detection. PRESERVE (see D-02).
- `frontend/src/components/layout/navigation-config.ts` — current nav data source; extend with `section` discriminator (see D-03).
- `frontend/src/components/layout/SiteHeader.tsx` — current topbar (101 lines); delete after rewrite. Phase 34 wired Tweaks gear here; same wiring re-enters new `Topbar.tsx`.
- `frontend/public/bootstrap.js` — FOUC-safe pre-paint script; writes `html.dir`, `html.lang`, `data-classification`, `data-direction`, `data-density`, and CSS-var fallbacks. AppShell must render consistently with whatever bootstrap.js has already painted (no direction/classification flash).

### i18n + RTL global rules

- `CLAUDE.md` §"Web/Tailwind RTL Requirements" — logical properties (`ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*`), `dir={isRTL ? 'rtl' : 'ltr'}` on containers, mobile-first breakpoints (base → sm → md → lg → xl → 2xl).

### Dossier-centric architecture

- `docs/DOSSIER_CENTRIC_ARCHITECTURE.md` — informs nav taxonomy decisions (Dossiers section = 8 dossier types from Phase 32; Operations section = tasks/commitments/intake; Admin section = compliance/settings).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`components/ui/sidebar.tsx`** (shadcn primitive) — `SidebarProvider`, `SidebarInset`, `useSidebar` hook, cookie-persisted collapsed state, mobile-detection. New AppShell wraps this unchanged.
- **`navigation-config.ts`** — Current route-to-nav mapping. Extend with `section: 'operations' | 'dossiers' | 'admin'` discriminator; don't reinvent routing logic.
- **HeroUI v3 `Drawer`** (already installed in `frontend/package.json` via Phase 33 D-04) — Proven as Tweaks drawer in Phase 34. Reuse for the sidebar overlay mode.
- **`useDirection` / `useMode` / `useLocale` / `useClassification` hooks** from Phase 33/34 `DesignProvider` — every shell component reads direction/locale/classif through these; no new state wiring.
- **`SiteHeader.tsx`'s Tweaks-gear pattern** — `import { useTweaksOpen } from '@/components/tweaks'` + `useTranslation()` + `Button` with `aria-label={t('tweaks.open')}` pattern (101-line file) becomes the blueprint for the new Topbar's Tweaks button re-wire.
- **`lucide-react` icons** already in use — `Menu`, `PanelLeft`, `Search`, `Bell`, `Sun`, `Moon`, `Settings2` already imported across the codebase.
- **`bootstrap.js` pre-paint script** — writes `html.dir` + `data-direction` before any React code runs. AppShell must NOT compete — read from the already-applied CSS vars.

### Established Patterns

- **`_protected.tsx` route pattern** (TanStack Router) — every protected route imports the shell wrapper. Phase 36 changes the single import site from `MainLayout` to `AppShell`.
- **Drawer compound components** (Phase 34 D-02) — `Drawer.Root / Content / Header / Body / Footer`. Sidebar overlay reuses this shape.
- **Tailwind logical properties** (`ms-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`) — MANDATORY per CLAUDE.md. Shell code uses these exclusively.
- **Atomic direction change** (Phase 33 D-09): `applyTokens()` writes every var in one setProperty loop → entire shell re-paints on direction change with zero intermediate frames.
- **`@theme` self-reference** for font utilities (Phase 35 D-01 A1 SAFE) — `font-display`, `font-body`, `font-mono` Tailwind utility classes resolve to direction-correct typography automatically.

### Integration Points

- **TanStack Router `_protected.tsx` layout** — where AppShell mounts. Grep for `MainLayout` import sites to find every shell-mount location.
- **`DesignProvider` + `LanguageProvider` + `TweaksDisclosureProvider` mount order** (established in `frontend/src/App.tsx`) — AppShell mounts INSIDE these providers, not around them.
- **i18n keys** — new Topbar/Sidebar strings (nav section headers, search placeholder, a11y labels) go into `frontend/src/i18n/locales/{en,ar}.json` under a new `shell` namespace.
- **`DossierContextIndicator`** + **`EntityBreadcrumbTrail`** — currently rendered by `MainLayout.tsx`. AppShell decides whether they migrate in, move to page-level, or are deleted.
- **`useContextAwareFAB`** + **`ContextAwareFAB`** — currently mounted by `MainLayout.tsx` for mobile FAB. Planner decides whether AppShell keeps this or defers to per-page rendering.

</code_context>

<specifics>
## Specific Ideas

- **Handoff alignment over abstraction** — the user answered "Fresh AppShell replaces MainLayout entirely", signaling a clean-slate preference for the shell taxonomy. Don't preserve legacy component names just because the code works; delete and rebuild where the handoff has a clear visual spec.
- **Delete-list is part of the phase DoD** — `MainLayout.tsx`, `AppSidebar.tsx`, `SiteHeader.tsx`, `MobileBottomTabBar.tsx` must all be absent from `frontend/src/` when the phase closes. CI-gate extension (Phase 34 pattern) prevents regression.
- **Single mobile nav** — No tab bar alongside drawer. The drawer is THE mobile nav (D-05). Hamburger trigger sits at `inset-inline-start` of the topbar on ≤1024px viewports.
- **Logo must tint** — inline SVG with `currentColor` so `color: var(--accent)` on the sidebar-brand container drives the tint. No mask-image hacks.

</specifics>

<deferred>
## Deferred Ideas

- **⌘K command palette behavior** — Tweaks D-15 flagged this for "Phase 36 wires ⌘K command palette", but the Phase-36 roadmap only lists the kbd _visual hint_ (SHELL-02), not the palette behavior. Palette UX = separate follow-up (could be Phase 42 or a dedicated palette phase).
- **Notification bell dropdown inner UI** — SHELL-02 only requires the bell + badge; dropdown content belongs in Phase 42 (remaining-pages) or a notification-specific phase.
- **GlobeLoader splash screen** — Phase 37 VIZ-01.
- **LanguageProvider id.locale migration** — Phase 35 surfaced tech debt: `LanguageProvider` still reads pre-Phase-34 localStorage keys. Not Phase 36 scope but may surface during SHELL-04 RTL testing; flag for Phase 36 wrap-up OR a targeted debug session.
- **Accessibility audit sweep** — axe-core + keyboard-navigation + screen-reader labels for the full shell. Phase 43 QA sweep covers this holistically.
- **Visual-regression baselines** — 24-snapshot matrix like Phase 33's tailwind-remap. Likely VRT as part of Phase 43 or an interim phase.

</deferred>

---

_Phase: 36-shell-chrome_
_Context gathered: 2026-04-22_
