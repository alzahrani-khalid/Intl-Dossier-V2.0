# Impl brief — L8-shared-client (centralized client infra) · priority 9 (error-surfacing / a11y, app-wide)

**Self-contained worker order. Atomic commits, conventional messages, NO push, NO PR.**

**Files you own (2) — touch ONLY these (both are shared by the whole app; nothing else may edit them):**
`frontend/src/lib/api-client.ts` · `frontend/src/components/ui/form.tsx`.

> ⚠ Blast radius: `api-client.ts` is consumed by ~22 repositories/services; `ui/form.tsx`
> (`FormMessage`) by every RHF form. Keep the public function signatures intact — change behavior,
> not call shapes — so the other lanes' files need no edits.

---

### E-3 ≡ S1 (HIGH) — api-client discards every server error body

`api-client.ts:60-61` (`handleResponse`) and `:88-89` (`apiGetBlob`) do
`throw new Error('API error ${response.status}: ${response.statusText}')` and never read the JSON
body. Every Edge Function returns a structured body (`{ message_en, message, details:[...] }`), all
dropped → users see `API error 400: Bad Request`, never the localized/field-level reason. Fix:

1. On `!response.ok`, attempt `const body = await response.json().catch(() => null)`.
2. Throw a typed error carrying the parsed info, e.g.:
   ```ts
   export class ApiError extends Error {
     status: number
     details?: unknown
     constructor(message: string, status: number, details?: unknown) {
       super(message)
       this.name = 'ApiError'
       this.status = status
       this.details = details
     }
   }
   ```
   `const message = body?.message ?? body?.message_en ?? body?.error ?? \`API error ${response.status}: ${response.statusText}\``;
`throw new ApiError(message, response.status, body?.details)`.
3. Apply the same parse to the `apiGetBlob` error path (`:88-89`).
   Keep `apiGet`/`apiPost`/etc. signatures and success paths unchanged. Export `ApiError` so forms can
   surface `details` per-field (consumers adopt it incrementally — no other-lane edits required now).
   Commit: `fix(api-client): surface server error body + details via ApiError (E-3/S1)`.

### E-10 ≡ S6 (MED) — FormMessage errors not announced

`ui/form.tsx:158-167` renders the error as a plain `<p id={formMessageId}>` with no `role="alert"` /
no `aria-live`, so on submit the error is never announced to screen-reader users (field association via
`aria-describedby`/`aria-invalid` is already correct). Add `role="alert"` to the `FormMessage`
`<p>` (or wrap in an `aria-live="polite"` region). One-line systemic a11y win across every RHF form.
Commit: `a11y(form): announce FormMessage errors via role=alert (E-10/S6)`.

---

## Verify

- `cd frontend && pnpm tsc --noEmit` (must stay green — this file is imported everywhere).
- `pnpm exec eslint src/lib/api-client.ts src/components/ui/form.tsx`.
- `pnpm --filter frontend build` (recommended given the blast radius) — confirm no consumer breaks on
  the changed throw shape (you only widened the error; callers catching `Error` still work).
- Optional: `pnpm --filter frontend test` for any api-client / form tests.
- **E-3 acceptance:** trigger a 400 from any Edge Function (e.g. an intake create missing a field) →
  the surfaced error message is the server's localized reason, not `API error 400: Bad Request`.
- **E-10 acceptance:** a Zod-failed field renders an error node with `role="alert"`.

## Done-when

Both items applied; tsc/eslint/build green; `ApiError` exported and the blob path also parses bodies;
`FormMessage` announces errors; commits atomic; nothing pushed.
