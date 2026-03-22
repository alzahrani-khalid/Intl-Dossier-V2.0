# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:**

- **Frontend**: Vitest with jsdom environment
- **Backend**: Vitest with node environment
- Config: `frontend/vitest.config.ts`, `backend/vitest.config.ts`

**Assertion Library:**

- **Frontend**: `@testing-library/react` + `vitest` expect
- **Backend**: `vitest` expect + `@vitest/coverage-v8`

**Run Commands:**

Frontend:

```bash
pnpm test                    # Run all frontend tests
pnpm test --watch          # Watch mode
pnpm test:coverage         # Generate coverage report
```

Backend:

```bash
cd backend
pnpm test                   # Run all backend tests
pnpm test:coverage         # Generate coverage report
pnpm test --watch          # Watch mode
```

## Test File Organization

**Location:**

- **Frontend**: `src/components/__tests__/` (co-located with components)
- **Backend**: `src/**/__tests__/` (co-located with modules)
- **Types match source**: `src/models/__tests__/Country.test.ts` mirrors `src/models/Country.ts`

**Naming:**

- Files: `ComponentName.test.tsx` or `module-name.test.ts`
- Test suites: `describe('ComponentName', () => { ... })`
- Individual tests: `it('should do something', () => { ... })`

**Vitest Configuration (Frontend):**

```typescript
// frontend/vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
});
```

**Vitest Configuration (Backend):**

```typescript
// backend/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    setupFiles: [path.resolve(__dirname, './tests/setup.ts')],
    coverage: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    testTimeout: 30000,
  },
});
```

## Test Structure

**Suite Organization (Frontend Example):**

File: `frontend/src/components/__tests__/ConsistencyPanel.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConsistencyPanel } from '../ConsistencyPanel'
import '../../../i18n'  // Import i18n translations

// 1. Mock data setup
const mockConsistencyCheck = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  consistency_score: 75,
  conflicts: [
    {
      conflict_type: 'contradiction' as const,
      severity: 'high' as const,
      description: 'Position contradicts existing stance',
    }
  ]
}

// 2. Test suite
describe('ConsistencyPanel', () => {

  // 3. Test cases
  it('renders empty state when no consistency check', () => {
    render(<ConsistencyPanel consistencyCheck={null} />)
    expect(screen.getByText(/No Consistency Check/i)).toBeInTheDocument()
  })

  it('displays consistency score correctly', () => {
    render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />)
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  // 4. Interaction testing
  it('calls onResolveConflict when action buttons clicked', () => {
    const onResolveConflict = vi.fn()
    render(
      <ConsistencyPanel
        consistencyCheck={mockConsistencyCheck}
        onResolveConflict={onResolveConflict}
      />
    )

    const button = screen.getByText(/Modify Position/i)
    fireEvent.click(button)

    expect(onResolveConflict).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174002',
      'modify'
    )
  })
})
```

**Suite Organization (Backend Example):**

File: `backend/src/models/__tests__/Country.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Country } from '../Country';
import { supabaseAdmin as supabase } from '../../config/supabase';

describe('Country Model', () => {
  // 1. Setup/teardown
  let testCountry: any;

  beforeEach(async () => {
    testCountry = {
      code: 'TS',
      name_en: 'Test Country',
      region: 'Test Region',
    };
  });

  afterEach(async () => {
    if (testCountry?.id) {
      await supabase.from('countries').delete().eq('id', testCountry.id);
    }
  });

  // 2. Grouped test cases
  describe('CRUD Operations', () => {
    it('should create a new country', async () => {
      const { data, error } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.code).toBe('TS');
    });
  });

  describe('Validation', () => {
    it('should require country code', async () => {
      const invalidCountry = { ...testCountry };
      delete invalidCountry.code;

      const { error } = await supabase.from('countries').insert(invalidCountry);

      expect(error).toBeDefined();
    });
  });
});
```

## Mocking

**Framework:** Vitest `vi` module

**Mock Setup (Global - Frontend):**

File: `frontend/tests/setup.ts`

```typescript
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Global i18n mock
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'afterActions.decisions.title': 'Decisions',
        'afterActions.commitments.title': 'Commitments',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: any) => children,
}));

// MSW server for network mocks
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
```

**Mock Setup (Supabase - Backend):**

File: `backend/src/ai/__tests__/security-enforcement.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase at module level
vi.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

describe('Security Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes secret data to private provider only', async () => {
    const { supabaseAdmin } = await import('../../config/supabase');
    (supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          default_provider: 'openai',
          private_provider: 'vllm',
        },
      ],
      error: null,
    });

    const provider = await router.selectProvider(
      { dataClassification: 'secret' as const },
      'Test input'
    );

    expect(provider.provider).toBe('vllm');
  });
});
```

**What to Mock:**

