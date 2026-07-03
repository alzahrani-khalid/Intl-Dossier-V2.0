# Phase 78 — Protocol Re-run (HEROUI-02 confirmation on 3.2.1)

**Scope:** Re-run the four "Phase 78 re-run protocol" commands recorded in
`75-AUDIT-heroui-confirmation.md` VERBATIM against the post-bump tree, capture raw
output + exit code for each, and diff every result against the Phase 75 record. This
is the confirmation clause of **HEROUI-02**: CONTEXT.md locks the expectation of the
SAME output (8 import sites, 0 removed-name imports, type-check exit 0, compound
dot-notation present). A delta is the only thing worth acting on — and only the one
`*.Content` delta from plan 78-02 is expected.

**Evidence style (RESEARCH Pattern 2):** each verdict pairs the exact command + its
raw output + the run date + exit code + a one-line interpretation + a machine-readable
summary line — identical to the Phase 75 artifact so a future phase can diff against it.

**Measured:** 2026-07-03, from the repo root of the MAIN checkout (`frontend/node_modules`
installed — RESEARCH Pitfall 5), at commit `b2dd4bab` on `main`. Preconditions:
78-01 bumped `@heroui/react` + `@heroui/styles` 3.0.5 → **3.2.1** in lockstep (commit
`10de0c95`); 78-02 migrated the toggle wrappers to `*.Content` (commit `41c925c5`).

Installed version confirmation (lockstep held, zero 3.0.5 remnant):

```
@heroui/react 3.2.1
@heroui/styles 3.2.1
# pnpm-lock.yaml: only '@heroui/react@3.2.1 and '@heroui/styles@3.2.1 present
```

## Findings summary (read this first)

| Command                   | Verdict                                                                                                                                                                                  | Machine-readable line                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1 — import inventory      | **Match.** Same 8-file set as Phase 75 (identical set; only grep enumeration order differs). `heroui-forms.test.tsx` absent — 78-02's test imports only `./heroui-forms`.                | `Import-site count: 8`                 |
| 2 — removed-name imports  | **Match.** 0 imports of any of the 9 checked v3-removed names; exit 1.                                                                                                                   | `Removed-name import hits: 0 (exit 1)` |
| 3 — type-check            | **Match.** `tsc --noEmit` exit 0 — every one of the 8 call sites compiles against the installed 3.2.1 `.d.ts`.                                                                           | `Type-check: exit 0`                   |
| 4 — compound dot-notation | **Match + ONE expected delta.** Dot-notation present in all three wrappers, PLUS the new `Checkbox.Content`/`Switch.Content` lines from plan 78-02 (recorded, explained, NOT a failure). | (compound API confirmed)               |

**Residual flat-prop (v2 monolith) stragglers: 0.** **Behavioral oracle** (`pnpm --dir frontend test run heroui-forms`): **exit 0, 4/4 passed** — binds the protocol's known blind spot to its real test.

<!-- FINDINGS-SUMMARY-ANCHOR -->

---

## Command 1 — import-site inventory

### Command (verbatim from the Phase 75 artifact)

```bash
grep -rlnE "from ['\"]@heroui/react['\"]" --include='*.tsx' --include='*.ts' frontend/src
```

### Raw output (2026-07-03)

```
frontend/src/components/ui/heroui-skeleton.tsx
frontend/src/components/ui/heroui-forms.tsx
frontend/src/components/ui/heroui-modal.tsx
frontend/src/components/ui/heroui-button.tsx
frontend/src/components/ui/heroui-card.tsx
frontend/src/components/layout/ConcurrentDrawers.test.tsx
frontend/src/components/layout/AppShell.tsx
frontend/src/components/tweaks/TweaksDrawer.tsx
```

**Exit code:** 0
**Import-site count: 8**

**Interpretation:** the same 8 import sites recorded in Phase 75 — no addition, no
removal. The new behavioral oracle `heroui-forms.test.tsx` (plan 78-02) is **not** in
the list because it imports only from `./heroui-forms`, never `@heroui/react` — exactly
as 78-02 designed, keeping the count at 8.

