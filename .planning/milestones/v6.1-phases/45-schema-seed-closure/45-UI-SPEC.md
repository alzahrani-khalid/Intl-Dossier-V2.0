---
phase: 45
slug: schema-seed-closure
status: approved
shadcn_initialized: true
preset: new-york/radix via shadcn info; IntelDossier tokens own visual chrome
created: 2026-05-07
reviewed_at: 2026-05-07T23:51:51+03:00
---

# Phase 45 - UI Design Contract

> Visual and interaction contract for the dashboard Digest and VIP Visits data-closure work. Phase 45 preserves the Phase 38 dashboard layout and Phase 41 handoff styling; it changes data wiring, source display, flag glyph inputs, and state copy only.

---

## Design System

| Property          | Value                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tool              | shadcn initialized in `frontend/components.json`; use existing `components/ui` wrappers only                            |
| Preset            | `new-york` / `radix` from `npx shadcn info`; visual styling still comes from IntelDossier tokens                        |
| Component library | Existing shadcn/Radix wrappers and HeroUI v3 primitive strategy; no new component package in Phase 45                   |
| Icon library      | Existing `lucide-react` for Refresh/Arrow icons; existing `DossierGlyph` for country flags                              |
| Font              | IntelDossier Phase 35 stack: `var(--font-display)`, `var(--font-body)`, `var(--font-mono)`; Tajawal through RTL cascade |

Locked sources:

| Source                                               | Decisions used                                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `45-CONTEXT.md`                                      | D-01..D-15: bare digest table, `source_publication`, nullable VIP ISO fields, existing dashboard scope, seed closure only                |
| `45-RESEARCH.md`                                     | Digest swaps from `useActivityFeed` to `useIntelligenceDigest`; VIP passes ISO into `DossierGlyph`; visual redesign remains out of scope |
| `CLAUDE.md`                                          | IntelDossier prototype is visual source of truth; no raw colors, no card shadows, no marketing voice, logical RTL properties             |
| `frontend/src/pages/Dashboard/widgets/dashboard.css` | Preserve `.card`, `.digest-*`, `.vip-*`, `.digest-overlay`, `.dash-grid`, density tokens, and Bureau defaults                            |

---

## Visual Hierarchy

Primary screen: dashboard `/`, right column widgets.

| Surface            | Focal point                                          | Contract                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Digest widget      | `source_publication` line under each digest headline | The user must see a real publication name such as Reuters or Al Sharq, not an internal actor or username. Keep the headline first, then source + timestamp as the secondary line. |
| VIP Visits widget  | Country flag glyph at the start of each VIP row      | The flag glyph must be the row's visual anchor. Use `<DossierGlyph type="country" iso={person_iso}>`; fall back to initials only when ISO is absent or unsupported.               |
| Loading/refetch    | Existing GlobeSpinner overlay                        | Preserve the existing overlay and spinner behavior. Do not introduce skeleton layouts beyond current `WidgetSkeleton` usage.                                                      |
| Empty/error states | Short explanatory line inside the same card          | Keep the card footprint stable. Do not add illustration, marketing copy, nested cards, or decorative media.                                                                       |

No new page sections, hero treatment, gradients, shadows, or dashboard layout changes are allowed in this phase.

---

## Spacing Scale

Declared values for any new or touched UI in Phase 45:

| Token | Value | Usage                                                                 |
| ----- | ----- | --------------------------------------------------------------------- |
| xs    | 4px   | Icon gaps, inline separators, compact badge gaps                      |
| sm    | 8px   | Row-internal gaps, refresh icon gap if text label is visible          |
| md    | 16px  | Default element spacing inside widget controls                        |
| lg    | 24px  | Section padding when existing `.card` token is unavailable            |
| xl    | 32px  | Major dashboard column rhythm if a test fixture needs explicit layout |
| 2xl   | 48px  | Large empty-state vertical breathing room                             |
| 3xl   | 64px  | Page-level spacing only; Phase 45 should not add this in widgets      |

