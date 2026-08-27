# P99-48 Summary — bilingual dynamic-key audit

## Outcome

**RED CONTROL, AS REQUIRED.** The independently tested TypeScript-AST instrument measures all nine
ListEmptyState fallback-bearing dynamic call families across all 17 EntityType members (153 complete
leaf lookups) and the exact 13 ruled lane-3 caller sites. With locale fallback disabled, it positively
reproduces the pre-repair defects: 32 list leaves are missing from both English and Arabic, and all
eight canonical dossier-card display types are misrouted by the unprefixed graph cluster call.

The graph cluster call is also emitted as the sole unclassified row because its current caller does not
prove DOSSIER_CARD_TYPES membership and does not route an explicit type.unknown branch. This expected
pre-repair control is permitted only when the exact asserted census command is used; the ordinary
lane3/live audit remains fail-closed.

No production caller, locale bundle, or profile consumer changed. The task changes are limited to the
audit instrument, its tests, and this SUMMARY.

## Executable commands

### Instrument tests

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node --test "$R/scripts/i18n-dynamic-key-audit.test.mjs"
```

The final passing output is recorded in the verification section below.

### Resolver self-check

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --self-check
```

Verbatim output:

```json
{
  "selfCheck": "PASS",
  "checks": {
    "resolvedLeafPasses": true,
    "existingPrefixMissingLeafFails": true,
    "enOnlyFailsArabic": true,
    "arOnlyFailsEnglish": true,
    "unknownCallShapeFails": true,
    "interpolationOnlyOptionsNotFallback": true,
    "defaultValueOptionsAreFallback": true
  }
}
EXIT_CODE=0
```

