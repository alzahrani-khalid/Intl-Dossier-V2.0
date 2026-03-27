---
phase: 06-architecture-consolidation
verified: 2026-03-26T00:00:00Z
status: gaps_found
score: 2/3 success criteria verified
re_verification: false
gaps:
  - truth: "No hooks call the API directly with raw fetch() — all data goes through domain repositories"
    status: partial
    reason: "useSLAMonitoring.ts in frontend/src/domains/work-items/hooks/ contains 4 raw fetch() calls in its queryFn functions, not routed through work-items.repository.ts"
    artifacts:
      - path: "frontend/src/domains/work-items/hooks/useSLAMonitoring.ts"
        issue: "Lines 52, 78, 105, 132 call raw fetch() directly against SLA_FUNCTION_URL in queryFn bodies — bypasses apiClient"
    missing:
      - "Extract SLA fetch calls into work-items.repository.ts as getSLAEndpoint/getSLABreached/getSLAPolicies functions using apiGet with { baseUrl: 'edge' }"
      - "Update useSLAMonitoring queryFn calls to use workItemsRepo.* functions"

  - truth: "Deprecated MainLayout.tsx and useMobile.tsx are deleted"
    status: failed
    reason: "Both files still exist in the codebase. Neither has any importers (0 usages found), so they are dead code, but the Plan 01 acceptance criterion explicitly requires deletion."
    artifacts:
      - path: "frontend/src/components/layout/MainLayout.tsx"
        issue: "File exists with @deprecated comment; 0 importers; should have been deleted in Plan 01"
      - path: "frontend/src/hooks/useMobile.tsx"
        issue: "File exists with @deprecated comment; 0 importers; should have been deleted in Plan 01"
    missing:
      - "Delete frontend/src/components/layout/MainLayout.tsx"
      - "Delete frontend/src/hooks/useMobile.tsx"

  - truth: "ARCH-03 tracking in REQUIREMENTS.md reflects completed backend service merges"
    status: failed
    reason: "REQUIREMENTS.md still shows ARCH-03 as [ ] (Pending) even though all 7 duplicate service files are deleted and their exports merged. The status table also shows 'Pending'. This is a documentation gap — the code work is done."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Line 54: ARCH-03 checkbox is unchecked [ ]; line 119 status table shows 'Pending'. Backend services are actually merged (verified: task-creation, event-conflicts, countries-search, signature-orchestrator, brief-context, link-audit, link-migration all deleted)."
    missing:
      - "Update .planning/REQUIREMENTS.md: mark ARCH-03 as [x] Complete"
      - "Update ARCH-03 status table entry from 'Pending' to 'Complete'"
human_verification: []
---

# Phase 6: Architecture Consolidation Verification Report

**Phase Goal:** All data flows through domain repositories with consistent patterns, eliminating raw API calls and duplicate services
**Verified:** 2026-03-26
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Domain repositories exist for all 13+ backend API areas — no hooks call the API directly with raw fetch() | PARTIAL | 17 domain directories created, all with repositories. useSLAMonitoring.ts (work-items domain) retains 4 raw fetch() calls in queryFn bodies. ai.repository.ts raw fetch is intentional/documented (SSE streaming). |
| 2 | Each backend domain has exactly one service file — no PascalCase/kebab-case duplicate pairs remain | VERIFIED | All 7 duplicate files deleted: task-creation.service.ts, event-conflicts.ts, countries-search.ts, signature-orchestrator.ts, brief-context.service.ts, link-audit.service.ts, link-migration.service.ts. Content merged into primary services with comments. |
| 3 | Shared patterns (CRUD operations, list/detail hooks, error handling) extracted into reusable utilities | PARTIAL | apiClient (5 methods, auth centralized, error handling) is the primary shared utility. shared/types/result.ts provides type-safe error pattern. No createListHook/createDetailHook/createCRUDHook extracted — each domain implements its own list/detail hook pattern independently. REQUIREMENTS.md marks ARCH-04 as Complete. |

**Score:** 1.5/3 (criterion 1 partial, criterion 2 verified, criterion 3 partial but REQUIREMENTS marks complete)

---

## Required Artifacts

