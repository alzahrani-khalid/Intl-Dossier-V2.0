# Technology Stack: Quality Tooling

**Project:** Intl-Dossier v2.0 Production Quality Milestone
**Researched:** 2026-03-23

## Recommended Stack

### Linting

| Technology                   | Version               | Purpose                   | Why                                                                                                                                                             |
| ---------------------------- | --------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint                       | 9.x (already at root) | Unified linter            | Flat config is the default since v9; legacy `.eslintrc` is deprecated. Frontend/backend still on v8 -- must upgrade.                                            |
| typescript-eslint            | 8.x                   | TypeScript parser + rules | Native flat config support via `tseslint.config()`. Backend currently uses `FlatCompat` shim -- replace with native.                                            |
| eslint-plugin-react-hooks    | latest                | React hooks rules         | Already in use, keep.                                                                                                                                           |
| eslint-plugin-react-refresh  | latest                | HMR correctness           | Already in use, keep.                                                                                                                                           |
| eslint-plugin-unused-imports | latest                | Dead import removal       | Already in frontend, add to backend. Auto-fixable.                                                                                                              |
| eslint-plugin-security       | 3.x                   | Node.js security patterns | 14 rules detecting eval, child_process, fs path injection. Essential for Express backend.                                                                       |
| eslint-plugin-rtl-friendly   | latest                | RTL class enforcement     | Dedicated Tailwind RTL plugin -- reports and auto-fixes physical properties to logical counterparts. Better than current `no-restricted-syntax` regex approach. |
| @eslint/css                  | latest                | CSS file linting          | Official ESLint CSS support (released Feb 2025). Lint standalone CSS files for logical property enforcement.                                                    |

**Confidence:** HIGH -- ESLint 9 flat config is stable and well-documented. typescript-eslint 8.x is the current release line.

### Formatting

| Technology                  | Version                 | Purpose                   | Why                                                                                                                                          |
| --------------------------- | ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Prettier                    | 3.x (already installed) | Code formatting           | Already configured with `.prettierrc`. Keep current config.                                                                                  |
| eslint-config-prettier      | 10.x                    | Disable conflicting rules | Prevents ESLint formatting rules from conflicting with Prettier.                                                                             |
| prettier-plugin-tailwindcss | latest                  | Class sorting             | Official Tailwind plugin for Prettier -- sorts utility classes in canonical order. More reliable than eslint-plugin-tailwindcss for sorting. |

**Confidence:** HIGH -- Prettier 3 is stable. prettier-plugin-tailwindcss is the official recommendation from Tailwind Labs.

### Dead Code & Dependency Analysis

| Technology | Version | Purpose                     | Why                                                                                                                                                              |
| ---------- | ------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Knip       | 5.x     | Unused files, exports, deps | Finds unused files, exports, dependencies, and devDependencies. 80+ built-in plugins (Vite, Vitest, TanStack, i18next). The standard tool for this in 2025/2026. |

**Confidence:** HIGH -- Knip is the dominant tool for JS/TS dead code detection, actively maintained (last release Feb 2026).

### Bundle Analysis

| Technology                  | Version | Purpose                | Why                                                                                                                           |
| --------------------------- | ------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| rollup-plugin-visualizer    | 6.x     | Bundle treemap         | Generates interactive HTML treemap of bundle. Works natively with Vite (Rollup-based). Most popular Vite-compatible analyzer. |
| vite-plugin-bundle-analyzer | latest  | Alternative/complement | Native Vite plugin with treemap. Use if rollup-plugin-visualizer has compatibility issues with Vite 7.                        |

**Confidence:** MEDIUM -- rollup-plugin-visualizer requires Node >= 22 in latest versions; verify compatibility with project's Node 20. May need to pin to v5.x for Node 20 support.

### Performance Monitoring

| Technology    | Version                  | Purpose                    | Why                                                                                                                                   |
| ------------- | ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| web-vitals    | 4.x                      | Real User Monitoring (RUM) | Official Google library (~2KB). Measures LCP, CLS, INP. Send to Sentry for field data.                                                |
| @sentry/react | 10.x (already installed) | Error + perf monitoring    | Already in use. Enable Performance Monitoring and Web Vitals integration -- Sentry captures web-vitals automatically when configured. |
| Lighthouse CI | 0.14.x                   | CI performance budgets     | Runs Lighthouse in CI, blocks PRs that regress performance. Configure budgets for LCP < 2.5s, CLS < 0.1.                              |

