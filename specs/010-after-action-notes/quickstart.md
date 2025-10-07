# Quickstart: After-Action Notes

**Feature**: 010-after-action-notes
**Purpose**: Validate implementation against user acceptance scenarios
**Phase**: 1 (Design & Contracts)

## Prerequisites

### Environment Setup
```bash
# 1. Supabase local development running
supabase start

# 2. AnythingLLM container running
docker compose up anythingllm

# 3. ClamAV container running
docker compose up clamav

# 4. Frontend dev server
cd frontend && npm run dev

# 5. Test user authenticated
# Login as: test-staff@gastat.gov.sa (role: staff)
#          test-supervisor@gastat.gov.sa (role: supervisor)
```

### Test Data
```sql
-- Test dossier
INSERT INTO dossiers (id, title, dossier_type, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Q1 Planning Dossier', 'project', 'active');

-- Test user assignment (staff user assigned to dossier)
INSERT INTO dossier_owners (dossier_id, user_id) VALUES
  ('11111111-1111-1111-1111-111111111111', auth.uid()); -- Current test user

-- Test engagement
INSERT INTO engagements (id, dossier_id, title, engagement_type, engagement_date, created_by) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Q1 Kickoff Meeting', 'meeting', NOW() - INTERVAL '1 day', auth.uid());
```

---

## User Story 1: Log After-Action Record

**As a** staff member
**I want to** log outcomes from a completed engagement
**So that** decisions and commitments are documented

### Steps

1. **Navigate to engagement**
   ```
   URL: /_protected/dossiers/11111111-1111-1111-1111-111111111111/engagements/22222222-2222-2222-2222-222222222222
   Expected: Engagement details page with "Log After-Action" button
   ```

2. **Click "Log After-Action" button**
   ```
   Expected: After-action form displayed with sections:
   - Attendees (text input, comma-separated)
   - Decisions (repeatable fields)
   - Commitments (with owner assignment, due date)
   - Risks (with severity, likelihood)
   - Follow-up Actions (optional owner/date)
   - Attachments (file upload, max 10, max 100MB each)
   - Notes (textarea)
   - Confidential flag (checkbox)
   ```

3. **Fill attendees**
   ```
   Input: "John Smith, Sarah Lee, Ahmed Al-Rashid"
   Expected: 3 attendee names captured
   ```

4. **Add a decision**
   ```
   Fields:
   - Description: "Approved budget increase for Phase 2"
   - Rationale: "Additional resources needed for expanded scope"
   - Decision Maker: "Sarah Lee (Director)"
   - Decision Date: [Select yesterday's date]

   Action: Click "Add Decision"
   Expected: Decision added to list
   ```

5. **Add a commitment**
   ```
   Fields:
   - Description: "Submit revised budget proposal to finance"
   - Owner Type: Internal
   - Owner: John Smith [select from dropdown]
   - Due Date: [Select date 7 days from now]
   - Priority: High

   Action: Click "Add Commitment"
   Expected: Commitment added to list
   ```

6. **Add an external commitment**
   ```
   Fields:
   - Description: "Review legal framework updates"
   - Owner Type: External
   - External Contact Email: legal.advisor@partner.gov.sa
   - External Contact Name: Dr. Fatima Al-Mansour
   - Organization: Ministry of Justice
   - Due Date: [Select date 14 days from now]
   - Priority: Medium

   Action: Click "Add Commitment"
   Expected: External contact created/linked, commitment added
   ```

7. **Add a risk**
   ```
   Fields:
   - Description: "Delayed approval could impact Q2 deliverables"
   - Severity: High
   - Likelihood: Possible
   - Mitigation Strategy: "Prepare contingency plan by EOW"
   - Owner: "John Smith"

   Action: Click "Add Risk"
   Expected: Risk added to list
   ```

8. **Save as draft**
   ```
   Action: Click "Save Draft"
   Expected:
   - Success message: "After-action saved as draft"
   - Record status: draft
   - Redirect to after-action detail page
   ```

9. **Verify draft saved**
   ```
   Action: Navigate to dossier timeline
   Expected: After-action record appears with status badge "Draft"
   ```

### Acceptance Criteria
- ✅ Form accessible from engagement view
- ✅ All sections (attendees, decisions, commitments, risks, follow-ups, attachments) present
- ✅ Internal and external commitment owners supported
- ✅ Draft saved without publishing
- ✅ Appears on dossier timeline

