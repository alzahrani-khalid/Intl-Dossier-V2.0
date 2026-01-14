/**
 * DocuSign Digital Signature Adapter
 *
 * Anti-Corruption Layer (ACL) adapter that implements IDigitalSignatureService
 * using DocuSign as the underlying signature provider.
 *
 * This adapter translates domain signature requests to DocuSign-specific
 * API calls and transforms responses back to domain models.
 *
 * @module adapters/external/signature/docusign.signature.adapter
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  IDigitalSignatureService,
  SignatureRequest,
  SignatureResult,
  SignatureEnvelopeStatus,
  SignerStatus,
  SignedDocument,
  SignatureVerificationResult,
  SignatureWebhookEvent,
  SignatureStatus,
} from '../../../core/ports/services'

/**
 * DocuSign adapter configuration
 */
export interface DocuSignAdapterConfig {
  accountId: string
  clientId: string
  clientSecret: string
  basePath: string
  authServer: string
  redirectUri?: string
  webhookSecret?: string
}

/**
 * DocuSign API response types (external model)
 */
interface DocuSignEnvelopeResponse {
  envelopeId: string
  status: string
  statusChangedDateTime: string
  documents?: Array<{
    documentId: string
    name: string
    uri: string
    pages: number
  }>
  recipients?: {
    signers?: DocuSignRecipientResponse[]
  }
}

interface DocuSignRecipientResponse {
  recipientId: string
  email: string
  name: string
  status: string
  routingOrder: number
  signedDateTime?: string
  deliveredDateTime?: string
  declinedReason?: string
}

interface DocuSignAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

/**
 * DocuSign Digital Signature Adapter
 *
 * Implements IDigitalSignatureService using DocuSign for electronic signatures.
 * Acts as an Anti-Corruption Layer protecting the domain from DocuSign API changes.
 */
