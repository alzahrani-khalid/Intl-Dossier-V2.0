/**
 * Phase 43 — canonical v6.0 route registry.
 *
 * Single source of truth for cross-cutting QA sweeps (axe / responsive /
 * keyboard / focus-outline). Imported verbatim by every Wave 1 sweep spec
 * so route paths stay in lockstep with the runtime router.
 *
 * Path corrections vs CONTEXT.md "Specifics" (per RESEARCH §3):
 *   - dashboard: '/dashboard' (NOT '/')
 *   - engagements: '/engagements' (NOT '/dossiers/engagements')
 *
 * All 15 routes require auth — sweeps must run `loginForListPages` from
 * `frontend/tests/e2e/support/list-pages-auth.ts` before navigation.
 */

export interface V6Route {
  readonly name: string
  readonly path: string
  readonly requiresAuth: boolean
  readonly locales: readonly ('en' | 'ar')[]
  readonly hasMobileVariant: boolean
}

export const V6_ROUTES: readonly V6Route[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'kanban',
    path: '/kanban',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'calendar',
    path: '/calendar',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'countries',
    path: '/dossiers/countries',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'organizations',
    path: '/dossiers/organizations',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'persons',
    path: '/persons',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'forums',
    path: '/dossiers/forums',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'topics',
    path: '/dossiers/topics',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'working_groups',
    path: '/dossiers/working_groups',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'engagements',
    path: '/engagements',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'briefs',
    path: '/briefs',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'after_actions',
    path: '/after-actions',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'tasks',
    path: '/tasks',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'activity',
    path: '/activity',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  {
    name: 'settings',
    path: '/settings',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
] as const
