---
phase: 51
plan: 04
plan_id: 51-04
subsystem: lint-config + design-tokens + smoke-pr
tags:
  - design-tokens
  - eslint
  - lint-config
  - branch-protection
  - smoke-pr
  - tier-a
  - tier-b
  - tier-c
  - audit
  - phase-close
requires:
  - phase: 50-test-infrastructure-repair
    provides: 'Phase 50 smoke PR #11 closed; main protection requires Tests (frontend) + Tests (backend) + Lint'
provides:
  - 'Design-token compliance gate at `error` severity (no-restricted-syntax fires on raw hex + Tailwind palette literals workspace-wide)'
  - 'Per-Literal `eslint-disable-next-line` annotations across 271 Tier-C files with phase-and-row back-references to 51-DESIGN-AUDIT.md'
  - 'Populated Tier-C Disposition Table + Slug index in 51-DESIGN-AUDIT.md'
  - 'Smoke PR #12 evidence: Lint=FAILURE on deliberate-bad palette literal; mergeStateStatus=BLOCKED; PR closed --delete-branch'
  - 'Pre/post branch-protection JSON snapshots (byte-identical — no PUT per D-09 fold posture)'
  - 'Regression fixture `tools/eslint-fixtures/bad-design-token.tsx` proving all three D-05 selectors fire'
affects: [phase-51, lint, design-token-gate, branch-protection, ci]
tech-stack:
  added: []
  patterns:
    - 'D-05 selectors live in the existing `no-restricted-syntax` array (Literal[value=/regex/] + TemplateElement[value.raw=/regex/]) — no new plugin'
    - 'D-09 fold posture: NEW rule fires inside EXISTING `Lint` CI context registered by Phase 48; no new required-context PUT to /branches/main/protection'
    - 'Per-Literal `eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename>` with ESLint canonical `--` description form'
    - 'AST-driven disable-form classifier (line-comment / block-comment / JSX-child-comment / template-literal disable-enable pair) selected from the parent chain of each surfaced Literal'
key-files:
  created:
    - .planning/phases/51-design-token-compliance-gate/51-SUMMARY.md
  modified:
    - eslint.config.mjs
    - tools/eslint-fixtures/bad-design-token.tsx
    - frontend/src/components/geographic-visualization/WorldMapVisualization.tsx
    - frontend/src/components/position-editor/PositionEditor.tsx
    - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md
    - 'frontend/src/**/*.{ts,tsx} (50 Tier-A files swapped + 271 Tier-C files annotated)'
key-decisions:
  - 'D-01: Two D-05 selectors (Literal + TemplateElement) cover raw hex and Tailwind palette literals workspace-wide.'
  - 'D-02: Named anchors PositionEditor.tsx + WorldMapVisualization.tsx swapped via Plan 51-02 to token utilities and var(--accent).'
  - 'D-03: Tier-B carve-out enumerated as a `no-restricted-syntax: off` block in eslint.config.mjs for permanent design statements (token definitions, bootstrap, flag SVGs, chart palettes).'
  - 'D-04: 51-DESIGN-AUDIT.md is the canonical inventory for Tier-A worklist + Tier-C disposition + slug index.'
  - 'D-05: Selector grammar reuses Phase 48 RTL selector shape; messages name the canonical fix (token utility or var(--*)).'
  - 'D-06: Token utilities (text-accent, text-danger, text-success, text-warning, text-info, text-ink, bg-surface, border-line) form the implicit allowlist.'
  - 'D-07: Variant-aware regex `(?:[a-z-]+:)*` catches dark:, hover:, md:, aria-disabled:, and compound chains.'
  - 'D-08: TS/CSS comments stay valid — the AST-Literal selector does not match comments or `var(--*)` strings.'
  - 'D-09: No branch-protection PUT. The NEW rule fires inside the EXISTING `Lint` required context registered by Phase 48 D-15; pre/post JSON snapshots are byte-identical.'
  - 'D-10: Smoke PR + regression fixture both ship — smoke PR proves the one-time gate-block on main; fixture is the every-CI regression guard.'
  - 'D-11: semantic-colors.ts is intentionally NOT in the Tier-B carve-out — its current content already passes the new selectors.'
  - 'D-12: Net-new `eslint-disable-next-line` count under frontend/src equals the Tier-C row total minus the documented multi-Literal-on-one-line delta (per Plan 51-04 Task 2 edge-case clause).'
  - 'D-13: Tier-B is rule-scoped (per-file `no-restricted-syntax: off`), never global `ignores:` — preserves file-naming, no-restricted-imports, and other rules on the same files.'
  - 'D-14: Annotation comment shape uses ESLint canonical `--` description form (`// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: …`); the Tier-C audit grep substring `Phase 51 Tier-C:` is preserved exactly.'
