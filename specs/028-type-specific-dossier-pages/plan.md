# Implementation Plan: Type-Specific Dossier Detail Pages

**Branch**: `028-type-specific-dossier-pages` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-type-specific-dossier-pages/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement distinct detail page layouts for each of the 6 dossier types (Country, Organization, Person, Engagement, Forum, Working Group) with type-specific data sections and visualizations. Create a unified Dossiers Hub as the central navigation entry point, replacing individual type menu items in the sidebar. Each type-specific layout will display relevant data sections (e.g., geographic context for countries, event timeline for engagements, professional profile for persons) while maintaining consistent navigation structure and supporting mobile-first responsive design with Arabic RTL compatibility.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), React 19
**Primary Dependencies**: TanStack Router v5 (routing), TanStack Query v5 (data fetching), Aceternity UI (primary components), shadcn/ui (fallback), Tailwind CSS (styling), i18next (internationalization), React Flow (network graphs for country/organization views), Framer Motion (animations)
**Storage**: Supabase PostgreSQL 15+ (existing unified dossier schema from feature 026), RLS policies for type-based access control
**Testing**: Vitest (unit/component), Playwright (E2E), axe-playwright (accessibility)
**Target Platform**: Cross-platform - Web (desktop/mobile browsers with responsive breakpoints), priority on mobile-first design (320px-2xl)
**Project Type**: Web application (frontend-focused with existing backend)
**Performance Goals**: < 2s initial page load for detail pages, < 2s Dossiers Hub load with type counts, < 3s network graph rendering (50 nodes for country relationships), 60fps animations for layout transitions
**Constraints**: Must maintain functional parity with existing universal dossier detail page, all type-specific sections must support Arabic RTL, touch targets ≥44x44px, WCAG AA compliance
**Scale/Scope**: 6 distinct page layouts, 1 unified hub page, ~30-40 type-specific React components, estimated 20-25 translation keys per dossier type

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First & Responsive Design ✅ PASS
- **Requirement**: All UI components MUST be built mobile-first with progressive enhancement (base → sm → md → lg → xl → 2xl), touch targets ≥44x44px, min 8px gap between interactive elements
- **Compliance**: Feature explicitly requires mobile-first responsive design (FR-015), all type-specific layouts must work on 320px width (SC-004), sections stack vertically on mobile with expand/collapse controls
- **Validation**: Responsive design audit checklist required before merge, mobile viewport testing at 320px/375px/414px widths

### Principle II: RTL/LTR Internationalization ✅ PASS
- **Requirement**: All components MUST support bidirectional text using logical properties (ms-*, me-*, ps-*, pe-*, text-start, text-end), detect language direction, flip directional icons
- **Compliance**: Feature explicitly requires RTL support (FR-016), all layouts must render correctly in both LTR and RTL (SC-005), no layout breaks in Arabic mode
- **Validation**: Component reviews verify logical properties usage, Arabic rendering tested for all 6 dossier types

### Principle III: Test-First Development ✅ PASS
- **Requirement**: Tests MUST be written FIRST and fail before implementation, Red-Green-Refactor enforced
- **Compliance**: Feature includes comprehensive acceptance scenarios for all 6 user stories, testable via Playwright E2E tests (navigation flows, type-specific section verification)
- **Validation**: E2E tests committed before component implementation, git history check in PR review

### Principle IV: Type Safety & Strict Mode ✅ PASS
- **Requirement**: TypeScript strict mode enabled, explicit types for all variables/functions/props, no `any` except wrapped third-party libraries
- **Compliance**: Technical context specifies TypeScript 5.8+ strict mode, React 19 with typed props, TanStack Router/Query type-safe hooks
- **Validation**: TypeScript compiler zero errors, ESLint flags any `any` usage

### Principle V: Security & Privacy by Default ✅ PASS
- **Requirement**: RLS enabled on all tables, Supabase Auth with JWT validation, no secrets in git, environment variables for config
- **Compliance**: Existing unified dossier schema (feature 026) already has RLS policies, no new tables/backend routes required, frontend fetches via Supabase client with existing auth
- **Validation**: No schema changes = existing RLS policies apply, code review verifies no hardcoded credentials

### Principle VI: Performance & Scalability ✅ PASS
- **Requirement**: Indexed queries, Redis caching, lazy loading, virtualization for large lists, <200ms p95 API latency, optimized images
- **Compliance**: Performance goals specified (< 2s page load, < 3s network graph for 50 nodes), React lazy loading for route-based code splitting, type-specific components only loaded per route
- **Validation**: Performance testing with Playwright (page load metrics), lighthouse audits, network graph rendering benchmarks

### Principle VII: Accessibility (WCAG AA) ✅ PASS
- **Requirement**: WCAG AA compliance, semantic HTML, ARIA labels, 4.5:1 contrast ratio, keyboard accessible, proper form labels
- **Compliance**: Feature requires WCAG AA compliance (constraints in technical context), all interactive elements keyboard accessible, touch targets ≥44x44px
- **Validation**: axe-playwright tests must pass, keyboard navigation verification in E2E tests

