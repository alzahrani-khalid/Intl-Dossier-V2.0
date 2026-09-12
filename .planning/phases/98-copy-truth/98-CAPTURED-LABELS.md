---
phase: 98
slug: copy-truth
plan: 08
artifact: captured-labels
seat: p98-exec-08
derived_at_head: 742bac2ed2dbb89aed27ddba0a1d0b377d0d6ec1
derived_on: 2026-08-18
oracle: tests/e2e/98-copy04-voice.spec.ts (@case group)
oracle_status: AMENDED THIS WAVE under RULING-P98A2-20 (settle mechanics added; see §4)
oracle_sha_before_amendment: 2d829196ef41d21cc774da761929a274b882c5d8
locale: en (asserted per surface at run time — see §2a; sentence case is an English orthographic rule)
role: admin (TEST_USER_EMAIL) — admin maps to the `reviewer` intake variant, see §6
---

# Phase 98 — the D-20 captured-label record (criterion 4, bounded sentence-case clause)

The graded population for criterion 4's sentence-case clause. **D-20 bounds this clause by TWO
different definitions and they are not interchangeable: the phase's spec set defines "visited";
the oracle's captured set defines "label".** This record is the intersection, **derived by running
the oracle against the phase-final tree**, never quoted from the 4,471 / 4,562 magnitude figures —
those size `COPY-09`, not this plan (D-04).

`RULING-P98A2-20` added one clause to that bound: **a capture is a SETTLED render with per-surface
reachability stated.** §2 and §4 are that clause discharged.

---

## 1. The population, stated

**POPULATION.** Rendered text on the eight visited surfaces (§2) that

1. is emitted by an element matching the oracle's `LABEL_SELECTORS`
   — `button, a, [role="tab"], h1, h2, h3, [data-slot="empty-title"]`;
2. survives the oracle's stated exclusions — inside a `th`, computed `text-transform: uppercase`,
   a mono font-family, empty text, or text containing a newline;
3. **exact-matches, byte for byte and CASE-SENSITIVELY, a leaf string value in
   `frontend/src/i18n/en/*.json`** (the reverse-bundle lookup); and
4. satisfies the oracle's Title-Case predicate: 2–6 words, not ALL-CAPS, and **at least TWO**
   non-initial words matching `^[A-Z][a-z]+$`.

**THE CASING RULE OF THE MATCHER, stated explicitly because the subject of this clause IS case**
(`RULING-P98A2-14`: casing sensitivity is a per-population property derived from the population's
semantics, never a brief-wide default):

- The reverse-bundle match is **CASE-SENSITIVE** (`Set.has` on the raw string). This is forced by
  the semantics: a case-insensitive match would equate `Add Elected Official` with
  `Add elected official`, destroying the exact discrimination the clause is about — it could not
  tell a repair from a no-op.
- The Title-Case predicate is likewise case-sensitive by construction.
- **`command grep` is used for every shell cross-check in this record, never the repo `grep`
  wrapper**, which silently implies `-i` on `-ril` — fatal when the subject is case.
- **"Title Case" and "sentence case" are claims about RENDERED TEXT, not about key names.** No key
  was renamed by this plan; only leaf VALUES changed. `accessQueue` staying camelCase is not a
  finding.

**WHAT FALLS OUTSIDE THE POPULATION** (D-05 — a correct command returns a correct number about the
wrong set):

| outside                                                               | why                                                                                                                                         | owner                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| every EN leaf value the oracle never captured (the ~4.5k long tail)   | not rendered on a visited surface, or not label-class                                                                                       | **`COPY-09` → Phase 102** |
| the 41 captured labels the predicate does not flag (§5)               | one capitalized non-initial word; the oracle's own header names `Week Ahead` as an intended non-flag — a **declared** under-inclusive bound | **`COPY-09` → Phase 102** |
| the sibling-role labels in the same component (§6)                    | the oracle runs admin only, so they never mount and are never captured                                                                      | **`COPY-09` → Phase 102** |
| Arabic values                                                         | Arabic has no letter case; Arabic copy quality is `AR-01..04` / Phase 99                                                                    | operator park             |
| data-driven text (entity names, ticket subjects, greetings)           | fails the reverse-bundle match — rendered text, not copy                                                                                    | out by definition         |
| `th` column headers, `text-transform: uppercase` ribbons, mono labels | CLAUDE.md carve-outs, excluded in the browser by computed style                                                                             | out by definition         |

