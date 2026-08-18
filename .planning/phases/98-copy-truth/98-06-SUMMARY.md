---
phase: 98-copy-truth
plan: 06
type: execute-summary
wave: 3
seat: p98-exec-06 (herdr pane wK:p7S)
baseline_head: 13d5094ea
work_commit: a9d2414a5
head_at_writing: 34453e809
requirements: [COPY-03, COPY-04]
status: WORK COMPLETE — two clause-2 blockers ESCALATED, not closed by me
escalation: .tickmarkr/overseer/P98A2-EXEC-W3-ESCALATION-98-06.md
---

# 98-06 — the voice-value lane: execution record

**Read the escalation alongside this file.** Two of this plan's clauses cannot be honestly closed
at the altitude the plan claims, and both were escalated **before** I acted, per
`ACCEPTANCE-P98-EXEC` clause 2 and `RULING-P98A2-05`.

**Baseline pinned: `13d5094ea`.** My brief named `ca5ade52f`; the orchestrator corrected HEAD
mid-run and I re-verified the new sha myself before taking any derivation. Every population figure
below is pinned to a sha, because HEAD moved **three times** under me during this run (98-05 landed
`a0de9a1a7`, `fe1b7ba00`, and one more reaching `34453e809`).

---

## 0. Closure statement — read this before any number below

Written under the **BOUNDED wording**, on the orchestrator's instruction after it independently
verified E-A and E-C. This is the claim I can defend; the unbounded one I cannot.

**Criterion 3 / `COPY-03` — CLOSES IN FULL, on forced rendered states.** The four seed-instruction
strings are rewritten in both locales and proven on **CDP-forced empty and error digest states plus
the route-fulfilled VIP empty state**, role `admin`, locales `en` + `ar`. One caveat, stated rather
than buried: the forced-**error** leg rides a spec whose own force-verification assertion flakes
(E-B), and on a failing run its `ar` iteration is never reached. The **copy** assertions pass on
every run.

**Criterion 4 / `COPY-04` — the three value clauses CLOSE IN FULL over the `frontend/src/i18n/**/\*.json`
population, and are BOUNDED over the rendered surface\*\*, with the out-of-population class named:

| clause              | closes in full over                                                                                                         | bounded by                                                                                | instrument                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| exclamations        | i18n JSON leaf values, both locales — floor **exactly 1 EN / 1 AR**, the `validation:password.addSpecial` charset carve-out | hardcoded bilingual TSX literals (E-C class 2) + `t()` default masks (E-C class 1, → P99) | drilled walker, both polarities                 |
| first person        | i18n JSON EN values — **27 repaired / 2 user-speaker OUT / 1 domain term → P99**, zero product-speaker remaining            | same two classes                                                                          | drilled walker + wider-pattern blind-spot probe |
| retired terminology | i18n JSON EN values — **zero** `Due Date` / chip values survive in any `en/*.json`                                          | 3 hardcoded TSX/TS members on a **routed** page + a CSV header (E-A)                      | bundle-grep oracle, both polarities             |

**The named Title Case instance (D-14/D-30) closes IN FULL, unbounded**, on a rendered surface:
`elected-officials:list.add` = `Add elected official` (EN, re-cased), `إضافة مسؤول منتخب` (AR,
unchanged), green in **both** locale legs of `98-copy04-voice.spec.ts @values`, role `admin` — the
one leg of that spec that actually discriminated.

**Held for ruling, closed by me: nothing.** E-A, E-B and E-C are all **HOLD** per the orchestrator.
Criterion 4's _unbounded_ "no user reads the retired term / an exclamation / product-we" reading is
**NOT closed by this plan** and I do not claim it. `RULING-P98A2-12` (`b5eb84314`), filed for
criterion 1, is expected to be the template for the criterion-4 answer.

**Independently corroborated by the orchestrator** (recorded because it strengthens E-A and I did
not derive these two facts myself): a source-level grep returns **10** files for `Due Date`, but
**seven are JSX `{/* … */}` comments stripped at build** — so my three are exactly the user-visible
ones, and **the bundle-grep is the discriminating instrument a source grep is not.** And
`CommitmentsHelpPage.tsx` / `useExportData.ts` are declared by **no plan in the phase — 0 of 9, with
a live control** — so widening has zero contention cost if that is how it is ruled.

---

## 1. Populations — every one RE-DERIVED, never re-quoted (D-04 / D-05)

