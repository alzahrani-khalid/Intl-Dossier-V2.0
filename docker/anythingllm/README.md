# AnythingLLM Docker Deployment

Feature: **029-dynamic-country-intelligence**

## Overview

Self-hosted AnythingLLM instance for country intelligence RAG (Retrieval-Augmented Generation) workspaces.

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose installed
- OpenAI API key (get from https://platform.openai.com/api-keys)
- At least 4GB RAM available
- 10GB+ disk space for vector embeddings

### 2. Initial Setup

```bash
# Navigate to this directory
cd docker/anythingllm

# Copy environment template
cp .env.example .env

# Generate JWT secret
openssl rand -hex 32

# Edit .env and add:
# - Generated JWT secret
# - Your OpenAI API key
# - Leave ANYTHINGLLM_API_KEY empty for now
nano .env
```

### 3. Deploy Container

```bash
# Start AnythingLLM
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:3001/api/ping
```

### 4. Configure UI

1. Open browser: http://localhost:3001
2. Create admin account (first user becomes admin)
3. Navigate to **Settings → API Keys**
4. Generate new API key
5. Copy the key and update `.env`:
   ```
   ANYTHINGLLM_API_KEY=your-generated-key-here
   ```
6. Restart container:
   ```bash
   docker-compose restart
   ```

### 5. Configure Embedding Model

1. In UI, go to **Settings → Embeddings**
2. Select **OpenAI**
3. Choose model: **text-embedding-ada-002**
4. Set max chunk length: **800**
5. Save settings

### 6. Set Supabase Secrets

```bash
# Set secrets for Edge Functions
supabase secrets set ANYTHINGLLM_URL=http://host.docker.internal:3001
supabase secrets set ANYTHINGLLM_API_KEY=<your-anythingllm-api-key>
supabase secrets set OPENAI_API_KEY=<your-openai-api-key>
```

## Architecture

```
┌─────────────────────────────────────────┐
│   Supabase Edge Functions               │
│   (intelligence-get, intelligence-refresh)│
└───────────────┬─────────────────────────┘
                │ REST API
                ├─── Bearer Token Auth
                │
┌───────────────▼─────────────────────────┐
│   AnythingLLM (Docker)                  │
│   - Port: 3001                          │
│   - Storage: Docker volumes             │
│   - Vector DB: LanceDB (built-in)       │
│   - Embedding: OpenAI ada-002 (1536-dim)│
│   - LLM: GPT-4                          │
└─────────────────────────────────────────┘
```

## Workspace Management

### Create Country Workspace

```bash
# Example: Create workspace for Saudi Arabia
curl -X POST http://localhost:3001/api/workspace/new \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "country-sa",
    "openAiTemp": 0.7,
    "openAiHistory": 20,
    "topN": 4
  }'
```

### Upload Documents to Workspace

```bash
# Upload a PDF document
curl -X POST http://localhost:3001/api/document/upload \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -F "file=@/path/to/saudi-arabia-report.pdf"

# Move document to workspace
curl -X POST http://localhost:3001/api/workspace/country-sa/update-embeddings \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "adds": ["saudi-arabia-report.pdf"]
  }'
```

### Query Workspace (RAG)

```bash
curl -X POST http://localhost:3001/api/workspace/country-sa/chat \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the current economic outlook for Saudi Arabia?",
    "mode": "chat"
  }'
```

## Configuration

### Embedding Settings

- **Model**: text-embedding-ada-002
- **Dimensions**: 1536
- **Chunk Size**: 800 characters
- **Chunk Overlap**: 80 characters (10%)

### LLM Settings

- **Provider**: OpenAI
- **Model**: GPT-4
- **Max Tokens**: 4096
- **Temperature**: 0.7 (default)

### Performance Tuning

- **Max Concurrent Embeddings**: 5
- **Embedding Batch Size**: 10
- Adjust in `docker-compose.yml` if needed

## Data Persistence

All data is stored in Docker volumes:

```bash
# List volumes
docker volume ls | grep anythingllm

# Backup volumes
docker run --rm -v anythingllm_storage:/data -v $(pwd):/backup alpine tar czf /backup/anythingllm-backup-$(date +%Y%m%d).tar.gz /data

# Restore volumes
docker run --rm -v anythingllm_storage:/data -v $(pwd):/backup alpine tar xzf /backup/anythingllm-backup-20250130.tar.gz -C /
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs anythingllm

# Common issues:
# 1. Port 3001 already in use
#    Solution: Change port in docker-compose.yml
# 2. Invalid OpenAI API key
#    Solution: Verify key in .env
# 3. Insufficient memory
#    Solution: Increase Docker RAM to 4GB+
```

### API key not working

```bash
# Regenerate API key in UI
# Update .env
# Restart container
docker-compose restart
```

### Embeddings failing

```bash
# Check OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer ${OPENAI_API_KEY}"

# Verify embedding model setting in UI
# Settings → Embeddings → OpenAI → text-embedding-ada-002
```

## Monitoring

### Health Check

```bash
# Ping endpoint
curl http://localhost:3001/api/ping

# Expected: {"online": true}
```

### View Metrics

1. Open UI: http://localhost:3001
2. Navigate to **Admin → System**
3. View:
   - Active workspaces
   - Total documents
   - Embedding queue status
   - Memory usage

## Security

- ✅ API keys stored in `.env` (never commit!)
- ✅ JWT-based authentication for multi-user mode
- ✅ Bearer token authentication for API access
- ✅ Telemetry disabled (`DISABLE_TELEMETRY=true`)
- ✅ Container isolated in Docker network

## Next Steps

After deployment:

1. ✅ Deploy Edge Functions (`intelligence-get`, `intelligence-refresh`)
2. ✅ Create test workspace `country-sa`
3. ✅ Upload sample documents (GDP reports, policy briefs)
4. ✅ Test RAG query via Edge Function
5. ✅ Monitor cache hit ratio and embedding performance

## References

- [AnythingLLM Documentation](https://docs.anythingllm.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Feature Specification](../../specs/029-dynamic-country-intelligence/spec.md)
- [Research Findings](../../specs/029-dynamic-country-intelligence/research.md)
