# Phase 26: Shared Wizard Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 26-shared-wizard-infrastructure
**Areas discussed:** Hook extraction scope, Draft storage strategy, Shell vs FormWizard, Schema composition

---

## Hook Extraction Scope

| Option                   | Description                                                                                     | Selected |
| ------------------------ | ----------------------------------------------------------------------------------------------- | -------- |
| All-in-one hook          | Hook owns everything: form state, draft persistence, AI assist, duplicate detection, submission | ✓        |
| Layered composable hooks | Split into smaller hooks composed internally                                                    |          |
| Core + optional features | Core owns form/draft/submission, AI/duplicate opt-in via config flags                           |          |

**User's choice:** All-in-one hook
**Notes:** Simplest consumer API — one hook call, done.

---

| Option                  | Description                                               | Selected |
| ----------------------- | --------------------------------------------------------- | -------- |
| Expose form directly    | Return react-hook-form form object alongside wizard state | ✓        |
| Abstract behind wrapper | Hide react-hook-form behind simpler API                   |          |

**User's choice:** Expose form directly
**Notes:** Consistent with existing FormProvider pattern in the codebase.

---

## Draft Storage Strategy

| Option                 | Description                                           | Selected |
| ---------------------- | ----------------------------------------------------- | -------- |
| localStorage           | Keep current useFormDraft pattern with per-type keys  |          |
| IndexedDB via AutoSave | Migrate to existing AutoSaveFormWrapper               |          |
| Unified system         | New abstraction using IndexedDB with sync-looking API |          |

**User's choice:** "You decide the best for the app"
**Notes:** Claude's discretion — evaluate tradeoffs during planning.

---

| Option             | Description                                          | Selected |
| ------------------ | ---------------------------------------------------- | -------- |
| Silent migration   | Migrate automatically on first load, no notification | ✓        |
| Toast notification | Show brief toast about format update                 |          |

**User's choice:** Silent migration
**Notes:** Least disruptive for users.

---

## Shell vs FormWizard

| Option                | Description                                               | Selected |
| --------------------- | --------------------------------------------------------- | -------- |
| Thin config adapter   | Shell accepts type-aware step config, wires to FormWizard |          |
| Full replacement      | Shell replaces FormWizard for dossier creation            |          |
| Compositional wrapper | Layout container composing FormWizard with sidebar/header |          |

**User's choice:** "Do the best for the app"
**Notes:** Claude's discretion — FormWizard already handles most UI concerns.

---

| Option                 | Description                                                | Selected |
| ---------------------- | ---------------------------------------------------------- | -------- |
| Include help panel now | Wire contextual help into Shell infrastructure             |          |
| Defer to Phase 31      | Keep Shell focused on navigation/layout, help in UX Polish | ✓        |

**User's choice:** Defer to Phase 31
**Notes:** Shell may include hook point but not the panel itself.

---

## Schema Composition

| Option                      | Description                                    | Selected |
| --------------------------- | ---------------------------------------------- | -------- |
| Base + merge pattern        | baseDossierSchema.merge(typeFields)            | ✓        |
| Discriminated union         | z.discriminatedUnion('type', [...])            |          |
| Keep extension_data pattern | Nested extension_data with per-type sub-schema |          |

**User's choice:** Base + merge pattern
**Notes:** Clean, type-safe, each type validates only its own fields.

---

| Option                | Description                                                     | Selected |
| --------------------- | --------------------------------------------------------------- | -------- |
| Per-type schema files | schemas/country.schema.ts, schemas/organization.schema.ts, etc. | ✓        |
| Single schemas file   | All schemas in one dossier-schemas.ts                           |          |
| Co-located with steps | Schema next to wizard step components                           |          |

**User's choice:** Per-type schema files
**Notes:** Clean separation, each file stays small and focused.

---

| Option             | Description                                                 | Selected |
| ------------------ | ----------------------------------------------------------- | -------- |
| Form defaults only | getDefaultsForType returns field values only                | ✓        |
| Full type config   | Returns defaults + steps + required/optional field metadata |          |

**User's choice:** Form defaults only
**Notes:** Step configuration and field metadata come from separate per-type config objects.

---

## Claude's Discretion

- Draft storage mechanism (localStorage vs IndexedDB vs unified)
- CreateWizardShell design approach (thin adapter vs full replacement vs compositional wrapper)

## Deferred Ideas

None — discussion stayed within phase scope.
