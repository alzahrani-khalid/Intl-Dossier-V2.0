---
status: passed
phase: 79-aceternity-removal
audited_by: gsd-security-auditor (independent, 2026-07-03) — confirms prior orchestrator-inline audit
auditor_independently_confirmed: true
audited: 2026-07-03
---

# Phase 79: Aceternity Removal — Security Audit

**Verdict: PASSED.** All threats from the phase threat models (79-01…79-04, ASVS V5 scope only) are accounted for. No high-severity NEW threat is introduced — the phase strictly _shrinks_ the attack surface (deletes 7 components + `motion/react`, removes a scaffold-time registry ingress). Every mitigation below is verified with a reproducible command.

> **Provenance:** first authored inline on 2026-07-03 because the `gsd-security-auditor` spawn was blocked by a session limit. **The independent `gsd-security-auditor` pass has since run (2026-07-03) and CONFIRMS this audit** — every reproducible command below matches the auditor's results; no gap, no refutation. Verdict `## SECURED`, 4/4 threats CLOSED. The auditor additionally confirmed all 10 pre-existing `motion/react` UI components are byte-unchanged since the phase base (not a re-introduction under T-79-S3) and that the phase's only `components/ui/*.tsx` change is the deletion of `timeline.tsx`.

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

## Security Audit 2026-07-03 (independent gsd-security-auditor)

| Metric        | Count |
| ------------- | ----- |
| Threats found | 4     |
| Closed        | 4     |
| Open          | 0     |

Register origin: authored at plan time (all four 79-0N-PLAN files carry a
`<threat_model>` block) → verify-mitigations mode. Independent auditor verdict:
`## SECURED`. Every declared mitigation reproduced exactly (grep / `git diff
--quiet`). No unregistered flags; the single 79-04-SUMMARY security flag maps to
the already-registered T-79-S2. ASVS scope V5 (Input Validation), `block_on:
high` — no high-severity threat open.

---

_Phase: 79-aceternity-removal — status: passed_
_Audited: 2026-07-03 (inline) · independently confirmed 2026-07-03 (gsd-security-auditor)_
