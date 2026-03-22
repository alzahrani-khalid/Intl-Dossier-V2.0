# Coding Conventions

**Analysis Date:** 2026-03-23

## Naming Patterns

**Files:**

- **React Components**: PascalCase with `.tsx` extension (e.g., `ConsistencyPanel.tsx`, `UniversalDossierCard.tsx`)
- **Hooks**: Prefix with `use`, camelCase (e.g., `useAuth.ts`, `useDossiers.ts`, `use-compliance.ts`)
  - Modern hooks use camelCase with hyphens (e.g., `use-entity-search.ts`, `use-theme.ts`, `use-offline-state.ts`)
- **Utilities**: camelCase with `.ts` extension (e.g., `api-helpers.ts`)
- **Middleware**: hyphenated or camelCase with `.ts` extension (e.g., `rate-limit.middleware.ts`, `errorHandler.ts`)
- **Types/Interfaces**: Suffix with `.types.ts` (e.g., `work-item.types.ts`, `common.types.ts`, `ai-extraction.types.ts`)
- **Test files**: `*.test.ts` or `*.test.tsx` (e.g., `Country.test.ts`, `ConsistencyPanel.test.tsx`)

**Functions:**

- camelCase for all function names
- Explicitly typed return types (required by ESLint rule `@typescript-eslint/explicit-function-return-type`)
- Example: `const calculateRelationshipHealthScore = (): number => { ... }`

**Variables & Constants:**

- camelCase for variables: `const testCountry = { ... }`
- camelCase for functions: `const getClientMessage = (): string => { ... }`
- CONSTANT_CASE only when necessary (rare in modern codebase)

**Types:**

- PascalCase for interfaces and type aliases (e.g., `ConsistencyCheck`, `Country`, `WorkItem`)
- Enum values: CONSTANT_CASE (e.g., `conflict_type: 'contradiction' as const`)

## Code Style

**Formatting (Prettier):**

- **Semicolons**: Off (configured as `"semi": false`)
- **Trailing Commas**: All (ES5 compatible, `"trailingComma": "all"`)
- **Quotes**: Single quotes for strings (`"singleQuote": true`)
- **JSX Quotes**: Double quotes for JSX attributes (`"jsxSingleQuote": false`)
- **Print Width**: 100 characters per line
- **Tab Width**: 2 spaces (not tabs)
- **Line Endings**: LF only (`"endOfLine": "lf"`)
- **Arrow Parentheses**: Always include (e.g., `(x) => x + 1`)

**Linting (ESLint):**

- **Explicit Return Types**: Required on all functions (`@typescript-eslint/explicit-function-return-type`)
  - Exception: Expressions and typed function expressions allowed
- **No Explicit `any`**: Error-level (`@typescript-eslint/no-explicit-any: error`)
- **No Unused Variables**: Error-level (`@typescript-eslint/no-unused-vars: error`)
- **No Floating Promises**: Error-level (`@typescript-eslint/no-floating-promises: error`)
- **Console Usage**: Warn, but allow `console.warn()` and `console.error()`
- **React**: React 19+ (no need for `React` import in JSX files)

**Backend-Specific Linting:**

- **Strict Boolean Expressions**: Enforced (`@typescript-eslint/strict-boolean-expressions: error`)

## RTL Enforcement (Frontend)

**Hard Restrictions via ESLint:**
The frontend ESLint config blocks RTL-incompatible Tailwind classes via `no-restricted-syntax`:

- ❌ No `ml-*` → Use `ms-*` (margin-start)
- ❌ No `mr-*` → Use `me-*` (margin-end)
- ❌ No `pl-*` → Use `ps-*` (padding-start)
- ❌ No `pr-*` → Use `pe-*` (padding-end)
- ❌ No `text-left` → Use `text-start`
- ❌ No `text-right` → Use `text-end`
- ❌ No `left-*` → Use `start-*`
- ❌ No `right-*` → Use `end-*`
- ❌ No `rounded-l-*` → Use `rounded-s-*`
- ❌ No `rounded-r-*` → Use `rounded-e-*`

**Implementation Pattern:**

```tsx
import { useTranslation } from 'react-i18next';

export function ComponentName() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex gap-4 ps-4 pe-6">
      {/* Use logical properties in all layouts */}
    </div>
  );
}
```

## Import Organization

**Order (strictly enforced):**

1. **React/Framework imports**

   ```typescript
   import React from 'react';
   import { useTranslation } from 'react-i18next';
   ```

2. **Type imports** (ES modules)

   ```typescript
   import type { ConsistencyCheck } from '@/types/consistency.types';
   ```

3. **Internal project imports** (use `@` alias)

   ```typescript
   import { supabaseAdmin } from '@/config/supabase';
   import { useAuth } from '@/contexts/auth.context';
   ```

