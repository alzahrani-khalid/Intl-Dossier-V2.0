// T016b: Audit log retention monitoring script
// Purpose: Alert if logs older than 7 years exist without archival
// Run via: npm run check-audit-retention

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ArchivalEligibleLog {
  id: string;
  link_id: string;
  intake_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string;
  details: Record<string, unknown>;
  timestamp: string;
  age: string;
}

async function checkAuditRetention() {
  console.log('🔍 Checking audit log retention compliance...\n');

  try {
    // Query the archival_eligible view
    const { data: eligibleLogs, error } = await supabase
      .from('link_audit_logs_archival_eligible')
      .select('*')
      .limit(100);

    if (error) {
      console.error('❌ Error querying audit logs:', error.message);
      process.exit(1);
    }

    if (!eligibleLogs || eligibleLogs.length === 0) {
      console.log('✅ No audit logs older than 7 years found.');
      console.log('   Retention policy is in compliance.\n');
      return;
    }

    // Alert: Logs found that need archival
    console.log(`⚠️  WARNING: ${eligibleLogs.length} audit logs are older than 7 years and need archival!\n`);

    // Group by age ranges for reporting
    const ageRanges = {
      '7-8 years': 0,
      '8-9 years': 0,
      '9-10 years': 0,
      '10+ years': 0,
    };

    eligibleLogs.forEach((log: ArchivalEligibleLog) => {
      const ageYears = parseAgeInYears(log.age);
      if (ageYears < 8) ageRanges['7-8 years']++;
      else if (ageYears < 9) ageRanges['8-9 years']++;
      else if (ageYears < 10) ageRanges['9-10 years']++;
      else ageRanges['10+ years']++;
    });

    console.log('📊 Age Distribution:');
    Object.entries(ageRanges).forEach(([range, count]) => {
      if (count > 0) {
        console.log(`   ${range}: ${count} logs`);
      }
    });

    console.log('\n📋 Oldest 10 logs:');
    eligibleLogs.slice(0, 10).forEach((log: ArchivalEligibleLog) => {
      console.log(`   - ID: ${log.id}, Age: ${log.age}, Action: ${log.action}`);
    });

    console.log('\n📖 Next Steps:');
    console.log('   1. Review archival policy in docs/compliance/audit-log-retention.md');
    console.log('   2. Archive logs to cold storage (S3 Glacier, Azure Archive, etc.)');
    console.log('   3. Verify archival backup before deletion');
    console.log('   4. Document archival process with timestamps\n');

    // Exit with warning code
    process.exit(2);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

function parseAgeInYears(ageString: string): number {
  // Parse PostgreSQL interval format: "X years Y mons Z days"
  const yearsMatch = ageString.match(/(\d+)\s+years?/);
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
  return years;
}

// Run the check
checkAuditRetention().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
