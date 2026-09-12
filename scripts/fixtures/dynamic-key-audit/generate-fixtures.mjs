#!/usr/bin/env node
/** Deterministic producer for the matrix-bounded dynamic-key audit corpus. */

import {
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusRoot = dirname(fileURLToPath(import.meta.url))
const matrixName = 'FORM-MATRIX.tsv'
const producerInputs = new Set([matrixName, 'generate-fixtures.mjs', 'generate-fixtures.test.mjs'])
const identifiers = new Set(['receiver', 'key', 'namespace', 'translator'])
// This is a closed inventory of JavaScript/TypeScript mechanisms by which a
// translator reaches a call. Composite forms drill both variants they name.
// It is intentionally derived independently of the resolver under test.
const formMechanisms = new Map([
  ['direct-call', 'CallExpression(PropertyAccessExpression(HookCall, t))'],
  [
    'destructuring-command-palette-tsx-431-432',
    'BindingElement(t), and BindingElement(propertyName=t, name=alias) at CommandPalette.tsx:431-432',
  ],
  ['aliased-import', 'ImportSpecifier(propertyName=useTranslation, name=alias)'],
  ['re-export', 'ExportSpecifier followed by ImportSpecifier'],
  ['property-access', 'PropertyAccessExpression(translatorObject, t)'],
  [
    'parameter-analytic-result-view-tsx-196-205-261-300',
    'Parameter(ctx) carrying t at AnalyticResultView.tsx:196-205 to calls at :261 and :300',
  ],
  [
    'assignment-and-reassignment',
    'AssignmentExpression establishing a translator, followed by AssignmentExpression replacing it',
  ],
  ['shadowing', 'nested lexical BindingElement shadowing the same translator name'],
])
const forms = new Set(formMechanisms.keys())
const ruledRoots = new Set(['shared', 'pre-repair', 'generality-membership', 'generality-noproof'])

const parseMatrix = (root = corpusRoot) => {
  const source = readFileSync(join(root, matrixName), 'utf8')
  const lines = source.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length !== identifiers.size * forms.size) {
    throw new Error(`matrix has ${lines.length} rows, expected ${identifiers.size * forms.size}`)
  }

  const cells = lines.map((line, index) => {
    const fields = line.split('\t')
    if (fields.length !== 3 || fields.some((field) => field.length === 0)) {
      throw new Error(`matrix row ${index + 1} must have exactly three non-empty TSV fields`)
    }
    const [identifier, form, fixture] = fields
    if (!identifiers.has(identifier)) throw new Error(`unknown matrix identifier: ${identifier}`)
    if (!forms.has(form)) throw new Error(`unknown matrix form: ${form}`)
    if (!fixture.startsWith('NA:') && !/^[a-z0-9-]+$/.test(fixture)) {
      throw new Error(`invalid fixture root for ${identifier}/${form}: ${fixture}`)
    }
    return { identifier, form, fixture }
  })

  for (const identifier of identifiers) {
    for (const form of forms) {
      const matches = cells.filter((cell) => cell.identifier === identifier && cell.form === form)
      if (matches.length !== 1) {
        throw new Error(`matrix must contain exactly one ${identifier}/${form} cell`)
      }
    }
  }

  const fixtureNames = cells
    .filter(({ fixture }) => !fixture.startsWith('NA:'))
    .map(({ fixture }) => fixture)
  if (new Set(fixtureNames).size !== fixtureNames.length) {
    throw new Error('expressible matrix cells must name distinct fixture pairs')
  }
  if (fixtureNames.some((fixture) => ruledRoots.has(fixture) || fixture.endsWith('-control'))) {
    throw new Error('matrix fixture roots may not collide with ruled or generated control roots')
  }
  return cells
}

const normalizeBody = (body) => (body.endsWith('\n') ? body : `${body}\n`)

// Match the repository's committed Prettier JSON layout without making the
// standalone corpus producer depend on packages outside the copied corpus.
const serializeLocale = (name, value) => {
  if (name === 'engagements.json') {
    return '{ "filter": { "all": "x", "meeting": "x", "travel": "x" } }'
  }
  let body = JSON.stringify(value, null, 2)
  if (name === 'empty-states.json') {
    for (const entity of ['topic', 'working_group', 'elected_official', 'work_item']) {
      body = body.replace(
        `    "${entity}": {\n      "title": "x",\n      "description": "x",\n      "cta": "x"\n    }`,
        `    "${entity}": { "title": "x", "description": "x", "cta": "x" }`,
      )
    }
  }
  if (name === 'graph.json') {
    body = body.replace(
      '    "count": {\n      "membership": "x",\n      "intersection": "x",\n      "chain": "x",\n      "path": "x"\n    }',
      '    "count": { "membership": "x", "intersection": "x", "chain": "x", "path": "x" }',
    )
  }
  return body
}

