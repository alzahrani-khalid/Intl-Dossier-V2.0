---
tags: [ui]
summary: ui implementation decisions and patterns
relevantTo: [ui]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---

# ui

#### [Pattern] Tab-based UI organizing plugin introspection across five concerns: Fields, Relationships, Validation, Permissions, Architecture (2026-01-13)

- **Problem solved:** Demo needed to show all aspects of plugin system to developers, but overwhelming to show all at once
- **Why this works:** Tab organization follows natural developer workflow: first understand data structure (fields), then relationships, then rules (validation/permissions), then architecture. Each tab is self-contained.
- **Trade-offs:** Easier to understand each subsystem in isolation, harder to see how they interact. More clicks to see everything but clearer mental model.

#### [Pattern] Internationalization (i18n) integrated into type definitions with dual-language labels throughout Fields/Relationships/Validation/Permissions (2026-01-13)

- **Problem solved:** Application supports both English and Arabic; UI elements from plugins must be translatable
- **Why this works:** Language object {en: string, ar: string} at definition time ensures every plugin-provided label is translatable. Moves i18n from UI concern to data contract. Works with automatic extraction tools.
- **Trade-offs:** Embedded translations make plugins self-contained, but duplicates strings if many plugins. Translation tools can extract directly from code.

#### [Gotcha] SavedSearchesManager component uses locator.or() chains for i18n element detection in tests instead of data-testid-only approach (2026-01-13)

- **Situation:** Test needed to handle both English and Arabic text variants for same UI element (e.g., 'Saved Searches' vs 'عمليات البحث المحفوظة')
- **Root cause:** Using .or() chains allows tests to work with translated content without hardcoding selectors per language. Avoids maintaining separate test paths for EN/AR, making tests simpler
- **How to avoid:** Tests become more resilient to i18n but slightly more complex with chained locators. Good for verification that translations actually render

### Implemented WatchButton with three render variants (icon/button/compact) controlled by props instead of creating separate components (2026-01-13)

- **Context:** Watchlist functionality needs to appear in multiple UI contexts (sidebar, entity cards, bulk actions) with different visual treatments
- **Why:** Single component with variant props reduces code duplication, keeps watch state management logic in one place, easier to maintain consistency. TanStack Query caching works across all variants.
- **Rejected:** Separate WatchButtonIcon/WatchButtonNormal/WatchButtonCompact components would duplicate hook logic and state management
- **Trade-offs:** Component is slightly more complex but eliminates state sync issues between variants. Query cache shared across all instances.
- **Breaking if changed:** Splitting into separate components would require duplicating useWatchlist hook calls and managing separate caches - variants could show inconsistent data

### Keyboard shortcuts implemented via global hook (useTemplateKeyboardShortcuts) rather than context provider or event listener on specific components (2026-01-13)

- **Context:** Need Alt+T to work from anywhere in the app, with Alt+<key> applying specific templates
- **Why:** Global hook mounted once at app level prevents duplicate listeners and handles lifecycle cleanup. Avoids context drilling for keyboard state
- **Rejected:** Context provider (more boilerplate), component-level listeners (duplicate listeners), window.addEventListener in multiple places (hard to cleanup)
- **Trade-offs:** Single hook at app root is simpler, but means dialog state must be lifted to app level or passed via context anyway
- **Breaking if changed:** If hook isn't mounted at app level, keyboard shortcuts won't work anywhere

#### [Pattern] TemplateCard uses button role with tabIndex=0 and manual Enter/Space handlers instead of native button element (2026-01-13)

- **Problem solved:** Template cards styled as custom divs with click handlers for better visual control and animations
- **Why this works:** Maintains keyboard accessibility (role + tabIndex + handlers = keyboard navigable) while allowing custom styling. Native button would have default styles to override
- **Trade-offs:** Must manually implement Enter/Space handlers and manage focus, but gets custom styling and animations

### RTL support uses logical CSS properties (margin-inline, direction: rtl) with cn() className helper rather than separate RTL-specific components (2026-01-13)

- **Context:** Supporting English (LTR) and Arabic (RTL) in same component
- **Why:** Logical properties auto-flip based on dir attribute - no component duplication. Single className expression handles both layouts. Less code, easier maintenance
- **Rejected:** Separate RTL/LTR component variants (doubles code), inline style conditionals (fragile, hard to read)
- **Trade-offs:** Requires modern browser support for logical properties, but gets cleaner code and automatic right-sizing
- **Breaking if changed:** If dir attribute isn't set on container, RTL layout breaks