**Confidence:** HIGH for web-vitals and Sentry. MEDIUM for Lighthouse CI (requires CI pipeline setup).

### Security Scanning

| Technology             | Version    | Purpose                       | Why                                                                                                                                                 |
| ---------------------- | ---------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm audit / pnpm audit | built-in   | Dependency vulnerability scan | Free, zero-config. Run in CI. Catches known CVEs.                                                                                                   |
| Socket.dev             | GitHub App | Supply chain attack detection | Detects behavioral threats (typosquatting, install scripts, telemetry). Complement to npm audit which only checks known CVEs. Free for open-source. |
| eslint-plugin-security | 3.x        | Static code security          | (Listed above in Linting section.)                                                                                                                  |

**Confidence:** HIGH for pnpm audit. MEDIUM for Socket.dev (requires GitHub App install, but free tier is generous).

### Testing Quality (RTL & Responsive)

| Technology           | Version                    | Purpose                   | Why                                                                                                                                     |
| -------------------- | -------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Playwright           | 1.55.x (already installed) | E2E with device emulation | Already in use. Configure viewport presets for mobile (375px), tablet (768px), desktop (1280px). Test both `dir="rtl"` and `dir="ltr"`. |
| @axe-core/playwright | 4.9.x (already installed)  | Accessibility in E2E      | Already in use. Add RTL-specific a11y checks.                                                                                           |
| Vitest               | 4.x (already installed)    | Unit/component tests      | Already in use. Add coverage thresholds to enforce minimum coverage.                                                                    |
| @vitest/coverage-v8  | 4.x                        | Coverage provider         | v8-based coverage for Vitest. Set thresholds: statements 70%, branches 60%.                                                             |

**Confidence:** HIGH -- all testing tools already installed. Configuration changes only.

### Pre-commit Hooks

| Technology  | Version | Purpose                     | Why                                                                                           |
| ----------- | ------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| husky       | 9.x     | Git hook management         | Standard for managing pre-commit hooks in JS projects.                                        |
| lint-staged | 15.x    | Run linters on staged files | Only lint changed files -- fast feedback. Run ESLint + Prettier on staged `.ts`/`.tsx` files. |

**Confidence:** HIGH -- husky + lint-staged is the standard pattern, widely adopted.

## Alternatives Considered

| Category        | Recommended                | Alternative                 | Why Not                                                                                                                             |
| --------------- | -------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Linting         | ESLint 9 flat config       | Biome                       | Biome is faster but ecosystem plugin support (tailwindcss, react-hooks, security) is not at parity. ESLint has the plugins we need. |
| Formatting      | Prettier 3                 | Biome formatter             | Same reason -- Biome lacks tailwindcss class sorting plugin.                                                                        |
| Dead code       | Knip                       | ts-prune                    | ts-prune is unmaintained; Knip is its spiritual successor with far broader scope.                                                   |
| Bundle analysis | rollup-plugin-visualizer   | source-map-explorer         | source-map-explorer requires source maps in production; visualizer works with build output directly.                                |
| Security        | pnpm audit + Socket.dev    | Snyk                        | Snyk free tier is limited (200 tests/month). pnpm audit + Socket covers the same ground for free.                                   |
| Performance     | web-vitals + Sentry        | Datadog RUM                 | Sentry already installed; adding web-vitals integration is zero-cost. Datadog requires new vendor relationship.                     |
| Pre-commit      | husky + lint-staged        | lefthook                    | husky is more widely adopted in JS ecosystem; lefthook is Go-based with less community support for JS tooling.                      |
| RTL linting     | eslint-plugin-rtl-friendly | Custom no-restricted-syntax | Current regex approach is fragile and doesn't auto-fix. Dedicated plugin understands Tailwind class structure.                      |

## What NOT to Use

