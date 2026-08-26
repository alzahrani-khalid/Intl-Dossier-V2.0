# P99-27 Summary — glossary classifier repair and dossier-A handoff

## Outcome

The production classifier now distinguishes genuine computer-file paths from lowercase `file` embedded inside Profile-shaped keys, consumes an exact Profile row through normal first-match classification, and enumerates singular `إحاطة` and plural `إحاطات` as separate brief-artifact identities.

The repo-wide brief-artifact row is deliberately red on exactly five live Arabic values. **P99-44 owns all five Arabic value repairs and the dependent dossier-A classification sweep.** This task did not edit an Arabic bundle or `scripts/glossary-senses.d/dossier-a.json` and does not claim the live row is green.

## Changed paths

- `scripts/glossary-census.mjs`
- `scripts/glossary-senses.json`
- `scripts/glossary-senses.d/brief-stance.json`
- `.planning/phases/99-arabic-coverage/99-27-SUMMARY.md`

No path outside the four-file P99-27 allowlist changed.

## Ruled production seams

The base `computer-file-or-attachment` pattern changed only at its file-token branch:

```text
before: ^[^:]+:.*(?:[Ff]ile|[Ff]iles|attachment|attachments|upload|dropzone|documents)(?:[._:]|$|[A-Z]).*$
after:  ^[^:]+:.*(?:[._:](?:file|files)(?:[._:]|$)|(?:File|Files|attachment|attachments|upload|dropzone|documents)(?:[._:]|$|[A-Z])).*$
```

Lowercase `file` / `files` now requires a key-path delimiter on both sides. Uppercase `File` / `Files` remains available as a camel-case segment. The attachment, upload, dropzone, and documents families are unchanged.

The brief-artifact row now carries two non-overlapping Arabic word-boundary patterns:

```text
إحاطة  -> (?<![\p{L}\p{M}])(?:ال)?إحاطة(?![\p{L}\p{M}])
إحاطات -> (?<![\p{L}\p{M}])(?:ال)?إحاطات(?![\p{L}\p{M}])
```

The optional definite article keeps `الإحاطة` / `الإحاطات` visible while the distinct term identities prevent singular/plural double-counting.

Only the stale `dossier-overview.json:documentType.brief` / `إحاطة` / `briefing-document-type` row was removed from `brief-stance.json`. Every other overlay row was retained and revalidated against its live value; the stance row remains repo-wide green.

## Production control ledger — verbatim

Command:

```sh
node scripts/glossary-census.mjs "$PWD" --control
```

Output:

```json
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
EXIT_STATUS=0
```

Every emitted control field is present above. In particular, the three classification strings prove the production family and first-match result, while the five booleans required by the handoff oracle are all `true`.

## Live brief-artifact JSON and exit status — verbatim

Command:

```sh
node scripts/glossary-census.mjs "$PWD" --row brief-artifact --json
```

Output:

