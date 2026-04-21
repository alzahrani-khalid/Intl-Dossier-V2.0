---
phase: 35
slug: typography-stack
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Draft — planner fills per-task rows after plans land.

---

## Test Infrastructure

| Property               | Value                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Framework (unit)**   | Vitest (follows Phase 33 token-engine test pattern)                                    |
| **Framework (E2E)**    | Playwright (follows existing `frontend/tests/e2e/` pattern)                            |
| **Config file (unit)** | `frontend/vitest.config.ts`                                                            |
| **Config file (E2E)**  | `frontend/playwright.config.ts`                                                        |
| **Quick run command**  | `pnpm --filter frontend test -- tokens.test.ts fonts.test.ts`                          |
| **Full suite command** | `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- typography.spec.ts` |
| **Estimated runtime**  | Unit ~8s · E2E ~40s (4 directions × 2 locales)                                         |

---

## Sampling Rate

- **After every task commit:** Run quick unit command (tokens + fonts) — max ~10s feedback.
- **After every plan wave:** Run full suite including typography.spec.ts E2E.
- **Before `/gsd-verify-work`:** Full suite must be green AND Network panel assertion (zero `fonts.googleapis.com` requests) must pass.
- **Max feedback latency:** 10 seconds (unit) / 45 seconds (full).

---

## Per-Task Verification Map

_Planner fills rows per plan. Contract reference (from RESEARCH §Validation Architecture):_

| Task ID   | Plan | Wave | Requirement | Threat Ref  | Secure Behavior           | Test Type | Automated Command                               | File Exists | Status     |
| --------- | ---- | ---- | ----------- | ----------- | ------------------------- | --------- | ----------------------------------------------- | ----------- | ---------- |
| {N}-01-01 | 01   | 0/1  | TYPO-01..04 | T-35-01 / — | Token keys emit valid CSS | unit      | `pnpm --filter frontend test -- tokens.test.ts` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

**Nyquist coverage targets (2× failure-mode frequency):**

- **TYPO-01** (per-direction triplets): 4 directions × 3 font roles = 12 unit assertions via `buildTokens(dir)` returning `--font-display/body/mono`. E2E: one `getComputedStyle(h1).fontFamily` probe per direction = 4 probes.
- **TYPO-02** (self-hosted, no CDN): (a) unit — grep `frontend/src/fonts.ts` contains all 8 @fontsource imports; (b) E2E `page.on('request')` asserts zero `fonts.googleapis.com` / `fonts.gstatic.com` requests over 4-direction × 2-locale matrix (8 page loads); (c) grep `frontend/index.html` contains zero `fonts.googleapis.com` strings.
- **TYPO-03** (Tajawal verbatim): grep assertion — `frontend/src/index.css` contains the exact 48-line handoff block (byte-for-byte checksum comparison against `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` lines 129-176).
- **TYPO-04** (mono carve-out): E2E fixture — a hidden `<span dir="ltr" class="mono">⌘K</span>` inside an RTL page, assert `getComputedStyle().fontFamily` starts with `"JetBrains Mono"` across all 4 directions (including Situation where global mono is IBM Plex Mono).

---

## Wave 0 Requirements

- [ ] `frontend/src/lib/design/tokens.test.ts` — add 12 assertions (4 dirs × 3 font keys)
- [ ] `frontend/src/fonts.test.ts` OR extend existing bootstrap test — assert 8 fontsource imports resolve
- [ ] `frontend/tests/e2e/typography.spec.ts` — Playwright fixture for TYPO-04 carve-out + TYPO-02 network assertion
- [ ] Install dev-dependencies: none — vitest + Playwright already present (Phase 33 + Phase 34)

---

## Manual-Only Verifications

| Behavior                                                         | Requirement | Why Manual                                                                      | Test Instructions                                                                                                                                                   |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placeholders-and-vanish-input canvas glyph rendering post-rename | TYPO-01     | Canvas `ctx.font` uses computedStyles — automated visual diff flaky across GPUs | Manually inspect the input on `/landing` or wherever `placeholders-and-vanish-input.tsx` mounts; confirm placeholder text renders in Inter (LTR) and Tajawal (RTL). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (tokens.test extension, fonts.test creation, typography.spec.ts scaffold)
- [ ] No watch-mode flags (`--watch` banned in CI commands)
- [ ] Feedback latency < 10s (unit) / 45s (full)
- [ ] `nyquist_compliant: true` set in frontmatter after planner completes per-task map

**Approval:** pending
