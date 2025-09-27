# Quick Start Guide: Core Module Implementation

## Overview
This guide walks through the implementation of the GASTAT International Dossier System core modules. Follow these steps to set up and verify each module works correctly.

## Prerequisites

### System Requirements
- Node.js 20 LTS or higher
- Docker Desktop 4.0+ with 8GB RAM allocated
- Git 2.30+
- VS Code with ESLint, Prettier, and TypeScript extensions

### Access Requirements  
- Supabase project created
- AnythingLLM instance deployed (or Docker image available)
- GitHub repository access

## Step 1: Environment Setup

### 1.1 Clone and Install
```bash
# Clone the repository
git clone https://github.com/gastat/intl-dossier.git
cd intl-dossier

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

### 1.2 Configure Environment Variables
Edit `.env.local` with your values:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AnythingLLM Configuration
VITE_ANYTHINGLLM_URL=http://localhost:3001
VITE_ANYTHINGLLM_API_KEY=your-api-key

# Application Settings
VITE_DEFAULT_LANGUAGE=en
VITE_API_RATE_LIMIT=300
```

### 1.3 Start Docker Services
```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# intl-dossier-frontend    running   0.0.0.0:3000->3000/tcp
# intl-dossier-supabase    running   0.0.0.0:54321->54321/tcp
# intl-dossier-anythingllm running   0.0.0.0:3001->3001/tcp
```

## Step 2: Database Setup

### 2.1 Run Migrations
```bash
# Apply database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Verify database structure
npm run db:verify
```

### 2.2 Verify RLS Policies
```sql
-- Connect to Supabase SQL Editor
-- Run this to verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should show rowsecurity = true
```

## Step 3: Frontend Module Verification

### 3.1 Start Development Server
```bash
# Start frontend dev server
npm run dev

# Open browser to http://localhost:3000
```

### 3.2 Verify Each Route
Navigate to each route and verify basic functionality:

| Route | Expected Result | Language Toggle |
|-------|-----------------|-----------------|
| `/forums` | Forums & Conferences page loads | ✓ Arabic/English |
| `/mous` | MoUs page with empty state | ✓ Arabic/English |
| `/events` | Events calendar view | ✓ Arabic/English |
| `/briefs` | Briefs listing page | ✓ Arabic/English |
| `/intelligence` | Intelligence reports page | ✓ Arabic/English |
| `/reports` | Report generation page | ✓ Arabic/English |
| `/data-library` | Data library with upload | ✓ Arabic/English |
| `/word-assistant` | AI document assistant | ✓ Arabic/English |
| `/settings` | User settings page | ✓ Arabic/English |

### 3.3 Test Bilingual Support
```javascript
// Quick test in browser console
// Switch language
document.querySelector('[data-testid="language-toggle"]').click()

// Verify RTL layout
console.assert(document.dir === 'rtl', 'RTL not applied')

// Check translation loaded
console.assert(document.querySelector('h1').textContent !== '', 'Translation missing')
```

## Step 4: Backend API Testing

### 4.1 Test Authentication
```bash
# Register a test user
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "data": {
      "full_name": "Test User",
      "language_preference": "en"
    }
  }'

# Login and get token
curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Save the access_token from response
export TOKEN="your-access-token"
```

### 4.2 Test CRUD Operations

#### Countries Module
```bash
# List countries
curl -X GET http://localhost:3000/api/v1/countries \
  -H "Authorization: Bearer $TOKEN"

# Create a country
curl -X POST http://localhost:3000/api/v1/countries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "iso_code_2": "SA",
    "iso_code_3": "SAU",
    "name_en": "Saudi Arabia",
    "name_ar": "المملكة العربية السعودية",
    "region": "asia",
    "capital_en": "Riyadh",
    "capital_ar": "الرياض"
  }'
```

#### Organizations Module  
```bash
# Create an organization
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GASTAT",
    "name_en": "General Authority for Statistics",
    "name_ar": "الهيئة العامة للإحصاء",
    "type": "government",
    "country_id": "{{country_id_from_above}}"
  }'
```

