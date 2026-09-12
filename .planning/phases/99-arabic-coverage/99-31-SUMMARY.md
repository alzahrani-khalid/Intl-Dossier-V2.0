---
status: complete
---

# P99-31 Summary — mask deletion lane 1, part 1

## Outcome

**GREEN.** The live pre-drop population reconciled exactly to the gatekeeper manifest: 94 masks in
the nine allowlisted production files, split into 91 literal-second-argument sites and three
object-form fallback-text sites. All 94 were deleted. The post-drop strict audit reports zero masks,
zero unresolved English or Arabic lookups, and `rawKeyTotal=95` as the nonempty scope control.

No translation key, namespace prefix, import, hook, or i18n JSON changed. The owned companion test
passed unchanged after the deletion, so its conditional repair trigger did not fire and
`frontend/tests/component/BriefGenerationPanel.manual.test.tsx` remains byte-identical to the task
base.

## Population re-derivation

The scoped strict audit was run before editing. Verbatim output:

```text
{
  "scannedFiles": 9,
  "twoArgTotal": 94,
  "literalTwoArgTotal": 91,
  "optionsDefaultTotal": 3,
  "rawKeyTotal": 1,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0
}
frontend/src/components/ai/ChatInput.tsx:90: t('sendMessage', { defaultValue: 'Send message' })
frontend/src/components/ai/EntityLinkSuggestions.tsx:401: t('common:actions.approve', { defaultValue: 'Approve' })
frontend/src/components/ai/EntityLinkSuggestions.tsx:415: t('common:actions.reject', { defaultValue: 'Reject' })
```

The same matcher was re-run per file against task base
`706eccd404b769841293701637490d2718444d3b` and the committed tree. It also compared the ordered
literal key sequence and every import/useTranslation anchor byte-for-byte. Verbatim output:

```text
frontend/src/components/ai/BriefGenerationPanel.tsx	base=35+0=35	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/ai/BriefViewer.tsx	base=15+0=15	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/ai/ChatInput.tsx	base=2+1=3	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/ai/EntityLinkSuggestions.tsx	base=13+2=15	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/comments/CommentForm.tsx	base=7+0=7	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/comments/CommentItem.tsx	base=9+0=9	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/comments/CommentList.tsx	base=5+0=5	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/comments/MentionInput.tsx	base=4+0=4	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
frontend/src/components/comments/ReactionPicker.tsx	base=1+0=1	live=0	keys=IDENTICAL	imports-hooks=IDENTICAL
TOTAL base=94 live=0
companion-test=BYTE-UNCHANGED
```

This reconciles all 94 manifest sites within the lane. No mask belonging to this part was found in
an out-of-scope file.

## Closing strict registers

Command: the exact first command oracle from `99-31-PLAN.md` (scoped strict audit, nine readable-file
control, and multi-line fallback-option scan).

Verbatim output:

```text
scoped-files=9 defaultValue-hits=0
```

The full scoped counters were printed separately so the zero and its positive control are visible.
Verbatim output:

```text
scannedFiles=9 twoArgTotal=0 literalTwoArgTotal=0 optionsDefaultTotal=0 rawKeyTotal=95
twoArgUnresolved=0 rawKeyUnresolved=0 twoArgUnresolvedAr=0 rawKeyUnresolvedAr=0
```

Command: the exact second command oracle from `99-31-PLAN.md` (derived task base, i18n diff, scoped
bilingual unresolved check, and phase negative control).

Verbatim output:

```text
task-base=706eccd404b769841293701637490d2718444d3b i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

The zero registers are controlled: nine files were scanned, 95 remaining literal raw-key calls were
seen, and the independent negative control still emitted exactly three known misses.

## Production diff spot-check

`git diff --unified=1 706eccd404b769841293701637490d2718444d3b..8066488fe` was inspected in full.
Representative hunks:

```diff
-                    {t('showReplies', 'Show {{count}} replies', { count: comment.reply_count })}
+                    {t('showReplies', { count: comment.reply_count })}

-        aria-label={t('sendMessage', { defaultValue: 'Send message' })}
+        aria-label={t('sendMessage')}

-            <CardTitle className="text-lg">{t('title', 'Generate AI Brief')}</CardTitle>
+            <CardTitle className="text-lg">{t('title')}</CardTitle>
```

The first hunk proves interpolation options remain; the other two cover literal and object-form
fallback deletion. The full key/import/hook identity register above proves no binding was rewritten.
The production commit is `8066488fe` (`fix(i18n): remove lane 1 translation masks`).

## Companion test and type-check

The initial ordinary Vitest CLI attempt could not reach a test verdict because Vite tried to write
its bundled config under the harness-managed read-only `node_modules` symlink:

```text
Error: EPERM: operation not permitted, open '.../frontend/node_modules/.vite-temp/vitest.config.ts.timestamp-....mjs'
```

The symlink was not changed. The test was then run through Vitest's programmatic API with
`config:false`, the same jsdom setup, the repository aliases, and `/tmp/p99-31-vite-cache`.
Verbatim verdict:

```text
Test Files  1 passed (1)
     Tests  3 passed (3)
  Duration  1.60s (transform 426ms, setup 566ms, import 396ms, tests 356ms, environment 225ms)
```

Because all three existing assertions still ran and passed without a bare key or obsolete literal,
the companion was correctly left byte-unchanged.

Command: `npm --prefix frontend run type-check`

Verbatim output:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Process exit: `0`. The production commit hook additionally completed its scoped ESLint/Prettier
steps and the repository build successfully.

## Scope and deferred work

Only the nine production files and this summary changed. No i18n JSON or companion test changed.
P99-57 and P99-58 own the two file-disjoint sibling parts of lane 1. The wholesale working
dot-form-to-colon conversion remains D-21's Phase 102 scope. Consolidated rendered re-proofs remain
with the named downstream P99-39 through P99-41 tasks; this part did not pre-empt them.
