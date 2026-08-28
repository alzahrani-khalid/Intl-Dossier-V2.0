# P99-32 Summary — mask deletion lane 2

## Outcome

**GREEN.** All fallback masks in the lane's 30 source files were deleted. The final production
range is deletion-only: primary translation keys, namespace prefixes, imports, translation hooks,
and every non-`defaultValue` option are byte-identical to task base
`924473ef57f8409a0d84615dad6d3b41d40f2515`. No i18n JSON changed.

This applies D-06, D-20, D-23, D-24, D-28, and D-39: the already resolving population was changed
only after P99-50's bilingual gatekeeper; no key conversion was performed; the zero is controlled;
the population is the mask population only; and no sibling-lane file was touched.

## Re-derived population and manifest reconciliation

The plan-time strict count was 256 at recorded measurement commit `9ffa2b80c`. Re-running the same
cross-line classes at task HEAD found 255: 240 single-quoted positional defaults and 15
literal-key `defaultValue` options. The only drift was in the listed file
`AISuggestionPanel.tsx`, where an upstream P99-49 authoring repair had already removed one mask.

Command (the inline Node counter used the committed strict matcher shapes over the 30 plan paths):

```sh
git cat-file -e 9ffa2b80c^{commit}; node --input-type=module -e '<cross-line per-file counter>' 9ffa2b80c "$SCOPE"
```

Verbatim output:

```text
frontend/src/components/entity-links/AISuggestionPanel.tsx	9ffa2b80c={"literal":17,"options":1,"total":18}	HEAD={"literal":16,"options":1,"total":17}
9ffa2b80c-total=256 HEAD-total=255
```

The syntax-level pass then re-derived the complete in-scope deletion population instead of treating
the strict single-quote subpopulation as exhaustive:

```text
TOTAL	text-defaults=242	defaultValue-options=24	mask-sites=266
```

The 266 sites comprise the strict 255 plus two positional English defaults written with a template
or double quotes and nine dynamic-key `defaultValue` sites in `ListEmptyState.tsx`. The latter were
the nine list call families whose complete 153-leaf domain P99-49/P99-50 proved in both locales.
The 24 object-form sites were removed while retaining interpolation properties such as `count` and
`minutes`. All 30 manifest files had work. The one-count movement stayed inside the manifest; no
manifest site appeared in an outside file, so the stop condition did not fire and scope was not
widened.

## Closing register and controls

Command (the plan's scoped strict audit plus its readable-file and fallback grep, with the strict
register printed):

```sh
node scripts/i18n-audit-strict.mjs "$PWD" --scope "$SCOPE" --json | node -e '<assert and print twoArgTotal zero and rawKeyTotal nonzero>'; grep -rnE "t\([^)]*defaultValue" "${SF[@]}"
```

Verbatim output:

```text
scoped strict audit: scannedFiles=30 twoArgTotal=0 literalTwoArgTotal=0 optionsDefaultTotal=0 rawKeyTotal=454
scoped-files=30 defaultValue-hits=0
```

The syntax-level negative and byte-identity control compared the task-base AST to the final source,
excluding only lookup calls nested inside the fallback expression that was itself deleted:

```text
deletion-only files=30 primary-key/import/hook byte-drifts=0 primary-key-positive-control=496
AST mask sites before=266 after=0
```

Command (the committed range oracle from the plan, with its strict counters printed):

```sh
BR=$(git rev-parse --abbrev-ref HEAD); RUNBR="${BR%--*}"; TASKBASE=$(git merge-base HEAD "$RUNBR"); git diff --name-only "$TASKBASE"..HEAD -- frontend/src/i18n; node scripts/i18n-audit-strict.mjs "$PWD" --scope "$SCOPE" --json; node scripts/neg-taskcard.mjs "$PWD"
```

Verbatim output:

```text
task-base=924473ef57f8409a0d84615dad6d3b41d40f2515 i18n-files-changed-by-this-lane=0
scoped unresolved: twoArg=0 rawKey=0 twoArgAr=0 rawKeyAr=0 rawKeyTotal=454
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
negative-control MISS rows=3
```

The zero unresolved register proves that deleting defaults did not change lookup resolution. Its
`rawKeyTotal=454` and the independent 496-primary-key comparison are positive controls against an
empty or mis-scoped pass. The three `MISS=true` rows prove the phase harness can still report misses.

Frontend type-check command and verbatim output:

```sh
npm --prefix frontend run type-check
```

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Process exit: `0`. The source commit hook also completed ESLint, Prettier, the workspace build, and
its repository checks successfully. Because that hook reformatted affected calls, a follow-up commit
restored the cumulative task range to the required byte-deletion-only shape; the closing oracles above
ran after that restoration.

## Spot diff and scope

Representative deletions:

```diff
-{t('entityLinks.aiSuggestions.title', 'AI-Powered Suggestions')}
+{t('entityLinks.aiSuggestions.title')}

-{t('trigger.estimatedTime', '~{{minutes}} min', { minutes: 3 })}
+{t('trigger.estimatedTime', { minutes: 3 })}

 {t('entityLinks.aiSuggestions.resultsDescription', {
   count: suggestions.length,
-  defaultValue: `Found ${suggestions.length} relevant entities. Click to create link.`,
 })}

-t(`list.${translationKey}.firstTitle`, { defaultValue: t('list.generic.firstTitle') })
+t(`list.${translationKey}.firstTitle`)
```

The lookup keys in this sample — and all 496 surviving primary keys — are byte-untouched. The
three-argument interpolation object remains, and the object-form `count` option remains. The source
logic diff measured 33,409 bytes over 526 changed lines before this summary, below both the lane's
~45,000-byte budget and the engine's 60,000-byte cap. `git diff --check` was empty. The production
range contains exactly the 30 allowed component paths; this summary is the only additional path.
There are zero i18n JSON paths and zero sibling-lane paths in the range.

The fixed allowlist excludes test files, matching the plan's explicit test-file exclusion; no test
artifact was created out of scope. No deletion work is left for a later part. The wholesale dot-to-
colon key conversion remains D-21's no-ship and belongs to Phase 102, not this lane.
