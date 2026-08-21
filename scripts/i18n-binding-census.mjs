#!/usr/bin/env node
// i18n-binding-census.mjs — controlled AST census of t() call bindings.
//
// Per call it resolves the EFFECTIVE namespace through key prefixes (t('ns:key')),
// `{ ns }` options, scoped hook aliases, array bindings (i18next searches the array
// in order, so EVERY static element counts, not just the first), multiline calls
// (AST — layout is irrelevant) and the default namespace configured in
// frontend/src/i18n/index.ts (i18next fallback 'translation').
//
// A call is a PRE-FLATTEN ROUTE ("unrepointed") when that namespace is common.json
// and its literal key path is `common.X` where the path resolved inside the nested
// `common` subtree — the universe re-derived from git: nearest commit at-or-before
// --base whose en/common.json still has a top-level `common` object. Keys absent
// pre-flatten (e.g. common.previousPage) are NOT flagged; they are the
// common-owner lane's to author.
//
// Usage: node scripts/i18n-binding-census.mjs <root> --self-check
//        node scripts/i18n-binding-census.mjs <root> --base <ref> [--json]
// --json puts ONLY the JSON report on stdout; blind populations go to stderr.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const COMMON_JSON = 'frontend/src/i18n/en/common.json'
const I18N_INDEX = 'frontend/src/i18n/index.ts'
const FIXTURE = 'scripts/fixtures/i18n-binding-census-controls.tsx'

function parseArgs(argv) {
  const args = { root: null, base: null, json: false, selfCheck: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') args.json = true
    else if (a === '--self-check') args.selfCheck = true
    else if (a === '--base') args.base = argv[++i]
    else if (!a.startsWith('--') && !args.root) args.root = a
  }
  if (!args.root) {
    console.error('usage: i18n-binding-census.mjs <root> [--self-check | --base <ref> [--json]]')
    process.exit(2)
  }
  return args
}

// --- i18n config: which namespace names map to common.json ---

function readI18nConfig(root) {
  const file = path.join(root, I18N_INDEX)
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

  // local identifier bound to './en/common.json'
  let commonImport = null
  let resourcesNode = null
  let initArg = null
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.moduleSpecifier.text.replace(/^\.\//, '') === 'en/common.json') {
        const clause = node.importClause
        if (clause && clause.name) commonImport = clause.name.text
        if (clause && clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          commonImport = clause.namedBindings.name.text
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.name.text === 'resources' && node.initializer) {
      resourcesNode = node.initializer
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'init' && node.arguments.length > 0 &&
        ts.isObjectLiteralExpression(node.arguments[0])) {
      initArg = node.arguments[0]
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  const commonNs = new Set()
  if (resourcesNode && commonImport) {
    const scanResources = (objLit) => {
      for (const langProp of objLit.properties) {
        if (!ts.isPropertyAssignment(langProp) || !ts.isObjectLiteralExpression(langProp.initializer)) continue
        for (const nsProp of langProp.initializer.properties) {
          if (!ts.isPropertyAssignment(nsProp)) continue
          if (ts.isIdentifier(nsProp.initializer) && nsProp.initializer.text === commonImport) {
            const name = ts.isStringLiteral(nsProp.name) || ts.isIdentifier(nsProp.name)
              ? nsProp.name.text : null
            if (name) commonNs.add(name)
          }
        }
      }
    }
    if (ts.isObjectLiteralExpression(resourcesNode)) scanResources(resourcesNode)
    else if (ts.isAsExpression(resourcesNode) && ts.isObjectLiteralExpression(resourcesNode.expression)) {
      scanResources(resourcesNode.expression)
    }
  }

  // configured default namespace; i18next falls back to 'translation'
  let defaultNS = 'translation'
  if (initArg) {
    for (const prop of initArg.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'defaultNS') {
        if (ts.isStringLiteral(prop.initializer)) defaultNS = prop.initializer.text
        else if (ts.isArrayLiteralExpression(prop.initializer) && prop.initializer.elements.length > 0 &&
                 ts.isStringLiteral(prop.initializer.elements[0])) {
          defaultNS = prop.initializer.elements[0].text
        }
      }
    }
  }
  return { commonNs, defaultNS }
}

// --- pre-flatten key universe from git history ---

function collectPaths(value, prefix, out) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      const p = prefix ? `${prefix}.${key}` : key
      out.add(p) // object nodes resolve too (returnObjects); leaves added below
      collectPaths(value[key], p, out)
    }
  }
}

