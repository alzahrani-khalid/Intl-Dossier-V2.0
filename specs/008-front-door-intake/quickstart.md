# Quickstart: Front Door Intake

**Feature**: 008-front-door-intake | **Generated**: 2025-01-29

## Overview

The Front Door Intake system provides a unified entry point for support requests with AI-powered triage, duplicate detection, and SLA management. This guide walks through the primary user workflows.

## Prerequisites

- User account with appropriate permissions
- Access to the Front Door application
- For supervisors: Triage and assignment permissions

## Primary Workflows

### 1. Submit a Support Request (Staff Member)

```typescript
// Step 1: Navigate to Front Door
Navigate to: /intake/new

// Step 2: Select request type
Select one of:
- Engagement Support
- Position Development
- MoU/Action Items
- Foresight Request

// Step 3: Complete bilingual form
Fill in:
- Title (EN/AR)
- Description (EN/AR)
- Type-specific fields (2-3 per type)
- Urgency level
- Link existing dossier OR propose new

// Step 4: Attach documents (optional)
Upload files:
- Max 25MB per file
- Max 100MB total per ticket
- Supported formats: PDF, DOCX, XLSX, images

// Step 5: Review SLA preview
System displays:
- Acknowledgment target (e.g., 30 min for high priority)
- Resolution target (e.g., 8 hours)

// Step 6: Submit ticket
Click "Submit Request"
→ Receive ticket number (e.g., TKT-2025-001234)
→ View in "My Requests" with SLA countdown
```

### 2. Triage and Assign Tickets (Supervisor)

```typescript
// Step 1: Access intake queue
Navigate to: /intake/queue

// Step 2: Review new tickets
Filter by:
- Status: "submitted"
- Sort by: Priority/Created Date

// Step 3: Open ticket for triage
Click ticket to view:
- Full details
- AI suggestions (loads within 2 seconds)
- Duplicate candidates (if score ≥ 0.80)

// Step 4: Review AI triage suggestions
System suggests:
- Request type classification
- Sensitivity level
- Urgency rating
- Recommended assignee/unit
- Confidence scores for each

// Step 5: Accept or override
Option A - Accept suggestions:
Click "Accept AI Triage"
→ All suggestions applied

Option B - Override:
Click "Override"
→ Select new values
→ Provide reason (required)
→ Submit override

// Step 6: Assign ticket
Select:
- Assignee (user)
- Unit/queue
Click "Assign"
→ Ticket moves to "assigned" status
→ Assignee notified
```

### 3. Handle Duplicate Tickets

```typescript
// Step 1: Review duplicate alert
When viewing ticket with duplicates:
- See banner: "Potential duplicates detected"
- View list with confidence scores

// Step 2: Compare tickets
For each candidate:
- Overall similarity score (0-1)
- Title similarity
- Content similarity
- Side-by-side comparison view

// Step 3: Make decision
For high confidence (≥ 0.80):
Option A - Confirm duplicate:
- Click "Merge Tickets"
- Select primary ticket
- Provide merge reason
→ Secondary ticket marked as "merged"
→ History preserved

Option B - Not duplicate:
- Click "Not a Duplicate"
→ Candidate dismissed
→ AI learns from feedback
```

### 4. Convert Ticket to Working Artifact

```typescript
// Step 1: Verify ticket ready
Ensure:
- Status is "triaged" or "assigned"
- All required information present

// Step 2: Initiate conversion
Click "Convert to Artifact"
Select target type:
- Engagement
- Position
- MoU Action
- Foresight Item

// Step 3: Handle security check (if needed)
For confidential+ tickets:
- System prompts for MFA
- Enter verification code
→ Action logged in audit trail

// Step 4: Map additional data
Fill any additional fields required by target type
→ System pre-populates from ticket

// Step 5: Confirm conversion
Click "Convert"
→ New artifact created
→ Ticket status: "converted"
→ Bidirectional link established
→ Success banner with artifact link
```

### 5. Monitor SLA Status

```typescript
// Queue view indicators:
- Green badge: On track
- Yellow badge: <25% time remaining
- Red badge: Breached

// Ticket detail view:
- Acknowledgment countdown
- Resolution countdown
- Visual progress bars
- Time remaining in hours:minutes

// Notifications:
- 25% remaining warning
- 10% remaining alert
- Breach notification
```

## AI Service Degradation Handling

When AI services are unavailable:

1. **Visual Indicators**:
   - Banner: "AI temporarily unavailable"
   - Suggestions marked with "Cached" badge
   - Timestamp of last successful AI operation

2. **Fallback Behavior**:
   - Cached suggestions shown (if < 24h old)
   - Manual triage required
   - Keyword-based duplicate search available
   - Basic rule-based priority assignment

3. **Background Recovery**:
   - System retries every 5 minutes
   - Queue of pending AI operations
   - Automatic processing when service restored

## Testing Checklist