---

## Command 2 — v3-removed component names

### Command (verbatim from the Phase 75 artifact)

```bash
grep -rnE "import\s*\{[^}]*\b(Navbar|Snippet|User|Spacer|Image|Code|Autocomplete|DateInput|Ripple)\b[^}]*\}\s*from\s*['\"]@heroui/react['\"]" --include='*.tsx' --include='*.ts' frontend/src
```

### Raw output (2026-07-03)

```
(no output)
```

**Exit code:** 1
**Removed-name import hits: 0 (exit 1)**

**Interpretation:** zero imports of any of the 9 checked names (the 8 requirement names
Navbar/Snippet/User/Spacer/Image/Code/Autocomplete/DateInput plus Ripple). This is an
**import-evidence** statement, not a package-removal claim — see false-positive guard 2.

---

## Command 3 — mechanical conformance proof (type-check)

### Command (verbatim from the Phase 75 artifact)

```bash
pnpm --dir frontend type-check   # tsc --noEmit
```

### Raw output (2026-07-03)

```
> intake-frontend@1.0.0 type-check
> tsc --noEmit

<no output>
```

**Exit code:** 0
**Type-check: exit 0**

**Interpretation:** the compiler checks every one of the 8 HeroUI call sites against
the installed **3.2.1** `.d.ts` declarations. Exit 0 means no call site uses an API the
3.2.1 package does not declare — the strongest mechanical conformance proof available,
and it matches the Phase 75 record (measured then against 3.0.5). See the blind-spot
note in the diff section: exit 0 is necessary but NOT sufficient for the toggles change.

---

## Command 4 — compound-usage spot-check (Modal / Checkbox / Switch / Card)

### Command (verbatim from the Phase 75 artifact)

```bash
grep -rn "Modal\.\|Checkbox\.\|Switch\.\|Card\." \
  frontend/src/components/ui/heroui-modal.tsx \
  frontend/src/components/ui/heroui-forms.tsx \
  frontend/src/components/ui/heroui-card.tsx
```

### Raw output (2026-07-03, UNtrimmed — Phase 75 recorded a trimmed subset)

```
frontend/src/components/ui/heroui-card.tsx:4: * Real @heroui/react Card compound primitives (Card.Root / Card.Header /
frontend/src/components/ui/heroui-card.tsx:5: * Card.Title / Card.Description / Card.Content / Card.Footer). `CardAction`
frontend/src/components/ui/heroui-card.tsx:51:  // HeroUI Card.Title defaults to <h3>; call sites overwhelmingly pass only
frontend/src/components/ui/heroui-forms.tsx:201:      <HeroUICheckbox.Content className="flex items-start gap-3">
frontend/src/components/ui/heroui-forms.tsx:202:        <HeroUICheckbox.Control className="mt-0.5">
frontend/src/components/ui/heroui-forms.tsx:203:          <HeroUICheckbox.Indicator />
frontend/src/components/ui/heroui-forms.tsx:204:        </HeroUICheckbox.Control>
frontend/src/components/ui/heroui-forms.tsx:206:      </HeroUICheckbox.Content>
frontend/src/components/ui/heroui-forms.tsx:253:      <HeroUISwitch.Content className="flex items-center justify-between gap-3">
frontend/src/components/ui/heroui-forms.tsx:255:        <HeroUISwitch.Control>
frontend/src/components/ui/heroui-forms.tsx:256:          <HeroUISwitch.Thumb />
frontend/src/components/ui/heroui-forms.tsx:257:        </HeroUISwitch.Control>
frontend/src/components/ui/heroui-forms.tsx:258:      </HeroUISwitch.Content>
frontend/src/components/ui/heroui-modal.tsx:110:    <Modal.Backdrop
frontend/src/components/ui/heroui-modal.tsx:115:      <Modal.Container size={size} placement={placement}>
frontend/src/components/ui/heroui-modal.tsx:116:        <Modal.Dialog
frontend/src/components/ui/heroui-modal.tsx:125:          {showCloseButton && <Modal.CloseTrigger />}
frontend/src/components/ui/heroui-modal.tsx:127:        </Modal.Dialog>
frontend/src/components/ui/heroui-modal.tsx:128:      </Modal.Container>
frontend/src/components/ui/heroui-modal.tsx:129:    </Modal.Backdrop>
frontend/src/components/ui/heroui-modal.tsx:143:    <Modal.Header className={cn('flex flex-col space-y-1.5', className)}>{children}</Modal.Header>
frontend/src/components/ui/heroui-modal.tsx:157:    <Modal.Heading className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
frontend/src/components/ui/heroui-modal.tsx:159:    </Modal.Heading>
frontend/src/components/ui/heroui-modal.tsx:184:  return <Modal.Body className={cn('py-4', className)}>{children}</Modal.Body>
frontend/src/components/ui/heroui-modal.tsx:203:    <Modal.Footer
frontend/src/components/ui/heroui-modal.tsx:218:    </Modal.Footer>
```

