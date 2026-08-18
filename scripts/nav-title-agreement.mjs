#!/usr/bin/env node
// Static Arabic navigation-label/page-title agreement checker for the 13 derived Phase 99 rows.
// Agreement is sense-aware: both anchors must contain the ruled object term. It is not byte
// equality (for example, "Positions" and "Positions Library" agree on the Positions object).

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const parseArgs = (argv) => {
  let root = scriptRepoRoot
  let rootSeen = false
  let control = false
  let json = false
  for (const argument of argv) {
    if (argument === '--control') control = true
    else if (argument === '--json') json = true
    else if (argument.startsWith('--')) throw new Error(`unknown option: ${argument}`)
    else if (rootSeen) throw new Error(`unexpected positional argument: ${argument}`)
    else {
      root = resolve(argument)
      rootSeen = true
    }
  }
  return { root, control, json }
}

// Exactly the 13 rows derived in 99-RESEARCH §4.2. termPattern admits ordinary inflection while
// ruledTerm records the product wording that both anchors must carry.
const rows = [
  {
    labelKey: 'navigation.countries',
    titleNamespace: 'countries',
    titleKey: 'title',
    ruledTerm: 'دولة / الدول',
    termPattern: 'دول',
  },
  {
    labelKey: 'navigation.engagements',
    titleNamespace: 'engagements',
    titleKey: 'title',
    ruledTerm: 'مشاركة / المشاركات',
    termPattern: 'مشارك',
  },
  {
    labelKey: 'navigation.persons',
    titleNamespace: 'persons',
    titleKey: 'title',
    ruledTerm: 'الأشخاص',
    termPattern: 'أشخاص',
  },
  {
    labelKey: 'navigation.positions',
    titleNamespace: 'positions',
    titleKey: 'library.title',
    ruledTerm: 'موقف / المواقف',
    termPattern: 'موا?قف',
  },
  {
    labelKey: 'navigation.mous',
    titleNamespace: 'common',
    titleKey: 'mous.title',
    ruledTerm: 'مذكرات التفاهم',
    termPattern: 'مذكرات التفاهم',
  },
  {
    labelKey: 'navigation.intake',
    titleNamespace: 'intake',
    titleKey: 'queue.title',
    ruledTerm: 'قائمة الاستقبال',
    termPattern: 'استقبال',
  },
  {
    labelKey: 'navigation.dashboardOverview',
    titleNamespace: 'dashboard',
    titleKey: 'title',
    ruledTerm: 'دوسيه / الدوسيهات',
    termPattern: 'دوسيه',
  },
  {
    labelKey: 'navigation.organizations',
    titleNamespace: 'organizations',
    titleKey: 'title',
    ruledTerm: 'المنظمات',
    termPattern: 'منظمات',
  },
  {
    labelKey: 'navigation.forums',
    titleNamespace: 'forums',
    titleKey: 'pageTitle',
    ruledTerm: 'منتدى / المنتديات',
    termPattern: 'منتد',
  },
  {
    labelKey: 'navigation.workingGroups',
    titleNamespace: 'working-groups',
    titleKey: 'title',
    ruledTerm: 'مجموعات العمل',
    termPattern: 'مجموعات العمل',
  },
  {
    labelKey: 'navigation.tasks',
    titleNamespace: 'tasks-page',
    titleKey: 'title',
    ruledTerm: 'مكتبي',
    termPattern: 'مكتبي',
  },
  {
    labelKey: 'navigation.calendar',
    titleNamespace: 'calendar',
    titleKey: 'page.title',
    ruledTerm: 'التقويم',
    termPattern: 'تقويم',
  },
  {
    labelKey: 'navigation.briefs',
    titleNamespace: 'briefs-page',
    titleKey: 'title',
    ruledTerm: 'ملخص / الملخصات',
    termPattern: 'ملخص',
  },
]

