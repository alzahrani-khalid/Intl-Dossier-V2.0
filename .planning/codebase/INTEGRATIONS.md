# External Integrations

**Analysis Date:** 2026-03-23

## APIs & External Services

**AI & LLM Services:**

- Claude API (Anthropic) - AI brief generation, entity extraction, field assistance
  - SDK/Client: @anthropic-ai/sdk v0.65.0
  - Auth: ANTHROPIC_API_KEY (env var)
  - Usage: `backend/src/api/ai.ts`, `backend/src/api/ai/dossier-field-assist.ts`
  - Features: Structured output for briefs, entity extraction from documents

- OpenAI API - Fallback LLM, embeddings, chat completions
  - SDK/Client: openai v5.23.1
  - Auth: OPENAI_API_KEY (env var)
  - Usage: Fallback when AnythingLLM unavailable
  - Models: gpt-4-turbo, text-embedding-3-large (fallback embeddings)

- AnythingLLM - Self-hosted RAG and embeddings (primary)
  - API: HTTP REST API
  - Auth: ANYTHINGLLM_API_URL, ANYTHINGLLM_API_KEY
  - Config: `backend/src/config/anythingllm.ts`
  - Service: `backend/src/integrations/anythingllm.service.ts`
  - Features: Embeddings generation, vector search, workspace management
  - Embedding Model: BGE-M3 (1536 dimensions)

- Google Cloud Vision API - Document OCR and image processing
  - SDK/Client: @google-cloud/vision v4.3.2
  - Auth: GOOGLE_AI_API_KEY or service account JSON
  - Usage: `backend/src/services/ocr-service.ts`
  - Features: Text detection from images, document layout analysis

**Local AI:**

- Transformers (Xenova) - BGE-M3 embeddings locally in Node.js/browser
  - SDK/Client: @xenova/transformers v2.17.2
  - Usage: Fallback embeddings if API services unavailable
  - Config: `backend/src/services/embeddings.service.ts`

## Data Storage

**Databases:**

- PostgreSQL 15+ (Supabase managed)
  - Connection: SUPABASE_URL + service role key
  - Client: @supabase/supabase-js v2.98.0 (primary), pg v8.16.3 (direct connection)
  - ORM: None (raw SQL via pg-promise for migrations/complex queries)
  - Extensions: pgvector, pg_trgm, pg_tsvector
  - Schema: Migrations in `supabase/migrations/`
  - Seed: `backend/src/seed.ts`

**File Storage:**

- Supabase Storage (cloud-native)
  - Connection: SUPABASE_URL + auth token
  - Client: @supabase/supabase-js v2.98.0
  - Buckets: intake-attachments (documents, images, PDFs)
  - Max file: 25MB, Max total: 100MB (configurable via env)
  - Usage: `backend/src/services/attachment.service.ts`

**Caching:**

- Redis 7.x - Session storage, cache, job queues
  - Connection: REDIS_URL (ioredis format)
  - Client: ioredis v5.8.1 (primary), redis v4.6.0 (alternate)
  - Config: `backend/src/config/redis.ts`
  - Upstash option: @upstash/redis v1.35.5 (serverless alternative)
  - Usage: Cache warming, rate limit counters, user sessions, real-time subscriptions

## Authentication & Identity

**Auth Provider:**

- Supabase Auth - Custom authentication and session management
  - Implementation: OAuth 2.0, Email/Password, MFA
  - SDK: @supabase/supabase-js v2.98.0
  - Config: `backend/src/config/supabase.ts`
  - Service: `backend/src/services/AuthService.ts`
  - Features: JWT tokens, automatic session refresh, user metadata
  - MFA: TOTP via speakeasy v2.0.0, backup codes via `backend/src/services/backup-codes.service.ts`

**JWT Configuration:**

- JWT_SECRET - Signing key for custom JWT (optional, if not using Supabase auth)
- JWT_EXPIRES_IN - Token lifetime (default: 24h)
- Tokens validated in middleware: `backend/src/middleware/auth.ts`

## Monitoring & Observability

**Error Tracking:**

- Sentry - Error and performance monitoring
  - SDK: @sentry/react v10.42.0 (frontend), @sentry/node v9.24.0 (backend)
  - Config: SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE
  - Dashboard: https://sentry.io/settings/projects/
  - Status: Optional (leave SENTRY_DSN empty to disable)

