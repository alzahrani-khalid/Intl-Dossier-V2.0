---
phase: 51
plan: 01
plan_id: 51-01
type: execute
wave: 1
depends_on: []
files_modified:
  - eslint.config.mjs
  - tools/eslint-fixtures/bad-design-token.tsx
autonomous: true
requirements: [DESIGN-01, DESIGN-02]
requirements_addressed: [DESIGN-01, DESIGN-02]
tags: [eslint, design-tokens, lint-config, tier-b, regression-fixture]
objective: >-
  Ship the two D-05 lint selectors (raw hex + Tailwind palette) plus the D-05 TemplateElement
  companion, register the D-03 Tier-B file allowlist, set the phase-51-base git tag, and ship the
  optional permanent regression fixture. Rule lands at WARN level so workspace lint does NOT fail
  until Tier-A swaps + Tier-C disables complete in later waves; final flip to ERROR happens in
  Plan 51-04. This is the structural foundation — every later plan depends on the selectors and
  Tier-B carve-out shipping correctly here.
user_setup: []
must_haves:
  truths:
    - "eslint.config.mjs contains a Literal selector matching /#[0-9a-fA-F]{3,8}\\b/ in the frontend override block."
    - 'eslint.config.mjs contains a Literal selector matching the Tailwind palette pattern (text|bg|border|...) for the 21 banned palette names with the (?:[a-z-]+:)* variant prefix.'
    - 'eslint.config.mjs contains a TemplateElement selector with the same palette regex against value.raw.'
    - "eslint.config.mjs contains a new override block with files: [...] and rules: { 'no-restricted-syntax': 'off' } covering the D-03 Tier-B file enumeration."
    - 'tools/eslint-fixtures/bad-design-token.tsx exists, contains one banned palette literal and one raw hex literal, and `pnpm lint tools/eslint-fixtures/bad-design-token.tsx` exits non-zero.'
    - 'Git tag phase-51-base exists at the pre-edit HEAD and is pushed to origin.'
    - 'Workspace `pnpm lint` exits 0 after this plan lands (rule is WARN, not ERROR, so existing violations surface as warnings but do not block).'
  artifacts:
    - path: 'eslint.config.mjs'
      provides: 'D-05 rule selectors (3 new entries: hex Literal + palette Literal + palette TemplateElement) and D-03 Tier-B carve-out block'
      contains: "'no-restricted-syntax'"
    - path: 'tools/eslint-fixtures/bad-design-token.tsx'
      provides: 'Permanent regression fixture mirroring tools/eslint-fixtures/bad-vi-mock.ts shape'
      contains: 'bg-red-500'
  key_links:
    - from: 'eslint.config.mjs frontend override block (lines 70-200)'
      to: 'the existing no-restricted-syntax array at lines 148-198'
      via: 'append three new selector entries before the closing ]'
      pattern: "Literal\\[value=/.*#\\[0-9a-fA-F\\]"
    - from: 'eslint.config.mjs (new Tier-B override block inserted after line 221)'
      to: 'the D-03 enumerated Tier-B file globs'
      via: "rules: { 'no-restricted-syntax': 'off' }"
      pattern: "'no-restricted-syntax': 'off'"
    - from: 'tools/eslint-fixtures/bad-design-token.tsx'
      to: 'the existing files glob at eslint.config.mjs line 227 (tools/eslint-fixtures/**/*.{ts,tsx})'
      via: 'fixture lands automatically under the glob — no new override block'
      pattern: 'tools/eslint-fixtures'
---

<objective>
Ship the two D-05 lint selectors (raw hex `Literal`, Tailwind palette `Literal`) plus the
D-05 `TemplateElement` companion selector that closes the Phase 48 template-literal blind
spot. Register the D-03 Tier-B file allowlist as a new per-file rule override. Create the
phase-51-base git tag for the D-12 diff-grep. Ship the optional permanent regression
fixture mirroring `tools/eslint-fixtures/bad-vi-mock.ts`.

