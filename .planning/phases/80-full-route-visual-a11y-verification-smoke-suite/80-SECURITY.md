# Phase 80 — Security Audit (SECURED)

**Phase:** 80 — full-route visual + a11y verification & smoke suite
**Audited:** 2026-07-04 (retroactive, post-implementation)
**Auditor:** gsd-security-auditor (independent verification against disk + git, not summaries)
**ASVS floor:** L1 (verification/CI-hardening phase — introduces no new auth/data/endpoint surface;
its threats are verification-INTEGRITY controls: baseline laundering, false-green, unauthorized
staging writes, CI-secret handling)
**Threats closed:** 20 / 20 · **threats_open: 0**

Phase 80's threat register spans T-80-01 … T-80-19 plus the shared supply-chain threat T-80-SC
(one `accept` entry replicated across all 6 plans, counted once). Every declared mitigation was
verified present in the implemented artifacts and git history. No mitigation was accepted on the
strength of documentation alone.

---

## Verdict table (per-threat, by disposition)

<!-- prettier-ignore-start -->

| Threat ID | Category | Disposition | Verdict | Evidence (disk / git) |
| --- | --- | --- | --- | --- |
| T-80-01 | Tampering (a11y baseline evidence) | mitigate | **CLOSED** | `80-A11Y-BASELINE.md` §1: single reference env (local seeded dev), date `2026-07-03`, HEAD `b5ad1ac3f`, verbatim command, raw log archived to scratchpad `a11y-characterization.log` |
| T-80-02 | Repudiation (fixture drift misread as a11y fail) | mitigate | **CLOSED** | §2: orchestrator Supabase-MCP liveness probe recorded BEFORE any classification — 7/7 dossiers (6 `testDossierIds` + `FIXTURE_DOSSIER_ID`) + 3/3 SRTL-02 July-2026 `calendar_entries` rows LIVE; STOP-and-escalate path documented |
| T-80-03 | Info disclosure (test creds in probe) | mitigate | **CLOSED** | Probe script never committed (`git worktree list` clean; not in `git ls-files`); the 6-char `TEST_USER_PASSWORD` literal appears in ZERO phase-80 files; `calendar-rtl.spec.ts:12` carries only the admin *email* in an RLS-explanation comment (non-secret identifier, on the do-not-flag list) |
| T-80-04 | Tampering (recorded baseline set A) | mitigate | **CLOSED** | §9 + §9.1: real run on `git worktree add ../intl-pre-token 14191cb85`; both run commands + date recorded; raw logs `setA-a11y-14191cb85.log` / `setA-4axis-*.log` archived |
| T-80-05 | Spoofing (wrong-tree scan) | mitigate | **CLOSED** | §9.1 poison guard: `:5173` verified DOWN (`lsof -ti:5173`) before EACH leg so `reuseExistingServer` booted the worktree server; ledger records which tree served each leg |
| T-80-06 | Info disclosure (env-file copies in worktree) | mitigate | **CLOSED** | §9.1 cleanup: `git worktree remove --force`; `git worktree list` shows no `intl-pre-token`; `git ls-files` shows no real `.env` committed (only `*.env.example` templates) |
| T-80-07 | Tampering (false-green via bulk fixme) | mitigate | **CLOSED** | Exactly **4** `80: recorded pre-migration baseline` fixme strings in `qa-sweep-axe-4axis.spec.ts` == 4 ledger `recorded` rows (§11.1 rows 9–12); all 4 NEW-on-HEAD `color-contrast` items were FIXED (`556f20705`), zero recorded — record-count parity holds |
| T-80-08 | Repudiation (untraceable records) | mitigate | **CLOSED** | All 4 records carry the `80:` phase marker + one `TRACKED APP A11Y DEBT` block in `qa-sweep-axe-4axis.spec.ts` + ledger decision table §11.1 — full traceability chain per record |
| T-80-09 | Tampering (src fix regressing visuals silently) | mitigate | **CLOSED** | `git merge-base --is-ancestor 556f20705 d412b7518` = true → the chip src fix landed BEFORE the visual replay; §11.2 flags the pixel effect for the human triage that followed (§10) |
| T-80-10 | Tampering (baseline laundering) | mitigate | **CLOSED** | `80-VISUAL-RECOMPARE.md` §9: replay ran `--retries=0` with **no** `--update-snapshots`; git-status PNG tripwire over both snapshot roots = EMPTY |
| T-80-11 | Repudiation (auto-approved diffs) | mitigate | **CLOSED** | §5/§10: 43 human verdicts scribed (39 intended-Linear, 4 within-tolerance, **0 regression**); approval line = reviewer + `2026-07-03`; `checkpoint:human-verify` honored, no executor-invented verdict |
| T-80-12 | Elevation of privilege (executor staging writes) | mitigate | **CLOSED** | §2: seed refresh applied by the ORCHESTRATOR via Supabase MCP; "The executor performed no staging write and did not re-run the seed" — executor holds only read-path test login |
| T-80-13 | Tampering (recapture before approval) | mitigate | **CLOSED** | `git merge-base --is-ancestor 4927c7513 799ef3c44` = true → recapture (`799ef3c44`) is a descendant of the triage-approved commit; §11.3 records the hard-gate precondition check |
| T-80-14 | Tampering (threshold loosening) | mitigate | **CLOSED** | `playwright.config.ts` absent from the recapture commit file list (40 files = 39 PNG + 1 ledger) AND untouched across the entire phase (`git log b5ad1ac3f..HEAD -- …/playwright.config.ts` empty) |
| T-80-15 | Repudiation (untraceable lineage) | mitigate | **CLOSED** | §11.5 + commit `799ef3c44` message: old lineage `14191cb85` recoverable, new Linear lineage, seed↔FROZEN_TIME coupling all recorded |
| T-80-16 | Info disclosure (CI secrets in new job) | mitigate | **CLOSED** | `ci.yml` `test-rtl-smokes`: `TEST_USER_*` / `VITE_SUPABASE_*` sourced only via `${{ secrets.E2E_ADMIN_* }}` / `${{ secrets.E2E_SUPABASE_* }}`; zero inline literals; artifact = HTML report with `if: always()` (same posture as test-a11y) |
| T-80-17 | Elevation of privilege (admin creds scope in CI) | accept | **CLOSED** | Admin creds required by the `/users` pagination smoke (admin-gated `requireAdmin`); already consumed by `e2e.yml`; scoped to this one job (test-a11y keeps analyst); rationale documented in the job comment |
| T-80-18 | Tampering (gating theater) | mitigate | **CLOSED** | `80-06-SUMMARY.md`: promotion DEFERRED per overseer pre-decision; honest record shows `gh api …/protection` lists 8 contexts and `RTL Portal + Component Smokes` is NOT among them — "gating is NOT silently claimed" |
| T-80-19 | DoS (August seed-cliff time-bomb) | mitigate | **CLOSED** | `calendar-rtl.spec.ts`: `FakeDate` pins `new Date()` to `2026-07-15T12:00:00Z` (July) via `addInitScript` before `goto('/calendar')`, `Date.now()` kept real (no auth-token expiry); `rtl-component-smokes.spec.ts` is screenshot-free (the lone `toHaveScreenshot` token is a prohibition comment, line 7) |
| T-80-SC | Tampering (npm/pip/cargo installs) | accept | **CLOSED** | `git diff b5ad1ac3f..HEAD -- frontend/package.json` = ONLY the `test:a11y` script repoint (`vitest …` → `playwright test --project=a11y`); zero dependency/devDependency lines added; `pnpm-lock.yaml` untouched; worktree build used `--frozen-lockfile` |

