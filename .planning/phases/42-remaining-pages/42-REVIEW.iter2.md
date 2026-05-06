---
phase: 42-remaining-pages
reviewed: 2026-05-02T00:00:00Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - frontend/src/components/activity-feed/ActivityList.tsx
  - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
  - frontend/src/components/after-actions/AfterActionsTable.tsx
  - frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx
  - frontend/src/components/settings/SettingsLayout.tsx
  - frontend/src/components/settings/SettingsNavigation.tsx
  - frontend/src/components/settings/__tests__/SettingsLayout.test.tsx
  - frontend/src/components/settings/index.ts
  - frontend/src/components/settings/sections/AppearanceSettingsSection.tsx
  - frontend/src/components/signature-visuals/Icon.tsx
  - frontend/src/components/signature-visuals/__tests__/Icon.test.tsx
  - frontend/src/components/signature-visuals/index.ts
  - frontend/src/design-system/DesignProvider.tsx
  - frontend/src/design-system/__tests__/density-migration.test.tsx
  - frontend/src/hooks/__tests__/useAfterActionsAll.test.ts
  - frontend/src/hooks/useAfterAction.ts
  - frontend/src/i18n/ar/activity-feed.json
  - frontend/src/i18n/ar/after-actions-page.json
  - frontend/src/i18n/ar/briefs-page.json
  - frontend/src/i18n/ar/settings.json
  - frontend/src/i18n/ar/tasks-page.json
  - frontend/src/i18n/en/activity-feed.json
  - frontend/src/i18n/en/after-actions-page.json
  - frontend/src/i18n/en/briefs-page.json
  - frontend/src/i18n/en/settings.json
  - frontend/src/i18n/en/tasks-page.json
  - frontend/src/i18n/index.ts
  - frontend/src/index.css
  - frontend/src/pages/Briefs/BriefsPage.tsx
  - frontend/src/pages/Briefs/__tests__/BriefsPage.test.tsx
  - frontend/src/pages/MyTasks.tsx
  - frontend/src/pages/__tests__/MyTasksPage.test.tsx
  - frontend/src/pages/activity/ActivityPage.tsx
  - frontend/src/pages/settings/SettingsPage.tsx
  - frontend/src/routes/_protected/after-actions/index.tsx
  - frontend/tests/e2e/activity-page-visual.spec.ts
  - frontend/tests/e2e/activity-page.spec.ts
  - frontend/tests/e2e/after-actions-page-visual.spec.ts
  - frontend/tests/e2e/after-actions-page.spec.ts
  - frontend/tests/e2e/briefs-page-visual.spec.ts
  - frontend/tests/e2e/briefs-page.spec.ts
  - frontend/tests/e2e/page-42-axe.spec.ts
  - frontend/tests/e2e/settings-page-visual.spec.ts
  - frontend/tests/e2e/settings-page.spec.ts
  - frontend/tests/e2e/support/phase-42-fixtures.ts
  - frontend/tests/e2e/tasks-page-visual.spec.ts
  - frontend/tests/e2e/tasks-page.spec.ts
  - frontend/tests/e2e/touch-targets-42.spec.ts
  - frontend/tests/unit/i18n/phase-42-i18n-parity.test.ts
  - supabase/functions/after-actions-list-all/index.ts
findings:
  critical: 4
  warning: 11
  info: 6
  total: 21
status: issues_found
---

# Phase 42: Code Review Report

**Reviewed:** 2026-05-02
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

Phase 42 reskins five list/detail pages (Activity, After-actions, Briefs,
MyTasks, Settings) onto the IntelDossier handoff anatomy, ships a new
14-glyph `<Icon>` primitive, an `after-actions-list-all` Edge Function
for cross-dossier listing, and i18n bundles for the five pages. The
overall direction is sound and the test scaffolding (vitest +
Playwright + axe + i18n parity) is unusually thorough.

However, several **BLOCKER** issues will misbehave in production today:

1. The `after-actions-list-all` Edge Function is **dead-on-arrival** — the
   client invokes it via `supabase.functions.invoke(..., { body })` (a
   POST with JSON body), but the function only services `GET` and reads
   `url.searchParams`. Every call hits the 405 branch.
2. The same Edge Function will also crash with an unauthenticated
   `Authorization: null!` header when the JWT is missing, instead of
   returning 401.
