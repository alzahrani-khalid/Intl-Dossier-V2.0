# 0002 — Deferred data-entry decisions (A-7, D-15, D-19)

## Status

Accepted (2026-06-28)

## Context

The data-entry quality sweep surfaced three NEEDS-DECISION items that were
deliberately deferred rather than implemented in the sweep. This ADR records
the resolutions so future contributors do not re-open them by accident — by
adding an edit control, a half-implemented multi-admin path, or by shipping
MFA to production without closing the at-rest gap.

Each item below is self-contained: problem, decision, rationale, and the
condition that triggers revisiting it.

---

## A-7 — Country flag / population / area are derived or seed-managed, not user-editable

### Context

The `countries` extension table carries `flag_url`, `population`,
`area_sq_km`, and `subregion` columns (all nullable — see
`frontend/src/types/database.types.ts:19-55` and the mirror in
`backend/src/types/database.types.ts`). None of these are exposed in the
country create flow. The create wizard schema only collects `iso_code_2`,
`iso_code_3`, `capital_en`, `capital_ar`, and `region`
(`frontend/src/components/dossier/wizard/schemas/country.schema.ts`), and the
submit mapping in
`frontend/src/components/dossier/wizard/config/country.config.ts`
(`filterExtensionData`) writes back only those same five fields.

Flags are not stored per-record as a user-entered URL — they are derived from
the ISO code at render time. `DossierGlyph.tsx:126` resolves
`href={`/assets/flags/${key}.svg`}` from the country's ISO code via the
`FlagCodes` map (`frontend/src/components/signature-visuals/FlagCodes.ts`,
which documents the `/assets/flags/{code}.svg` asset convention), and
`frontend/src/components/dossier/ExpandableDossierCard.tsx:104` builds the same
`/assets/flags/${countryCode}.svg` path. Population, area, and subregion are
reference attributes that arrive via seed/import data, not analyst entry.

### Decision

Keep `flag_url`, `population`, `area_sq_km`, and `subregion` as
derived/seed-managed. Do not add create or edit controls for them. The flag is
a pure function of the ISO code and must continue to derive from it; the
demographic/geographic attributes are seed/import-managed reference data.

### Consequences

- The country create form stays small and analyst-focused (identity + ISO +
  capital + region) rather than turning into a data-encyclopedia form.
- Flags never drift from the ISO code, and there is no per-record broken-URL
  surface to maintain.

Reopen clause: revisit if a verified product requirement appears for
analyst-entered demographics or a custom per-country flag override (for
example, a sub-national or disputed-territory flag the ISO asset set does not
cover). A reopen adds the field to `country.schema.ts` + `country.config.ts`
together and lands as a successor ADR.

---

## D-15 — AI-settings writes are scoped to a single admin's organization

### Context

The admin AI-settings page resolves the write-target organization from a
server-trusted source: `resolveTrustedOrgId()` reads
`public.users.default_organization_id` for the authenticated user
(`frontend/src/routes/_protected/admin/ai-settings.tsx:138-152`). Both the read
query and the upsert mutation key on that single org id
(`ai-settings.tsx:167-178` and `:199-223`, upserting
`organization_llm_policies` on `onConflict: 'organization_id'`). Tenant
isolation is enforced independently at the DB layer by the
`organization_llm_policies` RLS policies, which gate on
`organization_members` membership.

Today the deployment has effectively one admin, so the write-org is that
admin's `default_organization_id`. There is no multi-admin / multi-org
selector — the page always reads and writes exactly one org's policy row.

### Decision

Defer multi-admin scoping. Keep the single server-trusted
`default_organization_id` resolution as-is. When a second admin is introduced,
provision them by seeding the data layer — not by deriving the write-org from
`users.role`:

1. Insert an `organization_members` row (role `admin`/`owner`) binding the new
   admin to their organization, so the `organization_llm_policies` RLS policy
   admits their reads/writes.
2. Set that admin's `public.users.default_organization_id` to the org whose
   policy they should edit.

### Consequences

- The current path is secure and simple: the write-org comes from a
  service-role-written column (never client-spoofable), and RLS fail-closes any
  cross-org access regardless of client tampering.
- Deriving the write-org from `users.role` is explicitly rejected: `role` says
  _what_ a user may do, not _which org_ they administer, and would re-introduce
  exactly the ambient-authority ambiguity the `default_organization_id`
  resolution was added to remove.

Reopen clause: revisit when a second admin (or genuine multi-org
administration) is added. The reopen seeds `organization_members` +
`default_organization_id` per admin as above, and only then considers a UI
org-switcher.

---

