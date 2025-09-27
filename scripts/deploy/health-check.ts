#!/usr/bin/env node

import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  message?: string
  responseTime?: number
  details?: Record<string, any>
}

class HealthChecker {
  private results: HealthCheckResult[] = []
  private startTime: number = Date.now()

  constructor(
    private apiUrl: string,
    private supabaseUrl: string,
    private supabaseKey: string
  ) {}

  async checkAll(): Promise<void> {
    console.log('🏥 Starting health checks...\n')

    await this.checkAPI()
    await this.checkDatabase()
    await this.checkRealtime()
    await this.checkStorage()
    await this.checkAuth()
    await this.checkCache()
    await this.checkExternalServices()

    this.printResults()
    this.exitWithCode()
  }

  private async checkAPI(): Promise<void> {
    const start = Date.now()
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000,
      })

      this.results.push({
        service: 'API Server',
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
        details: response.data,
      })
    } catch (error) {
      this.results.push({
        service: 'API Server',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - start,
      })
    }
  }

  private async checkDatabase(): Promise<void> {
    const start = Date.now()
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey)

      // Test read
      const { data, error } = await supabase
        .from('countries')
        .select('id')
        .limit(1)

      if (error) throw error

      // Test write (using a test table)
      const testWrite = await supabase
        .from('health_checks')
        .upsert({
          id: 'health-check',
          checked_at: new Date().toISOString(),
        })

      this.results.push({
        service: 'Database',
        status: 'healthy',
        responseTime: Date.now() - start,
        details: {
          read: 'ok',
          write: testWrite.error ? 'failed' : 'ok',
        },
      })
    } catch (error) {
      this.results.push({
        service: 'Database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        responseTime: Date.now() - start,
      })
    }
  }

  private async checkRealtime(): Promise<void> {
    const start = Date.now()
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey)

      const channel = supabase.channel('health-check')

      const subscribePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          channel.unsubscribe()
          reject(new Error('Subscription timeout'))
        }, 5000)

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            channel.unsubscribe()
            resolve()
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout)
            reject(new Error(`Subscription failed: ${status}`))
          }
        })
      })

      await subscribePromise

      this.results.push({
        service: 'Realtime',
        status: 'healthy',
        responseTime: Date.now() - start,
      })
    } catch (error) {
      this.results.push({
        service: 'Realtime',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Realtime connection failed',
        responseTime: Date.now() - start,
      })
    }
  }

  private async checkStorage(): Promise<void> {
    const start = Date.now()
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey)

      // List buckets
      const { data: buckets, error } = await supabase.storage.listBuckets()

      if (error) throw error

      this.results.push({
        service: 'Storage',
        status: 'healthy',
        responseTime: Date.now() - start,
        details: {
          buckets: buckets?.length || 0,
        },
      })
    } catch (error) {
      this.results.push({
        service: 'Storage',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Storage service failed',
        responseTime: Date.now() - start,
      })
    }
  }

  private async checkAuth(): Promise<void> {
    const start = Date.now()
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey)

      // Check if auth service is responsive
      const { error } = await supabase.auth.getSession()

      // Not having a session is fine, we just want to check the service
      this.results.push({
        service: 'Authentication',
        status: 'healthy',
        responseTime: Date.now() - start,
      })
    } catch (error) {
      this.results.push({
        service: 'Authentication',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Auth service failed',
        responseTime: Date.now() - start,
      })
    }
  }

  private async checkCache(): Promise<void> {
    const start = Date.now()
    try {
      // Check Redis if configured
      if (process.env.REDIS_URL) {
        const response = await axios.get(`${this.apiUrl}/health/cache`, {
          timeout: 2000,
        })

        this.results.push({
          service: 'Cache (Redis)',
          status: response.data.status === 'ok' ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
          details: response.data,
        })
      } else {
        this.results.push({
          service: 'Cache (Redis)',
          status: 'healthy',
          message: 'Not configured (using in-memory cache)',
          responseTime: 0,
        })
      }
    } catch (error) {
      this.results.push({
        service: 'Cache (Redis)',
        status: 'degraded',
        message: 'Cache unavailable, using fallback',
        responseTime: Date.now() - start,
      })
    }
  }

  private async checkExternalServices(): Promise<void> {
    // Check AnythingLLM
    await this.checkAnythingLLM()

    // Check other external services
    await this.checkWhisperAPI()
  }

  private async checkAnythingLLM(): Promise<void> {
    const start = Date.now()
    try {
      if (process.env.ANYTHINGLLM_URL) {
        const response = await axios.get(
          `${process.env.ANYTHINGLLM_URL}/api/health`,
          {
            timeout: 5000,
            headers: {
              'Authorization': `Bearer ${process.env.ANYTHINGLLM_API_KEY}`,
            },
          }
        )

        this.results.push({
          service: 'AnythingLLM',
          status: response.status === 200 ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
        })
      } else {
        this.results.push({
          service: 'AnythingLLM',
          status: 'healthy',
          message: 'Not configured (optional service)',
        })
      }
    } catch (error) {
      this.results.push({
        service: 'AnythingLLM',
        status: 'degraded',
        message: 'AI service unavailable (non-critical)',
        responseTime: Date.now() - start,
      })
    }
  }

  private async checkWhisperAPI(): Promise<void> {
    const start = Date.now()
    try {
      if (process.env.WHISPER_API_URL) {
        const response = await axios.get(
          `${process.env.WHISPER_API_URL}/health`,
          {
            timeout: 3000,
          }
        )

        this.results.push({
          service: 'Whisper API',
          status: response.status === 200 ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
        })
      } else {
        this.results.push({
          service: 'Whisper API',
          status: 'healthy',
          message: 'Not configured (optional service)',
        })
      }
    } catch (error) {
      this.results.push({
        service: 'Whisper API',
        status: 'degraded',
        message: 'Voice service unavailable (non-critical)',
        responseTime: Date.now() - start,
      })
    }
  }

  private printResults(): void {
    const totalTime = Date.now() - this.startTime
    const healthy = this.results.filter(r => r.status === 'healthy').length
    const unhealthy = this.results.filter(r => r.status === 'unhealthy').length
    const degraded = this.results.filter(r => r.status === 'degraded').length

    console.log('\n📊 Health Check Results\n')
    console.log('=' .repeat(60))

    this.results.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' :
                   result.status === 'degraded' ? '⚠️' : '❌'

      console.log(`${icon} ${result.service}: ${result.status.toUpperCase()}`)

      if (result.responseTime) {
        console.log(`   Response time: ${result.responseTime}ms`)
      }

      if (result.message) {
        console.log(`   Message: ${result.message}`)
      }

      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details)}`)
      }

      console.log('')
    })

    console.log('=' .repeat(60))
    console.log('\n📈 Summary:')
    console.log(`   Healthy: ${healthy}`)
    console.log(`   Degraded: ${degraded}`)
    console.log(`   Unhealthy: ${unhealthy}`)
    console.log(`   Total time: ${totalTime}ms\n`)

    // Overall status
    const overallStatus = unhealthy > 0 ? 'UNHEALTHY' :
                         degraded > 0 ? 'DEGRADED' : 'HEALTHY'

    const statusIcon = overallStatus === 'HEALTHY' ? '✅' :
                      overallStatus === 'DEGRADED' ? '⚠️' : '❌'

    console.log(`${statusIcon} Overall Status: ${overallStatus}\n`)
  }

  private exitWithCode(): void {
    const unhealthy = this.results.filter(r => r.status === 'unhealthy').length

    // Exit with error code if any critical service is unhealthy
    if (unhealthy > 0) {
      process.exit(1)
    }

    process.exit(0)
  }
}

// Run health checks
async function main() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000'
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
  const supabaseKey = process.env.SUPABASE_ANON_KEY || ''

  if (!supabaseKey) {
    console.error('❌ SUPABASE_ANON_KEY is required')
    process.exit(1)
  }

  const checker = new HealthChecker(apiUrl, supabaseUrl, supabaseKey)
  await checker.checkAll()
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

main()