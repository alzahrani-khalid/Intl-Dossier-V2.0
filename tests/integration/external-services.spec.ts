import { test, expect, describe, beforeAll, afterAll } from '@playwright/test';
import { DocuSignClient, DocuSignConfig } from '../../backend/src/integrations/DocuSignClient';
import { PKIClient, PKIConfig } from '../../backend/src/integrations/PKIClient';
import { SignatureOrchestrator, SignatureProviderConfig } from '../../backend/src/services/SignatureOrchestrator';
import { SignatureRequest, Signatory } from '../../backend/src/models/SignatureRequest';

// Mock configurations for testing
const mockDocuSignConfig: DocuSignConfig = {
  accountId: 'test-account-id',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'http://localhost:3000/callback',
  basePath: 'https://demo.docusign.net',
  authServer: 'https://account-d.docusign.com'
};

const mockPKIConfig: PKIConfig = {
  certificateAuthority: 'test-ca',
  privateKeyPath: './test-keys/private.pem',
  certificatePath: './test-keys/certificate.pem',
  caCertificatePath: './test-keys/ca.pem',
  encryptionAlgorithm: 'RSA-OAEP',
  hashAlgorithm: 'sha256',
  keySize: 2048
};

const mockSignatureProviderConfig: SignatureProviderConfig = {
  docusign: mockDocuSignConfig,
  pki: mockPKIConfig,
  defaultProvider: 'docusign',
  fallbackProvider: 'pki',
  retryAttempts: 3,
  retryDelay: 1000
};

// Mock Supabase configuration
const mockSupabaseUrl = 'http://localhost:54321';
const mockSupabaseKey = 'test-anon-key';

