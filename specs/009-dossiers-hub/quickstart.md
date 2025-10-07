# Quickstart: Dossiers Hub

**Feature**: 009-dossiers-hub
**Date**: 2025-09-30
**Purpose**: Validation steps to verify Dossiers Hub implementation

## Prerequisites

- ✅ Database migrations applied (dossiers, dossier_owners, key_contacts, briefs tables)
- ✅ RLS policies enabled and configured
- ✅ Edge functions deployed (list, create, get, update, archive, timeline, generate-brief)
- ✅ Frontend components built (DossierCard, DossierHeader, DossierTimeline, DossierStats, DossierActions)
- ✅ Routes configured (`/_protected/dossiers`, `/_protected/dossiers/:id`)
- ✅ AnythingLLM service running (or mock for fallback testing)
- ✅ Test user accounts with different roles (owner, manager, analyst)

## Quick Validation Checklist

Run these steps in order to validate core functionality:

### 1. Database Setup Validation

```bash
# Connect to Supabase database
supabase db remote connect

# Verify tables exist
\dt dossiers dossier_owners key_contacts briefs

# Verify materialized view
\dvm dossier_timeline

# Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('dossiers', 'dossier_owners', 'key_contacts', 'briefs');

# Should all show rowsecurity = true
```

**Expected**: All tables exist, RLS enabled on all

---

### 2. API Contract Tests

```bash
# Run contract tests (should be implemented in backend/tests/contract/)
npm run test:contract -- dossiers

# Expected tests:
# ✅ GET /dossiers returns 200 with pagination
# ✅ POST /dossiers creates with 201
# ✅ GET /dossiers/:id returns 200 with stats
# ✅ PUT /dossiers/:id updates with version check
# ✅ DELETE /dossiers/:id archives with 204
# ✅ GET /dossiers/:id/timeline returns events
# ✅ POST /dossiers/:id/briefs generates or returns template
```

**Expected**: All contract tests pass (they will fail initially, that's TDD)

---

### 3. CRUD Operations Test

**Test as: Manager role user**

#### Create Dossier
```bash
curl -X POST https://api.local/dossiers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Saudi Arabia Relations",
    "name_ar": "العلاقات مع المملكة العربية السعودية",
    "type": "country",
    "sensitivity_level": "high",
    "summary_en": "Bilateral relations and diplomatic engagement",
    "summary_ar": "العلاقات الثنائية والمشاركة الدبلوماسية",
    "tags": ["bilateral", "strategic"]
  }'
```

**Expected**:
- Status: 201 Created
- Response includes: `id`, `version: 1`, `created_at`, `updated_at`
- Save `id` for next steps: `DOSSIER_ID=<returned-id>`

#### Read Dossier
```bash
curl https://api.local/dossiers/$DOSSIER_ID?include=stats,owners \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
- Status: 200 OK
- Response includes bilingual fields, `stats` object with counts
- `owners` array includes current user

#### Update Dossier
```bash
# Get current version first
VERSION=$(curl -s https://api.local/dossiers/$DOSSIER_ID | jq -r '.version')

curl -X PUT https://api.local/dossiers/$DOSSIER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"version\": $VERSION,
    \"summary_en\": \"Updated: Strong bilateral relations\",
    \"summary_ar\": \"محدث: علاقات ثنائية قوية\"
  }"
```

**Expected**:
- Status: 200 OK
- Response shows `version: 2` (incremented)
- `updated_at` changed

#### Test Optimistic Locking
```bash
# Try to update with old version
curl -X PUT https://api.local/dossiers/$DOSSIER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"version\": 1,
    \"tags\": [\"test\"]
  }"
```

**Expected**:
- Status: 409 Conflict
- Error message bilingual: version conflict detected

---

### 4. Permission Model Test

**Test as: Owner user (not admin/manager)**

```bash
# Owner can update their assigned dossier
curl -X PUT https://api.local/dossiers/$DOSSIER_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"version\": 2,
    \"tags\": [\"updated-by-owner\"]
  }"
```

**Expected**: 200 OK (owner can edit)

**Test as: Analyst user (not owner, not admin)**

```bash
# Analyst cannot update dossier they don't own
curl -X PUT https://api.local/dossiers/$DOSSIER_ID \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"version\": 3,
    \"tags\": [\"should-fail\"]
  }"
```

**Expected**: 403 Forbidden (analyst cannot edit)

---

### 5. Sensitivity-Based Access Test

**Setup**: Create dossiers with different sensitivity levels

```bash
# High sensitivity dossier (created above)
# Medium sensitivity dossier
curl -X POST https://api.local/dossiers \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -d '{
    "name_en": "Trade Agreement - Medium",
    "name_ar": "اتفاقية تجارية - متوسطة",
    "type": "mou",
    "sensitivity_level": "medium"
  }'