#### MoUs Module
```bash
# Create MoU (multipart request)
curl -X POST http://localhost:3000/api/v1/mous \
  -H "Authorization: Bearer $TOKEN" \
  -F 'metadata={
    "title_en": "Test MoU",
    "title_ar": "مذكرة تفاهم تجريبية",
    "primary_party_id": "{{org_id}}",
    "secondary_party_id": "{{another_org_id}}"
  }' \
  -F "document=@test-mou.pdf"

# Transition workflow state
curl -X POST http://localhost:3000/api/v1/mous/{{mou_id}}/transition \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_state": "internal_review",
    "comment": "Ready for review"
  }'
```

### 4.3 Test Rate Limiting
```bash
# Run this script to test rate limiting (should fail after 300 requests)
for i in {1..310}; do
  echo "Request $i"
  curl -X GET http://localhost:3000/api/v1/countries \
    -H "Authorization: Bearer $TOKEN" \
    -o /dev/null -s -w "%{http_code}\n"
  
  # Should see 429 after request 300
done
```

## Step 5: Core Business Logic Testing

### 5.1 Event Conflict Detection
```javascript
// Test via API
const event1 = {
  title_en: "Board Meeting",
  title_ar: "اجتماع مجلس الإدارة",
  type: "meeting",
  start_datetime: "2025-01-15T10:00:00Z",
  end_datetime: "2025-01-15T12:00:00Z",
  venue_en: "Conference Room A",
  organizer_id: "{{org_id}}"
}

const event2 = {
  ...event1,
  title_en: "Strategy Session",
  start_datetime: "2025-01-15T11:00:00Z", // Overlaps!
}

// Create first event - should succeed
fetch('/api/v1/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(event1)
})

// Create second event - should return conflict
fetch('/api/v1/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(event2)
})
.then(res => res.json())
.then(data => {
  console.assert(data.conflicts?.length > 0, 'Conflict detection failed')
})
```

### 5.2 Intelligence Search
```javascript
// Test semantic search
fetch('/api/v1/intelligence/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "economic trends in GCC countries",
    top_k: 5,
    filters: {
      confidence_level: ["high", "verified"]
    }
  })
})
.then(res => res.json())
.then(data => {
  console.assert(data.results.length > 0, 'Search failed')
  console.assert(data.results[0].similarity_score > 0.5, 'Poor relevance')
})
```

## Step 6: Testing Infrastructure

### 6.1 Run Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run with coverage report
npm run test:coverage

# Verify 80% coverage requirement
npm run test:coverage -- --coverage.thresholdAutoUpdate=false
```

### 6.2 Run Integration Tests
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Run specific module tests
npm run test:integration -- --grep "Countries"
```

### 6.3 Run E2E Tests
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in headed mode for debugging
npm run test:e2e -- --headed

# Run accessibility tests
npm run test:a11y
```

### 6.4 Verify Accessibility
```bash
# Run automated accessibility audit
npm run audit:a11y

# Check specific pages
npm run audit:a11y -- --urls "/forums,/mous,/events"

# Generate accessibility report
npm run audit:a11y -- --reporter html
```

## Step 7: Performance Verification

### 7.1 Frontend Performance
```bash
# Build production bundle
npm run build

# Analyze bundle size
npm run analyze

# Verify targets:
# - Initial bundle < 200KB gzipped ✓
# - Route chunks < 50KB each ✓
# - Total < 1MB gzipped ✓
```

### 7.2 API Performance
```bash
# Run load test
npm run test:load

# Expected results:
# - Response time p95 < 500ms
# - Throughput > 300 req/min per user
# - Error rate < 0.1%
```

## Step 8: Security Verification

### 8.1 Check Security Headers
```bash
# Test security headers
curl -I http://localhost:3000 | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)"

