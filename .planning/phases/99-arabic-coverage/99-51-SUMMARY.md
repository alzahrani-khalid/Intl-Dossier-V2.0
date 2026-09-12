---
status: complete
---

# P99-51 Summary — satisfiable dynamic-key proof instrument

## Result

The `ar04-pre-repair` profile now ignores the working tree and reads the immutable committed corpus at `scripts/fixtures/dynamic-key-audit/pre-repair`. The accepted pre-repair quantities moved together: list sites 9, list leaves 153, lane3 sites 13, list missing-both 32, and cluster missing-both 8.

The ruled membership-plus-unknown proof is recognised for any profile caller, including a caller with no legend. TypeScript symbol identity and lexical scope resolve the membership receiver, the key passed to `t()`, the namespace, and the translator factory. Direct imports, aliased imports, re-exports, destructuring, shadowing, out-of-scope references, and reassignment are distinguished. A non-const initializer is followed only when its symbol has no intervening write. Parser positions are computed from the AST; the instrument contains no corpus-output marker reader.

No assertion was weakened. No production caller, locale bundle, or other task plan changed. No production caller, locale bundle, or profile consumer changed. The task changed only `scripts/i18n-dynamic-key-audit.mjs`, `scripts/i18n-dynamic-key-audit.test.mjs`, and this SUMMARY; the fixture corpus was inherited unchanged from P99-52.

Vitest acceptance-title verification command:

```sh
pnpm exec vitest run scripts/i18n-dynamic-key-audit.test.mjs
```

Complete stdout and stderr, verbatim:

```text

 RUN  v4.1.7 /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260827-173704-0000000000000056--P99-51


 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  21:17:20
   Duration  3.59s (transform 88ms, setup 57ms, import 188ms, tests 3.09s, environment 200ms)
```

Exit status: 0.

## Full binding-form matrix

All 28 cells are expressible; each row names the committed negative/control fixture pair (the control uses the same name with `-control`). There are no `NA:` cells and therefore no not-expressible reasons.

```tsv
receiver	direct	receiver-direct
receiver	aliased-import	receiver-aliased-import
receiver	re-export	receiver-re-export
receiver	destructured	receiver-destructured
receiver	shadowed	shadow-receiver
receiver	out-of-scope	out-of-scope-receiver
receiver	reassigned	reassigned-receiver
key	direct	key-direct
key	aliased-import	key-aliased-import
key	re-export	key-re-export
key	destructured	key-destructured
key	shadowed	shadow-key
key	out-of-scope	out-of-scope-key
key	reassigned	reassigned-key
namespace	direct	namespace-direct
namespace	aliased-import	namespace-aliased-import
namespace	re-export	namespace-re-export
namespace	destructured	namespace-destructured
namespace	shadowed	shadow-namespace
namespace	out-of-scope	out-of-scope-namespace
namespace	reassigned	reassigned-namespace
translator	direct	translator-direct
translator	aliased-import	translator-aliased-import
translator	re-export	translator-re-export
translator	destructured	translator-destructured
translator	shadowed	shadow-translator
translator	out-of-scope	out-of-scope-translator
translator	reassigned	reassigned-translator
```

## P99-48 preservation and structural oracle

Command:

```sh
( PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node --test "$R/scripts/i18n-dynamic-key-audit.test.mjs" ) && ( PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --self-check && node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --profile ar04-pre-repair --expect-list-sites 9 --expect-list-leaves 153 --expect-lane3-sites 13 --expect-list-missing-both 32 --expect-cluster-missing-both 8 ) && ( PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; AUD_FILE="$R/scripts/i18n-dynamic-key-audit.mjs" AUD_MK=closedDomain AUD_PROOF=provesClosedDomain node -e "const ts=require(\"typescript\"),fs=require(\"fs\");const F=process.env.AUD_FILE,MK=process.env.AUD_MK,PR=process.env.AUD_PROOF;const sf=ts.createSourceFile(F,fs.readFileSync(F,\"utf8\"),ts.ScriptTarget.Latest,true);let n=0;const bad=[];const walk=y=>{if(ts.isCallExpression(y)&&y.expression.getText(sf)===MK){n++;const a=y.arguments[2];if(!(a&&ts.isCallExpression(a)&&a.expression.getText(sf)===PR))bad.push(ts.getLineAndCharacterOfPosition(sf,y.getStart()).line+1)}ts.forEachChild(y,walk)};walk(sf);console.log(\"closed-domain sites=\"+n+\" unproven=\"+bad.length+(bad.length?\" at line(s) \"+bad.join(\",\"):\"\"));if(n<1){console.error(\"FAIL-VACUOUS: zero \"+MK+\"() sites - the check would prove nothing\");process.exit(2)}if(bad.length){console.error(\"FAIL-UNPROVEN: a closed domain is claimed without a proof call in the proof position\");process.exit(3)}console.log(\"STRUCTURAL OK\")" ) && ( PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; A="$R/scripts/i18n-dynamic-key-audit.mjs"; N=$(node "$A" "$R" --profile ar04-pre-repair --rows | command grep -c "^CLOSED" || true); Z=$(node "$A" "$R" --profile ar04-pre-repair --rows --force-unproven | command grep -c "^CLOSED" || true); T=$(node "$A" "$R" --profile ar04-pre-repair --rows | command grep -cE "^(CLOSED|UNCLASSIFIED)" || true); FT=$(node "$A" "$R" --profile ar04-pre-repair --rows --force-unproven | command grep -cE "^(CLOSED|UNCLASSIFIED)" || true); echo "closed=$N forcedClosed=$Z rows=$T forcedRows=$FT"; test "$N" -ge 1 && test "$T" -ge 1 && test "$Z" -eq 0 && test "$T" -eq "$FT" )
```

Complete stdout and stderr, verbatim:

```text
✔ The pre-repair tree has an independently tested, non-vacuous bilingual census that exposes the exact dynamic-key defects instead of reporting their prefixes green. (23.810833ms)
✔ The production entry point is scripts/i18n-dynamic-key-audit.mjs. It parses TypeScript call expressions rather than source lines, separates interpolation-only option objects from fallback-bearing calls, resolves explicit and hook-bound namespaces with fallbackLng disabled, and checks complete LEAF keys in en and ar. Every fallback-bearing nonliteral call in the two ruled profiles is either assigned a closed domain or reported unclassified; an empty domain, prefix-only object, missing file, malformed bundle, or unknown call shape is a failure, never zero. A domain counts as CLOSED only when the AST proves membership in the production constant that defines the closed dossier-card display set AND an explicit type.unknown branch exists in the same caller; a domain inferred from expression text, from whichever keys happen to exist in JSON, or from a fallback argument is rejected and the call is reported unclassified, which fails closed. (834.60725ms)
✔ the instrument tests exercise both locales and both polarities: a resolved leaf passes, an existing prefix with a missing leaf fails, en-only and ar-only leaves each fail, an unclassified nonliteral call fails, and interpolation-only options are not mislabeled as English defaults; and, for EVERY code path that can return a non-empty closed domain, a fail-closed negative case that reaches THAT path and requires unclassified when proof is absent. The set of such paths is derived mechanically from the source of the instrument itself - every closedDomain() call site - never from a list of shapes written in this plan, so the coverage cannot be satisfied by handling only the shapes someone thought to name (986.947041ms)
✔ the controlled live census discriminates before repair and positively reproduces both review findings: 32 missing list leaves out of the complete 153-leaf caller cross-product (17 EntityType values x 9 call families) and all eight canonical display-type leaves missed by the unprefixed graph cluster lookup; the exact 9 plus 13 caller populations are nonempty and no family is excluded to reach the expected count (143.059542ms)
✔ the instrument must construct every non-empty closed domain through exactly one helper, closedDomain(key, domain, proof), whose third argument is a direct provesClosedDomain(...) call that returns true ONLY when the AST establishes closure and false otherwise, in which case the call is reported unclassified; --force-unproven forces that predicate false and changes nothing else, and --rows prints CLOSED and UNCLASSIFIED tab-separated rows. This gate is mechanical - not a judge item and not a count, because a judge read one branch of two and the counts hold whether a domain is proven or merely assumed. Its structural leg reads the source of the instrument itself and fails closed on any closed-domain construction lacking a proof call in the proof position, and fails closed again on zero such sites so it can never pass vacuously. Its drill leg then forces every proof to fail and requires the closed-domain row count to reach exactly zero while the total row count is conserved, which is what proves the predicate actually gates behaviour on every path rather than being an unread argument, with the unforced run required to carry at least one closed row so neither leg can pass on an empty census (289.121042ms)
✔ The SUMMARY records the executable commands and complete rows, including every unclassified row. The task changes only the instrument, its tests, and its SUMMARY: it cannot make its own live result green by editing a production caller, a locale bundle, or a profile consumer. (3.009166ms)
✔ P99-48 and P99-49 acceptance are simultaneously satisfiable, and a correct production repair is one the instrument can recognise. (3.524208ms)
✔ The ar04-pre-repair profile reads an IMMUTABLE committed fixture corpus under scripts/fixtures/dynamic-key-audit, never the working tree. A pre-repair assertion read from a tree that later work is required to change is self-invalidating by construction, which is what made P99-49 unsatisfiable. The corpus reproduces the already-accepted pre-repair quantities exactly - list sites 9, list leaves 153, lane3 sites 13, list missing-both 32, cluster missing-both 8 - so every assertion P99-48 already passed still passes unchanged against the corpus. (3.152875ms)
✔ The proof recogniser accepts the ruled shape GENERALLY and resolves EVERY identifier its proof depends on - the membership receiver, the key expression passed to t(), the namespace, and the translator binding - by AST BINDING AND SCOPE, never by identifier TEXT. It is NOT a special case for any named file or for a legend-shaped Object.entries map. The current recogniser routes graph type calls through a legend proof that requires a NODE_COLORS entries-map and a semantic-colors import, so a caller carrying the exactly correct membership-plus-unknown shape in a file with no legend cannot be seen as proven - a correct repair the instrument is structurally unable to recognise. A recogniser keyed to a SITE reproduces that defect at the next site; a recogniser keyed to identifier TEXT reproduces it at the next IDENTIFIER. Two independent reviews of the rejected candidate found ONE defect at TWO levels - the membership receiver, then, once that was fixed, the key - and receiver and key are not the last two levels, because namespace and translator binding resolve the same way. A grader that accepts a SHADOWED or OUT-OF-SCOPE binding as proof lets a P99-49 repair pass without proving membership in the production closed constant, which inverts the phase by approving the grader defect in order to unblock the graded. THE ADVERSARIAL FIXTURES THE ORACLES NAME ARE SPECIFIED BY THIS PLAN AND ARE NOT CHOSEN BY THE IMPLEMENTER: the rejected candidate passed its own positive fixture oracle on the first attempt while failing review twice for fixture-overfit, because RULING-P99-251 gave this one task both the recogniser and the corpus that grades it, and a text-resolving recogniser passes a self-chosen corpus by construction. FOUR PROPERTIES, each from a material review finding on the rejected candidate, all required: (a) BINDING IDENTITY, NOT TEXT - the translator factory callee resolves by binding, INCLUDING ALIASED IMPORTS, and a locally defined function of the same name is REJECTED rather than accepted; (b) IMMUTABILITY OR PROVEN ABSENCE OF INTERVENING WRITES - a proof may NOT follow a declaration initializer without establishing the binding is const or is unwritten between declaration and use, because a guarded initializer followed by an unguarded reassignment currently reads as proven; (c) NO SOURCE-CONTROLLED OUTPUT - the instrument reports the parser position, and NO comment, marker or other content of the corpus may influence what it reports; fixtures needing stable locations achieve them structurally. This is the gravest of the four because it is the GRADED MATERIAL DECIDING WHAT THE GRADER REPORTS; (d) VERBATIM EVIDENCE - the SUMMARY carries the command complete stdout and stderr, never synthesized status lines standing in for it. THE BINDING-FORM SET COMES FROM THE LANGUAGE, NEVER FROM THE RESOLVER (RULING-P99-274). It is exactly: direct, aliased import, re-export, destructured, shadowed, out-of-scope, reassigned. A form set derived from the resolver own code is CIRCULAR - a resolver that does not model aliasing distinguishes no aliasing forms, and the two forms the reviews exploited are precisely the two such a derivation cannot produce. A test set derived from the artifact under test can only test what the artifact already thought of. The separating question is whether the artifact could change what belongs on the list: for language constructs it cannot, which is what makes this an external closed set and not another enumeration by whoever is writing the code. (6.277292ms)
✔ every proof P99-48 already passed still passes, byte-identical and unweakened: its instrument test suite, its pre-repair census with the exact accepted quantities, and its structural plus drill oracle whose forced-unproven leg still drives closed-domain rows to exactly zero while conserving the total row count (4.169417ms)
✔ the generality of the recogniser is drilled in both polarities against committed fixtures rather than asserted: a caller carrying the ruled membership-plus-unknown shape in a file with NO legend classifies CLOSED and produces no unclassified row, and the same caller with the proof absent classifies UNCLASSIFIED, so the recogniser cannot pass by special-casing a file and cannot pass vacuously; and for each of the four identifiers the proof resolves - receiver, key, namespace and translator binding - a fixture in which that identifier is SHADOWED or OUT OF SCOPE yields zero closed-domain rows and at least one unclassified row, while its control twin, identical but for the shadowing, yields at least one closed-domain row and zero unclassified. The control twin is load-bearing rather than decorative: a negative fixture that reads UNCLASSIFIED because it failed to parse or matched nothing proves nothing at all, so the PAIR and not the negative alone is the discriminator. The floor of the shadowed-key fixture is the reviewed case - a guarded key variable that is shadowed or out of scope, beside a later UNGUARDED key variable built as a template literal over the runtime type and passed to t() - and satisfying only that one case is instance-naming rather than the mechanism this requires. The drill is a COMPLETE MATRIX rather than a sample: every one of the four resolved identifiers is crossed with every one of the seven LANGUAGE binding forms, and all twenty-eight cells are ACCOUNTED FOR in a committed matrix file - each cell naming either its fixture pair or an explicit not-expressible reason - so a cell can be argued inapplicable in the open but can never be silently omitted, which is how the previous corpus came to contain zero aliased imports and zero reassignments. Two further legs cover the classes that acceptance passed straight through while review caught them: rewriting every audit-line marker in the corpus to a different number MUST leave the reported output byte-identical, which can only hold if no corpus content influences what the instrument reports; and every non-empty line of the recorded command own stdout MUST appear in the SUMMARY, which is what verbatim means and what a synthesized status line fails (353.255167ms)
✔ The task diff contains only the instrument, its tests, the fixture corpus and this SUMMARY. No production caller, no locale bundle, and no other task plan is edited. The SUMMARY records every executable command with verbatim output, and states which pre-repair quantities moved from the working tree to the corpus. (320.193875ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3120.33475
{
  "selfCheck": "PASS",
  "checks": {
    "resolvedLeafPasses": true,
    "existingPrefixMissingLeafFails": true,
    "enOnlyFailsArabic": true,
    "arOnlyFailsEnglish": true,
    "unknownCallShapeFails": true,
    "interpolationOnlyOptionsNotFallback": true,
    "defaultValueOptionsAreFallback": true
  }
}
dynamic i18n audit: profile=ar04-pre-repair listSites=9 listLeaves=153 lane3Sites=13
rows=242 listMissingBoth=32 clusterMissingBoth=8 unclassified=10
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.document.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.dossier.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.engagement.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.commitment.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.organization.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.country.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.forum.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.event.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.task.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.person.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.position.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.mou.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.topic.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.working_group.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.elected_official.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.work_item.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:26	list.generic.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.document.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.dossier.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.engagement.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.commitment.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.organization.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.country.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.forum.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.event.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.task.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.person.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.position.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.mou.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.topic.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.working_group.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.elected_official.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.work_item.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:27	list.generic.title	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.document.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.dossier.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.engagement.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.commitment.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.organization.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.country.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.forum.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.event.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.task.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.person.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.position.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.mou.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.topic.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.working_group.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.elected_official.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.work_item.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:28	list.generic.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.document.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.dossier.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.engagement.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.commitment.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.organization.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.country.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.forum.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.event.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.task.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.person.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.position.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.mou.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.topic.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.working_group.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.elected_official.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.work_item.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:29	list.generic.description	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.document.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.dossier.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.engagement.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.commitment.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.organization.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.country.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.forum.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.event.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.task.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.person.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.position.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.mou.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.topic.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.working_group.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.elected_official.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.work_item.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:30	list.generic.hint	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.document.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.dossier.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.engagement.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.commitment.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.organization.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.country.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.forum.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.event.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.task.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.person.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.position.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.mou.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.topic.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.working_group.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.elected_official.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.work_item.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:31	list.generic.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.document.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.dossier.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.engagement.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.commitment.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.organization.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.country.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.forum.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.event.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.task.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.person.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.position.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.mou.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.topic.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.working_group.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.elected_official.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.work_item.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:32	list.generic.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.document.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.dossier.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.engagement.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.commitment.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.organization.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.country.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.forum.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.event.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.task.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.person.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.position.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.mou.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.topic.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.working_group.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.elected_official.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.work_item.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:33	list.generic.create	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.document.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.dossier.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.engagement.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.commitment.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.organization.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.country.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.forum.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.event.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.task.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.person.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.position.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.mou.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.topic.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.working_group.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.elected_official.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.work_item.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:34	list.generic.import	EN=ok	AR=ok	ns=empty-states
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:8	quickActions.analyzeForumMembership	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:8	quickActions.analyzeSharedCommittees	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:8	quickActions.analyzeEngagementChains	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:8	quickActions.analyzeShortestPath	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:3	sensitivity.public	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:3	sensitivity.internal	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:3	sensitivity.restricted	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:3	sensitivity.confidential	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:3	sensitivity.unknown	EN=ok	AR=ok	ns=list-pages
lane3	lane3.engagementsList.filterPill	frontend/src/components/list-page/EngagementsList.tsx:3	filter.all	EN=ok	AR=ok	ns=engagements
lane3	lane3.engagementsList.filterPill	frontend/src/components/list-page/EngagementsList.tsx:3	filter.meeting	EN=ok	AR=ok	ns=engagements
lane3	lane3.engagementsList.filterPill	frontend/src/components/list-page/EngagementsList.tsx:3	filter.travel	EN=ok	AR=ok	ns=engagements
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:4	navigation.dashboard	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:4	navigation.dossiers	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:4	navigation.workflow	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:4	navigation.calendar	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:4	navigation.reports	EN=ok	AR=ok	ns=common
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	country	EN=ok	AR=ok	required=type.country	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	organization	EN=ok	AR=ok	required=type.organization	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	forum	EN=ok	AR=ok	required=type.forum	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	engagement	EN=ok	AR=ok	required=type.engagement	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	topic	EN=MISS	AR=MISS	required=type.topic	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	working_group	EN=MISS	AR=MISS	required=type.working_group	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	person	EN=MISS	AR=MISS	required=type.person	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	elected_official	EN=MISS	AR=MISS	required=type.elected_official	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	type.elected_official	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.member_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.participates_in	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.cooperates_with	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.bilateral_relation	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.partnership	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.parent_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.subsidiary_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.related_to	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.represents	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.hosted_by	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.sponsored_by	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.involves	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.discusses	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.participant_in	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.observer_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.affiliate_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.successor_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	relationship.predecessor_of	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	type.elected_official	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.16	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:16	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.16	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:16	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.16	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:16	type.individual	EN=MISS	AR=MISS	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.16	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:16	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.16	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:16	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.16	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:16	type.mou	EN=MISS	AR=MISS	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:3	analyze.template.forumMembership	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:3	analyze.template.sharedCommittees	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:3	analyze.template.engagementChain	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:3	analyze.template.shortestPath	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:3	analyze.count.membership	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:3	analyze.count.intersection	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:3	analyze.count.chain	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:3	analyze.count.path	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	type.elected_official	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	type.elected_official	EN=ok	AR=ok	ns=graph
UNCLASSIFIED	unclassified.translator-binding	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:10	unsupported useTranslation translator binding: tQs	tQs(groupKey, dossierTypeLabels[group.type]?.en || group.type)	ns=quickswitcher
UNCLASSIFIED	unclassified.translator-binding	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:12	unsupported useTranslation translator binding: tCommon	tCommon(page.label, page.id)	ns=common
UNCLASSIFIED	unclassified.translator-binding	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:14	unsupported useTranslation translator binding: tCommon	tCommon(page.label, page.id)	ns=common
UNCLASSIFIED	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:4	AST did not prove closed domain at icon-rail-map	t(item.tooltipKey, item.id.charAt(0).toUpperCase() + item.id.slice(1))	ns=common
UNCLASSIFIED	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:7	AST did not prove closed domain at graph-cluster-route	t(data.clusterType, data.clusterType)	ns=graph
UNCLASSIFIED	lane3.AdvancedGraphVisualization.graphType.10	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:10	AST did not prove closed domain at graph-type-map	t(`type.${type}`, type)	ns=graph
UNCLASSIFIED	lane3.advancedGraph.relationship.12	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:12	AST did not prove closed domain at graph-relationship-map	t(`relationship.${type}`, type.replace(/_/g, ' '))	ns=graph
UNCLASSIFIED	lane3.AdvancedGraphVisualization.graphType.14	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:14	AST did not prove closed domain at graph-type-map	t(`type.${type}`, type)	ns=graph
UNCLASSIFIED	lane3.AnalyticResultView.graphType.6	frontend/src/components/relationships/AnalyticResultView.tsx:6	AST did not prove closed domain at graph-type-map	t(`type.${node.type}`, node.type)	ns=graph
UNCLASSIFIED	lane3.AnalyticResultView.graphType.8	frontend/src/components/relationships/AnalyticResultView.tsx:8	AST did not prove closed domain at graph-type-map	t(`type.${node.type}`, node.type)	ns=graph
closed-domain sites=10 unproven=0
STRUCTURAL OK
closed=15 forcedClosed=0 rows=25 forcedRows=25
```