# Low sensitivity dossier
curl -X POST https://api.local/dossiers \
  -d '{
    "name_en": "Cultural Exchange - Low",
    "name_ar": "تبادل ثقافي - منخفض",
    "type": "theme",
    "sensitivity_level": "low"
  }'
```

**Test as: Analyst (clearance level 2 = medium)**

```bash
# List dossiers - analyst should see low + medium only
curl https://api.local/dossiers -H "Authorization: Bearer $ANALYST_TOKEN"
```

**Expected**:
- Returns medium and low sensitivity dossiers
- Does NOT return high sensitivity dossier

---

### 6. Timeline Aggregation Test

**Setup**: Create related artifacts (engagements, positions, etc.) linked to dossier

```bash
# Create engagement
curl -X POST https://api.local/engagements \
  -d '{
    "dossier_id": "'$DOSSIER_ID'",
    "title_en": "Ministerial Meeting",
    "title_ar": "اجتماع وزاري",
    "date": "2025-09-15T10:00:00Z"
  }'

# Create commitment
curl -X POST https://api.local/commitments \
  -d '{
    "dossier_id": "'$DOSSIER_ID'",
    "title_en": "Follow-up Report",
    "title_ar": "تقرير متابعة",
    "due_date": "2025-10-15T00:00:00Z"
  }'
```

**Fetch Timeline**:
```bash
curl https://api.local/dossiers/$DOSSIER_ID/timeline?limit=50 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
- Status: 200 OK
- Returns array of timeline events with both event types
- Events sorted by `event_date DESC`
- Pagination cursor provided if > 50 events
- Each event has bilingual title/description

**Test Infinite Scroll**:
```bash
# Get cursor from first response
CURSOR=$(curl -s https://api.local/dossiers/$DOSSIER_ID/timeline?limit=50 | jq -r '.pagination.next_cursor')

# Fetch next page
curl "https://api.local/dossiers/$DOSSIER_ID/timeline?limit=50&cursor=$CURSOR"
```

**Expected**:
- Returns next 50 events
- No duplicate events from first page

---

### 7. AI Brief Generation Test

#### Successful Generation
```bash
curl -X POST https://api.local/dossiers/$DOSSIER_ID/briefs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date_range_start": "2025-08-01T00:00:00Z",
    "date_range_end": "2025-09-30T23:59:59Z"
  }'
```

**Expected** (if AI service available):
- Status: 201 Created OR 202 Processing
- If 201: Response includes full brief with `content_en` and `content_ar`
- If 202: Status endpoint provided for polling
- Brief completes within 60 seconds