---

## 2. Visited surfaces — capture counts AND per-surface reachability

`RULING-P98A2-20` item 5: **a count is not a visit list.** D-20's "visited" gains a stated
per-surface disposition. Eight surfaces, EN leg, admin role, viewport 1400×900, dev server
`http://localhost:5173`, settled capture.

| #   | requested                     | REACHABILITY                              | landed URL                                              | raw | distinct                           | matched | unmatched | flagged |
| --- | ----------------------------- | ----------------------------------------- | ------------------------------------------------------- | --- | ---------------------------------- | ------- | --------- | ------- |
| 1   | `/dossiers`                   | **VISITED**                               | `/dossiers?lng=en`                                      | 98  | 97                                 | 44      | 53        | 0       |
| 2   | `/dossiers/elected-officials` | **VISITED**                               | `/dossiers/elected-officials?lng=en&page=1`             | 73  | 72                                 | 30      | 42        | 0       |
| 3   | `/intake/queue`               | **REDIRECTED → `/my-work/intake`** (§2a)  | `/my-work/intake`                                       | 34  | 34                                 | 31      | 3         | **3**   |
| 4   | `/dashboard`                  | **VISITED**                               | `/dashboard?lng=en`                                     | 38  | 37                                 | 34      | 3         | 0       |
| 5   | `/calendar`                   | **VISITED**                               | `/calendar?lng=en`                                      | 37  | 35                                 | 32      | 3         | 0       |
| 6   | `/intelligence`               | **VISITED**                               | `/intelligence?lng=en`                                  | 49  | 48                                 | 46      | 2         | 0       |
| 7   | `/engagements`                | **ERROR-CHROME** — cause row in §2b       | `/engagements?lng=en`                                   | 29  | 29                                 | 27      | 2         | 0       |
| 8   | `/my-work`                    | **VISITED**                               | `/my-work?lng=en&tab=all&sortBy=deadline&sortOrder=asc` | 31  | 31                                 | 29      | 2         | 0       |
|     | **TOTAL**                     | 6 VISITED · 1 REDIRECTED · 1 ERROR-CHROME |                                                         | 389 | 95 matched / 94 unmatched distinct |         |           | **3**   |

**No surface is NOT-CONSTRUCTED** — all eight rendered and all eight were captured.

**Every capture count is shown NON-ZERO before any zero-flag is believed.** The amended oracle now
asserts `captured.length > 0` per surface, so an empty `flagged` can no longer be produced by a page
that never rendered. That assertion is the difference between "clean" and "not looked at".

### 2a. The `/intake/queue` redirect, and the locale claim it could have broken

`/intake/queue` **302s to `/my-work/intake`, and the `?lng=` query parameter does NOT survive the
redirect.** This project persists language under `id.locale`, not in the URL, so the landed surface
could in principle have rendered an **inherited** locale — which would make the three flagged labels
captures under a locale the run never asserted (acceptance clause 3; `RULING-P98A2-20` item 4).

**Tested rather than assumed, both polarities on the SAME landed URL:**

| requested | landed URL        | `<html lang>` | `dir` | headings rendered                                            |
| --------- | ----------------- | ------------- | ----- | ------------------------------------------------------------ |
| `?lng=ar` | `/my-work/intake` | `ar`          | `rtl` | `قائمة الاستقبال \| لا توجد مراجعات معلقة \| معايير التقييم` |
| `?lng=en` | `/my-work/intake` | `en`          | `ltr` | `Intake Queue \| No Pending Reviews \| Evaluation Criteria`  |

Two opposite requests produce two opposite renders on one URL: the `?lng=` is consumed and persisted
**before** the redirect resolves. **The locale is the REQUESTED one, by assertion, not by luck** — an
instrument that could not distinguish the two would have printed the same headings twice.

