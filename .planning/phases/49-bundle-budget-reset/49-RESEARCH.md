# Phase 49: Bundle Budget Reset - Research

**Researched:** 2026-05-12
**Domain:** Vite/Rollup chunking, React.lazy, size-limit, GitHub branch protection
**Confidence:** HIGH for stack + patterns, MEDIUM for D-02 1.8 MB attainability (verifiable only post-audit)

## Summary

Phase 49 is a **measurement-and-tuning phase**, not a build-tooling rewrite. Three concrete surgeries land on a typed + linted baseline (Phases 47/48 closed): (a) rewrite `frontend/.size-limit.json` ceilings to measured-plus-5KB-headroom values per D-01..D-03 + D-07 new sub-vendor entries, (b) extend the existing `manualChunks` arrow in `frontend/vite.config.ts` with three required sub-vendor branches (`heroui-vendor`, `sentry-vendor`, `dnd-vendor`) plus two optional (`tiptap-vendor`, `exceljs-vendor`), and (c) convert audit-identified ≥30 KB gz non-initial-path components to `React.lazy()` following the eight existing call-site patterns already in the codebase. A two-smoke-PR proof gates BUNDLE-03 closure exactly like Phase 47 D-13 / Phase 48 D-16.

The branch-protection update is a single `gh api PUT` against `repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` adding `"Bundle Size Check (size-limit)"` (verbatim — that is the `name:` field at `.github/workflows/ci.yml:271`) to `required_status_checks.contexts` alongside the existing three. The read-then-merge-then-write pattern from Phase 47 Task 4 is reusable verbatim.

**Primary recommendation:** Sequence the phase as **audit → vendor decomposition → lazy() conversion → ceiling lock → CI gate → smoke PRs**. Vendor decomposition before lazy() conversion (D-07 before D-06) is preferable because it surfaces clearer gz wins in the post-decomp audit and lets the lazy() picks operate on stable chunk names.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Lock the Initial JS (entry app chunk) ceiling at **450 KB gz** in `.size-limit.json` — ~10% headroom over the 411.98 KB measured baseline.

**D-02:** Lock the Total JS ceiling at **1.8 MB gz** in `.size-limit.json` — ~25% reduction from the 2.42 MB baseline. Achievement path: vendor super-chunk decomposition (D-07..D-09) + route-split (D-04..D-06). If the audit shows 1.8 MB is unattainable inside the phase, the planner escalates with measured numbers before raising the ceiling — never silently.

**D-03:** Re-baseline per-chunk ceilings to **current measured size + 5 KB headroom each**:

- React vendor — 350 KB gz (current 347)
- TanStack vendor — 55 KB gz (current 50.1)
- signature-visuals/d3-geospatial — 56 KB gz (current 54.15) (note: current ceiling is 55; bump to 56 per D-03 rule)
- signature-visuals/static-primitives — 12 KB gz (current 9; oversized symbolic 64 dropped)
- Sub-vendor chunks from D-07..D-09 — each ceiling = measured + 5 KB

**D-04:** Route-level code-splitting is **already satisfied** by `TanStackRouterVite({ autoCodeSplitting: true })` in `vite.config.ts`. Phase 49 does **not** add manual route-level `React.lazy()` per route file.

**D-05:** Run `ANALYZE=true pnpm build` and treat `dist/stats.html` as the audit artifact. Commit the audit summary to `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` with: top-20 chunks by gz size, suspected `app` chunk culprits, proposed lazy() candidates.

**D-06:** Lazy() candidate threshold — (a) post-split chunk is **≥30 KB gz** on its own, AND (b) **not in the initial render path** of any route.

**D-07:** Required sub-vendor additions to `manualChunks`: `heroui-vendor` (`@heroui/*`), `sentry-vendor` (`@sentry/*`), `dnd-vendor` (`@dnd-kit/*`). Optional: `pdf-vendor`, `editor-vendor` (planner verifies presence). Existing `react-vendor`, `tanstack-vendor`, `motion-vendor`, `radix-vendor`, `signature-visuals-d3`, `charts-vendor`, `i18n-vendor`, `supabase-vendor`, `forms-vendor` stay.

**D-08:** If residual `vendor` chunk is still >100 KB gz after D-07, document each remaining dep ≥10 KB gz in `frontend/docs/bundle-budget.md`.

**D-09:** Every chunk >100 KB gz gets a row in `frontend/docs/bundle-budget.md` (sibling note over JSON comments because `.size-limit.json` is raw JSON read by `assert-size-limit-matches.mjs`).

**D-10:** Add `Bundle Size Check (size-limit)` to required-contexts on `main` branch protection alongside existing `Lint`, `type-check`, `Security Scan`. `enforce_admins: true` preserved.

**D-11:** size-limit's native fail-on-exceed enforces BUNDLE-03's "≥1 KB delta = reject". No custom delta calculator. Per-chunk ceilings (D-03) determine strictness.

**D-12:** **Two smoke PRs prove the gate BLOCKS** — PR-A: push Initial JS > 450 KB. PR-B: push one sub-vendor chunk > its ceiling. Each PR must show `Bundle Size Check (size-limit)` as failed and `mergeStateStatus: BLOCKED`.

**D-13:** Reuse the existing `GlobeSpinner` primitive for route-level Suspense fallbacks. For embedded lazy components (modals, drawer panels, charts), use a lightweight token-styled skeleton — `border: 1px solid var(--line)`, no shadow, density-aware row heights (`var(--row-h)`).

**D-14:** **Zero net-new `eslint-disable` / `@ts-ignore` / `@ts-expect-error` / size-limit ceiling-raising introduced during Phase 49.**

### Claude's Discretion

- Number of sub-plans (1, 3, or split). Natural cleavage: **49-01 audit + budget calibration** (D-01..D-03 + D-05 + D-09), **49-02 vendor decomposition + lazy() conversion** (D-04 + D-06 + D-07..D-08 + D-13), **49-03 CI gate + branch protection + smoke PRs** (D-10..D-12). Mirrors Phase 47/48 rhythm.
- Order of D-07 vendor decomposition vs D-06 component lazy() — executor's call; vendor-first surfaces clearer gz wins.
- Whether to add a `pnpm bundle:report` script that runs `ANALYZE=true pnpm build` and opens `dist/stats.html` — planner's call.
- Whether to keep `signature-visuals/static-primitives` ceiling at 12 KB gz or drop the entry entirely (sits at 9 KB) — planner's call after audit.

### Deferred Ideas (OUT OF SCOPE)

- Esbuild → SWC swap, alternative bundlers, custom Rollup plugins — separate tooling milestone.
- Promoting Lighthouse CI to PR-blocking — separate "Frontend Performance" milestone.
- Strict per-route perf budgets (TTI, FCP, LCP) — future "Frontend Performance" milestone alongside Lighthouse promotion.
- SSR / hydration cost reduction — v8+ concern.
- Dynamic feature-flag-driven imports (e.g., load Sentry only if `SENTRY_DSN` is set at runtime) — one-line follow-up after D-07 puts Sentry in its own chunk.

## Phase Requirements

| ID        | Description                                                                                                               | Research Support                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUNDLE-01 | `.size-limit.json` Total JS ceiling lowered from 2.43 MB to ≤500 KB initial-route gzip; documented as real budget         | D-01..D-03 ceiling values + § Standard Stack (size-limit native enforcement). `.size-limit.json` rewrite shape in § Code Examples.                   |
| BUNDLE-02 | Initial route loads under BUNDLE-01 budget; heavy chunks route-split via `React.lazy()` based on Phase 49 audit           | § Architecture Patterns (lazy() conversion mechanics). 8 existing call-site patterns in codebase. ANALYZE=true wired in `vite.config.ts:43`.         |
| BUNDLE-03 | `size-limit` runs as PR-blocking CI gate; ≥1 KB delta rejected                                                            | D-10..D-12. § Code Examples (branch-protection `gh api PUT` payload verbatim from Phase 47 Task 4). Two-smoke-PR pattern in § Architecture Patterns. |
| BUNDLE-04 | Vendor super-chunk audited; every chunk >100 KB has documented rationale in sibling note `frontend/docs/bundle-budget.md` | D-07..D-09. § Architecture Patterns (sub-vendor decomposition + bundle-budget.md table schema).                                                      |

## Project Constraints (from CLAUDE.md)

The planner MUST honor these — they have the same authority as locked decisions.

