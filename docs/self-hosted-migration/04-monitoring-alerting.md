# Production Monitoring & Alerting Setup

## Overview

This guide covers setting up comprehensive monitoring and alerting for your self-hosted Supabase infrastructure to ensure reliability, performance, and quick incident response.

**Duration**: 1-2 days initial setup
**Maintenance**: Ongoing
**Difficulty**: Medium

## Table of Contents

- [Monitoring Strategy](#monitoring-strategy)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Application Monitoring](#application-monitoring)
- [Database Monitoring](#database-monitoring)
- [Alerting Setup](#alerting-setup)
- [Log Management](#log-management)
- [Performance Metrics](#performance-metrics)
- [Incident Response](#incident-response)
- [Dashboards](#dashboards)

## Monitoring Strategy

### Observability Pillars

1. **Metrics**: Quantitative measurements (CPU, memory, request rate)
2. **Logs**: Event records (errors, warnings, info)
3. **Traces**: Request flows through services

### Monitoring Approach

```
┌─────────────────────────────────────────┐
│         Observability Stack             │
├─────────────────────────────────────────┤
│  Metrics → Prometheus + Grafana         │
│  Logs    → Loki or ELK Stack            │
│  Traces  → OpenTelemetry (optional)     │
│  Alerts  → Alertmanager + Slack/Email   │
└─────────────────────────────────────────┘
```

### Key Metrics to Monitor

**Infrastructure**:
- CPU usage per container
- Memory usage per container
- Disk I/O and space
- Network throughput

**Application**:
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Active connections

**Database**:
- Connection count
- Query performance
- Cache hit ratio
- Replication lag (if applicable)

**Business**:
- Active users
- API calls per endpoint
- Storage usage
- Edge Function invocations

## Infrastructure Monitoring

### Option 1: Prometheus + Grafana (Recommended)

Lightweight, scalable, and Docker-native.

#### Step 1: Setup Prometheus

**Create**: `~/supabase/monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Docker metrics
  - job_name: 'docker'
    static_configs:
      - targets: ['172.17.0.1:9323']  # Docker daemon metrics

  # Node exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # PostgreSQL exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Nginx exporter
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # cAdvisor (container metrics)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

**Add to Docker Compose**: `~/supabase/monitoring/docker-compose.monitoring.yml`

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - '9090:9090'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    ports:
      - '3001:3000'
    restart: unless-stopped
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - '9100:9100'
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres?sslmode=disable
    ports:
      - '9187:9187'
    restart: unless-stopped

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - '8080:8080'
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

**Start monitoring stack**:

```bash
cd ~/supabase/monitoring
docker compose -f docker-compose.monitoring.yml up -d

# Verify services
docker ps | grep -E "prometheus|grafana|exporter|cadvisor"
```

#### Step 2: Configure Grafana

```bash
# Access Grafana
# Open: http://your-server:3001
# Login: admin / ${GRAFANA_PASSWORD}
```

**Add Prometheus data source**:

1. Go to Configuration → Data Sources
2. Add Prometheus
3. URL: `http://prometheus:9090`
4. Save & Test

**Import dashboards**:

1. Go to Dashboards → Import
2. Import dashboard IDs:
   - **Node Exporter**: 1860
   - **Docker**: 893
   - **PostgreSQL**: 9628
   - **Nginx**: 12708

### Option 2: Simple Health Check Script

For minimal monitoring without full observability stack:

**Create**: `~/check-health.sh`

```bash
#!/bin/bash
# Simple health monitoring script
# Run via cron every 5 minutes

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/var/log/supabase-health.log"
ALERT_EMAIL="admin@yourdomain.com"

echo "[$TIMESTAMP] Starting health check..." >> $LOG_FILE

# Check Docker containers
UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | wc -l)
if [ $UNHEALTHY -gt 0 ]; then
  echo "[$TIMESTAMP] ERROR: $UNHEALTHY unhealthy containers" >> $LOG_FILE
  docker ps --filter "health=unhealthy" >> $LOG_FILE
  # Send alert
  echo "Unhealthy Supabase containers detected" | mail -s "Supabase Alert" $ALERT_EMAIL
fi

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "[$TIMESTAMP] WARNING: Disk usage at ${DISK_USAGE}%" >> $LOG_FILE
  echo "Disk usage: ${DISK_USAGE}%" | mail -s "Supabase Disk Alert" $ALERT_EMAIL
fi

# Check database connectivity
docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "[$TIMESTAMP] ERROR: PostgreSQL not ready" >> $LOG_FILE
  echo "PostgreSQL is not responding" | mail -s "Supabase DB Alert" $ALERT_EMAIL
fi

# Check service endpoints
for service in rest auth realtime storage; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/$service/v1/health)
  if [ "$HTTP_CODE" != "200" ]; then
    echo "[$TIMESTAMP] ERROR: $service returned $HTTP_CODE" >> $LOG_FILE
    echo "$service health check failed" | mail -s "Supabase Service Alert" $ALERT_EMAIL
  fi
done

echo "[$TIMESTAMP] Health check complete" >> $LOG_FILE
```

**Setup cron**:

```bash
chmod +x ~/check-health.sh
crontab -e

# Add line:
*/5 * * * * /home/supabase/check-health.sh
```

## Application Monitoring

### Docker Health Checks

Add health checks to your Supabase `docker-compose.yml`:

```yaml
services:
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  kong:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9999/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  rest:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 10s
      timeout: 5s
      retries: 5

  realtime:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  storage:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Application Logs

**Configure log rotation** to prevent disk space issues:

**Create**: `/etc/docker/daemon.json`

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3",
    "labels": "service"
  }
}
```

```bash
sudo systemctl restart docker
```

## Database Monitoring

### PostgreSQL Statistics

Enable `pg_stat_statements` for query performance monitoring:

```sql
-- Connect to database
docker compose exec db psql -U postgres

-- Enable extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Reload configuration
SELECT pg_reload_conf();
```

### Key Database Queries

**Monitor slow queries**:

```sql
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries taking >100ms average
ORDER BY total_exec_time DESC
LIMIT 20;
```

**Monitor database size**:

```sql
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

**Monitor table sizes**:

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

**Monitor connections**:

```sql
SELECT
  state,
  COUNT(*) as connections
FROM pg_stat_activity
GROUP BY state;
```

**Monitor cache hit ratio**:

```sql
SELECT
  'index hit rate' AS name,
  (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read),0) AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
  'cache hit rate' AS name,
  sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read),0) AS ratio
FROM pg_statio_user_tables;
```

### Automated Database Monitoring Script

**Create**: `~/monitor-db.sh`

```bash
#!/bin/bash
# Database monitoring script
# Run via cron every hour

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/var/log/supabase-db-metrics.log"

echo "[$TIMESTAMP] Database Metrics:" >> $LOG_FILE

# Connection count
CONNECTIONS=$(docker compose exec -T db psql -U postgres -t -c "SELECT COUNT(*) FROM pg_stat_activity;")
echo "Connections: $CONNECTIONS" >> $LOG_FILE

# Database size
DB_SIZE=$(docker compose exec -T db psql -U postgres -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));")
echo "Database Size: $DB_SIZE" >> $LOG_FILE

# Cache hit ratio
CACHE_HIT=$(docker compose exec -T db psql -U postgres -t -c "
  SELECT ROUND(sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read),0) * 100, 2)
  FROM pg_statio_user_tables;")
echo "Cache Hit Ratio: $CACHE_HIT%" >> $LOG_FILE

# Slow queries count
SLOW_QUERIES=$(docker compose exec -T db psql -U postgres -t -c "
  SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > 100;")
echo "Slow Queries (>100ms): $SLOW_QUERIES" >> $LOG_FILE

echo "" >> $LOG_FILE
```

```bash
chmod +x ~/monitor-db.sh
crontab -e

# Add:
0 * * * * /home/supabase/monitor-db.sh
```

## Alerting Setup

### Prometheus Alertmanager

**Create**: `~/supabase/monitoring/alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical'
    - match:
        severity: warning
      receiver: 'warning'

receivers:
  - name: 'default'
    email_configs:
      - to: 'admin@yourdomain.com'
        from: 'alerts@yourdomain.com'
        smarthost: 'smtp.yourdomain.com:587'
        auth_username: 'alerts@yourdomain.com'
        auth_password: 'YOUR_SMTP_PASSWORD'

  - name: 'critical'
    slack_configs:
      - channel: '#supabase-critical'
        title: 'Critical Alert: {{ .CommonAnnotations.summary }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    email_configs:
      - to: 'admin@yourdomain.com,oncall@yourdomain.com'

  - name: 'warning'
    slack_configs:
      - channel: '#supabase-warnings'
        title: 'Warning: {{ .CommonAnnotations.summary }}'
```

**Create alert rules**: `~/supabase/monitoring/alerts.yml`

```yaml
groups:
  - name: infrastructure
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: container_cpu_usage_seconds_total > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "Container {{ $labels.name }} CPU usage is above 80%"

      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Container {{ $labels.name }} memory usage is above 85%"

      - alert: DiskSpaceRunningOut
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space running out"
          description: "Filesystem {{ $labels.mountpoint }} has less than 15% space available"

  - name: database
    interval: 30s
    rules:
      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL instance is not responding"

      - alert: TooManyConnections
        expr: sum(pg_stat_activity_count) > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Too many database connections"
          description: "Database has {{ $value }} connections (>90)"

      - alert: SlowQueries
        expr: pg_stat_statements_mean_time_seconds > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow queries detected"
          description: "Query {{ $labels.query }} averages {{ $value }}s"

  - name: application
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: ServiceDown
        expr: up{job=~"rest|auth|realtime|storage"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for 2 minutes"
```

**Add Alertmanager to docker-compose.monitoring.yml**:

```yaml
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - '9093:9093'
    restart: unless-stopped
```

## Log Management

### Option 1: Loki + Promtail (Lightweight)

**Add to docker-compose.monitoring.yml**:

```yaml
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
```

**Create**: `~/supabase/monitoring/loki-config.yml`

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2023-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h  # 30 days
```

**Create**: `~/supabase/monitoring/promtail-config.yml`

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
```

## Performance Metrics

### Custom Metrics Dashboard

Key metrics to track:

**API Performance**:
```
- Request rate (req/s)
- Average response time
- P95/P99 response times
- Error rate
```

**Database Performance**:
```
- Query execution time
- Active connections
- Transaction rate
- Cache hit ratio
- Disk I/O
```

**Resource Utilization**:
```
- CPU usage %
- Memory usage %
- Disk usage %
- Network throughput
```

**Business Metrics**:
```
- Active users
- New signups
- API calls per user
- Storage usage per user
```

## Incident Response

### Incident Response Playbook

**1. Critical Database Issues**

```bash
# Symptoms: Database not responding
# Check database status
docker compose exec db pg_isready

# Check logs
docker compose logs db --tail=100

# Check connections
docker compose exec db psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# If needed, restart database
docker compose restart db

# Verify recovery
./scripts/validate-migration.sh --db-check
```

**2. High CPU/Memory Usage**

```bash
# Identify problematic container
docker stats

# Check logs for errors
docker compose logs [container] --tail=200

# Check for runaway queries
docker compose exec db psql -U postgres -c "
  SELECT pid, query, state, query_start
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY query_start
  LIMIT 10;"

# Kill problematic query if needed
docker compose exec db psql -U postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE pid = YOUR_PID;"

# If needed, restart service
docker compose restart [service]
```

**3. Disk Space Full**

```bash
# Check disk usage
df -h

# Find large Docker objects
docker system df

# Clean up unused resources
docker system prune -a --volumes

# Check PostgreSQL data
docker compose exec db psql -U postgres -c "
  SELECT pg_size_pretty(pg_database_size('postgres'));"

# Rotate logs
docker compose logs --tail=0

# Emergency: Increase disk or delete old backups
```

**4. Service Unavailable**

```bash
# Check all services
docker compose ps

# Restart unhealthy services
docker compose restart [service]

# Check Kong/gateway logs
docker compose logs kong --tail=100

# Verify network
docker network ls
docker network inspect supabase_default

# Full restart if needed
docker compose down
docker compose up -d
```

## Dashboards

### Grafana Dashboard JSON

Pre-configured dashboard template available in `configs/grafana-dashboard.json`.

Import steps:
1. Open Grafana
2. Dashboards → Import
3. Upload JSON file or paste contents
4. Select Prometheus data source
5. Click Import

### Key Dashboard Panels

**Overview Dashboard**:
- System health status
- Service status indicators
- Request rate graph
- Error rate graph
- Database connections
- Disk usage

**Database Dashboard**:
- Connection pool
- Query performance
- Cache hit ratio
- Table sizes
- Index usage
- Slow queries list

**Performance Dashboard**:
- Response time percentiles
- Throughput (req/s)
- Error rates by endpoint
- Resource utilization
- Network I/O

## Summary

After setting up monitoring:

✅ Prometheus collecting metrics
✅ Grafana dashboards configured
✅ Alertmanager sending notifications
✅ Log aggregation running
✅ Health check scripts in place
✅ Incident response playbook ready

### Daily Operations

**Daily**:
- Check dashboard for anomalies
- Review overnight alerts
- Verify backups completed

**Weekly**:
- Review slow queries
- Check disk space trends
- Update alert thresholds if needed

**Monthly**:
- Review monitoring data retention
- Update dashboards
- Conduct incident response drill
- Review and optimize alerts

---

**Last Updated**: 2025-10-22
**Target**: Intl-Dossier V2.0 Self-Hosted Operations
