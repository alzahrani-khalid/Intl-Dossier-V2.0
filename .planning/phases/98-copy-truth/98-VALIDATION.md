---
phase: 98
slug: copy-truth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-18
---

# Phase 98 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `98-RESEARCH.md` §Validation Architecture.
>
> **Every command below was instrument-tested by the orchestrator before it was written here**,
> because this document's sentences are prescriptions someone will follow, not quotations of an
> observation (`RULING-P97-11`'s lesson: both commands in `97-VALIDATION.md` shipped naming a
> package that does not exist and therefore exited 0 for any input).
>
> **Two instrument traps caught while verifying, recorded so they are not re-fallen-into:**
>
> 1. **`timeout` does not exist on this Mac.** Wrapping a check in `timeout 120 …` returns
>    **RC=127 (command not found)** regardless of what the inner command would have done. A
>    negative-control-only test would have read that 127 as "correctly non-zero" and shipped a
>    command that never ran. **Run BOTH controls, always** — the positive control is what exposed it.
> 2. **`pnpm --filter frontend` matches zero packages and exits 0.** The workspace package is
>    `intake-frontend`. Use `cd frontend && pnpm <script>`, and the script is `type-check`, not
>    `typecheck`.

---

## Test Infrastructure

| Property                | Value                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Framework**           | Playwright 1.60.0 (repo root) + Vitest (frontend unit) + node guard scripts wired into `frontend` lint                |
| **Config file**         | `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/playwright.config.ts`                                   |
| **Projects (verified)** | `setup`, `chromium-en`, **`chromium-ar-smoke`** (NOT `chromium-ar`), `chromium-mobile`                                |
| **Quick run command**   | `pnpm exec playwright test tests/e2e/98-<name>.spec.ts --project=chromium-en --no-deps` — from the repo root          |
| **Full suite command**  | `pnpm exec playwright test tests/e2e/98-*.spec.ts --project=chromium-en --no-deps` **and** `cd frontend && pnpm lint` |
| **Estimated runtime**   | quick ~30–90 s per spec; full 98-set + lint ~5–8 min                                                                  |

**`cd frontend && pnpm lint` carries four guard scripts**, verified in `frontend/package.json`:
`eslint --max-warnings 0` → `check-i18n-namespaces.mjs` → `check-duplicate-rtl.mjs` →
`check-bootstrap-parity.mjs` → **`check-date-formatting.mjs`** (the one criterion 5 extends).

**Control results (run 2026-08-18, repo root, both required):**

| control                                               | RC    | reads as                               |
| ----------------------------------------------------- | ----- | -------------------------------------- |
| `… test tests/e2e/98-does-not-exist.spec.ts … --list` | **1** | absent spec FAILS — not vacuous        |
| `… test tests/e2e/01-login.spec.ts … --list`          | **0** | present spec passes — instrument reads |

**Playwright spec paths are FILTERS.** Passing ≥2 paths where ≥1 matches silently drops the rest
and exits 0. Every multi-spec invocation asserts file existence first and hardcodes the expected
spec count — never derives the count from the list it just passed.

---

## Sampling Rate

- **After every task commit:** that task's own spec (quick run) **+** `cd frontend && pnpm lint`
- **After every plan wave:** all existing `98-*` specs **+** lint
- **Phase gate:** the full 98-spec set on **both locale legs**, **+** the built-bundle oracle,
  **+** every population command re-derived with post-fix counts recorded
- **Max feedback latency:** ~90 s (single spec + lint)

**Both-locale legs.** The `ar` leg runs by `?lng=ar` URL flip inside `chromium-en` (the Phase 96
pattern), not by switching project — `chromium-ar-smoke` is a narrower smoke project and is not the
both-locale mechanism. Every green states its **locale** and its **role**.

---

## Per-Task Verification Map

Task IDs are assigned by the planner; this map fixes the requirement → oracle binding it must honor.
**Wave 0 must prove each new spec RED at HEAD via its own negative control before any repair lands** —
a spec that has never failed has not been shown to detect anything.

