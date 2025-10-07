# Quickstart Validation: Positions & Talking Points Lifecycle

**Feature**: 011-positions-talking-points
**Date**: 2025-10-01
**Purpose**: Step-by-step validation of the complete approval workflow

---

## Prerequisites

Before running this quickstart, ensure:

1. ✅ Supabase project is running locally or accessible
2. ✅ Database migrations applied (all tables created)
3. ✅ AnythingLLM service is running (for consistency checks)
4. ✅ Test data seeded (position types, audience groups, test users)
5. ✅ Frontend dev server running (`npm run dev` in `/frontend`)
6. ✅ You have test accounts for:
   - Policy Officer (drafter)
   - Section Chief (approver stage 1)
   - Department Director (approver stage 2)
   - Executive (approver stage 3)
   - Admin user

---

## Test Scenario: Complete Approval Workflow

This scenario validates acceptance scenarios #1-21 from the spec, covering the full position lifecycle.

### Step 1: Create Draft Position (Scenario #1, #2)

**Actor**: Policy Officer

1. Navigate to `/positions` route
2. Click "New Position" button
3. Fill in form:
   - Position Type: "Critical Policy Position" (5-stage approval)
   - Title (EN): "Trade Policy on Agricultural Exports"
   - Title (AR): "سياسة التجارة بشأن الصادرات الزراعية"
   - Thematic Category: "Trade Policy"
   - Audience Groups: Select "Management" and "Policy Officers"
4. Click "Save Draft"

**Expected Result**:
- ✅ Position saved with status `draft`
- ✅ Author ID recorded as current user
- ✅ Audience groups associated
- ✅ Version 1 created in `position_versions` table
- ✅ Success toast: "Draft saved successfully"

**Validation Queries**:
```sql
SELECT id, status, author_id, thematic_category
FROM positions
WHERE title_en = 'Trade Policy on Agricultural Exports';

SELECT * FROM position_audience_groups WHERE position_id = '<position_id>';
```

---

### Step 2: Add Bilingual Content (Scenario #3)

**Actor**: Policy Officer (same user)

1. In the position editor, use side-by-side editor:
   - Left panel (EN): Enter detailed position content
   - Right panel (AR): Enter Arabic translation
   - Add rationale in both languages
   - Add alignment notes
2. Click "Request AI Assistance" for suggested content (optional)
3. Upload 2 supporting documents (PDF attachments)
4. Click "Save Draft"

**Expected Result**:
- ✅ Bilingual content saved (both EN and AR)
- ✅ Attachments uploaded to Supabase Storage
- ✅ Attachment records created in `attachments` table
- ✅ AI suggestions displayed if AnythingLLM available

**Validation Queries**:
```sql
SELECT content_en, content_ar, rationale_en, rationale_ar
FROM positions
WHERE id = '<position_id>';

SELECT file_name, file_size, file_type
FROM attachments
WHERE position_id = '<position_id>';
```

---

### Step 3: Manual Consistency Check (Scenario #18)

**Actor**: Policy Officer

1. Click "Check Consistency" button
2. Wait for consistency analysis

**Expected Result**:
- ✅ Consistency check triggered (manual)
- ✅ Check runs against existing published positions
- ✅ Consistency score calculated (0-100)
- ✅ Conflicts displayed if detected
- ✅ Suggested resolutions shown
- ✅ Record created in `consistency_checks` table

**Validation Queries**:
```sql
SELECT consistency_score, check_trigger, ai_service_available, conflicts
FROM consistency_checks
WHERE position_id = '<position_id>'
ORDER BY checked_at DESC LIMIT 1;
```

**Validation Points**:
- If AI available: `ai_service_available = true`, semantic analysis included
- If AI unavailable: Graceful degradation to rule-based checks (FR-048)

---

### Step 4: Submit for Review (Scenario #5, #19)

**Actor**: Policy Officer

1. Click "Submit for Review" button
2. Confirm submission

**Expected Result**:
- ✅ Validation checks pass:
  - Both `content_en` and `content_ar` present (FR-047)
  - Both `title_en` and `title_ar` present
- ✅ Automatic consistency check runs (hybrid trigger)
- ✅ Position status changes to `under_review`
- ✅ `current_stage` set to 1
- ✅ First approver (Section Chief) notified
- ✅ Consistency results displayed