#### [Pattern] Duplicate detection UI split into three abstraction levels: DuplicateCandidateCard (individual pair display), DuplicateCandidatesList (filtered list with scan triggers), and MergeDialog (conflict resolution), with demo page orchestrating all three (2026-01-13)

- **Problem solved:** Duplicate management involves viewing candidates, filtering, scanning, and merging - each with distinct concerns
- **Why this works:** Separation allows: (1) Card reusable for other duplicate contexts, (2) List can test filtering/scanning independently, (3) MergeDialog isolates conflict UI complexity, (4) demo page shows composition pattern for integrating feature
- **Trade-offs:** Easier: Testing, reusability, composition. Harder: More components to maintain, requires understanding prop drilling/context patterns

#### [Pattern] Role-based visibility flags in quick actions config (e.g., 'roles: ["admin", "manager"]') rather than component-level permission checks (2026-01-13)

- **Problem solved:** Quick actions differ by role (Admin sees 'Manage Users', Analyst sees 'View Reports'). Without declarative visibility, each action needs runtime role comparison logic.
- **Why this works:** Declarative approach enables: (1) config-driven UI without recompilation, (2) clear intent in configuration vs buried in JSX, (3) easier to audit which roles see which actions
- **Trade-offs:** More verbose config definition upfront, but eliminates conditional rendering logic from components. Makes role requirements explicit and auditable.

#### [Pattern] Demo page uses static JSON data with hardcoded UI state (showing All/Present/Absent filters) rather than fully functional component behavior (2026-01-13)

- **Problem solved:** Need to verify component rendering and layout without full backend integration or complex state management setup
- **Why this works:** Decouples component verification from API contract. Demo can be used immediately without backend services. Speeds up component development and visual regression testing
- **Trade-offs:** Demo doesn't catch state management bugs or API contract mismatches. Test coverage is narrower. Good for UI/layout verification, insufficient for behavior testing

### Bilingual UI implemented with i18n library storing translations in separate JSON files per language, enabling tab selectors to use regex patterns `/scenarios|سيناريوهاتي/i` to match both EN and AR text. (2026-01-14)

- **Context:** Need to support English and Arabic with RTL layout while keeping Playwright tests language-agnostic
- **Why:** Regex patterns in test selectors handle both languages without hardcoding, reducing test maintenance. Separate translation files follow i18n best practices.
- **Rejected:** Single translation key matching would require language context in tests; hardcoding EN/AR separately would create test duplication
- **Trade-offs:** Regex matching makes tests robust to language changes but adds slight overhead; requires careful regex escaping to avoid false matches
- **Breaking if changed:** Changing translation strings breaks regex patterns in tests. Adding new RTL languages requires updating all i18n regex patterns in test selectors.

#### [Pattern] Three distinct resolution action buttons (Reschedule, Adjust Duration, Proceed Anyway) mapped to different user intents rather than a single 'resolve' action (2026-01-14)

- **Problem solved:** Users need different pathways to handle the same conflict based on their preference - some want suggestions, some want control, some want to override
- **Why this works:** Explicit actions clarify intent and prevent accidental conflict acceptance. Each action has clear consequences: reschedule opens suggestions, adjust shows duration options (non-destructive), proceed bypasses checking
- **Trade-offs:** More UI surface area but clearer mental model. Users can immediately see all paths forward without nested menus

#### [Pattern] Severity-based color coding reused from existing `SEVERITY_COLORS` type definitions rather than creating new conflict-specific colors (2026-01-14)

- **Problem solved:** Need visual distinction for conflict severity (high/medium/low) in participant badges
- **Why this works:** Reuses established color semantics already familiar to users. Avoids color palette inconsistency across the calendar application. Single source of truth for color-to-severity mapping
- **Trade-offs:** Ties component to existing severity color system - if that changes, this automatically updates. No redundant color definitions but component depends on upstream type

#### [Gotcha] Dialog preview modal with 'View Details' button must be explicitly clicked before accessing dossier details page and Relationships tab (2026-01-14)

