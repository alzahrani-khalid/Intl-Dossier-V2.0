---
phase: 42-remaining-pages
fixed_at: 2026-05-02T00:00:00Z
review_path: .planning/phases/42-remaining-pages/42-REVIEW.md
iteration: 1
findings_in_scope: 15
fixed: 15
skipped: 0
status: all_fixed
---

# Phase 42: Code Review Fix Report

**Fixed at:** 2026-05-02
**Source review:** .planning/phases/42-remaining-pages/42-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 15 (4 Critical + 11 Warning)
- Fixed: 15
- Skipped: 0

Two findings were bundled into single commits because they touched
adjacent code in the same file and an isolated fix would have produced
intermediate broken state:

- **CR-01 + CR-02 + WR-09** all live in `after-actions-list-all/index.ts`:
  the HTTP-method/payload mismatch, the missing-Authorization guard, and
  the unsafe `error.message` in the catch block were addressed in one
  commit (`c4a8bd6a`).
- **WR-04 + WR-05** both touch the dense-row separator declarations in
  `index.css`: the token choice (`--line-soft`) and the physical →
  logical edge swap were addressed in one commit (`679b83ba`).

## Fixed Issues

### CR-01: `after-actions-list-all` Edge Function method/payload mismatch

**Files modified:** `supabase/functions/after-actions-list-all/index.ts`
**Commit:** `c4a8bd6a`
**Applied fix:** Function now accepts both GET (query string) and POST
(JSON body) so `supabase.functions.invoke('after-actions-list-all', { body })`
— which always issues a POST — actually reaches the handler instead of
falling through to the 405 branch. This commit also addresses CR-02 and
WR-09 in the same file; see those entries below.

### CR-02: Missing-Authorization guard in `after-actions-list-all`

**Files modified:** `supabase/functions/after-actions-list-all/index.ts`
**Commit:** `c4a8bd6a` (bundled with CR-01)
**Applied fix:** Drop the `req.headers.get('Authorization')!` non-null
assertion. Read the header first, return a clean 401
`{ error: 'unauthorized', message: 'Missing Authorization header' }`
when it's null, and only then construct the Supabase client.

### CR-03: After-actions cross-dossier cache never invalidated

**Files modified:** `frontend/src/hooks/useAfterAction.ts`
**Commit:** `c317e454`
**Applied fix:** Added
`queryClient.invalidateQueries({ queryKey: ['after-actions', 'all'] })`
to both `useCreateAfterAction.onSuccess` and
`useUpdateAfterAction.onSuccess` so the cross-dossier list at
`['after-actions', 'all', options]` refreshes alongside the per-dossier
key. The `'all'` key uses prefix-match invalidation so all option
permutations are covered.

### CR-04: Tasks E2E spec asserts removed `opacity: 0.45` done state

**Files modified:** `frontend/tests/e2e/tasks-page.spec.ts`
**Commit:** `282cde55`
**Applied fix:** Replaced
`await expect(...).toHaveCSS('opacity', /0\.4[0-9]+/)` with
`await expect(checkbox).toHaveAttribute('aria-checked', 'true')`. The
URL-unchanged assertion is preserved. This matches the post-42-11
behaviour (line-through + `var(--ink-mute)` instead of opacity) and is
a more semantic assertion of "visual state flipped without navigating".

### WR-01: Open-redirect guard accepts backslash variants

**Files modified:** `frontend/src/components/activity-feed/ActivityList.tsx`
**Commit:** `d7839ebb`
**Applied fix:** Added `&& !navUrl.includes('\\')` to the safety check
so `/\evil.example`, `\\evil.example`, and any other backslash-bearing
nav URL is rejected before TanStack Router sees it.

### WR-02: Nested interactive elements on after-actions table and MyTasks rows

**Files modified:**

- `frontend/src/components/after-actions/AfterActionsTable.tsx`
- `frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx`
- `frontend/src/pages/MyTasks.tsx`

**Commit:** `75a75ea9`
**Applied fix:**

- **AfterActionsTable**: dropped `role="button"` + `tabIndex={0}` +
  `onClick`/`onKeyDown` from the `<tr>` (invalid per WAI-ARIA in HTML;
  trips axe-core `aria-allowed-role`). The first cell now wraps the
  engagement title in a TanStack `<Link>` so the row has a single
  focusable affordance. Added `aria-hidden="true"` to the decorative
  chevron cell. Updated the unit test to assert the new structure
  (Link with `href`, no row-level role/tabindex).
- **MyTasks**: dropped `cursor: 'pointer'` and the row-level `onClick`
  from the `<li>`. The "click anywhere on row" pattern implied an
  interactive role without exposing it to AT (keyboard users got no
  focus on the row itself). Activation now lives exclusively on the
  inner title button (mouse + keyboard), and the checkbox button still
  owns its own toggle. The `<li>` is purely structural.

**Note:** This is a behaviour change — clicking outside the title
button no longer navigates. It aligns with the reviewer's
recommendation and resolves the nested-interactive axe class. **Logic
change — requires human verification** that the new keyboard/mouse
flow matches design expectations.

