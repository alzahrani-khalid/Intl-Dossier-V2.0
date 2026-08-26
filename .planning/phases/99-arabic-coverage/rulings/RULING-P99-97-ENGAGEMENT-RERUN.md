# Ruling P99-97 — Engagement rerun evidence and candidate branch

## Decision

Keep the repo-wide P99-25 engagement census exactly as authored. The two newly scoped Arabic bundles
contain the final three unclassified occurrences, so rewrite those values to the مشاركة family; do not
turn them into sense exceptions and do not narrow the oracle.

Run `run-20260826-113709-0000000000000039` produced candidate tip `ec50a7b41` from repaired base
`4c4e035e3`. It supersedes the older pre-repair candidate `77e0079ea`, but it is **not accepted work**:
its acceptance and review gates failed. In a fresh worker worktree based on the current committed plan,
use the following three commits as a starting patch, in order, or reapply their equivalent diff:

1. `cb3c9b394` — `fix(i18n): sweep engagement terminology by sense`
2. `8ec8767e9` — `fix(i18n): reject deferred engagement exceptions`
3. `ec50a7b41` — `docs(phase-99): record engagement sweep evidence`

Do not merge the candidate branch into the milestone branch. Cherry-picking it into the isolated worker
does not confer a verdict: re-run every declared gate and replace stale evidence in `99-25-SUMMARY.md`.
If the commits conflict with the current base, stop and re-derive rather than weakening scope or oracles.

## Findings that must survive the changed task digest

- The only remaining engagement-row occurrences are the following values, and all three are rewrites,
  not overlay rows:
  - `frontend/src/i18n/ar/dossier-recommendations.json` — `types.engagement`: `ارتباط` -> `مشاركة`.
  - `frontend/src/i18n/ar/operations-hub.json` — `kpi.activeEngagements`:
    `الارتباطات النشطة` -> `المشاركات النشطة`.
  - `frontend/src/i18n/ar/operations-hub.json` — `analytics.empty`: replace its final
    `وارتباطات` with `ومشاركات` while preserving the rest of the Arabic value.
- U+FFFD/mojibake is a material defect. The prior candidate has zero U+FFFD in `sample-data.json`; keep
  it at zero and check every changed Arabic bundle before reporting completion.
- The 17-row engagement overlay is candidate evidence, not a waiver. Revalidate every row's file,
  keyPath, sense, and reason. Adding any of the three occurrences above as an exception is laundering.
- Run the census against the worker's real root using the plan's verbatim `$PWD` command. A scratch-root,
  copied-tree, or filtered-slice census is check-bypass and supplies no acceptance evidence.
- Keep `tiebreaks.json` outside `scripts/glossary-senses.d/`; the milestone base already carries the two
  reader-layout repair commits. Reintroducing the old layout is a regression.
- The sweep may change Arabic leaf values only. English values, Arabic keys, source files, and bundle
  parity remain unchanged. Re-run both command oracles and record their verbatim output and real counts.

## Prior state is not a pass

The candidate passed build, baseline-forgiven test, lint, evidence, and scope, but failed the census
acceptance and cross-vendor review. Its three commits are retained only to avoid discarding already
reviewed mechanical work. P99-25 becomes done only through a fresh seven-gate verdict.
