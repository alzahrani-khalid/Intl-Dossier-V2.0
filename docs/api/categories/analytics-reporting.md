# Analytics & Reporting API

## Overview

The Analytics & Reporting API provides dashboards, custom reports, scheduled report processing, and organizational benchmarks. All endpoints support data export in multiple formats and enforce role-based access control.

## Endpoints

### Analytics Dashboard

Get comprehensive analytics dashboard data.

**Endpoint:** `GET /analytics-dashboard?period={period}&department_id={id}`

**Query Parameters:**
- `period` (optional): Time period (`7d`, `30d`, `90d`, `1y`, default: `30d`)
- `department_id` (optional): Filter by department
- `user_id` (optional): Filter by user (requires manager role)

**Response (200 OK):**
```json
{
  "period": "30d",
  "summary": {
    "total_positions": 245,
    "positions_published": 89,
    "total_assignments": 456,
    "assignments_completed": 321,
    "intake_tickets": 189,
    "tickets_resolved": 142,
    "average_resolution_time_hours": 48.5
  },
  "trends": {
    "positions_created": [
      { "date": "2024-01-01", "count": 12 },
      { "date": "2024-01-02", "count": 15 }
    ],
    "assignments_completed": [
      { "date": "2024-01-01", "count": 8 },
      { "date": "2024-01-02", "count": 11 }
    ]
  },
  "top_performers": [
    {
      "user_id": "user-uuid",
      "user_name": "John Doe",
      "completed_assignments": 45,
      "average_completion_time_hours": 12.3
    }
  ],
  "bottlenecks": [
    {
      "stage": "approval_pending",
      "count": 23,
      "average_wait_time_hours": 72.5
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid period or department_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to view analytics
- `500 Internal Server Error` - Analytics generation failed

**Implementation Example:**
```typescript
const getAnalyticsDashboard = async (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
  const response = await fetch(`/analytics-dashboard?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

---

### Custom Reports

Create and run custom reports.

**Endpoint:** `POST /custom-reports`

**Request Body:**
```json
{
  "report_name": "Monthly Position Summary",
  "report_type": "positions",
  "filters": {
    "status": ["published"],
    "thematic_category": ["economy", "environment"],
    "date_from": "2024-01-01",
    "date_to": "2024-01-31"
  },
  "columns": [
    "title_en",
    "title_ar",
    "thematic_category",
    "status",
    "created_at",
    "author_name"
  ],
  "format": "xlsx",
  "schedule": null
}
```

**Response (200 OK):**
```json
{
  "report_id": "report-uuid",
  "report_name": "Monthly Position Summary",
  "status": "generating",
  "estimated_completion": "2024-01-15T10:35:00Z",
  "download_url": null
}
```

**Status Check (GET /custom-reports?report_id={id}):**
```json
{
  "report_id": "report-uuid",
  "status": "completed",
  "rows_count": 245,
  "file_size_bytes": 524288,
  "download_url": "https://storage.supabase.co/reports/report-uuid.xlsx",
  "expires_at": "2024-01-22T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid filters or columns
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to run reports
- `500 Internal Server Error` - Report generation failed

**Supported Formats:**
- `csv` - Comma-separated values
- `xlsx` - Excel spreadsheet
- `json` - JSON array
- `pdf` - PDF document (summary reports only)

---

### Scheduled Report Processor

Process and send scheduled reports (cron job endpoint).

**Endpoint:** `POST /scheduled-report-processor`

**Request Body:**
```json
{
  "execution_time": "2024-01-15T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "processed": true,
  "reports_generated": 12,
  "reports_sent": 12,
  "failed": 0,
  "execution_time_ms": 4523
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid service role key
- `500 Internal Server Error` - Processing failed

**Notes:**
- Called by cron job (scheduled via Supabase)
- Requires service role authentication
- Generates and emails scheduled reports
- Typical schedule: daily at midnight UTC

---

### Escalations Report

Generate escalations report for management oversight.

**Endpoint:** `GET /escalations-report?period={period}`

**Query Parameters:**
- `period` (optional): Time period (default: `30d`)
- `department_id` (optional): Filter by department
- `severity` (optional): Filter by severity (`low`, `medium`, `high`, `critical`)

**Response (200 OK):**
```json
{
  "period": "30d",
  "summary": {
    "total_escalations": 45,
    "by_severity": {
      "critical": 5,
      "high": 12,
      "medium": 18,
      "low": 10
    },
    "by_category": {
      "sla_breach": 15,
      "approval_delay": 12,
      "resource_conflict": 8,
      "other": 10
    }
  },
  "escalations": [
    {
      "escalation_id": "esc-uuid",
      "type": "assignment",
      "entity_id": "assignment-uuid",
      "severity": "high",
      "reason": "SLA breach - 72 hours overdue",
      "reason_ar": "خرق اتفاقية مستوى الخدمة - تأخر 72 ساعة",
      "escalated_at": "2024-01-12T10:30:00Z",
      "resolved": false,
      "assigned_to": "manager-uuid"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (requires manager or admin role)
- `500 Internal Server Error` - Report generation failed

---

### Reports

List all generated reports for current user.

**Endpoint:** `GET /reports?type={type}&status={status}`

**Query Parameters:**
- `type` (optional): Report type filter (`positions`, `assignments`, `intake`, `escalations`)
- `status` (optional): Status filter (`generating`, `completed`, `failed`)
- `limit` (optional): Page size (default: 20)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "reports": [
    {
      "report_id": "report-uuid",
      "report_name": "Monthly Position Summary",
      "report_type": "positions",
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:32:00Z",
      "download_url": "https://storage.supabase.co/reports/report-uuid.xlsx",
      "expires_at": "2024-01-22T10:30:00Z",
      "file_size_bytes": 524288,
      "rows_count": 245
    }
  ],
  "total": 18,
  "limit": 20,
  "offset": 0
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Query failed

---

### Organization Benchmarks

Get organizational performance benchmarks.

**Endpoint:** `GET /organization-benchmarks?metric={metric}`

**Query Parameters:**
- `metric` (optional): Specific metric (`all`, `efficiency`, `quality`, `speed`)

**Response (200 OK):**
```json
{
  "organization_id": "org-uuid",
  "period": "90d",
  "benchmarks": {
    "efficiency": {
      "assignments_completion_rate": 87.5,
      "average_completion_time_hours": 18.2,
      "rework_rate": 5.3,
      "percentile_rank": 85
    },
    "quality": {
      "position_consistency_score": 82.4,
      "average_review_cycles": 1.8,
      "approval_rate": 91.2,
      "percentile_rank": 78
    },
    "speed": {
      "average_position_creation_hours": 6.5,
      "average_approval_time_hours": 24.3,
      "sla_compliance_rate": 94.1,
      "percentile_rank": 92
    }
  },
  "industry_comparison": {
    "efficiency": "above_average",
    "quality": "average",
    "speed": "excellent"
  },
  "recommendations": [
    {
      "category": "quality",
      "recommendation_en": "Implement peer review process to improve consistency scores",
      "recommendation_ar": "تنفيذ عملية مراجعة الأقران لتحسين درجات الاتساق",
      "priority": "medium"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (requires manager or admin role)
- `500 Internal Server Error` - Benchmark calculation failed

**Notes:**
- Benchmarks updated weekly
- Industry comparison based on anonymized peer data
- Percentile rank: 0-100 (higher is better)

---

## Report Scheduling

Schedule reports via the `custom-reports` endpoint with `schedule` parameter:

```json
{
  "report_name": "Weekly Positions Summary",
  "schedule": {
    "frequency": "weekly",
    "day_of_week": "monday",
    "time": "08:00:00",
    "timezone": "Asia/Riyadh",
    "recipients": ["manager@example.com", "director@example.com"]
  }
}
```

## Export Formats

| Format | Use Case | Max Rows |
|--------|----------|----------|
| CSV | Data import, Excel pivot tables | 1,000,000 |
| XLSX | Formatted reports, charts | 100,000 |
| JSON | API integration, data processing | 10,000 |
| PDF | Executive summaries, presentations | 1,000 |

## Related APIs

- [Positions](./positions.md) - Position analytics data source
- [Assignments](./assignments.md) - Assignment completion metrics
- [Intake](./intake.md) - Ticket resolution metrics
- [Administration](./administration.md) - Audit logs for compliance reports
