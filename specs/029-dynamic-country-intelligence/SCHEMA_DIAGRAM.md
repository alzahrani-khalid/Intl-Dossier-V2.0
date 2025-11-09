# Dynamic Country Intelligence System - Schema Diagram

**Feature**: 029-dynamic-country-intelligence
**Date**: 2025-01-30

## Entity Relationship Diagram

```mermaid
erDiagram
    DOSSIERS ||--o{ INTELLIGENCE_REPORTS : "entity_id"
    USERS ||--o{ INTELLIGENCE_REPORTS : "analyst_id"
    USERS ||--o{ INTELLIGENCE_REPORTS : "refresh_triggered_by"
    ORGANIZATIONS ||--|| INTELLIGENCE_REPORTS : "organization_id"
    INTELLIGENCE_REPORTS ||--o{ INTELLIGENCE_REPORTS : "parent_version_id"

    DOSSIERS {
        uuid id PK
        text type "country, organization, forum, topic"
        text name_en
        text name_ar
        text sensitivity_level "low, medium, high"
        timestamptz created_at
    }

    INTELLIGENCE_REPORTS {
        uuid id PK
        text title
        text title_ar
        text content
        text content_ar
        int confidence_score "0-100"
        text[] data_sources "LEGACY"
        timestamptz analysis_timestamp
        uuid analyst_id FK
        text review_status "draft, pending, approved, archived"
        jsonb threat_indicators
        jsonb geospatial_tags
        text embedding_status
        uuid organization_id FK
        uuid dossier_id "LEGACY"
        uuid entity_id FK "NEW: Link to any dossier"
        text entity_type "NEW: country, organization, forum, topic, working_group"
        text intelligence_type "NEW: economic, political, security, bilateral, general"
        timestamptz cache_expires_at "NEW: TTL expiration"
        timestamptz cache_created_at "NEW"
        timestamptz last_refreshed_at "NEW"
        text refresh_status "NEW: fresh, stale, refreshing, error, expired"
        jsonb data_sources_metadata "NEW: Comprehensive source tracking"
        int version "NEW: Version number"
        uuid parent_version_id FK "NEW: Previous version reference"
        text version_notes "NEW"
        text anythingllm_workspace_id "NEW"
        text anythingllm_query "NEW"
        jsonb anythingllm_response_metadata "NEW"
        uuid refresh_triggered_by FK "NEW: User who triggered refresh"
        text refresh_trigger_type "NEW: manual, automatic, scheduled"
        int refresh_duration_ms "NEW: Performance tracking"
        text refresh_error_message "NEW"
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
        uuid updated_by FK
        timestamptz archived_at
    }

    USERS {
        uuid id PK
        text email
        timestamptz created_at
    }

    ORGANIZATIONS {
        uuid id PK
        text name_en
        text name_ar
        timestamptz created_at
    }
```

## Intelligence Type Classification

```mermaid
graph TD
    A[Intelligence Report] --> B{Intelligence Type}
    B -->|TTL: 24h| C[Economic]
    B -->|TTL: 6h| D[Political]
    B -->|TTL: 12h| E[Security]
    B -->|TTL: 48h| F[Bilateral]
    B -->|TTL: 24h| G[General]

    C --> C1[GDP, Inflation, Trade]
    D --> D1[Leadership, Events, Diplomatic]
    E --> E1[Threats, Advisories, Risk]
    F --> F1[Relationship Analysis]
    G --> G1[Other Intelligence]

    style C fill:#90EE90
    style D fill:#FFB6C1
    style E fill:#FFD700
    style F fill:#87CEEB
    style G fill:#DDA0DD
```

## Cache Refresh State Machine

```mermaid
stateDiagram-v2
    [*] --> Fresh: INSERT new intelligence
    Fresh --> Stale: cache_expires_at < NOW()
    Fresh --> Refreshing: Manual refresh triggered
    Stale --> Refreshing: Auto/manual refresh
    Refreshing --> Fresh: Refresh succeeds
    Refreshing --> Error: Refresh fails
    Error --> Refreshing: Retry
    Stale --> Expired: Too old without refresh
    Expired --> Refreshing: Forced refresh
    Fresh --> [*]: Archived

    note right of Fresh
        Within TTL
        Good to use
    end note

    note right of Stale
        Past TTL
        Needs refresh
        Still usable
    end note

    note right of Refreshing
        Lock acquired
        Update in progress
    end note

    note right of Error
        Last refresh failed
        Show cached data
        Allow retry
    end note

    note right of Expired
        Very old
        Should refresh
        before use
    end note
```