All four derived at `13d5094ea` **before any edit**, over **leaf string VALUES** in
`frontend/src/i18n/{en,ar}/*.json` (129 namespaces per locale), walking dicts **and lists**.

**Stated OUTSIDE every population below:** key NAMES; code comments; `.planning/`; tests and
`__tests__`; the dead `frontend/public/locales`; DB column names under the `CLAUDE.md` carve-outs
(`aa_commitments.due_date`, `tasks.sla_deadline`); and — the one that turned out to matter —
**`.tsx`/`.ts` hardcoded literals**, which my plan bans outright. §7 is where that exclusion stops
being harmless.

**Also outside, by plan mandate:** `common.json`, `dossier.json`, `intelligence-signals.json`,
`engagements.json` (owned by 98-03 / 98-04 / 98-05).

### P1 — seed/test instructions (COPY-03, the phase's one `[V]` item)

- **Definition:** EN leaf values matching `/\bseed(ed)?\b|\bstaging\b|test data|migration/i` across
  all 129 EN namespaces.
- **Derived: exactly 4**, all in `dashboard-widgets.json`. The RESEARCH claim reproduces exactly.
- **AR leg, and a population trap I nearly walked into.** The EN regex is **vacuous over Arabic**,
  so the AR leg has its own defect-term pattern `المزروعة|التجريبية|بيانات الاختبار`. It matches
  **3 of the 4** AR pairs — **not 4**. `vip.empty.body` AR reads
  `…إلى بيانات لوحة التحكم…` ("to the dashboard data"), carrying the seed instruction
  **semantically but not lexically**. Had I asserted "4 AR hits" I would have had a correct
  instrument returning a wrong number. It is repaired on **key parity (D-16)**, not on a match.
- **Controls, both polarities, both locales:** EN pattern fires on `Apply the dashboard demo seed`
  → `True`, silent on `New digest publications appear here as they are issued.` → `False`; AR
  pattern fires on `الموجز جاهز للمنشورات المزروعة.` → `True`, silent on `لا توجد منشورات بعد`
  → `False`.

### P2 — retired terminology

- **Definition:** values matching `/"Due Date"|Deadline \/ Due/` in `frontend/src/i18n/en/*.json`.
- **Derived: 5 EN** — `calendar.json wizard.templates.deadlineReminder.title`,
  `commitments.json form.dueDate` + `filters.dueDate`, `meeting-minutes.json actionItems.dueDate`,
  `working-groups.json deliverableForm.dueDate`. **AR: 0** for this EN pattern (the AR retired term
  is a different string — see below).
- **CROSS-LANE CHECK, and it PASSES.** The plan's interfaces block expected **7**, including
  `common.json:712` and `dossier.json:962`. Both are **GONE at my HEAD** — I verified what replaced
  them rather than trusting the absence: `common:afterActions.commitments.dueDate` now reads
  `Deadline` / `الموعد النهائي` and `dossier:addToDossier.form.dueDate` the same, landed by
  `646b67d7e` (98-04). **7 − 2 = 5.** This is the check that the upstream lanes did their part, and
  it also fixed my AR word choice: I aligned to **`الموعد النهائي`**, derived from what 98-03/98-04
  actually wrote, not from the plan's prose.
- **Control:** pattern fires on `Deadline / Due Date` → `True`, silent on `Deadline` → `False`.
  Plus the D-06 instrument control: the identical pattern must still find its own quotation inside
  `98-06-PLAN.md` — asserted in the gate, PASS at both polarities of the run.

### P3 — exclamation marks

- **Definition:** leaf string values containing `!`, both locales.
- **Derived at `13d5094ea`: 30 EN / 29 AR — NOT the 31 / 30 that D-21 and the plan state.**
- **The delta is attributed, not shrugged at.** I re-ran the same walker against the RED-baseline
  sha `4e107b5d3` and got **exactly 31 / 30**, reproducing D-21. The difference is
  `common:auth.loginSuccess`, which was `Login successful!` / `تم تسجيل الدخول بنجاح!` at
  `4e107b5d3` and is repaired at my HEAD — 98-04's work. **−1 EN, −1 AR, fully accounted.** D-21's
  figure was true at its instant; mine is true at mine. Per D-04 the derived figure governs, and I
  report both.
- **Distribution confirms the plan's asymmetry warning:** `notification-center` is **2 EN / 1 AR**
  (`noNotificationsDescription` carries `!` in EN only). Pairs are not always symmetric; that one is
  recorded as an EN-only edit.
