#!/usr/bin/env node
/**
 * AST-backed audit for fallback-bearing dynamic i18n keys.
 *
 * This is intentionally narrow: it grades the two ruled AR-04a dynamic profiles
 * from RULING-P99-105, and fails closed when a fallback-bearing nonliteral call
 * inside those profiles cannot be assigned a closed production domain.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const scriptRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['en', 'ar']
const LIST_FILE = 'frontend/src/components/empty-states/ListEmptyState.tsx'
const LANE3_FILES = [
  'frontend/src/components/keyboard-shortcuts/CommandPalette.tsx',
  'frontend/src/components/list-page/DossierTable.tsx',
  'frontend/src/components/list-page/EngagementsList.tsx',
  'frontend/src/components/modern-nav/IconRail/IconRail.tsx',
  'frontend/src/components/relationships/AdvancedGraphVisualization.tsx',
  'frontend/src/components/relationships/AnalyticQueryPicker.tsx',
  'frontend/src/components/relationships/AnalyticResultView.tsx',
]
const PROFILE_FILES = {
  list: [LIST_FILE],
  lane3: LANE3_FILES,
  'ar04-pre-repair': [LIST_FILE, ...LANE3_FILES],
  'ar04-live': [LIST_FILE, ...LANE3_FILES],
}

const normalizePath = (value) => value.split(sep).join('/').replace(/^\.\//, '')
const lineAt = (source, offset) => source.slice(0, offset).split('\n').length
const textOf = (source, node) => source.slice(node.getStart(), node.getEnd())
const GRAPH_UNKNOWN_TYPE = 'unknown'
const EXPECTED_LIST_MISSING = new Set([
  ...['commitment', 'document', 'dossier', 'event', 'generic', 'mou', 'position', 'task'].map(
    (entity) => `list.${entity}.cta`,
  ),
  ...['elected_official', 'topic', 'work_item', 'working_group'].flatMap((entity) =>
    ['hint', 'firstDescription', 'createFirst', 'create', 'firstTitle', 'import'].map(
      (leaf) => `list.${entity}.${leaf}`,
    ),
  ),
])

const parseArgs = (argv) => {
  let root = scriptRepoRoot
  let rootSeen = false
  let profile = 'ar04-pre-repair'
  let selfCheck = false
  let json = false
  const expects = {}

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--self-check') selfCheck = true
    else if (argument === '--json') json = true
    else if (argument === '--profile') profile = argv[++index]
    else if (argument.startsWith('--expect-')) {
      const name = argument.slice('--expect-'.length).replaceAll('-', '')
      const raw = argv[++index]
      if (raw == null || raw.startsWith('--')) throw new Error(`${argument} requires a number`)
      expects[name] = Number(raw)
    } else if (argument.startsWith('--')) {
      throw new Error(`unknown option: ${argument}`)
    } else if (rootSeen) {
      throw new Error(`unexpected positional argument: ${argument}`)
    } else {
      root = resolve(argument)
      rootSeen = true
    }
  }

  return { root, profile, selfCheck, json, expects }
}

const parseSource = (file, source) =>
  ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

const readSource = (root, repoPath) => {
  const path = join(root, repoPath)
  if (!existsSync(path)) throw new Error(`missing profile file: ${repoPath}`)
  return readFileSync(path, 'utf8')
}

const parseJsonFile = (path) => {
  if (!existsSync(path)) throw new Error(`missing locale bundle: ${path}`)
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`malformed locale bundle: ${path}: ${error.message}`)
  }
}

const loadBundles = (root) =>
  Object.fromEntries(
    LOCALES.map((locale) => {
      const localeDirectory = join(root, 'frontend/src/i18n', locale)
      if (!existsSync(localeDirectory) || !statSync(localeDirectory).isDirectory()) {
        throw new Error(`missing locale directory: ${localeDirectory}`)
      }
      return [
        locale,
        Object.fromEntries(
          readdirSync(localeDirectory)
            .filter((entry) => entry.endsWith('.json'))
            .sort()
            .map((entry) => [
              entry.replace(/\.json$/, ''),
              parseJsonFile(join(localeDirectory, entry)),
            ]),
        ),
      ]
    }),
  )

const bundleNamespace = (namespace) => (namespace === 'translation' ? 'common' : namespace)

const hasLeaf = (bundles, locale, namespace, key) => {
  let current = bundles[locale]?.[bundleNamespace(namespace)]
  if (current == null) return false
  for (const segment of key.split('.')) {
    if (current == null || typeof current !== 'object' || !(segment in current)) return false
    current = current[segment]
  }
  return typeof current === 'string'
}

const resolveKey = (bundles, namespaces, key) => {
  const colon = key.indexOf(':')
  const explicitNamespace = colon === -1 ? null : key.slice(0, colon)
  const leaf = colon === -1 ? key : key.slice(colon + 1)
  const candidates = explicitNamespace ? [explicitNamespace] : namespaces
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      candidates.some((namespace) => hasLeaf(bundles, locale, namespace, leaf)),
    ]),
  )
}

const stringArg = (node) => {
  if (node == null) return null
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return null
}

const arrayStringArg = (node) => {
  if (node == null || !ts.isArrayLiteralExpression(node)) return null
  const values = []
  for (const element of node.elements) {
    const value = stringArg(element)
    if (value == null) return null
    values.push(value)
  }
  return values
}

const propertyName = (name) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text
  }
  if (ts.isComputedPropertyName(name)) return stringArg(name.expression)
  return null
}

const findUseTranslationBindings = (sf, source) => {
  const bindings = new Map()
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      textOf(source, node.initializer.expression) === 'useTranslation'
    ) {
      const firstArg = node.initializer.arguments[0]
      const secondArg = node.initializer.arguments[1]
      const stringNamespace = stringArg(firstArg)
      const arrayNamespace = arrayStringArg(firstArg)
      const nsMode =
        secondArg && ts.isObjectLiteralExpression(secondArg)
          ? stringArg(objectProperty(secondArg, 'nsMode'))
          : null
      const namespaces = arrayNamespace
        ? nsMode === 'fallback'
          ? arrayNamespace
          : [arrayNamespace[0]]
        : stringNamespace != null
          ? [stringNamespace]
          : ['translation']
      for (const element of node.name.elements) {
        const property = element.propertyName
          ? textOf(source, element.propertyName)
          : textOf(source, element.name)
        if (property === 't' && ts.isIdentifier(element.name)) {
          bindings.set(element.name.text, {
            namespaces,
            supported: element.name.text === 't',
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return bindings
}

const objectProperty = (node, name) => {
  if (!ts.isObjectLiteralExpression(node)) return null
  for (const prop of node.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      !ts.isComputedPropertyName(prop.name) &&
      propertyName(prop.name) === name
    ) {
      return prop.initializer
    }
  }
  return null
}

/**
 * Only a transparent object literal can be proven interpolation-only. Shorthand
 * defaultValue, computed keys, methods, and spreads are deliberately unsafe:
 * each can conceal a fallback that this instrument must not silently exclude.
 */