### Principle VIII: Cross-Platform Mobile Development ⚠️ PARTIAL
- **Requirement**: Features MUST declare platform scope (web-only, mobile-only, cross-platform), mobile requires offline-first with WatermelonDB if data-heavy
- **Compliance**: Platform scope declared as **web-only** (desktop/mobile browsers, not native mobile app), no offline-first architecture required for browser-based implementation
- **Validation**: Spec clarifies web platform target, responsive design covers mobile browsers, native mobile app (Expo/React Native) out of scope for this feature

### Summary
**Status**: ✅ **GATE PASSED** - All applicable principles compliant, ready for Phase 0 research

**Notes**:
- Principle VIII partial compliance justified: Feature targets web platform (responsive mobile browsers), not native mobile app (Expo/React Native). Native mobile implementation of type-specific dossier pages would be a separate future feature requiring offline-first architecture.
- No complexity violations requiring justification in Complexity Tracking section.

---

## Post-Design Constitution Re-Check

*Performed after Phase 1 design artifacts (data-model.md, contracts/, quickstart.md) completed*

### Principle I: Mobile-First & Responsive Design ✅ PASS
- **Design Compliance**: All component specifications use mobile-first Tailwind breakpoints (base → sm → md → lg → xl)
- **Grid Layouts**: Type-specific grid templates documented with responsive scaling (e.g., Country: `grid-cols-1 lg:grid-cols-[2fr_1fr]`)
- **Touch Targets**: CollapsibleSection component specifies `min-h-11 min-w-11` (44px) touch targets
- **Validation**: Quickstart guide includes mobile-first CSS examples and testing requirements at 320px/375px/414px widths

### Principle II: RTL/LTR Internationalization ✅ PASS
- **Design Compliance**: Component interfaces specify `isRTL` detection via `i18n.language === 'ar'`, logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) documented throughout
- **Network Graphs**: React Flow research includes RTL position mirroring and logical properties for node placement
- **Validation**: Quickstart guide includes RTL code examples and warns against physical directional properties

### Principle III: Test-First Development ✅ PASS
- **Design Compliance**: Quickstart outlines E2E test implementation for hub navigation, country/engagement/person dossier pages
- **Accessibility Tests**: CollapsibleSection component requires axe-playwright tests before merge
- **Validation**: Test files documented in project structure (`hub-navigation.spec.ts`, `country-dossier.spec.ts`, `CollapsibleSection.test.tsx`)

### Principle IV: Type Safety & Strict Mode ✅ PASS
- **Design Compliance**: Type guards defined in data-model.md (`isCountryDossier`, etc.), discriminated union pattern enforced at route loaders
- **Route Safety**: Route contracts specify compile-time type checking with TanStack Router v5 discriminated unions
- **Validation**: TypeScript 5.8+ strict mode specified in technical context, type guard functions prevent type mismatches at runtime

### Principle V: Security & Privacy by Default ✅ PASS
- **Design Compliance**: No new database tables/backend routes = existing RLS policies from feature 026 apply, Supabase client authentication maintained
- **Data Access**: data-model.md confirms existing RLS policies enforce type-based access control
- **Validation**: No security vulnerabilities introduced (frontend-only presentation layer changes)

### Principle VI: Performance & Scalability ✅ PASS
- **Design Compliance**: Performance targets documented (< 2s page load, < 3s network graph for 50 nodes, 60fps animations)
- **React Flow Optimization**: Research specifies memoization (React.memo), virtualization (`onlyRenderVisibleElements`), progressive disclosure
- **Lazy Loading**: Route-based code splitting documented in quickstart (React.lazy() for type-specific components)
- **Validation**: Performance benchmarks defined for Dossiers Hub load, detail page initial paint, network graph rendering

### Principle VII: Accessibility (WCAG AA) ✅ PASS
- **Design Compliance**: CollapsibleSection component specifies W3C ARIA accordion pattern (`role="button"`, `aria-expanded`, `aria-controls`, `aria-labelledby`)
- **Keyboard Navigation**: Component contracts document Tab/Enter/Space keyboard support
- **Screen Readers**: ARIA attributes ensure state announcements and focus management
- **Validation**: axe-playwright tests required in project structure, keyboard navigation verification in E2E tests

### Principle VIII: Cross-Platform Mobile Development ⚠️ PARTIAL (No Change)
- **Design Compliance**: Platform scope remains **web-only** (responsive mobile browsers)
- **Justification**: Native mobile app implementation out of scope for this feature
- **Validation**: No change from initial check - partial compliance justified

### Post-Design Summary
**Status**: ✅ **RE-CHECK PASSED** - All design artifacts comply with constitution principles

**Design Highlights**:
- ✅ Mobile-first grid templates with responsive breakpoints
- ✅ RTL logical properties and `dir` attribute support
- ✅ Type-safe routing with discriminated unions and type guards
- ✅ WCAG AA compliant collapsible sections with ARIA patterns
- ✅ Performance-optimized network graphs (memoization, virtualization)
- ✅ No database/security changes = existing RLS policies apply

