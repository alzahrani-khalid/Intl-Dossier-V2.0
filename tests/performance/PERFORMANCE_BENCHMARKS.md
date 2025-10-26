# Performance Benchmarks - Unified Dossier Architecture

**Task**: T149 - Performance benchmarking  
**Date**: 2025-01-23  
**Status**: Test scripts created, ready for execution

## Performance Targets (from Success Criteria)

| Target | Performance Goal | Test Method |
|--------|-----------------|-------------|
| SC-003 | Graph traversal < 2s for 5 degrees | k6 load test |
| SC-004 | Search < 1s for 95% queries (10k+ entities) | k6 load test |
| SC-012 | Visualization < 3s for 50+ entities | k6 + browser timing |

## Test Environment Requirements

### Database Setup
- Minimum 10,000 dossiers across all types
- Relationship network with 5+ degree depth
- Realistic data distribution (countries: 200, orgs: 3000, etc.)

### Load Testing Tool
```bash
# Install k6
brew install k6  # macOS
# or
curl https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz -L | tar xvz
```

## Test 1: Graph Traversal Performance

**Target**: < 2 seconds for 5-degree network traversal (SC-003)

### Test Script: `graph-traversal.k6.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const graphQueryDuration = new Trend('graph_query_duration');
const successRate = new Rate('success_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'graph_query_duration': ['p(95)<2000'], // 95th percentile < 2s
    'success_rate': ['rate>0.95'],          // 95% success rate
  },
};

// Environment variables
const BASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const API_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';

// Sample dossier IDs (replace with actual IDs from your database)
const DOSSIER_IDS = [
  'dossier-id-1',
  'dossier-id-2',
  'dossier-id-3',
  // Add more IDs
];

export default function () {
  const dossierId = DOSSIER_IDS[Math.floor(Math.random() * DOSSIER_IDS.length)];
  
  const payload = JSON.stringify({
    start_dossier_id: dossierId,
    max_degrees: 5,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const start = new Date().getTime();
  const response = http.post(
    `${BASE_URL}/functions/v1/graph-traversal`,
    payload,
    params
  );
  const duration = new Date().getTime() - start;

  // Record metrics
  graphQueryDuration.add(duration);
  successRate.add(response.status === 200);

  // Validate response
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': () => duration < 2000,
    'returns nodes': (r) => JSON.parse(r.body).nodes.length > 0,
  });

  sleep(1);
}
```

### Execution
```bash
cd tests/performance
k6 run graph-traversal.k6.js
```

### Expected Output
```
✓ status is 200
✓ response time < 2s
✓ returns nodes

graph_query_duration.............: avg=1250ms min=800ms med=1200ms max=1900ms p(90)=1600ms p(95)=1800ms
success_rate.....................: 98.5% ✓ 197 ✗ 3
```

---

## Test 2: Unified Search Performance

**Target**: < 1 second for 95% of queries (SC-004)

### Test Script: `unified-search.k6.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const searchQueryDuration = new Trend('search_query_duration');
const successRate = new Rate('success_rate');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 concurrent users
    { duration: '2m', target: 20 },   // Sustained load
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'search_query_duration': ['p(95)<1000'], // 95th percentile < 1s
    'success_rate': ['rate>0.95'],
  },
};

const BASE_URL = __ENV.SUPABASE_URL;
const API_KEY = __ENV.SUPABASE_ANON_KEY;

// Common search queries
const SEARCH_QUERIES = [
  'Saudi',
  'Arabia',
  'climate',
  'trade',
  'ministry',
  'cooperation',
  'summit',
  'bilateral',
  'agreement',
  'policy',
];

export default function () {
  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
  
  const payload = JSON.stringify({
    query: query,
    type_filter: null,
    limit: 20,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const start = new Date().getTime();
  const response = http.post(
    `${BASE_URL}/functions/v1/search`,
    payload,
    params
  );
  const duration = new Date().getTime() - start;

  searchQueryDuration.add(duration);
  successRate.add(response.status === 200);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': () => duration < 1000,
    'returns results': (r) => JSON.parse(r.body).results.length > 0,
  });

  sleep(0.5);
}
```

### Execution
```bash
k6 run unified-search.k6.js
```

### Expected Output
```
✓ status is 200
✓ response time < 1s
✓ returns results

search_query_duration............: avg=650ms min=400ms med=600ms max=950ms p(90)=800ms p(95)=900ms
success_rate.....................: 99.2% ✓ 496 ✗ 4
```

---

## Test 3: Graph Visualization Performance

**Target**: < 3 seconds to load network of 50+ entities (SC-012)

### Test Script: `visualization.k6.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const vizLoadDuration = new Trend('visualization_load_duration');

export const options = {
  stages: [
    { duration: '1m', target: 5 },   // Low concurrent users (viz is heavy)
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'visualization_load_duration': ['p(95)<3000'], // 95th percentile < 3s
  },
};

const BASE_URL = __ENV.SUPABASE_URL;
const API_KEY = __ENV.SUPABASE_ANON_KEY;

