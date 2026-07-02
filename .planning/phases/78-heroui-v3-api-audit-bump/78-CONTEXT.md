# Phase 78: HeroUI v3 API Audit & Bump - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Auto-generated (smart discuss — light/infrastructure phase, decisions prescribed)

<domain>
## Phase Boundary

HeroUI is bumped 3.0.5 → 3.2.1 with **no visual/behavioral regression**. This is a **light phase**: the Phase 75 audit confirmed the tree is already on the v3 compound-component API and no v2 package exists, so it is a version bump + regression sweep, NOT an API migration. Covers HEROUI-01 (the coupled bump) and HEROUI-02 (convert any residual flat-prop straggler — Phase 75 found none). Depends on Phase 77 (Linear tokens now stable on the current HeroUI baseline, so any visual break is attributable to v3, not tokens). Does not touch Aceternity (Phase 79) or the final full-route verification (Phase 80).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

Light dependency-bump phase with all decisions prescribed by REQUIREMENTS + the Phase 75 audit:

- **HEROUI-01:** bump `@heroui/react` AND `@heroui/styles` 3.0.5 → 3.2.1 **in lockstep** (they are version-coupled); no v2 package anywhere (there is none today). Verify the lockfile resolves both to 3.2.1.
- **HEROUI-02:** re-run the Phase 75 "Phase 78 re-run protocol" commands and expect the SAME output (8 import sites, type-check exit 0, 0 flat-prop stragglers, 0 removed-name imports). Convert any straggler only if one surfaces — expected: none. Do NOT re-open a v2→v3 migration narrative.
- **Regression sweep:** all routes using HeroUI components render without regression in EN and AR after the bump. Reuse existing Playwright/visual harness where it helps; the formal full-route re-compare is Phase 80's job.
- **Two documented nuances (avoid false positives in the sweep):** flat-named `Drawer` exports ARE v3 (Nuance 1); `Autocomplete` still exists as a 3.0.5 export (AUDIT-03 nuance) — do not flag these.

Changelog review between 3.0.5 and 3.2.1, exact regression-sweep tooling, and rollback handling are the planner's/executor's discretion.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Phase 75 confirmation artifact: `.planning/phases/75-ui-component-migration-audit/75-AUDIT-heroui-confirmation.md` — contains the exact re-run commands + expected outputs (evidence-paired) that Phase 78 re-executes.
- `@heroui/react` 3.0.5 + `@heroui-pro/react` 1.0.0-beta.6 installed (see [[project_heroui_pro_installed_delivery_model]]). HeroUI Pro delivery is `pnpm dlx heroui-pro` (never npx); CI-safe unauth exit-0 verified.

### Established Patterns

- 8 HeroUI import sites, all on the v3 compound-component API (Card.Header, Sheet.Trigger, etc.); verified in Card/Checkbox/Switch/Modal wrappers.
- Requires Tailwind CSS v4, no Provider (v3 characteristics already satisfied).
- `components/ui/heroui-*.tsx` wrappers exist for API compatibility — re-skinned via Linear tokens in Phase 77.

### Integration Points

- Bundle Size Check is a REQUIRED CI gate (`frontend/.size-limit.json`) — a HeroUI bump can move bundle size; verify size-limit stays green (see [[project_bundle_size_required_check_budgets]]).
- Phase 77's three-copy token byte-match (directions.ts / bootstrap.js / index.css) is unaffected by a HeroUI bump but keep the parity guard green.

</code_context>

<specifics>
## Specific Ideas

- Bump both packages together; a mismatched `@heroui/react` vs `@heroui/styles` is the primary failure mode.
- Re-run the Phase 75 protocol verbatim and diff against its recorded output — a delta is the only thing worth acting on.
- Watch the REQUIRED Bundle Size Check after the bump.

</specifics>

<deferred>
## Deferred Ideas

None — light bump-and-sweep phase, fully prescribed by HEROUI-01/02 + the Phase 75 audit.

</deferred>
