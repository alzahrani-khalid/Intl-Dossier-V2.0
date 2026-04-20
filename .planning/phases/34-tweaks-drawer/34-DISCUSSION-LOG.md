# Phase 34: tweaks-drawer — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `34-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 34-tweaks-drawer
**Areas discussed:** Drawer foundation + trigger, Hue input UX, Classification + Locale semantics, Handoff extras + direction-change UX

---

## Area 1: Drawer Foundation + Trigger

### Q1.1 — Which drawer primitive should back the Tweaks panel?

| Option                          | Description                                                                                                        | Selected |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| HeroUI v3 Drawer (Recommended)  | Matches Phase 33 D-07 pattern; React Aria focus trap + ESC built-in; logical `placement` edges; already installed. | ✓        |
| Existing vaul drawer.tsx        | Used by Commitments drawers; bottom-sheet UX; would need custom work for RTL edge-flip.                            |          |
| Bespoke modal + CSS transitions | Port handoff `.tweaks-overlay` + `.tweaks-panel` 1:1; smallest dependency footprint; manual focus trap.            |          |

**User's choice:** HeroUI v3 Drawer
**Notes:** Keeps architectural consistency with Phase 33's "real HeroUI primitives behind shadcn facade" pattern. Satisfies SC-4 (focus trap + ESC) with zero custom a11y code.

### Q1.2 — Where does the Tweaks button live in Phase 34?

| Option                                               | Description                                                                           | Selected |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| Inject into existing SiteHeader/Header (Recommended) | Add gear-icon button now; Phase 36 repositions into real 56px topbar; zero throwaway. | ✓        |
| Temporary floating button                            | Top-right fixed FAB marked WIP; throwaway in Phase 36.                                |          |
| New minimal Topbar stub                              | Create `Topbar.tsx` with only the Tweaks button; Phase 36 expands it.                 |          |

**User's choice:** Inject into existing SiteHeader/Header
**Notes:** Phase 36 will reposition when rebuilding the real topbar. No stub files to maintain.

### Q1.3 — How should the drawer behave at ≤640px?

| Option                                   | Description                                                                                                  | Selected |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| Full-width overlay (Recommended)         | 360px desktop, 100vw on mobile with backdrop; matches CLAUDE.md mobile-first + Phase 36 overlay-drawer rule. | ✓        |
| Fixed 360px with horizontal scroll       | Simplest CSS but poor mobile UX at 320px.                                                                    |          |
| Bottom sheet mobile, side drawer desktop | Responsive primitive switch; most native feel but introduces two drawer libs.                                |          |

**User's choice:** Full-width overlay
**Notes:** Consistent with CLAUDE.md mobile-first principles and Phase 36's planned sidebar overlay behavior.

---

## Area 2: Hue Input UX

### Q2.1 — What surfaces does the Hue control expose?

| Option                                   | Description                                                                       | Selected |
| ---------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| Slider + 5 preset swatches (Recommended) | Port handoff 1:1: range slider 0–360 + swatches at [22°, 158°, 190°, 258°, 330°]. | ✓        |
| Slider + numeric input                   | Range slider + editable number field; more precise but less exploratory.          |          |
| Slider only                              | Just the 0–360 range slider with live degree readout; simplest UI.                |          |
| Full OKLCH picker                        | H/S/L triad; maximum control, overkill for a tweak.                               |          |

**User's choice:** Slider + 5 preset swatches
**Notes:** Swatches teach the full hue wheel; slider gives fine control. Matches handoff design.

### Q2.2 — How should hue updates apply as the slider moves?

| Option                                 | Description                                                                   | Selected |
| -------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| Live, every change event (Recommended) | Matches handoff; `applyTokens` writes synchronously; browser coalesces paint. | ✓        |
| rAF-throttled live                     | Cap at ~60Hz via requestAnimationFrame; cheaper if we notice jank.            |          |
| Debounced 150ms                        | Reduces token recomputes but makes slider feel laggy.                         |          |

**User's choice:** Live, every change event
**Notes:** Revisit only if Nyquist validation shows jank on slow hardware.

### Q2.3 — Which preset hue set for the swatch row?

| Option                                           | Description                                                                       | Selected |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | -------- |
| Handoff 5 [22, 158, 190, 258, 330] (Recommended) | Port verbatim; 22/158/190 match direction defaults; 258/330 teach the full wheel. | ✓        |
| Direction defaults only [22, 158, 190, 32]       | Only the 4 canonical direction hues.                                              |          |
| No swatches, slider only                         | Not applicable given Q2.1 selection.                                              |          |

**User's choice:** Handoff 5 values
**Notes:** Exploratory swatches reinforce that any 0–360° hue works.

---

## Area 3: Classification + Locale Semantics

### Q3.1 — What does `id.classif` store?