**Remaining Work**: Phase 2 (tasks.md generation via `/speckit.tasks` command) → Implementation → Testing → Deployment

## Project Structure

### Documentation (this feature)

```
specs/028-type-specific-dossier-pages/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (COMPLETE)
├── data-model.md        # Phase 1 output (next)
├── quickstart.md        # Phase 1 output (next)
├── contracts/           # Phase 1 output (next)
│   ├── routes.openapi.yaml
│   └── components.json
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (Web Application)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dossier/
│   │   │   ├── CountryDossierDetail.tsx          # NEW: Country-specific layout
│   │   │   ├── OrganizationDossierDetail.tsx     # NEW: Organization layout
│   │   │   ├── PersonDossierDetail.tsx           # NEW: Person layout
│   │   │   ├── EngagementDossierDetail.tsx       # NEW: Engagement layout
│   │   │   ├── ForumDossierDetail.tsx            # NEW: Forum layout
│   │   │   ├── WorkingGroupDossierDetail.tsx     # NEW: Working group layout
│   │   │   ├── DossierDetailLayout.tsx           # NEW: Shared wrapper
│   │   │   ├── DossierSection.tsx                # NEW: Compound components
│   │   │   ├── CollapsibleSection.tsx            # NEW: Accessible accordion
│   │   │   ├── WorldMapHighlight.tsx             # NEW: Country geographic map
│   │   │   └── UniversalDossierDetail.tsx        # EXISTING: Keep for reference
│   │   ├── Layout/
│   │   │   └── ProCollapsibleSidebar.tsx         # MODIFY: Add "Dossiers" menu item
│   │   └── ui/
│   │       ├── bento-grid.tsx                    # EXISTING: Aceternity component
│   │       └── accordion.tsx                     # EXISTING: shadcn component
│   ├── pages/
│   │   └── dossiers/
│   │       ├── DossiersHub.tsx                   # NEW: Central navigation hub
│   │       ├── CountryDossierPage.tsx            # NEW: Country page wrapper
│   │       ├── OrganizationDossierPage.tsx       # NEW: Organization page wrapper
│   │       ├── PersonDossierPage.tsx             # NEW: Person page wrapper
│   │       ├── EngagementDossierPage.tsx         # NEW: Engagement page wrapper
│   │       ├── ForumDossierPage.tsx              # NEW: Forum page wrapper
│   │       └── WorkingGroupDossierPage.tsx       # NEW: Working group page wrapper
│   ├── routes/
│   │   └── _protected/
│   │       └── dossiers/
│   │           ├── index.tsx                     # NEW: Dossiers Hub route
│   │           ├── countries/
│   │           │   ├── index.tsx                 # NEW: Country list
│   │           │   └── $id.tsx                   # NEW: Country detail route
│   │           ├── organizations/
│   │           │   ├── index.tsx                 # NEW: Organization list
│   │           │   └── $id.tsx                   # NEW: Organization detail route
│   │           ├── persons/
│   │           │   ├── index.tsx                 # NEW: Person list
│   │           │   └── $id.tsx                   # NEW: Person detail route
│   │           ├── engagements/
│   │           │   ├── index.tsx                 # NEW: Engagement list
│   │           │   └── $id.tsx                   # NEW: Engagement detail route
│   │           ├── forums/
│   │           │   ├── index.tsx                 # NEW: Forum list
│   │           │   └── $id.tsx                   # NEW: Forum detail route
│   │           └── working-groups/
│   │               ├── index.tsx                 # NEW: Working group list
│   │               └── $id.tsx                   # NEW: Working group detail route
│   ├── hooks/
│   │   ├── useSessionStorage.ts                  # NEW: Session storage hook
│   │   └── useDossier.ts                         # MODIFY: Add type guard support
│   ├── lib/
│   │   └── dossier-type-guards.ts                # NEW: TypeScript type guards
│   └── i18n/
│       ├── en/
│       │   └── dossiers.json                     # MODIFY: Add type-specific keys
│       └── ar/
│           └── dossiers.json                     # MODIFY: Add type-specific keys
└── tests/
    ├── e2e/
    │   └── dossiers/
    │       ├── hub-navigation.spec.ts            # NEW: Hub E2E tests
    │       ├── country-dossier.spec.ts           # NEW: Country detail E2E
    │       ├── engagement-dossier.spec.ts        # NEW: Engagement detail E2E
    │       └── person-dossier.spec.ts            # NEW: Person detail E2E
    └── components/
        └── CollapsibleSection.test.tsx           # NEW: Accessibility tests
```

**Structure Decision**: Web application (frontend-only feature). No backend/database changes required since the unified dossier schema from feature 026 already supports all 6 dossier types. This feature focuses on **presentation layer** improvements: distinct layouts, improved navigation, and enhanced UX for type-specific data visualization.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

