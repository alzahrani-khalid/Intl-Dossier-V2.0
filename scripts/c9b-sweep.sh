#!/usr/bin/env bash
# c9b-sweep.sh — the C9b consumer sweep, as an instrument that FAILS CLOSED.
#
# WHAT: GATE-STANDARD.md §C9b's derivation, semantics preserved verbatim
#   (tag-anchored changed-file set -> basename identifier with the index/parent-dir rule and the
#   `$` router-marker strip -> stoplist -> word-boundary grep over DERIVED test roots -> a
#   CANDIDATE list the caller triages). Only the fragile shell mechanics are replaced.
#
# WHY THIS IS A SCRIPT AND NOT AN INLINE BLOCK (measured 2026-08-16, Phase 95):
#   zsh does not word-split an unquoted `$ROOTS` scalar. Run under zsh, the GATE-STANDARD inline
#   block passed its whole multi-line roots string to grep as ONE argument and searched 0 files,
#   where bash finds 611 `describe(` hits. It reported a CLEAN SWEEP over nothing. A rule in code
#   is obeyed by everyone; a rule in prose only by whoever read it — so the shell is pinned by
#   shebang here, the roots are a bash ARRAY, and the machinery refuses to report zeros it cannot
#   justify.
#
# BRANCH ORDER IS FIXED — earlier branches mask later ones, so a drill aimed at a later branch
# must satisfy every earlier one first:
#   1. tag verify        -> MISSING TAG
#   2. roots non-empty   -> MISSING ROOTS
#   3. control self-test -> INSTRUMENT-FAILED
#   4. per-identifier output
#
# USAGE:
#   [C9B_ROOT_HINT=<dir>] bash scripts/c9b-sweep.sh <base-tag> [extra-identifier ...]
#     C9B_ROOT_HINT  overrides the roots-derivation base directory (default `.`). REQUIRED
#                    property, not a convenience: the control drill depends on it.
#     extra ids      are appended through the SAME machinery as the derived ones.
#
# OUTPUT: `<file-or-id> <- consumer1 consumer2 ...` per identifier that matched. Zero-hit
#   identifiers print nothing — the control self-test already proved the machinery can see.
#   The list is CANDIDATES, not defects: common nouns match tests that merely mention the domain.
#   What it CANNOT see (part of the rule, not a discovery): a test coupled by rendered SHAPE
#   alone — `getByRole('alert')` plus visible text, naming no identifier — matches no grep.
#
# GATESTD-01 note: GATE-STANDARD.md's sed metacharacter escape is BSD-broken. It is NOT edited
#   (no mid-phase unruled standard edits); the workaround — the 93-15 reject-unsafe-id check —
#   lives here instead.

set -o pipefail

BASE_TAG="${1:-}"
if [ -z "$BASE_TAG" ]; then
  echo "USAGE: [C9B_ROOT_HINT=<dir>] bash scripts/c9b-sweep.sh <base-tag> [extra-identifier ...]" >&2
  exit 2
fi
shift

# --- BRANCH 1: the anchor must exist (C7 — anchored to the phase tag, never HEAD) -------------
if ! git rev-parse -q --verify "refs/tags/${BASE_TAG}" >/dev/null; then
  echo "MISSING TAG: refs/tags/${BASE_TAG}"
  exit 1
fi

# --- BRANCH 2: DERIVE the test roots into an ARRAY (never a scalar; never a hardcoded root) ----
# The 2026-08-16 C9b amendment: a hardcoded `tests` root searched 124 of 591 spec files (21%) and
# reported clean. node_modules is pruned INSIDE the find expression (the 94-07 lesson: a
# post-filtered find hangs on this tree).
ROOT_BASE="${C9B_ROOT_HINT:-.}"
if [ ! -d "$ROOT_BASE" ]; then
  echo "MISSING ROOTS: base directory does not exist: ${ROOT_BASE}"
  exit 1
fi

roots=()
while IFS= read -r d; do
  [ -n "$d" ] && roots+=("$d")
done < <(find "$ROOT_BASE" -maxdepth 3 -type d -name node_modules -prune -o -type d -name tests -print | sort)

if [ "${#roots[@]}" -eq 0 ]; then
  echo "MISSING ROOTS: no test directories found under ${ROOT_BASE}"
  exit 1
