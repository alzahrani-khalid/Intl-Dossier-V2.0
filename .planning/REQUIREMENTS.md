# Requirements: Intl-Dossier v8.0 Linear Design System Migration

**Defined:** 2026-07-01
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## v8.0 Requirements

Replace the IntelDossier prototype design system with a Linear-derived design language, on properly-configured shadcn/ui RTL infrastructure and HeroUI v3 (already installed at 3.0.5), with Aceternity fully removed — while preserving Arabic RTL correctness throughout. Verified against the live codebase: HeroUI v3.0.5 is already installed (this is an API-conformance audit + minor bump to 3.2.1, not a v2→v3 migration); shadcn's Jan-2026 RTL tooling is production-ready but not idempotent; the app's FOUC bootstrap/token byte-match invariant (from v6.0) is load-bearing throughout. A 2026-07-02 pre-execution review further verified the tree is **already on the v3 compound-component API**, **none** of the "v3-removed" components are imported, and the Latin fonts are **already** Inter + JetBrains Mono — so AUDIT-02/03 and HEROUI-02 are confirmations, not migrations, and Phase 78 is a version bump + regression sweep. The genuine work is the Linear palette re-skin, the 8-component Aceternity rebuild, and RTL direction-source consolidation.

### UI Component Audit

- [ ] **AUDIT-01**: Every hand-rolled UI surface in `frontend/src/components/**` is classified as replace-with-shadcn-primitive, keep-custom (domain-specific), or replace-with-shadcn-block
- [ ] **AUDIT-02**: HeroUI usage is confirmed already on the v3 compound-component API (spot-verified across Card/Checkbox/Switch/Modal wrappers); any residual pre-3.x flat-prop call site is listed — expected: none
- [ ] **AUDIT-03**: Confirm none of the HeroUI v3-removed components (Navbar, Snippet, User, Spacer, Image, Code, Autocomplete, DateInput) are imported (review verified 0 usages); any regression found gets a replacement plan per hit
- [ ] **AUDIT-04**: The 8 Aceternity-styled form components (a `variant="aceternity"` style + `motion/react`, not a library import) are inventoried with their RHF/Zod/ARIA/keyboard-focus behavioral contracts captured before rebuild

### RTL Infrastructure Bridge

- [ ] **RTLB-01**: layout/portal `dir` has exactly one owner (derived from `i18n.language`/`useDirection()`), consolidating today's 4 scattered setters (LanguageProvider, `i18n/index.ts` side-effects, RTLWrapper, DesignProvider) and bridged into both `<html>` and Radix's direction context — no dual-mechanism double-flip. The 68 per-field `dir="rtl"` inputs on Arabic-only (`_ar`) fields are explicitly retained (they are correct, not violations)
- [ ] **RTLB-02**: Portal-based components (Popover/Tooltip/Dropdown/Sheet/dossier drawer) animate from the correct edge in both EN and AR

### shadcn RTL Logical Properties

