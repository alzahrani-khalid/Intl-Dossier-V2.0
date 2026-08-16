// Phase 95 / NOTFOUND-COMPONENT-01 positive-control fixture for
// `local/no-bare-component-notfound`.
//
// INTENTIONALLY NON-COMPLIANT. Nothing imports this file. `pnpm lint` globs
// 'frontend/src/**/*.{ts,tsx}', so the fixture is linted only when named
// explicitly and cannot red the CI chain. Its whole job is to be a standing
// positive control:
//
//   pnpm exec eslint -c eslint.config.mjs -f json \
//     tools/eslint-fixtures/bad-bare-component-notfound.tsx
//
// MUST exit non-zero AND the JSON must carry ruleId
// "local/no-bare-component-notfound" — attribution, not just a non-zero exit
// (a config crash also exits non-zero but emits no ruleId). If a future config
// edit drops the rule, this fixture stops reporting and the drill catches it.
//
// Why the rule exists: a bare notFound() thrown from a COMPONENT reaches the
// router's defaultErrorComponent ("Something went wrong"), not the root 404
// page — the throw needs { routeId } (see DossierShell.tsx:144).

import { notFound } from '@tanstack/react-router'

// Shape 1 — the bare throw (zero arguments).
export function BadBareNotFound(): null {
  throw notFound()
}

// Shape 2 — the deprecated { global: true } spelling: an argument, but no routeId.
export function BadGlobalNotFound(): null {
  throw notFound({ global: true })
}
