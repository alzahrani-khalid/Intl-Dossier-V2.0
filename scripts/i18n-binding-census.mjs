#!/usr/bin/env node
// i18n-binding-census.mjs — resource-aware AST census of t() call bindings.
//
// Static namespace lists use i18next's resolution law: for each supported locale,
// walk the list in order and stop at the first bundle that defines the complete
// key path. Objects are definitions too (returnObjects); they stop the walk and
// are reported as object returns. The two locale outcomes are retained rather
// than folded into an order-blind namespace membership test.
//
// Usage: node scripts/i18n-binding-census.mjs <root> --self-check [--json]
//        node scripts/i18n-binding-census.mjs <root> --base <ref> [--json]

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const LOCALES = ['en', 'ar']
const COMMON_JSON = 'frontend/src/i18n/en/common.json'
const COMMON_JSON_BY_LOCALE = Object.fromEntries(
  LOCALES.map((locale) => [locale, `frontend/src/i18n/${locale}/common.json`]),
)
const I18N_INDEX = 'frontend/src/i18n/index.ts'
const FIXTURE = 'scripts/fixtures/i18n-binding-census-controls.tsx'
const QUICK_FILTER = /\buseTranslation\b|\bt\s*\(|\.t\s*\(/
const MAX_BUFFER = 256 * 1024 * 1024

function parseArgs(argv) {
  const args = { root: null, base: null, json: false, selfCheck: false }
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--json') args.json = true
    else if (arg === '--self-check') args.selfCheck = true
    else if (arg === '--base') args.base = argv[++i] || null
    else if (!arg.startsWith('--') && !args.root) args.root = arg
  }
  if (!args.root || (!args.selfCheck && !args.base)) {
    console.error('usage: i18n-binding-census.mjs <root> [--self-check | --base <ref> [--json]]')
    process.exit(2)
  }
  return args
}

function git(root, args, options = {}) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  })
}

function resolveCommit(root, ref) {
  try {
    return git(root, ['rev-parse', '--verify', `${ref}^{commit}`]).trim()
  } catch {
    return null
  }
}

function readRefFile(root, ref, relativePath) {
  try {
    return git(root, ['show', `${ref}:${relativePath}`])
  } catch {
    return null
  }
}

function unwrapExpression(node) {
  let current = node
  while (current && (ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) ||
      ts.isParenthesizedExpression(current) || ts.isSatisfiesExpression(current))) {
    current = current.expression
  }
  return current
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text
  return null
}

function objectProperty(objectNode, name) {
  const object = unwrapExpression(objectNode)
  if (!object || !ts.isObjectLiteralExpression(object)) return null
  for (const prop of object.properties) {
    if (ts.isPropertyAssignment(prop) && propertyName(prop.name) === name) return unwrapExpression(prop.initializer)
  }
  return null
}

function literalText(node) {
  if (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) return node.text
  return null
}

