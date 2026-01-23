# Dossier-Centric Architecture: Comprehensive Analysis

**Last Updated**: 2026-01-19
**Status**: Analysis Complete
**Purpose**: Document how dossiers connect to all system components and provide improvement recommendations

---

## Executive Summary

The GASTAT International Dossier system is built around the **Dossier** as its central organizing concept. A dossier represents any diplomatic entity of interest—countries, organizations, forums, engagements, topics (formerly “themes”), working groups, persons, and elected officials. All operational work (tasks, commitments, intakes), documents (positions, MOUs, briefs), intelligence, and calendar events connect back to dossiers, making them the single source of truth for international relations management.

---

## 1. The Dossier as the Central Hub

### 1.1 What is a Dossier?

A dossier is a comprehensive profile for any entity relevant to GASTAT's international relations work:

| Dossier Type       | Description                                               | Example                                     |
| ------------------ | --------------------------------------------------------- | ------------------------------------------- |
| `country`          | Nation states with diplomatic relations                   | Saudi Arabia, China, Japan                  |
| `organization`     | International bodies, agencies, ministries                | UN, WTO, Saudi Ministry of Trade            |
| `forum`            | Multi-party conferences and summits                       | G20, OPEC Summit, UN Statistical Commission |
| `engagement`       | Diplomatic meetings, consultations, visits                | Bilateral Trade Talks 2026                  |
| `topic`            | Policy areas and strategic initiatives (formerly `theme`) | Climate Policy, Trade Facilitation          |
| `working_group`    | Committees and task forces                                | G20 Data Gaps Working Group                 |
| `person`           | VIPs requiring tracking                                   | Ambassadors, Ministers, Key Officials       |
| `elected_official` | Government contacts with office/term metadata             | Senator, Minister, Governor                 |

### 1.2 Unified Base Table Pattern

All dossier types share a common foundation using **Class Table Inheritance**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        dossiers (Base)                          │
│  • Single UUID namespace for all entities                       │
│  • Bilingual names (name_en, name_ar)                          │
│  • Status, sensitivity, tags, metadata                          │
│  • Full-text search vector                                      │
└───────────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐
│countries│ │  orgs  │ │  forums  │ │engagem. │ │persons│...
│ (ext)  │ │ (ext)  │ │  (ext)   │ │  (ext)  │ │ (ext) │
└────────┘ └────────┘ └──────────┘ └─────────┘ └───────┘
```

This architecture ensures:

- **One ID to rule them all**: Every entity has a single dossier ID
- **Polymorphic references**: Any table can link to `dossiers.id`
- **Type safety**: Database constraints ensure type-specific data integrity
- **Unified search**: One search covers all entity types

---

## 2. Dossier Connections Map

### 2.1 Complete Connection Diagram

```
                                    ┌─────────────────────┐
                                    │   CALENDAR EVENTS   │
                                    │  • Meetings         │
                                    │  • Deadlines        │
                                    │  • Sessions         │
                                    └──────────┬──────────┘
                                               │
          ┌──────────────────────┐            │            ┌──────────────────────┐
          │    RELATIONSHIPS     │◄───────────┼───────────►│     DOCUMENTS        │
          │  • Bilateral         │            │            │  • Positions         │
          │  • Membership        │            │            │  • MOUs              │
          │  • Partnership       │            │            │  • Briefs            │
          │  • Parent/Child      │            │            │  • Intelligence      │
          └──────────┬───────────┘            │            └──────────┬───────────┘
                     │                        │                       │
                     │           ┌────────────┴────────────┐          │
                     │           │                         │          │
                     └──────────►│       DOSSIER          │◄─────────┘
                                 │   (Central Entity)      │
                                 │                         │
                     ┌──────────►│  country | org | forum │◄─────────┐
                     │           │  engagement | topic    │          │
                     │           │  working_group | person│          │
                     │           │  elected_official      │          │
                     │           └────────────┬────────────┘          │
                     │                        │                       │
          ┌──────────┴───────────┐            │            ┌──────────┴───────────┐
          │    WORK ITEMS        │◄───────────┴───────────►│    PARTICIPANTS      │
          │  • Tasks             │                         │  • Key Contacts      │
          │  • Commitments       │                         │  • Dossier Owners    │
          │  • Intakes           │                         │  • Event Attendees   │
          └──────────────────────┘                         └──────────────────────┘