3. `useUpdateAfterAction.onSuccess` invalidates the per-dossier cache key
   `['after-actions', dossier_id]` but never invalidates the new
   cross-dossier list `['after-actions', 'all', …]`, so the list page
   will show stale data after edits.
4. The Tasks E2E spec asserts `opacity: 0.4x` on done rows after the
   done-toggle — which is exactly the contrast bug that was removed in
   42-11 (see `MyTasksPage.test.tsx` test 3). The Playwright spec was
   never updated to match, so it will fail on the very first run after
   un-skip.

A second cluster of WARNINGs covers RTL/spec violations (raw `textAlign:
'center'` / `border-bottom` / `padding: 8px 6px`), token-policy
violations (`color: 'red'` in a unit test, mixed `border-bottom: 1px
solid var(--line-soft)` instead of `--line`), nested interactive
elements (`<button>` inside an `li[role="button"]`), an open-redirect
guard that misses backslash variants, and i18n drift between
SettingsLayout and `settings.json`.

## Critical Issues

### CR-01: `after-actions-list-all` Edge Function is unreachable from the client (HTTP method + payload mismatch)

**File:** `supabase/functions/after-actions-list-all/index.ts:21-32` and `frontend/src/hooks/useAfterAction.ts:230-246`

**Issue:**
The hook calls

```ts
supabase.functions.invoke('after-actions-list-all', { body: { ...options } })
```

`supabase.functions.invoke` issues a **POST with a JSON body** when
`body` is present (see `@supabase/functions-js`). The function rejects
anything other than GET:

```ts
if (req.method !== 'GET') {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, ... }
  );
}
```

…and reads filters from `url.searchParams`, which will be empty for the
POST call:

```ts
const status = url.searchParams.get('status') ?? 'published'
const limit = parseInt(url.searchParams.get('limit') || '20')
```

Net effect: **every production call to the after-actions list page
returns 405**, the table renders the error card, and the unit test
passes only because it mocks the invoke wholesale. The
`useAfterActionsAll` test verifies the _hook contract_ but never
verifies the _function contract_; the two have already drifted.

**Fix:**
Pick one transport and make both ends agree. Recommended (matches the
sibling functions like `after-actions-list` and `after-actions-get`):

```ts
// Edge Function — accept POST with JSON body
if (req.method !== 'POST' && req.method !== 'GET') {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, ... });
}

let status = 'published';
let limit = 20;
let offset = 0;
if (req.method === 'POST') {
  const body = await req.json().catch(() => ({}));
  status = typeof body.status === 'string' ? body.status : status;
  limit  = typeof body.limit  === 'number' ? body.limit  : limit;
  offset = typeof body.offset === 'number' ? body.offset : offset;
} else {
  const url = new URL(req.url);
  status = url.searchParams.get('status') ?? status;
  limit  = parseInt(url.searchParams.get('limit')  ?? String(limit));
  offset = parseInt(url.searchParams.get('offset') ?? String(offset));
}
```

Also add an integration/E2E test that calls the actual function (or at
least asserts the request method/body in `supabase.functions.invoke`
mock, which currently only checks the **name** and **body**, never the
HTTP shape).

---

### CR-02: `after-actions-list-all` crashes with a non-null assertion on missing `Authorization` header

**File:** `supabase/functions/after-actions-list-all/index.ts:17-19`

**Issue:**

```ts
{
  global: {
    headers: {
      Authorization: req.headers.get('Authorization')!
    }
  }
}
```

`Headers.get()` returns `string | null`. The `!` non-null assertion lies
to TypeScript: when the header is missing the value is literally `null`
(or, after the `!`, the runtime sees `null` cast to `string`). The
`createClient` call will then forward the literal string `"null"` (or
omit auth entirely depending on undici behaviour), which leaks into
RLS as an unauthenticated client. The catch-all `try/catch` then
swallows the error and returns 500 with `error.message`, masking what
should have been a clean 401.

This is the same pattern that was hardened in other Edge Functions in
this repo. There is **no guard** for the missing-token case.

**Fix:**

```ts
const authHeader = req.headers.get('Authorization')
if (authHeader === null) {
  return new Response(
    JSON.stringify({ error: 'unauthorized', message: 'Missing Authorization header' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } },
)
```