# Expected headers present:
# - Content-Security-Policy
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
```

### 8.2 Test File Upload Security
```bash
# Try uploading oversized file (should fail)
curl -X POST http://localhost:3000/api/v1/data-library \
  -H "Authorization: Bearer $TOKEN" \
  -F "metadata={\"title_en\":\"Test\"}" \
  -F "file=@large-file-60mb.pdf"

# Expected: 413 Payload Too Large

# Try uploading wrong file type (should fail)
curl -X POST http://localhost:3000/api/v1/mous \
  -H "Authorization: Bearer $TOKEN" \
  -F "metadata={\"title_en\":\"Test\"}" \
  -F "document=@malicious.exe"

# Expected: 400 Bad Request - Invalid file type
```

## Step 9: AI Integration Testing

### 9.1 Test AnythingLLM Connection
```bash
# Check AnythingLLM health
curl http://localhost:3001/health

# Test document generation
curl -X POST http://localhost:3000/api/v1/word-assistant/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a brief about digital transformation",
    "document_type": "brief",
    "language": "en"
  }'
```

### 9.2 Test AI Fallback
```bash
# Stop AnythingLLM container
docker-compose stop anythingllm

# Try document generation (should return fallback)
curl -X POST http://localhost:3000/api/v1/word-assistant/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a letter",
    "document_type": "letter",
    "language": "en"
  }'

# Should return 503 with fallback_content
```

## Step 10: Final Verification Checklist

### Core Functionality
- [ ] All 9 frontend routes accessible
- [ ] Language toggle works on all pages
- [ ] RTL/LTR layout switches correctly
- [ ] Navigation highlighting works

### Backend Operations
- [ ] Authentication with JWT works
- [ ] All CRUD endpoints functional
- [ ] Rate limiting enforced (300/min)
- [ ] File uploads limited to 50MB

### Business Logic
- [ ] Event conflict detection works
- [ ] MoU workflow transitions correctly
- [ ] Country search with filters works
- [ ] Intelligence semantic search functional

### Quality Assurance
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Accessibility audit passes (WCAG 2.1 AA)

### Performance
- [ ] Page load < 500ms
- [ ] API responses < 500ms p95
- [ ] Bundle size < 1MB total

### Security
- [ ] RLS policies active
- [ ] Security headers present
- [ ] File upload validation works
- [ ] Rate limiting enforced

### Infrastructure
- [ ] Docker containers running
- [ ] Database migrations applied
- [ ] AnythingLLM connected
- [ ] Monitoring active

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find and kill process using port
lsof -i :3000
kill -9 <PID>
```

#### Docker Memory Issues
```bash
# Increase Docker memory to 8GB
# Docker Desktop > Preferences > Resources > Memory: 8GB
docker-compose down
docker-compose up -d
```

#### Database Connection Failed
```bash
# Check Supabase is running
docker-compose ps supabase

# Check connection string
npx supabase db remote status

# Reset database if needed
npm run db:reset
```

#### Translation Keys Missing
```bash
# Regenerate translation files
npm run i18n:extract

# Check for missing keys
npm run i18n:validate
```

#### Test Failures
```bash
# Clear test cache
npm run test:clear-cache

# Run tests in debug mode
npm run test:debug

# Check test database
docker-compose -f docker-compose.test.yml logs
```

## Next Steps

After completing this quickstart:

1. **Review Documentation**
   - Read architecture docs in `/docs`
   - Review API documentation at `/api-docs`
   - Check component storybook at `npm run storybook`

2. **Set Up Monitoring**
   - Configure Prometheus metrics
   - Set up Grafana dashboards
   - Enable Sentry error tracking

3. **Configure CI/CD**
   - Set up GitHub Actions
   - Configure automated testing
   - Set up deployment pipelines

4. **Security Hardening**
   - Enable MFA for all users
   - Configure backup strategy
   - Set up security scanning

5. **Performance Optimization**
   - Enable CDN for static assets
   - Configure caching strategies
   - Optimize database indexes

## Support

For issues or questions:
- Check `/docs/troubleshooting.md`
- Review GitHub issues
- Contact development team

---
*Last updated: 2025-09-26*