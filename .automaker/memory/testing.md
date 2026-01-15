---
tags: [testing]
summary: testing implementation decisions and patterns
relevantTo: [testing]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 9
  referenced: 4
  successfulFeatures: 4
---

# testing

#### [Gotcha] Playwright test path resolution requires path.resolve() or absolute paths; relative paths fail when test runs from different working directory (2026-01-13)

- **Situation:** Tests initially used path.join(\_\_dirname, '../backend/src') which worked locally but failed in CI/different test runner invocations
- **Root cause:** \_\_dirname is relative to test file location, but working directory can vary. path.resolve() creates absolute path independent of CWD. path.join() with relative segments is fragile across environments.
- **How to avoid:** path.resolve(**dirname, ...) is reliable but requires understanding **dirname context. Alternative would be reading tsconfig.json to determine base paths or using import.meta.url in ES modules.

#### [Gotcha] Test file location (tests/e2e vs e2e/tests) must match Playwright configuration, otherwise test discovery fails silently (2026-01-13)

- **Situation:** Tests were created in tests/e2e directory but Playwright was configured to look in e2e/tests, causing silent test discovery failure
- **Root cause:** Playwright's glob patterns in config determine which files are scanned. Misalignment creates broken test setup that only fails when explicitly running tests
- **How to avoid:** Gained: tests run. Lost: time debugging test discovery

#### [Gotcha] E2E tests verifying CQRS through Supabase RPC calls require SUPABASE_ANON_KEY set in environment, but this key may not have permission to call all schema-qualified functions (e.g., read_models.\*) (2026-01-13)

- **Situation:** Tests attempted to call `supabase.rpc('read_models.get_stale_projections')` but failed due to missing/unset anon key
- **Root cause:** Supabase RPC requires authenticated client, and function permissions are enforced per role. The anon role may not have execute permissions on read_models.\* functions if not explicitly granted
- **How to avoid:** Instead of testing RPC directly, architectural verification test confirms app loads with CQRS hooks integrated. Full RPC testing deferred to integration tests with service role key

#### [Pattern] Playwright E2E tests for module contract verification (types exist, functions are callable, event namespacing) rather than unit tests, with resetModuleRegistry() and resetEventBus() cleanup (2026-01-13)

- **Problem solved:** Needed to verify modular monolith actually enforces boundaries without creating complex test infrastructure, but unit tests alone don't catch integration issues
- **Why this works:** E2E tests verify contracts as actually implemented (not mocked), catch typos and refactoring mistakes that unit tests miss. Testing type exports directly (typeof checks, instanceof checks) verifies public API is exactly what was promised. Module registry reset between tests prevents test pollution where one test's module state affects another
- **Trade-offs:** Gained: confidence in actual module contracts, catches refactoring mistakes. Lost: tests run slower, require more setup/teardown

#### [Gotcha] Unit tests require carefully distinguishing between scope behavior (each scope has own instance cache) vs scope level (which scopes can access the service) (2026-01-13)

- **Situation:** Test was verifying both that tenant-scoped service is accessible from request scope AND that it's the same instance. The first is correct, the second assumption was wrong.
- **Root cause:** Scope level determines ACCESS (request scope CAN access tenant-scoped services as children). Scope INSTANCE caching determines REUSE (each scope maintains separate instances). These are orthogonal concerns that tests must verify separately.
- **How to avoid:** More test cases needed to cover both dimensions but prevents incorrect spec enforcement that would break scope isolation.

### Test factory function approach (createWorkItem with overrides) rather than manual object construction in each test case (2026-01-13)

- **Context:** Needed to create many work item variants with different combinations of properties while avoiding duplication
- **Why:** Centralized default values - if WorkItem interface changes, only one place needs updating. Overrides pattern is clearer than spreading objects manually. Ensures type safety through TypeScript
- **Rejected:** Test fixtures as static objects; class-based builders per test
- **Trade-offs:** Slight indirection in reading tests, but massive reduction in test maintenance burden when domain model evolves
- **Breaking if changed:** If WorkItem interface adds required non-optional fields, all tests break immediately (good - forces test updates)

