# Feature Specification: AI Brief Generation & Intelligence Layer

**Feature Branch**: `033-ai-brief-generation`
**Created**: 2025-12-05
**Status**: Ready for Implementation
**Input**: User description: "AI Brief Generation & Intelligence Layer - Implement AI infrastructure (LLM Router, BGE-M3 embeddings) and AI-assisted brief generation for engagements. Users can generate context-aware briefs for upcoming meetings, events, and diplomatic engagements using RAG (Retrieval-Augmented Generation). The system pulls relevant data from dossiers, positions, historical engagements, and commitments to create comprehensive briefing materials. Includes an AI chat dock for interactive assistance and observability for cost/usage tracking."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Generate Engagement Brief (Priority: P1)

As a **Country Analyst**, I need to generate an AI-assisted brief before an upcoming engagement so that I can quickly prepare comprehensive background materials without manually researching multiple dossiers, positions, and historical records.

**Why this priority**: This is the core value proposition of the feature. Manual brief preparation takes 2-4 hours; AI-assisted generation should reduce this to under 5 minutes. This directly addresses PRD goal of "50% reduction in time to prepare for international engagements."

**Independent Test**: Can be fully tested by selecting an upcoming engagement, clicking "Generate Brief", and verifying the system produces a structured brief with relevant context from related dossiers, positions, commitments, and historical engagements. Delivers immediate value by automating research and compilation.

**Acceptance Scenarios**:

1. **Given** I am viewing an engagement detail page, **When** I click "Generate Brief", **Then** the system begins generating a brief with a progress indicator showing retrieval and generation stages
2. **Given** the brief generation is in progress, **When** I watch the progress, **Then** I see real-time streaming of the generated content as it's being written
3. **Given** the brief generation completes, **When** I view the result, **Then** I see a structured brief containing: executive summary, country/org background, key attendees, relevant positions, active commitments, historical context, and recommended talking points
4. **Given** a generated brief references source data, **When** I click on a citation, **Then** I am navigated to the source dossier, position, or engagement
5. **Given** I am not satisfied with the generated brief, **When** I click "Regenerate", **Then** a new brief is generated with potentially different emphasis
6. **Given** I want to customize the brief, **When** I provide additional context in a prompt field before generation, **Then** the generated brief incorporates my guidance

---

### User Story 2 - Ask Questions via AI Chat Dock (Priority: P1)

As a **Policy Officer**, I need to ask natural language questions about dossiers, relationships, and commitments so that I can quickly find information without navigating through multiple pages or using complex search queries.

**Why this priority**: Natural language interface dramatically lowers the barrier to information retrieval. Users can ask "What commitments do we have with Saudi Arabia?" instead of navigating to country dossier → commitments tab → filtering.

**Independent Test**: Can be fully tested by opening the AI chat dock, asking a question about a specific country or organization, and verifying the response is accurate and includes citations to source data. Delivers value by providing instant answers with context.

**Acceptance Scenarios**:

1. **Given** I am on any page in the application, **When** I click the AI assistant button (bottom-right dock), **Then** a chat interface opens with a text input and message history
2. **Given** the chat dock is open, **When** I type "What are our active commitments with Japan?", **Then** the AI responds with a list of active commitments, their status, and due dates, with clickable links to each commitment
3. **Given** I ask a complex question like "Compare our engagement frequency with Germany vs France over the last year", **When** the AI processes the query, **Then** it retrieves relevant data and provides a comparative analysis with specific metrics
4. **Given** the AI is generating a response, **When** I watch the chat, **Then** I see the response streaming in real-time (token by token) for immediate feedback
5. **Given** the AI uses a tool (e.g., searching dossiers), **When** the tool executes, **Then** I see a visual indicator of the tool being used and its results
6. **Given** I am viewing the chat on mobile, **When** I use the chat dock, **Then** the interface is optimized for touch with appropriate sizing and keyboard handling

---

### User Story 3 - Review AI-Suggested Entity Links (Priority: P2)

As an **Intake Officer**, I need AI to suggest relevant dossiers and positions for new intake requests so that I can quickly link incoming tickets to the appropriate entities without manual searching.

**Why this priority**: Intake linking is time-consuming and error-prone. AI suggestions with human-in-the-loop approval improve accuracy while maintaining accountability.

**Independent Test**: Can be fully tested by creating an intake ticket, triggering AI link suggestions, reviewing the proposals, and approving/rejecting them. Delivers value by reducing manual entity lookup time.

