---
quick_id: 260524-szl
slug: dependency-and-security-upgrades-p0-w1-w
date: 2026-05-24
status: complete
branch: chore/dependency-security-upgrades
---

# Summary: Dependency & Security Upgrades (P0 + W1 + W2)

## Outcome

Applied Priority-0 security patches and the safe Wave 1 / Wave 2 dependency
upgrades. Full verification gate green: `pnpm install` + `lint` + `typecheck`

- `build` + `test` (backend 214 tests, frontend 1241 tests, 0 failures).

Security advisories: **94 → 55** (`pnpm audit`).

## Delivered

- **Security:** axios 1.16.1 (4× HIGH), vite 7.3.3 (2× HIGH, stays in v7),
  turbo 2.9.14, + version-scoped `pnpm.overrides` (minimatch@3, picomatch@2,
  path-to-regexp@8 + @0, fast-uri@3, rollup@4, protobufjs@7).
- **Wave 1:** ~40 within-major patch/minor bumps (React 19.2.6, TanStack,
  Tailwind 4.3, tiptap, sentry, vitest, playwright, framer-motion, etc.).
- **Wave 2:** @mastra/core 1.36, @anthropic-ai/sdk 0.98, openai 6.39,
  lucide-react 1.16, knip 6.14.2, typescript-eslint 8.59.4.
- **Cleanup:** unified `eslint-plugin-react-hooks` to ^7.1.1.

## Deviations (held back to honor no-regressions; none security-driven)

- **@supabase/supabase-js** kept at 2.100.1 — 2.106 tightens insert typing
  (`RejectExcessProperties`) and surfaces latent payload mismatches in
  `backend/src/api/after-action.ts` and
  `backend/src/services/task-contributors.service.ts` (6 TS errors). Needs a
  separate code fix.
- **zod** kept at 4.3.6 — 4.4 makes `.merge()` throw on object schemas with
  refinements; breaks `frontend/src/components/dossier/wizard/schemas/
elected-official.schema.ts` (needs `.merge` → `.safeExtend`).
- **react-i18next** pinned 17.0.0 — 17.0.8 hard-requires i18next ≥ 26
  (a Wave 3 major).

## Known remaining security items (follow-up)

- **CRITICAL protobufjs@6.11.4** via `@xenova/transformers > onnxruntime-web
  > onnx-proto`. Fix only exists in protobufjs ≥ 7.5.6; forcing onnx-proto's
6.x to 7.x is a cross-major override that risks breaking ONNX/embedding
inference (not covered by unit tests). Proper fix: migrate
`@xenova/transformers`→`@huggingface/transformers`. Low exploitability
(requires malicious `.proto`; models are trusted).
- Remaining HIGH/MODERATE advisories are in **dev-only tooling**
  (`@lhci/cli`/lighthouse → basic-ftp, old vite, lodash; `lint-staged` →
  picomatch@4; `axe-playwright` → lodash). `lodash` advisory wants ≥4.18.0,
  which is unpublished.

## Out of scope (Wave 3 majors — separate opt-in)

TypeScript 6, Vite 8, ESLint 10, i18next 26, react-day-picker 10,
@vitejs/plugin-react 6, uuid 14, lint-staged 17, esbuild 0.28.
