/**
 * Export Service
 *
 * Exports contacts to CSV and vCard formats.
 * Handles Arabic text (UTF-8 BOM) and large datasets.
 *
 * @module export-service
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Contact type from cd_contacts table
interface Contact {
  id: string;
  full_name: string;
  organization_id?: string | null;
  position?: string | null;
  email_addresses?: string[] | null;
  phone_numbers?: string[] | null;
  tags?: string[] | null;
  created_at?: string | null;
  notes?: string | null;
}

// Organization type for lookups
interface Organization {
  id: string;
  name: string;
}

export class ExportService {
  private readonly MAX_EXPORT_SIZE = 1000;
  private readonly UTF8_BOM = '\ufeff'; // UTF-8 BOM for Excel Arabic support

  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate CSV export of contacts
   * Supports Arabic text with UTF-8 BOM for Excel compatibility
   *
   * @param contacts - Array of contacts to export
   * @param organizations - Optional map of organization IDs to names
   * @returns CSV string with headers and UTF-8 BOM
   */
  generateCSV(
    contacts: Contact[],
    organizations?: Map<string, string>
  ): string {
    // Limit export size
    const limitedContacts = contacts.slice(0, this.MAX_EXPORT_SIZE);

    // CSV headers
    const headers = [
      'Full Name',
      'Organization',
      'Position',
      'Email',
      'Phone',
      'Tags',
      'Created At'
    ];

    // Build CSV rows
    const rows = limitedContacts.map(contact => {
      const organizationName = contact.organization_id
        ? organizations?.get(contact.organization_id) || ''
        : '';

      const emails = (contact.email_addresses || []).join('; ');
      const phones = (contact.phone_numbers || []).join('; ');
      const tags = (contact.tags || []).join('; ');
      const createdAt = contact.created_at
        ? new Date(contact.created_at).toLocaleString()
        : '';

      return [
        this.escapeCsvValue(contact.full_name),
        this.escapeCsvValue(organizationName),
        this.escapeCsvValue(contact.position || ''),
        this.escapeCsvValue(emails),
        this.escapeCsvValue(phones),
        this.escapeCsvValue(tags),
        this.escapeCsvValue(createdAt)
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.map(h => this.escapeCsvValue(h)).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add UTF-8 BOM for Arabic support in Excel
    return this.UTF8_BOM + csvContent;
  }

  /**
   * Generate vCard 3.0 export of contacts
   * Compatible with most contact management systems
   *
   * @param contacts - Array of contacts to export
   * @param organizations - Optional map of organization IDs to names
   * @returns vCard 3.0 formatted string
   */
  generateVCard(
    contacts: Contact[],
    organizations?: Map<string, string>
  ): string {
    // Limit export size
    const limitedContacts = contacts.slice(0, this.MAX_EXPORT_SIZE);

    const vcards = limitedContacts.map(contact => {
      const lines: string[] = [];

      // vCard 3.0 header
      lines.push('BEGIN:VCARD');
      lines.push('VERSION:3.0');

      // Full name (FN) - Required field
      lines.push(`FN:${this.escapeVCardValue(contact.full_name)}`);

      // Name components (N) - Last;First;Middle;Prefix;Suffix
      // Since we only have full_name, we'll put it all in the family name field
      lines.push(`N:${this.escapeVCardValue(contact.full_name)};;;;`);

      // Organization (ORG) and Title (TITLE)
      if (contact.organization_id && organizations?.has(contact.organization_id)) {
        const orgName = organizations.get(contact.organization_id)!;
        lines.push(`ORG:${this.escapeVCardValue(orgName)}`);
      }

      if (contact.position) {
        lines.push(`TITLE:${this.escapeVCardValue(contact.position)}`);
      }

      // Email addresses (EMAIL)
      if (contact.email_addresses?.length) {
        contact.email_addresses.forEach((email, index) => {
          const type = index === 0 ? 'PREF' : 'WORK';
          lines.push(`EMAIL;TYPE=${type}:${email}`);
        });
      }

      // Phone numbers (TEL)
      if (contact.phone_numbers?.length) {
        contact.phone_numbers.forEach((phone, index) => {
          const type = index === 0 ? 'PREF' : 'WORK';
          lines.push(`TEL;TYPE=${type}:${phone}`);
        });
      }

      // Notes (NOTE)
      if (contact.notes) {
        lines.push(`NOTE:${this.escapeVCardValue(contact.notes)}`);
      }

      // Categories (CATEGORIES) from tags
      if (contact.tags?.length) {
        lines.push(`CATEGORIES:${contact.tags.join(',')}`);
      }

      // Unique identifier (UID)
      lines.push(`UID:${contact.id}`);

      // Revision date (REV)
      if (contact.created_at) {
        const date = new Date(contact.created_at);
        const rev = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        lines.push(`REV:${rev}`);
      }

      // vCard footer
      lines.push('END:VCARD');

      return lines.join('\r\n');
    });

    return vcards.join('\r\n\r\n');
  }

  /**
   * Generate export in chunks for large datasets
   *
   * @param contacts - Array of contacts to export
   * @param format - Export format ('csv' or 'vcard')
   * @param chunkSize - Number of contacts per chunk
   * @returns AsyncGenerator yielding chunks
   */
  async *generateChunkedExport(
    contacts: Contact[],
    format: 'csv' | 'vcard',
    chunkSize: number = 100
  ): AsyncGenerator<string, void, unknown> {
    // Fetch organizations if needed
    const organizationIds = [...new Set(
      contacts
        .map(c => c.organization_id)
        .filter((id): id is string => id !== null)
    )];

    let organizations: Map<string, string> | undefined;

    if (organizationIds.length > 0) {
      const { data: orgs } = await this.supabase
        .from('cd_organizations')
        .select('id, name')
        .in('id', organizationIds);

      if (orgs) {
        organizations = new Map(orgs.map(org => [org.id, org.name]));
      }
    }

    // Generate export in chunks
    for (let i = 0; i < contacts.length; i += chunkSize) {
      const chunk = contacts.slice(i, Math.min(i + chunkSize, contacts.length));

      if (format === 'csv') {
        // For CSV, only include headers in the first chunk
        const includeHeaders = i === 0;
        const csvChunk = this.generateCSVChunk(chunk, organizations, includeHeaders);
        yield csvChunk;
      } else {
        // vCard format
        yield this.generateVCard(chunk, organizations);
      }
    }
  }

  /**
   * Generate a CSV chunk without headers (except for the first chunk)
   */
  private generateCSVChunk(
    contacts: Contact[],
    organizations?: Map<string, string>,
    includeHeaders: boolean = false
  ): string {
    const rows = contacts.map(contact => {
      const organizationName = contact.organization_id
        ? organizations?.get(contact.organization_id) || ''
        : '';

      const emails = (contact.email_addresses || []).join('; ');
      const phones = (contact.phone_numbers || []).join('; ');
      const tags = (contact.tags || []).join('; ');
      const createdAt = contact.created_at
        ? new Date(contact.created_at).toLocaleString()
        : '';

      return [
        this.escapeCsvValue(contact.full_name),
        this.escapeCsvValue(organizationName),
        this.escapeCsvValue(contact.position || ''),
        this.escapeCsvValue(emails),
        this.escapeCsvValue(phones),
        this.escapeCsvValue(tags),
        this.escapeCsvValue(createdAt)
      ].join(',');
    });

    if (includeHeaders) {
      const headers = [
        'Full Name',
        'Organization',
        'Position',
        'Email',
        'Phone',
        'Tags',
        'Created At'
      ].map(h => this.escapeCsvValue(h)).join(',');

      return this.UTF8_BOM + headers + '\n' + rows.join('\n');
    }

    return rows.join('\n');
  }

  /**
   * Escape CSV value according to RFC 4180
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';

    // Check if value needs escaping
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escape double quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return value;
  }

  /**
   * Escape vCard value according to vCard 3.0 specification
   */
  private escapeVCardValue(value: string): string {
    if (!value) return '';

    // Escape special characters: backslash, semicolon, comma, newline
    return value
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }
}