| Directive                                                        | Source                      | Phase 49 Impact                                                                                          |
| ---------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| All colors via `var(--*)` tokens; no raw hex, no `text-blue-500` | §Design rules               | D-13 Suspense fallback skeletons must use tokens only                                                    |
| Borders are `1px solid var(--line)`; no card shadows             | §Design rules               | D-13 skeletons: `border: 1px solid var(--line)`, NO shadow                                               |
| Row heights use `var(--row-h)` (density-aware)                   | §Design rules               | D-13 skeleton row heights use the density token                                                          |
| Corner radii from `--radius-sm / --radius / --radius-lg`         | §Design rules               | D-13 skeletons use `var(--radius)` not px                                                                |
| Logical properties (`ms-*`, `ps-*`, `text-start`)                | §Arabic RTL Support         | Any new wrapper components use logical-only spacing                                                      |
| HeroUI v3 → Radix → custom primitive cascade                     | §Component Library Strategy | Justifies `heroui-vendor` named chunk; do not introduce Aceternity/Kibo/shadcn defaults during cleanup   |
| Karpathy §3 Surgical Changes                                     | §Karpathy Coding Principles | Bounds D-05/D-06 audit-driven lazy() scope — no opportunistic refactors during bundle cleanup            |
| No emoji in user-visible copy                                    | §Design rules               | Suspense fallback copy + bundle-budget.md text use plain words                                           |
| Winston logger for backend                                       | §Logging                    | Out of phase — but note: Sentry frontend init is already `requestIdleCallback`-deferred in `main.tsx:24` |

## Architectural Responsibility Map

| Capability              | Primary Tier                     | Secondary Tier                                        | Rationale                                                                                                                                              |
| ----------------------- | -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bundle chunk strategy   | Build (Rollup via Vite)          | —                                                     | `manualChunks` arrow in `vite.config.ts:132-186` is the only place chunk identity is decided                                                           |
| Size enforcement        | CI (GitHub Actions)              | Local (`pnpm size-limit`)                             | `size-limit` runs as a workflow step (`ci.yml:295`); enforcement happens at PR-check time. Local runs are for executor self-check before commit        |
| Branch-protection gate  | GitHub repo settings (API/UI)    | —                                                     | Settings change, NOT a code change. Single `gh api PUT` updates `required_status_checks.contexts` — no workflow YAML edit needed for D-10              |
| Component lazy boundary | Browser/Client (React 19)        | —                                                     | `React.lazy()` + `<Suspense>` render at the consumer site; not a build concern beyond Rollup auto-emitting a chunk per dynamic-import boundary         |
| Audit artifact          | Build (rollup-plugin-visualizer) | Planning (`.planning/phases/49-…/49-BUNDLE-AUDIT.md`) | `ANALYZE=true` plugin emits `dist/stats.html`; planner reads it once, summarizes to a `.planning/` markdown so the audit travels with the phase record |

## Standard Stack

### Core

| Library                    | Version                                                                             | Purpose                                                 | Why Standard                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `size-limit`               | ^12.0.1 (latest 12.1.0) [VERIFIED: npm view size-limit version → 12.1.0]            | CI-grade bundle size assertions                         | Native fail-on-exceed; widely-used GitHub Actions integration; reads `.size-limit.json` natively                     |
| `@size-limit/preset-app`   | ^12.0.1 [VERIFIED: package.json:128]                                                | Preset for SPAs measuring file size + estimated runtime | Already wired; produces gz-aware measurements out of the box                                                         |
| `@size-limit/file`         | ^12.0.1 [VERIFIED: package.json:127]                                                | File-glob path enforcement                              | Drives the per-chunk `path` glob + `limit` + `gzip: true` shape                                                      |
| `rollup-plugin-visualizer` | ^7.0.1 (latest 7.0.1) [VERIFIED: npm view rollup-plugin-visualizer version → 7.0.1] | Treemap audit at `dist/stats.html`                      | Already wired behind `ANALYZE=true` env at `vite.config.ts:43`; supports `gzipSize: true` + `brotliSize: true`       |
| `vite`                     | ^7.3.1 [VERIFIED: package.json:153]                                                 | Build + dev tool                                        | `manualChunks` is a rollup-level config exposed via `build.rollupOptions.output.manualChunks`                        |
| `@tanstack/router-plugin`  | ^1.167.8 [VERIFIED: package.json:130]                                               | TanStack Router file-based codegen + autoCodeSplitting  | D-04 confirms `autoCodeSplitting: true` already emits one chunk per route file — no manual route-level lazy() needed |

### Supporting

| Library  | Version  | Purpose                                   | When to Use                                       |
| -------- | -------- | ----------------------------------------- | ------------------------------------------------- |
| `gh` CLI | (system) | Branch-protection API + smoke-PR creation | D-10 branch-protection PUT and D-12 two smoke PRs |
| `jq`     | (system) | Parse GitHub API responses                | Verify branch-protection contexts list after PUT  |

### Alternatives Considered

| Instead of                 | Could Use                 | Tradeoff                                                                                                                                              |
| -------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size-limit`               | `bundlesize`              | `bundlesize` is unmaintained (last release ~2019); `size-limit` is the current standard. No change.                                                   |
| `rollup-plugin-visualizer` | `webpack-bundle-analyzer` | We're on Rollup via Vite — `webpack-bundle-analyzer` is wrong stack. No change.                                                                       |
| custom delta script        | size-limit native fail    | D-11 explicitly rejects custom delta. size-limit's per-chunk ceiling IS the delta proxy: any chunk that grows past `measured + 5 KB` fails the build. |

**Installation:** No new dependencies needed. All required tools are already in `frontend/package.json` `devDependencies`.

**Version verification:** Verified 2026-05-12 — `npm view size-limit version` → **12.1.0** (we are on `^12.0.1`, resolves to 12.1.0+); `npm view @size-limit/preset-app version` → **12.1.0**; `npm view rollup-plugin-visualizer version` → **7.0.1**. All current; no upgrades required.

## Architecture Patterns

### System Architecture Diagram — Where Phase 49 Operates

```
Developer push
     │
     ▼
GitHub PR open ─────────────► CI: bundle-size-check job (ci.yml:270-296)
                                     │
                                     ▼
                              pnpm -C frontend build  ◄── manualChunks arrow
                                     │                    (vite.config.ts:132)
                                     ▼                    [D-07: 3+2 new branches]
                              assert-size-limit-matches.mjs  ◄── glob sanity check
                                     │                          (every entry ≥1 file)
                                     ▼
                              pnpm -C frontend size-limit  ◄── reads .size-limit.json
                                     │                         [D-01..D-03 ceilings]
                                     ▼
                              PASS (≤ all ceilings) │ FAIL (any chunk > its ceiling)
                                     │                  │
                                     ▼                  ▼
                              gate: pass         gate: fail
                                                       │
                                                       ▼
                              branch-protection rule [D-10]
                              "Bundle Size Check (size-limit)" in
                              required_status_checks.contexts
                                                       │
                                                       ▼
                              mergeStateStatus: BLOCKED [D-11]
                              ↑ Two smoke PRs prove this state [D-12]
```

### Recommended Project Structure (mostly unchanged)

```
frontend/
├── vite.config.ts             # D-07: extend manualChunks arrow (lines 132-186)
├── .size-limit.json           # D-01..D-03 + D-07: rewrite ceilings + new sub-vendor entries
├── scripts/
│   └── assert-size-limit-matches.mjs   # Glob sanity — must keep passing
├── docs/                       # NEW — D-09 sibling rationale doc lives here
│   └── bundle-budget.md       # NEW — every chunk >100 KB gz documented
└── src/                        # Source: surgical lazy() conversions only

