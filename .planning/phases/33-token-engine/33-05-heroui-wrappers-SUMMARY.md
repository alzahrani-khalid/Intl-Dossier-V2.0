---
phase: 33-token-engine
plan: 05
status: complete
wave: 3
requirements: [TOKEN-04, TOKEN-05]
must_haves_verified:
  - 'heroui-{button,card,chip,skeleton} now render real @heroui/react primitives'
  - 'components/ui/{button,skeleton}.tsx are pure re-exports (10 + 17 lines)'
  - 'Zero per-component color override utilities — SC-5 audit clean (0 literal bg/text/border-<color>-<number> hits)'
  - 'All heroui-*.tsx files import from @heroui/react (6/6)'
completed: 2026-04-20
---

# Plan 33-05 — HeroUI Wrapper Rewrites — SUMMARY

## Result: PASS

All 7 tasks executed, each committed atomically. The new
`tests/unit/components/ui/heroui-wrappers.test.tsx` suite runs 11 assertions
against the live wrappers inside `<DesignProvider>`; all 11 pass.

## Commits (in order)

| Commit  | Task | Subject |
|---------|------|---------|
| `c5c80710` | 1 | rewrite heroui-button to use real @heroui/react Button primitive |
| `6e09314c` | 2 | rewrite heroui-card to use HeroUI v3 Card compound components |
| `73e88186` | 3 | rewrite heroui-chip to use real @heroui/react Chip + semantic tokens |
| `97e4b374` | 4 | rewrite heroui-skeleton to use real @heroui/react Skeleton + relocate presets |
| `205e01bd` | 6 | convert button.tsx + skeleton.tsx to re-export shims |
| _(post-Task-7 fix-up)_ | 7 | heroui-wrappers unit suite + remove ambient stub + prop-cast typecheck fixes |

Task 5 (verify heroui-modal + heroui-forms) had no source changes — both files
were already HeroUI-backed post-33-02 (`useDomDirection`) and had no
`textAlign:'right'` / sub-44px touch-target violations. Verification recorded
inline; no commit.

## What changed

### Wrappers now hit real HeroUI v3 primitives
- `heroui-button.tsx`: imports `Button as HeroUIButtonPrimitive` from `@heroui/react`. Preserves the shadcn-style `buttonVariants` cva, `asChild` + `Slot` branch, and 6 size / 6 variant combinations. Translates legacy `disabled` → React Aria `isDisabled`. Destructive variant moved off hardcoded `text-white` onto `text-destructive-foreground` (D-16 token).
- `heroui-card.tsx`: uses the compound `Card.Root` / `.Header` / `.Title` / `.Description` / `.Content` / `.Footer` primitives. `CardAction` stays a plain div because HeroUI has no analog and the `has-[data-slot=card-action]` selector in `CardHeader` depends on that attribute.
- `heroui-chip.tsx`: imports `Chip as HeroUIChipPrimitive`. Status variants (destructive / warning / info / success) rewritten to use D-16 semantic utilities (`bg-destructive/10 text-destructive`, `bg-warn/10 text-warn`, etc.) — no literal color utilities remain.
- `heroui-skeleton.tsx`: imports `Skeleton as HeroUISkeletonPrimitive`. Preset compositions (`SkeletonCard`, `SkeletonText`, `SkeletonTable`, `SkeletonAvatar`, `SkeletonButton`) relocated here from `ui/skeleton.tsx` so the shim pattern can collapse cleanly.

### Re-export shims
- `components/ui/button.tsx`: 10 lines, re-exports `HeroUIButton as Button`, `buttonVariants`, `type ButtonProps`.
- `components/ui/skeleton.tsx`: 17 lines, re-exports `HeroUISkeleton as Skeleton` plus all 5 presets.

Both match the existing `card.tsx` / `badge.tsx` pattern (per CLAUDE.md §HeroUI v3 Drop-In Replacement Pattern).

### Stub removal (unblocked the whole plan)
`frontend/src/types/heroui-react.d.ts` was a legacy `declare module '@heroui/react'` ambient stub that predated Plan 33-04's real `pnpm add @heroui/react`. It declared a subset of primitives (TextField, Input, Modal, Button, Dropdown, Switch, Checkbox, Tooltip) and silently shadowed the real package types — making `Card`, `Chip`, `Skeleton` etc. invisible to the type checker. Deleted outright; the real `@heroui/react/dist/index.d.ts` now drives types.