Drop the `!`. Add a test that exercises the unauthenticated path.

---

### CR-03: After-actions cross-dossier cache is never invalidated after create/update

**File:** `frontend/src/hooks/useAfterAction.ts:261-269` (`useCreateAfterAction.onSuccess`) and `:355-360` (`useUpdateAfterAction.onSuccess`)

**Issue:**
Both mutations invalidate `['after-actions', data.dossier_id]` but the
new cross-dossier list lives at `['after-actions', 'all', options]`.
After a user edits or publishes an after-action record, the
`/after-actions` list will keep showing the pre-edit row until a manual
refresh / GC. The cache-key contract that `useAfterActionsAll` is
explicit about ("intentionally distinct …") was never wired into the
invalidation paths.

The unit test `useAfterActionsAll.test.ts` verifies de-dup but doesn't
verify invalidation, so this regression has no guard.

**Fix:**
Invalidate both keys in both mutations:

```ts
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] })
  queryClient.invalidateQueries({ queryKey: ['after-actions', 'all'] }) // prefix match
  queryClient.invalidateQueries({ queryKey: ['engagement', data.engagement_id] })
  queryClient.setQueryData(['after-action', data.id], data)
},
```

Add a test that asserts both keys are invalidated after a successful
create / update.

---

### CR-04: Tasks E2E spec asserts the _removed_ opacity-0.45 done state — every run will fail after un-skip

**File:** `frontend/tests/e2e/tasks-page.spec.ts:23-29`

**Issue:**

```ts
test('done-toggle flips visual state without nav', async ({ page }) => {
  ...
  await page.locator('button.task-box').first().click()
  expect(page.url()).toBe(initialUrl)
  await expect(page.locator('li.task-row').first()).toHaveCSS('opacity', /0\.4[0-9]+/)
})
```

But Wave 2 plan 42-11 explicitly removed `opacity: 0.45` because every
child failed WCAG color-contrast — the unit test already asserts the
new behaviour:

```ts
// MyTasksPage.test.tsx test 3
expect(doneRow?.style.color).toBe('var(--ink-mute)')
expect(doneRow?.style.textDecoration).toContain('line-through')
expect(doneRow?.style.opacity).toBe('')
```

The E2E was never updated. The spec is currently un-skipped (no
`test.skip` wrapper) — first Playwright run will fail on this
assertion, blocking the build.

In addition, the toggle in MyTasks.tsx is _optimistic via the mutation
hook only_ — the row's `isDone` is derived from `task.status` directly
from the query result. Until the mutation returns and the query
refetches, the visual state will not flip at all. The `expect(toHaveCSS
opacity)` was never going to pass even before 42-11.

**Fix:**
Update the assertion to the post-42-11 behaviour:

```ts
const row = page.locator('li.task-row').first()
await page.locator('button.task-box').first().click()
await expect(row).toHaveCSS('text-decoration', /line-through/)
await expect(row).toHaveCSS('color', /(115|107|110)/) // var(--ink-mute) computed
```

Or simpler: assert `aria-checked="true"` on the checkbox and that the
URL didn't change. Drop the opacity matcher entirely.

---

## Warnings

### WR-01: Open-redirect guard in `ActivityList` accepts `'/\\evil.com'` (backslash variant)

**File:** `frontend/src/components/activity-feed/ActivityList.tsx:104-110`

**Issue:**
The R-05 guard rejects `//evil` correctly but does not reject the
backslash variant `/\evil.com/path` or `\\evil.com`:

```ts
const safeNavUrl =
  typeof navUrl === 'string' && navUrl.startsWith('/') && !navUrl.startsWith('//') ? navUrl : null
```

Some browsers (older Edge / IE-mode iframes) normalise `\` to `/` in
URLs, so `'/\\evil.example'` can render as `//evil.example` after the
URL parser. Tanstack Router's `navigate({ to })` does not validate this
either.

**Fix:**

```ts
const isSafePath =
  typeof navUrl === 'string' &&
  navUrl.startsWith('/') &&
  !navUrl.startsWith('//') &&
  !navUrl.startsWith('/\\') &&
  !navUrl.includes('\\')
```

Add a test case for the backslash variants alongside the existing
`'//evil.example'` case.

---

