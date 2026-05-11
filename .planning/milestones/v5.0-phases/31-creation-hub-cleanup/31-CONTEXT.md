# Phase 31: Creation Hub and Cleanup - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Unify the 8 existing per-type wizards (`/dossiers/{type_plural}/create`) under a single `/dossiers/create` hub entry point, add per-step contextual guidance inside each wizard, remove the legacy monolithic `DossierCreateWizard` flow, and repoint every existing call site (FAB, empty states, list CTAs, Command Palette, MeetingSchedule) to the new destinations.

Requirements covered: **UX-01** (hub), **UX-02** (step guidance), **UX-03** (legacy removal), **UX-04** (reference updates).

</domain>

<decisions>
## Implementation Decisions

### Hub page design

- **D-01:** Build a new `CreateDossierHub` component — do NOT just reuse `DossierTypeSelector`. Rich card grid layout, 2 cols (mobile) → 3 cols (md) → 4 cols (lg). Mobile-first with RTL logical properties.
- **D-02:** Show all 8 dossier types with equal prominence, no grouping, no collapsing. Order: country, organization, forum, engagement, topic, working_group, person, elected_official (match `DOSSIER_TYPES` enum order).
- **D-03:** Each card shows icon + bilingual type name + one-sentence description. Pull name + description from existing `DOSSIER_TYPES` metadata / i18n; don't re-author.
- **D-04:** No search / filter. 8 cards fit on one mobile screen.
- **D-05:** Hub URL is stateless — no `?type=X` preselect query. Context-direct links bypass the hub entirely.

### Context-aware routing (UX-04)

- **D-06:** Routing rule: **context-direct when the type is known, hub fallback otherwise**. Per-type list pages and empty states go direct to `/dossiers/{type_plural}/create`; ambiguous or typeless call sites route to `/dossiers/create`.
- **D-07:** **Context-direct** call sites: `DossierListPage` (when filtered by type), `EngagementsListPage`, `ElectedOfficialListTable`, `ProgressiveEmptyState` and `TourableEmptyState` on typed list pages.
- **D-08:** **Hub fallback** call sites: global FAB on dashboard / tasks / notifications / non-typed routes (`useContextAwareFAB` default branch), `MeetingSchedule` "create engagement" CTA, Command Palette generic "Create dossier" entry.
- **D-09:** Extend `useContextAwareFAB` with a list-route → per-type-wizard lookup so typed list pages route direct while the dashboard branch keeps the hub.

### Step guidance (UX-02)

- **D-10:** Render guidance as a dismissible **top-of-step HeroUI Alert banner** at the top of every wizard step. No field-level tooltips, no accordions, no side panels.
- **D-11:** Content depth = **step intent only**. One sentence per step describing what the step captures (e.g. "Tell us about the country — flags, codes, region"). No field-level tips or examples in this phase.
- **D-12:** Banner is **dismissible per-session**. State held in `localStorage` keyed by `wizard:{type}:{stepId}:guidance:dismissed`. Re-appears next session.
- **D-13:** Guidance copy lives in the **existing per-type i18n namespaces** (country/organization/forum/engagement/topic/working-group/person/elected-official). Key shape: `wizard.steps.{stepId}.guidance`. No new namespace.
- **D-14:** Guidance is added for every step in every type's wizard config — not just step 1. Review steps get a guidance line too.

### Cleanup boundary (UX-03)

- **D-15:** Files deleted: `frontend/src/components/dossier/DossierCreateWizard.tsx`, `frontend/src/pages/dossiers/DossierCreatePage.tsx`, `frontend/src/components/dossier/wizard-steps/Shared.ts`, `frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx`, `frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx`, and their tests.
- **D-16:** `frontend/src/routes/_protected/dossiers/create.tsx` is **replaced** (not deleted) — the route stays at `/dossiers/create` but its component becomes `CreateDossierHub`.
- **D-17:** **Leave `DossierTypeSelector` alone** for now. It's not used by the new hub (we build a fresh card grid), but we don't delete it in this phase — verify no other call sites via grep and record a follow-up if confirmed orphaned. Don't widen cleanup scope on speculation.
- **D-18:** i18n cleanup: audit each old-wizard-specific key in EN + AR locale files. If grep shows zero other consumers, delete. Keys referenced elsewhere stay.
- **D-19:** Playwright specs exercising the old `/dossiers/create` flow are deleted; any shared test utilities get repointed to per-type wizards or the new hub E2E.

