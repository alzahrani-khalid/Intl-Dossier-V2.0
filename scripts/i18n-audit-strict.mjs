#!/usr/bin/env node
/**
 * Strict static audit for masked and raw-key i18n misses.
 *
 * This models the shipped app: named bindings consult only their declared
 * namespaces, bare bindings use `translation`, and the registered
 * `translation` resource aliases `common`. There is no fallbackNS or
 * configured defaultNS. Namespace parsing lives only in lib/i18n-binding.mjs.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defectiveBindingFrom, resolveI18nBinding } from './lib/i18n-binding.mjs'

const scriptRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['en', 'ar']

const TWO_ARG = /\bt\(\s*'([^']+)'\s*,\s*'([^']*)'/g
const ONE_ARG = /\bt\(\s*'([^']+)'\s*\)/g
const OPTS_ARG = /\bt\(\s*'([^']+)'\s*,\s*\{/g
const HAS_DEFAULT_VALUE = /\bdefaultValue\s*:/

const parseArgs = (argv) => {
  let root = scriptRepoRoot
  let rootSeen = false
  let scope = []
  let json = false
  let selfCheck = false
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--json') json = true
    else if (argument === '--self-check') selfCheck = true
    else if (argument === '--scope') {
      const value = argv[++index]
      if (!value || value.startsWith('--'))
        throw new Error('--scope requires comma-separated path prefixes')
      scope = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    } else if (argument.startsWith('--')) {
      throw new Error(`unknown option: ${argument}`)
    } else if (rootSeen) {
      throw new Error(`unexpected positional argument: ${argument}`)
    } else {
      root = resolve(argument)
      rootSeen = true
    }
  }
  return { root, scope, json, selfCheck }
}

const normalizePath = (value) => value.split(sep).join('/').replace(/^\.\//, '').replace(/\/$/, '')

const walk = (directory, { excludeI18n = true } = {}, output = []) => {
  for (const entry of readdirSync(directory).sort()) {
    const path = join(directory, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && (!excludeI18n || entry !== 'i18n')) {
        walk(path, { excludeI18n }, output)
      }
    } else if (/\.tsx?$/.test(entry)) {
      output.push(path)
    }
  }
  return output
}

const inScope = (file, root, sourceRoot, prefixes) => {
  if (prefixes.length === 0) return true
  const repoPath = normalizePath(relative(root, file))
  const sourcePath = normalizePath(relative(sourceRoot, file))
  return prefixes.some((rawPrefix) => {
    const prefix = normalizePath(
      isAbsolute(rawPrefix) ? relative(root, resolve(rawPrefix)) : rawPrefix,
    )
    return [repoPath, sourcePath].some(
      (candidate) => candidate === prefix || candidate.startsWith(`${prefix}/`),
    )
  })
}

const loadBundles = (root) =>
  Object.fromEntries(
    LOCALES.map((locale) => {
      const localeDirectory = join(root, 'frontend/src/i18n', locale)
      const bundles = Object.fromEntries(
        readdirSync(localeDirectory)
          .filter((entry) => entry.endsWith('.json'))
          .sort()
          .map((entry) => [
            entry.replace(/\.json$/, ''),
            JSON.parse(readFileSync(join(localeDirectory, entry), 'utf8')),
          ]),
      )
      return [locale, bundles]
    }),
  )

const hasPath = (bundles, locale, namespace, path) => {
  let current = bundles[locale]?.[namespace]
  if (!current) return false
  for (const segment of path.split('.')) {
    if (current == null || typeof current !== 'object' || !(segment in current)) return false
    current = current[segment]
  }
  return typeof current === 'string' || typeof current === 'object'
}

const splitKey = (key) => {
  const colon = key.indexOf(':')
  return colon === -1 ? [undefined, key] : [key.slice(0, colon), key.slice(colon + 1)]
}

const strictCandidates = (key, namespaces) => {
  const [explicitNamespace] = splitKey(key)
  const candidates = explicitNamespace ? [explicitNamespace] : namespaces
  return [
    ...new Set(candidates.map((namespace) => (namespace === 'translation' ? 'common' : namespace))),
  ]
}

const looseCandidates = (key, namespaces) => {
  const [explicitNamespace] = splitKey(key)
  return explicitNamespace ? [explicitNamespace] : [...new Set([...namespaces, 'common'])]
}

const braceBody = (source, open) => {
  let depth = 0
  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth++
    else if (source[index] === '}' && --depth === 0) return source.slice(open, index + 1)
  }
  return ''
}

const isNonKey = (key) => /^\d{4}-\d{2}-\d{2}T/.test(key) || /^https?:/.test(key)
const lineAt = (source, offset) => source.slice(0, offset).split('\n').length
const resolutionFor = (bundles, candidates, path) =>
  Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      candidates.some((namespace) => hasPath(bundles, locale, namespace, path)),
    ]),
  )
const resolutionChanged = (left, right) => LOCALES.some((locale) => left[locale] !== right[locale])

const auditSources = (sources, bundles) => {
  const assessed = []
  const nonKeys = []
  let twoArgTotal = 0
  let literalTwoArgTotal = 0
  let optionsDefaultTotal = 0
  let rawKeyTotal = 0

  for (const { file, source } of sources) {
    const binding = resolveI18nBinding(source)
    const defective = defectiveBindingFrom(binding)

    const record = (key, shape, offset) => {
      const [, path] = splitKey(key)
      const candidates = strictCandidates(key, binding.namespaces)
      const loose = looseCandidates(key, binding.namespaces)
      const defectiveCandidates = strictCandidates(key, defective.namespaces)
      const resolved = resolutionFor(bundles, candidates, path)
      const looseResolved = resolutionFor(bundles, loose, path)
      const defectiveResolved = resolutionFor(bundles, defectiveCandidates, path)
      assessed.push({
        class: shape === 'two-arg' || shape === 'options-default' ? 'two-arg-mask' : 'raw-key',
        shape,
        file,
        line: lineAt(source, offset),
        key,
        namespaces: candidates,
        resolved,
        looseResolved,
        defectiveResolved,
      })
    }

    for (const match of source.matchAll(TWO_ARG)) {
      twoArgTotal++
      literalTwoArgTotal++
      if (isNonKey(match[1])) {
        nonKeys.push({
          class: 'two-arg-mask',
          file,
          line: lineAt(source, match.index),
          key: match[1],
        })
      } else {
        record(match[1], 'two-arg', match.index)
      }
    }

    const rawSites = [...source.matchAll(ONE_ARG)].map((match) => ({
      key: match[1],
      shape: 'one-arg',
      offset: match.index,
    }))
    for (const match of source.matchAll(OPTS_ARG)) {
      const open = source.indexOf('{', match.index)
      if (HAS_DEFAULT_VALUE.test(braceBody(source, open))) {
        twoArgTotal++
        optionsDefaultTotal++
        if (isNonKey(match[1])) {
          nonKeys.push({
            class: 'two-arg-mask',
            file,
            line: lineAt(source, match.index),
            key: match[1],
          })
        } else {
          record(match[1], 'options-default', match.index)
        }
        continue
      }
      rawSites.push({ key: match[1], shape: 'options-no-default', offset: match.index })
    }
    for (const site of rawSites) {
      rawKeyTotal++
      if (isNonKey(site.key)) {
        nonKeys.push({ class: 'raw-key', file, line: lineAt(source, site.offset), key: site.key })
      } else {
        record(site.key, site.shape, site.offset)
      }
    }
  }

  const unresolved = assessed.filter((site) => LOCALES.some((locale) => !site.resolved[locale]))
  const twoArgSites = unresolved.filter((site) => site.class === 'two-arg-mask')
  const rawKeySites = unresolved.filter((site) => site.class === 'raw-key')
  const assessedTwoArg = assessed.filter((site) => site.class === 'two-arg-mask')
  const assessedRawKey = assessed.filter((site) => site.class === 'raw-key')
  const literalTwoArgSites = twoArgSites.filter((site) => site.shape === 'two-arg')
  const optionsDefaultSites = twoArgSites.filter((site) => site.shape === 'options-default')
  const unresolvedIn = (sites, locale) => sites.filter((site) => !site.resolved[locale]).length
  const hiddenByLoose = (sites) =>
    sites.filter((site) =>
      LOCALES.some((locale) => !site.resolved[locale] && site.looseResolved[locale]),
    ).length
  const rescuedByAlias = (sites) =>
    sites.filter((site) =>
      LOCALES.some((locale) => site.resolved[locale] && !site.looseResolved[locale]),
    ).length
  const changedByCanonicalBinding = (sites) =>
    sites.filter((site) => resolutionChanged(site.resolved, site.defectiveResolved)).length

  return {
    twoArgTotal,
    literalTwoArgTotal,
    optionsDefaultTotal,
    rawKeyTotal,
    nonKeyTotal: nonKeys.length,
    twoArgUnresolved: twoArgSites.length,
    literalTwoArgUnresolved: literalTwoArgSites.length,
    optionsDefaultUnresolved: optionsDefaultSites.length,
    rawKeyUnresolved: rawKeySites.length,
    twoArgUnresolvedEn: unresolvedIn(twoArgSites, 'en'),
    rawKeyUnresolvedEn: unresolvedIn(rawKeySites, 'en'),
    twoArgUnresolvedAr: unresolvedIn(twoArgSites, 'ar'),
    rawKeyUnresolvedAr: unresolvedIn(rawKeySites, 'ar'),
    twoArgDistinct: new Set(twoArgSites.map((site) => site.key)).size,
    rawKeyDistinct: new Set(rawKeySites.map((site) => site.key)).size,
    looseModelDelta: {
      twoArgHiddenSites: hiddenByLoose(twoArgSites),
      literalTwoArgHiddenSites: hiddenByLoose(literalTwoArgSites),
      rawKeyHiddenSites: hiddenByLoose(rawKeySites),
      twoArgRescuedByAlias: rescuedByAlias(assessedTwoArg),
      rawKeyRescuedByAlias: rescuedByAlias(assessedRawKey),
    },
    defectiveBindingDelta: {
      twoArgSitesReclassified: changedByCanonicalBinding(assessedTwoArg),
      rawKeySitesReclassified: changedByCanonicalBinding(assessedRawKey),
    },
    sites: unresolved,
    nonKeys,
    assessed,
  }
}

const bindingPopulation = (files) => {
  const rows = files.map((file) => ({ file, source: readFileSync(file, 'utf8') }))
  const mentionsCall = (source) => /\buseTranslation\s*\(/.test(source)
  const mentionsArray = (source) => /\buseTranslation\s*\(\s*\[/.test(source)
  const mentionsBare = (source) => /\buseTranslation\s*\(\s*\)/.test(source)
  const callRows = rows.filter((row) => mentionsCall(row.source))
  const arrayRows = callRows.filter((row) => mentionsArray(row.source))
  const bareRows = callRows.filter((row) => mentionsBare(row.source))
  const canonical = rows.map((row) => resolveI18nBinding(row.source))
  return {
    measuredSyntaxFiles: callRows.length,
    arrayFirstOnlyFiles: arrayRows.length,
    bareUnmatchedFiles: bareRows.length,
    defectiveShapeFiles: new Set([...arrayRows, ...bareRows].map((row) => row.file)).size,
    canonicalParsedFiles: canonical.filter((binding) => binding.calls.length > 0).length,
    canonicalStringFiles: canonical.filter((binding) => binding.shapes.string > 0).length,
    canonicalArrayFiles: canonical.filter((binding) => binding.shapes.array > 0).length,
    canonicalBareFiles: canonical.filter((binding) => binding.shapes.bare > 0).length,
  }
}

const runSelfCheck = () => {
  const fixtureSources = [
    {
      file: 'self-check/string-binding.tsx',
      source: `
const { t } = useTranslation('feature')
t('k', 'Default')
t('k',
  'Default')
t('rawLoose')
t('enOnly', 'Default')
t('arOnly', 'Default')
t('featureOnly', 'Default')
t('translation:alias.ok', 'Default')
t('optionsMask', { defaultValue: 'Default' })
`,
    },
    {
      file: 'self-check/array-binding.tsx',
      source: `
const { t } = useTranslation(['array-a', 'array-b'])
t('arraySecond', 'Default')
`,
    },
    {
      file: 'self-check/bare-binding.tsx',
      source: `
const { t } = useTranslation()
const { t: tFeature } = useTranslation('feature')
t('bareOnly', 'Default')
`,
    },
  ]
  const fixtureBundles = {
    en: {
      common: { k: 'K', rawLoose: 'Raw', bareOnly: 'Bare', alias: { ok: 'Alias' } },
      feature: { enOnly: 'English only', featureOnly: 'Feature' },
      'array-a': {},
      'array-b': { arraySecond: 'Second' },
    },
    ar: {
      common: { k: 'ك', rawLoose: 'خام', bareOnly: 'مجرّد', alias: { ok: 'اسم بديل' } },
      feature: { arOnly: 'العربية فقط', featureOnly: 'ميزة' },
      'array-a': {},
      'array-b': { arraySecond: 'الثاني' },
    },
  }
  const audit = auditSources(fixtureSources, fixtureBundles)
  const bindings = Object.fromEntries(
    fixtureSources.map((fixture) => [fixture.file, resolveI18nBinding(fixture.source)]),
  )
  const kSites = audit.assessed.filter((site) => site.key === 'k')
  const arraySite = audit.assessed.find((site) => site.key === 'arraySecond')
  const bareSite = audit.assessed.find((site) => site.key === 'bareOnly')
  const featureSite = audit.assessed.find((site) => site.key === 'featureOnly')
  const aliasSite = audit.assessed.find((site) => site.key === 'translation:alias.ok')
  const enOnly = audit.assessed.find((site) => site.key === 'enOnly')
  const arOnly = audit.assessed.find((site) => site.key === 'arOnly')
  const checks = {
    oneLinePositiveControl: kSites.some((site) => site.line === 3),
    wrappedPositiveControl: kSites.some((site) => site.line === 4),
    stringBindingShape:
      bindings['self-check/string-binding.tsx'].calls[0]?.shape === 'string' &&
      bindings['self-check/string-binding.tsx'].namespaces.includes('feature') &&
      LOCALES.every((locale) => featureSite.resolved[locale]),
    arrayBindingConsultsEveryNamespace:
      bindings['self-check/array-binding.tsx'].calls[0]?.shape === 'array' &&
      bindings['self-check/array-binding.tsx'].namespaces.join(',') === 'array-a,array-b' &&
      LOCALES.every((locale) => arraySite.resolved[locale] && !arraySite.defectiveResolved[locale]),
    bareBindingUsesTranslation:
      bindings['self-check/bare-binding.tsx'].calls.some((call) => call.shape === 'bare') &&
      bindings['self-check/bare-binding.tsx'].namespaces.includes('translation') &&
      LOCALES.every((locale) => bareSite.resolved[locale] && !bareSite.defectiveResolved[locale]),
    strictFlagsLooseTwoArg:
      kSites.length === 2 &&
      kSites.every((site) =>
        LOCALES.every((locale) => !site.resolved[locale] && site.looseResolved[locale]),
      ),
    strictFlagsLooseRawKey: audit.assessed.some(
      (site) =>
        site.key === 'rawLoose' &&
        LOCALES.every((locale) => !site.resolved[locale] && site.looseResolved[locale]),
    ),
    translationCommonAlias: LOCALES.every((locale) => aliasSite.resolved[locale]),
    englishLocaleChecked: enOnly.resolved.en && !enOnly.resolved.ar,
    arabicLocaleChecked: !arOnly.resolved.en && arOnly.resolved.ar,
    everyMaskSiteCounted:
      audit.twoArgTotal === 9 && audit.literalTwoArgTotal === 8 && audit.optionsDefaultTotal === 1,
    optionsDefaultMaskCounted: audit.assessed.some(
      (site) => site.key === 'optionsMask' && site.class === 'two-arg-mask',
    ),
    defectiveModelVisiblyReclassified:
      audit.defectiveBindingDelta.twoArgSitesReclassified === 2 &&
      audit.defectiveBindingDelta.rawKeySitesReclassified === 0,
  }
  const passed = Object.values(checks).every(Boolean)
  return {
    selfCheck: passed ? 'PASS' : 'FAIL',
    passed,
    fixture: {
      twoArgTotal: audit.twoArgTotal,
      rawKeyTotal: audit.rawKeyTotal,
      bindingShapes: Object.fromEntries(
        Object.entries(bindings).map(([file, binding]) => [file, binding.shapes]),
      ),
      defectiveBindingDelta: audit.defectiveBindingDelta,
    },
    checks,
  }
}

const printHuman = (result) => {
  console.log(
    `strict i18n audit: ${result.scannedFiles} file(s); ${result.twoArgUnresolved}/${result.twoArgTotal} two-arg masks unresolved`,
  )
  console.log(
    `mask shapes literal/options-default: ${result.literalTwoArgUnresolved}/${result.literalTwoArgTotal} ` +
      `and ${result.optionsDefaultUnresolved}/${result.optionsDefaultTotal}`,
  )
  console.log(`${result.rawKeyUnresolved}/${result.rawKeyTotal} raw-key sites unresolved`)
  console.log(`EN/AR two-arg: ${result.twoArgUnresolvedEn}/${result.twoArgUnresolvedAr}`)
  console.log(`EN/AR raw-key: ${result.rawKeyUnresolvedEn}/${result.rawKeyUnresolvedAr}`)
  console.log(
    `binding defect population: ${result.bindingModel.defectiveShapeFiles} files ` +
      `(${result.bindingModel.arrayFirstOnlyFiles} array + ${result.bindingModel.bareUnmatchedFiles} bare)`,
  )
  console.log(
    `canonical binding reclassified sites: ${result.defectiveBindingDelta.twoArgSitesReclassified} two-arg / ` +
      `${result.defectiveBindingDelta.rawKeySitesReclassified} raw-key`,
  )
  console.log(
    `loose-hidden two-arg/raw-key: ${result.looseModelDelta.twoArgHiddenSites}/${result.looseModelDelta.rawKeyHiddenSites}`,
  )
  for (const site of result.sites) {
    console.log(
      `${site.class}\t${site.file}:${site.line}\t${site.key}\t` +
        `EN=${site.resolved.en ? 'ok' : 'MISS'} AR=${site.resolved.ar ? 'ok' : 'MISS'}`,
    )
  }
}

let options
try {
  options = parseArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(2)
}

if (options.selfCheck) {
  const result = runSelfCheck()
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.passed ? 0 : 1)
}

const sourceRoot = join(options.root, 'frontend/src')
const auditFiles = walk(sourceRoot).filter((file) =>
  inScope(file, options.root, sourceRoot, options.scope),
)
if (options.scope.length > 0 && auditFiles.length === 0) {
  console.error(
    JSON.stringify(
      { error: 'scope matched zero source files', scope: options.scope, scannedFiles: 0 },
      null,
      2,
    ),
  )
  process.exit(1)
}

const sources = auditFiles.map((file) => ({
  file: normalizePath(relative(options.root, file)),
  source: readFileSync(file, 'utf8'),
}))
const allDiagnosticFiles = walk(sourceRoot, { excludeI18n: false }).filter((file) =>
  inScope(file, options.root, sourceRoot, options.scope),
)
const audit = auditSources(sources, loadBundles(options.root))
delete audit.assessed
const result = {
  root: options.root,
  scannedRoot: normalizePath(sourceRoot),
  scannedFiles: auditFiles.length,
  scope: options.scope,
  locales: LOCALES,
  candidateModel: {
    resolver: 'scripts/lib/i18n-binding.mjs',
    unprefixed: 'declared namespaces only; built-in translation for a bare or undeclared binding',
    aliases: { translation: 'common' },
    fallbackNS: null,
    defaultNS: null,
  },
  bindingModel: bindingPopulation(allDiagnosticFiles),
  ...audit,
}

if (options.json) console.log(JSON.stringify(result, null, 2))
else printHuman(result)
