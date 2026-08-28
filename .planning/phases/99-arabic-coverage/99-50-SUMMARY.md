---
status: blocked
---

# P99-50 Summary — repaired bilingual gatekeeper rerun

## Outcome

**RED; no deletion lane is released.** At HEAD
`71ac6e7a6475db8c5ca1c8f54aaea925175e40d3`, the repaired nonliteral instrument passed its
discriminating self-check and reached a parseable live verdict. Its caller populations were nonempty,
the P99-49 declared fence matched in both directions, and the current list population satisfied the
base-free completeness relation. The live verdict nevertheless found two proven leaves missing from
both locales: `graph:type.individual` and `graph:type.mou` at the `NODE_COLORS` legend call in
`AdvancedGraphVisualization.tsx`.

Those two rows are assigned to P99-55 by `99-55-PLAN.md`. P99-50 did not repair them: this task is
verification-only and its allowlist excludes production and locale changes. In accordance with the
authored fail-fast order, the original literal battery was not reached after the nonliteral gate
failed. Therefore the requested literal-plus-nonliteral conjunction is not green on this tree.

P99-30 is **superseded for dynamic-leaf authority**. Its historical literal audit remains context,
but only the repaired dynamic-key self-check and census below have authority over nonliteral leaves.
The obsolete command-text identity claim with P99-49 is not used; soundness comes from the shared
declared-fence and completeness relations. No frozen caller or leaf count assertion was used. The
measured counts below are diagnostics only.

## Separate populations

| Population | State | Evidence |
| --- | --- | --- |
| Nonliteral fallback-bearing calls | **RED** | Self-check PASS; `listSites=9`, `listLeaves=153`, `lane3Sites=16`; exact P99-49 fence present; list completeness `9 x 17 = 153`; `missing en=2 ar=2` |
| Literal masks and raw literal keys | **NOT REACHED** | The ordered nonliteral predecessor failed, so the original strict audit, mask-finder controls/live zero, routing check, and 3x negative control were not run |

The three unclassified rows are recorded below rather than repaired. They equal the declared P99-49
fence by proof-site multiplicity: two `graph-type-map` rows and one `graph-relationship-map` row, all
in `AdvancedGraphVisualization.tsx`. The checker compares observed keys and multiplicities with the
declared set: an extra row fails, and a missing declared row also fails. It is not an absolute
count-of-three assertion.

## Ordered command evidence

### 1. Discriminating nonliteral self-check

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --self-check
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
EXIT_CODE=0
```

### 2. Parseable live census, declared fence, bilingual zero, and base-free completeness

The temporary output paths are task-specific and outside the repository. They are retained because
the managed runner disallows destructive cleanup commands.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; AUDITJSON="/tmp/p9950audit-live.json"; AUDITERR="/tmp/p9950audit-live.err"; node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --profile ar04-live --json > "$AUDITJSON" 2>"$AUDITERR"; AUDITST=$?; node -e 'JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"))' "$AUDITJSON" 2>/dev/null || { echo "INSTRUMENT-CANNOT-RUN: the dynamic-key audit produced no parseable JSON (exit $AUDITST), so it did not run to a verdict"; head -3 "$AUDITERR"; exit 3; }; echo "audit-exit=$AUDITST (a GATEKEEPER exits nonzero on CONTENT; JSON parsed, so it reached a verdict)"; AUDITJSON="$AUDITJSON" node -e 'const d=JSON.parse(require("node:fs").readFileSync(process.env.AUDITJSON,"utf8"));const cp=d.callerPopulations||{};let bad=0;if(!Number.isInteger(cp.listSites)||cp.listSites<=0||!Number.isInteger(cp.listLeaves)||cp.listLeaves<=0||!Number.isInteger(cp.lane3Sites)||cp.lane3Sites<=0){console.error("INSTRUMENT-CANNOT-RUN: caller populations are empty or malformed: "+JSON.stringify(cp));process.exit(3)}const AGV="frontend/src/components/relationships/AdvancedGraphVisualization.tsx";const pk=u=>(u.file===AGV?"AGV":u.file)+"|"+(u.proofSite||"none");const FENCE={"AGV|graph-type-map":2,"AGV|graph-relationship-map":1};const seen={};for(const u of (d.unclassified||[])){seen[pk(u)]=(seen[pk(u)]||0)+1}const extra=[];for(const k of Object.keys(seen)){const allow=FENCE[k]||0;if(seen[k]>allow)extra.push(k+" x"+(seen[k]-allow))}const shortfall=[];for(const k of Object.keys(FENCE)){if((seen[k]||0)<FENCE[k])shortfall.push(k+" have "+(seen[k]||0)+" want "+FENCE[k])}console.log("caller populations: listSites="+cp.listSites+" listLeaves="+cp.listLeaves+" lane3Sites="+cp.lane3Sites);console.log("unclassified observed="+JSON.stringify(seen));if(extra.length){console.error("FAIL: unclassified rows OUTSIDE the declared P99-49 fence: "+JSON.stringify(extra));bad=1}if(shortfall.length){console.error("FAIL: the declared fence rows are not all present: "+JSON.stringify(shortfall)+" - the gatekeeper must not pass a tree that lost a definitional row either");bad=1}const co=d.counts||{};console.log("missing en="+co.missingEn+" ar="+co.missingAr);if(co.missingEn!==0||co.missingAr!==0){console.error("FAIL: missing/routing failures remain - en "+co.missingEn+" ar "+co.missingAr);bad=1}const LI=x=>String(x||"").startsWith("list."),entOf=k=>{const q=String(k).split(".");return q.length>=3?q.slice(1,-1).join("."):null};const fe={};for(const row of (d.rows||[])){if(!LI(row.family))continue;const entity=entOf(row.key);if(entity)(fe[row.family]=fe[row.family]||new Set()).add(entity)}const families=Object.keys(fe).sort();if(families.length===0){console.error("INSTRUMENT-CANNOT-RUN: no list rows enumerated, so completeness could not have failed");process.exit(3)}const ref=[...fe[families[0]]].sort().join("|");const ragged=families.filter(f=>[...fe[f]].sort().join("|")!==ref);console.log("list completeness: families="+families.length+" entities="+fe[families[0]].size+" product="+(families.length*fe[families[0]].size)+" listLeaves="+cp.listLeaves+" | DIAGNOSTICS ONLY listSites="+cp.listSites+" lane3Sites="+cp.lane3Sites);if(ragged.length){console.error("FAIL: list families cover different entity sets: "+JSON.stringify(ragged));bad=1}if(families.length*fe[families[0]].size!==cp.listLeaves){console.error("FAIL: families x entities does not equal listLeaves - the cross-product is not whole");bad=1}process.exit(bad)'
```