---

## User Story 2: AI-Assisted Extraction

**As a** staff member
**I want to** upload meeting minutes and extract structured data
**So that** I don't have to manually transcribe decisions and action items

### Steps

1. **Open after-action form** (from draft in previous story)

2. **Upload meeting minutes (sync mode)**
   ```
   File: small-meeting-notes.txt (10KB, plain text)
   Content:
   """
   Q1 Kickoff Meeting - 2025-09-29
   Attendees: John Smith, Sarah Lee, Ahmed Al-Rashid

   Decisions:
   - Approved budget increase for Phase 2 (Sarah Lee)
   - Deferred hiring decision until Q2 budget review (Team)

   Action Items:
   - John to submit revised budget proposal by Oct 6
   - Ahmed to coordinate with external auditors by Oct 13

   Risks:
   - Delayed approval could impact Q2 deliverables (High/Possible)
   """

   Action: Click "Extract from Minutes" → Select file → Upload
   Expected:
   - Loading indicator for 2-4 seconds
   - "Extraction complete" success message
   ```

3. **Review extracted data**
   ```
   Expected:
   - Decisions section populated:
     * "Approved budget increase for Phase 2" (confidence: 0.9)
     * "Deferred hiring decision until Q2 budget review" (confidence: 0.85)
   - Commitments section populated:
     * "Submit revised budget proposal" assigned to John Smith, due Oct 6 (confidence: 0.95)
     * "Coordinate with external auditors" assigned to Ahmed, due Oct 13 (confidence: 0.9)
   - Risks section populated:
     * "Delayed approval could impact Q2 deliverables" severity:High, likelihood:Possible (confidence: 0.88)
   - Fields editable (user can modify AI suggestions)
   ```

4. **Edit low-confidence item**
   ```
   Item: "Deferred hiring decision..." (confidence: 0.85)
   Action: Edit description to add more context
   Expected: Edits saved, confidence indicator remains
   ```

5. **Upload meeting minutes (async mode)**
   ```
   File: large-meeting-transcript.pdf (2MB, scanned PDF)

   Action: Click "Extract from Minutes" → Select file → Upload
   Expected:
   - "Processing in background" notification
   - "Estimated time: 15-20 seconds" message
   - Extraction job ID displayed
   - User can continue editing form manually
   ```

6. **Receive async completion notification**
   ```
   After 18 seconds:
   Expected:
   - Browser notification: "AI extraction complete"
   - In-app notification bell badge (red dot)
   - Modal: "Extracted data ready to review. Merge into form?"
   ```

7. **Merge async results**
   ```
   Action: Click "Review & Merge"
   Expected:
   - Side-by-side view: Current form (left) | Extracted data (right)
   - For each extracted item: [Skip] [Add] [Replace] buttons
   - Merge only new items, preserve user edits
   ```

8. **Handle AI unavailable fallback**
   ```
   Scenario: AnythingLLM service down
   Action: Try to extract from file
   Expected:
   - Error message: "AI extraction unavailable. Fill form manually."
   - Form remains functional, no blocking error
   - User can proceed with manual entry
   ```

### Acceptance Criteria
- ✅ Sync extraction (<5 sec) blocks with loading indicator
- ✅ Async extraction (>5 sec) processes in background
- ✅ Extracted data includes confidence scores
- ✅ User can edit AI suggestions before saving
- ✅ Async completion triggers notification
- ✅ Merge flow prevents overwriting user edits
- ✅ Graceful fallback when AI unavailable

---

## User Story 3: Publish After-Action (Non-Confidential)

**As a** supervisor
**I want to** publish a completed after-action record
**So that** tasks and commitments become official and notifications are sent

### Steps

1. **Switch to supervisor account**
   ```
   Logout: test-staff@gastat.gov.sa
   Login: test-supervisor@gastat.gov.sa
   ```

2. **Navigate to draft after-action**
   ```
   URL: /_protected/dossiers/11111111-1111-1111-1111-111111111111/after-actions
   Expected: List of after-actions, draft from Story 1 visible
   ```

3. **Open draft for review**
   ```
   Action: Click draft after-action
   Expected: Read-only view with "Publish" button (supervisor permission)
   ```

