# Front Door Intake - Deployment Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-29
**Feature**: 008-front-door-intake

## Quick Start

This guide covers deploying the Front Door Intake feature, which adds AI-powered support request management to the GASTAT International Dossier System.

**Estimated deployment time**: 2-3 hours

---

## Prerequisites

### System Requirements

- ✅ Node.js 18+ LTS installed
- ✅ Supabase project (production tier)
- ✅ Docker 20.10+ with Docker Compose
- ✅ Valid SSL certificate for domains
- ✅ Minimum 8GB RAM, 50GB storage

### Before You Begin

- [ ] Complete general deployment guide (`docs/deployment.md`)
- [ ] Database migrations 001-007 applied (base system)
- [ ] Frontend and backend base systems deployed
- [ ] Monitoring infrastructure configured

---

## Step 1: Database Setup (30 minutes)

### 1.1 Install pgvector Extension

```bash
# Connect to Supabase database
psql $DATABASE_URL

# Install pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 1.2 Apply Intake Migrations

```bash
cd supabase/migrations

# Run migrations 20250129000 through 20250129015
npx supabase db push

# Verify all tables created
psql $DATABASE_URL -c "\dt intake_*"
```

**Expected output:**
```
 public | intake_attachments
 public | intake_tickets
 public | triage_decisions
 public | sla_policies
 public | sla_events
 public | duplicate_candidates
 public | ai_embeddings
 public | analysis_metadata
 public | audit_logs
```

### 1.3 Verify Indexes

```sql
-- Check critical indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'intake_%'
ORDER BY tablename, indexname;
```

### 1.4 Seed Initial Data

```bash
# Seed SLA policies
cat > /tmp/seed_sla.sql <<EOF
INSERT INTO sla_policies (priority, acknowledgment_target, resolution_target, business_hours_only, timezone, is_active)
VALUES
  ('urgent', 15, 240, false, 'Asia/Riyadh', true),
  ('high', 30, 480, false, 'Asia/Riyadh', true),
  ('medium', 120, 1440, true, 'Asia/Riyadh', true),
  ('low', 240, 2880, true, 'Asia/Riyadh', true);
EOF

psql $DATABASE_URL -f /tmp/seed_sla.sql
```

---

## Step 2: Deploy AnythingLLM (45 minutes)

### 2.1 Setup Docker Compose

```bash
cd docker/

# Create AnythingLLM configuration
cat > docker-compose.anythingllm.yml <<EOF
version: '3.8'

services:
  anythingllm:
    image: mintplexlabs/anythingllm:latest
    container_name: anythingllm-intake
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - STORAGE_DIR=/app/storage
      - EMBEDDING_MODEL=bge-m3
      - LLM_MODEL=gpt-4
      - API_KEY=\${ANYTHINGLLM_API_KEY}
    volumes:
      - anythingllm_storage:/app/storage
      - ./anythingllm_config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

volumes:
  anythingllm_storage:
    driver: local
EOF
```

### 2.2 Start AnythingLLM

```bash
# Set API key
export ANYTHINGLLM_API_KEY=$(openssl rand -hex 32)
echo "ANYTHINGLLM_API_KEY=$ANYTHINGLLM_API_KEY" >> ../.env.production

# Start service
docker-compose -f docker-compose.anythingllm.yml up -d

# Wait for startup
sleep 60

# Verify health
curl http://localhost:3001/api/health
```

### 2.3 Configure Models

```bash
# Access admin panel
open http://localhost:3001

# Configure (via UI):
# 1. Set embedding model: bge-m3 (1024 dimensions)
# 2. Set LLM model: gpt-4 or compatible
# 3. Enable API access
# 4. Test embeddings endpoint
```

### 2.4 Test AI Services

```bash
# Test embedding generation
curl -X POST http://localhost:3001/api/embed \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test support request"}'

# Expected: 1024-dimension vector
```

---

## Step 3: Deploy Edge Functions (30 minutes)

### 3.1 Set Function Secrets

```bash
cd supabase

