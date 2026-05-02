# Deferred items — Phase 42

## From 42-03 (CSS port + density migration shim)

- `frontend/src/design-system/tokens/applyTokens.ts:29` — pre-existing TS2345
  error from Phase 33 ("Argument of type 'string | undefined' is not assignable
  to parameter of type 'string | null'"). Out of scope for 42-03. The plan's
  verify expected zero design-system tsc errors but this error predates the
  plan. No code touched in 42-03 referenced applyTokens.ts.
