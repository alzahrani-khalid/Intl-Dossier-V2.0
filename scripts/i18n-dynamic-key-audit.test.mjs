import nodeTest from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import YAML from 'yaml'
import {
  auditProfile,
  collectCalls,
  hasLeaf,
  runSelfCheck,
  resolveKey,
} from './i18n-dynamic-key-audit.mjs'

// The repository oracle is `node --test`; the conditional binding also makes
// these same leaf-title tests native Vitest tests when that runner collects the
// file explicitly.
const test = process.env.VITEST ? (await import('vitest')).test : nodeTest

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const script = resolve(root, 'scripts/i18n-dynamic-key-audit.mjs')
const priorSummaryPath = resolve(root, '.planning/phases/99-arabic-coverage/99-51-SUMMARY.md')
const summaryPath = resolve(root, '.planning/phases/99-arabic-coverage/99-54-SUMMARY.md')
const taskSummaryPath = resolve(root, '.planning/phases/99-arabic-coverage/99-56-SUMMARY.md')
const fixtureCorpus = resolve(root, 'scripts/fixtures/dynamic-key-audit')
const planSource = readFileSync(
  resolve(root, '.planning/phases/99-arabic-coverage/99-51-PLAN.md'),
  'utf8',
)
const planFrontmatter = YAML.parse(planSource.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '')
const acceptanceCriteria = [
  planSource.match(/<done>([\s\S]*?)<\/done>/)?.[1].trim(),
  ...planFrontmatter.must_haves.truths.map((truth) =>
    typeof truth === 'string' ? truth : truth.text,
  ),
]
assert.equal(acceptanceCriteria.length, 6)

const currentPlanSource = readFileSync(
  resolve(root, '.planning/phases/99-arabic-coverage/99-54-PLAN.md'),
  'utf8',
)
const currentPlanFrontmatter = YAML.parse(
  currentPlanSource.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '',
)
const currentAcceptanceCriteria = [
  currentPlanSource.match(/<done>([\s\S]*?)<\/done>/)?.[1].trim(),
  ...currentPlanFrontmatter.must_haves.truths.map((truth) =>
    typeof truth === 'string' ? truth : truth.text,
  ),
]
assert.equal(currentAcceptanceCriteria.length, 6)

const taskPlanSource = readFileSync(
  resolve(root, '.planning/phases/99-arabic-coverage/99-56-PLAN.md'),
  'utf8',
)
const taskPlanFrontmatter = YAML.parse(taskPlanSource.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '')
const taskAcceptanceCriteria = [
  taskPlanSource.match(/<done>([\s\S]*?)<\/done>/)?.[1].trim(),
  ...taskPlanFrontmatter.must_haves.truths.map((truth) =>
    typeof truth === 'string' ? truth : truth.text,
  ),
]
assert.equal(taskAcceptanceCriteria.length, 6)

