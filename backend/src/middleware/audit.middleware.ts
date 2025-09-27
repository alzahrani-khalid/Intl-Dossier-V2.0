import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Types
interface AuditLog {
  id?: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  resource?: string;
  action: string;
  result: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, any>;
  created_at?: string;
}

interface AuditContext {
  startTime: number;
  userId?: string;
  sessionId?: string;
  requestId: string;
  sensitiveDataAccessed?: boolean;
  errorDetails?: any;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auditContext?: AuditContext;
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

// Helper functions
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

const getUserAgent = (req: Request): string => {
  return (req.headers['user-agent'] || 'unknown').substring(0, 255);
};

const determineEventType = (req: Request): string => {
  const path = req.path.toLowerCase();
  const method = req.method;

  // Authentication events
  if (path.includes('/auth/login')) return 'login';
  if (path.includes('/auth/logout')) return 'logout';
  if (path.includes('/auth/mfa')) return 'mfa_challenge';
  if (path.includes('/auth/recover')) return 'account_recovery';

  // Data access events
  if (path.includes('/export')) return 'data_export';
  if (path.includes('/dossier') && method === 'GET') return 'data_access';
  if (path.includes('/dossier') && method === 'POST') return 'data_create';
  if (path.includes('/dossier') && method === 'PUT') return 'data_update';
  if (path.includes('/dossier') && method === 'DELETE') return 'data_delete';

  // Admin events
  if (path.includes('/admin')) return 'admin_action';
  if (path.includes('/config')) return 'configuration_change';
  if (path.includes('/users') && method !== 'GET') return 'user_management';

  // Security events
  if (path.includes('/audit')) return 'audit_log_access';
  if (path.includes('/security')) return 'security_setting_change';

  // Default
  return 'api_request';
};

const determineSeverity = (
  eventType: string,
  statusCode: number,
  error?: any
): 'info' | 'warning' | 'critical' => {
  // Critical events
  if (
    eventType === 'security_setting_change' ||
    eventType === 'configuration_change' ||
    (eventType === 'login' && statusCode >= 400) ||
    statusCode === 403 ||
    statusCode >= 500
  ) {
    return 'critical';
  }

  // Warning events
  if (
    eventType === 'data_delete' ||
    eventType === 'user_management' ||
    eventType === 'admin_action' ||
    statusCode >= 400 ||
    error
  ) {
    return 'warning';
  }

  // Info events
  return 'info';
};

const extractResource = (req: Request): string => {
  const pathParts = req.path.split('/').filter(Boolean);
  
  // Extract resource ID if present
  const resourceId = req.params.id || req.params.dossier_id || req.params.user_id;
  
  if (resourceId) {
    return `${pathParts[0]}/${resourceId}`;
  }
  
  return pathParts.slice(0, 2).join('/');
};

const buildMetadata = (
  req: Request,
  res: Response,
  context: AuditContext
): Record<string, any> => {
  const metadata: Record<string, any> = {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    status_code: res.statusCode,
    response_time_ms: Date.now() - context.startTime,
    request_id: context.requestId,
    session_id: context.sessionId,
  };

  // Add body for write operations (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.secret;
    delete sanitizedBody.token;
    delete sanitizedBody.backup_codes;
    metadata.request_body = sanitizedBody;
  }

  // Add error details if present
  if (context.errorDetails) {
    metadata.error = {
      message: context.errorDetails.message,
      code: context.errorDetails.code,
      stack: process.env.NODE_ENV === 'development' ? context.errorDetails.stack : undefined,
    };
  }

  // Add rate limit info if present
  if (res.getHeader('X-RateLimit-Remaining')) {
    metadata.rate_limit = {
      remaining: res.getHeader('X-RateLimit-Remaining'),
      limit: res.getHeader('X-RateLimit-Limit'),
      reset: res.getHeader('X-RateLimit-Reset'),
    };
  }

  return metadata;
};

