# Tasks: Theme Selection System

**Input**: Design documents from `/specs/006-i-need-you/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.0+, React 18+, Tailwind CSS, shadcn/ui, i18next
   → Structure: Web application (frontend/backend split)
2. Load optional design documents:
   → data-model.md: UserPreference, ThemeConfiguration, LanguageConfiguration
   → contracts/preferences.yaml: GET/PUT /api/preferences/{userId}
   → research.md: CSS variables approach, dual persistence strategy
3. Generate tasks by category:
   → Setup: i18n config, theme configs, Tailwind setup
   → Tests: API contract tests, theme switching tests
   → Core: providers, hooks, components
   → Integration: Supabase sync, localStorage
   → Polish: accessibility, performance
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T030)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Database**: `supabase/migrations/`

## Phase 3.1: Setup & Configuration

- [x] T001 Create database migration for user_preferences table in supabase/migrations/001_user_preferences.sql
- [x] T002 [P] Configure i18next in frontend/src/i18n/config.ts with English and Arabic support
- [x] T003 [P] Create GASTAT theme configuration in frontend/src/styles/themes/gastat.ts
- [x] T004 [P] Create Blue Sky theme configuration in frontend/src/styles/themes/blueSky.ts
- [x] T005 [P] Update Tailwind config for RTL support and CSS variables in frontend/tailwind.config.ts
- [x] T006 [P] Create theme CSS variables in frontend/src/styles/globals.css

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T007 [P] Contract test GET /api/preferences/{userId} in backend/tests/contract/preferences.get.test.ts
- [x] T008 [P] Contract test PUT /api/preferences/{userId} in backend/tests/contract/preferences.put.test.ts
- [x] T009 [P] Integration test default theme application in frontend/tests/integration/default-theme.test.tsx
- [x] T010 [P] Integration test theme persistence in frontend/tests/integration/theme-persistence.test.tsx
- [x] T011 [P] Integration test language switching and RTL in frontend/tests/integration/language-switch.test.tsx
- [x] T012 [P] Integration test cross-tab synchronization in frontend/tests/integration/cross-tab-sync.test.tsx
- [x] T013 [P] Unit test theme validation in backend/tests/unit/validation.test.ts
- [x] T014 [P] Unit test preference merging logic in frontend/tests/unit/preference-merge.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Backend Implementation
- [x] T015 [P] Create UserPreference model in backend/src/models/user-preferences.ts
- [x] T016 [P] Create preferences service in backend/src/services/preferences-service.ts
- [x] T017 Create GET /api/preferences/{userId} endpoint in backend/src/api/preferences/get.ts
- [x] T018 Create PUT /api/preferences/{userId} endpoint in backend/src/api/preferences/put.ts
- [x] T019 [P] Add preference validation middleware in backend/src/middleware/validate-preferences.ts
- [x] T020 [P] Add rate limiting middleware in backend/src/middleware/rate-limit.ts

### Frontend Implementation
- [x] T021 [P] Create ThemeProvider component in frontend/src/components/theme-provider/theme-provider.tsx
- [x] T022 [P] Create LanguageProvider component in frontend/src/components/language-provider/language-provider.tsx
- [x] T023 [P] Create useTheme hook in frontend/src/hooks/use-theme.ts
- [x] T024 [P] Create useLanguage hook in frontend/src/hooks/use-language.ts
- [x] T025 [P] Create ThemeSelector component in frontend/src/components/theme-selector/theme-selector.tsx
- [x] T026 [P] Create LanguageSwitcher component in frontend/src/components/language-switcher/language-switcher.tsx
- [x] T027 [P] Create preference persistence service in frontend/src/services/preference-persistence.ts
- [x] T028 [P] Create cross-tab sync service in frontend/src/services/cross-tab-sync.ts

## Phase 3.4: Translation Files

- [x] T029 [P] Create English translations in frontend/src/i18n/en/common.json
- [x] T030 [P] Create Arabic translations in frontend/src/i18n/ar/common.json

## Phase 3.5: Integration & Polish

- [x] T031 Integrate ThemeProvider into app root in frontend/src/app.tsx
- [x] T032 Connect preference service to Supabase client
- [x] T033 Add system preference detection for dark mode
- [x] T034 [P] Add accessibility attributes and ARIA labels
- [x] T035 [P] Add keyboard navigation support
- [x] T036 [P] Add focus management for theme/language switches
- [x] T037 [P] Performance optimization - debounce preference updates
- [x] T038 [P] Add error boundaries for theme provider
- [x] T039 [P] Create accessibility test suite in frontend/tests/a11y/theme-selector.test.tsx
- [x] T040 Run quickstart validation checklist

## Dependencies

- Database migration (T001) blocks all backend tasks
- Theme configs (T003-T006) before theme provider (T021)
- i18n config (T002) before language provider (T022)
- Tests (T007-T014) before implementation (T015-T028)
- Models (T015) before services (T016)
- Services (T016) before endpoints (T017-T018)
- Providers (T021-T022) before hooks (T023-T024)
- Hooks before components (T025-T026)
- All core implementation before integration (T031-T033)

## Parallel Execution Examples

### Batch 1: Setup Tasks
```bash
# Launch T002-T006 together (all different files):
Task: "Configure i18next in frontend/src/i18n/config.ts"
Task: "Create GASTAT theme in frontend/src/styles/themes/gastat.ts"
Task: "Create Blue Sky theme in frontend/src/styles/themes/blueSky.ts"
Task: "Update Tailwind config in frontend/tailwind.config.ts"
Task: "Create theme CSS variables in frontend/src/styles/globals.css"
```

### Batch 2: Test Tasks
```bash
# Launch T007-T014 together (all different test files):
Task: "Contract test GET /api/preferences/{userId}"
Task: "Contract test PUT /api/preferences/{userId}"
Task: "Integration test default theme application"
Task: "Integration test theme persistence"
Task: "Integration test language switching"
Task: "Integration test cross-tab sync"
Task: "Unit test theme validation"
Task: "Unit test preference merging"
```

### Batch 3: Backend Models and Services
```bash
# Launch T015-T016, T019-T020 together:
Task: "Create UserPreference model"
Task: "Create preferences service"
Task: "Add preference validation middleware"
Task: "Add rate limiting middleware"
```

### Batch 4: Frontend Core Components
```bash
# Launch T021-T028 together (all different files):
Task: "Create ThemeProvider component"
Task: "Create LanguageProvider component"
Task: "Create useTheme hook"
Task: "Create useLanguage hook"
Task: "Create ThemeSelector component"
Task: "Create LanguageSwitcher component"
Task: "Create preference persistence service"
Task: "Create cross-tab sync service"
```

### Batch 5: Translation Files
```bash
# Launch T029-T030 together:
Task: "Create English translations"
Task: "Create Arabic translations"
```

## Notes

- **[P] tasks** = different files, no shared dependencies
- Verify all tests fail before implementing features
- Commit after each task completion
- Run TypeScript strict mode checks after each implementation task
- Test accessibility after UI components are complete
- Validate against constitutional requirements throughout

## Task Generation Rules Applied

1. **From Contracts**:
   - preferences.yaml → T007-T008 (contract tests)
   - GET endpoint → T017 (implementation)
   - PUT endpoint → T018 (implementation)

2. **From Data Model**:
   - UserPreference entity → T015 (model)
   - ThemeConfiguration → T003-T004 (theme configs)
   - LanguageConfiguration → T002 (i18n config)

3. **From User Stories**:
   - Default theme story → T009 (test)
   - Theme persistence → T010 (test)
   - Language switching → T011 (test)
   - Cross-tab sync → T012 (test)

4. **From Quickstart Scenarios**:
   - 10 test scenarios → validation task T040
   - Accessibility tests → T039
   - Performance requirements → T037

## Validation Checklist

- [x] All contracts have corresponding tests (T007-T008)
- [x] All entities have model tasks (T015, configs in T002-T004)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task

## Success Metrics

- All 40 tasks completed
- All tests passing (including accessibility)
- Theme switch < 100ms
- WCAG 2.1 AA compliance verified
- TypeScript strict mode passing
- Both languages fully functional
- Cross-device sync working

---
*Generated from specifications in `/specs/006-i-need-you/`*