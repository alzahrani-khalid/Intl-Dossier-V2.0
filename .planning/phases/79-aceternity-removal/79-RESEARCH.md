# Phase 79: Aceternity Removal - Research

**Researched:** 2026-07-03
**Domain:** React component deletion + accessible combobox rebuild (cmdk/Radix/HeroUI v3, Linear tokens, jest-axe/Playwright verification)
**Confidence:** HIGH (all claims verified against live repo state on 2026-07-03; zero external packages involved)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Aceternity scope (USER DECISION — 2026-07-03):**

- **Delete the 7 dead components, rebuild only the 1 live one.** The Phase 75 audit proved 7 of 8 are dead code (0 external call sites); only `SearchableSelect` is live (via the `UserPicker` facade, 0 direct consumers). This reinterprets ACET-01's literal "8 rebuilt" as **7 deleted + 1 rebuilt** — "Aceternity fully gone" is achieved with far less code (KISS/YAGNI), and the success criteria apply to the 1 rebuilt component.
  - **Delete (7 dead):** `FormInputAceternity`, `FormTextareaAceternity`, `FormSelectAceternity`, `FormCheckboxAceternity`, `FormRadioAceternity`, `FormFieldWithValidation`, `SmartInput` — all in `frontend/src/components/forms/`. Remove their barrel exports (`forms/index.ts` exports all 8 but nothing imports the barrel) and any dead tests/stories.
  - **Rebuild (1 live):** `SearchableSelect` on HeroUI v3/Radix primitives, **preserving the `UserPicker` facade** (external API unchanged; internals free). It has a full ARIA combobox (cmdk + Radix Popover), `role="alert"`, 12 explicit ARIA attributes — all must be preserved and verified by keyboard traversal + axe (not visual diff).

**Success criteria (reinterpreted for the delete-7/rebuild-1 scope):**

- The **rebuilt** SearchableSelect announces validation errors (`role="alert"`/`aria-live`) on invalid submit in EN and AR, matching the Phase 75 captured contract.
- Keyboard focus order and `aria-invalid`/`aria-describedby` preserved on the rebuilt component (keyboard + axe).
- `@aceternity-pro` registry entry removed from `components.json`; **no Aceternity import remains** and the inverted `no-restricted-imports` ban stays green. Deletion of the 7 makes this trivially true for them; confirm 0 remaining `variant="aceternity"` / `motion/react`-Aceternity references repo-wide.

### Claude's Discretion

The rebuild's internal primitive choices (HeroUI v3 ComboBox vs Radix Popover + cmdk retention), deletion order, and test structure are the planner's/executor's discretion — provided the UserPicker facade contract and the Phase 75 captured ARIA/validation contract for SearchableSelect are preserved.

### Deferred Ideas (OUT OF SCOPE)

None — the one genuine scope decision (delete-7 vs rebuild-8) was captured from the user; ACET-01/02 otherwise prescribe the work.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                                                                                                                                                                                                              | Research Support                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ACET-01 | The 8 Aceternity-based form components are rebuilt on HeroUI v3/Radix primitives, preserving existing RHF validation, ARIA, and keyboard-focus behavior — **reinterpreted per locked user decision as: delete the 7 dead, rebuild the 1 live (`SearchableSelect`) preserving the UserPicker facade + Phase 75 contract** | "Deletion Safety" section (per-component 0-call-site evidence, orphan-dependency map, i18n namespace hazard); "The Rebuild: Recommendation" (keep cmdk + Radix Popover, strip variant/motion/shadow literals); "ARIA/Validation Contract Checklist" (the 12 attributes + keyboard contract as verifiable checklist); "Validation Architecture" (jest-axe + keyboard-traversal test structure, EN/AR) |
| ACET-02 | The `@aceternity-pro` registry entry is removed from `components.json`                                                                                                                                                                                                                                                   | "Registry Removal + Fully-Gone Proof" section: exact `components.json` edit (`frontend/components.json` lines 20–22 — the `registries` block contains ONLY the `@aceternity-pro` entry), ESLint ban location (`eslint.config.mjs` lines 124–162, root), and the exact grep patterns that must return 0 post-removal                                                                                  |

</phase_requirements>

## Summary

This phase is a **surgical deletion + restyle**, not a greenfield rebuild. Fresh greps (2026-07-03) re-confirm the Phase 75 audit: the 7 dead components have **zero external call sites**; `SearchableSelect` is live only behind `UserPicker` (4 production consumers + 1 test stub that `vi.doMock`s the module path). There are **no dead test or story files** for any of the 8 — nothing to delete beyond the components, their barrel entries, and one newly-orphaned hook.

The critical architectural finding: **the current `SearchableSelect` already sits on HeroUI v3 + Radix primitives.** Post-Phase 78, `@/components/ui/button` re-exports `HeroUIButton`, and the popover is `@radix-ui/react-popover`; cmdk supplies the listbox internals. HeroUI v3.2.1 does ship a `ComboBox` (verified in `node_modules/@heroui/react/dist/components/combo-box/`), but it is built on React Aria Components' **input-based** combobox — `role="combobox"` lives on a text input, filtering happens in the field itself. That pattern structurally **cannot reproduce** the Phase 75 captured contract (combobox role on a trigger _Button_, `aria-haspopup="listbox"`, focus jump to a search input on open, Escape returning focus to the trigger). Since success criterion 2 demands the keyboard focus order be _preserved_, and cmdk + Radix Popover are already bundled with 6 other live consumers (zero new bytes), the low-risk path is unambiguous: **keep the cmdk + Radix Popover internals; delete the `variant` prop, the hard-coded rgba shadow literals, and the `motion/react` usage; verify with axe + keyboard tests.**

One contract hazard needs empirical resolution during execution: the clear affordance is a `<span role="button">` **nested inside** the trigger `<Button>` — axe's `nested-interactive` rule (serious) will likely flag it. The audit treats such gaps as "preserve-or-improve"; the fix (move the clear affordance to a focusable sibling of the trigger, keeping its `aria-label`) preserves the affordance while making the axe gate pass.

**Primary recommendation:** Delete the 7 + prune the barrel + delete the newly-orphaned `useFieldValidation` hook; restyle `SearchableSelect` in place (remove `variant`/shadows/motion, keep every ARIA attribute and the focus contract verbatim); remove the `registries` block from `frontend/components.json`; prove "fully gone" with the grep battery below; gate with a new colocated jest-axe + keyboard-traversal test file (EN + AR) and a local `size-limit` run.

## Project Constraints (from CLAUDE.md)

Directives that bind this phase (root `CLAUDE.md` + `frontend/CLAUDE.md`):

1. **GSD workflow enforcement** — work enters via `/gsd:execute-phase`; no direct repo edits outside GSD.
2. **Design system = Linear, dark-canonical** — all colors via `var(--*)` tokens or `@theme`-mapped utilities; no raw hex; no Tailwind palette literals; radii from `--radius-sm/--radius/--radius-lg` (6/8/12); no card shadows; no gradients. The aceternity shadow literals in `SearchableSelect` (lines 392–398) violate this today — deleting the variant resolves it.
3. **Primitive cascade** — HeroUI v3 → Radix → build-it-yourself. Aceternity/Kibo/shadcn-defaults banned (ESLint-enforced, root `eslint.config.mjs`).
4. **RTL logical properties only** — `ms-*`/`me-*`/`ps-*`/`pe-*`/`text-start`; ESLint errors on physical classes. Current `SearchableSelect` complies (`ms-2`, `me-2`, `text-start`); the rebuild must not regress.
5. **Bundle Size Check is a REQUIRED CI gate** — `frontend/.size-limit.json`; note the **`heroui-vendor` chunk budget is only 9 KB gzip** (vite `manualChunks` routes all `@heroui` module ids there — `vite.config.ts` line 163).
6. **Explicit function return types; no `any`; strict-boolean-expressions; semicolons off; single quotes** — repo ESLint/Prettier config.
7. **Per-directory filename case** — `components/**` PascalCase, `__tests__/**` exempt; CI lints the whole repo (`--max-warnings 0`) even though pre-commit only lints staged files.
8. **No emoji, no marketing voice** in user-visible copy.
9. **Backwards compatibility** — all existing features must keep working; UserPicker's 4 consumers must not change.
10. **Protected main** — direct push blocked; merge via PR with 8 required checks (incl. Bundle Size Check, Lint); pre-commit hook runs `pnpm build` on every commit.

