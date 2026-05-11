/**
 * Phase 38 Plan 09 — Task 4: no-placeholder-data + no-legacy-page-import gate.
 *
 * Walks `frontend/src/pages/Dashboard/widgets/` recursively and asserts:
 *
 *   1. ZERO occurrences of the lowercased words `lorem`, `mock`, `fixture`
 *      in production widget source. Test files (under `__tests__/`) are
 *      excluded — they legitimately use vi.mock and Mock<...> from vitest.
 *
 *   2. NO `import` of the legacy `OperationsHub.tsx` page from any dashboard
 *      widget. The operations-hub `hooks/`, `types/`, and `repositories/`
 *      directories are intentionally preserved (Wave 0/1 hooks like
 *      useDashboardStats and useUpcomingEvents still depend on them) — the
 *      assertion only blocks the page module itself.
 *
 * Failure mode: any new placeholder data or accidental legacy-page coupling
 * shows up as a per-file diagnostic so the offending widget is obvious.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const WIDGETS_ROOT = join(__dirname, '..')
const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..')

/** Recursively collect all `.tsx` files under `dir`, excluding `__tests__/`. */
function collectWidgetSources(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === '__tests__') continue
      out.push(...collectWidgetSources(full))
      continue
    }
    if (entry.endsWith('.tsx')) {
      out.push(full)
    }
  }
  return out
}

describe('dashboard widgets — no placeholder data', () => {
  const widgetFiles = collectWidgetSources(WIDGETS_ROOT)

  it('discovers at least one widget source file', () => {
    expect(widgetFiles.length).toBeGreaterThan(0)
  })

  it('contains no `lorem` / `mock` / `fixture` placeholder strings in code', () => {
    // The gate targets placeholder DATA (constants, JSX text, identifiers).
    // Doc comments are stripped before scanning so lines such as
    //   `* T-38-01 — no mock constants; data comes from useWeekAhead only.`
    // remain a useful audit trail without tripping the gate.
    const offenders: Array<{ file: string; word: string; line: number }> = []
    const banned = ['lorem', 'mock', 'fixture'] as const
    for (const file of widgetFiles) {
      const raw = readFileSync(file, 'utf8')
      // Strip /* ... */ block comments (the JSDoc headers atop every widget).
      const noBlock = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      const lines = noBlock.split('\n')
      for (let i = 0; i < lines.length; i += 1) {
        // Strip // line comments per-line.
        const codeOnly = lines[i].replace(/\/\/.*$/, '').toLowerCase()
        for (const word of banned) {
          if (codeOnly.includes(word)) {
            offenders.push({ file: relative(REPO_ROOT, file), word, line: i + 1 })
          }
        }
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([])
  })

  it('does not import the legacy OperationsHub.tsx page', () => {
    // Match any import that targets the page module, both relative and aliased.
    // Note: we deliberately do NOT block `@/domains/operations-hub/hooks/...`
    // or `@/domains/operations-hub/types/...` — those are still wired into
    // useDashboardStats, useUpcomingEvents, KpiStrip, SlaHealth, WeekAhead.
    const offenders: Array<{ file: string; line: number; text: string }> = []
    const importRegex = /from\s+['"][^'"]*OperationsHub['"]/
    for (const file of widgetFiles) {
      const lines = readFileSync(file, 'utf8').split('\n')
      for (let i = 0; i < lines.length; i += 1) {
        if (importRegex.test(lines[i])) {
          offenders.push({ file: relative(REPO_ROOT, file), line: i + 1, text: lines[i].trim() })
        }
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([])
  })
})
