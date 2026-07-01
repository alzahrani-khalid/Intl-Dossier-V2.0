# Requirements: Intl-Dossier v8.0 Linear Design System Migration

**Defined:** 2026-07-01
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## v8.0 Requirements

Replace the IntelDossier prototype design system with a Linear-derived design language, on properly-configured shadcn/ui RTL infrastructure and HeroUI v3 (already installed at 3.0.5), with Aceternity fully removed — while preserving Arabic RTL correctness throughout. Verified against the live codebase: HeroUI v3.0.5 is already installed (this is an API-conformance audit + minor bump to 3.2.1, not a v2→v3 migration); shadcn's Jan-2026 RTL tooling is production-ready but not idempotent; the app's FOUC bootstrap/token byte-match invariant (from v6.0) is load-bearing throughout.

### UI Component Audit

- [ ] **AUDIT-01**: Every hand-rolled UI surface in `frontend/src/components/**` is classified as replace-with-shadcn-primitive, keep-custom (domain-specific), or replace-with-shadcn-block
- [ ] **AUDIT-02**: HeroUI components still using pre-3.x flat-prop patterns (vs. compound API) are inventoried
- [ ] **AUDIT-03**: Usage of HeroUI v3-removed components (Navbar, Snippet, User, Spacer, Image, Code, Autocomplete, DateInput) is inventoried with a replacement plan per hit
- [ ] **AUDIT-04**: The 8 Aceternity-based components are inventoried with their RHF/Zod/ARIA behavioral contracts captured before rebuild

### RTL Infrastructure Bridge

- [ ] **RTLB-01**: `dir` has exactly one owner (derived from `i18n.language`/`useDirection()`), bridged into both `<html>` and Radix's direction context — no dual-mechanism double-flip
- [ ] **RTLB-02**: Portal-based components (Popover/Tooltip/Dropdown/Sheet/dossier drawer) animate from the correct edge in both EN and AR

### shadcn RTL Logical Properties

- [ ] **SRTL-01**: `pnpm dlx shadcn@latest migrate rtl` runs once against `components/ui/**`, is committed, and is never blindly re-run (upstream idempotency bug)
- [ ] **SRTL-02**: Calendar, Pagination, and Sidebar (CLI-exempt components) are manually verified RTL-correct
- [ ] **SRTL-03**: A CI check prevents duplicate `rtl:*` utility classes from re-appearing

### Linear Token System

- [ ] **TOKEN-01**: Dark (canonical) and light token sets are derived from the Linear DESIGN.md spec and wired into `directions.ts`/`buildTokens.ts`/`applyTokens.ts`
- [ ] **TOKEN-02**: `bootstrap.js` byte-matches the new `directions.ts` literals, enforced by a CI guard (not just type-check)
- [ ] **TOKEN-03**: Form-error/warning colors and a 6-value status-tag palette are derived (gap-filled) in Linear's dark-surface luminance band
- [ ] **TOKEN-04**: The 4-direction switcher (Bureau/Chancery/Situation/Ministerial) is retired; Linear is the sole visual direction
- [ ] **TOKEN-05**: Inter (500/600/700) and JetBrains Mono replace the proprietary Linear Display/Text/Mono fonts
- [ ] **TOKEN-06**: `components/ui/*` primitives are re-skinned per Linear's button/card/input recipes (no drop shadows, hairline borders, `surface-1..4` ladder)

### HeroUI v3 API Audit + Bump

- [ ] **HEROUI-01**: `@heroui/react`/`@heroui/styles` bump from 3.0.5 → 3.2.1
- [ ] **HEROUI-02**: Components still using old flat-prop API are converted to compound-component pattern

### Aceternity Removal

- [ ] **ACET-01**: The 8 Aceternity-based form components are rebuilt on HeroUI v3/Radix primitives, preserving existing RHF validation, ARIA, and keyboard-focus behavior
- [ ] **ACET-02**: The `@aceternity-pro` registry entry is removed from `components.json`

### Full-Route Visual + A11y Verification

- [ ] **VERIFY-01**: All routes are visually baselined (EN+AR × dark+light) before the token phase begins, and re-compared after
- [ ] **VERIFY-02**: axe-core accessibility sweep passes across all 4 axes with no new violations

### Bootstrap CI Guard + Smoke Suite

- [ ] **FOUC-01**: A CI script fails the build if `bootstrap.js` and `directions.ts` literals diverge
- [ ] **FOUC-02**: Portal-animation and Calendar/Pagination/Sidebar RTL smoke tests run in CI

## Future Requirements

Deferred — not in this milestone.

### Design Ops

- **DESIGNOPS-01**: Figma/design-token sync tooling
- **DESIGNOPS-02**: Storybook-based component-level visual diffing (v6.1 deferral ADR still stands)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                    | Reason                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Reintroducing a multi-direction switcher   | Full replacement decision — Linear is the only direction going forward                          |
| Net-new HeroUI v2 dependency               | Already on v3.0.5; no reason to add v2 coexistence tooling                                      |
| Feed ingestion, GPU/TEI stack, GAP-2/GAP-3 | Carried forward from v7.0, unrelated to design system work — see PROJECT.md Next Milestone note |
| Mobile native app                          | Standing exclusion (cancelled)                                                                  |

## Traceability

Filled by roadmapper.

| Requirement | Phase | Status |
| ----------- | ----- | ------ |