### WR-02: Nested interactive elements — `li[role="button"]` containing inner `<button>` violates WCAG and breaks keyboard semantics

**File:** `frontend/src/pages/MyTasks.tsx:245-329` and `frontend/src/components/after-actions/AfterActionsTable.tsx:107-122`

**Issue:**
`MyTasks.tsx` renders a `<li>` with `cursor: 'pointer'` and a click
handler that calls `goToTask`, then nests a `<button>` checkbox plus a
`<button>` title button. Although the `<li>` does NOT carry
`role="button"` here, the row uses `cursor: pointer` and an `onClick`,
behaving like a button without exposing it to assistive tech (keyboard
users get no focus on the row at all — navigation is only available via
the inner title button).

`AfterActionsTable.tsx:107-122` is worse: it sets
`role="button"` AND `tabIndex={0}` on a `<tr>`, which:

1. Is invalid HTML — `<tr>` is not allowed to have `role="button"`
   under WAI-ARIA in HTML.
2. Will be flagged by axe-core (`presentation-role-conflict` /
   `aria-allowed-role`) — the axe gate will fail once real data flows
   through.
3. The 6th `<td>` containing the chevron has no `aria-hidden` on the
   cell itself.

**Fix:**
For `AfterActionsTable`: drop `role="button"` from the `<tr>` and rely
on the inherent click + keydown handlers, OR wrap each row's content in
a single inner button-like span with proper role. The handoff
`.tbl-row` pattern uses `<a>` inside cells, not row-level role swaps.
For the keyboard path, put a focusable element in the first cell:

```tsx
<tr key={r.id} data-testid="after-action-row">
  <td>
    <a href={`/after-actions/${r.id}`} className="row-affordance">
      {engagementTitle}
    </a>
  </td>
  ...
</tr>
```

For `MyTasks`: make the row non-interactive at the `<li>` level (no
`onClick`, no `cursor: pointer`); wrap the title and metadata in a
single anchor or button that owns the keyboard activation. The current
"click anywhere on the row except a button" pattern is what causes the
nested-interactive axe-warning class.

---

### WR-03: `BriefsPage` empty state uses banned `textAlign: 'center'` AFTER `text-start` className

**File:** `frontend/src/pages/Briefs/BriefsPage.tsx:339-348`

**Issue:**

```tsx
<h2
  className="text-start"
  style={{
    fontFamily: 'var(--font-display)',
    fontSize: 18,
    textAlign: 'center', // ← inline style overrides text-start
  }}
>
  {t('empty.heading')}
</h2>
```

`text-start` (a logical-property utility) is set in `className` and
then immediately overridden by an inline `textAlign: 'center'`. This is
either dead code (className is a no-op) or a token-policy violation
(physical alignment instead of `start`/`end`). The CLAUDE.md rule is
explicit: never use physical alignment.

**Fix:** Remove `className="text-start"` if center is intended, OR drop
the inline `textAlign` and keep `text-start` for RTL correctness.
Choose one — the wrapping `<div className="text-center">` already
centres horizontally, so the inline `textAlign` is also redundant.

---

### WR-04: `task-row` borders use `--line-soft` not `--line` (token policy + visual drift)

**File:** `frontend/src/index.css:762` (`.task-row { border-bottom: 1px solid var(--line-soft); }`) and `:821` (`.act-row` same)

**Issue:**
The CLAUDE.md rule says "Borders are `1px solid var(--line)`." The
ported handoff selectors use `--line-soft` (a paler tint reserved for
skeleton placeholders elsewhere in the codebase). Either the policy is
wrong or the port is — either way the codebase now contradicts itself.

The handoff source uses `--line-soft` for separator lines specifically
because the rows are dense (8px padding-block) and the thicker `--line`
would feel heavy. That's a legitimate design choice, but the codebase
rule needs to be updated to allow it, OR these selectors should use
`--line`.

**Fix:** Either update CLAUDE.md to permit `--line-soft` for inline row
separators, OR change `.task-row` / `.act-row` to use `var(--line)`.
Document the decision in `42-DECISIONS.md`.

---

### WR-05: `task-row` uses physical `border-bottom` instead of logical `border-block-end`

**File:** `frontend/src/index.css:762, 766, 821, 826`

