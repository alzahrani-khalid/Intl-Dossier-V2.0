---
phase: 49
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/.size-limit.json
  - frontend/docs/bundle-budget.md
  - .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md
autonomous: true
requirements: [BUNDLE-01, BUNDLE-04]
requirements_addressed: [BUNDLE-01, BUNDLE-04]
must_haves:
  truths:
    - 'D-05: `ANALYZE=true pnpm -C frontend build` emits `frontend/dist/stats.html`; top-20 chunks + lazy() candidates are captured in `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`'
    - 'D-01: `frontend/.size-limit.json` Initial JS ceiling reads `"limit": "450 KB"` (was 517 KB)'
    - 'D-03: Per-chunk ceilings rebased to measured + 5 KB (React 350 / TanStack 55 / d3-geospatial 56 / static-primitives 12)'
    - 'D-02: Total JS ceiling reads `"limit": "1.8 MB"` (was 2.43 MB) — OR the planner-authored escalation block is filed in `49-BUNDLE-AUDIT.md` with measured numbers proving 1.8 MB unattainable inside the phase'
    - 'D-09: `frontend/docs/bundle-budget.md` scaffold exists with table header `| chunk | gz size | ceiling | rationale | last-audited |` and rows for every chunk >100 KB gz (Initial / React / TanStack at minimum; sub-vendor rows added in Plan 02)'
    - 'D-14: Zero new `eslint-disable` / `@ts-ignore` / `@ts-expect-error` introduced in this plan; zero size-limit ceilings raised vs `main` baseline (only lowered)'
    - 'Phase tag `phase-49-base` exists at `main` HEAD as the diff anchor for the phase-close D-14 audit'
  artifacts:
    - path: '.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md'
      provides: 'One-shot audit snapshot — top-20 chunks by gz, suspected app-chunk eager culprits, proposed lazy() candidates (Plan 02 input)'
      contains: 'Top 20 chunks by gz size'
    - path: 'frontend/.size-limit.json'
      provides: 'Re-baselined ceilings per D-01..D-03; entry shape preserved (name/path/limit/gzip/running)'
      contains: '450 KB'
    - path: 'frontend/docs/bundle-budget.md'
      provides: 'Living rationale doc — every chunk >100 KB gz with rationale (BUNDLE-04 evidence)'
      contains: '| chunk | gz size | ceiling | rationale | last-audited |'
    - path: '(git tag) phase-49-base'
      provides: 'Diff anchor for phase-close D-14 suppression / ceiling-raise audit'
  key_links:
    - from: 'frontend/.size-limit.json'
      to: 'frontend/dist/assets/*.js'
      via: 'glob path entries enforced by `pnpm -C frontend size-limit`'
      pattern: 'dist/assets/.*-\\*\\.js'
    - from: '.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md'
      to: 'Plan 02 lazy() candidate selection (D-06)'
      via: 'audit ranks ≥30 KB gz non-initial-path components for conversion'
      pattern: 'Proposed lazy() conversions'
phase_decisions_locked:
  D-01_initial_ceiling: 'Initial JS ceiling = 450 KB gz (10% headroom over 411.98 KB measured baseline). NOT 500 KB; NOT 517 KB. Verbatim in `.size-limit.json`.'
  D-02_total_ceiling: 'Total JS ceiling = 1.8 MB gz. If audit shows unattainable, planner-authored escalation block in 49-BUNDLE-AUDIT.md documents measured projected Total JS post-Plan-02 + escalation rationale BEFORE this plan raises the ceiling. Never silently increase.'
  D-03_per_chunk_ceilings: 'Re-baseline ceilings to measured + 5 KB. React 350 KB / TanStack 55 KB / d3-geospatial 56 KB / static-primitives 12 KB. Sub-vendor entries are NOT added in this plan — Plan 02 adds them after manualChunks branches land (avoids assert-size-limit-matches.mjs failing on empty globs).'
  D-05_audit_artifact: 'Audit fires from a clean ANALYZE=true production build. `dist/stats.html` is the source; `49-BUNDLE-AUDIT.md` is the committed summary. Audit runs pre-Plan-02 manualChunks changes — baseline snapshot.'
  D-09_rationale_doc: 'Sibling note `frontend/docs/bundle-budget.md` (not inline JSON comments — `.size-limit.json` is raw JSON read by `assert-size-limit-matches.mjs:39`). This plan creates the scaffold + Initial/React/TanStack rows; Plan 02 appends sub-vendor rows.'
  D-14_phase_tag: '`phase-49-base` git tag created at `main` HEAD before any phase work. Diff anchor for the phase-close D-14 net-new audit run in Plan 03 final wave.'
---

<objective>
Create the audit-and-budget-calibration foundation for Phase 49. Three deliverables, audit-first:

1. **`phase-49-base` git tag** at `main` HEAD — diff anchor for the D-14 phase-close audit (Plan 03 final wave).
2. **`.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`** — one-shot audit snapshot from `ANALYZE=true pnpm -C frontend build`. Lists top-20 chunks by gz, suspected `app` chunk eager-import culprits, and ranks ≥30 KB gz non-initial-path components as lazy() candidates. Plan 02 D-06 consumes this ranking — without it, lazy() picks are guesswork (CONTEXT D-05).
3. **`frontend/.size-limit.json` re-baselined** per D-01 / D-02 / D-03 (Initial 517→450 / Total 2.43 MB→1.8 MB / React 349→350 / TanStack 51→55 / d3-geospatial 55→56 / static-primitives 64→12). No sub-vendor entries added here — Plan 02 adds them in lockstep with the manualChunks branches.
4. **`frontend/docs/bundle-budget.md` scaffold** — table header `| chunk | gz size | ceiling | rationale | last-audited |` with Initial / React vendor / TanStack vendor / Total JS rows. Plan 02 appends HeroUI / Sentry / DnD rows after their measurements.