// Read the namespace-to-JSON wiring from the real i18n resources object at ref.
function readI18nConfig(root, ref) {
  const text = readRefFile(root, ref, I18N_INDEX)
  if (text === null) throw new Error(`cannot read ${I18N_INDEX} at ${ref}`)
  const sf = ts.createSourceFile(I18N_INDEX, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports = new Map()
  let resourcesNode = null
  let initArg = null

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
        node.importClause?.name && node.moduleSpecifier.text.endsWith('.json')) {
      const relative = path.posix.normalize(path.posix.join(path.posix.dirname(I18N_INDEX), node.moduleSpecifier.text))
      imports.set(node.importClause.name.text, relative)
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
        node.name.text === 'resources' && node.initializer) {
      resourcesNode = unwrapExpression(node.initializer)
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'init' && node.arguments.length > 0) {
      const candidate = unwrapExpression(node.arguments[0])
      if (candidate && ts.isObjectLiteralExpression(candidate)) initArg = candidate
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  if (!resourcesNode || !ts.isObjectLiteralExpression(resourcesNode)) {
    throw new Error(`cannot derive resources object from ${I18N_INDEX} at ${ref}`)
  }

  let defaultNS = 'translation'
  if (initArg) {
    const configured = objectProperty(initArg, 'defaultNS')
    const literal = literalText(configured)
    if (literal !== null) defaultNS = literal
    else if (configured && ts.isArrayLiteralExpression(configured)) {
      const firstLiteral = literalText(configured.elements[0])
      if (firstLiteral !== null) defaultNS = firstLiteral
    }
  }

  const resources = new Map()
  const commonNsByLocale = new Map()
  for (const locale of LOCALES) {
    const localeNode = objectProperty(resourcesNode, locale)
    if (!localeNode || !ts.isObjectLiteralExpression(localeNode)) {
      throw new Error(`resources.${locale} is not a static object at ${ref}`)
    }
    const bundles = new Map()
    const commonNamespaces = new Set()
    for (const prop of localeNode.properties) {
      if (!ts.isPropertyAssignment(prop)) continue
      const namespace = propertyName(prop.name)
      const initializer = unwrapExpression(prop.initializer)
      if (namespace === null || !initializer || !ts.isIdentifier(initializer)) continue
      const relative = imports.get(initializer.text)
      if (!relative) continue
      const raw = readRefFile(root, ref, relative)
      if (raw === null) throw new Error(`cannot read resource ${relative} at ${ref}`)
      let bundle
      try {
        bundle = JSON.parse(raw)
      } catch {
        throw new Error(`invalid JSON resource ${relative} at ${ref}`)
      }
      bundles.set(namespace, bundle)
      if (relative === COMMON_JSON_BY_LOCALE[locale]) commonNamespaces.add(namespace)
    }
    resources.set(locale, bundles)
    commonNsByLocale.set(locale, commonNamespaces)
  }

  const commonNs = new Set()
  for (const namespaces of commonNsByLocale.values()) {
    for (const namespace of namespaces) commonNs.add(namespace)
  }
  return { resources, commonNsByLocale, commonNs, defaultNS }
}

function collectPaths(value, prefix, out) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  for (const key of Object.keys(value)) {
    const next = prefix ? `${prefix}.${key}` : key
    out.add(next)
    collectPaths(value[key], next, out)
  }
}

function preFlattenUniverse(root, startingRef) {
  const start = resolveCommit(root, startingRef)
  if (start === null) return { paths: new Set(), pathsByLocale: new Map(), sourceRef: null }
  let candidates
  try {
    candidates = git(root, [
      'rev-list', '--first-parent', '-n', '80', start, '--', COMMON_JSON,
    ]).trim().split('\n').filter(Boolean)
  } catch {
    candidates = []
  }
  if (!candidates.includes(start)) candidates.unshift(start)

  for (const ref of candidates) {
    const pathsByLocale = new Map()
    let complete = true
    for (const locale of LOCALES) {
      const raw = readRefFile(root, ref, COMMON_JSON_BY_LOCALE[locale])
      let json
      try {
        json = raw === null ? null : JSON.parse(raw)
      } catch {
        json = null
      }
      if (!json || typeof json.common !== 'object' || json.common === null || Array.isArray(json.common)) {
        complete = false
        break
      }
      const paths = new Set(['common'])
      collectPaths(json.common, 'common', paths)
      pathsByLocale.set(locale, paths)
    }
    if (complete) return { paths: pathsByLocale.get('en'), pathsByLocale, sourceRef: ref }
  }
  return { paths: new Set(), pathsByLocale: new Map(), sourceRef: null }
}

function listSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.archive' || entry.name.startsWith('.git')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) listSourceFiles(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

function currentSources(root) {
  return listSourceFiles(path.join(root, 'frontend', 'src')).map((file) => ({
    file: path.relative(root, file),
    text: fs.readFileSync(file, 'utf8'),
  }))
}