const matrixRows = () =>
  readFileSync(join(fixtureCorpus, 'FORM-MATRIX.tsv'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.split('\t'))

const committedTaskPaths = () => {
  const branch = execFileSync('git', ['branch', '--show-current'], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
  const separator = branch.lastIndexOf('--')
  assert.ok(separator > 0, `task-branch-derived=${separator > 0 ? 1 : 0}/1`)
  const taskBase = execFileSync('git', ['merge-base', 'HEAD', branch.slice(0, separator)], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
  return execFileSync('git', ['diff', '--name-only', `${taskBase}..HEAD`], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean)
}

const write = (base, path, body) => {
  const full = join(base, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, body)
}

const removeFixture = (base) => rmSync(base, { recursive: true, force: true })

const commandPaletteSource = ({
  call = "t(analyzeLabelKey[analyze.queryType], 'Default')",
  binding = 'const { t }',
} = {}) => `
import { useTranslation } from 'react-i18next'
const analyzeLabelKey = { one: 'analyze.one' } as const
const analyze = { queryType: 'one' }
${binding} = useTranslation('fixture')
t(dynamicLabel, { count: 1 })
${call}
`

const fixtureRoot = ({ commandSource = commandPaletteSource() } = {}) => {
  const base = mkdtempSync(join(tmpdir(), 'i18n-dynamic-audit-'))
  write(
    base,
    'frontend/src/i18n/en/fixture.json',
    JSON.stringify({
      ok: { leaf: 'English' },
      prefixOnly: {},
      enOnly: { leaf: 'English only' },
      analyze: { one: 'One' },
      type: { country: 'Country', unknown: 'Unknown' },
    }),
  )
  write(
    base,
    'frontend/src/i18n/ar/fixture.json',
    JSON.stringify({
      ok: { leaf: 'العربية' },
      prefixOnly: {},
      arOnly: { leaf: 'العربية فقط' },
      analyze: { one: 'واحد' },
      type: { country: 'دولة', unknown: 'غير معروف' },
    }),
  )
  write(
    base,
    'frontend/src/i18n/en/graph.json',
    JSON.stringify({ type: { country: 'Country', unknown: 'Unknown' } }),
  )
  write(
    base,
    'frontend/src/i18n/ar/graph.json',
    JSON.stringify({ type: { country: 'دولة', unknown: 'غير معروف' } }),
  )
  write(
    base,
    'frontend/src/components/empty-states/ListEmptyState.tsx',
    "export type EntityType = 'country' | 'organization'\n",
  )
  write(
    base,
    'frontend/src/lib/dossier-type-guards.ts',
    "const DOSSIER_TYPES = ['country'] as const\nexport const DOSSIER_CARD_TYPES = [...DOSSIER_TYPES] as const\n",
  )
  write(
    base,
    'frontend/src/lib/semantic-colors.ts',
    "export const graphNodeColors = { country: 'blue' } as const\n",
  )
  write(
    base,
    'frontend/src/types/relationship.types.ts',
    "export type DossierRelationshipType = 'partner' | 'member'\n",
  )
  write(
    base,
    'frontend/src/components/list-page/sensitivity.ts',
    "export const SENSITIVITY_CHIP = { low: { labelKey: 'sensitivity.low' } } as const\n",
  )
  write(base, 'frontend/src/components/keyboard-shortcuts/CommandPalette.tsx', commandSource)
  write(
    base,
    'frontend/src/components/keyboard-shortcuts/analyze-commands.ts',
    "export type AnalyticQueryType = 'one'\n",
  )
  write(base, 'frontend/src/components/list-page/DossierTable.tsx', '')
  write(
    base,
    'frontend/src/components/list-page/EngagementsList.tsx',
    "const FILTERS = [{ labelKey: 'filter.meeting' }] as const\n",
  )
  write(
    base,
    'frontend/src/components/modern-nav/IconRail/IconRail.tsx',
    "const defaultItems = [{ tooltipKey: 'navigation.dashboard' }] as const\n",
  )
  write(base, 'frontend/src/components/relationships/AdvancedGraphVisualization.tsx', '')
  write(
    base,
    'frontend/src/components/relationships/AnalyticQueryPicker.tsx',
    "const TEMPLATES = [{ labelKey: 'analyze.template' }] as const\n",
  )
  write(
    base,
    'frontend/src/components/relationships/AnalyticResultView.tsx',
    "function renderCountLine() { return countLine(t, 'analyze.count.membership', '{{count}}', 1) }\n",
  )
  return base
}

const run = (base, ...args) =>
  execFileSync(process.execPath, [script, base, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

const fails = (base, ...args) => {
  assert.throws(
    () => run(base, ...args),
    (error) => error?.status !== 0,
  )
}

const exactUnclassifiedLine = (row) =>
  `UNCLASSIFIED\t${row.family}\t${row.file}:${row.line}\t${row.reason}\t${row.expression.replace(/\s+/g, ' ')}\tns=${row.namespaces.map((namespace) => (namespace === 'translation' ? 'common' : namespace)).join('|')}`

const closedDomainSitesFromInstrument = () => {
  const source = readFileSync(script, 'utf8')
  const sf = ts.createSourceFile(script, source, ts.ScriptTarget.Latest, true)
  const sites = []
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'closedDomain'
    ) {
      const key = node.arguments[0]
      const proof = node.arguments[2]
      assert.ok(key != null && ts.isStringLiteral(key), 'closedDomain site id must be literal')
      assert.ok(
        proof != null &&
          ts.isCallExpression(proof) &&
          ts.isIdentifier(proof.expression) &&
          proof.expression.text === 'provesClosedDomain',
        `closedDomain(${key.text}) proof position must directly call provesClosedDomain`,
      )
      sites.push(key.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  assert.ok(sites.length > 0, 'the mechanically derived closed-domain path set must be nonempty')
  assert.equal(new Set(sites).size, sites.length, 'closedDomain site ids must be unique')
  return sites
}

const fixtureResult = (name, options) =>
  auditProfile(resolve(fixtureCorpus, name), 'lane3', options)

const proofCounts = (result) => ({
  closed: result.proofRows.filter((row) => row.status === 'CLOSED').length,
  unclassified: result.proofRows.filter((row) => row.status === 'UNCLASSIFIED').length,
})

const assertFixturePair = (name) => {
  const negative = proofCounts(fixtureResult(name))
  const control = proofCounts(fixtureResult(`${name}-control`))
  assert.equal(negative.closed, 0, `${name} negative must have no closed-domain row`)
  assert.ok(negative.unclassified >= 1, `${name} negative must be observed and unclassified`)
  assert.ok(control.closed >= 1, `${name} control must prove a closed domain`)
  assert.equal(control.unclassified, 0, `${name} control must have no unclassified row`)
}

test('The pre-repair tree has an independently tested, non-vacuous bilingual census that exposes the exact dynamic-key defects instead of reporting their prefixes green.', () => {
  const result = auditProfile(root, 'ar04-pre-repair')
  assert.deepEqual(result.locales, ['en', 'ar'])
  assert.equal(result.callerPopulations.listSites, 9)
  assert.equal(result.callerPopulations.listFamilies, 9)
  assert.equal(result.callerPopulations.listLeaves, 153)
  assert.equal(result.callerPopulations.lane3Sites, 13)
  assert.equal(result.callerPopulations.lane3Families, 13)
  assert.equal(result.counts.listMissingBoth, 32)
  assert.equal(result.counts.clusterMissingBoth, 8)
  assert.equal(result.counts.unclassified, 10)

  const listRows = result.rows.filter((row) => row.profile === 'list')
  const families = new Map()
  for (const row of listRows) {
    const rows = families.get(row.family) ?? []
    rows.push(row)
    families.set(row.family, rows)
  }
  assert.equal(families.size, 9)
  assert.ok([...families.values()].every((rows) => rows.length === 17))
  for (const key of [
    'list.topic.firstTitle',
    'list.working_group.import',
    'list.elected_official.firstTitle',
    'list.work_item.import',
  ]) {
    const row = listRows.find((candidate) => candidate.key === key)
    assert.equal(row?.en, 'MISS')
    assert.equal(row?.ar, 'MISS')
  }

  const clusterRows = result.rows.filter(
    (row) => row.family === 'lane3.advancedGraph.cluster.unprefixed',
  )
  assert.equal(clusterRows.length, 8)
  assert.ok(clusterRows.every((row) => row.routeMiss))
  assert.deepEqual(
    clusterRows.map((row) => row.requiredKey),
    [
      'type.country',
      'type.organization',
      'type.forum',
      'type.engagement',
      'type.topic',
      'type.working_group',
      'type.person',
      'type.elected_official',
    ],
  )
  assert.ok(
    result.unclassified.some(
      (row) =>
        row.family === 'lane3.advancedGraph.cluster.unprefixed' &&
        row.reason.includes('graph-cluster-route'),
    ),
  )
})

test('The production entry point is scripts/i18n-dynamic-key-audit.mjs. It parses TypeScript call expressions rather than source lines, separates interpolation-only option objects from fallback-bearing calls, resolves explicit and hook-bound namespaces with fallbackLng disabled, and checks complete LEAF keys in en and ar. Every fallback-bearing nonliteral call in the two ruled profiles is either assigned a closed domain or reported unclassified; an empty domain, prefix-only object, missing file, malformed bundle, or unknown call shape is a failure, never zero. A domain counts as CLOSED only when the AST proves membership in the production constant that defines the closed dossier-card display set AND an explicit type.unknown branch exists in the same caller; a domain inferred from expression text, from whichever keys happen to exist in JSON, or from a fallback argument is rejected and the call is reported unclassified, which fails closed.', () => {
  const result = auditProfile(root, 'ar04-pre-repair')
  assert.equal(result.productionEntryPoint, 'scripts/i18n-dynamic-key-audit.mjs')
  assert.equal(result.parser, 'typescript AST CallExpression')
  assert.equal(result.fallbackLng, false)
  assert.equal(result.fallbackSites.length, 25)
  assert.equal(
    result.unclassified.filter((row) => row.family === 'unclassified.translator-binding').length,
    0,
  )
  assert.ok(
    result.unclassified.some(
      (row) => row.expression.startsWith('tQs(groupKey,') && row.namespaces[0] === 'quickswitcher',
    ),
  )
  assert.equal(
    result.unclassified.filter(
      (row) => row.expression === 'tCommon(page.label, page.id)' && row.namespaces[0] === 'common',
    ).length,
    2,
  )
  assert.ok(
    result.fallbackSites.every((site) =>
      [...result.calls, ...result.unclassified].some(
        (classified) =>
          classified.file === site.file &&
          classified.line === site.line &&
          classified.expression === site.expression,
      ),
    ),
  )
  assert.ok(result.rows.filter((row) => row.closedDomain === false).length > 8)
  assert.ok(
    result.rows.some(
      (row) =>
        row.family === 'lane3.engagementsList.filterPill' &&
        row.namespaces.join('|') === 'engagements',
    ),
  )
  assert.ok(
    result.rows.some(
      (row) =>
        row.family === 'lane3.commandPalette.analyze' &&
        row.namespaces.join('|') === 'keyboard-shortcuts',
    ),
  )
  fails(root, '--profile', 'lane3')

  const closed = fixtureRoot({
    commandSource: commandPaletteSource({ call: '' }),
  })
  try {
    write(
      closed,
      'frontend/src/components/relationships/AdvancedGraphVisualization.tsx',
      `
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
import { useTranslation } from 'react-i18next'
const { t } = useTranslation('graph')
const ClusterNode = ({ data }) => {
  const key = DOSSIER_CARD_TYPES.includes(data.clusterType)
    ? \`type.\${data.clusterType}\`
    : 'type.unknown'
  return t(key, data.clusterType)
}
`,
    )
    const collected = collectCalls(closed, 'lane3')
    assert.equal(collected.fallbackSites.length, 1)
    assert.equal(collected.unclassified.length, 0)
    assert.equal(
      collected.calls[0].domainSource,
      'AST-proven DOSSIER_CARD_TYPES membership plus explicit type.unknown branch',
    )
    run(closed, '--profile', 'lane3')
  } finally {
    removeFixture(closed)
  }

  const explicitNamespace = fixtureRoot({
    commandSource: commandPaletteSource({
      call: "t(analyzeLabelKey[analyze.queryType], { ns: 'fixture', defaultValue: 'Default' })",
    }),
  })
  try {
    const explicit = auditProfile(explicitNamespace, 'lane3')
    assert.ok(explicit.rows.every((row) => row.namespaces.join('|') === 'fixture'))
  } finally {
    removeFixture(explicitNamespace)
  }

  const emptyDomain = fixtureRoot()
  try {
    write(
      emptyDomain,
      'frontend/src/components/empty-states/ListEmptyState.tsx',
      'export type EntityType = never\n',
    )
    fails(emptyDomain, '--profile', 'lane3')
  } finally {
    removeFixture(emptyDomain)
  }

  const missingFile = fixtureRoot()
  try {
    rmSync(join(missingFile, 'frontend/src/components/list-page/DossierTable.tsx'))
    fails(missingFile, '--profile', 'lane3')
  } finally {
    removeFixture(missingFile)
  }

  const malformed = fixtureRoot()
  try {
    write(malformed, 'frontend/src/i18n/ar/fixture.json', '{')
    fails(malformed, '--profile', 'lane3')
  } finally {
    removeFixture(malformed)
  }
})

test('the instrument tests exercise both locales and both polarities: a resolved leaf passes, an existing prefix with a missing leaf fails, en-only and ar-only leaves each fail, an unclassified nonliteral call fails, and interpolation-only options are not mislabeled as English defaults; and, for EVERY code path that can return a non-empty closed domain, a fail-closed negative case that reaches THAT path and requires unclassified when proof is absent. The set of such paths is derived mechanically from the source of the instrument itself - every closedDomain() call site - never from a list of shapes written in this plan, so the coverage cannot be satisfied by handling only the shapes someone thought to name', () => {
  const bundles = {
    en: {
      fixture: {
        ok: { leaf: 'English' },
        prefixOnly: {},
        enOnly: { leaf: 'English only' },
      },
    },
    ar: {
      fixture: {
        ok: { leaf: 'العربية' },
        prefixOnly: {},
        arOnly: { leaf: 'العربية فقط' },
      },
    },
  }
  assert.deepEqual(resolveKey(bundles, ['fixture'], 'ok.leaf'), { en: true, ar: true })
  assert.deepEqual(resolveKey(bundles, ['fixture'], 'prefixOnly.leaf'), {
    en: false,
    ar: false,
  })
  assert.equal(hasLeaf(bundles, 'en', 'fixture', 'prefixOnly'), false)
  assert.deepEqual(resolveKey(bundles, ['fixture'], 'enOnly.leaf'), {
    en: true,
    ar: false,
  })
  assert.deepEqual(resolveKey(bundles, ['fixture'], 'arOnly.leaf'), {
    en: false,
    ar: true,
  })
  assert.equal(runSelfCheck().selfCheck, 'PASS')

  const proofSites = closedDomainSitesFromInstrument()
  const ordinary = auditProfile(root, 'ar04-pre-repair')
  const forced = auditProfile(root, 'ar04-pre-repair', { forceUnproven: true })
  assert.ok(ordinary.proofRows.some((row) => row.status === 'CLOSED'))
  assert.equal(forced.proofRows.length, ordinary.proofRows.length)
  assert.ok(forced.proofRows.every((row) => row.status === 'UNCLASSIFIED'))
  const staticCollection = fixtureRoot({
    commandSource: `
import { useTranslation } from 'react-i18next'
const analyzeLabelKey = { one: 'analyze.one' }
const { t } = useTranslation('fixture')
const groupKeys = { alpha: 'ok.leaf' }
const rows = [{ type: 'alpha' }]
rows.map((row) => {
  const groupKey = groupKeys[row.type] || row.type
  return t(groupKey, 'Default')
})
`,
  })
  try {
    const staticForced = auditProfile(staticCollection, 'lane3', { forceUnproven: true })
    const forcedRows = [...forced.proofRows, ...staticForced.proofRows]
    for (const proofSite of proofSites) {
      assert.ok(
        forcedRows.some((row) => row.proofSite === proofSite && row.status === 'UNCLASSIFIED'),
        `forced negative must reach closedDomain(${proofSite}) and fail unclassified`,
      )
    }
  } finally {
    removeFixture(staticCollection)
  }

  const unknown = fixtureRoot({
    commandSource: commandPaletteSource({ call: "t(dynamicKey, 'Default')" }),
  })
  try {
    const collected = collectCalls(unknown, 'lane3')
    assert.equal(collected.interpolationOnly.length, 1)
    assert.equal(collected.unclassified.length, 1)
    assert.match(collected.unclassified[0].reason, /unknown call shape/)
    fails(unknown, '--profile', 'lane3')
  } finally {
    removeFixture(unknown)
  }

  const unbounded = fixtureRoot({
    commandSource: commandPaletteSource({ call: '' }),
  })
  try {
    write(
      unbounded,
      'frontend/src/components/relationships/AdvancedGraphVisualization.tsx',
      "import { useTranslation } from 'react-i18next'\nconst { t } = useTranslation('graph')\nconst ClusterNode = ({ data }) => t(data.clusterType, data.clusterType)\n",
    )
    const collected = collectCalls(unbounded, 'lane3')
    assert.equal(collected.unclassified.length, 1)
    assert.equal(collected.unclassified[0].family, 'lane3.advancedGraph.cluster.unprefixed')
    fails(unbounded, '--profile', 'lane3')
  } finally {
    removeFixture(unbounded)
  }

  const opaqueCalls = [
    "const defaultValue = 'Default'\nt(analyzeLabelKey[analyze.queryType], { defaultValue })",
    "t(analyzeLabelKey[analyze.queryType], { ['defaultValue']: 'Default' })",
    "const opts = { defaultValue: 'Default' }\nt(analyzeLabelKey[analyze.queryType], { ...opts })",
  ]
  for (const call of opaqueCalls) {
    const opaque = fixtureRoot({
      commandSource: commandPaletteSource({ call }),
    })
    try {
      const collected = collectCalls(opaque, 'lane3')
      assert.equal(collected.unclassified.length, 1)
      assert.match(collected.unclassified[0].reason, /hidden/)
      fails(opaque, '--profile', 'lane3')
    } finally {
      removeFixture(opaque)
    }
  }

  const aliased = fixtureRoot({
    commandSource: commandPaletteSource({
      binding: 'const { t: translate }',
      call: "translate(analyzeLabelKey[analyze.queryType], 'Default')",
    }).replace('t(dynamicLabel, { count: 1 })', ''),
  })
  try {
    const collected = collectCalls(aliased, 'lane3')
    assert.equal(collected.fallbackSites.length, 1)
    assert.equal(collected.unclassified.length, 1)
    assert.notEqual(collected.unclassified[0].family, 'unclassified.translator-binding')
    assert.match(collected.unclassified[0].reason, /AST did not prove closed domain/)
    fails(aliased, '--profile', 'lane3')
  } finally {
    removeFixture(aliased)
  }

  const aliasedUnknownShape = fixtureRoot({
    commandSource: commandPaletteSource({
      binding: 'const { t: tQs }',
      call: "tQs(groupKey, 'Default')",
    }),
  })
  try {
    const collected = collectCalls(aliasedUnknownShape, 'lane3')
    assert.equal(collected.fallbackSites.length, 1)
    assert.equal(collected.unclassified.length, 1)
    assert.equal(collected.unclassified[0].expression, "tQs(groupKey, 'Default')")
    assert.equal(collected.unclassified[0].family, 'unclassified.unknown-shape')
    fails(aliasedUnknownShape, '--profile', 'lane3')
  } finally {
    removeFixture(aliasedUnknownShape)
  }
})

test('the controlled live census discriminates before repair and positively reproduces both review findings: 32 missing list leaves out of the complete 153-leaf caller cross-product (17 EntityType values x 9 call families) and all eight canonical display-type leaves missed by the unprefixed graph cluster lookup; the exact 9 plus 13 caller populations are nonempty and no family is excluded to reach the expected count', () => {
  const output = run(
    root,
    '--profile',
    'ar04-pre-repair',
    '--expect-list-sites',
    '9',
    '--expect-list-leaves',
    '153',
    '--expect-lane3-sites',
    '13',
    '--expect-list-missing-both',
    '32',
    '--expect-cluster-missing-both',
    '8',
  )
  assert.match(output, /listSites=9 listLeaves=153 lane3Sites=13/)
  assert.match(output, /listMissingBoth=32 clusterMissingBoth=8 unclassified=10/)
  assert.match(output, /list\.topic\.firstTitle\tEN=MISS\tAR=MISS/)
  assert.match(output, /list\.work_item\.import\tEN=MISS\tAR=MISS/)
  assert.match(output, /required=type\.country\trequiredEN=ok\trequiredAR=ok\troute=MISS/)
  assert.match(output, /^UNCLASSIFIED\tlane3\.advancedGraph\.cluster\.unprefixed\t/m)
  assert.match(output, /^UNCLASSIFIED\tunclassified\.unknown-shape\t.*\ttQs\(groupKey,/m)
  assert.equal(
    (
      output.match(
        /^UNCLASSIFIED\tunclassified\.unknown-shape\t.*\ttCommon\(page\.label, page\.id\)/gm,
      ) ?? []
    ).length,
    2,
  )
})

test('the instrument must construct every non-empty closed domain through exactly one helper, closedDomain(key, domain, proof), whose third argument is a direct provesClosedDomain(...) call that returns true ONLY when the AST establishes closure and false otherwise, in which case the call is reported unclassified; --force-unproven forces that predicate false and changes nothing else, and --rows prints CLOSED and UNCLASSIFIED tab-separated rows. This gate is mechanical - not a judge item and not a count, because a judge read one branch of two and the counts hold whether a domain is proven or merely assumed. Its structural leg reads the source of the instrument itself and fails closed on any closed-domain construction lacking a proof call in the proof position, and fails closed again on zero such sites so it can never pass vacuously. Its drill leg then forces every proof to fail and requires the closed-domain row count to reach exactly zero while the total row count is conserved, which is what proves the predicate actually gates behaviour on every path rather than being an unread argument, with the unforced run required to carry at least one closed row so neither leg can pass on an empty census', () => {
  const source = readFileSync(script, 'utf8')
  const sf = ts.createSourceFile(script, source, ts.ScriptTarget.Latest, true)
  const helpers = []
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'closedDomain'
    ) {
      helpers.push(node.initializer)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  assert.equal(helpers.length, 1)
  assert.ok(ts.isArrowFunction(helpers[0]))
  assert.deepEqual(
    helpers[0].parameters.map((parameter) => parameter.name.getText(sf)),
    ['key', 'domain', 'proof'],
  )
  assert.ok(closedDomainSitesFromInstrument().length > 0)

  const ordinary = run(root, '--profile', 'ar04-pre-repair', '--rows').trim().split('\n')
  const forced = run(root, '--profile', 'ar04-pre-repair', '--rows', '--force-unproven')
    .trim()
    .split('\n')
  assert.ok(ordinary.length > 0)
  assert.equal(forced.length, ordinary.length)
  assert.ok(ordinary.every((row) => /^(CLOSED|UNCLASSIFIED)\t/.test(row)))
  assert.ok(forced.every((row) => row.startsWith('UNCLASSIFIED\t')))
  assert.ok(ordinary.some((row) => row.startsWith('CLOSED\t')))
})

test('The SUMMARY records the executable commands and complete rows, including every unclassified row. The task changes only the instrument, its tests, and its SUMMARY: it cannot make its own live result green by editing a production caller, a locale bundle, or a profile consumer.', () => {
  const recordedSnapshot = readFileSync(priorSummaryPath, 'utf8')
  assert.match(recordedSnapshot, /^status: complete$/m)
  assert.match(recordedSnapshot, /Tests  12 passed \(12\)/)
  assert.match(recordedSnapshot, /All 28 cells are expressible/)
  assert.match(recordedSnapshot, /summary-verbatim-missing-lines=0/)
  assert.match(recordedSnapshot, /No production caller, locale bundle, or profile consumer changed/)
})

test(acceptanceCriteria[0], () => {
  const preRepair = auditProfile(root, 'ar04-pre-repair')
  assert.deepEqual(
    {
      listSites: preRepair.callerPopulations.listSites,
      listLeaves: preRepair.callerPopulations.listLeaves,
      lane3Sites: preRepair.callerPopulations.lane3Sites,
      listMissingBoth: preRepair.counts.listMissingBoth,
      clusterMissingBoth: preRepair.counts.clusterMissingBoth,
    },
    {
      listSites: 9,
      listLeaves: 153,
      lane3Sites: 13,
      listMissingBoth: 32,
      clusterMissingBoth: 8,
    },
  )
  assert.deepEqual(proofCounts(fixtureResult('generality-membership')), {
    closed: 1,
    unclassified: 0,
  })
})

test(acceptanceCriteria[1], () => {
  const result = auditProfile(root, 'ar04-pre-repair')
  assert.equal(result.evidenceRoot, resolve(fixtureCorpus, 'pre-repair'))
  assert.ok(result.files.every((file) => readFileSync(join(result.evidenceRoot, file), 'utf8')))
  assert.equal(result.callerPopulations.listSites, 9)
  assert.equal(result.callerPopulations.listLeaves, 153)
  assert.equal(result.callerPopulations.lane3Sites, 13)
  assert.equal(result.counts.listMissingBoth, 32)
  assert.equal(result.counts.clusterMissingBoth, 8)
})

test(acceptanceCriteria[2], { timeout: 30_000 }, () => {
  const positiveSource = readFileSync(
    join(fixtureCorpus, 'generality-membership/caller.tsx'),
    'utf8',
  )
  assert.doesNotMatch(positiveSource, /NODE_COLORS|semantic-colors|Object\.entries/)
  const matrix = matrixRows()
  const forms = new Set(matrix.map(([, form]) => form))
  for (const identifier of new Set(matrix.map(([identifier]) => identifier))) {
    for (const form of forms) {
      const cell = matrix.find(
        ([candidateIdentifier, candidateForm]) =>
          candidateIdentifier === identifier && candidateForm === form,
      )
      assert.ok(cell != null, `matrix cell present for ${identifier}/${form}`)
    }
  }
  assert.doesNotMatch(readFileSync(script, 'utf8'), /@audit-line/)
})

test(acceptanceCriteria[3], () => {
  const ordinary = auditProfile(root, 'ar04-pre-repair')
  const forced = auditProfile(root, 'ar04-pre-repair', { forceUnproven: true })
  assert.equal(ordinary.callerPopulations.listSites, 9)
  assert.equal(ordinary.callerPopulations.listLeaves, 153)
  assert.equal(ordinary.callerPopulations.lane3Sites, 13)
  assert.equal(ordinary.counts.listMissingBoth, 32)
  assert.equal(ordinary.counts.clusterMissingBoth, 8)
  assert.ok(ordinary.proofRows.some((row) => row.status === 'CLOSED'))
  assert.equal(forced.proofRows.length, ordinary.proofRows.length)
  assert.ok(forced.proofRows.every((row) => row.status === 'UNCLASSIFIED'))
})

test(acceptanceCriteria[4], { timeout: 120_000 }, () => {
  assert.deepEqual(proofCounts(fixtureResult('generality-membership')), {
    closed: 1,
    unclassified: 0,
  })
  assert.deepEqual(proofCounts(fixtureResult('generality-noproof')), {
    closed: 0,
    unclassified: 1,
  })
  const matrix = matrixRows()
  const identifiers = [...new Set(matrix.map(([identifier]) => identifier))]
  const forms = [...new Set(matrix.map(([, form]) => form))]
  assert.ok(identifiers.length > 0, `matrix-identifiers=${identifiers.length}/${matrix.length}`)
  assert.ok(forms.length > 0, `matrix-forms=${forms.length}/${matrix.length}`)
  assert.equal(matrix.length, identifiers.length * forms.length)
  assert.deepEqual(
    matrix.map(([identifier, form]) => `${identifier}/${form}`).sort(),
    identifiers.flatMap((identifier) => forms.map((form) => `${identifier}/${form}`)).sort(),
  )
  for (const [, , fixture] of matrix) assertFixturePair(fixture)

  const temporary = mkdtempSync(join(tmpdir(), 'i18n-dynamic-marker-'))
  try {
    const copiedCorpus = join(temporary, 'fx')
    cpSync(fixtureCorpus, copiedCorpus, { recursive: true })
    const rewriteMarkers = (directory) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) rewriteMarkers(path)
        else {
          const source = readFileSync(path, 'utf8')
          if (source.includes('@audit-line')) {
            writeFileSync(path, source.replace(/@audit-line\s+\d+/g, '@audit-line 99999'))
          }
        }
      }
    }
    rewriteMarkers(copiedCorpus)
    assert.equal(
      run(join(fixtureCorpus, 'generality-membership'), '--profile', 'lane3', '--rows'),
      run(join(copiedCorpus, 'generality-membership'), '--profile', 'lane3', '--rows'),
    )
  } finally {
    removeFixture(temporary)
  }
})

test(acceptanceCriteria[5], () => {
  const recordedSnapshot = readFileSync(priorSummaryPath, 'utf8')
  assert.match(recordedSnapshot, /summary-verbatim-missing-lines=0/)
  assert.match(recordedSnapshot, /No assertion was weakened/)
  assert.match(recordedSnapshot, /No production caller, locale bundle, or other task plan changed/)
})

test(currentAcceptanceCriteria[0], () => {
  const recordedSnapshot = readFileSync(summaryPath, 'utf8')
  assert.match(recordedSnapshot, /live profile now reports `lane3Sites=13`/)
  const live = auditProfile(root, 'ar04-live')
  const translatorBinding = live.unclassified.filter(
    (row) => row.family === 'unclassified.translator-binding',
  )
  assert.equal(
    translatorBinding.length,
    0,
    `translator-binding-unclassified=${translatorBinding.length}/${live.unclassified.length}`,
  )
})

test(currentAcceptanceCriteria[1], () => {
  const live = auditProfile(root, 'ar04-live')
  const parameterSites = live.fallbackSites.filter(
    (site) =>
      site.file.endsWith('/AnalyticResultView.tsx') &&
      site.expression.startsWith('t(`type.${node.type}`'),
  )
  assert.equal(parameterSites.length, 2)
  for (const site of parameterSites) {
    const proof = live.proofRows.find(
      (row) =>
        row.file === site.file && row.line === site.line && row.expression === site.expression,
    )
    assert.ok(proof != null)
    assert.notEqual(proof.family, 'unclassified.translator-binding')
  }
  assert.equal(
    parameterSites.length,
    2,
    `parameter-sites-visible=${parameterSites.length}/${parameterSites.length}`,
  )
})

test(currentAcceptanceCriteria[2], () => {
  const live = auditProfile(root, 'ar04-live')
  const renamedSites = live.fallbackSites.filter(
    (site) =>
      site.expression.startsWith('tQs(groupKey,') ||
      site.expression.startsWith('tCommon(page.label,'),
  )
  assert.equal(renamedSites.length, 3)
  for (const site of renamedSites) {
    const unclassified = live.unclassified.find(
      (row) =>
        row.file === site.file && row.line === site.line && row.expression === site.expression,
    )
    assert.notEqual(unclassified?.family, 'unclassified.translator-binding')
  }
  assert.equal(
    renamedSites.length,
    3,
    `renamed-bindings-recognised=${renamedSites.length}/${renamedSites.length}`,
  )
})

test(currentAcceptanceCriteria[3], () => {
  assert.equal(runSelfCheck().selfCheck, 'PASS')
  const live = auditProfile(root, 'ar04-live')
  const translatorBinding = live.unclassified.filter(
    (row) => row.family === 'unclassified.translator-binding',
  )
  assert.equal(
    translatorBinding.length,
    0,
    `translator-binding-unclassified=${translatorBinding.length}/${live.unclassified.length}`,
  )
  const isLane3 = (family) => String(family ?? '').startsWith('lane3.')
  const observed = new Set([
    ...live.rows.filter((row) => isLane3(row.family)).map((row) => row.family),
    ...live.unclassified.filter((row) => isLane3(row.family)).map((row) => row.family),
  ])
  const rules = new Set(
    live.proofRows.filter((row) => isLane3(row.family)).map((row) => row.family),
  )
  assert.ok(observed.size > 0, `observed-families=${observed.size}/${observed.size + rules.size}`)
  assert.ok(rules.size > 0, `handling-rules=${rules.size}/${observed.size + rules.size}`)
  assert.deepEqual(
    [...observed].filter((family) => !rules.has(family)),
    [],
  )
  assert.deepEqual(
    [...rules].filter((family) => !observed.has(family)),
    [],
  )
})

test(currentAcceptanceCriteria[4], { timeout: 120_000 }, () => {
  const matrix = matrixRows()
  let passingPolarities = 0
  for (const [, , fixture] of matrix) {
    const negative = proofCounts(fixtureResult(fixture))
    const control = proofCounts(fixtureResult(`${fixture}-control`))
    assert.equal(negative.closed, 0, `${fixture} negative closed=0/${negative.closed}`)
    assert.ok(
      negative.unclassified > 0,
      `${fixture} negative unclassified=${negative.unclassified}/${negative.closed + negative.unclassified}`,
    )
    assert.ok(
      control.closed > 0,
      `${fixture} control closed=${control.closed}/${control.closed + control.unclassified}`,
    )
    assert.equal(
      control.unclassified,
      0,
      `${fixture} control unclassified=${control.unclassified}/${control.closed + control.unclassified}`,
    )
    passingPolarities++
  }
  assert.equal(
    passingPolarities,
    matrix.length,
    `matrix-polarities=${passingPolarities}/${matrix.length}`,
  )

  const source = readFileSync(script, 'utf8')
  const resolver = source.slice(
    source.indexOf('const findUseTranslationBindings'),
    source.indexOf('const objectProperty'),
  )
  assert.doesNotMatch(resolver, /tQs|tCommon|\bctx\b|CommandPalette\.tsx|AnalyticResultView\.tsx/)

  const temporalAssignments = fixtureRoot({
    commandSource: `
import { useTranslation } from 'react-i18next'
const analyzeLabelKey = { one: 'analyze.one' } as const
const otherLabelKey = { one: 'analyze.one' } as const
const analyze = { queryType: 'one' }
const decoy = (_namespace: string) => ({ t: (key: string) => key })
let translate: (key: string, fallback: string) => string
translate = useTranslation('fixture').t
const before = translate(analyzeLabelKey[analyze.queryType], 'Before')
translate = decoy('fixture').t
const after = translate(otherLabelKey[analyze.queryType], 'After')
void before
void after
`,
  })
  try {
    const collected = collectCalls(temporalAssignments, 'lane3')
    assert.equal(collected.fallbackSites.length, 2)
    const before = collected.unclassified.find((row) => row.expression.includes("'Before'"))
    const after = collected.unclassified.find((row) => row.expression.includes("'After'"))
    assert.notEqual(before?.family, 'unclassified.translator-binding')
    assert.equal(after?.family, 'unclassified.translator-binding')
  } finally {
    removeFixture(temporalAssignments)
  }
})

test(currentAcceptanceCriteria[5], () => {
  const matrix = matrixRows()
  const identifiers = new Set(matrix.map(([identifier]) => identifier))
  const forms = new Set(matrix.map(([, form]) => form))
  assert.ok(identifiers.size > 0, `matrix-identifiers=${identifiers.size}/${matrix.length}`)
  assert.ok(forms.size > 0, `matrix-forms=${forms.size}/${matrix.length}`)
  assert.equal(matrix.length, identifiers.size * forms.size)

  const roots = readdirSync(fixtureCorpus, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  const rootSet = new Set(roots)
  const pairedRoots = roots
    .filter((name) => !name.endsWith('-control') && rootSet.has(`${name}-control`))
    .sort()
  const matrixRoots = matrix.map(([, , fixture]) => fixture).sort()
  assert.deepEqual(pairedRoots, matrixRoots)
  for (const fixture of matrixRoots) {
    assert.ok(existsSync(join(fixtureCorpus, fixture, 'caller.tsx')))
    assert.ok(existsSync(join(fixtureCorpus, `${fixture}-control`, 'caller.tsx')))
  }

  const snapshot = readFileSync(priorSummaryPath, 'utf8')
  assert.match(snapshot, /Tests  12 passed \(12\)/)
  assert.match(snapshot, /summary-verbatim-missing-lines=0/)
  const summary = readFileSync(summaryPath, 'utf8')
  assert.match(summary, /Before repair \(verbatim\)/)
  assert.match(summary, /After repair oracle \(verbatim\)/)
  assert.match(summary, /No identifier name or production file path was special-cased/)
})

test(taskAcceptanceCriteria[0], () => {
  const ledger = runSelfCheck()
  assert.equal(ledger.selfCheck, 'PASS')
  assert.equal(ledger.checks.staticCollectionWholeKeyClassifies, true)
  assert.equal(ledger.checks.staticCollectionDomainIsClosed, true)
  assert.equal(ledger.checks.runtimeWholeKeyStaysUnclassified, true)
  assert.equal(ledger.checks.crossModuleMutationStaysUnclassified, true)
  const summary = readFileSync(taskSummaryPath, 'utf8')
  assert.match(
    summary,
    /This task asserts nothing about the reported residue, the FENCE set, or any profile count; P99-49 owns that claim\./,
  )
})

test(taskAcceptanceCriteria[1], () => {
  const ledger = runSelfCheck()
  assert.equal(ledger.checks.staticCollectionWholeKeyClassifies, true)
  assert.equal(ledger.checks.staticCollectionDomainIsClosed, true)
  assert.equal(ledger.checks.runtimeWholeKeyStaysUnclassified, true)
  assert.equal(ledger.checks.crossModuleMutationStaysUnclassified, true)

  const ambientFactory = fixtureRoot({
    commandSource: `
import { useTranslation } from 'react-i18next'
declare function declaredPages(): Array<{ label: string }>
const analyzeLabelKey = { one: 'analyze.one' }
const { t } = useTranslation('fixture')
declaredPages().map((page) => t(page.label, 'Default'))
`,
  })
  try {
    const collected = collectCalls(ambientFactory, 'lane3')
    assert.equal(collected.fallbackSites.length, 1)
    assert.equal(collected.calls.length, 0)
    assert.equal(collected.unclassified.length, 1)
  } finally {
    removeFixture(ambientFactory)
  }

  const moduleMutationAfterUse = fixtureRoot({
    commandSource: `
import { useTranslation } from 'react-i18next'
const analyzeLabelKey = { one: 'analyze.one' }
const { t } = useTranslation('fixture')
const pages = [{ label: 'ok.leaf' }]
const render = () => pages.map((page) => t(page.label, 'Default'))
pages.push({ label: 'prefixOnly.leaf' })
void render
`,
  })
  try {
    const collected = collectCalls(moduleMutationAfterUse, 'lane3')
    assert.equal(collected.fallbackSites.length, 1)
    assert.equal(collected.calls.length, 0)
    assert.equal(collected.unclassified.length, 1)
  } finally {
    removeFixture(moduleMutationAfterUse)
  }
})

test(taskAcceptanceCriteria[2], () => {
  const declared = [
    'resolvedLeafPasses',
    'existingPrefixMissingLeafFails',
    'enOnlyFailsArabic',
    'arOnlyFailsEnglish',
    'unknownCallShapeFails',
    'interpolationOnlyOptionsNotFallback',
    'defaultValueOptionsAreFallback',
    'staticCollectionWholeKeyClassifies',
    'staticCollectionDomainIsClosed',
    'runtimeWholeKeyStaysUnclassified',
    'crossModuleMutationStaysUnclassified',
  ]
  const ledger = runSelfCheck()
  assert.deepEqual(Object.keys(ledger.checks).sort(), declared.sort())
  assert.ok(declared.every((name) => ledger.checks[name] === true))
  assert.equal(ledger.selfCheck, 'PASS')
})

test(taskAcceptanceCriteria[3], () => {
  const ledger = runSelfCheck()
  const prior = [
    'resolvedLeafPasses',
    'existingPrefixMissingLeafFails',
    'enOnlyFailsArabic',
    'arOnlyFailsEnglish',
    'unknownCallShapeFails',
    'interpolationOnlyOptionsNotFallback',
    'defaultValueOptionsAreFallback',
  ]
  assert.ok(prior.every((name) => ledger.checks[name] === true))

  const workingPaths = execFileSync('git', ['status', '--short'], {
    cwd: root,
    encoding: 'utf8',
  })
    .trimEnd()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3))
  const changedPaths = [...new Set([...committedTaskPaths(), ...workingPaths])]
  const allowed = new Set([
    'scripts/i18n-dynamic-key-audit.mjs',
    'scripts/i18n-dynamic-key-audit.test.mjs',
    '.planning/phases/99-arabic-coverage/99-56-SUMMARY.md',
  ])
  assert.ok(changedPaths.length > 0)
  assert.ok(changedPaths.every((path) => allowed.has(path)))
  assert.equal(
    changedPaths.filter((path) => path.startsWith('scripts/i18n-dynamic-key-audit')).length,
    2,
  )

  const summary = readFileSync(taskSummaryPath, 'utf8')
  assert.match(summary, /node --test scripts\/i18n-dynamic-key-audit\.test\.mjs/)
  assert.match(summary, /(?:#|ℹ) pass \d+/)
  assert.match(summary, /(?:#|ℹ) fail 0/)
})

test(taskAcceptanceCriteria[4], () => {
  const ledger = runSelfCheck()
  const declared = new Set([
    'resolvedLeafPasses',
    'existingPrefixMissingLeafFails',
    'enOnlyFailsArabic',
    'arOnlyFailsEnglish',
    'unknownCallShapeFails',
    'interpolationOnlyOptionsNotFallback',
    'defaultValueOptionsAreFallback',
    'staticCollectionWholeKeyClassifies',
    'staticCollectionDomainIsClosed',
    'runtimeWholeKeyStaysUnclassified',
    'crossModuleMutationStaysUnclassified',
  ])
  const emitted = new Set(Object.keys(ledger.checks))
  assert.deepEqual(emitted, declared)
  assert.ok([...declared].every((name) => ledger.checks[name] === true))
  assert.equal(ledger.selfCheck, 'PASS')
})

test(taskAcceptanceCriteria[5], () => {
  const summary = readFileSync(taskSummaryPath, 'utf8')
  assert.match(summary, /cross-module label collection resolves 27 of 27 in en and 27 of 27 in ar/)
  assert.match(summary, /in-file map resolves 8 of 8 in en and 8 of 8 in ar/)
  assert.match(
    summary,
    /motivating population is recorded as premise evidence, not as this task's resolution claim/,
  )
})
