---
phase: 76
slug: rtl-infrastructure-bridge-shadcn-logical-properties
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-03
---

# Phase 76 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 5 plans carried `<threat_model>` blocks).
> Verification scope: confirm declared mitigations exist — no new-threat scanning.
> Implementation files treated read-only. Verdict: **SECURED — 9/9 closed, 0 open.**

---

## Trust Boundaries

| Boundary                       | Description                                                                             | Data Crossing                            |
| ------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| npm registry → node_modules    | `@radix-ui/react-direction` crosses the supply-chain boundary at install                | Package code (exact-pinned 1.1.2)        |
| npm registry → dev machine     | `shadcn` CLI fetched + executed at dev time via `pnpm dlx` (never a runtime dep)        | CLI code (dev-time only)                 |
| localStorage → direction state | `id.locale` is client-writable; selects `ltr`/`rtl` rendering only                      | Cosmetic UI preference                   |
| repo files → CI script         | `check-duplicate-rtl.mjs` reads repo file contents in CI; contents are PR-influenceable | Source text (read-only, regex-tokenized) |
| codemod → working tree         | shadcn `migrate rtl` rewrites source files; scope is correctness-critical               | Source files (bulk output rejected)      |
| dev screenshots → `.planning`  | AR RTL evidence PNGs committed as verification artifacts                                | UI render (test/seed data only)          |

---

## Threat Register

| Threat ID | Category                 | Component                                                        | Disposition | Mitigation / Evidence                                                                                                                                                                                                  | Status |
| --------- | ------------------------ | ---------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T-76-SC   | Tampering (supply chain) | npm install `@radix-ui/react-direction` (+ shadcn CLI, dev-time) | mitigate    | `frontend/package.json:54` exact pin `"1.1.2"` (no `^`/`~`); `pnpm-lock.yaml:432-434` specifier+resolved `1.1.2` + sha512 integrity; `shadcn` absent from package.json & lockfile                                      | closed |
| T-76-01   | Tampering                | `document.dir` via devtools/extension                            | accept      | Every `document.dir` read is cosmetic (`sidebar.tsx:570` layout; `AppShell.tsx` drawer placement); `Sparkline.rtl.test.tsx:73` proves flip ≠ render change; no authz keys off it                                       | closed |
| T-76-02   | DoS                      | `languageChanged` subscription leak                              | mitigate    | `direction.tsx:22-25` subscribe returns `() => i18n.off('languageChanged', onStoreChange)` via `useSyncExternalStore`; `__tests__/direction.test.tsx` exercises mount/unmount + lang change (3 tests, TL auto-cleanup) | closed |
| T-76-03   | Elevation of Privilege   | `scripts/check-duplicate-rtl.mjs`                                | mitigate    | Only `node:fs`/`node:path`/`node:url`, read-only `fs.read*`; no eval/child_process/dynamic import; `srcRoot` from `argv`/literal (33-40), never scanned content                                                        | closed |
| T-76-04   | Repudiation              | CI guard theater                                                 | mitigate    | `ci.yml:78-82` bash-negated positive-failure `! node … tools/rtl-fixtures` (passes only on non-zero exit); fixture `duplicate-rtl-bad.tsx:15` carries duplicated `rtl:space-x-reverse`; live-tree step `ci.yml:76`     | closed |
| T-76-05   | Tampering                | Radix `dir` prop overrides (per-instance)                        | accept      | 8 wrappers forward `dir={dir}` to Radix (accordion:7, dropdown-menu:8, heroui-tabs:22, navigation-menu:14, scroll-area:12, select:8, slider:12, toggle-group:28); no security keyed off dir                            | closed |
| T-76-06   | Tampering                | shadcn CLI (supply chain, dev-time)                              | mitigate    | `components.json:23` `"rtl": true`; `shadcn` not a runtime dep (dev-time `pnpm dlx` only)                                                                                                                              | closed |
| T-76-07   | Tampering                | codemod rewriting files outside scope                            | mitigate    | `git show --stat 52f069e9b` = only `frontend/components.json` (1 file); bulk `migrate rtl` output rejected (`8e072ccb7` = planning docs only, no source rewrite landed)                                                | closed |
| T-76-08   | Information Disclosure   | AR screenshots committed to `.planning`                          | mitigate    | Evidence PNGs show test/seed only — SRTL-02 events, `test-*@example.com`/`@gastat.test` synthetic users, developer's own test account; no production PII                                                               | closed |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

| Risk ID  | Threat Ref | Rationale                                                                                                                                                                                                                                                                                     | Accepted By                     | Date       |
| -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- |
| AR-76-01 | T-76-01    | Direction is cosmetic client state derived from a UI language preference; no authorization, clearance, or data-access decision reads `document.dir`. Worst case is a mis-mirrored layout visible only to the tamperer. Confirmed: all `document.dir` reads in `frontend/src` are layout-only. | plan-time (verified 2026-07-03) | 2026-07-03 |
| AR-76-05 | T-76-05    | The per-instance Radix `dir` prop passthrough is retained by design for LtrIsolate-style content boundaries; it selects rendering direction only. Confirmed: no security decision keys off any per-instance `dir`.                                                                            | plan-time (verified 2026-07-03) | 2026-07-03 |

_Accepted risks do not resurface in future audit runs._

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By                      |
| ---------- | ------------- | ------ | ---- | --------------------------- |
| 2026-07-03 | 9             | 9      | 0    | gsd-security-auditor (opus) |

---

## Notes

- `T-76-SC` appears as `mitigate` in 76-01/76-04 and `accept` in 76-02/76-03/76-05 (plans that install nothing). Verified once against the real dependency delta: the only new package this phase is `@radix-ui/react-direction@1.1.2` (exact-pinned, official Radix monorepo, no runtime shadcn dep).
- The lockfile also resolves a transitive `@radix-ui/react-direction@1.1.1` (`pnpm-lock.yaml:3617`) for other Radix packages; the direct dependency added this phase resolves to exactly `1.1.2`. Not a pinning gap.
- No `## Threat Flags` section exists in any 76-0N SUMMARY.md; no undeclared attack surface appeared during implementation.
- Implementation files were not modified during this audit. Only `76-SECURITY.md` was written.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-03
