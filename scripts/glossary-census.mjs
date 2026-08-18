#!/usr/bin/env node
// Sense-aware census for every glossary family ruled by Phase 99 D-17/D-18.
// This instrument classifies translation values only. It never rewrites a bundle.

import { readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const parseArgs = (argv) => {
  let root = scriptRepoRoot
  let rootSeen = false
  let control = false
  let census = false
  let json = false
  let row
  let slice
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--control') control = true
    else if (argument === '--census') census = true
    else if (argument === '--json') json = true
    else if (argument === '--row' || argument === '--slice') {
      const value = argv[++index]
      if (!value || value.startsWith('--')) throw new Error(argument + ' requires a value')
      if (argument === '--row') row = value
      else slice = value
    } else if (argument.startsWith('--')) {
      throw new Error('unknown option: ' + argument)
    } else if (rootSeen) {
      throw new Error('unexpected positional argument: ' + argument)
    } else {
      root = resolve(argument)
      rootSeen = true
    }
  }
  return { root, control, census, json, row, slice }
}

// Each rule is deliberately data. A pattern is used only where an inflected ruled family or an
// exact Arabic word boundary is required; term remains the auditable glossary spelling.
const rows = [
  {
    object: 'dossier',
    ruledTerm: 'دوسيه',
    terms: [
      { term: 'دوسيه', disposition: 'ruled-term' },
      { term: 'دوسييه', disposition: 'competing-term' },
      { term: 'ملف', disposition: 'competing-term' },
    ],
  },
  {
    object: 'engagement',
    ruledTerm: 'مشاركة / المشاركات',
    terms: [
      {
        term: 'مشاركة',
        pattern: 'مشارك(?:ة|ات)',
        disposition: 'ruled-term',
      },
      { term: 'ارتباط', disposition: 'competing-term' },
    ],
  },
  {
    object: 'brief-artifact',
    ruledTerm: 'ملخص / الملخصات',
    terms: [
      { term: 'ملخص', disposition: 'ruled-term' },
      { term: 'موجز', disposition: 'competing-term' },
      { term: 'إحاطة', disposition: 'competing-term' },
    ],
  },
  {
    object: 'briefing-session',
    ruledTerm: 'إحاطة',
    terms: [{ term: 'إحاطة', disposition: 'ruled-term' }],
  },
  {
    object: 'stance',
    ruledTerm: 'موقف / المواقف',
    terms: [
      { term: 'موقف', pattern: 'موقف|مواقف', disposition: 'ruled-term' },
      { term: 'منصب', disposition: 'competing-term' },
    ],
  },
  {
    object: 'country',
    ruledTerm: 'الدول',
    terms: [
      {
        term: 'الدول',
        pattern: '(?<![\\p{L}\\p{M}])الدول(?![\\p{L}\\p{M}])',
        disposition: 'ruled-term',
      },
      {
        term: 'البلدان',
        pattern: '(?<![\\p{L}\\p{M}])البلدان(?![\\p{L}\\p{M}])',
        disposition: 'competing-term',
      },
    ],
  },
  {
    object: 'intake-vs-waiting-queue',
    ruledTerm: 'قائمة الاستقبال / قائمة الانتظار',
    terms: [
      { term: 'قائمة الاستقبال', disposition: 'ruled-term' },
      // This is the ruled name of the distinct waiting queue, not a globally banned phrase.
      { term: 'قائمة الانتظار', disposition: 'ruled-term' },
    ],
  },
]

const REGEX_META = new Set('\\^$.*+?()[]{}|'.split(''))
const escapeRegex = (value) =>
  [...value].map((character) => (REGEX_META.has(character) ? '\\' + character : character)).join('')