const readBundles = (root) => {
  const directory = join(root, 'frontend/src/i18n/ar')
  const namespaces = [...new Set(['common', ...rows.map((row) => row.titleNamespace)])]
  return Object.fromEntries(
    namespaces.map((namespace) => [
      namespace,
      JSON.parse(readFileSync(join(directory, `${namespace}.json`), 'utf8')),
    ]),
  )
}

const valueAt = (bundle, keyPath) => {
  let current = bundle
  for (const segment of keyPath.split('.')) {
    if (current == null || typeof current !== 'object' || !(segment in current)) return undefined
    current = current[segment]
  }
  return typeof current === 'string' ? current : undefined
}

const inspectRows = (candidateRows, bundles) =>
  candidateRows.map((row) => {
    const label = valueAt(bundles.common, row.labelKey)
    const title = valueAt(bundles[row.titleNamespace], row.titleKey)
    const term = new RegExp(row.termPattern, 'u')
    const missing = [
      ...(!label ? [`common:${row.labelKey}`] : []),
      ...(!title ? [`${row.titleNamespace}:${row.titleKey}`] : []),
    ]
    const labelCarriesTerm = Boolean(label && term.test(label))
    const titleCarriesTerm = Boolean(title && term.test(title))
    return {
      ...row,
      label,
      title,
      labelCarriesTerm,
      titleCarriesTerm,
      missing,
      agrees: missing.length === 0 && labelCarriesTerm && titleCarriesTerm,
    }
  })

const summarize = (results) => ({
  population: results.length,
  agreements: results.filter((result) => result.agrees).length,
  mismatches: results.filter((result) => !result.agrees && result.missing.length === 0).length,
  missingKeys: results.reduce((total, result) => total + result.missing.length, 0),
  results,
})

let options
try {
  options = parseArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(2)
}

if (options.control) {
  const controlRows = [
    {
      labelKey: 'navigation.good',
      titleNamespace: 'control',
      titleKey: 'good',
      ruledTerm: 'دوسيه',
      termPattern: 'دوسيه',
    },
    {
      labelKey: 'navigation.plantedMismatch',
      titleNamespace: 'control',
      titleKey: 'plantedMismatch',
      ruledTerm: 'دوسيه',
      termPattern: 'دوسيه',
    },
  ]
  const result = summarize(
    inspectRows(controlRows, {
      common: { navigation: { good: 'الدوسيهات', plantedMismatch: 'الدوسيهات' } },
      control: { good: 'مكتبة الدوسيهات', plantedMismatch: 'مكتبة الملفات' },
    }),
  )
  const planted = result.results.find((row) => row.labelKey === 'navigation.plantedMismatch')
  const good = result.results.find((row) => row.labelKey === 'navigation.good')
  const passed = result.mismatches === 1 && !planted.agrees && good.agrees
  console.log(
    JSON.stringify(
      {
        control: passed ? 'PASS' : 'FAIL',
        plantedMismatchCaught: !planted.agrees,
        positiveAgreementPreserved: good.agrees,
      },
      null,
      2,
    ),
  )
  process.exit(passed ? 0 : 1)
}

const result = summarize(inspectRows(rows, readBundles(options.root)))
if (options.json) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(
    `nav/title agreement: ${result.agreements}/${result.population} agree; ` +
      `${result.mismatches} mismatch; ${result.missingKeys} missing key`,
  )
  for (const row of result.results.filter((candidate) => !candidate.agrees)) {
    const reason =
      row.missing.length > 0 ? `MISSING ${row.missing.join(', ')}` : 'OBJECT-TERM MISMATCH'
    console.log(
      `${reason}\tcommon:${row.labelKey}=${JSON.stringify(row.label)}\t` +
        `${row.titleNamespace}:${row.titleKey}=${JSON.stringify(row.title)}\truled=${row.ruledTerm}`,
    )
  }
}
process.exit(result.mismatches === 0 && result.missingKeys === 0 ? 0 : 1)
