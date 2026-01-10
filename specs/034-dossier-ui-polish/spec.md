# Feature Specification: Dossier UI Polish - Mobile, RTL & Accessibility

**Feature Branch**: `034-dossier-ui-polish`
**Created**: 2025-01-04
**Status**: Draft
**Input**: User description: "Complete the deferred polish tasks for 028-type-specific-dossier-pages: Mobile Testing at 320px/375px/414px viewports with 44px touch targets, RTL Testing for comprehensive Arabic support throughout the entire UI, Accessibility Audit using axe-playwright for WCAG AA compliance, Performance Optimization with useMemo, and Documentation with JSDoc comments. Focus on automated tests for CI/CD."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Arabic Users Experience Full RTL Support (Priority: P1)

As an Arabic-speaking user, I need the entire application to render correctly in right-to-left mode when I select Arabic, so that I can use the system naturally in my language without layout issues, misaligned text, or confusing navigation.

**Why this priority**: Arabic is a primary language for GASTAT users. Incomplete RTL support creates confusion, reduces productivity, and makes the system feel unprofessional. This affects a significant portion of the user base and is critical for adoption.

**Independent Test**: Can be fully tested by switching language to Arabic and verifying all 6 dossier detail pages (Country, Organization, Person, Engagement, Forum, Working Group) render correctly in RTL mode with proper text alignment, icon flipping, and layout mirroring.

**Acceptance Scenarios**:

1. **Given** I am viewing any dossier detail page in English, **When** I switch the language to Arabic, **Then** the entire page layout mirrors horizontally with text aligned to the right and navigation elements repositioned correctly
2. **Given** I am using Arabic language, **When** I view the sidebar navigation, **Then** it appears on the right side with menu items aligned properly and icons flipped where directionally appropriate
3. **Given** I am viewing breadcrumbs in Arabic, **When** the breadcrumb trail renders, **Then** the path reads right-to-left with proper separator direction and parent-child relationships maintained
4. **Given** I am using Arabic language, **When** I interact with forms, inputs, and buttons, **Then** all labels appear on the correct side, placeholder text aligns properly, and button icons flip as needed
5. **Given** I am viewing data tables in Arabic, **When** the table renders, **Then** column headers and cell content align to the right with proper reading order
6. **Given** I am viewing dates and numbers in Arabic, **When** numeric values display, **Then** they format appropriately for Arabic locale (Arabic numerals optional, but proper locale-aware formatting required)
7. **Given** I am using Arabic language, **When** a modal or drawer opens, **Then** it animates from the correct direction (right-to-left) and content inside follows RTL layout
8. **Given** I have long Arabic text content, **When** it displays in cards or sections, **Then** it renders without truncation issues and wraps correctly within containers

---

### User Story 2 - Mobile Users Can Use All Dossier Pages (Priority: P1)

As a mobile user accessing the system on my phone, I need all dossier detail pages to be fully functional and readable on small screens, so that I can work effectively while away from my desk.

**Why this priority**: Mobile access is essential for field work and on-the-go productivity. Users should not be blocked from accessing critical dossier information due to layout issues on mobile devices.

**Independent Test**: Can be fully tested by opening each of the 6 dossier detail pages on iPhone SE (320px), iPhone 12 (375px), and iPhone 14 Pro Max (414px) viewports and verifying all content is readable and interactive.

**Acceptance Scenarios**:

1. **Given** I am viewing a Country dossier on a 320px viewport, **When** the page loads, **Then** all content is visible, readable, and scrollable without horizontal overflow
2. **Given** I am using a mobile device, **When** I tap interactive elements (buttons, links, dropdowns), **Then** all touch targets are at least 44x44 pixels and easy to tap accurately
3. **Given** I am on a 375px viewport, **When** I navigate between dossier sections, **Then** collapsible sections work smoothly and section headers are clearly visible
4. **Given** I am viewing tabular data on mobile, **When** a table has many columns, **Then** I can scroll horizontally within the table container without affecting the main page layout
5. **Given** I am using a 414px viewport, **When** I interact with forms or filters, **Then** form controls are appropriately sized and keyboard entry works correctly
6. **Given** I am on any mobile viewport, **When** I view cards or list items, **Then** content stacks vertically with adequate spacing between elements
7. **Given** I am scrolling on mobile, **When** I scroll through long lists or content, **Then** the scrolling is smooth and performant without janky behavior

---

### User Story 3 - Users with Disabilities Can Access All Features (Priority: P2)

As a user who relies on assistive technology (screen reader, keyboard navigation, or other accessibility tools), I need all dossier pages to be fully accessible according to WCAG AA standards, so that I can use the system effectively regardless of my abilities.

