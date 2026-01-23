# `any` Type Usage Audit Report

**Date:** 2026-01-23
**Scope:** Frontend TypeScript/React codebase
**Total Files with `any`:** 111 files
**Total `any` Occurrences:** ~210 instances

---

## Executive Summary

This audit identifies and categorizes all `any` type usage across the frontend codebase. Despite having comprehensive type-safe alternatives in `types/common.types.ts` (JsonValue, JsonObject, Metadata, DynamicFields, ApiErrorDetails, etc.), these are not being consistently applied. This report provides a complete categorization to guide systematic refactoring.

---

## Pattern Categories

### 1. Array Callback Parameters (Highest Frequency)
**Count:** ~60+ occurrences
**Files Affected:** Hooks, Services, Components

**Pattern:**
```typescript
// ❌ Current
items.filter((f: any) => f.status === 'active')
data.map((item: any) => item.id)
records.forEach((rel: any) => { ... })

// ✅ Replacement
items.filter((f: Finding) => f.status === 'active')
data.map((item: DataItem) => item.id)
records.forEach((rel: Relationship) => { ... })
```

**Examples:**
- `frontend/src/hooks/use-access-review.ts:189-198` - Filter callbacks on findings array
- `frontend/src/services/dossier-overview.service.ts:157,178,256,275,292,308` - Map/forEach on relationships, positions, MOUs
- Multiple component files - D3 callbacks, data transformations

**Recommended Fix:**
- Create proper interfaces for domain objects (Finding, Relationship, Position, MOU, etc.)
- Use JsonObject from common.types.ts for truly dynamic data
- Infer types from existing TypeScript definitions where possible

---

### 2. Record Types with `any`
**Count:** ~33 occurrences
**Files Affected:** Type definitions, Components, Hooks

**Pattern:**
```typescript
// ❌ Current
metadata?: Record<string, any>
additional_details?: Record<string, any>
proposed_changes: Record<string, any>
changes: Record<string, { old: any; new: any }>

// ✅ Replacement (Already defined in common.types.ts!)
metadata?: Metadata  // = Record<string, JsonValue>
additional_details?: DynamicFields  // = Record<string, JsonValue>
proposed_changes: DynamicFields
changes: AuditChanges  // = Record<string, { old: JsonValue; new: JsonValue }>
```

**Examples:**
- Type definitions with `Record<string, any>` for metadata
- Form components with dynamic fields
- Audit/change tracking objects

**Recommended Fix:**
Use existing types from `common.types.ts`:
- `Metadata` for metadata fields
- `DynamicFields` for type-specific/form fields
- `AuditChanges` for change tracking
- `JsonObject` for general dynamic objects

---

### 3. Event/Payload Handlers
**Count:** ~24 occurrences
**Files Affected:** Realtime, Websockets, Event handlers

**Pattern:**
```typescript
// ❌ Current
onBroadcast?: (event: string, payload: any) => void
onDatabaseChange?: (payload: any) => void
broadcast(event: string, payload: any)
private messageQueue: Map<string, Array<{ event: string; payload: any }>>

// ✅ Replacement
onBroadcast?: (event: string, payload: JsonObject) => void
onDatabaseChange?: (payload: RealtimePayload) => void  // Already in common.types.ts!
broadcast(event: string, payload: JsonObject)
private messageQueue: Map<string, Array<{ event: string; payload: JsonObject }>>
```

**Examples:**
- `frontend/src/lib/realtime.ts:9-10,28,205,223,302` - All realtime payload handling
- Notification components
- WebSocket message handlers

**Recommended Fix:**
- Use `RealtimePayload<T>` from common.types.ts for Supabase realtime
- Use `JsonObject` for generic event payloads
- Create specific payload interfaces for typed events

---

### 4. Generic Data/Value Parameters
**Count:** ~16 occurrences
**Files Affected:** Form components, Generic utilities

**Pattern:**
```typescript
// ❌ Current
const updateField = (field: string, value: any) => { ... }
data?: any
content: any

// ✅ Replacement
const updateField = (field: string, value: JsonValue) => { ... }
data?: JsonObject
content: JsonObject
```

**Examples:**
- `frontend/src/components/DecisionList.tsx:53` - Generic field update
- `frontend/src/services/offline-queue.ts:10` - Queue action data
- Form field value handlers

**Recommended Fix:**
- Use `JsonValue` for primitive or mixed values
- Use `JsonObject` for object values
- Use specific types when structure is known

---