function preFlattenUniverse(root, baseRef) {
  const candidates = []
  if (baseRef) candidates.push(baseRef)
  try {
    const list = execFileSync(
      'git', ['-C', root, 'rev-list', '--first-parent', '-n', '80', baseRef || 'HEAD', '--', COMMON_JSON],
      { encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean)
    candidates.push(...list)
  } catch {
    // fall through with baseRef only
  }
  const seen = new Set()
  for (const ref of candidates) {
    if (seen.has(ref)) continue
    seen.add(ref)
    let raw
    try {
      raw = execFileSync('git', ['-C', root, 'show', `${ref}:${COMMON_JSON}`], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    } catch {
      continue
    }
    let json
    try { json = JSON.parse(raw) } catch { continue }
    if (json && typeof json.common === 'object' && json.common !== null) {
      const out = new Set(['common'])
      collectPaths(json.common, 'common', out)
      return { paths: out, sourceRef: ref }
    }
  }
  return { paths: new Set(), sourceRef: null }
}

// --- per-file AST census ---

const QUICK_FILTER = /\buseTranslation\b|\bt\s*\(|\.t\s*\(/

function listSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.archive' || entry.name.startsWith('.git')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) listSourceFiles(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

function literalText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return null
}

// ns spec of a useTranslation(...) argument list. Array bindings keep EVERY static
// element (i18next searches the array in order); a non-literal first element is dynamic.
function hookNsSpec(args) {
  if (args.length === 0) return { kind: 'default' }
  const first = args[0]
  const lit = literalText(first)
  if (lit !== null) return { kind: 'static', nsList: [lit] }
  if (ts.isArrayLiteralExpression(first)) {
    const nsList = []
    for (const el of first.elements) {
      const elLit = literalText(el)
      if (elLit !== null) nsList.push(elLit)
    }
    if (nsList.length > 0) return { kind: 'static', nsList }
  }
  return { kind: 'dynamic' }
}

function censusFile(file, text, cfg) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)

  const calls = []

  const isFunctionLike = (node) =>
    ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) || ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)

  // One scoped walk: each function-like node pushes a binding layer, so sibling
  // components in a file keep their own useTranslation bindings.
  const walk = (node, scopes) => {
    let active = scopes
    if (isFunctionLike(node)) active = [...scopes, new Map()]

    if (ts.isVariableDeclaration(node) && node.initializer &&
        ts.isCallExpression(node.initializer) &&
        ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === 'useTranslation' &&
        ts.isObjectBindingPattern(node.name)) {
      const spec = hookNsSpec(node.initializer.arguments)
      const layer = active[active.length - 1]
      for (const el of node.name.elements) {
        const propName = el.propertyName ? el.propertyName.text : el.name.text
        if (propName === 't' && ts.isIdentifier(el.name)) layer.set(el.name.text, spec)
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression
      let spec = null
      if (ts.isIdentifier(callee)) {
        for (let i = active.length - 1; i >= 0 && spec === null; i--) {
          if (active[i].has(callee.text)) spec = active[i].get(callee.text)
        }
        if (spec === null && callee.text === 't') {
          // t arrives as a prop/closure value — binding not visible in this file
          spec = { kind: 'dynamic' }
        }
      } else if (ts.isPropertyAccessExpression(callee) && callee.name.text === 't' &&
                 ts.isIdentifier(callee.expression) && callee.expression.text === 'i18n') {
        // i18n.t(...) — the i18next instance resolves through the default namespace
        spec = { kind: 'default' }
      }
      if (spec !== null) record(node, spec, sf, cfg, calls)
    }

    ts.forEachChild(node, (child) => walk(child, active))
  }

  const record = (node, spec, sourceFile, config, out) => {
    const arg0 = node.arguments[0]
    let keyLit = null
    let nonLiteral = false
    if (arg0 === undefined) {
      nonLiteral = true
    } else {
      keyLit = literalText(arg0)
      if (keyLit === null) nonLiteral = true
    }

    let ns = null
    let commonRouted = false
    let dynamicNs = spec.kind === 'dynamic'
    let keyPath = keyLit
    let hadColonPrefix = false
    if (keyLit !== null) {
      const m = /^([A-Za-z0-9_-]+):/.exec(keyLit)
      if (m) {
        ns = m[1]
        keyPath = keyLit.slice(m[0].length)
        hadColonPrefix = true
      }
    }
    if (!hadColonPrefix && keyLit !== null) {
      // options-object ns override
      for (const arg of node.arguments) {
        if (ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'ns') {
              const nsLit = literalText(prop.initializer)
              if (nsLit !== null) ns = nsLit
              else dynamicNs = true
            }
          }
        }
      }
    }
    if (ns === null && !hadColonPrefix) {
      if (spec.kind === 'static') {
        ns = spec.nsList[0]
        // in-order array search: ANY static element that is a common alias routes here
        commonRouted = spec.nsList.some((n) => config.commonNs.has(n))
      } else if (spec.kind === 'default') {
        ns = config.defaultNS
        commonRouted = config.commonNs.has(ns)
      }
    } else if (ns !== null) {
      commonRouted = config.commonNs.has(ns)
    }

    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    out.push({
      line: line + 1,
      key: keyLit,
      keyPath,
      nonLiteral,
      ns,
      dynamicNs,
      hadColonPrefix,
      commonRouted,
    })
  }

  walk(sf, [new Map()])
  return { calls }
}

