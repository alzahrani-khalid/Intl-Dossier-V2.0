# Phase 22: E2E Test Fixes - Research

**Researched:** 2026-04-09
**Domain:** Playwright E2E test gap closure (notifications + Operations Hub)
**Confidence:** HIGH

## Summary

Phase 22 fixes two E2E test specs (`05-notifications.spec.ts` and `10-operations-hub.spec.ts`) that were written during Phase 18 as structural scaffolding but target endpoints and DOM attributes that do not yet exist in the running application. The specs are well-structured with proper Page Object Models and follow the established fixtures pattern, but they will fail immediately because:

1. **Notifications spec** calls `POST /api/notifications/test-trigger` -- this endpoint does not exist anywhere in the backend. No notification API routes are registered at all in `backend/src/api/index.ts`. The spec also expects `data-testid="notification-unread-count"` on the bell badge, but `NotificationBadge.tsx` has no such testid. The preference toggles expect `data-testid="notification-pref-{category}-{channel}"` which also do not exist in `NotificationPreferences.tsx`.

2. **Operations Hub spec** looks for `data-testid="ops-zone-{name}"` where name is `intake|queue|in-progress|review|completed`. The actual OperationsHub component uses zone keys `attention|timeline|engagements|stats|activity` and has zero `data-testid` attributes. The spec navigates to `/operations` but no such route exists -- the dashboard lives at `/dashboard`.

**Primary recommendation:** Create the missing backend test-trigger endpoint, add all missing `data-testid` attributes to frontend components, and realign the spec zone names and route paths with the actual application architecture.

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                         | Research Support                                                                                                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-05 | Playwright E2E test covers notification interaction (receive, read, mark-all-read, preferences)     | Spec exists but calls nonexistent `/api/notifications/test-trigger` endpoint; bell badge lacks `notification-unread-count` testid; preference toggles lack `notification-pref-*` testids                                     |
| TEST-10 | Playwright E2E test covers Operations Hub dashboard (zones render, role switching, item navigation) | Spec exists but uses wrong zone names (`intake/queue/in-progress/review/completed` vs actual `attention/timeline/engagements/stats/activity`), wrong route (`/operations` vs `/dashboard`), and missing `ops-zone-*` testids |

</phase_requirements>

## Gap Analysis

### 05-notifications.spec.ts Gaps

| What Spec Expects                                          | What App Has                                                                              | Gap                                                                          | Fix Location                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `POST /api/notifications/test-trigger`                     | No notification routes at all                                                             | **MISSING** endpoint                                                         | `backend/src/api/notifications.ts` (new file)                       |
| `data-testid="notification-unread-count"` on badge         | `NotificationBadge.tsx` renders `<span>` with no testid                                   | **MISSING** testid                                                           | `frontend/src/components/notifications/NotificationBadge.tsx`       |
| `data-testid="notification-pref-{cat}-{chan}"` on toggles  | `NotificationPreferences.tsx` has only `notification-preferences` testid on container     | **MISSING** testids                                                          | `frontend/src/components/notifications/NotificationPreferences.tsx` |
| Bell button via role `button` name `/notifications\|.../ ` | `NotificationPanel.tsx` has `data-testid="notification-bell"` + `aria-label={t('title')}` | OK -- POM finds by role name                                                 |
| Mark-all-read button via role name                         | `NotificationPanel.tsx` line 169 has the button                                           | OK -- but button text is icon-only (`<CheckCheck />`), may need `aria-label` |

### 10-operations-hub.spec.ts Gaps

| What Spec Expects                                              | What App Has                                                                   | Gap                                                                      | Fix Location                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Route `/operations`                                            | Dashboard at `/dashboard`                                                      | **WRONG** route                                                          | `tests/e2e/support/pages/OperationsHubPage.ts` `goto()` |
| Zones: `intake`, `queue`, `in-progress`, `review`, `completed` | Zones: `attention`, `timeline`, `engagements`, `stats`, `activity`             | **WRONG** zone names                                                     | Spec + POM `OperationsZone` type                        |
| `data-testid="ops-zone-{name}"`                                | Zero data-testids in `OperationsHub.tsx` or zone components                    | **MISSING** testids                                                      | `frontend/src/pages/Dashboard/OperationsHub.tsx`        |
| Role switching via button name `/role\|.../ `                  | `RoleSwitcher.tsx` exists but not verified for accessibility name              | **NEEDS CHECK**                                                          | May need `aria-label`                                   |
| `analystPage` sees `in-progress` but not `intake`              | Actual roles: `leadership`, `officer`, `analyst` (no `admin` or `intake` role) | **MISMATCH** -- spec assumes Kanban-style zones, app has dashboard zones | Spec logic must align with `ZONE_ORDER`                 |

