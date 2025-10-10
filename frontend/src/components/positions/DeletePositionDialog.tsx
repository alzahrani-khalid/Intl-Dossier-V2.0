import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DeletePositionDialogProps {
  positionId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface PositionDossierLink {
  id: string;
  dossier_id: string;
  dossier_name_en: string;
  dossier_name_ar: string;
  link_type: 'primary' | 'related' | 'reference';
}

export function DeletePositionDialog({ positionId, isOpen, onClose, onConfirm }: DeletePositionDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();

  const [understood, setUnderstood] = useState(false);

  // Reset checkbox when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setUnderstood(false);
    }
  }, [isOpen]);

  // Query linked dossiers
  const { data: linkedDossiers, isLoading } = useQuery({
    queryKey: ['position-dossier-links', positionId],
    queryFn: async () => {
      const response = await fetch(`/api/positions/${positionId}/dossiers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch linked dossiers: ${response.statusText}`);
      }
      const data = await response.json();
      return data.links as PositionDossierLink[];
    },
    enabled: isOpen && !!positionId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete position: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      toast({
        title: t('positions.delete.success_title'),
        description: t('positions.delete.success_description'),
      });
      onConfirm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: t('positions.delete.error_title'),
        description: error instanceof Error ? error.message : t('common.error.unknown'),
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const linkCount = linkedDossiers?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-start">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('positions.delete.title')}
          </DialogTitle>
          <DialogDescription className="text-start">
            {linkCount > 0
              ? t('positions.delete.description_with_links', { count: linkCount })
              : t('positions.delete.description_no_links')}
          </DialogDescription>
        </DialogHeader>

        {/* Show loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Show linked dossiers */}
        {!isLoading && linkedDossiers && linkCount > 0 && (
          <div className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive text-start">
                {t('positions.delete.warning')}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-start block">
                {t('positions.delete.affected_dossiers', { count: linkCount })}
              </Label>
              <ScrollArea className="h-48 rounded-md border p-4">
                <div className="space-y-2">
                  {linkedDossiers.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-start gap-2 rounded-md bg-muted/50 p-3"
                    >
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-start">
                          {isRTL ? link.dossier_name_ar : link.dossier_name_en}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {t(`positions.link_type.${link.link_type}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Confirmation checkbox */}
            <div className="flex items-start gap-3 rounded-md border p-4 bg-background">
              <Checkbox
                id="understand-delete"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked === true)}
                className="mt-1"
              />
              <Label
                htmlFor="understand-delete"
                className="text-sm font-normal cursor-pointer text-start leading-normal"
              >
                {t('positions.delete.confirmation_checkbox')}
              </Label>
            </div>
          </div>
        )}

        {/* No links case */}
        {!isLoading && linkCount === 0 && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              {t('positions.delete.no_links_message')}
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={
              deleteMutation.isPending ||
              (linkCount > 0 && !understood) ||
              isLoading
            }
            className="w-full sm:w-auto"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {t('common.deleting')}
              </>
            ) : (
              t('positions.delete.confirm_button')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
