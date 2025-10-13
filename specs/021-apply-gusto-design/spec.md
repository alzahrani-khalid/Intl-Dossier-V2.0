# Feature Specification: Apply Gusto Design System to Mobile App

**Feature Branch**: `021-apply-gusto-design`
**Created**: 2025-10-13
**Status**: Draft
**Platform Scope**: mobile-only
**Input**: User description: "Apply Gusto design system @mobile/GUSTO_DESIGN_ANALYSIS.md and it is reference screenshots in folder 'Gusto Mobile ios Jun 2025' to the mobile expo development design. Implement core mobile routes based on prioritized user workflows (P1-P3 user stories)."

**Scope Note**: This feature implements 20 core mobile routes covering primary user workflows. Additional routes (Events, Engagements, Data Library, Reports, Admin Portal, User Management) are deferred to future phases - see "Out of Scope" section.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Navigation Experience (Priority: P1)

As a mobile user, I need to navigate between all major sections of the application using a consistent bottom tab navigation pattern, so I can quickly access any feature without getting lost in complex menu hierarchies.

**Why this priority**: Bottom tab navigation is the foundation of the mobile experience. Without it, users cannot access any features. This is the MVP that must work before any other functionality.

**Independent Test**: Can be fully tested by opening the app and tapping each bottom tab icon to verify all 5 primary screens load correctly. Delivers immediate value by providing access to the entire application structure.

**Acceptance Scenarios**:

1. **Given** user opens the app for the first time, **When** they view the bottom navigation bar, **Then** they see 5 tabs: Home, Dossiers, Search, Calendar, and Profile with clear icons and labels in both English and Arabic
2. **Given** user is on any screen, **When** they tap a bottom tab, **Then** the corresponding screen loads within 1 second with smooth transition animation
3. **Given** user is on the Home tab, **When** they tap the Home tab again, **Then** the screen scrolls to top smoothly
4. **Given** user has unread notifications, **When** viewing the Profile tab icon, **Then** a red badge shows the count of unread items
5. **Given** user switches between tabs, **When** returning to a previously visited tab, **Then** the screen state is preserved (scroll position, form data)

---

### User Story 2 - Home Dashboard Quick Access (Priority: P1)

As a user, I need to see key statistics and recent activity immediately upon opening the app, so I can quickly understand my current workload and pending actions without navigating through multiple screens.

**Why this priority**: The home screen is the first thing users see and must provide immediate value. This is essential for user engagement and app adoption.

**Independent Test**: Can be tested by logging in and verifying that the home screen displays personalized statistics, recent activity cards, and quick action buttons. Delivers value by showing users their most important information at a glance.

**Acceptance Scenarios**:

1. **Given** user logs in successfully, **When** home screen loads, **Then** they see a personalized greeting with their name and time of day (e.g., "Good morning, Ahmed")
2. **Given** user has active dossiers, **When** viewing home screen, **Then** they see a hero card showing total active dossiers count with visual emphasis
3. **Given** user has recent activity, **When** scrolling home screen, **Then** they see the last 10 activities in card format showing type, title, timestamp, and related entity
4. **Given** user needs quick actions, **When** viewing home screen, **Then** they see action cards for "Create Dossier", "View Assignments", and "Open Calendar"
5. **Given** user pulls down on home screen, **When** release gesture is detected, **Then** data refreshes with visual spinner and success indicator

---

### User Story 3 - Dossier List and Detail Views (Priority: P1)

As a user, I need to browse all dossiers in a list view with search and filter capabilities, and view detailed information about any dossier by tapping on it, so I can find and access dossier information efficiently.

**Why this priority**: Dossiers are the core entity of the application. Users must be able to view and access them to perform their primary job functions. This is part of the critical MVP.

**Independent Test**: Can be tested by navigating to the Dossiers tab, searching for specific dossiers, applying filters, and tapping to view details. Delivers value by providing access to all dossier data.

**Acceptance Scenarios**:

1. **Given** user taps Dossiers tab, **When** the screen loads, **Then** they see a list of dossiers in card format showing title, country, organization, and status badge
2. **Given** user has more than 10 dossiers, **When** they scroll to the bottom, **Then** the next page of dossiers loads automatically (infinite scroll)
3. **Given** user needs to find specific dossiers, **When** they tap the search icon, **Then** a search bar appears with keyboard automatically focused
4. **Given** user types in search field, **When** they enter at least 2 characters, **Then** results filter instantly (debounced 300ms)
5. **Given** user taps on a dossier card, **When** the detail screen opens, **Then** they see comprehensive dossier information in card sections: header, countries, organizations, relationships, timeline
6. **Given** user is viewing dossier details, **When** they swipe right or tap back button, **Then** they return to dossier list with preserved scroll position

