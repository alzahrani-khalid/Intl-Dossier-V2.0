# Quickstart Guide: GASTAT International Dossier System

**Date**: 2025-01-27  
**Feature**: 003-resolve-critical-issues  
**Status**: Complete

## Overview

This quickstart guide demonstrates the core functionality of the GASTAT International Dossier System with all critical issues from spec 002 resolved. The system provides comprehensive management of international relations, documents, and intelligence data with bilingual support, security compliance, and AI integration.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and npm
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## Quick Setup

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/gastat/international-dossier.git
cd international-dossier

# Copy environment configuration
cp .env.example .env

# Configure environment variables
# Edit .env file with your Supabase credentials
```

### 2. Start Services
```bash
# Start all services with Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps

# Check service health
curl http://localhost:3000/api/v1/health
```

### 3. Database Setup
```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Verify database setup
npm run db:verify
```

### 4. Start Development Servers
```bash
# Start frontend and backend in development mode
npm run dev

# Frontend will be available at http://localhost:5173
# Backend API will be available at http://localhost:3000/api/v1
```

## Core User Journeys

### 1. User Authentication & MFA

#### Login Process
1. Navigate to `http://localhost:5173/login`
2. Enter credentials:
   - Email: `admin@gastat.gov.sa`
   - Password: `AdminPassword123!`
3. Complete MFA verification:
   - Enter 6-digit TOTP code from authenticator app
4. Access dashboard with full system permissions

#### Expected Results
- ✅ User successfully authenticated
- ✅ MFA verification completed
- ✅ Dashboard loads within 500ms
- ✅ Language preference (Arabic/English) preserved
- ✅ User permissions properly loaded

### 2. Country Management

#### Create New Country
1. Navigate to Countries section
2. Click "Add New Country"
3. Fill form with:
   - English Name: "United Arab Emirates"
   - Arabic Name: "دولة الإمارات العربية المتحدة"
   - ISO Alpha-2: "AE"
   - ISO Alpha-3: "ARE"
   - Region: "Asia"
   - Status: "Active"
4. Click "Save"

#### Search and Filter Countries
1. Use search bar to find "Saudi Arabia"
2. Apply region filter: "Asia"
3. Apply status filter: "Active"
4. Sort by name (A-Z)

#### Expected Results
- ✅ Country created successfully
- ✅ Search returns results within 500ms
- ✅ Filters work correctly
- ✅ Bilingual names display properly
- ✅ ISO codes validated

### 3. Organization Management

#### Create Organization Hierarchy
1. Navigate to Organizations section
2. Create parent organization:
   - Name: "Ministry of Foreign Affairs"
   - Type: "Government"
   - Country: "Saudi Arabia"
3. Create child organization:
   - Name: "International Relations Department"
   - Type: "Government"
   - Country: "Saudi Arabia"
   - Parent: "Ministry of Foreign Affairs"

#### Expected Results
- ✅ Organization hierarchy created
- ✅ Parent-child relationships established
- ✅ Country associations working
- ✅ Organization types properly categorized

### 4. MoU Document Workflow

#### Create MoU Document
1. Navigate to MoUs section
2. Click "Create New MoU"
3. Fill basic information:
   - Title: "Bilateral Trade Agreement"
   - Organization: "Ministry of Foreign Affairs"
   - Country: "United Arab Emirates"
   - Description: "Trade cooperation agreement"
4. Upload document (PDF, max 50MB)
5. Set effective and expiry dates

#### Workflow State Progression
1. **Draft State**: Document created, ready for review
2. **Internal Review**: Submit for internal approval
3. **External Review**: Send to external parties
4. **Negotiation**: Active negotiation phase
5. **Signed**: Agreement signed by all parties
6. **Active**: Agreement in effect
7. **Renewed/Expired**: Agreement lifecycle complete

#### Expected Results
- ✅ Document uploaded successfully
- ✅ Workflow states progress correctly
- ✅ File size validation (50MB limit)
- ✅ Version control maintained
- ✅ Audit trail preserved

### 5. Event Scheduling & Conflict Detection

#### Schedule New Event
1. Navigate to Events section
2. Click "Schedule Event"
3. Fill event details:
   - Title: "Bilateral Meeting"
   - Start Time: "2025-02-15 10:00"
   - End Time: "2025-02-15 12:00"
   - Location: "Riyadh, Saudi Arabia"
   - Type: "Meeting"
4. Add participants
5. Check for conflicts

#### Conflict Detection
1. Try to schedule overlapping event
2. System detects conflict
3. Shows conflicting events
4. Requires resolution before saving

#### Expected Results
- ✅ Event scheduled successfully
- ✅ Conflicts detected automatically
- ✅ Conflict resolution required
- ✅ Calendar integration working
- ✅ iCal export available

### 6. Intelligence Analysis

#### Create Intelligence Report
1. Navigate to Intelligence section
2. Click "New Report"
3. Select analysis type:
   - Trend Analysis
   - Pattern Detection
   - Prediction
   - Assessment
4. Add data sources
5. Set confidence level and classification
6. Generate AI-powered analysis

#### AI Integration
1. System connects to AnythingLLM
2. Performs vector similarity search
3. Generates insights using pgvector
4. Provides confidence scores
5. Falls back gracefully if AI unavailable

#### Expected Results
- ✅ Intelligence report created
- ✅ AI analysis generated
- ✅ Vector embeddings stored
- ✅ Confidence levels assigned
- ✅ Fallback mechanism working