// Load the base source tree through one cat-file process. This keeps `governed`
// independently re-derived without constructing a second worktree or mutating root.
function refSources(root, ref) {
  const tree = git(root, ['ls-tree', '-r', '-z', ref, '--', 'frontend/src'])
  const entries = tree.split('\0').filter(Boolean).map((line) => {
    const match = /^\d+\s+blob\s+([0-9a-f]+)\t(.+)$/.exec(line)
    return match ? { oid: match[1], file: match[2] } : null
  }).filter((entry) => entry && /\.(ts|tsx)$/.test(entry.file))
  const input = entries.map((entry) => entry.oid).join('\n') + '\n'
  const output = execFileSync('git', ['-C', root, 'cat-file', '--batch'], {
    input,
    maxBuffer: MAX_BUFFER,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const sources = []
  let offset = 0
  for (const entry of entries) {
    const newline = output.indexOf(10, offset)
    if (newline < 0) throw new Error(`truncated git cat-file header for ${entry.file}`)
    const header = output.subarray(offset, newline).toString('utf8')
    const match = /^[0-9a-f]+ blob (\d+)$/.exec(header)
    if (!match) throw new Error(`unexpected git cat-file header for ${entry.file}: ${header}`)
    const size = Number(match[1])
    const start = newline + 1
    const end = start + size
    sources.push({ file: entry.file, text: output.subarray(start, end).toString('utf8') })
    offset = end + 1
  }
  return sources
}

function staticNamespaceList(node) {
  const literal = literalText(node)
  if (literal !== null) return { kind: 'static', nsList: [literal] }
  if (!node || !ts.isArrayLiteralExpression(node) || node.elements.length === 0) return { kind: 'dynamic' }
  const nsList = []
  for (const element of node.elements) {
    const elementLiteral = literalText(element)
    if (elementLiteral === null) return { kind: 'dynamic' }
    nsList.push(elementLiteral)
  }
  return { kind: 'static', nsList }
}

function hookNsSpec(args) {
  if (args.length === 0) return { kind: 'default' }
  return staticNamespaceList(args[0])
}

function functionName(node) {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text
  if ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
      ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) return node.parent.name.text
  return null
}

function censusFile(file, text, config) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const calls = []

  const isFunctionLike = (node) => ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)

  const record = (node, bindingSpec, owner, propertyAccess) => {
    const arg0 = node.arguments[0]
    const key = arg0 === undefined ? null : literalText(arg0)
    const nonLiteral = key === null
    let keyPath = key
    let explicitNs = null
    if (key !== null) {
      const prefix = /^([A-Za-z0-9_-]+):/.exec(key)
      if (prefix) {
        explicitNs = prefix[1]
        keyPath = key.slice(prefix[0].length)
      }
    }

    let nsOption = false
    let optionSpec = null
    if (explicitNs === null) {
      for (let i = 1; i < node.arguments.length; i++) {
        const options = unwrapExpression(node.arguments[i])
        if (!options || !ts.isObjectLiteralExpression(options)) continue
        const nsNode = objectProperty(options, 'ns')
        if (!nsNode) continue
        nsOption = true
        optionSpec = staticNamespaceList(nsNode)
      }
    }

    let effectiveSpec
    if (explicitNs !== null) effectiveSpec = { kind: 'static', nsList: [explicitNs] }
    else if (optionSpec !== null) effectiveSpec = optionSpec
    else if (bindingSpec.kind === 'default') effectiveSpec = { kind: 'static', nsList: [config.defaultNS] }
    else effectiveSpec = bindingSpec

    const position = sf.getLineAndCharacterOfPosition(node.getStart(sf))
    calls.push({
      file,
      line: position.line + 1,
      key,
      keyPath,
      nonLiteral,
      explicitNs,
      nsOption,
      effectiveSpec,
      propertyAccess,
      owner,
    })
  }

  const walk = (node, scopes, owner) => {
    let active = scopes
    let activeOwner = owner
    if (isFunctionLike(node)) {
      active = [...scopes, new Map()]
      activeOwner = functionName(node) || owner
    }

    if (ts.isVariableDeclaration(node) && node.initializer &&
        ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === 'useTranslation' && ts.isObjectBindingPattern(node.name)) {
      const spec = hookNsSpec(node.initializer.arguments)
      const layer = active[active.length - 1]
      for (const element of node.name.elements) {
        const prop = element.propertyName ? propertyName(element.propertyName) : propertyName(element.name)
        if (prop === 't' && ts.isIdentifier(element.name)) layer.set(element.name.text, spec)
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression
      let spec = null
      let propertyAccess = false
      if (ts.isIdentifier(callee)) {
        for (let i = active.length - 1; i >= 0 && spec === null; i--) {
          if (active[i].has(callee.text)) spec = active[i].get(callee.text)
        }
        if (spec === null && callee.text === 't') spec = { kind: 'dynamic' }
      } else if (ts.isPropertyAccessExpression(callee) && callee.name.text === 't') {
        if (ts.isIdentifier(callee.expression) && callee.expression.text === 'i18n') {
          spec = { kind: 'default' }
        } else {
          spec = { kind: 'property' }
          propertyAccess = true
        }
      }
      if (spec !== null) record(node, spec, activeOwner, propertyAccess)
    }

    ts.forEachChild(node, (child) => walk(child, active, activeOwner))
  }

  walk(sf, [new Map()], null)
  return calls
}

