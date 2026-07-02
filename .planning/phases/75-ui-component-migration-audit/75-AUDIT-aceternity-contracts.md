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

## Component summary (read this first)

| Component               | Liveness                             | ARIA count                                      | Rebuild-relevant notes                                                                                                           |
| ----------------------- | ------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| FormInputAceternity     | dead — 0 external call sites         | 4                                               | `register`-based; error linked via `aria-describedby` only (no live region); rotating placeholder is decoration                  |
| FormTextareaAceternity  | dead — 0 external call sites         | 3                                               | `register`-based; no live region; char-count feature; missing `aria-required`                                                    |
| FormSelectAceternity    | dead — 0 external call sites         | 3                                               | `register`-based native `<select>`; custom chevron; no live region                                                               |
| FormCheckboxAceternity  | dead — 0 external call sites         | 3                                               | `register`-vs-controlled tension (Radix `Checkbox`); no live region                                                              |
| FormRadioAceternity     | dead — 0 external call sites         | 3                                               | `register`-vs-controlled tension (Radix `RadioGroup`); group-label association gap; no live region                               |
| FormFieldWithValidation | dead — 0 external call sites         | 8                                               | controlled + `externalError`; **`role="alert"` live region**; multi-target `aria-describedby`; client-vs-server error precedence |
| SmartInput              | dead — 0 external call sites         | 5 (research said 6)                             | `forwardRef`; `(value, rawValue)` onChange + masking; **`role="alert"`**; `error` is a resolved string, not `FieldError`         |
| SearchableSelect        | **LIVE via `UserPicker`** (0 direct) | 12 explicit (+cmdk internals; research said 13) | full ARIA combobox (cmdk + Radix Popover); **`role="alert"`**; preserve the **UserPicker facade**, internals free                |

7 of 8 are dead code (see the "Phase 79 rescope input" section); only SearchableSelect is live,
and only behind the UserPicker facade.

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
  `aria-required={required ? true : undefined}` (line 129), and `aria-describedby` (line 130)
  which points at the error element id `{name}-error` when in error, else the help id
  `{name}-help`. On the required-marker span: `aria-hidden="true"` (line 98). Error
  announcement: the error paragraph carries `id="{name}-error"` and is linked **only via
  `aria-describedby`** — there is **no `role="alert"` and no `aria-live`**, so the error is
  announced on focus, not live-announced on appearance. This is a contract gap Phase 79 should
  close by adding a live region — record it as a preserve-or-improve item, not preserve-as-is.
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
  `aria-label={t('validation.required')}` (line 95). Each option uses a `<Label>` whose
  `htmlFor` is the per-option id `{name}-{option.value}` for per-option association (line 135).
  Error linked via `aria-describedby` only — **no `role="alert"`/`aria-live`**. The group label
  is an `m.label` with no `id`/`aria-labelledby` tie to the group (an association gap to fix on
  rebuild).
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

## FormFieldWithValidation — contract

**Source:** `frontend/src/components/forms/FormFieldWithValidation.tsx`
**Aceternity marker:** `variant?: 'default' | 'aceternity'` prop (not a named `*Aceternity`
file) — the aceternity path only adds shadow/focus styling; the validation wrapper behavior is
variant-independent.

This is the densest validation wrapper in the set — it composes label + control + trailing
validation icon + error/help/char-count/password-strength regions, and is the only component
(besides SmartInput) with a live-region error announcement.

- **Liveness:** 0 external call sites — dead code, barrel-only export.
  `grep -rl "\bFormFieldWithValidation\b" --include="*.tsx" --include="*.ts" frontend/src tests | grep -v "frontend/src/components/forms/" | wc -l` → `0`.