.planning/phases/49-bundle-budget-reset/
├── 49-CONTEXT.md
├── 49-RESEARCH.md             # this file
├── 49-BUNDLE-AUDIT.md         # NEW — D-05 one-shot audit snapshot
└── 49-{01,02,03}-*-PLAN.md    # planner output
```

### Pattern 1: Extending `manualChunks` for D-07 Sub-Vendors

**What:** Add three required and two optional `if (id.includes(...))` branches to the existing arrow in `frontend/vite.config.ts:132-186`. Place each new branch BEFORE the catch-all `return 'vendor'` and AFTER the existing branches whose specificity ordering matters.

**Ordering rule:** The first matching `if` wins. Place more-specific patterns before more-general ones. `@dnd-kit` and `@heroui` are scoped packages so they only match themselves — no ordering conflict with existing branches. `@sentry` ditto.

**When to use:** D-07 mandates `heroui-vendor`, `sentry-vendor`, `dnd-vendor`. Add `tiptap-vendor` and `exceljs-vendor` only if the post-audit (D-05) shows residual `vendor` is still >100 KB AND the dep is ≥30 KB gz. (`@tiptap/*` is confirmed present at `package.json:78-81`; `exceljs` at `package.json:92`. PDF libs are NOT in tree — confirmed by grep.)

**Example (insertion point in `vite.config.ts`, after current line 152):**

```typescript
// Source: existing vite.config.ts manualChunks arrow; D-07 additions
manualChunks: (id) => {
  if (id.includes('/src/components/signature-visuals/')) {
    return 'signature-visuals-static'
  }

  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
      return 'react-vendor'
    }
    if (id.includes('@tanstack')) {
      return 'tanstack-vendor'
    }
    if (id.includes('framer-motion') || id.includes('motion')) {
      return 'motion-vendor'
    }
    if (id.includes('@radix-ui')) {
      return 'radix-vendor'
    }
    // NEW D-07 branches — place AFTER existing scoped-package branches
    if (id.includes('@heroui')) {
      return 'heroui-vendor'
    }
    if (id.includes('@sentry')) {
      return 'sentry-vendor'
    }
    if (id.includes('@dnd-kit')) {
      return 'dnd-vendor'
    }
    // OPTIONAL — promote from `vendor` only if D-05 audit shows >30 KB gz residual
    // if (id.includes('@tiptap')) {
    //   return 'tiptap-vendor'
    // }
    // if (id.includes('exceljs')) {
    //   return 'exceljs-vendor'
    // }
    // ...existing branches (d3-geo, recharts, i18next, @supabase, react-hook-form/zod)...
    return 'vendor' // catch-all unchanged
  }
}
```

**Why this ordering:** `react-vendor` and `tanstack-vendor` come first because `react` and `@tanstack` substrings could falsely match later. Scoped packages (`@heroui`, `@sentry`, `@dnd-kit`) are unambiguous and safe to add anywhere in the scoped-package cluster. `@tiptap` and `exceljs` are similarly safe.

### Pattern 2: `.size-limit.json` Sub-Vendor Entry Schema

**What:** Each new sub-vendor chunk gets one JSON object in the array with `name`, `path` (glob into `dist/assets/`), `limit` (string with unit), `gzip: true`, `running: false`.

**Glob compatibility:** `assert-size-limit-matches.mjs` uses a simple `globToRegExp` (`*` → `[^/]*`) and asserts ≥1 file matches. New entries MUST have a path where the glob will resolve to ≥1 built file after the D-07 manualChunks change lands. If a sub-vendor branch ends up empty (e.g., `@dnd-kit` is fully tree-shaken on a refactor), the script fails — that's the intended sanity gate.

**Example (post-Phase-49 .size-limit.json structure):**

```json
[
  {
    "name": "Initial JS (entry point)",
    "path": "dist/assets/app-*.js",
    "limit": "450 KB",
    "gzip": true,
    "running": false
  },
  {
    "name": "React vendor",
    "path": "dist/assets/react-vendor-*.js",
    "limit": "350 KB",
    "gzip": true,
    "running": false
  },
  {
    "name": "TanStack vendor",
    "path": "dist/assets/tanstack-vendor-*.js",
    "limit": "55 KB",
    "gzip": true,
    "running": false
  },
  {
    "name": "HeroUI vendor",
    "path": "dist/assets/heroui-vendor-*.js",
    "limit": "<measured + 5> KB",
    "gzip": true,
    "running": false
  },
  {
    "name": "Sentry vendor",
    "path": "dist/assets/sentry-vendor-*.js",
    "limit": "<measured + 5> KB",
    "gzip": true,
    "running": false
  },
  {
    "name": "DnD vendor",
    "path": "dist/assets/dnd-vendor-*.js",
    "limit": "<measured + 5> KB",
    "gzip": true,
    "running": false
  },
  {
    "name": "Total JS",
    "path": "dist/assets/*.js",
    "limit": "1.8 MB",
    "gzip": true,
    "running": false
  },
  {
    "name": "signature-visuals/d3-geospatial",
    "path": "dist/assets/signature-visuals-d3-*.js",
    "limit": "56 KB",
    "gzip": true,
    "running": false
  },
  {
    "name": "signature-visuals/static-primitives",
    "path": "dist/assets/signature-visuals-static-*.js",
    "limit": "12 KB",
    "gzip": true,
    "running": false
  }
]
```

**Critical:** The numeric placeholders `<measured + 5>` MUST be replaced with real values from the post-audit build BEFORE commit. The plan executor runs `pnpm -C frontend build && ls -la dist/assets/*.js`, takes the gz-measured size of each new sub-vendor chunk (via `pnpm size-limit` once entries are added), and applies +5 KB. Never commit a placeholder.

**Important:** Update `expectedMatchCounts` in `assert-size-limit-matches.mjs:42-48` to include each new sub-vendor with an expected count of `1`. Otherwise the script silently accepts ≥1, which is looser than intended for named singletons.

### Pattern 3: React.lazy() Conversion (D-06)

**What:** Convert audit-identified ≥30 KB gz non-initial-path components from eager `import` to `lazy(() => import(...))` + a `<Suspense fallback={...}>` boundary at each call site.

**When to use:** Component meets both (a) ≥30 KB gz on its own AND (b) NOT in any route's initial render path. Examples from the audit-likely list per CONTEXT D-06: modals (`CalendarEntryForm`, `EntityLinkManager`), drawer panels, chart-heavy components (`stakeholder-influence`, `sla-monitoring`, `custom-dashboard`, `workflow-automation`).

**Existing patterns in the codebase to mirror (DO NOT INVENT — copy these shapes):**

1. **`FullScreenGraphModal`** — modal opened from a sidebar button. The canonical template per CONTEXT code_context:
   - Component file: `frontend/src/components/graph/FullScreenGraphModal.tsx` (default export)
   - Consumer: `frontend/src/components/dossier/RelationshipSidebar.tsx:63` + Suspense at line 536 with `fallback={null}` (acceptable for modals that are closed by default — no flash because `open=false` skips mount)
2. **Engagement workspace tabs** — 6 example sites (overview/audit/calendar/context/docs/tasks). Each is `React.lazy()` with a `<TabSkeleton type="...">` fallback. See `frontend/src/routes/_protected/engagements/$engagementId/overview.tsx` (24 lines, model file).
3. **`EntityLinkManager`** — heavy modal/drawer at `frontend/src/pages/TicketDetail.tsx:23` with Suspense at line 412.

**Example end-to-end conversion (template, illustrative target is any ≥30 KB modal not yet lazy):**

```typescript
// Source: pattern verbatim from frontend/src/routes/_protected/engagements/$engagementId/overview.tsx
// and frontend/src/components/graph/FullScreenGraphModal.tsx

// BEFORE — at the consumer site (eager):
import { CalendarEntryForm } from '@/components/calendar/CalendarEntryForm'

// AFTER — at the consumer site (lazy):
import { lazy, Suspense } from 'react'
import { GlobeSpinner } from '@/components/signature-visuals'

const CalendarEntryForm = lazy(() => import('@/components/calendar/CalendarEntryForm'))

// At render site, wrap in Suspense:
function ParentComponent(): ReactElement {
  return (
    <Suspense
      fallback={
        // D-13: token-styled lightweight skeleton — embedded fallback (not full-screen)
        <div
          className="flex items-center justify-center"
          style={{
            minHeight: 'var(--row-h)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
          }}
        >
          <GlobeSpinner size="sm" />
        </div>
      }
    >
      {open && <CalendarEntryForm {...props} />}
    </Suspense>
  )
}
```

**Per D-13 fallback selection rules:**

- **Route-level Suspense** (rare in Phase 49 — D-04 says routes are already auto-split): `<FullscreenLoader open />` (the existing AppShell pattern at `AppShell.tsx:224`).
- **Modal/drawer Suspense** (most Phase 49 targets): `fallback={null}` is acceptable when the consumer guards mounting with `{open && <Lazy />}`. The closed state means no flash.
- **Inline lazy component** (in-flow, always-mounted): use the `GlobeSpinner` + token-bordered wrapper above. Optional alternative: copy the `TabSkeleton` pattern at `frontend/src/components/workspace/TabSkeleton.tsx` and add a new variant for the lazy shape.

**Component-side requirement:** A lazy()-imported component MUST be the file's **default export**. Existing `FullScreenGraphModal.tsx:126` uses `export default function FullScreenGraphModal(...)`. If a target component currently uses a named export only, the executor either (a) adds `export default` alongside, or (b) uses the `.then(m => ({ default: m.Named }))` wrapper as `frontend/src/routes/_protected/kanban.tsx:12` does: `lazy(() => import('@/pages/WorkBoard').then((m) => ({ default: m.WorkBoard })))`. Choose (a) when safe (single consumer), (b) when the named export has multiple consumers.

### Pattern 4: Branch-Protection Update via gh api (D-10)

**What:** Read the existing protection state, merge `"Bundle Size Check (size-limit)"` into `required_status_checks.contexts` (preserving the three existing entries from Phases 47/48), PUT the merged payload back, then verify.

**Context name CASING MATTERS:** GitHub's branch-protection contexts are case-sensitive string matches against the GH Actions job `name:` field, NOT the workflow `id:`. The exact string to add is `"Bundle Size Check (size-limit)"` — verbatim from `.github/workflows/ci.yml:271` (`name: Bundle Size Check (size-limit)`). Any deviation makes the rule a silent no-op (the check exists, the protection requires a string that nothing produces, so it never blocks).

**Example (verbatim from Phase 47 Task 4 + Phase 48 Task 2 — proven pattern):**

```bash
# Step 1: Capture pre-state for diff audit (T-49-XX mitigation)
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > /tmp/49-protection-before.json 2>&1
cat /tmp/49-protection-before.json | jq '.required_status_checks.contexts'
# Expected pre-state: ["Lint", "Security Scan", "type-check"] (from Phase 48 close)

# Step 2: PUT the merged payload — adds "Bundle Size Check (size-limit)" to existing contexts
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Security Scan", "type-check", "Bundle Size Check (size-limit)"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON

# Step 3: Verify the rule landed (sorted comparison — order doesn't matter, presence does)
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > /tmp/49-protection-after.json
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks \
  --jq '.contexts | sort'
# Expected output: ["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"]

gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins \
  --jq '.enabled'
# Expected output: true

# Step 4: Diff before/after — no other rules should have changed
diff <(jq -S . /tmp/49-protection-before.json) <(jq -S . /tmp/49-protection-after.json)
# Expected diff is ONLY the addition of the new context.
```

**Payload-shape rationale (Issue-5 fix carried from Phase 48):** The PUT body is the minimum-required GitHub REST API spec for `repos/{owner}/{repo}/branches/{branch}/protection`. Fields like `lock_branch`, `allow_fork_syncing`, `required_linear_history`, `required_conversation_resolution`, `allow_force_pushes`, `allow_deletions` are dropped because some repo tiers reject them and would abort the entire PUT. The BUNDLE-03 acceptance — `contexts` includes the new entry — does not depend on the dropped fields.

### Pattern 5: Two Smoke PRs to Prove the Gate BLOCKS (D-12)

**What:** Open two deliberately-broken PRs that each push a different chunk over its ceiling. Verify each PR shows the bundle-size-check job as `fail` AND `mergeStateStatus: BLOCKED`. Close both without merging.

**PR-A — push Initial JS over 450 KB ceiling:**

```bash
git fetch origin main
git checkout -b chore/test-bundle-gate-initial origin/main

# Append a heavy eager import to App.tsx — d3 is in node_modules transitively
# via d3-geo, but importing it at module scope at the entry forces it into the
# `app-*.js` initial chunk. Alternative: `import { saveAs } from 'file-saver'`
# if d3 doesn't push hard enough. Goal is +50 KB gz to the initial chunk.
printf "\nimport * as d3 from 'd3';\nconsole.warn('smoke', d3.version);\n" >> frontend/src/App.tsx

git add frontend/src/App.tsx
git commit -m "chore: smoke-test bundle gate initial-js (DO NOT MERGE)"
git push -u origin chore/test-bundle-gate-initial

gh pr create --base main \
  --title "chore: smoke-test bundle gate initial-js (DO NOT MERGE)" \
  --body "BUNDLE-03 verification per CONTEXT D-12. Injects an eager d3 import to push Initial JS > 450 KB. Will be closed without merging."

PR_A=$(gh pr view --json number -q .number)
gh pr checks $PR_A --watch

# Required state — assert both:
gh pr checks $PR_A --json name,state,bucket \
  --jq '.[] | select(.name=="Bundle Size Check (size-limit)") | .bucket'
# Expected: "fail"

gh pr view $PR_A --json mergeStateStatus -q .mergeStateStatus
# Expected: "BLOCKED" (NOT "MERGEABLE" — see Phase 47 Issue-2 fix)

# Close, do NOT merge:
gh pr close $PR_A --delete-branch
```

**PR-B — push one sub-vendor chunk (e.g., dnd-vendor) over its ceiling:**

```bash
git checkout main && git pull
git checkout -b chore/test-bundle-gate-subvendor origin/main

# Force-import a substantial chunk into a dnd-kit-touching file by adding
# a previously-unused sub-export. Easier path: pick a file under
# frontend/src that already imports from '@dnd-kit/sortable' and add a
# wildcard re-export to balloon the sub-vendor chunk. Goal is to push
# dnd-vendor over its locked ceiling.
echo "export * from '@dnd-kit/sortable';" >> frontend/src/components/kanban/_smoke-dnd-bloat.ts

git add frontend/src/components/kanban/_smoke-dnd-bloat.ts
git commit -m "chore: smoke-test bundle gate sub-vendor (DO NOT MERGE)"
git push -u origin chore/test-bundle-gate-subvendor

gh pr create --base main \
  --title "chore: smoke-test bundle gate sub-vendor (DO NOT MERGE)" \
  --body "BUNDLE-03 verification per CONTEXT D-12. Bloats dnd-vendor over its ceiling to prove the gate blocks per-chunk regressions. Will be closed without merging."

PR_B=$(gh pr view --json number -q .number)
gh pr checks $PR_B --watch
gh pr checks $PR_B --json name,state,bucket \
  --jq '.[] | select(.name=="Bundle Size Check (size-limit)") | .bucket'
# Expected: "fail"
gh pr view $PR_B --json mergeStateStatus -q .mergeStateStatus
# Expected: "BLOCKED"

gh pr close $PR_B --delete-branch
```

**Why two PRs and not one:** Initial-JS overflow and sub-vendor overflow are two different failure surfaces. A passing-on-overflow gate could exist that only checks the Total JS line but skips per-chunk lines, or vice versa. Two PRs prove BOTH ceilings actually block. This is the same posture as Phase 48 D-16 (one frontend + one backend smoke).

### Pattern 6: `bundle-budget.md` Sibling Doc Schema (D-09)

**What:** Create `frontend/docs/bundle-budget.md` as the long-form rationale document for every chunk >100 KB gz. Sibling note over inline JSON comments because `.size-limit.json` is read by `assert-size-limit-matches.mjs` (no JSONC tolerance) and rationale is multi-sentence per chunk.

**Folder context:** `frontend/docs/` does NOT exist on `main` today (verified by `ls frontend/docs/` → no such directory). D-09 creates the folder + the file. No other docs need migration.

**Proposed structure (planner adopts or revises):**

```markdown
# Frontend Bundle Budget

Last audited: 2026-05-XX
Audit artifact: `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`

This document explains the rationale for every chunk over 100 KB gzipped in
the production build. Sibling to `.size-limit.json` per Phase 49 D-09.

## Ceilings (locked Phase 49)

| Chunk                | Ceiling (gz) | Measured (gz) | Last audited | Rationale                                                                                                                                                                                                         |
| -------------------- | ------------ | ------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial JS (`app-*`) | 450 KB       | 411.98 KB     | 2026-05-XX   | Entry route — TanStack Router shell + provider tree + i18n init. Lazy boundaries below cut growth here.                                                                                                           |
| React vendor         | 350 KB       | 347.13 KB     | 2026-05-XX   | react + react-dom + scheduler — near native floor. Cannot be reduced without dropping React itself.                                                                                                               |
| TanStack vendor      | 55 KB        | 50.1 KB       | 2026-05-XX   | @tanstack/react-router + react-query + react-table + react-virtual — all on the initial path.                                                                                                                     |
| HeroUI vendor        | TBD          | TBD           | 2026-05-XX   | Primary primitive cascade per CLAUDE.md §Component Library Strategy. Eager because most routes render a HeroUI primitive on first paint.                                                                          |
| Sentry vendor        | TBD          | TBD           | 2026-05-XX   | @sentry/react — error tracking. Init is `requestIdleCallback`-deferred at `main.tsx:24`, so this chunk is non-blocking despite the size. Keep its own chunk so a Sentry upgrade doesn't cache-bust other vendors. |
| DnD vendor           | TBD          | TBD           | 2026-05-XX   | @dnd-kit/\* — only loaded on kanban + reorder routes; separate chunk avoids cache-busting the initial path on dnd-kit minor upgrades.                                                                             |
| ...                  |              |               |              |                                                                                                                                                                                                                   |

## Residual vendor chunk

Per D-08: after the D-07 named sub-vendors are split off, anything remaining
in `vendor-*` that is ≥10 KB gz gets a row below with an explanation of why
it stays in the catch-all bucket.

| Dep | gz size | Reason for staying in `vendor` |
| --- | ------- | ------------------------------ |
| ... | ...     | ...                            |
```

### Pattern 7: `49-BUNDLE-AUDIT.md` One-Shot Audit Artifact (D-05)

**What:** A snapshot capture of `dist/stats.html` summarized into a phase-internal markdown. Not a living document; not re-run during normal development. Stays in `.planning/phases/49-…/` because it captures a point-in-time decision input.

**Proposed structure:**

```markdown
# Phase 49 — Bundle Audit Snapshot

**Date:** 2026-05-XX (post D-07 decomposition, pre D-06 lazy())
**Source:** `pnpm -C frontend analyze` → `frontend/dist/stats.html`
**Build mode:** production (ANALYZE=true)

## Top 20 chunks by gz size

| Rank | Chunk        | gz size | Raw size | Type     | Initial path? |
| ---- | ------------ | ------- | -------- | -------- | ------------- |
| 1    | react-vendor | 347 KB  | 1.1 MB   | vendor   | yes           |
| 2    | app          | 412 KB  | 1.4 MB   | app      | yes           |
| 3    | vendor       | TBD     | TBD      | residual | partial       |
| ...  |              |         |          |          |               |

## Suspected `app` chunk eager-import culprits

Components imported eagerly at module scope into the initial-path graph that
are ≥30 KB gz on their own. Candidates for D-06 lazy() conversion:

| Component         | Path                                 | Est. gz | Eager via  | Lazy() candidate?                    |
| ----------------- | ------------------------------------ | ------- | ---------- | ------------------------------------ |
| CalendarEntryForm | frontend/src/components/calendar/... | ~XX KB  | XYZ.tsx:12 | yes — modal, never on initial render |
| ...               |                                      |         |            |                                      |

## Sub-vendor decomposition results (post D-07)

| New chunk     | gz  | Was-part-of `vendor` (gz) | Net Total Δ |
| ------------- | --- | ------------------------- | ----------- |
| heroui-vendor | TBD | TBD                       | 0 (split)   |
| sentry-vendor | TBD | TBD                       | 0 (split)   |
| dnd-vendor    | TBD | TBD                       | 0 (split)   |

## Proposed lazy() conversions (ranked by est. gz win)

| Rank | Component | Est. gz saved from initial | Justification (D-06 threshold check)         |
| ---- | --------- | -------------------------- | -------------------------------------------- |
| 1    | ...       | ...                        | ≥30 KB gz AND not in initial path: confirmed |

## Decision

[Planner records: how many components flipped lazy, which were skipped + why,
projected Total JS after both D-06 and D-07 land.]
```

### Anti-Patterns to Avoid

- **Adding manual `React.lazy()` per route file.** D-04 explicitly says routes are already auto-split by `TanStackRouterVite({ autoCodeSplitting: true })`. Manual route-level lazy() is duplicate work and confuses the chunk graph.
- **Custom gz delta calculator vs size-limit native fail.** D-11 rejects this. The +5 KB headroom in D-03 IS the delta proxy; size-limit's exit-on-overage IS the gate.
- **JSON comments in `.size-limit.json`.** It's read by `assert-size-limit-matches.mjs` (raw JSON.parse), not by size-limit's JSONC-tolerant CLI alone. Rationale goes in `frontend/docs/bundle-budget.md`.
- **Raising any existing ceiling silently to "make Phase 49 pass".** D-14 forbids this. If the audit shows D-02's 1.8 MB ceiling is unattainable, the planner ESCALATES with measured numbers before raising it.
- **`.reverse()`-style or `as any` workarounds during lazy() conversion.** Karpathy §3 + CLAUDE.md §Karpathy bind this. If a lazy() conversion breaks types, the executor fixes the types — does not add suppressions.
- **Adding `floating-action-button.tsx` / `floating-dock.tsx` / similar to the lazy queue out of opportunism.** Phase 48 D-07 already deleted the Aceternity orphans; non-Aceternity `floating-*` files have real consumers. Out of Phase 49 scope.
- **Smoke-PR cleanup neglect.** Both smoke PRs MUST be closed with `gh pr close --delete-branch` BEFORE writing the phase SUMMARY. Phase 47/48 closed all four prior smokes this way; leaving them open creates accidental-merge risk.
- **Replacing the entire `manualChunks` arrow with a new strategy.** D-07 ADDS branches; existing chunk names stay. Renaming chunks would cache-bust every CDN user simultaneously and break `assert-size-limit-matches.mjs` globs.

## Don't Hand-Roll

| Problem                            | Don't Build                                                | Use Instead                                                                                                  | Why                                                                                                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gz delta enforcement               | Custom `node` script computing `before-after >= 1024`      | `size-limit` exit code + per-chunk `limit` field                                                             | size-limit already does this. Custom delta requires storing baselines somewhere (artifact upload? PR comment?); per-chunk ceiling is stateless and works on first PR run.                                                 |
| Bundle visualization               | Custom `rollup` stats dump                                 | `rollup-plugin-visualizer` (already wired)                                                                   | Already produces treemap + sunburst + network views; gz + brotli aware. Wired behind `ANALYZE=true` in `vite.config.ts:43`.                                                                                               |
| Chunk naming strategy              | Hash-only chunk names (`[name]-[hash].js` already correct) | Keep existing `entryFileNames: 'assets/app-[hash].js'` + `chunkFileNames: 'assets/[name]-[hash].js'`         | Already correct. Glob matching in `.size-limit.json` depends on the stable name prefix. Don't change `entryFileNames`/`chunkFileNames`.                                                                                   |
| Suspense fallback design           | Bespoke spinner                                            | `GlobeSpinner` primitive (`@/components/signature-visuals`)                                                  | Established design system primitive per D-13. Token-styled, RTL-aware, density-aware.                                                                                                                                     |
| Tab-shaped skeleton                | New variant per call site                                  | `TabSkeleton` (`@/components/workspace/TabSkeleton`) with `type: 'summary' \| 'kanban' \| 'list' \| 'cards'` | Already exists with 4 variants. Add a 5th variant before authoring a one-off.                                                                                                                                             |
| Branch-protection JSON marshalling | `curl` + JWT + signed request                              | `gh api -X PUT` with `--input -` heredoc                                                                     | `gh` CLI handles auth, signing, error reporting. Phase 47 + 48 used this verbatim.                                                                                                                                        |
| Smoke-PR PASS/FAIL detection       | Polling commit status via REST                             | `gh pr checks $PR --json name,state,bucket --jq ...` + `gh pr view $PR --json mergeStateStatus`              | Phase 47 Issue-2 fix: `mergeable` returns `MERGEABLE` for branches without git conflicts even when required checks fail; **`mergeStateStatus` is the correct field** for "PR is blocked from merging by required checks". |

**Key insight:** Phase 49 is bounded surgery on a build pipeline that already has all needed tooling (`size-limit`, `rollup-plugin-visualizer`, `TanStackRouterVite autoCodeSplitting`). Every "should I write a script for this?" question has the answer "no — the tool already does it."

## Common Pitfalls

### Pitfall 1: Conflating gz and raw sizes during the audit

**What goes wrong:** `vite build` reports both raw and gzipped sizes; `rollup-plugin-visualizer` shows raw by default; `size-limit` measures gz. A ceiling set against a raw size becomes a non-gate ceiling against gz (4-6x more permissive).
**Why it happens:** Three different reports, three different default units, no enforced labeling.
**How to avoid:** All D-01..D-03 ceilings are stated in `KB gz` / `MB gz` and `.size-limit.json` entries have `gzip: true`. `49-BUNDLE-AUDIT.md` must label every column. When sizing a new sub-vendor, run `pnpm -C frontend size-limit` after adding the entry — its output is the gz measurement, not the dist-folder file size.
**Warning signs:** A "comfortable" per-chunk margin that doesn't match `pnpm size-limit` output. A ceiling that reads e.g. `1.4 MB` when 1.9 MB raw is the baseline (1.9 MB raw → ~600 KB gz; 1.4 MB gz would be an off-by-one-unit error).

### Pitfall 2: Empty sub-vendor chunk after manualChunks tweak trips assert script

**What goes wrong:** A `.size-limit.json` entry's `path` glob (e.g., `dist/assets/dnd-vendor-*.js`) matches zero files because the new `if (id.includes('@dnd-kit'))` branch never fires — maybe because `@dnd-kit` is fully tree-shaken on routes that don't reach it. `assert-size-limit-matches.mjs` exits 1; CI red.
**Why it happens:** Rollup's tree-shaking can eliminate an entire scoped package if no live code path imports it (a refactor between Phase 49 and a follow-up phase could orphan a sub-vendor).
**How to avoid:** Verify each new sub-vendor branch emits a file by running `pnpm -C frontend build && ls dist/assets/heroui-vendor-* dist/assets/sentry-vendor-* dist/assets/dnd-vendor-*`. If any return "no such file", the corresponding `.size-limit.json` entry is dead and must be removed before commit.
**Warning signs:** `assert-size-limit-matches.mjs` failing with `"<name>: expected 1 match(es), got 0"`. The Phase 44 fix history shows this script has caught dead globs before — it's working as designed.

### Pitfall 3: Branch-protection context-name typo silently bypasses the gate

**What goes wrong:** Branch protection requires `"bundle-size-check"` (lowercase, hyphenated — the workflow job ID), but the CI job runs as `"Bundle Size Check (size-limit)"` (the `name:` field). The protection rule waits for a check named `bundle-size-check`; it never arrives. The rule is satisfied vacuously. Merges proceed with red bundle-size status.
**Why it happens:** GitHub branch-protection `contexts` are case-sensitive string matches against the **job `name:` field, NOT the `id:` field**. Phase 48 hit a near-miss on this (Lint vs lint casing).
**How to avoid:** The exact string is `"Bundle Size Check (size-limit)"`. Verified at `.github/workflows/ci.yml:271` (`name: Bundle Size Check (size-limit)`). The smoke PRs in D-12 are the only empirical proof the casing matched — if the gate doesn't BLOCK, suspect this first.
**Warning signs:** A PR with a deliberate bundle-size violation shows `mergeStateStatus: CLEAN` instead of `BLOCKED`. The check itself is `fail`, but the rule didn't require the exact string.

### Pitfall 4: Lazy() without a fallback flashes a blank parent loading state

**What goes wrong:** A component is wrapped in `<Suspense fallback={null}>` and the parent layout doesn't already render a "settled" state. The user sees a blank region for the duration of the chunk fetch (variable, 100ms–800ms on slow networks).
**Why it happens:** `fallback={null}` is the path-of-least-resistance and works in some contexts (e.g., a closed modal where the consumer guards with `{open && <Lazy />}`). In always-mounted contexts, it produces a flash.
**How to avoid:** Apply D-13 selection rules:

- `fallback={null}` ONLY when `{open && <Lazy />}` guards mounting (most modals).
- `<GlobeSpinner size="sm" />` for always-mounted inline lazy components, in a `border: 1px solid var(--line)`-styled box.
- `<TabSkeleton type="..." />` for any tab-shaped lazy panel — extend the existing component, don't reinvent.
  **Warning signs:** A visual regression test (Phase 38/40/41 baselines) flickers between blank and rendered on the lazy chunk frame.

### Pitfall 5: Audit-driven lazy() picks invalidate visual baselines

**What goes wrong:** A lazy() conversion adds a Suspense fallback frame to a component that has a Playwright baseline. The first paint matches the fallback, not the rendered component. Baseline assertions fail.
**Why it happens:** Phase 38/40/41 baselines were captured pre-lazy. The added Suspense interception is a real DOM change.
**How to avoid:** For any component on a baseline-tested route, the executor either (a) keeps the component eager if it's on the initial path (D-06 already filters this), or (b) re-captures the baseline as part of the lazy() commit if the panel is below-fold and the fallback is intentional. Plan a Playwright visual-test pass on the routes that changed.
**Warning signs:** Phase 38/40/41 baseline tests red in the `test-rtl-responsive` or `test-a11y` CI jobs after a lazy() conversion landed. Resolution is baseline re-capture, not lazy() reversion (since D-06 already vetted the choice).

### Pitfall 6: Sentry source-map upload changes chunk hash → cache-bust during deploy

**What goes wrong:** The `sentryVitePlugin` runs `filesToDeleteAfterUpload: ['./dist/**/*.map']` (`vite.config.ts:60`). Source-map upload is only enabled in production with full env config (`isSentryEnabled` at `vite.config.ts:23`). If a CI run in `bundle-size-check` somehow enables it, source-maps get uploaded and deleted — fine — but a hash difference between CI gate and prod-build would create false-positive bundle-size deltas.
**Why it happens:** `isSentryEnabled = !!(sentryOrg && sentryProject && sentryAuthToken && process.env.NODE_ENV === 'production')`. The CI `bundle-size-check` step runs `pnpm -C frontend build` without `NODE_ENV=production` set explicitly — `vite build` defaults to production mode but only sets the build-time mode flag, not `process.env.NODE_ENV` for plugin gating.
**How to avoid:** Verify in the bundle-size-check CI step that `process.env.NODE_ENV` is undefined or "test" — Sentry plugin should be inert. If it's not, gate the plugin more strictly. (This is a Phase 49 verification step, not a guaranteed problem.)
**Warning signs:** `vite build` output mentions Sentry source-map upload in CI logs. Chunk hashes differ between local `pnpm build` and CI `pnpm build`.

