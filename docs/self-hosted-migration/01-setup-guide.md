# Self-Hosted Supabase Setup Guide

## Overview

This guide covers setting up the infrastructure and deploying a self-hosted Supabase instance for the Intl-Dossier V2.0 application.

**Duration**: 1-2 days
**Difficulty**: Low to Medium
**Prerequisites**: Linux server, basic Docker knowledge

## Table of Contents

- [Infrastructure Requirements](#infrastructure-requirements)
- [Server Preparation](#server-preparation)
- [Docker Installation](#docker-installation)
- [Supabase Deployment](#supabase-deployment)
- [SSL Configuration](#ssl-configuration)
- [Initial Configuration](#initial-configuration)
- [Storage Setup](#storage-setup)
- [Edge Functions Configuration](#edge-functions-configuration)
- [Admin Access](#admin-access)
- [Troubleshooting](#troubleshooting)

## Infrastructure Requirements

### Hardware Specifications

#### Minimum Requirements
- **CPU**: 4 cores (x64 architecture)
- **RAM**: 16GB
- **Storage**: 500GB SSD
- **Network**: 100Mbps, stable connection

#### Recommended Requirements
- **CPU**: 8 cores (x64 architecture)
- **RAM**: 32GB
- **Storage**: 1TB NVMe SSD (with RAID 10 for redundancy)
- **Network**: 1Gbps, redundant connections

### Storage Planning

```
Component          | Usage        | Recommended
-------------------|--------------|-------------
PostgreSQL Data    | 100-200GB    | 250GB
Storage Buckets    | 50-100GB     | 200GB
Logs               | 20-50GB      | 100GB
Backups            | 2x DB size   | 500GB
System & Docker    | 50GB         | 100GB
Total              | ~450GB       | 1TB+
```

### Operating System

**Recommended**: Ubuntu 22.04 LTS Server

**Also Supported**:
- Debian 11/12
- Rocky Linux 9
- RHEL 9

**Not Recommended**:
- Desktop editions (unnecessary overhead)
- Windows Server (compatibility issues)

## Server Preparation

### Step 1: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential utilities
sudo apt install -y \
  curl \
  wget \
  git \
  htop \
  vim \
  ufw \
  fail2ban \
  unattended-upgrades

# Configure automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Step 2: Create Dedicated User

```bash
# Create supabase user
sudo adduser supabase
sudo usermod -aG sudo supabase
sudo usermod -aG docker supabase

# Switch to supabase user
su - supabase
```

### Step 3: Configure Firewall

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (adjust port if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from trusted IPs)
sudo ufw allow from YOUR_OFFICE_IP to any port 5432

# Check status
sudo ufw status numbered
```

### Step 4: Set Up Fail2Ban

```bash
# Create custom jail for SSH
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
EOF

# Restart fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

## Docker Installation

### Step 1: Install Docker Engine

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Add Docker's official GPG key
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 2: Configure Docker

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group changes (or logout/login)
newgrp docker

# Configure Docker daemon
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
EOF

# Restart Docker
sudo systemctl restart docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Test Docker
docker run hello-world
```

## Supabase Deployment

### Step 1: Clone Supabase Repository

```bash
# Create directory for Supabase
mkdir -p ~/supabase
cd ~/supabase

# Clone official repository
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Check contents
ls -la
```

### Step 2: Generate Secrets

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate anonymous key
ANON_KEY=$(openssl rand -base64 32)
echo "ANON_KEY=$ANON_KEY"

# Generate service role key
SERVICE_ROLE_KEY=$(openssl rand -base64 32)
echo "SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"

# Generate Postgres password
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

# Generate dashboard password
DASHBOARD_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD"

# IMPORTANT: Save these securely!
# Consider using a password manager or encrypted file
cat > ~/supabase-secrets.txt << EOF
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD
EOF

chmod 600 ~/supabase-secrets.txt
```

### Step 3: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit configuration
nano .env
```

**Required Configuration Changes**:

```bash
############
# Secrets
############
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE
ANON_KEY=YOUR_ANON_KEY_HERE
SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

############
# Dashboard
############
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=YOUR_DASHBOARD_PASSWORD_HERE

############
# Database
############
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=postgres

############
# API
############
# Your domain (update after SSL setup)
API_EXTERNAL_URL=https://supabase.yourdomain.com
SUPABASE_PUBLIC_URL=https://supabase.yourdomain.com

############
# Auth
############
SITE_URL=https://yourdomain.com
ADDITIONAL_REDIRECT_URLS=http://localhost:5173,http://localhost:3000
DISABLE_SIGNUP=false

# Email settings (configure SMTP)
SMTP_ADMIN_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=YOUR_SMTP_PASSWORD
SMTP_SENDER_NAME=Intl-Dossier

############
# Studio
############
STUDIO_PORT=3000
PUBLIC_REST_URL=https://supabase.yourdomain.com/rest/v1/

############
# Storage
############
STORAGE_BACKEND=file
FILE_SIZE_LIMIT=52428800
# For production, consider S3-compatible storage:
# STORAGE_BACKEND=s3
# STORAGE_S3_ENDPOINT=https://s3.amazonaws.com
# STORAGE_S3_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret

############
# Edge Functions
############
FUNCTIONS_VERIFY_JWT=true

############
# Realtime
############
REALTIME_MAX_CONNECTIONS=100
```

### Step 4: Review Docker Compose Configuration

See `configs/docker-compose.example.yml` for the complete configuration. Key services:

- **db**: PostgreSQL 15 with extensions
- **studio**: Admin dashboard (port 3000)
- **kong**: API gateway
- **auth**: GoTrue authentication service
- **rest**: PostgREST API
- **realtime**: WebSocket server
- **storage**: File storage service
- **meta**: Metadata service
- **functions**: Edge Functions runtime
- **analytics**: Usage analytics

### Step 5: Start Supabase Stack

```bash
# Pull all images (first time only, ~5-10 minutes)
docker compose pull

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Wait for all services to be healthy (~2-3 minutes)
watch -n 1 'docker compose ps'
```

**Expected Output**:
```
NAME                  STATUS
supabase-db           Up (healthy)
supabase-studio       Up (healthy)
supabase-kong         Up (healthy)
supabase-auth         Up (healthy)
supabase-rest         Up (healthy)
supabase-realtime     Up (healthy)
supabase-storage      Up (healthy)
supabase-meta         Up (healthy)
supabase-functions    Up (healthy)
```

### Step 6: Verify Services

```bash
# Test PostgreSQL
docker compose exec db psql -U postgres -c "SELECT version();"

# Test REST API
curl http://localhost:8000/rest/v1/

# Test Auth
curl http://localhost:8000/auth/v1/health

# Test Realtime
curl http://localhost:8000/realtime/v1/health

# Test Storage
curl http://localhost:8000/storage/v1/health
```

## SSL Configuration

### Option 1: Nginx Reverse Proxy with Let's Encrypt (Recommended)

#### Step 1: Install Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### Step 2: Configure Nginx

```bash
# Create Supabase site configuration
sudo nano /etc/nginx/sites-available/supabase
```

**Configuration** (see `configs/nginx.example.conf`):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name supabase.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name supabase.yourdomain.com;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/supabase.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/supabase.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_request_buffering off;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API endpoints
    location / {
        proxy_pass http://localhost:8000;
    }

    # Studio (optional, consider separate subdomain)
    location /studio {
        proxy_pass http://localhost:3000;
    }
}
```

#### Step 3: Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 4: Obtain SSL Certificate

```bash
# Obtain certificate (interactive)
sudo certbot --nginx -d supabase.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Option 2: Cloudflare Proxy (Alternative)

If using Cloudflare:

1. Point DNS to your server IP
2. Enable Cloudflare proxy (orange cloud)
3. Set SSL/TLS mode to "Full (strict)"
4. Install Cloudflare Origin Certificate on your server

## Initial Configuration

### Step 1: Access Supabase Studio

```bash
# Open in browser
https://supabase.yourdomain.com/studio

# Login with credentials from .env
Username: admin
Password: YOUR_DASHBOARD_PASSWORD
```

### Step 2: Create Initial Admin User

```sql
-- Connect to database
docker compose exec db psql -U postgres

-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@yourdomain.com',
  crypt('YOUR_SECURE_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

### Step 3: Configure Auth Providers

In Studio, navigate to Authentication > Providers and configure:

- **Email**: Already enabled
- **Google OAuth** (if needed): Add client ID/secret
- **Microsoft Azure AD** (if needed): Add tenant/client configuration

## Storage Setup

### Step 1: Create Storage Buckets

```sql
-- Create buckets for Intl-Dossier
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('documents', 'documents', false),
  ('briefings', 'briefings', false),
  ('attachments', 'attachments', false),
  ('avatars', 'avatars', true);

-- Set up RLS policies (see migration files for complete policies)
```

### Step 2: Configure Storage Limits

```bash
# Edit .env
FILE_SIZE_LIMIT=52428800  # 50MB
FILE_STORAGE_BACKEND=file
STORAGE_FILE_PATH=./volumes/storage

# Restart storage service
docker compose restart storage
```

## Edge Functions Configuration

### Step 1: Deploy Edge Functions

```bash
# From your project root
cd /path/to/Intl-DossierV2.0

# Install Supabase CLI
npm install -g supabase

# Link to self-hosted instance
supabase link --project-ref default

# Configure connection
supabase functions deploy --project-ref default \
  --project-url https://supabase.yourdomain.com \
  --api-key YOUR_SERVICE_ROLE_KEY

# Deploy all functions
for func in supabase/functions/*; do
  if [ -d "$func" ]; then
    funcname=$(basename "$func")
    echo "Deploying $funcname..."
    supabase functions deploy $funcname
  fi
done
```

### Step 2: Verify Functions

```bash
# List deployed functions
supabase functions list

# Test a function
curl -X POST https://supabase.yourdomain.com/functions/v1/positions-list \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Admin Access

### Supabase Studio Access

- **URL**: https://supabase.yourdomain.com/studio
- **Username**: admin
- **Password**: From .env DASHBOARD_PASSWORD

### Database Direct Access

```bash
# Via Docker
docker compose exec db psql -U postgres

# Via external tool (pgAdmin, DBeaver)
Host: supabase.yourdomain.com
Port: 5432
Database: postgres
Username: postgres
Password: YOUR_POSTGRES_PASSWORD
SSL: Require
```

### API Access

```bash
# REST API
https://supabase.yourdomain.com/rest/v1/

# Auth API
https://supabase.yourdomain.com/auth/v1/

# Storage API
https://supabase.yourdomain.com/storage/v1/

# Realtime
wss://supabase.yourdomain.com/realtime/v1/
```

## Health Checks

### Automated Health Check Script

```bash
#!/bin/bash
# Save as ~/check-supabase-health.sh

echo "=== Supabase Health Check ==="
echo ""

# Check Docker containers
echo "Docker Containers:"
docker compose ps --format "table {{.Name}}\t{{.Status}}"
echo ""

# Check service endpoints
echo "Service Health:"
services=("rest" "auth" "realtime" "storage")
for service in "${services[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/$service/v1/health)
  if [ "$response" = "200" ]; then
    echo "✓ $service: healthy"
  else
    echo "✗ $service: unhealthy ($response)"
  fi
done
echo ""

# Check database
echo "Database:"
docker compose exec -T db psql -U postgres -c "SELECT 'Database is up' as status;" 2>&1 | grep -q "Database is up"
if [ $? -eq 0 ]; then
  echo "✓ PostgreSQL: healthy"
else
  echo "✗ PostgreSQL: unhealthy"
fi
echo ""

# Check disk space
echo "Disk Usage:"
df -h | grep -E "^/dev|Filesystem"
echo ""

# Check memory
echo "Memory Usage:"
free -h
echo ""

echo "=== Health Check Complete ==="
```

```bash
# Make executable
chmod +x ~/check-supabase-health.sh

# Run check
~/check-supabase-health.sh
```

## Troubleshooting

### Issue: Services Not Starting

```bash
# Check Docker logs
docker compose logs -f [service-name]

# Common issues:
# 1. Port conflicts
sudo lsof -i :8000
sudo lsof -i :5432

# 2. Memory issues
free -h
# If low memory, increase swap:
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Permission issues
sudo chown -R $USER:$USER volumes/
```

### Issue: Cannot Access Studio

```bash
# Check Kong logs
docker compose logs kong

# Verify port exposure
docker compose ps studio
docker compose ps kong

# Test locally
curl http://localhost:3000
curl http://localhost:8000
```

### Issue: Database Connection Failures

```bash
# Check PostgreSQL logs
docker compose logs db

# Verify database is accepting connections
docker compose exec db pg_isready -U postgres

# Check PostgreSQL configuration
docker compose exec db cat /var/lib/postgresql/data/postgresql.conf

# Restart database
docker compose restart db
```

### Issue: Edge Functions Failing

```bash
# Check functions logs
docker compose logs functions

# Verify Deno is working
docker compose exec functions deno --version

# Check function files
docker compose exec functions ls -la /home/deno/functions/

# Redeploy specific function
supabase functions deploy function-name --debug
```

### Issue: SSL Certificate Problems

```bash
# Check certificate status
sudo certbot certificates

# Test certificate renewal
sudo certbot renew --dry-run

# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: High Memory Usage

```bash
# Check memory by service
docker stats

# Limit container memory in docker-compose.yml:
services:
  db:
    mem_limit: 4g
  rest:
    mem_limit: 512m

# Restart with limits
docker compose up -d
```

### Issue: Slow Performance

```bash
# Check PostgreSQL slow queries
docker compose exec db psql -U postgres -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Check connection count
docker compose exec db psql -U postgres -c "
SELECT count(*) FROM pg_stat_activity;"

# Optimize PostgreSQL (add to postgresql.conf)
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```

## Next Steps

Once the self-hosted Supabase stack is running and healthy:

1. **Proceed to [Migration Checklist](./02-migration-checklist.md)** to migrate your data
2. **Configure monitoring** (see [Monitoring Guide](./04-monitoring-alerting.md))
3. **Update application** (see [Environment Updates](./03-environment-update-scripts.md))

## Additional Resources

- [Supabase Self-Hosting Documentation](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

---

**Last Updated**: 2025-10-22
**Supabase Version**: Latest stable (self-hosted)
**Target**: Intl-Dossier V2.0