# Set all required secrets
npx supabase secrets set \
  ANYTHINGLLM_API_URL="http://anythingllm-intake:3001" \
  ANYTHINGLLM_API_KEY="$ANYTHINGLLM_API_KEY" \
  EMBEDDING_MODEL="bge-m3" \
  SIMILARITY_PRIMARY="0.82" \
  SIMILARITY_CANDIDATE="0.65" \
  MAX_FILE_SIZE_MB="25" \
  MAX_TOTAL_SIZE_MB="100" \
  USER_RATE_LIMIT="300" \
  ANON_RATE_LIMIT="60"

# Verify secrets set
npx supabase secrets list
```

### 3.2 Deploy Functions

```bash
# Deploy all intake functions
for func in intake-tickets-{create,list,get,update,triage,assign,convert,duplicates,merge,attachments} intake-{health,ai-health}; do
  echo "Deploying $func..."
  npx supabase functions deploy $func
done

# Verify deployments
npx supabase functions list | grep intake
```

### 3.3 Test Endpoints

```bash
# Get anon key
ANON_KEY=$(npx supabase status | grep "anon key" | awk '{print $3}')

# Test health endpoint
curl https://your-project.supabase.co/functions/v1/intake-health

# Test AI health
curl https://your-project.supabase.co/functions/v1/intake-ai-health

# Test authenticated endpoint
curl https://your-project.supabase.co/functions/v1/intake-tickets \
  -H "Authorization: Bearer $ANON_KEY"
```

---

## Step 4: Configure Storage (15 minutes)

### 4.1 Create Storage Bucket

```sql
-- Create intake-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-attachments',
  'intake-attachments',
  false,
  26214400, -- 25MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif', 'text/plain']
);
```

### 4.2 Setup Storage Policies

```sql
-- Upload policy
CREATE POLICY "Users can upload to their tickets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'intake-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM intake_tickets WHERE created_by = auth.uid()
  )
);

-- Download policy
CREATE POLICY "Users can download from accessible tickets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'intake-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM intake_tickets
    WHERE created_by = auth.uid()
       OR assigned_to = auth.uid()
       OR assigned_unit IN (SELECT unit FROM user_units WHERE user_id = auth.uid())
  )
);
```

### 4.3 Test Upload

```bash
# Create test file
echo "Test attachment content" > /tmp/test.txt

# Upload via Supabase client
curl -X POST https://your-project.supabase.co/storage/v1/object/intake-attachments/test-ticket-id/test.txt \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F file=@/tmp/test.txt

# Verify upload
curl https://your-project.supabase.co/storage/v1/object/intake-attachments/test-ticket-id/test.txt \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

## Step 5: Build and Deploy Frontend (30 minutes)

### 5.1 Update Environment Variables

```bash
cd frontend

# Add intake-specific variables to .env.production
cat >> .env.production <<EOF

# Front Door Intake
VITE_INTAKE_ENABLED=true
VITE_MAX_FILE_SIZE_MB=25
VITE_MAX_TOTAL_SIZE_MB=100
VITE_AI_TRIAGE_TIMEOUT_MS=5000
VITE_DUPLICATE_THRESHOLD=0.65
EOF
```

### 5.2 Build Frontend

```bash
# Install dependencies
npm ci --production

# Build optimized bundle
npm run build

# Verify bundle size
du -sh dist/
# Expected: < 2MB (compressed)

# Check for intake routes
grep -r "intake" dist/assets/*.js | head -5
```

### 5.3 Deploy

```bash
# Deploy to Vercel (or your hosting platform)
vercel --prod

# Or copy to static server
scp -r dist/* user@server:/var/www/app.gastat.sa/
```

---

## Step 6: Configure Monitoring (20 minutes)

### 6.1 Setup Health Checks

```bash
# Create health check script
cat > /usr/local/bin/check-intake.sh <<'EOF'
#!/bin/bash
set -e

API_URL="https://api.gastat.sa/functions/v1/intake-health"
AI_URL="https://api.gastat.sa/functions/v1/intake-ai-health"

# Check API
if ! curl -sf "$API_URL" > /dev/null; then
  echo "CRITICAL: Intake API down"
  exit 2
fi

# Check AI service
if ! curl -sf "$AI_URL" > /dev/null; then
  echo "WARNING: AI service degraded"
  exit 1
fi

echo "OK: All intake services operational"
exit 0
EOF

chmod +x /usr/local/bin/check-intake.sh

# Test
/usr/local/bin/check-intake.sh
```

### 6.2 Setup Prometheus Metrics

