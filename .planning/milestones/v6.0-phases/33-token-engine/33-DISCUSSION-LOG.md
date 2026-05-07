# Phase 33: Token Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 33-token-engine
**Areas discussed:** Token application mechanism, HeroUI v3 bridge scope, Legacy theme migration, Token set canonicalization

---

## Token Application Mechanism (Area 1)

### Q1.1 — How should the token engine actually push values to `:root`?

| Option                                                     | Description                                                                                                                                                                        | Selected |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Runtime JS via setProperty (Recommended)                   | TS `buildTokens()` computes OKLCH vars and writes via `documentElement.style.setProperty`. Handles any hue 0-360° without pre-bake. Small FOUC risk mitigated by inline bootstrap. | ✓        |
| Static pre-baked CSS classes                               | All 4 dir × 2 modes × 3 densities as fixed rules, toggle attrs only. Can't satisfy free-form hue from TOKEN-03 without runtime fallback.                                           |          |
| Tailwind v4 @theme + color-mix() only                      | Pure CSS. OKLCH lightness-flip math for `--accent-ink` awkward in pure CSS.                                                                                                        |          |
| Hybrid: static attrs for dir+mode+density, runtime for hue | Pre-bake dir/mode/density classes, runtime writes ~6 hue-derived vars. Two systems to maintain.                                                                                    |          |

**User's choice:** Runtime JS via setProperty (Recommended)
**Notes:** Chosen to match handoff `themes.jsx buildTokens()` 1:1 and satisfy TOKEN-03's free-form hue requirement without pre-bake.

### Q1.2 — Where does the token engine live in the codebase?

| Option                                                         | Description                                                                      | Selected |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| New package `frontend/src/design-system/tokens/` (Recommended) | Dedicated module: directions, densities, buildTokens, applyTokens, types, index. | ✓        |
| Inside existing theme-provider folder                          | Extend `components/theme-provider/`. Mixes old canvas/azure with new engine.     |          |
| Flat files in `frontend/src/lib/`                              | Minimal structure. Loses grouping as Phase 34+ adds more.                        |          |

**User's choice:** New package `frontend/src/design-system/tokens/` (Recommended)
**Notes:** Clean import surface; future phases (34, 35) import from here.

### Q1.3 — How should initial tokens be applied before React renders (avoid FOUC)?

| Option                                             | Description                                                                                          | Selected |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Blocking inline script in index.html (Recommended) | Sync script reads localStorage, computes tokens, sets vars on `<html>` before CSS loads. Zero flash. | ✓        |
| CSS-first defaults + React hydration               | `@theme` has Chancery/light defaults; React hydrates. Brief flash if user prefs differ.              |          |
| Defer to Phase 34 drawer                           | Phase 33 only exposes engine; Phase 34 wires bootstrap. Any page load before Phase 34 uses defaults. |          |

**User's choice:** Blocking inline script in index.html (Recommended)
**Notes:** Token math inlined (~2KB) to run synchronously; full TS module owns subsequent updates.

### Q1.4 — SC-4 RTL: how are density tokens consumed?

| Option                                                        | Description                                                               | Selected |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| Single logical pair (--pad-inline, --pad-block) (Recommended) | Forced-logical, RTL-safe by construction.                                 | ✓        |
| Physical pairs with RTL flip utilities                        | Any direct CSS consumer can accidentally break RTL.                       |          |
| Density drives HeroUI size props only                         | Non-HeroUI surfaces (kanban kcard, calendar cells) won't pick up density. |          |

**User's choice:** Single logical pair (--pad-inline, --pad-block) (Recommended)
**Notes:** Values 52/20/16 → 40/14/12 → 32/10/8 per handoff.

---

## HeroUI v3 Bridge Scope (Area 2)

### Q2.1 — What's the Phase 33 scope for the HeroUI bridge?

| Option                                              | Description                                                                                               | Selected |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| Install HeroUI v3 + build full bridge (Recommended) | Add @heroui/react + @heroui/styles, author heroui.config.ts, create 8 wrappers. Satisfies TOKEN-05 fully. | ✓        |
| Install HeroUI v3 + minimal bridge                  | Install + config only; defer wrappers.                                                                    |          |
| Defer HeroUI entirely to Phase 36                   | Phase 33 sets up CSS vars only. TOKEN-05 partially satisfied.                                             |          |
| Use HeroUI variant system via CSS vars only         | Skip @heroui/styles. Goes against SPEC naming.                                                            |          |

