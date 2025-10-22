/**
 * Performance Test: Batch Link Creation
 *
 * Purpose: Validate batch operation performance meets target (<500ms for 50 links - SC-003)
 * This test should FAIL initially (TDD approach) before implementation
 *
 * Tests cover:
 * - T081: Performance test for batch create 50 links (<500ms target)
 *
 * Contract Reference: specs/024-intake-entity-linking/contracts/intake-entity-links-api.yaml
 *
 * Run with: k6 run backend/tests/performance/batch-operations.k6.js
 */

import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const batchCreateDuration = new Trend('batch_create_duration');
const batchCreateSuccessRate = new Rate('batch_create_success_rate');
const linksCreatedTotal = new Counter('links_created_total');
const linksFailedTotal = new Counter('links_failed_total');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 1 },   // Warm-up: 1 virtual user
    { duration: '30s', target: 10 },  // Ramp-up: 10 virtual users
    { duration: '1m', target: 10 },   // Sustained load: 10 virtual users
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // Performance target: <500ms for 50 links (SC-003)
    'batch_create_duration': ['p(95)<500'], // 95th percentile must be under 500ms
    'batch_create_success_rate': ['rate>0.95'], // 95% success rate minimum
    'http_req_failed': ['rate<0.1'], // Less than 10% request failures
    'http_req_duration': ['p(95)<1000'], // Overall HTTP duration under 1s
  },
};

// Environment variables
const SUPABASE_URL = __ENV.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// Test data setup (run once at start)
export function setup() {
  // In real implementation, this would:
  // 1. Create test organization
  // 2. Create test user and get auth token
  // 3. Create test intake ticket
  // 4. Create 50+ test entities to link to

  // For now, return mock setup data
  return {
    authToken: 'test-token-placeholder', // Replace with actual auth token
    intakeId: '00000000-0000-0000-0000-000000000001', // Replace with actual intake ID
    entities: Array(50).fill(null).map((_, i) => ({
      entity_type: i % 3 === 0 ? 'dossier' : i % 3 === 1 ? 'position' : 'mou',
      entity_id: `00000000-0000-0000-0000-00000000${String(i).padStart(4, '0')}`,
      link_type: i === 0 ? 'primary' : 'related',
    })),
  };
}

// Main test scenario
export default function (data) {
  const { authToken, intakeId, entities } = data;

  group('Batch Link Creation Performance (50 links)', () => {
    // Prepare batch request with 50 links
    const links = entities.map(entity => ({
      intake_id: intakeId,
      entity_type: entity.entity_type,
      entity_id: entity.entity_id,
      link_type: entity.link_type,
      source: 'human',
      notes: `Performance test link ${entity.entity_id}`,
    }));

    const payload = JSON.stringify({ links });

    const params = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };

    // Execute batch create request
    const startTime = Date.now();
    const response = http.post(
      `${API_BASE_URL}/intake/${intakeId}/links/batch`,
      payload,
      params
    );
    const duration = Date.now() - startTime;

    // Record metrics
    batchCreateDuration.add(duration);

    // Validate response
    const success = check(response, {
      'status is 201': (r) => r.status === 201,
      'response has success=true': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
      'duration under 500ms (SC-003)': () => duration < 500,
      'all 50 links created': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.meta?.succeeded_count === 50;
        } catch {
          return false;
        }
      },
      'no failures': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.meta?.failed_count === 0;
        } catch {
          return false;
        }
      },
    });

    batchCreateSuccessRate.add(success);

    // Parse response and update counters
    try {
      const body = JSON.parse(response.body);
      if (body.meta) {
        linksCreatedTotal.add(body.meta.succeeded_count || 0);
        linksFailedTotal.add(body.meta.failed_count || 0);
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
    }

    // Log performance metrics
    if (duration >= 500) {
      console.warn(`⚠️ Batch create exceeded 500ms target: ${duration}ms`);
    }
  });

  group('Batch Link Creation Performance (10 links)', () => {
    // Test with smaller batch size
    const links = entities.slice(0, 10).map(entity => ({
      intake_id: intakeId,
      entity_type: entity.entity_type,
      entity_id: entity.entity_id,
      link_type: 'related',
      source: 'human',
    }));

    const payload = JSON.stringify({ links });

    const params = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };

    const startTime = Date.now();
    const response = http.post(
      `${API_BASE_URL}/intake/${intakeId}/links/batch`,
      payload,
      params
    );
    const duration = Date.now() - startTime;

    batchCreateDuration.add(duration);

    check(response, {
      'status is 201': (r) => r.status === 201,
      'duration under 200ms (small batch)': () => duration < 200,
      'all 10 links created': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.meta?.succeeded_count === 10;
        } catch {
          return false;
        }
      },
    });
  });

  group('Batch Link Creation with Failures', () => {
    // Test partial failures performance
    const links = [
      ...entities.slice(0, 5).map(entity => ({
        intake_id: intakeId,
        entity_type: entity.entity_type,
        entity_id: entity.entity_id,
        link_type: 'related',
        source: 'human',
      })),
      // Add some invalid links
      {
        intake_id: intakeId,
        entity_type: 'dossier',
        entity_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        link_type: 'related',
        source: 'human',
      },
    ];

    const payload = JSON.stringify({ links });

    const params = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };

    const startTime = Date.now();
    const response = http.post(
      `${API_BASE_URL}/intake/${intakeId}/links/batch`,
      payload,
      params
    );
    const duration = Date.now() - startTime;

    batchCreateDuration.add(duration);

    check(response, {
      'status is 201 (partial success)': (r) => r.status === 201,
      'duration under 500ms (with failures)': () => duration < 500,
      'has succeeded array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data?.succeeded);
        } catch {
          return false;
        }
      },
      'has failed array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data?.failed);
        } catch {
          return false;
        }
      },
    });
  });
}

// Cleanup after test (run once at end)
export function teardown(data) {
  // In real implementation, this would:
  // 1. Delete all created test links
  // 2. Delete test intake ticket
  // 3. Delete test entities
  // 4. Delete test organization
  // 5. Delete test user

  console.log('Test completed. Cleanup would run here.');
}

// Summary reporter
export function handleSummary(data) {
  const summary = {
    'Test Duration': `${data.metrics.iteration_duration.avg.toFixed(2)}ms avg`,
    'Batch Create Duration (p95)': `${data.metrics.batch_create_duration.values['p(95)'].toFixed(2)}ms`,
    'Batch Create Success Rate': `${(data.metrics.batch_create_success_rate.values.rate * 100).toFixed(2)}%`,
    'Total Links Created': data.metrics.links_created_total.values.count,
    'Total Links Failed': data.metrics.links_failed_total.values.count,
    'HTTP Failures': `${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
  };

  console.log('\n========== Performance Test Summary ==========');
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  console.log('==============================================\n');

  // Return results for potential CI/CD integration
  return {
    'stdout': JSON.stringify(summary, null, 2),
    'summary.json': JSON.stringify(data, null, 2),
  };
}
