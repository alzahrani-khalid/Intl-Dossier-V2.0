---
phase: 93-failure-visibility
verified: 2026-08-16T01:13:56Z
status: gaps_found
score: 4/5 criteria fully verified (1 partial — SC5; SC3 carries a deferral, not a gap)
verifier_ran_own_derivations: true
gaps:
  - truth: 'SC5: no user-facing error contains an internal string'
    status: partial
    reason: 'Two pre-existing user-facing renders of raw `error.message` survive in a file this
      phase touched (93-10) on a criterion-2-named surface (position attachments). Both are
      mutation-origin (upload / delete), so they sat outside the D-22 bucket-(a) enumeration, and
      neither appears in any plan population, exclusion list, SUMMARY, or filed requirement. The
      closing register classifies the 71-line/44-file superset they live in as "an upper bound on
      remaining READS, emphatically not a residual bucket-(a) count" — for this file that
      classification is wrong: both sites are RENDERS. A failed upload renders `error.message`
      inline; a failed delete `alert()`s it. FunctionsHttpError-class messages ("Failed to send a
      request to the Edge Function" — the exact string 93-14_g3 observed in its RED snapshot) are
      non-empty, so the `|| t(''common:errors.generic'')` fallback never fires for them.'
    artifacts:
      - path: 'frontend/src/components/positions/AttachmentUploader.tsx'
        issue: ':117 `error: error.message || t(...)` set in the upload catch, rendered verbatim at
          :462-465 as `{attachmentFile.error}`; :198 `alert(error.message || t(...))` in the delete
          catch. Both present at phase-93-base (:108/:189) — pre-existing, not introduced — but the
          file IS in `git diff --name-only phase-93-base..HEAD` and IS a criterion surface.'
    missing:
      - 'Drop the two error.message operands (same one-line treatment 93-14 Task 2 applied to its
        22 files), or file the pair as a named requirement with an owner — silence is the one
        disposition the phase forbids.'
deferred:
  - truth: 'SC3 (report-builder leg): a well-formed but nonexistent report ID renders a page-level
      not-found state on the report builder'
    addressed_in: 'Phase 94 (WRITE-06 + ARMA-01)'
    evidence: 'ROADMAP Phase 94 requirements include WRITE-06 (the custom_reports/report_shares
      42P17 recursive-policy fix); ARMA-01 is filed in REQUIREMENTS.md against Phase 94 and names
      exactly this: the 404 arm of tests/e2e/93-report-notfound.spec.ts has never fired in a
      natural run because the by-id read rejects for every id. This verifier''s own run reproduced
      it: `[93-13] observed arm -> B: query-error-state (read rejected — 42P17/WRITE-06, Phase
      94)`. Today a nonexistent report id renders the honest shared error state — NOT the
      criterion''s anti-goal ("Check your connection" after 24 skeletons), and NOT a not-found
      state either. The notFound() mechanism is code-present (reports/$reportId.tsx:54) and
      unreachable until the policy recursion is fixed.'
human_verification:
  - test: 'Render the seven new error states (QueryErrorState page/inline variants, degraded
      engagement banner, root 404) in Arabic with dir="rtl"'
    expected: 'Tajawal applies; RTL geometry intact; the 13 ar `errors.*` strings render'
    why_human: "Arabic was verified as JSON key-sets and en!==ar string inequality only. No RTL
      render of the new error copy was ever captured — inherited from Phase 92, not discharged
      here, named in the register's own NOT-CHECKED list. All 18 behavioral tests ran
      chromium-en, English locale, desktop viewport."
---

# Phase 93 — INDEPENDENT VERIFICATION (gsd-verifier)

**Seat:** `gsd-verifier`, spawned outside the executor/orchestrator population — the one seat whose
derivations share no ancestry with the work or with `93-15`'s closing register.
**Verified:** 2026-08-16T01:13:56Z. **Tree:** `dcdd35b16` (= the exec report's close HEAD; it did
not move during this pass). **Base:** `phase-93-base` = `e185f175`, signature re-verified by this
seat: `git tag -v` exit 0, `Good "git" signature`.
**Working tree:** `git status --porcelain` = 0 lines before this pass and after it (this file is
the only addition). No source file was edited. No scratch worktree was needed — every base-tree
derivation used `git show`/`git grep` against the tag.