Exceptions: existing dashboard CSS density tokens (`--pad`, `--gap`, `--row-h`) remain source of truth and must not be redefined by Phase 45. Existing `.digest-item`, `.vip-row`, `.card`, and `.digest-overlay` spacing rules stay intact.

Touch target rule: mobile and tablet interactive controls remain at least 44px tall/wide through `min-h-11 min-w-11` or the existing widget control wrapper.

---

## Typography

Declare only these four sizes and two weights for Phase 45 UI changes:

| Role    | Size   | Weight | Line Height |
| ------- | ------ | ------ | ----------- |
| Label   | 10.5px | 600    | 1.2         |
| Body    | 13px   | 400    | 1.5         |
| Heading | 16px   | 600    | 1.2         |
| Display | 20px   | 600    | 1.1         |

Usage contract:

| Element                             | Role    | Notes                                                                                            |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Digest title and VIP title          | Heading | Keep `.card-title`; sentence case in EN and AR.                                                  |
| Digest tag                          | Label   | Keep mono-style uppercase source category where existing CSS applies; do not add new tag colors. |
| Digest headline, VIP name, VIP role | Body    | Use existing `.digest-head`, `.vip-name`, and `.vip-role`; do not add new font utilities.        |
| VIP countdown number                | Display | Keep `T-3`, `T+2`, or `T-0` in LTR isolate/`dir="ltr"`.                                          |

RTL rule: rely on existing `html[dir="rtl"]` Tajawal cascade. Do not add inline `fontFamily` styles.

---

## Color

All colors must resolve through IntelDossier CSS variables or existing token-mapped Tailwind utilities. No raw hex, no Tailwind color literals, no gradients.

| Role            | Value                                                                          | Usage                                                                                                     |
| --------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Dominant (60%)  | `var(--bg)` / `var(--surface)`                                                 | Dashboard canvas and widget cards                                                                         |
| Secondary (30%) | `var(--line)`, `var(--line-soft)`, `var(--ink-mute)`, `var(--ink-faint)`       | Card borders, row dividers, metadata, timestamps                                                          |
| Accent (10%)    | `var(--accent)`, `var(--accent-ink)`, `var(--accent-soft)`, `var(--accent-fg)` | Digest refresh focus/active state, VIP countdown number, active/focus rings, accent chips already present |
| Destructive     | `var(--danger)`                                                                | Not used by Phase 45; reserved for future destructive actions only                                        |

Accent reserved for:

1. Digest refresh action focus ring and active spinner state.
2. VIP countdown number through existing `.vip-countdown-n`.
3. Existing accent chips and focus indicators already present in dashboard CSS.
4. Never for every link, every row, every metadata line, or every icon.

Country flag colors come from `DossierGlyph` static flag SVGs. They are data identity colors, not the UI accent palette.

---

## Copywriting Contract

Use i18n keys in `dashboard-widgets`; no inline user-visible strings in TSX. Copy must be restrained, sentence case, and free of emoji or marketing language.

