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
const producerInputs = new Set([
  matrixName,
  'generate-fixtures.mjs',
  'generate-fixtures.test.mjs',
])
const identifiers = new Set(['receiver', 'key', 'namespace', 'translator'])
const forms = new Set([
  'direct',
  'aliased-import',
  're-export',
  'destructured',
  'shadowed',
  'out-of-scope',
  'reassigned',
])
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

const route = (receiver = 'DOSSIER_CARD_TYPES', keyName = 'key') => `
  const ${keyName} = ${receiver}.includes(runtimeType)
    ? \`type.\${runtimeType}\`
    : 'type.unknown'`

const canonicalImports = `import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`

const caller = ({
  imports = canonicalImports,
  before = '',
  inside = '',
  receiver = 'DOSSIER_CARD_TYPES',
  keySetup = route(receiver),
  namespace = "'graph'",
  factory = 'useTranslation',
  key = 'key',
} = {}) => `${imports}
${before}
export function Fixture({ runtimeType }: { runtimeType: string }) {
${inside.length === 0 ? '' : `  ${inside}\n`}  const { t } = ${factory}(${namespace})
${keySetup}
  // @audit-line 7
  return t(${key}, runtimeType)
}`

const fakeFactory =
  "const useTranslation = (_namespace: string) => ({ t: (key: string) => key })"