Exit status: 0.

## Recorded command-own output

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; A="$R/scripts/i18n-dynamic-key-audit.mjs"; F="$R/scripts/fixtures/dynamic-key-audit"; node "$A" "$F/generality-membership" --profile lane3 --rows
```

Complete stdout and stderr, verbatim:

```text
CLOSED	graph-cluster-route	lane3.ruled-membership-route	caller.tsx:11	t(key, runtimeType)	ns=graph
```

Exit status: 0.

## Generality, complete matrix, marker invariance, and verbatim-evidence oracle

The planned command's two cleanup operations were omitted from this recorded execution because the managed command runner rejects force-removal syntax; both temporary targets were created by `mktemp`, and cleanup is silent, so this changes neither the exercised checks nor the captured output. The harness runs the plan command verbatim.

Command actually executed:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; A="$R/scripts/i18n-dynamic-key-audit.mjs"; F="$R/scripts/fixtures/dynamic-key-audit"; C=$(node "$A" "$F/generality-membership" --profile lane3 --rows | command grep -c "^CLOSED" || true); U=$(node "$A" "$F/generality-noproof" --profile lane3 --rows | command grep -c "^UNCLASSIFIED" || true); X=$(node "$A" "$F/generality-membership" --profile lane3 --rows | command grep -c "^UNCLASSIFIED" || true); echo "membership-closed=$C noproof-unclassified=$U membership-unclassified=$X"; test "$C" -ge 1 && test "$U" -ge 1 && test "$X" -eq 0 || exit 1; rc=0; for I in receiver key namespace translator; do S="$F/shadow-$I"; T="$F/shadow-$I-control"; SC=$(node "$A" "$S" --profile lane3 --rows | command grep -c "^CLOSED" || true); SU=$(node "$A" "$S" --profile lane3 --rows | command grep -c "^UNCLASSIFIED" || true); TC=$(node "$A" "$T" --profile lane3 --rows | command grep -c "^CLOSED" || true); TU=$(node "$A" "$T" --profile lane3 --rows | command grep -c "^UNCLASSIFIED" || true); echo "$I shadowClosed=$SC shadowUnclassified=$SU controlClosed=$TC controlUnclassified=$TU"; test "$SC" -eq 0 || rc=1; test "$SU" -ge 1 || rc=1; test "$TC" -ge 1 || rc=1; test "$TU" -eq 0 || rc=1; done; M="$F/FORM-MATRIX.tsv"; test -f "$M" || { echo "FAIL: no FORM-MATRIX.tsv"; exit 1; }; ROWS=$(command grep -c . "$M" || true); test "$ROWS" -eq 28 || { echo "FAIL: matrix has $ROWS rows, need 28 (4 identifiers x 7 language forms)"; exit 1; }; for FORM in direct aliased-import re-export destructured shadowed out-of-scope reassigned; do for I in receiver key namespace translator; do CELL=$(awk -F"\t" -v i="$I" -v f="$FORM" '$1==i && $2==f {print $3}' "$M"); test -n "$CELL" || { echo "FAIL: matrix cell missing for $I/$FORM"; rc=1; continue; }; case "$CELL" in NA:*) echo "$I/$FORM NOT-EXPRESSIBLE ${CELL#NA:}"; continue;; esac; S="$F/$CELL"; T="$F/$CELL-control"; SC=$(node "$A" "$S" --profile lane3 --rows | command grep -c "^CLOSED" || true); SU=$(node "$A" "$S" --profile lane3 --rows | command grep -c "^UNCLASSIFIED" || true); TC=$(node "$A" "$T" --profile lane3 --rows | command grep -c "^CLOSED" || true); TU=$(node "$A" "$T" --profile lane3 --rows | command grep -c "^UNCLASSIFIED" || true); echo "$I/$FORM neg(closed=$SC unclassified=$SU) ctl(closed=$TC unclassified=$TU)"; test "$SC" -eq 0 || rc=1; test "$SU" -ge 1 || rc=1; test "$TC" -ge 1 || rc=1; test "$TU" -eq 0 || rc=1; done; done; W=$(mktemp -d); cp -R "$F" "$W/fx"; command grep -rl "@audit-line" "$W/fx" 2>/dev/null | while read -r f; do perl -pi -e "s/\@audit-line\s+\d+/\@audit-line 99999/g" "$f"; done; BEFORE=$(node "$A" "$F/generality-membership" --profile lane3 --rows); AFTER=$(node "$A" "$W/fx/generality-membership" --profile lane3 --rows); test "$BEFORE" = "$AFTER" || { echo "FAIL: rewriting audit-line markers CHANGED reported output - corpus content controls the instrument"; rc=1; }; echo "marker-rewrite-invariant=$([ "$BEFORE" = "$AFTER" ] && echo yes || echo NO)"; SUM="$R/.planning/phases/99-arabic-coverage/99-51-SUMMARY.md"; test -f "$SUM" || { echo "FAIL: no SUMMARY"; exit 1; }; OUT=$(mktemp); node "$A" "$R" --self-check > "$OUT" 2>&1; node "$A" "$F/generality-membership" --profile lane3 --rows >> "$OUT" 2>&1; MISSING=$(command grep -Fxv -f "$SUM" "$OUT" | command grep -c . || true); echo "summary-verbatim-missing-lines=$MISSING"; test "$MISSING" -eq 0 || rc=1; test "$rc" -eq 0
```