- **Control:** `'!' in 'Welcome aboard!'` → `True`; `'!' in 'Welcome aboard'` → `False`.

### P4 — first-person plural

- **Definition:** EN leaf values matching `/\b([Ww]e|[Oo]ur|[Ll]et'?s)\b|\bus\b/`.
- **Derived: 30 candidates across 24 files** — matching the plan's "~30 across 24 files" exactly.
- **Register figure: 8, and it is REFUTED as a count** (D-21 already called it unverified). 30 raw,
  **27 product-speaker after triage** — see §4. RESEARCH predicted triage would "land near the
  audit's 8–15"; **it landed at 27**, because the seven near-identical wizard `guidance` strings
  ("Tell us about the X") are unambiguously the product addressing the user and I counted every one.
  My triage is materially more inclusive than RESEARCH anticipated and I flag the divergence rather
  than quietly adopting the prediction.
- **Blind-spot probe (the both-polarity check that matters for a case-sensitive population):** I ran
  a **wider** case-insensitive pattern `\b(we|our|ours|ourselves|us|let's|lets)\b/i` over the same
  set and diffed. **0 additional members.** The narrow pattern has no blind spot — established by
  measurement, not assumed from `\b` semantics.
- **Control:** fires on `We found 3 matches` → `True`, silent on `3 matches found` → `False`.

---

## 2. The ruled override — I executed the **Q5 FORM**, not the plan's action body

Per **`RULING-P98A2-05` §E1-a**, and stated here because the brief requires it:

**I deleted the `wizard.templates.deadlineReminder` key family from BOTH locales** rather than
replacing the chip's value as `98-06-PLAN.md`'s action body directs. Verified present before
deletion in `en` **and** `ar` `calendar.json` (2 keys each: `.title`, `.description`).

**`frontend/src/components/calendar/CalendarEmptyWizard.tsx` was left UNTOUCHED.** Dead-code
cleanup is not this phase's diff, and it is not copy.

**Surgical-deletion control:** the sibling templates must survive. Before: 8 keys under
`wizard.templates`. After: **7** (`bilateralMeeting`, `description`, `forumEvent`, `reviewMeeting`,
`stakeholderMeeting`, `title`, `trainingSession`) in **both** locales — asserted in the gate, so a
sweep that wiped the subtree would go red rather than pass quietly.

---

## 3. Run record — every drilled instrument, BOTH polarities actually executing

### 3a. The task gate (the same script, run before and after)

One instrument, 24 checks, run at `13d5094ea` (RED) and again at `a9d2414a5` and `34453e809`
(GREEN). It never stops at first failure, so every check reports its own verdict.

|                | RED @ `13d5094ea` | GREEN @ `a9d2414a5` | GREEN @ `34453e809` |
| -------------- | ----------------- | ------------------- | ------------------- |
| failing checks | **11**            | **0**               | **0**               |
| control checks | 9 PASS            | 9 PASS              | 9 PASS              |

The 11 that were red: T1 en/ar seed values, T1 en/ar heading byte-exactness, T2 `"Due Date"` file
count, T2 EO CTA EN, T3 en/ar exclamation floor, T3 first-person residue, P5 en/ar
`deadlineReminder` presence. **Every repair below has a matching observed red.**

### 3b. Exclamation floor — post-repair walker output

```
[PASS] T3 en exclamation leaf values == 1  -- n=1 files=['validation.json']
[PASS] T3 ar exclamation leaf values == 1  -- n=1 files=['validation.json']
[PASS] T3 en charset carve-out present and still carries "!"  -- 'Add special characters (!@#$%^&*)'
[PASS] T3 ar charset carve-out present and still carries "!"  -- 'أضف رموزًا خاصة (!@#$%^&*)'
```

**Exactly 1 EN / 1 AR**, and the survivor is proven to be `validation:password.addSpecial` — floor
and carve-out asserted **together**, so an over-eager sweep that deleted the charset listing would
also go red. A non-zero floor, so the zero-trap does not arise.

**A dependency I checked rather than assumed:** `98-copy04-voice.spec.ts:222` self-tests with
`expect(bangValues.length).toBeGreaterThan(0)` — the EN bundle **must** still hold exclamation
strings or that leg is not live. Sweeping to 0 would have failed the spec's own instrument. The
carve-out is what keeps it alive at exactly 1.

### 3c. The bundle-grep oracle for the deletion — the ruled instrument, both polarities