---

### User Story 4 - Search Functionality (Priority: P2)

As a user, I need a global search feature accessible from the Search tab that allows me to find dossiers, countries, organizations, forums, and positions across the entire application, so I can quickly locate any entity without knowing which section to navigate to.

**Why this priority**: While not essential for MVP, search significantly improves user efficiency. It's prioritized after basic navigation and viewing because users can still manually browse to find information.

**Independent Test**: Can be tested by tapping the Search tab, entering various queries, and verifying that results are categorized by entity type with accurate matches. Delivers value by reducing time spent navigating through multiple screens.

**Acceptance Scenarios**:

1. **Given** user taps Search tab, **When** screen loads, **Then** they see a prominent search bar, recent searches (last 5), and suggested searches
2. **Given** user enters search query, **When** they type at least 2 characters, **Then** results appear grouped by entity type (Dossiers, Countries, Organizations, Forums, Positions)
3. **Given** search returns multiple entity types, **When** user views results, **Then** each group shows up to 3 results with "See all" link to view more
4. **Given** user taps on a search result, **When** navigation occurs, **Then** they go to the detail screen for that entity
5. **Given** user performs a search, **When** they leave and return to Search tab, **Then** their last search query is preserved

---

### User Story 5 - Calendar and Events (Priority: P2)

As a user, I need to view all calendar entries (engagements, MOUs, milestones, deadlines) in a calendar view, so I can understand upcoming commitments and plan my work accordingly.

**Why this priority**: Calendar functionality is important for planning but not critical for viewing existing data. Users can still perform their core functions without calendar view.

**Independent Test**: Can be tested by tapping Calendar tab and verifying that all event types display correctly in month, week, and day views with accurate dates and details. Delivers value by helping users manage time-sensitive activities.

**Acceptance Scenarios**:

1. **Given** user taps Calendar tab, **When** screen loads, **Then** they see current month view with today's date highlighted
2. **Given** calendar has events, **When** user views a date, **Then** color-coded dots indicate event types (engagement, MOU, milestone, deadline)
3. **Given** user taps on a date with events, **When** bottom sheet opens, **Then** they see list of all events for that day with time, title, and type
4. **Given** user needs to create an event, **When** they tap "+" button, **Then** a form modal opens with event type selector, title, date, time, and notes fields
5. **Given** user views calendar in month view, **When** they swipe left/right, **Then** previous/next month loads with smooth animation
6. **Given** user switches to week or day view, **When** they select view mode, **Then** calendar adapts layout to show hourly breakdown

---

### User Story 6 - User Profile and Settings (Priority: P2)

As a user, I need access to my profile information, account settings, and app preferences from the Profile tab, so I can manage my account and customize the app experience.

**Why this priority**: While users need eventual access to settings, core functionality works without profile customization. This is prioritized after primary data access features.

**Independent Test**: Can be tested by tapping Profile tab and verifying that user information, settings options, and logout functionality work correctly. Delivers value by allowing users to personalize their experience.

**Acceptance Scenarios**:

1. **Given** user taps Profile tab, **When** screen loads, **Then** they see profile header with avatar, name, role, and organization
2. **Given** user views profile screen, **When** they scroll, **Then** they see sections for Account Settings, Notifications, Language Preferences, Accessibility, and About
3. **Given** user taps Language Preferences, **When** modal opens, **Then** they can switch between English and Arabic with immediate UI update
4. **Given** user enables biometric authentication, **When** they toggle the setting, **Then** system prompts for fingerprint/face ID enrollment
5. **Given** user taps Logout, **When** confirmation dialog appears, **Then** they can confirm or cancel, and confirming logs them out and returns to login screen

---

### User Story 7 - Assignments and Task Management (Priority: P2)

As a user, I need to view my assigned tasks, update assignment status, and manage my work queue from the mobile app, so I can complete my work on-the-go without needing desktop access.

**Why this priority**: Task management is important for productivity but not essential for viewing information. Users can still access assignments through the web if mobile isn't available.

**Independent Test**: Can be tested by navigating to assignments through the bottom navigation or home screen quick actions, viewing task lists, and updating task status. Delivers value by enabling mobile productivity.

**Acceptance Scenarios**:

1. **Given** user has assigned tasks, **When** they navigate to Assignments section, **Then** they see list of tasks grouped by status (Pending, In Progress, Completed)
2. **Given** user taps on an assignment, **When** detail screen opens, **Then** they see task description, due date, related dossier, and action buttons
3. **Given** user needs to update status, **When** they tap status dropdown, **Then** they can select new status from bottom sheet picker
4. **Given** user completes an assignment, **When** they tap "Mark Complete", **Then** confirmation dialog appears with success message and task moves to Completed section
5. **Given** user has escalated tasks, **When** viewing assignments, **Then** escalated items show with red indicator and appear at top of list