const route = (receiver = 'DOSSIER_CARD_TYPES') => [
  `const key = ${receiver}.includes(runtimeType)`,
  '  ? `type.${runtimeType}`',
  "  : 'type.unknown'",
]

const canonicalDomainImport = "import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'"
const fakeFactory =
  'export const useTranslation = (_namespace: string) => ({ t: (key: string) => key })'

const targetFor = (identifier, control) => {
  const target = {
    imports: [canonicalDomainImport],
    extras: {},
    hookModule: 'react-i18next',
    namespace: "'graph'",
    setup: route(),
  }
  if (identifier === 'receiver' && !control) {
    target.imports = ["import { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain'"]
    target.extras['frontend/src/fixture/decoy-domain.ts'] =
      "export const DOSSIER_CARD_TYPES = ['country'] as const"
  } else if (identifier === 'key' && !control) {
    target.setup = ['const key = `type.${runtimeType}`']
  } else if (identifier === 'namespace' && !control) {
    target.namespace = "'missing'"
  } else if (identifier === 'translator' && !control) {
    target.hookModule = '@/fixture/decoy-i18n'
    target.extras['frontend/src/fixture/decoy-i18n.ts'] = fakeFactory
  }
  return target
}

const hookImport = (module, local = 'useTranslation') =>
  local === 'useTranslation'
    ? `import { useTranslation } from '${module}'`
    : `import { useTranslation as ${local} } from '${module}'`

const fixtureProgram = (target, imports, statements, declarations = []) => {
  const body = statements.flatMap((statement) => statement.split('\n')).map((line) => `  ${line}`)
  return `${[...new Set([...imports, ...target.imports])].join('\n')}
${declarations.join('\n')}
export function Fixture({ runtimeType }: { runtimeType: string }) {
${body.join('\n')}
}`
}

const selectedHook = (target, preferred = 'useTranslation') => ({
  imports: [hookImport(target.hookModule, preferred)],
  name: preferred,
})

const renderForm = (identifier, form, target) => {
  const setup = target.setup
  if (form === 'direct-call') {
    const hook = selectedHook(target)
    return fixtureProgram(target, hook.imports, [
      ...setup,
      `return ${hook.name}(${target.namespace}).t(key, runtimeType)`,
    ])
  }
  if (form === 'destructuring-command-palette-tsx-431-432') {
    const hook = selectedHook(target)
    const namespace = identifier === 'translator' ? "'quickswitcher'" : target.namespace
    return fixtureProgram(target, hook.imports, [
      `const { t } = ${hook.name}(${namespace})`,
      "const plain = t('type.unknown', runtimeType)",
      `const { t: tQs } = ${hook.name}(${namespace})`,
      ...setup,
      'return `${plain}${tQs(key, runtimeType)}`',
    ])
  }
  if (form === 'aliased-import') {
    const hook = selectedHook(target, 'useI18n')
    return fixtureProgram(target, hook.imports, [
      `const { t } = ${hook.name}(${target.namespace})`,
      ...setup,
      'return t(key, runtimeType)',
    ])
  }
  if (form === 're-export') {
    const module = target.hookModule === '@/fixture/decoy-i18n' ? './decoy-i18n' : target.hookModule
    target.extras['frontend/src/fixture/i18n-export.ts'] =
      `export { useTranslation } from '${module}'`
    return fixtureProgram(
      target,
      [hookImport('@/fixture/i18n-export')],
      [`const { t } = useTranslation(${target.namespace})`, ...setup, 'return t(key, runtimeType)'],
    )
  }
  if (form === 'property-access') {
    const hook = selectedHook(target)
    return fixtureProgram(target, hook.imports, [
      `const translator = ${hook.name}(${target.namespace})`,
      ...setup,
      'return translator.t(key, runtimeType)',
    ])
  }
  if (form === 'parameter-analytic-result-view-tsx-196-205-261-300') {
    const hook = selectedHook(target)
    return fixtureProgram(
      target,
      hook.imports,
      [
        `const { t } = ${hook.name}(${target.namespace})`,
        ...setup,
        'return renderType({ t, runtimeType }, key)',
      ],
      [
        'type TFn = (key: string, fallback: string) => string',
        'function renderType(ctx: { t: TFn; runtimeType: string }, key: string) { const { t, runtimeType } = ctx; return t(key, runtimeType) }',
      ],
    )
  }
  if (form === 'assignment-and-reassignment') {
    const hook = selectedHook(target)
    return fixtureProgram(target, hook.imports, [
      'let translate: (key: string, fallback: string) => string',
      `translate = ${hook.name}(${target.namespace}).t`,
      `translate = ${hook.name}(${target.namespace}).t`,
      ...setup,
      'return translate(key, runtimeType)',
    ])
  }
  if (form === 'shadowing') {
    const imports = [hookImport('react-i18next', 'canonicalUseTranslation')]
    let chosen = 'canonicalUseTranslation'
    if (target.hookModule !== 'react-i18next') {
      chosen = 'selectedUseTranslation'
      imports.push(hookImport(target.hookModule, chosen))
    }
    return fixtureProgram(target, imports, [
      "const { t: translate } = canonicalUseTranslation('graph')",
      '{',
      `  const { t: translate } = ${chosen}(${target.namespace})`,
      ...setup.map((line) => `  ${line}`),
      '  return translate(key, runtimeType)',
      '}',
    ])
  }
  throw new Error(`no language mechanism for matrix cell ${identifier}/${form}`)
}