fi

FILELIST="$(mktemp -t c9b-sweep)"
trap 'rm -f "$FILELIST"' EXIT
find "${roots[@]}" -type d -name node_modules -prune -o -type f -print > "$FILELIST"
FILECOUNT="$(command wc -l < "$FILELIST" | command tr -d ' ')"

# One sweep implementation, used by the control AND by every identifier — a control that exercises
# different machinery than the thing it certifies certifies nothing.
# stdin redirection, never `xargs -a` (GNU-only; this is a BSD Mac). stderr is NOT suppressed:
# `2>/dev/null` turns a real error into a silent pass (GATE-STANDARD C5).
sweep_hits() {
  command xargs /usr/bin/grep -lE -- "\\b${1}\\b" < "$FILELIST" || true
}

# --- BRANCH 3: FAIL-CLOSED CONTROL SELF-TEST, before ANY per-identifier result -----------------
# The control token is PINNED as the word-safe bare identifier `describe`, NOT `describe(`:
#   (a) `describe(` interpolated into the word-boundary ERE yields `\bdescribe(\b` — unbalanced
#       parentheses, an INVALID ERE. /usr/bin/grep prints "parentheses not balanced", exits 2 and
#       emits nothing, so that control would return 0 on EVERY run and this script would exit
#       INSTRUMENT-FAILED unconditionally, including in its own live self-test.
#   (b) `describe(` is exactly the shape the UNSAFE branch below rejects — a control must be a
#       token the machinery accepts.
# `describe` under `\bdescribe\b` is verified present in tests/e2e/93-admin-surfaces-error.spec.ts
# and hundreds of sibling spec files.
CONTROL_TOKEN='describe'
CONTROL_COUNT="$(sweep_hits "$CONTROL_TOKEN" | command wc -l | command tr -d ' ')"
if [ "$CONTROL_COUNT" -eq 0 ]; then
  echo "INSTRUMENT-FAILED: control token returned 0 — \\b${CONTROL_TOKEN}\\b matched none of ${FILECOUNT} file(s) across ${#roots[@]} root(s) under ${ROOT_BASE}; no zero from this machinery is trustworthy"
  exit 1
fi
echo "CONTROL OK: \\b${CONTROL_TOKEN}\\b -> ${CONTROL_COUNT} file(s) of ${FILECOUNT} across ${#roots[@]} root(s): ${roots[*]}"

# --- BRANCH 4: per-identifier output -----------------------------------------------------------
check_identifier() {
  local label="$1" id="$2" hits

  # `$param.tsx` router marker: `$` is a regex metacharacter and left in place the pattern
  # degenerates and matches nearly every file (18 such route files exist here). Strip it.
  id="${id#\$}"

  # GATESTD-01 workaround: reject, never escape. An id that is not purely word-safe is REPORTED
  # and skipped — never interpolated into an ERE.
  case "$id" in
    *[^A-Za-z0-9_-]*)
      echo "UNSAFE (triage by hand): ${id}"
      return 0
      ;;
  esac

  # GATE-STANDARD stoplist: genuinely generic identifiers flood the output.
  case "$id" in
    auth | utils | types | config | helpers | constants | _shared)
      echo "AMBIGUOUS (triage by hand): ${label}"
      return 0
      ;;
  esac

  hits="$(sweep_hits "$id")"
  if [ -n "$hits" ]; then
    printf '%s <- %s\n' "$label" "$(printf '%s' "$hits" | command tr '\n' ' ')"
  fi
}

while IFS= read -r f; do
  [ -n "$f" ] || continue
  b="$(basename "$f" | command sed -E 's/\.(tsx?|jsx?)$//')"
  # An edge function's identity is its DIRECTORY, not the basename `index` — a basename rule
  # collapses all 139 of them to `index`, which the stoplist then skips.
  if [ "$b" = "index" ]; then
    id="$(basename "$(dirname "$f")")"
  else
    id="$b"
  fi
  check_identifier "$f" "$id"
done < <(git diff --name-only "$BASE_TAG" -- frontend/src supabase/functions backend/src)

for extra in "$@"; do
  check_identifier "$extra" "$extra"
done