function definedLookup(bundle, keyPath) {
  if (keyPath === null || keyPath.length === 0) return { defined: false, value: undefined }
  let value = bundle
  for (const segment of keyPath.split('.')) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        !Object.prototype.hasOwnProperty.call(value, segment)) {
      return { defined: false, value: undefined }
    }
    value = value[segment]
  }
  return { defined: true, value }
}

function resolveCall(call, config) {
  if (call.nonLiteral || call.propertyAccess || call.effectiveSpec.kind !== 'static') return null
  const resolutions = {}
  for (const locale of LOCALES) {
    const bundles = config.resources.get(locale)
    let outcome = null
    for (const namespace of call.effectiveSpec.nsList) {
      const bundle = bundles.get(namespace)
      if (bundle === undefined) continue
      const lookup = definedLookup(bundle, call.keyPath)
      if (!lookup.defined) continue
      const objectReturn = lookup.value !== null && typeof lookup.value === 'object'
      outcome = { namespace, defined: true, objectReturn }
      break
    }
    resolutions[locale] = outcome || { namespace: null, defined: false, objectReturn: false }
  }
  return resolutions
}

function pair(calls) {
  return { sites: calls.length, files: new Set(calls.map((call) => call.file)).size }
}

function sameResolution(left, right) {
  return left.namespace === right.namespace && left.defined === right.defined &&
    left.objectReturn === right.objectReturn
}

function governedCall(call, resolutions, config, universe) {
  if (resolutions === null || call.keyPath === null) return false
  return LOCALES.every((locale) => resolutions[locale].defined &&
    config.commonNsByLocale.get(locale).has(resolutions[locale].namespace) &&
    universe.pathsByLocale.get(locale).has(call.keyPath))
}

function analyzeSources(sources, config, universe) {
  const allCalls = []
  let parsedFiles = 0
  for (const source of sources) {
    if (!QUICK_FILTER.test(source.text)) continue
    parsedFiles++
    allCalls.push(...censusFile(source.file, source.text, config))
  }

  const literal = []
  const nonLiteral = []
  const dynamic = []
  const dynamicLiteral = []
  const dynamicNonLiteral = []
  const property = []
  const blindUnion = new Set()
  const commonRouted = []
  const governed = []
  const commonColonResolved = []
  const translationColonExplicit = []
  const dotForm = []
  const nsOption = []
  const deprefixTotal = []
  const deprefixResolved = []
  const deprefixOutside = []
  const localeDivergent = []
  const objectReturns = []

  for (const call of allCalls) {
    if (call.nonLiteral) {
      nonLiteral.push(call)
      blindUnion.add(call)
    } else {
      literal.push(call)
    }
    if (call.propertyAccess) {
      property.push(call)
      blindUnion.add(call)
    } else if (call.effectiveSpec.kind === 'dynamic') {
      dynamic.push(call)
      blindUnion.add(call)
      if (call.nonLiteral) dynamicNonLiteral.push(call)
      else dynamicLiteral.push(call)
    }

    const resolutions = resolveCall(call, config)
    call.resolutions = resolutions
    if (resolutions && LOCALES.every((locale) => resolutions[locale].defined &&
        config.commonNsByLocale.get(locale).has(resolutions[locale].namespace))) {
      commonRouted.push(call)
    }
    if (resolutions && !sameResolution(resolutions.en, resolutions.ar)) {
      localeDivergent.push({
        file: call.file,
        line: call.line,
        key: call.key,
        resolutions,
      })
    }
    if (resolutions && LOCALES.find((locale) => resolutions[locale].objectReturn) !== undefined) {
      objectReturns.push({ file: call.file, line: call.line, key: call.key, resolutions })
    }

    const isDeprefix = call.key !== null && call.key.startsWith('common:common.')
    if (isDeprefix) {
      deprefixTotal.push(call)
      if (LOCALES.every((locale) => universe.pathsByLocale.get(locale).has(call.keyPath))) {
        deprefixResolved.push(call)
      } else {
        deprefixOutside.push(call)
      }
    }

    if (!governedCall(call, resolutions, config, universe)) continue
    governed.push(call)
    if (call.explicitNs === 'common') commonColonResolved.push(call)
    else if (call.explicitNs === 'translation') translationColonExplicit.push(call)
    else if (call.nsOption) nsOption.push(call)
    else dotForm.push(call)
  }

  return {
    scannedFiles: sources.length,
    parsedFiles,
    literalKeyCalls: literal.length,
    nonLiteralKeyCalls: nonLiteral.length,
    commonNamespaceCalls: commonRouted.length,
    dynamicNamespaceCalls: dynamicLiteral.length,
    propertyAccessCalls: property.length,
    calls: allCalls,
    governedCalls: governed,
    partitions: {
      union: pair(governed),
      commonColonResolved: pair(commonColonResolved),
      translationColonExplicit: pair(translationColonExplicit),
      dotForm: pair(dotForm),
      nsOption: pair(nsOption),
    },
    deprefixClass: {
      total: pair(deprefixTotal),
      resolved: pair(deprefixResolved),
      outside: pair(deprefixOutside),
    },
    blind: {
      dynamicNamespace: pair(dynamic),
      dynamicNamespaceLiteralKey: pair(dynamicLiteral),
      dynamicNamespaceNonLiteralKey: pair(dynamicNonLiteral),
      nonLiteralKey: pair(nonLiteral),
      propertyAccess: pair(property),
      union: pair([...blindUnion]),
    },
    localeDivergent,
    objectReturns,
  }
}