const scenarioFor = (identifier, form) => {
  if (identifier === 'receiver' && form === 'direct') {
    return {
      negative: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain'`,
      }),
      control: caller(),
      negativeExtras: {
        'frontend/src/fixture/decoy-domain.ts':
          "export const DOSSIER_CARD_TYPES = ['country'] as const",
      },
    }
  }
  if (identifier === 'receiver' && form === 'aliased-import') {
    return {
      negative: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { DOSSIER_CARD_TYPES as TYPES } from '@/fixture/decoy-domain'`,
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
      control: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { DOSSIER_CARD_TYPES as TYPES } from '@/lib/dossier-type-guards'`,
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-domain.ts':
          "export const DOSSIER_CARD_TYPES = ['country'] as const",
      },
    }
  }
  if (identifier === 'receiver' && form === 're-export') {
    return {
      negative: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain-export'`,
      }),
      control: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { DOSSIER_CARD_TYPES } from '@/fixture/canonical-domain-export'`,
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-domain-export.ts':
          "export { DOSSIER_CARD_TYPES } from './decoy-domain'",
        'frontend/src/fixture/decoy-domain.ts':
          "export const DOSSIER_CARD_TYPES = ['country'] as const",
      },
      controlExtras: {
        'frontend/src/fixture/canonical-domain-export.ts':
          "export { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'",
      },
    }
  }
  if (identifier === 'receiver' && form === 'destructured') {
    return {
      negative: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport * as guards from '@/fixture/decoy-domain'`,
        before: 'const { DOSSIER_CARD_TYPES: TYPES } = guards',
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
      control: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport * as guards from '@/lib/dossier-type-guards'`,
        before: 'const { DOSSIER_CARD_TYPES: TYPES } = guards',
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-domain.ts':
          "export const DOSSIER_CARD_TYPES = ['country'] as const",
      },
    }
  }
  if (identifier === 'receiver' && form === 'shadowed') {
    return {
      negative: caller({
        imports: canonicalImports.replace(
          'DOSSIER_CARD_TYPES }',
          'DOSSIER_CARD_TYPES as CANONICAL_TYPES }',
        ),
        before: "const DOSSIER_CARD_TYPES = ['country'] as const",
      }),
      control: caller(),
    }
  }
  if (identifier === 'receiver' && form === 'out-of-scope') {
    return {
      negative: caller({
        before: '{ const TYPES = DOSSIER_CARD_TYPES; void TYPES }',
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
      control: caller({
        before: 'const TYPES = DOSSIER_CARD_TYPES',
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
    }
  }
  if (identifier === 'receiver' && form === 'reassigned') {
    return {
      negative: caller({
        before: "let TYPES = DOSSIER_CARD_TYPES\nTYPES = ['country'] as const",
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
      control: caller({
        before: 'let TYPES = DOSSIER_CARD_TYPES',
        receiver: 'TYPES',
        keySetup: route('TYPES'),
      }),
    }
  }

  if (identifier === 'key' && form === 'direct') {
    return {
      negative: caller({ keySetup: "  const key = `type.${runtimeType}`" }),
      control: caller(),
    }
  }
  if (identifier === 'key' && form === 'aliased-import') {
    return {
      negative: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { routeKey as key } from '@/fixture/decoy-key'`,
        keySetup: '',
      }),
      control: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { routeKey as key } from '@/fixture/canonical-key'`,
        keySetup: '',
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-key.ts':
          "const runtimeType = 'country'\nexport const routeKey = `type.${runtimeType}`",
      },
      controlExtras: {
        'frontend/src/fixture/canonical-key.ts':
          "import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'\nconst runtimeType = 'country'\nexport const routeKey = DOSSIER_CARD_TYPES.includes(runtimeType) ? `type.${runtimeType}` : 'type.unknown'",
      },
    }
  }
  if (identifier === 'key' && form === 're-export') {
    return {
      negative: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { routeKey as key } from '@/fixture/decoy-key-export'`,
        keySetup: '',
      }),
      control: caller({
        imports: `import { useTranslation } from 'react-i18next'\nimport { routeKey as key } from '@/fixture/canonical-key-export'`,
        keySetup: '',
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-key-export.ts': "export { routeKey } from './decoy-key'",
        'frontend/src/fixture/decoy-key.ts':
          "const runtimeType = 'country'\nexport const routeKey = `type.${runtimeType}`",
      },
      controlExtras: {
        'frontend/src/fixture/canonical-key-export.ts':
          "export { routeKey } from './canonical-key'",
        'frontend/src/fixture/canonical-key.ts':
          "import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'\nconst runtimeType = 'country'\nexport const routeKey = DOSSIER_CARD_TYPES.includes(runtimeType) ? `type.${runtimeType}` : 'type.unknown'",
      },
    }
  }
  if (identifier === 'key' && form === 'destructured') {
    return {
      negative: caller({
        keySetup:
          "  const routes = { key: `type.${runtimeType}` }\n  const { key } = routes",
      }),
      control: caller({
        keySetup: `  const routes = { key: DOSSIER_CARD_TYPES.includes(runtimeType) ? \`type.\${runtimeType}\` : 'type.unknown' }\n  const { key } = routes`,
      }),
    }
  }
  if (identifier === 'key' && form === 'shadowed') {
    return {
      negative: caller({
        keySetup: `  { const key = DOSSIER_CARD_TYPES.includes(runtimeType) ? \`type.\${runtimeType}\` : 'type.unknown'; void key }\n  const key = \`type.\${runtimeType}\``,
      }),
      control: caller(),
    }
  }
  if (identifier === 'key' && form === 'out-of-scope') {
    return {
      negative: caller({
        keySetup: `  { const key = DOSSIER_CARD_TYPES.includes(runtimeType) ? \`type.\${runtimeType}\` : 'type.unknown'; void key }`,
      }),
      control: caller(),
    }
  }
  if (identifier === 'key' && form === 'reassigned') {
    return {
      negative: caller({
        keySetup: `  let key = DOSSIER_CARD_TYPES.includes(runtimeType) ? \`type.\${runtimeType}\` : 'type.unknown'\n  key = \`type.\${runtimeType}\``,
      }),
      control: caller({
        keySetup: `  let key = DOSSIER_CARD_TYPES.includes(runtimeType) ? \`type.\${runtimeType}\` : 'type.unknown'`,
      }),
    }
  }

  if (identifier === 'namespace' && form === 'direct') {
    return { negative: caller({ namespace: "'missing'" }), control: caller() }
  }
  if (identifier === 'namespace' && form === 'aliased-import') {
    return {
      negative: caller({
        imports: `${canonicalImports}\nimport { GRAPH_NAMESPACE as namespace } from '@/fixture/decoy-namespace'`,
        namespace: 'namespace',
      }),
      control: caller({
        imports: `${canonicalImports}\nimport { GRAPH_NAMESPACE as namespace } from '@/fixture/canonical-namespace'`,
        namespace: 'namespace',
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-namespace.ts': "export const GRAPH_NAMESPACE = 'missing'",
      },
      controlExtras: {
        'frontend/src/fixture/canonical-namespace.ts': "export const GRAPH_NAMESPACE = 'graph'",
      },
    }
  }
  if (identifier === 'namespace' && form === 're-export') {
    return {
      negative: caller({
        imports: `${canonicalImports}\nimport { GRAPH_NAMESPACE as namespace } from '@/fixture/decoy-namespace-export'`,
        namespace: 'namespace',
      }),
      control: caller({
        imports: `${canonicalImports}\nimport { GRAPH_NAMESPACE as namespace } from '@/fixture/canonical-namespace-export'`,
        namespace: 'namespace',
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-namespace-export.ts':
          "export { GRAPH_NAMESPACE } from './decoy-namespace'",
        'frontend/src/fixture/decoy-namespace.ts': "export const GRAPH_NAMESPACE = 'missing'",
      },
      controlExtras: {
        'frontend/src/fixture/canonical-namespace-export.ts':
          "export { GRAPH_NAMESPACE } from './canonical-namespace'",
        'frontend/src/fixture/canonical-namespace.ts': "export const GRAPH_NAMESPACE = 'graph'",
      },
    }
  }
  if (identifier === 'namespace' && form === 'destructured') {
    return {
      negative: caller({
        before: "const namespaces = { graph: 'missing' }\nconst { graph: namespace } = namespaces",
        namespace: 'namespace',
      }),
      control: caller({
        before: "const namespaces = { graph: 'graph' }\nconst { graph: namespace } = namespaces",
        namespace: 'namespace',
      }),
    }
  }
  if (identifier === 'namespace' && form === 'shadowed') {
    return {
      negative: caller({
        before: "const graphNamespace = 'graph'",
        namespace: "(() => { const graphNamespace = 'missing'; return graphNamespace })()",
      }),
      control: caller({ before: "const graphNamespace = 'graph'", namespace: 'graphNamespace' }),
    }
  }
  if (identifier === 'namespace' && form === 'out-of-scope') {
    return {
      negative: caller({
        before: "{ const graphNamespace = 'graph'; void graphNamespace }",
        namespace: 'graphNamespace',
      }),
      control: caller({ before: "const graphNamespace = 'graph'", namespace: 'graphNamespace' }),
    }
  }
  if (identifier === 'namespace' && form === 'reassigned') {
    return {
      negative: caller({
        before: "let graphNamespace = 'graph'\ngraphNamespace = 'missing'",
        namespace: 'graphNamespace',
      }),
      control: caller({ before: "let graphNamespace = 'graph'", namespace: 'graphNamespace' }),
    }
  }

  if (identifier === 'translator' && form === 'direct') {
    return {
      negative: caller({
        imports: `import { useTranslation as realUseTranslation } from 'react-i18next'\nimport { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`,
        inside: fakeFactory,
      }),
      control: caller(),
    }
  }
  if (identifier === 'translator' && form === 'aliased-import') {
    return {
      negative: caller({
        imports: `import { useTranslation as useI18n } from '@/fixture/decoy-i18n'\nimport { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`,
        factory: 'useI18n',
      }),
      control: caller({
        imports: `import { useTranslation as useI18n } from 'react-i18next'\nimport { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`,
        factory: 'useI18n',
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-i18n.ts': normalizeBody(fakeFactory.replace('const ', 'export const ')),
      },
    }
  }
  if (identifier === 'translator' && form === 're-export') {
    return {
      negative: caller({
        imports: `import { useTranslation } from '@/fixture/decoy-i18n-export'\nimport { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`,
      }),
      control: caller({
        imports: `import { useTranslation } from '@/fixture/canonical-i18n-export'\nimport { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`,
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-i18n-export.ts':
          "export { useTranslation } from './decoy-i18n'",
        'frontend/src/fixture/decoy-i18n.ts': fakeFactory.replace('const ', 'export const '),
      },
      controlExtras: {
        'frontend/src/fixture/canonical-i18n-export.ts':
          "export { useTranslation } from 'react-i18next'",
      },
    }
  }
  if (identifier === 'translator' && form === 'destructured') {
    return {
      negative: caller({
        imports: `import * as i18n from '@/fixture/decoy-i18n'\nimport { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`,
        before: 'const { useTranslation: factory } = i18n',
        factory: 'factory',
      }),
      control: caller({
        imports: `import * as i18n from 'react-i18next'\nimport { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'`,
        before: 'const { useTranslation: factory } = i18n',
        factory: 'factory',
      }),
      negativeExtras: {
        'frontend/src/fixture/decoy-i18n.ts': fakeFactory.replace('const ', 'export const '),
      },
    }
  }
  if (identifier === 'translator' && form === 'shadowed') {
    return { negative: caller({ inside: fakeFactory }), control: caller() }
  }
  if (identifier === 'translator' && form === 'out-of-scope') {
    return {
      negative: caller({
        before: '{ const factory = useTranslation; void factory }',
        factory: 'factory',
      }),
      control: caller({ before: 'const factory = useTranslation', factory: 'factory' }),
    }
  }
  if (identifier === 'translator' && form === 'reassigned') {
    return {
      negative: caller({
        before: `let factory = useTranslation\nfactory = (_namespace: string) => ({ t: (key: string) => key })`,
        factory: 'factory',
      }),
      control: caller({ before: 'let factory = useTranslation', factory: 'factory' }),
    }
  }

  throw new Error(`no derivation for matrix cell ${identifier}/${form}`)
}

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
      ['country', 'organization', 'forum', 'engagement', 'topic', 'working_group', 'person', 'elected_official'].map(
        (key) => [key, 'x'],
      ),
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
    'common.json': { navigation: Object.fromEntries(['dashboard', 'dossiers', 'workflow', 'calendar', 'reports'].map((key) => [key, 'x'])) },
    'empty-states.json': { list },
    'engagements.json': { filter: Object.fromEntries(['all', 'meeting', 'travel'].map((key) => [key, 'x'])) },
    'graph.json': graph,
    'keyboard-shortcuts.json': {
      quickActions: Object.fromEntries(
        ['analyzeForumMembership', 'analyzeSharedCommittees', 'analyzeEngagementChains', 'analyzeShortestPath'].map(
          (key) => [key, 'x'],
        ),
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

  put('generality-membership/caller.tsx', caller())
  put(
    'generality-noproof/caller.tsx',
    caller({ keySetup: "  const key = `type.${runtimeType}`" }),
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
    else if (actual.get(path) == null || !actual.get(path).equals(Buffer.from(expected.get(path)))) {
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
  formatResult,
  inventory,
  parseMatrix,
  producerInputs,
  ruledRoots,
  writeCorpus,
}
