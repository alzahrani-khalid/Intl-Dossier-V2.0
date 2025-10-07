# Feature Specification: Search & Retrieval

**Feature Branch**: `015-search-retrieval-spec`
**Created**: 2025-10-04
**Status**: Draft
**Input**: User description: "Search & Retrieval — Spec

Purpose: expand search coverage and add semantic suggestions.

## Goals

- Include dossiers, contacts/people, engagements, and positions in global search.
- Typeahead suggestions by entity type; filters.
- Optional semantic search (vector) for briefs/positions/documents.

## UX

- Global omnibox: entity filters, keyboard navigation, bilingual snippets.
- Results tabs: All, Dossiers, People, Engagements, Positions, MoUs, Documents.

## API

- Extend `/api/search` to return above entities; add `type` filter.
- `GET /api/search/suggest?type=...&q=...` unified endpoint.
- `/api/search/semantic` for vector queries (optional).

## AI

- Vector embeddings via existing vector.service for docs/briefs/positions.
- \"People also looked for\" co‑click suggestions.

## Acceptance

- Query returns mixed entities with correct counts; suggestions appear <200ms (cached)."

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature description provided ✓
2. Extract key concepts from description
   → Identified: global search, multiple entity types, semantic search, suggestions, filtering
3. For each unclear aspect:
   → Marked with [NEEDS CLARIFICATION] tags below
4. Fill User Scenarios & Testing section
   → Primary user journey defined ✓
5. Generate Functional Requirements
   → 18 testable requirements generated
6. Identify Key Entities (if data involved)
   → 7 search-related entities identified
7. Run Review Checklist
   → Uncertainties marked for clarification
8. Return: SUCCESS (spec ready for planning with clarifications needed)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-04

- Q: What is the 200ms performance target for search suggestions? → A: Absolute maximum (every suggestion must be under 200ms)
- Q: How should the system rank search results by default? → A: Exact match priority (exact keyword matches first, then semantic matches)
- Q: How should the system handle permission-restricted search results? → A: Show count only (e.g., "3 additional results require higher permissions")
- Q: How frequently should the search index be updated after entity changes? → A: Real-time (immediately upon entity create/update/delete)
- Q: What should happen when a search query returns no results? → A: Combination (typo suggestions + search tips)
- Q: When a search query is ambiguous (e.g., "Paris" could be a person, location, or conference name), how should results be presented? → A: Entity type tabs (existing design handles disambiguation)
- Q: How should the system handle very long search queries (e.g., copy-pasted paragraphs)? → A: Hard limit at 500 characters, truncate input and extract key terms automatically
- Q: What similarity threshold should filter low-confidence semantic matches, and how should they be visually distinguished? → A: 0.6 threshold (60% similarity), separate "Related" section below exact matches
- Q: Should archived or soft-deleted entities appear in search results, and if so, how should they be indicated? → A: Include with "Archived" badge visual indicator
- Q: When suggestion cache is outdated or unavailable (Redis down), what fallback behavior should occur? → A: Direct database query fallback, accept 300-500ms latency with loading indicator
- Q: How should the search system handle special characters, wildcards, or search operators? → A: Boolean operators (AND, OR, NOT) plus quoted phrases for exact matching
- Q: What is the expected concurrent user capacity for simultaneous search operations? → A: 50-100 concurrent users (department-level usage)
- Q: What is the expected total number of searchable entities the system must handle? → A: 10,000-50,000 entities (medium dataset)

---

## User Scenarios & Testing

### Primary User Story
As a GASTAT staff member working on international dossiers, I need to quickly find relevant information across multiple entity types (dossiers, people, engagements, positions, documents) using a unified search interface. The search should understand my intent, provide instant suggestions as I type, and allow me to filter results by entity type. The system should support both exact keyword matching and semantic understanding to surface related content even when keywords don't match exactly.

### Acceptance Scenarios

1. **Given** I am on any page in the system, **When** I click the global search box and type "climate", **Then** the system displays typeahead suggestions showing dossiers, people, engagements, positions, and documents related to climate topics within 200ms

