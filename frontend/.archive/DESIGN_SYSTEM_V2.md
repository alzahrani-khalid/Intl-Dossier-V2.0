# GASTAT International Dossier System - Design System

**Status**: 🚀 Migrated to `/design-system/`

---

## 📍 New Location

This document has been reorganized into a comprehensive design system structure located at:

```
frontend/design-system/
```

## 🗂️ Quick Navigation

### Core Documentation

- **[Design System Home](./design-system/README.md)** - Start here for overview and navigation

### Foundations

- [Colors](./design-system/foundations/colors.md) - Color system, semantic tokens, themes
- [Typography](./design-system/foundations/typography.md) - Font families, sizes, weights
- [Breakpoints](./design-system/foundations/breakpoints.md) - Custom breakpoints, mobile-first
- [RTL Support](./design-system/foundations/rtl.md) - Right-to-left patterns and logical properties

### Guidelines

- [Aceternity Integration](./design-system/guidelines/aceternity-integration.md) - How to use Aceternity UI components
- [Component Checklist](./design-system/guidelines/component-checklist.md) - Pre-implementation checklist

---

## Why the Change?

The design system has been reorganized for better:

1. **Organization**: Separate foundations, components, patterns, and guidelines
2. **Scalability**: Easy to add new documentation as the system grows
3. **Navigation**: Clear hierarchy and dedicated README per section
4. **Collaboration**: Team members can find exactly what they need quickly
5. **Maintenance**: Changes are isolated to specific areas

## What Changed?

### Removed

- ❌ **Blue Sky Theme** - Removed from entire system
  - Updated TypeScript types
  - Removed theme files
  - Updated translation keys
  - Theme options now: Natural (default), GASTAT, Zinc

### Added

- ✅ **Structured folder hierarchy**: `foundations/`, `components/`, `patterns/`, `guidelines/`
- ✅ **Individual topic files**: Each design system aspect has its own focused document
- ✅ **Comprehensive checklists**: Pre and post-implementation guides
- ✅ **Navigation aids**: READMEs and cross-links between documents

### Improved

- ✨ **Aceternity UI guidance**: Detailed integration patterns with examples
- ✨ **RTL support**: Complete guide with all logical properties
- ✨ **Mobile-first patterns**: Clear responsive design guidelines
- ✨ **Accessibility**: WCAG AA requirements throughout

## Quick Start

### For New Developers

1. Read [Design System README](./design-system/README.md)
2. Review [Foundations: Colors](./design-system/foundations/colors.md)
3. Check [Component Checklist](./design-system/guidelines/component-checklist.md) before building
4. Consult [Aceternity Integration](./design-system/guidelines/aceternity-integration.md) for components

### For Existing Developers

If you're familiar with the old DESIGN_SYSTEM_V2.md:

- **Colors** → `design-system/foundations/colors.md`
- **Typography** → `design-system/foundations/typography.md`
- **Breakpoints** → `design-system/foundations/breakpoints.md`
- **RTL** → `design-system/foundations/rtl.md`
- **Aceternity** → `design-system/guidelines/aceternity-integration.md`
- **Checklist** → `design-system/guidelines/component-checklist.md`

## Available Themes (Updated)

| Theme        | Status       | Description                      |
| ------------ | ------------ | -------------------------------- |
| **Natural**  | ✅ Default   | Neutral gray scale, professional |
| **GASTAT**   | ✅ Available | GASTAT-specific branding         |
| **Zinc**     | ✅ Available | shadcn/ui zinc theme             |
| ~~Blue Sky~~ | ❌ Removed   | No longer available              |

## Key Principles (Unchanged)

1. **Mobile-First**: Start at 320px, scale up
2. **RTL Support**: Use logical properties (`ms-*`, `ps-*`, `text-start`)
3. **Semantic Tokens**: Use `bg-background`, `text-foreground` (never hardcoded colors)
4. **Aceternity First**: Check Aceternity UI before building custom components
5. **Accessibility**: WCAG AA compliance (4.5:1 text, 3:1 UI)

## Migration Notes

If you have bookmarks or references to the old DESIGN_SYSTEM_V2.md:

```
Old: /frontend/DESIGN_SYSTEM_V2.md
New: /frontend/design-system/README.md
```

All content has been preserved and expanded. No information was lost.

---

**Last Updated**: 2025-10-29
**Version**: 3.0 (Restructured)
**Maintained By**: Frontend Team

For questions or suggestions, please contact the design system maintainers.
