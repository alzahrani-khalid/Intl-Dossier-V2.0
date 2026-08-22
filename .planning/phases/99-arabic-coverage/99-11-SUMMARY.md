# 99-11 Summary

## Result

The dossier-family lane is landed through the P99-10 implementation commits plus the P99-11
repairs:

- `ae31ae1bb` — country colon routing, both locale payloads, and the country status carrier
- `bbfd2774d` — organization colon routing, both locale payloads, and the organization status carrier
- `eb1770eed` — graph/relationship routing, dossier carriers, authoring-only leaves, and localized search chips
- `b375f2afe` — the final authoring-only residue, `dossier:form.description`, in both locales
- `eba0cc87b` — renders the search chips directly inside `DossierSearchPage` with the page's
  bound `useTranslation('dossier-search')` result

The first three commits arrived through the required P99-10 dependency. P99-11 re-ran the lane
oracles against that tree, expanded the authoring-only population to include the wizard review
steps named by the plan, repaired the one remaining leaf without editing its consumers, and
re-verified the complete lane. The final source repair removes the translator-prop path and
keeps the empty-query chip surface on the page component itself, without changing the query setter,
responsive flex layout, RTL-safe styling, or touch-safe button primitive.

The search surface maps four stable chip ids through explicit
`dossier-search:suggestions.*` bindings. Arabic renders `السعودية`, `الأمم المتحدة`, `G20`, and
`المناخ`. `G20` deliberately stays Latin because UI99-C9 names it as an international proper-noun
allowlist member.

## Populations

The five-file source population is exactly:

```text
frontend/src/pages/Countries.tsx
frontend/src/pages/Organizations.tsx
frontend/src/components/relationships/GraphVisualization.tsx
frontend/src/components/relationships/RelationshipNavigator.tsx
frontend/src/pages/DossierSearchPage.tsx
```

At the lane baseline recorded by P99-10, the strict audit found 83 unresolved two-argument sites
and zero unresolved raw-key sites in these five files. At P99-11 start, after the dependency
commits, the same audit was already zero; it remains zero at handoff:

```json
{
  "scannedFiles": 5,
  "twoArgTotal": 83,
  "literalTwoArgTotal": 82,
  "optionsDefaultTotal": 1,
  "rawKeyTotal": 11,
  "twoArgUnresolved": 0,
  "literalTwoArgUnresolved": 0,
  "optionsDefaultUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "sites": []
}
```

Command:

```sh
node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/pages/Countries.tsx,frontend/src/pages/Organizations.tsx,frontend/src/components/relationships/GraphVisualization.tsx,frontend/src/components/relationships/RelationshipNavigator.tsx,frontend/src/pages/DossierSearchPage.tsx" --json
```

The complete authoring-only population combines the six named guide/widget/hook consumers with
the eight production wizard-review files. P99-11's starting review-step audit found six sites
targeting one distinct missing leaf:

```json
{
  "twoArgTotal": 27,
  "rawKeyTotal": 87,
  "twoArgUnresolved": 5,
  "rawKeyUnresolved": 1,
  "twoArgUnresolvedEn": 5,
  "rawKeyUnresolvedEn": 1,
  "twoArgUnresolvedAr": 5,
  "rawKeyUnresolvedAr": 1,
  "twoArgDistinct": 1,
  "rawKeyDistinct": 1
}
```

All six rows were `dossier:form.description`: five review steps supplied the literal default
`Description`, while `WorkingGroupReviewStep.tsx` used the same key without a default. The final
combined audit output is:

```json
{
  "scannedFiles": 14,
  "twoArgTotal": 64,
  "literalTwoArgTotal": 55,
  "optionsDefaultTotal": 9,
  "rawKeyTotal": 104,
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
  "sites": []
}
```

Command:

```sh
review_scope="$(rg --files frontend/src/components/dossier/wizard/review -g '*.tsx' | rg -v '/__tests__/' | sort | paste -sd, -)"
author_scope="frontend/src/components/dossier/DossierTypeGuide.tsx,frontend/src/components/dossier/DossierTypeStatsCard.tsx,frontend/src/components/dossier/DossierLinksWidget.tsx,frontend/src/components/list-page/EngagementsList.tsx,frontend/src/domains/engagements/hooks/useLifecycle.ts,frontend/src/hooks/usePersonDossiers.ts"
node scripts/i18n-audit-strict.mjs "$PWD" --scope "$author_scope,$review_scope" --json
```

Outside these populations are all other source consumers, every namespace not named by the plan,
the common-owner lane, and the 17 final maskfinder rows listed below.

## Dynamic Units and Atomicity

The complete enum sets present in both locales are:

```text
countries.status: active, inactive, archived, deleted, suspended
organizations.status: active, inactive, suspended
dossier.type carrier domain: country, organization, forum, engagement, topic, working_group, person, elected_official
dossier.type retained compatibility leaf: theme
dossier.status: active, inactive, archived, deleted
```

The carrier rewrites and their two locale files share commits as follows:

```text
ae31ae1bb fix(i18n): localize country dossier lane
frontend/src/i18n/ar/countries.json
frontend/src/i18n/en/countries.json
frontend/src/pages/Countries.tsx
bbfd2774d fix(i18n): localize organization dossier lane
frontend/src/i18n/ar/organizations.json
frontend/src/i18n/en/organizations.json
frontend/src/pages/Organizations.tsx
eb1770eed fix(i18n): localize dossier relationship lane
frontend/src/components/relationships/GraphVisualization.tsx
frontend/src/components/relationships/RelationshipNavigator.tsx
frontend/src/i18n/ar/contacts.json
frontend/src/i18n/ar/dossier-context.json
frontend/src/i18n/ar/dossier-search.json
frontend/src/i18n/ar/dossier.json
frontend/src/i18n/ar/graph.json
frontend/src/i18n/ar/lifecycle.json
frontend/src/i18n/ar/relationships.json
frontend/src/i18n/en/contacts.json
frontend/src/i18n/en/dossier-context.json
frontend/src/i18n/en/dossier-search.json
frontend/src/i18n/en/dossier.json
frontend/src/i18n/en/lifecycle.json
frontend/src/i18n/en/relationships.json
frontend/src/pages/DossierSearchPage.tsx
```

Command:

```sh
for commit in ae31ae1bb bbfd2774d eb1770eed; do
  git show -s --format='%h %s' "$commit"
  git show --format= --name-only "$commit" | sed '/^$/d'
done
```

An AST comparison against the pre-lane commit `3520d5fe0` proves that the only removed second
arguments are the five dynamic raw-value carriers:

```text
frontend/src/pages/Countries.tsx: before=30 retained=29 removed=1 added=0
  removed base line 275 second=dossier.status
frontend/src/pages/Organizations.tsx: before=31 retained=30 removed=1 added=0
  removed base line 300 second=org.status
frontend/src/components/relationships/GraphVisualization.tsx: before=15 retained=15 removed=0 added=0
frontend/src/components/relationships/RelationshipNavigator.tsx: before=14 retained=11 removed=3 added=0
  removed base line 166 second=type
  removed base line 212 second=node.type
  removed base line 218 second=node.status
frontend/src/pages/DossierSearchPage.tsx: before=2 retained=2 removed=0 added=0
```

All retained second arguments matched byte-for-byte as AST source text; no second argument was
added. The dynamic expressions now use explicit `countries:status.*`,
`organizations:status.*`, `dossier:type.*`, or `dossier:status.*` routing.

## Authoring-Only Namespace Slices

The complete authored set targeted by consumers outside the five editable source files is:

- `dossier`: `typeGuide.learnMore`, `form.description`
- `dossier-context`: `actions.retry`, `actions.cancel`, `actions.removing`, `actions.remove`
- `engagements`: no missing key surfaced; no leaf was authored
- `lifecycle`: `messages.transitionSuccess`, `messages.transitionError`,
  `messages.promotionSuccess`, `messages.promotionError`, `messages.forumSessionCreated`,
  `messages.forumSessionCreateError`
- `contacts`: `hooks.contact_created_success`, `hooks.contact_created_error`,
  `hooks.contact_archived_success`, `hooks.contact_archived_error`

Every listed key exists in `en` and `ar`. English `dossier.form.description` is byte-identical to
the source mask literal (`Description`); Arabic is `الوصف`. No consumer source file was changed.

## Common Ownership

No `common.*` or `common:*` source line changed anywhere in the five-file lane diff from
`3520d5fe0` through this handoff:

```text
no common.* or common:* source-line changes in the five-file lane diff
```

Command:

```sh
if git diff 3520d5fe0..HEAD -- frontend/src/pages/Countries.tsx frontend/src/pages/Organizations.tsx frontend/src/components/relationships/GraphVisualization.tsx frontend/src/components/relationships/RelationshipNavigator.tsx frontend/src/pages/DossierSearchPage.tsx | rg '^[+-].*common[.:]'; then
  exit 1
else
  echo 'no common.* or common:* source-line changes in the five-file lane diff'
fi
```

No common-targeted key surfaced in the lane audit, so the named set left for the common-owner lane
from this work is empty.

## Instrument of Record