| Requirement     | Behavior verified                                                 | Test type                        | Automated command                                                       | Exists?                   |
| --------------- | ----------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------- | ------------------------- |
| COPY-01         | no snake_case / ISO-week token renders as user copy               | e2e DOM detector                 | `98-copy01-labels.spec.ts`                                              | ❌ Wave 0                 |
| COPY-02         | no raw key renders; no missing-key console warn, both locales     | e2e + console capture            | `98-copy02-rawkeys.spec.ts`                                             | ❌ Wave 0                 |
| COPY-03 **[V]** | forced empty/error digest states render the rewritten copy        | e2e, CDP-forced states           | `98-copy03-dashboard.spec.ts`                                           | ❌ Wave 0                 |
| COPY-04         | named + bounded voice surfaces (D-20 captured-label set)          | e2e + derivation floors          | `98-copy04-voice.spec.ts`                                               | ❌ Wave 0                 |
| COPY-05         | date/time shapes render; dev string absent from the BUILT bundle  | e2e + build-artifact grep + lint | `98-copy05-dates.spec.ts`; extended `scripts/check-date-formatting.mjs` | guard ✓ (extend); spec ❌ |
| COPY-06         | default success toast localized on a REAL mutation, both locales  | e2e both locales                 | `98-copy06-toast.spec.ts`                                               | ❌ Wave 0                 |
| COPY-07         | stats-card `% of total active dossiers` localized, both locales   | e2e rendered card                | folded into the C1 or C8 spec                                           | ❌ Wave 0                 |
| COPY-08         | EO popover header + description + all four sections, both locales | e2e render assertion             | `98-copy08-eo-popover.spec.ts`                                          | ❌ Wave 0                 |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — all ⬜ pending at authoring._

**Derivation commands are FINDERS, not CLOSERS** (D-07). A population command may locate defects and
may serve as a lint-style floor; the criterion closes on the rendered surface or the drilled
instrument. The `entityLinks` 82/82 census is explicitly a **backstop, not a closure** (D-24), and any
of its 8 surfaces the oracle set cannot drive closes on census **plus a named UNDRIVEN scope line**.

---

## Wave 0 Requirements

- [ ] Eight `tests/e2e/98-*.spec.ts` files, **each proven RED at HEAD via its own negative control**
      before any repair lands
- [ ] `scripts/check-date-formatting.mjs` extended to the classes it does not currently check
      (`formatDistanceToNow`, date-fns `PPP`/`PP`/`h:mm a`, `.toLocaleString` on Dates), with
      fixtures under its existing CLI-arg self-test directory — the script is already lint-wired and
      GREEN at HEAD, so the extension must be shown failing on a planted fixture first
- [ ] Built-bundle oracle for criterion 5's `intake:fillMock` deletion, **with a positive control**
      (a string that must be present in the same built output), so a passing grep cannot be
      confused with a build that never produced the artifact

---

## Manual-Only Verifications

| Behavior                                             | Requirement | Why manual                                                                    | Instructions       |
| ---------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- | ------------------ |
| Arabic copy reads naturally / single-term glossary   | —           | **OUT OF PHASE** — Phase 99 (`AR-01..04`) owns it; P98 only proves resolution | not run this phase |
| Pixel RTL / visual sign-off                          | —           | **OUT OF PHASE** — Phase 99 + the operator's own sitting                      | not run this phase |
| Sentence-case judgment on the ~4.5k-string long tail | `COPY-09`   | **OUT OF PHASE** — Phase 102; per-string proper-noun judgment, non-mechanical | not run this phase |

All in-phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have an `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 covers every MISSING reference above
- [ ] No watch-mode flags
- [ ] Feedback latency < 90 s
- [ ] Every new spec shown RED before its repair lands
- [ ] Every zero-returning instrument shown non-zero on a known-present case
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