**Why this priority**: Accessibility is both a legal requirement in many jurisdictions and the right thing to do. It ensures the system is usable by all employees regardless of visual, motor, or cognitive abilities.

**Independent Test**: Can be fully tested by running axe-playwright automated accessibility tests on all 6 dossier detail pages and verifying zero critical or serious violations.

**Acceptance Scenarios**:

1. **Given** I am using a screen reader, **When** I navigate to any dossier detail page, **Then** the page title is announced and all content is read in logical order
2. **Given** I am navigating with keyboard only, **When** I tab through the page, **Then** focus moves in a logical order and all interactive elements are reachable
3. **Given** I am viewing any page, **When** I inspect text and background colors, **Then** all text meets WCAG AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text)
4. **Given** I am using a screen reader, **When** I encounter collapsible sections, **Then** the expanded/collapsed state is announced correctly with proper ARIA attributes
5. **Given** I encounter an image or icon, **When** it conveys meaning, **Then** it has appropriate alt text or aria-label; decorative images are marked with aria-hidden
6. **Given** I am using keyboard navigation, **When** I interact with dropdown menus or modals, **Then** focus is trapped appropriately and I can close with Escape key
7. **Given** an error or status message appears, **When** I am using a screen reader, **Then** the message is announced via aria-live region or alert role
8. **Given** I view any form field, **When** I inspect its accessibility, **Then** it has a proper label associated via htmlFor/id or aria-labelledby

---

### User Story 4 - Application Performs Well on All Devices (Priority: P2)

As a user on any device, I need dossier pages to render quickly and respond immediately to my interactions, so that I can work efficiently without waiting for slow UI updates.

**Why this priority**: Performance directly impacts user satisfaction and productivity. Slow or janky interfaces frustrate users and reduce system adoption.

**Independent Test**: Can be fully tested by measuring render times and interaction responsiveness on dossier detail pages with typical data loads.

**Acceptance Scenarios**:

1. **Given** I navigate to a dossier detail page with typical data, **When** the page renders, **Then** initial content appears within 1 second on standard network connections
2. **Given** I expand or collapse a section, **When** I click the section header, **Then** the animation completes smoothly within 300ms without blocking user input
3. **Given** I scroll through a page with multiple sections, **When** I scroll rapidly, **Then** the page maintains 60fps without dropped frames or jank
4. **Given** I interact with the page repeatedly, **When** the same data displays multiple times, **Then** components do not unnecessarily re-render (verified via React DevTools profiler)
5. **Given** I am on a lower-powered mobile device, **When** I use the application, **Then** interactions remain responsive without excessive battery drain

---

### User Story 5 - Developers Can Understand and Maintain Code (Priority: P3)

As a developer maintaining the codebase, I need clear documentation on type guards, hooks, and components, so that I can quickly understand how to use and extend the dossier UI functionality.

**Why this priority**: Good documentation reduces onboarding time for new developers and prevents bugs from misuse of shared utilities. While not user-facing, it supports long-term maintainability.

**Independent Test**: Can be fully tested by reviewing JSDoc comments on all exported functions and components and verifying they describe parameters, return values, and usage examples.

**Acceptance Scenarios**:

1. **Given** I am a developer looking at a type guard function, **When** I hover over it in my IDE, **Then** I see a JSDoc comment explaining what the function checks and returns
2. **Given** I am using a custom hook, **When** I view its documentation, **Then** I see descriptions of all parameters, return values, and usage examples
3. **Given** I am implementing a new dossier type page, **When** I reference existing components, **Then** I can understand their props and behavior from JSDoc comments without reading implementation code
4. **Given** I generate documentation from the codebase, **When** the tool processes JSDoc comments, **Then** meaningful API documentation is produced

---

### Edge Cases

- What happens when Arabic text contains embedded English words or numbers? They should render correctly in mixed content (bidirectional text support)
- How does the system handle ultra-narrow viewports below 320px? Content should still be accessible via scrolling, not broken
- What happens when a user rapidly toggles between English and Arabic? Language switch should complete fully before accepting another toggle
- How are RTL and LTR handled in user-generated content within dossiers? Content direction should follow the current language setting while preserving original text
- What happens with third-party embedded content that doesn't support RTL? It should be contained and not break surrounding layout
- How are focus outlines handled for accessibility while maintaining design aesthetics? Custom focus styles must remain visible and meet contrast requirements

## Requirements _(mandatory)_

### Functional Requirements

#### RTL/Arabic Support

