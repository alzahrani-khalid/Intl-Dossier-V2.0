# Research Summary: Intl-Dossier v5.0 Type-Specific Creation Wizards

**Domain:** Wizard architecture refactoring for diplomatic dossier creation
**Researched:** 2026-04-14
**Overall confidence:** HIGH

## Executive Summary

The current DossierCreateWizard.tsx (296 LOC) uses a monolithic approach: one flat Zod schema carrying all 7 types extension fields, a TypeSelectionStep eliminated by knowing the type at route entry, a TypeSpecificStep mounting all 7 field components behind ConditionalField wrappers, and a ReviewStep with 7 inline type-branch blocks. This creates poor TypeScript narrowing, unnecessary validation overhead, and a generic UX.

The recommended refactoring uses compositional wizards with shared infrastructure: extract common logic into a useCreateDossierWizard hook and CreateWizardShell, then compose 8 type-specific wizard configurations with per-type Zod schemas, steps, and review renderers. Per-type routes enable code splitting, direct entry from list pages, and clean URLs.

The elected official wizard is a person variant (person_subtype: elected_official) with office/term/party steps. Relationship linking happens as a post-create API call. All existing features (FormWizard, useFormDraft, AIFieldAssist, duplicate detection, DossierPicker) are preserved unchanged.

## Key Findings

**Stack:** No new dependencies -- uses existing react-hook-form, Zod, TanStack Router/Query, FormWizard
**Architecture:** Compositional wizards with shared hook + per-type configs + per-type routes
**Critical pitfall:** Must build shared infrastructure (hook, shell, base schema) before any type-specific wizard

## Implications for Roadmap

1. **Shared Infrastructure** - Extract hook, shell, base schema from existing wizard
   - Addresses: Code reuse, TypeScript narrowing, schema separation
   - Avoids: Duplication across 8 wizards

2. **First Wizard (Country)** - Simplest type, proves the pattern
   - Addresses: Route structure, code splitting, feature preservation
   - Avoids: Big-bang migration risk

3. **Simple Types (Org, Topic, Person)** - Same pattern, parallel work possible
   - Addresses: 3 more types with minimal new complexity

4. **Complex Types (Engagement, Forum, Working Group)** - Relationship pickers
   - Addresses: Participant linking, organizing body, parent body

5. **Elected Official Variant** - Person extension with office/term
   - Addresses: Person subtype pattern, extra steps

6. **Hub + Cleanup** - CreateDossierHub, delete old code, update all links
   - Addresses: Migration completion, dead code removal

**Phase ordering rationale:**

- Phase 1 first: all 8 wizards depend on shared hook/shell/schema
- Phase 2 validates pattern with simplest type before scaling
- Phases 3-5 can partially overlap but person must precede elected official
- Phase 6 cleanup only after all 8 per-type routes work

**Research flags:**

- Phase 4: May need deeper research on relationship API (post-create linking)
- Phase 5: Elected official extension_data fields need backend API verification

## Confidence Assessment

| Area         | Confidence | Notes                                           |
| ------------ | ---------- | ----------------------------------------------- |
| Stack        | HIGH       | No new dependencies, all tools already in use   |
| Features     | HIGH       | Direct analysis of existing wizard code         |
| Architecture | HIGH       | Pattern proven by existing codebase conventions |
| Pitfalls     | HIGH       | Based on actual code structure analysis         |

## Gaps to Address

- Relationship linking API: verify linkDossierRelationships endpoint exists or needs creation
- Elected official creation: verify dossiers-create Edge Function handles person_subtype
- Draft migration: existing localStorage drafts use old schema format
