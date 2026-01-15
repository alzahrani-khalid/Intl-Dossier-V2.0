# DigitalOcean Droplet Deployment Instructions

## Server Details

| Property          | Value                               |
| ----------------- | ----------------------------------- |
| **IP Address**    | 138.197.195.242                     |
| **SSH Access**    | `ssh root@138.197.195.242`          |
| **SSH Key**       | Pre-configured (no password needed) |
| **OS**            | Ubuntu                              |
| **Apps Deployed** | intl-dossier, events-app            |

## Port Allocation

| App          | Port   | URL                          |
| ------------ | ------ | ---------------------------- |
| intl-dossier | 80/443 | http://138.197.195.242/      |
| events-app   | 8080   | http://138.197.195.242:8080/ |

## Directory Structure

```
/opt/
├── intl-dossier/          # This project
│   ├── frontend/
│   ├── backend/
│   ├── deploy/
│   │   ├── docker-compose.prod.yml
│   │   ├── nginx/
│   │   │   └── nginx.conf
│   │   ├── certbot/
│   │   └── .env
│   └── ...
└── events-app/            # Other project
    └── deploy/
        └── docker-compose.prod.yml
```

## Common Commands

### SSH into Droplet

```bash
ssh root@138.197.195.242
```

### Deploy intl-dossier (from local machine)

```bash
# 1. Push changes to git
git push

# 2. SSH and deploy
ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build && docker compose -f docker-compose.prod.yml up -d"
```

### One-liner Deploy (frontend only)

```bash
ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"
```

### Check Container Status

```bash
ssh root@138.197.195.242 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

### View Logs

```bash
# All nginx logs
ssh root@138.197.195.242 "docker logs intl-dossier-nginx --tail 100"

# Frontend logs
ssh root@138.197.195.242 "docker logs intl-dossier-frontend --tail 100"

# Backend logs
ssh root@138.197.195.242 "docker logs intl-dossier-backend --tail 100"

# Follow logs in real-time
ssh root@138.197.195.242 "docker logs -f intl-dossier-nginx"
```

### Restart Services

```bash
# Restart all services
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml restart"

# Restart specific service
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml restart frontend"
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml restart nginx"
```

### Stop/Start Services

```bash
# Stop all
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml down"

# Start all
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml up -d"
```

### Rebuild and Deploy

```bash
# Full rebuild (all services)
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d"

# Rebuild specific service
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml build --no-cache frontend && docker compose -f docker-compose.prod.yml up -d frontend"
```

## Container Names

| Service               | Container Name           |
| --------------------- | ------------------------ |
| Nginx (reverse proxy) | intl-dossier-nginx       |
| Frontend (React/Vite) | intl-dossier-frontend    |
| Backend (Express API) | intl-dossier-backend     |
| Redis (cache)         | intl-dossier-redis       |
| AnythingLLM (AI)      | intl-dossier-anythingllm |
| Certbot (SSL)         | intl-dossier-certbot     |

## Troubleshooting

### Container Conflicts Between Apps

If you see errors about container name conflicts, ensure each app has a unique `name:` at the top of its `docker-compose.prod.yml`:

```yaml
name: intl-dossier # Must be unique per app

services: ...
```

### Network Conflicts

If you see network-related errors:

```bash
# Remove old network and restart
ssh root@138.197.195.242 "docker network rm intl-dossier-prod 2>/dev/null; cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml up -d"
```

### Container Won't Start (name in use)

```bash
# Stop and remove old containers, then start fresh
ssh root@138.197.195.242 "docker stop intl-dossier-frontend intl-dossier-backend intl-dossier-nginx intl-dossier-redis intl-dossier-anythingllm intl-dossier-certbot 2>/dev/null; docker rm intl-dossier-frontend intl-dossier-backend intl-dossier-nginx intl-dossier-redis intl-dossier-anythingllm intl-dossier-certbot 2>/dev/null; cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml up -d"
```

### Check Listening Ports

```bash
ssh root@138.197.195.242 "ss -tlnp | grep -E ':80|:443|:8080'"
```

### Check Disk Space

```bash
ssh root@138.197.195.242 "df -h"
```

### Clean Up Docker (free disk space)

```bash
# Remove unused images
ssh root@138.197.195.242 "docker image prune -a -f"

# Remove unused volumes
ssh root@138.197.195.242 "docker volume prune -f"

# Full cleanup (be careful!)
ssh root@138.197.195.242 "docker system prune -a -f"
```

### Health Check

```bash
# Quick health check
curl -s http://138.197.195.242/health

# Check HTTP response
curl -I http://138.197.195.242/
```

## SSL/HTTPS (Not Yet Configured)

HTTPS is currently **not enabled**. The SSL server block in nginx.conf is commented out.

To enable HTTPS:

1. Point a domain to 138.197.195.242
2. Run certbot to generate Let's Encrypt certificates
3. Uncomment the HTTPS server block in nginx.conf
4. Restart nginx

## Environment Variables

Environment variables are stored in `/opt/intl-dossier/deploy/.env`

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `OPENAI_API_KEY` (for AnythingLLM)

## Quick Reference

```bash
# Deploy after code changes
git push && ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"

# Check status
ssh root@138.197.195.242 "docker ps"

# View frontend logs
ssh root@138.197.195.242 "docker logs intl-dossier-frontend --tail 50"

# Restart everything
ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml restart"
```