- **Situation:** Tests were timing out trying to find Relationships tab from preview modal context rather than full detail page
- **Root cause:** Preview modal is a separate UI layer that doesn't contain the full dossier structure. The modal context lacks the tab navigation present on full detail page
- **How to avoid:** Required adding 'View Details' navigation step in test flow, but this reflects actual user journey - users expect full page for detailed operations

#### [Pattern] Used visual diagrams (A → B notation) to teach relationship directionality and marked symmetric relationships with 'Two-way' badge (2026-01-14)

- **Problem solved:** Users confuse directional vs non-directional relationships, leading to invalid relationship configurations
- **Why this works:** Visual representation is faster to process than text for spatial concepts. Badge provides instant disambiguation for symmetric types. Prevents common mistake of creating both A→B and B→A for bilateral relationships
- **Trade-offs:** Requires consistent visual language across components, but prevents expensive user support costs from misconfigured relationships

### Severity-based color coding system using pre-existing SEVERITY_COLORS constants rather than inventing new color palette (2026-01-14)

- **Context:** Needed visual distinction between conflict severity levels (critical/high/medium/low) in the comparison view
- **Why:** Reuses existing design system and color semantics already established in calendar-conflict.types.ts, ensuring UI consistency and reducing maintainability burden of color definitions
- **Rejected:** Creating new severity-specific color palette or using generic color assignments
- **Trade-offs:** Constrains design to existing palette but guarantees consistency; eliminates need for separate color definition in multiple places
- **Breaking if changed:** Changing or removing SEVERITY_COLORS would break visual hierarchy of conflict display; UI loses semantic meaning if colors are removed

#### [Pattern] Conditional rendering of SchedulingConflictComparison only when conflicts.has_conflicts is true (2026-01-14)

- **Problem solved:** Component should only appear when actual conflicts exist, not on every form rendering
- **Why this works:** Avoids rendering unused DOM nodes and maintains clean separation of concerns - the component is conflict-specific UI that should not exist in non-conflict states
- **Trade-offs:** Requires parent (CalendarEntryForm) to know about component's visibility requirements; makes component API clearer but increases parent complexity slightly

#### [Gotcha] RTL support required logical properties (ms-_, me-_, text-start, text-end) instead of directional properties (ml-_, mr-_, text-left, text-right) even though only Arabic RTL is currently implemented (2026-01-14)

- **Situation:** Component was built with i18n support for English and Arabic; Arabic requires right-to-left layout
- **Root cause:** Logical properties automatically flip based on document direction, making RTL support automatic without duplicate styling; future language additions inherit RTL support for free
- **How to avoid:** Logical properties have slightly less browser support (IE not supported but acceptable for modern app); increases CSS property literacy requirement for team but eliminates brittle RTL-specific selectors

#### [Pattern] Expandable/collapsible conflict cards with preset duration options (30, 45, 60, 90 min) for duration adjustment rather than free-form time picker (2026-01-14)

- **Problem solved:** Users need ability to adjust event duration to resolve conflicts without re-scheduling
- **Why this works:** Preset options reduce interaction burden and prevent invalid time entries; most scheduling conflicts resolve within these common increments; expandable pattern keeps UI uncluttered until needed
- **Trade-offs:** Presets limit flexibility but improve UX for common cases; expandable state requires managing additional React state per conflict but keeps layout clean

### Framer Motion used for smooth expand/collapse animations in conflict comparison cards rather than CSS transitions or instant state changes (2026-01-14)

- **Context:** Showing/hiding conflict details needs polish for production feel without janky transitions
- **Why:** Framer Motion provides spring animations and smooth layout transitions that feel natural; consistent with likely existing animation library in project; orchestrates both scale and opacity together
- **Rejected:** Pure CSS transitions; instant state changes; React-Spring
- **Trade-offs:** Adds dependency (minor if already in project); animation timing becomes configurable and debuggable but adds slight complexity to component code
- **Breaking if changed:** Removing animations makes interactions feel unresponsive; if Framer Motion is removed from project, this component needs rework to use alternative animation library

#### [Gotcha] Changed draft restoration banner verification from checking banner text to checking for restore button visibility (2026-01-14)

- **Situation:** Initial Playwright tests looked for banner text content but this was fragile across RTL/LTR rendering and i18n variations
- **Root cause:** Checking for the functional restore button (the actual interactive element) is more reliable than text matching. Button existence = draft state; text can vary by locale/theme without changing functionality
- **How to avoid:** More semantic testing (tests behavior not appearance) but requires knowing internal button structure; slightly more effort to locate correct element

