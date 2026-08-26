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
      // The irregular plural needs its own identity: allowlist matching is term-exact.
      { term: 'مناصب', disposition: 'competing-term' },
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

const buildControlResult = () => {
  const dossierRow = rows.find((row) => row.object === 'dossier')
  const stanceRow = rows.find((row) => row.object === 'stance')
  const result = classify({
    candidateRows: [dossierRow, stanceRow],
    files: ['control.json'],
    leaves: [
      { file: 'control.json', namespace: 'control', keyPath: 'good', value: 'دوسيه' },
      { file: 'control.json', namespace: 'control', keyPath: 'brand', value: 'دوسييه' },
      { file: 'control.json', namespace: 'control', keyPath: 'planted', value: 'دوسييه' },
      {
        file: 'control.json',
        namespace: 'control',
        keyPath: 'pluralOffice',
        value: 'مناصب رسمية',
      },
      {
        file: 'control.json',
        namespace: 'control',
        keyPath: 'pluralPlanted',
        value: 'مناصب',
      },
    ],
    sourceLines: {
      'control.json': [
        '"good": "دوسيه"',
        '"brand": "دوسييه"',
        '"planted": "دوسييه"',
        '"pluralOffice": "مناصب رسمية"',
        '"pluralPlanted": "مناصب"',
      ],
    },
    senseEntries: [
      {
        term: 'دوسييه',
        keyPathPattern: '^control:brand$',
        sense: 'brand-mark',
        reason: 'control allowlisted sense',
        source: 'embedded-control',
      },
      {
        term: 'مناصب',
        keyPathPattern: '^control:pluralOffice$',
        sense: 'office-post-or-job-title',
        reason: 'control allowlisted plural office sense',
        source: 'embedded-control',
      },
    ],
  })
  const planted = result.unclassified.find((occurrence) => occurrence.keyPath === 'planted')
  const allowlistedPlural = result.rows
    .find((row) => row.object === 'stance')
    .terms.find((term) => term.term === 'مناصب').classifications['allowlisted-sense']
  const plantedPlural = result.unclassified.filter(
    (occurrence) => occurrence.keyPath === 'pluralPlanted' && occurrence.term === 'مناصب',
  ).length
  const ruledTermPreserved = result.classificationTotals['ruled-term'] === 1
  const allowlistedSensePreserved = result.classificationTotals['allowlisted-sense'] === 2
  const passed = Boolean(
    planted &&
    planted.term === 'دوسييه' &&
    ruledTermPreserved &&
    allowlistedSensePreserved &&
    allowlistedPlural === 1 &&
    plantedPlural === 1 &&
    result.classificationTotals.UNCLASSIFIED === 2,
  )
  return {
    control: passed ? 'PASS' : 'FAIL',
    plantedDousiyehCaught: Boolean(planted),
    ruledTermPreserved,
    allowlistedSensePreserved,
    allowlistedPluralSeen: allowlistedPlural === 1,
    plantedUnclassifiedPluralCaught: plantedPlural === 1,
    allowlistedPluralCount: allowlistedPlural,
    plantedUnclassifiedPluralCount: plantedPlural,
  }
}

const buildLiveResult = (root, row, slice) => {
  const candidateRows = row ? rows.filter((candidate) => candidate.object === row) : rows
  if (candidateRows.length === 0) {
    throw new Error(
      'unknown glossary row ' +
        row +
        '; expected one of ' +
        rows.map((candidate) => candidate.object).join(', '),
    )
  }
  const sliceFiles = sliceFilesFrom(root, slice)
  const arabic = readArabicLeaves(root, sliceFiles)
  return classify({
    candidateRows,
    ...arabic,
    senseEntries: loadSenseEntries(root),
  })
}

const runCli = (argv) => {
  let options
  try {
    options = parseArgs(argv)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
    return
  }

  if (options.control) {
    const control = buildControlResult()
    console.log(JSON.stringify(control, null, 2))
    process.exitCode = control.control === 'PASS' ? 0 : 1
    return
  }

  let result
  try {
    result = buildLiveResult(options.root, options.row, options.slice)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
    return
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    if (options.census) printCensus(result)
    printUnclassified(result)
  }
  // Keep the full population available to downstream pipes; process.exit() can truncate large JSON.
  process.exitCode = result.classificationTotals.UNCLASSIFIED > 0 ? 1 : 0
}

