import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FileSignature, Shield, ExternalLink, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
 id: string;
 title: string;
 type: 'position' | 'mou' | 'brief';
 created_at: string;
 updated_at?: string;
 clearance_level?: number;
}

interface DocumentListProps {
 documents: Document[];
 onRemoveDocument?: (documentId: string, documentType: 'position' | 'mou' | 'brief') => Promise<void>;
 onViewDocument?: (documentId: string, documentType: 'position' | 'mou' | 'brief') => void;
 isLoading?: boolean;
}

/**
 * Component for displaying linked documents with mobile-first responsive design.
 * Supports document removal and viewing with RTL support.
 */
export function DocumentList({
 documents,
 onRemoveDocument,
 onViewDocument,
 isLoading = false,
}: DocumentListProps) {
 const { t, i18n } = useTranslation('dossier');
 const isRTL = i18n.language === 'ar';

 // Get icon based on document type
 const getDocumentIcon = (type: 'position' | 'mou' | 'brief') => {
 switch (type) {
 case 'position':
 return <FileText className="h-5 w-5 sm:h-6 sm:w-6" />;
 case 'mou':
 return <FileSignature className="h-5 w-5 sm:h-6 sm:w-6" />;
 case 'brief':
 return <Shield className="h-5 w-5 sm:h-6 sm:w-6" />;
 }
 };

 // Get badge color based on document type
 const getTypeColor = (type: 'position' | 'mou' | 'brief') => {
 switch (type) {
 case 'position':
 return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
 case 'mou':
 return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
 case 'brief':
 return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
 }
 };

 if (isLoading) {
 return (
 <div className="flex items-center justify-center py-8">
 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
 </div>
 );
 }

 if (documents.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
 <FileText className="h-12 w-12 text-muted-foreground" />
 <p className="text-sm text-muted-foreground sm:text-base">
 {t('document.noLinkedDocuments')}
 </p>
 </div>
 );
 }

 return (
 <div
 className="flex flex-col gap-4"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {documents.map((doc) => (
 <Card key={doc.id} className="overflow-hidden">
 <CardContent className="p-4 sm:p-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 {/* Document Info */}
 <div className="flex flex-1 gap-3 sm:gap-4">
 {/* Icon */}
 <div className="flex-shrink-0 text-muted-foreground">
 {getDocumentIcon(doc.type)}
 </div>

 {/* Details */}
 <div className="flex min-w-0 flex-1 flex-col gap-2">
 {/* Title and Type Badge */}
 <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
 <h3 className="truncate text-base font-semibold sm:text-lg">
 {doc.title}
 </h3>
 <Badge
 variant="secondary"
 className={`w-fit text-xs sm:text-sm ${getTypeColor(doc.type)}`}
 >
 {t(`document.types.${doc.type}`)}
 </Badge>
 </div>

 {/* Metadata */}
 <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:text-sm">
 <div>
 {t('document.created')}: {format(new Date(doc.created_at), 'PPp')}
 </div>
 {doc.clearance_level && (
 <div className="flex items-center gap-1">
 <Shield className="h-3 w-3" />
 {t('document.clearanceLevel', { level: doc.clearance_level })}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-2 sm:flex-shrink-0">
 {onViewDocument && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => onViewDocument(doc.id, doc.type)}
 className="min-h-9 flex-1 sm:flex-none"
 >
 <ExternalLink className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
 <span className="sm:inline">{t('common.view')}</span>
 </Button>
 )}
 {onRemoveDocument && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => onRemoveDocument(doc.id, doc.type)}
 className="min-h-9 flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
 >
 <Trash2 className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
 <span className="sm:inline">{t('common.remove')}</span>
 </Button>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 );
}
