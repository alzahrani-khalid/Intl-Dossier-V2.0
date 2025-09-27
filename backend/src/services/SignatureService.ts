import { createClient } from '@supabase/supabase-js';
import {
  SignatureRequest,
  CreateSignatureRequestDto,
  UpdateSignatureStatusDto,
  SignatureVerificationResult,
  SignatureStatus,
  Signatory
} from '../models/SignatureRequest';

// DocuSign integration types
interface DocuSignConfig {
  accountId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  basePath: string;
}

// PKI integration types
interface PKIConfig {
  certificateAuthority: string;
  validationEndpoint: string;
  apiKey: string;
}

export class SignatureService {
  private supabase;
  private docusignConfig?: DocuSignConfig;
  private pkiConfig?: PKIConfig;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    docusignConfig?: DocuSignConfig,
    pkiConfig?: PKIConfig
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.docusignConfig = docusignConfig;
    this.pkiConfig = pkiConfig;
  }

  async createSignatureRequest(
    dto: CreateSignatureRequestDto
  ): Promise<SignatureRequest> {
    // Validate MoU and document exist
    const { data: mou } = await this.supabase
      .from('mous')
      .select('id, status')
      .eq('id', dto.mou_id)
      .single();

    if (!mou) {
      throw new Error('MoU not found');
    }

    if (mou.status !== 'negotiation' && mou.status !== 'signed') {
      throw new Error('MoU must be in negotiation or signed status');
    }

    // Prepare signatories with initial status
    const signatories: Signatory[] = dto.signatories.map((s, index) => ({
      contact_id: s.contact_id,
      order: dto.workflow === 'sequential' ? (s.order || index) : 0,
      status: 'pending',
      signed_at: undefined,
      ip_address: undefined,
      signature_data: undefined
    }));

    // Create signature request
    const { data, error } = await this.supabase
      .from('signature_requests')
      .insert({
        mou_id: dto.mou_id,
        document_id: dto.document_id,
        provider: dto.provider,
        status: 'draft',
        signatories,
        workflow: dto.workflow || 'parallel',
        expires_at: dto.expires_at,
        audit_trail: [
          {
            event: 'request_created',
            timestamp: new Date().toISOString(),
            details: { created_by: 'system' }
          }
        ]
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create signature request: ${error.message}`);
    }

    return data;
  }

  async sendForSignature(
    requestId: string,
    userId: string
  ): Promise<SignatureRequest> {
    const request = await this.getSignatureRequest(requestId);

    if (request.status !== 'draft') {
      throw new Error('Can only send draft requests for signature');
    }

    let envelopeId: string | undefined;

    // Send to provider
    if (request.provider === 'docusign' && this.docusignConfig) {
      envelopeId = await this.sendToDocuSign(request);
    } else if (request.provider === 'pki' && this.pkiConfig) {
      envelopeId = await this.sendToPKI(request);
    } else {
      throw new Error(`${request.provider} provider not configured`);
    }

    // Update request status
    const { data, error } = await this.supabase
      .from('signature_requests')
      .update({
        status: 'sent',
        envelope_id: envelopeId,
        audit_trail: [...request.audit_trail, {
          event: 'request_sent',
          timestamp: new Date().toISOString(),
          user_id: userId,
          details: { provider: request.provider, envelope_id: envelopeId }
        }]
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update request: ${error.message}`);
    }

    // Send notifications to signatories
    await this.notifySignatories(data);

    return data;
  }

  async updateSignatureStatus(
    requestId: string,
    dto: UpdateSignatureStatusDto
  ): Promise<SignatureRequest> {
    const request = await this.getSignatureRequest(requestId);

    // Validate status transition
    const validTransitions: Record<SignatureStatus, SignatureStatus[]> = {
      'draft': ['sent'],
      'sent': ['viewed', 'declined', 'expired'],
      'viewed': ['signed', 'declined', 'expired'],
      'signed': ['completed'],
      'completed': [],
      'declined': [],
      'expired': []
    };

    if (!validTransitions[request.status].includes(dto.status)) {
      throw new Error(`Invalid status transition from ${request.status} to ${dto.status}`);
    }

    // Update signatory if specified
    let updatedSignatories = request.signatories;
    if (dto.signatory_id) {
      updatedSignatories = request.signatories.map(s => {
        if (s.contact_id === dto.signatory_id) {
          return {
            ...s,
            status: dto.status === 'signed' ? 'signed' : s.status,
            signed_at: dto.status === 'signed' ? new Date() : s.signed_at,
            signature_data: dto.signature_data || s.signature_data,
            ip_address: dto.ip_address || s.ip_address
          };
        }
        return s;
      });
    }

    // Check if all signatories have signed
    const allSigned = updatedSignatories.every(s => s.status === 'signed');
    const finalStatus = allSigned ? 'completed' : dto.status;

    const { data, error } = await this.supabase
      .from('signature_requests')
      .update({
        status: finalStatus,
        signatories: updatedSignatories,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        audit_trail: [...request.audit_trail, {
          event: `status_updated_to_${finalStatus}`,
          timestamp: new Date().toISOString(),
          details: { signatory_id: dto.signatory_id }
        }]
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    return data;
  }

  async verifySignature(
    requestId: string,
    signatureData: string
  ): Promise<SignatureVerificationResult> {
    const request = await this.getSignatureRequest(requestId);

    if (request.provider === 'docusign' && this.docusignConfig) {
      return this.verifyDocuSignSignature(request, signatureData);
    } else if (request.provider === 'pki' && this.pkiConfig) {
      return this.verifyPKISignature(request, signatureData);
    }

    throw new Error(`${request.provider} verification not available`);
  }

  async getSignatureRequest(requestId: string): Promise<SignatureRequest> {
    const { data, error } = await this.supabase
      .from('signature_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      throw new Error('Signature request not found');
    }

    return data;
  }

  async getSignatureRequestsByMoU(mouId: string): Promise<SignatureRequest[]> {
    const { data, error } = await this.supabase
      .from('signature_requests')
      .select('*')
      .eq('mou_id', mouId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch requests: ${error.message}`);
    }

    return data || [];
  }

  async checkExpiredRequests(): Promise<void> {
    const now = new Date().toISOString();

    const { data: expired } = await this.supabase
      .from('signature_requests')
      .select('id')
      .lt('expires_at', now)
      .not('status', 'in', '(completed,declined,expired)');

    if (expired && expired.length > 0) {
      for (const request of expired) {
        await this.supabase
          .from('signature_requests')
          .update({
            status: 'expired',
            audit_trail: [
              { 
                event: 'auto_expired',
                timestamp: new Date().toISOString()
              }
            ]
          })
          .eq('id', request.id);
      }
    }
  }

  private async sendToDocuSign(request: SignatureRequest): Promise<string> {
    // DocuSign API integration
    // This is a placeholder - actual implementation would use DocuSign SDK
    if (!this.docusignConfig) {
      throw new Error('DocuSign not configured');
    }

    // Create envelope, add documents, recipients
    // Return envelope ID
    return `docusign_envelope_${Date.now()}`;
  }

  private async sendToPKI(request: SignatureRequest): Promise<string> {
    // PKI integration
    // This is a placeholder - actual implementation would use PKI provider
    if (!this.pkiConfig) {
      throw new Error('PKI not configured');
    }

    // Initialize PKI signing request
    // Return request identifier
    return `pki_request_${Date.now()}`;
  }

  private async verifyDocuSignSignature(
    request: SignatureRequest,
    signatureData: string
  ): Promise<SignatureVerificationResult> {
    // DocuSign signature verification
    // Placeholder implementation
    return {
      valid: true,
      signer: 'DocuSign Verified',
      timestamp: new Date(),
      certificate: request.certificate
    };
  }

  private async verifyPKISignature(
    request: SignatureRequest,
    signatureData: string
  ): Promise<SignatureVerificationResult> {
    // PKI signature verification
    // Placeholder implementation
    if (!this.pkiConfig) {
      throw new Error('PKI not configured');
    }

    // Verify against certificate authority
    return {
      valid: true,
      signer: 'PKI Verified',
      timestamp: new Date(),
      certificate: request.certificate
    };
  }

  private async notifySignatories(request: SignatureRequest): Promise<void> {
    // Send notifications to all signatories
    for (const signatory of request.signatories) {
      // Get contact details
      const { data: contact } = await this.supabase
        .from('contacts')
        .select('email, name_en, name_ar, preferred_language')
        .eq('id', signatory.contact_id)
        .single();

      if (contact) {
        // Send email notification
        // This would integrate with your notification service
        console.log(`Notifying ${contact.email} about signature request`);
      }
    }
  }
}

export default SignatureService;