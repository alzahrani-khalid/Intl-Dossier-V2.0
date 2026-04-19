# Phase 33: Plan Check Report

**Checked:** 2026-04-19
**Checker:** gsd-plan-checker
**Verdict:** PASS (with 2 non-blocking nits)

---

## Coverage matrix

### Success Criteria

| SC                                                                                 | Plans                                                                                                      | Tested how                                                                                                                                                                                                                                        | Verdict |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| SC-1 direction setter updates every var, no reload                                 | 33-01 (math), 33-02 (wiring), 33-09 (E2E)                                                                  | Unit: 72-case `buildTokens.test.ts`; Integration: `DesignProvider.test.tsx` asserts `data-direction`+localStorage+`--bg` changes; E2E `token-engine-sc.spec.ts` SC-1 reads 6 vars before/after `setDirection('situation')` and asserts all change | PASS    |
| SC-2 light/dark OKLCH flip (accent-ink, accent-soft, dark semantic variants)       | 33-01 (math branches), 33-02 (wiring), 33-09 (E2E)                                                         | Unit test explicitly asserts `--accent-ink` 42%↔72% and `--accent-soft` 0.05↔0.08; E2E SC-2 asserts same strings in live CSS                                                                                                                      | PASS    |
| SC-3 hue recomputes accent family + `--sla-risk` (hue+55°), `--sla-bad` hue-locked | 33-01 (math), 33-09 (E2E)                                                                                  | Unit test asserts `(hue+55)%360`; E2E SC-3 tests hue=100/250/340 with wrap-around and confirms `--sla-bad` unchanged                                                                                                                              | PASS    |
| SC-4 density (comfortable/compact/dense) → 52/40/32 row-h + RTL-safe logical props | 33-01 (values), 33-02 (wiring), 33-09 (E2E)                                                                | Density values locked via `DENSITIES` record; E2E iterates all 3 densities and then flips `dir="rtl"` asserting `--pad-inline` resolves                                                                                                           | PASS    |
| SC-5 HeroUI + Tailwind consume same vars, zero per-component overrides             | 33-04 (`--heroui-*` bridge), 33-05 (wrappers), 33-06 (`@theme` remap), 33-08 (Storybook grid), 33-09 (E2E) | Three layers: grep audit in 33-05 DoD (`bg-red/blue/green/yellow`=0); 72-variant Storybook snapshot in 33-08; live runtime assertion in 33-09 SC-5 comparing `bg-accent` div vs `bg-primary` button `getComputedStyle`                            | PASS    |

### Requirements

| REQ                                       | Plans               | Verdict |
| ----------------------------------------- | ------------------- | ------- |
| TOKEN-01 OKLCH engine                     | 33-01, 33-02        | PASS    |
| TOKEN-02 FOUC bootstrap                   | 33-03               | PASS    |
| TOKEN-03 direction × mode × hue × density | 33-01, 33-02        | PASS    |
| TOKEN-04 Tailwind + HeroUI bridge         | 33-04, 33-05, 33-06 | PASS    |
| TOKEN-05 Storybook verification           | 33-05, 33-08        | PASS    |
| TOKEN-06 Legacy hard cut                  | 33-07               | PASS    |

Every requirement ID in ROADMAP §Phase 33 is claimed by ≥1 plan's `requirements` frontmatter. 00-OVERVIEW coverage map matches the leaf plans.

---

## Sequencing check

### Wave DAG (verified acyclic)

```
Wave 1 (no deps):          33-01, 33-04
Wave 2 (Wave 1):           33-02[01], 33-03[01], 33-06[01,04]
Wave 3 (Wave 2):           33-05[02,04], 33-07[02,06], 33-08[02,04,05,06]
Wave 4 (Wave 3):           33-09[02..08]
```

- No cycles.
- All `depends_on` references exist.
- Wave numbers = max(deps.wave) + 1. Valid.
- **33-06 before 33-07**: correct. 33-07 removes HSL backstop; 33-06 must install `@theme` remap first so 1,437 `bg-primary/text-foreground/border-border` usages keep resolving. Explicitly noted in 33-07's "Critical dependency" section.
- **33-04 before 33-06**: correct. `@plugin '@heroui/styles'` must precede `@theme {}` per RESEARCH Q1 Gotcha #8 (ordering). 33-06 Task 1 preserves this ordering in writing.
- **33-01 before 33-03**: correct. 33-03 inline palette literals must be copied from 33-01's `directions.ts` (Task 2 in 33-03 explicitly reads them).
- **33-02 before 33-05**: correct. `useDomDirection` rename happens in 33-02; 33-05 Task 5 verifies the patched import on `heroui-modal.tsx:16`.

