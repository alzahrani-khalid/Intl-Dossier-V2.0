# Phase 29: Complex Type Wizards — UI Design Contract

**Phase:** 29-complex-type-wizards
**Generated:** 2026-04-16
**Status:** Ready for planning
**Source:** CONTEXT.md D-01..D-26 + A-01..A-07 + RESEARCH.md §4

> **Scope:** This spec only covers Phase 29 deltas vs the established Phase 26–28 wizard pattern.
> Anything not specified here inherits from `CreateWizardShell` / `FormWizard` / `SharedBasicInfoStep` / the Phase 27 Review pattern.

---

## 1. Design System Anchors (Inherited)

- **Component library:** HeroUI v3 (React Aria) — primary. Existing wizard uses its `Card`, `Button`, `Input`, `Select`, `Textarea`, `Chip` primitives.
- **CSS:** Tailwind v4 with logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`). No `ml/mr/pl/pr`, `text-left/right`.
- **Breakpoints:** mobile-first — base → sm (640) → md (768) → lg (1024) → xl (1280) → 2xl (1536).
- **Touch targets:** min 44×44px. 8px minimum gap between interactive elements.
- **Icons:** Lucide React. Directional icons flip via `isRTL ? 'rotate-180' : ''` on `<ChevronRight />`.
- **i18n:** react-i18next, `form-wizard` namespace, flat-key convention (A-07).
- **RTL:** `dir={isRTL ? 'rtl' : 'ltr'}` on wizard roots; Arabic textareas use `writingDirection: 'rtl'`.

---

## 2. DossierPicker — Multi-Select Variant (ENGM-04)

### 2.1 Props API (amends existing `work-creation/DossierPicker.tsx`)

```ts
type DossierPickerProps = {
  // Existing single-select (UNCHANGED):
  value?: string
  onChange?: (id: string | null) => void
  selectedDossier?: Dossier | null
  disabled?: boolean
  placeholder?: string
  className?: string

  // Widened filter (D-03):
  filterByDossierType?: DossierType | DossierType[]

  // NEW multi-select (D-01..D-04):
  multiple?: boolean
  values?: string[]
  onValuesChange?: (ids: string[]) => void
  selectedDossiers?: Dossier[] // parallel to selectedDossier
}
```

**Rule:** `multiple` toggles mode. When true, `value`/`onChange` are ignored; when false, `values`/`onValuesChange` are ignored. Zero runtime cost for single-select callers.

### 2.2 Visual Layout (multiple=true)

```
┌─────────────────────────────────────────────┐
│  [🔍] Search dossiers…                  [▼]  │  ← Combobox (existing)
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  [🏳 France ×] [🏛 OECD ×] [🏳 Japan ×] →   │  ← NEW: chip row
└─────────────────────────────────────────────┘
```

- **Chip row** sits immediately beneath the combobox input, in-flow (not absolutely positioned).
- Each chip is a HeroUI `Chip` (or local Badge) with:
  - Leading icon (country 🏳 / organization 🏛 / person 👤 — maps from `dossier.type`)
  - Localized dossier name (`name_ar` if `isRTL` else `name_en`, fallback to the other)
  - Trailing `×` button (remove). Touch-target ≥ 24×24px inside the 44×44 chip hit area.
- **Overflow:** `overflow-x-auto overflow-y-hidden`, `flex-row flex-nowrap gap-2`. RTL flexDirection flips scroll direction automatically.
- **Empty state:** no chip row rendered when `values` is empty (don't reserve vertical space).
- **A11y:** each chip has `role="button"` with `aria-label={t('chip.remove', { name })}`. Chip row has `aria-live="polite"` so removals announce.

### 2.3 Single-Select Layout (multiple=false, UNCHANGED)

Keep today's single "selected dossier card" beneath the combobox (existing behavior). No changes.

### 2.4 States

| State                   | Multi-select visual                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Empty                   | Combobox only; no chip row                                                                                 |
| 1–3 selections          | Chips inline, no scroll                                                                                    |
| ≥4 selections on mobile | Horizontal scroll; gradient fade on trailing edge (RTL-aware)                                              |
| Error                   | `aria-invalid="true"` on combobox; red border (`border-danger`); error text below in `text-danger text-sm` |
| Disabled                | Combobox disabled; chips render but `×` hidden                                                             |

### 2.5 Arabic/RTL Verification (Golden Rule)

In `flexDirection: 'row'` chip row with `forceRTL` on web (via `dir="rtl"`):

- First chip renders at **right edge** (Arabic reading start).
- Scroll direction flips so swipe-right reveals more chips.
- `×` button stays on the trailing edge of each chip (left in RTL, right in LTR) — use `ms-*` for spacing.

---

## 3. Forum Wizard (FORUM-01..03)

### 3.1 Step 1 — SharedBasicInfoStep (inherited — no UI changes)

### 3.2 Step 2 — ForumDetailsStep (NEW)

```
┌─────────────────────────────────────────────┐
│ Organizing body (optional)                  │
│ ┌─────────────────────────────────────────┐ │
│ │ [🔍] Search organizations…        [▼]   │ │  ← DossierPicker (single, filter=organization)
│ └─────────────────────────────────────────┘ │
│ [🏛 OECD ×]                                 │  ← Only shown when selected
│                                             │
│ Help text: "Link to the org that hosts this │
│ forum. Can be set later."                   │
└─────────────────────────────────────────────┘
```

- **Single field** only (organizing body). DossierPicker single-select, `filterByDossierType='organization'`.
- **Label:** `{t('forum.organizing_body_label')}` — "Organizing body" / "الجهة المنظمة".
- **Help text:** `{t('forum.organizing_body_help')}` — reinforces it's optional.
- **No required indicator** (optional per D-10).
- **Layout:** single-column, `max-w-xl`, generous vertical spacing (`space-y-6`).

### 3.3 Step 3 — ForumReviewStep (Phase 27 D-05 pattern)

Two grouped summary cards:

1. **Basic Info** — name_en, name_ar, abbreviation, description, tags, classification. Edit button jumps to Step 1.
2. **Forum Details** — organizing body name + type icon (or "— Not set —" when empty). Edit → Step 2.

---

## 4. Working Group Wizard (WG-01..03)

### 4.1 Step 1 — SharedBasicInfoStep (inherited)

### 4.2 Step 2 — WorkingGroupDetailsStep (NEW)

Field order (top → bottom):

```
┌─────────────────────────────────────────────┐
│ 1. Status *                                 │
│ [▼ Active]                                  │  ← Select: active/inactive/pending/suspended (A-03)
│                                             │
│ 2. Established date (optional)              │
│ [📅 2024-01-15]                             │  ← Date picker (ISO)
│                                             │
│ 3. Mandate — English                        │
│ [ Textarea (LTR, writingDirection: ltr) ]   │
│                                             │
│ 4. Mandate — العربية                       │
│ [ Textarea (RTL, writingDirection: rtl) ]   │  ← D-16 stacked pattern
│                                             │
│ 5. Parent body (optional)                   │
│ ┌─────────────────────────────────────────┐ │
│ │ [🔍] Search organizations…        [▼]   │ │  ← DossierPicker(single, filter=organization)
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- **Status:** HeroUI `Select`, required; default `active`. 4 options (A-03). Bilingual labels from i18n.
- **Established date:** HeroUI `DatePicker` or `Input type="date"`. Optional. ISO string.
- **Mandate EN/AR:** Two stacked `Textarea`s, min 4 rows. Each labeled with language. The AR one has `writingDirection: 'rtl'` and `dir="rtl"`.
- **Parent body:** DossierPicker (single), `filterByDossierType='organization'` (D-12). Optional.
- **Layout:** single-column, `max-w-xl`, `space-y-6`. Two `grid grid-cols-1 md:grid-cols-2` rows could group status/date — but default to single-column for clarity.

