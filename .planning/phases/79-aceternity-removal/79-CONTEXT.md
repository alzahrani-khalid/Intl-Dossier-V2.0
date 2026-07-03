# Phase 79: Aceternity Removal - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Auto-generated (smart discuss — 1 user scope decision captured)

<domain>
## Phase Boundary

Aceternity is fully gone — the live component rebuilt on HeroUI v3/Radix with its accessibility + validation contract provably preserved, the dead components deleted, and the `@aceternity-pro` registry entry removed. Covers ACET-01 (rebuild) and ACET-02 (registry + import ban). Depends on Phase 78 (rebuilds target the final HeroUI v3.2.1 primitives). Does not include the final full-route verification (Phase 80).

</domain>

<decisions>
## Implementation Decisions

### Aceternity scope (USER DECISION — 2026-07-03)

- **Delete the 7 dead components, rebuild only the 1 live one.** The Phase 75 audit proved 7 of 8 are dead code (0 external call sites); only `SearchableSelect` is live (via the `UserPicker` facade, 0 direct consumers). This reinterprets ACET-01's literal "8 rebuilt" as **7 deleted + 1 rebuilt** — "Aceternity fully gone" is achieved with far less code (KISS/YAGNI), and the success criteria apply to the 1 rebuilt component.
  - **Delete (7 dead):** `FormInputAceternity`, `FormTextareaAceternity`, `FormSelectAceternity`, `FormCheckboxAceternity`, `FormRadioAceternity`, `FormFieldWithValidation`, `SmartInput` — all in `frontend/src/components/forms/`. Remove their barrel exports (`forms/index.ts` exports all 8 but nothing imports the barrel) and any dead tests/stories.
  - **Rebuild (1 live):** `SearchableSelect` on HeroUI v3/Radix primitives, **preserving the `UserPicker` facade** (external API unchanged; internals free). It has a full ARIA combobox (cmdk + Radix Popover), `role="alert"`, 12 explicit ARIA attributes — all must be preserved and verified by keyboard traversal + axe (not visual diff).

### Success criteria (reinterpreted for the delete-7/rebuild-1 scope)

- The **rebuilt** SearchableSelect announces validation errors (`role="alert"`/`aria-live`) on invalid submit in EN and AR, matching the Phase 75 captured contract.
- Keyboard focus order and `aria-invalid`/`aria-describedby` preserved on the rebuilt component (keyboard + axe).
- `@aceternity-pro` registry entry removed from `components.json`; **no Aceternity import remains** and the inverted `no-restricted-imports` ban stays green. Deletion of the 7 makes this trivially true for them; confirm 0 remaining `variant="aceternity"` / `motion/react`-Aceternity references repo-wide.

### Claude's Discretion

The rebuild's internal primitive choices (HeroUI v3 ComboBox vs Radix Popover + cmdk retention), deletion order, and test structure are the planner's/executor's discretion — provided the UserPicker facade contract and the Phase 75 captured ARIA/validation contract for SearchableSelect are preserved.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Phase 75 behavioral-contract artifact: `.planning/phases/75-ui-component-migration-audit/75-AUDIT-aceternity-contracts.md` — per-component RHF/Zod/ARIA/keyboard-focus contracts + the liveness evidence (symbol-level greps). This is the rebuild spec for SearchableSelect and the deletion warrant for the 7.
- HeroUI v3.2.1 (post-Phase-78) primitives are the rebuild target; HeroUI Pro catalog mapping in [[reference_heroui_pro_catalog_v8_mapping]] (Native Select/Radio Group/ComboBox candidates — though only SearchableSelect is actually rebuilt now).

### Established Patterns

- "Aceternity" here = a `variant="aceternity"` style + `motion/react` usage, NOT a library import — so removal is component deletion + registry-entry removal, not an uninstall.
- `SearchableSelect` is live ONLY behind `UserPicker` (0 direct call sites) — the facade is the contract boundary to preserve.
- The `forms/index.ts` barrel exports all 8 names but nothing imports the barrel (verified Phase 75) — safe to prune.

### Integration Points

- The inverted `no-restricted-imports` ESLint ban must stay green post-removal (ACET-02).
- Bundle Size Check is a REQUIRED CI gate — deleting 7 components + motion/react usage should reduce bundle; verify size-limit stays green (see [[project_bundle_size_required_check_budgets]]).
- Phase 77 Linear tokens + Phase 76 RTL infra are stable — the rebuilt SearchableSelect must use Linear tokens + logical properties (no raw hex, `role="alert"` announces in AR too).

</code_context>

<specifics>
## Specific Ideas

- Preserve the `UserPicker` public API exactly — it's the only live consumer path; its callers must not change.
- Verify accessibility by keyboard traversal + axe, NOT visual diff (per success criteria).
- After deletion, grep repo-wide for any lingering `aceternity` reference (imports, `variant="aceternity"`, registry, comments) to prove "fully gone."

</specifics>

<deferred>
## Deferred Ideas

None — the one genuine scope decision (delete-7 vs rebuild-8) was captured from the user; ACET-01/02 otherwise prescribe the work.

</deferred>
