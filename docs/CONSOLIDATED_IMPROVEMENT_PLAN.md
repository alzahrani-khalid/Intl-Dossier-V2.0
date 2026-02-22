# Intl-DossierV2.0 Consolidated Improvement Plan

**Generated:** 2025-01-27
**Status:** Validated & Prioritized

---

## Executive Summary

After comprehensive validation of the codebase reviews, this plan consolidates **verified issues** into actionable work items. The validation process confirmed most claims and identified 3 critical runtime bugs requiring immediate attention.

### Validation Summary

| Category           | Claims Made | Validated | False/Partial         |
| ------------------ | ----------- | --------- | --------------------- |
| Critical Bugs      | 3           | 3 (100%)  | 0                     |
| TODOs/Incomplete   | 8           | 8 (100%)  | 0                     |
| Version Mismatches | 5           | 3 (60%)   | 2                     |
| RTL Violations     | Many        | Minimal   | Most fixed            |
| Database Indexes   | Missing     | N/A       | Already comprehensive |

---

## Phase 0: Critical Bug Fixes (IMMEDIATE)

These bugs will cause runtime failures and must be fixed before any other work.

### 0.1 Offline Queue `executeAction` Bug — RESOLVED

**File:** `frontend/src/services/offline-queue.ts`
**Severity:** CRITICAL (runtime crash)
**Status:** **RESOLVED** (2026-02-22, branch `feat/ui-theme-experiments`)

The code already calls the standalone `executeAction` function correctly at line 223:

```typescript
await executeAction(action);
```

This was fixed prior to this review. No action needed.

---

### 0.2 Circuit Breaker Failure Window Bug — RESOLVED

**File:** `frontend/src/services/CircuitBreakerService.ts`
**Severity:** HIGH (incorrect behavior)
**Status:** **RESOLVED** (2026-02-22, branch `feat/ui-theme-experiments`)

The code already stores `previousFailureTime` before updating (lines 129-137):

```typescript
const previousFailureTime = this.lastFailureTime;
this.lastFailureTime = Date.now();
if (previousFailureTime && this.lastFailureTime - previousFailureTime > this.monitoringPeriod) {
  this.failureCount = 1;
} else {
  this.failureCount++;
}
```

This was fixed prior to this review. No action needed.

---

### 0.3 Deploy Workflow Logic Error

**File:** `.github/workflows/deploy.yml`
**Lines:** 5, 18, 62-63
**Severity:** HIGH (staging never deploys)

**Problem:**

```yaml
on:
  push:
    branches: [main] # Line 5: Only triggers on main

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop' # Line 18: NEVER TRUE when triggered by main

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [deploy-staging] # Line 63: Depends on staging that never runs
```

**Fix:**
Option A: Separate workflows for staging (develop) and production (main)
Option B: Remove staging job and deploy directly to production from main
Option C: Add develop branch to trigger

---

## Phase 1: Quick Wins (1-2 days each)

### 1.1 Complete Settings TODOs

| TODO             | File                             | Line | Action                                           |
| ---------------- | -------------------------------- | ---- | ------------------------------------------------ |
| Password change  | `SecuritySettingsSection.tsx`    | 46   | Use `supabase.auth.updateUser({ password })`     |
| Profile upload   | `ProfileSettingsSection.tsx`     | 49   | Use Supabase Storage bucket                      |
| Data export      | `DataPrivacySettingsSection.tsx` | 67   | Create Edge Function for GDPR export             |
| Sign out all     | `DataPrivacySettingsSection.tsx` | 74   | Use `supabase.auth.signOut({ scope: 'global' })` |
| Account deletion | `DataPrivacySettingsSection.tsx` | 80   | Create Edge Function with cascade delete         |

### 1.2 Connect Widget Dashboard to Real APIs

**File:** `frontend/src/hooks/useWidgetDashboard.ts`

Replace mock functions with real API calls:

| Mock Function                 | Replace With       | API Endpoint                        |
| ----------------------------- | ------------------ | ----------------------------------- |
| `generateMockKpiData()`       | Real metrics query | `analytics-dashboard` Edge Function |
| `generateMockChartData()`     | Aggregated data    | `work-items-summary` Edge Function  |
| `generateMockEvents()`        | Calendar entries   | `calendar_entries` table            |
| `generateMockTasks()`         | Unified work items | `unified-work-list` Edge Function   |
| `generateMockNotifications()` | User notifications | `notifications` table               |