## Architectural Responsibility Map

| Capability                                 | Primary Tier                                       | Secondary Tier                      | Rationale                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Component deletion (7 dead + barrel prune) | Browser/Client (frontend source)                   | —                                   | Pure frontend dead code; no API, DB, or runtime state involved (verified: 0 aceternity refs in `supabase/` or `backend/src`) |
| SearchableSelect rebuild (ARIA combobox)   | Browser/Client (frontend component)                | —                                   | Client-side interaction pattern; RHF/Zod validation binding stays in consumer forms                                          |
| UserPicker user search                     | Browser/Client                                     | Database (Supabase PostgREST reads) | Facade queries `users` table client-side via supabase-js; unchanged by this phase                                            |
| Registry entry removal                     | Build/tooling config                               | —                                   | `components.json` is a shadcn-CLI config consumed at scaffold time only, not at runtime                                      |
| Import ban enforcement                     | CI / lint tier                                     | —                                   | Root `eslint.config.mjs` `no-restricted-imports`; verified green by `pnpm lint --max-warnings 0`                             |
| A11y verification                          | Test tier (jsdom unit + optional real-browser e2e) | —                                   | jest-axe (vitest/jsdom) is the CI-gating layer; Playwright + @axe-core/playwright available for real-browser keyboard smoke  |

## Standard Stack

**No new packages are installed in this phase.** Everything needed is already in `frontend/package.json` (verified against the live lockfile-installed `node_modules`):

### Core (already installed — verified 2026-07-03)

| Library                                                   | Version         | Purpose                                                                              | Why Standard                                                                                                                                                                               |
| --------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cmdk` (via `@/components/ui/command`)                    | in-repo wrapper | Listbox/option/`aria-activedescendant` internals of SearchableSelect                 | Already powers 6 other live consumers (CommandPalette, DossierPicker, DossierSelector, TagSelector, WorkCreationPalette, DossierListPage) — zero added bundle weight [VERIFIED: repo grep] |
| `@radix-ui/react-popover` (via `@/components/ui/popover`) | in-repo wrapper | Popover open/close, Escape-returns-focus-to-trigger, `--radix-popover-trigger-width` | Current implementation; Radix qualifies as the cascade's tier 2 [VERIFIED: `ui/popover.tsx` line 2]                                                                                        |
| `@heroui/react`                                           | 3.2.1           | Trigger `Button` (`@/components/ui/button` re-exports `HeroUIButton`)                | Post-Phase-78 primitive; satisfies ACET-01's "HeroUI v3/Radix primitives" by construction [VERIFIED: `ui/button.tsx` + `node_modules/@heroui/react/package.json` 3.2.1]                    |
| `react-hook-form` + `zod`                                 | in repo         | Consumer-side validation (Controller wiring in 3 of 4 UserPicker consumers)          | Unchanged by this phase — validation lives in consumers, not in SearchableSelect [VERIFIED: Phase 75 audit + consumer sources]                                                             |

### Supporting (test/verify tier — already installed)

| Library                                     | Version           | Purpose                                             | When to Use                                                                                                                           |
| ------------------------------------------- | ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest`                                    | ^4.1.7            | Unit/a11y test runner (jsdom, `tests/setup.ts`)     | The CI-gating test layer                                                                                                              |
| `jest-axe`                                  | ^10.0.0           | axe-core assertions in jsdom (`toHaveNoViolations`) | Per-render axe gate; exemplar: `AppShell.a11y.test.tsx`                                                                               |
| `@testing-library/react` + `user-event`     | ^16.3.2 / ^14.6.1 | Keyboard traversal simulation                       | Tab/Arrow/Enter/Escape traversal in jsdom                                                                                             |
| `@playwright/test` + `@axe-core/playwright` | ^1.60.0 / ^4.11.3 | Optional real-browser keyboard + axe smoke          | Follow `qa-sweep-axe.spec.ts` / `qa-sweep-keyboard.spec.ts` patterns; NOT the CI gate (e2e is non-required and targets a running app) |
| `size-limit`                                | in repo           | Bundle budget verification                          | `cd frontend && pnpm build && pnpm exec size-limit` locally before PR                                                                 |

### Alternatives Considered

| Instead of                          | Could Use                                                | Tradeoff                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keep cmdk + Radix Popover internals | HeroUI v3.2.1 `ComboBox` (`@heroui/react/combo-box`)     | **Rejected — see "The Rebuild" section.** RAC input-based combobox cannot preserve the captured keyboard-focus contract (criterion 2); pulls new react-aria combobox machinery into the bundle while the 9 KB gz `heroui-vendor` budget leaves no headroom; changes the UserPicker UX consumers see (button-with-value → text input) |
| Keep cmdk + Radix Popover internals | HeroUI Pro `ComboBox` / Pro Native Select (1.0.0-beta.6) | Rejected for the same structural reasons + Pro is beta with a per-import auth/CI wrinkle; memory `reference_heroui_pro_catalog_v8_mapping` mapped SearchableSelect → OSS ComboBox, which is the option rejected above                                                                                                                |
| Delete `useFieldValidation.ts`      | Leave it orphaned                                        | Deleting FormFieldWithValidation makes the hook's consumer count 0 (verified). Karpathy rule: remove orphans your change creates. Keep-it would leave dead code the phase exists to eliminate                                                                                                                                        |

**Installation:** none. `pnpm install` not required.

## Package Legitimacy Audit

**No external packages are installed by this phase.** All work uses already-installed, already-audited repo dependencies (cmdk, Radix, HeroUI 3.2.1, vitest, jest-axe). slopcheck run: not applicable — zero installs.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Consumer forms (4 live call sites)
  TaskEditDialog ──RHF Controller(assignee_id)──┐
  TaskQuickForm ──RHF Controller(assignee_id)───┤
  OrgDetailsStep ──RHF Controller(focal user)───┼──> UserPicker (FACADE — frozen API)
  AddToDossierDialogs ──useState(assigneeId)────┘      │  props: value, onChange(userId|null),
                                                       │  label, placeholder, error, required,
                                                       │  disabled, className
                                                       │  behavior: users-table load (limit 20)
                                                       │  + 300ms debounced ilike search
                                                       ▼
                                        SearchableSelect (REBUILT IN PLACE)
                                        ┌─────────────────────────────────────┐
                                        │ trigger: HeroUI Button              │
                                        │   role="combobox" aria-controls     │
                                        │   aria-expanded aria-haspopup       │
                                        │   aria-labelledby aria-describedby  │
                                        │   aria-invalid aria-required        │
                                        │      │ click/Enter/Space            │
                                        │      ▼                              │
                                        │ Radix Popover ──open──> focus jumps │
                                        │   to CommandInput (search)          │
                                        │      │ typing → filterOptions()     │
                                        │      │ (shouldFilter=false) +       │
                                        │      │ onSearchChange → async load  │
                                        │      ▼                              │
                                        │ cmdk CommandList id={listboxId}     │
                                        │   (listbox/option/aria-active-      │
                                        │    descendant supplied by cmdk)     │
                                        │      │ Enter selects → onChange     │
                                        │      │ Escape → close + focus back  │
                                        │      ▼                              │
                                        │ error <p role="alert"> (live       │
                                        │   region — announces on appearance) │
                                        └─────────────────────────────────────┘
                                        DELETED from this file: variant prop,
                                        aceternityTriggerClasses (rgba shadow
                                        literals), motion/react (m, Animate-
                                        Presence — decoration only)
