# Monitoring Setup Guide

## Overview

This guide provides comprehensive instructions for setting up and configuring the monitoring infrastructure for the GASTAT International Dossier System. The monitoring stack includes Prometheus for metrics collection, Grafana for visualization, and AlertManager for alert routing.

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Application │────▶│  Prometheus  │────▶│   Grafana   │
│   Metrics   │     │   (Metrics)  │     │ (Dashboard) │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐     ┌─────────────┐
                    │ AlertManager │────▶│   Alerts    │
                    │   (Routing)  │     │  (Email,    │
                    └──────────────┘     │   Webhook)  │
                                         └─────────────┘
```

## Prerequisites

- Docker and Docker Compose v2.0+
- 4GB RAM minimum for monitoring stack
- 20GB disk space for metric retention
- Network access between containers

## Installation

### 1. Deploy Monitoring Stack

```bash
# Navigate to project root
cd /path/to/intl-dossier

# Deploy monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps

# Expected output:
# NAME                    STATUS    PORTS
# prometheus              running   0.0.0.0:9090->9090
# grafana                 running   0.0.0.0:3000->3000
# alertmanager            running   0.0.0.0:9093->9093
# node-exporter           running   0.0.0.0:9100->9100
# postgres-exporter       running   0.0.0.0:9187->9187
```

### 2. Initial Configuration

#### Prometheus Configuration
Location: `monitoring/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'gastat-dossier'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - '/etc/prometheus/alerts/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          instance: 'host'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          instance: 'database'

  - job_name: 'application'
    static_configs:
      - targets: ['backend:8080']
        labels:
          instance: 'api'
    metrics_path: '/metrics'
```

#### Grafana Configuration
Location: `monitoring/grafana/grafana.ini`

```ini
[server]
http_port = 3000
domain = monitoring.gastat.local
root_url = https://monitoring.gastat.local

[security]
admin_user = admin
admin_password = ${GF_SECURITY_ADMIN_PASSWORD}
disable_gravatar = true
cookie_secure = true
cookie_samesite = strict

[auth]
disable_login_form = false
oauth_auto_login = false

[users]
default_theme = dark
default_language = en-US

[alerting]
enabled = true
execute_alerts = true
```

#### AlertManager Configuration
Location: `monitoring/alertmanager/alertmanager.yml`

```yaml
global:
  smtp_from: 'alerts@gastat.gov.sa'
  smtp_smarthost: 'smtp.gastat.local:587'
  smtp_auth_username: 'alerts@gastat.gov.sa'
  smtp_auth_password: '${SMTP_PASSWORD}'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default-receiver'
  
  routes:
    - match:
        severity: critical
      receiver: 'critical-receiver'
      continue: true
    
    - match:
        severity: warning
      receiver: 'warning-receiver'
      repeat_interval: 24h

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'ops-team@gastat.gov.sa'
        headers:
          Subject: '[{{ .GroupLabels.severity | toUpper }}] {{ .GroupLabels.alertname }}'

  - name: 'critical-receiver'
    email_configs:
      - to: 'oncall@gastat.gov.sa'
        send_resolved: true
    webhook_configs:
      - url: 'https://hooks.slack.com/services/XXX/YYY/ZZZ'
        send_resolved: true

  - name: 'warning-receiver'
    email_configs:
      - to: 'ops-team@gastat.gov.sa'
        send_resolved: false