### 5. Explicit `any[]` Arrays
**Count:** ~12 occurrences
**Files Affected:** Services, Components

**Pattern:**
```typescript
// ❌ Current
const mous: any[] = []
const decisions: any[] = []
const newData: any[] = []
Promise<{ success: boolean; results: any[] }>

// ✅ Replacement
const mous: MOU[] = []
const decisions: Decision[] = []
const newData: DataItem[] = []
Promise<{ success: boolean; results: DomainObject[] }>
```

**Examples:**
- `frontend/src/services/dossier-overview.service.ts:274,290` - MOU and attachment arrays
- Multiple components initializing empty arrays
- Promise return types with result arrays

**Recommended Fix:**
- Define proper domain interfaces (MOU, Decision, etc.)
- Use JsonArray from common.types.ts only for truly dynamic arrays
- Type Promise results with specific domain objects

---

### 6. Error Handling
**Count:** ~9 occurrences
**Files Affected:** Hooks, Pages, Error boundaries

**Pattern:**
```typescript
// ❌ Current
catch (error: any) { ... }
onError: (_error: any) => { ... }
retry: (failureCount, error: any) => { ... }

// ✅ Replacement
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error(String(error))
  }
}
onError: (error: Error | unknown) => { ... }
retry: (failureCount: number, error: Error) => { ... }
```

**Examples:**
- `frontend/src/hooks/use-ai-suggestions.ts:70,124` - Error callbacks
- `frontend/src/pages/WaitingQueue.tsx:165` - Catch blocks
- `frontend/src/components/error-boundary/ApiErrorBoundary.tsx:160` - Error boundary

**Recommended Fix:**
- Use `unknown` for catch blocks (TypeScript best practice)
- Use `Error | unknown` for error callbacks
- Add type guards to narrow error types
- Use `ApiErrorDetails` from common.types.ts for API errors

---

### 7. Component Props (React)
**Count:** ~8 occurrences
**Files Affected:** UI components, Aceternity components

**Pattern:**
```typescript
// ❌ Current
navItems.map((navItem: any, idx: number) => (
  <Component key={idx} data={navItem} />
))

// ✅ Replacement
interface NavItem {
  link: string
  name: string
  icon: React.ReactNode
}

navItems.map((navItem: NavItem, idx: number) => (
  <Component key={idx} data={navItem} />
))
```

**Examples:**
- `frontend/src/components/ui/floating-navbar.tsx:57` - Nav items
- Multiple Aceternity UI components
- List rendering components

**Recommended Fix:**
- Define proper prop interfaces
- Extract to separate type files if reusable
- Use `React.ReactNode` for children/icon props
- Use `React.ComponentProps<typeof Component>` for component prop extraction

---

### 8. Index Signatures
**Count:** ~4 occurrences
**Files Affected:** Type definitions

**Pattern:**
```typescript
// ❌ Current
interface MyType {
  knownField: string
  [key: string]: any  // Allow type-specific metadata
}

// ✅ Replacement
interface MyType {
  knownField: string
  [key: string]: JsonValue | string  // More specific union
}

// OR better - separate the dynamic part
interface MyType {
  knownField: string
  metadata?: Metadata
}
```

**Examples:**
- `frontend/src/types/timeline.types.ts:70` - Timeline metadata
- Type definitions allowing extra properties

**Recommended Fix:**
- Use `JsonValue` instead of `any` in index signatures
- Consider separating dynamic fields into a `metadata` property
- Use discriminated unions for type-specific fields when possible

---

### 9. Type Assertions
**Count:** ~2 occurrences
**Files Affected:** Hooks, Utilities

**Pattern:**
```typescript
// ❌ Current
const initial: Record<NotificationCategory, CategoryPreference> = {} as any

// ✅ Replacement
const initial: Record<NotificationCategory, CategoryPreference> =
  {} as Record<NotificationCategory, CategoryPreference>

// OR initialize properly
const initial: Partial<Record<NotificationCategory, CategoryPreference>> = {}
```

**Examples:**
- Initial state creation
- Type casting workarounds

**Recommended Fix:**
- Use proper type assertions with specific types
- Use `Partial<T>` for incomplete initial states
- Avoid `as any` - it defeats the purpose of TypeScript

---

### 10. Library Integration Issues
**Count:** ~5 occurrences
**Files Affected:** D3 components, Third-party library usage

**Pattern:**
```typescript
// ❌ Current
.id((d: any) => d.id)  // D3 callback

// ✅ Replacement
interface GraphNode {
  id: string
  // ... other properties
}

.id((d: GraphNode) => d.id)
```

