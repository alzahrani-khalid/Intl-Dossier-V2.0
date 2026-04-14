# Domain Pitfalls

**Domain:** Type-specific dossier creation wizard refactoring
**Researched:** 2026-04-14

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Building Type Wizards Before Shared Infrastructure

**What goes wrong:** Starting with a type-specific wizard before extracting the shared hook leads to copy-pasting DossierCreateWizard logic into each wizard, then retrofitting shared infrastructure afterward.
**Why it happens:** Tempting to "just build one" to see progress quickly.
**Consequences:** 8 copies of draft management, AI assist wiring, submission logic. Refactoring them later is error-prone.
**Prevention:** Phase 1 must extract `useCreateDossierWizard` hook and `CreateWizardShell` before any type-specific wizard is built.
**Detection:** If a wizard file exceeds ~80 LOC, it is likely duplicating shared logic.

### Pitfall 2: Breaking the Old Wizard Before New Ones Are Ready

**What goes wrong:** Deleting or modifying `DossierCreateWizard.tsx` before all 8 type-specific wizards are functional.
**Why it happens:** Eagerness to clean up old code.
**Consequences:** Users cannot create some dossier types during the transition period.
**Prevention:** Keep old wizard functional at `/dossiers/create` throughout migration. Delete only in final cleanup phase after all 8 per-type routes work.
**Detection:** If `/dossiers/create` stops working before all type routes are live.

### Pitfall 3: Flat Schema Reuse Instead of Per-Type Schemas

**What goes wrong:** Keeping the single `dossierSchema` from `Shared.ts` and just passing it to each wizard with runtime filtering.
**Why it happens:** Seems simpler than creating 8 schemas.
**Consequences:** TypeScript cannot narrow `extension_data` fields per type. Form state carries unused fields. Validation is imprecise. The whole point of the refactoring (type-specific precision) is lost.
**Prevention:** Create per-type schemas extending a shared base from day one. Each schema's `extension_data` has only that type's fields.
**Detection:** If `filterExtensionDataByType()` is still called in the new code, schemas are not properly split.

## Moderate Pitfalls

### Pitfall 4: Route Conflicts with Dynamic $id Segment

**What goes wrong:** TanStack Router's `create.tsx` may conflict with `$id.tsx` in the same directory if not properly ordered.
**Prevention:** The existing `dossiers/create.tsx` already handles this (static routes take precedence). Replicate the same pattern: place `create.tsx` files alongside `$id.tsx` in each type directory. TanStack Router file-based routing resolves static before dynamic.

### Pitfall 5: Draft Key Collision During Migration

**What goes wrong:** Old drafts saved under `dossier-create-draft` cannot be loaded by new per-type wizards using `dossier-create-country` keys.
**Prevention:** On the CreateDossierHub, check for legacy draft key and offer to resume or discard. New wizards use type-specific keys from the start.

### Pitfall 6: Losing Quick Add Org State During Step Navigation

**What goes wrong:** The QuickAddOrgDialog state (currently lifted to DossierCreateWizard) is lost when it should be scoped to ForumDetailsStep.
**Prevention:** Move `QuickAddOrgDialog` state into `ForumDetailsStep` and `WorkingGroupDetailsStep` directly. The dialog is only needed by those steps. The organizing body ID is stored in form state (persisted by react-hook-form), so the dialog state is transient.

### Pitfall 7: Relationship Linking Fails Silently After Dossier Creation

**What goes wrong:** Dossier is created successfully but the post-create relationship linking call fails. User sees success but relationships are missing.
**Prevention:** Handle the two-step submission with proper error UX: if relationship linking fails, show a warning toast ("Dossier created but relationships could not be linked -- you can add them from the detail page") rather than rolling back the dossier.

## Minor Pitfalls

### Pitfall 8: Forgetting to Update Command Palette

**What goes wrong:** The CommandPalette component has dossier type links that still point to `/dossiers/create`.
**Prevention:** Search for all `dossiers/create` references in the codebase during cleanup phase. Update to type-specific routes.

### Pitfall 9: Missing i18n Keys for New Steps

**What goes wrong:** New relationship steps or elected official office steps lack translation keys, showing raw keys in Arabic.
**Prevention:** Add i18n keys for all new steps before building the components. Update both `en/dossier.json` and `ar/dossier.json`.

### Pitfall 10: Code Splitting Not Working

**What goes wrong:** All 8 wizard components bundled together despite separate routes.
**Prevention:** Use `React.lazy()` in route files for each wizard page component, matching the existing code splitting pattern.

## Phase-Specific Warnings

| Phase Topic            | Likely Pitfall                     | Mitigation                                                                    |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Shared Infrastructure  | Over-abstracting the hook          | Keep hook API surface small; config object handles variation                  |
| Country Wizard (first) | Not testing all preserved features | Checklist: AI assist, draft save/restore, duplicate detection, review, submit |
| Engagement Wizard      | Relationship picker UX complexity  | Start with simple multi-select; enhance later                                 |
| Elected Official       | Confusion about type vs subtype    | Always use `type: 'person'` + `person_subtype: 'elected_official'`            |
| Hub + Cleanup          | Missing link updates               | Global search for `/dossiers/create` before deleting old code                 |

## Sources

- Direct analysis of `DossierCreateWizard.tsx`, `Shared.ts`, `TypeSpecificStep.tsx`
- Route structure analysis across `routes/_protected/dossiers/` directory
- `elected-official.types.ts` for person subtype pattern
- `form-wizard.tsx` for FormWizard/useFormDraft behavior
