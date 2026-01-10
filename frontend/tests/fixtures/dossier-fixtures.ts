/**
 * Dossier Test Fixtures
 * Feature: 034-dossier-ui-polish
 *
 * Provides consistent test data for all dossier-related E2E tests.
 * Includes fixtures for all 6 dossier types and authentication setup.
 */

// Test user credentials (from CLAUDE.md)
export const testCredentials = {
  email: 'kazahrani@stats.gov.sa',
  password: 'itisme',
} as const

// Dossier type definitions
export type DossierType =
  | 'country'
  | 'organization'
  | 'person'
  | 'engagement'
  | 'forum'
  | 'working_group'

// Test dossier IDs - these should match existing test data in the database
export const testDossierIds: Record<DossierType, string> = {
  country: 'test-country-001',
  organization: 'test-org-001',
  person: 'test-person-001',
  engagement: 'test-engagement-001',
  forum: 'test-forum-001',
  working_group: 'test-wg-001',
} as const

// Route paths for each dossier type
export const dossierRoutes: Record<DossierType, string> = {
  country: '/dossiers/countries',
  organization: '/dossiers/organizations',
  person: '/dossiers/persons',
  engagement: '/dossiers/engagements',
  forum: '/dossiers/forums',
  working_group: '/dossiers/working-groups',
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
