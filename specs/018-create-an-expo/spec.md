# Feature Specification: Mobile Application for GASTAT International Dossier System

**Feature Branch**: `018-create-an-expo`
**Created**: 2025-10-10
**Status**: Draft
**Input**: User description: "Create an Expo-based mobile application for the GASTAT International Dossier system. The mobile app should provide field staff and analysts with offline-capable access to view dossiers, briefs, and intake requests while on the go. Key features: 1) Secure authentication using Supabase Auth with biometric login support 2) Offline-first data sync with WatermelonDB for viewing dossiers when disconnected 3) Bottom tab navigation with Dossiers, Briefs, and Profile screens 4) Ability to view dossier details including countries, organizations, positions, and documents 5) Read-only access to briefs and their details 6) Push notifications for new assignments and updates 7) Real-time sync when online using Supabase Realtime 8) Support for both Arabic RTL and English LTR layouts 9) Responsive design for phones and tablets. The app should connect to the existing Supabase backend (zkrcjzdemdmwhearhfgg.supabase.co) and share the same database schema as the web application."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Login and Biometric Authentication (Priority: P1)

Field staff and analysts need to securely access the mobile application using their organization credentials, with the convenience of biometric authentication (fingerprint/Face ID) for subsequent logins after initial setup.

**Why this priority**: Authentication is the gateway to all features. Without secure login, users cannot access any functionality. Biometric support is critical for field staff who need quick, secure access in various environments.

**Independent Test**: Can be fully tested by attempting login with valid credentials, setting up biometric authentication, and using biometrics for subsequent logins. Delivers value by providing secure, convenient access to the system.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** they open the app, **Then** they see a login screen with email and password fields
2. **Given** a user enters valid credentials, **When** they tap "Sign In", **Then** they are authenticated and taken to the main app interface
3. **Given** a user has successfully logged in for the first time, **When** the app detects biometric capability on the device, **Then** the user is prompted to enable biometric authentication
4. **Given** a user has enabled biometric authentication, **When** they return to the app after being logged out, **Then** they can authenticate using their fingerprint or Face ID instead of typing credentials
5. **Given** a user enters invalid credentials, **When** they attempt to sign in, **Then** they see a clear error message indicating authentication failure

---

### User Story 2 - View and Browse Dossiers Offline (Priority: P1)

Field staff need to view dossier information including countries, organizations, positions, and associated documents even when they have no internet connectivity, as they often work in locations with poor network coverage.

**Why this priority**: Offline access is a core requirement for field staff who cannot rely on stable internet connections. This is the primary value proposition of the mobile app over the web version.

**Independent Test**: Can be fully tested by syncing dossiers while online, then disconnecting from the internet and verifying all dossier details remain accessible. Delivers value by enabling field work in any location.

**Acceptance Scenarios**:

1. **Given** a user has previously synced dossiers while online, **When** they open the app without internet connection, **Then** they can view the list of synced dossiers
2. **Given** a user selects a dossier from the list while offline, **When** they tap to view details, **Then** they see complete dossier information including related countries, organizations, positions, and documents
3. **Given** a user is viewing a dossier offline, **When** they navigate between different sections (overview, countries, organizations, documents), **Then** all cached data displays instantly without loading delays
4. **Given** a user attempts to access a dossier that was not previously synced, **When** they are offline, **Then** they see a clear message indicating the dossier is not available offline with instructions to sync when online
5. **Given** a user has been offline for an extended period, **When** they reconnect to the internet, **Then** the app automatically syncs new and updated dossiers in the background without disrupting their current activity

---

### User Story 3 - Receive and View Assignment Notifications (Priority: P2)

Users need to receive push notifications when they are assigned new dossiers, briefs, or intake requests, allowing them to respond promptly to urgent assignments even when not actively using the app.

**Why this priority**: Timely awareness of new assignments is critical for operational efficiency, but users can still perform their core work (viewing dossiers) without notifications. This makes it a P2 feature.

**Independent Test**: Can be fully tested by simulating assignment events on the backend and verifying notifications are received on the device, both when the app is active and when it's in the background. Delivers value by improving response time to assignments.

**Acceptance Scenarios**:

