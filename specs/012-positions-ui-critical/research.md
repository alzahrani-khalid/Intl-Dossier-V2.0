# Research & Technical Decisions
**Feature**: Positions UI Critical Integrations
**Date**: 2025-10-01

## 1. Multi-Entry Point Navigation Architecture

### Decision: Context-Aware Route Design with Shared Components
**Chosen Approach**: Implement three distinct route entry points that share underlying position components but provide different contextual wrappers:
- `/dossiers/:id` → Positions tab (filtered by dossier)
- `/engagements/:id` → Positions section (with AI suggestions + attachment UI)
- `/positions` → Standalone library (all positions)

**Rationale**:
- TanStack Router's layout routes enable code reuse while maintaining distinct contexts
- Route params provide natural context filtering (dossier ID, engagement ID)
- Shared `<PositionList>` component with different data sources via React Context or route context
- Preserves URL-based navigation state (filters, search) across contexts

**Alternatives Considered**:
- **Single route with query params** (`/positions?context=dossier&id=123`): Rejected because less intuitive URLs and harder to manage permissions per context
- **Modal-based navigation**: Rejected because poor accessibility and loss of browser history

**Implementation Pattern**:
```typescript
// Route structure
/_protected/dossiers/$dossierId/positions  // Tab within dossier
/_protected/engagements/$engagementId      // Section in engagement detail
/_protected/positions                      // Standalone library

// Shared context provider
<PositionContext.Provider value={{ source: 'dossier', dossierId }}>
  <PositionList />
</PositionContext.Provider>
```

**References**:
- TanStack Router layout routes: https://tanstack.com/router/latest/docs/framework/react/guide/route-trees#layout-routes
- React Context for cross-component state: https://react.dev/reference/react/useContext

---

## 2. Many-to-Many Relationship Management (Engagement-Position)

### Decision: Junction Table with Rich Metadata + Optimistic UI Updates
**Chosen Approach**:
- Database: `engagement_positions` junction table with additional fields (attachment_reason, display_order, relevance_score, attached_by, attached_at)
- Frontend: TanStack Query mutations with optimistic updates for instant feedback
- Backend: Supabase Edge Functions with transaction support for atomic operations

**Rationale**:
- Rich junction table captures audit trail and display preferences
- Optimistic updates provide instant UI feedback while maintaining data consistency
- TanStack Query's mutation rollback handles failure scenarios gracefully
- Supabase RLS on junction table enforces permission checks (only dossier collaborators)

**Alternatives Considered**:
- **Array of position IDs in engagement record**: Rejected because poor query performance, no metadata per relationship, and violates normalization
- **Separate microservice for relationships**: Rejected because adds unnecessary complexity for this feature scope

**Data Model**:
```sql
CREATE TABLE engagement_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE RESTRICT,
  attached_by UUID REFERENCES users(id),
  attached_at TIMESTAMPTZ DEFAULT now(),
  attachment_reason TEXT,
  display_order INTEGER,
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(engagement_id, position_id)
);
```

**TanStack Query Pattern**:
```typescript
const attachPosition = useMutation({
  mutationFn: async (params) => {
    return supabase.from('engagement_positions').insert(params);
  },
  onMutate: async (newAttachment) => {
    // Optimistic update
    await queryClient.cancelQueries(['engagement-positions', engagementId]);
    const previousData = queryClient.getQueryData(['engagement-positions', engagementId]);
    queryClient.setQueryData(['engagement-positions', engagementId], old => [...old, newAttachment]);
    return { previousData };
  },
  onError: (err, newAttachment, context) => {
    // Rollback on error
    queryClient.setQueryData(['engagement-positions', engagementId], context.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['engagement-positions', engagementId]);
  }
});
```

**References**:
- TanStack Query optimistic updates: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- Supabase RLS policies: https://supabase.com/docs/guides/auth/row-level-security

---

## 3. AI-Powered Position Suggestions

### Decision: pgvector Similarity Search with AnythingLLM Embeddings + Fallback
**Chosen Approach**:
- Store position embeddings in `position_embeddings` table using pgvector
- Generate engagement embeddings on-the-fly from context (title, description, stakeholders)
- Use cosine similarity (`<=>` operator) to rank positions by relevance
- Fallback to keyword-based search if AnythingLLM unavailable

**Rationale**:
- pgvector provides fast (<100ms) similarity search for up to 10k positions
- Self-hosted AnythingLLM ensures data sovereignty
- Embedding caching (positions) reduces AI service load
- Graceful degradation maintains functionality when AI service is down