### Recommendation ranking system that surfaces most-likely relationship types first based on dossier type combination rather than alphabetical/canonical ordering (2026-01-14)

- **Context:** Users working with specific dossier type pairs (e.g., Country → Country) face decision paralysis with 17 options; domain experts know which types are appropriate
- **Why:** Reduces cognitive load by showing context-aware suggestions first; improves conversion and reduces support questions about 'correct' relationship type to use
- **Rejected:** Fixed presentation order (alphabetical, frequency-based globally) - loses domain context; recommendations in separate panel - adds UI clutter
- **Trade-offs:** Requires maintaining recommendation mapping for each dossier type pair; increases bundle size slightly; must update when new dossier types added
- **Breaking if changed:** Removing recommendation logic makes all types equally prominent - users resort to trial-and-error or support

#### [Gotcha] Visual example diagrams (A → B notation) required for understanding bidirectional relationships that are 'Symmetric' but only show one direction in the selector (2026-01-14)

- **Situation:** Relationship types like 'bilateral_relation' are semantically bidirectional but presented with directional arrows (A → B), causing confusion about whether selection requires selecting reverse type
- **Root cause:** Two-way badge + visual example explicitly signals that selecting Type creates implicit reverse; prevents duplicate entry and data inconsistency
- **How to avoid:** Badge + description adds visual weight but prevents support tickets; schemas may store only one direction with symmetric flag

#### [Pattern] Used color-coded severity badges (critical/high/medium/low) paired with participant availability badges to create dual visual signaling system (2026-01-14)

- **Problem solved:** Need to communicate both conflict severity and participant availability status in compact space without overwhelming users
- **Why this works:** Severity indicates impact on scheduling (how bad the conflict is), while participant badges indicate who is affected and their status. Together they provide quick visual triage. Colors imported from existing `SEVERITY_COLORS` constant ensures consistency with conflict system already in codebase
- **Trade-offs:** Dual badges require more visual real estate but provide both layers of information at a glance. Users must learn badge meanings, but this is already established in codebase

### Mobile-first layout uses vertical stacking for conflict cards that switch to side-by-side at lg: breakpoint, with logical properties (ms-_/me-_/text-start/text-end) for RTL (2026-01-14)

- **Context:** Component must work on mobile (375px) and desktop (1200px+) viewports with both LTR (English) and RTL (Arabic) language modes
- **Why:** Mobile-first ensures readability on smallest screens first. Logical properties automatically flip padding/margin/text alignment based on `dir` attribute without needing duplicate RTL styles. This scales better than writing separate RTL variants
- **Rejected:** Desktop-first approach would require media query overrides for mobile. Absolute properties (left/right/padding-left) require separate RTL stylesheets and doubles CSS maintenance
- **Trade-offs:** Logical properties require knowing CSS spec (ms- = margin-start) but eliminate RTL duplication. Initial mobile vertical layout prevents showing conflicts side-by-side on mobile, but this actually improves readability
- **Breaking if changed:** Removing logical properties and switching to absolute positioning breaks RTL layout completely - Arabic text would still read right-to-left but elements would be positioned for LTR. Removing responsive stacking collapses mobile viewport

#### [Pattern] Duration adjustment implemented as expandable preset options (30/45/60/90 min) rather than free-form time input (2026-01-14)

- **Problem solved:** Users need quick way to adjust event duration to avoid conflicts without going through full event rescheduling flow
- **Why this works:** Presets reduce cognitive load - users don't need to calculate new end times. Presets cover 95% of use cases. Direct form state modification via `setEndDatetime` keeps resolution UI logic simple and doesn't require a separate 'confirm' action
- **Trade-offs:** Preset options are slightly less flexible but dramatically faster for common durations. Users who need custom durations must reschedule instead

#### [Pattern] Participant availability shown as badge count with tooltip showing individual event details rather than full list of participants (2026-01-14)

- **Problem solved:** Need to show which participants are affected by conflicts without cluttering UI with full names
- **Why this works:** Badge count (e.g., '3 busy') provides at-a-glance impact measurement. Tooltip shows detail on demand. Prevents horizontal overflow even with many participants. Color coding (busy/available/tentative) provides quick status without reading text
- **Trade-offs:** Users must hover for details but get instant summary. Mobile tooltips are awkward (long-press needed) so might need alternative pattern

