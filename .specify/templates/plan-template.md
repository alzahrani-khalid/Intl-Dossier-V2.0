# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Platform Scope**: [web-only | mobile-only | cross-platform]

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

**Platform Scope**: [web-only | mobile-only | cross-platform or NEEDS CLARIFICATION]

*For mobile-only or cross-platform features, specify:*
- **Mobile Tech Stack**: [e.g., Expo SDK 52+, React Native 0.81+, WatermelonDB 0.28+ or NEEDS CLARIFICATION]
- **Offline Requirements**: [e.g., offline-first for dossier CRUD, online-only for analytics or N/A]
- **Sync Strategy**: [e.g., incremental sync with conflict resolution, real-time only or N/A]
- **Native Features**: [e.g., biometric auth, camera integration, push notifications or N/A]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with project constitution (.specify/memory/constitution.md):

### Core Principles Compliance

- [ ] **Mobile-First & Responsive**: All UI components start with mobile base styles (320-640px), use progressive breakpoints, have 44x44px touch targets
- [ ] **RTL/LTR Support**: All UI uses logical properties (ms-*, me-*, ps-*, pe-*), no physical direction properties, supports Arabic RTL
- [ ] **Test-First**: Tests written and fail before implementation (if feature requires tests)
- [ ] **Type Safety**: TypeScript strict mode, explicit types, no `any` usage
- [ ] **Security by Default**: RLS policies on tables, JWT validation, no secrets in git, rate limiting
- [ ] **Performance**: Indexed queries, Redis caching strategy, lazy loading, <200ms p95 latency
- [ ] **Accessibility**: WCAG AA compliance, semantic HTML, keyboard navigation, 4.5:1 color contrast
- [ ] **Cross-Platform Mobile**: Platform scope declared in spec, mobile features use Expo/RN Paper, offline-first for data-heavy workflows, hybrid conflict resolution

### Security & Compliance

- [ ] **Data Protection**: Document scanning (ClamAV), sensitivity levels enforced via RLS
- [ ] **Audit Trail**: Audit logging for create/update/delete on core entities
- [ ] **Authentication**: Supabase Auth with JWT, RBAC enforcement

### Quality Standards

- [ ] **Code Organization**: Follows backend/frontend structure conventions
- [ ] **Naming Conventions**: PascalCase components, kebab-case utilities, proper migration naming
- [ ] **Code Style**: ESLint/Prettier configured, Winston logger (no console.log), explicit error handling
- [ ] **Git Workflow**: Conventional commits, PRs ≤300 LOC preferred

### Development Workflow

- [ ] **Specification**: Feature has spec in specs/###-feature-name/ following spec-template.md
- [ ] **Planning**: Plan includes technical context, structure decision, complexity tracking
- [ ] **Task Organization**: Tasks organized by user story, exact file paths, [P] markers for parallelization
- [ ] **UI Components**: shadcn/ui or approved registries checked before custom builds

**Violations Requiring Justification**: [List any constitution principle violations and document justification in Complexity Tracking section]

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Cross-Platform (Web + Mobile)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/

mobile/
├── src/
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   ├── services/
│   └── database/        # WatermelonDB schema for offline-first

supabase/
└── migrations/          # Shared across platforms
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Mobile Architecture *(fill only for mobile-only or cross-platform features)*

### Offline-First Strategy
- **Data persistence**: [e.g., WatermelonDB for dossiers/documents, AsyncStorage for settings]
- **Sync triggers**: [e.g., on app foreground, manual pull-to-refresh, background interval]
- **Conflict resolution**: [e.g., hybrid approach per constitution - auto-merge non-conflicting, user-prompt for conflicts]

### Native Features Integration
- **Biometrics**: [e.g., Touch ID/Face ID for sensitive operations, optional fallback to PIN]
- **Camera**: [e.g., document scanning with OCR, photo attachments]
- **Push Notifications**: [e.g., role approval requests, delegation expiry alerts]

### Performance Targets
- Initial screen render: ≤1s (skeleton UI with cached data)
- Fresh data load: ≤2s
- Incremental sync: ≤3s for data-heavy operations