### Plan 01: apiClient + Dossiers

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/lib/api-client.ts` | 5 exported functions, auth centralization | VERIFIED | Exports apiGet, apiPost, apiPut, apiPatch, apiDelete. Uses supabase.auth.getSession() for auth headers. 128 lines. |
| `frontend/src/lib/__tests__/api-client.test.ts` | Unit tests for apiClient | VERIFIED | File exists |
| `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` | getDossiers + 6 other exports | VERIFIED | Exists, exports getDossiers, getDossierRecommendations, getQuickSwitcherSearch, etc. |
| `frontend/src/domains/dossiers/index.ts` | Barrel re-export | VERIFIED | Exists |
| `frontend/src/components/layout/MainLayout.tsx` | Must NOT exist | FAILED | File still exists. Has @deprecated comment, 0 importers. |
| `frontend/src/hooks/useMobile.tsx` | Must NOT exist | FAILED | File still exists. Has @deprecated comment, 0 importers. |

### Plan 02: Positions, Engagements, Calendar

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/domains/positions/repositories/positions.repository.ts` | Position API operations | VERIFIED | Exists |
| `frontend/src/domains/engagements/repositories/engagements.repository.ts` | Engagement API operations | VERIFIED | Exists |
| `frontend/src/domains/calendar/repositories/calendar.repository.ts` | Calendar API operations | VERIFIED | Exists |
| All 3 domain index.ts barrels | Re-exports | VERIFIED | All exist |
| Positions (10 hooks), Engagements (4 hooks), Calendar (5 hooks) in domain dirs | Migrated | VERIFIED | Counts match plan expectations |

### Plan 03: Work-items, Relationships, Documents, Persons, Topics

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/domains/work-items/repositories/work-items.repository.ts` | Work item API operations | VERIFIED | Exists |
| `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts` | Must not contain raw fetch() | FAILED | 4 raw fetch() calls in queryFn (lines 52, 78, 105, 132) — not routed through repository |
| `frontend/src/domains/relationships/repositories/relationships.repository.ts` | Relationship API operations | VERIFIED | Exists. raw fetch() in useRelationships.ts is in a local helper fetchGraphData(), not queryFn — acceptable. |
| documents, persons, topics repos + indexes | Migrated | VERIFIED | All 5 domain dirs exist with repos and indexes |

### Plan 04: AI, Search, Intake, Audit, Analytics, Briefings, Tags, Import, Misc

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/domains/ai/repositories/ai.repository.ts` | AI ops with baseUrl: 'express' | VERIFIED | Uses baseUrl: 'express' per comment. Raw fetch() present only for SSE streaming endpoints (documented: "Uses raw fetch for SSE streaming endpoints") — intentional exception. |
| All 9 remaining domain repos + indexes | Migrated | VERIFIED | search, intake, audit, analytics, briefings, tags, import, misc all exist with repos and indexes |
| All 9 domain index.ts barrels | Re-exports | VERIFIED | All exist |

### Plan 05: Backend Service Merges + Docs

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/services/task-creation.service.ts` | Must NOT exist | VERIFIED | Deleted. Merged content in tasks.service.ts (line 428 comment). |
| `backend/src/services/event-conflicts.ts` | Must NOT exist | VERIFIED | Deleted. Merged in event.service.ts (line 522 comment). |
| `backend/src/services/countries-search.ts` | Must NOT exist | VERIFIED | Deleted. Merged in country.service.ts (line 282 comment). |
| `backend/src/services/signature-orchestrator.ts` | Must NOT exist | VERIFIED | Deleted. |
| `backend/src/services/brief-context.service.ts` | Must NOT exist | VERIFIED | Deleted. Merged in brief.service.ts (line 544 comment). |
| `backend/src/services/link-audit.service.ts` | Must NOT exist | VERIFIED | Deleted. Merged in link.service.ts (line 965 comment). |
| `backend/src/services/link-migration.service.ts` | Must NOT exist | VERIFIED | Deleted. Merged in link.service.ts (line 1293 comment). |
| `.planning/REQUIREMENTS.md` ARCH-03 status | Must show Complete | FAILED | Still shows [ ] Pending at line 54 and 'Pending' in status table at line 119. Code work is done; tracking document not updated. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `domains/dossiers/hooks/useDossiers.ts` | `dossiers.repository.ts` | `import * as dossiersRepo` | VERIFIED | dossiersRepo.getDossiers() confirmed in hook |
| `domains/positions/hooks/usePositions.ts` | `positions.repository.ts` | `import * as positionsRepo` | VERIFIED | positionsRepo.getPositions() confirmed |
| `domains/work-items/hooks/useSLAMonitoring.ts` | `work-items.repository.ts` | should route through repo | FAILED | Hook uses raw fetch() directly, bypassing repository |
| `domains/ai/repositories/ai.repository.ts` | `api-client.ts` | apiGet with baseUrl:'express' | VERIFIED | apiGet imported and used; raw fetch only for SSE streaming |
| `frontend/src/hooks/useDossiers.ts` | `@/domains/dossiers` | backward-compat re-export | VERIFIED | `export { useDossiers, dossierKeys } from '@/domains/dossiers'` |
| `frontend/src/hooks/usePositions.ts` | `@/domains/positions` | backward-compat re-export | VERIFIED | `export { usePositions, positionKeys } from '@/domains/positions'` |
| `frontend/src/hooks/useAIChat.ts` | `@/domains/ai` | backward-compat re-export | VERIFIED | Re-export confirmed |
| `backend/src/api/` → deleted services | `*primary* services` | import updates | VERIFIED | grep found 0 stale imports to deleted files in api/ |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ARCH-02 | 01, 02, 03, 04 | Frontend domain repositories for 13+ areas | PARTIAL | 17 domains created, all with repositories and backward-compat re-exports. useSLAMonitoring.ts retains raw fetch() in queryFn. REQUIREMENTS.md marks as [x] Complete. |
| ARCH-03 | 05 | Backend duplicate services consolidated | VERIFIED (code) / STALE (docs) | All 7 duplicate files deleted, merges confirmed in primary services. REQUIREMENTS.md still shows [ ] Pending — documentation not updated. |
| ARCH-04 | 01–04 | Shared patterns extracted into reusable utilities | PARTIAL | apiClient centralizes all auth/URL/error handling (primary shared pattern). shared/types/result.ts provides typed error handling. No createListHook/createDetailHook utilities. REQUIREMENTS.md marks as [x] Complete — criterion interpretation is that apiClient IS the shared pattern. |

### REQUIREMENTS.md Tracking Inconsistency

ARCH-03 in `.planning/REQUIREMENTS.md` is marked `[ ]` (line 54) and status table shows `Pending` (line 119), but the actual backend code work is complete. This is not a code gap — it is a tracking document gap.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts` | 52, 78, 105, 132 | Raw `fetch()` in queryFn | Blocker | Bypasses apiClient auth centralization; SLA monitoring calls are not authenticated via the standard pattern |
| `frontend/src/components/layout/MainLayout.tsx` | 1 | @deprecated file not deleted | Warning | Dead code; no importers; clutters codebase |
| `frontend/src/hooks/useMobile.tsx` | 1 | @deprecated file not deleted | Warning | Dead code; no importers; clutters codebase |

