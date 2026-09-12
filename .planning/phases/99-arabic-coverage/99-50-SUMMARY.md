---
status: complete
---

# P99-50 Summary — repaired bilingual gatekeeper rerun

## Outcome

**GREEN.** The repaired nonliteral gate ran first against the current tree at pre-summary HEAD
`d38ceccda`. Its discriminating self-check passed, all caller populations were exact positive
integers, every enumerated leaf resolved in English and Arabic, and the base-free list completeness
relation passed. Only then did the original gatekeeper battery run; its nonvacuous literal population,
four strict unresolved classes, mask-finder controls and live zero, routing census, and three-row
negative control all passed.

The repaired literal-plus-nonliteral bilingual proof is therefore green in its own gate battery before
any unfinished fallback-deletion lane is reachable. P99-30 is **superseded for dynamic-leaf
authority**. It remains historical evidence for its original literal audit, but the repaired dynamic
self-check and census below alone govern nonliteral leaves.

The obsolete byte-identity claim with P99-49's command is dropped. The sound shared property is the
same declared-fence and base-free completeness **relation**, not identical command text. The frozen
`--expect-list-sites 9`, `--expect-list-leaves 153`, and `--expect-lane3-sites 13` flags are absent.
The measured `listSites=9`, `listLeaves=153`, and `lane3Sites=16` values are diagnostics from this tree,
not pass conditions tied to frozen counts.

## Separate populations

| Population | Result | Fresh evidence |
| --- | --- | --- |
| Repaired nonliteral fallback-bearing census | **GREEN gate; three declared RED fence rows retained** | Self-check PASS; exact nonempty populations `listSites=9`, `listLeaves=153`, `lane3Sites=16`; `missing en=0 ar=0`; list relation `9 x 17 = 153`; no unclassified row outside the P99-49 fence and no declared fence row missing |
| Original literal/options fallback masks and raw literal keys | **GREEN** | `twoArgTotal=1765` (`literalTwoArgTotal=1470`, `optionsDefaultTotal=295`); all strict unresolved counters zero in en and ar; mask controls `4/4`; live dynamic-prefix zero; routing misses zero; negative control exactly `3x MISS=true` |

The original battery's mask-finder remains an auxiliary prefix instrument and is not merged into the
repaired AST census. Its zero is recorded separately below.

## Repaired nonliteral gate

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --self-check && AUDITJSON="/tmp/p9950audit-current.json" || { echo "INSTRUMENT-CANNOT-RUN: setup failed"; exit 3; }; AUDITERR="$AUDITJSON.err"; node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --profile ar04-live --json > "$AUDITJSON" 2>"$AUDITERR"; AUDITST=$?; node -e 'JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"))' "$AUDITJSON" 2>/dev/null || { echo "INSTRUMENT-CANNOT-RUN: the dynamic-key audit produced no parseable JSON (exit $AUDITST), so it did not run to a verdict"; head -3 "$AUDITERR"; exit 3; }; echo "audit-exit=$AUDITST (a GATEKEEPER exits nonzero on CONTENT; JSON parsed, so it reached a verdict)"; AUDITJSON="$AUDITJSON" node -e 'const d=JSON.parse(require("node:fs").readFileSync(process.env.AUDITJSON,"utf8"));const cp=d.callerPopulations||{};let bad=0;if(!Number.isInteger(cp.listSites)||cp.listSites<=0||!Number.isInteger(cp.listLeaves)||cp.listLeaves<=0||!Number.isInteger(cp.lane3Sites)||cp.lane3Sites<=0){console.error("INSTRUMENT-CANNOT-RUN: caller populations are empty or malformed: "+JSON.stringify(cp));process.exit(3)}const AGV="frontend/src/components/relationships/AdvancedGraphVisualization.tsx";const pk=u=>(u.file===AGV?"AGV":u.file)+"|"+(u.proofSite||"none");const FENCE={"AGV|graph-type-map":2,"AGV|graph-relationship-map":1};const seen={};for(const u of (d.unclassified||[])){seen[pk(u)]=(seen[pk(u)]||0)+1}const extra=[];for(const k of Object.keys(seen)){const allow=FENCE[k]||0;if(seen[k]>allow)extra.push(k+" x"+(seen[k]-allow))}const shortfall=[];for(const k of Object.keys(FENCE)){if((seen[k]||0)<FENCE[k])shortfall.push(k+" have "+(seen[k]||0)+" want "+FENCE[k])}console.log("caller populations: listSites="+cp.listSites+" listLeaves="+cp.listLeaves+" lane3Sites="+cp.lane3Sites);console.log("unclassified observed="+JSON.stringify(seen));if(extra.length){console.error("FAIL: unclassified rows OUTSIDE the declared P99-49 fence: "+JSON.stringify(extra));bad=1}if(shortfall.length){console.error("FAIL: the declared fence rows are not all present: "+JSON.stringify(shortfall)+" - the gatekeeper must not pass a tree that lost a definitional row either");bad=1}const co=d.counts||{};console.log("missing en="+co.missingEn+" ar="+co.missingAr);if(co.missingEn!==0||co.missingAr!==0){console.error("FAIL: missing/routing failures remain - en "+co.missingEn+" ar "+co.missingAr);bad=1}const LI=x=>String(x||"").startsWith("list."),entOf=k=>{const q=String(k).split(".");return q.length>=3?q.slice(1,-1).join("."):null};const fe={};for(const row of (d.rows||[])){if(!LI(row.family))continue;const entity=entOf(row.key);if(entity)(fe[row.family]=fe[row.family]||new Set()).add(entity)}const families=Object.keys(fe).sort();if(families.length===0){console.error("INSTRUMENT-CANNOT-RUN: no list rows enumerated, so completeness could not have failed");process.exit(3)}const ref=[...fe[families[0]]].sort().join("|");const ragged=families.filter(f=>[...fe[f]].sort().join("|")!==ref);console.log("list completeness: families="+families.length+" entities="+fe[families[0]].size+" product="+(families.length*fe[families[0]].size)+" listLeaves="+cp.listLeaves+" | DIAGNOSTICS ONLY listSites="+cp.listSites+" lane3Sites="+cp.lane3Sites);if(ragged.length){console.error("FAIL: list families cover different entity sets: "+JSON.stringify(ragged));bad=1}if(families.length*fe[families[0]].size!==cp.listLeaves){console.error("FAIL: families x entities does not equal listLeaves - the cross-product is not whole");bad=1}process.exit(bad)'
```

Verbatim output:

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
audit-exit=1 (a GATEKEEPER exits nonzero on CONTENT; JSON parsed, so it reached a verdict)
caller populations: listSites=9 listLeaves=153 lane3Sites=16
unclassified observed={"AGV|graph-type-map":2,"AGV|graph-relationship-map":1}
missing en=0 ar=0
list completeness: families=9 entities=17 product=153 listLeaves=153 | DIAGNOSTICS ONLY listSites=9 lane3Sites=16
```

