# Feature Specification: Complete Mobile Development to Match Web Progress

**Feature Branch**: `020-complete-the-development`
**Created**: 2025-10-12
**Status**: Draft
**Platform Scope**: mobile-only
**Input**: User description: "complete the development of the mobile version to reach the same level of progress as the web one"

## Clarifications

### Session 2025-10-12

- Q: What level of encryption is required for offline cached data (intake drafts, dossiers, assignments) stored on the mobile device? → A: Field-level encryption for sensitive data only (confidential+ tickets, user credentials) with platform storage for other data
- Q: What is the maximum limit for offline cached data storage per user to prevent device storage exhaustion? → A: Dynamic limit based on available device storage (use max 20% of free space, minimum 200MB)
- Q: What level of observability (logging, crash reporting, analytics) is required for the mobile app in production? → A: Crash reporting + performance + business metrics only (no personal data, track feature usage, workflow completion rates)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Front Door Intake on Mobile (Priority: P1)

Field staff and analysts need to submit intake requests (engagements, positions, MoU actions, foresight) directly from their mobile devices while in the field, with the same bilingual form capabilities and AI triage features available on the web version.

**Why this priority**: Front door intake is the primary entry point for all work requests in the system. Field staff often discover urgent situations requiring immediate intake submission while away from desks. Without mobile intake capability, critical requests are delayed until staff return to computers.

**Independent Test**: Can be fully tested by opening the mobile app, navigating to Front Door, completing a bilingual intake form with dossier linking, and verifying the ticket appears in the queue with AI triage suggestions. Delivers value by enabling immediate request submission from any location.

**Acceptance Scenarios**:

1. **Given** a field staff member opens the Front Door screen on mobile, **When** they select a request type (Engagement/Position/MoU/Foresight), **Then** they see a mobile-optimized bilingual form with request-specific fields and dossier linking options
2. **Given** a user completes an intake form on mobile, **When** they attach documents from device storage or camera, **Then** attachments up to 25MB per file (100MB total) are uploaded with progress indicators
3. **Given** a user submits an intake request on mobile, **When** the submission completes, **Then** they receive a ticket ID, SLA countdown badge displays, and AI triage suggestions appear within 2 seconds
4. **Given** a user is offline when completing an intake form, **When** they tap submit, **Then** the request queues locally and auto-submits when connectivity returns with notification confirmation
5. **Given** a supervisor views the intake queue on mobile, **When** they tap a ticket, **Then** they see AI triage suggestions (type, sensitivity, urgency, recommended owner) with Accept/Override actions optimized for touch

---

### User Story 2 - Advanced Search & Retrieval on Mobile (Priority: P1)

Mobile users need comprehensive search capabilities across all entity types (dossiers, people, engagements, positions, MoUs, documents) with typeahead suggestions, semantic search, and entity filtering to quickly find information while mobile.

**Why this priority**: Search is a critical navigation and discovery tool. Field staff often need to quickly locate specific dossiers, contacts, or documents while in meetings or field visits. Without robust mobile search, productivity is severely limited.

**Independent Test**: Can be tested by opening global search on mobile, typing queries, verifying typeahead suggestions appear <200ms, and confirming results are properly filtered by entity type. Delivers value by providing instant access to any system information from mobile device.

**Acceptance Scenarios**:

1. **Given** a user taps the global search icon on mobile, **When** they type "climate" in Arabic or English, **Then** typeahead suggestions appear within 200ms showing dossiers, people, engagements, positions, and documents
2. **Given** search results are displayed on mobile, **When** the user swipes horizontally or taps tabs, **Then** they can filter results by entity type (All, Dossiers, People, Engagements, Positions, MoUs, Documents) with result counts
3. **Given** a user searches on mobile, **When** semantic search is enabled, **Then** related results appear in a separate "Related" section showing items with ≥60% similarity even without exact keyword matches
4. **Given** a user enters a long search query on mobile, **When** input exceeds 500 characters, **Then** the system truncates and extracts key terms with a mobile-friendly warning message
5. **Given** search returns no results on mobile, **When** the user views the empty state, **Then** they see typo-corrected suggestions and search tips optimized for mobile screen size

---

### User Story 3 - User Management & Access Control on Mobile (Priority: P2)

HR administrators and managers need to perform user management tasks (create accounts, assign roles, manage delegations, review access) from mobile devices to handle urgent personnel changes while away from office.

**Why this priority**: User management is typically performed from desktops, but urgent situations (employee departures, emergency role changes, delegation during absences) require mobile access. While not daily operations, mobile capability prevents delays in critical security and access scenarios.

**Independent Test**: Can be tested by creating a user account on mobile, assigning roles, setting up delegations with expiration dates, and verifying immediate session termination when roles change. Delivers value by enabling urgent user management from any location.

