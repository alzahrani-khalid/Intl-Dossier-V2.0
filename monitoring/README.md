# GASTAT Monitoring Stack

This directory contains the complete monitoring infrastructure for the GASTAT International Dossier System, including Prometheus, Grafana, Alertmanager, and related services.

## 🏗️ Architecture Overview

The monitoring stack consists of:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert handling and routing
- **Jaeger**: Distributed tracing
- **Elasticsearch + Kibana**: Log aggregation and analysis
- **Uptime Kuma**: Uptime monitoring
- **Nginx**: Reverse proxy with SSL termination

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- OpenSSL for SSL certificate generation
- At least 4GB RAM available for all services

### Setup

1. **Run the setup script:**
   ```bash
   cd monitoring
   ./setup-monitoring.sh
   ```

2. **Access the services:**
   - Grafana: http://localhost:3000 (admin/admin123)
   - Prometheus: http://localhost:9090
   - Alertmanager: http://localhost:9093
   - Jaeger: http://localhost:16686
   - Kibana: http://localhost:5601
   - Uptime Kuma: http://localhost:3001

## 📊 Monitoring Components

### Prometheus Configuration

- **File**: `prometheus/prometheus.yml`
- **Purpose**: Metrics collection and storage
- **Retention**: 30 days
- **Scrape Interval**: 15 seconds

### Grafana Dashboards

- **System Overview**: Complete system health monitoring
- **Application Metrics**: Backend API performance
- **Database Metrics**: PostgreSQL and Redis monitoring
- **Infrastructure**: CPU, Memory, Disk usage
- **Security**: Rate limiting and authentication metrics

### Alertmanager Rules

- **Critical Alerts**: System down, database failures
- **Warning Alerts**: High resource usage, performance issues
- **Security Alerts**: Brute force attacks, suspicious activity

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the monitoring directory:

```env
# Prometheus
PROMETHEUS_RETENTION_TIME=30d
PROMETHEUS_RETENTION_SIZE=10GB

# Grafana
GF_SECURITY_ADMIN_PASSWORD=your-secure-password
GF_USERS_ALLOW_SIGN_UP=false

# Alertmanager
SMTP_SMARTHOST=your-smtp-server:587
SMTP_FROM=alerts@gastat.gov.sa
SMTP_AUTH_USERNAME=alerts@gastat.gov.sa
SMTP_AUTH_PASSWORD=your-smtp-password

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# PagerDuty Integration
PAGERDUTY_SERVICE_KEY=your-pagerduty-service-key
```

### SSL Configuration

For production, replace the self-signed certificates:

```bash
# Place your SSL certificates in:
monitoring/nginx/ssl/monitoring.crt
monitoring/nginx/ssl/monitoring.key
```

### Basic Authentication

Update the basic auth file for production:

```bash
# Generate new password hash
htpasswd -nb admin your-new-password > monitoring/nginx/.htpasswd
```

## 📈 Metrics Collection

### Application Metrics

The backend API exposes metrics at `/metrics` endpoint:

- HTTP request metrics
- Database connection metrics
- Rate limiting metrics
- AI service metrics
- Search and indexing metrics

### System Metrics

- CPU usage and load
- Memory consumption
- Disk space and I/O
- Network traffic
- Container metrics

### Database Metrics

- Connection pool status
- Query performance
- Lock contention
- Replication lag

## 🚨 Alerting

### Alert Categories

1. **Critical**: System down, data loss, security breaches
2. **Warning**: High resource usage, performance degradation
3. **Info**: Maintenance windows, configuration changes

### Alert Channels

- Email notifications
- Slack integration
- PagerDuty escalation
- Webhook endpoints

### Alert Rules

Key alert rules include:

- `ApplicationDown`: Backend API unavailable
- `DatabaseDown`: PostgreSQL connection lost
- `HighErrorRate`: 5xx errors > 5%
- `HighResponseTime`: 95th percentile > 2s
- `BruteForceAttack`: Failed logins > 10/min
- `DiskSpaceCritical`: Disk usage > 95%

## 📋 Dashboards

### System Overview Dashboard

- Service health status
- Request rate and response time
- Error rates and success rates
- Resource utilization
- Database performance

### Application Dashboard

- API endpoint performance
- User activity metrics
- Feature usage statistics
- Business metrics

### Security Dashboard

- Authentication attempts
- Rate limiting statistics
- Suspicious activity
- Security events

## 🔍 Logging

### Log Aggregation

- **Elasticsearch**: Log storage and indexing
- **Logstash**: Log processing and enrichment
- **Kibana**: Log visualization and analysis

### Log Sources

- Application logs (Backend API)
- System logs (Docker containers)
- Access logs (Nginx)
- Database logs (PostgreSQL)

## 🛠️ Maintenance

### Backup

```bash
# Backup Prometheus data
docker exec gastat-prometheus promtool tsdb create-blocks-from openmetrics /backup/prometheus-backup.txt /backup/prometheus-data/

# Backup Grafana dashboards
curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/dashboards/home > grafana-backup.json
```

### Updates

```bash
# Update all services
docker-compose pull
docker-compose up -d

# Update specific service
docker-compose pull prometheus
docker-compose up -d prometheus
```

### Scaling

For high-volume environments:

1. **Prometheus**: Use remote storage (e.g., Cortex, Thanos)
2. **Elasticsearch**: Add more nodes to cluster
3. **Grafana**: Use external database (PostgreSQL/MySQL)

## 🔒 Security

### Network Security

- All services run in isolated Docker network
- Nginx provides SSL termination
- Basic authentication for web interfaces
- Rate limiting on API endpoints

### Data Security

- Encrypted communication (HTTPS)
- Secure credential storage
- Regular security updates
- Access logging and auditing

## 📚 Troubleshooting

### Common Issues

1. **Services not starting**: Check Docker logs
2. **Metrics not appearing**: Verify scrape targets
3. **Alerts not firing**: Check alert rules syntax
4. **High memory usage**: Adjust retention policies

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Test Prometheus targets
curl http://localhost:9090/api/v1/targets

# Test Grafana API
curl -u admin:admin123 http://localhost:3000/api/health
```

### Performance Tuning

1. **Prometheus**: Adjust scrape intervals and retention
2. **Grafana**: Optimize dashboard queries
3. **Elasticsearch**: Tune JVM heap size
4. **Nginx**: Configure worker processes

## 📞 Support

For monitoring-related issues:

1. Check service logs: `docker-compose logs [service]`
2. Verify configuration files
3. Test connectivity between services
4. Review resource usage and limits

## 🔄 Updates

This monitoring stack is designed to be:

- **Scalable**: Easy to add new services and metrics
- **Maintainable**: Clear configuration and documentation
- **Reliable**: Health checks and automatic restarts
- **Secure**: Proper authentication and encryption

---

**Note**: This monitoring setup is configured for development. For production deployment, ensure proper SSL certificates, secure passwords, and appropriate resource limits.
