# Phase 94: Write Paths - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 94-write-paths
**Areas discussed:** Phase scope (6 vs 9 requirements), Commitment drag to `review`, The
"Operation completed successfully" string, What "the real message" means, The `42P17` fix's
security shape, `/settings` tab population

---

## How this discussion was conducted — read this before the tables below

**No `AskUserQuestion` was issued and no human answered one.** This phase is being planned under an
orchestration brief (`.tickmarkr/overseer/ORCH-BRIEF.md` §2.4) whose question policy is explicit:

- a gray area **determined by the documents** is answered by the orchestrator, with the source line
  cited in CONTEXT.md;
- a **genuine product fork** is written to `.tickmarkr/overseer/PARK-P94.md` — question, candidates,
  evidence, recommendation, downstream impact — and left open for the operator, while work
  continues around it.

The "Selected" column below therefore means _resolved by document_ or _parked_, never _a human
picked this_. Two areas were parked and remain open at the time of writing. The tables record the
alternatives so the reasoning is auditable, which is this file's whole purpose.

---

## Phase scope — 6 requirements or 9?

| Option                                                   | Description                         | Selected |
| -------------------------------------------------------- | ----------------------------------- | -------- |
| Plan the 6 `WRITE-*` ids the roadmap line listed         | Matches `ROADMAP.md` as written     |          |
| Plan 9 — add `AUDIT-DROP-01`, `AUDIT-ZERO-01`, `ARMA-01` | Matches `REQUIREMENTS.md` ownership | ✓        |

**Resolution:** determined by document. `REQUIREMENTS.md` files all three under this phase
(`ARMA-01` says so in its own text: "Owner: Phase 94 — Write Paths"). Phase 93's roadmap line
carried its four inherited ids, so carrying them is the house convention. The roadmap line was
aligned with an inline rationale note (`ba19751c6`) rather than left to disagree with the register.

**Notes:** The stale line was the failure mode, not the scope. Two documents disagreed and only one
was going to be read by the planner.

---

## A commitment dragged to the board's `review` column

| Option                                                       | Description                                | Selected                  |
| ------------------------------------------------------------ | ------------------------------------------ | ------------------------- |
| (a) Reject the drop with a bilingual message                 | Card snaps back, `role="alert"` explains   | recommended as safety net |
| (b) Make `review` non-droppable for commitment cards         | The invalid state is unreachable           | **recommended**           |
| (c) Hide the `review` column when only commitments are shown | Cheapest; shifts layout for a data reason  |                           |
| (d) Add `review` to the `aa_commitments` lifecycle           | Refused — `CLAUDE.md` carve-out forbids it | refused, recorded         |

**Resolution:** **PARKED** — `PARK-P94.md` §`PARK-94-01`. Genuine product fork: the candidates differ
in what the user sees and in what the acceptance oracle asserts.

**Notes:** The measurement that made this worth parking rather than guessing: three of the four board
columns (`todo`→`pending`, `in_progress`, `done`→`completed`) **already write valid commitment
statuses today**. Only `review` has no counterpart. `WRITE-04`'s status-mapping half is one cell, not
four. Candidate (d) is listed although refused, so its absence reads as a decision.

---

## The string "Operation completed successfully"

| Option                                                | Description                                                   | Selected        |
| ----------------------------------------------------- | ------------------------------------------------------------- | --------------- |
| Narrow — stop the no-op from reaching the mutation    | One comparison in `WorkBoard.tsx`; blast radius = the board   | **recommended** |
| Broad — remove or localise the global success handler | Touches every mutation in the app; no P94 oracle watches them |                 |

**Resolution:** **PARKED** — `PARK-P94.md` §`PARK-94-02`, planned narrow pending the ruling.

**Notes:** The string is not in kanban code. It is the app-wide default at
`frontend/src/lib/query-client.ts:71`, hardcoded English, no `t()`. The requirement's own qualifier
is "on a no-op", which is what tipped the recommendation; the untranslated literal is filed as a
deferred idea with its file and line so the narrow choice does not lose it.

---

## What "failures surface the real message" means

| Option                                                  | Description                           | Selected |
| ------------------------------------------------------- | ------------------------------------- | -------- |
| Show the server's `error.message`                       | Literal reading of "the real message" |          |
| Show a specific translated message; diagnostics to logs | _Real_ = specific and true, not raw   | ✓        |

