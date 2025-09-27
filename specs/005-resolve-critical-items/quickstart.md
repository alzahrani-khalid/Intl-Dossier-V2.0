# Quickstart: Security Enhancement and System Hardening

## Prerequisites

- Docker and Docker Compose installed
- Supabase project configured
- Node.js 18+ and npm installed
- Access to Saudi-based infrastructure

## 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/gastat/intl-dossier.git
cd intl-dossier

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure Supabase connection
export SUPABASE_URL="your-project-url"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_KEY="your-service-key"
```

## 2. Database Setup

```bash
# Apply security migrations
npm run db:migrate

# Verify RLS policies are active
npm run db:verify-rls

# Seed test data (development only)
npm run db:seed
```

## 3. MFA Configuration

### Enable MFA for Users

```typescript
// Initialize MFA enrollment
const { data: enrollment } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});

// Display QR code to user
console.log('Scan this QR code:', enrollment.qr_code);
console.log('Save these backup codes:', enrollment.backup_codes);

// Verify TOTP code
const { data: verification } = await supabase.auth.mfa.verify({
  factorId: enrollment.id,
  code: '123456' // 6-digit code from authenticator app
});
```

### Test MFA Flow

```bash
# Run MFA tests
npm run test:mfa

# Expected output:
# ✓ MFA enrollment successful
# ✓ TOTP verification working
# ✓ Backup codes functional
# ✓ Recovery flow operational
```

## 4. Monitoring Setup

### Deploy Monitoring Stack

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker ps | grep -E "prometheus|grafana|alertmanager"

# Access dashboards
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093
```

### Configure Alerts

```typescript
// Create alert configuration
const alert = await createAlert({
  name: 'High CPU Usage',
  name_ar: 'استخدام عالي للمعالج',
  condition: 'avg(cpu_usage) > 0.7',
  threshold: 0.7,
  severity: 'high',
  channels: ['email', 'webhook']
});

// Test alert triggering
npm run test:alerts
```

## 5. Accessibility Testing

### Run WCAG Compliance Checks

```bash
# Run automated accessibility tests
npm run test:a11y

# Expected compliance areas:
# ✓ Color contrast ratios meet WCAG AA
# ✓ All interactive elements keyboard accessible
# ✓ ARIA labels properly configured
# ✓ Screen reader compatible
```

### Manual Testing Checklist

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test skip links functionality

2. **Screen Reader**
   - Enable VoiceOver (Mac) or NVDA (Windows)
   - Navigate through main sections
   - Verify announcements are clear and bilingual

3. **Visual Modes**
   - Test high contrast mode
   - Verify large text option
   - Check reduce motion setting

## 6. Export Functionality

### Test Export Features

```typescript
// Request data export
const exportRequest = await requestExport({
  resource_type: 'dossiers',
  format: 'excel',
  filters: {
    status: 'active',
    country: 'SA'
  }
});

// Check export status
const status = await getExportStatus(exportRequest.id);
console.log('Export progress:', status.progress);

// Download when ready
if (status.status === 'completed') {
  const file = await downloadExport(exportRequest.id);
  // File downloaded
}
```

### Verify Export Limits

```bash
# Test large export (100k records)
npm run test:export-large

# Should complete within 30 seconds
# Verify file integrity and format
```

## 7. Security Verification

### RLS Policy Testing

```sql
-- Switch to test user context
SET LOCAL role TO 'test_user';
SET LOCAL request.jwt.claim.sub TO 'user-uuid';

-- Attempt to access restricted data
SELECT * FROM sensitive_data;
-- Should return only user's own data

-- Verify deny-by-default
SELECT * FROM protected_table;
-- Should return empty if no explicit allow policy
```

### Audit Log Verification

```bash
# Generate security events
npm run test:security-events

# Query audit logs
npm run audit:query --severity=critical --last=24h

# Verify all events logged:
# - Login attempts
# - MFA challenges
# - Data access
# - Configuration changes
```

## 8. Anomaly Detection

### Configure ML Model

```typescript
// Initialize anomaly detection
const detector = new AnomalyDetector({
  sensitivity: 'medium',
  algorithm: 'isolation_forest'
});

// Train on baseline data
await detector.train(baselineData);

// Start monitoring
detector.startMonitoring({
  onAnomaly: (pattern) => {
    console.log('Anomaly detected:', pattern);
    // Trigger alert
  }
});
```

