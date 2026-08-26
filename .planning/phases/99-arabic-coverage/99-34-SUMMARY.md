# P99-34 Summary - Mask Deletion Lane 4

## Outcome

GREEN for this lane after repair commit `213d79145`. The scoped strict audit over the 35 allowed
source files reports `twoArgTotal=0`, `optionsDefaultTotal=0`, and `rawKeyTotal=644` as the
positive control that the scope matched real `t()` calls. A separate AST scan for the class the
strict literal matcher does not count also reports zero variable second-argument defaults and zero
object-form `defaultValue` options.

The ten dynamic string defaults named by review were deleted:

- `EnhancedGraphVisualization.tsx`: `t(data.clusterType, data.clusterType)`, two `t(type, type)`
  cluster/legend labels, and the node-type filter `t(type, type)`;
- `SLAPolicyForm.tsx`: `types`, `sensitivity`, `urgency`, `priority`, `roles`, and `channels`
  template-key calls.

`ConflictDialog.tsx` now restricts `tasks-page:field.${field}` to the seven translated
`tasks-page.field` members (`title`, `description`, `assignee_id`, `priority`, `workflow_stage`,
`status`, `sla_deadline`). Unknown `keyof Task` members such as `completed_at` and `completed_by`
are no longer fed to that template key.

No i18n JSON changed. No translation key string, namespace prefix, hook, or import was rewritten.

## Population

The P99-30 gatekeeper summary recorded the repo-wide production manifest as 1,760 literal
two-argument sites plus 313 literal-key object-form `defaultValue` sites. Re-derived against this
lane's base `7427af10e`, the 35 scoped files contained 290 literal second-argument defaults, 18
literal-key object-form `defaultValue` sites, 23 object-form `defaultValue` sites across all key
shapes, and 10 variable second-argument defaults. The final tree reports zero for every class.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; BASE="7427af10e"; node --input-type=module - "$R" "$BASE" <<'NODE'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parse } from '@typescript-eslint/typescript-estree'

const root = process.argv[2]
const base = process.argv[3]
const files = `frontend/src/components/relationships/EnhancedGraphVisualization.tsx,frontend/src/components/relationships/GraphVisualization.tsx,frontend/src/components/relationships/RelationshipNavigator.tsx,frontend/src/components/relationships/TouchOptimizedGraphControls.tsx,frontend/src/components/report-builder/ColumnBuilder.tsx,frontend/src/components/report-builder/ReportBuilder.tsx,frontend/src/components/report-builder/ReportPreview.tsx,frontend/src/components/report-builder/SaveReportDialog.tsx,frontend/src/components/report-builder/SavedReportsList.tsx,frontend/src/components/report-builder/ScheduleReportDialog.tsx,frontend/src/components/responsive/responsive-nav.tsx,frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx,frontend/src/components/sla-monitoring/SLAPolicyForm.tsx,frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx,frontend/src/components/stakeholder-influence/InfluenceNetworkGraph.tsx,frontend/src/components/stakeholder-influence/InfluenceReport.tsx,frontend/src/components/table/AdvancedDataTable.tsx,frontend/src/components/table/DataTable.tsx,frontend/src/components/tags/TagAnalytics.tsx,frontend/src/components/tags/TagHierarchyManager.tsx,frontend/src/components/tags/TagSelector.tsx,frontend/src/components/tasks/AddContributorDialog.tsx,frontend/src/components/tasks/ConflictDialog.tsx,frontend/src/components/tasks/ContributorsList.tsx,frontend/src/components/tasks/DeleteTaskDialog.tsx,frontend/src/components/tasks/TaskCard.tsx,frontend/src/components/tasks/TaskDetail.tsx,frontend/src/components/tasks/TaskEditDialog.tsx,frontend/src/components/tasks/WorkItemLinker.tsx,frontend/src/components/triage-panel/TriagePanel.tsx,frontend/src/components/type-specific-fields/TypeSpecificFields.tsx,frontend/src/components/ui/dialog.tsx,frontend/src/components/ui/pull-to-refresh-indicator.tsx,frontend/src/components/view-preferences/SavedViewsManager.tsx,frontend/src/components/waiting-queue/AgingIndicator.tsx`.split(',')

