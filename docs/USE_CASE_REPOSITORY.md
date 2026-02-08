# Intl-Dossier Use Case Repository

> A living document of real-world use cases derived from actual correspondences to validate, redesign, and improve our architecture.

**Last Updated:** 2026-02-05
**Total Use Cases:** 41
**Correspondences Analyzed:** 7

---

## Executive Summary

### Analysis Scope

- **Correspondences Analyzed:** 7
- **Use Cases Identified:** 41
- **Architecture Gaps Found:** 26
- **Patterns Discovered:** 14

### Top 10 Priority Schema Enhancements

| Priority | Enhancement                         | Use Cases      | Effort |
| -------- | ----------------------------------- | -------------- | ------ |
| **P1**   | `forum_sessions` table              | UC-008, UC-031 | Medium |
| **P1**   | `forum_agenda_items` + assignments  | UC-037         | Medium |
| **P1**   | `side_events` table                 | UC-029, UC-031 | Medium |
| **P1**   | `organization_leadership` table     | UC-024         | Medium |
| **P1**   | `organization_contacts` table       | UC-025         | Low    |
| **P1**   | `government_decisions` table        | UC-013         | Medium |
| **P1**   | `mou_parties` junction table        | UC-014         | Medium |
| **P1**   | `correspondence_participants` table | UC-001         | Medium |
| **P1**   | MoU lifecycle fields                | UC-012         | Low    |
| **P1**   | Correspondence direction field      | UC-035         | Low    |

### Correspondence Type Distribution

| Type                    | Count | Direction | Action Required     |
| ----------------------- | ----- | --------- | ------------------- |
| Questionnaire Request   | 2     | Inbound   | Submit by deadline  |
| MoU Notification        | 1     | Inbound   | Complete procedures |
| Nomination Request      | 1     | Inbound   | Submit nomination   |
| Leadership Announcement | 1     | Inbound   | None (info only)    |
| Event Booking Request   | 1     | Outbound  | Book venue          |
| Internal Coordination   | 1     | Internal  | Collect inputs      |

### Key Architecture Recommendations

1. **Add correspondence direction**: `inbound`, `outbound`, `internal`
2. **Add action category**: `deadline_response`, `nomination`, `information_only`, `event_booking`, `internal_coordination`
3. **Create forum ecosystem**: sessions → agenda items → assignments → side events
4. **Create org contact system**: leadership + contacts + staff directory
5. **Add MoU lifecycle**: stages + government decisions + parties
6. **Support dual calendars**: Hijri + Gregorian dates

---

## Table of Contents

