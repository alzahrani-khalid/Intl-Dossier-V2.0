---
phase: 51
plan: 02
plan_id: 51-02
type: execute
wave: 2
depends_on: [51-01]
files_modified:
  - frontend/src/components/geographic-visualization/WorldMapVisualization.tsx
  - frontend/src/components/position-editor/PositionEditor.tsx
autonomous: true
requirements: [DESIGN-03]
requirements_addressed: [DESIGN-03]
tags: [tier-a, design-tokens, world-map, position-editor, visual-parity]
objective: >-
  Tier-A swap the two ROADMAP-named violation anchors: WorldMapVisualization.tsx:193 (raw hex
  `#3B82F6` → token-derived accent color via the `var(--accent)` / `getComputedStyle` recipe)
  and PositionEditor.tsx (19 palette literals at lines 211, 237, 410, 412, 441, 442, 449,
  486, 487, 495, 531 → token-mapped utilities per the Token-replacement contract in
  51-UI-SPEC.md). Each swap must be visually-parity-verified at Bureau-light 1280px and the
  RTL Tajawal locale before commit.
user_setup: []
must_haves:
  truths:
    - 'WorldMapVisualization.tsx no longer contains the substring `#3B82F6` (or any raw hex outside Tier-B file scope).'
    - 'PositionEditor.tsx no longer contains the substrings `text-blue-600`, `text-red-800`, `text-red-600`, `bg-red-50`, `border-red-200` (the five named D-02 anchor sites).'
    - 'PositionEditor.tsx no longer contains banned palette substrings at the additional mechanical sites (lines 441, 442, 449, 486, 487, 495) — `border-gray-300`, `bg-gray-100`, `focus:ring-blue-500` or their variants are removed and replaced with token utilities.'
    - 'Bureau-light visual parity holds: error card stays pale-red, link state shifts to Bureau accent terracotta (intentional MINOR diff per UI-SPEC §Visual Fidelity Guarantee).'
    - "RTL with Tajawal renders the swapped components without new font-family or textAlign:'right' declarations."
    - '`pnpm exec eslint -c eslint.config.mjs <changed-file>` exits 0 with zero D-05 warnings on each of the two anchor files post-swap.'
  artifacts:
    - path: 'frontend/src/components/geographic-visualization/WorldMapVisualization.tsx'
      provides: 'Tier-A swap for line 193 (lineColor prop)'
      contains: 'var(--accent)'
    - path: 'frontend/src/components/position-editor/PositionEditor.tsx'
      provides: 'Tier-A swaps for 19 palette-literal sites — link decoration, error card, error icon, input chrome'
      contains: 'text-accent'
  key_links:
    - from: 'WorldMapVisualization.tsx:193'
      to: 'frontend/src/index.css `--accent` token declaration'
      via: "var(--accent) SVG prop OR getComputedStyle(documentElement).getPropertyValue('--accent')"
      pattern: "lineColor=\"var\\(--accent\\)\"|lineColor=\\{accentColor\\}"
    - from: 'PositionEditor.tsx tiptap Link.HTMLAttributes.class (lines 211, 237)'
      to: 'tailwind v4 @theme `text-accent` utility (index.css:43-118)'
      via: 'className string swap from `text-blue-600 underline` to `text-accent underline`'
      pattern: "class: 'text-accent underline'"
    - from: 'PositionEditor.tsx error card (line 410)'
      to: 'text-danger / bg-danger / border-danger token family via `@theme` `--color-danger: var(--danger)`'
      via: 'className swap from `border-red-200 bg-red-50` to `border-danger/30 bg-danger/10` and `text-red-800` to `text-danger`'
      pattern: 'border-danger/30|bg-danger/10'
---

<objective>
Land the two ROADMAP success-criterion-3 anchor files: `WorldMapVisualization.tsx`
(one raw hex) and `PositionEditor.tsx` (19 palette literals at 11 sites). Both surface
through the D-05 rule (active at `warn` severity per Plan 51-01) so the executor can
verify each swap via `pnpm exec eslint <file>` returning zero new warnings.

The WorldMap swap is the only non-mechanical edit in this phase — SVG prop interpolation
may not resolve `var(--accent)` in every renderer, requiring a 30-min spike to choose
between Recipe A (`var()` reference) and Recipe B (`getComputedStyle` read). RESEARCH §5.1
documents both recipes; the executor commits to one after dev-page verification.

