import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const kanbanRenderDuration = new Trend('kanban_render_duration');
const kanbanRenderSuccess = new Rate('kanban_render_success');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 25 },   // Ramp up to 25 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    kanban_render_duration: ['p(95)<3000'], // 95% of renders should be < 3s (NFR-003)
    kanban_render_success: ['rate>0.99'],    // 99% success rate
    http_req_failed: ['rate<0.01'],          // Less than 1% failures
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

  const engagementId = __ENV.TEST_ENGAGEMENT_ID || '';
  if (!engagementId) {
    console.error('TEST_ENGAGEMENT_ID environment variable is required');
    return;
  }

  // Test 1: Fetch all tasks for kanban board (up to 100 tasks)
  const kanbanStart = Date.now();
  const kanbanRes = http.get(
    `${BASE_URL}/functions/v1/tasks-get?engagement_id=${engagementId}&include_contributors=true`,
    { headers }
  );
  const kanbanDuration = Date.now() - kanbanStart;

  const renderSuccess = check(kanbanRes, {
    'kanban query status is 200': (r) => r.status === 200,
    'kanban query response time < 3s': () => kanbanDuration < 3000,
    'kanban returned data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    'kanban data has expected structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        if (body.data.length === 0) return true;
        const firstTask = body.data[0];
        return (
          firstTask.hasOwnProperty('id') &&
          firstTask.hasOwnProperty('title') &&
          firstTask.hasOwnProperty('workflow_stage') &&
          firstTask.hasOwnProperty('assignee_id')
        );
      } catch {
        return false;
      }
    },
  });

  kanbanRenderDuration.add(kanbanDuration);
  kanbanRenderSuccess.add(renderSuccess);

  sleep(1);

  // Test 2: Fetch tasks grouped by workflow stage (simulating kanban columns)
  const stages = ['todo', 'in_progress', 'review', 'done'];
  stages.forEach((stage) => {
    const stageStart = Date.now();
    const stageRes = http.get(
      `${BASE_URL}/functions/v1/tasks-get?engagement_id=${engagementId}&workflow_stage=${stage}`,
      { headers }
    );
    const stageDuration = Date.now() - stageStart;

    check(stageRes, {
      [`${stage} column query status is 200`]: (r) => r.status === 200,
      [`${stage} column query fast`]: () => stageDuration < 1000,
    });

    kanbanRenderDuration.add(stageDuration);
    kanbanRenderSuccess.add(stageRes.status === 200);
  });

  sleep(2);

  // Test 3: Update task workflow stage (drag-and-drop simulation)
  const taskId = __ENV.TEST_TASK_ID || '';
  if (taskId) {
    const updateStart = Date.now();
    const updatePayload = JSON.stringify({
      workflow_stage: 'in_progress',
      updated_at: new Date().toISOString(),
    });

    const updateRes = http.patch(
      `${BASE_URL}/functions/v1/tasks-update/${taskId}`,
      updatePayload,
      { headers }
    );
    const updateDuration = Date.now() - updateStart;

    check(updateRes, {
      'drag-drop update succeeds': (r) => r.status === 200 || r.status === 409, // 409 = conflict is acceptable
      'drag-drop update fast': () => updateDuration < 500,
    });

    kanbanRenderSuccess.add(updateRes.status === 200 || updateRes.status === 409);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'tests/performance/kanban-render-summary.json': JSON.stringify(data),
  };
}