**User's choice:** Install HeroUI v3 + build full bridge (Recommended)
**Notes:** Full TOKEN-05 coverage in Phase 33; accept larger scope.

### Q2.2 — How should the bridge map tokens to HeroUI's semantic system?

| Option                                                | Description                                                                                       | Selected |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| heroui.config.ts with direct var() refs (Recommended) | `primary: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-fg)' }`. HeroUI auto-follows hue. | ✓        |
| Generated shade scales from OKLCH base                | Compute HeroUI 50-900 scales per dir × mode; static object. Doesn't auto-follow hue.              |          |
| Tailwind @theme block + HeroUI reads inherited        | Relies on HeroUI respecting @theme; needs verification.                                           |          |

**User's choice:** heroui.config.ts with direct var() refs (Recommended)
**Notes:** Pure reference, no duplication; HeroUI follows engine automatically.

### Q2.3 — What do the drop-in wrappers do in Phase 33?

| Option                                                  | Description                                                                                             | Selected |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| Replace existing shadcn wrappers in-place (Recommended) | heroui-button.tsx renders real @heroui/react; re-exported from ui/button.tsx. All imports keep working. | ✓        |
| New parallel wrappers, migrate later                    | Two component systems active simultaneously.                                                            |          |
| No wrappers — use HeroUI directly                       | Breaks asChild/cva pattern; harder to swap later.                                                       |          |

**User's choice:** Replace existing shadcn wrappers in-place (Recommended)
**Notes:** Matches CLAUDE.md documented pattern exactly.

### Q2.4 — How do we verify TOKEN-05 is satisfied?

| Option                                     | Description                                                                                | Selected |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ | -------- |
| Storybook + token grid story (Recommended) | One story: 8 components × 4 dirs × 2 modes × 3 densities × sample hues. Visual + snapshot. | ✓        |
| Playwright visual regression test          | Heavier but catches real browser rendering.                                                |          |
| Unit test: computed styles match tokens    | Fast but no visual regressions caught.                                                     |          |
| Manual dev-route verification only         | No CI gate.                                                                                |          |

**User's choice:** Storybook + token grid story (Recommended)
**Notes:** Storybook is NOT currently installed — adds scope. Planner must include Storybook setup as its own plan.

---

## Legacy Theme Migration (Area 3)

### Q3.1 — How should old HSL system and new OKLCH engine coexist?

| Option                                                             | Description                                                                                              | Selected |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------- |
| Parallel — both systems active, new wins via cascade (Recommended) | Keep HSL on :root, add OKLCH. Semantic class mapping rewritten to read OKLCH. Clean cutover in Phase 34. |          |
| Hard cut — delete HSL system in Phase 33                           | Rip out HSL scales, delete canvas/azure enum, remove ThemeProvider. Big diff, high regression risk.      | ✓        |
| Namespace new system with --id- prefix                             | Noise; HeroUI bridge still needs semantic names; still migrate later.                                    |          |

**User's choice:** Hard cut — delete HSL system in Phase 33
**Notes:** User chose the bolder option over the recommendation. Planner must include audit sweep of 16 legacy-theme-name files and ensure Phase 34 boundary (which owns `/themes` route + ThemeSelector.tsx deletion) is unaffected — those files become dead code between Phase 33 landing and Phase 34 landing (acceptable transient state).

### Q3.2 — Remap legacy theme names to new directions for saved prefs?

| Option                             | Description                                                          | Selected |
| ---------------------------------- | -------------------------------------------------------------------- | -------- |
| Yes — best-fit remap (Recommended) | Migrate canvas→ministerial, azure→bureau, etc. Preserves user prefs. |          |
| No — wipe and default to Chancery  | Ignore old localStorage; users start fresh. Every user's pref lost.  | ✓        |
| Warn and reset on first load       | Toast asking to re-select. Needs Phase 34 drawer to exist.           |          |

**User's choice:** No — wipe and default to Chancery
**Notes:** Fast, simple; acceptable trade-off given pre-launch state.

### Q3.3 — What happens to existing ThemeProvider / useTheme()?