<!-- prettier-ignore-end -->

---

## Anti-laundering commit-order proof (the load-bearing control chain)

The VERIFY-01/VERIFY-02 integrity guarantee is an _ordering_ control. Verified via git ancestry
(`git merge-base --is-ancestor`), the mandated order held on the actual DAG:

```
556f20705  fix(80-03)  semantic chips -soft washes        ─┐ src fix
b3283a9c9  test(80-03) record engagements baseline         │
d412b7518  test(80-04) replay evidence (--retries=0)       │ replay (baselines untouched)
eb37e7662  docs(80-04) scribe human diff-triage verdicts   │ human review
4927c7513  docs(80-04) triage APPROVED (0 regressions)      │ approval gate
799ef3c44  test(80-05) --update-snapshots recapture         ┘ recapture (only now permitted)
```

fix → replay → review → approval → recapture. No `--update-snapshots` ran before the human
approval commit; the Bureau baseline PNGs stayed byte-identical to `14191cb85` throughout the
replay leg.

---

## Attack-surface inventory (new/modified code, non-doc)

7 files changed in the phase; the ONLY `frontend/src` change is a CSS token-reference fix:

- `.github/workflows/ci.yml` — new advisory `test-rtl-smokes` job (secrets-only env)
- `frontend/package.json` — `test:a11y` script repoint only
- `frontend/src/styles/list-pages.css` — chip `-soft` washes (a11y color-contrast MF-1/2/3); CSS
  `var(--*)` reference change only, no palette literal edited, `check-bootstrap-parity.mjs` passes
- `frontend/tests/e2e/{qa-sweep-axe-4axis,rtl-component-smokes,calendar-rtl,dashboard-widgets-visual}.spec.ts`

No new authentication, authorization, data-access, endpoint, or user-input surface was introduced.
Consistent with a verification/CI-hardening phase.

---

## Unregistered flags

**None.** No phase-80 `*-SUMMARY.md` declares a `## Threat Flags` section, and the code inventory
above surfaced no new attack surface beyond the declared threat register. Nothing to reconcile.

---

## Pre-existing observations (NOT phase-80 gaps, not blockers)

- **Test password in pre-existing repo docs.** The 6-character `TEST_USER_PASSWORD` literal is
  present in ~19 tracked files that ALL predate Phase 80 (`README.md`, `backend/test-auth-direct.js`,
  `docs/ANYTHINGLLM_SETUP.md`, several `specs/**/quickstart.md`, `.archive/**`). None are phase-80
  artifacts; Phase 80 introduced no new occurrence. This is a standing repo-hygiene item outside
  this phase's scope and does not block Phase 80. (Recommend a separate credential-hygiene sweep.)

## Intentional non-flags (acknowledged, per audit scope)

- Branch-protection promotion DEFERRED — a recorded overseer decision (`80-06-SUMMARY.md`), delivered
  honestly as job-exists + advisory. Not a security gap.
- The admin test user (`kazahrani@stats.gov.sa`) authenticating against staging via `.env.test` is
  the established, intended test-harness pattern. The admin email appearing in a `calendar-rtl.spec.ts`
  RLS-explanation comment is a non-secret identifier, not a credential leak.

---

**Result: SECURED — 20/20 threats CLOSED, threats_open: 0. Phase 80 clears security audit.**