## Data Flow - Intelligence Refresh

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant EF as Edge Function<br/>(intelligence-refresh)
    participant DB as PostgreSQL<br/>(intelligence_reports)
    participant LLM as AnythingLLM
    participant API as External APIs<br/>(World Bank, etc.)

    U->>UI: Click "Refresh Intelligence"
    UI->>UI: Check if already refreshing
    UI->>EF: POST /intelligence-refresh<br/>{entity_id, intelligence_types}

    EF->>DB: lock_intelligence_for_refresh()
    alt Lock acquired
        DB-->>EF: TRUE
        EF->>EF: Set refresh_status = 'refreshing'

        par Fetch Data Sources
            EF->>LLM: Query workspace for intelligence
            LLM-->>EF: AI-generated analysis + metadata
        and
            EF->>API: GET economic indicators
            API-->>EF: GDP, inflation, trade data
        end

        EF->>EF: Aggregate data sources
        EF->>EF: Build intelligence report

        EF->>DB: UPDATE intelligence_reports<br/>SET content, data_sources_metadata,<br/>refresh_status='fresh',<br/>cache_expires_at=NOW()+TTL

        DB-->>EF: Success
        EF-->>UI: {success: true, data, duration_ms}
        UI->>UI: Display updated intelligence
        UI->>U: Show success toast + timestamp
    else Lock failed (concurrent refresh)
        DB-->>EF: FALSE
        EF-->>UI: {success: false, error: "Already refreshing"}
        UI->>U: Show "Refresh in progress" message
    end
```

## Query Performance - Index Usage

```mermaid
graph LR
    A[Query: Get latest<br/>intelligence for entity] --> B{Index Selection}
    B --> C[idx_intelligence_reports_<br/>entity_type_fresh]
    C --> D[Covers: entity_id,<br/>intelligence_type,<br/>refresh_status,<br/>last_refreshed_at]
    D --> E[Response Time:<br/>&lt;10ms]

    F[Query: Find<br/>expired cache] --> G{Index Selection}
    G --> H[idx_intelligence_reports_<br/>cache_expires]
    H --> I[Partial index:<br/>WHERE cache_expires_at &lt; NOW()]
    I --> J[Response Time:<br/>&lt;50ms]

    K[Query: Search by<br/>data source] --> L{Index Selection}
    L --> M[idx_intelligence_reports_<br/>data_sources_metadata]
    M --> N[GIN index on JSONB<br/>Supports @&gt; operator]
    N --> O[Response Time:<br/>&lt;100ms]

    style E fill:#90EE90
    style J fill:#90EE90
    style O fill:#FFD700
```

## Version History Chain

```mermaid
graph TD
    A[Current Report v5<br/>parent_version_id: v4] --> B[Archived Report v4<br/>parent_version_id: v3]
    B --> C[Archived Report v3<br/>parent_version_id: v2]
    C --> D[Archived Report v2<br/>parent_version_id: v1]
    D --> E[Archived Report v1<br/>parent_version_id: NULL]

    A -.->|Query with<br/>RECURSIVE CTE| F[Version Chain]
    B -.-> F
    C -.-> F
    D -.-> F
    E -.-> F

    F --> G[All versions<br/>ordered by version DESC]

    style A fill:#90EE90
    style B fill:#DDA0DD
    style C fill:#DDA0DD
    style D fill:#DDA0DD
    style E fill:#DDA0DD
    style G fill:#87CEEB