- [Overview](#overview)
- [Use Case Index](#use-case-index)
- [Correspondence #1: UN-DESA QCPR Survey Request](#correspondence-1-un-desa-qcpr-survey-request)
- [Schema Enhancement Proposals](#schema-enhancement-proposals)
- [Architecture Gaps Identified](#architecture-gaps-identified)
- [Validation Checklist](#validation-checklist)

---

## Overview

### Purpose

This repository collects use cases from real diplomatic correspondences to:

1. **Validate** - Confirm existing architecture handles real scenarios
2. **Identify Gaps** - Find missing features or data models
3. **Prioritize** - Rank enhancements by frequency of occurrence
4. **Test** - Generate realistic test data and scenarios

### Use Case Categories

| Category                | Code   | Description                                        |
| ----------------------- | ------ | -------------------------------------------------- |
| Entity Management       | `ENT`  | Creating/linking organizations, persons, countries |
| Workflow & Routing      | `WFL`  | Correspondence routing, approvals, assignments     |
| Commitments & Deadlines | `CMT`  | Action items, external deadlines, follow-ups       |
| Document Management     | `DOC`  | Attachments, references, threading                 |
| Bilingual Content       | `I18N` | Arabic/English handling, terminology               |
| Reporting & Analytics   | `RPT`  | Surveys, questionnaires, aggregations              |
| Relationships           | `REL`  | Entity-to-entity connections, roles                |

---

## Use Case Index

| ID     | Category | Title                                  | Source      | Priority | Status          |
| ------ | -------- | -------------------------------------- | ----------- | -------- | --------------- |
| UC-001 | REL      | Multi-Entity Correspondence Chain      | Corr #1     | High     | Gap Identified  |
| UC-002 | CMT      | External Deadline Tracking             | Corr #1, #2 | High     | Gap Identified  |
| UC-003 | DOC      | Reference Chain / Threading            | Corr #1     | Medium   | Partial Support |
| UC-004 | I18N     | Formal Arabic Terminology              | Corr #1, #2 | Medium   | Gap Identified  |
| UC-005 | RPT      | Survey Response Tracking               | Corr #1, #2 | Medium   | Not Supported   |
| UC-006 | ENT      | Focal Point Nomination                 | Corr #1     | Medium   | Partial Support |
| UC-007 | REL      | Parent-Child Organization Hierarchy    | Corr #2     | High     | Partial Support |
| UC-008 | ENT      | Forum Session Reference                | Corr #2     | Medium   | Gap Identified  |
| UC-009 | CMT      | Initiative/Project from Forum Decision | Corr #2     | Medium   | Gap Identified  |
| UC-010 | WFL      | Email-Based Submission Tracking        | Corr #2     | Low      | Not Supported   |
| UC-011 | DOC      | Attachment Reference with Contact Info | Corr #2     | Medium   | Partial Support |
| UC-012 | DOC      | MoU Lifecycle Tracking                 | Corr #3     | High     | Partial Support |
| UC-013 | WFL      | Government Approval Chain              | Corr #3     | High     | Gap Identified  |
| UC-014 | REL      | Bilateral Agreement Parties            | Corr #3     | High     | Partial Support |
| UC-015 | DOC      | Official Document Reference Numbers    | Corr #3, #4 | Medium   | Gap Identified  |
| UC-016 | I18N     | Dual Calendar (Hijri-Gregorian)        | Corr #3     | Medium   | Gap Identified  |
| UC-017 | CMT      | Post-Ratification Actions              | Corr #3     | Medium   | Gap Identified  |
| UC-018 | ENT      | Award/Competition Program Tracking     | Corr #4     | Medium   | Gap Identified  |
| UC-019 | WFL      | Committee Membership Nomination        | Corr #4     | Medium   | Gap Identified  |
| UC-020 | DOC      | External URL/Link Management           | Corr #4     | Low      | Gap Identified  |
| UC-021 | ENT      | Recurring Events / Commemorative Days  | Corr #4     | Low      | Gap Identified  |
| UC-022 | RPT      | Target Group / Eligibility Criteria    | Corr #4     | Low      | Gap Identified  |
| UC-023 | DOC      | Organization Reference Number Format   | Corr #4     | Low      | Gap Identified  |
| UC-024 | ENT      | Leadership Change Tracking             | Corr #5     | High     | Gap Identified  |
| UC-025 | ENT      | Organization Contact Directory         | Corr #5     | High     | Gap Identified  |
| UC-026 | ENT      | Person Career History                  | Corr #5     | Medium   | Partial Support |
| UC-027 | DOC      | Circular / Broadcast Correspondence    | Corr #5     | Low      | Gap Identified  |
| UC-028 | WFL      | Correspondence Without Action Required | Corr #5     | Low      | Gap Identified  |
| UC-029 | ENT      | Side Event Management                  | Corr #6     | High     | Gap Identified  |
| UC-030 | ENT      | Event Logistics Requirements           | Corr #6     | Medium   | Gap Identified  |
| UC-031 | REL      | Forum Session Side Events              | Corr #6, #8 | Medium   | Gap Identified  |
| UC-032 | ENT      | Event Attendance Specifications        | Corr #6     | Low      | Gap Identified  |
| UC-033 | WFL      | Multi-Track Venue Booking              | Corr #6     | Low      | Gap Identified  |
| UC-034 | ENT      | Staff Contact Directory                | Corr #6     | Medium   | Gap Identified  |
| UC-035 | DOC      | Internal Coordination Correspondence   | Corr #7     | High     | Gap Identified  |
| UC-036 | WFL      | Delegation Preparation Workflow        | Corr #7     | High     | Gap Identified  |
| UC-037 | CMT      | Agenda Item Assignment Tracking        | Corr #7     | High     | Gap Identified  |
| UC-038 | RPT      | Department Response Status Dashboard   | Corr #7     | Medium   | Gap Identified  |
| UC-039 | CMT      | Deadline Extension Tracking            | Corr #7     | Medium   | Gap Identified  |
| UC-040 | REL      | Meeting Reference Linking              | Corr #7     | Low      | Gap Identified  |
| UC-041 | DOC      | Email Thread/Chain Context             | Corr #7     | Low      | Gap Identified  |

---

## Correspondence #1: UN-DESA QCPR Survey Request

### Metadata

| Field                 | Value                                     |
| --------------------- | ----------------------------------------- |
| **Correspondence ID** | CORR-2026-001                             |
| **Date Analyzed**     | 2026-02-05                                |
| **Document Type**     | برقية صادرة (Outgoing Telegram)           |
| **Priority Marking**  | عاجلة جداً (Very Urgent)                  |
| **Language**          | Arabic                                    |
| **Source**            | Ministry of Foreign Affairs               |
| **Destination**       | GASTAT (General Authority for Statistics) |

### Document Summary

A telegram forwarding a UN-DESA request for Saudi Arabia to:

1. Nominate a focal point for the Government Survey
2. Complete an electronic questionnaire for the QCPR (Quadrennial Comprehensive Policy Review)
3. Deadline: February 9, 2026

### Original Text (Arabic)

<details>
<summary>Click to expand full Arabic text</summary>

عاجلة جداً

سعادة رئيس الهيئة العامة للإحصاء سلمه الله

السلام عليكم ورحمة الله وبركاته

إلحاقاً لبرقيتي رقم (١٦٠٠٠٦) وتاريخ ٠٦/٠٦/١٤٤٧هـ المشفوعة بالمذكرة الواردة من إدارة الشؤون الاقتصادية والاجتماعية بالأمم المتحدة (UN-DESA) بشأن طلب تسمية نقطة الاتصال الخاصة بالمسح الحكومي ضمن المراجعة الشاملة لسياسات المنظومة الإنمائية بالأمم المتحدة.

أفيد سعادتكم بتلقي الوزارة برقية وفد المملكة الدائم لدى الأمم المتحدة في نيويورك المشفوعة بالمذكرة الواردة من إدارة الشؤون الاقتصادية والاجتماعية بالأمم المتحدة المتضمنة دعوة الدول الأعضاء لتقديم ملاحظاتها بشأن الدعم الذي تقدمه منظومة الأمم المتحدة الإنمائية على المستوى القطري من خلال تعبئة استبيان إلكتروني أجرته الإدارة بالنيابة عن الأمين العام للأمم المتحدة بهدف تقييم أداء منظومة التنمية الأممية، وإفادة الجمعية العامة والمجلس الاقتصادي والاجتماعي بأنشطة التنمية، والإسهام في إعداد تقرير الأمين العام حول تنفيذ الاستعراض الشامل الرباعي للسياسات (QCPR)، حيث أشارت المذكرة إلى أن الاستبيان يحتوي على قسمين، أحدهما مخصص لحكومات الدول المستفيدة من برامج الأمم المتحدة، والآخر يتعلق بالدول التي تقدم مساهمات مالية طوعية لمنظومة التنمية، وأن آخر موعد لاستكمال الاستبيان سيكون بتاريخ ٩ فبراير ٢٠٢٦م، وذلك وفق المرفق.

آمل اطلاع سعادتكم واتخاذ ما ترونه مناسباً. ولسعادتكم تحياتي.

</details>

### Entities Extracted

| Entity Name                   | Entity Type  | Role in Correspondence |
| ----------------------------- | ------------ | ---------------------- |
| UN-DESA                       | Organization | Originator             |
| Saudi Permanent Mission to UN | Organization | Relay                  |
| Ministry of Foreign Affairs   | Organization | Router                 |
| GASTAT                        | Organization | Action Owner           |
| UN Secretary-General          | Person/Role  | Authority              |
| General Assembly              | Organization | Stakeholder            |
| ECOSOC                        | Organization | Stakeholder            |

### Use Cases Derived

---

#### UC-001: Multi-Entity Correspondence Chain

**Category:** REL (Relationships)
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
A single correspondence involves multiple organizations with different roles in a transmission chain.

**Chain of Custody:**

```
UN-DESA (Originator)
    ↓ sends memo to
Saudi Permanent Mission to UN (Relay)
    ↓ forwards telegram to
Ministry of Foreign Affairs (Router)
    ↓ routes to
GASTAT (Action Owner)
```

**Required Capabilities:**

- [ ] Track correspondence chain with roles
- [ ] Distinguish originator vs relay vs action owner
- [ ] Model "on behalf of" relationships

**Validation Questions:**

1. Can `dossier_relationships` support relationship roles like `originator`, `relay`, `router`, `action_owner`?
2. How do we query "all correspondences where Org X was in the chain"?
3. Should we add a `correspondence_participants` junction table?

**Proposed Schema:**

```sql
CREATE TABLE correspondence_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correspondence_id UUID REFERENCES intake_tickets(id),
  entity_type TEXT NOT NULL, -- 'organization', 'person'
  entity_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'originator', 'relay', 'router', 'recipient',
    'action_owner', 'cc', 'stakeholder'
  )),
  sequence_order INT, -- position in chain
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### UC-002: External Deadline Tracking

**Category:** CMT (Commitments)
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
An external organization (UN-DESA) sets a hard deadline (Feb 9, 2026) that must be tracked separately from internal SLAs.

**Deadline Details:**
| Aspect | Internal SLA | External Deadline |
|--------|--------------|-------------------|
| Source | System rules | Correspondence |
| Flexibility | Configurable | Fixed |
| Consequence | Internal metrics | External reputation |
| Owner | Assignee | Organization |

**Required Capabilities:**

- [ ] Distinguish internal vs external deadlines
- [ ] Track deadline source (which correspondence)
- [ ] Alert differently for external deadlines

**Validation Questions:**

1. Should `deadline` be split into `internal_deadline` and `external_deadline`?
2. How do we link deadline to source correspondence?
3. Do external deadlines need different escalation rules?

**Proposed Schema:**

```sql
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS
  external_deadline TIMESTAMPTZ,
  external_deadline_source_id UUID REFERENCES intake_tickets(id),
  deadline_type TEXT DEFAULT 'internal'
    CHECK (deadline_type IN ('internal', 'external', 'both'));
```

---

#### UC-003: Reference Chain / Threading

**Category:** DOC (Document Management)
**Priority:** Medium
**Current Support:** Partial (parent_ticket_id exists)

**Scenario:**
This telegram references a previous telegram (#160006) which itself referenced a UN memo.

**Reference Chain:**

```
UN-DESA Memo (external document)
    ↓ attached to
Telegram #160006 (06/06/1447H) - previous correspondence
    ↓ referenced by
Current Telegram (this document)
```

**Required Capabilities:**

- [x] Link to parent ticket (parent_ticket_id)
- [ ] Reference external document numbers
- [ ] Track Hijri dates alongside Gregorian
- [ ] Store external reference metadata

**Validation Questions:**

1. Should `external_references` be a JSONB array or separate table?
2. How do we search "all tickets referencing telegram #160006"?
3. Do we need a document registry for external references?

**Proposed Schema:**

```sql
-- Option A: JSONB field (simpler)
ALTER TABLE intake_tickets ADD COLUMN IF NOT EXISTS
  external_references JSONB DEFAULT '[]';
-- Example: [
--   {"type": "telegram", "number": "160006", "date_hijri": "1447-06-06", "date_gregorian": "2025-12-03"},
--   {"type": "memo", "source": "UN-DESA", "reference": "DESA/2025/123"}
-- ]

-- Option B: Separate table (more queryable)
CREATE TABLE external_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES intake_tickets(id),
  reference_type TEXT NOT NULL, -- 'telegram', 'memo', 'letter', 'note_verbale'
  reference_number TEXT,
  reference_date_hijri TEXT,
  reference_date_gregorian DATE,
  source_organization TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ext_ref_number ON external_references(reference_number);
```

---

#### UC-004: Formal Arabic Terminology

**Category:** I18N (Bilingual)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Official correspondences use standardized diplomatic terminology that should be consistently translated.

**Terminology Extracted:**

| Arabic Term                         | English Translation                              | Domain        |
| ----------------------------------- | ------------------------------------------------ | ------------- |
| برقية صادرة                         | Outgoing Telegram                                | Document Type |
| برقية واردة                         | Incoming Telegram                                | Document Type |
| مذكرة                               | Memo/Note                                        | Document Type |
| مذكرة شفوية                         | Note Verbale                                     | Document Type |
| عاجلة جداً                          | Very Urgent                                      | Priority      |
| عاجلة                               | Urgent                                           | Priority      |
| عادية                               | Normal/Routine                                   | Priority      |
| نقطة الاتصال                        | Focal Point                                      | Role          |
| الاستعراض الشامل الرباعي للسياسات   | Quadrennial Comprehensive Policy Review (QCPR)   | UN Mechanism  |
| المنظومة الإنمائية                  | Development System                               | UN Context    |
| إدارة الشؤون الاقتصادية والاجتماعية | Department of Economic and Social Affairs (DESA) | UN Body       |

**Required Capabilities:**

- [ ] Terminology/glossary table
- [ ] AI extraction with term matching
- [ ] Consistent term usage in UI

**Validation Questions:**

1. Should we create a `terminology` table for standard terms?
2. Can AI extraction identify and tag known terms?
3. How do we ensure UI uses consistent translations?

**Proposed Schema:**

```sql
CREATE TABLE terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_ar TEXT NOT NULL,
  term_en TEXT NOT NULL,
  domain TEXT, -- 'document_type', 'priority', 'role', 'un_mechanism'
  abbreviation TEXT, -- 'QCPR', 'DESA'
  definition_ar TEXT,
  definition_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(term_ar, domain)
);

-- Seed with common terms
INSERT INTO terminology (term_ar, term_en, domain, abbreviation) VALUES
('برقية صادرة', 'Outgoing Telegram', 'document_type', NULL),
('برقية واردة', 'Incoming Telegram', 'document_type', NULL),
('مذكرة شفوية', 'Note Verbale', 'document_type', NULL),
('عاجلة جداً', 'Very Urgent', 'priority', NULL),
('نقطة الاتصال', 'Focal Point', 'role', NULL),
('الاستعراض الشامل الرباعي للسياسات', 'Quadrennial Comprehensive Policy Review', 'un_mechanism', 'QCPR');
```

---

#### UC-005: Survey Response Tracking

**Category:** RPT (Reporting)
**Priority:** Low
**Current Support:** Not Supported

**Scenario:**
The UN requests completion of a questionnaire with multiple parts, each targeting different audiences.

**Survey Structure:**
| Part | Target | Status |
|------|--------|--------|
| Part 1 | Programme countries | Pending |
| Part 2 | Donor countries | Pending |

**Required Capabilities:**

- [ ] Track survey/questionnaire as work item type
- [ ] Support multi-part responses
- [ ] Link response to source request

**Validation Questions:**

1. Is survey tracking in scope for this system?
2. Should we integrate with external survey tools?
3. Or just track "survey completed" as a commitment status?

**Recommendation:**
For MVP, track survey completion as a simple commitment. If surveys become frequent, consider dedicated support.

---

#### UC-006: Focal Point Nomination

**Category:** ENT (Entity Management)
**Priority:** Medium
**Current Support:** Partial (positions exist)

**Scenario:**
UN-DESA requests nomination of a "Focal Point" for the Government Survey. This is a role assignment.

**Nomination Flow:**

```
Request received → Position created → Person nominated → Confirmation sent
```

**Required Capabilities:**

- [x] Create position from intake (conversion exists)
- [ ] Track nomination status (pending, nominated, confirmed)
- [ ] Link position to requesting organization
- [ ] Support external role definitions

**Validation Questions:**

1. Should positions have a `nomination_status` field?
2. How do we link position to external requester?
3. Is "Focal Point" a position type we should standardize?

**Proposed Enhancement:**

```sql
ALTER TABLE positions ADD COLUMN IF NOT EXISTS
  nomination_status TEXT DEFAULT 'open'
    CHECK (nomination_status IN ('open', 'nominated', 'confirmed', 'declined')),
  requested_by_org_id UUID REFERENCES organizations(id),
  nomination_deadline TIMESTAMPTZ;
```

---

---

## Correspondence #2: SESRIC OIC Statistical Initiative

### Metadata

| Field                 | Value                                     |
| --------------------- | ----------------------------------------- |
| **Correspondence ID** | CORR-2026-002                             |
| **Date Analyzed**     | 2026-02-05                                |
| **Document Type**     | برقية صادرة (Outgoing Telegram)           |
| **Priority Marking**  | Normal (not marked urgent)                |
| **Language**          | Arabic                                    |
| **Source**            | Ministry of Foreign Affairs               |
| **Destination**       | GASTAT (General Authority for Statistics) |

### Document Summary

A telegram forwarding a SESRIC memo requesting completion of a questionnaire to document success factors of national statistical systems (NSS) across OIC member states over the past decade. This initiative was agreed upon at the 14th OIC Statistical Committee session (October 1-3, 2025).

### Original Text (Arabic)

<details>
<summary>Click to expand full Arabic text</summary>

سعادة رئيس الهيئة العامة للإحصاء سلمه الله

السلام عليكم ورحمة الله وبركاته

أفيد سعادتكم بتلقي الوزارة مذكرة مركز الأبحاث الإحصائية والاقتصادية والاجتماعية والتدريب للدول الإسلامية في أنقرة (SESRIC) التابع لمنظمة التعاون الإسلامي (المرفقة)، المشار فيها إلى الدورة الـ(١٤) للجنة الإحصائية لمنظمة التعاون الإسلامي التي عقدت خلال الفترة ١-٣ أكتوبر ٢٠٢٥م، حيث اتفق أعضاء اللجنة على وضع مبادرة شاملة لتوثيق وعرض مفاتيح النجاح الرئيسية للنظم الإحصائية الوطنية للدول الأعضاء في منظمة التعاون الإسلامي على مدى العقد الماضي. كما أفاد المركز بأنه قام بتطوير استبيان منظم وتم ارساله لمكاتب الإحصاء بالدول الأعضاء بالمنظمة، ويدعو المركز إلى المسارعة في تقديم هذا الاستبيان بحلول ٢٧ فبراير ٢٠٢٦م وارساله للبريد الالكتروني المدون بالمذكرة، ويمكن الحصول على أي معلومات أخرى بهذا الشأن بالتواصل عبر عناوين البريد الالكتروني المدونة في المذكرة.

آمل التفضل بالاطلاع واتخاذ ما ترونه مناسباً. مع أطيب تحياتي.

</details>

### Entities Extracted

| Entity Name                               | Entity Type  | Role in Correspondence |
| ----------------------------------------- | ------------ | ---------------------- |
| SESRIC                                    | Organization | Originator             |
| OIC (Organization of Islamic Cooperation) | Organization | Parent Organization    |
| OIC Statistical Committee                 | Forum        | Decision Body          |
| Ministry of Foreign Affairs               | Organization | Router                 |
| GASTAT                                    | Organization | Action Owner           |

### Relationships Identified

```
OIC (Organization of Islamic Cooperation)
    ├── SESRIC (subsidiary - Ankara)
    └── OIC Statistical Committee (forum)
            └── 14th Session (Oct 1-3, 2025)
                    └── NSS Success Factors Initiative
```

### Use Cases Derived

---

#### UC-007: Parent-Child Organization Hierarchy

**Category:** REL (Relationships)
**Priority:** High
**Current Support:** Partial

**Scenario:**
SESRIC is a subsidiary research center of OIC headquartered in Ankara. Understanding this hierarchy affects how we interpret correspondence authority.

**Required Capabilities:**

- [ ] Model parent-child organization relationships
- [ ] Query all entities under an umbrella organization
- [ ] Inherit context from parent organization

**Validation Questions:**

1. Does `relationship_type` include 'subsidiary', 'affiliate', 'branch'?
2. Can we traverse org hierarchies for reporting?
3. Should correspondence from subsidiary show parent org context?

**Proposed Schema:**

```sql
-- Add relationship types for org hierarchies
-- Ensure relationship_type enum includes:
-- 'subsidiary', 'affiliate', 'branch', 'department', 'committee'

-- Query example: All OIC subsidiaries
SELECT child.* FROM dossiers child
JOIN dossier_relationships dr ON dr.target_id = child.id
JOIN dossiers parent ON dr.source_id = parent.id
WHERE parent.name_en = 'Organization of Islamic Cooperation'
AND dr.relationship_type IN ('subsidiary', 'affiliate');
```

---

#### UC-008: Forum Session Reference

**Category:** ENT (Entity Management)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
The correspondence references a specific numbered session (14th) of a committee with specific dates. Decisions made at this session drive current commitments.

**Session Details:**
| Field | Value |
|-------|-------|
| Forum | OIC Statistical Committee |
| Session Number | 14 |
| Dates | October 1-3, 2025 |
| Outcome | Initiative approved |

**Required Capabilities:**

- [ ] Track numbered sessions for forums/committees
- [ ] Record session dates and location
- [ ] Link session outcomes to commitments
- [ ] Reference sessions in correspondence

**Proposed Schema:**

```sql
CREATE TABLE forum_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES dossiers(id),
  session_number INT NOT NULL,
  session_name TEXT,
  session_name_ar TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  location_en TEXT,
  location_ar TEXT,
  host_country_id UUID REFERENCES dossiers(id),
  outcomes JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(forum_id, session_number)
);

-- Example outcome structure:
-- {
--   "type": "initiative",
--   "title_en": "NSS Success Factors Documentation",
--   "title_ar": "توثيق مفاتيح نجاح النظم الإحصائية الوطنية",
--   "agreed_date": "2025-10-03",
--   "lead_entity": "SESRIC"
-- }
```

---

#### UC-009: Initiative/Project from Forum Decision

**Category:** CMT (Commitments)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Forum sessions produce initiatives/projects that span multiple countries and phases. The NSS documentation initiative involves questionnaire → collection → analysis → publication.

**Initiative Phases:**
| Phase | Status | Deadline |
|-------|--------|----------|
| Questionnaire design | Complete | - |
| Distribution | Complete | - |
| Collection | In Progress | Feb 27, 2026 |
| Analysis | Pending | TBD |
| Publication | Pending | TBD |

**Required Capabilities:**

- [ ] Track multi-phase initiatives
- [ ] Link initiative to source session/decision
- [ ] Track per-country participation
- [ ] Monitor phase completion

**Validation Questions:**

1. Should initiatives be a dossier type or separate table?
2. How do we track which countries have responded?
3. Can initiatives have sub-tasks for each phase?

---

#### UC-010: Email-Based Submission Tracking

**Category:** WFL (Workflow)
**Priority:** Low
**Current Support:** Not Supported

**Scenario:**
Unlike web portals, this questionnaire must be submitted via email. We need to track whether submission occurred.

**Workflow:**

```
Request received → Questionnaire completed → Email sent → Confirmation received?
```

**Required Capabilities:**

- [ ] Store submission method (email/portal/physical)
- [ ] Track submission status without confirmation
- [ ] Store contact emails from correspondence

**Proposed Enhancement:**

```sql
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS
  submission_method TEXT CHECK (submission_method IN (
    'online_portal', 'email', 'physical', 'api'
  )),
  submission_contact TEXT, -- email or URL
  submitted_at TIMESTAMPTZ,
  submission_confirmed BOOLEAN DEFAULT false;
```

---

#### UC-011: Attachment Reference with Contact Info

**Category:** DOC (Document Management)
**Priority:** Medium
**Current Support:** Partial

**Scenario:**
The telegram references an attached memo (المرفقة) containing questionnaire details and contact emails for both submission and inquiries.

**Attachment Data to Extract:**

- Questionnaire document
- Submission email address
- Inquiry email address
- Additional instructions

**Required Capabilities:**

- [ ] Mark attachments as containing contact info
- [ ] Extract and store contact details from attachments
- [ ] Link extracted data to source document

**Proposed Enhancement:**

```sql
-- Add to attachments or create contact_extractions table
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS
  extracted_contacts JSONB DEFAULT '[]';
-- Example: [
--   {"type": "submission", "email": "survey@sesric.org"},
--   {"type": "inquiry", "email": "info@sesric.org"}
-- ]
```

---

### Terminology Extracted

| Arabic Term                                             | English Translation                                           | Domain        |
| ------------------------------------------------------- | ------------------------------------------------------------- | ------------- |
| مركز الأبحاث الإحصائية والاقتصادية والاجتماعية والتدريب | Statistical, Economic and Social Research and Training Centre | Organization  |
| منظمة التعاون الإسلامي                                  | Organization of Islamic Cooperation (OIC)                     | Organization  |
| اللجنة الإحصائية                                        | Statistical Committee                                         | Body Type     |
| الدورة                                                  | Session                                                       | Meeting       |
| مبادرة شاملة                                            | Comprehensive Initiative                                      | Project Type  |
| النظم الإحصائية الوطنية                                 | National Statistical Systems (NSS)                            | Domain        |
| مفاتيح النجاح                                           | Success Factors/Keys                                          | Concept       |
| استبيان منظم                                            | Structured Questionnaire                                      | Document Type |

---

### Pattern: Questionnaire Request

**Common Elements (Corr #1 & #2):**

| Element           | Corr #1 (UN-DESA)    | Corr #2 (SESRIC)     |
| ----------------- | -------------------- | -------------------- |
| Originator Type   | UN Agency            | OIC Affiliate        |
| Request Type      | Survey/Questionnaire | Survey/Questionnaire |
| Deadline          | Feb 9, 2026          | Feb 27, 2026         |
| Submission Method | Online               | Email                |
| Action Owner      | GASTAT               | GASTAT               |
| Routing           | MoFA → GASTAT        | MoFA → GASTAT        |

**Recommendation:** Create `questionnaire_request` as a sub-type or tag for intake tickets with specific fields:

- `submission_deadline`
- `submission_method`
- `submission_contact`
- `questionnaire_parts` (JSONB)
- `response_status`

---

## Correspondence #3: MoU Ratification Notice

### Metadata

| Field                 | Value                                      |
| --------------------- | ------------------------------------------ |
| **Correspondence ID** | CORR-2026-003                              |
| **Date Analyzed**     | 2026-02-05                                 |
| **Document Type**     | خطاب رسمي (Formal Letter)                  |
| **Priority Marking**  | Normal                                     |
| **Language**          | Arabic                                     |
| **Subject**           | MoU approval and ratification notification |

### Document Summary

A formal letter transmitting two key documents related to a Saudi-Omani statistical cooperation MoU:

1. Cabinet Resolution No. 506 (24/7/1447H) approving the MoU
2. Royal Decree No. M/153 (30/7/1447H) ratifying the MoU

The MoU between GASTAT and NCSI was signed in Muscat on September 3, 2025.

### Original Text (Arabic)

<details>
<summary>Click to expand full Arabic text</summary>

السلام عليكم ورحمة الله وبركاته:

أبعث لمعاليكم ما يلي:

أولاً: صورة قرار مجلس الوزراء رقم (٥٠٦) في ١٤٤٧/٧/٢٤هـ القاضي بالموافقة على مشروع مذكرة تفاهم بين الهيئة العامة للإحصاء في المملكة العربية السعودية والمركز الوطني للإحصاء والمعلومات في سلطنة عُمان للتعاون في مجال الإحصاء، الموقعة في مدينة مسقط في ١٤٤٧/٣/١١هـ الموافق ٢٠٢٥/٩/٣م، بالصيغة المرافقة للقرار.

ثانياً: صورة المرسوم الملكي رقم (م/١٥٣) في ١٤٤٧/٧/٣٠هـ الصادر بالمصادقة على ذلك.

وآمل إكمال اللازم، وتقبلوا تحياتي وتقديري.

</details>

### Entities Extracted

| Entity Name                                           | Entity Type     | Role in Correspondence |
| ----------------------------------------------------- | --------------- | ---------------------- |
| GASTAT                                                | Organization    | MoU Party (Saudi)      |
| NCSI (National Centre for Statistics and Information) | Organization    | MoU Party (Oman)       |
| Kingdom of Saudi Arabia                               | Country         | Party Country          |
| Sultanate of Oman                                     | Country         | Party Country          |
| Council of Ministers                                  | Government Body | Approving Authority    |
| Royal Court                                           | Government Body | Ratifying Authority    |

### Timeline Extracted

```
11/3/1447H (Sep 3, 2025)     → MoU Signed in Muscat
24/7/1447H                    → Cabinet Resolution #506 (Approval)
30/7/1447H                    → Royal Decree M/153 (Ratification)
[Current]                     → Notification sent to GASTAT
[Next]                        → "Complete necessary procedures"
```

### Use Cases Derived

---

#### UC-012: MoU Lifecycle Tracking

**Category:** DOC (Document Management)
**Priority:** High
**Current Support:** Partial (mous table exists)

**Scenario:**
An MoU progresses through multiple stages from drafting to implementation, each with different authorities and documents.

**MoU Lifecycle Stages:**
| Stage | Status | Authority | Document |
|-------|--------|-----------|----------|
| Draft | Complete | Parties | Draft MoU |
| Negotiation | Complete | Parties | Revised drafts |
| Signing | Complete | Party heads | Signed MoU |
| Cabinet Approval | Complete | Council of Ministers | Resolution #506 |
| Royal Ratification | Complete | King | Royal Decree M/153 |
| Entry into Force | Pending | - | - |
| Implementation | Pending | Parties | Work plans |

**Required Capabilities:**

- [ ] Track MoU lifecycle stage
- [ ] Link approval documents to MoU
- [ ] Store signing location and date
- [ ] Track entry into force conditions

**Proposed Schema:**

```sql
ALTER TABLE mous ADD COLUMN IF NOT EXISTS
  lifecycle_stage TEXT DEFAULT 'draft' CHECK (lifecycle_stage IN (
    'draft', 'negotiation', 'signed', 'pending_approval',
    'cabinet_approved', 'ratified', 'in_force',
    'suspended', 'terminated', 'expired'
  )),
  signed_date DATE,
  signed_date_hijri TEXT,
  signed_location_en TEXT,
  signed_location_ar TEXT,
  cabinet_resolution_number TEXT,
  cabinet_resolution_date DATE,
  cabinet_resolution_date_hijri TEXT,
  royal_decree_number TEXT,
  royal_decree_date DATE,
  royal_decree_date_hijri TEXT,
  entry_into_force_date DATE,
  expiry_date DATE,
  renewal_terms TEXT;
```

---

#### UC-013: Government Approval Chain

**Category:** WFL (Workflow)
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
International agreements require formal government approval through a defined chain: Cabinet Resolution → Royal Decree.

**Approval Chain:**

```
MoU Signed
    ↓
Cabinet Review (مجلس الوزراء)
    ↓
Cabinet Resolution (قرار) #506
    ↓
Royal Court Review
    ↓
Royal Decree (مرسوم ملكي) M/153
    ↓
Entry into Force
```

**Required Capabilities:**

- [ ] Track government decisions with reference numbers
- [ ] Link decisions to source documents
- [ ] Model multi-stage approval workflows
- [ ] Store both Hijri and Gregorian dates

**Proposed Schema:**

```sql
CREATE TABLE government_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'cabinet_resolution', 'royal_decree', 'royal_order',
    'ministerial_decision', 'council_decision'
  )),
  reference_number TEXT NOT NULL,
  date_gregorian DATE,
  date_hijri TEXT,
  subject_en TEXT,
  subject_ar TEXT NOT NULL,
  -- What does this decision relate to?
  related_entity_type TEXT CHECK (related_entity_type IN (
    'mou', 'position', 'engagement', 'organization', 'other'
  )),
  related_entity_id UUID,
  -- Approval chain
  approves_decision_id UUID REFERENCES government_decisions(id),
  -- Storage
  document_attachment_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(decision_type, reference_number)
);

CREATE INDEX idx_gov_decisions_related ON government_decisions(related_entity_type, related_entity_id);
```

---

#### UC-014: Bilateral Agreement Parties

**Category:** REL (Relationships)
**Priority:** High
**Current Support:** Partial

**Scenario:**
A bilateral MoU involves two parties (organizations) and their respective countries. Both levels must be queryable.

**Relationship Structure:**

```
MoU: Statistical Cooperation
├── Party 1: GASTAT (Organization)
│   └── Country: Saudi Arabia
├── Party 2: NCSI (Organization)
│   └── Country: Sultanate of Oman
├── Subject: Statistics cooperation
└── Signing Location: Muscat, Oman
```

**Required Capabilities:**

- [ ] Link MoU to multiple parties (organizations)
- [ ] Link parties to their countries
- [ ] Query "all MoUs with Country X"
- [ ] Query "all MoUs signed by Organization Y"

**Proposed Schema:**

```sql
CREATE TABLE mou_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mou_id UUID NOT NULL REFERENCES mous(id) ON DELETE CASCADE,
  party_type TEXT NOT NULL CHECK (party_type IN (
    'organization', 'country', 'ministry', 'agency'
  )),
  party_dossier_id UUID REFERENCES dossiers(id),
  party_role TEXT DEFAULT 'party' CHECK (party_role IN (
    'party', 'witness', 'guarantor', 'facilitator'
  )),
  -- Signatory details
  signatory_name TEXT,
  signatory_name_ar TEXT,
  signatory_title TEXT,
  signatory_title_ar TEXT,
  -- Order for display
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mou_id, party_dossier_id)
);

