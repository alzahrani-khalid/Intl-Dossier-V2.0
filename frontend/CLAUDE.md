# Frontend guidance (frontend/)

Directory-specific notes for the React 19 + Vite app. The root `/CLAUDE.md` is
authoritative for the design system, RTL rules, work-item terminology, and
dossier-centric patterns — read it first. This file documents only what is
specific to `frontend/src` and does not repeat the root.

## Stack snapshot (verified against the code)

- React 19, TypeScript strict, Vite, Tailwind CSS v4 (`@theme` in `src/index.css`).
- TanStack Router v5 (file-based) + TanStack Query v5 for server state.
- i18next with `react-i18next` (static-bundled — see i18n section below).
- Zustand for cross-cutting client state (`src/store/`); React Context for
  auth/theme/language/dossier (`src/contexts/`, `src/providers/`).

## Provider tree (where things mount)

`src/main.tsx` → `src/App.tsx`. `App.tsx` is the canonical provider order; if you
add a global provider, place it here, not in a route. The chain is:
`QueryClientProvider` → `AuthProvider` → `ThemeErrorBoundary` → `DesignProvider`
(`initialDirection="bureau"`) → `LanguageProvider` → `RTLWrapper` → `AppRouter`.
`import './i18n'` runs i18next init as a side effect from `App.tsx`.

## Routing (TanStack Router, file-based)

- `src/routeTree.gen.ts` is GENERATED. Never hand-edit it; it is git-tracked and
  regenerates on dev/build. It is also ESLint-ignored.
- Hierarchy: `routes/__root.tsx` (global providers: tooltip, keyboard shortcuts,
  tours, dossier context, command palette) → `routes/_protected.tsx` →
  feature routes under `routes/_protected/`.
- `_protected.tsx` is the auth gate: `beforeLoad` checks the live Supabase
  session (`supabase.auth.getSession()`), not just localStorage, and
  `throw redirect({ to: '/login' })` on failure. It also wraps `AppShell`,
  mounts the dossier/commitment/copilot drawers, and `validateSearch`-whitelists
  the `?dossier=<id>&dossierType=<type>` quick-look deep-link params.
- Heavy, optional surfaces are `lazy()`-imported to stay out of the entry chunk
  (e.g. `CopilotDrawer` in `_protected.tsx`). Bundle Size Check is a required CI
  gate (`.size-limit.json`) — prefer dynamic import for assistant-ui / markdown /
  chart weight.

## Domains (`src/domains/{feature}/`)

The canonical per-feature layout (verified across ~25 domains). Each domain owns:

- `repositories/<feature>.repository.ts` — plain `async function` exports over the
  shared API client (`apiGet`/`apiPost`/`apiPatch` from `@/lib/api-client`). No
  class, no React. This is the only layer that talks to the network.
- `hooks/use<Thing>.ts` — TanStack Query hooks that call the repository in
  `queryFn`/`mutationFn`. Do not call `fetch`/`apiGet` directly from a hook.
- `types/index.ts` — domain types (shapes also live under `src/types/*.types.ts`).
- `keys.ts` — a query-key factory object (e.g. `dossierKeys.list(filters)`); the
  single source of keys for that domain's queries and invalidations.
- `index.ts` — barrel; consumers import from `@/domains/<feature>`.

Mirror this when adding a feature. `domains/README.md` describes an aspirational
DDD layout (models/services/api) — the live structure is the leaner
`types/repositories/hooks` + `keys.ts` + `index.ts` shown above; follow the code.

## Components

- `src/components/ui/` — token-bound interactive primitives. Primitive cascade
  (root `/CLAUDE.md`): HeroUI v3 → Radix → build it yourself. The `heroui-*.tsx`
  and shadcn-derived wrappers exist for API compatibility; re-skin via tokens,
  never ship a library's default chrome.
- `aceternity-ui`, `kibo-ui`, and specific local files (`ui/3d-card`,
  `ui/bento-grid`, `ui/floating-navbar`, `ui/link-preview`) are ESLint-banned
  imports. `@dnd-kit/core` may only be imported inside `components/kanban/*` (and
  a few carved-out consumers); everywhere else use the `@/components/kanban`
  primitive. If no primitive fits, stop and ask before installing anything.
- Feature components live in kebab-case folders under `src/components/` with
  PascalCase filenames (see ESLint section).