**Validation Queries**:
```sql
SELECT status, current_stage FROM positions WHERE id = '<position_id>';

SELECT check_trigger, consistency_score
FROM consistency_checks
WHERE position_id = '<position_id>'
AND check_trigger = 'automatic_on_submit';
```

**Edge Case Validation**:
- Try submitting with missing Arabic content → Should fail with error message in both languages

---

### Step 5: Review and Approve - Stage 1 (Scenario #6, #7, #10)

**Actor**: Section Chief (Approver Stage 1)

1. Log in as Section Chief
2. Navigate to "My Approvals" dashboard
3. See the pending position
4. Click to view position details
5. Review:
   - Full bilingual content
   - Rationale and alignment notes
   - Attachments
   - Compare with previous versions (if any)
6. Initiate approval by clicking "Approve"
7. **Step-up authentication challenge appears**:
   - Enter TOTP code or complete MFA
8. After step-up verified, add optional comments
9. Confirm approval

**Expected Result**:
- ✅ Step-up challenge initiated (`/auth-verify-step-up`)
- ✅ Elevated token obtained after MFA verification
- ✅ Approval recorded in `approvals` table:
  - `stage = 1`
  - `action = 'approve'`
  - `step_up_verified = true`
  - `step_up_challenge_id` recorded
- ✅ Position `current_stage` increments to 2
- ✅ Next approver (Department Director) notified
- ✅ Position remains in `under_review` status

**Validation Queries**:
```sql
SELECT stage, approver_id, action, step_up_verified, comments, created_at
FROM approvals
WHERE position_id = '<position_id>' AND stage = 1;

SELECT current_stage FROM positions WHERE id = '<position_id>';
```

**Security Validation**:
- Try approving without step-up → Should return 403 error
- Try approving with regular token → Should reject

---

### Step 6: Request Revisions - Stage 2 (Scenario #9)

**Actor**: Department Director (Approver Stage 2)

1. Log in as Department Director
2. Navigate to pending approvals
3. Open the position
4. Decide revisions needed
5. Click "Request Revisions"
6. Enter required comments explaining what needs to change
7. Submit

**Expected Result**:
- ✅ Approval recorded with `action = 'request_revisions'`
- ✅ Comments required and saved
- ✅ Position status changes back to `draft`
- ✅ `current_stage` resets to 0
- ✅ Original author (Policy Officer) notified with revision comments
- ✅ Position appears in author's drafts with revision notes

**Validation Queries**:
```sql
SELECT action, comments FROM approvals
WHERE position_id = '<position_id>' AND stage = 2;

SELECT status, current_stage FROM positions WHERE id = '<position_id>';
```

---

### Step 7: Revise and Resubmit

**Actor**: Policy Officer

1. Receive notification of requested revisions
2. Open draft position
3. Review revision comments
4. Make requested changes to content
5. Save draft (creates version 2)
6. Resubmit for review

**Expected Result**:
- ✅ Version 2 created in `position_versions`
- ✅ Previous version marked as superseded
- ✅ Position resubmitted (status = `under_review`, stage = 1)
- ✅ Approval chain restarts from stage 1

**Validation Queries**:
```sql
SELECT version_number, superseded, created_at
FROM position_versions
WHERE position_id = '<position_id>'
ORDER BY version_number DESC;

SELECT status, current_stage FROM positions WHERE id = '<position_id>';
```

---

### Step 8: Delegate Approval (Scenario #11)

**Actor**: Section Chief (Approver Stage 1)

1. Log in as Section Chief
2. Navigate to pending approvals
3. See the resubmitted position
4. Realize will be unavailable next week
5. Click "Delegate Approval"
6. Select delegate (another Section Chief user)
7. Set delegation expiry (e.g., 7 days from now)
8. Enter reason (optional)
9. Confirm delegation

**Expected Result**:
- ✅ Delegation recorded in `approvals` table:
  - `action = 'delegate'`
  - `delegated_from = <section_chief_id>`
  - `delegated_until = <expiry_timestamp>`
- ✅ Delegate user notified
- ✅ Position appears in delegate's approval queue
- ✅ Original approver can still revoke delegation

**Validation Queries**:
```sql
SELECT approver_id, delegated_from, delegated_until, action
FROM approvals
WHERE position_id = '<position_id>'
AND action = 'delegate';
```

---

### Step 9: Complete All Approval Stages (Scenario #8)

**Actor**: Delegates/Approvers at each stage

