# GASTAT International Dossier System - Design System

This directory contains the design system documentation and specifications for the GASTAT International Dossier System.

## Directory Structure

```
design-system/
├── README.md                 # This file - overview and navigation
├── foundations/             # Core design elements
│   ├── colors.md           # Color system, semantic tokens, themes
│   ├── typography.md       # Font families, sizes, weights, scales
│   ├── spacing.md          # Spacing scale, layout patterns
│   ├── breakpoints.md      # Custom breakpoints, mobile-first rules
│   └── rtl.md              # RTL support patterns and logical properties
├── components/             # Component specifications
│   ├── buttons.md          # Button variants, sizes, states
│   ├── cards.md            # Card patterns and usage
│   ├── forms.md            # Form components and patterns
│   └── navigation.md       # Navigation components
├── patterns/               # Design patterns
│   ├── mobile-first.md     # Mobile-first design patterns
│   ├── responsive.md       # Responsive design patterns
│   └── accessibility.md    # Accessibility patterns (WCAG AA)
└── guidelines/             # Implementation guidelines
    ├── aceternity-integration.md  # How to integrate Aceternity UI
    ├── component-checklist.md     # Pre-implementation checklist
    └── design-tokens.md           # Semantic token usage guide
```

## Available Themes

The system supports three themes:

1. **Natural (Default)** - Neutral, professional gray scale
2. **GASTAT** - GASTAT-specific branding (if different from Natural)
3. **Zinc** - shadcn/ui inspired zinc theme

**Note:** Blue Sky theme has been removed from the system.

## Key Principles

### 1. Mobile-First Design
- Start with base styles for 320px screens
- Scale up using Tailwind breakpoints: base → sm: → md: → lg: → xl: → 2xl:
- Custom breakpoints: xs (320px), sm (768px), md (1024px), lg (1440px)

### 2. RTL Support
- Use logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`
- Never use: `ml-*`, `mr-*`, `pl-*`, `pr-*`
- Text alignment: `text-start`, `text-end` (not `text-left`, `text-right`)

### 3. Semantic Color Tokens
- **Always** use semantic tokens: `bg-background`, `text-foreground`, `text-primary`
- **Never** use hardcoded colors: `bg-slate-900`, `bg-blue-500`

### 4. Aceternity UI Integration
- Check Aceternity UI (130+ components) first for any UI need
- Keep Aceternity animations and effects
- Adapt colors to use design system semantic tokens
- Use design system typography scale

## Quick Start

### For Designers
1. Review `foundations/` for core design elements
2. Check `components/` for component specifications
3. Follow `patterns/` for design patterns

### For Developers
1. Read `foundations/colors.md` for color token usage
2. Check `foundations/rtl.md` for RTL implementation
3. Follow `guidelines/component-checklist.md` before creating components
4. Consult `guidelines/aceternity-integration.md` for Aceternity component usage

## Component Library Hierarchy

When implementing UI components, follow this order:

1. **Aceternity UI** (Primary) - https://ui.aceternity.com/components
2. **Aceternity UI Pro** (Primary+) - https://pro.aceternity.com/components
3. **Kibo-UI** (Secondary) - https://www.kibo-ui.com
4. **shadcn/ui** (Last Resort) - https://ui.shadcn.com

## Contributing

When adding new design specifications:

1. Follow the existing markdown structure
2. Include code examples
3. Provide both correct (✅) and incorrect (❌) examples
4. Update this README if adding new categories

## Resources

- [Aceternity UI Components](https://ui.aceternity.com/components)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)

---

Last updated: 2025-10-29
