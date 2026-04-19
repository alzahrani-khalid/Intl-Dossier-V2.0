---
phase: 33-token-engine
plan: 05
type: execute
wave: 3
depends_on: ['33-02', '33-04']
files_modified:
  - frontend/src/components/ui/heroui-button.tsx
  - frontend/src/components/ui/heroui-card.tsx
  - frontend/src/components/ui/heroui-chip.tsx
  - frontend/src/components/ui/heroui-skeleton.tsx
  - frontend/src/components/ui/heroui-modal.tsx
  - frontend/src/components/ui/heroui-forms.tsx
  - frontend/src/components/ui/button.tsx
  - frontend/src/components/ui/skeleton.tsx
  - frontend/tests/unit/components/ui/heroui-wrappers.test.tsx
autonomous: true
requirements: [TOKEN-04, TOKEN-05]
must_haves:
  truths:
    - 'heroui-{button,card,chip,skeleton} now render real @heroui/react primitives, not plain HTML'
    - 'components/ui/{button,skeleton}.tsx are pure re-exports matching the card.tsx/badge.tsx pattern'
    - 'Zero per-component className overrides add color/accent/danger/ok/warn/info — all colors flow through --heroui-* / var(--accent)'
    - 'All existing call sites (250+ files using Button/Card/Skeleton/Badge) render unchanged'
  artifacts:
    - path: 'frontend/src/components/ui/heroui-button.tsx'
      provides: 'real HeroUI Button wrapper with cva variants + asChild'
    - path: 'frontend/src/components/ui/heroui-card.tsx'
      provides: 'HeroUI Card compound-component wrapper (Card.Header/Body/Footer)'
    - path: 'frontend/src/components/ui/heroui-chip.tsx'
      provides: 'HeroUI Chip wrapper'
    - path: 'frontend/src/components/ui/heroui-skeleton.tsx'
      provides: 'HeroUI Skeleton wrapper'
    - path: 'frontend/src/components/ui/button.tsx'
      provides: 're-export shim'
  key_links:
    - from: 'heroui-button.tsx'
      to: '@heroui/react Button primitive'
      via: 'import { Button as HeroUIButtonPrimitive }'
      pattern: "from '@heroui/react'"
---

# Plan 33-05: HeroUI Wrapper Rewrites

**Phase:** 33 (token-engine)
**Wave:** 3
**Depends on:** 33-02 (DesignProvider for runtime tokens), 33-04 (HeroUI install + `@plugin`)
**Type:** implementation
**TDD:** false
**Estimated effort:** M-L (5–6 h; 4 rewrites + 2 verifies + 2 re-export conversions)

## Goal

Replace the plain-HTML stubs in `heroui-{button,card,chip,skeleton}.tsx` with real `@heroui/react` primitives. Verify `heroui-forms.tsx` and `heroui-modal.tsx` still work unchanged after Plan 33-02's `useDirection` → `useDomDirection` import patch. Convert `components/ui/button.tsx` and `skeleton.tsx` from parallel shadcn implementations into re-export shims (matching `card.tsx` / `badge.tsx` pattern).

Success Criterion 5: zero per-component overrides. The cva variants stay (for size/shape/intent-naming) but NO color className overrides are added.

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-PATTERNS.md
@CLAUDE.md
@frontend/src/components/ui/heroui-forms.tsx
@frontend/src/components/ui/heroui-modal.tsx
@frontend/src/components/ui/heroui-button.tsx
@frontend/src/components/ui/heroui-card.tsx
@frontend/src/components/ui/heroui-chip.tsx
@frontend/src/components/ui/heroui-skeleton.tsx
@frontend/src/components/ui/button.tsx
@frontend/src/components/ui/card.tsx
@frontend/src/components/ui/badge.tsx
@frontend/src/components/ui/skeleton.tsx

<interfaces>
<!-- HeroUI v3 primitives consumed (from @heroui/react) -->
```typescript
import { Button, Card, Chip, Skeleton, Modal, TextField, Input, TextArea, Label, Description, FieldError, Select, Checkbox, Switch } from '@heroui/react'

// Compound exports used:
// Card.Header, Card.Body, Card.Footer
// Modal.Backdrop, Modal.Container, Modal.Dialog, Modal.Header, Modal.Body, Modal.Footer

````

<!-- Preserved wrapper API contracts (must stay stable for 250+ call sites) -->
```typescript
// heroui-button.tsx
export interface HeroUIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
export type ButtonProps = HeroUIButtonProps  // back-compat alias
export function HeroUIButton(props: HeroUIButtonProps): JSX.Element
export const buttonVariants: ReturnType<typeof cva>
````

</interfaces>
</context>

## Files to create / modify

