---
phase: 75
slug: ui-component-migration-audit
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-02
---

# Phase 75 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register deduped from the four PLAN.md `<threat_model>` blocks
> (`register_authored_at_plan_time: true`). This is a **docs-only** phase — the
> "implementation" is three committed audit artifacts, not production code. This
> audit verifies each declared mitigation is present in those artifacts; the
> artifacts and all source files were read-only and no new-threat scan was
> performed. Every recorded evidence gate was re-run live against the working
> tree at verification time.

---

## Trust Boundaries

| Boundary                          | Description                                                                                   | Data Crossing                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| audit doc → git history           | committed planning docs are permanent; anything pasted into them is disclosed to repo readers | file paths, component names, commands, counts |
| audit doc → Phases 76/77 planners | RTL-bridge + TOKEN-06 re-skin act on classifications without re-deriving them                 | keep-custom / replace / block verdicts        |
| audit doc → Phase 78 executor     | HeroUI 3.0.5→3.2.1 bump trusts the AUDIT-02/03 confirmation as its regression baseline        | import inventory, removed-name confirmation   |
| audit doc → Phase 79 rebuild      | Aceternity rebuild verifies its a11y/validation criteria against these contracts              | RHF/Zod + ARIA + keyboard-focus contracts     |

---

## Threat Register

All 7 threats verified CLOSED by gsd-security-auditor (opus) on 2026-07-02.
Gate-based mitigations (T-75-02/06) and the T-75-03 evidence greps were re-run
live and required exit 0 / matching output. T-75-01 was verified by an actual
secret/runtime-data scan of the three artifacts, not by accepting the claim.

| Threat ID | Category                                                 | Component                                               | Disposition  | Mitigation                                                                                                                                                                                          | Status            |
| --------- | -------------------------------------------------------- | ------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| T-75-01   | Information Disclosure                                   | all three 75-AUDIT-\*.md artifacts                      | mitigate     | Live secret scan of all 3 artifacts returned zero hits for JWTs, Bearer/Authorization headers, secret keys, real emails, password/token literals, IPs                                               | closed            |
| T-75-02   | Elevation of Privilege (downstream)                      | classification of clearance/flags/dossier-type surfaces | mitigate     | criterion-5 directory awk gate exit 0; ltr-isolate awk gate exit 0; all 10 clearance/flags feature dirs classify keep-custom; per-file downgrade gate exit 0                                        | closed            |
| T-75-03   | Repudiation / stale-evidence                             | HeroUI confirmation verdicts                            | mitigate     | import-site grep = 8 (live); removed-names grep 0 hits / exit 1 (live); compound spot-check 16 dot-notation lines (live); lookalikes carry no @heroui import (live); machine-readable lines present | closed            |
| T-75-04   | EoP / validation bypass (ASVS V5)                        | RHF/Zod + ARIA error-announcement contracts             | mitigate     | 8 component sections each carry the 7-field template; ARIA coverage present: aria-invalid ×8, aria-describedby ×19, role="alert" ×19, aria-live ×6; live-region gaps flagged preserve-or-improve    | closed            |
| T-75-05   | Denial of (future) Service — wasted rebuild of dead code | Phase 79 scope                                          | mitigate     | every contract leads with a Liveness field (8/8); "Phase 79 rescope input" section present; 7-of-8-dead recorded, rebuild-vs-delete deferred to user                                                | closed            |
| T-75-06   | Tampering (self) — classification without evidence       | Evidence cells in classification rows                   | mitigate     | 0 of 209 classification rows have an empty Evidence cell; downgrade gate exit 0 (0 empty-behavior primitive rows); liveness claims from pasted symbol greps, never barrel presence or filenames     | closed            |
| T-75-SC   | Tampering                                                | package installs                                        | accept (n/a) | docs-only phase — nothing installed; git confirms all phase-75 commits are `docs(...)`, files_modified = the three audit `.md` artifacts only                                                       | closed (accepted) |

---

## Verification Evidence (live re-runs, 2026-07-02)

Commands run from the repo root against the working tree at verification time.

### T-75-01 — Information Disclosure (secret / runtime-data scan)

Per-artifact scan of all three `75-AUDIT-*.md` files for JWTs (`eyJ…`),
Bearer/Authorization headers, secret keys (`sk-`, `service_role`, `eyJhbGci`,
`SUPABASE_*KEY`), real email addresses, password/token literal assignments, and
IPv4 addresses:

- **All patterns: 0 hits in all three artifacts.**
- The `clearance` / `sensitivity_level` / `email` / `full_name` strings that do
  appear are code identifiers, schema field names, and grep terms (e.g.
  `description: email`, `full_name/email ilike`, `sensitivity_level` field
  branching) — not runtime data, not gated-RPC payload samples, not secrets.
  This matches the declared mitigation ("file paths, component names, commands,
  and counts only").

### T-75-02 — Downstream Elevation of Privilege (domain-signal gates)

```bash
# criterion-5 directory gate (clearance/flags/dossier-type dirs never bare primitive)
awk -F'|' '$2 ~ /components\/(calendar|copilot|intelligence|dossier|signals|entity-links|signature-visuals|list-page)\/ / && $3 !~ /keep-custom|domain-wrapper|shadcn-block/ {bad++} END {exit bad>0}' 75-AUDIT-classification.md   # exit 0
# ltr-isolate (RTL infrastructure) must be keep-custom
awk -F'|' '$2 ~ /ltr-isolate/ && $3 !~ /keep-custom/ {bad++} END {exit bad>0}' 75-AUDIT-classification.md   # exit 0
```

- criterion-5 directory gate: **exit 0**
- ltr-isolate gate: **exit 0**
- All 10 clearance/flags feature directories (calendar, copilot, dossier,
  entity-links, intelligence, positions, relationships, signals, list-page,
  signature-visuals) classify **keep-custom (domain-specific)**.
- Artifact records the enforcement PASS lines: clearance 10/10, flags/glyphs
  13/13, ui/ direction-owners 12/12.

### T-75-03 — Repudiation / stale-evidence (HeroUI confirmation)

```bash
grep -rlnE "from ['\"]@heroui/react['\"]" --include='*.tsx' --include='*.ts' frontend/src | wc -l   # 8
grep -rnE "import\s*\{[^}]*\b(Navbar|Snippet|User|Spacer|Image|Code|Autocomplete|DateInput|Ripple)\b[^}]*\}\s*from\s*['\"]@heroui/react['\"]" --include='*.tsx' --include='*.ts' frontend/src   # exit 1, 0 hits
grep -rn "Modal\.\|Checkbox\.\|Switch\.\|Card\." frontend/src/components/ui/heroui-{modal,forms,card}.tsx   # 16 compound dot-notation lines
```

- `Import-site count: 8` — reproduced live (8).
- `Removed-name import hits: 0 (exit 1)` — reproduced live (exit 1, 0 hits).
- Compound-usage spot-check — 16 dot-notation lines confirm the v3 compound API.
- `heroui-chip.tsx` / `heroui-switch.tsx` / `heroui-tabs.tsx` carry no
  `@heroui/react` import (lookalike trap documented, matches source).
- `Type-check: exit 0` is a recorded verdict with a documented
  execution-transparency caveat (run in the main checkout because the executor
  worktree shares no `frontend/node_modules`); the independent VERIFICATION.md
  re-confirmed it at phase closeout. The dist-file nuances (Drawer flat-named
  exports; Autocomplete-exists-in-3.0.5) are Phase-78 documentation aids, not
  threat mitigations, and require the installed pnpm store to inspect.

### T-75-04 — Validation-bypass / ARIA contracts

- 8 component `##` sections present, each with the fixed 7-field template.
- ARIA/error-announcement coverage in `75-AUDIT-aceternity-contracts.md`:
  `aria-invalid` ×8, `aria-describedby` ×19, `role="alert"` ×19, `aria-live` ×6.
- The 5 simple components' missing live region is flagged as a
  preserve-or-improve item for Phase 79 (not preserve-as-is), so the validation
  contract is captured, not silently reproduced.

### T-75-05 — Wasted-rebuild-of-dead-code

- Each of the 8 contracts leads with a Liveness field (8/8), backed by the
  dated symbol-grep liveness loop.
- "Phase 79 rescope input" section present; records 7-of-8-dead and the stale
  ValidationDemoPage claim, and explicitly defers the rebuild-vs-delete decision
  to the user at Phase 79 planning (does not rescope Phase 79).

### T-75-06 — Tampering (classification without evidence)

```bash
awk -F'|' '/^\| components\// { e=$6; gsub(/[ \t—–-]/,"",e); if(e=="") bad++ } END { print bad+0 }' 75-AUDIT-classification.md   # 0
awk -F'|' '$3 ~ /replace-with-shadcn-primitive/ { c=$5; gsub(/[ \t—–-]/,"",c); if(c=="") bad++ } END { exit bad>0 }' 75-AUDIT-classification.md   # exit 0
```

- Empty-Evidence classification rows: **0 of 209**.
- Downgrade gate (empty Behaviors on any primitive-replace row): **exit 0** —
  all 28 primitive rows name at least one concrete behavior; none required
  downgrading.

---

## Accepted Risks Log

| Threat ID | Risk                                       | Rationale                                                                                                                                                                                                                                    | Accepted by                      |
| --------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T-75-SC   | Supply-chain tampering via package install | Docs-only phase installs nothing. Verified: all phase-75 commits are `docs(...)`; the only `files_modified` frontmatter entries are the three audit `.md` artifacts; the `@heroui-pro/react` token requirement is documented, not exercised. | gsd-security-auditor, 2026-07-02 |

---

## Unregistered Flags

None. No SUMMARY declares a `## Threat Flags` section; `75-01-SUMMARY.md`'s
"Threat Surface Scan" explicitly records "No new security-relevant surface
introduced." No new attack surface appeared during implementation that lacks a
threat mapping.

---

## Audit Trail

- **Auditor:** gsd-security-auditor (opus), 2026-07-02
- **Method:** Read all four PLAN `<threat_model>` blocks, four SUMMARYs, the
  independent VERIFICATION.md, and all three AUDIT artifacts in full; re-ran
  every gate-based mitigation (T-75-02/06 awk gates, T-75-03 greps) and the
  T-75-01 secret scan live against the working tree.
- **Result:** 7/7 threats closed. 0 open. `block_on: open_threats` — nothing
  blocks this phase from shipping.
- **Implementation files:** read-only. No code or artifact modified by this audit.