-- Query: All MoUs with Oman
SELECT m.* FROM mous m
JOIN mou_parties mp ON mp.mou_id = m.id
JOIN dossiers d ON d.id = mp.party_dossier_id
WHERE d.name_en ILIKE '%Oman%';
```

---

#### UC-015: Official Document Reference Numbers

**Category:** DOC (Document Management)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Saudi government documents have specific reference number formats that must be stored, validated, and searched.

**Reference Number Formats:**
| Document Type | Arabic Format | Example |
|---------------|---------------|---------|
| Cabinet Resolution | رقم (X) | رقم (٥٠٦) |
| Royal Decree | م/X | م/١٥٣ |
| Royal Order | أ/X | أ/٢٣ |
| Ministerial Decision | X | ١٢٣٤ |

**Required Capabilities:**

- [ ] Store reference numbers with type prefix
- [ ] Search by partial reference number
- [ ] Validate format based on document type

---

#### UC-016: Dual Calendar (Hijri-Gregorian)

**Category:** I18N (Internationalization)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Official Saudi documents use Hijri calendar. International coordination uses Gregorian. Both must be stored and displayed.

**Date Pairs from Document:**
| Hijri | Gregorian | Event |
|-------|-----------|-------|
| 11/3/1447 | 3/9/2025 | MoU Signing |
| 24/7/1447 | (calculate) | Cabinet Resolution |
| 30/7/1447 | (calculate) | Royal Decree |

**Required Capabilities:**

- [ ] Store both Hijri and Gregorian dates
- [ ] Convert between calendars (library needed)
- [ ] Display format based on user preference
- [ ] Support Hijri date input in forms

**Implementation Notes:**

- Use ISO 8601 for Gregorian: `2025-09-03`
- Use string for Hijri: `1447-03-11` (YYYY-MM-DD format)
- Consider `hijri-js` or similar library for frontend conversion

---

#### UC-017: Post-Ratification Actions

**Category:** CMT (Commitments)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
After MoU ratification, specific implementation actions are required. The letter says "آمل إكمال اللازم" (complete the necessary).

**Typical Post-Ratification Actions:**
| Action | Responsible | Typical Timeline |
|--------|-------------|------------------|
| Notify counterparty | GASTAT | 1-2 weeks |
| Exchange instruments | Both parties | 1 month |
| Publish in gazette | Government | 2-4 weeks |
| Establish joint committee | Both parties | 3 months |
| Develop work plan | Joint committee | 6 months |

**Required Capabilities:**

- [ ] Template commitments for MoU implementation
- [ ] Auto-create commitments when MoU reaches "ratified" stage
- [ ] Link commitments to source MoU
- [ ] Track bilateral responsibilities

---

### Terminology Extracted

| Arabic Term                      | English Translation                            | Domain    |
| -------------------------------- | ---------------------------------------------- | --------- |
| مذكرة تفاهم                      | Memorandum of Understanding (MoU)              | Agreement |
| قرار مجلس الوزراء                | Cabinet Resolution                             | Decision  |
| مرسوم ملكي                       | Royal Decree                                   | Decision  |
| المصادقة                         | Ratification                                   | Process   |
| الموافقة                         | Approval                                       | Process   |
| المركز الوطني للإحصاء والمعلومات | National Centre for Statistics and Information | Org Name  |
| سلطنة عُمان                      | Sultanate of Oman                              | Country   |
| إكمال اللازم                     | Complete the necessary                         | Action    |

---

### Pattern: MoU Correspondence Type

**Distinct from Questionnaire Requests:**

- No deadline for response
- Involves internal government process
- Action is "complete necessary" (open-ended)
- Attachments are authoritative documents

**MoU-Related Correspondence Types:**

1. Negotiation/draft sharing
2. Signing notification
3. Approval notification (this correspondence)
4. Implementation coordination
5. Review/renewal discussions

---

## Correspondence #4: GCC Youth Award Jury Nomination Request

### Metadata

| Field                 | Value                              |
| --------------------- | ---------------------------------- |
| **Correspondence ID** | CORR-2026-004                      |
| **Date Analyzed**     | 2026-02-05                         |
| **Document Type**     | خطاب رسمي (Formal Letter)          |
| **Priority Marking**  | Normal                             |
| **Language**          | Arabic                             |
| **From**              | GCC-Stat (GCC Statistical Center)  |
| **To**                | President of GASTAT, Saudi Arabia  |
| **Reference**         | م.إ.م.ت.خ.م/511/2025, Dec 23, 2025 |

### Document Summary

GCC-Stat requests nominations for the jury committee of the "Youth Innovation Award in Data World" (جائزة الإبداع الشبابي في عالم البيانات). The award was launched on Gulf Statistics Day (December 24, 2025), targeting GCC youth aged 18-34 in two tracks: Data Challenge and AI-powered Statistical Solutions.

### Original Text (Arabic)

<details>
<summary>Click to expand full Arabic text</summary>

رئيس الهيئة العامة للإحصاء
المملكة العربية السعودية

السلام عليكم ورحمة الله وبركاته،،

الموضوع: طلب ترشيحات لعضوية لجنة تحكيم جائزة الإبداع الشبابي في عالم البيانات

يهديكم المركز الإحصائي لدول مجلس التعاون لدول الخليج العربية تحياته، وإلحاقاً إلى خطابنا رقم (م.إ.م.ت.خ.م/511/2025)، بتاريخ 23 ديسمبر 2025م، بشأن إطلاق جائزة الإبداع الشبابي في عالم البيانات (https://www.msy.qa/جائزة-الابداع-الشبابي)، يطيب لنا تجديد التواصل معكم، وذلك انطلاقاً من الدور المحوري الذي تضطلع به مراكز الإحصاء الوطنية في دعم منظومة البيانات والإحصاء، وبهدف طلب ترشيح لعضوية لجنة التحكيم للجائزة التي تم إطلاقها في يوم الإحصاء الخليجي بتاريخ 24 ديسمبر 2025م ضمن جهود تمكين الشباب في مجالات البيانات والذكاء الاصطناعي، وتستهدف الشباب الخليجي من الفئة العمرية (18-34) سنة من مواطني دول مجلس التعاون.

وعليه، نرفق لسعادتكم طي الخطاب "مهام لجنة التحكيم" المطلوب ترشيح أعضائها، والمتضمنة محورين أساسيين:

1. تحدي البيانات.
2. ابتكار حلول إحصائية باستخدام الذكاء الاصطناعي (AI).

نتطلع إلى دعمكم الكريم للجائزة وترشيح من ترونه مناسباً لعضوية اللجنة، ونثمّن عالياً تعاونكم الدائم ودعمكم للشباب الخليجي وبناء مستقبل قائم على البيانات والمعرفة.

وتفضلوا سعادتكم بقبول فائق الاحترام والتقدير،،

</details>

### Entities Extracted

| Entity Name                          | Entity Type     | Role in Correspondence |
| ------------------------------------ | --------------- | ---------------------- |
| GCC-Stat                             | Organization    | Originator             |
| GCC                                  | Organization    | Parent Organization    |
| GASTAT                               | Organization    | Nominee Source         |
| Youth Innovation Award in Data World | Award           | Subject                |
| Gulf Statistics Day                  | Recurring Event | Launch Date            |
| Jury Committee                       | Committee       | Nomination Target      |

### Award Structure Extracted

```
Youth Innovation Award in Data World (جائزة الإبداع الشبابي في عالم البيانات)
├── Organizer: GCC-Stat
├── Website: https://www.msy.qa/جائزة-الابداع-الشبابي
├── Launch: Gulf Statistics Day (Dec 24, 2025)
├── Target: GCC citizens, aged 18-34
├── Track 1: Data Challenge (تحدي البيانات)
├── Track 2: AI Statistical Innovation (ابتكار حلول إحصائية بالذكاء الاصطناعي)
└── Governance: Jury Committee (لجنة التحكيم)
```

### Use Cases Derived

---

#### UC-018: Award/Competition Program Tracking

**Category:** ENT (Entity Management)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
An award/competition is a distinct entity with lifecycle, tracks, eligibility, and governance.

**Required Capabilities:**

- [ ] Track award programs with multiple editions
- [ ] Define competition tracks within awards
- [ ] Store eligibility criteria (age, nationality, etc.)
- [ ] Link to organizing entity
- [ ] Store external website URL

**Proposed Schema:**

```sql
CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  organizer_id UUID REFERENCES dossiers(id),
  website_url TEXT,
  target_audience JSONB DEFAULT '{}',
  -- Example: {"citizenship": ["GCC"], "age_min": 18, "age_max": 34}
  launch_date DATE,
  status TEXT DEFAULT 'active',
  edition_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE award_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID NOT NULL REFERENCES awards(id),
  track_number INT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  UNIQUE(award_id, track_number)
);
```

---

#### UC-019: Committee Membership Nomination

**Category:** WFL (Workflow)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Request to nominate jury/committee members. Different from focal point (UC-006) - involves evaluation responsibilities.

**Nomination Flow:**

```
Request received → Candidate identified → Nomination submitted → Confirmed/Declined
```

**Required Capabilities:**

- [ ] Track committees (jury, steering, technical, etc.)
- [ ] Manage nomination workflow
- [ ] Link committees to parent entities (awards, forums)
- [ ] Store nominee qualifications

**Proposed Schema:**

```sql
CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  committee_type TEXT CHECK (committee_type IN (
    'jury', 'steering', 'technical', 'advisory', 'working_group'
  )),
  parent_entity_type TEXT,
  parent_entity_id UUID,
  terms_of_reference_en TEXT,
  terms_of_reference_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE committee_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id),
  nominating_org_id UUID REFERENCES dossiers(id),
  nominee_person_id UUID REFERENCES dossiers(id),
  nominee_name TEXT,
  nominee_name_ar TEXT,
  nominee_title TEXT,
  nominee_email TEXT,
  nomination_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### UC-020: External URL/Link Management