const visit = (node, cb) => {
  if (!node || typeof node !== 'object') return
  cb(node)
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue
    if (Array.isArray(value)) value.forEach((child) => visit(child, cb))
    else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value, cb)
  }
}
const keyName = (key) => {
  if (key?.type === 'Identifier') return key.name
  if (key?.type === 'Literal') return key.value
  return undefined
}
const hasDefaultValue = (node) =>
  node?.type === 'ObjectExpression' &&
  node.properties?.some((prop) => prop.type === 'Property' && keyName(prop.key) === 'defaultValue')
const isStringLiteral = (node) => node?.type === 'Literal' && typeof node.value === 'string'
const inc = (bucket, file) => {
  bucket.sites++
  bucket.files.add(file)
}
const emptyBucket = () => ({ sites: 0, files: new Set() })
const summarizeBucket = (bucket) => ({ sites: bucket.sites, files: bucket.files.size })
const sourceAt = (file, ref) =>
  ref === 'worktree'
    ? readFileSync(`${root}/${file}`, 'utf8')
    : execFileSync('git', ['show', `${ref}:${file}`], { cwd: root, encoding: 'utf8' })
const scan = (ref) => {
  const literalSecondArg = emptyBucket()
  const literalKeyOptionsDefault = emptyBucket()
  const optionsDefaultAllKeys = emptyBucket()
  const variableSecondArg = emptyBucket()
  const defaultLikeUnion = emptyBucket()
  for (const file of files) {
    const source = sourceAt(file, ref)
    const ast = parse(source, {
      jsx: true,
      loc: true,
      range: true,
      comment: true,
      errorOnUnknownASTType: false,
    })
    visit(ast, (node) => {
      if (node.type !== 'CallExpression') return
      if (node.callee?.type !== 'Identifier' || node.callee.name !== 't') return
      const first = node.arguments?.[0]
      const second = node.arguments?.[1]
      if (!second) return
      if (second.type === 'ObjectExpression') {
        if (hasDefaultValue(second)) {
          inc(optionsDefaultAllKeys, file)
          if (isStringLiteral(first)) inc(literalKeyOptionsDefault, file)
          inc(defaultLikeUnion, file)
        }
        return
      }
      if (isStringLiteral(first) && isStringLiteral(second)) inc(literalSecondArg, file)
      else inc(variableSecondArg, file)
      inc(defaultLikeUnion, file)
    })
  }
  return {
    files: files.length,
    literalSecondArg: summarizeBucket(literalSecondArg),
    literalKeyOptionsDefault: summarizeBucket(literalKeyOptionsDefault),
    optionsDefaultAllKeys: summarizeBucket(optionsDefaultAllKeys),
    variableSecondArg: summarizeBucket(variableSecondArg),
    defaultLikeUnion: summarizeBucket(defaultLikeUnion),
  }
}
console.log(JSON.stringify({ base, before: scan(base), after: scan('worktree') }, null, 2))
NODE
```

Verbatim output:

```json
{
  "base": "7427af10e",
  "before": {
    "files": 35,
    "literalSecondArg": {
      "sites": 290,
      "files": 25
    },
    "literalKeyOptionsDefault": {
      "sites": 18,
      "files": 12
    },
    "optionsDefaultAllKeys": {
      "sites": 23,
      "files": 14
    },
    "variableSecondArg": {
      "sites": 10,
      "files": 2
    },
    "defaultLikeUnion": {
      "sites": 323,
      "files": 35
    }
  },
  "after": {
    "files": 35,
    "literalSecondArg": {
      "sites": 0,
      "files": 0
    },
    "literalKeyOptionsDefault": {
      "sites": 0,
      "files": 0
    },
    "optionsDefaultAllKeys": {
      "sites": 0,
      "files": 0
    },
    "variableSecondArg": {
      "sites": 0,
      "files": 0
    },
    "defaultLikeUnion": {
      "sites": 0,
      "files": 0
    }
  }
}
```

The lane estimate remains about 44,240 logic-diff bytes against the engine's 60,000-byte cap. No
lane file was widened.

## Scoped Zero

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; S="frontend/src/components/relationships/EnhancedGraphVisualization.tsx,frontend/src/components/relationships/GraphVisualization.tsx,frontend/src/components/relationships/RelationshipNavigator.tsx,frontend/src/components/relationships/TouchOptimizedGraphControls.tsx,frontend/src/components/report-builder/ColumnBuilder.tsx,frontend/src/components/report-builder/ReportBuilder.tsx,frontend/src/components/report-builder/ReportPreview.tsx,frontend/src/components/report-builder/SaveReportDialog.tsx,frontend/src/components/report-builder/SavedReportsList.tsx,frontend/src/components/report-builder/ScheduleReportDialog.tsx,frontend/src/components/responsive/responsive-nav.tsx,frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx,frontend/src/components/sla-monitoring/SLAPolicyForm.tsx,frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx,frontend/src/components/stakeholder-influence/InfluenceNetworkGraph.tsx,frontend/src/components/stakeholder-influence/InfluenceReport.tsx,frontend/src/components/table/AdvancedDataTable.tsx,frontend/src/components/table/DataTable.tsx,frontend/src/components/tags/TagAnalytics.tsx,frontend/src/components/tags/TagHierarchyManager.tsx,frontend/src/components/tags/TagSelector.tsx,frontend/src/components/tasks/AddContributorDialog.tsx,frontend/src/components/tasks/ConflictDialog.tsx,frontend/src/components/tasks/ContributorsList.tsx,frontend/src/components/tasks/DeleteTaskDialog.tsx,frontend/src/components/tasks/TaskCard.tsx,frontend/src/components/tasks/TaskDetail.tsx,frontend/src/components/tasks/TaskEditDialog.tsx,frontend/src/components/tasks/WorkItemLinker.tsx,frontend/src/components/triage-panel/TriagePanel.tsx,frontend/src/components/type-specific-fields/TypeSpecificFields.tsx,frontend/src/components/ui/dialog.tsx,frontend/src/components/ui/pull-to-refresh-indicator.tsx,frontend/src/components/view-preferences/SavedViewsManager.tsx,frontend/src/components/waiting-queue/AgingIndicator.tsx"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --scope "$S" --json
```

