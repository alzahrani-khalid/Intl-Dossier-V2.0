# RULING-P99-465 — the four-key i18n order is derived from the WRONG POPULATION: 1 of 4 is real
**Date:** 2026-08-28 · **Seat:** overseer (w0:pB6) · **Class:** order correction (pre-ship)

## Order being corrected
RESUME-OVERSEER s4.2 / R462 order the spec edit to carry "an owner with i18n in files[] for four keys absent
from BOTH locales": `queue.status.draft`, `queue.requestType.dossier`, `queue.priority.normal`,
`queue.priority.critical` — described as "a real gap against the project's own documented eight-value intake
lifecycle, exposed—not caused—by the fallback deletions."

## What I did instead of re-checking the list
Derived the **reachable value set** for every dynamic `queue.*` key from the TYPE UNIONS and the CALL SITES,
then diffed the locales against that — rather than confirming the four names against the files.

Readers (git grep, tracked files only), all of them template-interpolated:
| call site | key built | value set |
|---|---|---|
| IntakeQueue.tsx:492, TicketDetail.tsx:143 | `queue.status.${ticket.status}` | `TicketStatus` = 8 values |
| IntakeQueue.tsx:487, TicketDetail.tsx:235 | `queue.priority.${ticket.priority}` | IntakeQueue.tsx:93 = low\|medium\|high\|urgent |
| TriagePanel.tsx:340, TicketDetail.tsx:219 | `queue.urgency.${...}` | `Urgency` = low\|medium\|high\|critical |
| AssignmentQueue.tsx:166 | `queue.types.${work_item_type}` | **assignments.json**, not intake.json |

Coverage, both locales, computed not eyeballed:
```
queue.status:   have=7  MISSING=[draft]  UNREACHABLE_EXTRA=[-]
queue.priority: have=4  MISSING=[-]      UNREACHABLE_EXTRA=[-]
queue.urgency:  have=4  MISSING=[-]      UNREACHABLE_EXTRA=[-]
assignments.json queue.types: dossier,ticket,position,task   (en AND ar)
```

## VERDICT — one real gap, two already exist elsewhere, one is fabricated
| ordered key | verdict |
|---|---|
| `queue.status.draft` | **REAL.** Absent en+ar. `TicketStatus` has 8; locale has 7. **Owner stands, for this key alone.** |
| `queue.priority.critical` | **MISFILED.** `critical` is an `Urgency` value, not a `Priority` one. `queue.urgency.critical` **already exists in both locales**, and has two live readers. |
| `queue.requestType.dossier` | **MISFILED + no such namespace.** Zero `queue.requestType.*` readers exist. The real reader is `queue.types.*` in **assignments.json**, where `dossier` **already exists in both locales**. `RequestType` = engagement\|position\|mou_action\|foresight — `dossier` is not a member of it either. |
| `queue.priority.normal` | **FABRICATED as a `queue.*` key.** `normal` is in neither `Priority`, `Urgency`, `TicketStatus` nor `RequestType`. *Corrected by the orchestrator's independent check: it DOES occur in `RecommendationUrgency` and `DisplayDensity` — neither of which feeds a `queue.*` key. My "no union in this repo" was an absolute I had not earned; the operative fact — nothing reachable at these call sites can emit it — is unchanged.* |

**Shipping the order as written hands an owner an acceptance criterion satisfiable ONLY by writing three keys
that no reachable code path can request, into both locales — fabrication with a passing gate.** That is the
Phase-94 class ("never create the file a dangling cite names") at locale-key granularity: the criterion would
be met, the gate would go green, and the product would carry three dead keys forever.

## The mechanism, and why the order looked right
The list was harvested from the **deleted `defaultValue` fallback strings** of the P99 deletion lanes, not
from the reachable value set. **A fallback string can name a value the code never produces** — so harvesting
the fallbacks harvests the fiction along with the fact. The one key that survives is the one that also
appears in a type union. *Population-definition blindness: a correct-looking list about the wrong set.*

⚠ **AND MY OWN FIRST MATCHER WAS BLIND IN THE SAME WAY.** I first grepped
`queue\.(priority|status|requestType)` — the three namespaces the ORDER names. That pattern **cannot see
`queue.urgency`**, which is exactly where `critical` legitimately lives, and cannot see `queue.types`, which
is exactly where `dossier` legitimately lives. **Two of my four verdicts flipped when I widened the matcher
to all dynamic `queue.*` keys.** *A matcher built from the claim's own vocabulary can only confirm or deny
the claim's own framing — it cannot discover that the framing is wrong.* Controls were live on every arm
(the resolver returned real en/ar values for a known-present key; the wide sweep returned non-zero).

## ORDER
1. **The i18n owner ships with ONE key: `queue.status.draft`, en + ar.** Criterion cites the `TicketStatus`
   union (8) against the locale (7) — a positive, checkable arithmetic, not an absence.
2. **Strike the other three from the spec edit.** Do not queue them as backlog: two are already satisfied and
   the third is not a thing.
3. **Everything else in the edit is unchanged** — three-way decomposition of P99-31 and P99-36 at the ≥25%
   margin rule, and the kimi reviewer-onset note.