**Acceptance Scenarios**:

1. **Given** an HR administrator opens user management on mobile, **When** they create a new user account with email, name, and role, **Then** the account is created and activation email sent with mobile-optimized confirmation
2. **Given** a manager views a user profile on mobile, **When** they change the user's role (e.g., viewer to editor), **Then** the role updates immediately, all user sessions terminate within 5 seconds, and audit log records the change
3. **Given** a manager needs to delegate permissions on mobile, **When** they create a delegation with start/end dates and reason, **Then** the delegation activates immediately with automatic expiration notification set for 7 days before end date
4. **Given** an administrator initiates access review on mobile, **When** they specify review scope (department/role/all users), **Then** a mobile-optimized report generates within 10 seconds showing roles, permissions, and inactive accounts (90+ days)
5. **Given** a user's role is changed to admin on mobile, **When** the change requires dual approval, **Then** the system prompts for two distinct administrator approvals via mobile-friendly workflow before applying admin privileges

---

### User Story 4 - Assignment Engine & SLA Management on Mobile (Priority: P1)

Mobile users need visibility into auto-assigned work items, SLA countdown timers, and capacity status to manage their workload and respond to escalations while away from desks.

**Why this priority**: SLA breaches and assignment backlogs require immediate attention regardless of location. Field staff and managers need real-time visibility into assignments, capacity, and escalations to prevent deadline violations and workload imbalances.

**Independent Test**: Can be tested by viewing assigned work items on mobile, checking SLA countdowns, receiving escalation notifications, and verifying WIP limit enforcement. Delivers value by providing complete workload visibility and alerting from mobile devices.

**Acceptance Scenarios**:

1. **Given** a user opens their assignments screen on mobile, **When** they view their workload, **Then** they see all assigned items with SLA countdown timers color-coded (green >50% time remaining, yellow 25-50%, red <25% and breached items)
2. **Given** a new work item is auto-assigned to a mobile user, **When** assignment occurs, **Then** they receive a push notification showing item type, priority, and SLA deadline with direct link to assignment detail
3. **Given** a user's assignment reaches 75% SLA elapsed on mobile, **When** the warning threshold triggers, **Then** they receive a push notification warning with remaining time and option to request help or escalate
4. **Given** a user hits their WIP limit on mobile, **When** new work attempts assignment, **Then** the item queues and user sees notification "Work queued - will auto-assign when capacity available" with queue position
5. **Given** an assignment breaches SLA (100%) while user is on mobile, **When** automatic escalation occurs, **Then** both assignee and supervisor receive push notifications with escalation details and action buttons

---

### User Story 5 - Engagement Kanban Board on Mobile (Priority: P2)

Mobile users need to view and manage engagement assignments via Kanban board interface with drag-and-drop functionality to update workflow stages (To Do, In Progress, Review, Done, Cancelled) while mobile.

**Why this priority**: Kanban board provides visual workflow management valuable for quick status updates and team coordination. While useful on mobile, most detailed Kanban management happens at desks. Mobile capability enables status updates and quick workflow changes in the field.

**Independent Test**: Can be tested by opening engagement Kanban on mobile, dragging assignments between columns with touch gestures, and verifying real-time sync across devices. Delivers value by enabling workflow updates from mobile with team visibility.

**Acceptance Scenarios**:

1. **Given** a user opens Engagement Kanban on mobile, **When** the board loads, **Then** they see workflow columns (To Do, In Progress, Review, Done, Cancelled) in horizontally scrollable layout with assignment cards
2. **Given** a user views Kanban board on mobile, **When** they long-press and drag an assignment card, **Then** the card follows their touch with haptic feedback, drop zones highlight, and card moves between columns with animation
3. **Given** a staff member (non-manager) drags assignment on mobile, **When** they attempt to skip stages (e.g., To Do → Done), **Then** the system prevents the move with mobile-friendly validation message requiring sequential flow
4. **Given** a manager drags assignment on mobile, **When** they move from any stage to any other stage, **Then** the system allows the transition, updates stage, records SLA timing, and syncs across all devices in real-time
5. **Given** a user views Kanban on mobile, **When** another user moves an assignment, **Then** the card immediately animates to new column via Supabase Realtime subscription without manual refresh

**Mobile-specific scenarios**:

6. **Given** user is viewing Kanban in Arabic (RTL) on mobile, **When** they interact with the board, **Then** columns flow right-to-left, drag gestures work correctly in RTL direction, and stage transitions respect RTL layout
7. **Given** user has Kanban open on mobile in landscape orientation, **When** they rotate to portrait, **Then** the board adapts to vertical scrolling layout with visible column headers and optimized card sizes for portrait view

---