### 4.3 Step 3 — WorkingGroupReviewStep

Two grouped summary cards: **Basic Info** + **WG Details** (status chip, established_date, mandate preview both languages, parent body name). Edit jumps per card.

---

## 5. Engagement Wizard (ENGM-01..05)

### 5.1 Step 1 — SharedBasicInfoStep (inherited)

### 5.2 Step 2 — EngagementDetailsStep (NEW, amended by A-02)

```
┌─────────────────────────────────────────────┐
│ 1. Engagement type *                        │
│ [▼ Bilateral Meeting]                       │  ← 10 values from live CHECK (RESEARCH §1.2)
│                                             │
│ 2. Category *                               │
│ [▼ Diplomatic]                              │  ← 8 live values (A-01)
│                                             │
│ 3. Start date *                             │
│ [📅 2026-05-01]                             │  ← Required (A-02)
│                                             │
│ 4. End date *                               │
│ [📅 2026-05-02]                             │  ← Required; Zod refinement end ≥ start
│                                             │
│ 5. Location — English                       │
│ [ Input text ]                              │
│                                             │
│ 6. Location — العربية                      │
│ [ Input text (writingDirection: rtl) ]      │
└─────────────────────────────────────────────┘
```

- **Type + Category** stacked or 2-column on `md:`. Both required.
- **Dates** side-by-side on `md:`, stacked on mobile. Both required. Zod schema: `.refine(d => d.end_date >= d.start_date, { path: ['end_date'], message: t('engagement.dates_invalid_range') })`.
- **Location EN/AR** stacked pair. Optional? Per D-15, it's free-text bilingual; treat both as optional unless schema says otherwise (RESEARCH §1.1 — planner to confirm NOT NULL status).
- **Required indicator:** asterisk `*` on required field labels. Screen readers get `aria-required="true"`.

### 5.3 Step 3 — EngagementParticipantsStep (NEW, per D-05)