- [ ] **SRTL-01**: `pnpm dlx shadcn@latest migrate rtl` runs once against `components/ui/**` (the only ESLint-exempt surface — app code is already logical-only, so yield is limited, and on the repo's `new-york` style the output is best-effort to review, not trusted), is committed, and is never blindly re-run (upstream idempotency bug)
- [ ] **SRTL-02**: Calendar, Pagination, and Sidebar (CLI-exempt components) are manually verified RTL-correct
- [ ] **SRTL-03**: A CI check prevents duplicate `rtl:*` utility classes from re-appearing

### Linear Token System

- [ ] **TOKEN-01**: Dark (canonical) and light token sets are derived from the Linear reference values in `.planning/research/STACK.md` (verbatim from shadcn.io/design/linear) and wired into `directions.ts`/`buildTokens.ts`/`applyTokens.ts` — do NOT anchor to `frontend/DESIGN.md`, which is the outgoing Bureau spec (updated under DOC-01)
- [ ] **TOKEN-02**: `bootstrap.js` byte-matches the new `directions.ts` literals, enforced by a CI guard (not just type-check)
- [ ] **TOKEN-03**: Form-error/warning colors and a 6-value status-tag palette are derived (gap-filled) in Linear's dark-surface luminance band
- [ ] **TOKEN-04**: The 4-direction switcher (Bureau/Chancery/Situation/Ministerial) is retired from all sites — `tokens/types.ts`, `TweaksDrawer`, `Topbar`, and `AppearanceSettingsSection`; Linear is the sole visual direction. Legacy persisted state is migrated: `bootstrap.js` + `DesignProvider` coerce stored `id.dir` values from the four retired directions to `linear` (every existing user has one; the current `P.bureau.light` fallback literal vanishes with the old palette map — without coercion, first paint silently loses ALL tokens), and the default `id.theme` is explicitly decided (Linear is dark-canonical; today's default is `light`)
- [ ] **TOKEN-05**: The Latin stack is Inter (500/600/700) + JetBrains Mono as the Linear analog (Bureau already uses these — verify weights/wiring; no proprietary Linear fonts are added), and the **Tajawal Arabic cascade is preserved** for `dir="rtl"` (Inter has no Arabic coverage)
- [ ] **TOKEN-06**: `components/ui/*` primitives are re-skinned per Linear's button/card/input recipes (no drop shadows, hairline borders, `surface-1..4` ladder); the ~74 pre-existing color literals in the `components/ui` ESLint carve-out (charts/maps/animated primitives) get an explicit keep-as-is vs. migrate decision (they are not caught by the Design Token Check)

### HeroUI v3 API Audit + Bump

- [ ] **HEROUI-01**: `@heroui/react`/`@heroui/styles` bump from 3.0.5 → 3.2.1
- [ ] **HEROUI-02**: Any residual flat-prop HeroUI call site from AUDIT-02 is converted to the compound-component pattern (review verified the tree is already compound-API — expected to close on confirmation, not a mass conversion)

### Aceternity Removal

- [ ] **ACET-01**: The 8 Aceternity-based form components are rebuilt on HeroUI v3/Radix primitives, preserving existing RHF validation, ARIA, and keyboard-focus behavior
- [ ] **ACET-02**: The `@aceternity-pro` registry entry is removed from `components.json`

### Full-Route Visual + A11y Verification

- [ ] **VERIFY-01**: All Playwright-baselined surfaces (the existing ~15–20 route/widget specs, EN+AR × dark+light) are re-captured before the token phase begins and re-compared after; any expansion to additional routes is called out explicitly rather than assumed
- [ ] **VERIFY-02**: axe-core accessibility sweep passes across all 4 axes with no new violations — against a RECORDED pre-migration baseline: the a11y CI job currently fails on `main` (2 hard failures: engagement ARIA + intake landmark/h1, plus 8 flaky specs); these are fixed or explicitly recorded as the baseline before comparison

### Bootstrap CI Guard + Smoke Suite

- [ ] **FOUC-01**: A CI script fails the build if `bootstrap.js` and `directions.ts` literals diverge
- [ ] **FOUC-02**: Portal-animation and Calendar/Pagination/Sidebar RTL smoke tests run in CI

### Documentation & Source-of-Truth

- [ ] **DOC-01**: The design source-of-truth is migrated off Bureau — root `/CLAUDE.md` and `frontend/CLAUDE.md` design-system sections are updated to Linear (Bureau-specific rules retired), `frontend/DESIGN.md` (currently the Bureau spec) is rewritten as the Linear spec, and `frontend/design-system/inteldossier_handoff_design/` is retired or repointed so future work follows Linear, not the old prototype

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

Every v8.0 requirement maps to exactly one phase. Coverage: 24/24.

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| AUDIT-01    | Phase 75 | Pending |
| AUDIT-02    | Phase 75 | Pending |
| AUDIT-03    | Phase 75 | Pending |
| AUDIT-04    | Phase 75 | Pending |
| RTLB-01     | Phase 76 | Pending |
| RTLB-02     | Phase 76 | Pending |
| SRTL-01     | Phase 76 | Pending |
| SRTL-02     | Phase 76 | Pending |
| SRTL-03     | Phase 76 | Pending |
| TOKEN-01    | Phase 77 | Pending |
| TOKEN-02    | Phase 77 | Pending |
| TOKEN-03    | Phase 77 | Pending |
| TOKEN-04    | Phase 77 | Pending |
| TOKEN-05    | Phase 77 | Pending |
| TOKEN-06    | Phase 77 | Pending |
| FOUC-01     | Phase 77 | Pending |
| DOC-01      | Phase 77 | Pending |
| HEROUI-01   | Phase 78 | Pending |
| HEROUI-02   | Phase 78 | Pending |
| ACET-01     | Phase 79 | Pending |
| ACET-02     | Phase 79 | Pending |
| VERIFY-01   | Phase 80 | Pending |
| VERIFY-02   | Phase 80 | Pending |
| FOUC-02     | Phase 80 | Pending |

**Note:** VERIFY-01 spans two moments — the pre-token baseline capture is executed as a gating step of Phase 77 (before any `directions.ts` literal moves), and the post-migration re-comparison completes in Phase 80. The requirement is owned by Phase 80 where it closes.