**Sequencing decision:** the new selectors land at SEVERITY `warn`, NOT `error`. Reason:
the workspace contains ~2,950 palette literals and 337 raw-hex hits across `frontend/src/`
today; flipping to `error` here would fail `pnpm lint` workspace-wide before Plans 51-02
and 51-03 swap Tier-A literals and Plan 51-04 lands Tier-C disables. Plan 51-04 Task 4
performs the final `warn → error` flip after all swaps and disables are in place.
Verification still works under `warn`: ESLint exits 0 but emits the rule messages so
executors of Plan 51-04 can run the smoke PR with `error` and observe `Lint=fail`.

Purpose: stand up the policy and Tier-B carve-out in a single self-contained change that
later plans can branch off without coupling. Tier-A swap plans (51-02 / 51-03) are
file-content-only edits — they do not modify lint config. Tier-C wave (51-04) flips the
severity to `error`, lands per-Literal disables, runs the smoke PR, and writes
`51-SUMMARY.md`.

Output: rule selectors live in the same `eslint.config.mjs` frontend override block as the
eleven Phase 48 RTL selectors; Tier-B block lives after the existing `components/ui/**`
carve-out at lines 215-221; fixture lives at `tools/eslint-fixtures/bad-design-token.tsx`
under the existing test-fixtures glob at line 227; phase-51-base tag at the pre-edit HEAD.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/51-design-token-compliance-gate/51-CONTEXT.md
@.planning/phases/51-design-token-compliance-gate/51-RESEARCH.md
@.planning/phases/51-design-token-compliance-gate/51-PATTERNS.md
@.planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md
@.planning/phases/51-design-token-compliance-gate/51-VALIDATION.md
@CLAUDE.md
@eslint.config.mjs
@tools/eslint-fixtures/bad-vi-mock.ts

<interfaces>
<!-- Existing donor shapes the executor will mirror — extracted from the repo. -->
<!-- Do not re-read the full files; the relevant excerpts are pinned here. -->

From eslint.config.mjs:148–198 (donor: Phase 48 RTL selector grammar):

```
'no-restricted-syntax': [
  'error',
  { selector: 'Literal[value=/\\bml-/]', message: 'Use ms-* (margin-start) ...' },
  // ... 10 more RTL selectors ...
  { selector: 'Literal[value=/\\bborder-r-/]', message: 'Use border-s-* ...' },
],
```

From eslint.config.mjs:215–221 (donor: Phase 48 components/ui/\*\* carve-out):

```
{
  files: ['frontend/**/components/ui/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
},
```

From eslint.config.mjs:224–240 (donor: Phase 50 D-15 test-fixtures override block; line 227 is the existing tools/eslint-fixtures/\*_/_.{ts,tsx} glob the new fixture rides under):

```
{
  files: [
    'frontend/tests/**/*.{ts,tsx}',
    'tools/eslint-fixtures/**/*.{ts,tsx}',
  ],
  rules: {
    'no-restricted-syntax': [ 'error', { selector: '...', message: '...' } ],
  },
},
```

From tools/eslint-fixtures/bad-vi-mock.ts (donor shape for bad-design-token.tsx — same comment-header rhythm, single-violation size):

```
// Phase 50 D-15 regression fixture for vi-mock-exports-required.
// `pnpm lint tools/eslint-fixtures/bad-vi-mock.ts` MUST exit non-zero.
// ...
import { vi } from 'vitest'
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }))
```

From 51-UI-SPEC.md §Copywriting Contract (verbatim ESLint rule messages — single-message-per-rule policy, no emoji, sentence case):

- Raw hex message: cites CLAUDE.md §Design rules and frontend/src/index.css @theme block; names var(--accent), text-accent, text-ink, border-line, semantic-colors.ts.
- Palette message: same anchors; names canonical swap utilities text-danger / text-warning / text-success / text-info / text-accent / text-ink\*.
- TemplateElement companion message: shorter — cites template-literal blind spot.

From 51-PATTERNS.md §"eslint.config.mjs (root, modify)":

