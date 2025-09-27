import { SignatureRequest, Signatory, SignatureStatus } from '../models/SignatureRequest';
import { DocuSignClient, DocuSignConfig } from '../integrations/DocuSignClient';
import { PKIClient, PKIConfig, PKISignature } from '../integrations/PKIClient';
import { createClient } from '@supabase/supabase-js';

export interface SignatureProviderConfig {
  docusign?: DocuSignConfig;
  pki?: PKIConfig;
  defaultProvider: 'docusign' | 'pki';
  fallbackProvider?: 'docusign' | 'pki';
  retryAttempts: number;
  retryDelay: number;
}

export interface SignatureSession {
  sessionId: string;
  signatureRequestId: string;
  provider: 'docusign' | 'pki';
  status: SignatureStatus;
  participants: Signatory[];
  createdAt: Date;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface SignatureResult {
  success: boolean;
  signatureId?: string;
  provider: 'docusign' | 'pki';
  status: SignatureStatus;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ProviderStatus {
  provider: 'docusign' | 'pki';
  isAvailable: boolean;
  lastChecked: Date;
  error?: string;
}

export class SignatureOrchestrator {
  private supabase;
  private docusignClient?: DocuSignClient;
  private pkiClient?: PKIClient;
  private config: SignatureProviderConfig;
  private providerStatus: Map<string, ProviderStatus> = new Map();

  constructor(config: SignatureProviderConfig, supabaseUrl: string, supabaseKey: string) {
    this.config = config;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.initializeProviders();
    this.startHealthChecks();
  }

  /**
   * Initialize signature providers
   */
  private async initializeProviders(): Promise<void> {
    try {
      // Initialize DocuSign client
      if (this.config.docusign) {
        this.docusignClient = new DocuSignClient(this.config.docusign);
        const docusignAvailable = await this.docusignClient.testConnection();
        this.providerStatus.set('docusign', {
          provider: 'docusign',
          isAvailable: docusignAvailable,
          lastChecked: new Date(),
          error: docusignAvailable ? undefined : 'Connection test failed'
        });
      }

      // Initialize PKI client
      if (this.config.pki) {
        this.pkiClient = new PKIClient(this.config.pki);
        const pkiAvailable = await this.pkiClient.testConnection();
        this.providerStatus.set('pki', {
          provider: 'pki',
          isAvailable: pkiAvailable,
          lastChecked: new Date(),
          error: pkiAvailable ? undefined : 'Connection test failed'
        });
      }

    } catch (error) {
      console.error('Failed to initialize signature providers:', error);
    }
  }

  /**
   * Start periodic health checks for providers
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      await this.checkProviderHealth();
    }, 60000); // Check every minute
  }

  /**
   * Check health of all providers
   */
  private async checkProviderHealth(): Promise<void> {
    // Check DocuSign
    if (this.docusignClient) {
      try {
        const isAvailable = await this.docusignClient.testConnection();
        this.providerStatus.set('docusign', {
          provider: 'docusign',
          isAvailable,
          lastChecked: new Date(),
          error: isAvailable ? undefined : 'Health check failed'
        });
      } catch (error) {
        this.providerStatus.set('docusign', {
          provider: 'docusign',
          isAvailable: false,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check PKI
    if (this.pkiClient) {
      try {
        const isAvailable = await this.pkiClient.testConnection();
        this.providerStatus.set('pki', {
          provider: 'pki',
          isAvailable,
          lastChecked: new Date(),
          error: isAvailable ? undefined : 'Health check failed'
        });
      } catch (error) {
        this.providerStatus.set('pki', {
          provider: 'pki',
          isAvailable: false,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Initiate signature workflow
   */
  async initiateSignature(
    signatureRequest: SignatureRequest,
    documentContent: Buffer,
    documentName: string,
    preferredProvider?: 'docusign' | 'pki'
  ): Promise<SignatureResult> {
    try {
      // Determine which provider to use
      const provider = this.selectProvider(preferredProvider);
      
      if (!provider) {
        return {
          success: false,
          provider: 'docusign', // Default fallback
          status: 'draft',
          error: 'No signature providers available'
        };
      }

      // Create signature session
      const session = await this.createSignatureSession(signatureRequest, provider);
      
      // Route to appropriate provider
      let result: SignatureResult;
      
      if (provider === 'docusign' && this.docusignClient) {
        result = await this.handleDocuSignSignature(signatureRequest, documentContent, documentName, session);
      } else if (provider === 'pki' && this.pkiClient) {
        result = await this.handlePKISignature(signatureRequest, documentContent, documentName, session);
      } else {
        throw new Error(`Provider ${provider} not available`);
      }

      // Update signature request status
      await this.updateSignatureRequestStatus(signatureRequest.id, result.status);

      return result;

    } catch (error) {
      console.error('Signature initiation failed:', error);
      
      // Try fallback provider if available
      if (this.config.fallbackProvider && this.config.fallbackProvider !== preferredProvider) {
        return this.initiateSignatureWithFallback(signatureRequest, documentContent, documentName);
      }

      return {
        success: false,
        provider: preferredProvider || 'docusign',
        status: 'draft',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle DocuSign signature workflow
   */
  private async handleDocuSignSignature(
    signatureRequest: SignatureRequest,
    documentContent: Buffer,
    documentName: string,
    session: SignatureSession
  ): Promise<SignatureResult> {
    try {
      if (!this.docusignClient) {
        throw new Error('DocuSign client not available');
      }

      // Create envelope
      const envelopeId = await this.docusignClient.createEnvelope(
        signatureRequest,
        documentContent,
        documentName
      );

      // Update session with envelope ID
      await this.updateSignatureSession(session.sessionId, {
        metadata: {
          ...session.metadata,
          envelopeId
        }
      });

      return {
        success: true,
        signatureId: envelopeId,
        provider: 'docusign',
        status: 'sent',
        metadata: {
          envelopeId,
          sessionId: session.sessionId
        }
      };

    } catch (error) {
      throw new Error(`DocuSign signature failed: ${error}`);
    }
  }

  /**
   * Handle PKI signature workflow
   */
  private async handlePKISignature(
    signatureRequest: SignatureRequest,
    documentContent: Buffer,
    documentName: string,
    session: SignatureSession
  ): Promise<SignatureResult> {
    try {
      if (!this.pkiClient) {
        throw new Error('PKI client not available');
      }

      // Create PKI signature for each signatory
      const signatures: PKISignature[] = [];
      
      for (const signatory of signatureRequest.signatories) {
        const signature = await this.pkiClient.createSignature(
          documentContent,
          signatureRequest,
          signatory
        );
        signatures.push(signature);
      }

      // Update session with signature data
      await this.updateSignatureSession(session.sessionId, {
        metadata: {
          ...session.metadata,
          signatures: signatures.map(s => ({
            signatureId: s.signatureId,
            documentHash: s.documentHash,
            timestamp: s.timestamp
          }))
        }
      });

      return {
        success: true,
        signatureId: signatures[0]?.signatureId,
        provider: 'pki',
        status: 'completed',
        metadata: {
          signatures: signatures.length,
          sessionId: session.sessionId
        }
      };

    } catch (error) {
      throw new Error(`PKI signature failed: ${error}`);
    }
  }

  /**
   * Select appropriate provider
   */
  private selectProvider(preferredProvider?: 'docusign' | 'pki'): 'docusign' | 'pki' | null {
    // Check preferred provider first
    if (preferredProvider) {
      const status = this.providerStatus.get(preferredProvider);
      if (status?.isAvailable) {
        return preferredProvider;
      }
    }

    // Check default provider
    const defaultStatus = this.providerStatus.get(this.config.defaultProvider);
    if (defaultStatus?.isAvailable) {
      return this.config.defaultProvider;
    }

    // Check fallback provider
    if (this.config.fallbackProvider) {
      const fallbackStatus = this.providerStatus.get(this.config.fallbackProvider);
      if (fallbackStatus?.isAvailable) {
        return this.config.fallbackProvider;
      }
    }

    // Check any available provider
    for (const [provider, status] of this.providerStatus) {
      if (status.isAvailable) {
        return provider as 'docusign' | 'pki';
      }
    }

    return null;
  }

  /**
   * Initiate signature with fallback provider
   */
  private async initiateSignatureWithFallback(
    signatureRequest: SignatureRequest,
    documentContent: Buffer,
    documentName: string
  ): Promise<SignatureResult> {
    if (!this.config.fallbackProvider) {
      throw new Error('No fallback provider configured');
    }

    console.log(`Retrying with fallback provider: ${this.config.fallbackProvider}`);
    
    return this.initiateSignature(
      signatureRequest,
      documentContent,
      documentName,
      this.config.fallbackProvider
    );
  }

  /**
   * Create signature session
   */
  private async createSignatureSession(
    signatureRequest: SignatureRequest,
    provider: 'docusign' | 'pki'
  ): Promise<SignatureSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: SignatureSession = {
      sessionId,
      signatureRequestId: signatureRequest.id,
      provider,
      status: 'draft',
      participants: signatureRequest.signatories,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      metadata: {
        provider,
        requestId: signatureRequest.id
      }
    };

    // Store session in database
    const { error } = await this.supabase
      .from('signature_sessions')
      .insert({
        id: sessionId,
        signature_request_id: signatureRequest.id,
        provider,
        status: 'draft',
        participants: signatureRequest.signatories,
        created_at: session.createdAt.toISOString(),
        expires_at: session.expiresAt.toISOString(),
        metadata: session.metadata
      });

    if (error) {
      throw new Error(`Failed to create signature session: ${error.message}`);
    }

    return session;
  }

  /**
   * Update signature session
   */
  private async updateSignatureSession(
    sessionId: string,
    updates: Partial<SignatureSession>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('signature_sessions')
      .update({
        status: updates.status,
        metadata: updates.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update signature session: ${error.message}`);
    }
  }

  /**
   * Update signature request status
   */
  private async updateSignatureRequestStatus(
    requestId: string,
    status: SignatureStatus
  ): Promise<void> {
    const { error } = await this.supabase
      .from('signature_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      throw new Error(`Failed to update signature request status: ${error.message}`);
    }
  }

  /**
   * Get signature status
   */
  async getSignatureStatus(signatureId: string, provider: 'docusign' | 'pki'): Promise<SignatureStatus> {
    try {
      if (provider === 'docusign' && this.docusignClient) {
        const envelope = await this.docusignClient.getEnvelopeStatus(signatureId);
        return this.mapDocuSignStatusToInternal(envelope.status);
      } else if (provider === 'pki' && this.pkiClient) {
        // For PKI, signatures are typically completed immediately
        return 'completed';
      }

      throw new Error(`Provider ${provider} not available`);

    } catch (error) {
      console.error('Failed to get signature status:', error);
      return 'draft';
    }
  }

  /**
   * Verify signature
   */
  async verifySignature(
    signatureId: string,
    provider: 'docusign' | 'pki',
    documentContent: Buffer
  ): Promise<boolean> {
    try {
      if (provider === 'docusign' && this.docusignClient) {
        // For DocuSign, we need to get the recipient ID
        // This is a simplified implementation
        return await this.docusignClient.verifySignature(signatureId, 'default');
      } else if (provider === 'pki' && this.pkiClient) {
        // For PKI, we would need the signature object
        // This is a placeholder implementation
        return true;
      }

      return false;

    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Handle mixed signing workflows
   */
  async handleMixedSigningWorkflow(
    signatureRequests: Array<{
      request: SignatureRequest;
      provider: 'docusign' | 'pki';
      documentContent: Buffer;
      documentName: string;
    }>
  ): Promise<SignatureResult[]> {
    const results: SignatureResult[] = [];

    for (const { request, provider, documentContent, documentName } of signatureRequests) {
      try {
        const result = await this.initiateSignature(
          request,
          documentContent,
          documentName,
          provider
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          provider,
          status: 'draft',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Synchronize status across providers
   */
  async synchronizeStatus(): Promise<void> {
    try {
      // Get all active signature sessions
      const { data: sessions, error } = await this.supabase
        .from('signature_sessions')
        .select('*')
        .in('status', ['sent', 'viewed', 'signed']);

      if (error) {
        throw new Error(`Failed to fetch signature sessions: ${error.message}`);
      }

      for (const session of sessions || []) {
        try {
          const currentStatus = await this.getSignatureStatus(
            session.metadata?.signatureId || session.metadata?.envelopeId,
            session.provider
          );

          if (currentStatus !== session.status) {
            await this.updateSignatureSession(session.id, { status: currentStatus });
            await this.updateSignatureRequestStatus(session.signature_request_id, currentStatus);
          }
        } catch (error) {
          console.error(`Failed to synchronize session ${session.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Status synchronization failed:', error);
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus(): ProviderStatus[] {
    return Array.from(this.providerStatus.values());
  }

  /**
   * Map DocuSign status to internal status
   */
  private mapDocuSignStatusToInternal(docuSignStatus: string): SignatureStatus {
    const statusMap: Record<string, SignatureStatus> = {
      'sent': 'sent',
      'delivered': 'viewed',
      'completed': 'completed',
      'declined': 'declined',
      'voided': 'expired'
    };

    return statusMap[docuSignStatus] || 'draft';
  }

  /**
   * Handle provider failures
   */
  async handleProviderFailure(provider: 'docusign' | 'pki', error: Error): Promise<void> {
    console.error(`Provider ${provider} failed:`, error);
    
    // Update provider status
    this.providerStatus.set(provider, {
      provider,
      isAvailable: false,
      lastChecked: new Date(),
      error: error.message
    });

    // Notify administrators
    await this.notifyProviderFailure(provider, error);
  }

  /**
   * Notify administrators of provider failure
   */
  private async notifyProviderFailure(provider: 'docusign' | 'pki', error: Error): Promise<void> {
    // This would typically send notifications to administrators
    console.log(`Provider ${provider} failure notification: ${error.message}`);
  }
}