```

## Alert Rules Configuration

### Security Alerts
Location: `monitoring/prometheus/alerts/security.yml`

```yaml
groups:
  - name: security
    interval: 30s
    rules:
      - alert: HighFailedLoginRate
        expr: rate(auth_login_failed_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
          category: security
        annotations:
          summary: "High rate of failed login attempts"
          summary_ar: "معدل مرتفع من محاولات تسجيل الدخول الفاشلة"
          description: "Failed login rate is {{ $value | printf \"%.2f\" }} per second"
          
      - alert: MFAEnrollmentLow
        expr: (sum(auth_mfa_enrolled_users) / sum(auth_total_users)) < 0.8
        for: 1h
        labels:
          severity: warning
          category: security
        annotations:
          summary: "MFA enrollment below 80%"
          summary_ar: "التسجيل في المصادقة الثنائية أقل من 80%"
          description: "Only {{ $value | humanizePercentage }} of users have MFA enabled"
      
      - alert: AnomalyDetected
        expr: anomaly_score > 0.85
        for: 1m
        labels:
          severity: high
          category: security
        annotations:
          summary: "Anomalous behavior detected"
          summary_ar: "تم اكتشاف سلوك غير طبيعي"
          description: "Anomaly score: {{ $value }}, Entity: {{ $labels.entity_id }}"
```

### Performance Alerts
Location: `monitoring/prometheus/alerts/performance.yml`

```yaml
groups:
  - name: performance
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: (100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 70
        for: 5m
        labels:
          severity: warning
          category: infrastructure
        annotations:
          summary: "CPU usage above 70%"
          summary_ar: "استخدام المعالج أعلى من 70%"
          description: "CPU usage is {{ $value | printf \"%.2f\" }}% on {{ $labels.instance }}"
      
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
          category: infrastructure
        annotations:
          summary: "Memory usage above 80%"
          summary_ar: "استخدام الذاكرة أعلى من 80%"
          description: "Memory usage is {{ $value | printf \"%.2f\" }}% on {{ $labels.instance }}"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
          category: performance
        annotations:
          summary: "95th percentile response time above 2s"
          summary_ar: "وقت الاستجابة للنسبة المئوية 95 أعلى من ثانيتين"
          description: "P95 latency is {{ $value | printf \"%.2f\" }}s"
```

### Availability Alerts
Location: `monitoring/prometheus/alerts/availability.yml`

```yaml
groups:
  - name: availability
    interval: 30s
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          category: availability
        annotations:
          summary: "Service {{ $labels.job }} is down"
          summary_ar: "الخدمة {{ $labels.job }} متوقفة"
          description: "{{ $labels.instance }} has been down for more than 1 minute"
      
      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
          category: database
        annotations:
          summary: "PostgreSQL database is down"
          summary_ar: "قاعدة البيانات PostgreSQL متوقفة"
          description: "PostgreSQL instance {{ $labels.instance }} is not responding"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
          category: availability
        annotations:
          summary: "Error rate above 5%"
          summary_ar: "معدل الأخطاء أعلى من 5%"
          description: "5xx error rate is {{ $value | humanizePercentage }}"
```

## Grafana Dashboards

### 1. System Overview Dashboard

Import the pre-configured dashboard:

```bash
# Login to Grafana
# URL: http://localhost:3000
# Default credentials: admin/admin

# Import dashboard
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana/dashboards/system-overview.json
```

Key Panels:
- System uptime
- Active users count
- Request rate (req/s)
- Error rate (%)
- CPU usage by service
- Memory usage by service
- Database connections
- Cache hit ratio

### 2. Security Dashboard

Key Panels:
- Failed login attempts (24h)
- MFA enrollment percentage
- Active sessions count
- Anomaly detection alerts
- Audit log events by severity
- RLS policy violations
- API rate limit hits
- Recent security incidents

### 3. Performance Dashboard

Key Panels:
- Response time percentiles (P50, P95, P99)
- Database query performance
- Slow queries list
- API endpoint latencies
- Export operation times
- Clustering computation times
- Cache performance metrics
- Resource utilization trends

### 4. Business Metrics Dashboard

Key Panels:
- Total dossiers count
- Daily active users
- Export requests by format
- Search queries volume
- Document uploads
- User activity heatmap
- Top accessed resources
- Geographic distribution

## Custom Metrics Implementation

### Application Metrics

```typescript
// backend/src/metrics/index.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Authentication metrics
export const loginAttempts = new Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status']
});

export const mfaVerifications = new Counter({
  name: 'auth_mfa_verifications_total',
  help: 'Total MFA verification attempts',
  labelNames: ['status', 'factor_type']
});

// Performance metrics
export const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Business metrics
export const activeUsers = new Gauge({
  name: 'app_active_users',
  help: 'Current number of active users'
});

export const exportQueue = new Gauge({
  name: 'export_queue_size',
  help: 'Number of pending export requests'
});

// Anomaly detection metrics
export const anomalyScore = new Gauge({
  name: 'anomaly_score',
  help: 'Current anomaly detection score',
  labelNames: ['entity_type', 'entity_id']
});
```

### Metrics Endpoint

```typescript
// backend/src/api/metrics.ts
import { register } from 'prom-client';

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end();
  }
});
```

## Health Checks Configuration

### Docker Health Checks

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  grafana:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  alertmanager:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:9093/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

### Application Health Endpoint

```typescript
// backend/src/api/health.ts
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      cache: await checkCache(),
      storage: await checkStorage(),
      memory: checkMemory(),
      disk: checkDisk()
    }
  };

  const isHealthy = Object.values(health.checks)
    .every(check => check.status === 'ok');

  res.status(isHealthy ? 200 : 503).json(health);
});
```

## Alert Testing

### Test Alert Rules

```bash
# Test specific alert
curl -X POST http://localhost:9090/-/reload

# Trigger test alert
curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Verify alert in AlertManager
curl http://localhost:9093/api/v1/alerts

# Send test notification
amtool alert add \
  alertname=TestAlert \
  severity=warning \
  --alertmanager.url=http://localhost:9093
```

### Verify Alert Routing

```bash
# Check alert routing configuration
amtool config routes show \
  --config.file=monitoring/alertmanager/alertmanager.yml

# Test alert routing
amtool config routes test \
  --config.file=monitoring/alertmanager/alertmanager.yml \
  severity=critical alertname=HighCPUUsage
