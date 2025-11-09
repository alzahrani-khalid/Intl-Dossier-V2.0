import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
 AlertCircle,
 FileText,
 Download,
 X,
 Clock,
 User,
 Tag,
 Shield,
 Loader2,
 FileCode,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface DocumentVersionComparisonProps {
 documentId: string;
 compareToVersionId: string;
 onClose: () => void;
}

interface DocumentVersion {
 id: string;
 file_name: string;
 mime_type: string;
 file_size: number;
 uploaded_by: string;
 uploaded_at: string;
 document_type: string;
 sensitivity_level: string;
 tags: string[];
 version_number: number;
 scan_status: string;
 storage_path: string;
}

export function DocumentVersionComparison({
 documentId,
 compareToVersionId,
 onClose,
}: DocumentVersionComparisonProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 // Fetch both document versions
 const { data: currentDoc, isLoading: loadingCurrent } = useQuery({
 queryKey: ['document', documentId],
 queryFn: async () => {
 const response = await fetch(`/api/documents/${documentId}`);
 if (!response.ok) throw new Error('Failed to fetch document');
 return response.json() as Promise<DocumentVersion>;
 },
 });

 const { data: compareDoc, isLoading: loadingCompare } = useQuery({
 queryKey: ['document', compareToVersionId],
 queryFn: async () => {
 const response = await fetch(`/api/documents/${compareToVersionId}`);
 if (!response.ok) throw new Error('Failed to fetch comparison document');
 return response.json() as Promise<DocumentVersion>;
 },
 });

 const isLoading = loadingCurrent || loadingCompare;
 const isBinary = currentDoc && !['application/pdf', 'text/plain', 'text/markdown', 'text/html'].includes(currentDoc.mime_type);

 const handleDownload = async (doc: DocumentVersion) => {
 try {
 const response = await fetch(`/api/documents/${doc.id}/download`);
 if (!response.ok) throw new Error('Failed to get download URL');
 const { url } = await response.json();

 const link = window.document.createElement('a');
 link.href = url;
 link.download = doc.file_name;
 link.click();
 } catch (error) {
 console.error('Download failed:', error);
 }
 };

 const renderMetadataRow = (label: string, value1: string | number, value2: string | number, icon: typeof FileText) => {
 const Icon = icon;
 const isDifferent = value1 !== value2;

 return (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3">
 <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
 <Icon className="h-4 w-4" />
 {label}
 </div>
 <div className={`text-sm text-start ${isDifferent ? 'font-medium text-orange-600 dark:text-orange-400' : ''}`}>
 {value1}
 </div>
 <div className={`text-sm text-start ${isDifferent ? 'font-medium text-orange-600 dark:text-orange-400' : ''}`}>
 {value2}
 </div>
 </div>
 );
 };

 return (
 <Card className="w-full max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
 <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
 <CardTitle className="text-base sm:text-lg text-start">
 {t('documents.comparison.title')}
 </CardTitle>
 <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 self-end sm:self-auto">
 <X className="h-4 w-4" />
 </Button>
 </CardHeader>

 <CardContent className="space-y-6">
 {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
 </div>
 ) : !currentDoc || !compareDoc ? (
 <div className="flex items-center justify-center py-12 text-destructive">
 <AlertCircle className="h-5 w-5 me-2" />
 <span className="text-sm">{t('documents.comparison.error_loading')}</span>
 </div>
 ) : (
 <>
 {/* Header Row */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="text-sm font-medium text-muted-foreground">
 {t('documents.comparison.metadata')}
 </div>
 <div className="space-y-1">
 <p className="text-sm font-semibold text-start">
 {t('documents.comparison.version', { number: currentDoc.version_number })}
 </p>
 <Badge variant="outline" className="text-xs">
 {t('documents.comparison.current')}
 </Badge>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-semibold text-start">
 {t('documents.comparison.version', { number: compareDoc.version_number })}
 </p>
 <Badge variant="outline" className="text-xs">
 {t('documents.comparison.comparing')}
 </Badge>
 </div>
 </div>

 <Separator />

 {/* Metadata Comparison */}
 <ScrollArea className="h-96">
 <div className="divide-y">
 {renderMetadataRow(
 t('documents.comparison.file_name'),
 currentDoc.file_name,
 compareDoc.file_name,
 FileText
 )}
 {renderMetadataRow(
 t('documents.comparison.file_size'),
 formatBytes(currentDoc.file_size),
 formatBytes(compareDoc.file_size),
 FileCode
 )}
 {renderMetadataRow(
 t('documents.comparison.uploaded_date'),
 new Date(currentDoc.uploaded_at).toLocaleString(i18n.language),
 new Date(compareDoc.uploaded_at).toLocaleString(i18n.language),
 Clock
 )}
 {renderMetadataRow(
 t('documents.comparison.uploaded_by'),
 currentDoc.uploaded_by,
 compareDoc.uploaded_by,
 User
 )}
 {renderMetadataRow(
 t('documents.comparison.document_type'),
 t(`documents.type.${currentDoc.document_type}`),
 t(`documents.type.${compareDoc.document_type}`),
 FileText
 )}
 {renderMetadataRow(
 t('documents.comparison.sensitivity'),
 t(`documents.sensitivity.${currentDoc.sensitivity_level}`),
 t(`documents.sensitivity.${compareDoc.sensitivity_level}`),
 Shield
 )}
 {renderMetadataRow(
 t('documents.comparison.scan_status'),
 t(`documents.scan_status.${currentDoc.scan_status}`),
 t(`documents.scan_status.${compareDoc.scan_status}`),
 AlertCircle
 )}

 {/* Tags Row */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3">
 <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
 <Tag className="h-4 w-4" />
 {t('documents.comparison.tags')}
 </div>
 <div className="flex flex-wrap gap-1">
 {currentDoc.tags?.map((tag, idx) => (
 <Badge key={idx} variant="secondary" className="text-xs">
 {tag}
 </Badge>
 )) || <span className="text-xs text-muted-foreground">{t('documents.comparison.no_tags')}</span>}
 </div>
 <div className="flex flex-wrap gap-1">
 {compareDoc.tags?.map((tag, idx) => (
 <Badge key={idx} variant="secondary" className="text-xs">
 {tag}
 </Badge>
 )) || <span className="text-xs text-muted-foreground">{t('documents.comparison.no_tags')}</span>}
 </div>
 </div>
 </div>
 </ScrollArea>

 <Separator />

 {/* Binary Warning or Text Diff */}
 {isBinary ? (
 <div className="rounded-md bg-muted/50 p-6 text-center">
 <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
 <p className="text-sm font-medium mb-2">
 {t('documents.comparison.binary_warning_title')}
 </p>
 <p className="text-xs text-muted-foreground">
 {t('documents.comparison.binary_warning_description')}
 </p>
 </div>
 ) : (
 <div className="rounded-md bg-muted/50 p-6">
 <p className="text-sm text-muted-foreground text-center">
 {t('documents.comparison.text_diff_placeholder')}
 </p>
 </div>
 )}

 {/* Download Buttons */}
 <div className="flex flex-col sm:flex-row gap-3">
 <Button
 variant="outline"
 onClick={() => handleDownload(currentDoc)}
 className="w-full sm:w-1/2"
 >
 <Download className="h-4 w-4 me-2" />
 {t('documents.comparison.download_current')}
 </Button>
 <Button
 variant="outline"
 onClick={() => handleDownload(compareDoc)}
 className="w-full sm:w-1/2"
 >
 <Download className="h-4 w-4 me-2" />
 {t('documents.comparison.download_compare')}
 </Button>
 </div>
 </>
 )}
 </CardContent>
 </Card>
 );
}