**Category:** DOC (Document Management)
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Correspondences include URLs (https://www.msy.qa/جائزة-الابداع-الشبابي) that should be tracked.

**Required Capabilities:**

- [ ] Store URLs with Arabic path segments
- [ ] Link URLs to entities
- [ ] Validate URL accessibility

---

#### UC-021: Recurring Events / Commemorative Days

**Category:** ENT (Entity Management)
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
"Gulf Statistics Day" (يوم الإحصاء الخليجي) - December 24 - is used as a reference point.

**Required Capabilities:**

- [ ] Track recurring commemorative days
- [ ] Link events launched on special days
- [ ] Calendar integration

---

#### UC-022: Target Group / Eligibility Criteria

**Category:** RPT (Reporting)
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Award targets "GCC citizens aged 18-34" - structured eligibility.

**Eligibility Structure:**

```json
{
  "citizenship": ["SA", "AE", "KW", "BH", "QA", "OM"],
  "age_range": { "min": 18, "max": 34 },
  "category": "youth"
}
```

---

#### UC-023: Organization Reference Number Format

**Category:** DOC (Document Management)
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
GCC-Stat uses format `م.إ.م.ت.خ.م/511/2025` for letter references.

**Format Analysis:**

- `م.إ.م.ت.خ.م` = Organization abbreviation
- `511` = Sequential number
- `2025` = Year

**Required Capabilities:**

- [ ] Parse organization-specific reference formats
- [ ] Search by reference number patterns

---

### Terminology Extracted

| Arabic Term                       | English Translation               | Domain       |
| --------------------------------- | --------------------------------- | ------------ |
| المركز الإحصائي لدول مجلس التعاون | GCC Statistical Center (GCC-Stat) | Organization |
| جائزة الإبداع الشبابي             | Youth Innovation Award            | Award        |
| لجنة التحكيم                      | Jury Committee                    | Committee    |
| يوم الإحصاء الخليجي               | Gulf Statistics Day               | Event        |
| تحدي البيانات                     | Data Challenge                    | Track        |
| الذكاء الاصطناعي                  | Artificial Intelligence           | Domain       |
| تمكين الشباب                      | Youth Empowerment                 | Initiative   |
| ترشيح                             | Nomination                        | Process      |

---

### Pattern: Nomination Request

**New Pattern Identified:**

- Request for nominations (not questionnaire, not MoU)
- For committee/jury membership
- Related to specific program (award)
- Open-ended response (no hard deadline mentioned)
- Includes supporting documents (committee tasks)

---

## Correspondence #5: PCBS Leadership Transition Announcement

### Metadata

| Field                 | Value                                      |
| --------------------- | ------------------------------------------ |
| **Correspondence ID** | CORR-2026-005                              |
| **Date Analyzed**     | 2026-02-05                                 |
| **Document Type**     | Circular Letter                            |
| **Priority Marking**  | Normal                                     |
| **Language**          | English (bilingual letterhead)             |
| **From**              | PCBS Minister's Office, State of Palestine |
| **To**                | "Dear Valued Partners" (Circular)          |
| **Reference**         | 2026/01/45                                 |

### Document Summary

Leadership transition announcement: Sufian Abu Harb appointed as Acting President of PCBS effective January 5, 2026. Updates official contact information and expresses commitment to partnership.

### Original Text (Key Excerpts)

<details>
<summary>Click to expand</summary>

Dear Valued Partners,

Wishing you a happy and peaceful New Year,

It is with great pleasure that I inform you of my appointment as Acting President of the Palestinian Central Bureau of Statistics (PCBS) as of January 5, 2026.

As I assume this responsibility, I am committed to strengthening our collaboration and deepening our partnerships in support of the Palestinian National Statistical System (NSS) and the broader statistical community.

Since joining PCBS in 1995, I have had the privilege of serving in senior leadership roles and spearheading major initiatives that have shaped our institution.

For a smooth transition, I kindly ask that all official communications be addressed to me through our official general email address DIWAN@pcbs.gov.ps and sufian@pcbs.gov.ps

With my best wishes,
Sufian Abu Harb
Acting President
Palestinian Central Bureau of Statistics (PCBS)

</details>

### Entities Extracted

| Entity Name        | Entity Type  | Role in Correspondence |
| ------------------ | ------------ | ---------------------- |
| PCBS               | Organization | Sender                 |
| State of Palestine | Country      | Parent State           |
| Sufian Abu Harb    | Person       | New Acting President   |
| Minister's Office  | Department   | Sending Unit           |

### Information Extracted

**Leadership Change:**
| Field | Value |
|-------|-------|
| Organization | PCBS |
| Position | President |
| New Holder | Sufian Abu Harb |
| Appointment Type | Acting |
| Effective Date | January 5, 2026 |
| Career Start | 1995 |

**Contact Information:**
| Type | Email |
|------|-------|
| General | DIWAN@pcbs.gov.ps |
| Personal | sufian@pcbs.gov.ps |

### Use Cases Derived

---

#### UC-024: Leadership Change Tracking

**Category:** ENT (Entity Management)
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
Partner organizations notify of leadership changes. Must track who leads counterpart organizations for relationship management.

**Required Capabilities:**

- [ ] Track current leader per organization
- [ ] Record leadership transitions with dates
- [ ] Distinguish acting vs permanent appointments
- [ ] Link to source correspondence
- [ ] Trigger contact updates

**Proposed Schema:**

```sql
CREATE TABLE organization_leadership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES dossiers(id),
  position_title TEXT NOT NULL,
  person_name TEXT NOT NULL,
  person_name_ar TEXT,
  person_id UUID REFERENCES dossiers(id),
  appointment_type TEXT DEFAULT 'permanent'
    CHECK (appointment_type IN ('permanent', 'acting', 'interim')),
  effective_date DATE NOT NULL,
  end_date DATE,
  contact_email TEXT,
  source_correspondence_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### UC-025: Organization Contact Directory

**Category:** ENT (Entity Management)
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
Organizations have multiple contact channels. Store general inbox and leader's direct email.

**Contact Update from Letter:**

- General: DIWAN@pcbs.gov.ps
- Leader: sufian@pcbs.gov.ps

**Required Capabilities:**

- [ ] Multiple contacts per organization
- [ ] Contact types (general, leader, technical)
- [ ] Validity tracking
- [ ] Link to leadership changes

**Proposed Schema:**

```sql
CREATE TABLE organization_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES dossiers(id),
  contact_type TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_name TEXT,
  is_primary BOOLEAN DEFAULT false,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### UC-026: Person Career History

**Category:** ENT (Entity Management)
**Priority:** Medium
**Current Support:** Partial

**Scenario:**
Letter mentions "Since joining PCBS in 1995" - valuable career context.

**Career Data:**

```
1995: Joined PCBS
...: Various senior leadership roles
2026: Acting President
```

**Required Capabilities:**

- [ ] Track career history
- [ ] Link positions to organizations
- [ ] Note tenure and progression

---

#### UC-027: Circular / Broadcast Correspondence

**Category:** DOC (Document Management)
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Addressed to "Dear Valued Partners" - not specific recipient. Same letter sent to multiple organizations.

**Required Capabilities:**

- [ ] Flag as circular/broadcast
- [ ] Different workflow (no direct response)
- [ ] Track distribution list

---

#### UC-028: Correspondence Without Action Required

**Category:** WFL (Workflow)
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Unlike CORR-001 to CORR-004, this is informational only. No deadline, no submission, no nomination needed.

**Action Categories:**
| Category | Examples |
|----------|----------|
| Action Required | Questionnaire, nomination, MoU implementation |
| Information Only | Leadership change, announcement, greeting |

---

### Terminology Extracted

| Term                              | Translation                      | Domain       |
| --------------------------------- | -------------------------------- | ------------ |
| Acting President                  | رئيس بالإنابة                    | Title        |
| DIWAN                             | ديوان                            | Contact Type |
| NSS (National Statistical System) | النظام الإحصائي الوطني           | Domain       |
| PCBS                              | الجهاز المركزي للإحصاء الفلسطيني | Organization |

---

### Pattern: Leadership Transition Announcement

**New Pattern Identified:**

**Characteristics:**

- Circular letter (multiple recipients)
- Informational (no action required)
- Contact information update
- Leadership background provided
- Relationship maintenance purpose

**Information to Capture:**

1. New leader name and title
2. Acting vs permanent status
3. Effective date
4. Updated contact emails
5. Career background (optional)
6. Organization context

---

## Correspondence #6: UN Statistical Commission Side Event Request

### Metadata

| Field                 | Value                              |
| --------------------- | ---------------------------------- |
| **Correspondence ID** | CORR-2026-006                      |
| **Date Analyzed**     | 2026-02-05                         |
| **Document Type**     | Event Booking Request              |
| **Language**          | Arabic + English (table)           |
| **From**              | GASTAT, International Partnerships |
| **To**                | Mr. Raed Al-Salman                 |
| **Signed By**         | Haitham Mohammed Alghulaiga        |

### Document Summary

GASTAT requests booking of a side event "Strengthening Data Governance for Official Statistics: Charting the Way Forward" during the 57th Session of the UN Statistical Commission (New York, March 3-6, 2026). Includes comprehensive logistics specifications.

### Event Details Extracted

| Category                | Details                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| **Event Title (Full)**  | Strengthening Data Governance for Official Statistics: Charting the Way Forward |
| **Short Title**         | Strengthening Data Governance for Official Statistics                           |
| **Event Type**          | Side Event / Policy Briefing                                                    |
| **Parent Event**        | 57th Session of UN Statistical Commission                                       |
| **Preferred Date**      | Tuesday, March 3, 2026                                                          |
| **Alternative Date**    | Wednesday, March 4, 2026                                                        |
| **Event Time**          | 08:00 – 09:30                                                                   |
| **Setup Time**          | 07:00 – 08:00                                                                   |
| **Breakdown Time**      | 09:30 – 10:00                                                                   |
| **Expected Attendance** | ~50 delegates                                                                   |
| **Participant Level**   | Chief Statistician level                                                        |
| **Access Type**         | Registration-based                                                              |

### Logistics Requirements Extracted

| Requirement    | Specification                        |
| -------------- | ------------------------------------ |
| Room Setup     | Conference/classroom, 50+ capacity   |
| Stage/Podium   | Not required                         |
| Audio-Visual   | Projector, HDMI, microphones         |
| Recording      | Audio and video required             |
| Internet       | High-speed Wi-Fi required            |
| Streaming      | Not required                         |
| Interpretation | Not required                         |
| Branding       | Door signage with event title        |
| Catering       | Coffee/tea station, bottled water    |
| Security       | Registration desk, controlled access |
| Special        | None                                 |

### Staff Contact Extracted

| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| Name         | Haitham Mohammed Alghulaiga                    |
| Name (AR)    | هيثم بن محمد الغليقة                           |
| Title        | Director General of International Partnerships |
| Title (AR)   | مدير عام الشراكات الدولية                      |
| Email        | hmghulaiga@stats.gov.sa                        |
| Office Phone | +966112894340                                  |
| Mobile       | +966554270890                                  |
| Organization | GASTAT                                         |

### Entities Extracted

| Entity Name                   | Entity Type   | Role                  |
| ----------------------------- | ------------- | --------------------- |
| GASTAT                        | Organization  | Event Organizer       |
| UN Statistical Commission     | Forum         | Parent Event          |
| 57th Session                  | Forum Session | Associated Main Event |
| Saudi Permanent Mission to UN | Organization  | Coordination Point    |
| Haitham Mohammed Alghulaiga   | Person        | GASTAT Staff          |
| Raed Al-Salman                | Person        | Recipient             |

### Use Cases Derived

---

#### UC-029: Side Event Management

**Category:** ENT (Entity Management)
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
Organizations host side events during major forums. Track event details, logistics, and booking status.

**Required Capabilities:**

- [ ] Create side events linked to forum sessions
- [ ] Store date options (preferred + alternative)
- [ ] Track time slots (setup, event, breakdown)
- [ ] Store attendance expectations
- [ ] Track booking status

**Proposed Schema:**

```sql
CREATE TABLE side_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  short_title_en TEXT,
  event_type TEXT,
  forum_session_id UUID REFERENCES forum_sessions(id),
  organizer_id UUID REFERENCES dossiers(id),
  preferred_date DATE,
  alternative_date DATE,
  event_start_time TIME,
  event_end_time TIME,
  setup_time TIME,
  breakdown_time TIME,
  expected_attendance INT,
  participant_level TEXT,
  access_type TEXT,
  booking_status TEXT DEFAULT 'requested',
  confirmed_venue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### UC-030: Event Logistics Requirements

**Category:** ENT (Entity Management)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Events have detailed logistics needs (AV, catering, security, recording).

**Proposed Schema:**

```sql
CREATE TABLE event_logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  room_setup TEXT,
  minimum_capacity INT,
  av_requirements JSONB,
  recording_audio BOOLEAN,
  recording_video BOOLEAN,
  wifi_required BOOLEAN,
  streaming_required BOOLEAN,
  interpretation_required BOOLEAN,
  interpretation_languages TEXT[],
  branding_requirements TEXT,
  catering_requirements TEXT,
  security_requirements TEXT,
  special_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### UC-031: Forum Session Side Events

**Category:** REL (Relationships)
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Link side events to parent forum sessions for context.

**Relationship:**

```
57th UN Statistical Commission (Parent)
└── Side Event: Data Governance (GASTAT)
```

---

#### UC-032: Event Attendance Specifications

**Category:** ENT
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Track expected attendance count and participant seniority level.

---

#### UC-033: Multi-Track Venue Booking

**Category:** WFL
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Venue booking through multiple channels (external venue + UN internal).

---

#### UC-034: Staff Contact Directory

**Category:** ENT
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Store detailed staff contacts with department, title, email, and multiple phone numbers.

**Proposed Schema:**

```sql
CREATE TABLE staff_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES dossiers(id),
  person_id UUID REFERENCES dossiers(id),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  title_en TEXT,
  title_ar TEXT,
  department_en TEXT,
  department_ar TEXT,
  email TEXT,
  office_phone TEXT,
  mobile_phone TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Terminology Extracted

| Arabic                         | English                    | Domain     |
| ------------------------------ | -------------------------- | ---------- |
| فعالية جانبية                  | Side Event                 | Event Type |
| اللجنة الإحصائية للأمم المتحدة | UN Statistical Commission  | Forum      |
| حوكمة البيانات                 | Data Governance            | Topic      |
| الشراكات الدولية               | International Partnerships | Department |
| المندوبية الدائمة              | Permanent Mission          | Org Type   |
| مدير عام                       | Director General           | Title      |

---

### Pattern: Side Event Booking Request

**New Pattern Identified:**

**Characteristics:**

- Detailed logistics specifications
- Linked to parent forum session
- Multiple date options
- Multiple venue tracks
- Staff contact for coordination

**Required Information:**

1. Event title (full + short)
2. Parent session reference
3. Date/time options
4. Attendance expectations
5. Full logistics checklist
6. Organizing staff contact

---

## Correspondence #7: Internal UNSC Preparation Email

### Metadata

| Field                 | Value                     |
| --------------------- | ------------------------- |
| **Correspondence ID** | CORR-2026-007             |
| **Date Analyzed**     | 2026-02-05                |
| **Document Type**     | Internal Email            |
| **Direction**         | Internal                  |
| **Language**          | Arabic + English (table)  |
| **From**              | Haitham Alghulaiga        |
| **Date Sent**         | February 1, 2026, 6:21 PM |

### Document Summary

Internal coordination email requesting department inputs on UNSC 57 agenda items. Deadline extended from January 15 to February 3, 2026. Includes tracking matrix showing 26+ items overdue, only 1 responded.

### Recipients

**To:** Dr. Fatimah Al Waef, Dr. Sharifa Alrajhi, Assem Algursan, Dr. Abdullah Aal Thunayan, Mohammed ALMisfer

**Cc:** Khalid Alzahrani, Ibrahim Alali, Haitham Aldawsari, +11 more

### Attachments

| File                   | Size     | Purpose                         |
| ---------------------- | -------- | ------------------------------- |
| Annotated Agenda       | 274.5 KB | UNSC 57 agenda with annotations |
| Delegation Report      | 897.7 KB | Previous delegation report      |
| Committee Meeting File | 669.6 KB | Meeting materials               |
| Feedback Tracker       | 20.4 KB  | Excel status tracker            |

### Key Dates

| Date                 | Event                     |
| -------------------- | ------------------------- |
| January 13, 2026     | Coordination meeting held |
| January 15, 2026     | Original deadline         |
| February 1, 2026     | Email sent (reminder)     |
| **February 3, 2026** | **Extended deadline**     |
| March 3-6, 2026      | UNSC 57 Session           |

### Agenda Item Status Summary

| Status       | Count |
| ------------ | ----- |
| 🟢 Responded | 1     |
| 🔴 Overdue   | 26+   |

### GASTAT Departments Identified

| Department                   | Items Assigned |
| ---------------------------- | -------------- |
| All Departments              | 4              |
| Data Management & Governance | 4              |
| Economic Statistics          | 6              |
| Environmental & Spatial      | 3              |
| Information Technology       | 1 ✓            |
| Quality & Methodology        | 1              |
| Social Statistics            | 8              |
| International Indicators     | 2              |

### Use Cases Derived

---

#### UC-035: Internal Coordination Correspondence

**Category:** DOC
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
Internal emails coordinate preparation for external events. Different from external correspondence.

**Correspondence Direction:**
| Direction | Count | Examples |
|-----------|-------|----------|
| Inbound (External) | 5 | CORR-001 to 005 |
| Outbound (External) | 1 | CORR-006 |
| **Internal** | 1 | **CORR-007** |

---

#### UC-036: Delegation Preparation Workflow

**Category:** WFL
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
Forum participation requires coordinated preparation with milestones.

**Workflow Stages:**

1. Forum announced
2. Agenda items identified
3. Items assigned to departments
4. Coordination meeting
5. Collect department inputs
6. Compile delegation brief
7. Participate in forum

---

#### UC-037: Agenda Item Assignment Tracking

**Category:** CMT
**Priority:** High
**Current Support:** Gap Identified

**Scenario:**
Assign agenda items to departments for input. Track response status.

**Proposed Schema:**

```sql
CREATE TABLE forum_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_session_id UUID REFERENCES forum_sessions(id),
  item_number TEXT NOT NULL,
  item_name_en TEXT NOT NULL,
  item_name_ar TEXT,
  UNIQUE(forum_session_id, item_number)
);

