# Tasks: Theme Selection System

**Input**: Design documents from `/specs/006-i-need-you/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/preferences.yaml

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.0+, React 18+, TanStack Router/Query v5, Tailwind CSS, shadcn/ui, i18next
   → Structure: Web application (frontend/backend)
2. Load optional design documents:
   → data-model.md: UserPreference, ThemeConfiguration, LanguageConfiguration entities
   → contracts/preferences.yaml: GET/PUT /api/preferences/{userId}
   → research.md: CSS variables approach, i18next for i18n, localStorage + Supabase persistence
3. Generate tasks by category:
   → Setup: i18n, theme configs, Tailwind RTL
   → Tests: contract tests for preferences API
   → Core: theme provider, language provider, preference hooks
   → Integration: Supabase sync, localStorage persistence
   → Polish: accessibility, visual tests, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T032)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests ✓
   → All entities have models ✓
   → All endpoints implemented ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `backend/src/`, `frontend/src/`
- Database migrations in `supabase/migrations/`

## Phase 3.1: Setup
- [X] T001 Install i18n dependencies: i18next, react-i18next, i18next-browser-languagedetector
- [X] T002 Install Tailwind RTL plugin and configure for bidirectional support
- [X] T003 [P] Create theme configuration structure in frontend/src/config/themes/
- [X] T004 [P] Create i18n configuration in frontend/src/i18n/config.ts
- [X] T005 [P] Set up translation file structure frontend/src/i18n/{en,ar}/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T006 [P] Contract test GET /api/preferences/{userId} in backend/tests/contract/test_preferences_get.test.ts
- [X] T007 [P] Contract test PUT /api/preferences/{userId} in backend/tests/contract/test_preferences_put.test.ts
- [X] T008 [P] Integration test theme switching in frontend/tests/integration/test_theme_switch.test.tsx
- [X] T009 [P] Integration test language switching with RTL in frontend/tests/integration/test_language_switch.test.tsx
- [X] T010 [P] Integration test preference persistence in frontend/tests/integration/test_preference_persistence.test.tsx
- [X] T011 [P] Integration test cross-tab sync in frontend/tests/integration/test_cross_tab_sync.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T012 Create database migration for user_preferences table in supabase/migrations/001_create_user_preferences.sql
- [X] T013 [P] Define GASTAT theme configuration in frontend/src/config/themes/gastat.ts
- [X] T014 [P] Define Blue Sky theme configuration in frontend/src/config/themes/blue-sky.ts
- [X] T015 [P] Create theme provider component in frontend/src/components/theme-provider/theme-provider.tsx
- [X] T016 [P] Create language provider component in frontend/src/components/language-provider/language-provider.tsx
- [X] T017 [P] Create useTheme hook in frontend/src/hooks/use-theme.ts
- [X] T018 [P] Create useLanguage hook in frontend/src/hooks/use-language.ts
- [X] T019 [P] Create theme selector component in frontend/src/components/theme-selector/theme-selector.tsx
- [X] T020 [P] Create language switcher component in frontend/src/components/language-switcher/language-switcher.tsx
- [X] T021 [P] Create UserPreference model in backend/src/models/user-preference.ts
- [X] T022 [P] Create preferences service in backend/src/services/preferences-service.ts
- [X] T023 Implement GET /api/preferences/{userId} endpoint in backend/src/api/preferences/get.ts
- [X] T024 Implement PUT /api/preferences/{userId} endpoint in backend/src/api/preferences/put.ts

## Phase 3.4: Integration
- [X] T025 Create localStorage persistence utility in frontend/src/utils/storage/preference-storage.ts
- [X] T026 Implement Supabase preference sync in frontend/src/services/preference-sync.ts
- [X] T027 Add cross-tab synchronization using BroadcastChannel in frontend/src/utils/broadcast/preference-broadcast.ts
- [X] T028 Add theme/language controls to app header in frontend/src/components/layout/header.tsx
- [X] T029 Wrap app with theme and language providers in frontend/src/main.tsx

## Phase 3.5: Polish
- [X] T030 [P] Add accessibility attributes and ARIA labels in frontend/src/components/theme-selector/theme-selector.tsx
- [X] T031 [P] Add screen reader announcements for theme changes in frontend/src/components/theme-provider/theme-provider.tsx
- [X] T032 [P] Create English translations in frontend/src/i18n/en/common.json
- [X] T033 [P] Create Arabic translations in frontend/src/i18n/ar/common.json
- [X] T034 [P] Add keyboard navigation support in frontend/src/components/theme-selector/theme-selector.tsx
- [X] T035 Visual regression tests for all theme/mode combinations in frontend/tests/visual/
- [X] T036 Performance test for theme switching (<100ms) in frontend/tests/performance/
- [X] T037 Update user documentation in docs/features/theme-selection.md

## Dependencies
- Setup (T001-T005) before all other tasks
- Tests (T006-T011) before implementation (T012-T024)
- T012 (migration) before T021-T024 (backend implementation)
- T013-T014 (theme configs) before T015 (theme provider)
- T015-T016 (providers) before T017-T020 (hooks and components)
- T021-T022 before T023-T024 (model/service before endpoints)
- Implementation (T012-T024) before integration (T025-T029)
- All implementation before polish (T030-T037)

## Parallel Example
```bash
# Launch T006-T011 together (all test files):
Task subagent_type=general-purpose prompt="Contract test GET /api/preferences/{userId} in backend/tests/contract/test_preferences_get.test.ts"
Task subagent_type=general-purpose prompt="Contract test PUT /api/preferences/{userId} in backend/tests/contract/test_preferences_put.test.ts"
Task subagent_type=general-purpose prompt="Integration test theme switching in frontend/tests/integration/test_theme_switch.test.tsx"
Task subagent_type=general-purpose prompt="Integration test language switching with RTL in frontend/tests/integration/test_language_switch.test.tsx"
Task subagent_type=general-purpose prompt="Integration test preference persistence in frontend/tests/integration/test_preference_persistence.test.tsx"
Task subagent_type=general-purpose prompt="Integration test cross-tab sync in frontend/tests/integration/test_cross_tab_sync.test.tsx"