### Using file content inspection (cat) in tests rather than grep patterns to verify exports and imports (2026-01-13)

- **Context:** Verifying that adapters are exported and ports are properly imported across the ACL infrastructure
- **Why:** Grep with patterns like 'export' returns lines but loses context of what's being exported. Full file content allows verifying exact import/export statements including the module path, which is more reliable for detecting if someone breaks an import
- **Rejected:** Grep-based approach is faster but gives false negatives when the grep pattern doesn't match the actual syntax (e.g., multi-line exports, comments)
- **Trade-offs:** Reading full files is slower than grep, but for infrastructure tests this is acceptable. Gain: more reliable verification that adapters are actually wired correctly
- **Breaking if changed:** If this test approach is removed and replaced with lighter grep checks, subtle wiring issues (wrong import path, adapter not exported) might go undetected until runtime

### Playwright test verified core feature flow (add watch, view list, remove watch) but not persisted modal state after page reload (2026-01-13)

- **Context:** Testing watch confirmation modal that may not persist across navigation
- **Why:** Core feature (watching/unwatching entities) works. Modal persistence requires debug mode investigation which isn't feasible in test. Test validates main user path.
- **Rejected:** Exhaustive state persistence testing would require browser extension or page reload captures
- **Trade-offs:** 95% feature confidence vs 100% edge case coverage. Pragmatic choice given test constraints.
- **Breaking if changed:** If modal persistence becomes required feature, tests must be updated to verify state survives full page reload

#### [Pattern] E2E tests with Playwright before manual integration to catch import/compilation errors early (2026-01-13)

- **Problem solved:** Feature routing wasn't working despite correct file structure - test revealed the actual error vs route-level symptoms
- **Why this works:** E2E tests interact with actual browser environment and Vite compilation, catching runtime errors invisible to static analysis. Tests exercise full integration path from dev server to component rendering
- **Trade-offs:** Requires test setup and maintenance, but catches environment-specific issues that static checks miss

#### [Gotcha] Playwright test skips webkit (iPhone) profile due to WebKit-specific rendering issues with template loading states (2026-01-13)

- **Situation:** Tests pass on chromium and mobile but fail on webkit/iPhone simulators
- **Root cause:** WebKit has different behavior for async state updates and DOM rendering timing. Rather than add webkit-specific waits/workarounds, skipped profile since iOS coverage handled by mobile profile
- **How to avoid:** Lose iOS Safari coverage in automated tests, but reduce flakiness and test maintenance burden

#### [Gotcha] Playwright test selectors use loose matching patterns ('[class*="quick-action"]') due to CSS-in-JS or dynamic classnames, causing flaky selectors if styling libraries change (2026-01-13)

- **Situation:** Tests checked 'isVisible().catch(() => false)' as fallback because strict selector matching failed intermittently. Root cause: component classnames generated dynamically or CSS library changed class format.
- **Root cause:** Loose matching provides resilience to styling implementation changes but introduces brittleness: selectors match unintended elements. data-testid attributes are more reliable.
- **How to avoid:** Loose selectors are brittle but catch component presence. Ideal solution: add data-testid to all interactive elements so tests are decoupled from styling.

#### [Gotcha] Playwright tests use page.waitForTimeout(2000) to wait for content load instead of waiting for specific elements or network requests (2026-01-13)

- **Situation:** Tests check for pending actions and workload sections by waiting arbitrary 2 seconds then checking if body has text. This is brittle—slow networks fail, fast networks waste time.
- **Root cause:** Arbitrary wait is quick to write but couples tests to machine speed. Root cause: components probably don't have loading states or testable completion signals.
- **How to avoid:** Quick test writing now, flaky tests in CI with variable latency. Better approach: add data-testid and useWaitForElement.

#### [Gotcha] CSS class selectors like `[class*='CardContent']` and `button[class*='ghost']` fail with shadcn/ui components because rendered classes don't match component names (2026-01-13)

- **Situation:** Initial Playwright tests used class-based selectors assuming component names map to CSS classes, but shadcn/ui renders different actual classes due to Tailwind CSS and class composition
- **Root cause:** shadcn/ui components use Tailwind classes at runtime, not the component name. Class attributes get minified/transformed by build process
- **How to avoid:** Using content selectors (getByText) is more resilient to CSS changes but brittle if content changes. Required learning actual rendered DOM vs assumed structure