### Pitfall 7: Total JS ceiling math fights the sum of per-chunk ceilings

**What goes wrong:** D-02 caps Total at 1.8 MB. D-03 caps each chunk at its measured + 5 KB. If every chunk hits its individual ceiling simultaneously, the sum may exceed 1.8 MB — and per CONTEXT §specifics, "Total JS is computed, not negotiated: sum the per-chunk ceilings + ~5% slack." But D-02 ALSO says "1.8 MB is the reduction goal; the actual locked value is the larger of (1.8 MB, sum-of-chunk-ceilings + slack)."
**Why it happens:** Two ceilings, two enforcement points. Total-JS ceiling can be the binding constraint even when no individual chunk is over.
**How to avoid:** After all per-chunk ceilings are computed, sum them, add 5% slack, compare to 1.8 MB. The Total JS ceiling = `max(1.8 MB, sum + 5%)`. Document the chosen value's derivation in `49-BUNDLE-AUDIT.md`.
**Warning signs:** A PR fails the Total-JS check but passes every per-chunk check. That's normal — it means a new chunk landed that wasn't accounted for. Either categorize it into a named sub-vendor or accept the ceiling raise (if D-02 escalation path is followed).

## Code Examples

Verified patterns from the codebase + official sources:

### Existing `manualChunks` arrow (the file Phase 49 modifies)

