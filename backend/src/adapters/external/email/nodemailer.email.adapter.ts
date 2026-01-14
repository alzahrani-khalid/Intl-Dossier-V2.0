/**
 * Nodemailer Email Adapter
 *
 * Anti-Corruption Layer (ACL) adapter that implements IEmailService
 * using Nodemailer as the underlying transport.
 *
 * This adapter translates domain email requests to Nodemailer-specific
 * API calls and transforms responses back to domain models.
 *
 * @module adapters/external/email/nodemailer.email.adapter
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodemailer = require('nodemailer')

// Define types for nodemailer since @types/nodemailer may not be installed
interface SendMailOptions {
  from?: string
  to?: string | string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  subject?: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType: string
    cid?: string
  }>
  headers?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
}

interface SMTPTransportSentMessageInfo {
  messageId?: string
  envelope?: { from: string; to: string[] }
  accepted?: string[]
  rejected?: string[]
}

interface Transporter {
  sendMail(options: SendMailOptions): Promise<SMTPTransportSentMessageInfo>
  verify(): Promise<boolean>
  close(): void
}
import type {
  IEmailService,
  EmailRequest,
  TemplatedEmailRequest,
  EmailResult,
  BulkEmailResult,
  EmailStatus,
  EmailRecipient,
  EmailTemplate,
  EmailServiceConfig,
} from '../../../core/ports/services'

/**
 * Nodemailer adapter configuration
 */
export interface NodemailerAdapterConfig extends EmailServiceConfig {
  smtp: {
    host: string
    port: number
    secure: boolean
    auth?: {
      user: string
      pass: string
    }
  }
  pool?: boolean
  maxConnections?: number
}

