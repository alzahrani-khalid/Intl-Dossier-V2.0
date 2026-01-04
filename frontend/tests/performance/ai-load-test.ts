import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

/**
 * AI Features Load Test - T066
 * Feature: 033-ai-brief-generation
 *
 * Success Criteria (SC-010):
 * - 50 concurrent requests without degradation (p95 < 5s)
 *
 * Scenarios:
 * - 50 virtual users ramping up over 1 minute
 * - Sustained load for 3 minutes
 * - Ramp down over 30 seconds
 * - Mix of AI operations: chat, brief generation, entity linking
 */

// Custom metrics
const errorRate = new Rate('ai_errors')
const briefDuration = new Trend('brief_generation_duration')
const chatDuration = new Trend('chat_response_duration')
const entityLinkDuration = new Trend('entity_link_duration')
const aiRequests = new Counter('ai_requests_total')

// Load test configuration - 50 concurrent users
export const options = {
  scenarios: {
    ai_load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 }, // Ramp up to 50 users
        { duration: '3m', target: 50 }, // Stay at 50 users
        { duration: '30s', target: 0 }, // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // SC-010: p95 < 5s (5000ms) for AI requests
    'http_req_duration{type:ai}': ['p(95)<5000'],
    brief_generation_duration: ['p(95)<60000'], // 60s max for briefs (SC-001)
    chat_response_duration: ['p(95)<10000'], // 10s for complex (SC-003)
    entity_link_duration: ['p(95)<5000'], // 5s for entity linking
    ai_errors: ['rate<0.05'], // Error rate under 5%
  },
}

// Environment configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000'
const SUPABASE_URL = __ENV.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_KEY = __ENV.SUPABASE_ANON_KEY || ''

// Test user credentials
const TEST_EMAIL = __ENV.TEST_EMAIL || 'kazahrani@stats.gov.sa'
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'itisme'

export function setup() {
  // Login and get auth token
  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
      },
    },
  )

  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.status, loginRes.body)
    return { token: '', engagementId: '', intakeId: '' }
  }

  const authData = JSON.parse(loginRes.body as string)
  const token = authData.access_token

  // Get a sample engagement ID for brief generation
  const engagementsRes = http.get(`${SUPABASE_URL}/rest/v1/engagements?select=id&limit=1`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
    },
  })

  let engagementId = ''
  if (engagementsRes.status === 200) {
    const engagements = JSON.parse(engagementsRes.body as string)
    if (engagements.length > 0) {
      engagementId = engagements[0].id
    }
  }

  // Get a sample intake ID for entity linking
  const intakeRes = http.get(`${SUPABASE_URL}/rest/v1/intake_tickets?select=id&limit=1`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
    },
  })

  let intakeId = ''
  if (intakeRes.status === 200) {
    const intakes = JSON.parse(intakeRes.body as string)
    if (intakes.length > 0) {
      intakeId = intakes[0].id
    }
  }

  console.log(
    `Setup complete. Token: ${token ? 'obtained' : 'missing'}, Engagement: ${engagementId}, Intake: ${intakeId}`,
  )
  return { token, engagementId, intakeId }
}

export default function (data: { token: string; engagementId: string; intakeId: string }) {
  if (!data.token) {
    console.error('No auth token available')
    errorRate.add(1)
    return
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  }

  // Weighted scenarios simulating real usage
  const scenario = Math.random()

  if (scenario < 0.5) {
    // 50% - Chat interactions (most common)
    testChatInteraction(headers)
  } else if (scenario < 0.75) {
    // 25% - Brief generation
    testBriefGeneration(headers, data.engagementId)
  } else {
    // 25% - Entity linking
    testEntityLinking(headers, data.intakeId)
  }

  // Think time between actions (2-5 seconds)
  sleep(Math.random() * 3 + 2)
}

function testChatInteraction(headers: Record<string, string>) {
  group('AI Chat', () => {
    aiRequests.add(1)

    const queries = [
      'What commitments do we have with Japan?',
      'Show me recent engagements with European countries',
      'What is the status of MOU with Saudi Arabia?',
      'List all upcoming events this month',
      'Summarize our position on economic cooperation',
    ]

    const query = queries[Math.floor(Math.random() * queries.length)]

    const payload = JSON.stringify({
      message: query,
      session_id: `load-test-${__VU}-${Date.now()}`,
    })

    const startTime = Date.now()
    const res = http.post(`${BASE_URL}/api/ai/chat`, payload, {
      headers,
      tags: { type: 'ai', endpoint: 'chat' },
      timeout: '30s',
    })
    const duration = Date.now() - startTime

    chatDuration.add(duration)

    const success = check(res, {
      'chat status 200': (r) => r.status === 200,
      'chat has response': (r) => {
        try {
          const body = JSON.parse(r.body as string)
          return body.response || body.content || body.message
        } catch {
          return false
        }
      },
      'chat duration < 10s (SC-003)': () => duration < 10000,
    })

    if (!success) {
      errorRate.add(1)
      console.error(`Chat failed: ${res.status} - ${res.body}`)
    }
  })
}

