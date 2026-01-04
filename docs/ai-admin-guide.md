# AI Administration Guide

Feature: 033-AI Brief Generation & Intelligence Layer

## Overview

This guide covers the administration and configuration of AI features in the GASTAT International Dossier System.

## AI Features

### 1. Brief Generation

- **Purpose**: Generate AI-powered briefing documents for dossiers
- **Use Cases**: Meeting preparation, situation reports, background briefs
- **Endpoint**: `POST /api/ai/briefs/generate`

### 2. AI Chat

- **Purpose**: Natural language Q&A interface for querying system data
- **Use Cases**: Quick lookups, relationship queries, commitment tracking
- **Endpoint**: `POST /api/ai/chat` (SSE streaming)

### 3. Entity Linking

- **Purpose**: AI-suggested links between intake tickets and entities
- **Use Cases**: Automated ticket routing, dossier association
- **Endpoint**: `POST /api/ai/intake/:ticketId/propose-links`

## Configuration

### Accessing AI Settings

1. Navigate to **Admin** → **AI Settings** (`/admin/ai-settings`)
2. Requires admin role

### Feature Toggles

Enable or disable individual AI features:

| Feature          | Description                     | Default |
| ---------------- | ------------------------------- | ------- |
| Brief Generation | AI-generated briefing documents | Enabled |
| AI Chat          | Natural language Q&A interface  | Enabled |
| Entity Linking   | AI-suggested entity links       | Enabled |

### Model Configuration

#### Default Provider

Select the primary LLM provider:

- **Anthropic** (Claude) - Recommended for accuracy
- **OpenAI** (GPT-4) - Alternative option
- **Google** (Gemini) - Cost-effective option

#### Fallback Provider

Configure a backup provider for failover scenarios.

### Rate Limits

| Setting                 | Description                      | Default |
| ----------------------- | -------------------------------- | ------- |
| Max Tokens per Request  | Maximum tokens in single request | 8,192   |
| Max Requests per Minute | Per-user burst limit             | 10      |
| Max Requests per Day    | Per-user daily limit             | 500     |

### Spending Limits

Set a monthly spend cap (USD) to control costs. When reached:

- All AI features are temporarily disabled
- Users see "AI usage limit reached" message
- Resets at start of next billing cycle

## Monitoring

### AI Usage Dashboard

Access at **Admin** → **AI Usage** (`/admin/ai-usage`)

#### Metrics Available

- **Total Runs**: Number of AI requests
- **Total Tokens**: Input + output tokens consumed
- **Total Cost**: Estimated cost in USD
- **Success Rate**: Percentage of successful completions

#### Views

- **Overview**: Usage by feature, cost by provider, daily trends
- **Top Users**: Users ranked by AI usage/cost
- **Breakdown**: Performance metrics, cost analysis

#### Date Ranges

- Last 7 days
- Last 30 days (default)
- Last 90 days

## Database Tables

### ai_runs

Stores all AI operation records for observability.

| Column          | Type    | Description                            |
| --------------- | ------- | -------------------------------------- |
| id              | UUID    | Primary key                            |
| organization_id | UUID    | Organization                           |
| user_id         | UUID    | Requesting user                        |
| run_type        | ENUM    | brief_generation, chat, entity_linking |
| status          | ENUM    | pending, running, completed, failed    |
| total_tokens    | INTEGER | Tokens consumed                        |
| total_cost      | DECIMAL | Estimated cost                         |
| latency_ms      | INTEGER | Response time                          |

### organization_llm_policies

Per-organization AI configuration.

| Column                  | Type    | Description      |
| ----------------------- | ------- | ---------------- |
| default_provider        | VARCHAR | Primary provider |
| default_model           | VARCHAR | Primary model    |
| fallback_provider       | VARCHAR | Backup provider  |
| max_requests_per_minute | INTEGER | Rate limit       |
| monthly_spend_cap       | DECIMAL | Budget cap       |
| features_enabled        | JSONB   | Feature flags    |

## Security Considerations

### Data Classification

- **Internal**: Can use cloud providers
- **Confidential**: Requires policy approval for cloud
- **Secret**: Must use on-premises LLM only

### Content Filtering

All AI inputs/outputs are logged for audit purposes.

### API Authentication

All AI endpoints require valid JWT authentication.

## Troubleshooting

### Common Issues

#### "Rate limit exceeded"

- User has exceeded per-minute or per-day limits
- Wait and retry, or increase limits in settings

#### "AI usage limit reached"

- Organization monthly spend cap reached
- Contact admin to increase cap or wait for reset

#### "AI service unavailable"

- Provider experiencing issues
- System will attempt fallback provider automatically

#### "Feature disabled"

- AI feature is turned off for organization
- Enable in AI Settings

### Logs

Check AI operation logs:

```sql
SELECT * FROM ai_runs
WHERE organization_id = 'your-org-id'
ORDER BY created_at DESC
LIMIT 100;
```

## API Reference

### Generate Brief

```
POST /api/ai/briefs/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "dossierId": "uuid",
  "briefType": "meeting_prep",
  "language": "en",
  "contextOverride": {
    "meetingDate": "2024-12-15",
    "meetingPurpose": "Trade discussions"
  }
}
```

### Chat (SSE)

```
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What commitments do we have with Japan?",
  "sessionId": "optional-session-uuid"
}
```

### Propose Entity Links

```
POST /api/ai/intake/:ticketId/propose-links
Authorization: Bearer <token>
Content-Type: application/json

{
  "language": "en"
}
```

## Support

For technical issues, contact the development team or refer to the API documentation.
