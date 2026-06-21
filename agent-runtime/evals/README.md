# agent-runtime / evals

The AI-quality **regression-gate** harness for Phase 74 (EVAL-01/02/03). It runs under
its own Vitest config — `evals/vitest.eval.config.ts` — kept disjoint from the unit-test
run so the two never collect each other's files.

## Run it

```bash
pnpm --filter agent-runtime test:eval        # all *.eval.test.ts under evals/
```

The unit run is unaffected and never picks up `evals/**`:

```bash
pnpm --filter agent-runtime test             # src|tests/**/*.test.ts only
```

## Naming contract

Eval tests MUST be named `*.eval.test.ts` and live under `evals/`. That single rule keeps
the two Vitest runs disjoint (threat T-74-01-02):

| Run                | Config                        | `include` glob            |
| ------------------ | ----------------------------- | ------------------------- |
| unit (`test`)      | `vitest.config.ts`            | `src\|tests/**/*.test.ts` |
| eval (`test:eval`) | `evals/vitest.eval.config.ts` | `**/*.eval.test.ts`       |

`*.eval.test.ts` does not match `*.test.ts`-without-`.eval`, and `evals/` is outside the
unit config's root collection — neither run can be silently broadened into the other.

## What runs where (D6)

### CI-mode — required check, runnable now (no GPU)

- **EVAL-02** (`correlation.eval.test.ts`) — computed precision/recall of the edges
  `query_graph` returns vs a committed golden edge set (per **D1**). Pure set-overlap, no
  LLM, no DB. Gates at **precision ≥ 0.75 / recall ≥ 0.70**.
- **Positive-failure proof** — a deliberately degraded fixture (`fixtures/correlation/_degraded.json`)
  whose metrics fall below threshold; the rubric asserts the gate would REJECT it. Mirrors
  the repo precedent at `.github/workflows/ci.yml` (the bad-fixture schema-ref assert).

### Live-mode — deploy-gated, non-blocking (added in Plan 74-08)

- **EVAL-01** briefing quality (EN+AR) and **EVAL-03** Arabic quality — generative judge
  scoring via the on-prem gemma-4-12B model (`getCopilotModel()`, **D4**: zero-egress).
  These run only when `secrets.EVAL_AI_URL` is set, since they need the GPU/gemma stack
  (same deploy gate as Phases 72/73).

## Layout

```
evals/
├── vitest.eval.config.ts        eval-only Vitest config (this run)
├── schemas/score.ts             SetMetricsSchema + RubricScoreSchema (shared Zod envelopes)
├── lib/set-metrics.ts           computeSetMetrics + edgeKey (pure precision/recall/F1)
├── correlation.eval.test.ts     EVAL-02 rubric (this plan)
└── fixtures/correlation/        golden edge sets + the _degraded positive-failure fixture
```

## Fixtures

Golden fixtures are committed seed-style (**D5**). Each correlation fixture mirrors a
`query_graph` response for one `GRAPH_QUERY_TYPES` member and carries both the recorded
`returned` edges and the human-curated `golden` edges:

```jsonc
{
  "queryType": "forum_membership",
  "input": { "entityId": "<uuid>", "entityId2": "<uuid?>", "windowDays": 90 },
  "returned": [{ "source": "<uuid>", "target": "<uuid>", "type": "forum_membership" }],
  "golden": [{ "source": "<uuid>", "target": "<uuid>", "type": "forum_membership" }],
}
```

EVAL-02 is **recorded-response set-overlap**, not a live RPC call — so it runs with no DB
and no GPU. Fixtures use synthetic UUIDs only; no real dossier IDs, names, or clearance
data are committed (threat T-74-01-01).