Purpose: real budget, not aspirational (BUNDLE-01); documented rationale for every chunk >100 KB gz (BUNDLE-04); audit numbers feed Plan 02 lazy() picks and Plan 03 escalation paper trail. This plan is audit-first — Plan 02 cannot start without the artifact.

Output: phase-49-base tag, audit snapshot artifact, re-baselined ceiling JSON, rationale-doc scaffold, all four committed.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/49-bundle-budget-reset/49-CONTEXT.md
@.planning/phases/49-bundle-budget-reset/49-RESEARCH.md
@.planning/phases/49-bundle-budget-reset/49-PATTERNS.md
@.planning/phases/49-bundle-budget-reset/49-VALIDATION.md
@.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md
@./CLAUDE.md
@frontend/.size-limit.json
@frontend/scripts/assert-size-limit-matches.mjs
@frontend/vite.config.ts

<interfaces>
<!-- Current .size-limit.json shape (VERIFIED 2026-05-12 — 6 entries; Phase 49 rewrites limits + adds entries in Plan 02):

[
{ "name": "Initial JS (entry point)", "path": "dist/assets/app-*.js", "limit": "517 KB", "gzip": true, "running": false },
{ "name": "React vendor", "path": "dist/assets/react-vendor-*.js", "limit": "349 KB", "gzip": true, "running": false },
{ "name": "TanStack vendor", "path": "dist/assets/tanstack-vendor-*.js", "limit": "51 KB", "gzip": true, "running": false },
{ "name": "Total JS", "path": "dist/assets/*.js", "limit": "2.43 MB","gzip": true, "running": false },
{ "name": "signature-visuals/d3-geospatial", "path": "dist/assets/signature-visuals-d3-*.js", "limit": "55 KB", "gzip": true, "running": false },
{ "name": "signature-visuals/static-primitives", "path": "dist/assets/signature-visuals-static-*.js", "limit": "64 KB", "gzip": true, "running": false }
]

Target post-Plan-01 ceilings (per D-01..D-03; Plan 02 will append heroui/sentry/dnd entries):

Initial JS (entry point) → "450 KB" (was 517 KB; D-01 — 411.98 KB measured + 10% headroom)
React vendor → "350 KB" (was 349 KB; D-03 — 347 KB measured + ~5 KB)
TanStack vendor → "55 KB" (was 51 KB; D-03 — 50.1 KB measured + ~5 KB)
Total JS → "1.8 MB" (was 2.43 MB; D-02 — see escalation path below)
signature-visuals/d3-geospatial → "56 KB" (was 55 KB; D-03 — 54.15 KB measured + ~2 KB)
signature-visuals/static-primitives → "12 KB" (was 64 KB; D-03 — 9 KB measured + 3 KB; oversized symbolic dropped)

D-02 escalation rule (verbatim from CONTEXT.md):
If the audit shows the projected post-Plan-02 Total JS is >1.8 MB, this plan
authors an escalation block in 49-BUNDLE-AUDIT.md before raising the ceiling.
The block must contain: measured pre-Plan-02 Total JS, measured projected gz savings
from D-07 sub-vendor decomposition + D-06 lazy() candidates, projected post-Plan-02
Total JS, recommended new ceiling. Never silently increase the ceiling.

Auto-rule: locked ceiling value = max(1.8 MB, sum-of-per-chunk-ceilings × 1.05).
Plan 01 computes the right-hand side post-audit; Plan 02 confirms after measurement.

Existing FullScreenGraphModal + 28 lazy() call sites (PATTERNS §"Audit-identified ≥30 KB gz components"):
Plan 01 surfaces candidates; Plan 02 converts. Examples per CONTEXT D-06: - CalendarEntryForm (modal — likely lazy candidate) - EntityLinkManager (48 KB raw — confirmed lazy at TicketDetail.tsx:23; verify gz) - stakeholder-influence / sla-monitoring / custom-dashboard / workflow-automation (chart-heavy)
Components below 30 KB gz stay eager (D-06 threshold).

Audit ordering (CONTEXT D-05 + PATTERNS §"Audit ordering matters"):
Plan 01 audit fires PRE Plan 02 vendor decomposition.
This is the baseline snapshot — top-20 chunks against the CURRENT `vendor` super-chunk,
not the post-decomp split. Plan 02 may run a second audit pass post-decomp; not required.
-->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                                 | Description                                                                                                                      |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `.size-limit.json` rewrite                               | A ceiling raise vs measured baseline (other than D-02 with escalation paper trail) silently absorbs drift and defeats BUNDLE-01. |
| `49-BUNDLE-AUDIT.md` measurements → Plan 02 lazy() picks | If measurements are stale or from a non-clean build, Plan 02 converts the wrong components.                                      |
| `phase-49-base` tag                                      | Diff anchor for D-14. If created after work begins, the audit misses additions; if missing, D-14 cannot run honestly.            |
| `frontend/docs/` folder creation                         | Folder doesn't exist on `main` (verified 2026-05-12). Must be created via `mkdir -p` BEFORE writing the file.                    |