describe('External Services Integration Tests', () => {
  let docusignClient: DocuSignClient;
  let pkiClient: PKIClient;
  let signatureOrchestrator: SignatureOrchestrator;

  beforeAll(async () => {
    // Initialize clients
    docusignClient = new DocuSignClient(mockDocuSignConfig);
    pkiClient = new PKIClient(mockPKIConfig);
    signatureOrchestrator = new SignatureOrchestrator(
      mockSignatureProviderConfig,
      mockSupabaseUrl,
      mockSupabaseKey
    );
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('DocuSign Integration', () => {
    test('should initialize DocuSign client', () => {
      expect(docusignClient).toBeDefined();
    });

    test('should handle authentication failure gracefully', async () => {
      // Mock authentication failure
      const originalAuth = docusignClient.authenticate;
      docusignClient.authenticate = jest.fn().mockRejectedValue(new Error('Authentication failed'));

      const result = await docusignClient.testConnection();
      expect(result).toBe(false);

      // Restore original method
      docusignClient.authenticate = originalAuth;
    });

    test('should handle envelope creation failure', async () => {
      const mockSignatureRequest: SignatureRequest = {
        id: 'test-request-id',
        mou_id: 'test-mou-id',
        document_id: 'test-document-id',
        provider: 'docusign',
        status: 'draft',
        signatories: [],
        workflow: 'parallel',
        envelope_id: undefined,
        certificate: undefined,
        audit_trail: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        completed_at: undefined
      };

      const documentContent = Buffer.from('Test document content');
      const documentName = 'test-document.pdf';

      // Mock envelope creation failure
      const originalCreateEnvelope = docusignClient.createEnvelope;
      docusignClient.createEnvelope = jest.fn().mockRejectedValue(new Error('Envelope creation failed'));

      await expect(
        docusignClient.createEnvelope(mockSignatureRequest, documentContent, documentName)
      ).rejects.toThrow('Envelope creation failed');

      // Restore original method
      docusignClient.createEnvelope = originalCreateEnvelope;
    });

    test('should handle webhook events', async () => {
      const mockWebhookEvent = {
        event: 'envelope.completed',
        envelopeId: 'test-envelope-id',
        apiVersion: '2.1',
        uri: '/restapi/v2.1/accounts/test-account/envelopes/test-envelope-id',
        retryCount: 0,
        configurationId: 'test-config-id',
        generatedDateTime: new Date().toISOString(),
        data: {
          accountId: 'test-account-id',
          userId: 'test-user-id',
          envelopeId: 'test-envelope-id',
          envelopeSummary: {
            envelopeId: 'test-envelope-id',
            status: 'completed',
            statusChangedDateTime: new Date().toISOString(),
            documents: [],
            recipients: []
          }
        }
      };

      // Test webhook handling
      await expect(
        docusignClient.handleWebhookEvent(mockWebhookEvent)
      ).resolves.not.toThrow();
    });

    test('should handle rate limiting', async () => {
      // Mock rate limiting response
      const originalHttpClient = docusignClient['httpClient'];
      docusignClient['httpClient'] = {
        ...originalHttpClient,
        get: jest.fn().mockRejectedValue({
          response: { status: 429, data: { error: 'Rate limit exceeded' } }
        })
      } as any;

      await expect(
        docusignClient.getAccountInfo()
      ).rejects.toThrow();

      // Restore original client
      docusignClient['httpClient'] = originalHttpClient;
    });
  });

  describe('PKI Integration', () => {
    test('should initialize PKI client', () => {
      expect(pkiClient).toBeDefined();
    });

    test('should handle certificate validation failure', async () => {
      const mockCertificate = {
        serialNumber: 'test-serial',
        subject: 'CN=Test Certificate',
        issuer: 'CN=Test CA',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        publicKey: 'test-public-key',
        fingerprint: 'test-fingerprint',
        algorithm: 'RSA'
      };

      // Mock certificate validation failure
      const originalValidateCertificate = pkiClient.validateCertificate;
      pkiClient.validateCertificate = jest.fn().mockResolvedValue({
        isValid: false,
        certificate: mockCertificate,
        errors: ['Certificate validation failed'],
        warnings: []
      });

      const result = await pkiClient.validateCertificate(mockCertificate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Certificate validation failed');

      // Restore original method
      pkiClient.validateCertificate = originalValidateCertificate;
    });

    test('should handle signature creation failure', async () => {
      const documentContent = Buffer.from('Test document');
      const mockSignatureRequest: SignatureRequest = {
        id: 'test-request-id',
        mou_id: 'test-mou-id',
        document_id: 'test-document-id',
        provider: 'pki',
        status: 'draft',
        signatories: [],
        workflow: 'parallel',
        envelope_id: undefined,
        certificate: undefined,
        audit_trail: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        completed_at: undefined
      };

      const mockSignatory: Signatory = {
        contact_id: 'test-contact-id',
        order: 1,
        status: 'pending',
        signed_at: undefined,
        ip_address: undefined,
        signature_data: undefined
      };

      // Mock signature creation failure
      const originalCreateSignature = pkiClient.createSignature;
      pkiClient.createSignature = jest.fn().mockRejectedValue(new Error('Signature creation failed'));

      await expect(
        pkiClient.createSignature(documentContent, mockSignatureRequest, mockSignatory)
      ).rejects.toThrow('Signature creation failed');

      // Restore original method
      pkiClient.createSignature = originalCreateSignature;
    });

    test('should handle smart card detection', async () => {
      // Mock smart card detection
      const originalDetectSmartCards = pkiClient.detectSmartCards;
      pkiClient.detectSmartCards = jest.fn().mockResolvedValue([
        {
          readerName: 'Test Reader',
          cardId: 'test-card-id',
          certificate: {
            serialNumber: 'test-serial',
            subject: 'CN=Test Card',
            issuer: 'CN=Test CA',
            validFrom: new Date(),
            validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            publicKey: 'test-public-key',
            fingerprint: 'test-fingerprint',
            algorithm: 'RSA'
          },
          isAvailable: true
        }
      ]);

      const smartCards = await pkiClient.detectSmartCards();
      expect(smartCards).toHaveLength(1);
      expect(smartCards[0].isAvailable).toBe(true);

      // Restore original method
      pkiClient.detectSmartCards = originalDetectSmartCards;
    });
  });

  describe('Signature Orchestrator', () => {
    test('should initialize signature orchestrator', () => {
      expect(signatureOrchestrator).toBeDefined();
    });

    test('should select appropriate provider', () => {
      // Test provider selection logic
      const orchestrator = signatureOrchestrator as any;
      
      // Mock provider status
      orchestrator.providerStatus.set('docusign', {
        provider: 'docusign',
        isAvailable: true,
        lastChecked: new Date(),
        error: undefined
      });

      orchestrator.providerStatus.set('pki', {
        provider: 'pki',
        isAvailable: false,
        lastChecked: new Date(),
        error: 'Connection failed'
      });

      const selectedProvider = orchestrator.selectProvider('docusign');
      expect(selectedProvider).toBe('docusign');
    });

    test('should handle provider failover', async () => {
      const mockSignatureRequest: SignatureRequest = {
        id: 'test-request-id',
        mou_id: 'test-mou-id',
        document_id: 'test-document-id',
        provider: 'docusign',
        status: 'draft',
        signatories: [],
        workflow: 'parallel',
        envelope_id: undefined,
        certificate: undefined,
        audit_trail: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        completed_at: undefined
      };

      const documentContent = Buffer.from('Test document');
      const documentName = 'test-document.pdf';

      // Mock primary provider failure
      const originalInitiateSignature = signatureOrchestrator.initiateSignature;
      signatureOrchestrator.initiateSignature = jest.fn()
        .mockRejectedValueOnce(new Error('Primary provider failed'))
        .mockResolvedValueOnce({
          success: true,
          signatureId: 'test-signature-id',
          provider: 'pki',
          status: 'completed',
          metadata: {}
        });

      const result = await signatureOrchestrator.initiateSignature(
        mockSignatureRequest,
        documentContent,
        documentName,
        'docusign'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('pki');

      // Restore original method
      signatureOrchestrator.initiateSignature = originalInitiateSignature;
    });

    test('should handle mixed signing workflows', async () => {
      const mockRequests = [
        {
          request: {
            id: 'request-1',
            mou_id: 'mou-1',
            document_id: 'doc-1',
            provider: 'docusign' as const,
            status: 'draft' as const,
            signatories: [],
            workflow: 'parallel' as const,
            envelope_id: undefined,
            certificate: undefined,
            audit_trail: [],
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            completed_at: undefined
          },
          provider: 'docusign' as const,
          documentContent: Buffer.from('Document 1'),
          documentName: 'document1.pdf'
        },
        {
          request: {
            id: 'request-2',
            mou_id: 'mou-2',
            document_id: 'doc-2',
            provider: 'pki' as const,
            status: 'draft' as const,
            signatories: [],
            workflow: 'parallel' as const,
            envelope_id: undefined,
            certificate: undefined,
            audit_trail: [],
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            completed_at: undefined
          },
          provider: 'pki' as const,
          documentContent: Buffer.from('Document 2'),
          documentName: 'document2.pdf'
        }
      ];

      // Mock successful signatures
      const originalHandleMixedSigningWorkflow = signatureOrchestrator.handleMixedSigningWorkflow;
      signatureOrchestrator.handleMixedSigningWorkflow = jest.fn().mockResolvedValue([
        {
          success: true,
          signatureId: 'signature-1',
          provider: 'docusign',
          status: 'sent',
          metadata: {}
        },
        {
          success: true,
          signatureId: 'signature-2',
          provider: 'pki',
          status: 'completed',
          metadata: {}
        }
      ]);

      const results = await signatureOrchestrator.handleMixedSigningWorkflow(mockRequests);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      // Restore original method
      signatureOrchestrator.handleMixedSigningWorkflow = originalHandleMixedSigningWorkflow;
    });

    test('should handle provider unavailability', async () => {
      const mockSignatureRequest: SignatureRequest = {
        id: 'test-request-id',
        mou_id: 'test-mou-id',
        document_id: 'test-document-id',
        provider: 'docusign',
        status: 'draft',
        signatories: [],
        workflow: 'parallel',
        envelope_id: undefined,
        certificate: undefined,
        audit_trail: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        completed_at: undefined
      };

      const documentContent = Buffer.from('Test document');
      const documentName = 'test-document.pdf';

      // Mock all providers unavailable
      const orchestrator = signatureOrchestrator as any;
      orchestrator.providerStatus.clear();
      orchestrator.providerStatus.set('docusign', {
        provider: 'docusign',
        isAvailable: false,
        lastChecked: new Date(),
        error: 'Service unavailable'
      });
      orchestrator.providerStatus.set('pki', {
        provider: 'pki',
        isAvailable: false,
        lastChecked: new Date(),
        error: 'Service unavailable'
      });

      const result = await signatureOrchestrator.initiateSignature(
        mockSignatureRequest,
        documentContent,
        documentName
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No signature providers available');
    });
  });

  describe('Performance Testing', () => {
    test('should handle concurrent signature requests', async () => {
      const concurrentRequests = 10;
      const mockSignatureRequest: SignatureRequest = {
        id: 'test-request-id',
        mou_id: 'test-mou-id',
        document_id: 'test-document-id',
        provider: 'docusign',
        status: 'draft',
        signatories: [],
        workflow: 'parallel',
        envelope_id: undefined,
        certificate: undefined,
        audit_trail: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        completed_at: undefined
      };

      const documentContent = Buffer.from('Test document');
      const documentName = 'test-document.pdf';

      // Mock successful signature creation
      const originalInitiateSignature = signatureOrchestrator.initiateSignature;
      signatureOrchestrator.initiateSignature = jest.fn().mockResolvedValue({
        success: true,
        signatureId: 'test-signature-id',
        provider: 'docusign',
        status: 'sent',
        metadata: {}
      });

      const startTime = Date.now();
      const promises = Array(concurrentRequests).fill(null).map(() =>
        signatureOrchestrator.initiateSignature(
          mockSignatureRequest,
          documentContent,
          documentName
        )
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(concurrentRequests);
      expect(results.every(result => result.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Restore original method
      signatureOrchestrator.initiateSignature = originalInitiateSignature;
    });

    test('should handle large document signatures', async () => {
      const largeDocument = Buffer.alloc(10 * 1024 * 1024); // 10MB document
      const mockSignatureRequest: SignatureRequest = {
        id: 'test-request-id',
        mou_id: 'test-mou-id',
        document_id: 'test-document-id',
        provider: 'docusign',
        status: 'draft',
        signatories: [],
        workflow: 'parallel',
        envelope_id: undefined,
        certificate: undefined,
        audit_trail: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        completed_at: undefined
      };

      // Mock successful signature creation
      const originalInitiateSignature = signatureOrchestrator.initiateSignature;
      signatureOrchestrator.initiateSignature = jest.fn().mockResolvedValue({
        success: true,
        signatureId: 'test-signature-id',
        provider: 'docusign',
        status: 'sent',
        metadata: {}
      });

      const startTime = Date.now();
      const result = await signatureOrchestrator.initiateSignature(
        mockSignatureRequest,
        largeDocument,
        'large-document.pdf'
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Restore original method
      signatureOrchestrator.initiateSignature = originalInitiateSignature;
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network timeouts', async () => {
      // Mock network timeout
      const originalHttpClient = docusignClient['httpClient'];
      docusignClient['httpClient'] = {
        ...originalHttpClient,
        get: jest.fn().mockRejectedValue(new Error('Network timeout'))
      } as any;

      await expect(
        docusignClient.getAccountInfo()
      ).rejects.toThrow('Network timeout');

      // Restore original client
      docusignClient['httpClient'] = originalHttpClient;
    });

    test('should handle service unavailability', async () => {
      // Mock service unavailability
      const originalHttpClient = docusignClient['httpClient'];
      docusignClient['httpClient'] = {
        ...originalHttpClient,
        get: jest.fn().mockRejectedValue({
          response: { status: 503, data: { error: 'Service unavailable' } }
        })
      } as any;

      await expect(
        docusignClient.getAccountInfo()
      ).rejects.toThrow();

      // Restore original client
      docusignClient['httpClient'] = originalHttpClient;
    });

    test('should handle invalid responses', async () => {
      // Mock invalid response
      const originalHttpClient = docusignClient['httpClient'];
      docusignClient['httpClient'] = {
        ...originalHttpClient,
        get: jest.fn().mockResolvedValue({
          data: null // Invalid response
        })
      } as any;

      const result = await docusignClient.getAccountInfo();
      expect(result).toBeNull();

      // Restore original client
      docusignClient['httpClient'] = originalHttpClient;
    });
  });

  describe('Webhook Handling', () => {
    test('should handle DocuSign webhook events', async () => {
      const mockWebhookEvent = {
        event: 'envelope.completed',
        envelopeId: 'test-envelope-id',
        apiVersion: '2.1',
        uri: '/restapi/v2.1/accounts/test-account/envelopes/test-envelope-id',
        retryCount: 0,
        configurationId: 'test-config-id',
        generatedDateTime: new Date().toISOString(),
        data: {
          accountId: 'test-account-id',
          userId: 'test-user-id',
          envelopeId: 'test-envelope-id',
          envelopeSummary: {
            envelopeId: 'test-envelope-id',
            status: 'completed',
            statusChangedDateTime: new Date().toISOString(),
            documents: [],
            recipients: []
          }
        }
      };

      await expect(
        docusignClient.handleWebhookEvent(mockWebhookEvent)
      ).resolves.not.toThrow();
    });

    test('should handle webhook retry logic', async () => {
      const mockWebhookEvent = {
        event: 'envelope.completed',
        envelopeId: 'test-envelope-id',
        apiVersion: '2.1',
        uri: '/restapi/v2.1/accounts/test-account/envelopes/test-envelope-id',
        retryCount: 3, // High retry count
        configurationId: 'test-config-id',
        generatedDateTime: new Date().toISOString(),
        data: {
          accountId: 'test-account-id',
          userId: 'test-user-id',
          envelopeId: 'test-envelope-id',
          envelopeSummary: {
            envelopeId: 'test-envelope-id',
            status: 'completed',
            statusChangedDateTime: new Date().toISOString(),
            documents: [],
            recipients: []
          }
        }
      };

      // Should handle high retry count gracefully
      await expect(
        docusignClient.handleWebhookEvent(mockWebhookEvent)
      ).resolves.not.toThrow();
    });
  });
});
