# pg_cron Setup for Intelligence Batch Refresh

## Overview

A pg_cron job has been configured to automatically refresh stale intelligence reports every hour. This job calls the `intelligence-batch-update` Edge Function to process up to 50 expired intelligence reports.

## Job Configuration

- **Job Name**: `intelligence-batch-refresh-hourly`
- **Schedule**: Every hour (cron: `0 * * * *`)
- **Function**: `public.trigger_intelligence_batch_refresh()`
- **Batch Size**: 50 reports per run
- **Intelligence Types**: economic, political, security, bilateral

## Required Manual Configuration

**IMPORTANT**: The service role key must be configured for the cron job to authenticate with Edge Functions.

### Option 1: Configure via Database Parameter (Recommended)

Run this SQL as a superuser (requires database owner privileges):

```sql
-- Set service role key as database parameter
ALTER DATABASE postgres
SET "app.service_role_key" = 'your-service-role-key-here';

-- Reload configuration
SELECT pg_reload_conf();
```

To get your service role key:
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the `service_role` key (NOT the `anon` key)
3. Store it securely in the database configuration

### Option 2: Configure via Supabase Vault (Enterprise)

```sql
-- Store in Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('service_role_key', 'your-service-role-key-here');

-- Update the trigger function to use Vault
-- (Requires modifying public.trigger_intelligence_batch_refresh function)
```

### Option 3: Manual Edge Function Invocation (Development)

For development/testing, you can manually trigger the batch refresh:

```bash
curl -X POST \
  'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/intelligence-batch-update' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 50,
    "intelligence_types": ["economic", "political", "security", "bilateral"]
  }'
```

## Monitoring

### Check Cron Job Status

```sql
-- View active cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  database,
  username
FROM cron.job
WHERE jobname = 'intelligence-batch-refresh-hourly';
```

### View Job Execution History

```sql
-- View recent job runs
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid
  FROM cron.job
  WHERE jobname = 'intelligence-batch-refresh-hourly'
)
ORDER BY start_time DESC
LIMIT 10;
```

### View Application-Level Job Logs

```sql
-- View custom job logs from intelligence_refresh_jobs table
SELECT
  id,
  job_name,
  started_at,
  completed_at,
  status,
  items_processed,
  items_failed,
  error_message
FROM public.intelligence_refresh_jobs
ORDER BY started_at DESC
LIMIT 20;
```

## Troubleshooting

### Job Not Running

1. Check if job is active:
   ```sql
   SELECT active FROM cron.job WHERE jobname = 'intelligence-batch-refresh-hourly';
   ```

2. Check cron extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

3. Check for errors in job run details:
   ```sql
   SELECT status, return_message
   FROM cron.job_run_details
   WHERE jobid = 8  -- Replace with your jobid
   ORDER BY start_time DESC
   LIMIT 1;
   ```

### Authentication Errors

If you see "permission denied" or "401 Unauthorized" errors:

1. Verify service role key is configured:
   ```sql
   SELECT current_setting('app.service_role_key', true);
   ```

2. Check Edge Function logs in Supabase Dashboard

3. Verify Edge Function is deployed:
   ```bash
   supabase functions list
   ```

### HTTP Extension Issues

If HTTP requests fail:

1. Verify http extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'http';
   ```

2. Check network connectivity from database to Edge Functions

## Manual Job Trigger (Testing)

To test the job without waiting for the hourly schedule:

```sql
-- Trigger job immediately
SELECT public.trigger_intelligence_batch_refresh();

-- Check result
SELECT * FROM public.intelligence_refresh_jobs
ORDER BY started_at DESC
LIMIT 1;
```

## Disabling the Job

If you need to temporarily disable the job:

```sql
-- Pause the job
UPDATE cron.job
SET active = false
WHERE jobname = 'intelligence-batch-refresh-hourly';

-- Resume the job
UPDATE cron.job
SET active = true
WHERE jobname = 'intelligence-batch-refresh-hourly';
```

## Uninstalling

To completely remove the cron job:

```sql
-- Unschedule the job
SELECT cron.unschedule('intelligence-batch-refresh-hourly');

-- Drop helper function
DROP FUNCTION IF EXISTS public.trigger_intelligence_batch_refresh();

-- Drop job history table (optional)
DROP TABLE IF EXISTS public.intelligence_refresh_jobs;
```

## Next Steps

1. ✅ pg_cron job created (jobid: 8)
2. ✅ Helper function `trigger_intelligence_batch_refresh()` created
3. ✅ Job history table `intelligence_refresh_jobs` created
4. ⏳ **REQUIRED**: Configure service role key (see Option 1 above)
5. ⏳ Test job execution manually
6. ⏳ Monitor first automatic run (next hour)

## Related Documentation

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Feature Spec: 029-dynamic-country-intelligence](../specs/029-dynamic-country-intelligence/spec.md)
