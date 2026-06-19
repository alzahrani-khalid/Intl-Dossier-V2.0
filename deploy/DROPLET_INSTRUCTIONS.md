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

| Service               | Container Name             |
| --------------------- | -------------------------- |
| Nginx (reverse proxy) | intl-dossier-nginx         |
| Frontend (React/Vite) | intl-dossier-frontend      |
| Backend (Express API) | intl-dossier-backend       |
| Redis (cache)         | intl-dossier-redis         |
| AnythingLLM (AI)      | intl-dossier-anythingllm   |
| Certbot (SSL)         | intl-dossier-certbot       |
| Copilot runtime       | intl-dossier-agent-runtime |
| vLLM (Gemma 4 12B)    | intl-dossier-vllm          |
| TEI embeddings        | intl-dossier-tei-embed     |
| TEI rerank            | intl-dossier-tei-rerank    |

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
- `HF_TOKEN` (GPU host only — Hugging Face read token for the gated `vllm`
  Gemma-4 weight pull; see "Gemma 4 12B serving (vLLM)" below)

## Phase 72 — Agent Platform (copilot runtime, vLLM, TEI)

Phase 72 adds four **internal-only** services to `docker-compose.prod.yml`
(`agent-runtime`, `vllm`, `tei-embed`, `tei-rerank`). None publish ports — they
join the `intl-dossier` network and are reachable by service name only. nginx is
the single externally-proxied entry point.

### nginx copilot SSE proxy

nginx reverse-proxies the CopilotKit SSE route to the copilot runtime:

```
/api/copilot/  ->  http://agent-runtime:4100/   (trailing slash strips the prefix)
```

so the provider's `runtimeUrl` `/api/copilot/chat` lands on the runtime's `/chat`
route. The `/api/copilot/` location precedes the generic `/api/` location (more
specific prefix wins) and uses SSE-friendly settings (`proxy_buffering off;`,
`proxy_read_timeout 3600s;`, `Connection '';`) so streamed tokens are not
buffered. Wired in **both** `nginx/nginx.conf` (HTTP) and `nginx/nginx.prod.conf`
(HTTPS).

### New env vars (deploy/.env)

The full contract + descriptions are in `deploy/agent-runtime.env.example`. Add
these to `deploy/.env` on the host:

- `ALLOWED_ORIGINS` — **SECRET**, comma-separated CORS allow-list (the deployed
  origin, e.g. `https://your-domain.com`). **Never `*`.** Unset → ACAO:null on
  deployed origins (the copilot's browser calls fail).
- `MASTRA_PG_URL` — direct Postgres connection string for `@mastra/pg` thread
  storage (same Supabase Postgres; `postgresql://postgres:<pw>@db.<project>.supabase.co:5432/postgres`).

The agent-runtime also reads `SUPABASE_URL` + `SUPABASE_ANON_KEY` (already
present) and the internal `VLLM_BASE_URL` / `TEI_EMBED_URL` / `TEI_RERANK_URL`
(hard-coded service names in compose, no `.env` entry needed). It is shipped the
**anon key only** (caller-JWT keystone) — never the service-role key.

### GPU host (deploy-time, before the phase gate)

`vllm` requires an **NVIDIA GPU host (16–24 GB)** with the NVIDIA container
runtime. Before standing the phase up, on the GPU host:

1. Confirm the GPU + NVIDIA Docker runtime are available (`docker run --rm --gpus all nvidia-smi`).
2. Pull the model: `google/gemma-4-12B-it` (the compose `--model` arg).
3. Validate it fits at FP8/QAT with an 8K context window before the phase gate
   (`docker compose -f docker-compose.prod.yml up vllm`, then
   `curl http://localhost:8000/v1/models` from inside the network).

`tei-embed` (`BAAI/bge-m3`) and `tei-rerank` (`BAAI/bge-reranker-v2-m3`) pull
their model weights on first start; no GPU is strictly required for TEI but a GPU
host improves throughput.

### Gemma 4 12B serving (vLLM)

`google/gemma-4-12B-it` is a **gated** model. The compose `vllm` service will
401 and crash-loop on the first weight pull unless a Hugging Face token is
supplied. Cover the four points below before standing the service up.

1. **Gated license + HF_TOKEN.** Open the `google/gemma-4-12B-it` page on Hugging
   Face, accept the Gemma license, then create a Hugging Face **read** token. Set
   `HF_TOKEN` in `/opt/intl-dossier/deploy/.env` on the GPU host. The compose
   `vllm` service reads `HF_TOKEN` from that `.env` (plain `${HF_TOKEN}`
   reference); without it the gated pull fails and vLLM crash-loops on start.

2. **GPU fit (16–24 GB vs the recipe's 40 GB+).** The vLLM Gemma 4 recipe
   recommends **40 GB+** of VRAM for the full-precision `google/gemma-4-12B-it`.
   To fit the current 16–24 GB GPU, either: (i) point `--model` at a **quantized**
   weight variant — for example `AxionML/Gemma-4-12B-FP8` or
   `AxionML/Gemma-4-12B-NVFP4` — with a matching `--quantization` flag; or (ii)
   accept tight margins on the current `--kv-cache-dtype fp8 --max-model-len 8192`
   and validate headroom during the smoke test. The model is config-swappable via
   `--served-model-name gemma-4-12b`, so the app/caller is unaffected by a weight
   swap (callers always address the stable `gemma-4-12b` name).

3. **Tool chat template.** The command already sets `--tool-call-parser gemma4`.
   Verify whether a `--chat-template .../tool_chat_template_gemma4.jinja` is also
   required for correct `gemma4` tool-calling on the chosen build, and validate
   tool-call output during the smoke test.

4. **Recipe reference.** Follow the vLLM Gemma 4 serving recipe for the
   authoritative fit/quantization/template guidance:
   https://docs.vllm.ai/projects/recipes/en/latest/Google/Gemma4.html

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
