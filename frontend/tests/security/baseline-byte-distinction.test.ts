// Phase 57 D-22 / D-57-13: hash-comparison meta-test asserting that the
// LTR vs RTL kanban visual baselines diverge byte-wise at each viewport.
//
// Pre-Plan-57-02-Task-3 (host-operator baseline regen still pending): the
// 768 baselines are byte-identical because Phase 52 captured them under the
// broken addInitScript(i18nextLng) language-flip mechanism. This test FAILS
// in that state with an explicit md5 diff in the assertion message so the
// failure mode is unambiguous.
//
// Post-regen: the Plan 57-03 ?lng= URL-param fix (frontend/src/i18n/index.ts
// querystring detector + kanban-visual.spec.ts goto-with-?lng) produces
// byte-distinct LTR vs RTL snapshots and this test PASSES.
//
// Missing baselines: gracefully skips with a clear rationale naming the
// Plan 57-02 Task 3 regen source. This keeps Wave 1 from blocking on Wave 2.
//
// See:
// - .planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-CONTEXT.md D-57-13
// - .planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-02-PLAN.md Task 3

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function resolveRepoRoot(): string {
  if (existsSync(path.resolve(process.cwd(), 'eslint.config.mjs'))) {
    return process.cwd()
  }

  return path.resolve(process.cwd(), '..')
}

function md5(relPath: string): string {
  const abs = path.resolve(resolveRepoRoot(), relPath)
  const buf = readFileSync(abs)
  return createHash('md5').update(buf).digest('hex')
}

const SNAP_DIR = 'frontend/tests/e2e/kanban-visual.spec.ts-snapshots'

const PAIRS = [
  {
    viewport: 1280,
    ltr: `${SNAP_DIR}/kanban-ltr-1280-chromium-darwin.png`,
    rtl: `${SNAP_DIR}/kanban-rtl-1280-chromium-darwin.png`,
  },
  {
    viewport: 768,
    ltr: `${SNAP_DIR}/kanban-ltr-768-chromium-darwin.png`,
    rtl: `${SNAP_DIR}/kanban-rtl-768-chromium-darwin.png`,
  },
] as const

describe('Phase 57 D-22: kanban LTR vs RTL baselines are byte-distinct', () => {
  for (const { viewport, ltr, rtl } of PAIRS) {
    it(`kanban ${viewport} baselines are byte-distinct between LTR and RTL`, (): void => {
      const repoRoot = resolveRepoRoot()
      const ltrAbs = path.resolve(repoRoot, ltr)
      const rtlAbs = path.resolve(repoRoot, rtl)

      // Skip-with-rationale: Wave 2 (Plan 57-02 Task 3) regenerates these on
      // the canonical macOS chromium host. If either file is missing, the
      // operator has not yet run the regen pass — skip gracefully so Wave 1
      // closure is not blocked on the host-side artifact.
      if (!existsSync(ltrAbs) || !existsSync(rtlAbs)) {
        console.warn(
          `[57-03 baseline-byte-distinction] SKIP: missing baseline(s) — ${ltr} or ${rtl}. ` +
            `Plan 57-02 Task 3 regenerates the four kanban-{ltr,rtl}-{1280,768}-chromium-darwin.png ` +
            `baselines on the canonical macOS chromium host; this test resumes coverage post-regen.`,
        )
        return
      }

      const ltrHash = md5(ltr)
      const rtlHash = md5(rtl)
      expect(
        ltrHash,
        `kanban ${viewport} baselines are byte-identical between LTR and RTL: ` +
          `${ltr} md5=${ltrHash} == ${rtl} md5=${rtlHash}. ` +
          `Plan 57-02 Task 3 regenerates these post Plan-57-03 ?lng= URL-param fix.`,
      ).not.toBe(rtlHash)
    })
  }
})