export class DocuSignSignatureAdapter implements IDigitalSignatureService {
  private readonly config: DocuSignAdapterConfig
  private httpClient: AxiosInstance
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor(config: DocuSignAdapterConfig) {
    this.config = config
    this.httpClient = axios.create({
      baseURL: `${config.basePath}/restapi/v2.1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use(async (requestConfig) => {
      await this.ensureValidToken()
      if (this.accessToken) {
        requestConfig.headers.Authorization = `Bearer ${this.accessToken}`
      }
      return requestConfig
    })

    // Add response interceptor for error handling and token refresh
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.refreshToken()
          if (error.config) {
            return this.httpClient.request(error.config)
          }
        }
        return Promise.reject(error)
      },
    )
  }

  /**
   * Authenticate with DocuSign
   */
  private async authenticate(): Promise<string> {
    const response = await axios.post<DocuSignAuthResponse>(
      `${this.config.authServer}/oauth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'signature',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    this.accessToken = response.data.access_token
    this.tokenExpiry = Date.now() + response.data.expires_in * 1000
    return this.accessToken
  }

  /**
   * Ensure valid authentication token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      await this.authenticate()
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<void> {
    this.accessToken = null
    this.tokenExpiry = 0
    await this.authenticate()
  }

  /**
   * Map domain SignatureStatus to DocuSign status
   * Reserved for future use when updating envelope status
   */
  // @ts-expect-error Reserved for future use
  private _mapToDocuSignStatus(status: SignatureStatus): string {
    const statusMap: Record<SignatureStatus, string> = {
      draft: 'created',
      sent: 'sent',
      viewed: 'delivered',
      signed: 'completed',
      completed: 'completed',
      declined: 'declined',
      expired: 'voided',
      voided: 'voided',
    }
    return statusMap[status] || 'created'
  }

  /**
   * Map DocuSign status to domain SignatureStatus
   */
  private mapFromDocuSignStatus(docuSignStatus: string): SignatureStatus {
    const statusMap: Record<string, SignatureStatus> = {
      created: 'draft',
      sent: 'sent',
      delivered: 'viewed',
      completed: 'completed',
      declined: 'declined',
      voided: 'voided',
    }
    return statusMap[docuSignStatus] || 'draft'
  }

  /**
   * Transform domain SignatureRequest to DocuSign envelope request
   */
  private transformToDocuSignEnvelope(request: SignatureRequest): unknown {
    return {
      emailSubject: request.emailSubject ?? 'Please sign the document',
      emailBlurb: request.emailMessage ?? 'Please review and sign the attached document.',
      documents: request.documents.map((doc, index) => ({
        documentId: String(index + 1),
        name: doc.name,
        documentBase64: doc.content.toString('base64'),
      })),
      recipients: {
        signers: request.signers.map((signer, index) => ({
          recipientId: String(index + 1),
          email: signer.email,
          name: signer.name,
          role: signer.role || 'signer',
          routingOrder: request.workflow === 'sequential' ? (signer.order ?? index + 1) : 1,
          tabs: {
            signHereTabs: request.documents.flatMap((doc, docIndex) =>
              (doc.signaturePositions || []).map((pos, posIndex) => ({
                tabId: `signature_${docIndex}_${posIndex}`,
                documentId: String(docIndex + 1),
                pageNumber: pos.page,
                xPosition: pos.x,
                yPosition: pos.y,
                width: pos.width || 100,
                height: pos.height || 50,
                anchorString: pos.anchorString,
                anchorXOffset: pos.anchorOffsetX,
                anchorYOffset: pos.anchorOffsetY,
              })),
            ),
          },
        })),
      },
      status: 'sent',
      customFields: {
        textCustomFields: request.metadata
          ? Object.entries(request.metadata).map(([name, value]) => ({
              name,
              value: String(value),
              show: false,
              required: false,
            }))
          : [],
      },
    }
  }

  /**
   * Transform DocuSign envelope response to domain model
   */
  private transformFromDocuSignEnvelope(
    response: DocuSignEnvelopeResponse,
  ): SignatureEnvelopeStatus {
    return {
      envelopeId: response.envelopeId,
      status: this.mapFromDocuSignStatus(response.status),
      createdAt: new Date(response.statusChangedDateTime),
      updatedAt: new Date(response.statusChangedDateTime),
      completedAt:
        response.status === 'completed' ? new Date(response.statusChangedDateTime) : undefined,
      signers:
        response.recipients?.signers?.map((signer) => this.transformSignerStatus(signer)) || [],
      documents:
        response.documents?.map((doc) => ({
          id: doc.documentId,
          name: doc.name,
          signed: response.status === 'completed',
        })) || [],
    }
  }

  /**
   * Transform DocuSign recipient to domain SignerStatus
   */
  private transformSignerStatus(signer: DocuSignRecipientResponse): SignerStatus {
    return {
      signerId: signer.recipientId,
      name: signer.name,
      email: signer.email,
      status: this.mapFromDocuSignStatus(signer.status),
      signedAt: signer.signedDateTime ? new Date(signer.signedDateTime) : undefined,
      viewedAt: signer.deliveredDateTime ? new Date(signer.deliveredDateTime) : undefined,
      declineReason: signer.declinedReason,
    }
  }

  /**
   * Create and send a signature envelope
   */
  async createEnvelope(request: SignatureRequest): Promise<SignatureResult> {
    try {
      const envelope = this.transformToDocuSignEnvelope(request)
      const response = await this.httpClient.post<{ envelopeId: string }>(
        `/accounts/${this.config.accountId}/envelopes`,
        envelope,
      )

      return {
        success: true,
        envelopeId: response.data.envelopeId,
        provider: 'docusign',
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return {
        success: false,
        provider: 'docusign',
        error: {
          code: 'CREATE_ENVELOPE_FAILED',
          message: err.message,
          retryable: this.isRetryableError(error),
        },
      }
    }
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(envelopeId: string): Promise<SignatureEnvelopeStatus | null> {
    try {
      const response = await this.httpClient.get<DocuSignEnvelopeResponse>(
        `/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
      )
      return this.transformFromDocuSignEnvelope(response.data)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get signed documents
   */
  async getSignedDocuments(envelopeId: string): Promise<SignedDocument[]> {
    try {
      // Get envelope status first to check completion
      const status = await this.getEnvelopeStatus(envelopeId)
      if (!status || status.status !== 'completed') {
        return []
      }

      // Get documents list
      const docsResponse = await this.httpClient.get<{
        envelopeDocuments: Array<{ documentId: string; name: string }>
      }>(`/accounts/${this.config.accountId}/envelopes/${envelopeId}/documents`)

      const documents: SignedDocument[] = []

      for (const doc of docsResponse.data.envelopeDocuments) {
        // Download each document
        const docContent = await this.httpClient.get<ArrayBuffer>(
          `/accounts/${this.config.accountId}/envelopes/${envelopeId}/documents/${doc.documentId}`,
          { responseType: 'arraybuffer' },
        )

        documents.push({
          documentId: doc.documentId,
          name: doc.name,
          content: Buffer.from(docContent.data),
          contentType: 'application/pdf',
          signatureInfo: {
            signedAt: status.completedAt || new Date(),
            signers: status.signers
              .filter((s) => s.signedAt)
              .map((s) => ({
                name: s.name,
                email: s.email,
                signedAt: s.signedAt!,
              })),
          },
        })
      }

      return documents
    } catch (error) {
      throw new Error(`Failed to get signed documents: ${error}`)
    }
  }

  /**
   * Void an envelope
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<SignatureResult> {
    try {
      await this.httpClient.put(`/accounts/${this.config.accountId}/envelopes/${envelopeId}`, {
        status: 'voided',
        voidedReason: reason,
      })

      return {
        success: true,
        envelopeId,
        provider: 'docusign',
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return {
        success: false,
        envelopeId,
        provider: 'docusign',
        error: {
          code: 'VOID_ENVELOPE_FAILED',
          message: err.message,
          retryable: this.isRetryableError(error),
        },
      }
    }
  }

  /**
   * Send reminder to signers
   */
  async sendReminder(envelopeId: string, signerIds?: string[]): Promise<SignatureResult> {
    try {
      // Get current recipients
      const status = await this.getEnvelopeStatus(envelopeId)
      if (!status) {
        return {
          success: false,
          provider: 'docusign',
          error: {
            code: 'ENVELOPE_NOT_FOUND',
            message: `Envelope ${envelopeId} not found`,
            retryable: false,
          },
        }
      }

      const targetSigners = signerIds
        ? status.signers.filter((s) => signerIds.includes(s.signerId))
        : status.signers.filter((s) => s.status !== 'completed')

      await this.httpClient.put(
        `/accounts/${this.config.accountId}/envelopes/${envelopeId}/recipients`,
        {
          signers: targetSigners.map((signer) => ({
            recipientId: signer.signerId,
            emailNotification: {
              emailSubject: 'Reminder: Please sign the document',
              emailBody: 'This is a reminder to sign the document.',
            },
          })),
        },
      )

      return {
        success: true,
        envelopeId,
        provider: 'docusign',
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return {
        success: false,
        envelopeId,
        provider: 'docusign',
        error: {
          code: 'SEND_REMINDER_FAILED',
          message: err.message,
          retryable: this.isRetryableError(error),
        },
      }
    }
  }

  /**
   * Verify signature (limited support - just checks envelope status)
   */
  async verifySignature(_documentContent: Buffer): Promise<SignatureVerificationResult> {
    // DocuSign doesn't provide client-side signature verification
    // This would require the envelope ID to check status
    return {
      valid: false,
      documentHash: '',
      signers: [],
      tampered: false,
      timestamp: new Date(),
      provider: 'docusign',
    }
  }

  /**
   * Parse webhook event from DocuSign
   */
  parseWebhookEvent(payload: unknown, _headers?: Record<string, string>): SignatureWebhookEvent {
    const event = payload as {
      event: string
      data: {
        envelopeId: string
        accountId: string
        envelopeSummary?: {
          status: string
          recipients?: {
            signers?: Array<{
              recipientId: string
              name: string
              email: string
              status: string
              declinedReason?: string
            }>
          }
        }
      }
      generatedDateTime: string
    }

    const eventTypeMap: Record<string, SignatureWebhookEvent['eventType']> = {
      'envelope-sent': 'envelope_sent',
      'envelope-delivered': 'envelope_delivered',
      'envelope-completed': 'envelope_completed',
      'envelope-declined': 'envelope_declined',
      'envelope-voided': 'envelope_voided',
      'recipient-completed': 'recipient_signed',
      'recipient-delivered': 'recipient_viewed',
      'recipient-declined': 'recipient_declined',
    }

    return {
      eventType: eventTypeMap[event.event] || 'envelope_sent',
      envelopeId: event.data.envelopeId,
      timestamp: new Date(event.generatedDateTime),
      data: {
        metadata: event.data.envelopeSummary,
      },
      rawPayload: payload,
    }
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.ensureValidToken()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'docusign'
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken()
      await this.httpClient.get(`/accounts/${this.config.accountId}`)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      return status === 429 || status === 503 || status === 502 || status === 504
    }
    return false
  }
}

/**
 * Factory function to create DocuSignSignatureAdapter
 */
export function createDocuSignSignatureAdapter(
  config: DocuSignAdapterConfig,
): DocuSignSignatureAdapter {
  return new DocuSignSignatureAdapter(config)
}