const optionShape = (node) => {
  if (node == null || !ts.isObjectLiteralExpression(node)) return 'positional-fallback'
  let hasDefault = false
  for (const prop of node.properties) {
    if (ts.isSpreadAssignment(prop) || ts.isMethodDeclaration(prop)) return 'unsafe-options'
    if (ts.isShorthandPropertyAssignment(prop)) {
      if (prop.name.text === 'defaultValue') return 'unsafe-options'
      continue
    }
    if (!ts.isPropertyAssignment(prop)) return 'unsafe-options'
    if (ts.isComputedPropertyName(prop.name)) return 'unsafe-options'
    const name = propertyName(prop.name)
    if (name == null) return 'unsafe-options'
    if (name === 'defaultValue') hasDefault = true
  }
  return hasDefault ? 'fallback-options' : 'interpolation-only'
}

const isInterpolationOnlyOptions = (node) => optionShape(node) === 'interpolation-only'

const isFallbackBearing = (args) => {
  const second = args[1]
  if (second == null) return false
  return optionShape(second) !== 'interpolation-only'
}

const namespaceOverride = (args, bindingNamespaces) => {
  for (const arg of args.slice(1)) {
    if (!ts.isObjectLiteralExpression(arg)) continue
    const ns = objectProperty(arg, 'ns')
    const value = stringArg(ns)
    if (value != null) return [value]
  }
  return bindingNamespaces
}

const isNonliteral = (node) =>
  node != null && !ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)

const templateLeaf = (source, node) => {
  if (!ts.isTemplateExpression(node)) return null
  if (node.templateSpans.length !== 1) return null
  const head = node.head.text
  const tail = node.templateSpans[0].literal.text
  const expression = textOf(source, node.templateSpans[0].expression)
  return { head, expression, tail }
}

