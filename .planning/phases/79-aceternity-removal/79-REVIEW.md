---
phase: 79-aceternity-removal
reviewed: 2026-07-03T16:41:45Z
reviewed_by: gsd-code-reviewer
supersedes: orchestrator-inline (2026-07-03, status:clean — explicitly requested this independent pass)
depth: standard
files_reviewed: 9
files_reviewed_list:
  - frontend/src/components/forms/SearchableSelect.tsx
  - frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx
  - frontend/src/components/forms/index.ts
  - frontend/src/components/dossier/ExpandableDossierCard.tsx
  - frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx
  - frontend/src/components/timeline/UnifiedVerticalTimeline.tsx
  - frontend/src/routes/_protected/dossiers/index.tsx
  - frontend/components.json
  - frontend/README.md
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 79: Code Review Report

**Reviewed:** 2026-07-03T16:41:45Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 79 removed 7 dead Aceternity form components + 1 orphaned hook, stripped the
`@aceternity-pro` registry from `components.json`, purged Aceternity doc/comment
residue, and rebuilt `SearchableSelect.tsx` from scratch (Aceternity/motion stripped,
combobox ARIA/keyboard contract restored). This is the independent pass the inline
orchestrator review (status:clean) explicitly requested; it supersedes that lighter
self-review. No `<structural_findings>` pre-pass was supplied, so every item below is
a narrative finding from direct code review.

**Verified green (priorities 1–3, 5):**

- **ARIA/keyboard contract — PASS (ground truth).** I executed the Wave-0 contract
  suite `SearchableSelect.a11y.test.tsx`: **9/9 pass** (role=combobox on the DOM,
  aria-expanded/controls/haspopup/labelledby/describedby/invalid/required, listbox +
  option roles, focus-to-search on open, Arrow+Enter select, Escape closes + returns
  focus to trigger, axe-clean closed AND open). The `Button asChild → plain <button>`
  fix (via `heroui-button.tsx` Slot forwarding) correctly lands
  role/aria-invalid/aria-required that the `@heroui/react` Button had dropped, and the
  open-effect mirrors cmdk's runtime listbox id onto `aria-controls`. The 79-04 test
  edits were legitimate unskips + adaptation to the id-mirroring approach, not a
  weakening of assertions.
- **Residual Aceternity in the 9 reviewed files — CLEAN.** `grep -rni aceternity
frontend/src` is empty; the four surviving app files got **comment-only** edits
  (framer-motion usage is pre-existing and out of Phase-79 scope per the milestone
  notes). `components.json` registry block removed cleanly (valid JSON). README's
  component-library list updated away from Aceternity with no broken commands/imports.
- **Barrel integrity — CLEAN.** `forms/index.ts` has no exports to deleted modules; no
  file in `frontend/src` imports any of the 9 deleted modules (the
  `enSmartInput`/`arSmartInput` matches are the `smart-input.json` i18n bundle, not the
  deleted `SmartInput.tsx`). Sole consumer `UserPicker.tsx` uses only props that still
  exist on `SearchableSelectProps`.

The passing contract test does **not** exercise the defects below (visual layout, RTL
caret, conditional ARIA wiring, an unused prop path), plus two items outside the
assigned file set that the phase's "Aceternity fully gone" claim missed.

## Warnings

### WR-01: Rebuilt SearchableSelect renders a duplicate search-input wrapper + a second search icon

**File:** `frontend/src/components/forms/SearchableSelect.tsx:479-490`
**Issue:** The rebuild wraps `<CommandInput>` in its own search row —
`<div className="flex items-center border-b px-3"><Search …/><CommandInput …/></div>`
— but `CommandInput` from `@/components/ui/command` (`command.tsx:71-83`) **already**
renders an identical wrapper with its own icon:
`<div className="flex items-center border-b px-3" cmdk-input-wrapper><MagnifyingGlassIcon …/><input …/></div>`.
Rendered result: **two magnifying-glass glyphs** side by side (lucide `Search`, then
Radix `MagnifyingGlassIcon`) inside **two nested `border-b px-3` wrappers** (doubled
bottom hairline + doubled inline padding). This ships to every consumer (e.g.
`UserPicker`). The a11y test doesn't catch it — it locates the input by placeholder/role,
not layout.
**Fix:** Drop the redundant outer wrapper and lucide icon; let `CommandInput` own the row
and position the loading spinner without re-wrapping:

```tsx
<Command shouldFilter={false}>
  <CommandInput ref={inputRef} placeholder={searchPlaceholder || t('smart-input:select.search')}
    value={searchQuery} onValueChange={handleSearchChange} />
  {loading && <Loader2 className="… animate-spin" />}
  <CommandList …>
```

### WR-02: RTL chevron double-rotation — caret points the wrong way and loses the open/close affordance in Arabic

**File:** `frontend/src/components/forms/SearchableSelect.tsx:460-466`
**Issue:** The trigger caret composes two independent `rotate-180` toggles:

```tsx
className={cn('… transition-transform', open && 'rotate-180', isRTL && 'rotate-180')}
```

`cn`/twMerge collapses `rotate-180 rotate-180` into a single `rotate-180`, so in RTL:
closed → `rotate-180` (points **up** — wrong for a collapsed dropdown) and open → also a
single `rotate-180` (**identical to closed**). In Arabic the caret is permanently inverted
and gives **no open/closed feedback**. A vertical dropdown caret must not be RTL-mirrored
(mandatory RTL correctness per `CLAUDE.md`).
**Fix:** Remove the RTL toggle; keep only the open rotation:

```tsx
className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
```

### WR-03: `aria-describedby` references a non-existent help element when both `error` and `helpText` are set

**File:** `frontend/src/components/forms/SearchableSelect.tsx:389,542`
**Issue:** `describedBy` adds `helpId` whenever `helpText` is truthy
(`[error ? errorId : null, helpText ? helpId : null].filter(Boolean)`), but the help
paragraph renders only when `helpText && !error` (line 542). When a caller passes **both**
`error` and `helpText`, the trigger gets `aria-describedby="…-error …-help"` while no
`…-help` element exists — a dangling ARIA reference (invalid; screen readers announce
nothing for it). The contract test never passes both, so it stays green. Low real-world
impact today (no current consumer passes both) but objectively invalid ARIA in an
accessibility-focused component.
**Fix:** Gate `helpId` on the render condition:

```tsx
const describedBy = [error ? errorId : null, helpText && !error ? helpId : null]
  .filter(Boolean)
  .join(' ')
```

### WR-04: `renderOption` prop bypasses `CommandItem`, producing non-selectable options with no `option` role or React key

**File:** `frontend/src/components/forms/SearchableSelect.tsx:348-353`
**Issue:** When a caller supplies `renderOption`, `renderSingleOption` returns
`renderOption(option, isSelected)` **directly** rather than inside `<CommandItem>`. The
node is never registered with cmdk: **no `role="option"`**, **no keyboard highlight/nav**,
**no `onSelect`** (cannot be selected), and — produced via `.map(renderSingleOption)` with
no `key` — it triggers a React "missing key" warning. Any caller using the documented
`renderOption` API gets a broken, empty-semantics listbox. Latent: the only current
consumer (`UserPicker`) doesn't use it, so nothing breaks today, but the exported prop is
a footgun.
**Fix:** Keep the `CommandItem` wrapper; let `renderOption` control only inner content:

```tsx
return (
  <CommandItem key={option.value} value={option.value} disabled={option.disabled}
    onSelect={() => handleSelect(option.value)} className="…">
    {renderOption ? renderOption(option, isSelected) : (/* default content */)}
  </CommandItem>
)
```

### WR-05: Aceternity purge is incomplete — `add-component.sh` still installs from the removed `@aceternity-pro` registry

**File:** `frontend/scripts/add-component.sh:3-5,47-75,91-111` (outside the 9 assigned files — cross-repo residue)
**Issue:** Phase 79 deleted the `@aceternity-pro` registry alias from `components.json`
and the summary claims "Aceternity fully gone," but this dev script was not touched and
remains an "Aceternity UI Component Installer": it advertises the old "Aceternity →
Kibo-UI → shadcn" hierarchy (line 4), actively runs
`npx shadcn@latest add @aceternity-pro/${COMPONENT}` (line 75) against the **now-deleted**
registry alias (unknown-registry failure), installs from `ui.aceternity.com` into
`src/components/ui/` (lines 49-50), and offers `@kibo-ui/` (line 84) — all of which import
`aceternity-ui`/`kibo-ui`, which are **ESLint-banned** in `frontend/**` per
`frontend/CLAUDE.md`, so anything it installs fails lint/CI immediately. Contradicts the
phase goal and the current cascade (HeroUI v3 → Radix → build). Distinct from the
intentionally-kept ESLint ban docs in `frontend/CLAUDE.md`.
**Fix:** Rewrite or delete `add-component.sh` so it no longer references the deleted
`@aceternity-pro` registry, `ui.aceternity.com`, or the banned `@kibo-ui` path.