const scenarioFor = (identifier, form) => {
  const negativeTarget = targetFor(identifier, false)
  const controlTarget = targetFor(identifier, true)
  return {
    negative: renderForm(identifier, form, negativeTarget),
    control: renderForm(identifier, form, controlTarget),
    negativeExtras: negativeTarget.extras,
    controlExtras: controlTarget.extras,
  }
}

const caller = ({ keySetup = route() } = {}) =>
  fixtureProgram(
    targetFor('receiver', true),
    [hookImport('react-i18next')],
    ["const { t } = useTranslation('graph')", ...keySetup, 'return t(key, runtimeType)'],
  )

const putPreRepair = (put) => {
  const base = 'pre-repair/frontend/src'
  const entities = [
    'document',
    'dossier',
    'engagement',
    'commitment',
    'organization',
    'country',
    'forum',
    'event',
    'task',
    'person',
    'position',
    'mou',
    'topic',
    'working_group',
    'elected_official',
    'work_item',
    'generic',
  ]
  const listFamilies = [
    'firstTitle',
    'title',
    'firstDescription',
    'description',
    'hint',
    'cta',
    'createFirst',
    'create',
    'import',
  ]
  const listSource = `export type EntityType=${entities.map((entity) => `'${entity}'`).join('|')}
interface ListEmptyStateProps{entityType:EntityType}
const entityConfig:Record<EntityType,{translationKey:EntityType}>={
${entities.map((entity) => `${entity}:{translationKey:'${entity}'},`).join('\n')}
}
export function ListEmptyState({entityType}:ListEmptyStateProps){
const {t}=useTranslation('empty-states')
const config=entityConfig[entityType]
const translationKey=config.translationKey
${listFamilies.map((family) => `t(\`list.\${translationKey}.${family}\`,'${family}')`).join('\n')}
}`
  put(`${base}/components/empty-states/ListEmptyState.tsx`, listSource)
  put(
    `${base}/components/keyboard-shortcuts/CommandPalette.tsx`,
    `type AnalyticQueryType = 'forumMembership' | 'sharedCommittees' | 'engagementChain' | 'shortestPath'