```

### Recommended Project Structure (after the phase)

```
frontend/src/components/forms/
├── SearchableSelect.tsx        # rebuilt in place — no variant, no motion, Linear tokens
├── UserPicker.tsx              # UNTOUCHED (facade; module path preserved for vi.doMock)
├── __tests__/
│   └── SearchableSelect.a11y.test.tsx   # NEW — axe + keyboard + EN/AR role="alert" (Wave 0)
├── index.ts                    # pruned: 7 dead exports removed (SearchableSelect export may stay)
├── (deleted) FormInputAceternity.tsx, FormTextareaAceternity.tsx,
│             FormSelectAceternity.tsx, FormCheckboxAceternity.tsx,
│             FormRadioAceternity.tsx, FormFieldWithValidation.tsx, SmartInput.tsx
└── ... (all other forms files untouched)

frontend/src/hooks/
└── (deleted) useFieldValidation.ts   # orphaned by FormFieldWithValidation deletion (verified: 0 other consumers)
```

### The Rebuild: Recommendation (Key Question 1)

**Recommendation: KEEP the Radix Popover + cmdk internals. Do NOT migrate to HeroUI ComboBox.** The "rebuild" is: delete the `variant` prop + `aceternityTriggerClasses` + all `motion/react` usage from `SearchableSelect.tsx`, keep every ARIA attribute and focus behavior verbatim, and normalize styling to canonical Linear tokens.

Rationale (each point verified this session):

1. **Contract fidelity is the success criterion.** HeroUI v3.2.1's ComboBox (verified in `node_modules/@heroui/react/dist/components/combo-box/combo-box.d.ts`) is built on `react-aria-components` `ComboBox` — an **input-based** combobox: `role="combobox"` sits on an always-visible text `<Input>`, filtering happens as you type in the field, and `ComboBoxTrigger` is a small adjacent button. The captured Phase 75 contract is the **button-trigger pattern**: `role="combobox"` on the trigger `Button`, `aria-haspopup="listbox"`, _focus moves into a popover search input on open_, and _Escape returns focus to the trigger_. Success criterion 2 says keyboard focus order must be **preserved** — RAC ComboBox cannot structurally satisfy that. [VERIFIED: combo-box.d.ts imports `ComboBox as ComboBoxPrimitive from 'react-aria-components/ComboBox'`]
2. **Zero bundle risk vs. real bundle risk.** cmdk + Radix Popover are already shipped (6 other live consumers of `@/components/ui/command`). HeroUI ComboBox would put its wrapper in the `heroui-vendor` chunk — **budgeted at 9 KB gzip, a REQUIRED CI gate** — and pull new react-aria combobox/listbox/overlay machinery into other chunks. The keep-cmdk path is bundle-neutral for the rebuild and net-negative overall (7 deleted components + removed motion usage). [VERIFIED: `.size-limit.json` + `vite.config.ts` line 163]
3. **ACET-01's letter is already satisfied.** Post-Phase-78, the trigger is a HeroUI v3 Button (`ui/button.tsx` re-exports `HeroUIButton`) and the popover is Radix — the component is already "on HeroUI v3/Radix primitives". The only Aceternity residue is the `variant` prop, two hard-coded rgba `box-shadow` literals, and decorative motion. [VERIFIED: source read]
4. **UserPicker UX continuity.** Consumers render a button showing the selected user's name; an input-based combobox would change what users see and how forms lay out — a visual/behavioral regression risk this phase has no mandate to take.

**In-place restyle checklist for `SearchableSelect.tsx`:**

- Remove `variant?: 'default' | 'aceternity'` from props (line 92), `aceternityTriggerClasses` (392–398), the `triggerClasses` ternary (400) — keep `triggerBaseClasses`.
- Remove `import { m, AnimatePresence } from 'motion/react'` (line 9); convert `m.label` → `label`, the two `m.p` (help, error) → plain `<p>` with the same `id`/`role`/classNames, and drop `AnimatePresence`. Element insertion still triggers the `role="alert"` announcement — motion was decoration (audit: animation-only = non-contractual). Keep the chevron rotation — it is a CSS `transition-transform`, not motion/react.
- Token normalization (all already `@theme`-mapped to Linear tokens — `--color-muted-foreground: var(--ink-mute)`, `--color-primary: var(--accent)`, `--color-background: var(--bg)`, `--color-muted: var(--surface)` in `src/index.css` lines 101–117 — so this is optional polish, not a compliance blocker; prefer canonical utilities like `text-ink-mute` where touched anyway).
- Optional simplification (planner discretion per CONTEXT): `multiple`, `creatable`, `groupBy`, `renderOption`, `renderValue`, `maxDisplayed` are unused by UserPicker (the only consumer). KISS argues for trimming; surgical-change argues for leaving. Either is contract-safe — the facade never exposes them. If trimmed, delete the now-unused `OptionGroup`/`groupOptions` too and prune the barrel's `OptionGroup` type export.

### The UserPicker Facade Contract (Key Question 2)

**Frozen public API** (`frontend/src/components/forms/UserPicker.tsx`, lines 13–22 — verified byte-current):

```ts
export interface UserPickerProps {
  value?: string // single user id
  onChange?: (userId: string | null) => void // consumers rely on `?? ''` coalescing
  label?: string
  placeholder?: string
  error?: string // resolved string, NOT FieldError
  required?: boolean
  disabled?: boolean
  className?: string
}
```

**Behavior consumers depend on (unchanged):** on-mount load of `users` (`is_active = true`, `order full_name`, `limit 20`); 300 ms-debounced `full_name/email ilike` search via `onSearchChange` (min 2 chars); rows mapped to `{ value: id, label: full_name||email||id, description: email, icon: avatar <img> }`; single-select narrowing (`typeof val === 'string' ? val : null`).

**SearchableSelect props UserPicker passes through** (the minimum surface the rebuild must keep): `options`, `value`, `onChange`, `onSearchChange`, `label`, `placeholder`, `searchPlaceholder`, `error`, `required`, `disabled`, `loading`, `className`.

**Live consumers (fresh grep 2026-07-03 — identical to Phase 75):**
| Consumer | Binding |
|----------|---------|
| `frontend/src/components/tasks/TaskEditDialog.tsx` | RHF `Controller` on `assignee_id`; error via RHF `<FormMessage>`, not the `error` prop |
| `frontend/src/components/dossier/AddToDossierDialogs.tsx` | `useState` — `onChange={(userId) => setAssigneeId(userId ?? '')}`; binds `label`, `placeholder`, `required`, `className` |
| `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` | RHF `Controller` — `onChange={(id) => field.onChange(id ?? '')}` |
| `frontend/src/components/work-creation/forms/TaskQuickForm.tsx` | RHF `Controller` on `assignee_id` — `onChange={(userId) => field.onChange(userId ?? '')}` |

**Module-path constraint:** `frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx` (lines 245, 346) `vi.doMock('@/components/forms/UserPicker', ...)` — the file path AND the named export `UserPicker` must survive the phase or that test breaks. Do not move or rename the file.

### The ARIA/Validation Contract Checklist (Key Question 3)

The 12 explicit ARIA occurrences in `SearchableSelect.tsx` (line numbers verified against current source; each is a MUST-preserve assertion for the test file):

| #   | Attribute/role                 | Element                  | Line | Assertion                                                                                         |
| --- | ------------------------------ | ------------------------ | ---- | ------------------------------------------------------------------------------------------------- |
| 1   | `role="combobox"`              | trigger Button           | 434  | `getByRole('combobox')` resolves to the trigger                                                   |
| 2   | `aria-controls={listboxId}`    | trigger                  | 435  | equals the `CommandList` `id` (line 489)                                                          |
| 3   | `aria-expanded={open}`         | trigger                  | 436  | `false` closed → `true` open                                                                      |
| 4   | `aria-haspopup="listbox"`      | trigger                  | 437  | literal                                                                                           |
| 5   | `aria-labelledby` → label id   | trigger                  | 438  | present iff `label` prop set; points at `{selectId}-label`                                        |
| 6   | `aria-describedby`             | trigger                  | 439  | space-joined `[errorId, helpId]`, filtered to active ones (line 381)                              |
| 7   | `aria-invalid={!!error}`       | trigger                  | 440  | `true` when `error` set                                                                           |
| 8   | `aria-required={required}`     | trigger                  | 441  | `true` when required                                                                              |
| 9   | `role="button"`                | clear affordance span    | 450  | present when a value is selected — **see nested-interactive hazard (Pitfall 1)**                  |
| 10  | `aria-label` (clear)           | clear affordance         | 451  | `t('smart-input:select.clear')`                                                                   |
| 11  | `aria-label` (required marker) | `*` span in label        | 420  | `t('common:validation.required')`                                                                 |
| 12  | `role="alert"`                 | error `<p id={errorId}>` | 564  | **the live region** — error announces on appearance; `id` must equal the errorId referenced by #6 |

Plus (supplied by cmdk internally, not literal in the file): `role="listbox"` on `CommandList id={listboxId}`, `role="option"`/`aria-selected` on items, `aria-activedescendant` tracking on the search input. These come for free by keeping cmdk; assert `getByRole('listbox')` exists when open.

**Keyboard/focus contract (MUST-preserve, from source + Phase 75 audit):**

1. Trigger opens on click / Enter / Space.
2. On open, focus moves to the search input (`useEffect` → `inputRef.current?.focus()` after 0 ms timeout, lines 287–293).
3. ArrowUp/ArrowDown move the active option (cmdk-managed `aria-activedescendant`).
4. Enter selects → `onChange` fires; single-select closes the popover and clears the query.
5. Escape closes the popover and returns focus to the trigger (Radix Popover behavior).
6. Type-ahead: `Command shouldFilter={false}` — typing drives `searchQuery` → local `filterOptions` fuzzy match over label/value/description AND fires `onSearchChange` (UserPicker's async search).

**RHF/Zod integration (unchanged — lives in consumers):** `error` is a resolved `string` prop (not `FieldError`); RHF binding is via consumer `Controller`s mapping `field.value`/`field.onChange` through UserPicker. Zod schemas validate the selected user id (`assignee_id`) at the consumer. No change to any consumer is permitted.

**RTL contract:** chevron `isRTL && 'rotate-180'` (+ `open && 'rotate-180'`), logical `ms-2`/`me-2`, `text-start` on label/help/error, popover width `--radix-popover-trigger-width`, `align="start"`.

### Deletion Safety for the 7 (Key Question 4)

Fresh symbol-level greps (2026-07-03) reproduce the Phase 75 result exactly — evidence command:

```bash
for c in FormInputAceternity FormTextareaAceternity FormSelectAceternity \
         FormCheckboxAceternity FormRadioAceternity FormFieldWithValidation \
         SearchableSelect SmartInput; do
  echo -n "$c: "
  grep -rl "\b$c\b" --include="*.tsx" --include="*.ts" frontend/src tests 2>/dev/null \
    | grep -v "frontend/src/components/forms/" | wc -l | tr -d ' '
