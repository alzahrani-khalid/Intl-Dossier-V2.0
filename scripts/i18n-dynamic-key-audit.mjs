#!/usr/bin/env node
/** AST audit for the two ruled AR-04a fallback-bearing dynamic-key profiles. */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const scriptRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE_CORPUS_ROOT = join(scriptRepoRoot, 'scripts/fixtures/dynamic-key-audit')
const PRE_REPAIR_ROOT = join(FIXTURE_CORPUS_ROOT, 'pre-repair')
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
const parseArgs = (argv) => {
  let root = scriptRepoRoot
  let rootSeen = false
  let profile = 'ar04-pre-repair'
  let selfCheck = false
  let json = false
  let rows = false
  let forceUnproven = false
  const expects = {}

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--self-check') selfCheck = true
    else if (argument === '--json') json = true
    else if (argument === '--rows') rows = true
    else if (argument === '--force-unproven') forceUnproven = true
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

  return { root, profile, selfCheck, json, rows, forceUnproven, expects }
}

const parseSource = (file, source) =>
  ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

const inputRoots = (root) => {
  const shared = join(dirname(root), 'shared')
  return existsSync(join(root, 'caller.tsx')) && existsSync(shared) ? [root, shared] : [root]
}

const inputFile = (root, repoPath) => {
  for (const candidateRoot of inputRoots(root)) {
    const candidate = join(candidateRoot, repoPath)
    if (existsSync(candidate)) return candidate
  }
  return null
}

const readSource = (root, repoPath) => {
  const path = inputFile(root, repoPath)
  if (path == null) throw new Error(`missing profile file: ${repoPath}`)
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
      const localeDirectories = inputRoots(root)
        .map((candidateRoot) => join(candidateRoot, 'frontend/src/i18n', locale))
        .filter((directory) => existsSync(directory) && statSync(directory).isDirectory())
      if (localeDirectories.length === 0) {
        throw new Error(`missing locale directory: ${join(root, 'frontend/src/i18n', locale)}`)
      }
      return [
        locale,
        Object.fromEntries(
          localeDirectories.toReversed().flatMap((directory) =>
            readdirSync(directory)
              .filter((entry) => entry.endsWith('.json'))
              .sort()
              .map((entry) => [
                entry.replace(/\.json$/, ''),
                parseJsonFile(join(directory, entry)),
              ]),
          ),
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

const moduleSpecifierFor = (node) => {
  for (let current = node; current != null; current = current.parent) {
    if (ts.isImportDeclaration(current) || ts.isExportDeclaration(current)) {
      return stringArg(current.moduleSpecifier)
    }
  }
  return null
}

const moduleFileFor = (root, containingFile, specifier) => {
  const stems = specifier.startsWith('@/')
    ? inputRoots(root).map((candidateRoot) =>
        join(candidateRoot, 'frontend/src', specifier.slice(2)),
      )
    : specifier.startsWith('.')
      ? [resolve(dirname(containingFile), specifier)]
      : []
  for (const stem of stems) {
    for (const candidate of [
      stem,
      `${stem}.ts`,
      `${stem}.tsx`,
      `${stem}.mts`,
      join(stem, 'index.ts'),
      join(stem, 'index.tsx'),
    ]) {
      if (existsSync(candidate)) return candidate
    }
  }
  return null
}

const bindingContexts = new Map()
const bindingContextFor = (root, profileFiles) => {
  const cacheKey = `${root}\0${profileFiles.join('\0')}`
  if (root === PRE_REPAIR_ROOT && bindingContexts.has(cacheKey)) {
    return bindingContexts.get(cacheKey)
  }
  const ambientFactoryFile =
    root === PRE_REPAIR_ROOT ? join(root, '__dynamic-audit-globals.d.ts') : null
  const ambientFactorySource =
    'declare function useTranslation(namespace?: string | string[]): { t: (key: unknown, fallback?: unknown) => unknown }\n'
  const rootNames = [...profileFiles, 'frontend/src/lib/dossier-type-guards.ts']
    .map((repoPath) => inputFile(root, repoPath))
    .filter((path) => path != null)
  if (ambientFactoryFile != null) rootNames.push(ambientFactoryFile)
  const options = {
    allowJs: false,
    baseUrl: root,
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    noLib: true,
    paths: {
      '@/*': inputRoots(root).map((candidateRoot) => join(candidateRoot, 'frontend/src/*')),
    },
    skipLibCheck: true,
    target: ts.ScriptTarget.Latest,
    types: [],
  }
  const host = ts.createCompilerHost(options)
  const defaultFileExists = host.fileExists.bind(host)
  const defaultReadFile = host.readFile.bind(host)
  const defaultGetSourceFile = host.getSourceFile.bind(host)
  host.fileExists = (file) => file === ambientFactoryFile || defaultFileExists(file)
  host.readFile = (file) =>
    file === ambientFactoryFile ? ambientFactorySource : defaultReadFile(file)
  host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) =>
    file === ambientFactoryFile
      ? ts.createSourceFile(file, ambientFactorySource, languageVersion, true, ts.ScriptKind.TS)
      : defaultGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile)
  host.resolveModuleNames = (moduleNames, containingFile) =>
    moduleNames.map((moduleName) => {
      const file = moduleFileFor(root, containingFile, moduleName)
      if (file == null) return undefined
      return {
        extension: file.endsWith('.tsx') ? ts.Extension.Tsx : ts.Extension.Ts,
        isExternalLibraryImport: false,
        resolvedFileName: file,
      }
    })
  const program = ts.createProgram({ rootNames, options, host })
  const context = { root, program, checker: program.getTypeChecker(), ambientFactoryFile }
  if (root === PRE_REPAIR_ROOT) bindingContexts.set(cacheKey, context)
  return context
}

const bindingContextForSources = (sources) => {
  const virtualRoot = resolve('/__i18n-dynamic-key-self-check__')
  const sourceByFile = new Map(
    Object.entries(sources).map(([file, source]) => [resolve(virtualRoot, file), source]),
  )
  const options = {
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    noLib: true,
    target: ts.ScriptTarget.Latest,
    types: [],
  }
  const host = ts.createCompilerHost(options)
  const defaultFileExists = host.fileExists.bind(host)
  const defaultReadFile = host.readFile.bind(host)
  const defaultGetSourceFile = host.getSourceFile.bind(host)
  host.fileExists = (file) => sourceByFile.has(resolve(file)) || defaultFileExists(file)
  host.readFile = (file) => sourceByFile.get(resolve(file)) ?? defaultReadFile(file)
  host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => {
    const source = sourceByFile.get(resolve(file))
    return source == null
      ? defaultGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile)
      : ts.createSourceFile(
          file,
          source,
          languageVersion,
          true,
          file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        )
  }
  host.resolveModuleNames = (moduleNames, containingFile) =>
    moduleNames.map((moduleName) => {
      if (!moduleName.startsWith('.')) return undefined
      const stem = resolve(dirname(containingFile), moduleName)
      const file = [stem, `${stem}.ts`, `${stem}.tsx`].find((candidate) =>
        sourceByFile.has(resolve(candidate)),
      )
      if (file == null) return undefined
      return {
        extension: file.endsWith('.tsx') ? ts.Extension.Tsx : ts.Extension.Ts,
        isExternalLibraryImport: false,
        resolvedFileName: file,
      }
    })
  const program = ts.createProgram({ rootNames: [...sourceByFile.keys()], options, host })
  return { root: virtualRoot, program, checker: program.getTypeChecker() }
}

const symbolAt = (checker, node) => {
  if (node == null) return null
  if (
    ts.isIdentifier(node) &&
    ts.isShorthandPropertyAssignment(node.parent) &&
    node.parent.name === node
  ) {
    return (
      checker.getShorthandAssignmentValueSymbol(node.parent) ??
      checker.getSymbolAtLocation(node) ??
      null
    )
  }
  return checker.getSymbolAtLocation(node) ?? null
}

const sameSymbol = (checker, left, right) => {
  const leftSymbol = symbolAt(checker, left)
  const rightSymbol = symbolAt(checker, right)
  return leftSymbol != null && rightSymbol != null && leftSymbol === rightSymbol
}

const declarationIsConst = (declaration) => {
  let variable = declaration
  while (variable != null && !ts.isVariableDeclaration(variable)) variable = variable.parent
  const list = variable?.parent
  return (
    list != null && ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Const) !== 0
  )
}

