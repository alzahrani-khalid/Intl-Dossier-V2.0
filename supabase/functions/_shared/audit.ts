// Shared audit-write helper for Edge Functions — writes `public.audit_logs`.
//
// WARNING — TWO TABLES, TWO RUNTIMES. This helper is for `audit_logs` (PLURAL)
// only. The backend Express service writes `audit_log` (SINGULAR), which is a
// DIFFERENT table with a different column set: the singular table has a NOT NULL
// `tenant_id` and an `additional_context` column that this one does not have,
// and this one has a NOT NULL `user_role` that the singular one does not.
// Pointing either helper at the other table drops every row it writes.
//
// RLS posture, derived live 2026-08-16 against staging `zkrcjzdemdmwhearhfgg`:
// the INSERT policy is `with_check (system_operation('any') OR user_id = auth.uid())`,
// where `system_operation` means "the JWT role claim is service_role". So a
// service-role client passes unconditionally, while a JWT-scoped client may
// insert ONLY rows whose `user_id` equals its own `auth.uid()`. Callers holding
// a caller-scoped client must therefore pass the CALLER's uid as `user_id`,
// never a third party's — put the third party in `entity_id`.
//
// Column set below is the live one, derived 2026-08-16 from
// `information_schema.columns`. `user_role` is NOT NULL with no default, so it
// is a required field of the entry, not an optional one.
//
// Contract: this function NEVER throws. It returns a result union, so the caller
// decides whether a failed audit write is a precondition of its action (fail the
// action) or log-and-continue. Either way the failure is already loud — a failed
// write is console.error-ed here before it is returned.

/** The columns of `public.audit_logs` a caller may supply. */
export interface AuditLogEntry {
  /** NOT NULL. The kind of thing acted on, e.g. 'user', 'position'. */
  entity_type: string
  /** NOT NULL (uuid). The id of the thing acted on. */
  entity_id: string
  /** NOT NULL. The action performed, e.g. 'role_change_request'. */
  action: string
  /** NOT NULL (uuid). The ACTING user. Under a JWT-scoped client RLS requires
   * this to equal auth.uid() — see the header. */
  user_id: string
  /** NOT NULL, no default. The acting user's role at the time of the action. */
  user_role: string
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  required_mfa?: boolean
  mfa_verified?: boolean
  mfa_method?: string | null
  correlation_id?: string | null
  session_id?: string | null
}

export type AuditWriteResult = { ok: true } | { ok: false; error: string }

/** Structural client type — deliberately NOT `SupabaseClient` imported from one
 * specifier, because the 27 call sites import their client from several
 * different ones (jsr:, npm:, esm.sh) and a nominal type would not unify. */
export interface AuditCapableClient {
  from(table: string): {
    insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>
  }
}

const OPTIONAL_COLUMNS = [
  'old_values',
  'new_values',
  'ip_address',
  'user_agent',
  'required_mfa',
  'mfa_verified',
  'mfa_method',
  'correlation_id',
  'session_id',
] as const

/**
 * Insert one row into `public.audit_logs`, naming only real columns.
 *
 * @param client  a Supabase client — service-role or caller-scoped (see header)
 * @param entry   the row; the five required fields are the table's NOT NULLs
 * @param context short label for the log line, e.g. the edge function's name
 */
export async function writeAuditLog(
  client: AuditCapableClient,
  entry: AuditLogEntry,
  context?: string,
): Promise<AuditWriteResult> {
  const label = context ?? `${entry.entity_type}:${entry.action}`

  // Built key-by-key from the live column set so no caller-side extra key can
  // reach PostgREST — an unknown key fails the WHOLE insert with PGRST204,
  // which is how this table reached 0 rows against 36 writers.
  const row: Record<string, unknown> = {
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    action: entry.action,
    user_id: entry.user_id,
    user_role: entry.user_role,
  }
  for (const column of OPTIONAL_COLUMNS) {
    const value = entry[column]
    if (value !== undefined) row[column] = value
  }

  try {
    const { error } = await client.from('audit_logs').insert(row)
    if (error) {
      console.error(`AUDIT-ZERO-01 write failed: ${label} ${error.message}`)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    console.error(`AUDIT-ZERO-01 write failed: ${label} ${message}`)
    return { ok: false, error: message }
  }
}
