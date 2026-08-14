# Intl-Dossier — Linear Design Refinement & Correction Plan

**Run:** design-review-260704 · **Date:** 2026-07-04 · **Canonical spec:**
`frontend/DESIGN.md` (Linear, dark-canonical) + `frontend/src/design-system/CLAUDE.md`

> ## ⛔ HUMAN CHECKPOINT — NOT APPROVED, NOT STARTED
>
> This is a **product/visual sign-off document**. No repo code was touched. Nothing
> here is implemented or scheduled. The phasing, severities, and especially the
> "Linear-taste" calls in Phases 5–6 are **proposals for the user to accept, reject,
> or reprioritize**. Do not begin any correction until the user signs off on scope.

---

## 1. Verdict (read this first)

**The core application is already strongly Linear-aligned.** Across all six audited
routes, in dark (canonical) and light, EN/LTR and AR/RTL, the app renders flat
surfaces, hairline borders, **no card shadows**, a restrained single indigo accent,
compact density, and correct RTL mirroring with **Tajawal confirmed** (computed
`font-family` resolves `Tajawal` first in AR). This is a good baseline, not a rebuild.

The gaps fall into five buckets, in rough priority order:

1. **A handful of concrete visual bugs** — cheap, high-impact (kanban column
   clipped, settings header duplicated, calendar button duplicated).
2. **Date/number formatting inconsistency** — spec-defined and app-wide; the
   dashboard violates the day-first no-comma rule that list rows already follow.
3. **Systemic code-level token debt** — real, but concentrated in
   **graph/chart/aceternity components that mostly don't appear on the core
   routes**. The visible chrome is clean; the debt sits one layer down.
4. **Copy / marketing-voice** — a copy-edit pass on `i18n/en`, largely no code.
5. **Un-Linear-like taste choices** — spec-compliant but not what Linear does
   (kanban priority accent bars, indigo active-nav fill, settings double-nav,
   uppercase form labels). These need **product sign-off**, not just a patch.

Plus a set of **Linear affordance opportunities** (right-peek panel, filter/display
split, richer empty states) that are enhancements, not defects.

---

## 2. Method & evidence base

Three parallel lanes (all visible Herdr panes, Opus/pi):

| Lane              | Output                                                   | Contents                                                                                                                             |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `mobbin-research` | `notes/mobbin-linear.md`                                 | Linear web patterns, **30 Mobbin screen citations**, 11 pattern sections + cross-cutting takeaways. The measuring stick.             |
| `app-inspect`     | `notes/app-inventory.md` + **30 screenshots** (`shots/`) | 6 routes × {dark,light}×{en,ar}@1400 + dark·en@1024 degrade. Viewport-clip (ground-truth) captures.                                  |
| `spec-audit`      | `notes/spec-audit.md`                                    | Mechanical `rg` sweep of `frontend/src` for the 10 non-negotiables, de-inflated for carve-outs, severity-classified, hotspot-ranked. |

Every headline finding below was **visually spot-verified** by the orchestrator
against the actual screenshots (not trusted from inventory text alone).

Routes captured: `/dashboard`, `/dossiers/countries` (list), a country detail
overview, `/kanban`, `/calendar`, `/settings`.

**Data vs design:** pervasive "No data available" empty states on dossier-detail
and `0` engagement counts are **data gaps** (seed/RLS), not design defects — layouts
render correctly and are out of scope for this plan.

---

## 3. Findings

Severity: **CRITICAL** (data loss/security — none here) · **HIGH** (functional or
clear spec violation) · **MEDIUM** (maintainability / taste-with-sign-off) · **LOW**
(polish). Each finding: route · evidence shot · what Linear does (Mobbin) · spec rule
· correction. RTL notes inline.

### 3A. Visible bugs — HIGH / MEDIUM, cheap