1. Delegate approves at stage 1 (with step-up)
2. Department Director approves at stage 2 (with step-up)
3. Legal Review approves at stage 3 (with step-up)
4. Executive Committee approves at stage 4 (with step-up)
5. CEO/President approves at stage 5 (with step-up)

**Expected Result**:
- ✅ 5 approval records created (one per stage)
- ✅ Each approval has `step_up_verified = true`
- ✅ Position `current_stage` progresses: 1 → 2 → 3 → 4 → 5
- ✅ After stage 5 approval, status changes to `approved`
- ✅ Position ready for publication

**Validation Queries**:
```sql
SELECT stage, approver_id, action, step_up_verified, created_at
FROM approvals
WHERE position_id = '<position_id>'
ORDER BY stage ASC;

SELECT status, current_stage FROM positions WHERE id = '<position_id>';
-- Should return: status = 'approved', current_stage = 5
```

---

### Step 10: Publish Position (Scenario #13, #14, #15)

**Actor**: Authorized Publisher (e.g., Communications Office)

1. Log in as publisher user
2. Navigate to approved positions
3. Select the approved position
4. Click "Publish"
5. Confirm publication

**Expected Result**:
- ✅ Position status changes to `published`
- ✅ Publication date recorded
- ✅ Publisher identity recorded
- ✅ Position now visible to users in "Management" and "Policy Officers" audience groups (selected in Step 1)
- ✅ Position NOT visible to users outside those groups

**Validation Queries**:
```sql
SELECT status, created_at AS published_at FROM positions WHERE id = '<position_id>';

-- Test audience group enforcement
-- Log in as user IN audience group → should see position
-- Log in as user NOT IN audience group → should NOT see position
SELECT p.id, p.title_en
FROM positions p
INNER JOIN position_audience_groups pag ON p.id = pag.position_id
INNER JOIN user_audience_memberships uam ON pag.audience_group_id = uam.audience_group_id
WHERE uam.user_id = '<test_user_id>' AND p.status = 'published';
```

---

### Step 11: Version Comparison (Scenario #12, #13)

**Actor**: Any authorized user (Policy Officer or viewer)

1. Open published position
2. Click "Version History" tab
3. See versions 1 and 2 listed
4. Select version 1 and version 2
5. Click "Compare Versions"
6. View side-by-side diff

**Expected Result**:
- ✅ Both versions displayed
- ✅ Version 2 marked as current, version 1 marked as superseded
- ✅ Side-by-side diff showing:
  - Additions highlighted in green
  - Deletions highlighted in red (strikethrough)
  - Unchanged text in normal formatting
- ✅ Bilingual diff (separate for EN and AR content)
- ✅ Metadata changes displayed

**Validation**:
- Visual inspection of diff rendering
- Verify RTL formatting for Arabic diffs
- Check accessibility (screen reader can announce changes)

---

### Step 12: Admin Reassignment (Scenario #11)

**Actor**: Admin user

**Simulate**: Approver leaves organization mid-approval

1. Log in as admin
2. Navigate to admin panel → Pending Approvals
3. Find approval stuck because approver left
4. Click "Reassign Approval"
5. Select new approver
6. Enter required reason (e.g., "Original approver left organization")
7. Confirm reassignment

**Expected Result**:
- ✅ Approval reassigned in `approvals` table:
  - `reassigned_by = <admin_user_id>`
  - `reassignment_reason` recorded
  - `approver_id` updated to new approver
- ✅ New approver notified
- ✅ Position appears in new approver's queue
- ✅ Full audit trail maintained

**Validation Queries**:
```sql
SELECT approver_id, reassigned_by, reassignment_reason
FROM approvals
WHERE id = '<approval_id>';
```

---

### Step 13: Reconcile Consistency Conflicts (Scenario #20, #21)

**Actor**: Policy Officer (returning to earlier step)

**Simulate**: Consistency check detected conflicts

1. During drafting or after submission, consistency check shows conflicts
2. Open "Consistency Panel"
3. View list of conflicting positions
4. Review each conflict:
   - Conflict type (contradiction/ambiguity/overlap)
   - Severity (high/medium/low)
   - Suggested resolution
5. For each conflict, choose resolution action:
   - Modify current position
   - Accept conflict (document reason)
   - Escalate for review
6. Click "Reconcile Conflicts"

**Expected Result**:
- ✅ Conflicts marked as reconciled
- ✅ Consistency score updated (should improve)
- ✅ Resolution actions recorded
- ✅ Position can proceed to submission

