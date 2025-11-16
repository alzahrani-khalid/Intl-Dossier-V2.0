import express from 'express';
import { securityMiddleware } from './middleware/security.js';
import { logInfo, logError } from './utils/logger';
import apiRouter from './api';
import mfaContractRouter from './api/contract/mfa';
import monitoringContractRouter from './api/contract/monitoring';
import exportContractRouter from './api/contract/export';
import analyticsContractRouter from './api/contract/analytics';
import accessibilityContractRouter from './api/contract/accessibility';
import auditContractRouter from './api/contract/audit';
import { scheduleHealthScoresRefreshJob } from './jobs/refresh-health-scores.job.js';
import { scheduleOverdueCommitmentsDetectionJob } from './jobs/detect-overdue-commitments.job.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Register scheduled jobs if enabled
const ENABLE_SCHEDULED_JOBS = process.env.ENABLE_SCHEDULED_JOBS === 'true';
if (ENABLE_SCHEDULED_JOBS) {
  logInfo('Scheduled jobs enabled, registering...');
  scheduleHealthScoresRefreshJob();
  scheduleOverdueCommitmentsDetectionJob();
} else {
  logInfo('Scheduled jobs disabled (set ENABLE_SCHEDULED_JOBS=true to enable)');
}

// Apply security middleware
app.use(securityMiddleware.httpsRedirect);
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.cors);
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.requestLogger);

// Apply rate limiting
app.use(securityMiddleware.generalRateLimit);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Contract-test friendly routes mounted at root (no /api prefix)
app.use('/auth/mfa', mfaContractRouter);
app.use('/monitoring', monitoringContractRouter);
app.use('/export', exportContractRouter);
app.use('/analytics', analyticsContractRouter);
app.use('/accessibility', accessibilityContractRouter);
app.use('/audit', auditContractRouter);

// Mount API router
app.use('/api', apiRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError('Unhandled error', err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Start server
app.listen(PORT, () => {
  logInfo(`Server starting on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logInfo('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
