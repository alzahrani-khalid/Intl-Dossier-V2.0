---
status: complete
---

# P99-36 Summary — mask deletion lane 6, part 1

## Outcome

GREEN. The four-file manifest reconciled exactly with the plan's RED population: 80 fallback
masks, all in the literal class and none in the object-form `defaultValue*` class. All 80 literal
defaults were deleted. The closing strict audit reports `twoArgTotal=0`, its positive control sees
112 raw-key calls, and every English and Arabic unresolved counter remains zero.

This is the D-06/D-20/D-23/D-24/D-28/D-39 deletion-only change. No key, namespace prefix,
`useTranslation` hook, or import module changed; no conversion was performed. No i18n JSON or test
file changed. The production commit is `a1249da6a` (`fix(i18n): remove lane 6 page fallback masks`).

## Re-derived population at task base

The scoped strict audit was run before editing:

```sh
node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/pages/Organizations.tsx,frontend/src/pages/TaskDetailPage.tsx,frontend/src/pages/TicketDetail.tsx,frontend/src/pages/WaitingQueue.tsx" --json
```

Verbatim compacted counters:

```text
scannedFiles=4
twoArgTotal=80
literalTwoArgTotal=80
optionsDefaultTotal=0
rawKeyTotal=32
twoArgUnresolved=0
twoArgUnresolvedEn=0
twoArgUnresolvedAr=0
rawKeyUnresolved=0
rawKeyUnresolvedEn=0
rawKeyUnresolvedAr=0
```

The same command was then run once per file. Verbatim output:

```text
frontend/src/pages/Organizations.tsx total=28 literal=28 options=0 raw=0 unresolvedEN=0 unresolvedAR=0
frontend/src/pages/TaskDetailPage.tsx total=5 literal=5 options=0 raw=0 unresolvedEN=0 unresolvedAR=0
frontend/src/pages/TicketDetail.tsx total=26 literal=26 options=0 raw=0 unresolvedEN=0 unresolvedAR=0
frontend/src/pages/WaitingQueue.tsx total=21 literal=21 options=0 raw=32 unresolvedEN=0 unresolvedAR=0
```

The sum is exactly the plan's 80-site manifest (28 + 5 + 26 + 21). The separate object-form
population is affirmatively zero in this slice. The initial multi-line fallback-option scan printed
no hits and exited 0:

```sh
node scripts/i18n-fallback-option-scan.mjs frontend/src/pages/Organizations.tsx frontend/src/pages/TaskDetailPage.tsx frontend/src/pages/TicketDetail.tsx frontend/src/pages/WaitingQueue.tsx
```

No manifest drift or out-of-lane site was discovered, so the scope was not widened.

## Closing oracles

The first command oracle from `99-36-PLAN.md` was run verbatim after the production commit. Output:

```text
scoped-files=4 defaultValue-hits=0
```

The strict counters were printed separately so both the zero and positive control are visible:

```text
scannedFiles=4 twoArgTotal=0 literalTwoArgTotal=0 optionsDefaultTotal=0 rawKeyTotal=112
twoArgUnresolved=0 rawKeyUnresolved=0 twoArgUnresolvedEn=0 twoArgUnresolvedAr=0 rawKeyUnresolvedEn=0 rawKeyUnresolvedAr=0
```

The second command oracle from `99-36-PLAN.md` was run verbatim. Output:

```text
task-base=f8c6a16d8628857f8cf7d821e629f92a36fff277 i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

The negative-control producer itself remained discriminating. Verbatim output:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

Thus the strict zero is controlled by four readable scoped files, 112 live raw-key calls, and three
known negative rows. A missing key is no longer hidden by any literal/object fallback in this slice.

## Key, binding, and diff identity

A TypeScript AST comparison of task base to the production commit compared every `t()` call in
order, every first-argument expression byte-for-byte, every import module, and every
`useTranslation` argument. It also regenerated each current file by applying only the literal-mask
deletion to task-base content and Prettier-formatting the result. Verbatim output:

```text
frontend/src/pages/Organizations.tsx: literalMasksRemoved=28 tCalls=31
frontend/src/pages/TaskDetailPage.tsx: literalMasksRemoved=5 tCalls=5
frontend/src/pages/TicketDetail.tsx: literalMasksRemoved=26 tCalls=31
frontend/src/pages/WaitingQueue.tsx: literalMasksRemoved=21 tCalls=59
taskBase=f8c6a16d8628857f8cf7d821e629f92a36fff277
productionFiles=4 literalMasksRemoved=80 preservedNonMaskCalls=46 tCalls=126 unchangedKeyExpressions=126 unchangedImportModules=63 unchangedTranslationHooks=4 mechanicalDeletionPlusPrettierIdentity=4/4
```

The 46 non-mask calls include interpolation options and the previously verified dynamic-value
overloads; they are byte-equivalent after whitespace normalization. No interpolation option was
mistaken for a fallback.

Spot-diff sample (`git diff --unified=1 "$TASKBASE"..HEAD --
frontend/src/pages/Organizations.tsx`):

```diff
             <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
-              {t('organizations:title', 'Organizations & delegations')}
+              {t('organizations:title')}
             </h1>
-            <p className="text-base text-muted-foreground">
-              {t(
-                'organizations:subtitle',
-                'Track hierarchies, delegation scopes, and project ownership across every partner organization.',
-              )}
-            </p>
+            <p className="text-base text-muted-foreground">{t('organizations:subtitle')}</p>
```

The sample shows the first-argument keys unchanged while only the English defaults disappear; the
second hunk's surrounding line collapse is Prettier's deterministic result. The full AST/mechanical
identity check above proves the same property across all 80 deletions.

## Scope, budget, and verification

Before adding this summary, the committed task-range scope and size commands printed:

```text
task-base=f8c6a16d8628857f8cf7d821e629f92a36fff277 head=a1249da6a9842042abfc12d689583731d2a4a851
frontend/src/pages/Organizations.tsx
frontend/src/pages/TaskDetailPage.tsx
frontend/src/pages/TicketDetail.tsx
frontend/src/pages/WaitingQueue.tsx
i18n-json-files=0
unified-zero-diff-bytes=17898
 frontend/src/pages/Organizations.tsx  | 80 ++++++++++++-----------------------
 frontend/src/pages/TaskDetailPage.tsx | 12 +++---
 frontend/src/pages/TicketDetail.tsx   | 63 ++++++++++++---------------
 frontend/src/pages/WaitingQueue.tsx   | 49 +++++++++------------
 4 files changed, 80 insertions(+), 124 deletions(-)
```

The 17,898-byte zero-context production diff is below the lane's ~34,309-byte apportioned budget
and the 45,000-byte task ceiling.

Frontend type-check command and verbatim output:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Process exit: 0. The production commit hook also ran scoped ESLint and Prettier, then the repository
`turbo run build`; all three packages built successfully and the commit completed. This part owns no
companion test, and no test file was edited. The authoritative lane-closure resolution recorded in
the plan found no companion importing these sources; the local test-path search likewise found no
test for these page sources that asserts a deleted literal.

## Deferred work

P99-59, P99-60, and P99-62 own the file-disjoint sibling parts of lane 6; P99-59 was already in this
task's base. The wholesale working dot-form-to-colon conversion remains D-21's Phase 102 scope.
Downstream rendered re-proofs remain with P99-39 through P99-41. This part changed none of those
surfaces.
