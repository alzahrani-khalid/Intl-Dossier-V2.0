# AUDIT-04: Aceternity-styled form component behavioral contracts

**Requirement:** AUDIT-04
**Consumed by:** Phase 79 (rebuild-or-delete of the Aceternity-styled form components)
**Generated:** 2026-07-02
**Scope:** docs-only — no production code changed by this phase.

## What "Aceternity" means here

In this repo "Aceternity" is **not a library import** — the Aceternity UI package is
ESLint-banned (root `eslint.config.mjs` `no-restricted-imports`) and CI-enforced.
"Aceternity-styled" means a component that carries a `variant="aceternity"` style
path — enhanced borders, hard-coded box-shadow literals, and `motion/react`
reveal/placeholder animations — layered on top of a plain `default` variant.

**Motion usage is NOT the Aceternity discriminator.** `motion/react` is imported by
18 of 22 files in `frontend/src/components/forms/` and 36 files repo-wide. The
discriminator is the `variant="aceternity"` prop (or a named `*Aceternity` file),
not the presence of `m.`/`AnimatePresence`.

The 8 components in scope (all under `frontend/src/components/forms/`):
`FormInputAceternity`, `FormTextareaAceternity`, `FormSelectAceternity`,
`FormCheckboxAceternity`, `FormRadioAceternity`, `FormFieldWithValidation`,
`SmartInput`, `SearchableSelect`.

## Liveness evidence (authority: symbol-level grep, not barrel presence)

Barrel presence is NOT liveness. `frontend/src/components/forms/index.ts` exports
all 8 names, but **nothing imports the barrel** — verified:

```bash
grep -rln "from '@/components/forms'" --include="*.tsx" --include="*.ts" frontend/src tests \
  | grep -v "components/forms/"     # → (no output: barrel has zero importers)
```

Per-component liveness loop (run from repo root), raw dated output:

```bash
# 2026-07-02T10:40:08Z
for c in FormInputAceternity FormTextareaAceternity FormSelectAceternity FormCheckboxAceternity \
         FormRadioAceternity FormFieldWithValidation SearchableSelect SmartInput; do
  echo -n "$c: "
  grep -rl "\b$c\b" --include="*.tsx" --include="*.ts" frontend/src tests 2>/dev/null \
    | grep -v "frontend/src/components/forms/" | wc -l | tr -d ' '
done
# UserPicker (the live SearchableSelect facade) consumers:
grep -rln "components/forms/UserPicker" --include="*.tsx" frontend/src | grep -v components/forms
```

Output:

```
FormInputAceternity: 0
FormTextareaAceternity: 0
FormSelectAceternity: 0
FormCheckboxAceternity: 0
FormRadioAceternity: 0
FormFieldWithValidation: 0
SearchableSelect: 0
SmartInput: 0
frontend/src/components/tasks/TaskEditDialog.tsx
frontend/src/components/dossier/AddToDossierDialogs.tsx
frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx
frontend/src/components/work-creation/forms/TaskQuickForm.tsx
frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx
```

**Reading:** 7 of 8 components have **0 external call sites** — dead code, barrel-only
export. `SearchableSelect` also shows **0 direct external call sites**, but it is
**transitively live via `UserPicker`** (which wraps it). UserPicker has 4 live
production consumers (the 5th match, `CreateTaskCtas.test.tsx`, only `vi.doMock`s
UserPicker — a test stub, not a live consumer). See the SearchableSelect and
UserPicker facade sections below.

## Contract template

Every contract below has exactly these 7 fields (RESEARCH Pattern 3). "Contractual"
means Phase 79's rebuild must preserve it; "non-contractual" means Phase 79 may drop
it.

1. **Liveness** — call-site count (or "0 — dead code, barrel-only export") **with the
   evidence command**, not just the verdict.
2. **RHF wiring** — the `register` / `error` (`FieldError`) prop contract, the ref/spread
   chain, and the error display path (including where server-echoed errors would surface).
3. **Zod linkage** — where a validation schema lives at the (dead or live) call sites.
4. **ARIA** — the actual `aria-*` attributes and roles found in source, and specifically
   how (or whether) errors are announced (`aria-describedby` association vs.
   `role="alert"`/`aria-live` live region).
