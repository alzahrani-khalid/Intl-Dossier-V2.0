# Testing Guide: AI Brief Generation & Intelligence Layer

**Feature Branch**: `033-ai-brief-generation`
**Created**: 2025-12-06

This guide walks you through testing the complete AI Brief Generation implementation.

---

## Quick Start Testing

### Prerequisites

```bash
# 1. Ensure services are running
pnpm run docker:up          # Start Redis + PostgreSQL
pnpm dev                    # Start frontend + backend

# 2. Apply migrations
cd supabase && supabase db push

# 3. Verify environment variables
cat backend/.env | grep -E "OPENAI|ANTHROPIC|REDIS"
```

### Run All Tests at Once

```bash
# Unit + Integration tests
pnpm test

# E2E tests
pnpm run test:e2e

# AI-specific tests only
pnpm exec vitest run backend/src/ai/__tests__/
pnpm exec playwright test e2e/tests/ai-chat.spec.ts
```

---

## 1️⃣ Unit Tests

### Arabic Detection Tests

```bash
pnpm exec vitest run backend/src/ai/__tests__/arabic-detection.test.ts
```

**What it validates:**

- Pure Arabic text detection (>90% Arabic chars)
- Bilingual content (30-90% Arabic → routes to Arabic model)
- English with Arabic terms (<30% → uses default model)
- Edge cases: empty strings, numbers, mixed scripts

### Security Enforcement Tests

```bash
pnpm exec vitest run backend/src/ai/__tests__/security-enforcement.test.ts
```

**What it validates:**

- Data classification routing (`secret` → private LLM only)
- Spend cap enforcement
- Rate limiting per user/org
- RLS policy compliance

---

## 2️⃣ Integration Tests

### Brief Generation Integration

```bash
pnpm exec vitest run backend/src/ai/__tests__/brief-generation.integration.test.ts
```

**What it validates:**

- Full brief generation pipeline
- RAG context retrieval
- LLM response parsing
- Observability logging
- Error handling

---

## 3️⃣ API Manual Testing

### Health Check

```bash
# Test AI service health
curl http://localhost:3000/api/ai/health

# Expected response:
# {
#   "status": "ok",
#   "embeddings": "bge-m3",
#   "dimensions": 1024,
#   "providers": ["openai", "anthropic"],
#   "redis": "connected"
# }
```

### Brief Generation API

```bash
# Get auth token first (login via frontend or use service key)
export TOKEN="your-jwt-token"

# Generate a brief for an engagement
curl -X POST http://localhost:3000/api/ai/briefs/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "engagement_id": "YOUR_ENGAGEMENT_UUID",
    "custom_prompt": "Focus on economic relations"
  }'

# Get a generated brief
curl http://localhost:3000/api/ai/briefs/BRIEF_UUID \
  -H "Authorization: Bearer $TOKEN"
```

### Chat API

```bash
# Send a chat message (SSE streaming)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "What are our active commitments with Japan?"
  }'
```

### Entity Linking API

```bash
# Propose links for an intake ticket
curl -X POST http://localhost:3000/api/ai/intake/TICKET_UUID/propose-links \
  -H "Authorization: Bearer $TOKEN"

# Approve a proposal
curl -X POST http://localhost:3000/api/ai/proposals/PROPOSAL_UUID/approve \
  -H "Authorization: Bearer $TOKEN"

# Reject a proposal
curl -X POST http://localhost:3000/api/ai/proposals/PROPOSAL_UUID/reject \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Not relevant"}'
```

---

## 4️⃣ E2E Tests (Playwright)

### Run All AI E2E Tests

```bash
pnpm exec playwright test e2e/tests/ai-chat.spec.ts
```

### Run with UI (Visual Debugging)

```bash
pnpm exec playwright test e2e/tests/ai-chat.spec.ts --headed
```

### Run Specific Test

```bash
pnpm exec playwright test -g "should display chat FAB button"
```

---

## 5️⃣ Load Testing

### Run Load Test

```bash
# Requires frontend tests directory
pnpm exec vitest run frontend/tests/performance/ai-load-test.ts
```

### Manual Load Test with k6 (if installed)

```bash
# Create a simple load test
cat > /tmp/ai-load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,          // 50 concurrent users
  duration: '60s',  // Run for 60 seconds
};

export default function () {
  const res = http.get('http://localhost:3000/api/ai/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

k6 run /tmp/ai-load-test.js
```

---

## 6️⃣ Manual UI Testing Checklist

### Brief Generation (US1)

| Test           | Steps                                                                       | Expected Result                            |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| Generate Brief | 1. Go to Engagements<br>2. Click on engagement<br>3. Click "Generate Brief" | Progress indicator shows, brief streams in |
| Custom Prompt  | Add custom prompt before generating                                         | Brief reflects custom focus                |
| Citations      | Click citation link in brief                                                | Navigates to source entity                 |
| Regenerate     | Click "Regenerate" on completed brief                                       | New brief generated                        |
| Timeout        | Wait 90+ seconds on complex engagement                                      | Partial results shown with message         |

### Chat Interface (US2)

| Test         | Steps                                 | Expected Result                 |
| ------------ | ------------------------------------- | ------------------------------- |
| Open Chat    | Click chat FAB (bottom-right)         | Chat panel opens                |
| Send Message | Type message and press Enter          | Message appears, AI responds    |
| Streaming    | Send message                          | Response streams token by token |
| Tool Usage   | Ask "What commitments with Japan?"    | Tool card shows search results  |
| Citations    | Check AI response                     | Clickable citations present     |
| RTL          | Switch to Arabic, send Arabic message | Layout is RTL, Arabic works     |
| Minimize     | Click minimize button                 | Chat minimizes to FAB           |
| Clear Chat   | Click clear/trash button              | Chat history cleared            |