| Path                                                         | Action  | Notes                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/components/ui/heroui-button.tsx`               | rewrite | Real `Button` from `@heroui/react`; keep cva `buttonVariants`; keep asChild+Slot escape hatch; keep `HeroUIButtonProps` + `ButtonProps` alias                                                                                        |
| `frontend/src/components/ui/heroui-card.tsx`                 | rewrite | Compound pattern: `<Card.Header>`, `<Card.Body>`, `<Card.Footer>`; preserve `data-slot` attrs; keep named exports `HeroUICard`, `HeroUICardHeader`, `HeroUICardBody`, `HeroUICardFooter`, `HeroUICardTitle`, `HeroUICardDescription` |
| `frontend/src/components/ui/heroui-chip.tsx`                 | rewrite | Real `Chip`; preserve `badgeVariants` cva block; keep asChild branch                                                                                                                                                                 |
| `frontend/src/components/ui/heroui-skeleton.tsx`             | rewrite | Real `Skeleton` primitive; preserve `SkeletonCard` + other preset exports (they move from `ui/skeleton.tsx`)                                                                                                                         |
| `frontend/src/components/ui/heroui-modal.tsx`                | verify  | Should already work after 33-02's `useDomDirection` rename; no rewrite                                                                                                                                                               |
| `frontend/src/components/ui/heroui-forms.tsx`                | verify  | Audit: remove any `textAlign:'right'`, confirm 44px touch targets                                                                                                                                                                    |
| `frontend/src/components/ui/button.tsx`                      | rewrite | 5-line re-export: `export { HeroUIButton as Button, buttonVariants } from './heroui-button'; export type { ButtonProps } from './heroui-button'`                                                                                     |
| `frontend/src/components/ui/skeleton.tsx`                    | rewrite | Re-export `Skeleton` + preset shims; preserve all currently-exported names                                                                                                                                                           |
| `frontend/tests/unit/components/ui/heroui-wrappers.test.tsx` | create  | Renders each wrapper inside `<DesignProvider>`, asserts `data-slot` attribute, asserts no override className added                                                                                                                   |

## Implementation steps

### Task 1 — Rewrite `heroui-button.tsx`

Template from PATTERNS.md §Section 3 "After":

```tsx
import * as React from 'react'
import { Button as HeroUIButtonPrimitive } from '@heroui/react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  /* existing base classes from current file lines 25-53 — copy verbatim */
  '',
  {
    variants: {
      variant: {
        /* ... */
      },
      size: {
        /* ... */
      },
    },
    defaultVariants: {
      /* ... */
    },
  },
)

export interface HeroUIButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
export type ButtonProps = HeroUIButtonProps