Complete stdout and stderr, verbatim:

```text
membership-closed=1 noproof-unclassified=1 membership-unclassified=0
receiver shadowClosed=0 shadowUnclassified=1 controlClosed=1 controlUnclassified=0
key shadowClosed=0 shadowUnclassified=1 controlClosed=1 controlUnclassified=0
namespace shadowClosed=0 shadowUnclassified=1 controlClosed=1 controlUnclassified=0
translator shadowClosed=0 shadowUnclassified=1 controlClosed=1 controlUnclassified=0
receiver/direct neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
key/direct neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
namespace/direct neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
translator/direct neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
receiver/aliased-import neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
key/aliased-import neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
namespace/aliased-import neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
translator/aliased-import neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
receiver/re-export neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
key/re-export neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
namespace/re-export neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
translator/re-export neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
receiver/destructured neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
key/destructured neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
namespace/destructured neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
translator/destructured neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
receiver/shadowed neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
key/shadowed neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
namespace/shadowed neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
translator/shadowed neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
receiver/out-of-scope neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
key/out-of-scope neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
namespace/out-of-scope neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
translator/out-of-scope neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
receiver/reassigned neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
key/reassigned neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
namespace/reassigned neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
translator/reassigned neg(closed=0 unclassified=1) ctl(closed=1 unclassified=0)
marker-rewrite-invariant=yes
summary-verbatim-missing-lines=0
```

Exit status: 0.
