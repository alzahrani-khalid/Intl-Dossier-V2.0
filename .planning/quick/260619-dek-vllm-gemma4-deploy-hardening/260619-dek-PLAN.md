---
phase: quick-260619-dek
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - deploy/docker-compose.prod.yml
  - deploy/DROPLET_INSTRUCTIONS.md
  - deploy/agent-runtime.env.example
autonomous: true
requirements: [INFRA-01]

must_haves:
  truths:
    - 'deploy/docker-compose.prod.yml `vllm` service carries HF_TOKEN: ${HF_TOKEN} (plain ${} ref, gated-pull token for google/gemma-4-12B-it) so the container can authenticate the gated weight pull instead of 401-crash-looping on first start'
    - 'With HF_TOKEN UNSET, `docker compose -f deploy/docker-compose.prod.yml config` parses clean (no required-var error)'
    - 'With HF_TOKEN UNSET, `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config` parses clean AND the merged Mac config shows zero intl-dossier-vllm container (vllm stays profiled out)'
    - 'DROPLET_INSTRUCTIONS.md documents the Gemma 4 gated license + HF_TOKEN, the 16-24GB GPU-fit path (quantized variant or tight fp8 margins), the gemma4 tool-chat-template check, and links the vLLM Gemma 4 recipe'
    - 'agent-runtime.env.example lists HF_TOKEN as a commented required deploy key (no value) noted as the gated vLLM Gemma-4 pull token, not consumed by agent-runtime itself'
  artifacts:
    - path: 'deploy/docker-compose.prod.yml'
      provides: 'vllm service environment block with HF_TOKEN + image/version comments'
      contains: 'HF_TOKEN: ${HF_TOKEN}'
    - path: 'deploy/DROPLET_INSTRUCTIONS.md'
      provides: 'Gemma 4 12B serving (vLLM) deploy subsection'
      contains: 'Gemma 4 12B serving'
    - path: 'deploy/agent-runtime.env.example'
      provides: 'HF_TOKEN commented deploy-key entry'
      contains: 'HF_TOKEN'
  key_links:
    - from: 'deploy/docker-compose.prod.yml vllm.environment.HF_TOKEN'
      to: 'deploy/.env (HF_TOKEN at up-time) + the SUPABASE_ANON_KEY ${} secret pattern'
      via: 'plain ${HF_TOKEN} interpolation (empty-if-unset)'
      pattern: "HF_TOKEN:\\s*\\$\\{HF_TOKEN\\}"
---

<objective>
Harden the Phase-72 vLLM/Gemma-4 serving config for deploy-correctness. `google/gemma-4-12B-it`
is a GATED model (released 2026-06-03); the prod compose `vllm` service currently passes NO
Hugging Face token, so on first start it would 401 on the gated weight pull and crash-loop —
a real deploy-blocker. This plan adds the token plumbing (as a plain `${HF_TOKEN}` reference,
never hardcoded) plus the deploy documentation for accepting the license, fitting a 16-24GB
GPU, and the tool-chat-template check.

Purpose: make a first-time GPU-host deploy of the copilot LLM actually succeed instead of
crash-looping on a missing gated-pull credential.
Output: token env on the `vllm` service + image/version guidance comments + a Gemma 4 serving
deploy subsection + the HF_TOKEN env-contract entry.

SCOPE GUARD — config + docs ONLY. Do NOT touch:

- the `vllm` `command:` flags (model, served-model-name, tool-call-parser, max-model-len,
  kv-cache-dtype, gpu-memory-utilization) — unchanged.
- the `vllm` `deploy.resources` GPU block (driver nvidia, count 1, capabilities [gpu]) — unchanged.
- the `image:` TAG — stays `vllm/vllm-openai:latest` (do NOT downgrade; Gemma 4 needs a recent
  latest/nightly CUDA 12.9+ build — older version tags lack Gemma 4 support). Comment only.
- deploy/docker-compose.mac.yml — NOT edited (the `vllm: profiles: ['gpu-only']` gate stays as-is).
- any app logic, any backend/agent-runtime code.
  </objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# The three files to edit (already verified into context):

@deploy/docker-compose.prod.yml
@deploy/agent-runtime.env.example

# Conventions: no-hardcoded-secrets; ${} secret pattern (e.g. SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY})

@./CLAUDE.md

<facts>
VERIFIED 2026-06-19 against the live files + a baseline `docker compose config` run
(docker compose v5.1.4 is installed; both configs parse clean with HF_TOKEN UNSET; the
merged Mac config already shows 0 `intl-dossier-vllm`). Use these — do not re-derive:

- deploy/docker-compose.prod.yml `vllm` service body is at lines ~281-303:
  - line 282 `image: vllm/vllm-openai:latest`
  - line 283 `container_name: intl-dossier-vllm`
  - line 284 `restart: unless-stopped`
  - lines 285-292 `command: >` block (DO NOT TOUCH)
  - lines 293-294 `expose: ['8000']`
  - lines 295-301 `deploy.resources.reservations.devices` GPU block (DO NOT TOUCH)
  - lines 302-303 `networks: [intl-dossier]`
  - The service currently has NO `environment:` key. Insert one (the new HF_TOKEN block).
    Place it adjacent to the other top-level keys (e.g. after `restart:` / before `command:`,
    OR after `expose:` — any valid position; keep YAML 2-space indent consistent with siblings).
  - The descriptive comment header for the service is lines 272-280 (ends with the GPU-host
    pointer). Add the image/version-pin comment near the `image:` line.

- The existing secret pattern to MIRROR (NOT `:?`): `SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}`
  (prod line 77) and `ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}` (prod line 257). Plain `${VAR}`.

- WHY plain `${HF_TOKEN}` and NOT `${HF_TOKEN:?...}`: Docker Compose interpolates `${}` across
  ALL services BEFORE profile-filtering. The Mac path (`-f prod -f mac`) profiles `vllm` out
  via `profiles: ['gpu-only']`, but the `:?` (required) form would STILL error during the
  pre-filter interpolation when HF_TOKEN is unset → `docker compose -f prod -f mac config`
  would fail on the Mac path. Plain `${HF_TOKEN}` is empty-if-unset → both configs parse;
  prod supplies the real value via deploy/.env at up-time.

- deploy/DROPLET_INSTRUCTIONS.md structure (287 lines):
  - `## Phase 72 — Agent Platform (copilot runtime, vLLM, TEI)` at line 220
  - `### GPU host (deploy-time, before the phase gate)` at lines 258-271 (already mentions
    pulling `google/gemma-4-12B-it` and an 8K-context FP8 fit-check, but says NOTHING about the
    gated license, HF token, quantized-variant fit, tool chat template, or the recipe link)
  - `## Quick Reference` at line 273
  - The new `### Gemma 4 12B serving (vLLM)` subsection slots in AFTER the `### GPU host` block
    (after line 271) and BEFORE `## Quick Reference` (line 273).
  - `## Environment Variables` required-vars list is lines 209-218 (does NOT list HF_TOKEN);
    optionally add HF_TOKEN there too, but the authoritative new doc is the serving subsection.

- deploy/agent-runtime.env.example ends at line 48 (the OTEL_EXPORTER block, lines 45-47).
  HF_TOKEN is absent. Append a new commented section at the end. It is a model-PULL credential
  consumed by the `vllm` container, NOT by agent-runtime — so it is documented as commented /
  no-value, clearly marked "not used by agent-runtime itself".

- The vLLM Gemma 4 recipe URL (link verbatim):
  https://docs.vllm.ai/projects/recipes/en/latest/Google/Gemma4.html
- Quantized weight examples for 16-24GB fit (mention as examples, not a hard pin):
  `AxionML/Gemma-4-12B-FP8` or `-NVFP4` with a matching `--quantization` flag.
- The served-model-name knob that keeps the app unaffected on a model swap: `gemma-4-12b`
  (via `--served-model-name gemma-4-12b`, already in the command block).
- The tool-calling chat template to verify-need-for: `tool_chat_template_gemma4.jinja`
  (for correct `gemma4` tool-calling; the command already sets `--tool-call-parser gemma4`).
- The CUDA-13 image variant to name as an option: `vllm/vllm-openai:latest-cu130`.
  </facts>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Add HF_TOKEN env + image/version comments to the vllm service (prod compose)</name>
  <files>deploy/docker-compose.prod.yml</files>
  <action>
Edit ONLY the `vllm` service block (~lines 281-303). Two surgical additions, nothing else:

(1) Add an `environment:` block to the `vllm` service containing exactly one entry:
`HF_TOKEN: ${HF_TOKEN}` — a PLAIN `${}` reference, NOT `${HF_TOKEN:?...}` and NEVER a
hardcoded value (mirror the existing `SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}` pattern).
Place the `environment:` key as a sibling of `image:`/`command:`/`expose:` at the service's
2-space indent (e.g. after `restart: unless-stopped`, before `command:`). Above the
`HF_TOKEN:` line add a short comment: this is the gated-pull token for
`google/gemma-4-12B-it`; accept the Gemma license on HF and set HF_TOKEN in deploy/.env;
plain `${}` (empty-if-unset) is REQUIRED so `-f prod -f mac config` still parses on the
Mac path where vllm is profiled out (the `:?` form would error pre-profile-filter).

