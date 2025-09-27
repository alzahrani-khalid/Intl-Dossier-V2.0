import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { SignatureRequest, Signatory, SignatureStatus } from '../models/SignatureRequest';

export interface DocuSignConfig {
  accountId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  basePath: string;
  authServer: string;
}

export interface DocuSignEnvelope {
  envelopeId: string;
  status: string;
  statusChangedDateTime: string;
  documents: DocuSignDocument[];
  recipients: DocuSignRecipient[];
  customFields?: DocuSignCustomField[];
}

export interface DocuSignDocument {
  documentId: string;
  name: string;
  uri: string;
  order: number;
  pages: number;
}

export interface DocuSignRecipient {
  recipientId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  routingOrder: number;
  clientUserId?: string;
  tabs?: DocuSignTabs;
}

export interface DocuSignTabs {
  signHereTabs?: DocuSignSignHereTab[];
  dateSignedTabs?: DocuSignDateSignedTab[];
  textTabs?: DocuSignTextTab[];
}

export interface DocuSignSignHereTab {
  tabId: string;
  documentId: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  anchorString?: string;
  anchorXOffset?: number;
  anchorYOffset?: number;
}

export interface DocuSignDateSignedTab {
  tabId: string;
  documentId: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
}

export interface DocuSignTextTab {
  tabId: string;
  documentId: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  value: string;
}

export interface DocuSignCustomField {
  name: string;
  value: string;
  show: boolean;
  required: boolean;
}

export interface DocuSignWebhookEvent {
  event: string;
  envelopeId: string;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: string;
  generatedDateTime: string;
  data: {
    accountId: string;
    userId: string;
    envelopeId: string;
    envelopeSummary: {
      envelopeId: string;
      status: string;
      statusChangedDateTime: string;
      documents: DocuSignDocument[];
      recipients: DocuSignRecipient[];
    };
  };
}