CREATE TABLE agenda_item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID REFERENCES forum_agenda_items(id),
  department TEXT NOT NULL,
  assigned_to UUID,
  deadline DATE,
  extended_deadline DATE,
  status TEXT DEFAULT 'pending',
  response_date DATE
);
```

---

#### UC-038: Department Response Status Dashboard

**Category:** RPT
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Visual dashboard showing response status by department.

---

#### UC-039: Deadline Extension Tracking

**Category:** CMT
**Priority:** Medium
**Current Support:** Gap Identified

**Scenario:**
Track original deadline vs extended deadline.

---

#### UC-040: Meeting Reference Linking

**Category:** REL
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Link correspondence to referenced meetings.

---

#### UC-041: Email Thread/Chain Context

**Category:** DOC
**Priority:** Low
**Current Support:** Gap Identified

**Scenario:**
Track email threads as linked correspondence.

---

### Pattern: Internal Forum Preparation Coordination

**New Pattern Identified:**

**Characteristics:**

- Internal email (not external)
- Multiple recipients by department
- Task assignment matrix
- Status tracking (responded/overdue)
- Deadline with extension
- Multiple attachments
- References prior meeting

**Required Tracking:**

1. Agenda items by session
2. Department assignments
3. Response status
4. Deadline management
5. Attachment storage
6. Meeting linkage

---

## Schema Enhancement Proposals

### Priority Matrix

| Proposal                            | Use Cases      | Effort | Impact | Priority |
| ----------------------------------- | -------------- | ------ | ------ | -------- |
| `correspondence_participants` table | UC-001         | Medium | High   | P1       |
| `external_deadline` fields          | UC-002         | Low    | High   | P1       |
| `forum_sessions` table              | UC-008, UC-009 | Medium | High   | P1       |
| Org hierarchy relationship types    | UC-007         | Low    | High   | P1       |
| MoU lifecycle fields                | UC-012         | Medium | High   | P1       |
| `government_decisions` table        | UC-013         | Medium | High   | P1       |
| `mou_parties` table                 | UC-014         | Medium | High   | P1       |
| `external_references` JSONB/table   | UC-003         | Low    | Medium | P2       |
| `terminology` table                 | UC-004         | Medium | Medium | P2       |
| Questionnaire request fields        | UC-005, UC-010 | Medium | Medium | P2       |
| Dual calendar support (Hijri)       | UC-016         | Medium | Medium | P2       |
| MoU implementation templates        | UC-017         | Medium | Medium | P2       |
| `awards` and `award_tracks` tables  | UC-018         | Medium | Medium | P2       |
| `committees` and nominations tables | UC-019, UC-006 | Medium | Medium | P2       |
| `organization_leadership` table     | UC-024         | Medium | High   | P1       |
| `organization_contacts` table       | UC-025         | Medium | High   | P1       |
| Person career history fields        | UC-026         | Low    | Medium | P2       |
| `side_events` table                 | UC-029, UC-031 | Medium | High   | P1       |
| `event_logistics` table             | UC-030         | Medium | Medium | P2       |
| `staff_contacts` table              | UC-034         | Medium | Medium | P2       |
| `forum_agenda_items` + assignments  | UC-037         | Medium | High   | P1       |
| Internal correspondence flag        | UC-035         | Low    | High   | P1       |
| Delegation preparation workflow     | UC-036         | Medium | High   | P1       |
| Deadline extension fields           | UC-039         | Low    | Medium | P2       |
| Department response dashboard       | UC-038         | Medium | Medium | P2       |
| Position nomination fields          | UC-006         | Low    | Medium | P3       |
| Meeting reference linking           | UC-040         | Low    | Low    | P3       |
| Email thread tracking               | UC-041         | Low    | Low    | P3       |
| Event attendance tracking           | UC-032         | Low    | Low    | P3       |
| Multi-track venue workflow          | UC-033         | Low    | Low    | P3       |
| Circular correspondence flag        | UC-027         | Low    | Low    | P3       |
| Action required flag                | UC-028         | Low    | Low    | P3       |
| Attachment contact extraction       | UC-011         | Low    | Low    | P3       |
| Reference number validation         | UC-015, UC-023 | Low    | Low    | P3       |
| External URL tracking               | UC-020         | Low    | Low    | P3       |
| Recurring events table              | UC-021         | Low    | Low    | P3       |
| Eligibility criteria JSONB          | UC-022         | Low    | Low    | P3       |

### Migration Roadmap

**Phase 1 (High Priority):**

```sql
-- Migration: 060_correspondence_participants.sql
-- Migration: 061_external_deadlines.sql
```

**Phase 2 (Medium Priority):**

```sql
-- Migration: 062_external_references.sql
-- Migration: 063_terminology_glossary.sql
```

**Phase 3 (Low Priority):**

```sql
-- Migration: 064_position_nominations.sql
```

---

## Architecture Gaps Identified

| Gap                                 | Description                                | Affected Use Cases | Severity |
| ----------------------------------- | ------------------------------------------ | ------------------ | -------- |
| No correspondence chain tracking    | Cannot model multi-org routing             | UC-001             | High     |
| Single deadline field               | Cannot distinguish internal/external       | UC-002             | High     |
| No forum sessions table             | Cannot track numbered meetings             | UC-008             | High     |
| Limited org hierarchy relationships | Cannot model subsidiary/parent             | UC-007             | High     |
| No MoU lifecycle tracking           | Cannot track approval stages               | UC-012             | High     |
| No government decisions table       | Cannot link Cabinet/Royal decisions        | UC-013             | High     |
| No MoU parties junction             | Cannot query MoUs by country               | UC-014             | High     |
| No external reference registry      | Cannot search by telegram number           | UC-003             | Medium   |
| No terminology management           | Inconsistent translations                  | UC-004             | Medium   |
| No initiative/project tracking      | Cannot track multi-phase projects          | UC-009             | Medium   |
| No questionnaire tracking           | Common request type not supported          | UC-005, UC-010     | Medium   |
| No Hijri calendar support           | Cannot store/display Islamic dates         | UC-016             | Medium   |
| No MoU implementation templates     | Cannot auto-create post-ratification tasks | UC-017             | Medium   |
| No nomination workflow              | Cannot track focal point requests          | UC-006, UC-019     | Medium   |
| No attachment data extraction       | Cannot store contact info from attachments | UC-011             | Low      |
| No reference number validation      | Cannot validate decision formats           | UC-015, UC-023     | Low      |
| No award/competition tracking       | Cannot track awards and tracks             | UC-018             | Medium   |
| No committee management             | Cannot track juries and nominations        | UC-019             | Medium   |
| No external URL management          | Cannot store/validate URLs                 | UC-020             | Low      |
| No recurring events tracking        | Cannot track commemorative days            | UC-021             | Low      |
| No eligibility criteria structure   | Cannot filter by target group              | UC-022             | Low      |
| No leadership tracking              | Cannot track org leadership changes        | UC-024             | High     |
| No contact directory                | Cannot store org contact info              | UC-025             | High     |
| No career history tracking          | Cannot track person career progression     | UC-026             | Medium   |
| No circular flag                    | Cannot identify broadcast letters          | UC-027             | Low      |
| No action-required flag             | Cannot distinguish info vs action items    | UC-028             | Low      |
| No side events tracking             | Cannot manage events at forums             | UC-029, UC-031     | High     |
| No event logistics tracking         | Cannot store AV/catering requirements      | UC-030             | Medium   |
| No staff contacts table             | Cannot store dept staff with phones        | UC-034             | Medium   |
| No event attendance specs           | Cannot track expected attendance           | UC-032             | Low      |
| No multi-venue booking              | Cannot track parallel venue options        | UC-033             | Low      |
| No internal correspondence flag     | Cannot distinguish internal vs external    | UC-035             | High     |
| No delegation prep workflow         | Cannot track forum preparation             | UC-036             | High     |
| No agenda item assignments          | Cannot assign items to departments         | UC-037             | High     |
| No response status dashboard        | Cannot visualize department responses      | UC-038             | Medium   |
| No deadline extension tracking      | Cannot track original vs extended          | UC-039             | Medium   |
| No meeting-correspondence link      | Cannot link emails to meetings             | UC-040             | Low      |
| No email thread tracking            | Cannot track email chains                  | UC-041             | Low      |

---

## Emerging Patterns

Patterns identified across multiple correspondences:

### Pattern 1: International Questionnaire Request

**Occurrences:** 2 (CORR-001, CORR-002)
**Frequency:** High (100% of analyzed correspondences)

**Common Structure:**

1. International org sends request to member state
2. Request routed through MoFA to relevant agency
3. Deadline for submission specified
4. Submission method varies (online/email)

**Recommended Action:** Create dedicated `questionnaire_request` handling with:

- Standard fields for deadline, submission method, contact
- Template workflow for tracking completion
- Dashboard for pending questionnaire deadlines

---

### Pattern 2: MoFA as Central Router

**Occurrences:** 2 (CORR-001, CORR-002)
**Frequency:** High (100% of analyzed correspondences)

**Flow:**

```
International Org → Saudi Mission/Embassy → MoFA → Target Agency
```

**Implication:** MoFA correspondence tracking is upstream of our system. Consider integration or import capabilities.

---

### Pattern 3: Attachment Contains Key Details

**Occurrences:** 3 (CORR-001, CORR-002, CORR-003)
**Frequency:** High (100% of analyzed correspondences)

**Common Attachment Content:**

- Original memo from international org
- Detailed instructions
- Contact information
- Forms/questionnaires
- Official decisions (Cabinet Resolution, Royal Decree)

**Recommended Action:** Implement attachment parsing to extract:

- Contact emails
- Deadlines (if different from cover letter)
- Document references
- Decision reference numbers

---

### Pattern 4: MoU Lifecycle Correspondence

**Occurrences:** 1 (CORR-003)
**Frequency:** New pattern identified

**Characteristics:**

- No response deadline
- Involves government approval chain
- Transmits official decision documents
- Action is open-ended ("complete necessary")

**MoU Correspondence Types:**

1. Draft sharing
2. Negotiation updates
3. Signing notification
4. Approval/ratification notification (CORR-003)
5. Implementation coordination
6. Review/renewal discussions

**Recommended Action:** Create `correspondence_category` field:

- `questionnaire_request`
- `mou_lifecycle`
- `meeting_invitation`
- `information_sharing`
- `action_request`

---

### Pattern 5: Dual Date Systems

**Occurrences:** 1 explicit (CORR-003), 1 implicit (CORR-001)
**Frequency:** Medium (present in official government docs)

**Context:**

- Hijri dates used in Saudi government documents
- Gregorian dates used for international coordination
- Both must be stored and displayed

**Recommended Action:**

- Add `_hijri` companion fields for key dates
- Implement Hijri↔Gregorian conversion utility
- Allow user preference for date display

---

### Pattern 6: Government Decision Chain

**Occurrences:** 1 (CORR-003)
**Frequency:** Specific to MoU/treaty workflows

**Chain Structure:**

```
Document Signed
    ↓
