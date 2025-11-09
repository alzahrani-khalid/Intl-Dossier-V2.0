# pnpm Enforcement - Migration Guide

**Last Updated**: November 9, 2025  
**Status**: ✅ Complete

## Overview

This project now **strictly enforces** the use of pnpm as the package manager. Using npm or yarn will fail immediately.

## What Changed

### 1. Package Manager Enforcement

#### `.npmrc` (NEW)
```ini
# Force pnpm usage - prevent npm/yarn
engine-strict=true

# Hoist all dependencies to root node_modules for better performance
hoist=true

# Use shamefully-hoist for compatibility with legacy packages
shamefully-hoist=true

# Auto-install peers
auto-install-peers=true

# Faster installs
prefer-frozen-lockfile=false
```

#### `package.json`
- Added `engines` field to reject npm/yarn
- Added `preinstall` script to prevent non-pnpm usage
- Updated all scripts to use `pnpm` instead of `npm`

```json
{
  "packageManager": "pnpm@10.18.3",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=10.0.0",
    "npm": "please-use-pnpm",
    "yarn": "please-use-pnpm"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

### 2. Documentation Updates

All documentation files have been updated to use `pnpm` commands:

- ✅ `AGENTS.md` - AI assistant guidelines
- ✅ `CLAUDE.md` - Development guidelines  
- ✅ `README.md` - Project readme
- ✅ `constitution.md` - Project constitution

## Migration for Developers

### If You've Been Using npm

1. **Remove npm artifacts:**
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf backend/node_modules backend/package-lock.json
   rm -rf frontend/node_modules frontend/package-lock.json
   ```

2. **Install pnpm globally:**
   ```bash
   # Using standalone script (recommended)
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   
   # OR using npm one-time
   npm install -g pnpm@10
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Command Mapping

| Old (npm) | New (pnpm) |
|-----------|------------|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm dev` |
| `npm run build` | `pnpm build` |
| `npm test` | `pnpm test` |
| `npm run lint` | `pnpm lint` |
| `npx playwright test` | `pnpm exec playwright test` |
| `npx vitest` | `pnpm exec vitest` |
| `npm run db:migrate` | `pnpm run db:migrate` |

## Why pnpm?

### Performance Benefits
- **Faster installs**: 2-3x faster than npm
- **Disk efficiency**: Uses hard links and content-addressable storage
- **Strict dependencies**: Only declared dependencies are accessible

### Monorepo Advantages
- **Better workspace support**: Native monorepo features
- **Hoisting control**: Fine-grained control over dependency hoisting
- **Consistent resolution**: Same dependency versions across workspaces

### Developer Experience
- **Cleaner node_modules**: No phantom dependencies
- **Better error messages**: Clear and actionable error messages
- **Built-in features**: No need for additional tools

## Enforcement Mechanisms

### 1. Preinstall Hook
Runs `only-allow pnpm` before any install operation:

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

### 2. Engine Restrictions
Package.json engines field rejects npm/yarn:

```json
{
  "engines": {
    "npm": "please-use-pnpm",
    "yarn": "please-use-pnpm"
  }
}
```

### 3. .npmrc Configuration
Forces strict engine checking:

```ini
engine-strict=true
```

## Troubleshooting

### Error: "This project requires pnpm"
**Solution**: Install pnpm and remove npm artifacts
```bash
npm install -g pnpm@10
rm -rf node_modules package-lock.json
pnpm install
```

### Error: "ENOENT: no such file or directory, open 'pnpm-lock.yaml'"
**Solution**: Run fresh install
```bash
pnpm install
```

### Error: "Cannot find module" after switching from npm
**Solution**: Clean install
```bash
rm -rf node_modules */node_modules
pnpm install
```

### CI/CD Pipeline Issues
**Solution**: Update CI/CD to use pnpm
```yaml
# GitHub Actions example
- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10

- name: Install dependencies
  run: pnpm install
```

## Scripts Reference

All scripts now use pnpm. Here's the complete list:

### Development
```bash
pnpm dev              # Start dev servers
pnpm build            # Build for production
pnpm typecheck        # TypeScript validation
pnpm lint             # ESLint checking
```

### Testing
```bash
pnpm test                              # Run all tests
pnpm run test:unit                     # Unit tests only
pnpm run test:e2e                      # E2E tests only
pnpm exec playwright test              # Playwright tests
pnpm exec vitest                       # Vitest tests
```

### Database
```bash
pnpm run db:migrate     # Run migrations
pnpm run db:seed        # Seed database
pnpm run db:rollback    # Rollback migration
pnpm run db:reset       # Reset database
```

### Docker
```bash
pnpm run docker:up      # Start containers
pnpm run docker:down    # Stop containers
pnpm run docker:logs    # View logs
```

### Maintenance
```bash
pnpm run clean          # Clean all node_modules
pnpm run fresh          # Clean install and build
```

## Best Practices

### 1. Always Use pnpm Commands
```bash
# ✅ Good
pnpm add lodash
pnpm remove lodash
pnpm update lodash

# ❌ Bad
npm install lodash
yarn add lodash
```

### 2. Use pnpm exec for Binaries
```bash
# ✅ Good
pnpm exec playwright test
pnpm exec vitest

# ❌ Bad
npx playwright test
```

### 3. Add Dependencies Correctly
```bash
# Add to specific workspace
pnpm --filter frontend add react-query

# Add to root
pnpm add -w turbo
```

## Workspace Commands

### Working with Workspaces
```bash
# Install all workspaces
pnpm install

# Run script in specific workspace
pnpm --filter backend dev
pnpm --filter frontend dev

# Add dependency to workspace
pnpm --filter backend add express
pnpm --filter frontend add react

# Run script in all workspaces
pnpm -r build
pnpm -r test
```

## Resources

- [pnpm Documentation](https://pnpm.io)
- [pnpm vs npm](https://pnpm.io/pnpm-vs-npm)
- [Workspaces Guide](https://pnpm.io/workspaces)
- [CLI Commands](https://pnpm.io/cli/add)

## Support

If you encounter issues with pnpm:

1. Check this guide first
2. Review [pnpm troubleshooting](https://pnpm.io/troubleshooting)
3. Check the project's GitHub issues
4. Contact the development team

---

**Remember**: Using npm or yarn is no longer possible in this project. All developers must use pnpm.

