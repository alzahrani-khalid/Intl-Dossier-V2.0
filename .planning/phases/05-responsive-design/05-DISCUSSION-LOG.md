# Phase 5: Responsive Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 05-responsive-design
**Areas discussed:** Navigation strategy, Mobile table behavior, Page priority ordering, Modal/form mobile pattern

---

## Navigation Strategy

| Option                              | Description                                                                                       | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| Adopt NavigationShell (Recommended) | Wire existing 3-column NavigationShell into production. Handles hamburger/icon rail/full sidebar. | ✓        |
| Fix production AppSidebar           | Keep current sidebar, add responsive behavior. Less risky but more work.                          |          |
| You decide                          | Claude picks best approach.                                                                       |          |

**User's choice:** Adopt NavigationShell (Recommended)
**Notes:** None

### Follow-up: Breakpoints

| Option                   | Description                                                    | Selected |
| ------------------------ | -------------------------------------------------------------- | -------- |
| Keep current breakpoints | Hamburger < 768px, icon rail 768-1024px, full sidebar > 1024px |          |
| You decide               | Claude adjusts if content density requires.                    | ✓        |

**User's choice:** You decide
**Notes:** None

### Follow-up: Old Nav

| Option                   | Description                                       | Selected |
| ------------------------ | ------------------------------------------------- | -------- |
| Remove old nav entirely  | Clean break. NavigationShell replaces everything. |          |
| Keep old nav as fallback | Temporary fallback in case of issues.             |          |
| You decide               | Claude decides based on risk.                     | ✓        |

**User's choice:** You decide
**Notes:** None

---

## Mobile Table Behavior

| Option                            | Description                                                          | Selected |
| --------------------------------- | -------------------------------------------------------------------- | -------- |
| Card view on mobile (Recommended) | Tables collapse to stacked cards. Consistent with DataTable pattern. | ✓        |
| Horizontal scroll on mobile       | Tables keep columns, scroll horizontally.                            |          |
| Hybrid                            | Cards for simple, scroll for complex.                                |          |

**User's choice:** Card view on mobile (Recommended)
**Notes:** None

### Follow-up: Bulk Actions

| Option                                | Description                                                                 | Selected |
| ------------------------------------- | --------------------------------------------------------------------------- | -------- |
| Yes — sticky bottom bar (Recommended) | Selected items count + actions stick to bottom. Uses mobile-action-bar.tsx. | ✓        |
| Keep inline with table header         | Bulk actions stay above table.                                              |          |
| You decide                            | Claude decides.                                                             |          |

**User's choice:** Yes — sticky bottom bar (Recommended)
**Notes:** None

---

## Page Priority Ordering

### Critical Pages (multi-select)

| Option                      | Description                                         | Selected |
| --------------------------- | --------------------------------------------------- | -------- |
| Dashboard + Kanban board    | Landing experience. Charts, widgets, drag-and-drop. | ✓        |
| Dossier list + detail pages | Core workflow. List views + detail with tabs.       | ✓        |
| Forms (create/edit)         | Data entry. Mobile keyboard, field stacking.        | ✓        |
| Settings + user profile     | Account management. Usually simpler fixes.          | ✓        |

**User's choice:** All four selected
**Notes:** All pages are priority

### Scope

| Option                            | Description                                           | Selected |
| --------------------------------- | ----------------------------------------------------- | -------- |
| Critical path first (Recommended) | Fix most-used pages first, lighter pass on secondary. |          |
| Fix everything now                | Comprehensive pass across all ~100+ routes.           | ✓        |

**User's choice:** Fix everything now
**Notes:** None

---

## Modal/Form Mobile Pattern

### Modals

| Option                               | Description                                                                 | Selected |
| ------------------------------------ | --------------------------------------------------------------------------- | -------- |
| Bottom sheet on mobile (Recommended) | Modals become bottom sheets (Vaul) on mobile. Drag-to-dismiss, snap points. | ✓        |
| Full-screen modals on mobile         | Modals expand to full screen.                                               |          |
| Keep as centered modals everywhere   | Same modal on all sizes.                                                    |          |

**User's choice:** Bottom sheet on mobile (Recommended)
**Notes:** None

### Forms

| Option                               | Description                                        | Selected |
| ------------------------------------ | -------------------------------------------------- | -------- |
| Single scrollable form (Recommended) | All fields stacked vertically, sticky save button. | ✓        |
| Stepped wizard / accordion           | Break form into steps/sections.                    |          |
| You decide                           | Claude picks.                                      |          |

**User's choice:** Single scrollable form (Recommended)
**Notes:** None

---

## Claude's Discretion

- NavigationShell breakpoint values
- Old AppSidebar removal timing
- useBreakpoint/useMediaQuery hook adoption
- Card layout designs for each table variant

## Deferred Ideas

None — discussion stayed within phase scope.