**Resolution:** determined by document. Phase 93 `D-08` ("no server-originated `error.message`
reaches the user") and `CLAUDE.md` §Security ("user-facing errors never leak internals… diagnostics
go to logs"). The literal reading would re-open a class Phase 93 closed.

**Notes:** Two live violations sit in this phase's own files —
`useUnifiedKanban.ts`'s onError toast passes `error.message` as its description, and
`after-actions/$afterActionId.tsx:109` prefers `err.message` over its own translated fallback, so
the fallback key is nearly dead code.

---

## How the `custom_reports` ↔ `report_shares` `42P17` recursion is broken

| Option                        | Description                              | Selected                |
| ----------------------------- | ---------------------------------------- | ----------------------- |
| Planner's choice of mechanism | Technical; no user-visible difference    | ✓ (Claude's discretion) |
| Ruled here                    | Would pre-empt research without evidence |                         |

**Resolution:** discretion — **with a locked constraint**, CONTEXT `D-22`: the fix must not widen the
visible row set, and the acceptance criterion is two-sided (no `42P17` **and** row-scoping still
holds).

**Notes:** The common fix for mutual recursion is a `SECURITY DEFINER` helper, which bypasses RLS by
construction. An oracle that only proves the error is gone would pass a policy that returns
everything to everyone. Named in CONTEXT as the phase's sharpest security risk so the planner cannot
treat it as a footnote.

---

## "Every `/settings` tab saves" — which surfaces?

| Option                                                 | Description                             | Selected |
| ------------------------------------------------------ | --------------------------------------- | -------- |
| Assume the `SettingsPage` tab strip                    | Smallest reading                        |          |
| Derive the population from the route tree and state it | Population definitions are standing law | ✓        |

**Resolution:** determined by document — Phase 93 `D-18`, carried as `D-24`: every closing derivation
states its population and what falls outside it. `/settings` is a layout route with five child
routes plus a `calendar` directory alongside the in-place `SettingsPage`, so "tab" is genuinely
ambiguous and must be answered by derivation, not by assumption.

---

---

## Rulings received after this discussion closed

`.tickmarkr/overseer/RULING-P94-01-PARKS.md`, 2026-08-16. Both parks decided; the tables above are
left as written so the pre-ruling reasoning stays auditable.

- **PARK-94-01 → (b) + (a)**, as recommended. Non-droppable `review` for commitment cards **plus**
  the mutation-layer reject, because criterion 4's own text demands the message regardless of what
  the affordance does.
- **PARK-94-02 → NARROW**, as recommended.
- **Order 1:** the reject message is a bilingual i18n key with `role="alert"`, never `error.message`
  — stated in the acceptance criterion, not as a comment.
- **Order 2 — a correction against my own table.** The live constraint has **five** statuses, not
  four: `pending`, `in_progress`, `completed`, `cancelled`, **`overdue`**. `CLAUDE.md`,
  `REQUIREMENTS.md` WRITE-04 and my park all repeated the same four-value list. I re-derived it by
  catalog query and corrected all three. `review` is absent under either reading, so the park's
  conclusion held — but my table answered columns→statuses and was read as if it answered both
  directions. The reverse mapping is now part of `WRITE-04`'s population, and the one live gap it
  exposed (`overdue` renders in the Todo column, indistinguishable from never-started) is filed as
  `PARK-94-03`.
- **Order 3:** the global-toast deferral is **tracked, not recorded** — filed as `COPY-06` in
  `REQUIREMENTS.md`, owner Phase 98. One flagged deviation: the ruling suggested the id `TOAST-01`;
  it is filed as `COPY-06` for section-prefix consistency, with the suggested id quoted inside the
  entry, submitted for approve-as-placed.

## Claude's Discretion

- Mechanism for breaking the `42P17` recursion (bounded by `D-22`).
- Whether the audit-write helper is one module or two (bounded by `D-17`'s finding that
  `public.audit_log` and `public.audit_logs` are different tables with different column sets).
- How the non-droppable predicate is expressed in dnd-kit.
- Internal query structure of `after-actions-list-all` (bounded by `D-12`/`D-13`).

## Deferred Ideas

- The global success toast's hardcoded English literal — `frontend/src/lib/query-client.ts:71`.
- Double-toast on a failed mutation (global `onError` + mutation-level `onError` both fire in
  TanStack Query v5).
- `resolveBoardStage`'s dead `review` branch for commitments — cleanup depends on the `PARK-94-01`
  ruling.
- Out-of-phase by prior ruling: `RETENTION-CAST-01` (P95), `NOTFOUND-COMPONENT-01` (P95),
  `DR-SUBPATH-01` / `RLS-AUTHUSERS-01` (P100), `ORACLECAP-01` / `E2ECRED-01` (P101),
  `DELEG-02` / `GATESTD-01` (P102).
