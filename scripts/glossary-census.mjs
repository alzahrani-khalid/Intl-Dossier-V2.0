#!/usr/bin/env node
// Sense-aware census for the glossary families ruled by Phase 99 D-17/D-18.
// This instrument reports only; it never rewrites translation bundles.

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const parseArgs = (argv) => {
  let root = scriptRepoRoot
  let rootSeen = false
  let control = false
  let census = false
  let json = false
  for (const argument of argv) {
    if (argument === '--control') control = true
    else if (argument === '--census') census = true
    else if (argument === '--json') json = true
    else if (argument.startsWith('--')) throw new Error(`unknown option: ${argument}`)
    else if (rootSeen) throw new Error(`unexpected positional argument: ${argument}`)
    else {
      root = resolve(argument)
      rootSeen = true
    }
  }
  return { root, control, census, json }
}

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
      // D-18 explicitly accepts the participant/sharing ambiguity in the مشارك stem.
      { term: 'مشارك', disposition: 'ruled-term' },
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
    object: 'position-as-stance',
    ruledTerm: 'موقف / المواقف',
    terms: [
      { term: 'موقف', disposition: 'ruled-term' },
      { term: 'مواقف', disposition: 'ruled-term' },
      { term: 'منصب', disposition: 'competing-term' },
    ],
  },
]

const validateEntry = (entry, source) => {
  for (const field of ['term', 'keyPathPattern', 'sense', 'reason']) {
    if (typeof entry?.[field] !== 'string' || entry[field].length === 0) {
      throw new Error(`${source}: every glossary sense entry requires a non-empty ${field}`)
    }
  }
  try {
    new RegExp(entry.keyPathPattern, 'u')
  } catch (error) {
    throw new Error(`${source}: invalid keyPathPattern ${entry.keyPathPattern}: ${error.message}`)
  }
}

const entriesFrom = (path) => {
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  const entries = Array.isArray(parsed) ? parsed : parsed.entries
  if (!Array.isArray(entries)) throw new Error(`${path}: expected an entries array`)
  entries.forEach((entry) => validateEntry(entry, path))
  return entries
}

const loadSenseEntries = (root) => {
  const scriptsDirectory = join(root, 'scripts')
  const basePath = join(scriptsDirectory, 'glossary-senses.json')
  const base = entriesFrom(basePath).map((entry) => ({ ...entry, source: 'glossary-senses.json' }))
  const identities = new Set(base.map((entry) => `${entry.term}\0${entry.keyPathPattern}`))
  const overlayDirectory = join(scriptsDirectory, 'glossary-senses.d')
  const overlays = []
  for (const file of readdirSync(overlayDirectory)
    .filter((entry) => entry.endsWith('.json'))
    .sort()) {
    for (const entry of entriesFrom(join(overlayDirectory, file))) {
      const identity = `${entry.term}\0${entry.keyPathPattern}`
      if (identities.has(identity)) {
        throw new Error(
          `glossary-senses.d/${file}: overlays may only add; duplicate/override rejected for ` +
            `${entry.term} ${entry.keyPathPattern}`,
        )
      }
      identities.add(identity)
      overlays.push({ ...entry, source: `glossary-senses.d/${file}` })
    }
  }
  return [...base, ...overlays]
}

const walkLeaves = (value, path = [], output = []) => {
  if (typeof value === 'string') {
    output.push({ keyPath: path.join('.'), value })
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) walkLeaves(child, [...path, key], output)
  }
  return output
}

const countOccurrences = (value, term) => {
  let count = 0
  let offset = 0
  while ((offset = value.indexOf(term, offset)) !== -1) {
    count++
    offset += term.length
  }
  return count
}

const readArabicLeaves = (root) => {
  const directory = join(root, 'frontend/src/i18n/ar')
  const leaves = []
  const sourceLines = {}
  for (const file of readdirSync(directory)
    .filter((entry) => entry.endsWith('.json'))
    .sort()) {
    const namespace = file.replace(/\.json$/, '')
    const raw = readFileSync(join(directory, file), 'utf8')
    sourceLines[namespace] = raw.split('\n')
    for (const leaf of walkLeaves(JSON.parse(raw))) leaves.push({ namespace, ...leaf })
  }
  return { leaves, sourceLines }
}

