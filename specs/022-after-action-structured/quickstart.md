# Quickstart Guide: After-Action Structured Documentation

**Feature**: After-Action Structured Documentation  
**Date**: 2025-01-14  
**Audience**: Developers implementing this feature

## Prerequisites

- Node.js 18+ LTS installed
- Supabase CLI installed (`npm install -g supabase`)
- Supabase project access (Staging: `zkrcjzdemdmwhearhfgg`)
- Git repository cloned
- Development environment variables configured

## Quick Start (5 minutes)

### 1. Database Setup

Apply migrations to create tables:

```bash
# Navigate to project root
cd /path/to/Intl-DossierV2.0

# Apply migrations using Supabase MCP (recommended)
# The migrations will create:
# - external_contacts table
# - after_action_records table
# - decisions, commitments, risks, follow_up_actions, attachments, version_snapshots tables
# - RLS policies
# - Indexes and triggers

# Or manually via Supabase CLI
supabase db push
```

### 2. Install Dependencies

```bash
# Backend dependencies (if not already installed)
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# Mobile dependencies
cd ../mobile
npm install
```

### 3. Environment Variables

Create `.env.local` files:

**backend/.env.local**:
```env
ANYTHINGLLLM_API_URL=http://localhost:3001/api
ANYTHINGLLLM_API_KEY=your_api_key_here
SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://localhost:6379
```

**frontend/.env.local**:
```env
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**mobile/.env**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend (Supabase Edge Functions local)
cd backend
supabase functions serve

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Mobile
cd mobile
npx expo start
```

### 5. Verify Setup

Open browser to `http://localhost:5173` (frontend) and verify:
- You can log in with test credentials (kazahrani@stats.gov.sa / itisme)
- Navigate to a dossier
- See "Log After-Action" button on engagement detail page

## Development Workflow

### Step 1: Implement Database Schema

**Files to create**:
```
supabase/migrations/
├── 20250114120000_create_external_contacts.sql
├── 20250114120100_create_after_action_records.sql
├── 20250114120200_create_decisions.sql
├── 20250114120300_create_commitments.sql
├── 20250114120400_create_risks.sql
├── 20250114120500_create_follow_up_actions.sql
├── 20250114120600_create_attachments.sql
├── 20250114120700_create_version_snapshots.sql
└── 20250114120800_add_after_action_rls_policies.sql
```

**Apply migrations**:
```bash
supabase db push
```

**Generate TypeScript types**:
```bash
# Use Supabase MCP to generate types
# Types will be generated in frontend/src/types/database.types.ts
```

### Step 2: Implement Backend APIs

**Create Edge Functions**:
```
backend/src/api/
├── after-action/
│   ├── create.ts
│   ├── update.ts
│   ├── publish.ts
│   ├── request-edit.ts
│   ├── approve-edit.ts
│   ├── list.ts
│   └── get.ts
├── ai-extraction/
│   ├── extract-sync.ts
│   ├── extract-async.ts
│   └── extraction-status.ts
├── pdf-generation/
│   ├── generate-bilingual.ts
│   └── download-pdf.ts
└── external-contacts/
    ├── create.ts
    ├── search.ts
    └── update-commitment.ts
```

**Implement services**:
```
backend/src/services/
├── ai-extraction.service.ts
├── pdf-generation.service.ts
├── task-creation.service.ts
└── notification.service.ts
```

**Test Edge Functions locally**:
```bash
# Test create endpoint
curl -X POST http://localhost:54321/functions/v1/after-action/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-data/create-after-action.json
```

### Step 3: Implement Frontend Web UI

**Create components**:
```
frontend/src/components/after-action/
├── AfterActionForm.tsx          # Multi-step form
├── DecisionList.tsx             # Manage decisions
├── CommitmentList.tsx           # Manage commitments
├── RiskList.tsx                 # Manage risks
├── AttachmentUpload.tsx         # File upload
├── AIExtractionStatus.tsx       # AI progress indicator
├── PDFPreview.tsx               # PDF preview
├── EditRequestDialog.tsx        # Request edit modal
└── EditApprovalDialog.tsx       # Supervisor approval modal
```

**Create pages**:
```
frontend/src/pages/after-action/
├── AfterActionCreatePage.tsx    # Create new
├── AfterActionEditPage.tsx      # Edit draft
├── AfterActionViewPage.tsx      # View published
└── AfterActionListPage.tsx      # List for dossier
```

**Create hooks** (TanStack Query):
```
frontend/src/hooks/
├── use-after-action.ts          # CRUD operations
├── use-ai-extraction.ts         # AI extraction
└── use-pdf-generation.ts        # PDF generation
```

**Test in browser**:
1. Navigate to dossier detail page
2. Click "Log After-Action" button
3. Fill form with test data
4. Save draft
5. Publish and verify tasks created

### Step 4: Implement Mobile App

**Create WatermelonDB schema**:
```
mobile/src/database/schema/
├── after-action-record.ts
├── decision.ts
├── commitment.ts
└── attachment-queue.ts
```

**Create screens**:
```
mobile/src/screens/AfterAction/
├── AfterActionCreateScreen.tsx
├── AfterActionEditScreen.tsx
├── AfterActionViewScreen.tsx
└── AfterActionListScreen.tsx
```

**Create components**:
```
mobile/src/components/AfterAction/
├── DecisionInput.tsx
├── CommitmentInput.tsx
├── DocumentPicker.tsx
└── SyncStatusBadge.tsx
```

