# Intl-Dossier Production Deployment Guide

Deploy Intl-Dossier to a DigitalOcean Droplet with Docker.

## Prerequisites

- DigitalOcean account
- Domain name (optional, but recommended for SSL)
- Supabase project (already set up)
- OpenAI API key (for AI features)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DigitalOcean Droplet                       │
│                    $24/month (4GB RAM)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                                           │
│   │   Nginx     │──┬──▶ /api/*  ──▶ Backend :4000          │
│   │  :80/:443   │  │                                        │
│   │  (SSL/TLS)  │  ├──▶ /ws/*   ──▶ Backend WebSocket      │
│   └─────────────┘  │                                        │
│         │          ├──▶ /llm/*  ──▶ AnythingLLM :3001      │
│         │          │                                        │
│         │          └──▶ /*      ──▶ Frontend :80           │
│         │                                                   │
│   ┌─────▼─────┐    ┌─────────────┐    ┌─────────────┐      │
│   │  Frontend │    │   Backend   │    │ AnythingLLM │      │
│   │  (Nginx)  │    │  (Express)  │───▶│   (AI)      │      │
│   └───────────┘    └──────┬──────┘    └─────────────┘      │
│                          │                                  │
│                    ┌─────▼─────┐                            │
│                    │   Redis   │                            │
│                    │  (Cache)  │                            │
│                    └───────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Supabase Cloud  │
                    │   (Database)    │
                    └─────────────────┘
```

## Step 1: Create Droplet

1. Go to [DigitalOcean](https://cloud.digitalocean.com)
2. Create → Droplets
3. Configure:
   - **Region**: Frankfurt (fra1) or Amsterdam (ams3)
   - **Image**: Ubuntu 24.04 LTS
   - **Size**: Basic → Regular → **4 GB / 2 CPUs** ($24/month)
   - **Authentication**: SSH Key (recommended)
   - **Backups**: Enable (+20% = ~$5/month)
   - **Monitoring**: Enable (free)

4. Click **Create Droplet**

## Step 2: Connect to Droplet

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP
```

## Step 3: Run Setup Script

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/Intl-DossierV2.0/main/deploy/setup-droplet.sh | bash
```

Or manually:

```bash
# Clone repository
cd /opt/intl-dossier
git clone https://github.com/YOUR_USERNAME/Intl-DossierV2.0.git .

# Run setup
chmod +x deploy/setup-droplet.sh
./deploy/setup-droplet.sh
```

## Step 4: Configure Environment

```bash
cd /opt/intl-dossier/deploy

# Create environment file
cp .env.example .env

# Edit with your values
nano .env
```

### Required Environment Variables

| Variable                    | Where to Find                                  |
| --------------------------- | ---------------------------------------------- |
| `SUPABASE_URL`              | Supabase Dashboard → Settings → API            |
| `SUPABASE_ANON_KEY`         | Supabase Dashboard → Settings → API            |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API            |
| `JWT_SECRET`                | Generate: `openssl rand -base64 32`            |
| `OPENAI_API_KEY`            | [OpenAI Platform](https://platform.openai.com) |

## Step 5: Deploy

```bash
cd /opt/intl-dossier/deploy

# Build and start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

## Step 6: Setup SSL (Optional but Recommended)

### Option A: Using Let's Encrypt (Free)

1. Point your domain to the Droplet IP (A record)
2. Wait for DNS propagation (5-30 minutes)
3. Run SSL setup:

```bash
cd /opt/intl-dossier
./setup-ssl.sh your-domain.com
```

### Option B: Using Self-Signed (Testing Only)

```bash
cd /opt/intl-dossier/deploy/nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout privkey.pem -out fullchain.pem \
    -subj "/CN=localhost"
```

## Accessing the Application

- **Frontend**: `http://YOUR_DROPLET_IP` or `https://your-domain.com`
- **API**: `http://YOUR_DROPLET_IP/api/` or `https://your-domain.com/api/`
- **Health Check**: `http://YOUR_DROPLET_IP/health`

## Helper Commands

```bash
cd /opt/intl-dossier

# View all logs
./logs.sh

# View specific service logs
./logs.sh backend
./logs.sh frontend
./logs.sh anythingllm

# Check system status
./status.sh

# Redeploy (pull latest and restart)
./deploy.sh

# Manual restart
docker compose -f deploy/docker-compose.prod.yml restart

# Stop all services
docker compose -f deploy/docker-compose.prod.yml down

# Remove everything (including volumes)
docker compose -f deploy/docker-compose.prod.yml down -v
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f deploy/docker-compose.prod.yml logs backend

# Check if ports are in use
netstat -tlnp | grep -E '80|443|4000'
```

### Out of memory

```bash
# Check memory usage
free -h

# If low, consider upgrading droplet or reducing services
docker stats
```

### SSL certificate issues

```bash
# Check certificate
openssl x509 -in deploy/nginx/ssl/fullchain.pem -text -noout

# Renew certificate
docker compose -f deploy/docker-compose.prod.yml run --rm certbot renew
```

### Backend can't connect to Supabase

1. Check environment variables are set correctly
2. Verify Supabase project is active
3. Check Supabase firewall rules

## Updating the Application

```bash
cd /opt/intl-dossier

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f deploy/docker-compose.prod.yml up -d --build

# Clean up old images
docker image prune -f
```

## Monitoring

### Built-in Health Checks

- Frontend: `curl http://localhost/health`
- Backend: `curl http://localhost:4000/health`
- AnythingLLM: `curl http://localhost:3001/api/health`

### DigitalOcean Monitoring

Enable in Droplet settings for:

- CPU usage alerts
- Memory usage alerts
- Disk space alerts

## Security Checklist

- [ ] SSH key authentication (not password)
- [ ] Firewall enabled (ufw)
- [ ] Fail2Ban configured
- [ ] SSL/HTTPS enabled
- [ ] Environment variables secured
- [ ] Regular backups enabled
- [ ] Update packages regularly: `apt update && apt upgrade -y`

## Cost Summary

| Item               | Monthly Cost   |
| ------------------ | -------------- |
| Droplet (4GB/2CPU) | $24            |
| Backups (optional) | ~$5            |
| Domain (annual/12) | ~$1            |
| **Total**          | **~$30/month** |

---

For support, open an issue on GitHub.
