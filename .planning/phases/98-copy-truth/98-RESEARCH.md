# Phase 98: Copy Truth - Research

**Researched:** 2026-08-18
**Domain:** UI copy repair — i18n key resolution, display-label routing, date-format unification, voice rules — in a React 19 + i18next (static-bundled) + TanStack Query frontend
**Confidence:** HIGH (every claim below was derived on the working tree at branch `milestone/v10.0-trust`, HEAD `89c18f3fe`, on 2026-08-18, unless tagged otherwise)

<user_constraints>

## User Constraints (from CONTEXT.md)

Transcribed from `.planning/phases/98-copy-truth/98-CONTEXT.md` (source: `RULING-P98A2-01-SCOPE` + commit `98824ca77`). The full file is binding; the decision list is reproduced here verbatim in substance.

### Locked Decisions

- **D-01:** The phase closes 8 requirements — `COPY-01`…`COPY-08`, each mapped in plan frontmatter to the success criterion it serves, re-derivable by command against the register (rows 742–749; definitions `REQUIREMENTS.md:149-183`). A silent drop of any requirement is a REJECT.
- **D-02:** The register is the queue; the ROADMAP entry is its digest. They agree at `98824ca77`. The plan re-derives the mapping by command and states the match.
- **D-03:** Out-of-phase surfaces are named, not assumed — the OUT list in the CONTEXT Phase Boundary is the record (`GUIDE-HOLLOW-01`→P102; per-mutation success copy; `NAV-01` never edited; Arabic naturalness/pixel RTL→P99; P99 `AR-04a` interaction recorded not pre-empted).
- **D-04:** Populations are RE-DERIVED, never re-quoted. Only `COPY-03` carries `[V]`. Every other number (46 exclamations, 8 first-person, seven date formats, five `entityLinks.*` keys) is an unverified audit figure. A plan that quotes an old count as truth fails grading.
- **D-05:** State what falls OUTSIDE each population — namespaces, globs, locales, whether inline defaults and non-`t()` literals are in or out.
- **D-06:** The repo `grep` wrapper honors `.gitignore`. Instrument-test every zero: show the same instrument returning non-zero on a known-present case.
- **D-07:** Every criterion closes on a rendered surface or a drilled instrument — never a source-text grep alone; every green states its locale and role.
- **D-08:** A criterion no oracle names fails grading. Seven criteria; each needs a named oracle in the plan set.
- **D-09:** Playwright spec paths are FILTERS — assert file existence first; hardcode the expected count.
- **D-10:** i18n is static-bundled in `frontend/src/i18n/index.ts`; `public/locales` is dead. Unregistered namespace → inline English default in BOTH languages. Dot-form `t()` leaks raw keys; colon namespaces are correct. Any new namespace lands registered, in both locales, same commit.
- **D-11 (criterion 6, COPY-06):** The default mutation success toast is produced via `t()` and renders localized in both locales on a real mutation; the hardcoded `toast.success('Operation completed successfully')` in `frontend/src/lib/query-client.ts` is gone. Generic-but-localized is the accepted end state.
- **D-12 (criterion 7, COPY-08):** The five EO keys (`dossier:typeDescription.elected_official` + `typeGuide.elected_official.{whenToUse,examples,commonLinks,notFor}`) AND deletion of the `type !== 'elected_official' &&` guard in `DossierTypeStatsCard.tsx` land in the SAME change or not at all. Closes on the rendered popover, both locales, no raw key, no empty section.
- **D-13 (criterion 1, COPY-07):** The hardcoded `"% of total active dossiers"` in `DossierTypeStatsCard.tsx` is routed through `t()`; closes on the rendered card in both locales. The string is the anchor, not the line number.
- **D-14 (criterion 4, named instance):** `elected-officials:list.add` = `"Add Elected Official"` is Title Case in `en` (`ar` is fine) and sits inside COPY-04's sentence-case population. No register row of its own.
- **D-15:** Task file-scope caps from P88/P89 — roughly ≤10 files and ≤120 lines per task diff where feasible.
- **D-16:** Both locales, same commit. A one-locale key change is a REJECT.
- **D-17:** Never write file content through shell-embedded `node -e`. Use editor tools.
- **D-18:** Absolute paths in every command.
- **D-19:** The workspace package is `intake-frontend`. `pnpm --filter frontend` matches ZERO projects and exits 0. The typecheck script is `type-check`.

### Claude's Discretion

Mechanism for each repair (label map vs namespace key for COPY-01; how dev affordances are gated out of a production build for COPY-05); task decomposition and wave structure; which surfaces are drilled and how; the shape of each population's derivation command. **Not discretion:** anything D-11…D-14 decided, and anything in the OUT list.

### Deferred Ideas (OUT OF SCOPE)

- Per-mutation success copy beyond generic-but-localized (`RULING-P98A2-01-SCOPE` F1-b).
- The seven sibling types' guide bodies — `GUIDE-HOLLOW-01`, Phase 102.
- Arabic naturalness, the single-term glossary, pixel RTL — Phase 99.

**Working-tree paths out of every plan's file scope** (exogenous, harness-owned): `CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`, `.agents/skills/*`, `.claude/skills/*`, `.planning/phases/_archive-98-attempt1-260818/`.
</user_constraints>

<phase_requirements>

## Phase Requirements

Register rows 742–749 (`.planning/REQUIREMENTS.md`), all eight `Pending`, all owned by Phase 98. Re-derivation command (run at plan time and state the match):

```bash
command grep -n "^| COPY-0[1-8] " /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/REQUIREMENTS.md
```

| ID      | Description (short)                                              | Criterion | Research Support                                                                                                                                                                |
| ------- | ---------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COPY-01 | No DB value shown as user copy                                   | 1         | §C1 — raw-render sites found (`SignalRow.tsx:84`, `EngagementsList.tsx:145`, 16 `.replace(/_/g,' ')` sites); reusable mechanism = enum-keyed `t()` families                     |
| COPY-02 | No raw i18n key reaches the screen                               | 2         | §C2 — four distinct leak mechanisms named; `entityLinks` family (~80 keys) is the bulk; runtime missing-key console detector exists                                             |
| COPY-03 | No seed/test instruction as user copy                            | 3         | §C3 — the 4 `[V]` strings shown in both locales; repo-wide sibling sweep returns exactly those 4 in EN                                                                          |
| COPY-04 | Voice rules (sentence case, no `!`, no we/our, no retired terms) | 4         | §C4 — populations derived: 31 EN / 30 AR exclamations, 30 first-person candidates, 7 "Due Date" values, Title-Case scope hazard flagged                                         |
| COPY-05 | One date format; dev affordances out of prod builds              | 5         | §C5 — `format-date.ts` confirmed canonical; residual population = classes the existing lint check does not cover; fillMock already DEV-gated but its string ships in the bundle |
| COPY-06 | Global mutation toast localized                                  | 6         | §C6 — mechanism proven three lines up in the same file (`onError` uses `i18n.t('common:…')`)                                                                                    |
| COPY-07 | Stats-card hardcoded English label                               | 1         | §C1a — string found at `DossierTypeStatsCard.tsx:228`                                                                                                                           |
| COPY-08 | EO popover: 5 keys + guard, atomic                               | 7         | §C7 — key absence re-verified in both locales; guard at `DossierTypeStatsCard.tsx:168`; no-default `t()` at `DossierTypeGuide.tsx:175,208` re-verified                          |

</phase_requirements>

## Summary

Phase 98 is a copy-repair phase over an already-rendering app. The research verdict: **every criterion has an existing mechanism to reuse — nothing needs inventing.** The i18n singleton (`import i18n from '@/i18n'`; `i18n.t('ns:key')`) already localizes the sibling `onError` toast in the very file COPY-06 targets. Enum display labels already flow through enum-keyed `t()` families (`t(\`status.${task.status}\`)`) in the well-behaved components — COPY-01 is routing stragglers onto that pattern. The one date formatter exists, matches the contract byte-for-byte, and has a CI guard (`scripts/check-date-formatting.mjs`, wired into `pnpm lint`) with a built-in fixture self-test — COPY-05 is extending that guard's coverage and routing ~30 residual call sites. The Playwright harness (repo-root `tests/e2e/`, phase-numbered specs, inline auth, `?lng=ar` locale flip) is proven across Phases 93–97.

