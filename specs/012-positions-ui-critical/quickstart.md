# Quickstart: Positions UI Critical Integrations
**Feature Branch**: `012-positions-ui-critical`
**Purpose**: Validate implementation through executable test scenarios

## Prerequisites
- [ ] Supabase project running with positions system deployed
- [ ] Frontend development server running (`npm run dev`)
- [ ] AnythingLLM service available (for AI suggestions)
- [ ] Test user with dossier collaborator role
- [ ] Sample dossier with 5+ positions created
- [ ] Sample engagement within the dossier

## Setup Instructions

### 1. Database Setup
```bash
# Apply migrations for new tables
cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0
supabase migration up

# Verify tables created
supabase db ls | grep -E "(engagement_positions|position_suggestions|briefing_packs|position_analytics|position_embeddings)"

# Seed test data
psql $DATABASE_URL -f specs/012-positions-ui-critical/seed-test-data.sql
```

### 2. Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Navigate to: http://localhost:5173
```

### 3. Test User Setup
```bash
# Create test user credentials
export TEST_USER_EMAIL="collaborator@gastat.sa"
export TEST_USER_PASSWORD="Test@12345"

# Login and get auth token
curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}"

# Save token for subsequent requests
export AUTH_TOKEN="<token_from_response>"
```

---

## User Story Validations

### Story 1: View Positions in Dossier Context
**Scenario**: User accesses positions from dossier detail page

**Steps**:
1. Navigate to `/dossiers/{dossier-id}`
2. Click on "Positions" tab
3. Verify positions list displays
4. Verify positions are filtered by current dossier
5. Verify search and filter controls are present

**Expected Results**:
- ✅ Positions tab visible in dossier detail
- ✅ Only positions from current dossier shown
- ✅ Search bar functional with <1s response time
- ✅ Filter by type, status, date range works
- ✅ Breadcrumb shows: Home > Dossiers > [Dossier Name] > Positions

**API Validation**:
```bash
# List positions for dossier (via positions endpoint with filter)
curl -X GET "http://localhost:54321/rest/v1/positions?dossier_id=eq.{dossier-id}&select=*" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Expected: 200 OK with positions array
```

**E2E Test File**: `frontend/tests/e2e/dossier-positions-tab.spec.ts`

---

### Story 2: AI-Suggested Positions in Engagement
**Scenario**: User views engagement with AI-suggested relevant positions

**Steps**:
1. Navigate to `/engagements/{engagement-id}`
2. Scroll to positions section
3. Verify "Suggested Positions" card displays
4. Verify positions ranked by relevance score
5. Verify relevance indicators (High/Medium/Low) shown
6. Click "Attach" on suggested position
7. Verify position moves to "Attached Positions" section

**Expected Results**:
- ✅ AI suggestions load within 2 seconds
- ✅ Relevance scores displayed (0.70-1.00 range)
- ✅ Suggestions sorted by relevance descending
- ✅ One-click attach functionality works
- ✅ Fallback to keyword search if AI unavailable

**API Validation**:
```bash
# Get AI suggestions for engagement
curl -X GET "http://localhost:54321/functions/v1/engagements/{engagement-id}/positions/suggestions?min_relevance=0.7&limit=10" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Expected: 200 OK with suggestions array, or 503 with fallback_mode: true
```

**E2E Test File**: `frontend/tests/e2e/ai-position-suggestions.spec.ts`

---

### Story 3: Attach Positions via Searchable Dialog
**Scenario**: User manually attaches positions to engagement

**Steps**:
1. On engagement detail page, click "Add Position"
2. Searchable dialog opens
3. Type search query (e.g., "climate policy")
4. Results filter in real-time (<1s)
5. Click on position to preview content
6. Select checkbox to attach
7. Click "Attach Selected"
8. Verify position appears in attached list

**Expected Results**:
- ✅ Dialog opens with all available positions
- ✅ Search filters results instantly (<1s)
- ✅ Multi-select enabled (up to 100 positions)
- ✅ Preview panel shows position content
- ✅ Attachment succeeds and list updates

**API Validation**:
```bash
# Attach position to engagement
curl -X POST "http://localhost:54321/functions/v1/engagements/{engagement-id}/positions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"position_id": "{position-id}", "attachment_reason": "Relevant to stakeholder meeting"}'