done
```

All 8 → `0` external call sites, with ONE benign new match this session: `frontend/src/i18n/index.ts` matches the `SmartInput` symbol only via the import identifiers `enSmartInput`/`arSmartInput` (the `smart-input` namespace registration — see the i18n hazard below). It is not a component import.

| To delete                     | External importers | Dead tests/stories | Notes                                                  |
| ----------------------------- | ------------------ | ------------------ | ------------------------------------------------------ |
| `FormInputAceternity.tsx`     | 0                  | none exist         | barrel-only                                            |
| `FormTextareaAceternity.tsx`  | 0                  | none exist         | barrel-only                                            |
| `FormSelectAceternity.tsx`    | 0                  | none exist         | barrel-only                                            |
| `FormCheckboxAceternity.tsx`  | 0                  | none exist         | barrel-only                                            |
| `FormRadioAceternity.tsx`     | 0                  | none exist         | barrel-only                                            |
| `FormFieldWithValidation.tsx` | 0                  | none exist         | orphans `useFieldValidation` (below)                   |
| `SmartInput.tsx`              | 0                  | none exist         | do NOT delete the `smart-input` i18n namespace (below) |

**No test or story files exist for any of the 8** — verified: `find ... -name "*.test.*" | xargs grep -l <names>` → empty; `find frontend/src -name "*.stories.*"` → empty. "Any dead tests/stories" in CONTEXT resolves to: nothing to do.

**Barrel (`frontend/src/components/forms/index.ts`):** exports all 8 + ~12 other live-ish components; **nothing imports the barrel** (re-verified: `grep -rln "from '@/components/forms'"` excluding the forms dir → 0). Prune the 7 dead export blocks (lines 17–22, 24–28, 56–62). The `SearchableSelect` export block (64–70) may stay (harmless) or be pruned to just the component + `SelectOption` type; if props are trimmed, drop `OptionGroup` from it.

**Orphan-dependency map (what the deletions newly orphan):**

- `frontend/src/hooks/useFieldValidation.ts` — sole consumer is `FormFieldWithValidation.tsx` (verified). **Delete it in the same wave** (orphan created by this phase's change). It has no tests.
- `frontend/src/lib/validation-rules.ts` — **KEEP.** Live consumers beyond the deleted set: `types/actionable-error.types.ts`, `hooks/useActionableErrors.ts`, `components/forms/ValidationIndicator.tsx`.
- `frontend/src/components/forms/ValidationIndicator.tsx` — **KEEP (out of scope).** It was already effectively dead (barrel + FormFieldWithValidation only), but it is NOT in the user's delete-7 list. Mention in the PR as pre-existing dead code; do not delete (Karpathy: don't remove pre-existing dead code unless asked).

**i18n hazard (do NOT break the live component):** the `smart-input` namespace (`src/i18n/{en,ar}/smart-input.json`, registered in `src/i18n/index.ts` lines 125–126/330/464) is shared: SmartInput (dead) uses `labels/placeholders/helpText/keyboard.*`; **SearchableSelect (live) uses `select.placeholder/search/empty/clear/create/showingCount`** — verified present in BOTH en and ar (lines 66–78 of each). **Keep the namespace and its registration untouched.** Optionally the SmartInput-specific keys could be pruned, but that is scope creep — leave them.

### Registry Removal + Fully-Gone Proof (Key Question 5 — ACET-02)

**`components.json` edit:** `frontend/components.json` — the `registries` object (lines 20–22) contains **exactly one entry**: `"@aceternity-pro": "https://pro.aceternity.com/registry/{name}.json"`. Remove the entire `registries` block (keep `"rtl": true` and everything else).

**ESLint ban location (must stay green, untouched):** root `eslint.config.mjs`, `no-restricted-imports` at lines 124–162 — bans `aceternity-ui`, `kibo-ui` (paths) and `aceternity-ui/*`, `@aceternity/*`, `kibo-ui/*`, `@kibo-ui/*`, `@/components/kibo-ui/*`, `@/components/ui/3d-card|bento-grid|floating-navbar|link-preview` (patterns). Deletion cannot break it; `pnpm lint --max-warnings 0` (whole repo, CI-equivalent) proves green.

**Grep battery — each MUST return 0 matches post-removal** (run from repo root):

```bash
# 1. No Aceternity-variant usage anywhere (currently 40 matches, ALL inside the 8 files)
grep -rn "variant=[\"']aceternity\|'aceternity'" frontend/src tests --include="*.tsx" --include="*.ts"

# 2. No *Aceternity-named component symbol survives
grep -rn "Aceternity" frontend/src tests --include="*.tsx" --include="*.ts"

# 3. Registry entry gone
grep -n "aceternity" frontend/components.json

# 4. No aceternity library import anywhere (belt over the ESLint braces)
grep -rn "from ['\"]aceternity\|from ['\"]@aceternity" frontend/src tests --include="*.tsx" --include="*.ts"

# 5. The deleted files are gone
ls frontend/src/components/forms/ | grep -i "aceternity\|SmartInput\|FormFieldWithValidation"
```

Note on `motion/react`: it is imported by ~36 files repo-wide and is NOT the Aceternity discriminator (Phase 75 audit). The only _Aceternity-specific_ motion usage is inside the 8 files — deleting 7 + stripping motion from `SearchableSelect` zeroes it. Do NOT grep-ban `motion/react` globally.

**Comment/doc residue found this session (the "fully gone" gray zone — planner should include a small cleanup task):**

| Location                                                                                                                                                                                                    | What                                                                                                                                                               | Suggested action                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/.aceternity/` (10 git-tracked .md files)                                                                                                                                                          | Legacy Aceternity migration docs (MIGRATION_MAP, PHASE1/2_PROGRESS, INSTALLATION_NOTES, …)                                                                         | **Delete the directory** — docs-only, zero code risk, directly contradicts "fully gone"                                                                                                                                    |
| `frontend/README.md` lines 52, 291                                                                                                                                                                          | Stale: tree comment "shadcn/ui + Aceternity UI components"; "**Aceternity UI** (primary): https://ui.aceternity.com" listed as primary component library           | **Edit both lines** — line 291 actively contradicts the CLAUDE.md ban                                                                                                                                                      |
| `frontend/src/components/ui/timeline.tsx` line 35                                                                                                                                                           | Aceternity demo marketing copy inside a component ("I've been working on Aceternity for the past 2 years…") — file has **0 importers** (dead, this session's grep) | Flag to planner: dead file with Aceternity content. Minimal action = none (out of ACET scope); clean action = delete the dead file. Planner's call — deleting is low-risk (0 importers) but expands the user's delete list |
| `frontend/src/components/timeline/UnifiedVerticalTimeline.tsx` line 9, `EnhancedVerticalTimelineCard.tsx` line 5, `dossier/ExpandableDossierCard.tsx` line 3, `routes/_protected/dossiers/index.tsx` line 6 | "Aceternity-inspired"/"Aceternity UI inspired" doc comments in LIVE files                                                                                          | **Reword the 4 comments** (e.g. "expandable-card behavior") — one-line edits, no code change                                                                                                                               |
| `.archive/**`, `frontend/.archive/**`                                                                                                                                                                       | Historical spec docs mention Aceternity                                                                                                                            | Leave — archived history, not live surface                                                                                                                                                                                 |
| `frontend/src/.understand-anything/`, `graphify-out/`                                                                                                                                                       | Generated graph caches contain the strings                                                                                                                         | Leave — git-ignored/generated; regenerate after the phase (`graphify update .`)                                                                                                                                            |

If the planner adopts the comment cleanup, the strict repo proof becomes: `grep -rni "aceternity" frontend/src --include="*.tsx" --include="*.ts"` → 0 (excluding nothing). Without it, scope the grep to the code patterns in the battery above.

## Don't Hand-Roll

| Problem                                                                  | Don't Build                 | Use Instead                                                       | Why                                                                                                                                             |
| ------------------------------------------------------------------------ | --------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Listbox/option/`aria-activedescendant` semantics                         | Custom keyboard-nav listbox | cmdk (`@/components/ui/command`) — already in the bundle          | Roving focus, activedescendant tracking, and option registration have many edge cases; cmdk already supplies them and powers 6 other components |
| Popover focus management (Escape-to-trigger, outside-click, positioning) | Custom popper               | `@/components/ui/popover` (Radix)                                 | Focus return + dismissal layering is subtle; Radix is the app standard                                                                          |
| axe rule engine                                                          | Manual ARIA assertions only | `jest-axe` (`toHaveNoViolations`) + explicit attribute assertions | Manual assertions verify the contract; axe catches what you didn't think to assert (e.g. nested-interactive)                                    |
| Combobox from scratch on React Aria                                      | New RAC-based combobox      | Not needed at all                                                 | The component exists and works in production; the phase is a restyle + deletion                                                                 |

**Key insight:** this phase's biggest risk is over-building. The live component is production-proven; every net-new line beyond deletion, de-variant-ing, and tests is unnecessary risk.

## Runtime State Inventory

(Deletion/refactor phase — all five categories answered explicitly.)

| Category            | Items Found                                                                                                                                                                                                                                                 | Action Required                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Stored data         | **None** — verified `grep -rni aceternity supabase/ backend/src` → 0; the components are pure UI, no DB columns/keys reference them                                                                                                                         | none                                                                                            |
| Live service config | **None** — no Edge Function, n8n, or dashboard references; `components.json` registry entry is build-time-only config (the edit IS the phase task)                                                                                                          | ACET-02 edit                                                                                    |
| OS-registered state | **None** — no scheduled tasks, services, or process names involved                                                                                                                                                                                          | none                                                                                            |
| Secrets/env vars    | **None** — no env var or secret references any of the 8 components or Aceternity                                                                                                                                                                            | none                                                                                            |
| Build artifacts     | `frontend/dist/**` chunks contain the dead code until next build (pre-commit hook rebuilds every commit, so self-healing); `frontend/src/.understand-anything/*` + `graphify-out/` graph caches contain stale symbol references (git-ignored / regenerable) | rebuild happens automatically; run `graphify update .` after code changes per project CLAUDE.md |

## Common Pitfalls

### Pitfall 1: axe `nested-interactive` on the clear affordance

**What goes wrong:** the clear "×" is `<span role="button" aria-label onClick>` **inside** the trigger `<Button>` (lines 449–457). axe's `nested-interactive` rule (serious) flags interactive roles nested in interactive elements; the span also lacks `tabIndex`/keydown, so it is not actually keyboard-operable today.
**Why it happens:** shadcn-era pattern; the Phase 75 audit recorded the affordance as contractual but flagged similar issues as "preserve-or-improve".
**How to avoid:** treat as preserve-the-affordance, improve-the-structure: render the clear control as a focusable sibling of the trigger (same visual position via the flex row), keeping `aria-label={t('smart-input:select.clear')}`. Verify with the new axe test BEFORE declaring criterion 2 met. If axe does NOT flag the current structure (run it first), preserving verbatim is also acceptable — decide from evidence, not assumption.
**Warning signs:** `toHaveNoViolations` failing with `nested-interactive` on the rendered-with-selection state.

### Pitfall 2: global `vi.mock('react-i18next')` in `tests/setup.ts`

**What goes wrong:** all vitest tests get a mocked `t()` backed by a static map; `smart-input:select.*` keys are NOT in the map, so `t()` returns raw keys. Tests asserting translated UI copy will silently assert key strings ([known project trap: mocked-`t` masks tokens]).
**How to avoid:** the bilingual `role="alert"` assertion does not depend on `t()` — `error` is a caller-resolved string prop. Pass an Arabic literal (e.g. `'هذا الحقل مطلوب'`) and assert `getByRole('alert')` contains it. For `isRTL`, mock `@/hooks/useDirection` per test row (the `DossierPicker.test.tsx` / `AppShell.a11y.test.tsx` matrix pattern); the setup mock's `i18n.language` getter reads `localStorage 'id.locale'` if you prefer flipping locale that way.
**Warning signs:** assertions passing on strings like `smart-input:select.placeholder`.

### Pitfall 3: cmdk + Radix in jsdom need polyfills

**What goes wrong:** rendering the REAL cmdk + Popover (required — mocking them like `DossierPicker.test.tsx` does would fake the listbox semantics the phase must prove) throws `scrollIntoView is not a function` in jsdom; `tests/setup.ts` polyfills ResizeObserver and matchMedia but NOT scrollIntoView.
**How to avoid:** in the new test file: `window.HTMLElement.prototype.scrollIntoView = vi.fn()` (and `hasPointerCapture`/`releasePointerCapture` stubs if user-event pointer interactions complain). Use `userEvent.setup()` and keyboard APIs (`{Enter}`, `{Escape}`, `{ArrowDown}`) rather than raw fireEvent.
**Warning signs:** TypeError from cmdk's item-into-view scrolling on first arrow-key press.

### Pitfall 4: MSW `onUnhandledRequest: 'error'` vs UserPicker's supabase calls

**What goes wrong:** `tests/setup.ts` starts an MSW server that errors on unhandled requests; UserPicker fires supabase-js REST calls on mount (`VITE_SUPABASE_URL` stubbed to `http://localhost:54321`).
**How to avoid:** for facade tests, `vi.mock('@/lib/supabase')` with a stub query-builder chain (`from().select().eq().order().limit()` resolving `{ data: [...], error: null }`), or add an MSW handler for `*/rest/v1/users*`. Prefer testing SearchableSelect directly with fixture options for the contract assertions; add one thin UserPicker test only for the facade seam.
**Warning signs:** "unhandled request" errors failing unrelated assertions.

### Pitfall 5: `heroui-vendor` 9 KB budget if anyone "improves" the rebuild onto HeroUI ComboBox

**What goes wrong:** vite routes every `@heroui` module id to the `heroui-vendor` chunk; the REQUIRED Bundle Size Check budgets it at 9 KB gzip. Importing `@heroui/react/combo-box` blows it (plus new react-aria machinery elsewhere).
**How to avoid:** the plan should state the primitive decision explicitly in the task so the executor doesn't "upgrade" mid-task. Verify locally with `cd frontend && pnpm build && pnpm exec size-limit` — grep the output for ALL `exceeded` lines (failures stack hidden [memory: project_bundle_size_required_check_budgets]).
**Warning signs:** CI Bundle Size Check red on `heroui-vendor`.

### Pitfall 6: `pnpm test:a11y` script is stale

**What goes wrong:** `frontend/package.json` `test:a11y` references `vitest.a11y.config.ts` which **does not exist** (verified). Running it fails regardless of your changes.
**How to avoid:** gate on the standard config instead: `pnpm vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx` (the default `vitest.config.ts` includes `**/*.test.{ts,tsx}`). Do not "fix" the script in this phase (scope creep) — just don't rely on it.

### Pitfall 7: deleting the `smart-input` i18n namespace with SmartInput

**What goes wrong:** an executor deleting `SmartInput.tsx` may "clean up" `src/i18n/{en,ar}/smart-input.json` + its registration — breaking the LIVE SearchableSelect (`select.*` keys), and silently: unregistered namespaces fall back to EN in both languages, and here the whole file would be gone → raw keys render.
**How to avoid:** explicit plan instruction: the `smart-input` namespace is shared; keep both JSON files and the `index.ts` registration untouched.

### Pitfall 8: protected main + per-commit build hook

**What goes wrong:** direct push to main is blocked; the pre-commit hook runs `pnpm build` (does not block on failure — verify output) and lint-staged can leave MM artifacts on .planning files.
**How to avoid:** follow the established Phase 75–78 execution pattern (PR with the 8 required checks; `HUSKY=0` for docs-only commits where appropriate per memory). Not a research decision — flagged for the executor.

## Code Examples

### New test file skeleton (Wave 0): `frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx`

```tsx
// Pattern source: frontend/src/components/layout/AppShell.a11y.test.tsx (jest-axe matrix)
// + frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx (useDirection mock)
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// jsdom gaps for real cmdk + Radix Popover (setup.ts covers ResizeObserver/matchMedia only)
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
})

// Direction matrix — do NOT mock ui/command or ui/popover: the real listbox
// semantics ARE the contract under test.
const directionMock = { isRTL: false }
vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({
    direction: directionMock.isRTL ? 'rtl' : 'ltr',
    isRTL: directionMock.isRTL,
  }),
}))

import { SearchableSelect } from '../SearchableSelect'

const options = [
  { value: 'u1', label: 'Alia Hassan', description: 'alia@example.com' },
  { value: 'u2', label: 'Badr Khalid', description: 'badr@example.com' },
]

describe('SearchableSelect — Phase 75 contract', () => {
  it('exposes the combobox trigger contract (attrs 1–8)', () => {
    render(<SearchableSelect options={options} label="Assignee" required error="Required" />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-required', 'true')
    expect(trigger.getAttribute('aria-describedby')).toContain('-error')
    expect(trigger.getAttribute('aria-controls')).toBeTruthy()
  })

  it.each([
    ['en', 'This field is required', false],
    ['ar', 'هذا الحقل مطلوب', true],
  ])('announces the error via role="alert" (%s)', (_lng, message, rtl) => {
    directionMock.isRTL = rtl
    render(
      <div dir={rtl ? 'rtl' : 'ltr'}>
        <SearchableSelect options={options} label="Assignee" error={message} />
      </div>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(message) // error is a resolved string prop
  })

  it('keyboard: open → focus in search input → arrows → Enter selects → Escape returns focus', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchableSelect options={options} onChange={onChange} />)
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument() // cmdk-supplied
    // focus moved into the search input (0ms-timeout effect — flush with findBy/waitFor)
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('u1')
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
  })

  it('has no serious/critical axe violations (closed + open + error states)', async () => {
    const { container } = render(
      <SearchableSelect options={options} label="Assignee" value="u1" error="Required" required />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

### Fully-gone verification (single script for the verifier)

```bash
cd /path/to/repo
FAIL=0
grep -rn "variant=[\"']aceternity" frontend/src tests --include="*.tsx" --include="*.ts" && FAIL=1
grep -rn "Aceternity" frontend/src tests --include="*.tsx" --include="*.ts" && FAIL=1
grep -n "aceternity" frontend/components.json && FAIL=1
ls frontend/src/components/forms/ | grep -iE "Aceternity|^SmartInput|^FormFieldWithValidation" && FAIL=1
pnpm --dir frontend lint --max-warnings 0 || FAIL=1   # inverted no-restricted-imports ban stays green
[ "$FAIL" = 0 ] && echo "FULLY GONE: PASS" || echo "FULLY GONE: FAIL"
```

(If the planner adopts the 4 comment rewordings + `.aceternity/` dir deletion, grep #2 above is achievable at literally zero matches; otherwise scope it with `grep -v` exclusions for the 4 commented files.)

### Bundle gate

```bash
cd frontend && pnpm build && pnpm exec size-limit   # grep output for EVERY 'exceeded' line
```

## State of the Art

| Old Approach                                                                  | Current Approach                                         | When Changed          | Impact                                                                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `variant="aceternity"` styling layer + rotating placeholders + motion reveals | Linear flat surfaces, no card shadows, restrained motion | Phase 77 (2026-07-02) | The aceternity variant's rgba shadow literals are now design-rule violations; deletion is convergence, not loss |
| shadcn Button under the trigger                                               | HeroUI v3 Button (`ui/button.tsx` → `HeroUIButton`)      | Phase 78 (2026-07-03) | ACET-01's "HeroUI v3/Radix primitives" is satisfied in place                                                    |
| `motion` full import                                                          | `m` + LazyMotion (commit 855ea331e, ~30 KB saved)        | earlier perf pass     | Removing `m`/`AnimatePresence` from SearchableSelect continues this direction                                   |
| `ValidationDemoPage` consuming the 8                                          | Deleted in PR #88/#89 demo cleanup                       | 2026-07               | This is WHY the 7 are dead; the ROADMAP's "8 rebuilt" predates the finding                                      |

**Deprecated/outdated:** `pnpm test:a11y` script (missing config file); `frontend/.aceternity/` doc directory; `frontend/README.md` line 291 claiming Aceternity UI is the primary component library.

## Assumptions Log

| #   | Claim                                                                                                                                                                           | Section                  | Risk if Wrong                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | axe will flag the nested clear affordance (`nested-interactive`) once tested                                                                                                    | Pitfall 1                | Low — the mitigation is "test first, restructure only if flagged"; either outcome has a defined path                                                                                |
| A2  | HeroUI ComboBox would materially exceed the 9 KB `heroui-vendor` budget (reasoned from RAC machinery size, not measured)                                                        | The Rebuild rationale #2 | Low — the recommendation stands on contract-fidelity grounds (rationale #1) alone even if the bundle estimate is wrong                                                              |
| A3  | jsdom + user-event can drive the real cmdk/Popover keyboard flow with the listed polyfills (standard community practice; not yet proven in THIS repo since no such test exists) | Pitfall 3 / Code Example | Medium — if jsdom proves flaky for the Escape-focus-return step, fall back to a Playwright spec for that one assertion (real browser), keeping axe + attribute assertions in vitest |

All other claims in this document are [VERIFIED] against the live repo (source reads, greps, node_modules inspection) or [CITED] from the Phase 75 audit artifact.

## Open Questions (RESOLVED)

1. **Does the "fully gone" proof include comments and the dead `ui/timeline.tsx`?**
   - What we know: 4 live files carry "Aceternity-inspired" comments; `ui/timeline.tsx` (0 importers) contains Aceternity demo copy; `frontend/.aceternity/` (10 git-tracked docs) and `frontend/README.md` lines 52/291 reference it. None violate ACET-02's letter (imports/variant/registry).
   - What's unclear: whether the plan spends ~15 minutes on the comment/doc purge or scopes the grep proof to code patterns only.
   - Recommendation: include the purge (delete `.aceternity/`, edit README ×2, reword 4 comments) — it makes the verifier's grep unconditional and the phase title honest. Deleting `ui/timeline.tsx` is defensible (0 importers) but is the one item worth a one-line planner note rather than silent inclusion.
   - RESOLVED: Yes — encoded in plan 79-03 (Task 2: `.aceternity/` deleted, README ×2 edited, the 4 comments reworded, dead `ui/timeline.tsx` importer-gated then deleted), making 79-04 Task 2's unconditional case-insensitive grep proof possible.
2. **Trim SearchableSelect's unused prop surface (`multiple`/`creatable`/`groupBy`/renderers)?**
   - What we know: UserPicker (sole consumer) never passes them; CONTEXT grants internals freedom; the audit calls the combobox behavior contractual _behind the facade_.
   - Recommendation: planner's discretion; trimming is contract-safe and KISS-aligned but increases diff size and test surface. If in doubt, keep the surface and only remove variant/motion/shadows (smallest verifiable diff).
   - RESOLVED: Keep the surface — encoded in plan 79-04 Task 1 step 6 (prop surface NOT trimmed: `multiple`/`creatable`/`groupBy`/renderers and `forwardRef` all stay), per this recommendation's smallest-verifiable-diff option.

## Environment Availability

| Dependency                              | Required By                 | Available | Version                                                                                 | Fallback         |
| --------------------------------------- | --------------------------- | --------- | --------------------------------------------------------------------------------------- | ---------------- |
| Node.js                                 | build/test                  | ✓         | 22.x (repo standard; used in Phases 75–78)                                              | —                |
| pnpm                                    | all commands                | ✓         | 10.29.1 (pinned)                                                                        | —                |
| vitest + jsdom                          | a11y/keyboard tests         | ✓         | ^4.1.7 (`frontend/vitest.config.ts`, setup `tests/setup.ts`)                            | —                |
| jest-axe                                | axe assertions              | ✓         | ^10.0.0 (devDependency; exemplar test exists)                                           | —                |
| @playwright/test + @axe-core/playwright | optional real-browser smoke | ✓         | ^1.60.0 / ^4.11.3 (`frontend/playwright.config.ts`, baseURL localhost:5173 + webServer) | vitest-only gate |
| size-limit                              | bundle gate                 | ✓         | in repo (`pnpm exec size-limit`, `.size-limit.json`)                                    | —                |
| @heroui/react                           | trigger Button (unchanged)  | ✓         | 3.2.1 (node_modules verified)                                                           | —                |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none (Playwright optional path noted above).

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 4.1.7 (jsdom) + jest-axe 10 + @testing-library/react 16 / user-event 14; Playwright 1.60 + @axe-core/playwright 4.11 (optional real-browser layer) |
| Config file        | `frontend/vitest.config.ts` (include `**/*.test.{ts,tsx}`, setup `frontend/tests/setup.ts`); `frontend/playwright.config.ts`                              |
| Quick run command  | `pnpm --dir frontend vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx`                                                            |
| Full suite command | `pnpm --dir frontend vitest run` + `pnpm --dir frontend lint --max-warnings 0` + `pnpm --dir frontend exec tsc --noEmit`                                  |

### Phase Requirements → Test Map

| Req ID                               | Behavior                                                                                                                                     | Test Type                                                                                                                    | Automated Command                                                                                                      | File Exists?                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ACET-01 (criterion 1)                | Rebuilt SearchableSelect announces errors via `role="alert"` in EN and AR                                                                    | unit (jsdom, `it.each` en/ar matrix; AR literal error string + `dir="rtl"` + `useDirection` mock)                            | `pnpm --dir frontend vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx -t 'role="alert"'`       | ❌ Wave 0                                                                         |
| ACET-01 (criterion 2a)               | Keyboard focus order preserved: open → search input focused → arrows → Enter selects → Escape returns focus to trigger                       | unit (jsdom + user-event against REAL cmdk/Popover, polyfills per Pitfall 3)                                                 | `pnpm --dir frontend vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx -t 'keyboard'`           | ❌ Wave 0                                                                         |
| ACET-01 (criterion 2b)               | `aria-invalid`/`aria-describedby` + the full 12-attribute contract; zero serious/critical axe violations (closed/open/error/selected states) | unit (jest-axe + explicit attribute assertions per the checklist table)                                                      | `pnpm --dir frontend vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx -t 'axe'`                | ❌ Wave 0                                                                         |
| ACET-01 (deletion half)              | 7 components + barrel entries + `useFieldValidation` deleted; no external importer breaks                                                    | typecheck + whole-repo lint + full unit suite green                                                                          | `pnpm --dir frontend exec tsc --noEmit && pnpm --dir frontend lint --max-warnings 0 && pnpm --dir frontend vitest run` | ✅ (existing suites; `CreateTaskCtas.test.tsx` guards the UserPicker module path) |
| ACET-01 (facade)                     | UserPicker public API + module path unchanged                                                                                                | unit (existing `CreateTaskCtas.test.tsx` `vi.doMock` keeps passing) + optional thin facade test with mocked `@/lib/supabase` | `pnpm --dir frontend vitest run src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx`                     | ✅                                                                                |
| ACET-02                              | Registry entry removed; ban green; 0 code references                                                                                         | grep battery (Code Examples §Fully-gone) + `pnpm lint --max-warnings 0`                                                      | the verification script above                                                                                          | ✅ (script is inline; no file needed)                                             |
| Bundle (cross-cutting REQUIRED gate) | size-limit budgets not regressed (expected: reduced)                                                                                         | build + size-limit                                                                                                           | `cd frontend && pnpm build && pnpm exec size-limit`                                                                    | ✅ (`.size-limit.json`)                                                           |

**Manual-only residue:** none required. An optional Playwright smoke (TaskEditDialog assignee picker keyboard pass + `@axe-core/playwright` scan, following `qa-sweep-axe.spec.ts`) adds real-browser confidence for the Escape-focus-return step but must not be the CI gate (e2e workflow is non-required and targets a running app).

### Sampling Rate

- **Per task commit:** `pnpm --dir frontend vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx` (once it exists) + `pnpm --dir frontend exec tsc --noEmit`
- **Per wave merge:** full vitest run + whole-repo lint + grep battery
- **Phase gate:** full suite + `pnpm build && pnpm exec size-limit` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx` — covers ACET-01 criteria 1, 2a, 2b (skeleton in Code Examples; jsdom polyfills per Pitfall 3). **Recommended sequencing: write it against the CURRENT component first (RED on nothing — it should pass except possibly the axe nested-interactive case), then perform the rebuild and keep it green — this proves "preserved", not just "present".**
- [ ] No framework install needed; no fixtures beyond inline option arrays + a supabase module mock if the thin UserPicker facade test is included.

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                          |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no      | — (no auth surface touched)                                                                                               |
| V3 Session Management | no      | —                                                                                                                         |
| V4 Access Control     | no      | UserPicker reads `users` under existing RLS; unchanged                                                                    |
| V5 Input Validation   | yes     | RHF + zodResolver at the consumers (unchanged); SearchableSelect renders option labels as React text nodes (auto-escaped) |
| V6 Cryptography       | no      | —                                                                                                                         |

