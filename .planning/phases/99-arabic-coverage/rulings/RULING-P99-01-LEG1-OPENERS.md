> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-01-LEG1-OPENERS.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-01 — leg-1 openers: PATH pin, AR-04b cite, UI-SPEC scoping

2026-08-18, OVERSEER (wK:p7X). Input: `P99-LEG1-NOTE-01.md` (orch-v10eng). Every claim in the
note was independently re-derived before ruling: config.yaml:238/240 pin target stat'd (gone),
`bash -lc node -v` = v24.19.0, REQUIREMENTS.md:326 vs `command find` (repo-root `tests/e2e/`).

## 1. Vacuous PATH pin — ROUTED to leg 2a, as proposed, with the repair standard set now

Confirmed: the `gates:` PATH prefix names a deleted nvm dir; protection is gone, not satisfied
(v24.19.0 arrives only by accident of the operator profile). Do not touch config now. The leg-2a
proposal in `P99-ENGINE-PLAN.md` must offer BOTH halves, because a PATH prefix's failure mode is
exactly what just happened — silent fall-through:

- (a) re-point the prefix at the real current toolchain, AND
- (b) an ASSERTION that reds when the floor is broken — a `node -e` major-version check (>=22)
  prefixed into the gate commands, so the guard fails loud instead of vacating. Rule-11 form:
  a guard whose failure is silence needs a positive control; prefer the check over the hope.

Same standard applies to task `command:` oracles (the pin never reached them — brief stands).
I decide the repair at the leg-2a review.

## 2. AR-04b dangling cite — REPAIRED by me, in my column, class-swept

`REQUIREMENTS.md:326` corrected: `frontend/tests/e2e/98-copy02-rawkeys.spec.ts` →
`tests/e2e/98-copy02-rawkeys.spec.ts`, correction dated and attributed in place (defect record
kept, not silently cleaned). Class sweep run before the edit: it is the ONLY `98-copy0N` cite in
REQUIREMENTS.md and ROADMAP has none; the other four `frontend/tests` references (lines 467–587)
point at the legitimate `frontend/tests` root (four test roots exist per line 469;
`pull-to-refresh.spec.ts` stat'd to confirm). The orchestrator's standing instruction to the
research seat — never create the file a dangling cite names — is endorsed as the P94 rule.

Negative scope: I verified the five instrument paths named in that note resolve as cited AFTER
the edit only for the one I touched; the orchestrator's claim that the other four are correct was
spot-consistent with the P98 close block and is not re-derived here.

## 3. UI-SPEC question — READING A (fold), with two conditions

Decision, mine under the standing delegation (process scoping, no credential act): Phase 99 owes
NO separate `99-UI-SPEC.md`. Rationale: no new component, no layout change, RTL infrastructure
explicitly out of scope; the phase's UI contract is a set of rendered-surface assertions that
would otherwise restate AR-01's glossary and the criterion text.

Conditions:

1. **Citable anchors.** The folded section of `99-RESEARCH.md` (§5/§6) carries NUMBERED contract
   ids (`UI99-C1`, `UI99-C2`, …) covering at minimum: the English-free-under-`dir="rtl"` surface
   list (criterion 3's named surfaces included), the Arabic date/time rendering shape (Latin
   digits deliberate, no English weekday/month inside Arabic sentences), the typography/Tajawal
   assertion, and the settle primitive every criterion-2/3 oracle depends on (P98's law: a
   capture is a SETTLED render — locale asserted, never inherited). Plans cite `UI99-Cn` the way
   P98 plans cited `98-UI-SPEC.md §Cn`.
2. **Recorded absence.** This ruling IS the record that the artifact-set delta from P98 is
   deliberate: when I grade leg 1, the absence of `99-UI-SPEC.md` is not a gap. If GSD tooling
   hard-gates on a UI-SPEC artifact for `UI hint: yes` phases (a checker BLOCK, not a warning),
   do not fight the tooling — surface it to me and Reading B becomes the cheap path; do not
   hand-patch the checker.

Planner dispatch is RELEASED once the research artifact lands with its marker and §5/§6 satisfy
condition 1.

RULING-END