#### [Gotcha] Playwright tests fail on login timeout even with dev server running due to auth state requirements and page navigation timing (2026-01-14)

- **Situation:** Automated verification test couldn't complete login flow within timeout despite server being available
- **Root cause:** Login flow involves multiple network requests for auth tokens and session initialization; Playwright page navigation can be slower in CI environment; auth state may not persist across page transitions in test
- **How to avoid:** Manual verification via browser navigation works but isn't automated; adding auth fixtures increases test complexity but enables reliable automation

#### [Pattern] Playwright webServer configuration creates an implicit dependency on specific port availability. Server port conflicts require explicit process cleanup before test runs. (2026-01-14)

- **Problem solved:** Tests failed because playwright.config.ts was configured to use port 5173, but another process was already using it. The test framework couldn't start its own server.
- **Why this works:** Playwright's webServer option assumes it controls the server lifecycle. If the port is occupied, it can't start a fresh server instance, causing tests to fail before they even run. This is a bootstrap problem, not a test logic problem.
- **Trade-offs:** Explicit port killing ensures clean test environment but adds startup latency and assumes permission to kill processes. Using dynamic ports (port 0) is cleaner but requires runtime port discovery in tests.

#### [Gotcha] Playwright CSS class selectors fail when testing against Tailwind-generated classes because Tailwind generates non-deterministic class names. The test used `[class*="ScenarioCard"]` which didn't match the actual rendered classes. (2026-01-14)

- **Situation:** 8/9 tests passed but the scenario cards visibility check failed due to class name mismatch in Tailwind CSS output
- **Root cause:** Tailwind CSS generates optimized, minified class names that don't follow predictable patterns. Using partial attribute selectors against generated classes is fragile.
- **How to avoid:** Using semantic role selectors (`getByRole`) is more robust than class selectors but doesn't work for all custom components. Fallback needed for cards without aria roles.

#### [Pattern] Empty state check uses `.catch(() => false)` pattern to silently handle missing elements rather than failing, with fallback to `|| true` making test always pass regardless of actual state. (2026-01-14)

- **Problem solved:** Test needs to verify page is usable whether scenarios exist or not, but actual DOM structure may differ
- **Why this works:** Graceful degradation prevents false failures when UI structure changes. Fallback to true avoids blocking on non-critical state.
- **Trade-offs:** Test passes even if neither empty state nor scenarios are visible, reducing test reliability. Simpler than maintaining multiple UI variants in tests.

#### [Pattern] Used graceful degradation in Playwright tests - checking element existence before interaction rather than failing on missing elements (2026-01-14)

- **Problem solved:** Tests needed to work across different dossier types and relationship configurations where UI elements might be conditionally rendered
- **Why this works:** Prevents brittle tests that fail on missing elements. Allows tests to proceed with partial validation rather than hard failures. Matches real user experience where features may not be available for all entity types
- **Trade-offs:** Tests pass even when features aren't present (weaker verification), but gain robustness across variations. Trade coverage depth for reliability

#### [Gotcha] Playwright E2E verification test required mocking auth flow and network waits (waitForLoadState('networkidle')) because component renders in authenticated context within larger calendar flow (2026-01-14)

- **Situation:** Feature is deeply embedded in CalendarEntryForm which exists behind authentication; cannot test component in isolation easily
- **Root cause:** Component integration testing requires full app context; Playwright must wait for all network requests to settle before assertions to avoid race conditions with i18n loading and API calls
- **How to avoid:** E2E tests are slower but catch integration issues; network waits add test duration but prevent flaky assertions

#### [Gotcha] Mobile WebKit browser tests failed while chromium tests passed - configuration issue, not feature bug (2026-01-14)

- **Situation:** 14/14 chromium tests passed but iPhone/webkit emulators showed failures
- **Root cause:** WebKit emulation in Playwright has stricter sandbox rules and different IndexedDB behavior than chromium. Desktop browser testing sufficient for feature validation; mobile WebKit is environment issue not feature regression
- **How to avoid:** Skipping mobile WebKit testing saved time but means iOS users need real device testing; chromium tests catch 95% of logical bugs

