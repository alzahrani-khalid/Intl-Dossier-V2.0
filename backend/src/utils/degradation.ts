import { Request, Response, NextFunction } from 'express';
import { getPoolMetrics } from '../config/database';

/**
 * Degradation levels and their thresholds
 */
enum DegradationLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Feature flags for degradation
 */
interface FeatureFlags {
  realTimeUpdates: boolean;
  exportLargeDatasets: boolean;
  clusteringAnalysis: boolean;
  anomalyDetection: boolean;
  advancedSearch: boolean;
  fileUploads: boolean;
  backgroundJobs: boolean;
  emailNotifications: boolean;
  webhooks: boolean;
  aiFeatures: boolean;
}

/**
 * System metrics for degradation decisions
 */
interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestQueueLength: number;
  responseTime: number;
  errorRate: number;
  replicas: number;
  maxReplicas: number;
}

/**
 * Priority levels for request handling
 */
enum RequestPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Configuration for degradation thresholds
 */
const DEGRADATION_THRESHOLDS = {
  low: {
    cpuUsage: 60,
    memoryUsage: 70,
    activeConnections: 500,
    requestQueueLength: 100,
    responseTime: 1000,
    errorRate: 0.01,
    replicaUsage: 0.5,
  },
  medium: {
    cpuUsage: 70,
    memoryUsage: 80,
    activeConnections: 750,
    requestQueueLength: 200,
    responseTime: 2000,
    errorRate: 0.03,
    replicaUsage: 0.7,
  },
  high: {
    cpuUsage: 85,
    memoryUsage: 90,
    activeConnections: 900,
    requestQueueLength: 300,
    responseTime: 3000,
    errorRate: 0.05,
    replicaUsage: 0.85,
  },
  critical: {
    cpuUsage: 95,
    memoryUsage: 95,
    activeConnections: 1000,
    requestQueueLength: 500,
    responseTime: 5000,
    errorRate: 0.1,
    replicaUsage: 0.95,
  },
};

/**
 * Feature availability based on degradation level
 */
const FEATURE_AVAILABILITY: Record<DegradationLevel, FeatureFlags> = {
  [DegradationLevel.NONE]: {
    realTimeUpdates: true,
    exportLargeDatasets: true,
    clusteringAnalysis: true,
    anomalyDetection: true,
    advancedSearch: true,
    fileUploads: true,
    backgroundJobs: true,
    emailNotifications: true,
    webhooks: true,
    aiFeatures: true,
  },
  [DegradationLevel.LOW]: {
    realTimeUpdates: true,
    exportLargeDatasets: true,
    clusteringAnalysis: true,
    anomalyDetection: true,
    advancedSearch: true,
    fileUploads: true,
    backgroundJobs: true,
    emailNotifications: true,
    webhooks: true,
    aiFeatures: false, // Disable AI features first
  },
  [DegradationLevel.MEDIUM]: {
    realTimeUpdates: false, // Disable real-time updates
    exportLargeDatasets: true,
    clusteringAnalysis: false, // Disable clustering
    anomalyDetection: true,
    advancedSearch: false, // Simplify search
    fileUploads: true,
    backgroundJobs: true,
    emailNotifications: true,
    webhooks: false, // Disable webhooks
    aiFeatures: false,
  },
  [DegradationLevel.HIGH]: {
    realTimeUpdates: false,
    exportLargeDatasets: false, // Limit exports
    clusteringAnalysis: false,
    anomalyDetection: false, // Disable anomaly detection
    advancedSearch: false,
    fileUploads: false, // Disable uploads
    backgroundJobs: false, // Stop background jobs
    emailNotifications: true, // Keep critical notifications
    webhooks: false,
    aiFeatures: false,
  },
  [DegradationLevel.CRITICAL]: {
    realTimeUpdates: false,
    exportLargeDatasets: false,
    clusteringAnalysis: false,
    anomalyDetection: false,
    advancedSearch: false,
    fileUploads: false,
    backgroundJobs: false,
    emailNotifications: false, // Only essential operations
    webhooks: false,
    aiFeatures: false,
  },
};

/**
 * Request priority mapping
 */
const REQUEST_PRIORITY_MAP: Record<string, RequestPriority> = {
  // Critical operations
  '/auth/login': RequestPriority.CRITICAL,
  '/auth/logout': RequestPriority.CRITICAL,
  '/auth/mfa/verify': RequestPriority.CRITICAL,
  '/monitoring/health': RequestPriority.CRITICAL,
  
  // High priority operations
  '/api/dossiers': RequestPriority.HIGH,
  '/api/users': RequestPriority.HIGH,
  '/api/security': RequestPriority.HIGH,
  
  // Medium priority operations
  '/api/export': RequestPriority.MEDIUM,
  '/api/search': RequestPriority.MEDIUM,
  '/api/notifications': RequestPriority.MEDIUM,
  
  // Low priority operations
  '/api/analytics': RequestPriority.LOW,
  '/api/clustering': RequestPriority.LOW,
  '/api/ai': RequestPriority.LOW,
};

/**
 * Graceful degradation manager
 */
