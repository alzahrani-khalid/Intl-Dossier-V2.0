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

### Live-mode — deploy-gated, non-blocking (Plan 74-09)

- **EVAL-01** briefing quality EN+AR (`briefs.eval.test.ts`, ≥ **0.80**) and **EVAL-03**
  Arabic quality (`arabic.eval.test.ts`, ≥ **0.75**) — generative judge scoring via the
  on-prem gemma-4-12B model (`evals/lib/judge.ts` → `getCopilotModel()`, **D4**:
  zero-egress). The live-scoring assertions are gated by `isJudgeConfigured()`
  (`EVAL_AI_URL` / `VLLM_BASE_URL`): when the GPU/gemma host is absent they **skip** (not
  fail), so CI stays green (same deploy gate as Phases 72/73). Their **structural +
  positive-failure** half (golden + candidate parse to the brief shape; each `_degraded.json`
  is structurally KNOWN-bad) runs in CI-mode now.

#### Golden fixtures (D5)

`fixtures/briefs/` and `fixtures/arabic/` carry a representative seed subset toward the D5
target of ≈15–30 cases per rubric. The harness reads **every** `*.json` in each dir
(leading-underscore = positive-failure), so adding more goldens is a drop-in: author a new
JSON file in the matching `fixtures/{briefs,arabic}/` dir and the rubric picks it up — no
test change. Current seed: 3 brief goldens (EN economic, EN political, AR economic) + 3
Arabic cases; synthetic content only (no real dossier names or classified data).

## Layout

```
evals/
├── vitest.eval.config.ts        eval-only Vitest config (this run)
├── schemas/score.ts             SetMetricsSchema + RubricScoreSchema (shared Zod envelopes)
├── lib/set-metrics.ts           computeSetMetrics + edgeKey (pure precision/recall/F1, EVAL-02)
├── lib/judge.ts                 on-prem gemma judge (getCopilotModel), RubricScore-validated (EVAL-01/03)
├── correlation.eval.test.ts     EVAL-02 rubric (74-01)
├── briefs.eval.test.ts          EVAL-01 bilingual briefing-quality rubric (74-09, ≥ 0.80)
├── arabic.eval.test.ts          EVAL-03 Arabic-quality rubric (74-09, ≥ 0.75)
└── fixtures/
    ├── correlation/             golden edge sets + _degraded positive-failure (EVAL-02)
    ├── briefs/                  golden EN+AR briefs + _degraded positive-failure (EVAL-01)
    └── arabic/                  golden Arabic cases + _degraded positive-failure (EVAL-03)
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