### Plan ordering

- **D-20:** Phase 31 ships as **4 plans in sequence**:
  1. `31-01` — `CreateDossierHub` component + route swap at `/dossiers/create`
  2. `31-02` — Step guidance banner component + guidance copy across all 8 wizards' i18n namespaces
  3. `31-03` — UX-04 reference updates (FAB routing lookup, list-page CTAs, empty-state targets, MeetingSchedule, Command Palette)
  4. `31-04` — Cleanup: delete legacy files, i18n audit-and-remove, delete stale Playwright specs, verify `DossierTypeSelector` orphan status
- **D-21:** Cleanup lands LAST — after every reference migration is in place. Avoids shipping a commit where `/dossiers/create` is broken.

### Claude's Discretion

- Exact visual treatment of the hub cards (elevation, hover state, icon sizing) — follow HeroUI v3 `Card` conventions; match existing dossier list card styling for consistency.
- Whether the step banner shows an icon (info, lightbulb, etc.) — pick one that reads well in both LTR and RTL; no directional icons.
- Test split between Vitest (hub component, FAB routing lookup) and Playwright (end-to-end hub → wizard → dossier creation).
- Whether to migrate `useContextAwareFAB`'s lookup to a typed map or keep a switch — pick whichever matches existing hook patterns.

### Folded Todos

(none — no backlog todos matched Phase 31 scope in this session)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap

- `.planning/ROADMAP.md` §"Phase 31: Creation Hub and Cleanup" — Goal, depends-on (Phase 29, Phase 30), requirements mapping (UX-01..04), success criteria.
- `.planning/REQUIREMENTS.md` §"UX Requirements" — Full UX-01..04 text.

### Prior-phase context (decisions that carry forward)

- `.planning/phases/26-shared-wizard-infrastructure/26-CONTEXT.md` — Wizard infrastructure contracts (`useCreateDossierWizard`, `CreateWizardShell`, per-type configs, Zod schema base).
- `.planning/phases/27-country-wizard/27-CONTEXT.md` — Per-type wizard route pattern (first reference implementation).
- `.planning/phases/28-simple-type-wizards/28-CONTEXT.md` — Person/Topic/Org wizard decisions reused by the hub.
- `.planning/phases/29-complex-type-wizards/29-CONTEXT.md` — Explicitly scopes UX-01/UX-02/UX-03 to Phase 31; documents legacy wizard as the teardown target.
- `.planning/phases/30-elected-official-wizard/30-CONTEXT.md` — Elected Official wizard config conventions.

### Existing code (integration surface)

- `frontend/src/components/dossier/wizard/CreateWizardShell.tsx` — Shell the hub routes into; no changes in Phase 31.
- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — Shared wizard hook; no changes.
- `frontend/src/components/dossier/wizard/config/*.config.ts` — Per-type configs; extended in Plan 31-02 to wire guidance keys into each step definition.
- `frontend/src/components/dossier/DossierTypeSelector.tsx` — Existing type picker; NOT used by the new hub but audited for orphan status in Plan 31-04.
- `frontend/src/hooks/useContextAwareFAB.ts` — Extended in Plan 31-03 with the list-route → per-type-wizard lookup.
- `frontend/src/types/dossier.ts` — Source of `DOSSIER_TYPES` metadata used for hub card content.

### Files removed in Plan 31-04

- `frontend/src/components/dossier/DossierCreateWizard.tsx`
- `frontend/src/pages/dossiers/DossierCreatePage.tsx`
- `frontend/src/components/dossier/wizard-steps/Shared.ts`
- `frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx`
- `frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx`

### Design system