```typescript
// Source: frontend/vite.config.ts:132-186 (current main, 2026-05-12)
manualChunks: (id) => {
  if (id.includes('/src/components/signature-visuals/')) {
    return 'signature-visuals-static'
  }
  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
      return 'react-vendor'
    }
    if (id.includes('@tanstack')) {
      return 'tanstack-vendor'
    }
    // ... motion, radix, signature-visuals-d3, charts, i18n, supabase, forms ...
    return 'vendor' // <-- D-07 inserts before this catch-all
  }
}
```

### Existing lazy() consumer (the pattern Phase 49 copies)

```typescript
// Source: frontend/src/routes/_protected/engagements/$engagementId/overview.tsx:1-24
import React, { Suspense, type ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const OverviewTab = React.lazy(
  () => import('@/pages/engagements/workspace/OverviewTab'),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/overview')({
  component: OverviewRoute,
})

function OverviewRoute(): ReactElement {
  return (
    <Suspense fallback={<TabSkeleton type="summary" />}>
      <OverviewTab />
    </Suspense>
  )
}
```

### Existing modal lazy() (named-export-to-default fallback shape)

```typescript
// Source: frontend/src/routes/_protected/kanban.tsx:12 — when target is named-only export
const WorkBoard = lazy(() => import('@/pages/WorkBoard').then((m) => ({ default: m.WorkBoard })))
```

