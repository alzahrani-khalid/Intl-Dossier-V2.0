# Research: After-Action Notes

**Feature**: After-Action Notes System
**Date**: 2025-09-30
**Phase**: Phase 0 - Technical Research

## Overview

This document consolidates research findings for technical decisions deferred from specification phase and establishes implementation patterns for the After-Action Notes system.

## Deferred Technical Decisions

### 1. PDF Generation Library

**Requirements**:
- Bilingual support (Arabic RTL + English LTR)
- Server-side rendering (no browser dependency)
- Professional formatting
- <10 sec generation time

**Options Evaluated**:

| Library | RTL Support | Server-Side | Performance | Verdict |
|---------|-------------|-------------|-------------|---------|
| @react-pdf/renderer | ✅ Excellent | ✅ Node.js | ⚡ Fast (~2 sec) | **SELECTED** |
| Puppeteer | ⚠️ CSS-based | ✅ Headless Chrome | 🐌 Slow (~8 sec) | Rejected |
| jsPDF | ❌ Poor RTL | ✅ Node.js | ⚡ Very fast | Rejected |
| PDFKit | ❌ Manual RTL | ✅ Node.js | ⚡ Fast | Rejected |

**Decision**: **@react-pdf/renderer v3.x**

**Rationale**:
- Native RTL support via `direction` prop
- Component-based approach (matches React frontend)
- Server-side rendering without browser overhead
- Fast performance (~2-5 sec for typical report)
- Active maintenance and TypeScript support
- Font registration for Arabic (Noto Sans Arabic)

**Implementation Pattern**:
```typescript
import { Document, Page, Text, View, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Noto Sans Arabic',
  src: '/fonts/NotoSansArabic-Regular.ttf'
});

const BilingualPDF = ({ data, language }: Props) => (
  <Document>
    <Page>
      <View style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
        <Text style={{ fontFamily: language === 'ar' ? 'Noto Sans Arabic' : 'Helvetica' }}>
          {data.title}
        </Text>
      </View>
    </Page>
  </Document>
);
```

**Alternatives Rejected**:
- Puppeteer: Too slow, browser dependency violates simplicity
- jsPDF: Poor RTL support, manual layout
- PDFKit: Low-level API, complex RTL implementation

---

### 2. AI Extraction Strategy

**Requirements**:
- Extract decisions, commitments, risks from meeting minutes
- Confidence scoring (0.0-1.0)
- Support Arabic and English
- Hybrid sync/async (5 sec threshold)
- Fallback to manual entry

**Existing Infrastructure**: AnythingLLM (self-hosted) deployed

**Decision**: **AnythingLLM with structured prompt templates + confidence scoring**

**Prompt Engineering Pattern**:
```
System: Extract structured information from meeting notes as JSON.

Output format:
{
  "decisions": [{"description": string, "decision_maker": string, "confidence": 0-1}],
  "commitments": [{"description": string, "owner": string, "due_date": "YYYY-MM-DD", "confidence": 0-1}],
  "risks": [{"description": string, "severity": "low|medium|high", "confidence": 0-1}]
}

Examples:
Input: "Team decided to use PostgreSQL. John will research alternatives by Friday."
Output: {
  "decisions": [{"description": "Use PostgreSQL", "decision_maker": "Team", "confidence": 0.9}],
  "commitments": [{"description": "Research database alternatives", "owner": "John", "due_date": "2025-10-06", "confidence": 0.95}]
}

Input: [Meeting minutes]
Output: [JSON]
```

**Confidence Thresholds**:
- High (≥0.8): Auto-populate, user can edit
- Medium (0.5-0.79): Show as suggestion with warning
- Low (<0.5): Don't populate, show "low confidence"

**Fallback Strategy**:
1. AnythingLLM unavailable → "AI extraction unavailable, fill manually"
2. Low confidence → Partial extraction with warnings
3. Timeout (>30 sec) → Cancel, fallback to manual

**Rationale**:
- Leverages existing infrastructure (no new dependencies)
- Few-shot prompting improves accuracy
- Confidence scoring enables graceful degradation
- Structured JSON easy to parse/validate
- Fallback ensures feature works without AI

---

### 3. Email Notification Service

**Requirements**:
- Send commitment notifications to external contacts
- Bilingual templates (Arabic/English)
- Self-hosted SMTP
- Delivery tracking
- No external cloud dependencies

**Decision**: **Supabase Edge Function + Nodemailer + Handlebars templates**