---

### User Story 8 - Intake Management (Priority: P3)

As an intake officer, I need to view intake tickets, review details, and process requests from the mobile app, so I can respond to incoming requests quickly without waiting for desktop access.

**Why this priority**: Intake management is a specialized workflow for specific users. Most users don't need this feature, making it lower priority than universal features.

**Independent Test**: Can be tested by users with intake officer role navigating to Intake Queue, viewing pending tickets, and processing them through approval/rejection. Delivers value by enabling faster response times for intake requests.

**Acceptance Scenarios**:

1. **Given** user has intake officer role, **When** they navigate to Intake section, **Then** they see tabs for Queue, My Tickets, and New Request
2. **Given** intake queue has pending tickets, **When** user views queue, **Then** tickets display in card format showing request type, requester, submission date, and priority
3. **Given** user taps on a ticket, **When** detail screen opens, **Then** they see full request details, attachments, and action buttons (Approve, Reject, Request More Info)
4. **Given** user approves a ticket, **When** they tap Approve and provide notes, **Then** ticket status updates and requester receives notification
5. **Given** user creates new intake request, **When** they fill out form and submit, **Then** request is created and routed to appropriate queue

---

### User Story 9 - Countries, Organizations, and Forums (Priority: P3)

As a user, I need to browse and view details for countries, organizations, and forums entities, so I can access reference information about key entities related to dossiers.

**Why this priority**: These are supporting entities that enhance dossier context. Users can function with dossier information alone, making these entities nice-to-have rather than essential.

**Independent Test**: Can be tested by navigating to each entity list (Countries, Organizations, Forums), viewing list items, and tapping to see detail screens. Delivers value by providing comprehensive entity information.

**Acceptance Scenarios**:

1. **Given** user navigates to Countries section, **When** list loads, **Then** they see countries in card format with flag icon, name, and number of related dossiers
2. **Given** user taps on a country, **When** detail screen opens, **Then** they see country information, list of related dossiers, and recent activity
3. **Given** user navigates to Organizations section, **When** list loads, **Then** they see organizations with logo, name, type, and relationship count
4. **Given** user navigates to Forums section, **When** list loads, **Then** they see forums with name, type, status, and participant count
5. **Given** user views any entity detail, **When** they tap on related dossiers, **Then** they navigate to filtered dossier list showing only related items

---

### User Story 10 - Positions and MOUs (Priority: P3)

As a policy analyst, I need to view positions and MOUs on mobile to reference policy stances and agreements while attending meetings or events outside the office.

**Why this priority**: Positions and MOUs are specialized content primarily used by policy analysts. Most users don't need these features regularly, making them lower priority.

**Independent Test**: Can be tested by navigating to Positions or MOUs sections, viewing lists, and accessing detail screens with version history. Delivers value for policy analysts who need mobile access to policy information.

**Acceptance Scenarios**:

1. **Given** user navigates to Positions section, **When** list loads, **Then** they see positions in card format showing title, related dossier, status, and last modified date
2. **Given** user taps on a position, **When** detail screen opens, **Then** they see position content, version history link, and approval status
3. **Given** user views position versions, **When** they tap version history, **Then** they see list of all versions with date, author, and change summary
4. **Given** user navigates to MOUs section, **When** list loads, **Then** they see MOUs with title, signing parties, effective date, and status
5. **Given** user views MOU details, **When** detail screen opens, **Then** they see parties involved, terms summary, related documents, and status timeline

---

### User Story 11 - Intelligence and Monitoring (Priority: P3)

As an intelligence analyst, I need to view intelligence signals and monitoring dashboards on mobile to stay informed about emerging issues while away from my desk.

**Why this priority**: Intelligence and monitoring are specialized features for specific user roles. The mobile experience is supplementary to the primary desktop workflow.

**Independent Test**: Can be tested by users with analyst role accessing Intelligence and Monitoring sections, viewing signal lists, and checking dashboard metrics. Delivers value by enabling awareness of critical signals on-the-go.

**Acceptance Scenarios**:

1. **Given** user has analyst role, **When** they navigate to Intelligence section, **Then** they see intelligence signals grouped by priority (Critical, High, Medium, Low)
2. **Given** user views signals list, **When** critical signals exist, **Then** they appear at top with red indicator
3. **Given** user taps on a signal, **When** detail screen opens, **Then** they see signal description, source, related entities, and analyst notes
4. **Given** user navigates to Monitoring section, **When** dashboard loads, **Then** they see key metrics cards: total dossiers, active signals, pending approvals, and recent alerts
5. **Given** monitoring detects critical issue, **When** push notification fires, **Then** user can tap notification to jump directly to relevant detail screen