1. **Given** a user has granted notification permissions, **When** they are assigned a new dossier, **Then** they receive a push notification with the dossier title and assignment details
2. **Given** a user receives a notification about a new assignment, **When** they tap the notification, **Then** the app opens directly to the assigned item's detail screen
3. **Given** a user is actively using the app, **When** they receive a new assignment, **Then** they see an in-app notification banner that can be tapped to view the assignment
4. **Given** a user has not granted notification permissions, **When** new assignments are created, **Then** they can still see assignment updates when they manually open and refresh the app
5. **Given** a user has multiple unread notifications, **When** they open the notifications panel, **Then** they see a list of all recent assignments with timestamps

---

### User Story 4 - View and Read Policy Briefs (Priority: P2)

Analysts and field staff need read-only access to policy briefs related to their work, allowing them to stay informed about policy context and recommendations while conducting field activities.

**Why this priority**: Briefs provide important context but are supporting information rather than primary work data. Users can complete their core tasks (viewing dossiers) without immediate access to briefs.

**Independent Test**: Can be fully tested by syncing briefs while online, then viewing brief content and navigating between sections. Delivers value by providing policy context for field decisions.

**Acceptance Scenarios**:

1. **Given** a user navigates to the Briefs tab, **When** the briefs list loads, **Then** they see all briefs they have access to with titles, dates, and status indicators
2. **Given** a user selects a brief from the list, **When** they tap to view details, **Then** they see the complete brief content including title, summary, recommendations, and related dossiers
3. **Given** a user is viewing a brief, **When** they scroll through the content, **Then** the content is properly formatted and readable on both phone and tablet screen sizes
4. **Given** a brief references related dossiers, **When** a user taps on a dossier link within the brief, **Then** they are navigated to that dossier's detail screen
5. **Given** a user has synced briefs while online, **When** they go offline and view briefs, **Then** all synced brief content remains accessible

---

### User Story 5 - Monitor and Review Intake Requests (Priority: P3)

Intake officers need to view pending intake requests on mobile devices to stay aware of incoming requests and their current status while away from their desks.

**Why this priority**: Intake request monitoring is valuable but less critical than core dossier viewing and assignment notifications. Most intake processing happens at desks on the web application.

**Independent Test**: Can be fully tested by viewing intake requests, filtering by status, and checking request details. Delivers value by providing situational awareness of incoming work.

**Acceptance Scenarios**:

1. **Given** a user has intake officer permissions, **When** they navigate to the intake requests section, **Then** they see a list of all intake requests with status indicators (pending, approved, rejected)
2. **Given** a user views an intake request, **When** they tap to see details, **Then** they see complete request information including requester, country/organization, priority, and submission date
3. **Given** a user is viewing intake requests, **When** they apply filters (by status, priority, or date range), **Then** the list updates to show only matching requests
4. **Given** a user wants to reference an intake request later, **When** they sync the app, **Then** recent intake requests are cached for offline viewing
5. **Given** a user has limited permissions, **When** they access intake requests, **Then** they only see requests relevant to their assigned countries or regions

---

### User Story 6 - Switch Between Arabic and English Interfaces (Priority: P2)

Users need to switch between Arabic (RTL) and English (LTR) language interfaces based on their preference, with proper text directionality and culturally appropriate layouts.

**Why this priority**: Bilingual support is essential for GASTAT's multicultural workforce, but users can complete tasks in either language. This makes it P2 rather than P1.

**Independent Test**: Can be fully tested by switching language settings and verifying all screens render correctly with proper text direction and layout. Delivers value by making the app accessible to Arabic and English speakers.

**Acceptance Scenarios**:

1. **Given** a user opens the app for the first time, **When** the language selection appears, **Then** they can choose between Arabic and English
2. **Given** a user has selected Arabic as their language, **When** they navigate through the app, **Then** all text displays in Arabic with right-to-left layout
3. **Given** a user wants to change their language, **When** they go to Profile settings and select a different language, **Then** the entire app interface immediately switches to the new language and text direction
4. **Given** a user is viewing dossier content in English, **When** they switch to Arabic, **Then** the same content displays in Arabic with proper RTL formatting
5. **Given** mixed-language content exists (e.g., names in English within Arabic text), **When** displayed, **Then** the layout handles bidirectional text correctly without formatting issues

---

### User Story 7 - Automatic Background Sync When Online (Priority: P2)

Users need their locally cached data to automatically sync with the server when they regain internet connectivity, ensuring they always have access to the latest information without manual intervention.

