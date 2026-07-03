---
phase: 77
slug: linear-token-system
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-03
---

# Phase 77 — Linear Token System · Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Auditor:** gsd-security-auditor · **Date:** 2026-07-03 · **ASVS Level:** 1 · **block_on:** high
**Register origin:** authored at plan time (8 PLAN `<threat_model>` blocks) — mitigations VERIFIED against implementation; no new-threat scan performed.
**Verdict:** SECURED — 14/14 mitigate threats CLOSED; 9 accept-disposition risks recorded. `threats_open: 0`. No unregistered flags.

---

## Trust Boundaries

| Boundary                                | Description                                                                                              | Data Crossing                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| dev machine → staging DB                | Supabase MCP seed refresh writes to staging fixture rows (77-01)                                         | Deterministic `b0000002-*` fixture dates (non-sensitive)             |
| repo → CI                               | Committed baseline PNGs become the Phase-80 comparison oracle (77-01)                                    | Visual-regression artifacts                                          |
| CLI arg → filesystem                    | Parity guard accepts a fixture path argument (77-02/04)                                                  | Repo-local fixture path (string)                                     |
| vm sandbox → bootstrap source           | Guard executes repo `bootstrap.js` in-process via `node:vm` (77-02)                                      | ES5 source string executed in a stubbed sandbox                      |
| localStorage → bootstrap/DesignProvider | Untrusted `id.dir` / `id.theme` / `id.hue` values drive first-paint + steady-state theming (77-03/04/07) | Client-controlled enum keys, coerced to a fixed whitelist before use |

---

## Threat Register

### Mitigate threats (verified present in code)

| Threat ID  | Category    | Component                                       | Disposition | Mitigation / Evidence                                                                                                                                                                                                                                                                | Status |
| ---------- | ----------- | ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T-77-01-01 | Tampering   | staging seed refresh                            | mitigate    | `77-01-SUMMARY.md:67` — 3 deterministic `b0000002-*` `engagement_dossiers` rows refreshed via idempotent **date-only** UPDATEs, verified with `get_upcoming_events(NULL,14)`; no schema changes/deletes (mirrors 46-01).                                                             | CLOSED |
| T-77-01-02 | Repudiation | baseline integrity (laundering)                 | mitigate    | `git merge-base --is-ancestor 14191cb85 0ba9c9044` = true → baseline commit (77-01) precedes first `directions.ts` change (77-03); human-signed `77-BASELINE-VALIDATION.md` (43 PNGs reviewed pre-swap).                                                                             | CLOSED |
| T-77-02-01 | Tampering   | fixture path CLI arg                            | mitigate    | `scripts/check-bootstrap-parity.mjs:199` `resolve(repoRoot, cliArg)`; `:201` `readFileSync(...,'utf8')` read-only; imports only `node:fs/path/url/vm` (`:47-50`) — no `child_process`/subprocess.                                                                                    | CLOSED |
| T-77-02-02 | Elevation   | vm execution of bootstrap source                | mitigate    | `scripts/check-bootstrap-parity.mjs:163-168` `createContext({ localStorage, document, parseInt, isNaN })` — only hand-built stubs; no `require`, no `process`, no network object exposed into the vm sandbox.                                                                        | CLOSED |
| T-77-02-03 | DoS         | guard flakiness blocking CI                     | mitigate    | Pure deterministic (no network/timing). Both polarities proven live: guard EXIT=0 on real `bootstrap.js`; EXIT=1 (11 divergences) on `tools/bootstrap-fixtures/bad-bootstrap.js`. CI wires both — `ci.yml:84-85` (pass) + `:87-91` positive-failure step.                            | CLOSED |
| T-77-03-01 | Tampering   | stored id.dir selecting palettes                | mitigate    | Whitelist: `tokens/directions.ts:25` `PALETTES` has `linear` only (no legacy dirs); `bootstrap.js:60-119` paints solely via static `P.linear[m]` lookups → `style.setProperty`; `DesignProvider.tsx:54` `isDirection = v === 'linear'`.                                              | CLOSED |
| T-77-03-02 | Integrity   | silent AA regression in derived palettes        | mitigate    | `frontend/tests/unit/design-system/contrast.test.ts` gates every derived text-role at WCAG AA ≥ 4.5:1 across dark+light (ink ladder, accent.ink on surface AND accent.soft, sla/semantic fg on surface AND own soft, 6 status pairs). Green (82/82); includes H1/M1 gapfix pairings. | CLOSED |
| T-77-04-01 | Tampering   | stored id.dir / id.theme injection              | mitigate    | `bootstrap.js:20-23` coerces any `id.dir !== 'linear'` → `'linear'`; `:25-26` theme whitelisted to `light\|dark` else `dark`. `DesignProvider.tsx:211` mirrors. Values reach DOM only as static-table lookups (no reflection of raw storage).                                        | CLOSED |
| T-77-04-02 | DoS         | first-paint token loss for legacy users         | mitigate    | Dual-layer coercion in one commit (`bootstrap.js:20` + `DesignProvider.tsx:210-213`); guard retired-dir probes (`check-bootstrap-parity.mjs:251-280`); `coercion.test.ts:110-115` blocked/read-only-storage case paints linear without throwing.                                     | CLOSED |
| T-77-04-03 | Tampering   | :root third-copy drift re-emerging              | mitigate    | `:root` third-copy check `check-bootstrap-parity.mjs:282-316` (51 literal checks pass). Wired in lint `frontend/package.json:17` and CI `ci.yml:63-64` (`pnpm run lint`) + `:84-85` (direct guard).                                                                                  | CLOSED |
| T-77-06-01 | Tampering   | visual-regression risk masquerading as styling  | mitigate    | `frontend/tests/unit/design-system/handoff-css-contract.test.ts` asserts recipe contract (labels/`th` on `--font-body` not mono, no card `box-shadow`, blur-free overlays) and the 5-column dossier grid unchanged — no layout properties touched. Green.                            | CLOSED |
| T-77-07-01 | Tampering   | stale id.hue / retired id.dir from old tabs     | mitigate    | `bootstrap.js:22` try-guarded `id.dir` write-back + `:123-131` try-guarded `removeItem`; `DesignProvider.tsx:212` try-guarded `removeItem('id.hue')`; storage-event listener `:336` accepts `id.dir` only via `isDirection` (`'linear'` whitelist).                                  | CLOSED |
| T-77-07-02 | DoS         | engagement-domain corruption via name collision | mitigate    | Direction retirement did not clobber the engagement-domain `'ministerial'` meeting type: present in `frontend/src/types/engagement.types.ts:62,490` and `i18n/{en,ar}/engagements.json:108`.                                                                                         | CLOSED |
| T-77-08-01 | Repudiation | docs diverging from shipped values              | mitigate    | `frontend/DESIGN.md` transcribes shipped values from `directions.ts` — spot-checked verbatim hexes `#010102` (bg, DESIGN.md:62), `#f7f8f8` (ink, :67), `#5e6ad2` (accent, :81/:142) match `PALETTES.linear`; parity guard keeps the three code-side copies honest.                   | CLOSED |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

