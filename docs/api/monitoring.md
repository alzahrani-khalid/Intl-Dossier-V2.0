# Monitoring & Alerts API

## Overview

Monitoring endpoints provide system health checks, alert configuration, and anomaly detection capabilities.

## Alert Management

### List Alert Configurations

**Endpoint:** `GET /monitoring/alerts`

**Query Parameters:**
- `severity` (optional): Filter by severity level (low, medium, high, critical)
- `is_active` (optional): Filter by active status (true/false)

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "High CPU Usage",
    "name_ar": "استخدام عالي للمعالج",
    "condition": "cpu_usage > threshold",
    "threshold": 70,
    "duration": "5m",
    "severity": "high",
    "channels": ["email", "webhook"],
    "is_active": true,
    "metadata": {
      "escalation_policy": "on-call"
    }
  }
]
```

### Create Alert Configuration

**Endpoint:** `POST /monitoring/alerts`

**Request Body:**
```json
{
  "name": "Database Connection Pool Exhausted",
  "name_ar": "نفاد مجموعة اتصالات قاعدة البيانات",
  "condition": "pg_connections_active / pg_connections_max",
  "threshold": 0.9,
  "duration": "2m",
  "severity": "critical",
  "channels": ["email", "sms", "webhook"]
}
```

**Response (201 Created):**
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "name": "Database Connection Pool Exhausted",
  "name_ar": "نفاد مجموعة اتصالات قاعدة البيانات",
  "condition": "pg_connections_active / pg_connections_max",
  "threshold": 0.9,
  "duration": "2m",
  "severity": "critical",
  "channels": ["email", "sms", "webhook"],
  "is_active": true,
  "metadata": {}
}
```

### Update Alert Configuration

**Endpoint:** `PATCH /monitoring/alerts/{id}`

**Request Body:**
```json
{
  "threshold": 0.85,
  "channels": ["email", "webhook", "slack"],
  "is_active": false
}
```

### Acknowledge Alert

**Endpoint:** `POST /monitoring/alerts/{id}/acknowledge`

**Response (200 OK):**
```json
{
  "acknowledged": true,
  "acknowledged_by": "550e8400-e29b-41d4-a716-446655440000",
  "acknowledged_at": "2024-01-15T10:30:00Z"
}
```

## Anomaly Detection

### List Detected Anomalies

**Endpoint:** `GET /monitoring/anomalies`

**Query Parameters:**
- `entity_type`: Filter by entity type (user, system, api)
- `min_score`: Minimum anomaly score (0-1)
- `unreviewed_only`: Show only unreviewed anomalies
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)

**Response (200 OK):**
```json
[
  {
    "id": "750e8400-e29b-41d4-a716-446655440000",
    "detection_type": "isolation_forest",
    "entity_type": "user",
    "entity_id": "user_123",
    "anomaly_score": 0.87,
    "sensitivity_level": "medium",
    "features": {
      "login_frequency": 45,
      "data_volume_gb": 12.5,
      "unique_ips": 8,
      "off_hours_access": true
    },
    "classification": null,
    "false_positive": false,
    "detected_at": "2024-01-15T09:45:00Z",
    "reviewed_at": null
  }
]
```

### Review Anomaly

**Endpoint:** `POST /monitoring/anomalies/{id}/review`

**Request Body:**
```json
{
  "classification": "suspicious",
  "false_positive": false
}
```

**Classification Options:**
- `legitimate` - Normal behavior
- `suspicious` - Requires investigation
- `malicious` - Confirmed threat

## Health Monitoring

### Get Service Health

**Endpoint:** `GET /monitoring/health`

