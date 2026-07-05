---
phase: 83
slug: token-debt-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-04
---

# Phase 83 — Validation Strategy

> Per-phase validation contract. Derived from `83-RESEARCH.md` § Validation Architecture.
> This is a token-swap phase: the gates are (a) re-audit greps dropping each debt class to
> clean/minor, and (b) **render-parity** — pixel-unchanged EXCEPT the declared controlled changes
> (chart/graph hues, card-shadow removal, the ~6 gradient flattens, emoji→lucide, the demo route).
> Task-level rows are filled once `83-*-PLAN.md` exist.

---

## Test Infrastructure

| Property       | Value                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**  | Vitest (unit) + Playwright (e2e/visual), pre-configured                                                                            |
| **Config**     | `frontend/playwright.config.ts` (chromium, chromium-dashboard-widgets w/ committed baselines, a11y); vitest via frontend workspace |
| **Quick run**  | `pnpm --dir frontend exec vitest run tests/unit/design-system/` + the task's grep gate                                             |
| **Full suite** | `pnpm --dir frontend lint && pnpm --dir frontend type-check && pnpm --dir frontend exec vitest run`                                |

---

## Sampling Rate

- **After every task commit:** design-system unit tests + the task's own grep gate
- **After every plan wave:** `pnpm --dir frontend lint && … type-check && … vitest run`
- **Before `/gsd:verify-work`:** full suite + Playwright visual/rtl specs green (with the one knowing dashboard-widgets re-baseline) + all re-audit greps at clean/minor
- **Max feedback latency:** quick <10s

---

## Requirements → Test Map (re-audit grep gates)

| Req ID      | Behavior (observable)                                                                                                             | Test Type           | Automated Command / Gate                                                                                                                                                                                                                  | Wave-0?                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **DEBT-01** | `--chart-1…8` defined w/ three-copy parity + AA contrast (≥3:1 vs `--surface` & `--bg`, both modes); no raw hex outside carve-out | unit + guard + grep | `node scripts/check-bootstrap-parity.mjs`; `vitest run tests/unit/design-system/contrast.test.ts`; `rg "#[0-9a-fA-F]{6}\b" frontend/src -g'!**/design-system/tokens/**' -g'!index.css' -g'!**/signature-visuals/flags/**'` → comment-only | ✅ contrast chart cases + parity table           |
| **DEBT-02** | no Tailwind palette literals outside the `list-pages.css` shim / tests                                                            | lint + grep         | `pnpm --dir frontend lint`; `rg '\b(text\|bg\|border\|fill\|stroke\|from\|to\|via)-(gray\|neutral\|slate\|zinc\|stone\|red\|blue\|green\|amber\|…)-[0-9]{2,3}\b' frontend/src -g'!**/styles/list-pages.css' -g'!**/__tests__/**'` → 0     | ✅ (carve-out tighten makes lint bite)           |
| **DEBT-03** | banned card shadows gone                                                                                                          | grep                | `rg '\bshadow-(sm\|md\|xl\|2xl)\b' frontend/src -g'!index.css'` → 0                                                                                                                                                                       | grep                                             |
| **DEBT-04** | no numeric arbitrary radii (keep `rounded-[var(--radius-*)]` — canonical, NOT debt)                                               | grep                | `rg 'rounded-(s-\|e-\|t-\|b-)?\[[0-9]' frontend/src` → 0; `rg 'border-radius:\s*(6\|8\|10\|12)px' frontend/src` → 0 (micro ≤4px + pills allowlisted)                                                                                      | grep                                             |
| **DEBT-05** | decorative gradients flattened                                                                                                    | grep                | `rg 'bg-gradient-\|linear-gradient\|radial-gradient' frontend/src` → only the ~4 allowlisted (masks, tweaks hue track, globe-loader, NavigationShell tint)                                                                                | grep                                             |
| **DEBT-06** | bespoke ladders deleted; consumers resolve DS tokens                                                                              | grep                | `rg -- '--shadow-(xs\|sm\|md\|lg\|xl):' frontend/src/styles/modern-nav-tokens.css` → 0; per-var zero-consumer greps                                                                                                                       | grep                                             |
| **DEBT-07** | no `!important` px row heights (closes via `vertical-timeline.css` deletion; `list-pages.css` dims verified-not-debt)             | grep                | `rg '(min-)?height:\s*[0-9]+px\s*!important' frontend/src/styles/` → 0                                                                                                                                                                    | ✅ (via deletion)                                |
| **DEBT-08** | no emoji-as-UI (data/JSDoc carve-outs kept)                                                                                       | grep                | `rg '[\x{2300}-\x{27BF}\x{FE0F}\x{1F300}-\x{1FAFF}]' frontend/src/components frontend/src/routes -g'!**/__tests__/**'` → only data/JSDoc                                                                                                  | grep                                             |
| **ALL**     | zero visual regressions on live chrome                                                                                            | e2e visual          | `pnpm --dir frontend exec playwright test dashboard-visual dashboard-widgets-visual list-pages-visual dossier-drawer-visual analytics-dashboard rtl-component-smokes`                                                                     | ✅ (chart-color re-baseline is a knowing commit) |
| **ALL**     | build integrity + bundle size                                                                                                     | build               | `pnpm --dir frontend build`                                                                                                                                                                                                               | build                                            |

---

## Wave 0 Requirements

- [ ] `frontend/tests/unit/design-system/contrast.test.ts` — add `--chart-1…8` ≥3:1 (vs `--surface` and `--bg`, both modes) — DEBT-01 AA
- [ ] `scripts/check-bootstrap-parity.mjs` — extend `EXTENDED_PALETTE` with the chart loop (guard code that doubles as the DEBT-01 drift test)
- [ ] Possible assertion updates in `buildTokens.test.ts` / `fouc-bootstrap.test.ts` if they enumerate emitted vars
- Framework installs: none

---

## Manual-Only: Render-Parity Protocol (the phase's key gate)

| Behavior                                                           | Requirement | Why Manual                                                                                      | Test Instructions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live chrome pixel-unchanged except the declared controlled changes | ALL         | Whole-app token-swap visual parity can't be unit-asserted app-wide; needs a real browser matrix | Routes: `/dashboard` (widgets+charts), `/analytics`, a dossier detail relationships tab (MiniRelationshipGraph), report-builder preview, one list page, one drawer, `/copilot` drawer, `/modern-nav-standalone` (expected to change). Matrix: **1400 + 1024 × dark + light × EN + AR** (`?lng=ar` first paint). Expect pixel-unchanged EVERYWHERE except the **declared controlled-change list**: chart/graph hues, card-shadow removal, the ~6 gradient flattens, emoji→lucide, the demo route. React Flow marker/Background `var()` edges (RESEARCH A1) get a computed-style eyeball. |

---

_Validation strategy created 2026-07-04 from 83-RESEARCH.md § Validation Architecture. Task rows populated after planning._