### User Story 6 - Entity Relationships & Network Graph on Mobile (Priority: P3)

Mobile users need to view dossier relationships, network graphs, and unified timeline to understand entity connections and history while reviewing information on mobile devices.

**Why this priority**: Relationship visualization and network graphs are information-rich features best suited for larger screens. Mobile access is valuable for reference and quick lookups but not primary use case. Lower priority than operational features.

**Independent Test**: Can be tested by opening dossier details on mobile, navigating to relationships tab, viewing network graph with touch gestures (pinch-zoom, pan), and checking timeline events. Delivers value by providing relationship context on mobile for informed decision-making.

**Acceptance Scenarios**:

1. **Given** a user opens dossier details on mobile, **When** they tap the Relationships tab, **Then** they see a mobile-optimized network graph with pinch-to-zoom, pan gestures, and tap-to-expand node details
2. **Given** a user views network graph on mobile, **When** they tap a related entity node, **Then** a bottom sheet appears showing entity summary (type, title, connection strength, last activity) with "View Details" action
3. **Given** a user views unified timeline on mobile, **When** they scroll through events, **Then** they see chronological entries from all event types (dossier changes, calendar entries, documents, relationships) with swipe-to-filter by type
4. **Given** a user views network graph on small mobile screen, **When** graph has >20 nodes, **Then** the system clusters related nodes, shows cluster count badges, and expands clusters on tap with smooth animation
5. **Given** a user is offline viewing relationships on mobile, **When** they access previously synced dossier, **Then** network graph renders from local cache with "Offline - data may be stale" indicator and last sync timestamp

---

### Edge Cases

**Front Door Intake Mobile**
- What happens when a user loses connectivity mid-upload of large attachments (50MB+)?
  - Upload pauses automatically, progress preserved, auto-resumes when connectivity returns with notification. User can cancel queued upload anytime.

- What happens when camera/photo library permissions are denied but user tries to attach image?
  - System shows clear permission explanation with "Go to Settings" button (iOS) or inline permission request (Android). Alternative text-based description field appears.

**Search & Retrieval Mobile**
- What happens when user searches while offline?
  - Search operates on local cached data only, shows "Offline - searching cached data" indicator, displays last sync timestamp, and suggests sync when online.

- What happens when semantic search vector service is slow (>5s) on mobile network?
  - System shows loading spinner for 3s, then falls back to keyword search only with "Limited results - semantic search unavailable" message and retry button.

**User Management Mobile**
- What happens when dual approval workflow is initiated on mobile but approvers are offline?
  - System queues approval requests, sends push notifications when approvers come online, shows "Pending approval (1 of 2)" status with approver names and last seen timestamps.

- What happens when user's own role is changed while they're actively using mobile app?
  - Immediate session termination with friendly message "Your permissions have changed. Please log in again to continue." Preserves any draft work in secure local storage.

**Assignment Engine Mobile**
- What happens when mobile user receives 10+ assignment notifications within 5 minutes?
  - System bundles notifications: "10 new assignments - 3 urgent" with single expanded view showing list. User can tap "View all" to open assignment list screen.

- What happens when SLA breach occurs for offline mobile user?
  - Escalation proceeds server-side, push notification queues, delivers when device comes online, and shows clear "Escalated while offline" indicator with timeline.

**Kanban Board Mobile**
- What happens when touch drag gesture conflicts with scroll gesture on mobile?
  - Long-press (500ms) activates drag mode, short touches scroll normally. Visual feedback (card lift animation, haptic) confirms drag mode activation.

- What happens when Kanban has 100+ assignments and mobile loads the board?
  - Virtual scrolling within columns, loads 20 cards initially per column, "Load more" button at bottom, total count badge shows e.g., "15 of 45 shown".

**Entity Relationships Mobile**
- What happens when network graph has 50+ nodes on small mobile screen?
  - Intelligent clustering groups related nodes, max 15 visible nodes initially, cluster badges show count "8 more", tap to expand with smooth zoom animation.

- What happens when user pinch-zooms network graph beyond readable limits?
  - Min/max zoom constraints prevent over-zoom (0.5x to 3x), smooth resistance animation at limits, reset zoom button appears when zoomed.

**Storage Management Mobile**
- What happens when device storage is exhausted and sync attempts to download new data?
  - Sync pauses, user sees "Storage full" notification with storage usage breakdown. App suggests clearing old cached items or freeing device storage. Critical items (active assignments, intake drafts) remain protected from auto-cleanup.

## Mobile Requirements *(mandatory for mobile-only features)*

### Offline Behavior

- **Offline Access**: Users can view all previously synced intake tickets, search results, user profiles, assignments, Kanban boards, and relationship graphs offline. Changes queue locally and sync when online (intake submissions, role changes, Kanban moves).