5. **Keyboard/focus** — tab order, focus-visible treatment, Escape/blur handling,
   combobox keyboard nav where relevant.
6. **RTL** — `isRTL`-conditional logical spacing (`ps-12`/`pe-12`), icon-side logic,
   direction-conditional animation offsets.
7. **Animation-only behavior** — explicitly **non-contractual**: rotating placeholders,
   motion reveals, hover scale — what Phase 79 may drop without breaking the contract.

---

## FormInputAceternity — contract

**Source:** `frontend/src/components/forms/FormInputAceternity.tsx`

- **Liveness:** 0 external call sites — dead code, barrel-only export.
  `grep -rl "\bFormInputAceternity\b" --include="*.tsx" --include="*.ts" frontend/src tests | grep -v "frontend/src/components/forms/" | wc -l` → `0`.
- **RHF wiring:** Props `register?: UseFormRegister<any>`, `error?: FieldError`, `name`.
  Registers via `{...(register ? register(name) : {})}` spread onto the native `<input>`
  (line 126) — so `ref`, `onChange`, `onBlur`, `name` all come from RHF when `register` is
  passed; the component's own `onBlur`/`onFocus` (`setIsFocused`) are declared _after_ the
  register spread and therefore **override** the RHF `onBlur` (a rebuild must re-merge these,
  not clobber). Error display path: renders `t(error.message || 'validation.required')` inside
  an `AnimatePresence` block keyed only on `error` truthiness — the message string is an i18n
  key, so a server-echoed error must be pushed into RHF as `error.message` = an i18n key to
  render (raw server strings would be passed to `t()` and leak the key if unmapped).
- **Zod linkage:** No live call site → no schema binds today. The `register`/`error` props
  are the seam a parent `useForm({ resolver: zodResolver(schema) })` would bind to; a rebuild
  must keep that seam (register-name + FieldError) intact.
- **ARIA:** 4 attributes/roles. On `<input>`: `aria-invalid={!!error}` (line 128),
  `aria-required={required ? true : undefined}` (line 129),
  `aria-describedby={error ? \`${name}-error\` : helpText ? \`${name}-help\` : undefined}`(line 130). On the required-marker span:`aria-hidden="true"`(line 98). Error announcement:
the error`<m.p id={\`${name}-error\`}>`is linked **only via`aria-describedby`** — there is
**no `role="alert"`and no`aria-live`**, so the error is announced on focus, not
  live-announced on appearance. **Contract gap Phase 79 should close\*\* (add a live region) —
  record as a preserve-or-improve item, not a preserve-as-is.
- **Keyboard/focus:** Native `<input>` tab order; `focus:ring-2 focus:border-transparent`
  focus-visible treatment, error-conditional ring color (`focus:ring-danger/30` vs
  `focus:ring-primary-500`). `onFocus`/`onBlur` toggle an `isFocused` state that only drives the
  aceternity shadow; no Escape handling (single-line input).
- **RTL:** Icon spacing is `isRTL ? 'pe-12' : 'ps-12'` (line 58) — logical padding reserving
  room for the leading icon; the icon itself is positioned `isRTL ? 'end-3' : 'start-3'`
  (line 112). Label/help/error all use `text-start`.
- **Animation-only (non-contractual):** Rotating placeholder carousel driven by a 3s
  `setInterval` over `placeholders[]` (lines 40-48, 142-162); label/icon entrance transforms;
  `AnimatePresence` error slide-in. All droppable by Phase 79 — the placeholder rotation in
  particular is pure decoration.

## FormTextareaAceternity — contract

**Source:** `frontend/src/components/forms/FormTextareaAceternity.tsx`

- **Liveness:** 0 external call sites — dead code, barrel-only export.
  `grep -rl "\bFormTextareaAceternity\b" ... | grep -v "frontend/src/components/forms/" | wc -l` → `0`.