class GracefulDegradationManager {
  private currentLevel: DegradationLevel = DegradationLevel.NONE;
  private metrics: SystemMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    activeConnections: 0,
    requestQueueLength: 0,
    responseTime: 0,
    errorRate: 0,
    replicas: 2,
    maxReplicas: 20,
  };
  private requestQueue: Map<RequestPriority, Request[]> = new Map();
  private lastEvaluation: number = Date.now();
  private evaluationInterval: number = 30000; // 30 seconds

  constructor() {
    // Initialize request queues
    Object.values(RequestPriority).forEach(priority => {
      this.requestQueue.set(priority, []);
    });

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start system monitoring
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();
      this.evaluateDegradationLevel();
    }, this.evaluationInterval);
  }

  /**
   * Update system metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Get CPU and memory usage
      const usage = process.cpuUsage();
      const memUsage = process.memoryUsage();
      
      this.metrics.cpuUsage = (usage.user + usage.system) / 1000000 / process.uptime() * 100;
      this.metrics.memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      // Get database pool metrics
      const poolMetrics = getPoolMetrics();
      this.metrics.activeConnections = poolMetrics.totalConnections;
      this.metrics.responseTime = poolMetrics.averageQueryTime;
      this.metrics.errorRate = poolMetrics.connectionErrors / Math.max(poolMetrics.totalQueries, 1);
      
      // Get replica count from environment or config
      this.metrics.replicas = parseInt(process.env.REPLICA_COUNT || '2');
      
      // Calculate request queue length
      this.metrics.requestQueueLength = Array.from(this.requestQueue.values())
        .reduce((total, queue) => total + queue.length, 0);
      
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  /**
   * Evaluate and set degradation level based on metrics
   */
  private evaluateDegradationLevel(): void {
    const previousLevel = this.currentLevel;
    
    // Check thresholds from critical to low
    if (this.checkThreshold(DEGRADATION_THRESHOLDS.critical)) {
      this.currentLevel = DegradationLevel.CRITICAL;
    } else if (this.checkThreshold(DEGRADATION_THRESHOLDS.high)) {
      this.currentLevel = DegradationLevel.HIGH;
    } else if (this.checkThreshold(DEGRADATION_THRESHOLDS.medium)) {
      this.currentLevel = DegradationLevel.MEDIUM;
    } else if (this.checkThreshold(DEGRADATION_THRESHOLDS.low)) {
      this.currentLevel = DegradationLevel.LOW;
    } else {
      this.currentLevel = DegradationLevel.NONE;
    }
    
    // Log level changes
    if (previousLevel !== this.currentLevel) {
      console.log(`Degradation level changed: ${previousLevel} -> ${this.currentLevel}`);
      this.onDegradationLevelChange(previousLevel, this.currentLevel);
    }
  }

  /**
   * Check if metrics exceed threshold
   */
  private checkThreshold(threshold: any): boolean {
    const replicaUsage = this.metrics.replicas / this.metrics.maxReplicas;
    
    return (
      this.metrics.cpuUsage >= threshold.cpuUsage ||
      this.metrics.memoryUsage >= threshold.memoryUsage ||
      this.metrics.activeConnections >= threshold.activeConnections ||
      this.metrics.requestQueueLength >= threshold.requestQueueLength ||
      this.metrics.responseTime >= threshold.responseTime ||
      this.metrics.errorRate >= threshold.errorRate ||
      replicaUsage >= threshold.replicaUsage
    );
  }

  /**
   * Handle degradation level changes
   */
  private async onDegradationLevelChange(
    previousLevel: DegradationLevel,
    newLevel: DegradationLevel
  ): Promise<void> {
    // Log to audit
    console.log(`System degradation level changed from ${previousLevel} to ${newLevel}`);
    
    // Notify monitoring systems
    await this.notifyMonitoring(newLevel);
    
    // Apply feature adjustments
    this.applyFeatureAdjustments(newLevel);
    
    // Process queued requests if improving
    if (this.isImprovement(previousLevel, newLevel)) {
      this.processQueuedRequests();
    }
  }

  /**
   * Check if degradation level is improving
   */
  private isImprovement(previous: DegradationLevel, current: DegradationLevel): boolean {
    const levels = [
      DegradationLevel.NONE,
      DegradationLevel.LOW,
      DegradationLevel.MEDIUM,
      DegradationLevel.HIGH,
      DegradationLevel.CRITICAL,
    ];
    
    return levels.indexOf(current) < levels.indexOf(previous);
  }

  /**
   * Apply feature adjustments based on degradation level
   */
  private applyFeatureAdjustments(level: DegradationLevel): void {
    const features = FEATURE_AVAILABILITY[level];
    
    // Store feature flags in environment or cache
    process.env.FEATURE_FLAGS = JSON.stringify(features);
    
    console.log(`Features adjusted for ${level} degradation:`, features);
  }

  /**
   * Notify monitoring systems of degradation
   */
  private async notifyMonitoring(level: DegradationLevel): Promise<void> {
    // Implementation would send alerts to monitoring systems
    // This is a placeholder for the actual implementation
    console.log(`Monitoring notified of degradation level: ${level}`);
  }

  /**
   * Process queued requests by priority
   */
  private processQueuedRequests(): void {
    const priorities = [
      RequestPriority.CRITICAL,
      RequestPriority.HIGH,
      RequestPriority.MEDIUM,
      RequestPriority.LOW,
    ];
    
    for (const priority of priorities) {
      const queue = this.requestQueue.get(priority) || [];
      
      while (queue.length > 0 && this.canProcessRequest(priority)) {
        const request = queue.shift();
        if (request) {
          // Process the request
          console.log(`Processing queued ${priority} priority request`);
        }
      }
    }
  }

  /**
   * Check if request can be processed based on priority and degradation
   */
  public canProcessRequest(priority: RequestPriority): boolean {
    switch (this.currentLevel) {
      case DegradationLevel.NONE:
      case DegradationLevel.LOW:
        return true;
        
      case DegradationLevel.MEDIUM:
        return priority !== RequestPriority.LOW;
        
      case DegradationLevel.HIGH:
        return priority === RequestPriority.CRITICAL || priority === RequestPriority.HIGH;
        
      case DegradationLevel.CRITICAL:
        return priority === RequestPriority.CRITICAL;
        
      default:
        return true;
    }
  }

  /**
   * Get current degradation level
   */
  getCurrentLevel(): DegradationLevel {
    return this.currentLevel;
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): FeatureFlags {
    return FEATURE_AVAILABILITY[this.currentLevel];
  }

  /**
   * Get current metrics
   */
  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if a specific feature is available
   */
  isFeatureAvailable(feature: keyof FeatureFlags): boolean {
    return FEATURE_AVAILABILITY[this.currentLevel][feature];
  }

  /**
   * Get request priority from path
   */
  getRequestPriority(path: string): RequestPriority {
    // Check exact matches
    if (REQUEST_PRIORITY_MAP[path]) {
      return REQUEST_PRIORITY_MAP[path];
    }
    
    // Check path prefixes
    for (const [pattern, priority] of Object.entries(REQUEST_PRIORITY_MAP)) {
      if (path.startsWith(pattern)) {
        return priority;
      }
    }
    
    // Default to medium priority
    return RequestPriority.MEDIUM;
  }

  /**
   * Queue request if system is degraded
   */
  queueRequest(req: Request, priority: RequestPriority): boolean {
    if (!this.canProcessRequest(priority)) {
      const queue = this.requestQueue.get(priority) || [];
      
      // Limit queue size
      const maxQueueSize = 100;
      if (queue.length < maxQueueSize) {
        queue.push(req);
        return true;
      }
    }
    
    return false;
  }
}