4. **Publish after-action**
   ```
   Action: Click "Publish"
   Expected:
   - Confirmation modal: "Publish this after-action record? Tasks and commitments will be created."
   - [Cancel] [Confirm Publish] buttons
   ```

5. **Confirm publish**
   ```
   Action: Click "Confirm Publish"
   Expected:
   - Status changes: draft → published
   - Published timestamp recorded
   - Published by: test-supervisor@gastat.gov.sa
   - Success message: "After-action published successfully"
   ```

6. **Verify tasks/commitments created**
   ```
   Action: Navigate to dossier tasks tab
   Expected:
   - 2 commitments visible:
     * "Submit revised budget proposal" (John Smith, due Oct 6, status: pending)
     * "Review legal framework updates" (Dr. Fatima Al-Mansour [external], due Oct 14, status: pending)
   - Each commitment linked to after-action record (click shows origin)
   ```

7. **Verify notifications sent**
   ```
   For John Smith (internal user):
   - Check: In-app notification bell
   - Expected: "You have been assigned a commitment: Submit revised budget proposal"
   - Check: Email inbox (if email notification enabled in preferences)
   - Expected: Email with commitment details in English (user's language preference)

   For Dr. Fatima Al-Mansour (external contact):
   - Expected: Email sent to legal.advisor@partner.gov.sa with commitment details
   ```

8. **Verify record is read-only**
   ```
   Action: Try to edit published record
   Expected:
   - Edit button disabled
   - "Request Edit" button visible (for creator or supervisor)
   ```

### Acceptance Criteria
- ✅ Only supervisors/admins can publish
- ✅ Publish creates commitments automatically
- ✅ Commitments linked to parent dossier and after-action
- ✅ Internal users receive notifications per their preferences
- ✅ External contacts receive email notifications
- ✅ Published records become read-only

---

## User Story 4: Publish Confidential After-Action (Step-Up Auth)

**As a** supervisor
**I want to** publish a confidential after-action record
**So that** sensitive information is protected with additional authentication

### Steps

1. **Create confidential draft** (as staff)
   ```
   Login: test-staff@gastat.gov.sa
   Action: Create new after-action, check "Confidential" checkbox
   Content: Add decision with sensitive budget details
   Action: Save draft
   ```

2. **Attempt to publish** (as supervisor)
   ```
   Login: test-supervisor@gastat.gov.sa
   Navigate to: Confidential draft after-action
   Action: Click "Publish"
   Expected:
   - Step-up MFA modal appears
   - Message: "This record is confidential. Additional authentication required."
   - MFA challenge displayed (TOTP or SMS code input)
   ```

3. **Enter incorrect MFA code**
   ```
   Input: 000000 (invalid code)
   Action: Submit
   Expected:
   - Error: "Invalid verification code"
   - Publish action blocked
   - User can retry
   ```

4. **Enter correct MFA code**
   ```
   Input: [Valid TOTP code from authenticator app]
   Action: Submit
   Expected:
   - MFA verification success
   - Publish proceeds
   - Status: draft → published
   - Success message: "Confidential after-action published"
   ```

5. **Verify audit trail**
   ```
   Action: View after-action metadata
   Expected:
   - published_by: test-supervisor@gastat.gov.sa
   - published_at: [timestamp]
   - is_confidential: true
   - MFA verification logged in audit table
   ```

### Acceptance Criteria
- ✅ Confidential flag triggers step-up MFA on publish
- ✅ Invalid MFA code blocks publish
- ✅ Valid MFA code allows publish to proceed
- ✅ Audit trail records MFA verification

---

## User Story 5: Request and Approve Edits

**As a** staff member
**I want to** request edits to a published after-action
**So that** corrections can be made with supervisor approval

### Steps

1. **View published after-action** (as creator)
   ```
   Login: test-staff@gastat.gov.sa
   Navigate to: Published after-action from Story 3
   Expected: "Request Edit" button visible
   ```

2. **Request edit**
   ```
   Action: Click "Request Edit"
   Expected: Modal with fields:
   - Reason (textarea, required, 10-500 chars)
   - Proposed Changes (form showing current values, all editable)
   ```