| Element                    | English copy                                                             | Arabic copy                                                                   | Notes                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Primary CTA                | Refresh digest                                                           | تحديث الموجز                                                                  | Replace the generic `Refresh` label for Digest. Icon-only rendering may keep an aria-label with this exact copy. |
| VIP secondary link         | View all VIP visits                                                      | عرض جميع زيارات كبار الشخصيات                                                 | Replace generic `All`.                                                                                           |
| Digest empty state heading | Digest is ready for seeded publications.                                 | الموجز جاهز للمنشورات المزروعة.                                               | Shown when `intelligence_digest` returns zero rows.                                                              |
| Digest empty state body    | Apply the dashboard demo seed, then refresh the digest.                  | طبّق بيانات لوحة التحكم التجريبية، ثم حدّث الموجز.                            | Gives the operator a concrete next step.                                                                         |
| Digest error state         | Digest could not load. Check the staging seed and try again.             | تعذر تحميل الموجز. تحقق من بيانات الاختبار ثم أعد المحاولة.                   | Problem plus recovery path.                                                                                      |
| VIP empty state heading    | No VIP visits with country data.                                         | لا توجد زيارات لكبار الشخصيات ببيانات دولة.                                   | Avoids vague "No data".                                                                                          |
| VIP empty state body       | Add VIP participant data to the dashboard seed, then refresh the widget. | أضف بيانات المشاركين من كبار الشخصيات إلى بيانات لوحة التحكم، ثم حدّث العنصر. | Names the expected fix.                                                                                          |
| VIP error state            | VIP visits could not load. Check event data and try again.               | تعذر تحميل زيارات كبار الشخصيات. تحقق من بيانات الفعاليات ثم أعد المحاولة.    | Problem plus recovery path.                                                                                      |
| Destructive confirmation   | Not applicable                                                           | غير منطبق                                                                     | Phase 45 has no destructive user action.                                                                         |

Do not use these labels in Phase 45: `Submit`, `OK`, `Cancel`, `Save`, `Click here`, `All`, or single-word `Refresh` as the accessible action name.

---

## Interaction Contract

| Interaction          | Contract                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Digest refetch       | Button triggers `useIntelligenceDigest().refetch`, disables while busy, shows existing GlobeSpinner overlay, and keeps card size stable.          |
| Digest row rendering | `headline` comes from bilingual digest fields; `source` comes only from `source_publication`; timestamp uses current dashboard locale formatting. |
| Digest source safety | The widget render path must contain zero references to `actor_name` and zero imports from `useActivityFeed`.                                      |
| VIP row rendering    | `person_iso` maps to `personFlag`; glyph call uses `type="country"` and `iso={visit.personFlag}`.                                                 |
| VIP fallback         | If ISO is null or unsupported, `DossierGlyph` may show initials from the VIP name; the row must still render name, role, and countdown.           |
| RTL                  | Use logical classes (`text-start`, `ms-*`, `me-*`, `ps-*`, `pe-*`) and existing `.icon-flip` for the arrow. No directional CSS.                   |
| Responsive           | Preserve current dashboard behavior: 2:1 grid at workstation widths, two columns at tablet width, stacked widgets below 768px.                    |

---

## Component Inventory

| Area           | Existing component/class                                                                 | Phase 45 instruction                                                  |
| -------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Digest shell   | `Digest.tsx`, `.digest`, `.digest-item`, `.digest-tag`, `.digest-head`, `.digest-source` | Reuse and rewire data. Do not restyle layout.                         |
| Digest loading | `WidgetSkeleton`, `GlobeSpinner`, `.digest-overlay`                                      | Preserve existing behavior and reduced-motion support.                |
| Digest refresh | `Button` from `@/components/ui/button`, `RefreshCcw` from `lucide-react`                 | Keep existing primitive; update accessible label to `Refresh digest`. |
| VIP shell      | `VipVisits.tsx`, `.vip`, `.vip-list`, `.vip-row`                                         | Reuse and rewire glyph inputs. Do not introduce a new card.           |
| VIP flag       | `DossierGlyph`                                                                           | Use country mode and ISO input.                                       |
| VIP countdown  | `LtrIsolate`, `.vip-countdown`, `.vip-countdown-n`                                       | Preserve LTR countdown rendering inside RTL pages.                    |

---

## Registry Safety

| Registry               | Blocks Used                                                                                | Safety Gate                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| shadcn official        | Existing installed primitives only: button, badge/card-compatible wrappers already in repo | not required - already installed before Phase 45                  |
| third-party registries | none                                                                                       | not applicable - Phase 45 may not add third-party registry blocks |

Note: `frontend/components.json` contains an `@aceternity-pro` registry entry, but Phase 45 must not use Aceternity blocks. `CLAUDE.md` explicitly bans Aceternity UI without an explicit user request.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-07