- `CLAUDE.md` §"HeroUI v3 Component Strategy" — Component selection hierarchy for hub cards and guidance Alert.
- `CLAUDE.md` §"Arabic RTL Support Guidelines" — Logical properties (`ms-*`, `pe-*`, `text-start`) mandatory on hub grid and banner.
- `CLAUDE.md` §"Mobile-First & Responsive Design" — Breakpoint ladder for the card grid.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`useCreateDossierWizard` hook** (`frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts`) — already drives all 8 per-type wizards; no changes needed.
- **`CreateWizardShell`** (`frontend/src/components/dossier/wizard/CreateWizardShell.tsx`) — hosts the step sequence; guidance banner slots INSIDE each step component, not in the shell.
- **Per-type wizard configs** (`frontend/src/components/dossier/wizard/config/*.config.ts`) — 8 files (country, organization, forum, engagement, topic, working-group, person, elected-official variants). Plan 31-02 adds a `guidanceKey` (or inlined guidance id) per step.
- **`DOSSIER_TYPES` metadata** (`frontend/src/types/dossier.ts`) — already contains name + description per type in EN + AR via i18n; the hub cards consume this directly.
- **HeroUI v3 `Card` + `Alert`** — hub cards use `Card` with hover/focus affordances; step guidance uses `Alert` with a dismiss action.

### Established Patterns

- Per-type wizard routes live at `frontend/src/routes/_protected/dossiers/{type_plural}/create.tsx` — each creates a file-route, composes `useCreateDossierWizard` + `CreateWizardShell` + per-type steps. The hub routes the user INTO one of these; it does NOT re-host the wizard.
- `useContextAwareFAB` is keyed by route prefix (`/dossiers/*`). Plan 31-03 extends this by adding a lookup that maps typed list routes (`/dossiers/countries`, `/dossiers/persons`, …) to their per-type wizard route.
- i18n copy lives in `frontend/src/i18n/{en,ar}/{namespace}.json`. Per-type wizard namespaces already exist; guidance keys extend them.
- `localStorage` is already used by `useCreateDossierWizard` for draft persistence — same approach (prefixed key) for guidance-dismissed state.

### Integration Points

- `frontend/src/routes/_protected/dossiers/create.tsx` — route stays; component swaps from `DossierCreatePage` to `CreateDossierHub`.
- `frontend/src/hooks/useContextAwareFAB.ts` — lines 77 and 299 reference `/dossiers/create`; line 77 becomes the typed-route lookup, line 299 branch stays as hub fallback.
- `frontend/src/pages/dossiers/DossierListPage.tsx` — CTA currently routes to `/dossiers/create`; update to route based on active type filter (hub when filter is "all").
- `frontend/src/pages/engagements/EngagementsListPage.tsx` — direct to `/dossiers/engagements/create`.
- `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` — direct to `/dossiers/elected-officials/create`.
- `frontend/src/components/empty-states/TourableEmptyState.tsx` + `frontend/src/components/progressive-disclosure/ProgressiveEmptyState.tsx` — gain an optional `targetType` prop; when set, route direct; otherwise hub.
- `frontend/src/components/dossier/sections/MeetingSchedule.tsx` — stays pointed at `/dossiers/create` per D-08 (not context-direct in this phase).
- `routeTree.gen.ts` — regenerates automatically once the per-type routes are untouched and the `/dossiers/create` route component swaps.

</code_context>

<specifics>
## Specific Ideas

- Hub grid: 2 cols on mobile (`grid-cols-2`), 3 on `md:`, 4 on `lg:`. Gap: `gap-4` mobile → `gap-6` desktop. Min card touch target respected (≥44×44).
- Step guidance banner: HeroUI v3 `Alert` with `variant="flat"` (subtle) + dismiss button. One sentence, no CTAs inside.
- Per-session dismiss key pattern: `dossier-wizard:guidance:{type}:{stepId}` in `localStorage`.
- i18n guidance key pattern: `{type_namespace}.wizard.steps.{stepId}.guidance`.

</specifics>

<deferred>
## Deferred Ideas

- **Field-level tooltips / examples inside wizard steps** — deferred until usage reveals specific fields users struggle with. Intent-only banner (D-11) is Phase 31 scope.
- **Hub analytics (which type gets picked most)** — Phase 31 is UI only; telemetry is a cross-cutting concern for a future observability phase.
- **`DossierTypeSelector` removal** — if Plan 31-04 verifies no remaining consumers, capture as a separate low-risk cleanup todo rather than widening Phase 31.
- **Hub search / filter** — 8 types don't warrant it; revisit if the dossier-type taxonomy ever grows.
- **Hub URL type-preselect (`?type=X`)** — not adding; reassess if a Command Palette entry per type demands hub-deep-link context.
- **Guidance dismiss "show help again" toggle** — global setting is overkill for per-session dismissal; revisit only if users request it.

</deferred>

---

_Phase: 31-creation-hub-cleanup_
_Context gathered: 2026-04-18_
