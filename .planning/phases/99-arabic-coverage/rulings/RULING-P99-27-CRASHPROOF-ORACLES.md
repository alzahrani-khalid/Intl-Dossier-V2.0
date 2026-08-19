> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-27-CRASHPROOF-ORACLES.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-27 — crash-proof the negation class tonight; the DB half is gated on evidence, not on the hour

2026-08-19 ~02:4x local, OVERSEER (wK:p7X). Input: `P99-SWEEP-C5-AND-VACUOUS-NEGATIVES.md`,
analysis-only as ordered. The sweep is accepted in full; its controls are what make it usable.

## 1. The finding that reprices everything — accepted with its honest bound

Three of the four merged tasks' bare-negation oracles are SOUND, measured against the merged tree:
real domain reds (`scope matched zero source files`, `7/13 agree; 5 mismatch`,
`UNCLASSIFIED glossary occurrences: 865`). **P99-01's c6 is not**: it exits 1 on
`http://localhost:5173 is already used` — a harness line, zero assertion-shaped lines — so its
rendered clause is demonstrably satisfiable without anything rendering.

**The bound is the important part and I am adopting the sweep's wording:** we proved the clause
CANNOT DISCRIMINATE and produced a live instance of it passing on a crash; we did NOT prove
P99-01's actual gate pass WAS a crash, because the gate logs `exit 0` for the whole conjunction and
never records the playwright sub-output. So: **P99-01's rendered guarantee is UNEVIDENCED, not
disproven.** Its structural criteria c1–c5 stand.

## 2. P99-01 does NOT re-run — its rendered clause is re-proved AT THE CLOSE

Its summary is on base, so compile will mark it done; deleting that summary to force a re-run would
have a worker redo work already committed. Instead the **closing consolidated battery re-proves the
dates spec under the crash-proof form**, and the close records plainly that P99-01's own green was
unevidenced and where it was re-earned. A phase that discovers an unevidenced green and quietly
lets the §8 inference carry it forward has learned nothing from tonight.

## 3. Steps 1–2 — DO NOW. Mechanical, and they retire the proven-dangerous class.

**Playwright class (P99-01/02/03):** replace every bare negation with the sweep's crash-proof form —
`--reporter=json` to a FILE, then assert three things together: `stats.expected+unexpected == 8`
(the tests RAN; a crash reports 0), `unexpected >= 1`, and the NAMED failing titles present. A
crash fails all three; only a real assertion failure satisfies them.

**`python3|grep` class (P99-09/11/13):** raised by the sweep as the next-worst and I agree — a
crashed detector yields empty input, `grep` exits 1, and the negation passes SILENTLY. All three
are pending, so it is cheapest now. Same principle: assert the instrument RAN (row count, sentinel
line, explicit exit code) before asserting what it found.

Fix the five mis-referenced SUMMARY filenames in the same pass — not load-bearing, correctly
diagnosed as such, but a dangling cite is a named class in this repo and the pass is free.

## 4. Step 3 — the DB half proceeds TONIGHT, GATED ON A CODE READ, not on the clock

I am not holding this for daylight on the grounds that it is "new behaviour". Reading `pg_constraint`
is a READ. Seeding is a write, but it is a committed test fixture executing its designed purpose
against STAGING with credentials that already exist, and Phase 102 exists precisely because staging
is expected to be dirty. What would make me hold is not the hour — it is the fixture being unsafe.

**So prove it by reading the fixture, before it runs once:**

1. `verifyStatusConstraint` runs BEFORE any INSERT and aborts on failure (the plan says it does);
2. ids are invocation-unique (`crypto.randomUUID()` per row), not fixed;
3. teardown deletes ONLY the ids this invocation created;
4. no path writes outside the positions rows it seeded.

**All four hold → run it.** Any one absent → the DB half HOLDS for daylight, c5's seeded-id clause
closes BOUNDED with me as owner and the removal condition stated, and the rendered half still
lands tonight. Report which branch you took and the evidence for it.

## 5. Then relaunch

Recompile (expect **4 done** by the §8 inference from the merged summaries, 37 pending), full proof
battery, detached launch, tiers armed and re-drilled. The unmeasured item the sweep named — JSON
reporter output under a crash, its probe timed out at 90s still booting Vite — is answered by the
first real gate run rather than by another probe; the three-part assertion is designed so that a
crash fails it regardless of what the reporter emits.

## 6. Upstream seed

The gate records `exit 0` for a whole conjunction and never the sub-command output, which is why we
cannot say retroactively whether P99-01's green was real. **A gate that cannot be audited after the
fact turns every past green into a matter of trust.** Ask: persist per-sub-command output (or at
minimum the failing/last command's tail) in the gate result, so a green can be re-read months later
by someone who was not there.

RULING-END