Three findings change the planner's picture versus the audit figures. (1) **`entityLinks.*` is not five keys — it is a family of ~80 distinct key paths** used across 6 components + 2 hooks, all under bare `useTranslation()`, with no `entityLinks` subtree in any bundle: the whole entity-links surface (rendered on the intake ticket detail page) leaks raw keys. (2) **Exclamation marks derive to 31 EN / 30 AR strings, not 46**; first-person derives to ~30 raw candidates, not 8, and needs a product-as-speaker triage rule. (3) **The Title-Case population is ~4,400 strings by any honest heuristic** — closing "sentence case everywhere" inside this phase's task caps is not achievable, and the plan must put a bounded population in front of the overseer rather than silently narrowing (§Open Questions Q1 — this is the phase's hardest criterion).

**Primary recommendation:** plan seven small mechanical repairs that reuse existing mechanisms, plus one instrument-extension lane (date guard + raw-key DOM detector), and close each criterion with a `98-*.spec.ts` rendered-surface oracle under `admin · en + ar(?lng=ar) · desktop` — the same shape Phase 96 proved.

## Architectural Responsibility Map

| Capability                         | Primary Tier                                         | Secondary Tier                                 | Rationale                                                                                      |
| ---------------------------------- | ---------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Display-label mapping (COPY-01/07) | Browser/Client (React + i18n bundles)                | —                                              | Labels are render-time lookups; DB keeps raw enum values (carve-outs: columns are NOT renamed) |
| Raw-key resolution (COPY-02)       | Browser/Client (i18n bundles + components)           | —                                              | Static bundle in `src/i18n/index.ts`; no server involvement                                    |
| Seed-string rewrite (COPY-03)      | Browser/Client (JSON bundles)                        | —                                              | Pure copy change, both locales                                                                 |
| Voice rules (COPY-04)              | Browser/Client (JSON bundles)                        | —                                              | String values only                                                                             |
| Date formatting (COPY-05)          | Browser/Client (`lib/format-date.ts`)                | Build pipeline (Vite DCE for dev affordances)  | Formatter is client-side; "absent from a production build" is a build-artifact claim           |
| Mutation toast (COPY-06)           | Browser/Client (`lib/query-client.ts` module scope)  | —                                              | Non-React module; uses the i18n singleton, not a hook                                          |
| EO popover (COPY-08)               | Browser/Client (component + bundles)                 | —                                              | Guard deletion + key authoring, one render surface                                             |
| Oracles                            | E2E harness (`tests/e2e/` + Playwright at repo root) | Node scripts in `scripts/` (lint-wired guards) | Rendered-surface closure per D-07; scripts are finders/gates, not closers                      |

## Standard Stack

**No new libraries. No new packages are installed by this phase.** Everything reuses what is present in `frontend/package.json` at HEAD:

### Core (all already installed — reuse, do not add)

| Library                  | Purpose in this phase                                                   | Evidence                                                                          |
| ------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| i18next + react-i18next  | All key authoring/routing; the `@/i18n` singleton for non-React modules | `frontend/src/i18n/index.ts`; `query-client.ts:15,65` already imports and uses it |
| sonner                   | The toast COPY-06 edits                                                 | `query-client.ts:14`                                                              |
| @tanstack/react-query v5 | The `mutations.onSuccess` default                                       | `query-client.ts:56-73`                                                           |
| date-fns                 | Existing date lib; residual patterns to re-route                        | 80 importer files (derived)                                                       |
| @playwright/test         | All rendered-surface oracles                                            | repo-root `playwright.config.ts`, `tests/e2e/`                                    |
| Node builtin scripts     | Guard extensions                                                        | `scripts/check-date-formatting.mjs` etc. are dependency-free by design            |

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** All work is copy, key authoring, call-site routing, and Playwright specs against already-installed dependencies. slopcheck was not run because there is nothing to check; if a plan later introduces an install, it must run the Package Legitimacy Gate first.

---

# Per-Criterion Findings

Every command below: (a) uses absolute paths (D-18), (b) uses `command grep` or `python3` to bypass the ugrep-wrapper `.gitignore` blindness (D-06), and (c) names its known-present control so a zero is provable. `SRC=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src` is written out in full in each command.

## C1 — Criterion 1 / COPY-01 + COPY-07: DB values as copy

### The reusable mechanism (do not invent a new one)

The house pattern is **enum-keyed i18n lookup, per namespace** — the enum value is the key segment:

```tsx
// frontend/src/components/tasks/TaskCard.tsx:51-54 (existing, correct)
{
  t(`priority.${task.priority}`, task.priority)
}
{
  t(`status.${task.status}`, task.status)
}
// frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx:144-158
{
  t(`priority.${item.priority}`)
}
{
  t(`workItemSource.${item.source}`)
}
{
  t(`workItemStatus.${item.status}`)
}
```

There is **no central label map and no localizing StatusBadge component** (`GenericListPage.tsx`'s `statusLabel` is a caller-supplied prop, `GenericListPage.tsx:9,122`). New COPY-01 work routes each raw render onto an enum-keyed family in the surface's own namespace (or `common` where the enum is cross-cutting), both locales, same commit. [VERIFIED: repo derivation 2026-08-18]

Note the raw-value default (`t(key, task.priority)`) is itself a P99 `AR-04a` silent-mask — record the interaction where touched; do not pre-empt P99's sweep (CONTEXT Phase Boundary).

### Named instances located

| Criterion value                                       | Where it renders raw                                                                                                                                                                                                                                                                                                                                                                | Fix class                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `human_entered`                                       | `frontend/src/components/signals/SignalRow.tsx:84` — `<span className="font-mono">{signal.source_type}</span>`                                                                                                                                                                                                                                                                      | route through `t('signals:sourceType.' + value)`-style family                                     |
| `WEEK OF 2026-W27`                                    | `frontend/src/components/list-page/EngagementsList.tsx:142,145` — `t('week.of', { defaultValue: 'Week of' }) + ' ' + group.key` where `group.key` is the ISO token from `lib/date/getISOWeek.ts`                                                                                                                                                                                    | format the group key as a date range / day-first date via `format-date.ts` (also a C5 touchpoint) |
| `in_progress` / `follow_up` / `email` / `action_item` | not pinned to single sites by this research — they are members of the derived population below (e.g. `{entity.status}` at `frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:276`, `{assignment.priority}` at `components/assignments/KanbanTaskCard.tsx:69`, `{activity.status}` at `components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx:221`) | same enum-keyed routing                                                                           |
| `"% of total active dossiers"` (COPY-07)              | `frontend/src/components/dossier/DossierTypeStatsCard.tsx:228` (string is the anchor per D-13)                                                                                                                                                                                                                                                                                      | `t('dossier:…')` key in both locales; closes on rendered card                                     |

### Population definition + derivation

**Population:** JSX text-position renders of enum-typed member expressions, plus `.replace(/_/g, ' ')` de-snaking hacks, in `frontend/src/{components,pages,routes}/**/*.tsx`, both locales' render being identical (raw values are locale-invariant).

```bash
# Part A — direct renders of enum-ish fields (finder; triage out prop-position matches):
command grep -rnE "\{[a-zA-Z_.]+\.(status|workflow_stage|tracking_type|priority|source_type|request_type|urgency|channel|stage)\}" \
  /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src --include="*.tsx" | command grep -v "t(\`\|test"
# Part B — de-snaking hacks:
command grep -rn "replace(/_/g, ' ')\|replace('_', ' ')" \
  /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src --include="*.tsx" | command grep -v test
```

Derived 2026-08-18: Part A ≈ 16 lines of which ~5 are true text-position renders after triage (prop-position matches like `status={state.status}` are OUT — a prop is not copy until some component renders it; the component it feeds is then the population member). Part B = **16 sites** (list captured in research log; includes `TaskDetail.tsx:261`, `MiniRelationshipGraph.tsx:266,374`, `EnhancedGraphVisualization.tsx:623,808`, five intelligence dashboards). Counts are FINDINGS to re-derive at plan time, not quotas.

**Outside the population (state in the plan):** prop-position expressions; `__tests__/**`; values already inside `t()` with the value as defaultValue (they are the P99 mask class, not this criterion — unless the key is missing, which makes them C2 members); free-text fields that happen to hold snake-ish text (e.g. intelligence `{source.source}` may be a human-entered source name — triage each); DB **column names** (the CLAUDE.md carve-outs: `intake_tickets.urgency` legitimately uses `critical`, `aa_commitments` uses `due_date`/`owner_*`, `tasks` uses `sla_deadline`/`workflow_stage` — criterion 1 maps values to labels, it does NOT rename columns).

**Instrument self-test:** Part A must return the known-present `SignalRow.tsx:84` line; Part B must return `TaskDetail.tsx:261`. After repair, re-run and require those exact controls to be gone while a deliberately-planted fixture line (in a scratch file, not committed) still matches.

### Closing oracle (C1 + COPY-07)

**Rendered-surface DOM detector, `98-copy01-labels.spec.ts`:** navigate the repaired surfaces (signals list, engagements list, my-work/kanban, waiting-queue detail, dossier hub) under `admin · en` and `admin · ?lng=ar` at desktop viewport; collect `document.body.innerText`; assert **zero matches** of `/\b[a-z]+(?:_[a-z]+)+\b/` (snake_case token) and `/\b\d{4}-W\d{2}\b/` (ISO week token) in visible text. Self-drill: the spec must first run against a synthetic fixture page (or pre-fix commit) proving the regex fires on `human_entered`. For COPY-07 specifically: assert the stats card's percentage label equals the EN string under `en` AND the AR string under `?lng=ar`, and never equals `% of total active dossiers` under `ar`. Locale: both. Role: admin (TEST_USER_EMAIL — the only behaviourally-provable role; state the bound as P97 did).

**Exclusions the oracle states:** email addresses and code/mono ID chips that legitimately carry underscores — scope the innerText scan to the asserted regions or subtract elements marked `data-testid` for raw-id display if triage finds any.

## C2 — Criterion 2 / COPY-02: raw i18n keys on screen

### The four distinct leak mechanisms (one instrument cannot catch all)

1. **Whole key family absent from every bundle.** `entityLinks.*`: 6 components (`frontend/src/components/entity-links/*.tsx`) + 2 hooks (`hooks/useEntityLinks.ts`, `hooks/useAiSuggestions.ts`) all call bare `useTranslation()` (defaultNS = `translation`, which `frontend/src/i18n/index.ts:274/410` aliases to **common.json**) and reference **~80 distinct static `entityLinks.*` key paths plus 2 dynamic families** (`entityLinks.linkTypes.${…}`, `entityLinks.entityTypes.${…}`). No `en/*.json` bundle contains an `entityLinks` subtree (`command grep -l '"entityLinks"' …/i18n/en/*.json` → empty; control: the same command with `"afterActions"` returns common.json). Every one of these renders as a raw key today. Surface: `pages/TicketDetail.tsx` (intake ticket detail) + `components/ai/EntityLinkSuggestions.tsx`. **The audit's "five entityLinks.\* keys" is what one screen showed; the derived population is ~80.** The sibling `en/entity-linking.json` namespace exists but serves a different component family with different key shapes — do not conflate them. [VERIFIED: derivation 2026-08-18]
2. **Dynamic key from a data value whose casing/spelling misses the bundle.** `regions.Europe`: `frontend/src/components/dossier/wizard/steps/CountryDetailsStep.tsx:99` and `review/CountryReviewStep.tsx:34` build `t(\`form-wizard:regions.${region}\`)`, but `form-wizard.json` `regions` keys are lowercase (`europe`, `asia`, …). A capitalized data value (`Europe`) misses → raw key. Fix class: normalize the lookup (`region.toLowerCase()`) or key the bundle by the actual value domain.
3. **Missing key, no default.** `t(\`typeDescription.${type}\`)`at`DossierTypeGuide.tsx:175,208`— proven live by Phase 97 for`elected_official` (this is COPY-08's mechanism, criterion 7).
4. **Silent-default masking — the class a raw-key detector CANNOT see.** `DossierTypeGuide.tsx:162,165` (`t(key, '')`) and the `Array.isArray`/`length > 0` guards at `:224,241` swallow misses invisibly (the GUIDE-HOLLOW-01 proof). Also `t('typeGuide.learnMore', 'Learn more…')` (`DossierTypeStatsCard.tsx:184`, `DossierTypeGuide.tsx:324`) renders its inline English default in BOTH locales. **This class is P99 `AR-04a`'s** — criterion 2 covers keys that REACH the screen raw; where Phase 98 touches such a site it records the interaction (D-03), it does not sweep the class.

**Instances that already resolve (report, don't repair):** `common.loading` dot-form at `auth/{Login,Register,ResetPassword}Page.tsx` etc. resolves TODAY because defaultNS is the common.json alias and common.json has a nested `common.loading = 'Loading...'` (`en/common.json`, verified). `common:afterActions.loadError` resolves (`loadError` present in the `afterActions` subtree of common.json). The plan's oracle proves them resolved rather than assuming; no edit needed unless the audit meant a different call site the derivation should catch. **`CALENDAR.RECURRENCE.TITLE` is NOT reproducible at HEAD** — `command grep -rn "CALENDAR.RECURRENCE" frontend backend supabase --include=*.{ts,tsx,json}` returns zero (control: the same instrument finds `entityLinks.linkTypes` in LinkTypeBadge). It likely came from the 2026-08-15 live audit against an older build. Report both: the named instance is gone; the class is covered by the oracle.

### Population definition + derivation

**Population:** static `t()` keys referenced in `frontend/src/**/*.{ts,tsx}` that resolve to no key path in the call site's effective namespace in `frontend/src/i18n/en/` (EN is sufficient: EN/AR parity is a separate check), plus the two dynamic-key families whose value domains are enumerable (`linkTypes`, `entityTypes`, `regions`).

```bash
# The namespace-aware finder already exists — run it and read the unresolved list:
node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/scripts/i18n-mask-audit.mjs
```

`scripts/i18n-mask-audit.mjs` models per-file `useTranslation('ns')` defaults and colon-form namespaces (header comment, verified) — extend rather than rewrite if it needs to also report no-default missing keys. **Outside the population:** dynamic template keys with un-enumerable domains (report count, close via rendered oracle); `__tests__/**`; backend; dead `public/locales`; the silent-default mask class (P99, above).

**Instrument self-test:** the finder must list `entityLinks.title` as unresolved at HEAD (known-present). After the fix, the same run shows it resolved while a planted bogus `t('zz.nope')` fixture still reports.

### Repair recommendation (planner's discretion, D-04 mechanism choice)

Merge an `entityLinks` subtree into **common.json (both locales, same commit)** — zero component edits, because defaultNS already points there; the ~80 keys × 2 locales will exceed one task's ~120-line cap, so split by subtree (`aiSuggestions.*` ≈ 22 keys is a natural second task). Alternative (new registered `entity-links` namespace + 8 `useTranslation('entity-links')` edits) touches 8 code files for no user-visible gain — dispreferred.

### Closing oracle

`98-copy02-rawkeys.spec.ts`: (a) **runtime missing-key capture** — `frontend/src/i18n/index.ts:577` logs `Missing translation key: ${key} for language: ${lng}` via console.warn; the spec listens for console warnings while driving the repaired surfaces (TicketDetail with the link manager open; country wizard step with a capitalized region; the auth loading states) and asserts zero missing-key warnings; (b) **DOM raw-key detector** — assert visible text contains no `/\b[a-zA-Z]+\.[a-zA-Z]+(\.[a-zA-Z]+)+\b/` token that matches a known namespace prefix (`entityLinks.`, `regions.`, `typeGuide.`, `typeDescription.`). Both locales (`en`, `?lng=ar`), admin role. Self-drill: run the console listener against HEAD~ (pre-fix) or a fixture that calls `t('entityLinks.title')` and show it fires.

## C3 — Criterion 3 / COPY-03: seed/test instructions as copy `[V]`

The one `[V]` item. The 4 strings, shown (both locales, 8 values to rewrite — same 4 key paths):

| Key (dashboard-widgets) | EN                                                                         | AR                                                                              |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `digest.empty.heading`  | `Digest is ready for seeded publications.`                                 | `الموجز جاهز للمنشورات المزروعة.`                                               |
| `digest.empty.body`     | `Apply the dashboard demo seed, then refresh the digest.`                  | `طبّق بيانات لوحة التحكم التجريبية، ثم حدّث الموجز.`                            |
| `digest.error`          | `Digest could not load. Check the staging seed and try again.`             | `تعذر تحميل الموجز. تحقق من بيانات الاختبار ثم أعد المحاولة.`                   |
| `vip.empty.body`        | `Add VIP participant data to the dashboard seed, then refresh the widget.` | `أضف بيانات المشاركين من كبار الشخصيات إلى بيانات لوحة التحكم، ثم حدّث العنصر.` |

**Sibling sweep (derived 2026-08-18):** a repo-wide value scan of ALL 129 EN namespaces for `\bseed(ed)?\b|\bstaging\b|test data|migration` returns **exactly these 4** — no siblings elsewhere. (Instrument self-test: the sweep's own 4 hits are its known-present control.) `sample-data:firstRun.adminBody` ("We can populate your database with a curated GASTAT scenario…") is a **product first-run feature**, not a seed instruction to the user — outside this class (it IS a C4 first-person member). **Exclusions:** key NAMES, code comments, `.planning/`, tests.

**Rewrite guidance:** replacements must be truthful empty/error copy in the project voice (sentence case, no imperative dev instructions, no "seed"/"staging"): e.g. EN `digest.empty.*` → a plain "No publications yet." shape. Voice rules of CLAUDE.md apply; Arabic mirrors meaning (naturalness judged in P99).

**Closing oracle:** `98-copy03-dashboard.spec.ts` — force the digest widget's empty and error states (CDP `Network.setBlockedURLs` on the digest request only — the Phase 96 narrow-pattern lesson: block the API call, never the SPA module) and the VIP empty state; assert the rendered strings match the NEW values and match `/seed|staging|test data/i` in NEITHER locale. Both locales, admin.

## C4 — Criterion 4 / COPY-04: voice rules

Four sub-populations, each with its own definition. All derived over **string VALUES in `frontend/src/i18n/{en,ar}/*.json`** (not key names). Outside all four: key names, code comments, `__tests__`, `public/locales` (dead), `.tsx` hardcoded literals except where a criterion instance names one (a hardcoded-JSX `!` sweep found the only user-visible one inside the DEV-gated mock block — dev-only, excluded).

### 4a. Exclamation marks — measured 31 EN / 30 AR (audit said 46 — measured differently, report both)

```bash
python3 - << 'EOF'
import json, glob, os
for loc in ('en','ar'):
    n=0
    for f in glob.glob(f'/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/i18n/{loc}/*.json'):
        def walk(o):
            global n
            if isinstance(o,dict): [walk(v) for v in o.values()]
            elif isinstance(o,str) and '!' in o: n+=1
        walk(json.load(open(f)))
    print(loc, n)
EOF
```

Definition: leaf string values containing `!`. **One legitimate exclusion:** `validation:password.addSpecial` = `Add special characters (!@#$%^&*)` — the `!` is a charset listing, not voice; state it and keep it (or reorder the charset). Everything else (31−1 EN, 30−1 AR: `onboarding` celebrations, `notification-center`, `ai-brief`, `common:auth.loginSuccess`, full list reproducible by the command) gets the `!` dropped/rephrased, **both locales same commit** (the AR set is 30 because AR copy mirrors the EN exclamations — fix pairs together). Control: the command returns 31/30 at HEAD; after repair it returns 1/1 (the charset exclusions) — a non-zero floor, so the zero-proof trap does not arise.

### 4b. First-person plural — measured ~30 raw candidates (audit said 8 — the definition is the difference)

Same walker with `re.search(r"\b([Ww]e|[Oo]ur|[Ll]et'?s)\b|\bus\b", s)` over EN. **The triage rule the plan must state:** a string is IN the population when the **product is the speaker** ("We found existing contacts…", "Please wait while we…", "Tell us about…", "We'll never share your email", "Sorry to hear that. We'll improve."). OUT: the **user** is the speaker (`ai-chat:suggestion1` = "What are our active commitments?" — a canned user prompt), and **domain terms** (`dossier:overview.positions.ourStance` = "Our Position" — the organization's stance, a noun phrase; flag for the P99 glossary rather than rewrite here if the planner judges it a term). After triage the count lands near the audit's 8–15; let it fall out. AR mirrors per pair.

### 4c. Retired terminology — "Deadline / Due Date" chip + 6 more values

```bash
command grep -rn '"Due Date"\|Deadline / Due' /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/i18n/en/*.json
```

Derived: **7 EN values** — the chip `calendar.json:363` `"title": "Deadline / Due Date"` (the named instance), plus `commitments.json` ×2, `common.json:712`, `dossier.json:962`, `meeting-minutes.json:129`, `working-groups.json:234`, each `"dueDate": "Due Date"`. Glossary term is **Deadline** (CLAUDE.md). **Carve-out discipline:** `aa_commitments.due_date` is a legitimate COLUMN name — only display VALUES change; the JSON key name `dueDate` may stay (renaming keys forces code edits for zero user value; planner's call, but value-only is the ≤120-line-friendly move). AR values pair-updated (the AR word choice is P99's glossary; here it just must not be English).

### 4d. Sentence case — THE SCOPE HAZARD (Open Question Q1)

A conservative heuristic (2–6-word EN values, all significant words capitalized, not ALL-CAPS) returns **~4,471 candidate strings**. That includes proper-noun-like domain terms ("Working Group", "Intake Ticket") and thousands of Title-Case labels ("Activity Feed", "Push Notifications", "Date Range"). "Copy obeys sentence case" as an unbounded rendered-surface claim is **not closable inside D-15's caps in one phase** — repairing even a third of these is thousands of diff lines across 129×2 files, and UPPERCASE carve-outs (ribbons, mono labels, table headers per CLAUDE.md) plus proper-noun judgment make it non-mechanical. The audit's own wording concedes it: "Title Case is currently de-facto." D-14 deliberately named ONE instance (`elected-officials:list.add` = `Add Elected Official`, verified present; `ar` = `إضافة مسؤول منتخب`, fine) and ruled a row-per-string is queue noise. **The plan must propose a bounded population and get the bound blessed by the overseer** (CONTEXT: acceptance-semantics questions go to the overseer). Recommended bound to propose: (a) the named instance, (b) all `*.add`/button-label keys on the eight list pages + primary nav labels + page titles of the routes the phase's oracles already visit — a derivable, visitable set closable on rendered surfaces; the ~4,400-string long tail is filed, not absorbed.

### Closing oracle (C4)

`98-copy04-voice.spec.ts`: rendered assertions on the named/bounded surfaces — the EO list page's add button text equals the new sentence-case EN value (`en`) and the AR value (`?lng=ar`); the calendar chip renders "Deadline"; visible text on the phase's visited surfaces contains no `!` (charset exception excluded by scoping) and none of the triaged product-voice strings. Supplemented by the derivation commands as a lint-style floor (finder, not closer). Both locales, admin. Instrument self-test: each regex shown firing on the pre-fix value first.

## C5 — Criterion 5 / COPY-05: one date format + dev affordances out of prod builds

### The canonical formatter — CONFIRMED

`frontend/src/lib/format-date.ts` (read in full): `formatDayFirst` → `Tue 28 Apr` (en-GB, weekday short, day 2-digit, month short, `Asia/Dubai`); `formatTime` → `14:30 GST` (24h + literal ` GST`); `formatDayFirstYear` → `28 Apr 2026`; `formatDateTime` → composition. Policy D: Latin digits both locales, `_locale` param deliberately inert. **Criterion 5 is a routing problem, confirmed** — CONTEXT's claim verified against the file. `lib/format-locale.ts` is the number/locale-tag helper; `lib/date/` holds only `getISOWeek.ts`. 92 files already import format-date (derived).

### The existing instrument — and exactly what it does NOT cover

`scripts/check-date-formatting.mjs` (read in full; wired into `pnpm lint` via frontend package.json `lint` script, which runs `cd ..` first) checks: raw `.toLocaleDateString(`, raw `.toLocaleTimeString(` not via `toFormatLocale()`, `'ar-SA'` literals, and **month-first date-fns literals only when a literal `MMM+` precedes a literal `d`**. It is **GREEN at HEAD** (run 2026-08-18: `1534 files scanned, 0 sites` — its zero is trustworthy because the script takes a fixture dir CLI arg as a built-in positive-failure self-test, D-06 satisfied by design). The residual population is what escapes its four regexes:

| Escaping class                                                                                                            | Derived at HEAD                                                                                       | Why it escapes                                | Example                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| date-fns **skeleton** patterns `PPP`/`PP`/`PPpp` (render month-first, e.g. `Jul 4, 2026`)                                 | 6 + 2 + 1 call sites                                                                                  | no literal `MMM` token                        | derivation below                                                                                                |
| 12-hour `h:mm a`                                                                                                          | 4 sites                                                                                               | month-first check only looks at M/d order     |                                                                                                                 |
| `formatDistanceToNow`/`formatDistance` (`9 months ago`)                                                                   | **21 files**                                                                                          | different API entirely                        |                                                                                                                 |
| `.toLocaleString(` **on a Date** (`4/30/2026, 12:37:38 PM`)                                                               | 2 confirmed of 46 total `.toLocaleString(` sites (rest are numbers via `toFormatLocale` — legitimate) | script never checks bare `.toLocaleString(`   | `components/collaboration/ConflictResolutionDialog.tsx:179-180`, `components/commitments/StatusTimeline.tsx:52` |
| `Intl.DateTimeFormat` direct                                                                                              | 8 sites (triage: some may be month names for calendar headers)                                        | not checked                                   |                                                                                                                 |
| non-canonical day-first literals (`d MMM` ×5 without weekday, `dd MMM HH:mm`, `HH:mm` w/o GST, `MMMM yyyy` month headers) | ~10 sites                                                                                             | day-first passes the check but ≠ `Tue 28 Apr` | triage: `yyyy-MM-dd` (×5) is `<input type="date">` VALUE plumbing, NOT user copy — excluded                     |

```bash
# Pattern census (control: returns the table above at HEAD):
command grep -rhoE "format\([^,)]+,\s*'[^']+'" /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src \
  --include="*.tsx" --include="*.ts" | command grep -v test | command grep -oE "'[^']+'$" | sort | uniq -c | sort -rn
command grep -rln "formatDistanceToNow\|formatDistance(" /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src \
  --include="*.tsx" --include="*.ts" | command grep -v test
```

**The `9 months ago` decision is IN scope by the criterion's own text** ("the seven competing formats … `9 months ago` … are gone") — 21 files move from relative time to `formatDayFirst`/`formatDateTime`. That is the largest C5 sub-lane; split it by directory to respect D-15. **The plan's gate should EXTEND `check-date-formatting.mjs`** (new checks: `formatDistanceToNow`, `PPP|PP\b|PPpp` literals, `h:mm a`, bare `.toLocaleString(` heuristically flagged for Date-typed receivers via a triaged allowlist) with a fixture proving each new check red — the script's CLI-arg fixture mechanism already exists for exactly this. The extended script is the drilled instrument; the rendered oracle closes.

**Outside the population:** `<input type="date">`/`datetime-local` `value=` plumbing (`yyyy-MM-dd` is a wire format, not copy); `data-day` attr in `components/ui/calendar.tsx` (allowlisted already); number `.toLocaleString` via `toFormatLocale` (policy-correct); test files; `MMMM yyyy` month-nav headers if the planner rules calendar month titles a distinct, sanctioned display class (state the ruling either way).

### Dev affordances absent from a production build

Census of `import.meta.env.DEV` in `frontend/src` (derived): the ONLY user-visible dev affordance is **`Fill with Mock Data`** — `components/intake-form/IntakeForm.tsx:461-482`, already inside `{import.meta.env.DEV && (…)}`. The other DEV usages are logging/error-detail/Sentry (not copy). Three demo routes (`responsive-demo`, `scenario-sandbox`, `modern-nav-standalone`) use `lib/dev-mode-guard.ts` (runtime `redirect` when `VITE_DEV_MODE !== 'true' && !DEV`) — they are runtime-gated, deliberately kept (route-hygiene decision, P95 era), and their code still ships in the bundle; that is the mechanism of record for ROUTES, state it as outside the bundle-byte claim.

**The catch:** the button's JSX is dead-code-eliminated in a production build (Vite statically replaces `import.meta.env.DEV` — documented in-repo at `components/signature-visuals/FullscreenLoader.tsx:39-41`), **but the label string still ships** because `i18n/en/intake.json` (`actions.fillMock` = `Fill with Mock Data`; ar `تعبئة بيانات وهمية`) is statically imported into the bundle. **Recommended mechanism:** delete `actions.fillMock` from BOTH intake.json locales and inline the label as a plain literal inside the DEV-gated block (dev-only copy needs no i18n); the literal is then eliminated with the block.

**Closing oracle (build-artifact, not source):**

```bash
cd /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0 && pnpm --filter intake-frontend build   # D-19: intake-frontend, NEVER 'frontend'
command grep -rc "Fill with Mock Data" /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/dist/assets/ | command grep -v ':0' | wc -l   # expect 0
# POSITIVE CONTROL in the same run (proves the instrument reads the bundle):
command grep -rl "Operation completed successfully\|dossier" /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/dist/assets/ | head -1   # expect ≥1 hit on a known-shipping literal
```

(String literals survive minification; the control makes the zero meaningful.) The rendered half: `98-copy05-dates.spec.ts` asserts repaired surfaces show `/^[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2}$/`-shaped dates and `\d{2}:\d{2} GST` times and NO `/\d+ (months?|days?|hours?) ago/`, both locales, admin.

## C6 — Criterion 6 / COPY-06: the global mutation toast

**Target:** `frontend/src/lib/query-client.ts:69-72` —

```ts
onSuccess: () => {
  // Default success toast (can be overridden per mutation)
  toast.success('Operation completed successfully')
},
```

**The mechanism is already proven in the SAME file, three lines up** (`:63-66`): the `onError` default calls `toast.error(i18n.t('common:errors.queryFailedInline'))` via `import i18n from '@/i18n'` (`:15`), with an in-code comment explaining exactly this pattern ("t() comes from the i18n singleton because this module lives outside React context"). The least-risk repair is the symmetric one-liner: add a key pair to common.json (e.g. `toast.savedGeneric` — EN sentence-case, no `!`, no "successfully"-marketing; AR mirror), then `toast.success(i18n.t('common:toast.savedGeneric'))`. **Call `i18n.t` INSIDE the callback** (as `onError` does) so the string resolves at fire time in the CURRENT language, not at module import. Diff ≈ 1 code line + 2 JSON lines/locale — well under caps.

**Blast radius:** the default fires for every `useMutation` that does not supply its own `onSuccess` (TanStack v5 defaults are per-option overridden — mutation-level `onSuccess` replaces the default `[ASSUMED — training knowledge; the oracle proves the behaviour empirically either way]`). The change is copy-only: no timing, no logic. What it does NOT do (D-03/D-11): per-mutation specific copy — explicitly out.

**Closing oracle:** `98-copy06-toast.spec.ts` — perform ONE real mutation known to lack its own `onSuccess` handler (derivation for the plan: `command grep -rn "useMutation" frontend/src --include="*.ts*" -A 12 | command grep -L onSuccess`-style triage to pick a stable candidate; a settings/preference toggle or kanban drag are candidates to verify) and assert `[data-sonner-toast]` (sonner's DOM) shows the EN string under `en` and the AR string under `?lng=ar`, and that the literal `Operation completed successfully` appears nowhere. Negative control first: at HEAD the spec must observe the English literal under `?lng=ar` (the defect), proving the probe watches the right toast. Locale: both. Role: admin. This is the one criterion whose oracle spans the app by construction — one real mutation in each locale satisfies D-11's wording ("renders localized in both locales on a real mutation"); the plan states that bound.

## C7 — Criterion 7 / COPY-08: the EO popover

**Re-verified at HEAD (2026-08-18):**

- `frontend/src/i18n/en/dossier.json` and `ar/dossier.json`: `typeGuide` holds ONLY the five flat section labels `{whenToUse, examples, commonLinks, notFor, createDossier}` — **no `typeGuide.elected_official` subtree in either locale**; `typeDescription` holds 8 keys (`country…working_group` + legacy `theme`) — **no `elected_official` in either locale**. (Python key-walk; control: `typeDescription.person` present.)
- The guard: `frontend/src/components/dossier/DossierTypeStatsCard.tsx:168` — `{type !== 'elected_official' && (` wrapping the `<DossierTypeGuide …/>` trigger (comment block `:160-167` records the Phase 97 withhold).
- **Atomicity confirmed mechanically:** `DossierTypeGuide.tsx:175` (tooltip variant) and `:208` (popover variant) render `t(\`typeDescription.${type}\`)` with NO default → guard-without-keys prints the raw key (observed live 2026-08-17 per the register); keys-without-guard never render (no trigger). Note `typeGuide.${type}.whenToUse/notFor` (`:162,165`) have `''`defaults and`examples/commonLinks` (`:163-164`via`returnObjects`) are guarded by `Array.isArray`/`length>0` (`:224,241`) — so **missing SECTION keys fail silently, not loudly**; the oracle must therefore assert the four sections are PRESENT, not merely that no raw key shows.
- Surfaces: `DossierTypeStatsCard` renders on `pages/dossiers/DossierListPage.tsx` and `pages/dossiers/CreateDossierHub.tsx`. The help trigger is `hidden sm:inline-flex` (`:176`) — **desktop viewport required**. Popover side flips via `isRTL` (existing code; not this phase's concern).

**The change (one atomic task, D-12):** author 5 keys × 2 locales in dossier.json (`typeDescription.elected_official` string; `typeGuide.elected_official.whenToUse` string, `.examples` ARRAY, `.commonLinks` ARRAY, `.notFor` string — arrays because `returnObjects: true` consumes them; `examples` renders max 5 badges, `commonLinks` max 4 rows) + delete the guard (and its comment block) in `DossierTypeStatsCard.tsx`. AR content must be real copy (grammatical, glossary-adjacent; naturalness judged in P99). ≈ 3 files, ~40 lines. `NAV-01`'s register row is NOT edited (overseer's close-out act).

**Closing oracle:** `98-copy08-eo-popover.spec.ts` — on `/dossiers` (desktop, admin): the EO stats card's help trigger EXISTS (it must not for the other… no — after the fix EO gains the trigger; the seven siblings keep theirs); click it; inside the popover assert (a) header = `dossier:type.elected_official` value, (b) description text = the new `typeDescription.elected_official` value byte-for-byte, (c) all four section headings AND non-empty bodies/badges are visible (counting `examples` badges ≥1, `commonLinks` rows ≥1 — this is what defeats the silent-default guards), (d) no visible text matches `/typeGuide\.|typeDescription\./`. Run under `en` and `?lng=ar` with the corresponding locale's values. Negative control at HEAD: assert the trigger is ABSENT for EO pre-fix (red→green flip proves the spec watches the guard). Supplementary static gate: clone the `scripts/check-copilot-i18n.mjs` EN/AR-parity + non-empty pattern scoped to the five new key paths. Role: admin; sibling types' hollow bodies are OUT (GUIDE-HOLLOW-01 → P102) — the spec must NOT assert anything about the seven siblings' section bodies.

---

## Sequencing, Collisions, Wave Structure (Q8)

**File collisions (serialize or merge):**

| Shared file                         | Criteria touching it                                                                                          | Resolution                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `DossierTypeStatsCard.tsx`          | COPY-07 (label `:228`) + COPY-08 (guard `:168`)                                                               | **One task owns the file** — do both edits in the COPY-08 task (D-12 atomicity) or strictly serialize; never parallel (CONTEXT Specific Ideas) |
| `i18n/{en,ar}/dossier.json`         | COPY-08 (5 keys) + COPY-07 (new label key) + C4d (`dueDate` value at `en:962`)                                | same lane as above, or ordered tasks in one wave slot                                                                                          |
| `i18n/{en,ar}/common.json`          | COPY-02 (`entityLinks` subtree) + COPY-06 (toast key) + C4a (`auth.loginSuccess` `!`) + C4c (`dueDate` value) | serialize all common.json writers in one lane; it is the highest-contention file of the phase                                                  |
| `scripts/check-date-formatting.mjs` | C5 instrument extension                                                                                       | single owner task, lands BEFORE the C5 routing tasks so the extended gate proves them                                                          |
| `EngagementsList.tsx`               | C1 (`WEEK OF`) + C5 (date shape)                                                                              | one task treats it as one repair                                                                                                               |

**Proposed waves (respecting D-15 caps and `parallelization: true`):**

- **Wave 0 (instruments + gaps):** extend `check-date-formatting.mjs` with fixture drills; author the `98-*.spec.ts` skeletons with their HEAD-red negative controls (each spec proven red against the defect first — the phase's Nyquist gap list, §Validation Architecture); file-existence + hardcoded-count guard per D-09.
- **Wave 1 (independent single-file repairs, parallel):** COPY-03 (dashboard-widgets ×2 locales) · COPY-06 (query-client + common.json toast key — note common.json lane) · COPY-08+COPY-07 combined lane (StatsCard + dossier.json ×2) · C2 regions-casing fix (2 wizard files or form-wizard.json).
- **Wave 2 (population repairs, parallel by disjoint file sets):** C2 `entityLinks` subtree into common.json (split: core ≈ 58 keys / `aiSuggestions` ≈ 22 keys ×2 locales) · C1 enum routing (split by surface: signals+queue / kanban+timeline / `.replace` sweep) · C4a+4b+4c voice values (split by namespace groups; common.json edits queue behind Wave-1's common.json writer) · C5 routing (split: formatDistance batch 1/2/3 by directory / skeleton-pattern sites / toLocaleString-Date + StatusTimeline / fillMock removal + IntakeForm inline).
- **Wave 3 (close):** run the extended lint gate + full `98-*` spec set (en + `?lng=ar`) + production-build grep oracle with positive control; re-derive every population command and record post-fix counts; register/ROADMAP close-out derivation.

## Existing Test/Instrument Inventory (Q9 — reuse, don't build)

| Instrument                          | Location                                                                                                                                                                                                                                                                                        | Reuse for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Playwright harness                  | repo-root `playwright.config.ts` + `tests/e2e/`; projects `chromium-en` (Desktop Chrome, storageState admin), `chromium-ar-smoke` (`locale: ar-SA`, only matches `**/ar-smoke/**`), `chromium-mobile`; `baseURL` `:5173` (the ONLY origin in ALLOWED_ORIGINS); webServer auto-starts `pnpm dev` | all criterion oracles. **Auth:** the `setup` project throws without six `E2E_*` keys `.env.test` lacks (`E2ECRED-01` → P101) — follow Phase 96's proven shape: inline login via `tests/e2e/support/pages/LoginPage` + `TEST_USER_EMAIL`/`TEST_USER_PASSWORD`, run `--no-deps`. **Locale:** `?lng=ar` querystring flips language at first paint (documented in `frontend/CLAUDE.md`) — use it inside `chromium-en`-run specs rather than the ar-smoke directory, matching the 96/97 pattern |
| Phase-numbered spec convention      | `tests/e2e/{93,95,96}-*.spec.ts` — headers carry criterion text, population definition, stated exclusions, narrow CDP block patterns                                                                                                                                                            | copy the `96-calendar-family.spec.ts` header discipline verbatim for the 98 set                                                                                                                                                                                                                                                                                                                                                                                                            |
| `scripts/check-date-formatting.mjs` | lint-wired (frontend `lint` script does `cd ..` then runs it); fixture-dir CLI arg = built-in positive-failure self-test; green at HEAD                                                                                                                                                         | C5 gate — EXTEND (new checks + new fixtures), do not fork                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `scripts/check-i18n-namespaces.mjs` | lint-wired; verifies every static `useTranslation('ns')` names a registered namespace; exits 0 at HEAD                                                                                                                                                                                          | any new namespace registration is auto-guarded                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `scripts/i18n-mask-audit.mjs`       | standalone finder; namespace-aware defaulted-key resolution                                                                                                                                                                                                                                     | C2 population derivation                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `scripts/check-copilot-i18n.mjs`    | EN/AR key-parity + non-empty-value pattern on one namespace                                                                                                                                                                                                                                     | clone scoped to the 5 EO key paths (C7 static supplement)                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Runtime missing-key logger          | `frontend/src/i18n/index.ts:577` console.warn `Missing translation key: …`                                                                                                                                                                                                                      | C2's console-capture oracle                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Vitest                              | `frontend` `test: vitest`                                                                                                                                                                                                                                                                       | optional unit check for any new pure helper (e.g. week-group formatting); no i18n unit suite exists today                                                                                                                                                                                                                                                                                                                                                                                  |

**Gate hygiene inherited:** `pnpm --filter intake-frontend …` (D-19); `type-check` not `typecheck`; Playwright paths are filters (D-09); absolute paths (D-18); never `node -e` heredoc writes (D-17).

## Don't Hand-Roll

| Problem               | Don't Build                      | Use Instead                                                 | Why                                                                             |
| --------------------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Non-React `t()`       | a locale store/bridge            | `import i18n from '@/i18n'`; `i18n.t()` inside the callback | proven at `query-client.ts:65`                                                  |
| Date rendering        | any new formatter/util           | `lib/format-date.ts` four exports                           | the phase's own premise; guard enforces it                                      |
| Locale-flip in specs  | per-spec language plumbing       | `?lng=ar` querystring                                       | detector order is querystring-first by design                                   |
| Enum labels           | a central label registry         | per-namespace enum-keyed `t()` families                     | house pattern; a new registry would fork the convention P99 must then reconcile |
| i18n static checks    | new checker scripts from scratch | extend the four existing `scripts/*.mjs`                    | each already has self-test plumbing and lint wiring                             |
| Prod-build inspection | source-level "is it gated" grep  | build + bundle grep with positive control                   | criterion is a build-output claim (CONTEXT Specific Ideas)                      |

## Common Pitfalls

1. **Green-by-vacuum gates.** `pnpm --filter frontend` matches nothing and exits 0 (D-19). Every gate names `intake-frontend` and proves itself red-able.
2. **The ugrep wrapper's silent `.gitignore` scope.** All derivations use `command grep`/`python3`; every zero ships with its known-present control (D-06).
3. **Playwright path filtering.** ≥2 spec paths with ≥1 match silently drops the rest, exit 0 (D-09). Assert existence, hardcode the count of 98-specs.
4. **Blocking the SPA module instead of the API call** in forced-state specs — the 95-03 lesson; narrow CDP patterns to `*/functions/v1/...` or the specific endpoint.
5. **Reading emptiness as error.** RLS denial = empty 200; C3's empty-state oracle must FORCE the empty state, not assume today's data shape encodes it.
6. **Silent-default blindness.** A raw-key detector returns clean over a hollow guide (`t(key,'')`, `Array.isArray` guards). C7's oracle asserts section PRESENCE; C2's oracle adds console-capture, which sees misses that render defaults invisibly? — no: defaulted misses do not warn as missing in all configs; hence presence assertions, not absence-of-warning alone, close C7.
7. **One-locale commits.** Every key add/change lands en+ar together (D-16); the copilot-checker clone catches drift on the EO keys.
8. **common.json write contention.** Three criteria edit it; serialize its writers or merge lanes.
9. **`t()` at module top-level** freezes a language at import time; call inside callbacks (the `onError` precedent).
10. **Renaming JSON keys or DB columns while "fixing terminology."** COPY-01/4c change display VALUES; the glossary carve-outs (`urgency: critical`, `due_date`, `sla_deadline`, `workflow_stage`) are correct as they stand.
11. **The stats-card line number will drift** — the string is the anchor (D-13); comments in that file move.
12. **`aria-label` copy counts as copy** (screen-reader-visible): the DOM detectors should scan accessible names on the asserted surfaces, not only innerText, where cheap to do.

## Runtime State Inventory

Not a rename/refactor/migration phase — omitted. (No stored data, service config, OS registrations, secrets, or build artifacts carry any string this phase changes; i18n bundles are compiled into the frontend bundle at build time, so the droplet picks up changes on its normal deploy.)

## Environment Availability

| Dependency                                | Required By        | Available                                                  | Version                        | Fallback                                           |
| ----------------------------------------- | ------------------ | ---------------------------------------------------------- | ------------------------------ | -------------------------------------------------- |
| Node                                      | scripts, build     | ✓                                                          | v24.19.0 (observed in-session) | —                                                  |
| pnpm + `intake-frontend` workspace        | build/lint/oracles | ✓ (used by P93–97 daily)                                   | pnpm 10.29.x pinned            | —                                                  |
| Playwright + chromium                     | oracles            | ✓ (`tests/e2e/` green runs through P97)                    | per lockfile                   | —                                                  |
| Dev server `:5173`                        | spec baseURL       | ✓ (webServer auto-start in config)                         | —                              | `E2E_BASE_URL` env                                 |
| `TEST_USER_EMAIL/PASSWORD` in `.env.test` | inline auth        | ✓ (P96/97 specs used them)                                 | —                              | none — admin-only evidence bound, stated per green |
| Production build output `frontend/dist`   | C5 bundle oracle   | produced on demand (`pnpm --filter intake-frontend build`) | —                              | —                                                  |

No missing dependencies. Nothing new is installed.

## Validation Architecture

(`.planning/config.json` `workflow.nyquist_validation: true` — section required.)

### Test Framework

| Property   | Value                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework  | Playwright (repo root) + Vitest (frontend unit) + node guard scripts                                                                             |
| Config     | `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/playwright.config.ts`                                                              |
| Quick run  | `pnpm exec playwright test tests/e2e/98-<name>.spec.ts --project=chromium-en --no-deps` (from repo root; assert file exists first)               |
| Full suite | `pnpm exec playwright test tests/e2e/98-*.spec.ts --project=chromium-en --no-deps` + `cd frontend && pnpm lint` (carries all four guard scripts) |

### Phase Requirements → Test Map

| Req     | Behavior                                         | Test Type                                       | Automated check                                                                          | Exists?                          |
| ------- | ------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| COPY-01 | no snake_case/ISO-week tokens render             | e2e DOM detector                                | `98-copy01-labels.spec.ts`                                                               | ❌ Wave 0                        |
| COPY-02 | no raw key renders; no missing-key console warns | e2e + console capture                           | `98-copy02-rawkeys.spec.ts`                                                              | ❌ Wave 0                        |
| COPY-03 | forced empty/error digest states show new copy   | e2e (CDP-forced)                                | `98-copy03-dashboard.spec.ts`                                                            | ❌ Wave 0                        |
| COPY-04 | named/bounded voice surfaces                     | e2e + derivation floors                         | `98-copy04-voice.spec.ts`                                                                | ❌ Wave 0                        |
| COPY-05 | date shapes + prod-bundle absence                | e2e + build-artifact grep + extended lint guard | `98-copy05-dates.spec.ts`; extended `scripts/check-date-formatting.mjs` (in `pnpm lint`) | guard ✓ (extend); spec ❌ Wave 0 |
| COPY-06 | localized default toast on a real mutation       | e2e both locales                                | `98-copy06-toast.spec.ts`                                                                | ❌ Wave 0                        |
| COPY-07 | stats-card label localized                       | e2e (inside copy01 or copy08 spec)              | see C1                                                                                   | ❌ Wave 0                        |
| COPY-08 | EO popover fully resolved, both locales          | e2e render assertion + parity script clone      | `98-copy08-eo-popover.spec.ts`                                                           | ❌ Wave 0                        |

### Sampling Rate

- Per task commit: the task's own spec (quick run) + `cd frontend && pnpm lint`
- Per wave merge: all existing `98-*` specs + lint
- Phase gate: full 98-spec set both-locale legs + build-artifact oracle + all population commands re-derived with post-fix counts recorded

### Wave 0 Gaps

- [ ] Eight `tests/e2e/98-*.spec.ts` files (each proven RED at HEAD via its negative control before any repair lands)
- [ ] `check-date-formatting.mjs` extension + fixtures under its CLI-arg self-test dir
- [ ] copilot-checker clone scoped to the 5 EO keys (or fold into the spec)

## Security Domain

Minimal surface: this phase adds no inputs, endpoints, queries, or dependencies. Applicable notes only: (V5) no new user input is parsed — copy strings are static JSON; do not interpolate user data into new keys without i18next's default escaping (it escapes by default; do not set `interpolation.escapeValue: false` anywhere new). Error-copy rewrites (C3 `digest.error`) must keep internals out of user-facing text (core rule — the current string's "staging seed" mention is itself an internals leak this phase removes). No ASVS category is otherwise engaged; no threat-model change.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                             | Section  | Risk if wrong                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | TanStack Query v5 mutation-level `onSuccess` replaces (not merges with) the default, so the default toast fires only for mutations without their own handler `[ASSUMED — training]`                               | C6       | Blast-radius description shifts; the repair and oracle are unaffected (the oracle observes real behaviour)                                                                |
| A2  | Vite DCE removes `import.meta.env.DEV` blocks (and literals inside them) from production output — corroborated in-repo (`FullscreenLoader.tsx:39-41`) but proven only by the build-grep oracle at execution       | C5       | If false, the fillMock literal survives; the oracle catches it and the fix escalates to key removal alone                                                                 |
| A3  | `CALENDAR.RECURRENCE.TITLE` is not reproducible at HEAD (instrumented zero with control) — presumed a stale live-audit artifact                                                                                   | C2       | If it renders from a path the grep can't see (server-provided copy), the C2 console/DOM oracle on calendar surfaces would catch it — add /calendar to the driven surfaces |
| A4  | The audit's "46 exclamations / 8 first-person / five entityLinks keys / seven formats" measured different definitions than the derivations here (this phase's rules REQUIRE re-derivation; both numbers reported) | C2/C4/C5 | None — D-04 makes the derived numbers the operative ones                                                                                                                  |
| A5  | `intake:actions.fillMock`'s removal has no other consumer (single consumer verified at `IntakeForm.tsx:480`)                                                                                                      | C5       | check-i18n scripts + type-safety don't guard key deletion; re-grep `fillMock` at execution (control included)                                                             |

## Open Questions

1. **C4 sentence-case bound (needs OVERSEER, not planner, resolution).** The derived Title-Case population is ~4,471 heuristic candidates — unclosable within D-15 caps. Recommended proposal to the overseer: bound criterion 4's sentence-case clause to (named instance) + (button/title/nav labels on the surfaces the 98-spec set drives), file the long tail as a register row for a later phase. CONTEXT is explicit that acceptance-semantics questions go to the overseer — a plan that silently narrows OR silently absorbs the full population fails either way.
2. **Relative-time removal UX (C5).** The criterion's text retires `9 months ago` across 21 files; if any surface's design intent genuinely needs recency (activity feeds), that is an acceptance question — default position: follow the criterion, route to `formatDayFirst`.
3. **Which real mutation carries the C6 oracle** — pick at plan time via the no-own-`onSuccess` derivation; needs one that is idempotent/safe to fire in staging as admin.
4. **`MMMM yyyy` month headers and calendar-grid internals (C5)** — sanctioned display class or population member? Planner states the ruling either way; recommend sanctioning month-nav headers (they are navigation, not date-of-record copy).

## Sources

### Primary (HIGH confidence — read/derived on the working tree 2026-08-18, HEAD `89c18f3fe`)

- `.planning/phases/98-copy-truth/98-CONTEXT.md`; `.planning/REQUIREMENTS.md:149-198,742-749`; `.planning/ROADMAP.md:522-549`; `.planning/config.json`
- `frontend/src/lib/query-client.ts` (full); `frontend/src/lib/format-date.ts` (full); `frontend/src/components/dossier/DossierTypeStatsCard.tsx` (full); `frontend/src/components/dossier/DossierTypeGuide.tsx` (full); `frontend/src/lib/dev-mode-guard.ts` (full); `playwright.config.ts` (full); `scripts/check-date-formatting.mjs` (full); `scripts/check-i18n-namespaces.mjs` (header+behaviour); `scripts/i18n-mask-audit.mjs` + `scripts/check-copilot-i18n.mjs` (headers)
- Derivation commands executed this session over `frontend/src` and `frontend/src/i18n/{en,ar}` (all reproduced inline above with controls)
- `frontend/CLAUDE.md` (i18n separator/defaultNS/`?lng=ar` mechanics); root `CLAUDE.md` (voice rules, glossary carve-outs)

### Secondary (MEDIUM)

- `tests/e2e/96-calendar-family.spec.ts` header — the proven oracle shape (inline auth, `--no-deps`, narrow CDP patterns, stated exclusions)

### Tertiary (LOW / flagged)

- A1 (TanStack v5 override semantics) and A2 (Vite DCE) — training knowledge, each backed by an in-repo corroboration or an execution-time oracle as noted

## Metadata

**Confidence breakdown:**

- Reusable mechanisms + named-instance locations: HIGH — every file read, every instance either pinned or explicitly reported not-reproducible
- Population counts: HIGH as of 2026-08-18 with stated definitions — but they are FINDINGS; plans re-derive (D-04)
- Oracle designs: HIGH for shape (clones of proven 93–97 patterns); MEDIUM for the specific C6 mutation choice (open Q3)
- C4 sentence-case scope: the finding is HIGH-confidence; its RESOLUTION is an overseer question (open Q1)

**Research date:** 2026-08-18 · **Valid until:** ~2026-09-17 (stable tree; re-derive populations at plan time regardless — the tree moves)

RESEARCH-END