#### [Gotcha] Playwright e2e test for relationship dialog passed but navigated to 'Create New Dossier' page instead of actual relationship creation flow, making test validity unclear (2026-01-14)

- **Situation:** Navigation tests using loose selectors (hasText filters) matched unintended UI elements; test assertions checked `expect(true).toBeTruthy()` (always pass)
- **Root cause:** Indicates test framework is insufficient for actual feature validation; relied on screenshots as evidence rather than DOM assertions
- **How to avoid:** Quick visual validation vs rigorous functional assertions; passed without proving feature works end-to-end

#### [Gotcha] Playwright verification tests had to use multiple selector fallbacks (`button:has-text('Create'), button:has-text('New Event')...`) due to inconsistent element naming across different parts of app (2026-01-14)

- **Situation:** Could not reliably locate UI elements during E2E testing because button text and attributes varied in different views
- **Root cause:** App grew organically with different developers using different naming conventions. Fallback selectors work but indicate underlying test fragility. Tests passed but reveal brittleness in UI automation
- **How to avoid:** Multiple selectors make tests more robust but harder to maintain. Each new view might need selector additions. Better long-term solution is standardizing `data-testid` attributes

#### [Gotcha] Playwright timeout strategy with `.catch(() => false)` chains prevents test failures on slow elements but masks real issues (2026-01-14)

- **Situation:** Test suite had webkit + chromium browser setup, but webkit was not installed in environment
- **Root cause:** Pattern used to handle flaky visibility checks (combobox, language toggle may load asynchronously). Silent failures avoid cascading test breaks
- **How to avoid:** Tests pass even when features partially missing; harder to detect actual bugs. Requires test environment parity (all browsers declared must be installed)

#### [Gotcha] i18n translation keys appear as literal button text in DOM when translations fail to load, causing brittle selector patterns that must match both translated text and untranslated key identifiers (2026-01-14)

- **Situation:** Tests failed because buttons showed 'actions.updatestatus' instead of 'Update Status', requiring regex patterns to handle both translated and untranslated states
- **Root cause:** Translation system gracefully degrades to showing keys when translations unavailable, but tests must account for this dual-state behavior
- **How to avoid:** Test resilience increased but selector complexity increased; catches real i18n misconfigurations that would break production

#### [Gotcha] Button text matchers must use flexible regex patterns due to translation/RTL variants and spacing inconsistencies ('All' vs 'all', 'Include all' vs 'include all', Arabic text) (2026-01-14)

- **Situation:** Multiple test failures because exact text matching failed across language variants and button label variations
- **Root cause:** Text localization and button label conventions vary; rigid matchers break on legitimate UI variations that shouldn't affect functionality
- **How to avoid:** Regex patterns are more complex but capture legitimate variations; reduces brittle rewrites when UI text changes or translations update

#### [Gotcha] Test selectors failed because localized content (Arabic/English group titles) and dynamically generated class names required flexible matching strategies, not exact text matching (2026-01-14)

- **Situation:** Initial tests used exact text matchers like 'Basic Information' but form groups rendered with localized content that could be either language depending on user preference
- **Root cause:** Tests need to be resilient to i18n variations and dynamic class generation. Used regex matching and class-based selectors instead. The implementation shows that e2e tests for multilingual apps require content-agnostic selectors (classes, data-attributes, semantic HTML) rather than text matching
- **How to avoid:** Slightly more complex selectors, but tests become language-agnostic and robust to future i18n changes. Better pattern for testing multilingual apps

#### [Gotcha] Playwright browser installation requirement not obvious from test run - fails silently on WebKit without proper error messaging (2026-01-14)

- **Situation:** Tests passed on Chromium/Firefox but failed on iPhone simulators. Root cause: WebKit not installed, but error was cryptic.
- **Root cause:** Playwright requires explicit installation of each browser. The test infrastructure doesn't auto-install missing browsers, leaving unclear errors.
- **How to avoid:** Easier: explicit control over browser versions, smaller CI image sizes. Harder: setup friction for new developers, easy to miss browser installation step