- **FR-001**: System MUST set `dir="rtl"` on the root layout container when Arabic language is selected
- **FR-002**: System MUST use CSS logical properties exclusively (margin-inline-start/end, padding-inline-start/end, inset-inline-start/end) instead of physical left/right properties
- **FR-003**: System MUST flip directional icons (arrows, chevrons, navigation indicators) when in RTL mode
- **FR-004**: System MUST mirror the sidebar navigation to the right side in RTL mode
- **FR-005**: System MUST align all text content to the start (right in RTL, left in LTR)
- **FR-006**: System MUST reverse breadcrumb reading order in RTL mode while maintaining logical hierarchy
- **FR-007**: System MUST render modals and drawers with animations appropriate to RTL direction
- **FR-008**: System MUST format dates and numbers according to the selected locale
- **FR-009**: System MUST support bidirectional text (mixing Arabic and English) without breaking layout

#### Mobile Responsiveness

- **FR-010**: System MUST display correctly at 320px, 375px, and 414px viewport widths
- **FR-011**: System MUST provide touch targets of minimum 44x44 pixels for all interactive elements
- **FR-012**: System MUST stack content vertically on mobile viewports where appropriate
- **FR-013**: System MUST enable horizontal scrolling for wide content (tables) within contained areas
- **FR-014**: System MUST ensure no content is cut off or hidden on small viewports
- **FR-015**: System MUST maintain adequate spacing (minimum 8px) between interactive elements on touch devices

#### Accessibility (WCAG AA)

- **FR-016**: System MUST meet WCAG 2.1 AA contrast requirements for all text
- **FR-017**: System MUST support full keyboard navigation for all interactive elements
- **FR-018**: System MUST provide proper ARIA labels for all non-text interactive elements
- **FR-019**: System MUST announce dynamic content changes via aria-live regions
- **FR-020**: System MUST maintain logical focus order matching visual order
- **FR-021**: System MUST trap focus within modals when open and release on close
- **FR-022**: System MUST provide visible focus indicators that meet contrast requirements
- **FR-023**: System MUST pass automated accessibility testing with axe-core (zero critical/serious violations)

#### Performance

- **FR-024**: System MUST memoize expensive calculations in section components to prevent unnecessary re-renders
- **FR-025**: System MUST render dossier detail pages within 1 second on standard connections
- **FR-026**: System MUST maintain 60fps during scroll and animations

#### Documentation

- **FR-027**: System MUST include JSDoc comments on all exported type guards
- **FR-028**: System MUST include JSDoc comments on all custom hooks with parameter and return type descriptions
- **FR-029**: System MUST include JSDoc comments on all page-level components describing their purpose and props

### Key Entities

- **Dossier Types**: The 6 entity types (Country, Organization, Person, Engagement, Forum, Working Group) that have dedicated detail pages requiring polish
- **Language/Locale Settings**: User preference for display language (English/Arabic) that determines text direction and formatting
- **Viewport Breakpoints**: The device width categories (320px, 375px, 414px mobile; larger for tablet/desktop) that trigger responsive layout changes
- **Accessibility Violations**: Categorized issues (critical, serious, moderate, minor) detected by automated accessibility testing tools

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 6 dossier detail pages render correctly in RTL mode with zero visual layout breaks when Arabic is selected
- **SC-002**: All 6 dossier detail pages display correctly at 320px, 375px, and 414px viewport widths without horizontal overflow
- **SC-003**: 100% of interactive elements have touch targets of at least 44x44 pixels
- **SC-004**: Zero critical or serious accessibility violations detected by axe-core automated testing on all 6 dossier detail pages
- **SC-005**: All text content meets WCAG AA contrast ratio requirements (4.5:1 normal, 3:1 large text)
- **SC-006**: Full keyboard navigation is possible through all dossier detail pages without mouse usage
- **SC-007**: Dossier detail pages render initial content within 1 second on standard network connections
- **SC-008**: No unnecessary re-renders detected via React DevTools profiler during typical user interactions
- **SC-009**: 100% of exported type guards, hooks, and page components have JSDoc documentation
- **SC-010**: Automated tests for mobile viewports, RTL layout, and accessibility can run in CI/CD pipeline

## Assumptions

- The existing 028 implementation provides the base components to be polished (no new functionality is being added)
- Users will access the system primarily via modern browsers (Chrome, Safari, Firefox, Edge) that support CSS logical properties
- Arabic is the only RTL language required at this time (no Hebrew, Farsi, etc.)
- The automated accessibility tests will use axe-playwright as the testing framework
- Performance baselines are measured on mid-range devices with standard network conditions
- The existing i18n infrastructure (i18next) properly handles language switching and locale detection