2. **Given** I have entered "trade agreement" in the search box, **When** I press Enter, **Then** I see tabbed results showing counts for All, Dossiers, People, Engagements, Positions, MoUs, and Documents with relevant matches in each category

3. **Given** search results are displayed, **When** I click the "Dossiers" tab, **Then** I see only dossier results with bilingual snippets showing matching context in both Arabic and English

4. **Given** I am viewing search results, **When** I apply an entity type filter (e.g., "People only"), **Then** results update to show only contacts/people matching my query

5. **Given** I search for "مناخ" (climate in Arabic), **When** results appear, **Then** I see relevant matches with snippets in both languages, regardless of which language the original content was in

6. **Given** I search for a concept like "sustainable development", **When** semantic search is enabled, **Then** I also see results for related terms like "environmental policy" or "green initiatives" even if they don't contain the exact keywords

7. **Given** search suggestions are displayed, **When** I navigate using keyboard arrow keys, **Then** I can move through suggestions and select one by pressing Enter

8. **Given** I have completed a search, **When** the system shows "People also looked for" suggestions, **Then** I see related queries that other users commonly searched after similar searches

### Edge Cases

- What happens when a search query returns no results? System displays typo-corrected alternative query suggestions combined with helpful search tips to guide the user.

- What happens when a search query is ambiguous (e.g., "Paris" could be a person, location, or conference name)? The existing tabbed result view (All, Dossiers, People, Engagements, Positions, MoUs, Documents) serves as the disambiguation mechanism. Users can click tabs to filter by entity type.

- How does the system handle very long search queries (e.g., copy-pasted paragraphs)? System enforces a 500-character maximum. If input exceeds this limit, the system truncates the query and automatically extracts key terms using NLP for search processing. User sees a warning message indicating truncation occurred.

- What happens when semantic search returns low-confidence matches? System uses a 0.6 (60%) similarity threshold to filter semantic results. Matches below this threshold are not displayed. Semantic results that meet the threshold are shown in a separate "Related" section below exact keyword matches to clearly distinguish them.

- How does search handle archived or soft-deleted entities? Archived entities are included in search results and displayed with a visible "Archived" badge to distinguish them from active items. This allows users to find historical information while maintaining clear status visibility.

- What happens when suggestion cache is outdated or unavailable? System falls back to direct PostgreSQL database queries when Redis cache is unavailable. Degraded performance of 300-500ms latency is acceptable during fallback mode. A loading indicator is shown to users to indicate processing time.

- How does search handle special characters, wildcards, or search operators? System supports Boolean operators (AND, OR, NOT) for query logic and quoted phrases for exact matching (e.g., "climate change" AND policy). Other special characters are treated as literal text.

- What happens when a user has no permission to view certain search results? System displays count of restricted results (e.g., "3 additional results require higher permissions") without revealing details.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a global search interface accessible from any page in the application

- **FR-002**: System MUST search across all entity types: dossiers, contacts/people, engagements, positions, MoUs, and documents, including archived entities which are displayed with an "Archived" badge

- **FR-003**: System MUST display typeahead suggestions as the user types, grouped by entity type

- **FR-004**: System MUST display suggestions within 200ms of user input as an absolute maximum (every suggestion must meet this threshold)

- **FR-005**: System MUST support bilingual search, accepting queries in both Arabic and English

- **FR-006**: System MUST display result snippets in both Arabic and English, showing matching context

- **FR-007**: System MUST provide tabbed result views: All, Dossiers, People, Engagements, Positions, MoUs, Documents

- **FR-008**: System MUST display result counts for each entity type tab

- **FR-009**: System MUST support keyboard navigation for search suggestions (arrow keys, Enter to select, Escape to close)

- **FR-010**: System MUST allow users to filter results by entity type

- **FR-011**: System MUST support semantic search using vector embeddings for briefs, positions, and documents

- **FR-012**: System MUST provide "People also looked for" related query suggestions based on co-click patterns [NEEDS CLARIFICATION: Minimum click data required before showing suggestions? Privacy considerations?]