---

## Risks reviewed

| Risk                                                                                            | Mitigated? | Where                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HeroUI v3 beta churn → `--heroui-*` var name drift                                              | YES        | 33-04 "Risks" locks pin to exact version (`@heroui/react@3.x.x`, not caret) and documents rationale                                                                                                 |
| CSP inline-script refusal in production                                                         | YES        | 33-03 Task 4 is `checkpoint:decision` (option-a SHA-256 hash / option-b unsafe-inline / option-c external blocking); audits `deploy/nginx.conf` before commit                                       |
| 250-file / 1,437-occurrence Tailwind remap blast radius                                         | YES        | 33-06 Task 5 is `checkpoint:human-verify` gating on 24 Playwright baselines across 3 routes × 2 modes × 2 locales × 2 viewports                                                                     |
| `useDirection` name collision (3 sites per PATTERNS.md)                                         | YES        | 33-00 Overview resolution-note + 33-02 "Name-collision decision" section: rename old → `useDomDirection`, new → `useDesignDirection`, update `heroui-modal.tsx:16`; call-site sweep in 33-07 Tier D |
| Palette-literal drift between 33-01 `directions.ts` and 33-03 inline bootstrap (→ returns FOUC) | PARTIAL    | 33-03 "Risks" proposes CI guard (Vitest snapshot diff of `directions.ts` vs `index.html` regex). Mitigation is documented but not concretely added as a DoD line — see Nit #1                       |
| HeroUI `Card.Header` compound API mismatch in v3 beta                                           | YES        | 33-05 "Risks" requires spike in scratch file first; documents actual names in SUMMARY if API differs                                                                                                |
| Storybook + HeroUI v3 MEDIUM confidence                                                         | YES        | 33-08 "Risks" notes no first-party recipe; fallback debug path documented; `@storybook/addon-themes` `withThemeByClassName` reuses `.dark` switch                                                   |
| Tailwind `@theme` + `tailwind.config.ts` precedence conflict (Gotcha #2)                        | YES        | 33-06 Task 2 removes duplicate `extend.colors` block; 33-06 DoD asserts `grep -c 'primary:' frontend/tailwind.config.ts` = 0                                                                        |
| ThemeSelector/Themes-route cross-phase leak                                                     | YES        | 33-07 Task 8 `checkpoint:decision` (defer / delete-now / redirect-stub)                                                                                                                             |
| ThemeErrorBoundary `fallbackTheme` prop leak                                                    | YES        | 33-07 Task 4 renames to `fallbackDirection` with `chancery` default; 33-02 explicitly leaves it for 33-07 to avoid mid-wave breakage                                                                |

---

## RTL verification coverage (CLAUDE.md MANDATORY)

- 33-01: density tokens are `--pad-inline` / `--pad-block` (logical) per D-04. Passes Rule 1 mental model.
- 33-02 DoD: "switch i18n to Arabic, confirm density row-h still applies" — manual RTL smoke.
- 33-03 Risks: verifies `data-direction` attribute doesn't conflict with i18n `dir="rtl"`.
- 33-04 DoD: RTL smoke — toggle `dir="rtl"`, confirm button renders at correct position.
- 33-05 DoD: EN + AR both render Button startContent — icon placement follows RTL rules.
- 33-06 DoD: "navigate AR locale, confirm no `ml-/mr-/pl-/pr-` visible in inspector" — structural RTL check.
- 33-06 E2E: 24 baselines include `en` + `ar` at both mobile and desktop viewports.
- 33-07 DoD: "Manual EN + AR: navigate 3 representative routes".
- 33-08 DoD: RTL toggle on story globals.
- 33-09 DoD: "passes in BOTH EN and AR locales".

Every plan that renders visible UI has ≥1 RTL DoD line. Compliant.

---

## Scope discipline audit

- No plan adds speculative scope (runtime hue previews, create-your-own directions, per-component overrides).
- Deferred ideas from CONTEXT.md (per-component overrides, scoped tokens per route, accent contrast auto-correction, RAF batching) are NOT present in any plan.
- No plan deletes anything the phase didn't sign up for: ThemeSelector.tsx + /themes route are left for Phase 34 by default (Task 8 option-defer). Appropriate.
- 33-08 Storybook stays internal (verification tool, not deployed docs site) — 33-08 DoD mentions static output "for deployment-preview if needed", not a hard deliverable. Compliant.

---

## Typecheck/lint/RTL DoD coverage

| Plan  | typecheck | lint      | RTL                                                      |
| ----- | --------- | --------- | -------------------------------------------------------- |
| 33-01 | YES       | YES       | N/A (pure data module, logical tokens encoded in values) |
| 33-02 | YES       | YES       | YES (AR smoke)                                           |
| 33-03 | (via E2E) | (via E2E) | YES (AR + `data-direction` vs `dir`)                     |
| 33-04 | (build)   | -         | YES                                                      |
| 33-05 | YES       | YES       | YES                                                      |
| 33-06 | (build)   | -         | YES (grep for `ml-/mr-/pl-/pr-`)                         |
| 33-07 | YES       | YES       | YES                                                      |
| 33-08 | (build)   | -         | YES                                                      |
| 33-09 | N/A       | N/A       | YES                                                      |

Acceptable. 33-04/06/08 don't add TS; `build` verifies transitively. Nit: 33-04 and 33-06 could add an explicit `pnpm lint` line but this is stylistic, not blocking.

---

## Issues found

### BLOCKING (must fix before execute-phase)

_None._

### Non-blocking (revise if easy)

**Nit #1 — Palette-literal drift guard is proposed but not wired as DoD** (33-03, "Risks")

- File: `.planning/phases/33-token-engine/33-03-fouc-bootstrap-PLAN.md` lines ~217-218
- Issue: 33-03 states "add a Vitest snapshot test in Plan 33-01 that diffs `directions.ts`'s `{bg, surface, surfaceRaised, ink, line}` against a regex scrape of `frontend/index.html` — CI-fails on drift" but this mitigation is not echoed in 33-01's DoD or test plan.
- Fix: Add one line to 33-01 DoD: `[ ] CI guard test: directions.ts {bg, surface, surfaceRaised, ink, line} literals byte-match the inline <script> in frontend/index.html (dev + test env)` — or move the CI guard into 33-03 Task 3's DoD explicitly.
- Severity: LOW. If skipped, a future change to `directions.ts` would silently return FOUC on first paint. Phase 43 RTL/a11y audit (per CROSS_PHASE) would catch it eventually.

**Nit #2 — `pnpm lint` not required in 33-04/33-06/33-08 DoD** (stylistic)

- Files: 33-04, 33-06, 33-08 PLAN.md
- Issue: These plans run `pnpm build` but don't explicitly list `pnpm lint` in DoD. CLAUDE.md doesn't mandate it per-plan, but other plans in this phase do.
- Fix: Add `[ ] pnpm --filter frontend lint` line to each DoD.
- Severity: LOW. `pnpm build` already catches most issues; CI likely gates on lint anyway.

### Nice-to-have

_None identified._

---

## Recommendation

**PASS — ready for `/gsd-execute-phase 33`**

All 5 Success Criteria and all 6 TOKEN-\* requirements are covered by ≥1 plan with falsifiable DoD assertions. The wave DAG is acyclic, dependencies sequence correctly (especially 33-04→33-06→33-07 to protect the 250-file remap blast radius), and every load-bearing risk has a mitigation path or an explicit `checkpoint:decision`/`checkpoint:human-verify` gate. RTL coverage is present in every UI-rendering plan. Scope is disciplined — no speculative additions.

The two nits are quality-of-life polish and can be addressed during execution if convenient; neither blocks phase execution.

---

**Files referenced:**

- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-00-OVERVIEW.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-01-token-module-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-02-design-provider-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-03-fouc-bootstrap-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-04-heroui-install-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-05-heroui-wrappers-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-06-tailwind-remap-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-07-legacy-cut-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-08-storybook-PLAN.md`
- `/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0/.planning/phases/33-token-engine/33-09-e2e-verification-PLAN.md`
