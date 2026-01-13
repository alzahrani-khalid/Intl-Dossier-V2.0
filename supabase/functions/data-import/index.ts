/**
 * Data Import Edge Function
 * Feature: export-import-templates
 *
 * Validates and imports CSV/JSON data with support for:
 * - Row-by-row validation
 * - Change detection for existing records
 * - Conflict resolution strategies
 * - Partial imports with detailed error reporting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Entity template definitions (matching export function)
const ENTITY_TEMPLATES: Record<string, EntityTemplate> = {
  dossier: {
    entityType: 'dossier',
    name: 'Dossiers',
    nameAr: 'الملفات',
    identifierColumns: ['id', 'name_en'],
    requiredColumns: ['name_en', 'type'],
    tableName: 'dossiers',
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
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
        importable: true,
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        importable: true,
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
        importable: true,
      },
      {
        field: 'summary_en',
        header: 'Summary (English)',
        headerAr: 'الملخص (إنجليزي)',
        type: 'string',
        required: false,
        maxLength: 2000,
        importable: true,
      },
      {
        field: 'summary_ar',
        header: 'Summary (Arabic)',
        headerAr: 'الملخص (عربي)',
        type: 'string',
        required: false,
        maxLength: 2000,
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
        importable: true,
      },
      {
        field: 'tags',
        header: 'Tags',
        headerAr: 'الوسوم',
        type: 'array',
        required: false,
        importable: true,
      },
    ],
  },
  person: {
    entityType: 'person',
    name: 'Persons',
    nameAr: 'الأشخاص',
    identifierColumns: ['id', 'email'],
    requiredColumns: ['name_en'],
    tableName: 'persons',
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
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
        importable: true,
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        importable: true,
      },
      {
        field: 'title_en',
        header: 'Title (English)',
        headerAr: 'المسمى الوظيفي (إنجليزي)',
        type: 'string',
        required: false,
        maxLength: 100,
        importable: true,
      },
      {
        field: 'title_ar',
        header: 'Title (Arabic)',
        headerAr: 'المسمى الوظيفي (عربي)',
        type: 'string',
        required: false,
        maxLength: 100,
        importable: true,
      },
      {
        field: 'email',
        header: 'Email',
        headerAr: 'البريد الإلكتروني',
        type: 'email',
        required: false,
        importable: true,
        isIdentifier: true,
      },
      {
        field: 'phone',
        header: 'Phone',
        headerAr: 'الهاتف',
        type: 'string',
        required: false,
        maxLength: 50,
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
        importable: true,
      },
      {
        field: 'expertise_areas',
        header: 'Expertise Areas',
        headerAr: 'مجالات الخبرة',
        type: 'array',
        required: false,
        importable: true,
      },
      {
        field: 'languages',
        header: 'Languages',
        headerAr: 'اللغات',
        type: 'array',
        required: false,
        importable: true,
      },
    ],
  },
  engagement: {
    entityType: 'engagement',
    name: 'Engagements',
    nameAr: 'الارتباطات',
    identifierColumns: ['id', 'name_en'],
    requiredColumns: ['name_en', 'engagement_type'],
    tableName: 'engagement_dossiers',
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
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
        importable: true,
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
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
        importable: true,
      },
      {
        field: 'start_date',
        header: 'Start Date',
        headerAr: 'تاريخ البدء',
        type: 'date',
        required: false,
        importable: true,
      },
      {
        field: 'end_date',
        header: 'End Date',
        headerAr: 'تاريخ الانتهاء',
        type: 'date',
        required: false,
        importable: true,
      },
      {
        field: 'location_en',
        header: 'Location (English)',
        headerAr: 'الموقع (إنجليزي)',
        type: 'string',
        required: false,
        importable: true,
      },
      {
        field: 'location_ar',
        header: 'Location (Arabic)',
        headerAr: 'الموقع (عربي)',
        type: 'string',
        required: false,
        importable: true,
      },
      {
        field: 'is_virtual',
        header: 'Virtual',
        headerAr: 'افتراضي',
        type: 'boolean',
        required: false,
        importable: true,
      },
      {
        field: 'delegation_size',
        header: 'Delegation Size',
        headerAr: 'حجم الوفد',
        type: 'number',
        required: false,
        importable: true,
      },
    ],
  },
  'working-group': {
    entityType: 'working-group',
    name: 'Working Groups',
    nameAr: 'مجموعات العمل',
    identifierColumns: ['id', 'name_en'],
    requiredColumns: ['name_en'],
    tableName: 'working_groups',
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
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
        importable: true,
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
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
        importable: true,
      },
      {
        field: 'mandate_en',
        header: 'Mandate (English)',
        headerAr: 'التفويض (إنجليزي)',
        type: 'string',
        required: false,
        importable: true,
      },
      {
        field: 'mandate_ar',
        header: 'Mandate (Arabic)',
        headerAr: 'التفويض (عربي)',
        type: 'string',
        required: false,
        importable: true,
      },
      {
        field: 'formation_date',
        header: 'Formation Date',
        headerAr: 'تاريخ التشكيل',
        type: 'date',
        required: false,
        importable: true,
      },
      {
        field: 'dissolution_date',
        header: 'Dissolution Date',
        headerAr: 'تاريخ الحل',
        type: 'date',
        required: false,
        importable: true,
      },
    ],
  },
  commitment: {
    entityType: 'commitment',
    name: 'Commitments',
    nameAr: 'الالتزامات',
    identifierColumns: ['id'],
    requiredColumns: ['title_en', 'commitment_type'],
    tableName: 'commitments',
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
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
        importable: true,
      },
      {
        field: 'title_ar',
        header: 'Title (Arabic)',
        headerAr: 'العنوان (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
        importable: true,
      },
      {
        field: 'commitment_type',
        header: 'Type',
        headerAr: 'النوع',
        type: 'enum',
        required: true,
        enumValues: ['internal', 'external'],
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
        importable: true,
      },
      {
        field: 'deadline',
        header: 'Deadline',
        headerAr: 'الموعد النهائي',
        type: 'date',
        required: false,
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
        importable: true,
      },
    ],
  },
  deliverable: {
    entityType: 'deliverable',
    name: 'Deliverables',
    nameAr: 'المخرجات',
    identifierColumns: ['id'],
    requiredColumns: ['title_en'],
    tableName: 'mou_deliverables',
    version: '1.0',
    columns: [
      {
        field: 'id',
        header: 'ID',
        headerAr: 'المعرف',
        type: 'string',
        required: false,
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
        importable: true,
      },
      {
        field: 'title_ar',
        header: 'Title (Arabic)',
        headerAr: 'العنوان (عربي)',
        type: 'string',
        required: false,
        maxLength: 200,
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
        importable: true,
      },
      {
        field: 'due_date',
        header: 'Due Date',
        headerAr: 'تاريخ الاستحقاق',
        type: 'date',
        required: false,
        importable: true,
      },
      {
        field: 'completion_date',
        header: 'Completion Date',
        headerAr: 'تاريخ الإنجاز',
        type: 'date',
        required: false,
        importable: true,
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
  tableName: string;
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
  importable?: boolean;
  pattern?: string;
}

interface CellValidationError {
  row: number;
  column: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message_en: string;
  message_ar: string;
  value?: unknown;
  suggestion_en?: string;
  suggestion_ar?: string;
}

interface RowValidationResult {
  row: number;
  status:
    | 'pending'
    | 'valid'
    | 'invalid'
    | 'warning'
    | 'conflict'
    | 'imported'
    | 'skipped'
    | 'failed';
  errors: CellValidationError[];
  data?: Record<string, unknown>;
  existingId?: string;
  changes?: FieldChange[];
}

interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  isSignificant?: boolean;
}

interface ImportConflict {
  row: number;
  existingId: string;
  matchedOn: string[];
  changes: FieldChange[];
  resolution?: string;
}

interface ValidateRequest {
  entityType: string;
  data: Record<string, unknown>[];
  headers: string[];
  mode?: 'create' | 'update' | 'upsert';
}

interface ImportRequest {
  entityType: string;
  mode: 'create' | 'update' | 'upsert';
  conflictResolution: 'skip' | 'overwrite' | 'merge';
  rows: RowValidationResult[];
  conflictResolutions?: Record<number, 'skip' | 'overwrite' | 'merge'>;
  skipWarnings?: boolean;
  dryRun?: boolean;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate date format (YYYY-MM-DD)
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return true;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Parse array from string (semicolon or comma separated)
function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (!value || typeof value !== 'string') return [];
  return value
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Parse boolean from string
function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (!value) return null;
  const str = String(value).toLowerCase().trim();
  if (['true', 'yes', '1', 'on'].includes(str)) return true;
  if (['false', 'no', '0', 'off'].includes(str)) return false;
  return null;
}

// Validate a single cell value
function validateCell(
  value: unknown,
  column: ColumnMapping,
  rowNumber: number
): CellValidationError[] {
  const errors: CellValidationError[] = [];
  const strValue = value !== null && value !== undefined ? String(value).trim() : '';

  // Check required
  if (column.required && !strValue) {
    errors.push({
      row: rowNumber,
      column: column.field,
      severity: 'error',
      code: 'required_field',
      message_en: `${column.header} is required`,
      message_ar: `${column.headerAr} مطلوب`,
      value,
    });
    return errors;
  }

  // Skip validation if empty and not required
  if (!strValue) return errors;

  // Type-specific validation
  switch (column.type) {
    case 'string':
      if (column.maxLength && strValue.length > column.maxLength) {
        errors.push({
          row: rowNumber,
          column: column.field,
          severity: 'error',
          code: 'max_length_exceeded',
          message_en: `${column.header} exceeds maximum length of ${column.maxLength} characters`,
          message_ar: `${column.headerAr} يتجاوز الحد الأقصى ${column.maxLength} حرف`,
          value,
        });
      }
      break;

    case 'number':
      const numValue = Number(strValue);
      if (isNaN(numValue)) {
        errors.push({
          row: rowNumber,
          column: column.field,
          severity: 'error',
          code: 'invalid_type',
          message_en: `${column.header} must be a number`,
          message_ar: `${column.headerAr} يجب أن يكون رقماً`,
          value,
        });
      } else {
        if (column.minValue !== undefined && numValue < column.minValue) {
          errors.push({
            row: rowNumber,
            column: column.field,
            severity: 'error',
            code: 'min_value',
            message_en: `${column.header} must be at least ${column.minValue}`,
            message_ar: `${column.headerAr} يجب أن يكون على الأقل ${column.minValue}`,
            value,
          });
        }
        if (column.maxValue !== undefined && numValue > column.maxValue) {
          errors.push({
            row: rowNumber,
            column: column.field,
            severity: 'error',
            code: 'max_value',
            message_en: `${column.header} must not exceed ${column.maxValue}`,
            message_ar: `${column.headerAr} يجب ألا يتجاوز ${column.maxValue}`,
            value,
          });
        }
      }
      break;

    case 'email':
      if (!isValidEmail(strValue)) {
        errors.push({
          row: rowNumber,
          column: column.field,
          severity: 'error',
          code: 'invalid_format',
          message_en: `${column.header} is not a valid email address`,
          message_ar: `${column.headerAr} ليس عنوان بريد إلكتروني صالح`,
          value,
        });
      }
      break;

    case 'date':
    case 'datetime':
      if (!isValidDate(strValue.split('T')[0])) {
        errors.push({
          row: rowNumber,
          column: column.field,
          severity: 'error',
          code: 'invalid_format',
          message_en: `${column.header} must be in YYYY-MM-DD format`,
          message_ar: `${column.headerAr} يجب أن يكون بصيغة YYYY-MM-DD`,
          value,
          suggestion_en: 'Example: 2025-01-15',
          suggestion_ar: 'مثال: 2025-01-15',
        });
      }
      break;

    case 'boolean':
      if (parseBoolean(strValue) === null) {
        errors.push({
          row: rowNumber,
          column: column.field,
          severity: 'error',
          code: 'invalid_type',
          message_en: `${column.header} must be true/false, yes/no, or 1/0`,
          message_ar: `${column.headerAr} يجب أن يكون true/false أو yes/no أو 1/0`,
          value,
        });
      }
      break;

    case 'enum':
      if (column.enumValues && !column.enumValues.includes(strValue.toLowerCase())) {
        errors.push({
          row: rowNumber,
          column: column.field,
          severity: 'error',
          code: 'invalid_enum',
          message_en: `${column.header} must be one of: ${column.enumValues.join(', ')}`,
          message_ar: `${column.headerAr} يجب أن يكون أحد: ${column.enumValues.join(', ')}`,
          value,
          suggestion_en: `Valid values: ${column.enumValues.join(', ')}`,
          suggestion_ar: `القيم الصالحة: ${column.enumValues.join(', ')}`,
        });
      }
      break;
  }

  // Pattern validation
  if (column.pattern) {
    const regex = new RegExp(column.pattern);
    if (!regex.test(strValue)) {
      errors.push({
        row: rowNumber,
        column: column.field,
        severity: 'error',
        code: 'pattern_mismatch',
        message_en: `${column.header} doesn't match the required pattern`,
        message_ar: `${column.headerAr} لا يطابق النمط المطلوب`,
        value,
      });
    }
  }

  return errors;
}

// Map headers to column definitions
function mapHeadersToColumns(
  headers: string[],
  template: EntityTemplate
): { mapped: Map<number, ColumnMapping>; unmapped: string[]; missing: string[] } {
  const mapped = new Map<number, ColumnMapping>();
  const unmapped: string[] = [];
  const foundFields = new Set<string>();

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();

    // Try to match by header name (English or Arabic) or field name
    const column = template.columns.find(
      (col) =>
        col.header.toLowerCase() === normalizedHeader ||
        col.headerAr === header ||
        col.field.toLowerCase() === normalizedHeader ||
        col.field.toLowerCase().replace(/_/g, ' ') === normalizedHeader
    );

    if (column && column.importable !== false) {
      mapped.set(index, column);
      foundFields.add(column.field);
    } else if (header && !header.startsWith('_')) {
      unmapped.push(header);
    }
  });

  // Check for missing required columns
  const missing = template.requiredColumns.filter((field) => !foundFields.has(field));

  return { mapped, unmapped, missing };
}

// Transform raw data to entity format
function transformRowData(
  rowData: Record<string, unknown>,
  template: EntityTemplate
): Record<string, unknown> {
  const transformed: Record<string, unknown> = {};

  for (const column of template.columns) {
    if (column.importable === false) continue;

    const value = rowData[column.field];

    if (value === undefined || value === null || value === '') {
      if (column.defaultValue !== undefined) {
        transformed[column.field] = column.defaultValue;
      }
      continue;
    }

    // Transform based on type
    switch (column.type) {
      case 'number':
        transformed[column.field] = Number(value);
        break;
      case 'boolean':
        transformed[column.field] = parseBoolean(value);
        break;
      case 'array':
        transformed[column.field] = parseArray(value);
        break;
      case 'enum':
        transformed[column.field] = String(value).toLowerCase().trim();
        break;
      case 'date':
      case 'datetime':
        transformed[column.field] = String(value).split('T')[0];
        break;
      default:
        transformed[column.field] = String(value).trim();
    }
  }

  return transformed;
}

// Find existing record by identifier fields
async function findExistingRecord(
  supabase: ReturnType<typeof createClient>,
  template: EntityTemplate,
  rowData: Record<string, unknown>
): Promise<{
  id: string | null;
  matchedOn: string[];
  existingData: Record<string, unknown> | null;
}> {
  const identifierFields = template.columns.filter((col) => col.isIdentifier);

  for (const idField of identifierFields) {
    const value = rowData[idField.field];
    if (!value) continue;

    const { data, error } = await supabase
      .from(template.tableName)
      .select('*')
      .eq(idField.field, value)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        matchedOn: [idField.field],
        existingData: data,
      };
    }
  }

  return { id: null, matchedOn: [], existingData: null };
}

// Detect changes between existing and new data
function detectChanges(
  existingData: Record<string, unknown>,
  newData: Record<string, unknown>,
  columns: ColumnMapping[]
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const column of columns) {
    if (column.importable === false) continue;

    const oldValue = existingData[column.field];
    const newValue = newData[column.field];

    // Skip if both are null/undefined/empty
    const oldEmpty = oldValue === null || oldValue === undefined || oldValue === '';
    const newEmpty = newValue === null || newValue === undefined || newValue === '';
    if (oldEmpty && newEmpty) continue;

    // Compare values
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);
    if (oldStr !== newStr) {
      changes.push({
        field: column.field,
        oldValue,
        newValue,
        isSignificant: column.required || column.isIdentifier,
      });
    }
  }

  return changes;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
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

    // Get URL path to determine action
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop() || 'validate';

    // Parse request body
    const body = await req.json();

    // Get template
    const template = ENTITY_TEMPLATES[body.entityType];
    if (!template) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_ENTITY_TYPE',
            message_en: `Invalid entity type: ${body.entityType}`,
            message_ar: `نوع الكيان غير صالح: ${body.entityType}`,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle validation action
    if (action === 'validate' || !body.rows) {
      const validateRequest = body as ValidateRequest;
      const { mapped, unmapped, missing } = mapHeadersToColumns(validateRequest.headers, template);

      // Check for missing required columns
      if (missing.length > 0) {
        return new Response(
          JSON.stringify({
            valid: false,
            totalRows: validateRequest.data.length,
            validRows: 0,
            invalidRows: validateRequest.data.length,
            warningRows: 0,
            conflictRows: 0,
            rows: [],
            errorSummary: { missing_columns: missing.length },
            conflicts: [],
            fileInfo: {
              name: 'uploaded_file',
              size: 0,
              rows: validateRequest.data.length,
              columns: validateRequest.headers,
              format: 'csv',
            },
            template,
            unmappedColumns: unmapped,
            missingRequiredColumns: missing,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate each row
      const rowResults: RowValidationResult[] = [];
      const conflicts: ImportConflict[] = [];
      const errorSummary: Record<string, number> = {};
      let validRows = 0;
      let invalidRows = 0;
      let warningRows = 0;
      let conflictRows = 0;

      for (let i = 0; i < validateRequest.data.length; i++) {
        const rawRow = validateRequest.data[i];
        const rowNumber = i + 2; // +2 for 1-indexed + header row
        const allErrors: CellValidationError[] = [];

        // Map raw data to field names
        const mappedData: Record<string, unknown> = {};
        for (const [headerIndex, column] of mapped.entries()) {
          const headerName = validateRequest.headers[headerIndex];
          mappedData[column.field] = rawRow[headerName] || rawRow[column.field];
        }

        // Validate each mapped column
        for (const column of template.columns) {
          if (column.importable === false) continue;
          const errors = validateCell(mappedData[column.field], column, rowNumber);
          allErrors.push(...errors);
        }

        // Track error types
        for (const error of allErrors) {
          errorSummary[error.code] = (errorSummary[error.code] || 0) + 1;
        }

        // Transform data
        const transformedData = transformRowData(mappedData, template);

        // Check for existing records (if mode is update or upsert)
        let existingId: string | undefined;
        let changes: FieldChange[] = [];

        if (validateRequest.mode !== 'create') {
          const existing = await findExistingRecord(supabaseClient, template, transformedData);
          if (existing.id) {
            existingId = existing.id;
            changes = detectChanges(existing.existingData!, transformedData, template.columns);

            conflicts.push({
              row: rowNumber,
              existingId: existing.id,
              matchedOn: existing.matchedOn,
              changes,
            });
            conflictRows++;
          }
        }

        // Determine row status
        let status: RowValidationResult['status'] = 'pending';
        const hasErrors = allErrors.some((e) => e.severity === 'error');
        const hasWarnings = allErrors.some((e) => e.severity === 'warning');

        if (hasErrors) {
          status = 'invalid';
          invalidRows++;
        } else if (existingId) {
          status = 'conflict';
        } else if (hasWarnings) {
          status = 'warning';
          warningRows++;
          validRows++;
        } else {
          status = 'valid';
          validRows++;
        }

        rowResults.push({
          row: rowNumber,
          status,
          errors: allErrors,
          data: transformedData,
          existingId,
          changes: changes.length > 0 ? changes : undefined,
        });
      }

      return new Response(
        JSON.stringify({
          valid: invalidRows === 0,
          totalRows: validateRequest.data.length,
          validRows,
          invalidRows,
          warningRows,
          conflictRows,
          rows: rowResults,
          errorSummary,
          conflicts,
          fileInfo: {
            name: 'uploaded_file',
            size: 0,
            rows: validateRequest.data.length,
            columns: validateRequest.headers,
            format: 'csv',
          },
          template,
          unmappedColumns: unmapped,
          missingRequiredColumns: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle import action
    const importRequest = body as ImportRequest;
    const results: Array<{
      row: number;
      success: boolean;
      action: string;
      recordId?: string;
      error?: { code: string; message_en: string; message_ar: string };
    }> = [];

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    // Process each validated row
    for (const rowResult of importRequest.rows) {
      // Skip invalid rows
      if (rowResult.status === 'invalid') {
        results.push({
          row: rowResult.row,
          success: false,
          action: 'failed',
          error: {
            code: 'VALIDATION_ERROR',
            message_en: 'Row has validation errors',
            message_ar: 'الصف يحتوي على أخطاء تحقق',
          },
        });
        failedCount++;
        continue;
      }

      // Skip warning rows if requested
      if (rowResult.status === 'warning' && importRequest.skipWarnings) {
        results.push({
          row: rowResult.row,
          success: true,
          action: 'skipped',
        });
        skippedCount++;
        continue;
      }

      // Handle conflicts
      if (rowResult.existingId) {
        const resolution =
          importRequest.conflictResolutions?.[rowResult.row] || importRequest.conflictResolution;

        if (resolution === 'skip') {
          results.push({
            row: rowResult.row,
            success: true,
            action: 'skipped',
          });
          skippedCount++;
          continue;
        }

        // Update existing record
        if (importRequest.dryRun) {
          results.push({
            row: rowResult.row,
            success: true,
            action: 'updated',
            recordId: rowResult.existingId,
          });
          successCount++;
          updatedCount++;
          continue;
        }

        let updateData = rowResult.data;

        // For merge, only include changed fields
        if (resolution === 'merge') {
          updateData = {};
          for (const change of rowResult.changes || []) {
            if (
              change.newValue !== null &&
              change.newValue !== undefined &&
              change.newValue !== ''
            ) {
              updateData[change.field] = change.newValue;
            }
          }
        }

        const { error } = await supabaseClient
          .from(template.tableName)
          .update(updateData)
          .eq('id', rowResult.existingId);

        if (error) {
          results.push({
            row: rowResult.row,
            success: false,
            action: 'failed',
            error: {
              code: 'UPDATE_ERROR',
              message_en: error.message,
              message_ar: 'خطأ في تحديث السجل',
            },
          });
          failedCount++;
        } else {
          results.push({
            row: rowResult.row,
            success: true,
            action: 'updated',
            recordId: rowResult.existingId,
          });
          successCount++;
          updatedCount++;
        }
        continue;
      }

      // Create new record
      if (importRequest.mode === 'update') {
        results.push({
          row: rowResult.row,
          success: true,
          action: 'skipped',
        });
        skippedCount++;
        continue;
      }

      if (importRequest.dryRun) {
        results.push({
          row: rowResult.row,
          success: true,
          action: 'created',
        });
        successCount++;
        createdCount++;
        continue;
      }

      // Add user metadata
      const insertData = {
        ...rowResult.data,
        created_by: user.id,
      };

      const { data: inserted, error } = await supabaseClient
        .from(template.tableName)
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        results.push({
          row: rowResult.row,
          success: false,
          action: 'failed',
          error: {
            code: 'INSERT_ERROR',
            message_en: error.message,
            message_ar: 'خطأ في إنشاء السجل',
          },
        });
        failedCount++;
      } else {
        results.push({
          row: rowResult.row,
          success: true,
          action: 'created',
          recordId: inserted?.id,
        });
        successCount++;
        createdCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        totalRows: importRequest.rows.length,
        successCount,
        failedCount,
        skippedCount,
        createdCount,
        updatedCount,
        results,
        importedAt: new Date().toISOString(),
        importId: crypto.randomUUID(),
        message_en: `Successfully imported ${successCount} of ${importRequest.rows.length} records`,
        message_ar: `تم استيراد ${successCount} من ${importRequest.rows.length} سجل بنجاح`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);

    return new Response(
      JSON.stringify({
        error: {
          code: 'IMPORT_ERROR',
          message_en: error instanceof Error ? error.message : 'An error occurred during import',
          message_ar: 'حدث خطأ أثناء الاستيراد',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