### `assert-size-limit-matches.mjs` glob-shape contract

```javascript
// Source: frontend/scripts/assert-size-limit-matches.mjs:11-18
function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}
function globToRegExp(pattern) {
  const parts = pattern.split('*').map(escapeRegExp)
  return new RegExp(`^${parts.join('[^/]*')}$`)
}
// Implication: `*` matches `[^/]*` (no slash). `dist/assets/heroui-vendor-*.js`
// matches `dist/assets/heroui-vendor-ABC123.js` ✓ but NOT
// `dist/assets/subdir/heroui-vendor-ABC123.js`.
```

## State of the Art

| Old Approach                                | Current Approach                                          | When Changed                           | Impact                                                                                                              |
| ------------------------------------------- | --------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `bundlesize` for CI gz checks               | `size-limit`                                              | ~2020+                                 | `bundlesize` unmaintained; `size-limit` is the standard                                                             |
| Manual `chunkSizeWarningLimit` only         | Per-chunk `limit:` in `.size-limit.json` + CI gate        | Phase 44 (2026-05-08)                  | Symbolic warning → real PR-blocking gate                                                                            |
| Aspirational 200 KB Total JS (v2.0)         | Tiered ceilings: Initial 450 KB + Total 1.8 MB (Phase 49) | This phase                             | Replaces a single-aspirational with measured-and-enforced                                                           |
| Manual route-level `React.lazy()` per route | TanStack Router `autoCodeSplitting: true`                 | Phase 33+                              | One chunk per route file emitted automatically                                                                      |
| Sentry eager-init in entry                  | `requestIdleCallback` + dynamic import                    | Already shipped (see `main.tsx:24-32`) | Sentry is non-blocking on first paint despite being a vendor; D-07 sub-vendor separation locks the chunking benefit |

**Deprecated/outdated:**

- 200 KB Total JS target from v2.0 Phase 7 — replaced by 1.8 MB D-02 (still ambitious, no longer aspirational).
- 815 KB Total JS post-Phase-40-c (FROM `.planning/STATE.md` Wave 0b) — replaced by 1.8 MB.
- 2.43 MB symbolic ceiling — explicitly the drift being repaired by Phase 49.
- `frontend/eslint.config.js` shadow config — deleted in Phase 48 (verified: `(eval):1: no matches found: frontend/eslint.config.*`).

## Validation Architecture

> Nyquist Dimension 8 — verifiable signals at every measurement point.

### Test Framework

