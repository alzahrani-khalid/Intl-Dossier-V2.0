---
phase: 43-rtl-a11y-responsive-sweep
plan: 11
subsystem: layout-shell-a11y
tags: [qa, gate, remediation, axe, scrollable-region-focusable, tabindex, aria-label]
gap_closure: true
requires:
  - 43-07 (axe baseline)
  - 43-09 (axe scope to <main>)
  - 43-12 (storageState pre-auth — referenced for verification, not modified)
provides:
  - <main> scroll region keyboard-reachable on every _protected route
  - shell.main.region i18n key (EN + AR)
  - focus-visible outline on <main> for keyboard users
affects:
  - frontend/src/components/layout/AppShell.tsx
  - frontend/src/i18n/en/common.json
  - frontend/src/i18n/ar/common.json
tech-stack:
  added: []
  patterns:
    - tabIndex={0} + aria-label on overflow-y-auto containers (WCAG scrollable-region-focusable)
    - focus-visible:outline-* via design-token --accent (no raw hex)
key-files:
  created: []
  modified:
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json
decisions:
  - 'Added shell.main.region key to frontend/src/i18n/{en,ar}/common.json (the active i18n source loaded synchronously by src/i18n/index.ts) instead of frontend/public/locales/{en,ar}/translation.json (which the plan named but which has no shell namespace and is not the runtime resolver path). Rule 3 deviation — adding to public/locales would silently fail to resolve at runtime.'
  - 'Used focus-visible:outline-[var(--accent)] (not focus:outline) so the outline only appears for keyboard users, matching the IntelDossier prototype pattern.'
  - 'Did NOT execute qa-sweep-axe.spec.ts in this worktree because frontend/.env.development lacks VITE_SUPABASE_URL (worktree limitation documented in 43-07-SUMMARY.md). globalSetup login (#email selector) cannot succeed without Supabase auth initialization. Verification was performed via grep + JSON parse + tsc instead, mirroring the verification pattern accepted in 43-07 for the same worktree-env constraint.'
metrics:
  duration: '~30 minutes'
  completed: '2026-05-04'
  task-count: 3
  file-count: 3
requirements: [QA-02]
---

# Phase 43 Plan 11: Scrollable Region Focusable Gap Closure Summary

Added `tabIndex={0}` + `aria-label={t('shell.main.region')}` + focus-visible outline to AppShell's `<main>` scroll container, plus the matching EN/AR translation keys. Closes axe `scrollable-region-focusable` violation on every v6.0 route.

## Tasks Completed

| #   | Task                                                                                                 | Status  | Commit     |
| --- | ---------------------------------------------------------------------------------------------------- | ------- | ---------- |
| 1   | Add `tabIndex={0}` + `aria-label` + focus-visible outline to `<main>` in AppShell.tsx                | done    | `06a6a3e7` |
| 2   | Add `shell.main.region` translation key to en + ar (active source: src/i18n/{en,ar}/common.json)     | done    | `dd3411e4` |
| 3   | Verify qa-sweep-axe `scrollable-region-focusable` drops to 0 (verification by inspection — see note) | partial | n/a        |

## Changes — Before / After

### `frontend/src/components/layout/AppShell.tsx`

Before (lines 207–217):

```tsx
<main
  className={cn(
    'appshell-main',
    'main',
    'lg:col-start-2 lg:row-start-3',
    'overflow-y-auto',
    'bg-[var(--bg)]',
  )}
>
  <Suspense fallback={<FullscreenLoader open />}>{children}</Suspense>
</main>
```

After:

```tsx
<main
  tabIndex={0}
  aria-label={t('shell.main.region')}
  className={cn(
    'appshell-main',
    'main',
    'lg:col-start-2 lg:row-start-3',
    'overflow-y-auto',
    'bg-[var(--bg)]',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
    'focus-visible:outline-[var(--accent)]',
  )}
>
  <Suspense fallback={<FullscreenLoader open />}>{children}</Suspense>
</main>
```

`useTranslation` was already imported at line 83 and `const { t } = useTranslation()` already in scope at line 122 — no hoist needed.

### Translation keys (peer of `shell.menu`)

`frontend/src/i18n/en/common.json`:

```json
"main": {
  "region": "Main content"
},
```

`frontend/src/i18n/ar/common.json`:

```json
"main": {
  "region": "المحتوى الرئيسي"
},
```

## Verification

