import { Pool, PoolConfig, Client } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Environment configuration
const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD!,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '10'),
    max: parseInt(process.env.DB_POOL_MAX || '100'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '5000'),
    maxUses: parseInt(process.env.DB_POOL_MAX_USES || '7500'),
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  },
};

// Connection pool metrics
interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionErrors: number;
  lastError?: string;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

class DatabasePool {
  private pool: Pool | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private metrics: PoolMetrics;
  private queryTimes: number[] = [];
  private readonly maxQueryTimeSamples = 1000;
  private readonly slowQueryThreshold = 1000; // ms
  private connectionRetries = 0;
  private readonly maxRetries = 3;
  private isShuttingDown = false;

  constructor() {
    this.metrics = {
      totalConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionErrors: 0,
      healthStatus: 'healthy',
    };
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.pool) {
      console.log('Database pool already initialized');
      return;
    }

    try {
      // Create PostgreSQL connection pool
      const poolConfig: PoolConfig = {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user,
        password: config.database.password,
        ssl: config.database.ssl,
        min: config.pool.min,
        max: config.pool.max,
        idleTimeoutMillis: config.pool.idleTimeoutMillis,
        connectionTimeoutMillis: config.pool.connectionTimeoutMillis,
        statement_timeout: config.pool.statementTimeout,
        query_timeout: config.pool.statementTimeout,
        application_name: 'intl-dossier-backend',
      };

      this.pool = new Pool(poolConfig);

      // Set up pool event handlers
      this.setupPoolEventHandlers();

      // Test the connection
      await this.testConnection();

      // Initialize Supabase client
      this.supabaseClient = createClient(
        config.supabase.url,
        config.supabase.serviceKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false,
          },
          db: {
            schema: 'public',
          },
        }
      );

      console.log('Database pool initialized successfully');
      console.log(`Pool configuration: min=${config.pool.min}, max=${config.pool.max}`);
    } catch (error) {
      console.error('Failed to initialize database pool:', error);
      this.metrics.connectionErrors++;
      throw error;
    }
  }

  /**
   * Set up event handlers for the pool
   */
  private setupPoolEventHandlers(): void {
    if (!this.pool) return;

    this.pool.on('connect', () => {
      this.metrics.totalConnections++;
      console.log(`New connection established. Total: ${this.metrics.totalConnections}`);
    });

    this.pool.on('acquire', () => {
      this.metrics.idleConnections--;
    });

    this.pool.on('release', () => {
      this.metrics.idleConnections++;
    });

    this.pool.on('error', (error) => {
      console.error('Pool error:', error);
      this.metrics.connectionErrors++;
      this.metrics.lastError = error.message;
      this.updateHealthStatus();
    });

    this.pool.on('remove', () => {
      this.metrics.totalConnections--;
      console.log(`Connection removed. Total: ${this.metrics.totalConnections}`);
    });
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log('Database connection test successful:', result.rows[0].now);
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query with metrics tracking
   */
  async query<T = any>(text: string, params?: any[]): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    if (this.isShuttingDown) {
      throw new Error('Database pool is shutting down');
    }

    const startTime = performance.now();
    let client;

    try {
      // Apply connection pooling strategy based on load
      client = await this.getClientWithStrategy();
      
      // Execute query
      const result = await client.query(text, params);
      
      // Track metrics
      const queryTime = performance.now() - startTime;
      this.trackQueryMetrics(queryTime);
      
      return result;
    } catch (error: any) {
      // Handle connection errors with retry logic
      if (this.isConnectionError(error) && this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`Retrying query (attempt ${this.connectionRetries}/${this.maxRetries})`);
        return this.query(text, params);
      }
      
      this.metrics.connectionErrors++;
      this.updateHealthStatus();
      throw error;
    } finally {
      if (client) {
        client.release();
      }
      this.connectionRetries = 0;
    }
  }

  /**
   * Get a client with load balancing strategy
   */
  private async getClientWithStrategy() {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }

    // Check pool health
    const poolStatus = await this.getPoolStatus();
    
    // If pool is under heavy load, apply backpressure
    if (poolStatus.waitingClients > config.pool.max * 0.5) {
      console.warn('Pool under heavy load, applying backpressure');
      await this.delay(Math.random() * 100); // Random delay to prevent thundering herd
    }
    
    // If pool is at capacity, consider graceful degradation
    if (poolStatus.totalConnections >= config.pool.max * 0.9) {
      this.metrics.healthStatus = 'degraded';
      console.warn('Pool near capacity, entering degraded mode');
    }
    
    return this.pool.connect();
  }

  /**
   * Track query performance metrics
   */
  private trackQueryMetrics(queryTime: number): void {
    this.metrics.totalQueries++;
    
    // Track query times for averaging
    this.queryTimes.push(queryTime);
    if (this.queryTimes.length > this.maxQueryTimeSamples) {
      this.queryTimes.shift();
    }
    
    // Calculate average query time
    this.metrics.averageQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    
    // Track slow queries
    if (queryTime > this.slowQueryThreshold) {
      this.metrics.slowQueries++;
      console.warn(`Slow query detected: ${queryTime.toFixed(2)}ms`);
    }
    
    this.updateHealthStatus();
  }

  /**
   * Check if error is connection-related
   */
  private isConnectionError(error: any): boolean {
    const connectionErrors = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'connection terminated',
      'Connection terminated unexpectedly',
    ];
    
    return connectionErrors.some(errType => 
      error.message?.includes(errType) || error.code === errType
    );
  }

  /**
   * Update health status based on metrics
   */
  private updateHealthStatus(): void {
    // Determine health based on multiple factors
    if (
      this.metrics.connectionErrors > 10 ||
      this.metrics.averageQueryTime > 5000 ||
      this.metrics.slowQueries > 100
    ) {
      this.metrics.healthStatus = 'unhealthy';
    } else if (
      this.metrics.connectionErrors > 5 ||
      this.metrics.averageQueryTime > 2000 ||
      this.metrics.slowQueries > 50 ||
      this.metrics.totalConnections >= config.pool.max * 0.9
    ) {
      this.metrics.healthStatus = 'degraded';
    } else {
      this.metrics.healthStatus = 'healthy';
    }
  }

  /**
   * Get current pool status
   */
  async getPoolStatus(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  }> {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }

    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
    };
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down database pool...');
    this.isShuttingDown = true;

    // Wait for active queries to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.metrics.waitingClients > 0) {
      if (Date.now() - startTime > shutdownTimeout) {
        console.warn('Shutdown timeout reached, forcing pool closure');
        break;
      }
      await this.delay(100);
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    console.log('Database pool shut down successfully');
  }

  /**
   * Get Supabase client
   */
  getSupabaseClient(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabaseClient;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Optimize pool configuration based on metrics
   */
  async optimizePool(): Promise<void> {
    const metrics = this.getMetrics();
    const status = await this.getPoolStatus();

    // Auto-adjust pool size based on usage patterns
    if (metrics.healthStatus === 'degraded' && status.waitingClients > 0) {
      // Consider increasing pool size
      console.log('Pool optimization: Consider increasing max connections');
    }

    if (status.idleConnections > config.pool.max * 0.5 && metrics.totalQueries < 100) {
      // Consider decreasing pool size
      console.log('Pool optimization: Consider decreasing min connections');
    }

    // Clean up idle connections
    if (status.idleConnections > config.pool.min) {
      console.log('Pool optimization: Cleaning up excess idle connections');
      // This happens automatically with idleTimeoutMillis
    }
  }
}

// Create singleton instance
const databasePool = new DatabasePool();

// Export pool instance and utilities
export default databasePool;

export const initializeDatabase = async (): Promise<void> => {
  await databasePool.initialize();
};

export const query = async <T = any>(text: string, params?: any[]): Promise<T> => {
  return databasePool.query<T>(text, params);
};

export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  return databasePool.transaction(callback);
};

export const getPoolMetrics = (): PoolMetrics => {
  return databasePool.getMetrics();
};

export const getSupabase = (): SupabaseClient => {
  return databasePool.getSupabaseClient();
};

export const shutdownDatabase = async (): Promise<void> => {
  await databasePool.shutdown();
};

// Health check endpoint handler
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: PoolMetrics;
  details: any;
}> => {
  const metrics = databasePool.getMetrics();
  const poolStatus = await databasePool.getPoolStatus();
  
  return {
    status: metrics.healthStatus,
    metrics,
    details: {
      pool: poolStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  };
};

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  await shutdownDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, starting graceful shutdown');
  await shutdownDatabase();
  process.exit(0);
});