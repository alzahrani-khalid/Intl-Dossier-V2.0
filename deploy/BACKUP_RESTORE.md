# Backup & Restore Runbook

## Overview

| Component | Backup Method | Frequency | Retention | Location |
|-----------|--------------|-----------|-----------|----------|
| PostgreSQL (Supabase) | Supabase managed daily backups | Daily (automatic) | Per Supabase plan | Supabase infrastructure |
| Redis | RDB snapshot via backup-redis.sh | Daily at 02:00 UTC | 7 days | /opt/intl-dossier/backups/redis/ |

## Supabase PostgreSQL Restore

### Prerequisites

- Access to Supabase dashboard (https://supabase.com/dashboard)
- Project ID: zkrcjzdemdmwhearhfgg (staging)
- Database password available

### Known Risks (from PITFALLS.md)

1. **Role passwords not preserved**: Backup does not include role passwords. After restore, you may need to reset the `postgres` role password via Supabase dashboard.
2. **Storage objects not included**: Supabase Storage (file uploads) is NOT part of the database backup. Storage objects must be backed up separately if used.
3. **pg_net and pg_cron extensions**: These extensions may fire unintended actions during restore. Disable them immediately after restore.
4. **Extension conflicts**: Some extensions may fail to restore if the target project has different extension versions.

### Restore Procedure

1. **Navigate to Supabase Dashboard**
   - Go to https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg
   - Click "Database" in the sidebar
   - Click "Backups" tab

2. **Download Backup**
   - Select the backup date to restore from
   - Click "Download" to get the backup file

3. **Restore to Staging First**
   - NEVER restore directly to production
   - Create or use a staging project
   - Use `psql` or Supabase CLI to restore:
     ```bash
     psql "postgresql://postgres:[password]@db.[staging-project-id].supabase.co:5432/postgres" < backup.sql
     ```

4. **Post-Restore Checks**
   - Disable pg_net: `ALTER EXTENSION pg_net SET SCHEMA _disabled;` or drop triggers
   - Disable pg_cron: `SELECT cron.unschedule(jobid) FROM cron.job;`
   - Verify critical tables have data:
     ```sql
     SELECT COUNT(*) FROM dossiers;
     SELECT COUNT(*) FROM work_items;
     SELECT COUNT(*) FROM engagements;
     ```
   - Reset role passwords if needed via Supabase dashboard

5. **Verify Application Connectivity**
   - Point a test backend instance at the restored database
   - Verify API health: `curl http://localhost:4000/health`
   - Verify data integrity: check a few dossier detail pages

6. **Production Restore (if needed)**
   - Only after staging restore is verified
   - Notify all users of downtime window
   - Follow steps 2-5 against the production project

## Redis Restore

### From RDB Backup

1. **Stop the Redis container**
   ```bash
   cd /opt/intl-dossier/deploy
   docker compose -f docker-compose.prod.yml stop redis
   ```

2. **Copy backup into the volume**
   ```bash
   # Find latest backup
   ls -la /opt/intl-dossier/backups/redis/

   # Copy into the Redis data volume
   docker cp /opt/intl-dossier/backups/redis/dump_YYYYMMDD_HHMMSS.rdb intl-dossier-redis:/data/dump.rdb
   ```

3. **Restart Redis**
   ```bash
   docker compose -f docker-compose.prod.yml start redis
   ```

4. **Verify**
   ```bash
   docker exec intl-dossier-redis redis-cli DBSIZE
   docker exec intl-dossier-redis redis-cli INFO keyspace
   ```

## Setup: Redis Backup Cron

Run on the droplet to install the daily backup cron:

```bash
# Add cron job for daily Redis backup at 02:00 UTC
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/intl-dossier/deploy/backup-redis.sh >> /var/log/redis-backup.log 2>&1") | crontab -
```

Verify: `crontab -l | grep redis`
