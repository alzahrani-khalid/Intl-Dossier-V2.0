---
status: complete
---

# P99-49 Summary — bilingual ruled dynamic leaves

## Result

The repair is complete in two product commits:

- `661a2c4ba` adds the exact bilingual leaf census;
- `154f2468f` bounds the three ruled dynamic-label routes.

All 153 list-family leaves now resolve in English and Arabic. `AdvancedGraphVisualization` and both
`AnalyticResultView` type labels prove membership in the production `DOSSIER_CARD_TYPES` constant and
route every nonmember to `graph:type.unknown`. `IconRail` derives its tooltip lookup from the five
`defaultItems` keys and routes every other prop-supplied key to the existing localized
`common:unknown` leaf. The dynamic audit reports the exact fenced residue: the three statically
unprovable AdvancedGraphVisualization domains and the two successor-owned legend leaves.

## Exact 32-leaf inventory

The eight newly added `cta` leaves are:

| Key | English | Arabic |
| --- | --- | --- |
| `list.commitment.cta` | Add commitment | إضافة التزام |
| `list.document.cta` | Upload document | رفع مستند |
| `list.dossier.cta` | Create dossier | إنشاء دوسيه |
| `list.event.cta` | Create event | إنشاء فعالية |
| `list.generic.cta` | Create item | إنشاء عنصر |
| `list.mou.cta` | Add MOU | إضافة مذكرة تفاهم |
| `list.position.cta` | Create position | إنشاء موقف |
| `list.task.cta` | Create task | إنشاء مهمة |

The other 24 leaves are the six caller families for each of four entities:

| Key | English | Arabic |
| --- | --- | --- |
| `list.elected_official.hint` | Elected-official dossiers keep office and term information current | تحافظ دوسيهات المسؤولين المنتخبين على تحديث معلومات المنصب والمدة |
| `list.elected_official.firstDescription` | Create an elected-official dossier to track office, term, and contact details. | أنشئ دوسيه مسؤول منتخب لمتابعة المنصب والمدة وبيانات التواصل. |
| `list.elected_official.createFirst` | Add first elected official | إضافة أول مسؤول منتخب |
| `list.elected_official.create` | Add elected official | إضافة مسؤول منتخب |
| `list.elected_official.firstTitle` | Add your first elected official | أضف أول مسؤول منتخب |
| `list.elected_official.import` | Import elected officials | استيراد المسؤولين المنتخبين |
| `list.topic.hint` | Topic dossiers keep related policy activity and evidence together | تجمع دوسيهات المواضيع الأنشطة والأدلة المتعلقة بالسياسات |
| `list.topic.firstDescription` | Create a topic dossier to follow a policy area or strategic initiative. | أنشئ دوسيه موضوع لمتابعة مجال سياسة أو مبادرة استراتيجية. |
| `list.topic.createFirst` | Add first topic | إضافة أول موضوع |
| `list.topic.create` | Add topic | إضافة موضوع |
| `list.topic.firstTitle` | Add your first topic dossier | أضف أول دوسيه موضوع |
| `list.topic.import` | Import topics | استيراد المواضيع |
| `list.work_item.hint` | Work items keep ownership, priority, and progress visible | توضح عناصر العمل المسؤولية والأولوية ومستوى التقدم |
| `list.work_item.firstDescription` | Create a work item to organize a task, commitment, or intake request. | أنشئ عنصر عمل لتنظيم مهمة أو التزام أو طلب استلام. |
| `list.work_item.createFirst` | Create first work item | إنشاء أول عنصر عمل |
| `list.work_item.create` | Create work item | إنشاء عنصر عمل |
| `list.work_item.firstTitle` | Create your first work item | أنشئ أول عنصر عمل |
| `list.work_item.import` | Import work items | استيراد عناصر العمل |
| `list.working_group.hint` | Working-group dossiers keep mandates, members, and activity together | تجمع دوسيهات مجموعات العمل الاختصاصات والأعضاء والأنشطة |
| `list.working_group.firstDescription` | Create a working-group dossier to track a committee or task force. | أنشئ دوسيه مجموعة عمل لمتابعة لجنة أو فريق عمل. |
| `list.working_group.createFirst` | Add first working group | إضافة أول مجموعة عمل |
| `list.working_group.create` | Add working group | إضافة مجموعة عمل |
| `list.working_group.firstTitle` | Add your first working group | أضف أول مجموعة عمل |
| `list.working_group.import` | Import working groups | استيراد مجموعات العمل |

Machine comparison against task base `3e807ab33688c4d71468130cdb2afb85b262fcfc` reports, for each
empty-states locale, `added=32 removed=0 changed=0`.