const analyzeLabelKey: Record<AnalyticQueryType, string> = { forumMembership: 'quickActions.analyzeForumMembership', sharedCommittees: 'quickActions.analyzeSharedCommittees', engagementChain: 'quickActions.analyzeEngagementChains', shortestPath: 'quickActions.analyzeShortestPath' }
const { t } = useTranslation('keyboard-shortcuts')
const { t: tQs } = useTranslation('quickswitcher')
const { t: tCommon } = useTranslation('common')
const groupKey = 'dynamic'; const group = { type: 'country' }; const dossierTypeLabels = { country: { en: 'Country' } }
const page = { label: 'dynamic', id: 'page' }
getAnalyzeCommandActions().map((analyze) => t(analyzeLabelKey[analyze.queryType], 'Analyze'))
// @audit-line 1397
tQs(groupKey, dossierTypeLabels[group.type]?.en || group.type)
// @audit-line 1546
tCommon(page.label, page.id)
// @audit-line 1554
tCommon(page.label, page.id)`,
  )
  put(
    `${base}/components/keyboard-shortcuts/analyze-commands.ts`,
    "export type AnalyticQueryType = 'forumMembership' | 'sharedCommittees' | 'engagementChain' | 'shortestPath'",
  )
  put(
    `${base}/components/list-page/DossierTable.tsx`,
    "const { t } = useTranslation('list-pages')\nconst row = { sensitivity_level: 0 }\nt(sensitivityLabelKey(row.sensitivity_level), 'Unknown')",
  )
  put(
    `${base}/components/list-page/EngagementsList.tsx`,
    "const FILTERS = [{ labelKey: 'filter.all' }, { labelKey: 'filter.meeting' }, { labelKey: 'filter.travel' }] as const\nconst { t } = useTranslation('engagements')\nFILTERS.map((f) => t(f.labelKey, 'All'))",
  )
  put(
    `${base}/components/list-page/sensitivity.ts`,
    "export const SENSITIVITY_CHIP = { public: { labelKey: 'sensitivity.public' }, internal: { labelKey: 'sensitivity.internal' }, restricted: { labelKey: 'sensitivity.restricted' }, confidential: { labelKey: 'sensitivity.confidential' } } as const\nexport const sensitivityLabelKey = (level: number) => SENSITIVITY_CHIP[level]?.labelKey ?? 'sensitivity.unknown'",
  )
  put(
    `${base}/components/modern-nav/IconRail/IconRail.tsx`,
    `const defaultItems = [{ tooltipKey: 'navigation.dashboard' }, { tooltipKey: 'navigation.dossiers' }, { tooltipKey: 'navigation.workflow' }, { tooltipKey: 'navigation.calendar' }, { tooltipKey: 'navigation.reports' }] as const
const { t } = useTranslation()
// @audit-line 187
items.map((item) => t(item.tooltipKey, item.id.charAt(0).toUpperCase() + item.id.slice(1)))`,
  )
  put(
    `${base}/components/relationships/AdvancedGraphVisualization.tsx`,
    `import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