const normalizeSenseEntry = (entry, source) => {
  for (const field of ['term', 'sense', 'reason']) {
    if (typeof entry?.[field] !== 'string' || entry[field].length === 0) {
      throw new Error(source + ': every glossary sense entry requires a non-empty ' + field)
    }
  }

  let keyPathPattern = entry.keyPathPattern
  if (keyPathPattern === undefined) {
    if (
      typeof entry.file !== 'string' ||
      entry.file.length === 0 ||
      typeof entry.keyPath !== 'string' ||
      entry.keyPath.length === 0
    ) {
      throw new Error(
        source + ': every exact overlay row requires file and keyPath (or keyPathPattern)',
      )
    }
    const namespace = basename(entry.file).replace(/\.json$/, '')
    if (namespace === basename(entry.file)) {
      throw new Error(source + ': overlay row file must name an ar JSON bundle: ' + entry.file)
    }
    const fullPath = entry.keyPath.includes(':') ? entry.keyPath : namespace + ':' + entry.keyPath
    keyPathPattern = '^' + escapeRegex(fullPath) + '$'
  }
  if (typeof keyPathPattern !== 'string' || keyPathPattern.length === 0) {
    throw new Error(source + ': every glossary sense entry requires a key path')
  }
  try {
    new RegExp(keyPathPattern, 'u')
  } catch (error) {
    throw new Error(source + ': invalid keyPathPattern ' + keyPathPattern + ': ' + error.message)
  }
  return { ...entry, keyPathPattern, source }
}

const senseDocumentAt = (path, source) => {
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : [
        ...(Array.isArray(parsed.entries) ? parsed.entries : []),
        ...(Array.isArray(parsed.rows) ? parsed.rows : []),
      ]
  if (!Array.isArray(parsed) && !Array.isArray(parsed.entries) && !Array.isArray(parsed.rows)) {
    throw new Error(source + ': expected an entries or rows array')
  }
  return {
    entries: rawEntries.map((entry) => normalizeSenseEntry(entry, source)),
    slice: Array.isArray(parsed.slice) ? parsed.slice : undefined,
  }
}

const loadSenseEntries = (root) => {
  const scriptsDirectory = join(root, 'scripts')
  const basePath = join(scriptsDirectory, 'glossary-senses.json')
  const base = senseDocumentAt(basePath, 'glossary-senses.json').entries
  const identities = new Set(base.map((entry) => entry.term + '\0' + entry.keyPathPattern))
  const overlayDirectory = join(scriptsDirectory, 'glossary-senses.d')
  const overlays = []
  for (const file of readdirSync(overlayDirectory)
    .filter((entry) => entry.endsWith('.json'))
    .sort()) {
    const source = 'glossary-senses.d/' + file
    for (const entry of senseDocumentAt(join(overlayDirectory, file), source).entries) {
      const identity = entry.term + '\0' + entry.keyPathPattern
      if (identities.has(identity)) {
        throw new Error(
          source +
            ': overlays may only add; duplicate/override rejected for ' +
            entry.term +
            ' ' +
            entry.keyPathPattern,
        )
      }
      identities.add(identity)
      overlays.push(entry)
    }
  }
  return [...base, ...overlays]
}

const sliceFilesFrom = (root, sliceArgument) => {
  if (!sliceArgument) return undefined
  const overlayPath = isAbsolute(sliceArgument) ? sliceArgument : join(root, sliceArgument)
  const source = isAbsolute(sliceArgument) ? sliceArgument : sliceArgument
  const document = senseDocumentAt(overlayPath, source)
  if (!Array.isArray(document.slice) || document.slice.length === 0) {
    throw new Error(source + ': --slice requires a non-empty slice array')
  }
  const available = new Set(
    readdirSync(join(root, 'frontend/src/i18n/ar')).filter((file) => file.endsWith('.json')),
  )
  const files = document.slice.map((entry) => {
    if (typeof entry !== 'string' || entry.length === 0) {
      throw new Error(source + ': every slice member must be a non-empty ar JSON path')
    }
    const file = basename(entry)
    if (!file.endsWith('.json') || !available.has(file)) {
      throw new Error(source + ': unknown ar slice file ' + entry)
    }
    return file
  })
  if (new Set(files).size !== files.length) {
    throw new Error(source + ': slice contains duplicate ar files')
  }
  return new Set(files)
}

const walkLeaves = (value, path = [], output = []) => {
  if (typeof value === 'string') {
    output.push({ keyPath: path.join('.'), value })
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      walkLeaves(child, [...path, key], output)
    }
  }
  return output
}

const matcherFor = (termRule) => new RegExp(termRule.pattern ?? escapeRegex(termRule.term), 'gu')

const countOccurrences = (value, termRule) => value.match(matcherFor(termRule))?.length ?? 0

