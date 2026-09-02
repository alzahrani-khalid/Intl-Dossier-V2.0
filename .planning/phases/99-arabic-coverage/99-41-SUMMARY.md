---
phase: 99-arabic-coverage
plan: 41
status: complete
head: a03e199e57c0e2743a81f5f00b291e86e684252e
recorded_at_local: 2026-09-02T23:50:20+03:00
recorded_at_utc: 2026-09-02T20:50:20Z
---

# P99-41 Summary — residue register and operator checkpoint

## Outcome

**P99-41 is complete.** Two things closed it that were open at the previous attempt.

**The D-38 checkpoint is answered, and the answer is the operator's.** It is not this worker's
reading of a commit — the prior attempt was right to refuse `2a79b80da` as a sign-off, and that
refusal stands. The authority is `RULING-P99-544` in `.tickmarkr/overseer/DECISIONS.md` together
with the run journal's `task-approved P99-41` event at `2026-09-02T18:47:49.376Z`, whose reason
carries the answer and instructs that it be recorded verbatim here. It is transcribed below, in the
lane's SUMMARY contract shape — *the checkpoint answer verbatim with who gave it*.

**Both rendered specs ran to completion in this attempt and both are green.** The earlier exit-90
refusals were a `codex` sandbox that could not read the birth identity of a foreign port-5001
holder; that safety refusal was correct and is retained below unchanged. This attempt runs in a
sandbox that can read process birth identity, port 5173 was unheld, and the guard let both
invocations through: `99-ar02-dates` 8/8 and `99-ar03-leak` 10/10 — 18/18 — with the wrapper
publishing verdict `clean` for each, at `b2b91836b`, which contains the position-heading repair. No
row in the register now leans on a P99-40 green. The only commits between that HEAD and this
record's are doc-only, proven below, so nothing those specs exercise moved underneath them.

The static battery was also re-executed in this attempt and every member's output was compared
byte-for-byte against the block transcribed here by a comparator that carries the battery's exact
population by name — thirteen sections, fourteen pairs — and passes a pair only on identical output
**and** exit 0: **14/14** at this record's own HEAD, with the comparator drilled against a dropped
section, an identical-output nonzero exit, and a doctored output. The `neg-taskcard` negative control
is gated by a text assertion on its printed rows rather than by its exit code, which that script
returns as 0 unconditionally by design. There are no authorized bounds and nothing is recorded NOT
CONSTRUCTED.

## Acceptance items

| Acceptance item | Record |
| --- | --- |
| The operator has seen the Arabic session read as Arabic and said so in writing — or named what must change while the reversal window is still open. | **ANSWERED.** `it reads as arabic` — the operator, Khalid Alzahrani, 2026-09-02, against the six D-38 surfaces captured live under `?lng=ar` plus the D-19 list. Recorded by the overseer in `RULING-P99-544`; approved in the run journal at 18:47:49.376Z. Both branches were exercised: the same session named the position `<h1>` defect, repaired at `2a79b80da`. |
| The operator has seen the Arabic session read as Arabic and said so in writing — or named what must change while the reversal window is still open. | **ANSWERED.** Duplicated because the compiled acceptance list carries this criterion twice; same answer, same authority, transcribed once below. |
| The register carries the honored-evidence table for the five decisions the overseer waived as citation-truths on machine evidence (D-01, D-03, D-36, D-37, D-39) VERBATIM — that verbatim carry is the waiver's stated condition | Preserved byte-for-byte in `99-VERIFICATION.md`; the twelve-line block hashes `9c0b4e3f4e511a13c78a2b22976abdbe` before and after this attempt's rewrite. |
| The human checkpoint presents: the 404, the intake queue, the search chips, a dated surface, the /activity relative-time surface and the position banner rendered under ar, plus the D-19 tie-break list from the nav-title lane — and the phase does not close until the operator answers | **SATISFIED.** The presentation the operator consumed was captured by the operator/overseer under `?lng=ar` with the D-19 list beside it (artifact URL in the approve reason); and every one of those surfaces additionally carries a rendered `ar` leg that PASSED in this attempt — `UI99-C5`, `UI99-C6`, `UI99-C8`, `UI99-C1C2C4` ×3, `UI99-C3`, and `UI99-C7` in all three banner states. The phase did not close before the answer. |
| criterion 2 closes on the RENDERED spec run by THIS gate — ONE spec path (D-09: two paths with one match silently drop the rest and exit 0), file existence asserted, the count hardcoded at 8 — RED at HEAD | **GREEN, run here.** `collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8`, then Playwright `expected: 8, unexpected: 0, flaky: 0, skipped: 0`, wrapper verdict `clean`, exit 0. |
| The evidence register is honest: every green names its instrument run fresh in this task, every zero shows its control, every bound is quoted with the overseer ruling that authorised it, no criterion leans on a green produced before the repairs it grades, and no leg is recorded NOT CONSTRUCTED. | Every green here is an instrument re-executed in this attempt; every zero has its control; authorized bounds are zero, so no bound is quoted; the P99-40 AR-03 green is named lineage and used for nothing; no leg is NOT CONSTRUCTED and none is left unrun. |

## Fresh battery results