```

## Log Aggregation

### Configure Log Collection

```yaml
# monitoring/promtail/promtail.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log

  - job_name: application
    static_configs:
      - targets:
          - localhost
        labels:
          job: applogs
          __path__: /app/logs/*.log
```

## Troubleshooting

### Common Issues

#### Prometheus Not Scraping Metrics
```bash
# Check targets status
curl http://localhost:9090/api/v1/targets

# Verify metrics endpoint
curl http://backend:8080/metrics

# Check Prometheus logs
docker logs prometheus
```

#### Grafana Dashboard Not Loading
```bash
# Check datasource configuration
curl -X GET http://admin:admin@localhost:3000/api/datasources

# Test datasource connection
curl -X POST http://admin:admin@localhost:3000/api/datasources/1/query \
  -H "Content-Type: application/json" \
  -d '{"queries":[{"expr":"up"}]}'
```

#### Alerts Not Firing
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check alert state
curl http://localhost:9090/api/v1/alerts

# Verify AlertManager configuration
amtool check-config monitoring/alertmanager/alertmanager.yml
```

### Performance Tuning

#### Prometheus Storage
```yaml
# Adjust retention and storage
prometheus:
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
    - '--storage.tsdb.retention.time=30d'
    - '--storage.tsdb.retention.size=10GB'
    - '--web.enable-lifecycle'
```

#### Grafana Query Optimization
```ini
# grafana.ini
[dataproxy]
timeout = 60
keep_alive_seconds = 30

[database]
max_idle_conn = 25
max_open_conn = 100
conn_max_lifetime = 14400
```

## Backup and Recovery

### Backup Prometheus Data
```bash
# Create snapshot
curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Backup snapshot
docker exec prometheus tar czf /tmp/prometheus-backup.tar.gz \
  /prometheus/snapshots/

# Copy to host
docker cp prometheus:/tmp/prometheus-backup.tar.gz ./backups/
```

### Backup Grafana Configuration
```bash
# Export dashboards
for dashboard in $(curl -s http://admin:admin@localhost:3000/api/search | jq -r '.[].uri'); do
  curl -s http://admin:admin@localhost:3000/api/dashboards/$dashboard \
    > backups/grafana-dashboards/$(echo $dashboard | sed 's/\//-/g').json
done

# Export datasources
curl -s http://admin:admin@localhost:3000/api/datasources \
  > backups/grafana-datasources.json
```

### Restore Procedures
```bash
# Restore Prometheus
docker cp ./backups/prometheus-backup.tar.gz prometheus:/tmp/
docker exec prometheus tar xzf /tmp/prometheus-backup.tar.gz -C /

# Restore Grafana
for dashboard in backups/grafana-dashboards/*.json; do
  curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
    -H "Content-Type: application/json" \
    -d @$dashboard
done
```

## Maintenance

### Regular Tasks

#### Daily
- Review critical alerts
- Check disk usage for metrics storage
- Verify all services are running
- Review security dashboard

#### Weekly
- Analyze performance trends
- Review and tune alert thresholds
- Update dashboard configurations
- Test alert notifications

#### Monthly
- Clean up old metrics data
- Review and optimize queries
- Update monitoring stack components
- Conduct alert drill

### Monitoring Stack Updates

```bash
# Update Prometheus
docker pull prom/prometheus:latest
docker-compose -f docker-compose.monitoring.yml up -d prometheus

# Update Grafana
docker pull grafana/grafana:latest
docker-compose -f docker-compose.monitoring.yml up -d grafana

# Update AlertManager
docker pull prom/alertmanager:latest
docker-compose -f docker-compose.monitoring.yml up -d alertmanager
```

## Security Considerations

### Network Isolation
```yaml
# docker-compose.monitoring.yml
networks:
  monitoring:
    driver: bridge
    internal: true
  public:
    driver: bridge
```

### Authentication & Authorization
- Change default Grafana admin password immediately
- Configure LDAP/SAML integration for Grafana
- Use TLS for all monitoring endpoints
- Implement RBAC for dashboard access
- Secure Prometheus with basic auth or OAuth proxy

### Secrets Management
```bash
# Use Docker secrets
echo "admin_password" | docker secret create grafana_admin_password -
echo "smtp_password" | docker secret create smtp_password -

# Reference in compose file
secrets:
  grafana_admin_password:
    external: true
  smtp_password:
    external: true
```

## Integration with CI/CD

### Performance Gates
```yaml
# .gitlab-ci.yml or .github/workflows/monitoring.yml
monitoring-check:
  script:
    - |
      response_time=$(curl -s http://prometheus:9090/api/v1/query \
        --data-urlencode 'query=histogram_quantile(0.95, http_request_duration_seconds_bucket)' \
        | jq -r '.data.result[0].value[1]')
      
      if (( $(echo "$response_time > 2" | bc -l) )); then
        echo "P95 response time exceeds 2s threshold"
        exit 1
      fi
```

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)

---

*Last Updated: 2025-01-27*  
*Version: 1.0.0*  
*Support: monitoring@gastat.gov.sa*