- **RHF wiring:** Props `register?: UseFormRegister<any>`, `error?: FieldError`, `name`.
  Registers via `{...(register ? register(name) : {})}` on the `<textarea>` (line 124). The
  component wraps `onChange` with a local `handleChange` (char-count) that calls
  `rest.onChange` — but the register spread's `onChange` sits under the RHF spread while
  `onChange={handleChange}` is declared after `{...rest}`, so the local handler wins; a rebuild
  must forward changes to RHF (call the registered `onChange`) or char-count breaks RHF state.
  Error path identical to FormInputAceternity: `t(error.message || 'validation.required')`.
- **Zod linkage:** No live call site → no schema binds today; `register`/`error` are the seam.
- **ARIA:** 3 attributes/roles. On `<textarea>`: `aria-invalid={!!error}` (line 126),
  `aria-describedby={...}` (line 127). On the required-marker span:
  `aria-label={t('validation.required')}` (line 96). Same as the input: error is linked via
  `aria-describedby` only — **no `role="alert"`/`aria-live`**. No `aria-required` here (present
  on the input but absent on the textarea — an inconsistency to normalize in the rebuild).
- **Keyboard/focus:** Native `<textarea>` tab order; `resize-y`; same error-conditional focus
  ring. `isFocused` drives an aceternity focus-ring overlay only.
- **RTL:** `text-start` on the field and all labels/messages; no icon spacing (no leading icon).
- **Animation-only (non-contractual):** Label entrance transform, char-count scale-in, the
  `isFocused` ring overlay (`m.div ring-2 ring-primary-500/30`), `AnimatePresence` error
  slide-in. Char-count _display_ (`{charCount}/{maxLength}`) is a real feature if the field is
  `showCharCount` — preserve the count, drop the scale animation.

## FormSelectAceternity — contract

**Source:** `frontend/src/components/forms/FormSelectAceternity.tsx`

- **Liveness:** 0 external call sites — dead code, barrel-only export.
  `grep -rl "\bFormSelectAceternity\b" ... | grep -v "frontend/src/components/forms/" | wc -l` → `0`.
- **RHF wiring:** Props `register?`, `error?: FieldError`, `name`, `options: {value,label}[]`.
  Registers via `{...(register ? register(name) : {})}` on the native `<select>` (line 95).
  `onFocus`/`onBlur` declared after the register spread override RHF's `onBlur` (same pattern as
  the input). Error path identical (`t(error.message || 'validation.required')`).
- **Zod linkage:** No live call site → no schema binds today; `register`/`error` are the seam.
- **ARIA:** 3 attributes/roles. On `<select>`: `aria-invalid={!!error}` (line 97),
  `aria-describedby={...}` (line 98). On the required-marker span:
  `aria-label={t('validation.required')}` (line 85). Error linked via `aria-describedby` only —
  **no `role="alert"`/`aria-live`**. Native `<select>` supplies its own listbox semantics.
- **Keyboard/focus:** Native `<select>` keyboard (space/arrows/type-ahead handled by the
  browser); `appearance-none` hides the native chevron and a custom `ChevronDown` is drawn on
  top (`pointer-events-none`). Error-conditional focus ring as with the input.
- **RTL:** Chevron is positioned `isRTL ? 'start-3' : 'end-3'` (line 119) AND rotated
  `isRTL && 'rotate-180'` (line 129); field padding uses logical `pe-10` (line 39) to reserve
  chevron room. `text-start` on label/help/error.
- **Animation-only (non-contractual):** Chevron rotate-on-focus (`rotate: isFocused ? 180 : 0`),
  label entrance transform, `AnimatePresence` error slide-in. The chevron _glyph_ is a real
  affordance (native chevron is hidden) — preserve a chevron, drop the rotation.

## FormCheckboxAceternity — contract

**Source:** `frontend/src/components/forms/FormCheckboxAceternity.tsx`

- **Liveness:** 0 external call sites — dead code, barrel-only export.
  `grep -rl "\bFormCheckboxAceternity\b" ... | grep -v "frontend/src/components/forms/" | wc -l` → `0`.
- **RHF wiring:** Props `register?`, `error?: FieldError`, plus a **controlled** surface
  `checked?: boolean` / `onCheckedChange?: (checked: boolean) => void`. It renders the app's
  `@/components/ui/checkbox` (Radix-based `Checkbox`), NOT a native input, and spreads
  `{...(register ? register(name) : {})}` onto it (line 94). **Contract risk:** RHF `register`
  returns a native ref/onChange contract that a Radix `Checkbox` (which emits `onCheckedChange`,
  not `onChange`) will not honor — so RHF registration and the controlled `checked`/
  `onCheckedChange` path are **two competing wirings**; a live form would use one or the other.
  A rebuild must pick a single source of truth (Controller-wrapped, or a native input).