3. **Fill edit request**
   ```
   Reason: "Incorrect due date for budget proposal commitment"
   Changes: Update commitment due date from Oct 6 to Oct 8
   Action: Submit
   Expected:
   - Status changes: published → edit_requested
   - edit_requested_by: test-staff@gastat.gov.sa
   - edit_requested_at: [timestamp]
   - Notification sent to supervisor
   - Success message: "Edit request submitted for approval"
   ```

4. **Supervisor reviews edit request**
   ```
   Login: test-supervisor@gastat.gov.sa
   Navigate to: After-actions with pending edits
   Expected: After-action appears with "Edit Requested" badge
   ```

5. **View edit diff**
   ```
   Action: Click "Review Edit Request"
   Expected:
   - Side-by-side diff view:
     * Left: Current version (v1)
     * Right: Proposed changes (v2 pending)
   - Changed fields highlighted in yellow
   - Reason displayed: "Incorrect due date..."
   - [Approve] [Reject] buttons
   ```

6. **Approve edit**
   ```
   Action: Click "Approve"
   Optional: Add approval notes
   Action: Confirm
   Expected:
   - Version 2 created with changes
   - Status: edit_requested → published (new version)
   - edit_approved_by: test-supervisor@gastat.gov.sa
   - edit_approved_at: [timestamp]
   - Notification sent to requester: "Your edit request was approved"
   - Version number incremented: v1 → v2
   ```

7. **View version history**
   ```
   Action: Click "Version History" button
   Expected:
   - Table showing:
     * Version 1: Original publication (Sept 29, 2025) [View]
     * Version 2: Edit approved (Sept 30, 2025) [View] [Current]
   - Can click [View] to see snapshot of each version
   ```

8. **Reject edit** (alternative flow)
   ```
   Scenario: Supervisor disagrees with proposed change
   Action: Click "Reject"
   Input: Rejection reason: "Due date change not justified, coordinate with commitment owner first"
   Action: Confirm
   Expected:
   - Status: edit_requested → published (v1 remains current)
   - edit_rejection_reason recorded
   - Notification sent to requester: "Your edit request was rejected"
   - Requester can revise and resubmit
   ```

### Acceptance Criteria
- ✅ Published records allow edit requests
- ✅ Edit request shows diff view to supervisor
- ✅ Supervisor can approve or reject with reason
- ✅ Approved edits create new version
- ✅ Version history maintained for audit
- ✅ Notifications sent to requester on approval/rejection

---

## User Story 6: Generate Bilingual PDF

**As a** staff member
**I want to** generate a bilingual summary PDF
**So that** I can distribute the after-action report to stakeholders

### Steps

1. **Open published after-action**
   ```
   Login: test-staff@gastat.gov.sa
   Navigate to: Published after-action from Story 3
   Expected: "Generate PDF" button visible
   ```

2. **Generate PDF (non-confidential)**
   ```
   Action: Click "Generate PDF"
   Modal:
   - Language options: [English] [Arabic] [Both]
   - Select: Both
   Action: Confirm
   Expected:
   - Loading indicator: "Generating PDF... (2-3 sec)"
   - Success: "PDF generated successfully"
   - Download link appears (24-hour expiry)
   ```

3. **Download and verify PDF**
   ```
   Action: Click download link
   Expected: PDF opens with:
   - Page 1: English summary (LTR layout)
     * Header: "After-Action Report"
     * Engagement: Q1 Kickoff Meeting (Sept 29, 2025)
     * Sections: Attendees, Decisions, Commitments, Risks, Follow-Ups
   - Page 2: Arabic summary (RTL layout)
     * Header: "تقرير ما بعد الإجراء"
     * Same content, translated and right-aligned
   - Footer: Generated [timestamp], Confidential: No
   ```

4. **Generate PDF for confidential record (requires step-up)**
   ```
   Navigate to: Confidential published after-action from Story 4
   Action: Click "Generate PDF"
   Expected:
   - Step-up MFA modal appears
   - Message: "This record is confidential. Additional authentication required."
   ```

5. **Complete step-up and generate**
   ```
   Input: [Valid TOTP code]
   Action: Submit
   Expected:
   - MFA verified
   - PDF generation proceeds
   - PDF includes: Confidential watermark on all pages
   ```

6. **Verify signed URL expiry**
   ```
   Action: Copy PDF download link
   Wait: 25 hours
   Action: Try to access link
   Expected: 403 Forbidden - "Link expired"
   ```