### Test Detection

```bash
# Simulate anomalous behavior
npm run test:anomaly-simulation

# Check detection results
npm run anomaly:report

# Verify:
# ✓ Anomalies detected within threshold
# ✓ False positive rate < 5%
# ✓ Alerts triggered correctly
```

## 9. Clustering Analysis

### Run K-means Clustering

```typescript
// Prepare data for clustering
const data = await prepareClusteringData();

// Run clustering with optimization
const result = await runClustering({
  dataset_id: 'dossiers-2024',
  data: data,
  cluster_count: 5, // Will auto-optimize if silhouette < 0.6
  auto_optimize: true
});

console.log('Clusters:', result.cluster_count);
console.log('Silhouette score:', result.silhouette_score);
```

### Verify Results

```bash
# Run clustering validation
npm run test:clustering

# Expected:
# ✓ Silhouette score ≥ 0.6
# ✓ Clusters between 3-10
# ✓ Results persisted to database
```

## 10. Autoscaling Test

### Simulate Load

```bash
# Generate load to trigger autoscaling
npm run load:test --rps=1000 --duration=10m

# Monitor scaling events
docker service ls

# Verify:
# ✓ Scaling triggered at CPU > 70%
# ✓ New instances launched within 2 minutes
# ✓ Service remains available during scaling
# ✓ Graceful degradation at max capacity
```

## 11. End-to-End Validation

### Run Full Test Suite

```bash
# Execute all tests
npm run test:all

# Coverage report
npm run coverage

# Verify thresholds:
# ✓ Unit tests ≥ 80%
# ✓ Integration tests ≥ 70%
# ✓ All critical paths covered
```

### Performance Benchmarks

```bash
# Run performance tests
npm run perf:test

# Verify targets:
# ✓ MFA verification < 30s
# ✓ RLS overhead < 20%
# ✓ Export 100k records < 30s
# ✓ Alert latency < 60s
# ✓ Autoscale response < 2min
# ✓ Anomaly detection false positive < 5%
# ✓ Page load impact < 10%
```

## 12. Production Readiness Checklist

- [ ] All migrations applied successfully
- [ ] RLS policies active and tested
- [ ] MFA enabled for admin accounts
- [ ] Monitoring dashboards configured
- [ ] Alert rules defined and tested
- [ ] Backup codes generated and stored securely
- [ ] Accessibility compliance validated
- [ ] Export functionality verified
- [ ] Anomaly detection calibrated
- [ ] Clustering parameters optimized
- [ ] Autoscaling tested under load
- [ ] Audit logging operational
- [ ] Security headers configured
- [ ] TLS 1.3+ enforced
- [ ] Coverage thresholds met
- [ ] Performance targets achieved
- [ ] Bilingual content verified
- [ ] Docker health checks passing
- [ ] Resource limits configured
- [ ] Documentation updated

## Troubleshooting

### MFA Issues

```bash
# Check MFA enrollment status
npm run mfa:status --user=<user-id>

# Reset MFA for user (admin only)
npm run mfa:reset --user=<user-id>

# Regenerate backup codes
npm run mfa:regenerate-codes --user=<user-id>
```

### Alert Not Triggering

```bash
# Check alert configuration
npm run alerts:debug --name="Alert Name"

# Test alert manually
npm run alerts:test --name="Alert Name"

# View alert history
npm run alerts:history --last=7d
```

### Export Failures

```bash
# Check export queue
npm run export:queue

# Retry failed export
npm run export:retry --id=<export-id>

# Clear expired exports
npm run export:cleanup
```

### Performance Issues

```bash
# Analyze RLS policy performance
npm run db:explain-rls

# Check index usage
npm run db:index-usage

# Monitor query performance
npm run db:slow-queries
```

## Support

For issues or questions:
- Documentation: `/docs/security-features.md`
- API Reference: `/specs/005-resolve-critical-items/contracts/`
- Monitoring: Check Grafana dashboards
- Logs: `docker logs <service-name>`

---

**Security Notice**: This system handles sensitive government data. Ensure all security features are properly configured and tested before production deployment.