**Alternatives Considered**:
- **External AI API (OpenAI, Anthropic)**: Rejected due to data sovereignty requirements
- **Full-text search only**: Rejected because misses semantic relevance (e.g., "policy brief" vs "talking points")
- **Rule-based matching**: Rejected because too rigid and requires manual maintenance

**Implementation Pattern**:
```typescript
// Edge function: positions-suggest
async function suggestPositions(engagementId: string) {
  const engagement = await getEngagement(engagementId);

  try {
    // Try AI-powered suggestions
    const embeddingText = `${engagement.title} ${engagement.description} ${engagement.stakeholders?.join(' ')}`;
    const embedding = await anythingLLM.generateEmbedding(embeddingText);

    const { data: suggestions } = await supabase.rpc('match_positions', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 20
    });

    return suggestions;
  } catch (error) {
    // Fallback to keyword search
    console.warn('AI suggestions failed, using keyword fallback', error);
    return await keywordSearch(engagement.title, engagement.topics);
  }
}
```

**Database Function**:
```sql
CREATE OR REPLACE FUNCTION match_positions(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  relevance_score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.position_id,
    1 - (pe.embedding <=> query_embedding) AS relevance_score
  FROM position_embeddings pe
  WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY relevance_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

**References**:
- pgvector documentation: https://github.com/pgvector/pgvector
- AnythingLLM embeddings API: https://docs.anythingllm.com/embeddings
- Vector similarity operators: https://supabase.com/docs/guides/ai/vector-indexes

---

## 4. Bilingual Briefing Pack Generation

### Decision: React-PDF for Template + Supabase Functions for Translation
**Chosen Approach**:
- Use `@react-pdf/renderer` for PDF generation with bilingual templates
- Separate templates for RTL (Arabic) and LTR (English) layouts
- Translate positions on-the-fly using AnythingLLM translation API when language mismatch
- Store generated PDFs in Supabase Storage with expiration policy

**Rationale**:
- React-PDF provides component-based PDF generation (familiar to React developers)
- Native RTL support with proper text directionality
- Translation within PDF generation flow ensures consistent language
- Supabase Storage handles large files efficiently with CDN support

**Alternatives Considered**:
- **Puppeteer/Playwright for HTML-to-PDF**: Rejected because requires browser runtime in edge functions (resource-heavy)
- **LaTeX-based generation**: Rejected because steep learning curve and limited RTL support
- **Pre-translated positions**: Rejected because storage overhead (duplicate content) and stale translations

**Template Structure**:
```typescript
// briefing-pack-template.tsx
const BriefingPackPDF = ({ engagement, positions, language }) => (
  <Document>
    <Page size="A4" style={language === 'ar' ? stylesRTL : stylesLTR}>
      {/* Header with org branding */}
      <View style={styles.header}>
        <Image src={GASTAT_LOGO} style={styles.logo} />
        <Text style={styles.title}>
          {language === 'ar' ? 'حزمة الإحاطة' : 'Briefing Pack'}
        </Text>
      </View>

      {/* Engagement metadata */}
      <View style={styles.metadata}>
        <Text>{engagement.title[language]}</Text>
        <Text>{formatDate(engagement.date, language)}</Text>
      </View>

      {/* Positions */}
      {positions.map(position => (
        <PositionSection
          key={position.id}
          position={translateIfNeeded(position, language)}
          language={language}
        />
      ))}
    </Page>
  </Document>
);

// Translation helper
async function translateIfNeeded(position, targetLang) {
  if (position.primary_language === targetLang) {
    return position;
  }

  const translatedContent = await anythingLLM.translate({
    text: position.content,
    from: position.primary_language,
    to: targetLang,
    context: 'diplomatic briefing'
  });

  return { ...position, content: translatedContent };
}
```

**Performance Optimization**:
- Batch translate positions before rendering (parallel requests)
- Cache translations temporarily (1 hour) for re-generation
- Stream PDF generation for large packs (>50 positions)
- Set timeout of 10s per 100 positions (fail gracefully if exceeded)

**References**:
- React-PDF documentation: https://react-pdf.org/
- RTL support in React-PDF: https://react-pdf.org/advanced#rtl-support
- Supabase Storage: https://supabase.com/docs/guides/storage

---

## 5. Cross-Module Navigation & State Preservation

### Decision: TanStack Router Search Params + SessionStorage
**Chosen Approach**:
- Use TanStack Router's search params for filter/search state (URL persistence)
- Use sessionStorage for temporary UI state (scroll position, expanded cards)
- Implement breadcrumb navigation with route hierarchy awareness

**Rationale**:
- URL-based state enables bookmarking and sharing filtered views
- SessionStorage preserves UI state during navigation without polluting URL
- TanStack Router's type-safe search params prevent invalid state
- Browser back/forward maintains user context

**Alternatives Considered**:
- **Global state (Zustand/Redux)**: Rejected because overkill for navigation state and not URL-shareable
- **LocalStorage**: Rejected because persists too long (clutters storage over time)
- **React Context only**: Rejected because lost on page refresh

**Implementation Pattern**:
```typescript
// Route definition with search params
export const positionsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/positions',
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || '',
    status: (search.status as string) || 'all',
    dateFrom: (search.dateFrom as string) || '',
    dateTo: (search.dateTo as string) || '',
  }),
});

