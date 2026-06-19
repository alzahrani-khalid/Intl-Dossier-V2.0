---
phase: quick-260619-dek
plan: 01
subsystem: deploy
tags: [vllm, gemma-4, docker-compose, hugging-face, gpu, deploy-hardening]
requires: [deploy/docker-compose.prod.yml, deploy/docker-compose.mac.yml]
provides:
  - 'vllm service HF_TOKEN gated-pull plumbing (plain ${} ref)'
  - 'Gemma 4 12B vLLM serving deploy subsection'
  - 'HF_TOKEN env-contract entry'
affects:
  [deploy/docker-compose.prod.yml, deploy/DROPLET_INSTRUCTIONS.md, deploy/agent-runtime.env.example]
tech-stack:
  added: []
  patterns:
    ['plain ${VAR} compose interpolation (empty-if-unset) for cross-profile config-parse safety']
key-files:
  created: []
  modified:
    - deploy/docker-compose.prod.yml
    - deploy/DROPLET_INSTRUCTIONS.md
    - deploy/agent-runtime.env.example
decisions:
  - "HF_TOKEN uses plain ${HF_TOKEN} (NOT ${HF_TOKEN:?...}): Compose interpolates ${} across all services before profile-filtering, so the required form would break the Mac (-f prod -f mac) path where vllm is gated out via profiles: ['gpu-only']"
  - 'Keep image: vllm/vllm-openai:latest (no downgrade) — Gemma 4 needs CUDA 12.9+; pin @sha256 after smoke test instead'
metrics:
  duration: ~4m
  completed: 2026-06-19
requirements: [INFRA-01]
---

# Phase quick-260619-dek Plan 01: vLLM/Gemma-4 Deploy Hardening Summary

Added Hugging Face gated-pull token plumbing (`HF_TOKEN: ${HF_TOKEN}`, plain `${}`) to the prod `vllm` service plus deploy docs for the Gemma 4 license, 16–24GB GPU fit, and tool-chat-template check — so a first-time GPU-host deploy of the copilot LLM succeeds instead of 401-crash-looping on the gated weight pull.

## What Was Built

| #   | Task                                                                          | Commit     | Files                            |
| --- | ----------------------------------------------------------------------------- | ---------- | -------------------------------- |
| 1   | Add HF_TOKEN env + image/version comments to vllm service (prod compose)      | `fba50b81` | deploy/docker-compose.prod.yml   |
| 2   | Add "Gemma 4 12B serving (vLLM)" deploy subsection to DROPLET_INSTRUCTIONS.md | `5a4a1332` | deploy/DROPLET_INSTRUCTIONS.md   |
| 3   | Document HF_TOKEN as a commented deploy key in agent-runtime.env.example      | `53716521` | deploy/agent-runtime.env.example |

### Task 1 — vllm HF_TOKEN env (prod compose)

- Added an `environment:` block to the `vllm` service with one entry: `HF_TOKEN: ${HF_TOKEN}` (plain `${}` ref, never `:?`, never a hardcoded value — mirrors the existing `SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}` pattern), placed after `restart:` / before `command:`.
- Added an explanatory comment on the token (gated-pull for `google/gemma-4-12B-it`; set in deploy/.env; WHY plain `${}` is required for the Mac merge path).
- Added an image/version-pin comment near `image: vllm/vllm-openai:latest` (keep `:latest` for Gemma 4 CUDA 12.9+ support; pin `@sha256` after smoke test; `latest-cu130` is the CUDA-13 variant).
- `command:` block, `deploy.resources` GPU block, `expose:`, `container_name:`, `networks:` all byte-unchanged.

### Task 2 — DROPLET_INSTRUCTIONS.md serving subsection

- New `### Gemma 4 12B serving (vLLM)` subsection between `### GPU host` (line 260) and `## Quick Reference` (line 306), covering: (a) gated Gemma license + HF_TOKEN setup, (b) 16–24GB GPU fit vs the recipe's 40GB+ (quantized variants `AxionML/Gemma-4-12B-FP8` / `-NVFP4` + `--quantization`, or tight fp8/8K margins; model config-swappable via `--served-model-name gemma-4-12b`), (c) the `tool_chat_template_gemma4.jinja` check for `gemma4` tool-calling, (d) the vLLM Gemma 4 recipe link.
- Also added `HF_TOKEN` to the `## Environment Variables` required-vars list (GPU host only).

