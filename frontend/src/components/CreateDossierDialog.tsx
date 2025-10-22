/**
 * CreateDossierDialog Component
 *
 * Bilingual form dialog for creating new dossiers
 * Uses shadcn/ui components with i18n support
 * Integrates with useCreateDossier hook for mutations
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateDossier } from '../hooks/useCreateDossier';
import type { DossierCreate, DossierType, SensitivityLevel } from '../types/dossier';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

interface CreateDossierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDossierDialog({ open, onOpenChange }: CreateDossierDialogProps) {
  const { t } = useTranslation('dossiers');
  const createMutation = useCreateDossier();

  const [formData, setFormData] = useState<DossierCreate>({
    name_en: '',
    name_ar: '',
    type: 'country',
    sensitivity_level: 'low',
    summary_en: '',
    summary_ar: '',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync(formData);
      // Reset form and close dialog
      setFormData({
        name_en: '',
        name_ar: '',
        type: 'country',
        sensitivity_level: 'low',
        summary_en: '',
        summary_ar: '',
        tags: [],
      });
      setTagInput('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
      console.error('Create dossier error:', error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('create')}</DialogTitle>
          <DialogDescription>
            {t('hub.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {createMutation.isError && (
            <Alert variant="destructive">
              <p className="text-sm">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : t('errors.createFailed')}
              </p>
            </Alert>
          )}

          {/* Dossier Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              {t('fields.type')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: DossierType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="country">{t('types.country')}</SelectItem>
                <SelectItem value="organization">{t('types.organization')}</SelectItem>
                <SelectItem value="forum">{t('types.forum')}</SelectItem>
                <SelectItem value="theme">{t('types.theme')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sensitivity Level */}
          <div className="space-y-2">
            <Label htmlFor="sensitivity">
              {t('fields.sensitivity')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.sensitivity_level}
              onValueChange={(value: SensitivityLevel) =>
                setFormData({ ...formData, sensitivity_level: value })
              }
            >
              <SelectTrigger id="sensitivity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('sensitivity.low')}</SelectItem>
                <SelectItem value="medium">{t('sensitivity.medium')}</SelectItem>
                <SelectItem value="high">{t('sensitivity.high')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name English */}
          <div className="space-y-2">
            <Label htmlFor="name_en">
              {t('fields.name')} (English) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="e.g., Kingdom of Saudi Arabia"
              maxLength={200}
              required
            />
          </div>

          {/* Name Arabic */}
          <div className="space-y-2">
            <Label htmlFor="name_ar">
              {t('fields.name')} (العربية) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_ar"
              dir="rtl"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              placeholder="مثال: المملكة العربية السعودية"
              maxLength={200}
              required
            />
          </div>

          {/* Summary English */}
          <div className="space-y-2">
            <Label htmlFor="summary_en">{t('fields.summary')} (English)</Label>
            <Textarea
              id="summary_en"
              value={formData.summary_en}
              onChange={(e) => setFormData({ ...formData, summary_en: e.target.value })}
              placeholder="Brief overview of the dossier..."
              rows={3}
            />
          </div>

          {/* Summary Arabic */}
          <div className="space-y-2">
            <Label htmlFor="summary_ar">{t('fields.summary')} (العربية)</Label>
            <Textarea
              id="summary_ar"
              dir="rtl"
              value={formData.summary_ar}
              onChange={(e) => setFormData({ ...formData, summary_ar: e.target.value })}
              placeholder="نظرة عامة موجزة عن الملف..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tag_input">{t('fields.tags')}</Label>
            <div className="flex gap-2">
              <Input
                id="tag_input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tags..."
                maxLength={50}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-red-500"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