**Issue:**
Mixed conventions. The very same file uses `border-block-end` and
`inset-inline-start` for `settings-nav.active::before` (logical) but
falls back to `border-bottom` for `.task-row` and `.act-row`. In RTL
this is harmless because `border-bottom` is direction-agnostic, but the
inconsistency invites future copy-paste of physical properties into
places where it does matter (e.g. `border-left`).

The header comment in the file (`/* Logical properties only — no
left/right anywhere. */`) is already violated.

**Fix:**

```css
.task-row {
  border-block-end: 1px solid var(--line-soft);
}
.task-row:last-child {
  border-block-end: 0;
}
.act-row {
  border-block-end: 1px solid var(--line-soft);
}
.act-row:last-child {
  border-block-end: 0;
}
```

---

### WR-06: `t('${activeSection}.title')` defaults to `t('nav.${navLabelKey()}')` — wrong fallback

**File:** `frontend/src/components/settings/SettingsLayout.tsx:80-84`

**Issue:**

```tsx
{
  t(`${activeSection}.title`, { defaultValue: t(`nav.${navLabelKey(activeSection)}`) })
}
```

Looking at `settings.json`, every section already has a `.title`
(`profile.title`, `appearance.title`, etc.) so the defaultValue path is
unreachable for all current sections. But for `data-privacy` and
`email-digest` the section IDs contain hyphens — `t('data-privacy.title')`
will resolve correctly because i18next supports those, but the
camelCase remap in `navLabelKey('data-privacy')` returns `'dataPrivacy'`
making the fallback `t('nav.dataPrivacy')`. That fallback is technically
reachable for `email-digest` because `settings.json` has only
`emailDigest.title` (camelCase) but the lookup is `email-digest.title`
(hyphenated) → fallback fires → `t('nav.emailDigest')` → "Email Digest"
is shown as the _card title_ instead of the section title from the JSON.

The same divergence exists for `data-privacy` (json: `dataPrivacy.title`
"Data & Privacy" vs lookup: `data-privacy.title` → falls back to
`nav.dataPrivacy` "Data & Privacy"). It just happens to render the
right text by accident.

This will silently break the moment `nav.*` and `<section>.title`
diverge, e.g. when the EmailDigest section title becomes "Email digest
preferences" but the nav stays "Email Digest".

**Fix:** Pick a consistent key shape — either rename JSON to hyphenated
(`'data-privacy': { title: ... }`) or use camelCase IDs in the section
type. The current half-and-half is a future drift trap.

---

### WR-07: `SettingsPage.tsx` zod schema accepts `display_density: 'spacious'` — orthogonal to the 42-03 R-03 migration shim

**File:** `frontend/src/pages/settings/SettingsPage.tsx:49`

**Issue:**

```ts
display_density: z.enum(['compact', 'comfortable', 'spacious']),
```

But Plan 42-03 R-03 explicitly renamed the third density value from
`'spacious'` to `'dense'`, and the DesignProvider now migrates legacy
`'spacious'` → `'dense'` on read. The Settings save mutation will
upsert `display_density: 'spacious'` to the DB if the form has that
value, which the migration shim cannot ever clean up because it only
reads localStorage, never DB rows.

The radio group in `AppearanceSettingsSection.tsx` uses `'comfortable',
'compact', 'dense'` (line 128) but the form schema, default values,
and save path use `'spacious'`. The two are inconsistent.

**Fix:** Replace the enum with `['compact', 'comfortable', 'dense']`,
update `defaultUserSettings`, and add a one-time DB migration that
rewrites existing `'spacious'` rows to `'dense'`.

---

### WR-08: `useAfterAction.ts` floating promise + `enabled: !!id` violates `strict-boolean-expressions`

**File:** `frontend/src/hooks/useAfterAction.ts:183-198, 201-223`

**Issue:**
The `useAfterAction(id?: string)` and `useAfterActions(dossierId?:
string)` hooks use `enabled: !!id` and `enabled: !!dossierId`. The
ESLint rule `@typescript-eslint/strict-boolean-expressions` (set as
`error` per CLAUDE.md) does not accept the `!!` shortcut on
`string | undefined`.

Also several `useQuery` callers throw bare strings (`throw new
Error('After-action ID is required')`) inside the `queryFn`. With
`!!id` enabled-guard those branches are unreachable — dead code.