// Main middleware function
export const auditMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Initialize audit context
    req.auditContext = {
      startTime: Date.now(),
      requestId: uuidv4(),
      userId: req.user?.id,
      sessionId: req.headers['x-session-id'] as string,
    };

    // Store original end function
    const originalEnd = res.end;
    const originalJson = res.json;

    // Override json method to capture errors
    res.json = function(data: any) {
      if (res.statusCode >= 400 && data) {
        req.auditContext!.errorDetails = data;
      }
      return originalJson.call(this, data);
    };

    // Override end method to log after response
    res.end = function(...args: any[]) {
      // Call original end
      const result = originalEnd.apply(this, args as any);

      // Create audit log entry
      const auditLog: AuditLog = {
        event_type: determineEventType(req),
        severity: determineSeverity(
          determineEventType(req),
          res.statusCode,
          req.auditContext?.errorDetails
        ),
        user_id: req.user?.id,
        ip_address: getClientIp(req),
        user_agent: getUserAgent(req),
        resource: extractResource(req),
        action: `${req.method} ${req.path}`,
        result: res.statusCode < 400 ? 'success' : 
                res.statusCode === 403 ? 'blocked' : 'failure',
        metadata: buildMetadata(req, res, req.auditContext!),
      };

      // Async log to database (don't block response)
      logToDatabase(auditLog).catch(error => {
        console.error('Failed to write audit log:', error);
        // Could also log to fallback location (file, external service)
      });

      return result;
    };

    next();
  };
};

// Database logging function
async function logToDatabase(auditLog: AuditLog): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([auditLog]);

    if (error) {
      throw error;
    }

    // Check for critical events that need immediate alerting
    if (auditLog.severity === 'critical') {
      await triggerCriticalEventAlert(auditLog);
    }
  } catch (error) {
    // Fallback to console logging if database fails
    console.error('Audit log database error:', error);
    console.log('AUDIT_LOG:', JSON.stringify(auditLog));
    
    // Could also write to a file or send to external service
    await writeToFallbackLog(auditLog);
  }
}

// Alert for critical events
async function triggerCriticalEventAlert(auditLog: AuditLog): Promise<void> {
  try {
    // Check if this type of event should trigger an alert
    const alertableEvents = [
      'security_setting_change',
      'configuration_change',
      'data_delete',
      'failed_login',
      'unauthorized_access',
    ];

    if (!alertableEvents.includes(auditLog.event_type)) {
      return;
    }

    // Create alert in monitoring system
    const { error } = await supabase
      .from('alert_history')
      .insert([{
        config_id: 'critical-security-event', // This should reference actual alert config
        triggered_at: new Date().toISOString(),
        value: 1,
        message: `Critical security event: ${auditLog.event_type}`,
        message_ar: `حدث أمني حرج: ${auditLog.event_type}`,
        notifications_sent: {
          email: true,
          webhook: true,
        },
      }]);

    if (error) {
      console.error('Failed to create alert:', error);
    }
  } catch (error) {
    console.error('Failed to trigger critical event alert:', error);
  }
}

// Fallback logging when database is unavailable
async function writeToFallbackLog(auditLog: AuditLog): Promise<void> {
  // This could write to a local file, send to a message queue,
  // or use another fallback mechanism
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const logDir = process.env.AUDIT_LOG_DIR || '/var/log/intl-dossier';
  const logFile = path.join(logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
  
  try {
    await fs.appendFile(
      logFile,
      JSON.stringify({ ...auditLog, timestamp: new Date().toISOString() }) + '\n'
    );
  } catch (error) {
    console.error('Failed to write to fallback log file:', error);
  }
}

// Middleware to skip audit logging for certain paths
export const skipAudit = (paths: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (paths.some(path => req.path.startsWith(path))) {
      // Skip audit middleware for these paths
      return next();
    }
    return auditMiddleware()(req, res, next);
  };
};

// Export additional utilities
export const auditUtils = {
  logCustomEvent: async (
    eventType: string,
    userId: string | undefined,
    action: string,
    result: 'success' | 'failure' | 'blocked',
    metadata?: Record<string, any>
  ) => {
    const auditLog: AuditLog = {
      event_type: eventType,
      severity: result === 'success' ? 'info' : 'warning',
      user_id: userId,
      action,
      result,
      metadata,
    };

    await logToDatabase(auditLog);
  },

  logSecurityEvent: async (
    eventType: string,
    userId: string | undefined,
    details: string,
    severity: 'warning' | 'critical' = 'critical'
  ) => {
    const auditLog: AuditLog = {
      event_type: eventType,
      severity,
      user_id: userId,
      action: details,
      result: 'blocked',
      metadata: {
        security_event: true,
        details,
      },
    };

    await logToDatabase(auditLog);
  },
};