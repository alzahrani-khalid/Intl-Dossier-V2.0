# Quickstart Guide: Dossier UI Polish - Mobile, RTL & Accessibility

**Feature**: 034-dossier-ui-polish
**Branch**: `034-dossier-ui-polish`
**Date**: 2025-01-04

## Overview

This guide provides instructions for testing and validating the UI polish work across all 6 dossier detail pages for RTL support, mobile responsiveness, and accessibility compliance.

## Prerequisites

### Development Environment

```bash
# Ensure you're on the correct branch
git checkout 034-dossier-ui-polish

# Install dependencies
cd frontend && pnpm install

# Start development server
pnpm dev
```

### Test Dependencies

The following are already installed in the project:

- **Playwright**: E2E and visual testing
- **@axe-core/react**: Accessibility scanning
- **Vitest**: Unit testing

## Test Execution

### 1. RTL Testing (Arabic Language)

#### Manual Testing

1. Open the app in browser: `http://localhost:5173`
2. Switch language to Arabic using the language selector
3. Verify for each dossier type:
   - `/dossiers/countries/{id}` - Country detail
   - `/dossiers/organizations/{id}` - Organization detail
   - `/dossiers/persons/{id}` - Person detail
   - `/dossiers/engagements/{id}` - Engagement detail
   - `/dossiers/forums/{id}` - Forum detail
   - `/dossiers/working-groups/{id}` - Working group detail

#### RTL Checklist

- [ ] HTML `dir="rtl"` is set on document
- [ ] Sidebar appears on the right side
- [ ] Breadcrumbs read right-to-left
- [ ] All text aligns to start (right in RTL)
- [ ] Directional icons (chevrons, arrows) are flipped
- [ ] Form labels appear to the right of inputs
- [ ] Modal/drawer animations slide from correct direction
- [ ] Mixed Arabic/English text renders correctly

#### Automated RTL Tests

```bash
# Run RTL-specific tests
cd frontend
pnpm test:e2e -- --grep "rtl"

# Or run specific RTL test file
npx playwright test tests/e2e/dossier-rtl-complete.spec.ts
```

### 2. Mobile Responsiveness Testing

#### Manual Testing

Use browser DevTools to test at these viewports:

| Device            | Width | Height |
| ----------------- | ----- | ------ |
| iPhone SE         | 320px | 568px  |
| iPhone 12         | 375px | 812px  |
| iPhone 14 Pro Max | 414px | 896px  |
| Tablet            | 768px | 1024px |

#### Mobile Checklist

- [ ] No horizontal overflow (no horizontal scrollbar)
- [ ] Touch targets are at least 44x44px
- [ ] Content stacks vertically on narrow screens
- [ ] Text is readable without zooming
- [ ] Tables scroll horizontally within their container
- [ ] Collapsible sections expand/collapse correctly
- [ ] Navigation is accessible via hamburger menu

#### Automated Mobile Tests

```bash
# Run mobile viewport tests
cd frontend
npx playwright test tests/e2e/dossier-mobile-complete.spec.ts

# Run with specific viewport
npx playwright test --project=mobile
```

### 3. Accessibility Testing

#### Automated axe-core Scan

```bash
# Run accessibility tests
cd frontend
npx playwright test tests/a11y/

# Run with verbose output
npx playwright test tests/a11y/ --reporter=html
```

#### Manual Accessibility Testing

1. **Keyboard Navigation**:
   - Press Tab through the entire page
   - All interactive elements should be reachable
   - Focus indicators should be visible

2. **Screen Reader Testing**:
   - Use VoiceOver (Mac) or NVDA (Windows)
   - Navigate through headings (h1, h2, h3)
   - Verify collapsible sections announce their state

3. **Color Contrast**:
   - Use browser DevTools or axe DevTools extension
   - Check contrast ratio meets WCAG AA (4.5:1 for text, 3:1 for large text)

#### Accessibility Checklist

- [ ] Zero critical axe-core violations
- [ ] Zero serious axe-core violations
- [ ] All images have alt text
- [ ] Form fields have associated labels
- [ ] Headings are in logical order (h1 → h2 → h3)
- [ ] Focus indicators meet contrast requirements
- [ ] ARIA attributes are correct on collapsible sections

### 4. Performance Testing

#### Manual Performance Check

1. Open browser DevTools → Performance tab
2. Record page load
3. Verify:
   - Initial render < 1 second
   - No jank during scroll (60fps)
   - Section expand/collapse < 300ms

#### React DevTools Profiler

1. Install React DevTools browser extension
2. Open Profiler tab
3. Record interactions
4. Check for unnecessary re-renders

### 5. Combined Testing (RTL + Mobile + A11y)

For comprehensive testing, use the combined test files:

```bash
# Run combined RTL + Mobile tests (all 6 dossier types at 3 mobile viewports)
cd frontend
npx playwright test tests/e2e/dossier-rtl-mobile.spec.ts

# Run combined RTL + Accessibility tests (WCAG AA in Arabic)
npx playwright test tests/a11y/dossiers-rtl-a11y.spec.ts

# Run all polish-related tests
npx playwright test tests/e2e/dossier-rtl-complete.spec.ts \
                    tests/e2e/dossier-mobile-complete.spec.ts \
                    tests/e2e/dossier-rtl-mobile.spec.ts \
                    tests/a11y/dossiers-a11y.spec.ts \
                    tests/a11y/dossiers-rtl-a11y.spec.ts

# Run all tests with HTML report
npx playwright test tests/e2e/dossier-*.spec.ts tests/a11y/*.spec.ts --reporter=html
```

### Test File Summary

| File                              | Coverage                               |
| --------------------------------- | -------------------------------------- |
| `dossier-rtl-complete.spec.ts`    | RTL layout for all 6 dossier types     |
| `dossier-mobile-complete.spec.ts` | Mobile viewports (320px, 375px, 414px) |
| `dossier-rtl-mobile.spec.ts`      | Combined RTL + Mobile tests            |
| `dossiers-a11y.spec.ts`           | WCAG AA accessibility                  |
| `dossiers-rtl-a11y.spec.ts`       | Combined RTL + WCAG AA accessibility   |

## Test Data

### Test Dossier IDs

Use these test IDs for consistent testing (or create new test records):

```typescript
const testIds = {
  country: 'test-country-001',
  organization: 'test-org-001',
  person: 'test-person-001',
  engagement: 'test-engagement-001',
  forum: 'test-forum-001',
  workingGroup: 'test-wg-001',
};
```

### Test User Credentials

For authenticated testing:

- **Email**: kazahrani@stats.gov.sa
- **Password**: itisme

## Validation Criteria

### Pass Criteria

| Category    | Metric               | Target     |
| ----------- | -------------------- | ---------- |
| RTL         | Layout breaks        | 0          |
| Mobile      | Horizontal overflow  | 0 pages    |
| Mobile      | Touch targets < 44px | 0 elements |
| A11y        | Critical violations  | 0          |
| A11y        | Serious violations   | 0          |
| Performance | Initial render       | < 1s       |
| Performance | Section expand       | < 300ms    |

### Test Reports

After running tests, view reports:

```bash
# Playwright HTML report
npx playwright show-report

# Coverage report (if configured)
pnpm test:coverage
```

## Troubleshooting

### Common Issues

1. **RTL not switching**: Check i18next configuration and language detector
2. **Touch targets too small**: Add `min-h-11 min-w-11` to interactive elements
3. **axe violations**: Check the specific violation and remediation URL
4. **Horizontal overflow**: Use `overflow-x-hidden` on container or fix wide elements

### Debug Commands

```bash
# Run tests with debug mode
npx playwright test --debug

# Run single test with trace
npx playwright test --trace on

# View test trace
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests run automatically on PR via GitHub Actions (see `.github/workflows/ci.yml`):

### Test Jobs

| Job               | Description                         | Trigger |
| ----------------- | ----------------------------------- | ------- |
| `test-e2e`        | Full E2E test suite                 | All PRs |
| `test-rtl-mobile` | RTL + Mobile combined tests         | All PRs |
| `test-a11y`       | Accessibility tests (RTL + WCAG AA) | All PRs |

### Workflow Configuration

```yaml
# .github/workflows/ci.yml
test-rtl-mobile:
  name: RTL + Mobile Tests
  runs-on: ubuntu-latest
  needs: [lint]
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.19.0'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium
    - name: Run RTL + Mobile tests
      run: npx playwright test frontend/tests/e2e/dossier-rtl-mobile.spec.ts --reporter=html
      working-directory: ./frontend
    - name: Upload RTL + Mobile test report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: rtl-mobile-report
        path: frontend/playwright-report/
        retention-days: 30

test-a11y:
  name: Accessibility Tests (RTL + WCAG AA)
  runs-on: ubuntu-latest
  needs: [lint]
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.19.0'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium
    - name: Run Accessibility tests
      run: npx playwright test frontend/tests/a11y/ --reporter=html
      working-directory: ./frontend
    - name: Upload Accessibility test report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: a11y-report
        path: frontend/playwright-report/
        retention-days: 30
```

### Artifacts

Test reports are uploaded as artifacts with 30-day retention:

- `playwright-report` - General E2E tests
- `rtl-mobile-report` - RTL + Mobile combined tests
- `a11y-report` - Accessibility tests

## Next Steps

After all tests pass:

1. Create PR with test results
2. Request review from UI/UX team
3. Merge to main branch
4. Deploy to staging for final validation
