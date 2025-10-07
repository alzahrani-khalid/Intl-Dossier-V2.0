import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * Load Test: 100+ Concurrent Users - T094
 * Simulates realistic user load on position management system
 *
 * Scenarios:
 * - 100 virtual users ramping up over 2 minutes
 * - Sustained load for 5 minutes
 * - Ramp down over 1 minute
 * - Mix of read/write operations
 *
 * Success Criteria:
 * - p95 response time < 500ms
 * - Error rate < 1%
 * - System remains stable
 */

// Custom metrics
const errorRate = new Rate('errors');

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.01'],             // Error rate under 1%
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = __ENV.SUPABASE_ANON_KEY || '';

// User credentials for test accounts
const TEST_USERS = [
  { email: 'drafter1@gastat.gov.sa', password: 'TestPassword123!' },
  { email: 'drafter2@gastat.gov.sa', password: 'TestPassword123!' },
  { email: 'approver1@gastat.gov.sa', password: 'TestPassword123!' },
];

export function setup() {
  // Setup: Login and get auth tokens for test users
  const tokens: string[] = [];

  for (const user of TEST_USERS) {
    const loginRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: user.email,
        password: user.password,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
      }
    );

    if (loginRes.status === 200) {
      const authData = JSON.parse(loginRes.body as string);
      tokens.push(authData.access_token);
    }
  }

  return { tokens };
}

export default function (data: { tokens: string[] }) {
  // Select random user token
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token}`,
  };

  // Simulate realistic user behavior with weighted scenarios

  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - List positions (most common action)
    listPositions(headers);
  } else if (scenario < 0.6) {
    // 20% - View position details
    viewPosition(headers);
  } else if (scenario < 0.75) {
    // 15% - Create new position
    createPosition(headers);
  } else if (scenario < 0.85) {
    // 10% - Update position
    updatePosition(headers);
  } else if (scenario < 0.95) {
    // 10% - Consistency check
    consistencyCheck(headers);
  } else {
    // 5% - Approval action
    approvePosition(headers);
  }

  // Think time between actions (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

function listPositions(headers: Record<string, string>) {
  const res = http.get(
    `${BASE_URL}/rest/v1/positions?select=id,title_en,title_ar,status,created_at&order=created_at.desc&limit=20`,
    { headers }
  );

  check(res, {
    'list positions status 200': (r) => r.status === 200,
    'list positions duration < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);
}

function viewPosition(headers: Record<string, string>) {
  // In real scenario, we'd use actual position IDs
  // For load test, we can use a known test position ID
  const testPositionId = '123e4567-e89b-12d3-a456-426614174000';

  const res = http.get(
    `${BASE_URL}/rest/v1/positions?id=eq.${testPositionId}&select=*`,
    { headers }
  );

  check(res, {
    'view position status 200': (r) => r.status === 200,
    'view position duration < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);
}

function createPosition(headers: Record<string, string>) {
  const payload = JSON.stringify({
    position_type: 'talking_point',
    title_en: `Load Test Position ${Date.now()}`,
    title_ar: `موقف اختبار الحمل ${Date.now()}`,
    content_en: 'This is a load test position',
    content_ar: 'هذا موقف اختبار الحمل',
    thematic_category: 'economic',
    status: 'draft',
  });

  const res = http.post(
    `${BASE_URL}/rest/v1/positions`,
    payload,
    { headers }
  );

  check(res, {
    'create position status 201': (r) => r.status === 201,
    'create position duration < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);
}

function updatePosition(headers: Record<string, string>) {
  const testPositionId = '123e4567-e89b-12d3-a456-426614174000';

  const payload = JSON.stringify({
    content_en: `Updated at ${Date.now()}`,
    updated_at: new Date().toISOString(),
  });

  const res = http.patch(
    `${BASE_URL}/rest/v1/positions?id=eq.${testPositionId}`,
    payload,
    { headers }
  );

  check(res, {
    'update position status 200 or 204': (r) => r.status === 200 || r.status === 204,
    'update position duration < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);
}

function consistencyCheck(headers: Record<string, string>) {
  const testPositionId = '123e4567-e89b-12d3-a456-426614174000';

  const payload = JSON.stringify({
    position_id: testPositionId,
    check_trigger: 'manual',
    consistency_score: 85,
    conflicts: [],
  });

  const res = http.post(
    `${BASE_URL}/rest/v1/consistency_checks`,
    payload,
    { headers }
  );

  check(res, {
    'consistency check status 201': (r) => r.status === 201,
    'consistency check duration < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
}

function approvePosition(headers: Record<string, string>) {
  const testPositionId = '123e4567-e89b-12d3-a456-426614174000';

  const payload = JSON.stringify({
    position_id: testPositionId,
    stage: 1,
    action: 'approve',
    step_up_verified: true,
    comments: 'Approved in load test',
  });

  const res = http.post(
    `${BASE_URL}/rest/v1/approvals`,
    payload,
    { headers }
  );

  check(res, {
    'approve position status 201': (r) => r.status === 201,
    'approve position duration < 400ms': (r) => r.timings.duration < 400,
  }) || errorRate.add(1);
}

export function teardown(data: { tokens: string[] }) {
  console.log('Load test completed');
  console.log(`Tested with ${data.tokens.length} user accounts`);
}