const isWriteIdentifier = (node) => {
  const parent = node.parent
  return (
    (ts.isBinaryExpression(parent) &&
      parent.left === node &&
      parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
    ((ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(parent.operator))
  )
}

const hasInterveningWrite = (context, symbol, declaration, use) => {
  if (declarationIsConst(declaration)) return false
  let written = false
  const visit = (node) => {
    if (written || node.getEnd() <= declaration.getEnd() || node.getStart() >= use.getStart())
      return
    if (
      ts.isIdentifier(node) &&
      symbolAt(context.checker, node) === symbol &&
      isWriteIdentifier(node)
    ) {
      written = true
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(declaration.getSourceFile())
  return written
}

const callableIdentifier = (fn) => {
  if (ts.isFunctionDeclaration(fn) && fn.name != null) return fn.name
  const parent = fn.parent
  return ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name) ? parent.name : null
}

const invocationsOf = (context, fn) => {
  const identifier = callableIdentifier(fn)
  const symbol = symbolAt(context.checker, identifier)
  if (symbol == null) return []
  const invocations = []
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      symbolAt(context.checker, node.expression) === symbol
    ) {
      invocations.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(fn.getSourceFile())
  return invocations
}

const sameArgumentBinding = (context, left, right) => {
  const a = unwrapNode(left)
  const b = unwrapNode(right)
  if (a == null || b == null || a.kind !== b.kind) return false
  if (ts.isIdentifier(a) && ts.isIdentifier(b)) return sameSymbol(context.checker, a, b)
  const aString = stringArg(a)
  const bString = stringArg(b)
  if (aString != null || bString != null) return aString != null && aString === bString
  if (ts.isPropertyAccessExpression(a) && ts.isPropertyAccessExpression(b)) {
    return a.name.text === b.name.text && sameArgumentBinding(context, a.expression, b.expression)
  }
  return false
}

const parameterBinding = (context, parameter, use) => {
  const fn = parameter.parent
  if (!ts.isFunctionLike(fn)) return null
  const index = fn.parameters.indexOf(parameter)
  if (index < 0) return null
  const invocations = invocationsOf(context, fn).filter(
    (call) => call.arguments[index] != null && call.getStart() < use.getSourceFile().getEnd(),
  )
  if (invocations.length === 0) return null
  const expressions = invocations.map((call) => unwrapNode(call.arguments[index]))
  if (
    !expressions.every((expression) => sameArgumentBinding(context, expressions[0], expression))
  ) {
    return null
  }
  return { expression: expressions[0], stable: true, use: invocations[0] }
}

const initializerBinding = (context, identifier, use, seen = new Set()) => {
  if (!ts.isIdentifier(identifier)) return null
  const useSymbol = symbolAt(context.checker, identifier)
  if (useSymbol == null || seen.has(useSymbol)) return null
  seen.add(useSymbol)
  let symbol = useSymbol
  if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    const target = context.checker.getAliasedSymbol(symbol)
    if (target != null && target !== symbol) symbol = target
  }
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0] ?? null
  if (
    declaration != null &&
    ts.isBindingElement(declaration) &&
    ts.isObjectBindingPattern(declaration.parent)
  ) {
    const variable = declaration.parent.parent
    if (!ts.isVariableDeclaration(variable) || variable.initializer == null) return null
    const initializer = unwrapNode(variable.initializer)
    let source = null
    if (ts.isObjectLiteralExpression(initializer)) {
      source = { expression: initializer, stable: declarationIsConst(declaration) }
    } else if (ts.isIdentifier(initializer)) {
      source = initializerBinding(context, initializer, use, seen)
    }
    if (source == null || !ts.isObjectLiteralExpression(source.expression)) return null
    const key = propertyName(declaration.propertyName ?? declaration.name)
    const value = key == null ? null : objectProperty(source.expression, key)
    return value == null
      ? null
      : {
          expression: unwrapNode(value),
          stable: declarationIsConst(declaration) && source.stable,
          use: source.use,
        }
  }
  if (declaration != null && ts.isParameter(declaration)) {
    return parameterBinding(context, declaration, use)
  }
  if (
    declaration == null ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.initializer == null ||
    (declaration.getSourceFile() === use.getSourceFile() && declaration.getEnd() >= use.getStart())
  ) {
    return null
  }
  const sameFile = declaration.getSourceFile() === use.getSourceFile()
  return {
    expression: unwrapNode(declaration.initializer),
    stable: sameFile
      ? !hasInterveningWrite(context, useSymbol, declaration, use)
      : declarationIsConst(declaration),
  }
}

const staticString = (context, expression, use, seen = new Set()) => {
  const value = unwrapNode(expression)
  if (value == null) return null
  const direct = stringArg(value)
  if (direct != null) return { value: direct, stable: true }
  if (!ts.isIdentifier(value)) return null
  const symbol = symbolAt(context.checker, value)
  if (symbol == null || seen.has(symbol)) return null
  seen.add(symbol)
  const binding = initializerBinding(context, value, use)
  if (binding == null) return null
  const resolved = staticString(context, binding.expression, binding.use ?? use, seen)
  return resolved == null
    ? null
    : { value: resolved.value, stable: binding.stable && resolved.stable }
}

const staticStringArray = (context, expression, use) => {
  const value = unwrapNode(expression)
  if (value == null) return null
  if (ts.isArrayLiteralExpression(value)) {
    const entries = value.elements.map((element) => staticString(context, element, use))
    return entries.every((entry) => entry?.stable)
      ? { values: entries.map((entry) => entry.value), stable: true }
      : null
  }
  if (ts.isIdentifier(value)) {
    const binding = initializerBinding(context, value, use)
    if (binding == null) return null
    const resolved = staticStringArray(context, binding.expression, binding.use ?? use)
    return resolved == null
      ? null
      : { values: resolved.values, stable: binding.stable && resolved.stable }
  }
  const single = staticString(context, value, use)
  return single == null ? null : { values: [single.value], stable: single.stable }
}

const exportedOrigin = (context, moduleFile, exportName, expected, seen) => {
  const visitKey = `${moduleFile}\0${exportName}`
  if (seen.has(visitKey)) return false
  seen.add(visitKey)
  const sf = context.program.getSourceFile(moduleFile)
  if (sf == null) return false
  if (
    expected.file != null &&
    resolve(sf.fileName) === resolve(expected.file) &&
    exportName === expected.exportName
  ) {
    return true
  }
  for (const statement of sf.statements) {
    if (!ts.isExportDeclaration(statement)) continue
    const specifier = stringArg(statement.moduleSpecifier)
    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (element.name.text !== exportName) continue
        const importedName = (element.propertyName ?? element.name).text
        if (
          specifier != null &&
          originFromModule(context, sf, specifier, importedName, expected, seen)
        ) {
          return true
        }
      }
    } else if (
      statement.exportClause == null &&
      specifier != null &&
      originFromModule(context, sf, specifier, exportName, expected, seen)
    ) {
      return true
    }
  }
  return false
}

const originFromModule = (
  context,
  containingSourceFile,
  specifier,
  importedName,
  expected,
  seen,
) => {
  if (
    expected.module != null &&
    specifier === expected.module &&
    importedName === expected.exportName
  ) {
    return true
  }
  const file = moduleFileFor(context.root, containingSourceFile.fileName, specifier)
  return file != null && exportedOrigin(context, file, importedName, expected, seen)
}

const symbolHasOrigin = (context, symbol, expected, seen = new Set()) => {
  if (symbol == null) return false
  for (const declaration of symbol.declarations ?? []) {
    if (ts.isImportSpecifier(declaration)) {
      const specifier = moduleSpecifierFor(declaration)
      const importedName = (declaration.propertyName ?? declaration.name).text
      if (
        specifier != null &&
        originFromModule(
          context,
          declaration.getSourceFile(),
          specifier,
          importedName,
          expected,
          seen,
        )
      ) {
        return true
      }
    }
    if (ts.isBindingElement(declaration) && ts.isObjectBindingPattern(declaration.parent)) {
      const variable = declaration.parent.parent
      const initializer = ts.isVariableDeclaration(variable)
        ? unwrapNode(variable.initializer)
        : null
      const member = propertyName(declaration.propertyName ?? declaration.name)
      if (initializer != null && ts.isIdentifier(initializer) && member != null) {
        const namespaceSymbol = symbolAt(context.checker, initializer)
        for (const namespaceDeclaration of namespaceSymbol?.declarations ?? []) {
          if (!ts.isNamespaceImport(namespaceDeclaration)) continue
          const specifier = moduleSpecifierFor(namespaceDeclaration)
          if (
            specifier != null &&
            originFromModule(
              context,
              namespaceDeclaration.getSourceFile(),
              specifier,
              member,
              expected,
              seen,
            )
          ) {
            return true
          }
        }
      }
    }
    if (
      expected.file != null &&
      resolve(declaration.getSourceFile().fileName) === resolve(expected.file) &&
      declaration.name != null &&
      ts.isIdentifier(declaration.name) &&
      declaration.name.text === expected.exportName
    ) {
      return true
    }
  }
  return false
}

const symbolOriginIsStable = (context, symbol, use) =>
  (symbol?.declarations ?? []).every((declaration) => {
    if (ts.isImportSpecifier(declaration) || ts.isNamespaceImport(declaration)) return true
    if (ts.isFunctionDeclaration(declaration)) return true
    if (declaration.getSourceFile() !== use.getSourceFile()) return declarationIsConst(declaration)
    if (declarationIsConst(declaration)) return true
    return !hasInterveningWrite(context, symbol, declaration, use)
  })

const expressionHasOrigin = (context, expression, expected, use, seen = new Set()) => {
  const value = unwrapNode(expression)
  if (ts.isIdentifier(value)) {
    const symbol = symbolAt(context.checker, value)
    if (symbol == null || seen.has(symbol)) return false
    if (symbolHasOrigin(context, symbol, expected)) {
      return symbolOriginIsStable(context, symbol, use)
    }
    seen.add(symbol)
    const binding = initializerBinding(context, value, use)
    return (
      binding?.stable === true &&
      expressionHasOrigin(context, binding.expression, expected, binding.use ?? use, seen)
    )
  }
  return false
}