| Risk ID  | Threat Ref                   | Rationale                                                                                                                                                                            | Accepted By                              | Date       |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------- |
| AR-77-SC | T-77-01-SC … T-77-08-SC (8×) | Tampering (pkg install): no package-manager installs in any Phase-77 plan; slopcheck N/A.                                                                                            | gsd-secure-phase (plan-time disposition) | 2026-07-03 |
| AR-77-05 | T-77-05-01                   | Spoofing/Tampering: removal of the switcher/hue controls shrinks the input surface; stale writes from old tabs are neutralized by the 77-04 coercion (verified under T-77-04-01/02). | gsd-secure-phase (plan-time disposition) | 2026-07-03 |

_Accepted risks do not resurface in future audit runs._

---

## Unregistered Flags

None. No `## Threat Flags` section appears in any of `77-01`…`77-08` SUMMARY — expected for a design-system/token phase that introduces no new runtime attack surface (no endpoints, no auth paths, no user-input sinks; only build-time literals + client-side localStorage coercion, all covered by the register above).

---

## Verification Commands (read-only, reproducible)

```
git merge-base --is-ancestor 14191cb85 0ba9c9044      # T-77-01-02 → exit 0
node scripts/check-bootstrap-parity.mjs                # EXIT 0 (6 combos + 5 coercion probes + 51 :root checks)
node scripts/check-bootstrap-parity.mjs \
  tools/bootstrap-fixtures/bad-bootstrap.js            # EXIT 1 (11 divergences — both polarities)
pnpm --dir frontend exec vitest run \
  tests/unit/design-system/contrast.test.ts \
  tests/bootstrap/coercion.test.ts \
  tests/unit/design-system/handoff-css-contract.test.ts   # 82/82 pass
```

---

## Security Audit Trail

| Audit Date | Threats Total | Closed                                        | Open | Run By                      |
| ---------- | ------------- | --------------------------------------------- | ---- | --------------------------- |
| 2026-07-03 | 23            | 23 (14 mitigate verified + 9 accept recorded) | 0    | gsd-security-auditor (opus) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-03

---

## Notes

- Cross-references: `77-VERIFICATION.md` (goal-backward 35/35 pass), `77-REVIEW.md` Security section ("No issues"), `77-GAPFIX-SUMMARY.md` (H1/M1/M2 dark-mode WCAG AA fixed — now locked by `contrast.test.ts`).
- Implementation files were not modified during this audit (read-only).