import { graphNodeColors as SEMANTIC_NODE_COLORS } from '@/lib/semantic-colors'
const NODE_COLORS = SEMANTIC_NODE_COLORS
const { t } = useTranslation('graph')
function ClusterNode({ data }) {
// @audit-line 413
  return t(data.clusterType, data.clusterType)
}
// @audit-line 1542
t(\`type.\${type}\`, type)
// @audit-line 1560
t(\`relationship.\${type}\`, type.replace(/_/g, ' '))
// @audit-line 1645
t(\`type.\${type}\`, type)
// @audit-line 1853
Object.entries(NODE_COLORS).slice(0, 6).map(([type]) => t(\`type.\${type}\`, type))`,
  )
  put(
    `${base}/components/relationships/AnalyticQueryPicker.tsx`,
    "const TEMPLATES = [{ labelKey: 'analyze.template.forumMembership' }, { labelKey: 'analyze.template.sharedCommittees' }, { labelKey: 'analyze.template.engagementChain' }, { labelKey: 'analyze.template.shortestPath' }] as const\nconst { t } = useTranslation('graph')\nTEMPLATES.map((tpl) => t(tpl.labelKey, 'Template'))",
  )
  put(
    `${base}/components/relationships/AnalyticResultView.tsx`,
    `type TFn = (key: string, fallback: string) => string
const { t } = useTranslation('graph')
function countLine(t: TFn, key: string, fallback: string) { return t(key, fallback) }
function renderCountLine() { return [countLine(t, 'analyze.count.membership', '{{count}}'), countLine(t, 'analyze.count.intersection', '{{count}}'), countLine(t, 'analyze.count.chain', '{{count}}'), countLine(t, 'analyze.count.path', '{{count}}')] }
// @audit-line 261
t(\`type.\${node.type}\`, node.type)
// @audit-line 300
t(\`type.\${node.type}\`, node.type)`,
  )

  const completeCta = new Set(['engagement', 'organization', 'country', 'forum', 'person'])
  const sparse = new Set(['topic', 'working_group', 'elected_official', 'work_item'])
  const list = Object.fromEntries(
    entities.map((entity) => {
      const keys = sparse.has(entity)
        ? ['title', 'description', 'cta']
        : listFamilies.filter((family) => family !== 'cta' || completeCta.has(entity))
      return [entity, Object.fromEntries(keys.map((key) => [key, 'x']))]
    }),
  )
  const graph = {
    country: 'x',
    organization: 'x',
    forum: 'x',
    engagement: 'x',
    type: Object.fromEntries(
      [
        'country',
        'organization',
        'forum',
        'engagement',
        'topic',
        'working_group',
        'person',
        'elected_official',
      ].map((key) => [key, 'x']),
    ),
    relationship: Object.fromEntries(
      [
        'member_of',
        'participates_in',
        'cooperates_with',
        'bilateral_relation',
        'partnership',
        'parent_of',
        'subsidiary_of',
        'related_to',
        'represents',
        'hosted_by',
        'sponsored_by',
        'involves',
        'discusses',
        'participant_in',
        'observer_of',
        'affiliate_of',
        'successor_of',
        'predecessor_of',
      ].map((key) => [key, 'x']),
    ),
    analyze: {
      template: Object.fromEntries(
        ['forumMembership', 'sharedCommittees', 'engagementChain', 'shortestPath'].map((key) => [
          key,
          'x',
        ]),
      ),
      count: Object.fromEntries(
        ['membership', 'intersection', 'chain', 'path'].map((key) => [key, 'x']),
      ),
    },
  }
  const localeFiles = {
    'common.json': {
      navigation: Object.fromEntries(
        ['dashboard', 'dossiers', 'workflow', 'calendar', 'reports'].map((key) => [key, 'x']),
      ),
    },
    'empty-states.json': { list },
    'engagements.json': {
      filter: Object.fromEntries(['all', 'meeting', 'travel'].map((key) => [key, 'x'])),
    },
    'graph.json': graph,
    'keyboard-shortcuts.json': {
      quickActions: Object.fromEntries(
        [
          'analyzeForumMembership',
          'analyzeSharedCommittees',
          'analyzeEngagementChains',
          'analyzeShortestPath',
        ].map((key) => [key, 'x']),
      ),
    },
    'list-pages.json': {
      sensitivity: Object.fromEntries(
        ['public', 'internal', 'restricted', 'confidential', 'unknown'].map((key) => [key, 'x']),
      ),
    },
    'quickswitcher.json': {},
  }
  for (const locale of ['en', 'ar']) {
    for (const [name, value] of Object.entries(localeFiles)) {
      put(`${base}/i18n/${locale}/${name}`, serializeLocale(name, value))
    }
  }
  put(
    `${base}/lib/dossier-type-guards.ts`,
    "export const DOSSIER_CARD_TYPES = ['country', 'organization', 'forum', 'engagement', 'topic', 'working_group', 'person', 'elected_official'] as const",
  )
  put(
    `${base}/lib/semantic-colors.ts`,
    "export const graphNodeColors = { country: 'c', organization: 'c', individual: 'c', forum: 'c', engagement: 'c', mou: 'c', topic: 'c', working_group: 'c' } as const",
  )
  put(
    `${base}/types/relationship.types.ts`,
    "export type DossierRelationshipType = 'member_of' | 'participates_in' | 'cooperates_with' | 'bilateral_relation' | 'partnership' | 'parent_of' | 'subsidiary_of' | 'related_to' | 'represents' | 'hosted_by' | 'sponsored_by' | 'involves' | 'discusses' | 'participant_in' | 'observer_of' | 'affiliate_of' | 'successor_of' | 'predecessor_of'",
  )
}

