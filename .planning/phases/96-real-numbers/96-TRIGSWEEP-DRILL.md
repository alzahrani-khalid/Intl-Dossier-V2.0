# 96-TRIGSWEEP-DRILL — TRIGSWEEP-01, the behaviour-derived instrument

Plan `96-11`, executed 2026-08-17 against staging `zkrcjzdemdmwhearhfgg`. This plan is this
artifact's **only writer** (D-20). The reserved `96-VERIFICATION-INDEPENDENT.md` is NOT claimed
here and was not created by this run.

Instrument: `scripts/trigsweep-classify.mjs` (committed `038ac0b22`).

---

## 0. Reading order — the count is LAST, on purpose

D-11 says the instrument is tested in BOTH directions **before any count is believed**. So the
control record (§2) is placed before the classification (§3), and the count in §3 was treated as
provisional until §2 passed. A reader who consumes §3 without §2 is consuming a number whose
instrument was never falsified — the exact failure this requirement exists to end.

## 1. Population definition — and what falls outside it (D-15)

**The population:** every trigger in schema `public` that is **non-internal**, **BEFORE**
(`tgtype & 2`) and **FOR EACH ROW** (`tgtype & 1`). Enumerated mechanically from `pg_trigger`
joined to `pg_class`/`pg_namespace`/`pg_proc`/`pg_language` — closed and derived, never a list of
tables someone already suspected.

**Live population, captured 2026-08-17: 212 BEFORE ROW triggers across 181 tables, all
`plpgsql`** (zero non-plpgsql — but the classifier still treats `lanname <> 'plpgsql'` as
writer-suspect, so a future C-language or extension trigger cannot be invisible).

**Outside this population — stated so the boundary is not invisible:**

- **AFTER / INSTEAD OF triggers** — cannot rewrite `NEW`, but can write other tables. Not swept.
- **Statement-level triggers** (`FOR EACH STATEMENT`) — not swept.
- **Non-`public` schemas** — not swept.
- **Triggers whose functions write OTHER rows** — side-effecting, but not `NEW`-writers. They are
  _inside_ the enumerated population and classified **apart** (§4); the instrument must not confuse
  the two, and two of them live in this residual.
- **RLS `WITH CHECK` silent filtering, CHECK constraints, column defaults** — same class of
  surprise, different mechanism. Inherited boundary from `P94-TRIGGER-SWEEP.md`, still open.

**Capture integrity.** The 212-row capture was verified byte-faithful, not assumed: the SQL side
computed `md5(string_agg(tgname|relname|proname|lanname|prosrc ORDER BY relname, tgname))` and the
local file recomputed the same digest.

<!-- prettier-ignore -->
| side | rows | digest |
| --- | --- | --- |
| SQL (`pg_catalog`, in-database) | 212 | `52c207e5b14c6ca3ed72da7d26a0dec8` |
| local capture file | 212 | `52c207e5b14c6ca3ed72da7d26a0dec8` |

## 2. The both-direction control — run BEFORE the count was believed

