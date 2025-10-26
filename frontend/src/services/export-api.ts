/**
 * Export API Client
 *
 * Handles contact export functionality in CSV and vCard formats.
 * Supports filtering by contact IDs, organization, and tags.
 */

import { supabase } from '@/lib/supabase';

export type ExportFormat = 'csv' | 'vcard';

export interface ExportFilters {
  contact_ids?: string[];
  organization_id?: string;
  tags?: string[];
  limit?: number;
}

export class ExportApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ExportApiError';
  }
}

/**
 * Export contacts in the specified format
 *
 * @param format - Export format: 'csv' or 'vcard'
 * @param filters - Optional filters to apply
 * @returns Blob containing the exported data
 */
export async function exportContacts(
  format: ExportFormat,
  filters?: ExportFilters
): Promise<Blob> {
  try {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new ExportApiError(401, 'Authentication required');
    }

    // Prepare request body
    const requestBody = {
      format,
      ...filters,
      limit: filters?.limit || 1000
    };

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('contacts-export', {
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (error) {
      throw new ExportApiError(500, error.message || 'Export failed');
    }

    // The Edge Function returns the file content directly
    // Convert to Blob for download
    const contentType = format === 'csv'
      ? 'text/csv;charset=utf-8'
      : 'text/vcard;charset=utf-8';

    return new Blob([data], { type: contentType });

  } catch (error) {
    if (error instanceof ExportApiError) {
      throw error;
    }

    console.error('Export error:', error);
    throw new ExportApiError(
      500,
      error instanceof Error ? error.message : 'Export failed'
    );
  }
}

/**
 * Download exported contacts as a file
 *
 * @param format - Export format: 'csv' or 'vcard'
 * @param filters - Optional filters to apply
 * @param filename - Optional custom filename
 */
export async function downloadContacts(
  format: ExportFormat,
  filters?: ExportFilters,
  filename?: string
): Promise<void> {
  try {
    // Get the exported data
    const blob = await exportContacts(format, filters);

    // Generate filename if not provided
    const defaultFilename = `contacts_${new Date().toISOString().split('T')[0]}.${
      format === 'csv' ? 'csv' : 'vcf'
    }`;
    const finalFilename = filename || defaultFilename;

    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Export selected contacts
 *
 * @param contactIds - Array of contact IDs to export
 * @param format - Export format: 'csv' or 'vcard'
 */
export async function exportSelectedContacts(
  contactIds: string[],
  format: ExportFormat
): Promise<void> {
  if (contactIds.length === 0) {
    throw new ExportApiError(400, 'No contacts selected');
  }

  return downloadContacts(format, { contact_ids: contactIds });
}

/**
 * Export all contacts (with optional filters)
 *
 * @param format - Export format: 'csv' or 'vcard'
 * @param organizationId - Optional organization filter
 * @param tags - Optional tags filter
 */
export async function exportAllContacts(
  format: ExportFormat,
  organizationId?: string,
  tags?: string[]
): Promise<void> {
  const filters: ExportFilters = {};

  if (organizationId) {
    filters.organization_id = organizationId;
  }

  if (tags?.length) {
    filters.tags = tags;
  }

  return downloadContacts(format, filters);
}

/**
 * Get export size estimate
 *
 * @param filters - Optional filters to apply
 * @returns Estimated number of contacts to export
 */
export async function getExportSizeEstimate(
  filters?: ExportFilters
): Promise<number> {
  try {
    let query = supabase
      .from('cd_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('is_archived', false);

    // Apply filters
    if (filters?.contact_ids?.length) {
      query = query.in('id', filters.contact_ids);
    }

    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }

    if (filters?.tags?.length) {
      query = query.contains('tags', filters.tags);
    }

    const { count, error } = await query;

    if (error) {
      throw new ExportApiError(500, error.message);
    }

    return count || 0;

  } catch (error) {
    console.error('Count error:', error);
    return 0;
  }
}