const findUseTranslationBindings = (sf, source, context) => {
  const bindings = new Map()
  const receivers = new Map()
  const assignments = new Map()
  const bindingInfo = (call, { declaration = null, name = null, symbol = null } = {}) => {
    const firstArg = call.arguments[0]
    const secondArg = call.arguments[1]
    const namespace =
      firstArg == null
        ? { values: ['translation'], stable: true }
        : staticStringArray(context, firstArg, call)
    const nsMode =
      secondArg && ts.isObjectLiteralExpression(secondArg)
        ? (staticString(context, objectProperty(secondArg, 'nsMode'), call)?.value ?? null)
        : null
    const namespaces = namespace?.values
      ? nsMode === 'fallback'
        ? namespace.values
        : [namespace.values[0]]
      : ['translation']
    const factorySupported =
      ts.isIdentifier(call.expression) &&
      (expressionHasOrigin(
        context,
        call.expression,
        { module: 'react-i18next', exportName: 'useTranslation' },
        call,
      ) ||
        (context.ambientFactoryFile != null &&
          expressionHasOrigin(
            context,
            call.expression,
            { file: context.ambientFactoryFile, exportName: 'useTranslation' },
            call,
          )))
    return {
      namespaces,
      supported: factorySupported && namespace?.stable === true,
      factorySupported,
      namespaceSupported: namespace?.stable === true,
      name,
      declaration,
      symbol,
    }
  }
  const derivedInfo = (origin, symbol, declaration, name) => ({
    ...origin,
    supported: origin.supported,
    name,
    declaration,
    symbol,
  })
  const mergeInfos = (infos, symbol, declaration, name) => {
    if (infos.length === 0 || infos.some((info) => info == null)) return null
    const namespaces = [...new Set(infos.flatMap((info) => info.namespaces))]
    const sameNamespaces = infos.every(
      (info) => info.namespaces.join('\0') === infos[0].namespaces.join('\0'),
    )
    const factorySupported = infos.every((info) => info.factorySupported)
    const namespaceSupported = sameNamespaces && infos.every((info) => info.namespaceSupported)
    return {
      namespaces,
      supported:
        sameNamespaces &&
        factorySupported &&
        namespaceSupported &&
        infos.every((info) => info.supported),
      factorySupported,
      namespaceSupported,
      name,
      declaration,
      symbol,
    }
  }
  const assignedInfo = (symbol, use) => {
    const records = assignments.get(symbol) ?? []
    if (use == null) return records.at(-1)?.info ?? null
    return records.findLast((record) => record.write.getStart() < use.getStart())?.info ?? null
  }
  const directTranslatorInfo = (expression, use = null) => {
    const value = unwrapNode(expression)
    if (ts.isIdentifier(value)) {
      const symbol = symbolAt(context.checker, value)
      return assignedInfo(symbol, use) ?? bindings.get(symbol) ?? null
    }
    if (
      ts.isPropertyAccessExpression(value) &&
      value.name.text === 't' &&
      ts.isCallExpression(unwrapNode(value.expression))
    ) {
      return bindingInfo(unwrapNode(value.expression))
    }
    return null
  }
  const receiverInfo = (expression, use = null) => {
    const value = unwrapNode(expression)
    if (ts.isCallExpression(value)) return bindingInfo(value)
    if (ts.isIdentifier(value)) return receivers.get(symbolAt(context.checker, value)) ?? null
    if (ts.isObjectLiteralExpression(value)) {
      return directTranslatorInfo(objectProperty(value, 't'), use)
    }
    return null
  }
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer
    ) {
      const origin = receiverInfo(node.initializer, node)
      for (const element of node.name.elements) {
        const property = element.propertyName
          ? textOf(source, element.propertyName)
          : textOf(source, element.name)
        if (origin != null && property === 't' && ts.isIdentifier(element.name)) {
          const symbol = symbolAt(context.checker, element.name)
          if (symbol == null) continue
          bindings.set(symbol, derivedInfo(origin, symbol, element, element.name.text))
        }
      }
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer != null) {
      const symbol = symbolAt(context.checker, node.name)
      if (symbol != null && ts.isCallExpression(unwrapNode(node.initializer))) {
        receivers.set(
          symbol,
          derivedInfo(bindingInfo(unwrapNode(node.initializer)), symbol, node.name, node.name.text),
        )
      }
      const translator = directTranslatorInfo(node.initializer, node)
      if (symbol != null && translator != null) {
        bindings.set(symbol, derivedInfo(translator, symbol, node.name, node.name.text))
      }
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left)
    ) {
      const symbol = symbolAt(context.checker, node.left)
      const translator = directTranslatorInfo(node.right, node)
      if (symbol != null && translator != null) {
        const records = assignments.get(symbol) ?? []
        records.push({
          write: node,
          info: derivedInfo(translator, symbol, node.left, node.left.text),
        })
        assignments.set(symbol, records)
      } else if (symbol != null) {
        const prior = assignedInfo(symbol, node) ?? bindings.get(symbol) ?? null
        if (prior != null) {
          const records = assignments.get(symbol) ?? []
          records.push({
            write: node,
            info: {
              ...derivedInfo(prior, symbol, node.left, node.left.text),
              supported: false,
              factorySupported: false,
            },
          })
          assignments.set(symbol, records)
        }
      }
      const receiver = receiverInfo(node.right, node)
      if (symbol != null && receiver != null && translator == null) {
        receivers.set(symbol, derivedInfo(receiver, symbol, node.left, node.left.text))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  let changed = true
  while (changed) {
    changed = false
    const functions = []
    containsNode(sf, (node) => {
      if (
        (ts.isFunctionDeclaration(node) && node.name != null) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      ) {
        functions.push(node)
      }
      return false
    })
    for (const fn of functions) {
      const invocations = invocationsOf(context, fn)
      for (let index = 0; index < fn.parameters.length; index++) {
        const parameter = fn.parameters[index]
        if (invocations.length === 0) continue
        const translatorInfos = invocations.map((call) => {
          const argument = unwrapNode(call.arguments[index])
          return argument == null ? null : directTranslatorInfo(argument, call)
        })
        const receiverInfos = invocations.map((call) => {
          const argument = unwrapNode(call.arguments[index])
          return argument == null ? null : receiverInfo(argument, call)
        })
        if (ts.isIdentifier(parameter.name)) {
          const symbol = symbolAt(context.checker, parameter.name)
          if (symbol != null && !bindings.has(symbol)) {
            const info = mergeInfos(translatorInfos, symbol, parameter, parameter.name.text)
            if (info != null) {
              bindings.set(symbol, info)
              changed = true
            }
          }
          if (symbol != null && !receivers.has(symbol)) {
            const info = mergeInfos(receiverInfos, symbol, parameter, parameter.name.text)
            if (info != null) {
              receivers.set(symbol, info)
              changed = true
            }
          }
        } else if (ts.isObjectBindingPattern(parameter.name)) {
          const origin = mergeInfos(receiverInfos, null, parameter, null)
          if (origin == null) continue
          for (const element of parameter.name.elements) {
            const property = propertyName(element.propertyName ?? element.name)
            if (property !== 't' || !ts.isIdentifier(element.name)) continue
            const symbol = symbolAt(context.checker, element.name)
            if (symbol != null && !bindings.has(symbol)) {
              bindings.set(symbol, derivedInfo(origin, symbol, element, element.name.text))
              changed = true
            }
          }
        }
      }
    }
    containsNode(sf, (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isObjectBindingPattern(node.name) &&
        node.initializer != null
      ) {
        const origin = receiverInfo(node.initializer, node)
        if (origin == null) return false
        for (const element of node.name.elements) {
          const property = propertyName(element.propertyName ?? element.name)
          if (property !== 't' || !ts.isIdentifier(element.name)) continue
          const symbol = symbolAt(context.checker, element.name)
          if (symbol != null && !bindings.has(symbol)) {
            bindings.set(symbol, derivedInfo(origin, symbol, element, element.name.text))
            changed = true
          }
        }
      }
      return false
    })
  }
  return {
    resolve(expression, use) {
      const value = unwrapNode(expression)
      if (ts.isIdentifier(value)) {
        return directTranslatorInfo(value, use)
      }
      if (ts.isPropertyAccessExpression(value) && value.name.text === 't') {
        const origin = receiverInfo(value.expression, use)
        if (origin == null) return null
        const receiver = unwrapNode(value.expression)
        const symbol = ts.isIdentifier(receiver) ? symbolAt(context.checker, receiver) : null
        return derivedInfo(origin, symbol, origin.declaration, textOf(source, value))
      }
      return null
    },
  }
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
    if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === name) return prop.name
  }
  return null
}

// Opaque option syntax can hide a fallback, so only transparent literals are safe.
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

const namespaceOverride = (args, bindingNamespaces, context, use) => {
  for (const arg of args.slice(1)) {
    if (!ts.isObjectLiteralExpression(arg)) continue
    const ns = objectProperty(arg, 'ns')
    if (ns == null) continue
    const value = staticString(context, ns, use)
    if (value?.stable) return { namespaces: [value.value], supported: true }
    return { namespaces: bindingNamespaces, supported: false }
  }
  return { namespaces: bindingNamespaces, supported: true }
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

const extractObjectKeys = (root, repoPath, constName) => {
  const source = readSource(root, repoPath)
  const sf = parseSource(repoPath, source)
  let values = null
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === constName
    ) {
      const initializer = unwrapExpression(node.initializer)
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) return
      values = initializer.properties.map((property) =>
        ts.isPropertyAssignment(property) ? propertyName(property.name) : null,
      )
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (!Array.isArray(values) || values.some((value) => value == null) || values.length === 0) {
    throw new Error(`empty or unsupported domain: ${repoPath} ${constName} keys`)
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
  graphLegendTypes: extractObjectKeys(
    root,
    'frontend/src/lib/semantic-colors.ts',
    'graphNodeColors',
  ).slice(0, 6),
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
      ts.isNonNullExpression(current) ||
      ts.isSatisfiesExpression(current))
  ) {
    current = current.expression
  }
  return current
}

const resolvedSymbolAt = (context, node) => {
  let symbol = symbolAt(context.checker, node)
  if (symbol != null && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    const target = context.checker.getAliasedSymbol(symbol)
    if (target != null && target !== symbol) symbol = target
  }
  return symbol
}

const functionForCall = (context, call) => {
  const expression = unwrapNode(call.expression)
  if (!ts.isIdentifier(expression)) return null
  const symbol = resolvedSymbolAt(context, expression)
  for (const declaration of symbol?.declarations ?? []) {
    if (ts.isFunctionDeclaration(declaration)) return declaration
    if (ts.isVariableDeclaration(declaration)) {
      const initializer = unwrapNode(declaration.initializer)
      if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
        return initializer
      }
    }
  }
  return null
}

