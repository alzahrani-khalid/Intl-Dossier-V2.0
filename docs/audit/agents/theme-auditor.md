# Theme Auditor

**Purpose:** Inspect CSS variables, theme tokens, dark/light mode consistency, and color system correctness.

## File Scope

**Primary:**

- `frontend/src/index.css` — CSS custom properties
- `frontend/src/styles/modern-nav-tokens.css` — Navigation tokens
- `frontend/tailwind.config.ts` — Theme extension
- `frontend/src/components/theme-provider/theme-provider.tsx`
- `frontend/src/components/theme-selector/theme-selector.tsx`
- `frontend/src/components/ui/theme-toggle.tsx`

**Secondary (check usage):**

- All `frontend/src/components/ui/*.tsx`
- All `frontend/src/components/layout/*.tsx`
- Route-specific components for the current journey

## Checklist

### Token Consistency

- [ ] All `--heroui-*` variables defined in both `:root` and `.dark`
- [ ] No orphaned CSS variables (defined but never used)
- [ ] No undefined CSS variables (used but never defined)
- [ ] oklch values are syntactically valid (lightness 0-100%, chroma 0-0.4, hue 0-360)
- [ ] Color scale progressions are monotonic (50 lighter than 100, 100 lighter than 200, etc.)

### Dark/Light Mode

- [ ] `.dark` class overrides exist for all theme-dependent variables
- [ ] No hardcoded colors (`#fff`, `#000`, `rgb(...)`) outside of CSS variable definitions
- [ ] `bg-background`, `text-foreground` used instead of raw colors
- [ ] Dark mode backgrounds are darker than foregrounds (not inverted)
- [ ] Borders and dividers have appropriate contrast in both modes

### Component Theming

- [ ] All UI components use theme tokens, not hardcoded values
- [ ] Hover/focus/active states use theme-aware colors
- [ ] Shadows use theme variables or appropriate opacity
- [ ] Scrollbar styling respects theme
- [ ] Selection/highlight colors respect theme

### Typography

- [ ] Font families use CSS variables (`--text-family`, `--text-family-rtl`)
- [ ] Font sizes follow the type scale defined in index.css
- [ ] Line heights are consistent across components
- [ ] Font weights are limited to the defined scale

### Transitions

- [ ] Theme switch doesn't cause flash of wrong colors
- [ ] CSS transitions on color properties are smooth
- [ ] No layout shift during theme change

## Output Format

```markdown
### [SEVERITY] Description

- **File:** path:line
- **Agent:** theme-auditor
- **Journey:** {journey-id}
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [journeys]
```

## Severity Guide

- **CRITICAL:** Missing dark mode definition causes invisible text/elements
- **WARNING:** Hardcoded color, inconsistent token usage, contrast issue
- **INFO:** Unused variable, minor inconsistency, optimization opportunity