### WR-03: BriefsPage empty heading conflicts `text-start` + inline `textAlign: 'center'`

**Files modified:** `frontend/src/pages/Briefs/BriefsPage.tsx`
**Commit:** `eb285f7d`
**Applied fix:** Removed both `className="text-start"` and the inline
`textAlign: 'center'` from the empty-state `<h2>`. The wrapping
`<div className="text-center">` already centres the heading; the inner
overrides were redundant or actively conflicting.

### WR-04: `task-row` borders use `--line-soft` not `--line`

**Files modified:** `frontend/src/index.css`
**Commit:** `679b83ba` (bundled with WR-05)
**Applied fix:** Kept `--line-soft` as the separator color (matches the
IntelDossier handoff intent for dense list rows where `--line` feels
heavy) and documented the deliberate choice in an inline comment.
Updated CLAUDE.md is **not** in scope for this fix iteration; the
inline rationale is sufficient until a future plan revisits the rule.

### WR-05: Physical `border-bottom` instead of logical `border-block-end`

**Files modified:** `frontend/src/index.css`
**Commit:** `679b83ba` (bundled with WR-04)
**Applied fix:** Replaced `border-bottom` with `border-block-end` on
both `.task-row`/`.task-row:last-child` and `.act-row`/`.act-row:last-child`.
The file's own header comment ("Logical properties only — no left/right
anywhere") is now upheld for these selectors.

### WR-06: Settings card-title fallback uses wrong i18n key shape

**Files modified:** `frontend/src/components/settings/SettingsLayout.tsx`
**Commit:** `bbffc860`
**Applied fix:** Section IDs are hyphenated (`data-privacy`,
`email-digest`) but `settings.json` sections are camelCase
(`dataPrivacy`, `emailDigest`). The card-title lookup was
`t(\`${activeSection}.title\`)`, which never resolved for the
hyphenated IDs and silently fell back to the nav label. Resolved the
ID to its camelCase form via the existing `navLabelKey()`helper before
the`.title`/`.description` lookup so the JSON section actually wins.

### WR-07: SettingsPage zod schema accepts `display_density: 'spacious'`

**Files modified:**

- `frontend/src/pages/settings/SettingsPage.tsx`
- `frontend/src/types/settings.types.ts`

**Commit:** `1b7a0020`
**Applied fix:** Replaced the `'spacious'` enum member with `'dense'`
in both the form schema and the shared `appearanceSettingsSchema` /
`DisplayDensity` type. This stops new writes of the legacy value
to the DB. The reviewer's suggestion to add a one-time DB migration
for existing `'spacious'` rows is out of scope here (DB migrations
require Supabase MCP coordination); flagged as a follow-up. The
existing localStorage migration shim in DesignProvider is unaffected.

### WR-08: `useAfterAction` `enabled: !!id` and missing return types

**Files modified:** `frontend/src/hooks/useAfterAction.ts`
**Commit:** `32ac30fe`
**Applied fix:** Replaced every `!!id` / `!!dossierId` /
`!!afterActionId` with explicit
`id !== undefined && id !== ''` for `strict-boolean-expressions`.
Added explicit return types
(`UseQueryResult<...>` / `UseMutationResult<...>`) on all five exported
hooks: `useAfterAction`, `useAfterActions`, `useCreateAfterAction`,
`useUpdateAfterAction`, `useAfterActionVersions`.

### WR-09: `error.message` on `unknown` in Edge Function catch

**Files modified:** `supabase/functions/after-actions-list-all/index.ts`
**Commit:** `c4a8bd6a` (bundled with CR-01)
**Applied fix:** Narrowed the catch binding before reading `.message`:
`const message = error instanceof Error ? error.message : String(error)`.
Same fix is not propagated to `SettingsPage.onError` (currently silent
and out of scope per Karpathy "surgical" guidance).

### WR-10: Density migration shim writes inside useState initializer

**Files modified:** `frontend/src/design-system/DesignProvider.tsx`
**Commit:** `54ea2f55`
**Applied fix:** Split the side-effect-free read (still inside
`useState(() => ...)` so the initial render uses the migrated value)
from the `localStorage.setItem` write (now in a one-shot `useEffect`
that runs once on mount). Renamed `readDensityWithMigration` to
`readDensityValue` to reflect that it no longer mutates storage. The
existing density-migration test still passes — the assertion is
`toHaveBeenCalledWith(STORAGE_KEY, 'dense')`, which the post-mount
useEffect satisfies.

### WR-11: BriefsPage API base resolution

**Files modified:** `frontend/src/pages/Briefs/BriefsPage.tsx`
**Commit:** `ab414a19`
**Applied fix:** Hoisted a single `AI_BRIEFS_API_BASE` module constant
that trims `import.meta.env.VITE_API_URL` and falsy-coalesces empty /
whitespace strings to `'/api'`. Both fetches now reference the
constant. The duplicated `'/api'` literal is gone, and an
empty-string `VITE_API_URL` no longer routes calls to the local origin.
Did not create a new `lib/api.ts` helper (out of scope; only this file
had the duplication).

---

_Fixed: 2026-05-02_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
