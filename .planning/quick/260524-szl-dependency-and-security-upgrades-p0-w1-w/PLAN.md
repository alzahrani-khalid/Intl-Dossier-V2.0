---
quick_id: 260524-szl
slug: dependency-and-security-upgrades-p0-w1-w
date: 2026-05-24
status: in-progress
---

# Quick Task 260524-szl: Dependency & Security Upgrades (P0 + W1 + W2)

Branch: `chore/dependency-security-upgrades` (forked from `origin/main`).

## Scope

Apply the approved upgrade plan. **Wave 3 majors are explicitly excluded**
(TypeScript 6, Vite 8, ESLint 10, i18next 26, react-day-picker 10,
@vitejs/plugin-react 6, uuid 14, lint-staged 17, esbuild 0.28).

### Priority 0 — Security

Direct-dep bumps:

- `axios` (backend) `^1.14.0` → `^1.16.1` — prototype pollution, header
  injection, NO_PROXY bypass (4× HIGH)
- `vite` (frontend) `^7.3.1` → `^7.3.2` — fs.deny bypass + arbitrary file
  read (2× HIGH). **Stays in v7**, not the Vite 8 major.
- `turbo` `^2.8.20` → `^2.9.14` — local code execution

Transitive fixes via **scoped** `pnpm.overrides` (scoped to avoid forcing
latest-major on consumers that expect an older API):

- `protobufjs` `^7.5.6` (CRITICAL — arbitrary code exec; all consumers on 7.x)
- `fast-uri` `^3.1.2` (all consumers on 3.x)
- `rollup` `^4.59.0` (all consumers on 4.x; dev-only via visualizer + vite)
- `archiver-utils>glob>minimatch` `^3.1.4` (scoped — keeps the v3 chain on v3)
- `micromatch>picomatch` `^2.3.2` (scoped — micromatch needs picomatch v2)
- `express>router>path-to-regexp` `^8.4.0` (scoped — express 5 router 8.x)
- `@a2a-js/sdk>express>path-to-regexp` `0.1.13` (scoped — the old 0.1.x chain)

Accepted-with-note (no clean fix / dev-only): `@lhci/cli`→`basic-ftp`,
`lodash`/`lodash-es` (advisory wants `>=4.18.0`, which is unpublished).

### Wave 1 — Safe within-major (patch/minor)

react/react-dom 19.2.6, @supabase/supabase-js 2.106.1, @tanstack/_ (query
5.100.14, router 1.170.7, router-devtools 1.167.0, virtual 3.13.25,
router-plugin 1.168.10), tailwindcss + @tailwindcss/vite 4.3.0, @tiptap/_
3.23.6, zod 4.4.3, react-hook-form 7.76.1, @hookform/resolvers 5.4.0,
framer-motion + motion 12.40.0, date-fns 4.3.0, dompurify 3.4.5, helmet
8.2.0, express-rate-limit 8.5.2, express-validator 7.3.2, bullmq 5.77.1,
dotenv 17.4.2, react-i18next 17.0.8, @sentry/{node,react} 10.53.1,
@sentry/vite-plugin 5.3.0, @heroui/{react,styles} 3.0.5, @tabler/icons-react
3.44.0, vitest + @vitest/{ui,coverage-v8} 4.1.7, @playwright/test + playwright
1.60.0, prettier 3.8.3, tsx 4.22.3, @types/node 25.9.1, @types/react 19.2.15,
@types/pdfkit 0.17.6, jsdom 29.1.1, autoprefixer 10.5.0, postcss 8.5.15,
@size-limit/\* + size-limit 12.1.0, tailwind-merge 3.6.0, zustand 5.0.13,
use-debounce 10.1.1, nanoid 5.1.11.

### Wave 2 — Fast-moving libs

@mastra/core 1.36.0, @anthropic-ai/sdk 0.98.0, openai 6.39.0, lucide-react
1.16.0, knip 6.14.2, typescript-eslint 8.59.4.

### Cleanup

Unify `eslint-plugin-react-hooks` to `^7.1.1` (root already on ^7; frontend's
local ^5.2.0 is vestigial — root flat config disables both react-hooks rules,
and frontend lints through the root config). Zero lint-regression risk.

## Verification

`pnpm install` (raised floors force the lockfile to pull satisfying versions)
then `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Manual smoke
EN + AR (RTL) before declaring done.

## Out of scope

All Wave 3 majors (separate opt-in follow-up).