export function HeroUIButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: HeroUIButtonProps): JSX.Element {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
  return (
    <HeroUIButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
export { buttonVariants }
export default HeroUIButton
```

**Invariants** (PATTERNS.md §Section 3):

1. `data-slot="button"` preserved
2. `cn(variants(...), className)` merge order (incoming className wins)
3. `asChild + Slot` branch preserved
4. Named + default export preserved
5. `ButtonProps` type alias preserved

**SC-5 enforcement**: the cva base string contains NO `bg-*` / `text-*` / `border-*` color utility. Variants like `variant: 'default'` may contain `bg-primary text-primary-foreground` because those resolve (via Plan 33-06's Tailwind remap) to `var(--accent) / var(--accent-fg)`. Any OTHER color class (e.g. `bg-slate-500`, `text-blue-600`) is a plan violation — remove it.

### Task 2 — Rewrite `heroui-card.tsx`

Compound pattern from PATTERNS.md §Section 1:

```tsx
import { Card } from '@heroui/react'

export function HeroUICard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <Card data-slot="card" className={cn('…existing base classes…', className)} {...props} />
}
export function HeroUICardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <Card.Header data-slot="card-header" className={cn(className)} {...props} />
}
// Body, Footer, Title, Description — same pattern
```

Keep all `data-slot="card-*"` attributes (downstream CSS uses `has-[data-slot=card-header]` selectors per PATTERNS.md).

### Task 3 — Rewrite `heroui-chip.tsx`

```tsx
import { Chip as HeroUIChipPrimitive } from '@heroui/react'
// preserve `badgeVariants` cva (current lines 18-40) unchanged
export function HeroUIChip({
  className,
  variant,
  asChild = false,
  ...props
}: HeroUIChipProps): JSX.Element {
  if (asChild) return <Slot className={cn(badgeVariants({ variant }), className)} {...props} />
  return <HeroUIChipPrimitive className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

### Task 4 — Rewrite `heroui-skeleton.tsx`

```tsx
import { Skeleton as HeroUISkeletonPrimitive } from '@heroui/react'
export function HeroUISkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <HeroUISkeletonPrimitive className={cn(className)} {...props} />
}
```

MOVE preset compositions (`SkeletonCard`, `SkeletonTable`, etc.) currently at `ui/skeleton.tsx` INTO this file so the re-export in Task 6 is clean. Each preset is `return <HeroUISkeleton className="..." />` internally.

### Task 5 — Verify `heroui-modal.tsx` and `heroui-forms.tsx`

- `heroui-modal.tsx`: confirm line 16 import was updated by Plan 33-02 (`useDomDirection`). Run `pnpm typecheck`. If Modal renders correctly in DesignProvider context, done.
- `heroui-forms.tsx`: grep for `textAlign:\s*['"]right['"]` — delete any found (RTL rule #3 in global CLAUDE.md). Grep for `min-h-` — confirm 44px minimums on interactive controls.

### Task 6 — Convert `button.tsx` and `skeleton.tsx` to re-exports

**`button.tsx`** (currently 59 lines of shadcn impl → becomes 3 lines):

```tsx
/**
 * Re-export shim: Button sourced from heroui-button for HeroUI v3 compatibility.
 * See CLAUDE.md §HeroUI v3 Drop-In Replacement Pattern.
 */
export { HeroUIButton as Button, buttonVariants } from './heroui-button'
export type { ButtonProps } from './heroui-button'
```

**`skeleton.tsx`** (currently 101 lines → becomes re-exports):

```tsx
/**
 * Re-export shim: Skeleton + presets sourced from heroui-skeleton.
 */
export {
  HeroUISkeleton as Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonText,
} from './heroui-skeleton'
```

(Enumerate whichever preset names currently exist — preserve the exact list so no call site breaks.)

### Task 7 — Test suite

`frontend/tests/unit/components/ui/heroui-wrappers.test.tsx`:

- For each of 6 wrappers: render inside a `<DesignProvider>` with `renderHook`/`render`, assert:
  - `data-slot` attribute present
  - Passed-through `className` wins the merge
  - `asChild` branch where applicable renders `<Slot>`
- "No override" assertion: render `<Button variant="destructive">`, inspect the rendered DOM element's `className`, assert it does NOT contain any `bg-red-\d+` / `text-red-\d+` — only semantic names (`bg-destructive`, `text-destructive-foreground`) that resolve through the Tailwind remap.

## Definition of done

- [ ] `heroui-{button,card,chip,skeleton}.tsx` all import from `@heroui/react` (verified: `grep -l "from '@heroui/react'" frontend/src/components/ui/heroui-*.tsx` returns all 6)
- [ ] `components/ui/button.tsx` and `components/ui/skeleton.tsx` are each ≤ 20 lines and contain only re-exports
- [ ] `pnpm --filter frontend typecheck` clean
- [ ] `pnpm --filter frontend lint` clean
- [ ] `pnpm --filter frontend test unit/components/ui/heroui-wrappers` passes
- [ ] `pnpm --filter frontend build` succeeds with no warnings about missing compound-component imports
- [ ] Manual: `pnpm dev` → navigate to 3 representative routes (dashboard, list view, detail) → confirm Buttons / Cards / Chips / Skeletons render; toggle mode/direction via DesignProvider → all update live
- [ ] **Zero-override audit**: `grep -rn "bg-red\|bg-blue\|bg-green\|bg-yellow\|text-red\|text-blue" frontend/src/components/ui/heroui-*.tsx` returns 0 lines
- [ ] RTL check: EN + AR both render Button (with leading icon via `<Button startContent={…}>`) — icon placement follows RTL rules (leads right in AR, left in EN)

## Requirements satisfied

- TOKEN-04 (full, in concert with 33-06)
- TOKEN-05 (partial — grid verification lives in 33-08)

## Success Criteria contribution

- SC-5 (primary): HeroUI v3 primitives consume tokens exclusively via `@plugin` + `--heroui-*` bridge. No per-component color overrides. Tailwind utilities (`bg-accent`, `text-ink`, etc.) resolve to the active token values.

## Risks / unknowns

- **HeroUI Card.Header API mismatch**: CLAUDE.md documents compound pattern but HeroUI v3 beta may not match exactly. Spike in a scratch file first; if API differs, use the actual v3 names (`CardHeader`, not `Card.Header` — verify via `heroui-react` MCP or docs). Document actual names in SUMMARY.
- **Skeleton preset exports breakage**: if `ui/skeleton.tsx` currently exports names that `heroui-skeleton.tsx` doesn't define, call sites break. Enumerate all current exports and replicate.
- **cva variant color classes relying on Tailwind remap**: this plan depends on Plan 33-06 running (remap). If 33-06 runs after 33-05, there's a brief window in dev where `bg-primary` resolves to the OLD HSL value. Mitigate: sequence 33-06 before 33-05 in the actual execution (both are wave 2/3 — Wave 2 = 33-06, Wave 3 = 33-05, already correct).

## Verification

```bash
pnpm --filter frontend typecheck
pnpm --filter frontend lint
pnpm --filter frontend test unit/components/ui/heroui-wrappers
pnpm --filter frontend build
# Zero-override grep
grep -rn "bg-red-\|bg-blue-\|bg-green-\|bg-yellow-\|text-red-\|text-blue-" frontend/src/components/ui/heroui-*.tsx
# Should output nothing
pnpm --filter frontend dev
# Manual: navigate dashboard/list/detail, toggle direction/mode/hue, confirm every Button/Card/Chip/Skeleton updates
```