### Known Threat Patterns for this change

| Pattern                                                                                                                                                                                                                                                           | STRIDE    | Standard Mitigation                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS via user-supplied `full_name`/`email` rendered in options                                                                                                                                                                                                     | Tampering | React text-node escaping (no `dangerouslySetInnerHTML` anywhere in the component — verified); keep it that way in the rebuild                                                                                         |
| PostgREST filter-string injection: `UserPicker.handleSearch` interpolates the raw query into `.or('full_name.ilike.%${query}%,email.ilike.%${query}%')` — user input can inject PostgREST filter syntax (`,`/`.` operators), not SQL; RLS still bounds visibility | Tampering | **Pre-existing, out of scope** (facade is frozen this phase). Flag for a future hardening pass: use `.ilike()` builder calls or sanitize `,().` from the query. Do NOT change it here — the facade contract is locked |
| Dead-code deletion enabling a dormant import path later                                                                                                                                                                                                           | Elevation | The inverted `no-restricted-imports` ban (untouched) + grep battery keep re-introduction CI-visible                                                                                                                   |

## Sources

### Primary (HIGH confidence — direct repo verification, 2026-07-03)

- `frontend/src/components/forms/SearchableSelect.tsx`, `UserPicker.tsx`, `index.ts` — full source reads (current: last touched by Phase 77 token fix c123a6c1e)
- `.planning/phases/75-ui-component-migration-audit/75-AUDIT-aceternity-contracts.md` — the contract spec + deletion warrant (all liveness claims re-reproduced fresh this session)
- `eslint.config.mjs` lines 122–162 (ban), `frontend/components.json` (registry), `frontend/.size-limit.json` + `frontend/vite.config.ts` line 163 (bundle gate), `frontend/src/index.css` @theme lines 50–117 (token compat mappings)
- `frontend/node_modules/@heroui/react` 3.2.1 — package exports + `dist/components/combo-box/combo-box.d.ts` (RAC-based input combobox, `ComboBoxTrigger`/`ComboBoxPopover` API)
- `frontend/tests/setup.ts` (global i18next mock, MSW error-on-unhandled, polyfill inventory), `frontend/vitest.config.ts`, `frontend/playwright.config.ts`
- Exemplar tests: `frontend/src/components/layout/AppShell.a11y.test.tsx` (jest-axe matrix), `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx` (useDirection/cmdk mock patterns), `frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx` (UserPicker vi.doMock)
- Fresh grep batteries: liveness (8 components), `variant="aceternity"`, repo-wide `aceternity` (found `.aceternity/` docs dir, README lines 52/291, 4 comment refs, dead `ui/timeline.tsx`), `supabase/`+`backend/src` (0), `smart-input` namespace consumers, `useFieldValidation`/`validation-rules` consumer maps, `ui/command` consumer list

