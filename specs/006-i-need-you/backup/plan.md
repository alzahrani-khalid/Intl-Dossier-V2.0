# Implementation Plan: Theme Selection System

**Branch**: `006-i-need-you` | **Date**: 2025-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-i-need-you/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected Project Type: web (frontend+backend)
   → Set Structure Decision: Option 2 (Web application)
3. Fill the Constitution Check section
   → Checking bilingual, type safety, security, and accessibility requirements
4. Evaluate Constitution Check section
   → All constitutional requirements addressed
   → Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → No NEEDS CLARIFICATION items found
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
7. Re-evaluate Constitution Check section
   → All requirements maintained
   → Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks command
```

## Summary
Implement a comprehensive theme selection system for the GASTAT International Dossier System that supports multiple visual themes (GASTAT and Blue Sky), dark/light mode switching, and bilingual interface (English/Arabic) with RTL/LTR support. The system must persist user preferences and ensure accessibility across all theme combinations.

## Technical Context
**Language/Version**: TypeScript 5.0+, Node.js 18+
**Primary Dependencies**: React 18+, TanStack Router/Query v5, Tailwind CSS, shadcn/ui, i18next
**Storage**: Supabase (PostgreSQL) for user preferences, localStorage for immediate persistence
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: web - frontend with backend integration
**Performance Goals**: <100ms theme switch, instant visual feedback
**Constraints**: WCAG 2.1 AA compliance, full RTL support, offline capability
**Scale/Scope**: All application screens, 2 themes, 2 languages, 2 color modes

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Bilingual Excellence ✅
- [x] Arabic and English support from day one
- [x] RTL/LTR seamless switching
- [x] Equal priority for both languages
- [x] Cultural conventions respected

### Type Safety ✅
- [x] TypeScript strict mode enforced
- [x] No `any` types in implementation
- [x] Explicit return types for all functions
- [x] Components will be <200 lines

### Security-First ✅
- [x] Preference storage uses RLS policies
- [x] Input validation for theme/language values
- [x] No external dependencies for themes
- [x] XSS protection in translation strings

### Data Sovereignty ✅
- [x] All theme data stored locally
- [x] No external CDN dependencies
- [x] Offline theme switching capability
- [x] Preferences sync via Supabase

### Resilient Architecture ✅
- [x] Error boundaries for theme provider
- [x] Fallback to system preferences
- [x] Graceful handling of localStorage failures
- [x] Bilingual error messages

### Accessibility ✅
- [x] WCAG 2.1 Level AA compliance
- [x] Full keyboard navigation for theme selector
- [x] Screen reader announcements for changes
- [x] Proper ARIA labels in both languages
- [x] High contrast ratios maintained

### Container-First ✅
- [x] Docker support maintained
- [x] No additional service dependencies
- [x] Theme assets bundled in container
- [x] No runtime external fetches

## Project Structure

### Documentation (this feature)
```
specs/006-i-need-you/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (selected)
backend/
├── src/
│   ├── models/
│   │   └── user-preferences.ts
│   ├── services/
│   │   └── preferences-service.ts
│   └── api/
│       └── preferences/
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── theme-provider/
│   │   ├── theme-selector/
│   │   └── language-switcher/
│   ├── hooks/
│   │   ├── use-theme.ts
│   │   └── use-language.ts
│   ├── styles/
│   │   ├── themes/
│   │   └── globals.css
│   └── i18n/
│       ├── en/
│       └── ar/
└── tests/
```

**Structure Decision**: Option 2 (Web application) - Frontend components with backend preference persistence

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - All technical choices are clear from existing codebase
   - Theme implementation approach using CSS variables confirmed
   - i18n approach using i18next standard

2. **Generate and dispatch research agents**:
   - Research: shadcn/ui theming best practices
   - Research: RTL/LTR switching patterns in React
   - Research: Accessibility requirements for theme switchers

3. **Consolidate findings** in `research.md`:
   - Decision: CSS variables for runtime theme switching
   - Rationale: Zero JavaScript overhead, instant updates
   - Alternatives considered: CSS-in-JS (rejected for performance)

**Output**: research.md with implementation patterns confirmed

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - UserPreference entity: userId, theme, colorMode, language, updatedAt
   - ThemeConfiguration: theme definitions with CSS variables
   - LanguageConfiguration: locale codes and RTL flags

2. **Generate API contracts** from functional requirements:
   - GET /api/preferences/{userId}
   - PUT /api/preferences/{userId}
   - Output OpenAPI schema to `/contracts/preferences.yaml`

3. **Generate contract tests** from contracts:
   - Test preference retrieval
   - Test preference updates
   - Test validation of theme/language values

4. **Extract test scenarios** from user stories:
   - Default theme application test
   - Theme persistence across sessions
   - RTL/LTR switching validation
   - Accessibility compliance tests

5. **Update agent file incrementally**:
   - Execute update script for Claude
   - Add theme system technologies
   - Document recent changes

**Output**: data-model.md, /contracts/preferences.yaml, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate theme configuration tasks [P]
- Create i18n setup tasks [P]
- Build theme provider component tasks
- Implement preference persistence tasks
- Create UI control components
- Add accessibility features
- Write integration tests

**Ordering Strategy**:
- Foundation first: Theme configs, i18n setup
- Core components: Provider, hooks
- UI components: Selectors, switchers
- Integration: API, persistence
- Validation: Tests, accessibility

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, accessibility audit)

## Complexity Tracking
*No constitutional violations - section not needed*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none found)

---
*Based on Constitution v2.1.1 - See `.specify/memory/constitution.md`*