// Dossier IDs with known large networks (50+ connected entities)
const LARGE_NETWORK_IDS = [
  'large-network-id-1',
  'large-network-id-2',
];

export default function () {
  const dossierId = LARGE_NETWORK_IDS[Math.floor(Math.random() * LARGE_NETWORK_IDS.length)];
  
  const payload = JSON.stringify({
    start_dossier_id: dossierId,
    max_degrees: 3, // 3 degrees to get 50+ nodes
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const start = new Date().getTime();
  const response = http.post(
    `${BASE_URL}/functions/v1/graph-traversal`,
    payload,
    params
  );
  const duration = new Date().getTime() - start;

  vizLoadDuration.add(duration);

  const body = JSON.parse(response.body);
  const nodeCount = body.nodes?.length || 0;

  check(response, {
    'status is 200': (r) => r.status === 200,
    'load time < 3s': () => duration < 3000,
    'returns 50+ nodes': () => nodeCount >= 50,
  });

  sleep(2);
}
```

### Execution
```bash
k6 run visualization.k6.js
```

---

## Additional Performance Tests

### Test 4: Database Query Analysis

Run EXPLAIN ANALYZE on critical queries:

```sql
-- Graph traversal query
EXPLAIN (ANALYZE, BUFFERS)
WITH RECURSIVE relationship_graph AS (
  SELECT source_dossier_id, target_dossier_id, relationship_type, 1 AS degree,
    ARRAY[source_dossier_id, target_dossier_id] AS path
  FROM dossier_relationships
  WHERE source_dossier_id = '<dossier-id>' AND status = 'active'
  UNION
  SELECT rg.source_dossier_id, dr.target_dossier_id, dr.relationship_type, rg.degree + 1,
    rg.path || dr.target_dossier_id
  FROM relationship_graph rg
  JOIN dossier_relationships dr ON dr.source_dossier_id = rg.target_dossier_id
  WHERE rg.degree < 5 AND NOT (dr.target_dossier_id = ANY(rg.path)) AND dr.status = 'active'
)
SELECT * FROM relationship_graph;

-- Search query
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, type, name_en, name_ar, ts_rank(search_vector, query) AS rank
FROM dossiers, to_tsquery('simple', 'climate | policy') AS query
WHERE search_vector @@ query AND status != 'deleted'
ORDER BY ts_rank(search_vector, query) DESC
LIMIT 20;
```

### Test 5: Index Usage Verification

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('dossiers', 'dossier_relationships', 'calendar_events')
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'dossier%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Performance Benchmark Results

### Test Execution Checklist

- [ ] Graph traversal test (p95 < 2s) - PASS/FAIL: _____
- [ ] Search performance test (p95 < 1s) - PASS/FAIL: _____
- [ ] Visualization load test (p95 < 3s) - PASS/FAIL: _____
- [ ] Database query analysis - COMPLETE/PENDING
- [ ] Index usage verification - COMPLETE/PENDING

### Results Summary

**Graph Traversal (SC-003)**:
- p50 (median): _____ ms
- p95 (95th percentile): _____ ms
- Target: < 2000ms
- Status: ✅ PASS / ❌ FAIL

**Unified Search (SC-004)**:
- p50 (median): _____ ms
- p95 (95th percentile): _____ ms
- Target: < 1000ms
- Status: ✅ PASS / ❌ FAIL

**Graph Visualization (SC-012)**:
- p50 (median): _____ ms
- p95 (95th percentile): _____ ms
- Target: < 3000ms
- Status: ✅ PASS / ❌ FAIL

---

## Optimization Recommendations

If performance targets not met, consider:

### Database Optimizations
1. **Indexes**: Add/modify indexes based on EXPLAIN ANALYZE output
2. **Statistics**: Run ANALYZE on dossiers, dossier_relationships tables
3. **Partitioning**: Consider partitioning large tables (10M+ rows)
4. **Materialized Views**: Cache expensive aggregations

### Application Optimizations
1. **Redis Caching**: Increase cache TTL for frequently accessed data
2. **Connection Pooling**: Optimize pg pool size
3. **Query Batching**: Batch multiple queries using DataLoader pattern
4. **Response Compression**: Enable gzip compression for large responses

### Frontend Optimizations
1. **Pagination**: Limit initial load to 50 nodes, expand on demand
2. **Debouncing**: Debounce search input (300ms)
3. **Virtual Scrolling**: Use react-window for large lists
4. **Code Splitting**: Lazy load React Flow only when needed

---

## Status

**Performance Benchmarking**: ✅ **Test scripts created**

**Action Required**: Execute k6 tests in staging environment with 10,000+ dossiers to validate performance targets.

**Test Execution Command**:
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Run all performance tests
k6 run tests/performance/graph-traversal.k6.js
k6 run tests/performance/unified-search.k6.js
k6 run tests/performance/visualization.k6.js
```

**Recommendation**: Performance tests created and ready for execution. Run in staging with production-scale data before final deployment.
