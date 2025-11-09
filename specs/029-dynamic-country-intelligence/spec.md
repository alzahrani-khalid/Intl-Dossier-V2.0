# Feature Specification: Dynamic Country Intelligence System

**Feature Branch**: `029-dynamic-country-intelligence`
**Created**: 2025-01-30
**Status**: Draft
**Input**: User description: "Dynamic Country Intelligence System with AnythingLLM Integration - Transform country dossier pages from static/hardcoded data to a dynamic intelligence system powered by AnythingLLM"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Cached Intelligence Data (Priority: P1)

As a country analyst, I want to see current intelligence insights when I open a country dossier page, so that I can quickly understand the latest economic, political, security, and bilateral relationship context without waiting for AI processing.

**Why this priority**: This is the foundational capability that delivers immediate value. Users must be able to view intelligence data before any other features make sense. This establishes the data flow from cache to UI and validates the core value proposition.

**Independent Test**: Can be fully tested by opening a country dossier page with pre-existing cached intelligence and verifying that economic indicators, political summaries, security assessments, and bilateral relationship insights are displayed correctly with timestamps and confidence levels.

**Acceptance Scenarios**:

1. **Given** a country dossier with cached intelligence less than 24 hours old, **When** I navigate to the country page, **Then** I see economic indicators displayed with the last updated timestamp
2. **Given** cached political intelligence exists, **When** I view the diplomatic relations section, **Then** I see AI-generated relationship analysis with confidence indicators
3. **Given** multiple intelligence types are cached, **When** I navigate to the Intelligence tab, **Then** I see all four intelligence categories (economic, political, security, bilateral) organized with clear headings and metadata

---

### User Story 2 - Manually Refresh Intelligence (Priority: P1)

As a country analyst preparing for a meeting, I want to manually refresh intelligence data on demand, so that I can ensure I have the most current information even if cached data exists.

**Why this priority**: Manual refresh is critical for user control and complements the cached data view. This allows users to override automatic TTL expiration when they need fresh data immediately, which is essential for time-sensitive decisions.

**Independent Test**: Can be fully tested by clicking a "Refresh Intelligence" button on a country dossier page, observing loading state, and verifying that new data is fetched from AnythingLLM and displayed with updated timestamps.

**Acceptance Scenarios**:

1. **Given** I am viewing cached intelligence data, **When** I click the "Refresh Intelligence" button, **Then** the system displays a loading indicator and fetches fresh data from AnythingLLM
2. **Given** the refresh is in progress, **When** new data is retrieved successfully, **Then** the UI updates with the new intelligence and shows an updated timestamp
3. **Given** I refresh intelligence for economic data, **When** the refresh completes, **Then** only economic intelligence is updated while other categories remain unchanged (selective refresh)
4. **Given** the AnythingLLM service is unavailable, **When** I click refresh, **Then** I see an error message and the existing cached data remains visible

---

### User Story 3 - Access Intelligence Tab Dashboard (Priority: P2)

As a policy officer, I want to view a comprehensive intelligence dashboard with all four intelligence categories organized in a dedicated tab, so that I can analyze country intelligence in depth without cluttering the main dossier overview.

**Why this priority**: The intelligence tab provides deep-dive capability for power users who need comprehensive analysis. This is P2 because basic inline insights (P1) already deliver value; the dedicated tab enhances analysis workflows for advanced users.

**Independent Test**: Can be fully tested by clicking an "Intelligence" tab on a country dossier page and verifying that a dashboard displays with four sections (Economic, Political, Security, Bilateral), each showing detailed intelligence reports, timelines, and filtering options.

**Acceptance Scenarios**:

1. **Given** I am viewing a country dossier, **When** I click the "Intelligence" tab, **Then** I see a dashboard with four clearly labeled sections for each intelligence type
2. **Given** I am on the Intelligence tab, **When** I scroll through the economic section, **Then** I see detailed economic indicators with historical trends and data source attributions
3. **Given** I am viewing the Political Analysis section, **When** I filter by date range, **Then** I see only political intelligence reports within that timeframe
4. **Given** I am on the Intelligence tab, **When** I click "Export Dashboard", **Then** I can download a PDF or Word document containing all intelligence data

---

### User Story 4 - View Inline Intelligence Insights (Priority: P2)

As a country analyst, I want to see relevant intelligence insights embedded directly within existing country dossier sections (Geographic Context, Diplomatic Relations, etc.), so that I can understand context without switching tabs or scrolling away from the information I'm reviewing.

