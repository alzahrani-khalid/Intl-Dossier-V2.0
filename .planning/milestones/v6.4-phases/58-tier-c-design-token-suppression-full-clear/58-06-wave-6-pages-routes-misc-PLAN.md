---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 06
type: execute
wave: 6
depends_on:
  - 58-05
files_modified:
  - frontend/src/routes/_protected/**/*.tsx
  - frontend/src/pages/**/*.tsx
  - frontend/src/types/*.types.ts
  - frontend/src/hooks/**/*.{ts,tsx}
  - frontend/src/domains/**/*.{ts,tsx}
  - frontend/src/lib/**/*.{ts,tsx}
  - frontend/src/router/**/*.{ts,tsx}
  - frontend/src/components/**/*.tsx (long-tail unclaimed components — per manifest wave==6 rows)
  - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md (D-16 closure annotation)
autonomous: false
requirements:
  - TOKEN-01
  - TOKEN-02
user_setup:
  - service: 'Git SSH signing'
    why: "phase-58-base annotated tag must be SSH-signed per CLAUDE.md §'Tag signing setup' (D-15); user-local config (~/.gitconfig, ~/.ssh/allowed_signers); already configured for phase-NN-base tags through Phase 57"
    env_vars: []
    dashboard_config:
      - task: 'Verify SSH signing is enabled on this machine'
        location: 'Local shell — run `git config --get gpg.format` (must print `ssh`); `git tag -v phase-57-base` exits 0 with `Good "git" signature` (smoke check)'
must_haves:
  truths:
    - 'Every Wave-6 file (per 58-WAVE-MANIFEST.md `wave == 6` — catch-all) contains zero `Phase 51 Tier-C:` annotations after swap'
    - "After Wave 6 merges, `grep -rn 'Phase 51 Tier-C' frontend/src` returns ZERO matches across the entire frontend/src/ tree (TOKEN-01 closure)"
    - '`pnpm lint` exits 0 workspace-wide; `pnpm type-check` exits 0; `pnpm test:unit` green (TOKEN-02 closure)'
    - '51-DESIGN-AUDIT.md has a `## Phase 58 Closure` section appended per D-16 with reconciliation table (271/2336/2227/91-delta) and deferred-tier-c → cleared mapping'
    - 'phase-58-base annotated SSH-signed tag exists locally and on origin; `git tag -v phase-58-base` exits 0 with `Good "git" signature`; tag points at the post-merge commit on main (never on a feature-branch HEAD)'
    - 'Tier-B carve-out (`eslint.config.mjs:247-270`) byte-identical to phase-57-base'
  artifacts:
    - path: '.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md'
      provides: 'Closure annotation appended (D-16); reconciliation table; deferred → cleared mapping'
      contains: '## Phase 58 Closure'
    - path: '(git tag phase-58-base)'
      provides: 'SSH-signed annotated tag pointing at the final Wave-6 merge commit'
  key_links:
    - from: 'phase-58-base tag'
      to: 'main branch HEAD (post-Wave-6-merge)'
      via: 'Annotated SSH-signed tag per CLAUDE.md tag-signing setup'
      pattern: 'git tag -v phase-58-base'
    - from: '51-DESIGN-AUDIT.md Phase 58 Closure section'
      to: '.planning/phases/58-tier-c-design-token-suppression-full-clear/58-VERIFICATION.md'
      via: 'Closure annotation cross-links to the post-execution verification artifact'
      pattern: '58-VERIFICATION.md'
---

<objective>
Final wave of Phase 58. Two halves:

**Half A — Catch-all token swap.** Swap every remaining `Phase 51 Tier-C:` palette-literal suppression across the catch-all surface: 18 routes under `routes/_protected/**`, 33 pages under `pages/**`, 22 `types/*.types.ts` lookup tables, sparse files under `hooks/`/`domains/`/`lib/`/`router/`, and the long-tail components NOT claimed by Waves 1-5 (notably the activity-feed family, search family, calendar/commitments long-tail, contacts/stakeholder-timeline, export-import, intelligence engine surfaces, approval-chain, etc.). Manifest wave==6 rows are authoritative. Total Wave-6 row count: **exactly 179 files** (deterministic count: 268 total - 17 W1 - 15 W2 - 18 W3 - 25 W4 - 14 W5 = 179).

**Half B — Phase 58 closure.** Append `## Phase 58 Closure` section to `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` per D-16 with the reconciliation table and deferred-tier-c → cleared mapping. Cut the `phase-58-base` annotated SSH-signed tag per D-15 with the exact tag-message body from CONTEXT.md `<specifics>` line 190. The tag is cut **strictly on the post-merge commit on `main`** (never on a feature-branch HEAD). Push the tag to origin and verify `git tag -v phase-58-base` exits 0 with `Good "git" signature`.

Wave 6 is `autonomous: false` because the final tag-push step is gated on SSH signing being enabled on the dev machine — the executor verifies via `git config --get gpg.format` + smoke-checks `git tag -v phase-57-base` (existing signed tag) before attempting `phase-58-base`. If signing is not configured, executor halts and prompts.

Output: PR `phase-58/wave-6-pages-routes-misc: pages/routes/misc token swap + Phase 58 closure annotation (179 files / M nodes / K annotations cleared; 51-DESIGN-AUDIT.md annotated)` on branch `phase-58/wave-6-pages-routes-misc`. 179 atomic per-file commits plus 1 closure-annotation commit. The `phase-58-base` tag is cut in a SEPARATE post-merge step (Task 7), not on the feature branch.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-CONTEXT.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-PATTERNS.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-VALIDATION.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-05-SUMMARY.md
@.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md
@.planning/phases/51-design-token-compliance-gate/51-VERIFICATION.md
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts

<interfaces>
<!-- Wave-6 internal sub-bucketing recommended per RESEARCH §"Wave 6 sub-bucketing recommendation" lines 508-515: -->
<!-- Process atomic commits in this order to keep review tractable -->

1. types/\*.types.ts (22 files) — lookup tables; mechanical D-08/D-09 pattern; ideal codemod candidate per RESEARCH Alternatives Considered
   Notable: legislation.types.ts (63 disables), meeting-minutes.types.ts (45), compliance.types.ts (37), commitment-deliverable.types.ts (35), sla.types.ts (25), availability-polling.types.ts (24), commitment.types.ts (23), engagement-recommendation.types.ts (21)
2. hooks/ + domains/ + lib/ + router/ (6 files) — sparse, hand-edit
   Notable: domains/search/hooks/useSavedSearchTemplates.ts (40 disables)