Verbatim output, key fields:

```json
{
  "scannedFiles": 35,
  "twoArgTotal": 0,
  "literalTwoArgTotal": 0,
  "optionsDefaultTotal": 0,
  "rawKeyTotal": 644,
  "nonKeyTotal": 0,
  "twoArgUnresolved": 0,
  "literalTwoArgUnresolved": 0,
  "optionsDefaultUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "sites": [],
  "nonKeys": []
}
```

Combined lane oracle, with the actual predicate source:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; S="frontend/src/components/relationships/EnhancedGraphVisualization.tsx,frontend/src/components/relationships/GraphVisualization.tsx,frontend/src/components/relationships/RelationshipNavigator.tsx,frontend/src/components/relationships/TouchOptimizedGraphControls.tsx,frontend/src/components/report-builder/ColumnBuilder.tsx,frontend/src/components/report-builder/ReportBuilder.tsx,frontend/src/components/report-builder/ReportPreview.tsx,frontend/src/components/report-builder/SaveReportDialog.tsx,frontend/src/components/report-builder/SavedReportsList.tsx,frontend/src/components/report-builder/ScheduleReportDialog.tsx,frontend/src/components/responsive/responsive-nav.tsx,frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx,frontend/src/components/sla-monitoring/SLAPolicyForm.tsx,frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx,frontend/src/components/stakeholder-influence/InfluenceNetworkGraph.tsx,frontend/src/components/stakeholder-influence/InfluenceReport.tsx,frontend/src/components/table/AdvancedDataTable.tsx,frontend/src/components/table/DataTable.tsx,frontend/src/components/tags/TagAnalytics.tsx,frontend/src/components/tags/TagHierarchyManager.tsx,frontend/src/components/tags/TagSelector.tsx,frontend/src/components/tasks/AddContributorDialog.tsx,frontend/src/components/tasks/ConflictDialog.tsx,frontend/src/components/tasks/ContributorsList.tsx,frontend/src/components/tasks/DeleteTaskDialog.tsx,frontend/src/components/tasks/TaskCard.tsx,frontend/src/components/tasks/TaskDetail.tsx,frontend/src/components/tasks/TaskEditDialog.tsx,frontend/src/components/tasks/WorkItemLinker.tsx,frontend/src/components/triage-panel/TriagePanel.tsx,frontend/src/components/type-specific-fields/TypeSpecificFields.tsx,frontend/src/components/ui/dialog.tsx,frontend/src/components/ui/pull-to-refresh-indicator.tsx,frontend/src/components/view-preferences/SavedViewsManager.tsx,frontend/src/components/waiting-queue/AgingIndicator.tsx"; SCOPE_FILES=(frontend/src/components/relationships/EnhancedGraphVisualization.tsx frontend/src/components/relationships/GraphVisualization.tsx frontend/src/components/relationships/RelationshipNavigator.tsx frontend/src/components/relationships/TouchOptimizedGraphControls.tsx frontend/src/components/report-builder/ColumnBuilder.tsx frontend/src/components/report-builder/ReportBuilder.tsx frontend/src/components/report-builder/ReportPreview.tsx frontend/src/components/report-builder/SaveReportDialog.tsx frontend/src/components/report-builder/SavedReportsList.tsx frontend/src/components/report-builder/ScheduleReportDialog.tsx frontend/src/components/responsive/responsive-nav.tsx frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx frontend/src/components/sla-monitoring/SLAPolicyForm.tsx frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx frontend/src/components/stakeholder-influence/InfluenceNetworkGraph.tsx frontend/src/components/stakeholder-influence/InfluenceReport.tsx frontend/src/components/table/AdvancedDataTable.tsx frontend/src/components/table/DataTable.tsx frontend/src/components/tags/TagAnalytics.tsx frontend/src/components/tags/TagHierarchyManager.tsx frontend/src/components/tags/TagSelector.tsx frontend/src/components/tasks/AddContributorDialog.tsx frontend/src/components/tasks/ConflictDialog.tsx frontend/src/components/tasks/ContributorsList.tsx frontend/src/components/tasks/DeleteTaskDialog.tsx frontend/src/components/tasks/TaskCard.tsx frontend/src/components/tasks/TaskDetail.tsx frontend/src/components/tasks/TaskEditDialog.tsx frontend/src/components/tasks/WorkItemLinker.tsx frontend/src/components/triage-panel/TriagePanel.tsx frontend/src/components/type-specific-fields/TypeSpecificFields.tsx frontend/src/components/ui/dialog.tsx frontend/src/components/ui/pull-to-refresh-indicator.tsx frontend/src/components/view-preferences/SavedViewsManager.tsx frontend/src/components/waiting-queue/AgingIndicator.tsx); node "$R/scripts/i18n-audit-strict.mjs" "$R" --scope "$S" --json | node -e 'let s=[];process.stdin.on("data",d=>s.push(d)).on("end",()=>{const j=JSON.parse(s.join(""));if(j.twoArgTotal!==0){console.error("mask sites survive in this lane: "+j.twoArgTotal);process.exit(1)}if(j.rawKeyTotal===0){console.error("POSITIVE CONTROL FAILED: scope matched no t() sites");process.exit(1)}if(j.twoArgUnresolved!==0||j.rawKeyUnresolved!==0||j.twoArgUnresolvedAr!==0||j.rawKeyUnresolvedAr!==0){console.error("unresolved sites after deletion: "+JSON.stringify({twoArgUnresolved:j.twoArgUnresolved,rawKeyUnresolved:j.rawKeyUnresolved,twoArgUnresolvedAr:j.twoArgUnresolvedAr,rawKeyUnresolvedAr:j.rawKeyUnresolvedAr}));process.exit(1)}})' && ! (command grep -rnE "t\([^)]*defaultValue" "${SCOPE_FILES[@]}" | command grep -v -E "\.test\.|__tests__") && echo EXIT_CODE=0
```

Verbatim output:

```text
EXIT_CODE=0
```

## Dynamic-Key Controls

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
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R"
```

