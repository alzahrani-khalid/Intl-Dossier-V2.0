---
tags: [gotcha, mistake, edge-case, bug, warning]
summary: Mistakes and edge cases to avoid
relevantTo: [error, bug, fix, issue, problem]
importance: 0.9
relatedFiles: []
usageStats:
  loaded: 131
  referenced: 45
  successfulFeatures: 45
---

# Gotchas

Mistakes and edge cases to avoid. These are lessons learned from past issues.

---

#### [Gotcha] is_overdue field must be computed at database layer (via view or trigger), not calculated client-side on deadline field (2026-01-13)

- **Situation:** Initial test assumed overdueOnly specification would receive a deadline field and calculate overdue status. Actual implementation expected is_overdue as pre-computed field from database
- **Root cause:** Overcomplicated client-side business logic; database has accurate time context and timezone handling. Computing at DB layer ensures consistency across all queries regardless of where data is consumed
- **How to avoid:** Requires database schema to include computed field or view, but eliminates timezone bugs and improves query performance for bulk operations

#### [Gotcha] TypeScript type inference failed on dynamic icon lookup (Icons[iconName]) requiring explicit `as unknown` cast before second cast (2026-01-13)

- **Situation:** ENTITY_TYPE_INFO maps entity types to lucide-react icon names, but TypeScript couldn't infer correct type for dynamic component lookup
- **Root cause:** lucide-react exports namespace with union type of all icons. Dynamic key access creates `any` type without explicit casting. Double cast forces type safety check.
- **How to avoid:** Double cast looks awkward but makes it explicit that dynamic lookup is intentional and type-safe (IconComponent could be undefined)

#### [Gotcha] TypeScript's 'import type' statement strips runtime values at compilation. Constants exported as regular values must use regular imports, not type-only imports, or they will be undefined at runtime. (2026-01-14)

- **Situation:** complianceKeys constant was imported with 'import type' causing 'complianceKeys is not defined' error at runtime, despite the code compiling successfully.
- **Root cause:** TypeScript's type-only imports are erased during compilation. The transpiler removes them entirely, leaving no runtime value. This is intentional for tree-shaking, but breaks if a value is actually needed at runtime.
- **How to avoid:** Type-only imports enable better tree-shaking and reduce bundle size, but require discipline to only import actual types, not runtime constants. Mixed imports require two separate import statements.

#### [Gotcha] Playwright strict mode failures when testing calendar UI elements - querySelector finds multiple matching elements even when checking specific conflict components (2026-01-14)

- **Situation:** Test suite was failing with 'strict' mode violations when trying to verify component presence in the calendar
- **Root cause:** Root cause: calendar generates multiple similar DOM structures (other months, preview calendars). Selector `.calendar-conflict-badge` matched badges from other conflict scenarios, not just the test target. Strict mode protects against brittle selectors
- **How to avoid:** Specific selectors like `[data-testid='conflict-comparison-main-event']` are more verbose but catch real problems. Strict mode enforcement prevents silent failures in production
