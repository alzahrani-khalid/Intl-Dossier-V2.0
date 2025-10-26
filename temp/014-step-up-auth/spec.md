# 014 — Step‑Up Authentication — Spec

Purpose: require recent MFA for sensitive operations (e.g., position approval, dossier classification changes, MoU transitions).

## Goals

- Middleware to enforce “recent MFA” within N minutes on specific routes.
- UI prompt to complete MFA when required; smooth resume.

## API & Middleware

- `requireStepUp({ withinMinutes: 15, reason: 'Approve position' })` wrapper.
- Store `last_mfa_verified_at` in Redis keyed by user; set on successful MFA verify.
- If missing/stale → 401 `{ code: 'STEP_UP_REQUIRED' }`.

## UI

- Intercept 401 STEP_UP_REQUIRED → open MFA modal (existing components) → retry action.

## Acceptance

- Approve position without recent MFA prompts and then succeeds; audit logs record step‑up.
