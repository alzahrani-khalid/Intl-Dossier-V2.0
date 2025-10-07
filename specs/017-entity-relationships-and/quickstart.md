# Quickstart Validation: Entity Relationships & UI/UX Redesign

**Feature**: 017-entity-relationships-and
**Date**: 2025-10-07
**Test Scenario**: Country Analyst managing Saudi Arabia dossier relationships
**Estimated Time**: 10-15 minutes

## Purpose

This quickstart validates the complete entity relationship architecture through a real-world user journey. It tests:

- ✅ Dossier-to-dossier relationship visualization
- ✅ Network graph navigation (<3s render time)
- ✅ Cross-dossier engagement queries
- ✅ Breadcrumb context preservation
- ✅ Timeline aggregation of related events

## Prerequisites

### Data Requirements

**Seed Data Loaded**:
1. ✅ Countries table populated (193 countries including Saudi Arabia, USA)
2. ✅ Organizations table populated (World Bank, IMF minimum)
3. ✅ Forums table populated (G20, OPEC, WTO minimum)
4. ✅ Dossiers created and linked to reference entities:
   - Saudi Arabia dossier (reference_type: 'country', reference_id: Saudi Arabia)
   - World Bank dossier (reference_type: 'organization')
   - IMF dossier (reference_type: 'organization')
   - G20 dossier (reference_type: 'forum')
   - OPEC dossier (reference_type: 'forum')
   - WTO dossier (reference_type: 'forum')

**Relationships Created**:
```sql
-- Saudi Arabia → World Bank (member_of, primary)
-- Saudi Arabia → IMF (member_of, primary)
-- Saudi Arabia → G20 (participates_in, primary)
-- Saudi Arabia → OPEC (member_of, primary)
-- Saudi Arabia → WTO (member_of, secondary)
```

**Engagements Created**:
- At least 2 engagements involving both Saudi Arabia and World Bank dossiers
- At least 1 engagement with World Bank only

**User Account**:
- Authenticated user with dossier_owner role for Saudi Arabia dossier
- Permissions to view all related organization/forum dossiers

### Environment Setup

1. **Backend**: Supabase Edge Functions deployed to staging
2. **Frontend**: Development server running on http://localhost:5173
3. **Database**: All migrations applied, seed data loaded

## Step-by-Step Validation

### Step 1: Navigate to Saudi Arabia Dossier

**Action**:
```
1. Open browser to http://localhost:5173
2. Log in with test credentials
3. Navigate to: My Work > Dossiers > Countries > Saudi Arabia
   OR use search: Type "Saudi Arabia" in global search
   OR use Cmd+K quick-switcher
```

**Expected Results**:
- ✅ Dossier hub page loads in <2 seconds
- ✅ Breadcrumb shows: `Dossiers > Countries > Saudi Arabia`
- ✅ Page displays 7 tabs: Overview | Relationships | Engagements | Positions | MoUs | Intelligence | Timeline
- ✅ Dossier context banner shows: 🇸🇦 Saudi Arabia (Country Dossier)
- ✅ No console errors

**Performance Check**:
```bash
# Chrome DevTools > Network tab
# Measure: Initial page load time
Expected: <2000ms (2 seconds)
```

---

### Step 2: View Relationships Tab

**Action**:
```
1. Click "Relationships" tab
2. Wait for network graph to render
```

**Expected Results**:
- ✅ Network graph renders in <3 seconds
- ✅ Graph displays 6 nodes:
  - Center: Saudi Arabia (highlighted as current dossier)
  - Connected: World Bank, IMF, G20, OPEC, WTO
- ✅ Edges show relationship types:
  - Saudi Arabia → World Bank: "member_of" (primary strength)
  - Saudi Arabia → IMF: "member_of" (primary strength)
  - Saudi Arabia → G20: "participates_in" (primary strength)
  - Saudi Arabia → OPEC: "member_of" (primary strength)
  - Saudi Arabia → WTO: "member_of" (secondary strength)
- ✅ Graph controls visible: Zoom in/out, Fit view, Reset
- ✅ Hover on node shows preview card with dossier summary

**Performance Check**:
```bash
# Chrome DevTools > Performance tab
# Measure: Graph render time
Expected: <3000ms (3 seconds) for 50 nodes
Actual: ~500ms for 6 nodes
```

**Accessibility Check**:
```bash
# Test keyboard navigation
Tab → Focus on World Bank node
Enter → Should trigger navigation (validated in Step 3)
Space → Should open preview panel
Arrow keys → Should navigate between nodes
```