**This is now enforced on every run, not just recorded here.** The amended oracle calls
`expectLocale()` after settling each surface, checking `document.documentElement.lang`. A future
change that breaks locale propagation across that redirect reds the spec instead of quietly
capturing the wrong language.

### 2b. `/engagements` — ERROR-CHROME, with its cause

`/engagements` renders `Unable to load data` / `Try again` at this HEAD. Its 29 captures are
**error-state chrome, not the engagements list.** This is the same load failure the RED baseline
recorded for `98-copy01`'s ISO-week leg ("`/engagements` renders no week-grouped list at this HEAD…
the load failure is owned by no Phase 98 plan and was NOT repaired here"). **Named, never silent
(D-24):** the zero flag on `/engagements` covers the error surface only and **must not be read as
covering the engagements list**, whose labels this phase has never captured.

---

## 3. The captured Title Case set — VERDICT per flagged label

Three flagged labels, all on surface 3, all from one namespace subtree. Key paths are the
reverse-bundle lookup, cross-checked by an independent `command grep` carrying a positive control on
the same file, so the single-hit results are not blind zeros: each string has **exactly one** source
path repo-wide — no second namespace, no hardcoded TSX duplicate.

| label               | surfaces                            | key paths                                                         | VERDICT | completion                       |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------- | ------- | -------------------------------- |
| No Pending Reviews  | `/intake/queue` → `/my-work/intake` | `empty-states:intake.reviewer.title` (`en/empty-states.json:406`) | REPAIR  | REPAIRED → `No pending reviews`  |
| Access Review Queue | `/intake/queue` → `/my-work/intake` | `empty-states:intake.reviewer.actions.accessQueue` (`:429`)       | REPAIR  | REPAIRED → `Access review queue` |
| View All Tickets    | `/intake/queue` → `/my-work/intake` | `empty-states:intake.reviewer.actions.viewAll` (`:431`)           | REPAIR  | REPAIRED → `View all tickets`    |

**MACHINE-READABLE VERDICT ROWS.** The table above is the human view; Prettier pads its cells to
the `VERDICT` header width, which breaks the plan's pipe-delimited completion gate. The rows
below carry the plan's exact prescribed shape inside a fenced block, which Prettier does not
reformat. Recorded as a plan defect in `98-08-SUMMARY.md` per `RULING-P98A2-07` — proceed under the
criterion (the two counts must be EQUAL), record the collision, do not escalate.

```
| No Pending Reviews | /intake/queue -> /my-work/intake | empty-states:intake.reviewer.title | REPAIR | REPAIRED |
| Access Review Queue | /intake/queue -> /my-work/intake | empty-states:intake.reviewer.actions.accessQueue | REPAIR | REPAIRED |
| View All Tickets | /intake/queue -> /my-work/intake | empty-states:intake.reviewer.actions.viewAll | REPAIR | REPAIRED |
```

**KEEP verdicts: none.** No flagged label carries an embedded proper noun, an acronym, an UPPERCASE
ribbon class the selector exclusions missed, or a mono face — so no carve-out was available to any of
them, and none was claimed. The closed verdict vocabulary is **REPAIR / KEEP**; every flagged label
carries one.

**Renderer and namespace binding.** All three render through
`frontend/src/components/empty-states/IntakeRoleEmptyState.tsx` (`:445`, `:521`, `:528`) using the
**colon form** `t('empty-states:intake.reviewer.…')` against the registered `empty-states` namespace.
Resolution is proven by the render itself — the strings reached the screen in the capture, in both
locales in §2a — not by key existence (`RULING-P98A2-12` c3: existence is not resolution).

**AR pairs reviewed in the same commit (D-16), and deliberately unedited.** The edits are case-only;
Arabic has no letter case and no meaning shifted. `لا توجد مراجعات معلقة`,
`الوصول لقائمة المراجعة` and `عرض جميع التذاكر` are correct before and after. Arabic naturalness
remains the operator's park, untouched here.