The control ran first and discriminated both polarities. The final derivation is:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 17 total  (13 mask a raw value -> criterion 1; 4 render a RAW KEY -> criterion 2)
MASKED-RAW-VALUE  frontend/src/components/layout/EntityBreadcrumbTrail.tsx:125  prefix='entityTypes' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/AddContributorDialog.tsx:258  prefix='tasks.contributorRole' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/AddContributorDialog.tsx:264  prefix='tasks.roleDescription' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/ContributorsList.tsx:78  prefix='tasks.contributorRole' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:51  prefix='priority' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:54  prefix='status' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:58  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:124  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:414  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:487  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:213  prefix='waitingQueue.status' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:223  prefix='waitingQueue.priority' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:260  prefix='waitingQueue.entityType' ns=common
RAW-KEY           frontend/src/components/commitment-editor/CommitmentEditor.tsx:120  prefix='afterActions.commitments.tracking' ns=common
RAW-KEY           frontend/src/components/dossier-recommendations/DossierRecommendationCard.tsx:165  prefix='types' ns=dossier-recommendations|dossier|dossier-recommendations|dossier-recommendations
RAW-KEY           frontend/src/pages/Dashboard/components/AttentionItem.tsx:92  prefix='stages' ns=operations-hub
RAW-KEY           frontend/src/pages/intelligence/IntelligencePage.tsx:65  prefix='intelligence.classification' ns=common|intelligence-signals|intelligence-digests|intelligence-alerts
```

Command/oracle exit: `0`.

```sh
PATH="/opt/homebrew/bin:$PATH"
R="$PWD"
python3 "$R/scripts/partA_maskfinder.py" "$R" --control
OUT="$(python3 "$R/scripts/partA_maskfinder.py" "$R")"
printf '%s\n' "$OUT"
printf '%s\n' "$OUT" | command grep -q "UNRESOLVED dynamic t() key prefixes:"
! printf '%s\n' "$OUT" | command grep -qE "pages/Countries\.tsx|pages/Organizations\.tsx|RelationshipNavigator\.tsx"
```

None of the 17 remaining rows names `Countries.tsx`, `Organizations.tsx`, or
`RelationshipNavigator.tsx`. They remain with their source/namespace-owning later lanes.

## Search Chips and Rendered Oracle

Source absence/presence and authored values:

```text
no chip-only export or translator prop in DossierSearchPage.tsx
42:const SUGGESTION_CHIP_KEYS = ['saudi', 'org', 'g20', 'topic'] as const
44:type SuggestionChipKey = (typeof SUGGESTION_CHIP_KEYS)[number]
45:type SuggestionTranslationKey = `dossier-search:suggestions.${SuggestionChipKey}`
316:            {SUGGESTION_CHIP_KEYS.map((suggestionKey) => {
318:                `dossier-search:suggestions.${suggestionKey}` satisfies SuggestionTranslationKey,
en: {"saudi":"Saudi Arabia","org":"UN","g20":"G20","topic":"climate"}
ar: {"saudi":"السعودية","org":"الأمم المتحدة","g20":"G20","topic":"المناخ"}
```

Command:

```sh
set -e
if rg -n "translate=|^export function .*Suggestion" frontend/src/pages/DossierSearchPage.tsx; then exit 1; else echo 'no chip-only export or translator prop in DossierSearchPage.tsx'; fi
rg -n "SUGGESTION_CHIP_KEYS|dossier-search:suggestions" frontend/src/pages/DossierSearchPage.tsx
node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs'
for (const locale of ['en', 'ar']) {
  const value = JSON.parse(readFileSync(`frontend/src/i18n/${locale}/dossier-search.json`, 'utf8')).suggestions
  console.log(`${locale}: ${JSON.stringify(value)}`)
}
NODE
```

The committed UI99-C8 row is the browser integration oracle for the settled route. It mounts
`/search?lng=ar`, runs `settle(page)`, asserts `expectLocale(page, 'ar', '/search')`, then reads
the empty-query chip buttons from `main div.mt-6 button`:

```text
test('UI99-C8 ar search chips', async ({ page }) => {
  await gotoLocale(page, '/search', 'ar')
  await settle(page)
  await expectLocale(page, 'ar', '/search')

  const chips = page.getByRole('main').locator('div.mt-6 button')
  await expect(
    chips.first(),
    'UI99-C8 needs the hydrated empty-search suggestion chips',
  ).toBeVisible()
  const chipTexts = (await chips.allInnerTexts()).map((text) => text.trim())
  expect(chipTexts.length, 'UI99-C8 suggestion-chip population').toBeGreaterThanOrEqual(4)
  expect(chipTexts.join(' '), 'UI99-C8 localized chips must contain Arabic script').toMatch(
    ARABIC_SCRIPT,
  )
  expect(chipTexts, 'G20 is an allowlisted international proper noun').toContain('G20')
  for (const raw of ['Saudi Arabia', 'UN', 'climate']) {
    expect(chipTexts, `UI99-C8 raw suggestion literal survived: ${raw}`).not.toContain(raw)
  }
```

Command:

```sh
sed -n '229,247p' tests/e2e/99-ar03-leak.spec.ts
```

The direct Playwright invocation of that single row was attempted. This worker cannot start the
configured app server because Doppler has no keyring token in the sandbox, so this failed before
the app rendered and is not counted as a passing oracle:

```text
◇ injected env (7) from ../../../.env.test // tip: ⌘ override existing { override: true }
[WebServer] pw-run-reaped --lease-exec: PW_LEASE_* env absent — running UNLEASED (ad-hoc invocation)
[WebServer] (node:66893) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] Token not found in system keyring
[WebServer] Doppler Error: secret not found in keyring
Error: Process from config.webServer was not able to start. Exit code: 1
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --grep "UI99-C8 ar search chips" --reporter=list
```

The task-owned render oracle mounts `DossierSearchPage` itself in JSDOM at
`http://localhost/search?lng=ar`, with routing/search-data dependencies stubbed. The page still
calls its own `useTranslation('dossier-search')` hook, renders through Vite and
`@testing-library/react`, and the check waits for the empty-search buttons before asserting Arabic
script, `G20`, and absence of the three non-allowlisted raw literals.

```sh
PATH="/opt/homebrew/bin:$PATH"; I18NEXT_NO_SUPPORT_NOTICE=1; cd frontend
node --input-type=module <<'NODE'
import { JSDOM } from 'jsdom'
import path from 'node:path'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import React from 'react'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { render, waitFor } from '@testing-library/react'
import i18next from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'

globalThis.React = React
const root = process.cwd()
const stubDir = '/tmp/ui99-c8-stubs'
mkdirSync(stubDir, { recursive: true })
writeFileSync(
  path.join(stubDir, 'router.mjs'),
  `export const useNavigate = () => () => undefined;\nexport const useSearch = () => ({});\n`,
)
writeFileSync(
  path.join(stubDir, 'results.mjs'),
  `export const DossierFirstSearchResults = () => null;\n`,
)
writeFileSync(
  path.join(stubDir, 'error-state.mjs'),
  `export const QueryErrorState = () => null;\n`,
)
writeFileSync(
  path.join(stubDir, 'filters.mjs'),
  `export const DossierSearchFilters = () => null;\n`,
)
writeFileSync(
  path.join(stubDir, 'search-hook.mjs'),
  `export const useDossierFirstSearch = () => ({\n  query: '',\n  filters: { types: 'all', status: 'all', myDossiersOnly: false },\n  dossiers: [],\n  relatedWork: [],\n  dossiersTotal: 0,\n  relatedWorkTotal: 0,\n  hasMoreDossiers: false,\n  hasMoreWork: false,\n  typeCounts: {},\n  isLoading: false,\n  isFetching: false,\n  isError: false,\n  error: null,\n  tookMs: undefined,\n  setQuery: () => undefined,\n  updateFilters: () => undefined,\n  loadMoreDossiers: () => undefined,\n  loadMoreWork: () => undefined,\n  clearSearch: () => undefined,\n  refetch: () => undefined,\n});\n`,
)
writeFileSync(
  path.join(stubDir, 'direction.mjs'),
  `export const useDirection = () => ({ direction: 'rtl', isRTL: true });\n`,
)

const url = 'http://localhost/search?lng=ar'
const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>', {
  url,
  pretendToBeVisual: true,
})

dom.window.HTMLElement.prototype.attachEvent = function attachEvent() {}
dom.window.HTMLElement.prototype.detachEvent = function detachEvent() {}

const expose = (name, value) => {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}

expose('window', dom.window)
expose('document', dom.window.document)
expose('navigator', dom.window.navigator)
expose('HTMLElement', dom.window.HTMLElement)
expose('HTMLInputElement', dom.window.HTMLInputElement)
expose('SVGElement', dom.window.SVGElement)
expose('Element', dom.window.Element)
expose('Node', dom.window.Node)
expose('MutationObserver', dom.window.MutationObserver)
expose('getComputedStyle', dom.window.getComputedStyle.bind(dom.window))
expose('requestAnimationFrame', (callback) => setTimeout(callback, 0))
expose('cancelAnimationFrame', (id) => clearTimeout(id))
expose(
  'ResizeObserver',
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
expose('matchMedia', (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return false
  },
}))

const loadJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'))
const i18n = i18next.createInstance()
await i18n.use(initReactI18next).init({
  lng: 'ar',
  fallbackLng: false,
  ns: ['dossier-search'],
  defaultNS: 'dossier-search',
  resources: {
    en: { 'dossier-search': loadJson('src/i18n/en/dossier-search.json') },
    ar: { 'dossier-search': loadJson('src/i18n/ar/dossier-search.json') },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  showSupportNotice: false,
})

document.documentElement.lang = 'ar'
document.documentElement.dir = 'rtl'

const server = await createServer({
  root,
  configFile: false,
  cacheDir: '/tmp/ui99-c8-vite-cache',
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { disabled: true, noDiscovery: true, entries: [] },
  ssr: { optimizeDeps: { disabled: true, noDiscovery: true, include: [] } },
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@tanstack\/react-router$/, replacement: path.join(stubDir, 'router.mjs') },
      {
        find: /^@\/components\/search\/DossierFirstSearchResults$/,
        replacement: path.join(stubDir, 'results.mjs'),
      },
      {
        find: /^@\/components\/error-states\/QueryErrorState$/,
        replacement: path.join(stubDir, 'error-state.mjs'),
      },
      {
        find: /^@\/components\/search\/DossierSearchFilters$/,
        replacement: path.join(stubDir, 'filters.mjs'),
      },
      { find: /^@\/hooks\/useDossierFirstSearch$/, replacement: path.join(stubDir, 'search-hook.mjs') },
      { find: /^@\/hooks\/useDirection$/, replacement: path.join(stubDir, 'direction.mjs') },
      { find: '@', replacement: path.join(root, 'src') },
    ],
  },
})

try {
  const { DossierSearchPage } = await server.ssrLoadModule('/src/pages/DossierSearchPage.tsx')
  render(
    React.createElement(
      I18nextProvider,
      { i18n },
      React.createElement('main', null, React.createElement(DossierSearchPage)),
    ),
    { container: document.getElementById('root') },
  )

  let chipTexts = []
  await waitFor(() => {
    chipTexts = Array.from(document.querySelectorAll('main div.mt-6 button')).map((button) =>
      button.textContent.trim(),
    )
    if (chipTexts.length < 4) {
      throw new Error(`expected at least 4 suggestion chips, got ${chipTexts.length}`)
    }
  })

  const rendered = chipTexts.slice(0, 4)
  const arabicScript = /[\u0600-\u06ff]{3,}/
  if (!arabicScript.test(rendered.join(' '))) {
    throw new Error(`localized chips did not contain Arabic script: ${JSON.stringify(rendered)}`)
  }
  if (!rendered.includes('G20')) {
    throw new Error(`G20 proper noun chip missing: ${JSON.stringify(rendered)}`)
  }
  for (const raw of ['Saudi Arabia', 'UN', 'climate']) {
    if (rendered.includes(raw)) {
      throw new Error(`raw English suggestion literal survived: ${raw}`)
    }
  }

  console.log(`UI99-C8 mounted URL: ${url}`)
  console.log(`UI99-C8 rendered chip texts: ${JSON.stringify(rendered)}`)
  console.log('UI99-C8 ar search chips: PASS')
} finally {
  await server.close()
}
NODE
```

Output and exit `0`:

```text
UI99-C8 mounted URL: http://localhost/search?lng=ar
UI99-C8 rendered chip texts: ["السعودية","الأمم المتحدة","G20","المناخ"]
UI99-C8 ar search chips: PASS
```

## Locale Parity and Type Safety

Ten-pair leaf parity after the final authoring leaf:

```text
countries: en=40 ar=40 enOnly=0 arOnly=0
organizations: en=43 ar=43 enOnly=0 arOnly=0
graph: en=154 ar=154 enOnly=0 arOnly=0
relationships: en=220 ar=220 enOnly=0 arOnly=0
dossier: en=984 ar=984 enOnly=0 arOnly=0
dossier-context: en=150 ar=150 enOnly=0 arOnly=0
dossier-search: en=50 ar=50 enOnly=0 arOnly=0
engagements: en=188 ar=188 enOnly=0 arOnly=0
lifecycle: en=69 ar=69 enOnly=0 arOnly=0
contacts: en=278 ar=278 enOnly=0 arOnly=0
```

Type-check output and exit `0`:

```text
> intake-frontend@1.0.0 type-check .../frontend
> tsc --noEmit
```

Command:

```sh
pnpm --dir frontend run type-check
```

The commit hook also completed the repository build successfully; only the repository's existing
PDFDocument, CSS-token, circular-chunk, and static/dynamic import warnings were replayed.

## Left for Later

- The 17 final maskfinder rows are outside this lane and remain with their named owners.
- The working dot-form convention tail remains under D-21/common ownership; this lane made no
  common binding change.

No out-of-scope tracked path changed.