3. routes/\_protected/\*\* (18 files) — page routes
4. pages/\*\* (33 files) — page components
5. Long-tail components (≈98 files) — activity-feed, search, calendar, commitments, contacts, stakeholder-timeline, export-import, approval-chain, intelligence engine, positions, waiting-queue, etc.
   Notable: search/DossierFirstSearchResults.tsx (62 disables), activity-feed/ActivityFeedFilters.tsx (49, blue+purple collision)

Closure artifacts (D-15, D-16):

- 51-DESIGN-AUDIT.md `## Phase 58 Closure` section format from 58-CONTEXT.md §Specifics line 192:
  - Table columns: wave | files | annotations_cleared | nodes_swapped | regen_targets_updated | commit_sha_range
  - Reconciliation note matching 51-VERIFICATION 2336/2245/91-delta accounting
  - Cross-link to 58-VERIFICATION.md (produced post-execution by /gsd:verify-work 58)
  - Deferred-tier-c → cleared mapping (every TBD `follow_up_phase` placeholder in 51-DESIGN-AUDIT.md Tier-C Disposition Table resolved to "Phase 58")

- phase-58-base tag-message body (exact text from 58-CONTEXT.md §Specifics line 190):
  "Phase 58 — Tier-C design-token suppression full clear. 271 files / 2336 AST nodes / 2227 disable lines cleared via wave-staged token swaps. TOKEN-01 + TOKEN-02 satisfied. `pnpm lint` exits 0; `grep -r 'Phase 51 Tier-C' frontend/src` returns zero. Criterion #2 (eslint.config.mjs waiver token removal) — N/A by absence, documented in 58-VERIFICATION.md."
  </interfaces>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Read Wave-6 manifest rows + SSH-signing smoke check + deterministic Wave-6 count assertion; branch off main</name>
  <files>(no source edits)</files>
  <read_first>
    - `58-WAVE-MANIFEST.md` rows where `wave == 6` (authoritative file list — expected exactly 179 files; covers all unclaimed Tier-C files)
    - `58-05-SUMMARY.md` for Wave-5 lessons learned
    - `58-CONTEXT.md` §"Specifics" lines 188-192 (commit message convention, closure annotation contents, phase-58-base tag-message body)
    - `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` Tier-C Disposition Table — read enough to understand which `follow_up_phase` placeholders need resolving in the closure annotation
    - `.planning/phases/51-design-token-compliance-gate/51-VERIFICATION.md` lines 8-17 — 2336/2245/91-delta reconciliation (DO NOT attempt to "fix" the deltas; the closure annotation documents them)
    - `CLAUDE.md` §"Tag signing setup" — SSH-signed annotated tag protocol
  </read_first>
  <action>
Extract every row where `wave == 6` from 58-WAVE-MANIFEST.md. This is the catch-all wave.

**Wave-6 row-count assertion (deterministic — Wave 6 = 268 total - (W1=17 + W2=15 + W3=18 + W4=25 + W5=14) = 179):**

```bash
WAVE6_COUNT=$(awk -F'|' 'NR>2 && $4 ~ /^[[:space:]]*6[[:space:]]*$/' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | wc -l | tr -d ' ')
EXPECTED_WAVE6=179
[ "$WAVE6_COUNT" = "$EXPECTED_WAVE6" ] || { echo "Wave 6 manifest count drift: got $WAVE6_COUNT, expected $EXPECTED_WAVE6"; exit 1; }
```

If the assertion fails: STOP. The manifest is drifted (a Wave-1..5 file may have leaked into Wave 6, or the manifest has been edited post-Wave-0). Re-validate the manifest against the precedence rules in `58-00-wave-manifest-PLAN.md` before continuing.

**Manifest-precedence sanity check (Sub-bucket D — `pages/dossiers/**` zero-in-Wave-6 assertion):\*\*

```bash
PAGES_DOSSIERS_IN_W6=$(awk -F'|' 'NR>2 && $4 ~ /^[[:space:]]*6[[:space:]]*$/ {print $3}' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | grep -c 'pages/dossiers/' || true)
[ "$PAGES_DOSSIERS_IN_W6" = "0" ] || { echo "Manifest bug: $PAGES_DOSSIERS_IN_W6 pages/dossiers/** rows leaked into Wave 6 — Wave 4 should claim them per precedence regex"; exit 1; }
```

If non-zero: STOP and re-bucket before Wave 6 starts. Per the Wave 0 manifest precedence rule (first-match-wins), Wave 4 claims `pages/dossiers/**` via the regex `^components/(dossier|dossier-recommendations|dossier-timeline|dossiers)/` OR `^pages/dossiers/`. Any leakage indicates the Wave-0 manifest is drifted.

**SSH-signing smoke check (gating Task 7 — the tag push):**

1. `git config --get gpg.format` must print `ssh`. If not, halt and prompt user to run the 3 setup commands from CLAUDE.md §"Tag signing setup".
2. `git config --get user.signingkey` must print a path to a `.pub` file. If not, halt.
3. `git config --get gpg.ssh.allowedSignersFile` must print a path. If not, halt.
4. `git tag -v phase-57-base` must exit 0 with `Good "git" signature`. This validates the local config can verify an existing signed tag. If exit non-zero, halt and prompt the user to fix.

