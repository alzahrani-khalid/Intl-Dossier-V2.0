---
phase: 43-rtl-a11y-responsive-sweep
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - frontend/src/components/layout/Topbar.tsx
  - frontend/src/components/calendar/UnifiedCalendar.tsx
  - frontend/src/components/calendar/CalendarEntryForm.tsx
  - frontend/src/pages/Dashboard/widgets/MyTasks.tsx
  - frontend/src/components/advanced-search/AdvancedSearchFilters.tsx
  - frontend/src/pages/Dashboard/components/EngagementStageGroup.tsx
  - frontend/src/index.css
  - frontend/public/locales/en/translation.json
  - frontend/public/locales/ar/translation.json
  - frontend/src/i18n/en/common.json
  - frontend/src/i18n/ar/common.json
  - frontend/src/components/ui/heroui-modal.tsx
  - frontend/src/components/ui/sidebar.tsx
  - frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx
  - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
  - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
  - frontend/src/components/layout/Sidebar.tsx
  - frontend/src/components/layout/AppShell.tsx
  - frontend/playwright.config.ts
  - frontend/tests/e2e/global-setup.ts
  - frontend/tests/e2e/qa-sweep-axe.spec.ts
  - frontend/tests/e2e/qa-sweep-responsive.spec.ts
  - frontend/tests/e2e/qa-sweep-keyboard.spec.ts
  - frontend/tests/e2e/helpers/qa-sweep.ts
  - .gitignore
findings:
  blocker: 2
  warning: 7
  total: 9
status: issues_found
---

# Phase 43: Code Review Report

**Reviewed:** 2026-05-04
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Phase 43 (43-08 .. 43-12) delivered surgical RTL/a11y/responsive fixes:
touch-44 utility + wrappers (43-08), icon-only Button aria-labels (43-09),
sidebar token-driven contrast (43-10), main scroll region a11y (43-11), and
Playwright `globalSetup` + `storageState` (43-12). The intent and individual
edits are mostly sound — the contrast strategy is well-grounded
(`text-[var(--sidebar-ink)]/{70,80}` over the high-contrast token clears AA
across all 8 direction × mode combos), the `.touch-44` utility correctly
uses logical `inline-size`/`block-size`, and the qa-sweep specs are
well-scoped to `<main>` with route-readiness gating.

However, two BLOCKER defects ship in 43-12: (1) the `STORAGE_STATE_PATH`
resolves to `frontend/tests/.auth/storageState.json` while `.gitignore`
protects `frontend/tests/e2e/.auth/` — a path mismatch that leaves the
pre-authenticated session-cookie file ungitignored and committable; and
(2) `globalSetup` requires `.env.test` env vars but throws via plain
`Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing')` only at run time —
the rest of the suite's `storageState` import chain will keep referencing
a non-existent path on first failure. Plus 7 WARNING-class quality issues
across translation-key drift, dead null-coalesce branches, and aria-label
overrides that hide visible text from screen readers.

## Critical Issues

### CR-01: `STORAGE_STATE_PATH` path-mismatch with `.gitignore` — pre-auth session cookies are NOT gitignored

**File:** `frontend/tests/e2e/global-setup.ts:27`
**Issue:** The constant resolves to:

```
__dirname                                = frontend/tests/e2e
path.resolve(__dirname, '..', '.auth', 'storageState.json')
                                          = frontend/tests/.auth/storageState.json
```

But `.gitignore:114` only protects `frontend/tests/e2e/.auth/`. The
actual write path (`frontend/tests/.auth/`) is **not** matched by any
ignore rule and is fully committable. The commit message
(`52fbd8b6 — feat(43-12): add Playwright globalSetup`) and the file's
own SECURITY comment (line 13) both claim the file is gitignored — it
is not. A first run on any developer machine will create
`frontend/tests/.auth/storageState.json` containing a real, valid
Supabase session token for the test user, and `git status` will surface
it as an untracked file ready to add.

