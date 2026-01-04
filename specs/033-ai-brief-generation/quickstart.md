# Quickstart: AI Brief Generation & Intelligence Layer

**Feature Branch**: `033-ai-brief-generation`

## Prerequisites

- Node.js 18+ LTS
- pnpm installed
- Supabase project with pgvector extension enabled
- OpenAI API key (required)
- Redis instance (for caching)

## Environment Setup

Add to `backend/.env`:

```bash
# AI Provider Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # optional
GOOGLE_AI_API_KEY=...          # optional

# Private LLM (optional)
VLLM_BASE_URL=http://localhost:8000
OLLAMA_BASE_URL=http://localhost:11434

# Feature Flags
AI_USE_ANYTHINGLLM=false
AI_BRIEF_GENERATION_ENABLED=true
AI_CHAT_ENABLED=true
AI_ENTITY_LINKING_ENABLED=true

# Redis
REDIS_URL=redis://localhost:6379
```

## Database Migrations

Apply migrations in order:

```bash
# From project root
cd supabase

# Apply all AI migrations
supabase db push
```

Or apply individually via Supabase MCP:

1. `20251205000001_ai_enums.sql`
2. `20251205000002_ai_model_pricing.sql`
3. `20251205000003_organization_llm_policies.sql`
4. `20251205000004_ai_observability.sql`
5. `20251205000005_ai_observability_rls.sql`
6. `20251205000006_ai_functions.sql`
7. `20251206000001_ai_briefs.sql`
8. `20251213000001_entity_link_proposals.sql`
9. `20251213000002_intake_entity_links.sql`

## Verify Installation

```bash
# Check embeddings service
curl http://localhost:3000/api/ai/health

# Expected response:
{
  "status": "ok",
  "embeddings": "bge-m3",
  "dimensions": 1024,
  "providers": ["openai", "anthropic"]
}
```

## Quick Test: Generate Brief

```bash
# Generate a brief for an engagement
curl -X POST http://localhost:3000/api/ai/briefs/generate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "engagement_id": "uuid-of-engagement",
    "custom_prompt": "Focus on trade agreements"
  }'
```

## Quick Test: AI Chat

```bash
# Send a chat message
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "What are our active commitments with Japan?"
  }'
```

## Quick Test: Entity Linking

```bash
# Propose links for an intake ticket
curl -X POST http://localhost:3000/api/ai/intake/uuid-of-ticket/propose-links \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Approve a proposal
curl -X POST http://localhost:3000/api/ai/proposals/uuid-of-proposal/approve \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Frontend Development

```bash
# Start frontend dev server
cd frontend
pnpm dev

# Navigate to any engagement and click "Generate Brief"
# Or click the AI chat button (bottom-right) on any page
```

## Admin Configuration

1. Navigate to **Admin → AI Settings**
2. Configure organization LLM policy:
   - Default provider: OpenAI
   - Monthly spend cap: $500
   - Enable/disable features

## Troubleshooting

### Embeddings Service Not Starting

```bash
# Check if BGE-M3 model is downloaded
ls ~/.cache/huggingface/hub/models--BAAI--bge-m3

# Force re-download
rm -rf ~/.cache/huggingface/hub/models--BAAI--bge-m3
# Restart backend
```

### OpenAI Rate Limiting

```bash
# Check current usage
curl http://localhost:3000/api/ai/admin/usage \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# If rate limited, requests are queued automatically
# Check queue status in Redis
redis-cli LLEN ai:request:queue
```

### Brief Generation Timeout

- Default timeout is 90 seconds
- For complex engagements, increase timeout in request
- Check `ai_runs` table for error messages

### Chat Not Streaming

- Ensure `Accept: text/event-stream` header is set
- Check browser console for SSE connection errors
- Verify Redis is running for session management

## Key Files

| Component       | Path                                                  |
| --------------- | ----------------------------------------------------- |
| LLM Router      | `backend/src/ai/llm-router.ts`                        |
| Embeddings      | `backend/src/ai/embeddings-service.ts`                |
| Brief Agent     | `backend/src/ai/agents/brief-generator.ts`            |
| Chat Agent      | `backend/src/ai/agents/chat-assistant.ts`             |
| Chat Dock UI    | `frontend/src/components/ai/ChatDock.tsx`             |
| Brief Panel     | `frontend/src/components/ai/BriefGenerationPanel.tsx` |
| Admin Dashboard | `frontend/src/pages/admin/AIUsageDashboard.tsx`       |

## Next Steps

1. Configure organization LLM policy in admin
2. Test brief generation on a sample engagement
3. Try AI chat with various queries
4. Review observability in admin dashboard
5. Set appropriate spend caps
