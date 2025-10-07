// Quick test to verify JWT token and Edge Function auth
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function testAuth() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  console.log('🔍 Testing Authentication Flow\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using credentials: kazahrani@stats.gov.sa / itisme\n');

  // Create client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Sign in
  console.log('1️⃣ Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'kazahrani@stats.gov.sa',
    password: 'itisme'
  });

  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message);
    return;
  }

  console.log('✅ Sign in successful!');
  console.log('   User ID:', signInData.user.id);
  console.log('   Email:', signInData.user.email);
  console.log('   Email Confirmed:', signInData.user.email_confirmed_at ? 'YES' : 'NO');
  console.log('   Token (first 50 chars):', signInData.session.access_token.substring(0, 50) + '...\n');

  // Verify session
  console.log('2️⃣ Verifying session...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('❌ Session verification failed:', userError.message);
    return;
  }
  
  console.log('✅ Session verified!');
  console.log('   User from session:', user.email, '\n');

  // Test Edge Function call
  console.log('3️⃣ Testing Edge Function call (intake-health)...');
  const { data: healthData, error: healthError } = await supabase.functions.invoke('intake-health');

  if (healthError) {
    console.error('❌ Edge Function call failed!');
    console.error('   Status:', healthError.context?.status);
    console.error('   Message:', healthError.message);
    console.error('   Response:', healthError.context?.statusText);
    
    // Try to get response body
    if (healthError.context?.body) {
      try {
        const reader = healthError.context.body.getReader();
        const { value } = await reader.read();
        const text = new TextDecoder().decode(value);
        console.error('   Body:', text);
      } catch (e) {
        console.error('   Could not read response body');
      }
    }
    return;
  }

  console.log('✅ Edge Function call successful!');
  console.log('   Response:', JSON.stringify(healthData, null, 2));
}

testAuth().catch(console.error);