const returnedExpressions = (fn) => {
  if (fn.body == null) return []
  if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body)) return [fn.body]
  if (!ts.isBlock(fn.body)) return []
  const expressions = []
  const visit = (node) => {
    if (node !== fn.body && ts.isFunctionLike(node)) return
    if (ts.isReturnStatement(node)) {
      if (node.expression != null) expressions.push(node.expression)
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(fn.body)
  return expressions
}

const staticObjectMember = (context, expression, memberName, use, seen = new Set()) => {
  const value = unwrapNode(expression)
  if (ts.isObjectLiteralExpression(value)) return objectProperty(value, memberName)
  if (!ts.isIdentifier(value)) return null
  const symbol = symbolAt(context.checker, value)
  if (symbol == null || seen.has(symbol)) return null
  seen.add(symbol)
  const binding = initializerBinding(context, value, use)
  if (binding?.stable !== true) return null
  return staticObjectMember(context, binding.expression, memberName, binding.use ?? use, seen)
}

const mutationSharesEnclosingFunction = (declaration, mutation, use) => {
  const declarationFunction = enclosingFunction(declaration)
  return (
    declarationFunction != null &&
    declarationFunction === enclosingFunction(mutation) &&
    declarationFunction === enclosingFunction(use)
  )
}

const pushedCollectionElements = (context, identifier, use) => {
  const symbol = resolvedSymbolAt(context, identifier)
  if (symbol == null) return null
  const declarations = symbol.declarations ?? []
  const declaration = symbol.valueDeclaration ?? declarations[0] ?? null
  if (declaration == null) return null
  const sourceFiles = new Set([
    identifier.getSourceFile(),
    declaration.getSourceFile(),
    ...declarations.map((candidate) => candidate.getSourceFile()),
  ])
  const values = []
  let invalid = false
  const visit = (node) => {
    if (invalid) return
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'push' &&
      ts.isIdentifier(unwrapNode(node.expression.expression)) &&
      resolvedSymbolAt(context, unwrapNode(node.expression.expression)) === symbol
    ) {
      const sameFunction = mutationSharesEnclosingFunction(declaration, node, use)
      if (!sameFunction || node.getStart() >= use.getStart() || node.arguments.length === 0) {
        invalid = true
      } else {
        values.push(...node.arguments.map(unwrapNode))
      }
      return
    }
    ts.forEachChild(node, visit)
  }
  for (const sourceFile of sourceFiles) visit(sourceFile)
  return invalid ? null : values
}

const staticCollectionElements = (context, expression, use, seen = new Set()) => {
  const value = unwrapNode(expression)
  if (value == null) return null
  if (ts.isArrayLiteralExpression(value)) {
    const elements = []
    for (const element of value.elements) {
      if (ts.isSpreadElement(element)) {
        const spread = staticCollectionElements(context, element.expression, use, new Set(seen))
        if (spread == null) return null
        elements.push(...spread)
      } else {
        elements.push(unwrapNode(element))
      }
    }
    return elements
  }
  if (ts.isIdentifier(value)) {
    const symbol = symbolAt(context.checker, value)
    if (symbol == null || seen.has(symbol)) return null
    const nextSeen = new Set(seen)
    nextSeen.add(symbol)
    const binding = initializerBinding(context, value, use)
    if (binding?.stable !== true) return null
    const initial = staticCollectionElements(
      context,
      binding.expression,
      binding.use ?? use,
      nextSeen,
    )
    if (initial == null) return null
    const pushed = pushedCollectionElements(context, value, use)
    return pushed == null ? null : [...initial, ...pushed]
  }
  if (!ts.isCallExpression(value)) return null

  const callee = unwrapNode(value.expression)
  if (ts.isIdentifier(callee) && callee.text === 'useMemo') {
    const callback = unwrapNode(value.arguments[0])
    if (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) return null
    const returns = returnedExpressions(callback)
    if (returns.length === 0) return null
    const elements = returns.map((returned) =>
      staticCollectionElements(context, returned, returned, new Set(seen)),
    )
    return elements.some((entry) => entry == null) ? null : elements.flat()
  }
  if (ts.isPropertyAccessExpression(callee)) {
    if (callee.name.text === 'filter' || callee.name.text === 'slice') {
      return staticCollectionElements(context, callee.expression, value, new Set(seen))
    }
    if (callee.name.text === 'flatMap') {
      const callback = unwrapNode(value.arguments[0])
      if (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) return null
      const parameter = callback.parameters[0]?.name
      if (!ts.isIdentifier(parameter)) return null
      const sourceElements = staticCollectionElements(
        context,
        callee.expression,
        value,
        new Set(seen),
      )
      if (sourceElements == null) return null
      const returns = returnedExpressions(callback)
      if (returns.length === 0) return null
      const flattened = []
      for (const returned of returns) {
        const projection = unwrapNode(returned)
        if (
          !ts.isPropertyAccessExpression(projection) ||
          !ts.isIdentifier(projection.expression) ||
          !sameSymbol(context.checker, projection.expression, parameter)
        ) {
          return null
        }
        for (const element of sourceElements) {
          const member = staticObjectMember(context, element, projection.name.text, value)
          if (member == null) return null
          const projected = staticCollectionElements(context, member, member, new Set(seen))
          if (projected == null) return null
          flattened.push(...projected)
        }
      }
      return flattened
    }
  }

  const fn = functionForCall(context, value)
  if (fn == null) return null
  const returns = returnedExpressions(fn)
  if (returns.length === 0) return null
  const elements = returns.map((returned) =>
    staticCollectionElements(context, returned, returned, new Set(seen)),
  )
  return elements.some((entry) => entry == null) ? null : elements.flat()
}

const staticRecordStringValues = (context, expression, use) => {
  let value = unwrapNode(expression)
  if (ts.isIdentifier(value)) {
    const binding = initializerBinding(context, value, use)
    if (binding?.stable !== true) return null
    value = unwrapNode(binding.expression)
  }
  if (!ts.isObjectLiteralExpression(value)) return null
  const values = value.properties.map((property) => {
    if (!ts.isPropertyAssignment(property)) return null
    const entry = staticString(context, property.initializer, property)
    return entry?.stable === true ? entry.value : null
  })
  return values.length > 0 && values.every((entry) => entry != null) ? [...new Set(values)] : null
}

const staticCollectionPropertyValues = (context, expression, property, use) => {
  const elements = staticCollectionElements(context, expression, use)
  if (elements == null || elements.length === 0) return null
  const values = elements.map((element) => {
    const member = staticObjectMember(context, element, property, use)
    if (member == null) return null
    const entry = staticString(context, member, member)
    return entry?.stable === true ? entry.value : null
  })
  if (!values.every((entry) => entry != null)) return null
  return [...new Set(values)]
}

const wholeKeySource = (context, expression, use) => {
  let value = unwrapNode(expression)
  const seen = new Set()
  while (value != null) {
    if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
      // The runtime fallback tail is deliberately excluded from the proven literal-member domain.
      value = unwrapNode(value.left)
      continue
    }
    if (!ts.isIdentifier(value)) return value
    const symbol = symbolAt(context.checker, value)
    if (symbol == null || seen.has(symbol)) return null
    seen.add(symbol)
    const binding = initializerBinding(context, value, use)
    if (binding?.stable !== true) return null
    value = unwrapNode(binding.expression)
    use = binding.use ?? use
  }
  return null
}

const mappedCollectionFor = (context, identifier) => {
  const symbol = symbolAt(context.checker, identifier)
  const parameter = symbol?.valueDeclaration ?? symbol?.declarations?.[0] ?? null
  if (parameter == null || !ts.isParameter(parameter)) return null
  const callback = parameter.parent
  const mapCall = callback.parent
  if (
    (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) ||
    !ts.isCallExpression(mapCall) ||
    !ts.isPropertyAccessExpression(mapCall.expression) ||
    mapCall.expression.name.text !== 'map' ||
    mapCall.arguments[0] !== callback
  ) {
    return null
  }
  return mapCall.expression.expression
}

const staticCollectionWholeKeyDomain = ({ bindingContext, node }) => {
  if (bindingContext == null) return null
  const first = unwrapNode(node.arguments[0])
  if (!ts.isIdentifier(first) && !ts.isPropertyAccessExpression(first)) return null
  const source = wholeKeySource(bindingContext, first, node)
  if (source == null) return null
  if (ts.isElementAccessExpression(source)) {
    return staticRecordStringValues(bindingContext, source.expression, source)
  }
  if (ts.isPropertyAccessExpression(source) && ts.isIdentifier(unwrapNode(source.expression))) {
    const receiver = mappedCollectionFor(bindingContext, unwrapNode(source.expression))
    return receiver == null
      ? null
      : staticCollectionPropertyValues(bindingContext, receiver, source.name.text, source)
  }
  return null
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

const variableNamed = (sf, name) => {
  let declaration = null
  containsNode(sf, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      declaration = node
      return true
    }
    return false
  })
  return declaration
}

const sameStrings = (left, right) =>
  Array.isArray(left) &&
  Array.isArray(right) &&
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const enclosingNamedFunction = (node, name) => {
  const fn = enclosingFunction(node)
  if (fn == null) return false
  if ('name' in fn && fn.name != null && ts.isIdentifier(fn.name)) return fn.name.text === name
  if (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) {
    return (
      ts.isVariableDeclaration(fn.parent) &&
      ts.isIdentifier(fn.parent.name) &&
      fn.parent.name.text === name
    )
  }
  return false
}