Cabinet Resolution (قرار مجلس الوزراء)
    ↓
Royal Decree (مرسوم ملكي)
    ↓
Entry into Force
```

**Recommended Action:** Create `government_decisions` table to track approval chains with reference numbers and relationships.

---

### Pattern 7: Committee/Jury Nomination Request

**Occurrences:** 1 (CORR-004)
**Frequency:** New pattern identified

**Characteristics:**

- Request for personnel nominations
- For committee/jury membership (not focal point)
- Related to specific program (award, initiative)
- Includes terms of reference / task description
- No hard deadline (open-ended)

**Nomination Request Types Seen:**
| Type | Source | Context |
|------|--------|---------|
| Focal Point | CORR-001 | UN survey coordination |
| Jury Member | CORR-004 | Award evaluation |

**Recommended Action:** Create unified nomination handling with:

- `committees` table for tracking boards/juries
- `committee_nominations` for nomination workflow
- Link to parent entity (award, survey, initiative)

---

### Pattern 8: Regional Organization Communication

**Occurrences:** 2 (CORR-002: OIC/SESRIC, CORR-004: GCC/GCC-Stat)
**Frequency:** Medium

**Characteristics:**

- From regional org subsidiary (SESRIC, GCC-Stat)
- To member state agency (GASTAT)
- Regarding regional program/initiative
- References org-specific letter numbering

**Regional Organizations Encountered:**
| Parent | Subsidiary | Region |
|--------|------------|--------|
| OIC | SESRIC | Islamic world |
| GCC | GCC-Stat | Gulf |
| UN | UN-DESA | Global |

**Recommended Action:** Ensure org hierarchy relationships can model these regional structures.

---

### Pattern 9: Leadership Transition Announcement

**Occurrences:** 1 (CORR-005)
**Frequency:** Expected periodically from all partner orgs

**Characteristics:**

- Circular letter (to all partners)
- Informational - no action required
- Contains contact information update
- Leader background sometimes provided
- New Year timing common

**Information to Extract:**

1. Organization
2. New leader name
3. Acting vs permanent
4. Effective date
5. Updated contact emails
6. Career background (optional)

**Recommended Action:**

- Create `organization_leadership` table
- Create `organization_contacts` table
- Add workflow for "information only" items

---

### Pattern 10: Correspondence Action Categories

**Occurrences:** 5 (all correspondences)
**Frequency:** Fundamental classification

**Action Categories Identified:**

| Category            | Description                     | Examples      |
| ------------------- | ------------------------------- | ------------- |
| **Deadline-driven** | Specific deadline for response  | CORR-001, 002 |
| **Process-driven**  | Internal procedures to complete | CORR-003      |
| **Nomination**      | Find and submit candidate       | CORR-004      |
| **Informational**   | No action, just acknowledge     | CORR-005      |

**Recommended Action:** Add `action_category` field to intake tickets:

```sql
ALTER TABLE intake_tickets ADD COLUMN
  action_category TEXT CHECK (action_category IN (
    'deadline_response', 'internal_process',
    'nomination', 'information_only', 'meeting_rsvp',
    'event_booking'
  ));
