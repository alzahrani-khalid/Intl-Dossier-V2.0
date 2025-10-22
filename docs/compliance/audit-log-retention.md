# Audit Log Retention Policy

**Policy ID**: AUD-001
**Effective Date**: 2025-01-18
**Review Cycle**: Annual
**Owner**: Data Governance Team

## 1. Purpose

This policy defines the retention requirements for audit logs in the Intake Entity Linking System to ensure compliance with regulatory requirements and maintain data integrity for forensic analysis.

## 2. Scope

This policy applies to:
- `link_audit_logs` table: All entity linking operations (create, update, delete, restore, migrate)
- All personnel with access to audit log data
- All archival and deletion processes

## 3. Retention Requirements

### 3.1 Minimum Retention Period
**7 years** from the date of log creation (compliance requirement)

### 3.2 Immutability
- Audit logs are **immutable** (no UPDATE or DELETE permissions granted)
- Database-level enforcement via REVOKE statements
- CHECK constraint prevents deletion before 7 years
- Only SECURITY DEFINER triggers can insert into audit logs

### 3.3 Storage Requirements
- **Active storage**: PostgreSQL database (0-7 years)
- **Cold storage**: Cloud archive tier (7+ years) - S3 Glacier, Azure Archive Storage, or equivalent
- **Backup**: 3-2-1 backup strategy (3 copies, 2 different media, 1 offsite)

## 4. Monitoring and Compliance

### 4.1 Automated Monitoring
Run the audit retention check script monthly:

```bash
npm run check-audit-retention
```

**Alert Conditions**:
- Exit code 0: Compliance OK (no logs older than 7 years)
- Exit code 2: Warning (logs older than 7 years need archival)
- Exit code 1: Error (monitoring script failure)

### 4.2 Compliance Verification
Query the archival-eligible view:

```sql
SELECT
  COUNT(*) as logs_eligible_for_archival,
  MIN(timestamp) as oldest_log,
  MAX(timestamp) as newest_eligible_log
FROM link_audit_logs_archival_eligible;
```

### 4.3 Reporting
- **Monthly**: Automated check via CI/CD pipeline
- **Quarterly**: Manual review of archival process
- **Annually**: Policy review and update

## 5. Archival Process

### 5.1 Preparation (Before 7-Year Mark)
1. **Identify eligible logs** (6 months before 7-year mark):
   ```sql
   SELECT * FROM link_audit_logs
   WHERE timestamp < NOW() - INTERVAL '6.5 years'
   ORDER BY timestamp ASC;
   ```

2. **Export to cold storage**:
   - Format: JSONL (JSON Lines) or Parquet for compression
   - Include all fields: `id, link_id, intake_id, entity_type, entity_id, action, performed_by, details, timestamp`
   - Verify checksum after export

3. **Document archival**:
   - Archival timestamp
   - Storage location (S3 bucket, Azure container, etc.)
   - Checksum verification
   - Number of records archived

### 5.2 Archival Execution
1. **Backup verification**: Ensure 3-2-1 backup strategy is in place
2. **Export validation**: Verify all records exported successfully
3. **Cold storage upload**: Upload to glacier/archive tier
4. **Retention tag**: Apply 7-year retention tag to cold storage objects
5. **Database cleanup**: (MANUAL ONLY - requires special permissions)
   ```sql
   -- DO NOT RUN without DBA approval and verified backups
   -- DELETE FROM link_audit_logs
   -- WHERE id IN (SELECT id FROM link_audit_logs_archival_eligible);
   ```

### 5.3 Post-Archival Verification
1. **Verify cold storage**: Confirm files are accessible
2. **Test restore**: Restore sample records to verify integrity
3. **Update inventory**: Document archived records in archival inventory spreadsheet
4. **Audit trail**: Log archival action in `system_audit_logs` table

## 6. Retrieval Process

### 6.1 Active Logs (0-7 Years)
Direct database query:
```sql
SELECT * FROM link_audit_logs
WHERE link_id = 'xxx-xxx-xxx';
```

### 6.2 Archived Logs (7+ Years)
1. **Request approval**: Submit archival retrieval request to Data Governance
2. **Locate archive**: Query archival inventory for storage location
3. **Restore from cold storage**: Initiate glacier retrieval (may take hours)
4. **Temporary access**: Load into temporary table for analysis
5. **Cleanup**: Remove temporary data after investigation

## 7. Legal Hold and Exceptions

### 7.1 Legal Hold
If audit logs are subject to legal hold:
- **Do NOT delete** regardless of age
- Tag records with legal hold identifier
- Document hold reason and case number
- Hold remains until legal counsel approval

### 7.2 Regulatory Exceptions
Some jurisdictions may require longer retention:
- **EU GDPR**: 7 years (default)
- **Financial sector**: 10 years (extended retention)
- **Healthcare**: Varies by jurisdiction

Consult legal counsel for specific requirements.

## 8. Access Control

### 8.1 Read Access
- **Triage Officers**: Own organization's logs only (RLS enforced)
- **Stewards**: Cross-organization logs for governance
- **Admins**: All logs for system administration
- **Auditors**: Read-only access to all logs (temporary, time-limited)

### 8.2 Write Access
- **No users**: Only triggers can insert (SECURITY DEFINER)
- **No users**: UPDATE and DELETE revoked at database level
- **DBAs**: Emergency access for archival (documented and approved)

## 9. Performance Considerations

### 9.1 Query Optimization
- Index: `idx_link_audit_logs_timestamp` (DESC) for date range queries
- Index: `idx_link_audit_logs_intake` for intake-specific queries
- Partitioning: Consider table partitioning by year after 1M+ records

### 9.2 Archival Triggers
- Archive logs when `link_audit_logs` table exceeds 500K records
- Archive logs older than 6.5 years proactively
- Monitor table size weekly via `pg_total_relation_size()`

## 10. Disaster Recovery

### 10.1 Active Logs
- **RPO**: 15 minutes (continuous replication)
- **RTO**: 4 hours (database restore from backup)
- **Backup frequency**: Continuous (Supabase automatic backups)

### 10.2 Archived Logs
- **RPO**: 24 hours (daily cold storage replication)
- **RTO**: 48 hours (glacier retrieval + restore)
- **Geographic redundancy**: Multi-region cold storage

## 11. Compliance Attestation

I, [Name], [Title], certify that:
- Audit log retention policy is understood and implemented
- Monitoring scripts are scheduled and functional
- Archival process is documented and tested
- Access controls are enforced and audited

**Signature**: _________________________
**Date**: _________________________

---

**Document Version**: 1.0
**Last Updated**: 2025-01-18
**Next Review**: 2026-01-18