Verbatim output:

```text
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
```

## No JSON, No Unresolved

Command:

```sh
git diff --name-only 7427af10e -- frontend/src/i18n && git diff --name-only HEAD -- frontend/src/i18n
```

Verbatim output:

```text

```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; S="frontend/src/components/relationships/EnhancedGraphVisualization.tsx,frontend/src/components/relationships/GraphVisualization.tsx,frontend/src/components/relationships/RelationshipNavigator.tsx,frontend/src/components/relationships/TouchOptimizedGraphControls.tsx,frontend/src/components/report-builder/ColumnBuilder.tsx,frontend/src/components/report-builder/ReportBuilder.tsx,frontend/src/components/report-builder/ReportPreview.tsx,frontend/src/components/report-builder/SaveReportDialog.tsx,frontend/src/components/report-builder/SavedReportsList.tsx,frontend/src/components/report-builder/ScheduleReportDialog.tsx,frontend/src/components/responsive/responsive-nav.tsx,frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx,frontend/src/components/sla-monitoring/SLAPolicyForm.tsx,frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx,frontend/src/components/stakeholder-influence/InfluenceNetworkGraph.tsx,frontend/src/components/stakeholder-influence/InfluenceReport.tsx,frontend/src/components/table/AdvancedDataTable.tsx,frontend/src/components/table/DataTable.tsx,frontend/src/components/tags/TagAnalytics.tsx,frontend/src/components/tags/TagHierarchyManager.tsx,frontend/src/components/tags/TagSelector.tsx,frontend/src/components/tasks/AddContributorDialog.tsx,frontend/src/components/tasks/ConflictDialog.tsx,frontend/src/components/tasks/ContributorsList.tsx,frontend/src/components/tasks/DeleteTaskDialog.tsx,frontend/src/components/tasks/TaskCard.tsx,frontend/src/components/tasks/TaskDetail.tsx,frontend/src/components/tasks/TaskEditDialog.tsx,frontend/src/components/tasks/WorkItemLinker.tsx,frontend/src/components/triage-panel/TriagePanel.tsx,frontend/src/components/type-specific-fields/TypeSpecificFields.tsx,frontend/src/components/ui/dialog.tsx,frontend/src/components/ui/pull-to-refresh-indicator.tsx,frontend/src/components/view-preferences/SavedViewsManager.tsx,frontend/src/components/waiting-queue/AgingIndicator.tsx"; cd "$R" && test "$(git diff --name-only 7427af10e -- frontend/src/i18n | wc -l | tr -d ' ')" -eq 0 && test "$(git diff --name-only HEAD -- frontend/src/i18n | wc -l | tr -d ' ')" -eq 0 && node "$R/scripts/i18n-audit-strict.mjs" "$R" --scope "$S" --json | node -e 'let s=[];process.stdin.on("data",d=>s.push(d)).on("end",()=>{const j=JSON.parse(s.join(""));if(j.twoArgUnresolved!==0||j.rawKeyUnresolved!==0||j.twoArgUnresolvedAr!==0||j.rawKeyUnresolvedAr!==0){console.error("the drop created unresolved sites",JSON.stringify(j).slice(0,300));process.exit(1)}})' && test "$(node "$R/scripts/neg-taskcard.mjs" "$R" | command grep -c "MISS=true")" -eq 3 && echo EXIT_CODE=0
```

Verbatim output:

```text
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/neg-taskcard.mjs" "$R"
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