**Note on ai.repository.ts raw fetch:** The 3 raw fetch() calls in ai.repository.ts are for SSE streaming endpoints. This is a legitimate exception — SSE requires a streaming response body that `response.json()` cannot handle. The file comment documents this explicitly. Not classified as a stub or anti-pattern.

**Note on useRelationships.ts raw fetch:** The fetch() at line 334 is inside a module-level helper function `fetchGraphData()` used for prefetching relationship graph data. The primary query hooks import from RelationshipsRepo. Acceptable.

**Note on .refetch() hits:** `useDossierActivityTimeline.ts:218` and `useDossier.ts:384` contain `.refetch()` — this is the TanStack Query refetch method, not a raw API call. False positive in the grep.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| apiClient exports 5 functions | `grep -c "^export async function api"` api-client.ts | 5 | PASS |
| All 7 duplicate backend services deleted | `ls` each file | All return "No such file" | PASS |
| Dossier hooks route through repository | grep dossiersRepo in useDossiers.ts | Found `import * as dossiersRepo` + usage | PASS |
| Backward-compat re-exports work | grep from '@/domains/* in src/hooks/ | All 6 sampled hooks confirmed | PASS |
| useSLAMonitoring bypasses repository | grep fetch( in domain hook | 4 raw fetch() in queryFn | FAIL |

---

## Human Verification Required

None. All gaps are programmatically verifiable.

---

## Gaps Summary

Three gaps block full goal achievement:

**Gap 1 — useSLAMonitoring raw fetch (Blocker for SC1)**
`frontend/src/domains/work-items/hooks/useSLAMonitoring.ts` has 4 raw `fetch()` calls directly in queryFn bodies. The SLA monitoring hook was placed in the domain directory but its fetch calls were never migrated to go through `work-items.repository.ts` + apiClient. This means SLA monitoring API calls bypass the centralized auth header injection in apiClient. Fix: extract the fetch calls into repository functions using `apiGet` with `{ baseUrl: 'edge' }`, then update the hook queryFns to call `workItemsRepo.*`.

**Gap 2 — Deprecated files not deleted (Warning for Plan 01 acceptance criteria)**
`frontend/src/components/layout/MainLayout.tsx` and `frontend/src/hooks/useMobile.tsx` both still exist with 0 importers. They are dead code with @deprecated comments. Plan 01 acceptance criteria explicitly required deletion. Fix: delete both files.

**Gap 3 — ARCH-03 tracking document stale (Documentation gap)**
`.planning/REQUIREMENTS.md` marks ARCH-03 as `[ ]` Pending even though all 7 backend duplicate service files are deleted and their content merged into primary services. The code work is done. Fix: update REQUIREMENTS.md to mark ARCH-03 as `[x] Complete`.

Gaps 1 and 2 are code/artifact gaps. Gap 3 is a documentation tracking inconsistency. Gap 1 is the only blocker against Success Criterion 1; Gaps 2 and 3 are cleanup items.

---

_Verified: 2026-03-26_
_Verifier: Claude (gsd-verifier)_