```yaml
# prometheus.yml - Add intake job
scrape_configs:
  - job_name: 'intake-api'
    static_configs:
      - targets: ['api.gastat.sa:443']
    metrics_path: '/functions/v1/intake-health'
    scheme: https
    scrape_interval: 30s
```

### 6.3 Configure Alerts

```yaml
# alerts.yml - Add intake alerts
groups:
  - name: intake_alerts
    rules:
      - alert: IntakeAPIDown
        expr: up{job="intake-api"} == 0
        for: 2m
        annotations:
          summary: "Intake API is down"

      - alert: IntakeAIDegraded
        expr: intake_ai_available == 0
        for: 5m
        annotations:
          summary: "AI services degraded"

      - alert: IntakeSLABreaches
        expr: rate(intake_sla_breaches_total[5m]) > 0.1
        annotations:
          summary: "High SLA breach rate"
```

---

## Step 7: Post-Deployment Verification (30 minutes)

### 7.1 Run Automated Tests

```bash
cd frontend

# Run E2E smoke tests
npm run test:e2e -- --grep "intake"

# Expected: All intake workflows pass
```

### 7.2 Manual Verification Checklist

Complete each step and verify:

- [ ] **1. Access Front Door**
  - Navigate to https://app.gastat.sa/intake/new
  - Page loads within 3 seconds
  - Form displays correctly in EN and AR

- [ ] **2. Submit Test Ticket**
  - Fill out form in English
  - Upload 5MB test PDF
  - Submit successfully
  - Receive ticket number (e.g., TKT-2025-001234)

- [ ] **3. Verify AI Triage**
  - Open submitted ticket
  - AI suggestions load within 2 seconds
  - Confidence scores displayed
  - Can accept or override suggestions

- [ ] **4. Test Duplicate Detection**
  - Create similar ticket
  - Open new ticket
  - Duplicate alert shows (if >0.65 similarity)
  - Can compare and merge

- [ ] **5. Verify SLA Tracking**
  - Open ticket detail
  - SLA countdown visible
  - Countdown updates in real-time
  - Warning shown at <25% remaining

- [ ] **6. Test Assignment**
  - Select ticket from queue
  - Assign to user/unit
  - Status updates to "assigned"
  - Assignee receives notification

- [ ] **7. Test Conversion**
  - Select assigned ticket
  - Click "Convert to Artifact"
  - For confidential: MFA prompt appears
  - Conversion succeeds
  - Link to new artifact works

### 7.3 Performance Validation

```bash
# Run load test
cd frontend/tests/performance

# Test with 100 concurrent users
npx artillery run load-test.yml --target https://app.gastat.sa

# Verify metrics:
# - API p95 latency < 400ms ✓
# - AI triage < 2s ✓
# - Page load < 3s ✓
# - Error rate < 1% ✓
```

### 7.4 Security Audit

```bash
# Run security scan
npm audit --production

# Should show: 0 vulnerabilities

# Test RLS policies
psql $DATABASE_URL <<EOF
-- Try to access ticket from different user
SET request.jwt.claim.sub = 'other-user-id';
SELECT * FROM intake_tickets WHERE id = 'test-ticket-id';
-- Should return 0 rows
EOF
```

---

## Rollback Procedure

If issues occur, follow these steps:

### Quick Rollback (< 10 minutes)

```bash
# 1. Revert frontend deployment
vercel rollback

# 2. Disable intake routes temporarily
# Update router to show maintenance page

# 3. Notify users
curl -X POST https://notifications.gastat.sa/broadcast \
  -d '{"message":"Front Door temporarily unavailable. Using legacy form."}'
```

### Full Rollback (< 30 minutes)

```bash
# 1. Stop AnythingLLM
docker-compose -f docker-compose.anythingllm.yml down

# 2. Revert database migrations
npx supabase db reset --db-url $DATABASE_URL --to-migration 20250128999

# 3. Remove Edge Functions
for func in intake-tickets-{create,list,get,update,triage,assign,convert,duplicates,merge,attachments} intake-{health,ai-health}; do
  npx supabase functions delete $func
done

# 4. Restore previous frontend
git revert HEAD
npm run build
vercel --prod

# 5. Verify system stable
./tests/smoke-test.sh
```

---

## Troubleshooting

