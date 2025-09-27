import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client with service role key for backend operations
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Anonymous client for public operations
export const supabaseAnon: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// Helper function to create a client with a specific user's JWT
export const createSupabaseClient = (jwt?: string): SupabaseClient => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: jwt ? {
          Authorization: `Bearer ${jwt}`
        } : {}
      }
    }
  );
};

export default supabaseAdmin;