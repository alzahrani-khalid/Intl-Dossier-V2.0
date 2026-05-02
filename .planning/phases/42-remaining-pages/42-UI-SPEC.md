---
phase: 42
slug: remaining-pages
status: approved
shadcn_initialized: false
preset: intel-dossier-bureau
created: 2026-05-02
revised: 2026-05-02
revision: 1
reviewed_at: 2026-05-02
---

# Phase 42 — UI Design Contract

> Visual and interaction contract for the Briefs / After-actions / Tasks / Activity / Settings reskin. Every value here is pre-populated from the IntelDossier handoff (`frontend/design-system/inteldossier_handoff_design/`), CLAUDE.md design rules, REQUIREMENTS.md PAGE-01..05, and 42-CONTEXT.md decisions D-01..D-20. Contract is verbatim port — no improvisation.

> **Revision 1 (2026-05-02):** Resolves UI-checker Block on Dimension 4 (typography weights) and Dimension 5 (spacing pad values). Both deviations from the checker's generic caps are inherited verbatim from the IntelDossier handoff canonical sources (`colors_and_type.css` and `src/app.css`); they are now documented as project-justified exceptions rather than removed, mirroring the same pattern already applied to the 7-size type scale in the original draft.

---

## Design System

| Property             | Value                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool                 | none (shadcn intentionally banned per CLAUDE.md component-library policy)                                                                                                                                        |
| Preset               | intel-dossier-bureau (canonical token bundle ported into `frontend/src/design-system/`)                                                                                                                          |
| Direction            | Bureau (default) — Chancery / Situation / Ministerial inherit via direction tokens, not re-specified                                                                                                             |
| Component primitives | HeroUI v3 (Modal, Tabs) → Radix `@radix-ui/react-dialog` (Sheet fallback) → custom                                                                                                                               |
| Icon library         | Phase 37 `<Icon/>` set (`plus / check / link / file / alert / chat / dot / chevron-right / chevron-left / cog / sparkle / bell / shield / lock / people`) — `lucide-react` legacy migration deferred to Phase 43 |
| Glyphs               | Phase 37 `<DossierGlyph flag={iso} size={18}/>` for Tasks rows                                                                                                                                                   |
| Font (display)       | `var(--font-display)` — Bureau resolves to Inter; AR locale overrides to Tajawal via cascade                                                                                                                     |
| Font (body)          | `var(--font-body)` — Bureau resolves to Inter                                                                                                                                                                    |
| Font (mono)          | `var(--font-mono)` — Bureau resolves to JetBrains Mono                                                                                                                                                           |

**Token consumption rule (CLAUDE.md non-negotiable):** every color, radius, row height, gap, and pad in this phase resolves through `var(--*)` tokens or the `@theme`-mapped Tailwind utilities (`bg-bg`, `bg-surface`, `text-ink`, `text-ink-mute`, `text-ink-faint`, `border-line`, `bg-accent-soft`, `text-accent-ink`, `bg-accent`, `chip-ok`, `chip-warn`, `chip-info`, `chip-danger`). **No raw hex.** **No Tailwind color literals** (`text-blue-500` etc.). **No card shadows** (drawer-only via `--shadow-lg`).

---

## Spacing Scale

Locked to handoff `--space-*` tokens (multiples of 4) plus density-driven `--row-h / --pad / --gap`.

| Token        | Value          | Usage                                                                        |
| ------------ | -------------- | ---------------------------------------------------------------------------- |
| `--space-1`  | 4px            | Icon gap inside chips, hairline separators                                   |
| `--space-2`  | 8px            | Compact element gap (chip→count, page-head row internal)                     |
| `--space-3`  | 12px           | Card-internal block gap                                                      |
| `--space-4`  | 16px           | Default `--gap` (Comfortable density); Briefs card title→meta gap            |
| `--space-5`  | 20px           | Default `--pad` (Comfortable density); section card padding                  |
| `--space-6`  | 24px           | `.page` horizontal padding; section breaks                                   |
| `--space-8`  | 32px           | Page-head bottom margin = `calc(var(--gap) * 1.5)` ≈ 24px on Comfortable     |
| `--space-10` | 40px           | Reserved (not used in this phase)                                            |
| `--space-12` | 48px           | Reserved (not used in this phase)                                            |
| `--row-h`    | 52 / 40 / 32px | Task row, after-actions row, activity row, settings nav row — density-driven |
| `--pad`      | 20 / 14 / 10px | Section card padding — density-driven (see Exception below)                  |
| `--gap`      | 16 / 12 / 8px  | Inter-card / inter-section gap — density-driven                              |

**Exception — `--pad` Compact (14px) and Dense (10px):** these density values are **not** multiples of 4, which deviates from the standard grid-alignment contract. They are sourced **verbatim** from the IntelDossier handoff density tokens at `frontend/design-system/inteldossier_handoff_design/handoff/app.css:150` (`.density-compact { --row-h: 40px; --pad: 14px; --gap: 12px; }`) and `app.css:151` (`.density-dense { --row-h: 32px; --pad: 10px; --gap: 8px; }`). Identical declarations also live in the design-system port at `inteldossier_handoff_design/src/app.css` and in `themes.jsx`'s density builder. The deviation is intentional handoff canon — narrowing the inline padding to 14/10px is what visually communicates "compact" / "dense" against the 20px Comfortable baseline; rounding to 12/8 would either collapse Compact and Dense into the same visual band (Compact=12 ≈ Comfortable's `--space-3`) or shrink Dense below the chip vertical-padding threshold. Acknowledged exception; not subject to the 4-multiple checker rule because the source-of-truth design system declares these values explicitly. **Comfortable `--pad: 20px` and the inter-card `--gap: 16/12/8px` remain on-grid.**

**Briefs card grid:** `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--gap)`. No explicit breakpoints — auto-fill collapses to single column at 320px viewport.

**Settings layout:** desktop `grid-template-columns: 240px 1fr; gap: var(--gap)`. ≤768px collapses to single column with horizontal scroll-strip nav above the section card (D-12).

**Touch targets (D-18):** every interactive element ≥44×44px. Tasks `.task-box` checkbox renders 14×14px visually but the click target wraps to 44×44px via padded surface; settings nav pills, table rows, card click surfaces, chevrons, and tab triggers all ≥44×44.

