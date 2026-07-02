# Phase 75: UI Component & Migration Audit - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning
**Mode:** Auto-generated (smart discuss — infrastructure/audit path)

<domain>
## Phase Boundary

Every UI surface and every library migration target is classified and inventoried, so later phases (76–80) know exactly what to replace, rebuild, or keep-custom — with domain behavior explicitly protected. This phase produces audit documents only: no production code changes, no rebuilds, no token work. Covers AUDIT-01 (classification of `frontend/src/components/**`), AUDIT-02 (HeroUI v3 compound-API confirmation), AUDIT-03 (v3-removed components confirmation), AUDIT-04 (Aceternity behavioral contracts).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — audit/inventory phase whose decision rules are already encoded in the ROADMAP success criteria and REQUIREMENTS:

- Classification taxonomy is fixed: replace-with-shadcn-primitive / keep-custom (domain-specific) / replace-with-shadcn-block.
- Every "replace-with-primitive" row must list the behaviors the primitive must preserve; empty behavior lists are downgraded to keep-custom.
- Components touching clearance, RTL directionality, flags/glyphs, or dossier-type logic default to keep-custom (or shadcn-block-with-domain-wrapper) — never primitive-replace.
- AUDIT-02/03 are confirmations, not hunts: the 2026-07-02 pre-execution review already verified the tree is on the v3 compound-component API and that none of the v3-removed components (Navbar, Snippet, User, Spacer, Image, Code, Autocomplete, DateInput) are imported. The audit records the confirmation evidence (spot-verification across Card/Checkbox/Switch/Modal wrappers) and flags any regression with a replacement plan.
- AUDIT-04 captures RHF/Zod validation wiring, ARIA attributes, and keyboard-focus contracts for each of the 8 Aceternity-styled form components in writing before any rebuild starts (rebuild itself is Phase 79).

Artifact format/location, inventory granularity, and verification tooling are planner's choice.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Codebase maps exist at `.planning/codebase/` (ARCHITECTURE, STRUCTURE, CONVENTIONS, STACK, CONCERNS, INTEGRATIONS, TESTING) — use for component-tree orientation.
- Milestone research at `.planning/research/` (STACK.md holds the Linear reference values; SUMMARY.md the milestone synthesis).
- Knowledge-graph dashboard of `frontend/src` available (see CLAUDE.md) for import/dependency queries.

### Established Patterns

- Token-bound primitives live in `frontend/src/components/ui/`; the design-system port in `frontend/src/design-system/`; FOUC bootstrap at `frontend/public/bootstrap.js` (byte-match invariant with `tokens/directions.ts` is load-bearing).
- "Aceternity" in this repo is a `variant="aceternity"` style + `motion/react` usage on 8 form components — not a library import. `components.json` carries an `@aceternity-pro` registry entry (removal is ACET-02, Phase 79).
- `components/ui` carries an ESLint color-literal carve-out (~74 pre-existing literals in charts/maps/animated primitives) — relevant to classification notes for Phase 77 (TOKEN-06).
- HeroUI `@heroui/react` 3.0.5 installed; HeroUI Pro `@heroui-pro/react` 1.0.0-beta.6 installed (PR #93).

### Integration Points

- Audit outputs feed Phase 76 (RTL bridge surface), Phase 77 (TOKEN-06 re-skin scope), Phase 78 (HEROUI-02 confirmation closure), and Phase 79 (Aceternity rebuild contracts).

</code_context>

<specifics>
## Specific Ideas

- The audit must be evidence-backed (file paths + import checks), not vibes: AUDIT-02/03 record the verification commands/results.
- Keep the milestone's re-scoped framing: Phase 78 is a bump + regression sweep; do not re-open a v2→v3 migration narrative.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (infrastructure path, no interactive discussion needed).

</deferred>