**Why this priority**: Automatic sync greatly improves user experience and data freshness, but users can still manually trigger sync. This makes it a P2 convenience feature.

**Independent Test**: Can be fully tested by going offline, reconnecting, and verifying new data appears automatically. Delivers value by eliminating manual sync steps and ensuring data currency.

**Acceptance Scenarios**:

1. **Given** a user reconnects to the internet after being offline, **When** the connection is re-established, **Then** the app automatically syncs new and updated dossiers in the background
2. **Given** data sync is in progress, **When** the user navigates through the app, **Then** they see a subtle sync indicator without blocking their workflow
3. **Given** new assignments were created while the user was offline, **When** the sync completes, **Then** the user sees the new assignments reflected in their list
4. **Given** a conflict exists between local and server data, **When** sync occurs, **Then** the server version takes precedence and the user is notified of the update
5. **Given** the user has a poor internet connection, **When** sync is attempted, **Then** the app uses incremental sync to download only changed data rather than everything

---

### Edge Cases

- **What happens when** biometric authentication fails three times consecutively?
  - System immediately falls back to password authentication and locks biometric access for 15 minutes. User can still authenticate with password during lockout. After 15 minutes, biometric authentication is automatically re-enabled. Lockout duration is not user-configurable.

- **What happens when** the device runs out of storage space during offline sync?
  - App displays a clear error message indicating storage is full and prompts user to free space or reduce sync scope

- **What happens when** a user tries to view a document attachment while offline and it wasn't previously cached?
  - App shows a placeholder indicating the document requires internet connection, with option to queue for download when online

- **What happens when** push notifications are disabled but the app is granted other permissions?
  - App continues to function normally, with in-app indicators for new assignments, and periodically reminds user they can enable notifications

- **What happens when** the user switches language while offline?
  - Interface language changes immediately using cached translations, but content language remains as originally downloaded

- **What happens when** the backend schema changes (new fields, renamed tables)?
  - App version checking ensures compatibility using semantic versioning. The mobile app checks the backend API version endpoint (/api/version) on each sync. If backend major version differs from app's expected version (stored in app.json), sync is blocked and user sees: "App update required. Please update from the app store to continue syncing." User can still view previously cached offline data until they update.

- **What happens when** a user's access permissions change while they have offline data cached?
  - Upon next online sync, app removes inaccessible data and updates local cache to match current permissions

- **What happens when** multiple devices sync simultaneously for the same user?
  - Each device syncs independently; conflicts are resolved server-side using "last write wins" with timestamps

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users using their existing organizational email and password credentials
- **FR-002**: System MUST support biometric authentication (fingerprint, Face ID) as an optional secondary authentication method after initial credential setup
- **FR-003**: System MUST allow users to view a list of dossiers they have access to, including dossier titles, countries, and current status
- **FR-004**: System MUST display complete dossier details including associated countries, organizations, positions held, and attached documents
- **FR-005**: System MUST cache dossier data locally for offline viewing without requiring internet connectivity
- **FR-006**: System MUST sync local data with the server when internet connection is available
- **FR-007**: System MUST detect network connectivity status and automatically initiate sync when transitioning from offline to online
- **FR-008**: System MUST provide read-only access to policy briefs, including brief title, content, recommendations, and related dossiers
- **FR-009**: System MUST allow intake officers to view intake requests with status indicators (pending, approved, rejected)
- **FR-010**: System MUST send push notifications to users when they are assigned new dossiers, briefs, or intake requests
- **FR-011**: System MUST open the relevant item detail screen when a user taps a push notification
- **FR-012**: System MUST support switching between Arabic (RTL) and English (LTR) language interfaces
- **FR-013**: System MUST properly render text directionality (RTL for Arabic, LTR for English) across all screens
- **FR-014**: System MUST provide bottom tab navigation with tabs for Dossiers, Briefs, and Profile
- **FR-015**: System MUST scale content layout appropriately for both phone and tablet screen sizes
- **FR-016**: System MUST respect user permission levels, showing only data the authenticated user is authorized to access
- **FR-017**: System MUST display clear error messages when operations fail (authentication failure, sync error, network timeout)
- **FR-018**: System MUST allow users to manually trigger data sync from the Profile or settings screen
- **FR-019**: System MUST indicate sync status (syncing, last synced time, sync failed) in the user interface
- **FR-020**: System MUST maintain user session across app restarts until explicit logout
- **FR-021**: System MUST securely store authentication tokens using platform-specific secure storage mechanisms
- **FR-022**: System MUST clear all locally cached data when a user logs out
- **FR-023**: Users MUST be able to navigate back to previous screens using standard platform navigation patterns
- **FR-024**: System MUST display loading indicators when fetching data from the server
- **FR-025**: System MUST handle session expiration by prompting users to re-authenticate
- **FR-026**: System MUST show the app version number in the Profile screen for troubleshooting purposes
- **FR-027**: System MUST allow users to adjust notification preferences by assignment type (dossier, brief, intake request), enabling users to choose which types of assignments trigger notifications
- **FR-028**: System MUST cache user profile information for offline viewing
- **FR-029**: System MUST display internet connectivity status in the user interface when offline
- **FR-030**: System MUST limit offline storage to the most recent 20 dossiers plus all dossiers currently assigned to the user, with automatic cleanup of older unassigned cached dossiers