| Option                                                | Description                                                                                       | Selected |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| Replace with new DesignProvider + hooks (Recommended) | New provider exposes useDirection/useMode/useHue/useDensity. useTheme() becomes deprecation shim. | ✓        |
| Keep ThemeProvider, extend context value              | Context gets crowded; naming conflicts.                                                           |          |
| Rename + codemod all consumers now                    | Large atomic change across 16+ files.                                                             |          |

**User's choice:** Replace with new DesignProvider + hooks (Recommended)
**Notes:** Shim removed in Phase 34 when Tweaks drawer replaces last consumer.

### Q3.4 — What do Tailwind semantic classes mean after Phase 33?

| Option                                      | Description                                                                                                                                          | Selected |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Remap to new vars (Recommended)             | primary→var(--accent), foreground→var(--ink), border→var(--line), background→var(--bg), card→var(--surface). Core of 'zero per-component overrides'. | ✓        |
| Deprecate semantic names, add new utilities | Keep legacy frozen; every component needs touching later.                                                                                            |          |
| Both — legacy HSL, new utilities OKLCH      | Visual inconsistency; hard to reason about.                                                                                                          |          |

**User's choice:** Remap to new vars (Recommended)
**Notes:** All existing bg-primary/text-foreground/border-border call sites keep rendering correctly, now following the new engine.

---

## Token Set Canonicalization (Area 4)

### Q4.1 — Adopt handoff themes.jsx set 1:1 or extend?

| Option                                  | Description                                                                                  | Selected |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| 1:1 + essential additions (Recommended) | Port handoff verbatim + add --focus-ring, --shadow-drawer, --shadow-card, --radius-sm/md/lg. | ✓        |
| Strict 1:1 — no additions               | Phase 36+41 already mention specific shadows; would push additions later.                    |          |
| Rename to match our conventions         | Loses handoff copy-paste fidelity.                                                           |          |

**User's choice:** 1:1 from handoff + essential additions (Recommended)
**Notes:** `--shadow-drawer` specifically needed by Phase 41 (`-24px 0 60px rgba(0,0,0,.25)`).

### Q4.2 — What does density control beyond row-h/pad/gap?

| Option                                                  | Description                                                                     | Selected |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Row-h + pad-inline + pad-block + gap only (Recommended) | Exact handoff. Type scale and radius stay fixed.                                | ✓        |
| Also shift type scale                                   | Diverges from handoff; conflicts with Phase 35 locking typography to direction. |          |
| Also shift radius                                       | Diverges from handoff.                                                          |          |

**User's choice:** Row-h + pad-inline + pad-block + gap only (Recommended)

### Q4.3 — Expose OKLCH lightness scales (--accent-50..900) or named semantic only?

| Option                                      | Description                                                                                | Selected |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | -------- |
| Named semantic only (Recommended)           | Expose --accent, --accent-ink, --accent-soft, --accent-fg etc. Mid-shades via color-mix(). | ✓        |
| Named + generated 50..900 scales per family | +60 vars on :root; mostly unused until later.                                              |          |
| Named now, scales added per phase           | Churns the token engine later.                                                             |          |

**User's choice:** Named semantic only (Recommended)

### Q4.4 — Scope of Tailwind utility bindings?

| Option                                            | Description                                                                          | Selected |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Full utility set matching token set (Recommended) | Every named token gets a utility via @theme: bg-surface, text-ink, border-line, etc. | ✓        |
| Minimal set — just the 4 SCs name                 | Only bg-surface, text-accent, border-line, bg-accent-soft; others per-phase.         |          |
| Legacy semantic-only remap                        | Doesn't satisfy SC-5 literally.                                                      |          |

**User's choice:** Full utility set matching token set (Recommended)
**Notes:** Downstream phases (36 shell, 38 dashboard, 39 kanban, 41 drawer, 42 remaining pages) can compose tokens directly in JSX.

---

## Claude's Discretion

- Hue input surface UI (deferred to Phase 34)
- Exact direction palette values (port verbatim from handoff themes.jsx)
- Direction defaults (implied by Phase 34 SC-3)
- React hook re-render strategy (context vs useSyncExternalStore) — Claude picks at plan time based on perf measurement

## Deferred Ideas

- Per-component HeroUI overrides (revisit as SPEC violation if they appear)
- Scoped tokens per route (not in handoff)
- User-custom 5th direction (future backlog)
- Runtime theme preview in dev tools (not required)
- `setProperty` batching with `requestAnimationFrame` (measure first)
- Accent contrast auto-correction for WCAG AA (Phase 43 may enforce)