**Why this priority**: Inline insights improve user experience by providing contextual intelligence where it's most relevant. This is P2 because it enhances the existing dossier view but depends on P1 (cached intelligence) being implemented first.

**Independent Test**: Can be fully tested by viewing a country dossier page and verifying that AI-generated insights appear as widgets within the Geographic Context section (economic data), Diplomatic Relations section (bilateral analysis), and other relevant sections, each with refresh buttons and metadata.

**Acceptance Scenarios**:

1. **Given** I am viewing the Geographic Context section, **When** the page loads, **Then** I see an inline intelligence widget displaying current GDP, inflation rate, and trade balance with last updated timestamp
2. **Given** I am viewing the Diplomatic Relations section, **When** the page loads, **Then** I see an AI-generated relationship strength score and trend analysis inline
3. **Given** I am viewing an inline intelligence widget, **When** I click the widget's refresh button, **Then** only that specific intelligence type is refreshed without reloading the entire page
4. **Given** intelligence data is stale (older than TTL), **When** I view an inline widget, **Then** I see a visual indicator (e.g., yellow badge) showing the data is outdated with an option to refresh

---

### User Story 5 - Automatic Background Refresh (Priority: P3)

As a system administrator, I want intelligence data to automatically refresh in the background when cached data expires (based on TTL), so that users generally see fresh data without manual intervention while minimizing unnecessary API calls.

**Why this priority**: Background refresh improves data freshness but is P3 because users can still manually refresh (P1) and the system works with stale data. This is an optimization that enhances user experience but isn't required for MVP functionality.

**Independent Test**: Can be fully tested by setting a short TTL (e.g., 5 minutes), waiting for expiration, viewing a country dossier page, and verifying that the system automatically triggers a background refresh without user action while displaying the stale cached data until the refresh completes.

**Acceptance Scenarios**:

1. **Given** cached intelligence data has expired (past TTL), **When** a user views the country dossier page, **Then** the system displays the cached data immediately and triggers a background refresh
2. **Given** a background refresh is in progress, **When** the user is actively viewing the page, **Then** the UI updates automatically when fresh data arrives without requiring a page reload
3. **Given** multiple users view the same country within a short timeframe, **When** a background refresh is triggered, **Then** only one refresh request is made and all users benefit from the updated cache
4. **Given** a background refresh fails due to AnythingLLM unavailability, **When** the error occurs, **Then** the system logs the error and retries after a backoff period without disrupting the user experience

---

### User Story 6 - Replace Placeholder Sections with Dynamic Data (Priority: P2)

As a country analyst, I want to see actual bilateral agreements and key officials data instead of "Coming soon" placeholders, so that I have a complete picture of the country's diplomatic relationships and leadership.

**Why this priority**: Replacing placeholders directly addresses existing gaps in the country dossier page. This is P2 because it enhances completeness but depends on the intelligence infrastructure (P1) being in place to source and display this data dynamically.

**Independent Test**: Can be fully tested by navigating to a country dossier page and verifying that the Bilateral Agreements section displays actual agreements (sourced from database and AnythingLLM analysis) and the Key Officials section shows person dossiers linked to the country with AI-generated profiles.

**Acceptance Scenarios**:

1. **Given** bilateral agreements exist in the database for a country, **When** I view the Bilateral Agreements section, **Then** I see a list of agreements with partner countries, effective dates, and AI-generated summaries of significance
2. **Given** person dossiers are linked to a country via relationships, **When** I view the Key Officials section, **Then** I see official names, positions, and AI-generated profile summaries
3. **Given** no bilateral agreements exist for a country, **When** I view the Bilateral Agreements section, **Then** I see a helpful empty state message suggesting potential opportunities identified by AI analysis
4. **Given** I click on a bilateral agreement, **When** the detail view opens, **Then** I can see the full agreement details, related documents, and AI-generated impact analysis

---

### Edge Cases

- **What happens when AnythingLLM service is completely unavailable?**
  System displays cached intelligence with a warning banner indicating data may be stale. Manual refresh attempts show user-friendly error messages. Critical workflows remain functional using cached data.

- **What happens when a country has no cached intelligence data?**
  System displays a loading state and immediately triggers intelligence generation. If generation fails, empty states with helpful messages explain that intelligence is being prepared and will be available soon.

- **How does the system handle concurrent refresh requests from multiple users?**
  System uses a locking mechanism to ensure only one refresh operation runs per country per intelligence type at a time. Subsequent requests wait for the in-progress refresh to complete.