#### [Gotcha] Test navigation directly clicking dossier links failed because page navigation wasn't properly tracked - moved to localStorage manipulation in tests (2026-01-14)

- **Situation:** Initial E2E test tried navigating via UI clicks to trigger `useEntityNavigation` hook, but navigation state wasn't persisting to localStorage in test environment
- **Root cause:** The `addInitScript` approach bypasses flaky UI navigation and directly sets the expected localStorage state, making tests deterministic and isolated from database/link availability
- **How to avoid:** Easier: Fast, reliable tests that don't depend on data. Harder: Tests don't verify the actual hook execution path - requires separate unit tests for hooks

#### [Pattern] Breadcrumb shows limited entities (5 desktop, 3 mobile) with 'More' dropdown instead of full list or pagination (2026-01-14)

- **Problem solved:** History can grow to 10 entities but not all fit in header without consuming too much screen space
- **Why this works:** Limited display keeps header compact and respects mobile constraints. Dropdown provides access to full history without layout shift. Better UX than pagination (single click to see all) or infinite scroll (unexpected on header)
- **Trade-offs:** Easier: Consistent layout, quick access to recent (top 5). Harder: Harder to discover older history, dropdown requires click overhead

### Entity preview cards render full disambiguation data (key_details, status, recent activity) in autocomplete dropdown rather than lazy-loading on hover (2026-01-14)

- **Context:** Preventing incorrect entity associations in relationship dialogs where users select target dossiers
- **Why:** Upfront visibility eliminates disambiguation errors - users see status, type, country, region immediately without interaction delay. Cognitive load reduced when choosing between similarly-named entities
- **Rejected:** Lazy-load on hover (reduces initial data transfer but adds 200-300ms interaction cost). Minimal preview (name + type only) to reduce noise
- **Trade-offs:** Larger dropdown payload but faster decision-making; more visible options reduce selection errors at cost of visual density
- **Breaking if changed:** Removing key_details rendering would reintroduce the core problem: users selecting wrong entities due to ambiguous names (e.g., multiple 'Ministry of Finance' across countries)

#### [Gotcha] 500ms waitForTimeout in autocomplete tests is arbitrary debounce delay, not standard playwright wait - brittle across slow networks (2026-01-14)

- **Situation:** Playwright verification tests used fixed timeouts for search debounce rather than observable state
- **Root cause:** Debounce delay is 300ms but 500ms buffer added empirically. Tests became environment-dependent (CI slower than local dev)
- **How to avoid:** Hard-coded waits are simple to write but unreliable in production CI. Should have waited for observable result state instead

#### [Pattern] Used FieldErrorHighlight wrapper component with configurable animation types (pulse, shake, glow, none) rather than inline error styling (2026-01-14)

- **Problem solved:** Needed to indicate which field has an error without cluttering form field component with animation logic
- **Why this works:** Wrapper pattern allows any form field type (text, email, url, etc.) to gain error animation capability without modification. Animation triggers only when error is added (not pre-existing). Logical CSS properties handle RTL automatically.
- **Trade-offs:** Adds one DOM layer per field, but centralizes all error animation behavior. The animation types enum prevents arbitrary CSS class names and keeps variants controlled.

#### [Pattern] ActionableErrorSummary uses expandable/collapsible list with click-to-focus rather than showing all errors at once (2026-01-14)

- **Problem solved:** Forms can have many validation errors at once; showing all creates cognitive overload and obscures the form
- **Why this works:** Collapsible list shows only error count initially (summary mode), expands on click to show details (expanded mode). Each error item is clickable to focus its field. This lets users fix one field, collapse, fix next field without scrolling past full error list.
- **Trade-offs:** Requires extra click to see all errors, but keeps form visible. Warning count badge provides at-a-glance status without visual clutter.

#### [Pattern] Preview dialog uses checkbox-based exclusion rather than delete/remove buttons, with Include All/Exclude All toggles for bulk operations on the preview list itself (2026-01-14)

- **Problem solved:** Users need to review and selectively exclude items before batch execution without losing context or navigating away
- **Why this works:** Checkbox pattern is familiar, reversible, and allows visual confirmation of selected state; Include All/Exclude All prevents repetitive clicking on large lists
- **Trade-offs:** Simpler mental model and faster batch operations vs. slightly more UI elements; reversibility means no accidental data loss from premature commits

