# P99-30 Summary — AR-04a gatekeeper strict proof

## Outcome

**GREEN.** At HEAD `51587acdaabc1ed75b8a76f56770cef197d9d2a8`, the verification-only
gatekeeper proved the production tree strictly resolving before any deletion lane became
reachable. The canonical unscoped audit walked 1,532 production TypeScript files and a nonzero
`twoArgTotal` of 2,073. It reported `twoArgUnresolved=0` and `rawKeyUnresolved=0`, with the English
and Arabic counters independently zero for both classes. The audit emitted no residue sites.

The independent controls also discriminate: `partA_maskfinder.py --control` ran before its live
zero; `resolve-check.mjs` reported zero routing misses after exercising both locales and both
control polarities; and `neg-taskcard.mjs` printed exactly three `MISS=true` lines. No default,
translation call, source file, locale JSON, test, backend, Supabase file, or script was changed.

The struck plan-time figure of 473 is not reused. Under the canonical binding resolver, the live
destructive-satisfiability population — two-argument sites whose key fails in either locale — was
re-derived as **zero**. This is an affirmative finding for the overseer: no default in the
2,073-site deletion manifest is currently the only text preventing a raw-key render in either
language.

## 1. Ordered gate evidence

### 1.1 Unscoped canonical strict audit

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --json
```

Verbatim output:

```json
{
  "root": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260826-202610-0000000000000045--P99-30",
  "scannedRoot": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260826-202610-0000000000000045--P99-30/frontend/src",
  "scannedFiles": 1532,
  "scope": [],
  "locales": [
    "en",
    "ar"
  ],
  "candidateModel": {
    "resolver": "scripts/lib/i18n-binding.mjs",
    "unprefixed": "declared namespaces only; built-in translation for a bare or undeclared binding",
    "aliases": {
      "translation": "common"
    },
    "fallbackNS": null,
    "defaultNS": null
  },
  "bindingModel": {
    "measuredSyntaxFiles": 665,
    "arrayFirstOnlyFiles": 47,
    "bareUnmatchedFiles": 110,
    "defectiveShapeFiles": 157,
    "canonicalParsedFiles": 664,
    "canonicalStringFiles": 515,
    "canonicalArrayFiles": 46,
    "canonicalBareFiles": 110
  },
  "twoArgTotal": 2073,
  "literalTwoArgTotal": 1760,
  "optionsDefaultTotal": 313,
  "rawKeyTotal": 6490,
  "nonKeyTotal": 0,
  "twoArgUnresolved": 0,
  "literalTwoArgUnresolved": 0,
  "optionsDefaultUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "twoArgDistinct": 0,
  "rawKeyDistinct": 0,
  "looseModelDelta": {
    "twoArgHiddenSites": 0,
    "literalTwoArgHiddenSites": 0,
    "rawKeyHiddenSites": 0,
    "twoArgRescuedByAlias": 2,
    "rawKeyRescuedByAlias": 0
  },
  "defectiveBindingDelta": {
    "twoArgSitesReclassified": 1,
    "rawKeySitesReclassified": 35
  },
  "sites": [],
  "nonKeys": []
}
EXIT_CODE=0
```

This is an unscoped run (`"scope": []`). The nonzero `twoArgTotal=2073` proves the mask walk was
not vacuous. The four locale/class obligations are independently visible as
`twoArgUnresolvedEn=0`, `twoArgUnresolvedAr=0`, `rawKeyUnresolvedEn=0`, and
`rawKeyUnresolvedAr=0`.

### 1.2 Dynamic-prefix control, then live run

The required control ran first.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R" --control
```

Verbatim output:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
EXIT_CODE=0
```

Only after the control passed, the live command ran.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R"
```

Verbatim output:

```text
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
EXIT_CODE=0
```

### 1.3 Resolution harness

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/resolve-check.mjs" "$R"
```

Verbatim output:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙

===== locale en (fallbackLng disabled, so an en miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

===== locale ar (fallbackLng disabled, so an ar miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

CONTROL negative: t('sourceType.__not_a_real_member__') -> "sourceType.__not_a_real_member__" ; detected-as-miss=true
CONTROL positive: t('sourceType.human_entered') -> "Human entered" ; detected-as-miss=false

214 lookups across 11 routings x 2 locales — routings with a miss: 0
EXIT_CODE=0
```

### 1.4 Phase negative control

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/neg-taskcard.mjs" "$R"
```

Verbatim output; the verdict is the three text matches, not the script's zero exit status:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
EXIT_CODE=0
```

## 2. Re-derived deletion populations — kept separate

The deletion manifest was re-derived from the same production-only TypeScript walk and the strict
instrument's exact cross-line matchers. The command excludes `i18n`, `node_modules`, `*.test.*`,
and `__tests__`, matching the P99-47 production policy. The two populations are:

- **two-arg literal class:** `t('key', 'Default')` — **1,760 sites / 160 files**;
- **object-form fallback-text-options class:** `t('key', { defaultValue: ... })` — **313 sites /
  102 files**.

Their deletion-only union is **2,073 sites / 247 files**. The union is a manifest total, not a
blended AR-04a/AR-04b defect count. The raw-key class remains separate and is not a deletion
population.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node --input-type=module - "$R" <<'NODE'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.argv[2]
const sourceRoot = join(root, 'frontend/src')
const literal = /\bt\(\s*'([^']+)'\s*,\s*'([^']*)'/g
const options = /\bt\(\s*'([^']+)'\s*,\s*\{/g
const hasDefaultValue = /\bdefaultValue\s*:/

const braceBody = (source, open) => {
  let depth = 0
  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth++
    else if (source[index] === '}' && --depth === 0) return source.slice(open, index + 1)
  }
  return ''
}
const walk = (directory, output = []) => {
  for (const entry of readdirSync(directory).sort()) {
    const path = join(directory, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'i18n' && entry !== '__tests__') walk(path, output)
    } else if (/\.tsx?$/.test(entry) && !/\.test\./.test(entry)) output.push(path)
  }
  return output
}

const literalFiles = new Set()
const optionsFiles = new Set()
let literalSites = 0
let optionsSites = 0
const files = walk(sourceRoot)
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const repoFile = relative(root, file).split('\\').join('/')
  const literalMatches = [...source.matchAll(literal)]
  literalSites += literalMatches.length
  if (literalMatches.length) literalFiles.add(repoFile)
  let fileOptions = 0
  for (const match of source.matchAll(options)) {
    const open = source.indexOf('{', match.index)
    if (hasDefaultValue.test(braceBody(source, open))) fileOptions++
  }
  optionsSites += fileOptions
  if (fileOptions) optionsFiles.add(repoFile)
}
const unionFiles = new Set([...literalFiles, ...optionsFiles])
console.log(JSON.stringify({
  policy: 'production TypeScript: excludes i18n, node_modules, *.test.*, and __tests__',
  scannedFiles: files.length,
  literalTwoArg: { definition: "t('key', 'Default')", sites: literalSites, files: literalFiles.size },
  defaultValueOptions: { definition: "t('key', { defaultValue: ... })", sites: optionsSites, files: optionsFiles.size },
  deletionUnion: { sites: literalSites + optionsSites, files: unionFiles.size },
}, null, 2))
NODE
```

Verbatim output:

```json
{
  "policy": "production TypeScript: excludes i18n, node_modules, *.test.*, and __tests__",
  "scannedFiles": 1532,
  "literalTwoArg": {
    "definition": "t('key', 'Default')",
    "sites": 1760,
    "files": 160
  },
  "defaultValueOptions": {
    "definition": "t('key', { defaultValue: ... })",
    "sites": 313,
    "files": 102
  },
  "deletionUnion": {
    "sites": 2073,
    "files": 247
  }
}
EXIT_CODE=0
```

P99-31 through P99-38 are the named downstream, file-disjoint deletion lanes that consume this
shared production manifest. No lane may derive a private blended population. The one test-only
options-default site documented by the predecessor is excluded by policy and is not part of this
manifest.

## 3. Decision boundary and handoff

- **D-05 — population:** the unscoped production `frontend/src` TypeScript walk, English and
  Arabic bundles, the two mask shapes in §2, the separate raw-key class, and dynamic prefixes.
  Outside this proof are nonliteral shapes maskfinder cannot parse, rendering/reachability, trees
  outside `frontend/src`, and all deletions.
- **D-06 — controlled zeros:** the strict walk is nonempty (`twoArgTotal=2073`,
  `rawKeyTotal=6490`); maskfinder ran positive and negative controls before its live zero;
  resolve-check ran its own positive and negative controls; and neg-taskcard supplied the
  independent three-miss probe.
- **D-24 — graph order:** P99-30 is its own verification-only DAG node. P99-31–38 remain behind
  this proof, so no default was deleted before strict resolution was established.
- **D-27 — blind class:** `partA_maskfinder.py` independently closed the dynamic-prefix population
  at zero after its control run.
- **D-28 — class separation:** unresolved masks are AR-04a and unresolved raw-key calls are
  AR-04b. Both are zero in each locale, and neither is summed into a blended defect figure. The
  literal and object-form fallback deletion populations also remain separately named.

There is no residue to assign site by site and no correction work left by this gatekeeper. The
only handoff is the controlled deletion manifest in §2 to P99-31–38; rendered verification and
other obligations outside this static population remain owned by their later named phase lanes.

## 4. Verification-only diff evidence

After this canonical SUMMARY was created, the required protected-tree command printed no path:

```sh
git diff --name-only HEAD -- frontend backend supabase tests scripts
```

```text

```

The task-wide diff contains only this canonical completion artifact:

```text
.planning/phases/99-arabic-coverage/99-30-SUMMARY.md
```