Process exit: `0`. The audit executable's status `1` is expected because it reports the declared
unclassified fence; the wrapper reached a parseable content verdict and accepted only the exact
relation. An extra proof-site row fails. A missing declared row also fails. This is not an absolute
`expect-3` assertion, and losing a definitional row cannot make the tree pass.

### Exact nonzero and unclassified rows

Command:

```sh
node -e 'const d=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));for(const r of d.rows||[]){if(r.en!=="ok"||r.ar!=="ok"||r.routeMiss)console.log("NONZERO\t"+r.file+":"+r.line+"\t"+r.key+"\tEN="+r.en+"\tAR="+r.ar+"\troute="+(r.routeMiss?"MISS":"ok")+"\tproof="+r.domainSource)}for(const u of d.unclassified||[]){console.log("UNCLASSIFIED\t"+u.file+":"+u.line+"\tproofSite="+u.proofSite+"\tfamily="+u.family+"\treason="+u.reason)}' /tmp/p9950audit-current.json
```

Verbatim output:

```text
UNCLASSIFIED	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1548	proofSite=graph-type-map	family=lane3.AdvancedGraphVisualization.graphType.1548	reason=AST did not prove closed domain at graph-type-map
UNCLASSIFIED	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1566	proofSite=graph-relationship-map	family=lane3.advancedGraph.relationship.1566	reason=AST did not prove closed domain at graph-relationship-map
UNCLASSIFIED	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1651	proofSite=graph-type-map	family=lane3.AdvancedGraphVisualization.graphType.1651	reason=AST did not prove closed domain at graph-type-map
```

Process exit: `0`. There are no `NONZERO` rows. Each unclassified row is recorded as **RED**, never
silently repaired or described as resolved. They are precisely the definitional rows declared by
P99-49's fence: two `graph-type-map` rows and one `graph-relationship-map` row. They do not make the
gate red because the acceptance property explicitly excludes this declared set while requiring its
complete continued presence.

## Original gatekeeper battery