export interface DocuSignAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class DocuSignClient {
  private config: DocuSignConfig;
  private httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: DocuSignConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: `${config.basePath}/restapi/v2.1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor to include auth token
    this.httpClient.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, refresh it
          await this.refreshToken();
          // Retry the original request
          return this.httpClient.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with DocuSign and get access token
   */
  async authenticate(): Promise<string> {
    try {
      const response = await axios.post(`${this.config.authServer}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'signature'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const authData: DocuSignAuthResponse = response.data;
      this.accessToken = authData.access_token;
      this.tokenExpiry = Date.now() + (authData.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      throw new Error(`DocuSign authentication failed: ${error}`);
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshToken(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = 0;
    await this.authenticate();
  }

  /**
   * Create a new envelope for signing
   */
  async createEnvelope(
    signatureRequest: SignatureRequest,
    documentContent: Buffer,
    documentName: string
  ): Promise<string> {
    try {
      const envelope = this.buildEnvelope(signatureRequest, documentContent, documentName);
      
      const response = await this.httpClient.post(
        `/accounts/${this.config.accountId}/envelopes`,
        envelope
      );

      return response.data.envelopeId;
    } catch (error) {
      throw new Error(`Failed to create DocuSign envelope: ${error}`);
    }
  }

  /**
   * Get envelope status and details
   */
  async getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope> {
    try {
      const response = await this.httpClient.get(
        `/accounts/${this.config.accountId}/envelopes/${envelopeId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get DocuSign envelope status: ${error}`);
    }
  }

  /**
   * Get envelope documents
   */
  async getEnvelopeDocuments(envelopeId: string): Promise<DocuSignDocument[]> {
    try {
      const response = await this.httpClient.get(
        `/accounts/${this.config.accountId}/envelopes/${envelopeId}/documents`
      );

      return response.data.envelopeDocuments;
    } catch (error) {
      throw new Error(`Failed to get DocuSign envelope documents: ${error}`);
    }
  }

  /**
   * Get recipient status
   */
  async getRecipientStatus(envelopeId: string): Promise<DocuSignRecipient[]> {
    try {
      const response = await this.httpClient.get(
        `/accounts/${this.config.accountId}/envelopes/${envelopeId}/recipients`
      );

      return response.data.signers || [];
    } catch (error) {
      throw new Error(`Failed to get DocuSign recipient status: ${error}`);
    }
  }

  /**
   * Void an envelope
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    try {
      await this.httpClient.put(
        `/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
        {
          status: 'voided',
          voidedReason: reason
        }
      );
    } catch (error) {
      throw new Error(`Failed to void DocuSign envelope: ${error}`);
    }
  }

  /**
   * Send reminder to recipients
   */
  async sendReminder(envelopeId: string, recipients: string[]): Promise<void> {
    try {
      await this.httpClient.put(
        `/accounts/${this.config.accountId}/envelopes/${envelopeId}/recipients`,
        {
          signers: recipients.map(recipientId => ({
            recipientId,
            emailNotification: {
              emailSubject: 'Reminder: Please sign the document',
              emailBody: 'This is a reminder to sign the document.'
            }
          }))
        }
      );
    } catch (error) {
      throw new Error(`Failed to send DocuSign reminder: ${error}`);
    }
  }

  /**
   * Verify signature authenticity
   */
  async verifySignature(envelopeId: string, recipientId: string): Promise<boolean> {
    try {
      const envelope = await this.getEnvelopeStatus(envelopeId);
      const recipient = envelope.recipients.find(r => r.recipientId === recipientId);
      
      if (!recipient) {
        return false;
      }

      // Check if recipient has signed
      return recipient.status === 'completed';
    } catch (error) {
      throw new Error(`Failed to verify DocuSign signature: ${error}`);
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event: DocuSignWebhookEvent): Promise<void> {
    try {
      // Process the webhook event
      const { envelopeId, data } = event;
      
      // Update signature request status based on envelope status
      const envelopeStatus = data.envelopeSummary.status;
      const mappedStatus = this.mapDocuSignStatusToInternal(envelopeStatus);
      
      // Here you would typically update your database
      // This is a placeholder for the actual implementation
      console.log(`Processing DocuSign webhook for envelope ${envelopeId}: ${mappedStatus}`);
      
    } catch (error) {
      throw new Error(`Failed to handle DocuSign webhook: ${error}`);
    }
  }

  /**
   * Build envelope structure for DocuSign API
   */
  private buildEnvelope(
    signatureRequest: SignatureRequest,
    documentContent: Buffer,
    documentName: string
  ): any {
    const recipients = signatureRequest.signatories.map((signatory, index) => ({
      recipientId: (index + 1).toString(),
      email: signatory.contact_id, // Assuming contact_id contains email
      name: signatory.contact_id, // Assuming contact_id contains name
      role: 'signer',
      routingOrder: signatureRequest.workflow === 'sequential' ? index + 1 : 1,
      clientUserId: signatory.contact_id,
      tabs: {
        signHereTabs: [{
          tabId: `signature_${index + 1}`,
          documentId: '1',
          pageNumber: 1,
          xPosition: 100 + (index * 200),
          yPosition: 100,
          width: 100,
          height: 50,
          anchorString: '{{signature_placeholder}}',
          anchorXOffset: 0,
          anchorYOffset: 0
        }],
        dateSignedTabs: [{
          tabId: `date_${index + 1}`,
          documentId: '1',
          pageNumber: 1,
          xPosition: 100 + (index * 200),
          yPosition: 160,
          width: 100,
          height: 30
        }]
      }
    }));

    return {
      emailSubject: `Please sign: ${documentName}`,
      emailBlurb: 'Please review and sign the attached document.',
      documents: [{
        documentId: '1',
        name: documentName,
        documentBase64: documentContent.toString('base64')
      }],
      recipients: {
        signers: recipients
      },
      status: 'sent',
      customFields: {
        textCustomFields: [{
          name: 'mou_id',
          value: signatureRequest.mou_id,
          show: false,
          required: false
        }]
      }
    };
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
   * Map internal status to DocuSign status
   */
  private mapInternalStatusToDocuSign(internalStatus: SignatureStatus): string {
    const statusMap: Record<SignatureStatus, string> = {
      'draft': 'created',
      'sent': 'sent',
      'viewed': 'delivered',
      'signed': 'completed',
      'completed': 'completed',
      'declined': 'declined',
      'expired': 'voided'
    };

    return statusMap[internalStatus] || 'created';
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `/accounts/${this.config.accountId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get DocuSign account info: ${error}`);
    }
  }

  /**
   * Test connection to DocuSign
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      await this.getAccountInfo();
      return true;
    } catch (error) {
      console.error('DocuSign connection test failed:', error);
      return false;
    }
  }
}
