#!/usr/bin/env node

/**
 * Apply profiles table migration to Supabase database
 * This script reads the migration file and executes it using the admin client
 */

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../.env.test') });

async function applyMigration() {
  console.log('🔧 Applying profiles table migration...\n');

  // Create admin client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Read migration file
  const migrationPath = resolve(__dirname, '../../supabase/migrations/20251017030000_create_profiles.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file:', migrationPath);
  console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

  try {
    // Execute migration using Supabase admin client
    // Note: We need to execute this as raw SQL
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('✅ profiles table created');
    console.log('✅ RLS policies configured');
    console.log('✅ Indexes created');
    console.log('✅ Trigger configured\n');

    // Verify table exists
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);

    if (tablesError) {
      console.warn('⚠️  Warning: Could not verify table:', tablesError.message);
    } else {
      console.log('✅ Verified: profiles table is accessible\n');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('🎉 Migration complete!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