- **Storage Management**:
  - Dynamic storage limit: App uses maximum 20% of available device storage for offline cache, with absolute minimum of 200MB
  - Storage monitoring: App checks available storage before each sync operation
  - User warnings: "Storage low" warning when cache reaches 80% of calculated limit, "Storage critical" when at 95%
  - Automatic cleanup: When limit reached, oldest unassigned cached items removed first (FIFO), preserving active assignments and recent intake drafts
  - Manual control: Users can view storage usage in settings and manually clear cache categories (search index, old dossiers, completed assignments)

- **Sync Requirements**:
  - Manual sync via pull-to-refresh on any screen
  - Auto-sync on app foreground if >5 minutes since last sync
  - Background sync every 15 minutes when app backgrounded and connected to WiFi
  - Incremental sync downloads only changed entities since last sync, respecting storage limits
  - Full sync option available in settings for troubleshooting (warns if insufficient storage)

- **Conflict Scenarios**:
  - Intake submissions: Server version always wins (timestamps), local draft preserved in "Failed submissions" for review
  - Role changes: Server version wins, user notified "Role changed by [admin] while offline, your change canceled"
  - Kanban moves: Last write wins with timestamp, conflicting moves show "Assignment moved by [user] - your change overridden" notification
  - Search data: No conflicts, latest index always used, offline search uses last cached index

### Native Features

- **Biometrics**: Touch ID/Face ID optional for quick re-authentication after initial login. Required for viewing confidential+ intake tickets and performing admin role assignments.

- **Camera**:
  - Document scanning with auto-crop and perspective correction for intake attachments
  - OCR text extraction from scanned documents (Arabic and English) to auto-populate form fields
  - Photo capture for field evidence attachments with GPS metadata (if permitted)

- **Push Notifications**:
  - Assignment notifications: New assignment, SLA warning (75%), SLA breach (100%), escalation received
  - Intake notifications: Ticket approved/rejected, conversion to artifact complete, duplicate detected
  - User management notifications: Role changed, delegation expiring (7 days), access review required
  - Kanban notifications: Assignment moved to Review/Done (if user has opted in)
  - Notification grouping and priority levels (Urgent, High, Normal) with customizable preferences per category

- **Local Authentication**: Device PIN/password fallback when biometrics unavailable. Session persistence across app restarts (secure token storage). Auto-logout after 15 minutes inactivity (configurable in settings).

- **Data Encryption**: Field-level encryption for sensitive data (confidential+ classified intake tickets, user authentication credentials, delegation tokens) using platform-provided secure storage (iOS Keychain, Android Keystore). General cached data (dossiers, assignments, search index) stored with platform default encryption.

- **Share Extension**: iOS/Android share sheet integration to share dossiers, intake tickets, assignments, or documents to external apps (email, messaging) with proper permission checks and audit logging.

### Mobile Performance Criteria

- **SC-M01**: Initial screen render ≤1s on 4G network (3G Fast fallback target ≤2s)
- **SC-M02**: Fresh data load ≤2s for primary content (intake queue, assignments, search results)
- **SC-M03**: Incremental sync completes ≤5s for typical dataset (50 entities changed since last sync)
- **SC-M04**: Kanban board with 50 assignments loads and renders ≤3s on mid-tier device (iPhone 12/Pixel 5 equivalent)
- **SC-M05**: Network graph with 30 nodes renders ≤2s with smooth 60fps pan/zoom gestures
- **SC-M06**: Search typeahead suggestions appear ≤200ms (absolute maximum, same as web)
- **SC-M07**: Touch interactions respond ≤100ms (visual feedback, button press, list scroll)
- **SC-M08**: App cold start to authenticated home screen ≤3s on warm device (already used recently)

### Observability & Monitoring

- **Crash Reporting**: Automatic crash detection with stack traces, device info (OS version, model), app version, and crash context (last screen, user action). No personally identifiable information (PII) collected.

- **Performance Monitoring**: Track key performance metrics without user identification:
  - Screen load times (time to interactive for each screen)
  - Network request latency and failure rates
  - Sync operation duration and success rates
  - App startup time (cold start, warm start)
  - ANR (Application Not Responding) detection on Android
  - Memory usage patterns and warnings

- **Business Metrics** (Privacy-Focused): Track feature usage and workflow completion without personal data:
  - Feature adoption rates: % users completing intake submission, using Kanban, accessing search
  - Workflow completion rates: % of started workflows completed successfully (intake → submission, search → result click)
  - Error rates by feature: % of failed operations (sync errors, upload failures, search timeouts)
  - Offline usage patterns: % time spent offline, sync success rates when returning online
  - Session metrics: Average session duration, screens per session, retention (DAU/MAU) - aggregated only, no individual tracking