const mappedParameter = (node, receiverName, memberName) => {
  for (let current = node.parent; current != null; current = current.parent) {
    if (!ts.isArrowFunction(current) && !ts.isFunctionExpression(current)) continue
    const mapCall = current.parent
    if (
      !ts.isCallExpression(mapCall) ||
      !ts.isPropertyAccessExpression(mapCall.expression) ||
      mapCall.expression.name.text !== 'map' ||
      mapCall.arguments[0] !== current
    ) {
      continue
    }
    const receiver = unwrapNode(mapCall.expression.expression)
    if (!ts.isIdentifier(receiver) || receiver.text !== receiverName) return false
    const parameter = current.parameters[0]?.name
    const first = unwrapNode(node.arguments[0])
    return (
      parameter != null &&
      ts.isIdentifier(parameter) &&
      ts.isPropertyAccessExpression(first) &&
      ts.isIdentifier(first.expression) &&
      first.expression.text === parameter.text &&
      first.name.text === memberName
    )
  }
  return false
}

const provesListDomain = ({ source, node, domain }) => {
  const sf = node.getSourceFile()
  const first = templateLeaf(source, node.arguments[0])
  if (first?.expression !== 'translationKey') return false
  const entityConfig = variableNamed(sf, 'entityConfig')
  const config = variableNamed(sf, 'config')
  const translationKey = variableNamed(sf, 'translationKey')
  let propsTypeIsClosed = false
  containsNode(sf, (candidate) => {
    if (!ts.isInterfaceDeclaration(candidate) || candidate.name.text !== 'ListEmptyStateProps') {
      return false
    }
    propsTypeIsClosed = candidate.members.some(
      (member) =>
        ts.isPropertySignature(member) &&
        propertyName(member.name) === 'entityType' &&
        member.type != null &&
        textOf(source, member.type) === 'EntityType',
    )
    return propsTypeIsClosed
  })
  const caller = enclosingFunction(node)
  const typedCaller =
    caller != null &&
    ts.isFunctionDeclaration(caller) &&
    caller.name?.text === 'ListEmptyState' &&
    caller.parameters[0]?.type != null &&
    textOf(source, caller.parameters[0].type) === 'ListEmptyStateProps' &&
    ts.isObjectBindingPattern(caller.parameters[0].name) &&
    caller.parameters[0].name.elements.some(
      (element) => ts.isIdentifier(element.name) && element.name.text === 'entityType',
    )
  if (
    !propsTypeIsClosed ||
    !typedCaller ||
    entityConfig == null ||
    config == null ||
    translationKey == null ||
    entityConfig.type == null ||
    !ts.isTypeReferenceNode(entityConfig.type) ||
    textOf(source, entityConfig.type.typeName) !== 'Record' ||
    entityConfig.type.typeArguments?.[0] == null ||
    textOf(source, entityConfig.type.typeArguments[0]) !== 'EntityType'
  ) {
    return false
  }
  const object = unwrapNode(entityConfig.initializer)
  if (!ts.isObjectLiteralExpression(object)) return false
  const entries = object.properties.map((property) => {
    if (!ts.isPropertyAssignment(property)) return null
    const key = propertyName(property.name)
    const value = unwrapNode(property.initializer)
    if (key == null || !ts.isObjectLiteralExpression(value)) return null
    return [key, stringArg(objectProperty(value, 'translationKey'))]
  })
  if (
    entries.some((entry) => entry == null || entry[0] !== entry[1]) ||
    !sameStrings(
      entries.map((entry) => entry[0]),
      domain,
    )
  ) {
    return false
  }
  const configInit = unwrapNode(config.initializer)
  const keyInit = unwrapNode(translationKey.initializer)
  return (
    ts.isElementAccessExpression(configInit) &&
    ts.isIdentifier(configInit.expression) &&
    configInit.expression.text === 'entityConfig' &&
    ts.isIdentifier(unwrapNode(configInit.argumentExpression)) &&
    unwrapNode(configInit.argumentExpression).text === 'entityType' &&
    ts.isPropertyAccessExpression(keyInit) &&
    ts.isIdentifier(keyInit.expression) &&
    keyInit.expression.text === 'config' &&
    keyInit.name.text === 'translationKey'
  )
}

const provesAnalyzeDomain = ({ root, source, node, domain }) => {
  const recordName = 'analyzeLabelKey'
  const first = unwrapNode(node.arguments[0])
  const declaration = variableNamed(node.getSourceFile(), recordName)
  if (
    declaration == null ||
    declaration.type == null ||
    !ts.isTypeReferenceNode(declaration.type) ||
    textOf(source, declaration.type.typeName) !== 'Record' ||
    declaration.type.typeArguments?.[0] == null ||
    textOf(source, declaration.type.typeArguments[0]) !== 'AnalyticQueryType' ||
    !ts.isElementAccessExpression(first) ||
    !ts.isIdentifier(first.expression) ||
    first.expression.text !== recordName ||
    !ts.isPropertyAccessExpression(unwrapNode(first.argumentExpression)) ||
    unwrapNode(first.argumentExpression).name.text !== 'queryType'
  ) {
    return false
  }
  const object = unwrapNode(declaration.initializer)
  if (!ts.isObjectLiteralExpression(object)) return false
  const values = object.properties.map((property) =>
    ts.isPropertyAssignment(property) ? stringArg(property.initializer) : null,
  )
  const keys = object.properties.map((property) =>
    ts.isPropertyAssignment(property) ? propertyName(property.name) : null,
  )
  const producerPath = 'frontend/src/components/keyboard-shortcuts/analyze-commands.ts'
  const queryTypes = extractTypeUnion(root, producerPath, 'AnalyticQueryType')
  let mappedProducer = false
  for (let current = node.parent; current != null; current = current.parent) {
    if (!ts.isArrowFunction(current)) continue
    const map = current.parent
    const receiver =
      ts.isCallExpression(map) &&
      ts.isPropertyAccessExpression(map.expression) &&
      map.expression.name.text === 'map'
        ? unwrapNode(map.expression.expression)
        : null
    const parameter = current.parameters[0]?.name
    const index = unwrapNode(first.argumentExpression)
    if (
      ts.isCallExpression(receiver) &&
      ts.isIdentifier(receiver.expression) &&
      receiver.expression.text === 'getAnalyzeCommandActions' &&
      ts.isIdentifier(parameter) &&
      ts.isPropertyAccessExpression(index) &&
      ts.isIdentifier(index.expression) &&
      index.expression.text === parameter.text
    ) {
      mappedProducer = true
      break
    }
  }
  return (
    mappedProducer &&
    values.every((value) => value != null) &&
    sameStrings(keys, queryTypes) &&
    sameStrings(values, domain)
  )
}

const provesConstMap = ({ node, domain }, constantName, memberName) => {
  if (!mappedParameter(node, constantName, memberName)) return false
  const declaration = variableNamed(node.getSourceFile(), constantName)
  const value = unwrapNode(declaration?.initializer)
  if (!ts.isArrayLiteralExpression(value)) return false
  const values = value.elements.map((element) => {
    const object = unwrapNode(element)
    return ts.isObjectLiteralExpression(object)
      ? stringArg(objectProperty(object, memberName))
      : null
  })
  return values.every((entry) => entry != null) && sameStrings(values, domain)
}

const provesSensitivityDomain = ({ root, node, domain }) => {
  const first = unwrapNode(node.arguments[0])
  if (
    !ts.isCallExpression(first) ||
    !ts.isIdentifier(first.expression) ||
    first.expression.text !== 'sensitivityLabelKey'
  ) {
    return false
  }
  const repoPath = 'frontend/src/components/list-page/sensitivity.ts'
  const source = readSource(root, repoPath)
  const sf = parseSource(repoPath, source)
  let fn = null
  containsNode(sf, (candidate) => {
    if (
      ts.isVariableDeclaration(candidate) &&
      ts.isIdentifier(candidate.name) &&
      candidate.name.text === 'sensitivityLabelKey'
    ) {
      fn = unwrapNode(candidate.initializer)
      return true
    }
    return false
  })
  if (
    !ts.isArrowFunction(fn) ||
    fn.parameters[0]?.type == null ||
    textOf(source, fn.parameters[0].type) !== 'number'
  ) {
    return false
  }
  const body = unwrapNode(fn.body)
  if (
    !ts.isBinaryExpression(body) ||
    body.operatorToken.kind !== ts.SyntaxKind.QuestionQuestionToken
  ) {
    return false
  }
  if (stringArg(unwrapNode(body.right)) !== 'sensitivity.unknown') return false
  const labelAccess = unwrapNode(body.left)
  const chipAccess =
    ts.isPropertyAccessExpression(labelAccess) && labelAccess.name.text === 'labelKey'
      ? unwrapNode(labelAccess.expression)
      : null
  const hasCanonicalLookup =
    ts.isElementAccessExpression(chipAccess) &&
    ts.isIdentifier(chipAccess.expression) &&
    chipAccess.expression.text === 'SENSITIVITY_CHIP'
  const values = extractObjectStringValues(root, repoPath, 'SENSITIVITY_CHIP', 'labelKey')
  return hasCanonicalLookup && sameStrings([...values, 'sensitivity.unknown'], domain)
}

const provesCountLineDomain = ({ source, node, domain }) => {
  if (!enclosingNamedFunction(node, 'countLine')) return false
  const values = []
  let invalid = false
  containsNode(node.getSourceFile(), (candidate) => {
    if (
      ts.isCallExpression(candidate) &&
      ts.isIdentifier(candidate.expression) &&
      candidate.expression.text === 'countLine'
    ) {
      const value = stringArg(candidate.arguments[1])
      if (value == null || !enclosingNamedFunction(candidate, 'renderCountLine')) invalid = true
      else values.push(value)
    }
    return false
  })
  const first = unwrapNode(node.arguments[0])
  return !invalid && ts.isIdentifier(first) && first.text === 'key' && sameStrings(values, domain)
}

