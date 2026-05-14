---
phase: 51
plan: 04
plan_id: 51-04
type: execute
wave: 3
depends_on: [51-01, 51-02, 51-03]
files_modified:
  - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md
  - .planning/phases/51-design-token-compliance-gate/51-SUMMARY.md
  - eslint.config.mjs
  - 'frontend/src/**/*.{ts,tsx} (~145 Tier-C files — per-Literal eslint-disable-next-line annotations; final list from 51-DESIGN-AUDIT.md Tier-C Disposition Table)'
autonomous: false
requirements: [DESIGN-04]
requirements_addressed: [DESIGN-04]
tags: [tier-c, severity-flip, smoke-pr, branch-protection, audit-finalization]
objective: >-
  Land the remaining ~145 Tier-C disables (per-Literal eslint-disable-next-line with phase-and-row
  annotation), populate 51-DESIGN-AUDIT.md Tier-C Disposition Table from the live sweep delta, flip
  the D-05 selectors in eslint.config.mjs from `warn` to `error`, run the smoke PR proving
  mergeStateStatus=BLOCKED, run the D-12 net-new-disable diff scan, and write 51-SUMMARY.md
  capturing the smoke PR evidence + pre/post branch-protection JSON snapshots (identical — no PUT
  per D-09). This plan contains the only human-verify checkpoint of the phase (the smoke PR
  evidence capture).
user_setup:
  - service: github-cli
    why: 'Smoke PR creation + branch-protection inspection + close-with-delete-branch (D-10)'
    env_vars:
      - name: GH_TOKEN
        source: 'GitHub CLI auth — assume already configured per Phase 48 / Phase 50 precedent'
    dashboard_config: []

must_haves:
  truths:
    - '51-DESIGN-AUDIT.md Tier-C Disposition Table contains one row per Tier-C file with file, raw_hex_count, palette_literal_count, proposed_token_map, disposition=`deferred-tier-c`, follow_up_phase columns populated.'
    - "Every Tier-C file contains exactly N eslint-disable-next-line annotations of the form `// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename> */` where N = palette_literal_count + raw_hex_count for that file's audit row."
    - "eslint.config.mjs no-restricted-syntax severity is `'error'` (flipped from `'warn'` set by Plan 51-01)."
    - 'Workspace `pnpm lint` exits 0 at `error` severity (all Tier-A files clean, all Tier-C disables in place, all Tier-B carve-outs active).'
    - "D-12 diff-grep verification: `git diff phase-51-base..HEAD -- 'frontend/src' | grep -c '^\\+.*eslint-disable'` equals the Tier-C Disposition Table row total (sum of palette_literal_count + raw_hex_count across all Tier-C rows)."
    - 'Smoke PR #N captured `Lint=FAILURE` (or `fail`) on the deliberate-bad-literal commit AND `gh pr view <N> --json mergeStateStatus -q .mergeStateStatus` returned `BLOCKED`.'
    - 'Smoke PR closed with `gh pr close --delete-branch`; smoke branch removed from origin.'
    - 'Branch protection on `main` re-verified post-smoke: `required_status_checks.contexts` still includes `Lint`; `enforce_admins=true`; pre/post JSON snapshots in 51-SUMMARY.md are IDENTICAL (no PUT performed per D-09).'
  artifacts:
    - path: '.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md'
      provides: 'Populated Tier-C Disposition Table + Slug index'
      contains: 'Tier-C Disposition Table'
    - path: '.planning/phases/51-design-token-compliance-gate/51-SUMMARY.md'
      provides: 'Phase-close summary — smoke PR URL, mergeStateStatus evidence, branch-protection JSON snapshots, D-12 diff-grep evidence'
      contains: 'BLOCKED'
    - path: 'eslint.config.mjs'
      provides: 'D-05 severity at `error`'
      contains: "'error'"
  key_links:
    - from: 'Sweep delta minus Tier-A worklist minus Tier-B carve-out'
      to: '51-DESIGN-AUDIT.md Tier-C Disposition Table'
      via: 'rg -c per file with the same regex pair from Plan 51-03 Task 1'
      pattern: 'deferred-tier-c'
    - from: "Each Tier-C file's offending Literal"
      to: '51-DESIGN-AUDIT.md slug back-reference'
      via: '// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename> */'
      pattern: 'Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#'
    - from: 'smoke/phase-51-design-token-gate PR'
      to: 'main branch-protection Lint context (registered by Phase 48 D-15, preserved through Phase 50-05)'
      via: 'GitHub Actions Lint job runs pnpm lint which exits non-zero on the injected literal once severity is `error`'
      pattern: 'mergeStateStatus.*BLOCKED'
---

<objective>
Close the phase: land Tier-C disables for ~145 files (the sweep delta minus Tier-A minus
Tier-B), populate the audit doc's Tier-C Disposition Table, flip selector severity from
`warn` to `error`, run the proof-of-block smoke PR, and write the phase summary.