```

### 2.2 Connection Details by Category

#### A. Dossier-to-Dossier Relationships (Graph Model)

The `dossier_relationships` table enables a powerful graph of connections:

| Relationship Type             | Example                                       |
| ----------------------------- | --------------------------------------------- |
| `bilateral_relation`          | Saudi Arabia ↔ China (diplomatic relations)  |
| `membership`                  | Saudi Arabia → G20 (country belongs to forum) |
| `partnership`                 | UN ↔ WTO (organizations collaborate)         |
| `parent_of` / `subsidiary_of` | Ministry → Department (hierarchy)             |
| `discusses`                   | Engagement → Topic (meeting covers a topic)   |
| `involves`                    | Engagement → Country (participants)           |
| `represents`                  | Person → Country (ambassador represents)      |
| `works_on`                    | Working Group → Topic (committee scope)       |

**Graph Capabilities:**

- Bidirectional queries (find all connections from either direction)
- Multi-hop traversal (e.g., "all entities within 3 degrees of Saudi Arabia")
- Path discovery (how are two entities connected?)
- Temporal validity (relationships have effective dates)

#### B. Work Items to Dossiers (Context Inheritance)

Work items (tasks, commitments, intakes) connect to dossiers via `work_item_dossiers`:

```typescript
// Smart context inheritance
type InheritanceSource =
  | 'direct' // User linked directly from dossier page
  | 'engagement' // Inherited from engagement → dossier
  | 'after_action' // Inherited from after-action → engagement → dossier
  | 'position' // Inherited from position → dossier
  | 'mou'; // Inherited from MOU → dossier
```

**Example Flow:**

1. User creates task from Saudi Arabia dossier page
2. System automatically links task to Saudi Arabia dossier
3. Task appears in Saudi Arabia's activity timeline
4. Users can find all work related to Saudi Arabia

#### C. Intake Entity Links (AI-Assisted)

Intake tickets link to multiple entity types via `intake_entity_links`:

| Link Type     | Purpose                                    |
| ------------- | ------------------------------------------ |
| `primary`     | Main dossier(s) the intake concerns        |
| `related`     | Secondary relevant entities                |
| `requested`   | Positions/MOUs/Engagements being requested |
| `mentioned`   | Entities mentioned in the intake text      |
| `assigned_to` | Staff assignment                           |

**AI Integration:**

- AI analyzes intake text to suggest entity links
- Confidence scores guide triage officers
- Links can be human-created, AI-suggested, or imported

#### D. Documents to Dossiers

| Document Type | Link Table                | Description                                      |
| ------------- | ------------------------- | ------------------------------------------------ |
| Positions     | `position_dossier_links`  | Policy positions linked to multiple dossiers     |
| MOUs          | `mous` (signatory fields) | Agreements between country/org dossiers          |
| Briefs        | `briefs` (dossier_id)     | Generated or manual briefings per dossier        |
| Intelligence  | `intelligence_signals`    | Market/political intelligence linked to dossiers |

#### E. Calendar Events

The `calendar_events` table separates temporal instances from entity identity:

- **One dossier, many events**: G20 Summit (forum dossier) has opening ceremony, sessions, closing
- **Recurring meetings**: Monthly bilateral talks create multiple calendar events
- **Participants**: Event participants link to person dossiers or user profiles

#### F. People and Contacts

| Connection         | Table                | Description                               |
| ------------------ | -------------------- | ----------------------------------------- |
| Dossier Owners     | `dossier_owners`     | Staff responsible for maintaining dossier |
| Key Contacts       | `key_contacts`       | External contacts associated with dossier |
| Key Officials      | `persons` extension  | VIP persons as full dossiers              |
| Event Participants | `event_participants` | Attendees at calendar events              |

---

## 3. Data Flow Through Dossiers

### 3.1 Typical User Journey

```
User enters intake ticket
        │
        ▼