### Entity Linking (US3)

| Test            | Steps                                                               | Expected Result                |
| --------------- | ------------------------------------------------------------------- | ------------------------------ |
| Suggest Links   | 1. Go to Intake Queue<br>2. Open ticket<br>3. Click "Suggest Links" | AI proposals appear            |
| View Confidence | Check proposal cards                                                | Shows High/Medium/Low badge    |
| Approve Link    | Click "Approve" on proposal                                         | Link created, proposal removed |
| Reject Link     | Click "Reject" on proposal                                          | Proposal dismissed             |
| Justification   | View proposal                                                       | Shows AI justification text    |

### Admin Features (US4/US5)

| Test            | Steps                  | Expected Result             |
| --------------- | ---------------------- | --------------------------- |
| Usage Dashboard | Admin → AI Usage       | Charts show usage metrics   |
| Date Filter     | Select date range      | Metrics update              |
| Cost Breakdown  | View cost section      | Shows per-feature costs     |
| LLM Settings    | Admin → AI Settings    | Policy form loads           |
| Save Policy     | Update and save policy | Changes persist             |
| Feature Toggle  | Disable a feature      | Feature becomes unavailable |

---

## 7️⃣ Database Verification

### Check Tables Exist

```sql
-- Run in Supabase SQL Editor or psql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'ai_%' OR table_name LIKE '%llm%';

-- Expected: ai_runs, ai_messages, ai_tool_calls, ai_briefs,
--           ai_entity_link_proposals, ai_model_pricing,
--           organization_llm_policies, intake_entity_links
```

### Check Enums

```sql
SELECT typname FROM pg_type WHERE typname LIKE 'ai_%' OR typname LIKE '%_status';

-- Expected: ai_provider, ai_run_status, ai_feature,
--           link_proposal_status, brief_status,
--           linkable_entity_type, data_classification
```

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename LIKE 'ai_%';
```

### Check AI Runs Are Logged

```sql
SELECT feature, provider, model, status, total_tokens, estimated_cost_usd
FROM ai_runs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 8️⃣ Success Criteria Validation

| Criteria                      | How to Validate                           | Target                     |
| ----------------------------- | ----------------------------------------- | -------------------------- |
| **SC-001** Brief < 60s        | Time brief generation with stopwatch      | < 60s                      |
| **SC-002** 80% acceptance     | Track regenerations vs first-accepts      | 80%                        |
| **SC-003** Chat < 3s/10s      | Measure response time                     | Simple < 3s, Complex < 10s |
| **SC-004** 75% link precision | Track approve vs reject rate              | 75% approved               |
| **SC-005** 100% observability | Query `ai_runs` for all operations        | No gaps                    |
| **SC-006** Cost accuracy      | Compare `ai_runs` sum vs provider invoice | Within 5%                  |
| **SC-007** Private routing    | Test with `secret` classification         | Never hits cloud           |
| **SC-008** RTL correct        | Visual inspection in Arabic               | All components RTL         |
| **SC-009** Touch targets      | Measure buttons on mobile                 | ≥ 44x44px                  |
| **SC-010** Concurrency        | Load test with 50 users                   | p95 < 5s                   |

---

## 9️⃣ Troubleshooting

### BGE-M3 Not Loading

```bash
# Check if model is downloaded
ls ~/.cache/huggingface/hub/models--BAAI--bge-m3

# Force re-download
rm -rf ~/.cache/huggingface/hub/models--BAAI--bge-m3
# Restart backend
```

### Redis Connection Failed

```bash
# Check Redis is running
docker ps | grep redis
redis-cli ping

# Restart Redis
docker restart redis
```

### LLM Rate Limits

```bash
# Check current usage in Redis
redis-cli GET "rate_limit:ai:chat:user:YOUR_USER_ID"

# Clear rate limit (for testing only!)
redis-cli DEL "rate_limit:ai:chat:user:YOUR_USER_ID"
```

### SSE Not Streaming

- Ensure `Accept: text/event-stream` header is set
- Check browser console for connection errors
- Verify no proxy is buffering responses

### AI Runs Not Logged

```sql
-- Check for recent errors
SELECT * FROM ai_runs
WHERE status = 'failed'
ORDER BY created_at DESC LIMIT 5;
```

---

## 🔟 Complete Test Execution Sequence

```bash
# 1. Start services
pnpm run docker:up
pnpm dev

# 2. Run unit tests
pnpm exec vitest run backend/src/ai/__tests__/

# 3. Run integration tests
pnpm exec vitest run backend/src/ai/__tests__/brief-generation.integration.test.ts

# 4. Run E2E tests
pnpm exec playwright test e2e/tests/ai-chat.spec.ts

# 5. Run load test
pnpm exec vitest run frontend/tests/performance/ai-load-test.ts

# 6. Manual validation
# - Open http://localhost:5175
# - Login and test each user story manually

# 7. Database verification
# - Connect to Supabase and run SQL checks

# 8. Check observability
# - Go to Admin → AI Usage
# - Verify metrics are captured

echo "✅ All tests complete!"
```

---

## Quick Validation Commands

```bash
# Run everything AI-related
pnpm exec vitest run backend/src/ai/ && \
pnpm exec playwright test e2e/tests/ai-chat.spec.ts && \
echo "✅ All AI tests passed!"
```
