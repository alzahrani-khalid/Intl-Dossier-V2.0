# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**

- TypeScript 5.5+ (strict mode) - Backend services, shared types, type safety
- TypeScript 5.9+ (strict mode) - Frontend application, React components
- JavaScript (ES2022) - Build scripts, configuration

**Secondary:**

- SQL - PostgreSQL database queries via Supabase
- Bash - Deployment and utility scripts

## Runtime

**Environment:**

- Node.js 20.19.0+ (LTS) - Backend and frontend build/dev
- pnpm 10.29.1+ - Package manager (enforced via `preinstall` script)

**Package Manager:**

- pnpm 10.29.1+ - Monorepo workspace management
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core Frontend:**

- React 19.2.4+ - UI framework
- Vite 7.3.1+ - Build tool and dev server
- TanStack Router v1.166.2+ - Client-side routing with URL state
- TanStack Query v5.90.21+ - Server state management and caching
- Tailwind CSS v4.2.1+ - Utility-first styling with @tailwindcss/vite

**Core Backend:**

- Express.js 5.2.1+ - HTTP server framework
- Supabase JS v2.98.0 - Backend client for PostgreSQL, Auth, Realtime, Storage
- TypeScript 5.5+ - Type safety and development

**Build & Development:**

- Turbo v2.6.0+ - Monorepo orchestration
- Vite v7.3.1+ - Frontend and backend build tooling
- esbuild v0.24.0+ - Fast JavaScript bundler for backend

**Testing:**

- Vitest v4.0.18+ - Unit/integration test runner
- Playwright v1.55.1+ - E2E testing framework
- @testing-library/react v16.3.0+ - React component testing utilities
- axe-core/playwright v4.9.0+ - Accessibility testing

## Key Dependencies

**Critical - Frontend:**

- @supabase/supabase-js v2.98.0 - Supabase client for auth, DB, realtime
- @tanstack/react-query v5.90.21 - Server state sync and caching
- @tanstack/react-router v1.166.2 - File-based routing with type safety
- react-hook-form v7.71.2 - Form state and validation
- zod v4.3.6 - TypeScript-first schema validation
- i18next v25.8.14 + react-i18next v16.5.6 - Internationalization (EN/AR)
- framer-motion v12.35.0 - Animation library
- @dnd-kit/core v6.3.1 - Drag-and-drop primitives
- @xyflow/react v12.10.1 - Network graph visualization (React Flow)
- recharts v3.8.0 - Data visualization and charts
- @tanstack/react-table v8.21.3 - Headless data tables
- Radix UI v1.x - Accessible component primitives
- class-variance-authority v0.7.1 - CSS variant management
- @sentry/react v10.42.0 - Error tracking and monitoring

**Critical - Backend:**

- @supabase/supabase-js v2.98.0 - Supabase admin/anon clients
- pg v8.16.3 - PostgreSQL client
- pg-promise v11.5.0 - PostgreSQL promise wrapper
- ioredis v5.8.1 - Redis client
- @upstash/redis v1.35.5 - Upstash Redis for serverless
- bullmq v5.61.0 - Job queue using Redis
- express-rate-limit v7.4.1 - Rate limiting middleware
- helmet v8.1.0 - Security headers
- cors v2.8.5 - CORS middleware
- jsonwebtoken v9.0.2 - JWT authentication
- bcrypt v6.0.0 - Password hashing
- socket.io v4.8.1 - Real-time bidirectional communication
- winston v3.17.0 - Structured logging
- dotenv v17.2.2 - Environment variable loading

**AI/ML:**

- @anthropic-ai/sdk v0.65.0 - Claude API access (briefs, entity extraction)
- openai v5.23.1 - OpenAI API access (fallback, embeddings)
- @xenova/transformers v2.17.2 - BGE-M3 embeddings (local/browser-based)
- @langchain/core v0.3.78 - LLM orchestration primitives
- @langchain/community v0.3.57 - Community LLM integrations
- langchain v0.3.35 - Agent framework
- @mastra/core v0.24.6 - Mastra agents framework
- @google-cloud/vision v4.3.2 - OCR and document vision
- tesseract.js v5.1.1 - Client-side OCR
- node-nlp v5.0.0-alpha.5 - Natural language processing

**Infrastructure & Processing:**

- sharp v0.34.5 - Image processing and optimization
- pdfkit v0.17.2 - PDF generation
- pdf-lib v1.17.1 - PDF manipulation
- mammoth v1.11.0 - DOCX to HTML conversion
- unpdf v1.3.2 - PDF parsing
- form-data v4.0.4 - Multipart form data handling
- multer v2.0.2 - File upload middleware
- @react-pdf/renderer v3.4.0 - PDF generation in React
- exceljs v4.4.0 - Excel file generation/parsing

**Utilities & Helpers:**

- date-fns v3.6.0 - Date manipulation
- rrule v2.8.1 - Recurrence rules for calendar
- uuid v10.0.0 - UUID generation
- axios v1.12.2 - HTTP client
- deep-diff v1.0.2 - Deep object diffing
- dompurify v3.3.1 - HTML sanitization
- papaparse v5.5.3 - CSV parsing
- qss v3.0.0 - Query string parsing
- clsx v2.1.1 - Conditional classnames
- tailwind-merge v2.6.0 - Merge Tailwind classes
- speakeasy v2.0.0 - TOTP/2FA generation

## Configuration

**Environment:**

- `.env` files for secrets and configuration (see `.env.example` and `.backend/.env.example`)
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY - Supabase project access
- DATABASE_URL - Direct PostgreSQL connection (optional, Supabase primary)
- REDIS_URL - Redis connection for cache and queues
- ANYTHINGLLM_API_URL, ANYTHINGLLM_API_KEY - AnythingLLM integration
- OPENAI_API_KEY - OpenAI API access
- ANTHROPIC_API_KEY - Claude API access
- GOOGLE_AI_API_KEY - Google Vision API
- SENTRY_DSN - Error tracking configuration

**Build:**

- `vite.config.ts` - Vite build configuration for frontend
- `vitest.config.ts` - Vitest testing configuration
- `tsconfig.json` - TypeScript compiler options (strict mode, path aliases)
- `.eslintrc.cjs` - ESLint rules for code quality
- `.prettierrc` - Code formatting rules
- `playwright.config.ts` - E2E test configuration
- `package.json` scripts - pnpm scripts for dev, build, test, lint, db operations

**Database:**

- PostgreSQL 15+ via Supabase
- pgvector extension - Vector embeddings (1536 dimensions)
- pg_trgm extension - Full-text search trigrams
- pg_tsvector extension - Full-text search vectors
- Migrations in `supabase/migrations/` - Schema management
- Seed data in `backend/src/seed.ts`

## Platform Requirements

**Development:**

- Node.js 20.19.0+ LTS
- pnpm 10.29.1+
- Docker (optional, for local Supabase/Redis)
- PostgreSQL 15+ (if not using Supabase)
- Redis 7.x (for queue/cache)

**Production:**

- DigitalOcean Droplet (138.197.195.242)
- Docker Compose for containerization
- Node.js 20.19.0+ runtime
- PostgreSQL 17.6.1.008 (Supabase managed)
- Redis 7.x (managed or self-hosted)
- Nginx (reverse proxy/HTTPS via DigitalOcean App Platform)

---

_Stack analysis: 2026-03-23_