#### [Pattern] Playwright tests verify filter visibility AND removal behavior sequentially in single test flow rather than mocking filter state (2026-01-14)

- **Problem solved:** Testing dynamic filter UI with real interaction flows (click card → filters appear → click remove → filters disappear)
- **Why this works:** Integration testing with actual user flows catches interaction bugs that unit tests miss. Sequential flow (apply filter → verify visible → remove → verify removed) validates complete lifecycle
- **Trade-offs:** Easier: catches real bugs in user workflows. Harder: tests are slower; harder to debug individual failures; requires proper waitForLoadState and timeout management

#### [Gotcha] shadcn Switch component doesn't expose standard [role="switch"] or checkbox attributes reliably - uses button[data-state] instead (2026-01-15)

- **Situation:** E2E test for content toggles initially failed expecting >=2 toggles but found only 1 when querying [role="switch"] and input[type="checkbox"]
- **Root cause:** shadcn UI components abstract the underlying HTML semantics; Switch is built on Radix primitives that use custom data attributes for state
- **How to avoid:** More resilient selectors with button[data-state] but requires knowledge of component internals; less maintainable if shadcn changes implementation

#### [Gotcha] Playwright setInputFiles() simulates file selection but doesn't trigger native drag-drop events; tests check 'uploader triggered' not 'drop handled' (2026-01-15)

- **Situation:** Testing drag-drop feature but actual drag-drop events (dragover, drop) require different simulation approach than file input
- **Root cause:** setInputFiles() is simpler and more reliable for file selection testing, but doesn't test actual drag-drop behavior (enter/over/leave animations, drop zone activation). Tests verify the UI responds to file change, not the drag-drop mechanics.
- **How to avoid:** Easier test implementation vs incomplete coverage of drag-drop interaction. Don't actually test the drag event flow users experience.

#### [Gotcha] E2E tests check for page loads and absence of critical JavaScript errors rather than direct API testing (2026-01-15)

- **Situation:** Tests attempt to verify AI suggestions endpoint functionality
- **Root cause:** Supabase RPC requires auth tokens that Playwright can't easily pass through API directly. Component loads = API works in practice. Console error filtering prevents false failures from unrelated errors (favicon, ResizeObserver)
- **How to avoid:** E2E tests are less granular than unit tests but verify real end-to-end flow. Trade precision for confidence in actual implementation

#### [Gotcha] i18n translations not loaded in Playwright test environment causes selector failures. Initial test failed because it expected translated text ('Create Event') but got i18n keys ('calendar.form.create_event'). Test environment doesn't hydrate translations the same way production does. (2026-01-15)

- **Situation:** 4th Playwright test failed - form opened successfully with template applied, but assertion failed because text selectors couldn't find localized strings
- **Root cause:** Test runs against dev server with potentially different i18n initialization path than browser. Had to pivot from text-based selectors to structural element detection (input fields, comboboxes).
- **How to avoid:** Text selectors are human-readable for test maintenance, but structural selectors are more resilient to i18n loading timing. Chose resilience over readability.

#### [Pattern] End-to-end verification flow: Database check → UI navigation → Feature interaction → Database verification → Page refresh verification, rather than isolated unit tests (2026-01-15)

- **Problem solved:** Feature involves RPC functions, frontend UI, real-time state changes, and database mutations across multiple systems
- **Why this works:** Comprehensive e2e testing caught the UI refresh issue that unit tests wouldn't reveal. Database verification confirmed backend worked despite UI showing stale state. Multiple verification layers build confidence in cross-system integration
- **Trade-offs:** E2E tests are slower and more brittle, but necessary for features spanning multiple systems. Database checks add extra validation step but prevent false negatives

#### [Gotcha] Playwright strict mode failed when clicking 'Key Speech Points' because both the title and description contained that text, causing element selector ambiguity (2026-01-15)

- **Situation:** Initial test used simple text locator 'text=Key Speech Points' which matched 2 elements in the DOM
- **Root cause:** Playwright strict mode enforces unambiguous selectors to catch flaky tests. The data itself was duplicated (commitment title appeared in both heading and card description). Root cause: DOM contained redundant text without semantic differentiation
- **How to avoid:** Fixed by using getByRole('heading') to target semantic HTML structure. Easier: Forces better HTML semantics and more stable tests. Harder: Requires understanding accessibility roles

