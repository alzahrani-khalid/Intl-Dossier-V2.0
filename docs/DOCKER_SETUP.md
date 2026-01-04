# Docker Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    intl-dossier network                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   postgres   │  │    redis     │  │   anythingllm    │  │
│  │  :54322      │  │   :6379      │  │     :3001        │  │
│  │  (core)      │  │   (core)     │  │   (profile:ai)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  prometheus  │  │   grafana    │  │  redis-exporter  │  │
│  │   :9090      │  │   :3002      │  │     :9121        │  │
│  │ (monitoring) │  │ (monitoring) │  │   (monitoring)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

        Backend (localhost:4000) ←─── Run locally with pnpm
        Frontend (localhost:5173) ←── Run locally with pnpm
```

## Quick Start

```bash
# Start core services (postgres + redis)
docker compose up -d

# Start with AI features
docker compose --profile ai up -d

# Start with monitoring
docker compose --profile monitoring up -d

# Start everything
docker compose --profile ai --profile monitoring up -d
```

## Services

### Core (Always Running)

| Service       | Container             | Port  | Purpose         |
| ------------- | --------------------- | ----- | --------------- |
| PostgreSQL 16 | intl-dossier-postgres | 54322 | Database        |
| Redis 7       | intl-dossier-redis    | 6379  | Cache, sessions |

### AI Profile

| Service     | Container                | Port | Purpose        |
| ----------- | ------------------------ | ---- | -------------- |
| AnythingLLM | intl-dossier-anythingllm | 3001 | AI/LLM gateway |

See [ANYTHINGLLM_SETUP.md](./ANYTHINGLLM_SETUP.md) for configuration.

### Monitoring Profile

| Service        | Container                   | Port | Purpose            |
| -------------- | --------------------------- | ---- | ------------------ |
| Prometheus     | intl-dossier-prometheus     | 9090 | Metrics collection |
| Grafana        | intl-dossier-grafana        | 3002 | Dashboards         |
| Node Exporter  | intl-dossier-node-exporter  | 9100 | System metrics     |
| Redis Exporter | intl-dossier-redis-exporter | 9121 | Redis metrics      |

## Development Workflow

```bash
# 1. Start Docker infrastructure
docker compose --profile ai up -d

# 2. Start backend + frontend locally
pnpm dev

# 3. Access services
# - Frontend: http://localhost:5173
# - Backend:  http://localhost:4000
# - AnythingLLM: http://localhost:3001
# - PostgreSQL: localhost:54322
# - Redis: localhost:6379
```

## Common Commands

```bash
# View all containers
docker ps --filter "name=intl-dossier"

# View logs
docker logs -f intl-dossier-postgres
docker logs -f intl-dossier-redis
docker logs -f intl-dossier-anythingllm

# Restart a service
docker compose restart postgres

# Stop all
docker compose --profile ai --profile monitoring down

# Reset database (WARNING: deletes data)
docker compose down
docker volume rm intl-dossierv20_postgres_data
docker compose up -d
```

## Volumes

| Volume             | Service     | Contains                   |
| ------------------ | ----------- | -------------------------- |
| `postgres_data`    | postgres    | Database files             |
| `redis_data`       | redis       | Cache persistence          |
| `anythingllm_data` | anythingllm | Documents, vectors, config |
| `prometheus_data`  | prometheus  | Metrics history            |
| `grafana_data`     | grafana     | Dashboards, settings       |

## Connection Strings

### From Host Machine

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
REDIS_URL=redis://localhost:6379
ANYTHINGLLM_URL=http://localhost:3001
```

### From Docker Container

```env
DATABASE_URL=postgresql://postgres:postgres@intl-dossier-postgres:5432/postgres
REDIS_URL=redis://intl-dossier-redis:6379
ANYTHINGLLM_URL=http://intl-dossier-anythingllm:3001
```

## Troubleshooting

### Port already in use

```bash
# Find what's using the port
lsof -i :54322

# Kill the process or change port in docker-compose.yml
```

### Container keeps restarting

```bash
# Check logs
docker logs intl-dossier-<service> --tail 50

# Check health
docker inspect intl-dossier-<service> | grep -A 10 Health
```

### Reset everything

```bash
docker compose down --volumes --remove-orphans
docker compose up -d
```

---

_Last updated: 2025-12-06_