- **What happens when cache expires while a user is viewing the page?**
  System triggers a background refresh and shows a non-intrusive notification (e.g., toast) when fresh data is available, allowing the user to reload the view without losing their current context.

- **How does the system handle partial data retrieval failures?**
  If only some intelligence types fail to refresh (e.g., economic data succeeds but political data fails), the system updates successful types and shows specific error messages for failed types while retaining old cached data for failed categories.

- **What happens when external APIs (World Bank, travel advisories) are rate-limited?**
  System implements exponential backoff and queuing for external API calls. If rate limits are hit, the system falls back to showing cached data with a note about temporary unavailability.

- **How does the system handle bilingual (English/Arabic) intelligence?**
  Intelligence data includes both English and Arabic translations. If AI-generated content is only in English initially, the system either uses machine translation or queues for human review before displaying in Arabic.

- **What happens when a user tries to refresh intelligence they don't have permission to view?**
  System validates permissions before allowing refresh operations and shows appropriate error messages if users lack access rights.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cache intelligence data in the database with TTL (time-to-live) expiration timestamps
- **FR-002**: System MUST support four intelligence types: economic indicators, political events & diplomatic developments, security & risk assessments, and bilateral relationship analysis
- **FR-003**: System MUST integrate with AnythingLLM via API to retrieve AI-generated intelligence insights
- **FR-004**: System MUST integrate with external data sources (World Bank API for economic indicators, travel advisory APIs for security assessments)
- **FR-005**: System MUST display cached intelligence data with last updated timestamps and confidence levels
- **FR-006**: Users MUST be able to manually trigger intelligence refresh via a "Refresh Intelligence" button
- **FR-007**: System MUST show loading indicators during intelligence refresh operations
- **FR-008**: System MUST fall back to cached data when AnythingLLM service is unavailable and display appropriate warning messages
- **FR-009**: System MUST provide a dedicated Intelligence tab on country dossier pages with comprehensive dashboard views
- **FR-010**: System MUST display inline intelligence insights within existing country dossier sections (Geographic Context, Diplomatic Relations, etc.)
- **FR-011**: System MUST automatically trigger background refresh when cached intelligence data expires (TTL-based)
- **FR-012**: System MUST support different TTL values for different intelligence types (e.g., 24h for economic, 6h for political, 12h for security, 48h for bilateral)
- **FR-013**: System MUST track data sources for each intelligence item in metadata (which APIs, documents, or AI models were used)
- **FR-014**: System MUST track refresh status for each intelligence item (fresh, stale, refreshing, error)
- **FR-015**: System MUST support versioning of intelligence data to enable historical analysis
- **FR-016**: System MUST replace the "Bilateral Agreements" placeholder section with dynamic data from database and AI analysis
- **FR-017**: System MUST replace the "Key Officials" placeholder section with person dossier links and AI-generated profiles
- **FR-018**: System MUST support selective refresh (users can refresh individual intelligence types without refreshing all data)
- **FR-019**: System MUST prevent duplicate refresh operations for the same country/intelligence type when multiple users trigger refreshes concurrently
- **FR-020**: System MUST provide export functionality for intelligence dashboard (PDF/Word format)
- **FR-021**: System MUST support filtering intelligence reports by date range and confidence level in the Intelligence tab
- **FR-022**: System MUST provide vector similarity search to find related intelligence reports
- **FR-023**: System MUST support both English and Arabic for all intelligence data (multilingual)
- **FR-024**: System MUST validate user permissions before displaying or refreshing sensitive intelligence data
- **FR-025**: System MUST log all intelligence refresh operations with user, timestamp, and outcome for audit purposes

### Key Entities

- **Intelligence Report**: Represents a single piece of intelligence for a country, including intelligence type (economic/political/security/bilateral), content (English and Arabic), confidence level, classification level, cached data, cache expiration timestamp, data sources metadata, refresh status, and versioning information

- **Country Dossier**: The primary entity that intelligence reports are attached to, referenced by entity_id in intelligence reports table

- **Intelligence Cache**: Metadata tracking cache status including TTL expiration, last refresh timestamp, refresh status (fresh/stale/refreshing/error), and data source attributions

- **External Data Source**: Represents external APIs or services providing raw intelligence data (e.g., World Bank API for GDP data, travel advisory APIs for security information), tracked in data_sources JSONB field

- **AnythingLLM Workspace**: Logical workspace within AnythingLLM containing country-specific documents and embeddings used for RAG (Retrieval-Augmented Generation) queries

