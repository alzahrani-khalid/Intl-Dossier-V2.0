---
phase: 44-documentation-toolchain-anti-patterns
reviewed: 2026-05-07T19:51:10Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - .github/workflows/ci.yml
  - frontend/.size-limit.json
  - frontend/scripts/assert-size-limit-matches.mjs
  - frontend/vite.config.ts
  - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
  - frontend/src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx
  - frontend/src/pages/MyTasks.tsx
  - frontend/src/components/calendar/CalendarEntryForm.tsx
  - frontend/tests/e2e/phase-44-antipatterns.spec.ts
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues
---

# Phase 44: Code Review Report

**Reviewed:** 2026-05-07T19:51:10Z  
**Depth:** standard  
**Files Reviewed:** 9  
**Status:** issues

## Summary

Reviewed the Phase 44 source, config, and test changes for correctness, CI reliability, accessibility, and test robustness. The size-limit guard is not reliable enough to protect the budgets it added: current patterns already match unintended chunks while the new assertion still exits successfully. The Playwright label-in-name spec also needs stronger surface assertions, and one reviewed form still has an unnamed, undersized icon button.

## Critical Issues

### CR-01: BLOCKER - Size-limit matcher accepts ambiguous budget globs

**File:** `frontend/scripts/assert-size-limit-matches.mjs:57`  
**Issue:** The new matcher only fails when a configured path matches zero files. That misses the current broken cases:

- `frontend/.size-limit.json:4` says `Initial JS (entry point)` but `dist/assets/index-*.js` currently matches 25 files because many route chunks are also named `index-*`.
- `frontend/.size-limit.json:39` says `signature-visuals/static-primitives` but `dist/assets/signature-visuals-*.js` also matches `signature-visuals-d3-*.js`.

This makes the CI budget measure the wrong files. The command currently prints `Initial JS (entry point): 25 file(s)` and `signature-visuals/static-primitives: 2 file(s)` but exits 0, so the new guard does not catch the exact drift it was added to prevent.

**Fix:** Make chunk names and budget globs unambiguous, then fail on unexpected match counts for singleton budgets.

```ts
// vite.config.ts
entryFileNames: 'assets/app-[hash].js',
chunkFileNames: 'assets/chunk-[name]-[hash].js',

manualChunks: (id) => {
  if (id.includes('/src/components/signature-visuals/')) {
    return 'signature-visuals-static'
  }
  // keep d3 as signature-visuals-d3
}
```

```json
{
  "name": "Initial JS (entry point)",
  "path": "dist/assets/app-*.js",
  "limit": "517 KB",
  "gzip": true,
  "running": false
},
{
  "name": "signature-visuals/static-primitives",
  "path": "dist/assets/signature-visuals-static-*.js",
  "limit": "64 KB",
  "gzip": true,
  "running": false
}
```

```js
const expectedMatches = new Map([
  ['Initial JS (entry point)', 1],
  ['React vendor', 1],
  ['TanStack vendor', 1],
  ['signature-visuals/d3-geospatial', 1],
  ['signature-visuals/static-primitives', 1],
])

const expected = expectedMatches.get(check.name)
if (matches.size === 0 || (expected !== undefined && matches.size !== expected)) {
  hasMissingMatch = true
  console.error(`${check.name}: expected ${expected ?? 'at least 1'} match, got ${matches.size}`)
}
```

## Warnings

### WR-01: WARNING - Phase 44 axe spec can pass without exercising the intended surfaces

**File:** `frontend/tests/e2e/phase-44-antipatterns.spec.ts:37`  
**Issue:** The tests run the `label-content-name-mismatch` axe rule after generic route waits, but they never assert that the dashboard widget, drawer body content, tasks list, or AR locale state actually rendered. The drawer path is especially weak because `openDrawerForFixtureDossier` tolerates `.drawer-body[data-loading="false"]` timing out, so these new tests can pass against a visible drawer shell or skeleton instead of the CTA/list content that contains the label-in-name risk.

**Fix:** Gate each axe scan on a concrete surface and locale assertion before `expectNoLabelInNameViolations`.

```ts
await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')

await expect(page.getByTestId('overdue-commitments-dossier-head').first()).toBeVisible()
await expect(page.locator('.drawer-body[data-loading="false"]')).toBeAttached()
await expect(page.getByTestId('dossier-drawer-commitments')).toBeVisible()
await expect(page.locator('ul.tasks-list')).toBeVisible()
await expect(page.locator('button.task-box').first()).toBeVisible()
```

### WR-02: WARNING - CI pins a pnpm version that does not match packageManager

**File:** `.github/workflows/ci.yml:14`  
**Issue:** CI installs `PNPM_VERSION: '10.18.3'`, but the root `package.json` declares `packageManager: pnpm@10.29.1...`. The comment at line 13 says this value must match. This drift weakens install reproducibility and can create CI-only lockfile or dependency-resolution behavior when local development uses the package-manager version.

**Fix:** Align the workflow with `package.json`, or let Corepack/action setup read the package-manager field.

```yaml
env:
  PNPM_VERSION: '10.29.1'
```

### WR-03: WARNING - Selected participant remove buttons have no accessible name and a 20px target

**File:** `frontend/src/components/calendar/CalendarEntryForm.tsx:568`  
**Issue:** The selected-participant remove control renders a ghost button with only an `X` icon and `className="h-5 w-5 p-0"`. There is no `aria-label` or visible text naming the action, and the hit target is 20 by 20 px. Screen-reader users cannot tell what the button does, and touch users get a target below the 44px interaction contract used elsewhere in this phase.

**Fix:** Add an action-specific accessible name, hide the decorative icon, and preserve a 44px hit target while keeping the visual glyph compact.

```tsx
<Button
  type="button"
  variant="ghost"
  size="sm"
  className="min-h-11 min-w-11 p-0 hover:bg-transparent"
  aria-label={t('form.remove_participant', {
    name: participant.participant_name || participant.participant_id,
  })}
  onClick={() => {
    setParticipants(participants.filter((p) => p.participant_id !== participant.participant_id))
  }}
  disabled={isPending}
>
  <X className="h-3 w-3" aria-hidden="true" />
</Button>
```

---

_Reviewed: 2026-05-07T19:51:10Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_