- **Privacy Controls**:
  - No collection of user identifiers, email addresses, or content data
  - All metrics aggregated at cohort level (by role, feature, device type - not individual users)
  - Users can opt-out of analytics via settings (crash reporting remains mandatory for quality)
  - Data retention: 90 days for performance metrics, 1 year for crash reports (for pattern analysis)

## Requirements *(mandatory)*

### Functional Requirements

**Front Door Intake Mobile**
- **FR-001**: Mobile app MUST provide Front Door intake interface with request type selection (Engagement, Position, MoU Action, Foresight) optimized for touch with minimum 44x44px targets
- **FR-002**: Mobile app MUST support bilingual (AR/EN) intake forms with dossier linking, document attachments from device storage/camera, and offline draft persistence
- **FR-003**: Mobile app MUST display AI triage suggestions (type, sensitivity, urgency, recommended owner) within 2 seconds of intake submission with Accept/Override mobile-optimized actions
- **FR-004**: Mobile app MUST support offline intake submission with automatic queue and background sync when connectivity returns, with submission status notifications
- **FR-005**: Mobile app MUST enforce attachment limits (25MB per file, 100MB total per ticket) with upload progress indicators and pause/resume capability for large files

**Search & Retrieval Mobile**
- **FR-006**: Mobile app MUST provide global search accessible from bottom navigation with typeahead suggestions appearing ≤200ms
- **FR-007**: Mobile app MUST search across all entity types (dossiers, people, engagements, positions, MoUs, documents) with horizontally scrollable tabs for filtering
- **FR-008**: Mobile app MUST support semantic search with ≥60% similarity threshold, displaying results in separate "Related" section below exact matches
- **FR-009**: Mobile app MUST support bilingual search (AR/EN) with result snippets in both languages and proper RTL/LTR rendering
- **FR-010**: Mobile app MUST handle offline search by searching cached local data with "Offline - searching cached data" indicator and last sync timestamp
- **FR-011**: Mobile app MUST support Boolean operators (AND, OR, NOT) and quoted phrases for exact matching with mobile-friendly query builder UI
- **FR-012**: Mobile app MUST display "No results" state with typo-corrected suggestions and search tips optimized for mobile screen size

**User Management & Access Control Mobile**
- **FR-013**: Mobile app MUST allow HR administrators to create user accounts, assign roles, and send activation emails from mobile with mobile-optimized forms
- **FR-014**: Mobile app MUST support role assignment with immediate effect, triggering session termination within 5 seconds and mobile-friendly re-authentication prompt
- **FR-015**: Mobile app MUST require dual approval workflow for admin role assignments via mobile-optimized approval flow with push notification to approvers
- **FR-016**: Mobile app MUST allow permission delegation with start/end dates and reason capture, with 7-day expiration notifications via push
- **FR-017**: Mobile app MUST support access review initiation on mobile, generating reports within 10 seconds showing roles, permissions, and inactive accounts (90+ days)
- **FR-018**: Mobile app MUST display audit logs for user management actions with mobile-optimized timeline view and filtering by action type/user/date range

**Assignment Engine & SLA Mobile**
- **FR-019**: Mobile app MUST display all assigned work items with SLA countdown timers color-coded by urgency (green >50%, yellow 25-50%, red <25%, breached)
- **FR-020**: Mobile app MUST send push notifications for assignment events: new assignment, SLA warning (75%), SLA breach (100%), escalation received
- **FR-021**: Mobile app MUST display WIP status and capacity with visual indicators showing current load vs limit (e.g., "4 of 5 assignments" with progress bar)
- **FR-022**: Mobile app MUST show queued items when WIP limit reached with queue position and estimated assignment time based on average completion rate
- **FR-023**: Mobile app MUST support offline viewing of assignments and SLA status with local countdown timers and sync-on-online capability

**Engagement Kanban Mobile**
- **FR-024**: Mobile app MUST display Engagement Kanban board with horizontally scrollable workflow columns (To Do, In Progress, Review, Done, Cancelled) optimized for touch
- **FR-025**: Mobile app MUST support touch-based drag-and-drop for assignment cards with long-press activation (500ms), haptic feedback, and drop zone highlighting
- **FR-026**: Mobile app MUST enforce role-based stage transition rules: staff members sequential only (To Do → In Progress → Review → Done), managers can skip stages
- **FR-027**: Mobile app MUST track dual SLA timers (overall assignment SLA and per-stage SLA) displayed on Kanban cards with visual indicators
- **FR-028**: Mobile app MUST provide real-time Kanban updates via Supabase Realtime subscriptions, showing assignment moves by other users with smooth card animations
- **FR-029**: Mobile app MUST support portrait and landscape Kanban layouts with adaptive column sizing and virtual scrolling for 50+ assignments per column
- **FR-030**: Mobile app MUST work correctly in RTL mode (Arabic) with right-to-left column flow and proper drag gesture direction handling

