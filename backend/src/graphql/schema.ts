import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  # Enums
  enum ResourceType {
    DOSSIER
    MOU
    ALL
  }

  enum PermissionType {
    READ
    WRITE
    DELETE
    APPROVE
  }

  enum SignatureProvider {
    DOCUSIGN
    PKI
  }

  enum SignatureStatus {
    DRAFT
    SENT
    VIEWED
    SIGNED
    COMPLETED
    DECLINED
    EXPIRED
  }

  enum ConflictType {
    CONTRADICTION
    AMBIGUITY
    OUTDATED
  }

  enum ConflictSeverity {
    LOW
    MEDIUM
    HIGH
  }

  enum ReconciliationStatus {
    PENDING
    IN_PROGRESS
    RESOLVED
  }

  enum SourceType {
    RSS
    API
    WEB
    EMAIL
  }

  enum ScanFrequency {
    HOURLY
    DAILY
    WEEKLY
  }

  enum MoUStatus {
    DRAFT
    NEGOTIATION
    SIGNED
    ACTIVE
    EXPIRED
    TERMINATED
  }

  # Types
  type User {
    id: ID!
    email: String!
    role: String!
    name_en: String
    name_ar: String
    created_at: String!
  }

  type PermissionDelegation {
    id: ID!
    grantor: User!
    grantee: User!
    resource_type: ResourceType!
    resource_id: ID
    permissions: [PermissionType!]!
    reason: String!
    valid_from: String!
    valid_until: String!
    revoked: Boolean!
    revoked_at: String
    revoked_by: User
    created_at: String!
  }

  type Signatory {
    contact_id: ID!
    order: Int
    status: String!
    signed_at: String
    signature_data: String
  }

  type SignatureRequest {
    id: ID!
    mou_id: ID!
    document_id: ID!
    provider: SignatureProvider!
    status: SignatureStatus!
    signatories: [Signatory!]!
    workflow: String!
    envelope_id: String
    expires_at: String!
    created_at: String!
    completed_at: String
  }

  type PositionConflict {
    position1_id: ID!
    position2_id: ID!
    conflict_type: ConflictType!
    description: String!
    severity: ConflictSeverity!
    detected_at: String!
    suggested_resolution: String
  }

  type PositionConsistency {
    id: ID!
    thematic_area_id: ID!
    consistency_score: Int!
    positions_analyzed: [ID!]!
    conflicts: [PositionConflict!]!
    reconciliation_status: ReconciliationStatus!
    reconciled_by: User
    reconciliation_notes: String
    calculated_at: String!
  }

  type IntelligenceSource {
    id: ID!
    name: String!
    type: SourceType!
    url: String
    scanning_frequency: ScanFrequency!
    keywords: [String!]!
    categories: [String!]!
    reliability_score: Int!
    last_scanned_at: String
    next_scan_at: String!
    active: Boolean!
    error_count: Int!
    created_at: String!
  }

  type Country {
    id: ID!
    code: String!
    name_en: String!
    name_ar: String!
    region: String!
    cooperation_areas: [String!]!
    expertise_domains: [String!]!
    organizations: [Organization!]
    dossier: Dossier
  }

  type Organization {
    id: ID!
    code: String!
    name_en: String!
    name_ar: String!
    type: String!
    membership_status: String!
    country: Country
    parent_org: Organization
    sub_organizations: [Organization!]
    dossier: Dossier
  }

  type MoU {
    id: ID!
    reference_number: String!
    title_en: String!
    title_ar: String!
    type: String!
    status: MoUStatus!
    parties: [Organization!]!
    signed_date: String
    effective_date: String
    expiry_date: String
    deliverables: [Deliverable!]!
    signature_requests: [SignatureRequest!]
  }

  type Deliverable {
    id: ID!
    description: String!
    due_date: String!
    status: String!
    completion_percentage: Int!
  }

  type Dossier {
    id: ID!
    type: String!
    entity_id: ID!
    title: String!
    executive_summary: String!
    status: String!
    classification: String!
    tags: [String!]!
    documents: [Document!]
    activities: [Activity!]
    contacts: [Contact!]
  }

  type Document {
    id: ID!
    title: String!
    type: String!
    classification: String!
    language: String!
    version: Int!
    created_at: String!
  }

  type Activity {
    id: ID!
    type: String!
    title: String!
    date: String!
    participants: [Contact!]
  }

  type Contact {
    id: ID!
    first_name: String!
    last_name: String!
    name_ar: String
    position: String!
    email: String!
    organization: Organization!
  }

  type Intelligence {
    id: ID!
    source: IntelligenceSource!
    type: String!
    category: String!
    title: String!
    content: String!
    relevance_score: Int!
    priority: String!
    created_at: String!
  }

  type ConsistencyAnalysisResult {
    consistency_score: Int!
    conflicts: [PositionConflict!]!
    recommendations: [String!]!
    analysis_time_ms: Int!
  }

  type DelegationSummary {
    granted: [PermissionDelegation!]!
    received: [PermissionDelegation!]!
  }

  # Queries
  type Query {
    # Permission Delegations
    permissionDelegation(id: ID!): PermissionDelegation
    myDelegations: DelegationSummary!
    checkPermissions(
      resource_type: ResourceType!
      resource_id: ID
    ): [PermissionType!]!
    expiringDelegations(days: Int): [PermissionDelegation!]!

    # Signature Requests
    signatureRequest(id: ID!): SignatureRequest
    signatureRequestsByMoU(mou_id: ID!): [SignatureRequest!]!
    pendingSignatures: [SignatureRequest!]!

    # Position Consistency
    positionConsistency(thematic_area_id: ID!): PositionConsistency
    unresolvedConflicts(
      severity: ConflictSeverity
      limit: Int
    ): [PositionConsistency!]!
    criticalInconsistencies: [PositionConsistency!]!
    consistencyHistory(
      thematic_area_id: ID!
      limit: Int
    ): [PositionConsistency!]!

    # Intelligence Sources
    intelligenceSource(id: ID!): IntelligenceSource
    activeSources(type: SourceType): [IntelligenceSource!]!
    dueForScan: [IntelligenceSource!]!
    recentIntelligence(limit: Int): [Intelligence!]!

    # Core Entities
    country(id: ID!): Country
    countries(region: String): [Country!]!
    
    organization(id: ID!): Organization
    organizations(type: String): [Organization!]!
    
    mou(id: ID!): MoU
    mous(status: MoUStatus): [MoU!]!
    
    dossier(id: ID!): Dossier
    dossiers(
      type: String
      classification: String
    ): [Dossier!]!
  }

  # Mutations
  type Mutation {
    # Permission Delegations
    delegatePermission(
      grantee_id: ID!
      resource_type: ResourceType!
      resource_id: ID
      permissions: [PermissionType!]!
      reason: String!
      valid_from: String!
      valid_until: String!
    ): PermissionDelegation!
    
    revokePermission(delegation_id: ID!): Boolean!
    
    updateDelegation(
      delegation_id: ID!
      permissions: [PermissionType!]
      valid_until: String
      reason: String
    ): PermissionDelegation!

    # Signature Requests
    createSignatureRequest(
      mou_id: ID!
      document_id: ID!
      provider: SignatureProvider!
      signatories: [ID!]!
      workflow: String
      expires_at: String!
    ): SignatureRequest!
    
    sendForSignature(request_id: ID!): SignatureRequest!
    
    updateSignatureStatus(
      request_id: ID!
      status: SignatureStatus!
      signatory_id: ID
      signature_data: String
    ): SignatureRequest!

    # Position Consistency
    analyzeConsistency(
      thematic_area_id: ID!
    ): ConsistencyAnalysisResult!
    
    reconcileConflict(
      consistency_id: ID!
      conflict_index: Int!
      resolution_notes: String!
    ): PositionConsistency!

    # Intelligence Sources
    createIntelligenceSource(
      name: String!
      type: SourceType!
      url: String
      scanning_frequency: ScanFrequency!
      keywords: [String!]!
      categories: [String!]!
    ): IntelligenceSource!
    
    updateIntelligenceSource(
      id: ID!
      scanning_frequency: ScanFrequency
      keywords: [String!]
      active: Boolean
    ): IntelligenceSource!
    
    scanSource(source_id: ID!): Boolean!
    scanAllDueSources: Int!
  }

  # Subscriptions
  type Subscription {
    # Real-time updates
    delegationCreated(user_id: ID!): PermissionDelegation!
    delegationRevoked(user_id: ID!): PermissionDelegation!
    
    signatureStatusChanged(request_id: ID!): SignatureRequest!
    signatureCompleted(mou_id: ID!): SignatureRequest!
    
    conflictDetected(thematic_area_id: ID!): PositionConflict!
    conflictResolved(consistency_id: ID!): PositionConsistency!
    
    intelligenceReceived(categories: [String!]): Intelligence!
    sourceScanned(source_id: ID!): IntelligenceSource!
  }
`);

export default schema;