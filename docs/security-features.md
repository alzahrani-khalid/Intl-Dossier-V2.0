# Security Features Documentation

## Overview

The GASTAT International Dossier System implements comprehensive security measures to protect sensitive government data. This document outlines the security features, their implementation, and usage guidelines.

## Table of Contents
1. [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
2. [Row Level Security (RLS)](#row-level-security-rls)
3. [Audit Logging](#audit-logging)
4. [Encryption](#encryption)
5. [Anomaly Detection](#anomaly-detection)
6. [Security Headers](#security-headers)
7. [Rate Limiting](#rate-limiting)
8. [Session Management](#session-management)

## Multi-Factor Authentication (MFA)

### Overview
The system uses Time-based One-Time Password (TOTP) authentication with backup codes for account recovery.

### Features
- **TOTP Support**: Compatible with Google Authenticator, Microsoft Authenticator, Authy
- **Backup Codes**: 10 single-use recovery codes generated during enrollment
- **Bilingual Support**: All MFA interfaces available in Arabic and English
- **Graceful Fallback**: Recovery flow for lost devices

### Implementation Details

#### Database Schema
```sql
-- MFA Enrollments table
auth.mfa_enrollments
├── id (uuid, PK)
├── user_id (uuid, FK)
├── factor_type (text: 'totp')
├── secret (encrypted)
├── verified_at (timestamptz)
└── last_used_at (timestamptz)

-- Backup Codes table
auth.mfa_backup_codes
├── id (uuid, PK)
├── user_id (uuid, FK)
├── code_hash (text)
└── used_at (timestamptz)
```

#### API Endpoints
- `POST /api/auth/mfa/enroll` - Initiate MFA enrollment
- `POST /api/auth/mfa/verify` - Verify TOTP code
- `POST /api/auth/mfa/recover` - Use backup code
- `GET /api/auth/mfa/status` - Check MFA status

### Usage Examples

#### Enrollment Flow
```typescript
// 1. Initiate enrollment
const { data: enrollment } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});

// 2. Display QR code to user
displayQRCode(enrollment.qr_code);

// 3. Verify first TOTP code
const { data } = await supabase.auth.mfa.verify({
  factorId: enrollment.id,
  code: userInputCode
});

// 4. Store backup codes securely
saveBackupCodes(enrollment.backup_codes);
```

#### Verification Flow
```typescript
// During login
const { data: factors } = await supabase.auth.mfa.listFactors();

if (factors.length > 0) {
  // Prompt for TOTP code
  const code = await promptForCode();
  
  const { data, error } = await supabase.auth.mfa.verify({
    factorId: factors[0].id,
    code: code
  });
}
```

### Security Considerations
- MFA secrets are encrypted using AES-256-GCM
- Backup codes are hashed with bcrypt (cost factor 12)
- Failed verification attempts are rate-limited
- Session requires re-authentication after 30 minutes of inactivity

## Row Level Security (RLS)

### Overview
PostgreSQL Row Level Security ensures users can only access data they're authorized to view or modify.

### Policy Architecture
```
Deny-by-default → Explicit allows → Restrictive overrides
```

### Implementation

#### Base Deny Policy
```sql
CREATE POLICY "deny_all" ON table_name
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (false);
```

#### User-Specific Access
```sql
CREATE POLICY "users_own_data" ON user_data
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

#### Role-Based Access
```sql
CREATE POLICY "admin_full_access" ON sensitive_data
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Performance Optimization
- All RLS policy columns are indexed
- Complex permissions use materialized views
- Query performance monitored to maintain <20% overhead

### Testing RLS Policies
```bash
# Run RLS verification tests
npm run test:rls-policies

# Check specific policy
npm run db:test-rls --table=users --policy=users_own_data
```

## Audit Logging

### Overview
Comprehensive logging of all security-relevant events for compliance and forensics.

### Logged Events
- Authentication attempts (success/failure)
- MFA challenges and verifications
- Data access and modifications
- Permission changes
- Configuration updates
- Export requests
- Anomaly detections

### Database Schema
```sql
security.audit_logs
├── id (uuid, PK)
├── event_type (text)
├── severity (info|warning|critical)
├── user_id (uuid, FK)
├── ip_address (inet)
├── user_agent (text)
├── resource (text)
├── action (text)
├── result (success|failure|blocked)
├── metadata (jsonb)
└── created_at (timestamptz)
```

### Query Examples
```sql
-- Recent critical events
SELECT * FROM security.audit_logs
WHERE severity = 'critical'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Failed login attempts
SELECT * FROM security.audit_logs
WHERE event_type = 'login'
  AND result = 'failure'
  AND created_at > now() - interval '1 hour';
```

### Retention Policy
- **Active Storage**: 90 days in hot storage
- **Archive**: 7 years in cold storage (compliance requirement)
- **Rotation**: Automatic daily archival process

## Encryption

### At Rest
- **Database**: Transparent Data Encryption (TDE) enabled
- **File Storage**: AES-256 encryption for all uploaded documents
- **Backup**: Encrypted backups with separate key management
- **Secrets**: Vault-based secret management

### In Transit
- **TLS Version**: Minimum TLS 1.3 enforced
- **Certificate**: Valid SSL certificates with HSTS enabled
- **Database Connections**: SSL required for all database connections
- **Inter-Service**: mTLS for service-to-service communication

### Key Management
```yaml
encryption:
  master_key: vault://keys/master
  rotation_period: 90d
  algorithm: AES-256-GCM
  key_derivation: PBKDF2
```

## Anomaly Detection

### Overview
Machine learning-based system for detecting unusual patterns and potential security threats.

### Detection Categories
1. **User Behavior**
   - Unusual access patterns
   - Abnormal data volumes
   - Geographic anomalies
   - Time-based anomalies

2. **System Performance**
   - Resource usage spikes
   - Unusual API patterns
   - Database query anomalies
   - Network traffic patterns

### Sensitivity Levels
| Level | False Positive Rate | Use Case |
|-------|-------------------|----------|
| Low | ~10% | General monitoring |
| Medium | ~5% | Standard security |
| High | ~1% | Critical systems |
| Custom | Variable | Tuned for specific patterns |

### Configuration
```typescript
const detector = new AnomalyDetector({
  sensitivity: 'medium',
  algorithm: 'isolation_forest',
  features: ['login_frequency', 'data_volume', 'ip_diversity'],
  retraining_interval: '7d'
});
```

### Alert Integration
```yaml
anomaly_alerts:
  - pattern: high_risk_login
    threshold: 0.85
    action: block_and_alert
  - pattern: data_exfiltration
    threshold: 0.75
    action: alert_security_team
```

## Security Headers

### Implemented Headers
```typescript
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'");
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Frame Options
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Content Type Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // HSTS
  res.setHeader('Strict-Transport-Security', 
    'max-age=31536000; includeSubDomains; preload');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});
```

## Rate Limiting

### Configuration
```typescript
const rateLimiter = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests
    keyGenerator: (req) => req.user?.id || req.ip
  },
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 exports per hour
  }
};
```

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1643723400
```

## Session Management

### Configuration
```typescript
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JS access
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'strict' // CSRF protection
  },
  rolling: true // Reset on activity
};
```

### Session Security Features
- Automatic timeout after 30 minutes of inactivity
- Session invalidation on password change
- Device fingerprinting for session validation
- Concurrent session limiting (configurable)

### Session Events
```typescript
// Monitor session events
session.on('timeout', (sessionId) => {
  auditLog('session_timeout', { sessionId });
});

session.on('invalidate', (sessionId, reason) => {
  auditLog('session_invalidated', { sessionId, reason });
});
```

## Security Monitoring Dashboard

### Key Metrics
- Failed login attempts (last 24h)
- MFA adoption rate
- Active sessions count
- Anomaly detection alerts
- RLS policy violations
- API rate limit hits
- Encryption status

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Failed Logins | >10/hour | >50/hour |
| Anomaly Score | >0.7 | >0.85 |
| API Errors | >5% | >10% |
| Session Hijacks | Any | - |
| RLS Violations | >10/day | >100/day |

## Incident Response

### Security Event Workflow
1. **Detection**: Automated monitoring identifies threat
2. **Alert**: Security team notified via multiple channels
3. **Assessment**: Severity evaluation and impact analysis
4. **Response**: Automated or manual intervention
5. **Recovery**: System restoration if needed
6. **Post-Mortem**: Incident analysis and prevention updates

### Contact Information
- Security Team: security@gastat.gov.sa
- Emergency Hotline: +966-11-XXX-XXXX
- Incident Report: https://internal.gastat.gov.sa/security/incident

## Compliance

### Standards
- ISO 27001 Information Security Management
- Saudi NCA Essential Cybersecurity Controls (ECC)
- GDPR (for international data)
- WCAG 2.1 Level AA (accessibility)

### Audit Reports
- Monthly security audit reports
- Quarterly penetration testing
- Annual compliance certification
- Real-time dashboard available at `/admin/security`

## Best Practices

### For Developers
1. Always use parameterized queries
2. Validate all input on both client and server
3. Use the principle of least privilege
4. Implement proper error handling (don't leak sensitive info)
5. Keep dependencies updated
6. Follow secure coding standards

### For Administrators
1. Regular security patches and updates
2. Monitor audit logs daily
3. Review and update RLS policies quarterly
4. Test disaster recovery procedures
5. Maintain security documentation
6. Conduct regular security training

### For End Users
1. Use strong, unique passwords
2. Enable MFA on all accounts
3. Report suspicious activities immediately
4. Keep browsers and apps updated
5. Don't share credentials
6. Lock screens when away

## Appendix

### Security Tools
- **Vulnerability Scanner**: OWASP ZAP
- **Code Analysis**: SonarQube
- **Dependency Check**: npm audit, Snyk
- **Penetration Testing**: Metasploit, Burp Suite
- **Log Analysis**: ELK Stack

### References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Saudi NCA ECC Framework](https://nca.gov.sa/ecc)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)

---

*Last Updated: 2025-01-27*  
*Version: 1.0.0*  
*Classification: Internal Use Only*