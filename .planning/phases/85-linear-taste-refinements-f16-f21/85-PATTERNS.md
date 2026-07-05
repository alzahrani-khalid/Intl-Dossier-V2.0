# Phase 85: Linear taste refinements (F16-F21) - Pattern Map

**Mapped:** 2026-07-05
**Files analyzed:** 6 touchpoint files (+2 grouping/label consumers) across 6 taste items
**Analogs found:** 6 / 6 (all in-repo; no RESEARCH.md fallback needed)

This is a pure polish phase — every touchpoint already exists in the repo (no new
files). "Analog" below means the closest existing pattern to copy the _technique_
from, since the target file itself is the edit site.

## File Classification

| Touched File                                                                  | Role            | Data Flow          | Closest Analog (technique to copy)                                                           | Match Quality                    |
| ----------------------------------------------------------------------------- | --------------- | ------------------ | -------------------------------------------------------------------------------------------- | -------------------------------- |
| `frontend/src/pages/WorkBoard/board.css`                                      | style/config    | CRUD (card render) | same file, `.task-due.today/.high` in `frontend/src/index.css:884-888`                       | exact (existing sibling pattern) |
| `frontend/src/pages/WorkBoard/KCard.tsx`                                      | component       | request-response   | `priorityChipClass()` in same file (lines 56-60)                                             | exact                            |
| `frontend/src/pages/WorkBoard/BoardColumn.tsx`                                | component       | request-response   | `frontend/src/components/signature-visuals/Donut.tsx` (inline token-colored SVG)             | role-match                       |
| `frontend/src/index.css` (`.settings-nav.active`)                             | style/config    | request-response   | `frontend/src/components/layout/Sidebar.tsx` active-item rule (same concern, different file) | exact                            |
| `frontend/src/components/layout/Sidebar.tsx`                                  | component       | request-response   | `frontend/src/index.css` `.settings-nav.active`                                              | exact                            |
| `frontend/src/components/layout/AppShell.tsx`                                 | provider/layout | request-response   | own `useRouterState` pathname read (already present, reused for drawer-close)                | exact                            |
| `frontend/src/components/settings/SettingsNavigation.tsx`                     | component       | request-response   | `frontend/src/pages/TaskDetailPage.tsx:98-111` (Back button + chevron flip)                  | role-match                       |
| `frontend/src/components/ui/label.tsx` + settings sections                    | component       | request-response   | `styles/list-pages.css` `.chip-*` modifier-class pattern (base + suffix modifier)            | role-match                       |
| `frontend/src/components/settings/SettingsNavigation.tsx` (SECTIONS grouping) | component       | request-response   | `frontend/src/components/layout/Sidebar.tsx` `.sb-group` header (lines 118-122)              | exact                            |

---

## Pattern Assignments

### TASTE-01 / F16 — `frontend/src/pages/WorkBoard/board.css` + `KCard.tsx`

**Current `.kcard.overdue` rule to REMOVE** (`board.css:28-30`):

```css
.kcard.overdue {
  border-inline-start: 3px solid var(--danger);
}
```

Do not touch the class _application_ — `KCard.tsx:117` still sets
`item.is_overdue && 'overdue'` on the `<article>`, and `BoardColumn.tsx`'s header
comment states Playwright `kanban-render` / `kanban-rtl` selectors depend on
`.kcard.overdue` resolving — leave the class attachment alone, only delete the
CSS border declaration.

**`.kcard-top` structure to prepend the optional priority glyph into**
(`board.css:36-40`):

```css
.kcard-top {
  display: flex;
  gap: 6px;
  align-items: center;
}
```

`KCard.tsx:122-125` renders it:

```tsx
<div className="kcard-top">
  <span className={kindChipClass(item.source)}>{kindLabel}</span>
  <span className={priorityChipClass(item.priority)}>{priorityLabel}</span>
</div>
```

A glyph must be the literal first JSX child (before the kind chip) — flex-row +
the page's native `dir` attribute (not forceRTL — this is web, browsers flip
`row` natively) puts it at inline-start automatically. **Analog for the
priority→color mapping:** `priorityChipClass()` (`KCard.tsx:56-60`) already
encodes urgent/high→danger, medium→warn, else→neutral — reuse that same
three-way branch for the glyph tint instead of re-deriving it.

**DIVERGENCE — no `.kdue` class exists today.** CONTEXT.md's spec
(`.kdue.is-overdue → color: var(--danger)`) assumes a `.kdue` class that is
**not present**. The actual current due-text render (`KCard.tsx:134-136`):