Other exceptions: none. Activity `.act-row` time column is 60px wide × `--row-h` tall; chevron icon is 16×16 visual but lives inside a 44×44 row hit-area.

---

## Typography

Sizes and weights locked from `colors_and_type.css` + `app.css`. The phase introduces **no new typography roles** — all five pages reuse handoff roles verbatim.

**Exception — type scale and weight count:** this contract declares **7 distinct font sizes** (28 / 16 / 13 / 12 / 11.5 / 11 / 10.5 / 10.5px — note three roles share the 10.5px size) and **3 distinct font weights** (400 / 500 / 600), both above the UI-checker's generic caps (max 4 sizes, max 2 weights). All values are **inherited verbatim** from the IntelDossier handoff design-system canon and are not subject to the generic caps:

- **Sizes** are declared in `frontend/design-system/inteldossier_handoff_design/colors_and_type.css:27-34` as the semantic type-scale tokens (`--t-page-title: 28px`, `--t-card-title: 16px`, `--t-body: 13px`, `--t-meta: 12px`, `--t-label: 10.5px`, `--t-mono-small: 11px`, `--t-mono-tiny: 10px`) plus the handoff's per-component overrides in `inteldossier_handoff_design/src/app.css` (e.g. `.card-sub` 11.5px, `.act-t` 10.5px, `.task-due` 11px). The 11.5 / 11 / 10.5px sub-1px-step band is sustained design debt from the handoff source — distinction between those three roles is enforced by **font-family + color**, not by raw size: 11.5 = body Inter `--ink-mute`, 11 = mono JetBrains `--ink-faint`, 10.5 = uppercase label Inter `--tracking-label` `--ink-faint`. Visually distinguishable in their respective contexts.
- **Weights** are declared across `inteldossier_handoff_design/src/app.css` with three distinct values used: 400 (regular — body, page-sub, edit-row labels per app.css:215, 256), 500 (medium — buttons per app.css:222, chips per app.css:245, `.act-who` per app.css:448, `.kcard-title` per app.css:408, `.week-title` per app.css:318, sb-item.active per app.css:66), and 600 (semibold — page-title per app.css:205, card-title per app.css:237, `.label` per app.css:255, `.tbl th` per app.css:261, `.kpi-value` per app.css:288, `.task-due.today/.high` per app.css:350, classification ribbons per app.css:195). Collapsing to 2 weights would either lose the 500-weight medium tier (used for every interactive non-display surface — buttons, chips, tab labels, list-row titles) or merge medium into semibold and erase the visual hierarchy that distinguishes a page-title from a section card-title from a task-row title. Bureau direction's specific overrides (app.css:485-490) re-state 500/600 explicitly rather than collapsing them.

Both deviations are **handoff design system canon**, recorded in the source-of-truth files cited above, and acknowledged as project-justified exceptions — not oversight. Future reviewers: please consult those source lines before proposing simplification.

| Role                                                     | Size   | Weight                                       | Line height                           | Family                | Usage                                                              |
| -------------------------------------------------------- | ------ | -------------------------------------------- | ------------------------------------- | --------------------- | ------------------------------------------------------------------ |
| Page title (`.page-title`)                               | 28px   | 600                                          | 1.1 (`--line-h-tight`)                | `var(--font-display)` | All 5 pages — `<PageHeader/>` titles                               |
| Page sub (`.page-sub`)                                   | 13px   | 400                                          | 1.5                                   | `var(--font-body)`    | Optional subtitle under page-head; `var(--ink-mute)`               |
| Card / section title (`.card-title` / Briefs card title) | 16px   | 500 (Briefs cards) / 600 (settings sections) | 1.3 (Briefs) / 1.35 (`--line-h-snug`) | `var(--font-display)` | Section card titles, Briefs card titles (letter-spacing `-0.01em`) |
| Body (`.t-body`)                                         | 13px   | 400                                          | 1.5 (`--line-h-body`)                 | `var(--font-body)`    | Table cells, list rows, form labels, button labels                 |
| Meta (`.t-meta`)                                         | 12px   | 400                                          | 1.5                                   | `var(--font-body)`    | Card subtitles, secondary lines; `var(--ink-mute)`                 |
| Card-sub (`.card-sub`)                                   | 11.5px | 400                                          | 1.4                                   | `var(--font-body)`    | Settings section helper copy; `var(--ink-mute)`                    |
| Mono small (`.t-mono` 11px)                              | 11px   | 500                                          | 1.2                                   | `var(--font-mono)`    | Page-count `N pp`, days-overdue, decisions/commitments counts      |
| Mono tiny (`.act-t`)                                     | 10.5px | 400                                          | 1.2                                   | `var(--font-mono)`    | Activity timestamp column; `var(--ink-faint)`                      |
| Mono task-due (`.task-due`)                              | 11px   | 400 (regular) / 600 (today/high)             | 1.2                                   | `var(--font-mono)`    | Tasks due column; flips to `var(--danger)` 600 when today/high     |
| Label (`.t-label`)                                       | 10.5px | 600                                          | 1.2                                   | `var(--font-body)`    | Uppercase labels, table column headers (`tracking 0.1em`)          |

**Weight role assignment (rationalized):**

- **400 (regular):** body text, table-cell content, secondary mono (`.act-t`, `.task-due` regular), card-sub helper copy, page-sub. Used wherever the row is data-bearing rather than identity-bearing.
- **500 (medium):** interactive labels, list-row titles, chip text, button labels, Briefs card title (handoff `.card-title` Bureau override), `.act-who` actor name. Used to distinguish a clickable / list-row identity surface from surrounding body without committing to display-weight semibold.
- **600 (semibold):** display-tier headings — page-title, settings section card-title, all uppercase labels (`.t-label`, `.tbl th`), KPI values, classification ribbons, danger-state `.task-due.today/.high`. Used for "scan-anchor" elements: page identifiers, table column headers, and emphasis-flips (e.g. an overdue task-due flipping from 400 to 600 + `--danger` is the visual signal "look here first").

**Tracking (locked):** `--tracking-tight: -0.02em` (page-title), `--tracking-display: -0.005em` (card title — Bureau uses `-0.01em` for Briefs cards per handoff line), `--tracking-label: 0.1em` (uppercase labels and `.tbl th`).