## Diff Evidence

Spot diff sample, variable second-argument class:

```diff
-                        {t(`types.${type}`, type)}
+                        {t(`types.${type}`)}
```

Spot diff sample, literal default class from the original lane deletion:

```diff
-        {t('typeSpecific.engagement.title', 'Additional Information')}
+        {t('typeSpecific.engagement.title')}
```

Spot diff sample, object-form fallback option class from the original lane deletion:

```diff
-            {t(`assignments:priority.${task.priority}`, { defaultValue: task.priority })}
+            {t(`assignments:priority.${task.priority}`)}
```

`ConflictDialog.tsx` was the review-directed domain restriction: it adds `TASK_CONFLICT_FIELD_KEYS`
and filters `Object.keys(localChanges)` before rendering `t(\`tasks-page:field.${field}\`)`. The
template key bytes are unchanged.

## Type Check

Command:

```sh
pnpm --dir frontend type-check
```

Verbatim output:

```text
> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260826-202610-0000000000000045--P99-34/frontend
> tsc --noEmit
```

Command:

```sh
git diff --check
```

Verbatim output:

```text

```

## Left For Later

Nothing is left for another part of this lane. Work outside the 35 source files, i18n JSON,
rendered re-proofs, raw-key repairs, and wholesale dot-to-colon conversion remain outside P99-34.
