# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the GASTAT International Dossier System to production environments. The deployment supports both cloud and on-premise configurations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Environment Setup](#environment-setup)
4. [Database Deployment](#database-deployment)
5. [Application Deployment](#application-deployment)
6. [Security Configuration](#security-configuration)
7. [Monitoring Setup](#monitoring-setup)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling Guidelines](#scaling-guidelines)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 22.04 LTS or RHEL 8+
- **Docker**: Version 24.0+ with Docker Compose v2.20+
- **Kubernetes**: v1.28+ (for K8s deployment)
- **CPU**: Minimum 8 cores, recommended 16 cores
- **RAM**: Minimum 16GB, recommended 32GB
- **Storage**: 500GB SSD minimum, 1TB recommended
- **Network**: 100 Mbps minimum, 1 Gbps recommended

### Required Tools

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y \
  docker.io \
  docker-compose \
  git \
  curl \
  jq \
  postgresql-client \
  certbot \
  nginx
```

### Access Requirements

- Domain name with DNS configuration capability
- SSL certificates (Let's Encrypt or commercial)
- SMTP server for email notifications
- Object storage (S3-compatible) for file uploads

## Infrastructure Requirements

### Resource Allocation

| Service | CPU Cores | Memory | Storage | Replicas |
|---------|-----------|---------|---------|----------|
| Frontend | 2 | 2GB | 10GB | 3 |
| Supabase API | 4 | 8GB | 50GB | 2 |
| PostgreSQL | 4 | 8GB | 200GB | 1 (Primary) + 1 (Replica) |
| AnythingLLM | 4 | 8GB | 100GB | 1 |
| Redis Cache | 2 | 4GB | 20GB | 1 |
| Monitoring | 2 | 4GB | 50GB | 1 |

### Network Architecture

```
Internet
    |
    v
Load Balancer (443/80)
    |
    +---> Nginx Reverse Proxy
           |
           +---> Frontend (3000)
           +---> API Gateway (8000)
           +---> Grafana (3003)
    
Internal Network
    |
    +---> PostgreSQL (5432)
    +---> Redis (6379)
    +---> AnythingLLM (3001)
    +---> Prometheus (9090)
```

## Environment Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/gastat/intl-dossier.git
cd intl-dossier

# Checkout stable release
git checkout tags/v1.0.0
```

### 2. Configure Environment Variables

```bash
# Copy environment template
cp .env.production.example .env.production

# Generate secure keys
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
```

Edit `.env.production`:

```env
# Application
NODE_ENV=production
APP_URL=https://dossier.gastat.sa
API_URL=https://api-dossier.gastat.sa

# Database
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@db:5432/intl_dossier
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=100

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# AnythingLLM
ANYTHINGLLM_URL=http://anythingllm:3001
ANYTHINGLLM_API_KEY=secure-api-key
ANYTHINGLLM_MODEL=gpt-4

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=secure-redis-password

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
CORS_ORIGINS=https://dossier.gastat.sa
RATE_LIMIT_MAX=300
SESSION_SECRET=your-session-secret

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@gastat.sa
SMTP_PASSWORD=secure-smtp-password
SMTP_FROM=GASTAT Dossier <notifications@gastat.sa>

# Storage
STORAGE_PROVIDER=supabase
STORAGE_BUCKET=dossier-files
MAX_FILE_SIZE=52428800

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_PUSHGATEWAY=http://pushgateway:9091
LOG_LEVEL=info
```

### 3. SSL Certificate Setup

```bash
# Using Let's Encrypt
sudo certbot certonly --standalone \
  -d dossier.gastat.sa \
  -d api-dossier.gastat.sa \
  --email admin@gastat.sa \
  --agree-tos

# Copy certificates
sudo cp /etc/letsencrypt/live/dossier.gastat.sa/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/dossier.gastat.sa/privkey.pem ./certs/
```

## Database Deployment

### 1. PostgreSQL Setup

```bash
# Create database cluster
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
until docker-compose exec postgres pg_isready; do
  echo "Waiting for postgres..."
  sleep 2
done

# Run migrations
npm run db:migrate:production

# Create read replica
docker-compose -f docker-compose.production.yml up -d postgres-replica

# Setup streaming replication
docker exec postgres-primary psql -U postgres -c "
  CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replica_password';
  SELECT pg_create_physical_replication_slot('replica_slot');
"
```

### 2. Database Optimization

```sql
-- Performance tuning
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_events_datetime ON events(start_datetime, end_datetime);
CREATE INDEX CONCURRENTLY idx_mous_workflow ON mous(workflow_state);

-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### 3. Backup Configuration

```bash
# Setup automated backups
cat > /etc/cron.d/postgres-backup << EOF
0 2 * * * postgres pg_dump intl_dossier | gzip > /backups/intl_dossier_\$(date +\%Y\%m\%d).sql.gz
0 3 * * * postgres find /backups -name "*.sql.gz" -mtime +30 -delete
EOF

# Test backup
docker exec postgres pg_dump intl_dossier | gzip > backup_test.sql.gz
```

## Application Deployment

### 1. Build Production Images

```bash
# Build frontend
cd frontend
npm ci --production
npm run build
docker build -t intl-dossier/frontend:latest .

# Build backend
cd ../backend
npm ci --production
npm run build
docker build -t intl-dossier/backend:latest .
```

### 2. Docker Compose Deployment

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check service health
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Kubernetes Deployment (Alternative)

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intl-dossier-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: intl-dossier/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

Apply Kubernetes configuration:

```bash
kubectl apply -f kubernetes/
kubectl rollout status deployment/intl-dossier-frontend
```

## Security Configuration

### 1. Firewall Rules

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 9090/tcp  # Prometheus (internal only)
sudo ufw allow 3003/tcp  # Grafana (internal only)
sudo ufw enable
```

### 2. Nginx Configuration

```nginx
# /etc/nginx/sites-available/intl-dossier
server {
    listen 80;
    server_name dossier.gastat.sa;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dossier.gastat.sa;

    ssl_certificate /etc/letsencrypt/live/dossier.gastat.sa/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dossier.gastat.sa/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. Security Hardening

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Setup fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban

# Configure AppArmor/SELinux
sudo aa-enforce /etc/apparmor.d/*

# Regular security updates
sudo apt-get update && sudo apt-get upgrade -y
```

## Monitoring Setup

### 1. Start Monitoring Stack

```bash
# Deploy monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services
curl -s http://localhost:9090/-/healthy  # Prometheus
curl -s http://localhost:3003/api/health  # Grafana
```

### 2. Configure Alerts

```bash
# Setup alertmanager
docker run -d \
  --name alertmanager \
  -p 9093:9093 \
  -v ./monitoring/alertmanager:/etc/alertmanager \
  prom/alertmanager

# Configure Slack webhook
cat > monitoring/alertmanager/config.yml << EOF
global:
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
    - channel: '#alerts'
      title: 'Intl-Dossier Alert'
EOF
```

### 3. Application Metrics

```javascript
// Add to backend/src/metrics.ts
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Backup & Recovery

### 1. Automated Backup Strategy

```bash
# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker exec postgres pg_dumpall -U postgres | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application data backup
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz /var/lib/docker/volumes/

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://gastat-backups/intl-dossier/
aws s3 cp $BACKUP_DIR/app_data_$DATE.tar.gz s3://gastat-backups/intl-dossier/

# Clean old local backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# Schedule backups
echo "0 2 * * * /opt/backup.sh" | crontab -
```

### 2. Disaster Recovery Plan

```bash
# Recovery procedure
recover_database() {
  # Stop application
  docker-compose down
  
  # Restore database
  gunzip -c backup.sql.gz | docker exec -i postgres psql -U postgres
  
  # Verify restoration
  docker exec postgres psql -U postgres -c "\dt"
  
  # Start application
  docker-compose up -d
}

# Test recovery procedure monthly
0 0 1 * * /opt/test-recovery.sh
```

## Scaling Guidelines

### Horizontal Scaling

```bash
# Scale frontend instances
docker-compose up -d --scale frontend=3

# Scale API instances
docker-compose up -d --scale api=2
```

### Load Balancing

```nginx
# nginx load balancing configuration
upstream frontend_cluster {
    least_conn;
    server frontend1:3000 weight=1;
    server frontend2:3000 weight=1;
    server frontend3:3000 weight=1;
}

upstream api_cluster {
    ip_hash;
    server api1:8000 weight=1;
    server api2:8000 weight=1;
}
```

### Database Scaling

```sql
-- Connection pooling with pgBouncer
[databases]
intl_dossier = host=postgres port=5432 dbname=intl_dossier

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database status
docker exec postgres pg_isready

# View connection count
docker exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
docker exec postgres psql -U postgres -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'idle' AND state_change < now() - interval '10 minutes';
"
```

#### 2. High Memory Usage

```bash
# Check memory usage
docker stats

# Clear caches
sync && echo 3 > /proc/sys/vm/drop_caches

# Restart memory-intensive services
docker-compose restart anythingllm
```

#### 3. Slow Performance

```bash
# Analyze slow queries
docker exec postgres psql -U postgres -c "
  SELECT query, calls, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check index usage
docker exec postgres psql -U postgres -c "
  SELECT schemaname, tablename, indexname, idx_scan
  FROM pg_stat_user_indexes
  ORDER BY idx_scan;
"
```

### Health Checks

```bash
# Application health check
curl -f http://localhost:3000/health || exit 1

# Database health check
docker exec postgres pg_isready || exit 1

# Redis health check
docker exec redis redis-cli ping || exit 1
```

### Log Analysis

```bash
# Aggregate error logs
docker-compose logs --tail=1000 | grep ERROR

# Monitor real-time logs
docker-compose logs -f frontend api

# Export logs for analysis
docker-compose logs > logs_$(date +%Y%m%d).txt
```

## Performance Optimization

### 1. Frontend Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Browser caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Database Optimization

```sql
-- Vacuum and analyze tables
VACUUM ANALYZE;

-- Reindex tables
REINDEX DATABASE intl_dossier;

-- Update table statistics
ANALYZE;
```

### 3. CDN Configuration

```bash
# CloudFlare configuration
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
     -H "X-Auth-Email: admin@gastat.sa" \
     -H "X-Auth-Key: API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
```

## Security Compliance

### GDPR Compliance

- Data encryption at rest and in transit
- User consent mechanisms
- Right to be forgotten implementation
- Data portability features
- Privacy policy enforcement

### Security Auditing

```bash
# Run security audit
npm audit --production

# Container scanning
docker scan intl-dossier/frontend:latest

# Dependency updates
npm update --save
```

## Maintenance Windows

### Planned Maintenance Procedure

```bash
# 1. Enable maintenance mode
echo '{"maintenance": true}' > /var/www/maintenance.json

# 2. Graceful shutdown
docker-compose stop frontend api

# 3. Perform maintenance
# ... database updates, migrations, etc ...

# 4. Start services
docker-compose up -d

# 5. Disable maintenance mode
rm /var/www/maintenance.json
```

## Support Information

### Contact Information

- **Technical Support**: support@gastat.sa
- **Emergency Hotline**: +966-XX-XXXX-XXXX
- **Documentation**: https://docs.dossier.gastat.sa
- **Status Page**: https://status.gastat.sa

### Service Level Agreements

- **Uptime Target**: 99.9% (43.2 minutes downtime/month)
- **Response Time**: < 500ms p95
- **Support Response**: Critical: 1hr, High: 4hrs, Medium: 1 day, Low: 3 days

---

*Last Updated: 2025-09-27*
*Version: 1.0.0*