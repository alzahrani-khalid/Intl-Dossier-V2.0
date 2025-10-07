import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to call Edge Functions directly via fetch, bypassing the Supabase SDK limitation
 * in test environments where functions.invoke() doesn't properly pass auth headers.
 */
export async function invokeEdgeFunction(
  supabase: SupabaseClient,
  functionName: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error(`No active session: ${sessionError?.message || 'Session not found'}`);
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  const url = `${supabaseUrl}/functions/v1/${functionName}`;

  console.log('🔍 Calling Edge Function:', {
    function: functionName,
    url,
    hasToken: !!session.access_token,
    tokenPreview: session.access_token.substring(0, 50) + '...',
    method: options.method || 'POST'
  });

  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  console.log('📡 Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });

  let data = null;
  let error = null;

  try {
    const responseData = await response.json();
    
    console.log('📦 Response data:', responseData);
    
    if (!response.ok) {
      error = {
        message: responseData.error || responseData.message || `Edge Function returned ${response.status}`,
        status: response.status,
        details: responseData,
      };
    } else {
      data = responseData;
    }
  } catch (e) {
    if (!response.ok) {
      error = {
        message: `Edge Function returned ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    } else {
      throw e;
    }
  }

  return { data, error, status: response.status };
}

/**
 * Helper for GET requests to Edge Functions with path parameters
 */
export async function invokeEdgeFunctionGet(
  supabase: SupabaseClient,
  functionName: string,
  pathParams: string = '',
  queryParams: Record<string, string> = {}
) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error(`No active session: ${sessionError?.message || 'Session not found'}`);
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  
  // Build URL with path and query parameters
  let url = `${supabaseUrl}/functions/v1/${functionName}`;
  if (pathParams) {
    url += `/${pathParams}`;
  }
  
  const queryString = new URLSearchParams(queryParams).toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
  });

  let data = null;
  let error = null;

  try {
    const responseData = await response.json();
    
    if (!response.ok) {
      error = {
        message: responseData.error || responseData.message || `Edge Function returned ${response.status}`,
        status: response.status,
        details: responseData,
      };
    } else {
      data = responseData;
    }
  } catch (e) {
    if (!response.ok) {
      error = {
        message: `Edge Function returned ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    } else {
      throw e;
    }
  }

  return { data, error, status: response.status };
}