function publicCall(call) {
  return {
    file: call.file,
    line: call.line,
    key: call.key,
    namespaces: call.effectiveSpec.nsList,
    resolutions: call.resolutions,
  }
}

function redirectedStdoutPath() {
  try {
    if (!fs.fstatSync(1).isFile()) return null
  } catch {
    return null
  }

  try {
    const target = fs.readlinkSync('/proc/self/fd/1')
    if (target.startsWith('/')) return target
  } catch {
    // macOS does not expose redirected stdout through /proc.
  }

  try {
    const listing = execFileSync('lsof', ['-n', '-p', String(process.pid), '-a', '-d', '1', '-Fn'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const name = listing.split('\n').find((line) => line.startsWith('n/'))
    return name ? name.slice(1) : null
  } catch {
    return null
  }
}

function addControlResources(config) {
  for (const locale of LOCALES) {
    config.resources.get(locale).set('census-object', { common: { close: { blocked: true } } })
    config.resources.get(locale).set('census-locale', locale === 'en'
      ? { common: { close: 'English-only earlier definition' } }
      : {})
  }
}

function controlByOwner(analysis, owner) {
  return analysis.calls.find((call) => call.owner === owner) || null
}

function runSelfCheck(root, universe) {
  const config = readI18nConfig(root, universe.sourceRef)
  addControlResources(config)
  const fixture = path.join(root, FIXTURE)
  const analysis = analyzeSources([{
    file: FIXTURE,
    text: fs.readFileSync(fixture, 'utf8'),
  }], config, universe)

  const positiveOwners = [
    'KeyPrefixForm',
    'DoublePrefixForm',
    'NsOptionTranslationForm',
    'NsOptionCommonForm',
    'HookBindingForm',
    'ScopedAliasForm',
    'MultilineForm',
    'ArrayBindingForm',
    'ControlLaterCommon',
  ]
  const positiveCalls = positiveOwners.map((owner) => controlByOwner(analysis, owner))
  const positiveSet = new Set(positiveCalls.filter(Boolean))
  const positivesPassed = positiveCalls.every((call) => call && analysis.governedCalls.includes(call)) &&
    analysis.governedCalls.length === positiveSet.size

  const laterCommon = controlByOwner(analysis, 'ControlLaterCommon')
  const scalarShadow = controlByOwner(analysis, 'ControlScalarShadow')
  const objectShadow = controlByOwner(analysis, 'ControlObjectShadow')
  const localeDivergent = controlByOwner(analysis, 'ControlLocaleDivergent')
  const dynamicArray = controlByOwner(analysis, 'ControlDynamicArray')
  const propertyAccess = controlByOwner(analysis, 'ControlPropertyAccess')
  const nonLiteral = controlByOwner(analysis, 'ControlNonLiteral')
  const bothResolve = (call, namespace, objectReturn = false) => call && call.resolutions &&
    LOCALES.every((locale) => call.resolutions[locale].defined &&
      call.resolutions[locale].namespace === namespace &&
      call.resolutions[locale].objectReturn === objectReturn)

  const controls = [
    { name: 'later-common', passed: bothResolve(laterCommon, 'translation') },
    { name: 'scalar-shadow', passed: bothResolve(scalarShadow, 'sla') &&
      !analysis.governedCalls.includes(scalarShadow) },
    { name: 'object-shadow', passed: bothResolve(objectShadow, 'census-object', true) &&
      !analysis.governedCalls.includes(objectShadow) },
    { name: 'locale-divergent', passed: localeDivergent && localeDivergent.resolutions &&
      localeDivergent.resolutions.en.namespace === 'census-locale' &&
      localeDivergent.resolutions.ar.namespace === 'translation' &&
      analysis.localeDivergent.find((entry) => entry.line === localeDivergent.line) !== undefined },
    { name: 'dynamic-array', passed: dynamicArray?.effectiveSpec.kind === 'dynamic' &&
      analysis.blind.dynamicNamespaceLiteralKey.sites >= 1 &&
      !analysis.governedCalls.includes(dynamicArray) },
    { name: 'property-access', passed: propertyAccess?.propertyAccess === true &&
      !analysis.governedCalls.includes(propertyAccess) },
    { name: 'non-literal', passed: nonLiteral?.nonLiteral === true &&
      !analysis.governedCalls.includes(nonLiteral) },
  ]
  return {
    ok: positivesPassed && controls.every((control) => control.passed),
    positives: positiveSet.size,
    controls,
    universeSourceRef: universe.sourceRef,
    localeDivergent: analysis.localeDivergent,
  }
}

function writeReport(report, json) {
  const serialized = JSON.stringify(report, null, json ? 0 : 2)
  if (json) {
    const stdoutPath = redirectedStdoutPath()
    if (stdoutPath && path.extname(stdoutPath) !== '.json') {
      const jsonPath = `${stdoutPath}.json`
      try {
        fs.writeFileSync(jsonPath, `${serialized}\n`, 'utf8')
        fs.unlinkSync(stdoutPath)
        fs.symlinkSync(jsonPath, stdoutPath)
        return
      } catch {
        // Fall back to ordinary stdout when the redirected path cannot be replaced.
      }
    }
  }
  process.stdout.write(`${serialized}\n`)
}

const args = parseArgs(process.argv)
const root = path.resolve(args.root)
const startingRef = args.selfCheck ? 'HEAD' : args.base
const universe = preFlattenUniverse(root, startingRef)

if (universe.paths.size === 0 || universe.sourceRef === null) {
  console.error(
    `CENSUS-FAIL: pre-flatten universe could not be derived (base=${startingRef}); ` +
      'refusing to report against an empty key universe',
  )
  process.exit(1)
}

try {
  if (args.selfCheck) {
    const ledger = runSelfCheck(root, universe)
    writeReport(ledger, args.json)
    process.exit(ledger.ok ? 0 : 1)
  }

  const config = readI18nConfig(root, universe.sourceRef)
  const current = analyzeSources(currentSources(root), config, universe)
  const historical = analyzeSources(refSources(root, universe.sourceRef), config, universe)
  const unrepointed = current.governedCalls.map(publicCall)
  const doublePrefixed = current.calls.filter((call) => call.key !== null &&
    call.explicitNs !== null && config.commonNs.has(call.explicitNs) &&
    (call.keyPath === 'common' || call.keyPath.startsWith('common.'))).length

  const report = {
    scannedFiles: current.scannedFiles,
    parsedFiles: current.parsedFiles,
    literalKeyCalls: current.literalKeyCalls,
    nonLiteralKeyCalls: current.nonLiteralKeyCalls,
    commonNamespaceCalls: current.commonNamespaceCalls,
    dynamicNamespaceCalls: current.dynamicNamespaceCalls,
    propertyAccessCalls: current.propertyAccessCalls,
    commonNamespaces: [...config.commonNs].sort(),
    defaultNS: config.defaultNS,
    base: args.base,
    universeSourceRef: universe.sourceRef,
    governed: historical.partitions.union,
    partitions: historical.partitions,
    deprefixClass: current.deprefixClass,
    blind: current.blind,
    localeDivergent: current.localeDivergent,
    objectReturns: current.objectReturns,
    unrepointed,
    doublePrefixed,
  }
  const clean = unrepointed.length === 0 && doublePrefixed === 0
  writeReport(report, args.json)
  console.error(
    `blind populations: dynamicNamespace=${report.blind.dynamicNamespace.sites}/${report.blind.dynamicNamespace.files} ` +
    `nonLiteralKey=${report.blind.nonLiteralKey.sites}/${report.blind.nonLiteralKey.files} ` +
    `propertyAccess=${report.blind.propertyAccess.sites}/${report.blind.propertyAccess.files} ` +
    `union=${report.blind.union.sites}/${report.blind.union.files}`,
  )
  process.exit(clean ? 0 : 1)
} catch (error) {
  console.error(`CENSUS-FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