function testBriefGeneration(headers: Record<string, string>, engagementId: string) {
  group('Brief Generation', () => {
    aiRequests.add(1)

    if (!engagementId) {
      console.warn('No engagement ID available for brief generation')
      return
    }

    const payload = JSON.stringify({
      engagement_id: engagementId,
      options: {
        include_commitments: true,
        include_positions: true,
        include_participants: true,
      },
    })

    const startTime = Date.now()
    const res = http.post(`${BASE_URL}/api/ai/briefs/generate`, payload, {
      headers,
      tags: { type: 'ai', endpoint: 'brief' },
      timeout: '90s', // 90s timeout as per spec
    })
    const duration = Date.now() - startTime

    briefDuration.add(duration)

    const success = check(res, {
      'brief status 200 or 202': (r) => r.status === 200 || r.status === 202,
      'brief has content or id': (r) => {
        try {
          const body = JSON.parse(r.body as string)
          return body.id || body.content || body.brief_id
        } catch {
          return false
        }
      },
      'brief duration < 60s (SC-001)': () => duration < 60000,
    })

    if (!success) {
      errorRate.add(1)
      console.error(`Brief generation failed: ${res.status} - ${res.body}`)
    }
  })
}

function testEntityLinking(headers: Record<string, string>, intakeId: string) {
  group('Entity Linking', () => {
    aiRequests.add(1)

    if (!intakeId) {
      // If no intake, test with text content instead
      const payload = JSON.stringify({
        content: 'Meeting with Japanese delegation about trade agreements and economic cooperation',
        entity_types: ['country', 'organization'],
      })

      const startTime = Date.now()
      const res = http.post(`${BASE_URL}/api/ai/intake-linking/suggest`, payload, {
        headers,
        tags: { type: 'ai', endpoint: 'entity-link' },
        timeout: '30s',
      })
      const duration = Date.now() - startTime

      entityLinkDuration.add(duration)

      const success = check(res, {
        'entity link status 200': (r) => r.status === 200,
        'entity link has suggestions': (r) => {
          try {
            const body = JSON.parse(r.body as string)
            return Array.isArray(body.suggestions) || body.links
          } catch {
            return false
          }
        },
        'entity link duration < 5s': () => duration < 5000,
      })

      if (!success) {
        errorRate.add(1)
        console.error(`Entity linking failed: ${res.status} - ${res.body}`)
      }
      return
    }

    // Test with actual intake ticket
    const payload = JSON.stringify({
      intake_id: intakeId,
    })

    const startTime = Date.now()
    const res = http.post(`${BASE_URL}/api/ai/intake-linking/propose-links`, payload, {
      headers,
      tags: { type: 'ai', endpoint: 'entity-link' },
      timeout: '30s',
    })
    const duration = Date.now() - startTime

    entityLinkDuration.add(duration)

    const success = check(res, {
      'entity link status 200': (r) => r.status === 200,
      'entity link has proposals': (r) => {
        try {
          const body = JSON.parse(r.body as string)
          return body.proposals || body.suggestions || body.links
        } catch {
          return false
        }
      },
      'entity link duration < 5s': () => duration < 5000,
    })

    if (!success) {
      errorRate.add(1)
      console.error(`Entity linking failed: ${res.status} - ${res.body}`)
    }
  })
}

export function teardown(data: { token: string }) {
  console.log('\n=== AI Load Test Results ===')
  console.log('Test completed successfully')
  console.log('Check the k6 output for detailed metrics')
  console.log('\nKey metrics to verify:')
  console.log('- SC-001: Brief generation < 60s (p95)')
  console.log('- SC-003: Chat response < 10s (p95)')
  console.log('- SC-010: 50 concurrent requests, p95 < 5s')
}

/*
 * Usage:
 *
 * # Install k6 (macOS)
 * brew install k6
 *
 * # Run load test locally
 * k6 run frontend/tests/performance/ai-load-test.ts \
 *   -e BASE_URL=http://localhost:4000 \
 *   -e SUPABASE_URL=http://localhost:54321 \
 *   -e SUPABASE_ANON_KEY=your_anon_key \
 *   -e TEST_EMAIL=kazahrani@stats.gov.sa \
 *   -e TEST_PASSWORD=itisme
 *
 * # Run against staging
 * k6 run frontend/tests/performance/ai-load-test.ts \
 *   -e BASE_URL=https://api.staging.intldossier.com \
 *   -e SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co \
 *   -e SUPABASE_ANON_KEY=your_staging_key
 *
 * # With cloud reporting (k6 Cloud)
 * k6 cloud frontend/tests/performance/ai-load-test.ts
 */