### Acceptance Test 1: Submit Request
- [ ] Navigate to Front Door page
- [ ] Select "Engagement Support" type
- [ ] Fill title in English and Arabic
- [ ] Add description (>100 characters)
- [ ] Link to existing dossier
- [ ] Upload a 5MB PDF attachment
- [ ] Verify SLA preview shows
- [ ] Submit form
- [ ] Verify ticket number received
- [ ] Check ticket appears in "My Requests"
- [ ] Verify SLA countdown active

### Acceptance Test 2: AI Triage
- [ ] Open queue as supervisor
- [ ] Select new submitted ticket
- [ ] Wait for AI suggestions (≤ 2 seconds)
- [ ] Verify all suggestions present
- [ ] Click "Accept AI Triage"
- [ ] Verify values applied to ticket
- [ ] Check audit log entry created

### Acceptance Test 3: Duplicate Detection
- [ ] Create two similar tickets
- [ ] Open second ticket
- [ ] Verify duplicate alert shows
- [ ] Check confidence score ≥ 0.80 highlighted
- [ ] Open comparison view
- [ ] Select "Merge Tickets"
- [ ] Choose primary ticket
- [ ] Verify merge completed
- [ ] Check secondary ticket status = "merged"

### Acceptance Test 4: Secure Conversion
- [ ] Select confidential ticket
- [ ] Click "Convert to Artifact"
- [ ] Select "Position" as target
- [ ] Verify MFA prompt appears
- [ ] Enter verification code
- [ ] Complete conversion
- [ ] Verify artifact created
- [ ] Check backlink to ticket
- [ ] Verify audit log with MFA flag

### Acceptance Test 5: AI Degradation
- [ ] Simulate AI service failure
- [ ] Verify banner appears
- [ ] Check cached suggestions show "stale" badge
- [ ] Attempt new triage
- [ ] Verify fallback to manual mode
- [ ] Restore AI service
- [ ] Verify normal operation resumes

## Performance Validation

### Target Metrics
- Front Door page load: ≤ 2.0s (3G Fast)
- AI suggestions render: ≤ 2.0s
- Queue interaction response: ≤ 200ms
- API p95 latency: ≤ 400ms

### Load Test Scenario
1. Generate 100 concurrent users
2. Each submits 3 tickets/minute
3. Measure response times
4. Verify all SLAs tracked correctly
5. Check no data loss or corruption

## Security Verification

- [ ] Unauthenticated access blocked
- [ ] Rate limiting enforced (300 req/min)
- [ ] Field-level redaction for sensitive data
- [ ] MFA required for confidential operations
- [ ] Audit trail complete
- [ ] File upload size limits enforced
- [ ] SQL injection prevention verified
- [ ] XSS protection active

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing (>80% coverage)
- [ ] Bilingual content reviewed
- [ ] Accessibility audit passed
- [ ] Performance targets met
- [ ] Security scan completed

### Database Setup
```sql
-- Run migrations in order
migrate:up 001_create_intake_tables
migrate:up 002_create_indexes
migrate:up 003_enable_rls
migrate:up 004_create_policies
migrate:up 005_seed_sla_policies
```

### Environment Variables
```env
# Required
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
ANYTHINGLLM_API_URL=http://...
ANYTHINGLLM_API_KEY=...

# AI Configuration
EMBEDDING_MODEL=bge-m3
SIMILARITY_PRIMARY=0.82
SIMILARITY_CANDIDATE=0.65

# SLA Configuration
HIGH_PRIORITY_ACK_MINUTES=30
HIGH_PRIORITY_RESOLVE_MINUTES=480

# Storage Limits
MAX_FILE_SIZE_MB=25
MAX_TOTAL_SIZE_MB=100

# Rate Limits
USER_RATE_LIMIT=300
ANON_RATE_LIMIT=60
```

### Post-deployment
- [ ] Health check passing (/intake/health)
- [ ] AI health check passing (/intake/ai/health)
- [ ] Create test ticket through UI
- [ ] Verify queue updates in real-time
- [ ] Test SLA countdown accuracy
- [ ] Confirm audit logging active

## Troubleshooting

### Common Issues

**Issue**: AI suggestions not loading
- Check AI health endpoint
- Verify AnythingLLM container running
- Check network connectivity
- Review error logs for model loading issues

**Issue**: Duplicate detection not working
- Verify pgvector extension enabled
- Check embedding generation logs
- Confirm similarity thresholds configured
- Test vector index performance

**Issue**: SLA timers incorrect
- Verify database timezone settings
- Check business hours configuration
- Review SLA policy rules
- Confirm Realtime subscriptions active

**Issue**: File upload failing
- Check file size limits
- Verify Supabase Storage bucket permissions
- Review CORS configuration
- Test virus scanning webhook

## Support

For issues or questions:
- Technical documentation: `/specs/008-front-door-intake/`
- API documentation: `/contracts/api-spec.yaml`
- Data model: `/data-model.md`
- System logs: Supabase Dashboard > Logs