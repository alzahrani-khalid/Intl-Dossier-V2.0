import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { expect, test } from 'vitest'

import {
  buildCorpus,
  checkCorpus,
  corpusRoot,
  formMechanisms,
  inventory,
  parseMatrix,
  producerInputs,
  ruledRoots,
} from './generate-fixtures.mjs'

const identifiers = ['receiver', 'key', 'namespace', 'translator']
const languageForms = [
  'direct-call',
  'destructuring-command-palette-tsx-431-432',
  'aliased-import',
  're-export',
  'property-access',
  'parameter-analytic-result-view-tsx-196-205-261-300',
  'assignment-and-reassignment',
  'shadowing',
]
const formerForms = [
  'direct',
  'aliased-import',
  're-export',
  'destructured',
  'shadowed',
  'out-of-scope',
  'reassigned',
]
const shapePatterns = new Map([
  ['direct-call', [/return useTranslation\([^\n]+\)\.t\(key, runtimeType\)/]],
  [
    'destructuring-command-palette-tsx-431-432',
    [
      /const \{ t \} = useTranslation\(/,
      /const \{ t: tQs \} = useTranslation\(/,
      /return `\$\{plain\}\$\{tQs\(key, runtimeType\)\}`/,
    ],
  ],
  [
    'aliased-import',
    [/import \{ useTranslation as useI18n \}/, /const \{ t \} = useI18n\(/, /return t\(/],
  ],
  [
    're-export',
    [
      /import \{ useTranslation \} from '@\/fixture\/i18n-export'/,
      /export \{ useTranslation \} from/,
    ],
  ],
  ['property-access', [/const translator = useTranslation\([^\n]+\)/, /return translator\.t\(/]],
  [
    'parameter-analytic-result-view-tsx-196-205-261-300',
    [
      /function renderType\(ctx: \{ t: TFn; runtimeType: string \}/,
      /const \{ t, runtimeType \} = ctx; return t\(key, runtimeType\)/,
      /renderType\(\{ t, runtimeType \}, key\)/,
    ],
  ],
  [
    'assignment-and-reassignment',
    [
      /let translate: \(key: string, fallback: string\) => string/,
      /translate = useTranslation\([^\n]+\)\.t\n\s+translate = useTranslation\([^\n]+\)\.t/,
      /return translate\(/,
    ],
  ],
  [
    'shadowing',
    [
      /const \{ t: translate \} = canonicalUseTranslation\(/,
      /\{\n\s+const \{ t: translate \} =/,
      /return translate\(/,
    ],
  ],
])

const snapshot = (root) =>
  Object.fromEntries(
    [...inventory(root)].map(([path, body]) => [
      path,
      body == null ? null : body.toString('base64'),
    ]),
  )

const runGenerator = (root, ...args) =>
  spawnSync(process.execPath, [join(root, 'generate-fixtures.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
  })

const inCopy = (callback) => {
  const temporary = mkdtempSync(join(tmpdir(), 'dynamic-key-corpus-'))
  const clone = join(temporary, 'corpus')
  try {
    cpSync(corpusRoot, clone, { recursive: true })
    return callback(clone)
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

const fixtureSource = (rootName, root = corpusRoot) =>
  [...inventory(join(root, rootName)).values()]
    .filter((body) => body != null)
    .map((body) => body.toString('utf8'))
    .join('\n')

const assertCompleteCrossProduct = (cells) => {
  expect(cells).toHaveLength(identifiers.length * languageForms.length)
  expect(new Set(cells.map(({ identifier, form }) => `${identifier}/${form}`))).toEqual(
    new Set(
      identifiers.flatMap((identifier) => languageForms.map((form) => `${identifier}/${form}`)),
    ),
  )
}

const assertEveryCellDrillsItsForm = () => {
  for (const { form, fixture } of parseMatrix()) {
    const patterns = shapePatterns.get(form)
    expect(patterns, `missing shape oracle for ${form}`).toBeInstanceOf(Array)
    for (const root of [fixture, `${fixture}-control`]) {
      const source = fixtureSource(root)
      for (const pattern of patterns)
        expect(source, `${root} does not drill ${form}`).toMatch(pattern)
    }
  }
}

const assertGeneralityFixturesDrillOppositeProofShapes = () => {
  const membership = readFileSync(
    join(corpusRoot, 'generality-membership/caller.tsx'),
    'utf8',
  )
  const noProof = readFileSync(join(corpusRoot, 'generality-noproof/caller.tsx'), 'utf8')
  expect(membership).toMatch(/const key = DOSSIER_CARD_TYPES\.includes\(runtimeType\)/)
  expect(noProof).toContain('const key = `type.${runtimeType}`')
  expect(noProof).not.toContain('DOSSIER_CARD_TYPES.includes')
  expect(noProof).not.toBe(membership)
}

test("Every named form is drilled by a fixture containing that form's production shape, and the corpus still rebuilds byte-identically into a copy.", () => {
  assertEveryCellDrillsItsForm()
  assertGeneralityFixturesDrillOppositeProofShapes()
  inCopy((clone) => {
    const before = snapshot(clone)
    const result = runGenerator(clone, '--check')
    expect(result.status, result.stderr).toBe(0)
    expect(snapshot(clone)).toEqual(before)
  })
})

test('THE FORM SET IS RE-DERIVED FROM THE LANGUAGE, NOT EXTENDED ROW BY ROW. The existing seven forms are a list of shapes someone thought of, which RULING-P99-274 forbids: a translator reaches a call site through a bounded set of BINDING MECHANISMS the language provides, and the set is derived by enumerating those mechanisms - direct call, destructuring with and without rename, aliased import, re-export, property access, parameter passing, assignment and reassignment, and shadowing - not by appending a row per defect report. Adding an eighth row to the existing seven satisfies neither this truth nor its oracle.', () => {
  const mechanismText = [...formMechanisms.values()].join(' ')
  expect([...formMechanisms.keys()]).toEqual(languageForms)
  expect(formMechanisms.size).toBeGreaterThan(7)
  for (const token of [
    'CallExpression',
    'BindingElement(t)',
    'propertyName=t',
    'ImportSpecifier',
    'ExportSpecifier',
    'PropertyAccessExpression',
    'Parameter(ctx)',
    'establishing a translator',
    'replacing it',
    'shadow',
  ]) {
    expect(mechanismText).toContain(token)
  }
  expect(new Set(parseMatrix().map(({ form }) => form))).toEqual(new Set(languageForms))
  expect(languageForms).not.toEqual(formerForms)
})

test('EVERY CELL DRILLS THE SHAPE ITS NAME CLAIMS, AND THIS IS A REPAIR OF A MEASURED FALSE POSITIVE, NOT A NEW REQUIREMENT. Measured at 2e3f26bad: the matrix carries 4/4 rows naming the destructured form, and 0/4 of their fixture callers drill a renamed translator binding - 3/4 drill the un-renamed const { t } = useTranslation(ns) and 1/4 drills a renamed HOOK, const { useTranslation: factory } = i18n, which renames a different symbol. The matrix NAMED destructuring while drilling only its easy variant, so twenty-eight green cells coexisted with a production shape none of them exercised. A cell whose fixture does not contain the shape its name claims is a false coverage claim and fails this task.', () => {
  assertEveryCellDrillsItsForm()
  const cells = parseMatrix().filter(({ form }) => form.includes('command-palette'))
  expect(cells).toHaveLength(identifiers.length)
  for (const { fixture } of cells) {
    for (const root of [fixture, `${fixture}-control`]) {
      const caller = readFileSync(join(corpusRoot, root, 'caller.tsx'), 'utf8')
      expect(caller).toMatch(/const \{ t \} = useTranslation\(/)
      expect(caller).toMatch(/const \{ t: tQs \} = useTranslation\(/)
      expect(caller).not.toMatch(/const \{ useTranslation:/)
    }
  }
})

test("THE TWO MEASURED PRODUCTION FAILURES ARE DRILLED BY THEIR PRODUCTION SHAPE AND NAMED BY FILE AND LINE, NEVER BY THE WORD RENAME. (1) A renamed destructured translator, const { t: an aliased translator } = useTranslation('quickswitcher'), at the command-palette file named in <context>, lines 431-432 at 2e3f26bad, which the instrument today refuses to classify - it fails CLOSED, so the site is visible but unclassifiable. (2) A parameter-bound translator, where t reaches the call through a function parameter rather than a hook binding, at the analytic-result-view file named in <context>, at 2e3f26bad - which the instrument today drops silently: it fails OPEN, so the site appears in NEITHER counter and lane3Sites reads 11 against a ruled 13. Naming these by the word rename admits a fixture that renames the hook and closes the finding without closing the defect.", () => {
  const commandForm = languageForms.find((form) => form.includes('command-palette'))
  const analyticForm = languageForms.find((form) => form.includes('analytic-result-view'))
  expect(commandForm).toContain('tsx-431-432')
  expect(analyticForm).toContain('tsx-196-205-261-300')
  expect(commandForm).not.toMatch(/rename/i)
  expect(analyticForm).not.toMatch(/rename/i)
  const command = readFileSync(join(corpusRoot, 'translator-destructured/caller.tsx'), 'utf8')
  const analytic = readFileSync(join(corpusRoot, 'translator-arv/caller.tsx'), 'utf8')
  expect(command).toContain("const { t: tQs } = useTranslation('quickswitcher')")
  expect(command).toContain('tQs(key, runtimeType)')
  expect(analytic).toMatch(/function renderType\(ctx: \{ t: TFn;/)
  expect(analytic).toContain('const { t, runtimeType } = ctx; return t(key, runtimeType)')
  expect(analytic).toContain('renderType({ t, runtimeType }, key)')
})

test(`the matrix is a COMPLETE identifier-by-form cross-product with a form set strictly larger than the seven it replaces. DECLARED HANDOFF (RULING-P99-345): re-deriving this corpus to more than seven forms NECESSARILY breaks the committed consumer suite scripts/i18n-dynamic-key-audit.test.mjs, which pins exactly 28 rows over the seven old forms at line 699 and calls assertFixturePair on fixture roots this task renames. That file is NOT in this task's files[] - it belongs to P99-54 - so no in-scope edit can reconcile it, and two review rounds have now failed on exactly that. THIS IS A DESIGNED HANDOFF, NOT A DEFECT IN THIS TASK: the consumer is re-scoped by P99-54, which owns the file. A review finding that the consumer suite is red is therefore EXPECTED for this task and must not block it; a finding that the corpus itself is wrong still must. The worker is not required to make that suite green and must not attempt it by shrinking the cross-product back to seven forms, so appending one row for one defect fails; at least one fixture literally contains const { t: <alias> } = useTranslation(<ns>) and at least one binds a translator through a function parameter, so the two MEASURED production shapes are drilled rather than named; the generator still rebuilds the corpus byte-identically into a COPY with zero drift, so a reproduction check never writes to the artifact it verifies; and the PREDICTED DIFF - not the corpus content - stays within gates.diffCap so the work still reaches the LLM gates (RULING-P99-353, applying the model RULING-P99-292 measured and banked). The old 100000-byte CONTENT ceiling was on the WRONG VARIABLE: diff overhead is per-FILE and path-length dependent, so a content bound buys none of the diff capacity it exists to buy. Measured on the seven-form corpus at 114 files: 82189 bytes of content became a 123177-byte add-diff, an overhead of 359.5 bytes per file - and R292 recorded 414.7 over a different population, which is why this oracle RE-MEASURES rather than carrying either constant. The oracle now measures the corpus add-diff directly, derives overhead-per-file as a DIAGNOSTIC so the worker can see the lever, and gates on the REAL task diff against the 155000 cap. THIS BOUND IS STEERABLE AND THE WORKER OWNS IT: the projection at this overhead is 140671 bytes for eight forms (FITS, 14329 to spare), 158525 for nine and 176019 for ten (both OVER). Nothing in this task requires ten - the assertion is FORMS greater than seven - so the budget is met by choosing the form count, the files per root and the path lengths, and NEVER by shrinking back to the seven forms this task replaces, which remains forbidden. A red here means the corpus does not fit the gate that must read it, which is a real finding and not an instrument fault`, () => {
  const cells = parseMatrix()
  assertCompleteCrossProduct(cells)
  expect(languageForms.length).toBeGreaterThan(7)
  expect(
    cells.some(({ fixture }) =>
      /const \{ t: \w+ \} = useTranslation\(/.test(
        readFileSync(join(corpusRoot, fixture, 'caller.tsx'), 'utf8'),
      ),
    ),
  ).toBe(true)
  expect(
    cells.some(({ fixture }) => {
      const source = readFileSync(join(corpusRoot, fixture, 'caller.tsx'), 'utf8')
      return (
        /function \w+\([^\n]*\bt\b[^\n]*\)/.test(source) &&
        /const \{[^}]*\bt\b[^}]*\} = ctx/.test(source)
      )
    }),
  ).toBe(true)
  inCopy((clone) => {
    const before = snapshot(clone)
    const checked = runGenerator(clone, '--check')
    expect(checked.status, checked.stderr).toBe(0)
    expect(snapshot(clone)).toEqual(before)
  })
})

test('THE CORPUS STAYS MINIMAL AND GENERATED. Every corpus file is produced by the committed generator from the committed matrix, and the generator MAY NOT decide what the corpus contains. The corpus is minimal IN THE TASK DIFF AND IN EVERY COMMIT MADE BY THE ATTEMPT UNDER REVIEW; commits inherited from an EARLIER attempt of the same task are OUT OF SCOPE for that clause, because review-retry appends to the same candidate branch and an earlier commit is immutable to the worker. A minimal corpus sheds FILES, not merely bytes: 922 files, not 15583 lines, is what broke the gate cap in run 0053.', () => {
  const result = checkCorpus()
  expect(result.drift).toEqual([])
  expect(result.actual.size).toBe(result.expected.size)
  const roots = new Set([...result.expected.keys()].map((path) => path.split('/')[0]))
  const named = new Set(result.cells.flatMap(({ fixture }) => [fixture, `${fixture}-control`]))
  expect([...roots].filter((root) => !named.has(root) && !ruledRoots.has(root))).toEqual([])
  expect(inventory(corpusRoot).size).toBeLessThan(922)
  expect([...inventory(corpusRoot).keys()].filter((path) => producerInputs.has(path))).toEqual([
    'FORM-MATRIX.tsv',
    'generate-fixtures.mjs',
    'generate-fixtures.test.mjs',
  ])

  const summary = readFileSync(
    resolve(corpusRoot, '../../../.planning/phases/99-arabic-coverage/99-53-SUMMARY.md'),
    'utf8',
  )
  const files = inventory(corpusRoot)
  const bytes = [...files.values()].reduce((total, body) => total + (body?.byteLength ?? 0), 0)
  const documentedCells = new Set(
    summary
      .split('\n')
      .map((line) => line.split('|').map((field) => field.trim()))
      .filter((fields) => identifiers.includes(fields[1]))
      .map((fields) => `${fields[1]}/${fields[2]}/${fields[3]}`),
  )
  expect(summary).toContain(`Corpus files: ${files.size}`)
  expect(summary).toContain(`Corpus content bytes: ${bytes}`)
  expect(summary).toContain(readFileSync(join(corpusRoot, 'FORM-MATRIX.tsv'), 'utf8').trim())
  for (const { identifier, form, fixture } of result.cells) {
    expect(documentedCells.has(`${identifier}/\`${form}\`/\`${fixture}\``)).toBe(true)
  }

  inCopy((clone) => {
    const matrixPath = join(clone, 'FORM-MATRIX.tsv')
    writeFileSync(
      matrixPath,
      readFileSync(matrixPath, 'utf8').replace(
        'receiver\tdirect-call\treceiver-direct',
        'receiver\tdirect-call\treceiver-direct-copy',
      ),
    )
    const rebuilt = runGenerator(clone)
    expect(rebuilt.status, rebuilt.stderr).toBe(0)
    expect(existsSync(join(clone, 'receiver-direct-copy/caller.tsx'))).toBe(true)
    expect(existsSync(join(clone, 'receiver-direct'))).toBe(false)
    expect(buildCorpus(parseMatrix(clone)).has('receiver-direct-copy/caller.tsx')).toBe(true)
  })
})