```json
{
  "filesScanned": [
    "actionable-errors.json",
    "active-filters.json",
    "activity-feed.json",
    "admin.json",
    "advanced-search.json",
    "after-actions-page.json",
    "agenda.json",
    "ai-admin.json",
    "ai-brief.json",
    "ai-chat.json",
    "analytics.json",
    "approvals.json",
    "assignments.json",
    "audit-logs.json",
    "availability-polling.json",
    "bottom-sheet.json",
    "briefing-books.json",
    "briefs-page.json",
    "bulk-actions.json",
    "calendar-sync.json",
    "calendar.json",
    "citations.json",
    "collaboration.json",
    "comments.json",
    "commitment-deliverables.json",
    "commitment-drawer.json",
    "commitments.json",
    "committees.json",
    "common.json",
    "compliance.json",
    "contacts.json",
    "contextual-help.json",
    "contextual-suggestions.json",
    "copilot.json",
    "countries.json",
    "country-wizard.json",
    "dashboard-widgets.json",
    "dashboard.json",
    "delegation.json",
    "dossier-context.json",
    "dossier-drawer.json",
    "dossier-export.json",
    "dossier-overview.json",
    "dossier-recommendations.json",
    "dossier-search.json",
    "dossier-shell.json",
    "dossier.json",
    "dossiers-feature017.json",
    "dossiers.json",
    "duplicate-detection.json",
    "elected-official-wizard.json",
    "elected-officials.json",
    "email-digest.json",
    "email.json",
    "empty-states.json",
    "engagement-briefs.json",
    "engagement-recommendations.json",
    "engagement-wizard.json",
    "engagements.json",
    "enhanced-search.json",
    "entity-comparison.json",
    "entity-linking.json",
    "entity-templates.json",
    "export-import.json",
    "fab.json",
    "field-history.json",
    "field-permissions.json",
    "form-auto-save.json",
    "form-wizard.json",
    "forum-wizard.json",
    "forums.json",
    "geographic-visualization.json",
    "graph-traversal.json",
    "graph.json",
    "guided-tours.json",
    "intake.json",
    "integrations.json",
    "intelligence-alerts.json",
    "intelligence-digests.json",
    "intelligence-signals.json",
    "keyboard-shortcuts.json",
    "legislation.json",
    "lifecycle.json",
    "list-controls.json",
    "list-pages.json",
    "loading.json",
    "meeting-minutes.json",
    "milestone-planning.json",
    "multilingual.json",
    "my-work.json",
    "notification-center.json",
    "onboarding.json",
    "operations-hub.json",
    "organization-wizard.json",
    "organizations.json",
    "person-wizard.json",
    "persons.json",
    "positions.json",
    "preview-layouts.json",
    "progressive-disclosure.json",
    "progressive-form.json",
    "push-notifications.json",
    "quickswitcher.json",
    "relationships.json",
    "report-builder.json",
    "retention-policies.json",
    "sample-data.json",
    "scenario-sandbox.json",
    "scheduled-reports.json",
    "settings.json",
    "sla.json",
    "smart-input.json",
    "stakeholder-influence.json",
    "stakeholder-interactions.json",
    "swipe-gestures.json",
    "tags.json",
    "tasks-page.json",
    "topic-wizard.json",
    "topics.json",
    "unified-kanban.json",
    "user-management.json",
    "validation.json",
    "view-preferences.json",
    "webhooks.json",
    "work-creation.json",
    "workflow-automation.json",
    "working-group-wizard.json",
    "working-groups.json",
    "workspace.json"
  ],
  "fileCount": 129,
  "leafValuesScanned": 16943,
  "rows": [
    {
      "object": "brief-artifact",
      "ruledTerm": "ملخص / الملخصات",
      "before": 82,
      "after": 278,
      "unclassified": 5,
      "terms": [
        {
          "term": "ملخص",
          "disposition": "ruled-term",
          "occurrences": 278,
          "lines": 271,
          "values": 271,
          "files": 54,
          "classifications": {
            "ruled-term": 278,
            "allowlisted-sense": 0,
            "UNCLASSIFIED": 0
          }
        },
        {
          "term": "موجز",
          "disposition": "competing-term",
          "occurrences": 22,
          "lines": 22,
          "values": 22,
          "files": 9,
          "classifications": {
            "ruled-term": 0,
            "allowlisted-sense": 22,
            "UNCLASSIFIED": 0
          }
        },
        {
          "term": "إحاطة",
          "disposition": "competing-term",
          "occurrences": 56,
          "lines": 55,
          "values": 56,
          "files": 13,
          "classifications": {
            "ruled-term": 0,
            "allowlisted-sense": 55,
            "UNCLASSIFIED": 1
          }
        },
        {
          "term": "إحاطات",
          "disposition": "competing-term",
          "occurrences": 4,
          "lines": 4,
          "values": 4,
          "files": 3,
          "classifications": {
            "ruled-term": 0,
            "allowlisted-sense": 0,
            "UNCLASSIFIED": 4
          }
        }
      ]
    }
  ],
  "classificationTotals": {
    "ruled-term": 278,
    "allowlisted-sense": 77,
    "UNCLASSIFIED": 5
  },
  "unclassified": [
    {
      "object": "brief-artifact",
      "term": "إحاطة",
      "disposition": "competing-term",
      "classification": "UNCLASSIFIED",
      "file": "dossier-overview.json",
      "namespace": "dossier-overview",
      "keyPath": "documentType.brief",
      "value": "إحاطة",
      "occurrenceIndex": 1
    },
    {
      "object": "brief-artifact",
      "term": "إحاطات",
      "disposition": "competing-term",
      "classification": "UNCLASSIFIED",
      "file": "contextual-suggestions.json",
      "namespace": "contextual-suggestions",
      "keyPath": "suggestions.upcomingEngagement.description",
      "value": "المشاركة مجدولة في {{date}}{{location}}. راجع الإحاطات وحضّر المواد.",
      "occurrenceIndex": 1
    },
    {
      "object": "brief-artifact",
      "term": "إحاطات",
      "disposition": "competing-term",
      "classification": "UNCLASSIFIED",
      "file": "dossier-overview.json",
      "namespace": "dossier-overview",
      "keyPath": "documents.tabs.briefs",
      "value": "الإحاطات",
      "occurrenceIndex": 1
    },
    {
      "object": "brief-artifact",
      "term": "إحاطات",
      "disposition": "competing-term",
      "classification": "UNCLASSIFIED",
      "file": "dossier-overview.json",
      "namespace": "dossier-overview",
      "keyPath": "documents.empty.brief",
      "value": "لم يتم العثور على إحاطات",
      "occurrenceIndex": 1
    },
    {
      "object": "brief-artifact",
      "term": "إحاطات",
      "disposition": "competing-term",
      "classification": "UNCLASSIFIED",
      "file": "dossier.json",
      "namespace": "dossier",
      "keyPath": "templates.category.thematic",
      "value": "الإحاطات الموضوعية",
      "occurrenceIndex": 1
    }
  ]
}
EXIT_STATUS=1
```

