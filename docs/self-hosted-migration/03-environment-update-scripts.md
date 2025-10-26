# Environment Update Scripts Guide

## Overview

This guide covers updating all environment variables and API URLs across your codebase to point to the self-hosted Supabase instance.

**Duration**: 0.5 days
**Files Affected**: 261 files with Supabase references
**Automated**: Yes (95% automated)

## Table of Contents

- [Current State Analysis](#current-state-analysis)
- [Update Strategy](#update-strategy)
- [Automated Updates](#automated-updates)
- [Manual Updates](#manual-updates)
- [Environment Files](#environment-files)
- [Validation](#validation)
- [Git Workflow](#git-workflow)

## Current State Analysis

### Supabase References Inventory

Your codebase contains **979 references** to Supabase across **261 files**:

**By Component**:
- Frontend: ~120 files
- Backend: ~80 files
- Mobile: ~40 files
- Edge Functions: ~15 files
- Tests: ~6 files

**Reference Types**:
1. Environment variable declarations
2. Supabase client initialization
3. API endpoint calls
4. Test configurations
5. Documentation

### What Needs to Change

| Current (Cloud) | New (Self-Hosted) |
|----------------|-------------------|
| `https://zkrcjzdemdmwhearhfgg.supabase.co` | `https://supabase.yourdomain.com` |
| `wss://zkrcjzdemdmwhearhfgg.supabase.co` | `wss://supabase.yourdomain.com` |
| Supabase Cloud anon key | Self-hosted anon key |
| Supabase Cloud service role key | Self-hosted service role key |

### What Stays the Same

✅ All application logic
✅ Database queries and operations
✅ Component structure
✅ API call patterns
✅ Authentication flows
✅ RLS policies

## Update Strategy

### Three-Phase Approach

1. **Environment Variables**: Update all `.env` files
2. **Automated Search & Replace**: Update code references
3. **Manual Review**: Edge cases and hardcoded values

### Safety Measures

- Create feature branch: `migration/self-hosted-env-updates`
- Run automated script with dry-run first
- Manual review of all changes before commit
- Keep backup of original files
- Test locally before deploying

## Automated Updates

### Using the Update Script

The automated script is located at `scripts/update-env-vars.sh`.

#### Step 1: Prepare

```bash
# Navigate to project root
cd /path/to/Intl-DossierV2.0

# Make script executable
chmod +x docs/self-hosted-migration/scripts/update-env-vars.sh

# Create backup
git checkout -b migration/self-hosted-env-updates
git add .
git commit -m "backup: pre-migration state"
```

#### Step 2: Configure Script

Edit `scripts/update-env-vars.sh` with your values:

```bash
# Your self-hosted domain
NEW_SUPABASE_URL="https://supabase.yourdomain.com"

# Your self-hosted keys (from Supabase setup)
NEW_ANON_KEY="your-new-anon-key"
NEW_SERVICE_ROLE_KEY="your-new-service-role-key"

# Old values to replace (from Supabase Cloud)
OLD_PROJECT_REF="zkrcjzdemdmwhearhfgg"
OLD_REGION="supabase.co"
```

#### Step 3: Dry Run

```bash
# Run in dry-run mode to preview changes
./docs/self-hosted-migration/scripts/update-env-vars.sh --dry-run

# Review output
# Expected: List of files to be updated with preview of changes
```

#### Step 4: Execute Updates

```bash
# Run actual updates
./docs/self-hosted-migration/scripts/update-env-vars.sh

# Review changes
git status
git diff

# Review specific files
git diff frontend/.env.example
git diff backend/.env.example
git diff mobile/app.config.js
```

### Script Breakdown

The script performs these operations:

#### 1. Environment Files Update

Updates all environment configuration files:

```bash
# Files updated:
- .env.example
- frontend/.env.example
- frontend/.env.local
- backend/.env.example
- backend/.env.local
- mobile/.env.example
- mobile/app.config.js
- supabase/.env
```

#### 2. Supabase Client Initialization

Updates client initialization in:

```bash
# Frontend
- frontend/src/lib/supabase.ts
- frontend/src/services/*.ts

# Backend
- backend/src/lib/supabase.ts
- backend/src/services/*.ts

# Mobile
- mobile/src/lib/supabase.ts
- mobile/src/services/*.ts
```

#### 3. Test Configurations

Updates test files:

```bash
- backend/tests/helpers/*.ts
- frontend/tests/setup.ts
- mobile/__tests__/setup.ts
```

#### 4. Documentation

Updates documentation references:

```bash
- README.md
- CLAUDE.md
- docs/**/*.md
```

## Manual Updates

Some files require manual review and updates:

### 1. Docker Compose Files

**File**: `docker-compose.yml` (if applicable)

```yaml
# Update Supabase service URLs
environment:
  - SUPABASE_URL=https://supabase.yourdomain.com
  - SUPABASE_ANON_KEY=${NEW_ANON_KEY}
  - SUPABASE_SERVICE_KEY=${NEW_SERVICE_ROLE_KEY}
```

### 2. CI/CD Configurations

**File**: `.github/workflows/*.yml`

```yaml
env:
  SUPABASE_URL: https://supabase.yourdomain.com
  SUPABASE_PROJECT_REF: default  # or your project ID

# Update GitHub Secrets:
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# SUPABASE_DB_PASSWORD
```

### 3. Edge Functions Environment

**Files**: `supabase/functions/**/index.ts`

Most Edge Functions use environment variables, but verify:

```typescript
// Check for hardcoded URLs (should be none)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Update if hardcoded
const supabaseUrl = 'https://supabase.yourdomain.com';
```

### 4. Mobile App Configuration

**File**: `mobile/app.config.js` or `mobile/app.json`

```javascript
export default {
  expo: {
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

Update `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```

### 5. Build Scripts

**File**: `package.json` scripts

Check for any build scripts that reference Supabase:

```json
{
  "scripts": {
    "db:migrate": "supabase db push",
    "db:types": "supabase gen types typescript"
  }
}
```

Ensure these use the linked project (no changes needed if using Supabase CLI link).

## Environment Files

### Frontend Environment

**File**: `frontend/.env.example`

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://supabase.yourdomain.com
VITE_SUPABASE_ANON_KEY=your-new-anon-key

# App Configuration
VITE_APP_URL=https://yourdomain.com
VITE_APP_NAME=Intl-Dossier

# Optional: Feature Flags
VITE_ENABLE_REALTIME=true
VITE_ENABLE_STORAGE=true
```

**Copy to active file**:
```bash
cp frontend/.env.example frontend/.env.local
# Edit with production values
```

### Backend Environment

**File**: `backend/.env.example`

```bash
# Supabase Configuration
SUPABASE_URL=https://supabase.yourdomain.com
SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key

# Database Direct Connection
DATABASE_URL=postgresql://postgres:password@supabase.yourdomain.com:5432/postgres

# Server Configuration
PORT=3000
NODE_ENV=production

# Redis (if applicable)
REDIS_URL=redis://localhost:6379
```

### Mobile Environment

**File**: `mobile/.env.example`

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key

# App Configuration
EXPO_PUBLIC_APP_NAME=Intl-Dossier
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

### Supabase CLI Configuration

**File**: `supabase/config.toml`

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage"]
extra_search_path = ["public"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323
```

Update link:
```bash
supabase link --project-ref default \
  --project-url https://supabase.yourdomain.com
```

## Validation

### Step 1: Static Validation

Check for remaining cloud references:

```bash
# Search for old project reference
grep -r "zkrcjzdemdmwhearhfgg" . --exclude-dir={node_modules,.git,dist,build}

# Search for old domain
grep -r "supabase.co" . --exclude-dir={node_modules,.git,dist,build}

# Should return: No matches (or only in docs/migration files)
```

### Step 2: Build Validation

Ensure everything builds:

```bash
# Frontend
cd frontend
npm run build
# Should complete without errors

# Backend
cd backend
npm run build
# Should complete without errors

# Mobile
cd mobile
npx expo prebuild
# Should complete without errors
```

### Step 3: Test Validation

Run tests with new configuration:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

### Step 4: Runtime Validation

Start services and verify connections:

```bash
# Frontend dev server
cd frontend
npm run dev
# Check browser console for Supabase connection

# Backend dev server
cd backend
npm run dev
# Check logs for Supabase connection

# Mobile dev server
cd mobile
npx expo start
# Test on device/simulator
```

### Step 5: Automated Validation Script

Use the validation script:

```bash
./docs/self-hosted-migration/scripts/validate-migration.sh --env-check
```

This checks:
- All environment files have correct URLs
- No hardcoded cloud references in code
- Supabase client connections work
- API endpoints respond correctly

## Git Workflow

### Committing Changes

```bash
# Review all changes
git status
git diff

# Stage environment updates
git add .env.example frontend/.env.example backend/.env.example mobile/.env.example

# Stage code updates
git add frontend/src/lib/supabase.ts
git add backend/src/lib/supabase.ts
git add mobile/src/lib/supabase.ts

# Commit with descriptive message
git commit -m "migrate: update environment configuration for self-hosted Supabase

- Update Supabase URL to https://supabase.yourdomain.com
- Update API keys for self-hosted instance
- Update client initialization across frontend, backend, mobile
- Update test configurations
- Files affected: 261
- Automated via update-env-vars.sh script

Related: Migration to self-hosted infrastructure
"
```

### Creating Pull Request

```bash
# Push branch
git push origin migration/self-hosted-env-updates

# Create PR (using GitHub CLI)
gh pr create \
  --title "Migration: Environment configuration for self-hosted Supabase" \
  --body "Updates all Supabase references to point to self-hosted instance.

## Changes
- Updated environment variables across all services
- Updated Supabase client initialization
- Updated test configurations
- Validated builds and tests

## Testing
- [x] Frontend builds successfully
- [x] Backend builds successfully
- [x] Mobile builds successfully
- [x] All tests pass
- [x] Local dev servers connect to self-hosted instance

## Validation Script
\`\`\`bash
./docs/self-hosted-migration/scripts/validate-migration.sh --env-check
\`\`\`

## Deployment Notes
Requires updating production environment variables before deployment.
See: docs/self-hosted-migration/02-migration-checklist.md
"
```

### Deployment Checklist

Before deploying updated code:

- [ ] Update production environment variables
- [ ] Update CI/CD secrets
- [ ] Update mobile app environment (app.config.js)
- [ ] Rebuild and test locally
- [ ] Deploy to staging first
- [ ] Full QA on staging
- [ ] Deploy to production
- [ ] Monitor for errors

## Troubleshooting

### Issue: "Failed to connect to Supabase"

**Cause**: Incorrect URL or keys

**Solution**:
```bash
# Verify environment variables are loaded
echo $VITE_SUPABASE_URL
echo $SUPABASE_URL

# Check .env file exists and is correct
cat frontend/.env.local
cat backend/.env.local

# Restart dev servers after .env changes
```

### Issue: "Authorization failed"

**Cause**: Using old anon key with new instance

**Solution**:
```bash
# Verify you're using the new anon key
# Get new key from self-hosted instance
docker compose exec db psql -U postgres -c "
SELECT * FROM auth.api_keys WHERE name = 'anon';"

# Update in all .env files
```

### Issue: "CORS errors in browser"

**Cause**: CORS configuration in Kong

**Solution**:
```bash
# Update Kong configuration
# Edit supabase/.env
ADDITIONAL_REDIRECT_URLS=http://localhost:5173,http://localhost:3000,https://yourdomain.com

# Restart Kong
cd ~/supabase/supabase/docker
docker compose restart kong
```

### Issue: "Mobile app can't connect"

**Cause**: Cached environment in Expo

**Solution**:
```bash
cd mobile
# Clear Expo cache
npx expo start -c

# Rebuild native
npx expo prebuild --clean

# Reinstall on device
```

### Issue: "Tests failing after update"

**Cause**: Test mocks still using old URLs

**Solution**:
```bash
# Update test setup files
# backend/tests/setup.ts
process.env.SUPABASE_URL = 'https://supabase.yourdomain.com';
process.env.SUPABASE_ANON_KEY = 'test-key';

# Mock Supabase client in tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));
```

## Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore (should already be there)
.env
.env.local
.env.production
*.key
*.pem
```

### 2. Use Environment Variables

Always use environment variables, never hardcode:

```typescript
// ❌ Bad
const supabase = createClient(
  'https://supabase.yourdomain.com',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

// ✅ Good
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
```

### 3. Validate Environment on Startup

```typescript
// frontend/src/lib/env.ts
function validateEnv() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  for (const key of required) {
    if (!import.meta.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

validateEnv();
```

### 4. Document Environment Variables

Maintain comprehensive `.env.example` files:

```bash
# .env.example
# Supabase Configuration
VITE_SUPABASE_URL=https://supabase.yourdomain.com  # Your self-hosted Supabase URL
VITE_SUPABASE_ANON_KEY=your-anon-key-here         # Get from Supabase Studio

# Feature Flags
VITE_ENABLE_ANALYTICS=false                        # Enable/disable analytics
```

## Summary

After completing this guide:

✅ All 261 files updated with new Supabase URLs
✅ Environment variables configured for all services
✅ Build and test validation completed
✅ Git workflow followed with proper commits
✅ Ready for deployment

**Next Steps**:
1. Test thoroughly in staging environment
2. Follow [Migration Checklist](./02-migration-checklist.md) for deployment
3. Set up [Monitoring & Alerting](./04-monitoring-alerting.md)

---

**Last Updated**: 2025-10-22
**Target**: Intl-Dossier V2.0 Self-Hosted Migration