```tsx
<LtrIsolate>
  <span className="font-mono">{dueText}</span>
</LtrIsolate>
```

— only `font-mono`, no overdue modifier at all, and CSS only has
`.kcard-foot .font-mono` (`board.css:71-75`, plain `--ink-mute`). The planner
must (1) add the `kdue`/`is-overdue` classes to that span in KCard.tsx keyed off
`item.is_overdue`, and (2) add the new CSS rule. **Analog for the exact CSS
shape to copy** — this precise base+modifier pattern already ships elsewhere:
`frontend/src/index.css:884-888`:

```css
.task-due.today,
.task-due.high {
  color: var(--danger);
  font-weight: 600;
}
```

Mirror that shape as `.kdue.is-overdue { color: var(--danger); font-weight: 600; }`
scoped under `.kcard-foot` (or globally in board.css next to `.kcard-foot
.font-mono`) and change the span to
`className={cn('font-mono', 'kdue', item.is_overdue && 'is-overdue')}`.

**RTL:** none — digits already isolated via `<LtrIsolate>`; the glyph sits in a
flex row with no physical-direction properties either way.

---

### TASTE-06 / F21 — column header status glyph

**DIVERGENCE from CONTEXT's "likely touchpoint."** CONTEXT/canonical_refs says
`WorkBoard.tsx` `.col-head` — the real render site is
**`frontend/src/pages/WorkBoard/BoardColumn.tsx:62-75`**. `WorkBoard.tsx` only
touches `.col-head` inside its _loading skeleton_ branch (lines 280-284); the
live header markup lives entirely in `BoardColumn.tsx`:

```tsx
<header className="col-head">
  <h3 id={titleId}>{title}</h3>
  <LtrIsolate>
    <span className="col-count font-mono">{items.length}</span>
  </LtrIsolate>
  <button type="button" className="col-add" ...>+</button>
</header>
```

The glyph must be the new first child of `<header className="col-head">`,
_before_ `<h3>` — `.col-head` is `display:flex; align-items:center;
justify-content:space-between` (`board.css:117-124`), so a prepended glyph lands
at inline-start of the row automatically (no dir-specific handling needed).

**Stage keys** (confirmed from `frontend/src/pages/WorkBoard/WorkBoard.tsx:55`):

```ts
const STAGES: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done']
```

`cancelled` exists on the `WorkflowStage` type (`types/work-item.types.ts:32`)
but is filtered out of the board entirely (`isCancelled()`, `WorkBoard.tsx:71-73`)
— the glyph map only needs the 4 rendered stages. `BoardColumn` receives `stage:
WorkflowStage` as a prop already (`BoardColumnProps.stage`), so a
`stage → glyph` lookup can key directly off that prop with no new plumbing.

