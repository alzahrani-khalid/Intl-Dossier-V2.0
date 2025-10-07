# Research: Positions & Talking Points Lifecycle

**Feature**: 011-positions-talking-points
**Date**: 2025-10-01
**Status**: Phase 0 Complete

## Overview

This document captures architectural decisions, technology choices, and implementation patterns for the Positions & Talking Points Lifecycle feature.

---

## 1. Approval Chain State Management

### Decision
Use PostgreSQL JSONB column for flexible approval chain configuration combined with dedicated `approvals` table for tracking approval actions.

### Rationale
- **Flexibility**: 1-10 configurable stages per position type requires dynamic chain structure
- **Auditability**: Separate `approvals` table provides immutable audit trail
- **Performance**: JSONB indexed queries for chain state lookups
- **RLS Integration**: Row-level security on approvals table enforces permissions

### Alternatives Considered
- **Separate chain configuration table**: Rejected due to complexity of managing variable-length chains and JOIN overhead
- **Hardcoded workflow states**: Rejected as insufficient for 1-10 variable stages requirement
- **External workflow engine**: Rejected due to data sovereignty and complexity constraints

### Implementation Pattern
```typescript
// Position table
interface Position {
  id: uuid;
  approval_chain_config: {
    stages: Array<{
      order: number;
      role: string;
      approver_group_id: uuid;
    }>;
  };
  current_stage: number;
  status: 'draft' | 'under_review' | 'approved' | 'published';
}

// Approvals table
interface Approval {
  id: uuid;
  position_id: uuid;
  stage: number;
  approver_id: uuid;
  action: 'approve' | 'request_revisions' | 'delegate' | 'reassign';
  delegated_from?: uuid;
  reassigned_by?: uuid;
  comments: string;
  step_up_verified: boolean;
  created_at: timestamp;
}
```

---

## 2. Version Comparison & Diffing

### Decision
Use `diff-match-patch` library for text diffing with custom bilingual diff rendering component.

### Rationale
- **Proven library**: Google's diff-match-patch is battle-tested and performant
- **Bilingual support**: Can diff EN and AR content separately with side-by-side display
- **Granular control**: Character-level, word-level, or line-level diff modes
- **Accessibility**: Custom renderer allows ARIA annotations for screen readers

### Alternatives Considered
- **Server-side diffing**: Rejected to reduce Edge Function complexity and improve client-side responsiveness
- **Git-style patches**: Rejected as too technical for policy officer audience
- **Simple equality check**: Rejected as insufficient for user needs (FR-020)

### Implementation Pattern
```typescript
import DiffMatchPatch from 'diff-match-patch';

interface VersionDiff {
  english: DiffResult[];
  arabic: DiffResult[];
  metadata_changes: MetadataChange[];
}

// Bilingual side-by-side diff component
<VersionComparison
  leftVersion={previousVersion}
  rightVersion={currentVersion}
  language={currentLanguage}
  highlightAdditions={true}
  highlightDeletions={true}
/>
```

---

## 3. Step-Up Authentication for Approvals

### Decision
Use Supabase Auth with custom step-up challenge via Edge Function before approval actions.

### Rationale
- **Security**: FR-012 mandates step-up MFA for approval sign-offs
- **Native integration**: Leverages existing Supabase Auth infrastructure
- **Session management**: Short-lived elevated session tokens (5-10 minutes)
- **Audit trail**: Step-up challenges logged in approvals table

### Alternatives Considered
- **Re-authentication**: Rejected as too disruptive (forces full re-login)
- **TOTP-only**: Rejected as insufficient; need device-based verification
- **External IdP**: Rejected due to data sovereignty requirements

### Implementation Pattern
```typescript
// Edge Function: initiate-step-up
POST /auth-verify-step-up
Request: { action: 'approve', position_id: uuid }
Response: {
  challenge_id: uuid,
  challenge_type: 'totp' | 'sms' | 'push',
  expires_at: timestamp
}

// Edge Function: complete-step-up
POST /auth-verify-step-up/complete
Request: {
  challenge_id: uuid,
  verification_code: string,
  position_id: uuid,
  approval_action: ApprovalAction
}
Response: {
  elevated_token: string,
  valid_until: timestamp
}
```

---

## 4. Audience Group Access Control (RLS)

### Decision
Implement audience group-based RLS policies using junction table `position_audience_groups` with PostgreSQL RLS functions.

### Rationale
- **Granular control**: FR-026/027 require per-position audience selection
- **RLS enforcement**: Database-level enforcement prevents data leakage
- **Performance**: Indexed junction table for efficient group membership checks
- **Flexibility**: Supports multiple audience groups per position

### Alternatives Considered
- **App-level filtering**: Rejected due to security risk (bypass possible)
- **View-based permissions**: Rejected as insufficient for INSERT/UPDATE operations
- **Role-based only**: Rejected as too coarse-grained for audience groups