const extractTypeUnion = (root, repoPath, typeName) => {
  const source = readSource(root, repoPath)
  const sf = parseSource(repoPath, source)
  let values = null
  const visit = (node) => {
    if (values != null) return
    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === typeName &&
      ts.isUnionTypeNode(node.type)
    ) {
      values = node.type.types.map((type) =>
        ts.isLiteralTypeNode(type) ? stringArg(type.literal) : null,
      )
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (!Array.isArray(values) || values.some((value) => value == null) || values.length === 0) {
    throw new Error(`empty or unsupported domain: ${repoPath} ${typeName}`)
  }
  return values
}

const unwrapExpression = (node) => {
  let current = node
  while (current && (ts.isAsExpression(current) || ts.isSatisfiesExpression(current)))
    current = current.expression
  return current
}

const extractConstStringArray = (root, repoPath, constName) => {
  const source = readSource(root, repoPath)
  const sf = parseSource(repoPath, source)
  const arrays = new Map()
  const toValues = (initializer) => {
    const expression = unwrapExpression(initializer)
    if (!expression || !ts.isArrayLiteralExpression(expression)) return null
    const out = []
    for (const element of expression.elements) {
      if (ts.isSpreadElement(element) && ts.isIdentifier(element.expression)) {
        const spreadValues = arrays.get(element.expression.text)
        if (!spreadValues) return null
        out.push(...spreadValues)
      } else {
        const value = stringArg(element)
        if (value == null) return null
        out.push(value)
      }
    }
    return out
  }
  let values = null
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const maybeValues = toValues(node.initializer)
      if (maybeValues) arrays.set(node.name.text, maybeValues)
      if (node.name.text === constName) values = maybeValues
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (!Array.isArray(values) || values.some((value) => value == null) || values.length === 0) {
    throw new Error(`empty or unsupported domain: ${repoPath} ${constName}`)
  }
  return values
}

const extractObjectStringValues = (root, repoPath, constName, valueKey) => {
  const source = readSource(root, repoPath)
  const sf = parseSource(repoPath, source)
  let values = null
  const valuesFromObject = (object) =>
    object.properties.map((prop) => {
      if (!ts.isPropertyAssignment(prop)) return null
      const initializer = unwrapExpression(prop.initializer)
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) return null
      return stringArg(objectProperty(initializer, valueKey))
    })
  const valuesFromArray = (array) =>
    array.elements.map((element) => {
      const initializer = unwrapExpression(element)
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) return null
      return stringArg(objectProperty(initializer, valueKey))
    })
  const visit = (node) => {
    if (values != null) return
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === constName
    ) {
      const initializer = unwrapExpression(node.initializer)
      if (!initializer) return
      if (ts.isObjectLiteralExpression(initializer)) values = valuesFromObject(initializer)
      else if (ts.isArrayLiteralExpression(initializer)) values = valuesFromArray(initializer)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (!Array.isArray(values) || values.some((value) => value == null) || values.length === 0) {
    throw new Error(`empty or unsupported domain: ${repoPath} ${constName}.${valueKey}`)
  }
  return values
}

const extractRecordStringValues = (root, repoPath, constName) => {
  const source = readSource(root, repoPath)
  const sf = parseSource(repoPath, source)
  let values = null
  const visit = (node) => {
    if (values != null) return
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === constName
    ) {
      const initializer = unwrapExpression(node.initializer)
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) return
      values = initializer.properties.map((prop) => {
        if (!ts.isPropertyAssignment(prop)) return null
        return stringArg(prop.initializer)
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (!Array.isArray(values) || values.some((value) => value == null) || values.length === 0) {
    throw new Error(`empty or unsupported domain: ${repoPath} ${constName}`)
  }
  return values
}

const extractCountLineKeys = (root, repoPath) => {
  const source = readSource(root, repoPath)
  const sf = parseSource(repoPath, source)
  const values = []
  let inRenderCountLine = false
  const visit = (node) => {
    const wasInRenderCountLine = inRenderCountLine
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'renderCountLine')
      inRenderCountLine = true
    if (
      inRenderCountLine &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'countLine'
    ) {
      values.push(stringArg(node.arguments[1]))
    }
    ts.forEachChild(node, visit)
    inRenderCountLine = wasInRenderCountLine
  }
  visit(sf)
  if (values.some((value) => value == null) || values.length === 0) {
    throw new Error(`empty or unsupported domain: ${repoPath} renderCountLine`)
  }
  return values
}

const domainsFor = (root) => ({
  listEntities: extractTypeUnion(root, LIST_FILE, 'EntityType'),
  graphDisplayTypes: extractConstStringArray(
    root,
    'frontend/src/lib/dossier-type-guards.ts',
    'DOSSIER_CARD_TYPES',
  ),
  graphRelationshipTypes: extractTypeUnion(
    root,
    'frontend/src/types/relationship.types.ts',
    'DossierRelationshipType',
  ),
  sensitivityKeys: [
    ...extractObjectStringValues(
      root,
      'frontend/src/components/list-page/sensitivity.ts',
      'SENSITIVITY_CHIP',
      'labelKey',
    ),
    'sensitivity.unknown',
  ],
  analyzeKeys: extractRecordStringValues(
    root,
    'frontend/src/components/keyboard-shortcuts/CommandPalette.tsx',
    'analyzeLabelKey',
  ),
  engagementFilterKeys: extractObjectStringValues(
    root,
    'frontend/src/components/list-page/EngagementsList.tsx',
    'FILTERS',
    'labelKey',
  ),
  analyticTemplateKeys: extractObjectStringValues(
    root,
    'frontend/src/components/relationships/AnalyticQueryPicker.tsx',
    'TEMPLATES',
    'labelKey',
  ),
  analyticCountKeys: extractCountLineKeys(
    root,
    'frontend/src/components/relationships/AnalyticResultView.tsx',
  ),
  iconRailKeys: extractObjectStringValues(
    root,
    'frontend/src/components/modern-nav/IconRail/IconRail.tsx',
    'defaultItems',
    'tooltipKey',
  ),
})

const unwrapNode = (node) => {
  let current = node
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isNonNullExpression(current))
  ) {
    current = current.expression
  }
  return current
}

