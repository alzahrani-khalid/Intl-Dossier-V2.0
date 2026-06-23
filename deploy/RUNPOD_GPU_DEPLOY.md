# v7.0 GPU Deploy — RunPod (native, no Docker) — VERIFIED RUNBOOK

This is the **actually-executed** bring-up that got v7.0's AI (vLLM + gemma + the
Mastra copilot) running on a GPU, captured so it's reproducible. Use it when DO GPU
Droplets are out of stock (common) — RunPod Pods have instant 48 GB capacity.

> Complements `GPU_HOST_DEPLOY.md` (the docker-compose path). RunPod **Pods are
> containers, not VMs** (no nested-Docker GPU), so this runs the services **natively**.

## 0. Key finding — the model

**`google/gemma-4-12b-it` does NOT exist on HuggingFace** (the v7.0 spec assumed a
forward-looking "Gemma 4"). The real latest 12B Gemma is **`google/gemma-3-12b-it`**.
We serve it under `--served-model-name gemma-4-12b` so the agent-runtime + the
`INFRA-01` check (which expect `gemma-4-12b`) work unchanged. **TODO for the repo:**
update `deploy/docker-compose.prod.yml` `--model google/gemma-4-12B-it` →
`google/gemma-3-12b-it` (keep `--served-model-name gemma-4-12b`).

## 1. Provision the Pod

RunPod → **Pods** → **RTX 6000 Ada (48 GB, ~$0.77/hr)** (or L40S/A100-80) → template
**RunPod PyTorch 2.8** (CUDA 12.8 + Ubuntu 24.04) → **Container disk 60 GB** (critical —
gemma is ~24 GB) → enable **SSH**, add your pubkey under Settings → SSH Public Keys.
Connect → **SSH over exposed TCP**: `ssh root@<ip> -p <port> -i ~/.ssh/id_ed25519`.

## 2. Base + repo + deps

```bash
mkdir -p /workspace/v7 /root/hf
# Node 22 + pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs
npm i -g pnpm
# repo (public)
git clone --depth 1 https://github.com/alzahrani-khalid/Intl-Dossier-V2.0.git /workspace/intl-dossier
cd /workspace/intl-dossier && pnpm install            # node_modules ~ on /workspace volume
pnpm --filter agent-runtime build                     # builds dist/
# scp your deploy/.env (Supabase URL/keys + JWT_SECRET) onto the box:
#   scp -P <port> deploy/.env root@<ip>:/workspace/intl-dossier/deploy/.env
```

## 3. Secrets / env (GOTCHAS baked in)

```bash
cat > /workspace/v7/secrets.env <<EOF
export HF_TOKEN=<read token; accept gemma-3-12b-it license at hf.co/google/gemma-3-12b-it FIRST>
export HUGGING_FACE_HUB_TOKEN=<same>
export HF_HOME=/root/hf            # container disk — NOT /workspace (50GB volume quota too tight)
export HF_HUB_DISABLE_XET=1        # hf_xet writer fails on RunPod's network FS — disable it
EOF
```

## 4. Install vLLM (PEP 668 gotcha) + download gemma

```bash
# Ubuntu 24.04 is externally-managed → pip needs --break-system-packages
tmux new -d -s inst 'python3 -m pip install --break-system-packages -U vllm'   # ~10 min
# pre-download FULL weights (vLLM inline download is flaky; do it explicitly, xet off, to /root/hf)
source /workspace/v7/secrets.env
tmux new -d -s dl 'source /workspace/v7/secrets.env; python3 - <<PY
from huggingface_hub import snapshot_download
print("DONE", snapshot_download("google/gemma-3-12b-it", max_workers=4))
PY'
# verify 5 shards: ls /root/hf/hub/models--google--gemma-3-12b-it/snapshots/*/ | grep -c safetensors  → 5
```

## 5. Serve gemma (vLLM, OpenAI-compatible :8000)

```bash
cat > /workspace/v7/start-gemma.sh <<'SH'
#!/bin/bash
source /workspace/v7/secrets.env
until python3 -c "import vllm" 2>/dev/null; do sleep 10; done
exec python3 -m vllm.entrypoints.openai.api_server \
  --model google/gemma-3-12b-it --served-model-name gemma-4-12b \
  --host 0.0.0.0 --port 8000 --gpu-memory-utilization 0.75 --max-model-len 8192
SH
# NB: do NOT pass --download-dir /workspace/hf — it overrides HF_HOME and re-downloads (quota!).
tmux new -d -s gemma 'bash /workspace/v7/start-gemma.sh > /workspace/v7/gemma.log 2>&1'
# ready when /v1/models lists gemma-4-12b (~37 GB on the GPU):
curl -s localhost:8000/v1/models
curl -s localhost:8000/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"gemma-4-12b","messages":[{"role":"user","content":"hi"}],"max_tokens":12}'
```

## 6. Copilot server (Mastra) on :4100

`pnpm start` (node dist/index.js) is **only a /health bootstrap** — the AG-UI `/chat`
copilot route lives in the **Mastra server** (`src/mastra/index.ts`, `server.port=4100`,
`registerCopilotKit({path:'/chat'})`). Start it with the Mastra CLI:

```bash
tmux new -d -s mastra 'cd /workspace/intl-dossier/agent-runtime;
  set -a; source /workspace/intl-dossier/deploy/.env; set +a;
  export VLLM_BASE_URL=http://localhost:8000 VLLM_MODEL=gemma-4-12b HF_HOME=/root/hf PORT=4100;
  npx -y mastra@latest dev > /workspace/v7/mastra.log 2>&1'
# ready (~26s) when ss -tlnp shows node on :4100 and  curl -o/dev/null -w "%{http_code}" localhost:4100/chat → 405 (route exists; POST/SSE)
```

Keystone holds: agent-runtime uses the **anon key + caller JWT**, never the service-role.

## 7. Expose / reach it

Add an **HTTP port (8000 or 4100)** in the RunPod pod settings to reach vLLM / the copilot
externally, or curl-test on the box. For a clickable UI, the **frontend** must also be
built + served (a further step; not done here — the AI engine is the milestone).

## Gotchas hit (all fixed above)

1. `pip install` blocked on Ubuntu 24.04 (PEP 668) → `--break-system-packages`.
2. `hf_xet` "Internal Writer Error" on RunPod network FS → `HF_HUB_DISABLE_XET=1`.
3. `/workspace` 50 GB volume **quota exceeded** with model+node_modules → cache to `/root/hf` (60 GB container disk).
4. vLLM `--download-dir /workspace/hf` re-downloaded into the quota'd volume → **drop the flag**, use `HF_HOME`.
5. vLLM inline download grabbed only 2/5 shards → pre-download fully via `snapshot_download`.
6. `gemma-4-12b-it` doesn't exist → `gemma-3-12b-it` served as `gemma-4-12b`.
7. `node dist/index.js` is health-only; the copilot is the **Mastra** server (`mastra dev`).

## Caveats

- RunPod Pod auto-expires (~24 h) + container disk is ephemeral; `/workspace` (the 50 GB volume) persists. Re-run §4–6 after a restart (gemma re-downloads unless cached on the volume).
- Mastra `dev` is a dev server (in-memory store, file-watch). For durable prod, `mastra build` → run `.mastra/output`, with a persistent storage adapter.
