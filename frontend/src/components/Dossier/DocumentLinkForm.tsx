import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface DocumentLinkFormProps {
 dossierId: string;
 onSubmit: (documentId: string, documentType: 'position' | 'mou' | 'brief') => Promise<void>;
 onCancel?: () => void;
 availableDocuments: Array<{
 id: string;
 title: string;
 type: 'position' | 'mou' | 'brief';
 }>;
}

/**
 * Form component for linking documents to dossiers.
 * Supports positions, MOUs, and intelligence briefs with mobile-first responsive design.
 */
export function DocumentLinkForm({
 dossierId,
 onSubmit,
 onCancel,
 availableDocuments,
}: DocumentLinkFormProps) {
 const { t, i18n } = useTranslation('dossier');
 const isRTL = i18n.language === 'ar';

 const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
 const [documentType, setDocumentType] = useState<'position' | 'mou' | 'brief'>('position');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Filter documents by selected type
 const filteredDocuments = availableDocuments.filter((doc) => doc.type === documentType);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!selectedDocumentId) {
 setError(t('document.selectDocument'));
 return;
 }

 setIsSubmitting(true);
 setError(null);

 try {
 await onSubmit(selectedDocumentId, documentType);
 setSelectedDocumentId('');
 setError(null);
 } catch (err) {
 setError(err instanceof Error ? err.message : t('document.linkError'));
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <form
 onSubmit={handleSubmit}
 className="flex flex-col gap-4 sm:gap-6"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {/* Document Type Selection */}
 <div className="flex flex-col gap-2">
 <Label htmlFor="documentType" className="text-sm sm:text-base">
 {t('document.type')}
 </Label>
 <Select
 value={documentType}
 onValueChange={(value) => {
 setDocumentType(value as 'position' | 'mou' | 'brief');
 setSelectedDocumentId(''); // Reset selection when type changes
 }}
 >
 <SelectTrigger id="documentType" className=" w-full">
 <SelectValue placeholder={t('document.selectType')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="position">{t('document.types.position')}</SelectItem>
 <SelectItem value="mou">{t('document.types.mou')}</SelectItem>
 <SelectItem value="brief">{t('document.types.brief')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Document Selection */}
 <div className="flex flex-col gap-2">
 <Label htmlFor="document" className="text-sm sm:text-base">
 {t('document.select')}
 </Label>
 <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
 <SelectTrigger id="document" className=" w-full">
 <SelectValue placeholder={t('document.selectDocument')} />
 </SelectTrigger>
 <SelectContent>
 {filteredDocuments.length === 0 ? (
 <div className="px-4 py-2 text-sm text-muted-foreground">
 {t('document.noDocuments')}
 </div>
 ) : (
 filteredDocuments.map((doc) => (
 <SelectItem key={doc.id} value={doc.id}>
 {doc.title}
 </SelectItem>
 ))
 )}
 </SelectContent>
 </Select>
 </div>

 {/* Error Message */}
 {error && (
 <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
 {error}
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4">
 {onCancel && (
 <Button
 type="button"
 variant="outline"
 onClick={onCancel}
 disabled={isSubmitting}
 className=" w-full sm:w-auto"
 >
 {t('common.cancel')}
 </Button>
 )}
 <Button
 type="submit"
 disabled={isSubmitting || !selectedDocumentId}
 className=" w-full sm:w-auto"
 >
 {isSubmitting ? (
 <>
 <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('document.linking')}
 </>
 ) : (
 t('document.linkDocument')
 )}
 </Button>
 </div>
 </form>
 );
}