**Exit code:** 0

**Interpretation:** dot-notation compound API confirmed in all three wrappers.
`heroui-modal.tsx` renders the full `Modal.*` compound tree; `heroui-card.tsx` wraps
`Card` + its `Card.*` subcomponents; `heroui-forms.tsx` renders
`Checkbox.Content > Checkbox.Control > Checkbox.Indicator` and
`Switch.Content > Switch.Control > Switch.Thumb`. The `Checkbox.Content` (L201) /
`Switch.Content` (L253) lines are the **expected** plan-78-02 addition — see the diff
section. (Phase 75 recorded this output "trimmed to the load-bearing lines"; the
untrimmed capture here additionally shows closing tags and the two extra `card.tsx`
comment lines — presentation, not a content delta.)

---

## Diff vs Phase 75 records

Baseline: `.planning/phases/75-ui-component-migration-audit/75-AUDIT-heroui-confirmation.md`
(measured 2026-07-02 against 3.0.5 at base `228ce049`). This re-run is against 3.2.1 at
`b2dd4bab`.

| #   | Phase 75 record                                                                          | 3.2.1 re-run                                                   | Verdict                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 8 files; `Import-site count: 8`                                                          | 8 files; `Import-site count: 8`                                | **Match** — sorted-set diff is empty (`SETS IDENTICAL`); only grep enumeration order differs (`ConcurrentDrawers.test.tsx`/`AppShell.tsx` swap positions 6↔7 — a filesystem-walk artifact, not a content change). No new import site; `heroui-forms.test.tsx` absent. |
| 2   | 0 hits, exit 1; `Removed-name import hits: 0 (exit 1)`                                   | 0 hits, exit 1                                                 | **Match** — byte-identical.                                                                                                                                                                                                                                           |
| 3   | `Type-check: exit 0`                                                                     | `Type-check: exit 0`                                           | **Match** — same exit, now proven against the 3.2.1 typings.                                                                                                                                                                                                          |
| 4   | Dot-notation in all three wrappers (`.Control`/`.Indicator`/`.Thumb`/`Modal.*`/`Card.*`) | Same, PLUS `Checkbox.Content` (L201) + `Switch.Content` (L253) | **Match + 1 EXPECTED delta** (see below).                                                                                                                                                                                                                             |

### The single EXPECTED delta (command 4) — do NOT treat as a failure

