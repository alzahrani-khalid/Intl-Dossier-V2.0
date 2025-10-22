const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zkrcjzdemdmwhearhfgg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmNqemRlbWRtd2hlYXJoZmdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgyNjQ5MCwiZXhwIjoyMDc0NDAyNDkwfQ.MJnEz1fi5Ek2Ryepf6VjliOTE7Sz0Y-lWQtA1YwpB_A'
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
