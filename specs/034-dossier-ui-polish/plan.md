# Implementation Plan: Dossier UI Polish - Mobile, RTL & Accessibility

**Branch**: `034-dossier-ui-polish` | **Date**: 2025-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/034-dossier-ui-polish/spec.md`

## Summary

Polish the 6 dossier detail pages (Country, Organization, Person, Engagement, Forum, Working Group) to ensure comprehensive Arabic RTL support, mobile responsiveness at 320px/375px/414px viewports, WCAG AA accessibility compliance, performance optimization with useMemo, and JSDoc documentation. Focus on automated tests for CI/CD integration.

## Technical Context

**Language/Version**: TypeScript 5.0+ (strict mode), React 19+
**Primary Dependencies**: TanStack Router, TanStack Query, Tailwind CSS, i18next, Framer Motion, Aceternity UI
**Storage**: N/A (frontend-only polish, no database changes)
**Testing**: Playwright (E2E, a11y), axe-core (accessibility), Vitest (unit)
**Target Platform**: Modern browsers (Chrome, Safari, Firefox, Edge), mobile viewports (320px+)
**Project Type**: Web application (frontend-only changes)
**Performance Goals**: Initial render <1s, animations at 60fps, section expand <300ms
**Constraints**: 44px minimum touch targets, WCAG AA contrast (4.5:1 normal, 3:1 large)
**Scale/Scope**: 48 dossier components + 17 route files + 4 hooks + 1 type guard file

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                 | Status    | Notes                                                             |
| ------------------------- | --------- | ----------------------------------------------------------------- |
| §1 Bilingual Excellence   | **FOCUS** | This feature directly implements comprehensive RTL/Arabic support |
| §2 Type Safety            | PASS      | TypeScript strict mode maintained; JSDoc documentation added      |
| §3 Security-First         | N/A       | No authentication or data changes                                 |
| §4 Data Sovereignty       | N/A       | Frontend-only, no external data transmission                      |
| §5 Resilient Architecture | PASS      | Error boundaries already in place                                 |
| §6 Accessibility          | **FOCUS** | This feature directly implements WCAG AA compliance               |
| §7 Container-First        | N/A       | No container/deployment changes                                   |

**Gate Result**: PASS - No violations. Feature directly supports Constitution principles §1 and §6.

## Project Structure

### Documentation (this feature)

```text
specs/034-dossier-ui-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output - RTL patterns, a11y best practices
├── data-model.md        # Phase 1 output - Test data specifications
├── quickstart.md        # Phase 1 output - Test execution guide
├── contracts/           # Phase 1 output - Test contracts
│   └── test-scenarios.yaml
├── checklists/
│   └── requirements.md  # Validation checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── Dossier/           # 24 main components + 24 section components
│   │       ├── CollapsibleSection.tsx
│   │       ├── CountryDossierDetail.tsx
│   │       ├── OrganizationDossierDetail.tsx
│   │       ├── PersonDossierDetail.tsx
│   │       ├── EngagementDossierDetail.tsx
│   │       ├── ForumDossierDetail.tsx
│   │       ├── WorkingGroupDossierDetail.tsx
│   │       ├── DossierDetailLayout.tsx
│   │       └── sections/      # 24 section components
│   ├── routes/
│   │   └── _protected/dossiers/  # 17 route files (6 types + hub)
│   ├── hooks/
│   │   ├── useDossier.ts
│   │   ├── useDossiers.ts
│   │   ├── useDossierStats.ts
│   │   └── useDossierPositionLinks.ts
│   └── lib/
│       └── dossier-type-guards.ts
└── tests/
    ├── a11y/
    │   ├── dossiers-a11y.spec.ts           # Existing - expand
    │   ├── dossiers-rtl-a11y.spec.ts       # NEW - RTL + a11y combined
    │   └── dossiers-mobile-a11y.spec.ts    # NEW - Mobile + a11y combined
    ├── e2e/
    │   ├── rtl-switching.spec.ts           # Existing - expand
    │   ├── responsive-breakpoints.spec.ts  # Existing - expand
    │   ├── dossier-rtl-complete.spec.ts    # NEW - Full RTL coverage
    │   └── dossier-mobile-complete.spec.ts # NEW - Full mobile coverage
    └── performance/
        └── dossier-performance.spec.ts     # NEW - Render performance
