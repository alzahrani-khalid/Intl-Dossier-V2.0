import OpenAI from 'openai'
import { getCopilotModel } from '@/llm-router.js'
import { RubricScoreSchema, type RubricScore } from '../schemas/score.js'

/**
 * On-prem gemma LLM-judge for the generative quality rubrics (Phase 74, Plan 74-09).
 *
 * D4 (LOCKED): the eval judge is the SAME on-prem gemma-4-12B endpoint the copilot binds
 * to — `getCopilotModel()` (vLLM in prod / Ollama in dev). Zero-egress is the keystone
 * invariant (threat T-74-09-01): `judgeRubric` only ever contacts `getCopilotModel().url`;
 * no fixture content, candidate, or reference is sent to a cloud LLM. The self-grading
 * bias is accepted by D4 (this is a regression-delta gate, not an absolute oracle).
 *
 * Consumers: EVAL-01 (`briefs.eval.test.ts`, >= 0.80) and EVAL-03 (`arabic.eval.test.ts`,
 * >= 0.75). Both guard live scoring with `isJudgeConfigured()` so a missing GPU host skips
 * (not fails) CI per D6 — see vitest.eval.config.ts and .github/workflows/ci.yml.
 */

const JUDGE_SYSTEM_PROMPT =
  'You are a strict evaluator. Score the CANDIDATE against the REFERENCE on the named ' +
  'dimension from 0.0 to 1.0, where 1.0 means the candidate fully matches the reference ' +
  'on that dimension and 0.0 means it fails entirely. Respond ONLY with a JSON object of ' +
  'exactly this shape (no markdown, no commentary): ' +
  '{"dimension":string,"score":number,"passed":boolean,"notes":string}. ' +
  'The "score" must be a number between 0.0 and 1.0 inclusive.'

/**
 * The deploy gate (D6). Returns true iff the on-prem judge endpoint env is configured.
 *
 * The live-scoring assertions in the briefs/arabic rubrics are wrapped in
 * `if (isJudgeConfigured())` (or `it.skipIf(!isJudgeConfigured())`); when the GPU/gemma
 * host is absent this returns false and those assertions are skipped, so a missing host
 * never fails or hangs CI. Mirrors `if: secrets.EVAL_AI_URL != ''` at the test level.
 */
export function isJudgeConfigured(): boolean {
  const url = process.env.EVAL_AI_URL ?? process.env.VLLM_BASE_URL
  return typeof url === 'string' && url.trim().length > 0
}

/**
 * Score a single rubric dimension with the on-prem judge.
 *
 * Builds an OpenAI-compatible chat-completions request against `getCopilotModel()` — the
 * SAME on-prem endpoint the copilot uses (zero-egress). The judge's JSON reply is parsed
 * and validated through `RubricScoreSchema.parse`, so a hallucinated/out-of-range score
 * throws (threat T-74-09-02) rather than silently passing the gate. The returned
 * `dimension` is normalized to the caller's requested dimension so an aggregating rubric
 * can key on it deterministically even if the model echoes a slightly different label.
 *
 * Callers MUST guard with `isJudgeConfigured()` first; invoking this unconfigured throws.
 */
export async function judgeRubric(args: {
  dimension: string
  rubricInstruction: string
  candidate: string
  reference: string
}): Promise<RubricScore> {
  if (!isJudgeConfigured()) {
    throw new Error(
      'judgeRubric called without a configured on-prem judge endpoint ' +
        '(set EVAL_AI_URL or VLLM_BASE_URL). Guard with isJudgeConfigured() before calling.',
    )
  }

  // Zero-egress: the ONLY endpoint contacted is the on-prem getCopilotModel().url. No
  // cloud LLM is constructed here — the apiKey is the local placeholder the server ignores.
  const { url, apiKey, id } = getCopilotModel()
  const model = id.includes('/') ? id.slice(id.indexOf('/') + 1) : id
  const client = new OpenAI({ baseURL: url, apiKey })

  const userPrompt = [
    `DIMENSION: ${args.dimension}`,
    `HOW TO GRADE THIS DIMENSION (0.0-1.0): ${args.rubricInstruction}`,
    '',
    'REFERENCE (the golden answer):',
    args.reference,
    '',
    'CANDIDATE (the output under test):',
    args.candidate,
  ].join('\n')

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: JUDGE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices?.[0]?.message?.content ?? ''
  const parsed = JSON.parse(raw) as unknown

  // Validate the judge output through RubricScoreSchema — out-of-range or wrong-typed
  // scores throw here instead of rubber-stamping the gate. Pin the dimension to the
  // caller's so aggregation keys are stable regardless of the model's echoed label.
  return RubricScoreSchema.parse({
    ...(parsed as Record<string, unknown>),
    dimension: args.dimension,
  })
}
