# Phase 36: shell-chrome — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `36-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 36-shell-chrome
**Areas discussed:** Replace-vs-Refactor strategy (with mobile nav + logo delivery sub-questions)

---

## Gray Area Selection

### Selection round

| Option                                 | Description                                                                  | Selected |
| -------------------------------------- | ---------------------------------------------------------------------------- | :------: |
| Replace vs refactor strategy           | Rebuild vs refactor vs hybrid for existing AppSidebar/SiteHeader/MainLayout  |    ✓     |
| Classification chrome (SHELL-03) shape | Single component vs 4 per-direction vs CSS-only data-direction               |          |
| Navigation data source shape           | Reuse `navigation-config.ts` + extend vs replace with handoff-aligned config |          |
| GASTAT logo delivery model             | Inline SVG / public asset / Vite URL import / svgr plugin                    |          |

**User's choice:** "Replace vs refactor strategy" (multiSelect, only one selected)
**Notes:** User deferred classification shape, nav taxonomy, and topbar order to Claude's discretion (see "Ready for context" round below). GASTAT logo delivery was selected as a follow-up during the strategy deep-dive even though not initially ticked.

---

## Area 1 — Overall strategy for Phase 36's shell replacement

| Option                                                  | Description                                                                                                     | Selected |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | :------: |
| Hybrid — keep primitive+nav-config, rewrite composition | Preserve `components/ui/sidebar.tsx` + `navigation-config.ts`; rewrite AppSidebar/SiteHeader/MobileBottomTabBar |          |
| **Fresh AppShell — new component replaces MainLayout**  | New `AppShell.tsx`; delete `MainLayout.tsx`, `AppSidebar.tsx`, `SiteHeader.tsx` at end                          |  **✓**   |
| Refactor in place — minimal disturbance                 | Touch only the files already named; no renames                                                                  |          |
| Full rebuild — delete everything + start over           | Delete primitive + nav-config + all layout; rebuild from scratch                                                |          |

**User's choice:** Fresh AppShell (option 2). More ambitious than the Recommended option; delivers cleaner taxonomy post-phase.
**Notes:** User preferred clean-slate over preservation. Drives CONTEXT D-01 + D-04.

---

## Area 1 (cont.) — What happens to MobileBottomTabBar?

| Option                                                  | Description                                        | Selected |
| ------------------------------------------------------- | -------------------------------------------------- | :------: |
| **Delete — overlay drawer is sole mobile nav**          | Matches SHELL-04: single mobile-nav pattern        |  **✓**   |
| Keep — drawer for deep nav, tab bar for frequent routes | Dual pattern; more discoverable but not in handoff |          |
| Hide when drawer is open                                | Tab bar as default, hide on drawer open            |          |

**User's choice:** Delete (option 1, Recommended)
**Notes:** Aligns the mobile responsive model to one pattern. Drives CONTEXT D-05.

---

## Area 1 (cont.) — GASTAT logo delivery

| Option                                               | Description                                                               | Selected |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | :------: |
| **Inline React SVG component**                       | `frontend/src/components/brand/GastatLogo.tsx` with `fill="currentColor"` |  **✓**   |
| Public asset + `<img>` tag with CSS mask for tinting | Lighter bundle but mask-image quirks                                      |          |
| Import as asset URL via Vite                         | Auto-hashed filename but no currentColor tinting                          |          |
| Import as React component via vite-plugin-svgr       | Same as option 1 without manual TSX conversion; new dependency            |          |

**User's choice:** Inline React SVG (option 1, Recommended)
**Notes:** Preserves currentColor tinting without additional Vite plugin. Drives CONTEXT D-07.

---

## Closing round — More areas to explore?

| Option                                         | Description                               | Selected |
| ---------------------------------------------- | ----------------------------------------- | :------: |
| **I'm ready for context**                      | Write CONTEXT.md with what's decided      |  **✓**   |
| Explore classification chrome shape (SHELL-03) | 3-variant DOM structure                   |          |
| Explore nav section taxonomy                   | Which routes → Operations/Dossiers/Admin  |          |
| Explore topbar item order + RTL                | 6-item sequence + reading-order semantics |          |

**User's choice:** Ready for context (option 1, Recommended)
**Notes:** Other 3 areas fall to Claude's discretion — researcher/planner decide.

---

## Claude's Discretion

Areas where the user explicitly deferred to Claude (captured in CONTEXT.md's "Claude's Discretion" section):

- Classification chrome (SHELL-03) component shape — single-with-switch vs per-direction vs CSS-only
- Nav section taxonomy — which existing routes map to Operations/Dossiers/Admin
- Topbar item order (LTR JSX) + RTL semantics
- Drawer trigger icon + placement
- Active-nav 2px accent-bar technique (pseudo-element vs border-inline-start)
- User-card anatomy fields
- Cookie/localStorage key for sidebar collapsed state
- Tweaks gear repositioning inside new Topbar
- CI-gate script extension for deleted components

## Deferred Ideas

- ⌘K command palette behavior (separate future phase)
- Notification bell dropdown inner UI (Phase 42)
- GlobeLoader splash (Phase 37 VIZ-01)
- LanguageProvider id.locale migration (tech-debt sidetrack)
- Axe a11y sweep + VRT baselines (Phase 43 QA sweep)