## D-19 — MFA secret is stored in plaintext at rest (PRE-GA GATING REQUIREMENT)

### Context

The TOTP secret is persisted as a plaintext base32 string. The canonical
runtime column is `public.users.mfa_secret`
(`supabase/migrations/001_create_users.sql:20`, `VARCHAR(255)`, commented
"TOTP secret for MFA when enabled"). Every read and write treats it as
plaintext:

- Write (enable): `backend/src/services/auth.service.ts:340`
  (`mfa_secret: setupData.secret`) and the edge-function equivalent
  `supabase/functions/setup-mfa/index.ts:164` (`mfa_secret: secret`).
- Clear (disable): `backend/src/services/auth.service.ts:388`
  (`mfa_secret: null`).
- Read (verify): `backend/src/services/auth.service.ts:632-640`
  (`.select('mfa_secret')` → `verifyMFACode(user.mfa_secret, code)`), the
  login path at `auth.service.ts:138`, and the edge functions
  `supabase/functions/verify-mfa-setup/index.ts:73,98` and
  `supabase/functions/reset-password/index.ts:96,108`
  (`OTPAuth.Secret.fromBase32(...)`).

Now that TOTP verification is real (prior D-3 hardening replaced the accept-all
stub), the plaintext secret at rest is the remaining weak link: anyone with
read access to the `users` row — a leaked service-role key, a backup, or a SQL
log — can mint valid TOTP codes for that account.

Note a documentation trap: a _separate_ `auth.users.mfa_secret` column added by
`supabase/migrations/20251011214940_extend_users_table.sql:25` carries the
comment "MFA TOTP secret (encrypted)" (`:83`). That comment is aspirational —
no encryption is applied anywhere in the code, and the runtime path uses
`public.users.mfa_secret`, not `auth.users`. Do not read that comment as
evidence the secret is encrypted.

### Decision

Adopt envelope / at-rest encryption for the MFA secret (pgsodium, Supabase
Vault, or an external KMS) **before MFA goes GA to real production users**.
This is a PRE-GA GATING REQUIREMENT — a blocker that must be resolved before
MFA ships to production users, not a nice-to-have.

It is acceptable to defer this short-term _only while MFA is not yet GA_. The
verification path must read the secret through a decrypt step (or a
verify-without-exposing primitive) so the plaintext base32 value never lands in
`public.users.mfa_secret`.

### Consequences

- Closing this turns the `users` row from "holds a usable second factor" into
  "holds an opaque ciphertext", so a row/key/backup leak no longer yields
  working TOTP codes.
- The write sites (`auth.service.ts:340`, `setup-mfa/index.ts:164`) and the
  read/verify sites (`auth.service.ts:138,632-640`,
  `verify-mfa-setup/index.ts:98`, `reset-password/index.ts:108`) must all route
  through the chosen encryption primitive together — a partial rollout that
  encrypts on write but reads the old plaintext path breaks verification.
- The misleading `auth.users.mfa_secret` "(encrypted)" comment should be
  corrected or removed when this work lands so it stops implying a guarantee
  the schema never provided.

Reopen clause: this is not "reopen if" — it is "must close before MFA GA". The
gate is lifted only when the secret is encrypted at rest end-to-end (write,
read, verify) and the misleading column comment is corrected.

## References

- `frontend/src/components/dossier/wizard/schemas/country.schema.ts` — country
  create schema (A-7; no flag/population/area/subregion fields)
- `frontend/src/components/dossier/wizard/config/country.config.ts` —
  `filterExtensionData` submit mapping (A-7)
- `frontend/src/components/signature-visuals/DossierGlyph.tsx:126` +
  `FlagCodes.ts` — flag derived from ISO code (A-7)
- `frontend/src/types/database.types.ts:19-55` — seed-managed `countries`
  columns (A-7)
- `frontend/src/routes/_protected/admin/ai-settings.tsx:138-223` —
  `resolveTrustedOrgId` + single-org read/upsert (D-15)
- `supabase/migrations/001_create_users.sql:20` — `public.users.mfa_secret`
  plaintext column (D-19)
- `backend/src/services/auth.service.ts:138,340,388,632-640` — MFA secret
  write/clear/read path (D-19)
- `supabase/functions/setup-mfa/index.ts:164`,
  `supabase/functions/verify-mfa-setup/index.ts:98`,
  `supabase/functions/reset-password/index.ts:108` — edge-function MFA secret
  write/verify (D-19)
- `supabase/migrations/20251011214940_extend_users_table.sql:83` — misleading
  `auth.users.mfa_secret` "(encrypted)" comment (D-19)
