/**
 * CircuitBreakerService (T050)
 * Circuit breaker pattern for AI service calls with fallback support
 */

type CircuitState = 'closed' | 'open' | 'half-open'

interface CircuitBreakerOptions {
  failureThreshold?: number // Number of failures before opening circuit
  successThreshold?: number // Number of successes to close circuit from half-open
  timeout?: number // Time in ms before attempting half-open
  monitoringPeriod?: number // Time window in ms for failure counting
}

interface CircuitBreakerStats {
  state: CircuitState
  failureCount: number
  successCount: number
  lastFailureTime: number | null
  lastStateChange: number
  totalRequests: number
  totalFailures: number
  totalSuccesses: number
}

export class CircuitBreakerService {
  private state: CircuitState = 'closed'
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number | null = null
  private lastStateChange: number = Date.now()
  private totalRequests: number = 0
  private totalFailures: number = 0
  private totalSuccesses: number = 0

  private readonly failureThreshold: number
  private readonly successThreshold: number
  private readonly timeout: number
  private readonly monitoringPeriod: number

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 3
    this.successThreshold = options.successThreshold || 2
    this.timeout = options.timeout || 30000 // 30 seconds default
    this.monitoringPeriod = options.monitoringPeriod || 30000 // 30 seconds default
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<{ data: T | null; usedFallback: boolean; error?: Error }> {
    this.totalRequests++

    // Check if circuit should transition to half-open
    if (this.state === 'open' && this.shouldAttemptReset()) {
      this.state = 'half-open'
      this.lastStateChange = Date.now()
    }

    // If circuit is open, use fallback immediately
    if (this.state === 'open') {
      console.warn('[CircuitBreaker] Circuit is OPEN, using fallback')
      if (fallback) {
        try {
          const data = await fallback()
          return { data, usedFallback: true }
        } catch (error) {
          return { data: null, usedFallback: true, error: error as Error }
        }
      }
      return {
        data: null,
        usedFallback: false,
        error: new Error('Circuit breaker is open and no fallback provided'),
      }
    }

    // Try executing the main function
    try {
      const data = await fn()
      this.onSuccess()
      return { data, usedFallback: false }
    } catch (error) {
      this.onFailure()

      // Use fallback if circuit opened or in half-open
      if (this.state === 'open' && fallback) {
        console.warn('[CircuitBreaker] Circuit opened, using fallback')
        try {
          const data = await fallback()
          return { data, usedFallback: true }
        } catch (fallbackError) {
          return { data: null, usedFallback: true, error: fallbackError as Error }
        }
      }

      return { data: null, usedFallback: false, error: error as Error }
    }
  }

  /**
   * Record a successful execution
   */
  private onSuccess(): void {
    this.totalSuccesses++
    this.failureCount = 0

    if (this.state === 'half-open') {
      this.successCount++

      if (this.successCount >= this.successThreshold) {
        this.state = 'closed'
        this.successCount = 0
        this.lastStateChange = Date.now()
      }
    }
  }

  /**
   * Record a failed execution
   */
  private onFailure(): void {
    this.totalFailures++
    this.failureCount++
    this.lastFailureTime = Date.now()

    // Clear old failures outside monitoring period
    if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.monitoringPeriod) {
      this.failureCount = 1
    }

    // Open circuit if failure threshold reached
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
      this.lastStateChange = Date.now()
      this.successCount = 0
      console.error(
        `[CircuitBreaker] Circuit OPENED after ${this.failureCount} failures within ${this.monitoringPeriod}ms`,
      )
    } else if (this.state === 'half-open') {
      // Immediately reopen if failure in half-open state
      this.state = 'open'
      this.lastStateChange = Date.now()
      this.successCount = 0
      console.error('[CircuitBreaker] Circuit reopened from HALF-OPEN state')
    }
  }

  /**
   * Check if circuit should attempt to transition to half-open
   */
  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null && Date.now() - this.lastFailureTime >= this.timeout
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === 'open'
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.lastStateChange = Date.now()
  }
}

// Singleton instance for AI service calls
export const aiServiceCircuitBreaker = new CircuitBreakerService({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  monitoringPeriod: 30000, // 30 seconds
})