```
┌─────────────────────────────────────────────┐
│ Countries                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ [🔍] Search countries…             [▼]  │ │  ← DossierPicker(multiple=true, filter=country)
│ └─────────────────────────────────────────┘ │
│ [🏳 France ×] [🏳 Japan ×] →                │  ← Chip row, horiz scroll
├─────────────────────────────────────────────┤
│ Organizations                               │
│ ┌─────────────────────────────────────────┐ │
│ │ [🔍] Search organizations…         [▼]  │ │  ← (multiple=true, filter=organization)
│ └─────────────────────────────────────────┘ │
│ [🏛 OECD ×] [🏛 UN ×]                       │
├─────────────────────────────────────────────┤
│ Persons                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ [🔍] Search persons…               [▼]  │ │  ← (multiple=true, filter=person)
│ └─────────────────────────────────────────┘ │
│ [👤 Al-Zahrani ×]                           │
└─────────────────────────────────────────────┘
```

- **Three sections** — each a HeroUI `Card` with header (section label) + body (picker + chip row).
- **No required indicator** — empty sections are valid (D-06).
- **No "Add row" button** — the DossierPicker IS the add mechanism.
- **Section headers:** `text-base font-semibold text-start`. Bilingual i18n.
- **Vertical rhythm:** `space-y-6` between sections; section internal `space-y-3`.
- **Mobile:** sections stack with full-width pickers. Desktop: same (no multi-column layout — readability wins).

### 5.4 Step 4 — EngagementReviewStep

Three grouped summary cards: **Basic Info** + **Engagement Details** (type chip, category chip, dates, location) + **Participants** (three sub-sections showing chip counts and selected names; per D-20). Edit jumps per card.

---

## 6. List Page Create Button (FORUM-03, WG-03, ENGM-05)

Per D-21, exact Phase 28 pattern. Button position, icon, and behavior match Countries/Organizations/Topics/Persons list pages.

```
┌─────────────────────────────────────────────┐
│  Forums                    [+ Create forum] │   ← Button aligned to end (RTL: start)
│  ────────────────────────────────────────   │
│  [ Existing list filters + table ]          │
└─────────────────────────────────────────────┘
```

- **Placement:** top-right on LTR / top-left on RTL (use `ms-auto` or `flex justify-end`).
- **Icon:** `<Plus />` (Lucide), sized 16px.
- **Label:** `t('forum.create_button')` / equivalents per type. Bilingual.
- **Route:** `to="/dossiers/forums/create"` (and `/working_groups/create`, `/engagements/create`).
- **Touch target:** ≥ 44×44px. Button uses `min-h-11 min-w-11 px-4` per project mobile-first rule.

---

## 7. Accessibility Contract (WCAG AA)

1. **Keyboard navigation:** every form control reachable via Tab; wizard Back/Next buttons are `<button>` with `onClick`; focus outlines visible.
2. **Screen reader:** step progress announced via `aria-live="polite"` on the step indicator; field errors announced via `aria-describedby` linking to the error text.
3. **Color contrast:** AA on all text over backgrounds; error text uses `text-danger` with sufficient contrast on both themes.
4. **Focus management:** on step transition, move focus to the step heading.
5. **axe-core:** every new step component passes an axe audit in both `en` and `ar` locales.

---

## 8. Motion

- Inherit `FormWizard` slide transitions (Phase 26).
- **Chip add:** scale-in from 0.95 → 1.0 over 120ms, ease-out.
- **Chip remove:** scale-out with opacity to 0 over 100ms, ease-in.
- **Respect `prefers-reduced-motion`:** disable scale animations.

---

## 9. Deltas vs Phase 28 (Quick Reference for Planner)

| Dimension           | Phase 28                                | Phase 29                                                               |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| Wizard count        | 3 (org/topic/person)                    | 3 (forum/WG/engagement)                                                |
| Max step count      | 3                                       | 4 (engagement)                                                         |
| DossierPicker usage | None                                    | 1 single + 3 multi instances                                           |
| New migration       | None                                    | `working_groups.parent_body_id` + conditional `forums.organizing_body` |
| i18n keys           | `organization.*`, `topic.*`, `person.*` | `forum.*`, `working_group.*`, `engagement.*`                           |
| Bilingual textareas | name/description (SharedBasicInfo)      | same + WG `mandate_en/ar`, engagement `location_en/ar`                 |

---

## 10. Out of Scope for This Spec

- CreateDossierHub grid page design — Phase 31 UX-01.
- In-step contextual hints/guidance — Phase 31 UX-02.
- Structured address/map picker for engagement location — deferred.
- Animated transitions for chip add/remove beyond the basic scale — post-v5.0 polish.
- DossierPicker quick-create ("+ New organization…") flow — not required for Phase 29.

---

_Phase: 29-complex-type-wizards_
_UI-SPEC authored: 2026-04-16_
_Derived from: 29-CONTEXT.md decisions D-01..D-26 + amendments A-01..A-07, and 29-RESEARCH.md §3–§7_