- **Refresh Operation**: Represents an in-progress or completed intelligence refresh request, including user who triggered it, timestamp, intelligence types being refreshed, and completion status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view cached intelligence data on country dossier pages with page load time under 2 seconds
- **SC-002**: Manual intelligence refresh completes within 5 seconds for cached responses and within 10 seconds for fresh AnythingLLM queries
- **SC-003**: Intelligence cache hit ratio exceeds 80% (meaning 80%+ of page views use cached data rather than triggering fresh queries)
- **SC-004**: Background refresh operations complete without user awareness (no page reloads required) in 95% of cases
- **SC-005**: System maintains 99% uptime for intelligence display even when AnythingLLM service is degraded (via cached fallback)
- **SC-006**: Users successfully complete country analysis tasks using intelligence insights 40% faster than with static/placeholder data
- **SC-007**: At least 70% of country dossiers have fresh intelligence data (within TTL) at any given time
- **SC-008**: Intelligence data freshness meets defined TTL targets: economic 24h, political 6h, security 12h, bilateral 48h
- **SC-009**: Zero duplicate concurrent refresh operations occur for the same country/intelligence type
- **SC-010**: Intelligence export functionality generates complete PDF/Word documents in under 15 seconds
- **SC-011**: Vector similarity search returns relevant intelligence reports in under 2 seconds
- **SC-012**: 95% of intelligence refresh operations complete successfully without errors or requiring retry
- **SC-013**: Both Bilateral Agreements and Key Officials sections display dynamic data for at least 80% of countries within 30 days of deployment
- **SC-014**: User satisfaction score for intelligence feature exceeds 4.0 out of 5.0 based on post-implementation survey
- **SC-015**: Intelligence dashboard receives at least 50% user engagement (users view Intelligence tab at least once per session)

## Assumptions

1. **AnythingLLM Docker Instance**: A running AnythingLLM instance is available via Docker with API access and sufficient compute resources for real-time query processing
2. **Existing Database Schema**: The `intelligence_reports` table exists with vector embeddings support (1536 dimensions) and can be extended with additional columns
3. **External API Access**: The system has network access to external APIs (World Bank, travel advisory services) and these APIs have acceptable rate limits for batch operations
4. **User Authentication**: User authentication and role-based access control (RBAC) are already implemented and can be leveraged for intelligence permission checks
5. **Multilingual Support**: The i18next internationalization framework is already configured and supports English and Arabic throughout the application
6. **Supabase Edge Functions**: Supabase Edge Functions are available for backend intelligence processing and can be deployed as needed
7. **TanStack Query**: TanStack Query (React Query) is already integrated and configured for data fetching, caching, and state management
8. **Country Dossier Pages**: Country dossier detail pages are already implemented with sections for Geographic Context, Diplomatic Relations, Bilateral Agreements (placeholder), and Key Officials (placeholder)
9. **Document Storage**: Supabase Storage or equivalent is available for storing intelligence-related documents and attachments
10. **Performance Budget**: The system can handle up to 100 concurrent users viewing/refreshing intelligence without performance degradation
11. **Data Retention**: Intelligence data will be retained indefinitely for historical analysis unless manually archived/deleted by administrators
12. **AI Model Availability**: AnythingLLM has access to a capable language model (e.g., GPT-4, Claude, or equivalent) for generating intelligence insights
13. **Vector Search**: PostgreSQL pgvector extension is enabled and configured for vector similarity search on intelligence embeddings

## Dependencies

- **AnythingLLM Docker Service**: Feature depends on AnythingLLM being deployed and accessible via API
- **External Data APIs**: Feature depends on external APIs (World Bank, travel advisories) being available and having documented endpoints
- **Database Schema Extensions**: Feature depends on extending the `intelligence_reports` table with columns for entity_id, entity_type, cache_expires_at, intelligence_type, data_sources, and refresh_status
- **Edge Function Deployment**: Feature depends on deploying three new Supabase Edge Functions: `intelligence-get`, `intelligence-refresh`, and `intelligence-batch-update`
- **Existing Country Dossier Infrastructure**: Feature depends on the existing country dossier pages and routing being functional
- **Aceternity UI Components**: Feature depends on Aceternity UI components (or equivalent) for building mobile-first, RTL-compatible intelligence widgets

## Open Questions

None. All critical decisions have been made based on user input and reasonable defaults. If additional clarification is needed during planning, the `/speckit.clarify` command can be used.