- External API calls (Supabase, third-party services)
- Date/time functions (when time-dependent)
- Window/browser APIs
- Large/expensive operations (not needed in unit tests)

**What NOT to Mock:**

- Core business logic functions
- React hooks (unless testing their internals)
- Utility functions (test them directly)
- Database operations in integration tests

## Fixtures and Factories

**Test Data Pattern (Inline):**

```typescript
const mockConsistencyCheck = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  position_id: '123e4567-e89b-12d3-a456-426614174001',
  consistency_score: 75,
  conflicts: [
    {
      conflict_type: 'contradiction' as const,
      severity: 'high' as const,
      description: 'Position contradicts existing stance',
    },
  ],
};
```

**Backend Fixture Pattern:**

File: `backend/src/models/__tests__/Country.test.ts`

```typescript
let testCountry: any;

beforeEach(async () => {
  testCountry = {
    code: 'TS',
    code3: 'TST',
    name_en: 'Test Country',
    name_ar: 'دولة اختبار',
    region: 'Test Region',
    relationship_status: 'active',
    is_gcc: false,
  };
});

afterEach(async () => {
  // Always clean up test data
  if (testCountry?.id) {
    await supabase.from('countries').delete().eq('id', testCountry.id);
  }
});
```

**Location:**

- Fixtures live inline in test files (co-located with tests that use them)
- Large fixture sets can be extracted to `fixtures/` directory if shared across many tests

## Coverage

**Requirements:**

- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 75% minimum
- **Statements**: 80% minimum

**View Coverage:**

```bash
# Frontend
cd frontend
pnpm test:coverage
# Opens: frontend/coverage/index.html

# Backend
cd backend
pnpm test:coverage
# Opens: backend/coverage/index.html
```

**Excluded from Coverage:**

- `node_modules/`
- `tests/` directory itself
- `**/*.d.ts` (type definitions)
- `**/*.config.*` (configuration files)
- `dist/` (built output)

## Test Types

**Unit Tests:**

- **Scope**: Single function or component
- **Approach**: Test inputs and outputs, mock external dependencies
- **Location**: Same directory as source code
- **Example**: Testing `ConsistencyPanel` component renders with props

**Integration Tests:**

- **Scope**: Multiple components/modules working together
- **Approach**: Test with real Supabase client, actual database queries
- **Location**: `tests/integration/` or marked with `.integration.test.ts`
- **Timeout**: 30 seconds (configured in vitest)
- **Example**: `brief-generation.integration.test.ts` tests database + LLM

**E2E Tests:**

- **Status**: Not in current test suite
- **When Needed**: Browser automation tests (future feature)

## Common Patterns

**Async Testing (Frontend):**

```typescript
it('fetches and displays data', async () => {
  render(<DataComponent />)

  // Wait for async operations
  const element = await screen.findByText(/expected text/i)
  expect(element).toBeInTheDocument()
})
```

**Async Testing (Backend):**

```typescript
it('should create a country', async () => {
  const { data, error } = await supabase.from('countries').insert(testCountry).select().single();

  expect(error).toBeNull();
  expect(data.code).toBe('TS');
});
```

**Error Testing:**

```typescript
it('should throw error for invalid input', async () => {
  const invalidCountry = { ...testCountry };
  delete invalidCountry.code;

  const { error } = await supabase.from('countries').insert(invalidCountry);

  expect(error).toBeDefined();
});
```

**State Changes (Frontend):**

```typescript
it('toggles conflict expansion state correctly', () => {
  render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />)

  const conflictButton = screen.getByText(/Position contradicts/i)

  // Expand
  fireEvent.click(conflictButton)
  expect(screen.getByText(/Revise section/i)).toBeInTheDocument()

  // Collapse
  fireEvent.click(conflictButton)
  expect(screen.queryByText(/Revise section/i)).not.toBeInTheDocument()
})
```

**Spy/Mock Verification:**

```typescript
it('calls callback with correct arguments', () => {
  const onResolveConflict = vi.fn()
  render(<ConsistencyPanel onResolveConflict={onResolveConflict} {...props} />)

  fireEvent.click(screen.getByText(/Modify/i))

  expect(onResolveConflict).toHaveBeenCalledWith(
    '123e4567-e89b-12d3-a456-426614174002',
    'modify'
  )
})
```

## Test Isolation

**Setup Files:**

- `frontend/tests/setup.ts`: Global mocks, i18n, MSW server
- `backend/tests/setup.ts`: Environment variables, verification

**Isolation Strategy:**

- Each test is independent; fixtures are reset via `beforeEach/afterEach`
- Backend tests use database cleanup after each test
- Frontend tests use `cleanup()` after each test

**Environment:**

- Backend: Node.js environment, isolated via vitest pools
- Frontend: jsdom (simulated DOM), no real browser APIs

---

_Testing analysis: 2026-03-23_
