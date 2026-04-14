# Technology Stack

**Project:** Intl-Dossier v5.0 -- Type-Specific Dossier Creation Wizards
**Researched:** 2026-04-14

## Recommended Stack

No new dependencies. This milestone is a structural refactoring using existing tools.

### Core Framework (existing, unchanged)

| Technology      | Version     | Purpose                            | Why                                            |
| --------------- | ----------- | ---------------------------------- | ---------------------------------------------- |
| React           | 19+         | UI rendering                       | Already in use                                 |
| TypeScript      | 5.9+ strict | Type safety                        | Already in use                                 |
| TanStack Router | v5          | File-based routing, code splitting | Already in use; add 8 `create.tsx` route files |
| TanStack Query  | v5          | Server state, mutations            | Already in use for `useCreateDossier`          |

### Form Management (existing, unchanged)

| Technology          | Version | Purpose               | Why                                                               |
| ------------------- | ------- | --------------------- | ----------------------------------------------------------------- |
| react-hook-form     | latest  | Form state management | Already in use; generic type parameter enables per-type schemas   |
| @hookform/resolvers | latest  | Zod integration       | Already in use via `zodResolver`                                  |
| Zod                 | latest  | Schema validation     | Already in use; split into per-type schemas extending shared base |

### UI Components (existing, unchanged)

| Technology    | Version | Purpose                        | Why                                                                 |
| ------------- | ------- | ------------------------------ | ------------------------------------------------------------------- |
| FormWizard    | custom  | Multi-step wizard UI           | Already built in `components/ui/form-wizard.tsx`; no changes needed |
| useFormDraft  | custom  | localStorage draft persistence | Already built; parameterize draft key per type                      |
| DossierPicker | custom  | Relationship selector          | Already built in `components/work-creation/DossierPicker.tsx`       |
| AIFieldAssist | custom  | AI-powered field pre-fill      | Already built; accepts `dossierType` prop                           |
| HeroUI v3     | beta    | Base UI components             | Already in use via shadcn re-export pattern                         |

### Supporting (existing, unchanged)

| Technology    | Version | Purpose                | Why                                    |
| ------------- | ------- | ---------------------- | -------------------------------------- |
| i18next       | latest  | Bilingual translations | Already in use; add keys for new steps |
| Framer Motion | latest  | Step transitions       | Already in FormWizard                  |
| Lucide React  | latest  | Icons                  | Already in use for step indicators     |

## Alternatives Considered

| Category     | Recommended            | Alternative       | Why Not                                                                       |
| ------------ | ---------------------- | ----------------- | ----------------------------------------------------------------------------- |
| Form library | react-hook-form (keep) | Formik            | Already invested; RHF has better TS generics for per-type schemas             |
| Validation   | Zod (keep)             | Yup               | Already invested; Zod discriminated unions are ideal for this refactoring     |
| Wizard UI    | FormWizard (keep)      | react-step-wizard | Custom FormWizard already has RTL, draft, a11y support                        |
| Routing      | TanStack Router (keep) | React Router      | Already invested; file-based routing naturally supports per-type `create.tsx` |

## Installation

```bash
# No new packages needed
# All dependencies already installed
```

## Key Technical Notes

1. **Generic hook pattern**: `useCreateDossierWizard<T extends z.ZodType>(config)` uses TypeScript generics so each wizard gets exact form types
2. **Code splitting**: Each `create.tsx` route file uses `React.lazy()` for the wizard page component
3. **Schema composition**: `baseFields.extend()` pattern in Zod creates per-type schemas without duplication
4. **Draft key namespacing**: `dossier-create-{type}` prevents cross-type draft contamination

## Sources

- `package.json` analysis for existing dependencies
- `components/ui/form-wizard.tsx` for FormWizard capabilities
- `hooks/useAIFieldAssist.ts` for AI assist interface
- `components/work-creation/DossierPicker.tsx` for relationship picker