**Entity Relationships & Network Graph Mobile**
- **FR-031**: Mobile app MUST display dossier relationships as mobile-optimized network graph with touch gestures: pinch-to-zoom (0.5x-3x), pan, tap-to-expand nodes
- **FR-032**: Mobile app MUST show node details in bottom sheet on tap with entity summary (type, title, connection strength, last activity) and "View Details" action
- **FR-033**: Mobile app MUST cluster related nodes when graph exceeds 20 nodes on mobile, showing cluster count badges and tap-to-expand with smooth zoom animation
- **FR-034**: Mobile app MUST display unified timeline with chronological events from all types (dossier changes, calendar entries, documents, relationships) with swipe-to-filter by type
- **FR-035**: Mobile app MUST render network graphs from local cache when offline with "Offline - data may be stale" indicator and last sync timestamp

**General Mobile Requirements**
- **FR-036**: Mobile app MUST support biometric authentication (Touch ID/Face ID) for quick re-authentication and confidential data access
- **FR-037**: Mobile app MUST integrate device camera for document scanning with auto-crop, perspective correction, and OCR text extraction (AR/EN)
- **FR-038**: Mobile app MUST provide notification grouping for multiple similar notifications (e.g., "10 new assignments - 3 urgent") with expandable detailed view
- **FR-039**: Mobile app MUST implement share extension (iOS/Android) for sharing dossiers, tickets, assignments to external apps with permission checks and audit logging
- **FR-040**: Mobile app MUST preserve draft work in secure local storage when session terminates, with "Resume draft" option on next login
- **FR-041**: Mobile app MUST support pull-to-refresh on all list screens, auto-sync on foreground (if >5min since last sync), and background WiFi sync (every 15min)
- **FR-042**: Mobile app MUST handle large datasets with virtual scrolling/pagination: Kanban columns (20 cards initially, load more), search results (20 per page), timeline (50 events initially)
- **FR-043**: Mobile app MUST apply field-level encryption to sensitive data (confidential+ classified intake tickets, user credentials, delegation tokens) using platform-provided secure storage (iOS Keychain for iOS, Android Keystore for Android), while general cached data relies on platform default encryption
- **FR-044**: Mobile app MUST implement dynamic storage management: use maximum 20% of available device storage for offline cache (minimum 200MB absolute), monitor storage before sync operations, warn users at 80% limit ("Storage low"), alert at 95% ("Storage critical"), and automatically remove oldest unassigned cached items (FIFO) when limit reached while preserving active assignments and recent drafts

**Observability & Monitoring**
- **FR-045**: Mobile app MUST implement automatic crash reporting with stack traces, device info (OS version, model), app version, and crash context (last screen, user action) without collecting personally identifiable information (PII)
- **FR-046**: Mobile app MUST track performance metrics without user identification: screen load times, network request latency/failure rates, sync duration/success rates, app startup time, ANR detection (Android), and memory usage patterns
- **FR-047**: Mobile app MUST collect privacy-focused business metrics: feature adoption rates (% users completing workflows), workflow completion rates, error rates by feature, offline usage patterns, and aggregated session metrics (DAU/MAU, avg session duration) - all aggregated at cohort level with no individual user tracking
- **FR-048**: Mobile app MUST provide analytics opt-out option in settings (crash reporting remains mandatory), collect no user identifiers or content data, aggregate all metrics at cohort level (by role, feature, device type), and enforce data retention (90 days performance metrics, 1 year crash reports)

### Key Entities

- **Mobile Intake Ticket**: Represents intake request submitted from mobile with offline queue status, attachment sync state, AI triage results, and submission timestamp

- **Mobile Search Index**: Local cached search index covering all entity types with last sync timestamp, offline availability indicator, and incremental update capability

- **Mobile Assignment**: Work item assigned to mobile user with SLA countdown timer, escalation state, notification preferences, and offline status tracking

- **Mobile Kanban Card**: Visual representation of assignment in Kanban board with drag state, animation queue, real-time sync status, and stage transition validation

- **Mobile Network Node**: Entity node in relationship graph with position coordinates, cluster membership, expansion state, and touch gesture handlers

- **Mobile Sync Queue**: Local queue of pending changes (intake submissions, Kanban moves, role changes) awaiting connectivity with retry count and conflict resolution state

- **Mobile Push Notification**: Notification entity with category (assignment/intake/user/Kanban), priority level (urgent/high/normal), grouping key, and delivery status

