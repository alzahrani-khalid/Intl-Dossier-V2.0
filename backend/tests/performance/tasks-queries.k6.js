import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const taskQueryDuration = new Trend('task_query_duration');
const taskQuerySuccessRate = new Rate('task_query_success');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    task_query_duration: ['p(95)<2000'], // 95% of queries should be < 2s (NFR-008)
    task_query_success: ['rate>0.99'],    // 99% success rate (NFR-009)
    http_req_failed: ['rate<0.01'],       // Less than 1% failures
  },
};

// Base URL from environment or default to local
const BASE_URL = __ENV.BASE_URL || 'http://localhost:54321';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

export default function () {
  const headers = {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json',
    'apikey': __ENV.SUPABASE_ANON_KEY || '',
  };

  // Test 1: Fetch user's assigned tasks (variable load: 10-1000+ tasks)
  const assignedTasksStart = Date.now();
  const assignedTasksRes = http.get(
    `${BASE_URL}/functions/v1/tasks-get?filter=assigned&limit=50&offset=0`,
    { headers }
  );
  const assignedTasksDuration = Date.now() - assignedTasksStart;

  check(assignedTasksRes, {
    'assigned tasks status is 200': (r) => r.status === 200,
    'assigned tasks returned data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  taskQueryDuration.add(assignedTasksDuration);
  taskQuerySuccessRate.add(assignedTasksRes.status === 200);

  sleep(1);

  // Test 2: Fetch tasks by engagement (kanban board - up to 100 tasks)
  const engagementId = __ENV.TEST_ENGAGEMENT_ID || '';
  if (engagementId) {
    const kanbanStart = Date.now();
    const kanbanRes = http.get(
      `${BASE_URL}/functions/v1/tasks-get?engagement_id=${engagementId}`,
      { headers }
    );
    const kanbanDuration = Date.now() - kanbanStart;

    check(kanbanRes, {
      'kanban tasks status is 200': (r) => r.status === 200,
      'kanban tasks query fast': (r) => kanbanDuration < 3000, // NFR-003: <3s for 100 tasks
    });

    taskQueryDuration.add(kanbanDuration);
    taskQuerySuccessRate.add(kanbanRes.status === 200);
  }

  sleep(1);

  // Test 3: Fetch tasks with contributor filter (50 contributors max)
  const contributorStart = Date.now();
  const contributorRes = http.get(
    `${BASE_URL}/functions/v1/tasks-get?filter=contributed&limit=50`,
    { headers }
  );
  const contributorDuration = Date.now() - contributorStart;

  check(contributorRes, {
    'contributor tasks status is 200': (r) => r.status === 200,
    'contributor query fast': (r) => contributorDuration < 2000, // NFR-002: <2s with 50 contributors
  });

  taskQueryDuration.add(contributorDuration);
  taskQuerySuccessRate.add(contributorRes.status === 200);

  sleep(1);

  // Test 4: Fetch overdue tasks (SLA monitoring)
  const overdueStart = Date.now();
  const overdueRes = http.get(
    `${BASE_URL}/functions/v1/tasks-get?filter=overdue`,
    { headers }
  );
  const overdueDuration = Date.now() - overdueStart;

  check(overdueRes, {
    'overdue tasks status is 200': (r) => r.status === 200,
  });

  taskQueryDuration.add(overdueDuration);
  taskQuerySuccessRate.add(overdueRes.status === 200);

  sleep(1);

  // Test 5: Fetch task with contributors (50 contributors max - NFR-002)
  const taskId = __ENV.TEST_TASK_ID || '';
  if (taskId) {
    const taskWithContributorsStart = Date.now();
    const taskWithContributorsRes = http.get(
      `${BASE_URL}/functions/v1/tasks-get/${taskId}?include_contributors=true`,
      { headers }
    );
    const taskWithContributorsDuration = Date.now() - taskWithContributorsStart;

    check(taskWithContributorsRes, {
      'task with contributors status is 200': (r) => r.status === 200,
      'task with contributors query fast': () => taskWithContributorsDuration < 2000, // NFR-002: <2s with 50 contributors
      'task has contributors array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data.contributors);
        } catch {
          return false;
        }
      },
    });

    taskQueryDuration.add(taskWithContributorsDuration);
    taskQuerySuccessRate.add(taskWithContributorsRes.status === 200);
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'tests/performance/tasks-queries-summary.json': JSON.stringify(data),
  };
}