The PositionEditor swaps are fully mechanical against the Token-replacement contract in
51-UI-SPEC.md — 19 literals across 5 semantic categories (link, error card, error message
body, error icon, input chrome) all map cleanly via the cookbook.

This plan is parallel-safe with Plan 51-03 (Tier-A mechanical sweep) — they touch
disjoint file sets. Both depend on Plan 51-01's rule + Tier-B carve-out.

Purpose: clear ROADMAP success criterion 3's two named anchors. The 80-120-file mechanical
sweep is Plan 51-03's scope.
Output: two Tier-A-clean files, ready for `pnpm exec eslint` zero-warning verification.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/51-design-token-compliance-gate/51-CONTEXT.md
@.planning/phases/51-design-token-compliance-gate/51-RESEARCH.md
@.planning/phases/51-design-token-compliance-gate/51-PATTERNS.md
@.planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md
@.planning/phases/51-design-token-compliance-gate/51-VALIDATION.md
@CLAUDE.md
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts
@frontend/src/components/geographic-visualization/WorldMapVisualization.tsx
@frontend/src/components/position-editor/PositionEditor.tsx

<interfaces>
<!-- Token utility map — implicit allowlist comes from frontend/src/index.css @theme block lines 43-118. -->
<!-- Key utility names that the new lint selectors deliberately do NOT match (D-06): -->

Token utilities available for swap (excerpt from frontend/src/index.css `@theme`):

- `text-accent` / `bg-accent` / `border-accent` — `--color-accent: var(--accent)` (Bureau oklch(58% 0.14 32))
- `text-danger` / `bg-danger` / `border-danger` — `--color-danger: var(--danger)` (oklch(52% 0.18 25))
- `text-success` / `bg-success` — `--color-success: var(--ok)`
- `text-warning` / `bg-warning` — `--color-warning: var(--warn)`
- `text-info` / `bg-info` — `--color-info: var(--info)`
- `text-ink` / `text-ink-mute` / `text-ink-faint` — ink ramp
- `bg-bg` / `bg-surface` / `bg-line-soft` — chrome surfaces
- `border-line` / `border-line-soft` / `border-input` — hairlines
- `ring-accent` / `focus:ring-accent` — focus state
- Opacity modifier syntax: `bg-danger/10`, `border-danger/30` is core Tailwind v4 syntax for `--color-*` tokens

Tier-A swap table (from 51-UI-SPEC.md §Token-replacement contract):
| Banned palette | Token-mapped swap |
| `text-blue-600 underline` (link) | `text-accent underline` |
| `border-red-200 bg-red-50` | `border-danger/30 bg-danger/10` |
| `text-red-800` (error text) | `text-danger` |
| `text-red-600` (error icon) | `text-danger` |
| `border-gray-300` (input border) | `border-input` (resolves to `--input: var(--line)`) |
| `bg-gray-100` (disabled state) | `bg-muted` |
| `focus:ring-blue-500` | `focus:ring-accent` (preserves variant prefix) |

WorldMap recipe options (from RESEARCH §5.1 + UI-SPEC §SVG / prop-pattern guidance):

- Recipe A: `lineColor="var(--accent)"` — works if dotted-map / SVG renderer resolves `var()` in presentation attributes (Chrome/Safari support since 2021; Firefox 2022).
- Recipe B: `const accentColor = React.useMemo(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(), [])` then `lineColor={accentColor}`. Always works regardless of SVG renderer pipeline.
- Recipe C: use existing `graphEdgeColors` map from `frontend/src/lib/semantic-colors.ts:386` which already returns `var(...)`-prefixed strings.

Verification commands (from 51-VALIDATION.md):

- Per-file: `pnpm exec eslint -c eslint.config.mjs <file>` → exits 0 with 0 D-05 warnings.
- Component tests: `pnpm --filter intake-frontend test --run -- position-editor` and `pnpm --filter intake-frontend test --run -- geographic-visualization` (verify the workspace name is `intake-frontend`, NOT `frontend`, per STATE.md Phase 39 Rule-3 note).
  </interfaces>
  </context>

<threat_model>

## Trust Boundaries