const buildCorpus = (cells = parseMatrix()) => {
  const files = new Map()
  const put = (path, body) => {
    if (files.has(path)) throw new Error(`generator attempted duplicate output: ${path}`)
    files.set(path, normalizeBody(body))
  }

  const sharedTypes = [
    'country',
    'organization',
    'person',
    'forum',
    'topic',
    'working_group',
    'engagement',
    'elected_official',
  ]
  put(
    'shared/frontend/src/lib/dossier-type-guards.ts',
    `export const DOSSIER_CARD_TYPES=[${sharedTypes.map((type) => `'${type}'`).join(',')}] as const`,
  )
  const sharedGraph = JSON.stringify(
    {
      type: Object.fromEntries([...sharedTypes, 'rogue', 'unknown'].map((type) => [type, 'x'])),
    },
    null,
    2,
  )
  put('shared/frontend/src/i18n/en/graph.json', sharedGraph)
  put('shared/frontend/src/i18n/ar/graph.json', sharedGraph)
  put('shared/frontend/src/i18n/en/quickswitcher.json', sharedGraph)
  put('shared/frontend/src/i18n/ar/quickswitcher.json', sharedGraph)

  put('generality-membership/caller.tsx', caller())
  put(
    'generality-noproof/caller.tsx',
    caller({ keySetup: ['const key = `type.${runtimeType}`'] }),
  )
  putPreRepair(put)

  for (const { identifier, form, fixture } of cells) {
    if (fixture.startsWith('NA:')) continue
    const scenario = scenarioFor(identifier, form)
    put(`${fixture}/caller.tsx`, scenario.negative)
    put(`${fixture}-control/caller.tsx`, scenario.control)
    for (const [path, body] of Object.entries(scenario.negativeExtras ?? {})) {
      put(`${fixture}/${path}`, body)
    }
    for (const [path, body] of Object.entries(scenario.controlExtras ?? {})) {
      put(`${fixture}-control/${path}`, body)
    }
  }
  return files
}

const inventory = (root = corpusRoot) => {
  const entries = new Map()
  const walk = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name)
      const key = relative(root, path).split('\\').join('/')
      const stat = lstatSync(path)
      if (stat.isDirectory()) walk(path)
      else entries.set(key, stat.isFile() ? readFileSync(path) : null)
    }
  }
  walk(root)
  return entries
}

const generatedInventory = (root = corpusRoot) =>
  new Map([...inventory(root)].filter(([path]) => !producerInputs.has(path)))

const checkCorpus = (root = corpusRoot) => {
  const cells = parseMatrix(root)
  const expected = buildCorpus(cells)
  const actual = generatedInventory(root)
  const drift = []
  for (const path of expected.keys()) {
    if (!actual.has(path)) drift.push(`missing ${path}`)
    else if (
      actual.get(path) == null ||
      !actual.get(path).equals(Buffer.from(expected.get(path)))
    ) {
      drift.push(`changed ${path}`)
    }
  }
  for (const path of actual.keys()) {
    if (!expected.has(path)) drift.push(`unexpected ${path}`)
  }
  return { cells, expected, actual, drift }
}

const writeCorpus = (root = corpusRoot) => {
  const cells = parseMatrix(root)
  const expected = buildCorpus(cells)
  for (const name of readdirSync(root)) {
    const path = join(root, name)
    if (lstatSync(path).isDirectory()) rmSync(path, { recursive: true, force: true })
  }
  for (const [path, body] of [...expected].sort(([left], [right]) => left.localeCompare(right))) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, body)
  }
  return checkCorpus(root)
}

const formatResult = ({ cells, expected }) => {
  const bytes = [...expected.values()].reduce((total, body) => total + Buffer.byteLength(body), 0)
  return `OK: matrix-cells=${cells.length} generated-files=${expected.size} generated-bytes=${bytes}`
}

const run = (argv = process.argv.slice(2)) => {
  if (argv.some((argument) => argument !== '--check')) {
    throw new Error(`usage: node generate-fixtures.mjs [--check]`)
  }
  const result = argv.includes('--check') ? checkCorpus() : writeCorpus()
  if (result.drift.length > 0) {
    for (const item of result.drift) console.error(`DRIFT: ${item}`)
    process.exitCode = 1
    return
  }
  console.log(formatResult(result))
}

const isMain =
  process.argv[1] != null &&
  realpathSync(resolve(process.argv[1])) === realpathSync(resolve(fileURLToPath(import.meta.url)))
if (isMain) {
  try {
    run()
  } catch (error) {
    console.error(`FAIL: ${error.message}`)
    process.exitCode = 1
  }
}

export {
  buildCorpus,
  checkCorpus,
  corpusRoot,
  formMechanisms,
  formatResult,
  inventory,
  parseMatrix,
  producerInputs,
  ruledRoots,
  writeCorpus,
}