## Routing cases

`AdvancedGraphVisualization` routes exactly the eight values derived from `DOSSIER_CARD_TYPES` —
`country`, `organization`, `forum`, `engagement`, `topic`, `working_group`, `person`, and
`elected_official` — to `type.<value>`. Every other string takes the explicit `type.unknown` branch.
The observable labels are therefore `Person` / `شخص`, `Elected Official` / `مسؤول منتخب`, and
`Unknown type` / `نوع غير معروف` for an out-of-domain string.

Both `AnalyticResultView` sites use the same production-constant membership proof and explicit
`type.unknown` route. `IconRail` builds `tooltipByKey` from the five keys in `defaultItems` —
`navigation.dashboard`, `navigation.dossiers`, `navigation.workflow`, `navigation.calendar`, and
`navigation.reports` — and routes a nonmember to the already-present `common:unknown` values
`Unknown` / `غير معروف`. Both IconRail translation paths retain a default argument.

The graph bundles gained only this unknown leaf:

| Key | English | Arabic |
| --- | --- | --- |
| `type.unknown` | Unknown type | نوع غير معروف |

## Controlled audit output (verbatim)

The P99-49 acceptance assertions were executed after the instrument self-check. Complete output:

```text
{
  "selfCheck": "PASS",
  "checks": {
    "resolvedLeafPasses": true,
    "existingPrefixMissingLeafFails": true,
    "enOnlyFailsArabic": true,
    "arOnlyFailsEnglish": true,
    "unknownCallShapeFails": true,
    "interpolationOnlyOptionsNotFallback": true,
    "defaultValueOptionsAreFallback": true,
    "staticCollectionWholeKeyClassifies": true,
    "staticCollectionDomainIsClosed": true,
    "runtimeWholeKeyStaysUnclassified": true,
    "crossModuleMutationStaysUnclassified": true
  }
}
audit-exit=1 (nonzero here is a CONTENT verdict, not an execution failure; JSON parsed)
lane3Sites=16 listSites=9 listLeaves=153
unclassified=3 distinct-sites=3/3 -> ["frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1548","frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1566","frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1651"]
missing-outside-owned=0/2 missing-owned-by-successor=2/2
lane3 observed-families=12 handling-rules=12 | DIAGNOSTICS ONLY lane3Sites=16 lane3Families=12 listLeaves=153
list completeness: families=9 entities-per-family=17 product=153 listLeaves=153
list observed-families=9 handling-rules=9 | DIAGNOSTICS ONLY listSites=9 listLeaves=153
FENCE observed={"AGV|graph-type-map":2,"AGV|graph-relationship-map":1} expected={"AGV|graph-type-map":2,"AGV|graph-relationship-map":1}
```

The audit executable itself exits 1 because the controlled profile deliberately retains those named
unclassified and missing rows. The acceptance wrapper exits 0 after proving their exact identity,
the complete list cross-product, and zero missing leaves outside the owned pair.

## Verification

- `pnpm --dir frontend run type-check` — PASS.
- ESLint and Prettier over the three changed TypeScript callers — PASS with zero warnings.
- `AnalyticResultView.test.tsx` — PASS, 6/6 tests, using Vite's runner loader with an in-memory
  `__dirname` preload so the harness-managed read-only `node_modules` symlink was not modified.
- locale JSON parse and task-base leaf comparison — PASS; 32 additions per empty-states locale,
  one `type.unknown` addition per graph locale, zero removals, and zero rewrites.
- repository pre-commit build — PASS for all three packages on both product commits.
- dynamic audit self-check — PASS; controlled P99-49 acceptance wrapper — PASS.
- `node --test scripts/i18n-dynamic-key-audit.test.mjs` — 22/24 pass. Its two failures are
  task-moment consumer assertions outside this allowlist: one requires the two now-repaired
  AnalyticResultView calls to remain unclassified, and one requires the committed diff to contain
  only the earlier instrument task's two files. Neither failure is an audit self-check or P99-49
  content failure.

## Diff and fallback statement

The production/resource diff contains only the graph cluster, the two AnalyticResultView type labels,
the IconRail tooltip, the two empty-states bundles, and the two graph bundles. `common.json` is
unchanged because both locales already own a nonempty localized `unknown` leaf. The audit reports
`fallbackSites=25` both before and after the repair. The cluster and both analytic calls retain their
second arguments; IconRail retains the dynamic tooltip fallback and gives the localized unknown route
the same item-label fallback. No `defaultValue` line was removed. No test-mode branch, English-result
helper, test file, audit file, or unrelated key family was added.

No acceptance-title test was added because test paths are excluded by this task's fixed file allowlist.