- **RHF wiring:** Does **not** take `register`. It is controlled internally (`useState('')` for
  `value`) and exposes `onChange?: (value: string) => void`; RHF errors arrive through a dedicated
  `externalError?: FieldError` prop. A live RHF binding would therefore be via `Controller`
  (bind `externalError={fieldState.error}` + `onChange={field.onChange}`), not `register`. The
  component also runs its own real-time validation via the `useFieldValidation` hook
  (300ms debounce, `instantFeedback: true`). **Error display path (client vs. server):**
  `displayResult = hasExternalError ? { isValid: false, messageKey: externalError.message || 'validation.required' } : validationResult` — the **external (RHF/server) error takes precedence**
  over the hook's client-side result, and `shouldShowValidation = (isTouched && displayResult) || hasExternalError` so an external error shows immediately (before touch) while the client result
  waits for blur (`setTouched`). A rebuild MUST preserve this precedence and the touched-gating.
- **Zod linkage:** No live call site → no schema binds today. Two seams a rebuild must keep:
  the `externalError: FieldError` seam (RHF+zodResolver errors) and the `validation:
UseFieldValidationOptions` seam (the internal hook's own rules). Server-echoed errors flow
  through `externalError.message` as an i18n key.
- **ARIA:** 8 attribute/role occurrences (matches research). `aria-label` on the required marker
  (line 253); on BOTH the `<input>` and `<textarea>` branches: `aria-invalid` (lines 292/308),
  `aria-describedby` (293/309), `aria-required` (294/310); and `role="alert"` on the validation
  feedback container (line 365). Ids are `useId()`-scoped: input `{name}-{uniqueId}`, error
  `{name}-error-{uniqueId}`, help `{name}-help-{uniqueId}`, char-count `{name}-charcount-{uniqueId}`.
  **`aria-describedby` chains multiple targets** — it is a space-joined list of
  `[errorId, helpId, charCountId]` filtered for the active ones (lines 179-185), so a screen
  reader hears the error, the help, and the char count together. **Error announcement mechanism:
  `role="alert"`** (line 365) — a real live region, so errors ARE announced on appearance
  (unlike the 5 simple components which only link via `aria-describedby`). A rebuild must keep
  both the multi-target describedby chaining and the `role="alert"` live region.
- **Keyboard/focus:** Native `<input>`/`<textarea>` tab order; `handleBlur` sets `isFocused=false`
  AND `setTouched()` (validation only surfaces after first blur); `handleFocus` sets focus state
  for the aceternity shadow. Error-conditional focus-ring color (danger/warning/primary). No
  Escape handling.
- **RTL:** Leading icon spacing `isRTL ? 'pe-12' : 'ps-12'` (line 196); trailing validation-icon
  spacing `isRTL ? 'ps-12' : 'pe-12'` (line 198); leading icon position `isRTL ? 'end-3' : 'start-3'` (line 273); trailing validation icon `isRTL ? 'start-3' : 'end-3'` (line 321). Mobile
  char-count uses `text-end`; labels/messages use `text-start`.
- **Animation-only (non-contractual):** Label entrance transform, leading-icon scale-in, trailing
  validation-icon `AnimatePresence` scale, height-auto reveal on the error/warning regions. The
  `role="alert"` container's _motion_ is non-contractual, but its _presence_ (the live region) is
  contractual. Password-strength meter and character-count _values_ are real features; their
  animations are droppable.

## SmartInput — contract

**Source:** `frontend/src/components/forms/SmartInput.tsx`
**Aceternity marker:** `variant?: 'default' | 'aceternity'` prop (not a named `*Aceternity`
file) — the aceternity path adds shadow/focus styling only.

SmartInput's distinguishing behavior is **type-driven mobile-keyboard optimization + input
masking** (phone/creditcard/currency/date/otp), exposed as a `forwardRef` input.

- **Liveness:** 0 external call sites — dead code, barrel-only export.
  `grep -rl "\bSmartInput\b" --include="*.tsx" --include="*.ts" frontend/src tests | grep -v "frontend/src/components/forms/" | wc -l` → `0`.
- **RHF wiring:** Does **not** take `register`; it is a `forwardRef<HTMLInputElement>` so a
  `ref` (e.g. RHF's `register().ref`) can be attached. Controlled/uncontrolled dual-mode
  (`isControlled = controlledValue !== undefined`; internal `useState` otherwise). It exposes a
  **two-argument** `onChange?: (value: string, rawValue: string) => void` — `value` is the masked
  display string, `rawValue` is the unmasked value. **This is a contract hazard for RHF:** RHF's
  registered `onChange` expects a DOM event, not `(value, rawValue)`, and the field should store
  `rawValue` not the masked `value`; a live binding must adapt (Controller mapping `rawValue` into
  `field.onChange`). Error is a plain `error?: string` prop (already-resolved message), NOT a
  `FieldError` — so unlike the other components it does not run `t()` on the message; the caller
  passes a resolved string.
- **Zod linkage:** No live call site → no schema binds today. The rebuild seam is the `ref` +
  `(value, rawValue)` onChange + resolved `error: string`; a Zod form must validate `rawValue`.
- **ARIA:** 5 attribute/role occurrences (research measured 6 — **the fresh count is 5**; recorded
  as actual). `aria-label` on the required marker (line 521); on `<input>`: `aria-invalid={!!error}`
  (line 562), `aria-describedby` (line 563), `aria-required={required}` (line 564); `role="alert"`
  on the error `<m.p>` (line 596). `aria-describedby` is a space-joined `[errorId, helpId]` list
  (line 455) with ids `{inputId}-error` / `{inputId}-help` (inputId = `props.id` or
  `smart-input-{uniqueId}`). **Error announcement mechanism: `role="alert"`** (line 596) — a real
  live region, like FormFieldWithValidation and unlike the 5 simple components.
- **Keyboard/focus:** Native `<input>` with type-specific `inputMode`/`pattern`/`autoComplete`
  from `INPUT_TYPE_CONFIG` (drives the mobile soft keyboard). `handleBlur` optionally reformats
  (`formatOnBlur`) and clears focus; `handleFocus` sets focus state. OTP type limits length and
  applies centered mono tracking. No Escape handling.
- **RTL:** Icon spacing `isRTL ? 'pe-4 ps-12' : 'ps-12 pe-4'` (line 466) reserving leading-icon
  room; leading icon position `isRTL ? 'end-3' : 'start-3'` (line 537). Labels/messages
  `text-start`. Note: masking/formatting operates on Latin digits — RTL affects layout, not the
  numeric formatting.
- **Animation-only (non-contractual):** Label entrance transform, leading-icon scale-in,
  help/error `AnimatePresence` fade/height reveal. The `role="alert"` motion is non-contractual;
  its presence is contractual. The masking/keyboard-optimization behavior is functional, not
  animation — it is fully contractual if Phase 79 keeps SmartInput's role.

## SearchableSelect — contract

**Source:** `frontend/src/components/forms/SearchableSelect.tsx`
**Aceternity marker:** `variant?: 'default' | 'aceternity'` prop (not a named `*Aceternity`
file) — the aceternity path adds trigger shadow styling only.

This is the **only transitively-live** component in the set. It is a full ARIA combobox built
on the app's cmdk `Command` primitives inside a Radix `Popover`, and it is the richest a11y
surface of the eight.

- **Liveness:** **0 direct external call sites, but LIVE via `UserPicker`.** Direct-import
  evidence:
  `grep -rl "\bSearchableSelect\b" --include="*.tsx" --include="*.ts" frontend/src tests | grep -v "frontend/src/components/forms/" | wc -l` → `0`. It is imported only by
  `frontend/src/components/forms/UserPicker.tsx` (same directory, excluded by the loop), and
  UserPicker has 4 live production consumers (see the UserPicker facade subsection). So a Phase 79
  rebuild of SearchableSelect only matters behind the UserPicker facade — the facade contract is
  what must be preserved.
- **RHF wiring:** Does **not** take `register`. `forwardRef<HTMLButtonElement>` (the ref lands on
  the trigger `<Button>`). Controlled: `value?: string | string[]` + `onChange?: (value: string | string[] | null) => void` (multi-select emits an array, single emits a string, cleared emits
  `null`). Error is a plain resolved `error?: string`, not a `FieldError`. Live RHF binding is via
  the consumer's `Controller`, mapping `field.value`/`field.onChange` through UserPicker.
- **Zod linkage:** No direct call site; the live binding validates the selected user id through the
  consumer's own RHF+Zod schema (e.g. `assignee_id`), passed down via UserPicker.
- **ARIA:** 12 explicit attribute/role occurrences in source (research measured 13 — the 13th is
  the `role="listbox"`/`role="option"`/`aria-selected`/`aria-activedescendant` set that the cmdk
  `Command`/`CommandList`/`CommandItem` primitives supply internally on the `CommandList
id={listboxId}`, not literal in this file). Explicit combobox pattern on the trigger `<Button>`:
  `role="combobox"` (line 434), `aria-controls={listboxId}` (435), `aria-expanded={open}` (436),
  `aria-haspopup="listbox"` (437), `aria-labelledby` → label id when a label is present (438),
  `aria-describedby` → space-joined `[errorId, helpId]` (439), `aria-invalid={!!error}` (440),
  `aria-required` (441). Plus the clear affordance `role="button"` + `aria-label` (450-451), the
  required-marker `aria-label` (420), and **`role="alert"` on the error `<m.p>` (line 564)** — a
  real live region. The listbox is `CommandList id="{selectId}-...listbox"` wired via
  `aria-controls`. A rebuild must preserve the whole combobox contract: combobox role + expanded
  state + controls/labelledby/describedby wiring + the option/listbox/activedescendant semantics
  cmdk provides + the `role="alert"` error region.
- **Keyboard/focus:** Trigger opens the popover on click/Enter/Space. **On open, focus moves to the
  search input** (`useEffect` → `inputRef.current?.focus()` after a 0ms timeout, lines 287-293).
  **Arrow Up/Down** move the active option (cmdk-managed `aria-activedescendant`); **Enter**
  selects (`onSelect` → `handleSelect`) — single-select closes the popover and clears the query,
  multi-select toggles and stays open; **Escape** closes the popover and returns focus to the
  trigger (Radix `Popover`). **Type-ahead** is manual: `Command` runs with `shouldFilter={false}`,
  so typing drives `searchQuery` → `filterOptions` fuzzy match over label/value/description
  (lines 112-123), and `onSearchChange` fires for async loading. A clear button and a
  `creatable` "+ create" item are additional keyboard-reachable affordances.
- **RTL:** Chevron flips with `isRTL && 'rotate-180'` plus `open && 'rotate-180'` (lines 459-464);
  `PopoverContent align="start"`; search icon uses `me-2`, clear/chevron cluster uses `ms-2`;
  labels/messages `text-start`. Popover width binds to the trigger via
  `--radix-popover-trigger-width`.
- **Animation-only (non-contractual):** Label entrance transform, help/error `AnimatePresence`
  fade/height reveal, chevron rotation, trigger shadow on open. The `role="alert"` motion is
  non-contractual; its presence is contractual. The combobox _behavior_ (filter, keyboard nav,
  focus management, multi/creatable) is fully functional and contractual behind the facade.

### UserPicker facade contract

**Source:** `frontend/src/components/forms/UserPicker.tsx` — the live wrapper around
SearchableSelect. **Phase 79 must preserve THIS facade's contract; SearchableSelect internals may
change freely behind it.**

- **Facade props surface (what the 4 consumers bind to):** `value?: string` (a single user id),
  `onChange?: (userId: string | null) => void`, `label?`, `placeholder?`, `error?: string`,
  `required?`, `disabled?`, `className?`. It is single-select only — it never exposes
  SearchableSelect's array/multiple surface.
- **What it maps down into SearchableSelect:** loads `options` from the `users` table
  (`is_active = true`, ordered by `full_name`, `limit 20`) on mount; wires `onSearchChange` to a
  300ms-debounced Supabase `full_name/email ilike` search (min 2 chars); narrows
  SearchableSelect's `string | string[] | null` onChange down to a single `userId | null`; passes
  `label`/`placeholder`/`error`/`required`/`disabled`/`className` through; sets `loading`; maps
  each user row to `{ value: id, label: full_name||email||id, description: email, icon: avatar }`.
- **The 4 live consumers (one line each):**
  - `frontend/src/components/tasks/TaskEditDialog.tsx` (line 201): RHF `Controller` on
    `assignee_id` — `<UserPicker value={field.value} onChange={field.onChange} />`; error surfaced
    via RHF `<FormMessage>`, not UserPicker's `error` prop.
  - `frontend/src/components/dossier/AddToDossierDialogs.tsx` (line 448): plain `useState`
    (`assigneeId`/`setAssigneeId`) — binds `label`, `placeholder`, `required`, `className`;
    `onChange={(userId) => setAssigneeId(userId ?? '')}`.
  - `frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx` (line 291): RHF `Controller`
    on the organization focal-user field — `value={field.value}`, `onChange={(id) => field.onChange(id ?? '')}`, `placeholder`.
  - `frontend/src/components/work-creation/forms/TaskQuickForm.tsx` (line 327): RHF `Controller`
    on `assignee_id` — `value={field.value}`, `onChange={(userId) => field.onChange(userId ?? '')}`,
    `placeholder`, `className`.
- **Facade-preservation rule for Phase 79:** keep the single-string `value` / `onChange(userId | null)` seam, the `?? ''` null-coalescing consumers rely on, and the `label`/`placeholder`/
  `required`/`disabled`/`error`/`className` pass-throughs. The `users`-table query + 300ms debounce
  is behavior consumers depend on (async user search); the combobox internals (cmdk/Radix) are free
  to be rebuilt on HeroUI v3/Radix as long as the facade props and keyboard/focus behavior hold.

---

## Phase 79 rescope input

**This section supplies evidence only. It does NOT rescope Phase 79.** The rebuild-vs-delete
decision for the dead components is a **user decision at Phase 79 planning** (RESEARCH Open
Question 1 resolution).

- **7 of 8 components are dead code.** `FormInputAceternity`, `FormTextareaAceternity`,
  `FormSelectAceternity`, `FormCheckboxAceternity`, `FormRadioAceternity`,
  `FormFieldWithValidation`, and `SmartInput` each have **zero external call sites** (see the
  liveness loop above, dated 2026-07-02). The forms barrel `frontend/src/components/forms/index.ts`
  exports all of them and **is itself imported by nothing**.
- **Only `SearchableSelect` is live**, and only **transitively via the `UserPicker` facade** (4
  production consumers). Its real preservation target is the UserPicker facade contract, not
  SearchableSelect's own prop surface.
- **The "ValidationDemoPage consumes these" claim is stale.** Milestone research
  (`.planning/research/STACK.md`) noted `ValidationDemoPage.tsx` as a consumer; that page was
  **deleted in the PR #88/#89 demo-page cleanup**. Fresh evidence:
  `grep -rln "ValidationDemoPage" frontend/src tests` → **0 references**. The demo consumer no
  longer exists, which is why the 7 are now dead.
- **Phase 79's ROADMAP still says "8 form components rebuilt on HeroUI v3/Radix"**
  (`.planning/ROADMAP.md` line 212; success criterion 4 verifies RHF/Zod + ARIA + keyboard-focus
  contracts against THIS document). That target predates the 7-of-8-dead finding.
- **Decision deferred to the user at Phase 79 planning.** The options this evidence opens up —
  (a) rebuild all 8 as written; (b) rebuild only the live `SearchableSelect`/`UserPicker` path and
  **delete** the dead 7; (c) some middle ground — are a scoping call for the user when Phase 79 is
  planned. This audit does not choose. Every contract above is captured as required so that
  whichever path is chosen, the RHF/Zod/ARIA/keyboard baseline exists.