```

**Structure Decision**: Frontend-only changes in existing web application structure. Tests added to existing test directories. No new directories created, leveraging established patterns.

## Complexity Tracking

> No violations - complexity tracking not required.

## Implementation Phases

### Phase 0: Research (Completed Below)

Research areas:

1. Existing RTL implementation patterns in codebase
2. Current accessibility test coverage gaps
3. Mobile responsiveness testing strategies with Playwright
4. React 19 useMemo best practices
5. JSDoc standards for React components

### Phase 1: Design & Contracts

**Artifacts to produce**:

1. `research.md` - RTL/a11y/mobile best practices consolidated
2. `data-model.md` - Test data specifications for each dossier type
3. `contracts/test-scenarios.yaml` - Comprehensive test scenarios
4. `quickstart.md` - Test execution and validation guide

### Phase 2: Tasks (via /speckit.tasks)

Task categories:

1. **RTL Fixes** - Component-level CSS/JSX fixes for RTL layout
2. **Mobile Fixes** - Touch targets, stacking, responsive spacing
3. **Accessibility Fixes** - ARIA labels, focus management, contrast
4. **Performance** - useMemo optimization in section components
5. **Documentation** - JSDoc comments on exports
6. **Automated Tests** - Playwright specs for CI/CD

## Existing Test Infrastructure

| Test Type     | Tool                  | Existing Files                             | Coverage             |
| ------------- | --------------------- | ------------------------------------------ | -------------------- |
| Accessibility | axe-core + Playwright | `tests/a11y/dossiers-a11y.spec.ts`         | Basic                |
| RTL           | Playwright            | `tests/e2e/rtl-switching.spec.ts`          | Language toggle only |
| Responsive    | Playwright            | `tests/e2e/responsive-breakpoints.spec.ts` | Generic breakpoints  |
| E2E           | Playwright            | Multiple in `tests/e2e/`                   | Feature-specific     |
| Unit          | Vitest                | `tests/unit/`                              | Component-specific   |

**Gap Analysis**:

- RTL tests don't cover all 6 dossier detail pages individually
- Mobile tests don't verify 320px/375px/414px specifically
- Accessibility tests don't include keyboard navigation through dossier sections
- No performance regression tests for dossier pages

## Key Files to Modify

### Priority 1: Detail Page Components (6 files)

| File                            | RTL    | Mobile | A11y   | Performance |
| ------------------------------- | ------ | ------ | ------ | ----------- |
| `CountryDossierDetail.tsx`      | Review | Review | Review | Add useMemo |
| `OrganizationDossierDetail.tsx` | Review | Review | Review | Add useMemo |
| `PersonDossierDetail.tsx`       | Review | Review | Review | Add useMemo |
| `EngagementDossierDetail.tsx`   | Review | Review | Review | Add useMemo |
| `ForumDossierDetail.tsx`        | Review | Review | Review | Add useMemo |
| `WorkingGroupDossierDetail.tsx` | Review | Review | Review | Add useMemo |

### Priority 2: Shared Components (3 files)

| File                          | Changes Needed                                               |
| ----------------------------- | ------------------------------------------------------------ |
| `CollapsibleSection.tsx`      | ARIA expanded/collapsed, keyboard enter/space, focus visible |
| `DossierDetailLayout.tsx`     | RTL sidebar positioning, mobile padding                      |
| `DossierLoadingSkeletons.tsx` | RTL alignment, mobile sizing                                 |

### Priority 3: Section Components (24 files)

All section components in `components/Dossier/sections/` need:

- RTL text alignment audit (use `text-start` not `text-left`)
- RTL icon flipping (directional arrows, chevrons)
- Mobile stacking and spacing
- Touch target sizing for interactive elements
- ARIA labels for non-text elements
- useMemo for expensive calculations

### Priority 4: Hooks & Type Guards (5 files)

| File                         | Documentation Needed                   |
| ---------------------------- | -------------------------------------- |
| `useDossier.ts`              | JSDoc on hook, parameters, return type |
| `useDossiers.ts`             | JSDoc on hook, parameters, return type |
| `useDossierStats.ts`         | JSDoc on hook, parameters, return type |
| `useDossierPositionLinks.ts` | JSDoc on hook, parameters, return type |
| `dossier-type-guards.ts`     | JSDoc on all type guard functions      |

## Test Strategy

### Automated Test Coverage

```yaml
# Tests to create/expand
rtl_tests:
  - All 6 dossier detail pages render correctly in RTL
  - Sidebar appears on right in RTL
  - Breadcrumbs read right-to-left
  - Icons flip appropriately
  - Modal/drawer animations respect direction
  - Mixed Arabic/English text renders correctly

mobile_tests:
  - All 6 pages at 320px viewport (iPhone SE)
  - All 6 pages at 375px viewport (iPhone 12)
  - All 6 pages at 414px viewport (iPhone 14 Pro Max)
  - No horizontal overflow at any viewport
  - Touch targets ≥44x44px
  - Content stacks correctly

a11y_tests:
  - axe-core scan with zero critical/serious violations
  - Full keyboard navigation through all sections
  - Screen reader announcements for dynamic content
  - Focus visible indicators meet contrast
  - Collapsible sections announce state changes

performance_tests:
  - Initial render <1s
  - Section expand/collapse <300ms
  - No jank during scroll (60fps)
```

### Manual Verification Points

1. Arabic language switch feels natural and complete
2. Mobile usage is comfortable and not frustrating
3. Screen reader experience is logical and informative
4. No visual regressions in either language

## Success Metrics

| Metric              | Target               | Measurement                                         |
| ------------------- | -------------------- | --------------------------------------------------- |
| RTL Layout          | 0 breaks             | Visual inspection + automated screenshot comparison |
| Mobile Overflow     | 0 horizontal scrolls | Playwright viewport tests                           |
| Touch Targets       | 100% ≥44px           | Automated size measurement                          |
| A11y Violations     | 0 critical/serious   | axe-core automated scan                             |
| Contrast Ratio      | WCAG AA              | axe-core contrast checks                            |
| Keyboard Navigation | 100% reachable       | Manual + automated tab-through                      |
| Render Time         | <1s                  | Playwright performance timing                       |
| Re-renders          | 0 unnecessary        | React DevTools profiler                             |
| JSDoc Coverage      | 100% exports         | Manual review                                       |
| CI/CD Tests         | All pass             | GitHub Actions workflow                             |

## Dependencies

- No external dependencies to add
- All required packages already installed (Playwright, axe-core, Vitest)
- Existing test patterns to follow

## Risks & Mitigations

| Risk                                 | Likelihood | Impact | Mitigation                     |
| ------------------------------------ | ---------- | ------ | ------------------------------ |
| RTL fixes break LTR layout           | Medium     | High   | Run tests in both directions   |
| Mobile fixes break desktop           | Low        | Medium | Test all breakpoints in CI     |
| Performance optimization causes bugs | Low        | Medium | Unit tests for memoized values |
| A11y fixes change visual design      | Medium     | Low    | Visual regression tests        |