The same file lacks explicit return types on `useAfterAction`,
`useAfterActions`, `useCreateAfterAction`, `useUpdateAfterAction`,
`useAfterActionVersions` — all required by
`@typescript-eslint/explicit-function-return-type`.

**Fix:** Use explicit `id !== undefined && id !== ''` checks; add
explicit return types of `UseQueryResult<...>` /
`UseMutationResult<...>`.

---

### WR-09: Settings save uses `error.message` even when `error` is non-Error `unknown`

**File:** `frontend/src/pages/settings/SettingsPage.tsx:248-251` and `supabase/functions/after-actions-list-all/index.ts:99-104`

**Issue:**
The Edge Function's outer `try/catch` does

```ts
} catch (error) {
  return new Response(
    JSON.stringify({ error: error.message }),  // ← `error` is `unknown`
    { status: 500, ... }
  );
}
```

In Deno the catch binding is `unknown`, so `error.message` is a TS
error — but the file probably compiles because the function is plain
JS-style with no `--strict` Deno linter active in CI. Even if the
runtime survives, an `error` of type string ('boom') would crash with
"Cannot read property 'message' of string".

**Fix:**

```ts
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  return new Response(JSON.stringify({ error: message }), { status: 500, ... })
}
```

Same fix is needed on `SettingsPage.onError` (currently silent — fine,
but the toast says "saveError" with no detail).

---

### WR-10: Density migration shim writes to localStorage during render initialiser (StrictMode double-write)

**File:** `frontend/src/design-system/DesignProvider.tsx:92-99`

**Issue:**

```ts
function readDensityWithMigration(): Density | null {
  const raw = safeGetItem(LS_DENSITY)
  if (raw === 'spacious') {
    safeSetItem(LS_DENSITY, 'dense') // ← side-effect inside lazy initializer
    return 'dense'
  }
  return isDensity(raw) ? raw : null
}

const [density, setDensityState] = useState<Density>(() => {
  const migrated = readDensityWithMigration() // runs twice in StrictMode
  return migrated ?? initialDensity
})
```

Lazy state initialisers in React 18+ StrictMode run **twice** in dev.
The second invocation finds `'dense'` and is a no-op, so this is safe
in practice — but a side effect inside `useState(() => …)` is an
anti-pattern that the React docs explicitly warn against. The
density-migration test passes only because it counts post-mount
`setItem` calls and the second call writes the same value (deduped at
storage layer? no — duplicate writes will both register on the spy).
Re-check the test: `setItemSpy.mockClear()` before render means BOTH
StrictMode runs are observed; the assertion uses `toHaveBeenCalledWith`
not `toHaveBeenCalledTimes`, so it tolerates the duplicate. Functional
but fragile.

**Fix:** Move migration into a `useEffect` that runs once on mount:

```ts
const [density, setDensityState] = useState<Density>(() => {
  const raw = safeGetItem(LS_DENSITY)
  if (raw === 'spacious') return 'dense'
  return isDensity(raw) ? raw : initialDensity
})
useEffect(() => {
  if (safeGetItem(LS_DENSITY) === 'spacious') safeSetItem(LS_DENSITY, 'dense')
}, [])
```

---

### WR-11: `BriefsPage` API base resolution falls back to `/api`, no env validation

**File:** `frontend/src/pages/Briefs/BriefsPage.tsx:222, 484`

**Issue:**

```ts
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
```

Two problems:

1. The literal string `'/api'` is duplicated at lines 222 and 484 —
   keep one constant.
2. `import.meta.env.VITE_API_URL` is `string | undefined`. Since
   `??` only catches `undefined/null`, an empty-string `VITE_API_URL`
   silently routes calls to `/ai/briefs/...` (hitting the local origin
   instead of the API). The strict-boolean rule does not catch this.

**Fix:** Centralise the API base in a single helper:

```ts
// lib/api.ts
export const API_BASE: string = (import.meta.env.VITE_API_URL?.trim() ?? '') || '/api'
```

…and import it from BriefsPage and other consumers.

---

## Info

### IN-01: `Icon.tsx` test passes `style={{ color: 'red' }}` — token-policy violation in test code

**File:** `frontend/src/components/signature-visuals/__tests__/Icon.test.tsx:71`