## i18n (static bundle — `src/i18n/index.ts` is the source)

- All namespace JSON is imported and registered statically in
  `src/i18n/index.ts` (`resources.en` / `resources.ar`). There is NO http-backend.
- `frontend/public/locales/{en,ar}` still exists on disk but is DEAD — it is not
  wired into the loader. Editing it changes nothing at runtime. Add or edit
  strings under `src/i18n/{en,ar}/<ns>.json` and register the namespace in
  `index.ts`. An unregistered namespace silently falls back to English in BOTH
  languages (looks fine in EN, breaks AR). `pnpm lint` runs
  `scripts/check-i18n-namespaces.mjs` to catch drift.
- Separator gotcha: the init sets no `keySeparator`/`nsSeparator`/`defaultNS`, so
  i18next defaults apply — `:` separates namespace, `.` separates nested keys, and
  the default namespace is `common`/`translation`. Use the COLON form to address a
  namespace: `t('positions:create_dialog.toast_success')`. The dot form
  `t('positions.create_dialog...')` is read as a nested lookup inside the default
  `common` bundle, misses, and leaks the raw key. Array form
  `useTranslation(['ns'])` is fine; just keep the colon in the key.
- Language persists under localStorage key `id.locale` (NOT `i18nextLng`). Detector
  order is `querystring` first (so `?lng=ar` flips at first paint for visual specs),
  then `localStorage`/`cookie`. `isRTL`, `getDirection`, `switchLanguage` are
  exported from `index.ts` and keep `<html dir/lang>` in sync.

## RTL (logical properties only)

This app renders Arabic with `dir="rtl"`. ESLint (`no-restricted-syntax` +
`rtl-friendly`) ERRORS on physical Tailwind classes in `frontend/**` (the
`components/ui/**` wrappers are exempted). Always use logical utilities:

| Banned (errors)          | Use instead             |
| ------------------------ | ----------------------- |
| `ml-*` / `mr-*`          | `ms-*` / `me-*`         |
| `pl-*` / `pr-*`          | `ps-*` / `pe-*`         |
| `left-*` / `right-*`     | `start-*` / `end-*`     |
| `text-left`/`text-right` | `text-start`/`text-end` |
| `rounded-l/r-*`          | `rounded-s/e-*`         |
| `border-l/r-*`           | `border-s/e-*`          |

Flip directional icons with `className={isRTL ? 'rotate-180' : ''}`. Get `isRTL`
from `const isRTL = i18n.language === 'ar'`.

## Design tokens (see `src/design-system/CLAUDE.md` for depth)

All color comes from `var(--*)` tokens or the `@theme`-mapped Tailwind utilities in
`src/index.css` (`bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-accent`,
`text-danger`/`success`/`warning`/`info`, …). ESLint ERRORS on raw hex literals and
on Tailwind palette literals (`text-blue-500`, `bg-red-600`, etc.) anywhere in
`frontend/src`, including inside template strings. There is a narrow carve-out for
token-definition files and chart palettes (listed in `eslint.config.mjs`).

## ESLint per-directory filename case (enforced, CI-blocking)

`eslint-plugin-check-file` pins filename case by directory. Match it or `pnpm lint`
fails:

- `src/components/**` → PascalCase files (`UniversalDossierCard.tsx`); kebab-case
  folders. Carve-outs exist for colocated hooks/schemas/data files.
- `src/components/ui/**` → kebab-case files (`adaptive-dialog.tsx`).
- `src/hooks/**` → camelCase files (`useDossiers.ts`).
- `src/types/**` and `src/lib/**` → kebab-case files (`work-item.types.ts`).
- `__tests__/**` and ISO flag-codepoint files are exempt.

CI Lint runs over the whole repo (`--max-warnings 0`); the pre-commit hook only
lints staged files, so CI can catch case violations a local commit let through.

## Conventions specific to this app

- Imports: `@/…` → `frontend/src/…`; `@tests` → test utilities.
- Component default-exports are fine; everything else uses named exports.
- Query hooks set explicit `staleTime`/`gcTime`; reuse the domain key factory for
  invalidation rather than ad-hoc key arrays.
- No marketing voice, no emoji in user-visible copy, sentence case for titles and
  buttons (root `/CLAUDE.md` voice rules apply to all UI strings).
