# Feature Landscape

**Domain:** Type-specific dossier creation wizards
**Researched:** 2026-04-14

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature                      | Why Expected                                 | Complexity | Notes                                       |
| ---------------------------- | -------------------------------------------- | ---------- | ------------------------------------------- |
| Per-type creation routes     | Users navigate from type list pages          | Low        | 8 route files, each ~10 LOC                 |
| Type-specific field steps    | Each type shows only its relevant fields     | Low        | Already exist as `fields/*.tsx` components  |
| Bilingual name/description   | Arabic-first app, all dossiers are bilingual | Low        | Already in BasicInfoStep                    |
| AI field assist              | Users rely on AI pre-fill for speed          | Low        | Already works, just needs type prop         |
| Draft persistence            | Users expect to resume interrupted creation  | Low        | Already works via useFormDraft              |
| Duplicate detection          | Prevents accidental duplicates               | Low        | Already works via useDossierNameSimilarity  |
| Review before submit         | Users want to verify before creation         | Low        | Exists, needs extraction per type           |
| Status/sensitivity defaults  | Most dossiers start as active/level-1        | Low        | Merge into BasicInfo as collapsible section |
| Direct entry from list pages | "Create Country" button on countries page    | Low        | Update Link hrefs                           |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature                          | Value Proposition                                                     | Complexity | Notes                                     |
| -------------------------------- | --------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| Relationship linking at creation | Engagement participants, forum organizing bodies linked during wizard | Medium     | New DossierPicker steps + post-create API |
| Elected official creation path   | Dedicated wizard with office/term/party fields                        | Medium     | Person variant with extra steps           |
| Type-specific guidance/hints     | Contextual help tailored to each dossier type                         | Low        | i18n keys per type, FieldLabelWithHelp    |
| Smart defaults per type          | Country defaults to active, engagement pre-selects meeting            | Low        | Per-type defaultValues in schema config   |
| Progressive field design         | Essential fields upfront, optional after creation                     | Low        | Schema marks required vs optional clearly |
| CreateDossierHub type grid       | Visual type selector when no type is pre-selected                     | Low        | Reuse DossierTypeSelector, link to routes |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature                 | Why Avoid                                               | What to Do Instead                                 |
| ---------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Template gallery             | Over-engineered for 8 types; templates imply cloning    | Type-specific defaults in schema config            |
| Inline editing in review     | Review step should be read-only; edit = go back to step | Click step indicator to return to specific step    |
| Batch creation               | Creating multiple dossiers at once is confusing         | One wizard per dossier; quick-add for inline needs |
| Cross-type wizard            | "I don't know what type" is a UX problem, not a feature | CreateDossierHub with clear type descriptions      |
| Auto-save on every keystroke | Performance overhead, noisy draft history               | Keep existing 2-second debounce auto-save          |

## Feature Dependencies

```
SharedInfrastructure (hook, shell, schemas)
  --> CountryWizard (validates pattern)
  --> OrgWizard, TopicWizard (parallel, same pattern)
  --> PersonWizard
    --> ElectedOfficialWizard (extends person)
  --> EngagementWizard (needs relationship step)
  --> ForumWizard (needs organizing body picker -- already exists)
  --> WorkingGroupWizard (needs parent body picker)
  --> CreateDossierHub (after all wizards done)
    --> Delete old DossierCreateWizard
```

## MVP Recommendation

Prioritize:

1. Shared infrastructure (hook + shell + base schema) -- enables everything
2. Country wizard -- simplest, validates entire pattern
3. Organization + Engagement wizards -- most used types
4. Person + Elected Official -- key diplomatic tracking

Defer: Topic and Working Group wizards can ship last (lower creation frequency)