---

### User Story 12 - Offline Support (Priority: P2)

As a mobile user, I need to access recently viewed dossiers, assignments, and calendar entries when offline, so I can continue working during travel or in areas with poor connectivity.

**Why this priority**: Offline support significantly improves mobile usability but isn't essential for MVP. Users can access the web version when connectivity is available.

**Independent Test**: Can be tested by loading key screens while online, disconnecting from network, and verifying cached data is accessible. Delivers value by ensuring productivity isn't blocked by connectivity issues.

**Acceptance Scenarios**:

1. **Given** user views dossiers while online, **When** they go offline, **Then** last 50 viewed dossiers remain accessible with offline indicator shown
2. **Given** user is offline with cached data, **When** they tap on cached dossier, **Then** detail screen loads from local storage with "Offline Mode" banner displayed
3. **Given** user makes changes while offline, **When** connectivity returns, **Then** offline changes sync automatically with conflict detection
4. **Given** sync detects conflicting changes, **When** conflict modal appears, **Then** user can choose to keep local changes, accept remote changes, or merge manually
5. **Given** user attempts to access uncached data offline, **When** screen loads, **Then** they see friendly empty state explaining offline limitation with "Retry when online" button

---

### Edge Cases

- What happens when user loses connectivity mid-navigation? System should gracefully handle network errors with retry logic and show cached data when available
- How does system handle push notification when app is closed? Notification should appear in system tray and open relevant screen when tapped
- What happens if user has 1000+ dossiers? List pagination and virtualization ensure performance remains smooth (<1s scroll response)
- How does system handle Arabic RTL layout for complex components like calendar? All components use logical properties (start/end) and RTL-aware date formatting
- What happens when biometric authentication fails 3 times? System falls back to password authentication with security lockout after 5 failed attempts
- How does system handle simultaneous edits on web and mobile? Last-write-wins with conflict detection; user prompted to resolve conflicts before changes persist
- What happens when user changes language mid-session? All UI text updates immediately without requiring app restart; cached data retains current language until refresh
- How does system handle large file uploads on slow mobile networks? Upload progress indicator with pause/resume capability; warns user about large files on cellular data

## Mobile Requirements *(mandatory for mobile-only or cross-platform features)*

### Offline Behavior

- **Offline Access**: Users can view and interact with the last 50 viewed dossiers, last 20 assignments, and current month's calendar entries when offline. All cached data shows "Last synced" timestamp. Users can view but not edit data offline to prevent sync conflicts.
- **Sync Requirements**: Manual sync triggered by pull-to-refresh gesture on any primary screen (Home, Dossiers, Calendar). Auto-sync occurs on app foreground if more than 5 minutes since last sync. Incremental sync for efficiency (only changed records).
- **Conflict Scenarios**: If same dossier edited on web and mobile while offline, user prompted on next sync with 3 options: "Keep mobile changes", "Use web version", or "View changes side-by-side". If user is assigned a task on web while offline on mobile, no conflict occurs (assignments are additive).

### Native Features

- **Biometrics**: Touch ID/Face ID/Fingerprint required for app unlock on devices that support it. Biometric authentication required before viewing any classified dossier marked as "Confidential" or higher. Fallback to password if biometrics fail or unavailable.
- **Camera**: Document scanning with auto-crop and perspective correction for uploading attachments to dossiers and intake tickets. Photo capture for profile avatar. *(Note: OCR text extraction from scanned documents (Arabic and English) is planned for future enhancement - current MVP focuses on image capture and upload only)*
- **Push Notifications**: User receives notifications for: new assignment (immediate), upcoming deadline (24h before), intake request requiring action (immediate), delegation expiring soon (24h before), new comment on followed dossier (batched hourly). Users can customize notification preferences per category in Profile settings.

### Mobile Performance Criteria

- **SC-M01**: Initial home screen render ≤1s on 4G network (measured from app launch to interactive hero card)
- **SC-M02**: Fresh dossier list data load ≤2s for 100 items on 4G network
- **SC-M03**: Incremental sync completes ≤3s for typical daily changes (50 modified records)
- **SC-M04**: Bottom tab navigation transition completes ≤300ms (smooth 60fps animation)
- **SC-M05**: Search results appear ≤500ms after user stops typing (300ms debounce + 200ms query execution)
- **SC-M06**: Calendar month view loads ≤1s with all event indicators visible

