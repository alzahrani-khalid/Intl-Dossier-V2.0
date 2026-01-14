/**
 * Digital Signature Service Port
 *
 * Defines the contract for digital signature operations.
 * This is an Anti-Corruption Layer (ACL) port that abstracts
 * signature provider implementations (DocuSign, PKI, Adobe Sign, etc.)
 *
 * @module core/ports/services/digital-signature.service.port
 */

/**
 * Signer information - domain model
 */
export interface Signer {
  id: string
  email: string
  name: string
  role?: string
  order?: number // For sequential signing
  metadata?: Record<string, unknown>
}

/**
 * Signature field position
 */
export interface SignaturePosition {
  page: number
  x: number
  y: number
  width?: number
  height?: number
  anchorString?: string
  anchorOffsetX?: number
  anchorOffsetY?: number
}

/**
 * Document to be signed
 */
export interface SignatureDocument {
  id: string
  name: string
  content: Buffer
  contentType: 'application/pdf' | 'application/msword' | string
  signaturePositions?: SignaturePosition[]
}

/**
 * Signature request - domain model
 */
export interface SignatureRequest {
  id: string
  documents: SignatureDocument[]
  signers: Signer[]
  workflow: 'parallel' | 'sequential'
  emailSubject?: string
  emailMessage?: string
  expiresAt?: Date
  callbackUrl?: string
  metadata?: Record<string, unknown>
}

/**
 * Signature status - domain model
 */
export type SignatureStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'voided'

/**
 * Signer status
 */
export interface SignerStatus {
  signerId: string
  name: string
  email: string
  status: SignatureStatus
  signedAt?: Date
  viewedAt?: Date
  declineReason?: string
}

/**
 * Signature envelope/request status
 */
export interface SignatureEnvelopeStatus {
  envelopeId: string
  status: SignatureStatus
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  signers: SignerStatus[]
  documents: Array<{
    id: string
    name: string
    signed: boolean
  }>
  expiresAt?: Date
}

/**
 * Signature result
 */
export interface SignatureResult {
  success: boolean
  envelopeId?: string
  provider: string
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}

/**
 * Signed document result
 */
export interface SignedDocument {
  documentId: string
  name: string
  content: Buffer
  contentType: string
  signatureInfo: {
    signedAt: Date
    signers: Array<{
      name: string
      email: string
      signedAt: Date
    }>
    certificateChain?: string
  }
}

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  valid: boolean
  documentHash: string
  signers: Array<{
    name: string
    email: string
    signedAt: Date
    certificateValid: boolean
    certificateExpiry?: Date
  }>
  tampered: boolean
  timestamp: Date
  provider: string
}

/**
 * Webhook event from signature provider
 */
export interface SignatureWebhookEvent {
  eventType:
    | 'envelope_sent'
    | 'envelope_delivered'
    | 'envelope_completed'
    | 'envelope_declined'
    | 'envelope_voided'
    | 'recipient_signed'
    | 'recipient_viewed'
    | 'recipient_declined'
  envelopeId: string
  timestamp: Date
  data: {
    signerId?: string
    signerName?: string
    signerEmail?: string
    reason?: string
    metadata?: Record<string, unknown>
  }
  rawPayload: unknown
}

/**
 * Certificate information for PKI signing
 */
export interface CertificateInfo {
  subject: string
  issuer: string
  serialNumber: string
  validFrom: Date
  validTo: Date
  fingerprint: string
  keySize: number
  algorithm: string
  isValid: boolean
  isRevoked: boolean
}

/**
 * Digital Signature Service Port
 *
 * Contract for digital signature operations. Implementations can use
 * DocuSign, Adobe Sign, PKI, or other signature providers.
 *
 * This serves as an Anti-Corruption Layer (ACL) to prevent
 * external signature API changes from affecting the domain.
 */
export interface IDigitalSignatureService {
  /**
   * Create and send a signature request
   */
  createEnvelope(request: SignatureRequest): Promise<SignatureResult>

  /**
   * Get signature envelope status
   */
  getEnvelopeStatus(envelopeId: string): Promise<SignatureEnvelopeStatus | null>

  /**
   * Get signed documents from a completed envelope
   */
  getSignedDocuments(envelopeId: string): Promise<SignedDocument[]>

  /**
   * Void/cancel an envelope
   */
  voidEnvelope(envelopeId: string, reason: string): Promise<SignatureResult>

  /**
   * Send reminder to pending signers
   */
  sendReminder(envelopeId: string, signerIds?: string[]): Promise<SignatureResult>

  /**
   * Verify signature authenticity
   */
  verifySignature(documentContent: Buffer): Promise<SignatureVerificationResult>

  /**
   * Parse webhook event from provider
   */
  parseWebhookEvent(payload: unknown, headers?: Record<string, string>): SignatureWebhookEvent

  /**
   * Check if the signature service is available
   */
  isAvailable(): Promise<boolean>

  /**
   * Get provider name
   */
  getProviderName(): string

  /**
   * Test connection to signature provider
   */
  testConnection(): Promise<boolean>
}

/**
 * PKI Signature Service Port (extension for certificate-based signing)
 */
export interface IPKISignatureService extends IDigitalSignatureService {
  /**
   * Get available certificates
   */
  getAvailableCertificates(): Promise<CertificateInfo[]>

  /**
   * Sign document with certificate
   */
  signWithCertificate(
    document: Buffer,
    certificateId: string,
    options?: {
      timestamp?: boolean
      reason?: string
      location?: string
    },
  ): Promise<Buffer>

  /**
   * Validate certificate
   */
  validateCertificate(certificateId: string): Promise<{
    valid: boolean
    reason?: string
    expiresAt?: Date
  }>
}

/**
 * Digital signature service token for dependency injection
 */
export const DIGITAL_SIGNATURE_SERVICE_TOKEN = Symbol('IDigitalSignatureService')

/**
 * PKI signature service token for dependency injection
 */
export const PKI_SIGNATURE_SERVICE_TOKEN = Symbol('IPKISignatureService')