function runCensus(root, files, universe) {
  const cfg = readI18nConfig(root)
  const report = {
    scannedFiles: 0,
    parsedFiles: 0,
    literalKeyCalls: 0,
    nonLiteralKeyCalls: 0,
    commonNamespaceCalls: 0,
    dynamicNamespaceCalls: 0,
    doublePrefixed: 0,
    unrepointed: [],
    commonNamespaces: [...cfg.commonNs].sort(),
    defaultNS: cfg.defaultNS,
    universeSourceRef: universe.sourceRef,
  }
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    if (!QUICK_FILTER.test(text)) continue
    report.parsedFiles++
    const { calls } = censusFile(file, text, cfg)
    const rel = path.relative(root, file)
    for (const c of calls) {
      if (c.nonLiteral) {
        report.nonLiteralKeyCalls++
        continue
      }
      report.literalKeyCalls++
      if (c.dynamicNs && c.ns === null) report.dynamicNamespaceCalls++
      if (!c.commonRouted) continue
      report.commonNamespaceCalls++
      const pathIsSubtree = c.keyPath === 'common' || c.keyPath.startsWith('common.')
      if (c.hadColonPrefix && pathIsSubtree) report.doublePrefixed++
      if (pathIsSubtree && universe.paths.has(c.keyPath)) {
        report.unrepointed.push({ file: rel, line: c.line, key: c.key, ns: c.ns })
      }
    }
  }
  return report
}

function printBlind(report) {
  console.error(
    `blind populations: nonLiteralKeyCalls=${report.nonLiteralKeyCalls} ` +
    `dynamicNamespaceCalls=${report.dynamicNamespaceCalls}`,
  )
}

// --- entry ---

const args = parseArgs(process.argv)
const root = path.resolve(args.root)

if (args.selfCheck) {
  const universe = preFlattenUniverse(root, 'HEAD')
  if (universe.paths.size === 0) {
    console.error('SELF-CHECK-FAIL: no pre-flatten nested `common` subtree found at or before HEAD')
    process.exit(1)
  }
  const fixture = path.join(root, FIXTURE)
  const report = runCensus(root, [fixture], universe)
  const expectedPositives = [
    { key: 'translation:common.loading' },
    { key: 'common:common.cancel' },
    { key: 'common.saving' },
    { key: 'common.previous' },
    { key: 'common.search' },
    { key: 'common.error' },
    { key: 'common.loading' },
    { key: 'common.all' },
    { key: 'common.close' },
  ]
  const found = new Set(report.unrepointed.map((u) => u.key))
  const missing = expectedPositives.filter((p) => !found.has(p.key))
  const unexpected = report.unrepointed.filter((u) => !expectedPositives.some((p) => p.key === u.key))
  const dblOk = report.doublePrefixed === 2 // common:common.cancel + translation:common.loading
  if (missing.length === 0 && unexpected.length === 0 && dblOk) {
    console.error(
      `SELF-CHECK-OK: 9/9 planted positives flagged (key prefix, ns options, hook bindings, ` +
      `scoped alias, multiline, array binding, array-order fallback, default namespace, ` +
      `double prefix), ` +
      `3/3 negatives rejected (repointed colon form, absent-root key, foreign namespace); ` +
      `doublePrefixed=${report.doublePrefixed}; universe=${universe.paths.size} paths from ${universe.sourceRef}`,
    )
    printBlind(report)
    process.exit(0)
  }
  console.error('SELF-CHECK-FAIL', JSON.stringify({ missing, unexpected, doublePrefixed: report.doublePrefixed }))
  process.exit(1)
}

const universe = preFlattenUniverse(root, args.base)
// Fail closed: a bad --base or thin history must never green on an empty universe.
if (universe.paths.size === 0 || universe.sourceRef === null) {
  console.error(
    `CENSUS-FAIL: pre-flatten universe could not be derived (base=${args.base || 'HEAD'}); ` +
      `refusing to report against an empty key universe`,
  )
  process.exit(1)
}
const files = listSourceFiles(path.join(root, 'frontend', 'src'))
const report = runCensus(root, files, universe)
report.scannedFiles = files.length
report.base = args.base || null

if (args.json) {
  process.stdout.write(JSON.stringify(report) + '\n')
} else {
  console.log(JSON.stringify(report, null, 2))
}
printBlind(report)
process.exit(report.unrepointed.length === 0 && report.doublePrefixed === 0 ? 0 : 1)