Verbatim output:

```text
audit-exit=1 (a GATEKEEPER exits nonzero on CONTENT; JSON parsed, so it reached a verdict)
caller populations: listSites=9 listLeaves=153 lane3Sites=16
unclassified observed={"AGV|graph-type-map":2,"AGV|graph-relationship-map":1}
missing en=2 ar=2
FAIL: missing/routing failures remain - en 2 ar 2
list completeness: families=9 entities=17 product=153 listLeaves=153 | DIAGNOSTICS ONLY listSites=9 lane3Sites=16
EXIT_CODE=1
```

This is a content RED, not an instrument failure: JSON parsed, all three caller-population fields were
positive integers, and the base-free list relation ran to completion. The two missing rows are the
decisive failure.

### 3. Exact nonzero and unclassified rows

Command:

```sh
node -e 'const d=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));for(const r of d.rows||[]){if(r.en!=="ok"||r.ar!=="ok"||r.routeMiss)console.log(`MISSING\t${r.file}:${r.line}\t${r.key}\tEN=${r.en}\tAR=${r.ar}\troute=${r.routeMiss?"MISS":"ok"}\tproof=${r.domainSource}`)}for(const u of d.unclassified||[]){console.log(`UNCLASSIFIED\t${u.file}:${u.line}\tproofSite=${u.proofSite}\tfamily=${u.family}\treason=${u.reason}`)}' /tmp/p9950audit-live.json
```

Verbatim output:

```text
MISSING	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1859	type.individual	EN=MISS	AR=MISS	route=ok	proof=NODE_COLORS entries slice
MISSING	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1859	type.mou	EN=MISS	AR=MISS	route=ok	proof=NODE_COLORS entries slice
UNCLASSIFIED	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1548	proofSite=graph-type-map	family=lane3.AdvancedGraphVisualization.graphType.1548	reason=AST did not prove closed domain at graph-type-map
UNCLASSIFIED	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1566	proofSite=graph-relationship-map	family=lane3.advancedGraph.relationship.1566	reason=AST did not prove closed domain at graph-relationship-map
UNCLASSIFIED	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1651	proofSite=graph-type-map	family=lane3.AdvancedGraphVisualization.graphType.1651	reason=AST did not prove closed domain at graph-type-map
EXIT_CODE=0
```

The missing rows are RED and remain untouched. The unclassified rows are exactly the definitional
P99-49 fence; there are no rows outside that declared set and no declared row is absent.

## Original literal battery

**NOT REACHED.** The required order puts the repaired nonliteral gate before the original literal
battery, and the live bilingual-zero assertion exited 1. Consequently there is no new P99-50 claim
for literal-mask nonvacuity, strict unresolved zeros, mask-finder discrimination/live zero, routing
zero, or the three-row negative control. P99-30's prior outputs are not copied forward as though they
were fresh.

## Scope proof

The worktree was clean at task start. This summary is the only repository path created by P99-50;
no source, test, script, locale, or deletion path was changed.

Command:

```sh
git status --short
```

Verbatim output:

```text
?? .planning/phases/99-arabic-coverage/99-50-SUMMARY.md
```