**Architecture**:
```
User Action → Edge Function → Nodemailer → SMTP Server → External Email
                     ↓
           Delivery log (audit)
```

**SMTP Configuration** (environment variables):
```bash
SMTP_HOST=smtp.gastat.gov.sa
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=noreply@gastat.gov.sa
SMTP_PASS=[encrypted]
```

**Template Structure**:
```handlebars
<!-- en/commitment-notification.hbs -->
<html>
<body dir="ltr">
  <h1>New Commitment Assigned</h1>
  <p>Dear {{recipientName}},</p>
  <p>You have been assigned a commitment from {{dossierTitle}}:</p>
  <blockquote>{{commitmentDescription}}</blockquote>
  <p><strong>Due Date:</strong> {{dueDate}}</p>
  <p><a href="{{linkToAfterAction}}">View Details</a></p>
</body>
</html>

<!-- ar/commitment-notification.hbs -->
<html>
<body dir="rtl">
  <h1>تم تعيين التزام جديد</h1>
  <p>عزيزي {{recipientName}}،</p>
  <p>تم تعيين التزام لك من {{dossierTitle}}:</p>
  <blockquote>{{commitmentDescription}}</blockquote>
  <p><strong>تاريخ الاستحقاق:</strong> {{dueDate}}</p>
  <p><a href="{{linkToAfterAction}}">عرض التفاصيل</a></p>
</body>
</html>
```

**Rationale**:
- Nodemailer: Mature, widely adopted Node.js library
- Handlebars: Separates content from logic, maintainable
- Edge Functions: Serverless execution, scales automatically
- Self-hosted SMTP: Meets data sovereignty requirement
- Delivery log: Provides audit trail

**Alternatives Rejected**:
- SendGrid/Mailgun: External services, violates data sovereignty
- Direct SMTP from frontend: Security risk (credentials exposure)
- Queue-based (BullMQ): Adds complexity, premature optimization

---

### 4. Version Control Pattern

**Requirements**:
- Track all changes to published after-action records (FR-019)
- Visual diff for supervisors
- Complete history for audit
- Support approval workflow

**Decision**: **Full snapshot versioning with JSONB storage**

**Schema**:
```sql
CREATE TABLE after_action_versions (
  id UUID PRIMARY KEY,
  after_action_id UUID NOT NULL REFERENCES after_actions(id),
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL, -- Full record snapshot
  change_summary TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(after_action_id, version_number)
);
```

**Versioning Strategy**:
1. Initial publication → Insert version 1
2. Edit approved → Insert version N+1
3. Current version → Max version_number
4. Diff generation → Client-side compare using `deep-diff`

**Diff Library**: `deep-diff` (npm)
```typescript
import * as diff from 'deep-diff';

const changes = diff(versionN, versionN1);
// Returns: [{kind: 'E', path: ['field'], lhs: old, rhs: new}]
```

**UI Pattern**: Side-by-side diff view
- Left: Previous version (read-only)
- Right: New version
- Highlight: Green (additions), Red (deletions), Yellow (modifications)

**Rationale**:
- Full snapshots: Complete audit trail, no reconstruction
- JSONB: Efficient in PostgreSQL, supports indexing
- Version number: Simple ordering
- Client-side diff: Reduces server load
- Scales to 100+ versions without performance issues

**Alternatives Rejected**:
- Delta storage: Complex reconstruction, potential data loss
- Event sourcing: Overkill, requires event replay infrastructure
- Third-party service: External dependency, data sovereignty concern

---

## Integration Patterns

### Data Flow: AI Extraction (Hybrid Sync/Async)

```
User uploads minutes
       ↓
Estimate processing time (heuristic)
       ↓
    <5 sec?
   ╱       ╲
 YES        NO
  ↓          ↓
Sync       Async
(loading)  (background)
  ↓          ↓
Extract    Extract
  ↓          ↓
Populate   Store + Notify
  ↓          ↓
User       User refreshes
reviews    and sees data
```

**Estimation Heuristic**:
```typescript
function estimateProcessingTime(fileSize: number, language: string): number {
  const baseTime = fileSize / (1024 * 100); // 100KB/sec baseline
  const langMultiplier = language === 'ar' ? 1.3 : 1.0; // Arabic slower
  return baseTime * langMultiplier;
}

const isSync = estimateProcessingTime(file.size, lang) < 5;
```

### Data Flow: Hybrid Permission Check