- **Mobile Draft**: Locally stored draft work (incomplete intake form, unsaved search filter, pending role change) with auto-save timestamp and recovery mechanism

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Mobile Parity with Web**
- **SC-001**: 100% of web application features implemented on mobile (Front Door intake, advanced search, user management, assignment engine, Kanban board, entity relationships) with mobile-optimized UX
- **SC-002**: Mobile app achieves feature parity score ≥95% based on functionality checklist comparing web vs mobile capabilities across all modules
- **SC-003**: Users can complete primary workflows (submit intake, search entities, assign roles, update Kanban, view relationships) on mobile in ≤20% more time than web equivalent (accounting for mobile input constraints)

**Mobile Performance**
- **SC-004**: Mobile app initial screen render ≤1s on 4G network (measured on iPhone 12/Pixel 5 baseline devices)
- **SC-005**: Search typeahead suggestions appear ≤200ms on mobile (absolute maximum, matching web performance)
- **SC-006**: Kanban board with 50 assignments renders ≤3s with smooth 60fps drag animations on mid-tier devices
- **SC-007**: Network graph with 30 nodes renders ≤2s with responsive touch gestures (pinch, pan, tap) maintaining 60fps
- **SC-008**: Incremental sync completes ≤5s for typical dataset (50 entities changed since last sync)
- **SC-009**: App cold start to authenticated home screen ≤3s on warm device (recently used app)

**Offline Capability**
- **SC-010**: Mobile app maintains full read functionality for 7+ days offline (previously synced data: intake tickets, search results, assignments, Kanban, relationships)
- **SC-011**: 95% of offline-queued changes (intake submissions, Kanban moves) sync successfully within 30 seconds when connectivity returns
- **SC-012**: Conflict resolution success rate ≥98% for concurrent changes (role updates, Kanban moves) with server version taking precedence and clear user notification

**Mobile UX & Usability**
- **SC-013**: 90% of users successfully complete their first intake submission on mobile within 5 minutes (measured from form open to submission confirmation)
- **SC-014**: Touch target compliance 100% - all interactive elements meet minimum 44x44px with ≥8px spacing (WCAG mobile guidelines)
- **SC-015**: RTL (Arabic) layout functions correctly with 100% feature parity to LTR (English) including Kanban drag gestures and network graph interactions
- **SC-016**: Mobile app supports portrait and landscape orientations with adaptive layouts on all screens (intake forms, search, Kanban, network graph)
- **SC-017**: Biometric authentication adoption rate ≥80% among mobile users who complete initial login setup

**Mobile Reliability & Scale**
- **SC-018**: Mobile app crash-free rate ≥99.5% across all supported devices (iOS 13+, Android 8.0+)
- **SC-019**: Push notification delivery rate ≥95% for critical notifications (SLA breach, escalation, role change) within 30 seconds of event
- **SC-020**: Mobile app handles 1000+ local entities (cached dossiers, assignments, tickets) without performance degradation (<10% slowdown vs 100 entities)
- **SC-021**: Background sync battery impact ≤5% per 24 hours on moderate usage (4 hours active screen time, WiFi sync every 15min)

**User Adoption & Satisfaction**
- **SC-022**: 70% of field staff use mobile app as primary interface for intake submissions within 30 days of mobile deployment
- **SC-023**: Mobile app Net Promoter Score (NPS) ≥40 within 60 days of launch (measured via in-app survey)
- **SC-024**: Mobile app reduces time-to-submission for intake requests by 60% compared to desktop-only workflow (measured from request identification to ticket creation)
- **SC-025**: 85% of mobile users successfully complete at least 3 different workflow types (intake, search, Kanban update, user management) within first week of use

## Assumptions *(optional)*

- All backend APIs and Supabase Edge Functions required for web features (intake, search, user management, assignments, Kanban, relationships) are already implemented and mobile-compatible
- Existing Supabase database schema supports all required mobile operations without additional migrations (mobile-specific fields may be added as needed)
- Backend provides efficient incremental sync APIs with delta queries (last_modified_since parameter) to minimize mobile data transfer
- Push notification infrastructure (Firebase Cloud Messaging, Apple Push Notification Service) is configured and operational for the project
- Mobile devices have minimum storage capacity of 1GB free space to enable baseline offline caching (app dynamically uses max 20% of available storage with 200MB absolute minimum for cache)
- Users' mobile devices run iOS 13+ or Android 8.0+ with biometric capability (Touch ID/Face ID/fingerprint) available on majority of devices
- Backend APIs have proper rate limiting and mobile-specific optimizations to handle mobile network conditions (higher latency, intermittent connectivity)
- Existing web application i18n translation files include all necessary strings for mobile-specific UI elements (or mobile-specific keys will be added)
- OCR and document scanning capabilities can be implemented using device-native APIs or third-party SDKs (Expo Document Scanner, ML Kit)
- Mobile app deployment through Apple App Store and Google Play Store has been approved with organizational developer accounts configured
- Users have organizational email addresses that match Supabase authentication credentials and are whitelisted for mobile access
- Backend supports WebSocket connections (Supabase Realtime) compatible with mobile network constraints (connection pooling, automatic reconnection)

