# Quickstart: Intake Entity Linking System

**Feature**: 024-intake-entity-linking
**Last Updated**: 2025-01-18
**Estimated Setup Time**: 30-45 minutes

## Overview

This quickstart guide helps you set up and test the Intake Entity Linking System locally. By the end, you'll have:
- ✅ Database schema with RLS policies
- ✅ Backend services for link operations and AI suggestions
- ✅ Frontend components for entity linking UI
- ✅ Test suite running successfully

---

## Prerequisites

Before starting, ensure you have:
- [x] Node.js 18+ LTS installed
- [x] PostgreSQL 15+ with pgvector extension (via Supabase)
- [x] Redis 7.x running locally or accessible remotely
- [x] Supabase CLI installed (`npx supabase --version`)
- [x] AnythingLLM instance running (or mock for development)

### Environment Variables

Create/update `.env` files:

**backend/.env**:
```env
# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# AnythingLLM
ANYTHINGLLM_API_URL=http://localhost:3001/api
ANYTHINGLLM_API_KEY=your_anythingllm_api_key
ANYTHINGLLM_WORKSPACE_SLUG=gastat-dossiers

# Feature Flags
AI_SUGGESTIONS_ENABLED=true
AI_TIMEOUT_MS=5000

# Rate Limiting
AI_SUGGESTIONS_RATE_LIMIT=3 # requests per minute per user
```

**frontend/.env**:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

---

## Step 1: Database Setup

### 1.1 Run Migrations

Apply the database schema for intake entity linking:

```bash
cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0

# Apply migrations in order
npx supabase db reset  # Fresh start (development only)

# Or apply specific migrations:
npx supabase db push
```

**Migrations applied**:
1. `YYYYMMDDHHMMSS_create_intake_entity_links.sql` - Main junction table
2. `YYYYMMDDHHMMSS_create_link_audit_logs.sql` - Immutable audit trail
3. `YYYYMMDDHHMMSS_create_ai_link_suggestions.sql` - AI suggestions storage
4. `YYYYMMDDHHMMSS_create_intake_embeddings.sql` - Vector embeddings for intakes
5. `YYYYMMDDHHMMSS_create_entity_embeddings.sql` - Vector embeddings for entities
6. `YYYYMMDDHHMMSS_add_intake_links_indexes.sql` - Performance indexes (including HNSW)
7. `YYYYMMDDHHMMSS_add_intake_links_rls.sql` - Security policies
8. `YYYYMMDDHHMMSS_add_intake_links_triggers.sql` - Audit logging triggers
9. `YYYYMMDDHHMMSS_add_clearance_check_function.sql` - Validation function

### 1.2 Verify Schema

```bash
# Check tables exist
npx supabase db diff

# Verify RLS policies
psql $DATABASE_URL -c "\dp intake_entity_links"

# Verify indexes
psql $DATABASE_URL -c "\d intake_entity_links"
```

Expected output: 5 tables, 8+ indexes, 3 RLS policies per table.

### 1.3 Seed Test Data (Optional)

```bash
# Seed sample intake tickets and entities
npx supabase db seed
```

---

## Step 2: Backend Services Setup

### 2.1 Install Dependencies

```bash
cd backend
npm install

# Verify new dependencies (if any were added)
npm list pgvector ioredis @supabase/supabase-js
```

### 2.2 Service Structure

The backend implements 5 core services:

**backend/src/services/**:
```
link.service.ts              # CRUD operations for entity links
ai-link-suggestion.service.ts # AnythingLLM integration + embeddings
link-audit.service.ts         # Audit log management
entity-search.service.ts      # Entity search with ranking
link-migration.service.ts     # Intake-to-position link migration
```

### 2.3 Start Backend

```bash
cd backend
npm run dev
```

Verify backend is running:
```bash
curl http://localhost:3000/health
# Expected: {"status": "ok", "services": {"redis": "connected", "supabase": "connected"}}
```

### 2.4 Test API Endpoints

Use the provided Postman/Insomnia collection or curl:

**Create a link**:
```bash
curl -X POST http://localhost:3000/api/intake/{intake_id}/links \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "dossier",
    "entity_id": "770e8400-e29b-41d4-a716-446655440000",
    "link_type": "primary",
    "notes": "Relevant dossier for this intake"
  }'
```

**Get AI suggestions**:
```bash
curl -X POST http://localhost:3000/api/intake/{intake_id}/links/suggestions \
  -H "Authorization: Bearer $SUPABASE_TOKEN"
```

---

## Step 3: Frontend Components Setup

### 3.1 Install Dependencies

```bash
cd frontend
npm install

# Verify shadcn/ui components
npx shadcn@latest list
```

### 3.2 Component Structure

**frontend/src/components/entity-links/**:
```
EntityLinkManager.tsx      # Main container (lazy loaded)
EntitySearchDialog.tsx     # Search modal with ranking
LinkCard.tsx               # Individual link display
LinkList.tsx               # Drag-and-drop list
AISuggestionsPanel.tsx     # AI suggestion cards
LinkTypeBadge.tsx          # Visual indicator (primary/related/etc.)
```

**frontend/src/hooks/**:
```
use-entity-links.ts        # TanStack Query for CRUD
use-ai-suggestions.ts      # TanStack Query for AI suggestions
use-entity-search.ts       # TanStack Query for search
use-link-reorder.ts        # Drag-and-drop state
```

### 3.3 Integration Point

The entity linking UI integrates into `IntakeDetailPage.tsx`:

```typescript
// frontend/src/pages/IntakeDetailPage.tsx
import { EntityLinkManager } from '@/components/entity-links/EntityLinkManager';

function IntakeDetailPage() {
  const { id: intakeId } = useParams();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Existing intake details */}
      <IntakeHeader intake={intake} />
      <IntakeDescription intake={intake} />

      {/* NEW: Entity Linking Section */}
      <section className="mt-6 sm:mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">
          {t('intake.linked_entities')}
        </h2>
        <EntityLinkManager intakeId={intakeId} />
      </section>
    </div>
  );
}
```

### 3.4 Start Frontend

```bash
cd frontend
npm run dev
```

Access at http://localhost:5173

**Test Responsive Design**:
- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
- Test viewports: 320px (mobile), 768px (tablet), 1280px (desktop)
- Test RTL: Change language to Arabic in settings

---

## Step 4: Running Tests

### 4.1 Backend Tests

**Contract Tests** (API endpoints):
```bash
cd backend
npm run test:contract

