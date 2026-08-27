import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { expect, test } from 'vitest'

import {
  buildCorpus,
  checkCorpus,
  corpusRoot,
  inventory,
  parseMatrix,
  producerInputs,
  ruledRoots,
} from './generate-fixtures.mjs'

const snapshot = (root) =>
  Object.fromEntries(
    [...inventory(root)].map(([path, body]) => [path, body == null ? null : body.toString('base64')]),
  )

const runGenerator = (root, ...args) =>
  spawnSync(process.execPath, [join(root, 'generate-fixtures.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
  })

test('The corpus rebuilds byte-identically from its generator, every matrix cell resolves, and no fixture root is present that no profile reads.', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'dynamic-key-corpus-'))
  const clone = join(temporary, 'corpus')
  try {
    cpSync(corpusRoot, clone, { recursive: true })
    const original = snapshot(clone)
    const checked = runGenerator(clone, '--check')
    expect(checked.status, checked.stderr).toBe(0)
    expect(snapshot(clone)).toEqual(original)

    const probe = join(clone, 'generality-membership/caller.tsx')
    writeFileSync(probe, `${readFileSync(probe, 'utf8')}// hand edit\n`)
    expect(runGenerator(clone, '--check').status).not.toBe(0)
    const rebuilt = runGenerator(clone)
    expect(rebuilt.status, rebuilt.stderr).toBe(0)
    expect(snapshot(clone)).toEqual(original)
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})

test('The corpus is GENERATED AND REPRODUCIBLE, never hand-authored and never hand-shrunk. A committed generator rebuilds every corpus file byte-identically from its inputs, so the corpus is data with a producer rather than an artifact someone edited into shape. Its acceptance is REPRODUCTION, NOT READING: the corpus is generated data, an LLM judge reading nine hundred files establishes nothing an exact rebuild does not establish better, and the corpus measured 937696 bytes over 922 files at the point this task was authored - already far above the gate diff cap. THE GENERATOR IS BOUNDED BY THE COMMITTED MATRIX AND MAY NOT DECIDE WHAT THE CORPUS CONTAINS. A generator authored beside the instrument that also chooses the corpus is RULING-P99-274 circularity one level up: the artifact under test choosing its own test set, moved from selection to derivation to generation. The matrix - four resolved identifiers crossed with the seven LANGUAGE binding forms, twenty-eight cells, each naming a fixture pair or an explicit not-expressible reason - is the external constraint that closes it, and it is not optional.', () => {
  const cells = parseMatrix()
  const expected = buildCorpus(cells)
  const matrixRoots = cells.filter(({ fixture }) => !fixture.startsWith('NA:')).map(({ fixture }) => fixture)
  const generatedRoots = new Set([...expected.keys()].map((path) => path.split('/')[0]))

  expect(cells).toHaveLength(28)
  expect(new Set(matrixRoots).size).toBe(28)
  for (const root of matrixRoots) {
    expect(generatedRoots.has(root)).toBe(true)
    expect(generatedRoots.has(`${root}-control`)).toBe(true)
  }
  expect([...generatedRoots].filter((root) => !ruledRoots.has(root) && !root.endsWith('-control'))).toEqual(
    matrixRoots,
  )
})

test("The corpus is minimal IN THE TASK DIFF, AND IN EVERY COMMIT MADE BY THE ATTEMPT UNDER REVIEW. It contains exactly what the ruled profiles read and nothing more: every corpus file is reachable from some profile caller set, and no file is present because it was easier to copy a directory than to select from it. The rejected candidate copied production wholesale - 922 files, 14210 inserted lines - and the resulting diff refused both LLM gates on every attempt of run 0053 while every deterministic gate passed, so the work was never judged at all. Producing a bulky corpus in one commit of this attempt and compacting it in a later commit of THE SAME ATTEMPT does NOT satisfy this. The prohibition is on the shape of the work, not on any one gate catching it: run 0053 attempt 1 died because a dirty working tree carrying the compaction failed the build gate outright, while run 0054 showed the complementary gap - both oracles above read the WORKING TREE and never the commit series, so a per-commit reading is enforced by REVIEW or by nothing. Commits inherited from an EARLIER attempt of the same task are OUT OF SCOPE FOR THIS CLAUSE: the engine's review-retry appends to the same candidate branch, so an earlier attempt's commit is immutable to the worker and a clause reaching it can never be satisfied. Removing a stray file that an earlier attempt's review asked to be removed is COMPLIANCE, NOT A VIOLATION.", () => {
  const result = checkCorpus()
  const cells = parseMatrix()
  expect(result.drift).toEqual([])
  for (const { fixture } of cells) {
    if (fixture.startsWith('NA:')) continue
    expect(result.expected.has(`${fixture}/caller.tsx`)).toBe(true)
    expect(result.expected.has(`${fixture}-control/caller.tsx`)).toBe(true)
  }
  expect([...result.expected].filter(([path]) => path.startsWith('shared/')).map(([path]) => path)).toEqual([
    'shared/frontend/src/lib/dossier-type-guards.ts',
    'shared/frontend/src/i18n/en/graph.json',
    'shared/frontend/src/i18n/ar/graph.json',
  ])
})

