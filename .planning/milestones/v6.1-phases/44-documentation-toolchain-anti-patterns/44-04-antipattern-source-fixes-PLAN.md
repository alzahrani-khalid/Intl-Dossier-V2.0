---
phase: 44-documentation-toolchain-anti-patterns
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
  - frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx
  - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
  - frontend/src/pages/MyTasks.tsx
  - frontend/src/components/ui/sidebar.tsx
  - frontend/src/components/calendar/CalendarEntryForm.tsx
autonomous: true
requirements: [LINT-01, LINT-02, LINT-03, LINT-04, LINT-05]
tags: [frontend, lint, a11y, i18n]
must_haves:
  truths:
    - 'D-10: scope is exactly WR-02..WR-06 and the six audit-listed files'
    - 'D-11: audit line numbers are anchors, not truth; inspect current code first'
    - 'D-12: verification uses targeted source checks plus pnpm -C frontend lint'
    - 'D-13: no new visual baselines are part of this source-fix plan'
  artifacts:
    - path: frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
      provides: WR-02 and WR-03 closure
    - path: frontend/src/pages/MyTasks.tsx
      provides: WR-05 closure
---

<objective>
Close the Phase 43 audit-listed WR-02..WR-06 anti-patterns in source without
broadening into a repo-wide a11y, i18n, or lint cleanup.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Fix OverdueCommitments WR-02/WR-03</name>
  <files>frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx</files>
  <read_first>
    - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
    - .planning/milestones/v6.0-MILESTONE-AUDIT.md
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-PATTERNS.md
  </read_first>
  <action>
Inspect current code before changing it.

For WR-02, remove any dead fallback branch of the shape `?? c.ownerInitials`
or equivalent fallback attached to a `t()` result. If no such branch remains,
record it as already fixed in the plan summary and do not invent a change.

For WR-03, remove duplicate `aria-label` values from controls whose visible
text already names the control. In the dossier group head button, create a
stable visible label ID and reference it:

```tsx
const headTitleId = `overdue-dossier-${group.dossierId}-title`
...
<button aria-labelledby={headTitleId} ...>
  ...
  <span id={headTitleId} className="card-title text-start truncate flex-1">
    {group.dossierName}
  </span>
</button>
```

Keep owner initials visible text. If an owner label is needed for context, make
it non-redundant by including the visible initials in the accessible name, not
replacing them with unrelated text.
</action>
<verify>
<automated>rg -n "\\?\\?\\s*c\\.ownerInitials|aria-label=\\{group\\.dossierName\\}" frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx && exit 1 || true</automated>
</verify>
<acceptance_criteria> - `rg "\?\?\s*c\.ownerInitials" frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx`returns no matches
    -`rg "aria-label=\\{group\\.dossierName\\}" frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx`returns no matches
    - The dossier head button contains`aria-labelledby`    - The visible dossier name span has an`id`
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Verify/fix DrawerCtaRow and VipVisits WR-03 duplicates</name>
  <files>frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx, frontend/src/pages/Dashboard/widgets/VipVisits.tsx</files>
  <read_first>
    - frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx
    - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
    - .planning/milestones/v6.0-MILESTONE-AUDIT.md
  </read_first>
  <action>
Inspect current code. Remove any `aria-label` that duplicates visible button,
link, or row text in the audit-listed CTA row and VIP visit row.

If the current code already exposes visible text without duplicate `aria-label`,
leave it unchanged and record the verified no-op in the summary. Do not add
extra labels to non-interactive rows unless axe requires an accessible name.
</action>
<verify>
<automated>rg -n "aria-label" frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx frontend/src/pages/Dashboard/widgets/VipVisits.tsx</automated>
</verify>
<acceptance_criteria> - `DrawerCtaRow.tsx` has no duplicate visible-text `aria-label` on the audit-listed CTA buttons - `VipVisits.tsx` has no duplicate visible-text `aria-label` on VIP rows - Any remaining `aria-label` in these files is for icon-only or non-visible-name controls only
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Fix MyTasks checkbox WR-05 with aria-labelledby</name>
  <files>frontend/src/pages/MyTasks.tsx</files>
  <read_first>
    - frontend/src/pages/MyTasks.tsx
    - frontend/src/pages/Dashboard/widgets/MyTasks.tsx
  </read_first>
  <action>
Replace the task checkbox accessible name with `aria-labelledby` pointing to
the visible task title. Inside the task row map, create:

```tsx
const titleId = `task-title-${task.id}`
```

Set the checkbox button to:

```tsx
aria-labelledby={titleId}
```