**Implement sync service**:
```
mobile/src/services/
├── sync.service.ts              # WatermelonDB ↔ Supabase sync
└── offline-queue.service.ts     # Queue offline operations
```

**Test on device/simulator**:
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

Test offline functionality:
1. Create after-action while offline
2. Toggle airplane mode on device
3. Create/edit records
4. Re-enable network
5. Verify sync completes successfully

### Step 5: Write Tests

**Contract tests** (backend):
```
backend/tests/contract/
├── after-action-api.test.ts
├── ai-extraction-api.test.ts
└── pdf-generation-api.test.ts
```

**Integration tests** (backend):
```
backend/tests/integration/
├── ai-extraction-workflow.test.ts
├── task-creation.test.ts
└── edit-approval-workflow.test.ts
```

**Component tests** (frontend):
```
frontend/tests/component/
├── AfterActionForm.test.tsx
├── CommitmentList.test.tsx
└── AIExtractionStatus.test.tsx
```

**E2E tests** (frontend):
```
frontend/tests/e2e/
├── after-action-create.spec.ts
├── after-action-publish.spec.ts
├── ai-extraction.spec.ts
└── edit-approval.spec.ts
```

**Run tests**:
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
npm run test:e2e

# Mobile
cd mobile
npm test
```

## Common Tasks

### Create Migration

```bash
# Use Supabase MCP to apply migration
# Or manually:
supabase migration new create_after_action_records

# Edit migration file in supabase/migrations/
# Apply migration
supabase db push
```

### Deploy Edge Function

```bash
# Deploy single function
supabase functions deploy after-action-create

# Deploy all functions
supabase functions deploy
```

### Generate TypeScript Types

```bash
# Use Supabase MCP
# Or manually:
supabase gen types typescript --local > frontend/src/types/database.types.ts
```

### Test AI Extraction Locally

```bash
# Start AnythingLLM (if self-hosted)
docker run -d -p 3001:3001 anythingllm/anythingllm

# Test extraction
curl -X POST http://localhost:54321/functions/v1/ai-extraction/extract-sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/meeting-minutes.pdf",
    "document_type": "pdf",
    "language": "en"
  }'
```

### Test PDF Generation

```bash
# Generate bilingual PDFs
curl -X POST http://localhost:54321/functions/v1/pdf-generation/generate-bilingual/UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "include_attachments_list": true,
    "include_confidential_sections": false
  }'
```

### Debug Mobile Sync

```bash
# Enable WatermelonDB logging
# In mobile/src/database/index.ts:
import { Database } from '@nozbe/watermelondb'
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId'

// Enable debug mode
database.adapter.setLocal('debug', 'true')

# View logs in Expo dev tools
npx expo start
# Press 'j' to open debugger
# Check console for WatermelonDB logs
```

### Reset Local Database

```bash
# Reset Supabase local database
supabase db reset

# Reapply all migrations
supabase db push

# Reseed data (if seed file exists)
supabase db seed
```

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**:
```bash
# Check existing tables
supabase db diff

# Drop conflicting table
supabase db reset

# Reapply migrations
supabase db push
```

### Issue: RLS policies block queries

**Solution**:
```sql
-- Temporarily disable RLS for debugging (DO NOT use in production)
ALTER TABLE after_action_records DISABLE ROW LEVEL SECURITY;

-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'after_action_records';

-- Re-enable RLS after fixing
ALTER TABLE after_action_records ENABLE ROW LEVEL SECURITY;
```

### Issue: AI extraction returns low confidence scores

**Solution**:
- Check AnythingLLM is running: `curl http://localhost:3001/api/health`
- Verify API key is correct in `.env.local`
- Test with simpler document first (plain text, English only)
- Check AnythingLLM logs for errors

### Issue: PDF generation fails for Arabic content

**Solution**:
- Verify Noto Sans Arabic font is installed: `ls backend/assets/fonts/`
- Check font file permissions: `chmod 644 backend/assets/fonts/*`
- Test with English-only PDF first to isolate issue
- Enable debug logging in `pdf-generation.service.ts`

### Issue: Mobile sync conflicts not resolving

**Solution**:
```typescript
// Check _version column in local database
const record = await database.get('after_action_records').find(id)
console.log('Local version:', record._version)

// Check server version
const { data } = await supabase
  .from('after_action_records')
  .select('_version')
  .eq('id', id)
  .single()
console.log('Server version:', data._version)

// Force re-sync
await syncService.forceFullSync()
```

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Review tasks.md for step-by-step implementation guide
3. Start with foundation tasks (database schema, types)
4. Proceed to User Story 1 tasks (Quick After-Action Creation)
5. Test each user story independently before moving to next

## Resources

- **Spec**: `specs/022-after-action-structured/spec.md`
- **Plan**: `specs/022-after-action-structured/plan.md`
- **Data Model**: `specs/022-after-action-structured/data-model.md`
- **API Contracts**: `specs/022-after-action-structured/contracts/`
- **Supabase Docs**: https://supabase.com/docs
- **WatermelonDB Docs**: https://nozbe.github.io/WatermelonDB/
- **React Native Paper**: https://callstack.github.io/react-native-paper/

## Support

- **Questions**: Ask in #intl-dossier Slack channel
- **Issues**: Create GitHub issue with `after-action` label
- **Constitution**: `.specify/memory/constitution.md`
- **Project Guidelines**: `CLAUDE.md`

---

**Implementation Status**: Ready for Phase 2 (Tasks Generation)  
**Estimated Timeline**: 6-8 weeks for full implementation (web + mobile + tests)