```

## RLS Security Flow

```mermaid
graph TD
    A[User attempts to<br/>SELECT intelligence] --> B{Check RLS Policy:<br/>view_intelligence_by_entity_clearance}

    B --> C{entity_id IS NOT NULL?}
    C -->|Yes| D[Get linked dossier<br/>sensitivity_level]
    C -->|No| Z[Allow<br/>backwards compatibility]

    D --> E{User clearance >=<br/>dossier sensitivity?}

    E -->|low = 1| F[User clearance >= 1]
    E -->|medium = 2| G[User clearance >= 2]
    E -->|high = 3| H[User clearance >= 3]

    F --> I{Clearance check}
    G --> I
    H --> I

    I -->|Pass| J[ALLOW SELECT]
    I -->|Fail| K[DENY SELECT<br/>Row not visible]

    style J fill:#90EE90
    style K fill:#FF6B6B
    style Z fill:#FFD700
```

## Data Source Metadata Structure

```mermaid
graph TD
    A[intelligence_reports.data_sources_metadata<br/>JSONB Array] --> B[Source 1: World Bank API]
    A --> C[Source 2: AnythingLLM]
    A --> D[Source 3: Manual Entry]

    B --> B1["{\n  source: 'world_bank_api',\n  endpoint: '/v2/country/SAU/indicator',\n  retrieved_at: '2025-01-30T10:00:00Z',\n  confidence: 95,\n  metadata: {...}\n}"]

    C --> C1["{\n  source: 'anythingllm',\n  endpoint: 'workspace://country-saudi-arabia',\n  retrieved_at: '2025-01-30T10:00:05Z',\n  confidence: 87,\n  metadata: {\n    model: 'gpt-4',\n    tokens_used: 1250\n  }\n}"]

    D --> D1["{\n  source: 'manual_entry',\n  retrieved_at: '2025-01-30T09:45:00Z',\n  confidence: 100,\n  metadata: {\n    entered_by: 'analyst@example.com'\n  }\n}"]

    style A fill:#87CEEB
    style B1 fill:#90EE90
    style C1 fill:#FFB6C1
    style D1 fill:#FFD700
```

## Intelligence Dashboard Architecture

```mermaid
graph TD
    A[Country Dossier Page] --> B[Intelligence Tab]
    B --> C[IntelligenceDashboard Component]

    C --> D[Economic Section<br/>intelligence_type='economic']
    C --> E[Political Section<br/>intelligence_type='political']
    C --> F[Security Section<br/>intelligence_type='security']
    C --> G[Bilateral Section<br/>intelligence_type='bilateral']

    D --> H[IntelligenceWidget]
    E --> H
    F --> H
    G --> H

    H --> I[useIntelligence Hook]
    I --> J[TanStack Query]
    J --> K[Edge Function: intelligence-get]
    K --> L[PostgreSQL Query]

    H --> M[Refresh Button]
    M --> N[useRefreshIntelligence Hook]
    N --> O[Edge Function: intelligence-refresh]
    O --> P[Lock → Fetch → Update]

    style C fill:#87CEEB
    style H fill:#90EE90
    style I fill:#FFD700
    style N fill:#FFB6C1
```

## Monitoring Dashboard

```mermaid
graph LR
    A[intelligence_cache_status View] --> B[Cache Health Metrics]

    B --> C[Total Reports]
    B --> D[Fresh Count]
    B --> E[Stale Count]
    B --> F[Expired Count]

    B --> G[Hours Since Refresh]
    B --> H[Hours Until Expiry]
    B --> I[Refresh Duration]

    C --> J[Admin Dashboard]
    D --> J
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J

    J --> K[Alerts]
    K --> L[Cache Hit Ratio < 80%]
    K --> M[Refresh Duration > 10s]
    K --> N[Stale Count > 20%]

    style A fill:#87CEEB
    style J fill:#90EE90
    style K fill:#FF6B6B
```

## Schema Extension Timeline

```mermaid
timeline
    title Intelligence Reports Schema Evolution
    Migration 026 (Existing) : intelligence_reports table created
                               : Vector embeddings (1536 dim)
                               : Bilingual content support
                               : Approval workflow
    Migration 20250130 (New) : Entity linking (35 new columns)
                             : Intelligence type classification
                             : TTL-based cache management
                             : Data source tracking (JSONB)
                             : Versioning support
                             : AnythingLLM integration
                             : 15 new indexes
                             : 7 helper functions
                             : 1 monitoring view
    Future Enhancements : AI-powered summarization
                        : Multi-language embeddings
                        : Predictive cache refresh
                        : Advanced analytics
