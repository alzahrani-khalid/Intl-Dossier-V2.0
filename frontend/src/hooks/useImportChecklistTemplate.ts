/**
 * useImportChecklistTemplate Hook
 *
 * TanStack Query mutation for importing checklist templates.
 * Bulk creates checklist items from a predefined template.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/checklist/import-template
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

export interface ImportChecklistTemplateRequest {
  assignment_id: string;
  template_id: string;
}

export interface ImportChecklistTemplateResponse {
  items_created: number;
  item_ids: string[];
}

export function useImportChecklistTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['assignments', 'common']);

  return useMutation<ImportChecklistTemplateResponse, Error, ImportChecklistTemplateRequest>({
    mutationFn: async (request: ImportChecklistTemplateRequest) => {
      const { data, error } = await supabase.functions.invoke('assignments-checklist-import-template', {
        method: 'POST',
        body: request,
      });

      if (error) {
        throw new Error(error.message || 'Failed to import checklist template');
      }

      return data as ImportChecklistTemplateResponse;
    },

    onSuccess: (data, variables) => {
      // Invalidate assignment query to refetch checklist
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignment_id],
      });

      // Show success toast
      toast({
        title: t('assignments:checklist.success.importTemplate'),
        description: t('assignments:checklist.success.itemsCreated', {
          count: data.items_created,
        }),
        variant: 'default',
      });
    },

    onError: (error) => {
      toast({
        title: t('assignments:checklist.error.importTemplate'),
        description: error.message || t('common:errors.unknown'),
        variant: 'destructive',
      });
    },
  });
}