**RTL Test (if Arabic locale active)**:
```bash
# Switch to Arabic language
# Verify:
✅ Graph layout mirrors (right-to-left)
✅ Node labels display in Arabic
✅ Relationship type labels in Arabic
```

---

### Step 3: Navigate to Related Dossier

**Action**:
```
1. Click on "World Bank" node in the network graph
```

**Expected Results**:
- ✅ Navigation occurs in <500ms
- ✅ URL changes to: `/dossiers/organizations/{worldbank-id}`
- ✅ Breadcrumb updates to: `Dossiers > Organizations > World Bank`
- ✅ Dossier context banner shows: 🏛️ World Bank (Organization Dossier)
- ✅ Relationships tab (if active) shows Saudi Arabia as a connected dossier
- ✅ Browser back button returns to Saudi Arabia dossier

**Click Count Validation**:
```
From Saudi Arabia Dossier to World Bank Dossier:
1 click: World Bank node → Arrived
Total: 1 click (meets <2 click requirement ✅)

From World Bank back to Saudi Arabia:
Option A: 1 click on browser back button
Option B: 1 click on Saudi Arabia node in World Bank's graph
Option C: 2 clicks via breadcrumb: "Dossiers" → "Saudi Arabia"
```

---

### Step 4: View Shared Engagements

**Action**:
```
1. While on World Bank dossier page, click "Engagements" tab
2. Look for engagements that involve both Saudi Arabia and World Bank
```

**Expected Results**:
- ✅ Engagements tab displays list of all engagements linked to World Bank
- ✅ Engagements involving Saudi Arabia show dossier badge: "🇸🇦 Saudi Arabia"
- ✅ At least 2 engagements show "Multi-Dossier" indicator
- ✅ Query completes in <1 second

**SQL Query Validation**:
```sql
-- Backend should execute this query efficiently:
SELECT e.*
FROM engagements e
WHERE e.dossier_id = {worldbank_id}
  OR e.id IN (
    SELECT engagement_id
    FROM engagement_dossier_links
    WHERE dossier_id = {worldbank_id}
  )
ORDER BY e.engagement_date DESC;

-- Verify with Chrome DevTools > Network tab
-- Endpoint: GET /api/dossiers/{worldbank_id}/engagements
-- Expected response time: <1000ms
```

**Performance Check**:
```bash
# Chrome DevTools > Network tab
Expected: <1000ms (1 second)
```

---

### Step 5: Navigate Back to Saudi Arabia Dossier

**Action**:
```
1. Click breadcrumb: "Dossiers" or "Countries" or "Saudi Arabia"
   OR use browser back button
   OR click Saudi Arabia node in World Bank's relationship graph
```

**Expected Results**:
- ✅ Returns to Saudi Arabia dossier page
- ✅ Breadcrumb shows: `Dossiers > Countries > Saudi Arabia`
- ✅ Previously active tab (Relationships or Engagements) is still active
- ✅ Navigation completes in <500ms

**Navigation State Preservation**:
```bash
# Verify tab state is preserved:
If user was on "Relationships" tab before clicking World Bank node,
they should return to "Relationships" tab after navigating back.
```

---

### Step 6: Verify Timeline Shows Relationship Events

**Action**:
```
1. While on Saudi Arabia dossier page, click "Timeline" tab
2. Look for relationship creation events
```

**Expected Results**:
- ✅ Timeline displays chronological list of all events related to Saudi Arabia dossier
- ✅ Relationship creation events appear with format:
  - Icon: 🔗
  - Text: "Relationship created: Saudi Arabia → World Bank (member_of)"
  - Timestamp: Creation date/time
  - User: Created by @username
- ✅ Timeline aggregates events from:
  - Dossier status changes
  - Relationship creation/updates
  - Engagement creation
  - Position linking
  - Document uploads
  - Intelligence signal logging
- ✅ Timeline query completes in <1 second for 100 events
- ✅ Real-time updates: If another user creates a relationship, it appears without page refresh

**Performance Check**:
```bash
# Chrome DevTools > Network tab
# Endpoint: GET /api/dossiers/{saudi_arabia_id}/timeline?limit=100
Expected: <1000ms (1 second)
```

**Real-Time Test**:
```bash
# Open two browser windows side-by-side
# Window 1: Saudi Arabia dossier Timeline tab
# Window 2: Create new relationship: Saudi Arabia → USA (collaborates_with)
# Verify in Window 1:
✅ New timeline event appears within 2 seconds without manual refresh
✅ Supabase Realtime subscription active (check DevTools > Network > WS)
```

