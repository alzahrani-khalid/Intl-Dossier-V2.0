# Brief Content Schema

**Feature Branch**: `033-ai-brief-generation`

## Overview

The `ai_briefs.full_content` JSONB column stores the complete structured brief. This document defines the exact schema for implementation.

## Schema Definition (TypeScript)

```typescript
interface BriefContent {
  version: '1.0';
  generated_at: string; // ISO 8601 timestamp
  generation_params: GenerationParams;

  // Core sections
  executive_summary: ExecutiveSummary;
  background: BackgroundSection;
  participants: ParticipantSection;
  positions: PositionsSection;
  commitments: CommitmentsSection;
  historical_context: HistoricalSection;
  talking_points: TalkingPointsSection;
  recommendations: RecommendationsSection;

  // Metadata
  sources: SourceMetadata;
  warnings: Warning[];
}

interface GenerationParams {
  engagement_id: string;
  dossier_id?: string;
  custom_prompt?: string;
  model_used: string;
  provider: string;
  temperature: number;
}

interface ExecutiveSummary {
  content: string; // Main summary text (2-3 paragraphs)
  key_points: string[]; // 3-5 bullet points
  sentiment_indicators: {
    // Optional sentiment analysis
    overall: 'positive' | 'neutral' | 'negative' | 'mixed';
    notes?: string;
  };
}

interface BackgroundSection {
  country_context?: {
    name: string;
    dossier_id: string;
    summary: string;
    key_facts: KeyFact[];
    recent_developments: string[];
  };
  organization_context?: {
    name: string;
    dossier_id: string;
    summary: string;
    key_facts: KeyFact[];
  };
  relationship_summary: string; // How entities relate
}

interface KeyFact {
  label: string;
  value: string;
  source?: Citation;
}

interface ParticipantSection {
  participants: Participant[];
  seating_suggestions?: string; // Optional protocol notes
}

interface Participant {
  name: string;
  title?: string;
  organization?: string;
  role_in_meeting: 'host' | 'guest' | 'observer' | 'subject_matter_expert';
  dossier_id?: string;
  bio_summary?: string;
  talking_preferences?: string[]; // Topics they typically engage with
  cautions?: string[]; // Sensitive topics to avoid
}

interface PositionsSection {
  summary: string;
  positions: PositionDetail[];
  conflicts?: PositionConflict[];
}

interface PositionDetail {
  id: string;
  title: string;
  summary: string;
  relevance_explanation: string; // Why this position matters for the engagement
  status: 'active' | 'draft' | 'archived';
  last_updated: string;
  key_points: string[];
  source: Citation;
}

interface PositionConflict {
  position_a_id: string;
  position_b_id: string;
  conflict_description: string;
  recommendation: string; // How to handle in meeting
}

interface CommitmentsSection {
  summary: string;
  active_commitments: CommitmentDetail[];
  upcoming_deadlines: DeadlineItem[];
  completed_recently: CommitmentDetail[]; // Last 90 days
}

interface CommitmentDetail {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'at_risk' | 'completed' | 'overdue';
  due_date?: string;
  owner?: string;
  progress_summary?: string;
  talking_point?: string; // Suggested way to discuss
  source: Citation;
}

interface DeadlineItem {
  commitment_id: string;
  commitment_title: string;
  due_date: string;
  days_until_due: number;
  status: 'on_track' | 'at_risk' | 'overdue';
}

interface HistoricalSection {
  summary: string;
  engagement_history: EngagementHistoryItem[];
  relationship_timeline?: TimelineEvent[];
  patterns_observed?: string[]; // Recurring themes
}

interface EngagementHistoryItem {
  id: string;
  title: string;
  date: string;
  type: string;
  outcome_summary?: string;
  key_outcomes?: string[];
  relevance_to_upcoming: string;
  source: Citation;
}

interface TimelineEvent {
  date: string;
  event: string;
  significance: 'high' | 'medium' | 'low';
}

interface TalkingPointsSection {
  opening_remarks: string[];
  key_topics: TalkingPointTopic[];
  questions_to_ask: string[];
  closing_remarks?: string[];
}

interface TalkingPointTopic {
  topic: string;
  suggested_approach: string;
  supporting_points: string[];
  data_to_reference?: string;
  caution_notes?: string;
}

interface RecommendationsSection {
  strategic_recommendations: Recommendation[];
  preparation_checklist: ChecklistItem[];
  follow_up_actions?: string[];
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

interface ChecklistItem {
  item: string;
  category: 'document' | 'preparation' | 'coordination' | 'other';
  completed?: boolean;
}

interface Citation {
  entity_type: 'dossier' | 'position' | 'commitment' | 'engagement' | 'document';
  entity_id: string;
  entity_name: string;
  excerpt?: string;
  deep_link: string; // Relative URL path
}

interface SourceMetadata {
  dossiers_referenced: string[]; // IDs
  positions_referenced: string[];
  commitments_referenced: string[];
  engagements_referenced: string[];
  documents_referenced: string[];
  retrieval_stats: {
    total_chunks_retrieved: number;
    avg_relevance_score: number;
    retrieval_latency_ms: number;
  };
}

interface Warning {
  type: 'limited_data' | 'stale_data' | 'conflicting_positions' | 'incomplete_section';
  message: string;
  affected_section?: string;
  suggested_action?: string;
}
```