// Create singleton instance
const degradationManager = new GracefulDegradationManager();

/**
 * Middleware for graceful degradation
 */
export const gracefulDegradationMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get request priority
    const priority = degradationManager.getRequestPriority(req.path);
    
    // Check if request should be queued or rejected
    if (!degradationManager.canProcessRequest(priority)) {
      // Try to queue the request
      if (degradationManager.queueRequest(req, priority)) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Your request has been queued and will be processed when resources are available',
          message_ar: 'تم وضع طلبك في قائمة الانتظار وسيتم معالجته عند توفر الموارد',
          retryAfter: 60,
        });
      } else {
        return res.status(503).json({
          error: 'Service overloaded',
          message: 'The service is currently overloaded. Please try again later.',
          message_ar: 'الخدمة محملة حالياً. يرجى المحاولة مرة أخرى لاحقاً',
          retryAfter: 300,
        });
      }
    }
    
    // Add degradation info to request
    (req as any).degradation = {
      level: degradationManager.getCurrentLevel(),
      features: degradationManager.getFeatureFlags(),
      priority,
    };
    
    // Add response headers
    res.setHeader('X-Degradation-Level', degradationManager.getCurrentLevel());
    res.setHeader('X-Request-Priority', priority);
    
    next();
  };
};

/**
 * Feature flag middleware
 */
export const featureGateMiddleware = (feature: keyof FeatureFlags) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!degradationManager.isFeatureAvailable(feature)) {
      return res.status(503).json({
        error: 'Feature temporarily unavailable',
        message: `The ${feature} feature is temporarily disabled due to high system load`,
        message_ar: `ميزة ${feature} معطلة مؤقتاً بسبب الحمل العالي على النظام`,
        retryAfter: 300,
      });
    }
    
    next();
  };
};

/**
 * Circuit breaker for external services
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number;

  constructor(
    threshold: number = 5,
    timeout: number = 60000,
    resetTimeout: number = 30000
  ) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.log('Circuit breaker opened due to failures');
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    console.log('Circuit breaker reset');
  }

  getState(): string {
    return this.state;
  }
}

// Export utilities
export default degradationManager;

export const getDegradationLevel = (): DegradationLevel => {
  return degradationManager.getCurrentLevel();
};

export const getFeatureFlags = (): FeatureFlags => {
  return degradationManager.getFeatureFlags();
};

export const isFeatureAvailable = (feature: keyof FeatureFlags): boolean => {
  return degradationManager.isFeatureAvailable(feature);
};

export const getSystemMetrics = (): SystemMetrics => {
  return degradationManager.getMetrics();
};