| Option                          | Description                                                                          | Selected |
| ------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Boolean on/off (Recommended)    | Per handoff; Phase 36 reads boolean and renders direction-specific format when true. | ✓        |
| Enum: Internal/Confidential/Off | Lets users pick level; couples Phase 34 to content Phase 36 hasn't defined.          |          |
| String label + boolean          | Two keys for visibility + text; maximum flexibility, maximum complexity.             |          |

**User's choice:** Boolean on/off
**Notes:** Simpler contract; no migration risk if Phase 36 formats stay fixed.

### Q3.2 — Does the Tweaks drawer's Locale control replace the existing LanguageToggle component?

| Option                                           | Description                                                                 | Selected |
| ------------------------------------------------ | --------------------------------------------------------------------------- | -------- |
| Replace — Tweaks is the only place (Recommended) | Delete LanguageToggle + LanguageSwitcher; one locus for all UI prefs.       | ✓        |
| Coexist — both work                              | Keep existing toggle AND add locale to Tweaks; two ways to change language. |          |
| Deprecate later                                  | Phase 34 adds to Tweaks; Phase 36 decides if/when to remove.                |          |

**User's choice:** Replace
**Notes:** Matches "everything in one place" goal. Grep for LanguageToggle references is part of Phase 34 execution.

### Q3.3 — How is locale persisted — new `id.locale` or reuse i18next's `i18nextLng`?

| Option                                                | Description                                                                                                | Selected |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `id.locale` canonical + migrate on load (Recommended) | Use `id.locale` per ROADMAP SC-2; one-time migrator copies i18nextLng → id.locale then deletes i18nextLng. | ✓        |
| Reuse `i18nextLng`                                    | Skip `id.locale`; breaks ROADMAP contract and `id.*` convention.                                           |          |
| Both keys, kept in sync                               | Write to both on every change; two sources of truth.                                                       |          |

**User's choice:** `id.locale` canonical + migrate
**Notes:** Same migration philosophy as Phase 33 D-10. Single source of truth going forward.

---

## Area 4: Handoff Extras + Direction-Change UX + Legacy Cut

### Q4.1 — Include the handoff's Shortcuts cheatsheet + Preview Loader button?

| Option                                   | Description                                                                               | Selected |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Defer both to later phases (Recommended) | Only 6 SC-1 controls in Phase 34; Shortcuts move to Phase 36, Loader preview to Phase 37. | ✓        |
| Include Shortcuts only                   | Static cheatsheet even without bindings; risks user trying ⌘K and nothing happening.      |          |
| Port both verbatim                       | Include both; Preview Loader is a no-op placeholder until Phase 37.                       |          |

**User's choice:** Defer both
**Notes:** Keeps Phase 34 surgical. No dead affordances. Phase 36 and Phase 37 re-add at the right time.

### Q4.2 — When direction changes and SC-3 resets mode+hue to defaults, what does the user see?

| Option                         | Description                                                                                           | Selected |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | -------- |
| Silent reset (Recommended)     | Per handoff; direction button is the affordance, live UI flip is confirmation; taglines hint palette. | ✓        |
| Toast notification             | 2–3 sec toast describing the reset; adds transient UI.                                                |          |
| Confirm dialog when customized | Track 'custom' flag; show Keep custom / Reset dialog; respects manual tweaks but blocks exploration.  |          |

**User's choice:** Silent reset
**Notes:** Direction buttons carry taglines as implicit affordance; live flip is the confirmation.

### Q4.3 — How aggressively should Phase 34 remove the old /themes machinery (SC-5)?

| Option                            | Description                                                                                                                                               | Selected |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Hard cut + redirect (Recommended) | Delete Themes.tsx + routes/\_protected/themes.tsx; add TanStack Router redirect /themes → /; grep and remove all references; regenerate routeTree.gen.ts. | ✓        |
| Delete files + 404 for /themes    | Lets router's default 404 show; breaks SC-5's 'redirects to /' requirement.                                                                               |          |
| Deprecate with warning banner     | Keep page with deprecation banner; contradicts SC-5.                                                                                                      |          |

**User's choice:** Hard cut + redirect
**Notes:** Fully satisfies SC-5. Includes deleting the `useTheme` legacy shim from Phase 33 D-11 (its last consumer is replaced by Tweaks drawer's direct DesignProvider calls).

---

## Claude's Discretion

- Exact i18n key names under `tweaks.*` namespace
- Drawer open animation duration (HeroUI default unless it feels laggy)
- Gear icon size in topbar (20–24px inside 44×44 button)
- Focus return target on drawer close (HeroUI React Aria handles natively)

## Deferred Ideas

- `⌘K` command palette + C/B keyboard shortcuts → Phase 36
- Preview Loader button → Phase 37
- Enum-based classification levels → future if needed
- Hue numeric input / full OKLCH picker → not needed for current flow
- Global keyboard shortcut to open drawer → Phase 36