const entriesMapFor = (node, constantName) => {
  for (let current = node.parent; current != null; current = current.parent) {
    if (!ts.isArrowFunction(current) && !ts.isFunctionExpression(current)) continue
    const mapCall = current.parent
    if (
      !ts.isCallExpression(mapCall) ||
      !ts.isPropertyAccessExpression(mapCall.expression) ||
      mapCall.expression.name.text !== 'map'
    ) {
      continue
    }
    const sliced = unwrapNode(mapCall.expression.expression)
    if (
      !ts.isCallExpression(sliced) ||
      !ts.isPropertyAccessExpression(sliced.expression) ||
      sliced.expression.name.text !== 'slice'
    ) {
      return null
    }
    const entries = unwrapNode(sliced.expression.expression)
    if (
      !ts.isCallExpression(entries) ||
      !ts.isPropertyAccessExpression(entries.expression) ||
      !ts.isIdentifier(entries.expression.expression) ||
      entries.expression.expression.text !== 'Object' ||
      entries.expression.name.text !== 'entries' ||
      !ts.isIdentifier(unwrapNode(entries.arguments[0])) ||
      unwrapNode(entries.arguments[0]).text !== constantName
    ) {
      return null
    }
    const start =
      sliced.arguments[0] == null
        ? 0
        : Number(
            stringArg(sliced.arguments[0]) ??
              textOf(node.getSourceFile().text, sliced.arguments[0]),
          )
    const limit =
      sliced.arguments[1] == null
        ? null
        : Number(
            stringArg(sliced.arguments[1]) ??
              textOf(node.getSourceFile().text, sliced.arguments[1]),
          )
    return {
      callback: current,
      start: Number.isInteger(start) ? start : null,
      limit: Number.isInteger(limit) ? limit : null,
    }
  }
  return null
}

const provesGraphLegendDomain = ({ root, source, node, domain }) => {
  const map = entriesMapFor(node, 'NODE_COLORS')
  const first = templateLeaf(source, node.arguments[0])
  if (map == null || first?.head !== 'type.' || first.expression !== 'type') return false
  const binding = map.callback.parameters[0]?.name
  if (
    !ts.isArrayBindingPattern(binding) ||
    !ts.isIdentifier(binding.elements[0]?.name) ||
    binding.elements[0].name.text !== 'type'
  ) {
    return false
  }
  const declaration = variableNamed(node.getSourceFile(), 'NODE_COLORS')
  const initializer = unwrapNode(declaration?.initializer)
  const imported = node
    .getSourceFile()
    .statements.some(
      (statement) =>
        ts.isImportDeclaration(statement) &&
        stringArg(statement.moduleSpecifier) === '@/lib/semantic-colors' &&
        statement.importClause?.namedBindings != null &&
        ts.isNamedImports(statement.importClause.namedBindings) &&
        statement.importClause.namedBindings.elements.some(
          (element) =>
            element.name.text === 'SEMANTIC_NODE_COLORS' &&
            (element.propertyName?.text ?? element.name.text) === 'graphNodeColors',
        ),
    )
  const expected = extractObjectKeys(
    root,
    'frontend/src/lib/semantic-colors.ts',
    'graphNodeColors',
  ).slice(map.start, map.limit)
  return (
    imported &&
    ts.isIdentifier(initializer) &&
    initializer.text === 'SEMANTIC_NODE_COLORS' &&
    map.start === 0 &&
    map.limit != null &&
    sameStrings(domain, expected)
  )
}

const provesRelationshipDomain = ({ source, node, domain }) => {
  const first = templateLeaf(source, node.arguments[0])
  return (
    first?.head === 'relationship.' &&
    first.tail === '' &&
    provesConstMap({ node, domain }, 'RELATIONSHIP_TYPES', 'value')
  )
}

const provesStaticCollectionWholeKeyDomain = ({ bindingContext, node, domain }) =>
  sameStrings(staticCollectionWholeKeyDomain({ bindingContext, node }), domain)

const sameBoundExpression = (context, left, right) => {
  const a = unwrapNode(left)
  const b = unwrapNode(right)
  if (ts.isIdentifier(a) && ts.isIdentifier(b)) return sameSymbol(context.checker, a, b)
  if (ts.isPropertyAccessExpression(a) && ts.isPropertyAccessExpression(b)) {
    return a.name.text === b.name.text && sameBoundExpression(context, a.expression, b.expression)
  }
  if (ts.isElementAccessExpression(a) && ts.isElementAccessExpression(b)) {
    const aKey = stringArg(unwrapNode(a.argumentExpression))
    const bKey = stringArg(unwrapNode(b.argumentExpression))
    return aKey != null && aKey === bKey && sameBoundExpression(context, a.expression, b.expression)
  }
  return false
}

const ruledMembershipRoute = (context, call) => {
  let expression = unwrapNode(call.arguments[0])
  let use = call
  let keyStable = true
  const seen = new Set()
  while (ts.isIdentifier(expression)) {
    const symbol = symbolAt(context.checker, expression)
    if (symbol == null || seen.has(symbol)) return null
    seen.add(symbol)
    const binding = initializerBinding(context, expression, use)
    if (binding == null) return null
    keyStable = keyStable && binding.stable
    expression = unwrapNode(binding.expression)
    use = binding.use ?? use
  }
  return ts.isConditionalExpression(expression) ? { route: expression, keyStable } : null
}

const provesRuledMembershipDomain = ({
  root,
  node,
  bindingContext,
  namespaces,
  namespaceSupported,
}) => {
  const candidate = ruledMembershipRoute(bindingContext, node)
  const namespaceAvailable =
    namespaces.length === 1 &&
    LOCALES.every((locale) =>
      inputRoots(root).some((candidateRoot) =>
        existsSync(
          join(
            candidateRoot,
            'frontend/src/i18n',
            locale,
            `${bundleNamespace(namespaces[0])}.json`,
          ),
        ),
      ),
    )
  if (candidate == null || !candidate.keyStable || !namespaceSupported || !namespaceAvailable) {
    return false
  }
  const { route } = candidate
  const condition = unwrapNode(route.condition)
  if (
    !ts.isCallExpression(condition) ||
    !ts.isPropertyAccessExpression(condition.expression) ||
    condition.expression.name.text !== 'includes' ||
    condition.arguments.length !== 1
  ) {
    return false
  }
  const canonicalFile = inputFile(root, 'frontend/src/lib/dossier-type-guards.ts')
  if (
    canonicalFile == null ||
    !expressionHasOrigin(
      bindingContext,
      condition.expression.expression,
      { file: canonicalFile, exportName: 'DOSSIER_CARD_TYPES' },
      condition,
    )
  ) {
    return false
  }
  const unknown = staticString(bindingContext, route.whenFalse, node)
  const canonical = unwrapNode(route.whenTrue)
  if (
    unknown?.stable !== true ||
    unknown.value !== `type.${GRAPH_UNKNOWN_TYPE}` ||
    !ts.isTemplateExpression(canonical) ||
    canonical.head.text !== 'type.' ||
    canonical.templateSpans.length !== 1 ||
    canonical.templateSpans[0].literal.text !== ''
  ) {
    return false
  }
  return sameBoundExpression(
    bindingContext,
    condition.arguments[0],
    canonical.templateSpans[0].expression,
  )
}

const provesClosedDomain = (proofKind, context) => {
  if (context.forceUnproven) return false
  if (proofKind === 'list-entity-config') return provesListDomain(context)
  if (proofKind === 'command-analyze-record') return provesAnalyzeDomain(context)
  if (proofKind === 'dossier-sensitivity-helper') return provesSensitivityDomain(context)
  if (proofKind === 'engagement-filter-map') return provesConstMap(context, 'FILTERS', 'labelKey')
  if (proofKind === 'icon-rail-map') return provesConstMap(context, 'defaultItems', 'tooltipKey')
  if (proofKind === 'analytic-template-map') return provesConstMap(context, 'TEMPLATES', 'labelKey')
  if (proofKind === 'analytic-count-switch') return provesCountLineDomain(context)
  if (proofKind === 'static-literal-collection-whole-key') {
    return provesStaticCollectionWholeKeyDomain(context)
  }
  if (proofKind === 'graph-cluster-route') {
    if (
      context.bindingContext != null &&
      ruledMembershipRoute(context.bindingContext, context.node) != null
    ) {
      return provesRuledMembershipDomain(context)
    }
    const expected = [
      ...extractConstStringArray(
        context.root,
        'frontend/src/lib/dossier-type-guards.ts',
        'DOSSIER_CARD_TYPES',
      ).map((type) => `type.${type}`),
      `type.${GRAPH_UNKNOWN_TYPE}`,
    ]
    return (
      sameStrings(context.domain, expected) &&
      provesClosedClusterDomain(context.node.getSourceFile(), context.source, context.node)
    )
  }
  if (proofKind === 'graph-type-map') return provesGraphLegendDomain(context)
  if (proofKind === 'graph-relationship-map') return provesRelationshipDomain(context)
  return false
}

const closedDomain = (key, domain, proof) => {
  if (!Array.isArray(domain) || domain.length === 0) {
    throw new Error(`empty domain at ${key}`)
  }
  return { proofSite: key, keys: domain, closed: proof === true }
}

const describeDomain = (claim, kind, domainSource, options = {}) => ({
  ...claim,
  kind,
  domainSource,
  ...(options.namespaces == null ? {} : { namespaces: options.namespaces }),
  countInListMissing: options.countInListMissing ?? true,
  clusterProbe: options.clusterProbe ?? false,
  requiredKeys: options.requiredKeys ?? null,
})

