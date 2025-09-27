---
description: Create or update the feature specification from a natural language feature description.
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

The text the user typed after `/specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. Run the script `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS"` from repo root and parse its JSON output for BRANCH_NAME and SPEC_FILE. All file paths must be absolute.
  **IMPORTANT** You must only ever run this script once. The JSON is provided in the terminal as output - always refer to it to get the actual content you're looking for.
2. Load `.specify/templates/spec-template.md` to understand required sections.
3. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.
4. Report completion with branch name, spec file path, and readiness for the next phase.

Note: The script creates and checks out the new branch and initializes the spec file before writing.

Refinement requirements (resolve critical ambiguities and fill explicit, testable details even if not present in the feature text):

1) AI Integration Clarification
   - Algorithms for pattern detection and scoring:
     - Clustering: MiniBatch K-Means (default `k=8`, tuneable per dataset); include silhouette score in acceptance criteria.
     - Anomaly detection: Isolation Forest (contamination `0.05` default) for outlier scoring in activity/engagement signals.
     - Supervised classification: Gradient Boosted Trees (XGBoost/LightGBM; choose one and record `model_name`, `version`).
   - Embeddings and pgvector:
     - Embedding model: `bge-m3` or `multilingual-e5-large` (Arabic/English). Default embedding dimension `1024`.
     - Table design: store normalized vectors in a dedicated `ai_embeddings` table with columns: `id uuid pk`, `owner_type text`, `owner_id uuid`, `content_hash bytea`, `embedding vector(1024)`, `model text`, `model_version text`, `created_at timestamptz`.
     - Index: prefer `HNSW` (`m=16, ef_construction=200`) when pgvector ≥ 0.6; fallback to `IVFFLAT` (`lists=200`) otherwise. Document both in the spec with a runtime check note.
     - Similarity metric: cosine distance with thresholds — primary match ≥ `0.82`, candidate recall window ≥ `0.65`. Expose as env: `SIMILARITY_PRIMARY=0.82`, `SIMILARITY_CANDIDATE=0.65`.
   - Offline fallback (AnythingLLM unavailable):
     - Health check gate: if LLM health probe fails, automatically disable AI endpoints, return `503` with `Retry-After` for generation routes, and surface a non-blocking “AI temporarily unavailable” banner in UI.
     - Use cached last-successful AI results when available, with `stale` badge and timestamp; never cache longer than 24h.
     - Fallback search: degrade to keyword search + filters (no semantic re-ranking) and deterministic heuristics for summaries (e.g., top-N recent items).
     - Queue async AI jobs (retry with exponential backoff) while continuing core CRUD functionality. All AI failures must be logged and metered.

2) Rate Limiting Specification
   - Scope: “300 requests per minute per user” means per authenticated user ID. For unauthenticated traffic, apply per-IP limit of `60 rpm`.
   - Global ceiling: soft system-wide limit of `15,000 rpm` to protect infrastructure; return `429` when exceeded.
   - Strategy: token-bucket with Redis backend (1-second resolution) using a sliding window additive check for burst smoothing.
   - Bursts: allow burst up to `2x` user limit for ≤10 seconds. Include headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.
   - Separate buckets: dedicated quotas for AI generation routes (`60 rpm` per user) and vector search (`120 rpm` per user).

3) Horizontal Scaling Details
   - Capacity targets: support `1,000` concurrent authenticated users or `10,000 rpm` sustained with p95 API latency ≤ `400 ms`.
   - Scale triggers (scale out when any holds for 5 minutes): CPU ≥ `70%`, Memory ≥ `75%`, p95 latency ≥ `400 ms`, request queue depth ≥ `200`.
   - Policies: increase replicas by `+50%` (min step `+1`, max `x8`), cool-down `5 min`; scale-in when metrics drop below half of thresholds for `10 min`.
   - Orchestration: Docker Compose with external load balancer (e.g., Nginx/Caddy) and `backend` service scalable via `--scale backend=N`; Kubernetes is optional future path.

4) Missing Requirements
   - Search and filtering (all entity types: countries, organizations, forums, persons, dossiers, documents, meetings):
     - Full-text search (Postgres `tsvector`) with faceted filters: type, tags, owner, country, date ranges, status; sorts by relevance, recency, name.
     - Semantic search via pgvector similarity; combine lexical and semantic using reciprocal rank fusion (RRF). Provide API parameters for weights.
   - Reporting module:
     - Built-in reports: Engagement Health, Activity Timeline, Upcoming Obligations, Meeting Outcomes, Document Utilization, AI Usage & Cost.
     - Exports: CSV and XLSX for tabular; PDF for formatted; JSON for machine use. Support scheduled email delivery and on-demand download.
   - Test coverage measurement and reporting:
     - Use `@vitest/coverage-v8` with thresholds: `80%` statements, `80%` branches, `80%` lines, `80%` functions. Fail CI below thresholds.
     - Emit `lcov`, `html` artifacts; surface summary in CI logs and store under `test-results/coverage`.

5) Browser Support Consolidation
   - Support: latest two versions of Chrome, Edge, Firefox, and Safari; Mobile Safari iOS 16+; Android Chrome 110+.
   - Testing: run Playwright matrix (chromium, webkit, firefox) on CI for smoke and core flows; include accessibility checks (axe) and screenshot diffs for key pages.

6) Intelligence Report Metadata
   - Define `analysis_metadata` structure embedded with each AI-generated artifact and stored separately for audit:
     - Fields: `analysis_id`, `model_name`, `model_version`, `embedding_model`, `embedding_dim`, `prompt_template_id`, `prompt_hash`, `temperature`, `top_p`, `seed`, `input_tokens`, `output_tokens`, `latency_ms`, `confidence_score`, `created_by`, `created_at`, `source_refs[]`, `heuristics[]`.
   - Relationship to pgvector: each analysis has an optional `embedding_id` FK into `ai_embeddings`. When present, ensure `embedding_dim` matches table definition; reject writes on mismatch.

Placement guidance (preserve template section order):
   - Put search/filtering and reporting under Functional Requirements.
   - Put rate limits, scaling, and browser support under Non‑functional Requirements.
   - Put embeddings/pgvector, algorithms, and analysis metadata under Architecture and Data Model.
   - Put coverage thresholds and cross‑browser tests under Testing & QA.
