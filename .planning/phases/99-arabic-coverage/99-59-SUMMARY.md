---
status: complete
---

# P99-59 Summary — mask deletion lane 6 part 2

## Outcome

GREEN. All fallback text was deleted from the eight owned overview-card sources. The strict
literal-key population moved from 56 object-form masks to zero, its positive control moved from
zero to 56 raw-key calls, and every strict English/Arabic unresolved counter stayed zero. The
dedicated fallback scanner also found five dynamic-key object fallbacks outside the strict
literal-key matcher; those were deleted too, so the complete scoped `defaultValue` population
moved from 61 to zero.

No key expression, namespace, hook, production import, or i18n JSON changed. Interpolation
options such as `count` remain. The owned companion test was conditionally repaired because its
old mock returned the English `defaultValue` values deleted here; it now resolves the real
English and Arabic `dossier.json` bundles, asserts both locale values, and asserts that the bare
key is absent.

## Population re-derivation

### Strict literal-key population at task HEAD

Command (the full JSON was saved to `/tmp/p99-59-baseline-audit.json`; this is its verbatim compact
projection):

```sh
R="$PWD"; SCOPE="frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx,frontend/src/pages/dossiers/overview-cards/EngagementsByStageCard.tsx,frontend/src/pages/dossiers/overview-cards/GastatFocalPointsCard.tsx,frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx,frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx,frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx,frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx,frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --scope "$SCOPE" --json | tee /tmp/p99-59-baseline-audit.json | node -e 'let s=[];process.stdin.on("data",d=>s.push(d)).on("end",()=>{const j=JSON.parse(s.join(""));console.log(JSON.stringify({scannedFiles:j.scannedFiles,twoArgTotal:j.twoArgTotal,literalTwoArgTotal:j.literalTwoArgTotal,optionsDefaultTotal:j.optionsDefaultTotal,rawKeyTotal:j.rawKeyTotal,twoArgUnresolved:j.twoArgUnresolved,rawKeyUnresolved:j.rawKeyUnresolved,twoArgUnresolvedEn:j.twoArgUnresolvedEn,twoArgUnresolvedAr:j.twoArgUnresolvedAr,rawKeyUnresolvedEn:j.rawKeyUnresolvedEn,rawKeyUnresolvedAr:j.rawKeyUnresolvedAr},null,2))})'
```

Verbatim output:

```json
{
  "scannedFiles": 8,
  "twoArgTotal": 56,
  "literalTwoArgTotal": 0,
  "optionsDefaultTotal": 56,
  "rawKeyTotal": 0,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedEn": 0,
  "rawKeyUnresolvedAr": 0
}
```

This reconciles the plan's 56-site strict manifest: this part contains zero literal-second-argument
sites and 56 literal-key object-form fallback sites.

### Complete object-form fallback population at task HEAD

Command (the scanner's 61 source rows were saved verbatim to
`/tmp/p99-59-baseline-fallback.txt`; this is the compact per-file register derived from them):

```sh
awk -F: '{sub(/^.*\//,"",$1); count[$1]++} END {for (file in count) print file, count[file]}' /tmp/p99-59-baseline-fallback.txt | sort
printf 'total '; wc -l < /tmp/p99-59-baseline-fallback.txt | tr -d ' '
node -e 'const j=require("/tmp/p99-59-baseline-audit.json"); console.log(`strict static-key options masks=${j.optionsDefaultTotal}; dynamic-key fallback extras=${61-j.optionsDefaultTotal}; literal-second-argument masks=${j.literalTwoArgTotal}`)'
```

Verbatim output:

```text
BilateralSummaryCard.tsx 8
EngagementsByStageCard.tsx 6
GastatFocalPointsCard.tsx 5
KeyContactsCard.tsx 5
KeyRepresentativesCard.tsx 5
MembershipStructureCard.tsx 14
MoUStatusCard.tsx 10
SharedSummaryStatsCard.tsx 8
total 61
strict static-key options masks=56; dynamic-key fallback extras=5; literal-second-argument masks=0
```

The five extras are dynamic template-key calls. They are outside the strict audit's literal-key
matcher but inside the fallback-option scanner and the acceptance population, so they were deleted.
No scoped mask was found in a file outside the eight-file lane list.

## Deletion and key-integrity proof

The production transformation was deletion-only:

- `t('key', { defaultValue: 'Literal' })` became `t('key')`.
- `t('key', { count, defaultValue: 'Literal' })` became `t('key', { count })`.
- Dynamic template-key object fallbacks became the same calls without their fallback option.

Command:

```sh
node - <<'NODE'
const {execFileSync}=require('node:child_process'); const fs=require('node:fs');
const files=[
'frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx',
'frontend/src/pages/dossiers/overview-cards/EngagementsByStageCard.tsx',
'frontend/src/pages/dossiers/overview-cards/GastatFocalPointsCard.tsx',
'frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx',
'frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx',
'frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx',
'frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx',
'frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx'];
const keys=s=>[...s.matchAll(/\bt\(\s*('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/gs)].map(m=>m[1]);
let total=0;
for(const file of files){const before=keys(execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'})); const after=keys(fs.readFileSync(file,'utf8')); if(JSON.stringify(before)!==JSON.stringify(after)){console.error(`FAIL ${file}`);process.exit(1)} total+=after.length;}
console.log(`key-byte-sequences-unchanged files=${files.length} t-call-positive-control=${total}`)
NODE
```

Verbatim output:

```text
key-byte-sequences-unchanged files=8 t-call-positive-control=61
```

