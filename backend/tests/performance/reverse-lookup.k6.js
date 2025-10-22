/**
 * Performance Test: Reverse Lookup for Entity-to-Intake Links
 *
 * Purpose: Validate reverse lookup performance meets <2s target for 1000+ intakes (SC-004)
 *
 * Test Scenarios:
 * 1. Reverse lookup with 100 intakes linked to entity
 * 2. Reverse lookup with 1,000 intakes linked to entity
 * 3. Reverse lookup with filtering by link_type
 * 4. Reverse lookup with pagination (50 per page)
 * 5. Concurrent reverse lookups (10 users querying same entity)
 *
 * Success Criteria:
 * - p95 response time < 2000ms for 1000+ intakes
 * - p50 response time < 1000ms
 * - No errors under load
 *
 * Run: k6 run backend/tests/performance/reverse-lookup.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const reverseLookupErrors = new Rate('reverse_lookup_errors');
const reverseLookupDuration = new Trend('reverse_lookup_duration');
const paginationDuration = new Trend('pagination_duration');
const filteringDuration = new Trend('filtering_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },  // Ramp up to 5 concurrent users
    { duration: '1m', target: 10 },  // Increase to 10 concurrent users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    'reverse_lookup_errors': ['rate<0.01'], // Error rate < 1%
    'reverse_lookup_duration': ['p(95)<2000'], // p95 < 2 seconds (SC-004)
    'http_req_duration': ['p(50)<1000', 'p(95)<2000'], // p50 < 1s, p95 < 2s
  },
};

// Environment variables
const SUPABASE_URL = __ENV.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// Test data (should be seeded before running test)
const TEST_ENTITY_TYPE = 'dossier';
const TEST_ENTITY_ID = __ENV.TEST_ENTITY_ID || ''; // Provide via env var
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''; // Provide via env var

/**
 * Setup function - runs once before test execution
 */
export function setup() {
  if (!TEST_ENTITY_ID) {
    throw new Error('TEST_ENTITY_ID environment variable is required');
  }
  if (!AUTH_TOKEN) {
    throw new Error('AUTH_TOKEN environment variable is required');
  }

  console.log('Starting reverse lookup performance test...');
  console.log(`Entity: ${TEST_ENTITY_TYPE}/${TEST_ENTITY_ID}`);
  console.log(`Target: <2s for 1000+ intakes (SC-004)`);

  return {
    entityType: TEST_ENTITY_TYPE,
    entityId: TEST_ENTITY_ID,
    authToken: AUTH_TOKEN,
  };
}

/**
 * Scenario 1: Basic reverse lookup (no filters)
 */
export function testBasicReverseLookup(data) {
  const url = `${API_BASE_URL}/entities/${data.entityType}/${data.entityId}/intakes`;

  const params = {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - startTime;

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has success field': (r) => JSON.parse(r.body).success === true,
    'has data array': (r) => Array.isArray(JSON.parse(r.body).data),
    'has pagination': (r) => JSON.parse(r.body).pagination !== undefined,
    'response time < 2s': (r) => duration < 2000,
  });

  // Track metrics
  reverseLookupDuration.add(duration);
  reverseLookupErrors.add(!success);

  if (!success) {
    console.error(`Basic reverse lookup failed: ${response.status} ${response.body}`);
  }

  return response;
}

/**
 * Scenario 2: Reverse lookup with link_type filtering
 */
export function testFilteredReverseLookup(data) {
  const linkTypes = ['primary', 'related', 'mentioned', 'requested'];
  const randomLinkType = linkTypes[Math.floor(Math.random() * linkTypes.length)];

  const url = `${API_BASE_URL}/entities/${data.entityType}/${data.entityId}/intakes?link_type=${randomLinkType}`;

  const params = {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - startTime;

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'filtered results match link_type': (r) => {
      const body = JSON.parse(r.body);
      return body.data.every(item => item.link_type === randomLinkType);
    },
    'response time < 2s': (r) => duration < 2000,
  });

  filteringDuration.add(duration);
  reverseLookupErrors.add(!success);

  if (!success) {
    console.error(`Filtered reverse lookup failed: ${response.status} ${response.body}`);
  }

  return response;
}

/**
 * Scenario 3: Reverse lookup with pagination
 */
export function testPaginatedReverseLookup(data) {
  const limit = 50; // Default page size
  const offset = Math.floor(Math.random() * 5) * limit; // Random page (0-4)

  const url = `${API_BASE_URL}/entities/${data.entityType}/${data.entityId}/intakes?limit=${limit}&offset=${offset}`;

  const params = {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - startTime;

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'results limited correctly': (r) => {
      const body = JSON.parse(r.body);
      return body.data.length <= limit;
    },
    'pagination metadata present': (r) => {
      const body = JSON.parse(r.body);
      return body.pagination &&
             body.pagination.limit === limit &&
             body.pagination.offset === offset;
    },
    'response time < 2s': (r) => duration < 2000,
  });

  paginationDuration.add(duration);
  reverseLookupErrors.add(!success);

  if (!success) {
    console.error(`Paginated reverse lookup failed: ${response.status} ${response.body}`);
  }

  return response;
}

/**
 * Scenario 4: Reverse lookup with multiple link_types
 */
export function testMultiTypeLookup(data) {
  const url = `${API_BASE_URL}/entities/${data.entityType}/${data.entityId}/intakes?link_type=primary,related`;

  const params = {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - startTime;

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'filtered results match multiple link_types': (r) => {
      const body = JSON.parse(r.body);
      return body.data.every(item => ['primary', 'related'].includes(item.link_type));
    },
    'response time < 2s': (r) => duration < 2000,
  });

  reverseLookupDuration.add(duration);
  reverseLookupErrors.add(!success);

  return response;
}

/**
 * Main test execution - runs for each VU iteration
 */
export default function (data) {
  // Mix of scenarios (realistic user behavior)
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Basic reverse lookup
    testBasicReverseLookup(data);
  } else if (scenario < 0.7) {
    // 30% - Filtered reverse lookup
    testFilteredReverseLookup(data);
  } else if (scenario < 0.9) {
    // 20% - Paginated reverse lookup
    testPaginatedReverseLookup(data);
  } else {
    // 10% - Multi-type lookup
    testMultiTypeLookup(data);
  }

  // Think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

/**
 * Teardown function - runs once after test execution
 */
export function teardown(data) {
  console.log('Reverse lookup performance test completed');
  console.log('Check thresholds for success criteria');
}

/**
 * Usage Instructions:
 *
 * 1. Seed test data first:
 *    - Create a test dossier
 *    - Link 1000+ intake tickets to this dossier
 *    - Get entity_id and auth_token
 *
 * 2. Run test:
 *    TEST_ENTITY_ID=<entity-id> AUTH_TOKEN=<token> k6 run backend/tests/performance/reverse-lookup.k6.js
 *
 * 3. Expected output:
 *    ✓ reverse_lookup_errors.............: 0.00%
 *    ✓ reverse_lookup_duration (p95).....: <2000ms
 *    ✓ http_req_duration (p50)............: <1000ms
 *    ✓ http_req_duration (p95)............: <2000ms
 *
 * 4. If test fails:
 *    - Check database indexes (entity_type, entity_id, deleted_at)
 *    - Verify Redis cache is enabled
 *    - Check query optimization in link.service.ts
 *    - Review RLS policy performance
 */
