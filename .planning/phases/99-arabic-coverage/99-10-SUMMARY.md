# 99-10 Summary

## Result

Implemented the dossier-family authoring and explicit-colon lane in three atomic commits:

- `ae31ae1bb` — country authoring, colon routing, and atomic status carrier retirement
- `bbfd2774d` — organization authoring, colon routing, and atomic status carrier retirement
- `eb1770eed` — graph/relationship routing, dossier enum carrier retirement, authoring-only
  leaves, glossary alignment, and localized search chips

The five lane source files now have strict-audit zero in both locales. The search chips resolve
through explicit `dossier-search:suggestions.*` keys; Arabic renders `السعودية`,
`الأمم المتحدة`, `G20`, and `المناخ`. `G20` deliberately remains Latin under the named UI99-C9
proper-noun allowlist. The previous placeholder drift was also corrected: the Arabic country
placeholder now retains the source/default `AE` code.

## Re-derived Starting Populations

Command:

```sh
node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/pages/Countries.tsx,frontend/src/pages/Organizations.tsx,frontend/src/components/relationships/GraphVisualization.tsx,frontend/src/components/relationships/RelationshipNavigator.tsx,frontend/src/pages/DossierSearchPage.tsx" --json
```

Output summary:

```json
{
  "scannedFiles": 5,
  "twoArgTotal": 83,
  "rawKeyTotal": 11,
  "twoArgUnresolved": 83,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 83,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 83,
  "rawKeyUnresolvedAr": 0
}
```

Distinct unresolved slices were:

- `countries`: 27 keys
- `organizations`: 28 keys
- `graph`: 15 keys
- `relationship.navigator`: 10 keys

Command:

```sh
node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/components/dossier/DossierTypeGuide.tsx,frontend/src/components/dossier/DossierTypeStatsCard.tsx,frontend/src/components/dossier/DossierLinksWidget.tsx,frontend/src/components/list-page/EngagementsList.tsx,frontend/src/domains/engagements/hooks/useLifecycle.ts,frontend/src/hooks/usePersonDossiers.ts" --json
```

Output summary:

```json
{
  "scannedFiles": 6,
  "twoArgTotal": 37,
  "rawKeyTotal": 17,
  "twoArgUnresolved": 13,
  "rawKeyUnresolved": 4,
  "twoArgUnresolvedEn": 13,
  "rawKeyUnresolvedEn": 4,
  "twoArgUnresolvedAr": 13,
  "rawKeyUnresolvedAr": 4
}
```

Authoring-only slices:

- `dossier:typeGuide.learnMore`
- `dossier-context:actions.retry`, `actions.cancel`, `actions.removing`, `actions.remove`
- `lifecycle:messages.transitionSuccess`, `transitionError`, `promotionSuccess`,
  `promotionError`, `forumSessionCreated`, `forumSessionCreateError`
- `contacts:hooks.contact_created_success`, `contact_created_error`,
  `contact_archived_success`, `contact_archived_error`
- `engagements`: no unresolved authoring-only key surfaced

Command:

```sh
python3 scripts/partA_maskfinder.py "$PWD" --control && python3 scripts/partA_maskfinder.py "$PWD"
```

Starting output:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 22 total  (18 mask a raw value -> criterion 1; 4 render a RAW KEY -> criterion 2)
MASKED-RAW-VALUE  frontend/src/components/relationships/RelationshipNavigator.tsx:166  prefix='dossier.type' ns=common
MASKED-RAW-VALUE  frontend/src/components/relationships/RelationshipNavigator.tsx:212  prefix='dossier.type' ns=common
MASKED-RAW-VALUE  frontend/src/components/relationships/RelationshipNavigator.tsx:218  prefix='dossier.status' ns=common
MASKED-RAW-VALUE  frontend/src/pages/Countries.tsx:275  prefix='countries.status' ns=common
MASKED-RAW-VALUE  frontend/src/pages/Organizations.tsx:300  prefix='organizations.status' ns=common
```

## Dynamic Units and Glossary

The five dynamic sites above were repaired as three atomic enum units. Their complete authored
sets in both locales are:

```text
countries.status: active, inactive, archived, deleted, suspended
organizations.status: active, inactive, suspended
dossier.type: country, organization, forum, engagement, topic, theme, working_group, person, elected_official
dossier.status: active, inactive, archived, deleted
```

Only these five dynamic defaults were removed. Every retained second argument elsewhere is
byte-identical to the starting tree. Arabic authoring follows the ruled terms: dossier object
`دوسيه`, engagement `مشاركة`, position-as-stance `موقف`, and country `دولة` / `الدول`.

No common-targeted key surfaced in this lane's five-file strict population; nothing is deferred
to the common-owner lane from this task.

## Verification

Five-file strict audit:

```json
{
  "scannedFiles": 5,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "sites": 0
}
```

Authoring-only strict audit:

```json
{
  "scannedFiles": 6,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "sites": 0
}
```

Final maskfinder control and population:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 17 total  (13 mask a raw value -> criterion 1; 4 render a RAW KEY -> criterion 2)
```