/**
 * Email template registry for bilingual templates
 */
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'account_activation',
    name: 'Account Activation',
    subject: {
      ar: 'تفعيل حساب نظام الملف الدولي',
      en: 'Activate Your International Dossier Account',
    },
    htmlBody: {
      ar: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً {{fullName}}،</h2>
          <p>تم إنشاء حساب لك في نظام الملف الدولي.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{activationLink}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">تفعيل الحساب</a>
          </p>
          <p>هذا الرابط صالح لمدة 24 ساعة.</p>
        </div>
      `,
      en: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome {{fullName}},</h2>
          <p>An account has been created for you in the International Dossier system.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{activationLink}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Activate Account</a>
          </p>
          <p>This link is valid for 24 hours.</p>
        </div>
      `,
    },
    requiredVariables: ['fullName', 'activationLink'],
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    subject: {
      ar: 'إعادة تعيين كلمة المرور',
      en: 'Reset Your Password',
    },
    htmlBody: {
      ar: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً {{fullName}}،</h2>
          <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a>
          </p>
          <p>هذا الرابط صالح لمدة ساعة واحدة.</p>
        </div>
      `,
      en: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello {{fullName}},</h2>
          <p>We received a request to reset the password for your account.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          </p>
          <p>This link is valid for 1 hour.</p>
        </div>
      `,
    },
    requiredVariables: ['fullName', 'resetLink'],
  },
  {
    id: 'notification',
    name: 'Generic Notification',
    subject: {
      ar: '{{subject}}',
      en: '{{subject}}',
    },
    htmlBody: {
      ar: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>{{title}}</h2>
          <p>{{message}}</p>
          {{#if actionLink}}
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{actionLink}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">{{actionText}}</a>
          </p>
          {{/if}}
        </div>
      `,
      en: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>{{title}}</h2>
          <p>{{message}}</p>
          {{#if actionLink}}
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{actionLink}}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">{{actionText}}</a>
          </p>
          {{/if}}
        </div>
      `,
    },
    requiredVariables: ['subject', 'title', 'message'],
  },
]

/**
 * Nodemailer Email Adapter
 *
 * Implements IEmailService using Nodemailer for SMTP-based email delivery.
 * Acts as an Anti-Corruption Layer protecting the domain from Nodemailer API changes.
 */
export class NodemailerEmailAdapter implements IEmailService {
  private transporter: Transporter | null = null
  private readonly config: NodemailerAdapterConfig
  private readonly templates: Map<string, EmailTemplate>
  private isConnected = false

  constructor(config: NodemailerAdapterConfig) {
    this.config = config
    this.templates = new Map(DEFAULT_TEMPLATES.map((t) => [t.id, t]))
  }

  /**
   * Initialize the transporter (lazy initialization)
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter && this.isConnected) {
      return this.transporter
    }

    const transporter: Transporter = nodemailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: this.config.smtp.auth,
      pool: this.config.pool ?? true,
      maxConnections: this.config.maxConnections ?? 5,
    })

    // Verify connection
    try {
      await transporter.verify()
      this.isConnected = true
      this.transporter = transporter
    } catch (error) {
      this.isConnected = false
      throw error
    }

    return transporter
  }

  /**
   * Transform domain EmailRequest to Nodemailer SendMailOptions
   */
  private transformToNodemailerOptions(request: EmailRequest): SendMailOptions {
    const recipients = Array.isArray(request.to) ? request.to : [request.to]

    return {
      from: request.from
        ? `${request.from.name} <${request.from.email}>`
        : `${this.config.defaultFrom.name} <${this.config.defaultFrom.email}>`,
      to: recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
      cc: request.cc?.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
      bcc: request.bcc?.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
      replyTo: request.replyTo
        ? `${request.replyTo.name} <${request.replyTo.email}>`
        : this.config.replyTo
          ? `${this.config.replyTo.name} <${this.config.replyTo.email}>`
          : undefined,
      subject: request.subject,
      text: request.text,
      html: request.html,
      attachments: request.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        cid: a.cid,
      })),
      headers: request.headers,
      priority: request.priority,
    }
  }

  /**
   * Transform Nodemailer response to domain EmailResult
   */
  private transformToEmailResult(
    response: SMTPTransportSentMessageInfo,
    success: boolean,
    error?: Error,
  ): EmailResult {
    return {
      success,
      messageId: response?.messageId,
      provider: 'nodemailer',
      timestamp: new Date(),
      error: error
        ? {
            code: 'SEND_FAILED',
            message: error.message,
            retryable: this.isRetryableError(error),
          }
        : undefined,
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('temporarily')
    )
  }

  /**
   * Render template with variable substitution
   */
  private renderTemplateContent(template: string, variables: Record<string, unknown>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, String(value ?? ''))
    }
    // Remove unmatched variables
    result = result.replace(/\{\{[\w.]+\}\}/g, '')
    return result
  }

  /**
   * Send a single email
   */
  async send(request: EmailRequest): Promise<EmailResult> {
    try {
      const transporter = await this.getTransporter()
      const mailOptions = this.transformToNodemailerOptions(request)

      const response = await transporter.sendMail(mailOptions)
      return this.transformToEmailResult(response, true)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return this.transformToEmailResult({} as SMTPTransportSentMessageInfo, false, err)
    }
  }

  /**
   * Send a templated email
   */
  async sendTemplate(request: TemplatedEmailRequest): Promise<EmailResult> {
    const template = this.templates.get(request.templateId)
    if (!template) {
      return {
        success: false,
        provider: 'nodemailer',
        timestamp: new Date(),
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `Template '${request.templateId}' not found`,
          retryable: false,
        },
      }
    }

    const language = request.language ?? 'en'
    const rendered = await this.renderTemplate(request.templateId, request.templateData, language)

    const emailRequest: EmailRequest = {
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      from: request.from,
      replyTo: request.replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: request.attachments,
      trackingId: request.trackingId,
    }

    return this.send(emailRequest)
  }

  /**
   * Send bulk emails
   */
  async sendBulk(
    recipients: EmailRecipient[],
    request: Omit<EmailRequest, 'to'>,
  ): Promise<BulkEmailResult> {
    const results = new Map<string, EmailResult>()
    let successful = 0
    let failed = 0

    // Respect max recipients per request
    const maxPerBatch = this.config.maxRecipientsPerRequest ?? 50
    const batches: EmailRecipient[][] = []

    for (let i = 0; i < recipients.length; i += maxPerBatch) {
      batches.push(recipients.slice(i, i + maxPerBatch))
    }

    for (const batch of batches) {
      const promises = batch.map(async (recipient) => {
        const result = await this.send({
          ...request,
          to: recipient,
        })
        results.set(recipient.email, result)
        if (result.success) {
          successful++
        } else {
          failed++
        }
      })

      await Promise.all(promises)
    }

    return {
      totalRequested: recipients.length,
      successful,
      failed,
      results,
    }
  }

  /**
   * Send bulk templated emails
   */
  async sendBulkTemplate(requests: TemplatedEmailRequest[]): Promise<BulkEmailResult> {
    const results = new Map<string, EmailResult>()
    let successful = 0
    let failed = 0

    const promises = requests.map(async (request) => {
      const recipients = Array.isArray(request.to) ? request.to : [request.to]
      const result = await this.sendTemplate(request)

      for (const recipient of recipients) {
        results.set(recipient.email, result)
      }

      if (result.success) {
        successful += recipients.length
      } else {
        failed += recipients.length
      }
    })

    await Promise.all(promises)

    const totalRequested = requests.reduce((sum, r) => {
      const recipients = Array.isArray(r.to) ? r.to : [r.to]
      return sum + recipients.length
    }, 0)

    return {
      totalRequested,
      successful,
      failed,
      results,
    }
  }

  /**
   * Get email delivery status (not supported by basic SMTP)
   */
  async getStatus(_messageId: string): Promise<EmailStatus | null> {
    // Basic SMTP doesn't support delivery status tracking
    // This would require integration with a provider that supports webhooks
    return null
  }

  /**
   * Verify email configuration is valid
   */
  async verifyConfiguration(): Promise<boolean> {
    try {
      await this.getTransporter()
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if the email service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter()
      await transporter.verify()
      return true
    } catch {
      this.isConnected = false
      return false
    }
  }

  /**
   * Get registered templates
   */
  getAvailableTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(
    templateId: string,
    variables: Record<string, unknown>,
    language: 'ar' | 'en',
  ): Promise<{ subject: string; html: string; text?: string }> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template '${templateId}' not found`)
    }

    const subject = this.renderTemplateContent(template.subject[language], variables)
    const html = this.renderTemplateContent(template.htmlBody[language], variables)
    const text = template.textBody
      ? this.renderTemplateContent(template.textBody[language], variables)
      : undefined

    return { subject, html, text }
  }

  /**
   * Register a custom template
   */
  registerTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * Dispose the adapter resources
   */
  async dispose(): Promise<void> {
    if (this.transporter) {
      this.transporter.close()
      this.transporter = null
      this.isConnected = false
    }
  }
}

/**
 * Factory function to create NodemailerEmailAdapter
 */
export function createNodemailerEmailAdapter(
  config: NodemailerAdapterConfig,
): NodemailerEmailAdapter {
  return new NodemailerEmailAdapter(config)
}
