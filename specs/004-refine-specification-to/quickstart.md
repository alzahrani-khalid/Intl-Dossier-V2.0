# Quickstart: System Requirements Refinement and Clarification

**Feature**: 004-refine-specification-to
**Date**: 2025-09-27
**Prerequisites**: Docker, Node.js 18+, PostgreSQL 15 with pgvector

## Overview
This quickstart validates the refined system requirements implementation by testing key scenarios from the specification, including AI fallback mechanisms, rate limiting, auto-scaling, and report generation.

## Test Scenarios

### 1. Vector Embedding with Fallback (FR-003, FR-006, FR-008a)
**Scenario**: Create intelligence report when AnythingLLM is unavailable

```bash
# Stop AnythingLLM service to simulate failure
docker-compose stop anythingllm

# Create intelligence report
curl -X POST http://localhost:3000/api/intelligence-reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Report",
    "content": "Intelligence analysis content",
    "data_sources": ["source1"],
    "confidence_score": 85
  }'

# Expected: Report created with embedding_status: "pending"
# Verify document stored without embeddings

# Start AnythingLLM service
docker-compose start anythingllm

# Verify background job processes pending embeddings
docker logs backend-worker | grep "Processing pending embeddings"
```

### 2. Rate Limiting for Different User Types (FR-009, FR-013a)
**Scenario**: Test authenticated vs anonymous rate limits

```bash
# Test authenticated user rate limit (300 req/min)
for i in {1..301}; do
  curl -X GET http://localhost:3000/api/intelligence-reports \
    -H "Authorization: Bearer $TOKEN" \
    -w "\n%{http_code}\n"
done
# Expected: 300 requests succeed, 301st returns 429 with Retry-After header

# Test anonymous user rate limit (50 req/min)
for i in {1..51}; do
  curl -X GET http://localhost:3000/api/intelligence-reports \
    -w "\n%{http_code}\n"
done
# Expected: 50 requests succeed, 51st returns 429
```

### 3. Auto-Scaling Behavior (FR-016, FR-017, FR-019a)
**Scenario**: Trigger scaling and test degradation at max capacity

```bash
# Monitor current instances
docker-compose ps | grep backend | wc -l

# Generate load to trigger CPU > 70%
ab -n 10000 -c 100 http://localhost:3000/api/intelligence-reports

# Wait 5 minutes and check scaling
docker-compose ps | grep backend | wc -l
# Expected: Instance count increases

# Simulate max capacity (20 instances)
docker-compose scale backend=20

# Continue load testing
ab -n 50000 -c 500 http://localhost:3000/api/intelligence-reports

# Check for degradation alerts
docker logs monitoring | grep "ALERT: Max scaling limit reached"
# Expected: Alert triggered, non-critical features disabled
```

### 4. Search with Partial Results (FR-020, FR-025a)
**Scenario**: Complex search with filter timeout

```bash
# Create search with multiple filters and low timeout
curl -X POST http://localhost:3000/api/intelligence-reports/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "terrorism threat",
    "filters": {
      "date_range": {"from": "2020-01-01", "to": "2025-12-31"},
      "status": ["approved"],
      "priority": ["high", "critical"],
      "custom_tags": ["urgent", "verified"]
    },
    "timeout_ms": 100
  }'

# Expected response:
# {
#   "results": [...],
#   "partial_results": true,
#   "failed_filters": ["custom_tags"]
# }
```

### 5. Report Generation with Multiple Formats (FR-026, FR-029)
**Scenario**: Generate executive report in different formats

```bash
# Create report template
TEMPLATE_ID=$(curl -X POST http://localhost:3000/api/reports/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Executive Summary",
    "report_type": "executive",
    "include_metrics": true,
    "include_trends": true,
    "include_charts": true,
    "supported_formats": ["pdf", "excel", "csv", "json"],
    "template_content": "<template>{{content}}</template>"
  }' | jq -r '.id')

# Generate PDF report
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"template_id\": \"$TEMPLATE_ID\",
    \"format\": \"pdf\"
  }" \
  --output report.pdf

# Generate Excel report
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"template_id\": \"$TEMPLATE_ID\",
    \"format\": \"excel\"
  }" \
  --output report.xlsx

# Verify files created and valid
file report.pdf  # Expected: PDF document
file report.xlsx # Expected: Microsoft Excel 2007+
```

### 6. Intelligence Report Retention (FR-046)
**Scenario**: Test 90-day active to archive transition