**Validation Queries**:
```sql
SELECT consistency_score, conflicts
FROM consistency_checks
WHERE position_id = '<position_id>'
ORDER BY checked_at DESC LIMIT 1;

-- Verify score improved after reconciliation
```

---

## Automated Test Checklist

After manual validation, run automated tests:

### Contract Tests
```bash
cd backend/tests/contract
npm test positions.test.ts
npm test approvals.test.ts
npm test versions.test.ts
npm test consistency.test.ts
npm test attachments.test.ts
```

**Expected**: All tests pass, confirming API contracts match spec

### Integration Tests
```bash
cd backend/tests/integration
npm test approval-workflow.test.ts
npm test delegation-reassignment.test.ts
npm test version-retention.test.ts
```

**Expected**: Full workflows validated with database interactions

### E2E Tests
```bash
cd frontend/tests/e2e
npx playwright test positions-approval-flow.spec.ts
npx playwright test step-up-auth.spec.ts
npx playwright test version-comparison.spec.ts
```

**Expected**: Browser automation validates complete user flows

### Accessibility Tests
```bash
cd frontend/tests/a11y
npx playwright test positions-a11y.spec.ts --project=chromium
npx playwright test positions-a11y-ar.spec.ts --project=chromium
```

**Expected**: WCAG 2.1 Level AA compliance in both EN and AR

---

## Performance Benchmarks

Run performance tests to validate targets:

```bash
cd backend/tests/performance
npm test api-response-times.test.ts
```

**Expected Results**:
- ✅ GET /positions response: <200ms (p95)
- ✅ POST /positions/*/approve response: <300ms (p95, includes step-up)
- ✅ Consistency check (manual): <5s
- ✅ Consistency check (automatic): <3s (async, non-blocking)
- ✅ Version comparison: <1s
- ✅ Position editor time-to-interactive: <3s

---

## Security Validation

### Step-Up Authentication
1. ✅ Approval without step-up → 403 Forbidden
2. ✅ Elevated token expiry → Re-challenge after 10 minutes
3. ✅ Step-up challenge tampering → Invalid token

### RLS Enforcement
1. ✅ User cannot view positions outside audience groups
2. ✅ User cannot approve positions outside their role
3. ✅ Admin-only actions (reassignment) enforced

### Data Sovereignty
1. ✅ AnythingLLM running locally (no external API calls)
2. ✅ All data in self-hosted Supabase
3. ✅ Attachments in Supabase Storage (not external S3)

---

## Rollback & Cleanup

After testing, clean up test data:

```sql
-- Delete test position and related records
DELETE FROM approvals WHERE position_id = '<test_position_id>';
DELETE FROM attachments WHERE position_id = '<test_position_id>';
DELETE FROM position_versions WHERE position_id = '<test_position_id>';
DELETE FROM position_audience_groups WHERE position_id = '<test_position_id>';
DELETE FROM consistency_checks WHERE position_id = '<test_position_id>';
DELETE FROM positions WHERE id = '<test_position_id>';
```

---

## Success Criteria

✅ **All 21 acceptance scenarios validated**
✅ **Contract tests pass (100% API compliance)**
✅ **Integration tests pass (workflow logic correct)**
✅ **E2E tests pass (user flows functional)**
✅ **Accessibility tests pass (WCAG 2.1 AA in EN + AR)**
✅ **Performance benchmarks met**
✅ **Security validation passed**
✅ **7-year retention mechanism verified**
✅ **Bilingual content rendering correct (EN/AR with RTL)**
✅ **Step-up authentication enforced**
✅ **RLS policies effective**
✅ **AI fallback graceful**
✅ **Consistency checking functional**

---

## Known Edge Cases (From Research)

These edge cases should be tested separately:

1. **Concurrent editing**: Test optimistic locking with `version` field
2. **Orphaned attachments**: Test cascade delete or cleanup job
3. **Unpublish workflow**: Validate unpublish permissions and new version creation
4. **Emergency corrections**: Test expedited approval or admin override

---

## Next Steps

1. Run all automated tests in CI/CD pipeline
2. Conduct security audit (penetration testing)
3. Perform load testing (100+ concurrent users)
4. User acceptance testing (UAT) with real policy officers
5. Documentation review (user manual, admin guide)
6. Deployment to staging environment
7. Final production deployment approval
