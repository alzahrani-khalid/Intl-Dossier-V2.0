# Phase 76: RTL Infrastructure Bridge & shadcn Logical Properties - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning
**Mode:** Auto-generated (smart discuss — infrastructure path)

<domain>
## Phase Boundary

One direction authority drives both the document and Radix, every portal opens from the correct edge in both languages, and the shadcn logical-property migration is applied exactly once with a guard against re-introduction. Covers RTLB-01 (single direction owner), RTLB-02 (portal edge correctness), SRTL-01 (one-shot `migrate rtl`), SRTL-02 (manual verification of CLI-exempt components), SRTL-03 (CI guard against duplicate `rtl:*` utilities). No token work (Phase 77), no HeroUI bump (Phase 78), no Aceternity rebuilds (Phase 79).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — infrastructure phase whose design is already prescribed by the re-scoped REQUIREMENTS and ROADMAP success criteria:

- Direction owner is derived from `i18n.language`/`useDirection()` and consolidates today's 4 scattered setters (LanguageProvider, `i18n/index.ts` side-effects, RTLWrapper, DesignProvider), bridged into both `<html>` and Radix's direction context — no dual-mechanism double-flip.
- The 68 per-field `dir="rtl"` inputs on Arabic-only (`_ar`) fields are explicitly retained — they are correct, not violations (do not "fix" them).
- Language toggle must flip `document.dir` AND every mounted Radix portal in the same frame; portals (Popover/Tooltip/Dropdown/Sheet/dossier drawer) animate from the inline-start edge in both languages.
- `pnpm dlx shadcn@latest migrate rtl` runs ONCE against `components/ui/**`, committed as a single reviewable diff; output is best-effort on the repo's `new-york` style — review, don't trust; never blindly re-run (upstream idempotency bug re-introduces duplicate `rtl:*` classes).
- Calendar, Pagination, Sidebar are CLI-exempt → manual RTL verification in Arabic.
- CI check fails the build on any `className` containing a duplicated `rtl:*` utility.

Verification tooling, file organization for the direction hook, and CI-check implementation are planner's choice. Phase 75 audit artifacts (`75-AUDIT-classification.md`) define the touched surface.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Phase 75 audit artifacts in `.planning/phases/75-ui-component-migration-audit/` (classification of all 95 ui/+forms/ files, per-directory tiers, hand-off summaries for Phase 76).
- Codebase maps at `.planning/codebase/`; milestone research at `.planning/research/` (PITFALLS.md covers the shadcn migrate-rtl idempotency bug).

### Established Patterns

- App code is already logical-properties-only (ESLint-enforced) — `components/ui/**` is the only ESLint-exempt surface, so migrate-rtl yield is limited there by design.
- i18n direction currently set from multiple places (the 4 setters above); language persists under localStorage `id.locale` (not `i18nextLng`); switch via topbar ع control.
- FOUC bootstrap `frontend/public/bootstrap.js` also paints direction-related state — keep its byte-match invariant with `tokens/directions.ts` untouched this phase (token changes are Phase 77's moving variable).

### Integration Points

- Radix direction context (DirectionProvider) is the bridge target alongside `<html dir>`.
- Playwright E2E and axe-core CI exist for smoke coverage; VERIFY-01 baselines are re-captured in Phase 77's pre-swap gate, not here.

</code_context>

<specifics>
## Specific Ideas

- Same-frame flip is the acceptance bar for the direction owner (no staggered document-vs-portal updates).
- The migrate-rtl commit must be isolated (single diff) so it can be audited and never re-applied.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (infrastructure path).

</deferred>
