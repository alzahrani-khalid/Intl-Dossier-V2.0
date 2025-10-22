# Kibo UI Mobile-First Development Skill

This skill provides patterns for building mobile-first, responsive, RTL-compatible React components using Kibo UI for the GASTAT International Dossier Management System.

## Skill Structure

```
kibo-ui-mobile-first/
├── SKILL.md                    # Main skill file (required)
└── templates/                  # Supporting template files
    ├── component-template.tsx  # Generic component template
    └── form-template.tsx       # Form component template
```

## What This Skill Does

This skill will be automatically invoked by Claude Code when you:
- Create or modify UI components
- Work with responsive layouts
- Build forms, cards, or navigation
- Implement RTL/LTR bilingual interfaces
- Mention keywords like: "mobile", "responsive", "RTL", "Arabic", "form", "card", "layout"

## Key Features

### 1. Mobile-First Design
- Starts at 320px viewport
- Uses `useResponsive()` hook
- 44px minimum touch targets
- Progressive enhancement

### 2. RTL/LTR Support
- Automatic Arabic/English support
- Logical CSS properties (ms-, pe-, etc.)
- Direction-aware layouts

### 3. Kibo UI Integration
- Uses existing shadcn/ui primitives
- Leverages ResponsiveCard, ResponsiveWrapper
- GASTAT theme compliance

## How to Use

### Automatic Invocation
Claude Code will automatically use this skill when relevant. Just ask:

```
"Create a responsive card component"
"Build a mobile-friendly form"
"Add RTL support to this component"
```

### Manual Templates
Copy templates from the `templates/` directory:

```typescript
// Component template
import { TemplateComponent } from '.claude/skills/kibo-ui-mobile-first/templates/component-template'

// Form template
import { ResponsiveFormTemplate } from '.claude/skills/kibo-ui-mobile-first/templates/form-template'
```

## Testing the Skill

Test that the skill is working:

```bash
# Ask Claude Code
"Create a stat card component using Kibo UI"

# Claude should:
# ✓ Use ResponsiveCard
# ✓ Apply mobile-first styling
# ✓ Include useResponsive() hook
# ✓ Add RTL support
# ✓ Use 44px touch targets
```

## Skill Metadata

- **Version**: 1.0.0
- **Author**: GASTAT Development Team
- **Type**: Project Skill
- **Location**: `.claude/skills/kibo-ui-mobile-first/`

## Related Documentation

- Design System: `frontend/DESIGN_SYSTEM.md`
- Component Inventory: `frontend/COMPONENT_INVENTORY.md`
- Migration Checklist: `frontend/KIBO_UI_MIGRATION_CHECKLIST.md`
- Code Examples: `frontend/MOBILE_FIRST_EXAMPLES.md`
- Main Config: `.claude.config.md`

## Troubleshooting

### Skill Not Activating

If Claude doesn't use the skill:

1. **Check file path**: Must be `.claude/skills/kibo-ui-mobile-first/SKILL.md`
2. **Verify YAML**: Check frontmatter is valid
3. **Use trigger keywords**: Mention "component", "mobile", "responsive", etc.
4. **Check description**: The description field determines when skill activates

### Verify Skill is Loaded

```bash
# Check file exists
ls -la .claude/skills/kibo-ui-mobile-first/SKILL.md

# Check YAML syntax (first 5 lines)
head -5 .claude/skills/kibo-ui-mobile-first/SKILL.md
```

Should see:
```yaml
---
description: >
  Use when creating or modifying React components...
version: 1.0.0
---
```

## Updating the Skill

To update:

```bash
# Edit SKILL.md
nano .claude/skills/kibo-ui-mobile-first/SKILL.md

# Changes take effect immediately
# No restart needed
```

## Sharing with Team

This skill is in `.claude/skills/` (project-level), so it's automatically shared via git:

```bash
git add .claude/skills/
git commit -m "Add Kibo UI mobile-first skill"
git push
```

Team members will get the skill when they pull.

---

**Last Updated**: 2025-01-22  
**Compatible with**: Claude Code 1.0+