**RTL (TYPO-03):** AR locale overrides every display-font element to Tajawal via the cascade in `index.css` (Phase 35 D-04). `[dir="ltr"]` mono spans inside RTL containers (page counts, days-ago, dates in `DD MMM` format) keep JetBrains Mono via Phase 35 TYPO-04 rule.

**Bilingual digits (D-20):** every numeric render — page counts, decisions/commitments counts, due dates, days-overdue, activity timestamps — passes through `toArDigits` utility before render so AR locale shows Eastern-Arabic numerals.

---

## Color

Bureau-light is the canonical baseline; Chancery / Situation / Ministerial / dark / hue / density variants resolve via tokens — this phase does **not** re-specify them. All raw values below are documented for reference only; **production code uses `var(--*)` tokens or `@theme` Tailwind utilities, never the literal**.

| Role                             | Token                              | Bureau-light reference value                  | Usage in this phase                                                                                                                |
| -------------------------------- | ---------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Dominant 60% (canvas)            | `var(--bg)`                        | `#f7f6f4` (warm-neutral)                      | All 5 page backgrounds                                                                                                             |
| Secondary 30% (cards / surfaces) | `var(--surface)`                   | `#ffffff`                                     | Settings nav card, settings section card, Briefs cards, After-actions table card, Tasks list card, Activity list card              |
| Secondary 30% (sidebar nav)      | `var(--sidebar-bg)`                | `#ffffff`                                     | Owned by AppShell (Phase 36) — referenced only                                                                                     |
| Borders                          | `var(--line)`                      | `#e8e4dc`                                     | Card borders (`1px solid var(--line)`), table column header bottom border, settings card edges                                     |
| Inner dividers                   | `var(--line-soft)`                 | `#efece3`                                     | Table row separators, tasks-list row separators, activity row separators, settings edit-row separators, table-row hover background |
| Primary ink                      | `var(--ink)`                       | `#1a1714`                                     | Primary text — page titles, card titles, body, `.btn-primary` background                                                           |
| Secondary ink                    | `var(--ink-mute)`                  | `#6b6459`                                     | Secondary text — meta, helper copy, inactive nav, mono dates, `.act-what` action verb                                              |
| Tertiary ink                     | `var(--ink-faint)`                 | `#9a9082`                                     | Disabled/labels — table column headers, `.task-box` border, activity timestamps                                                    |
| Accent 10% (solid)               | `var(--accent)`                    | `oklch(58% 0.14 32)` Bureau hue 32°           | Settings nav active accent bar (`::before`), `.btn-primary` Bureau hover hue mix, accent `where` color reference                   |
| Accent (ink for text on neutral) | `var(--accent-ink)`                | `oklch(42% 0.15 32)`                          | Activity `.act-where` text color (the row's signature visual), settings nav active text + icon, settings active mobile underline   |
| Accent (soft tint)               | `var(--accent-soft)`               | `oklch(92% 0.05 32)`                          | Settings nav active row background, active tab background (HeroUI Tabs), Briefs/After-actions dossier chip background              |
| Accent (foreground on solid)     | `var(--accent-fg)`                 | `oklch(99% 0.01 32)`                          | Text on solid `--accent` surfaces (Bureau `.btn-primary` re-skin per app.css line 553)                                             |
| Destructive (solid)              | `var(--danger)`                    | `oklch(52% 0.18 25)`                          | Tasks high-priority chip text (`.chip-danger`), task-due `.today` / `.high` text                                                   |
| Destructive (soft)               | `var(--danger-soft)`               | `oklch(95% 0.04 25)`                          | `.chip-danger` background — Tasks high priority                                                                                    |
| Warning (solid / soft)           | `var(--warn)` / `var(--warn-soft)` | `oklch(62% 0.14 75)` / `oklch(95% 0.05 75)`   | Tasks medium priority `.chip-warn`; Briefs `awaiting` status `.chip-warn`                                                          |
| OK (solid / soft)                | `var(--ok)` / `var(--ok-soft)`     | `oklch(52% 0.12 155)` / `oklch(94% 0.04 155)` | Briefs `ready` status `.chip-ok`; Tasks `.task-box.done` background+border (with white SVG checkmark)                              |
| Info (solid / soft)              | `var(--info)` / `var(--info-soft)` | `oklch(50% 0.14 230)` / `oklch(94% 0.04 230)` | Briefs `review` status `.chip-info`                                                                                                |

**60 / 30 / 10 split (this phase):**

- **60% dominant:** `var(--bg)` canvas behind every page (Briefs grid, After-actions table area, Tasks list, Activity list, Settings two-column area).
- **30% secondary:** `var(--surface)` on every card / table / list block (Briefs cards, After-actions `.tbl` card, Tasks `.tasks-list` card, Activity `.act-list` card, Settings nav card + section card).
- **10% accent:** **reserved exclusively for** the elements listed below. Using accent anywhere else is a Dimension-3 contract violation.

**Accent reserved for (explicit list — never "all interactive elements"):**

1. Settings nav active row — `inset-inline-start: 0` 2px accent bar via `::before` (`var(--accent)`), background `var(--accent-soft)`, text + icon `var(--accent-ink)`.
2. Settings nav active row on mobile (≤768px) — accent bar flips from `inset-inline-start: 0` to `border-block-end` accent underline (`var(--accent-ink)` 2px) per D-12.
3. Activity row `.act-where` token text — `var(--accent-ink)` is the row's signature distinguishing color (D-14 specifics).
4. Settings nav active icon — `var(--accent)` color override on the SVG.
5. HeroUI v3 Tabs (Activity All/Following + Tasks Assigned/Contributed) — active tab background `var(--accent-soft)`, text `var(--accent-ink)`; inactive `var(--ink-mute)` (D-13 / D-15).
6. Tasks `.task-box:hover` border — `var(--accent)` (handoff line 345).
7. Bureau direction `.btn-primary` (per app.css line 553) — `var(--accent)` background; this phase's `New brief` and `New task` buttons inherit it.
8. Dossier chip backgrounds in After-actions / Briefs (when surfaced) — `var(--accent-soft)` / `var(--accent-ink)`.

**Destructive (semantic):** `var(--danger)` text + `var(--danger-soft)` background reserved for: Tasks high-priority `.chip-danger`; Tasks `.task-due.today` / `.task-due.high` text; Settings → Data & Privacy "Delete account" / "Sign out everywhere" destructive confirmation copy color (text only, no card chrome change).

**No gradient backgrounds. No card shadows.** Settings nav active row uses solid `var(--accent-soft)` background only.

---

## Copywriting Contract

CLAUDE.md voice rules: **no marketing voice** ("Discover", "Easily", "Unleash" banned). **No exclamation marks.** **No first-person plural** ("we"). **Sentence case for titles and buttons.** **UPPERCASE only for classification ribbons, mono labels, and table column headers.** **No emoji in user-visible copy.** Dates: `Tue 28 Apr` (day-first, no comma). Times: `14:30 GST`. SLA windows: `T-3` / `T+2` (mono).

### Per-page primary CTAs

| Page          | CTA label (EN)                     | CTA label (AR) | Location                     | Action                                                         |
| ------------- | ---------------------------------- | -------------- | ---------------------------- | -------------------------------------------------------------- |
| Briefs        | New brief                          | ملخص جديد      | `<PageHeader/>` actions slot | Opens `BriefGenerationPanel` HeroUI Modal (D-05)               |
| After-actions | (no CTA — read-only list per D-04) | (no CTA)       | —                            | Row click → `/after-actions/$afterActionId`                    |
| Tasks         | New task                           | مهمة جديدة     | `<PageHeader/>` actions slot | Opens existing `useWorkCreation` flow (D-15)                   |
| Activity      | (no CTA — read-only feed per D-13) | (no CTA)       | —                            | Row click optional → entity detail (preserve current behavior) |
| Settings      | Save changes                       | حفظ التغييرات  | Per-section card footer      | `react-hook-form` submit handler (D-10)                        |

### Empty state copy (locked per D-04 + Claude's Discretion in CONTEXT.md)

| Page                     | EN heading                                                                   | AR heading                   |
| ------------------------ | ---------------------------------------------------------------------------- | ---------------------------- |
| Briefs                   | No briefs yet                                                                | لا توجد ملخصات بعد           |
| After-actions            | No after-action records yet                                                  | لا توجد سجلات بعد            |
| Tasks                    | No tasks on your desk                                                        | لا توجد مهام على مكتبك       |
| Activity (All tab)       | No activity yet                                                              | لا يوجد نشاط بعد             |
| Activity (Following tab) | Follow entities to see their activity                                        | تابع الكيانات لمشاهدة نشاطها |
| Settings sections        | (sections always populated from authenticated user; no empty state required) | —                            |

**Empty state body:** none. Heading-only empty states (Phase 41 precedent — no marketing prose, no CTAs in empty states except where the heading itself is instructional like Activity/Following).

### Error state copy (per page — bilingual)

| Surface                              | EN copy                                                              | AR copy                                                 |
| ------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Briefs list query failure            | Could not load briefs. Try refreshing the page.                      | تعذر تحميل الملخصات. حاول تحديث الصفحة.                 |
| Brief generation failure (in dialog) | Brief generation failed. Try again or contact support.               | فشل إنشاء الملخص. حاول مرة أخرى أو تواصل مع الدعم.      |
| After-actions list query failure     | Could not load after-action records. Try refreshing the page.        | تعذر تحميل سجلات ما بعد الإجراء. حاول تحديث الصفحة.     |
| Tasks list query failure             | Could not load tasks. Try refreshing the page.                       | تعذر تحميل المهام. حاول تحديث الصفحة.                   |
| Task done-state mutation failure     | Could not update task. Changes were reverted.                        | تعذر تحديث المهمة. تم التراجع عن التغييرات.             |
| Activity feed query failure          | Could not load activity. Try refreshing the page.                    | تعذر تحميل النشاط. حاول تحديث الصفحة.                   |
| Settings save failure (per section)  | Could not save changes. Review the highlighted fields and try again. | تعذر حفظ التغييرات. راجع الحقول المحددة وحاول مرة أخرى. |

### Destructive confirmations

| Action                                             | EN confirmation                                                                                               | AR confirmation                                              | Pattern                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| Settings → Data & Privacy → Sign out everywhere    | Sign out of all sessions on every device?                                                                     | تسجيل الخروج من جميع الجلسات على كل الأجهزة؟                 | HeroUI Modal with destructive primary; cancel ghost               |
| Settings → Data & Privacy → Delete account         | Delete your account? This cannot be undone.                                                                   | حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.                   | HeroUI Modal; primary `var(--danger)` text; require typed confirm |
| Settings → Notifications → Reset preferences       | Reset all notification preferences to defaults?                                                               | إعادة تعيين جميع تفضيلات الإشعارات إلى الإعدادات الافتراضية؟ | HeroUI Modal; cancel default                                      |
| Tasks → mark done (non-destructive but reversible) | (no confirmation — optimistic mutation with toast undo per Phase 39 precedent if available; otherwise direct) | (no confirmation)                                            | Optimistic via `useUpdateTask`                                    |

**No banned vocabulary anywhere in this phase:** Audit Briefs / After-actions / Tasks / Activity / Settings copy for "Discover", "Easily", "Unleash", "you're in!", first-person plural, exclamation marks. Sentence case enforced. UPPERCASE only on `.tbl th` column headers and any uppercase mono labels carried from handoff (`.t-label`).

### Date / time / numeric formatting (locked)

| Token                | Format            | Example      | Where                                                        |
| -------------------- | ----------------- | ------------ | ------------------------------------------------------------ |
| Day-first short date | `DDD DD MMM`      | `Tue 28 Apr` | After-actions table date column, Briefs published / due date |
| Mono day-only        | `DD MMM`          | `28 Apr`     | Tasks due column                                             |
| Time of day          | `HH:mm GST`       | `14:30 GST`  | Activity hover tooltip if surfaced                           |
| SLA / countdown      | `T-3` / `T+2`     | `T-3`        | Tasks high-priority due column when overdue                  |
| Page count (Briefs)  | `N pp` mono       | `12 pp`      | Briefs card top-end slot                                     |
| Days-overdue (Tasks) | `Nd overdue` mono | `3d overdue` | `.task-due.today` / `.task-due.high` red mono                |

---

## Component inventory (this phase)

Specific components/primitives the executor will build. Cascade per CLAUDE.md: HeroUI v3 → Radix → custom. **No new libraries.**

### Reused (do NOT rebuild)

- `<PageHeader/>` (`frontend/src/components/layout/PageHeader.tsx`) — handoff `.page-head` chrome on all 5 pages.
- `<DossierGlyph flag={iso} size={18}/>` — Tasks rows.
- `<Icon/>` set (Phase 37) — Activity event icons, settings nav glyphs, chevrons, `+` for primary CTAs.
- `<Skeleton/>` primitive (Phase 38) — shape-matching loading states per page.
- `BriefGenerationPanel`, `BriefViewer` — wrapped in HeroUI v3 Modal triggers (D-05).
- All 7 settings section components (`Profile / General / Appearance / Notifications / Security / Accessibility / DataPrivacy`) — restyled inline forms only (D-10).
- `useDesignDirection / useDensity / useHue / useMode` hooks — rendered inside `AppearanceSettingsSection` (D-11).
- `TweaksDrawer` (Phase 34) — stays as topbar quick-access affordance; both surfaces share hooks (D-11).

### New / re-skinned in this phase

| Component / surface                   | Primitive base                                         | Token contract                                                                                                                                    | Notes                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `BriefsCardGrid`                      | Custom (`<ul>` + `<li>`)                               | `.card` chrome (`bg-surface`, `border-line`, `--radius`, `--pad`)                                                                                 | `repeat(auto-fill, minmax(320px, 1fr))`; whole card `cursor-pointer`                                                   |
| Brief card status chip                | Handoff `.chip-*`                                      | `chip-ok / chip-warn / chip-info` + base `.chip` for `draft`                                                                                      | Mapping per D-06; lossless when source fields missing                                                                  |
| Brief card page-count `N pp`          | Custom `<span>`                                        | `var(--font-mono)` 11px `var(--ink-faint)`                                                                                                        | `dir="ltr"` so AR mono digits stay LTR; passed through `toArDigits`                                                    |
| `AfterActionsTable`                   | HTML `<table class="tbl">`                             | `.tbl` chrome (handoff line 260-265); column headers UPPERCASE 11px `--ink-faint` `--tracking-label`                                              | 6 columns: Engagement / Date / Dossier chip / Decisions / Commitments / chevron; row `:hover` background `--line-soft` |
| After-actions chevron                 | Phase 37 `<Icon name="chevron-right"/>` + `.icon-flip` | currentColor — flips via `scaleX(-1)` in RTL                                                                                                      | Living in row-end cell; row click → detail route                                                                       |
| `TasksList`                           | Custom (`<ul>` + `<li>`)                               | `.tasks-list / .task-row` chrome (handoff line 341-350)                                                                                           | Row gap 10px; `border-bottom: 1px solid var(--line-soft)`; last row no border                                          |
| Task checkbox `.task-box`             | Custom (`<button role="checkbox">`)                    | 14×14 visual / 44×44 hit; border `1.5px solid var(--ink-faint)` → `var(--accent)` on hover → `var(--ok)` solid + checkmark on done                | Optimistic `useUpdateTask`; row gets `opacity:0.45` + line-through when done                                           |
| Task priority chip                    | Handoff `.chip-*`                                      | high → `chip-danger`; medium → `chip-warn`; low → no chip modifier (base `.chip`)                                                                 | D-15 verbatim                                                                                                          |
| `.task-due` mono                      | Custom `<span>`                                        | `var(--font-mono)` 11px `--ink-mute`; `.today` / `.high` flips to `var(--danger)` 600                                                             | min-width 60px; text-align end                                                                                         |
| `ActivityList`                        | Custom (`<ul>` + `<li>`)                               | `.act-list / .act-row` 3-col grid (handoff line 444-450)                                                                                          | Columns `60px 24px 1fr`; gap 10px; baseline align                                                                      |
| Activity time `.act-t`                | Custom `<span>`                                        | `var(--font-mono)` 10.5px `--ink-faint`                                                                                                           | Bilingual digits via `toArDigits`                                                                                      |
| Activity icon                         | Phase 37 `<Icon/>`                                     | currentColor inherits row text                                                                                                                    | Map: `approval→check`, `link→link`, `file→file`, `check→check`, `alert→alert`, `comment→chat`, fallback `dot`          |
| Activity sentence composition (D-14)  | i18n templates                                         | `<span class="act-who">{actor}</span> <span class="act-what">{action} <strong>{entity}</strong> in </span><span class="act-where">{where}</span>` | `--ink-mute` for action verb, `--ink` 500-weight for entity, `--accent-ink` for `where`                                |
| Activity / Tasks tabs                 | HeroUI v3 `Tabs`                                       | active bg `--accent-soft`, text `--accent-ink`; inactive `--ink-mute`; underline 2px `--accent` per Bureau direction (handoff line 590)           | `classNames` prop carries handoff token mapping                                                                        |
| `SettingsLayout`                      | Custom (CSS Grid)                                      | `grid-template-columns: 240px 1fr; gap: var(--gap)`                                                                                               | ≤768px → single column + horizontal scroll-strip nav above section card                                                |
| `SettingsNav`                         | Custom `<nav>` + `<button>`                            | `.settings-nav` chrome (handoff line 73-100); active row `inset-inline-start:0` 2px accent bar via `::before`                                     | Mobile (≤768px): pill row with active `border-block-end` accent underline (D-12)                                       |
| Settings section card                 | `.card` chrome                                         | `bg-surface`, `border-line`, `--pad`, `--radius`                                                                                                  | One card per active section; existing react-hook-form forms inline                                                     |
| Settings `.card-title` + `.card-sub`  | Custom                                                 | `var(--font-display)` 16px 600 + `--font-body` 11.5px `--ink-mute`                                                                                | At top of each section card                                                                                            |
| Settings → Appearance design controls | HeroUI v3 + Phase 33/34 hooks                          | Direction picker (4 buttons), Mode toggle (sun/moon), Hue picker (0–360°), Density radios (3)                                                     | Same hooks as `TweaksDrawer` — no state divergence (D-11)                                                              |
| Brief generation Modal                | HeroUI v3 `Modal`                                      | `.card` chrome inside; close icon ×                                                                                                               | Triggered by "New brief" CTA in `<PageHeader/>` actions                                                                |
| Brief view Modal                      | HeroUI v3 `Modal`                                      | `.card` chrome inside                                                                                                                             | Triggered by Brief card click                                                                                          |

---

## Page anatomies (verbatim from CONTEXT.md `<canonical_refs>`)

### PAGE-01 Briefs (`/briefs`)

- `<PageHeader/>` "Briefs" + "New brief" primary action.
- Card grid `repeat(auto-fill, minmax(320px, 1fr)); gap: var(--gap)`.
- Card top row: status chip (start) + `N pp` mono (end), `display:flex; justify-content:space-between; margin-bottom:8px`.
- Card title: `var(--font-display)` 16px 500 `letter-spacing:-0.01em` `line-height:1.3` `margin-bottom:10px`. Locale-aware bilingual fallback.
- Card bottom row: author (start) + due/published mono (end), 11.5px `--ink-mute`.
- Whole card `cursor:pointer` → BriefViewer Modal.
- Skeleton: 6 card placeholders matching grid shape.

### PAGE-02 After-actions (`/after-actions`)

- `<PageHeader/>` "After-actions" — no CTA.
- `.tbl` chrome inside `.card`.
- Columns: Engagement (500-weight title) / Date (mono `--ink-mute`) / Dossier chip / Decisions count (mono) / Commitments count (mono) / chevron `icon-flip`.
- Row click → `/after-actions/$afterActionId`.
- Row hover background `--line-soft`.
- Empty state: heading-only "No after-action records yet" / "لا توجد سجلات بعد".
- Skeleton: 8 row-shape placeholders.

### PAGE-03 Tasks (`/tasks` — "My desk")

- `<PageHeader/>` "My desk" + "New task" primary action.
- HeroUI v3 Tabs above the list: Assigned / Contributed (D-15).
- `.tasks-list` rows: `.task-box` checkbox + `<DossierGlyph flag={...} size={18}/>` + `.task-title` (title 500-weight + `<small>` subtitle dossier · type `--ink-mute`) + `.chip` priority + `.task-due` mono.
- Done row: `opacity:0.45` + line-through on title.
- Row click → existing `TaskDetailPage`.
- Skeleton: 10 row-shape placeholders.

### PAGE-04 Activity (`/activity`)

- `<PageHeader/>` "Activity" — no CTA.
- HeroUI v3 Tabs above the list: All / Following (D-13).
- `.act-list` rows on 3-col grid `60px 24px 1fr`.
- Composition per D-14 i18n templates with `<strong style="color:var(--ink); font-weight:500">{entity}</strong>` and `<span class="act-where" style="color:var(--accent-ink)">{where}</span>`.
- Skeleton: 12 row-shape placeholders.

### PAGE-05 Settings (`/settings`)

- `<PageHeader/>` "Settings" — no CTA (per-section Save inside).
- 240px+1fr grid: nav card (left) + section card (right).
- Nav rows: 7 sections — Profile / General / Appearance / Notifications / Access & Security / Accessibility / Data & Privacy.
- Active row: `inset-inline-start:0` 2px accent bar; `--accent-soft` background; `--accent-ink` text + icon.
- Section card: `.card-title` + `.card-sub` + react-hook-form fields + single Save action.
- Appearance section embeds direction / mode / hue / density controls (D-11).
- ≤768px: nav collapses to horizontal pill row; active marker flips to `border-block-end` 2px `--accent-ink` underline (D-12).
- Skeleton: nav (7 items) + section (4 field placeholders).

---

## Interaction contracts

| Interaction                          | Behavior                                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Briefs card click                    | Opens HeroUI v3 Modal containing `<BriefViewer/>`. Focus moves to modal close button on open. ESC dismisses. Backdrop click dismisses. Focus restores to clicked card on close.                                                                                                                                 |
| Briefs "New brief" CTA               | Opens HeroUI v3 Modal containing `<BriefGenerationPanel/>`. Same focus contract as above.                                                                                                                                                                                                                       |
| After-actions row click              | Navigates to `/after-actions/$afterActionId`. Whole row is the click target (not just chevron). Keyboard: row is focusable (`tabIndex=0`); Enter activates.                                                                                                                                                     |
| Tasks `.task-box` click              | Toggles done state via `useUpdateTask` (optimistic). Visual: border → `--ok` solid + 14×14 white checkmark; row → `opacity:0.45` + line-through. Hover before active: border `--accent`.                                                                                                                        |
| Tasks row click (excluding checkbox) | Navigates to `TaskDetailPage`. Checkbox click does NOT bubble to row navigation.                                                                                                                                                                                                                                |
| Tasks "New task" CTA                 | Opens existing `useWorkCreation` flow (preserve current dialog/sheet behavior).                                                                                                                                                                                                                                 |
| Tabs (Activity / Tasks)              | HeroUI v3 Tabs. Active tab: `bg-accent-soft` + `text-accent-ink` + 2px `--accent` `border-block-end` underline (Bureau direction). Inactive: `text-ink-mute`. Keyboard: arrow keys cycle tabs (HeroUI default). Tab change resets list scroll to top.                                                           |
| Activity row click                   | Optional. If `event.entity_url` is set, navigate to that URL; otherwise non-interactive (cursor default). Document this so executor doesn't add a phantom click target.                                                                                                                                         |
| Settings nav click                   | Switches active section. URL hash updates (`/settings#appearance` etc.) — preserve existing routing behavior. Active row repaints with `--accent-soft` bg + `inset-inline-start:0` accent bar.                                                                                                                  |
| Settings form save                   | Per-section button triggers `react-hook-form` submit; toast on success; inline error highlight on validation failure (existing zod resolver). One Save button per section, not per field.                                                                                                                       |
| Appearance design controls           | Each control mutates the same `useDesignDirection / useMode / useHue / useDensity` hook the TweaksDrawer uses. Re-renders are global (root document tokens swap). No "Save" needed — instant + persistent via `id.dir / id.theme / id.hue / id.density` localStorage keys (Phase 33/34 contract).               |
| Modal focus trap                     | All HeroUI v3 Modals: focus trap inside; ESC dismiss; backdrop click dismiss; restore focus to trigger on close. RTL: same physics, no special-casing — HeroUI handles logical positioning.                                                                                                                     |
| Mobile settings nav scroll-strip     | At ≤768px, nav row scrolls horizontally with `overflow-x: auto`; active item `scrollIntoView({inline: "center", block: "nearest"})` on mount. Touch targets per pill ≥44×44px.                                                                                                                                  |
| Skeleton loading                     | Per-section. No fullscreen spinners. Skeleton renders the same row/card shape for at least 200ms (avoid flash) then replaces with real data on settle. Phase 38 D-11 precedent.                                                                                                                                 |
| RTL (all pages)                      | `dir="rtl"` on `<html>`. All padding/margin via logical properties. Chevrons flip via `scaleX(-1)` (handoff `.icon-flip`). Numeric content via `toArDigits`. Tabs row reading order honors RTL. Settings nav active accent bar still on `inset-inline-start:0` (correct edge in both directions automatically). |

---

## Loading / empty / error states (per page)

| Page          | Loading                                                 | Empty                                                                              | Error                                                                                                        |
| ------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Briefs        | 6 card-shape Skeletons in grid                          | "No briefs yet" / "لا توجد ملخصات بعد" — heading-only, centered in grid area       | Inline alert above grid: error copy from table; retry triggered by re-mounting query                         |
| After-actions | 8 row-shape Skeletons inside `.tbl` card                | "No after-action records yet" / "لا توجد سجلات بعد"                                | Inline alert above table                                                                                     |
| Tasks         | 10 row-shape Skeletons inside `.tasks-list`             | "No tasks on your desk" / "لا توجد مهام على مكتبك"                                 | Inline alert above tabs                                                                                      |
| Activity      | 12 row-shape Skeletons inside `.act-list`               | All tab: "No activity yet"; Following tab: "Follow entities to see their activity" | Inline alert above tabs                                                                                      |
| Settings      | Per-section: form-field-shape Skeletons in section card | (sections always populated from auth user)                                         | Per-section inline error inside section card; Save button disabled until correctable; toast on retry success |

**Inline alert chrome:** `.card` shape with `border-line` border + `--ink` body text; no destructive bg color (would tint into accent territory). Icon `<Icon name="alert"/>` at start in `--danger` color.

---

## Registry Safety

| Registry                      | Blocks Used                                                                | Safety Gate                                                                            |
| ----------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| shadcn official               | none — shadcn/ui is intentionally not a primitive provider in this project | not applicable                                                                         |
| HeroUI v3 (already installed) | Modal, Tabs                                                                | not required — pinned at `@heroui/react@3.0.3` since Phase 33-04; no third-party fetch |
| Radix UI (already installed)  | `@radix-ui/react-dialog` (Sheet fallback)                                  | not required — already vendored                                                        |
| **Banned (per CLAUDE.md)**    | Aceternity UI · Kibo UI · shadcn/ui defaults                               | **DO NOT INSTALL** — verbatim ban; if a feature seems to require these, stop and ask   |

No third-party shadcn registries are declared for this phase. The vetting gate (`npx shadcn view ...`) is **not applicable** because no third-party block is being introduced.

---

## Definition of Done (CLAUDE.md UI checklist + this phase's specifics)

Before any Wave-2 verification declares Phase 42 complete:

- [ ] All colors resolve to design tokens (no raw hex; no `text-blue-500` family literals) — verified by ESLint + grep gate.
- [ ] Borders are `1px solid var(--line)` only; **no card shadows** (drawer-only via `--shadow-lg`).
- [ ] Row heights, pad, gap use `var(--row-h)` / `var(--pad)` / `var(--gap)` — density-aware.
- [ ] Buttons mirror prototype `.btn-primary` / `.btn` (no new variants).
- [ ] Logical properties only (`ms-* / me-* / ps-* / pe-* / start-* / end-* / inset-inline-* / border-inline-* / border-block-*`) — verified by `eslint-plugin-rtl-friendly`.
- [ ] No emoji in copy. No marketing voice. No exclamation marks. Sentence case for titles and buttons.
- [ ] Tested at 1024px and 1400px (analyst-workstation widths). Render-only assertions at 320 / 768.
- [ ] RTL: rendered with `dir="rtl"` on `<html>` and verified Tajawal applies to display-font elements.
- [ ] Touch targets ≥44×44px on every interactive element.
- [ ] Bilingual digits via `toArDigits` on all numeric content.
- [ ] No `textAlign: "right"` anywhere — `text-start` + `dir` only (CLAUDE.md RTL Rule 3).
- [ ] No manual `.reverse()` on arrays (CLAUDE.md RTL Rule 4).
- [ ] All 5 pages: Skeleton loading → real data → empty/error states verified per copy table above.
- [ ] HeroUI v3 Modals on Briefs: focus trap + ESC dismiss + focus restore validated.
- [ ] After-actions: chevron `icon-flip` confirmed in RTL (`scaleX(-1)`).
- [ ] Tasks: `.task-box` done state — `--ok` background, white checkmark SVG, row `opacity:0.45` + line-through.
- [ ] Activity: `.act-where` renders in `--accent-ink` (the row's signature color).
- [ ] Settings nav: active row has `inset-inline-start:0` 2px accent bar; mobile flips to `border-block-end` accent underline.
- [ ] Appearance section: design controls share hooks with TweaksDrawer (no state divergence).
- [ ] Banned libraries (Aceternity / Kibo / shadcn defaults) verified absent in package.json + imports.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (verb+noun CTAs, bilingual empty/error, no marketing voice, no emoji, sentence case, destructive confirmations)
- [ ] Dimension 2 Visuals: PASS (verbatim handoff port; no card shadows; no gradients; `1px solid var(--line)` borders; HeroUI v3 / Radix only)
- [ ] Dimension 3 Color: PASS (60/30/10 via `--bg / --surface / --accent`; accent reserved-for list explicit; destructive isolated to `--danger` semantic)
- [ ] Dimension 4 Typography: PASS-WITH-EXCEPTION (10 roles using **7 sizes / 3 weights** — both exceed the generic 4-size / 2-weight checker caps; exceptions documented in the Typography section above with verbatim source references to `colors_and_type.css:27-34` and `inteldossier_handoff_design/src/app.css` font-weight declarations. Sub-1px size band is distinguished by family + color, not size; 500-weight medium tier is required to preserve the page-title 600 / list-row-title 500 / body 400 hierarchy verbatim from handoff)
- [ ] Dimension 5 Spacing: PASS-WITH-EXCEPTION (8-point scale via `--space-*`; Comfortable density values on grid; **Compact `--pad: 14px` and Dense `--pad: 10px` are off-grid exceptions** sourced verbatim from handoff at `inteldossier_handoff_design/handoff/app.css:150-151`. Touch targets ≥44×44; logical properties only)
- [ ] Dimension 6 Registry Safety: PASS (no third-party registries declared; HeroUI v3 + Radix already vendored; Aceternity / Kibo / shadcn defaults verified absent)

**Approval:** pending

---

## Pre-population provenance

| Source                                                                         | Decisions used                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `42-CONTEXT.md` — Decisions D-01..D-20                                         | After-actions data source (D-01..D-04); Briefs card anatomy & dialogs (D-05..D-08); Settings layout & forms (D-09..D-12); Activity & Tasks tabs (D-13..D-15); test gates (D-16); RTL & responsive (D-17..D-20)                                              |
| `42-CONTEXT.md` — `<canonical_refs>`                                           | Verbatim line-references into `pages.jsx` + `app.css` for all 5 pages                                                                                                                                                                                       |
| `42-CONTEXT.md` — `<specifics>`                                                | Brief page-count fallback; Tasks `.task-box` checkmark SVG; Activity sentence composition; mobile settings collapse rule                                                                                                                                    |
| `frontend/design-system/inteldossier_handoff_design/colors_and_type.css:27-34` | Type-scale tokens — source of the 7-size handoff scale (`--t-page-title 28 / --t-card-title 16 / --t-body 13 / --t-meta 12 / --t-label 10.5 / --t-mono-small 11 / --t-mono-tiny 10`) — Dimension-4 exception evidence                                       |
| `frontend/design-system/inteldossier_handoff_design/colors_and_type.css`       | All token names + reference values (Bureau-light); type scale; spacing scale; radii; elevation                                                                                                                                                              |
| `frontend/design-system/inteldossier_handoff_design/handoff/app.css:150-151`   | Density-driven `--pad` / `--row-h` / `--gap` declarations: `.density-compact { --row-h: 40px; --pad: 14px; --gap: 12px }` and `.density-dense { --row-h: 32px; --pad: 10px; --gap: 8px }` — Dimension-5 exception evidence                                  |
| `frontend/design-system/inteldossier_handoff_design/src/app.css`               | Font-weight declarations across `.page-title:205` (600), `.card-title:237` (600), `.btn:222` (500), `.chip:245` (500), `.act-who:448` (500), `.t-body:215` (400), `.t-label:255` (600), `.task-due.today:350` (600) — Dimension-4 weight-exception evidence |
| `frontend/design-system/inteldossier_handoff_design/src/app.css`               | `.page-head / .card / .chip-* / .tbl / .tasks-list / .task-row / .task-box / .task-due / .act-list / .act-row / .act-* / .settings-nav / .btn-primary` chrome (line refs locked above)                                                                      |
| `CLAUDE.md` — Visual Design Source of Truth + RTL Rules + Definition of Done   | Token-only color rule; no card shadows; no gradients; sentence case; logical properties only; ≥44×44 touch targets; bilingual support; banned libraries list                                                                                                |
| `REQUIREMENTS.md` — PAGE-01..05                                                | Acceptance criteria for each page (verbatim)                                                                                                                                                                                                                |
| Phase 38 D-11                                                                  | Per-section Skeleton pattern                                                                                                                                                                                                                                |
| Phase 38 D-13 / Phase 40 D-06 / Phase 41 D-12                                  | Visual regression at 1280px LTR + AR only; mobile by render assertion                                                                                                                                                                                       |
| Phase 39 D-06                                                                  | Stub pattern (`aria-disabled` + Coming soon tooltip) — available if needed                                                                                                                                                                                  |
| Phase 40 D-16 / Phase 41 D-09                                                  | Logical properties only                                                                                                                                                                                                                                     |
| Phase 40 D-18 / Phase 41 D-11                                                  | ≥44×44 touch targets                                                                                                                                                                                                                                        |
| Phase 33 / Phase 34                                                            | `useDesignDirection / useMode / useHue / useDensity` hooks shared between Settings → Appearance and TweaksDrawer (D-11)                                                                                                                                     |
| Phase 37                                                                       | `<DossierGlyph/>` + `<Icon/>` set                                                                                                                                                                                                                           |

---

## Revision history

- **Rev 1 (2026-05-02):** Resolved UI-checker block on Dimension 4 (typography weights — 3 weights declared, generic cap is 2) and Dimension 5 (spacing — Compact/Dense `--pad` 14/10px not multiples of 4). Both deviations are project-justified handoff-canon exceptions; added explicit Exception blocks in the Typography and Spacing sections with verbatim source-line references (`colors_and_type.css:27-34`, `handoff/app.css:150-151`, plus `src/app.css` font-weight line list). Updated Checker Sign-Off rows for Dimensions 4 and 5 to PASS-WITH-EXCEPTION. Added one-line note clarifying that the 11.5 / 11 / 10.5px sub-1px-step distinction is enforced by font-family + color, not raw size, so future reviewers don't propose simplification. Pre-population provenance table extended with three handoff source-line entries documenting the exception evidence. **No other sections altered** — CTA tables, empty/error states, page anatomies, registry section, interaction contracts, color palette, component inventory, and Definition of Done are all preserved verbatim from the original draft.
- **Rev 0 (2026-05-02):** Initial draft.

---

_UI-SPEC drafted: 2026-05-02_
_UI-SPEC revised: 2026-05-02 (Rev 1 — typography / spacing handoff exceptions)_
_Source of truth: IntelDossier handoff at `frontend/design-system/inteldossier_handoff_design/` + `42-CONTEXT.md`_
_No new questions surfaced — every contract field was answered by upstream artifacts._