Production build (`pnpm --filter intake-frontend build` — D-19, **never** `--filter frontend`),
`dist/assets/*.js`, **305 files**, `*.map` **excluded** under the ruled justification.

| string                                                         | pre-edit @ `13d5094ea`          | post-edit @ `a9d2414a5`                             |
| -------------------------------------------------------------- | ------------------------------- | --------------------------------------------------- |
| `Deadline / Due Date`                                          | **1** (chunk `app-BJaTIu-J.js`) | **0**                                               |
| `موعد نهائي / تاريخ استحقاق`                                   | **1**                           | **0**                                               |
| `Track important deadlines, submission dates, or deliverables` | **1**                           | **0**                                               |
| `تتبع المواعيد النهائية المهمة`                                | **1**                           | **0**                                               |
| **POSITIVE CONTROL** `Add special characters`                  | 1                               | **1**                                               |
| **POSITIVE CONTROL** `أضف رموزًا خاصة`                         | 1                               | **1**                                               |
| **POSITIVE CONTROL** `Add elected official`                    | —                               | **1** (new value, proves the rebuild took my edits) |
| **POSITIVE CONTROL** `No publications yet`                     | —                               | **1** (same)                                        |
| **SIBLING CONTROL** `Forum / Conference`                       | —                               | **1** (deletion was surgical)                       |
| **NEGATIVE CONTROL** `ZZZ-this-literal-ships-nowhere-98-06`    | 0                               | **0**                                               |

The RED polarity is a real pre-edit build, not prose. The positive control fires **in the same run**
as the zero, so the zero means "absent", never "the grep never looked".

**This oracle is also what caught E-A** — see §7. It returned a `"Due Date"` hit _after_ my i18n
zero was proven, which is the entire reason the boundary defect surfaced at all rather than shipping.

---

## 4. First-person triage — a verdict for EVERY candidate, zero product-speaker remaining

30 candidates. **27 repaired (product-speaker) · 2 OUT (user-speaker) · 1 flagged to P99 (domain
term, in a banned file).** A candidate without a verdict would be a population failure; there are none.

### OUT — the USER is the speaker (named, not silently dropped)

| key                                                            | value                                                                                                  | why OUT                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `ai-chat:suggestion1`                                          | `What are our active commitments?`                                                                     | a canned **user** prompt — the user speaks it                                    |
| `empty-states:intake.requester.examples.foresight.description` | `Requesting analysis of emerging statistical methodologies and their implications for our operations.` | **example request text** a requester would write — user voice, not product voice |

### FLAGGED to P99 glossary — domain term, and a banned-file handoff