const enclosingFunction = (node) => {
  for (let current = node.parent; current != null; current = current.parent) {
    if (ts.isFunctionLike(current)) return current
  }
  return null
}

const containsNode = (root, predicate) => {
  let found = false
  const visit = (node) => {
    if (found) return
    if (predicate(node)) {
      found = true
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

/**
 * The cluster display domain is special: the canonical values alone do not
 * close an arbitrary runtime string. The same caller must prove membership in
 * the imported DOSSIER_CARD_TYPES constant and route the negative branch to the
 * explicit graph leaf type.unknown.
 */
const provesClosedClusterDomain = (sf, source, call) => {
  const importedCanonicalSet = sf.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      stringArg(statement.moduleSpecifier) === '@/lib/dossier-type-guards' &&
      statement.importClause?.namedBindings != null &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.some(
        (element) => (element.propertyName ?? element.name).text === 'DOSSIER_CARD_TYPES',
      ),
  )
  const caller = enclosingFunction(call)
  if (!importedCanonicalSet || caller == null) return false

  const first = unwrapNode(call.arguments[0])
  let route = ts.isConditionalExpression(first) ? first : null
  if (route == null && ts.isIdentifier(first)) {
    containsNode(caller, (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === first.text
      ) {
        const initializer = unwrapNode(node.initializer)
        if (initializer != null && ts.isConditionalExpression(initializer)) route = initializer
      }
      return false
    })
  }
  if (route == null) return false

  const branches = [unwrapNode(route.whenTrue), unwrapNode(route.whenFalse)]
  const unknownIndex = branches.findIndex(
    (branch) => stringArg(branch) === `type.${GRAPH_UNKNOWN_TYPE}`,
  )
  if (unknownIndex === -1) return false
  const canonicalBranch = branches[unknownIndex === 0 ? 1 : 0]
  if (
    !ts.isTemplateExpression(canonicalBranch) ||
    canonicalBranch.head.text !== 'type.' ||
    canonicalBranch.templateSpans.length !== 1 ||
    canonicalBranch.templateSpans[0].literal.text !== ''
  ) {
    return false
  }
  const routedValue = unwrapNode(canonicalBranch.templateSpans[0].expression)

  let memberValue = null
  containsNode(route.condition, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'includes' &&
      ts.isIdentifier(unwrapNode(node.expression.expression)) &&
      unwrapNode(node.expression.expression).text === 'DOSSIER_CARD_TYPES' &&
      node.arguments.length === 1
    ) {
      memberValue = unwrapNode(node.arguments[0])
      return true
    }
    return false
  })
  return memberValue != null && textOf(source, memberValue) === textOf(source, routedValue)
}

