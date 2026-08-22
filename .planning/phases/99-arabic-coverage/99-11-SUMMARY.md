# 99-11 Summary

## Result

The dossier-family lane is landed through five implementation commits:

- `ae31ae1bb` — country colon routing, both locale payloads, and the country status carrier
- `bbfd2774d` — organization colon routing, both locale payloads, and the organization status carrier
- `eb1770eed` — graph/relationship routing, dossier carriers, authoring-only leaves, and localized search chips
- `e8753c7a7` — the final authoring-only residue, `dossier:form.description`, in both locales
- `102f6f7e7` — the production chip fragment and its executable typed-render seam

The first three commits arrived through the required P99-10 dependency. P99-11 re-ran the lane
oracles against that tree, expanded the authoring-only population to include the wizard review
steps named by the plan, repaired the one remaining leaf without editing its consumers, and
re-verified the complete lane. The final commit replaces the prior discovery-only evidence with a
render of the exact production fragment, without changing the page's translation binding, query
setter, responsive flex layout, RTL-safe styling, or touch-safe button primitive.

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
42:const SUGGESTION_CHIP_KEYS = ['saudi', 'org', 'g20', 'topic'] as const
57:export function DossierSearchSuggestionChips({
63:      {SUGGESTION_CHIP_KEYS.map((suggestionKey) => {
64:        const suggestion = translate(`dossier-search:suggestions.${suggestionKey}`)
348:          <DossierSearchSuggestionChips translate={(key) => t(key)} onSelect={setQuery} />
raw suggestion literals absent from DossierSearchPage.tsx
en: {"saudi":"Saudi Arabia","org":"UN","g20":"G20","topic":"climate"}
ar: {"saudi":"السعودية","org":"الأمم المتحدة","g20":"G20","topic":"المناخ"}
```

The task's typed render oracle executed the exact exported production fragment through Vite's TSX
loader and ReactDOMServer, then inspected the rendered DOM. It would fail if the fragment did not
emit exactly four buttons, if Arabic script were absent, if `G20` disappeared, or if any of the
three non-allowlisted raw English literals rendered. Output and exit `0`:

```text
UI99-C8 rendered chip texts: ["السعودية","الأمم المتحدة","G20","المناخ"]
UI99-C8 ar search chips: PASS
```

```sh
cd frontend
node --input-type=module -e '
import path from "node:path"
import { readFile } from "node:fs/promises"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"
import { createInstance } from "i18next"
process.env.VITE_SUPABASE_URL = "http://127.0.0.1"
process.env.VITE_SUPABASE_ANON_KEY = "typed-render-oracle"
globalThis.__dirname = process.cwd()
const { createServer } = await import("vite")
const { default: config } = await import("./vite.config.ts")
const server = await createServer({
  ...config,
  configFile: false,
  root: process.cwd(),
  cacheDir: path.join("/private/tmp", "p99-11-vite-ssr-cache"),
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
})
try {
  const locale = JSON.parse(await readFile(path.join(process.cwd(), "src/i18n/ar/dossier-search.json"), "utf8"))
  const i18n = createInstance()
  await i18n.init({ lng: "ar", fallbackLng: false, resources: { ar: { "dossier-search": locale } }, showSupportNotice: false })
  const { DossierSearchSuggestionChips } = await server.ssrLoadModule("/src/pages/DossierSearchPage.tsx")
  const markup = renderToStaticMarkup(createElement(DossierSearchSuggestionChips, {
    translate: (key) => i18n.t(key),
    onSelect: () => undefined,
  }))
  const document = new JSDOM(markup).window.document
  const chipTexts = Array.from(document.querySelectorAll("button"), (button) => button.textContent.trim())
  if (chipTexts.length !== 4) throw new Error("expected exactly four rendered suggestion chips")
  if (!/[\u0600-\u06ff]{3,}/.test(chipTexts.join(" "))) throw new Error("rendered chips contain no Arabic script")
  if (!chipTexts.includes("G20")) throw new Error("rendered chips lost the G20 proper noun")
  for (const raw of ["Saudi Arabia", "UN", "climate"]) {
    if (chipTexts.includes(raw)) throw new Error("raw suggestion literal survived: " + raw)
  }
  console.log("UI99-C8 rendered chip texts: " + JSON.stringify(chipTexts))
  console.log("UI99-C8 ar search chips: PASS")
} finally {
  await server.close()
}
'
```

The direct `pw-run-reaped` path was attempted first, but this worker sandbox denies local socket
listeners with `EPERM`; its withheld zero-test report was not counted as evidence. This typed
command is the task-owned rendered oracle permitted by the anchored review: it performs a real
render without a server or credential dependency, while the credentialed UI99-C8 browser row
remains the full-suite integration check.

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
- The external harness runs the credentialed UI99-C8 render and the full suite.

No out-of-scope tracked path changed.
