---
phase: 67-per-type-engagement-contracts-legacy-detail-cleanup
plan: 06
subsystem: testing
tags: [live-verification, staging, rpc, rtl, uat]

requires:
  - phase: 67-per-type-engagement-contracts-legacy-detail-cleanup
    provides: plans 67-01..67-05 (tab sections, wizard fix, repoint migration, deletions)
provides:
  - Live phase-gate verification for PERENG-01/02/03
  - get_person_full repoint APPLIED to staging (rename-and-wrap, live keys deep-intact)
  - Gate outputs and staging cleanup confirmation
affects: [verify-work, complete-milestone]

tech-stack:
  added: []
  patterns: [rename-and-wrap RPC repoint with pre/post key-set proof]

key-files:
  created: []
  modified: []

key-decisions:
  - 'Migration applied via Supabase MCP with pre/post proof: pre keys [active_committees, key_staff, person] → post adds recent_engagements; person payload byte-intact (name spot-check); unseeded persons get null (PersonDetailPage guards with && length)'

patterns-established:
  - 'Seed → observe → restore protocol with explicit pre-existing-row protection assertions'

requirements-completed: [PERENG-01, PERENG-02, PERENG-03]

duration: 25min
completed: 2026-06-13
---

# Phase 67 Plan 06: Live phase-gate verification Summary

**All three requirements live-verified on staging: the org Hosted-engagements and person/EO Participation sections render seeded canonical rows (EN+AR, RTL clean), the repointed get_person_full returns recent_engagements live, and the deletion sweep holds all gates green.**

## Task 1 — RPC repoint applied (PERENG-02)

- Pre-apply probe: `get_person_full` returned exactly `[active_committees, key_staff, person]` — drift confirmed one final time.
- Applied `20260613100000_get_person_full_recent_engagements_canonical` via `mcp__supabase__apply_migration` (rename-and-wrap; live body preserved as `get_person_full_base`).
- Post-apply proof: keys `[active_committees, key_staff, person, recent_engagements]`; `person.name_en` intact ("Test Person A — Senior Diplomat"); unseeded person → `recent_engagements: null`.
- No edge redeploy needed (the persons edge calls the RPC by name).

## Task 2 — Live seed → observe matrix

Seeds: `host_organization_id = OECD` on the ESCWA engagement; two `delegate` participant rows (Test Person A + the one EO-subtype person `19a22b0d…`) on the G20 prep engagement, `created_by` = test user.

| Leg                | Surface                                         | Observed                                                                                                  |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| PERENG-01 (org)    | `/dossiers/organizations/<OECD>/engagements`    | **"HOSTED ENGAGEMENTS"** section with link "Bilateral consultation — ESCWA"                               |
| PERENG-02 (person) | `/dossiers/persons/<Test Person A>/engagements` | **"PARTICIPATION"** section with link "Prep session — G20 Data Gaps Initiative" + **Delegate** role badge |
| PERENG-02 (EO)     | `/dossiers/persons/<EO person>/engagements`     | Same participation rendering for the elected_official-subtype person                                      |
| RPC live           | `SELECT get_person_full('<Test Person A>')`     | `recent_engagements[0].engagement.name_en = "Prep session — G20 Data Gaps Initiative"`                    |
| AR/RTL             | ع toggle                                        | Heading **المشاركة**, badge **مندوب**, `dir=rtl`, no horizontal overflow at 1280 AND 1024                 |

Screenshots: `/tmp/uat67-1-org-hosted.png`, `/tmp/uat67-2-person-participation.png` (DOM snapshots recorded verbatim above are the binding evidence).

## Task 3 — Gates + cleanup

- Full frontend suite: **1417 passed / 0 failed** (182 files) · type-check exit 0 · size-limit **zero `exceeded`**
- PERENG-03 deleted-name grep gate: PASS (verified in 67-05; ~42 files / ~9,200 lines of dead legacy UI removed across 67-04/67-05)
- Cleanup: host column back to NULL (0 non-null hosts), both delegate seeds deleted, `engagement_participants` back to exactly 1 row — the pre-existing `head_of_delegation` row, untouched.

## Phase roll-up

- Wizard `created_by` fix (67-02) makes future wizard-created engagements persist their participants — the live create→row browser proof is covered by the payload unit pin + the RLS WITH CHECK satisfied-by-construction argument; full wizard E2E deferred to the milestone audit if desired.
- Recorded follow-ups carried from 67-05: barrel-kept survivors, dead dossier.json sections.\* key blocks, person_engagements legacy-dead declaration (no destructive migration), PersonFullProfile residual type drift.

## Self-Check: PASSED

- All three requirements observed live with SQL + DOM evidence: VERIFIED
- Migration applied with key-set proof; staging restored exactly: VERIFIED
- Gates green: VERIFIED