┌───────────────────────┐
│ AI suggests dossier   │──► Links created in intake_entity_links
│ links based on text   │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Triage officer        │──► Validates/modifies links
│ reviews suggestions   │──► Creates task from intake
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Task inherits context │──► work_item_dossiers records
│ from parent dossiers  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Staff creates position│──► position_dossier_links to relevant countries
│ document for request  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ All activity appears  │──► Unified timeline shows complete history
│ in dossier timeline   │
└───────────────────────┘
```

### 3.2 Relationship Graph Query Example

```sql
-- Find all entities within 2 degrees of Saudi Arabia
WITH RECURSIVE entity_network AS (
  -- Base: Saudi Arabia dossier
  SELECT d.id, d.name_en, d.type, 0 as depth, ARRAY[d.id] as path
  FROM dossiers d WHERE d.name_en = 'Saudi Arabia'

  UNION ALL

  -- Recursive: connected entities
  SELECT d2.id, d2.name_en, d2.type, en.depth + 1, en.path || d2.id
  FROM entity_network en
  JOIN dossier_relationships r ON r.source_dossier_id = en.id OR r.target_dossier_id = en.id
  JOIN dossiers d2 ON d2.id = CASE
    WHEN r.source_dossier_id = en.id THEN r.target_dossier_id
    ELSE r.source_dossier_id
  END
  WHERE en.depth < 2
    AND d2.id != ALL(en.path)  -- Prevent cycles
)
SELECT * FROM entity_network;
```

---

## 4. UI/UX Manifestation

### 4.1 Current Navigation Structure

```
My Work (Personal queue)
├── Unified Work Hub
├── My Assignments (Tasks)
├── Commitments
├── Intake Queue
└── Waiting Queue

Main (Core Operations)
├── Dashboard
├── Custom Dashboard
├── Approvals
├── Dossiers ◄───────── Central navigation item
├── Positions
└── After Actions

Tools (Analysis & Planning)
├── Calendar
├── Briefs
├── Briefing Books
├── Intelligence
├── Analytics
├── Reports
└── SLA Monitoring
```

### 4.2 Dossier Detail Page Structure

Each dossier type has specialized detail pages with common patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Name, Type Badge, Status, Actions                       │
├─────────────────────────────────────────────────────────────────┤
│ Tabs:                                                           │
│ [Overview] [Relationships] [Positions] [Timeline] [Documents]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│ │ Summary/Description │  │ Quick Stats                     │   │
│ │ (AI-generated or    │  │ • Related engagements: 12       │   │
│ │  manual)            │  │ • Active positions: 8           │   │
│ │                     │  │ • Pending commitments: 3        │   │
│ └─────────────────────┘  └─────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Recent Activity Timeline                                    │ │
│ │ • Task "Prepare brief" completed (2h ago)                   │ │
│ │ • Position "Trade Policy" linked (1d ago)                   │ │
│ │ • Commitment "Follow up with ministry" created (3d ago)     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Key Contacts / Related Entities                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Dossier Components Library

The system provides specialized components:

| Component                 | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `UniversalDossierCard`    | Polymorphic card for any dossier type      |
| `DossierTypeSelector`     | Type selection during creation             |
| `DossierTypeIcon`         | Consistent iconography per type            |
| `DossierContextBadge`     | Shows linked dossier with inheritance info |
| `DossierSelector`         | Search and select dossiers for linking     |
| `DossierActivityTimeline` | Unified activity feed per dossier          |
| `RelationshipWizard`      | Create dossier-to-dossier relationships    |

---

## 5. Improvement Recommendations

### 5.1 Navigation & Information Architecture

#### Recommendation 1: Elevate Dossiers to Primary Navigation

**Current State**: Dossiers appear as one item among many in "Main" section
**Proposed Change**: Make Dossiers the first-class citizen with dedicated navigation section

```diff
- Main
-   Dashboard
-   Dossiers
-   Positions
+ Dossiers (Primary Hub)
+   All Dossiers
+   By Type
+     Countries
+     Organizations
+     Forums
+     Engagements
+     Working Groups
+     Persons
+     Topics
+     Elected Officials
+   Relationship Graph
+   Recent Activity
```

**Rationale**: Emphasizes that all work flows through dossiers

#### Recommendation 2: Dossier-Centric Dashboard

**Current State**: Dashboard shows generic metrics
**Proposed Change**: Dashboard organized around dossier activity

```
┌─────────────────────────────────────────────────────────────────┐
│ My Dossiers (Ones I own/contribute to)                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│ │ 🇸🇦     │ │ 🏛️     │ │ 🌐     │ │ 👤     │                │
│ │Saudi    │ │UN Stats │ │G20 2026│ │Min. Al-│                │
│ │Arabia   │ │Division │ │        │ │Qahtani │                │
│ │ 5 new   │ │ 2 tasks │ │1 commit│ │ 1 brief│                │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                │
├─────────────────────────────────────────────────────────────────┤
│ Recent Dossier Activity                                         │
│ • Position linked to Saudi Arabia (2h ago)                      │
│ • New engagement created for G20 (5h ago)                       │
│ • Brief generated for UN Stats Division (1d ago)                │
├─────────────────────────────────────────────────────────────────┤
│ Pending Work by Dossier                                         │
│ Saudi Arabia: 5 tasks, 2 commitments                            │
│ G20 2026: 3 tasks, 1 intake                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Recommendation 3: "Create from Dossier" as Primary Action

