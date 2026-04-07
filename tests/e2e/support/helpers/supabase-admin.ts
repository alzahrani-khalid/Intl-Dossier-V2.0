import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Tables that E2E runs create rows in. Cleanup is scoped to rows whose
 * human-readable name/title starts with `e2e-` so production data is safe.
 */
const E2E_CLEANUP_TABLES: ReadonlyArray<{ table: string; column: string }> = [
  { table: 'dossiers', column: 'name' },
  { table: 'work_items', column: 'title' },
  { table: 'engagements', column: 'title' },
  { table: 'calendar_events', column: 'title' },
  { table: 'notifications', column: 'title' },
]

let cachedClient: SupabaseClient | null = null

/**
 * Lazily construct a Supabase service-role client for E2E cleanup.
 *
 * SECURITY: The service-role key bypasses RLS and MUST NEVER be imported
 * from production code. This helper lives under `tests/e2e/support/` and
 * should only be consumed by Playwright fixtures and setup scripts.
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (cachedClient !== null) {
    return cachedClient
  }

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (typeof url !== 'string' || url.length === 0) {
    throw new Error(
      'SUPABASE_URL is not set. Copy .env.test.example to .env.test and fill in values.',
    )
  }
  if (typeof serviceKey !== 'string' || serviceKey.length === 0) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Required for E2E cleanup; never ship to client bundles.',
    )
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

/**
 * Guard against running destructive cleanup against production hosts.
 * Cleanup is only permitted when SUPABASE_URL points at a non-production project.
 */
const assertSafeTarget = (): void => {
  const url = process.env.SUPABASE_URL ?? ''
  const forbidden = ['prod', 'production']
  const lowered = url.toLowerCase()
  for (const needle of forbidden) {
    if (lowered.includes(needle)) {
      throw new Error(
        `Refusing to run E2E cleanup: SUPABASE_URL appears to be production (${url}).`,
      )
    }
  }
}

/**
 * Best-effort cleanup of E2E-created rows. Errors are logged but never thrown
 * so a flaky cleanup run cannot mask the actual test outcome.
 */
export const cleanupE2eEntities = async (prefix: string = 'e2e-'): Promise<void> => {
  try {
    assertSafeTarget()
  } catch (err) {
    console.warn('[e2e-cleanup] aborted:', (err as Error).message)
    return
  }

  let client: SupabaseClient
  try {
    client = getSupabaseAdmin()
  } catch (err) {
    console.warn('[e2e-cleanup] supabase client unavailable:', (err as Error).message)
    return
  }

  const pattern = `${prefix}%`

  for (const { table, column } of E2E_CLEANUP_TABLES) {
    try {
      const { error } = await client.from(table).delete().like(column, pattern)
      if (error !== null) {
        console.warn(`[e2e-cleanup] ${table}.${column} like ${pattern} failed:`, error.message)
      }
    } catch (err) {
      console.warn(`[e2e-cleanup] unexpected error on ${table}:`, (err as Error).message)
    }
  }
}