| Instrument | Control | P99-41 live result | Exit |
| --- | --- | --- | --- |
| strict audit | self-check PASS; fixture `twoArgTotal=10`, `rawKeyTotal=2`, all 18 predicates true | 1,532 production files; `twoArgTotal=0`; `rawKeyTotal=8518`; every EN/AR unresolved counter 0 | 0 |
| maskfinder | four true/false polarities agree with their expectations | unresolved dynamic prefixes 0 | 0 |
| resolver | TaskCard negative control **text-asserted** — exactly 3 `MISS=true`, 0 `MISS=false`, 1 resolving contrast row, and the assertion itself drilled against a doctored copy; live checker also prints positive and negative controls | 214 bilingual lookups over 11 routings; misses 0 | 0 |
| nav/title | planted mismatch caught; positive agreement preserved | 28 adjudicated; 25 agreements; 3 value-locked escalations; defect counters 0 | 0 |
| glossary census | planted illegal senses caught and legal senses retained | Fresh `--census`: 17,022 Arabic leaves in 129 files; ruled 1,657; allowlisted 292; unclassified 0 | 0 |
| date-format checker | dead exemption importers 0 beside 29 live-control importers | 1,533 files; unexcused sites 0; named debt 0 | 0 |
| AR-02 rendered | three `en control` legs beside the three `ar` dated legs; paired `en`/`ar` relative-time legs | 8 collected = 8 expected; 8 passed; verdict `clean` | 0 |
| AR-03 rendered | `en control` legs for 404 and intake queue; all three banner states collected | 10 collected = 10 expected; 10 passed; verdict `clean` | 0 |
| completion contract | nonempty phase population | 62/62 SUMMARY files carry `status: complete` | 0 |

### Battery re-execution ledger for this attempt

Every static member below was re-executed in this attempt and its combined stdout/stderr compared
byte-for-byte against the block transcribed beside it. The previous revision asserted
`12 / 12 IDENTICAL` without showing the comparison that produced it; that omission is repaired here
— the comparator, its output, and the drills proving it can report each kind of failure it gates are
all recorded. It re-executes the recorded `~~~sh` blocks themselves, so it grades exactly what a
reader sees, and it reads this file rather than a helper on disk.

Two hazards are worth naming, because earlier drafts of this comparator walked into both. First,
quoting the script inside the very file it parses put a second copy of the section heading into
that file, and a naive first-occurrence lookup then sliced the region at the script's own source
text; the version below anchors on newline-delimited headings and asserts each occurs exactly once.
Second, the previous revision's comparator was unsound in two ways a reviewer caught: it accepted
any parse of thirteen or more pairs, so a silently dropped pair still graded green, and it counted a
pair as passed on output equality alone, so a command that reproduced its recorded text but exited
nonzero still graded green. The version below carries the battery's exact population — thirteen
sections and fourteen command/output pairs, each named — and refuses to grade anything else; and a
pair passes only when its output is identical **and** its exit status is 0.

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 - "$R" "${TKR_DOC:-$R/.planning/phases/99-arabic-coverage/99-41-SUMMARY.md}" <<'PY'
import re,subprocess,sys,hashlib,difflib
ROOT,DOC=sys.argv[1],sys.argv[2]
s=open(DOC,encoding='utf-8').read()
# anchor on real headings (newline-delimited): this script's own source is quoted inside the file
def head(h):
    assert s.count('\n## '+h+'\n')==1, h
    return s.index('\n## '+h+'\n')
region=s[head('Fresh evidence commands and verbatim output'):head('Criterion-2 gate command: the rendered run')]
# the battery's exact population, by section identity: 13 sections, 14 command/output pairs
EXPECTED=[('Strict audit self-check',1),('Strict audit live JSON',1),('Dynamic-prefix maskfinder control',1),
 ('Dynamic-prefix maskfinder live',1),('TaskCard negative control — gated by a text assertion, not by its exit code',2),
 ('Resolution check live',1),('Nav/title planted control',1),('Nav/title live',1),('Glossary census planted control',1),
 ('Glossary census live, with the full fresh census',1),('Date-format exemption/importer controls',1),
 ('Date-format checker live',1),('Completion contract with the human gate closed',1)]
PAIR=re.compile(r'Command:\n\n~~~sh\n(.*?)\n~~~\n\nVerbatim stdout/stderr:\n\n~~~text\n(.*?)\n~~~',re.S)
found=[(sec.split('\n',1)[0],PAIR.findall(sec)) for sec in re.split(r'\n### ',region)[1:]]
shape=[(n,len(ps)) for n,ps in found]
if shape!=EXPECTED:
    print('POPULATION MISMATCH — refusing to grade a battery that is not the recorded one')
    for l in difflib.unified_diff(['%d × %s'%(c,n) for n,c in EXPECTED],['%d × %s'%(c,n) for n,c in shape],'expected','found',lineterm='',n=0): print('   '+l)
    sys.exit(2)