// Cluster closure needs canonical membership and an explicit type.unknown branch.
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
        node.name.text === first.text &&
        node.getStart() < call.getStart()
      ) {
        const initializer = unwrapNode(node.initializer)
        if (initializer != null && ts.isConditionalExpression(initializer)) route = initializer
      }
      return false
    })
  }
  if (route == null) return false

  const canonicalBranch = unwrapNode(route.whenTrue)
  const unknownBranch = unwrapNode(route.whenFalse)
  if (stringArg(unknownBranch) !== `type.${GRAPH_UNKNOWN_TYPE}`) return false
  if (
    !ts.isTemplateExpression(canonicalBranch) ||
    canonicalBranch.head.text !== 'type.' ||
    canonicalBranch.templateSpans.length !== 1 ||
    canonicalBranch.templateSpans[0].literal.text !== ''
  ) {
    return false
  }
  const routedValue = unwrapNode(canonicalBranch.templateSpans[0].expression)

  const condition = unwrapNode(route.condition)
  const memberValue =
    ts.isCallExpression(condition) &&
    ts.isPropertyAccessExpression(condition.expression) &&
    condition.expression.name.text === 'includes' &&
    ts.isIdentifier(unwrapNode(condition.expression.expression)) &&
    unwrapNode(condition.expression.expression).text === 'DOSSIER_CARD_TYPES' &&
    condition.arguments.length === 1
      ? unwrapNode(condition.arguments[0])
      : null
  return memberValue != null && textOf(source, memberValue) === textOf(source, routedValue)
}

const classifyCall = ({
  root,
  repoPath,
  source,
  node,
  namespaces,
  domains,
  bindingContext,
  namespaceSupported = true,
  forceUnproven = false,
}) => {
  const first = node.arguments[0]
  const firstText = textOf(source, first)
  const fileBase = repoPath.split('/').at(-1)
  const template = templateLeaf(source, first)

  if (
    repoPath === LIST_FILE &&
    template?.head === 'list.' &&
    template.expression === 'translationKey'
  ) {
    const leaf = template.tail.replace(/^\./, '')
    if (leaf.length === 0) return null
    const domain = domains.listEntities.map((entity) => `list.${entity}.${leaf}`)
    return describeDomain(
      closedDomain(
        'list-entity-config',
        domain,
        provesClosedDomain('list-entity-config', {
          root,
          repoPath,
          source,
          node,
          domain: domains.listEntities,
          forceUnproven,
        }),
      ),
      `list.${leaf}`,
      'EntityType union cross-product',
    )
  }

  if (fileBase === 'CommandPalette.tsx' && firstText === 'analyzeLabelKey[analyze.queryType]') {
    return describeDomain(
      closedDomain(
        'command-analyze-record',
        domains.analyzeKeys,
        provesClosedDomain('command-analyze-record', {
          root,
          repoPath,
          source,
          node,
          domain: domains.analyzeKeys,
          forceUnproven,
        }),
      ),
      'lane3.commandPalette.analyze',
      'CommandPalette typed label record',
    )
  }

  if (
    fileBase === 'DossierTable.tsx' &&
    firstText === 'sensitivityLabelKey(row.sensitivity_level)'
  ) {
    return describeDomain(
      closedDomain(
        'dossier-sensitivity-helper',
        domains.sensitivityKeys,
        provesClosedDomain('dossier-sensitivity-helper', {
          root,
          repoPath,
          source,
          node,
          domain: domains.sensitivityKeys,
          forceUnproven,
        }),
      ),
      'lane3.dossierTable.sensitivity',
      'SENSITIVITY_CHIP plus unknown',
    )
  }

  if (fileBase === 'EngagementsList.tsx' && firstText === 'f.labelKey') {
    return describeDomain(
      closedDomain(
        'engagement-filter-map',
        domains.engagementFilterKeys,
        provesClosedDomain('engagement-filter-map', {
          root,
          repoPath,
          source,
          node,
          domain: domains.engagementFilterKeys,
          forceUnproven,
        }),
      ),
      'lane3.engagementsList.filterPill',
      'FILTERS.map membership',
    )
  }

  if (fileBase === 'IconRail.tsx' && firstText === 'item.tooltipKey') {
    return describeDomain(
      closedDomain(
        'icon-rail-map',
        domains.iconRailKeys,
        provesClosedDomain('icon-rail-map', {
          root,
          repoPath,
          source,
          node,
          domain: domains.iconRailKeys,
          forceUnproven,
        }),
      ),
      'lane3.iconRail.defaultItems',
      'defaultItems membership',
    )
  }

  if (fileBase === 'AnalyticQueryPicker.tsx' && firstText === 'tpl.labelKey') {
    return describeDomain(
      closedDomain(
        'analytic-template-map',
        domains.analyticTemplateKeys,
        provesClosedDomain('analytic-template-map', {
          root,
          repoPath,
          source,
          node,
          domain: domains.analyticTemplateKeys,
          forceUnproven,
        }),
      ),
      'lane3.analyticQueryPicker.templates',
      'TEMPLATES.map membership',
    )
  }

  if (fileBase === 'AnalyticResultView.tsx' && firstText === 'key') {
    return describeDomain(
      closedDomain(
        'analytic-count-switch',
        domains.analyticCountKeys,
        provesClosedDomain('analytic-count-switch', {
          root,
          repoPath,
          source,
          node,
          domain: domains.analyticCountKeys,
          forceUnproven,
        }),
      ),
      'lane3.analyticResultView.countLine',
      'closed renderCountLine callers',
    )
  }

  const staticCollectionDomain = staticCollectionWholeKeyDomain({ bindingContext, node })
  if (staticCollectionDomain != null) {
    return describeDomain(
      closedDomain(
        'static-literal-collection-whole-key',
        staticCollectionDomain,
        provesClosedDomain('static-literal-collection-whole-key', {
          node,
          domain: staticCollectionDomain,
          bindingContext,
          forceUnproven,
        }),
      ),
      'lane3.staticLiteralCollectionWholeKey',
      'static literal collection members; runtime logical-or tail excluded',
    )
  }

  const graphDisplayTypes = domains.graphDisplayTypes ?? []
  const graphClusterKeys = [
    ...graphDisplayTypes.map((type) => `type.${type}`),
    `type.${GRAPH_UNKNOWN_TYPE}`,
  ]

  const clusterCaller = enclosingFunction(node)
  const membershipCandidate =
    bindingContext != null && ruledMembershipRoute(bindingContext, node) != null
  const clusterCandidate =
    membershipCandidate ||
    (fileBase === 'AdvancedGraphVisualization.tsx' &&
      (firstText === 'data.clusterType' ||
        (clusterCaller != null &&
          containsNode(
            clusterCaller,
            (candidate) =>
              ts.isPropertyAccessExpression(candidate) &&
              ts.isIdentifier(candidate.expression) &&
              candidate.expression.text === 'data' &&
              candidate.name.text === 'clusterType',
          ))))
  if (clusterCandidate) {
    const unprefixed = firstText === 'data.clusterType'
    const domain = membershipCandidate
      ? graphClusterKeys
      : unprefixed
        ? graphDisplayTypes
        : graphClusterKeys
    return describeDomain(
      closedDomain(
        'graph-cluster-route',
        domain,
        provesClosedDomain('graph-cluster-route', {
          root,
          repoPath,
          source,
          node,
          domain,
          bindingContext,
          namespaces,
          namespaceSupported,
          forceUnproven,
        }),
      ),
      membershipCandidate
        ? 'lane3.ruled-membership-route'
        : unprefixed
          ? 'lane3.advancedGraph.cluster.unprefixed'
          : 'lane3.advancedGraph.cluster.routed',
      membershipCandidate || !unprefixed
        ? 'AST-proven DOSSIER_CARD_TYPES membership plus explicit type.unknown branch'
        : 'unproven DOSSIER_CARD_TYPES route',
      !membershipCandidate && unprefixed
        ? {
            clusterProbe: true,
            requiredKeys: graphDisplayTypes.map((type) => `type.${type}`),
          }
        : {},
    )
  }

  if (
    ['AdvancedGraphVisualization.tsx', 'AnalyticResultView.tsx'].includes(fileBase) &&
    template?.head === 'type.' &&
    template.tail === ''
  ) {
    const legend = entriesMapFor(node, 'NODE_COLORS')
    const rawDomain = legend == null ? domains.graphDisplayTypes : domains.graphLegendTypes
    const domain = rawDomain.map((type) => `type.${type}`)
    return describeDomain(
      closedDomain(
        'graph-type-map',
        domain,
        provesClosedDomain('graph-type-map', {
          root,
          repoPath,
          source,
          node,
          domain: rawDomain,
          forceUnproven,
        }),
      ),
      `lane3.${fileBase.replace(/\.tsx$/, '')}.graphType.${lineAt(source, node.getStart())}`,
      legend == null ? 'runtime graph node type' : 'NODE_COLORS entries slice',
    )
  }

  if (
    fileBase === 'AdvancedGraphVisualization.tsx' &&
    template?.head === 'relationship.' &&
    template.tail === ''
  ) {
    const domain = domains.graphRelationshipTypes.map((type) => `relationship.${type}`)
    return describeDomain(
      closedDomain(
        'graph-relationship-map',
        domain,
        provesClosedDomain('graph-relationship-map', {
          root,
          repoPath,
          source,
          node,
          domain: domains.graphRelationshipTypes,
          forceUnproven,
        }),
      ),
      `lane3.advancedGraph.relationship.${lineAt(source, node.getStart())}`,
      'runtime relationshipTypes set',
    )
  }

  return null
}

const profileFilesFor = (root, profile) =>
  profile === 'lane3' && existsSync(join(root, 'caller.tsx'))
    ? ['caller.tsx']
    : PROFILE_FILES[profile]