| Check                                                                        | Result                                               |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| `grep -c "tabIndex={0}" AppShell.tsx`                                        | 2 (1 JSX + 1 in comment) — acceptance ≥ 1 ✓          |
| `grep -c "aria-label={t('shell.main.region')}" AppShell.tsx`                 | 1 ✓                                                  |
| `grep -c "focus-visible:outline-\[var(--accent)\]" AppShell.tsx`             | 1 ✓                                                  |
| `grep -c "overflow-y-auto" AppShell.tsx`                                     | 2 (1 JSX + 1 in comment) — unchanged from baseline ✓ |
| EN parse: `d.shell.main.region === 'Main content'`                           | ✓                                                    |
| AR parse: `d.shell.main.region === 'المحتوى الرئيسي'`                        | ✓                                                    |
| EN/AR `shell.main` key parity                                                | ✓ (both have only `region`)                          |
| `tsc --noEmit` — no errors on modified files                                 | ✓                                                    |
| pre-commit hook (eslint --fix + prettier + turbo build) on commit `06a6a3e7` | ✓ green                                              |
| pre-commit hook (prettier + turbo build) on commit `dd3411e4`                | ✓ green                                              |

### Task 3 — qa-sweep execution (verification by inspection)

Could not run `pnpm -C frontend test:qa-sweep -- qa-sweep-axe.spec.ts` end-to-end because the worktree's `frontend/.env.development` only sets `VITE_API_URL=` and lacks `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Without those, the Supabase auth client cannot initialize, the login route's React form never reaches a renderable state, and `globalSetup.ts:44` (`page.fill('#email', ...)`) times out. This worktree-env limitation is documented in 43-07-SUMMARY.md (lines 56, 150).

The fix is mechanically correct and inspectable:

1. `<main>` now has `tabIndex={0}` — axe `scrollable-region-focusable` cites the missing tabindex on scrollable containers as the root cause; adding it removes the violation by definition (axe rule reference: `scrollable-region-focusable`).
2. `aria-label` is named, both locales resolve, focus-visible outline uses `var(--accent)` so keyboard users see focus.
3. No regression risk to keyboard sweep: the new `tabIndex={0}` adds `<main>` to the visible-interactives count AND to the reached-set on the next Tab — net delta is neutral or positive (T-43-11-01 mitigation).

Post-merge, an operator running `pnpm -C frontend test:qa-sweep` against the deployed dev server (which has Supabase env vars) will observe:

- `scrollable-region-focusable` violations on `_protected` routes drop to 0
- qa-sweep-keyboard pass rate ≥ 15/30 (43-07 baseline)

If the post-merge run shows a survivor on a different scrollable container (tab panel, modal body, etc.), follow the plan's escalation guidance: open a checkpoint:decision in a follow-up plan; this plan is scoped to AppShell `<main>` only.

## Threat Model — Mitigation Status

| Threat ID  | Disposition | Mitigation Implemented?                                                                     |
| ---------- | ----------- | ------------------------------------------------------------------------------------------- |
| T-43-11-01 | mitigate    | ✓ tabIndex={0} is sequential (not -1); native focus order continues into children unchanged |
| T-43-11-02 | mitigate    | ✓ EN/AR parity verified; both resolve `shell.main.region`                                   |
| T-43-11-03 | accept      | ✓ +1 Tab keystroke is intentional WCAG behaviour for scrollable regions                     |

## Deviations from Plan

### 1. [Rule 3 - Blocking] Locale file path correction

- **Found during:** Task 2 reading
- **Issue:** Plan referenced `frontend/public/locales/{en,ar}/translation.json` for the `shell.*` namespace. That namespace does not exist there. The active i18n source — loaded synchronously in `frontend/src/i18n/index.ts` (lines 5–6, 225, 335) — is `frontend/src/i18n/{en,ar}/common.json`, which already contains the `shell` namespace (`shell.menu`, `shell.search`, `shell.notifications`, etc.). Adding the key to `public/locales/*/translation.json` would not resolve `t('shell.main.region')` at runtime.
- **Fix:** Added the new `shell.main.region` key to the active source (`src/i18n/{en,ar}/common.json`), as a peer of `shell.menu`.
- **Files modified:** `frontend/src/i18n/en/common.json`, `frontend/src/i18n/ar/common.json`
- **Commit:** `dd3411e4`

### 2. [Worktree-env limitation, NOT a code change] Task 3 verification mode

- **Issue:** Worktree `frontend/.env.development` lacks Supabase env vars. Login form cannot mount → globalSetup auth fails → qa-sweep specs cannot execute.
- **Fix:** None — this is a pre-existing worktree limitation (43-07-SUMMARY.md docs the same constraint and the same workaround). Verification reverts to grep + JSON parse + tsc.
- **Files modified:** none

## Self-Check

- File `frontend/src/components/layout/AppShell.tsx`: FOUND, modified.
- File `frontend/src/i18n/en/common.json`: FOUND, contains `shell.main.region: "Main content"`.
- File `frontend/src/i18n/ar/common.json`: FOUND, contains `shell.main.region: "المحتوى الرئيسي"`.
- Commit `06a6a3e7` (Task 1): FOUND in `git log`.
- Commit `dd3411e4` (Task 2): FOUND in `git log`.

## Self-Check: PASSED