### Key Entities *(include if feature involves data)*

- **User**: Represents authenticated staff members with specific roles (analyst, field staff, intake officer). Attributes include name, email, role, assigned countries/regions, language preference, notification preferences, and biometric authentication status.

- **Dossier**: Represents a collection of information about international activities. Attributes include title, description, status, creation date, assigned analyst, priority level, and associated countries, organizations, and positions.

- **Country**: Represents a nation involved in international activities tracked by dossiers. Attributes include country name (Arabic and English), ISO code, region, and associated dossiers.

- **Organization**: Represents an entity involved in international activities. Attributes include organization name (Arabic and English), organization type, country of origin, and associated dossiers.

- **Position**: Represents a stance or viewpoint held by a country or organization. Attributes include position title, description, supporting documents, and relationships to countries, organizations, and dossiers.

- **Brief**: Represents a policy document summarizing analysis and recommendations. Attributes include title, summary, full content, recommendations, related dossiers, author, creation date, and status.

- **Intake Request**: Represents a request to create a new dossier. Attributes include requester information, country/organization involved, priority level, submission date, status (pending, approved, rejected), and justification.

- **Document**: Represents file attachments associated with dossiers, positions, or briefs. Attributes include filename, file type, file size, upload date, and cached status for offline access.

- **Assignment**: Represents the association between a user and a work item (dossier, brief, intake request). Attributes include assigned user, work item reference, assignment date, priority, and notification status.

- **Notification**: Represents a push notification event. Attributes include recipient user, message content, notification type (assignment, update, reminder), creation timestamp, read status, and related item reference.

- **Sync Status**: Represents the synchronization state between local cache and server. Attributes include last sync timestamp, sync in progress flag, sync error details, and list of pending changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can authenticate and access the main app interface within 10 seconds of app launch
- **SC-002**: Users can view complete dossier details (including all associated countries, organizations, positions, and documents) within 3 seconds when accessing previously synced data offline (measured on mid-tier device equivalent to iPhone 12/Pixel 5 with warm cache)
- **SC-003**: 95% of push notifications are delivered to users within 30 seconds of assignment creation
- **SC-004**: Users can successfully switch between Arabic and English interfaces with proper text directionality rendered on all screens
- **SC-005**: The app maintains functionality for at least 7 days of offline usage before requiring re-sync or re-authentication
- **SC-006**: Biometric authentication succeeds in under 2 seconds for users who have enabled this feature
- **SC-007**: Full data sync (downloading all accessible dossiers, briefs, and recent intake requests) completes within 5 minutes on a standard 4G connection for users with access to 100 dossiers (assuming average dossier complexity: 5 countries, 3 organizations, 2 positions, and no document attachments)
- **SC-008**: The app successfully handles transitions between online and offline states without crashing or data loss in 99.9% of cases
- **SC-009**: 90% of users successfully complete their first dossier view within 2 minutes of initial app launch and login
- **SC-010**: The app adapts its layout appropriately for screen sizes ranging from 4.7-inch phones to 12.9-inch tablets with readable text and accessible interactive elements
- **SC-011**: Users can navigate to any major section (Dossiers, Briefs, Profile) within 2 taps from any screen in the app
- **SC-012**: 85% of users enable biometric authentication when prompted after initial login
- **SC-013**: Offline sync cache requires less than 500MB of device storage for typical users with access to 50 dossiers
- **SC-014**: Users experience app response times under 1 second for all navigation and interaction operations (excluding initial data fetching)
- **SC-015**: The app maintains 99.5% crash-free rate across all supported device types and operating system versions