| ID      | Sev    | Finding                                                                                                                                                                                            | Evidence                                                                                 | Linear (Mobbin)                                                                                                                                                                                                                                                               | Correction                                                                                                                                                                                                                          |
| ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**  | HIGH   | **Kanban "Done" column clipped** — the 4-column board overflows the content width at 1400px (Done header cut, "No ite…" truncated); worse at 1024; mirrored in RTL (Done/مكتمل clips on the left). | `kanban__dark__en__1400.png`, `kanban__dark__en__1024.png`, `kanban__dark__ar__1400.png` | Board columns fit the frame or scroll with a **visible overflow affordance**; empty columns still show header + `0`. [board](https://mobbin.com/screens/9dbb6bc7-e6b0-4fb5-bc03-83d447df928b) · [empty cols](https://mobbin.com/screens/52e2f6c6-9192-4ab8-a344-cb93c1f5e2ef) | Set a column min-width + wrap the lane row in a horizontal-scroll container with a real scrollbar/edge-fade; or reduce column width so 4 fit at 1400. **RTL:** use logical inline-scroll; verify Done reachable in both directions. |
| **F2**  | HIGH   | **Settings header duplicated** — "Profile Settings" + subtitle render **twice**: once as the page header, again verbatim inside the card header.                                                   | `settings__dark__en__1400.png`                                                           | Single page title (H2 ~20px) + one-line description; section cards don't repeat the page title. [settings](https://mobbin.com/screens/790f2062-eb46-42ae-b0ee-8d75bbf4748c)                                                                                                   | Remove the inner card header (keep the page-level title), or vice-versa — exactly one.                                                                                                                                              |
| **F3**  | MEDIUM | **Calendar has two "Create Event" buttons** (page header + toolbar).                                                                                                                               | `calendar__dark__en__1400.png`                                                           | One primary create action per view.                                                                                                                                                                                                                                           | Keep a single primary "New event"; drop the redundant one.                                                                                                                                                                          |
| **F6**  | MEDIUM | **Raw enum status pills** — dashboard "Week Ahead" shows `preparation` / `follow_up` (raw DB enum, snake_case) as user-visible pills.                                                              | `dashboard__dark__en__1400.png`                                                          | Human, sentence-case status labels.                                                                                                                                                                                                                                           | Map enum → localized label (`t('status.follow_up')` → "Follow-up"); never render raw enums.                                                                                                                                         |
| **F22** | LOW    | **KPI labels wrap at 1024** ("ACTIVE ENGAGEMENTS" → 2 lines).                                                                                                                                      | `dashboard__dark__en__1024.png`                                                          | Compact single-line KPIs.                                                                                                                                                                                                                                                     | Shorten label, reduce label size at ≤1024, or allow abbreviation.                                                                                                                                                                   |

### 3B. Date / number formatting — HIGH, systemic, spec-defined

| ID     | Sev    | Finding                                                                                                                                                                                                                                                                                                                                                          | Evidence                          | Spec                                                                                                                                                                      | Correction                                                                                                                                                                                                                                                                                                                                          |
| ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F4** | HIGH   | **Date format violates day-first no-comma.** Dashboard greeting "Sat, Jul 4" and Intelligence Digest "May 8, 10:44 AM" are month-first + comma. Code-side: `toLocaleDateString` in **66 files**, dominant arg `('en-US',{month:'short',day:'numeric',year})` → "Apr 28, 2026". List rows already comply ("Mon 29 Jun") — the app is **internally inconsistent**. | dashboard shots; `spec-audit §10` | `Tue 28 Apr` (day-first, no comma); times `14:30 GST`; SLA windows `T-3`/`T+2` mono.                                                                                      | (1) Make `lib/format-date.ts` the **single** formatter emitting day-first no-comma + GST times; (2) migrate the 66 ad-hoc call sites; (3) add a lint/grep guard against raw `toLocaleDateString`. Two direct format-string offenders: `meeting-minutes/MeetingMinutesCard.tsx:95` (`'MMM d, yyyy'`), `Briefs/BriefsPage.tsx:94` (`en-GB`, no year). |
| **F5** | MEDIUM | **AR overdue unit mixes scripts** — kanban cards read `متأخر ٢٣٠d` (Arabic-Indic digits + Latin `d`).                                                                                                                                                                                                                                                            | `kanban__dark__ar__1400.png`      | RTL i18n integrity; reconcile with the known digit policy (Round-11: `Intl.NumberFormat('ar')` yields Latin digits in Chrome → use `lib/format-locale` `toFormatLocale`). | Localize the unit (`يوم`/`ي`) or use `Intl.RelativeTimeFormat('ar')`; decide one digit policy (Latin vs Arabic-Indic) and apply it consistently.                                                                                                                                                                                                    |

### 3C. Code-level token debt — MEDIUM, mostly off the core routes

The visible chrome is clean; this debt lives in **charts, relationship graphs, and
the aceternity `components/ui/` kit** — surfaces not in the 6-route sweep but real.

| ID      | Sev     | Finding (from `spec-audit`)                                                                                                                                                                                                               | Correction                                                                                                                       |
| ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **F7**  | MEDIUM  | **Raw hex ~100 across 22 files** — recharts fills (`analytics/*Chart.tsx`, `dashboard-widgets/ChartWidget`), graph node palettes (`MiniRelationshipGraph` 20, `relationships/RelationshipGraph`), aceternity `ui/background-boxes`.       | Introduce a **shared chart-palette token module** (`--chart-1…n` semantic series colors); migrate graph node palettes to tokens. |
| **F8**  | MEDIUM  | **Tailwind color literals ~51 across 11 files** — charts + aceternity `ui/`. _(The 251 matches in `styles/list-pages.css` are a deliberate `[class~=…]` compat shim — **carve-out, do NOT touch**.)_                                      | Map to `@theme` utilities (`bg-bg`, `text-ink`, `border-line`, `bg-accent`).                                                     |
| **F9**  | MEDIUM  | **Banned card shadows: 165 (`shadow-sm/md/xl/2xl`) across 93 files** — graph visualizations, `dossiers/DossierListPage` (9), `type-specific-fields` (11), FAB. Core routes already render shadowless; debt is in graph/detail components. | Strip card shadows; reserve shadow for drawers/modals/hover rows (`--shadow-drawer`/`--shadow-lg`).                              |
| **F10** | MEDIUM  | **Hardcoded radii: 92 `rounded-[…]` + px literals** across layout/dossier/calendar/WorkBoard CSS; much inherited from shadcn primitives.                                                                                                  | Replace with `--radius-sm/--radius/--radius-lg` (6/8/12); fold primitive radii into the HeroUI/Radix re-skin.                    |
| **F11** | LOW-MED | **Gradients ~13 real** — `styles/modern-nav-tokens.css` (5) + aceternity `ui/` + a `dashboard-widgets/BenchmarkPreview` `bg-gradient-to-br`.                                                                                              | Flatten to surface tokens (surfaces are flat per spec).                                                                          |
| **F12** | MEDIUM  | **Bespoke token ladders** — `styles/modern-nav-tokens.css` and `components/copilot/copilot-theme.css` define their **own** `--shadow-*`/radius/gradient ladders in parallel to the design system.                                         | Consume design-system tokens; delete the parallel ladders (architectural drift).                                                 |
| **F13** | MEDIUM  | **Row heights override `--row-h` with `!important`** — `styles/vertical-timeline.css` (44px/40px), `styles/list-pages.css` (20/28/34/32px).                                                                                               | Drive row heights from `var(--row-h)`; remove the `!important` pixel overrides.                                                  |
| **F14** | LOW     | **Emoji in copy** — `sla-countdown/SLACountdown.tsx` (`⚠️🔴⚡✓` as status), `dossiers/RelationshipGraph.tsx` empty-state (`⚠️`/`🔗`). _(Most repo emoji is legitimate data — flags, reaction sets — leave it.)_                           | Replace user-visible emoji with lucide icons.                                                                                    |

### 3D. Copy / marketing voice — MEDIUM, mostly no code

| ID      | Sev    | Finding                                                                                                                                                                                                                                                                                                                                                      | Spec                                       | Correction                                                                                                                                    |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **F15** | MEDIUM | **Marketing voice in `i18n/en`** — "Discover" (`guided-tours`, `relationships`, `progressive-disclosure`), "easily accessible" (`empty-states`), "Let us show you around" (`guided-tours`), and **exclamation marks** across `empty-states.json` ("You're all caught up!", "Great work!") + `guided-tours.json` ("Let's Go!", "Welcome to GASTAT Dossier!"). | No marketing voice; sentence case; no `!`. | Copy-edit pass on `empty-states.json` + `guided-tours.json` (+ `relationships`, `progressive-disclosure`). `en` drives `ar` — fix the source. |

### 3E. Un-Linear-like taste choices — MEDIUM, **need product sign-off**

Spec-compliant but not what Linear does. These are opinions; the user decides.

| ID      | Sev     | Finding                                                                                     | Evidence                        | Linear (Mobbin)                                                                                                                                                                                                                                           | Proposal                                                                                                                                                                                                   |
| ------- | ------- | ------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F16** | MEDIUM  | **Kanban cards use a full-height inline-start accent bar** for priority.                    | `kanban__dark__en__1400.png`    | Linear separates by border+surface; priority = an **inline bars glyph**, not a full-height accent bar. [board](https://mobbin.com/screens/9dbb6bc7-e6b0-4fb5-bc03-83d447df928b) · [list](https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e) | Replace the accent bar with an inline priority glyph + keep the badge; rely on border/surface. **RTL:** current bar correctly flips to inline-start — preserve logical-property parity in the replacement. |
| **F17** | LOW-MED | **Active nav item uses an indigo-tinted fill.**                                             | `dashboard__dark__en__1400.png` | Active = **subtle neutral-gray filled pill**; accent reserved for primary buttons + on-toggles only. Color = meaning, never decoration. [sidebar](https://mobbin.com/screens/1f5446d3-7b62-4d15-bb6e-ab2cf2385727)                                        | Neutralize active-nav fill to `--surface-raised` gray; keep indigo for primary actions.                                                                                                                    |
| **F18** | MEDIUM  | **Settings keeps the full app sidebar AND adds a settings sub-nav** (two nav columns).      | `settings__dark__en__1400.png`  | Settings is a **full-page mode that replaces the app sidebar** with its own grouped sub-nav + "‹ Back to app". [settings](https://mobbin.com/screens/790f2062-eb46-42ae-b0ee-8d75bbf4748c)                                                                | On settings routes, replace/collapse the main sidebar with the settings sub-nav and add a back-to-app affordance.                                                                                          |
| **F19** | MEDIUM  | **UPPERCASE form field labels** ("DISPLAY NAME", "JOB TITLE").                              | `settings__dark__en__1400.png`  | Sentence-case medium-weight labels. **Also violates the project's own rule** (uppercase only for classification ribbons, mono labels, table-column headers).                                                                                              | Sentence-case all form field labels.                                                                                                                                                                       |
| **F20** | LOW     | **Settings sub-nav is a flat list** (Profile…Integrations) with no grouped section headers. | `settings__dark__en__1400.png`  | Grouped with muted headers (Workspace / My Account / Teams). [settings](https://mobbin.com/screens/6f962754-c5c3-4972-b473-da978e06e1a6)                                                                                                                  | Add muted group headers to the sub-nav.                                                                                                                                                                    |
| **F21** | LOW     | **Kanban column headers lack a status glyph** before the name.                              | `kanban__dark__en__1400.png`    | Column header = **colored status glyph** + name + count + `+`. [board](https://mobbin.com/screens/9dbb6bc7-e6b0-4fb5-bc03-83d447df928b)                                                                                                                   | Add a status glyph to each column header.                                                                                                                                                                  |

### 3F. Linear affordance opportunities — LOW, enhancements (not defects)

| ID      | Sev  | Opportunity                                                                                                                                                                                                                                        | Linear (Mobbin)                                                                                                                                                                                                                                 |
| ------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F23** | LOW  | **Right "peek" panel with prev/next paging** for list→detail (dossier detail is currently full-page only).                                                                                                                                         | Peek panel slides over the list with a `1 / 15` counter + up/down chevrons. [peek](https://mobbin.com/screens/36fcffe3-6e93-499d-a8e0-02fd861221d8)                                                                                             |
| **F24** | LOW  | **Filter chips + builder popover with live counts**, and a separate **Display popover** (grouping/ordering/property toggles). Kanban has a `By status/By dossier/By owner` grouping toggle but no filter-chip builder or display-property toggles. | Filter = which rows (chips + builder w/ counts); Display = how arranged. [filter builder](https://mobbin.com/screens/2579f037-4e90-4330-ac35-19323ca9828a) · [display popover](https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759) |
| **F25** | INFO | **Command menu (⌘K)** — the topbar exposes a `⌘K` affordance; a full Linear-style **grouped, context-aware command menu with right-aligned key-glyph shortcuts** was not exercised in this sweep. Verify it matches.                               | [grouped commands](https://mobbin.com/screens/efcf3681-a039-4d53-8cdb-6c9d59dea5fa)                                                                                                                                                             |
| **F26** | LOW  | **Richer empty states** — dossier detail shows plain "No data available" ×6.                                                                                                                                                                       | Empty state = product-glyph cluster + purpose copy + one accent CTA; minimal views get a single glyph + line. [empty card](https://mobbin.com/screens/22a34806-c628-4add-a158-62792796917b)                                                     |

---

## 4. Prioritized, phased refinement plan

Ordered by value-to-effort. **Phases 1–4 are corrective (spec/bug); Phases 5–6 are
opinionated and gated on the user's taste sign-off.**

### Phase 1 — Visible bugs (fast, high-impact) · ~0.5–1 day

`F1` kanban column overflow · `F2` settings duplicate header · `F3` calendar
duplicate button · `F6` raw enum pills · `F22` KPI label wrap.
**Verify:** all 4 kanban columns reachable at 1400 & 1024 (EN + AR); one header on
settings; one create button on calendar; no raw enum strings in UI.

### Phase 2 — Date/number formatting (systemic, spec-defined) · ~1–2 days

`F4` centralize `lib/format-date.ts` (day-first no-comma + GST) → migrate 66 call
sites → add lint guard. `F5` AR overdue unit + one digit policy.
**Verify:** dashboard reads "Sat 4 Jul", grep finds no ad-hoc `toLocaleDateString`,
AR cards show no Latin unit after Arabic-Indic digits.

### Phase 3 — Token-debt consolidation (largest; overlaps the HeroUI/Radix re-skin) · ~3–5 days

Sequence: (a) build the **chart-palette token module** → (b) sweep charts (`F7`/`F8`)
→ (c) sweep graph components (`F7`/`F9`) → (d) fold aceternity + shadcn primitive
radii/shadows/gradients into the primitive re-skin (`F9`/`F10`/`F11`) → (e) delete
the bespoke ladders (`F12`) → (f) row heights to `--row-h` (`F13`) → (g) emoji→lucide
(`F14`). **Carve-outs (do NOT touch):** `list-pages.css` compat shim, `types/*`
migration comments, `design-system/tokens/` + `index.css` + `bootstrap.js` literal
holders. **Verify:** `spec-audit` re-run shows the systemic classes drop to clean/minor.

### Phase 4 — Copy & emoji pass (mostly no code) · ~0.5 day

`F15` marketing-voice edit on `empty-states.json` + `guided-tours.json` (+ siblings);
`F14` emoji removal if not already done in Phase 3.
**Verify:** grep `en` json for `Discover|Easily|Unleash|!` returns only false
positives (e.g. "cannot be easily undone" destructive warnings).

### Phase 5 — Linear-taste refinements (**product sign-off required**) · ~1–2 days

`F16` kanban priority signal · `F17` neutral active-nav · `F18` settings single-nav ·
`F19` sentence-case labels · `F20` grouped settings sub-nav · `F21` column status
glyphs. **Each is a design opinion — present mock/preview and get the user's call
before building.**

### Phase 6 — Linear affordance opportunities (optional enhancements) · scoped separately

`F23` right-peek panel · `F24` filter/display split · `F25` command-menu audit ·
`F26` rich empty states. These are **new capability**, not corrections — treat as a
separate mini-milestone if the user wants them.

---

## 5. RTL posture (verified strength)

RTL is a genuine strength, not a risk. Across every AR shot: sidebar mirrors to the
right, kanban columns flow R→L, **priority accent borders correctly flip to
inline-start**, badges/avatars/rails mirror, month grid reverses Sun→Sat, and
**Tajawal is confirmed applied** (computed `font-family`). The only RTL-specific
defect is `F5` (mixed-script overdue unit). Every correction above must stay on
**logical properties** (`ms/me`, `ps/pe`, `text-start/end`, `inline-start`) so RTL
parity is preserved without re-styling — the codebase already does this well.

---

## 6. What this plan deliberately excludes

- **Data gaps** (empty dossier-detail sections, `0` engagement counts) — seed/RLS,
  not design.
- **The `list-pages.css` compat shim** and other verified carve-outs — renaming/
  "normalizing" them breaks working infra.
- **Any implementation** — this ends at the plan, per the mission scope guard.

---

## 7. Sign-off — USER DECISIONS RECORDED 2026-07-04

1. **Scope:** Phases 1–4 (corrective) — **APPROVED** as one workstream to plan.
2. **Taste calls (Phase 5):** **review each of `F16`–`F21` individually with
   before/after previews** before any build; none pre-approved.
3. **Enhancements (Phase 6):** **later milestone** — keep this workstream corrective.
4. **Digit policy (`F5`):** **Latin digits** app-wide in Arabic UI; unit text
   localized (`يوم`), consistent with `lib/format-locale`.

_Evidence: 30 screenshots in `/tmp/design-review-260704/shots/`, 30 Mobbin citations
in `notes/mobbin-linear.md`, code sweep in `notes/spec-audit.md`._