| Tool                                    | Why Avoid                                                                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eslint-plugin-tailwindcss (for sorting) | Tailwind v4 support is beta/incomplete. Use prettier-plugin-tailwindcss instead for class sorting. Keep eslint-plugin-tailwindcss only for contradiction detection if stable. |
| Biome (as full replacement)             | Plugin ecosystem gaps. Worth revisiting in 6 months.                                                                                                                          |
| webpack-bundle-analyzer                 | Project uses Vite, not webpack.                                                                                                                                               |
| Snyk (paid)                             | Free tier too limited. pnpm audit + Socket.dev covers needs.                                                                                                                  |
| eslint-plugin-import                    | Slow with TypeScript. Use typescript-eslint's built-in module resolution instead.                                                                                             |
| @eslint/eslintrc FlatCompat             | Backend currently uses this shim. Replace with native flat config -- the shim adds complexity and will be removed.                                                            |

## Installation

```bash
# Linting (new additions)
pnpm add -D -w eslint@^9 eslint-config-prettier eslint-plugin-security eslint-plugin-rtl-friendly @eslint/css

# Formatting (new additions)
pnpm add -D -w prettier-plugin-tailwindcss

# Dead code analysis
pnpm add -D -w knip

# Bundle analysis
pnpm add -D -w rollup-plugin-visualizer

# Performance monitoring (frontend)
cd frontend && pnpm add web-vitals

# Pre-commit hooks
pnpm add -D -w husky lint-staged

# Coverage
pnpm add -D -w @vitest/coverage-v8
```

## Configuration Strategy

### ESLint Consolidation

**Current state:** 3 separate configs (root `.eslintrc.js`, frontend `eslint.config.js`, backend `eslint.config.js`) plus legacy `.eslintrc.json` files.

**Target state:** Single root `eslint.config.js` (flat config) that applies workspace-specific overrides via file patterns. Delete all `.eslintrc.*` files.

```
eslint.config.js (root)
  ├── Base: js.configs.recommended + tseslint.configs.recommended
  ├── Frontend: files: ["frontend/**/*.{ts,tsx}"] → react-hooks, react-refresh, rtl-friendly, tailwindcss
  ├── Backend: files: ["backend/**/*.ts"] → security, no-console
  └── Shared: unused-imports, prettier integration
```

### Prettier Plugin Order

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Tailwind plugin must be last in the plugins array.

### Knip Configuration

```json
{
  "workspaces": {
    "frontend": { "entry": ["src/main.tsx"], "project": ["src/**/*.{ts,tsx}"] },
    "backend": { "entry": ["src/index.ts"], "project": ["src/**/*.ts"] }
  }
}
```

## Version Alignment Required

| Package           | Current (frontend) | Current (backend) | Target     | Action                  |
| ----------------- | ------------------ | ----------------- | ---------- | ----------------------- |
| ESLint            | 8.57.0             | 8.57.0            | 9.x        | Upgrade both workspaces |
| typescript-eslint | mixed              | uses FlatCompat   | 8.x native | Rewrite backend config  |
| Prettier          | 3.3.0              | 3.3.0             | 3.6.x      | Already at root, align  |

## Sources

- [ESLint flat config with extends and defineConfig](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/) - HIGH confidence
- [typescript-eslint getting started](https://typescript-eslint.io/getting-started/) - HIGH confidence
- [Knip official site](https://knip.dev/) - HIGH confidence
- [rollup-plugin-visualizer GitHub](https://github.com/btd/rollup-plugin-visualizer) - HIGH confidence
- [web-vitals npm](https://www.npmjs.com/package/web-vitals) - HIGH confidence
- [eslint-plugin-security GitHub](https://github.com/eslint-community/eslint-plugin-security) - HIGH confidence
- [eslint-plugin-rtl-friendly npm](https://www.npmjs.com/package/eslint-plugin-rtl-friendly) - MEDIUM confidence (verify Tailwind v4 compat)
- [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) - HIGH confidence (official Tailwind Labs)
- [ESLint CSS support announcement](https://eslint.org/blog/2025/02/eslint-css-support/) - HIGH confidence
- [Socket.dev for supply chain security](https://socket.dev/) - MEDIUM confidence

---

_Stack research: 2026-03-23_