```bash
# Create report with backdated timestamp (91 days ago)
curl -X POST http://localhost:3000/api/admin/create-backdated-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Old Report",
    "created_at": "2024-12-27T00:00:00Z"
  }'

# Run archive job
docker exec backend npm run archive:reports

# Verify report moved to archive
curl -X GET http://localhost:3000/api/intelligence-reports?status=archived \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].archived_at'
# Expected: Current timestamp
```

### 7. Browser Compatibility Check (FR-037, FR-038)
**Scenario**: Test cross-browser functionality

```bash
# Run Playwright cross-browser tests
npm run test:e2e:browsers

# Expected output:
# ✓ Chrome 90+: All tests passed
# ✓ Firefox 88+: All tests passed  
# ✓ Safari 14+: All tests passed
# ✓ Edge 90+: All tests passed
```

### 8. Bilingual Support with RTL/LTR
**Scenario**: Test Arabic and English content handling

```bash
# Create bilingual report
curl -X POST http://localhost:3000/api/intelligence-reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Security Report",
    "title_ar": "تقرير الأمن",
    "content": "Security analysis content",
    "content_ar": "محتوى تحليل الأمن",
    "data_sources": ["source1"]
  }'

# Search in Arabic
curl -X POST http://localhost:3000/api/intelligence-reports/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept-Language: ar" \
  -d '{
    "query": "تقرير الأمن"
  }'
# Expected: Returns bilingual report with Arabic content prioritized
```

## Performance Validation

### Search Performance (FR-020, constraint: <2s for 100k records)
```bash
# Seed 100k test records
docker exec backend npm run seed:test-data -- --count=100000

# Measure search performance
time curl -X POST http://localhost:3000/api/intelligence-reports/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "test query",
    "filters": {
      "date_range": {"from": "2024-01-01", "to": "2025-12-31"}
    }
  }'
# Expected: real time < 2.0s
```

### System Load Test (FR-014, FR-015)
```bash
# Test 1000 concurrent users
locust -f tests/load/locustfile.py \
  --host=http://localhost:3000 \
  --users=1000 \
  --spawn-rate=50 \
  --time=5m

# Expected:
# - No errors
# - 10,000+ requests/minute achieved
# - Response time p95 < 2s
```

## Security Validation

### Test Coverage Check (FR-032, FR-033)
```bash
# Run tests with coverage
npm run test:coverage

# Expected output:
# Unit Test Coverage: 82% (>80% ✓)
# Integration Test Coverage: 72% (>70% ✓)
# Coverage report generated at: coverage/index.html
```

### Accessibility Audit (WCAG 2.1 Level AA)
```bash
# Run accessibility tests
npm run test:a11y

# Expected: 
# ✓ All WCAG 2.1 Level AA criteria passed
# ✓ Keyboard navigation functional
# ✓ Screen reader compatible
# ✓ ARIA labels present
```

## Monitoring Setup

### Check Monitoring Services
```bash
# Verify all monitoring services running
docker-compose -f docker-compose.monitoring.yml ps

# Expected services:
# - prometheus (metrics)
# - grafana (dashboards)
# - alertmanager (alerts)

# Access dashboards
open http://localhost:3001  # Grafana
open http://localhost:9090  # Prometheus
```

## Troubleshooting

### Common Issues

1. **AnythingLLM not responding**
   ```bash
   docker logs anythingllm
   docker-compose restart anythingllm
   ```

2. **Rate limit not resetting**
   ```bash
   docker exec redis redis-cli FLUSHALL
   docker-compose restart backend
   ```

3. **Scaling not triggering**
   ```bash
   # Check metrics
   curl http://localhost:9090/api/v1/query?query=container_cpu_usage
   # Adjust thresholds if needed
   ```

4. **Search timeout issues**
   ```bash
   # Check pgvector indexes
   docker exec postgres psql -U postgres -c "SELECT * FROM pg_indexes WHERE tablename='vector_embeddings';"
   # Rebuild if needed
   docker exec backend npm run db:rebuild-indexes
   ```

## Success Criteria

✅ All test scenarios pass without errors
✅ Performance benchmarks met (<2s search, 10k req/min)
✅ Security requirements validated (rate limiting, auth)
✅ Fallback mechanisms working (AI offline handling)
✅ Browser compatibility confirmed (4 major browsers)
✅ Bilingual support functional (RTL/LTR switching)
✅ Test coverage above thresholds (80% unit, 70% integration)
✅ Monitoring and alerting operational

---
*Quickstart validation complete when all success criteria are met*