pairs=[(n,c,o) for n,ps in found for c,o in ps]
assert len(pairs)==14 and sum(c for _,c in EXPECTED)==14
print('sections=%d/13 command/output pairs=%d/14 — population matches by name'%(len(shape),len(pairs)))
ok=0
for i,(sec,cmd,exp) in enumerate(pairs,1):
    p=subprocess.run(['zsh','-c',cmd],cwd=ROOT,capture_output=True,text=True)
    got=(p.stdout+p.stderr).rstrip('\n'); exp=exp.rstrip('\n'); same=got==exp; zero=p.returncode==0
    passed=same and zero; ok+=passed
    print('%s pair %2d exit=%d %s md5=%s :: %s'%('PASS' if passed else 'FAIL',i,p.returncode,'IDENTICAL' if same else 'DIFFERS  ',hashlib.md5(got.encode()).hexdigest()[:8],sec[:44]))
    if not same:
        for l in list(difflib.unified_diff(exp.split('\n'),got.split('\n'),'recorded','rerun',lineterm=''))[:8]: print('   '+l)
    if not zero: print('   exit status %d is not 0 — identical output does not rescue a nonzero exit'%p.returncode)
print('passed (identical output AND exit 0): %d / 14'%ok)
sys.exit(0 if ok==14 else 1)
PY
TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
sections=13/13 command/output pairs=14/14 — population matches by name
PASS pair  1 exit=0 IDENTICAL md5=a8c3af4e :: Strict audit self-check
PASS pair  2 exit=0 IDENTICAL md5=5a7ed01a :: Strict audit live JSON
PASS pair  3 exit=0 IDENTICAL md5=ee571f22 :: Dynamic-prefix maskfinder control
PASS pair  4 exit=0 IDENTICAL md5=82629919 :: Dynamic-prefix maskfinder live
PASS pair  5 exit=0 IDENTICAL md5=30273a13 :: TaskCard negative control — gated by a text 
PASS pair  6 exit=0 IDENTICAL md5=3e37c814 :: TaskCard negative control — gated by a text 
PASS pair  7 exit=0 IDENTICAL md5=5cd5f339 :: Resolution check live
PASS pair  8 exit=0 IDENTICAL md5=d19db23b :: Nav/title planted control
PASS pair  9 exit=0 IDENTICAL md5=dd1aa563 :: Nav/title live
PASS pair 10 exit=0 IDENTICAL md5=a50b6523 :: Glossary census planted control
PASS pair 11 exit=0 IDENTICAL md5=bfb5380a :: Glossary census live, with the full fresh ce
PASS pair 12 exit=0 IDENTICAL md5=cd693063 :: Date-format exemption/importer controls
PASS pair 13 exit=0 IDENTICAL md5=c4852984 :: Date-format checker live
PASS pair 14 exit=0 IDENTICAL md5=9855ba8f :: Completion contract with the human gate clos
passed (identical output AND exit 0): 14 / 14
EXIT=0
~~~

**The comparator can fire, on each of the three causes it gates.** Each drill re-points the same
recorded command through `TKR_DOC` at a doctored copy of this file written outside the worktree; the
battery commands themselves still run in this worktree, so only the doctoring differs.

**Drill 1 — a dropped pair.** The copy omits the `Nav/title planted control` section entirely, so
the parse yields thirteen pairs. The previous `>= 13` guard accepted exactly that; this one refuses
before running a single command:

~~~text
POPULATION MISMATCH — refusing to grade a battery that is not the recorded one
   --- expected
   +++ found
   @@ -7 +6,0 @@
   -1 × Nav/title planted control
EXIT=2
~~~

**Drill 2 — identical output, nonzero exit.** The copy's maskfinder-live command ends in `exit 1`
instead of `exit "$TKR_ST"`, so it prints exactly the recorded text — including its own `EXIT=0`
line — and then exits 1. The previous comparator counted that identical; this one fails the pair:

~~~text
sections=13/13 command/output pairs=14/14 — population matches by name
PASS pair  1 exit=0 IDENTICAL md5=a8c3af4e :: Strict audit self-check
PASS pair  2 exit=0 IDENTICAL md5=5a7ed01a :: Strict audit live JSON
PASS pair  3 exit=0 IDENTICAL md5=ee571f22 :: Dynamic-prefix maskfinder control
FAIL pair  4 exit=1 IDENTICAL md5=82629919 :: Dynamic-prefix maskfinder live
   exit status 1 is not 0 — identical output does not rescue a nonzero exit
PASS pair  5 exit=0 IDENTICAL md5=30273a13 :: TaskCard negative control — gated by a text 
PASS pair  6 exit=0 IDENTICAL md5=3e37c814 :: TaskCard negative control — gated by a text 
PASS pair  7 exit=0 IDENTICAL md5=5cd5f339 :: Resolution check live
PASS pair  8 exit=0 IDENTICAL md5=d19db23b :: Nav/title planted control
PASS pair  9 exit=0 IDENTICAL md5=dd1aa563 :: Nav/title live
PASS pair 10 exit=0 IDENTICAL md5=a50b6523 :: Glossary census planted control
PASS pair 11 exit=0 IDENTICAL md5=bfb5380a :: Glossary census live, with the full fresh ce
PASS pair 12 exit=0 IDENTICAL md5=cd693063 :: Date-format exemption/importer controls
PASS pair 13 exit=0 IDENTICAL md5=c4852984 :: Date-format checker live
PASS pair 14 exit=0 IDENTICAL md5=9855ba8f :: Completion contract with the human gate clos
passed (identical output AND exit 0): 13 / 14
EXIT=1
~~~

**Drill 3 — a doctored recorded output.** The copy's transcribed maskfinder line reads `7 total`
instead of `0 total`; the comparator names the pair, prints the diff, and exits 1:

~~~text
sections=13/13 command/output pairs=14/14 — population matches by name
PASS pair  1 exit=0 IDENTICAL md5=a8c3af4e :: Strict audit self-check
PASS pair  2 exit=0 IDENTICAL md5=5a7ed01a :: Strict audit live JSON
PASS pair  3 exit=0 IDENTICAL md5=ee571f22 :: Dynamic-prefix maskfinder control
FAIL pair  4 exit=0 DIFFERS   md5=82629919 :: Dynamic-prefix maskfinder live
   --- recorded
   +++ rerun
   @@ -1,2 +1,2 @@
   -UNRESOLVED dynamic t() key prefixes: 7 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
   +UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
    EXIT=0
PASS pair  5 exit=0 IDENTICAL md5=30273a13 :: TaskCard negative control — gated by a text 
PASS pair  6 exit=0 IDENTICAL md5=3e37c814 :: TaskCard negative control — gated by a text 
PASS pair  7 exit=0 IDENTICAL md5=5cd5f339 :: Resolution check live
PASS pair  8 exit=0 IDENTICAL md5=d19db23b :: Nav/title planted control
PASS pair  9 exit=0 IDENTICAL md5=dd1aa563 :: Nav/title live
PASS pair 10 exit=0 IDENTICAL md5=a50b6523 :: Glossary census planted control
PASS pair 11 exit=0 IDENTICAL md5=bfb5380a :: Glossary census live, with the full fresh ce
PASS pair 12 exit=0 IDENTICAL md5=cd693063 :: Date-format exemption/importer controls
PASS pair 13 exit=0 IDENTICAL md5=c4852984 :: Date-format checker live
PASS pair 14 exit=0 IDENTICAL md5=9855ba8f :: Completion contract with the human gate clos
passed (identical output AND exit 0): 13 / 14
EXIT=1
~~~

So the blocks below are this attempt's output as much as the previous attempt's; they are not greens
carried forward from an earlier wave. `neg-taskcard` contributes **two** pairs — its text assertion
and that assertion's own drill — which is why the population is 14 rather than the 12 claimed
before, and the comparator now holds that population by name rather than by a lower bound.

## Fresh evidence commands and verbatim output

This record applies `RULING-P99-538`: every command used as criterion evidence is
included with unedited output. Read/navigation commands are named in the ledger, because embedding
the files they read was the unbounded form that ruling superseded.

### Strict audit self-check

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/i18n-audit-strict.mjs "$PWD" --self-check; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
{
  "selfCheck": "PASS",
  "passed": true,
  "fixture": {
    "twoArgTotal": 10,
    "rawKeyTotal": 2,
    "sourcePolicy": {
      "production": {
        "path": "self-check/FeaturePanel.tsx",
        "included": true
      },
      "colocatedTest": {
        "path": "self-check/FeaturePanel.test.tsx",
        "included": false
      },
      "testsDirectory": {
        "path": "self-check/__tests__/FeaturePanel.tsx",
        "included": false
      }
    },
    "bindingShapes": {
      "self-check/string-binding.tsx": {
        "string": 1,
        "array": 0,
        "bare": 0,
        "dynamic": 0
      },
      "self-check/array-binding.tsx": {
        "string": 0,
        "array": 1,
        "bare": 0,
        "dynamic": 0
      },
      "self-check/bare-binding.tsx": {
        "string": 1,
        "array": 0,
        "bare": 1,
        "dynamic": 0
      }
    },
    "defectiveBindingDelta": {
      "twoArgSitesReclassified": 2,
      "rawKeySitesReclassified": 0
    }
  },
  "checks": {
    "productionSourceIncluded": true,
    "testFileExcluded": true,
    "testsDirectoryExcluded": true,
    "oneLinePositiveControl": true,
    "wrappedPositiveControl": true,
    "stringBindingShape": true,
    "arrayBindingConsultsEveryNamespace": true,
    "bareBindingUsesTranslation": true,
    "strictFlagsLooseTwoArg": true,
    "strictFlagsLooseRawKey": true,
    "translationCommonAlias": true,
    "englishLocaleChecked": true,
    "arabicLocaleChecked": true,
    "everyMaskSiteCounted": true,
    "optionsDefaultMaskCounted": true,
    "pluralDefaultMaskCounted": true,
    "defaultValuesIsNotAMask": true,
    "defectiveModelVisiblyReclassified": true
  }
}
EXIT=0
~~~
### Strict audit live JSON

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/i18n-audit-strict.mjs "$PWD" --json; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
{
  "root": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-182826-0000000000000073--P99-41",
  "scannedRoot": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-182826-0000000000000073--P99-41/frontend/src",
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
  "twoArgTotal": 0,
  "literalTwoArgTotal": 0,
  "optionsDefaultTotal": 0,
  "rawKeyTotal": 8518,
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
    "twoArgRescuedByAlias": 0,
    "rawKeyRescuedByAlias": 2
  },
  "defectiveBindingDelta": {
    "twoArgSitesReclassified": 0,
    "rawKeySitesReclassified": 36
  },
  "sites": [],
  "nonKeys": []
}
EXIT=0
~~~
### Dynamic-prefix maskfinder control

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" python3 scripts/partA_maskfinder.py "$PWD" --control; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
EXIT=0
~~~
### Dynamic-prefix maskfinder live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" python3 scripts/partA_maskfinder.py "$PWD"; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
EXIT=0
~~~
### TaskCard negative control — gated by a text assertion, not by its exit code