## Architecture Patterns

### Backend: Test-Trigger Endpoint Pattern

The spec already documents the design: a test-only endpoint gated on `NODE_ENV !== 'production'` (per threat T-18-10). The endpoint should:

1. Accept `{ title, body, category }` in POST body
2. Use the existing `sendInAppNotification()` from `notification.service.ts`
3. Extract `userId` from the authenticated JWT (existing `authenticateToken` middleware)
4. Return the created notification record

```typescript
// backend/src/api/notifications.ts (new file)
// Source: existing pattern in notification.service.ts [VERIFIED: codebase grep]
import { Router } from 'express'
import { sendInAppNotification } from '../services/notification.service'
const router = Router()

// Test-only trigger -- gated on NODE_ENV
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-trigger', async (req, res) => {
    const userId = req.user?.id
    const { title, body, category } = req.body
    const notification = await sendInAppNotification(userId, title, body, {
      type: category ?? 'system',
    })
    res.status(201).json(notification)
  })
}

export default router
```

Register in `backend/src/api/index.ts` with `apiRouter.use('/notifications', authenticateToken, notificationsRouter)`. [VERIFIED: codebase -- api/index.ts pattern]

### Frontend: data-testid Addition Pattern

Add `data-testid` attributes without changing component behavior:

1. **NotificationBadge.tsx**: Add `data-testid="notification-unread-count"` to the `<span>` element [VERIFIED: component source]
2. **NotificationPreferences.tsx**: Add `data-testid={`notification-pref-${category}-${channel}`}` to each toggle switch [VERIFIED: component source -- toggle pattern needs identification]
3. **OperationsHub.tsx**: Add `data-testid={`ops-zone-${zoneKey}`}` to the zone wrapper `<div>` at line 189 [VERIFIED: component source]

### Spec Realignment Pattern

The OperationsHub POM and spec must be updated to match the actual app:

1. **Route**: `/operations` -> `/dashboard` [VERIFIED: TanStack Router route at `_protected/dashboard.tsx`]
2. **Zone type**: `'intake' | 'queue' | 'in-progress' | 'review' | 'completed'` -> `'attention' | 'timeline' | 'engagements' | 'stats' | 'activity'` [VERIFIED: `ZONE_ORDER` in `operations-hub.types.ts`]
3. **Role test**: `analystPage` should verify analyst sees `timeline` first (per `ZONE_ORDER.analyst`) and does NOT see... actually all roles see all 5 zones, just in different order. The role-hiding logic in the spec (analyst cannot see `intake`) does not match the app (all zones visible for all roles). This test needs redesign. [VERIFIED: `ZONE_ORDER` gives all 5 zones to every role]

## Don't Hand-Roll

| Problem               | Don't Build                            | Use Instead                                                                | Why                                                                       |
| --------------------- | -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Notification creation | Custom DB insert in test-trigger route | `sendInAppNotification()` from `notification.service.ts`                   | Already handles metadata, timestamps, error handling [VERIFIED: codebase] |
| E2E auth              | Manual cookie injection                | Existing `storageState` fixture pattern in `tests/e2e/support/fixtures.ts` | Already set up for admin/analyst/intake roles [VERIFIED: codebase]        |
| Test data cleanup     | Manual DELETE queries                  | Existing `cleanupE2eEntities('e2e-')` in afterEach hook                    | Already wired in fixtures [VERIFIED: codebase]                            |

## Common Pitfalls

### Pitfall 1: NotificationBadge Returns null When Count is 0