## Info

### IN-01: Clear affordance is not keyboard-operable (nested interactive control inside the trigger button)

**File:** `frontend/src/components/forms/SearchableSelect.tsx:449-458`
**Issue:** The clear control is a `<span role="button" onClick={…}>` nested **inside** the
`<button role="combobox">` trigger, with no `tabIndex` and no key handler — keyboard users
cannot reach or activate it, and for single-select there is no keyboard path to clear a
value at all (`handleSelect` never toggles a single value to null). WCAG 2.1.1 (Keyboard)
gap and technically invalid HTML. Explicitly acknowledged/accepted by the Wave-0 contract
(T-79-01: axe stays clean because the span has no `tabindex`) and pre-existing (Phase 75),
so recorded as Info rather than a blocker.
**Fix (if revisited):** Move the clear control out of the trigger button, give it real
`<button type="button">` keyboard semantics, or expose clear via a key affordance
(e.g. Backspace when the combobox is focused).

### IN-02: Component mixes legacy shadcn semantic tokens with the Linear token set

**File:** `frontend/src/components/forms/SearchableSelect.tsx:307,323,330,341,364,369-373,381,456,460,481,489` (and similar)
**Issue:** The rebuild mixes legacy shadcn tokens (`text-muted-foreground`, `bg-primary/10`,
`text-primary`, `bg-muted`, `border-primary`, `text-primary-foreground`,
`border-muted-foreground/30`) with Linear tokens (`text-ink`, `text-ink-mute`,
`border-line`, `border-danger`, `text-danger`, `text-accent-ink`). All resolve via the
`@theme` remap so ESLint doesn't error (not raw hex/palette literals), but the mix is
inconsistent with the Linear direction in `CLAUDE.md`. Style consistency only — Info per
the phase review-priority guidance.
**Fix:** Normalize to Linear tokens (`text-muted-foreground` → `text-ink-mute`,
`bg-primary/10` → `bg-accent-soft`/`bg-accent/10`, `bg-muted` → `bg-surface-3`).

### IN-03: Truncation count "showing X of Y" uses the full option total while X is the filtered count

**File:** `frontend/src/components/forms/SearchableSelect.tsx:528-535`
**Issue:** The footer renders whenever `options.length > maxDisplayed`, showing
`shown = min(filteredOptions.length, maxDisplayed)` against `total = options.length` (the
**unfiltered** list). After a search narrowing results below `maxDisplayed`, it still reads
e.g. "showing 3 of 100" — implying 97 hidden matches when only 3 match — and can't be
corrected as written because `filteredOptions` is already sliced (pre-slice filtered count
not retained). Minor UX only.
**Fix:** Gate the footer on the _filtered_ set being truncated and report the filtered
total — e.g. `const filteredAll = filterOptions(options, searchQuery)`; show when
`filteredAll.length > maxDisplayed` using `filteredAll.length`.

### IN-04: `UserPicker` interpolates the raw search query into a PostgREST `.or()` filter string (security-adjacent, out of assigned scope, pre-existing)

**File:** `frontend/src/components/forms/UserPicker.tsx:86` (sole consumer of the reviewed component; NOT in the 9 assigned files and NOT modified by Phase 79)
**Issue:** `.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)` interpolates
unsanitized user input directly into a PostgREST filter grammar. A query containing `,`,
`(`, or `)` breaks out of the `ilike` pattern and can inject additional OR-conditions
(PostgREST filter injection). Impact is bounded here: the outer `.eq('is_active', true)`
is AND-ed with the whole OR-group and RLS constrains row visibility, so it cannot expose
inactive/unauthorized rows — worst case is malformed-filter errors or broadened matches
within the caller's RLS scope. Encountered while verifying the SearchableSelect prop
contract; corroborates the inline review's carried-forward "T-79-S2" flag. Recorded as
Info because it is out of the assigned file set, pre-existing, and RLS-bounded.
**Fix (when UserPicker is next in scope):** Build the filter with the query builder
(`.ilike('full_name', `%${query}%`)` via `.or` of typed conditions) or escape/strip the
PostgREST metacharacters `,()%` before interpolation.

---

_Reviewed: 2026-07-03T16:41:45Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
