# Phase 77: Linear Token System - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning
**Mode:** Auto-generated (smart discuss — 1 user decision captured, rest prescribed by REQUIREMENTS)

<domain>
## Phase Boundary

Linear is the sole visual direction — dark (canonical) and light token sets derived from the Linear spec, wired end-to-end (bootstrap → tokens → primitives), with the FOUC byte-match invariant and the pre-swap visual baseline both enforced as gates. Covers TOKEN-01..06, FOUC-01, DOC-01. Depends on Phase 76 (stable RTL infra so token changes are the only moving variable). Does NOT include the HeroUI bump (Phase 78), Aceternity rebuilds (Phase 79), or the final full-route re-comparison (Phase 80 owns the re-compare against this phase's baseline).

</domain>

<decisions>
## Implementation Decisions

### Default theme (USER DECISION — 2026-07-02)

- **Default `id.theme` = dark (Linear-canonical).** New/unset users first-paint dark, faithful to the milestone's stated dark-canonical direction. Existing users' explicitly-persisted `id.theme` is preserved (only the default for new/unset changes). This resolves the TOKEN-04 open decision.

### Token sourcing & wiring (TOKEN-01, TOKEN-02)

- Dark + light token sets sourced from the Linear reference values in `.planning/research/STACK.md` **verbatim** (shadcn.io/design/linear) — NOT `frontend/DESIGN.md` (outgoing Bureau spec, rewritten under DOC-01).
- Wire through `directions.ts` / `buildTokens.ts` / `applyTokens.ts`. Zero raw hex / Tailwind color literals in app code (Design Token Check stays green).
- `bootstrap.js` palette/font literals **byte-match** `directions.ts`; a CI guard (FOUC-01, TOKEN-02) fails the build on divergence (byte-match, not just type-check); the two files change in the same commit.

### Gap-filled palettes (TOKEN-03)

- Derive form-error/warning colors + a 6-value status-tag palette in Linear's dark-surface luminance band; all must pass WCAG AA contrast. Exact values are the planner's/executor's derivation within that band.

### Direction switcher retirement + legacy migration (TOKEN-04)

- Remove the 4-direction switcher (Bureau/Chancery/Situation/Ministerial) from `tokens/types.ts`, `TweaksDrawer`, `Topbar`, `AppearanceSettingsSection`. Linear is the only selectable direction.
- **Coerce legacy persisted `id.dir`** (every existing user holds one of the four retired directions) to `linear` in BOTH `bootstrap.js` and `DesignProvider` — the old `P.bureau.light` fallback literal vanishes with the old palette map, so without coercion first paint silently loses ALL tokens. This is the load-bearing migration (see [[project_v8_preexec_review_durable_facts]] — bootstrap id.dir coercion trap).

### Fonts + primitive re-skin (TOKEN-05, TOKEN-06)

- Latin stack: Inter (500/600/700) + JetBrains Mono, self-hosted, mirrored in `bootstrap.js` (Bureau already uses these — verify weights/wiring; add no proprietary Linear fonts). **Preserve the Tajawal Arabic cascade for `dir="rtl"`** (Inter has no Arabic coverage).
- Re-skin `components/ui/*` per Linear's button/card/input recipes: no drop shadows, hairline borders, `surface-1..4` ladder.
- The ~74 color literals in the `components/ui` ESLint carve-out (charts/maps/animated primitives, not caught by the Design Token Check) get an **explicit keep-as-is vs migrate decision per item** — made against the actual code during execution, recorded in the summary.

### Documentation source-of-truth (DOC-01)

- Update root `/CLAUDE.md` + `frontend/CLAUDE.md` design-system sections off Bureau-canonical; rewrite `frontend/DESIGN.md` as the Linear spec; retire or repoint `frontend/design-system/inteldossier_handoff_design/`. Also fixes the MD-01/LO-02 doc drift carried over from Phase 76 (stale RTLWrapper reference).

### Claude's Discretion

Exact derived color values (within the prescribed Linear band), per-literal keep/migrate calls, CI-guard implementation, and file organization are at the planner/executor's discretion.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Linear reference values live in `.planning/research/STACK.md`.
- Phase 75 audit (`75-AUDIT-classification.md`) already tiered `components/ui/*` and flagged the color-literal carve-out — direct input to TOKEN-06.
- Phase 76 shipped the stable RTL/direction infrastructure (single direction owner, Radix bridge) — token changes are now the only moving variable.

### Established Patterns

- Runtime design-system port: `frontend/src/design-system/` (`DesignProvider.tsx`, `tokens/{directions,densities,buildTokens,applyTokens}.ts`, hooks).
- FOUC bootstrap: `frontend/public/bootstrap.js` — palette/font literals must byte-match `tokens/directions.ts` (load-bearing invariant since v6.0).
- Design Token Check (ESLint) already enforces no-raw-hex in app code; `components/ui` has the ~74-literal carve-out.

### Integration Points

- VERIFY-01 baseline capture GATES the token PR: before any `directions.ts` literal changes, capture Playwright visual baselines (EN+AR × dark+light, ~15–20 specs) — no baseline laundering. The `Visual Regression (Phase 46)` CI job is red on main (issue #31 class), so capture/replay follows the Phase-46 precedent (seeded dev machine + human review) unless repaired first. Re-comparison is Phase 80's job.

</code_context>

<specifics>
## Specific Ideas

- Dark is canonical: derive dark first, then light as the secondary set — both from the Linear reference, both token-complete.
- The bootstrap byte-match guard is a hard CI gate, not advisory — it protects first-paint.
- The `id.dir` legacy-coercion is the single highest-risk change; it must land in bootstrap.js AND DesignProvider together or first paint loses all tokens.

</specifics>

<deferred>
## Deferred Ideas

None — the one genuine product decision (default theme) was captured from the user; the rest is prescribed by TOKEN-01..06 / FOUC-01 / DOC-01.

</deferred>
