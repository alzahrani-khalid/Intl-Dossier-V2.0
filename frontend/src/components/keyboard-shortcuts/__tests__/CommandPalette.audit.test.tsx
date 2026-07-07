/**
 * F25 command-menu audit regression lock (AFF-03).
 *
 * Mirrors CommandPalette.analyze.test.tsx's approach — assert against extracted
 * pure data (the exported `routeContexts` + the analyze-command helper) plus a
 * source scan of CommandPalette.tsx, rather than mounting the provider-heavy
 * 1600-line component or fighting cmdk's hardcoded listbox id.
 *
 * Each assertion (a)-(f) traces to a verified audit finding (87-RESEARCH §F25):
 *   (a) no navigation target uses `?action=` except `/mous?action=create`
 *       (findings 1-5: `?action=create|export` consumed nowhere)
 *   (b) nav-analytics targets `/analytics`      (finding 7: was `/dashboard`)
 *   (c) cmd-view-network targets `/relationships/graph` (finding 6: was a no-op)
 *   (d) create-position + cmd-export-dossiers removed (findings 4, 5)
 *   (e) every routeContexts suggested-action id resolves through the resolver
 *       (finding 9: 8 silently-dropped ids)
 *   (f) the 5 high-value additions exist (Copywriting F25 minimum set + bonus)
 *
 * A future PR reintroducing a dead command target fails this suite.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { routeContexts } from '../CommandPalette'
import { getAnalyzeCommandActions } from '../analyze-commands'

// vitest root is the frontend workspace (process.cwd()); resolve the source
// there rather than from import.meta.url (non-file scheme under the transform).
const source = readFileSync(
  join(process.cwd(), 'src/components/keyboard-shortcuts/CommandPalette.tsx'),
  'utf8',
)

/** Source slice for one command entry: from `id: '<id>'` to the next `id: '`. */
function entryFor(id: string): string {
  const start = source.indexOf(`id: '${id}'`)
  if (start === -1) return ''
  const rest = source.slice(start + `id: '${id}'`.length)
  const next = rest.indexOf("id: '")
  return next === -1 ? rest : rest.slice(0, next)
}

/** Static command ids the palette registers (createActions + quickActions). */
const staticCommandIds = [...source.matchAll(/id: '([a-z-]+)'/g)].map((m) => m[1])

/** Dynamic analyze ids the resolver adds on a dossier route (cmd-analyze-*). */
const analyzeIds = getAnalyzeCommandActions(
  '/dossiers/countries/11111111-1111-4111-8111-111111111111',
).map((a) => a.id)

const resolvableIds = new Set([...staticCommandIds, ...analyzeIds])

/** Pure replica of the CommandPalette contextSuggestions resolver lookup order. */
function resolvesSuggestedAction(actionId: string): boolean {
  if (resolvableIds.has(actionId)) return true // createActions or full quickActions id
  return resolvableIds.has(`nav-${actionId.replace('view-', '')}`) // nav-mapped
}

describe('F25 command-menu audit (AFF-03)', () => {
  it('(a) navigates to no ?action= target except /mous?action=create', () => {
    const actionTargets = [...source.matchAll(/navigateTo\('([^']*\?action=[^']*)'\)/g)].map(
      (m) => m[1],
    )
    expect(actionTargets).toEqual(['/mous?action=create'])
  })

  it('(b) nav-analytics targets /analytics (not /dashboard)', () => {
    const body = entryFor('nav-analytics')
    expect(body).toContain("navigateTo('/analytics')")
    expect(body).not.toContain("navigateTo('/dashboard')")
  })

  it('(c) cmd-view-network targets /relationships/graph', () => {
    expect(entryFor('cmd-view-network')).toContain("navigateTo('/relationships/graph')")
  })

  it('(d) removed dead commands are absent', () => {
    expect(source).not.toContain("id: 'create-position'")
    expect(source).not.toContain("id: 'cmd-export-dossiers'")
  })

  it('(e) every routeContexts suggested-action id resolves through the resolver', () => {
    const unresolved = routeContexts
      .flatMap((ctx) => ctx.suggestedActions)
      .filter((id) => !resolvesSuggestedAction(id))
    expect(unresolved).toEqual([])
  })

  it('(f) the 5 high-value additions are registered', () => {
    for (const id of [
      'create-mou',
      'create-user',
      'create-elected-official',
      'toggle-theme',
      'switch-language',
    ]) {
      expect(source, `missing command id ${id}`).toContain(`id: '${id}'`)
    }
  })
})