| Boundary                                                                | Description                                                                                                                                                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WorldMapVisualization SVG renderer ← React 19 reconciliation            | `lineColor` prop value flows from JS string into SVG `stroke=` / `stop-color=` attributes; renderer-pipeline behavior is opaque                                                     |
| PositionEditor tiptap `Link.configure` ← className string interpolation | the `class` attribute on the configured Link extension is interpolated into rendered `<a class="...">`; Tailwind tree-shaking depends on the literal being detectable at build time |

## STRIDE Threat Register

| Threat ID | Category               | Component                                                     | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                  |
| --------- | ---------------------- | ------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-51-07   | Tampering              | WorldMap SVG color resolution                                 | mitigate    | Run a 30-min dev-page spike before committing: mount WorldMapVisualization, screenshot, swap to Recipe A (`var(--accent)`), re-mount, re-screenshot. If SVG renders correctly, commit Recipe A. If not, fall back to Recipe B (`getComputedStyle`). Document the chosen recipe in the commit message + 51-02-SUMMARY.md.                         |
| T-51-08   | Information Disclosure | Tailwind tree-shaking on tiptap `Link.configure` class string | mitigate    | The class string is a literal at module scope (`class: 'text-accent underline'`). Tailwind v4's content scanner reads source files at build time and picks up token-mapped utilities the same way it picks up palette utilities. No mitigation beyond ensuring the literal is statically analyzable (no string concat / no runtime computation). |
| T-51-09   | Denial of Service      | Visual regression on dark mode or RTL Tajawal                 | mitigate    | UI-SPEC §Visual Fidelity Guarantee step 2 (RTL Tajawal) + step 3 (dark mode passthrough) — verify both paths before committing. The token utilities route through `--color-*` → `var(--*)` → dark-side OKLCH automatically (Phase 33 + Phase 34 precedent).                                                                                      |
| T-51-10   | Repudiation            | Surgical-change posture drift during 19-literal sweep         | mitigate    | Karpathy §3 boundary: ONLY change the cited className strings. Do NOT reflow JSX, rename props, refactor tiptap config shape, or "fix" adjacent code noticed in passing. Verification: `git diff frontend/src/components/position-editor/PositionEditor.tsx` should show ONLY className changes; no whitespace-only edits, no import reordering. |