const classify = ({ candidateRows, leaves, sourceLines, senseEntries }) => {
  const occurrences = []
  const censusRows = candidateRows.map((row) => {
    const terms = row.terms.map((termRule) => {
      const termOccurrences = []
      for (const leaf of leaves) {
        const count = countOccurrences(leaf.value, termRule.term)
        if (count === 0) continue
        const fullPath = `${leaf.namespace}:${leaf.keyPath}`
        for (let occurrenceIndex = 1; occurrenceIndex <= count; occurrenceIndex++) {
          const allowlist =
            termRule.disposition === 'competing-term'
              ? senseEntries.find(
                  (entry) =>
                    entry.term === termRule.term &&
                    new RegExp(entry.keyPathPattern, 'u').test(fullPath),
                )
              : undefined
          const classification =
            termRule.disposition === 'ruled-term'
              ? 'ruled-term'
              : allowlist
                ? 'allowlisted-sense'
                : 'UNCLASSIFIED'
          const occurrence = {
            object: row.object,
            term: termRule.term,
            disposition: termRule.disposition,
            classification,
            namespace: leaf.namespace,
            keyPath: leaf.keyPath,
            value: leaf.value,
            occurrenceIndex,
            ...(allowlist
              ? {
                  sense: allowlist.sense,
                  reason: allowlist.reason,
                  allowlistSource: allowlist.source,
                }
              : {}),
          }
          occurrences.push(occurrence)
          termOccurrences.push(occurrence)
        }
      }
      const matchingValues = new Set(
        termOccurrences.map((occurrence) => `${occurrence.namespace}:${occurrence.keyPath}`),
      )
      const matchingFiles = new Set(termOccurrences.map((occurrence) => occurrence.namespace))
      const matchingLines = Object.values(sourceLines).reduce(
        (sum, lines) => sum + lines.filter((line) => line.includes(termRule.term)).length,
        0,
      )
      return {
        ...termRule,
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
    return { object: row.object, ruledTerm: row.ruledTerm, terms }
  })
  const unclassified = occurrences.filter(
    (occurrence) => occurrence.classification === 'UNCLASSIFIED',
  )
  return {
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
  console.log(`glossary census: ${result.leafValuesScanned} Arabic leaf values scanned`)
  for (const row of result.rows) {
    console.log(`${row.object}\truled=${row.ruledTerm}`)
    for (const term of row.terms) {
      console.log(
        `  ${term.term}\t${term.disposition}\toccurrences=${term.occurrences}\t` +
          `lines=${term.lines}\tvalues=${term.values}\tfiles=${term.files}\t` +
          `ruled=${term.classifications['ruled-term']}\t` +
          `allowlisted=${term.classifications['allowlisted-sense']}\t` +
          `unclassified=${term.classifications.UNCLASSIFIED}`,
      )
    }
  }
  console.log(
    `classification totals: ruled=${result.classificationTotals['ruled-term']} ` +
      `allowlisted=${result.classificationTotals['allowlisted-sense']} ` +
      `UNCLASSIFIED=${result.classificationTotals.UNCLASSIFIED}`,
  )
}

let options
try {
  options = parseArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(2)
}

if (options.control) {
  const result = classify({
    candidateRows: [
      {
        object: 'control-engagement',
        ruledTerm: 'مشاركة',
        terms: [
          { term: 'مشاركة', disposition: 'ruled-term' },
          { term: 'ارتباط', disposition: 'competing-term' },
        ],
      },
    ],
    leaves: [
      { namespace: 'control', keyPath: 'good', value: 'مشاركة' },
      { namespace: 'control', keyPath: 'planted', value: 'ارتباط' },
    ],
    sourceLines: { control: ['"good": "مشاركة"', '"planted": "ارتباط"'] },
    senseEntries: [],
  })
  const planted = result.unclassified.find((occurrence) => occurrence.keyPath === 'planted')
  const ruledTermPreserved = result.classificationTotals['ruled-term'] === 1
  const passed = Boolean(
    planted && ruledTermPreserved && result.classificationTotals.UNCLASSIFIED === 1,
  )
  console.log(
    JSON.stringify(
      {
        control: passed ? 'PASS' : 'FAIL',
        plantedBannedOccurrenceCaught: Boolean(planted),
        ruledTermPreserved,
      },
      null,
      2,
    ),
  )
  process.exit(passed ? 0 : 1)
}

const { leaves, sourceLines } = readArabicLeaves(options.root)
const result = classify({
  candidateRows: rows,
  leaves,
  sourceLines,
  senseEntries: loadSenseEntries(options.root),
})
if (options.json) {
  console.log(JSON.stringify(result, null, 2))
} else {
  if (options.census) printCensus(result)
  console.log(`UNCLASSIFIED glossary occurrences: ${result.classificationTotals.UNCLASSIFIED}`)
  for (const occurrence of result.unclassified) {
    console.log(
      `UNCLASSIFIED\t${occurrence.namespace}:${occurrence.keyPath}\t` +
        `term=${occurrence.term}\t${occurrence.value}`,
    )
  }
}
process.exit(result.classificationTotals.UNCLASSIFIED > 0 ? 1 : 0)
