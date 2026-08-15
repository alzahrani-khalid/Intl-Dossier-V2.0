# Phase 93: Failure Visibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-15
**Phase:** 93-failure-visibility
**Areas discussed:** rejection propagation, the error state itself, not-found vs failure, the four
inherited defects, method and instruments

> **How this discussion was conducted.** Under the orchestration brief in force for this phase, no
> `AskUserQuestion` checkpoint was raised. Every question was routed one of two ways: **determined by
> the documents** → answered here with the source line cited, or **a genuine product fork** → parked
> to `.tickmarkr/overseer/PARK-P93.md` and ruled by the OVERSEER in
> `RULING-P93-01-PARKS.md` (+ ADDENDUM 1, D-54, D-55). The "Selected" column below therefore records
> either a document-determined answer or a written ruling — never an auto-answered checkpoint.

---

## Rejection propagation (`TRUST-01`)

| Option                                            | Description                                                | Selected |
| ------------------------------------------------- | ---------------------------------------------------------- | -------- |
| Delete the `catch`, let the rejection through     | Transport already throws; TanStack Query's `isError` fires | ✓        |
| Keep the `catch`, log, then `throw`               | Same observable result, more code                          |          |
| Return `{ ok: false, error }` and rewrite callers | Matches the global `CLAUDE.md` union convention            |          |

**Choice:** delete the swallow. **Determined by:** `frontend/src/lib/api-client.ts:111-118` —
`apiGet` → `handleResponse` → `throw toApiError(response)`. The API is exception-based end to end,
and `ROADMAP.md` §Phase 93 criterion 1 states the goal as reviving the pages' existing `isError`
branches, which only a rejected promise can do.
**Notes:** the union option was rejected on `CLAUDE.md`'s own second clause — "never mix exceptions
and result unions within one API". Converting the whole client to unions is a refactor this phase
did not ask for, and would leave the criterion's `isError` branches dead by a different route.

---

## The error state itself (`TRUST-02`/`03`/`04`, criterion 5)

| Option                                   | Description                                                       | Selected |
| ---------------------------------------- | ----------------------------------------------------------------- | -------- |
| One shared query-error component, reused | Single vocabulary across all 7+ surfaces this phase touches       | ✓        |
| Bespoke error markup per page            | Fewer moving parts per plan, seven variants at the end            |          |
| Reuse an existing empty-state component  | The nearest existing thing — and the cause of the bug being fixed |          |

**Choice:** one shared component. **Determined by:** the codebase has 13 empty-state components
(`components/empty-states/*` and feature-local siblings) and **no** error-state counterpart; the only
general primitive is `components/ui/alert.tsx`.
**Notes:** the third option is listed because it is the most likely origin of the defect class — when
an empty state is the only component to hand, a failed query gets rendered as an empty one. Visual
specification deferred to `93-UI-SPEC.md`; this decision fixes the contract (`role="alert"`, EN+AR
keys, no internal strings), not the pixels.

---

## Not-found vs failure (`TRUST-03`)

| Option                                  | Description                                       | Selected |
| --------------------------------------- | ------------------------------------------------- | -------- |
| Reuse TanStack Router `notFound()`      | Precedent already in the tree                     | ✓        |
| A fourth bespoke not-found render       | New mechanism alongside three existing ones       |          |
| Collapse not-found into the error state | One component, but reproduces the bug being fixed |          |

**Choice:** reuse `notFound()`. **Determined by:** `routes/__root.tsx` defines the boundary;
`routes/_protected/positions/$id.tsx`, `routes/_protected/after-actions/$afterActionId.tsx` and
`routes/_protected/engagements/$engagementId/after-action.tsx` already throw it.
**Notes:** the third option is exactly criterion 3's complaint — "Check your connection and try
again" shown for a record that simply is not there — so the two states must not share a component.

---

## `DR-42501` — scope of the RLS fix `[PARKED → RULED]`

| Option                                            | Description                                                         | Selected |
| ------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| Fix the 4 policies this phase's criteria exercise | Closes what the phase promised, under oracles; file the residual 11 | ✓        |
| Fix all 15 in one migration                       | One migration, retires the banned pattern sooner, 11 with no oracle |          |
| `GRANT SELECT ON auth.users TO authenticated`     | Symptom vanishes; **refused on sight**                              |          |

