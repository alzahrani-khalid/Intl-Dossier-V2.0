# Intelligence & Signals API

## Overview

The Intelligence & Signals API manages country intelligence signals, tracking key indicators such as political stability, economic conditions, security threats, and diplomatic posture. Supports real-time updates, batch processing, and historical trend analysis with bilingual content (English/Arabic).

## Endpoints

### Get Country Intelligence

Retrieve intelligence signals for a specific country dossier.

**Endpoint:** `GET /intelligence-get?dossier_id={id}`

**Query Parameters:**
- `dossier_id` (required): UUID of country dossier
- `include_historical` (optional): Include historical trends (default: `false`)
- `signal_types` (optional): Comma-separated signal types to filter
- `date_from` (optional): Filter signals from date (ISO 8601)
- `date_to` (optional): Filter signals to date (ISO 8601)

**Response (200 OK):**
```json
{
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "country_name": "United Kingdom",
  "country_code": "GB",
  "last_updated": "2024-01-15T10:30:00Z",
  "overall_risk_level": "medium",
  "signals": [
    {
      "signal_type": "political_stability",
      "value": 75,
      "trend": "stable",
      "trend_change": 0,
      "confidence": 0.92,
      "last_updated": "2024-01-15T10:00:00Z",
      "source": "Oxford Economics Political Risk Index",
      "notes_en": "Stable parliamentary democracy with strong institutions",
      "notes_ar": "ديمقراطية برلمانية مستقرة بمؤسسات قوية"
    },
    {
      "signal_type": "economic_health",
      "value": 68,
      "trend": "improving",
      "trend_change": 3,
      "confidence": 0.88,
      "last_updated": "2024-01-15T09:30:00Z",
      "source": "IMF Economic Outlook",
      "notes_en": "GDP growth 2.1%, inflation moderating",
      "notes_ar": "نمو الناتج المحلي 2.1%، تراجع التضخم"
    },
    {
      "signal_type": "security_threat",
      "value": 35,
      "trend": "stable",
      "trend_change": -2,
      "confidence": 0.85,
      "last_updated": "2024-01-15T08:00:00Z",
      "source": "Global Terrorism Database",
      "notes_en": "Low terrorism risk, robust security infrastructure",
      "notes_ar": "مخاطر إرهاب منخفضة، بنية أمنية قوية"
    },
    {
      "signal_type": "diplomatic_posture",
      "value": 82,
      "trend": "positive",
      "trend_change": 5,
      "confidence": 0.90,
      "last_updated": "2024-01-15T10:30:00Z",
      "source": "Ministry of Foreign Affairs Analysis",
      "notes_en": "Strong bilateral relations, active cooperation on climate and trade",
      "notes_ar": "علاقات ثنائية قوية، تعاون نشط في المناخ والتجارة"
    }
  ],
  "historical_trends": []
}
```

**Signal Types:**
- `political_stability`: Political risk and stability index (0-100)
- `economic_health`: Economic indicators and growth outlook (0-100)
- `security_threat`: Security and terrorism risk level (0-100, lower is better)
- `diplomatic_posture`: Bilateral relationship quality (0-100)
- `trade_relations`: Trade volume and investment trends (0-100)
- `human_rights`: Human rights index (0-100)
- `media_sentiment`: Media coverage sentiment analysis (0-100)

**Trend Values:**
- `improving`: Positive trend, value increasing
- `stable`: No significant change
- `declining`: Negative trend, value decreasing
- `positive`: Positive direction for bilateral relations
- `negative`: Negative direction for bilateral relations

**Error Responses:**
- `400 Bad Request` - Missing dossier_id parameter
- `401 Unauthorized` - Missing authorization
- `404 Not Found` - Dossier not found or not a country dossier

**Implementation Example:**
```typescript
const getCountryIntelligence = async (dossierId: string) => {
  const params = new URLSearchParams({
    dossier_id: dossierId,
    include_historical: 'true'
  });

  const response = await fetch(`/intelligence-get?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    throw new Error('Country dossier not found');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch intelligence signals');
  }

  const data = await response.json();

  // Calculate overall risk assessment
  const avgRisk = calculateRiskScore(data.signals);

  return {
    ...data,
    risk_assessment: avgRisk
  };
};