Wave-6 internal ordering plan per RESEARCH §"Wave 6 sub-bucketing recommendation": types/\* first, then hooks/+domains/+lib/+router/, then routes/\_protected/**, then pages/**, then long-tail components last. Note: Wave 6's PR contains 179 atomic commits + 1 closure-annotation commit — this is by design (D-04 atomic-per-file bisectability); the PR is intentionally large and structured for selective revert if any sub-bucket regresses.

Create branch: `git checkout -b phase-58/wave-6-pages-routes-misc main` (Wave 5 has merged). Confirm Waves 1-5 all merged: `[ "$(grep -rln 'Phase 51 Tier-C' frontend/src/components | grep -vE 'signature-visuals/Sparkline\.tsx|signature-visuals/Donut\.tsx|relationships/RelationshipGraph\.tsx|dossier/MiniRelationshipGraph\.tsx' | grep -E '^frontend/src/components/(forms|empty-states|advanced-search|duplicate-detection|duplicate-comparison|form-auto-save|actionable-errors|active-filters|validation|audit-logs|bulk-actions|elected-officials|entity-comparison|risk-list|triage-panel|version-history-viewer|working-groups|assignments|dossier|dossier-recommendations|dossier-timeline|dossiers|analytics|dashboard-widgets|realtime-status|scenario-sandbox|sla-monitoring|sla-countdown)/' | wc -l)" -eq 0 ]` (no Waves 1-5 surface files remain with Tier-C markers — only Wave-6 catch-all targets + Tier-B carved-out files).

Do NOT edit source files in this task.
</action>
<verify>
<automated>git rev-parse --abbrev-ref HEAD | grep -qx 'phase-58/wave-6-pages-routes-misc' && WAVE6_COUNT=$(awk -F'|' 'NR>2 && $4 ~ /^[[:space:]]*6[[:space:]]*$/' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | wc -l | tr -d ' ') && [ "$WAVE6_COUNT" = "179" ] && PAGES_DOSSIERS_IN_W6=$(awk -F'|' 'NR>2 && $4 ~ /^[[:space:]]*6[[:space:]]*$/ {print $3}' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | grep -c 'pages/dossiers/' || true) && [ "$PAGES_DOSSIERS_IN_W6" = "0" ] && [ "$(git config --get gpg.format)" = "ssh" ] && git tag -v phase-57-base 2>&1 | grep -q 'Good "git" signature'</automated>
</verify>
<acceptance_criteria> - On branch `phase-58/wave-6-pages-routes-misc` - `WAVE6_COUNT` from manifest equals 179 exactly (deterministic per Wave 0 bucketing rules: 268 total - 17 W1 - 15 W2 - 18 W3 - 25 W4 - 14 W5 = 179) - Zero `pages/dossiers/**` rows in Wave 6 manifest subset (claimed by Wave 4 per first-match-wins regex precedence) - SSH-signing smoke check passes: `gpg.format == ssh`, `user.signingkey` set, `allowedSignersFile` set, `git tag -v phase-57-base` exits 0 with `Good "git" signature` - Waves 1-5 confirmed merged (all wave-specific surfaces clean of `Phase 51 Tier-C` except carve-out files) - 58-CONTEXT.md closure-specific specs internalized (tag-message body, closure-annotation format) - No source files modified
</acceptance_criteria>
<done>Executor oriented; manifest deterministic count verified; signing pre-checked; Wave-6 sub-bucketing plan set; branch ready.</done>
</task>

<task type="auto">
  <name>Task 2: Atomic per-file swaps — Wave 6 catch-all (sub-bucketed: types → hooks/domains/lib/router → routes → pages → long-tail components)</name>
  <files>(Wave-6 manifest rows — too many to enumerate inline; exactly 179 files across `frontend/src/types/`, `frontend/src/hooks/`, `frontend/src/domains/`, `frontend/src/lib/`, `frontend/src/router/`, `frontend/src/routes/_protected/`, `frontend/src/pages/`, and unclaimed `frontend/src/components/**`)</files>
  <read_first>
    For EACH file: the file itself + its manifest row. Tier-A precedents already in working memory from Waves 1-5; for types/* lookup tables specifically, re-read `58-PATTERNS.md` §"Pattern 3: D-08 / D-09 Dark-Variant Handling (lookup-table types)" lines 282-306 for the canonical lookup-table shape.

    For high-density files specifically:
    - `types/legislation.types.ts` (63 disables; lookup table) — re-read PATTERNS Pattern 3 first
    - `domains/search/hooks/useSavedSearchTemplates.ts` (40 disables; hook with embedded color map) — apply helper-reuse if possible
    - `components/search/DossierFirstSearchResults.tsx` (62 disables; search result chrome)
    - `components/activity-feed/ActivityFeedFilters.tsx` (49 disables; blue+purple collision per RESEARCH §"Pattern 2: D-07 Blue+Purple Collision" lines 258-280)
    - `components/activity-feed/EnhancedActivityFeed.tsx` (41 disables; blue+purple collision)

</read_first>
<action>
Execute Wave-6 atomic commits in the sub-bucketed order per RESEARCH §"Wave 6 sub-bucketing":

**Sub-bucket A — types/\* lookup tables (22 files)**

Lookup-table files have the most uniform swap pattern: `bg-X-50 dark:bg-X-900/20` + `text-X-700 dark:text-X-300` + `border-X-200 dark:border-X-700` triples per category entry. Per PATTERNS Pattern 3:

- `bg-X-50 dark:bg-X-900/20` → `bg-{semantic}/5 dark:bg-{semantic}/20`
- `text-X-700 dark:text-X-300` → `text-{semantic}` (D-09: drop dark variant)
- `border-X-200 dark:border-X-700` → `border-{semantic}/20 dark:border-{semantic}/70`

For these 22 files, evaluate codemod approach per CONTEXT §"Claude's Discretion" (lines 83): if hand-edit pattern is mechanically uniform across files, a small `jscodeshift` or `ast-grep` transform may save time. Per RESEARCH §"Alternatives Considered" + Deferred Ideas, if a codemod is built it goes into `tools/codemods/` for v7.0+ reuse but is NOT a Phase 58 deliverable. Hand-edit is always the safe path.

Process in disable-density order: legislation.types.ts (63), meeting-minutes.types.ts (45), compliance.types.ts (37), commitment-deliverable.types.ts (35), sla.types.ts (25), availability-polling.types.ts (24), commitment.types.ts (23), engagement-recommendation.types.ts (21), then remaining 14 types/\* files.

Commit message: `style(58-W6/<basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared) [types-lookup-table]`.

**Sub-bucket B — hooks/ + domains/ + lib/ + router/ (~6 files)**

Sparse files. `domains/search/hooks/useSavedSearchTemplates.ts` has 40 disables (a hook with embedded color map for saved-search badges). Identify whether the color map matches a known semantic family (search-result type → likely activity/interaction semantics) — reuse helper from `semantic-colors.ts` if applicable. Otherwise inline D-05 swap.

Commit message: `style(58-W6/<basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared)`.

**Sub-bucket C — routes/\_protected/** (~18 files)\*\*

Page-route components. Each is a TanStack Router route definition; swap is direct (find Tier-C annotation, swap literal). Apply D-05/D-07/D-08/D-09/D-10 as usual.

**Sub-bucket D — pages/** (~33 files)\*\*

Page components. Same pattern as routes. **No `pages/dossiers/**`rows should land in Wave 6 per the Wave 0 manifest precedence rule (Wave 4 claims them via the`^components/(dossier|dossier-recommendations|dossier-timeline|dossiers)/`OR`^pages/dossiers/`regex at first-match-wins). If any`pages/dossiers/**` row appears in Wave 6 at execution time, that is a manifest bug — STOP and re-bucket before Wave 6 starts.**

**Sub-bucket E — long-tail components (~98 files, unclaimed by W1-W5)**

The largest sub-bucket. Notable files:

- `components/search/DossierFirstSearchResults.tsx` (62 disables) — likely dossier-type badges → `getDossierTypeBadgeClass`
- `components/activity-feed/ActivityFeedFilters.tsx` (49, blue+purple collision) — apply D-07; use `getActivityTypeBadgeClass` where applicable
- `components/activity-feed/EnhancedActivityFeed.tsx` (41, blue+purple collision) — apply D-07
- `components/export-import/ImportValidationResults.tsx` (28) — validation states map to danger/warning/success
- `components/stakeholder-timeline/StakeholderTimelineCard.tsx` (25)
- Remaining long-tail by directory: approval-chain, calendar, commitments, contacts, intelligence, positions, waiting-queue, workflow-automation, etc.

For each file in each sub-bucket, apply the canonical swap pattern per CONTEXT D-05..D-10 (identical algorithm to Waves 1-5). Per-file atomic commit; `pnpm lint frontend/src/<file>` exit 0 after each commit.

Throughout Wave 6: respect the Tier-B carve-out. NEVER touch `eslint.config.mjs`, `frontend/src/styles/list-pages.css`, `tools/eslint-fixtures/bad-design-token.tsx`, `components/signature-visuals/Sparkline.tsx`, `components/signature-visuals/Donut.tsx`, `components/relationships/RelationshipGraph.tsx`, `components/dossier/MiniRelationshipGraph.tsx`, or `components/signature-visuals/__tests__/Sparkline.test.tsx`.

No test-grep hits in Wave 6 per RESEARCH §"Test-Grep Hits" (the 3 known hits are all routed to Wave 1 or out of scope) — no `tests/unit/*` updates.
</action>
<verify>
<automated>! grep -rn 'Phase 51 Tier-C' frontend/src/types frontend/src/hooks frontend/src/domains frontend/src/lib frontend/src/router frontend/src/routes frontend/src/pages && [ -z "$(git diff main..HEAD eslint.config.mjs)" ] && [ -z "$(git diff main..HEAD frontend/src/styles/list-pages.css)" ] && [ -z "$(git diff main..HEAD tools/eslint-fixtures/bad-design-token.tsx 2>/dev/null)" ] && [ -z "$(git diff main..HEAD frontend/src/components/signature-visuals/Sparkline.tsx 2>/dev/null)" ] && [ -z "$(git diff main..HEAD frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx 2>/dev/null)" ] && pnpm lint frontend/src/types frontend/src/hooks frontend/src/domains frontend/src/lib frontend/src/router frontend/src/routes frontend/src/pages</automated>
</verify>
<acceptance*criteria> - Every Wave-6 file (per manifest rows where wave==6) has zero `Phase 51 Tier-C` markers - types/* lookup tables use the canonical `bg-{sem}/5 dark:bg-{sem}/20` + `text-{sem}` + `border-{sem}/20 dark:border-{sem}/70` pattern per PATTERNS Pattern 3 - High-density long-tail files (DossierFirstSearchResults, ActivityFeedFilters, EnhancedActivityFeed) reuse helpers where applicable (getDossierTypeBadgeClass / getActivityTypeBadgeClass) - D-07 collision rule applied to flagged files (activity-feed/\_ and others per manifest) - D-08/D-09/D-10 dark-variant rules applied - `pnpm lint` on Wave-6 file set exits 0 - 179 atomic per-file commits (D-04 bisectability — Wave 6 PR is large by design) - Tier-B carve-out preserved: NO diffs to `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx`, `signature-visuals/Sparkline.tsx`, `signature-visuals/Donut.tsx`, `relationships/RelationshipGraph.tsx`, `dossier/MiniRelationshipGraph.tsx`, `Sparkline.test.tsx` - No `--no-verify`; no `--force` push
</acceptance_criteria>
<done>All Wave-6 catch-all files swapped; ready for wave-gate (Task 3) + closure annotation (Task 4).</done>
</task>

<task type="auto">
  <name>Task 3: Wave-6 gate — full lint/type-check/unit + visual baseline regen (activity-page, briefs-page, list-pages re-affirm, settings-page, tasks-tab) + final TOKEN-01 grep</name>
  <files>
    frontend/tests/e2e/activity-page-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/briefs-page-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/settings-page-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/tasks-tab-visual.spec.ts-snapshots/**
  </files>
  <read_first>
    - `58-VALIDATION.md` §"Per-Task Verification Map" rows 58-{1..6}-ZZ-01..03 AND 58-06-CL-01..02 (Wave-6 has additional closure-task rows)
    - `58-RESEARCH.md` §"D-12 LTR≠RTL Byte-Distinction Check"
    - `58-WAVE-MANIFEST.md` Wave-6 rows' `regen_targets`
  </read_first>
  <action>
Run the Wave-6 full gate per CONTEXT D-11 — this is also the Phase 58 PHASE-LEVEL gate since Wave 6 is the last surface wave:

1. `pnpm lint` exit 0 workspace-wide (TOKEN-02 satisfaction)
2. `pnpm type-check` exit 0
3. `pnpm test:unit` green
4. **TOKEN-01 final closure grep**: `! grep -rn 'Phase 51 Tier-C' frontend/src` must return ZERO matches across the entire `frontend/src/` tree. This is the phase-closure assertion — if it fails, identify the leftover file(s), confirm whether they belong to a Wave-1..5 surface (Wave logic bug — fix and amend) or were missed in Wave 6 (add commit), then retry.
5. **TOKEN-02 closure check (D-13 N/A by absence)**: `! grep -E 'tier-c|Tier-C|design-token-tier' eslint.config.mjs` must return ZERO structural matches (only the Tier-B carve-out at lines 247-270 remains, which is OOS per CONTEXT D-13 — its presence is expected, not a violation). The Tier-B carve-out comment text may contain "tier-c" or "Tier-C" as documentation; verify by inspection that no NEW Tier-C-specific block/allowlist/exception exists.
6. **Carve-out byte-identity check**: `git diff phase-57-base..HEAD eslint.config.mjs` should show only Tier-B context lines or zero diffs. If `eslint.config.mjs:247-270` shows changes, REVERT — Tier-B is OOS.

Visual baseline regen per D-12. Wave-6 specs (5): `activity-page-visual`, `briefs-page-visual`, `list-pages-visual` (re-affirm from Wave 2), `settings-page-visual`, `tasks-tab-visual`:

7. `pnpm --filter frontend playwright test frontend/tests/e2e/activity-page-visual.spec.ts frontend/tests/e2e/briefs-page-visual.spec.ts frontend/tests/e2e/list-pages-visual.spec.ts frontend/tests/e2e/settings-page-visual.spec.ts frontend/tests/e2e/tasks-tab-visual.spec.ts --update-snapshots`
8. LTR≠RTL byte-distinction check across ALL 5 spec snapshot dirs:
   ```
   for snap_dir in frontend/tests/e2e/{activity-page,briefs-page,list-pages,settings-page,tasks-tab}-visual.spec.ts-snapshots/; do
     for variant in 1280 768; do
       ltr=$(ls "$snap_dir"*ltr*"$variant"*chromium*.png 2>/dev/null | head -1)
       rtl=$(ls "$snap_dir"*rtl*"$variant"*chromium*.png 2>/dev/null | head -1)
       if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then
         echo "FAIL: byte-identical $ltr/$rtl"
         exit 1
       fi
     done
   done
   ```
9. Phase 57 D-22 closure check (tasks-tab-visual is the Phase 57 baseline): the `tasks-tab-visual.spec.ts-snapshots/` directory must still contain LTR/RTL byte-distinct PNGs after Wave 6's regen. This is the Phase 57 invariant Wave 6 must preserve.

10. Commit regenerated snapshots: `chore(58-W6): regen visual baselines (activity-page, briefs-page, list-pages, settings-page, tasks-tab) + LTR≠RTL byte-distinction reasserted + Phase-57 D-22 invariant preserved`.
    </action>
    <verify>
    <automated>pnpm lint && pnpm type-check && pnpm --filter frontend test:unit && ! grep -rn 'Phase 51 Tier-C' frontend/src && for sdir in frontend/tests/e2e/activity-page-visual.spec.ts-snapshots/ frontend/tests/e2e/briefs-page-visual.spec.ts-snapshots/ frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/ frontend/tests/e2e/settings-page-visual.spec.ts-snapshots/ frontend/tests/e2e/tasks-tab-visual.spec.ts-snapshots/; do for variant in 1280 768; do ltr=$(ls "$sdir"_ltr_"$variant"*chromium*.png 2>/dev/null | head -1); rtl=$(ls "$sdir"*rtl*"$variant"_chromium_.png 2>/dev/null | head -1); if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then echo "FAIL LTR=RTL in $sdir"; exit 1; fi; done; done</automated>
    </verify>
    <acceptance_criteria> - `pnpm lint` / `pnpm type-check` / `pnpm test:unit` exit 0 workspace-wide - **TOKEN-01 satisfied**: `! grep -rn 'Phase 51 Tier-C' frontend/src` returns zero matches across the entire tree - **TOKEN-02 satisfied (D-13 absence)**: no NEW Tier-C-specific block in `eslint.config.mjs`; Tier-B carve-out byte-identical to phase-57-base - 5 visual baselines regenerated and committed in same PR - LTR≠RTL byte-distinction preserved on all 5 regenerated specs across viewports - Phase 57 D-22 invariant preserved on `tasks-tab-visual.spec.ts-snapshots/`
    </acceptance_criteria>
    <done>Phase-level TOKEN-01 + TOKEN-02 gates pass; ready for closure-annotation task (Task 4).</done>
    </task>

<task type="auto">
  <name>Task 4: Append `## Phase 58 Closure` section to 51-DESIGN-AUDIT.md (D-16) — annotation commit on wave-6 branch only</name>
  <files>
    .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md
  </files>
  <read_first>
    - `58-CONTEXT.md` §"Specifics" line 192 (closure-annotation contents)
    - `58-CONTEXT.md` §D-16 (closure annotation protocol)
    - `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` (read enough to know where to APPEND the `## Phase 58 Closure` section — at the end of the document, after the existing Tier-C Disposition Table and slug index)
    - `.planning/phases/51-design-token-compliance-gate/51-VERIFICATION.md` lines 8-17 (canonical 2336/2245/91-delta reconciliation note — quote this in the closure annotation)
  </read_first>
  <action>
**Closure annotation — append `## Phase 58 Closure` to 51-DESIGN-AUDIT.md (D-16):**

This task is CLOSURE-ANNOTATION-ONLY. The tag cut + push happens in Task 7 (post-merge), strictly on the merge commit on `main`. Do NOT cut the tag here.

Open `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md`. Append (at end of file) a new H2 section `## Phase 58 Closure` containing:

1. Closure date and final commit SHA placeholder (`<post-merge-sha>` — filled in by Task 7 after PR merges, OR left as `(see phase-58-base tag annotation)` and back-referenced from the tag-message body)
2. Reconciliation table (per CONTEXT §Specifics line 192):

   ```
   | wave | files | annotations_cleared | nodes_swapped | regen_targets_updated                                                    | commit_sha_range |
   |------|------:|--------------------:|--------------:|--------------------------------------------------------------------------|------------------|
   | 0    | 1*    | 0                   | 0             | (none — manifest only)                                                   | <sha-of-W0>      |
   | 1    | 17    | <actual>            | <actual>      | after-actions-page-visual[, tailwind-remap-visual]                       | <range>          |
   | 2    | 15    | <actual>            | <actual>      | list-pages-visual[, tailwind-remap-visual]                               | <range>          |
   | 3    | 18    | <actual>            | <actual>      | dossier-drawer-visual, calendar-visual, kanban-visual, tasks-page-visual | <range>          |
   | 4    | 25    | <actual>            | <actual>      | dossier-drawer-visual (re-affirm), dashboard-visual                      | <range>          |
   | 5    | 14    | <actual>            | <actual>      | dashboard-visual (re-affirm), dashboard-widgets-visual                   | <range>          |
   | 6    | 179   | <actual>            | <actual>      | activity-page, briefs-page, list-pages (re-affirm), settings-page, tasks-tab | <range>          |
   |Total | 268   | 2227                | 2336          | (all distinct specs above)                                               | <full-range>     |
   ```

   \*Wave 0 row's "files" column shows 1 documentary artifact (the manifest itself); no source-file modifications.

3. Reconciliation note (quoted/paraphrased from 51-VERIFICATION D-12):
   "Original counts: 271 files (51-DESIGN-AUDIT.md row count) / 2336 AST Literal nodes (51-VERIFICATION D-12) / 2227 disable lines (live-grep at phase-57-base). Live-grep delta of 3 files (KanbanTaskCard.tsx, KanbanBoard.tsx, pages/engagements/workspace/TasksTab.tsx) was already swept by Phases 52/57 pre-Phase-58 (documented in 58-RESEARCH.md §Summary). The 91-line delta between 2336 AST nodes and 2245 source lines (51-VERIFICATION D-12) accounts for multi-Literal-per-line cases handled per-row via the manifest's `multi_literal_line == yes` flag."

4. Cross-link: "See `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-VERIFICATION.md` for the post-execution Phase 58 verification artifact (produced by `/gsd:verify-work 58`)."

5. Deferred-tier-c → cleared mapping: a brief paragraph noting that every TBD `follow_up_phase` placeholder in the Tier-C Disposition Table above (e.g., "purple/violet/fuchsia/pink/indigo -> TBD (likely chart-token cleanup wave)") is resolved to "Phase 58" per CONTEXT D-06 (purple-family → `accent` family with D-07 collision override).

6. Criterion #2 N/A documentation (CONTEXT D-13): "Success Criterion #2 (`eslint.config.mjs` waiver token removal) was satisfied by absence at phase-57-base. The ROADMAP §Phase-58 paraphrase referenced a marker `gsd-design-token-tier-c-allow` that never existed in code; the actual marker is the per-line annotation `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` which Phase 58 removed. `grep -E 'tier-c|Tier-C|design-token-tier' eslint.config.mjs` returns zero structural matches at phase-58-base. The Tier-B carve-out at `eslint.config.mjs:247-270` remains untouched per Phase 51 D-03/D-13 + v6.4 OOS clause."

Commit on the `phase-58/wave-6-pages-routes-misc` branch. Commit message: `docs(58): append Phase 58 closure annotation to 51-DESIGN-AUDIT.md (D-16; reconciliation table + deferred-tier-c → cleared mapping)`.

This annotation commit lands on the wave-6 feature branch and rides into `main` as part of the wave-6 PR merge in Task 5.
</action>
<verify>
<automated>git log --format=%s -1 | grep -q 'append Phase 58 closure annotation' && grep -q '^## Phase 58 Closure' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md && grep -q 'reconciliation' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md && grep -q '58-VERIFICATION.md' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md</automated>
</verify>
<acceptance_criteria> - `## Phase 58 Closure` section appended to `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` - Section contains: reconciliation table (7 wave rows + total), reconciliation note quoting 51-VERIFICATION D-12, cross-link to 58-VERIFICATION.md, deferred-tier-c → cleared mapping, criterion #2 N/A documentation - Commit lands on `phase-58/wave-6-pages-routes-misc` branch with the exact message above - NO tag operations performed in this task (tag is cut post-merge in Task 7)
</acceptance_criteria>
<done>Closure annotation committed on wave-6 branch; ready to open + merge wave-6 PR (Task 5).</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 5: Open + merge Wave 6 PR (closure annotation included)</name>
  <files>(PR creation; no source edits)</files>
  <read_first>`58-CONTEXT.md` §"Specifics" lines 188-189 (PR title + closure-commit conventions); Phase 55 D-13 (8 required CI contexts)</read_first>
  <what-built>
    Wave-6 PR `phase-58/wave-6-pages-routes-misc` → `main` opened and merged. PR contains 179 atomic per-file source swap commits + 1 closure-annotation commit on 51-DESIGN-AUDIT.md. After merge, `main` HEAD is the canonical commit that Task 7 will tag as `phase-58-base`.
  </what-built>
  <action>
Push: `git push -u origin phase-58/wave-6-pages-routes-misc`. Open PR via `gh pr create`:
- Title: `phase-58/wave-6-pages-routes-misc: pages/routes/misc token swap + Phase 58 closure annotation (179 files / <M> nodes / <K> annotations cleared; 51-DESIGN-AUDIT.md annotated)`
- Base: `main`
- Body sections:
  - Summary: Phase 58 closure — TOKEN-01 + TOKEN-02 satisfied (tag push happens post-merge in Task 7)
  - Per-sub-bucket file counts (types: 22, hooks/domains/lib/router: 6, routes: 18, pages: 33, long-tail: 98+ — total exactly 179 per Wave-6 deterministic count assertion in Task 1)
  - Verification evidence: `pnpm lint`, `pnpm type-check`, `pnpm test:unit` outputs; final `grep -rn 'Phase 51 Tier-C' frontend/src` exit-1 (zero matches)
  - 5-spec visual regen evidence + LTR≠RTL byte-distinction outputs
  - Closure artifact: link to 51-DESIGN-AUDIT.md `## Phase 58 Closure` section commit (from Task 4)
  - No-touch attestation: `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx`, Sparkline.tsx, Donut.tsx, RelationshipGraph.tsx (singular — Tier-B carve-out), MiniRelationshipGraph.tsx, Sparkline.test.tsx — `git diff phase-57-base..HEAD` shows zero changes to these paths
  - Post-merge plan: Task 7 cuts `phase-58-base` SSH-signed tag on the merge commit; Task 7 also pushes the ROADMAP+STATE updates

Wait for 8 CI contexts to pass per Phase 55 D-13. No `--admin`, no `--no-verify`. Merge via `gh pr merge --merge` (preserve atomic per-file commits — Wave 6 PR has 180 commits total = 179 source + 1 annotation; all bisectable).
</action>
<how-to-verify> 1. Run `gh pr list --state merged --head phase-58/wave-6-pages-routes-misc --json number,title,mergedAt` — must list the merged PR 2. Run `git fetch origin && git checkout main && git pull --ff-only origin main` — main HEAD now contains the wave-6 merge commit 3. Run `git log -1 --format=%s` — must show `Merge pull request` (or similar — confirms HEAD is a merge commit, not a feature-branch commit) 4. Run `grep -rn 'Phase 51 Tier-C' frontend/src` — must return zero matches on `main` 5. Run `grep -q '^## Phase 58 Closure' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` — must exit 0 (closure annotation present on `main`)
</how-to-verify>
<resume-signal>Type "approved" if all 5 verification steps pass. If any fails, describe which one and the observed output; do NOT proceed to Task 7 (tag cut).</resume-signal>
</task>

<task type="auto">
  <name>Task 6: Update ROADMAP.md and STATE.md to mark Phase 58 complete (commit on a small follow-up branch)</name>
  <files>.planning/ROADMAP.md, .planning/STATE.md</files>
  <read_first>
    - `.planning/ROADMAP.md` Progress table (find the Phase 58 row)
    - `.planning/STATE.md` current-phase position + completed-phases list
    - `58-CONTEXT.md` §D-15 (closure-commit convention)
  </read_first>
  <action>
After Task 5 has merged the wave-6 PR to main and Task 7 has cut + pushed the `phase-58-base` tag, create a small follow-up branch to record the ROADMAP + STATE updates. (Order: Task 7 runs FIRST so the SHA referenced here is the tag SHA.)

1. `git checkout -b phase-58/closure-state-roadmap main && git pull --ff-only origin main`
2. `.planning/ROADMAP.md`: change `| 58 | v6.4 | 0/0 | Not started | — |` to `| 58 | v6.4 | 7/7 | Complete | YYYY-MM-DD |` (substitute actual closure date)
3. `.planning/STATE.md`: update current phase position and add Phase 58 to completed-phases list with closure date and `phase-58-base` SHA (= the SHA pushed by Task 7)
4. Commit: `chore(58): mark Phase 58 complete in STATE/ROADMAP (TOKEN-01 + TOKEN-02 closed, phase-58-base tag pushed)`
5. Push branch + open + merge follow-up PR `phase-58/closure-state-roadmap` → main (small docs-only PR; CI is fast)
6. Update 58-VALIDATION.md Wave-6 + closure task rows ⬜ → ✅
   </action>
   <verify>
   <automated>grep -E '^\| _58 _\|.\*Complete' .planning/ROADMAP.md && grep -q 'phase-58-base' .planning/STATE.md</automated>
   </verify>
   <acceptance_criteria> - ROADMAP.md Phase 58 row reads `7/7 | Complete | <date>` - STATE.md updated with Phase 58 closure record and `phase-58-base` SHA (= the SHA from Task 7) - `phase-58/closure-state-roadmap` PR opened and merged to main - 58-VALIDATION.md Wave-6 + closure task rows updated to ✅
   </acceptance_criteria>
   <done>Phase 58 marked complete in roadmap + state.</done>
   </task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 7: Cut + push phase-58-base SSH-signed tag (post-merge, canonical sequence — tag on merge commit only)</name>
  <files>(git tag operations; no source edits)</files>
  <read_first>
    - `58-CONTEXT.md` §"Specifics" line 190 (exact tag-message body — verbatim)
    - `58-CONTEXT.md` §D-15 (closure-tag protocol)
    - `CLAUDE.md` §"Tag signing setup" (SSH-signed annotated tag protocol — `git tag -s` syntax)
  </read_first>
  <what-built>
    `phase-58-base` annotated SSH-signed tag created on the merge commit on `main` (post-Wave-6-merge), pushed to origin, verifiable locally and remotely via `git tag -v phase-58-base` returning `Good "git" signature`. The tag points STRICTLY at a commit on `main` (never on a feature-branch HEAD).
  </what-built>
  <action>
**Pre-flight smoke check (signing config sanity):**

```bash
git tag -v phase-57-base
```

Must exit 0 with `Good "git" signature`. This re-confirms the same SSH-signing config that Task 1 verified is still in place at Task 7 execution time. If exit non-zero: STOP, do NOT attempt to cut `phase-58-base`. Prompt the user to re-validate the 3 setup commands from CLAUDE.md §"Tag signing setup".

**Step 1 — Ensure on the merged main HEAD:**

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
```

`--ff-only` guards against accidentally merging local changes into main; if `pull` fails because main has diverged locally, STOP and investigate (the executor should be on a clean main).

**Step 2 — Verify HEAD is the wave-6 merge commit:**

```bash
git log -1 --format=%s
```

Output must contain the wave-6 PR merge subject (typically `Merge pull request #<N> from <repo>/phase-58/wave-6-pages-routes-misc` for a `--merge` strategy). If HEAD is NOT a merge commit (e.g., the executor accidentally is on the wave-6 feature branch, or a squash-merge happened — `--merge` is required per Task 5 to preserve atomic commits), STOP. The tag must point at a merge commit on `main`, not a feature-branch commit.

**Step 3 — Cut the annotated SSH-signed tag:**

```bash
git tag -s -a phase-58-base -m "Phase 58 — Tier-C design-token suppression full clear. 271 files / 2336 AST nodes / 2227 disable lines cleared via wave-staged token swaps. TOKEN-01 + TOKEN-02 satisfied. \`pnpm lint\` exits 0; \`grep -r 'Phase 51 Tier-C' frontend/src\` returns zero. Criterion #2 (eslint.config.mjs waiver token removal) — N/A by absence, documented in 58-VERIFICATION.md."
```

The `-s` flag invokes SSH signing because `git config gpg.format == ssh` and `user.signingkey` is set per CLAUDE.md tag-signing setup. The `-a` flag forces annotated form (required for `-m`). The tag-message body is the exact verbatim string from 58-CONTEXT.md §Specifics line 190 (escape the backticks in shell as shown).

**Step 4 — Verify tag locally:**

```bash
git tag -v phase-58-base
```

Must exit 0 with `Good "git" signature`. If exit non-zero or "no signature" / "bad signature": STOP, do NOT push. Diagnose:

- `Good "ssh" signature from "..."` (wrong identity) → check `allowed_signers` file
- `error: gpg.ssh.allowedSignersFile is not set` → re-run `git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers`
- No signature → re-cut with `-s` flag explicitly

DELETE the bad local tag (`git tag -d phase-58-base`) before re-cutting if any of the above fail.

**Step 5 — Push tag to origin:**

```bash
git push origin phase-58-base
```

If push fails on branch protection / tag protection: investigate. Phase 57 precedent succeeded (per CLAUDE.md tag-signing setup section); the project does not currently block tag pushes.

**Step 6 — Re-verify on origin:**

```bash
git ls-remote --tags origin phase-58-base
```

Must return a line with the tag (e.g., `<sha>	refs/tags/phase-58-base`). Confirms the tag is on origin.

**Canonical sequence — no rollback path needed:**

This task runs STRICTLY AFTER Task 5 has merged the wave-6 PR to main. The tag is cut on the merge commit, never on a feature-branch HEAD. There is no rollback subroutine for "tag-cut-pre-merge" because pre-merge tag cutting is structurally unreachable in this task ordering.
</action>
<how-to-verify> 1. Pre-flight: `git tag -v phase-57-base` exits 0 with `Good "git" signature` (smoke check passed before cutting phase-58-base) 2. Run `git tag -l phase-58-base` — must list the tag 3. Run `git tag -v phase-58-base` — must exit 0 with `Good "git" signature` (NOT a generic "good signature from..." — the literal string `git` because that's the SSH signer identity per CLAUDE.md) 4. Run `git fetch --tags origin && git ls-remote --tags origin | grep phase-58-base` — must show the tag on origin 5. Run `git merge-base --is-ancestor phase-58-base origin/main && echo OK` — must print `OK` (confirms the tag points to a commit that is an ancestor of `origin/main`, i.e., the tag is on the main branch line, not on a stale feature branch) 6. Run `git rev-list phase-58-base --max-count=1` and confirm the printed SHA matches the wave-6 merge commit SHA from Task 5 verification step 2
</how-to-verify>
<resume-signal>Type "approved" if all 6 verification steps pass and the tag is pushed to origin. If any fails, describe which one and the observed output; if the tag was cut locally but failed to push or failed verification, DELETE the local tag (`git tag -d phase-58-base`) before retrying.</resume-signal>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                       | Description                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| dev machine → catch-all surface (179 files)    | Largest swap surface; carve-out paths must be preserved                                                                     |
| dev machine → 51-DESIGN-AUDIT.md (cross-phase) | Closure annotation modifies a Phase-51 artifact (intentional cross-phase update per D-16)                                   |
| dev machine → phase-58-base tag                | SSH-signed annotated tag; signing config must be verified before push; tag is cut strictly on the post-merge commit on main |
| dev machine → origin remote                    | Tag push; branch protection blocks tags? confirm tag push works (Phase 57 precedent succeeded)                              |

## STRIDE Threat Register

| Threat ID  | Category    | Component                                            | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------- | ---------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-58-06-01 | Tampering   | Catch-all source swaps (179 files)                   | mitigate    | Per-file `pnpm lint` exit 0 (D-04); sub-bucketed ordering; manifest-driven file list; deterministic Wave-6 count assertion in Task 1                                                                                                                                                                                                                                                    |
| T-58-06-02 | Tampering   | Tier-B carve-out paths                               | mitigate    | Acceptance criteria assert no diffs to 7 carve-out paths; reviewer inspection; NOTE: Carve-out byte-identity applies to `components/relationships/RelationshipGraph.tsx` (singular directory). The file `components/dossiers/RelationshipGraph.tsx` (plural directory) is a DIFFERENT file — intentionally modified by Wave 4 and must NOT be in the carve-out byte-identity diff list. |
| T-58-06-03 | Tampering   | 51-DESIGN-AUDIT.md cross-phase update                | mitigate    | Closure annotation APPENDS only (does not modify existing rows); preserves provenance                                                                                                                                                                                                                                                                                                   |
| T-58-06-04 | Spoofing    | phase-58-base tag identity                           | mitigate    | SSH signing pre-checked via `git tag -v phase-57-base` smoke check (Task 1 + Task 7 pre-flight); `git tag -v phase-58-base` confirms `Good "git" signature` post-cut; tag cut strictly on post-merge commit (Task 7 step 2 enforces) — no pre-merge-tag footgun                                                                                                                         |
| T-58-06-05 | Repudiation | Closure commit attribution                           | mitigate    | Signed commits per repo convention; tag-message body contains exact closure text from CONTEXT                                                                                                                                                                                                                                                                                           |
| T-58-06-06 | Tampering   | Visual baselines (5 specs)                           | mitigate    | LTR≠RTL byte-distinction check; Phase 57 D-22 invariant preserved on tasks-tab                                                                                                                                                                                                                                                                                                          |
| T-58-06-07 | Tampering   | Manifest precedence drift (`pages/dossiers/**` leak) | mitigate    | Task 1 asserts zero `pages/dossiers/**` rows in Wave-6 manifest subset; if non-zero, STOP and re-bucket                                                                                                                                                                                                                                                                                 |
| T-58-06-SC | Tampering   | npm/pip/cargo installs                               | accept      | N/A — Phase 58 installs no new packages per RESEARCH §"Package Legitimacy Audit"                                                                                                                                                                                                                                                                                                        |

</threat_model>

<verification>
- TOKEN-01: zero `Phase 51 Tier-C` markers in `frontend/src` (final phase-level grep)
- TOKEN-02: `pnpm lint` exits 0; no NEW Tier-C-specific block in `eslint.config.mjs` (D-13 absence)
- D-04: 179 atomic per-file commits in Wave 6 PR (bisectable)
- D-12: 5 visual baselines regenerated; LTR≠RTL preserved
- D-15: phase-58-base annotated SSH-signed tag pushed; `git tag -v phase-58-base` exit 0 with `Good "git" signature`; tag is ancestor of `origin/main`
- D-16: 51-DESIGN-AUDIT.md `## Phase 58 Closure` section appended with reconciliation table, deferred → cleared mapping, criterion #2 N/A documentation
- Phase 57 D-22 invariant preserved (tasks-tab LTR≠RTL byte-distinct)
- Tier-B carve-out byte-identical to phase-57-base (NOTE: carve-out file is `components/relationships/RelationshipGraph.tsx` singular — distinct from Wave-4 target `components/dossiers/RelationshipGraph.tsx` plural)
- Wave-6 manifest count = 179 (deterministic per Task 1 assertion)
- Zero `pages/dossiers/**` rows in Wave-6 manifest subset (Wave 4 claims them per precedence)
</verification>

<success_criteria>
Phase 58 closed when:

1. Wave-6 PR merged (Task 5) with 179 atomic per-file source-swap commits + 1 closure-annotation commit (Task 4)
2. `grep -rn 'Phase 51 Tier-C' frontend/src` returns zero matches on `main`
3. `pnpm lint && pnpm type-check && pnpm test:unit` exit 0
4. `phase-58-base` annotated SSH-signed tag pushed to origin (Task 7); `git tag -v phase-58-base` exits 0 with `Good "git" signature`; tag is an ancestor of `origin/main` (cut on the merge commit, not a feature-branch HEAD)
5. 51-DESIGN-AUDIT.md has `## Phase 58 Closure` section
6. ROADMAP.md + STATE.md updated to mark Phase 58 complete (Task 6, follow-up PR)
7. Tier-B carve-out untouched (eslint.config.mjs, list-pages.css, bad-design-token.tsx, Sparkline.tsx, Donut.tsx, `components/relationships/RelationshipGraph.tsx` (singular), MiniRelationshipGraph.tsx, Sparkline.test.tsx all byte-identical to phase-57-base — distinct from Wave-4 target `components/dossiers/RelationshipGraph.tsx` plural)
8. Next workflow step is `/gsd:verify-work 58` to produce `58-VERIFICATION.md`
   </success_criteria>

<output>
Create `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-06-SUMMARY.md` after merge + tag push. SUMMARY captures: per-sub-bucket file counts (totaling exactly 179), helper-reuse adoption (`getDossierTypeBadgeClass`, `getActivityTypeBadgeClass`, `getStatusBadgeClass`, etc.), D-07 collision count (activity-feed family flagged), 5-spec visual regen evidence, closure-annotation commit SHA (from Task 4), `phase-58-base` tag SHA and `git tag -v` output (from Task 7), links to Wave-6 PR + merge commit + closure-state-roadmap follow-up PR, total phase-level annotation count cleared (2227 expected), reconciliation note matching 51-VERIFICATION D-12, next-step instruction (`/gsd:verify-work 58`).
</output>