### Implementation Pattern
```sql
-- RLS policy for published positions
CREATE POLICY "Users can view positions for their audience groups"
ON positions FOR SELECT
USING (
  status = 'published' AND
  EXISTS (
    SELECT 1 FROM position_audience_groups pag
    INNER JOIN user_audience_memberships uam
      ON pag.audience_group_id = uam.audience_group_id
    WHERE pag.position_id = positions.id
      AND uam.user_id = auth.uid()
  )
);
```

---

## 5. AI Consistency Checking Integration

### Decision
Integrate with AnythingLLM via REST API with pgvector embeddings for semantic similarity + rule-based contradiction detection.

### Rationale
- **Hybrid approach**: Combines AI semantic understanding with deterministic rule checking
- **Self-hosted**: AnythingLLM deployed locally satisfies data sovereignty (Constitution #4)
- **Fallback mechanism**: Graceful degradation to rule-based checks if AI unavailable (FR-048)
- **Performance**: Async processing for auto-checks, synchronous for manual triggers

### Alternatives Considered
- **AI-only**: Rejected due to inconsistency risk and compliance requirements
- **Rule-based only**: Rejected as insufficient for nuanced consistency (FR-029)
- **External AI service**: Rejected due to data sovereignty constraints

### Implementation Pattern
```typescript
// Edge Function: consistency-check
interface ConsistencyCheckRequest {
  position_id: uuid;
  trigger: 'manual' | 'automatic';
}

interface ConsistencyCheckResponse {
  consistency_score: number; // 0-100
  conflicts: Array<{
    conflict_position_id: uuid;
    conflict_type: 'contradiction' | 'ambiguity' | 'overlap';
    severity: 'high' | 'medium' | 'low';
    suggested_resolution: string;
    affected_sections: string[];
  }>;
  ai_available: boolean;
  check_timestamp: timestamp;
}

// Fallback logic
if (!aiService.isAvailable()) {
  return ruleBasedConsistencyCheck(position);
}
return hybridConsistencyCheck(position, aiService);
```

---

## 6. 7-Year Data Retention

### Decision
Use PostgreSQL partitioning by creation year + automated archive job for expired versions.

### Rationale
- **Compliance**: FR-022/023 mandate 7-year retention for regulatory compliance
- **Performance**: Partitioning improves query performance on active data
- **Automation**: Scheduled Edge Function for archive/deletion
- **Audit trail**: Deletion actions logged before permanent removal

### Alternatives Considered
- **Manual deletion**: Rejected due to error risk and compliance burden
- **S3 cold storage**: Rejected due to added complexity and data sovereignty
- **Soft delete only**: Rejected due to storage costs over 7+ years

### Implementation Pattern
```sql
-- Partition by creation year
CREATE TABLE position_versions (
  id uuid PRIMARY KEY,
  position_id uuid NOT NULL,
  content jsonb NOT NULL,
  created_at timestamp NOT NULL,
  -- other fields
) PARTITION BY RANGE (created_at);

-- Create partitions for each year
CREATE TABLE position_versions_2025 PARTITION OF position_versions
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Edge Function: scheduled cron job
-- DELETE FROM position_versions
-- WHERE created_at < NOW() - INTERVAL '7 years';
```

---

## 7. Bilingual Side-by-Side Editing

### Decision
Use controlled component pattern with synchronized scroll + TipTap editor for rich text.

### Rationale
- **Real-time sync**: Ensures EN/AR content stays in sync during editing
- **Rich text support**: TipTap provides structure (headings, lists, citations)
- **RTL support**: Native RTL handling for Arabic content
- **Accessibility**: Keyboard navigation, screen reader labels

### Alternatives Considered
- **Separate edit modes**: Rejected as disruptive to workflow
- **Plain textarea**: Rejected due to lack of rich text support for citations (FR-037)
- **Third-party editor**: Rejected due to licensing and customization constraints

### Implementation Pattern
```typescript
interface BilingualEditorProps {
  englishContent: string;
  arabicContent: string;
  onChange: (lang: 'en' | 'ar', content: string) => void;
  syncScroll: boolean;
}

<div className="grid grid-cols-2 gap-4">
  <TipTapEditor
    content={englishContent}
    onChange={(content) => onChange('en', content)}
    direction="ltr"
    aria-label="English content"
  />
  <TipTapEditor
    content={arabicContent}
    onChange={(content) => onChange('ar', content)}
    direction="rtl"
    aria-label="المحتوى العربي"
  />
</div>
```

---

## 8. Delegation & Reassignment Mechanism

### Decision
Implement delegation via temporary permission grants + reassignment via admin-only RLS policy.

### Rationale
- **Flexibility**: Supports both self-service delegation and admin intervention
- **Auditability**: Full trail of delegation/reassignment in approvals table
- **Security**: Delegation limited to specific position/time window
- **Reversibility**: Original approver can revoke delegation

### Alternatives Considered
- **Role substitution**: Rejected as too broad (affects all positions)
- **Approval forwarding**: Rejected as it breaks audit trail continuity
- **Auto-escalation**: Considered but rejected in favor of explicit actions (clarified in spec)

### Implementation Pattern
```typescript
// Delegation
interface DelegationRequest {
  position_id: uuid;
  delegate_to: uuid;
  valid_until: timestamp;
  reason?: string;
}

// Reassignment (admin-only)
interface ReassignmentRequest {
  approval_id: uuid;
  reassign_to: uuid;
  reason: string; // Required for admin actions
}

// RLS policy
CREATE POLICY "Admins can reassign approvals"
ON approvals FOR UPDATE
USING (
  auth.jwt() ->> 'role' = 'admin' AND
  action IN ('reassign')
);
```

---

## 9. Performance Optimization Strategies

### Decision
Implement aggressive caching + optimistic updates + pagination for lists.

### Rationale
- **Target**: <200ms API response (p95), <3s time-to-interactive
- **User experience**: Optimistic updates provide instant feedback
- **Scale**: Support 100+ concurrent users, ~1000 positions/year
- **Network resilience**: Cached data enables offline viewing

### Implementation Pattern
```typescript
// TanStack Query with aggressive caching
const positionsQuery = useQuery({
  queryKey: ['positions', filters],
  queryFn: () => fetchPositions(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
});

// Optimistic update for approvals
const approveMutation = useMutation({
  mutationFn: approvePosition,
  onMutate: async (newApproval) => {
    await queryClient.cancelQueries(['position', newApproval.position_id]);
    const previousPosition = queryClient.getQueryData(['position', newApproval.position_id]);
    queryClient.setQueryData(['position', newApproval.position_id], (old) => ({
      ...old,
      status: 'approved',
    }));
    return { previousPosition };
  },
  onError: (err, newApproval, context) => {
    queryClient.setQueryData(['position', newApproval.position_id], context.previousPosition);
  },
});

// Pagination for lists
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['positions', 'list'],
  queryFn: ({ pageParam = 0 }) => fetchPositions({ offset: pageParam, limit: 20 }),
  getNextPageParam: (lastPage, pages) => lastPage.nextOffset,
});
```

---

## 10. Testing Strategy

### Decision
Contract-first TDD + Playwright E2E for critical approval flows.

### Rationale
- **Contract tests**: Ensure Edge Function API stability (one test per endpoint)
- **Integration tests**: Validate business logic with database interactions
- **E2E tests**: Cover approval workflow, delegation, version comparison
- **Accessibility tests**: Automated WCAG 2.1 Level AA checks in both languages

### Implementation Pattern
```typescript
// Contract test example
describe('POST /positions/:id/approve', () => {
  it('should require step-up authentication', async () => {
    const response = await fetch(`/positions/${positionId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('step_up_required');
  });

  it('should succeed with elevated token', async () => {
    const elevatedToken = await performStepUp();
    const response = await fetch(`/positions/${positionId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${elevatedToken}` },
      body: JSON.stringify({ comments: 'Approved' }),
    });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('approved');
  });
});
```

---

## Summary of Key Decisions

| Area | Decision | Risk Mitigation |
|------|----------|----------------|
| Approval State | JSONB config + approvals table | Database constraints + RLS policies |
| Diffing | diff-match-patch + custom renderer | Bilingual testing + accessibility audit |
| Step-Up Auth | Supabase Auth + Edge Function | Short-lived tokens + audit logging |
| Access Control | RLS with junction table | Database-level enforcement + testing |
| AI Integration | AnythingLLM + pgvector + fallback | Graceful degradation + rule-based backup |
| Retention | PostgreSQL partitioning + cron | Audit trail + manual verification |
| Bilingual Editing | TipTap + synchronized scroll | RTL testing + screen reader validation |
| Delegation | Permission grants + admin reassign | Full audit trail + revocation mechanism |
| Performance | Caching + optimistic updates + pagination | Load testing + monitoring |
| Testing | Contract-first TDD + E2E | 80%+ coverage + CI/CD integration |

---

## Open Questions / Risks

1. **Concurrent editing**: Spec identifies this edge case but doesn't specify handling. **Recommendation**: Implement optimistic locking with version field in position table.

2. **Orphaned attachments**: Edge case not fully specified. **Recommendation**: Cascade delete on position deletion OR implement soft delete + periodic cleanup job.

3. **Unpublish conditions**: FR-033 marked as needs clarification. **Recommendation**: Default to "publisher or admin can unpublish; creates new draft version for edits."

4. **Emergency corrections**: Edge case for post-publication errors not specified. **Recommendation**: Treat as new version + expedited approval OR admin override with justification.

---

## Next Steps (Phase 1)

1. Generate data model with all entities and relationships
2. Create OpenAPI contracts for 15+ Edge Functions
3. Generate contract tests for each endpoint
4. Create quickstart guide for approval workflow validation
5. Update CLAUDE.md with new context