### Acceptance Criteria
- ✅ PDF generated in <3 seconds
- ✅ Both English (LTR) and Arabic (RTL) layouts correct
- ✅ Confidential records require step-up MFA before PDF generation
- ✅ PDFs include confidentiality indicator
- ✅ Download links expire after 24 hours

---

## User Story 7: External Commitment Tracking

**As a** staff member
**I want to** manually update status of commitments assigned to external contacts
**So that** I can track progress even when the owner is outside the system

### Steps

1. **View external commitment**
   ```
   Navigate to: Dossier tasks/commitments tab
   Filter: Owner type = External
   Expected: Commitment "Review legal framework updates" (Dr. Fatima Al-Mansour) visible
   ```

2. **Check tracking mode**
   ```
   Action: Click commitment to view details
   Expected:
   - Owner: Dr. Fatima Al-Mansour (legal.advisor@partner.gov.sa) [External]
   - Tracking Mode: Manual (badge)
   - Status: Pending
   - [Update Status] button visible
   ```

3. **Update status manually**
   ```
   Action: Click "Update Status"
   Modal:
   - Status dropdown: [Pending] [In Progress] [Completed] [Cancelled]
   - Notes field (optional): "Confirmed by phone on Sept 30"
   Select: In Progress
   Action: Save
   Expected:
   - Status updated: Pending → In Progress
   - Update recorded with timestamp and user
   ```

4. **Mark as completed**
   ```
   Action: Update status again after 7 days
   Select: Completed
   Action: Save
   Expected:
   - Status: In Progress → Completed
   - completed_at timestamp recorded
   - Commitment badge changes to green checkmark
   ```

5. **Compare with internal commitment**
   ```
   Navigate to: Internal commitment (John Smith)
   Expected:
   - Tracking Mode: Automatic (badge)
   - Status updates restricted to internal user only (John Smith)
   - Staff cannot manually override (system-controlled)
   ```

### Acceptance Criteria
- ✅ External commitments distinguished from internal
- ✅ Manual status updates allowed for external commitments
- ✅ Internal commitments have automatic tracking (user-controlled only)
- ✅ Audit trail records who updated status and when

---

## User Story 8: Notification Preferences

**As a** staff member
**I want to** configure my notification preferences
**So that** I only receive notifications through my preferred channels

### Steps

1. **Open user settings**
   ```
   Action: Click profile icon → Settings
   Navigate to: Notifications tab
   Expected: Notification preferences panel
   ```

2. **View default preferences**
   ```
   Expected settings:
   - Commitment Assigned:
     * In-App: ☑ On (default)
     * Email: ☑ On (default)
   - Commitment Due Soon:
     * In-App: ☑ On (default)
     * Email: ☐ Off (default)
   - Language Preference: [English ▼]
   ```

3. **Change preferences**
   ```
   Changes:
   - Commitment Assigned Email: ☑ → ☐ (turn off)
   - Commitment Due Soon In-App: ☑ → ☑ (keep on)
   - Commitment Due Soon Email: ☐ → ☑ (turn on)
   - Language Preference: English → Arabic

   Action: Save
   Expected: "Preferences saved successfully"
   ```

4. **Verify preferences applied**
   ```
   Scenario: New commitment assigned
   Expected:
   - In-app notification: ✅ Received (still on)
   - Email notification: ❌ Not sent (turned off)
   - Notification language: Arabic (changed preference)
   ```

5. **Verify due soon reminder**
   ```
   Scenario: Commitment due in 2 days (automated job)
   Expected:
   - In-app notification: ✅ Received
   - Email notification: ✅ Received (newly enabled)
   - Subject: "تذكير: التزام يقترب موعد استحقاقه" (Arabic)
   ```

### Acceptance Criteria
- ✅ Users can configure in-app and email notifications independently
- ✅ Preferences apply immediately to new notifications
- ✅ Notifications respect user's language preference
- ✅ Default preferences set on first login

---

## Edge Case Tests

### Test 1: Attachment Limit Enforcement
```
Scenario: Upload 11th attachment (exceeds limit)
Expected: Error "Maximum 10 attachments per after-action record"
```

