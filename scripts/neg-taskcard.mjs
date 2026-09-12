/**
 * THE NEGATIVE CONTROL FOR `scripts/resolve-check.mjs`. WITHOUT THIS FILE THAT HARNESS IS
 * UNFALSIFIABLE — a harness that reports OK for every input is indistinguishable from one that
 * cannot report anything else. RULING-P98A2-15 condition 3 therefore commits the two together.
 *
 * Third polarity: the SAME harness, pointed at the routing 98-RESEARCH §C1 and 98-05-PLAN both
 * call "the existing, correct enum-keyed t() idiom to mirror". It is BROKEN.
 * `TaskCard.tsx:51-54` uses a bare `useTranslation()`, which binds to `translation` (aliased to
 * `common.json`), and `common.json` has no top-level `priority` / `status` / `work_item`. All
 * three lookups MISS and render the raw DB value from behind their `defaultValue` mask. The
 * family that DOES hold those labels is `assignments:priority`, a different namespace.
 *
 * EXPECTED OUTPUT: MISS=true on all three TaskCard lines, and the contrast line resolving to
 * "Low". If any TaskCard line reports MISS=false, the harness has stopped discriminating and
 * every green `resolve-check.mjs` produced in the same session is void.
 *
 * READ THE OUTPUT — THE EXIT CODE IS NOT THE VERDICT. This script exits 0 whatever it prints,
 * as authored; a caller that gates on `$?` alone gates on nothing. Assert the three MISS=true
 * lines. (Left as authored rather than "improved" here: RULING-P98A2-15 ordered the bytes
 * parameterized and headed, not rewritten, and a silent behaviour change to an instrument of
 * record is how a derivation stops being reproducible.)
 *
 * PROVENANCE
 *   Authored by the Phase 98 `98-05` execution seat; the plan defect it demonstrates is
 *   recorded in `98-05-SUMMARY.md` §5.1 per RULING-P98A2-12 condition 4. Committed to
 *   `scripts/` by RULING-P98A2-15 (98-09).
 *
 * USAGE
 *   node scripts/neg-taskcard.mjs <repo-root>
 *
 *   The repo root is a REQUIRED ARGUMENT — this script is cwd-independent and hardcodes no
 *   absolute path.
 *
 * NEGATIVE SCOPE — what this control CANNOT see, and what covers it
 *   1. IT PROVES ONE DIRECTION ONLY. It shows the harness can report a MISS. That the harness
 *      can also report a legitimate OK is `resolve-check.mjs`'s own positive control
 *      (`sourceType.human_entered`), in that file, in the same run.
 *   2. IT IS A FIXED THREE-KEY PROBE. If `TaskCard.tsx` is ever repaired — routed onto
 *      `assignments`, or the three keys authored into `common.json` — THIS FILE STOPS BEING A
 *      NEGATIVE CONTROL and starts reporting MISS=false for a good reason. That failure mode is
 *      covered by NOTHING automated: whoever repairs TaskCard must re-point this probe at
 *      another known-broken routing, or the falsifiability it supplies is silently lost.
 *   3. IT CHECKS `en` ONLY. The `ar` side of the same class is `resolve-check.mjs`'s
 *      fallback-disabled leg.
 */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const REPO=process.argv[2]
if(!REPO){console.error('usage: node scripts/neg-taskcard.mjs <repo-root>');process.exit(2)}
const SRC=path.join(REPO,'frontend/src')
const i18next=createRequire(path.join(REPO,'frontend/package.json'))('i18next')
const b=(loc)=>{const d=path.join(SRC,'i18n',loc),o={};for(const f of fs.readdirSync(d))if(f.endsWith('.json'))o[f.slice(0,-5)]=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));o.translation=o.common;return o}
const i=i18next.createInstance(); await i.init({resources:{en:b('en'),ar:b('ar')},lng:'en',fallbackLng:false,initImmediate:false})
// TaskCard.tsx uses useTranslation() -> ns 'translation' (= common.json)
for (const k of ['priority.low','status.in_progress','work_item.task']) {
  const out=i.t(k,{ns:'translation'})
  console.log(`  TaskCard t('${k}') ns=translation -> ${JSON.stringify(out)}  MISS=${out===k}`)
}
console.log("  (for contrast, the family that DOES hold these:)")
console.log(`  t('priority.low') ns=assignments -> ${JSON.stringify(i.t('priority.low',{ns:'assignments'}))}`)