**Acceptance Scenarios**:

1. **Given** I have created an intake ticket with title and description, **When** I click "Suggest Links", **Then** the AI analyzes the content and proposes relevant dossiers and positions
2. **Given** the AI has proposed links, **When** I view the suggestions, **Then** each suggestion shows the entity name, type, confidence score (high/medium/low), and a brief justification
3. **Given** I agree with a suggested link, **When** I click "Approve", **Then** the link is created between the intake ticket and the entity
4. **Given** I disagree with a suggested link, **When** I click "Reject", **Then** the suggestion is dismissed and the rejection is logged for model improvement
5. **Given** the AI is uncertain, **When** confidence is below 70%, **Then** the suggestion is marked as "Review Recommended" with amber styling

---

### User Story 4 - View AI Usage and Costs (Priority: P3)

As an **Admin**, I need to monitor AI usage and costs across the organization so that I can manage budget allocation and identify unusual usage patterns.

**Why this priority**: Cost management is important for sustainability but doesn't block core functionality. Can be delivered after the primary AI features are working.

**Independent Test**: Can be fully tested by accessing the admin AI dashboard and verifying it shows usage metrics, costs, and trends over time. Delivers value by enabling informed resource allocation.

**Acceptance Scenarios**:

1. **Given** I am an admin user, **When** I navigate to Admin → AI Usage, **Then** I see a dashboard with total tokens used, total cost, and breakdown by feature (brief generation, chat, entity linking)
2. **Given** I am viewing the usage dashboard, **When** I select a date range, **Then** the metrics update to show usage within that period
3. **Given** usage approaches the monthly budget cap, **When** 80% of the cap is reached, **Then** an alert notification is sent to admins
4. **Given** I want to drill down into usage, **When** I click on a specific feature's usage, **Then** I see individual runs with timestamps, users, token counts, and costs

---

### User Story 5 - Configure AI Privacy Policies (Priority: P3)

As an **Admin**, I need to configure AI routing policies for my organization so that sensitive data is only processed by approved LLM providers (e.g., private/on-premises vs cloud).

**Why this priority**: Privacy configuration is essential for compliance but is an admin setup task, not a daily user workflow.

**Independent Test**: Can be fully tested by setting organization policy to "private LLM only", then verifying AI requests are routed to the private provider and not cloud services.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I navigate to Admin → AI Settings, **Then** I see options for default LLM provider, Arabic model preference, and data classification routing rules
2. **Given** I set policy to "Private LLM Only", **When** any user generates a brief, **Then** the request is routed to the configured private LLM (vLLM/Ollama) instead of cloud providers
3. **Given** a document is classified as "Secret", **When** AI processing is requested, **Then** the system automatically routes to private LLM regardless of organization default
4. **Given** Arabic content is detected, **When** AI processing occurs, **Then** the system routes to the configured Arabic-optimized model if available

---

### Edge Cases

- **Insufficient source data**: When generating a brief for an engagement with no related dossier data, the AI should indicate "Limited data available" and generate a minimal brief with suggestions for what data to add.
- **Rate limiting**: If OpenAI/Anthropic rate limits are hit, the system should queue requests and notify users of estimated wait time.
- **Long-running generation**: Briefs for complex engagements with many related entities may take 30+ seconds; progress indicators should show which stage is active (retrieval, generation, citations).
- **Conflicting positions**: If retrieved positions contain contradictory information, the AI should highlight the conflict rather than arbitrarily choosing one.
- **Stale embeddings**: If a dossier was recently updated but not re-embedded, semantic search may miss relevant content; system should flag when last embedding update occurred.
- **Private LLM unavailable**: If the private LLM is offline and policy requires it, the system should fail gracefully with a clear message rather than falling back to cloud.
- **Arabic/English mixed content**: The system should handle bilingual content, routing to appropriate models and maintaining language consistency in outputs.

## Requirements _(mandatory)_

### Functional Requirements

#### AI Infrastructure

- **FR-001**: System MUST implement a centralized LLM Router that handles all AI requests, selecting the appropriate provider/model based on organization policy, data classification, and language detection
- **FR-002**: System MUST support multiple LLM providers: OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), and private deployments (vLLM, Ollama)
- **FR-003**: System MUST implement BGE-M3 embeddings (1024 dimensions) for all vector operations, replacing any legacy embedding implementations
- **FR-004**: System MUST detect Arabic content and route to Arabic-optimized models when configured in organization policy
- **FR-005**: System MUST enforce monthly spend caps per organization, blocking requests when cap is reached and alerting admins at 80% threshold

