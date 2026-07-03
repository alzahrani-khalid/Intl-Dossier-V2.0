---
status: clean
phase: 79-aceternity-removal
reviewed_by: orchestrator-inline
reviewer_agent_blocked: 'gsd-code-reviewer killed by session limit (resets 15:00 Asia/Riyadh) before writing; inline focused self-review — an independent /gsd:code-review 79 pass post-reset is recommended'
reviewed: 2026-07-03
---

# Phase 79: Aceternity Removal — Code Review

**Verdict: CLEAN** (no CRITICAL/HIGH). Advisory only; does not block. Scope: the phase diff `git diff e14475246..HEAD -- frontend/`. The only substantive code change is `SearchableSelect.tsx`; the rest are deletions, a barrel prune, a `components.json` edit, doc/comment residue rewording, and the a11y test — all low-risk and confirmed green by tsc + `pnpm lint` + full suite.

> **Provenance:** the independent `gsd-code-reviewer` agent was killed by a session limit before writing. This is a focused orchestrator self-review of the two non-trivial changes; treat an independent pass (`/gsd:code-review 79`) after the limit resets as the higher-signal follow-up.

## Focused findings

### 1. `Button asChild` → plain `<button>` trigger (T-79-02 restore) — SOUND

`<PopoverTrigger asChild><Button asChild variant="outline" …><button role="combobox" …>`. Nested Radix Slots compose the `PopoverTrigger` props (aria-expanded/haspopup/data-state, click/keyboard) and the HeroUI Button recipe className onto one real DOM `<button>`, which forwards `role`/`aria-invalid`/`aria-required` that the `@heroui/react` Button element had dropped via React-Aria `filterDOMProps`.

- Ref merging (`ref={ref}` under two `asChild` Slots), native `disabled`, and event wiring are exercised and pass: the keyboard-open, Arrow+Enter-select, and **Escape-returns-focus-to-trigger** tests are all green — which cannot pass unless focus/ref/toggle wiring is correct.
- No behavior loss vs. the old React-Aria Button for a popover trigger (Radix owns the toggle semantics).

### 2. `aria-controls` sync effect (T-79-02 link) — SOUND

On open, a `setTimeout(0)` mirrors cmdk's runtime-owned listbox id (`listRef.current?.id`) into `liveListboxId`; on close it resets to `null` (trigger falls back to the stable `listboxId`). Necessary because cmdk hardcodes `id:R.listId` _after_ the props spread (verified in cmdk 1.1.1 dist), so a static id can never match the real listbox.

- Guarded (`if (realId)`), cleaned up (`clearTimeout`), and reset on close — no leak, no stale id. The sub-tick transient before the timer fires is covered by `waitFor` in the test and is invisible to users. `aria-controls` is truthy when closed and equals the real listbox id when open (both asserted, green).

### 3. `PopoverContent aria-label` (T-79-03) — SOUND

Names the Radix dialog (`label || t('smart-input:select.search')`), resolving the serious axe `aria-dialog-name`. `PopoverContent` spreads `{...props}` to `PopoverPrimitive.Content`, so the label reaches the DOM.

## Conventions / design-system

- `pnpm lint` exit 0 confirms: no raw hex, no Tailwind palette literals, logical properties only (RTL), filename-case, i18n-namespace registration — all clean. No `dangerouslySetInnerHTML` (T-79-S1 control).
- Repo style (no semicolons, single quotes) followed; test file exempt from explicit-return-type/filename rules.

## Notes (informational, out of scope)

- `SearchableSelect` retains pre-existing shadcn-era utility classes (`text-muted-foreground`, `bg-muted`, `bg-primary/10`) in the option/value rendering — these are `@theme`-mapped in this repo (lint-clean) and were **not** introduced by this rebuild. Migrating them to explicit Linear tokens is a separate, out-of-scope cleanup.
- **T-79-S2 (carried forward, not this phase):** `UserPicker.handleSearch` PostgREST filter-string interpolation — facade frozen; flagged for future hardening (`.ilike()` builder or sanitize `,().`). RLS bounds visibility.

---

_Phase: 79-aceternity-removal — status: clean_
_Reviewed: 2026-07-03_
