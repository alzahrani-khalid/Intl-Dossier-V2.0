/**
 * ContactCreate Page
 * Part of: 027-contact-directory implementation
 *
 * Page for creating new contacts with duplicate detection.
 * Mobile-first, RTL-ready.
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, AlertTriangle, FileText, Scan, Upload } from 'lucide-react';
import { useCreatePersonDossier } from '@/hooks/usePersonDossiers';
import { ContactForm, type OCRFieldConfidence } from '@/components/contacts/ContactForm';
import { BusinessCardScanner } from '@/components/contacts/BusinessCardScanner';
import { DocumentExtractor } from '@/components/contacts/DocumentExtractor';
import { BatchContactReview, type EditableContact } from '@/components/contacts/BatchContactReview';
import type { Database } from '@/types/contact-directory.types';
import type { DuplicateWarning } from '@/services/contact-api';
import type { OCRParsedFields } from '@/services/ocr-api';

type ContactInsert = Database['public']['Tables']['cd_contacts']['Insert'];

export function ContactCreate() {
  const { t, i18n } = useTranslation('contacts');
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'manual' | 'scan' | 'document'>('manual');
  const [pendingContact, setPendingContact] = useState<Omit<
    ContactInsert,
    'created_by' | 'id' | 'created_at' | 'updated_at'
  > | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateWarning[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // OCR extracted data (business card)
  const [ocrData, setOcrData] = useState<Partial<ContactInsert> | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<OCRFieldConfidence | undefined>();
  const [ocrRawText, setOcrRawText] = useState<string | undefined>();

  // Document extraction (bulk import)
  const [extractedContacts, setExtractedContacts] = useState<EditableContact[]>([]);
  const [showBatchReview, setShowBatchReview] = useState(false);
  const [batchDuplicates, setBatchDuplicates] = useState<Map<string, DuplicateWarning[]>>(new Map());
  const [showBatchDuplicateDialog, setShowBatchDuplicateDialog] = useState(false);
  const [pendingBatchContacts, setPendingBatchContacts] = useState<EditableContact[]>([]);

  const createMutation = useCreateContact();
  const checkDuplicatesMutation = useCheckDuplicates();
  const batchCreateMutation = useBatchCreateContacts();

  const handleBack = () => {
    navigate({ to: '/contacts' });
  };

  // Handle OCR extraction
  const handleOCRExtracted = (fields: OCRParsedFields, confidence: number, rawText: string) => {
    // Map OCR fields to ContactInsert format
    const extractedData: Partial<ContactInsert> = {
      full_name: fields.full_name || '',
      position: fields.position || '',
      email_addresses: fields.email_addresses || [],
      phone_numbers: fields.phone_numbers || [],
      source_type: 'business_card',
      ocr_confidence: confidence,
    };

    // Set confidence scores for individual fields
    const fieldConfidence: OCRFieldConfidence = {
      full_name: fields.full_name ? confidence : undefined,
      position: fields.position ? confidence : undefined,
      email_addresses: fields.email_addresses && fields.email_addresses.length > 0 ? confidence : undefined,
      phone_numbers: fields.phone_numbers && fields.phone_numbers.length > 0 ? confidence : undefined,
    };

    setOcrData(extractedData);
    setOcrConfidence(fieldConfidence);
    setOcrRawText(rawText);

    // Switch to manual tab to review/edit extracted data
    setActiveTab('manual');
  };

  const handleSubmit = async (data: Omit<ContactInsert, 'created_by' | 'id' | 'created_at' | 'updated_at'>) => {
    // Check for duplicates before creating
    try {
      const duplicateResults = await checkDuplicatesMutation.mutateAsync({
        full_name: data.full_name,
        email_addresses: data.email_addresses || [],
        phone_numbers: data.phone_numbers || [],
      });

      if (duplicateResults && duplicateResults.length > 0) {
        // Show duplicate warning dialog
        setPendingContact(data);
        setDuplicates(duplicateResults);
        setShowDuplicateDialog(true);
      } else {
        // No duplicates, proceed with creation
        createContact(data);
      }
    } catch (error) {
      // If duplicate check fails, proceed anyway
      console.error('Duplicate check failed:', error);
      createContact(data);
    }
  };

  const createContact = (data: Omit<ContactInsert, 'created_by' | 'id' | 'created_at' | 'updated_at'>) => {
    createMutation.mutate(data, {
      onSuccess: (newContact) => {
        // Navigate to the newly created contact
        navigate({ to: `/contacts/$contactId`, params: { contactId: newContact.id } });
      },
    });
  };

  const handleProceedDespiteDuplicates = () => {
    if (pendingContact) {
      createContact(pendingContact);
      setShowDuplicateDialog(false);
      setPendingContact(null);
      setDuplicates([]);
    }
  };

  const handleCancelCreation = () => {
    setShowDuplicateDialog(false);
    setPendingContact(null);
    setDuplicates([]);
  };

  // Handle document extraction complete
  const handleDocumentExtracted = (contacts: Partial<ContactInsert>[]) => {
    // Convert to EditableContact format with temporary IDs and all selected by default
    const editableContacts: EditableContact[] = contacts.map((contact, index) => ({
      ...contact,
      id: `temp-${Date.now()}-${index}`,
      selected: true,
    }));

    setExtractedContacts(editableContacts);
    setShowBatchReview(true);
  };

  // Handle batch import with duplicate detection
  const handleBatchImport = async (selectedContacts: EditableContact[]) => {
    // Check for duplicates in selected contacts
    const duplicateMap = new Map<string, DuplicateWarning[]>();
    let hasDuplicates = false;

    for (const contact of selectedContacts) {
      if (!contact.full_name || !contact.full_name.trim()) continue;

      try {
        const duplicateResults = await checkDuplicatesMutation.mutateAsync({
          full_name: contact.full_name,
          email_addresses: contact.email_addresses || [],
          phone_numbers: contact.phone_numbers || [],
        });

        if (duplicateResults && duplicateResults.length > 0) {
          duplicateMap.set(contact.id, duplicateResults);
          hasDuplicates = true;
        }
      } catch (error) {
        console.error('Duplicate check failed for contact:', contact.full_name, error);
        // Continue with other contacts even if one check fails
      }
    }

    if (hasDuplicates) {
      // Show duplicate warning dialog
      setBatchDuplicates(duplicateMap);
      setPendingBatchContacts(selectedContacts);
      setShowBatchDuplicateDialog(true);
    } else {
      // No duplicates, proceed with import
      await performBatchImport(selectedContacts);
    }
  };

  // Perform the actual batch import
  const performBatchImport = async (selectedContacts: EditableContact[]) => {
    // Remove temporary fields and prepare for batch create
    const contactsToCreate = selectedContacts.map(({ id, selected, ...contact }) => contact);

    try {
      const result = await batchCreateMutation.mutateAsync(contactsToCreate);

      // Navigate to contacts list after successful import
      navigate({ to: '/contacts' });
    } catch (error) {
      console.error('Batch import error:', error);
    }
  };

  // Handle proceeding with import despite duplicates
  const handleProceedWithBatchImport = async () => {
    setShowBatchDuplicateDialog(false);
    await performBatchImport(pendingBatchContacts);
    setBatchDuplicates(new Map());
    setPendingBatchContacts([]);
  };

  // Handle canceling batch import
  const handleCancelBatchImport = () => {
    setShowBatchDuplicateDialog(false);
    setBatchDuplicates(new Map());
    setPendingBatchContacts([]);
  };

  // Handle cancel batch review
  const handleCancelBatchReview = () => {
    setShowBatchReview(false);
    setExtractedContacts([]);
  };

  return (
    <>
      <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('contactDirectory.buttons.back')}
            </Button>

            <h1 className="text-2xl sm:text-3xl font-bold text-start">
              {t('contactDirectory.buttons.createContact')}
            </h1>
          </div>

          {/* Tabbed Interface */}
          {!showBatchReview && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'manual' | 'scan' | 'document')}>
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
                <TabsTrigger value="manual" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {t('contactDirectory.tabs.manual_entry')}
                </TabsTrigger>
                <TabsTrigger value="scan" className="gap-2">
                  <Scan className="h-4 w-4" />
                  {t('contactDirectory.tabs.scan_card')}
                </TabsTrigger>
                <TabsTrigger value="document" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t('contactDirectory.documentExtraction.batch_import_tab')}
                </TabsTrigger>
              </TabsList>

            {/* Manual Entry Tab */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contactDirectory.subtitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactForm
                    defaultValues={ocrData || undefined}
                    ocrConfidence={ocrConfidence}
                    ocrRawText={ocrRawText}
                    onSubmit={handleSubmit}
                    onCancel={handleBack}
                    isSubmitting={createMutation.isPending || checkDuplicatesMutation.isPending}
                    mode="create"
                  />
                </CardContent>
              </Card>
            </TabsContent>

              {/* Business Card Scan Tab */}
              <TabsContent value="scan">
                <BusinessCardScanner
                  onExtracted={handleOCRExtracted}
                  onCancel={() => setActiveTab('manual')}
                />
              </TabsContent>

              {/* Document Extraction Tab */}
              <TabsContent value="document">
                <DocumentExtractor
                  onExtracted={handleDocumentExtracted}
                  onCancel={() => setActiveTab('manual')}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Batch Contact Review */}
          {showBatchReview && (
            <BatchContactReview
              contacts={extractedContacts}
              onContactsChange={setExtractedContacts}
              onImport={handleBatchImport}
              onCancel={handleCancelBatchReview}
              isImporting={batchCreateMutation.isPending}
            />
          )}
        </div>
      </div>

      {/* Single Contact Duplicate Warning Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {t('contactDirectory.duplicates.dialog_title')}
            </DialogTitle>
            <DialogDescription className="text-start">
              {t('contactDirectory.duplicates.dialog_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {duplicates.map((dup) => (
              <Card key={dup.contact_id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-start">{dup.full_name}</h4>
                      {dup.organization_name && (
                        <p className="text-sm text-muted-foreground text-start">{dup.organization_name}</p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-yellow-600">
                      {dup.match_score}% {t('contactDirectory.duplicates.match')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dup.match_reasons.map((reason) => (
                      <span
                        key={reason}
                        className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800"
                      >
                        {t(`contactDirectory.duplicates.reasons.${reason}`)}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: `/contacts/$contactId`, params: { contactId: dup.contact_id } })}
                    className="mt-2"
                  >
                    {t('contactDirectory.duplicates.view_contact')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleCancelCreation} className="h-11 sm:h-10">
              {t('contactDirectory.duplicates.cancel')}
            </Button>
            <Button onClick={handleProceedDespiteDuplicates} className="h-11 sm:h-10">
              {t('contactDirectory.duplicates.proceed_anyway')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Import Duplicate Warning Dialog */}
      <Dialog open={showBatchDuplicateDialog} onOpenChange={setShowBatchDuplicateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {t('contactDirectory.duplicates.dialog_title')} ({batchDuplicates.size} {t('contactDirectory.documentExtraction.contacts_found')})
            </DialogTitle>
            <DialogDescription className="text-start">
              {t('contactDirectory.duplicates.dialog_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {Array.from(batchDuplicates.entries()).map(([contactId, duplicates]) => {
              const contact = pendingBatchContacts.find((c) => c.id === contactId);
              if (!contact) return null;

              return (
                <Card key={contactId} className="border-yellow-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-start">
                      {contact.full_name}
                    </CardTitle>
                    {contact.organization_id && (
                      <p className="text-sm text-muted-foreground text-start">
                        {/* Organization name would need to be resolved */}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {duplicates.map((dup) => (
                      <Card key={dup.contact_id} className="p-3 bg-yellow-50">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-start">{dup.full_name}</h4>
                              {dup.organization_name && (
                                <p className="text-xs text-muted-foreground text-start">{dup.organization_name}</p>
                              )}
                            </div>
                            <div className="text-sm font-medium text-yellow-600">
                              {dup.match_score}% {t('contactDirectory.duplicates.match')}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {dup.match_reasons.map((reason) => (
                              <span
                                key={reason}
                                className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800"
                              >
                                {t(`contactDirectory.duplicates.reasons.${reason}`)}
                              </span>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Open in new tab to review
                              window.open(`/contacts/${dup.contact_id}`, '_blank');
                            }}
                            className="mt-2"
                          >
                            {t('contactDirectory.duplicates.view_contact')}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleCancelBatchImport} className="h-11 sm:h-10">
              {t('contactDirectory.duplicates.cancel')}
            </Button>
            <Button onClick={handleProceedWithBatchImport} disabled={batchCreateMutation.isPending} className="h-11 sm:h-10">
              {batchCreateMutation.isPending ? (
                <>
                  <div className={`animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('contactDirectory.documentExtraction.importing')}
                </>
              ) : (
                t('contactDirectory.duplicates.proceed_anyway')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
