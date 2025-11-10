/**
 * Documents Section Component (Feature 028 - T060)
 *
 * Displays polymorphic documents attached to any entity type/entity_id.
 * Reusable across all 6 dossier types. Mobile-first with file upload and RTL support.
 *
 * @example
 * ```tsx
 * <Documents entityType="dossier" entityId={dossier.id} />
 * ```
 */

import { useTranslation } from 'react-i18next';
import { FileText, Upload, Download, Eye, Trash2, Calendar, FileType } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, memo, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Document {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  uploaded_by?: string;
}

interface DocumentsProps {
  /**
   * Entity type (e.g., 'dossier', 'position', 'mou')
   */
  entityType: string;
  /**
   * Entity ID
   */
  entityId: string;
  /**
   * Optional filter by MIME type
   */
  mimeTypeFilter?: string;
  /**
   * Allow file upload
   */
  allowUpload?: boolean;
  /**
   * Allow file delete
   */
  allowDelete?: boolean;
  /**
   * Optional CSS class for container
   */
  className?: string;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date in localized format
 */
function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get icon for MIME type
 */
function getFileTypeIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith('image/')) return <FileType className="h-4 w-4 text-blue-500" />;
  if (mimeType.startsWith('application/pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText className="h-4 w-4 text-blue-600" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileText className="h-4 w-4 text-green-600" />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <FileText className="h-4 w-4 text-orange-500" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

/**
 * Document card component (memoized for performance)
 */
const DocumentCard = memo(
  ({
    document: doc,
    isRTL,
    locale,
    allowDelete,
    onDelete,
    onDownload,
  }: {
    document: Document;
    isRTL: boolean;
    locale: string;
    allowDelete: boolean;
    onDelete: (id: string) => void;
    onDownload: (doc: Document) => void;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2">
              {getFileTypeIcon(doc.mime_type)}
              <h4 className="text-sm sm:text-base font-semibold text-foreground break-all">{doc.file_name}</h4>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {formatFileSize(doc.size_bytes)}
              </Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                {formatDate(doc.uploaded_at, locale)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(doc)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'تحميل' : 'Download'}</span>
            </Button>
            {allowDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(doc.id)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
);
DocumentCard.displayName = 'DocumentCard';

/**
 * Shared Documents Section Component
 *
 * Displays documents for any entity type with upload/delete capabilities
 */
export function Documents({
  entityType,
  entityId,
  mimeTypeFilter,
  allowUpload = false,
  allowDelete = false,
  className = '',
}: DocumentsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', entityType, entityId, mimeTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (mimeTypeFilter) {
        query = query.eq('mime_type', mimeTypeFilter);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = useCallback((id: string) => {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  }, [documentToDelete, deleteMutation]);

  // Handle document download
  const handleDownload = useCallback(async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.file_path);
      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 sm:py-16 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!documents || documents.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 sm:py-12 text-center ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('section.documentsEmpty')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('section.documentsEmptyDescription')}
        </p>

        {allowUpload && (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 me-2" />
            {t('actions.uploadDocument')}
          </Button>
        )}
      </div>
    );
  }

  // Documents list
  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Upload button */}
      {allowUpload && (
        <div className="mb-4 sm:mb-6">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Upload className="h-4 w-4 me-2" />
            {t('actions.uploadDocument')}
          </Button>
        </div>
      )}

      {/* Documents grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            isRTL={isRTL}
            locale={i18n.language}
            allowDelete={allowDelete}
            onDelete={handleDeleteClick}
            onDownload={handleDownload}
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteDocument.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogs.deleteDocument.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
