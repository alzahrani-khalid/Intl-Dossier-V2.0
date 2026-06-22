// POSITIVE-FAILURE FIXTURE for scripts/check-no-anythingllm.mjs (74-08 / EVAL-04).
//
// This file deliberately reintroduces an AnythingLLM reference so that
//   node scripts/check-no-anythingllm.mjs tools/anythingllm-fixtures/critical-surface-with-anythingllm
// EXITS 1. It proves the guard actually catches a regression — if the guard ever
// silently passed on a re-added AnythingLLM import/URL, this assertion in CI
// (`! node scripts/check-no-anythingllm.mjs <this-dir>`) would flip and fail.
//
// It is NOT shipped/imported anywhere — it lives only under tools/ as a CI fixture.
// Do NOT "fix" it by removing the token; the token is the whole point.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const anythingLlmUrl: string = process.env.ANYTHINGLLM_API_URL ?? 'http://anythingllm:3001'
