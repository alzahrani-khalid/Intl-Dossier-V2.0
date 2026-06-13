/**
 * dossier-routes — mounted Docs-tab path pins (UI-SPEC A-8 / 66-REVIEW CR-01).
 *
 * Engagement dossiers have NO /dossiers/engagements/$id/docs child route —
 * their docs tab is mounted in the engagement workspace at
 * /engagements/$id/docs. Every other dossier type mounts
 * /dossiers/{segment}/$id/docs (segments line-verified against
 * routeTree.gen.ts).
 */
import { describe, it, expect } from 'vitest'
import { getDossierDocsPath } from '../dossier-routes'

describe('getDossierDocsPath', () => {
  it('engagement context → engagement workspace docs tab, never /dossiers/engagements/$id/docs', () => {
    expect(getDossierDocsPath('e-1', 'engagement')).toBe('/engagements/e-1/docs')
  })

  it('normalizes PascalCase engagement input', () => {
    expect(getDossierDocsPath('e-1', 'Engagement')).toBe('/engagements/e-1/docs')
  })

  it.each([
    ['country', '/dossiers/countries/d-1/docs'],
    ['organization', '/dossiers/organizations/d-1/docs'],
    ['forum', '/dossiers/forums/d-1/docs'],
    ['topic', '/dossiers/topics/d-1/docs'],
    ['working_group', '/dossiers/working_groups/d-1/docs'],
    ['person', '/dossiers/persons/d-1/docs'],
    ['elected_official', '/dossiers/elected-officials/d-1/docs'],
  ])('%s → mounted /dossiers/{segment}/$id/docs tab', (type, expected) => {
    expect(getDossierDocsPath('d-1', type)).toBe(expected)
  })
})