#### Brief Generation

- **FR-006**: System MUST generate structured briefs containing: executive summary, entity background, key participants, relevant positions, active commitments, historical engagements, and recommended talking points
- **FR-007**: System MUST use RAG to retrieve relevant context from dossiers, positions, commitments, engagements, and documents before generation
- **FR-008**: System MUST stream brief content in real-time as it's generated (SSE for web, WebSocket for mobile)
- **FR-009**: System MUST include citations linking generated content to source entities with deep links
- **FR-010**: System MUST support custom prompts allowing users to guide brief focus and emphasis
- **FR-011**: System MUST store generated briefs for future reference with timestamps and generation parameters

#### AI Chat Interface

- **FR-012**: System MUST provide a persistent chat dock accessible from any page in the application
- **FR-013**: System MUST support natural language queries about dossiers, commitments, engagements, and relationships
- **FR-014**: System MUST stream chat responses in real-time with visible tool usage indicators
- **FR-015**: System MUST provide tools for: semantic search, entity lookup, commitment queries, and engagement history
- **FR-016**: System MUST maintain conversation context within a session for follow-up questions

#### Entity Link Suggestions

- **FR-017**: System MUST analyze intake ticket content to suggest relevant dossiers and positions
- **FR-018**: System MUST provide confidence scores (0-100) and justifications for each suggestion
- **FR-019**: System MUST implement human-in-the-loop approval workflow for suggested links
- **FR-020**: System MUST log approval/rejection decisions for model improvement feedback

#### Observability & Privacy

- **FR-021**: System MUST record all AI runs with: user, feature, provider, model, tokens (input/output), cost, latency, status
- **FR-022**: System MUST provide admin dashboard showing usage metrics, costs, and trends
- **FR-023**: System MUST enforce data classification routing: "secret" → private only, "confidential" → per org policy
- **FR-024**: System MUST support organization-level LLM policies configurable by admins

#### User Experience

- **FR-025**: System MUST support mobile-first responsive design for AI chat with minimum 44x44px touch targets
- **FR-026**: System MUST fully support RTL layout for Arabic chat interactions
- **FR-027**: System MUST provide clear loading states and progress indicators during AI operations
- **FR-028**: System MUST handle errors gracefully with user-friendly messages and retry options

### Key Entities