- New selectors append AFTER the existing line 197 (border-r-) selector, BEFORE the closing `]` at line 198.
- New Tier-B block inserts AFTER line 221 (closing brace of components/ui carve-out) and BEFORE line 224 (test-mock guard block).
- Severity at this plan stage is `warn`, not `error` — Plan 51-04 flips to `error`.
  </interfaces>
  </context>

<threat_model>

## Trust Boundaries

| Boundary                                               | Description                                                                                                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| developer source code → ESLint lint pass               | untrusted developer-authored literals enter the lint rule's AST visitor; rule fires deterministically per regex                                       |
| eslint.config.mjs → CI Lint job                        | config is read once per CI invocation; any rule misconfiguration here propagates to every PR                                                          |
| tools/eslint-fixtures/bad-design-token.tsx → lint rule | the deliberately-bad fixture is a self-test that the rule fires; if the file is excluded from the rule scope, the regression guard is silently broken |

## STRIDE Threat Register

| Threat ID | Category               | Component                                           | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                               |
| --------- | ---------------------- | --------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-51-01   | Tampering              | eslint.config.mjs new selectors                     | mitigate    | The regex grammar is `Literal[value=/.../]` and `TemplateElement[value.raw=/.../]` against a single string source; no dynamic evaluation, no plugin code, no I/O. Mitigation = strict adherence to the donor shape in PATTERNS.md, no string interpolation in the selector strings (escape backslashes only). |
| T-51-02   | Spoofing               | Token-utility allowlist (implicit via D-06)         | accept      | The implicit-allowlist trick (regex enumerates banned palette names; everything else passes) cannot be spoofed because new token names entering @theme are NEW identifiers, never aliases of banned palette names. No mitigation needed; accept.                                                              |
| T-51-03   | Denial of Service      | False-positive surface (regex over-matches)         | mitigate    | Pre-flight regex validation against 25 test surfaces (RESEARCH §1) confirms zero false positives in current codebase. Mitigation = ship as `warn` first (this plan), monitor false-positive reports during Tier-A swap waves, flip to `error` only after audit completes (Plan 51-04).                        |
| T-51-04   | Elevation of Privilege | Rule bypass via `// eslint-disable-next-line` abuse | mitigate    | D-12 zero net-new disable rule: grep diff for new `eslint-disable` strings; count MUST equal Tier-C row count in `51-DESIGN-AUDIT.md`. Per-Literal disables only, never file-top blanket. Verification step in Plan 51-04 Task 5.                                                                             |
| T-51-05   | Information Disclosure | Tier-B over-match via wildcard glob                 | mitigate    | Tier-B enumeration uses explicit filenames (not `**Chart.tsx` wildcards) for chart palettes per PATTERNS.md §"Notes for the planner" → Pitfall 6. Future chart files entering `analytics/` MUST be added explicitly.                                                                                          |
| T-51-06   | Repudiation            | phase-51-base tag drift                             | mitigate    | Tag is created idempotently at HEAD before any source edit (`git tag phase-51-base $(git rev-parse HEAD)`) and pushed to origin. D-12 diff-grep in Plan 51-04 anchors to this exact ref.                                                                                                                      |

