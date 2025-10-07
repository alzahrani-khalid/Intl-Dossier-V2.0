# Dossiers Hub - Deployment Instructions

## Prerequisites
✅ Supabase CLI installed
✅ Database migrations applied
✅ Edge functions implemented

## Step 1: Authenticate with Supabase

You've already started the login process. Complete it by:

1. Open the browser link that was shown (or press Enter to open automatically)
2. Log in to your Supabase account
3. Copy the verification code from the browser
4. Paste it in the terminal when prompted

If the session expired, run again:
```bash
supabase login
```

## Step 2: Deploy All Edge Functions

Once authenticated, deploy all 7 dossier edge functions:

```bash
# Navigate to project root
cd /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0

# Deploy all functions at once
supabase functions deploy --project-ref zkrcjzdemdmwhearhfgg

# OR deploy individually
supabase functions deploy dossiers-list --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy dossiers-create --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy dossiers-get --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy dossiers-update --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy dossiers-archive --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy dossiers-timeline --project-ref zkrcjzdemdmwhearhfgg
supabase functions deploy dossiers-briefs-generate --project-ref zkrcjzdemdmwhearhfgg
```

## Step 3: Verify Deployment

After deployment, verify the functions are active:

```bash
# List all deployed functions
supabase functions list --project-ref zkrcjzdemdmwhearhfgg

# Test a function (replace with your auth token)
curl -X GET \
  'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/dossiers-list?limit=10' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY'
```

## Step 4: Get API Credentials

You'll need these for the frontend:

```bash
# Get project URL
supabase projects list

# Get API keys from Supabase Dashboard:
# https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/settings/api
```

## Step 5: Configure Frontend Environment

Create `.env` file in the frontend directory:

```bash
cd frontend
cat > .env << EOF
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF
```

## Step 6: Test Locally

```bash
# Start frontend dev server
cd frontend
npm run dev

# In another terminal, run E2E tests
npm run test:e2e
```

## Step 7: Build for Production

```bash
# Build frontend
cd frontend
npm run build

# Preview production build
npm run preview

# Deploy to hosting (Vercel, Netlify, etc.)
```

## Troubleshooting

### Login Issues
If `supabase login` fails:
1. Check you have latest CLI: `supabase --version` (should be 2.47.2+)
2. Clear cache: `rm -rf ~/.supabase`
3. Try again: `supabase login`

### Deployment Fails
If function deployment fails:
1. Check function has valid Deno imports
2. Verify `_shared/cors.ts` exists
3. Check project-ref is correct: `zkrcjzdemdmwhearhfgg`
4. Run with debug: `supabase functions deploy --debug`

### CORS Errors
If you get CORS errors in browser:
1. Verify `_shared/cors.ts` is included in functions
2. Check function returns CORS headers in response
3. Handle OPTIONS preflight requests

## Expected Results

After successful deployment:
- ✅ 7 edge functions deployed and active
- ✅ Functions accessible at: `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/*`
- ✅ Frontend can connect to backend
- ✅ RLS policies protect data access
- ✅ E2E tests pass

## Quick Deployment Script

Save this as `deploy.sh` and run `chmod +x deploy.sh && ./deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Dossiers Hub..."

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in. Run: supabase login"
    exit 1
fi

# Deploy functions
echo "📦 Deploying edge functions..."
supabase functions deploy --project-ref zkrcjzdemdmwhearhfgg

# List deployed functions
echo "✅ Deployed functions:"
supabase functions list --project-ref zkrcjzdemdmwhearhfgg

echo "🎉 Deployment complete!"
echo "Next: Configure frontend .env and run npm run dev"
```

## Support

If you encounter issues:
1. Check logs: `supabase functions logs --project-ref zkrcjzdemdmwhearhfgg`
2. Review error messages in terminal
3. Verify database migrations are applied
4. Check Supabase dashboard for function status

---

**Project**: Intl-DossierV2.0
**Feature**: 009-dossiers-hub
**Date**: 2025-09-30
**Status**: Ready for Deployment 🚀