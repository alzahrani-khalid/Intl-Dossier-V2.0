export type SignatureProvider = 'docusign' | 'pki';
export type SignatureStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined' | 'expired';
export type SignatureWorkflow = 'parallel' | 'sequential';
export type SignatoryStatus = 'pending' | 'signed' | 'declined';

export interface Signatory {
  contact_id: string;
  order: number;
  status: SignatoryStatus;
  signed_at?: Date;
  ip_address?: string;
  signature_data?: string;
}

export interface AuditTrailEntry {
  event: string;
  timestamp: Date;
  user_id?: string;
  details: Record<string, any>;
}

export interface SignatureRequest {
  id: string;
  mou_id: string;
  document_id: string;
  provider: SignatureProvider;
  status: SignatureStatus;
  signatories: Signatory[];
  workflow: SignatureWorkflow;
  envelope_id?: string;
  certificate?: string;
  audit_trail: AuditTrailEntry[];
  expires_at: Date;
  created_at: Date;
  completed_at?: Date;
}

export interface CreateSignatureRequestDto {
  mou_id: string;
  document_id: string;
  provider: SignatureProvider;
  signatories: Array<{
    contact_id: string;
    order?: number;
  }>;
  workflow?: SignatureWorkflow;
  expires_at: Date;
}

export interface UpdateSignatureStatusDto {
  status: SignatureStatus;
  signatory_id?: string;
  signature_data?: string;
  ip_address?: string;
}

export interface SignatureVerificationResult {
  valid: boolean;
  signer: string;
  timestamp: Date;
  certificate?: string;
  errors?: string[];
}

export class SignatureRequestModel {
  static tableName = 'signature_requests';

  static readonly STATUS_TRANSITIONS: Record<SignatureStatus, SignatureStatus[]> = {
    'draft': ['sent', 'declined', 'expired'],
    'sent': ['viewed', 'declined', 'expired'],
    'viewed': ['signed', 'declined', 'expired'],
    'signed': ['completed', 'declined'],
    'completed': [],
    'declined': [],
    'expired': []
  };

  static validate(request: Partial<SignatureRequest>): boolean {
    if (!request.mou_id || !request.document_id) {
      return false;
    }

    if (!request.provider || !['docusign', 'pki'].includes(request.provider)) {
      return false;
    }

    if (!request.signatories || request.signatories.length === 0) {
      return false;
    }

    if (request.workflow === 'sequential') {
      const orders = request.signatories.map(s => s.order);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) {
        return false;
      }
    }

    return true;
  }

  static canTransition(currentStatus: SignatureStatus, newStatus: SignatureStatus): boolean {
    const allowedTransitions = this.STATUS_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  static isExpired(request: SignatureRequest): boolean {
    if (request.status === 'expired') {
      return true;
    }

    if (request.status === 'completed' || request.status === 'declined') {
      return false;
    }

    return new Date() > new Date(request.expires_at);
  }

  static getNextSignatory(request: SignatureRequest): Signatory | null {
    if (request.workflow === 'parallel') {
      return request.signatories.find(s => s.status === 'pending') || null;
    }

    const sortedSignatories = [...request.signatories].sort((a, b) => a.order - b.order);
    return sortedSignatories.find(s => s.status === 'pending') || null;
  }

  static calculateCompletionPercentage(request: SignatureRequest): number {
    const total = request.signatories.length;
    const signed = request.signatories.filter(s => s.status === 'signed').length;
    return Math.round((signed / total) * 100);
  }

  static addAuditEntry(
    request: SignatureRequest, 
    event: string, 
    details: Record<string, any>,
    userId?: string
  ): AuditTrailEntry {
    const entry: AuditTrailEntry = {
      event,
      timestamp: new Date(),
      user_id: userId,
      details
    };

    request.audit_trail.push(entry);
    return entry;
  }

  static async verifySignature(
    request: SignatureRequest,
    signatureData: string
  ): Promise<SignatureVerificationResult> {
    // This would integrate with actual signature verification services
    // Placeholder implementation
    return {
      valid: true,
      signer: 'verified_signer',
      timestamp: new Date(),
      certificate: request.certificate
    };
  }
}

export default SignatureRequestModel;