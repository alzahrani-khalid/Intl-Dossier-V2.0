/**
 * Checklist Template Import Hook
 * @module hooks/useImportChecklistTemplate
 * @feature 014-full-assignment-detail
 *
 * TanStack Query mutation hook for bulk importing checklist items from templates.
 *
 * @description
 * Provides a mutation for creating multiple checklist items at once from a
 * predefined template. Automatically invalidates assignment queries and shows
 * toast notifications.
 *
 * Features:
 * - Bulk checklist item creation from template
 * - Automatic cache invalidation via TanStack Query
 * - i18n toast notifications (assignments, common namespaces)
 * - Returns created item count and IDs
 *
 * Use cases:
 * - Pre-populate assignment checklists
 * - Apply standard workflow templates
 * - Quick setup for common assignment types
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#POST /assignments/checklist/import-template
 *
 * @example
 * // Import template into assignment
 * const importTemplate = useImportChecklistTemplate();
 *
 * const handleImport = async (templateId) => {
 *   await importTemplate.mutateAsync({
 *     assignment_id: assignmentId,
 *     template_id: templateId,
 *   });
 * };
 *
 * @example
 * // Show loading state
 * {importTemplate.isPending && <Spinner />}
 * <Button onClick={handleImport} disabled={importTemplate.isPending}>
 *   Import Template
 * </Button>
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const supabase = createClient();

/**
 * Request payload for template import
 */
export interface ImportChecklistTemplateRequest {
  /** UUID of the assignment to add items to */
  assignment_id: string;
  /** UUID of the template to import */
  template_id: string;
}

/**
 * Response from template import
 */
export interface ImportChecklistTemplateResponse {
  /** Number of checklist items created */
  items_created: number;
  /** Array of created item UUIDs */
  item_ids: string[];
}

/**
 * Hook for importing checklist templates
 *
 * @description
 * TanStack Query mutation that invokes the assignments-checklist-import-template
 * Edge Function to bulk create checklist items from a template.
 *
 * Workflow:
 * 1. Call Edge Function with assignment_id and template_id
 * 2. Edge Function creates checklist items from template
 * 3. On success: invalidate assignment query, show success toast
 * 4. On error: show error toast with message
 *
 * Cache invalidation:
 * - Invalidates query key: ['assignment', assignment_id]
 * - Triggers refetch of assignment detail (including new checklist items)
 *
 * @returns TanStack Query mutation with mutate/mutateAsync methods
 *
 * @example
 * // Basic usage
 * const importTemplate = useImportChecklistTemplate();
 *
 * await importTemplate.mutateAsync({
 *   assignment_id: 'uuid-123',
 *   template_id: 'template-uuid-456',
 * });
 * // Assignment query automatically refetches with new items
 *
 * @example
 * // Handle success/error manually
 * importTemplate.mutate(
 *   { assignment_id, template_id },
 *   {
 *     onSuccess: (data) => {
 *       console.log(`Created ${data.items_created} items`);
 *     },
 *     onError: (error) => {
 *       console.error('Import failed:', error);
 *     },
 *   }
 * );
 */
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
