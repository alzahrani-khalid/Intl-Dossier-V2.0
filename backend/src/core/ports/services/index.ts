/**
 * Service Ports Index
 *
 * Re-exports all service port interfaces.
 * These define contracts for external service integrations.
 *
 * Anti-Corruption Layer (ACL) ports protect the domain from
 * external API changes and make services easily replaceable.
 */

// Notification service
export type {
  INotificationService,
  NotificationRecipient,
  NotificationPayload,
  NotificationChannel,
  NotificationOptions,
  NotificationResult,
} from './notification.service.port'

// AI service
export type {
  IAIService,
  TextGenerationRequest,
  TextGenerationResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  DocumentExtractionRequest,
  DocumentExtractionResponse,
  ExtractedEntity,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AITool,
  SimilaritySearchRequest,
  SimilaritySearchResult,
} from './ai.service.port'

// Storage service
export type {
  IStorageService,
  FileUploadOptions,
  FileMetadata,
  SignedUrlOptions,
  FileListOptions,
} from './storage.service.port'

// Email service (ACL)
export type {
  IEmailService,
  EmailRecipient,
  EmailAttachment,
  EmailAddress,
  EmailRequest,
  TemplatedEmailRequest,
  EmailResult,
  BulkEmailResult,
  EmailDeliveryStatus,
  EmailStatus,
  EmailServiceConfig,
  EmailTemplate,
} from './email.service.port'
export { EMAIL_SERVICE_TOKEN } from './email.service.port'

// Digital Signature service (ACL)
export type {
  IDigitalSignatureService,
  IPKISignatureService,
  Signer,
  SignaturePosition,
  SignatureDocument,
  SignatureRequest,
  SignatureStatus,
  SignerStatus,
  SignatureEnvelopeStatus,
  SignatureResult,
  SignedDocument,
  SignatureVerificationResult,
  SignatureWebhookEvent,
  CertificateInfo,
} from './digital-signature.service.port'
export {
  DIGITAL_SIGNATURE_SERVICE_TOKEN,
  PKI_SIGNATURE_SERVICE_TOKEN,
} from './digital-signature.service.port'

// Calendar service (ACL)
export type {
  ICalendarService,
  CalendarAttendee,
  RecurrenceRule,
  CalendarReminder,
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  CalendarQueryParams,
  CalendarQueryResult,
  FreeBusySlot,
  FreeBusyResult,
  AvailabilityResponse,
  CalendarEventResult,
  CalendarSyncState,
  CalendarWebhookEvent,
  CalendarInfo,
} from './calendar.service.port'
export { CALENDAR_SERVICE_TOKEN } from './calendar.service.port'