const readArabicLeaves = (root, sliceFiles) => {
  const directory = join(root, 'frontend/src/i18n/ar')
  const leaves = []
  const sourceLines = {}
  const files = readdirSync(directory)
    .filter((entry) => entry.endsWith('.json') && (!sliceFiles || sliceFiles.has(entry)))
    .sort()
  for (const file of files) {
    const namespace = file.replace(/\.json$/, '')
    const raw = readFileSync(join(directory, file), 'utf8')
    sourceLines[file] = raw.split('\n')
    for (const leaf of walkLeaves(JSON.parse(raw))) {
      leaves.push({ file, namespace, ...leaf })
    }
  }
  return { files, leaves, sourceLines }
}

const classify = ({ candidateRows, files, leaves, sourceLines, senseEntries }) => {
  const allowlist = senseEntries.map((entry) => ({
    ...entry,
    matcher: new RegExp(entry.keyPathPattern, 'u'),
  }))
  const occurrences = []
  const censusRows = candidateRows.map((row) => {
    const terms = row.terms.map((termRule) => {
      const termOccurrences = []
      for (const leaf of leaves) {
        const count = countOccurrences(leaf.value, termRule)
        if (count === 0) continue
        const fullPath = leaf.namespace + ':' + leaf.keyPath
        for (let occurrenceIndex = 1; occurrenceIndex <= count; occurrenceIndex++) {
          const sense =
            termRule.disposition === 'competing-term'
              ? allowlist.find(
                  (entry) => entry.term === termRule.term && entry.matcher.test(fullPath),
                )
              : undefined
          const classification =
            termRule.disposition === 'ruled-term'
              ? 'ruled-term'
              : sense
                ? 'allowlisted-sense'
                : 'UNCLASSIFIED'
          const occurrence = {
            object: row.object,
            term: termRule.term,
            disposition: termRule.disposition,
            classification,
            file: leaf.file,
            namespace: leaf.namespace,
            keyPath: leaf.keyPath,
            value: leaf.value,
            occurrenceIndex,
            ...(sense
              ? {
                  sense: sense.sense,
                  reason: sense.reason,
                  allowlistSource: sense.source,
                }
              : {}),
          }
          occurrences.push(occurrence)
          termOccurrences.push(occurrence)
        }
      }
      const matchingValues = new Set(
        termOccurrences.map((occurrence) => occurrence.file + ':' + occurrence.keyPath),
      )
      const matchingFiles = new Set(termOccurrences.map((occurrence) => occurrence.file))
      const matchingLines = Object.values(sourceLines).reduce(
        (sum, lines) => sum + lines.filter((line) => countOccurrences(line, termRule) > 0).length,
        0,
      )
      return {
        term: termRule.term,
        disposition: termRule.disposition,
        occurrences: termOccurrences.length,
        lines: matchingLines,
        values: matchingValues.size,
        files: matchingFiles.size,
        classifications: {
          'ruled-term': termOccurrences.filter((item) => item.classification === 'ruled-term')
            .length,
          'allowlisted-sense': termOccurrences.filter(
            (item) => item.classification === 'allowlisted-sense',
          ).length,
          UNCLASSIFIED: termOccurrences.filter((item) => item.classification === 'UNCLASSIFIED')
            .length,
        },
      }
    })
    return {
      object: row.object,
      ruledTerm: row.ruledTerm,
      before: terms
        .filter((term) => term.disposition === 'competing-term')
        .reduce((total, term) => total + term.occurrences, 0),
      after: terms
        .filter((term) => term.disposition === 'ruled-term')
        .reduce((total, term) => total + term.occurrences, 0),
      unclassified: terms.reduce((total, term) => total + term.classifications.UNCLASSIFIED, 0),
      terms,
    }
  })
  const unclassified = occurrences.filter(
    (occurrence) => occurrence.classification === 'UNCLASSIFIED',
  )
  return {
    filesScanned: files,
    fileCount: files.length,
    leafValuesScanned: leaves.length,
    rows: censusRows,
    classificationTotals: {
      'ruled-term': occurrences.filter((item) => item.classification === 'ruled-term').length,
      'allowlisted-sense': occurrences.filter((item) => item.classification === 'allowlisted-sense')
        .length,
      UNCLASSIFIED: unclassified.length,
    },
    unclassified,
  }
}