- **AI Brief**: A generated document containing structured intelligence about an engagement, including executive summary, background, participants, positions, commitments, and recommendations. Generated via RAG using relevant dossier and historical data.
- **AI Run**: An observability record of a single AI operation, capturing user, feature, provider, model, tokens, cost, latency, and status for usage tracking and debugging.
- **AI Message**: A single message in an AI chat conversation, either from user or assistant, with optional tool calls and citations.
- **Entity Link Proposal**: An AI-suggested connection between an intake ticket and a dossier/position, including confidence score and justification, pending human approval.
- **Organization LLM Policy**: Configuration defining which LLM providers an organization allows, default model preferences, Arabic routing, and spend caps.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can generate a comprehensive engagement brief in under 60 seconds (excluding edge cases with 100+ related entities)
- **SC-002**: Generated briefs achieve 80% user acceptance rate (users don't need to regenerate or heavily edit)
- **SC-003**: AI chat responses return within 3 seconds for simple queries, 10 seconds for complex queries requiring tool use
- **SC-004**: Entity link suggestions achieve 75% precision (approved suggestions / total suggestions)
- **SC-005**: All AI operations are logged with 100% coverage for observability
- **SC-006**: Monthly AI cost tracking is accurate within 5% of actual provider invoices
- **SC-007**: Private LLM routing is enforced 100% of the time when policy requires it (no data leakage to cloud)
- **SC-008**: 100% of UI components render correctly in both LTR (English) and RTL (Arabic) layouts
- **SC-009**: All interactive elements meet minimum 44x44px touch target size on mobile devices
- **SC-010**: System handles up to 50 concurrent AI requests without degradation (p95 latency under 5s)

## Clarifications

### Session 2025-12-05

- Q: Which embedding model should be used? → A: BGE-M3 (1024 dimensions) as specified in AI_INTEGRATION_FINAL_PLAN.md, with OpenAI text-embedding-3-small as fallback
- Q: Should briefs be editable after generation? → A: No, briefs are read-only snapshots. Users regenerate if needed. Future version may support editing.
- Q: How long should chat history be retained? → A: Chat history persists for the browser session. No server-side storage of chat history in v1.
- Q: Should entity link approvals be audited? → A: Yes, all approvals and rejections are logged with user and timestamp for model improvement feedback.

### Session 2025-12-05 (Spec Review)

- Q: Are OpenAI and BGE-M3 embeddings index-compatible for fallback? → A: **No, they are NOT index-compatible.** BGE-M3 is the PRIMARY embedding model. OpenAI is only used during initial setup/migration if BGE-M3 fails to load. Once vectors are stored, the system MUST use the same model. If BGE-M3 becomes unavailable at runtime, the system should FAIL with a clear error rather than silently switch to OpenAI (which would produce incompatible vectors). A re-embedding migration script handles any model transitions.

- Q: What is the Arabic/English mixed content detection threshold? → A: **30% Arabic characters triggers Arabic routing.** The detection algorithm counts Unicode Arabic range characters (U+0600-U+06FF, U+0750-U+077F) as a percentage of total alphanumeric characters. If ≥30% are Arabic, content is routed to Arabic-optimized model. This threshold balances:
  - Pure Arabic text (>90%): Always routes to Arabic model
  - Bilingual content with Arabic majority: Routes to Arabic model
  - English with occasional Arabic terms (<30%): Uses default model
  - Code/technical content with Arabic comments: Contextually handled

- Q: How should timeout/partial results be handled for long brief generations? → A: **Graceful degradation with partial results.** If brief generation exceeds 90 seconds:
  1. Return whatever content has been generated so far
  2. Mark brief as `status: 'partial'` with `timeout_at` timestamp
  3. Show user message: "Brief generation timed out. Partial results shown. You can regenerate for a complete brief."
  4. Log timeout in `ai_runs` for monitoring
  5. Do NOT retry automatically (user must explicitly regenerate)

## Assumptions

- Supabase pgvector extension is already enabled and configured for 1024-dimensional vectors
- Organization policies and data classification levels are already defined in the system
- Users have appropriate permissions to access dossiers and entities referenced in briefs
- Private LLM deployments (if configured) have sufficient capacity to handle expected load
- The existing engagement, dossier, position, and commitment data models remain stable

## Out of Scope

- Voice-enabled briefing requests (future enhancement)
- Multi-turn brief refinement ("make it shorter", "add more about X")
- Automatic brief scheduling before engagements
- Integration with external calendar systems for engagement detection
- AI-powered translation of briefs
- Custom fine-tuning of models on organization data
- Offline AI capabilities for mobile app
- Bulk brief generation for multiple engagements

## Dependencies

### Required Features (Must Be Complete)

- **Feature 029**: Dynamic Country Intelligence - Provides dossier relationship data for brief context
- **Feature 026**: Unified Dossier Architecture - Core dossier data model for retrieval
- **Feature 022**: After-Action Structured - Historical engagement data for context

### Database Dependencies

| Table                  | Purpose                     | Required Columns                          |
| ---------------------- | --------------------------- | ----------------------------------------- |
| `dossiers`             | Core entity data            | id, name, type, description               |
| `positions`            | Policy positions for briefs | id, title, content, dossier_id            |
| `aa_commitments`       | Active commitments          | id, title, status, due_date, dossier_id   |
| `engagements`          | Engagement details          | id, title, date, participants, dossier_id |
| `intake_tickets`       | For entity linking          | id, title, description, status            |
| `organizations`        | Org-level policies          | id, name                                  |
| `organization_members` | Role-based access           | user_id, organization_id, role            |

### Infrastructure Dependencies

| Component        | Purpose                         | Required Version |
| ---------------- | ------------------------------- | ---------------- |
| Redis            | Caching, rate limiting, session | 7.x              |
| pgvector         | Semantic search                 | 0.5+             |
| Supabase Storage | Brief PDFs (optional)           | -                |

### NPM Dependencies (Backend)

| Package                | Purpose           | Version |
| ---------------------- | ----------------- | ------- |
| `@mastra/core`         | Agent framework   | latest  |
| `@xenova/transformers` | BGE-M3 embeddings | ^2.0    |
| `openai`               | OpenAI SDK        | ^4.0    |
| `@anthropic-ai/sdk`    | Anthropic SDK     | ^0.20   |
| `ioredis`              | Redis client      | ^5.0    |