Remove the duplicate `aria-label` based on `task.title` or generic mark-done
copy. Put `id={titleId}` on the visible title text element, for example:

```tsx
<span id={titleId}>{task.title}</span>
```

Do not change the 44x44 hit area or task navigation behavior.
</action>
<verify>
<automated>grep -q "aria-labelledby={titleId}" frontend/src/pages/MyTasks.tsx && grep -q "id={titleId}" frontend/src/pages/MyTasks.tsx && ! rg -n "aria-label=.\*task\\.title|aria-label=\\{task\\.title" frontend/src/pages/MyTasks.tsx</automated>
</verify>
<acceptance_criteria> - `frontend/src/pages/MyTasks.tsx` contains `aria-labelledby={titleId}` - `frontend/src/pages/MyTasks.tsx` contains `id={titleId}` on visible title text - The checkbox button no longer has an `aria-label` derived from `task.title` - 44x44 checkbox hit area styles remain present
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 4: Verify/fix sidebar color and CalendarEntryForm namespace</name>
  <files>frontend/src/components/ui/sidebar.tsx, frontend/src/components/calendar/CalendarEntryForm.tsx</files>
  <read_first>
    - frontend/src/components/ui/sidebar.tsx
    - frontend/src/components/calendar/CalendarEntryForm.tsx
    - frontend/src/i18n/en/calendar.json
    - frontend/src/i18n/ar/calendar.json
  </read_first>
  <action>
For WR-04, remove any invalid `hsl(var(--sidebar))` wrapper around a token that
already resolves to a complete color. The mobile sidebar background should be
`backgroundColor: 'var(--sidebar)'` or a valid direct token reference. Do not
change unrelated `hsl(var(--sidebar-border))` or `hsl(var(--sidebar-accent))`
unless those tokens are also complete colors and fail CSS validation.

For WR-06, ensure `CalendarEntryForm.tsx` uses `useTranslation('calendar')` and
calendar-local keys such as `t('form.title_en')`. Remove stale
`t('calendar.form.*')` calls if any remain. Confirm EN and AR calendar resources
contain the referenced `form` keys.
</action>
<verify>
<automated>rg -n "hsl\\(var\\(--sidebar\\)\\)|calendar\\.form\\." frontend/src/components/ui/sidebar.tsx frontend/src/components/calendar/CalendarEntryForm.tsx && exit 1 || true</automated>
</verify>
<acceptance_criteria> - `rg "hsl\\(var\\(--sidebar\\)\\)" frontend/src/components/ui/sidebar.tsx` returns no matches - `rg "calendar\\.form\\." frontend/src/components/calendar/CalendarEntryForm.tsx` returns no matches - `CalendarEntryForm.tsx` contains `useTranslation('calendar')` - EN and AR `calendar.json` contain a top-level `form` object
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 5: Run targeted lint and source closure checks</name>
  <files>frontend source files listed in this plan</files>
  <read_first>
    - frontend/package.json
  </read_first>
  <action>
Run:

```bash
pnpm -C frontend lint
```

Then run targeted source checks:

```bash
rg -n "\?\?\s*c\.ownerInitials|aria-label=\{group\.dossierName\}|hsl\(var\(--sidebar\)\)|calendar\.form\." frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx frontend/src/components/ui/sidebar.tsx frontend/src/components/calendar/CalendarEntryForm.tsx
```

The second command must return no matches. For DrawerCtaRow and VipVisits,
inspect any remaining `aria-label` matches and document why they are not
visible-text duplicates.
</action>
<verify>
<automated>pnpm -C frontend lint</automated>
</verify>
<acceptance_criteria> - `pnpm -C frontend lint` exits 0 - Targeted `rg` closure command returns no matches - Any remaining `aria-label` in the six scoped files is documented as non-duplicative
</acceptance_criteria>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Mitigation |
|-----------|----------|-----------|------------|
| T-44-06 | Tampering | Scoped source files | Limit changes to WR-02..WR-06 files named in D-10 |
| T-44-07 | Denial of service | A11y fix introduces behavior regression | Preserve click handlers, 44px hit areas, and existing route behavior |
| T-44-08 | Repudiation | Already-fixed audit anchors | Record verified no-ops in summary instead of manufacturing changes |
</threat_model>

<verification>
1. `pnpm -C frontend lint`
2. Targeted `rg` checks for WR-02, WR-03, WR-04, WR-05, WR-06 patterns.
3. Manual inspection of remaining scoped `aria-label` attributes.
</verification>

<success_criteria>

- WR-02..WR-06 source patterns are closed or verified already closed.
- Scope remains exactly the six audit-listed files.
- Lint exits 0.
  </success_criteria>