## STRIDE Threat Register

| Threat ID | Category               | Component                                                           | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                            |
| --------- | ---------------------- | ------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-49-01   | Tampering              | `.size-limit.json` ceiling raised silently to absorb measured drift | mitigate    | Task 4 acceptance criterion compares each rewritten ceiling against the baseline values quoted in `<interfaces>`. Any value > baseline (other than D-02 with escalation block) fails the gate. Plan 03 D-14 phase-close audit re-runs this check across the whole phase using `git diff phase-49-base..HEAD -- frontend/.size-limit.json`. |
| T-49-02   | Information disclosure | Audit captured against a stale build with cached chunks             | mitigate    | Task 2 deletes `frontend/dist/` before re-running `ANALYZE=true pnpm -C frontend build`. The build runs in production mode with the same Rollup config CI uses.                                                                                                                                                                            |
| T-49-03   | Tampering              | `phase-49-base` tag created after phase work starts                 | mitigate    | Task 1 is pre-flight — creates the tag BEFORE any audit/edit. Task 1 acceptance: `git rev-parse phase-49-base` returns the SHA of `origin/main` HEAD at session start (captured via `git fetch origin && git rev-parse origin/main`).                                                                                                      |
| T-49-04   | Repudiation            | D-02 ceiling silently raised without escalation paper trail         | mitigate    | Task 4 includes a check: if planner-locked Total JS ceiling > 1.8 MB, `49-BUNDLE-AUDIT.md` MUST contain an `## Escalation (D-02)` section with measured numbers. `grep -c "## Escalation (D-02)" 49-BUNDLE-AUDIT.md` is the gate.                                                                                                          |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Pre-flight — confirm Phase 48 closure; create phase-49-base diff anchor</name>
  <files>(no files; pre-flight + git tag)</files>
  <read_first>
    - .planning/STATE.md (verify Phase 48 = Complete; v6.2 row reads `3/3 | Complete`)
    - .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md (D-17 ledger — proves Phase 48 closed clean)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-14 (zero net-new suppression + ceiling-raise rule)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"Pattern S3 — Suppression-count diff anchor"
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (analog ledger — phase-47-base tag precedent)
  </read_first>
  <action>
    1. Confirm Phase 48 closed clean:
       - `grep -c "v6.2/48-03" .planning/STATE.md` returns 1 (Phase 48 close decision recorded).
       - `grep -E "^\| 48 \|" .planning/STATE.md | grep -c "Complete"` returns 1.
       - `test -f .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md` succeeds.
       If any check fails, STOP — Phase 49 cannot start until Phase 48 is closed.

    2. Confirm working tree is clean on the merge base (no uncommitted edits to phase files):
       - `git status --porcelain | grep -E '^.M .planning/phases/49' | grep -c .` returns 0 (the planning artifacts are not modified outside Plan-01 changes).
       - Note: pre-existing tracked-but-modified files outside .planning/phases/49 are acceptable; verified with `git diff --name-only HEAD`. If the tree carries uncommitted work that would conflict with Task 4 commits, STOP and ask for cleanup direction.

    3. Confirm frontend baseline gates (typed + linted state preserved from Phase 47/48):
       - `pnpm --filter intake-frontend type-check; echo "fe tc exit=$?"` MUST print `exit=0`.
       - `pnpm --filter intake-frontend lint; echo "fe lint exit=$?"` MUST print `exit=0`.
       - `pnpm -C frontend size-limit; echo "size-limit exit=$?"` MUST print `exit=0` (current symbolic ceilings still hold on the unmodified baseline).
       If any check fails, STOP — Phase 49 cannot ride on a regressed baseline.

    4. Fetch latest origin/main and create the phase-49-base tag:
       - `git fetch origin main`
       - Confirm working branch is current: `git rev-parse HEAD` and `git rev-parse origin/main` SHOULD match (per CONTEXT, Phase 48 closed on main).
       - Create the annotated tag: `git tag -a phase-49-base origin/main -m "Phase 49 diff anchor — bundle-budget-reset"`
       - Verify: `git rev-parse phase-49-base` returns a 40-char SHA. (Tag is local-only at this point per Phase 47/48 precedent — push is optional.)

    5. Capture current size-limit baseline for the T-49-01 audit diff:
       - `pnpm -C frontend size-limit --json > /tmp/49-01-sizelimit-before.json 2>&1` (if `--json` is unsupported by the installed size-limit version, fall back to `pnpm -C frontend size-limit | tee /tmp/49-01-sizelimit-before.txt`).
       - Eyeball the file: every reported chunk SHOULD be within its current ceiling on the unmodified baseline.

  </action>
  <verify>
    <automated>
      grep -c "v6.2/48-03" .planning/STATE.md
      grep -E "^\| 48 \|" .planning/STATE.md | grep -c "Complete"
      test -f .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md
      pnpm --filter intake-frontend type-check
      pnpm --filter intake-frontend lint
      pnpm -C frontend size-limit
      git rev-parse phase-49-base
      test -s /tmp/49-01-sizelimit-before.json || test -s /tmp/49-01-sizelimit-before.txt
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `.planning/STATE.md` row `| 48 | v6.2 | 3/3 | Complete | …` is present.
    - Source: `.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md` exists.
    - Behavior: `pnpm --filter intake-frontend type-check; echo $?` returns 0.
    - Behavior: `pnpm --filter intake-frontend lint; echo $?` returns 0.
    - Behavior: `pnpm -C frontend size-limit; echo $?` returns 0 (baseline gates pass on unmodified tree).
    - Behavior: `git rev-parse phase-49-base` returns a 40-char SHA (tag created at origin/main HEAD).
    - Source: `/tmp/49-01-sizelimit-before.json` OR `/tmp/49-01-sizelimit-before.txt` is non-empty (baseline measurement captured).
  </acceptance_criteria>
  <done>Phase 48 closure confirmed; phase-49-base tag created at origin/main HEAD; baseline size-limit snapshot captured for T-49-01 diff.</done>