#### AI Service Fallback Test
```bash
# Stop AnythingLLM service or mock unavailability
docker stop anythingllm

# Try brief generation
curl -X POST https://api.local/dossiers/$DOSSIER_ID/briefs \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**:
- Status: 503 Service Unavailable
- Response includes:
  - Error message (bilingual)
  - `fallback.template` with manual brief structure
  - `fallback.pre_populated_data` with dossier info

---

### 8. Frontend Integration Test

**Open browser to**: http://localhost:5173/_protected/dossiers

#### Hub Page Test
1. ✅ Page loads in < 1.5 seconds
2. ✅ Dossier list displays with cards
3. ✅ Filter facets visible (type, status, sensitivity, owner, tags)
4. ✅ Apply filter for "country" type → list updates
5. ✅ Search for "Saudi" → results filtered
6. ✅ Scroll to bottom → infinite scroll loads more (if > 50)
7. ✅ Language toggle switches EN ↔ AR
8. ✅ RTL layout applies correctly for Arabic

#### Detail Page Test
1. ✅ Click dossier card → navigate to detail page
2. ✅ Page loads in < 1.5 seconds (including timeline first 50)
3. ✅ Header shows bilingual name
4. ✅ Summary displayed in both languages
5. ✅ Tabs visible: Timeline, Positions, MoUs, Commitments, Files, Intelligence
6. ✅ Right rail shows: key contacts, open items, relationship health score
7. ✅ Timeline tab active by default
8. ✅ Timeline events displayed, sorted by date desc
9. ✅ Scroll timeline → infinite scroll loads next 50

#### Actions Test
1. ✅ Click "Generate Brief" button
2. ✅ Loading indicator appears
3. ✅ Within 60s: Brief generated and attached (or fallback template shown)
4. ✅ Click "Add Engagement" → modal opens with dossier pre-selected
5. ✅ Click "Log Intelligence" → intelligence form opens

#### Concurrent Edit Test
1. Open dossier in two browser tabs (same user or different users)
2. Tab 1: Edit summary field, save
3. Tab 2: Edit tags field (without refreshing), try to save
4. ✅ Tab 2 shows conflict warning dialog
5. ✅ Dialog offers options: "Review Changes" and "Overwrite"
6. ✅ Click "Review Changes" → shows diff
7. ✅ Can choose to cancel or force overwrite

---

### 9. Accessibility Test

**Using axe DevTools or Lighthouse**:

```bash
# Run accessibility audit
npm run test:a11y -- dossiers
```

**Manual Keyboard Navigation**:
1. ✅ Tab through hub page → all interactive elements reachable
2. ✅ Enter key activates buttons/links
3. ✅ Arrow keys navigate within timeline list
4. ✅ Escape key closes modals/dialogs
5. ✅ Focus indicators visible on all elements

**Screen Reader Test (VoiceOver/NVDA)**:
1. ✅ Dossier cards announce: name, type, sensitivity
2. ✅ Timeline events announce: type, title, date
3. ✅ Error messages read aloud
4. ✅ Arabic content reads correctly in RTL mode
5. ✅ ARIA labels present: `aria-label`, `aria-describedby`, `role`

**WCAG 2.1 AA Checklist**:
- ✅ Color contrast ratios ≥ 4.5:1 for text
- ✅ Interactive elements ≥ 44x44 pixels (touch targets)
- ✅ Text resizable to 200% without loss of functionality
- ✅ No content flashing more than 3 times per second
- ✅ Keyboard focus order logical and predictable

---

### 10. Performance Validation

#### Hub Page Load
```bash
# Using Chrome DevTools or Lighthouse
npm run perf:measure -- /dossiers
```

**Expected Metrics**:
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 800ms
- Largest Contentful Paint (LCP): < 1.5s ✅ (requirement)
- Total Blocking Time (TBT): < 200ms

#### Detail Page with Timeline
```bash
npm run perf:measure -- /dossiers/$DOSSIER_ID
```

**Expected Metrics**:
- LCP: < 1.5s ✅ (requirement)
- Timeline rendering: < 500ms for 50 events
- Infinite scroll latency: < 300ms per batch

#### Database Query Performance
```sql
-- Explain analyze timeline query
EXPLAIN ANALYZE
SELECT * FROM dossier_timeline
WHERE dossier_id = '<dossier-id>'
ORDER BY event_date DESC, event_type, source_id
LIMIT 50;

-- Should use index, execution time < 50ms
```

---

## Success Criteria

All validation steps must pass:

- [x] Database schema created with RLS
- [x] API contracts implemented and tests pass
- [x] CRUD operations work with proper permissions
- [x] Hybrid permission model enforced (owner + admin/manager)
- [x] Optimistic locking prevents conflicts
- [x] Sensitivity-based access control works
- [x] Timeline aggregates all event types correctly
- [x] Infinite scroll pagination functional
- [x] AI brief generation succeeds (or fallback works)
- [x] Brief generation timeout at 60s
- [x] Frontend loads in < 1.5s
- [x] Bilingual content displays correctly (EN/AR)
- [x] RTL/LTR layout switches properly
- [x] Accessibility audit passes (WCAG 2.1 AA)
- [x] Performance targets met
- [x] Concurrent edit conflict detection works

## Troubleshooting

### "Permission denied" errors
- Check RLS policies are enabled: `SELECT relrowsecurity FROM pg_class WHERE relname = 'dossiers';`
- Verify user role in `user_roles` table
- Check clearance level function returns expected value

### Timeline not showing events
- Refresh materialized view: `REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_timeline;`
- Check foreign keys exist on source tables: `\d engagements`, `\d positions`, etc.
- Verify events exist with matching `dossier_id`

### Brief generation times out
- Check AnythingLLM service status: `docker ps | grep anythingllm`
- Review edge function logs: `supabase functions logs generate-brief`
- Verify timeout set to 60000ms in function config

### Optimistic lock conflicts not detected
- Confirm version column exists: `\d dossiers`
- Check trigger is active: `\df increment_version`
- Verify RLS policy includes version check

### Performance below target
- Run `ANALYZE` on tables: `ANALYZE dossiers; ANALYZE dossier_timeline;`
- Check index usage: `SELECT * FROM pg_stat_user_indexes WHERE tablename = 'dossiers';`
- Review slow query log

---

**Next Steps**: If all validation passes, feature is ready for Phase 4 (Production Deployment)