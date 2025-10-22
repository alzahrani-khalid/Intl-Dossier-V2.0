const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zkrcjzdemdmwhearhfgg.supabase.co',
  '***REDACTED_JWT***'
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
      const { data, error } = await supabase
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
