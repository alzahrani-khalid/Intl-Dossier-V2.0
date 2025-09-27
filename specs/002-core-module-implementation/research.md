# Research Findings: Core Module Implementation

## Overview
Research conducted for implementing core system modules with focus on bilingual support, accessibility compliance, and self-hosted AI integration.

## Key Technical Decisions

### 1. Frontend Routing Architecture
**Decision**: TanStack Router with type-safe routing  
**Rationale**: 
- Provides complete type safety for route parameters
- Built-in code splitting support for better performance
- Excellent TypeScript integration
- Supports nested layouts for consistent UI structure
**Alternatives considered**: 
- React Router v6: Less type safety, more boilerplate
- Next.js App Router: Over-engineered for our SPA needs

### 2. Bilingual Implementation Strategy
**Decision**: react-i18next with namespace separation  
**Rationale**:
- Industry standard for React internationalization
- Supports RTL/LTR switching seamlessly
- Lazy loading of translation files
- Built-in pluralization and formatting
**Alternatives considered**:
- FormatJS (react-intl): More complex API
- Custom solution: Unnecessary reinvention

### 3. State Management Pattern
**Decision**: TanStack Query for server state, Zustand for client state  
**Rationale**:
- Clear separation of concerns
- TanStack Query handles caching, synchronization, and background updates
- Zustand provides minimal boilerplate for UI state
- Both have excellent TypeScript support
**Alternatives considered**:
- Redux Toolkit: Too much boilerplate for our needs
- Context API only: Performance issues at scale

### 4. Form Validation Approach
**Decision**: React Hook Form with Zod schemas  
**Rationale**:
- Zod provides runtime type checking matching TypeScript types
- React Hook Form minimizes re-renders
- Excellent accessibility support out of the box
- Works well with bilingual error messages
**Alternatives considered**:
- Formik + Yup: Larger bundle size, less TypeScript integration
- Native HTML5 validation: Insufficient for complex business rules

### 5. API Contract Testing
**Decision**: OpenAPI 3.1 specs with contract testing via Vitest  
**Rationale**:
- OpenAPI provides clear documentation
- Can generate TypeScript types from specs
- Contract tests ensure frontend/backend compatibility
- Integrates with existing test infrastructure
**Alternatives considered**:
- GraphQL: Overkill for our RESTful needs
- tRPC: Would require significant backend changes

### 6. Accessibility Testing Strategy
**Decision**: Automated testing with axe-core + manual screen reader testing  
**Rationale**:
- axe-core catches 57% of WCAG issues automatically
- Integrates with Playwright for E2E accessibility tests
- Manual testing covers screen reader announcement flows
- Supports both English and Arabic accessibility testing
**Alternatives considered**:
- WAVE API: Less comprehensive coverage
- Manual only: Too time-consuming and error-prone

### 7. File Upload Architecture
**Decision**: Supabase Storage with resumable uploads  
**Rationale**:
- Built-in integration with our backend
- Supports large files up to 50MB limit
- Automatic virus scanning available
- RLS policies for security
**Alternatives considered**:
- Direct S3: More complex setup
- Local file system: Doesn't scale horizontally

### 8. Offline Queue Implementation
**Decision**: IndexedDB with background sync API  
**Rationale**:
- IndexedDB provides sufficient storage for offline operations
- Background sync ensures reliable upload when online
- Works across all modern browsers
- Can queue complex operations, not just data
**Alternatives considered**:
- LocalStorage: Size limitations (5-10MB)
- Service Worker cache only: Not suitable for mutable data

### 9. Real-time Updates Pattern
**Decision**: Supabase Realtime with optimistic UI updates  
**Rationale**:
- Native integration with our database
- Supports presence for collaborative features
- Row-level security applies to subscriptions
- Automatic reconnection handling
**Alternatives considered**:
- Socket.io: Would require separate infrastructure
- Polling: Inefficient and higher latency

### 10. Error Boundary Strategy
**Decision**: Component-level error boundaries with fallback UI  
**Rationale**:
- Prevents entire app crashes
- Allows graceful degradation
- Can show error in user's language
- Integrates with error logging
**Alternatives considered**:
- Global error boundary only: Less granular control
- No error boundaries: Poor user experience

## Performance Optimizations

### Code Splitting Strategy
- Route-based splitting for each of the 9 modules
- Lazy load heavy components (Rich text editor, Charts)
- Separate vendor bundles for caching

### Bundle Size Targets
- Initial bundle: <200KB gzipped
- Route chunks: <50KB each
- Total application: <1MB gzipped

### Caching Strategy
- Static assets: 1 year cache with hash-based invalidation
- API responses: 5 minute cache for lists, 1 minute for details
- Offline data: IndexedDB with 50MB quota

## Security Considerations

### Authentication Flow
- Supabase Auth with MFA
- JWT tokens with 1 hour expiry
- Refresh tokens rotated on use
- Session storage in httpOnly cookies

### File Upload Security
- Client-side file type validation
- Server-side MIME type checking
- Virus scanning via ClamAV
- Sandboxed preview generation

### API Security
- Rate limiting: 300 requests/minute/user
- Request signing for sensitive operations
- Input sanitization at edge
- SQL injection prevention via parameterized queries

## Testing Strategy

### Unit Testing
- Target: 80% code coverage
- Tools: Vitest + React Testing Library
- Mock Supabase client for isolated tests
- Separate test database for integration tests

### E2E Testing  
- Critical user journeys in both languages
- Accessibility testing with each flow
- Visual regression testing for RTL/LTR
- Performance testing under load

### Contract Testing
- Generate tests from OpenAPI specs
- Run against mock and real servers
- Validate request/response schemas
- Test error scenarios

## Deployment Architecture

### Container Structure
```
docker-compose.yml
├── frontend (Nginx + React app)
├── supabase-db (PostgreSQL)
├── supabase-auth
├── supabase-storage
├── supabase-realtime
├── anythingllm
└── reverse-proxy (Traefik)
```

### Resource Requirements
- Frontend: 256MB RAM, 0.5 CPU
- Database: 2GB RAM, 1 CPU  
- AnythingLLM: 4GB RAM, 2 CPU
- Total: ~8GB RAM, 5 CPU cores

## Migration Strategy

### Database Migrations
- Sequential numbered migrations
- Up/down migrations for reversibility
- Seed data for development
- Migration testing in staging

### Feature Flags
- Gradual rollout of new modules
- A/B testing for UI changes
- Kill switches for critical features
- User-based feature targeting

## Monitoring & Observability

### Metrics Collection
- Prometheus for metrics
- Grafana for visualization
- Custom dashboards per module
- Alert thresholds for SLAs

### Error Tracking
- Sentry for error aggregation
- Source maps for debugging
- User context preservation
- Bilingual error messages

### Performance Monitoring
- Core Web Vitals tracking
- API response time histograms
- Database query analysis
- Resource utilization metrics

## Resolved Clarifications

All NEEDS CLARIFICATION items from the specification have been researched:

1. **Cache duration**: 5 minutes for list data, 1 minute for details
2. **Country search filters**: Name, region, status, ISO codes
3. **Organization attributes**: Name, type, country, parent org, status
4. **Calendar integration**: Internal only initially, iCal export supported
5. **Intelligence analysis**: Trend analysis, pattern detection via pgvector
6. **Report formats**: PDF, Excel, CSV exports
7. **Browser support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
8. **Response time targets**: <500ms p95 for searches

## Next Steps

With research complete, proceed to Phase 1 for:
- Data model definition
- API contract generation  
- Contract test creation
- Quickstart guide development

---
*Research completed: 2025-09-26*