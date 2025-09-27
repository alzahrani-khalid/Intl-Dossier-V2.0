# Data Model: Specification Consistency Tracking

**Feature**: Resolve Theme System Specification Inconsistencies
**Date**: 2025-09-27

## Overview

This data model represents the relationships between specification documents and their requirements for consistency tracking and validation.

## Entities

### 1. SpecificationDocument
Represents a specification document in the system.

**Fields**:
- `id`: string (e.g., "spec", "plan", "tasks")
- `path`: string (file path)
- `type`: enum ["specification", "plan", "tasks"]
- `version`: string (semantic version)
- `lastModified`: timestamp
- `checksum`: string (MD5 hash for change detection)

**Relationships**:
- Has many `Requirement`
- Has many `CrossReference`

### 2. Requirement
Represents a functional or non-functional requirement.

**Fields**:
- `id`: string (e.g., "FR-001")
- `key`: string (slug form, e.g., "theme-switch-performance")
- `description`: string
- `type`: enum ["functional", "non-functional", "edge-case"]
- `measurable`: boolean
- `metric`: string (optional, e.g., "<100ms")
- `documentId`: string (foreign key)
- `lineNumber`: number (location in document)

**Validation Rules**:
- `id` must match pattern /^[A-Z]{2}-\d{3}$/
- `description` must not contain ambiguous terms from blacklist
- If `measurable` is true, `metric` must be provided

**Relationships**:
- Belongs to `SpecificationDocument`
- Has many `Task`
- Has many `CrossReference`

### 3. Task
Represents an implementation task.

**Fields**:
- `id`: string (e.g., "T001")
- `description`: string
- `parallel`: boolean (can run in parallel)
- `phase`: string (e.g., "3.1", "3.2")
- `filePath`: string (file to modify/create)
- `status`: enum ["pending", "in_progress", "completed"]
- `requirementKeys`: string[] (linked requirement keys)

**Validation Rules**:
- `id` must match pattern /^T\d{3}$/
- `filePath` must be a valid path
- At least one `requirementKey` should exist

**Relationships**:
- Maps to many `Requirement` (via requirementKeys)
- Has many `TaskDependency`

### 4. CrossReference
Represents a reference between documents or requirements.

**Fields**:
- `id`: string (UUID)
- `sourceDoc`: string (document id)
- `targetDoc`: string (document id)
- `sourceLocation`: string (line or section reference)
- `targetLocation`: string (line or section reference)
- `type`: enum ["requirement", "metric", "terminology", "dependency"]
- `isConsistent`: boolean
- `inconsistencyDetails`: string (optional)

**Validation Rules**:
- `sourceDoc` and `targetDoc` must exist
- If `isConsistent` is false, `inconsistencyDetails` must be provided

### 5. Term
Represents terminology used across documents.

**Fields**:
- `id`: string (UUID)
- `canonical`: string (correct term, e.g., "shadcn/ui")
- `variants`: string[] (found variations)
- `occurrences`: TermOccurrence[]

**Sub-entity: TermOccurrence**:
- `documentId`: string
- `lineNumber`: number
- `context`: string (surrounding text)

**Validation Rules**:
- `canonical` must be non-empty
- No duplicate variants

### 6. ValidationRule
Represents a consistency validation rule.

**Fields**:
- `id`: string
- `name`: string
- `description`: string
- `type`: enum ["performance", "terminology", "coverage", "precedence"]
- `expression`: string (validation logic)
- `severity`: enum ["critical", "high", "medium", "low"]
- `enabled`: boolean

**Validation Rules**:
- `expression` must be valid validation syntax
- `severity` determines failure behavior

## State Transitions

### Task Status Flow
```
pending → in_progress → completed
         ↓
      blocked (if dependency issue)
```

### Document Validation State
```
unchecked → validating → valid
                      ↓
                   invalid (with issues)
```

## Consistency Rules

1. **Performance Metrics**: All performance-related requirements must use the same metric format
2. **Terminology**: All references to the same concept must use canonical terms
3. **Coverage**: Every requirement must have at least one associated task
4. **Precedence**: Default behavior precedence must be consistent across documents
5. **Edge Cases**: All edge cases must have defined expected behaviors

## Indexes

- `Requirement.key` - for fast lookup by slug
- `Task.requirementKeys` - for coverage analysis
- `CrossReference.(sourceDoc, targetDoc)` - for relationship queries
- `Term.canonical` - for terminology validation

## Sample Data

```json
{
  "document": {
    "id": "spec",
    "path": "/specs/006-i-need-you/spec.md",
    "type": "specification",
    "version": "1.0.0"
  },
  "requirement": {
    "id": "FR-008",
    "key": "theme-switch-performance",
    "description": "System MUST update all visual elements in <100ms without page reload",
    "type": "functional",
    "measurable": true,
    "metric": "<100ms",
    "documentId": "spec",
    "lineNumber": 145
  },
  "task": {
    "id": "T021",
    "description": "Create ThemeProvider component in frontend/src/components/theme-provider/",
    "parallel": true,
    "phase": "3.3",
    "filePath": "frontend/src/components/theme-provider/theme-provider.tsx",
    "status": "pending",
    "requirementKeys": ["theme-switch-performance", "immediate-update"]
  },
  "crossReference": {
    "id": "ref-001",
    "sourceDoc": "spec",
    "targetDoc": "plan",
    "sourceLocation": "FR-008",
    "targetLocation": "Performance Goals",
    "type": "metric",
    "isConsistent": false,
    "inconsistencyDetails": "Spec says 'immediate' but plan says '<100ms'"
  }
}
```

## Usage

This data model will be used to:
1. Track relationships between specification elements
2. Validate consistency across documents
3. Ensure requirement coverage
4. Identify terminology drift
5. Generate consistency reports

---
*Data model for specification consistency tracking*