### Controlled pre-repair census

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-dynamic-key-audit.mjs" "$R" --profile ar04-pre-repair --expect-list-sites 9 --expect-list-leaves 153 --expect-lane3-sites 13 --expect-list-missing-both 32 --expect-cluster-missing-both 8
```

Verbatim complete output (all resolved and missing rows, followed by every unclassified row):

```text
dynamic i18n audit: profile=ar04-pre-repair listSites=9 listLeaves=153 lane3Sites=13
rows=244 listMissingBoth=32 clusterMissingBoth=8 unclassified=1
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.document.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.dossier.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.engagement.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.commitment.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.organization.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.country.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.forum.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.event.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.task.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.person.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.position.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.mou.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.topic.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.working_group.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.elected_official.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.work_item.firstTitle	EN=MISS	AR=MISS	ns=empty-states
list	list.firstTitle	frontend/src/components/empty-states/ListEmptyState.tsx:194	list.generic.firstTitle	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.document.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.dossier.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.engagement.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.commitment.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.organization.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.country.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.forum.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.event.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.task.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.person.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.position.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.mou.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.topic.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.working_group.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.elected_official.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.work_item.title	EN=ok	AR=ok	ns=empty-states
list	list.title	frontend/src/components/empty-states/ListEmptyState.tsx:195	list.generic.title	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.document.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.dossier.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.engagement.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.commitment.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.organization.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.country.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.forum.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.event.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.task.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.person.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.position.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.mou.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.topic.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.working_group.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.elected_official.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.work_item.firstDescription	EN=MISS	AR=MISS	ns=empty-states
list	list.firstDescription	frontend/src/components/empty-states/ListEmptyState.tsx:200	list.generic.firstDescription	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.document.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.dossier.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.engagement.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.commitment.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.organization.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.country.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.forum.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.event.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.task.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.person.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.position.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.mou.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.topic.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.working_group.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.elected_official.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.work_item.description	EN=ok	AR=ok	ns=empty-states
list	list.description	frontend/src/components/empty-states/ListEmptyState.tsx:203	list.generic.description	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.document.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.dossier.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.engagement.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.commitment.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.organization.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.country.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.forum.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.event.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.task.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.person.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.position.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.mou.hint	EN=ok	AR=ok	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.topic.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.working_group.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.elected_official.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.work_item.hint	EN=MISS	AR=MISS	ns=empty-states
list	list.hint	frontend/src/components/empty-states/ListEmptyState.tsx:207	list.generic.hint	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.document.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.dossier.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.engagement.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.commitment.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.organization.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.country.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.forum.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.event.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.task.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.person.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.position.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.mou.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.topic.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.working_group.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.elected_official.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.work_item.cta	EN=ok	AR=ok	ns=empty-states
list	list.cta	frontend/src/components/empty-states/ListEmptyState.tsx:213	list.generic.cta	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.document.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.dossier.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.engagement.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.commitment.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.organization.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.country.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.forum.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.event.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.task.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.person.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.position.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.mou.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.topic.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.working_group.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.elected_official.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.work_item.createFirst	EN=MISS	AR=MISS	ns=empty-states
list	list.createFirst	frontend/src/components/empty-states/ListEmptyState.tsx:215	list.generic.createFirst	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.document.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.dossier.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.engagement.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.commitment.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.organization.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.country.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.forum.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.event.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.task.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.person.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.position.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.mou.create	EN=ok	AR=ok	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.topic.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.working_group.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.elected_official.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.work_item.create	EN=MISS	AR=MISS	ns=empty-states
list	list.create	frontend/src/components/empty-states/ListEmptyState.tsx:216	list.generic.create	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.document.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.dossier.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.engagement.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.commitment.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.organization.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.country.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.forum.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.event.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.task.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.person.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.position.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.mou.import	EN=ok	AR=ok	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.topic.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.working_group.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.elected_official.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.work_item.import	EN=MISS	AR=MISS	ns=empty-states
list	list.import	frontend/src/components/empty-states/ListEmptyState.tsx:230	list.generic.import	EN=ok	AR=ok	ns=empty-states
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:812	quickActions.analyzeForumMembership	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:812	quickActions.analyzeSharedCommittees	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:812	quickActions.analyzeEngagementChains	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.commandPalette.analyze	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:812	quickActions.analyzeShortestPath	EN=ok	AR=ok	ns=keyboard-shortcuts
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:146	sensitivity.public	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:146	sensitivity.internal	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:146	sensitivity.restricted	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:146	sensitivity.confidential	EN=ok	AR=ok	ns=list-pages
lane3	lane3.dossierTable.sensitivity	frontend/src/components/list-page/DossierTable.tsx:146	sensitivity.unknown	EN=ok	AR=ok	ns=list-pages
lane3	lane3.engagementsList.filterPill	frontend/src/components/list-page/EngagementsList.tsx:118	filter.all	EN=ok	AR=ok	ns=engagements
lane3	lane3.engagementsList.filterPill	frontend/src/components/list-page/EngagementsList.tsx:118	filter.meeting	EN=ok	AR=ok	ns=engagements
lane3	lane3.engagementsList.filterPill	frontend/src/components/list-page/EngagementsList.tsx:118	filter.travel	EN=ok	AR=ok	ns=engagements
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:187	navigation.dashboard	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:187	navigation.dossiers	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:187	navigation.workflow	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:187	navigation.calendar	EN=ok	AR=ok	ns=common
lane3	lane3.iconRail.defaultItems	frontend/src/components/modern-nav/IconRail/IconRail.tsx:187	navigation.reports	EN=ok	AR=ok	ns=common
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	country	EN=ok	AR=ok	required=type.country	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	organization	EN=ok	AR=ok	required=type.organization	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	forum	EN=ok	AR=ok	required=type.forum	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	engagement	EN=ok	AR=ok	required=type.engagement	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	topic	EN=MISS	AR=MISS	required=type.topic	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	working_group	EN=MISS	AR=MISS	required=type.working_group	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	person	EN=MISS	AR=MISS	required=type.person	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	elected_official	EN=MISS	AR=MISS	required=type.elected_official	requiredEN=ok	requiredAR=ok	route=MISS	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1542	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1542	type.elected_official	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.member_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.participates_in	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.cooperates_with	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.bilateral_relation	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.partnership	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.parent_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.subsidiary_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.related_to	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.represents	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.hosted_by	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.sponsored_by	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.involves	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.discusses	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.participant_in	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.observer_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.affiliate_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.successor_of	EN=ok	AR=ok	ns=graph
lane3	lane3.advancedGraph.relationship.1560	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1560	relationship.predecessor_of	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1645	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1645	type.elected_official	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AdvancedGraphVisualization.graphType.1853	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:1853	type.elected_official	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:140	analyze.template.forumMembership	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:140	analyze.template.sharedCommittees	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:140	analyze.template.engagementChain	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticQueryPicker.templates	frontend/src/components/relationships/AnalyticQueryPicker.tsx:140	analyze.template.shortestPath	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:163	analyze.count.membership	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:163	analyze.count.intersection	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:163	analyze.count.chain	EN=ok	AR=ok	ns=graph
lane3	lane3.analyticResultView.countLine	frontend/src/components/relationships/AnalyticResultView.tsx:163	analyze.count.path	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.261	frontend/src/components/relationships/AnalyticResultView.tsx:261	type.elected_official	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.country	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.organization	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.forum	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.engagement	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.topic	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.working_group	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.person	EN=ok	AR=ok	ns=graph
lane3	lane3.AnalyticResultView.graphType.300	frontend/src/components/relationships/AnalyticResultView.tsx:300	type.elected_official	EN=ok	AR=ok	ns=graph
UNCLASSIFIED	lane3.advancedGraph.cluster.unprefixed	frontend/src/components/relationships/AdvancedGraphVisualization.tsx:413	domain is not closed by canonical-membership proof and an explicit type.unknown branch	t(data.clusterType, data.clusterType)	ns=graph
EXIT_CODE=0
```

## Verification

The test suite validates both locales and both polarities, prefix-versus-leaf behavior, unclassified
nonliteral failure, interpolation-only options, explicit and hook-bound namespaces, malformed and
missing bundles, empty domains, the unbounded graph lookup, opaque option objects, and aliased
useTranslation translators.

Verbatim output:

```text
✔ The pre-repair tree has an independently tested, non-vacuous bilingual census that exposes the exact dynamic-key defects instead of reporting their prefixes green. (51.471792ms)
✔ The production entry point is scripts/i18n-dynamic-key-audit.mjs. It parses TypeScript call expressions rather than source lines, separates interpolation-only option objects from fallback-bearing calls, resolves explicit and hook-bound namespaces with fallbackLng disabled, and checks complete LEAF keys in en and ar. Every fallback-bearing nonliteral call in the two ruled profiles is either assigned a closed domain or reported unclassified; an empty domain, prefix-only object, missing file, malformed bundle, or unknown call shape is a failure, never zero. A domain counts as CLOSED only when the AST proves membership in the production constant that defines the closed dossier-card display set AND an explicit type.unknown branch exists in the same caller; a domain inferred from expression text, from whichever keys happen to exist in JSON, or from a fallback argument is rejected and the call is reported unclassified, which fails closed. (726.60525ms)
✔ the instrument tests exercise both locales and both polarities: a resolved leaf passes, an existing prefix with a missing leaf fails, en-only and ar-only leaves each fail, an unclassified nonliteral call fails, and interpolation-only options are not mislabeled as English defaults; and three fail-closed negative tests each red the instrument: an unbounded cluster lookup with no canonical-membership proof and no type.unknown branch, a defaultValue reachable only through a shorthand, static-computed, or spread option object, and a useTranslation translator bound to an identifier other than t (818.296458ms)
✔ the controlled live census discriminates before repair and positively reproduces both review findings: 32 missing list leaves out of the complete 153-leaf caller cross-product (17 EntityType values x 9 call families) and all eight canonical display-type leaves missed by the unprefixed graph cluster lookup; the exact 9 plus 13 caller populations are nonempty and no family is excluded to reach the expected count (174.524ms)
✔ The SUMMARY records the executable commands and complete rows, including every unclassified row. The task changes only the instrument, its tests, and its SUMMARY: it cannot make its own live result green by editing a production caller, a locale bundle, or a profile consumer. (24.277084ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1934.685417
EXIT_CODE=0
```

The harness-specific Vitest collection also proves that all five acceptance criteria are leaf test
titles rather than enclosing-suite labels:

```sh
npx vitest run scripts/i18n-dynamic-key-audit.test.mjs
```

```text
RUN  v4.1.7
Test Files  1 passed (1)
Tests  5 passed (5)
EXIT_CODE=0
```