**What goes wrong:** `NotificationBadge` returns `null` when `count <= 0`, so `getByTestId('notification-unread-count')` will fail when there are no unread notifications.
**Why it happens:** The POM's `getUnreadCount()` reads `textContent` from the badge, defaulting to `0` if not found. This is already handled correctly.
**How to avoid:** The POM already handles this gracefully -- `textContent()` returns null, parsed to `0`. No change needed.

### Pitfall 2: Mark-All-Read Button is Icon-Only

**What goes wrong:** The POM finds the mark-all-read button by role name `/mark all.*read|.../`. The actual button has only a `<CheckCheck />` icon and a `title` attribute, no visible text.
**Why it happens:** `getByRole('button', { name: /mark all.*read/ })` uses accessible name, which includes `title` attribute. This should work.
**How to avoid:** Verify the `title` prop maps to accessible name. If not, add `aria-label`.

### Pitfall 3: ZoneCollapsible Hides Content on Desktop

**What goes wrong:** On desktop, `ZoneCollapsible` returns `<>{children}</>` without any wrapper div, so `data-testid` added to `ZoneCollapsible` won't render.
**Why it happens:** Desktop mode passes children through without wrapper (line 51-53).
**How to avoid:** Add `data-testid` to the zone's parent `<div>` in `OperationsHub.tsx` (line 189), NOT inside `ZoneCollapsible`. [VERIFIED: component source]

### Pitfall 4: Analyst Role Zone Visibility

**What goes wrong:** The spec assumes analyst cannot see the `intake` zone. The actual app shows ALL 5 zones to ALL roles, just in different order.
**Why it happens:** The spec was written assuming Kanban-style role-scoped zones, but the app uses an information dashboard with role-based ordering.
**How to avoid:** Rewrite the analyst test to verify zone ORDER rather than zone VISIBILITY. [VERIFIED: `ZONE_ORDER` in types]

### Pitfall 5: Notification Categories Mismatch

**What goes wrong:** The spec's `triggerNotification` sends `category: 'system'` but the POM's preference toggle uses `work_item` category. The backend `sendInAppNotification()` stores category inside `metadata` object, while the frontend `useNotificationCenter` uses a `category` field directly on the notification record.
**Why it happens:** Two notification systems exist -- the older `notification.service.ts` (metadata-based) and the newer `useNotificationCenter.ts` (typed categories like `assignments|intake|calendar|signals|mentions|deadlines|system|workflow`).
**How to avoid:** The test-trigger endpoint should insert records matching the frontend schema (with proper `category` column), not the older metadata pattern. Check the actual `notifications` table schema. [ASSUMED -- need to verify table schema]

## Code Examples

### Adding data-testid to OperationsHub Zone Wrapper

```tsx
// In OperationsHub.tsx, line ~189 [VERIFIED: codebase]
<div key={zoneKey} className={`col-span-1 ${colSpan}`} data-testid={`ops-zone-${zoneKey}`}>
```

### Adding data-testid to NotificationBadge

```tsx
// In NotificationBadge.tsx [VERIFIED: codebase]
<span
  className={cn(/* existing classes */)}
  aria-label={`${count} unread notifications`}
  data-testid="notification-unread-count"
>
```

### Corrected OperationsHubPage POM

```typescript
// Updated type and route [VERIFIED: codebase]
export type OperationsZone = 'attention' | 'timeline' | 'engagements' | 'stats' | 'activity'

async goto(): Promise<void> {
  await this.page.goto('/dashboard')
}
```

## Assumptions Log

| #   | Claim                                                                                                                              | Section       | Risk if Wrong                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| A1  | `sendInAppNotification()` inserts into a `notifications` table with columns matching what the frontend queries                     | Code Examples | Test-trigger endpoint might create records the frontend can't read; need to verify table schema matches frontend expectations |
| A2  | The `title` attribute on the mark-all-read button is sufficient for Playwright `getByRole` accessible name matching                | Pitfalls      | POM would fail to find the button; may need explicit `aria-label`                                                             |
| A3  | Preference toggles in `NotificationPreferences.tsx` render individual switch/checkbox elements that can receive per-toggle testids | Gap Analysis  | If preferences are rendered differently (e.g., table rows), testid placement strategy changes                                 |