| Property                         | Value                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Bundle-size framework            | `size-limit` 12.0.1+ (currently resolves to 12.1.0) [VERIFIED: package.json:150 + npm view] |
| Bundle-size config file          | `frontend/.size-limit.json` (raw JSON)                                                      |
| Bundle-size quick run            | `pnpm -C frontend size-limit`                                                               |
| Bundle-size full run             | `pnpm -C frontend build && pnpm -C frontend size-limit`                                     |
| Audit framework                  | `rollup-plugin-visualizer` 7.0.1 [VERIFIED: package.json:149 + npm view]                    |
| Audit quick run                  | `pnpm -C frontend analyze` (opens `dist/stats.html`)                                        |
| Audit JSON                       | `pnpm -C frontend analyze:json` (emits `dist/bundle-stats.json`)                            |
| Glob sanity                      | `node frontend/scripts/assert-size-limit-matches.mjs`                                       |
| Unit-test framework (regression) | Vitest 4.1.2 [VERIFIED: package.json:154]                                                   |
| E2E framework (lazy regression)  | Playwright 1.58.2 [VERIFIED: package.json:126]                                              |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                      | Test Type   | Automated Command                                                                                                                                                           | File Exists?                                                |
| --------- | ------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| BUNDLE-01 | Total JS ceiling locked at 1.8 MB gz; Initial JS at 450 KB gz | unit        | `pnpm -C frontend size-limit` (post-build)                                                                                                                                  | ✅ `frontend/.size-limit.json` exists; Phase 49 rewrites it |
| BUNDLE-01 | Ceilings documented as real budget, not aspirational          | doc check   | `grep -E "limit.*(1\.8 MB\|450 KB)" frontend/.size-limit.json`                                                                                                              | ✅ file exists; D-01..D-03 rewrite values                   |
| BUNDLE-02 | Initial route loads under 450 KB gz                           | unit        | `pnpm -C frontend size-limit \| grep "Initial JS"` (exit 0)                                                                                                                 | ✅                                                          |
| BUNDLE-02 | Heavy chunks route-split via React.lazy() based on audit      | code review | `git diff --stat .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` shows audit; `grep -r "React.lazy\|lazy(" frontend/src --include="*.tsx"` shows new boundaries | ✅ 28 existing lazy() sites — verified via grep             |
| BUNDLE-02 | E2E suite passes against new lazy boundaries                  | E2E         | `pnpm -C frontend exec playwright test --project=chromium-en`                                                                                                               | ✅ Playwright config + spec files exist                     |
| BUNDLE-03 | size-limit runs as PR-blocking CI gate                        | integration | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts \| sort'` MUST include `"Bundle Size Check (size-limit)"`  | ✅ via Phase 47/48 protection mechanism                     |
| BUNDLE-03 | A PR adding ≥1 KB rejected on main (gate BLOCKS)              | smoke E2E   | Two smoke PRs (D-12); each `gh pr view --json mergeStateStatus -q .mergeStateStatus` returns `"BLOCKED"`                                                                    | ✅ pattern proven in Phase 47/48                            |
| BUNDLE-04 | Vendor super-chunk audited; every chunk >100 KB has rationale | doc check   | `wc -l frontend/docs/bundle-budget.md` > 20; each chunk in `pnpm size-limit \| grep -E ">100 KB"` appears in the doc                                                        | ❌ Wave 0 — create `frontend/docs/bundle-budget.md`         |
| BUNDLE-04 | Audit summary committed to `.planning/`                       | doc check   | `test -f .planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`                                                                                                        | ❌ Wave 0 — author the artifact                             |

### Sampling Rate

- **Per task commit (executor self-check):** `pnpm -C frontend build && pnpm -C frontend size-limit && node frontend/scripts/assert-size-limit-matches.mjs` — exit 0 required before committing any chunk-affecting change.
- **Per wave merge:** Full `pnpm -C frontend test` (vitest unit suite) + selective Playwright re-run on lazy()-touched routes.
- **Phase gate (pre-`/gsd-verify-work`):** All four CI jobs green (`Lint`, `type-check`, `Security Scan`, `Bundle Size Check (size-limit)`) on the integration branch. Both D-12 smoke PRs closed without merge.

### Wave 0 Gaps

- [ ] `frontend/docs/bundle-budget.md` — D-09 sibling rationale doc (folder + file new).
- [ ] `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md` — D-05 one-shot audit artifact.
- [ ] `assert-size-limit-matches.mjs` `expectedMatchCounts` extension — add `'HeroUI vendor'`, `'Sentry vendor'`, `'DnD vendor'` (and any optional sub-vendor names) with expected count `1` so the script catches dead globs strictly.
- [ ] Smoke-PR cleanup script (optional) — none of the prior smoke phases scripted this; planner's call.

### Suppression Audit (D-14 — phase-wide net-new check)

Pre-phase baseline (verified 2026-05-12 via grep across `frontend/src`):

- `@ts-ignore` / `@ts-expect-error`: **2** occurrences total (one in `frontend/src/components/intake-form/IntakeForm.tsx:94`, one in `frontend/src/components/signature-visuals/__tests__/Icon.test.tsx:64`)
- `eslint-disable` (any variant): **2** files

D-14 phase-close check: same counts must hold after Phase 49 merges. Mirror the Phase 47 D-01 / Phase 48 D-17 audit shape: `git diff main...HEAD -- 'frontend/**' | grep -E '@ts-(ignore|expect-error)|eslint-disable' | wc -l` MUST return 0 (no net-new diff additions of suppression directives). Any genuinely required exception escalates to `49-EXCEPTIONS.md`.

## Security Domain

> `security_enforcement` is enabled by default (no opt-out in `.planning/config.json`).

### Applicable ASVS Categories

| ASVS Category         | Applies       | Standard Control                                                                                                                                                   |
| --------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | no            | Phase 49 is build-tooling + CI gating; no auth surface touched                                                                                                     |
| V3 Session Management | no            | Same                                                                                                                                                               |
| V4 Access Control     | yes (limited) | Branch-protection PUT requires GitHub repo-admin auth — `gh` CLI handles this via the user's PAT. T-49-XX threat model below covers the protection-weakening risk. |
| V5 Input Validation   | no            | No new user-input surfaces. The `.size-limit.json` is internal config, not user input.                                                                             |
| V6 Cryptography       | no            | No new crypto surface                                                                                                                                              |
| V14 Configuration     | yes           | Branch-protection config is security-relevant. Read-then-merge-then-write pattern (Phase 47 T-47-01 mitigation) protects against accidental rule weakening.        |

### Known Threat Patterns for {Phase 49 stack}

| Pattern                                                       | STRIDE                    | Standard Mitigation                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch-protection PUT drops existing required contexts        | Tampering                 | Pre-state capture (`/tmp/49-protection-before.json`) + post-state diff. PUT body explicitly merges all four contexts. Documented in Pattern 4.                                                                                                                                                                                              |
| Workflow `name:` vs `id:` casing typo makes gate vacuous      | Tampering (silent bypass) | Smoke PR D-12 is the empirical proof. If the gate doesn't BLOCK, the typo is detected. Documented in Pitfall 3.                                                                                                                                                                                                                             |
| `gh api` call run by an unauthorized actor weakens protection | Elevation of Privilege    | `enforce_admins: true` ensures the PUT requires repo-admin level. The PAT used by `gh` for the PUT is the actor's own; non-admin actors cannot succeed.                                                                                                                                                                                     |
| Smoke-PR accidentally merged                                  | Repudiation               | (1) Branch names carry "DO NOT MERGE". (2) PR titles include `(DO NOT MERGE)`. (3) PR bodies state "Will be closed without merging". (4) `gh pr close --delete-branch` runs BEFORE phase SUMMARY. (5) `mergeStateStatus=BLOCKED` itself prevents merge by anyone without admin bypass; with `enforce_admins=true`, even admins are blocked. |
| Sentry source-map upload leaks build info in CI               | Information Disclosure    | `isSentryEnabled` gate at `vite.config.ts:23` requires `process.env.NODE_ENV === 'production'` + full Sentry env. CI's `bundle-size-check` step does not set production env. Verify in Phase 49 that CI build does NOT trigger Sentry plugin (Pitfall 6).                                                                                   |

## Sources

### Primary (HIGH confidence)

- `frontend/vite.config.ts` (read end-to-end 2026-05-12) — manualChunks current shape, autoCodeSplitting wiring, visualizer config
- `frontend/.size-limit.json` (read 2026-05-12) — current ceiling values
- `frontend/scripts/assert-size-limit-matches.mjs` (read end-to-end 2026-05-12) — glob-shape contract + `expectedMatchCounts` map
- `frontend/package.json` (read 2026-05-12) — devDependency versions verified
- `.github/workflows/ci.yml:270-296` (read 2026-05-12) — `bundle-size-check` job shape + exact `name:` field
- `.planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md` Task 4 (read 2026-05-12) — verbatim `gh api PUT` payload
- `.planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-PLAN.md` (read 2026-05-12) — Lint context-addition pattern + read-then-merge-then-write
- Existing 28 `React.lazy()` call sites in `frontend/src` (grep-verified 2026-05-12) — template patterns for D-06

### Secondary (MEDIUM confidence)