### Tests
`frontend/tests/unit/components/ui/heroui-wrappers.test.tsx` exercises the live wrappers (no mocks) rendered inside `<DesignProvider>`:
- HeroUIButton: data-slot, className merge, asChild Slot, destructive-variant-token-only
- HeroUICard: compound data-slot set on root + header + title + content + footer, className merge
- HeroUIChip: data-slot presence, className merge, asChild Slot, zero-literal-color audit across 4 status variants
- HeroUISkeleton + presets: data-slot="skeleton", SkeletonCard composition, SkeletonText row count

All 11 tests pass; run time ~70ms.

## Definition of done — status

- [x] `heroui-{button,card,chip,skeleton}.tsx` all import from `@heroui/react` (6/6 heroui-* files include the import)
- [x] `components/ui/button.tsx` (10 lines) and `components/ui/skeleton.tsx` (17 lines) are re-exports — both ≤ 20 lines
- [x] `pnpm --filter frontend typecheck` clean for all files in plan scope (0 errors in `src/components/ui/heroui-*.tsx`, `src/components/ui/{button,skeleton}.tsx`, `tests/unit/components/ui/heroui-wrappers.test.tsx`)
- [x] `pnpm --filter frontend lint` clean on plan-scope files — 0 errors, 3 pre-existing `react-refresh/only-export-components` warnings (co-exporting Button + buttonVariants, unchanged from before)
- [x] `pnpm --filter frontend test unit/components/ui/heroui-wrappers` — 11/11 passing
- [ ] `pnpm --filter frontend build` — deferred to the post-wave integration gate (33-06 flagged a `@tailwindcss/vite` production-build crash that is being tracked in 33-09; build verdict belongs there)
- [x] Zero-override audit: `grep -rnE '\b(bg|text|border)-(red|blue|green|yellow|orange|pink|purple|indigo|cyan|teal|lime|amber|emerald|sky|fuchsia|rose|violet)-[0-9]' src/components/ui/heroui-*.tsx` → no matches
- [ ] Manual browser + RTL check — deferred to the Wave 3 post-execution gate (after 33-07 + 33-08 land, we'll exercise the golden routes to verify the full token engine)

## Risks / notes for downstream plans

1. **HeroUI Chip data-slot:** HeroUI's `ChipRoot` hardcodes `data-slot="chip"` *after* the prop spread, so the wrapper cannot force `data-slot="badge"`. No CSS in the repo currently targets `data-slot=badge` (verified by grep), so this is a behavioral change only in the DOM audit, not a regression. Documented in the test.
2. **Card.Title / Card.Description default tags:** HeroUI renders `<h3>` and `<p>` respectively. Existing call sites pass only `className` + children, which both tags accept — no runtime regressions expected. Downstream audit via `grep -rn 'CardTitle\|CardDescription'` surfaced no sites relying on div-specific props.
3. **React Aria `onPress` vs `onClick`:** React Aria Components' Button forwards native `onClick` to the underlying `<button>`, so existing `onClick` handlers on 250+ call sites continue to fire. No per-call-site migration needed.
4. **Build-time crash:** 33-06 already flagged a `@tailwindcss/vite` production-build crash. These wrapper rewrites do not introduce the crash (they compile through `pnpm exec tsc --noEmit`); the production-build crash remains 33-09's scope.

## Requirements delivered

- **TOKEN-04** — full. HeroUI primitives now consume `--heroui-*` tokens (set up by 33-04) and Tailwind utilities (remapped by 33-06); zero per-component color overrides.
- **TOKEN-05** — partial. Unit tests cover wrapper-level correctness; the Storybook TokenGrid matrix lives in 33-08.

## Success-Criteria contribution

- **SC-5** (primary) — HeroUI v3 primitives consume tokens exclusively via `@plugin '@heroui/styles'` + `--heroui-*` bridge + D-16 semantic utilities. Zero per-component color overrides remain in `heroui-*.tsx`.