(2) Add a comment near the existing `image: vllm/vllm-openai:latest` line (keep the tag —
do NOT downgrade): note that Gemma 4 needs a recent latest/nightly (CUDA 12.9+) build —
older version tags lack Gemma 4 support; after a successful smoke test, pin to a `@sha256`
digest of the validated build for reproducibility; `vllm/vllm-openai:latest-cu130` is the
CUDA-13 variant.

DO NOT modify the `command:` block, the `deploy.resources` GPU block, `expose:`,
`container_name:`, or `networks:`. Keep YAML indentation consistent with sibling services
(2 spaces). No raw secret value anywhere.
</action>
<verify>
<automated>HF_TOKEN unset; `docker compose -f deploy/docker-compose.prod.yml config` exits 0; rendered config contains `HF_TOKEN: ${HF_TOKEN}` literally (plain ref, NOT `:?`) AND still contains the unchanged `--served-model-name gemma-4-12b` command flag. See verification block for the exact command.</automated>
</verify>
<done>The `vllm` service has an `environment:` block with `HF_TOKEN: ${HF_TOKEN}` (no hardcoded value, no `:?`), an explanatory comment on the token, and an image/version-pin comment; command + GPU blocks are byte-unchanged; `docker compose -f deploy/docker-compose.prod.yml config` parses clean with HF_TOKEN unset.</done>
</task>

<task type="auto">
  <name>Task 2: Add the "Gemma 4 12B serving (vLLM)" deploy subsection to DROPLET_INSTRUCTIONS.md</name>
  <files>deploy/DROPLET_INSTRUCTIONS.md</files>
  <action>
Insert a new `### Gemma 4 12B serving (vLLM)` subsection in deploy/DROPLET_INSTRUCTIONS.md
AFTER the existing `### GPU host (deploy-time, before the phase gate)` block (after line 271)
and BEFORE `## Quick Reference` (line 273). Do not rewrite the existing `### GPU host` block;
this new subsection complements it. Cover, in order:

(a) Gated model + token: `google/gemma-4-12B-it` is gated — accept the Gemma license on the
model's Hugging Face page and create a Hugging Face READ token, then set `HF_TOKEN` in
deploy/.env on the GPU host. Required for the gated weight pull; without it vLLM 401s and
crash-loops on first start. The compose `vllm` service reads `HF_TOKEN` from deploy/.env.
(b) GPU FIT (16-24GB target vs the recipe's 40GB+ for full weights): the vLLM Gemma 4 recipe
recommends 40GB+ for the full `google/gemma-4-12B-it`. To fit the current 16-24GB GPU
either (i) use a quantized weight variant — e.g. `AxionML/Gemma-4-12B-FP8` or `-NVFP4` —
with a matching `--quantization` flag, or (ii) accept tight margins on the current
`--kv-cache-dtype fp8 --max-model-len 8192`. The model is config-swappable via
`--served-model-name gemma-4-12b`, so the app/caller is unaffected by a weight swap.
(c) Tool chat template: verify whether `--chat-template .../tool_chat_template_gemma4.jinja`
is needed for correct `gemma4` tool-calling (the command already sets
`--tool-call-parser gemma4`); validate tool-call output during the smoke test.
(d) Link the vLLM Gemma 4 recipe:
https://docs.vllm.ai/projects/recipes/en/latest/Google/Gemma4.html

Follow the file's existing markdown voice/format (sentence-case headings, plain prose,
inline code for flags/model ids). Do NOT introduce any flag/command CHANGE — this is guidance
on options the operator may choose at deploy time, not an instruction to edit compose.
Optionally also add `HF_TOKEN` to the `## Environment Variables` required-vars list (209-218).
</action>
<verify>
<automated>`grep -n 'Gemma 4 12B serving' deploy/DROPLET_INSTRUCTIONS.md` matches; the recipe URL `docs.vllm.ai/projects/recipes/en/latest/Google/Gemma4.html` is present; `HF_TOKEN` appears in the file. Exact grep in the verification block.</automated>
</verify>
<done>DROPLET_INSTRUCTIONS.md has a `### Gemma 4 12B serving (vLLM)` subsection between `### GPU host` and `## Quick Reference` covering the gated license + HF_TOKEN, the 16-24GB quantized-fit path, the gemma4 tool-chat-template check, and the recipe link.</done>
</task>

<task type="auto">
  <name>Task 3: Document HF_TOKEN as a commented deploy key in agent-runtime.env.example</name>
  <files>deploy/agent-runtime.env.example</files>
  <action>