The lane-file filter over that output was empty, proving `Countries.tsx`, `Organizations.tsx`,
and `RelationshipNavigator.tsx` no longer contribute dynamic-mask rows. The 17 remaining rows are
outside this task's source scope and stay with their named owning lanes.

Second-argument byte comparison against starting commit `3520d5fe0`:

```text
frontend/src/pages/Countries.tsx: retainedSecondArgs=29 byteIdentical=true dynamicDefaultsRemoved=1
frontend/src/pages/Organizations.tsx: retainedSecondArgs=30 byteIdentical=true dynamicDefaultsRemoved=1
frontend/src/components/relationships/GraphVisualization.tsx: retainedSecondArgs=15 byteIdentical=true dynamicDefaultsRemoved=0
frontend/src/components/relationships/RelationshipNavigator.tsx: retainedSecondArgs=11 byteIdentical=true dynamicDefaultsRemoved=3
frontend/src/pages/DossierSearchPage.tsx: retainedSecondArgs=2 byteIdentical=true dynamicDefaultsRemoved=0
dynamicDefaultsRemovedTotal=5
```

Ten-pair leaf parity:

```text
countries: en=40 ar=40 enOnly=0 arOnly=0
organizations: en=43 ar=43 enOnly=0 arOnly=0
graph: en=154 ar=154 enOnly=0 arOnly=0
relationships: en=220 ar=220 enOnly=0 arOnly=0
dossier: en=983 ar=983 enOnly=0 arOnly=0
dossier-context: en=150 ar=150 enOnly=0 arOnly=0
dossier-search: en=50 ar=50 enOnly=0 arOnly=0
engagements: en=188 ar=188 enOnly=0 arOnly=0
lifecycle: en=69 ar=69 enOnly=0 arOnly=0
contacts: en=278 ar=278 enOnly=0 arOnly=0
```

Chip absence/presence output:

```text
45:  const { t } = useTranslation('dossier-search')
314:              const suggestion = t(`dossier-search:suggestions.${suggestionKey}`)
```

`rg -n 'Saudi Arabia|\bUN\b|climate' frontend/src/pages/DossierSearchPage.tsx` produced no
output. Authored values are:

```json
{"saudi":"Saudi Arabia","org":"UN","g20":"G20","topic":"climate"}
{"saudi":"السعودية","org":"الأمم المتحدة","g20":"G20","topic":"المناخ"}
```

Type-check command and output:

```sh
pnpm --dir frontend run type-check
```

```text
> intake-frontend@1.0.0 type-check .../frontend
> tsc --noEmit
```

The commit-time repository build gate also completed successfully from the shared turbo cache for
all three workspaces; it retained the existing PDFDocument and CSS warnings.

Rendered-oracle selection command:

```sh
test -f tests/e2e/99-ar03-leak.spec.ts && pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts -g "UI99-C8 ar search chips" --project=chromium-en --no-deps --list
```

Output:

```text
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:229:5 › UI99-C8 ar search chips
Total: 1 test in 1 file
```

The exact reaped rendered command was attempted. This restricted worker sandbox denied the
reaper's mandatory `ps` census (`ps: operation not permitted` / Node `spawnSync ps EPERM`), denied
the Doppler system keyring (`Token not found in system keyring`), denied Vite's write through the
harness-owned `node_modules` symlink, and denied a direct local listener (`listen EPERM
127.0.0.1:5173`). Consequently Playwright's retained JSON truthfully recorded a web-server startup
error with `expected: 0` tests, and the reaper exited `90` as designed. Computer Use was also
unavailable (`runtime_unavailable: Could not connect to the running Orca app`). No product
assertion ran in this sandbox; the harness's external rendered gate must execute the listed single
test in its process/network-enabled gate environment. The incomplete sandbox lease created by the
diagnostic attempt was removed before handoff so it cannot poison that external sweep.

Final diff checks:

```text
git diff --check 3520d5fe0..HEAD
# no output
```

The implementation diff contains only the 22 allowed source/locale paths plus this summary. No
out-of-scope tracked path changed.

## Left for Later

- The 17 final maskfinder rows outside the three repaired units remain with their owning lanes.
- The working dot-form convention tail remains deferred by D-21; this task changed only broken
  bindings in its five-file population.
- No common-owner key is deferred from this lane.