## Dependencies *(optional)*

- **Backend API Compatibility**: All Supabase Edge Functions for intake, search, user management, assignments, Kanban, and relationships must be mobile-accessible with CORS properly configured
- **Incremental Sync Protocol**: Backend must support delta sync queries with last_modified_since filtering for efficient mobile synchronization
- **Push Notification Services**: Firebase Cloud Messaging (Android) and Apple Push Notification Service (iOS) infrastructure must be configured with Supabase Edge Functions triggering notifications
- **Biometric Authentication**: Expo local-authentication library compatibility with Supabase Auth for secure token storage and session management
- **Document Scanning**: expo-document-scanner or equivalent library for camera-based document capture with auto-crop and OCR capabilities
- **Offline Database**: WatermelonDB schema must support all entity types (intake tickets, search index, assignments, Kanban cards, network nodes) with proper relationships
- **Real-time Sync**: Supabase Realtime channels for Kanban board updates, assignment changes, and intake queue refresh must support mobile client subscriptions
- **Network Graph Rendering**: React Native compatible graph visualization library (e.g., react-native-svg with d3-force layout or react-native-graph-view) for relationship diagrams
- **Mobile UI Components**: React Native Paper 5.12+ for Material Design 3 components and React Navigation 7+ for navigation stack compatible with all workflow screens
- **i18n Support**: i18next mobile configuration with RTL layout detection and proper font rendering for Arabic text across all screens
- **Permission System**: Mobile app must inherit backend Row Level Security (RLS) policies for data access control and support permission-based UI element visibility
- **Share Extension**: iOS/Android share sheet integration APIs for sharing dossiers, tickets, and assignments with audit logging to backend
- **Background Processing**: Expo background fetch API for WiFi-based auto-sync and task queue management when app is backgrounded
- **Crash Reporting & Analytics**: Privacy-focused crash reporting service (e.g., Sentry, Firebase Crashlytics) configured for mobile with PII redaction, performance monitoring SDK for screen load times and network metrics, and analytics platform for aggregated business metrics (cohort-level only, no individual tracking)

## Out of Scope *(optional)*

- **Advanced AI Features on Device**: On-device ML models for triage classification or semantic search are out of scope. Mobile app relies on backend AI services with offline fallback to cached results.

- **Multimedia Editing**: Advanced document editing (PDF annotation, image editing beyond crop) is out of scope. Mobile app supports viewing and basic capture only.

- **Offline-First Content Creation**: Creating new dossiers, engagements, or complex entities while offline is out of scope. Only intake submissions and status updates (Kanban moves, role changes) queue for offline sync.

- **Multi-Account Support**: Switching between multiple organizational accounts within the mobile app is out of scope. One account per device install.

- **Advanced Analytics Dashboard**: Business intelligence dashboards with complex charts and reports are out of scope for mobile. Basic metrics (assignment count, SLA status) are supported.

- **Bulk Operations**: Bulk role assignments, mass ticket conversion, or batch entity operations are out of scope on mobile. Single-item operations only.

- **Custom Workflow Builder**: Creating or modifying Kanban workflows, SLA rules, or triage policies from mobile is out of scope. Mobile app uses configurations defined via web.

- **Video/Audio Recording**: Capturing video or audio attachments for intake tickets is out of scope. Photo/document capture only.

- **Augmented Reality (AR)**: AR features for document scanning or entity visualization are out of scope for initial mobile release.

- **Advanced Security Features**: Hardware security module (HSM) integration, certificate pinning beyond standard HTTPS, or full database encryption (encrypting all WatermelonDB data at rest) is out of scope. Security approach uses field-level encryption for sensitive data with platform-provided secure storage.

- **Offline Map Integration**: Geographic visualization of dossier locations or field staff positions is out of scope. Text-based location data only.

- **Collaborative Editing**: Real-time co-editing of intake forms, assignments, or dossiers on mobile is out of scope. Last-write-wins conflict resolution only.

- **Custom Notification Sounds**: User-configurable notification sounds or ringtones beyond system defaults are out of scope.

- **Accessibility Beyond WCAG AA**: Advanced accessibility features beyond WCAG 2.2 AA compliance (e.g., screen reader optimization for complex graphs, voice control) are deferred to future releases.

- **Tablet-Specific UI**: Dedicated iPad/Android tablet layouts beyond responsive scaling are out of scope. Phone-optimized UI scales to tablet sizes.
