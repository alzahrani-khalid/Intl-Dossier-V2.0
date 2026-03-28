# Deferred Items — Phase 02: Naming & File Structure

## Pre-existing Broken Test Imports (Out of Scope)

Found during Plan 03 Task 1. These test files import service files that do not exist (likely removed in Phase 1 dead code cleanup). They were broken before our changes and are not caused by this plan.

| File                                                | Broken Import           | Notes                           |
| --------------------------------------------------- | ----------------------- | ------------------------------- |
| tests/unit/services/WordAssistantService.test.ts    | WordAssistantService    | Service does not exist          |
| tests/unit/services/EventsService.test.ts           | EventsService           | Service does not exist (plural) |
| tests/unit/services/CountriesService.test.ts        | CountriesService        | Service does not exist (plural) |
| tests/unit/services/ReportService.test.ts           | ReportService           | Service does not exist          |
| tests/unit/services/DataLibraryService.test.ts      | DataLibraryService      | Service does not exist          |
| tests/unit/services/OrganizationsService.test.ts    | OrganizationsService    | Service does not exist (plural) |
| tests/unit/services/SignatureRequestService.test.ts | SignatureRequestService | Service does not exist          |
| tests/unit/services/ReportsService.test.ts          | ReportsService          | Service does not exist (plural) |

**Recommendation:** These 8 test files should be deleted or their imports fixed in a future cleanup phase.
