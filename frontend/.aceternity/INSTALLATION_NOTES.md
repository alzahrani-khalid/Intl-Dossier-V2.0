# Aceternity UI Installation Notes

## Important Discovery

Aceternity UI does NOT use the traditional shadcn `registries` configuration in `components.json`. Instead, components are installed via direct URLs.

## Installation Methods

### Aceternity UI Free Components (130+ components)

```bash
npx shadcn@latest add https://ui.aceternity.com/registry/[component-name].json
```

**Example:**
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json
npx shadcn@latest add https://ui.aceternity.com/registry/floating-navbar.json
npx shadcn@latest add https://ui.aceternity.com/registry/3d-card.json
```

### Aceternity UI Pro Components (30+ blocks, 7+ templates)

**API Key**: Stored in `.env.local` (never commit!)
```
ACETERNITY_PRO_API_KEY=aceternity_90f92c066a18e6a7c9ae2f9bfdf420e33f75fa2a10beb070e412075d0cf63551
```

**Installation** (verify command format with Aceternity Pro docs):
```bash
# Method 1: Direct URL with API key in headers
npx shadcn@latest add https://pro.aceternity.com/registry/[component-name].json

# Method 2: Using Pro registry shorthand (if supported)
npx shadcn@latest add @aceternity-pro/[component-name]
```

**Note**: Pro installation method needs verification. Check https://pro.aceternity.com/docs for latest instructions.

## Component Hierarchy (MANDATORY)

1. **Aceternity UI (Primary)** - 130+ components
   - Install: `npx shadcn@latest add https://ui.aceternity.com/registry/[name].json`
   - Catalog: https://ui.aceternity.com/components

2. **Aceternity UI Pro (Primary+)** - 30+ blocks, 7+ templates
   - Requires API key
   - Catalog: https://pro.aceternity.com/components

3. **Kibo-UI (Secondary)** - Fallback
   - Install: `npx shadcn@latest add @kibo-ui/[name]`
   - Catalog: https://www.kibo-ui.com

4. **shadcn/ui (Last Resort)** - Only when no alternative exists
   - Install: `npx shadcn@latest add [name]`
   - Catalog: https://ui.shadcn.com

## Key Dependencies

- ✅ framer-motion - Required for Aceternity animations
- ✅ clsx - Utility for conditional classnames
- ✅ tailwind-merge - Merge Tailwind classes

Installed via:
```bash
pnpm add framer-motion clsx tailwind-merge
```

## Verified Working Examples

### Free Components Tested
- ✅ bento-grid - Successfully installed to `src/components/ui/bento-grid.tsx`

### Pro Components Tested
- ⏳ Pending verification

## MCP Server Integration

Aceternity UI MCP Server for AI-assisted component discovery:

**Installation**: Add to Claude Code config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "aceternityui": {
      "command": "npx",
      "args": ["aceternityui-mcp"]
    }
  }
}
```

**Usage**: After restart, use the `aceternityui` MCP tools to:
- Search for components by name/description
- Get component details
- Find component categories

## Troubleshooting

### Issue: "Invalid configuration in components.json"
**Solution**: Remove custom `registries` field from components.json. Aceternity uses direct URLs, not registry shortcuts.

### Issue: Nested directory (`/frontend/frontend/frontend`)
**Solution**: Always run commands from project root `/Intl-DossierV2.0/frontend` directory.

### Issue: Component not found
**Solution**:
1. Check component name at https://ui.aceternity.com/components
2. Verify exact spelling (kebab-case)
3. Ensure URL format: `https://ui.aceternity.com/registry/[name].json`

## Next Steps

1. Update CLAUDE.md with Acet

ernity-first policy
2. Create CLI helper script for component hierarchy
3. Test Pro component installation
4. Document all 130+ free components
5. Begin migration planning