## JSON Example

```json
{
  "version": "1.0",
  "generated_at": "2025-12-05T14:30:00Z",
  "generation_params": {
    "engagement_id": "eng-uuid",
    "model_used": "gpt-4o",
    "provider": "openai",
    "temperature": 0.7
  },
  "executive_summary": {
    "content": "This brief prepares you for the bilateral meeting with Japanese trade delegation...",
    "key_points": [
      "3 active commitments require follow-up discussion",
      "Recent trade agreement positions show alignment on key issues",
      "Historical pattern shows preference for formal protocol"
    ],
    "sentiment_indicators": {
      "overall": "positive",
      "notes": "Recent engagements show constructive dialogue"
    }
  },
  "background": {
    "country_context": {
      "name": "Japan",
      "dossier_id": "dos-japan-uuid",
      "summary": "Japan is a key strategic partner...",
      "key_facts": [
        {"label": "Population", "value": "125.7 million"},
        {"label": "GDP", "value": "$4.2 trillion (2024)"}
      ],
      "recent_developments": [
        "New trade agreement ratified in Q3 2024",
        "Leadership change in Ministry of Economy"
      ]
    }
  },
  "participants": {
    "participants": [
      {
        "name": "Minister Tanaka",
        "title": "Minister of Trade",
        "role_in_meeting": "guest",
        "dossier_id": "per-tanaka-uuid",
        "bio_summary": "20+ years in trade policy...",
        "talking_preferences": ["Technology transfer", "Green economy"],
        "cautions": ["Avoid discussing historical disputes"]
      }
    ]
  },
  "positions": {
    "summary": "Three relevant positions align with agenda topics...",
    "positions": [
      {
        "id": "pos-uuid",
        "title": "Technology Export Controls",
        "summary": "Current stance supports...",
        "relevance_explanation": "Directly relates to agenda item 2",
        "status": "active",
        "last_updated": "2024-11-15",
        "key_points": ["Emphasis on security", "Mutual benefit"],
        "source": {
          "entity_type": "position",
          "entity_id": "pos-uuid",
          "entity_name": "Technology Export Controls",
          "deep_link": "/positions/pos-uuid"
        }
      }
    ],
    "conflicts": []
  },
  "commitments": {
    "summary": "3 active commitments, 1 approaching deadline...",
    "active_commitments": [...],
    "upcoming_deadlines": [
      {
        "commitment_id": "com-uuid",
        "commitment_title": "Q1 Review Meeting",
        "due_date": "2025-01-15",
        "days_until_due": 41,
        "status": "on_track"
      }
    ],
    "completed_recently": []
  },
  "historical_context": {
    "summary": "5 previous engagements in the past 2 years...",
    "engagement_history": [...],
    "patterns_observed": [
      "Preference for structured agendas",
      "Focus on long-term partnerships"
    ]
  },
  "talking_points": {
    "opening_remarks": [
      "Express appreciation for continued partnership",
      "Acknowledge recent trade agreement success"
    ],
    "key_topics": [...],
    "questions_to_ask": [
      "What are your priorities for Q1 2025?",
      "How can we support implementation of the new agreement?"
    ]
  },
  "recommendations": {
    "strategic_recommendations": [
      {
        "title": "Prioritize Commitment Follow-up",
        "description": "Begin with status update on pending commitments",
        "priority": "high",
        "rationale": "Shows accountability and builds trust"
      }
    ],
    "preparation_checklist": [
      {"item": "Review previous meeting minutes", "category": "preparation"},
      {"item": "Prepare trade statistics handout", "category": "document"}
    ]
  },
  "sources": {
    "dossiers_referenced": ["dos-japan-uuid", "dos-trade-uuid"],
    "positions_referenced": ["pos-uuid"],
    "commitments_referenced": ["com-uuid"],
    "engagements_referenced": ["eng-prev-1", "eng-prev-2"],
    "documents_referenced": [],
    "retrieval_stats": {
      "total_chunks_retrieved": 47,
      "avg_relevance_score": 0.82,
      "retrieval_latency_ms": 1234
    }
  },
  "warnings": []
}
```

## Section Generation Order

For streaming, sections are generated in this order:

1. `executive_summary` (most important - show first)
2. `background`
3. `participants`
4. `positions`
5. `commitments`
6. `historical_context`
7. `talking_points`
8. `recommendations`

## Validation Rules

| Field                                       | Rule                       |
| ------------------------------------------- | -------------------------- |
| `version`                                   | Must be "1.0"              |
| `executive_summary.content`                 | 200-2000 characters        |
| `executive_summary.key_points`              | 3-5 items                  |
| `participants`                              | At least 1 participant     |
| `talking_points.opening_remarks`            | 1-3 items                  |
| `recommendations.strategic_recommendations` | 1-5 items                  |
| All `source.deep_link`                      | Must be valid relative URL |