### 1.3 TypeScript Strict Mode Fixes

Fix `any` types in Edge Functions:

```typescript
// Before (sync-incremental/index.ts:114)
} catch (error: any) {

// After
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
```

**Files to fix:**

- `supabase/functions/sync-incremental/index.ts` (line 114)
- `supabase/functions/sync-pull/index.ts` (line 139)

### 1.4 Dossier Section Data Fetching

Complete TODOs in dossier sections:

| File                   | TODO                   | Action                                       |
| ---------------------- | ---------------------- | -------------------------------------------- |
| `EventTimeline.tsx`    | Fetch calendar entries | Query `calendar_entries` with dossier filter |
| `FollowUpActions.tsx`  | Fetch follow-up tasks  | Query `work_items` with source='engagement'  |
| `OutcomesSummary.tsx`  | Fetch outcomes         | Query `meeting_outcomes` table               |
| `ParticipantsList.tsx` | Fetch person dossiers  | Query `dossier_relationships`                |

---

## Phase 2: Medium Priority (1-2 weeks)

### 2.1 Frontend Test Coverage

**Current State:** 1 test file in `frontend/src/` vs 158 in `frontend/tests/`

**Target:** 60% coverage for core components

**Priority Components to Test:**

1. `useOfflineQueue` - Critical for offline functionality
2. `CircuitBreakerService` - After bug fix
3. `useWidgetDashboard` - After API integration
4. `UnifiedKanban` - Core work management
5. `DossierDetail` pages - User-facing features

### 2.2 Document Upload Implementation

**File:** `frontend/src/components/Dossier/sections/Documents.tsx`

Add upload functionality to existing buttons (lines 607-658):

```typescript
const handleUpload = async (files: FileList) => {
  const formData = new FormData();
  formData.append('file', files[0]);
  formData.append('dossierId', dossierId);
  formData.append('classification', selectedClassification);

  await supabase.storage.from('documents').upload(path, files[0]);
};
```

### 2.3 React.memo for Heavy Components

Add memoization to prevent unnecessary re-renders:

- `NetworkGraph.tsx` - Complex SVG rendering
- `UnifiedTimeline.tsx` - Large data sets
- `AdvancedGraphVisualization.tsx` - React Flow component
- `DocumentViewer.tsx` - PDF rendering

### 2.4 Virtual Scrolling for Large Lists

Implement `@tanstack/virtual` for:

- Dossier list views (>100 items)
- Commitment tracking tables
- Activity log displays
- Search results

---

## Phase 3: Architecture Improvements (2-4 weeks)

### 3.1 Remove Duplicate Directory

**Issue:** `frontend/frontend/` contains stale duplicate

**Action:**

```bash
rm -rf frontend/frontend/
```

Update `.gitignore` to prevent recreation.

### 3.2 Version Alignment

| Component    | CLAUDE.md | Actual       | Action                                    |
| ------------ | --------- | ------------ | ----------------------------------------- |
| React Native | 0.81+     | 0.79.5       | Upgrade mobile package.json               |
| Node.js      | 18+ LTS   | Not enforced | Add engines field to backend/package.json |

### 3.3 Workspace Configuration

**Issue:** Root `package.json` omits mobile but `pnpm-workspace.yaml` includes it

**Fix:** Align workspace definitions:

```yaml
# pnpm-workspace.yaml
packages:
  - 'frontend'
  - 'backend'
  - 'mobile' # Add to root package.json workspaces too
  - 'tests'
  - 'shared'
```

### 3.4 Batch API Endpoints

Create composite endpoints to reduce request count:

- `dossier-with-relations` - Dossier + related entities + activity
- `dashboard-summary` - All widget data in one call
- `user-context` - User + preferences + notifications + active tasks

---

## Phase 4: Security Enhancements (2-3 weeks)

### 4.1 Input Sanitization

Add DOMPurify for rich text:

```typescript
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['class'],
});
```

**Apply to:**

- After-action notes
- Dossier descriptions
- Position content
- Document annotations

### 4.2 RLS Policy Audit