| key                                    | value                     | disposition                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dossier:overview.positions.ourStance` | `Our Position` / `موقفنا` | organizational noun phrase, **not** product voice. `dossier.json` is a **banned file** for this plan → **HANDOFF LINE, not edited.** Its TSX twin `PositionTrackerCard.tsx:93` carries the same literal (§7). |

**This is the only banned-file member any of my four derivations found.** The plan predicted
"expected outcome: none"; the true outcome is **one**, and it is this. `common.json`,
`intelligence-signals.json` and `engagements.json` returned **zero** in-population members.

### REPAIRED — product is the speaker (27)

| #   | key                                                       | EN before → after                                                                                                           | AR                                                                                                           |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | `bulk-actions:progress.pleaseWait`                        | `Please wait while we process your request` → `Processing your request`                                                     | no 1st person in AR — **reviewed, unchanged**                                                                |
| 2   | `calendar-sync:oauth.pleaseWait`                          | `Please wait while we connect your calendar...` → `Connecting your calendar...`                                             | `يرجى الانتظار بينما نقوم بربط تقويمك...` → `جارٍ ربط تقويمك...`                                             |
| 3   | `contacts:contactDirectory.duplicates.dialog_description` | `We found existing contacts that may be duplicates.` → `Some existing contacts may be duplicates.`                          | `وجدنا…` → `قد تكون بعض جهات الاتصال الموجودة مكررة.`                                                        |
| 4   | `country-wizard:wizard.steps.basic.guidance`              | `Tell us about the country —` → `Describe the country —`                                                                    | `عرّفنا على الدولة —` → `صف الدولة —`                                                                        |
| 5   | `dossier-recommendations:noRecommendationsDescription`    | `We haven't found any similar dossiers yet.` → `No similar dossiers found yet.`                                             | `لم نعثر…` → `لم يتم العثور على ملفات مشابهة بعد.`                                                           |
| 6   | `dossier-recommendations:feedback.negative`               | `Sorry to hear that. We'll improve.` → `Your feedback helps improve these results.`                                         | `نعتذر عن ذلك. سنعمل على التحسين.` → `ملاحظاتك تساعد على تحسين النتائج.`                                     |
| 7   | `elected-official-wizard:…guidance`                       | `Tell us who this official is —` → `Identify the official —`                                                                | `عرّفنا بهذا المسؤول —` → `عرّف بهذا المسؤول —`                                                              |
| 8   | `empty-states:intake.requester.description`               | `Our team will review and process your request promptly.` → `Requests are reviewed and processed promptly.`                 | `سيقوم فريقنا…` → `تتم مراجعة الطلبات ومعالجتها على الفور.`                                                  |
| 9   | `engagement-wizard:…guidance`                             | `Tell us about the engagement —` → `Describe the engagement —`                                                              | `عرّفنا على النشاط —` → `صف النشاط —`                                                                        |
| 10  | `forum-wizard:…guidance`                                  | `Tell us about the forum —` → `Describe the forum —`                                                                        | `عرّفنا على المنتدى —` → `صف المنتدى —`                                                                      |
| 11  | `guided-tours:tours.onboarding.welcome.description`       | `Let's take a quick tour to help you understand how` → `Take a quick tour to see how`                                       | `لنأخذ جولة سريعة…` → `خذ جولة سريعة لمعرفة كيفية`                                                           |
| 12  | `guided-tours:tours.dossier.steps.welcome.content`        | `Let's walk through creating your first one.` → `Walk through creating your first one.`                                     | `دعنا نمشي معك…` → `تابع الخطوات لإنشاء أول ملف.`                                                            |
| 13  | `loading:loading.pleaseWait`                              | `Please wait while we process your request` → `Processing your request`                                                     | no 1st person in AR — **reviewed, unchanged**                                                                |
| 14  | `loading:error.description`                               | `We encountered an error while loading the data` → `An error occurred while loading the data`                               | `واجهنا خطأ…` → `حدث خطأ أثناء تحميل البيانات`                                                               |
| 15  | `onboarding:emptyState.title`                             | `Welcome! Let's get you started` → `Get started`                                                                            | `مرحباً! دعنا نبدأ معك` → `ابدأ الآن` — **one repair closing BOTH populations** (exclamation + first person) |
| 16  | `organization-wizard:…guidance`                           | `Tell us about the organization —` → `Describe the organization —`                                                          | `عرّفنا على المنظمة —` → `صف المنظمة —`                                                                      |
| 17  | `person-wizard:…guidance`                                 | `Tell us who this person is —` → `Identify the person —`                                                                    | `عرّفنا بهذا الشخص —` → `عرّف بهذا الشخص —`                                                                  |
| 18  | `progressive-form:demo.contactInfoDescription`            | `How we can reach you` → `How to reach you`                                                                                 | `كيف يمكننا التواصل معك` → `كيفية التواصل معك`                                                               |
| 19  | `progressive-form:demo.fields.emailHelp`                  | `We'll use this to send you important updates` → `Used to send you important updates`                                       | `سنستخدم هذا…` → `يُستخدم لإرسال التحديثات المهمة إليك`                                                      |
| 20  | `relationships:wizard.title`                              | `Let's Create Your First Relationship` → `Create your first relationship`                                                   | `لنُنشئ أول علاقة لك` → `أنشئ أول علاقة لك`                                                                  |
| 21  | `relationships:suggestions.noSuggestionsDescription`      | `We couldn't find potential connections based on available data.` → `No potential connections found in the available data.` | `لم نتمكن…` → `لم يتم العثور على اتصالات محتملة…`                                                            |
| 22  | `sample-data:firstRun.adminBody`                          | `We can populate your database with` → `This populates your database with`                                                  | `يمكننا تعبئة…` → `يعبّئ هذا قاعدة بياناتك بسيناريو`                                                         |
| 23  | `smart-input:helpText.email`                              | `We'll never share your email` → `Your email is never shared`                                                               | `لن نشارك…` → `لن تتم مشاركة بريدك الإلكتروني أبدًا`                                                         |
| 24  | `topic-wizard:…guidance`                                  | `Tell us about the topic —` → `Describe the topic —`                                                                        | `عرّفنا على الموضوع —` → `صف الموضوع —`                                                                      |
| 25  | `webhooks:help.hmacSignature`                             | `We will sign each request payload…` → `Each request payload is signed…`                                                    | `سنقوم بتوقيع…` → `يتم توقيع كل حمولة طلب…`                                                                  |
| 26  | `working-group-wizard:…guidance`                          | `Tell us about the working group —` → `Describe the working group —`                                                        | `عرّفنا على مجموعة العمل —` → `صف مجموعة العمل —`                                                            |
| 27  | `working-groups:memberSuggestions.noSuggestionsDesc`      | `We couldn't find potential members based on available data.` → `No potential members found in the available data.`         | `لم نتمكن…` → `لم يتم العثور على أعضاء محتملين…`                                                             |

