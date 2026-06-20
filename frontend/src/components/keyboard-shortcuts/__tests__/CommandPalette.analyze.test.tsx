/**
 * Cmd+K "Analyze:" entry unit tests (RED until plan 71-05, GRAPH-02).
 *
 * Pins the Cmd+K analyze contract (71-UI-SPEC "Cmd+K inline" + RF-6): on a
 * dossier route, an "Analyze:" command pre-fills the current dossier's entity
 * from `location.pathname` (the `cmd-generate-briefing` pathname-regex idiom)
 * and deep-links to the Network panel's Analyze mode at
 * `/relationships/graph?dossierId=<id>&mode=analyze&query=<type>`.
 *
 * Rather than mount the full 1557-line CommandPalette (auth/router/provider
 * heavy), this exercises the unit CommandPalette will consume: a pure helper
 * that derives the analyze command actions (label + deep-link target) from a
 * pathname. 71-05 extracts/implements `getAnalyzeCommandActions` next to
 * CommandPalette and wires the returned actions into its `quickActions` list.
 *
 * EXPECTED RED NOW: `../analyze-commands` does not exist → import fails → suite
 * errors. GREEN when 71-05 adds the helper + the `cmd-analyze-*` entries.
 */

import { describe, it, expect } from 'vitest'

// RED import: the analyze-command helper does not exist yet (built in 71-05).
import { getAnalyzeCommandActions } from '../analyze-commands'

const COUNTRY_ID = '11111111-1111-4111-8111-111111111111'
const DOSSIER_PATHNAME = `/dossiers/countries/${COUNTRY_ID}`

describe('Cmd+K Analyze entries (GRAPH-02)', () => {
  it('surfaces "Analyze:" entries when on a dossier route', () => {
    const actions = getAnalyzeCommandActions(DOSSIER_PATHNAME)

    expect(actions.length).toBeGreaterThan(0)
    for (const action of actions) {
      expect(action.id).toMatch(/^cmd-analyze-/)
      expect(action.label).toMatch(/^Analyze:/)
    }
  })

  it('pre-fills the entity from a /dossiers/countries/ pathname and deep-links to mode=analyze', () => {
    const actions = getAnalyzeCommandActions(DOSSIER_PATHNAME)
    const forumMembership = actions.find((action) => action.queryType === 'forum_membership')

    expect(forumMembership).toBeDefined()
    expect(forumMembership!.deepLink).toContain(`dossierId=${COUNTRY_ID}`)
    expect(forumMembership!.deepLink).toContain('mode=analyze')
    expect(forumMembership!.deepLink).toContain('query=forum_membership')
    expect(forumMembership!.deepLink.startsWith('/relationships/graph?')).toBe(true)
  })

  it('produces no analyze entries off a dossier route (no entity to pre-fill)', () => {
    expect(getAnalyzeCommandActions('/dashboard')).toHaveLength(0)
  })
})