## Requirements *(mandatory)*

### Functional Requirements

#### Design System Implementation

- **FR-001**: System MUST implement React Native Paper 5.12+ Material Design 3 theming with custom Intl-Dossier color palette: primary (#1B5B5A dark teal), primaryContainer (#E0F2F1 light teal), secondary (#FF6B35 accent orange), background (#F5F4F2 warm off-white), surface (#FFFFFF white cards)
- **FR-002**: System MUST use card-based layouts with 12-16px border radius, subtle elevation (2-4dp shadow), 16-24px internal padding, and 12-16px spacing between cards on white background
- **FR-003**: System MUST implement Material Design 3 typography scale: displayLarge (32sp/700 weight) for screen titles, titleLarge (22sp/600) for card titles, titleMedium (18sp/500) for section headers, bodyLarge (16sp/400) for main content, bodyMedium (15sp/400) for secondary text, bodySmall (13sp/400) for captions, labelLarge (16sp/600) for buttons *(Note: "sp" refers to scaled pixels in React Native, equivalent to "pt" in design specs, supporting accessibility scaling)*
- **FR-004**: System MUST use pill-shaped status chips in outlined style (1px border, no fill) with teal border color showing dossier and task states (Active, Pending, Archived, Completed, Rejected)
- **FR-005**: System MUST implement empty states with large centered icon (80px), headline text explaining state, optional description text, and primary CTA button with generous vertical spacing (24px between elements)
- **FR-006**: System MUST display all list items in consistent card format: 48x48px icon/avatar on start, two-line layout (title + subtitle), trailing content (text/icon), chevron for navigation, ripple effect on touch, dividers between items

#### Navigation Architecture

- **FR-007**: System MUST implement bottom tab navigation with 5 persistent tabs: Home (home icon), Dossiers (folder-multiple icon), Search (magnify icon), Calendar (calendar icon), Profile (account icon) with icons and labels in both English and Arabic
- **FR-008**: System MUST show active tab with teal color (#1B5B5A) and filled icon; inactive tabs with gray color and outline icons
- **FR-009**: System MUST support badge indicators on bottom tab icons showing unread notification counts (red circular badge with white text)
- **FR-010**: System MUST preserve screen state (scroll position, form inputs) when user switches between tabs and returns to previously visited tab
- **FR-011**: System MUST implement stack navigation within each tab with back button (< chevron) in header for sub-screens, screen title left-aligned (large, bold), and action icons on right side (notifications, profile)
- **FR-012**: System MUST support modal navigation using bottom sheets with rounded top corners (16-20px), pull handle indicator, close button (×) in header, scrollable content, and semi-transparent black backdrop

#### Screen Routes (Full Web Parity)

- **FR-013**: System MUST implement Home tab routing to dashboard screen showing personalized greeting, hero stats card, recent activity feed (last 10 items), and quick action cards
- **FR-014**: System MUST implement Dossiers tab routing with: list view (index), detail view ($id), and filtering/search capabilities
- **FR-015**: System MUST implement Search tab routing with global search across all entity types (dossiers, countries, organizations, forums, positions) with grouped results
- **FR-016**: System MUST implement Calendar tab routing with month/week/day views, event detail bottom sheets, and new event creation modal
- **FR-017**: System MUST implement Profile tab routing with sections: account info, settings, notifications preferences, language toggle (EN/AR), accessibility options, about, and logout
- **FR-018**: System MUST route to Assignments section from Home quick action or menu showing queue, escalations, and assignment detail ($id) screens
- **FR-019**: System MUST route to Intake section (for intake officer role) showing queue, my tickets, new request form, and ticket detail screens
- **FR-020**: System MUST route to Countries section showing list and country detail screens with related dossiers
- **FR-021**: System MUST route to Organizations section showing list and organization detail screens
- **FR-022**: System MUST route to Forums section showing list and forum detail screens
- **FR-023**: System MUST route to Positions section showing list, detail ($id), versions, and approval screens
- **FR-024**: System MUST route to MOUs section showing list and MOU detail screens
- **FR-025**: System MUST route to Events section showing events list and event detail screens
- **FR-026**: System MUST route to Engagements section showing list, detail ($engagementId), and after-action review screens
- **FR-027**: System MUST route to Intelligence section (for analyst role) showing signals list and signal detail screens
- **FR-028**: System MUST route to Monitoring section (for analyst role) showing dashboard with key metrics and alert cards
- **FR-029**: System MUST route to Data Library section showing document repository and document detail screens
- **FR-030**: System MUST route to Reports section showing report list and generated report views
- **FR-031**: System MUST route to Settings section showing app preferences, notification settings, and account management
- **FR-032**: System MUST route to Admin section (for admin role) showing approval queue and user management screens
- **FR-033**: System MUST route to User Management section (for admin role) showing users list, user detail, and access review screens

#### Component Patterns

- **FR-034**: System MUST implement form inputs with full-width layout, outlined mode, light gray background, 12px border radius, clear labels above input, helper text below in gray, and inline validation with error color
- **FR-035**: System MUST implement dropdown/select inputs using bottom sheet picker with search capability for long lists (>10 items)
- **FR-036**: System MUST implement primary CTAs as full-width buttons with contained mode, teal background, white text, 52px height, 12px border radius, and positioned at bottom with elevation shadow
- **FR-037**: System MUST implement secondary CTAs as text or outlined buttons in teal color positioned below primary CTA
- **FR-038**: System MUST implement pull-to-refresh on all list screens with visual spinner and brief success indicator (checkmark animation)
- **FR-039**: System MUST implement infinite scroll pagination for lists >20 items with loading indicator at bottom and smooth append animation
- **FR-040**: System MUST implement skeleton loading screens showing placeholder cards with shimmer effect while content loads
- **FR-041**: System MUST implement Snackbar notifications at bottom of screen for success/error feedback: success with primary color (3s auto-dismiss), error with error color and optional retry action (manual dismiss)

#### RTL and Internationalization

- **FR-042**: System MUST support Arabic RTL layout using logical properties exclusively: ms-* (margin-start), me-* (margin-end), ps-* (padding-start), pe-* (padding-end), start-* (position-start), end-* (position-end), text-start, text-end
- **FR-043**: System MUST detect current language using i18next and set dir="rtl" on root container when language is Arabic
- **FR-044**: System MUST flip directional icons (chevrons, arrows) 180 degrees when in RTL mode
- **FR-045**: System MUST translate all UI text using i18next with translation keys organized by feature domain (common, dossiers, auth, errors, calendar, etc.)
- **FR-046**: System MUST format dates according to locale (English: "Jan 15, 2025" vs Arabic: "١٥ يناير ٢٠٢٥")
- **FR-047**: System MUST format numbers according to locale (English: "1,234.56" vs Arabic: "١٬٢٣٤٫٥٦")

#### Accessibility

- **FR-048**: System MUST implement minimum touch targets of 44x44px (min-h-11 min-w-11) for all interactive elements
- **FR-049**: System MUST support iOS Dynamic Type allowing text scaling up to 200% with appropriate reflow
- **FR-050**: System MUST provide accessibility labels for all interactive elements (buttons, links, form inputs)
- **FR-051**: System MUST provide accessibility hints describing what happens when user taps interactive elements
- **FR-052**: System MUST ensure color contrast meets WCAG AA standards (4.5:1 minimum) for all text on background
- **FR-053**: System MUST support VoiceOver (iOS) and TalkBack (Android) screen readers with proper focus management and semantic roles

#### Performance and Optimization

- **FR-054**: System MUST virtualize long lists using FlashList for efficient rendering (only visible items rendered)
- **FR-055**: System MUST memoize expensive components to prevent unnecessary re-renders (React.memo with custom comparison)
- **FR-056**: System MUST debounce search input by 300ms before triggering API queries
- **FR-057**: System MUST lazy-load images with placeholder and smooth fade-in animation when loaded
- **FR-058**: System MUST compress uploaded images to <2MB before sending to server
- **FR-059**: System MUST cache API responses in WatermelonDB for offline access with 90-day TTL-based invalidation (records older than 90 days purged automatically on app foreground)

#### Authentication and Security

- **FR-060**: System MUST integrate with Supabase Auth for authentication using email/password login
- **FR-061**: System MUST support biometric authentication (Touch ID/Face ID/Fingerprint) as optional unlock method after initial password authentication
- **FR-062**: System MUST require biometric or password re-authentication before viewing confidential dossiers
- **FR-063**: System MUST automatically log out user after 30 minutes of inactivity
- **FR-064**: System MUST securely store auth tokens using Expo SecureStore (encrypted storage)
- **FR-065**: System MUST clear all cached sensitive data on logout

#### Notifications

- **FR-066**: System MUST request push notification permission on first app launch with clear explanation of notification types
- **FR-067**: System MUST register device token with Expo Push Notifications service on permission grant
- **FR-068**: System MUST display badge count on app icon showing unread notifications (iOS/Android native support)
- **FR-069**: System MUST support notification categories: Assignments (immediate), Deadlines (24h before), Intake Requests (immediate), Delegation Expiring (24h before), Dossier Comments (hourly batch)
- **FR-070**: System MUST allow users to customize notification preferences per category in Profile > Notifications settings
- **FR-071**: System MUST handle notification tap by deep-linking to relevant detail screen (assignment, dossier, intake ticket, etc.)

#### Offline and Sync

- **FR-072**: System MUST cache last 50 viewed dossiers in WatermelonDB local database for offline access
- **FR-073**: System MUST cache last 20 assignments and current month's calendar entries for offline viewing
- **FR-074**: System MUST display "Offline Mode" banner at top of screen when no network connectivity detected
- **FR-075**: System MUST show "Last synced: [timestamp]" indicator on screens with cached data
- **FR-076**: System MUST prevent data editing while offline to avoid sync conflicts (view-only mode)
- **FR-077**: System MUST implement incremental sync fetching only records modified since last sync timestamp
- **FR-078**: System MUST detect sync conflicts when same record modified on web and mobile and prompt user to resolve with 3 options displayed in bottom sheet modal:
  1. "Keep mobile changes" - Apply local modifications, discard server version
  2. "Use web version" - Discard local modifications, accept server version
  3. "View side-by-side" - Show field-level diff table with columns: Field Name, Mobile Value (left, blue highlight), Web Value (right, green highlight), radio button per field to select version, preview panel showing merged result, "Apply Selection" button
- **FR-079**: System MUST auto-sync on app foreground if >5 minutes elapsed since last sync
- **FR-080**: System MUST allow manual sync via pull-to-refresh gesture on Home, Dossiers, and Calendar screens

### Key Entities

**Data Model**: 11 primary entities + 4 junction tables for many-to-many relationships (see plan.md and data-model.md for full WatermelonDB schema)

- **User Profile**: Represents authenticated user with name, role, organization, avatar, notification preferences, language preference (en/ar), biometric enabled flag, last sync timestamp
- **Dossier**: Core entity with title, description, status (active/archived/pending), related countries, related organizations, relationships to other dossiers, timeline events, confidentiality level
- **Assignment**: Task assigned to user with title, description, status (pending/in-progress/completed/rejected), due date, priority (normal/high/critical), related dossier, escalation flag
- **Calendar Entry**: Event with title, type (engagement/mou/milestone/deadline), date, time, notes, related entities (dossier/organization/forum), attendees
- **Country**: Reference entity with name (en/ar), flag icon, ISO code, list of related dossiers, recent activity
- **Organization**: Entity with name (en/ar), logo, type, status, relationship count, list of related dossiers
- **Forum**: Entity with name, type, status, participant count, related dossiers
- **Position**: Policy position document with title, content, status (draft/approved/published), version history, related dossier, approval chain
- **MOU**: Memorandum of Understanding with title, signing parties, effective date, expiry date, terms summary, status, related documents
- **Intelligence Signal**: Alert with description, source, priority (critical/high/medium/low), related entities, analyst notes, timestamp
- **Intake Ticket**: Request with type, requester info, submission date, priority, status (pending/approved/rejected), notes, attachments
- **Notification**: Push notification record with title, body, category, timestamp, read status, related entity reference for deep linking

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between all major sections (Home, Dossiers, Search, Calendar, Profile) within 1 second of tapping bottom tab icon
- **SC-002**: Users can find a specific dossier using search within 10 seconds (type query + select result)
- **SC-003**: Users can view dossier details within 2 seconds of tapping dossier card on 4G network
- **SC-004**: Users can complete assignment status update within 15 seconds (navigate to assignment + select new status + confirm)
- **SC-005**: Users can create new calendar event within 2 minutes (open form + fill required fields + submit)
- **SC-006**: System loads home screen with personalized content within 1 second on app launch (4G network)
- **SC-007**: System supports 100+ dossiers in list with smooth scrolling (60fps, no frame drops)
- **SC-008**: System completes incremental sync of daily changes (50 modified records) within 3 seconds
- **SC-009**: System maintains offline access to last 50 viewed dossiers without requiring connectivity
- **SC-010**: 90% of users successfully complete primary task (view dossier, update assignment, check calendar) on first attempt without assistance, measured via moderated usability testing with 10 participants (5 Arabic-speaking, 5 English-speaking) completing predefined task scenarios, with success defined as completing task within 2x optimal time without requesting help or making critical errors
- **SC-011**: System supports Arabic RTL layout with all UI elements properly mirrored and text aligned correctly
- **SC-012**: All interactive elements meet 44x44px minimum touch target size for comfortable mobile interaction
- **SC-013**: System meets WCAG AA color contrast standards (4.5:1) for all text on background
- **SC-014**: Users receive push notifications for critical events (new assignments, approaching deadlines) within 10 seconds of server event
- **SC-015**: System handles network interruption gracefully with cached data and clear offline indicators
- **SC-016**: Biometric authentication (Touch ID/Face ID) completes within 2 seconds on supported devices
- **SC-017**: Users can customize notification preferences and language settings with changes taking effect immediately
- **SC-018**: System supports all web application routes on mobile with equivalent functionality
- **SC-019**: Design system components match Gusto design patterns: card-based layouts, teal color scheme, Material Design 3 typography
- **SC-020**: User satisfaction score >80% for mobile app usability and design consistency, measured via System Usability Scale (SUS) survey administered to n≥30 representative users (covering all user roles: general users, analysts, intake officers, admins) after 2 weeks of regular app usage, with scores normalized to 0-100 scale where 80+ indicates "excellent" usability

## Assumptions

1. **Device Support**: Application targets iOS 14+ and Android 10+ with minimum screen size of 375px width (iPhone SE)
2. **Network Conditions**: Primary users have 4G or better connectivity; 3G performance is acceptable but not optimized
3. **Authentication**: Users authenticate once via Supabase email/password; biometric authentication is optional enhancement for unlock
4. **Offline Duration**: Typical offline periods last <8 hours (during travel); extended offline work (>24h) is edge case
5. **Data Volume**: Average user manages 20-50 active dossiers, receives 5-10 assignments per week, and has 10-20 calendar entries per month
6. **Push Notifications**: Users grant notification permissions; critical notifications (assignments, deadlines) have >90% delivery rate
7. **Language Preference**: Users set language preference once; switching language mid-session is rare but supported
8. **Role Distribution**: 60% general users, 20% analysts, 15% intake officers, 5% administrators
9. **Sync Frequency**: Users sync data 3-5 times per day (morning, midday, evening); manual sync via pull-to-refresh is primary method
10. **Concurrent Usage**: Users may have web and mobile apps open simultaneously; mobile is supplementary to web for on-the-go access
11. **Document Uploads**: Mobile document uploads are primarily small files (<5MB); large document management happens on web
12. **Screen Navigation**: Users primarily use bottom tab navigation; deep linking from notifications provides direct access to specific screens
13. **Typography and Spacing**: All spacing values follow 4px base unit (8px, 12px, 16px, 24px, 32px) for consistency across components
14. **Animation Performance**: Target 60fps for all animations and transitions on mid-range devices (iPhone 11, Samsung Galaxy S10 equivalent)
15. **Search Scope**: Global search queries all entities but returns max 50 results per category to ensure <500ms response time

## Dependencies

- **External Systems**: Supabase (Auth, PostgreSQL, Realtime, Storage), Expo Push Notifications service, WatermelonDB local storage
- **Design Assets**: Gusto Mobile design analysis document (GUSTO_DESIGN_ANALYSIS.md), Material Design Icons, custom brand colors
- **Backend APIs**: All Edge Functions from web application must have mobile-compatible endpoints with pagination support
- **Web Application**: Mobile app requires web application routes documentation for route parity mapping
- **Testing Infrastructure**: Expo device simulators (iOS/Android), real device testing (iPhone, Samsung), Maestro for E2E tests

## Out of Scope

- **Events route (FR-025)** - Standalone events list/detail (distinct from calendar entries) - future phase
- **Engagements route (FR-026)** - Engagement management with after-action reviews - future phase
- **Data Library route (FR-029)** - Document repository management - future phase (basic document viewing covered in dossier details)
- **Reports route (FR-030)** - Report generation and viewing - future phase
- **Admin Portal route (FR-032)** - Full admin approval queue interface - future phase (basic admin functions in web only)
- **User Management route (FR-033)** - Comprehensive user administration - future phase (basic profile management covered in Profile tab)
- **OCR text extraction** from camera-captured documents - future enhancement (manual text entry available as workaround)
- Tablet-specific layouts (iPad, Android tablets) - future enhancement
- Dark mode theme - future enhancement (Gusto analysis mentions dark mode but not in MVP)
- Landscape orientation optimization - portrait mode only for MVP
- Advanced document editing (only viewing and basic metadata updates on mobile)
- Complex data visualizations (network graphs, advanced charts) - web-only features
- Bulk operations (multi-select, batch updates) - simplified for mobile
- Admin panel full functionality (basic user management only; advanced admin features remain web-only)
- Video/audio recording for documents (camera captures still images only)
- Multi-window support (iPad Split View, Android multi-window) - future enhancement
- Apple Watch / Wear OS companion apps - future consideration
- Deep integration with device calendar/contacts (Calendar entries are app-internal only)

## Open Questions

None - all critical design and scope questions have been resolved through the Gusto design system analysis and web route inventory.
