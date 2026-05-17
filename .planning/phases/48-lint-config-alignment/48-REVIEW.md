---
phase: 48-lint-config-alignment
reviewed: 2026-05-12T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - backend/package.json
  - backend/src/services/event.service.ts
  - backend/src/services/signature.service.ts
  - eslint.config.mjs
  - frontend/package.json
  - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
  - frontend/src/components/ai/ChatMessage.tsx
  - frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx
  - frontend/src/components/dossier/__tests__/DossierShell.test.tsx
  - frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx
  - frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx
  - frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts
  - frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts
  - frontend/src/components/signature-visuals/GlobeLoader.tsx
  - frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx
  - frontend/src/components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx
  - frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx
  - frontend/src/components/ui/COMPONENT_REGISTRY.md
  - frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts
  - frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx
  - turbo.json
findings:
  critical: 2
  warning: 5
  info: 5
  total: 12
status: issues_found
---

# Phase 48: Code Review Report

**Reviewed:** 2026-05-12
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Phase 48 consolidated ESLint config and fixed lint violations at call sites. Most of the work — the require → `vi.importActual` migrations, the Winston migration in `signature.service.ts`, the `event.service.ts` empty-interface → type-alias swap, and the eslint-disable cleanup in `GlobeLoader.tsx` — is mechanically sound and the chosen Shape A (top-of-file static import via `vi.importActual` in a `vi.mock(... async)` factory) is correct for the GlobeLoader test suite.

Two BLOCKER findings stop ship-readiness:

1. **`ChatMessage.tsx`** — the migration to logical border-radius classes introduced a **double-flip in RTL** (CLAUDE.md Rule 4 violation). The RTL conditional overrides that used to flip physical `bl/br` corners are now applied **on top of** logical `es/ee` classes that already auto-flip. In RTL, the user/assistant bubble "tail" now appears on the opposite physical corner from before — a visible behavioral regression.

2. **`COMPONENT_REGISTRY.md`** — the doc still recommends Aceternity UI as the **Primary** component library and Kibo-UI as **Secondary**, with explicit "shadcn → Aceternity" migration recommendations. This directly contradicts CLAUDE.md primitive cascade and the new `no-restricted-imports` rule added in this same phase. The file is the canonical UI registry that future agents will consult before adding components — it must be inverted now or it will silently re-introduce banned imports.

Additionally:

- The `no-restricted-imports` rule does not cover the **two existing local-alias importers** (`@/components/kibo-ui/kanban`) that the SUMMARY acknowledges are deferred. Defer the rename, but at minimum surface the deferral via an explicit `eslint-disable-next-line` at each call site so the deferred work is visible at the import line, not buried in a phase doc.
- Several test files (`DossierShell.test.tsx`, `CreateWizardShell.test.tsx`, `SharedBasicInfoStep.test.tsx`, `useCreateDossierWizard.test.ts`) are pure `it.todo()` / `expect(true).toBe(true)` placeholders. They satisfy file presence but provide zero behavioral coverage; flagging so the next phase doesn't mistake them for verified behavior.

---

## Critical Issues

### CR-01: ChatMessage.tsx — RTL double-flip on bubble corners

**File:** `frontend/src/components/ai/ChatMessage.tsx:79-85`

**Issue:** The migration from physical `rounded-bl-*` / `rounded-br-*` to logical `rounded-es-*` / `rounded-ee-*` left the RTL-conditional overrides in place. Logical classes already flip in RTL, so applying additional `isRTL && ...` overrides produces a double-flip — the bubble tail ends up on the wrong physical corner in RTL.

Trace (RTL, `isUser = true`):

- Base layer: `'rounded-2xl ... rounded-ee-md'` → in RTL, `ee` = bottom-LEFT (end = left in RTL) → tail bottom-left
- RTL override: `'rounded-ee-2xl rounded-es-md'` → in RTL, `ee` = bottom-left set back to `2xl`, `es` = bottom-RIGHT set to `md` → tail bottom-right
- **Net: tail at bottom-right in RTL**

Prior code (pre-migration, RTL `isUser`):

- Base layer: `'rounded-br-md'` (physical bottom-right; unconditional)
- RTL override: `'rounded-br-2xl rounded-bl-md'` → physical bottom-right back to 2xl, bottom-left to md → **tail at bottom-LEFT in RTL**

