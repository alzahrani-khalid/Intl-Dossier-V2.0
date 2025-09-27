# Security & Audit API

## Overview

Security endpoints provide audit log querying capabilities for compliance, forensics, and security monitoring.

## Audit Logs

### Query Audit Logs

**Endpoint:** `GET /audit/logs`

**Query Parameters:**
- `event_type` (optional): Filter by event type
- `severity` (optional): Filter by severity (info, warning, critical)
- `user_id` (optional): Filter by user UUID
- `from` (required): Start date/time (ISO 8601)
- `to` (required): End date/time (ISO 8601)
- `limit` (optional): Maximum results (1-1000, default 100)

**Example Request:**
```
GET /audit/logs?severity=critical&from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z&limit=50
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "unauthorized_access",
    "severity": "critical",
    "user_id": "750e8400-e29b-41d4-a716-446655440000",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "resource": "/api/sensitive-data",
    "action": "READ",
    "result": "blocked",
    "metadata": {
      "reason": "insufficient_permissions",
      "required_role": "admin",
      "user_role": "viewer"
    },
    "created_at": "2024-01-15T10:30:45Z"
  },
  {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "event_type": "mfa_failure",
    "severity": "warning",
    "user_id": "850e8400-e29b-41d4-a716-446655440000",
    "ip_address": "10.0.0.50",
    "user_agent": "Mobile Safari/604.1",
    "resource": null,
    "action": "AUTHENTICATE",
    "result": "failure",
    "metadata": {
      "factor_type": "totp",
      "attempts": 3,
      "locked": false
    },
    "created_at": "2024-01-15T09:15:30Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions (admin only)
- `400 Bad Request` - Invalid date range or parameters

## Event Types

### Authentication Events
- `login_success` - Successful login
- `login_failure` - Failed login attempt
- `logout` - User logout
- `mfa_enrolled` - MFA enrollment completed
- `mfa_success` - Successful MFA verification
- `mfa_failure` - Failed MFA verification
- `mfa_recovery` - Backup code used
- `password_changed` - Password modification
- `password_reset` - Password reset requested

### Authorization Events
- `unauthorized_access` - Access denied to resource
- `permission_granted` - New permission assigned
- `permission_revoked` - Permission removed
- `role_changed` - User role modification
- `rls_violation` - Row-level security policy violation

### Data Events
- `data_exported` - Data export requested
- `data_imported` - Data import performed
- `data_deleted` - Data deletion
- `data_modified` - Sensitive data modification
- `bulk_operation` - Bulk data operation

### System Events
- `config_changed` - System configuration modified
- `service_started` - Service startup
- `service_stopped` - Service shutdown
- `backup_created` - System backup performed
- `restore_performed` - System restore executed

### Security Events
- `anomaly_detected` - Anomalous behavior detected
- `rate_limit_exceeded` - Rate limiting triggered
- `ip_blocked` - IP address blocked
- `suspicious_activity` - Suspicious pattern identified
- `security_scan` - Security scan performed

## Implementation Examples

### Query Audit Logs

```typescript
// Query critical security events
const queryCriticalEvents = async (timeRange: { from: Date, to: Date }) => {
  const params = new URLSearchParams({
    severity: 'critical',
    from: timeRange.from.toISOString(),
    to: timeRange.to.toISOString(),
    limit: '100'
  });
  
  const response = await fetch(`/audit/logs?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 403) {
    throw new Error('Admin access required for audit logs');
  }
  
  const logs = await response.json();
  
  // Process critical events
  const criticalEvents = logs.filter(log => 
    log.severity === 'critical' && 
    ['unauthorized_access', 'data_deleted', 'security_breach'].includes(log.event_type)
  );
  
  if (criticalEvents.length > 0) {
    await notifySecurityTeam(criticalEvents);
  }
  
  return logs;
};
```

### Monitor User Activity

```typescript
// Track user activity patterns
const monitorUserActivity = async (userId: string) => {
  const last24Hours = {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date()
  };
  
  const params = new URLSearchParams({
    user_id: userId,
    from: last24Hours.from.toISOString(),
    to: last24Hours.to.toISOString(),
    limit: '500'
  });
  
  const response = await fetch(`/audit/logs?${params}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  const logs = await response.json();
  
  // Analyze activity patterns
  const analysis = {
    total_events: logs.length,
    failed_logins: logs.filter(l => l.event_type === 'login_failure').length,
    data_exports: logs.filter(l => l.event_type === 'data_exported').length,
    unauthorized_attempts: logs.filter(l => l.event_type === 'unauthorized_access').length,
    unique_ips: [...new Set(logs.map(l => l.ip_address))].length,
    risk_score: calculateRiskScore(logs)
  };
  
  return analysis;
};

// Calculate user risk score
const calculateRiskScore = (logs: AuditLog[]) => {
  let score = 0;
  
  // Failed authentication attempts
  const failedAuth = logs.filter(l => 
    l.result === 'failure' && 
    l.action === 'AUTHENTICATE'
  ).length;
  score += failedAuth * 10;
  
  // Unauthorized access attempts
  const unauthorized = logs.filter(l => 
    l.event_type === 'unauthorized_access'
  ).length;
  score += unauthorized * 20;
  
  // Unusual activity times
  const offHoursActivity = logs.filter(l => {
    const hour = new Date(l.created_at).getHours();
    return hour < 6 || hour > 22;
  }).length;
  score += offHoursActivity * 5;
  
  // Multiple IP addresses
  const uniqueIPs = [...new Set(logs.map(l => l.ip_address))].length;
  if (uniqueIPs > 3) {
    score += (uniqueIPs - 3) * 15;
  }
  
  return Math.min(score, 100); // Cap at 100
};
```

### Compliance Reporting

```typescript
// Generate compliance report
const generateComplianceReport = async (month: string) => {
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0); // Last day of month
  
  const params = new URLSearchParams({
    from: startDate.toISOString(),
    to: endDate.toISOString(),
    limit: '1000'
  });
  
  const response = await fetch(`/audit/logs?${params}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  const logs = await response.json();
  
  // Generate compliance metrics
  const report = {
    period: month,
    total_events: logs.length,
    
    authentication: {
      successful_logins: count(logs, 'login_success'),
      failed_logins: count(logs, 'login_failure'),
      mfa_adoptions: count(logs, 'mfa_enrolled'),
      password_changes: count(logs, 'password_changed')
    },
    
    security_incidents: {
      unauthorized_access: count(logs, 'unauthorized_access'),
      rls_violations: count(logs, 'rls_violation'),
      anomalies_detected: count(logs, 'anomaly_detected'),
      rate_limits_hit: count(logs, 'rate_limit_exceeded')
    },
    
    data_operations: {
      exports: count(logs, 'data_exported'),
      imports: count(logs, 'data_imported'),
      deletions: count(logs, 'data_deleted'),
      modifications: count(logs, 'data_modified')
    },
    
    users_affected: [...new Set(logs.map(l => l.user_id))].length,
    
    critical_events: logs.filter(l => l.severity === 'critical').map(l => ({
      id: l.id,
      type: l.event_type,
      user: l.user_id,
      timestamp: l.created_at,
      details: l.metadata
    }))
  };
  
  return report;
};

const count = (logs: AuditLog[], eventType: string) => 
  logs.filter(l => l.event_type === eventType).length;
```

### Real-time Monitoring

```typescript
// WebSocket connection for real-time audit events
class AuditMonitor {
  private ws: WebSocket;
  private handlers: Map<string, Function[]> = new Map();
  
  connect() {
    this.ws = new WebSocket('wss://api.gastat.sa/audit/stream');
    
    this.ws.onopen = () => {
      this.authenticate();
    };
    
    this.ws.onmessage = (event) => {
      const log = JSON.parse(event.data);
      this.handleAuditEvent(log);
    };
    
    this.ws.onerror = (error) => {
      console.error('Audit stream error:', error);
      this.reconnect();
    };
  }
  
  private authenticate() {
    this.ws.send(JSON.stringify({
      type: 'auth',
      token: adminToken
    }));
  }
  
  private handleAuditEvent(log: AuditLog) {
    // Check severity
    if (log.severity === 'critical') {
      this.handleCriticalEvent(log);
    }
    
    // Call registered handlers
    const handlers = this.handlers.get(log.event_type) || [];
    handlers.forEach(handler => handler(log));
    
    // Update dashboard
    this.updateDashboard(log);
  }
  
  private handleCriticalEvent(log: AuditLog) {
    // Immediate notification
    sendAlert({
      priority: 'high',
      title: `Critical Security Event: ${log.event_type}`,
      message: `User ${log.user_id} triggered ${log.event_type}`,
      metadata: log
    });
    
    // Auto-response for certain events
    if (log.event_type === 'security_breach') {
      this.initiateIncidentResponse(log);
    }
  }
  
  private initiateIncidentResponse(log: AuditLog) {
    // Lock affected user account
    lockUserAccount(log.user_id);
    
    // Revoke all sessions
    revokeUserSessions(log.user_id);
    
    // Create incident ticket
    createIncident({
      severity: 'critical',
      type: log.event_type,
      affected_user: log.user_id,
      timestamp: log.created_at,
      auto_response: true
    });
  }
  
  on(eventType: string, handler: Function) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
}

// Usage
const monitor = new AuditMonitor();
monitor.connect();

monitor.on('unauthorized_access', (log) => {
  console.log('Unauthorized access attempt:', log);
});

monitor.on('data_exported', (log) => {
  trackDataExport(log);
});
```

## Audit Log Analysis

### Pattern Detection

```typescript
// Detect suspicious patterns
const detectSuspiciousPatterns = (logs: AuditLog[]) => {
  const patterns = [];
  
  // Rapid-fire login attempts
  const loginAttempts = logs.filter(l => 
    l.event_type === 'login_failure'
  );
  
  const rapidLogin = detectRapidFire(loginAttempts, 5, 60000); // 5 attempts in 1 minute
  if (rapidLogin.length > 0) {
    patterns.push({
      type: 'brute_force',
      severity: 'high',
      events: rapidLogin
    });
  }
  
  // Geographic anomalies
  const geoAnomalies = detectGeographicAnomalies(logs);
  if (geoAnomalies.length > 0) {
    patterns.push({
      type: 'impossible_travel',
      severity: 'medium',
      events: geoAnomalies
    });
  }
  
  // Data exfiltration attempts
  const exports = logs.filter(l => l.event_type === 'data_exported');
  if (exports.length > 10) {
    patterns.push({
      type: 'potential_exfiltration',
      severity: 'high',
      events: exports
    });
  }
  
  // Privilege escalation attempts
  const privEsc = logs.filter(l => 
    l.event_type === 'unauthorized_access' &&
    l.metadata?.required_role === 'admin'
  );
  if (privEsc.length > 0) {
    patterns.push({
      type: 'privilege_escalation',
      severity: 'critical',
      events: privEsc
    });
  }
  
  return patterns;
};

// Detect rapid-fire events
const detectRapidFire = (
  logs: AuditLog[], 
  threshold: number, 
  windowMs: number
) => {
  const sorted = logs.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const rapidFire = [];
  for (let i = 0; i < sorted.length - threshold; i++) {
    const window = sorted.slice(i, i + threshold);
    const duration = 
      new Date(window[threshold - 1].created_at).getTime() -
      new Date(window[0].created_at).getTime();
    
    if (duration < windowMs) {
      rapidFire.push(...window);
    }
  }
  
  return [...new Set(rapidFire)];
};
```

### Forensic Investigation

```typescript
// Investigate security incident
const investigateIncident = async (incidentId: string) => {
  // Get incident details
  const incident = await getIncident(incidentId);
  
  // Collect related audit logs
  const timeWindow = {
    from: new Date(incident.timestamp - 3600000), // 1 hour before
    to: new Date(incident.timestamp + 3600000)     // 1 hour after
  };
  
  const logs = await queryAuditLogs({
    user_id: incident.user_id,
    from: timeWindow.from,
    to: timeWindow.to
  });
  
  // Build incident timeline
  const timeline = logs.map(log => ({
    time: log.created_at,
    event: log.event_type,
    action: log.action,
    result: log.result,
    ip: log.ip_address,
    details: log.metadata
  })).sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );
  
  // Identify attack vector
  const attackVector = identifyAttackVector(timeline);
  
  // Generate forensic report
  return {
    incident_id: incidentId,
    user_affected: incident.user_id,
    timeline,
    attack_vector: attackVector,
    impact_assessment: assessImpact(logs),
    recommendations: generateRecommendations(attackVector)
  };
};
```

## Retention & Archival

### Data Retention Policy

```typescript
// Archive old audit logs
const archiveAuditLogs = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days retention
  
  // Query logs older than cutoff
  const oldLogs = await queryAuditLogs({
    to: cutoffDate,
    limit: 10000
  });
  
  // Archive to cold storage
  const archiveResult = await archiveToColdStorage({
    logs: oldLogs,
    archive_date: new Date(),
    retention_years: 7 // Legal requirement
  });
  
  // Delete from hot storage
  if (archiveResult.success) {
    await deleteAuditLogs(oldLogs.map(l => l.id));
  }
  
  // Log archival operation
  await createAuditLog({
    event_type: 'audit_logs_archived',
    severity: 'info',
    metadata: {
      count: oldLogs.length,
      oldest_date: oldLogs[0]?.created_at,
      archive_id: archiveResult.archive_id
    }
  });
};

// Retrieve archived logs
const retrieveArchivedLogs = async (query: ArchiveQuery) => {
  // Check if query requires archived data
  const needsArchive = new Date(query.from) < getArchiveCutoffDate();
  
  if (!needsArchive) {
    return queryAuditLogs(query);
  }
  
  // Retrieve from cold storage
  const archivedLogs = await retrieveFromColdStorage({
    from: query.from,
    to: Math.min(query.to, getArchiveCutoffDate()),
    filters: query.filters
  });
  
  // Combine with hot storage if needed
  let hotLogs = [];
  if (new Date(query.to) > getArchiveCutoffDate()) {
    hotLogs = await queryAuditLogs({
      ...query,
      from: getArchiveCutoffDate()
    });
  }
  
  return [...archivedLogs, ...hotLogs];
};
```

## Security Best Practices

### Access Control

```typescript
// Verify audit log access permissions
const verifyAuditAccess = async (userId: string, query: AuditQuery) => {
  const user = await getUser(userId);
  
  // Check role-based access
  if (!['admin', 'auditor', 'security'].includes(user.role)) {
    throw new ForbiddenError('Insufficient permissions for audit logs');
  }
  
  // Additional restrictions for non-admins
  if (user.role !== 'admin') {
    // Can only query their own logs
    if (query.user_id && query.user_id !== userId) {
      throw new ForbiddenError('Cannot access other users audit logs');
    }
    
    // Cannot query critical events
    if (query.severity === 'critical') {
      throw new ForbiddenError('Cannot access critical audit events');
    }
    
    // Time range restriction (max 30 days)
    const range = new Date(query.to) - new Date(query.from);
    if (range > 30 * 24 * 60 * 60 * 1000) {
      throw new BadRequestError('Maximum query range is 30 days');
    }
  }
  
  return true;
};
```

### Log Integrity

```typescript
// Ensure audit log integrity
class AuditLogIntegrity {
  // Generate hash chain for tamper detection
  async createLogEntry(log: AuditLog) {
    // Get previous log hash
    const previousLog = await getLatestAuditLog();
    const previousHash = previousLog?.hash || '0';
    
    // Calculate current log hash
    const logData = JSON.stringify({
      ...log,
      previous_hash: previousHash
    });
    
    const hash = crypto
      .createHash('sha256')
      .update(logData)
      .digest('hex');
    
    // Store with hash
    return {
      ...log,
      hash,
      previous_hash: previousHash
    };
  }
  
  // Verify log chain integrity
  async verifyIntegrity(logs: AuditLog[]) {
    for (let i = 1; i < logs.length; i++) {
      const current = logs[i];
      const previous = logs[i - 1];
      
      // Verify hash chain
      if (current.previous_hash !== previous.hash) {
        return {
          valid: false,
          broken_at: i,
          error: 'Hash chain broken'
        };
      }
      
      // Verify individual hash
      const recalculated = this.calculateHash(current);
      if (recalculated !== current.hash) {
        return {
          valid: false,
          tampered_log: current.id,
          error: 'Log content tampered'
        };
      }
    }
    
    return { valid: true };
  }
}
```

## Testing

### Test Queries

```bash
# Query recent critical events
curl -X GET "/audit/logs?severity=critical&from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Query user-specific logs
curl -X GET "/audit/logs?user_id=550e8400-e29b-41d4-a716-446655440000&from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Query failed authentication attempts
curl -X GET "/audit/logs?event_type=login_failure&from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Performance Requirements

- Query response time < 2 seconds for 1000 logs
- Support concurrent queries (10+ simultaneous)
- Archive process < 5 minutes for 100,000 logs
- Real-time streaming latency < 100ms

---

*For security and audit support, contact: security@gastat.gov.sa*