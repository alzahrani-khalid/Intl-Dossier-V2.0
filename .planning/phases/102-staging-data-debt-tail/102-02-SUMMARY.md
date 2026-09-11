---
status: complete
phase: 102-staging-data-debt-tail
plan: 02
requirement: COPY-09
completed: 2026-09-11
---

# P102-02 — COPY-09 title-case census summary

## Outcome

The shipped instrument applies the planner's exact candidate rule, reports all 129 English namespaces in
the parser-stable field order, and validates four of four controls. The pre-edit allowlist contains 31
current-candidate carve-outs across the top-15 lanes. Every namespace has `carved == carve_rows`; no
`CARVE-NONCANDIDATE` line is emitted.

## Top-15 HEAD census comparison

The planner column is the re-derived 2026-09-10 baseline specified by P102-02 (and supersedes research
§12's older 268/231 figures). The shipped column was produced at this task's HEAD by the command below.

| namespace | planner HEAD | shipped instrument | difference | carve-outs |
| --- | ---: | ---: | ---: | ---: |
| dossier | 253 | 253 | 0 | 4 |
| common | 225 | 225 | 0 | 8 |
| assignments | 128 | 128 | 0 | 2 |
| dossiers | 127 | 127 | 0 | 3 |
| committees | 120 | 120 | 0 | 1 |
| empty-states | 105 | 105 | 0 | 0 |
| user-management | 99 | 99 | 0 | 1 |
| legislation | 94 | 94 | 0 | 1 |
| dashboard-widgets | 90 | 90 | 0 | 0 |
| workflow-automation | 88 | 88 | 0 | 1 |
| compliance | 86 | 86 | 0 | 1 |
| contacts | 85 | 85 | 0 | 0 |
| advanced-search | 79 | 79 | 0 | 0 |
| positions | 78 | 78 | 0 | 0 |
| working-groups | 77 | 77 | 0 | 9 |

There is no top-15 difference to explain: both columns apply the shipped rule to JSON string leaves,
strip `{{...}}` placeholders, require at least two whitespace words and at least two judged words,
exclude only all-caps tokens of at most four characters from judgement, and require every judged word to
start with `[A-Z][a-z]`. That explicit two-judged-word rule also explains why the controls `SLA Breach`
and `Sign in` are zero while `Add Elected Official` is detected; it prevents acronym-only or
single-judged-word labels from inflating the population. Research §12's earlier 4,354 aggregate and
268/231 namespace figures are therefore not used as the lane baseline; the planner's re-drill and this
shipped implementation agree at 4,097 aggregate candidates and at every specified top-15 magnitude.

## Commands and verbatim outputs

### Baseline and final census

Command:

```sh
node scripts/titlecase-census.mjs --controls --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md
```

Output:

```text
CONTROL 'Add Elected Official'=true expected true
CONTROL 'Add elected official'=false expected false
CONTROL 'SLA Breach'=false expected false
CONTROL 'Sign in'=false expected false
NS dossier strings=996 candidates=253 ar_mirror=253 carved=4 ar_missing_keys=0 ar_extra_keys=0 carve_rows=4
NS common strings=1496 candidates=225 ar_mirror=225 carved=8 ar_missing_keys=0 ar_extra_keys=12 carve_rows=8
NS assignments strings=393 candidates=128 ar_mirror=128 carved=2 ar_missing_keys=0 ar_extra_keys=4 carve_rows=2
NS dossiers strings=475 candidates=127 ar_mirror=127 carved=3 ar_missing_keys=0 ar_extra_keys=0 carve_rows=3
NS committees strings=255 candidates=120 ar_mirror=120 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS empty-states strings=370 candidates=105 ar_mirror=105 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS user-management strings=263 candidates=99 ar_mirror=99 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS legislation strings=285 candidates=94 ar_mirror=94 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS dashboard-widgets strings=258 candidates=90 ar_mirror=90 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS workflow-automation strings=241 candidates=88 ar_mirror=88 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS compliance strings=226 candidates=86 ar_mirror=86 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS contacts strings=278 candidates=85 ar_mirror=85 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS advanced-search strings=188 candidates=79 ar_mirror=79 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS positions strings=371 candidates=78 ar_mirror=78 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS working-groups strings=283 candidates=77 ar_mirror=77 carved=9 ar_missing_keys=0 ar_extra_keys=0 carve_rows=9
NS calendar strings=321 candidates=65 ar_mirror=65 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS analytics strings=205 candidates=64 ar_mirror=64 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossiers-feature017 strings=249 candidates=64 ar_mirror=64 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS scenario-sandbox strings=173 candidates=63 ar_mirror=63 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS intake strings=293 candidates=62 ar_mirror=62 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS webhooks strings=159 candidates=60 ar_mirror=60 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS availability-polling strings=168 candidates=57 ar_mirror=57 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS report-builder strings=240 candidates=57 ar_mirror=57 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS tags strings=159 candidates=57 ar_mirror=57 carved=0 ar_missing_keys=0 ar_extra_keys=4 carve_rows=0
NS briefing-books strings=217 candidates=56 ar_mirror=56 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS meeting-minutes strings=185 candidates=45 ar_mirror=45 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS form-wizard strings=287 candidates=44 ar_mirror=44 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS sla strings=150 candidates=43 ar_mirror=43 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS engagement-recommendations strings=91 candidates=42 ar_mirror=42 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS entity-comparison strings=154 candidates=42 ar_mirror=42 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS field-permissions strings=146 candidates=42 ar_mirror=42 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS agenda strings=155 candidates=41 ar_mirror=41 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS graph-traversal strings=94 candidates=41 ar_mirror=41 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS settings strings=213 candidates=41 ar_mirror=41 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS retention-policies strings=128 candidates=40 ar_mirror=40 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS stakeholder-interactions strings=129 candidates=40 ar_mirror=40 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS engagements strings=188 candidates=39 ar_mirror=39 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS milestone-planning strings=118 candidates=39 ar_mirror=39 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS preview-layouts strings=126 candidates=39 ar_mirror=39 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS scheduled-reports strings=118 candidates=39 ar_mirror=39 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS stakeholder-influence strings=92 candidates=39 ar_mirror=39 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS email strings=97 candidates=38 ar_mirror=38 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS notification-center strings=154 candidates=38 ar_mirror=38 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS duplicate-detection strings=99 candidates=37 ar_mirror=37 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS citations strings=100 candidates=34 ar_mirror=34 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS guided-tours strings=159 candidates=34 ar_mirror=34 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS relationships strings=220 candidates=34 ar_mirror=34 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS delegation strings=118 candidates=33 ar_mirror=33 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS commitments strings=126 candidates=32 ar_mirror=32 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossier-overview strings=181 candidates=31 ar_mirror=31 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS audit-logs strings=104 candidates=30 ar_mirror=30 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS calendar-sync strings=68 candidates=30 ar_mirror=30 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS export-import strings=161 candidates=29 ar_mirror=29 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS ai-admin strings=82 candidates=28 ar_mirror=28 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS progressive-disclosure strings=98 candidates=28 ar_mirror=28 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS elected-officials strings=61 candidates=27 ar_mirror=27 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS geographic-visualization strings=65 candidates=27 ar_mirror=27 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS fab strings=52 candidates=26 ar_mirror=26 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossier-context strings=150 candidates=25 ar_mirror=25 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS engagement-briefs strings=82 candidates=24 ar_mirror=24 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS persons strings=108 candidates=23 ar_mirror=23 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS email-digest strings=63 candidates=22 ar_mirror=22 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dashboard strings=65 candidates=21 ar_mirror=21 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS onboarding strings=92 candidates=21 ar_mirror=21 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS bulk-actions strings=162 candidates=19 ar_mirror=19 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS contextual-help strings=116 candidates=19 ar_mirror=19 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS contextual-suggestions strings=62 candidates=19 ar_mirror=19 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS operations-hub strings=50 candidates=19 ar_mirror=19 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossier-recommendations strings=48 candidates=18 ar_mirror=18 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS field-history strings=81 candidates=18 ar_mirror=18 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS forums strings=80 candidates=18 ar_mirror=18 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS multilingual strings=88 candidates=17 ar_mirror=17 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS unified-kanban strings=124 candidates=17 ar_mirror=17 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS graph strings=161 candidates=16 ar_mirror=16 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS sample-data strings=57 candidates=16 ar_mirror=16 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS entity-templates strings=76 candidates=15 ar_mirror=15 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS integrations strings=59 candidates=15 ar_mirror=15 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS my-work strings=56 candidates=15 ar_mirror=15 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS admin strings=53 candidates=14 ar_mirror=14 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS ai-brief strings=71 candidates=14 ar_mirror=14 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossier-export strings=48 candidates=14 ar_mirror=14 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS activity-feed strings=154 candidates=13 ar_mirror=13 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS lifecycle strings=69 candidates=13 ar_mirror=13 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS view-preferences strings=72 candidates=13 ar_mirror=13 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS workspace strings=63 candidates=13 ar_mirror=13 carved=0 ar_missing_keys=0 ar_extra_keys=4 carve_rows=0
NS progressive-form strings=64 candidates=11 ar_mirror=11 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS work-creation strings=57 candidates=11 ar_mirror=11 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS quickswitcher strings=48 candidates=10 ar_mirror=10 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossier-shell strings=88 candidates=9 ar_mirror=9 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS tasks-page strings=113 candidates=9 ar_mirror=9 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS enhanced-search strings=130 candidates=8 ar_mirror=8 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS collaboration strings=39 candidates=7 ar_mirror=7 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossier-search strings=50 candidates=6 ar_mirror=6 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS form-auto-save strings=41 candidates=6 ar_mirror=6 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS commitment-deliverables strings=87 candidates=4 ar_mirror=4 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS smart-input strings=71 candidates=4 ar_mirror=4 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS entity-linking strings=32 candidates=3 ar_mirror=3 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS swipe-gestures strings=41 candidates=3 ar_mirror=3 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS comments strings=51 candidates=2 ar_mirror=2 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS approvals strings=7 candidates=1 ar_mirror=1 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS keyboard-shortcuts strings=94 candidates=1 ar_mirror=1 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS actionable-errors strings=89 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS active-filters strings=21 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS after-actions-page strings=10 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS ai-chat strings=31 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS bottom-sheet strings=6 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS briefs-page strings=15 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS commitment-drawer strings=3 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS copilot strings=98 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS countries strings=40 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS country-wizard strings=3 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS dossier-drawer strings=33 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS elected-official-wizard strings=4 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS engagement-wizard strings=4 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS forum-wizard strings=3 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS intelligence-alerts strings=39 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS intelligence-digests strings=48 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS intelligence-signals strings=68 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS list-controls strings=41 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS list-pages strings=13 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS loading strings=69 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS organization-wizard strings=3 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS organizations strings=43 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS person-wizard strings=3 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS push-notifications strings=9 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS topic-wizard strings=2 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS topics strings=9 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS validation strings=84 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS working-group-wizard strings=3 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
EN_FILES=129 EN_STRINGS=16998 TITLECASE_CANDIDATES=4097 PCT=24.1
```

### Acceptance oracle

Command: the complete `command:` oracle from `102-02-PLAN.md`, run from the repository root after the
instrument and table were committed.

Output:

```text
P102-02-CENSUS rc=0 controls_agreeing=4 namespaces_reported=129 carveout_rows=31 ns_carved_ne_carve_rows=0 noncandidate_rows=[] expected rc=0 controls=4 namespaces=129 carveout_rows>=1 ns_carved_ne_carve_rows=0
PASS census-instrument
```

### Commit hook verification

Command:

```sh
git commit -m "feat(i18n): add title-case census and carve-outs"
```

Relevant terminal result (the repository hook also ran Prettier, the monorepo build, tests, type checks,
and repository checks successfully):

```text
[tickmarkr/run-20260911-181854-0000000000000083--P102-02 2d3e45b52] feat(i18n): add title-case census and carve-outs
 2 files changed, 137 insertions(+)
 create mode 100644 .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md
 create mode 100644 scripts/titlecase-census.mjs
```

## Controls and bounded zeroes

| measurement | observed | positive control proving visibility |
| --- | ---: | --- |
| disagreeing controls | 0 | four control lines were emitted and all 4 agreed |
| namespaces omitted | 0 | 129 `NS` lines were emitted for 129 English JSON files |
| namespaces with `carved != carve_rows` | 0 | 10 top-15 namespaces reported non-zero carve counts |
| non-candidate carve-out rows | 0 | 31 carve-out rows were parsed and counted |
| top-15 planner/shipped count differences | 0 | all 15 namespace counts were independently printed by the instrument |

## Deferred population

Tasks 102-08 through 102-12 own the English/Arabic lane edits; this task changed no locale strings. Task
102-19 owns the dated residue outside the top 15. The instrument's 4,097-candidate HEAD baseline includes
that later population and remains the shared lane oracle.