**Method (deviation from the plan's letter, recorded — see §7):** the plan prescribed a
migration-created-and-dropped pair. This run used the alternative the research prescribes for the
same control (`96-RESEARCH.md` §Derivation 1: _"a migration-created-and-dropped pair **or a
rolled-back transaction via MCP**"_), because the executor brief forbids this leg from leaving any
persistent DDL — including a migration-ledger entry — on staging.

Shape: a single `DO $ctl$ … $ctl$` block that creates the scratch table, both trigger functions and
both triggers, sweeps the population **inside the same transaction**, then `RAISE EXCEPTION`s with
the payload. The exception is the rollback mechanism: it aborts the block, so persistence is not a
promise to clean up afterwards — it is structurally impossible. The payload rides out on the error.

Objects (all created and destroyed within the one statement):

- table `public.p96_trigsweep_control`
- function `public.p96_trigsweep_control_writer()` — **the synthetic writer**, deliberately written
  in the HARDEST known class: `BEGIN NEW.touched = now();` — a plain `=` assignment on the SAME
  LINE as `BEGIN`, the fourth blindness that defeated the research session's own sharper regex
- function `public.p96_trigsweep_control_raiser()` — the synthetic **non**-writer: `RAISE NOTICE`
  only, `RETURN NEW` unmodified
- triggers `p96_ctl_a_writer`, `p96_ctl_b_raiser` — both `BEFORE INSERT … FOR EACH ROW`

### 2a. Direction ONE — the writer it MUST catch (verbatim, in-transaction catalog)

```
ERROR:  P0001: P96CONTROL popn=214 rows=[
  {"tgname":"p96_ctl_a_writer","relname":"p96_trigsweep_control",
   "proname":"p96_trigsweep_control_writer","lanname":"plpgsql",
   "prosrc":"\n  BEGIN NEW.touched = now(); RETURN NEW; END;\n  ",
   "sql_class":"writer (=)"},
  {"tgname":"p96_ctl_b_raiser","relname":"p96_trigsweep_control",
   "proname":"p96_trigsweep_control_raiser","lanname":"plpgsql",
   "prosrc":"\n  BEGIN RAISE NOTICE 'p96 control: this trigger writes nothing'; RETURN NEW; END;\n  ",
   "sql_class":"RESIDUAL — hand-classify"}]
CONTEXT:  PL/pgSQL function inline_code_block line 49 at RAISE
```

`popn=214` is itself the first half of the control: the **same population CTE** that returns 212
returned 214 with the synthetics present, so the synthetic pair was enumerated by the real
population path — not fed to the classifier through a side door.

### 2b. Both directions through the SHIPPED JS instrument

The payload above is the SQL-side classifier (an independent second opinion). The instrument that
produces the filed count is `scripts/trigsweep-classify.mjs`, so the synthetic pair was appended to
the byte-verified capture and re-run through it:

```
PASS  must-catch     synthetic WRITER absent from the residual list
PASS  must-catch     writer (=) rose by exactly 1
PASS  must-not-catch synthetic RAISE-only present in the residual list
PASS  must-not-catch residual rose by exactly 1
baseline: writer(=) 164, residual 18  |  control: writer(=) 165, residual 19
CONTROL_ASSERT_EXIT=0
```

**The control assertion was itself controlled.** Re-pointed at baseline-vs-baseline (no synthetics
present — a run where it MUST fail), it fails:

```
PASS  must-catch     synthetic WRITER absent from the residual list
FAIL  must-catch     writer (=) rose by exactly 1
FAIL  must-not-catch synthetic RAISE-only present in the residual list
FAIL  must-not-catch residual rose by exactly 1
SHAM_EXIT=1
```

This matters twice over: the first version of that assertion script reported
`FAIL … writer (=) rose by exactly 1` from its own broken regex-escaping (a `NaN` count), not from
the data. It failed **closed**, was found, and was fixed before any conclusion was drawn from it.
An instrument checking an instrument gets no exemption from being checked.

### 2c. Zero persistent DDL — verified after the abort, not assumed

<!-- prettier-ignore -->
| probe | value | expected |
| --- | --- | --- |
| `to_regclass('public.p96_trigsweep_control')` | `null` | null |
| `pg_proc` where `proname LIKE 'p96\_trigsweep%'` | 0 | 0 |
| `pg_trigger` where `tgname LIKE 'p96\_ctl\_%'` | 0 | 0 |
| population count | 212 | 212 (back to baseline) |
| population digest | `52c207e5b14c6ca3ed72da7d26a0dec8` | identical to §1 |

The catalog is **bit-identical** to its pre-control state. No migration was applied by this plan;
`supabase/migrations/` is untouched.

**Verdict: the instrument catches a writer it must catch and does not flag a non-writer it must not
flag. The count below may now be believed — as a floor.**

## 3. The classification (capture 2026-08-17)

<!-- prettier-ignore -->
| class | count | what it is |
| --- | --- | --- |
| `writer (:=)` | 29 | the ONLY class P94's instrument could see |
| `writer (=)` | 164 | plain-`=` assignment in statement position, **including same-line-after `BEGIN`/`THEN`/`ELSE`/`LOOP`** |
| `writer (INTO)` | 1 | `SELECT … INTO NEW.x` |
| `writer (record)` | 0 | whole-record `NEW := …` — no live instance; the form is still carried |
| `writer-suspect (non-plpgsql)` | 0 | none live; carried so a future extension trigger is not invisible |
| `RESIDUAL — hand-classify` | 18 | listed in full and classified one by one in §4 |

**Union of writer classes: 194 of 212.**

Two numbers a reader would otherwise flag as discrepancies against `96-RESEARCH.md`, resolved:

- Research counted **2** bodies carrying `INTO NEW.`; this table shows `writer (INTO)` = **1**.
  Both are present and both are writers — `set_inline_comment_thread_root_trigger` carries `INTO
NEW.` _and_ `:=`, and the union is evaluated in order, so it lands in `writer (:=)`. Classes are
  first-match labels, not disjoint populations. `calculate_stage_duration_trigger` is the INTO-only
  one.
- Research's `plain_eq` filter counted **162**; this run's `writer (=)` is **164**. The +2 are
  `document_templates_updated_at_trigger` and `templated_documents_updated_at_trigger` — the two
  `BEGIN NEW.updated_at = NOW();`-on-one-line bodies that defeated the research session's own
  sharper regex. Both now classify `writer (=)`. **The fourth blindness is closed against the exact
  rows that demonstrated it.**

### The six ORCH-BRIEF meaningful rewrites — each confirmed in a writer class

Their absence is exit 1 in the instrument, not a quietly smaller number.

```
ok       staff_profiles.version                 increment_staff_version → writer (=)
ok       assignments._version                   update_assignment_version → writer (=)
ok       entity_comments.*                      trigger_entity_comments_timestamp → writer (=)
ok       entity_comments.*                      trigger_set_entity_comment_thread_root → writer (:=)
ok       organization_leadership.is_current     trigger_leadership_current_status → writer (=)
ok       legislations.version                   trigger_increment_legislation_version → writer (=)
ok       intelligence_sources.next_scan_at      set_initial_next_scan_trigger → writer (=)
```

## 4. The residual, hand-classified — all 18, none assumed

The residual is a **deliverable**, not a remainder. Every body below was read. Verdicts:
`non-writer-guard` | `other-row-writer` | `WRITER-missed-by-classifier`.

<!-- prettier-ignore -->
| # | table | trigger | function | verdict | evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | `countries` | `validate_country_type` | `validate_dossier_type()` | non-writer-guard | `IF NOT EXISTS (SELECT 1 FROM dossiers …) THEN RAISE`; `RETURN NEW` unmodified |
| 2 | `engagements` | `validate_engagement_type` | `validate_dossier_type()` | non-writer-guard | same function |
| 3 | `forums` | `validate_forum_type` | `validate_dossier_type()` | non-writer-guard | same function |
| 4 | `organizations` | `validate_organization_type` | `validate_dossier_type()` | non-writer-guard | same function |
| 5 | `persons` | `validate_person_type` | `validate_dossier_type()` | non-writer-guard | same function |
| 6 | `topics` | `validate_topic_type` | `validate_dossier_type()` | non-writer-guard | same function |
| 7 | `working_groups` | `validate_working_group_type` | `validate_dossier_type()` | non-writer-guard | same function |
| 8 | `aa_attachments` | `enforce_aa_attachment_limit` | `check_aa_attachment_limit()` | non-writer-guard | `COUNT(*) … >= 10 THEN RAISE EXCEPTION` |
| 9 | `attachments` | `enforce_attachment_limit` | `check_attachment_limit()` | non-writer-guard | same shape |
| 10 | `intake_attachments` | `check_attachment_total_size` | `check_total_attachment_size()` | non-writer-guard | `SELECT … INTO total_size` — INTO a **local**, not `INTO NEW.` (the near-miss the INTO form must not over-match) |
| 11 | `link_audit_logs` | `trg_prevent_premature_audit_deletion` | `prevent_audit_deletion()` | non-writer-guard | reads `OLD.timestamp`, RAISEs, `RETURN OLD` |
| 12 | `version_snapshots` | `trigger_prevent_version_snapshot_delete` | `prevent_version_snapshot_modification()` | non-writer-guard | body is one unconditional `RAISE EXCEPTION` |
| 13 | `version_snapshots` | `trigger_prevent_version_snapshot_update` | `prevent_version_snapshot_modification()` | non-writer-guard | same function |
| 14 | `permission_delegations` | `prevent_circular_delegation` | `check_circular_delegation()` | non-writer-guard | `IF EXISTS (…) THEN RAISE`; `RETURN NEW` unmodified |
| 15 | `profiles` | `trg_guard_profiles_clearance_change` | `guard_profiles_clearance_change()` | non-writer-guard | `if new.clearance_level is distinct from old.… then raise` (lower-case body; the classifier is case-insensitive, so this is a read, not a miss) |
| 16 | `users` | `trg_guard_users_role_change` | `guard_users_role_change()` | non-writer-guard | same shape on `role` |
| 17 | `entity_preview_layouts` | `tr_enforce_single_default_layout` | `enforce_single_default_layout()` | **other-row-writer** | see below |
| 18 | `user_saved_views` | `ensure_single_default_view_trigger` | `ensure_single_default_view()` | **other-row-writer** | see below |

**Missed writers found in the residual: ZERO.** No form is added to the classifier and no re-run is
owed. (Had one been found, the plan's rule binds: the classifier gains its form and the run
repeats.)

### 4a. The hand-classification was itself backstopped mechanically

Reading 18 bodies and declaring them clean is an eyeball. So every residual body was also probed
for `NEW.x :=`, `NEW.x =`, `INTO NEW.`, whole-record `NEW :=` and dynamic `EXECUTE` with
deliberately **looser**, unanchored patterns — a probe designed to over-flag:

```
  clean validate_dossier_type
  clean check_aa_attachment_limit
  clean check_attachment_limit
  clean check_total_attachment_size
  FLAG enforce_single_default_layout → NEW.x =
  FLAG ensure_single_default_view → NEW.x =
  clean prevent_audit_deletion
  clean prevent_version_snapshot_modification
  clean check_circular_delegation
  clean guard_profiles_clearance_change
  clean guard_users_role_change
```

The probe was instrument-tested against a known writer (`increment_version_column`, the
`staff_profiles` writer) and returned `true` — so the nine `clean` results are the probe working,
not the probe broken.

**The two FLAGs, resolved verbatim:**

```
### enforce_single_default_layout()
   occurrence: IF NEW.is_default = TRUE THEN
   other-row write statements: UPDATE entity_preview_layouts
   returns: RETURN NEW

### ensure_single_default_view()
   occurrence: IF NEW.is_default = true THEN
   other-row write statements: UPDATE user_saved_views
   returns: RETURN NEW
```

In both, every `NEW.<col> =` occurrence is a **comparison inside an `IF … THEN` condition**, the
only write is an `UPDATE` to **other rows**, and `NEW` is returned unmodified. Verdict
`other-row-writer` stands, and the discriminator earns its keep: the statement-position anchor
(`^` | `;` | newline | `BEGIN`/`THEN`/`ELSE`/`LOOP`) is not noise reduction — **it is what separates
assignment from comparison**. Drop it and these two become false writers; keep it unanchored-only
and the two one-line `BEGIN NEW.updated_at = NOW();` bodies stay invisible. Both halves are needed.

## 5. The floor

> **FLOOR: 194 NEW-writing BEFORE ROW triggers of 212, across 181 tables, captured 2026-08-17
> against staging `zkrcjzdemdmwhearhfgg`. This is a FLOOR, never a total.**

It is a floor because: classes are first-match labels (a body may satisfy several forms); the
residual is hand-classified against **known** forms, and an eleventh unknown form would sit in a
`non-writer-guard` verdict unseen; and the population itself excludes everything named in §1 —
`AFTER`/`INSTEAD OF`, statement-level, non-public schemas.

Lineage of the floor, each superseded rather than restated:

<!-- prettier-ignore -->
| source | count | instrument | status |
| --- | --- | --- | --- |
| P94 sweep (`P94-TRIGGER-SWEEP.md`) | 29 | `NEW.x :=` only, no control | honest for its rule; ~15% of the class |
| `REQUIREMENTS.md` register | ≈193 | `:=` + plain-`=` estimate | floor, superseded |
| `96-RESEARCH.md` Derivation 1 | ≥194 | 3-form union + eyeballed residual, **read-only, no control** | floor, superseded |
| **this drill** | **194** | 4-form union + non-plpgsql suspicion + hand-classified residual, **control-tested in both directions** | **current floor** |

Also within this population and worth the next reader's attention: **two other-row writers**
(§4 rows 17–18) — side-effecting `BEFORE` triggers that are _not_ `NEW`-writers. A count that folds
them into "writers" is wrong in the other direction.

## 6. Re-running this

```bash
# 1. capture (Supabase MCP execute_sql, staging zkrcjzdemdmwhearhfgg) — the exact CTE is in the
#    script header; emit json_agg(row_to_json(b) ORDER BY b.relname, b.tgname) into capture.json
# 2. classify
node scripts/trigsweep-classify.mjs capture.json --label "re-run <date>"
#    exit 0 = classified, residual listed | 1 = a known writer went missing (regression)
#    exit 2 = UNABLE TO MEASURE (input absent/unparseable) — never a silent zero
```

Re-derive the digest on both sides before believing a re-run, and re-run the §2 control before
believing a re-run's count. An instrument that was controlled once is not an instrument that is
controlled.

## 7. Deviation recorded

**The control's DDL mechanism.** Plan `96-11` Task 2 names _"via `mcp__supabase__apply_migration`
create … then DROP … in a second migration"_. This run used the rolled-back-transaction shape
instead — explicitly offered for this same control by `96-RESEARCH.md` §Derivation 1 (_"a
migration-created-and-dropped pair **or a rolled-back transaction via MCP**"_).

Why: the executor brief for this plan requires the control to leave **zero persistent DDL** on
staging and rules that an additional migration is a PARK, not an executor's call. The plan names no
migration filename in `files_modified`, so a migration here would also have been outside the
brief's "only the filename(s) your plan names" rule. Control semantics are unchanged and strictly
stronger on the persistence axis: the synthetics were enumerated by the same population CTE
(`popn=214`), both directions were observed, and rollback is structural rather than a second step
that could fail. §2c proves the catalog returned bit-identical.

No other deviation. No migration was applied by this plan.

TRIGSWEEP-DRILL-END