The exit status is intentionally `1`: this is the positive red handoff, not a green census.

## Exact five live unclassified paths

P99-44 owns these five values:

- `contextual-suggestions.json:suggestions.upcomingEngagement.description:إحاطات`
- `dossier-overview.json:documentType.brief:إحاطة`
- `dossier-overview.json:documents.empty.brief:إحاطات`
- `dossier-overview.json:documents.tabs.briefs:إحاطات`
- `dossier.json:templates.category.thematic:إحاطات`

No hidden or additional brief-artifact residue was present.

## Other brief/stance row revalidation — verbatim

The live brief JSON above shows 55 allowlisted singular session/material occurrences, one unclassified singular artifact handoff, four unclassified plural artifact handoffs, and zero other unclassified terms. The unchanged stance family was rerun repo-wide:

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
stance	ruled=موقف / المواقف	before=53	after=222	unclassified=0
  موقف	ruled-term	occurrences=222	lines=216	values=216	files=39	ruled=222	allowlisted=0	unclassified=0
  منصب	competing-term	occurrences=44	lines=44	values=44	files=11	ruled=0	allowlisted=44	unclassified=0
  مناصب	competing-term	occurrences=9	lines=9	values=9	files=6	ruled=0	allowlisted=9	unclassified=0
classification totals: ruled=222 allowlisted=53 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
EXIT_STATUS=0
```

## Exact-five acceptance oracle — verbatim

The plan’s control-first oracle validates all five discriminating booleans, requires the live command to exit `1`, and compares the sorted handoff identities exactly. Output:

```text
EXACT_FIVE_ORACLE_EXIT_STATUS=0
```

## Verbatim-title Vitest acceptance

The five P99-27 acceptance items exist as individual Vitest leaf titles in `scripts/glossary-census.mjs`. Focused output:

```text

 RUN  v4.1.7 /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260826-160417-0000000000000043--P99-27

 ↓ scripts/glossary-census.mjs > P99-26 brief-artifact and stance sense-aware sweep > This slice reads one Arabic term for the brief-artifact and stance object, with every exception judged and recorded rather than assumed.
 ↓ scripts/glossary-census.mjs > P99-26 brief-artifact and stance sense-aware sweep > Decisions covered — D-04, D-05, D-17, D-18, D-19, D-39: sense-aware sweep over one term family and one ordered file slice, classification recorded as a committed artifact, populations re-derived. || Every repo-wide occurrence scanned by the brief-artifact and stance rows is CLASSIFIED — موجز / إحاطة / منصب / مناصب is either rewritten to the ruled ملخص / موقف family when it carries the artifact/stance sense, or listed in scripts/glossary-senses.d/brief-stance.json with its exact key path and its different sense. The census refuses to go green while any occurrence is UNCLASSIFIED, and that refusal is the whole point: it is what stops a blanket substring rewrite from passing as judgment.
 ↓ scripts/glossary-census.mjs > P99-26 brief-artifact and stance sense-aware sweep > إحاطة must SURVIVE at its session-sense paths (the over-sweep guard: sweeping it is the destructive move), and both منصب and مناصب must survive only at office-sense paths || The sweep touches ar VALUES only: no ar leaf KEY is renamed, no en value changes, no application source file changes, and bundle parity is structurally unchanged — scripts/glossary-census.mjs is the only authorized source instrument change, and a structural diff in any ar file is a defect
 ↓ scripts/glossary-census.mjs > P99-26 brief-artifact and stance sense-aware sweep > This lane's overlay file only ADDS rows to the base allowlist; removing or weakening a base row (the already-ruled sense exceptions) is a red, because that is how a sweep launders an unclassified occurrence into an allowed one || The stance row enumerates منصب and مناصب as DISTINCT competing terms so term-identity allowlist matching can consume the nine plural rows; --control proves both an allowlisted plural and a planted unclassified plural are seen || The re-derived before and after counts for this lane's term row are recorded with their commands (D-04), and what falls outside this lane's slice is named (D-05)
 ↓ scripts/glossary-census.mjs > P99-26 brief-artifact and stance sense-aware sweep > the drilled census catches both its original planted control and the plural-stance positive controls first, then reads ZERO unclassified occurrences for the brief-artifact row AND the stance row REPO-WIDE — the write scope includes every known artifact/stance rewrite while the overlay records genuine different senses — RED at HEAD (the census does not exist until 99-02, then red on the unfixed population)
 ↓ scripts/glossary-census.mjs > P99-26 brief-artifact and stance sense-aware sweep > bundle parity is structurally unchanged repo-wide with the walked-leaf count as its positive control, AND this lane committed a non-empty classification overlay — a sweep that judged nothing recorded nothing, and that is a red — RED at HEAD (the overlay file does not exist)
 ✓ scripts/glossary-census.mjs > P99-27 glossary classifier boundary and exact handoff > The production glossary classifier changes only at the ruled seams: the base computer-file key-path family gains token semantics, the brief-artifact row gains the distinct plural identity إحاطات, and --control gains the discriminating dossier/profile/brief cases; no earlier row, control, or sense exception is removed or weakened || A broader precedence rewrite, a Profile-only blacklist, or a local wrapper that leaves glossary-census.mjs unsound is a red 17ms
 ✓ scripts/glossary-census.mjs > P99-27 glossary classifier boundary and exact handoff > At the production classify entry point, a genuine file/attachment path still resolves computer-file-or-attachment, an unlisted organizationProfile-shaped path resolves UNCLASSIFIED, and the same Profile shape with an exact row resolves profile-page-or-summary || Matching lowercase file inside Profile, rejecting real file paths, or merely storing an exact row that first-match classification cannot consume is a red 1ms
 ✓ scripts/glossary-census.mjs > P99-27 glossary classifier boundary and exact handoff > The production brief-artifact row enumerates singular إحاطة and plural إحاطات as distinct, non-overlapping competing terms with Arabic word-boundary patterns, --control proves an allowlisted plural and a planted unclassified plural are both visible, and the stale wrong-sense row in brief-stance.json for the singular exact-five handoff is removed || Double-counting plural text under the singular identity, hiding the plural from the census, or retaining that wrong-sense exception is a red 95ms
 ✓ scripts/glossary-census.mjs > P99-27 glossary classifier boundary and exact handoff > the production control ledger proves the genuine-file pass, accidental-Profile fail, exact-profile pass, and both plural-brief cases, then the live repo-wide row fails on exactly the five ruled artifact values handed to P99-44 — a control-only stub, a vacuous zero, or any hidden/additional residue is red 114ms
 ✓ scripts/glossary-census.mjs > P99-27 glossary classifier boundary and exact handoff > The production classifier distinguishes genuine files from Profile, sees plural brief artifacts, and exposes exactly the five values the dependent sweep must repair. 42ms

 Test Files  1 passed (1)
      Tests  5 passed | 6 skipped (11)
   Start at  19:24:47
   Duration  356ms (transform 19ms, setup 0ms, import 25ms, tests 270ms, environment 0ms)
```

## Final scope and static verification

`node --check`, JSON parsing, Prettier checking of the three production data/code files, and `git diff --check` exited `0`. Verbatim emitted output:

```text
Checking formatting...
All matched files use Prettier code style!
```

The task-base diff plus untracked-path comparison exited `0` only after matching this exact sorted four-path set:

```text
.planning/phases/99-arabic-coverage/99-27-SUMMARY.md
scripts/glossary-census.mjs
scripts/glossary-senses.d/brief-stance.json
scripts/glossary-senses.json
```

Population boundary: this evidence covers the production classifier, base file row, brief/stance row, control ledger, and exact live handoff. Arabic value rewrites and dossier-A judgments remain outside P99-27 and belong to P99-44.
