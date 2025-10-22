const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing required environment variables.');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.test');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('Checking remote database tables...\n');
  
  const tables = [
    'intake_entity_links',
    'link_audit_logs', 
    'ai_link_suggestions',
    'intake_embeddings',
    'entity_embeddings',
    'profiles',
    'organizations',
    'intake_tickets',
    'dossiers',
    'positions'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ ${table}: NOT FOUND (${error.message})`);
      } else {
        console.log(`✅ ${table}: EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ERROR (${err.message})`);
    }
  }
}

checkTables().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