```

---

### Pattern 11: Side Event Booking Request

**Occurrences:** 1 (CORR-006)
**Frequency:** Before major forum sessions

**Characteristics:**

- Linked to parent forum session
- Detailed logistics specifications (table format)
- Multiple date options
- Multiple venue tracks (internal/external)
- Staff contact for coordination
- Requires follow-up on booking status

**Information to Capture:**

1. Event title (full + short)
2. Parent session reference
3. Date/time options (preferred + alternative)
4. Setup/breakdown times
5. Attendance expectations
6. Full logistics checklist
7. Venue booking tracks
8. Organizing staff contact

**Recommended Action:**

- Create `side_events` table
- Create `event_logistics` table
- Link to `forum_sessions`

---

### Pattern 12: Outbound vs Inbound Correspondence

**Occurrences:** 6 (all correspondences)
**Frequency:** Fundamental classification

**Direction Categories:**

| Direction    | Count | Examples                 |
| ------------ | ----- | ------------------------ |
| **Inbound**  | 5     | CORR-001,002,003,004,005 |
| **Outbound** | 1     | CORR-006                 |

**Key Insight:**
CORR-006 is the first **outbound** correspondence - GASTAT sending a request.
Previous 5 were all **inbound** - GASTAT receiving requests.

**Recommended Action:** Track correspondence direction:

```sql
ALTER TABLE intake_tickets ADD COLUMN
  direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound', 'internal'));
```

---

### Pattern 13: Internal Forum Preparation Coordination

**Occurrences:** 1 (CORR-007)
**Frequency:** Before every forum session

**Characteristics:**

- Internal email (not external)
- Multiple recipients by department
- Task assignment matrix (agenda items → departments)
- Status tracking (responded/overdue color coding)
- Deadline management with extensions
- Multiple attachments (agenda, reports, trackers)
- References prior coordination meeting

**Workflow:**

```
Forum Session Announced
    ↓
Agenda Items Received
    ↓
Items Assigned to Departments
    ↓
Coordination Meeting
    ↓
Deadline Set
    ↓
Track Responses (Overdue/Responded)
    ↓
Extend Deadline if Needed
    ↓
Compile Delegation Brief
    ↓
