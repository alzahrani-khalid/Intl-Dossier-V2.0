# Phase 35: typography-stack — Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 35 delivers the Latin + Arabic font pipeline that lets every surface render in the correct per-direction display/body/mono triplet, with Arabic (`html[dir="rtl"]`) overriding every display-font usage to Tajawal and `[dir="ltr"]`-isolated mono spans pinning to JetBrains Mono. All 7 Latin families plus Tajawal load self-hosted via `@fontsource[-variable]/*` with zero Google Fonts CDN calls. The work extends Phase 33's token engine to emit three new CSS variables (`--font-display`, `--font-body`, `--font-mono`) and ports the handoff's RTL override cascade into `frontend/src/index.css` verbatim.

**Per-direction triplets (from ROADMAP §Phase 35 SC-1 / TYPO-01):**

| Direction      | Display       | Body          | Mono           |
| -------------- | ------------- | ------------- | -------------- |
| Chancery       | Fraunces      | Inter         | JetBrains Mono |
| Situation Room | Space Grotesk | IBM Plex Sans | IBM Plex Mono  |
| Ministerial    | Public Sans   | Public Sans   | JetBrains Mono |
| Bureau         | Inter         | Inter         | JetBrains Mono |

**Unique font families = 7 Latin + 1 Arabic:** Fraunces, Space Grotesk, Public Sans, Inter, IBM Plex Sans, IBM Plex Mono, JetBrains Mono, Tajawal. (Note: REQUIREMENTS.md §Typography and ROADMAP wording say "6 Latin" — the correct count is 7 once IBM Plex Sans and IBM Plex Mono are counted as separate families, which they must be because they're separate `@fontsource` packages. This is captured as `<specifics>` below; CONTEXT.md uses 7 as the canonical count.)

**Phase 35 does NOT:**

- Render any shell chrome / sidebar / topbar typography classes (`.sb-group`, `.page-title`, etc.) — Phase 36 owns the chrome.
- Introduce new design tokens beyond the three font vars — Phase 33 already locked the color/line/density token set (D-13).
- Rebuild the dashboard, kanban, calendar, or any list page typography — Phases 38-42.
- Run the responsive + RTL audit — Phase 43 (QA sweep).
- Add `⌘K` / `T−3` / date-formatted UI elements that exercise the `[dir="ltr"].mono` carve-out — this phase only prepares the CSS rule so that downstream `.mono[dir="ltr"]` spans will correctly resolve to JetBrains Mono.

</domain>

<decisions>

## Implementation Decisions

### Token Application Pipeline (Area 1)

- **D-01** — **Extend Phase 33's `buildTokens(direction, mode, hue, density)` to emit `--font-display`, `--font-body`, `--font-mono`.** The existing `applyTokens()` function writes every returned key to `document.documentElement.style` via `setProperty()`; adding three string-valued keys requires no pipeline changes. Ensures the font triplet and the color tokens are always applied atomically on the same effect tick — eliminates any possibility of font/color desync after direction switch. Extends the engine's unit-test surface by three assertions per direction (4 directions × 3 fonts = 12 additional cases).
- **D-02** — **Rewrite legacy font-family vars in `frontend/src/index.css` inline.** Rename every `var(--text-family)` → `var(--font-body)` (lines 211, 216, 259, 286, 328), every `var(--display-family)` → `var(--font-display)` (lines 238, 302, 319), delete every `var(--text-family-rtl)` rule (lines 293, 312, 324, 333) — the handoff's Tajawal cascade (D-07) replaces all RTL family routing. Also delete the hardcoded `ui-monospace, SFMono-Regular...` stack at line 266 (replaced by `var(--font-mono)`). No component-level changes required: the only TSX reference to `fontFamily` is `frontend/src/components/ui/placeholders-and-vanish-input.tsx:64` which reads `computedStyles.fontFamily` from a canvas ctx — it tracks whatever CSS resolves, so it auto-migrates.

### Fontsource Packaging (Area 2)

- **D-03** — **Mix strategy: variable where available, classic where not.**
  - Variable (`@fontsource-variable/*`): `inter`, `public-sans`, `space-grotesk`, `fraunces`, `jetbrains-mono`. Import the standard `wght.css` sub-path per family — single woff2 file per family with arbitrary-weight support.
  - Classic (`@fontsource/*`): `ibm-plex-sans`, `ibm-plex-mono`, `tajawal`. Import explicit 400/500/600/700 for display+body; 400/500 for mono (TYPO-02 weight matrix).
  - **Research must verify** every named package resolves on npm with the version constraint `^5.x` before Plan 35-01 lands (see STATE.md blockers — this is pre-flagged).
- **D-04** — **Full variable axis files, no subset syntax.** Import `@fontsource-variable/inter/wght.css` etc. as-is. Rejects the `?weight=400..700` querystring subset approach: fontsource subset syntax varies across package versions and breaks silently on package bumps. Future-proof; bundle delta is ~10KB per family (~50KB total) — acceptable for simplicity.

### Loading Strategy (Area 3)

- **D-05** — **All-at-boot via `frontend/src/fonts.ts` side-effect module.** New file imports every fontsource package; `main.tsx` imports `./fonts` before rendering `<App/>`. Matches Phase 33's FOUC-first bootstrap philosophy. Rejects code-splitting per direction because: (1) direction switch re-lays-out the whole UI via different type-scale direction classes — a simultaneous FOUT would compound the visual jolt, (2) Tweaks drawer is a power-user affordance, not a daily toggle (switches are rare), (3) woff2 files are individually cacheable, so the ~300-400KB cold-start cost is a one-time tax.

### Arabic Gating + Override Placement (Area 4)

- **D-06** — **Tajawal loads unconditionally in `fonts.ts`.** Not gated on `id.locale`. Rationale: (1) Arabic is first-class per CLAUDE.md global rules (the native app has `I18nManager.forceRTL(true)` globally; web follows the same posture), (2) users can toggle locale at any time in the Tweaks drawer — any async load would show an Arabic fallback flash, (3) Phase 43 (QA sweep) exercises every route in AR/RTL, (4) consistent with D-05 (all-at-boot).
- **D-07** — **Inline the handoff's Tajawal cascade block verbatim in `frontend/src/index.css`.** Paste the complete block starting at `/* ============ Arabic typography override: Tajawal ============ */` through the `.tb-locale-btn[data-lang="ar"]` rule (~60 lines, lines approximately 140-200 of `/tmp/inteldossier-handoff/inteldossier/project/src/app.css`). Place AFTER the Phase 33 `@theme` block but BEFORE any Phase 33-era utility layers. Add a comment header citing the source file and TYPO-03 for future auditors. Byte-for-byte preservation makes TYPO-03 compliance grep-verifiable.

### Claude's Discretion (planner decides at plan time)

- **Font fallback chain:** Use the handoff's minimal `'Fraunces', serif` / `'Inter', system-ui, sans-serif` / `'JetBrains Mono', ui-monospace, monospace` pattern unless the planner has a reason to prefer an enhanced chain (e.g., `-apple-system, BlinkMacSystemFont, ...` for body). Default: match handoff.
- **`font-display: swap` vs `fallback` vs `optional`:** fontsource's default is `swap`. Keep default unless a specific flash-of-fallback-text concern arises.
- **`<link rel="preload">` hints in `frontend/index.html`:** optional micro-opt for the default direction's three fonts. Planner decides based on Lighthouse first-paint measurements during plan-phase research.
- **Where exactly in `fonts.ts` to group imports:** alphabetical, by direction, or by family role (display/body/mono). Cosmetic — planner picks.
- **Tailwind v4 `@theme` font utility bindings** (e.g., `font-display`, `font-body`, `font-mono`): if Phase 33's `@theme` block doesn't already emit these, Phase 35 adds them alongside the token names. Planner confirms existing state during research.
- **Test split between unit (tokens.test.ts) and E2E (Playwright font-family getComputedStyle assertions):** planner decides the partition during plan-phase.

</decisions>

<cross_phase_notes>

## Cross-Phase Flags

- **Blocker to resolve in research (from STATE.md):** "Confirm `@fontsource/fraunces`, `@fontsource/space-grotesk`, `@fontsource/public-sans`, `@fontsource/inter`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`, `@fontsource/jetbrains-mono`, `@fontsource/tajawal` packages resolve before Phase 35 (TYPO-02)." Research agent must `pnpm info` each package + variable-variant and report latest stable version.
- **Sequencing note for Phase 36 (shell-chrome):** Phase 35 introduces the font tokens but does NOT render the `.page-title` / `.card-title` / `.sb-group` classes that consume them. Phase 36 will consume `var(--font-display)` etc. directly via Tailwind utilities (e.g. `font-display`) or inline CSS — plan accordingly so the Phase 36 chrome doesn't reintroduce hardcoded font-family strings.
- **Downstream TYPO-04 dependency:** The CSS rule `html[dir="rtl"] [dir="ltr"].mono, kbd[dir="ltr"] { font-family: 'JetBrains Mono', ui-monospace, monospace; }` is landed by this phase, but the `.mono` / `kbd[dir="ltr"]` spans that exercise it (`⌘K`, `T−3`, `+2`, date strings) are introduced by Phases 36-42. Phase 35's E2E test coverage for TYPO-04 should either (a) assert on a fixture element, or (b) be deferred to Phase 43's QA sweep — planner decides.
- **Phase 43 coupling:** Phase 43 will re-assert TYPO-01..04 end-to-end across all 13+ routes. Phase 35's tests should cover the token engine + index.css contract; Phase 43 covers the cross-route integration.

</cross_phase_notes>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-defining docs

- `.planning/ROADMAP.md` §"Phase 35: typography-stack" — 4 Success Criteria (the verification bar).
- `.planning/REQUIREMENTS.md` §"Typography (TYPO)" — TYPO-01 (per-direction triplets), TYPO-02 (self-hosted + weights), TYPO-03 (Arabic verbatim preservation), TYPO-04 (`[dir="ltr"]` mono exception).

### Prior phase context (LOCKED DECISIONS THAT FLOW INTO THIS PHASE)

- `.planning/phases/33-token-engine/33-CONTEXT.md` — **Critical.** D-13 (token set), D-14 (type scale is direction-driven, not density-driven), D-15 (named semantic tokens only), D-16 (full Tailwind utility set via `@theme`). Font tokens follow the same application pipeline as color tokens.
- `.planning/phases/34-tweaks-drawer/34-CONTEXT.md` — `id.locale` persistence key drives `html[dir]` attribute; `id.dir` drives direction. Tweaks drawer is the sole UI for both — Phase 35 does NOT add any font-related control surface.

### Handoff bundle (design source of truth — port 1:1)

- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` — **The canonical source for the Tajawal override cascade.** Lines ~140-200 contain the full `html[dir="rtl"]` block that D-07 requires verbatim. This same file is where all the `.page-title` / `.card-title` / `.drawer-title` / `.kpi-value` / `.chip` / `.digest-tag` / `.task-due` class references come from — Phase 35 preserves them as-is even though Phases 36+ will actually render those elements.
- `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` — Reference for per-direction visual intent (confirms the font triplet mapping in D-03 matches the handoff's prototype).

### Project conventions

- `CLAUDE.md` (project) §"HeroUI v3 Component Strategy" — confirms Tailwind v4 + HeroUI v3 stack is locked; §"Arabic RTL Support Guidelines" — logical properties invariant.
- `CLAUDE.md` (global, user's home) §"MANDATORY: RTL-First Rules" — confirms Arabic is first-class (reinforces D-06 rationale).
- `.planning/PROJECT.md` — current milestone v6.0 Design System Adoption scope.

### External docs (fetch during research via Context7 or mcp**context7**\*)

- `@fontsource` and `@fontsource-variable` per-package READMEs — verify version + import paths + variable axis availability for all 8 families listed in D-03.
- Tailwind v4 `@theme` font-family utility docs — confirm syntax for declaring `--font-display` / `--font-body` / `--font-mono` to produce `font-display` / `font-body` / `font-mono` utilities (if not already done in Phase 33).
- MDN `font-display` property — confirm `swap` (fontsource default) is correct for this app's first-paint goals.

### Current codebase integration points (planner will touch these)

- `frontend/src/index.css` — 11 legacy `var(--text-family*)` / `var(--display-family)` references at lines 211, 216, 238, 248, 259, 266, 286, 293, 302, 312, 319, 324, 328, 333. D-02 rewrites all. D-07 adds the Tajawal cascade block.
- `frontend/src/main.tsx` — new `import './fonts'` line at top (D-05).
- `frontend/src/fonts.ts` — **new file** (D-05). 8 fontsource imports as side effects.
- Phase 33's token engine module (exact path TBD — researcher confirms). Location likely `frontend/src/lib/design/tokens.ts` or similar. D-01 extends `buildTokens()` and its types/tests.
- Phase 33's `applyTokens()` — should need zero changes; it already iterates every token key.
- `frontend/package.json` — 8 new `@fontsource[-variable]/*` dependencies (D-03).
- `frontend/src/components/ui/placeholders-and-vanish-input.tsx:64` — **no change needed** (auto-migrates via computedStyles).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Phase 33's `buildTokens()` + `applyTokens()` pipeline** — D-01 extends this. The function signature already accepts `direction` as the first arg. Type of the returned token map likely needs a small expansion (add three new keys to the token-name union type). Tests already structure-match against direction enums so adding three assertions per direction is mechanical.
- **Phase 33's `DesignProvider` + `useDesignDirection()` hook** — no API changes needed. DesignProvider's effect already calls `applyTokens()` on direction change; extended tokens flow through automatically.
- **Phase 33's `@theme` block in `index.css`** — likely already exposes token names as Tailwind utilities. Researcher confirms whether `font-display` / `font-body` / `font-mono` utility classes already resolve; if not, D-16 (Phase 33) pattern adds them.
- **Phase 34's `id.locale` localStorage key + bootstrap migrator** — Phase 35 consumes `document.documentElement.dir` which is already set by Phase 34's bootstrap. No coordination needed.

### Established Patterns

- **FOUC bootstrap** — Phase 33 introduced an inline synchronous script in `frontend/index.html` that reads localStorage and applies tokens before first paint. Fonts (as side-effect `@import`s from `main.tsx`) load in parallel; the CSS variables they reference are set by the bootstrap before React mounts, so there's no race.
- **Token-to-utility bridging via `@theme`** — Phase 33 D-16 established that every named token gets a Tailwind utility. Fonts follow: `--font-display` → `font-display` utility.
- **Shadcn-style re-export layer for UI components** — not directly touched by this phase, but planners should know that HeroUI wrappers inherit family via CSS vars, not props. No per-component font prop needed.

### Integration Points

- **`main.tsx`** — add `import './fonts'` as the very first line (before any other side-effect imports). Order matters: fontsource packages inject `@font-face` rules via JS that the subsequent CSS-var reads rely on.
- **`index.css`** — two separate mutations: (a) rename 11 legacy var references in existing rules (D-02), (b) append the Tajawal cascade block (D-07). Both in the same file, separate plans for reviewability.
- **Phase 33 token engine module** — add 3 keys to the token map for each direction; update the TS type; update unit tests.

### Migration Risk Hotspots

- **`placeholders-and-vanish-input.tsx:64`** reads `ctx.font = \`${fontSize \* 2}px ${computedStyles.fontFamily}\``. After D-02 rewrites body font-family var, the computed string changes from `var(--text-family)`-resolved to `var(--font-body)`-resolved — visually identical once `--font-body`is populated, but verify no canvas glyph rendering regression via manual check of the`placeholders-and-vanish-input` usage in the app.
- **Any inline `style={{ fontFamily: ... }}`** anywhere in the codebase that uses the OLD var name. A grep across `frontend/src` confirms only `placeholders-and-vanish-input.tsx` has `fontFamily` outside `index.css`. Safe.
- **Storybook (if Phase 33-08 installed it)** — may need `.storybook/preview.tsx` to import `fonts.ts` so stories render with the right families. Researcher confirms Storybook presence.

</code_context>

<specifics>

## Specific Ideas

- **"7 Latin families" vs "6 Latin fonts" in the spec wording** — ROADMAP.md and REQUIREMENTS.md both say "6 Latin fonts" but the actual unique family count (counting IBM Plex Sans and IBM Plex Mono as separate families, which they must be because they're separate npm packages and separate OpenType font files) is 7. This CONTEXT.md uses 7 as the canonical count. The planner should carry this 7-count into plan task descriptions; the researcher should not be misled by the spec wording.
- **TYPO-04's "JetBrains Mono" carve-out in Situation direction** — in Situation direction, the global mono is IBM Plex Mono (per TYPO-01). But the TYPO-04 rule `html[dir="rtl"] [dir="ltr"].mono, kbd[dir="ltr"]` hardcodes `'JetBrains Mono'` in the font-family cascade (per handoff's `app.css`). Interpretation: when a `[dir="ltr"]`-isolated span sits inside an RTL document, it renders JetBrains Mono regardless of the outer direction's configured mono font. This is a spec-level quirk we preserve verbatim (TYPO-03) rather than engineer around.
- **Handoff uses direction classes `.dir-chancery` etc.** on the body, but Phase 33's token pipeline writes CSS vars directly to `:root`. The handoff classes are NOT required for font routing in our implementation — the tokens on `:root` suffice. (Some chrome classes from the handoff like `.dir-chancery .drawer-title` are scope overrides Phase 36 will handle.)

</specifics>

<deferred>

## Deferred Ideas

- **Arabic font variants beyond Tajawal** (e.g., IBM Plex Sans Arabic, Noto Naskh Arabic) — future theming direction; not in v6.0 scope. Would require a per-direction Arabic font map paralleling the Latin one.
- **Font optical-size axis usage** (Fraunces has `opsz` — different glyph forms at small vs display sizes) — potential visual quality win for Chancery direction; future enhancement. Phase 35 uses the base `wght` axis only.
- **Subset fonts to Arabic + Latin Extended only** — smaller woff2 by dropping Cyrillic, Greek, etc. Not necessary for first ship; revisit if bundle-size audit flags it.
- **Preload critical fonts via `<link rel="preload">`** — listed under Claude's Discretion above; if planner doesn't enable, could be a deferred optimization for a future perf-pass phase.
- **Reviewed todos (none)** — `gsd-sdk query todo.match-phase "35"` returned zero matches.

</deferred>

---

_Phase: 35-typography-stack_
_Context gathered: 2026-04-21_