const calculateRiskScore = (signals: any[]) => {
  const weights = {
    political_stability: 0.30,
    economic_health: 0.25,
    security_threat: 0.25,
    diplomatic_posture: 0.20
  };

  let weightedSum = 0;
  let totalWeight = 0;

  signals.forEach(signal => {
    const weight = weights[signal.signal_type as keyof typeof weights];
    if (weight) {
      // Invert security_threat (lower is better)
      const value = signal.signal_type === 'security_threat'
        ? 100 - signal.value
        : signal.value;

      weightedSum += value * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
};
```

**Notes:**
- Signals updated at different frequencies based on source
- Historical trends available for past 12 months
- Confidence scores indicate data reliability (0.0-1.0)
- Sources include: IMF, World Bank, Oxford Economics, internal analysis

---

### List All Intelligence Signals

List intelligence signals across all country dossiers.

**Endpoint:** `GET /intelligence`

**Query Parameters:**
- `organization_id` (optional): Filter by organization
- `risk_level` (optional): Filter by overall risk level (`'low'`, `'medium'`, `'high'`, `'critical'`)
- `signal_type` (optional): Filter by specific signal type
- `trend` (optional): Filter by trend direction
- `updated_since` (optional): Filter signals updated since date (ISO 8601)
- `sort` (optional): Sort field (default: `'last_updated'`)
- `order` (optional): Sort order (`'asc'` or `'desc'`, default: `'desc'`)
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
      "country_name": "United Kingdom",
      "country_code": "GB",
      "overall_risk_level": "medium",
      "risk_score": 72,
      "last_updated": "2024-01-15T10:30:00Z",
      "signal_summary": {
        "political_stability": 75,
        "economic_health": 68,
        "security_threat": 35,
        "diplomatic_posture": 82
      },
      "alerts": [
        {
          "type": "trend_change",
          "signal_type": "diplomatic_posture",
          "message": "Diplomatic posture improved by 5 points",
          "severity": "info"
        }
      ]
    },
    {
      "dossier_id": "dossier-660e8400-e29b-41d4-a716-446655440001",
      "country_name": "France",
      "country_code": "FR",
      "overall_risk_level": "low",
      "risk_score": 85,
      "last_updated": "2024-01-15T09:45:00Z",
      "signal_summary": {
        "political_stability": 88,
        "economic_health": 79,
        "security_threat": 28,
        "diplomatic_posture": 90
      },
      "alerts": []
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0,
  "summary": {
    "low_risk": 12,
    "medium_risk": 25,
    "high_risk": 7,
    "critical_risk": 1
  }
}
```

**Implementation Example:**
```typescript
const listIntelligence = async (riskLevel?: string) => {
  const params = new URLSearchParams({
    ...(riskLevel && { risk_level: riskLevel }),
    sort: 'risk_score',
    order: 'desc',
    limit: '50'
  });

  const response = await fetch(`/intelligence?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  // Group by risk level
  const byRiskLevel = data.data.reduce((acc: any, item: any) => {
    const level = item.overall_risk_level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(item);
    return acc;
  }, {});

  return {
    ...data,
    grouped_by_risk: byRiskLevel
  };
};
```

---

### Refresh Intelligence Signals

Manually trigger refresh of intelligence signals for a country.

**Endpoint:** `POST /intelligence-refresh`

**Request Body:**
```json
{
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "signal_types": ["political_stability", "economic_health"],
  "force_update": false
}
```

**Parameters:**
- `dossier_id` (required): UUID of country dossier
- `signal_types` (optional): Array of signal types to refresh (omit for all)
- `force_update` (optional): Force refresh even if recently updated (default: `false`)

**Response (202 Accepted):**
```json
{
  "job_id": "refresh-550e8400-e29b-41d4-a716-446655440000",
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "signal_types": ["political_stability", "economic_health"],
  "estimated_completion": "2024-01-15T10:35:00Z",
  "queued_at": "2024-01-15T10:30:00Z"
}
```

**Response (200 OK - Cached):**
```json
{
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "status": "cached",
  "message": "Intelligence data updated recently, using cached version",
  "last_updated": "2024-01-15T10:00:00Z",
  "next_refresh_available": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid dossier_id or signal_types
- `401 Unauthorized` - Missing authorization
- `404 Not Found` - Dossier not found
- `429 Too Many Requests` - Refresh rate limit exceeded

**Implementation Example:**
```typescript
const refreshIntelligence = async (
  dossierId: string,
  signalTypes?: string[]
) => {
  const response = await fetch('/intelligence-refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dossier_id: dossierId,
      signal_types: signalTypes,
      force_update: false
    })
  });

  if (response.status === 429) {
    const error = await response.json();
    const retryAfter = response.headers.get('Retry-After');
    throw new Error(
      `Refresh rate limit exceeded. Retry after ${retryAfter}s`
    );
  }

  const result = await response.json();

  if (result.status === 'queued') {
    // Poll for completion
    return await pollRefreshStatus(result.job_id);
  }

  // Return cached data
  return await getCountryIntelligence(dossierId);
};

const pollRefreshStatus = async (jobId: string) => {
  const maxAttempts = 12; // 1 minute with 5s intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const response = await fetch(`/intelligence-refresh-status?job_id=${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const status = await response.json();

    if (status.status === 'completed') {
      return status.result;
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Refresh failed');
    }

    attempts++;
  }

  throw new Error('Refresh timeout');
};
```

**Refresh Frequency Limits:**
- Automatic refresh: Every 24 hours
- Manual refresh: Maximum once per hour per dossier
- Force refresh: Maximum 3 times per day (admin only)

---

### Refresh Intelligence V2 (Enhanced)

Enhanced intelligence refresh with external data source integration.

**Endpoint:** `POST /intelligence-refresh-v2`

**Request Body:**
```json
{
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "sources": ["imf", "world_bank", "oxford_economics", "internal"],
  "signal_types": ["economic_health", "political_stability"],
  "include_ai_analysis": true,
  "generate_summary": true
}
```

**Parameters:**
- `dossier_id` (required): UUID of country dossier
- `sources` (required): Array of data sources to query
- `signal_types` (optional): Array of signal types to refresh
- `include_ai_analysis` (optional): Generate AI-powered insights (default: `true`)
- `generate_summary` (optional): Generate executive summary (default: `true`)

**Response (202 Accepted):**
```json
{
  "job_id": "refresh-v2-550e8400-e29b-41d4-a716-446655440000",
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "sources_queued": 4,
  "estimated_completion": "2024-01-15T10:35:00Z"
}
```

**Response (200 OK - Completed):**
```json
{
  "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "signals_updated": 4,
  "sources_processed": 4,
  "ai_insights": {
    "key_findings": [
      "Economic growth accelerating, driven by services sector",
      "Political stability remains high despite minor regional tensions",
      "Bilateral trade relations strengthening with 12% YoY increase"
    ],
    "risk_assessment": "Overall risk level remains MEDIUM with positive outlook",
    "recommendations": [
      "Consider expanding trade cooperation in renewable energy",
      "Monitor regional political developments in Scotland",
      "Leverage strong diplomatic posture for climate partnerships"
    ]
  },
  "executive_summary_en": "The United Kingdom maintains a stable political and economic environment...",
  "executive_summary_ar": "تحافظ المملكة المتحدة على بيئة سياسية واقتصادية مستقرة...",
  "refreshed_at": "2024-01-15T10:34:00Z",
  "next_refresh_available": "2024-01-15T11:34:00Z"
}
```

**Supported Data Sources:**
- `imf`: International Monetary Fund data
- `world_bank`: World Bank development indicators
- `oxford_economics`: Oxford Economics Political Risk Index
- `global_terrorism_db`: Global Terrorism Database
- `internal`: Ministry analysis and assessments
- `news_sentiment`: Media sentiment analysis

**Error Responses:**
- `400 Bad Request` - Invalid sources or dossier_id
- `401 Unauthorized` - Missing authorization
- `404 Not Found` - Dossier not found
- `503 Service Unavailable` - External data source unavailable

**Implementation Example:**
```typescript
const refreshIntelligenceV2 = async (dossierId: string) => {
  const response = await fetch('/intelligence-refresh-v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dossier_id: dossierId,
      sources: ['imf', 'world_bank', 'oxford_economics', 'internal'],
      include_ai_analysis: true,
      generate_summary: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Refresh failed');
  }

  const result = await response.json();

  // Display AI insights
  if (result.ai_insights) {
    console.log('Key Findings:');
    result.ai_insights.key_findings.forEach((finding: string) => {
      console.log(`- ${finding}`);
    });

    console.log('\nRecommendations:');
    result.ai_insights.recommendations.forEach((rec: string) => {
      console.log(`- ${rec}`);
    });
  }

  return result;
};
```

---

### Batch Update Intelligence

Update intelligence signals for multiple countries in a single batch.

**Endpoint:** `POST /intelligence-batch-update`

**Request Body:**
```json
{
  "dossier_ids": [
    "dossier-550e8400-e29b-41d4-a716-446655440000",
    "dossier-660e8400-e29b-41d4-a716-446655440001",
    "dossier-770e8400-e29b-41d4-a716-446655440002"
  ],
  "signal_types": ["political_stability", "economic_health"],
  "sources": ["imf", "world_bank"],
  "priority": "normal"
}
```

**Parameters:**
- `dossier_ids` (required): Array of country dossier UUIDs (max 50)
- `signal_types` (optional): Array of signal types to update
- `sources` (optional): Array of data sources to use
- `priority` (optional): Batch priority (`'low'`, `'normal'`, `'high'`, default: `'normal'`)

**Response (202 Accepted):**
```json
{
  "batch_id": "batch-550e8400-e29b-41d4-a716-446655440000",
  "dossiers_count": 3,
  "status": "queued",
  "estimated_completion": "2024-01-15T10:45:00Z",
  "queued_at": "2024-01-15T10:30:00Z"
}
```

**Batch Status Check:** `GET /intelligence-batch-update?batch_id={id}`

**Response (200 OK):**
```json
{
  "batch_id": "batch-550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": {
    "total": 3,
    "completed": 1,
    "failed": 0,
    "pending": 2
  },
  "results": [
    {
      "dossier_id": "dossier-550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "signals_updated": 2,
      "updated_at": "2024-01-15T10:32:00Z"
    },
    {
      "dossier_id": "dossier-660e8400-e29b-41d4-a716-446655440001",
      "status": "processing",
      "progress": 45
    },
    {
      "dossier_id": "dossier-770e8400-e29b-41d4-a716-446655440002",
      "status": "pending"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid dossier_ids or exceeds limit
- `401 Unauthorized` - Missing authorization
- `429 Too Many Requests` - Too many concurrent batch jobs

**Implementation Example:**
```typescript
const batchUpdateIntelligence = async (dossierIds: string[]) => {
  // Start batch update
  const response = await fetch('/intelligence-batch-update', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dossier_ids: dossierIds,
      signal_types: ['political_stability', 'economic_health'],
      sources: ['imf', 'world_bank'],
      priority: 'normal'
    })
  });

  const batch = await response.json();

  // Poll for completion
  return await pollBatchStatus(batch.batch_id);
};

const pollBatchStatus = async (batchId: string) => {
  const maxAttempts = 60; // 5 minutes with 5s intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const response = await fetch(
      `/intelligence-batch-update?batch_id=${batchId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const status = await response.json();

    // Update progress UI
    const progress = (status.progress.completed / status.progress.total) * 100;
    console.log(`Batch progress: ${progress.toFixed(0)}%`);

    if (status.status === 'completed') {
      return status.results;
    }

    if (status.status === 'failed') {
      throw new Error('Batch update failed');
    }

    attempts++;
  }

  throw new Error('Batch update timeout');
};
```

**Batch Processing:**
- Batches processed asynchronously in background
- Priority queuing: `high` > `normal` > `low`
- Maximum 50 dossiers per batch
- Maximum 5 concurrent batches per organization
- Failed dossiers retried up to 3 times

---

## Common Features

### Authentication

All intelligence endpoints require JWT authentication:

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Access Control

Intelligence data access controlled by:
- User role and permissions
- Dossier-level Row-Level Security (RLS)
- Organization membership

### Bilingual Support

All intelligence content available in English and Arabic:
- Signal notes and descriptions
- AI-generated insights
- Executive summaries

### Caching

Intelligence data cached for performance:
- Signal data: 1 hour cache TTL
- AI insights: 24 hours cache TTL
- Batch results: 7 days retention

### Rate Limiting

Rate limits per organization:
- Manual refresh: 60 requests/hour
- Batch updates: 10 batches/hour
- V2 refresh (AI-powered): 20 requests/hour

### Error Handling

Standard error response format:

```json
{
  "error": "Error message",
  "error_ar": "رسالة الخطأ",
  "details": {
    "field": "context"
  }
}
```

---

## Related APIs

- [Dossiers API](./dossiers.md) - Country dossier management
- [AI Services API](./ai-services.md) - AI-powered insights
- [Search API](./search.md) - Intelligence search and discovery
- [Workflow API](./workflow.md) - Automated intelligence refresh
