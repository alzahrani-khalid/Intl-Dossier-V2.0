---
phase: quick
plan: 260413-djy
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/**/*.tsx
  - frontend/src/components/settings/SettingsLayout.tsx
  - frontend/src/components/commitments/PersonalCommitmentsDashboard.tsx
  - frontend/src/components/dossier/DossierDetailLayout.tsx
  - frontend/src/components/dossier/DossierLoadingSkeletons.tsx
  - frontend/src/components/calendar/CalendarSyncSettings.tsx
  - frontend/src/components/email/EmailDigestSettings.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - 'No page under frontend/src/pages/ duplicates MainLayout padding (container mx-auto, px-4 sm:px-6 lg:px-8)'
    - 'No file under frontend/src/pages/ uses raw gray Tailwind classes (bg-gray-*, text-gray-*, border-gray-*, divide-gray-*)'
    - 'Flagged component files also have duplicate padding removed'
  artifacts:
    - path: 'frontend/src/pages/'
      provides: 'Clean pages without duplicate padding or raw grays'
  key_links: []
---

<objective>
Fix UI consistency in frontend/src/pages/ files: remove double padding that duplicates MainLayout and replace raw gray Tailwind classes with semantic design tokens.

Purpose: Continuation of quick task 260413-d6h which fixed routes/\_protected/ files. This covers the remaining pages/ directory and flagged component files.
Output: Consistent padding and theming across all page-level components.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@frontend/src/components/layout/MainLayout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove duplicate padding from pages/ and flagged components</name>
  <files>
    All .tsx files under frontend/src/pages/ containing `container mx-auto` or responsive padding patterns (px-4 sm:px-6 lg:px-8, p-4 sm:p-6 lg:p-8).
    Also: frontend/src/components/settings/SettingsLayout.tsx, frontend/src/components/commitments/PersonalCommitmentsDashboard.tsx, frontend/src/components/dossier/DossierDetailLayout.tsx, frontend/src/components/dossier/DossierLoadingSkeletons.tsx, frontend/src/components/calendar/CalendarSyncSettings.tsx, frontend/src/components/email/EmailDigestSettings.tsx
  </files>
  <action>
MainLayout.tsx already provides `p-4 sm:p-6 lg:p-8 xl:mx-auto xl:w-full xl:max-w-[1600px]`. Pages rendered inside MainLayout must NOT duplicate this.

1. Search all files under frontend/src/pages/ for:
   - `container mx-auto` class combination
   - Responsive padding patterns: `px-4 sm:px-6 lg:px-8` or `p-4 sm:p-6 lg:p-8`
   - Any `container` class usage

2. For each match:
   - Remove the `container` class
   - Remove `mx-auto` that accompanies `container` (but KEEP `mx-auto` when paired with `max-w-*xl` for intentional width constraints like `max-w-4xl mx-auto`)
   - Remove responsive padding classes that duplicate MainLayout (px-4 sm:px-6 lg:px-8, p-4 sm:p-6 lg:p-8)
   - If removing leaves an empty className string, remove the className prop entirely
   - If removing leaves a wrapper div with no className and no other props, unwrap/remove the div

3. Apply the same fixes to the 6 flagged component files listed above.

4. Do NOT touch any padding inside cards, modals, or inner sections — only the outermost page-level container padding.
   </action>
   <verify>
   <automated>cd "/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0" && grep -rn "container mx-auto\|px-4 sm:px-6 lg:px-8\|p-4 sm:p-6 lg:p-8" frontend/src/pages/ frontend/src/components/settings/SettingsLayout.tsx frontend/src/components/commitments/PersonalCommitmentsDashboard.tsx frontend/src/components/dossier/DossierDetailLayout.tsx frontend/src/components/dossier/DossierLoadingSkeletons.tsx frontend/src/components/calendar/CalendarSyncSettings.tsx frontend/src/components/email/EmailDigestSettings.tsx 2>/dev/null | grep -v node_modules | wc -l | xargs test 0 -eq && echo "PASS: No duplicate padding found" || echo "FAIL: Duplicate padding still exists"</automated>
   </verify>
   <done>Zero occurrences of duplicate container/padding classes in frontend/src/pages/ and the 6 flagged component files. Pages rely solely on MainLayout for outer padding.</done>
   </task>

<task type="auto">
  <name>Task 2: Replace raw gray classes with semantic tokens in pages/</name>
  <files>All .tsx files under frontend/src/pages/ containing bg-gray-*, text-gray-*, border-gray-*, divide-gray-* classes</files>
  <action>
Search all files under frontend/src/pages/ for raw gray Tailwind classes and replace with semantic design tokens.

Replacement map:

- `bg-gray-50` -> `bg-muted`
- `bg-gray-100` -> `bg-muted`
- `bg-gray-200` -> `bg-muted`
- `text-gray-400` -> `text-muted-foreground`
- `text-gray-500` -> `text-muted-foreground`
- `text-gray-600` -> `text-foreground`
- `text-gray-700` -> `text-foreground`
- `text-gray-800` -> `text-foreground`
- `text-gray-900` -> `text-foreground`
- `border-gray-200` -> `border`
- `border-gray-300` -> `border`
- `divide-gray-200` -> `divide-border`
- `divide-gray-300` -> `divide-border`
- `hover:bg-gray-100` -> `hover:bg-accent`
- `hover:bg-gray-50` -> `hover:bg-accent`

Also handle dark mode variants: `dark:bg-gray-*`, `dark:text-gray-*`, `dark:border-gray-*` should be REMOVED (semantic tokens handle dark mode automatically via CSS variables).

Important:

- Process ALL ~19 files with ~54 occurrences
- Preserve any non-gray Tailwind classes on the same element
- Do not modify files outside frontend/src/pages/
  </action>
  <verify>
  <automated>cd "/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0" && grep -rn "bg-gray-\|text-gray-\|border-gray-\|divide-gray-" frontend/src/pages/ 2>/dev/null | grep -v node_modules | wc -l | xargs test 0 -eq && echo "PASS: No raw grays found" || echo "FAIL: Raw grays still exist"</automated>
  </verify>
  <done>Zero occurrences of raw gray Tailwind classes (bg-gray-_, text-gray-_, border-gray-_, divide-gray-_) in frontend/src/pages/. All replaced with semantic tokens that respect light/dark theming.</done>
  </task>

</tasks>

<verification>
1. `grep -rn "container mx-auto" frontend/src/pages/` returns zero matches
2. `grep -rn "bg-gray-\|text-gray-\|border-gray-\|divide-gray-" frontend/src/pages/` returns zero matches
3. `pnpm typecheck` passes (no broken imports or missing classes)
4. Visual spot-check: pages render without double padding gaps
</verification>

<success_criteria>

- All duplicate padding removed from pages/ and 6 flagged component files
- All raw gray classes replaced with semantic tokens in pages/
- TypeScript compilation succeeds
- No visual regressions (pages use MainLayout padding only)
  </success_criteria>

<output>
After completion, create `.planning/quick/260413-djy-fix-ui-consistency-part-2-remove-double-/260413-djy-SUMMARY.md`
</output>
