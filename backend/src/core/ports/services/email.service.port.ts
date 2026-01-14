/**
 * Email Service Port
 *
 * Defines the contract for email operations.
 * This is an Anti-Corruption Layer (ACL) port that abstracts
 * email provider implementations (SendGrid, Nodemailer, AWS SES, etc.)
 *
 * @module core/ports/services/email.service.port
 */

/**
 * Email recipient information
 */
export interface EmailRecipient {
  email: string
  name?: string
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType: string
  cid?: string // Content-ID for inline images
}

/**
 * Email address configuration
 */
export interface EmailAddress {
  email: string
  name?: string
}

/**
 * Email send request - domain model
 */
export interface EmailRequest {
  to: EmailRecipient | EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  from?: EmailAddress
  replyTo?: EmailAddress
  subject: string
  text?: string
  html?: string
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
  trackingId?: string
}

/**
 * Template-based email request
 */
export interface TemplatedEmailRequest {
  to: EmailRecipient | EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  from?: EmailAddress
  replyTo?: EmailAddress
  templateId: string
  templateData: Record<string, unknown>
  attachments?: EmailAttachment[]
  language?: 'ar' | 'en'
  trackingId?: string
}

/**
 * Email send result - domain model
 */
export interface EmailResult {
  success: boolean
  messageId?: string
  provider: string
  timestamp: Date
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}

/**
 * Bulk email result
 */
export interface BulkEmailResult {
  totalRequested: number
  successful: number
  failed: number
  results: Map<string, EmailResult>
}

/**
 * Email delivery status
 */
export type EmailDeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed'
  | 'failed'

/**
 * Email status query result
 */
export interface EmailStatus {
  messageId: string
  status: EmailDeliveryStatus
  recipient: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  defaultFrom: EmailAddress
  replyTo?: EmailAddress
  maxRecipientsPerRequest?: number
  retryAttempts?: number
  retryDelayMs?: number
}

/**
 * Email template definition
 */
export interface EmailTemplate {
  id: string
  name: string
  subject: {
    ar: string
    en: string
  }
  htmlBody: {
    ar: string
    en: string
  }
  textBody?: {
    ar: string
    en: string
  }
  requiredVariables: string[]
}

/**
 * Email Service Port
 *
 * Contract for email operations. Implementations can use
 * Nodemailer, SendGrid, AWS SES, Mailgun, or other providers.
 *
 * This serves as an Anti-Corruption Layer (ACL) to prevent
 * external email API changes from affecting the domain.
 */
export interface IEmailService {
  /**
   * Send a single email
   */
  send(request: EmailRequest): Promise<EmailResult>

  /**
   * Send a templated email
   */
  sendTemplate(request: TemplatedEmailRequest): Promise<EmailResult>

  /**
   * Send bulk emails (same content to multiple recipients)
   */
  sendBulk(
    recipients: EmailRecipient[],
    request: Omit<EmailRequest, 'to'>,
  ): Promise<BulkEmailResult>

  /**
   * Send bulk templated emails
   */
  sendBulkTemplate(requests: TemplatedEmailRequest[]): Promise<BulkEmailResult>

  /**
   * Get email delivery status
   */
  getStatus(messageId: string): Promise<EmailStatus | null>

  /**
   * Verify email configuration is valid
   */
  verifyConfiguration(): Promise<boolean>

  /**
   * Check if the email service is available
   */
  isAvailable(): Promise<boolean>

  /**
   * Get registered templates
   */
  getAvailableTemplates(): EmailTemplate[]

  /**
   * Render a template with variables (for preview)
   */
  renderTemplate(
    templateId: string,
    variables: Record<string, unknown>,
    language: 'ar' | 'en',
  ): Promise<{ subject: string; html: string; text?: string }>
}

/**
 * Email service token for dependency injection
 */
export const EMAIL_SERVICE_TOKEN = Symbol('IEmailService')