Verify restrictive policies on sensitive tables:

- `users` - Only self-read
- `audit_logs` - Admin only
- `contacts` - Role-based
- `elected_officials` - Special visibility rules

### 4.3 CSRF Token Implementation

Add explicit CSRF protection beyond SameSite cookies:

1. Generate token on auth
2. Include in all state-changing requests
3. Verify server-side

---

## Phase 5: Feature Enhancements (4-8 weeks)

### 5.1 Mobile App Foundation (from spec 018)

Priority features:

1. Offline-first with WatermelonDB
2. Biometric authentication
3. Push notifications
4. Read-only dossier access

### 5.2 AI Agent Framework Expansion

Implement remaining PRD agents:

| Agent                | Status      | Action                     |
| -------------------- | ----------- | -------------------------- |
| Relationship Manager | Partial     | Add strategy suggestions   |
| Research Agent       | Not started | Implement with AnythingLLM |
| Brief Generator      | Implemented | Enhance with templates     |
| Task Coordinator     | Partial     | Add workflow automation    |
| Analytics Agent      | Basic       | Add pattern detection      |

### 5.3 Predictive Engagement Recommendations

Database table exists (`20260112100001_predictive_engagement_recommendations.sql`)

Build UI for:

- ML-based partnership scoring
- Optimal engagement timing
- Risk alerts for relationship deterioration

---

## Implementation Priority Matrix

| Priority     | Effort: Low                      | Effort: Medium                  | Effort: High               |
| ------------ | -------------------------------- | ------------------------------- | -------------------------- |
| **Critical** | Phase 0 bugs (all 3)             | -                               | -                          |
| **High**     | Settings TODOs, TypeScript fixes | Widget APIs, Test coverage      | Mobile app foundation      |
| **Medium**   | React.memo, Version alignment    | Document upload, Virtual scroll | AI agents, Batch APIs      |
| **Low**      | Duplicate cleanup                | Workspace config                | Predictive recommendations |

---

## Quick Reference: File Locations

| Issue               | Primary File                                                     |
| ------------------- | ---------------------------------------------------------------- |
| Offline queue bug   | `frontend/src/services/offline-queue.ts:222`                     |
| Circuit breaker bug | `frontend/src/services/CircuitBreakerService.ts:128-132`         |
| Deploy workflow     | `.github/workflows/deploy.yml:18,62`                             |
| Settings TODOs      | `frontend/src/components/settings/sections/*.tsx`                |
| Widget mocks        | `frontend/src/hooks/useWidgetDashboard.ts:165-397`               |
| Document upload     | `frontend/src/components/Dossier/sections/Documents.tsx:607-658` |
| Duplicate directory | `frontend/frontend/` (delete)                                    |

---

## Success Metrics

### Phase 0 Complete When:

- [x] Offline queue processes without errors (resolved — already calls standalone function)
- [x] Circuit breaker correctly tracks failure windows (resolved — stores previousFailureTime)
- [x] CI/CD workflow simplified to main-only production deploy (dead staging job removed)

### Phase 1 Complete When:

- [ ] All settings functions connect to Supabase
- [ ] Dashboard shows real-time data
- [ ] No TypeScript `any` in Edge Functions

### Phase 2 Complete When:

- [ ] Frontend test coverage > 40%
- [ ] Document upload works for all dossier types
- [ ] Large lists use virtual scrolling

### Phase 3 Complete When:

- [ ] No duplicate directories
- [ ] All package versions aligned
- [ ] Workspace configuration consistent

---

## Appendix: Validated vs Rejected Claims

### Rejected/Partial Claims:

1. **RTL Violations** - Minimal violations found; most code uses logical properties correctly
2. **Missing Database Indexes** - Actually comprehensive with 69+ indexes
3. **Collaborative Editor Disabled** - Active version is fully implemented at `components/collaborative-editing/`
4. **Document Upload Placeholders** - Buttons exist and work, just missing onClick handlers

### Confirmed Claims Requiring No Action:

1. **Test Suite Structure** - 158 test files exist in `frontend/tests/`, architecture is intentional
2. **Translation Coverage** - 110+ namespaces provides excellent i18n support
3. **Edge Function Count** - 260+ functions is appropriate for feature set