Spot-diff command:

```sh
git diff -U0 -- frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx | sed -n '1,18p'
```

Verbatim sample:

```diff
@@ -47 +47 @@ export function BilateralSummaryCard({ dossierId }: BilateralSummaryCardProps):
-          {t('overview.bilateral.title', { defaultValue: 'Bilateral Summary' })}
+          {t('overview.bilateral.title')}
@@ -50,3 +50 @@ export function BilateralSummaryCard({ dossierId }: BilateralSummaryCardProps):
-          {t('overview.sectionError', {
-            defaultValue: 'Failed to load this section. Check your connection and try again.',
-          })}
+          {t('overview.sectionError')}
@@ -67 +65 @@ export function BilateralSummaryCard({ dossierId }: BilateralSummaryCardProps):
-      label: t('overview.bilateral.partnerships', { defaultValue: 'Bilateral Partners' }),
+      label: t('overview.bilateral.partnerships'),
```

The sample and full production diff change only fallback arguments/options; key bytes are identical.

## Closing register

### Strict audit and fallback scan

Command:

```sh
R="$PWD"; SCOPE="frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx,frontend/src/pages/dossiers/overview-cards/EngagementsByStageCard.tsx,frontend/src/pages/dossiers/overview-cards/GastatFocalPointsCard.tsx,frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx,frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx,frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx,frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx,frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --scope "$SCOPE" --json | node -e 'let s=[];process.stdin.on("data",d=>s.push(d)).on("end",()=>{const j=JSON.parse(s.join(""));console.log(JSON.stringify({scannedFiles:j.scannedFiles,twoArgTotal:j.twoArgTotal,literalTwoArgTotal:j.literalTwoArgTotal,optionsDefaultTotal:j.optionsDefaultTotal,rawKeyTotal:j.rawKeyTotal,twoArgUnresolved:j.twoArgUnresolved,rawKeyUnresolved:j.rawKeyUnresolved,twoArgUnresolvedEn:j.twoArgUnresolvedEn,twoArgUnresolvedAr:j.twoArgUnresolvedAr,rawKeyUnresolvedEn:j.rawKeyUnresolvedEn,rawKeyUnresolvedAr:j.rawKeyUnresolvedAr},null,2))})'
```

Verbatim output:

```json
{
  "scannedFiles": 8,
  "twoArgTotal": 0,
  "literalTwoArgTotal": 0,
  "optionsDefaultTotal": 0,
  "rawKeyTotal": 56,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedEn": 0,
  "rawKeyUnresolvedAr": 0
}
```

Exact closing oracle command: the first acceptance command from `99-59-PLAN.md`.

Verbatim output:

```text
scoped-files=8 defaultValue-hits=0
```

The strict zero has the required nonempty `rawKeyTotal=56` positive control, and the independent
fallback-option scanner closes at zero over all eight readable files.

### No i18n JSON, unresolved, and negative control

Exact closing oracle command: the second acceptance command from `99-59-PLAN.md`.

Verbatim output:

```text
task-base=6c1ca1118c7473dd0d20f6d5a31045342531c80e i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

Full negative-control command:

```sh
node scripts/neg-taskcard.mjs "$PWD"
```

Verbatim output:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

No file under `frontend/src/i18n` changed. Both strict locales remain resolved, and the phase
negative control retains exactly three `MISS=true` rows.

## Companion test repair

The repair trigger fired: after the production defaults were deleted, the previous mock
(`opts?.defaultValue ?? key`) would render bare keys and fail the owned English-copy assertions.
The repaired fixture:

- statically imports `i18n/en/dossier.json` and `i18n/ar/dossier.json` for expectations;
- loads those same bundles with `await vi.importActual` inside the hoisted `vi.mock` factory;
- resolves keys without a private copy, default fallback, or key fallback;
- retains interpolation options;
- asserts the English and Arabic `overview.sectionError` values and absence of the bare key;
- keeps every existing assertion active and strengthens hand-copied regex expectations to real
  bundle values.

Command (programmatic config disables the normal config bundler because the harness-owned
`node_modules` symlink is read-only and supplies a writable `/private/tmp` Vite cache):

```sh
cd frontend && node --input-type=module -e "import { startVitest } from 'vitest/node'; const root=process.cwd(); await startVitest('test', ['src/pages/dossiers/overview-cards/__tests__/OverviewCardErrorStates.test.tsx'], { config:false, run:true, root, environment:'jsdom', setupFiles:[root + '/tests/setup.ts'], css:true, reporters:['verbose'] }, { cacheDir:'/private/tmp/p99-59-vite-cache', resolve:{ alias:{ '@':root + '/src', '@tests':root + '/tests' } } });"
```

Verbatim result summary:

```text
Test Files  1 passed (1)
     Tests  11 passed (11)
  Duration  2.12s (transform 336ms, setup 451ms, import 1.30s, tests 83ms, environment 221ms)
```

### Frontend type-check

Command:

```sh
pnpm --dir frontend type-check
```

Verbatim output:

```text
> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260829-003127-0000000000000065--P99-59/frontend
> tsc --noEmit
```

Process exit: `0`.

## Scope and deferred work

The final source/test population is the eight allowed production files plus the one owned companion
test. This summary is the only planning artifact changed. No i18n JSON or sibling-lane file changed.
The wholesale working dot-form to colon-form conversion remains the recorded Phase 102 scope under
D-21; this deletion does not pull it forward. Other file-disjoint lane 6 parts remain owned by their
named sibling tasks.
