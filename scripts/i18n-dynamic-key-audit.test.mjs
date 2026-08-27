import nodeTest from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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
const summaryPath = resolve(root, '.planning/phases/99-arabic-coverage/99-48-SUMMARY.md')

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
    'frontend/src/types/relationship.types.ts',
    "export type DossierRelationshipType = 'partner' | 'member'\n",
  )
  write(
    base,
    'frontend/src/components/list-page/sensitivity.ts',
    "export const SENSITIVITY_CHIP = { low: { labelKey: 'sensitivity.low' } } as const\n",
  )
  write(base, 'frontend/src/components/keyboard-shortcuts/CommandPalette.tsx', commandSource)
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
  `UNCLASSIFIED\t${row.family}\t${row.file}:${row.line}\t${row.reason}\t${row.expression.replace(/\s+/g, ' ')}\tns=${row.namespaces.join('|')}`

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
  assert.equal(result.counts.unclassified, 1)

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
  assert.match(result.unclassified[0].reason, /canonical-membership proof/)
})

test('The production entry point is scripts/i18n-dynamic-key-audit.mjs. It parses TypeScript call expressions rather than source lines, separates interpolation-only option objects from fallback-bearing calls, resolves explicit and hook-bound namespaces with fallbackLng disabled, and checks complete LEAF keys in en and ar. Every fallback-bearing nonliteral call in the two ruled profiles is either assigned a closed domain or reported unclassified; an empty domain, prefix-only object, missing file, malformed bundle, or unknown call shape is a failure, never zero. A domain counts as CLOSED only when the AST proves membership in the production constant that defines the closed dossier-card display set AND an explicit type.unknown branch exists in the same caller; a domain inferred from expression text, from whichever keys happen to exist in JSON, or from a fallback argument is rejected and the call is reported unclassified, which fails closed.', () => {
  const result = auditProfile(root, 'ar04-pre-repair')
  assert.equal(result.productionEntryPoint, 'scripts/i18n-dynamic-key-audit.mjs')
  assert.equal(result.parser, 'typescript AST CallExpression')
  assert.equal(result.fallbackLng, false)
  assert.equal(result.fallbackSites.length, 22)
  assert.equal(result.rows.filter((row) => row.closedDomain === false).length, 8)
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
const { t } = useTranslation('fixture')
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

test('the instrument tests exercise both locales and both polarities: a resolved leaf passes, an existing prefix with a missing leaf fails, en-only and ar-only leaves each fail, an unclassified nonliteral call fails, and interpolation-only options are not mislabeled as English defaults; and three fail-closed negative tests each red the instrument: an unbounded cluster lookup with no canonical-membership proof and no type.unknown branch, a defaultValue reachable only through a shorthand, static-computed, or spread option object, and a useTranslation translator bound to an identifier other than t', () => {
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
      "const { t } = useTranslation('fixture')\nconst ClusterNode = ({ data }) => t(data.clusterType, data.clusterType)\n",
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
    assert.match(collected.unclassified[0].reason, /translator binding: translate/)
    fails(aliased, '--profile', 'lane3')
  } finally {
    removeFixture(aliased)
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
  assert.match(output, /listMissingBoth=32 clusterMissingBoth=8 unclassified=1/)
  assert.match(output, /list\.topic\.firstTitle\tEN=MISS\tAR=MISS/)
  assert.match(output, /list\.work_item\.import\tEN=MISS\tAR=MISS/)
  assert.match(output, /required=type\.country\trequiredEN=ok\trequiredAR=ok\troute=MISS/)
  assert.match(output, /^UNCLASSIFIED\tlane3\.advancedGraph\.cluster\.unprefixed\t/m)
})

test('The SUMMARY records the executable commands and complete rows, including every unclassified row. The task changes only the instrument, its tests, and its SUMMARY: it cannot make its own live result green by editing a production caller, a locale bundle, or a profile consumer.', () => {
  const summary = readFileSync(summaryPath, 'utf8')
  assert.match(summary, /node --test "\$R\/scripts\/i18n-dynamic-key-audit\.test\.mjs"/)
  assert.match(
    summary,
    /--expect-list-sites 9 --expect-list-leaves 153 --expect-lane3-sites 13 --expect-list-missing-both 32 --expect-cluster-missing-both 8/,
  )
  const result = auditProfile(root, 'ar04-pre-repair')
  for (const row of result.unclassified) {
    assert.ok(summary.includes(exactUnclassifiedLine(row)))
  }
  const recordedRows = summary
    .split('\n')
    .filter((line) => line.startsWith('list\t') || line.startsWith('lane3\t'))
  assert.equal(recordedRows.length, result.rows.length)
  assert.match(summary, /No production caller, locale bundle, or profile consumer changed/)
})