const printCensus = (result) => {
  console.log(
    'glossary census: ' +
      result.leafValuesScanned +
      ' Arabic leaf values across ' +
      result.fileCount +
      ' file(s)',
  )
  for (const row of result.rows) {
    console.log(
      row.object +
        '\truled=' +
        row.ruledTerm +
        '\tbefore=' +
        row.before +
        '\tafter=' +
        row.after +
        '\tunclassified=' +
        row.unclassified,
    )
    for (const term of row.terms) {
      console.log(
        '  ' +
          term.term +
          '\t' +
          term.disposition +
          '\toccurrences=' +
          term.occurrences +
          '\tlines=' +
          term.lines +
          '\tvalues=' +
          term.values +
          '\tfiles=' +
          term.files +
          '\truled=' +
          term.classifications['ruled-term'] +
          '\tallowlisted=' +
          term.classifications['allowlisted-sense'] +
          '\tunclassified=' +
          term.classifications.UNCLASSIFIED,
      )
    }
  }
  console.log(
    'classification totals: ruled=' +
      result.classificationTotals['ruled-term'] +
      ' allowlisted=' +
      result.classificationTotals['allowlisted-sense'] +
      ' UNCLASSIFIED=' +
      result.classificationTotals.UNCLASSIFIED,
  )
}

const printUnclassified = (result) => {
  console.log('UNCLASSIFIED glossary occurrences: ' + result.classificationTotals.UNCLASSIFIED)
  for (const occurrence of result.unclassified) {
    console.log(
      'UNCLASSIFIED\tfrontend/src/i18n/ar/' +
        occurrence.file +
        ':' +
        occurrence.keyPath +
        ':' +
        occurrence.value +
        '\tterm=' +
        occurrence.term,
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

if (options.control) {
  const dossierRow = rows.find((row) => row.object === 'dossier')
  const result = classify({
    candidateRows: [dossierRow],
    files: ['control.json'],
    leaves: [
      { file: 'control.json', namespace: 'control', keyPath: 'good', value: 'دوسيه' },
      { file: 'control.json', namespace: 'control', keyPath: 'brand', value: 'دوسييه' },
      { file: 'control.json', namespace: 'control', keyPath: 'planted', value: 'دوسييه' },
    ],
    sourceLines: {
      'control.json': ['"good": "دوسيه"', '"brand": "دوسييه"', '"planted": "دوسييه"'],
    },
    senseEntries: [
      {
        term: 'دوسييه',
        keyPathPattern: '^control:brand$',
        sense: 'brand-mark',
        reason: 'control allowlisted sense',
        source: 'embedded-control',
      },
    ],
  })
  const planted = result.unclassified.find((occurrence) => occurrence.keyPath === 'planted')
  const ruledTermPreserved = result.classificationTotals['ruled-term'] === 1
  const allowlistedSensePreserved = result.classificationTotals['allowlisted-sense'] === 1
  const passed = Boolean(
    planted &&
    planted.term === 'دوسييه' &&
    ruledTermPreserved &&
    allowlistedSensePreserved &&
    result.classificationTotals.UNCLASSIFIED === 1,
  )
  console.log(
    JSON.stringify(
      {
        control: passed ? 'PASS' : 'FAIL',
        plantedDousiyehCaught: Boolean(planted),
        ruledTermPreserved,
        allowlistedSensePreserved,
      },
      null,
      2,
    ),
  )
  process.exit(passed ? 0 : 1)
}

let result
try {
  const candidateRows = options.row ? rows.filter((row) => row.object === options.row) : rows
  if (candidateRows.length === 0) {
    throw new Error(
      'unknown glossary row ' +
        options.row +
        '; expected one of ' +
        rows.map((row) => row.object).join(', '),
    )
  }
  const sliceFiles = sliceFilesFrom(options.root, options.slice)
  const arabic = readArabicLeaves(options.root, sliceFiles)
  result = classify({
    candidateRows,
    ...arabic,
    senseEntries: loadSenseEntries(options.root),
  })
} catch (error) {
  console.error(error.message)
  process.exit(2)
}

if (options.json) {
  console.log(JSON.stringify(result, null, 2))
} else {
  if (options.census) printCensus(result)
  printUnclassified(result)
}
// Keep the full population available to downstream pipes; process.exit() can truncate large JSON.
process.exitCode = result.classificationTotals.UNCLASSIFIED > 0 ? 1 : 0
