# Subtask 5-4: Replace .select() with Explicit Column Selection

## Progress Summary

**Status:** In Progress (24% complete)
**Instances Fixed:** 65 / 268
**Instances Remaining:** 203
**Files Remaining:** 75

## Completed Files (40 files)

1. tasks-create/index.ts
2. workflow-executor/index.ts (3 instances)
3. dossiers-update/index.ts
4. interaction-notes-create/index.ts
5. intake-tickets-update/index.ts
6. positions-delegate/index.ts (2 instances)
7. positions-emergency-correct/index.ts (2 instances)
8. attachments-upload/index.ts
9. positions-unpublish/index.ts
10. positions-create/index.ts
11. calendar-create/index.ts
12. organizations-create/index.ts
13. assignments-comments-create/index.ts
14. access-requests/index.ts (3 instances)
15. availability-polling/index.ts (8 instances)
16. cqrs-commands/index.ts (6 instances)
17. ocr-extract/index.ts
18. auth-biometric-setup/index.ts (2 instances)
19. contributors-remove/index.ts
20. assignments-checklist-import-template/index.ts
21. work-item-dossiers/index.ts
22. intelligence/index.ts (3 instances)
23. data-library/index.ts (2 instances)
24. mou-renewals/index.ts (2 instances)
25. engagement-briefs/index.ts
26. intake-links-update/index.ts
27. assignments-manual-override/index.ts
28. content-expiration/index.ts
29. dossiers-briefs-generate/index.ts
30. commitments-update-status/index.ts
31. retention-processor/index.ts
32. assignments-complete/index.ts
33. intake-tickets-triage/index.ts
34. positions-approve/index.ts
35. documents-create/index.ts
36. dossiers/index.ts
37. intake-tickets-assign/index.ts
38. positions-consistency-check/index.ts
39. intake-links-batch/index.ts
40. entity-duplicates/index.ts
41. stakeholder-influence/index.ts
42. populate-countries-v2/index.ts

## Remaining Files by Instance Count

**High Priority (6-12 instances):**
- collaborative-editing/index.ts (12)
- calendar-sync/index.ts (9)
- scenario-sandbox/index.ts (8)
- meeting-agendas/index.ts (8)
- recurring-events/index.ts (6)
- meeting-minutes/index.ts (6)
- custom-reports/index.ts (6)

**Medium Priority (4-5 instances):**
- view-preferences/index.ts (5)
- saved-searches/index.ts (5)
- persons/index.ts (5)
- milestone-planning/index.ts (5)
- engagement-dossiers/index.ts (5)
- email-inbound/index.ts (5)
- data-retention/index.ts (5)
- themes/index.ts (4)
- tag-hierarchy/index.ts (4)
- sla-monitoring/index.ts (4)
- compliance/index.ts (4)

**Low Priority (1-3 instances):**
- ~35 files with 1-3 instances each

## Pattern Used

Replaced `.select()` (which selects all columns) with explicit column lists like:
```typescript
.select('id, name, email, created_at, updated_at')
```

Column lists derived from:
1. Insert data structures in the same file
2. Existing explicit select patterns in the codebase
3. Table schemas

## Next Steps

Continue processing remaining 75 files, prioritizing:
1. Files with many instances (collaborative-editing, calendar-sync, etc.)
2. Files with single instances (quick wins)
3. Test spot-check after completion

## Commits

1. `5cdab0d` - Progress: 51/268 instances
2. `106219d` - Progress: 60/268 instances
3. `f22bacb` - Progress: 65/268 instances