const collectCalls = (root, profile, { forceUnproven = false } = {}) => {
  const auditRoot = profile === 'ar04-pre-repair' ? PRE_REPAIR_ROOT : root
  const profileFiles = profileFilesFor(auditRoot, profile)
  if (profileFiles == null) throw new Error(`unknown profile: ${profile}`)
  const domains =
    profileFiles.length === 1 && profileFiles[0] === 'caller.tsx'
      ? {
          graphDisplayTypes: extractConstStringArray(
            auditRoot,
            'frontend/src/lib/dossier-type-guards.ts',
            'DOSSIER_CARD_TYPES',
          ),
        }
      : domainsFor(auditRoot)
  const bindingContext = bindingContextFor(auditRoot, profileFiles)
  const calls = []
  const unclassified = []
  const interpolationOnly = []
  const fallbackSites = []

  for (const repoPath of profileFiles) {
    const source = readSource(auditRoot, repoPath)
    const sourcePath = inputFile(auditRoot, repoPath)
    const sf =
      (sourcePath == null ? null : bindingContext.program.getSourceFile(sourcePath)) ??
      parseSource(repoPath, source)
    const bindings = findUseTranslationBindings(sf, source, bindingContext)
    const visit = (node) => {
      const binding = ts.isCallExpression(node) ? bindings.resolve(node.expression, node) : null
      if (ts.isCallExpression(node) && binding != null) {
        const first = node.arguments[0]
        const namespaceResult = namespaceOverride(
          [...node.arguments],
          binding.namespaces,
          bindingContext,
          node,
        )
        const namespaces = namespaceResult.namespaces
        const callSymbol = binding.symbol
        const translatorStable =
          binding.declaration == null ||
          callSymbol == null ||
          declarationIsConst(binding.declaration) ||
          !hasInterveningWrite(bindingContext, callSymbol, binding.declaration, node)
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
            fallbackSites.push(site)
            if (!binding.supported || !namespaceResult.supported || !translatorStable) {
              site.family = 'unclassified.translator-binding'
              unclassified.push({
                ...site,
                reason: !binding.factorySupported
                  ? `translator factory binding is not react-i18next useTranslation: ${binding.name}`
                  : !binding.namespaceSupported || !namespaceResult.supported
                    ? `translator namespace binding is not immutable at use: ${binding.name}`
                    : !translatorStable
                      ? `translator binding is not immutable at use: ${binding.name}`
                      : `unsupported useTranslation translator binding: ${binding.name}`,
              })
              ts.forEachChild(node, visit)
              return
            }
            if (optionShape(node.arguments[1]) === 'unsafe-options') {
              site.family = 'unclassified.opaque-options'
              unclassified.push({
                ...site,
                reason:
                  'defaultValue may be hidden by shorthand, computed, method, or spread option syntax',
              })
              ts.forEachChild(node, visit)
              return
            }
            const classified = classifyCall({
              root: auditRoot,
              repoPath,
              source,
              node,
              namespaces,
              domains,
              bindingContext,
              namespaceSupported: binding.namespaceSupported && namespaceResult.supported,
              forceUnproven,
            })
            if (classified == null || classified.keys.length === 0) {
              site.family = 'unclassified.unknown-shape'
              unclassified.push({
                ...site,
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
              site.proofSite = classified.proofSite
              if (!classified.closed) {
                unclassified.push({
                  ...site,
                  family: classified.kind,
                  reason: `AST did not prove closed domain at ${classified.proofSite}`,
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

const auditProfile = (root, profile = 'ar04-pre-repair', { forceUnproven = false } = {}) => {
  const auditRoot = profile === 'ar04-pre-repair' ? PRE_REPAIR_ROOT : root
  const bundles = loadBundles(auditRoot)
  const { calls, unclassified, interpolationOnly, fallbackSites } = collectCalls(root, profile, {
    forceUnproven,
  })
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

  // Keep the ruled 9 + 13 census; extras remain fail-closed fallback sites.
  const listSites = calls.filter((call) => call.file === LIST_FILE)
  const lane3Sites = calls.filter((call) => call.file !== LIST_FILE)
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
    evidenceRoot: auditRoot,
    profile,
    locales: LOCALES,
    productionEntryPoint: 'scripts/i18n-dynamic-key-audit.mjs',
    parser: 'typescript AST CallExpression',
    fallbackLng: false,
    forceUnproven,
    files: profileFilesFor(auditRoot, profile),
    callerPopulations: {
      fallbackSites: fallbackSites.length,
      listSites: listSites.length,
      listFamilies: new Set(listSites.map((call) => call.kind)).size,
      listLeaves: listRows.length,
      lane3Sites: lane3Sites.length,
      lane3Families: new Set(lane3Sites.map((call) => call.kind)).size,
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
    calls,
    unclassified,
    interpolationOnly,
    fallbackSites,
    proofRows: fallbackSites.map((site) => {
      const call = calls.find(
        (candidate) =>
          candidate.file === site.file &&
          candidate.line === site.line &&
          candidate.expression === site.expression,
      )
      return {
        status: call?.closed === true ? 'CLOSED' : 'UNCLASSIFIED',
        proofSite: call?.proofSite ?? site.proofSite ?? 'none',
        family: site.family ?? 'unclassified.unknown-shape',
        file: site.file,
        line: site.line,
        expression: site.expression,
        namespaces: site.namespaces.map(bundleNamespace),
      }
    }),
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
  const seen = []
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 't'
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
  const staticCollectionSources = {
    'collection.ts': `
      export const createFixtureGroups = () => {
        const groups = [
          {
            label: 'navigation.group',
            items: [{ label: 'navigation.alpha' }, { label: 'navigation.beta' }],
          },
        ]
        groups.push({ items: [{ label: 'navigation.gamma' }] })
        return groups
      }

      export const mutatedPages = [{ label: 'navigation.initial' }]
      mutatedPages.push({ label: 'navigation.pushed' })
    `,
    'fixture.tsx': `
      import { createFixtureGroups, mutatedPages } from './collection'
      declare function useMemo<T>(factory: () => T, dependencies: unknown[]): T
      declare function t(key: unknown, fallback: string): unknown

      const groupKeys = { alpha: 'groups.alpha', beta: 'groups.beta' }
      const rows = [{ type: 'alpha' }, { type: 'beta' }]
      rows.map((row) => {
        const groupKey = groupKeys[row.type] || row.type
        t(groupKey, 'Default')
      })

      const pages = useMemo(() => {
        const groups = createFixtureGroups()
        return groups.flatMap((group) => group.items)
      }, [])
      const filteredPages = useMemo(() => pages.filter((page) => page.label), [pages])
      filteredPages.slice(0, 2).map((page) => t(page.label, 'Default'))
      mutatedPages.map((mutatedPage) => t(mutatedPage.label, 'Default'))

      function runtimeFixture(runtimeKey: string) {
        t(runtimeKey, 'Default')
      }
    `,
  }
  const staticCollectionContext = bindingContextForSources(staticCollectionSources)
  const staticCollectionFile = staticCollectionContext.program.getSourceFile(
    resolve(staticCollectionContext.root, 'fixture.tsx'),
  )
  const staticClassifications = new Map()
  if (staticCollectionFile != null) {
    const fixtureText = staticCollectionSources['fixture.tsx']
    const classifyFixtureCall = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 't'
      ) {
        const key = textOf(fixtureText, node.arguments[0])
        staticClassifications.set(
          key,
          classifyCall({
            root: staticCollectionContext.root,
            repoPath: 'fixture.tsx',
            source: fixtureText,
            node,
            namespaces: ['fixture'],
            domains: {},
            bindingContext: staticCollectionContext,
          }),
        )
      }
      ts.forEachChild(node, classifyFixtureCall)
    }
    classifyFixtureCall(staticCollectionFile)
  }
  const inFileCollection = staticClassifications.get('groupKey') ?? null
  const crossModuleCollection = staticClassifications.get('page.label') ?? null
  const crossModuleMutation = staticClassifications.get('mutatedPage.label') ?? null
  const runtimeWholeKey = staticClassifications.get('runtimeKey') ?? null
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
    staticCollectionWholeKeyClassifies: inFileCollection != null && crossModuleCollection != null,
    staticCollectionDomainIsClosed:
      inFileCollection?.closed === true &&
      sameStrings(inFileCollection.keys, ['groups.alpha', 'groups.beta']) &&
      crossModuleCollection?.closed === true &&
      sameStrings(crossModuleCollection.keys, [
        'navigation.alpha',
        'navigation.beta',
        'navigation.gamma',
      ]),
    runtimeWholeKeyStaysUnclassified: runtimeWholeKey == null,
    crossModuleMutationStaysUnclassified: crossModuleMutation == null,
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

const printProofRows = (result) => {
  for (const row of result.proofRows) {
    console.log(
      `${row.status}\t${row.proofSite}\t${row.family}\t${row.file}:${row.line}\t${row.expression.replace(/\s+/g, ' ')}\tns=${row.namespaces.join('|')}`,
    )
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
    const result = auditProfile(options.root, options.profile, {
      forceUnproven: options.forceUnproven,
    })
    const failures = evaluateExpectations(result, options.expects)
    if (options.rows) {
      printProofRows(result)
      process.exit(0)
    } else if (options.json) console.log(JSON.stringify(result, null, 2))
    else printHuman(result)
    const controlledPreRepair =
      options.profile === 'ar04-pre-repair' && Object.keys(options.expects).length > 0
    if (controlledPreRepair && result.callerPopulations.fallbackSites !== 25) {
      failures.push(
        `controlled fallback population: expected 25, got ${result.callerPopulations.fallbackSites}`,
      )
    }
    if (
      controlledPreRepair &&
      result.unclassified.some((row) => row.family === 'unclassified.opaque-options')
    ) {
      failures.push('controlled population contains an opaque call shape')
    }
    if (result.counts.unclassified > 0 && !controlledPreRepair) {
      failures.push(`${result.counts.unclassified} unclassified call(s)`)
    }
    if (result.counts.missingRequiredBundles > 0) {
      failures.push(
        `${result.counts.missingRequiredBundles} missing required locale bundle(s): ${result.missingRequiredBundles
          .map((row) => `${row.locale}/${row.namespace}`)
          .join(', ')}`,
      )
    }
    if (!controlledPreRepair) {
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
