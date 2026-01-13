/**
 * Data Export Edge Function
 * Feature: export-import-templates
 *
 * Exports entity data to CSV or XLSX format with support for:
 * - Selective column export
 * - Template generation
 * - Bilingual headers
 * - Filter-based export
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Entity template definitions
const ENTITY_TEMPLATES: Record<string, EntityTemplate> = {
  dossier: {
    entityType: 'dossier',
    name: 'Dossiers',
    nameAr: 'الملفات',
    identifierColumns: ['id', 'name_en'],
    requiredColumns: ['name_en', 'type'],
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
        isIdentifier: true,
      },
      {
        field: 'name_en',
        header: 'Name (English)',
        headerAr: 'الاسم (إنجليزي)',
        type: 'string',
        required: true,
        maxLength: 200,
        exportable: true,
        importable: true,
        example: 'Ministry of Finance',
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        exportable: true,
        importable: true,
        example: 'وزارة المالية',
      },
      {
        field: 'type',
        header: 'Type',
        headerAr: 'النوع',
        type: 'enum',
        required: true,
        enumValues: [
          'country',
          'organization',
          'forum',
          'theme',
          'person',
          'engagement',
          'working_group',
        ],
        exportable: true,
        importable: true,
        example: 'organization',
      },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        type: 'enum',
        required: false,
        enumValues: ['active', 'inactive', 'archived'],
        defaultValue: 'active',
        exportable: true,
        importable: true,
        example: 'active',
      },
      {
        field: 'summary_en',
        header: 'Summary (English)',
        headerAr: 'الملخص (إنجليزي)',
        type: 'string',
        required: false,
        maxLength: 2000,
        exportable: true,
        importable: true,
      },
      {
        field: 'summary_ar',
        header: 'Summary (Arabic)',
        headerAr: 'الملخص (عربي)',
        type: 'string',
        required: false,
        maxLength: 2000,
        exportable: true,
        importable: true,
      },
      {
        field: 'sensitivity_level',
        header: 'Sensitivity Level',
        headerAr: 'مستوى الحساسية',
        type: 'enum',
        required: false,
        enumValues: ['low', 'medium', 'high'],
        defaultValue: 'low',
        exportable: true,
        importable: true,
        example: 'low',
      },
      {
        field: 'tags',
        header: 'Tags',
        headerAr: 'الوسوم',
        type: 'array',
        required: false,
        exportable: true,
        importable: true,
        description: 'Comma-separated list of tags',
        descriptionAr: 'قائمة الوسوم مفصولة بفواصل',
      },
      {
        field: 'created_at',
        header: 'Created At',
        headerAr: 'تاريخ الإنشاء',
        type: 'datetime',
        required: false,
        exportable: true,
        importable: false,
      },
      {
        field: 'updated_at',
        header: 'Updated At',
        headerAr: 'تاريخ التحديث',
        type: 'datetime',
        required: false,
        exportable: true,
        importable: false,
      },
    ],
  },
  person: {
    entityType: 'person',
    name: 'Persons',
    nameAr: 'الأشخاص',
    identifierColumns: ['id', 'email'],
    requiredColumns: ['name_en'],
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
        isIdentifier: true,
      },
      {
        field: 'name_en',
        header: 'Name (English)',
        headerAr: 'الاسم (إنجليزي)',
        type: 'string',
        required: true,
        maxLength: 200,
        exportable: true,
        importable: true,
        example: 'John Doe',
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        exportable: true,
        importable: true,
        example: 'جون دو',
      },
      {
        field: 'title_en',
        header: 'Title (English)',
        headerAr: 'المسمى الوظيفي (إنجليزي)',
        type: 'string',
        required: false,
        maxLength: 100,
        exportable: true,
        importable: true,
        example: 'Director',
      },
      {
        field: 'title_ar',
        header: 'Title (Arabic)',
        headerAr: 'المسمى الوظيفي (عربي)',
        type: 'string',
        required: false,
        maxLength: 100,
        exportable: true,
        importable: true,
      },
      {
        field: 'email',
        header: 'Email',
        headerAr: 'البريد الإلكتروني',
        type: 'email',
        required: false,
        exportable: true,
        importable: true,
        isIdentifier: true,
        example: 'john@example.com',
      },
      {
        field: 'phone',
        header: 'Phone',
        headerAr: 'الهاتف',
        type: 'string',
        required: false,
        maxLength: 50,
        exportable: true,
        importable: true,
      },
      {
        field: 'organization_name',
        header: 'Organization',
        headerAr: 'المنظمة',
        type: 'string',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'importance_level',
        header: 'Importance Level',
        headerAr: 'مستوى الأهمية',
        type: 'number',
        required: false,
        minValue: 1,
        maxValue: 5,
        exportable: true,
        importable: true,
        example: '3',
      },
      {
        field: 'expertise_areas',
        header: 'Expertise Areas',
        headerAr: 'مجالات الخبرة',
        type: 'array',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'languages',
        header: 'Languages',
        headerAr: 'اللغات',
        type: 'array',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'created_at',
        header: 'Created At',
        headerAr: 'تاريخ الإنشاء',
        type: 'datetime',
        required: false,
        exportable: true,
        importable: false,
      },
    ],
  },
  engagement: {
    entityType: 'engagement',
    name: 'Engagements',
    nameAr: 'الارتباطات',
    identifierColumns: ['id', 'name_en'],
    requiredColumns: ['name_en', 'engagement_type'],
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
        isIdentifier: true,
      },
      {
        field: 'name_en',
        header: 'Name (English)',
        headerAr: 'الاسم (إنجليزي)',
        type: 'string',
        required: true,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'engagement_type',
        header: 'Type',
        headerAr: 'النوع',
        type: 'enum',
        required: true,
        enumValues: [
          'bilateral_meeting',
          'mission',
          'delegation',
          'summit',
          'working_group',
          'roundtable',
          'official_visit',
          'consultation',
          'other',
        ],
        exportable: true,
        importable: true,
      },
      {
        field: 'category',
        header: 'Category',
        headerAr: 'الفئة',
        type: 'enum',
        required: false,
        enumValues: [
          'diplomatic',
          'statistical',
          'technical',
          'economic',
          'cultural',
          'educational',
          'research',
          'other',
        ],
        exportable: true,
        importable: true,
      },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        type: 'enum',
        required: false,
        enumValues: ['planned', 'confirmed', 'in_progress', 'completed', 'postponed', 'cancelled'],
        defaultValue: 'planned',
        exportable: true,
        importable: true,
      },
      {
        field: 'start_date',
        header: 'Start Date',
        headerAr: 'تاريخ البدء',
        type: 'date',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'end_date',
        header: 'End Date',
        headerAr: 'تاريخ الانتهاء',
        type: 'date',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'location_en',
        header: 'Location (English)',
        headerAr: 'الموقع (إنجليزي)',
        type: 'string',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'location_ar',
        header: 'Location (Arabic)',
        headerAr: 'الموقع (عربي)',
        type: 'string',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'is_virtual',
        header: 'Virtual',
        headerAr: 'افتراضي',
        type: 'boolean',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'delegation_size',
        header: 'Delegation Size',
        headerAr: 'حجم الوفد',
        type: 'number',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'created_at',
        header: 'Created At',
        headerAr: 'تاريخ الإنشاء',
        type: 'datetime',
        required: false,
        exportable: true,
        importable: false,
      },
    ],
  },
  'working-group': {
    entityType: 'working-group',
    name: 'Working Groups',
    nameAr: 'مجموعات العمل',
    identifierColumns: ['id', 'name_en'],
    requiredColumns: ['name_en'],
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
        isIdentifier: true,
      },
      {
        field: 'name_en',
        header: 'Name (English)',
        headerAr: 'الاسم (إنجليزي)',
        type: 'string',
        required: true,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        type: 'enum',
        required: false,
        enumValues: ['active', 'inactive', 'archived'],
        defaultValue: 'active',
        exportable: true,
        importable: true,
      },
      {
        field: 'mandate_en',
        header: 'Mandate (English)',
        headerAr: 'التفويض (إنجليزي)',
        type: 'string',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'mandate_ar',
        header: 'Mandate (Arabic)',
        headerAr: 'التفويض (عربي)',
        type: 'string',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'formation_date',
        header: 'Formation Date',
        headerAr: 'تاريخ التشكيل',
        type: 'date',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'dissolution_date',
        header: 'Dissolution Date',
        headerAr: 'تاريخ الحل',
        type: 'date',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'member_count',
        header: 'Member Count',
        headerAr: 'عدد الأعضاء',
        type: 'number',
        required: false,
        exportable: true,
        importable: false,
      },
      {
        field: 'created_at',
        header: 'Created At',
        headerAr: 'تاريخ الإنشاء',
        type: 'datetime',
        required: false,
        exportable: true,
        importable: false,
      },
    ],
  },
  commitment: {
    entityType: 'commitment',
    name: 'Commitments',
    nameAr: 'الالتزامات',
    identifierColumns: ['id'],
    requiredColumns: ['title_en', 'commitment_type'],
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
        isIdentifier: true,
      },
      {
        field: 'title_en',
        header: 'Title (English)',
        headerAr: 'العنوان (إنجليزي)',
        type: 'string',
        required: true,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'title_ar',
        header: 'Title (Arabic)',
        headerAr: 'العنوان (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'commitment_type',
        header: 'Type',
        headerAr: 'النوع',
        type: 'enum',
        required: true,
        enumValues: ['internal', 'external'],
        exportable: true,
        importable: true,
      },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        type: 'enum',
        required: false,
        enumValues: ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'],
        defaultValue: 'pending',
        exportable: true,
        importable: true,
      },
      {
        field: 'priority',
        header: 'Priority',
        headerAr: 'الأولوية',
        type: 'enum',
        required: false,
        enumValues: ['low', 'medium', 'high', 'urgent'],
        defaultValue: 'medium',
        exportable: true,
        importable: true,
      },
      {
        field: 'deadline',
        header: 'Deadline',
        headerAr: 'الموعد النهائي',
        type: 'date',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'completion_percentage',
        header: 'Completion %',
        headerAr: 'نسبة الإنجاز',
        type: 'number',
        required: false,
        minValue: 0,
        maxValue: 100,
        exportable: true,
        importable: true,
      },
      {
        field: 'assignee_name',
        header: 'Assignee',
        headerAr: 'المسؤول',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
      },
      {
        field: 'created_at',
        header: 'Created At',
        headerAr: 'تاريخ الإنشاء',
        type: 'datetime',
        required: false,
        exportable: true,
        importable: false,
      },
    ],
  },
  deliverable: {
    entityType: 'deliverable',
    name: 'Deliverables',
    nameAr: 'المخرجات',
    identifierColumns: ['id'],
    requiredColumns: ['title_en'],
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
        isIdentifier: true,
      },
      {
        field: 'title_en',
        header: 'Title (English)',
        headerAr: 'العنوان (إنجليزي)',
        type: 'string',
        required: true,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'title_ar',
        header: 'Title (Arabic)',
        headerAr: 'العنوان (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        exportable: true,
        importable: true,
      },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        type: 'enum',
        required: false,
        enumValues: ['pending', 'in_progress', 'completed', 'cancelled'],
        defaultValue: 'pending',
        exportable: true,
        importable: true,
      },
      {
        field: 'due_date',
        header: 'Due Date',
        headerAr: 'تاريخ الاستحقاق',
        type: 'date',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'completion_date',
        header: 'Completion Date',
        headerAr: 'تاريخ الإنجاز',
        type: 'date',
        required: false,
        exportable: true,
        importable: true,
      },
      {
        field: 'assignee_name',
        header: 'Assignee',
        headerAr: 'المسؤول',
        type: 'string',
        required: false,
        exportable: true,
        importable: false,
      },
      {
        field: 'created_at',
        header: 'Created At',
        headerAr: 'تاريخ الإنشاء',
        type: 'datetime',
        required: false,
        exportable: true,
        importable: false,
      },
    ],
  },
};

interface EntityTemplate {
  entityType: string;
  name: string;
  nameAr: string;
  identifierColumns: string[];
  requiredColumns: string[];
  version: string;
  columns: ColumnMapping[];
}

interface ColumnMapping {
  field: string;
  header: string;
  headerAr: string;
  type: string;
  required: boolean;
  enumValues?: string[];
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  defaultValue?: unknown;
  isIdentifier?: boolean;
  exportable?: boolean;
  importable?: boolean;
  example?: string;
  description?: string;
  descriptionAr?: string;
}

interface ExportRequest {
  entityType: string;
  format: 'csv' | 'xlsx' | 'json';
  ids?: string[];
  columns?: string[];
  includeTemplate?: boolean;
  includeExample?: boolean;
  filters?: Record<string, unknown>;
  language?: 'en' | 'ar' | 'both';
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Generate CSV content
function generateCSV(
  data: Record<string, unknown>[],
  columns: ColumnMapping[],
  language: string,
  includeExample: boolean
): string {
  const lines: string[] = [];

  // Generate headers based on language
  const headers = columns.map((col) => {
    if (language === 'both') {
      return `${col.header} / ${col.headerAr}`;
    }
    return language === 'ar' ? col.headerAr : col.header;
  });

  // Escape CSV values
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  lines.push(headers.map(escapeCSV).join(','));

  // Add example row if requested
  if (includeExample && data.length === 0) {
    const exampleRow = columns.map((col) => col.example || '');
    lines.push(exampleRow.map(escapeCSV).join(','));
  }

  // Add data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col.field];
      if (Array.isArray(value)) {
        return value.join('; ');
      }
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      return value;
    });
    lines.push(values.map(escapeCSV).join(','));
  }

  // Add BOM for Excel UTF-8 compatibility
  return '\uFEFF' + lines.join('\r\n');
}

// Generate JSON content
function generateJSON(
  data: Record<string, unknown>[],
  columns: ColumnMapping[],
  includeTemplate: boolean
): string {
  const result: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    recordCount: data.length,
    data: data,
  };

  if (includeTemplate) {
    result.columns = columns.map((col) => ({
      field: col.field,
      header: col.header,
      headerAr: col.headerAr,
      type: col.type,
      required: col.required,
      enumValues: col.enumValues,
    }));
  }

  return JSON.stringify(result, null, 2);
}

// Fetch data based on entity type
async function fetchEntityData(
  supabase: ReturnType<typeof createClient>,
  entityType: string,
  ids?: string[],
  filters?: Record<string, unknown>,
  sortBy?: string,
  sortDirection?: string
): Promise<Record<string, unknown>[]> {
  let query;

  switch (entityType) {
    case 'dossier': {
      query = supabase
        .from('dossiers')
        .select('*')
        .order(sortBy || 'created_at', { ascending: sortDirection !== 'desc' });

      if (ids?.length) {
        query = query.in('id', ids);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      break;
    }

    case 'person': {
      query = supabase
        .from('persons')
        .select(
          `
          *,
          dossier:dossier_id (
            id,
            name_en,
            name_ar
          )
        `
        )
        .order(sortBy || 'created_at', { ascending: sortDirection !== 'desc' });

      if (ids?.length) {
        query = query.in('id', ids);
      }
      break;
    }

    case 'engagement': {
      query = supabase
        .from('engagement_dossiers')
        .select(
          `
          *,
          dossier:dossier_id (
            id,
            name_en,
            name_ar,
            status
          )
        `
        )
        .order(sortBy || 'start_date', { ascending: sortDirection !== 'desc' });

      if (ids?.length) {
        query = query.in('id', ids);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      break;
    }

    case 'working-group': {
      query = supabase
        .from('working_groups')
        .select('*')
        .order(sortBy || 'created_at', { ascending: sortDirection !== 'desc' });

      if (ids?.length) {
        query = query.in('id', ids);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      break;
    }

    case 'commitment': {
      query = supabase
        .from('commitments')
        .select(
          `
          *,
          assignee:assignee_id (
            id,
            email,
            raw_user_meta_data
          )
        `
        )
        .order(sortBy || 'deadline', { ascending: sortDirection !== 'desc' });

      if (ids?.length) {
        query = query.in('id', ids);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      break;
    }

    case 'deliverable': {
      query = supabase
        .from('mou_deliverables')
        .select(
          `
          *,
          assignee:assignee_id (
            id,
            email,
            raw_user_meta_data
          )
        `
        )
        .order(sortBy || 'due_date', { ascending: sortDirection !== 'desc' });

      if (ids?.length) {
        query = query.in('id', ids);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      break;
    }

    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }

  const { data, error } = await query.limit(10000);

  if (error) {
    throw error;
  }

  return data || [];
}

// Transform data for export (flatten relations, format dates, etc.)
function transformForExport(
  data: Record<string, unknown>[],
  entityType: string
): Record<string, unknown>[] {
  return data.map((row) => {
    const transformed: Record<string, unknown> = { ...row };

    // Flatten nested dossier relation
    if (row.dossier && typeof row.dossier === 'object') {
      const dossier = row.dossier as Record<string, unknown>;
      transformed.dossier_name_en = dossier.name_en;
      transformed.dossier_name_ar = dossier.name_ar;
      delete transformed.dossier;
    }

    // Flatten assignee relation
    if (row.assignee && typeof row.assignee === 'object') {
      const assignee = row.assignee as Record<string, unknown>;
      const meta = (assignee.raw_user_meta_data as Record<string, unknown>) || {};
      transformed.assignee_name = meta.full_name || assignee.email || '';
      delete transformed.assignee;
    }

    // Format dates
    for (const [key, value] of Object.entries(transformed)) {
      if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        // ISO date string - keep date part only for date fields
        if (key.includes('date') || key === 'deadline') {
          transformed[key] = value.split('T')[0];
        }
      }
    }

    // Handle arrays
    for (const [key, value] of Object.entries(transformed)) {
      if (Array.isArray(value)) {
        transformed[key] = value.join('; ');
      }
    }

    return transformed;
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message_en: 'Method not allowed',
          message_ar: 'الطريقة غير مسموحة',
        },
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid or expired token',
            message_ar: 'الرمز غير صالح أو منتهي الصلاحية',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    let request: ExportRequest;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      request = {
        entityType: url.searchParams.get('entityType') || 'dossier',
        format: (url.searchParams.get('format') || 'csv') as 'csv' | 'xlsx' | 'json',
        ids: url.searchParams.get('ids')?.split(',').filter(Boolean),
        columns: url.searchParams.get('columns')?.split(',').filter(Boolean),
        includeTemplate: url.searchParams.get('includeTemplate') === 'true',
        includeExample: url.searchParams.get('includeExample') === 'true',
        language: (url.searchParams.get('language') || 'en') as 'en' | 'ar' | 'both',
        sortBy: url.searchParams.get('sortBy') || undefined,
        sortDirection: (url.searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc',
      };
    } else {
      request = await req.json();
    }

    // Validate entity type
    const template = ENTITY_TEMPLATES[request.entityType];
    if (!template) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_ENTITY_TYPE',
            message_en: `Invalid entity type: ${request.entityType}`,
            message_ar: `نوع الكيان غير صالح: ${request.entityType}`,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get columns to export
    let columnsToExport = template.columns.filter((col) => col.exportable !== false);
    if (request.columns?.length) {
      columnsToExport = columnsToExport.filter((col) => request.columns!.includes(col.field));
    }

    // Fetch data
    const rawData = await fetchEntityData(
      supabaseClient,
      request.entityType,
      request.ids,
      request.filters,
      request.sortBy,
      request.sortDirection
    );

    // Transform data
    const data = transformForExport(rawData, request.entityType);

    // Generate output based on format
    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (request.format) {
      case 'json':
        content = generateJSON(data, columnsToExport, request.includeTemplate || false);
        contentType = 'application/json';
        fileExtension = 'json';
        break;

      case 'xlsx':
        // For XLSX, we return CSV with a flag - frontend will convert using exceljs
        content = generateCSV(
          data,
          columnsToExport,
          request.language || 'en',
          request.includeExample || false
        );
        contentType = 'text/csv; charset=utf-8';
        fileExtension = 'csv';
        break;

      case 'csv':
      default:
        content = generateCSV(
          data,
          columnsToExport,
          request.language || 'en',
          request.includeExample || false
        );
        contentType = 'text/csv; charset=utf-8';
        fileExtension = 'csv';
        break;
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${request.entityType}_export_${timestamp}.${fileExtension}`;

    return new Response(
      JSON.stringify({
        success: true,
        content,
        fileName,
        contentType,
        recordCount: data.length,
        exportedAt: new Date().toISOString(),
        entityType: request.entityType,
        format: request.format,
        template: request.includeTemplate ? template : undefined,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Export error:', error);

    return new Response(
      JSON.stringify({
        error: {
          code: 'EXPORT_ERROR',
          message_en: error instanceof Error ? error.message : 'An error occurred during export',
          message_ar: 'حدث خطأ أثناء التصدير',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