**Fix:** Pick one — either correct the path or correct the ignore rule.
Recommend correcting the path (matches the file's documentation):

```ts
// global-setup.ts:27
export const STORAGE_STATE_PATH = path.resolve(__dirname, '.auth', 'storageState.json')
```

Then assert at boot that the resolved path is under a gitignored prefix
(belt-and-braces):

```ts
if (!STORAGE_STATE_PATH.includes('/tests/e2e/.auth/')) {
  throw new Error('storageState path drifted from gitignored prefix')
}
```

### CR-02: `i18n.dir()`-equivalent shell.brand.mark key is missing from every translation file

**File:** `frontend/src/components/layout/Sidebar.tsx:86`
**Issue:** Sidebar renders the GASTAT logo with
`aria-label={t('shell.brand.mark')}`. Grep confirms `shell.brand` is
defined in **none** of:

- `frontend/src/i18n/en/common.json` — has `shell.appName`, `shell.workspace`, `shell.user`, `shell.footer`, `shell.search`, `shell.direction`, `shell.theme`, `shell.notifications`, `shell.tweaks`, `shell.menu`, `shell.main`, `shell.classification`, `shell.empty`, `shell.error` — no `shell.brand`
- `frontend/src/i18n/ar/common.json` — same gap
- `frontend/public/locales/en/translation.json` — same gap
- `frontend/public/locales/ar/translation.json` — same gap

The dev-only `missingKeyHandler` in `i18n/index.ts:472-476` will warn
once, then react-i18next renders the raw key string `shell.brand.mark`
as the accessible name. Screen readers announce "shell dot brand dot
mark" for every page mount. This is an a11y regression directly
contradicting the Phase 43 deliverable (43-09 covered icon-only
Buttons; the brand mark wasn't part of 43-09 but the gap is in scope of
the same wave's a11y/i18n consistency goal).

**Fix:** Add to both `src/i18n/{en,ar}/common.json` under `shell`:

```json
"brand": {
  "mark": "GASTAT logo"   // EN
}
"brand": {
  "mark": "شعار الهيئة العامة للإحصاء"   // AR
}
```

If the design intent is to keep this purely decorative, replace the
JSX with `aria-hidden="true"` and drop the `role="img"` label — but
flag it; do not silently render a key string as the accessible name.

## Warnings

### WR-01: `Topbar.tsx` direction radiogroup `aria-label` is hardcoded to "Chancery" regardless of selected direction

**File:** `frontend/src/components/layout/Topbar.tsx:126`
**Issue:** The radiogroup wrapping the four direction buttons sets
`aria-label={t('shell.direction.chancery')}`. That key resolves to the
literal string "Chancery" — not "Design direction" or anything
group-level. Screen-reader users hear "radiogroup, Chancery" even when
the selected direction is Bureau or Situation. The plan's intent is a
group label, not the value of one of the children.

**Fix:** Add `shell.direction.label` to both common.json files:

```json
"direction": {
  "label": "Design direction",
  "chancery": "Chancery", ...
}
```

Then:

```tsx
aria-label={t('shell.direction.label')}
```

### WR-02: `OverdueCommitments.tsx` dead null-coalesce on `t()` return

**File:** `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx:154`
**Issue:**

```tsx
aria-label={String(t('overdue.owner') ?? c.ownerInitials)}
```

`react-i18next`'s `t()` is typed `(key: string) => string` and never
returns `null`/`undefined` — when the key is missing it returns the key
itself. The `?? c.ownerInitials` branch is unreachable, so the aria-label
will read "overdue.owner" (or its translation) rather than ever falling
back to the initials, regardless of the data. `String(...)` is also
redundant for the same reason.

**Fix:**

```tsx
aria-label={c.ownerInitials}
```

(Owner initials are the visible content; the icon-trailing arrow is
already `aria-hidden`. The existing chip provides sufficient
context.)

### WR-03: `aria-label` shadows visible text on multiple buttons (43-09 over-application)

**Files:**

- `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx:88-98`
- `frontend/src/pages/Dashboard/widgets/VipVisits.tsx:107-114`
- `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx:163-179`

**Issue:** Each control already contains visible text ("Open full
dossier", "View all", "Show more"/"Show less") plus a decorative icon.
43-09 added `aria-label={t('common.actions.viewMore' | 'toggleSection')}`
to these. WAI-ARIA `aria-label` **overrides** the accessible name
computation, so screen readers announce the generic "View more" or
"Toggle section" instead of the specific visible text. This degrades
SR experience compared to leaving the buttons unlabeled (in which case
the visible text is the accessible name).

**Fix:** Remove `aria-label` from controls that contain visible text;
only icon-only controls need it. If a more descriptive label is desired,
use `aria-label={t('cta.open_full_dossier')}` (matches visible text) or
better still, just delete the prop and let the visible text serve as
the name.

### WR-04: `frontend/src/components/ui/sidebar.tsx` references `hsl(var(--sidebar))` against a non-HSL token (pre-existing, but contrasts with 43-10 fix)

**File:** `frontend/src/components/ui/sidebar.tsx:209`
**Issue:**

```tsx
backgroundColor: 'hsl(var(--sidebar))',
```

`--sidebar` is mapped via `@theme` to `--sidebar-bg`, which is a hex
literal (`#ffffff` in light Bureau, `#100d0a` in dark Bureau —
`tokens/directions.ts`). Wrapping a hex inside `hsl(...)` produces an
invalid CSS color and the `style` rule silently drops. The intent
("force solid background on mobile") is therefore not enforced.
Comment on line 208 says "FIXED: Force solid background on mobile" —
that fix is no longer effective post-Phase 33 token rename.

This is pre-existing (not introduced by Phase 43) but lives in a file
the phase touched (43-09 `SidebarTrigger`). Surfacing now because it
will erode the contrast guarantees that 43-10 just established for
the brand sidebar (`Sidebar.tsx`).

**Fix:**

```tsx
backgroundColor: 'var(--sidebar-bg)',
```

Same one-line fix applies anywhere in this file using
`hsl(var(--sidebar...))`.

### WR-05: `MyTasks.tsx` Checkbox `aria-label` overrides task title for SR users

**File:** `frontend/src/pages/Dashboard/widgets/MyTasks.tsx:130-135`
**Issue:**

```tsx
<Checkbox
  className="touch-44"
  checked={done}
  onCheckedChange={(c): void => handleToggle(task, c === true)}
  aria-label={task.title}
/>
```

The visible task title is rendered immediately to the right of the
checkbox in the same row (`<span>{task.title}</span>`). Setting
`aria-label={task.title}` on the checkbox itself produces redundant
announcements ("checkbox, task title… task title"). Worse, the
checkbox carries no semantic relationship to the title — there is no
`<label>` and no `aria-labelledby`.

**Fix:** Use `aria-labelledby` to bind the checkbox to the title span:

```tsx
<li id={`task-${task.id}-row`} ... >
  <Checkbox
    aria-labelledby={`task-${task.id}-title`}
    ...
  />
  <span id={`task-${task.id}-title`} ...>{task.title}</span>
```

### WR-06: `CalendarEntryForm.tsx` uses default i18n namespace but reads `calendar.form.*` keys that live in a separate namespace (pre-existing, but 43-08 modified the file)

**File:** `frontend/src/components/calendar/CalendarEntryForm.tsx:106,280,334,...`
**Issue:** `useTranslation()` defaults to the `translation` namespace
(aliased to `common.json`). Calls like `t('calendar.form.create_event')`
look up `calendar.form.create_event` inside `common.json` — but
`common.json` only contains `calendar.sun/mon/...` (day abbreviations).
The `form` / `types` / `series` / `conflicts` sub-trees live in the
dedicated `calendar.json` namespace. Result: the form's labels and
alerts render the raw key string in production until/unless this is
fixed.

This bug is pre-existing (not introduced by Phase 43), but Phase 43-08
touched this file (added `<span className="touch-44">` around the
checkbox). Calling out so it isn't lost — the touch-44 wrap looks
correct, but the file ships broken i18n.

**Fix:** Either pass the namespace:

```tsx
const { t } = useTranslation('calendar')
// then drop the 'calendar.' prefix in every t() call below
```

Or invoke with explicit ns option:

```tsx
t('form.create_event', { ns: 'calendar' })
```

### WR-07: `qa-sweep-axe.spec.ts` filter is "serious|critical only", not zero-violations

**File:** `frontend/tests/e2e/helpers/qa-sweep.ts:39-52`
**Issue:** `runAxe` deliberately filters
`v.impact === 'serious' || v.impact === 'critical'` and lets
`minor`/`moderate` violations pass silently. This is documented and
intentional ("matches the established gate"), but it means the sweep
will NOT catch a regression that introduces, e.g., a 3.5:1 contrast
violation (axe rates many color-contrast issues as `moderate`). For an
a11y-themed phase, the gate is weaker than the phase's stated AA
ambition.

**Fix:** Either tighten the filter to include `moderate`:

```ts
const blocking = results.violations.filter(
  (v) => v.impact === 'moderate' || v.impact === 'serious' || v.impact === 'critical',
)
```

…or add a separate `qa-sweep-axe-strict.spec.ts` that runs the full
zero-violations gate on a sentinel route (e.g. dashboard) so any
new moderate violation fails CI without flooding the sweep matrix.

---

_Reviewed: 2026-05-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