// Component usage
function PositionList() {
  const navigate = useNavigate();
  const { search, status, dateFrom, dateTo } = positionsRoute.useSearch();

  const updateFilters = (newFilters) => {
    navigate({
      search: { ...positionsRoute.useSearch(), ...newFilters }
    });
  };

  // Preserve scroll position
  useEffect(() => {
    const scrollPos = sessionStorage.getItem('positions-scroll');
    if (scrollPos) window.scrollTo(0, parseInt(scrollPos));

    return () => {
      sessionStorage.setItem('positions-scroll', window.scrollY.toString());
    };
  }, []);

  // ... rest of component
}
```

**Breadcrumb Navigation**:
```typescript
// Auto-generated from route hierarchy
function Breadcrumbs() {
  const matches = useMatches();

  return (
    <nav aria-label="breadcrumb">
      {matches.map((match, i) => (
        <Link key={i} to={match.pathname}>
          {match.routeContext.breadcrumbLabel}
        </Link>
      ))}
    </nav>
  );
}
```

**References**:
- TanStack Router search params: https://tanstack.com/router/latest/docs/framework/react/guide/search-params
- Web Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API

---

## 6. Performance Optimization Strategies

### Decision: Virtual Scrolling + Query Batching + Debounced Search
**Chosen Approach**:
- Use `@tanstack/react-virtual` for position lists (>100 items)
- Implement cursor-based pagination for position library
- Debounce search input (300ms) to reduce API calls
- Batch AI suggestion requests when attaching multiple positions

**Rationale**:
- Virtual scrolling handles 100+ positions without DOM bloat
- Cursor pagination scales better than offset-based for large datasets
- Debouncing reduces server load while maintaining UX responsiveness
- Batching minimizes AI service roundtrips

**Alternatives Considered**:
- **Infinite scroll without virtualization**: Rejected because DOM nodes accumulate (memory leak)
- **Offset-based pagination**: Rejected because slow for large offsets and inconsistent with real-time updates
- **No debouncing**: Rejected because excessive API calls on every keystroke

**Virtual Scrolling Implementation**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedPositionList({ positions }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: positions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // estimated position card height
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <PositionCard position={positions[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Search Debouncing**:
```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function PositionSearch() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { data: positions } = useQuery({
    queryKey: ['positions', 'search', debouncedSearch],
    queryFn: () => searchPositions(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  return (
    <input
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      placeholder="Search positions..."
    />
  );
}
```

**References**:
- TanStack Virtual: https://tanstack.com/virtual/latest
- Cursor pagination best practices: https://www.prisma.io/docs/orm/prisma-client/queries/pagination#cursor-based-pagination

---

## 7. Error Handling & Resilience

### Decision: Circuit Breaker Pattern for AI Services + Error Boundaries
**Chosen Approach**:
- Implement circuit breaker for AnythingLLM calls (open after 3 failures in 30s)
- React Error Boundaries on position-related components
- Graceful degradation: AI suggestions → keyword search → manual attach only
- Retry logic with exponential backoff for briefing pack generation

**Rationale**:
- Circuit breaker prevents cascading failures when AI service is down
- Error boundaries isolate failures to position module without crashing app
- Progressive degradation maintains core functionality
- Retry with backoff gives transient errors time to resolve

**Alternatives Considered**:
- **Immediate retry on every failure**: Rejected because amplifies load during outages
- **No circuit breaker**: Rejected because repeated failed calls degrade overall system
- **Crash entire page on AI failure**: Rejected because violates resilient architecture principle

**Circuit Breaker Implementation**:
```typescript
class AIServiceCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 30000) {
        this.state = 'half-open';
      } else {
        console.warn('Circuit breaker OPEN, using fallback');
        return fallback();
      }
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.reset();
      }
      return result;
    } catch (error) {
      this.recordFailure();
      return fallback();
    }
  }

  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= 3) {
      this.state = 'open';
    }
  }

  private reset() {
    this.failureCount = 0;
    this.state = 'closed';
  }
}
```

**Error Boundary**:
```typescript
class PositionModuleErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>{t('positions.error.title')}</AlertTitle>
          <AlertDescription>{t('positions.error.description')}</AlertDescription>
          <Button onClick={() => this.setState({ hasError: false })}>
            {t('positions.error.retry')}
          </Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}