**Ruling:** `RULING-P93-01` §01 — candidate 1, with three orders (unified `public.users.role` read
with `raw_*_meta_data` deleted; residual 11 filed as `RLS-AUTHUSERS-01` carrying candidate 3's
refusal in the requirement text; owner phase named as Phase 100).
**Notes:** the filed diagnosis in `REQUIREMENTS.md DR-42501` was found to be wrong on three counts
and is superseded by CONTEXT D-09. Option 3 was refused because Postgres's own `HINT` proposes it,
and taking it converts 8 fail-closed policies into a live self-service admin escalation via
user-writable `raw_user_meta_data`. ADDENDUM 1 adopted the measured LATENT verdict and made the
anti-grant gate **required**.

---

## `DELEG-01` — repoint or visibility-only `[PARKED → RULED]`

| Option                                  | Description                                                | Selected |
| --------------------------------------- | ---------------------------------------------------------- | -------- |
| Visibility only; defer the table choice | Stop swallowing `42P01`, render an error; no product guess | ✓        |
| Repoint to `permission_delegations` now | 14 cols; needs `is_active`→`revoked`, drop `source`        |          |
| Repoint to `position_delegations` now   | 8 cols; needs `is_active`→`status`, drop `source`          |          |

**Ruling:** `RULING-P93-01` §02 — candidate 1, deferral named as `DELEG-02` → Phase 102, beside
`SEED-DELEG-01`, because seeding forces the table choice.
**Notes:** both candidate tables hold 0 rows, so options 2 and 3 spend a product decision to reach an
identical empty screen. Recorded consequence, deliberately: `/delegations` visibly **errors** after
this phase until Phase 102 lands. An erroring page beats a lying page.

---

## `AUDIT-42703` — which relation, and what replaces `audit_statistics` `[PARKED → RULED]`

| Option                             | Description                                           | Selected |
| ---------------------------------- | ----------------------------------------------------- | -------- |
| `audit_log` + aggregate statistics | 75 live rows; needs a column remap; fix is observable | ✓        |
| `audit_logs`                       | Closer column shape, 0 rows, fix unobservable         |          |
| A view unioning both               | Most work; justified only if both are live writers    |          |

**Ruling:** `RULING-P93-01` §03 — A1 + aggregate, **conditional** on first deriving which relation is
currently written. **Condition discharged, A1 stands:** `audit_log` = 75 rows, newest
`2026-08-14 21:53:05+00`, written by trigger `audit_trigger_function` on 11 tables plus
`log_link_operation` on `intake_entity_links`; `audit_logs` = 0 rows despite 32 insert sites.
**Notes:** the criterion-5 leak fix (the live 500 body prints
`column audit_log.table_name does not exist`) is unconditional and was never part of the fork.
Discharging the condition surfaced two further defects, filed rather than folded — see below.

---

## Claude's Discretion

- Plan decomposition and task ordering.
- The internal shape of the shared error component (its contract is fixed; its implementation is not).
- Whether the `audit_log` column remap lands as one task or two.
- The layout of the gate-drill evidence table.

Not discretionary: the visual design of the error / not-found / degraded states, which belongs to
`93-UI-SPEC.md` via `/gsd-ui-phase 93`.

## Deferred Ideas

- **`RLS-AUTHUSERS-01` → Phase 100** — the residual 11 `auth.users`-referencing policies, filed with
  the 15-row enumeration, the stated exclusions, the fail-closed finding, and the explicit refusal of
  `GRANT SELECT ON auth.users`.
- **`DELEG-02` → Phase 102** — which relation `my-delegations` reads, decided beside `SEED-DELEG-01`.
- **`AUDIT-DROP-01` → Phase 94** (`D-54`) — `backend/src/services/auth.service.ts:847` inserts
  `resource_type` and `details` into `audit_log`; neither is a column, and the error is swallowed.
  Security audit events have never been recorded through that path.
- **`AUDIT-ZERO-01` → Phase 94** (`D-55`) — 20 of 32 edge-function `audit_logs` inserts use an
  `event_type`/`resource_type`/`changes`/`metadata` shape the table never had; the inserts cannot
  succeed and most drop silently. Classified from the catalog, not guessed.
- **Production verification** — everything in this phase is staging-only, as Phase 92 was.
