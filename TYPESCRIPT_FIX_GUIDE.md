# TypeScript Error Fix Guide

## Current Status
- **Initial Errors**: 73
- **After Middleware Fixes**: ~40 errors
- **Categories**: Service methods, API endpoints, type mismatches

## Quick Fixes

### 1. Run the Fix Script
```bash
cd backend
chmod +x fix-typescript-errors.sh
./fix-typescript-errors.sh
```

### 2. Fix Service Method Errors

For each service with missing methods, add the stub implementations from `src/services/service-stubs.ts`:

#### CommitmentService.ts
```typescript
// Add these methods to the class:
async findAll(filters?: any) { /* implementation */ }
async create(commitment: any) { /* implementation */ }
async updateStatus(id: string, status: string) { /* implementation */ }
```

#### DocumentService.ts
```typescript
// Add these methods:
async findAll(filters?: any) { /* implementation */ }
async upload(file: any, metadata: any) { /* implementation */ }
async findById(id: string) { /* implementation */ }
async delete(id: string) { /* implementation */ }
```

#### OrganizationService.ts
```typescript
// Add these methods:
async findAll(filters?: any) { /* implementation */ }
async findById(id: string) { /* implementation */ }
async create(organization: any) { /* implementation */ }
async update(id: string, updates: any) { /* implementation */ }
async delete(id: string) { /* implementation */ }
```

### 3. Fix API Type Errors

#### events.ts (line 33)
Change:
```typescript
createEventSchema.parse(req.body);
```
To:
```typescript
const validatedData = createEventSchema.parse(req.body);
```

#### events.ts (line 373)
Add type annotation:
```typescript
attendees.map((attendee: any) => attendee.id)
```

#### relationships.ts (line 15)
Change:
```typescript
calculateHealth
```
To:
```typescript
calculateHealthScore
```

### 4. Fix Import Errors

#### For logger imports:
Replace:
```typescript
import { logger } from '../utils/logger';
```
With:
```typescript
import { logInfo, logError } from '../utils/logger';
```

### 5. Fix TypeScript Config

Update `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // Change from "node" to "bundler"
    "skipLibCheck": true, // Add this to skip type checking of dependencies
    // ... rest of config
  }
}
```

## Manual Fixes Required

### For each remaining error:

1. **Check the error message**: Look at the specific line and error type
2. **Identify the pattern**:
   - Missing method → Add stub implementation
   - Type mismatch → Add proper type annotation
   - Import error → Fix the import path/export
3. **Test the fix**: Run `npx tsc --noEmit` after each fix

## Verification Steps

1. **Check TypeScript compilation**:
```bash
cd backend
npx tsc --noEmit
```

2. **Run the dev server**:
```bash
npm run dev
```

3. **Run tests** (once compilation passes):
```bash
npm run test
```

## Common Patterns

### Missing Service Methods
If API calls a method that doesn't exist in service:
1. Check what the method should do
2. Add a stub implementation that queries the appropriate table
3. Add proper types to parameters and return values

### Type Mismatches
1. Add explicit type annotations
2. Use type assertions where appropriate
3. Fix function signatures to match expected types

### Import/Export Issues
1. Ensure all used functions are exported
2. Check import paths are correct
3. Add index.ts files to barrel export from directories

## Priority Order

1. **Fix compilation blockers first** (imports, exports)
2. **Add missing service methods** (use stubs from service-stubs.ts)
3. **Fix type annotations** in API endpoints
4. **Fix test mocks** (can be done last)

## Expected Outcome

After following this guide:
- ✅ Backend should compile without errors
- ✅ Dev server should start successfully
- ✅ API endpoints should be accessible
- ✅ Tests can be run (may still fail, but should compile)