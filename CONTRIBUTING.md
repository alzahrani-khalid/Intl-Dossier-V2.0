# Contributing to Intl-Dossier v2.0

Thank you for contributing to the International Dossier Management System! This guide will help you understand our development workflow, coding standards, and contribution process.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Code Style Guidelines](#code-style-guidelines)
- [Component Development](#component-development)
- [Mobile Development](#mobile-development)
- [Testing Requirements](#testing-requirements)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Code Review Guidelines](#code-review-guidelines)

## Getting Started

### Prerequisites

- **Node.js**: 20.19.0 LTS or higher
- **pnpm**: 10.0.0+ (REQUIRED - npm and yarn are not supported)
- **Git**: Latest version
- **Supabase CLI**: For database migrations
- **Docker**: For local development environment

### Initial Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/Intl-DossierV2.0.git
   cd Intl-DossierV2.0
   ```

2. **Install pnpm globally (if not installed):**
   ```bash
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   # OR using npm (one-time only)
   npm install -g pnpm@10
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Configure environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your Supabase credentials
   ```

5. **Set up the database:**
   ```bash
   pnpm run db:migrate
   pnpm run db:seed
   ```

6. **Start development servers:**
   ```bash
   pnpm dev
   ```

### Verify Setup

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Run tests: `pnpm test`

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow [Code Style Guidelines](#code-style-guidelines)
- Write tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# E2E tests (if applicable)
pnpm test:e2e
```

### 4. Commit Your Changes

Follow the [Commit Message Format](#commit-message-format):

```bash
git add .
git commit -m "feat: add new feature description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub following the [Pull Request Process](#pull-request-process).

## Branching Strategy

We use a simplified Git Flow strategy:

### Branch Types

| Branch          | Purpose                                | Naming Convention        |
| --------------- | -------------------------------------- | ------------------------ |
| `main`          | Production-ready code                  | `main`                   |
| `develop`       | Integration branch for features        | `develop`                |
| `feature/*`     | New features or enhancements           | `feature/feature-name`   |
| `bugfix/*`      | Bug fixes for develop branch           | `bugfix/issue-name`      |
| `hotfix/*`      | Urgent fixes for production            | `hotfix/issue-name`      |
| `release/*`     | Release preparation                    | `release/v1.0.0`         |
| `docs/*`        | Documentation-only changes             | `docs/topic-name`        |
| `refactor/*`    | Code refactoring (no functional change)| `refactor/component-name`|
| `test/*`        | Test additions or improvements         | `test/test-description`  |

### Branch Lifecycle

```
main ──────────────────────────────────────────>
       \                                    /
        \                                  / (hotfix)
         \                                /
          develop ────────────────────────>
                  \              /
                   \            / (feature/bugfix)
                    feature-branch
```

### Rules

- **NEVER** commit directly to `main` or `develop`
- Feature branches merge into `develop` via pull request
- `develop` merges into `main` for releases
- Hotfixes branch from `main` and merge back to both `main` and `develop`
- Delete branches after merging

## Code Style Guidelines

### TypeScript

- **Strict mode**: Always use TypeScript 5.8+ strict mode
- **Explicit types**: Define return types for all functions
- **No `any`**: Never use `any` type (enforced by ESLint)
- **Interfaces over types**: Prefer `interface` for object shapes

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // implementation
}

// ❌ Bad
function getUser(id: any) {  // No 'any', no return type
  // implementation
}
```

### React Components

- Use **functional components** with hooks
- Use **named exports** for components (not default)
- Prefer **composition** over inheritance
- Extract complex logic into custom hooks

```typescript
// ✅ Good
export function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) return <LoadingSpinner />;

  return <div>{user.name}</div>;
}

// ❌ Bad
export default ({ userId }) => {  // Default export, no types
  const user = useUser(userId).data;
  return <div>{user.name}</div>;  // No loading state
}
```

### Mobile-First & Responsive Design (MANDATORY)

**ALWAYS** start with mobile layout (320px+), then scale up:

```tsx
// ✅ Good - Mobile-first
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <h1 className="text-2xl sm:text-3xl md:text-4xl">Title</h1>
    <Button className="h-11 px-4 sm:h-10 sm:px-6 md:h-12 md:px-8">
      Action
    </Button>
  </div>
</div>

// ❌ Bad - Desktop-first
<div className="px-8 md:px-4">  // Wrong: starts large, gets smaller
  <h1 className="text-5xl md:text-2xl">Title</h1>
</div>
```

**Breakpoints:**
- Base: 0-640px (mobile)
- `sm`: 640px+ (large mobile)
- `md`: 768px+ (tablet)
- `lg`: 1024px+ (desktop)
- `xl`: 1280px+ (large desktop)
- `2xl`: 1536px+ (extra large)

**Touch Targets:**
- Minimum 44x44px (`min-h-11 min-w-11`)
- 8px minimum gap between interactive elements

### Arabic RTL Support (MANDATORY)

**NEVER** use physical direction properties (`left`, `right`, `ml-*`, `mr-*`, `pl-*`, `pr-*`)

**ALWAYS** use logical properties:

| ❌ Avoid        | ✅ Use Instead   |
| --------------- | ---------------- |
| `ml-*`          | `ms-*`           |
| `mr-*`          | `me-*`           |
| `pl-*`          | `ps-*`           |
| `pr-*`          | `pe-*`           |
| `left-*`        | `start-*`        |
| `right-*`       | `end-*`          |
| `text-left`     | `text-start`     |
| `text-right`    | `text-end`       |
| `rounded-l-*`   | `rounded-s-*`    |
| `rounded-r-*`   | `rounded-e-*`    |

```tsx
// ✅ Good - RTL-safe
import { useTranslation } from 'react-i18next';

export function ResponsiveRTLComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl sm:text-3xl text-start">{t('title')}</h1>
      <button className="ms-4 sm:ms-6 rounded-s-lg rounded-e-lg">
        {t('action')}
      </button>
      {/* Flip directional icons */}
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
    </div>
  );
}

// ❌ Bad - Not RTL-safe
<div className="px-4">
  <h1 className="text-left ml-4">Title</h1>  // Hard-coded direction
  <button className="rounded-l-lg">Action</button>
</div>
```

### File Organization

```
component-name/
├── ComponentName.tsx          # Component implementation
├── ComponentName.test.tsx     # Unit tests
├── ComponentName.stories.tsx  # Storybook stories (optional)
├── useComponentHook.ts        # Custom hooks
├── types.ts                   # Type definitions
└── index.ts                   # Public exports
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `DossierCard`)
- **Hooks**: camelCase with `use` prefix (`useUser`, `useDossier`)
- **Utilities**: camelCase (`formatDate`, `getDossierRoute`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`User`, `DossierType`)

### Formatting

We use Prettier for code formatting. Configuration in `.prettierrc`:

- **Semicolons**: Yes
- **Single quotes**: Yes
- **Print width**: 100 characters
- **Tab width**: 2 spaces
- **Trailing commas**: ES5

Run `pnpm lint` to auto-format code.

## Component Development

### Aceternity UI Component Hierarchy (MANDATORY)

**ALWAYS** follow this order when selecting UI components:

1. **Aceternity UI (Primary)**: https://ui.aceternity.com/components
   - 130+ components in 18 categories
   - Mobile-first and responsive by default
   - **Install**: `npx shadcn@latest add https://ui.aceternity.com/registry/[component].json --yes`

2. **Aceternity UI Pro (Primary+)**: https://pro.aceternity.com/components
   - 30+ premium component blocks
   - Requires `ACETERNITY_PRO_API_KEY` in `.env.local`

3. **Kibo-UI (Secondary Fallback)**: https://www.kibo-ui.com
   - Use ONLY if Aceternity doesn't have equivalent
   - **Install**: `npx shadcn@latest add @kibo-ui/[component]`

4. **shadcn/ui (Last Resort)**: https://ui.shadcn.com
   - Use ONLY if Aceternity AND Kibo-UI don't have equivalent
   - **Install**: `npx shadcn@latest add [component]`

### Before Creating ANY Component

**MANDATORY CHECKLIST:**

- [ ] Searched Aceternity UI for component
- [ ] Checked Aceternity Pro for premium variants
- [ ] If not found, checked Kibo-UI registry
- [ ] Verified component supports mobile-first
- [ ] Verified RTL compatibility (add logical properties if needed)

### Installation Examples

```bash
# Aceternity UI (Free)
npx shadcn@latest add https://ui.aceternity.com/registry/floating-navbar.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json --yes

# Kibo-UI (Fallback)
npx shadcn@latest add @kibo-ui/kanban

# shadcn/ui (Last Resort)
npx shadcn@latest add form
```

### Component File Locations

- **Aceternity UI components**: `frontend/src/components/ui/`
- **Custom components**: `frontend/src/components/`
- **Page components**: `frontend/src/pages/`
- **Configuration**: `frontend/components.json`

## Mobile Development

### Framework

- **React Native**: 0.81+
- **Expo SDK**: 52+
- **UI Library**: React Native Paper 5.12+ (Material Design 3)
- **Offline Storage**: WatermelonDB 0.28+
- **Navigation**: React Navigation 7+

### Mobile-Specific Guidelines

1. **Offline-First Architecture**
   - All data mutations queue locally first
   - Background sync when connection available
   - Conflict resolution via last-write-wins with server timestamp

2. **Performance**
   - Lazy load screens and heavy components
   - Optimize images with `expo-image`
   - Use `React.memo` for expensive renders
   - Profile with React DevTools Profiler

3. **Testing**
   - Unit tests: Jest + React Native Testing Library
   - E2E tests: Maestro (preferred) or Detox
   - Run: `cd mobile && pnpm test`

4. **Mobile Commands**
   ```bash
   pnpm mobile:start     # Start Expo dev server
   pnpm mobile:ios       # Run on iOS simulator
   pnpm mobile:android   # Run on Android emulator
   ```

See [mobile/README.md](./mobile/README.md) for comprehensive mobile development guide.

## Testing Requirements

### Test Coverage Standards

- **Minimum coverage**: 80% for all packages
- **Critical paths**: 100% coverage required
- **New features**: Must include tests before merge

### Test Types

#### 1. Unit Tests

- **Framework**: Vitest
- **Location**: `*.test.ts` or `*.test.tsx` next to source files
- **Run**: `pnpm test`

```typescript
// Example: UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('should render user name', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

#### 2. Integration Tests

- **Framework**: Vitest + MSW (Mock Service Worker)
- **Location**: `tests/integration/`
- **Run**: `pnpm test:integration`

```typescript
// Example: dossier-api.integration.test.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/dossiers/:id', (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, name: 'Test Dossier' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### 3. End-to-End Tests

- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **Run**: `pnpm test:e2e`

```typescript
// Example: dossier-creation.e2e.test.ts
import { test, expect } from '@playwright/test';

test('should create new country dossier', async ({ page }) => {
  await page.goto('http://localhost:5173/dossiers/new');

  await page.getByLabel('Dossier Type').selectOption('country');
  await page.getByLabel('Country Name').fill('Test Country');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Dossier created successfully')).toBeVisible();
});
```

#### 4. Accessibility Tests

- **Framework**: axe-playwright
- **Run**: Included in E2E tests

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test UserProfile.test.tsx

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e --ui

# Run tests in watch mode
pnpm test --watch
```

### Test Requirements Before Merge

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage meets minimum 80% threshold
- [ ] E2E tests pass for affected user flows
- [ ] Accessibility tests pass (WCAG AA)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type         | Description                                           |
| ------------ | ----------------------------------------------------- |
| `feat`       | New feature                                           |
| `fix`        | Bug fix                                               |
| `docs`       | Documentation changes                                 |
| `style`      | Code style changes (formatting, semicolons, etc.)     |
| `refactor`   | Code refactoring (no functional changes)              |
| `perf`       | Performance improvements                              |
| `test`       | Adding or updating tests                              |
| `chore`      | Maintenance tasks (dependencies, config, etc.)        |
| `ci`         | CI/CD changes                                         |
| `build`      | Build system changes                                  |
| `revert`     | Revert previous commit                                |

### Scopes (Optional)

- `frontend` - Web frontend changes
- `backend` - Backend API changes
- `mobile` - Mobile app changes
- `database` - Database migrations or schema changes
- `docs` - Documentation
- `deps` - Dependency updates

### Examples

```bash
# Feature
feat(frontend): add dossier relationship visualization

# Bug fix
fix(backend): resolve duplicate entries in search results

# Documentation
docs: update installation instructions in README

# Refactoring
refactor(frontend): extract dossier card into reusable component

# Performance
perf(database): add index on dossiers.created_at column

# Breaking change
feat(api)!: change dossier API response format

BREAKING CHANGE: The API now returns dossiers in a nested structure.
Clients must update to access data via response.data.dossiers
```

### Rules

1. **Subject line**:
   - Use imperative mood ("add" not "added")
   - Don't capitalize first letter
   - No period at the end
   - Maximum 72 characters

2. **Body** (optional):
   - Explain WHAT and WHY, not HOW
   - Wrap at 72 characters
   - Separate from subject with blank line

3. **Footer** (optional):
   - Reference issues: `Closes #123, #456`
   - Breaking changes: `BREAKING CHANGE: description`

### Commit Hooks

We use Husky and lint-staged for pre-commit hooks:

- **Pre-commit**: Runs Prettier on staged files
- **Commit-msg**: Validates commit message format

## Pull Request Process

### 1. Before Creating PR

- [ ] Branch is up-to-date with `develop`
- [ ] All tests pass locally (`pnpm test`)
- [ ] Code follows style guidelines (`pnpm lint`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Documentation updated (if applicable)
- [ ] Changelog entry added (for features/fixes)

### 2. PR Title Format

Use the same format as commit messages:

```
feat(frontend): add dossier relationship graph
fix(backend): resolve duplicate search results
```

### 3. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement

## Related Issues
Closes #123

## Changes Made
- Added dossier relationship graph component
- Created relationship navigation API
- Updated tests for new functionality

## Screenshots (if applicable)
[Add screenshots here]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Changes are mobile-responsive
- [ ] RTL support verified (for UI changes)
```

### 4. Review Process

1. **Self-review**: Review your own PR first
2. **Request reviewers**: Assign at least one reviewer
3. **Address feedback**: Respond to all comments
4. **Update PR**: Push changes to same branch
5. **Re-request review**: After addressing feedback
6. **Approval**: Requires at least one approval
7. **Merge**: Squash and merge to keep history clean

### 5. PR Size Guidelines

- **Small**: < 200 lines changed (preferred)
- **Medium**: 200-500 lines changed
- **Large**: > 500 lines changed (should be split)

**Tip**: Break large features into smaller, reviewable PRs.

### 6. CI/CD Checks

All PRs must pass:

- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ Prettier formatting
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests (for UI changes)
- ✅ Build process

## Documentation

### Code Documentation

1. **JSDoc for public APIs**:
   ```typescript
   /**
    * Fetches a dossier by ID
    * @param id - The dossier UUID
    * @returns Promise resolving to dossier data
    * @throws {NotFoundError} If dossier doesn't exist
    */
   export async function getDossier(id: string): Promise<Dossier> {
     // implementation
   }
   ```

2. **Inline comments for complex logic**:
   ```typescript
   // Calculate weighted score based on recency and importance
   // Formula: (importance * 0.7) + (recency_score * 0.3)
   const score = calculateWeightedScore(item);
   ```

3. **README files for major features**:
   - `frontend/src/features/dossiers/README.md`
   - Explain architecture, data flow, key components

### Documentation Updates Required

- [ ] `README.md` - For setup/usage changes
- [ ] `CLAUDE.md` - For development pattern changes
- [ ] Component README - For new features/modules
- [ ] API documentation - For endpoint changes
- [ ] Migration guide - For breaking changes

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep table of contents updated
- Use Markdown formatting consistently

## Code Review Guidelines

### For Authors

1. **Keep PRs focused**: One feature/fix per PR
2. **Provide context**: Explain WHY, not just WHAT
3. **Test thoroughly**: Ensure all tests pass
4. **Self-review first**: Check your own code before requesting review
5. **Respond promptly**: Address feedback within 24 hours

### For Reviewers

1. **Be constructive**: Focus on improvement, not criticism
2. **Ask questions**: Understand the reasoning
3. **Test locally**: Pull the branch and test changes
4. **Check tests**: Verify test coverage and quality
5. **Approve explicitly**: Use GitHub's approval feature

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Logic is clear and well-documented
- [ ] Error handling is appropriate
- [ ] Tests cover new/changed code
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Mobile-responsive (for UI changes)
- [ ] RTL support (for UI changes)
- [ ] Accessibility standards met

### Review Comments

Use conventional comment prefixes:

- `nit:` - Minor suggestion, not blocking
- `question:` - Asking for clarification
- `suggestion:` - Alternative approach
- `issue:` - Problem that must be fixed
- `praise:` - Positive feedback

**Example:**
```
nit: Consider extracting this into a utility function for reusability

question: Why are we using setTimeout here instead of a Promise?

issue: This will cause a memory leak if the component unmounts before the fetch completes
```

## Additional Resources

- [Dossier-Centric Architecture](./docs/DOSSIER_CENTRIC_ARCHITECTURE.md)
- [Mobile Development Guide](./mobile/README.md)
- [API Documentation](http://localhost:3000/api-docs)
- [Aceternity UI Components](https://ui.aceternity.com/components)
- [TanStack Router Docs](https://tanstack.com/router)
- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)

## Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Create an issue with reproduction steps
- **Features**: Propose in discussions before implementing
- **Security**: Email security@gastat.gov.sa (do not open public issues)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Intl-Dossier v2.0!** 🎉