const classifyCall = ({ root, repoPath, source, node, namespaces, domains }) => {
  const first = node.arguments[0]
  const firstText = textOf(source, first)
  const fileBase = repoPath.split('/').at(-1)
  const template = templateLeaf(source, first)

  const mk = (kind, keys, domainSource, options = {}) => ({
    kind,
    keys,
    domainSource,
    namespaces: options.namespaces ?? namespaces,
    countInListMissing: options.countInListMissing ?? true,
    clusterProbe: options.clusterProbe ?? false,
    requiredKeys: options.requiredKeys ?? null,
    closed: options.closed ?? true,
  })

  if (
    repoPath === LIST_FILE &&
    template?.head === 'list.' &&
    template.expression === 'translationKey'
  ) {
    const leaf = template.tail.replace(/^\./, '')
    if (leaf.length === 0) return null
    return mk(
      `list.${leaf}`,
      domains.listEntities.map((entity) => `list.${entity}.${leaf}`),
      'ListEmptyState EntityType union (complete caller cross-product)',
    )
  }

  if (fileBase === 'CommandPalette.tsx' && firstText === 'analyzeLabelKey[analyze.queryType]') {
    return mk('lane3.commandPalette.analyze', domains.analyzeKeys, 'CommandPalette analyzeLabelKey')
  }

  if (
    fileBase === 'DossierTable.tsx' &&
    firstText === 'sensitivityLabelKey(row.sensitivity_level)'
  ) {
    return mk(
      'lane3.dossierTable.sensitivity',
      domains.sensitivityKeys,
      'SENSITIVITY_CHIP + unknown',
    )
  }

  if (fileBase === 'EngagementsList.tsx' && firstText === 'f.labelKey') {
    return mk(
      'lane3.engagementsList.filterPill',
      domains.engagementFilterKeys,
      'EngagementsList FILTERS',
    )
  }

  if (fileBase === 'IconRail.tsx' && firstText === 'item.tooltipKey') {
    return mk('lane3.iconRail.defaultItems', domains.iconRailKeys, 'IconRail defaultItems')
  }

  if (fileBase === 'AnalyticQueryPicker.tsx' && firstText === 'tpl.labelKey') {
    return mk(
      'lane3.analyticQueryPicker.templates',
      domains.analyticTemplateKeys,
      'AnalyticQueryPicker TEMPLATES',
    )
  }

  if (fileBase === 'AnalyticResultView.tsx' && firstText === 'key') {
    return mk(
      'lane3.analyticResultView.countLine',
      domains.analyticCountKeys,
      'AnalyticResultView renderCountLine switch',
    )
  }

  const graphDisplayTypes = domains.graphDisplayTypes ?? []
  const graphClusterKeys = [
    ...graphDisplayTypes.map((type) => `type.${type}`),
    `type.${GRAPH_UNKNOWN_TYPE}`,
  ]

  if (fileBase === 'AdvancedGraphVisualization.tsx' && firstText === 'data.clusterType') {
    return mk(
      'lane3.advancedGraph.cluster.unprefixed',
      graphDisplayTypes,
      'UNCLASSIFIED diagnostic against DOSSIER_CARD_TYPES; the caller has no canonical-membership proof and no type.unknown branch',
      {
        clusterProbe: true,
        requiredKeys: graphDisplayTypes.map((type) => `type.${type}`),
        closed: false,
      },
    )
  }

  if (
    fileBase === 'AdvancedGraphVisualization.tsx' &&
    provesClosedClusterDomain(node.getSourceFile(), source, node)
  ) {
    return mk(
      'lane3.advancedGraph.cluster.routed',
      graphClusterKeys,
      'AST-proven DOSSIER_CARD_TYPES membership plus explicit type.unknown branch',
    )
  }

  if (
    ['AdvancedGraphVisualization.tsx', 'AnalyticResultView.tsx'].includes(fileBase) &&
    template?.head === 'type.' &&
    template.tail === ''
  ) {
    return mk(
      `lane3.${fileBase.replace(/\.tsx$/, '')}.graphType.${lineAt(source, node.getStart())}`,
      domains.graphDisplayTypes.map((type) => `type.${type}`),
      'DOSSIER_CARD_TYPES display domain',
    )
  }

  if (
    fileBase === 'AdvancedGraphVisualization.tsx' &&
    template?.head === 'relationship.' &&
    template.tail === ''
  ) {
    return mk(
      `lane3.advancedGraph.relationship.${lineAt(source, node.getStart())}`,
      domains.graphRelationshipTypes.map((type) => `relationship.${type}`),
      'DossierRelationshipType union',
    )
  }

  return null
}