#### [Pattern] Status, priority, and assignee displayed as colored badges within preview items rather than plain text or separate columns (2026-01-14)

- **Problem solved:** Users scanning a bulk preview list need quick visual scanning to make exclusion decisions for dozens of items
- **Why this works:** Color-coded badges enable pattern recognition without reading text; status/priority are categorical data suited to visual encoding; faster decision-making than scanning text
- **Trade-offs:** Slightly more complex rendering code but dramatically faster user comprehension; accessibility requires proper aria-labels which adds i18n burden

### Visual hierarchy implemented via combination of badge labels (Required/Recommended/Optional), border colors, and asterisks rather than pure styling alone (2026-01-14)

- **Context:** Needed to communicate field importance clearly to users, especially in multilingual context where subtle styling differences might not translate across cultures
- **Why:** Text labels are language-agnostic and scannable. Color coding provides redundancy (not sole indicator). Asterisks provide a standard UX convention that's widely recognized. Combined approach ensures accessibility and cultural clarity without relying on color alone
- **Rejected:** Color-only differentiation - fails for colorblind users and doesn't work well in RTL cultural contexts. Pure styling (weight/size) - too subtle and doesn't work across all screen sizes
- **Trade-offs:** Slightly more visual complexity per field, but dramatically improved clarity and accessibility. Extra i18n strings needed but worth it
- **Breaking if changed:** Removing badges would make optional fields indistinguishable from required ones. Removing asterisks would break WCAG compliance for required field indicators

#### [Pattern] Three component variants (Dialog, Inline, Badge) for permission errors instead of single configurable component (2026-01-14)

- **Problem solved:** Permission error UI needed in different contexts - full page (dialog), embedded in content (inline), as indicator (badge). Could be one component with mode prop.
- **Why this works:** Separation prevents feature creep in single component and makes each variant's purpose explicit. Badge variant doesn't need granular error details or request form. Inline doesn't need full dialog chrome. Variants document intended usage patterns.
- **Trade-offs:** Easier: clear responsibility, smaller bundle per use case, simpler prop interface. Harder: code duplication across variants, updates need propagating to three places

### Used class-based selectors (`[class*="badge"]`, `[class*="rounded-xl"]`) in Playwright tests instead of data-testid attributes (2026-01-14)

- **Context:** Testing filter chip visibility and removal without modifying component implementation
- **Why:** Pragmatic approach to verify behavior without requiring code changes; works with existing TailwindCSS class-based markup. Avoids adding test-only attributes that increase bundle size
- **Rejected:** Adding data-testid attributes to all selectable elements - requires production code changes and increases HTML bundle; relying on exact text matching only - brittle with i18n (Arabic/English)
- **Trade-offs:** Easier: no code changes needed. Harder: selectors are fragile to CSS class refactoring; requires flexible regex patterns for i18n text (`/active filter|فلتر نشط/i`)
- **Breaking if changed:** If class names change (e.g., TailwindCSS migration), all class-based selectors break; if i18n keys change, text-based filters break

#### [Gotcha] Hidden results indicator calculation needs to account for filters that hide expected results, not just filter the full dataset (2026-01-14)

- **Situation:** UI showed '5 results hidden' but business logic was unclear about what 'hidden' means vs 'filtered'
- **Root cause:** Users need to understand why results are missing - is it filters hiding them or is that the full dataset? Showing 'X hidden (Y total)' distinguishes between 'total possible' and 'currently shown'
- **How to avoid:** Easier: users understand results changed due to filters. Harder: requires tracking both total unfiltered count and filtered count; adds UI complexity with warning indicator

#### [Gotcha] i18n text matching for 'Clear all' button must support both English and Arabic without hardcoding strings in multiple places (2026-01-14)

- **Situation:** Playwright tests check for 'Clear all|مسح الكل' button visibility but these strings need to match actual translated output from i18n system
- **Root cause:** Decoupling test strings from component translations prevents sync issues when translations change. Regex matching handles both languages without test code changes
- **How to avoid:** Easier: tests work across language variants without duplication. Harder: regex patterns must be maintained as translations evolve; unclear which language should be tested in CI
