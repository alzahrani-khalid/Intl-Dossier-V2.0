/**
 * ACL Registration Module
 *
 * Registers Anti-Corruption Layer (ACL) adapters with the
 * dependency injection container.
 *
 * This module provides factory functions for creating and
 * registering external service adapters with proper configuration.
 *
 * @module container/acl-registration
 */

import { ServiceProvider } from './service-provider'
import {
  EMAIL_SERVICE_TOKEN,
  DIGITAL_SIGNATURE_SERVICE_TOKEN,
  CALENDAR_SERVICE_TOKEN,
} from '../core/ports/services'
import {
  NodemailerEmailAdapter,
  DocuSignSignatureAdapter,
  SupabaseCalendarAdapter,
  AnythingLLMAIAdapter,
  AI_SERVICE_TOKEN,
  type NodemailerAdapterConfig,
  type DocuSignAdapterConfig,
  type SupabaseCalendarAdapterConfig,
  type AnythingLLMAdapterConfig,
} from '../adapters/external'

/**
 * ACL configuration from environment
 */
export interface ACLConfiguration {
  email?: {
    provider: 'nodemailer' | 'sendgrid'
    config: NodemailerAdapterConfig
  }
  signature?: {
    provider: 'docusign' | 'pki'
    config: DocuSignAdapterConfig
  }
  calendar?: {
    provider: 'supabase' | 'google' | 'outlook'
    config: SupabaseCalendarAdapterConfig
  }
  ai?: {
    provider: 'anythingllm' | 'openai' | 'anthropic'
    config: AnythingLLMAdapterConfig
  }
}

/**
 * Load ACL configuration from environment variables
 */
export function loadACLConfiguration(): ACLConfiguration {
  return {
    email: {
      provider: 'nodemailer',
      config: {
        defaultFrom: {
          email: process.env.EMAIL_FROM || 'noreply@stats.gov.sa',
          name: process.env.EMAIL_FROM_NAME || 'GASTAT International Dossier',
        },
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS || '',
              }
            : undefined,
        },
        pool: true,
        maxConnections: 5,
        retryAttempts: 3,
        retryDelayMs: 1000,
      },
    },
    signature: {
      provider: 'docusign',
      config: {
        accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
        clientId: process.env.DOCUSIGN_CLIENT_ID || '',
        clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || '',
        basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net',
        authServer: process.env.DOCUSIGN_AUTH_SERVER || 'https://account-d.docusign.com',
        webhookSecret: process.env.DOCUSIGN_WEBHOOK_SECRET,
      },
    },
    calendar: {
      provider: 'supabase',
      config: {
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        tableName: 'calendar_events',
        defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Riyadh',
      },
    },
    ai: {
      provider: 'anythingllm',
      config: {
        baseUrl: process.env.ANYTHINGLLM_URL || 'http://localhost:3001',
        apiKey: process.env.ANYTHINGLLM_API_KEY,
        timeout: 30000,
        defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-3.5-turbo',
        embeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-ada-002',
        maxRetries: 3,
        healthCheckInterval: 60000,
      },
    },
  }
}

/**
 * Register Email Service ACL
 */
export function registerEmailService(
  provider: ServiceProvider,
  config: NodemailerAdapterConfig,
): void {
  provider.registerSingleton(EMAIL_SERVICE_TOKEN, () => {
    return new NodemailerEmailAdapter(config)
  })
}

/**
 * Register Digital Signature Service ACL
 */
export function registerSignatureService(
  provider: ServiceProvider,
  config: DocuSignAdapterConfig,
): void {
  provider.registerSingleton(DIGITAL_SIGNATURE_SERVICE_TOKEN, () => {
    return new DocuSignSignatureAdapter(config)
  })
}

/**
 * Register Calendar Service ACL
 */
export function registerCalendarService(
  provider: ServiceProvider,
  config: SupabaseCalendarAdapterConfig,
): void {
  provider.registerSingleton(CALENDAR_SERVICE_TOKEN, () => {
    return new SupabaseCalendarAdapter(config)
  })
}

/**
 * Register AI Service ACL
 */
export function registerAIService(
  provider: ServiceProvider,
  config: AnythingLLMAdapterConfig,
): void {
  provider.registerSingleton(AI_SERVICE_TOKEN, () => {
    return new AnythingLLMAIAdapter(config)
  })
}

/**
 * Register all ACL services with the dependency injection container
 */
export function registerACLServices(
  provider: ServiceProvider,
  configuration?: ACLConfiguration,
): void {
  const config = configuration ?? loadACLConfiguration()

  // Register Email Service
  if (config.email) {
    registerEmailService(provider, config.email.config)
  }

  // Register Digital Signature Service
  if (config.signature) {
    registerSignatureService(provider, config.signature.config)
  }

  // Register Calendar Service
  if (config.calendar) {
    registerCalendarService(provider, config.calendar.config)
  }

  // Register AI Service
  if (config.ai) {
    registerAIService(provider, config.ai.config)
  }
}

/**
 * Get registered ACL service tokens
 */
export function getACLServiceTokens(): symbol[] {
  return [
    EMAIL_SERVICE_TOKEN,
    DIGITAL_SIGNATURE_SERVICE_TOKEN,
    CALENDAR_SERVICE_TOKEN,
    AI_SERVICE_TOKEN,
  ]
}