Command 4 gains `<HeroUICheckbox.Content …>` and `<HeroUISwitch.Content …>` (and their
closing tags), and the `Checkbox.Control`/`Switch.Control` lines shift line numbers.
This is the plan **78-02** migration to the shipped v3.2.0 toggles anatomy (root =
Field wrapper; `*.Content` = the clickable label wrapping `Control` + label text).
Predicted verbatim by `78-02-SUMMARY.md` (§"Phase 75 protocol command #4 — expected new
delta for plan 78-03"), which lists exactly `heroui-forms.tsx:201 Checkbox.Content` /
`heroui-forms.tsx:253 Switch.Content`. Recorded as an explained addition, **not** a
regression.

### False-positive guards applied (nothing below is flagged)

1. **Flat-named `Drawer*` exports in `TweaksDrawer.tsx` are v3** (Nuance 1) —
   `DrawerBackdrop/Content/Dialog/Header/Body/…` is the same export line in the 3.2.1
   dist as in 3.0.5. `TweaksDrawer.tsx` legitimately appears in command 1's list; it is
   **not** a straggler.
2. **`Autocomplete` still EXISTS as a 3.2.1 export** — command 2 is import-evidence
   ("0 imports of the 9 names"), never a removal claim. Its continued existence is not a
   finding.
3. **`heroui-chip.tsx` / `heroui-switch.tsx` / `heroui-tabs.tsx` are lookalikes** with no
   `@heroui/react` import (Nuance 2) — correctly absent from command 1. 78-02 corrected
   the stale `heroui-chip.tsx` docstring (cva + `@radix-ui/react-slot`); it still carries
   the literal `@heroui/react` token in prose, which is why the loose text grep is noise
   and the import-specific grep (8) is authoritative.
4. **`CheckboxRenderProps` is deprecated, not removed** in the 3.2.1 typings (aliased to
   `CheckboxFieldRenderProps`) — a deprecation is not a straggler; type-check exit 0
   confirms no call site breaks on it.
5. **Additive 3.2.x exports** (`Switch.Icon`, expanded Calendar/Table APIs) are not
   regressions — they surface in `list`-style audits, not in these four commands.

### Known blind spot — why these 4 commands are necessary but NOT sufficient

RESEARCH "Critical caveat": the protocol is **blind to the v3.2.0 toggles composition
change.** `tsc` exits 0 either way (toggle children are `ReactNode`), and command 4's
grep matches `Checkbox.Control`/`Switch.Control` whether or not `*.Content` wraps them.
So a passing protocol does not, by itself, prove the toggle label→control click/a11y
association is intact. That is precisely why plan 78-02 committed the behavioral oracle
`heroui-forms.test.tsx`.

**HEROUI-02's real oracle:** `pnpm --dir frontend test run heroui-forms`

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

**Exit code:** 0 — run here (2026-07-03) to bind the blind spot to its test. The 4
behaviors (checkbox label-named toggle, switch label-named toggle, checkbox `Content`
wraps text+control in one clickable label, description renders as a sibling of `Content`)
all pass on the migrated 3.2.1 markup.

### Unexpected deltas

**None.** No new flat-prop straggler, no new removed-name import, no type-check failure.
The contingency path (criterion-3 straggler conversion, or rollback
`git revert 10de0c95 && pnpm install` on an unexplained regression) was **not** triggered.

---

## Verdict table (Phase 75 findings-summary style)

| Requirement                                             | Verdict                                                                         | Evidence line                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- |
| HEROUI-02 — import inventory unchanged                  | **Confirmed on 3.2.1.** 8 import sites, set identical to Phase 75.              | `Import-site count: 8`                 |
| HEROUI-02 — no v3-removed names imported                | **Confirmed.** 0 hits, exit 1.                                                  | `Removed-name import hits: 0 (exit 1)` |
| HEROUI-02 — mechanical conformance                      | **Confirmed on 3.2.1 typings.**                                                 | `Type-check: exit 0`                   |
| HEROUI-02 — compound API present                        | **Confirmed** in all three wrappers; one expected `*.Content` delta from 78-02. | command 4 raw output above             |
| HEROUI-02 — residual flat-prop stragglers               | **0.** No conversion needed.                                                    | (no matches)                           |
| HEROUI-02 — toggles behavioral oracle (blind-spot bind) | **Passed.**                                                                     | `heroui-forms: exit 0, 4/4`            |

**Conclusion:** the Phase 75 confirmation **holds on 3.2.1.** Every command matches its
Phase 75 record modulo the single, pre-predicted `*.Content` delta from plan 78-02.
Straggler count: **0**. HEROUI-02 is closed with a re-derivable, evidence-paired trail
that a future phase (80) can diff against.
