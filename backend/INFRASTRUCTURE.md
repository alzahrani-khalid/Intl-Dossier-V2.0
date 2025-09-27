# Backend Infrastructure Setup

This document describes the logging and security infrastructure for the GASTAT International Dossier System backend.

## Directory Structure

```
backend/
├── src/
│   ├── middleware/
│   │   └── security.ts          # Security middleware (helmet, CORS, rate limiting)
│   ├── utils/
│   │   └── logger.ts            # Winston logging configuration
│   └── index.ts                 # Main Express application
├── logs/                        # Log files directory
├── .env.example                 # Environment variables template
└── package.json                 # Updated with required dependencies
```

## Logging Infrastructure (T011)

### Features
- **Winston-based logging** with structured JSON format
- **Multiple log levels**: error, warn, info, http, debug
- **File rotation** with size limits (5MB per file, 5 files max)
- **Console and file outputs** with appropriate formatting
- **Specialized logging helpers** for different types of operations

### Log Files
- `logs/all.log` - All log entries
- `logs/error.log` - Error-level logs only

### Usage Examples

```typescript
import { logInfo, logError, logWarn, logDebug } from './utils/logger';

// Basic logging
logInfo('User logged in', { userId: '123', ip: req.ip });
logError('Database connection failed', error);

// Database operations
logDatabaseQuery('SELECT * FROM users WHERE id = $1', 150, { userId: '123' });
logDatabaseError('INSERT failed', error, { table: 'users' });

// API requests (automatic in middleware)
logApiRequest('POST', '/api/users', 201, 250);

// Security events
logSecurityEvent('Failed login attempt', 'medium', {
  ip: req.ip,
  username: 'attempted_username'
});

// Performance monitoring
logPerformance('User data processing', 1250, { userId: '123' });
```

## Security Configuration (T014)

### Features
- **Helmet.js configuration** for security headers
- **CORS policies** with environment-specific origins
- **Rate limiting** with multiple tiers
- **Request logging** and monitoring
- **IP whitelisting** for admin endpoints
- **Request size limiting**

### Security Headers Applied
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer Policy

### Rate Limiting Tiers
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **File uploads**: 10 requests per hour
- **Password reset**: 3 requests per hour

### Usage Examples

```typescript
import { securityMiddleware } from './middleware/security';

// Apply all security middleware
app.use(securityMiddleware.cors);
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.generalRateLimit);

// Apply specific rate limiting to routes
app.use('/api/auth', securityMiddleware.authRateLimit);
app.use('/api/upload', securityMiddleware.uploadRateLimit);

// IP whitelist for admin routes
app.use('/api/admin', securityMiddleware.ipWhitelist(['127.0.0.1', '10.0.0.1']));
```

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

### Required Variables
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS
- `API_KEYS`: Comma-separated API keys

### Optional Variables
- `ALLOWED_ORIGINS`: Additional CORS origins
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `ADMIN_IP_WHITELIST`: Whitelisted IPs for admin endpoints

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

4. Start development server:
```bash
npm run dev
```

## Security Best Practices

### Development Environment
- CORS allows localhost on multiple ports
- Detailed error messages in responses
- Debug-level logging enabled

### Production Environment
- Strict CORS policy with specific origins
- Generic error messages
- HTTPS redirect enforced
- Warn-level logging for performance

### Monitoring and Alerting
- Security events are logged with severity levels
- Failed authentication attempts are tracked
- Rate limit violations are monitored
- API errors are logged with context

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Test Endpoint
- `GET /api/test` - API functionality test

### Authentication (Rate Limited)
- `POST /api/auth/login` - User login

## Error Handling

All errors are:
- Logged with full context
- Returned with appropriate HTTP status codes
- Sanitized in production to prevent information leakage
- Tracked for security monitoring

## Log Analysis

### Useful Log Queries

Find security events:
```bash
grep "\"type\":\"security\"" logs/all.log
```

Find rate limit violations:
```bash
grep "Rate limit exceeded" logs/all.log
```

Find API errors:
```bash
grep "\"statusCode\":[45]" logs/all.log
```

## Maintenance

### Log Rotation
- Automatic rotation when files exceed 5MB
- Maximum 5 archived files per log type
- Old logs are automatically deleted

### Performance Monitoring
- Request duration tracking
- Database query performance
- Memory and CPU usage logging

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` in environment
   - Verify `ALLOWED_ORIGINS` configuration

2. **Rate Limiting Issues**
   - Check client IP addressing
   - Review rate limit configurations

3. **Log Files Not Created**
   - Verify `logs/` directory exists
   - Check file permissions

4. **Security Header Issues**
   - Review CSP configuration for your frontend
   - Adjust helmet settings as needed