# Launch T013-T022 together (all independent files):
Task subagent_type=general-purpose prompt="Define GASTAT theme configuration in frontend/src/config/themes/gastat.ts"
Task subagent_type=general-purpose prompt="Define Blue Sky theme configuration in frontend/src/config/themes/blue-sky.ts"
Task subagent_type=general-purpose prompt="Create theme provider component in frontend/src/components/theme-provider/theme-provider.tsx"
Task subagent_type=general-purpose prompt="Create language provider component in frontend/src/components/language-provider/language-provider.tsx"
Task subagent_type=general-purpose prompt="Create useTheme hook in frontend/src/hooks/use-theme.ts"
Task subagent_type=general-purpose prompt="Create useLanguage hook in frontend/src/hooks/use-language.ts"
Task subagent_type=general-purpose prompt="Create theme selector component in frontend/src/components/theme-selector/theme-selector.tsx"
Task subagent_type=general-purpose prompt="Create language switcher component in frontend/src/components/language-switcher/language-switcher.tsx"
Task subagent_type=general-purpose prompt="Create UserPreference model in backend/src/models/user-preference.ts"
Task subagent_type=general-purpose prompt="Create preferences service in backend/src/services/preferences-service.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task group
- Theme CSS variables must follow shadcn/ui conventions
- All text must be translatable - no hardcoded strings
- RTL/LTR switching must be seamless without layout breaks
- Accessibility is critical - all controls must be keyboard navigable

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - preferences.yaml → T006, T007 (contract tests)
   - GET/PUT endpoints → T023, T024 (implementation)
   
2. **From Data Model**:
   - UserPreference entity → T021 (model), T012 (migration)
   - ThemeConfiguration → T013, T014 (theme configs)
   - LanguageConfiguration → T004, T005 (i18n setup)
   
3. **From User Stories**:
   - Theme switching → T008 (integration test)
   - Language switching → T009 (integration test)
   - Preference persistence → T010 (integration test)
   - Cross-tab sync → T011 (integration test)

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Integration → Polish
   - Database migration before backend implementation
   - Theme configs before theme provider

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T006-T007 for preferences.yaml)
- [x] All entities have model tasks (T021 for UserPreference, T013-T014 for themes)
- [x] All tests come before implementation (T006-T011 before T012-T024)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task