```
User action → RLS Policy
       ↓
Check 1: Role
   ╱        ╲
Staff      Supervisor/Admin
  ↓            ↓
Drafts    All operations
  ↓            ↓
Check 2: Dossier Assignment
   ╱           ╲
Assigned    Not assigned
  ↓              ↓
ALLOW          DENY
```

**RLS Policy Pattern**:
```sql
CREATE POLICY "hybrid_access" ON after_actions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dossier_owners
    WHERE dossier_id = after_actions.dossier_id
    AND user_id = auth.uid()
  )
  AND
  CASE
    WHEN auth.jwt()->>'role' = 'admin' THEN true
    WHEN auth.jwt()->>'role' = 'supervisor' THEN true
    WHEN auth.jwt()->>'role' = 'staff'
      AND after_actions.publication_status = 'draft' THEN true
    ELSE false
  END
);
```

---

## Performance Optimization

### Critical Indexes
```sql
-- Dossier lookups (most frequent)
CREATE INDEX idx_after_actions_dossier_id ON after_actions(dossier_id);

-- Status filtering
CREATE INDEX idx_after_actions_status ON after_actions(publication_status);

-- User assignments
CREATE INDEX idx_commitments_assigned_to_user ON commitments(assigned_to_user);

-- Permission checks (composite)
CREATE INDEX idx_dossier_owners_composite ON dossier_owners(user_id, dossier_id);
```

### Query Optimization
```sql
-- AVOID N+1
-- BAD: SELECT * FROM after_actions; then loop SELECT * FROM decisions;

-- GOOD: Single query with JSON aggregation
SELECT aa.*, json_agg(d.*) as decisions
FROM after_actions aa
LEFT JOIN decisions d ON d.after_action_id = aa.id
WHERE aa.dossier_id = $1
GROUP BY aa.id;
```

---

## Security Considerations

### Input Validation
- **Client-side**: File type/size, form validation (immediate feedback)
- **Server-side**: Re-validate all inputs, sanitize text (XSS prevention), virus scan (ClamAV), rate limit (10 req/min/user)

### Step-Up Authentication
Trigger conditions (FR-011):
- Publishing confidential after-action
- Generating PDF for confidential record
- Approving edit to confidential record

Implementation:
```typescript
const { data, error } = await supabase.auth.mfa.challenge({
  factorId: user.factors[0].id
});

if (error) throw new Error('Step-up MFA required');
```

---

## Testing Strategy

- **Unit**: Model validation, business logic, utility functions
- **Contract**: API schemas (11 endpoints)
- **Integration**: Full workflows (create → extract → publish → edit)
- **E2E**: User journeys (Playwright)
- **Performance**: AI latency (<5 sec sync, <30 sec async), PDF generation (<10 sec)
- **A11y**: Keyboard navigation, screen readers, WCAG AA

---

## Deployment Configuration

### Environment Variables
```bash
# Supabase
SUPABASE_URL=https://gastat-dossier.supabase.co
SUPABASE_ANON_KEY=[encrypted]

# AnythingLLM
ANYTHINGLLM_API_URL=http://anythingllm:3001
ANYTHINGLLM_API_KEY=[encrypted]

# SMTP
SMTP_HOST=smtp.gastat.gov.sa
SMTP_PORT=587
SMTP_USER=noreply@gastat.gov.sa
SMTP_PASS=[encrypted]

# Constraints
MAX_FILE_SIZE=104857600  # 100MB
MAX_FILES_PER_RECORD=10
AI_SYNC_THRESHOLD=5      # seconds
```

### Docker Services
```yaml
services:
  anythingllm:
    image: mintplexlabs/anythingllm:latest
    volumes:
      - anythingllm-data:/app/server/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s

  clamav:
    image: clamav/clamav:latest
    volumes:
      - clamav-data:/var/lib/clamav
    healthcheck:
      test: ["CMD", "clamdscan", "--ping", "1"]
      interval: 60s
```

---

## Conclusion

All deferred technical decisions resolved:

1. ✅ **PDF Generation**: @react-pdf/renderer with bilingual RTL/LTR support
2. ✅ **AI Extraction**: AnythingLLM with confidence scoring and fallbacks
3. ✅ **Email Notifications**: Nodemailer + Handlebars bilingual templates
4. ✅ **Version Control**: Full snapshot versioning with JSON diff

**Next Phase**: Phase 1 - Design & Contracts (data model, API specs, test scenarios)
