# v7.0 GPU-Host Deploy Runbook

The pre-v7.0 droplet (2-vCPU / 4 GB, no GPU) **cannot** run v7.0 — the AI stack
(`vllm` serving `gemma-4-12B-it`, TEI embed + rerank) needs an NVIDIA GPU, and the
frontend `vite build` OOMs under 4 GB. This runbook stands v7.0 up on a GPU host.

**The CI/CD is already wired** — `.github/workflows/deploy.yml` SSHes to the host and
runs `docker compose -f deploy/docker-compose.prod.yml build --parallel && up -d`
(full stack, with rollback + health checks). You only need to (1) provision the host,
(2) prepare it once, (3) add two GitHub secrets, (4) trigger the deploy.

## 1. Provision the host

| Resource       | Minimum                                           | Why                                                                                                                                      |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **GPU VRAM**   | **≥ 24 GB** (A10G / L4-24G / A100-40G / RTX 4090) | `gemma-4-12B-it` at `--gpu-memory-utilization 0.90` (fp16 ~24 GB) + TEI BGE-M3 + reranker (~2-4 GB). For headroom, 40 GB is comfortable. |
| **System RAM** | ≥ 16 GB                                           | the frontend `vite build` runs on the host (the 4 GB droplet's exact failure).                                                           |
| **Disk**       | ≥ 80 GB                                           | vLLM image + gemma weights (~25 GB) + TEI models + app images.                                                                           |
| **OS**         | Ubuntu 22.04+                                     | with NVIDIA driver + Docker + `nvidia-container-toolkit`.                                                                                |

Candidates: a GPU Droplet (DigitalOcean), AWS `g5.xlarge` (A10G-24G), GCP `g2` (L4),
Lambda/RunPod/Vast, or any box with a ≥24 GB NVIDIA GPU.

## 2. Prepare the host (once)

```bash
# NVIDIA driver + container toolkit (so Docker can see the GPU)
#   verify: docker run --rm --gpus all nvidia/cuda:12.4.0-base nvidia-smi   → lists the GPU
sudo apt-get update && sudo apt-get install -y docker.io
# install nvidia-container-toolkit per NVIDIA docs, then:
sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker

# Clone the repo to the path deploy.yml expects
sudo git clone https://github.com/alzahrani-khalid/Intl-Dossier-V2.0.git /opt/intl-dossier
cd /opt/intl-dossier/deploy

# Create deploy/.env from the example and fill EVERY value
cp .env.example .env && nano .env
#   REQUIRED: HF_TOKEN (gemma-4-12B-it is gated — accept the license on HF first),
#   SUPABASE_URL + keys, JWT/keystone vars, ALLOWED_ORIGINS, Redis, etc.
#   (see .env.example; the AI service URLs like VLLM_BASE_URL are internal compose DNS — leave as-is)
```

Add the SSH **public** key you'll use for deploy to `~/.ssh/authorized_keys` (root).

## 3. Add GitHub secrets (repo → Settings → Secrets → Actions)

| Secret            | Value                                                       |
| ----------------- | ----------------------------------------------------------- |
| `DROPLET_HOST`    | the GPU host's public IP / DNS                              |
| `DROPLET_SSH_KEY` | the **private** SSH key (matching the public key in step 2) |

(Optional for live evals: `EVAL_AI_URL` + `EVAL_AI_API_KEY` to flip the CI `eval-gate`
live-judge step on — non-blocking.)

## 4. First deploy

- **Manual:** Actions → **Deploy** → _Run workflow_ on `main` (`workflow_dispatch`).
- **Auto:** every green **CI** run on `main` triggers Deploy (`workflow_run`).

The first run downloads the gemma weights (~25 GB) — give it time; `command_timeout`
is 10 min for the compose step, so on a cold host **pre-pull once manually** on the box:
`cd /opt/intl-dossier/deploy && docker compose -f docker-compose.prod.yml pull vllm tei-embed tei-rerank && docker compose -f docker-compose.prod.yml up -d vllm` and let gemma download before the first CI-driven deploy.

## 5. Verify (the deploy-gated checks become runnable here)

```bash
docker compose -f docker-compose.prod.yml ps          # all healthy
curl -f http://localhost/health && curl -f http://localhost/api/health
curl -s localhost:8000/v1/models | jq .                # vllm → gemma-4-12b   (INFRA-01)
curl -s -XPOST localhost:<tei>/embed -d '{"inputs":"x"}' | jq 'length'   # 1024  (INFRA-02)
```

Then the previously deploy-gated verifications run for real:

- **P74 live evals:** set `EVAL_AI_URL` → `pnpm --filter agent-runtime test:eval` records EVAL-01 ≥ 0.80 / EVAL-03 ≥ 0.75.
- **P74 EVAL-04 network-block UAT:** `74-UAT.md` (CDP `setBlockedURLs`, 3 surfaces, EN+AR).
- **P73 UAT:** `73-05-SUMMARY.md` (HITL writes, actor == auth.uid(), EN+AR).
- **P72 deploy-time tasks:** bge-m3 re-embed (`reembed-rag-chunks.ts`), `mastra_threads`/`mastra_messages` RLS re-apply.

## Notes

- The compose `vllm` service has `deploy.resources.reservations.devices: [nvidia, gpu]` — Docker Compose honors this with the nvidia runtime; no compose edit needed.
- Rollback is automatic on health-check failure (deploy.yml re-tags `:rollback` images).
- To swap the model, change `--model` / `--served-model-name` in `docker-compose.prod.yml`.
