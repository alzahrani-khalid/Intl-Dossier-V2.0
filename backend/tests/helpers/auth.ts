import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedSession: any = null;

export async function getAuthenticatedClient(): Promise<SupabaseClient> {
  // Return cached client if available
  if (cachedClient && cachedSession) {
    // Verify session is still valid
    const { data: { session: currentSession } } = await cachedClient.auth.getSession();
    if (currentSession?.access_token) {
      return cachedClient;
    }
    // Session expired, clear cache
    cachedClient = null;
    cachedSession = null;
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  // Use real user credentials for testing
  const testEmail = process.env.TEST_USER_EMAIL || 'kazahrani@stats.gov.sa';
  const testPassword = process.env.TEST_USER_PASSWORD || 'itisme';

  try {
    // Create client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Sign in with real user credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError || !signInData?.session) {
      throw new Error(`Failed to authenticate: ${signInError?.message || 'No session returned'}`);
    }

    if (!signInData.session.access_token) {
      throw new Error('No access token in session');
    }

    console.log('✓ Test user signed in successfully:', testEmail);

    // Small delay to ensure session is fully established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the session is working
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error(`Session verification failed: ${userError?.message || 'No user'}`);
    }

    console.log('✓ Session verified for user:', user.email);

    // Cache for reuse
    cachedClient = supabase;
    cachedSession = signInData.session;

    return supabase;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export async function getTestUser() {
  const supabase = await getAuthenticatedClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Failed to get test user after authentication');
  }
  
  return user;
}

// Helper to clean up test data
export async function cleanupTestTickets(supabase: SupabaseClient, ticketIds: string[]) {
  if (ticketIds.length === 0) return;
  
  try {
    await supabase
      .from('intake_tickets')
      .delete()
      .in('id', ticketIds);
  } catch (error) {
    console.warn('Failed to cleanup test tickets:', error);
  }
}

// Clear cache between test runs if needed
export function clearAuthCache() {
  cachedClient = null;
  cachedSession = null;
}