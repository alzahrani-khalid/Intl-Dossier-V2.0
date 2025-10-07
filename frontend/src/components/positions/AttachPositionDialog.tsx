/**
 * AttachPositionDialog Component (T046)
 * Searchable dialog for attaching positions to engagements
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Link2, Eye, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePositions } from '@/hooks/usePositions';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { Position } from '@/types/position';

export interface AttachPositionDialogProps {
  engagementId: string;
  dossierId: string;
  onAttach: (positionIds: string[]) => Promise<void>;
  attachedPositionIds?: string[];
  trigger?: React.ReactNode;
  maxSelections?: number;
}

export const AttachPositionDialog: React.FC<AttachPositionDialogProps> = ({
  engagementId,
  dossierId,
  onAttach,
  attachedPositionIds = [],
  trigger,
  maxSelections = 100,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language === 'ar' ? ar : enUS;

  // Dialog state
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewPosition, setPreviewPosition] = useState<Position | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);

  // Debounced search
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Fetch positions for this dossier
  const { data: positionsData, isLoading } = usePositions({
    dossierId,
    status: 'published',
  });
  const positions = positionsData?.positions || [];

  // Filter positions
  const filteredPositions = useMemo(() => {
    let filtered = positions.filter((p) => !attachedPositionIds.includes(p.id));

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((position) => {
        const title = i18n.language === 'ar' ? position.title_ar : position.title_en;
        const content = i18n.language === 'ar' ? position.content_ar : position.content_en;
        return (
          title.toLowerCase().includes(searchLower) ||
          content?.toLowerCase().includes(searchLower) ||
          position.thematic_category?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [positions, debouncedSearch, attachedPositionIds, i18n.language]);

  // Get localized position title
  const getPositionTitle = (position: Position) => {
    return i18n.language === 'ar' ? position.title_ar : position.title_en;
  };

  // Get localized position content
  const getPositionContent = (position: Position) => {
    return i18n.language === 'ar' ? position.content_ar : position.content_en;
  };

  // Handle selection toggle
  const toggleSelection = (positionId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(positionId)) {
        return prev.filter((id) => id !== positionId);
      } else {
        if (prev.length >= maxSelections) {
          return prev;
        }
        return [...prev, positionId];
      }
    });
  };

  // Handle attach
  const handleAttach = async () => {
    if (selectedIds.length === 0) return;

    setIsAttaching(true);
    try {
      await onAttach(selectedIds);
      setSelectedIds([]);
      setSearchInput('');
      setPreviewPosition(null);
      setOpen(false);
    } catch (error) {
      console.error('Failed to attach positions:', error);
    } finally {
      setIsAttaching(false);
    }
  };

  // Reset on close
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setSelectedIds([]);
      setSearchInput('');
      setPreviewPosition(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Link2 className="me-2 h-4 w-4" />
            {t('positions.attach.dialogTrigger')}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-6xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{t('positions.attach.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('positions.attach.dialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex h-[70vh] gap-4 p-6 pt-4">
          {/* Left Panel: Search & List */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`}
              />
              <Input
                type="search"
                placeholder={t('positions.attach.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={isRTL ? 'pe-10' : 'ps-10'}
                autoFocus
              />
            </div>

            {/* Selection Info */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm">
              <span>
                {t('positions.attach.selected', {
                  count: selectedIds.length,
                  max: maxSelections,
                })}
              </span>
              {selectedIds.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                  {t('positions.attach.clearSelection')}
                </Button>
              )}
            </div>

            {/* Warning for max selections */}
            {selectedIds.length >= maxSelections && (
              <Alert>
                <AlertDescription>
                  {t('positions.attach.maxSelectionsReached', { max: maxSelections })}
                </AlertDescription>
              </Alert>
            )}

            {/* Positions List */}
            <ScrollArea className="flex-1 rounded-lg border">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">{t('positions.loading')}</p>
                  </div>
                </div>
              ) : filteredPositions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-center text-muted-foreground">
                    {debouncedSearch
                      ? t('positions.attach.noResults')
                      : t('positions.attach.allAttached')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredPositions.map((position) => {
                    const isSelected = selectedIds.includes(position.id);
                    const isPreviewed = previewPosition?.id === position.id;

                    return (
                      <div
                        key={position.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                          isPreviewed ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Checkbox */}
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(position.id)}
                          disabled={!isSelected && selectedIds.length >= maxSelections}
                          aria-label={t('positions.attach.selectLabel', {
                            title: getPositionTitle(position),
                          })}
                        />

                        {/* Position Info */}
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium leading-tight" dir={isRTL ? 'rtl' : 'ltr'}>
                            {getPositionTitle(position)}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{t(`positions.type.${position.position_type_id}`)}</Badge>
                            {position.thematic_category && (
                              <Badge variant="outline">{position.thematic_category}</Badge>
                            )}
                            <span>{format(new Date(position.created_at), 'PP', { locale })}</span>
                          </div>
                        </div>

                        {/* Preview Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewPosition(position)}
                          aria-label={t('positions.attach.previewLabel', {
                            title: getPositionTitle(position),
                          })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel: Preview */}
          <div className="w-[400px] rounded-lg border bg-muted/20">
            {previewPosition ? (
              <div className="flex h-full flex-col">
                {/* Preview Header */}
                <div className="flex items-start justify-between border-b p-4">
                  <h3 className="font-semibold" dir={isRTL ? 'rtl' : 'ltr'}>
                    {t('positions.attach.previewTitle')}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewPosition(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview Content */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-1 text-lg font-semibold" dir={isRTL ? 'rtl' : 'ltr'}>
                        {getPositionTitle(previewPosition)}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{t(`positions.status.${previewPosition.status}`)}</Badge>
                        <Badge variant="outline">
                          {t(`positions.type.${previewPosition.position_type_id}`)}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-1 text-sm font-medium">{t('positions.attach.content')}</p>
                      <p
                        className="whitespace-pre-wrap text-sm text-muted-foreground"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        {getPositionContent(previewPosition)}
                      </p>
                    </div>

                    {previewPosition.key_messages && (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-1 text-sm font-medium">{t('positions.attach.keyMessages')}</p>
                          <p className="text-sm text-muted-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
                            {previewPosition.key_messages}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick Select */}
                <div className="border-t p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => toggleSelection(previewPosition.id)}
                    disabled={
                      !selectedIds.includes(previewPosition.id) && selectedIds.length >= maxSelections
                    }
                  >
                    {selectedIds.includes(previewPosition.id) ? (
                      <>
                        <Check className="me-2 h-4 w-4" />
                        {t('positions.attach.selected')}
                      </>
                    ) : (
                      <>
                        <Link2 className="me-2 h-4 w-4" />
                        {t('positions.attach.selectThis')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div className="space-y-2">
                  <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('positions.attach.previewEmpty')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isAttaching}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAttach} disabled={selectedIds.length === 0 || isAttaching}>
            {isAttaching ? (
              <>
                <div className="me-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('positions.attach.attaching')}
              </>
            ) : (
              <>
                <Link2 className="me-2 h-4 w-4" />
                {t('positions.attach.attachSelected', { count: selectedIds.length })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