### Test 2: Concurrent Edit Conflict
```
Scenario:
- User A opens draft v1
- User B edits and saves draft (now v2)
- User A tries to save changes
Expected: Conflict error "Record was modified by another user. Please refresh."
```

### Test 3: File Size Limit
```
Scenario: Upload 150MB attachment (exceeds 100MB limit)
Expected: Error "File size exceeds 100MB limit"
```

### Test 4: Invalid File Type
```
Scenario: Upload .exe file
Expected: Error "File type not allowed. Allowed types: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV"
```

### Test 5: Virus Detection
```
Scenario: Upload file with EICAR test signature
Expected:
- Upload succeeds
- Scan status: pending → infected
- File download blocked
- Warning displayed: "This file failed virus scan"
```

### Test 6: Permission Check (Dossier Assignment)
```
Scenario: User not assigned to dossier tries to access after-action
Expected: 403 Forbidden "You do not have access to this resource"
```

### Test 7: Staff Tries to Publish
```
Scenario: Staff user clicks "Publish" button (should not exist for staff)
Expected: Button not visible (role check)
Workaround attempt via API: 403 Forbidden "Insufficient permissions"
```

### Test 8: Low AI Confidence Handling
```
Scenario: AI extraction returns decision with confidence 0.45 (below 0.5)
Expected:
- Decision not auto-populated
- Notice: "Low confidence item not populated. Review source and add manually if correct."
```

---

## Performance Benchmarks

### Benchmark 1: API Response Times
```
Endpoint: GET /after-actions/{id}
Target: <200ms p95
Test: 100 concurrent requests
Expected: 95th percentile <200ms
```

### Benchmark 2: AI Extraction (Sync)
```
File: 50KB plain text meeting notes
Target: <5 sec
Expected: 2-4 sec average
```

### Benchmark 3: AI Extraction (Async)
```
File: 2MB scanned PDF
Target: <30 sec
Expected: 15-25 sec average
```

### Benchmark 4: PDF Generation
```
After-action: 5 decisions, 8 commitments, 3 risks
Target: <3 sec
Expected: 1.5-2.5 sec average
```

### Benchmark 5: Virus Scan
```
File: 10MB PDF
Target: <10 sec
Expected: 4-8 sec average
```

---

## Accessibility Checks

### Check 1: Keyboard Navigation
```
Test: Navigate entire after-action form using only Tab/Shift+Tab/Enter
Expected: All fields accessible, logical tab order, no keyboard traps
```

### Check 2: Screen Reader (English)
```
Tool: VoiceOver (macOS) or NVDA (Windows)
Expected: All form labels announced, error messages spoken, status changes announced
```

### Check 3: Screen Reader (Arabic)
```
Tool: VoiceOver with Arabic voice
Expected: RTL navigation correct, Arabic labels announced properly
```

### Check 4: Color Contrast
```
Tool: axe DevTools
Expected: All text passes WCAG AA (4.5:1 ratio), status badges readable
```

### Check 5: Focus Indicators
```
Test: Tab through form, verify visible focus rings
Expected: All interactive elements have visible focus indicators
```

---

## Security Validation

### Security Test 1: RLS Policy Enforcement
```
Test: Direct database query bypassing API
Expected: RLS policies block unauthorized access even at DB level
```

### Security Test 2: XSS Prevention
```
Input: <script>alert('XSS')</script> in commitment description
Expected: Script sanitized, rendered as plain text
```

### Security Test 3: SQL Injection
```
Input: '; DROP TABLE commitments;-- in search field
Expected: Input escaped, no SQL execution
```

### Security Test 4: Step-Up Auth Bypass Attempt
```
Test: POST /after-actions/{id}/publish for confidential record without MFA
Expected: 403 Forbidden "MFA verification required"
```

### Security Test 5: Attachment Download Authorization
```
Test: Request signed URL for attachment belonging to different dossier
Expected: 403 Forbidden or 404 Not Found (no information leakage)
```

---

## Conclusion

This quickstart provides:
- ✅ 8 user stories covering all critical paths
- ✅ 8 edge case tests
- ✅ 5 performance benchmarks
- ✅ 5 accessibility checks
- ✅ 5 security validations

All scenarios align with the 25 functional requirements from spec.md and support TDD implementation workflow.

**Next**: Phase 2 - Generate tasks.md (via /tasks command)