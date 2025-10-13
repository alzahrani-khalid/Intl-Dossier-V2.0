// Fix RLS policy to allow dossier sync
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkrcjzdemdmwhearhfgg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLS() {
  console.log('Fixing RLS policy...');

  // Drop old policy
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: 'DROP POLICY IF EXISTS "view_dossiers_by_clearance" ON dossiers;'
  });

  if (dropError && !dropError.message.includes('does not exist')) {
    console.error('Error dropping policy:', dropError);
  }

  // Create new simpler policy
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "view_dossiers_authenticated"
      ON dossiers FOR SELECT
      TO authenticated
      USING (sensitivity_level IN ('low', 'medium'));
    `
  });

  if (createError) {
    console.error('Error creating policy:', createError);
    process.exit(1);
  }

  console.log('✅ RLS policy fixed! Authenticated users can now see low/medium sensitivity dossiers.');
}

fixRLS();