- size-limit README via WebFetch (2026-05-12) — confirmed exit-on-overage behavior, JSON schema with `gzip`, glob support in `path`
- rollup-plugin-visualizer GitHub (2026-05-12) — gz + brotli support confirmed via current vite.config wiring
- TanStack Router docs (assumed from `autoCodeSplitting: true` flag presence + existing route-tree chunks in `dist/assets/`) — D-04 claim about auto-emitted route chunks

### Tertiary (LOW confidence)

- D-02 1.8 MB attainability — depends on post-D-07 audit results not yet measured. Confidence on the achievability claim is LOW until the audit runs. Escalation path is locked in D-02 itself: "if 1.8 MB is unattainable, planner escalates with measured numbers."
- Optional sub-vendor sizing (`tiptap-vendor`, `exceljs-vendor`) — TipTap and exceljs are confirmed present in dependencies, but their actual gz contribution to the residual `vendor` chunk is unknown until D-05 audit lands.

## Assumptions Log

| #   | Claim                                                                                                                                                           | Section                 | Risk if Wrong                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `tiptap-vendor` and `exceljs-vendor` will be ≥30 KB gz residuals worth promoting                                                                                | Pattern 1               | LOW — they're commented-out in the example. If audit shows <30 KB, the executor skips them. Phase 49 still satisfies D-07 with the three required sub-vendors.                                                                                      |
| A2  | `pdf-lib` / `pdfjs-dist` / `jspdf` are absent — verified by grep of `frontend/package.json` 2026-05-12                                                          | Pattern 1               | NONE — verified absence; the optional `pdf-vendor` per CONTEXT D-07 won't be created.                                                                                                                                                               |
| A3  | Sentry plugin won't fire in `bundle-size-check` CI step because `NODE_ENV !== 'production'`                                                                     | Pitfall 6               | MEDIUM — if Vite implicitly sets `NODE_ENV=production` during build, the plugin gates may fire. Verify during the audit phase by inspecting CI logs for Sentry upload mentions; if present, tighten the gate or pin `NODE_ENV=test` in the CI step. |
| A4  | The exact branch-protection contexts on `main` 2026-05-12 are `["Lint", "Security Scan", "type-check"]` (the post-Phase-48 state)                               | Pattern 4               | LOW — STATE.md and Phase 48 SUMMARY both attest to this. Step 1 of the PUT sequence (`gh api ... > /tmp/49-protection-before.json`) is the empirical re-verification.                                                                               |
| A5  | The CI Actions job `name:` literal `"Bundle Size Check (size-limit)"` (with the parenthesized `(size-limit)`) is the string GitHub stores in the check-run name | Pitfall 3               | LOW — verbatim from `ci.yml:271`, but smoke PR D-12 is the only empirical confirmation. If casing/formatting differs in the rendered check name, the smoke PR will show `mergeStateStatus: CLEAN` instead of `BLOCKED`.                             |
| A6  | The phase requires Wave 0 to create `frontend/docs/` folder — `ls frontend/docs/` returned no such directory 2026-05-12                                         | Pattern 6               | NONE — verified.                                                                                                                                                                                                                                    |
| A7  | The 2 existing `@ts-expect-error` instances in `frontend/src` were established pre-Phase-49 — they don't violate D-14                                           | Validation Architecture | NONE — verified via grep + line citations; both predate this phase.                                                                                                                                                                                 |

**If this table is empty:** Not applicable — A1, A3, A5 carry real risk and the planner should account for them.

## Open Questions

1. **Will `vite build` in CI's `bundle-size-check` step trigger `sentryVitePlugin`?**
   - What we know: `isSentryEnabled` requires `NODE_ENV === 'production'` PLUS Sentry env vars. CI step is `pnpm -C frontend build` (no explicit env). Vite 7 sets `import.meta.env.PROD` but `process.env.NODE_ENV` behavior under `pnpm` invocation is unconfirmed.
   - What's unclear: Whether the plugin would attempt source-map upload (requiring `SENTRY_AUTH_TOKEN` which isn't in CI step env) — if it errors, the build fails for the wrong reason.
   - Recommendation: Plan executor runs the bundle-size-check job locally (`act` or simulated) and checks build stdout for Sentry plugin output. If anything Sentry-related fires, add an explicit `env: { SENTRY_DSN: "" }` or wire a hard-disable in the plugin guard. Likely a no-op (auth-token gate already prevents upload), but confirm before the smoke PRs.

2. **D-02 1.8 MB Total JS feasibility post-audit.**
   - What we know: Baseline is 2.42 MB. Vendor super-chunk is 1.9 MB raw → ~600 KB gz. App chunk is 1.4 MB raw → ~412 KB gz. Decomposing vendor doesn't reduce Total — it just renames chunks. The only real reduction is lazy() pulling code OFF the initial path (so it isn't loaded on first paint) and dead-code elimination if any.
   - What's unclear: How much of the current 2.42 MB Total represents code that is loaded but unused on the initial route. The audit will surface this.
   - Recommendation: After D-05 audit, the planner computes `projected Total = 2.42 MB - (sum of gz-on-initial of lazy() candidates)`. If projected ≥ 1.8 MB, escalate per D-02 escalation path — propose a higher Total ceiling with measured justification, OR identify additional lazy()-able components.

3. **Should `signature-visuals/static-primitives` ceiling stay at 12 KB or drop the entry?**
   - What we know: CONTEXT D-03 says 12 KB (current 9). CONTEXT Claude's-Discretion says drop-or-keep is planner's call after audit.
   - What's unclear: Whether keeping the row buys signal vs noise.
   - Recommendation: Keep the entry at 12 KB for explicit budget visibility — its line cost is tiny, and a future regression that bloats this chunk is exactly the kind of silent drift Phase 49 is fixing. The 12 KB ceiling against 9 KB measured is 3 KB headroom — tighter than D-03's standard +5, intentionally tight because primitives shouldn't grow.

4. **Cleavage of plans: 1 vs 3.**
   - What we know: CONTEXT recommends 3-plan cleavage matching Phase 47/48 rhythm.
   - What's unclear: Whether 49-01 audit calibration can land in a single commit (small surface) or needs its own plan.
   - Recommendation: Adopt the 3-plan split per CONTEXT — it mirrors Phase 47/48 and isolates the audit artifact from the surgical edits. If 49-01 is genuinely small (`.size-limit.json` rewrite + audit doc commit), it stays as a small first plan to derisk the rest.

## Environment Availability

| Dependency                                 | Required By                                 | Available                   | Version                                         | Fallback |
| ------------------------------------------ | ------------------------------------------- | --------------------------- | ----------------------------------------------- | -------- |
| `pnpm`                                     | All build commands                          | ✓                           | 10.29.1+                                        | —        |
| `node`                                     | All build commands                          | ✓                           | 22.13.0+ (per `ci.yml:12`)                      | —        |
| `gh` CLI                                   | D-10 branch-protection PUT + D-12 smoke PRs | ✓                           | (system; verified working in Phase 47/48 plans) | —        |
| `jq`                                       | Verification of branch-protection state     | ✓ (system standard)         | —                                               | —        |
| `git`                                      | All commits + smoke-PR branch creation      | ✓                           | —                                               | —        |
| `size-limit` (npm)                         | BUNDLE-03 enforcement                       | ✓                           | 12.0.1 → resolves 12.1.0                        | —        |
| `@size-limit/preset-app`                   | size-limit configuration                    | ✓                           | 12.0.1 → 12.1.0                                 | —        |
| `@size-limit/file`                         | File-glob enforcement                       | ✓                           | 12.0.1 → 12.1.0                                 | —        |
| `rollup-plugin-visualizer`                 | D-05 audit artifact                         | ✓                           | 7.0.1                                           | —        |
| `@tanstack/router-plugin`                  | autoCodeSplitting confirmation              | ✓                           | 1.167.8                                         | —        |
| Production browser snapshot for E2E re-run | BUNDLE-02 verification                      | ✓ (Playwright 1.58.2 wired) | —                                               | —        |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

All required tooling is already installed and Phase-47/48-proven. Phase 49 introduces no new dependencies.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every library version verified via `npm view` + `package.json`; behavior cross-checked against current Vite + Rollup conventions.
- Architecture (manualChunks, lazy() patterns): HIGH — eight existing in-repo call sites for lazy() + the verbatim manualChunks arrow at `vite.config.ts:132` are the templates Phase 49 extends.
- CI gate + branch protection (D-10 + D-12): HIGH — verbatim API payload + smoke-PR commands carried from Phase 47 Task 4 and Phase 48 Task 2. Both prior phases shipped this pattern green.
- D-02 1.8 MB attainability: LOW — audit-dependent. Escalation path is locked in D-02 itself, so a HIGH-confidence research output is not required to begin work.
- Pitfalls: HIGH — drawn from Phase 47/48 incident lessons (Issue-2 mergeStateStatus fix; Issue-5 protection-payload trim; Phase 48 casing near-miss).

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (30 days — stable subdomain). Re-validate library versions if Phase 49 work extends beyond this window.