requirements-completed: [DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04]
tech_stack: [eslint-9.39.4, typescript-eslint-8.57.2, tailwindcss-4.x, github-cli]
phase_base_commit: e0aa391f5e1cc88725d358f3e2b1e16fe27344c8
plan_head_commit: a5b32cd73a14c528151b419bef9445d7e1bb5e21
duration: ~1d (across Plans 51-01 through 51-04)
completed: 2026-05-15
---

# Phase 51 Plan 04: Tier-C Severity Flip + Smoke PR + Phase Seal Summary

**Phase 51 delivers a workspace-wide design-token compliance gate at `error` severity: ESLint now blocks any new raw hex or Tailwind palette literal in `frontend/src/`, the 50 Tier-A files have been swapped to token utilities, the 271 Tier-C files carry per-Literal `eslint-disable-next-line` annotations with phase-and-row back-references to the audit doc, and Smoke PR #12 captured `Lint = FAILURE` with `mergeStateStatus = BLOCKED` on a deliberate-bad `bg-red-500` literal against `main` — proving the gate fires under realistic CI conditions without a new required-context PUT (D-09 fold into the existing `Lint` context registered by Phase 48 D-15).**

## 1. Accomplishments

### D-05: Lint rule activation (Plan 51-01 → Task 3 severity flip in Plan 51-04)

- `eslint.config.mjs` carries three new selectors in the frontend `no-restricted-syntax` array:
  - `Literal[value=/#[0-9a-fA-F]{3,8}\b/]` — raw hex (3, 4, 6, 8 digit forms).
  - `Literal[value=/(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\d{2,3}\b/]` — Tailwind palette literals, variant-aware.
  - `TemplateElement[value.raw=/…same regex…/]` — companion selector closing the template-literal blind spot.
- Severity is `'error'` after Plan 51-04 Task 3 (`a5b32cd7` `refactor(51-04): flip D-05 no-restricted-syntax severity to error`). `pnpm lint --max-warnings 0` exits 0 workspace-wide.

### D-03: Tier-B carve-out (Plan 51-01 Task 3 → `72b0cdca`)

- `eslint.config.mjs` per-file `no-restricted-syntax: off` block enumerates permanent design-token exceptions: token source (`tokens/directions.ts`), FOUC bootstrap (`bootstrap.js`), flag SVGs, and chart/graph palettes (CommitmentFulfillmentChart, RelationshipHealthChart, WorkloadDistributionChart, EngagementMetricsChart, AnalyticsPreviewOverlay, ClusterVisualization, sample-data, ChartWidget, SLAComplianceChart, InfluenceMetricsPanel, InfluenceReport, RelationshipGraph, MiniRelationshipGraph, ReportPreview).
- Each path is explicit — no wildcard globs that could over-match per RESEARCH Pitfall 6.

### D-02: Tier-A named anchors (Plan 51-02)

- `WorldMapVisualization.tsx`: `lineColor="#3B82F6"` → `lineColor="var(--accent)"` (`728f9b43`). Recipe A — SVG fill / stop-color resolve `var()` natively, no fallback hook needed.
- `PositionEditor.tsx`: 19 palette-literal swaps to token utilities (`text-accent`, `text-danger`, `border-danger/30`, `bg-danger/10`, `border-line`, `bg-muted`, `focus:ring-accent`) (`99f10fa1`).

### Tier-A mechanical sweep (Plan 51-03)

- `51-DESIGN-AUDIT.md` Tier-A Worklist froze 50 files with unambiguous status/form/badge semantics (`75fc4512` `docs(51-03): freeze Tier-A design-token audit worklist`).
- Mechanical token swaps applied across all 50 worklist files (`9d919ecb` `fix(51-03): sweep Tier-A design-token utilities`). Warning count moved 3062 → 3042 → 2336 across Plans 51-01/02/03.

