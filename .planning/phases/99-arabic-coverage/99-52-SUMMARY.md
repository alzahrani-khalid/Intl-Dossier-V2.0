---
status: complete
---

# P99-52 Summary — generated, matrix-bounded dynamic-key corpus

## Result

The dynamic-key fixture corpus is generated data with a committed producer. `FORM-MATRIX.tsv` is the external selector: it contains exactly 28 rows, covers every crossing of four resolved identifiers with seven language binding forms, and names a distinct negative/control fixture pair for every cell. All 28 cells are expressible, so the matrix contains no `NA:` cells and there are no not-expressible reasons to record.

The compact corpus selects only profile inputs. It replaces the rejected 922-file production copy with single-caller matrix roots backed by one shared support root. Check mode compares the complete generated inventory and every byte without writing; normal mode rebuilds all generated roots from the committed matrix and producer.

Measured after generation:

- Corpus files: 114
- Corpus content bytes: 82189
- Generated files: 111
- Generated content bytes: 39918
- Complete task files, including this SUMMARY: 115
- Matrix cells: 28
- Orphan fixture roots: 0
- Content ceiling: 100000 bytes

No instrument, instrument test, production caller, locale bundle outside the corpus, or other task plan was edited.

## Profile caller sets

- pre-repair: immutable ar04-pre-repair caller set. It contains the list caller plus the seven ruled lane3 caller paths, only the domain producers those callers require, and only the bilingual namespace bundles those calls read. It preserves list sites 9, list leaves 153, lane3 sites 13, list missing-both 32, and cluster missing-both 8.
- shared: lane3 single-caller support set. Its canonical `DOSSIER_CARD_TYPES` producer and bilingual `graph` bundles are read through every generality and matrix fixture root; they occur once instead of being copied into every pair.
- generality-membership and generality-noproof: lane3 single-caller set. These are the positive membership-plus-unknown shape and its proof-absent polarity.
- Every matrix-named root and its `-control` twin: lane3 single-caller set. The root contains only `caller.tsx` plus any import target required to express that cell; shared domain and locale inputs are read from `shared`.

Every root is therefore either a named matrix pair or one of the four ruled roots above. Every generated file is an input read by one of those caller sets; no production directory is copied wholesale.

## Reproduction oracle

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; F="$R/scripts/fixtures/dynamic-key-audit"; G="$F/generate-fixtures.mjs"; M="$F/FORM-MATRIX.tsv"; test -f "$G" || { echo "FAIL: no generator"; exit 1; }; test -f "$M" || { echo "FAIL: no matrix"; exit 1; }; ROWS=$(command grep -c . "$M" || true); echo "matrix-rows=$ROWS"; test "$ROWS" -eq 28 || { echo "FAIL: matrix has $ROWS rows, need 28"; exit 1; }; rc=0; for FORM in direct aliased-import re-export destructured shadowed out-of-scope reassigned; do for I in receiver key namespace translator; do CELL=$(awk -F"\t" -v i="$I" -v f="$FORM" '$1==i && $2==f {print $3}' "$M"); test -n "$CELL" || { echo "FAIL: matrix cell missing for $I/$FORM"; rc=1; }; done; done; test "$rc" -eq 0 || exit 1; B=$(mktemp -d); cp -R "$F" "$B/work"; ( cd "$B" && node "$B/work/generate-fixtures.mjs" --check ) > "$B/out" 2>&1; CHK=$?; command diff -r "$F" "$B/work" > "$B/drift" 2>&1 || true; DRIFT=$(command grep -c . "$B/drift" || true); echo "generator-check-exit=$CHK reproduction-drift-lines=$DRIFT"; command head -3 "$B/drift" 2>/dev/null; rm -rf "$B"; test "$CHK" -eq 0 && test "$DRIFT" -eq 0
```

Complete stdout and stderr, verbatim:

```text
matrix-rows=28
generator-check-exit=0 reproduction-drift-lines=0
```

Exit status: 0.

## Minimality oracle

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; F="$R/scripts/fixtures/dynamic-key-audit"; M="$F/FORM-MATRIX.tsv"; test -f "$M" || { echo "FAIL: no matrix"; exit 1; }; N=$(command find "$F" -type f | command grep -c . || true); echo "corpus-files=$N"; test "$N" -ge 1 || { echo "FAIL-VACUOUS: empty corpus proves nothing"; exit 1; }; ORPH=0; for top in $(command ls -1 "$F"); do case "$top" in FORM-MATRIX.tsv|generate-fixtures.mjs) continue;; esac; test -d "$F/$top" || continue; base=${top%-control}; case "$base" in _support|shared|pre-repair|generality-membership|generality-noproof) continue;; esac; awk -F"\t" -v b="$base" '$3==b{f=1} END{exit !f}' "$M" || { echo "ORPHAN-ROOT: $top (no matrix cell names it)"; ORPH=$((ORPH+1)); }; done; echo "orphan-roots=$ORPH"; BYTES=$(command find "$F" -type f -exec cat {} \; | command wc -c | command tr -d " "); echo "corpus-content-bytes=$BYTES"; test "$BYTES" -le 100000 || echo "FAIL: corpus content $BYTES bytes exceeds the 100000 bound - a corpus this large produces a diff the LLM gates refuse, which is the measured failure this task exists to remove (run 0053: 937696 bytes over 922 files, both gates refused on every attempt)"; test "$ORPH" -eq 0 && test "$BYTES" -le 100000
```

Complete stdout and stderr, verbatim:

```text
corpus-files=114
orphan-roots=0
corpus-content-bytes=82189
```

Exit status: 0.

## Full form matrix

Every cell is expressible and names an isolated negative/control pair; consequently no row requires a not-expressible reason.

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
