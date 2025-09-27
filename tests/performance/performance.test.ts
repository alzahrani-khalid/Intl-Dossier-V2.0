import { check } from 'k6'
import http from 'k6/http'
import { sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 50 },  // Ramp down to 50 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],   // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Helper function to get auth token
function authenticate() {
  const payload = JSON.stringify({
    email: 'test@gastat.gov.sa',
    password: 'TestPassword123!',
  })

  const params = {
    headers: { 'Content-Type': 'application/json' },
  }

  const response = http.post(`${BASE_URL}/api/auth/login`, payload, params)

  check(response, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('accessToken') !== '',
  })

  return response.json('accessToken')
}

// Main test scenario
export default function () {
  // Authenticate once per VU iteration
  const token = authenticate()

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  // Test 1: Get countries list
  const countriesRes = http.get(`${BASE_URL}/api/countries`, params)
  check(countriesRes, {
    'countries status 200': (r) => r.status === 200,
    'countries response time < 200ms': (r) => r.timings.duration < 200,
    'countries has data': (r) => r.json('data') !== null,
  })
  errorRate.add(countriesRes.status !== 200)

  sleep(1)

  // Test 2: Get MoUs list
  const mousRes = http.get(`${BASE_URL}/api/mous`, params)
  check(mousRes, {
    'MoUs status 200': (r) => r.status === 200,
    'MoUs response time < 300ms': (r) => r.timings.duration < 300,
  })
  errorRate.add(mousRes.status !== 200)

  sleep(1)

  // Test 3: Search functionality
  const searchRes = http.post(
    `${BASE_URL}/api/search`,
    JSON.stringify({
      query: 'Saudi',
      filters: { type: 'country' },
    }),
    params
  )
  check(searchRes, {
    'search status 200': (r) => r.status === 200,
    'search response time < 400ms': (r) => r.timings.duration < 400,
    'search has results': (r) => r.json('results').length > 0,
  })
  errorRate.add(searchRes.status !== 200)

  sleep(1)

  // Test 4: Create brief (heavier operation)
  const briefRes = http.post(
    `${BASE_URL}/api/ai/briefs`,
    JSON.stringify({
      countryId: 'saudi-arabia',
      templateId: 'executive-summary',
    }),
    params
  )
  check(briefRes, {
    'brief generation initiated': (r) => r.status === 202 || r.status === 200,
    'brief response time < 1000ms': (r) => r.timings.duration < 1000,
  })
  errorRate.add(briefRes.status >= 400)

  sleep(2)

  // Test 5: Real-time subscription (WebSocket simulation)
  const wsRes = http.get(`${BASE_URL}/api/realtime/subscribe`, params)
  check(wsRes, {
    'WebSocket upgrade successful': (r) => r.status === 101 || r.status === 200,
  })

  sleep(1)
}

// Export summary report
export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-report.json': JSON.stringify(data),
  }
}

// HTML report template
function htmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Performance Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .pass { color: green; }
        .fail { color: red; }
      </style>
    </head>
    <body>
      <h1>GASTAT Dossier System - Performance Test Report</h1>
      <div class="metric">
        <h3>Summary</h3>
        <p>Total Requests: ${data.metrics.http_reqs.values.count}</p>
        <p>Failed Requests: ${data.metrics.http_req_failed.values.passes}</p>
        <p>Average Response Time: ${data.metrics.http_req_duration.values.avg}ms</p>
        <p>95th Percentile: ${data.metrics.http_req_duration.values['p(95)']}ms</p>
      </div>
      <div class="metric">
        <h3>Thresholds</h3>
        ${Object.entries(data.metrics)
          .filter(([key, value]) => value.thresholds)
          .map(([key, value]) => `
            <p class="${value.thresholds.passes ? 'pass' : 'fail'}">
              ${key}: ${value.thresholds.passes ? 'PASS' : 'FAIL'}
            </p>
          `).join('')}
      </div>
    </body>
    </html>
  `
}