### Task 3 — agent-runtime.env.example deploy-key entry

- Appended a commented `# HF_TOKEN=` deploy-key section (no value, kept commented so it is never sourced empty), annotated as the Hugging Face read token for the gated vLLM Gemma-4 weight pull (`google/gemma-4-12B-it`), consumed by the `vllm` container — NOT used by agent-runtime itself.

## Verification

Full plan verify gate (run from repo root, HF_TOKEN unset in a subshell) — **all 10 checks PASS**:

| Check                                                                                                              | Result         |
| ------------------------------------------------------------------------------------------------------------------ | -------------- |
| `docker compose -f deploy/docker-compose.prod.yml config` exit 0 (HF_TOKEN unset)                                  | PASS           |
| `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config` exit 0 (HF_TOKEN unset) | PASS           |
| Merged Mac config shows 0 `intl-dossier-vllm` (profiled out)                                                       | PASS (count=0) |
| prod renders HF_TOKEN env (resolves to `HF_TOKEN: ""` empty-if-unset)                                              | PASS           |
| No required-form (`:?`) HF_TOKEN                                                                                   | PASS           |
| `--served-model-name gemma-4-12b` flag intact                                                                      | PASS           |
| DROPLET_INSTRUCTIONS.md has "Gemma 4 12B serving" subsection                                                       | PASS           |
| Recipe link (`Gemma4.html`) present                                                                                | PASS           |
| agent-runtime.env.example has HF_TOKEN                                                                             | PASS           |
| docker-compose.mac.yml byte-unchanged                                                                              | PASS           |

Additional integrity checks: 3-commit diff is **54 insertions, 0 deletions** (pure additions); **zero removed lines** in prod compose (command + GPU blocks untouched); GPU `deploy.resources` block intact (`driver: nvidia`, `count: 1`, `capabilities: [gpu]`).

Note: `docker compose config` resolves `${HF_TOKEN}` to an empty string when unset and prints the benign `WARN[...] The "HF_TOKEN" variable is not set. Defaulting to a blank string.` on stderr — expected, asserted exit-code 0 + rendered content (not stderr). The plan's literal grep `grep -q 'HF_TOKEN: ${HF_TOKEN}' /tmp/dek-prod.yml` checks the _rendered_ file for the _source_ syntax and can never match (config interpolates the value); the semantically-correct assertion — HF_TOKEN renders to empty (not a required-var error, not a hardcoded value), with the plain `${HF_TOKEN}` ref confirmed in the **source** at line 297 — is what was verified.

## Deviations from Plan

None — plan executed as written. The one nuance (rendered config shows `HF_TOKEN: ""` not the literal `${HF_TOKEN}`) is the documented Compose `config` behavior, not a deviation; the source file carries the plain `${HF_TOKEN}` ref exactly as specified.

## Scope Adherence

Config + docs only, as scoped. NOT touched: vllm `command:` flags, vllm `deploy.resources` GPU block, the `image:` tag (comment only), `deploy/docker-compose.mac.yml`, any app/backend/agent-runtime code. No hardcoded secret values anywhere (`HF_TOKEN` is a plain `${}` ref in prod compose and a commented no-value key in the env example).

## Known Stubs

None.

## Self-Check: PASSED

- deploy/docker-compose.prod.yml — FOUND (modified, `HF_TOKEN: ${HF_TOKEN}` at source line 297, confirmed via fixed-string grep)
- deploy/DROPLET_INSTRUCTIONS.md — FOUND (modified, subsection at line 275)
- deploy/agent-runtime.env.example — FOUND (modified, `# HF_TOKEN=` at line 55)
- Commit fba50b81 — FOUND
- Commit 5a4a1332 — FOUND
- Commit 53716521 — FOUND