**Current State**: Various creation entry points
**Proposed Change**: Standardize "Add to Dossier" as the mental model

```typescript
// Contextual action menu on dossier pages
const dossierActions = [
  { label: 'New Intake', icon: Inbox, action: 'createIntake' },
  { label: 'New Task', icon: CheckSquare, action: 'createTask' },
  { label: 'New Commitment', icon: FileCheck, action: 'createCommitment' },
  { label: 'New Position', icon: FileText, action: 'createPosition' },
  { label: 'Schedule Event', icon: Calendar, action: 'createEvent' },
  { label: 'Add Relationship', icon: Link, action: 'createRelationship' },
];
```

### 5.2 UI/UX Enhancements

#### Recommendation 4: Dossier Context Indicator in Headers

Add persistent context indicator showing current dossier scope:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📁 Viewing in context of: Saudi Arabia 🇸🇦  [Change] [Clear]   │
├─────────────────────────────────────────────────────────────────┤
│ Task: Review trade agreement documents                          │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

#### Recommendation 5: Unified "Related to Dossier" Widget

Reusable widget appearing on all entity detail pages:

```typescript
interface DossierRelationsWidgetProps {
  entityType: 'task' | 'commitment' | 'position' | 'mou' | 'event';
  entityId: string;
  // Shows linked dossiers with inheritance path
  // Allows adding/removing links
  // Shows how context was inherited
}
```

#### Recommendation 6: Relationship Graph in Sidebar

Add quick-access mini graph showing immediate relationships:

```
┌─────────────────────┐
│ 🔗 Relationships    │
│                     │
│    ┌──────┐        │
│    │ G20  │        │
│    └──┬───┘        │
│       │membership  │
│    ┌──▼───┐        │
│    │🇸🇦 SA │◄──You──│
│    └──┬───┘        │
│       │bilateral   │
│    ┌──▼───┐        │
│    │🇨🇳 CN │        │
│    └──────┘        │
│                     │
│ [View Full Graph]   │
└─────────────────────┘
```

### 5.3 Search & Discovery

#### Recommendation 7: Dossier-First Search

Search should emphasize dossier discovery:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Search dossiers, documents, and work items...               │
├─────────────────────────────────────────────────────────────────┤
│ Filter: [All Types ▼] [Active ▼] [My Dossiers ▼]               │
├─────────────────────────────────────────────────────────────────┤
│ DOSSIERS (5 matches)                                            │
│ 🇸🇦 Saudi Arabia - Country                                      │
│ 🏛️ Saudi Ministry of Trade - Organization                      │
│                                                                 │
│ RELATED WORK (12 matches in linked dossiers)                    │
│ 📋 Task: Prepare trade brief (Saudi Arabia)                     │
│ 📄 Position: Trade Facilitation Policy (Saudi Arabia, G20)      │
└─────────────────────────────────────────────────────────────────┘
```

#### Recommendation 8: "Everything about X" Query

One-click view showing all connections to a dossier:

```
"Everything about Saudi Arabia"
├── 15 related dossiers
│   ├── 3 country relationships (bilateral)
│   ├── 8 organization relationships
│   └── 4 forum memberships
├── 23 documents
│   ├── 12 positions
│   ├── 8 MOUs
│   └── 3 briefs
├── 45 work items
│   ├── 28 tasks
│   ├── 12 commitments
│   └── 5 intakes
└── 67 calendar events
```

### 5.4 Branding & Messaging

#### Recommendation 9: Rebrand as "Dossier Management System"

Update terminology throughout the application:

| Current             | Proposed                       |
| ------------------- | ------------------------------ |
| "GASTAT Dossier"    | "GASTAT International Dossier" |
| "Entity"            | "Dossier" (where appropriate)  |
| "Create Engagement" | "Create Engagement Dossier"    |
| "View Details"      | "View Dossier"                 |

#### Recommendation 10: Onboarding Tour Emphasizing Dossiers

New user onboarding should establish the mental model:

```
Step 1: "Welcome to GASTAT International Dossier"
        "Everything starts with a Dossier - your central hub for
         tracking countries, organizations, and diplomatic activities."