**Response (200 OK - Healthy):**
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 5.2,
      "last_check": "2024-01-15T10:30:00Z"
    },
    "cache": {
      "status": "healthy",
      "latency_ms": 0.8,
      "last_check": "2024-01-15T10:30:00Z"
    },
    "storage": {
      "status": "healthy",
      "latency_ms": 15.3,
      "last_check": "2024-01-15T10:30:00Z"
    },
    "auth": {
      "status": "healthy",
      "latency_ms": 12.1,
      "last_check": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Response (503 Service Unavailable - Degraded):**
```json
{
  "status": "degraded",
  "services": {
    "database": {
      "status": "healthy",
      "latency_ms": 5.2,
      "last_check": "2024-01-15T10:30:00Z"
    },
    "cache": {
      "status": "unhealthy",
      "latency_ms": null,
      "last_check": "2024-01-15T10:30:00Z",
      "error": "Connection timeout"
    }
  }
}
```

## Implementation Examples

### Setting Up Alerts

```typescript
// Create CPU alert
const createCPUAlert = async () => {
  const alert = {
    name: "High CPU Usage",
    name_ar: "استخدام عالي للمعالج",
    condition: "rate(process_cpu_seconds_total[5m])",
    threshold: 0.7,
    duration: "5m",
    severity: "warning",
    channels: ["email"]
  };
  
  const response = await fetch('/monitoring/alerts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(alert)
  });
  
  return response.json();
};

// Monitor alert status
const monitorAlerts = async () => {
  const response = await fetch('/monitoring/alerts?is_active=true', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const alerts = await response.json();
  
  // Check for critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  if (criticalAlerts.length > 0) {
    await notifyOncall(criticalAlerts);
  }
};
```

### Anomaly Detection Integration

```typescript
// Check for anomalies
const checkAnomalies = async () => {
  const response = await fetch('/monitoring/anomalies?min_score=0.8&unreviewed_only=true', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const anomalies = await response.json();
  
  for (const anomaly of anomalies) {
    if (anomaly.anomaly_score > 0.9) {
      // Auto-classify high-score anomalies
      await reviewAnomaly(anomaly.id, 'suspicious', false);
      await triggerSecurityAlert(anomaly);
    }
  }
};

// Review anomaly
const reviewAnomaly = async (id: string, classification: string, falsePositive: boolean) => {
  await fetch(`/monitoring/anomalies/${id}/review`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      classification,
      false_positive: falsePositive
    })
  });
};
```

### Health Check Implementation

```typescript
// Health check with retry
const checkHealth = async (maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch('/monitoring/health', {
        timeout: 5000
      });
      
      const health = await response.json();
      
      if (health.status === 'unhealthy') {
        // Trigger failover or recovery procedures
        await initiateFailover(health.services);
      } else if (health.status === 'degraded') {
        // Alert but continue operation
        await alertDegradedService(health.services);
      }
      
      return health;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw new Error('Health check failed after retries');
      }
      await sleep(1000 * retries); // Exponential backoff
    }
  }
};
```

## Alert Configuration Best Practices

### Threshold Guidelines

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU Usage | 70% | 85% |
| Memory Usage | 75% | 90% |
| Disk Usage | 80% | 95% |
| Response Time P95 | 2s | 5s |
| Error Rate | 1% | 5% |
| Connection Pool | 70% | 90% |

### Alert Fatigue Prevention

1. **Progressive Thresholds**
   - Start with conservative thresholds
   - Adjust based on baseline metrics
   - Use duration to prevent flapping

2. **Alert Grouping**
   - Group related alerts
   - Implement parent-child relationships
   - Suppress downstream alerts

3. **Time-based Rules**
   - Different thresholds for business hours
   - Maintenance window awareness
   - Seasonal adjustment

## Webhook Integration

### Webhook Payload Format

```json
{
  "alert": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "High Memory Usage",
    "severity": "critical",
    "triggered_at": "2024-01-15T10:30:00Z",
    "value": 92.5,
    "threshold": 90,
    "message": "Memory usage is 92.5%, exceeding threshold of 90%",
    "message_ar": "استخدام الذاكرة 92.5٪، يتجاوز الحد الأقصى 90٪"
  },
  "instance": {
    "service": "api-server",
    "host": "prod-api-01",
    "environment": "production"
  },
  "links": {
    "dashboard": "https://monitoring.gastat.sa/d/memory",
    "runbook": "https://docs.gastat.sa/runbooks/high-memory"
  }
}
```

### Webhook Security

```typescript
// Verify webhook signature
const verifyWebhook = (payload: string, signature: string, secret: string) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

## Monitoring Metrics Reference

### System Metrics

- `cpu_usage` - CPU utilization percentage
- `memory_usage` - Memory utilization percentage
- `disk_usage` - Disk utilization percentage
- `network_in` - Network ingress bytes/sec
- `network_out` - Network egress bytes/sec

### Application Metrics

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `http_requests_failed` - Failed requests count
- `active_connections` - Current connection count
- `queue_size` - Background job queue size

### Database Metrics

- `pg_connections_active` - Active connections
- `pg_connections_max` - Maximum connections
- `pg_query_duration` - Query execution time
- `pg_locks_count` - Lock count
- `pg_replication_lag` - Replication delay

### Business Metrics

- `auth_login_attempts` - Login attempt count
- `auth_mfa_verifications` - MFA verification count
- `export_queue_size` - Pending exports
- `anomaly_detections` - Detected anomalies
- `api_rate_limit_exceeded` - Rate limit violations

---

*For monitoring support, contact: monitoring@gastat.gov.sa*