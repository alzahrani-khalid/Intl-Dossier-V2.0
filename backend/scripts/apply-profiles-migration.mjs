#!/usr/bin/env node

/**
 * Apply profiles table migration to Supabase database
 * Uses direct PostgreSQL connection via pg library
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.test
dotenv.config({ path: resolve(__dirname, '../.env.test') });

async function applyMigration() {
  console.log('🔧 Applying profiles table migration...\n');

  // Construct connection string
  // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  const connectionString = process.env.SUPABASE_URL
    ? `postgresql://postgres:itisme@db.zkrcjzdemdmwhearhfgg.supabase.co:5432/postgres`
    : null;

  if (!connectionString) {
    console.error('❌ SUPABASE_URL not found in .env.test');
    process.exit(1);
  }

  console.log('🔗 Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));

  // Create PostgreSQL client
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = resolve(__dirname, '../../supabase/migrations/20251017030000_create_profiles.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file:', migrationPath);
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

    // Execute migration
    console.log('⚙️  Executing migration...\n');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');
    console.log('✅ profiles table created');
    console.log('✅ RLS policies configured');
    console.log('✅ Indexes created');
    console.log('✅ Trigger configured\n');

    // Verify table exists
    const result = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verified: profiles table structure:\n');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      console.log('');
    } else {
      console.warn('⚠️  Warning: Could not find profiles table in schema');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.detail) console.error('Details:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
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