All threats scored low or mitigated; no high-severity threats remain unaddressed.
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: WorldMapVisualization.tsx Tier-A swap (one raw hex)</name>
  <files>frontend/src/components/geographic-visualization/WorldMapVisualization.tsx</files>
  <read_first>
    - frontend/src/components/geographic-visualization/WorldMapVisualization.tsx (full file — ~200 lines)
    - frontend/src/components/ui/world-map.tsx (the WorldMap component definition — confirm `lineColor` prop signature, line 138/151/157/183/189/217 SVG attribute interpolation)
    - frontend/src/index.css §`:root` block at lines 125-266 to confirm `--accent` token value
    - frontend/src/lib/semantic-colors.ts §`graphEdgeColors` definition (line ~386) — donor for Recipe C `var(--*)` string pattern
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §5.1 "Specific anchor recipes — 1) WorldMapVisualization.tsx:193"
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"frontend/src/components/geographic-visualization/WorldMapVisualization.tsx" pattern assignment with Recipe A/B/C verbatim
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Token-replacement contract — raw hex → token" row 1 + §"SVG / prop-pattern guidance" + §"Visual Fidelity Guarantee"
  </read_first>
  <action>
    Three-step approach: SPIKE → CHOOSE RECIPE → SWAP.

    SPIKE (30 min, before any source edit):
    - Identify how the existing dev environment renders this component. Options: (i) an existing route that mounts it (most likely under `frontend/src/routes/_protected/...`), (ii) a quick dev page added under `frontend/src/dev-pages/` for testing, or (iii) a Vitest snapshot test with `@testing-library/react` rendering the component into JSDOM.
    - Mount the component pre-swap, capture a Bureau-light 1280px screenshot.
    - Try Recipe A first: `lineColor="var(--accent)"`. Mount, screenshot. If the SVG renders the connection lines with the Bureau accent terracotta hue, commit Recipe A.
    - If Recipe A fails (line invisible / black / fallback color in Chrome devtools Computed panel), fall back to Recipe B: introduce `const accentColor = React.useMemo(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#C2553D', [])` inside the component body and pass `lineColor={accentColor}`. The `|| '#C2553D'` fallback is the Bureau-light `--accent` resolved hex equivalent for FOUC-bootstrap safety (matches the bootstrap.js + directions.ts byte-match invariant; the fallback hex is intentionally inside this hook expression so it does NOT trip the D-05 selector because the file would still emit the literal — to avoid the lint warning, EITHER eliminate the fallback OR add the file to a sub-scope. RECOMMENDED: just use `getPropertyValue('--accent').trim() || 'currentColor'` to dodge the issue entirely; `currentColor` resolves through Tailwind `text-*` on a parent if applied).
    - Recipe C alternative: import `graphEdgeColors` from `@/lib/semantic-colors` and pass `lineColor={graphEdgeColors.related_to ?? 'var(--accent)'}` — only if the consumer's existing imports include `semantic-colors.ts`. Verify the WorldMap component's `lineColor` prop signature accepts the kind of string `graphEdgeColors` returns.

    CHOOSE RECIPE: document the chosen path in the commit message (`Recipe A`, `Recipe B`, or `Recipe C`). Include the dev-page screenshot evidence in the 51-02-SUMMARY.md.

    SWAP: edit line 193 from `lineColor="#3B82F6"` to the chosen recipe's value. Verify no other raw hex remains in the file via `grep -nE "#[0-9a-fA-F]{3,8}" frontend/src/components/geographic-visualization/WorldMapVisualization.tsx`. If other hex sites exist that were missed during initial sweep (unlikely — RESEARCH §2 reports 1 hex hit for this file), swap those too with the same recipe.

    DO NOT:
    - Add new component imports beyond what the chosen recipe requires.
    - Refactor the component's prop interface.
    - Modify adjacent JSX, comments, or formatting.
    - Re-flow the `<WorldMap ... />` JSX block — keep the existing line shape, just change line 193's value.

    Verify visual parity per UI-SPEC §Visual Fidelity Guarantee items 1, 2, 3 (Bureau-light 1280px, RTL Tajawal, dark mode passthrough). Capture pre/post screenshots — they live in `.planning/phases/51-design-token-compliance-gate/visual-parity/` or as base64 in 51-02-SUMMARY.md.

  </action>
  <verify>
    <automated>grep -cE "#[0-9a-fA-F]{3,8}" frontend/src/components/geographic-visualization/WorldMapVisualization.tsx | grep -qx 0 &amp;&amp; pnpm exec eslint -c eslint.config.mjs frontend/src/components/geographic-visualization/WorldMapVisualization.tsx 2>&amp;1 | grep -cE "(Raw hex|no-restricted-syntax)" | grep -qx 0</automated>
  </verify>
  <done>
    `grep -cE "#[0-9a-fA-F]{3,8}" frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` returns 0 (zero raw hex literals remain in the file).
    `pnpm exec eslint -c eslint.config.mjs frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` exits 0 with zero `no-restricted-syntax` warnings.
    The commit message names the chosen recipe (A / B / C) and includes the rationale.
    The 51-02-SUMMARY.md visual-parity section records pre/post screenshots or notes that visual parity was verified on a dev page (the SVG renders correctly in Bureau-light + RTL + dark mode).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: PositionEditor.tsx Tier-A swap (19 palette literals)</name>
  <files>frontend/src/components/position-editor/PositionEditor.tsx</files>
  <read_first>
    - frontend/src/components/position-editor/PositionEditor.tsx (full file — ~550 lines)
    - frontend/src/index.css §`@theme` block lines 43-118 (token utility names)
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §5 "Specific anchor recipes — 2) PositionEditor.tsx:211/237 through 5) PositionEditor.tsx:531"
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"frontend/src/components/position-editor/PositionEditor.tsx" pattern assignment — the verbatim token-mapping table with line numbers + the mechanical diff shape
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Token-replacement contract — Tailwind palette literal → token-mapped utility" + §"Visual Fidelity Guarantee" applied to PositionEditor
  </read_first>
  <action>
    Mechanical sweep of all 19 palette-literal sites per the verbatim token-mapping table in 51-PATTERNS.md. Required swaps:

    NAMED ANCHOR SITES (5 sites from CONTEXT D-02):
    - Line 211: `class: 'text-blue-600 underline'` → `class: 'text-accent underline'` (tiptap Link.configure for editorEn).
    - Line 237: `class: 'text-blue-600 underline'` → `class: 'text-accent underline'` (tiptap Link.configure for editorAr).
    - Line 410: `<Card className="border-red-200 bg-red-50">` → `<Card className="border-danger/30 bg-danger/10">`.
    - Line 412: `<div className="flex items-center gap-2 text-red-800">` → `<div className="flex items-center gap-2 text-danger">`.
    - Line 531: `<AlertCircle className="size-5 text-red-600" />` → `<AlertCircle className="size-5 text-danger" />`.

    ADDITIONAL MECHANICAL SITES (lines 441, 442, 449, 486, 487, 495 — verify via grep before edit):
    Run `pnpm exec eslint -c eslint.config.mjs frontend/src/components/position-editor/PositionEditor.tsx 2>&amp;1 | grep -E "^\s*[0-9]+:[0-9]+" | head -30` to enumerate every D-05 warning line:col. For each surfaced site, apply the cookbook:
    - `border-gray-300` / `border-slate-300` / `border-zinc-300` → `border-input` (resolves to `--input: var(--line)` at index.css:87).
    - `bg-gray-100` / `bg-slate-100` (disabled state) → `bg-muted` (resolves to `--muted: var(--surface)` at index.css:95).
    - `focus:ring-blue-500` → `focus:ring-accent` (resolves to `--ring: var(--accent)` at index.css:98). Variant prefix preserved.
    - Any other palette site not in the above mapping → consult 51-UI-SPEC.md §"Token-replacement contract" full table; if no clean mapping exists for a specific literal, STOP and escalate (don't invent new tokens, per Karpathy §3).

    Surgical-change boundary (Karpathy §3 + Phase 48-02 precedent):
    - ONLY change className strings at the cited lines.
    - Do NOT reflow surrounding JSX, rename props, or refactor the tiptap config shape.
    - Do NOT remove or add trailing commas — match existing style.
    - Do NOT add new imports, hooks, or components.
    - Preserve existing logical-property usage (CLAUDE.md §"Arabic RTL Support Guidelines"). DO NOT reintroduce `ml-*`/`pl-*`/`text-left` while swapping colors.

    Visual parity verification (UI-SPEC §Visual Fidelity Guarantee applied to PositionEditor):
    - Render the editor with a sample document in both EN and AR locales.
    - Screenshot link state pre/post swap — expected: link hue shifts from blue 217° to Bureau accent terracotta 32° (intentional MINOR diff).
    - Screenshot error card pre/post swap — expected: pale-red border + tint stays visually equivalent (`oklch(52% 0.18 25)` at 30%/10% alpha ≈ red-200/red-50).
    - Confirm RTL Arabic editor still renders Tajawal cascade.
    - Dark mode: render with `<html data-theme="dark">` (or whatever DesignProvider toggles); verify link + error card re-paint via dark-side token values automatically.

  </action>
  <verify>
    <automated>grep -cE "(text|bg|border|ring)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-[0-9]{2,3}" frontend/src/components/position-editor/PositionEditor.tsx | grep -qx 0 &amp;&amp; pnpm exec eslint -c eslint.config.mjs frontend/src/components/position-editor/PositionEditor.tsx 2>&amp;1 | grep -cE "no-restricted-syntax" | grep -qx 0</automated>
  </verify>
  <done>
    `grep -cE "(text|bg|border|ring)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-[0-9]{2,3}" frontend/src/components/position-editor/PositionEditor.tsx` returns 0 (zero banned palette literals remain — variant prefixes covered).
    `pnpm exec eslint -c eslint.config.mjs frontend/src/components/position-editor/PositionEditor.tsx` exits 0 with zero `no-restricted-syntax` warnings.
    `git diff frontend/src/components/position-editor/PositionEditor.tsx` shows ONLY className changes (no whitespace-only edits, no import reordering, no JSX-structure changes). Verify with `git diff --stat frontend/src/components/position-editor/PositionEditor.tsx` — line delta should be small (one line changed per swap site, ~11-19 net changed lines).
    The 51-02-SUMMARY.md records the post-swap warning count (0 for this file) and the visual-parity verification status.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Verify zero design-token violations on both anchor files</name>
  <files>(none — verification-only)</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-VALIDATION.md §"Per-Task Verification Map"
  </read_first>
  <action>
    Run aggregate verification across the two anchors:

    1) `pnpm exec eslint -c eslint.config.mjs frontend/src/components/geographic-visualization/WorldMapVisualization.tsx frontend/src/components/position-editor/PositionEditor.tsx 2>&amp;1` — both files must report 0 D-05 warnings (severity is still `warn` per Plan 51-01; this confirms swaps were complete).

    2) `pnpm lint` workspace-wide — must continue exiting 0. The total warning count should drop by ~20 (1 hex + 19 palette literals) compared to the count captured at end of Plan 51-01.

    3) `pnpm --filter intake-frontend typecheck` (or whatever the project's typecheck command is — verify workspace name from `package.json` workspaces field) — must exit 0. No TS regressions introduced by the swap.

    4) If a Vitest spec exists for either component (`pnpm --filter intake-frontend test --run -- position-editor` or `pnpm --filter intake-frontend test --run -- geographic-visualization`), it must pass. If no spec exists for `WorldMapVisualization`, the task is complete without it (visual-parity verification on dev page is the substitute per VALIDATION.md §Manual-Only Verifications).

    Capture all four outputs in 51-02-SUMMARY.md.

    DO NOT commit anything in this task — verification only. If any of the four checks fails, return to Task 1 or Task 2 and address the failure.

  </action>
  <verify>
    <automated>pnpm exec eslint -c eslint.config.mjs frontend/src/components/geographic-visualization/WorldMapVisualization.tsx frontend/src/components/position-editor/PositionEditor.tsx 2>&amp;1 | grep -cE "no-restricted-syntax" | grep -qx 0 &amp;&amp; pnpm lint 2>&amp;1 | grep -qiE "(no problems|passed|^$)" || pnpm lint 2>&amp;1 | tail -3 | grep -q "0 errors"</automated>
  </verify>
  <done>
    `pnpm exec eslint -c eslint.config.mjs <both-anchor-files>` exits 0 with zero D-05 warnings.
    `pnpm lint` exits 0 workspace-wide; the warning count delta matches the expected ~20 reduction.
    `pnpm typecheck` (workspace-wide via Turbo) exits 0.
    If a component test exists, it passes; if not, dev-page visual-parity verification is recorded in 51-02-SUMMARY.md.
  </done>