Participate in Forum
```

**Recommended Action:**

- Create `forum_agenda_items` table
- Create `agenda_item_assignments` table
- Add deadline extension fields
- Build department response dashboard

---

### Pattern 14: Correspondence Direction Classification

**Occurrences:** 7 (all correspondences)
**Frequency:** Fundamental classification

**Direction Distribution:**

| Direction           | Count | Examples                     |
| ------------------- | ----- | ---------------------------- |
| Inbound (External)  | 5     | CORR-001, 002, 003, 004, 005 |
| Outbound (External) | 1     | CORR-006                     |
| Internal            | 1     | CORR-007                     |

**Insight:** System must support all three directions, not just inbound.

---

## Validation Checklist

Use this checklist when analyzing new correspondences:

### Entity Extraction

- [ ] List all organizations mentioned
- [ ] List all persons/roles mentioned
- [ ] Identify the correspondence chain (who sent to whom)
- [ ] Note any new entity types

### Workflow Analysis

- [ ] What action is requested?
- [ ] Who is the action owner?
- [ ] What is the deadline (if any)?
- [ ] Is there a reference to previous correspondence?

### Data Model Validation

- [ ] Can all entities be stored in existing tables?
- [ ] Can all relationships be modeled?
- [ ] Can all deadlines be tracked?
- [ ] Can bilingual content be stored properly?

### Gap Identification

- [ ] What cannot be stored?
- [ ] What cannot be queried?
- [ ] What cannot be reported on?

---

## Appendix: Correspondence Log

| ID            | Date Analyzed | Type           | Source            | Key Use Cases    |
| ------------- | ------------- | -------------- | ----------------- | ---------------- |
| CORR-2026-001 | 2026-02-05    | Telegram       | MoFA → GASTAT     | UC-001 to UC-006 |
| CORR-2026-002 | 2026-02-05    | Telegram       | MoFA → GASTAT     | UC-007 to UC-011 |
| CORR-2026-003 | 2026-02-05    | Letter         | Unknown → GASTAT  | UC-012 to UC-017 |
| CORR-2026-004 | 2026-02-05    | Letter         | GCC-Stat → GASTAT | UC-018 to UC-023 |
| CORR-2026-005 | 2026-02-05    | Circular       | PCBS → Partners   | UC-024 to UC-028 |
| CORR-2026-006 | 2026-02-05    | Event Request  | GASTAT → UN       | UC-029 to UC-034 |
| CORR-2026-007 | 2026-02-05    | Internal Email | GASTAT Internal   | UC-035 to UC-041 |

---

## Appendix: Entity Registry

Organizations discovered across correspondences:

| Entity                               | Type            | Abbreviation | Parent             | First Seen |
| ------------------------------------ | --------------- | ------------ | ------------------ | ---------- |
| United Nations                       | Organization    | UN           | -                  | CORR-001   |
| UN-DESA                              | Organization    | DESA         | UN                 | CORR-001   |
| Saudi Permanent Mission to UN        | Organization    | -            | MoFA               | CORR-001   |
| Organization of Islamic Cooperation  | Organization    | OIC          | -                  | CORR-002   |
| SESRIC                               | Organization    | -            | OIC                | CORR-002   |
| OIC Statistical Committee            | Forum           | -            | OIC                | CORR-002   |
| Ministry of Foreign Affairs          | Organization    | MoFA         | -                  | CORR-001   |
| GASTAT                               | Organization    | -            | -                  | CORR-001   |
| NCSI (Oman)                          | Organization    | -            | -                  | CORR-003   |
| Sultanate of Oman                    | Country         | -            | -                  | CORR-003   |
| Council of Ministers                 | Government Body | -            | -                  | CORR-003   |
| GCC-Stat                             | Organization    | -            | GCC                | CORR-004   |
| GCC                                  | Organization    | -            | -                  | CORR-004   |
| Youth Innovation Award in Data World | Award           | -            | GCC-Stat           | CORR-004   |
| Gulf Statistics Day                  | Recurring Event | -            | GCC-Stat           | CORR-004   |
| PCBS                                 | Organization    | -            | State of Palestine | CORR-005   |
| State of Palestine                   | Country         | -            | -                  | CORR-005   |
| Sufian Abu Harb                      | Person          | -            | PCBS               | CORR-005   |
| UN Statistical Commission            | Forum           | UNSC         | UN                 | CORR-006   |
| Haitham Mohammed Alghulaiga          | Person          | -            | GASTAT             | CORR-006   |
| Raed Al-Salman                       | Person          | -            | -                  | CORR-006   |

---

## Appendix: Deadline Registry

External deadlines from correspondences:

| Source   | Deadline   | Action Required                   | Owner  | Status  |
| -------- | ---------- | --------------------------------- | ------ | ------- |
| CORR-001 | 2026-02-09 | Complete QCPR questionnaire       | GASTAT | Pending |
| CORR-002 | 2026-02-27 | Complete NSS questionnaire        | GASTAT | Pending |
| CORR-003 | Open       | Complete MoU implementation steps | GASTAT | Pending |

---

## Appendix: MoU Registry

MoUs identified across correspondences:

| ID      | Parties              | Subject                 | Signed      | Status   | Source   |
| ------- | -------------------- | ----------------------- | ----------- | -------- | -------- |
| MOU-001 | GASTAT + NCSI (Oman) | Statistical Cooperation | Sep 3, 2025 | Ratified | CORR-003 |

---

## Appendix: Government Decisions Registry

| Type               | Number | Date (Hijri) | Subject          | Related To | Source   |
| ------------------ | ------ | ------------ | ---------------- | ---------- | -------- |
| Cabinet Resolution | 506    | 24/7/1447    | MoU Approval     | MOU-001    | CORR-003 |
| Royal Decree       | M/153  | 30/7/1447    | MoU Ratification | MOU-001    | CORR-003 |

---

## Appendix: Awards Registry

| ID      | Name                                 | Organizer | Target             | Tracks                        | Source   |
| ------- | ------------------------------------ | --------- | ------------------ | ----------------------------- | -------- |
| AWD-001 | Youth Innovation Award in Data World | GCC-Stat  | GCC citizens 18-34 | Data Challenge, AI Innovation | CORR-004 |

---

## Appendix: Committees Registry

| ID      | Name                       | Type | Parent Entity | Status              | Source   |
| ------- | -------------------------- | ---- | ------------- | ------------------- | -------- |
| CMT-001 | Youth Award Jury Committee | Jury | AWD-001       | Seeking Nominations | CORR-004 |

---

## Appendix: Leadership Registry

| Organization | Position  | Person          | Type   | Effective   | Source   |
| ------------ | --------- | --------------- | ------ | ----------- | -------- |
| PCBS         | President | Sufian Abu Harb | Acting | Jan 5, 2026 | CORR-005 |

---

## Appendix: Contact Directory

| Organization | Contact Type               | Email                   | Source   |
| ------------ | -------------------------- | ----------------------- | -------- |
| PCBS         | General/Diwan              | DIWAN@pcbs.gov.ps       | CORR-005 |
| PCBS         | Leader                     | sufian@pcbs.gov.ps      | CORR-005 |
| GASTAT       | Staff (Int'l Partnerships) | hmghulaiga@stats.gov.sa | CORR-006 |

---

## Appendix: Side Events Registry

| ID     | Title                                   | Organizer | Parent Session | Date          | Status    | Source   |
| ------ | --------------------------------------- | --------- | -------------- | ------------- | --------- | -------- |
| SE-001 | Data Governance for Official Statistics | GASTAT    | 57th UNSC      | Mar 3-4, 2026 | Requested | CORR-006 |

---

## Appendix: Forum Sessions Registry

| ID     | Forum                     | Session # | Dates         | Location | Source   |
| ------ | ------------------------- | --------- | ------------- | -------- | -------- |
| FS-001 | OIC Statistical Committee | 14        | Oct 1-3, 2025 | -        | CORR-002 |
| FS-002 | UN Statistical Commission | 57        | Mar 3-6, 2026 | New York | CORR-006 |

---

## Appendix: Staff Directory

| Name                      | Organization | Title                 | Email                   | Phone         | Source   |
| ------------------------- | ------------ | --------------------- | ----------------------- | ------------- | -------- |
| Haitham M. Alghulaiga     | GASTAT       | DG Int'l Partnerships | hmghulaiga@stats.gov.sa | +966112894340 | CORR-006 |
| Dr. Fatimah Al Waef       | GASTAT       | -                     | -                       | -             | CORR-007 |
| Dr. Sharifa Alrajhi       | GASTAT       | -                     | -                       | -             | CORR-007 |
| Assem Algursan            | GASTAT       | -                     | -                       | -             | CORR-007 |
| Dr. Abdullah Aal Thunayan | GASTAT       | -                     | -                       | -             | CORR-007 |
| Mohammed ALMisfer         | GASTAT       | -                     | -                       | -             | CORR-007 |

---

## Appendix: GASTAT Department Registry

| Department                           | Arabic                      | Source   |
| ------------------------------------ | --------------------------- | -------- |
| Data Management and Governance       | إدارة البيانات والحوكمة     | CORR-007 |
| Economic Statistics                  | الإحصاءات الاقتصادية        | CORR-007 |
| Environmental and Spatial Statistics | الإحصاءات البيئية والمكانية | CORR-007 |
| Information Technology               | تقنية المعلومات             | CORR-007 |
| Quality, Methodology and Innovation  | الجودة والمنهجية والابتكار  | CORR-007 |
| Social Statistics                    | الإحصاءات الاجتماعية        | CORR-007 |
| International Indicators             | المؤشرات الدولية            | CORR-007 |
| International Partnerships           | الشراكات الدولية            | CORR-006 |

---

## Appendix: Agenda Item Assignments (UNSC 57)

| Item | Name                               | Department                 | Status        |
| ---- | ---------------------------------- | -------------------------- | ------------- |
| 3(b) | Social and demographic statistics  | Social Statistics          | Overdue       |
| 3(c) | Demographic and housing statistics | All / Int'l Indicators     | Overdue       |
| 3(d) | Health statistics                  | Social Statistics          | Overdue       |
| 3(e) | National accounts                  | Economic Statistics        | Overdue       |
| 3(f) | Environmental-economic accounting  | Economic Statistics        | Overdue       |
| 3(g) | Agricultural and rural statistics  | Economic Statistics        | Overdue       |
| 3(h) | Business and trade statistics      | Economic Statistics        | Overdue       |
| 3(i) | Well-being measurement             | Economic Statistics        | Overdue       |
| 3(j) | Data governance                    | All Departments            | Overdue       |
| 3(k) | 2030 Agenda indicators             | All / Int'l Indicators     | Overdue       |
| 3(m) | Statistical data presentation      | Data Management            | Overdue       |
| 4(a) | Ageing-related statistics          | Social Statistics          | Overdue       |
| 4(b) | Refugee and IDP statistics         | Social Statistics          | Overdue       |
| 4(c) | Disaster-related statistics        | Environmental              | Overdue       |
| 4(d) | Governance statistics              | Data Management            | Overdue       |
| 4(e) | International classifications      | Quality & Methodology      | Overdue       |
| 4(f) | Statistical-geospatial integration | Environmental              | Overdue       |
| 5(a) | Gender statistics                  | Social Statistics          | Overdue       |
| 5(b) | Disability statistics              | Social Statistics          | Overdue       |
| 5(c) | Culture statistics                 | Social Statistics          | Overdue       |
| 5(d) | Economic statistics                | Economic Statistics        | Overdue       |
| 5(e) | International Comparison Programme | Data Management            | Overdue       |
| 5(f) | ICT statistics                     | **Information Technology** | **Responded** |
| 5(g) | Data science                       | Data Management            | Overdue       |
| 5(h) | Coordination of programmes         | All Departments            | Overdue       |

---

---

## How to Continue Adding Correspondences

To add more correspondences later, share the document image and say:

```
correspondence [N]
```

For each correspondence, I will:

1. Extract metadata (type, direction, sender, recipient)
2. Summarize content in Arabic and English
3. Identify entities (organizations, persons, forums)
4. Derive new use cases (UC-042+)
5. Map to existing patterns or identify new ones
6. Update all registries and appendices
7. Add to gap analysis if new gaps found

### Correspondence Types Still Not Seen

| Type               | Expected Content                       |
| ------------------ | -------------------------------------- |
| Meeting Invitation | Date, location, agenda, RSVP deadline  |
| Report Submission  | Statistical report, publication notice |
| Training/Workshop  | Capacity building, dates, participants |
| Data Request       | Specific data, format, deadline        |
| Complaint/Issue    | Problem report, resolution request     |

---

_This document is maintained as part of the Intl-Dossier architecture validation process._
_Last analysis session: February 5, 2026_