Step 2: "Your Dossiers"
        "You'll be assigned dossiers to manage. Each dossier collects
         all related work, documents, and relationships in one place."

Step 3: "Work Flows Through Dossiers"
        "When you create tasks, positions, or schedule meetings,
         they automatically link to the relevant dossiers."
```

### 5.5 Technical Improvements

#### Recommendation 11: Dossier Context Provider Enhancement

Extend the context provider for better state management:

```typescript
interface EnhancedDossierContext {
  // Current dossier scope
  activeDossier: DossierReference | null;
  recentDossiers: DossierReference[];
  pinnedDossiers: DossierReference[];

  // Actions
  setActiveDossier: (dossier: DossierReference) => void;
  pinDossier: (id: string) => void;
  unpinDossier: (id: string) => void;

  // Smart context resolution
  resolveContextFromUrl: () => Promise<DossierReference[]>;
  inheritContextFromParent: (parentType: string, parentId: string) => Promise<DossierReference[]>;
}
```

#### Recommendation 12: Dossier Activity Feed API

Unified endpoint for dossier activity:

```typescript
// GET /api/dossiers/:id/activity
interface DossierActivityResponse {
  activities: Array<{
    id: string;
    type: 'task' | 'commitment' | 'intake' | 'position' | 'event' | 'relationship';
    action: 'created' | 'updated' | 'completed' | 'linked';
    title: string;
    timestamp: string;
    actor: { id: string; name: string };
    inheritanceSource?: InheritanceSource;
  }>;
  pagination: { cursor: string; hasMore: boolean };
}
```

#### Recommendation 13: Pre-computed Dossier Statistics

Materialized view for fast dashboard stats:

```sql
CREATE MATERIALIZED VIEW dossier_statistics AS
SELECT
  d.id as dossier_id,
  d.type,
  COUNT(DISTINCT wid.id) FILTER (WHERE wid.work_item_type = 'task') as task_count,
  COUNT(DISTINCT wid.id) FILTER (WHERE wid.work_item_type = 'commitment') as commitment_count,
  COUNT(DISTINCT pdl.id) as position_count,
  COUNT(DISTINCT dr.id) as relationship_count,
  COUNT(DISTINCT ce.id) as event_count,
  MAX(wid.created_at) as last_activity_at
FROM dossiers d
LEFT JOIN work_item_dossiers wid ON wid.dossier_id = d.id
LEFT JOIN position_dossier_links pdl ON pdl.dossier_id = d.id
LEFT JOIN dossier_relationships dr ON dr.source_dossier_id = d.id OR dr.target_dossier_id = d.id
LEFT JOIN calendar_entries ce ON ce.dossier_id = d.id
GROUP BY d.id, d.type;

-- Refresh periodically or on triggers
REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_statistics;
```

---

## 6. Implementation Priority Matrix

| Recommendation                     | Impact | Effort | Priority |
| ---------------------------------- | ------ | ------ | -------- |
| R1: Elevate Dossiers in Navigation | High   | Low    | **P1**   |
| R2: Dossier-Centric Dashboard      | High   | Medium | **P1**   |
| R3: "Create from Dossier" Actions  | High   | Low    | **P1**   |
| R4: Context Indicator              | Medium | Low    | **P2**   |
| R5: Relations Widget               | Medium | Medium | **P2**   |
| R6: Mini Graph in Sidebar          | Medium | High   | **P3**   |
| R7: Dossier-First Search           | High   | Medium | **P1**   |
| R8: "Everything about X" Query     | High   | Medium | **P2**   |
| R9: Branding Update                | Medium | Low    | **P2**   |
| R10: Onboarding Tour               | Medium | Medium | **P2**   |
| R11: Enhanced Context Provider     | High   | Medium | **P1**   |
| R12: Activity Feed API             | High   | Medium | **P1**   |
| R13: Pre-computed Statistics       | Medium | Low    | **P2**   |

---

## 7. Conclusion

The GASTAT International Dossier system has a solid architectural foundation with dossiers as the central organizing concept. However, this centrality is not fully reflected in the user experience. By implementing the recommendations above—particularly elevating dossiers in navigation, creating dossier-centric dashboards, and improving search discovery—the system can better communicate its core value proposition: **comprehensive diplomatic entity management through unified dossier profiles**.

The key message to reinforce: **"If it matters to international relations, it lives in a dossier."**