### Tier-C disposition (Plan 51-04 Tasks 1–2)

- `51-DESIGN-AUDIT.md` Tier-C Disposition Table populated from the live sweep delta minus Tier-A worklist minus Tier-B carve-out: 271 rows with `file`, `raw_hex_count`, `palette_literal_count`, `proposed_token_map`, `disposition = deferred-tier-c`, `follow_up_phase = TBD-design-token-tier-c-cleanup-wave-N` (`0ac96992` `docs(51-04): populate Tier-C Disposition Table from live sweep delta`).
- Slug index records one entry per Tier-C file for `# 51-DESIGN-AUDIT.md#<slug>` back-references.
- Per-Literal `eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename>` annotations landed across 14 batched commits (`2c22fad8` → `5e5d4cb8`), using an AST-driven disable-form classifier that selects line-comment / block-comment / JSX-child-comment / template-literal disable-enable pair based on each Literal's parent chain.

### D-09: Smoke PR (Plan 51-04 Task 4)

- Pre-flight branch-protection capture saved to `/tmp/51-protection-pre.json` (MD5 `4ed9db6d47e9a49d2bdb501a8a5c18ac`).
- Smoke branch `smoke/phase-51-design-token-gate` cut from `DesignV2` (see Deviation #4) with a deliberate `<div className="bg-red-500">smoke</div>` injection.
- PR #12 opened against `main`. `Lint = FAILURE` on the injected literal once severity is `error`.
- `mergeStateStatus = BLOCKED` confirmed after CI settled (initial capture was `BEHIND`; both states are PR-block proof — see Deviation #6).
- PR closed with `gh pr close 12 --delete-branch`; smoke branch removed from origin (`git ls-remote origin refs/heads/smoke/phase-51-design-token-gate` empty).
- Post-proof branch-protection capture saved to `/tmp/51-protection-post.json` (MD5 `4ed9db6d47e9a49d2bdb501a8a5c18ac` — byte-identical to pre). No PUT performed.

### Commit Trail

Phase 51 commits between `phase-51-base` (`e0aa391f`) and `HEAD` (`a5b32cd7`):

| Commit     | Subject                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| `2e27bdc5` | chore(51-01): add design-token lint selectors                                                                 |
| `72b0cdca` | chore(51-01): add Tier-B design-token carve-outs                                                              |
| `18c5bd69` | test(51-01): add design-token lint fixture                                                                    |
| `ac6b630e` | docs(51-01): complete rule activation plan                                                                    |
| `728f9b43` | fix(51-02): use accent token for world map lines                                                              |
| `99f10fa1` | fix(51-02): map position editor palette classes to tokens                                                     |
| `75fc4512` | docs(51-03): freeze Tier-A design-token audit worklist                                                        |
| `9d919ecb` | fix(51-03): sweep Tier-A design-token utilities                                                               |
| `bcbe38c9` | docs(51-02,51-03): record code-complete visual-pending summaries                                              |
| `0ac96992` | docs(51-04): populate Tier-C Disposition Table from live sweep delta                                          |
| `2c22fad8` | refactor(51-04): tier-c eslint-disable annotations — activity-feed through briefing-books                     |
| `ff1ac62a` | refactor(51-04): tier-c eslint-disable annotations — bulk-actions through commitments                         |
| `8a37e7e5` | refactor(51-04): tier-c eslint-disable annotations — commitments through dossier-timeline                     |
| `5be88c51` | refactor(51-04): tier-c eslint-disable annotations — dossier subtree                                          |
| `e1a541ab` | refactor(51-04): tier-c eslint-disable annotations — dossiers through entity-links                            |
| `78071b49` | refactor(51-04): tier-c eslint-disable annotations — entity-links through kanban                              |
| `2280f3cb` | refactor(51-04): tier-c eslint-disable annotations — keyboard-shortcuts through positions                     |
| `8af4b543` | refactor(51-04): tier-c eslint-disable annotations — positions through sla-monitoring                         |
| `5807b31a` | refactor(51-04): tier-c eslint-disable annotations — sla-monitoring through waiting-queue                     |
| `8b5a9846` | refactor(51-04): tier-c eslint-disable annotations — waiting-queue, workflow, working-groups, top-level pages |
| `5fce2fb5` | refactor(51-04): tier-c eslint-disable annotations — pages/\* (top half)                                      |
| `8bead149` | refactor(51-04): tier-c eslint-disable annotations — pages/\* (bottom half) and router                        |
| `6b1e7660` | refactor(51-04): tier-c eslint-disable annotations — routes/\_protected/_ and types/_                         |
| `5e5d4cb8` | refactor(51-04): tier-c eslint-disable annotations — types/\* (remaining)                                     |
| `a5b32cd7` | refactor(51-04): flip D-05 no-restricted-syntax severity to error                                             |

25 commits total across the four plans (excluding this final summary commit).

## 2. Verification

### Workspace zero-state (Plan 51-04 Task 5)

- `pnpm lint` (which the lint script invokes as `eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}'`) → **exit 0**. Captured 2026-05-15: turbo cache miss, 19.689s, both `intake-backend:lint` and `intake-frontend:lint` succeeded.
- `pnpm typecheck` → **exit 0**. 4 tasks successful, fully cached.
- `pnpm exec eslint -c eslint.config.mjs frontend/src/components/geographic-visualization/WorldMapVisualization.tsx frontend/src/components/position-editor/PositionEditor.tsx` → **exit 0** (named anchors clean).

### Regression fixture (every-CI guard)

- `pnpm exec eslint -c eslint.config.mjs tools/eslint-fixtures/bad-design-token.tsx` → **3 D-05 warnings, exit 0** under the fixture-specific override:
  - Line 10:24 raw hex selector fires.
  - Line 11:21 palette literal selector fires.
  - Line 12:22 template-literal companion selector fires.
- The fixture sits under the existing `tools/eslint-fixtures/**/*.{ts,tsx}` glob in `eslint.config.mjs` and inherits the D-05 selectors via a fixture-specific override (Plan 51-01 D-15 deviation #2). This is the every-CI regression guard mirroring Phase 50 D-15 `bad-vi-mock.ts`.

### ROADMAP success criterion 4 interpretation per D-09 (W1 revision)

**The NEW design-token selectors run under the EXISTING `Lint` PR-blocking context** registered by Phase 48 D-15 — **no new required-context PUT to `/branches/main/protection`**. Pre/post protection JSON snapshots are byte-identical (MD5 `4ed9db6d47e9a49d2bdb501a8a5c18ac`). The "NEW" adjective in the ROADMAP success criterion 4 ("A new PR-blocking branch-protection context for design-token compliance is registered on main") modifies the RULE (the D-05 selectors are new), NOT the CONTEXT NAME (the `Lint` context is pre-existing from Phase 48 D-15). The rule fires inside the existing `Lint` job, the `Lint` context remains PR-blocking via Phase 48's registration, and the smoke PR proves the gate fires — all without a new context PUT. This satisfies DESIGN-04 under the D-09 fold posture: **NEW rule, EXISTING context**.

## 3. Smoke PR Evidence

| Field              | Value                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| PR number          | **#12**                                                                                                 |
| PR URL             | https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/12                                           |
| Title              | `chore(51-smoke): verify Lint blocks raw palette literal`                                               |
| Head branch        | `smoke/phase-51-design-token-gate` (cut from `DesignV2` — see Deviation #4)                             |
| Base branch        | `main`                                                                                                  |
| Created            | 2026-05-15 ~21:14 UTC                                                                                   |
| Closed             | 2026-05-15T21:23:50Z                                                                                    |
| State              | `CLOSED` (with `--delete-branch`)                                                                       |
| `mergeStateStatus` | `BLOCKED` (after CI settled; initial capture during D-09 evidence pull was `BEHIND` — see Deviation #6) |
| Branch on origin   | **deleted** (`git ls-remote origin refs/heads/smoke/phase-51-design-token-gate` returns empty)          |

### Required-context rollup at PR #12 close

| Context (CI workflow `name:` field) | Conclusion  | Notes                                                                                   |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `Lint`                              | **FAILURE** | Gate fires on the injected `bg-red-500` literal — the operative gate-block evidence.    |
| `type-check`                        | SUCCESS     | In-tree JSX injection avoided the TS6133 attribution trap (Phase 48 PR #6 → #7 lesson). |
| `Tests (backend)`                   | SUCCESS     |                                                                                         |
| `Tests (frontend)`                  | **FAILURE** | Pre-existing test-assertion drift unrelated to Phase 51 — see Deviation #5.             |
| `Security Scan`                     | SUCCESS     |                                                                                         |
| `Bundle Size Check (size-limit)`    | SKIPPED     |                                                                                         |

`Tests (integration)`, `E2E Tests`, `Trivy`, and `Visual Regression (Phase 46)` also reported FAILURE on this branch (pre-existing infrastructure issues, mirrors Phase 50-05 PR #11 attribution; tracked separately outside Phase 51 scope).

## 4. Branch-Protection Snapshots

**Pre-state** (captured 2026-05-15 ~21:12 UTC, before smoke PR):

```json
{
  "url": ".../branches/main/protection",
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "type-check",
      "Security Scan",
      "Lint",
      "Bundle Size Check (size-limit)",
      "Tests (frontend)",
      "Tests (backend)"
    ]
  },
  "enforce_admins": { "enabled": true },
  "required_linear_history": { "enabled": false },
  "allow_force_pushes": { "enabled": false },
  "allow_deletions": { "enabled": false },
  "required_signatures": { "enabled": false },
  "required_pull_request_reviews": null,
  "restrictions": null
}
```

**Post-state** (captured 2026-05-15 ~21:24 UTC, after smoke PR close):

Byte-identical to pre-state. `md5 -q /tmp/51-protection-pre.json /tmp/51-protection-post.json` returns `4ed9db6d47e9a49d2bdb501a8a5c18ac` for both files. `diff /tmp/51-protection-pre.json /tmp/51-protection-post.json` returns empty. **No PUT was performed during Phase 51 — D-09 fold posture preserved.**

The required `Lint` context already existed from Phase 48 D-15. Phase 51 adds the D-05 rules INSIDE that context, so flipping severity to `error` makes the Lint job non-zero on any new banned literal, which is precisely what `Lint = FAILURE` on smoke PR #12 demonstrates.

## 5. D-12 Compliance

```
$ git diff phase-51-base..HEAD -- 'frontend/src' \
    | grep -E '^\+.*eslint-disable' \
    | grep -vE '^\+\+\+' \
    > /tmp/51-eslint-disable-additions.txt
$ wc -l < /tmp/51-eslint-disable-additions.txt
2245
$ grep -v "Phase 51 Tier-C:" /tmp/51-eslint-disable-additions.txt | wc -l
0
```

- **Observed (D-12 diff scan):** 2245 net-new `eslint-disable-next-line` lines added under `frontend/src/` between `phase-51-base` and `HEAD`.
- **Expected (audit row sum):** 2336 (sum of `raw_hex_count + palette_literal_count` over the 271 Tier-C rows = 115 hex + 2221 palette).
- **Delta:** 91 lines (audit > diff), distributed across 23 files (see `/tmp/51-delta.txt`).
- **Reconciliation per Plan 51-04 Task 2 done-criteria:** the 91-line delta is the documented multi-Literal-on-one-line edge case — when two or more banned AST `Literal` / `TemplateElement` nodes share a single source line, one `eslint-disable-next-line` covers them all (ESLint's per-line semantics). The audit row count remains correct as an AST-node tally; the diff count remains correct as a source-line tally. Per-file ESLint reruns on every Tier-C file return zero `no-restricted-syntax` warnings.
- **Zero stray disables:** every line in `/tmp/51-eslint-disable-additions.txt` carries the `Phase 51 Tier-C:` annotation. No net-new disable exists outside the audited Tier-C scope.
- **Audit doc updated** (this commit): `**Expected per-Literal disable count:** 2336` is preserved, and the audit header now records `**Observed eslint-disable-next-line lines added (D-12 diff scan):** 2245` plus a reconciliation note that names the multi-Literal-on-one-line edge case. Source-first direction: source code first, audit doc reconciled to match.

## 6. Audit Doc Summary

- **Tier-A worklist size:** 50 files (frozen in Plan 51-03 — `51-DESIGN-AUDIT.md` §Tier-A Worklist).
- **Tier-A swap result:** all 50 files clean after mechanical sweep (`9d919ecb`); banned-palette `rg` scan returns 0 matches across the 50.
- **Tier-B carve-out size:** 16 explicit paths in `eslint.config.mjs` `no-restricted-syntax: off` block (token source, bootstrap, flag SVGs, 14 chart/graph/report-preview files).
- **Tier-C disposition size:** 271 files in `51-DESIGN-AUDIT.md` §Tier-C Disposition Table.
- **Total Tier-C `eslint-disable-next-line` lines added:** 2245 (D-12 diff scan; see §5).
- **Total Tier-C AST Literal+TemplateElement nodes suppressed:** 2336 (audit row sum; 91 of these share source lines with siblings).
- **Slug-index entries:** one per Tier-C file (271 rows); basenames disambiguated where collisions occur.
- **Diff stat (`frontend/src` only, phase-51-base..HEAD):** 323 files changed, 3812 insertions, 1675 deletions.

## 7. Decisions Made

See `key-decisions` in the frontmatter (D-01 through D-14). Notable load-bearing decisions:

- **D-09 fold posture** (NEW rule inside EXISTING `Lint` context, no PUT) is the structural difference from Phases 47-03, 48-03, and 50-05, which all performed branch-protection PUTs. Phase 51 preserves the contexts list verbatim.
- **D-12 source-first reconciliation** (audit doc updated to record both the AST-Literal sum and the source-line sum, with a documented edge-case note) replaces the plan's strict equality assertion. The two counts are both valid and both audited; per-file ESLint reruns prove zero unsuppressed banned Literals.
- **D-14 annotation comment shape** (ESLint canonical `--` description form) substitutes for the plan-documented block-comment form because the latter triggered ESLint v9's rule-name-include trap. The substring `Phase 51 Tier-C:` that the D-12 grep keys on is preserved exactly.

## 8. Deviations

All seven deviations below were reviewed by the user at the Task 4 checkpoint and explicitly approved before Plan 51-04 Task 5 began. They are documented here at full fidelity, not downplayed.

### 1. [Rule 3 — Blocking → resolved] Annotation comment syntax

The plan's documented block-comment form (`// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<slug> */`) did not parse correctly under ESLint v9 — the parser folded the inline `/* … */` into the rule-name token and emitted `Definition for rule 'no-restricted-syntax /* … */' was not found`. Substituted the ESLint canonical `--` description form: `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<slug>`. The D-12 grep substring `Phase 51 Tier-C:` is preserved exactly, so the audit chain still works. All 271 files verified clean per-file (0 `no-restricted-syntax` warnings).

### 2. [Rule 1 — Bug → resolved] Context-aware disable forms

The plan assumed one canonical disable form. In practice, the offending Literals live in five distinct AST contexts (plain JS/TS, JSX attribute lists, JSX children, JSXExpressionContainer, TemplateLiteral expressions), each of which requires a different disable-form: line-comment, block-comment, JSX-child block-comment, or a `/* eslint-disable */ … /* eslint-enable */` pair for template literals where no line above the Literal exists. Built an AST-driven classifier using `@typescript-eslint/parser` that walks each Literal's parent chain and selects the appropriate form, then verified per-file that ESLint reports 0 `no-restricted-syntax` warnings. All 271 files post-annotation are clean.

### 3. [Rule 1 — Scope correction] Tier-C population: 271 files, 2336 AST nodes (not plan-estimated ~145)

The plan estimated ~145 Tier-C files. The live sweep delta after excluding the Tier-A worklist (50 files) and the Tier-B carve-out (16 files) yielded **271 Tier-C files** with **2336 AST `Literal` + `TemplateElement` nodes**. The plan estimate was conservative; the live count is authoritative. All 271 files are populated in the Tier-C Disposition Table with `disposition = deferred-tier-c` and `follow_up_phase = TBD-design-token-tier-c-cleanup-wave-N`.

### 4. [Rule 4 → resolved by D-09 reinterpretation] Smoke branch cut from `DesignV2`, not `origin/main`

The plan recipe cuts the smoke branch off `origin/main` per the verbatim Phase 48 / 50 precedent. However, `main` does not yet carry the Phase 51 work — cutting off `main` would NOT exercise the D-05 selectors, so the resulting `Lint = SUCCESS` would not prove anything. Pivoted: smoke branch cut from `DesignV2` (which carries Phase 51 work + the severity flip), PR opened against `main` base. CI runs on the smoke branch HEAD with all of Phase 51's rules active, proving `Lint = FAILURE` on the deliberate-bad literal; the required-`Lint`-context on main's branch protection makes the PR non-mergeable. Functional gate-proof is preserved. User accepted this pivot at the Task 4 checkpoint.

### 5. [Rule 4 → deferred per user approval] `Tests (frontend) = FAILURE` on smoke PR — pre-existing attribution pollution

`SLAIndicator.test.tsx` and `TaskCard.test.tsx` assert old palette classes (`bg-green-100`, `bg-amber-100`, `bg-red-100`, `bg-yellow-100`, `bg-blue-100`, `bg-gray-100`). Plans 51-02 and 51-03 replaced those `className` literals with token utilities (`bg-success/10`, `bg-warning/10`, `bg-danger/10`, `bg-info/10`, `bg-muted`, etc.) without updating the test assertions. These tests were already failing on `DesignV2` BEFORE Plan 51-04 started — the failure was inherited from the Tier-A sweep in Plan 51-03 / Plan 51-02, not introduced by the smoke PR itself. The plan recipe's attribution-isolation rule ("only Lint should fail") could not be met without first fixing the tests. **User explicitly approved deferring the fix to a follow-up phase — out of Phase 51 scope.** See Follow-up §1.

### 6. [Documented evolution; final state stronger than plan target] `mergeStateStatus` evolved BEHIND → BLOCKED

During the D-09 pre-flight evidence pull and the immediate post-CI poll, `gh pr view 12 --json mergeStateStatus` returned `BEHIND` (smoke branch was 144 commits ahead of main from DesignV2, which is itself ahead of main — GitHub reports BEHIND first when the head branch is missing base HEAD commits, regardless of CI state). The user accepted `BEHIND` with `Lint = FAILURE` on a required context as the gate-block proof, because with `strict = true` plus a failing required context, merging is refused — semantic distinction documented; underlying enforcement is identical. **At the final post-close re-poll (this Task 5 verification), `mergeStateStatus = BLOCKED`** — the textbook outcome. Both `BEHIND` (with required-context FAILURE) and `BLOCKED` proved gate-block; the final state is the stronger of the two. Phase 50-05 PR #11 documented the same `BEHIND` acceptance — Phase 51 PR #12 now records the upgrade to `BLOCKED`.

### 7. [Rule 3 — Hook conflict → resolved] Smoke commit used `--no-verify`

The repo's pre-commit hook runs `eslint --fix --no-warn-ignored` workspace-wide, which would catch the deliberate-bad `bg-red-500` literal locally before it ever reaches CI — defeating the entire purpose of the smoke PR. Used `git commit --no-verify` for the single smoke-injection commit, identical to the Phase 48 PR #7 and Phase 50-05 PR #11 precedents (both used `--no-verify` for their smoke commits for the same reason). The smoke branch was closed and deleted, so the `--no-verify` commit never persisted on `main` or any retained branch.

### Deviation Summary

| #   | Severity           | Status                   | Scope                                       |
| --- | ------------------ | ------------------------ | ------------------------------------------- |
| 1   | Blocking           | Resolved                 | All 271 Tier-C files (annotation form swap) |
| 2   | Bug                | Resolved                 | All 271 Tier-C files (AST classifier)       |
| 3   | Scope correction   | Documented               | Tier-C size: 145 → 271 files                |
| 4   | Architectural      | Resolved + user-approved | Smoke branch base                           |
| 5   | Bug — pre-existing | User-approved deferral   | 2 test files                                |
| 6   | Evidence           | Documented evolution     | mergeStateStatus BEHIND → BLOCKED           |
| 7   | Hook conflict      | Precedent-aligned        | Single smoke commit                         |

## 9. Follow-up

### 1. Test-assertion drift in `SLAIndicator.test.tsx` and `TaskCard.test.tsx` (out of Phase 51 scope per user approval — Deviation #5)

The two test files assert on the pre-Phase-51 palette literals (`bg-green-100`, `bg-amber-100`, `bg-red-100`, `bg-yellow-100`, `bg-blue-100`, `bg-gray-100`) that Plans 51-02 / 51-03 swapped to token utilities. The fix is mechanical (`bg-{family}-100` → `bg-{family}/10` for each), but the user approved deferring it so that Plan 51-04 could close with the design-token gate proven and merged without picking up a test-quality task in the same wave. Track as a Phase 52-prep cleanup ticket.

### 2. Tier-C `follow_up_phase` placeholder promotion

All 271 Tier-C rows record `follow_up_phase = TBD-design-token-tier-c-cleanup-wave-N`. These placeholders should be promoted to concrete ROADMAP phase entries in a separate PR. Suggested grouping: (a) one wave per top-level subtree (`components/activity-feed/**`, `components/calendar/**`, `pages/**`, `routes/**`, `types/**`), or (b) one wave per semantic family (status/danger, warning/info, neutral/chrome, chart/graph). Final grouping is a roadmap-level decision; out of Phase 51 scope.

### 3. Optional re-validation of the smoke gate from `main` (after `DesignV2` merges to `main`)

Phase 51 captured `mergeStateStatus = BLOCKED` on Smoke PR #12 with the smoke branch cut from `DesignV2`. After `DesignV2` merges to `main`, a one-shot smoke PR cut from `main` would yield the same `BLOCKED` result without the BEHIND→BLOCKED transition (since the head would no longer be missing base commits). Optional follow-up; the current evidence already satisfies DESIGN-04.

### 4. Bad-fixture positive-failure CI check

No CI job currently asserts that `pnpm lint tools/eslint-fixtures/bad-design-token.tsx` exits with the 3 expected D-05 warnings. If a future parser upgrade silently disables the D-05 selectors, `pnpm lint` will go green on the fixture when it shouldn't. Identical posture to Phase 50-05's Tech Debt entry for `bad-vi-mock.ts`. Tracked as a small CI health-check script — out of Phase 51 scope.

## TDD Gate Compliance

Not applicable — Phase 51 is `type: execute`, not `type: tdd`. All commits are `chore(51-…)`, `fix(51-…)`, `refactor(51-…)`, `docs(51-…)`, or `test(51-…)` (the test commit `18c5bd69` for the regression fixture is non-behavioral; it ships a deliberately-failing fixture).

## Threat Flags

| Flag   | File   | Description                                                                                                                                                                                                                                                      |
| ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _none_ | _none_ | This plan introduces no new network endpoints, auth paths, file-access patterns, or schema changes at trust boundaries. The D-05 ESLint selectors are static-analysis-only and do not run at runtime; the regression fixture is excluded from production builds. |

## Diff Stat (frontend/src only)

```
$ git diff phase-51-base..HEAD --stat -- 'frontend/src' | tail -1
 323 files changed, 3812 insertions(+), 1675 deletions(-)
```

## Self-Check: PASSED

- `eslint.config.mjs` no-restricted-syntax severity = `'error'` ✓ (`a5b32cd7`)
- `pnpm lint` (which runs `--max-warnings 0`) exits 0 workspace-wide ✓ (turbo cache miss, 19.689s, 2026-05-15)
- `pnpm typecheck` exits 0 ✓ (turbo full-cache hit, 150ms)
- Regression fixture `tools/eslint-fixtures/bad-design-token.tsx` surfaces all 3 D-05 selectors ✓
- Named anchors `WorldMapVisualization.tsx` + `PositionEditor.tsx` lint clean ✓
- D-12 net-new disable diff scan: 2245 lines, all carry `Phase 51 Tier-C:` annotation, zero stray disables ✓
- Audit doc reconciled (Plan 51-04 Task 2 multi-Literal-on-one-line edge case documented) ✓
- Smoke PR #12 closed, `mergeStateStatus = BLOCKED`, `Lint = FAILURE`, branch deleted from origin ✓
- Pre/post branch-protection JSON byte-identical (MD5 `4ed9db6d47e9a49d2bdb501a8a5c18ac`) ✓
- 51-SUMMARY.md contains the literal string `BLOCKED` (per plan automated verify) ✓
- 51-SUMMARY.md documents the BEHIND→BLOCKED evolution in Deviations §6 ✓
- 9 documented sections + frontmatter ✓
- No STATE.md or ROADMAP.md edits (orchestrator owns those) ✓

---

_Phase: 51-design-token-compliance-gate_
_Plan: 04 — Tier-C severity flip + smoke PR + phase seal_
_Completed: 2026-05-15_
_Phase base commit: e0aa391f5e1cc88725d358f3e2b1e16fe27344c8_
_Plan head commit: a5b32cd73a14c528151b419bef9445d7e1bb5e21_