**DATA-NOT-LABEL captures**, recorded so the reverse-bundle filter's work is visible: 94 distinct
unmatched strings, of which 92 are seeded entity names (`e2e-97-01-elected-official-<timestamp>`),
plus `Good morning, Khalid` (an interpolated greeting carrying user data), `Pending Triage` (a status
badge), `August 2026` (a calendar-grid month header — D-25 names these navigation chrome, OUT),
`1 status(es) selected`, `3`, and `ع`. **Zero unmatched captures satisfy the Title-Case predicate**,
so no hardcoded bilingual TSX label of this class is hiding behind the reverse-bundle filter on these
surfaces — the wave-3 blocker shape was tested for here and did not reproduce.

---

## 4. Why this capture, and not the one the oracle used to produce

**The `@case` oracle returned a DETERMINISTIC FALSE GREEN at this HEAD, and was repaired under
`RULING-P98A2-20`.** Before the amendment it contained **zero settle primitives** — no
`waitForLoadState`, `networkidle`, `waitForTimeout`, `waitForResponse` or `domcontentloaded` — so it
captured a **pre-hydration skeleton**: the synchronous nav shell, and nothing that mounts after a
data query resolves.

**The discriminating control**, run with capture mechanics held identical so the settle was the only
variable:

| mode                              | wall clock | `/dossiers` raw | `/intake/queue` raw | flagged |
| --------------------------------- | ---------- | --------------- | ------------------- | ------- |
| NOSETTLE (≡ the unamended oracle) | 6.3 s      | 38              | 20 (all nav shell)  | **0**   |
| SETTLED (`networkidle` + 3 s)     | 43.7 s     | 98              | 34                  | **3**   |

