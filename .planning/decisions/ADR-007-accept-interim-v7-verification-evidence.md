# ADR-007: Accept Interim Verification Evidence for v7.0 Deploy-Gated Checks

Status: Accepted

Date: 2026-06-29

## Context

The v7.0 Intelligence Engine milestone shipped (code merged, #67; archived and
tagged `v7.0` on 2026-06-24). Several verification items were declared
"deploy-gated" at milestone close because they require the on-prem GPU / TEI
inference stack running on the **production** hardware path:

- **EVAL-01 / EVAL-02 / EVAL-03** — the evaluation-gate checks for the AI phases.
- **AGENT** live checks — the P72 agent platform behaviors against real inference.
- **INFRA** live checks — the production GPU/TEI + vLLM / embeddings serving path.

These were verified during development only via **service-role impersonation**
(DB-level RLS / clearance proofs) and **Mac-local end-to-end runs** (real
`gemma4:12b`, grounded EN + AR passes; the copilot proven working e2e). They
were never exercised on the production GPU path because the DigitalOcean droplet
(4 GB) cannot build or run the v7.0 inference stack in-place, and a dedicated
on-prem GPU host has not been stood up.

There is no imminent production deployment of the v7.0 intelligence features.
Carrying these as perpetually-open "blockers" misrepresents the actual state:
the logic is verified; only the production hardware path is unexercised.

## Decision

Accept the existing **interim evidence** (impersonation + Mac-local e2e) as the
sufficient verification sign-off for EVAL-01/02/03 + AGENT + INFRA, and **close**
the v7.0 deploy-gated verification carry-in.

Standing up the on-prem GPU/TEI production stack is **deferred** to a future
milestone, triggered when a production rollout of the intelligence features is
actually scheduled.

## Residual Risk Accepted

- The **production GPU/TEI path itself is unverified** end-to-end. This ADR is
  **not a permanent waiver** — when the on-prem stack is eventually stood up,
  EVAL-01/02/03 + AGENT + INFRA MUST be re-run against the real path before any
  production intelligence rollout.
- The **~15 intelligence edge functions remain stale on staging by design**
  (`intelligence-*`, `search-semantic`, `semantic-search-unified`,
  `translate-content`, `dossier-field-assist`, `ai-summary-generate`, etc.).
  They are downstream of the GPU/TEI stack and are intentionally not deployed
  until that path exists. They are tracked here, not silently dropped.

## Consequences

- The v7.0 milestone carry-in "deploy-gated live verification" blocker is closed.
- A future "v7.x production GPU bring-up" milestone owns: standing up the GPU/TEI
  host, deploying the ~15 intelligence edge functions, and re-running
  EVAL / AGENT / INFRA against the real path.

## Related

- Quick task `260629-gb4-v7-carryin-closeout` — the non-intelligence
  prod-quality-sweep backfill: 10 security/hardening edge functions deployed to
  staging in the same closeout.
- v7.0 milestone archive + tag (2026-06-24).
