# After-Action Notes - Deployment Guide

**Feature**: 010-after-action-notes
**Status**: ✅ Implementation Complete - Ready for Deployment
**Date**: 2025-10-01

---

## Overview

This guide provides step-by-step instructions to deploy the After-Action Notes feature to the Supabase "Intl-Dossier" project (ID: zkrcjzdemdmwhearhfgg).

**Deployment Status**:

- ✅ Database migrations already applied (20250930100 through 20250930114)
- ✅ 2 of 15 Edge Functions already deployed (engagements, after-actions-create)
- ⏳ 13 Edge Functions pending deployment
- ⏳ Environment variables need configuration

---

## Prerequisites

### 1. Supabase CLI Setup

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Verify access to project
supabase projects list | grep "Intl-Dossier"
```

### 2. Project Reference

Set the project reference environment variable:

```bash
export SUPABASE_PROJECT_REF=zkrcjzdemdmwhearhfgg
```

---

## Deployment Steps

### Step 1: Verify Database Migrations ✅

All 15 After-Action Notes migrations are already applied:

```sql
-- Already Applied Migrations:
-- 20250930100_create_engagements_table.sql
-- 20250930101_create_after_action_records_table.sql
-- 20250930102_create_external_contacts_table.sql
-- 20250930103_create_decisions_table.sql
-- 20250930104_create_commitments_table.sql
-- 20250930105_create_risks_table.sql
-- 20250930106_create_follow_up_actions_table.sql
-- 20250930107_create_attachments_table.sql
-- 20250930108_create_after_action_versions_table.sql
-- 20250930109_create_user_notification_preferences_table.sql
-- 20250930110_create_notifications_table.sql
-- 20250930111_create_indexes.sql
-- 20250930112_enable_rls.sql
-- 20250930113_create_rls_policies.sql
-- 20250930114_create_database_functions.sql
```

**Verification**: Run this to confirm all migrations are applied:

```bash
cd /path/to/Intl-DossierV2.0
supabase migration list --project-ref zkrcjzdemdmwhearhfgg
```

---

### Step 2: Configure Environment Variables

Navigate to **Supabase Dashboard → Project Settings → Edge Functions → Secrets** and add:

#### Required Environment Variables:

```bash
# AnythingLLM Configuration
ANYTHINGLLM_API_URL=https://your-anythingllm-instance.com/api
ANYTHINGLLM_API_KEY=your-api-key-here

# SMTP Configuration for Notifications
SMTP_HOST=smtp.gmail.com                    # or your SMTP server
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=your-smtp-password

# Optional: Override default constraints
MAX_FILE_SIZE=104857600                     # 100MB in bytes
MAX_FILES_PER_RECORD=10
AI_SYNC_THRESHOLD=5                         # seconds
```

#### Verification:

Go to Supabase Dashboard and verify all secrets are set under:
**Project Settings → Edge Functions → Secrets**

---

### Step 3: Deploy Edge Functions

#### Option A: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
cd /path/to/Intl-DossierV2.0

# Make script executable
chmod +x supabase/deploy-functions.sh

# Set project reference
export SUPABASE_PROJECT_REF=zkrcjzdemdmwhearhfgg

# Run deployment
./supabase/deploy-functions.sh
```

The script will:

1. ✅ Check prerequisites (Supabase CLI installed and logged in)
2. ✅ Validate environment variables
3. ✅ Deploy all 15 Edge Functions
4. ✅ Run health checks on deployed functions
5. ✅ Provide deployment summary

---

#### Option B: Manual Deployment

If the automated script fails, deploy functions individually:

```bash
cd /path/to/Intl-DossierV2.0/supabase/functions

# Deploy remaining 13 functions (2 already deployed):
supabase functions deploy after-actions-get --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy after-actions-update --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy after-actions-publish --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy after-actions-request-edit --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy after-actions-approve-edit --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy after-actions-reject-edit --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy after-actions-versions --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy after-actions-list --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy ai-extract --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy ai-extract-status --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy pdf-generate --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy attachments --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy commitments-update-status --project-ref zkrcjzdemdmwhearhfgg
```

