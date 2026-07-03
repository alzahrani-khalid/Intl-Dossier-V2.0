---
status: passed
phase: 79-aceternity-removal
audited_by: orchestrator-inline
auditor_agent_blocked: 'gsd-security-auditor spawn blocked by session limit (resets 15:00 Asia/Riyadh); authored inline from reproducible evidence — all mitigations are simple and grep/git-verifiable'
audited: 2026-07-03
---

# Phase 79: Aceternity Removal — Security Audit

**Verdict: PASSED.** All threats from the phase threat models (79-01…79-04, ASVS V5 scope only) are accounted for. No high-severity NEW threat is introduced — the phase strictly _shrinks_ the attack surface (deletes 7 components + `motion/react`, removes a scaffold-time registry ingress). Every mitigation below is verified with a reproducible command.

> **Provenance:** the independent `gsd-security-auditor` spawn was blocked by a session/usage limit (resets 15:00 Asia/Riyadh). This audit was authored inline; each threat mitigation here is trivially reproducible (grep / `git diff --quiet`), so the inline-with-disclosure path is appropriate. Re-running `/gsd:secure-phase 79` after reset is an optional confirmation.

## Threat register vs. code (mitigations confirmed present)

| ID          | Threat                                                                                                                                                                                      | Disposition                              | Evidence (reproducible)                                                                                                                                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T-79-S1** | XSS via user-supplied option labels (`full_name`/`email`) in the rebuilt SearchableSelect                                                                                                   | **mitigated**                            | `grep -rn dangerouslySetInnerHTML frontend/src/components/forms/` → **0**. Options render as React text nodes (auto-escaped). The rebuild added no HTML-injection sink.                                                                                                                                                               |
| **T-79-S2** | Pre-existing PostgREST filter-string interpolation in `UserPicker.handleSearch` (`.or('full_name.ilike.%${query}%,email.ilike.%${query}%')`) — injects PostgREST **filter syntax**, not SQL | **accept (out of scope, facade frozen)** | `git diff --quiet e14475246..HEAD -- UserPicker.tsx` → **unchanged**; the `.or(...)` remains at line 86, **not introduced or altered** this phase. RLS bounds visibility. **Carried-forward hardening flag** (below).                                                                                                                 |
| **T-79-S3** | Dormant Aceternity import/registry path re-introduced later (supply-chain / dependency confusion)                                                                                           | **mitigated**                            | Inverted `no-restricted-imports` ban in root `eslint.config.mjs` **byte-unchanged** (`git diff --quiet` clean); `@aceternity-pro` registry removed from `components.json`; fully-gone proof `grep -rni aceternity frontend/src --include=*.tsx --include=*.ts` → **0**. Re-introduction is CI-visible via the ban + the grep battery. |
| **T-79-SC** | Malicious/compromised package install                                                                                                                                                       | **n/a**                                  | Zero installs this phase: `git diff --name-only e14475246..HEAD -- frontend/package.json pnpm-lock.yaml package.json` → **0 files changed**.                                                                                                                                                                                          |

## Carried-forward hardening flag (NOT this phase)

- **T-79-S2 — `UserPicker.handleSearch` PostgREST interpolation.** The user's locked decision froze the UserPicker facade this phase, so it was byte-untouched by design. Recommend a future hardening pass: switch to `.ilike()` builder calls, or sanitize PostgREST metacharacters (`,`, `(`, `)`, `.`) from `query` before interpolation. Severity is bounded — it is PostgREST filter-grammar injection (not SQL injection), and RLS still constrains which `users` rows are visible. Track outside Phase 79.

## Net security posture

- **Reduced** attack surface: 7 dead components + an orphan hook + a dead demo file deleted; `motion/react` usage removed from the live path; a scaffold-time registry URL removed from `components.json`.
- No new inputs, HTML sinks, auth/authz changes, or dependencies added.

---

_Phase: 79-aceternity-removal — status: passed_
_Audited: 2026-07-03_
