// Positive-failure fixture for scripts/check-duplicate-rtl.mjs.
//
// This file lives OUTSIDE frontend/src so the real-tree lint run never scans it
// (it is also outside every eslint/tsc/build glob — the sibling tools/*-fixtures
// dirs prove the precedent). The dedicated CI positive-failure step invokes the
// script with bash negation pointed at THIS directory and asserts a non-zero
// exit — proving the guard actually catches the shadcn `migrate rtl` #9891
// re-run signature (an exact-duplicate `rtl:*` utility inside one className).
//
// @ts-nocheck — fixture is parsed as text by the check, never compiled.

export function DuplicateRtlBad(): JSX.Element {
  // Two IDENTICAL rtl: tokens in ONE string literal — the #9891 non-idempotent
  // re-run appends the same variant twice. The check MUST reject this.
  return <div className="flex items-center rtl:space-x-reverse rtl:space-x-reverse gap-2" />
}
