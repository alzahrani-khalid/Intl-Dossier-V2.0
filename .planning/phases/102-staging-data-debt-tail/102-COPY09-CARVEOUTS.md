# COPY-09 title-case carve-outs

This is the pre-edit allowlist for the COPY-09 top-15 namespace lanes. A row is present only when the
current English leaf is a census candidate and its presentation role or named term requires the existing
capitalization to survive the sentence-case pass. Rows are keyed by the dotted JSON leaf path consumed by
`scripts/titlecase-census.mjs`; additions must pass the instrument's non-candidate check before a lane uses
them.

| namespace | key | reason |
| :--- | :--- | :--- |
| dossier | type.working_group | proper-noun: Working Group |
| dossier | type.elected_official | proper-noun: Elected Official |
| dossier | sensitivityLevel.4 | ribbon-uppercase |
| dossier | addToDossier.form.targetDossier | mono-label |
| common | navigation.workingGroups | proper-noun: Working Group |
| common | navigation.electedOfficials | proper-noun: Elected Official |
| common | reports.parameters.countries.sa | proper-noun: Saudi Arabia |
| common | reports.parameters.countries.ae | proper-noun: United Arab Emirates |
| common | reports.templates.mouStatus | acronym-led |
| common | afterActions.ai.title | acronym-led |
| common | dossierLinks.aiSuggestions.error | acronym-led |
| common | waitingQueue.assignmentDetails.workItemId | mono-label |
| assignments | queue.workItemId | mono-label |
| assignments | detail.metadata.work_item_id | mono-label |
| dossiers | types.working_group | proper-noun: Working Group |
| dossiers | type.working_group | proper-noun: Working Group |
| dossiers | sensitivity.4 | ribbon-uppercase |
| committees | types.working | proper-noun: Working Group |
| user-management | userProfile.lastLoginIp | mono-label |
| legislation | form.fields.officialTextUrl | mono-label |
| workflow-automation | entities.intake_ticket | proper-noun: Intake Ticket |
| compliance | ruleForm.ruleCode | mono-label |
| working-groups | title | proper-noun: Working Group |
| working-groups | actions.add | proper-noun: Working Group |
| working-groups | createDialog.title | proper-noun: Working Group |
| working-groups | editDialog.title | proper-noun: Working Group |
| working-groups | form.create | proper-noun: Working Group |
| working-groups | form.update | proper-noun: Working Group |
| working-groups | table.nextMeeting | table-column-header |
| working-groups | table.leadOrg | table-column-header |
| working-groups | table.updated | table-column-header |

The remaining top-15 namespaces (`empty-states`, `dashboard-widgets`, `contacts`, `advanced-search`, and
`positions`) have no HEAD candidate that qualifies for these carve-out classes. Their zero-row result is
intentional; it does not mean those namespaces were omitted from the census.