4. **Relative imports** (same-directory utilities)

   ```typescript
   import { helper } from './helper';
   ```

5. **Side effect imports** (rarely used)
   ```typescript
   import './styles.css';
   ```

**Path Aliases (configured in both frontend and backend):**

- `@`: Root of `src/` directory (e.g., `@/components`, `@/hooks`, `@/types`)
- `@tests`: Test utilities directory (for test files)

## Error Handling

**Backend Patterns (`src/middleware/errorHandler.ts`):**

1. **Custom Error Class**:

   ```typescript
   export class BadRequestError extends Error {
     statusCode = 400;
     isOperational = true;
     constructor(
       message: string,
       public code?: string
     ) {
       super(message);
       Object.setPrototypeOf(this, BadRequestError.prototype);
     }
   }
   ```

2. **Error Handler Middleware**:
   - Logs all errors with context (URL, method, IP, user ID)
   - Logs security events (401, 403 status codes) separately
   - Sanitizes error messages in production
   - Returns JSON with structure: `{ success: false, error: { code, message, stack?, details? }, timestamp }`
   - Includes stack traces and details only in development

3. **Error Codes**:
   - Format: `CONSTANT_CASE` (e.g., `'INTERNAL_ERROR'`, `'UNAUTHORIZED'`)
   - Used in error response for client-side error handling

**Frontend Patterns:**

- Use `try/catch` with specific error types
- Return discriminated union types: `{ success: boolean, data?: T, error?: Error }`
- Async operations should not use floating promises

## Logging

**Framework:**

- **Backend**: Winston logger (configured in `src/utils/logger.ts`)
- **Frontend**: `console.warn()` and `console.error()` (production-safe)

**Backend Patterns:**

```typescript
import { logError, logSecurityEvent } from '../utils/logger';

// Error logging
logError(`Error ${statusCode}: ${message}`, err, {
  url: req.url,
  method: req.method,
  ip: req.ip,
  user: req.user?.id,
});

// Security event logging
logSecurityEvent('Unauthorized access attempt', 'medium', {
  url: req.url,
  ip: req.ip,
});
```

**Frontend Patterns:**

```typescript
// Log only warnings and errors
console.warn('Deprecated feature used');
console.error('Failed to load data', error);

// Never log sensitive data
// ❌ console.log(apiKey)
// ✅ console.log('API call made')
```

## Comments

**When to Comment:**

- Complex business logic that isn't obvious from code alone
- Workarounds for browser quirks or library limitations
- Integration points with external systems
- Security-relevant code sections

**JSDoc Usage:**

- Document public exported functions and types
- Include `@param` and `@returns` for clarity
- Document exceptions/errors that can be thrown

**Example:**

```typescript
/**
 * Calculates relationship health score based on engagement metrics.
 * @param metrics Engagement metrics object
 * @returns Health score between 0 and 100
 * @throws Error if metrics are invalid
 */
export function calculateRelationshipHealthScore(metrics: EngagementMetrics): number {
  // Implementation
}
```

## Function Design

**Size Guidelines:**

- Keep functions under 50 lines (prefer 10-30 lines)
- If a function exceeds 50 lines, extract smaller helpers
- Use clear, descriptive names instead of long functions

**Parameters:**

- Prefer objects over multiple positional parameters
- Destructure in function signature when helpful
- Max 4 positional parameters; use object for more

**Return Values:**

- Always explicitly type return values
- Return early to reduce nesting
- Use discriminated unions for error/success scenarios

**Example:**

```typescript
interface CreateCountryInput {
  code: string;
  nameEn: string;
  nameAr: string;
  region: string;
}

export async function createCountry(input: CreateCountryInput): Promise<Country> {
  // Validation
  if (!input.code) {
    throw new BadRequestError('Country code is required');
  }

  // Implementation
  const { data, error } = await supabase.from('countries').insert(input).select();

  if (error) throw new DatabaseError(error.message);
  return data[0];
}
```

## Module Design

**Exports:**

- Use named exports for functions and classes
- Default exports only for components (React components)
- Group related exports together

**Barrel Files (Index Pattern):**

- `src/types/index.ts` exports all type definitions
- `src/utils/index.ts` exports all utility functions
- Avoid circular dependencies

**Example:**

```typescript
// src/utils/index.ts
export { calculateHealthScore } from './health-score';
export { formatDate } from './date-formatting';
export type { Metric } from './types';
```

## TypeScript

**Type Safety:**

- Strict mode enabled (`"strict": true`)
- Use `as const` for literal types in enums
- Avoid `any` type (ESLint enforced)

**Example (from tests):**

```typescript
const mockConsistencyCheck = {
  check_trigger: 'automatic_on_submit' as const,
  conflict_type: 'contradiction' as const,
  severity: 'high' as const,
};
```

---

_Conventions analysis: 2026-03-23_