**Issue:** The unit test asserts the style prop pass-through using
`color: 'red'` — a raw color literal. CLAUDE.md bans Tailwind colour
literals; while the test isn't shipped, copy-pasting this pattern into
production code is exactly the trap the rule prevents.

**Fix:** Use `color: 'var(--accent)'` or a semantically meaningless
value like `outline: '1px solid'` for the pass-through assertion.

---

### IN-02: `aria-hidden` typed as `boolean` accepts only `true`/`false`, never `"true"` string

**File:** `frontend/src/components/signature-visuals/Icon.tsx:38, 47`

**Issue:** `'aria-hidden'?: boolean` — but ARIA technically accepts
`true | false | "true" | "false" | undefined`. The component callers
pass `aria-hidden` (no value) which JSX coerces to `true` — works.
Other callers might pass the string `"true"` (legitimately) and TS
will reject it.

**Fix:** `'aria-hidden'?: boolean | 'true' | 'false'` — matches the DOM
attribute spec.

### IN-03: `formatRelativeTime` returns negative-time-friendly `Math.max(0, …)` but the AR/EN suffix sets diverge for the same magnitude buckets

**File:** `frontend/src/components/activity-feed/ActivityList.tsx:77-88`

**Issue:** Minor — `'5d'` for English uses `d` (days) but `'٥ي'` for
Arabic uses `ي` which is the abbreviation for "يوم" (day). All four
suffixes (`ث`, `د`, `س`, `ي`) are single Arabic letters; this is fine
but probably should be unit-tested for AR specifically (the test only
asserts `٥` digit substitution, not the suffix).

**Fix:** Add an AR test that the day bucket uses `ي`, hour `س`,
etc. Or better, surface them as i18n keys
(`activity-feed.relativeTime.{seconds,minutes,hours,days}`) so
translators can localise.

---

### IN-04: `BriefsPage` `pageCountFor` uses 2200 magic number

**File:** `frontend/src/pages/Briefs/BriefsPage.tsx:79`

**Issue:**
`const APPROX_CHARS_PER_PAGE = 2200` is at module scope (good) but
should live with the briefs domain alongside other heuristics. Also,
`Math.ceil(content.length / 2200)` is wrong for short briefs — a
12-char "summary" rounds up to 1 page (correct), but
`Math.max(1, ceil)` is redundant given the 1-char minimum.

**Fix:** Move to `@/domains/briefs/page-count.ts`. Drop the redundant
`Math.max(1, …)` since `content.length === 0` already short-circuits
to `'—'`.

---

### IN-05: i18n parity test shape mismatch with EN extra keys (informational)

**File:** `frontend/src/i18n/en/activity-feed.json` and `ar/activity-feed.json`

The two files appear key-aligned (the parity test passes), but there
are **190+ keys** total per locale, of which only `events.*`, `tabs.*`,
`empty.*`, `errorList`, and `title`/`subtitle` are actually consumed
by the new `ActivityList` + `ActivityPage`. The other ~150 keys
(`statistics.*`, `settings.*`, `emptyState.*`, `buttons.*`, `error.*`,
`filters.*`, `datePresets.*`, `entityTypes.*`, `actionTypes.*`,
`actions.*`, `follow.*`, `preferences.*`, `emailFrequency.*`,
`followReason.*`, `stats.*`, `hints.*`) are pre-Phase-42 and may be
dead — they're not flagged in the migration plan.

**Fix:** Out of scope for Phase 42, but worth a follow-up sweep. Run a
grep to find unreferenced keys in the activity-feed namespace and prune
the JSON accordingly. About 70% reduction is plausible.

---

### IN-06: SettingsLayout `SettingsEmptyState` exports an `icon: ElementType` slot but `Icon` is now reserved

**File:** `frontend/src/components/settings/SettingsLayout.tsx:174-179`

**Issue:** The `SettingsEmptyState` interface destructures
`icon: Icon` — shadowing the imported `Icon` from
`@/components/signature-visuals` if the file ever wants to use the
signature `<Icon>` for the empty-state. Currently no consumer uses
this component (the Settings index.ts re-exports it but no caller
references it), so this is latent.

**Fix:** Rename the local prop alias: `{ icon: IconComponent }` to
avoid shadowing the global `<Icon>` primitive name.

---

_Reviewed: 2026-05-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