The compact fail-fast battery ran after the repaired nonliteral wrapper passed.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --json | node -e "let s=[];process.stdin.on(\"data\",d=>s.push(d)).on(\"end\",()=>{const j=JSON.parse(s.join(\"\"));if(!(j.twoArgTotal>0))process.exit(2);if(j.twoArgUnresolved!==0||j.rawKeyUnresolved!==0||j.twoArgUnresolvedAr!==0||j.rawKeyUnresolvedAr!==0)process.exit(3)})" && { MC=$(python3 "$R/scripts/partA_maskfinder.py" "$R" --control 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: maskfinder --control exited $ST"; exit 3; }; NC=$(printf "%s\n" "$MC" | command grep -c "^CONTROL " || true); test "$NC" -ge 4 || { echo "INSTRUMENT-CANNOT-RUN: control printed $NC CONTROL lines, fewer than the four documented polarities, so they cannot be asserted"; exit 3; }; OKC=$(printf "%s\n" "$MC" | command grep -cE "= True \(expect True\)|= False \(expect False\)" || true); test "$OKC" -eq "$NC" || { echo "FAIL: the mask-finder control is NOT discriminating - $((NC-OKC)) of $NC polarities disagree with their stated expectation:"; printf "%s\n" "$MC"; exit 1; }; echo "mask-finder control polarities asserted: $OKC/$NC"; } && { MF=$(python3 "$R/scripts/partA_maskfinder.py" "$R" 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: mask finder did not report the expected summary exited $ST; its printed summary is not a verdict"; printf "%s\n" "$MF" | tail -3; exit 3; }; printf "%s\n" "$MF" | command grep -q "UNRESOLVED dynamic t() key prefixes: 0" || { echo "FAIL: mask finder did not report the expected summary"; exit 1; }; } && { RC=$(node "$R/scripts/resolve-check.mjs" "$R" 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: resolve-check did not report the expected summary exited $ST; its printed summary is not a verdict"; printf "%s\n" "$RC" | tail -3; exit 3; }; printf "%s\n" "$RC" | command grep -q "routings with a miss: 0" || { echo "FAIL: resolve-check did not report the expected summary"; exit 1; }; } && { NT=$(node "$R/scripts/neg-taskcard.mjs" "$R" 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: neg-taskcard.mjs exited $ST; its MISS rows are not a content verdict"; exit 3; }; NM=$(printf "%s\n" "$NT" | command grep -c "MISS=true" || true); test "$NM" -eq 3 || { echo "FAIL: negative control printed $NM MISS=true rows, expected 3"; exit 1; }; }
```

Verbatim output:

```text
mask-finder control polarities asserted: 4/4
```

Process exit: `0`. Fresh component runs below expose every compacted assertion.

### Strict literal/options and raw-key audit

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --json
```

Verbatim output:

```json
{
  "root": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260828-143321-0000000000000062--P99-50",
  "scannedRoot": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260828-143321-0000000000000062--P99-50/frontend/src",
  "scannedFiles": 1532,
  "scope": [],
  "locales": [
    "en",
    "ar"
  ],
  "candidateModel": {
    "resolver": "scripts/lib/i18n-binding.mjs",
    "unprefixed": "declared namespaces only; built-in translation for a bare or undeclared binding",
    "aliases": {
      "translation": "common"
    },
    "fallbackNS": null,
    "defaultNS": null
  },
  "bindingModel": {
    "measuredSyntaxFiles": 665,
    "arrayFirstOnlyFiles": 47,
    "bareUnmatchedFiles": 110,
    "defectiveShapeFiles": 157,
    "canonicalParsedFiles": 664,
    "canonicalStringFiles": 515,
    "canonicalArrayFiles": 46,
    "canonicalBareFiles": 110
  },
  "twoArgTotal": 1765,
  "literalTwoArgTotal": 1470,
  "optionsDefaultTotal": 295,
  "rawKeyTotal": 6789,
  "nonKeyTotal": 0,
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
  "looseModelDelta": {
    "twoArgHiddenSites": 0,
    "literalTwoArgHiddenSites": 0,
    "rawKeyHiddenSites": 0,
    "twoArgRescuedByAlias": 2,
    "rawKeyRescuedByAlias": 0
  },
  "defectiveBindingDelta": {
    "twoArgSitesReclassified": 1,
    "rawKeySitesReclassified": 35
  },
  "sites": [],
  "nonKeys": []
}
```

Process exit: `0`. The literal/options deletion population is affirmatively nonempty and all strict
unresolved classes are zero independently in English and Arabic.

### Mask-finder discriminating control

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

Process exit: `0`.

### Mask-finder live zero

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R"
```

Verbatim output:

```text
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
```

Process exit: `0`.

### Bilingual routing harness

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/resolve-check.mjs" "$R"
```

Verbatim output:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your product with managed localization (AI, CDN, integrations): https://locize.com 💙

===== locale en (fallbackLng disabled, so an en miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

===== locale ar (fallbackLng disabled, so an ar miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

CONTROL negative: t('sourceType.__not_a_real_member__') -> "sourceType.__not_a_real_member__" ; detected-as-miss=true
CONTROL positive: t('sourceType.human_entered') -> "Human entered" ; detected-as-miss=false

214 lookups across 11 routings x 2 locales — routings with a miss: 0
```

Process exit: `0`.

### Three-row negative control

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/neg-taskcard.mjs" "$R"
```

Verbatim output:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your product with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

Process exit: `0`; exactly three rows contain `MISS=true`.

## Scope proof

P99-50 changed only this summary. It did not change a source, test, script, locale, fallback, or
deletion lane.

Command:

```sh
git diff --name-only d86a7865e..HEAD && git diff --name-only
```

Verbatim output before the completion commit:

```text
.planning/phases/99-arabic-coverage/99-50-SUMMARY.md
.planning/phases/99-arabic-coverage/99-50-SUMMARY.md
```