**Inputs treated as claims, not evidence:** `93-VERIFICATION.md` (the `93-15` executor's register),
`C9B-REGISTER-P93.md`, `P93-EXEC-REPORT.md`, the 15 SUMMARYs. Every number below was re-derived by
this seat's own instruments unless marked NOT-CHECKED. Where my instrument differed from the
register's, I say so.

---

## 1. Observable truths — the five ROADMAP success criteria

| #   | Criterion                                                                                                                       | Status                                                    | Evidence (this seat's own)                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A rejected query reaches the caller as a rejection; the pages' `isError` branches stop being dead code                          | ✓ VERIFIED                                                | Own scanner (§2-D1): base 6 catch-and-return sites on the 3 defect files → HEAD 0. Repository is thin `apiGet` wrappers that throw. Consumers wired: `AnalyticsDashboardPage.tsx:269` `isError → QueryErrorState`; `DossierListPage.tsx:853` + em-dash/`countUnavailable` at :547-573; `CustomDashboardPage.tsx:229,282`. Behavioral: `93-analytics-error`, `93-dossier-list-counts-error`, `93-custom-dashboard-error` all passed in this seat's own run (§3). |
| 2   | `/admin/field-permissions` shows the 19 rules and errors honestly; same for data-retention, Tag Analytics, position attachments | ✓ VERIFIED                                                | Live: `SELECT count(*) FROM field_permissions` → **19** (this seat, staging catalog). This seat's spec run echoed the RENDERED value: `field-permissions rows=19 stat="19"`. Blocked variants render the error state, never "0 Permissions" (4/4 admin-surfaces tests passed); tags + attachments blocked → shared inline error (2/2 passed); data-retention natural visit honest per-region, policies=16 live.                                                 |
| 3   | Nonexistent record ID → page-level not-found on dossier detail, engagement detail, report builder                               | ✓ VERIFIED (2 of 3 behaviorally; 3rd DEFERRED → Phase 94) | `throw notFound()` sites: **0 at base → 3 at HEAD** (own grep): `DossierShell.tsx:144`, `WorkspaceShell.tsx:136`, `reports/$reportId.tsx:54`. Behavioral, this seat's run: dossier absent→404 / real-id-forced-rejection→error state (both passed); engagement absent→not-found page (passed). Report builder: arm B taken again in my run — see `deferred` frontmatter. The anti-goal (connection-error-after-24-skeletons) is dead on all three.              |
| 4   | Missing extension row → named, degraded state, not a titleless chrome shell                                                     | ✓ VERIFIED                                                | Producer returns degraded-200 with `engagement: null` (`engagement-dossiers/index.ts:438`); `WorkspaceShell.tsx:147-161` renders the dossier's own name in the h1 plus the `errors.incompleteRecord` alert. Behavioral: `93-degraded-engagement` "degraded: … NAMED, with its identity" passed in this seat's run.                                                                                                                                              |
| 5   | No user-facing error contains an internal string; `/tasks/queue` no longer prints the raw supabase-js message                   | ⚠ PARTIAL                                                 | The exemplar and every tested seam hold: `/tasks/queue` spec passed with the leak-regex; bucket-(a) 25 files contribute 0 (own sweep §2-D2); router `defaultErrorComponent` (`router/index.tsx:73`) and global mutation `onError` → i18n toast only (`query-client.ts:63-66`); i18n 13/13 keys equal, 0 copies (§2-D5). **But two user-facing raw `error.message` renders survive on a touched criterion surface** — the gap in frontmatter.                    |

**Score: 4/5** (SC5 partial; SC3's third leg deferred with a named owner, per the deferral rule).

## 2. This seat's derivations — population and outside-statement for each

### D1 — TRUST-01 catch-and-return (independent scanner, not the executor's)

Wrote `/tmp/verifier-catch-scan.mjs` from scratch (statement-`catch` regex + brace-depth matching;
site = body has `return`, no `throw`). Base files extracted via `git show phase-93-base:<path>`.

| tree | catch blocks | catch-and-return                                                                                       |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------ |
| base | 10           | **6** (`analytics.repository.ts` :13/:25/:37, `useDossier.ts` :683/:738, `useWidgetDashboard.ts` :726) |
| HEAD | 4            | **0**                                                                                                  |

Matches the register's D1 exactly, under a different implementation.
**POPULATION:** the three files carrying D-02's six named sites. **OUTSIDE:** `.catch()` expression
bodies, catch-and-assign, un-destructured supabase `.error` results, the `data: x = []` masks
(below). I did not re-run the 1,412-file whole-shape control — NOT-CHECKED.

### D2 — Criterion-5 sweep (SUPERSET population, deliberately wider than the plan's 25 files)

Ran the 93-14 filter chain (non-comment lines, minus `console.|throw |new Error|toast`, matching
`error?.message|error.message|err.message`) over **every `.tsx` under
`frontend/src/{routes,pages,components}`** — not just the enumerated 25.

Result: **71 lines across 44 files** — byte-agreement with the register's own superset number.
**None of the 44 is a bucket-(a) enumerated file** (the 25 contribute 0 — the plan's claim holds).
But adjudicating the 44 against `git diff --name-only phase-93-base..HEAD` finds exactly one that is
**both phase-touched and a criterion surface**: `positions/AttachmentUploader.tsx` (2 lines), and
both of its lines are **renders**, not reads (:117→:462 inline, :198 alert). That is the frontmatter
gap. **POPULATION:** all non-test `.tsx` under the three roots. **OUTSIDE:** multiline/template
renders invisible to any single-line grep; `.ts` files; toasts whose `toast(` sits on an earlier
line (e.g. `TagHierarchyManager.tsx` carries 4 such `description: error.message` lines —
**untouched by this phase**, outside the acceptance's touched-surface scope, recorded here so the
next phase inherits the pointer).

### D3 — PIN-2390-01 (both populations, both trees)

`grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='*.ts'` → **0 at HEAD**;
same with `--include='index.ts'` → 0. At the base tag (`git grep` at `phase-93-base`): exactly the
2 named helpers. Population: **320 `.ts` files**. Deployed half: all six importers probed non-401
live by this seat (§4). **OUTSIDE:** non-`.ts` files; import maps; the deployed bundle's actual
specifier (probe covers reachability/auth, not bundle contents).

### D4 — Anti-grant guard + live catalog (both halves re-run by this seat)

Repo half: roots exist (`supabase/migrations` = 484 files, `backend/migrations` = 10); raw
`GRANT SELECT … auth.users` matches = **3**, uncommented = **0** (the 3 are the migration's own
refusal comments — the C8 control behaves). Live half, staging catalog via MCP:
`SELECT` on `auth.users` is held by **`postgres` only**. Also re-derived: **11 residual policies**
still reference `auth.users` (matches `RLS-AUTHUSERS-01`'s corrected count), the 4-policy rewrite
migration exists (`20260815_phase93_rewrite_auth_users_policies.sql`: `is_platform_admin` ×8,
`DROP POLICY` ×4), and `is_platform_admin` policies are live on `data_retention_policies` among
21 tables. **OUTSIDE:** hand-applied grants outside the migration dirs; production (untouched);
tomorrow (snapshot, not a standing assertion).

### D5 — i18n key-set equality (own node script, not the gate's)

`en.errors` leaves = **13**, `ar.errors` = **13**, symmetric difference = **0**, keys where
`en === ar` (copy-paste) = **0** — stronger than the gate, which only requires the 7 new keys to
differ. Base en.errors = 6 leaves (re-derived from the tag): 6 → 13 = the 7 new keys. **OUTSIDE:**
every other namespace; translation _quality_; Arabic as pixels (frontmatter human item).

### D6 — the `data: x = []` mask floor (one instrument, both directions)

`git grep -E 'data:[[:space:]]*[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*=[[:space:]]*\[\]'` over
`frontend/src`, tests excluded: base **26** → HEAD **22**. Matches the register's floor claim.
Instrument note earned first-hand: the same command with `\s` returns **0** under `git grep`'s
POSIX ERE — a correct command returning a correct number about the wrong set, the phase's own class.
**OUTSIDE:** `= {}` / `= 0` / `?? []` shapes — never searched by anyone, floor stands.

### D7 — requirement + register bookkeeping

All eight Phase 93 requirements present in REQUIREMENTS.md and mapped to this phase; the 12
forward-filed requirements (`RLS-AUTHUSERS-01`, `DR-SUBPATH-01`, `DELEG-02`, `P52FIXTURE-01`,
`GATESTD-01`, `AUDIT-DROP-01`, `AUDIT-ZERO-01`, `E2ESTALE-01`, `ROOTALIAS-01`, `RETENTION-CAST-01`,
`NOTFOUND-COMPONENT-01`, `ARMA-01`, `ORACLECAP-01`) all resolve to entries in REQUIREMENTS.md at
`dcdd35b16` (grep: 24 matching lines). The register's F-1 (`NOTFOUND-COMPONENT-01` unfiled) was
closed by commit `dcdd35b16` after the register was written — its "OPEN" status in
`93-VERIFICATION.md` §6 is stale by one commit, not wrong.

## 3. Behavioral oracle — this seat's own run (not a citation)

Spacing honored per `ORACLECAP-01` (~30 min after the executor's last full run). All ten spec files
`test -f`-verified first (trap 1), then `--list --no-deps` → **Total: 18 tests in 10 files**, then
one run:

```
pnpm exec playwright test <10 specs> --project=chromium-en --no-deps
→ 18 passed (25.5s)
```

Load-bearing lines from MY run (not quoted from any SUMMARY):
`[93-09] field-permissions rows=19 stat="19" (19 expected)` ·
`[93-09] data-retention policy rows=16` ·
`[93-13] observed arm -> B: query-error-state (read rejected — 42P17/WRITE-06, Phase 94)` ·
delegations "natural visit renders the error state — the 42P01 is honest until Phase 102" passed.

**POPULATION:** the 18 tests the ten specs register under chromium-en. **OUTSIDE:** the `setup`
project (excluded by `--no-deps`, per `E2ECRED-01`); Arabic/RTL projects; the 4 `DossierListPage`
C9b specs + POM (still unrunnable, verdict unavailable); everything Playwright cannot see.

## 4. Live probe — re-run by this seat

`bash scripts/probe-edge-auth.sh <11 fns>` (one JWT mint, credentials never echoed):
`my-delegations 500 · data-retention 200 · audit-logs-viewer 200 · field-permissions 200 ·
engagement-dossiers 200 · ai-interaction-logs 200 · ai-summary-generate 405 · dossier-field-assist
405 · positions-consistency-check 405 · translate-content 405 · dossier-stats 400` — **identical to
the register's §4d, zero 401s**, `my-delegations` 5xx **by design**. **OUTSIDE:** the ~128 other
deployed functions; production; happy-path correctness of the 405/400 responders.

## 5. Requirements coverage (the 8 of record)

| Requirement | Status                                   | This seat's evidence                                                                                                                                                                                                             |
| ----------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TRUST-01    | ✓ SATISFIED                              | §2-D1 + three consumers wired + 3 specs passed                                                                                                                                                                                   |
| TRUST-02    | ✓ SATISFIED                              | 19 rows live + rendered `stat="19"` + 4 blocked-state specs passed                                                                                                                                                               |
| TRUST-03    | ✓ SATISFIED (report leg deferred → P94)  | 3 `notFound` throw sites (0 at base); dossier + engagement behaviorally proven; ARMA-01 deferral                                                                                                                                 |
| TRUST-04    | ✓ SATISFIED (leak half = SC5 partial)    | degraded-200 contract + named degraded render + spec; leak half carries the frontmatter gap                                                                                                                                      |
| DELEG-01    | ✓ SATISFIED (visibility-only, as scoped) | bilingual envelope + `status: 500` at both former swallow sites (`index.ts:206-211/:255-260`); live 500; natural-visit spec passed; `public.delegations` confirmed nonexistent live                                              |
| DR-42501    | ✓ SATISFIED                              | migration exists (4 DROPs, `is_platform_admin`); live catalog shows the policies; probe 200; 16 policy rows render                                                                                                               |
| AUDIT-42703 | ✓ SATISFIED                              | `LOG_SELECT` aliases wire names onto REAL columns (`table_name:entity_type, operation:action, row_id:entity_id, old_data:old_values, new_data:new_values`); `audit_statistics` query gone; probe 200; `audit_log` = 75 rows live |
| PIN-2390-01 | ✓ SATISFIED                              | §2-D3 both trees both populations; six importers non-401 live                                                                                                                                                                    |

## 6. The upstream registers, checked (agreements and the one material disagreement)

**Checked and CONFIRMED by my own instruments:** every D1–D5 number in `93-VERIFICATION.md` §1; the
probe table §4d (11/11 identical); the mask floor (26→22); the gate `93-15_g2` premises (all ten
specs exist; `--list` registers exactly 18); the C9b mock claims (`routes.test.tsx` `vi.mock`s
`error-boundary` :123, `DossierListPage` :127, `DossierShell` :209 — import paths, not basenames;
`MainLayout.test.tsx` :22; `AfterActionForm.test.tsx` :63 imports
`@/components/attachment-uploader/AttachmentUploader`, a different file from 93-10's subject —
name collision confirmed); `ROOTALIAS-01` proven by execution (`vitest run
tests/unit/components/ErrorBoundary.test.tsx` → `1 failed · Tests no tests`; `<repo-root>/src`
confirmed absent against `vitest.config.ts:37`); the intended-broken register (my-delegations 500 +
honest-error spec; legal-holds per-region by-design spec; `/admin/field-permissions` filters still
dead — `field-permissions.tsx` passes `filterEntityType`/`filterScopeType` into a hook that ignores
them, and the file's own comment says so); `details: error` = 0 on both population files
(data-retention was 15 at base); the 42501/42P17 substrate live (`report_shares` SELECT policy
subqueries `custom_reports`); F-3's arithmetic (11 residual policies live).

**DISAGREEMENT (the finding):** `93-VERIFICATION.md` §1-D2's outside-statement calls the 71/44
superset "an upper bound on remaining _reads_, emphatically not a residual bucket-(a) count." For
`positions/AttachmentUploader.tsx` that is false: its two lines are user-facing **renders** on a
touched criterion surface, and no phase document enumerates, excludes, or files them
(93-10-SUMMARY contains neither "alert" nor "error.message"). Command and output are in the
frontmatter gap. This does not impeach any number in the register — every count reproduced — it
impeaches one **classification sentence**, and the phase's own thesis explains how: the population
was partitioned by _origin_ (query vs mutation), and a mutation-origin render on a query-criterion
surface fell between the buckets.

**Residuals recorded for downstream (not gaps against this phase's criteria):** 26 `details:
error` passthrough lines across ~15 **untouched** edge functions (same class 93-02 stripped from
its two files; user-visible only if a client renders `details`, which the shared error state does
not); `TagHierarchyManager.tsx`'s 4 multiline toast `error.message` descriptions (untouched file).

## 7. Judgment on the two known-open items the brief named

**ARMA-01 / the report-builder 404 arm:** does NOT break SC3 today, for three reasons stated in the
deferral entry — the anti-goal is dead, the mechanism is code-present (and was observed once by
93-13's deleted control), and the blocker is owned (Phase 94, WRITE-06 + ARMA-01 filed). But the
criterion's letter — a not-found state on the report builder — is **not live-true at close**, and
no committed test will notice when it becomes true. The deferral is honest only as long as Phase 94
treats ARMA-01 as in-scope; I concur with both registers that this is the phase's weakest point.

**Four of eleven C9b couplings are non-oracles:** TRUE (re-checked at the cited lines, §6). It
weakens acceptance condition 4's _defence count_, not any ROADMAP criterion — the residual defence
is the shipped-suite runs plus this seat's own 18/18, which exercise the real components the mocked
specs cannot.

## 8. Why this pass would have caught more if there were more

The instruments here were chosen to be _wider_ than the phase's own: D2 swept every `.tsx` under
three roots instead of 25 enumerated files (and did find the one thing hiding between the buckets);
D1 was a from-scratch reimplementation; the mask and pin greps ran against the tag itself rather
than trusting recorded base numbers; the behavioral suite was re-run, not cited; both live halves
(DB catalog, edge probe) were re-queried. A hollow criterion — a stub error state, a mocked-only
consumer, a spec filtered to nothing, a count about the wrong set — would have surfaced in at least
one of those. One did (SC5). The rest genuinely hold.

## 9. NOT-CHECKED by this seat

Production (all live evidence is staging `zkrcjzdemdmwhearhfgg`). RLS row-scoping behaviorally
(still unverified by anyone, both phases running). Arabic as pixels (frontmatter human item). The
1,412-file whole-shape catch control. The 34 prior-plan gate red→green pairs (SUMMARY-recorded at
land time; today's tree cannot reproduce their reds — I re-ran only what is re-runnable: the drill's
mechanical facts via the registers, `93-15_g2`'s premises directly). The `= {}`/`= 0`/`?? []` mask
shapes. Bucket (b)/(c) sites beyond the two files named in §6. The ~128 unprobed functions. The 4
`DossierListPage` C9b specs + POM (`E2ECRED-01`, verdict unavailable, not green). Whether any gate
guards the right thing (C10's standing weakness).

VERIFIER-INDEPENDENT-END