**Examples:**
- `frontend/src/components/Dossier/sections/Relationships.tsx:364` - D3 force graph
- Third-party library callbacks

**Recommended Fix:**
- Define interfaces for data passed to libraries
- Use library-provided types when available (@types packages)
- Create wrapper functions with proper types

---

## Files by Category

### Hooks (20 files)
- use-access-review.ts - Filter callbacks
- use-ai-suggestions.ts - Error handlers
- use-contributors.ts
- use-queue-filters.ts
- use-role-assignment.ts
- use-tasks.ts
- use-user-management.ts
- use-waiting-queue-actions.ts
- useAttachPosition.ts
- useAvailabilityPolling.ts
- useBilateralAgreements.ts
- useCalendarConflicts.ts
- useDetachPosition.ts
- useDossierFirstSearch.ts
- useDossiers.ts
- useIntakeApi.ts
- useNavigation.ts
- usePresence.ts - Presence state iteration
- useSearch.ts
- useSuggestions.ts
- useUpdateWorkflowStage.ts
- useWorkItemDossierLinks.ts

### Services (2 files)
- dossier-overview.service.ts - Heavy array mapping with any
- offline-queue.ts - Queue data field

### Components - UI (6 files)
- ui/floating-navbar.tsx - Nav items
- ui/animated-tooltip.tsx
- ui/link-preview.tsx
- ui/placeholders-and-vanish-input.tsx
- ui/3d-card.tsx
- ui/moving-border.tsx

### Components - Domain (40+ files)
- Dossier components (9 files)
- Calendar components (2 files)
- Task components (1 file)
- After-action components (3 files)
- Position components (3 files)
- Analytics components (4 files)
- Notification components (2 files)
- Waiting queue components (2 files)
- Form/input components (3 files)
- And many more...

### Pages/Routes (14 files)
- Settings, assignments, tickets, search pages
- After-action pages
- Person detail pages
- Report pages
- Route components

### Library/Utilities (3 files)
- lib/realtime.ts - Payload handling
- lib/specifications/builder.ts
- types/timeline.types.ts

---

## Replacement Strategy

### Phase 1: High-Impact, Low-Risk (Priority 1)
**Target:** Services and Hooks
**Effort:** Medium
**Impact:** High - Used throughout the app

1. Replace all `Record<string, any>` with existing common.types.ts types
2. Fix error handling (any → unknown/Error)
3. Type array callbacks in services

### Phase 2: Component Props (Priority 2)
**Target:** UI components, form components
**Effort:** High
**Impact:** Medium - Improves component API clarity

1. Define proper interfaces for component props
2. Type React.ReactNode for children/icons
3. Fix Aceternity component prop types

### Phase 3: Domain Objects (Priority 3)
**Target:** Array mappings, domain logic
**Effort:** High
**Impact:** High - Catches logic errors

1. Define domain interfaces (Finding, Relationship, MOU, Decision, etc.)
2. Replace array type declarations (any[] → DomainObject[])
3. Type callback parameters properly

### Phase 4: Edge Cases (Priority 4)
**Target:** Type assertions, library integrations
**Effort:** Low
**Impact:** Low - Isolated issues

1. Fix type assertions (as any → proper types)
2. Add proper types for D3 and other libraries
3. Clean up remaining edge cases

---

## Type-Safe Alternatives Reference

### From `common.types.ts` (ALREADY AVAILABLE!)

| Use Case | ❌ Current | ✅ Use Instead |
|----------|-----------|----------------|
| JSON-compatible values | `any` | `JsonValue` |
| Dynamic objects | `Record<string, any>` | `JsonObject` |
| Metadata fields | `Record<string, any>` | `Metadata` |
| Form fields | `Record<string, any>` | `DynamicFields` |
| API error details | `any` | `ApiErrorDetails` |
| Realtime payloads | `payload: any` | `RealtimePayload<T>` |
| Audit changes | `{ old: any; new: any }` | `AuditChange` / `AuditChanges` |
| Report params | `Record<string, any>` | `ReportParameters` |
| URL query params | `Record<string, any>` | `NavigationState` |
| Filter state | `Record<string, any>` | `FilterState<T>` |
| DB rows with extras | `any` | `DatabaseRow<T>` |
| Presence data | `any` | `PresenceData` |
| Conflict fields | `{ local: any; server: any }` | `ConflictField` |