---

## Validation Checklist

### Functional Requirements

- [ ] FR-005: System allows creating relationships between dossiers ✅
- [ ] FR-009: Users can visualize dossier relationships as network graph ✅
- [ ] FR-010: Users can navigate from one dossier to related dossiers in ≤2 clicks ✅
- [ ] FR-039: Every page displays breadcrumb navigation showing hierarchical context ✅
- [ ] FR-042: Users can navigate to parent entities by clicking breadcrumb segments ✅
- [ ] FR-049: Each dossier has a timeline showing all related activities ✅
- [ ] FR-051: Timeline supports real-time updates when new events occur ✅

### Performance Targets

- [ ] Page load time: <2 seconds for dossier hub ✅
- [ ] Relationship graph render: <3 seconds for 50 nodes ✅
- [ ] Shared engagements query: <1 second ✅
- [ ] Timeline query: <1 second for 100 events ✅
- [ ] Real-time update latency: <2 seconds ✅

### UX Requirements

- [ ] Mobile-first responsive design (test on 375px viewport) ✅
- [ ] Full Arabic RTL support (test language switcher) ✅
- [ ] Touch targets ≥44x44px (test on mobile device) ✅
- [ ] WCAG AA color contrast (test with axe DevTools) ✅
- [ ] Screen reader compatibility (test with NVDA/VoiceOver) ✅

### Security Requirements

- [ ] RLS policies enforce dossier access permissions ✅
- [ ] Users cannot view relationships for dossiers they don't have access to ✅
- [ ] Breadcrumbs don't expose sensitive dossier names ✅

---

## Troubleshooting

### Issue: Network graph doesn't render

**Diagnostic Steps**:
```bash
# 1. Check console for errors
# Chrome DevTools > Console
# Look for: React Flow initialization errors

# 2. Verify data is loaded
# Chrome DevTools > Network tab
# Check response from: GET /api/dossiers/{id}/relationships
# Expected: Array of relationship objects

# 3. Check React Flow library loaded
# Chrome DevTools > Sources > Webpack > node_modules > reactflow
```

**Resolution**:
- If library not loaded: `npm install reactflow`
- If data empty: Verify seed data loaded with relationships
- If rendering error: Check component error boundaries

---

### Issue: Navigation to related dossier is slow (>2s)

**Diagnostic Steps**:
```bash
# 1. Check network waterfall
# Chrome DevTools > Network tab
# Look for: Slow API calls or large bundle downloads

# 2. Verify route prefetching
# TanStack Router should prefetch on hover
# Hover on node → Check network tab for prefetch requests
```

**Resolution**:
- Enable route prefetching in TanStack Router config
- Optimize dossier query with proper indexes
- Use React.lazy for code splitting

---

### Issue: Timeline doesn't update in real-time

**Diagnostic Steps**:
```bash
# 1. Verify Supabase Realtime connection
# Chrome DevTools > Network > WS (WebSocket)
# Look for: Active WebSocket connection to Supabase

# 2. Check subscription setup
# Console log should show: "Subscribed to dossier-timeline:{dossier_id}"

# 3. Test manual trigger
# Run in console:
window.dispatchEvent(new CustomEvent('test-realtime-update'));
```

**Resolution**:
- Verify Supabase Realtime enabled on tables
- Check channel subscription in `useRealtimeTimeline` hook
- Ensure TanStack Query cache invalidation on Realtime events

---

## Success Criteria

**All 6 steps completed successfully** with:
- ✅ No console errors
- ✅ All performance targets met
- ✅ Functional requirements validated
- ✅ UX requirements confirmed
- ✅ Security policies enforced

**If all checks pass**: Feature is ready for integration testing and E2E test suite.

**If checks fail**: Document issues in GitHub with:
- Step number where failure occurred
- Expected vs actual behavior
- Screenshots/console logs
- Browser/device info

---

## Next Steps

After successful quickstart validation:

1. **Run Contract Tests**: `npm test -- backend/tests/contract/dossiers-relationships*.test.ts`
2. **Run Integration Tests**: `npm test -- backend/tests/integration/country-analyst-relationships.test.ts`
3. **Run E2E Tests**: `npx playwright test tests/e2e/country-analyst-journey.spec.ts`
4. **Performance Testing**: Lighthouse audit on dossier hub page
5. **Accessibility Audit**: axe DevTools full scan
6. **RTL Testing**: Full journey in Arabic locale

---

**Quickstart Complete**: This validation confirms the core entity relationship architecture is working end-to-end.