# Expected: 201 Created with engagement_position object
```

**E2E Test File**: `frontend/tests/e2e/attach-position-dialog.spec.ts`

---

### Story 4: Generate Bilingual Briefing Pack
**Scenario**: User generates PDF briefing pack from engagement and positions

**Steps**:
1. On engagement detail with 5 attached positions
2. Click "Generate Briefing Pack"
3. Select language (English or Arabic)
4. Click "Generate"
5. Progress indicator shows generation status
6. Briefing pack ready notification appears
7. Click "Download" to get PDF
8. Open PDF and verify:
   - Engagement metadata (title, date, stakeholders)
   - All 5 positions included
   - Correct language and RTL/LTR directionality
   - GASTAT branding applied

**Expected Results**:
- ✅ Generation completes within 10 seconds (5 positions)
- ✅ PDF displays correctly in selected language
- ✅ Auto-translation works for mismatched languages
- ✅ RTL (Arabic) and LTR (English) layouts correct
- ✅ Branded template applied

**API Validation**:
```bash
# Generate briefing pack
curl -X POST "http://localhost:54321/functions/v1/engagements/{engagement-id}/briefing-packs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language": "ar"}'

# Expected: 202 Accepted with job_id

# Check generation status
curl -X GET "http://localhost:54321/functions/v1/briefing-packs/jobs/{job-id}/status" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Expected: 200 OK with status: completed and file_url
```

**E2E Test File**: `frontend/tests/e2e/generate-briefing-pack.spec.ts`

---

### Story 5: Standalone Positions Library
**Scenario**: User accesses centralized positions library

**Steps**:
1. Navigate to `/positions`
2. Verify all positions across dossiers displayed
3. Use search to find specific position
4. Apply filters (type: policy_brief, status: published)
5. Click on position to view detail
6. Verify related engagements listed
7. Click on related engagement link
8. Verify navigation to engagement detail

**Expected Results**:
- ✅ All positions from all accessible dossiers shown
- ✅ Search and filters work across all positions
- ✅ Position detail shows related engagements
- ✅ Cross-navigation to engagements works
- ✅ RLS policies enforced (only accessible positions)

**API Validation**:
```bash
# List all positions (RLS filters by user permissions)
curl -X GET "http://localhost:54321/rest/v1/positions?select=*,dossiers(*),engagement_positions(engagements(*))" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Expected: 200 OK with positions array (only user's accessible positions)
```

**E2E Test File**: `frontend/tests/e2e/standalone-positions-library.spec.ts`

---

### Story 6: Cross-Module Navigation
**Scenario**: User navigates between dossiers, engagements, and positions seamlessly

**Steps**:
1. Start at dossier detail > positions tab
2. Click on position with engagements badge
3. Verify engagement list modal/popover displays
4. Click on engagement link
5. Verify navigation to engagement detail
6. Verify positions section highlighted
7. Click breadcrumb to return to dossier
8. Verify previous filter state preserved

**Expected Results**:
- ✅ Breadcrumbs show current location
- ✅ Cross-links navigate correctly
- ✅ Filter/search state preserved on navigation
- ✅ Scroll position preserved (sessionStorage)
- ✅ Visual indicators show current context

**API Validation**:
```bash
# Get position with engagement relationships
curl -X GET "http://localhost:54321/rest/v1/positions/{position-id}?select=*,engagement_positions(engagements(*))" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Expected: 200 OK with position and related engagements
```

**E2E Test File**: `frontend/tests/e2e/cross-module-navigation.spec.ts`

---

## Edge Case Validations

### Edge Case 1: No Suggested Positions
**Scenario**: Engagement has no relevant positions (AI service returns empty)

**Steps**:
1. Create new engagement with unique context (no matching positions)
2. Navigate to engagement detail
3. Verify suggestions section shows empty state
4. Verify manual search option available
5. Verify no errors shown

**Expected Results**:
- ✅ Empty state displays: "No suggested positions found"
- ✅ Manual "Add Position" button visible
- ✅ Graceful handling without errors

**E2E Test File**: `frontend/tests/e2e/no-suggestions-empty-state.spec.ts`

---

### Edge Case 2: Position Deletion with Attachments
**Scenario**: User attempts to delete position attached to engagements

**Steps**:
1. Navigate to position detail (attached to 3 engagements)
2. Click "Delete" button
3. Verify error message displays
4. Verify message lists all 3 engagements
5. Click on engagement link in error message
6. Detach position from engagement
7. Repeat for all 3 engagements
8. Attempt delete again
9. Verify deletion succeeds

**Expected Results**:
- ✅ Deletion blocked if attached to any engagement
- ✅ Error message lists all affected engagements
- ✅ Links to engagements functional
- ✅ Deletion succeeds after detaching all

**API Validation**:
```bash
# Attempt to delete attached position
curl -X DELETE "http://localhost:54321/rest/v1/positions/{position-id}" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Expected: 400 Bad Request with error listing engagements
```

**E2E Test File**: `frontend/tests/e2e/prevent-position-deletion.spec.ts`

---

### Edge Case 3: Briefing Pack Language Mismatch
**Scenario**: Generate Arabic briefing pack with English-only positions

**Steps**:
1. Attach 5 English-only positions to engagement
2. Generate briefing pack with language: "ar"
3. Wait for generation (may take longer due to translation)
4. Download PDF
5. Verify all content is in Arabic (auto-translated)
6. Verify RTL layout applied
7. Verify translations preserve meaning

**Expected Results**:
- ✅ Auto-translation triggered for language mismatch
- ✅ All positions translated to target language
- ✅ RTL layout applied for Arabic
- ✅ Generation completes within timeout (10s * positions count)

**E2E Test File**: `frontend/tests/e2e/briefing-pack-auto-translate.spec.ts`

---

### Edge Case 4: 100 Position Attachment Limit
**Scenario**: User attempts to attach 101st position to engagement

**Steps**:
1. Create engagement with 100 attached positions
2. Click "Add Position"
3. Search for another position
4. Attempt to attach
5. Verify error message displays
6. Verify message states limit (100 positions)
7. Verify suggestion to remove positions

**Expected Results**:
- ✅ Attachment blocked at 100 positions
- ✅ Error message: "Cannot attach more than 100 positions"
- ✅ Guidance to detach positions before adding more
- ✅ No server error or crash

**API Validation**:
```bash
# Attempt to attach 101st position
curl -X POST "http://localhost:54321/functions/v1/engagements/{engagement-id}/positions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"position_id": "{position-id}"}'

# Expected: 400 Bad Request with error: "ATTACHMENT_LIMIT_EXCEEDED"
```

**E2E Test File**: `frontend/tests/e2e/attachment-limit-enforcement.spec.ts`

---

### Edge Case 5: AI Service Unavailable
**Scenario**: AnythingLLM service is down, suggestions fall back to keyword search

**Steps**:
1. Stop AnythingLLM service
2. Navigate to engagement detail
3. Verify suggestions section loads (may be slower)
4. Verify "Fallback Mode" indicator displayed
5. Verify keyword-based suggestions shown
6. Verify manual attach still works

**Expected Results**:
- ✅ Graceful degradation to keyword search
- ✅ Visual indicator: "AI service unavailable, showing keyword matches"
- ✅ Positions still suggested (lower quality)
- ✅ Manual attach functionality unaffected

**E2E Test File**: `frontend/tests/e2e/ai-service-fallback.spec.ts`

---

## Performance Validations

### Performance 1: Position Search Response Time
**Scenario**: Validate search results return within 1 second

**Steps**:
1. Navigate to positions library
2. Open browser DevTools Network tab
3. Type search query (e.g., "economic")
4. Measure network request time
5. Verify results display within 1 second

**Expected Results**:
- ✅ API response time < 500ms (p95)
- ✅ UI update time < 1000ms total
- ✅ Debouncing prevents excessive requests

**Performance Test**: `frontend/tests/performance/position-search.spec.ts`

---

### Performance 2: Briefing Pack Generation
**Scenario**: Validate generation completes within timeout

**Steps**:
1. Create engagement with 100 positions
2. Generate briefing pack
3. Measure generation time
4. Verify completes within 10 seconds

**Expected Results**:
- ✅ Generation time < 10s for 100 positions
- ✅ Progress updates shown every 2 seconds
- ✅ Timeout handled gracefully if exceeded

**Performance Test**: `frontend/tests/performance/briefing-pack-generation.spec.ts`

---

## Accessibility Validations

### A11y 1: Keyboard Navigation
**Scenario**: Navigate and attach positions using keyboard only

**Steps**:
1. Navigate to engagement detail using keyboard (Tab, Enter)
2. Tab to positions section
3. Use Arrow keys to navigate position list
4. Press Enter to attach position
5. Press Delete to detach position
6. Verify screen reader announcements

**Expected Results**:
- ✅ All interactive elements reachable via keyboard
- ✅ Focus indicators visible
- ✅ ARIA labels present and accurate
- ✅ Screen reader announces actions

**A11y Test**: `frontend/tests/a11y/positions-keyboard-nav.spec.ts`

---

### A11y 2: Bilingual Screen Reader Support
**Scenario**: Validate screen reader experience in Arabic and English

**Steps**:
1. Enable VoiceOver (macOS) or NVDA (Windows)
2. Switch to Arabic language
3. Navigate positions interface
4. Verify announcements in Arabic
5. Switch to English
6. Verify announcements in English
7. Verify RTL/LTR navigation correct

**Expected Results**:
- ✅ Arabic announcements use RTL navigation
- ✅ English announcements use LTR navigation
- ✅ All interactive elements announced
- ✅ WCAG 2.1 Level AA compliance

**A11y Test**: `frontend/tests/a11y/positions-screen-reader.spec.ts`

---

## Security Validations

### Security 1: RLS Policy Enforcement
**Scenario**: Validate users can only attach positions from accessible dossiers

**Steps**:
1. Login as User A (collaborator on Dossier X)
2. Attempt to attach position from Dossier Y (no access)
3. Verify attachment blocked
4. Login as User B (collaborator on Dossier Y)
5. Verify User B can attach position from Dossier Y

**Expected Results**:
- ✅ RLS blocks unauthorized attachments
- ✅ Error message: "Forbidden: Insufficient permissions"
- ✅ No data leakage (position details not shown)

**Security Test**: `backend/tests/integration/rls-position-attachment.test.ts`

---

### Security 2: Audit Logging
**Scenario**: Validate all attach/detach actions logged

**Steps**:
1. Attach position to engagement
2. Query audit_logs table
3. Verify entry exists with:
   - User ID
   - Action: "position_attached"
   - Position ID
   - Engagement ID
   - Timestamp
4. Detach position
5. Verify detach action logged

**Expected Results**:
- ✅ All actions logged to audit_logs
- ✅ Timestamps accurate
- ✅ User context captured

**Security Test**: `backend/tests/integration/audit-logging.test.ts`

---

## Cleanup

```bash
# Reset test data
psql $DATABASE_URL -c "DELETE FROM engagement_positions WHERE created_at > NOW() - INTERVAL '1 hour';"
psql $DATABASE_URL -c "DELETE FROM briefing_packs WHERE created_at > NOW() - INTERVAL '1 hour';"

# Stop services
pkill -f "npm run dev"
pkill -f "anythingllm"
```

---

## Acceptance Criteria Checklist

### Functional Requirements
- [ ] FR-001: Positions tab in dossier detail (Story 1)
- [ ] FR-002: Standalone positions library at /positions (Story 5)
- [ ] FR-003: Positions section in engagement detail (Story 2)
- [ ] FR-004: Cross-navigation between modules (Story 6)
- [ ] FR-005-010: Position attachment/detachment (Story 3)
- [ ] FR-011-012: Position deletion prevention (Edge Case 2)
- [ ] FR-013-018: AI suggestions (Story 2, Edge Case 5)
- [ ] FR-019-028: Briefing pack generation (Story 4, Edge Case 3)
- [ ] FR-029-032: Analytics tracking (implicit in all stories)
- [ ] FR-033-037: UX & navigation (Story 6)
- [ ] FR-038-041: Performance (Performance Validations)
- [ ] FR-042-045: Security (Security Validations)

### Non-Functional Requirements
- [ ] Response time <1s for search (Performance 1)
- [ ] Briefing pack generation <10s for 100 positions (Performance 2)
- [ ] Keyboard navigation support (A11y 1)
- [ ] Bilingual screen reader support (A11y 2)
- [ ] RLS policy enforcement (Security 1)
- [ ] Audit logging (Security 2)

### Edge Cases
- [ ] No suggestions empty state (Edge Case 1)
- [ ] Position deletion with attachments (Edge Case 2)
- [ ] Auto-translation for briefing packs (Edge Case 3)
- [ ] 100 position limit enforcement (Edge Case 4)
- [ ] AI service fallback (Edge Case 5)

---

**Implementation Ready**: All user stories and edge cases have executable validation scenarios. Proceed to Phase 2: Task Generation.
