# Intl-DossierV2.0 Repository Guidelines

Last updated: 2025-10-08

## Core Tech Stack
- **Frontend**: React 19, TypeScript 5.0+ (strict mode), TanStack Router/Query v5, Tailwind CSS, shadcn/ui, i18next
- **Backend**: Node.js 18+ LTS, Express, Supabase (PostgreSQL 15+, Auth, RLS, Realtime, Storage), Redis 7.x
- **Database**: PostgreSQL 15+ with pgvector, pg_trgm, pg_tsvector extensions
- **Testing**: Vitest (unit/integration), Playwright (E2E), axe-playwright (a11y)
- **Build Tools**: Vite, Turborepo (monorepo), ESLint, Prettier
- **Additional**: @dnd-kit/core (drag-and-drop), Winston (logging)

## Project Structure
```
backend/          # Express + TypeScript API
  ├── src/
  │   ├── api/          # API routes
  │   ├── services/     # Business logic
  │   ├── middleware/   # Express middleware
  │   └── config/       # Configuration files
  └── migrations/       # SQL migrations

frontend/         # React 19 + Vite app
  ├── src/
  │   ├── components/   # React components
  │   ├── pages/        # Page components
  │   ├── hooks/        # Custom hooks
  │   └── store/        # State management

tests/            # Unit, integration tests
e2e/              # Playwright E2E specs
supabase/         # Migrations, seed data, Edge Functions
docs/             # General documentation
specs/            # Project specifications, contracts, data models
docker/           # Monitoring configurations
scripts/          # Helper scripts
```

## Commands

⚠️ **IMPORTANT**: This project uses **pnpm** exclusively. Using npm or yarn will fail.

### Development
- **Dev (monorepo)**: `pnpm dev` — runs frontend and backend via Turborepo
- **Build**: `pnpm build`
- **Typecheck**: `pnpm typecheck`
- **Lint**: `pnpm lint`

### Testing
- **All tests**: `pnpm test`
- **Unit/Integration**: `pnpm run test:unit`
- **E2E**: `pnpm run test:e2e`
- **Single E2E file**: `pnpm exec playwright test e2e/tests/auth.spec.ts`

### Database
- **Migrate**: `pnpm run db:migrate`
- **Seed**: `pnpm run db:seed`
- **Rollback**: `pnpm run db:rollback`
- **Reset**: `pnpm run db:reset`
- **Create migration**: `cd backend && pnpm run migrate:create`

### Docker
- **Start**: `pnpm run docker:up`
- **Stop**: `pnpm run docker:down`
- **Logs**: `pnpm run docker:logs`

## Coding Style & Naming Conventions

### TypeScript
- **Strict mode enabled**: Always use explicit types
- **Indentation**: 2 spaces (enforced by Prettier)
- **Type imports**: Use `import type` for type-only imports
- **Null safety**: Prefer optional chaining (`?.`) and nullish coalescing (`??`)

### File Naming
- **React components**: PascalCase (e.g., `MainLayout.tsx`, `UserProfile.tsx`)
- **Utilities/hooks**: kebab-case (e.g., `use-auth.ts`, `format-date.ts`)
- **Tests**: `*.test.ts` or `*.test.tsx`
- **SQL migrations**: `YYYYMMDDHHMMSS_description.sql`

### Code Quality
- **ESLint + Prettier**: Run before pushing (enforced in CI)
- **No console.log**: Use Winston logger in backend, remove debug logs before commit
- **Error handling**: Always handle errors explicitly, use try-catch blocks
- **Comments**: Write self-documenting code; add comments only for complex logic

## Testing Guidelines

### Test Frameworks
- **Vitest**: Unit and integration tests
- **Playwright**: End-to-end tests
- **axe-playwright**: Accessibility testing

### Best Practices
- **Location**: Place unit tests near code or under `tests/`
- **Size**: Keep tests small and focused (one concept per test)
- **Coverage**: CI expects green tests for core flows (login, dashboard, CRUD operations)
- **Fixtures**: Keep minimal; prefer factory functions
- **Naming**: Use descriptive test names (e.g., `it('should redirect to login when user is not authenticated')`)

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm exec vitest run src/services/auth.test.ts

# Run E2E test
pnpm exec playwright test e2e/tests/auth.spec.ts

# Run tests in watch mode
pnpm exec vitest watch
```

## Commit & Pull Request Guidelines

### Conventional Commits
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
- `feat(api): add MoU endpoints`
- `fix(ui): correct RTL spacing in navigation`
- `docs(readme): update installation instructions`
- `refactor(auth): simplify token validation logic`

### Pull Request Requirements
- **Size**: Keep PRs small (≤300 LOC preferred)
- **Description**: Clear description of changes and motivation
- **Linked issues**: Reference related issues (e.g., `Closes #123`)
- **Screenshots/GIFs**: Include for UI changes
- **Test notes**: Document which tests were run and results
- **Schema impacts**: Note any database schema changes
- **Breaking changes**: Clearly mark and document breaking changes

## Security & Configuration

### Environment Variables
- **Never commit secrets**: Use `.env` files (gitignored)
- **Setup**: Copy `.env.example` → `.env` and fill in values

### Required Backend Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
REDIS_URL=redis://localhost:6379
```

### Security Features
- **Helmet**: HTTP security headers enabled
- **CORS**: Configured for allowed origins
- **Rate limiting**: Enabled on all API routes
- **RLS**: Row Level Security enabled on all Supabase tables
- **JWT validation**: All protected routes validate tokens

### Health Checks
- **Backend**: `GET /health`
- **API**: `GET /api/health`

## Architecture Overview

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL) with migrations
- **Caching**: Redis for session and data caching
- **Logging**: Winston with structured logging
- **Authentication**: Supabase Auth with JWT
- **API Design**: RESTful with consistent error handling

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Routing**: TanStack Router v5
- **State Management**: TanStack Query v5 (server state) + React Context (UI state)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Internationalization**: i18next with RTL/LTR support
- **Forms**: React Hook Form with Zod validation

### Database Architecture
- **Migrations**: SQL-based migrations in `backend/migrations/`
- **Seed data**: `supabase/seed.sql`
- **Extensions**: pgvector (embeddings), pg_trgm (fuzzy search), pg_tsvector (full-text search)
- **RLS**: Row Level Security policies on all tables

## Best Practices

### Performance
- **Lazy loading**: Use React.lazy() for route-based code splitting
- **Memoization**: Use useMemo/useCallback appropriately (don't overuse)
- **Database queries**: Use indexes, avoid N+1 queries
- **Caching**: Cache frequently accessed data in Redis

### Accessibility
- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: Add where necessary
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Color contrast**: Follow WCAG AA standards
- **Testing**: Run axe-playwright tests

### Internationalization
- **RTL support**: Use logical properties (see CLAUDE.md for details)
- **Translation keys**: Use namespaced keys (e.g., `common.save`, `auth.login`)
- **Date/time formatting**: Use i18next with proper locale formatting
- **Number formatting**: Use Intl.NumberFormat for numbers and currency

## Common Patterns

### API Error Handling
```typescript
try {
  const result = await someAsyncOperation();
  return res.json({ success: true, data: result });
} catch (error) {
  logger.error('Operation failed', { error, context: 'someOperation' });
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
```

### React Component Pattern
```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Button onClick={onAction}>{t('common.save')}</Button>
    </div>
  );
}
```

### Database Query Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .single();

if (error) {
  logger.error('Database query failed', { error, table: 'table_name' });
  throw new Error('Failed to fetch data');
}

return data;
```