All threats scored low or mitigated; none reach the high-severity bar (likelihood ≥3 AND impact ≥3) that would block this plan.
</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Set phase-51-base git tag</name>
  <files>(none — git tag operation)</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"Phase-base git tag for diff audits"
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §"D-12 net-new disable scan"
  </read_first>
  <action>
    Create the phase-51-base annotated git tag at the current HEAD before any source edit, idempotently. Run:
      git rev-parse phase-51-base 2>/dev/null || git tag phase-51-base "$(git rev-parse HEAD)"
      git push origin phase-51-base 2>/dev/null || true
    The `|| true` guards make this safe to re-run. Tag is required by D-12 (Plan 51-04 Task 5) to scope the `eslint-disable-next-line` net-new count diff. No source files are modified by this task.
  </action>
  <verify>
    <automated>git rev-parse phase-51-base 2>/dev/null &amp;&amp; git ls-remote --tags origin refs/tags/phase-51-base | grep -q phase-51-base</automated>
  </verify>
  <done>`git rev-parse phase-51-base` returns a SHA equal to the pre-edit HEAD; `git ls-remote origin refs/tags/phase-51-base` lists the tag.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Append D-05 selectors to no-restricted-syntax array (severity: warn)</name>
  <files>eslint.config.mjs</files>
  <read_first>
    - eslint.config.mjs (lines 1-200, full frontend override block including the 11 Phase 48 RTL selectors at lines 148-198)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"eslint.config.mjs (root, modify)" pattern-assignment section (the verbatim selector shapes)
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Lint Rule Contract" §Selector 1 + §Selector 2 + §Copywriting Contract
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §"Pattern 1: Adjacent no-restricted-syntax selectors" + §"Code Examples"
  </read_first>
  <action>
    Edit eslint.config.mjs frontend override block. Two structural changes:

    1) Change the existing line 149 severity from `'error'` to `'warn'` (the first element of the no-restricted-syntax array). Rationale: ALL eleven Phase 48 RTL selectors share this severity, and the codebase is currently green at `error` — flipping to `warn` keeps RTL warnings non-blocking during the Phase 51 Tier-A sweep waves. The final flip back to `error` (covering both RTL and the new D-05 selectors) happens in Plan 51-04 Task 4 AFTER the Tier-A + Tier-C waves land.

       NOTE: if the executor concludes that downgrading the existing RTL selectors from `error` to `warn` is too broad, the alternative is to split the no-restricted-syntax block into two arrays — one for the existing RTL rules at `error`, one for the new D-05 rules at `warn`. Either path is acceptable; the alternative requires duplicating the array literal and adding a second `'no-restricted-syntax': [...]` entry. Default path: severity flip on the existing array. Document the chosen path in the commit message.

    2) Append three new selector entries inside the no-restricted-syntax array AFTER the existing line 197 (the `border-r-` RTL selector) and BEFORE the closing `]` at line 198:

       (a) RAW HEX selector — selector string: `Literal[value=/#[0-9a-fA-F]{3,8}\\b/]`. Message verbatim from 51-UI-SPEC.md §Copywriting Contract row 1 (the long-form text starting with "Raw hex colors are not allowed in frontend/src...").

       (b) TAILWIND PALETTE Literal selector — selector string (exact regex, with `\\s`, `\\d`, and `\\b` double-escaped because the config file uses JS string literals): `Literal[value=/(?:^|\\s)(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b/]`. Message verbatim from 51-UI-SPEC.md §Copywriting Contract row 2.

       (c) TEMPLATE ELEMENT companion selector — same regex against `TemplateElement[value.raw=...]` instead of `Literal[value=...]`. Closes the template-literal blind spot per RESEARCH §"Pitfall 1". Short message: cite the template-literal coverage extension; name `text-accent / text-danger / text-success / text-warning / text-info / text-ink* / bg-surface / border-line` as canonical swaps.

    Style rules: single quotes, no trailing semicolon inside the array, comma after each `}` per existing array shape (lines 153, 157, etc.). Match the column / indent of the existing RTL selectors. No emoji, no exclamation marks, sentence case (Phase 48 D-06 + CLAUDE.md §"No marketing voice").

    Do NOT add new plugin imports (D-05 uses zero new plugins; precedent: eslint.config.mjs:1-8 import set). Do NOT modify the `files: ['frontend/**/*.{ts,tsx}']` glob at line ~72.

  </action>
  <verify>
    <automated>grep -c "Literal\[value=/#\[0-9a-fA-F\]{3,8}" eslint.config.mjs | grep -qx 1 &amp;&amp; grep -c "TemplateElement\[value.raw" eslint.config.mjs | grep -qx 1 &amp;&amp; node -e "import('./eslint.config.mjs').then(m=>console.log('config-loads'))" 2>&amp;1 | grep -q config-loads</automated>
  </verify>
  <done>
    eslint.config.mjs parses as a valid ES module (the `node -e "import(...)"` probe succeeds with `config-loads`).
    `grep -c "Literal\[value=/#\[0-9a-fA-F\]{3,8}" eslint.config.mjs` returns 1.
    `grep -c "TemplateElement\[value.raw" eslint.config.mjs` returns 1.
    `grep -c "(text\|bg\|border\|ring\|fill\|stroke" eslint.config.mjs` returns at least 2 (Literal palette selector + TemplateElement companion both share the same banned palette enumeration).
    The first element of the no-restricted-syntax array is the string literal `'warn'`.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Add D-03 Tier-B override block</name>
  <files>eslint.config.mjs</files>
  <read_first>
    - eslint.config.mjs (lines 200-245, the components/ui/** carve-out at 215-221 and the test-mock guard at 224-240)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"D-03 Tier-B file-level carve-out" (the verbatim donor shape + the new block to insert + the "Notes for the planner")
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Allowlist (Tier-B — D-03)" table
  </read_first>
  <action>
    Insert a new ESLint config object AFTER the closing `},` at line 221 (the components/ui/** carve-out block end) and BEFORE the comment `// ── Test mocks: require importActual...` at line 223. The new object has shape:
      { files: [<enumerated D-03 paths>], rules: { 'no-restricted-syntax': 'off' } }

    Files array (enumerated explicitly — NO wildcard `**Chart.tsx` per PATTERNS.md Pitfall 6 guidance):
      - frontend/src/design-system/tokens/directions.ts
      - frontend/public/bootstrap.js
      - frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}
      - frontend/src/components/analytics/CommitmentFulfillmentChart.tsx
      - frontend/src/components/analytics/RelationshipHealthChart.tsx
      - frontend/src/components/analytics/WorkloadDistributionChart.tsx
      - frontend/src/components/analytics/EngagementMetricsChart.tsx
      - frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx
      - frontend/src/components/analytics/ClusterVisualization.tsx
      - frontend/src/components/analytics/sample-data.ts
      - frontend/src/components/dashboard-widgets/ChartWidget.tsx
      - frontend/src/components/sla-monitoring/SLAComplianceChart.tsx
      - frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx
      - frontend/src/components/stakeholder-influence/InfluenceReport.tsx
      - frontend/src/components/relationships/RelationshipGraph.tsx
      - frontend/src/components/dossier/MiniRelationshipGraph.tsx
      - frontend/src/components/report-builder/ReportPreview.tsx

    Path verification step BEFORE writing the glob: run `find frontend/src -name MiniRelationshipGraph.tsx -type f` to confirm the actual location (PATTERNS.md §"Notes for the planner" flags possible drift to `frontend/src/components/dossiers/` with the trailing `s`). Use the resolved path in the array.

    Add a leading comment block matching the existing donor shape (`// ── Design-token Tier-B carve-out (Phase 51 D-03 / D-13) ──────────`) plus a short rationale paragraph explaining that these are PERMANENT design statements (chart palette tokens are a future phase), not deferred work.

    Do NOT include `frontend/src/lib/semantic-colors.ts` (RESEARCH Open Question 4 — its current content passes the new selectors; including preemptively suggests false positives that don't exist).
    Do NOT include `frontend/src/index.css` or `frontend/src/styles/modern-nav-tokens.css` — they are outside the `frontend/**/*.{ts,tsx}` rule scope already (D-08).

    Style: object literal in the same shape as eslint.config.mjs:215-221. Trailing comma after the closing `},` so the new block sits cleanly between adjacent blocks.

  </action>
  <verify>
    <automated>node -e "import('./eslint.config.mjs').then(m=>console.log('config-loads'))" 2>&amp;1 | grep -q config-loads &amp;&amp; grep -c "signature-visuals/flags" eslint.config.mjs | grep -qE '^[12]$' &amp;&amp; grep -c "CommitmentFulfillmentChart" eslint.config.mjs | grep -qx 1 &amp;&amp; grep -c "Tier-B" eslint.config.mjs | grep -qE '^[1-9]'</automated>
  </verify>
  <done>
    `node -e "import('./eslint.config.mjs').then(...)"` exits 0 with `config-loads`.
    `grep -c CommitmentFulfillmentChart eslint.config.mjs` returns 1.
    `grep -c MiniRelationshipGraph eslint.config.mjs` returns 1 with the path resolved by `find`.
    `grep -c semantic-colors.ts eslint.config.mjs` returns 0 (semantic-colors.ts intentionally NOT carved out).
    The comment marker `Tier-B` appears in the file at least once (in the new block's header comment).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Create regression fixture tools/eslint-fixtures/bad-design-token.tsx</name>
  <files>tools/eslint-fixtures/bad-design-token.tsx</files>
  <read_first>
    - tools/eslint-fixtures/bad-vi-mock.ts (donor shape — 11 lines, single violation, comment header explaining what MUST fire)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"tools/eslint-fixtures/bad-design-token.tsx (optional create — permanent regression fixture)"
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Test / fixture allowlist" (last paragraph)
  </read_first>
  <action>
    Create a new TSX file at tools/eslint-fixtures/bad-design-token.tsx that mirrors the donor shape verbatim:

    - Top-of-file comment header naming Phase 51 D-10, what `pnpm lint tools/eslint-fixtures/bad-design-token.tsx` MUST do (exit non-zero), what selectors fire (raw hex + palette literal + TemplateElement companion), and a back-reference to frontend/src/index.css @theme block + CLAUDE.md §Design rules.
    - One known-bad raw hex literal inside an inline `style` prop value (e.g., `style={{ color: '#3B82F6' }}`) — fires Selector 1.
    - One known-bad palette literal inside a JSX className (e.g., `className="bg-red-500"`) — fires Selector 2.
    - Optional: one banned palette inside a template literal (e.g., `` className={`text-red-500 ${flag ? 'x' : ''}`} ``) — fires the TemplateElement companion. Recommended to include all three for full coverage.
    - The literals must live inside a rendered JSX subtree so noUnusedLocals (TS6133) does not also fire — assign to a `const _bad = <div>...</div>` and `export {}` at file end (donor: bad-vi-mock.ts uses `export {}` pattern implicitly via no-default-export).

    Severity at this plan stage is `warn`, so `pnpm lint` against the fixture will exit 0 with warnings. After Plan 51-04 Task 4 flips severity to `error`, the same `pnpm lint <fixture>` will exit non-zero. Plan 51-04 Task 6 will pin the fixture's expected exit code as the regression guard. Do NOT add a separate override block for the fixture — it rides under the existing `tools/eslint-fixtures/**/*.{ts,tsx}` glob at eslint.config.mjs line 227.

    No imports beyond React types if needed (the file is JSX so the implicit React 19 JSX transform handles `<div>` without an `import React`).

    File ends with a single trailing newline. Match the donor's 11-line minimalist shape — do not pad with placeholder paragraphs.

  </action>
  <verify>
    <automated>test -f tools/eslint-fixtures/bad-design-token.tsx &amp;&amp; grep -q '#3B82F6\|#[0-9a-fA-F]\{6\}' tools/eslint-fixtures/bad-design-token.tsx &amp;&amp; grep -qE '(bg-red-500|text-red-500|text-blue-500|bg-blue-500)' tools/eslint-fixtures/bad-design-token.tsx</automated>
  </verify>
  <done>
    File `tools/eslint-fixtures/bad-design-token.tsx` exists.
    `grep -q "#[0-9a-fA-F]\{3,8\}" tools/eslint-fixtures/bad-design-token.tsx` matches (raw hex literal present).
    `grep -qE "(bg|text|border)-(red|blue|amber|green|yellow|emerald)-(50|100|200|300|400|500|600|700|800|900|950)" tools/eslint-fixtures/bad-design-token.tsx` matches (palette literal present).
    `pnpm exec eslint tools/eslint-fixtures/bad-design-token.tsx 2>&amp;1` emits at least one of the three rule messages (raw hex / palette / template companion) — even at `warn`, ESLint prints the message text.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 5: Verify workspace lint stays green and config integrity holds</name>
  <files>(none — verification-only)</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-VALIDATION.md §"Per-Task Verification Map"
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §"Validation Architecture"
  </read_first>
  <action>
    Run a four-step verification and capture output for the plan summary:

    1) `node --input-type=module -e "import('./eslint.config.mjs').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"` — must print `OK`. Confirms the config parses.

    2) `pnpm lint` workspace-wide — must exit 0. Severity is `warn` so existing palette literals across frontend/src/ surface as warnings but DO NOT fail the lint. Capture the warning count for the plan summary (the count should roughly match the RESEARCH §"Sweep delta" estimate of ~2,950 palette + ~337 hex, minus Tier-B carve-out hits).

    3) `pnpm exec eslint tools/eslint-fixtures/bad-design-token.tsx 2>&amp;1` — must surface at least one of the new D-05 rule messages. Even at `warn`, ESLint prints the rule message text.

    4) `pnpm exec eslint frontend/src/components/position-editor/PositionEditor.tsx 2>&amp;1 | grep -cE "(Raw hex|Tailwind palette|text-accent|text-danger|text-warning)"` — must return > 0. Confirms the rule fires on the Tier-A anchor file so Plans 51-02 / 51-03 have a verifiable target.

    Record the captured outputs in `.planning/phases/51-design-token-compliance-gate/51-01-SUMMARY.md` (created during the standard execute-plan finalization).

    No source edits in this task. If any of the four checks fail, STOP and surface the failure — do not commit Tasks 2/3/4 changes.

  </action>
  <verify>
    <automated>pnpm lint 2>&amp;1 | tail -1 | grep -qiE "(passed|success|no problems)|^$" &amp;&amp; pnpm exec eslint tools/eslint-fixtures/bad-design-token.tsx 2>&amp;1 | grep -cE "(Raw hex|Tailwind palette|not allowed)" | grep -qE "^[1-9]"</automated>
  </verify>
  <done>
    `pnpm lint` exit code is 0.
    The eslint command against the bad fixture surfaces at least one D-05 rule message (raw hex / palette / TemplateElement).
    The eslint command against `frontend/src/components/position-editor/PositionEditor.tsx` surfaces multiple D-05 palette warnings — confirms the rule is active and visible across Tier-A scope.
    `node --input-type=module -e "import('./eslint.config.mjs')..."` prints `OK`.
  </done>
</task>

</tasks>

<verification>
After all five tasks complete:

- `git rev-parse phase-51-base` returns the pre-edit HEAD SHA; tag is pushed to origin.
- `eslint.config.mjs` parses without error; contains 3 new selector entries (Literal hex, Literal palette, TemplateElement palette) and 1 new Tier-B override block.
- `tools/eslint-fixtures/bad-design-token.tsx` exists and triggers the new selectors.
- `pnpm lint` workspace-wide exits 0 with warnings (severity is `warn` until Plan 51-04 Task 4 flips to `error`).
- The Tier-B file enumeration matches the D-03 list exactly; semantic-colors.ts is intentionally NOT carved out; index.css / modern-nav-tokens.css are NOT in the array (they're outside the rule glob already).
- No new ESLint plugin dependencies introduced.
- No new GHA workflow file changes.
- No branch-protection API calls.
  </verification>

<success_criteria>

- Plan 51-01 ships the policy structure for the entire phase (DESIGN-01 + DESIGN-02 mechanism in place; rule fires, just at warn severity until Plan 51-04).
- All four downstream plans (51-02, 51-03, 51-04) can read this plan's outputs without reverse engineering: the selectors exist, the Tier-B carve-out exists, the fixture exists, the base tag exists.
- Karpathy §3 surgical-change posture: only `eslint.config.mjs` (3 chunks) + `tools/eslint-fixtures/bad-design-token.tsx` (1 new file) are touched.
- No code under `frontend/src/` modified by this plan.
  </success_criteria>

<output>
After completion, create `.planning/phases/51-design-token-compliance-gate/51-01-SUMMARY.md` capturing:
- Final commit SHA for the config + fixture changes.
- `pnpm lint` warning count delta (zero before this plan; ~3,287 after — the rule's surface area exposed at warn severity).
- The 4 verification outputs from Task 5.
- Confirmation that no Tier-A or Tier-C source edits leaked into this plan (`git diff phase-51-base..HEAD -- frontend/src` returns empty).
</output>