**Two AR pairs deliberately left unchanged (#1, #13):** their Arabic was already impersonal
(`يرجى الانتظار أثناء معالجة طلبك`). D-16 requires the pair be **reviewed** in the same commit, which
it was; it does not require churning a value that carries no defect. **This is a judgment call and
it is attackable** — it leaves EN "Processing your request" against AR "please wait while your
request is processed," a small register drift I chose not to close because Arabic authoring quality
is the operator's park, not mine.

### Exclamation repair rule (uniform, mechanical, stated so it can be audited)

Terminal `!` → `.` on sentence-shaped strings; `!` dropped with no replacement on short
title/label shapes; where `!` sat on a hollow celebratory interjection (`Congratulations!`,
`Welcome!`, `You're doing great!`) the interjection was dropped and the informative remainder kept
("celebration copy calms down", per the plan's action body). **No letter-case changes** — sentence
case is 98-08's bounded clause per D-20, and changing case here would poach its population. The one
exception is #20, where removing "Let's" forced me to re-author the whole string; I wrote the
remainder in sentence case under the UI-SPEC's copywriting contract, and name it here rather than
let it look like drift.

---

## 5. Greens — every one tagged with locale and role

**Role: `admin`** (`TEST_USER_EMAIL`) for every rendered leg, inline login, `--no-deps`
(`E2ECRED-01` → P101 means no storage-state fixture is usable). Project `chromium-en`;
the `ar` leg is the `?lng=ar` URL flip **inside** `chromium-en` (there is no `chromium-ar`).
`--workers=1`. One spec path per invocation — D-09, paths are FILTERS.

### `98-copy03-dashboard.spec.ts` — the `[V]` item's rendered closure

| leg                                           | locale  | role  | RED @ `13d5094ea`                                                                                   | post-repair                                                                                                           |
| --------------------------------------------- | ------- | ----- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| digest EMPTY, CDP-forced                      | en + ar | admin | FAIL @ `:128` — rendered `Intelligence Digest…` with the seed copy                                  | **PASS**                                                                                                              |
| digest ERROR, CDP-forced at the network layer | en + ar | admin | FAIL @ `:157` — rendered `Digest could not load. Check the staging seed and try again.`             | **copy assertion PASSES every run**; the leg is **FLAKY on the spec's own force-verification assertion** — see §7 E-B |
| VIP EMPTY, route-fulfilled `[]`               | en + ar | admin | FAIL @ `:196` — rendered `Add VIP participant data to the dashboard seed, then refresh the widget.` | **PASS**                                                                                                              |

**The forced empty/error/VIP-empty digest states are the rendered evidence** for COPY-03 — not a
grep. Each red quotes the defect string it exists to detect.

**I am NOT claiming a stable copy03 green.** Full-file runs: **run 1 = 3 passed RC=0; run 2 = 1
failed; run 3 = 1 failed**; isolation (`--grep "ERROR state"`) = **1 passed RC=0**. On a failing run
the loop dies during the `en` iteration, so **the `ar` leg of the forced error state is never
reached** — I do not claim an `ar` green on that one leg.

### `98-copy04-voice.spec.ts --grep @values`

| leg                                   | locale      | role  | RED @ `13d5094ea`                                           | GREEN @ `34453e809` |
| ------------------------------------- | ----------- | ----- | ----------------------------------------------------------- | ------------------- |
| EO CTA sentence case                  | **en + ar** | admin | **FAIL** — `Add Elected Official` vs `Add elected official` | **PASS**            |
| glossary `Deadline` on `/commitments` | en + ar     | admin | **PASSED at HEAD**                                          | PASS                |
| no `!` reaches the screen as copy     | en          | admin | **PASSED at HEAD**                                          | PASS                |

**Two of these three legs are NON-DISCRIMINATORS and I will not present them as evidence.** They
passed _before_ my repair, exactly as `98-RED-BASELINE.md` recorded. Only the EO CTA leg discriminates.
The exclamation and retired-term clauses therefore close on the **drilled walker + bundle oracle**
(§3), not on this spec. `@case` remains **RED — expected, 98-08's business** (D-20); I did not chase it.

**`pnpm type-check`** (D-19: `type-check`, never `typecheck`) — **RC=0**. Meaningful here beyond
routine: it proves no code referenced the deleted `deadlineReminder` key path. Caveat: it ran over a
tree that also held 98-05's work, so the green is not solely attributable to my diff.

**`prettier --check`** over my 72 files — **RC=0**, "All matched files use Prettier code style!"

---

## 6. Commits — verified, with nothing swept in

**One commit: `a9d2414a5`** — _"fix(98-06): the voice-value lane — seed instructions, retired terms,
exclamations, first person, both locales"_.

```
72 files changed, 124 insertions(+), 132 deletions(-)
```

122 value edits + the 2 key-family deletions, across **37 namespaces**, EN and AR in the **same
commit** (D-16). EN/AR key parity across all 37: **0 breaks** — the deletion is symmetric.

**Verification, both directions (not just a file count):**

- `git show --name-only HEAD` vs my authored list: **in-commit-but-not-mine = EMPTY**;
  **mine-but-not-in-commit = EMPTY**. 72 = 72.
- Committed with `xargs -0 git commit -F <msgfile> --` over an explicit 72-path list generated from
  my own edit table — **never** from `git status`, **never** `git add -A`, **never** `git commit -a`.
  (zsh does **not** word-split unquoted `$(...)`, so the NUL-delimited form is deliberate.)
- **Exogenous paths: untouched.** `CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`, `.agents/skills/*`,
  `.claude/skills/*`, `_archive-98-attempt1-260818/` are still dirty and unstaged, exactly as
  dispatched.
- **`stash@{0}` intact** — still `attempt-1 P98 planning edits`, never read, never popped. The
  commit hook (lint-staged) created its own backup `aae5710e8` and **dropped it cleanly**;
  `stash@{1}` is a **pre-existing Phase-94 leftover** (`WorkBoard.tsx`), verified by content, **not**
  produced by my commit.
- **Sibling-owned paths: zero.** No `common.json`, no `dossier.json`, no `intelligence-signals.json`,
  no `engagements.json`, no TSX.

**Concurrency, handled and survived.** 98-05 wrote the same tree throughout and committed three
times around me (`a0de9a1a7`, `fe1b7ba00`, → `34453e809`). Before editing any JSON pair outside my
plan's declared `files_modified`, I cross-checked its namespace against 98-05's declared list **and**
its closed reservation: its surfaces resolve to `engagements`, `list-pages`, `dossier-overview`,
`graph`, `intelligence-*` and bare-`useTranslation()` `common` — **note its two graph components use
namespace `graph`, NOT `relationships`**, which was the one collision I expected and had to disprove
by reading the source. Intersection with my 17 undeclared first-person files: **empty**. My 72 files
are unchanged by all three of its commits (`git diff a9d2414a5..HEAD -- <my 72>` = 0).

---

## 7. Plan defects and criteria-vs-prose collisions

### Escalated, awaiting ruling — I closed neither

Full detail: **`.tickmarkr/overseer/P98A2-EXEC-W3-ESCALATION-98-06.md`**.

- **E-A — the retired-terminology population is narrower than its criterion.** 3 `Due Date`
  occurrences survive in the shipped bundle as **hardcoded bilingual TSX/TS literals**:
  `CommitmentsHelpPage.tsx:151` and `:289` (a **routed** page —
  `routes/_protected/help/commitments.tsx:5`) and `useExportData.ts:341` (CSV column header). Both
  locales; the AR side says the retired `تاريخ الاستحقاق`, so `/help/commitments` now contradicts
  the rest of the product in both languages. Per `RULING-P98A2-09` this is a **PLAN defect** — my
  population is "the token that usually implements it", the criterion is the behaviour. **Not edited.**
- **E-B — `98-copy03-dashboard.spec.ts:170` is a pre-existing order-dependent flake** my repair
  merely _exposed_: at HEAD the test always died earlier at `:157`, so `:170` had **never once been
  reached, let alone observed passing**. The spec file is outside my `files_modified`. **Not edited.**
- **E-C — the boundary is systematic.** Having found E-A, I applied the same test to my other two
  clauses rather than assuming them safe. Both have TSX members, in two classes I keep separate:
  **`t()` default-value masks** for keys I just repaired (`CommentList.tsx:131`,
  `BriefGenerationPanel.tsx:310-311`, `WGMemberSuggestions.tsx:262`, `OnboardingTourTrigger.tsx:203,210`,
  `DuplicateComparison.tsx:158`) — **explicitly P99's** per 98-CONTEXT, recorded not repaired; and
  **hardcoded bilingual copy with no `t()` and no key at all** (`CommitmentsHelpPage.tsx:381/409/497-498`,
  `HelpPage.tsx:166`, `useBriefingBooks.ts:164-165` `message_en`/`message_ar`,
  `PositionTrackerCard.tsx:93`). The copy04 `@values` exclamation leg is **structurally blind** to the
  second class: it gates on `bundleValues.has(text)`, and a hardcoded literal is never a bundle value.

### Criteria-vs-prose collisions (`RULING-P98A2-07` — proceeded under the criterion, recorded here)

1. **Task 1's action body specifies `/\bseed(ed)?\b|\bstaging\b|test data|migration/i`; its
   acceptance criterion's python omits `migration`.** I proceeded under the criterion **and** ran the
   wider action-body pattern anyway as a check — **both return the same 4**, so the collision is
   immaterial in outcome. Recorded because it would not have been immaterial if a value had mentioned
   a migration.
2. **Task 3's action body says "expect ~31 EN / ~30 AR"; the derived truth at my HEAD is 30 / 29**
   (§P3). D-04 governs; the criterion's post-repair **1/1 floor** is what I satisfied, and the prose
   figure yields.
3. **The plan's interfaces block asserts 7 retired-term values; 5 exist at my HEAD.** Not a defect —
   this is the cross-lane check working as designed, recorded so the difference is not read as a miss.
4. **The plan predicts "banned-file handoff lines — expected outcome: none."** Actual outcome: **one**
   (`dossier:overview.positions.ourStance`, §4).

---

## 8. My own weakest point — the claim I would attack first

**It is §3b's headline: "exclamation leaf values total exactly 1 EN / 1 AR."**

That sentence is **true, proven, and controlled** — and it is true about
`frontend/src/i18n/**/*.json`, which is _not the same set as "what a user can read."_ I proved a
number about the population my plan named, and criterion 4 is written about a behaviour. E-C shows
the gap is real and populated, in both locales.

I would attack it first for three reasons. It is the claim most likely to be quoted as a headline
figure and read as a rendered-surface fact. Its rendered oracle — copy04's `@values` exclamation leg
— is **structurally incapable of contradicting it**, so a green there feels like corroboration and
is not. And it was already green at HEAD before I touched anything, so it never discriminated at all.
The same attack lands on "zero product-speaker members remain" for identical reasons.

**The reason I caught it is worth recording, because it was luck plus one habit.** The luck: the
overseer's ruled bundle-grep oracle for a _different_ clause looks at the shipped bundle rather than
at my source population, and it returned a `Due Date` hit _after_ my i18n zero was already proven.
The habit: I did not explain that hit away — I re-derived without the quote anchoring that had hidden
the third member, and then applied the same test to the two clauses I had **not** been forced to
doubt. **Had the chip clause not been ruled into the Q5 form, nothing in my plan would have looked
outside i18n JSON, and all three clauses would have shipped a true number about the wrong set** —
the phase's ~15-times failure pattern, one more time.

Second-weakest: the two AR pairs at §4 #1/#13 I reviewed and deliberately left unchanged. Defensible
under D-16 (which mandates review, not churn), but it is a judgment call a grader could reverse, and
it leaves a small EN/AR register drift I chose not to close.

Third: **I have not driven `/help/commitments` in a browser.** E-A's and E-C's render claims rest on
the routed-component chain plus bundle bytes — strong, but not an observed screenshot, and I say so
rather than let "renders" imply I watched it.

---

## 9. Operator parks — untouched, not closed by me

**Arabic naturalness** (I authored ~35 AR values this commit; pronouncing them natural is the
operator's, not mine), **pixel RTL**, **`/calendar` baseline**, **`E2ECRED-01`**. All remain parked.
No human checkpoint was auto-answered; none was presented.

SUMMARY-END