```

**References**:
- Circuit breaker pattern: https://martinfowler.com/bliki/CircuitBreaker.html
- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

---

## 8. Accessibility Implementation

### Decision: ARIA Live Regions + Keyboard Shortcuts + Screen Reader Testing
**Chosen Approach**:
- Implement ARIA live regions for dynamic position attachment feedback
- Keyboard shortcuts: Enter to attach, Delete to detach, Arrow keys for navigation
- Screen reader announcements for AI suggestions and attachment status
- Test with VoiceOver (macOS) and NVDA (Windows) in both languages

**Rationale**:
- ARIA live regions provide real-time feedback without interrupting user flow
- Keyboard shortcuts enable power users and accessibility compliance
- Bilingual screen reader testing ensures equal experience for Arabic users
- Follows WCAG 2.1 Level AA requirements

**Alternatives Considered**:
- **Mouse-only interactions**: Rejected due to WCAG violations
- **Visual feedback only**: Rejected because excludes screen reader users
- **English-only testing**: Rejected because violates bilingual excellence principle

**Implementation Pattern**:
```typescript
function PositionAttachButton({ positionId, engagementId }) {
  const { t } = useTranslation();
  const [announceText, setAnnounceText] = useState('');

  const attachMutation = useMutation({
    mutationFn: () => attachPosition(positionId, engagementId),
    onSuccess: () => {
      setAnnounceText(t('positions.attached.success', {
        positionTitle: position.title
      }));
    },
    onError: () => {
      setAnnounceText(t('positions.attached.error'));
    }
  });

  return (
    <>
      <Button
        onClick={() => attachMutation.mutate()}
        aria-label={t('positions.attach.label', { title: position.title })}
        aria-keyshortcuts="Enter"
      >
        {t('positions.attach.button')}
      </Button>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceText}
      </div>
    </>
  );
}
```

**Keyboard Navigation**:
```typescript
function PositionList({ positions }) {
  const handleKeyDown = (e: React.KeyboardEvent, position: Position) => {
    switch (e.key) {
      case 'Enter':
        attachPosition(position.id);
        break;
      case 'Delete':
        detachPosition(position.id);
        break;
      case 'ArrowDown':
        focusNextPosition();
        break;
      case 'ArrowUp':
        focusPreviousPosition();
        break;
    }
  };

  return (
    <div role="list" aria-label={t('positions.list.label')}>
      {positions.map((position, index) => (
        <div
          key={position.id}
          role="listitem"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, position)}
          aria-posinset={index + 1}
          aria-setsize={positions.length}
        >
          <PositionCard position={position} />
        </div>
      ))}
    </div>
  );
}
```

**References**:
- ARIA live regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions
- WCAG 2.1 keyboard requirements: https://www.w3.org/WAI/WCAG21/Understanding/keyboard
- VoiceOver testing guide: https://www.apple.com/accessibility/voiceover/

---

## Outstanding Research Items

The following areas have been resolved through the research above:

1. ✅ **Multi-entry point navigation**: Context-aware routes with shared components
2. ✅ **Many-to-many relationships**: Rich junction table with optimistic UI
3. ✅ **AI suggestions**: pgvector similarity search with fallback
4. ✅ **Bilingual PDF generation**: React-PDF with translation pipeline
5. ✅ **State preservation**: Search params + sessionStorage
6. ✅ **Performance**: Virtual scrolling + debouncing + batching
7. ✅ **Error handling**: Circuit breaker + error boundaries
8. ✅ **Accessibility**: ARIA + keyboard navigation + bilingual testing

All technical unknowns from the feature specification have been researched and decisions documented. Ready to proceed to Phase 1: Design & Contracts.