This is the only plan in the phase that performs the severity flip. Until this plan
commits, the rule is informational (warns). After this plan commits, the rule is blocking
(workspace lint exits non-zero on any new banned literal). The smoke PR proves the gate
fires under realistic CI conditions, mirroring Phase 48 D-16 / Phase 50-05 PR #11.

D-09 posture: NO branch-protection PUT. The `Lint` context is already required since
Phase 48; this plan re-verifies it and snapshots pre/post identical JSON in 51-SUMMARY.md
to make the no-PUT decision explicit in the paper trail.

D-12 posture: every net-new `eslint-disable-next-line` introduced under `frontend/src/`
during the entire phase MUST equal the Tier-C Disposition Table row total. The Task 5
diff-grep is the gate that proves zero net-new disables outside the audited Tier-C scope.

Purpose: deliver the DESIGN-04 success criterion (workspace `pnpm lint` exits 0 with the
rules at `error` severity AND a PR-blocking branch-protection context proven via smoke PR).

Output: a populated audit doc, a flipped severity, a closed smoke PR, and a sealed
`51-SUMMARY.md` that downstream Tier-C cleanup phases can navigate by slug back-reference.

Wave 3 — depends on Plans 51-01, 51-02, 51-03 all complete. Sequential, no parallelism.

Contains ONE checkpoint:human-verify task (Task 4 smoke PR evidence capture).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/51-design-token-compliance-gate/51-CONTEXT.md
@.planning/phases/51-design-token-compliance-gate/51-RESEARCH.md
@.planning/phases/51-design-token-compliance-gate/51-PATTERNS.md
@.planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md
@.planning/phases/51-design-token-compliance-gate/51-VALIDATION.md
@.planning/phases/51-design-token-compliance-gate/51-01-SUMMARY.md
@.planning/phases/51-design-token-compliance-gate/51-02-SUMMARY.md
@.planning/phases/51-design-token-compliance-gate/51-03-SUMMARY.md
@.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md
@CLAUDE.md
@eslint.config.mjs

<interfaces>
Tier-C disable shape (verbatim from PATTERNS.md):
```
// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#TriagePanel */
className="text-yellow-700 dark:text-yellow-300"
```

Rules:

- ONE disable per offending Literal — never bulk-disable at file top.
- The <basename> slug matches the audit row file column basename (e.g., `TriagePanel` for `components/triage-panel/TriagePanel.tsx`).
- The disable comment goes on the line IMMEDIATELY BEFORE the offending Literal.
- For TemplateElement violations, the disable goes on the line containing the template expression.

D-12 diff scan command:

```
git diff phase-51-base..HEAD -- 'frontend/src' \
  | grep -E '^\+.*eslint-disable' \
  | grep -vE '^\+\+\+' \
  > /tmp/51-eslint-disable-additions.txt
wc -l < /tmp/51-eslint-disable-additions.txt
# MUST equal the Tier-C Disposition Table row total
```

Smoke PR verbatim recipe (UI-SPEC Copywriting Contract):