**Analog for the inline-SVG shape:**
`frontend/src/components/signature-visuals/Donut.tsx` — `role="img"`,
token-only `stroke`/`fill` (`var(--ok)`, `var(--surface-raised)`, etc.), small
`viewBox`, no framer-motion. For the ~14px glyph, this is a closer shape match
than `DossierGlyph.tsx` (which resolves flags/initials, not stage icons) —
borrow Donut's plain-`<circle>`/`strokeDasharray` technique for the review
stage's dashed ring, and a filled `<circle>` / `<path>` checkmark for
done/in-progress. Suggested token mapping (Claude's discretion per CONTEXT):
`todo` → empty ring, `stroke="var(--ink-faint)"`, `fill="none"`; `in_progress`
→ filled dot, `fill="var(--warn)"`; `review` → dashed ring,
`stroke="var(--ink-faint)"` + `strokeDasharray="2 2"`; `done` → check mark,
`stroke="var(--ok)"`.

**RTL:** none — a single small inline SVG has no directional properties to flip.

---

### TASTE-02 / F17 — neutralize active-nav fill

**`.settings-nav.active`** (`frontend/src/index.css:795-807`) — exact rule to edit:

```css
.settings-nav.active {
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.settings-nav.active::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block: 8px;
  width: 2px;
  background: var(--accent);
  border-radius: 2px;
}
```

Per CONTEXT: flip `background`→`var(--surface-raised)`, `color`→`var(--ink)`;
**keep** the `::before` stripe verbatim (already logical-property correct via
`inset-inline-start`).

**DIVERGENCE — Sidebar.tsx's active item is NOT accent-filled today.**
CONTEXT describes this as "swap the fill to `var(--surface-raised)`" implying
the current fill is accent-colored, but the actual code
(`frontend/src/components/layout/Sidebar.tsx:161-168`) already uses a **neutral**
color-mix, not the accent token:

```tsx
className={cn(
  'sb-item relative flex items-center gap-2 h-10 min-h-11 min-w-11 px-2.5 rounded-[var(--radius-sm)]',
  'font-body text-[13px] font-normal leading-[1.4] text-[var(--sidebar-ink)]/[.78]',
  'hover:bg-[color-mix(in_srgb,var(--sidebar-ink)_8%,transparent)] hover:opacity-100',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
  isActive &&
    'active bg-[color-mix(in_srgb,var(--sidebar-ink)_10%,transparent)] font-medium opacity-100 before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-xs before:bg-[var(--accent)] before:content-[""]',
)}
```

The `::before` stripe is already `before:bg-[var(--accent)]` at 2px
(`before:w-0.5`) anchored `before:start-0` — already Linear-correct and already
neutral-fill in intent (`color-mix(sidebar-ink 10%)` is a gray tint, not
accent). The planner's real choice here is whether to leave this file untouched
(it may already satisfy F17's intent) or replace the arbitrary `color-mix(...)`
with the token-ladder `var(--surface-raised)` for consistency with the
`.settings-nav.active` edit and to stop using an ad-hoc `color-mix` value.
Flag as a CHECKPOINT-worthy call, not a blind "swap" — the bug CONTEXT assumes
does not reproduce as described in this file.

**Light-mode risk (explicitly called out in CONTEXT, confirmed real from
DESIGN.md):** in light mode `--surface-raised` = `#f6f7f7` and `--sidebar-bg`
(derived) = `#f5f6f6` — a 1-value/rgb-unit difference, i.e. the "neutral pill"
will be nearly invisible against the light sidebar. This must be visually
verified per CONTEXT's own instruction ("Verify the neutral pill still reads
against the near-white light sidebar in light mode") — it is not a
hypothetical, the token math confirms the risk.

**RTL:** none — both rules already use `inset-inline-start`/logical values.

---

### TASTE-03 / F18 — settings single-nav + back-to-app

**Sidebar mount site** — `frontend/src/components/layout/AppShell.tsx` mounts
`<Sidebar/>` **twice**: desktop column (`AppShell.tsx:178-189`, `<aside
className="... hidden lg:block ...">`) and inside the mobile `Drawer.Body`
(`AppShell.tsx:234-242`). Both are unconditional today — no route check gates
either mount.

**Route/pathname already available** — `AppShell.tsx:120`:

```tsx
const pathname = useRouterState({ select: (s) => s.location.pathname })
```

already used for drawer-auto-close-on-navigate (`AppShell.tsx:143-148`); the
same `pathname.startsWith('/settings')` check can gate the `<Sidebar/>` mount
without adding a new hook.

**DIVERGENCE — root cause is a double nav-column, not just "add a suppress."**
Confirmed via `frontend/src/components/settings/SettingsLayout.tsx:59-67`: the
settings page renders its OWN 240px nav column (`SettingsNavigation`) _inside_
`<main>`'s grid:

```tsx
<section
  className="page settings-layout"
  style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--gap)' }}
>
  <SettingsNavigation activeSection={activeSection} onChange={onSectionChange} />
  <div className="card">...</div>
</section>
```

So today `/settings` shows the global 256px `<Sidebar/>` (in `AppShell`'s aside)
**plus** this 240px `settings-nav-card` — two nav columns simultaneously. F18's
fix is exactly right: route-condition the `AppShell` aside to skip `<Sidebar/>`
when `pathname.startsWith('/settings')`, letting the existing
`SettingsLayout`/`SettingsNavigation` occupy the freed rail visually (no new
grid — `SettingsLayout`'s grid already produces a left nav column, it's just
currently the _second_ one).

**No back-link exists yet** in `SettingsNavigation.tsx` (confirmed by full read
— it is only the `SECTIONS.map` button list, `SettingsNavigation.tsx:54-71`).
This must be added net-new above the button list.

**Analog for the "‹ Back to app" chevron-flip link:**
`frontend/src/pages/TaskDetailPage.tsx:98-111`:

```tsx
<Button variant="ghost" size="sm" onClick={() => navigate({ to: '/tasks' })} className="mb-4">
  <ChevronRight className={`size-4 ${isRTL ? '' : 'rotate-180'} ${isRTL ? 'ms-2' : 'me-2'}`} />
  {t('back_to_tasks', 'Back to Tasks')}
</Button>
```

Same shape works here: `navigate({ to: '/' })` (or the app's home route),
`isRTL` from `i18n.language === 'ar'` (matches `SettingsNavigation`'s existing
`useTranslation('settings')` usage), logical `ms-*`/`me-*` for icon spacing.

**RTL:** verify at 1024 & 1400 per CONTEXT — no new physical properties needed;
follow the `ms-*`/`me-*` + rotate-180 idiom above.

---

### TASTE-04 / F19 — sentence-case form-field labels

**DIVERGENCE — the two classes CONTEXT names are not interchangeable; only
one is the real consumer.** CONTEXT says "the shared `.t-label`/`.label`
recipe" as if equivalent. They are two separate rules:

- `.t-label` (`frontend/src/index.css:489-495`) — uses `var(--t-label)` /
  `var(--tracking-label)` design-token indirection. Grepped: **zero** settings
  form components reference `.t-label` or the `t-label` className.
- `.label` (`frontend/src/styles/list-pages.css:552-567`) — the actual
  consumer, via the shared `Label` UI primitive:
  ```css
  .label {
    font-size: 11px;
    font-weight: 600;
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .dir-linear .label {
    /* same values, Linear-direction override */
  }
  ```
  ```tsx
  // frontend/src/components/ui/label.tsx:7-9
  const labelVariants = cva(
    'label leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  )
  ```
  98 files import `@/components/ui/label`; 5 settings sections do
  (`ProfileSettingsSection.tsx`, `GeneralSettingsSection.tsx`,
  `SecuritySettingsSection.tsx`, `AccessibilitySettingsSection.tsx`,
  `AppearanceSettingsSection.tsx`). **This confirms CONTEXT's own warning is
  correct** — `.label` also renders legitimate uppercase meta text elsewhere
  (`KpiStrip.tsx`, `MiniKpiStrip.tsx`, `RecentActivitySection.tsx`,
  `UpcomingSection.tsx`, `OpenCommitmentsSection.tsx`, `Topbar.tsx`, etc. all
  apply a literal `label` className directly) — so the global `.label` rule
  must not be touched.

**One consuming settings form, exact excerpt**
(`frontend/src/components/settings/sections/ProfileSettingsSection.tsx:177-179`):

```tsx
<Label htmlFor="display_name" className="text-start block">
  {t('profile.displayName')}
</Label>
```

Same shape repeats at lines 203, 212, 232, 252, 274 in the same file, and
analogously in the other 4 settings sections.

**Analog for how to scope a variant without touching the base recipe:**
`styles/list-pages.css`'s existing chip modifier-class family —
`.chip-danger`/`.chip-warn`/`.chip-ok`/`.chip-info`/`.chip-default` (lines
~530-549) all layer a suffix modifier on top of a shared `.chip` base rather
than editing `.chip` itself. Mirror that: add a new suffix class (e.g.
`.label-field`) beside `.label` in `list-pages.css`, with
`text-transform: none; letter-spacing: normal; font-size: 13px; font-weight:
500; color: var(--ink-mute);`, and append it to the `className` prop on the
5 settings sections' field `<Label>` calls (`className="label-field text-start
block"`) — never edit `labelVariants` or `.label` itself. The `Label` UI
component (`components/ui/label.tsx`) needs no code change; the extra class
rides on the existing `className` merge via `cn(labelVariants(), className)`.

**RTL:** none — CONTEXT confirms this is EN-only visual (Arabic has no letter
case); Tajawal weight/spacing must stay untouched, which this scoping
naturally satisfies since Tajawal-forcing rules key off `.label` (not the new
suffix class) at `index.css:520` / `:541`.

---

### TASTE-05 / F20 — group settings sub-nav under muted section headers

**Flat array to split** — `frontend/src/components/settings/SettingsNavigation.tsx:20-30`:

```ts
const SECTIONS: SectionDef[] = [
  { id: 'profile', labelKey: 'profile', icon: 'people' },
  { id: 'general', labelKey: 'general', icon: 'cog' },
  { id: 'appearance', labelKey: 'appearance', icon: 'sparkle' },
  { id: 'notifications', labelKey: 'notifications', icon: 'bell' },
  { id: 'security', labelKey: 'accessAndSecurity', icon: 'shield' },
  { id: 'accessibility', labelKey: 'accessibility', icon: 'check' },
  { id: 'data-privacy', labelKey: 'dataPrivacy', icon: 'lock' },
  { id: 'email-digest', labelKey: 'emailDigest', icon: 'file' },
  { id: 'integrations', labelKey: 'integrations', icon: 'link' },
]
```

rendered by a single flat `.map()` (`SettingsNavigation.tsx:56-69`).

**DIVERGENCE — group header token mismatch.** CONTEXT says the target header
style is "`--ink-faint`, ~11px, medium." The actual existing app-sidebar group
header (`frontend/src/components/layout/Sidebar.tsx:118-122`) is:

```tsx
<div className="sb-group-block flex flex-col gap-1">
  <div className="sb-group px-2.5 font-body text-[10px] font-semibold tracking-[0.1em] uppercase leading-[1.3] text-[var(--sidebar-ink)]/80">
    {t(group.label)}
  </div>
  ...
```

i.e. **10px** (not 11px), **font-semibold/600** (not medium/500), and colored
`text-[var(--sidebar-ink)]/80` (a translucency of the sidebar-ink token, not
literally `var(--ink-faint)`). Since `SettingsNavigation` no longer sits in the
sidebar-ink context (it renders inside `<main>` on `--surface`/`--bg`), the
correct token to mirror the _intent_ of `--sidebar-ink` is `var(--ink-faint)`
directly (there is no settings-scoped "sidebar-ink" equivalent) — CONTEXT's
`--ink-faint` call is right for the settings context even though it's not a
byte-for-byte copy of the sidebar rule. Use `text-[10px] font-semibold
tracking-[0.1em] uppercase text-[var(--ink-faint)]` to match the sidebar's
actual weight/size, not the CONTEXT paraphrase.

**Grouping buckets** (Account / Privacy & access / Connected) are explicitly
the user's call per CONTEXT — do not block; this is flagged as a possible
CHECKPOINT in CONTEXT itself. A reasonable default split over the 9 existing
IDs: **Account** → profile, general, appearance, notifications; **Privacy &
access** → security, accessibility, data-privacy; **Connected** →
email-digest, integrations.

**RTL:** none new — `SettingsNavigation` already sets `text-start` on labels
and the header is a block-level div with no directional properties beyond
inherited `dir`.

---

## Shared Patterns

### Neutral-fill vs. accent-fill on nav actives

**Source:** `frontend/src/index.css:795-807` (`.settings-nav.active`) — the one
rule that DOES need the accent→neutral swap. `Sidebar.tsx`'s active state
(`Sidebar.tsx:161-168`) is already neutral; treat it as a token-cleanup, not a
color-semantics fix.
**Apply to:** TASTE-02 only.

### Modifier-class-over-base-recipe (never edit the shared primitive)

**Source:** `styles/list-pages.css` `.chip`/`.chip-danger`/`.chip-warn`/etc.
**Apply to:** TASTE-04 (`.label` + new `.label-field`) and, if desired, the
optional TASTE-01 priority glyph (reuse `priorityChipClass()`'s three-way
branch rather than a new one).

### Inline token-colored SVG glyph primitive

**Source:** `frontend/src/components/signature-visuals/Donut.tsx` (role="img",
token-only stroke/fill, plain `<circle>`, no motion library).
**Apply to:** TASTE-06 (required) and TASTE-01's optional priority-bars glyph.

### isRTL chevron-flip + logical spacing for a "back" affordance

**Source:** `frontend/src/pages/TaskDetailPage.tsx:98-111`.
**Apply to:** TASTE-03's "‹ Back to app" link.

### Route-conditional shell chrome via existing `useRouterState` pathname

**Source:** `frontend/src/components/layout/AppShell.tsx:120,143-148` (already
reads pathname for drawer-close-on-navigate).
**Apply to:** TASTE-03's Sidebar suppression.

## No Analog Found

None — all six touchpoints are edits to existing, already-read files; no net-new
file requires an analog search.

## Metadata

**Analog search scope:** `frontend/src/pages/WorkBoard/`,
`frontend/src/components/layout/`, `frontend/src/components/settings/`,
`frontend/src/components/signature-visuals/`, `frontend/src/components/ui/`,
`frontend/src/index.css`, `frontend/src/styles/list-pages.css`,
`frontend/src/pages/TaskDetailPage.tsx`.
**Files read in full:** `KCard.tsx`, `board.css`, `BoardColumn.tsx`,
`WorkBoard.tsx`, `Sidebar.tsx`, `AppShell.tsx`, `SettingsNavigation.tsx`,
`SettingsLayout.tsx`, `DossierGlyph.tsx`, `Donut.tsx`, `label.tsx`,
`ProfileSettingsSection.tsx` (partial, form-field block), `settings.tsx` route.
**Pattern extraction date:** 2026-07-05