`scripts/neg-taskcard.mjs` **always exits 0**; its own header says so and requires the caller to
assert the rows. Forwarding `$?` from it is therefore not a verdict, and the previous revision of
this record did exactly that. The recorded command below captures stdout/stderr and makes the
verdict the *text*: exactly three `MISS=true` rows, zero `MISS=false` rows, and one resolving
contrast row. That last one is the positive polarity — without it a probe that printed `MISS=true`
for everything, including a routing that resolves, would pass.

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; OUT=$(node scripts/neg-taskcard.mjs "$PWD" 2>&1); ST=$?; printf '%s\n' "$OUT"; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: neg-taskcard exited $ST"; exit 3; }; MT=$(printf '%s\n' "$OUT" | command grep -c 'MISS=true'); MF=$(printf '%s\n' "$OUT" | command grep -c 'MISS=false'); CN=$(printf '%s\n' "$OUT" | command grep -c 'ns=assignments -> "Low"'); echo "TEXT-ASSERT MISS=true rows=$MT (require exactly 3); MISS=false rows=$MF (require 0); resolving-contrast rows=$CN (require 1)"; test "$MT" -eq 3 && test "$MF" -eq 0 && test "$CN" -eq 1; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
TEXT-ASSERT MISS=true rows=3 (require exactly 3); MISS=false rows=0 (require 0); resolving-contrast rows=1 (require 1)
EXIT=0
~~~

Now `EXIT=0` is the assertion's own status rather than the script's unconditional one. That still
leaves one question a zero can never answer by itself: **can the assertion fire?** Drilled by
feeding the same predicate the same run's captured stdout with one `MISS=true` row removed:

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; OUT=$(node scripts/neg-taskcard.mjs "$PWD" 2>&1); DRILL=$(printf '%s\n' "$OUT" | command grep -v "work_item.task"); MT=$(printf '%s\n' "$DRILL" | command grep -c 'MISS=true'); MF=$(printf '%s\n' "$DRILL" | command grep -c 'MISS=false'); CN=$(printf '%s\n' "$DRILL" | command grep -c 'ns=assignments -> "Low"'); echo "DRILL (one MISS=true row removed from the captured stdout) MISS=true rows=$MT (require exactly 3); MISS=false rows=$MF (require 0); resolving-contrast rows=$CN (require 1)"; if test "$MT" -eq 3 && test "$MF" -eq 0 && test "$CN" -eq 1; then echo "DRILL-FAILED: predicate PASSED doctored output — the text assertion is vacuous"; DR=1; else echo "DRILL-PASSED: predicate REJECTED doctored output — the text assertion can fire"; DR=0; fi; printf 'EXIT=%s\n' "$DR"; exit "$DR"
~~~

Verbatim stdout/stderr:

~~~text
DRILL (one MISS=true row removed from the captured stdout) MISS=true rows=2 (require exactly 3); MISS=false rows=0 (require 0); resolving-contrast rows=1 (require 1)
DRILL-PASSED: predicate REJECTED doctored output — the text assertion can fire
EXIT=0
~~~

So the resolver zero recorded below stands beside a negative control that is itself validated: the
three known-broken `TaskCard` routings are still broken, a routing that resolves is still seen to
resolve, and the predicate that says so rejects an output missing one of those rows.

### Resolution check live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/resolve-check.mjs "$PWD"; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙

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
EXIT=0
~~~
### Nav/title planted control

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/nav-title-agreement.mjs "$PWD" --control; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
EXIT=0
~~~
### Nav/title live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/nav-title-agreement.mjs "$PWD"; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
nav/title walk: 28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 duplicate term pattern; 0 cross-matching term row; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
EXIT=0
~~~
### Glossary census planted control

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/glossary-census.mjs "$PWD" --control; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
{
  "control": "PASS",
  "realFilePreserved": true,
  "unlistedProfileRejected": true,
  "exactProfileSelected": true,
  "briefPluralSeen": true,
  "plantedUnclassifiedBriefPluralCaught": true,
  "realFileClassification": "computer-file-or-attachment",
  "unlistedProfileClassification": "UNCLASSIFIED",
  "exactProfileClassification": "profile-page-or-summary",
  "briefPluralClassification": "briefing-session-or-stage",
  "plantedBriefPluralClassification": "UNCLASSIFIED",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true,
  "allowlistedPluralSeen": true,
  "plantedUnclassifiedPluralCaught": true,
  "allowlistedPluralCount": 1,
  "plantedUnclassifiedPluralCount": 1,
  "allowlistedBriefPluralCount": 1,
  "plantedUnclassifiedBriefPluralCount": 1
}
EXIT=0
~~~
### Glossary census live, with the full fresh census

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/glossary-census.mjs "$PWD" --census; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
glossary census: 17022 Arabic leaf values across 129 file(s)
dossier	ruled=دوسيه	before=143	after=685	unclassified=0
  دوسيه	ruled-term	occurrences=685	lines=673	values=674	files=86	ruled=685	allowlisted=0	unclassified=0
  دوسييه	competing-term	occurrences=2	lines=2	values=2	files=1	ruled=0	allowlisted=2	unclassified=0
  ملف	competing-term	occurrences=141	lines=135	values=135	files=25	ruled=0	allowlisted=141	unclassified=0