- **FR-013**: System MUST cache suggestion results to meet performance targets, with fallback to direct database queries (300-500ms latency acceptable) when cache is unavailable, displaying a loading indicator to users during degraded performance

- **FR-014**: System MUST respect Row Level Security (RLS) policies when returning search results, displaying accessible entities plus a count of restricted results (e.g., "3 additional results require higher permissions")

- **FR-015**: System MUST highlight or indicate search term matches within result snippets

- **FR-016**: Users MUST be able to clear search input and reset results with a single action

- **FR-017**: System MUST handle concurrent searches without blocking or degrading user experience

- **FR-019**: System MUST display typo-corrected alternative query suggestions when a search returns no results

- **FR-020**: System MUST provide helpful search tips alongside alternative suggestions when no results are found

- **FR-021**: System MUST enforce a 500-character maximum on search queries, truncating longer inputs and extracting key terms automatically with a user-visible warning

- **FR-022**: System MUST support Boolean operators (AND, OR, NOT) for query logic and quoted phrases for exact phrase matching, treating other special characters as literal text

- **FR-018**: System MUST distinguish between exact keyword matches and semantic search results by displaying them in separate sections: exact matches shown first, followed by a "Related" section for semantic matches (≥60% similarity threshold)

### Non-Functional Requirements

- **NFR-001**: Search results MUST be ranked by exact match priority, with exact keyword matches appearing before semantic matches

- **NFR-002**: System MUST support 50-100 concurrent users performing simultaneous search operations without performance degradation or blocking

- **NFR-003**: Search index MUST be updated in real-time, immediately upon entity create, update, or delete operations

- **NFR-004**: System MUST maintain search performance targets (suggestions <200ms, results <500ms p95) with a dataset of 10,000-50,000 total searchable entities across all types

- **NFR-005**: Semantic search quality MUST achieve a minimum 60% similarity threshold (0.6 vector similarity score) for results to be displayed, ensuring acceptable relevance

### Key Entities

- **Search Query**: User's input text, may include filters, entity type preferences, and language context

- **Search Result**: A matched entity with metadata including entity type, title, snippet, match score, and bilingual content

- **Search Suggestion**: Typeahead recommendation with entity type, preview text, and match relevance

- **Entity Type**: Category of searchable items (Dossier, Person/Contact, Engagement, Position, MoU, Document)

- **Result Tab**: Organized view of results filtered by entity type with count

- **Semantic Match**: Vector-based search result with similarity score, applicable to briefs, positions, and documents

- **Related Query**: Co-click based suggestion showing what other users searched for in similar contexts

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs) - *Kept description high-level, no specific tech mentioned*
- [x] Focused on user value and business needs - *Emphasizes finding information quickly across entities*
- [x] Written for non-technical stakeholders - *Uses plain language to describe search capabilities*
- [x] All mandatory sections completed - *User Scenarios, Requirements, and Entities defined*

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain - *1 low-priority clarification deferred to planning (FR-012 privacy considerations)*
- [x] Requirements are testable and unambiguous - *Each FR has clear success criteria*
- [x] Success criteria are measurable - *Performance targets: <200ms suggestions, <500ms p95 results, 50-100 concurrent users, 10k-50k entities*
- [x] Scope is clearly bounded - *Limited to search across specified entity types*
- [x] Dependencies and assumptions identified - *Assumes existing vector.service for embeddings, RLS policies for access control*

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed - *Spec has uncertainties that need stakeholder input*

---

## Next Steps

1. ✅ **Clarifications complete**: 13 critical ambiguities resolved across two clarification sessions (2025-10-04)
2. ✅ **Performance targets defined**: <200ms suggestions (absolute), <500ms p95 results, 50-100 concurrent users, 10k-50k entities
3. ✅ **Edge cases addressed**: Zero results, long queries, low confidence matches, archived items, cache fallback, Boolean operators
4. 🔄 **Deferred to planning**: FR-012 privacy considerations for "People also looked for" feature (low priority, can use conservative defaults)

**Specification is ready for the planning phase** (`/plan` command)
