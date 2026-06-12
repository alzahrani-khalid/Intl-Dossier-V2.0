import { describe, expect, it } from 'vitest'
import { getDossierDetailPath } from './dossier-routes'

describe('getDossierDetailPath', () => {
  it.each([
    ['country', '/dossiers/countries/id-1'],
    ['organization', '/dossiers/organizations/id-1'],
    ['person', '/dossiers/persons/id-1'],
    ['engagement', '/dossiers/engagements/id-1'],
    ['forum', '/dossiers/forums/id-1'],
    ['working_group', '/dossiers/working_groups/id-1'],
    ['topic', '/dossiers/topics/id-1'],
    ['elected_official', '/dossiers/elected-officials/id-1'],
  ])('maps %s dossiers to their detail route', (type, expectedPath) => {
    expect(getDossierDetailPath('id-1', type)).toBe(expectedPath)
  })

  it.each([
    [undefined, '/dossiers/countries/id-1'],
    ['unmapped_type', '/dossiers/countries/id-1'],
  ])('falls back to country detail routes for %s', (type, expectedPath) => {
    expect(getDossierDetailPath('id-1', type)).toBe(expectedPath)
  })
})
