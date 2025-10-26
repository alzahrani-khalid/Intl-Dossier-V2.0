/**
 * DocumentExtractor Component
 * Part of: 027-contact-directory implementation - Phase 5 (Document Extraction)
 *
 * Mobile-first, RTL-ready document extractor for bulk contact import.
 * Features file upload, processing progress indicator, and extracted contacts preview.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, FileText, Users } from 'lucide-react';
import { useUploadDocument, useDocumentStatus, getConfidenceColor } from '@/hooks/useOCR';
import type { ExtractedContact } from '@/services/ocr-api';
import type { Database } from '@/types/contact-directory.types';

type ContactInsert = Database['public']['Tables']['cd_contacts']['Insert'];

interface DocumentExtractorProps {
  onExtracted: (contacts: Partial<ContactInsert>[]) => void;
  onCancel?: () => void;
}

export function DocumentExtractor({ onExtracted, onCancel }: DocumentExtractorProps) {
  const { t, i18n } = useTranslation('contacts');
  const isRTL = i18n.language === 'ar';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentSourceId, setDocumentSourceId] = useState<string | null>(null);
  const [extractedContacts, setExtractedContacts] = useState<ExtractedContact[]>([]);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadDocument();

  // Poll document status with automatic polling
  const { data: statusData, isLoading: isPolling } = useDocumentStatus(
    documentSourceId,
    {
      enabled: !!documentSourceId && !processingComplete && !processingError,
      onCompleted: (data) => {
        setProcessingComplete(true);
        if (data.extracted_contacts && data.extracted_contacts.length > 0) {
          setExtractedContacts(data.extracted_contacts);
        }
      },
      onFailed: (error) => {
        setProcessingError(error);
      },
    }
  );

  // Handle file selection from input
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['pdf', 'docx', 'doc', 'txt', 'csv', 'xls', 'xlsx'];
    const fileExtension = file.name.toLowerCase().split('.').pop();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      alert(t('contactDirectory.documentExtraction.invalid_file_type'));
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t('contactDirectory.documentExtraction.file_too_large'));
      return;
    }

    setSelectedFile(file);
  }, [t]);

  // Clear selected file and reset state
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setDocumentSourceId(null);
    setExtractedContacts([]);
    setProcessingComplete(false);
    setProcessingError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Upload and process document
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadMutation.mutateAsync({ file: selectedFile });
      setDocumentSourceId(result.document_source_id);
    } catch (error) {
      console.error('Upload error:', error);
    }
  }, [selectedFile, uploadMutation]);

  // Handle continuing with extracted contacts
  const handleContinue = useCallback(() => {
    // Map extracted contacts to ContactInsert format
    const contacts: Partial<ContactInsert>[] = extractedContacts.map((contact) => ({
      full_name: contact.full_name,
      organization_id: undefined, // Will be set by user in review UI
      position: contact.position || undefined,
      email_addresses: contact.email_addresses || [],
      phone_numbers: contact.phone_numbers || [],
      source_type: 'document',
      ocr_confidence: contact.confidence,
      source_document_id: documentSourceId || undefined,
    }));

    onExtracted(contacts);
  }, [extractedContacts, documentSourceId, onExtracted]);

  // Get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isProcessing = !!documentSourceId && !processingComplete && !processingError;

  return (
    <div className="space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* File Selection */}
      {!documentSourceId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-start">
              {t('contactDirectory.documentExtraction.title')}
            </CardTitle>
            <CardDescription className="text-start">
              {t('contactDirectory.documentExtraction.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Preview */}
            {selectedFile && (
              <div className="border rounded-lg p-4 flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(selectedFile.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-start">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground text-start">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="flex-shrink-0 min-h-8 min-w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload Button */}
            {!selectedFile && (
              <div
                className="border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">
                  {t('contactDirectory.documentExtraction.click_to_upload')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('contactDirectory.documentExtraction.supported_formats')}
                </p>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Process Button */}
            {selectedFile && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full h-11 sm:h-10"
              >
                {uploadMutation.isPending && (
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                )}
                {t('contactDirectory.documentExtraction.extract_contacts')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-start">
                  {t('contactDirectory.documentExtraction.processing')}
                </p>
                {statusData && (
                  <p className="text-xs text-muted-foreground text-start">
                    {t(`contactDirectory.documentExtraction.status_${statusData.processing_status}`)}
                  </p>
                )}
              </div>
            </div>
            <Progress value={undefined} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {t('contactDirectory.documentExtraction.processing_time_estimate')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Processing Error */}
      {processingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-start">
            {t('contactDirectory.documentExtraction.processing_error', { error: processingError })}
          </AlertDescription>
        </Alert>
      )}

      {/* Extraction Results */}
      {processingComplete && extractedContacts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-start flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {t('contactDirectory.documentExtraction.extraction_complete')}
              </CardTitle>
              <Badge variant="secondary" className="text-sm">
                <Users className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {extractedContacts.length} {t('contactDirectory.documentExtraction.contacts_found')}
              </Badge>
            </div>
            <CardDescription className="text-start">
              {t('contactDirectory.documentExtraction.review_and_edit')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Contact Preview List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {extractedContacts.map((contact, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate text-start">
                          {contact.full_name}
                        </p>
                        <Badge className={`text-xs ${getConfidenceColor(contact.confidence)}`}>
                          {contact.confidence}%
                        </Badge>
                      </div>
                      {contact.organization && (
                        <p className="text-xs text-muted-foreground text-start truncate">
                          {contact.organization}
                        </p>
                      )}
                      {contact.position && (
                        <p className="text-xs text-muted-foreground text-start truncate">
                          {contact.position}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {contact.email_addresses?.map((email, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {email}
                          </Badge>
                        ))}
                        {contact.phone_numbers?.map((phone, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {phone}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={clearFile}
                className="h-11 sm:h-10"
              >
                {t('contactDirectory.documentExtraction.start_over')}
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                className="h-11 sm:h-10 flex-1"
              >
                {t('contactDirectory.documentExtraction.review_and_import')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Contacts Found */}
      {processingComplete && extractedContacts.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-start">
            {t('contactDirectory.documentExtraction.no_contacts_found')}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      {!documentSourceId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-start text-sm">
            {t('contactDirectory.documentExtraction.info_alert')}
          </AlertDescription>
        </Alert>
      )}

      {/* Cancel Button */}
      {onCancel && !isProcessing && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-11 px-6 sm:h-10"
          >
            {t('contactDirectory.documentExtraction.back_to_manual')}
          </Button>
        </div>
      )}
    </div>
  );
}
