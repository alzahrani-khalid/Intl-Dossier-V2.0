import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Download,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileWarning,
  Loader2,
} from 'lucide-react';
import { DocumentUploader } from '@/components/DocumentUploader';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { formatBytes } from '@/lib/utils';

interface EntityDocumentsTabProps {
  ownerType: string;
  ownerId: string;
}

interface Document {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  scan_status: 'pending' | 'clean' | 'infected';
  sensitivity_level: 'public' | 'internal' | 'confidential' | 'secret';
  version_number: number;
  tags: string[];
  storage_path: string;
}

const scanStatusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100', icon: Clock },
  clean: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', icon: CheckCircle2 },
  infected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', icon: AlertCircle },
};

const sensitivityLevelConfig = {
  public: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  internal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
  confidential: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  secret: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

const mimeTypeIcons: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/': FileText,
  'video/': FileText,
  'text/': FileText,
  default: FileText,
};

function getMimeIcon(mimeType: string) {
  const match = Object.keys(mimeTypeIcons).find((key) => mimeType.startsWith(key));
  return match ? mimeTypeIcons[match] : mimeTypeIcons.default;
}

export function EntityDocumentsTab({ ownerType, ownerId }: EntityDocumentsTabProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [latestOnly, setLatestOnly] = useState(true);
  const [scanStatusFilter, setScanStatusFilter] = useState<string>('all');
  const [showUploader, setShowUploader] = useState(false);

  // Fetch documents
  const { data: documents, isLoading, error } = useDocuments(ownerType, ownerId, {
    latest_only: latestOnly,
    scan_status: scanStatusFilter === 'all' ? undefined : scanStatusFilter,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', ownerType, ownerId] });
      toast({
        title: t('documents.delete.success_title'),
        description: t('documents.delete.success_description'),
      });
    },
    onError: (error) => {
      toast({
        title: t('documents.delete.error_title'),
        description: error instanceof Error ? error.message : t('common.error.unknown'),
        variant: 'destructive',
      });
    },
  });

  // Download handler
  const handleDownload = async (document: Document) => {
    try {
      // Get signed URL from Supabase Storage
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
      const { url } = await response.json();

      // Trigger download
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      link.click();
    } catch (error) {
      toast({
        title: t('documents.download.error_title'),
        description: error instanceof Error ? error.message : t('common.error.unknown'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-start">
            {t('documents.tab.title')}
          </h2>
          <p className="text-sm text-muted-foreground text-start">
            {t('documents.tab.description')}
          </p>
        </div>
        <Button
          onClick={() => setShowUploader(!showUploader)}
          className="w-full sm:w-auto"
        >
          <Upload className="h-4 w-4 me-2" />
          {t('documents.upload.button')}
        </Button>
      </div>

      {/* Upload Section */}
      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-start">
              {t('documents.upload.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUploader
              ownerType={ownerType}
              ownerId={ownerId}
              onUploadComplete={() => {
                setShowUploader(false);
                queryClient.invalidateQueries({ queryKey: ['documents', ownerType, ownerId] });
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Latest Only Toggle */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="latest-only" className="text-sm font-medium text-start cursor-pointer">
                {t('documents.filter.latest_only')}
              </Label>
              <Switch
                id="latest-only"
                checked={latestOnly}
                onCheckedChange={setLatestOnly}
              />
            </div>

            {/* Scan Status Filter */}
            <div>
              <Label className="text-sm font-medium text-start block mb-2">
                {t('documents.filter.scan_status')}
              </Label>
              <Select value={scanStatusFilter} onValueChange={setScanStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.filter.all_statuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('documents.filter.all_statuses')}</SelectItem>
                  <SelectItem value="pending">{t('documents.scan_status.pending')}</SelectItem>
                  <SelectItem value="clean">{t('documents.scan_status.clean')}</SelectItem>
                  <SelectItem value="infected">{t('documents.scan_status.infected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-start">
            {t('documents.list.title', { count: documents?.length || 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-destructive">
              <AlertCircle className="h-5 w-5 me-2" />
              <span className="text-sm">
                {error instanceof Error ? error.message : t('documents.list.error')}
              </span>
            </div>
          ) : documents && documents.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {documents.map((doc) => {
                  const Icon = getMimeIcon(doc.mime_type);
                  const ScanIcon = scanStatusConfig[doc.scan_status].icon;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate text-start">{doc.file_name}</p>
                          {doc.version_number > 1 && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              v{doc.version_number}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBytes(doc.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString(i18n.language)}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={scanStatusConfig[doc.scan_status].color}>
                            <ScanIcon className="h-3 w-3 me-1" />
                            {t(`documents.scan_status.${doc.scan_status}`)}
                          </Badge>
                          <Badge className={sensitivityLevelConfig[doc.sensitivity_level]}>
                            {t(`documents.sensitivity.${doc.sensitivity_level}`)}
                          </Badge>
                          {doc.tags && doc.tags.length > 0 && (
                            <Badge variant="outline">{doc.tags[0]}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          className="h-8 w-8"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {t('documents.list.empty')}
              </p>
              <Button
                variant="link"
                onClick={() => setShowUploader(true)}
                className="mt-2"
              >
                {t('documents.upload.first_document')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
