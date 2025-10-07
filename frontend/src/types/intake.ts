/**
 * Intake Form Types
 *
 * TypeScript types for the Front Door Intake system
 */

export type RequestType = 'engagement' | 'position' | 'mou_action' | 'foresight';

export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export type TicketStatus =
  | 'draft'
  | 'submitted'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'converted'
  | 'closed'
  | 'merged';

export type Sensitivity = 'public' | 'internal' | 'confidential' | 'secret';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Type-specific fields for different request types
 */
export interface EngagementFields {
  partnerName: string;
  collaborationType: 'technical' | 'data_sharing' | 'capacity_building' | 'other';
  expectedDuration: string;
}

export interface PositionFields {
  positionTitle: string;
  department: string;
  requiredSkills: string;
}

export interface MouActionFields {
  mouReference: string;
  actionType: 'review' | 'amendment' | 'renewal' | 'termination';
  deadline: string;
}

export interface ForesightFields {
  topic: string;
  timeHorizon: 'short' | 'medium' | 'long';
  stakeholders: string;
}

export type TypeSpecificFields =
  | EngagementFields
  | PositionFields
  | MouActionFields
  | ForesightFields;

/**
 * Intake Form Data
 */
export interface IntakeFormData {
  requestType: RequestType;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  urgency: Urgency;
  dossierId?: string;
  typeSpecificFields?: Record<string, any>;
  attachmentIds?: string[];
}

/**
 * Intake Ticket (full entity)
 */
export interface IntakeTicket {
  id: string;
  ticketNumber: string;
  requestType: RequestType;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  typeSpecificFields?: Record<string, any>;

  // Classification
  sensitivity: Sensitivity;
  urgency: Urgency;
  priority: Priority;

  // Relationships
  dossierId?: string;
  parentTicketId?: string;
  convertedToType?: RequestType;
  convertedToId?: string;

  // Assignment
  assignedTo?: string;
  assignedUnit?: string;

  // Status
  status: TicketStatus;
  resolution?: string;
  resolutionAr?: string;

  // Timestamps
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  submittedAt?: string;
  triagedAt?: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;

  // SLA Status
  slaStatus?: SLAStatus;

  // Metadata
  source: 'web' | 'api' | 'email' | 'import';
  clientMetadata?: Record<string, any>;
}

/**
 * SLA Status
 */
export interface SLAStatus {
  acknowledgment: {
    targetMinutes: number;
    elapsedMinutes: number;
    remainingMinutes: number;
    isBreached: boolean;
    targetTime: string;
  };
  resolution: {
    targetMinutes: number;
    elapsedMinutes: number;
    remainingMinutes: number;
    isBreached: boolean;
    targetTime: string;
  };
}

/**
 * Attachment
 */
export interface Attachment {
  id: string;
  ticketId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  scanStatus: 'pending' | 'clean' | 'infected' | 'error';
  scanResult?: Record<string, any>;
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl?: string;
}

/**
 * Triage Decision
 */
export interface TriageDecision {
  id: string;
  ticketId: string;
  decisionType: 'ai_suggestion' | 'manual_override' | 'auto_assignment';

  // Suggested values
  suggestedType?: string;
  suggestedSensitivity?: Sensitivity;
  suggestedUrgency?: Urgency;
  suggestedAssignee?: string;
  suggestedUnit?: string;

  // Final values
  finalType?: string;
  finalSensitivity?: Sensitivity;
  finalUrgency?: Urgency;
  finalAssignee?: string;
  finalUnit?: string;

  // AI metadata
  modelName?: string;
  modelVersion?: string;
  confidenceScore?: number;

  // Override details
  overrideReason?: string;
  overrideReasonAr?: string;

  // Timestamps
  createdAt: string;
  createdBy: string;
  acceptedAt?: string;
  acceptedBy?: string;
}

/**
 * Triage Suggestions (from AI)
 */
export interface TriageSuggestions {
  requestType: RequestType;
  sensitivity: Sensitivity;
  urgency: Urgency;
  suggestedAssignee?: string;
  suggestedUnit?: string;
  confidenceScores: {
    type: number;
    sensitivity: number;
    urgency: number;
    assignment: number;
  };
  modelInfo: {
    name: string;
    version: string;
  };
  cached: boolean;
  cachedAt?: string;
}

/**
 * Duplicate Candidate
 */
export interface DuplicateCandidate {
  ticketId: string;
  ticketNumber: string;
  title: string;
  overallScore: number;
  titleSimilarity: number;
  contentSimilarity: number;
  isHighConfidence: boolean;
}

/**
 * API Response Types
 */
export interface TicketResponse {
  id: string;
  ticketNumber: string;
  requestType: RequestType;
  title: string;
  titleAr?: string;
  status: TicketStatus;
  priority: Priority;
  assignedTo?: string;
  assignedUnit?: string;
  slaStatus?: SLAStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResponse {
  tickets: TicketResponse[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface TicketDetailResponse extends TicketResponse {
  description: string;
  descriptionAr?: string;
  typeSpecificFields?: Record<string, any>;
  sensitivity: Sensitivity;
  urgency: Urgency;
  dossierId?: string;
  convertedToType?: RequestType;
  convertedToId?: string;
  attachments: Attachment[];
  triageHistory: TriageDecision[];
  auditTrail: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  changes: Record<string, any>;
  mfaVerified: boolean;
  createdAt: string;
}

/**
 * API Request Types
 */
export interface CreateTicketRequest {
  requestType: RequestType;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  typeSpecificFields?: Record<string, any>;
  dossierId?: string;
  urgency: Urgency;
  attachments?: string[];
}

export interface UpdateTicketRequest {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  urgency?: Urgency;
  typeSpecificFields?: Record<string, any>;
}

export interface ApplyTriageRequest {
  action: 'accept' | 'override';
  sensitivity?: Sensitivity;
  urgency?: Urgency;
  assignedTo?: string;
  assignedUnit?: string;
  overrideReason?: string;
  overrideReasonAr?: string;
}

export interface AssignTicketRequest {
  assignedTo?: string;
  assignedUnit?: string;
  reason?: string;
}

export interface ConvertTicketRequest {
  targetType: RequestType;
  additionalData?: Record<string, any>;
  mfaToken?: string;
}

export interface MergeTicketsRequest {
  targetTicketIds: string[];
  keepAsPrimary?: string;
  mergeReason?: string;
}

export interface CloseTicketRequest {
  resolution: string;
  resolutionAr?: string;
  mfaToken?: string;
}