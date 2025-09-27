# GASTAT International Dossier System - Quick Start

**Purpose**: Validate implementation against acceptance scenarios from spec.md

## Prerequisites

```bash
# Required tools
docker --version  # 24.0+
docker-compose --version  # 2.20+
node --version  # 20 LTS
npm --version  # 10+

# Clone repository
git clone <repository-url>
cd Intl-DossierV2.0
```

## 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure required variables
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<generated-key>
SUPABASE_SERVICE_ROLE_KEY=<generated-key>
ANYTHINGLLM_API_KEY=<generated-key>
OLLAMA_BASE_URL=http://localhost:11434
```

## 2. Start Infrastructure

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# supabase-db      running  0.0.0.0:54322->5432/tcp
# supabase-api     running  0.0.0.0:54321->8000/tcp
# anythingllm      running  0.0.0.0:3001->3001/tcp
# ollama           running  0.0.0.0:11434->11434/tcp
```

## 3. Database Setup

```bash
# Run migrations
cd backend
npm run migrate

# Seed test data
npm run seed

# Verify database
npm run db:verify
```

## 4. Application Setup

```bash
# Install dependencies
npm install

# Build applications
npm run build

# Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# AnythingLLM: http://localhost:3001
```

## 5. Validation Scenarios

### Scenario 1: User Authentication with MFA
```bash
# Test MFA login flow
npm run test:auth

# Expected: User logs in with email/password, receives MFA prompt, completes authentication
✓ Login page loads
✓ MFA code sent to email
✓ MFA validation successful
✓ JWT tokens received
✓ User redirected to dashboard
```

### Scenario 2: Country Dossier Management
```bash
# Test dossier CRUD operations
npm run test:dossiers

# Expected: Create, view, update Saudi-US relationship dossier
✓ Create new country dossier
✓ Add bilateral agreements
✓ Upload documents
✓ Set classification level
✓ Search in Arabic/English
```

### Scenario 3: MoU Lifecycle Management
```bash
# Test MoU workflow
npm run test:mou

# Expected: Draft → Negotiation → Signed → Active
✓ Create draft MoU
✓ Add deliverables with deadlines
✓ Move to negotiation status
✓ Digital signature workflow
✓ Activation on effective date
✓ Expiry notifications
```

### Scenario 4: AI Brief Generation
```bash
# Test AI services
npm run test:ai

# Expected: Generate meeting brief in <30 seconds
✓ Request brief for upcoming meeting
✓ AI processes dossier context
✓ Brief generated in Arabic/English
✓ Talking points included
✓ Response time <30s
```

### Scenario 5: Real-time Collaboration
```bash
# Test collaborative editing
npm run test:realtime

# Expected: Multiple users edit simultaneously
✓ WebSocket connection established
✓ User presence indicators
✓ Live cursor positions
✓ Conflict-free merging (CRDT)
✓ Change attribution
```

### Scenario 6: Mobile Offline Sync
```bash
# Test mobile offline capabilities
npm run test:mobile

# Expected: Work offline, sync when connected
✓ Mobile app launches offline
✓ Local database operations
✓ Queue changes for sync
✓ Automatic sync on reconnect
✓ Conflict resolution
```

### Scenario 7: Voice Command Processing
```bash
# Test Arabic voice commands
npm run test:voice

# Expected: >90% accuracy for Arabic commands
✓ Voice input captured
✓ Arabic transcription accurate
✓ Command interpreted correctly
✓ Confirmation for critical actions
✓ Fallback to text input
```

### Scenario 8: Performance Benchmarks
```bash
# Test performance requirements
npm run test:performance

# Expected: Meet all SLA requirements
✓ Page load <2 seconds
✓ Search results <500ms
✓ AI brief <30 seconds
✓ 500 concurrent users
✓ 99.9% uptime simulation
```

## 6. Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "ai": "ready",
  "realtime": "active"
}

# Frontend health
curl http://localhost:5173/health

# Supabase health
curl http://localhost:54321/rest/v1/

# AnythingLLM health
curl http://localhost:3001/api/health
```

## 7. Quick Validation Checklist

```bash
# Run all validation tests
npm run validate:all

✅ Authentication with MFA
✅ Bilingual support (AR/EN)
✅ RTL/LTR layout switching
✅ Dossier CRUD operations
✅ MoU lifecycle management
✅ Document upload/download
✅ AI brief generation
✅ Real-time collaboration
✅ Voice command processing
✅ Offline mobile sync
✅ Digital signatures
✅ Permission delegation
✅ Search functionality
✅ Performance benchmarks
✅ Accessibility (WCAG 2.1)
```

## 8. Common Issues

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
docker-compose logs supabase-db

# Reset database
npm run db:reset
```

### Issue: AI service not responding
```bash
# Check AnythingLLM status
docker-compose logs anythingllm

# Pull Ollama model
docker exec -it ollama ollama pull llama2-7b-arabic
```

### Issue: Real-time not working
```bash
# Check WebSocket connection
npm run test:websocket

# Restart Supabase Realtime
docker-compose restart supabase-realtime
```

## 9. Development Workflow

```bash
# Start development environment
npm run dev

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run lint
npm run typecheck

# Build for production
npm run build

# Deploy to staging
npm run deploy:staging
```

## 10. Data Seeding

```bash
# Seed sample data for testing
npm run seed:sample

# Creates:
# - 5 test users with MFA enabled
# - 10 country dossiers
# - 20 organization dossiers
# - 15 active MoUs
# - 50 sample documents
# - 100 activities/tasks
```

## Success Criteria

All validation scenarios must pass with:
- ✅ 98/98 functional requirements working
- ✅ <2s page load time
- ✅ <500ms search response
- ✅ <30s AI brief generation
- ✅ 99.9% uptime over 24h test
- ✅ Arabic/English parity
- ✅ Mobile offline sync
- ✅ WCAG 2.1 AA compliance

---

**Next Steps**: After validation passes, run `/tasks` to generate implementation tasks