The two outputs are mirror-image — a visible regression. The same bug applies to the assistant case (`isRTL && !isUser && 'rounded-es-2xl rounded-ee-md'`), inverted symmetrically.

This is the exact "Rule 4 — never manually flip in RTL when logical properties already do it" anti-pattern from CLAUDE.md.

**Fix:** Drop the RTL override layer entirely; logical properties handle direction. Keep only the base layer:

```tsx
<div
  className={cn(
    'rounded-2xl px-4 py-3',
    isUser ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-muted rounded-es-md',
  )}
>
```

If the original intent of the RTL overrides was to swap which corner gets the smaller radius (i.e. the bubble's "tail" should always point at the avatar regardless of language), then because `flex-row-reverse` for the user row also inverts in RTL, the avatar/bubble relationship is preserved by logical properties alone — no override is needed. Add a Playwright visual-regression test at LTR + RTL for both `isUser` and `!isUser` to lock the behaviour.

---

### CR-02: COMPONENT_REGISTRY.md still endorses banned UI libraries

**File:** `frontend/src/components/ui/COMPONENT_REGISTRY.md:8-17, 23-43, 119-141`

**Issue:** The registry is the canonical UI component selection guide. After Phase 48 added `no-restricted-imports` to ban Aceternity and Kibo-UI per CLAUDE.md primitive cascade, the registry still says:

- L10: "**Aceternity UI** (Primary) - Use for all animated, interactive components"
- L11: "**Kibo-UI** (Secondary) - Use only when Aceternity doesn't have equivalent"
- L12: "**shadcn/ui** (Tertiary) - Use only for basic primitives not available elsewhere"
- L21-43: "Aceternity UI Components (19)" section listing 19 components as available with annotated columns suggesting shadcn alternatives should be upgraded
- L119-141: "Migration Recommendations" explicitly tells maintainers to upgrade `Card → 3D Card or Bento Grid`, `Input → Placeholders & Vanish Input`, `Navigation Menu → Floating Navbar`, etc.
- L146-156: Installation Commands section provides `npx shadcn@latest add "https://ui.aceternity.com/..."` and `npx shadcn@latest add "@kibo-ui/..."` — banned package shapes
- L195-200: Audit Checklist instructs "Check Aceternity UI catalog first" — directly inverted from the policy

Three of the four "deleted in Phase 48" annotations are correctly added (3D Card, Bento Grid, Floating Navbar), but the surrounding text contradicts those deletions. A future agent following the cascade documented here will install banned components and trigger the lint rule, or worse will not be using ESLint and will simply import what the registry recommends.

CLAUDE.md is unambiguous: "Aceternity UI — animation-heavy, marketing aesthetic. Conflicts with IntelDossier's restrained motion language. Do not install or import." and "Kibo UI — different visual system. Do not install or import."

**Fix:** Invert the cascade section + delete or strike-through Migration Recommendations. Concrete edits:

1. Replace L10-15 hierarchy with the CLAUDE.md cascade (HeroUI v3 → Radix → custom).
2. Move the "Aceternity UI Components (19)" section to a `## Removed / Banned` section with a one-line note: "Banned by CLAUDE.md primitive cascade. Existing files are deletion candidates; see ESLint `no-restricted-imports`."
3. Delete the "Migration Recommendations" section entirely, or replace it with: "Migration direction: away from Aceternity/Kibo, toward HeroUI v3 + Radix + custom."
4. Remove the "Aceternity UI" and "Kibo-UI" installation commands; replace with `npx heroui add <component>` (per HeroUI v3 docs).
5. Audit checklist: replace "Check Aceternity UI catalog first" with "Check HeroUI v3 first; then Radix headless; if neither fits, ask before installing custom."

---

## Warnings

### WR-01: no-restricted-imports does not cover the two known local-alias importers

**File:** `eslint.config.mjs:113-145`, with call sites at:

- `frontend/src/components/assignments/EngagementKanbanDialog.tsx:21`
- `frontend/src/pages/engagements/workspace/TasksTab.tsx:25`

**Issue:** The inline comment at L107-112 acknowledges that `@/components/kibo-ui/kanban` is also banned by CLAUDE.md but defers the refactor. The two existing call sites continue importing it. The `patterns` group blocks the **deleted** component paths (`@/components/ui/3d-card`, `@/components/ui/bento-grid`, `@/components/ui/floating-navbar`, `@/components/ui/link-preview`) but does NOT block `@/components/kibo-ui/*`. This means:

- A new file added today can freely import `@/components/kibo-ui/kanban` and lint will pass — the very thing the rule is supposed to prevent.
- The deferral has no enforcement floor — there is nothing stopping the two existing importers from growing to three or four during the deferral window.

The phase comment frames this as a "scope-management trade-off" but at least one of the two outcomes should hold:
(a) ban `@/components/kibo-ui/*` in the `patterns` group, and add explicit `eslint-disable-next-line` at the two known call sites with a TODO referencing this phase, OR
(b) document an exception override (e.g. an `overrides:` block scoped to the two files) so the import is allow-listed by path, not by rule omission.

Right now there is no signal at all that those two files are exceptional.

**Fix:** Add `@/components/kibo-ui/*` to the `patterns.group` array, and add two-line eslint-disable directives at the two known call sites:

```ts
// eslint.config.mjs patterns.group additions:
group: [
  'aceternity-ui/*',
  '@aceternity/*',
  'kibo-ui/*',
  '@kibo-ui/*',
  '@/components/kibo-ui/*',  // ADD — deferred refactor; see 48-02-SUMMARY.md
  '@/components/ui/3d-card',
  // ...
],

// EngagementKanbanDialog.tsx:21 + TasksTab.tsx:25 prefix:
// eslint-disable-next-line no-restricted-imports -- Phase 48 deferred; see 48-02-SUMMARY.md
import { ... } from '@/components/kibo-ui/kanban'
```

This keeps the deferred work visible at the import line.

---

### WR-02: Hollow placeholder tests in dossier wizard suite

**Files:**

- `frontend/src/components/dossier/__tests__/DossierShell.test.tsx` (7 `it.todo()` only, zero assertions)
- `frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx` (one real import-check test; the other two are `expect(true).toBe(true)`)
- `frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx` (one import-check; three `expect(true).toBe(true)`)
- `frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts` (one import-check only)

**Issue:** These tests look passing in CI but verify almost nothing. `expect(true).toBe(true)` cannot fail; `it.todo` does not run. They satisfy a file-presence requirement but produce a misleading green signal: a downstream agent reading "33 tests passing" will assume the wizard is behaviour-covered when it is not.

This is not introduced by Phase 48 — these files existed before — but Phase 48 touched them (the diff is in scope for this review per the workflow's file list). Flagging because the lint config change makes these files lint-clean, which makes the empty assertions look intentional rather than provisional.

**Fix:** One of:
(a) Add a top-of-file `// TODO(phase-XX): convert placeholder tests to real assertions` block referencing a follow-up phase, or
(b) Remove the `expect(true).toBe(true)` lines and replace them with `it.todo(...)` so they don't count toward the passing-test total.

`useDraftMigration.test.ts` is a good counter-example in the same directory — it has actual assertions over five behaviours.

---

### WR-03: GlobeLoader.tsx still has 5 `as any`/`as never` casts after disable cleanup

**File:** `frontend/src/components/signature-visuals/GlobeLoader.tsx:69, 81, 88, 95, 104, 105, 106, 117, 118, 119`

**Issue:** The 7 prior `// eslint-disable-next-line @typescript-eslint/no-explicit-any` directives were removed in this phase. That was correct because the frontend override sets `@typescript-eslint/no-explicit-any: 'off'` (eslint.config.mjs:91) — so the disables were vacuous noise.

However, the **underlying type-unsafety** is still in the file in two shapes:

- `path({ type: 'Sphere' } as never)` — five occurrences (L81, L104, L117 in the rendering paths)
- `d3.geoPath(projection as any)` (L69), `path(graticule as any)` (L88, L105, L118), `path(countries as any)` (L95, L106, L119)

The casts existed to silence lint but mask a real `d3-geo` typing problem (`geoPath` and the path generator are typed for `GeoPermissibleObjects` but the call sites pass projections and graticule objects with looser types).

Phase 48 declared "no behavior changes" so leaving the casts is in-scope; but the file is **less type-safe than the prior version implied** (when the disables were present, a reader saw "this is knowingly unsafe at line X"; now those signals are gone and the casts blend in). When Phase 2 enables `no-explicit-any` for frontend, every one of these will become a lint error all at once.

**Fix:** Two options:

(a) Replace `as any` with the proper d3-geo types now (low effort; the types are exported by `d3-geo` and we already `import('d3-geo')` for them):

```ts
import type { GeoPermissibleObjects } from 'd3-geo'

const path = d3.geoPath(projection) // remove cast — projection is GeoProjection
sphere.setAttribute('d', path({ type: 'Sphere' }) ?? '') // typed sphere
grat.setAttribute('d', path(graticule as GeoPermissibleObjects) ?? '')
land.setAttribute('d', path(countries as GeoPermissibleObjects) ?? '')
```

(b) Re-add narrowly-scoped `eslint-disable-next-line` directives at the cast lines with a TODO comment, so when Phase 2 enables the rule the work is pre-staged. Option (a) is preferred because option (b) re-introduces the noise this phase removed.

---

### WR-04: signature.service.ts notifySignatories loses structured logging shape

**File:** `backend/src/services/signature.service.ts:355`

**Issue:** The Winston migration replaced `console.log(\`Notifying ${contact.email} ...\`)`with`logInfo(\`Notifying ${contact.email} ...\`)`. The new call passes a single interpolated string. Every other Winston call site in the same phase (`event.service.ts:189, 229, 249, 294, 322`) uses the structured form `logInfo('Event created', { eventId: data.id, createdBy })`.

Consequences:

- The email address is embedded in the message text rather than indexed metadata; downstream log search by recipient is harder.
- A PII flag — emails in structured metadata can be redacted by a Winston format transform; emails inside the `message` string cannot.
- Style inconsistency: the file now mixes the migrated form and the legacy style.

**Fix:**

```ts
logInfo('Notifying signatory about signature request', {
  contactEmail: contact.email,
  contactId: signatory.contact_id,
  requestId: request.id,
})
```

If `contact.email` is considered PII even in structured logs, log only the `contactId` and rely on a separate audit table for the email-side correlation.

---

### WR-05: Backend lint script uses `cd ..` which couples to monorepo root

**File:** `backend/package.json:13`, `frontend/package.json:17`

**Issue:** Both package-local `lint` scripts contain `cd .. && eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}'`. This depends on the package directory always being one level below the monorepo root. The dependency is implicit (no env var, no path resolution) and breaks any of:

- A future migration to nested workspaces (`packages/frontend/`)
- A developer running `pnpm exec eslint` directly from inside the package without going through the script
- Turbo's remote cache hash includes the package script body but not the `cd` target, so a structural move would silently produce a different lint scope without invalidating cache

This is also redundant with Turbo's per-task cwd handling — Turbo invokes scripts from the package directory by design. The `cd ..` is there because ESLint flat config resolution wants the config file in cwd, not in a parent. The cleaner pattern is to point at the config explicitly with `--config ../eslint.config.mjs` from the package, no `cd` required.

**Fix:**

```json
// backend/package.json
"lint": "eslint --config ../eslint.config.mjs --max-warnings 0 'src/**/*.ts'",

// frontend/package.json
"lint": "eslint --config ../eslint.config.mjs --max-warnings 0 'src/**/*.{ts,tsx}'",
```

Note also that the glob in frontend's script is `'frontend/src/**/*.{ts,tsx}'` (works from repo root after `cd ..`), but in backend it is `'backend/src/**/*.ts'` (also from repo root). Both should be `'src/**/*.{ts[,tsx]}'` after removing `cd ..` so the glob matches the package's own files.

---

## Info

### IN-01: ActivityList.test.tsx — `let i18nLanguage` declared after mock that captures it

**File:** `frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx:33-64, 67`

**Issue:** The `vi.mock('react-i18next', () => ({ ... i18n: { language: i18nLanguage } ... }))` factory captures `i18nLanguage` by closure. The variable is declared at line 67, **after** the `vi.mock` call. Vitest's `vi.mock` hoisting moves the factory call to before any other imports — but the factory **body** does not execute until first invocation of `useTranslation()` inside a test. By that time `i18nLanguage` is initialized to `'en'`. This works.

The fragility: if the factory body ever moves to using the captured variable at module-init time (e.g. const folding), or if a future contributor inlines the variable read, the initialization order will matter. This is a known footgun in Vitest mock hoisting.

**Fix:** Move `let i18nLanguage = 'en'` above the `vi.mock` call to make the temporal-dead-zone safety explicit:

```ts
// ---- mocks (must be declared BEFORE the SUT import; vi.mock is hoisted) ----
let i18nLanguage = 'en'  // captured by the react-i18next mock factory below
const navigateSpy = vi.fn()

vi.mock('react-i18next', () => ({ ... language: i18nLanguage ... }))
```

The comment block on lines 23 and 67 already explain the ordering — the actual ordering should match.

---

### IN-02: useWorkItemDossierLinks.ts — `(item: any)` cast in transform

**File:** `frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts:66`

**Issue:** `(data ?? []).map((item: any) => ...)` discards Supabase's generated row type. The frontend override sets `no-explicit-any: 'off'` so lint passes, but the `WorkItemDossierLink` return shape is type-checked by hand on the next ten lines — exactly the maintenance burden the strict-typing rule is meant to surface.

Not introduced by Phase 48 (the file was not modified in the diff per the workflow context, but is included in the file list — flagging for the next phase). Suggests this hook should consume the generated `database.types.ts` row type.

**Fix:** Replace with the generated row type or a Zod schema parse:

```ts
import type { Database } from '@/types/database.types'
type WorkItemDossierRow = Database['public']['Tables']['work_item_dossiers']['Row'] & {
  dossiers: Pick<Database['public']['Tables']['dossiers']['Row'], 'id' | 'name_en' | 'name_ar' | 'type' | 'status'> | null
}
const links: WorkItemDossierLink[] = ((data ?? []) as WorkItemDossierRow[]).map((item) => ({ ... }))
```

---

### IN-03: eslint.config.mjs RTL `no-restricted-syntax` regexes are loose

**File:** `eslint.config.mjs:148-198`

**Issue:** The selectors use `\b` word-boundary anchors but match the prefix only (e.g. `Literal[value=/\\bml-/]`). This produces false positives on:

- String literals like `'<x-ml-toggle>'` or `'name-ml-suffix'`
- Error messages or hint text that legitimately contain the substring `ml-`
- The CreateDossierHub test fixture (`frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx:73-83`) had to **build pattern strings at runtime to dodge the lint rule** — a clear sign the rule is over-matching for legitimate test cases.

The fix is to anchor on digit suffix:

```js
selector: 'Literal[value=/\\bml-\\d/]',
```

This still catches every real Tailwind `ml-0`, `ml-1`, `ml-auto`-style violation (note that `ml-auto` would not match `\\d` and would need a separate alternation: `/\\bml-(?:\\d|auto|px)/`).

**Fix:** Tighten each of the 12 selectors to require a Tailwind-shaped suffix, or accept the false-positive workaround already in `CreateDossierHub.test.tsx`. The runtime-pattern workaround should not become the project norm.

---

### IN-04: turbo.json lint task has no `inputs` declaration

**File:** `turbo.json:19-21`

**Issue:** The `lint` task has `outputs: []` but no `inputs:`. Turbo's default input set is "all files in the package" — so any file change invalidates lint cache. That's safe (no missed runs) but coarse — a doc-only change in `frontend/` re-lints all of `frontend/src/`.

The new `globalDependencies: ["**/.env.*local", "eslint.config.mjs"]` correctly captures cross-package config changes. Adding `inputs: ["src/**/*.{ts,tsx}", "package.json"]` would narrow the cache key without losing correctness.

**Fix:** Optional optimization, not a correctness issue. Add per-task inputs:

```json
"lint": {
  "inputs": ["src/**/*.{ts,tsx}", "package.json", "../eslint.config.mjs"],
  "outputs": []
}
```

---

### IN-05: event.service.ts CreateEventDto interface still has loose `string` widening

**File:** `backend/src/services/event.service.ts:9, 19, 28`

**Issue:** Tangential to the empty-interface fix, but: `type: 'meeting' | 'conference' | ... | string` and `status: 'draft' | 'scheduled' | ... | string` make the union effectively `string` because `string` widens to absorb the literals. The literals are documentation-only with no compile-time enforcement. Pre-existing pattern; flagging because the Phase 48 diff touched this file and the next reviewer may assume the literal union is enforced.

**Fix:** Remove the `| string` widening and add a documented escape hatch only where database rows may legitimately produce out-of-enum values:

```ts
export type EventType = 'meeting' | 'conference' | 'workshop' | 'ceremony' | 'visit' | 'other'

export interface Event {
  // ...
  type: EventType // exact union, not widened
  // ...
}
```

If a downstream row from `event_details` view can return a non-literal, narrow it at the boundary with a Zod parse or a runtime guard, not by widening the type.

---

_Reviewed: 2026-05-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