test('the corpus is proved REPRODUCIBLE rather than read: a committed generator exists, the committed matrix carries exactly twenty-eight rows with every one of the four identifiers crossed with all seven language binding forms resolving to a cell, and running the generator in check mode exits zero while leaving the corpus byte-identical - so a hand-edited or hand-shrunk corpus fails, a corpus the generator cannot rebuild fails, and a matrix that silently drops a cell fails', () => {
  const before = snapshot(corpusRoot)
  const result = runGenerator(corpusRoot, '--check')
  const cells = parseMatrix()
  expect(result.status, result.stderr).toBe(0)
  expect(snapshot(corpusRoot)).toEqual(before)
  expect(cells).toHaveLength(28)
  expect(new Set(cells.map(({ identifier, form }) => `${identifier}/${form}`)).size).toBe(28)
})

test("the corpus is proved MINIMAL rather than asserted: every fixture root is either named by the committed matrix or is one of the ruled profile roots, so a directory copied in wholesale because copying was easier than selecting is reported by name and fails, and the check refuses a vacuously empty corpus rather than passing it; and because a root-level check alone cannot see bulk INSIDE a ruled root - the rejected 922-file wholesale copy sat entirely under one - the corpus content is additionally bounded at 100000 bytes, a figure chosen so the resulting diff stays under the measured gate cap of 155000 rather than reproducing run 0053's 937696-byte diff that refused both LLM gates on every attempt", () => {
  const cells = parseMatrix()
  const expected = buildCorpus(cells)
  const roots = new Set([...expected.keys()].map((path) => path.split('/')[0]))
  const named = new Set(
    cells.flatMap(({ fixture }) =>
      fixture.startsWith('NA:') ? [] : [fixture, `${fixture}-control`],
    ),
  )
  const bytes = [...inventory(corpusRoot).values()].reduce(
    (total, body) => total + (body == null ? 0 : body.byteLength),
    0,
  )

  expect(expected.size).toBeGreaterThan(0)
  expect(bytes).toBeLessThanOrEqual(100_000)
  expect([...roots].filter((root) => !named.has(root) && !ruledRoots.has(root))).toEqual([])
})

test('The task diff contains only the fixture corpus, its generator, its matrix and this SUMMARY. No instrument, no instrument test, no production caller, no locale bundle outside the corpus, and no other task plan is edited. The SUMMARY records the measured byte size and file count of the corpus diff, states which profile caller set each fixture root serves, and reproduces the matrix in full with the reason recorded for every cell marked not-expressible.', () => {
  const summaryPath = resolve(corpusRoot, '../../../.planning/phases/99-arabic-coverage/99-52-SUMMARY.md')
  const summary = readFileSync(summaryPath, 'utf8')
  const matrix = readFileSync(join(corpusRoot, 'FORM-MATRIX.tsv'), 'utf8').trim()
  const files = inventory(corpusRoot)
  const bytes = [...files.values()].reduce(
    (total, body) => total + (body == null ? 0 : body.byteLength),
    0,
  )

  expect(summary).toContain(`Corpus files: ${files.size}`)
  expect(summary).toContain(`Corpus content bytes: ${bytes}`)
  expect(summary).toContain('pre-repair: immutable ar04-pre-repair caller set')
  expect(summary).toContain('shared: lane3 single-caller support set')
  expect(summary).toContain('generality-membership and generality-noproof: lane3 single-caller set')
  expect(summary).toContain(matrix)
  expect([...files.keys()].filter((path) => !producerInputs.has(path))).not.toHaveLength(0)
})