engagement	ruled=مشاركة / المشاركات	before=17	after=333	unclassified=0
  مشاركة	ruled-term	occurrences=333	lines=319	values=330	files=71	ruled=333	allowlisted=0	unclassified=0
  ارتباط	competing-term	occurrences=17	lines=17	values=17	files=7	ruled=0	allowlisted=17	unclassified=0
brief-artifact	ruled=ملخص / الملخصات	before=77	after=284	unclassified=0
  ملخص	ruled-term	occurrences=284	lines=277	values=277	files=56	ruled=284	allowlisted=0	unclassified=0
  موجز	competing-term	occurrences=22	lines=22	values=22	files=9	ruled=0	allowlisted=22	unclassified=0
  إحاطة	competing-term	occurrences=55	lines=54	values=55	files=12	ruled=0	allowlisted=55	unclassified=0
  إحاطات	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
briefing-session	ruled=إحاطة	before=0	after=55	unclassified=0
  إحاطة	ruled-term	occurrences=55	lines=54	values=55	files=12	ruled=55	allowlisted=0	unclassified=0
stance	ruled=موقف / المواقف	before=55	after=223	unclassified=0
  موقف	ruled-term	occurrences=223	lines=217	values=217	files=39	ruled=223	allowlisted=0	unclassified=0
  منصب	competing-term	occurrences=46	lines=46	values=46	files=11	ruled=0	allowlisted=46	unclassified=0
  مناصب	competing-term	occurrences=9	lines=9	values=9	files=6	ruled=0	allowlisted=9	unclassified=0
country	ruled=الدول	before=0	after=59	unclassified=0
  الدول	ruled-term	occurrences=59	lines=59	values=59	files=25	ruled=59	allowlisted=0	unclassified=0
  البلدان	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
intake-vs-waiting-queue	ruled=قائمة الاستقبال / قائمة الانتظار	before=0	after=18	unclassified=0
  قائمة الاستقبال	ruled-term	occurrences=4	lines=4	values=4	files=2	ruled=4	allowlisted=0	unclassified=0
  قائمة الانتظار	ruled-term	occurrences=14	lines=14	values=14	files=2	ruled=14	allowlisted=0	unclassified=0
classification totals: ruled=1657 allowlisted=292 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
EXIT=0
~~~
### Date-format exemption/importer controls

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; DEADIMP=$(command grep -rn "EnhancedActivityFeed" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "activity-feed/EnhancedActivityFeed.tsx:" | command grep -c . || true); LIVEIMP=$(command grep -rn "SharedRecentActivityCard" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "SharedRecentActivityCard.tsx:" | command grep -c . || true); echo "date-format controls: exempt-file importers=$DEADIMP (expect 0) live-control importers=$LIVEIMP (expect >0)"; test "$LIVEIMP" -gt 0 && test "$DEADIMP" -eq 0; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
date-format controls: exempt-file importers=0 (expect 0) live-control importers=29 (expect >0)
EXIT=0
~~~
### Date-format checker live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/check-date-formatting.mjs; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.
EXIT=0
~~~

### Completion contract with the human gate closed

Command:

~~~sh
node scripts/completion-contract-check.mjs --summaries .planning/phases/99-arabic-coverage; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
completion-contract: 62/62 SUMMARY files carry the marker
EXIT=0
~~~

The previous attempt recorded this check RED on purpose, because it had marked the record `blocked`
while the gate was open. The gate is answered, so the plan's mandatory `status: complete` applies
and the check is green — the same instrument, the same population, a different state of the world.

## Criterion-2 gate command: the rendered run

The exact command from `99-41-PLAN.md` was run unchanged. It asserts one file, one spec path and the
hardcoded expected count 8 before execution.

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar02-dates.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar02-dates\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=8; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar02-dates.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar02-dates.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
~~~

Verbatim stdout/stderr:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-02T20-05-06-281Z-pw-reaped-a1602dd1701b55f2a0cd65df08790306.json
pw-run-reaped: playwright exited code=0 signal=null; group 66106 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-182826-0000000000000073--P99-41/test-results/pw-reaped-a1602dd1701b55f2a0cd65df08790306.json.log
~~~

Process exit: `0`.

Per-test outcomes, read back out of the published report
`test-results/pw-reaped-a1602dd1701b55f2a0cd65df08790306.json`:

~~~text
stats: {"startTime":"2026-09-02T20:04:45.383Z","duration":18099.964999999997,"expected":8,"skipped":0,"unexpected":0,"flaky":0}
specs: 8
PASS | expected | UI99-C1C2C4 ar /calendar
PASS | expected | UI99-C1C2C4 ar /dossiers
PASS | expected | UI99-C1C2C4 ar /events
PASS | expected | UI99-C1 en control /calendar
PASS | expected | UI99-C1 en control /dossiers
PASS | expected | UI99-C1 en control /events
PASS | expected | UI99-C3 ar /activity relative time
PASS | expected | UI99-C3 en control /activity relative time
~~~

## AR-03 rendered run, post-repair

Same D-09 structure, its own single existing path, hardcoded `EXP=10`.

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar03-leak.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar03-leak\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=10; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar03-leak.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar03-leak.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps
~~~