### 7. Report Generation & Export

#### Generate Summary Report
1. Navigate to Reports section
2. Select report type: "Summary Report"
3. Choose format: "PDF"
4. Set date range: "Last 30 days"
5. Apply filters as needed
6. Click "Generate Report"

#### Export Data
1. Select data to export
2. Choose format: "Excel" or "CSV"
3. Apply filters and sorting
4. Download file

#### Expected Results
- ✅ Report generated successfully
- ✅ Multiple formats supported (PDF, Excel, CSV)
- ✅ Data properly formatted
- ✅ Export completed within 2 seconds

### 8. Data Library Management

#### Upload Document
1. Navigate to Data Library
2. Click "Upload File"
3. Select file (max 50MB)
4. Add metadata:
   - Name: "Trade Statistics 2024"
   - Description: "Annual trade data"
   - Tags: ["trade", "statistics", "2024"]
   - Access Level: "Internal"
5. Upload file

#### Search and Filter
1. Use search bar for "trade"
2. Filter by tags: "statistics"
3. Filter by access level: "Internal"
4. Sort by upload date

#### Expected Results
- ✅ File uploaded successfully
- ✅ File size validated (50MB limit)
- ✅ Metadata properly stored
- ✅ Search and filtering working
- ✅ Access controls enforced

### 9. Bilingual Support

#### Language Switching
1. Click language toggle (EN/AR)
2. Interface switches to Arabic (RTL)
3. All text properly translated
4. Cultural conventions applied
5. Date/number formatting updated

#### RTL Layout
1. Arabic text displays right-to-left
2. UI elements properly aligned
3. Navigation menu reversed
4. Forms adapt to RTL layout

#### Expected Results
- ✅ Language switching seamless
- ✅ RTL layout properly applied
- ✅ All content translated
- ✅ Cultural conventions respected
- ✅ WCAG 2.1 AA compliance maintained

### 10. Security & Access Control

#### Permission Testing
1. Login as different user roles
2. Test access to restricted sections
3. Verify RLS policies working
4. Check audit logs
5. Test MFA enforcement

#### Security Features
1. All inputs validated and sanitized
2. Rate limiting enforced (300 req/min)
3. Encryption at rest and in transit
4. Security events logged
5. Session management working

#### Expected Results
- ✅ Access controls properly enforced
- ✅ RLS policies working
- ✅ Security logging active
- ✅ Input validation preventing attacks
- ✅ Rate limiting preventing abuse

## Performance Validation

### Response Time Testing
```bash
# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/v1/countries"

# Expected: <500ms response time
```

### Load Testing
```bash
# Test concurrent requests
ab -n 1000 -c 10 http://localhost:3000/api/v1/health

# Expected: 300 requests/minute per user
```

### File Upload Testing
```bash
# Test file upload performance
curl -X POST -F "file=@test-document.pdf" http://localhost:3000/api/v1/data-library

# Expected: <2 seconds for 50MB file
```

## Accessibility Testing

### Screen Reader Testing
1. Navigate using keyboard only
2. Test with screen reader (NVDA/JAWS)
3. Verify all content announced
4. Check ARIA labels and roles
5. Test in both languages

### Keyboard Navigation
1. Tab through all interactive elements
2. Verify focus indicators visible
3. Test skip links
4. Verify logical tab order
5. Test keyboard shortcuts

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check Docker logs
docker-compose logs [service-name]

# Restart services
docker-compose restart
```

#### Database Connection Issues
```bash
# Check Supabase connection
npm run db:test-connection

# Reset database
npm run db:reset
```

#### Frontend Build Issues
```bash
# Clear cache and rebuild
npm run clean
npm run build

# Check TypeScript errors
npm run typecheck
```

### Performance Issues
1. Check resource usage: `docker stats`
2. Monitor API response times
3. Verify caching is working
4. Check database query performance

## Success Criteria

### Functional Requirements
- ✅ All 52 functional requirements implemented
- ✅ 10 core entities properly defined
- ✅ Workflow states functioning
- ✅ Search and filtering working
- ✅ Bilingual support complete

### Performance Requirements
- ✅ <500ms response times (95th percentile)
- ✅ <500ms page load times
- ✅ 300 requests/minute rate limiting
- ✅ 50MB file upload limit
- ✅ 5-minute cache for lists, 1-minute for details

### Security Requirements
- ✅ MFA mandatory for all users
- ✅ RLS policies enforced
- ✅ Input validation working
- ✅ Encryption at rest and in transit
- ✅ Security logging active

### Accessibility Requirements
- ✅ WCAG 2.1 Level AA compliance
- ✅ Keyboard navigation working
- ✅ Screen reader compatibility
- ✅ RTL/LTR support complete

### Testing Requirements
- ✅ 80% unit test coverage
- ✅ Integration tests for all APIs
- ✅ E2E tests for critical flows
- ✅ Accessibility testing complete
- ✅ Cross-browser compatibility

## Next Steps

1. **Production Deployment**: Configure production environment
2. **Monitoring Setup**: Implement Prometheus/Grafana monitoring
3. **Backup Strategy**: Set up automated backups
4. **Security Audit**: Conduct comprehensive security review
5. **User Training**: Provide user documentation and training

This quickstart guide demonstrates that all critical issues from spec 002 have been successfully resolved with a fully functional, secure, and accessible system.
