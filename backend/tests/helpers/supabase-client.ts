/**
 * Supabase client helper for backend tests
 * Provides authenticated clients for testing Edge Functions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

/**
 * Create authenticated Supabase client for testing
 */
export function createTestClient(options?: {
  useServiceRole?: boolean;
  userId?: string;
}): SupabaseClient<Database> {
  const key = options?.useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  const client = createClient<Database>(SUPABASE_URL, key);

  // If userId provided, simulate authenticated user
  if (options?.userId && !options?.useServiceRole) {
    // Note: In real tests, you'd use client.auth.setSession() with a valid JWT
    // For now, we'll use service role for testing
  }

  return client;
}

/**
 * Create service role client (bypasses RLS)
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