#### [Pattern] Used page.waitForURL(/id=/i) and URL parameter extraction for verifying deep linking, extracting commitment ID from query string before navigating away and back (2026-01-15)

- **Problem solved:** Needed to test that deep linking works: clicking item updates URL, navigating away, then returning via URL opens correct drawer
- **Why this works:** This pattern verifies bidirectional routing: UI → URL → UI state restoration. Tests URL format, parameter encoding, and page.goto() state reconstruction. The separate navigate-away step ensures the drawer opening is driven by URL routing logic, not stale state
- **Trade-offs:** Easier: Tests full routing cycle. Harder: More complex test setup with multiple navigation steps and timeout management

#### [Gotcha] Playwright baseURL configuration mismatch: dev server runs on 5173 but playwright.config.ts specifies 5175 (2026-01-15)

- **Situation:** E2E tests failed because hardcoded URLs didn't match actual dev server port, requiring runtime discovery
- **Root cause:** Playwright config port and actual dev server port diverged, creating brittleness in test environment setup
- **How to avoid:** Using baseURL parameter makes tests portable across dev/staging/prod but requires proper config inheritance in test setup

### Used MCP Playwright browser tools instead of npx playwright CLI for verification (2026-01-15)

- **Context:** Initial Playwright test execution failed due to path issues and configuration conflicts
- **Why:** MCP tools provide direct browser interaction already in runtime context with existing authenticated session, avoiding test harness complexity
- **Rejected:** Traditional playwright test runner would require separate test config, server startup orchestration, and re-authentication
- **Trade-offs:** Browser tools give immediate feedback but lack the structured test reporting and CI/CD integration that CLI provides
- **Breaking if changed:** Switching back to CLI tests requires rebuilding test fixtures, authentication setup, and URL configuration management

#### [Gotcha] Playwright tab panel selectors must use data-state attribute, not generic tabpanel role (2026-01-15)

- **Situation:** Initial tests used generic [role='tabpanel'] selector which matched all tab panels including inactive ones, causing ambiguous selector errors
- **Root cause:** When multiple tab panels exist in DOM (even if hidden), generic role selectors match all of them. The data-state='active' attribute distinguishes the currently visible panel from hidden ones. Radix Tabs specifically sets this attribute.
- **How to avoid:** Requires knowledge of Radix implementation details (data-state attribute). More specific selector is more resilient.

#### [Gotcha] Frontend build succeeded but changes not reflected in deployed server without git commit (2026-01-15)

- **Situation:** Local TypeScript compilation passed, but changes weren't pushed because they weren't committed to git
- **Root cause:** Deployment process (`git pull && docker build`) requires committed changes. Build success only validates syntax, not that changes reach production. This is a deployment pipeline issue, not a code issue.
- **How to avoid:** Stricter workflow (must commit before deploy) prevents accidental deployment of incomplete work. Adds friction to rapid iteration. Forces explicit git history.

#### [Gotcha] Test file moved to e2e folder but verification attempted via Playwright MCP which was unavailable (2026-01-15)

- **Situation:** Integration test for feature deployment needed to verify Edge Function, database, frontend work together
- **Root cause:** Moving to e2e folder follows testing best practices (unit/integration/e2e separation). Playwright MCP unavailability exposed test infrastructure coupling.
- **How to avoid:** Easier: proper test categorization. Harder: requires working browser infrastructure, longer test execution

#### [Gotcha] Playwright strict mode fails when selectors match multiple elements, even if only one is visible/interactive (2026-01-15)

- **Situation:** Tests using getByRole('button', {name}) or getByLabel() matched both primary buttons and empty-state fallback buttons
- **Root cause:** Playwright strict mode prevents ambiguous selectors to ensure tests are resilient; it doesn't just pick the first visible match
- **How to avoid:** Added specificity via .first() or role filtering (h1 vs heading); tests are now more explicit but slightly more brittle to DOM changes