```

## Comparison: Before vs After

```mermaid
graph LR
    subgraph "BEFORE (Migration 026)"
        A1[intelligence_reports]
        A1 --> A2[Static content]
        A1 --> A3[No cache management]
        A1 --> A4[No entity linking]
        A1 --> A5[No refresh tracking]
    end

    subgraph "AFTER (Migration 20250130)"
        B1[intelligence_reports]
        B1 --> B2[Dynamic content with TTL]
        B1 --> B3[Automatic cache expiration]
        B1 --> B4[Link to any dossier type]
        B1 --> B5[Full refresh audit trail]
        B1 --> B6[AnythingLLM integration]
        B1 --> B7[Data source tracking]
        B1 --> B8[Version history]
    end

    A1 -.Migration.-> B1

    style A1 fill:#DDA0DD
    style B1 fill:#90EE90
    style B2 fill:#87CEEB
    style B3 fill:#87CEEB
    style B4 fill:#87CEEB
    style B5 fill:#87CEEB
    style B6 fill:#FFD700
    style B7 fill:#FFD700
    style B8 fill:#FFD700
```

## Index Coverage Map

```mermaid
graph TD
    A[Common Queries] --> B[Entity Lookup<br/>WHERE entity_id = ?]
    A --> C[Entity + Type<br/>WHERE entity_id = ? AND intelligence_type = ?]
    A --> D[Find Expired<br/>WHERE cache_expires_at < NOW()]
    A --> E[Find Stale<br/>WHERE refresh_status = 'stale']
    A --> F[Version History<br/>WHERE parent_version_id = ?]
    A --> G[Data Source Search<br/>WHERE data_sources_metadata @> {...}]

    B --> B1[✅ idx_intelligence_reports_entity]
    C --> C1[✅ idx_intelligence_reports_entity_type_fresh<br/>Composite: entity_id + intelligence_type + refresh_status + last_refreshed_at]
    D --> D1[✅ idx_intelligence_reports_cache_expires<br/>Partial: WHERE cache_expires_at IS NOT NULL]
    E --> E1[✅ idx_intelligence_reports_refresh_status]
    F --> F1[✅ idx_intelligence_reports_version<br/>Partial: WHERE parent_version_id IS NOT NULL]
    G --> G1[✅ idx_intelligence_reports_data_sources_metadata<br/>GIN index for JSONB queries]

    style B1 fill:#90EE90
    style C1 fill:#90EE90
    style D1 fill:#90EE90
    style E1 fill:#90EE90
    style F1 fill:#90EE90
    style G1 fill:#90EE90
```

---

## Diagram Legend

| Color | Meaning |
|-------|---------|
| 🟢 Green | Active/Current/Success |
| 🔵 Blue | New Features/Information |
| 🟡 Yellow | Warning/Attention |
| 🔴 Red | Error/Denied |
| 🟣 Purple | Legacy/Archived |

## How to Use These Diagrams

1. **Entity Relationship Diagram**: Understand table relationships and foreign keys
2. **Intelligence Type Classification**: See the five intelligence categories and their TTLs
3. **Cache Refresh State Machine**: Understand the refresh lifecycle
4. **Data Flow - Intelligence Refresh**: See the complete refresh workflow
5. **Query Performance - Index Usage**: Understand which indexes optimize which queries
6. **Version History Chain**: See how versioning works with parent_version_id
7. **RLS Security Flow**: Understand access control logic
8. **Data Source Metadata Structure**: See JSONB structure examples
9. **Intelligence Dashboard Architecture**: Understand frontend component hierarchy
10. **Monitoring Dashboard**: See monitoring and alerting architecture
11. **Schema Extension Timeline**: See evolution of intelligence_reports table
12. **Comparison: Before vs After**: See what's new in this migration
13. **Index Coverage Map**: Verify all common queries are optimized

---

**Last Updated**: 2025-01-30
**Version**: 1.0
**Format**: Mermaid Diagrams (render with Mermaid.js)