## Assumptions *(optional)*

- All users have existing accounts in the Supabase authentication system; no new user registration is required
- The existing Supabase backend database schema is stable and supports all required queries for mobile data access
- Users' devices have sufficient storage capacity (minimum 1GB free space) to support offline data caching
- Users' devices run iOS 13+ or Android 8.0+ to ensure compatibility with required platform features (biometric authentication, secure storage, push notifications)
- The backend provides RESTful APIs or GraphQL endpoints that are accessible and optimized for mobile network conditions
- Push notification infrastructure is already configured and operational on the backend (Firebase Cloud Messaging or Apple Push Notification service)
- Users have organizational email addresses that match their Supabase authentication credentials
- The app will be distributed through official app stores (Apple App Store, Google Play Store) requiring standard approval processes
- Backend supports efficient incremental sync protocols to minimize data transfer on mobile networks
- All content (dossiers, briefs, documents) uses UTF-8 encoding to properly support both Arabic and English text
- Users have permission to access only a subset of all dossiers based on their role and assigned countries/regions
- The existing database includes Arabic translations for all user-facing content fields
- Biometric authentication availability depends on device hardware capabilities (not all devices will support Face ID or fingerprint)

## Dependencies *(optional)*

- **Backend Database Schema**: Mobile app must align with existing Supabase database schema for dossiers, briefs, intake requests, countries, organizations, positions, and documents
- **Supabase Authentication Service**: App relies on existing Supabase Auth infrastructure for user authentication and session management
- **Push Notification Service**: Backend must have push notification infrastructure configured (FCM for Android, APNs for iOS) to send assignment notifications
- **Backend APIs**: Mobile app requires REST or GraphQL APIs exposed by the backend for data fetching, sync operations, and real-time updates
- **Content Availability**: All user-facing content must have both Arabic and English versions in the database for proper bilingual support
- **Permission System**: Backend permission/authorization system must be accessible via API to filter data based on user roles and assignments
- **Document Storage**: Backend must provide secure URLs for document downloads that work with mobile clients
- **Network Connectivity**: Offline features depend on users having periodic internet access to initially sync data
- **Device Capabilities**: Biometric authentication requires devices with fingerprint sensors or Face ID hardware

## Out of Scope *(optional)*

- **Creating or Editing Dossiers**: The mobile app is read-only; users cannot create new dossiers, modify dossier content, or edit positions. All content creation and editing must be done through the web application.

- **Intake Request Processing**: While intake officers can view intake requests, they cannot approve, reject, or process requests from the mobile app. Processing actions remain web-only.

- **Document Upload**: Users cannot upload new documents or attachments from the mobile app. Document viewing is supported, but uploading must be done via the web interface.

- **Advanced Search**: Complex search functionality (filtering by multiple criteria, full-text search, saved searches) is not included in the initial mobile release. Users can browse lists but cannot perform detailed searches.

- **Collaboration Features**: Real-time co-editing, commenting on dossiers, or messaging other users is out of scope. The app focuses on individual viewing and consumption of information.

- **Admin Functions**: User management, permission assignment, system configuration, and other administrative tasks are not available in the mobile app.

- **Reporting and Analytics**: Generating reports, exporting data, or viewing analytics dashboards is not supported on mobile. These features remain web-exclusive.

- **Offline Editing with Sync**: Users cannot make changes offline and have them automatically sync when online. The app is read-only to avoid sync conflicts.

- **Video or Audio Playback**: If documents include video or audio files, viewing/playing these media types may not be supported in the initial release depending on format and size constraints.

- **Custom Notifications**: Users cannot set up custom notification rules or advanced notification workflows beyond basic assignment notifications.

- **Multi-Account Support**: The app supports one logged-in user at a time. Users cannot switch between multiple GASTAT accounts without logging out and back in.

- **Offline Data Encryption**: While authentication tokens are securely stored, the cached offline data itself is not additionally encrypted beyond standard device-level encryption.

- **Historical Data Access**: The app focuses on current and recent data. Access to archived or historical dossiers beyond a certain age may be limited to reduce storage requirements.
