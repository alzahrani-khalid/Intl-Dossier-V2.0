---
phase: 78
slug: heroui-v3-api-audit-bump
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-03
---

# Phase 78 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Phase 78 is a light dependency-bump + regression-sweep phase (`@heroui/react` +
`@heroui/styles` 3.0.5 → 3.2.1). No application logic, auth, input-handling, or
data-path code changed. The register was authored at plan time across all four
plans (`register_authored_at_plan_time: true`); this audit verifies each
mitigation exists in the implementation rather than scanning for new threats.

---

## Trust Boundaries

| Boundary                       | Description                                                                                                  | Data Crossing                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| npm registry → node_modules    | Third-party package code enters the build at `pnpm install` time (78-01)                                     | Executable package code (build/runtime)              |
| Test harness → smoke artifacts | Playwright smoke logs in with `.env.test` credentials against the dev server (78-04)                         | Test-account credentials (low sensitivity, non-prod) |
| (78-02, 78-03)                 | No boundary crossed — markup migration of a zero-consumer wrapper + read-only verification greps/type-checks | none                                                 |

---

## Threat Register

| Threat ID | Category               | Component                                                        | Disposition       | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Status |
| --------- | ---------------------- | ---------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T-78-01   | Tampering              | `@heroui/react` + `@heroui/styles` install (dependency versions) | mitigate          | Both packages exact-pinned to the Phase-75-audited `3.2.1` in `frontend/package.json:44-45` (no `^`/`~`, no bump past audit). `pnpm-lock.yaml` resolves **only** `3.2.1` for each — zero `@3.0.5` remnants; `@heroui/react@3.2.1` couples `@heroui/styles: 3.2.1` exactly. Transitive delta matches the documented expected set: react-aria externalized, `react-aria-components` 1.17.0 → **1.18.0** (confirmed in lockfile). The two `@heroui/styles@3.2.1` lockfile instances are a `tailwind-merge` peer-suffix split (3.4.0 / 3.6.0), both 3.2.1 — not a version desync. | closed |
| T-78-SC   | Tampering              | pnpm supply chain / package installs                             | accept (residual) | Accepted risk — see Accepted Risks Log. Version bump of two **existing, already-audited** packages (RESEARCH §Package Legitimacy Audit: both Approved, official `heroui-inc` org, npm + GitHub releases cross-checked 2026-07-03). No new package names introduced, so no blocking human legitimacy checkpoint required.                                                                                                                                                                                                                                                      | closed |
| T-78-I    | Information Disclosure | 78-04 smoke-test credentials                                     | mitigate          | Smoke login uses `$TEST_USER_EMAIL` / `$TEST_USER_PASSWORD` sourced from the git-ignored `.env.test` (matched by the `.env.*` rule in `.gitignore:24`; `git check-ignore` confirms both `.env.test` and `frontend/.env.test` are ignored). Artifact scan of all Phase-78 files found **zero** credential values, emails, or usernames; the `78-04-smoke/` directory holds only 4 post-auth drawer screenshots (EN/AR app-shell + tweaks), no login-form captures.                                                                                                             | closed |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale                                                                                                                                                                                                                                                                                                                                                                    | Accepted By                                     | Date       |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------- |
| R-78-SC | T-78-SC    | pnpm supply-chain residual risk for a version bump of two existing, legitimacy-audited packages (`@heroui/react`, `@heroui/styles`). No new package names enter the tree; RESEARCH audit table has zero [ASSUMED]/[SUS]/[SLOP] entries. Residual risk is the standard third-party-install exposure that the exact-pin + lockfile-verification gate (T-78-01) already bounds. | GSD secure-phase (plan-time disposition, 78-01) | 2026-07-03 |

_Accepted risks do not resurface in future audit runs._

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By                                                                       |
| ---------- | ------------- | ------ | ---- | ---------------------------------------------------------------------------- |
| 2026-07-03 | 3             | 3      | 0    | gsd-secure-phase (orchestrator verification, register authored at plan time) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-03