</task>

<task type="auto">
  <name>Task 2: Run ANALYZE build; capture audit snapshot in 49-BUNDLE-AUDIT.md</name>
  <files>.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md</files>
  <read_first>
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-05 (ANALYZE=true → dist/stats.html, commit summary)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 7" (audit artifact schema verbatim)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"`.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` (CREATE — one-shot artifact)" (schema)
    - frontend/vite.config.ts lines 40-48 (rollup-plugin-visualizer wiring — gzipSize:true, brotliSize:true, treemap)
    - frontend/package.json `analyze` script (confirm `ANALYZE=true pnpm build` works as documented)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-06 (lazy() threshold: ≥30 KB gz AND not in initial path)
  </read_first>
  <action>
    Produce a clean audit snapshot from a production build. The audit is the input Plan 02 D-06 lazy() picks consume; without it those picks are guesswork.

    1. Wipe stale build artifacts to guarantee a clean snapshot (T-49-02 mitigation):
       - `rm -rf frontend/dist`
       - Confirm: `test -d frontend/dist; echo "exists=$?"` — `exists=1` means absent.

    2. Run the analyze build:
       - `ANALYZE=true pnpm -C frontend build` (this generates `frontend/dist/stats.html` and emits production-shaped chunks under `frontend/dist/assets/`).
       - `ls -la frontend/dist/stats.html` MUST succeed (file exists, non-zero size).
       - `ls -la frontend/dist/assets/*.js | head -30` shows the chunk inventory the audit summarizes.

    3. Measure each chunk's gz size for the top-20 table. The simplest path is `pnpm -C frontend size-limit --json > /tmp/49-01-sizelimit-after-build.json` (or fallback to plain output) — this gives gz sizes for entries already in `.size-limit.json`. For chunks NOT yet in `.size-limit.json` (residual `vendor`, `motion-vendor`, `radix-vendor`, `signature-visuals-d3`, `signature-visuals-static`, `charts-vendor`, `i18n-vendor`, `supabase-vendor`, `forms-vendor`, `app`, per-route splits emitted by TanStackRouterVite), use:
       - `for f in frontend/dist/assets/*.js; do printf "%s %s\n" "$(gzip -c "$f" | wc -c | awk '{print $1}')" "$f"; done | sort -nr | head -25`
       The first column is gz bytes; divide by 1024 to get KB.

    4. Inspect `frontend/dist/stats.html` (rollup-plugin-visualizer treemap) for the `app` chunk drill-down — identify which source files contribute the most to the `app-*.js` bundle. The plugin produces an HTML treemap; if the executor cannot open it, query the underlying stats JSON via `node -e 'const fs = require("fs"); const html = fs.readFileSync("frontend/dist/stats.html","utf8"); const m = html.match(/var\s+data\s*=\s*({[\s\S]*?});/); if (m) fs.writeFileSync("/tmp/49-01-stats.json", m[1]);' && jq '.nodeParts | keys | length' /tmp/49-01-stats.json` (best-effort extraction — schema may differ; fall back to manual `head`-style inspection if extraction fails).

    5. Author `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` using the schema in PATTERNS §"`49-BUNDLE-AUDIT.md` (CREATE — one-shot artifact)". Required sections (verbatim shape; planner fills numbers):

       # Phase 49 — Bundle Audit Snapshot

       **Date:** <YYYY-MM-DD>
       **Source:** `ANALYZE=true pnpm -C frontend build` → `frontend/dist/stats.html`
       **Build mode:** production
       **Build hash:** <git rev-parse HEAD>

       ## Top 20 chunks by gz size

       | Rank | Chunk | gz size | Raw size | Type | Initial path? |
       | --- | --- | --- | --- | --- | --- |
       | 1 | <chunk-name> | <X.X KB> | <Y.Y KB> | <vendor|app|route|signature-visuals> | <yes|no|partial> |
       ...

       ## Suspected `app` chunk eager-import culprits

       | Component | Path | Est. gz | Eager via | Lazy() candidate? |
       | --- | --- | --- | --- | --- |
       | <name> | frontend/src/... | <X KB> | <consumer-file:line> | <yes — meets D-06 | no — under 30 KB gz | no — initial path> |
       ...

       ## Residual `vendor` super-chunk composition (pre-Plan-02)

       | Dep | gz size | Will be split in Plan 02? |
       | --- | --- | --- |
       | @heroui/* | <X KB> | yes — heroui-vendor (D-07) |
       | @sentry/* | <X KB> | yes — sentry-vendor (D-07) |
       | @dnd-kit/* | <X KB> | yes — dnd-vendor (D-07) |
       | <other deps ≥10 KB gz> | <X KB> | <Plan-02 verdict — yes (named) | no (stays in residual)> |

       ## Proposed lazy() conversions (ranked by est. gz win — Plan 02 input)

       | Rank | Component | File path | Est. gz | Initial path? | D-06 threshold met? | Consumer site to wrap in Suspense |
       | --- | --- | --- | --- | --- | --- | --- |
       | 1 | <name> | frontend/src/... | <≥30 KB> | no | yes | <consumer-file:line> |
       ...

       ## D-02 ceiling attainability check

       Pre-Plan-02 measured Total JS gz: <X.XX MB>
       Estimated gz savings from D-07 sub-vendor decomposition: <Δ KB> (cache-isolation; minimal net Total JS change)
       Estimated gz savings from D-06 lazy() conversions: <Δ KB> (moves to non-initial chunks; reduces app-* but not Total JS)
       Estimated post-Plan-02 Total JS gz: <X.XX MB>
       D-02 attainability verdict: <ATTAINABLE — locked at 1.8 MB | NOT ATTAINABLE — see Escalation block>

       ## Escalation (D-02) — only present if 1.8 MB unattainable

       Locked-value rule: ceiling = max(1.8 MB, sum-of-per-chunk-ceilings × 1.05).
       Sum of per-chunk ceilings (post-Plan-02 entries assumed measured + 5 KB each): <Σ KB>
       Recommended ceiling: <X.XX MB>
       Rationale: <2-3 sentences naming the dep(s) that exceed the 1.8 MB target>

       ## Decision

       - Lazy() candidates approved for Plan 02 conversion: <count>
       - Sub-vendor decomposition list confirmed (heroui, sentry, dnd): <yes — all present in tree | partial — `<name>` not present>
       - Optional sub-vendors per CONTEXT: <pdf-vendor / editor-vendor verdict — present? worth splitting?>

    6. Verify the audit table is populated with real numbers (no `<placeholder>` text remains for filled rows):
       - `grep -c "^| 1 |" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` returns ≥4 (at least four table sections have a populated row 1).
       - `grep -c "<placeholder>" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` returns 0 (no unfilled markers).

  </action>
  <verify>
    <automated>
      test -f frontend/dist/stats.html
      ls frontend/dist/assets/*.js | head -5
      test -f .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md
      grep -c "Top 20 chunks by gz size" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md
      grep -c "Proposed lazy() conversions" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md
      grep -c "D-02 ceiling attainability check" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md
      grep -c "<placeholder>" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `frontend/dist/stats.html` exists and is non-empty.
    - Source: `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` exists.
    - Source: `grep -c "Top 20 chunks by gz size" 49-BUNDLE-AUDIT.md` returns 1.
    - Source: `grep -c "Suspected \`app\` chunk eager-import culprits" 49-BUNDLE-AUDIT.md` returns 1.
    - Source: `grep -c "Proposed lazy() conversions" 49-BUNDLE-AUDIT.md` returns 1.
    - Source: `grep -c "D-02 ceiling attainability check" 49-BUNDLE-AUDIT.md` returns 1.
    - Source: `grep -c "<placeholder>" 49-BUNDLE-AUDIT.md` returns 0 (no unfilled markers).
    - Source: top-20 table has ≥10 populated rows (`awk '/^## Top 20 chunks by gz size/,/^## /' 49-BUNDLE-AUDIT.md | grep -cE "^\| [0-9]"` returns ≥10).
    - Source: proposed lazy() conversions table has ≥1 populated row (Plan 02 input).
    - Gate proof (D-02 attainability): if the audit's verdict line reads `NOT ATTAINABLE`, an `## Escalation (D-02)` section is present with a recommended ceiling and rationale (`grep -c "## Escalation (D-02)" 49-BUNDLE-AUDIT.md` returns 1).
  </acceptance_criteria>
  <done>ANALYZE build completed; stats.html generated; 49-BUNDLE-AUDIT.md committed with top-20 chunks, app-chunk culprits, residual vendor breakdown, ≥1 lazy() candidate, and D-02 attainability verdict.</done>
</task>

<task type="auto">
  <name>Task 3: Scaffold frontend/docs/bundle-budget.md with table header + Initial/React/TanStack rows</name>
  <files>frontend/docs/bundle-budget.md</files>
  <read_first>
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-09 (sibling note over inline JSON comments)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 6" (bundle-budget.md schema verbatim)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"`frontend/docs/bundle-budget.md` (CREATE — folder + file new)" (no in-repo analog; schema from research)
    - ./CLAUDE.md §"Design rules — non-negotiable" (no marketing voice, no emoji, sentence case for headings)
    - .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md (just created in Task 2 — source numbers come from here)
  </read_first>
  <action>
    Create the living rationale doc. Plan 01 scaffolds with table header + Initial / React vendor / TanStack vendor / Total JS rows. Plan 02 appends HeroUI / Sentry / DnD rows after measurement; Plan 02 also adds the "Residual vendor" subsection rows after D-08 documentation.

    1. Create the folder (PATTERNS confirms `frontend/docs/` does not exist on `main`):
       - `mkdir -p frontend/docs`

    2. Author `frontend/docs/bundle-budget.md` with this structure (verbatim from PATTERNS / RESEARCH Pattern 6). Headings are sentence case; no marketing voice, no emoji (CLAUDE.md §Design rules).

       Required heading + table-header row:
       # Frontend bundle budget

       Last audited: <YYYY-MM-DD from Task 2 audit>
       Audit artifact: `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`

       This document records the rationale for every chunk over 100 KB gzipped in
       the production build. Sibling to `frontend/.size-limit.json` per Phase 49 D-09.

       ## Ceilings

       | Chunk | gz size | Ceiling | Rationale | Last audited |
       | --- | --- | --- | --- | --- |
       | Initial JS (`app-*`) | <measured KB from audit> | 450 KB | Entry route — TanStack Router shell + provider tree + i18n init. Lazy boundaries below cut growth here. | <YYYY-MM-DD> |
       | React vendor | <measured> | 350 KB | react + react-dom + scheduler — near native floor. Cannot be reduced without dropping React itself. | <YYYY-MM-DD> |
       | TanStack vendor | <measured> | 55 KB | @tanstack/react-router + react-query + react-table + react-virtual — all on the initial path. | <YYYY-MM-DD> |
       | Total JS | <measured> | <1.8 MB or escalated value from 49-BUNDLE-AUDIT.md> | Sum of all `dist/assets/*.js` gzipped. Computed ceiling = max(1.8 MB, sum-of-per-chunk-ceilings × 1.05). | <YYYY-MM-DD> |

       <!-- Plan 02 appends rows here for HeroUI vendor / Sentry vendor / DnD vendor
            after the post-decomp build measures them. Plan 02 also fills in
            `Residual vendor chunk` below per D-08. -->

       ## Residual vendor chunk

       Per D-08: after the D-07 named sub-vendors split off, anything remaining in
       `vendor-*` that is ≥10 KB gz gets a row below with an explanation of why
       it stays in the catch-all bucket.

       | Dep | gz size | Reason for staying in `vendor` |
       | --- | --- | --- |
       | <Plan 02 fills> | <Plan 02 fills> | <Plan 02 fills> |

    3. Replace `<measured KB from audit>` placeholders with the numbers from `49-BUNDLE-AUDIT.md` top-20 table (Initial / React vendor / TanStack vendor / Total JS rows). Use the gz column. Round to 1 decimal place.

    4. Verify the table header row matches the exact column shape required by `<acceptance_criteria>` (`| chunk | gz size | ceiling | rationale | last-audited |` — case-insensitive). Note: heading column casing in the file uses `| Chunk | gz size | Ceiling | Rationale | Last audited |` per sentence-case CLAUDE.md rule; the grep gate is case-insensitive.

    5. Sanity-grep for banned tokens:
       - `rg -n '(Discover|Easily|Unleash|!|emoji)' frontend/docs/bundle-budget.md` returns 0 matches.
       - `rg -nP '[\x{1F300}-\x{1FAFF}]' frontend/docs/bundle-budget.md` returns 0 matches (no emoji).

  </action>
  <verify>
    <automated>
      test -f frontend/docs/bundle-budget.md
      grep -ciE "^\| chunk \| gz size \| ceiling \| rationale \| last.audited \|" frontend/docs/bundle-budget.md
      grep -c "Initial JS" frontend/docs/bundle-budget.md
      grep -c "React vendor" frontend/docs/bundle-budget.md
      grep -c "TanStack vendor" frontend/docs/bundle-budget.md
      grep -c "Total JS" frontend/docs/bundle-budget.md
      grep -c "Residual vendor chunk" frontend/docs/bundle-budget.md
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `frontend/docs/bundle-budget.md` exists.
    - Source: `grep -ciE "^\| chunk \| gz size \| ceiling \| rationale \| last.audited \|" frontend/docs/bundle-budget.md` returns ≥1 (table header present, case-insensitive).
    - Source: `grep -c "Initial JS" frontend/docs/bundle-budget.md` returns ≥1 (Initial JS row).
    - Source: `grep -c "React vendor" frontend/docs/bundle-budget.md` returns ≥1.
    - Source: `grep -c "TanStack vendor" frontend/docs/bundle-budget.md` returns ≥1.
    - Source: `grep -c "Total JS" frontend/docs/bundle-budget.md` returns ≥1.
    - Source: `grep -c "Residual vendor chunk" frontend/docs/bundle-budget.md` returns 1 (Plan 02 hook present).
    - Source: `rg -n '(Discover|Easily|Unleash)' frontend/docs/bundle-budget.md` returns 0 matches (no marketing voice — CLAUDE.md §Design rules).
    - Source: `rg -nP '[\x{1F300}-\x{1FAFF}]' frontend/docs/bundle-budget.md` returns 0 matches (no emoji).
  </acceptance_criteria>
  <done>frontend/docs/bundle-budget.md scaffolded with table header, four Initial/React/TanStack/Total rows, Plan-02 hooks for sub-vendor + residual rows; no marketing voice; no emoji.</done>
</task>

<task type="auto">
  <name>Task 4: Re-baseline .size-limit.json ceilings per D-01/D-02/D-03</name>
  <files>frontend/.size-limit.json</files>
  <read_first>
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-01, D-02, D-03 (verbatim ceiling values)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 2: `.size-limit.json` Sub-Vendor Entry Schema" (entry shape — name/path/limit/gzip/running)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"`frontend/.size-limit.json` (rewrite)" (verbatim what-changes list)
    - .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md (D-02 attainability verdict — drives Total JS final value)
    - frontend/.size-limit.json (current 6 entries — surgical replacement, not rewrite)
    - frontend/scripts/assert-size-limit-matches.mjs lines 11-18 (glob shape contract — `*` → `[^/]*`; flat structure)
  </read_first>
  <action>
    Surgical replacement of `limit` values on the existing 6 entries per D-01/D-02/D-03. No new entries in this plan (Plan 02 appends heroui/sentry/dnd entries after the manualChunks branches emit those chunks — adding entries before the chunks exist would fail `assert-size-limit-matches.mjs` (expects ≥1 file per glob)).

    1. Read the audit's D-02 attainability verdict from `49-BUNDLE-AUDIT.md`:
       - `grep -A 1 "D-02 attainability verdict" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`
       - If verdict is `ATTAINABLE`, Total JS ceiling = `"1.8 MB"`.
       - If verdict is `NOT ATTAINABLE`, Total JS ceiling = the `Recommended ceiling` value from the `## Escalation (D-02)` section. The escalation block MUST exist; absence of the block means STOP and re-do Task 2.

    2. Edit `frontend/.size-limit.json` — surgical `limit` replacements only. Preserve `name`, `path`, `gzip`, `running` byte-for-byte on every existing entry. Do NOT change array ordering. Do NOT add/remove entries.

       Verbatim replacements (left side = current ceiling, right side = new ceiling per D-01..D-03):

       | Entry name | Current limit | New limit | Source decision |
       | --- | --- | --- | --- |
       | Initial JS (entry point) | "517 KB" | "450 KB" | D-01 |
       | React vendor | "349 KB" | "350 KB" | D-03 (347 measured + ~3 KB) |
       | TanStack vendor | "51 KB" | "55 KB" | D-03 (50.1 measured + ~5 KB) |
       | Total JS | "2.43 MB" | "1.8 MB" OR escalated value | D-02 + audit verdict |
       | signature-visuals/d3-geospatial | "55 KB" | "56 KB" | D-03 (54.15 measured + headroom) |
       | signature-visuals/static-primitives | "64 KB" | "12 KB" | D-03 (9 measured + 3 KB; symbolic oversized dropped) |

       Use `Edit` tool for each replacement. Do NOT rewrite the whole file via `Write` — surgical edits keep diff noise low and make the T-49-01 audit trivial (`git diff phase-49-base..HEAD -- frontend/.size-limit.json` shows only `limit` lines changed).

    3. Verify JSON validity:
       - `node -e 'JSON.parse(require("fs").readFileSync("frontend/.size-limit.json","utf8"))'` exits 0.
       - `jq '. | length' frontend/.size-limit.json` outputs `6` (entry count unchanged — Plan 01 does NOT add sub-vendor entries).

    4. Re-run the gates and confirm they STILL pass on the unmodified `manualChunks` (no chunks built yet match the new lower ceilings, so this validates the JSON shape, not the budget):
       - `pnpm -C frontend build` exits 0. (Note: this build will likely FAIL `pnpm -C frontend size-limit` because the new 450 KB Initial JS ceiling is below current measurement on the not-yet-decomposed tree. That is INTENDED — the size-limit gate becomes binding only after Plan 02 lazy() conversions + Plan 02 vendor decomposition land. Plan 03 smoke PRs prove BLOCKED on the post-Plan-02 baseline.)
       - `node frontend/scripts/assert-size-limit-matches.mjs` exits 0 (every existing entry's glob still resolves to ≥1 file — no new globs added in Plan 01).
       - `pnpm -C frontend size-limit; echo "size-limit exit=$?"` is allowed to print `exit=1` (Initial JS likely exceeds the new 450 KB ceiling). This is expected and validates the tightened ceiling will bite once Plan 02 lazy() lands. Acceptance is "the JSON parses and the assert script passes," not "size-limit exits 0."

    5. T-49-01 audit — confirm only `limit` values changed and that none exceed the baseline values listed in step 2 (other than Total JS via D-02 escalation):
       - `git diff phase-49-base..HEAD -- frontend/.size-limit.json` should show only `"limit": "..."` line changes.
       - For each `+` line of form `"limit": "<VALUE>"`, the corresponding `-` line of form `"limit": "<BASELINE>"` MUST satisfy: new value ≤ baseline value (for Initial / React / TanStack / d3-geospatial / static-primitives — these are LOWERED) OR new value ≤ 1.8 MB for Total JS (or > 1.8 MB iff `49-BUNDLE-AUDIT.md` contains `## Escalation (D-02)`).

       A helper grep gate:
       - `grep -c "## Escalation (D-02)" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` is 0 OR 1.
       - If 0: `grep -E '"limit": "(1\.8 MB|[0-9]+ KB)"' frontend/.size-limit.json | grep -vE '"limit": "(2\.[0-9]+ MB|[5-9][0-9]{2} KB)"' | wc -l` (ad hoc; the executor's job is to eyeball that no ceiling exceeds baseline).

    6. Commit all three artifacts together (audit + scaffold + ceiling rewrite are one logical Plan 01 unit):
       - `git add .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md frontend/docs/bundle-budget.md frontend/.size-limit.json`
       - `git commit -m "docs(49-01): audit snapshot + bundle-budget scaffold + size-limit re-baseline per D-01..D-03"`

  </action>
  <verify>
    <automated>
      node -e 'JSON.parse(require("fs").readFileSync("frontend/.size-limit.json","utf8"))'
      jq '. | length' frontend/.size-limit.json
      pnpm -C frontend build
      node frontend/scripts/assert-size-limit-matches.mjs
      grep -c '"limit": "450 KB"' frontend/.size-limit.json
      grep -c '"limit": "350 KB"' frontend/.size-limit.json
      grep -c '"limit": "55 KB"' frontend/.size-limit.json
      grep -c '"limit": "56 KB"' frontend/.size-limit.json
      grep -c '"limit": "12 KB"' frontend/.size-limit.json
      git diff phase-49-base -- frontend/.size-limit.json | grep -c '^[+-]'
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `frontend/.size-limit.json` parses as valid JSON (`node -e 'JSON.parse(...)'` exits 0).
    - Source: `jq '. | length' frontend/.size-limit.json` returns `6` (entry count unchanged from pre-Plan-01).
    - Source: `grep -c '"limit": "450 KB"' frontend/.size-limit.json` returns 1 (Initial JS — D-01).
    - Source: `grep -c '"limit": "350 KB"' frontend/.size-limit.json` returns 1 (React vendor — D-03).
    - Source: `grep -c '"limit": "55 KB"' frontend/.size-limit.json` returns 1 (TanStack vendor — D-03).
    - Source: `grep -c '"limit": "56 KB"' frontend/.size-limit.json` returns 1 (d3-geospatial — D-03).
    - Source: `grep -c '"limit": "12 KB"' frontend/.size-limit.json` returns 1 (static-primitives — D-03).
    - Source: `grep -c '"limit": "1.8 MB"' frontend/.size-limit.json` returns 1 OR `49-BUNDLE-AUDIT.md` contains `## Escalation (D-02)` (per D-02 attainability verdict).
    - Source: `grep -cE '"limit": "(517 KB|349 KB|51 KB|2\.43 MB|64 KB)"' frontend/.size-limit.json` returns 0 (no pre-phase ceiling values remain).
    - Behavior: `pnpm -C frontend build; echo $?` returns 0 (production build still succeeds — JSON shape unchanged).
    - Behavior: `node frontend/scripts/assert-size-limit-matches.mjs; echo $?` returns 0 (every glob still resolves to ≥1 built file — Plan 01 does not add new globs).
    - Source: `git log -1 --pretty=%s` includes `docs(49-01):` and references `audit snapshot + bundle-budget scaffold + size-limit re-baseline`.
    - Audit (T-49-01): `git diff phase-49-base -- frontend/.size-limit.json` shows only `"limit": "..."` line changes; no `name`, `path`, `gzip`, `running` field edits.
    - Audit (T-49-04): if Total JS ceiling > 1.8 MB, `grep -c "## Escalation (D-02)" 49-BUNDLE-AUDIT.md` returns 1.
  </acceptance_criteria>
  <done>.size-limit.json re-baselined per D-01..D-03; D-02 ceiling locked at 1.8 MB or escalated with paper trail; JSON parses; build + assert-script still exit 0; commit landed.</done>
</task>

</tasks>

<verification>
After all tasks complete:
- `git rev-parse phase-49-base` returns a 40-char SHA (diff anchor live).
- `test -f frontend/dist/stats.html` succeeds (audit artifact emitted).
- `test -f .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md && grep -c "Proposed lazy() conversions" .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` returns 1.
- `test -f frontend/docs/bundle-budget.md && grep -c "Initial JS" frontend/docs/bundle-budget.md` returns ≥1.
- `jq '.[] | .limit' frontend/.size-limit.json | sort -u` lists exactly the new ceiling strings (no pre-phase values remain).
- `node frontend/scripts/assert-size-limit-matches.mjs` exits 0.
- `pnpm -C frontend build` exits 0.
- `git log --oneline phase-49-base..HEAD -- .planning/phases/49-bundle-budget-reset/ frontend/.size-limit.json frontend/docs/bundle-budget.md | wc -l` returns ≥1 (commits landed).
- Plan 02 can start: Plan 02 reads `49-BUNDLE-AUDIT.md` for lazy() candidates and appends rows to `frontend/docs/bundle-budget.md` after measuring heroui/sentry/dnd chunks.
</verification>

<success_criteria>

- BUNDLE-01 (partial — sets the ceiling): `frontend/.size-limit.json` Initial JS ceiling is 450 KB gz (D-01); Total JS ceiling is 1.8 MB gz or escalated with measured paper trail (D-02); per-chunk ceilings re-baselined to measured + 5 KB (D-03). Achievement of the ceilings on the actual bundle is Plan 02's responsibility.
- BUNDLE-04 (foundation — rationale doc structure live): `frontend/docs/bundle-budget.md` exists with the required table header and the four >100 KB rows the phase ships with on day one. Plan 02 appends three sub-vendor rows.
- D-05: `49-BUNDLE-AUDIT.md` captures the top-20 chunks and ≥1 lazy() candidate ranked by est. gz win — Plan 02 input.
- D-09: Sibling note pattern adopted (`frontend/docs/bundle-budget.md`, not inline JSON comments).
- D-14: Zero net-new suppressions; zero size-limit ceilings RAISED vs baseline (only lowered, or D-02 escalation with paper trail).
- Karpathy §3 Surgical Changes: `.size-limit.json` rewrite is `limit` field changes only — no `name`/`path`/`gzip`/`running` edits, no entry additions, no ordering churn.

</success_criteria>

<output>
After completion, create `.planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md` recording:
- The audit snapshot date + git SHA the audit ran against.
- Top 5 chunks by gz size from `49-BUNDLE-AUDIT.md` (one-line each).
- D-02 attainability verdict and the locked Total JS ceiling value.
- Number of lazy() candidates ranked for Plan 02.
- Pre/post `.size-limit.json` `limit` value diff table.
- Any deviations (e.g., audit numbers differed materially from the CONTEXT baseline).
- Plan 01 close-out verdict and explicit handoff: "Plan 02 may now start; reads `49-BUNDLE-AUDIT.md` for lazy() candidates."
</output>