const collectCalls = (root, profile) => {
  const profileFiles = PROFILE_FILES[profile]
  if (profileFiles == null) throw new Error(`unknown profile: ${profile}`)
  const domains = domainsFor(root)
  const calls = []
  const unclassified = []
  const interpolationOnly = []
  const fallbackSites = []

  for (const repoPath of profileFiles) {
    const source = readSource(root, repoPath)
    const sf = parseSource(repoPath, source)
    const bindings = findUseTranslationBindings(sf, source)
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        bindings.has(node.expression.text)
      ) {
        const first = node.arguments[0]
        const binding = bindings.get(node.expression.text)
        const namespaces = namespaceOverride([...node.arguments], binding.namespaces)
        if (isNonliteral(first)) {
          if (isInterpolationOnlyOptions(node.arguments[1])) {
            interpolationOnly.push({
              file: repoPath,
              line: lineAt(source, node.getStart()),
              expression: textOf(source, node),
            })
          } else if (isFallbackBearing([...node.arguments])) {
            const site = {
              file: repoPath,
              line: lineAt(source, node.getStart()),
              expression: textOf(source, node),
              namespaces,
            }
            const aliasClassification = binding.supported
              ? null
              : classifyCall({ root, repoPath, source, node, namespaces, domains })
            // The ruled lane-3 population is the 13 review-named shapes. Other
            // aliased translators in the same large file remain outside that
            // controlled profile, but aliasing one of the ruled shapes is a
            // fail-closed error rather than a silent zero.
            if (!binding.supported && aliasClassification == null) {
              ts.forEachChild(node, visit)
              return
            }
            fallbackSites.push(site)
            if (!binding.supported) {
              unclassified.push({
                ...site,
                family: 'unclassified.translator-binding',
                reason: `unsupported useTranslation translator binding: ${node.expression.text}`,
              })
              ts.forEachChild(node, visit)
              return
            }
            if (optionShape(node.arguments[1]) === 'unsafe-options') {
              unclassified.push({
                ...site,
                family: 'unclassified.opaque-options',
                reason:
                  'defaultValue may be hidden by shorthand, computed, method, or spread option syntax',
              })
              ts.forEachChild(node, visit)
              return
            }
            const classified =
              aliasClassification ??
              classifyCall({ root, repoPath, source, node, namespaces, domains })
            if (classified == null || classified.keys.length === 0) {
              unclassified.push({
                ...site,
                family: 'unclassified.unknown-shape',
                reason: classified == null ? 'unknown call shape' : 'empty domain',
              })
            } else {
              const call = {
                ...site,
                first: textOf(source, first),
                ...classified,
              }
              calls.push(call)
              site.family = classified.kind
              if (!classified.closed) {
                unclassified.push({
                  ...site,
                  family: classified.kind,
                  reason:
                    'domain is not closed by canonical-membership proof and an explicit type.unknown branch',
                })
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }

  return { calls, unclassified, interpolationOnly, fallbackSites, domains }
}

const auditProfile = (root, profile = 'ar04-pre-repair') => {
  const bundles = loadBundles(root)
  const { calls, unclassified, interpolationOnly, fallbackSites } = collectCalls(root, profile)
  const rows = []
  for (const call of calls) {
    for (const key of call.keys) {
      const resolved = resolveKey(bundles, call.namespaces, key)
      const requiredKey = call.requiredKeys?.[call.keys.indexOf(key)] ?? null
      const required =
        requiredKey == null ? null : resolveKey(bundles, call.namespaces, requiredKey)
      rows.push({
        profile: call.file === LIST_FILE ? 'list' : 'lane3',
        family: call.kind,
        file: call.file,
        line: call.line,
        key,
        requiredKey,
        namespaces: call.namespaces.map(bundleNamespace),
        domainSource: call.domainSource,
        closedDomain: call.closed,
        en: resolved.en ? 'ok' : 'MISS',
        ar: resolved.ar ? 'ok' : 'MISS',
        requiredEn: required == null ? null : required.en ? 'ok' : 'MISS',
        requiredAr: required == null ? null : required.ar ? 'ok' : 'MISS',
        routeMiss:
          requiredKey != null &&
          requiredKey !== key &&
          required?.en === true &&
          required?.ar === true,
        countInListMissing: call.countInListMissing,
        clusterProbe: call.clusterProbe && key !== GRAPH_UNKNOWN_TYPE,
        unknownSentinelProbe: call.clusterProbe && key === GRAPH_UNKNOWN_TYPE,
      })
    }
  }

  const listSites = fallbackSites.filter((call) => call.file === LIST_FILE)
  const lane3Sites = fallbackSites.filter((call) => call.file !== LIST_FILE)
  const listRows = rows.filter((row) => row.profile === 'list')
  const clusterRows = rows.filter((row) => row.clusterProbe)
  const missingBoth = (row) => row.en === 'MISS' && row.ar === 'MISS'
  const requiredNamespaces = [
    ...new Set(fallbackSites.flatMap((call) => call.namespaces.map(bundleNamespace))),
  ]
  const missingRequiredBundles = LOCALES.flatMap((locale) =>
    requiredNamespaces
      .filter((namespace) => bundles[locale]?.[namespace] == null)
      .map((namespace) => ({ locale, namespace })),
  )
  const result = {
    root,
    profile,
    locales: LOCALES,
    productionEntryPoint: 'scripts/i18n-dynamic-key-audit.mjs',
    parser: 'typescript AST CallExpression',
    fallbackLng: false,
    files: PROFILE_FILES[profile],
    callerPopulations: {
      listSites: listSites.length,
      listFamilies: new Set(listSites.map((call) => call.family)).size,
      listLeaves: listRows.length,
      lane3Sites: lane3Sites.length,
      lane3Families: new Set(lane3Sites.map((call) => call.family)).size,
    },
    counts: {
      rows: rows.length,
      missingBoth: rows.filter(missingBoth).length,
      listMissingBoth: listRows.filter((row) => row.countInListMissing && missingBoth(row)).length,
      clusterMissingBoth: clusterRows.filter((row) => row.routeMiss || missingBoth(row)).length,
      missingEn: rows.filter((row) => row.en === 'MISS' || row.routeMiss).length,
      missingAr: rows.filter((row) => row.ar === 'MISS' || row.routeMiss).length,
      unclassified: unclassified.length,
      interpolationOnly: interpolationOnly.length,
      missingRequiredBundles: missingRequiredBundles.length,
    },
    rows,
    unclassified,
    interpolationOnly,
    fallbackSites,
    missingRequiredBundles,
  }
  return result
}

const evaluateExpectations = (result, expects) => {
  const failures = []
  const checks = {
    listsites: result.callerPopulations.listSites,
    listleaves: result.callerPopulations.listLeaves,
    lane3sites: result.callerPopulations.lane3Sites,
    listmissingboth: result.counts.listMissingBoth,
    clustermissingboth: result.counts.clusterMissingBoth,
    unclassified: result.counts.unclassified,
    missingen: result.counts.missingEn,
    missingar: result.counts.missingAr,
  }
  for (const [name, expected] of Object.entries(expects)) {
    if (!(name in checks)) failures.push(`unknown expectation: ${name}`)
    else if (checks[name] !== expected)
      failures.push(`${name}: expected ${expected}, got ${checks[name]}`)
  }
  return failures
}

const rowHasFailure = (row) => row.en === 'MISS' || row.ar === 'MISS' || row.routeMiss

const isExpectedPreRepairDefect = (row) =>
  (row.profile === 'list' && EXPECTED_LIST_MISSING.has(row.key)) ||
  (row.family === 'lane3.advancedGraph.cluster.unprefixed' && row.clusterProbe && row.routeMiss)

const isExpectedPreRepairUnclassified = (result) =>
  result.unclassified.length === 1 &&
  result.unclassified[0].family === 'lane3.advancedGraph.cluster.unprefixed'

const runSelfCheck = () => {
  const root = scriptRepoRoot
  const syntheticBundles = {
    en: { fixture: { ok: { leaf: 'English' }, prefixOnly: {}, enOnly: { leaf: 'English only' } } },
    ar: { fixture: { ok: { leaf: 'العربية' }, prefixOnly: {}, arOnly: { leaf: 'العربية فقط' } } },
  }
  const resolvedLeaf = resolveKey(syntheticBundles, ['fixture'], 'ok.leaf')
  const missingLeaf = resolveKey(syntheticBundles, ['fixture'], 'prefixOnly.leaf')
  const enOnly = resolveKey(syntheticBundles, ['fixture'], 'enOnly.leaf')
  const arOnly = resolveKey(syntheticBundles, ['fixture'], 'arOnly.leaf')
  const fixtureSource = `
    const { t } = useTranslation('fixture')
    const type = 'ok'
    t(\`ok.\${type}\`, { count: 1 })
    t(\`ok.\${type}\`, { defaultValue: 'Default' })
  `
  const sf = parseSource('fixture.tsx', fixtureSource)
  const bindings = findUseTranslationBindings(sf, fixtureSource)
  const seen = []
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      bindings.has(node.expression.text)
    ) {
      const first = node.arguments[0]
      if (isNonliteral(first)) {
        seen.push({
          interpolationOnly: isInterpolationOnlyOptions(node.arguments[1]),
          fallback: isFallbackBearing([...node.arguments]),
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  const checks = {
    resolvedLeafPasses: resolvedLeaf.en && resolvedLeaf.ar,
    existingPrefixMissingLeafFails: !missingLeaf.en && !missingLeaf.ar,
    enOnlyFailsArabic: enOnly.en && !enOnly.ar,
    arOnlyFailsEnglish: !arOnly.en && arOnly.ar,
    unknownCallShapeFails:
      classifyCall({
        root,
        repoPath: 'fixture/Unknown.tsx',
        source: 't(dynamicKey, "Default")',
        node: { arguments: [{ getStart: () => 2, getEnd: () => 12 }] },
        namespaces: ['fixture'],
        domains: {},
      }) == null,
    interpolationOnlyOptionsNotFallback: seen.some((row) => row.interpolationOnly && !row.fallback),
    defaultValueOptionsAreFallback: seen.some((row) => !row.interpolationOnly && row.fallback),
  }
  return { selfCheck: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL', checks }
}

const printHuman = (result) => {
  console.log(
    `dynamic i18n audit: profile=${result.profile} listSites=${result.callerPopulations.listSites} listLeaves=${result.callerPopulations.listLeaves} lane3Sites=${result.callerPopulations.lane3Sites}`,
  )
  console.log(
    `rows=${result.counts.rows} listMissingBoth=${result.counts.listMissingBoth} clusterMissingBoth=${result.counts.clusterMissingBoth} unclassified=${result.counts.unclassified}`,
  )
  for (const row of result.rows) {
    console.log(
      `${row.profile}\t${row.family}\t${row.file}:${row.line}\t${row.key}\tEN=${row.en}\tAR=${row.ar}${row.requiredKey == null ? '' : `\trequired=${row.requiredKey}\trequiredEN=${row.requiredEn}\trequiredAR=${row.requiredAr}\troute=${row.routeMiss ? 'MISS' : 'ok'}`}\tns=${row.namespaces.join('|')}`,
    )
  }
  for (const row of result.unclassified) {
    console.log(
      `UNCLASSIFIED\t${row.family}\t${row.file}:${row.line}\t${row.reason}\t${row.expression.replace(/\s+/g, ' ')}\tns=${row.namespaces.map(bundleNamespace).join('|')}`,
    )
  }
  for (const row of result.missingRequiredBundles) {
    console.log(`MISSING_BUNDLE\t${row.locale}\t${row.namespace}`)
  }
}

export {
  auditProfile,
  collectCalls,
  evaluateExpectations,
  hasLeaf,
  loadBundles,
  runSelfCheck,
  resolveKey,
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
    if (options.selfCheck) {
      const result = runSelfCheck()
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.selfCheck === 'PASS' ? 0 : 1)
    }
    const result = auditProfile(options.root, options.profile)
    const failures = evaluateExpectations(result, options.expects)
    if (options.json) console.log(JSON.stringify(result, null, 2))
    else printHuman(result)
    const controlledPreRepair =
      options.profile === 'ar04-pre-repair' && Object.keys(options.expects).length > 0
    if (
      result.counts.unclassified > 0 &&
      !(controlledPreRepair && isExpectedPreRepairUnclassified(result))
    ) {
      failures.push(`${result.counts.unclassified} unclassified call(s)`)
    }
    if (controlledPreRepair && !isExpectedPreRepairUnclassified(result)) {
      failures.push('expected exactly the ruled unclassified graph cluster call')
    }
    if (result.counts.missingRequiredBundles > 0) {
      failures.push(
        `${result.counts.missingRequiredBundles} missing required locale bundle(s): ${result.missingRequiredBundles
          .map((row) => `${row.locale}/${row.namespace}`)
          .join(', ')}`,
      )
    }
    if (controlledPreRepair) {
      const unexpected = result.rows.filter(
        (row) => rowHasFailure(row) && !isExpectedPreRepairDefect(row),
      )
      if (unexpected.length > 0)
        failures.push(`${unexpected.length} unexpected missing/routing row(s)`)
    } else {
      if (result.counts.missingEn > 0)
        failures.push(`${result.counts.missingEn} en missing/routing failure(s)`)
      if (result.counts.missingAr > 0)
        failures.push(`${result.counts.missingAr} ar missing/routing failure(s)`)
    }
    if (failures.length > 0) {
      console.error(`dynamic i18n audit failed: ${failures.join('; ')}`)
      process.exit(1)
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
