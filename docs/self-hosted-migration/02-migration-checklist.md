# Migration Checklist & Validation

## Overview

This comprehensive checklist guides you through migrating the Intl-Dossier V2.0 database and services from Supabase Cloud to your self-hosted instance.

**Duration**: 2-3 days
**Team**: Minimum 2 people recommended
**Rollback Time**: ~1 hour if needed

## Table of Contents

- [Pre-Migration Phase](#pre-migration-phase)
- [Database Migration](#database-migration)
- [Edge Functions Migration](#edge-functions-migration)
- [Storage Migration](#storage-migration)
- [Auth Configuration](#auth-configuration)
- [Realtime Configuration](#realtime-configuration)
- [Validation Testing](#validation-testing)
- [Parallel Run](#parallel-run)
- [Cutover](#cutover)
- [Post-Migration](#post-migration)
- [Rollback Procedure](#rollback-procedure)

## Pre-Migration Phase

### Step 1: Inventory Current System

**Duration**: 2 hours

- [ ] Document current Supabase Cloud project details
  ```bash
  Project ID: zkrcjzdemdmwhearhfgg
  Region: eu-west-2
  Database Version: PostgreSQL 17.6
  ```

- [ ] Count database tables
  ```sql
  SELECT schemaname, COUNT(*)
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  GROUP BY schemaname;
  ```

- [ ] List all Edge Functions
  ```bash
  # Expected: 100+ functions
  supabase functions list
  ```

- [ ] Document storage buckets
  ```sql
  SELECT id, name, public FROM storage.buckets;
  ```

- [ ] Document auth providers
  ```bash
  # Check Studio: Authentication > Providers
  - Email: Enabled
  - OAuth providers: [list them]
  ```

- [ ] Calculate database size
  ```sql
  SELECT pg_size_pretty(pg_database_size('postgres')) as db_size;
  ```

- [ ] Calculate storage usage
  ```sql
  SELECT bucket_id, COUNT(*), SUM(size) as total_size
  FROM storage.objects
  GROUP BY bucket_id;
  ```

### Step 2: Create Backup Strategy

**Duration**: 1 hour

- [ ] Create full database backup
  ```bash
  # From Supabase Cloud
  pg_dump \
    -h db.zkrcjzdemdmwhearhfgg.supabase.co \
    -U postgres \
    -p 5432 \
    -Fc \
    --no-owner \
    --no-acl \
    -f ~/backups/intl-dossier-$(date +%Y%m%d-%H%M%S).dump

  # Verify backup
  pg_restore --list ~/backups/intl-dossier-*.dump | head -20
  ```

- [ ] Export schema separately (for verification)
  ```bash
  pg_dump \
    -h db.zkrcjzdemdmwhearhfgg.supabase.co \
    -U postgres \
    --schema-only \
    -f ~/backups/schema-$(date +%Y%m%d).sql
  ```

- [ ] Backup auth users
  ```bash
  # Export auth.users table
  docker exec supabase-db pg_dump \
    -U postgres \
    -t auth.users \
    -t auth.identities \
    -t auth.sessions \
    -f ~/backups/auth-$(date +%Y%m%d).sql
  ```

- [ ] Backup storage files
  ```bash
  # If using Supabase Cloud storage, download all files
  # Option 1: Via Studio (Download bucket)
  # Option 2: Using rclone or AWS CLI if S3-backed

  # For self-hosted file storage
  tar -czf ~/backups/storage-$(date +%Y%m%d).tar.gz \
    volumes/storage/
  ```

- [ ] Store backups securely
  ```bash
  # Copy to secure location
  rsync -avz ~/backups/ backup-server:/secure/path/

  # Or upload to cloud storage
  aws s3 sync ~/backups/ s3://your-backup-bucket/intl-dossier/
  ```

### Step 3: Prepare Self-Hosted Instance

**Duration**: 30 minutes

- [ ] Verify self-hosted Supabase is running
  ```bash
  cd ~/supabase/supabase/docker
  docker compose ps
  # All services should show "Up (healthy)"
  ```

- [ ] Run health check
  ```bash
  ./scripts/validate-migration.sh --pre-check
  ```

- [ ] Verify disk space
  ```bash
  df -h
  # Ensure at least 2x database size available
  ```

- [ ] Check PostgreSQL extensions
  ```sql
  -- Connect to self-hosted
  docker compose exec db psql -U postgres

  -- Verify extensions
  SELECT * FROM pg_available_extensions
  WHERE name IN ('pgvector', 'pg_trgm', 'pg_stat_statements', 'uuid-ossp')
  ORDER BY name;

  -- Install if missing
  CREATE EXTENSION IF NOT EXISTS pgvector;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
  ```

### Step 4: Create Migration Timeline

**Duration**: 30 minutes

- [ ] Schedule migration window
  ```
  Preferred: Weekend or low-traffic period
  Duration: 4-6 hours for core migration
  Team availability: [list names]
  ```

- [ ] Notify stakeholders
  ```
  Email template:
  Subject: Intl-Dossier Infrastructure Migration - [DATE]

  We will be migrating our infrastructure to on-premise hosting.

  Timeline:
  - Start: [DATE TIME]
  - Expected completion: [DATE TIME]
  - Potential downtime: 1-2 hours

  Impact:
  - Application may be read-only during migration
  - Mobile app sync may be delayed

  Contact: [SUPPORT CONTACT]
  ```

- [ ] Prepare rollback plan (see [Rollback Procedure](#rollback-procedure))

## Database Migration

### Step 1: Stop Write Traffic (Optional)

**Duration**: 5 minutes

For safest migration, temporarily restrict writes:

```sql
-- On Supabase Cloud
-- Option 1: Make database read-only
ALTER DATABASE postgres SET default_transaction_read_only = on;

-- Option 2: Block specific users (safer for auth)
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
```

### Step 2: Final Database Backup

**Duration**: 10-30 minutes (depends on size)

```bash
# Create final backup with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
pg_dump \
  -h db.zkrcjzdemdmwhearhfgg.supabase.co \
  -U postgres \
  -Fc \
  --no-owner \
  --no-acl \
  -f ~/backups/final-backup-${TIMESTAMP}.dump

# Calculate checksum
md5sum ~/backups/final-backup-${TIMESTAMP}.dump > ~/backups/final-backup-${TIMESTAMP}.md5

# Note the timestamp for tracking
echo $TIMESTAMP > ~/backups/MIGRATION_TIMESTAMP.txt
```

### Step 3: Restore to Self-Hosted

**Duration**: 15-45 minutes (depends on size)

```bash
# Copy backup to server (if needed)
scp ~/backups/final-backup-*.dump server:/home/supabase/

# Restore database
docker compose exec -T db pg_restore \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --verbose \
  /path/to/final-backup-${TIMESTAMP}.dump 2>&1 | tee restore.log

# Check for errors
grep -i "error" restore.log
```

**Common Warnings (safe to ignore)**:
- "role does not exist" for Supabase-specific roles
- "already exists" for extensions
- "no privileges could be revoked" for system objects

### Step 4: Verify Database Integrity

**Duration**: 15 minutes

- [ ] Check table count
  ```sql
  -- On self-hosted
  docker compose exec db psql -U postgres

  SELECT schemaname, COUNT(*) as table_count
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  GROUP BY schemaname;

  -- Compare with cloud backup
  ```

- [ ] Check row counts for key tables
  ```sql
  SELECT
    'dossiers' as table_name, COUNT(*) as row_count FROM dossiers
  UNION ALL
  SELECT 'users', COUNT(*) FROM auth.users
  UNION ALL
  SELECT 'positions', COUNT(*) FROM positions
  UNION ALL
  SELECT 'engagements', COUNT(*) FROM engagements
  UNION ALL
  SELECT 'tasks', COUNT(*) FROM tasks
  UNION ALL
  SELECT 'intake_tickets', COUNT(*) FROM intake_tickets
  ORDER BY table_name;
  ```

- [ ] Verify foreign key constraints
  ```sql
  SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
  FROM information_schema.table_constraints tc
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name;
  ```

- [ ] Check indexes
  ```sql
  SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
  ```

- [ ] Verify RLS policies
  ```sql
  SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
  ```

- [ ] Test sample queries
  ```sql
  -- Test a complex query from your application
  SELECT
    d.id,
    d.name_en,
    d.name_ar,
    COUNT(DISTINCT e.id) as engagement_count,
    COUNT(DISTINCT t.id) as task_count
  FROM dossiers d
  LEFT JOIN engagements e ON e.dossier_id = d.id
  LEFT JOIN tasks t ON t.entity_type = 'engagement' AND t.entity_id = e.id
  WHERE d.deleted_at IS NULL
  GROUP BY d.id, d.name_en, d.name_ar
  LIMIT 10;
  ```

### Step 5: Update Database Configuration

**Duration**: 10 minutes

```sql
-- Reset sequences (if needed)
SELECT 'SELECT SETVAL(' ||
       quote_literal(quote_ident(sequence_namespace.nspname) || '.' || quote_ident(class_sequence.relname)) ||
       ', COALESCE(MAX(' ||quote_ident(pg_attribute.attname)|| '), 1) ) FROM ' ||
       quote_ident(table_namespace.nspname)|| '.'||quote_ident(class_table.relname)|| ';'
FROM pg_depend
INNER JOIN pg_class AS class_sequence ON class_sequence.oid = pg_depend.objid
INNER JOIN pg_class AS class_table ON class_table.oid = pg_depend.refobjid
INNER JOIN pg_attribute ON pg_attribute.attrelid = pg_depend.refobjid
INNER JOIN pg_namespace AS sequence_namespace ON sequence_namespace.oid = class_sequence.relnamespace
INNER JOIN pg_namespace AS table_namespace ON table_namespace.oid = class_table.relnamespace
WHERE class_sequence.relkind = 'S';

-- Analyze tables for query planner
ANALYZE;

-- Update statistics
VACUUM ANALYZE;
```

## Edge Functions Migration

### Step 1: Prepare Functions

**Duration**: 30 minutes

- [ ] List all functions from cloud
  ```bash
  supabase functions list --project-ref zkrcjzdemdmwhearhfgg
  ```

- [ ] Verify local function files
  ```bash
  ls -la supabase/functions/
  # Expected: 100+ function directories
  ```

- [ ] Check function dependencies
  ```bash
  # Review import_map.json in each function
  for dir in supabase/functions/*/; do
    if [ -f "$dir/import_map.json" ]; then
      echo "Function: $(basename $dir)"
      cat "$dir/import_map.json"
    fi
  done
  ```

### Step 2: Deploy Functions

**Duration**: 1-2 hours

```bash
# Link to self-hosted instance
supabase link \
  --project-url https://supabase.yourdomain.com \
  --project-ref default

# Deploy all functions
cd supabase/functions

for func in */; do
  func_name=$(basename "$func")
  echo "Deploying $func_name..."

  supabase functions deploy "$func_name" \
    --project-ref default \
    --no-verify-jwt false

  # Verify deployment
  if [ $? -eq 0 ]; then
    echo "✓ $func_name deployed successfully"
  else
    echo "✗ $func_name deployment failed"
    exit 1
  fi
done
```

### Step 3: Test Functions

**Duration**: 1 hour

- [ ] Test critical functions
  ```bash
  # Test positions-list
  curl -X POST https://supabase.yourdomain.com/functions/v1/positions-list \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}'

  # Test dossiers-list
  curl -X POST https://supabase.yourdomain.com/functions/v1/dossiers-list \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}'

  # Test intake-tickets-list
  curl -X POST https://supabase.yourdomain.com/functions/v1/intake-tickets-list \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

- [ ] Check function logs
  ```bash
  docker compose logs functions | tail -100
  ```

- [ ] Verify function response times
  ```bash
  # Benchmark response time
  time curl -X POST https://supabase.yourdomain.com/functions/v1/positions-list \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

## Storage Migration

### Step 1: Migrate Storage Buckets

**Duration**: 1-2 hours (depends on file count)

```bash
# Option 1: Using Supabase CLI (if available)
supabase storage download --project-ref zkrcjzdemdmwhearhfgg --bucket documents ./temp/documents
supabase storage upload --project-ref default --bucket documents ./temp/documents

# Option 2: Manual migration via API
# Script available in scripts/migrate-storage.sh
```

### Step 2: Verify Storage

- [ ] Check bucket configuration
  ```sql
  docker compose exec db psql -U postgres -c "
  SELECT id, name, public, file_size_limit
  FROM storage.buckets;"
  ```

- [ ] Verify file count
  ```sql
  SELECT bucket_id, COUNT(*) as file_count
  FROM storage.objects
  GROUP BY bucket_id;
  ```

- [ ] Test file upload
  ```bash
  # Create test file
  echo "Test upload" > test.txt

  # Upload via API
  curl -X POST https://supabase.yourdomain.com/storage/v1/object/documents/test.txt \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    --data-binary @test.txt

  # Verify upload
  curl https://supabase.yourdomain.com/storage/v1/object/documents/test.txt \
    -H "Authorization: Bearer $ANON_KEY"
  ```

- [ ] Test file download
- [ ] Test file deletion
- [ ] Verify RLS policies on storage

## Auth Configuration

### Step 1: Verify Auth Service

**Duration**: 30 minutes

- [ ] Check auth health
  ```bash
  curl https://supabase.yourdomain.com/auth/v1/health
  ```

- [ ] Verify user count
  ```sql
  SELECT COUNT(*) FROM auth.users;
  SELECT COUNT(*) FROM auth.identities;
  ```

- [ ] Test email auth
  ```bash
  # Test signup
  curl -X POST https://supabase.yourdomain.com/auth/v1/signup \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "testpassword123"
    }'

  # Test login
  curl -X POST https://supabase.yourdomain.com/auth/v1/token?grant_type=password \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "testpassword123"
    }'
  ```

- [ ] Verify OAuth providers (if configured)
- [ ] Test password reset flow
- [ ] Test session refresh

### Step 2: Configure Email Templates

- [ ] Update email templates in Studio
  - Confirm signup template
  - Reset password template
  - Magic link template
  - Change email template

- [ ] Update email sender configuration
  ```
  SMTP_HOST=smtp.yourdomain.com
  SMTP_PORT=587
  SMTP_USER=noreply@yourdomain.com
  SMTP_PASS=***
  SMTP_SENDER_NAME=Intl-Dossier
  ```

## Realtime Configuration

### Step 1: Enable Realtime

**Duration**: 15 minutes

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE intake_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Step 2: Test Realtime

- [ ] Test WebSocket connection
  ```javascript
  // From browser console or Node script
  const supabase = createClient(
    'https://supabase.yourdomain.com',
    'ANON_KEY'
  );

  const channel = supabase
    .channel('test-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'assignments' },
      (payload) => console.log('Change received!', payload)
    )
    .subscribe();

  // Make a change and verify notification received
  ```

- [ ] Verify subscription count limit
  ```bash
  docker compose logs realtime | grep "connection"
  ```

## Validation Testing

### Step 1: Frontend Testing

**Duration**: 2 hours

- [ ] Update frontend environment
  ```bash
  # See 03-environment-update-scripts.md
  ./scripts/update-env-vars.sh
  ```

- [ ] Test local frontend
  ```bash
  cd frontend
  npm run dev
  ```

- [ ] Test authentication flow
  - [ ] Login
  - [ ] Logout
  - [ ] Password reset
  - [ ] Session persistence

- [ ] Test data fetching
  - [ ] Dossiers list
  - [ ] Positions list
  - [ ] Engagements list
  - [ ] Tasks list

- [ ] Test CRUD operations
  - [ ] Create dossier
  - [ ] Update position
  - [ ] Delete task
  - [ ] Archive engagement

- [ ] Test real-time updates
  - [ ] Open two browser windows
  - [ ] Make change in one
  - [ ] Verify update in other

### Step 2: Mobile App Testing

**Duration**: 2 hours

- [ ] Update mobile environment
  ```bash
  cd mobile
  # Update app.config.js with new URLs
  ```

- [ ] Test on iOS simulator/device
- [ ] Test on Android simulator/device
- [ ] Test offline sync
- [ ] Test background sync
- [ ] Test push notifications (if enabled)

### Step 3: Backend Testing

**Duration**: 1 hour

- [ ] Run test suite
  ```bash
  cd backend
  npm test
  ```

- [ ] Test API endpoints
  ```bash
  # Health check
  curl https://supabase.yourdomain.com/rest/v1/

  # Authenticated request
  curl https://supabase.yourdomain.com/rest/v1/dossiers \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $USER_TOKEN"
  ```

### Step 4: Performance Testing

**Duration**: 1 hour

- [ ] Run performance benchmarks
  ```bash
  # Use Apache Bench or similar
  ab -n 1000 -c 10 https://supabase.yourdomain.com/rest/v1/dossiers
  ```

- [ ] Compare with cloud metrics
- [ ] Check database query performance
  ```sql
  SELECT query, calls, total_time, mean_time, min_time, max_time
  FROM pg_stat_statements
  ORDER BY total_time DESC
  LIMIT 20;
  ```

- [ ] Monitor resource usage
  ```bash
  docker stats
  htop
  ```

## Parallel Run

### Duration: 1-2 weeks

Run both systems in parallel before full cutover:

- [ ] Configure traffic split (10% to self-hosted)
- [ ] Monitor error rates
- [ ] Compare performance metrics
- [ ] Verify data consistency
- [ ] Gradually increase traffic to self-hosted
- [ ] Monitor for 7 days minimum

## Cutover

### Step 1: Final Sync

**Duration**: 30 minutes

```bash
# If data changed during parallel run, sync incremental changes
# This depends on your parallel run strategy
```

### Step 2: Update DNS/Environment

**Duration**: 15 minutes

- [ ] Update environment variables in production
  ```bash
  # Frontend
  VITE_SUPABASE_URL=https://supabase.yourdomain.com

  # Backend
  SUPABASE_URL=https://supabase.yourdomain.com

  # Mobile
  EXPO_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
  ```

- [ ] Deploy updated applications
- [ ] Verify traffic routing to self-hosted

### Step 3: Monitor

**Duration**: 24 hours intensive, then ongoing

- [ ] Watch error logs
- [ ] Monitor performance
- [ ] Check database connections
- [ ] Verify user login success rate
- [ ] Monitor mobile app sync

## Post-Migration

### Day 1

- [ ] Intensive monitoring (24 hours)
- [ ] Document any issues
- [ ] Quick fixes for critical issues

### Week 1

- [ ] Daily health checks
- [ ] Performance tuning
- [ ] User feedback collection
- [ ] Database optimization

### Week 2-4

- [ ] Continue monitoring
- [ ] Finalize performance tuning
- [ ] Update documentation
- [ ] Plan Supabase Cloud decommission

### Month 1

- [ ] Review migration success
- [ ] Document lessons learned
- [ ] Optimize operational procedures
- [ ] Decommission Supabase Cloud (after 30 days of stable operation)

## Rollback Procedure

If critical issues occur:

### Immediate Rollback (< 1 hour)

```bash
# 1. Switch environment back to cloud
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co

# 2. Redeploy applications

# 3. Verify cloud database is still accessible

# 4. Re-enable write traffic (if it was disabled)
ALTER DATABASE postgres SET default_transaction_read_only = off;
```

### Data Recovery

```bash
# Restore from backup if needed
pg_restore -U postgres -d postgres /path/to/backup.dump
```

## Success Criteria

Migration is successful when:

- [ ] Zero data loss (verified by checksums)
- [ ] All services operational
- [ ] Performance meets SLAs
- [ ] No critical bugs for 7 days
- [ ] User feedback is positive
- [ ] Mobile sync working reliably

## Validation Script

Use the automated validation script:

```bash
./scripts/validate-migration.sh --full
```

This script checks:
- Service health
- Database integrity
- Function availability
- Storage accessibility
- Auth functionality
- Realtime connectivity

---

**Last Updated**: 2025-10-22
**Target**: Intl-Dossier V2.0 Self-Hosted Migration