if (process.env.VITEST === 'true') {
  const { execFileSync } = await import('node:child_process')
  const { describe, expect, it } = await import('vitest')
  const taskBase = 'b7cd542e8fafc46708b54d451616f55f28bd1f99'
  const overlayRelativePath = 'scripts/glossary-senses.d/brief-stance.json'
  const overlayPath = join(scriptRepoRoot, overlayRelativePath)
  const readJson = (relativePath) =>
    JSON.parse(readFileSync(join(scriptRepoRoot, relativePath), 'utf8'))
  const git = (arguments_) =>
    execFileSync('git', arguments_, { cwd: scriptRepoRoot, encoding: 'utf8' })
  const gitShow = (relativePath) => git(['show', `${taskBase}:${relativePath}`])
  const leafMap = (value, prefix = '', result = new Map()) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      result.set(prefix, { type: Array.isArray(value) ? 'array' : typeof value, value })
      return result
    }
    for (const [key, child] of Object.entries(value)) {
      leafMap(child, prefix === '' ? key : `${prefix}.${key}`, result)
    }
    return result
  }
  const valueAt = (document, keyPath) =>
    keyPath.split('.').reduce((value, key) => value?.[key], document)
  const liveRows = () => ({
    brief: buildLiveResult(scriptRepoRoot, 'brief-artifact'),
    stance: buildLiveResult(scriptRepoRoot, 'stance'),
  })
  const termFrom = (result, term) =>
    result.rows.flatMap((row) => row.terms).find((candidate) => candidate.term === term)

  describe('P99-26 brief-artifact and stance sense-aware sweep', () => {
    it(`This slice reads one Arabic term for the brief-artifact and stance object, with every exception judged and recorded rather than assumed.`, () => {
      const { brief, stance } = liveRows()
      const overlay = readJson(overlayRelativePath)
      expect(brief.rows[0].ruledTerm).toBe('ملخص / الملخصات')
      expect(stance.rows[0].ruledTerm).toBe('موقف / المواقف')
      expect(brief.classificationTotals.UNCLASSIFIED).toBe(0)
      expect(stance.classificationTotals.UNCLASSIFIED).toBe(0)
      expect(overlay.rows.length).toBeGreaterThan(0)
    })

    it(`Decisions covered — D-04, D-05, D-17, D-18, D-19, D-39: sense-aware sweep over one term family and one ordered file slice, classification recorded as a committed artifact, populations re-derived. || Every repo-wide occurrence scanned by the brief-artifact and stance rows is CLASSIFIED — موجز / إحاطة / منصب / مناصب is either rewritten to the ruled ملخص / موقف family when it carries the artifact/stance sense, or listed in scripts/glossary-senses.d/brief-stance.json with its exact key path and its different sense. The census refuses to go green while any occurrence is UNCLASSIFIED, and that refusal is the whole point: it is what stops a blanket substring rewrite from passing as judgment.`, () => {
      const { brief, stance } = liveRows()
      const overlay = readJson(overlayRelativePath)
      const identities = new Set()
      expect(brief.fileCount).toBe(129)
      expect(stance.fileCount).toBe(129)
      expect(brief.unclassified).toEqual([])
      expect(stance.unclassified).toEqual([])
      for (const row of overlay.rows) {
        const identity = `${row.term}\0${row.file}\0${row.keyPath}`
        expect(identities.has(identity)).toBe(false)
        identities.add(identity)
        expect(['موجز', 'إحاطة', 'منصب', 'مناصب']).toContain(row.term)
        const value = valueAt(readJson(`frontend/src/i18n/ar/${row.file}`), row.keyPath)
        expect(typeof value).toBe('string')
        expect(value).toContain(row.term)
        expect(row.sense.length).toBeGreaterThan(0)
        expect(row.reason.length).toBeGreaterThan(0)
      }
    })

    it(`إحاطة must SURVIVE at its session-sense paths (the over-sweep guard: sweeping it is the destructive move), and both منصب and مناصب must survive only at office-sense paths || The sweep touches ar VALUES only: no ar leaf KEY is renamed, no en value changes, no application source file changes, and bundle parity is structurally unchanged — scripts/glossary-census.mjs is the only authorized source instrument change, and a structural diff in any ar file is a defect`, () => {
      const { brief, stance } = liveRows()
      const ihata = termFrom(brief, 'إحاطة')
      const singularOffice = termFrom(stance, 'منصب')
      const pluralOffice = termFrom(stance, 'مناصب')
      expect(ihata.occurrences).toBeGreaterThan(0)
      expect(ihata.classifications['allowlisted-sense']).toBe(ihata.occurrences)
      expect(singularOffice.classifications['allowlisted-sense']).toBe(singularOffice.occurrences)
      expect(pluralOffice.classifications['allowlisted-sense']).toBe(pluralOffice.occurrences)

      const changedPaths = git(['diff', '--name-only', taskBase, '--'])
        .trim()
        .split('\n')
        .filter(Boolean)
      expect(changedPaths.some((path) => path.startsWith('frontend/src/i18n/en/'))).toBe(false)
      expect(
        changedPaths.every(
          (path) =>
            path.startsWith('frontend/src/i18n/ar/') ||
            path === 'scripts/glossary-census.mjs' ||
            path === overlayRelativePath ||
            path === '.planning/phases/99-arabic-coverage/99-26-SUMMARY.md',
        ),
      ).toBe(true)

      const arabicDirectory = join(scriptRepoRoot, 'frontend/src/i18n/ar')
      for (const file of readdirSync(arabicDirectory).filter((entry) => entry.endsWith('.json'))) {
        const relativePath = `frontend/src/i18n/ar/${file}`
        const before = leafMap(JSON.parse(gitShow(relativePath)))
        const after = leafMap(readJson(relativePath))
        expect([...after.keys()]).toEqual([...before.keys()])
        expect([...after].map(([key, leaf]) => [key, leaf.type])).toEqual(
          [...before].map(([key, leaf]) => [key, leaf.type]),
        )
      }
    })

    it(`This lane's overlay file only ADDS rows to the base allowlist; removing or weakening a base row (the already-ruled sense exceptions) is a red, because that is how a sweep launders an unclassified occurrence into an allowed one || The stance row enumerates منصب and مناصب as DISTINCT competing terms so term-identity allowlist matching can consume the nine plural rows; --control proves both an allowlisted plural and a planted unclassified plural are seen || The re-derived before and after counts for this lane's term row are recorded with their commands (D-04), and what falls outside this lane's slice is named (D-05)`, () => {
      const overlay = readJson(overlayRelativePath)
      const currentBase = readFileSync(join(scriptRepoRoot, 'scripts/glossary-senses.json'), 'utf8')
      const stanceRow = rows.find((row) => row.object === 'stance')
      expect(currentBase).toBe(gitShow('scripts/glossary-senses.json'))
      expect(
        stanceRow.terms
          .filter((term) => term.disposition === 'competing-term')
          .map((term) => term.term),
      ).toEqual(['منصب', 'مناصب'])
      expect(overlay.rows.filter((row) => row.term === 'مناصب')).toHaveLength(9)
      expect(buildControlResult()).toEqual({
        control: 'PASS',
        plantedDousiyehCaught: true,
        ruledTermPreserved: true,
        allowlistedSensePreserved: true,
        allowlistedPluralSeen: true,
        plantedUnclassifiedPluralCaught: true,
        allowlistedPluralCount: 1,
        plantedUnclassifiedPluralCount: 1,
      })
      const summary = readFileSync(
        join(scriptRepoRoot, '.planning/phases/99-arabic-coverage/99-26-SUMMARY.md'),
        'utf8',
      )
      expect(summary).toContain('## D-04: re-derived populations')
      expect(summary).toContain('## D-05: population boundary')
      expect(summary).toContain('--row brief-artifact')
      expect(summary).toContain('--row stance')
    })

    it(`the drilled census catches both its original planted control and the plural-stance positive controls first, then reads ZERO unclassified occurrences for the brief-artifact row AND the stance row REPO-WIDE — the write scope includes every known artifact/stance rewrite while the overlay records genuine different senses — RED at HEAD (the census does not exist until 99-02, then red on the unfixed population)`, () => {
      const control = buildControlResult()
      const { brief, stance } = liveRows()
      expect(control.control).toBe('PASS')
      expect(control.plantedDousiyehCaught).toBe(true)
      expect(control.allowlistedPluralSeen).toBe(true)
      expect(control.plantedUnclassifiedPluralCaught).toBe(true)
      expect(brief.classificationTotals.UNCLASSIFIED).toBe(0)
      expect(stance.classificationTotals.UNCLASSIFIED).toBe(0)
    })

    it(`bundle parity is structurally unchanged repo-wide with the walked-leaf count as its positive control, AND this lane committed a non-empty classification overlay — a sweep that judged nothing recorded nothing, and that is a red — RED at HEAD (the overlay file does not exist)`, () => {
      const localesDirectory = join(scriptRepoRoot, 'frontend/src/i18n')
      const overlay = JSON.parse(readFileSync(overlayPath, 'utf8'))
      let checked = 0
      let missing = 0
      for (const file of readdirSync(join(localesDirectory, 'en')).filter((entry) =>
        entry.endsWith('.json'),
      )) {
        const englishPaths = leafMap(readJson(`frontend/src/i18n/en/${file}`))
        const arabicPaths = leafMap(readJson(`frontend/src/i18n/ar/${file}`))
        for (const key of englishPaths.keys()) {
          checked++
          if (!arabicPaths.has(key)) missing++
        }
      }
      expect(checked).toBeGreaterThan(0)
      expect(missing).toBe(0)
      expect(overlay.slice).toHaveLength(43)
      expect(overlay.rows.length).toBeGreaterThan(0)
    })
  })
} else {
  runCli(process.argv.slice(2))
}