# Run specific test
npm run test:contract -- intake-links-api.test.ts
```

**Integration Tests** (business logic):
```bash
npm run test:integration

# Run specific suite
npm run test:integration -- link-migration.test.ts
```

**Performance Tests** (k6):
```bash
npm run test:performance

# Run specific test
k6 run tests/performance/batch-operations.k6.js
```

Expected performance:
- Batch create 50 links: <500ms ✅
- Reverse lookup 1000+ intakes: <2s ✅
- AI suggestions: <3s ✅

### 4.2 Frontend Tests

**Component Tests** (Vitest):
```bash
cd frontend
npm run test

# Run specific test
npm run test -- EntityLinkManager.test.tsx
```

**E2E Tests** (Playwright):
```bash
npm run test:e2e

# Run specific user story
npx playwright test manual-linking.spec.ts
```

**Accessibility Tests**:
```bash
npm run test:a11y

# Run specific test
npx playwright test entity-search.a11y.test.ts
```

### 4.3 Verify Test Coverage

```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

Target coverage: >80% for new code.

---

## Step 5: Key Workflows

### 5.1 Manual Linking Workflow (User Story 1)

1. Navigate to intake detail page
2. Click "Link Entity" button
3. Search for entity (e.g., "Saudi Arabia")
4. Results ranked by AI confidence + recency + alphabetical
5. Select entity from dropdown
6. Choose link type (primary/related/requested/mentioned)
7. Add optional notes
8. Click "Create Link"
9. Link appears immediately (optimistic update)
10. Audit log entry created automatically

**Performance**: <30 seconds end-to-end ✅

### 5.2 AI Suggestions Workflow (User Story 2)

1. Navigate to intake detail page with unlinked entities
2. Click "Get AI Suggestions" button
3. Loading state: "Analyzing intake..." (~2-3s)
4. AI suggestions panel appears with 3-5 cards
5. Each card shows:
   - Entity name + type badge
   - Confidence score (0.70-0.99)
   - Reasoning text
   - "Accept" / "Reject" buttons
6. Click "Accept" on relevant suggestions
7. Links created with source='ai', confidence score preserved
8. Rejected suggestions logged for model improvement

**Performance**: <3 seconds for suggestions ✅

**Graceful degradation**: If AI service unavailable, show banner:
> "AI suggestions are temporarily unavailable. You can still create links manually."

### 5.3 Link Migration Workflow (User Story 3)

1. Triage officer creates 3 links on intake:
   - 1 primary (dossier)
   - 1 related (organization)
   - 1 requested (position)
2. Steward converts intake to position document
3. Backend automatically calls `migrate_intake_links_to_position()`
4. All 3 links copied to `position_entity_links` table
5. Link types mapped appropriately
6. Audit logs record migration with details JSON
7. Transaction ensures atomicity (all-or-nothing)

**Success rate**: 100% (SC-008) ✅

---

## Step 6: Debugging & Troubleshooting

### Common Issues

**Issue**: AI suggestions timing out
**Solution**: Check AnythingLLM service, increase `AI_TIMEOUT_MS` in .env

**Issue**: "Entity not found" error
**Solution**: Verify entity exists in target table and is not archived

**Issue**: "Primary link already exists"
**Solution**: Delete existing primary link first, or change to different link type

**Issue**: Slow reverse lookup queries
**Solution**: Check indexes exist: `\d intake_entity_links`, verify ANALYZE has run

**Issue**: RLS policy blocking queries
**Solution**: Verify user's organization membership and clearance level

### Logs

**Backend logs**:
```bash
tail -f backend/logs/app.log | grep "entity-links"
```