- Branch name: `smoke/phase-51-design-token-gate`
- PR title: `chore(51-smoke): verify Lint blocks raw palette literal`
- PR body: `Smoke PR for Phase 51 DESIGN-04. Injects a deliberate bg-red-500 violation into <route-level component>. Expected: Lint job fails; mergeStateStatus=BLOCKED. Close without merge.`
- Inject literal: `<div className="bg-red-500">smoke</div>` inside an already-rendered JSX subtree (NEVER module scope — Phase 48 PR #6 hit TS6133 trap)
- Three load-bearing invariants: mergeStateStatus=BLOCKED (not mergeable=MERGEABLE), branch named with "smoke/phase-51" prefix, gh pr close --delete-branch disposition

Expected branch-protection JSON (live capture 2026-05-15, RESEARCH §4):

```
{
  "enforce_admins": true,
  "contexts": ["type-check","Security Scan","Lint","Bundle Size Check (size-limit)","Tests (frontend)","Tests (backend)"],
  "strict": true,
  "reviews": null,
  "restrictions": null
}
```

Pre/post snapshots in 51-SUMMARY.md must be IDENTICAL.
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                                     | Description                                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| eslint-disable-next-line annotation -> AST visitor exemption | each per-Literal disable creates a one-line exemption from D-05; misalignment silently breaks the audit chain                 |
| smoke PR branch -> GitHub Actions CI -> branch protection    | smoke PR exercises the entire CI pipeline; non-Lint failures pollute attribution (Phase 48 PR #6 -> #7 lesson)                |
| eslint.config.mjs severity flip -> CI Lint job behavior      | flipping warn -> error changes CI exit code semantics workspace-wide; mistimed flip (before Tier-C disables land) breaks main |

## STRIDE Threat Register

| Threat ID | Category               | Component                                                      | Disposition | Mitigation Plan                                                                                                                                                                                                                                                        |
| --------- | ---------------------- | -------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-51-16   | Tampering              | Tier-C disable annotation accuracy                             | mitigate    | Per-file workflow: enumerate D-05 warnings via eslint output, insert one disable per surfaced Literal on the line immediately above, re-run eslint to confirm suppression. Cross-check disable count against audit row count.                                          |
| T-51-17   | Spoofing               | Wrong rule name on disable                                     | mitigate    | Annotation MUST cite `no-restricted-syntax` exactly. Verification: `grep -c "// eslint-disable-next-line no-restricted-syntax /\* Phase 51 Tier-C:" <file>` equals audit row count.                                                                                    |
| T-51-18   | Repudiation            | D-12 diff-grep miscount                                        | mitigate    | Audit doc is source of truth. Diff-grep is observed count. Reconcile by regenerating per-file counts from source (`rg -c eslint-disable-next-line <file>`) — update audit doc to match reality, never reverse.                                                         |
| T-51-19   | Information Disclosure | Smoke PR triggers non-Lint failures                            | mitigate    | Pitfall 3: inject literal INSIDE existing JSX subtree, never module scope (TS6133 trap). If non-Lint context fails, close PR --delete-branch and retry with in-tree injection.                                                                                         |
| T-51-20   | Denial of Service      | Severity flip lands before Tier-C disables -> main lint breaks | mitigate    | Strict ordering: Task 1 audit population -> Task 2 disable insertion -> Task 3 severity flip (GATED on `pnpm lint --max-warnings 0` exiting 0). If gate fails, Task 3 reverts the flip and surfaces the gap.                                                           |
| T-51-21   | Elevation of Privilege | Branch-protection drift research-time -> execute-time          | mitigate    | Pre-Task-4: `gh api .../branches/main/protection --jq '.required_status_checks.contexts'` MUST include `Lint`. If missing, smoke PR cannot prove blocking — escalate DEVIATION; out-of-D-09 PUT is forbidden, fall back to lower-confidence proof + roadmap follow-up. |
| T-51-22   | Tampering              | Smoke PR accidentally merges                                   | mitigate    | Three load-bearing invariants: visible "DO NOT MERGE" in title/body, no approval workflow triggered, `gh pr close --delete-branch` close action. Verbatim Phase 47-03 / 48-03 / 50-05 precedent.                                                                       |

All threats scored low or mitigated. Severity flip is gated (Task 3 cannot proceed without lint zero-state); smoke PR is gated (mergeStateStatus=BLOCKED observable before close).
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Populate 51-DESIGN-AUDIT.md Tier-C Disposition Table from sweep delta</name>
  <files>.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md (full file — including the Tier-A Worklist populated by Plan 51-03)
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §"Implementation Approach §2. Tier-A worklist sizing" — sweep command + classification heuristic
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"51-DESIGN-AUDIT.md (create)" pattern assignment — verbatim audit-table row shape + slug-index pattern
    - eslint.config.mjs (lines 70-260, including the Plan 51-01 D-03 Tier-B carve-out block) — to enumerate exact Tier-B file globs for the exclusion list
  </read_first>
  <action>
    Step 1a — Re-run the live sweep with EXCLUSIONS for (a) Plan 51-01 Tier-B carve-out files, (b) Plan 51-02 anchors (WorldMapVisualization, PositionEditor), (c) Plan 51-03 Tier-A worklist files:

      PALETTE='(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\d{2,3}\b'
      rg -lE "$PALETTE" --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null > /tmp/51-still-violating.txt
      rg -lE '#[0-9a-fA-F]{3,8}\b' --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null >> /tmp/51-still-violating.txt
      sort -u /tmp/51-still-violating.txt > /tmp/51-tier-c-candidates.txt

    Step 1b — Filter out Tier-B + Plan 51-03 Tier-A list:
      - Read eslint.config.mjs and extract the Tier-B `files: [...]` array. Remove each path from /tmp/51-tier-c-candidates.txt.
      - Read 51-DESIGN-AUDIT.md §Tier-A Worklist and extract every file. Remove from /tmp/51-tier-c-candidates.txt.
      - The result is the Tier-C candidate file list.

    Step 1c — For each Tier-C candidate, run two counts:
      rg -c "$PALETTE" <file>                # palette literal count
      rg -c '#[0-9a-fA-F]{3,8}\b' <file>     # raw hex count
    Drop any file with both counts at 0 (false positive after sort/uniq).

    Step 1d — For each remaining Tier-C row, build the table entry with columns:
      - file (relative to frontend/src/)
      - raw_hex_count
      - palette_literal_count
      - proposed_token_map (verbal hint per the cookbook — e.g., "text-yellow-* -> text-warning; text-green-* -> text-success")
      - disposition = `deferred-tier-c`
      - follow_up_phase = `TBD-design-token-tier-c-cleanup-wave-N` (placeholder)

    Step 1e — Append the populated table to 51-DESIGN-AUDIT.md §"Tier-C Disposition Table" (replacing the empty placeholder from Plan 51-03 Task 1).

    Step 1f — Populate §"Slug index" with one row per Tier-C file: `- <basename> — <relative-path>`. Slugs MUST be unique — disambiguate by directory if two files share a basename (e.g., `TriagePanel-dossier` vs `TriagePanel-intake`).

    Step 1g — Record at the top of the audit doc:
      `**Total Tier-C files:** <count>`
      `**Expected per-Literal disable count:** <sum-of-palette+hex-across-Tier-C-rows>`
    This is the EXPECTED VALUE for Task 5's D-12 diff-grep.

    DO NOT touch any source file. Only the audit doc is modified.

  </action>
  <verify>
    <automated>grep -q "Tier-C Disposition Table" .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md &amp;&amp; awk '/Tier-C Disposition Table/,/Slug index/' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md | grep -c "deferred-tier-c" | awk '{ if ($1 &gt; 0) exit 0; else exit 1 }' &amp;&amp; grep -q "Expected per-Literal disable count" .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md</automated>
  </verify>
  <done>
    `51-DESIGN-AUDIT.md` Tier-C Disposition Table has ≥1 `deferred-tier-c` row.
    `51-DESIGN-AUDIT.md` Slug index has one entry per Tier-C file (basename slugs unique).
    `**Total Tier-C files:**` and `**Expected per-Literal disable count:**` recorded at top.
    No Tier-B carve-out file or Plan 51-03 Tier-A worklist file appears in the Tier-C table.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Insert per-Literal eslint-disable-next-line annotations across all Tier-C files</name>
  <files>All files enumerated in 51-DESIGN-AUDIT.md Tier-C Disposition Table (~145 files)</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md (Task 1 populated Tier-C Disposition Table + Slug index)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"Per-Literal eslint-disable-next-line with phase-and-row annotation (Tier-C)" — verbatim annotation shape
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Deferred (Tier-C)" + §"Copywriting Contract" row 3 (annotation template)
    - For each Tier-C file: read the full file before annotating. Do NOT blanket-annotate based only on rg output — the disable must sit on the line immediately above the offending Literal.
  </read_first>
  <action>
    Process Tier-C files in batches of 10-20 per commit. For each file:

    Step 2a — Read the file fully.

    Step 2b — Run `pnpm exec eslint -c eslint.config.mjs <file> 2>&amp;1 | grep -E "^\s*[0-9]+:[0-9]+"` to enumerate every D-05 warning's exact line:col. Note: severity is still `warn` from Plan 51-01 — output is informational here, not blocking.

    Step 2c — For each surfaced warning, look up the file's audit row basename in 51-DESIGN-AUDIT.md Slug index. Insert one comment IMMEDIATELY ABOVE the offending Literal:
      `// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename> */`

    Annotation rules:
    - Exactly one disable per offending Literal — never bulk-disable at file top.
    - The disable line is line N-1 where N is the line containing the offending Literal.
    - For template-literal violations (caught by the TemplateElement companion selector), the disable goes on the line containing the template expression — verify by re-running eslint after insertion.
    - Match the basename slug verbatim from the Slug index. Slug typos break the audit chain.
    - The `Phase 51 Tier-C:` prefix is exact — `D-12` greps for it.

    Step 2d — After annotating, run `pnpm exec eslint -c eslint.config.mjs <file> 2>&amp;1 | grep -cE "no-restricted-syntax"` — must return 0 (every Literal is now suppressed).

    Step 2e — Confirm the disable count for that file equals the audit row's (palette_literal_count + raw_hex_count):
      `grep -c "// eslint-disable-next-line no-restricted-syntax /\* Phase 51 Tier-C:" <file>`

    If the count drifts, reconcile by re-running rg on the source — the audit doc may need a row update (per T-51-18 mitigation). Source-of-truth direction: source code first, audit doc updated to match.

    Surgical-change boundary (Karpathy §3):
    - The only addition per Tier-C file is the disable comments — no source-code changes to className strings, no JSX-structure edits.
    - `git diff --stat <file>` should show line delta == disable count (one new comment line per offending Literal).

    Commit cadence: 10-20 files per commit with message `refactor(51-04): tier-c eslint-disable annotations — <subdir or feature batch>`. Each commit message lists the annotated files.

    Notes on edge cases:
    - If a file has palette literals INSIDE a className string concatenation (`'text-red-500' + extra`), the disable goes above the LINE containing the literal. ESLint's `eslint-disable-next-line` applies to the NEXT source line only.
    - If a file has multiple Literals on the same source line (rare but possible — e.g., `<div className="text-red-500"><span className="text-amber-600">`), each Literal is on the same source line so a single `eslint-disable-next-line` covers both. But the audit count must still reflect 2 Literals, not 1 disable. Document this case in the file's audit-row notes column if it appears.

  </action>
  <verify>
    <automated>TIER_C_FILES=$(awk -F'|' '/^\|.*\.(tsx?|ts)\s*\|.*deferred-tier-c/{gsub(/^[[:space:]]*|[[:space:]]*$/,"",$2); print "frontend/src/"$2}' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md 2>/dev/null); pnpm exec eslint -c eslint.config.mjs $TIER_C_FILES 2>&amp;1 | grep -cE "no-restricted-syntax" | grep -qx 0</automated>
  </verify>
  <done>
    Every Tier-C file's per-file eslint run reports 0 `no-restricted-syntax` warnings (every Literal is suppressed by a per-line disable).
    Every Tier-C file's `grep -c "Phase 51 Tier-C:"` count equals its audit row's (palette_literal_count + raw_hex_count) — reconciled per the source-first direction.
    `git diff --stat` line deltas per Tier-C file ≈ disable count (only comment-line additions, no source-code edits).
    Any line-count drift is documented in the audit row's notes (e.g., multi-Literal-on-one-line case).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Flip D-05 selector severity from `warn` to `error` + workspace lint zero-state check</name>
  <files>eslint.config.mjs</files>
  <read_first>
    - eslint.config.mjs (lines 140-200, the no-restricted-syntax array Plan 51-01 set to `warn`)
    - .planning/phases/51-design-token-compliance-gate/51-01-SUMMARY.md (records the warn-set decision rationale)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"Surgical no-source-edit posture (Karpathy §3)"
  </read_first>
  <action>
    Step 3a — PRE-FLIP GATE: run `pnpm lint --max-warnings 0 2>&amp;1 | tail -5` BEFORE editing eslint.config.mjs. The output should reach a state of 0 errors AND 0 warnings (Tier-A swaps + Tier-C disables together should bring the warning count to 0). If non-zero warnings remain, this signals an unsuppressed Tier-A miss (file was classified Tier-A but a literal was missed) or an unsuppressed Tier-C miss (file was classified Tier-C but a disable was missed). DO NOT FLIP if warnings remain — return to Plan 51-03 Task 2 or Task 2 of this plan to address them.

    Step 3b — Flip the severity. Edit eslint.config.mjs line 149 (the first element of the no-restricted-syntax array — currently the string `'warn'` from Plan 51-01 Task 2). Change to `'error'`. If Plan 51-01 split the array into two (RTL-error + D-05-warn shape), the flip target is the SECOND array's first element. Both shapes valid; the executor follows whatever Plan 51-01 actually committed.

    Step 3c — POST-FLIP VERIFICATION:
      1) `node --input-type=module -e "import('./eslint.config.mjs').then(()=>console.log('OK'))"` — must print `OK`.
      2) `pnpm lint --max-warnings 0` — must exit 0. The `--max-warnings 0` flag fails the lint if any warning appears, AND now D-05 warnings are errors so they also fail the lint. Combined: workspace must be COMPLETELY clean.
      3) `pnpm typecheck` — must exit 0.

    Step 3d — If Step 3c fails at the `pnpm lint` step:
      - Revert the flip (`git checkout eslint.config.mjs`).
      - Investigate the surfacing files via the eslint output.
      - Either land a missing Tier-A swap in this plan's commits (justified deviation), OR land a missing Tier-C disable in this plan's commits.
      - Return to Step 3a.

    Commit message: `refactor(51-04): flip D-05 no-restricted-syntax severity to error`. Single-file commit. Body: cite Plan 51-04 Task 3 + the pre-flip zero-warning evidence.

    DO NOT proceed to Task 4 (smoke PR) until Step 3c is green.

  </action>
  <verify>
    <automated>grep -n "'error'" eslint.config.mjs | head -5 &amp;&amp; pnpm lint --max-warnings 0 2>&amp;1 | tail -3 | grep -qE "(0 errors|0 problems|^$|^\s*$)" || pnpm lint 2>&amp;1 | grep -qE "0 errors.*0 warnings"</automated>
  </verify>
  <done>
    eslint.config.mjs no-restricted-syntax array's severity element is `'error'` (Plan 51-01's `'warn'` flipped).
    `node --input-type=module -e "import('./eslint.config.mjs')..."` exits 0 with `OK`.
    `pnpm lint --max-warnings 0` exits 0 (zero errors, zero warnings).
    `pnpm typecheck` exits 0.
    Severity flip is a single-file single-commit change isolated to eslint.config.mjs.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Smoke PR — prove mergeStateStatus=BLOCKED on deliberate-bad literal</name>
  <files>(ephemeral smoke branch + PR — no committed-to-main files)</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §"3. Smoke PR recipe" (verbatim recipe)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"Smoke PR `smoke/phase-51-design-token-gate` (ephemeral branch + PR)" — three load-bearing invariants
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Copywriting Contract" rows 4-5 (verbatim PR title + body)
    - .planning/phases/51-design-token-compliance-gate/51-VALIDATION.md §"Manual-Only Verifications" row 1 (smoke PR mergeStateStatus=BLOCKED instructions)
    - .planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md (Phase 50 PR #11 evidence shape — donor for 51-SUMMARY.md format)
    - .planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-SUMMARY.md (Phase 48 PR #7 attribution-isolation deviation handling)
  </read_first>
  <what-built>
    Plans 51-01, 51-02, 51-03 + Tasks 1-3 of this plan together produce the design-token compliance gate at error severity with all Tier-A files clean and all Tier-C disables in place. Workspace `pnpm lint --max-warnings 0` exits 0.
  </what-built>
  <how-to-verify>
    Executor runs the smoke PR recipe end-to-end (NO checkpoint pause within the recipe itself — the checkpoint is the EVIDENCE CAPTURE step at the end). User confirms the evidence in the PR review step.

    Step 4a — PRE-FLIGHT branch-protection capture:
      `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/51-protection-pre.json`
      Verify the `required_status_checks.contexts` array includes `Lint`. Capture the full JSON for the 51-SUMMARY.md pre-snapshot.

    Step 4b — Create smoke branch off `origin/main`:
      `git fetch origin main`
      `git checkout -b smoke/phase-51-design-token-gate origin/main`

    Step 4c — Inject ONE deliberate-bad literal INSIDE an existing rendered JSX subtree. Recommended target: the 404 / not-found route component, OR `frontend/src/App.tsx` JSX return. Edit:
      `<div className="bg-red-500">smoke</div>`
    PITFALL 3 (Phase 48 PR #6 -> #7 lesson): MUST be inside an existing JSX subtree. Module-scope `const _smoke = ...` triggers TS6133 (noUnusedLocals) and pollutes attribution to "Lint AND type-check fail" instead of "Lint fails."

    Step 4d — Commit + push:
      `git add <touched-file>`
      `git commit -m "chore(51-smoke): verify Lint blocks raw palette literal (DO NOT MERGE)"`
      `git push -u origin smoke/phase-51-design-token-gate`

    Step 4e — Open PR (verbatim title/body from UI-SPEC):
      `gh pr create --base main \`
      `  --title "chore(51-smoke): verify Lint blocks raw palette literal" \`
      `  --body "Smoke PR for Phase 51 DESIGN-04. Injects a deliberate bg-red-500 violation into <route-level component>. Expected: Lint job fails; mergeStateStatus=BLOCKED. Close without merge."`
      `PR=$(gh pr view --json number -q .number)`

    Step 4f — Poll on 10-15s cadence until mergeStateStatus settles (total wait <5min per Phase 50-05 PR #11):
      `for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do`
      `  RESULT=$(gh pr view "$PR" --json mergeStateStatus,statusCheckRollup | jq -c '{mergeStateStatus, lint: (.statusCheckRollup[]? | select(.name == "Lint"))}')`
      `  echo "[$i] $RESULT"`
      `  echo "$RESULT" | jq -e '.mergeStateStatus == "BLOCKED" and .lint.bucket == "fail"' > /dev/null &amp;&amp; break`
      `  sleep 15`
      `done`

    Step 4g — REQUIRED ASSERTIONS:
      `gh pr checks "$PR" --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'`  -> MUST be `"fail"`
      `gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus`  -> MUST be `"BLOCKED"`
      `gh pr view "$PR" --json statusCheckRollup --jq '.statusCheckRollup[] | select(.bucket == "fail") | .name'`  -> SHOULD be ONLY `Lint`. If type-check or other context also fails, return to Step 4c and isolate the in-tree injection.

    Step 4h — Capture evidence in 51-SUMMARY.md:
      - PR number, URL, CI run ID.
      - Lint job state + bucket.
      - mergeStateStatus.
      - All required-context buckets (Tests (frontend), Tests (backend), type-check, Security Scan, Bundle Size Check (size-limit), Lint) — only Lint should be `fail`.
      - Total wait time from PR creation to BLOCKED state.

    Step 4i — POST-PROOF branch-protection capture:
      `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/51-protection-post.json`
      `diff /tmp/51-protection-pre.json /tmp/51-protection-post.json`  -> MUST show no differences (per D-09 no-PUT posture).

    Step 4j — Close + delete branch:
      `gh pr close "$PR" --comment "Smoke evidence captured for Phase 51 D-10. See 51-SUMMARY.md." --delete-branch`
      Verify: `gh pr view "$PR" --json state -q .state` -> `CLOSED`. `git ls-remote origin refs/heads/smoke/phase-51-design-token-gate` -> empty.

    CHECKPOINT — User confirms:
    1. PR was BLOCKED (cite the gh CLI output).
    2. Only Lint failed (no attribution pollution).
    3. Pre/post protection JSON snapshots are identical.
    4. PR is closed with branch deleted.
    Then resume with Task 5.

  </how-to-verify>
  <resume-signal>Type "approved" once the smoke PR evidence is captured and the four checkpoint conditions are met. Type "retry" if attribution pollution requires a re-injection. Type "blocked" if branch protection drift requires a roadmap-level escalation (out-of-D-09-scope PUT).</resume-signal>
  <action>
    Execute Steps 4a through 4j from the &lt;how-to-verify&gt; block above end-to-end. The executor runs the full smoke-PR recipe (pre-flight protection capture, smoke branch creation, deliberate-bad literal injection inside an existing JSX subtree, PR open, mergeStateStatus poll, required assertions, evidence capture, post-proof protection re-capture, PR close --delete-branch). The CHECKPOINT pause sits AFTER the recipe runs — the user reviews the captured evidence (PR URL, mergeStateStatus, Lint bucket, pre/post protection JSON diff) and types "approved" before Task 5 begins.
  </action>
  <verify>
    <automated>gh pr list --state closed --search "head:smoke/phase-51-design-token-gate" --json mergeStateStatus,state,title --jq '.[0] | select(.title | startswith("chore(51-smoke)")) | .state' | grep -qx '"CLOSED"' &amp;&amp; ! git ls-remote origin refs/heads/smoke/phase-51-design-token-gate | grep -q smoke</automated>
  </verify>
  <done>
    Smoke PR `smoke/phase-51-design-token-gate` was created against `main`.
    `gh pr view &lt;PR&gt; --json mergeStateStatus -q .mergeStateStatus` returned `BLOCKED`.
    `gh pr checks &lt;PR&gt; --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'` returned `"fail"`.
    No non-Lint required context reported `fail` (attribution clean).
    Pre/post branch-protection JSON snapshots are byte-identical (`diff /tmp/51-protection-pre.json /tmp/51-protection-post.json` returns empty).
    PR closed with `gh pr close --delete-branch`; smoke branch removed from origin.
    All four CHECKPOINT confirmation conditions met; user typed "approved".
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 5: D-12 net-new disable diff scan + final workspace lint zero-state + 51-SUMMARY.md</name>
  <files>
    .planning/phases/51-design-token-compliance-gate/51-SUMMARY.md
  </files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md (Tier-C Disposition Table total = expected disable count)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"Per-Literal eslint-disable-next-line with phase-and-row annotation" + §"D-12 net-new disable scan" verbatim command
    - .planning/phases/51-design-token-compliance-gate/51-VALIDATION.md §"Per-Task Verification Map" row "Zero net-new eslint-disable outside Tier-C"
    - .planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md — donor shape for 51-SUMMARY.md frontmatter + sections
    - All four sub-plan summaries (51-01, 51-02, 51-03, and Task 4's evidence captured above)
  </read_first>
  <action>
    Step 5a — D-12 net-new disable diff scan:
      `git diff phase-51-base..HEAD -- 'frontend/src' \`
      `  | grep -E '^\+.*eslint-disable' \`
      `  | grep -vE '^\+\+\+' \`
      `  > /tmp/51-eslint-disable-additions.txt`
      `wc -l < /tmp/51-eslint-disable-additions.txt`
    The line count MUST equal the `**Expected per-Literal disable count:**` recorded at the top of 51-DESIGN-AUDIT.md (set by Task 1).

    If the counts mismatch:
      - If diff count > audit count: a stray net-new disable exists outside the audited Tier-C scope. Locate via `grep -v "Phase 51 Tier-C:" /tmp/51-eslint-disable-additions.txt` — any disable that doesn't carry the Tier-C annotation is the culprit. Either reclassify as Tier-C (update audit doc + add annotation) or REVERT (remove disable + apply a Tier-A swap instead).
      - If diff count < audit count: audit overcounted; reconcile by regenerating per-file rg counts and updating the audit doc.
    Either way: SOURCE FIRST, audit follows source.

    Step 5b — Final workspace lint zero-state:
      `pnpm lint --max-warnings 0` -> exit 0
      `pnpm typecheck` -> exit 0
      `pnpm exec eslint -c eslint.config.mjs frontend/src/components/geographic-visualization/WorldMapVisualization.tsx frontend/src/components/position-editor/PositionEditor.tsx tools/eslint-fixtures/bad-design-token.tsx 2>&amp;1` -> the first two exit 0; the fixture surfaces D-05 messages (it MUST fail lint as a regression guard).

    Step 5c — Write `51-SUMMARY.md` with sections:
      1) YAML frontmatter — `phase: 51`, `plan: 04`, `subsystem: lint-config + design-tokens + smoke-pr`, `tags: [design-tokens, eslint, lint-config, branch-protection, smoke-pr, tier-a, tier-b, tier-c, audit]`, `requirements_completed: [DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04]`, `tech_stack: [eslint-9.39.4, typescript-eslint-8.57.2, tailwindcss-4.x, github-cli]`, `key_files: [eslint.config.mjs, tools/eslint-fixtures/bad-design-token.tsx, frontend/src/components/geographic-visualization/WorldMapVisualization.tsx, frontend/src/components/position-editor/PositionEditor.tsx, .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md]`, `key_decisions: [D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14]`, `duration: <hours>`, `completed: <date>`.
      2) Accomplishments — what shipped under D-05 (the 3 selectors), D-03 (Tier-B carve-out enumeration), D-09 (Lint context re-verification, no PUT), Tier-A waves (Plans 51-02 + 51-03), Tier-C wave (Task 1+2 of this plan). Cite commit SHAs.
      3) Verification — workspace `pnpm lint` exit 0 evidence; `pnpm typecheck` exit 0; per-file eslint runs on the two anchors and fixture; D-12 diff-grep equals audit count.
      4) Smoke PR Evidence — PR number, URL, CI run ID, `mergeStateStatus = BLOCKED`, `Lint = FAILURE`, other contexts pass, PR closed with `--delete-branch`. Reference Task 4's checkpoint capture.
      5) Branch-Protection Snapshots — pre + post JSON (IDENTICAL per D-09), screenshot of `diff /tmp/51-protection-pre.json /tmp/51-protection-post.json` returning empty.
      6) D-12 Compliance — disable diff count, audit count, equality assertion.
      7) Audit Doc Summary — Tier-A file count, Tier-C file count, total disables, total slug-index entries.
      8) Deviations — any classification changes mid-phase (Tier-A -> Tier-C reclassifications, multi-Literal-on-one-line cases), workspace-name confirmation, smoke-PR retries if any.
      9) Follow-up — the placeholder follow_up_phase values in audit rows (TBD-design-token-tier-c-cleanup-wave-N) should be promoted to roadmap entries in a separate PR (out of Phase 51 scope).

    Step 5d — Capture the final eslint-disable-next-line audit:
      `git diff phase-51-base..HEAD --stat -- 'frontend/src' >> 51-SUMMARY.md` (under section 7).
      Include the `wc -l < /tmp/51-eslint-disable-additions.txt` output.

    DO NOT make any further source edits beyond writing 51-SUMMARY.md. The phase is in its final state.

  </action>
  <verify>
    <automated>EXPECTED=$(grep "Expected per-Literal disable count" .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md | grep -oE '[0-9]+' | head -1); ACTUAL=$(git diff phase-51-base..HEAD -- 'frontend/src' | grep -E '^\+.*eslint-disable' | grep -vE '^\+\+\+' | wc -l | tr -d ' '); test "$EXPECTED" = "$ACTUAL" &amp;&amp; pnpm lint --max-warnings 0 2>&amp;1 | tail -3 | grep -qE "(0 errors|0 problems|^$)" &amp;&amp; test -f .planning/phases/51-design-token-compliance-gate/51-SUMMARY.md &amp;&amp; grep -q "BLOCKED" .planning/phases/51-design-token-compliance-gate/51-SUMMARY.md</automated>
  </verify>
  <done>
    D-12 diff-grep count equals 51-DESIGN-AUDIT.md `**Expected per-Literal disable count:**` (numbers match exactly).
    `pnpm lint --max-warnings 0` exits 0 workspace-wide.
    `pnpm typecheck` exits 0.
    `tools/eslint-fixtures/bad-design-token.tsx` lint runs surface D-05 messages (regression guard active).
    `51-SUMMARY.md` exists with all 9 sections populated; contains `BLOCKED` (smoke PR evidence) and identical pre/post protection JSON snapshots.
    No further source edits planned; the phase is sealed.
  </done>
</task>

</tasks>

<verification>
After all five tasks complete:

- `51-DESIGN-AUDIT.md` Tier-C Disposition Table is fully populated; Slug index has one entry per Tier-C file.
- ~145 Tier-C files contain per-Literal `eslint-disable-next-line` annotations matching the audit row count.
- `eslint.config.mjs` no-restricted-syntax severity is `'error'`.
- `pnpm lint --max-warnings 0` exits 0 workspace-wide.
- `pnpm typecheck` exits 0.
- Smoke PR closed with evidence captured: `mergeStateStatus=BLOCKED`, `Lint=FAILURE`, all other contexts pass, branch deleted from origin.
- Branch protection pre/post snapshots are identical (no PUT performed per D-09).
- D-12 diff-grep count equals audit total — zero net-new `eslint-disable` outside the audited Tier-C scope.
- `51-SUMMARY.md` sealed with 9 sections + frontmatter; references all four sub-plan summaries.
- Regression fixture (`tools/eslint-fixtures/bad-design-token.tsx`) still fails lint at error severity (every-CI regression guard active).
  </verification>

<success_criteria>

- DESIGN-04 ROADMAP success criterion 4 ("Workspace `pnpm lint` exits 0 with new rules active; PR-blocking CI context registered on `main`") delivered. The PR-blocking context is the existing `Lint` context (D-09 fold posture), proven by the smoke PR.
- Phase 51 sealed: all 4 ROADMAP success criteria delivered (ESLint rule bans hex + Tailwind palette literals; anchor + sweep violations fixed; pnpm lint zero-state with rules active; smoke PR proves block).
- The audit doc provides a complete, navigable inventory for future Tier-C cleanup phases.
- Phase 52 (HeroUI v3 Kanban Migration) can now proceed knowing migrated Kanban code MUST be born design-token-compliant — the rule fires on any new banned literal.
  </success_criteria>

<output>
After completion, ensure `.planning/phases/51-design-token-compliance-gate/51-SUMMARY.md` is complete with all 9 sections, frontmatter, and links to:
- 51-01-SUMMARY.md (rule activation + Tier-B + fixture)
- 51-02-SUMMARY.md (Tier-A named anchors)
- 51-03-SUMMARY.md (Tier-A mechanical sweep)
- 51-DESIGN-AUDIT.md (Tier-A worklist + Tier-C disposition table + slug index)

Also ensure ROADMAP.md is updated to mark Phase 51 plans complete (via the standard execute-plan finalization step).
</output>
