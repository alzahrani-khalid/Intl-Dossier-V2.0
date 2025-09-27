# Tasks: Resolve Theme System Specification Inconsistencies

**Input**: Design documents from `/specs/007-resolve-specification-inconsistencies/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Documentation updates only
   → Structure: Documentation-only changes
2. Load optional design documents:
   → data-model.md: Consistency tracking entities
   → contracts/validation.yaml: POST validation endpoints
   → research.md: Key consistency decisions
   → quickstart.md: Validation checklist
3. Generate tasks by category:
   → Setup: Backup and validation scripts
   → Tests: Consistency validation tests
   → Core: Documentation updates
   → Integration: Cross-reference validation
   → Polish: Final verification
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Documentation updates are mostly parallel
5. Number tasks sequentially (T001-T020)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Target specs**: `specs/006-i-need-you/`
- **Current specs**: `specs/007-resolve-specification-inconsistencies/`
- **Scripts**: `scripts/validation/`

## Phase 3.1: Setup & Backup

- [x] T001 Create backup of current specification files in specs/006-i-need-you/backup/
- [x] T002 [P] Create validation script skeleton in scripts/validation/validate-consistency.js
- [x] T003 [P] Set up git branch for tracking specification changes

## Phase 3.2: Validation Tests (TDD)

**CRITICAL: These tests MUST be written and MUST FAIL before ANY updates**

- [x] T004 [P] Write test for performance metric consistency in scripts/validation/test-performance.js
- [x] T005 [P] Write test for terminology consistency in scripts/validation/test-terminology.js
- [x] T006 [P] Write test for edge case definitions in scripts/validation/test-edge-cases.js
- [x] T007 [P] Write test for WCAG compliance specifics in scripts/validation/test-wcag.js
- [x] T008 [P] Write test for requirement-task coverage in scripts/validation/test-coverage.js

## Phase 3.3: Core Documentation Updates

### spec.md Updates
- [x] T009 Update FR-008 to specify "<100ms without page reload" in specs/006-i-need-you/spec.md
- [x] T010 Update FR-009 to add "WCAG 2.1 AA (4.5:1 normal, 3:1 large text)" in specs/006-i-need-you/spec.md
- [x] T011 Update FR-007 to specify "persistent in application header/navigation bar" in specs/006-i-need-you/spec.md
- [x] T012 Convert edge case questions to concrete statements with expected behaviors in specs/006-i-need-you/spec.md
- [x] T013 Add FR-013 for font loading (Plus Jakarta Sans for GASTAT, Open Sans for Blue Sky) in specs/006-i-need-you/spec.md
- [x] T014 Document default behavior precedence (Stored → System → Application) after FR-006 in specs/006-i-need-you/spec.md

### plan.md Updates
- [x] T015 [P] Update Performance Goals to match "<100ms" specification in specs/006-i-need-you/plan.md
- [x] T016 [P] Update Primary Dependencies to use "shadcn/ui" consistently in specs/006-i-need-you/plan.md
- [x] T017 [P] Update Storage description to "localStorage for immediate, Supabase for sync" in specs/006-i-need-you/plan.md

### tasks.md Updates
- [x] T018 Update T033 to clarify "system preference detection as fallback only" in specs/006-i-need-you/tasks.md
- [x] T019 Update T027/T032 descriptions to clarify dual persistence strategy in specs/006-i-need-you/tasks.md
- [x] T020 Add new task T041 for font configuration after T040 in specs/006-i-need-you/tasks.md

## Phase 3.4: Validation & Verification

- [ ] T021 Run all validation tests and ensure they pass
- [ ] T022 [P] Generate consistency report comparing before/after states
- [ ] T023 [P] Update quickstart.md in specs/006-i-need-you/ if it exists, or note its creation
- [ ] T024 [P] Create change log documenting all specification updates
- [ ] T025 Commit changes with detailed message about consistency improvements

## Dependencies

- Backup (T001) must complete before any updates
- Tests (T004-T008) must be written before updates (T009-T020)
- spec.md updates (T009-T014) should complete before plan/tasks updates
- All updates must complete before validation (T021)
- Final commit (T025) only after validation passes

## Parallel Execution Examples

### Batch 1: Initial Setup
```bash
# Launch T001-T003 together:
Task: "Create backup of specification files"
Task: "Create validation script skeleton"
Task: "Set up git branch for tracking"
```

### Batch 2: Test Creation
```bash
# Launch T004-T008 together (all different test files):
Task: "Write test for performance metric consistency"
Task: "Write test for terminology consistency"
Task: "Write test for edge case definitions"
Task: "Write test for WCAG compliance"
Task: "Write test for requirement-task coverage"
```

### Batch 3: Independent Updates
```bash
# Launch T015-T017 together (different sections of plan.md):
Task: "Update Performance Goals section"
Task: "Update Primary Dependencies section"
Task: "Update Storage description"
```

### Batch 4: Final Verification
```bash
# Launch T022-T024 together:
Task: "Generate consistency report"
Task: "Update quickstart.md"
Task: "Create change log"
```

## Notes

- **[P] tasks** = different files or independent sections
- Run validation tests before and after updates
- Maintain git history for rollback capability
- Document all changes in change log
- Ensure backward compatibility with existing implementation

## Task Generation Rules Applied

1. **From Contracts**:
   - validation.yaml → T004-T008 (validation tests)
   - Each endpoint maps to test scenarios

2. **From Data Model**:
   - Requirement entity → requirement update tasks
   - Term entity → terminology standardization tasks
   - CrossReference → validation tasks

3. **From Research**:
   - Performance decision → T009 (FR-008 update)
   - Terminology decision → T016 (shadcn/ui)
   - Edge case strategy → T012 (convert questions)

4. **From Quickstart**:
   - Each validation step → corresponding update task
   - Manual checklist items → specific tasks

## Validation Checklist

- [x] All inconsistencies from analysis have tasks
- [x] Tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks modify different files
- [x] Each task specifies exact file path
- [x] Dependencies clearly documented
- [x] No breaking changes to existing implementation

## Success Metrics

- All 25 tasks completed
- All validation tests passing
- No inconsistencies remaining in specifications
- 100% requirement-task coverage maintained
- Git history preserved for rollback
- Change log documenting all updates

## Special Considerations

Since this is a documentation-only update:
- No code changes required
- No deployment needed
- Focus on clarity and consistency
- Maintain backward compatibility
- Document changes thoroughly

---
*Generated from specifications in `/specs/007-resolve-specification-inconsistencies/`*