---

### Step 4: Verify Deployments

#### Check Function Status:

```bash
# List all deployed functions
supabase functions list --project-ref zkrcjzdemdmwhearhfgg

# Expected output should show all 15 functions with version numbers
```

#### Test Health Endpoints:

```bash
# Test a simple GET endpoint
curl https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/after-actions-list

# Expected: 401 Unauthorized (requires auth header) - this confirms function is running
```

---

### Step 5: Download Noto Sans Arabic Font

For bilingual PDF generation to work, download the Arabic font:

1. Go to: https://fonts.google.com/noto/specimen/Noto+Sans+Arabic
2. Download `NotoSansArabic-Regular.ttf`
3. Place it in: `frontend/public/fonts/NotoSansArabic-Regular.ttf`

**Alternative**: Download from GitHub releases:

```bash
cd frontend/public/fonts
wget https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v28.003/NotoSansArabic-v28.003.zip
unzip NotoSansArabic-v28.003.zip
mv NotoSansArabic-Regular.ttf ./
rm NotoSansArabic-v28.003.zip
```

---

### Step 6: Deploy Frontend

Build and deploy the frontend application:

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to your hosting platform (e.g., Vercel, Netlify)
# Or serve locally for testing:
npm run preview
```

---

### Step 7: Configure ClamAV (Virus Scanning)

Start the ClamAV service using Docker Compose:

```bash
cd /path/to/Intl-DossierV2.0

# Start ClamAV service
docker-compose up -d clamav

# Verify ClamAV is running
docker-compose ps clamav

# Update virus definitions
docker-compose exec clamav freshclam
```

**ClamAV Configuration** (already in docker-compose.yml):

```yaml
clamav:
  image: clamav/clamav:latest
  ports:
    - '3310:3310'
  volumes:
    - clamav_data:/var/lib/clamav
  environment:
    - CLAMAV_NO_FRESHCLAM=false
```

---

## Post-Deployment Verification

### 1. Run Test Suites

Execute all test suites to verify the deployment:

```bash
# Backend contract tests
cd backend
npm test

# Frontend E2E tests (requires deployed Edge Functions)
cd frontend
npm run test:e2e

# Performance tests
cd backend
npm run test:performance

# Accessibility tests
cd frontend
npm run test:a11y
```

---

### 2. Manual Testing Checklist

Follow the user stories in `specs/010-after-action-notes/quickstart.md`:

- [ ] **User Story 1**: Log after-action record
  - Create engagement → Log after-action → Fill all sections → Save draft

- [ ] **User Story 2**: AI-assisted extraction
  - Upload meeting notes → AI extracts data → Review and merge → Save

- [ ] **User Story 3**: Publish non-confidential record
  - Open draft → Click "Publish" → Verify status = "published"

- [ ] **User Story 4**: Publish confidential record with step-up MFA
  - Mark record as confidential → Click "Publish" → Enter MFA code → Verify published

- [ ] **User Story 5**: Request and approve/reject edit
  - Open published record → Request edit → Supervisor approves/rejects → Verify status

- [ ] **User Story 6**: Generate bilingual PDF
  - Open published record → Click "Generate PDF" → Select language → Download PDF

- [ ] **User Story 7**: External commitment tracking
  - Create external commitment → Manually update status → Verify updates

- [ ] **User Story 8**: Configure notification preferences
  - Open preferences → Toggle in-app/email → Select language → Save

---

### 3. Edge Case Verification

Test all edge cases from `specs/010-after-action-notes/quickstart.md`:

- [ ] **Attachment limit**: Verify max 10 attachments enforced
- [ ] **File size limit**: Verify 100MB max enforced
- [ ] **Invalid file type**: Verify MIME type validation
- [ ] **Virus detection**: Upload EICAR test file, verify rejection
- [ ] **Permission (dossier assignment)**: User without dossier access sees 403
- [ ] **Permission (staff publish)**: Staff role cannot publish, button hidden
- [ ] **Low confidence AI**: Items <0.5 confidence not auto-populated
- [ ] **Concurrent edit conflict**: Two users edit same record, second gets version mismatch error

---

## Monitoring & Logging

### View Function Logs:

```bash
# View logs for specific function
supabase functions logs after-actions-create --project-ref zkrcjzdemdmwhearhfgg