### Secondary (MEDIUM confidence)

- Project memory: `reference_heroui_pro_catalog_v8_mapping` (Pro catalog fetched 2026-07-02 — SearchableSelect → OSS ComboBox mapping context), `project_bundle_size_required_check_budgets`, `project_i18n_static_bundle_no_http_backend`

### Tertiary (LOW confidence)

- A2 (HeroUI ComboBox bundle-weight magnitude) and A3 (jsdom keyboard-flow feasibility in THIS repo) — reasoned from general knowledge, flagged in the Assumptions Log with fallbacks

## Metadata

**Confidence breakdown:**

- Deletion safety: HIGH — every claim re-verified by fresh grep this session; zero dead tests/stories to hunt
- Rebuild approach: HIGH — decision rests on verified structural facts (RAC input-combobox vs captured button-trigger contract; 9 KB heroui-vendor budget; cmdk already bundled)
- ARIA contract checklist: HIGH — line-verified against current source, cross-checked with the Phase 75 artifact
- Verification architecture: MEDIUM-HIGH — frameworks and exemplars exist and are proven; the specific cmdk-in-jsdom keyboard test is new to this repo (A3 fallback defined)

**Research date:** 2026-07-03
**Valid until:** 2026-08-02 (stable domain — repo-internal; re-verify liveness greps if any UI phase lands in between)