- **Reproducible, not flaky:** the unamended oracle passed 3/3 at 6.2 s / 6.5 s / 6.3 s.
- **SETTLE-SUFFICIENCY EVIDENCE** (the ruling's term): a 3 s dwell and an 8 s dwell are
  **byte-identical** across all eight surfaces (+0 / −0 unique captures). The settled capture is a
  converged fixed point, not a longer-is-more artifact — which is why 3 s is the dwell shipped.
- **Shape is not the hidden dimension; TIME is.** Widening `LABEL_SELECTORS` to add
  `[role="button"]`, `[role="menuitem"]`, `h4`–`h6`, `label`, `legend`, `summary`, `th`, `dt`,
  `caption`, `figcaption` and `[data-slot="empty-description"]` adds **4 raw captures and ZERO new
  flagged labels**.
- **The RED baseline's `Add Elected Official` flag was GENUINE** — that CTA happens to sit in the
  synchronous shell. **A genuine red from a blind instrument is the strongest false credential an
  oracle can earn:** the shell-red bought every green that followed.

**RETROACTIVE SCOPE (`RULING-P98A2-20` item 3, RULING-11 form): every prior `@case` green in this
phase was produced by an instrument capturing only the synchronous nav shell.** Those greens are
**scoped to the shell**, not wholesale-invalidated — the shell region really was clean.

### 4a. The amended oracle inherits no trust — both polarities, in the region that was blind

`RULING-P98A2-20` item 2 fixes the shape: the RED must be planted in a **post-settle** region,
because the shell-red class was already proven and the blind region is what needed a fixture.

| polarity                                                                                           | result                                                                                                                                |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **NEGATIVE** — Title Case label injected into `main` on a 1.5 s timer, i.e. after the shell paints | **DETECTED.** Fixture string derived live from the bundle (`Activity Feed Preferences`), so it cannot go stale as P102 works COPY-09. |
| **NEGATIVE, settle neutered (drill)**                                                              | **MISSED** — `Received array: []`, spec reds at the fixture in 2.9 s. The control discriminates.                                      |
| **POSITIVE, pre-repair**                                                                           | **RED** in 47.6 s on exactly the three labels of §3 — a second instrument agreeing with the seat's.                                   |
| **POSITIVE, post-repair**                                                                          | **GREEN** in 46.9 s.                                                                                                                  |

The drill edit was made in the working tree, run, and reverted; the revert was verified by
**SHA-256 equality** of the file before and after
(`0557f77e744b37717d62f38025ac17d1fa0655828cbd7e4480a98bcd137cd86b`), and the drill markers were
confirmed absent (`grep -c` = 0). A drill that is not proven reverted is a drill that shipped.

### 4b. Blast radius — routed, not widened

Settle-primitive census across the eight criterion oracles (one `command grep`,
instrument-controlled: the same census returns non-zero on `95-search-renders` and
`96-calendar-family`, so a zero means zero and not a blind sweep):

| spec                   | settle primitives             |
| ---------------------- | ----------------------------- |
| `98-copy01-labels`     | **0**                         |
| `98-copy02-rawkeys`    | 1                             |
| `98-copy03-dashboard`  | **0**                         |
| `98-copy04-voice`      | **0** → repaired by this wave |
| `98-copy05-dates`      | 2                             |
| `98-copy06-toast`      | 2                             |
| `98-copy07-statscard`  | **0**                         |
| `98-copy08-eo-popover` | **0**                         |

**Five of eight had zero settle primitives — no-settle is a house pattern in this suite, not an
outlier.** **STATED BOUND ON THAT TABLE, because it is the same mistake in miniature: PRESENCE IS
NOT PLACEMENT.** A non-zero count proves a settle primitive _exists in the file_; it does **not**
prove it runs before the capture. This record therefore makes **no** claim that `copy02` / `copy05` /
`copy06` are unaffected. Per `RULING-P98A2-20` item 7 that question — per oracle, whether its subject
can render post-shell and whether it settles — is **98-09's Law-1 pass**, and DOM-independent
instruments (bundle greps, resolution censuses) are unaffected. **This seat did not widen into it.**

---

## 5. The 41 captured labels the predicate does not flag — a DECLARED bound, not a silent one

Captured (they pass the reverse-bundle filter on a visited surface) but carrying **exactly one**
capitalized non-initial word, so the oracle's stated predicate does not flag them. The oracle's
header names `Week Ahead` as an intended non-flag, so this bound is the oracle's own design, not an
accident. **The flagged set is the work list** (98-08-PLAN, Task 1). **None of these was edited** —
`RULING-P98A2-20` item 6 endorses the bound as filed and makes editing even one of them a wave
failure. They are enumerated in full, not sampled, so the bound is **checkable**:

| #   | label               | surfaces          | #   | label               | surfaces          |
| --- | ------------------- | ----------------- | --- | ------------------- | ----------------- |
| 1   | AI Settings         | all 8 (admin nav) | 22  | My Desk             | all 8 (nav)       |
| 2   | AI Usage            | all 8 (admin nav) | 23  | My Tasks            | `/dashboard`      |
| 3   | All Dossiers        | `/dossiers`       | 24  | My Work             | `/my-work`        |
| 4   | All Types           | `/calendar`       | 25  | New Request         | `/intake/queue`   |
| 5   | Approval Management | all 8 (admin nav) | 26  | Overdue Commitments | `/dashboard`      |
| 6   | Audit Logs          | all 8 (admin nav) | 27  | Pending Review      | `/intelligence`   |
| 7   | Board View          | `/my-work`        | 28  | Recent Dossiers     | `/dashboard`      |
| 8   | Browse by Type      | `/dossiers`       | 29  | SLA Health          | `/dashboard`      |
| 9   | Create Event        | `/calendar`       | 30  | Saved Views         | `/dossiers`       |
| 10  | Create New          | `/dossiers`       | 31  | Sort By             | `/my-work`        |
| 11  | Create Report       | `/intelligence`   | 32  | System Settings     | all 8 (admin nav) |
| 12  | Data Retention      | all 8 (admin nav) | 33  | Total Reports       | `/intelligence`   |
| 13  | Elected Official    | `/dossiers`       | 34  | Tracking Type       | `/my-work`        |
| 14  | Elected Officials   | all 8 (nav)       | 35  | Upcoming Events     | `/calendar`       |
| 15  | Evaluation Criteria | `/intake/queue`   | 36  | VIP Visits          | `/dashboard`      |
| 16  | Export Dossiers     | `/dossiers`       | 37  | Vector Search       | `/intelligence`   |
| 17  | Field Permissions   | all 8 (admin nav) | 38  | Verified Reports    | `/intelligence`   |
| 18  | Import Dossiers     | `/dossiers`       | 39  | Week Ahead          | `/dashboard`      |
| 19  | Intake Queue        | `/intake/queue`   | 40  | Working Group       | `/dossiers`       |
| 20  | Intelligence Digest | `/dashboard`      | 41  | Working Groups      | all 8 (nav)       |
| 21  | Last Updated        | `/dossiers`       |     |                     |                   |

**Zero captured labels exceed the predicate's 6-word ceiling while carrying ≥2 capitalized
non-initial words** — the length bound cost this population nothing. Measured, not assumed.

---

## 6. The ROLE dimension — the sharpest bound on this record, and its count is UNDER-DETERMINED

The three repaired labels all live under `empty-states:intake.reviewer.*`. That subtree has **three
sibling role variants the oracle can never capture**: `IntakeRoleEmptyState.tsx:81` maps
`admin → 'reviewer'`, and the oracle runs **admin only**. `requester`, `assignee` and `viewer` are
structurally invisible to it — same file, same component, same defect class.

**HOW MANY sibling labels are affected is a POPULATION question, not an arithmetic one, so this
record states the predicate rather than asserting a bare number:**

| predicate                                                        | count  | what it sweeps in                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The oracle's own** (2–6 words, ≥2 non-initial `^[A-Z][a-z]+$`) | **12** | requester 7 · assignee 4 · viewer 1                                                                                                                                                                                                                                    |
| Looser (≥1 non-initial capitalized word, no length ceiling)      | 23     | additionally `Ready to Submit a Request?`, `Receive Notification`, `Review Details`, `Take Action`, `Mark Complete`, `Browse Tickets` — **and multi-sentence descriptions whose capitals are proper nouns (`MoU`, `Organization X`), which are not Title Case at all** |

**12 is the count under the predicate this clause is graded by.** The looser figure is recorded so
the number is not mistaken for a fact independent of its definition — the second set is visibly
over-inclusive, which is exactly why the predicate is the population.

Under the oracle's predicate:

| variant            | Title Case labels                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `intake.requester` | `Example Requests You Can Submit`, `Request for Technical Cooperation`, `Policy Position Development`, `MoU Renewal Support`, `Trend Analysis Request`, `Submit New Request`, `View My Requests` |
| `intake.assignee`  | `No Assigned Tasks`, `How Your Tasks Will Appear`, `View My Assignments`, `Browse All Tickets`                                                                                                   |
| `intake.viewer`    | `Intake Queue Overview`                                                                                                                                                                          |

**None was edited.** They are uncaptured, so they are `COPY-09` / P102 by D-20's own wording, and
editing them is the silent absorption D-20 forbids.

**Stated plainly rather than left to the green: this wave repairs the `reviewer` variant and leaves
its three siblings Title Case. It is a PARTIAL REPAIR OF ONE COMPONENT.** A reader must not infer
from a green `@case` that `IntakeRoleEmptyState` is clean — it is clean **for admin**, the only role
the oracle drives.

---

## 7. The boundary statement

**Every EN leaf value not in the captured set of §3 is `COPY-09` territory, owner Phase 102, and was
not edited by this plan.** The magnitude figures 4,471 (researcher) / 4,562 (orchestrator) size that
requirement; they are **bounded away** from this clause and were never used to derive anything here.
The population above was derived by **running the oracle's capture against the phase-final tree**,
and the count fell out (D-04).

**Proved, not asserted.** A leaf-by-leaf diff of the entire bundle — `frontend/src/i18n/{en,ar}`,
**258 files, 32,430 leaf values** — between `742bac2ed` and the working tree reports
**changed = 3, added = 0, removed = 0**, and the three are exactly the REPAIR rows of §3. The same
comparator, given a planted edit at an untouched key, reports 4 — so the 3 is a measurement, not a
comparator that never ran.

CAPTURED-LABELS-END