# Stream logs in real-time
supabase functions logs after-actions-create --project-ref zkrcjzdemdmwhearhfgg --follow
```

### Monitor Performance:

1. Go to **Supabase Dashboard → Functions**
2. Click on each function to view:
   - Invocation count
   - Response times
   - Error rate
   - Memory usage

---

## Rollback Plan

If issues arise after deployment:

### Rollback Edge Functions:

```bash
# Deploy previous version of a function
supabase functions deploy <function-name> --project-ref zkrcjzdemdmwhearhfgg --no-verify-jwt
```

### Rollback Database (if needed):

```bash
# Revert last migration
supabase migration down --project-ref zkrcjzdemdmwhearhfgg

# Revert specific migration
supabase migration down 20250930114 --project-ref zkrcjzdemdmwhearhfgg
```

---

## Troubleshooting

### Issue: Function deployment fails with "Module not found"

**Cause**: Missing shared dependencies (cors.ts, etc.)

**Solution**: Ensure `_shared` directory is included:

```bash
# Verify _shared directory exists
ls supabase/functions/_shared/

# Deploy with verbose output
supabase functions deploy <function-name> --project-ref zkrcjzdemdmwhearhfgg --debug
```

---

### Issue: AI extraction returns 500 error

**Cause**: AnythingLLM not configured or unreachable

**Solution**:

1. Verify AnythingLLM is running: `curl $ANYTHINGLLM_API_URL/health`
2. Verify environment variables in Supabase Dashboard
3. Check function logs: `supabase functions logs ai-extract --project-ref zkrcjzdemdmwhearhfgg`

---

### Issue: PDF generation fails

**Cause**: Missing Noto Sans Arabic font

**Solution**:

1. Download font from https://fonts.google.com/noto/specimen/Noto+Sans+Arabic
2. Place in `frontend/public/fonts/NotoSansArabic-Regular.ttf`
3. Rebuild frontend: `npm run build`

---

### Issue: Virus scanning not working

**Cause**: ClamAV service not running or virus definitions outdated

**Solution**:

```bash
# Restart ClamAV
docker-compose restart clamav

# Update virus definitions
docker-compose exec clamav freshclam

# Verify ClamAV is listening
curl http://localhost:3310
```

---

## Summary

### Completed:

- ✅ All 101 implementation tasks complete
- ✅ 45 tests created (contract, integration, edge case, performance, accessibility)
- ✅ Database migrations applied (15 migrations)
- ✅ 2 Edge Functions deployed (engagements, after-actions-create)
- ✅ Deployment scripts and documentation created

### Pending:

- ⏳ Deploy remaining 13 Edge Functions
- ⏳ Configure environment variables in Supabase Dashboard
- ⏳ Download Noto Sans Arabic font
- ⏳ Start ClamAV service
- ⏳ Run test suites to verify deployment
- ⏳ Execute manual testing checklist

---

## Next Steps

1. **Execute Step 2**: Configure all environment variables in Supabase Dashboard
2. **Execute Step 3**: Run deployment script `./supabase/deploy-functions.sh`
3. **Execute Step 5**: Download Noto Sans Arabic font
4. **Execute Step 7**: Start ClamAV service
5. **Execute Post-Deployment Verification**: Run all test suites

---

**For Questions or Issues**:

- Review logs: `supabase functions logs <function-name> --project-ref zkrcjzdemdmwhearhfgg`
- Check implementation docs: `specs/010-after-action-notes/`
- Refer to completion summary: `AFTER_ACTION_IMPLEMENTATION_COMPLETE.md`

---

_Generated with [Claude Code](https://claude.com/claude-code)_
_Date: 2025-10-01_