Append a new commented section to the END of deploy/agent-runtime.env.example (after the
OTEL block, line 47). Add `HF_TOKEN` as a COMMENTED required deploy key with NO value (i.e.
a `# HF_TOKEN=` line, kept commented so it is not accidentally sourced empty), with a one-line
note that it is the Hugging Face read token for the GATED vLLM Gemma-4 weight pull
(`google/gemma-4-12B-it`) consumed by the `vllm` container — NOT used by agent-runtime itself
— and that it must be set in deploy/.env on the GPU host (accept the Gemma license on HF first).

Match the file's existing section style (a `# ----- Section -----` header followed by comment
lines). Do NOT set a token value. Do NOT alter any existing var in the file.
</action>
<verify>
<automated>`grep -n 'HF_TOKEN' deploy/agent-runtime.env.example` matches and the matched line(s) are commented (begin with `#`); the note mentions it is for the gated vLLM Gemma-4 pull and not agent-runtime itself. Exact grep in the verification block.</automated>
</verify>
<done>agent-runtime.env.example ends with a commented HF_TOKEN deploy-key entry (no value) annotated as the gated vLLM Gemma-4 pull token not consumed by agent-runtime; no existing var changed.</done>
</task>

</tasks>

<verification>
Run the full plan verify gate from the repo root (`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0`).
This is the GATE the task specifies; all four checks must pass. Runs in a subshell so `unset HF_TOKEN`
is scoped and does not leak into the surrounding shell:

```bash
(
  set -e
  unset HF_TOKEN

  # 1) PROD config parses clean with HF_TOKEN UNSET (plain ${HF_TOKEN} must NOT error)
  docker compose -f deploy/docker-compose.prod.yml config >/tmp/dek-prod.yml
  echo "PASS: prod config parses with HF_TOKEN unset"

  # 2) MERGED prod+mac config parses clean with HF_TOKEN UNSET
  docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config >/tmp/dek-merged.yml
  echo "PASS: prod+mac merged config parses with HF_TOKEN unset"

  # 3) MERGED Mac config shows ZERO intl-dossier-vllm container (vllm stays profiled out)
  VLLM_CONTAINERS=$(grep -c 'intl-dossier-vllm' /tmp/dek-merged.yml || true)
  test "$VLLM_CONTAINERS" -eq 0 && echo "PASS: merged Mac config has 0 intl-dossier-vllm"

  # 4) prod rendered config carries the plain HF_TOKEN ref AND the command flags are unchanged
  grep -q 'HF_TOKEN: ${HF_TOKEN}' /tmp/dek-prod.yml && echo "PASS: prod renders plain HF_TOKEN ref"
  ! grep -q 'HF_TOKEN.*:?' /tmp/dek-prod.yml && echo "PASS: no required-form (:?) HF_TOKEN"
  grep -q -- '--served-model-name' /tmp/dek-prod.yml && echo "PASS: --served-model-name flag intact"

  # 5) docs deliverables present
  grep -q 'Gemma 4 12B serving' deploy/DROPLET_INSTRUCTIONS.md && echo "PASS: DROPLET serving subsection"
  grep -q 'Gemma4.html' deploy/DROPLET_INSTRUCTIONS.md && echo "PASS: recipe link present"
  grep -q 'HF_TOKEN' deploy/agent-runtime.env.example && echo "PASS: HF_TOKEN in env example"
)
```

Note: `docker compose config` resolves `${HF_TOKEN}` to empty when unset and prints a benign
`WARN[...] The "HF_TOKEN" variable is not set. Defaulting to a blank string.` on stderr — that
is EXPECTED and is NOT a failure (the gate checks exit 0 + the rendered content, not stderr).
If a check fails, fix the corresponding task's file; do not weaken the gate.
</verification>

<success_criteria>

- `vllm` service in deploy/docker-compose.prod.yml carries `HF_TOKEN: ${HF_TOKEN}` (plain ref, no value, no `:?`) with explanatory + image/version comments; command and GPU blocks unchanged.
- `docker compose -f deploy/docker-compose.prod.yml config` parses clean with HF_TOKEN unset.
- `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config` parses clean with HF_TOKEN unset AND renders 0 `intl-dossier-vllm` container.
- deploy/DROPLET_INSTRUCTIONS.md has the `### Gemma 4 12B serving (vLLM)` subsection (gated license + HF_TOKEN, 16-24GB quantized fit, gemma4 tool-chat-template check, recipe link).
- deploy/agent-runtime.env.example documents HF_TOKEN as a commented deploy key (no value) noted as the gated vLLM Gemma-4 pull token not consumed by agent-runtime.
- deploy/docker-compose.mac.yml is byte-unchanged; no app logic / no command-flag / no GPU-intent changes anywhere.
  </success_criteria>

<output>
Create `.planning/quick/260619-dek-vllm-gemma4-deploy-hardening/260619-dek-SUMMARY.md` when done.
</output>