Verbatim stdout/stderr:

~~~text
collected-from-target-spec=99-ar03-leak.spec.ts count=10 expected=10
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-02T20-06-42-408Z-pw-reaped-a655991582059207b224174a25754cdf.json
pw-run-reaped: playwright exited code=0 signal=null; group 84372 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-182826-0000000000000073--P99-41/test-results/pw-reaped-a655991582059207b224174a25754cdf.json.log
~~~

Process exit: `0`.

Per-test outcomes, read back out of the published report
`test-results/pw-reaped-a655991582059207b224174a25754cdf.json`:

~~~text
stats: {"startTime":"2026-09-02T20:05:49.242Z","duration":50358.081,"expected":10,"skipped":0,"unexpected":0,"flaky":0}
specs: 10
PASS | expected | UI99-C5 ar 404
PASS | expected | UI99-C5 en control 404
PASS | expected | UI99-C6 ar intake queue
PASS | expected | UI99-C6 en control intake queue
PASS | expected | UI99-C7 ar banner under_review
PASS | expected | UI99-C7 ar banner approved
PASS | expected | UI99-C7 ar banner published
PASS | expected | UI99-C8 ar search chips
PASS | expected | UI99-C9 ar latin run scan
PASS | expected | UI99-C10 ar tajawal
~~~

**The three banner-state outcomes, called out as the lane's SUMMARY contract requires:**
`UI99-C7 ar banner under_review` PASS, `UI99-C7 ar banner approved` PASS, `UI99-C7 ar banner
published` PASS — all three at a HEAD containing `2a79b80da`, so this is the first AR-03 run that
executed **after** the position-heading repair rather than before it. It does **not** grade that
heading: `UI99-C7` asserts on the read-only banner element only, which is exactly why a person
caught the English `<h1>` that this suite passed over. What the post-repair run establishes is that
the repair broke none of the banner behaviour these three legs do assert.

## The rendered runs and this record's HEAD

Both rendered runs above executed at `b2b91836b0afd2889c7c3b68c57388572d85880d`. This record is
written on top of that commit, so its front-matter `head` is later. That gap is doc-only, and this
is the observation rather than the assertion:

Command:

~~~sh
A=b2b91836b0afd2889c7c3b68c57388572d85880d; B=a03e199e57c0e2743a81f5f00b291e86e684252e; git diff --name-only "$A".."$B"; N=$(git diff --name-only "$A".."$B" | command grep -v '^\.planning/' | command grep -c . || true); T=$(git diff --name-only "$A".."$B" | command grep -c . || true); echo "files changed=$T ; files outside .planning/=$N (require 0)"; test "$N" -eq 0; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
.planning/phases/99-arabic-coverage/99-41-SUMMARY.md
.planning/phases/99-arabic-coverage/99-VERIFICATION.md
files changed=2 ; files outside .planning/=0 (require 0)
EXIT=0
~~~

Two files changed, both of them the two this task owns, and zero outside `.planning/`. No source, no
i18n bundle, no spec and no instrument moved between those runs and this record, so the 8/8 and
10/10 describe the tree being shipped.

## Prior-attempt refusals, retained unchanged

These are the earlier attempt's two exit-90 results. They are kept because they are the honest
record of that attempt, and because the refusal was the wrapper behaving correctly: an unproven
holder identity is not a known holder. They are not evidence for any row above.

### Prior-attempt retry 1

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar02-dates.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar02-dates\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=8; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar02-dates.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar02-dates.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
~~~

Verbatim stdout/stderr:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
~~~

Process exit: `90`.

### Prior-attempt retry 2, after attribution showed the same live port-5001 holder

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar02-dates.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar02-dates\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=8; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar02-dates.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar02-dates.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
~~~

Verbatim stdout/stderr:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
~~~

Process exit: `90`.

Both refusals established `collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8` and
neither established a rendered result. In this attempt `ps -o lstart= -p 67828` resolves, port 5173
is unheld, and the same command reached execution — which is why the rows above are greens rather
than parks.

## Human checkpoint answer

**The answer, verbatim:**

~~~text
it reads as arabic
~~~

**Who gave it:** the operator, Khalid Alzahrani, on 2026-09-02.

**Against what:** the six D-38 surfaces captured live under `?lng=ar` in a signed-in staging session
— the 404, the intake queue, the search chips, the dated calendar, `/activity`'s relative time and
the published position banner — with the D-19 tie-break list beside them, published at
`https://claude.ai/code/artifact/7626d793-14c3-46f8-9ebd-8471fe4dd4ee`.

**Where it is recorded:** `RULING-P99-544` in `.tickmarkr/overseer/DECISIONS.md`
(*"the D-38 sign-off was GIVEN, and the gate earned its existence"*), and the run journal's
`task-approved` event for `P99-41` at `2026-09-02T18:47:49.376Z`, whose `by` field reads
`operator (Khalid Alzahrani), relayed by overseer w0:pB6 under RULING-P99-545 item 4` and whose
reason states: *"Do not paraphrase, expand or improve it."* `RULING-P99-546` records that the
approve command itself was executed from the overseer's seat after the orchestrator's classifier
denied it — a host permission wall, recorded as a tier exception, not a substitution of the decider.