</task>

</tasks>

<verification>
After all three tasks complete:

- `WorldMapVisualization.tsx` and `PositionEditor.tsx` each pass `pnpm exec eslint -c eslint.config.mjs <file>` with zero D-05 warnings.
- The ROADMAP success criterion 3 named anchors are CLEARED. Surfaced sweep violations remain (Plan 51-03 covers those) — this plan only addresses the two named files.
- `pnpm lint` continues to exit 0 (still at `warn` severity per Plan 51-01).
- No TS regressions; `pnpm typecheck` exits 0.
- Visual parity verified on Bureau-light + RTL Tajawal + dark mode per UI-SPEC §Visual Fidelity Guarantee.
- Karpathy §3 surgical-change posture maintained: `git diff` shows ONLY className/lineColor changes; no adjacent code touched.
  </verification>

<success_criteria>

- DESIGN-03 ROADMAP named anchors (`WorldMapVisualization.tsx:193` raw hex + `PositionEditor.tsx` color literals) are FIXED — the verbatim line-3 of the ROADMAP success criterion is satisfied.
- Token-mapping cookbook in 51-UI-SPEC.md is proven applicable: 19 mechanical swaps land without inventing new tokens (D-11 stays canonical).
- WorldMap recipe choice (A/B/C) is documented for downstream (Plan 51-03 may use the same recipe for additional SVG-prop sites if surfaced).
- Plan 51-03 can proceed in parallel (different file scope).
  </success_criteria>

<output>
After completion, create `.planning/phases/51-design-token-compliance-gate/51-02-SUMMARY.md` capturing:
- Final commit SHAs.
- WorldMap recipe chosen (A / B / C) and rationale.
- PositionEditor swap inventory (19 sites → mapped utilities).
- Pre/post `pnpm lint` workspace warning count delta.
- Visual-parity verification status (Bureau-light + RTL Tajawal + dark mode).
- `pnpm typecheck` exit code.
- Per-file eslint zero-warning evidence (output of `pnpm exec eslint -c eslint.config.mjs <files>`).
</output>
