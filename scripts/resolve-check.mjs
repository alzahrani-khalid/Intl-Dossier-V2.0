/**
 * RESOLUTION check (not a JSON walk) for every NEW routing 98-05 created.
 *
 * Boots a REAL i18next instance with the REAL bundles, mirroring frontend/src/i18n/index.ts
 * exactly: resources keyed by locale, `translation` aliased to common (which is what makes
 * bare useTranslation() resolve against common.json), fallbackLng 'en', and NO keySeparator /
 * nsSeparator / defaultNS overrides -- so i18next's defaults ('.', ':', 'translation') apply,
 * which is precisely the configuration the app ships.
 *
 * Then asks the SAME question the component asks, through the namespace the component is
 * actually BOUND to, in BOTH locales, for EVERY member of each derived enum domain.
 *
 * ===========================================================================================
 * THE ONE PROPERTY THAT MAKES EVERY ZERO IN THIS FILE MEAN ANYTHING:
 *
 *   THE `ar` LEG RUNS WITH `fallbackLng` DISABLED (`fallbackLng: false`).
 *
 * The app ships `fallbackLng: 'en'`. Under that setting a MISSING ARABIC KEY SILENTLY RETURNS
 * THE ENGLISH STRING, so i18next answers with copy and the check reads as a PASS. Every `ar`
 * green produced with fallback ON is therefore worthless as evidence that Arabic exists. Turn
 * fallback back on and this harness stops being able to fail on the `ar` side at all.
 * ===========================================================================================
 *
 * PROVENANCE
 *   Authored by the Phase 98 `98-05` execution seat. Made binding on every new routing by
 *   RULING-P98A2-12 condition 3 -- "resolution, not existence": the plan's cited exemplar
 *   (`TaskCard.tsx`) EXISTS in JSON and does not RESOLVE through the namespace the component
 *   binds to, which is exactly why existence-in-JSON is not a check. Committed to `scripts/`
 *   by RULING-P98A2-15 (98-09).
 *
 * USAGE
 *   node scripts/resolve-check.mjs <repo-root>
 *
 *   The repo root is a REQUIRED ARGUMENT -- this script is cwd-independent and hardcodes no
 *   absolute path. Exit 0 iff every routing resolves in BOTH locales AND both controls
 *   discriminate. At `8697f65de` it reports 214 lookups / 0 routings with a miss.
 *
 *   ITS NEGATIVE CONTROL IS A SEPARATE FILE AND IS NOT OPTIONAL:
 *       node scripts/neg-taskcard.mjs <repo-root>
 *   That file points this same harness at the KNOWN-BROKEN routing. Without it, a harness that
 *   reports OK for everything is indistinguishable from one that works. Run both.
 *
 * NEGATIVE SCOPE -- what this instrument CANNOT see, and what covers it
 *   1. ROUTINGS NOT IN THE `ROUTINGS` TABLE BELOW. The table is a hand-written enumeration of
 *      what 98-05 changed; it is not a repo sweep. Finding NEW members is
 *      `scripts/partA_maskfinder.py`'s job. A green here says nothing about any site the table
 *      does not list.
 *   2. WHETHER THE COMPONENT ACTUALLY CALLS THE KEY THIS TABLE ASSIGNS IT. The namespace and
 *      key-shape columns are read off the source by a human. Covered by nothing automated.
 *   3. RENDERING. Resolution is not a render: a resolved key in an unmounted component reaches
 *      no user. Covered by the `98-copy0N` rendered oracles, and only on the surfaces they drive.
 *   4. ARABIC QUALITY. It proves an `ar` value EXISTS and is not the key. Whether it reads
 *      naturally is `AR-01..04` / Phase 99 and the operator's park -- nothing here judges it.
 *   5. INTERPOLATION AND PLURALS. `t()` is called with no variables, so a value whose
 *      `{{count}}` or plural form is broken still reports OK.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const REPO = process.argv[2]
if (!REPO) {
  console.error('usage: node scripts/resolve-check.mjs <repo-root>')
  process.exit(2)
}
const SRC = path.join(REPO, 'frontend/src')
const require_ = createRequire(path.join(REPO, 'frontend/package.json'))
const i18next = require_('i18next')

function bundles(loc) {
  const dir = path.join(SRC, 'i18n', loc)
  const out = {}
  for (const fn of fs.readdirSync(dir)) {
    if (fn.endsWith('.json')) out[fn.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, fn), 'utf8'))
  }
  out.translation = out.common // the alias index.ts:274/410 installs
  return out
}

const resources = { en: bundles('en'), ar: bundles('ar') }

// Derive each domain from the source of truth, never from the bundle we are testing.
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8')
const between = (s, a, b) => s.split(a)[1].split(b)[0]
const quoted = (s) => [...new Set(s.match(/'([a-z_]+)'/g)?.map((x) => x.slice(1, -1)) ?? [])]

const signalSourceType = quoted(between(read('domains/signals/types/signal.types.ts'), 'SignalSourceType =', '\n'))
const relationshipType = quoted(between(read('types/relationship.types.ts'), 'DossierRelationshipType =', '/**'))
const dossierTypes = quoted(between(read('lib/dossier-type-guards.ts'), 'DOSSIER_TYPES = [', ']'))
const engagementType = ['bilateral_meeting', 'mission', 'delegation', 'summit', 'working_group',
  'roundtable', 'official_visit', 'consultation', 'forum_session', 'other'] // engagement_dossiers CHECK
const assignmentPriority = ['low', 'medium', 'high', 'urgent'] // Assignment type + observed staging
const activitySourceStatus = ['pending', 'in_progress', 'review', 'completed', 'cancelled', 'overdue',
  'draft', 'submitted', 'triaged', 'assigned', 'converted', 'closed', 'merged', 'under_review',
  'approved', 'published', 'planned', 'ongoing', 'postponed', 'active', 'historical', 'terminated']
const linkedEntityStatus = ['active', 'inactive', 'archived', 'deleted', 'draft', 'under_review',
  'approved', 'published', 'submitted', 'triaged', 'assigned', 'in_progress', 'converted', 'closed', 'merged']
const rowType = ['meeting', 'call', 'travel', 'event']
const rowStatus = ['scheduled', 'in_progress', 'completed', 'cancelled']

// component -> the namespace its `t` is BOUND to -> the key it builds
const ROUTINGS = [
  ['SignalRow.tsx:84',                  'intelligence-signals', (v) => `sourceType.${v}`,                 signalSourceType],
  ['KanbanTaskCard.tsx:71',             'assignments',          (v) => `priority.${v}`,                   assignmentPriority],
  ['ActivityTimelineSection.tsx:221',   'dossier-overview',     (v) => `sourceStatus.${v}`,               activitySourceStatus],
  ['AssignmentDetailsModal.tsx:276',    'translation',          (v) => `waitingQueue.entityStatus.${v}`,  linkedEntityStatus],
  ['TaskDetail.tsx:261',                'translation',          (v) => `engagements:types.${v}`,          engagementType],
  ['MiniRelationshipGraph.tsx:266,374', 'graph',                (v) => `relationship.${v}`,               relationshipType],
  ['EnhancedGraphVisualization:623,808','graph',                (v) => `relationship.${v}`,               relationshipType],
  ['AlertRuleForm.tsx:237',             'intelligence-alerts',  (v) => `dossier:type.${v}`,               dossierTypes],
  ['EngagementsList.tsx:171 (type)',    'engagements',          (v) => `filter.${v}`,                     rowType],
  ['EngagementsList.tsx:174 (status)',  'engagements',          (v) => `statuses.${v}`,                   rowStatus],
  ['EngagementsList.tsx:145 (prefix)',  'engagements',          () => 'week.of',                          ['-']],
]

async function instance(lng, allowFallback) {
  const i = i18next.createInstance()
  await i.init({ resources, lng, fallbackLng: allowFallback ? 'en' : false, supportedLngs: ['en', 'ar'], initImmediate: false })
  return i
}

let failures = 0
let checked = 0
for (const lng of ['en', 'ar']) {
  // ar with fallbackLng OFF: otherwise an Arabic miss silently returns the English string
  const i = await instance(lng, false)
  console.log(`\n===== locale ${lng} (fallbackLng disabled, so an ${lng} miss cannot borrow en) =====`)
  for (const [where, ns, key, domain] of ROUTINGS) {
    const bad = []
    for (const v of domain) {
      const k = key(v)
      const out = i.t(k, { ns })
      checked++
      // i18next returns the key itself when it cannot resolve
      if (out === k || out === k.split(':').pop() || out === '' || out === undefined) bad.push(v)
    }
    if (bad.length) { failures++; console.log(`  MISS  ${where.padEnd(36)} ns=${ns.padEnd(21)} unresolved: ${bad.join(', ')}`) }
    else console.log(`  OK    ${where.padEnd(36)} ns=${ns.padEnd(21)} ${domain.length}/${domain.length} resolve`)
  }
}

// Both polarities: the same harness must REPORT A MISS on a key that genuinely is not there.
const ctl = await instance('en', false)
const negKey = 'sourceType.__not_a_real_member__'
const negOut = ctl.t(negKey, { ns: 'intelligence-signals' })
console.log(`\nCONTROL negative: t('${negKey}') -> ${JSON.stringify(negOut)} ; detected-as-miss=${negOut === negKey}`)
const posOut = ctl.t('sourceType.human_entered', { ns: 'intelligence-signals' })
console.log(`CONTROL positive: t('sourceType.human_entered') -> ${JSON.stringify(posOut)} ; detected-as-miss=${posOut === 'sourceType.human_entered'}`)

console.log(`\n${checked} lookups across ${ROUTINGS.length} routings x 2 locales — routings with a miss: ${failures}`)
process.exit(failures === 0 && negOut === negKey && posOut !== 'sourceType.human_entered' ? 0 : 1)
