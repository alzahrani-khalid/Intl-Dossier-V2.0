/**
 * Dossier Test Fixtures
 * Feature: 034-dossier-ui-polish
 *
 * Provides consistent test data for all dossier-related E2E tests.
 * Includes fixtures for all 6 dossier types and authentication setup.
 */

// Test user credentials (from CLAUDE.md)
export const testCredentials = {
  email: process.env.TEST_USER_EMAIL!,
  password: process.env.TEST_USER_PASSWORD!,
} as const

// Dossier type definitions
export type DossierType =
  | 'country'
  | 'organization'
  | 'person'
  | 'engagement'
  | 'forum'
  | 'working_group'

// Real seeded dossier IDs from the staging database (the local dev server the
// a11y suite boots points at staging Supabase). Fake fixture IDs render a 404
// page, so axe was scanning the 404 glyph instead of the real dossier — these
// are real rows verified live so the detail routes resolve.
export const testDossierIds: Record<DossierType, string> = {
  country: '9b9a04af-50b0-408c-878d-9d07f77a74ab',
  organization: 'b0000001-0000-0000-0000-000000000006',
  person: 'a0000000-0000-0000-0000-000000000501',
  engagement: 'b0000002-0000-0000-0000-000000000003',
  forum: 'b0000001-0000-0000-0000-000000000003',
  working_group: 'a0000000-0000-0000-0000-000000000403',
} as const

// Route paths for each dossier type. Segments must match the live router
// (getDossierRouteSegment in @/lib/dossier-routes): working_group → working_groups
// (underscore), NOT working-groups (hyphen → 404).
export const dossierRoutes: Record<DossierType, string> = {
  country: '/dossiers/countries',
  organization: '/dossiers/organizations',
  person: '/dossiers/persons',
  engagement: '/dossiers/engagements',
  forum: '/dossiers/forums',
  working_group: '/dossiers/working_groups',
} as const

/**
 * Get the full route path for a specific dossier
 */
export function getDossierRoute(type: DossierType, id?: string): string {
  const basePath = dossierRoutes[type]
  return id ? `${basePath}/${id}` : basePath
}

// Mobile viewport configurations
export const mobileViewports = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 12', width: 375, height: 812 },
  { name: 'iPhone 14 Pro Max', width: 414, height: 896 },
] as const

// Language configurations
export const languages = {
  english: { code: 'en', direction: 'ltr' as const, name: 'English' },
  arabic: { code: 'ar', direction: 'rtl' as const, name: 'العربية' },
} as const

/**
 * All dossier types for iteration in tests
 */
export const allDossierTypes: DossierType[] = [
  'country',
  'organization',
  'person',
  'engagement',
  'forum',
  'working_group',
]

/**
 * Test selectors for common dossier elements
 */
export const testSelectors = {
  // Layout elements
  sidebar: '[data-testid="sidebar"]',
  breadcrumbs: '[data-testid="breadcrumbs"]',
  mainContent: '[data-testid="main-content"]',

  // Dossier-specific
  dossierHeader: '[data-testid="dossier-header"]',
  dossierTitle: '[data-testid="dossier-title"]',
  dossierType: '[data-testid="dossier-type"]',

  // Collapsible sections
  sectionHeader: (index: number) => `[data-testid="section-header-${index}"]`,
  sectionContent: (index: number) => `[data-testid="section-content-${index}"]`,

  // Interactive elements
  chevronRight: '[data-testid="chevron-right"]',
  arrowRight: '[data-testid="arrow-right"]',

  // Forms
  formInput: 'input[type="text"]',
  formLabel: 'label',

  // Tables
  dataTable: '[data-testid="data-table"]',
  tableContainer: '[data-testid="table-container"]',

  // Mixed content (for RTL testing)
  mixedContent: '[data-testid="mixed-content"]',

  // Interactive elements for touch target testing
  interactiveElements: 'button, a, [role="button"], input, select',

  // Card grid (for mobile stacking)
  cardGrid: '[data-testid="card-grid"]',
} as const

/**
 * Axe-core configuration for accessibility testing
 */
export const axeConfig = {
  runOptions: {
    // Target WCAG 2.1 AA compliance
    runOnly: {
      type: 'tag' as const,
      values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    },
  },
  // Impact levels to fail on
  impactLevels: {
    critical: true,
    serious: true,
    moderate: false, // Don't fail on moderate, just report
    minor: false,
  },
} as const

/**
 * Performance thresholds
 */
export const performanceThresholds = {
  initialRenderMs: 1000,
  sectionExpandMs: 300,
  minFps: 60,
} as const

/**
 * Touch target minimum dimensions (WCAG 2.1 Level AAA recommends 44x44px)
 */
export const touchTargetMinSize = {
  width: 44,
  height: 44,
} as const