- **Zod linkage:** No live call site → no schema binds today; `register`/`error` are the seam.
- **ARIA:** 3 attributes/roles. On `<Checkbox>`: `aria-invalid={!!error}` (line 92),
  `aria-describedby={...}` (line 93). On the required-marker span:
  `aria-label={t('validation.required')}` (line 102). `<label htmlFor={name}>` associates the
  text label. Error linked via `aria-describedby` only — **no `role="alert"`/`aria-live`**.
- **Keyboard/focus:** Checkbox focus toggles `isFocused` (drives an aceternity ring); the Radix
  `Checkbox` supplies space-to-toggle and focus semantics. `onFocus`/`onBlur` wrap the register
  spread (declared before/after it), so RHF's blur is overridden.
- **RTL:** Container is `isRTL && 'flex-row-reverse'` (line 45); help/error indent flips
  `isRTL ? 'me-8' : 'ms-8'` (lines 115, 132) to stay aligned under the checkbox. Entrance
  x-offset flips sign by direction (`x: isRTL ? 10 : -10`).
- **Animation-only (non-contractual):** Entrance slide (`opacity/x`), hover `scale-110`, focus
  ring, `AnimatePresence` error slide-in — all droppable.

## FormRadioAceternity — contract

**Source:** `frontend/src/components/forms/FormRadioAceternity.tsx`

- **Liveness:** 0 external call sites — dead code, barrel-only export.
  `grep -rl "\bFormRadioAceternity\b" ... | grep -v "frontend/src/components/forms/" | wc -l` → `0`.
- **RHF wiring:** Props `register?`, `error?: FieldError`, plus a **controlled** surface
  `value?: string` / `onValueChange?: (value: string) => void`. Renders the app's
  `@/components/ui/radio-group` (`RadioGroup`/`RadioGroupItem`, Radix) and spreads
  `{...(register ? register(name) : {})}` onto the `RadioGroup` (line 109). Same
  register-vs-controlled tension as the checkbox: RHF's native ref/onChange contract does not
  match Radix `RadioGroup`'s `onValueChange`; a rebuild must choose one binding (Controller or
  native `<input type=radio>`). Error path identical (`t(error.message || 'validation.required')`).
- **Zod linkage:** No live call site → no schema binds today; `register`/`error` are the seam.
- **ARIA:** 3 attributes/roles. On `<RadioGroup>`: `aria-invalid={!!error}` (line 107),
  `aria-describedby={...}` (line 108). On the required-marker span:
  `aria-label={t('validation.required')}` (line 95). Each option uses
  `<Label htmlFor={\`${name}-${option.value}\`}>`for per-option association. Error linked via`aria-describedby`only — **no`role="alert"`/`aria-live`**. The group label is an `m.label`with no`id`/`aria-labelledby` tie to the group (an association gap to fix on rebuild).
- **Keyboard/focus:** Radix `RadioGroup` supplies arrow-key roving tab index and space/enter
  selection; the group label is not focus-linked. No Escape handling.
- **RTL:** Group is `isRTL && layout === 'horizontal' && 'flex-row-reverse'` (line 54); each
  item container flips `isRTL && 'flex-row-reverse'` (line 65); entrance x-offset flips
  (`x: isRTL ? 10 : -10`). `text-start` throughout.
- **Animation-only (non-contractual):** Staggered per-option entrance (`delay: index * 0.05`),
  hover shadow, selected-state border/background emphasis, `AnimatePresence` error slide-in.
  The selected-state visual emphasis is a real affordance — preserve a selected indicator, drop
  the motion.

---

## FormFieldWithValidation — contract (Task 2)

_Placeholder — filled by Task 2._

## SmartInput — contract (Task 2)

_Placeholder — filled by Task 2._

## SearchableSelect — contract (Task 3)

_Placeholder — filled by Task 3._