### Issue: AI service not responding

**Symptoms**: Triage takes >5s or fails

**Diagnosis**:
```bash
# Check AnythingLLM logs
docker logs anythingllm-intake --tail 100

# Test embedding endpoint
curl -v http://localhost:3001/api/health
```

**Solutions**:
```bash
# Restart service
docker-compose -f docker-compose.anythingllm.yml restart

# Clear cache if needed
docker volume rm docker_anythingllm_storage
docker-compose -f docker-compose.anythingllm.yml up -d
```

### Issue: Duplicate detection not finding matches

**Symptoms**: No duplicates found for obviously similar tickets

**Diagnosis**:
```sql
-- Check embeddings exist
SELECT COUNT(*) FROM ai_embeddings WHERE owner_type = 'ticket';

-- Verify vector index
SELECT * FROM pg_indexes WHERE indexname = 'idx_embeddings_vector';
```

**Solutions**:
```sql
-- Rebuild vector index
REINDEX INDEX idx_embeddings_vector;

-- Regenerate embeddings for existing tickets
SELECT regenerate_ticket_embeddings();
```

### Issue: File upload fails

**Symptoms**: 413 or 400 error on upload

**Diagnosis**:
```bash
# Check storage bucket
psql $DATABASE_URL -c "SELECT * FROM storage.buckets WHERE id = 'intake-attachments';"

# Check file size limits
echo "File size: $(stat -f%z /path/to/file)"
```

**Solutions**:
```sql
-- Increase size limit if needed
UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB
WHERE id = 'intake-attachments';
```

### Issue: SLA countdown not updating

**Symptoms**: Countdown frozen or incorrect

**Diagnosis**:
```bash
# Check Realtime connection
curl https://your-project.supabase.co/realtime/v1/health

# Check SLA events
psql $DATABASE_URL -c "SELECT * FROM sla_events WHERE ticket_id = 'test-id' ORDER BY created_at DESC LIMIT 5;"
```

**Solutions**:
```typescript
// Frontend: Reconnect Realtime
supabase.removeAllChannels();
const channel = supabase.channel('sla-updates');
// Re-subscribe to channels
```

---

## Maintenance Schedule

### Daily Tasks
- [ ] Review error logs
- [ ] Check AI service health
- [ ] Monitor SLA breach rate

### Weekly Tasks
- [ ] Review slow queries
- [ ] Check storage usage
- [ ] Update dependencies (if needed)
- [ ] Review audit logs

### Monthly Tasks
- [ ] Database VACUUM ANALYZE
- [ ] Archive closed tickets (>90 days)
- [ ] Security audit
- [ ] Performance optimization review

---

## Support

**Documentation:**
- Feature spec: `/specs/008-front-door-intake/spec.md`
- API docs: `/docs/api/front-door-intake.md`
- Quickstart: `/specs/008-front-door-intake/quickstart.md`

**Contacts:**
- Technical support: support@gastat.sa
- On-call: +966-XX-XXX-XXXX

---

## Appendix

### Environment Variables Reference

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# AnythingLLM
ANYTHINGLLM_API_URL=http://anythingllm-intake:3001
ANYTHINGLLM_API_KEY=<generated-key>
EMBEDDING_MODEL=bge-m3

# Intake Configuration
SIMILARITY_PRIMARY=0.82
SIMILARITY_CANDIDATE=0.65
MAX_FILE_SIZE_MB=25
MAX_TOTAL_SIZE_MB=100
USER_RATE_LIMIT=300
ANON_RATE_LIMIT=60

# SLA Defaults
HIGH_PRIORITY_ACK_MINUTES=30
HIGH_PRIORITY_RESOLVE_MINUTES=480

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

### Database Functions Reference

Key functions created by migrations:

- `convert_ticket_to_artifact(...)` - Converts tickets with transaction support
- `search_duplicate_tickets(...)` - Vector similarity search
- `merge_tickets(...)` - Merges duplicate tickets
- `get_sla_breached_tickets()` - Returns tickets with SLA breaches
- `regenerate_ticket_embeddings()` - Regenerates AI embeddings

---

**Deployment completed successfully! ✅**

Next steps:
1. Monitor for 24 hours
2. Gather user feedback
3. Tune AI thresholds if needed
4. Scale resources based on usage