**Logs:**

- Winston v3.17.0 - Structured logging
  - Config: `backend/src/utils/logger.ts`
  - Transports: Console (dev), file rotation (prod)
  - Level: LOG_LEVEL env var (default: info)
  - Usage: All backend services log to Winston

**Metrics:**

- Prometheus (optional)
  - Port: METRICS_PORT (default: 9090)
  - Enabled: ENABLE_METRICS (env flag)
  - Grafana integration available (docker-compose)

## CI/CD & Deployment

**Hosting:**

- DigitalOcean Droplet (IP: 138.197.195.242)
  - App Directory: `/opt/intl-dossier/`
  - Ports: 80 (HTTP), 443 (HTTPS)
  - Docker Compose: `deploy/docker-compose.prod.yml`
  - Node runtime: 20.19.0+ LTS

- Supabase Hosting (Database + Auth)
  - Project Name: Intl-Dossier
  - Project ID: zkrcjzdemdmwhearhfgg
  - Region: eu-west-2
  - Database: PostgreSQL 17.6.1.008

**CI Pipeline:**

- Git-based deployment (via push)
- Docker image build for frontend and backend
- Manual deploy command: `git push && ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"`

## Environment Configuration

**Required env vars:**

Frontend (`.env` / `.env.local`):

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `VITE_BACKEND_URL` - Backend API URL (if separate from frontend)

Backend (`backend/.env`):

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Anonymous key (for RLS policies)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
- `DATABASE_URL` - PostgreSQL connection (optional if using Supabase)
- `REDIS_URL` - Redis connection (required for queue/cache)
- `ANTHROPIC_API_KEY` - Claude API key (required for AI briefs)
- `OPENAI_API_KEY` - OpenAI API key (fallback)
- `ANYTHINGLLM_API_URL` - AnythingLLM API endpoint (for RAG)
- `ANYTHINGLLM_API_KEY` - AnythingLLM authentication key

**Secrets location:**

- Root: `.env` (not committed)
- Backend: `backend/.env` (not committed)
- Frontend: `frontend/.env.local` (not committed)
- Supabase: Secrets managed in Supabase dashboard
- Production: DigitalOcean environment variables (not in git)

## Webhooks & Callbacks

**Incoming:**

- Supabase Realtime webhooks - Database change events (create, update, delete)
  - Connection: WebSocket via `@supabase/supabase-js`
  - Usage: Real-time updates for dossiers, work items, notifications
  - Config: `frontend/src/hooks/useSupabaseRealtimeSubscription.ts`

**Outgoing:**

- Email notifications via nodemailer v7.0.6
  - SMTP config: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
  - Service: `backend/src/services/email-service.ts`
  - Events: Notifications, SLA alerts, assignment updates

- Socket.io events - WebSocket push to clients
  - Server: socket.io v4.8.1
  - Client: socket.io-client v4.8.1
  - Usage: Real-time notifications, live updates (if not using Supabase Realtime)

## Rate Limiting

**API Rate Limits:**

- User rate limit: 300 requests/window
- Anonymous rate limit: 60 requests/window
- AI operations: 60 requests/window (3 per minute per user)
- Global: 15,000 requests across all users
- Middleware: `backend/src/middleware/rate-limit.middleware.ts`
- Implementation: express-rate-limit v7.4.1 with Redis store

## Document Processing

**PDF/Document Handling:**

- PDF generation: pdfkit v0.17.2, pdf-lib v1.17.1, @react-pdf/renderer v3.4.0
- PDF parsing: unpdf v1.3.2
- OCR: tesseract.js v5.1.1 (browser), @google-cloud/vision v4.3.2 (server)
- DOCX conversion: mammoth v1.11.0
- Excel export: exceljs v4.4.0
- Services: `backend/src/services/pdf-generation.service.ts`, `backend/src/services/ocr-service.ts`

## Task Queue & Jobs

**Job Queue:**

- BullMQ v5.61.0 - Redis-based job queue
  - Connection: Uses shared Redis from config
  - Config: `backend/src/config/queues.ts`
  - Usage: Async tasks (email, exports, embeddings, document processing)
  - Jobs: `backend/src/jobs/` directory
  - Features: Job retries, exponential backoff, scheduling

---

_Integration audit: 2026-03-23_