### Type Guards Available
- `isJsonObject(value)` - Check if JsonObject
- `isJsonArray(value)` - Check if JsonArray
- `isJsonPrimitive(value)` - Check if JsonPrimitive
- `isJsonValue(value)` - Check if valid JsonValue
- `toJsonValue(value)` - Safe conversion to JsonValue

---

## Missing Types (To Be Created)

### Domain Objects
These types need to be defined in separate domain type files:

```typescript
// types/access-review.types.ts
interface Finding {
  id: string
  issues?: string[]
  certified_by?: string
  certified_at?: string
  // ... other fields
}

// types/dossier.types.ts
interface Relationship {
  id: string
  source_dossier: Dossier
  target_dossier: Dossier
  relationship_type: DossierRelationshipType
  effective_from?: string
  effective_to?: string
  notes_en?: string
  notes_ar?: string
  created_at: string
  is_outgoing?: boolean
}

interface MOU {
  id: string
  // ... MOU fields
}

interface DossierDocument {
  // ... document fields
}

// types/work-items.types.ts
interface Decision {
  // ... decision fields
}

// types/ui.types.ts
interface NavItem {
  link: string
  name: string
  icon: React.ReactNode
}
```

---

## Metrics

### Overall Stats
- **Total files:** 111
- **Total occurrences:** ~210
- **Average per file:** ~1.9

### By Pattern
| Pattern | Count | % of Total |
|---------|-------|------------|
| Array callbacks | ~60 | 29% |
| Record types | 33 | 16% |
| Event/payload | 24 | 11% |
| Value parameters | 16 | 8% |
| Arrays (any[]) | 12 | 6% |
| Error handling | 9 | 4% |
| Component props | 8 | 4% |
| Index signatures | 4 | 2% |
| Type assertions | 2 | 1% |
| Library integration | ~5 | 2% |
| Other | ~37 | 17% |

### By File Type
| Type | Files | % of Total |
|------|-------|------------|
| Components | 60 | 54% |
| Hooks | 22 | 20% |
| Pages/Routes | 14 | 13% |
| Services | 2 | 2% |
| Lib/Utils | 3 | 3% |
| Types | 2 | 2% |
| Other | 8 | 7% |

---

## Risk Assessment

### Low Risk (Safe to refactor immediately)
- ✅ Record<string, any> → Existing common.types.ts types
- ✅ Error handling (any → unknown)
- ✅ Type assertions cleanup

### Medium Risk (Requires testing)
- ⚠️ Array callback parameters (might reveal logic bugs)
- ⚠️ Component prop interfaces (might break prop passing)
- ⚠️ Event/payload types (might reveal type mismatches)

### High Risk (Careful refactoring needed)
- ⚠️ Service layer types (heavily used)
- ⚠️ Domain object definitions (affects multiple features)
- ⚠️ Library integrations (might conflict with third-party types)

---

## Recommendations

1. **Start with existing types** - Use common.types.ts types first (80% of Record<string, any> can be replaced immediately)

2. **Define domain interfaces** - Create proper types for Finding, Relationship, MOU, Decision, etc. in dedicated type files

3. **Fix error handling** - Simple find/replace for catch blocks (any → unknown)

4. **Batch by risk level** - Do low-risk changes first, test thoroughly, then move to medium/high risk

5. **Incremental approach** - Refactor file by file, run type checks after each batch

6. **Document new types** - Add JSDoc comments explaining when to use each type

7. **Update CLAUDE.md** - Add guidelines on when to use JsonValue vs specific types

---

## Next Steps

1. ✅ Complete this audit (DONE)
2. Review common.types.ts for any missing type alternatives (subtask-1-2)
3. Create domain type files for missing interfaces
4. Begin Phase 1: Services and Hooks (highest impact)
5. Continue with Component batches
6. Final verification and testing

---

## Conclusion

The codebase has **210 instances of `any` across 111 files**, despite having comprehensive type-safe alternatives already defined in `common.types.ts`. The most common patterns are:

1. Array callback parameters (29%)
2. Record types (16%)
3. Event/payload handlers (11%)

**Key Finding:** ~33 instances of `Record<string, any>` can be immediately replaced with existing types from common.types.ts with near-zero risk.

**Estimated Effort:**
- Low-risk replacements: 2-3 hours
- Medium-risk (hooks/services): 5-8 hours
- High-risk (domain objects, components): 10-15 hours
- **Total:** ~20-25 hours for complete refactoring

**Expected Outcome:**
- Eliminate 100% of `any` in hooks and services
- Reduce component `any` usage by 80%+
- Improve type safety and IDE autocomplete
- Catch potential logic bugs at compile time
