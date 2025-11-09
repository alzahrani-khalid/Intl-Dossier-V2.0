# ⚠️ IMPORTANT: Screenshot Location

## For All Chrome DevTools Screenshots

**ALWAYS** save screenshots to this folder: `.devtools-screenshots/`

### When using Chrome DevTools MCP tools:

```bash
# Correct path for screenshot tool
mcp__chrome-devtools__take_screenshot({
  filePath: ".devtools-screenshots/descriptive-name.png"
})
```

### Why This Matters:
- ✅ Keeps project root clean
- ✅ Prevents accidental git commits (folder is in .gitignore)
- ✅ Centralized location for all test artifacts
- ✅ Easy to find and manage screenshots

### Naming Convention:
Use descriptive names that include:
- Feature: `mobile-sidebar-`, `login-page-`, `theme-`
- State: `expanded`, `closed`, `fixed`, `error`
- Date (optional): `2025-10-28`

Example: `mobile-sidebar-expanded-2025-10-28.png`

---

**Remember**: This folder path should be used for ALL future Chrome DevTools screenshots!