**Redis cache inspection**:
```bash
redis-cli
> KEYS entity_search:*
> GET entity_metadata:dossier:770e8400-e29b-41d4-a716-446655440000
```

**Audit logs query**:
```sql
SELECT * FROM link_audit_logs
WHERE intake_id = 'your_intake_id'
ORDER BY timestamp DESC
LIMIT 20;
```

---

## Step 7: Performance Verification

### 7.1 Benchmark Batch Operations

```bash
cd backend
npm run benchmark:batch-links

# Expected output:
# Creating 50 links... 450ms ✅
# Creating 100 links... 920ms ✅
```

### 7.2 Benchmark Reverse Lookup

```bash
npm run benchmark:reverse-lookup

# Expected output:
# 100 intakes: 180ms ✅
# 1,000 intakes: 1,850ms ✅
# 10,000 intakes: 4,200ms ⚠️ (degrades beyond target scale)
```

### 7.3 Benchmark AI Suggestions

```bash
npm run benchmark:ai-suggestions

# Expected output:
# Simple intake (50 words): 2,100ms ✅
# Complex intake (200 words): 2,800ms ✅
# Large intake (500 words): 3,500ms ⚠️ (slightly over target)
```

---

## Step 8: Mobile Responsive Testing

### 8.1 Test Mobile-First Styles

```bash
cd frontend
npm run dev
```

**Manual testing checklist**:
- [ ] EntitySearchDialog fits 320px viewport
- [ ] Touch targets minimum 44x44px
- [ ] Link cards stack vertically on mobile
- [ ] Drag-and-drop works with touch gestures
- [ ] AI suggestions panel scrolls horizontally on mobile
- [ ] Typography scales: base → sm: → md: → lg:

### 8.2 Test RTL Arabic Support

1. Change language to Arabic in settings
2. Verify:
   - [ ] EntitySearchDialog text aligns right
   - [ ] Link cards flip layout (icon on right)
   - [ ] Chevrons rotate 180 degrees
   - [ ] Padding uses logical properties (ps-*, pe-*)
   - [ ] Drag handle works in RTL direction

---

## Step 9: Security Verification

### 9.1 Test Clearance Enforcement

1. Login as user with clearance level 1 (restricted)
2. Attempt to link to classified entity (level 2+)
3. Verify: Error "Insufficient clearance" + specific required level
4. Verify: Entity filtered from search results
5. Verify: Entity excluded from AI suggestions

### 9.2 Test Organization Boundaries

1. Login as user in Organization A
2. Attempt to link intake from Organization B
3. Verify: Error "Forbidden" + organization mismatch message
4. Verify: Intake not visible in intake list
5. Verify: Audit log records failed attempt

### 9.3 Test RLS Policies

```sql
-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user_uuid';

-- Should return only links for user's organization
SELECT * FROM intake_entity_links
WHERE intake_id = 'test_intake_id';

-- Should fail (UPDATE not allowed for other users' links)
UPDATE intake_entity_links
SET notes = 'Hacked!'
WHERE linked_by != 'user_uuid';
```

---

## Step 10: Production Readiness Checklist

Before deploying to staging/production:

### Database
- [ ] All migrations applied successfully
- [ ] RLS policies enabled on all tables
- [ ] Indexes created (verify with `\d` commands)
- [ ] Triggers active (verify with `\dy`)
- [ ] Audit logs table is immutable (UPDATE/DELETE revoked)

### Backend
- [ ] Environment variables configured (no hardcoded secrets)
- [ ] Redis connection tested
- [ ] AnythingLLM service accessible
- [ ] Error handling includes graceful degradation
- [ ] Rate limiting configured for AI endpoint
- [ ] Logging configured (Winston with appropriate levels)

### Frontend
- [ ] Mobile-first responsive design verified
- [ ] RTL Arabic support tested
- [ ] Accessibility (WCAG AA) verified with axe-playwright
- [ ] Performance targets met (Lighthouse score >90)
- [ ] Error boundaries implemented
- [ ] Loading states for async operations

### Testing
- [ ] Contract tests pass (9 API endpoints)
- [ ] Integration tests pass (migration, AI, bulk ops)
- [ ] E2E tests pass (5 user stories)
- [ ] Accessibility tests pass
- [ ] Performance benchmarks meet targets
- [ ] Test coverage >80%

### Documentation
- [ ] API contract (OpenAPI spec) up to date
- [ ] Data model documented
- [ ] Architecture decision records created
- [ ] User-facing documentation written

---

## Next Steps

After completing this quickstart:

1. **Phase 2: Task Generation** - Run `/speckit.tasks` to generate actionable implementation tasks
2. **Implementation** - Follow tasks.md in dependency order
3. **Code Review** - Submit PR with test evidence and screenshots
4. **Staging Deployment** - Deploy to staging environment for QA
5. **Production Rollout** - Deploy to production with monitoring

---

## Support

**Issues**: https://github.com/GASTAT/intl-dossierv2/issues
**Documentation**: specs/024-intake-entity-linking/
**Team Contact**: dev@stats.gov.sa

---

**Last Updated**: 2025-01-18
**Maintainer**: GASTAT Development Team
