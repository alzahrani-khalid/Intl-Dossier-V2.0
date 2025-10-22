# Kibo UI Component Inventory
**International Dossier Management System v2.0**

This document catalogs all existing UI components in the project organized by category.

---

## ✅ Existing shadcn/ui Primitives (in `src/components/ui/`)

These are production-ready components from shadcn/ui. **Use these as building blocks:**

### Layout Components
- [x] `accordion.tsx` - Collapsible content sections
- [x] `card.tsx` - Container with elevation (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- [x] `separator.tsx` - Horizontal/vertical divider
- [x] `skeleton.tsx` - Loading placeholder animations
- [x] `scroll-area.tsx` - Custom scrollbar styling
- [x] `sheet.tsx` - Slide-out panel (mobile-friendly drawer)
- [x] `sidebar.tsx` - App navigation sidebar

### Form Components
- [x] `button.tsx` - All button variants (primary, secondary, destructive, outline, ghost, link)
- [x] `checkbox.tsx` - Boolean checkbox input
- [x] `form.tsx` - Form wrapper with react-hook-form integration
- [x] `input.tsx` - Text input with validation states
- [x] `label.tsx` - Form field labels
- [x] `radio-group.tsx` - Single selection radio buttons
- [x] `select.tsx` - Dropdown selection
- [x] `switch.tsx` - Toggle switch
- [x] `textarea.tsx` - Multi-line text input

### Feedback Components
- [x] `alert.tsx` - Informational messages (info, warning, error, success)
- [x] `alert-dialog.tsx` - Confirmation dialogs
- [x] `badge.tsx` - Status indicators and labels
- [x] `progress.tsx` - Loading/progress indicator
- [x] `skeleton.tsx` - Loading placeholders

### Overlay Components
- [x] `dialog.tsx` - Modal dialogs
- [x] `alert-dialog.tsx` - Destructive action confirmations
- [x] `dropdown-menu.tsx` - Contextual action menus
- [x] `popover.tsx` - Floating content panels
- [x] `sheet.tsx` - Slide-out panels
- [x] `tooltip.tsx` - Contextual hints on hover

### Navigation Components
- [x] `navigation-menu.tsx` - Header navigation
- [x] `sidebar.tsx` - App sidebar navigation
- [x] `tabs.tsx` - Content switching tabs

### Data Display Components
- [x] `avatar.tsx` - User images with fallback
- [x] `calendar.tsx` - Date picker (using react-day-picker)
- [x] `table.tsx` - Tabular data display
- [x] `kanban.tsx` - Kanban board component

---

## ⭐ Existing Responsive Components (in `src/components/responsive/`)

**These are critical for mobile-first design - USE THESE:**

### Responsive Wrappers
- [x] `responsive-card.tsx`
  - `ResponsiveCard` - Auto-collapsing cards with mobile layouts
  - `ResponsiveCardGrid` - Adaptive grid layouts
  - Props: `collapsible`, `showOnMobile`, `mobileLayout`, `priority`
  
- [x] `responsive-wrapper.tsx`
  - `ResponsiveWrapper` - Container query support
  - `withResponsive()` - HOC for responsive behavior
  - Props: `enableContainer`, `as`, `className`

- [x] `responsive-nav.tsx` - Mobile navigation patterns

- [x] `responsive-table.tsx` - Mobile-friendly table layouts

---

## 🎯 Domain-Specific Components (in `src/components/`)

### Dossier Management
- [x] `DossierCard.tsx` - Dossier preview card with status
- [x] `DossierHeader.tsx` - Page header for dossier details
- [x] `DossierTimeline.tsx` - Timeline view of dossier events
- [x] `DossierStats.tsx` - Statistics dashboard for dossiers
- [x] `DossierActions.tsx` - Action buttons for dossier operations
- [x] `CreateDossierDialog.tsx` - Dialog for creating new dossiers

### Assignment Workflow
Located in `src/components/assignments/`:
- [x] Assignment engine components
- [x] Assignment routing logic
- [x] Assignment status tracking

Located in `src/components/waiting-queue/`:
- [x] Queue management UI
- [x] Bulk operations
- [x] Follow-up reminder system
- [x] Escalation workflow

### Entity Management
- [x] `EntityTypeTabs.tsx` - Entity type filtering tabs
- [x] `EntityDocumentsTab.tsx` - Document management for entities
- [x] `KeyContactsPanel.tsx` - Contact information management

Located in `src/components/entity-links/`:
- [x] Entity relationship visualization
- [x] React Flow graph components
- [x] Entity linking logic

### Forms
- [x] `IntakeForm.tsx` - Front door intake form
- [x] `EngagementForm.tsx` - Engagement creation form
- [x] `AfterActionForm.tsx` - After-action reporting form
- [x] `TypeSpecificFields.tsx` - Dynamic form fields based on type
- [x] `CommitmentEditor.tsx` - Commitment editing interface
- [x] `PositionEditor.tsx` - Position editing interface

### Kanban Board
Located in `src/components/kanban/`:
- [x] `kanban.tsx` (ui component)
- [x] Drag-and-drop kanban board using DnD Kit
- [x] Column management
- [x] Card movement logic

### Search
Located in `src/components/Search/`:
- [x] `GlobalSearchInput.tsx` - Global search bar with keyboard shortcuts
- [x] `SearchResultsList.tsx` - Search results display
- [x] `SearchSuggestions.tsx` - Search autocomplete
- [x] `SearchErrorBoundary.tsx` - Error handling for search

### Approval & Workflow
- [x] `ApprovalChain.tsx` - Approval workflow visualization
- [x] `EditApprovalFlow.tsx` - Edit approval workflows
- [x] `TriagePanel.tsx` - Assignment triage interface
- [x] `SLACountdown.tsx` - SLA timer display

### Documents & Files
- [x] `FileUpload.tsx` - File upload component
- [x] `AttachmentUploader.tsx` - Attachment management
- [x] `VersionHistoryViewer.tsx` - Document version history
- [x] `VersionComparison.tsx` - Compare document versions
- [x] `PDFGeneratorButton.tsx` - Generate PDFs
- [x] `BriefGenerator.tsx` - Generate briefing documents

### UI Utilities
- [x] `LanguageSwitcher.tsx` - Language toggle (en/ar)
- [x] `LanguageToggle.tsx` - Alternative language switcher
- [x] `OfflineIndicator.tsx` - Offline status badge
- [x] `RealtimeStatus.tsx` - Real-time connection status
- [x] `QuickSwitcher.tsx` - Command palette (Cmd+K)
- [x] `FilterPanel.tsx` - Advanced filtering UI
- [x] `Navigation.tsx` - Main navigation component
- [x] `RTLWrapper.tsx` - RTL/LTR wrapper component

### Lists & Data Display
- [x] `DecisionList.tsx` - Decision tracking list
- [x] `FollowUpList.tsx` - Follow-up items list
- [x] `RiskList.tsx` - Risk assessment list
- [x] `PositionList.tsx` - Position listings
- [x] `PositionCard.tsx` - Position display card

### Dialogs & Modals
- [x] `ConflictDialog.tsx` - Conflict resolution dialog
- [x] `EmergencyCorrectionDialog.tsx` - Emergency correction interface
- [x] `CreateDossierDialog.tsx` - Create dossier modal
- [x] `DuplicateComparison.tsx` - Compare duplicate entries

### Analysis & Intelligence
Located in `src/components/intelligence/`:
- [x] Intelligence dashboard components
- [x] Analytics visualizations
- [x] Data insights panels

Located in `src/components/analytics/`:
- [x] Analytics charts and graphs
- [x] Metrics displays
- [x] Trend visualizations

### Calendar & Scheduling
Located in `src/components/Calendar/`:
- [x] Calendar view components
- [x] Event scheduling
- [x] Timeline displays

### Authentication
Located in `src/components/auth/`:
- [x] `MFAManagement.tsx` - Multi-factor authentication management
- [x] `MFASetup.tsx` - MFA setup wizard
- [x] `MFAVerification.tsx` - MFA verification flow
- [x] `StepUpMFA.tsx` - Step-up authentication
- [x] Login/signup forms
- [x] Password reset flows

### User Management
Located in `src/components/user-management/`:
- [x] User profile management
- [x] User permissions
- [x] Role assignment

### Settings
Located in `src/components/settings/`:
- [x] Application settings
- [x] User preferences
- [x] System configuration

### Error Handling
- [x] `ErrorBoundary.tsx` - Global error boundary
- [x] `QueryErrorBoundary.tsx` - React Query error boundary
- [x] `SearchErrorBoundary.tsx` - Search-specific error handling
- [x] `theme-error-boundary.tsx` - Theme error handling

### Theming
Located in `src/components/theme-provider/`:
- [x] Theme provider
- [x] Theme context
- [x] Dark/light mode switching

Located in `src/components/theme-selector/`:
- [x] Theme selection UI
- [x] GASTAT theme
- [x] Blue Sky theme

### Activity & Notifications
Located in `src/components/ActivityFeed/`:
- [x] Activity feed display
- [x] Activity items
- [x] Activity filtering

Located in `src/components/Notifications/`:
- [x] Notification center
- [x] Toast notifications (Sonner)
- [x] Notification preferences

### Editor Components
Located in `src/components/Editor/`:
- [x] Rich text editor (TipTap)
- [x] Document editing
- [x] Content formatting

### Forum & Discussion
Located in `src/components/forums/`:
- [x] Forum threads
- [x] Discussion boards
- [x] Comment systems

### Tasks
Located in `src/components/tasks/`:
- [x] Task lists
- [x] Task management
- [x] Task assignment

### Documents
Located in `src/components/documents/`:
- [x] Document viewer
- [x] Document management
- [x] Document metadata

### Export
Located in `src/components/export/`:
- [x] Export functionality
- [x] Report generation
- [x] Data export

### Validation
Located in `src/components/validation/`:
- [x] Form validation
- [x] Data validation
- [x] Validation feedback

### Backgrounds
Located in `src/components/backgrounds/`:
- [x] Background patterns
- [x] Visual effects
- [x] Layout backgrounds

### Consistency
- [x] `ConsistencyPanel.tsx` - Data consistency checking
- [x] `ConsistencyPanel.example.tsx` - Example usage

### Audit & History
- [x] `AuditLogViewer.tsx` - Audit log display
- [x] `VersionHistoryViewer.tsx` - Version history

### AI & Automation
- [x] `AIExtractionButton.tsx` - AI-powered data extraction

---

## 🎨 Layout Components (in `src/components/Layout/`)

- [x] Main layout wrapper
- [x] Page containers
- [x] Section layouts

---

## 📊 Chart Components (in `src/components/`)

Using Recharts library:
- [x] Line charts
- [x] Bar charts
- [x] Pie charts
- [x] Area charts

---

## 🔧 Hooks (in `src/hooks/`)

### Responsive Hooks
- [x] `use-responsive.ts` - **CRITICAL** - Viewport detection and breakpoint management
- [x] `use-theme.ts` - Theme and direction management
  - `useDirection()` - RTL/LTR detection
  - `useTextDirection()` - Text direction utilities

### Other Hooks
- Various domain-specific hooks for data fetching and state management

---

## 📝 Component Usage Priority

### When building new UI:

1. **First**: Check `src/components/responsive/` for responsive wrappers
   - Use `ResponsiveCard` for adaptive cards
   - Use `ResponsiveWrapper` for container queries
   - Use `ResponsiveCardGrid` for grids

2. **Second**: Check `src/components/ui/` for primitives
   - Use existing Button, Card, Input, etc.

3. **Third**: Check `src/components/` for domain components
   - Reuse existing DossierCard, IntakeForm, etc.

4. **Last**: Build new component using existing primitives
   - Always build mobile-first
   - Always use `useResponsive()` hook
   - Always support RTL/LTR
   - Always use logical CSS properties

---

## 🚫 Do NOT Create These (Already Exist)

- ❌ Custom buttons (use `@/components/ui/button`)
- ❌ Custom cards (use `@/components/ui/card` or `@/components/responsive/responsive-card`)
- ❌ Custom dialogs (use `@/components/ui/dialog`)
- ❌ Custom forms (use `@/components/ui/form` with react-hook-form)
- ❌ Custom tables (use `@/components/ui/table` or `@/components/responsive/responsive-table`)
- ❌ Custom navigation (use existing Navigation, Sidebar, NavigationMenu)
- ❌ Custom language switchers (use LanguageSwitcher or LanguageToggle)
- ❌ Custom responsive wrappers (use ResponsiveCard or ResponsiveWrapper)

---

## ✨ Components That Need Kibo UI Enhancement

These components could benefit from Kibo UI patterns:

- [ ] Enhance `DossierCard` with ResponsiveCard wrapper
- [ ] Add mobile-optimized layouts to data tables
- [ ] Improve touch targets on mobile forms
- [ ] Add progressive disclosure to timeline views
- [ ] Optimize kanban board for mobile drag-and-drop

---

## 📦 Missing Kibo UI Components (To Add)

Components that would be useful additions:

- [ ] DataTable with built-in sorting, filtering, pagination
- [ ] CommandMenu (Cmd+K) with better UX (QuickSwitcher exists but could be enhanced)
- [ ] AvatarStack for grouped avatars
- [ ] StatCard for KPI displays
- [ ] ChartContainer for Recharts integration
- [ ] MetricGrid for responsive metrics display
- [ ] TimelineView (improved version)
- [ ] EntityGraph (improved React Flow integration)

---

**Last Updated**: 2025-01-22  
**Total Components**: 100+  
**Responsive Components**: 4  
**UI Primitives**: 28+  
**Domain Components**: 70+
