---
phase: 62
slug: export-pack-contract-deploy
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-11
---

# Phase 62 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (frontend unit/component) + Playwright (E2E, not used this phase) + grep gates (Deno edge fn — no Deno test infra) |
| **Config file**        | `frontend/vitest.config.ts`                                                                                               |
| **Quick run command**  | `pnpm --filter intake-frontend exec vitest run src/components/dossier/__tests__/ExportDossierDialog.test.tsx`             |
| **Full suite command** | `pnpm --filter intake-frontend exec vitest run` + `pnpm --filter intake-frontend build`                                   |
| **Estimated runtime**  | ~10s (targeted test) / ~120s (build)                                                                                      |

---

## Sampling Rate

- **After every task commit:** Run the task's `<automated>` gate (grep gates for 62-01, vitest/build for 62-02)
- **After every plan wave:** Wave 1 → `pnpm --filter intake-frontend build` green; Wave 2 → staging smoke matrix all `200 text/html`
- **Before `/gsd:verify-work`:** Build green + 62-03 smoke matrix recorded with zero 404/500 and zero non-empty X-Failed-Sections
- **Max feedback latency:** 120 seconds (frontend build)

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref                  | Secure Behavior                                                                              | Test Type                              | Automated Command                                                                                             | File Exists                                               | Status     |
| -------- | ---- | ---- | ----------- | --------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------- |
| 62-01-01 | 01   | 1    | EXPORT-02   | T-62-03                     | queries run on user-scoped client only                                                       | grep gate                              | comment-filtered stale-token grep == 0 + presence greps (plan 62-01 Task 1)                                   | ✅ (gates self-contained)                                 | ⬜ pending |
| 62-01-02 | 01   | 1    | EXPORT-02   | T-62-01                     | escapeHtml preserved; no DB data in style block                                              | grep gate                              | section-error/@media print presence + stale renderer reads == 0 (plan 62-01 Task 2)                           | ✅                                                        | ⬜ pending |
| 62-01-03 | 01   | 1    | EXPORT-02   | T-62-02 / T-62-04 / T-62-05 | getUser(token) preserved; UUID 400 gate; getCorsHeaders everywhere; service-role key deleted | grep gate (+ best-effort `deno check`) | Deno.serve/getCorsHeaders/2.39.3 presence + dead-symbol greps == 0 (plan 62-01 Task 3)                        | ✅                                                        | ⬜ pending |
| 62-02-01 | 02   | 1    | EXPORT-01   | T-62-08                     | auth header path unchanged; typed error on non-OK                                            | build + grep gate                      | dead-contract greps == 0 + `pnpm --filter intake-frontend build`                                              | ✅                                                        | ⬜ pending |
| 62-02-02 | 02   | 1    | EXPORT-01   | —                           | N/A                                                                                          | node parity script                     | EN/AR flattened-key parity + dead/new key assertions (plan 62-02 Task 2)                                      | ✅                                                        | ⬜ pending |
| 62-02-03 | 02   | 1    | EXPORT-01   | T-62-06 / T-62-07           | sync window.open before await; revokeObjectURL after fallback                                | unit (component)                       | `pnpm --filter intake-frontend exec vitest run src/components/dossier/__tests__/ExportDossierDialog.test.tsx` | ❌ W0 (created red-first inside 62-02 Task 3, tdd="true") | ⬜ pending |
| 62-03-01 | 03   | 2    | EXPORT-02   | T-62-10 / T-62-11           | ALLOWED_ORIGINS present; no wildcard; authed deploy                                          | CLI                                    | `supabase functions list --project-ref zkrcjzdemdmwhearhfgg \| grep dossier-export-pack`                      | ✅                                                        | ⬜ pending |
| 62-03-02 | 03   | 2    | EXPORT-02   | T-62-09                     | tokens redacted; bodies deleted post-record                                                  | smoke (live staging)                   | per-type curl `-w "%{http_code} %{content_type}"` → all `200 text/html`, X-Failed-Sections empty              | ✅                                                        | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx` — EXPORT-01 behaviors (no PDF/Word, EN/AR only, info line, default language, failed-sections warning). Created red-first inside plan 62-02 Task 3 (`tdd="true"`); no separate Wave 0 plan needed.
- Existing infrastructure (vitest + config + **tests** conventions) covers everything else. Deno unit tests for the edge function are intentionally out of scope — the 62-03 staging smoke is the edge verification layer (no Deno test infra exists in this repo).

---

## Manual-Only Verifications

| Behavior                                                                | Requirement      | Why Manual                                                                           | Test Instructions                                                                                                                                                                                      |
| ----------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Popup-blocker fallback in a real browser (Chrome strict popup settings) | EXPORT-01 (D-07) | popup-blocker heuristics are browser/UI-state dependent; jsdom cannot reproduce them | During `/gsd:verify-work` UAT: block popups for the staging origin, click Export, confirm the .html download + popupBlocked notice; then allow popups and confirm new-tab open with placeholder → pack |
| Print pagination (Cmd+P A4 preview)                                     | D-02             | print rendering is a browser print-engine behavior                                   | Open an exported pack, Cmd+P, confirm cover page alone on page 1, each section starting a new page, table rows unsplit, amber failure block (if any) unsplit and visible in grayscale                  |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (single test file, created red-first in 62-02 Task 3)
- [x] No watch-mode flags (`vitest run` everywhere)
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-11