**The `or named what must change` branch was exercised too.** Capturing surface 6 exposed that the
position detail page rendered `title_en` as its `<h1>` in Arabic mode. `RULING-P99-544` records the
repair at `2a79b80da` and that it was *"verified in BOTH directions, suites still 18/18"*; this
attempt's own runs independently reproduce the **suite half** of that — 8/8 and 10/10 — but not the
both-directions heading check, which stays a ruling-quoted claim. `UI99-C7` was green on that page
throughout, because it asserts on the read-only banner element and not the heading, so no automated
leg in this phase grades the `<h1>` in either direction.

### Why this worker still does not treat the commit as the sign-off

The previous attempt's refusal was correct and is retained. `2a79b80da` is an agent-session repair
commit, and its metadata cannot establish that a person reviewed anything:

Command:

~~~sh
git show -s --format='COMMIT=%H%nAUTHOR=%an <%ae>%nAUTHORED=%aI%n%n%B' 2a79b80da; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
COMMIT=2a79b80daf1baa1e3d980736b1d144c702d3c04b
AUTHOR=Khalid Alzahrani <alzahrani.khalid@gmail.com>
AUTHORED=2026-09-02T13:52:57+03:00

fix(i18n): show the Arabic position title as the heading in Arabic mode

The position detail page rendered title_en as its h1 unconditionally and
demoted title_ar to muted secondary text, so an Arabic session opened a
position under an English heading. Found while capturing the D-38 checkpoint
surfaces, where surface 6 read "GASTAT stance on open data licensing" above the
Arabic title.

UI99-C7 did not catch it because it asserts on the read-only banner element
rather than the heading, so the page could lead in English while the test
passed.

PositionCard and PositionList already select by locale; this applies the same
pattern, with the English title kept as the secondary line in Arabic mode and
the arrangement reversed in English. The DB constraint check_title_ar_not_empty
guarantees the Arabic title is non-empty, so the heading cannot render blank.

Verified in both locales: ar leads with موقف الهيئة من ترخيص البيانات المفتوحة,
en still leads with the English title. 99-ar02 and 99-ar03 remain 18/18.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MM1w7sCDLDpu8tzNfdGCRZ

EXIT=0
~~~

The commit is the repair the checkpoint caused, and it is lineage. The sign-off is the ruling and
the journal event above, and this record transcribes rather than interprets them.

**Checkpoint state: ANSWERED and RELEASED.** The D-19 reversal window closed on this answer; no row
in the tie-break list was named for a swap.

## Residues and later owners

- Authorized bounds: none. No overseer ruling authorizes a bound here and none is claimed.
- Nothing in P99-41 is left blocking: the previously parked AR-03 leg and the rendered checkpoint
  pack were closed by running them (10/10 and 8/8, verdict `clean` each), and D-38 was closed by the
  operator's written answer.
- Phase 102: D-21's working approximately 7,086-site dot-to-colon tail, COPY-09's three literals,
  EDGECOPY-01's two edge functions, and GUIDE-HOLLOW-01's seven guide bodies.
- Phase 103: the 39 criterion-1 members triaged by reading in Phase 98.
- Nav/title escalations: `navigation.admin`, `navigation.taskQueue`, and
  `navigation.newEvent`, still value-locked.
- Closed historical population, retained by name: the 37 `common:common.*` keys, enumerated in full
  in `99-VERIFICATION.md`'s residue register; the live population is zero.
- Named handoffs: `common:optional`; `common:tasks.sla.approaching`;
  `common:afterActions.decisions.item`; `common:afterActions.confidence`;
  `common:afterActions.commitments.{tracking,statuses,priorities}.*`;
  `common:contributors`; `common:days`;
  `common:waitingQueue.reminder.{noAssignee,success,error}`;
  `WorkItemLinker.tsx`'s eight raw common keys; and
  `positions:draftBanner`.
- Open engine debt: the ad-hoc (unleased) `pw-run-reaped.mjs --lease-exec` path in
  `playwright.config.ts` still needs an overseer ruling. It did not apply to either run recorded
  here — both went through the wrapper, both were leased, both reaped `clean`.
- Arabic naturalness beyond the seven ruled glossary rows remains operator review. The sign-off
  answers "does it read as Arabic", not "is every phrase the best Arabic".

## Read and diagnostic ledger

Read/navigation commands: `sed`, `grep`, `find`,
`wc`, `git log/show/status/rev-parse`, and read-only Node queries over the
plans, context, research, 62 existing lineage summaries, rendered specs, i18n bundles, test helpers,
the overseer decision log and this run's journal. They established scope, task ownership, the exact
waiver table, D-19 values, residues, and the verbatim operator answer with its attribution.

Diagnostics not used as greens: `lsof`/`ps` attribution of ports 5001 and 5173 before each rendered
invocation; the two prior-attempt safety-wrapper refusals. The Playwright reports the wrapper
publishes under `test-results/` and `.pw-reports/` are instrument artifacts, not tracked paths;
`git status --porcelain` was empty after both runs.

The battery comparator was developed and its three drill fixtures (doctored copies of this file)
were written **outside the worktree**, in the session scratchpad, so no probe of this record left a file
inside the tree a grader reads. The comparator as recorded above needs none of that: it is
self-contained and re-runnable from this file alone.

No tracked path outside the two-path P99-41 allowlist changed.
