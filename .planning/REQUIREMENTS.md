# Requirements: Intl-Dossier v5.0

**Defined:** 2026-04-14
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

## v5.0 Requirements

Requirements for the Dossier Creation UX milestone. Each maps to roadmap phases.

### Shared Infrastructure

- [ ] **INFRA-01**: Shared `useCreateDossierWizard<T>` hook extracted from existing wizard (draft persistence, submission, AI assist, duplicate detection)
- [ ] **INFRA-02**: `CreateWizardShell` component wrapping FormWizard with progress indicator, step navigation, and bilingual support
- [ ] **INFRA-03**: Per-type Zod schemas extending a shared base schema (name_en, name_ar, abbreviation, description, status, sensitivity)
- [ ] **INFRA-04**: `getDefaultsForType(type)` factory returning smart defaults per dossier type
- [ ] **INFRA-05**: Draft persistence parameterized per type (`dossier-create-{type}` localStorage keys)
- [ ] **INFRA-06**: Classification fields (status, sensitivity) merged into BasicInfoStep as collapsible section
- [ ] **INFRA-07**: Draft migration from old `dossier-create-draft` localStorage key format to per-type keys with versioned safeParse

### Country Wizard

- [ ] **CTRY-01**: User can create a country dossier via dedicated 3-step wizard (Basic Info → Country Details → Review)
- [ ] **CTRY-02**: Country Details step captures ISO codes (2-letter, 3-letter), region, capital (bilingual)
- [ ] **CTRY-03**: Country wizard accessible directly from Countries list page

### Organization Wizard

- [ ] **ORG-01**: User can create an organization dossier via dedicated 3-step wizard (Basic Info → Org Details → Review)
- [ ] **ORG-02**: Org Details step captures organization type (government/NGO/private/international/academic), org code, website
- [ ] **ORG-03**: Organization wizard accessible directly from Organizations list page

### Topic Wizard

- [ ] **TOPC-01**: User can create a topic dossier via dedicated 2-step wizard (Basic Info → Review)
- [ ] **TOPC-02**: Basic Info step includes theme category selector (policy/technical/strategic/operational) inline
- [ ] **TOPC-03**: Topic wizard accessible directly from Topics list page

### Person Wizard

- [ ] **PRSN-01**: User can create a person dossier via dedicated 3-step wizard (Basic Info → Person Details → Review)
- [ ] **PRSN-02**: Person Details step captures title (bilingual), photo URL, biography (bilingual)
- [ ] **PRSN-03**: Person wizard accessible directly from Persons list page

### Elected Official Wizard

- [ ] **ELOF-01**: User can create an elected official via Person wizard variant with extra step (Basic Info → Person Details → Office/Term → Review)
- [ ] **ELOF-02**: Office/Term step captures office title, term start/end dates, constituency, political party
- [ ] **ELOF-03**: Elected official creation uses `person_subtype: 'elected_official'` on the person dossier type
- [ ] **ELOF-04**: Elected official wizard accessible directly from Elected Officials list page

### Forum Wizard

- [ ] **FORUM-01**: User can create a forum dossier via dedicated 3-step wizard (Basic Info → Forum Details → Review)
- [ ] **FORUM-02**: Forum Details step includes DossierPicker to link organizing body (organization)
- [ ] **FORUM-03**: Forum wizard accessible directly from Forums list page

### Working Group Wizard

- [ ] **WG-01**: User can create a working group dossier via dedicated 3-step wizard (Basic Info → WG Details → Review)
- [ ] **WG-02**: WG Details step captures status, established date, mandate (bilingual), and parent body via DossierPicker
- [ ] **WG-03**: Working group wizard accessible directly from Working Groups list page

### Engagement Wizard

- [ ] **ENGM-01**: User can create an engagement dossier via dedicated 4-step wizard (Basic Info → Engagement Details → Participants → Review)
- [ ] **ENGM-02**: Engagement Details step captures engagement type, category, location (bilingual)
- [ ] **ENGM-03**: Participants step allows multi-select of countries, organizations, and persons via DossierPicker
- [ ] **ENGM-04**: Multi-select DossierPicker variant supports filtering by dossier type
- [ ] **ENGM-05**: Engagement wizard accessible directly from Engagements list page

### UX Polish

- [ ] **UX-01**: CreateDossierHub type grid page at `/dossiers/create` as fallback entry point
- [ ] **UX-02**: Type-specific contextual guidance/hints displayed in each wizard's steps
- [ ] **UX-03**: Old monolithic DossierCreateWizard removed after all 8 type-specific wizards verified
- [ ] **UX-04**: All references to old `/dossiers/create` flow updated (Command Palette, FAB, empty states, navigation)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Creation

- **ADV-01**: Template gallery — pre-filled dossier templates for common patterns
- **ADV-02**: Batch creation — create multiple dossiers in one flow
- **ADV-03**: ISO code auto-lookup for countries (fetch from external API)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                               | Reason                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Cross-type wizard (create multiple types in one flow) | Confusing UX, no user demand                                      |
| Auto-save to server (draft sync across devices)       | localStorage sufficient; server drafts add API complexity         |
| Template gallery                                      | Premature optimization, unclear user need                         |
| Batch creation                                        | Not how diplomatic staff work — dossiers are created individually |
| New Edge Function changes for relationship linking    | Two-step API (create then link) avoids backend changes            |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| INFRA-01    | —     | Pending |
| INFRA-02    | —     | Pending |
| INFRA-03    | —     | Pending |
| INFRA-04    | —     | Pending |
| INFRA-05    | —     | Pending |
| INFRA-06    | —     | Pending |
| INFRA-07    | —     | Pending |
| CTRY-01     | —     | Pending |
| CTRY-02     | —     | Pending |
| CTRY-03     | —     | Pending |
| ORG-01      | —     | Pending |
| ORG-02      | —     | Pending |
| ORG-03      | —     | Pending |
| TOPC-01     | —     | Pending |
| TOPC-02     | —     | Pending |
| TOPC-03     | —     | Pending |
| PRSN-01     | —     | Pending |
| PRSN-02     | —     | Pending |
| PRSN-03     | —     | Pending |
| ELOF-01     | —     | Pending |
| ELOF-02     | —     | Pending |
| ELOF-03     | —     | Pending |
| ELOF-04     | —     | Pending |
| FORUM-01    | —     | Pending |
| FORUM-02    | —     | Pending |
| FORUM-03    | —     | Pending |
| WG-01       | —     | Pending |
| WG-02       | —     | Pending |
| WG-03       | —     | Pending |
| ENGM-01     | —     | Pending |
| ENGM-02     | —     | Pending |
| ENGM-03     | —     | Pending |
| ENGM-04     | —     | Pending |
| ENGM-05     | —     | Pending |
| UX-01       | —     | Pending |
| UX-02       | —     | Pending |
| UX-03       | —     | Pending |
| UX-04       | —     | Pending |

**Coverage:**

- v5.0 requirements: 38 total
- Mapped to phases: 0
- Unmapped: 38 ⚠️

---

_Requirements defined: 2026-04-14_
_Last updated: 2026-04-14 after initial definition_
