# Component Auditor

**Purpose:** Inspect UI component library correctness — HeroUI wrappers, shadcn re-exports, prop APIs, and usage consistency.

## File Scope

**Primary:**

- `frontend/src/components/ui/heroui-*.tsx` — HeroUI v3 wrappers
- `frontend/src/components/ui/*.tsx` — shadcn re-exports and custom components
- `frontend/components.json` — shadcn configuration

**Secondary (check usage):**

- `frontend/src/components/layout/*.tsx` — Layout components
- `frontend/src/components/Dossier/*.tsx` — Dossier-specific components
- Route-specific components for the current journey

## Checklist

### HeroUI Wrapper Integrity

- [ ] Each `heroui-*.tsx` renders plain HTML elements (div/span/button), not HeroUI primitives
- [ ] `React.HTMLAttributes` compatibility maintained on all wrappers
- [ ] `buttonVariants` exported via cva with correct variant definitions
- [ ] `asChild` prop works correctly via `@radix-ui/react-slot`
- [ ] `forwardRef` used where DOM ref access is needed
- [ ] `className` merging uses `cn()` (clsx + tailwind-merge)

### Re-Export Consistency

- [ ] Each `ui/button.tsx` properly re-exports from `heroui-button.tsx`
- [ ] Each `ui/card.tsx` properly re-exports from `heroui-card.tsx`
- [ ] Each `ui/badge.tsx` properly re-exports from `heroui-chip.tsx`
- [ ] Each `ui/skeleton.tsx` properly re-exports from `heroui-skeleton.tsx`
- [ ] No circular imports between wrapper and re-export files
- [ ] TypeScript types match between wrapper and re-export

### Prop API Correctness

- [ ] Required props are enforced (no optional where required)
- [ ] Default values are sensible and documented
- [ ] Variant props match the cva definition
- [ ] Event handlers typed correctly (onClick, onChange, etc.)
- [ ] Disabled state properly propagated to DOM

### Component Quality

- [ ] No unused imports in component files
- [ ] No `any` types in component props
- [ ] Accessibility attributes present (aria-label, role, etc.)
- [ ] Key props on mapped lists
- [ ] Conditional rendering doesn't cause flicker

### Form Components

- [ ] `form.tsx` FormField/FormItem/FormControl chain works
- [ ] `heroui-forms.tsx` TextField/TextArea render correctly
- [ ] Validation errors display properly
- [ ] Form reset clears all fields

### Complex Components

- [ ] `kanban.tsx` — drag-drop works, state updates correctly
- [ ] `form-wizard.tsx` — step navigation, validation per step
- [ ] `context-aware-fab.tsx` — context detection, action routing
- [ ] `content-skeletons.tsx` — skeleton shapes match actual content

## Output Format

```markdown
### [SEVERITY] Description

- **File:** path:line
- **Agent:** component-auditor
- **Journey:** {journey-id}
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [journeys]
```

## Severity Guide

- **CRITICAL:** Component crashes, prop type mismatch causes runtime error, broken re-export
- **WARNING:** Missing accessibility, inconsistent API, unused import, type widening
- **INFO:** Code style, optimization, documentation gap
