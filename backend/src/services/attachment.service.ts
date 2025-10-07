import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '25');
const MAX_TOTAL_SIZE_MB = parseInt(process.env.MAX_TOTAL_SIZE_MB || '100');

interface UploadOptions {
  ticketId: string;
  file: File | Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
  userId: string;
}

interface UploadResult {
  success: boolean;
  attachmentId?: string;
  storagePath?: string;
  scanStatus: 'pending' | 'clean' | 'infected' | 'error';
  error?: string;
}

/**
 * Attachment Service
 * Handles file uploads with virus scanning and validation
 */
export class AttachmentService {
  private readonly BUCKET_NAME = 'intake-attachments';
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ];

  /**
   * Upload attachment to Supabase Storage
   */
  async uploadAttachment(options: UploadOptions): Promise<UploadResult> {
    try {
      logger.info('Starting attachment upload', {
        ticketId: options.ticketId,
        fileName: options.fileName,
        fileSize: options.fileSize,
      });

      // Validate file
      const validation = await this.validateFile(options);
      if (!validation.valid) {
        return {
          success: false,
          scanStatus: 'error',
          error: validation.error,
        };
      }

      // Check total ticket attachments size
      const canUpload = await this.checkTotalSize(options.ticketId, options.fileSize);
      if (!canUpload) {
        return {
          success: false,
          scanStatus: 'error',
          error: `Total attachments would exceed ${MAX_TOTAL_SIZE_MB}MB limit`,
        };
      }

      // Generate storage path
      const storagePath = this.generateStoragePath(options.ticketId, options.fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(storagePath, options.file, {
          contentType: options.mimeType,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create attachment record
      const { data: attachment, error: dbError } = await supabase
        .from('intake_attachments')
        .insert({
          ticket_id: options.ticketId,
          file_name: options.fileName,
          file_size: options.fileSize,
          mime_type: options.mimeType,
          storage_path: storagePath,
          scan_status: 'pending',
          uploaded_at: new Date().toISOString(),
          uploaded_by: options.userId,
        })
        .select('id')
        .single();

      if (dbError || !attachment) {
        // Rollback storage upload
        await this.deleteFromStorage(storagePath);
        throw new Error(`Database insert failed: ${dbError?.message}`);
      }

      // Trigger virus scan webhook
      await this.triggerVirusScan(attachment.id, storagePath);

      logger.info('Attachment uploaded successfully', {
        attachmentId: attachment.id,
        ticketId: options.ticketId,
      });

      return {
        success: true,
        attachmentId: attachment.id,
        storagePath,
        scanStatus: 'pending',
      };
    } catch (error) {
      logger.error('Attachment upload failed', {
        ticketId: options.ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        scanStatus: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Validate file before upload
   */
  private async validateFile(
    options: UploadOptions
  ): Promise<{ valid: boolean; error?: string }> {
    // Check file size
    if (options.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(options.mimeType)) {
      return {
        valid: false,
        error: `File type ${options.mimeType} is not allowed`,
      };
    }

    // Check filename for suspicious patterns
    if (this.hasSuspiciousFilename(options.fileName)) {
      return {
        valid: false,
        error: 'Filename contains suspicious characters',
      };
    }

    return { valid: true };
  }

  /**
   * Check if filename has suspicious patterns
   */
  private hasSuspiciousFilename(filename: string): boolean {
    const suspicious = [
      /\.\./,  // Path traversal
      /<script/i,  // XSS
      /\x00/,  // Null byte
      /[<>:"|?*]/,  // Invalid filename chars
    ];

    return suspicious.some((pattern) => pattern.test(filename));
  }

  /**
   * Check total attachments size for ticket
   */
  private async checkTotalSize(ticketId: string, newFileSize: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('intake_attachments')
      .select('file_size')
      .eq('ticket_id', ticketId)
      .is('deleted_at', null);

    if (error) {
      logger.warn('Could not check total size', { ticketId, error: error.message });
      return true; // Allow upload if we can't check
    }

    const totalSize = (data || []).reduce((sum, att) => sum + att.file_size, 0);
    const totalSizeBytes = MAX_TOTAL_SIZE_MB * 1024 * 1024;

    return totalSize + newFileSize <= totalSizeBytes;
  }

  /**
   * Generate storage path
   */
  private generateStoragePath(ticketId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${ticketId}/${timestamp}_${sanitizedName}`;
  }

  /**
   * Trigger virus scan webhook
   */
  private async triggerVirusScan(attachmentId: string, storagePath: string): Promise<void> {
    try {
      const scanWebhookUrl = process.env.VIRUS_SCAN_WEBHOOK_URL;
      if (!scanWebhookUrl) {
        logger.warn('Virus scan webhook not configured');
        return;
      }

      // Get signed URL for scanning service
      const { data: signedUrl } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(storagePath, 3600); // 1 hour

      if (!signedUrl) {
        throw new Error('Could not create signed URL for scanning');
      }

      // Call virus scanning webhook
      const response = await fetch(scanWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VIRUS_SCAN_API_KEY}`,
        },
        body: JSON.stringify({
          attachment_id: attachmentId,
          file_url: signedUrl.signedUrl,
          callback_url: `${process.env.API_URL}/webhooks/virus-scan`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Virus scan trigger failed: ${response.statusText}`);
      }

      logger.info('Virus scan triggered', { attachmentId });
    } catch (error) {
      logger.error('Failed to trigger virus scan', {
        attachmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle virus scan result from webhook
   */
  async handleScanResult(
    attachmentId: string,
    scanResult: {
      status: 'clean' | 'infected' | 'error';
      details?: any;
    }
  ): Promise<boolean> {
    try {
      // Update attachment scan status
      const { error } = await supabase
        .from('intake_attachments')
        .update({
          scan_status: scanResult.status,
          scan_result: scanResult.details,
        })
        .eq('id', attachmentId);

      if (error) {
        throw error;
      }

      // If infected, mark for deletion
      if (scanResult.status === 'infected') {
        await this.quarantineAttachment(attachmentId);
      }

      logger.info('Scan result processed', { attachmentId, status: scanResult.status });
      return true;
    } catch (error) {
      logger.error('Failed to process scan result', {
        attachmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Quarantine infected attachment
   */
  private async quarantineAttachment(attachmentId: string): Promise<void> {
    const { data: attachment } = await supabase
      .from('intake_attachments')
      .select('storage_path, ticket_id')
      .eq('id', attachmentId)
      .single();

    if (attachment) {
      // Soft delete
      await supabase
        .from('intake_attachments')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', attachmentId);

      // Optionally delete from storage
      await this.deleteFromStorage(attachment.storage_path);

      logger.warn('Attachment quarantined', { attachmentId, ticketId: attachment.ticket_id });
    }
  }

  /**
   * Delete attachment from storage
   */
  private async deleteFromStorage(storagePath: string): Promise<void> {
    try {
      await supabase.storage.from(this.BUCKET_NAME).remove([storagePath]);
    } catch (error) {
      logger.error('Failed to delete from storage', {
        storagePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get download URL for attachment
   */
  async getDownloadUrl(attachmentId: string, userId: string): Promise<string | null> {
    try {
      // Get attachment
      const { data: attachment, error } = await supabase
        .from('intake_attachments')
        .select('storage_path, scan_status, ticket_id')
        .eq('id', attachmentId)
        .is('deleted_at', null)
        .single();

      if (error || !attachment) {
        return null;
      }

      // Check scan status
      if (attachment.scan_status !== 'clean') {
        throw new Error('File has not been scanned or is infected');
      }

      // Verify user has access to ticket (via RLS)
      const { data: ticket } = await supabase
        .from('intake_tickets')
        .select('id')
        .eq('id', attachment.ticket_id)
        .single();

      if (!ticket) {
        throw new Error('Access denied');
      }

      // Generate signed URL (valid for 5 minutes)
      const { data: signedUrl } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(attachment.storage_path, 300);

      return signedUrl?.signedUrl || null;
    } catch (error) {
      logger.error('Failed to get download URL', {
        attachmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}

export const attachmentService = new AttachmentService();