## Open Questions

1. **Notifications table schema alignment**
   - What we know: Backend `sendInAppNotification()` inserts `{user_id, title, message, metadata, read, created_at}`. Frontend `useNotificationCenter` expects `{id, user_id, type, title, message, category, data, read, priority, action_url, ...}`.
   - What's unclear: Whether these are the same table or different tables; whether the test-trigger should use the old service or insert directly.
   - Recommendation: Check the `notifications` table schema and align the test-trigger to insert records that the frontend can query.

2. **Preference toggle individual testids**
   - What we know: The preferences page has a container testid but no per-toggle testids.
   - What's unclear: The exact toggle component structure inside NotificationPreferences.
   - Recommendation: Read the full component to identify where to add per-toggle testids.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------- |
| Framework          | Playwright (via `tests/e2e/`)                                                                |
| Config file        | `playwright.config.ts` (root)                                                                |
| Quick run command  | `npx playwright test tests/e2e/05-notifications.spec.ts tests/e2e/10-operations-hub.spec.ts` |
| Full suite command | `npx playwright test tests/e2e/`                                                             |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                               | Test Type | Automated Command                                         | File Exists?      |
| ------- | ------------------------------------------------------ | --------- | --------------------------------------------------------- | ----------------- |
| TEST-05 | Notification receive, read, mark-all-read, preferences | E2E       | `npx playwright test tests/e2e/05-notifications.spec.ts`  | Yes (needs fixes) |
| TEST-10 | Operations Hub zones render, role switching, item nav  | E2E       | `npx playwright test tests/e2e/10-operations-hub.spec.ts` | Yes (needs fixes) |

### Wave 0 Gaps

- None -- test infrastructure exists. The specs themselves need fixing, not the framework.

## Security Domain

### Applicable ASVS Categories

| ASVS Category       | Applies | Standard Control                                                                      |
| ------------------- | ------- | ------------------------------------------------------------------------------------- |
| V2 Authentication   | No      | Existing `authenticateToken` middleware handles auth                                  |
| V4 Access Control   | Yes     | Test-trigger endpoint MUST be gated on `NODE_ENV !== 'production'` per threat T-18-10 |
| V5 Input Validation | Yes     | Validate POST body of test-trigger (title, body, category)                            |

### Known Threat Patterns

| Pattern                             | STRIDE                 | Standard Mitigation                                                                         |
| ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| Test endpoint exposed in production | Elevation of Privilege | `NODE_ENV !== 'production'` guard [VERIFIED: spec comment references T-18-10]               |
| Arbitrary notification injection    | Spoofing               | Require valid JWT -- use `authenticateToken` middleware, extract userId from token not body |

## Sources

### Primary (HIGH confidence)

- Codebase grep: `tests/e2e/05-notifications.spec.ts` -- full spec source
- Codebase grep: `tests/e2e/10-operations-hub.spec.ts` -- full spec source
- Codebase grep: `tests/e2e/support/pages/NotificationsPage.ts` -- POM source
- Codebase grep: `tests/e2e/support/pages/OperationsHubPage.ts` -- POM source
- Codebase grep: `frontend/src/pages/Dashboard/OperationsHub.tsx` -- component source
- Codebase grep: `frontend/src/components/notifications/NotificationBadge.tsx` -- component source
- Codebase grep: `frontend/src/components/notifications/NotificationPanel.tsx` -- component source
- Codebase grep: `frontend/src/components/notifications/NotificationPreferences.tsx` -- component source
- Codebase grep: `backend/src/services/notification.service.ts` -- service source
- Codebase grep: `backend/src/api/index.ts` -- route registration
- Codebase grep: `frontend/src/domains/operations-hub/types/operations-hub.types.ts` -- zone definitions

### Tertiary (LOW confidence)

- A1-A3 in Assumptions Log -- need validation during planning/execution

## Metadata

**Confidence breakdown:**

- Gap analysis: HIGH -- all gaps verified by direct codebase inspection
- Fix strategy: HIGH -- follows existing patterns in the codebase
- Schema alignment: LOW -- notification table schema not fully verified; two systems may coexist

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable -- E2E infrastructure unlikely to change)
