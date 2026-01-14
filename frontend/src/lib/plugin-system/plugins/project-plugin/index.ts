/**
 * Project Plugin - Main Definition
 *
 * Example entity plugin demonstrating the full plugin system capabilities.
 * Projects represent initiatives, research activities, or collaborations.
 */

import { createElement } from 'react'
import {
  createPlugin,
  textField,
  enumField,
  dateField,
  numberField,
  relationship,
} from '../../utils/createPlugin'
import type {
  EntityPlugin,
  ValidationContext,
  ValidationResult,
  PermissionContext,
  PermissionResult,
} from '../../types/plugin.types'
import type { ProjectExtension } from './types'
import { PROJECT_STATUS_LABELS, PROJECT_PRIORITY_LABELS, PROJECT_CATEGORY_LABELS } from './types'

// ============================================================================
// Plugin Definition
// ============================================================================

export const projectPlugin: EntityPlugin<ProjectExtension> = createPlugin<ProjectExtension>({
  id: 'project',
  name: { en: 'Project', ar: 'مشروع' },
  description: {
    en: 'Manage projects, initiatives, and collaborative activities',
    ar: 'إدارة المشاريع والمبادرات والأنشطة التعاونية',
  },
  entityType: 'project',
  icon: 'FolderKanban',
  color: 'blue',
  version: '1.0.0',

  // ============================================================================
  // Field Definitions
  // ============================================================================
  fields: [
    textField(
      'project_code',
      { en: 'Project Code', ar: 'رمز المشروع' },
      {
        required: true,
        validation: {
          pattern: '^[A-Z]{2,4}-\\d{4}-\\d{3}$',
          patternMessage: {
            en: 'Project code must be in format: XX-YYYY-NNN (e.g., PR-2024-001)',
            ar: 'رمز المشروع يجب أن يكون بالتنسيق: XX-YYYY-NNN (مثال: PR-2024-001)',
          },
        },
        uiHints: {
          placeholder: { en: 'e.g., PR-2024-001', ar: 'مثال: PR-2024-001' },
          showInList: true,
          showInCard: true,
          sortable: true,
        },
      },
    ),

    enumField(
      'project_status',
      { en: 'Project Status', ar: 'حالة المشروع' },
      Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
      {
        required: true,
        default: 'planning',
        uiHints: {
          showInList: true,
          showInCard: true,
          filterable: true,
          sortable: true,
        },
      },
    ),

    enumField(
      'priority',
      { en: 'Priority', ar: 'الأولوية' },
      Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
      {
        required: true,
        default: 'medium',
        uiHints: {
          showInList: true,
          showInCard: true,
          filterable: true,
        },
      },
    ),

    enumField(
      'category',
      { en: 'Category', ar: 'الفئة' },
      Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
      {
        required: true,
        uiHints: {
          showInList: true,
          filterable: true,
        },
      },
    ),

    dateField(
      'start_date',
      { en: 'Start Date', ar: 'تاريخ البدء' },
      {
        required: true,
        uiHints: {
          showInList: true,
          sortable: true,
        },
      },
    ),

    dateField(
      'end_date',
      { en: 'End Date', ar: 'تاريخ الانتهاء' },
      {
        uiHints: {
          showInList: true,
          sortable: true,
        },
      },
    ),

    numberField(
      'budget',
      { en: 'Budget', ar: 'الميزانية' },
      {
        validation: {
          min: 0,
        },
        uiHints: {
          helpText: {
            en: 'Enter the total project budget',
            ar: 'أدخل إجمالي ميزانية المشروع',
          },
        },
      },
    ),

    textField(
      'budget_currency',
      { en: 'Currency', ar: 'العملة' },
      {
        default: 'SAR',
        uiHints: {
          component: 'select',
          colSpan: 4,
        },
      },
    ),

    textField(
      'objectives_en',
      { en: 'Objectives (English)', ar: 'الأهداف (إنجليزي)' },
      {
        uiHints: {
          component: 'textarea',
          colSpan: 12,
        },
      },
    ),

    textField(
      'objectives_ar',
      { en: 'Objectives (Arabic)', ar: 'الأهداف (عربي)' },
      {
        uiHints: {
          component: 'textarea',
          colSpan: 12,
        },
      },
    ),

    textField(
      'deliverables_en',
      { en: 'Deliverables (English)', ar: 'المخرجات (إنجليزي)' },
      {
        uiHints: {
          component: 'textarea',
          colSpan: 12,
        },
      },
    ),

    textField(
      'deliverables_ar',
      { en: 'Deliverables (Arabic)', ar: 'المخرجات (عربي)' },
      {
        uiHints: {
          component: 'textarea',
          colSpan: 12,
        },
      },
    ),

    textField(
      'lead_organization_id',
      { en: 'Lead Organization', ar: 'المنظمة الرائدة' },
      {
        uiHints: {
          component: 'select',
          helpText: {
            en: 'Select the organization leading this project',
            ar: 'اختر المنظمة التي تقود هذا المشروع',
          },
        },
      },
    ),

    textField(
      'project_manager_id',
      { en: 'Project Manager', ar: 'مدير المشروع' },
      {
        uiHints: {
          component: 'select',
          helpText: {
            en: 'Select the person managing this project',
            ar: 'اختر الشخص المسؤول عن إدارة هذا المشروع',
          },
        },
      },
    ),

    numberField(
      'completion_percentage',
      { en: 'Completion %', ar: 'نسبة الإنجاز' },
      {
        default: 0,
        validation: {
          min: 0,
          max: 100,
        },
        uiHints: {
          component: 'slider',
          showInCard: true,
        },
      },
    ),
  ],

  // ============================================================================
  // Relationships
  // ============================================================================
  relationships: [
    relationship('lead_by', { en: 'Led By', ar: 'بقيادة' }, ['organization'], {
      cardinality: 'one-to-one',
      required: false,
    }),
    relationship('managed_by', { en: 'Managed By', ar: 'يدار بواسطة' }, ['person'], {
      cardinality: 'one-to-one',
    }),
    relationship(
      'involves',
      { en: 'Involves', ar: 'يشمل' },
      ['person', 'organization', 'country'],
      {
        cardinality: 'many-to-many',
      },
    ),
    relationship('related_to', { en: 'Related To', ar: 'مرتبط بـ' }, ['project', 'engagement'], {
      cardinality: 'many-to-many',
    }),
  ],

  // ============================================================================
  // Validation
  // ============================================================================
  validation: {
    async beforeCreate(context: ValidationContext<ProjectExtension>): Promise<ValidationResult> {
      const errors = []
      const entity = context.entity

      // Validate date range
      if (entity.start_date && entity.end_date) {
        const start = new Date(entity.start_date)
        const end = new Date(entity.end_date)
        if (end < start) {
          errors.push({
            field: 'end_date',
            code: 'INVALID_DATE_RANGE',
            message: {
              en: 'End date must be after start date',
              ar: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء',
            },
          })
        }
      }

      // Completed projects should have 100% completion
      if (entity.project_status === 'completed' && entity.completion_percentage !== 100) {
        errors.push({
          field: 'completion_percentage',
          code: 'COMPLETION_MISMATCH',
          message: {
            en: 'Completed projects should have 100% completion',
            ar: 'المشاريع المكتملة يجب أن تكون نسبة إنجازها 100%',
          },
        })
      }

      return { valid: errors.length === 0, errors }
    },

    async beforeUpdate(context: ValidationContext<ProjectExtension>): Promise<ValidationResult> {
      const errors = []
      const entity = context.entity
      const previous = context.previousVersion

      // Cannot revert completed projects to earlier status
      if (previous?.project_status === 'completed' && entity.project_status !== 'completed') {
        errors.push({
          field: 'project_status',
          code: 'INVALID_STATUS_CHANGE',
          message: {
            en: 'Completed projects cannot be reverted to an earlier status',
            ar: 'المشاريع المكتملة لا يمكن إعادتها إلى حالة سابقة',
          },
        })
      }

      return { valid: errors.length === 0, errors }
    },

    async beforeDelete(context: ValidationContext<ProjectExtension>): Promise<ValidationResult> {
      const errors = []
      const entity = context.entity

      // Cannot delete active projects
      if (entity.project_status === 'active') {
        errors.push({
          field: 'project_status',
          code: 'CANNOT_DELETE_ACTIVE',
          message: {
            en: 'Active projects cannot be deleted. Please complete or cancel first.',
            ar: 'المشاريع النشطة لا يمكن حذفها. يرجى إكمالها أو إلغائها أولاً.',
          },
        })
      }

      return { valid: errors.length === 0, errors }
    },
  },

  // ============================================================================
  // Permissions
  // ============================================================================
  permissions: {
    async checkPermission(context: PermissionContext<ProjectExtension>): Promise<PermissionResult> {
      const { action, entity, user } = context

      // Only project managers can update their projects
      if (action === 'update' && entity && entity.project_manager_id) {
        if (entity.project_manager_id !== user.id && user.role !== 'admin') {
          return {
            allowed: false,
            reason: {
              en: 'Only the project manager can update this project',
              ar: 'فقط مدير المشروع يمكنه تحديث هذا المشروع',
            },
          }
        }
      }

      // Critical projects require manager role
      if (entity?.priority === 'critical' && !['admin', 'manager'].includes(user.role)) {
        if (['update', 'delete', 'archive'].includes(action)) {
          return {
            allowed: false,
            reason: {
              en: 'Critical projects can only be modified by managers',
              ar: 'المشاريع الحرجة يمكن تعديلها فقط من قبل المديرين',
            },
          }
        }
      }

      return { allowed: true }
    },

    additionalActions: [
      {
        action: 'assign_team',
        label: { en: 'Assign Team', ar: 'تعيين الفريق' },
        description: {
          en: 'Assign team members to this project',
          ar: 'تعيين أعضاء الفريق لهذا المشروع',
        },
      },
      {
        action: 'generate_report',
        label: { en: 'Generate Report', ar: 'إنشاء تقرير' },
        description: {
          en: 'Generate a status report for this project',
          ar: 'إنشاء تقرير حالة لهذا المشروع',
        },
      },
    ],

    minViewClearance: 1,
    minEditClearance: 2,

    roleOverrides: {
      analyst: ['view', 'create', 'update', 'export'],
      viewer: ['view'],
    },
  },

  // ============================================================================
  // UI Configuration
  // ============================================================================
  ui: {
    formSections: [
      {
        id: 'basic',
        title: { en: 'Basic Information', ar: 'المعلومات الأساسية' },
        order: 0,
        fields: ['name_en', 'name_ar', 'project_code'],
      },
      {
        id: 'classification',
        title: { en: 'Classification', ar: 'التصنيف' },
        order: 1,
        fields: ['project_status', 'priority', 'category', 'sensitivity_level'],
      },
      {
        id: 'timeline',
        title: { en: 'Timeline & Budget', ar: 'الجدول الزمني والميزانية' },
        order: 2,
        fields: ['start_date', 'end_date', 'budget', 'budget_currency', 'completion_percentage'],
        collapsible: true,
      },
      {
        id: 'details',
        title: { en: 'Details', ar: 'التفاصيل' },
        order: 3,
        fields: ['objectives_en', 'objectives_ar', 'deliverables_en', 'deliverables_ar'],
        collapsible: true,
      },
      {
        id: 'team',
        title: { en: 'Team', ar: 'الفريق' },
        order: 4,
        fields: ['lead_organization_id', 'project_manager_id'],
        collapsible: true,
      },
      {
        id: 'meta',
        title: { en: 'Additional', ar: 'إضافي' },
        order: 5,
        fields: ['tags', 'description_en', 'description_ar'],
        collapsible: true,
      },
    ],

    contextActions: [
      {
        id: 'mark_complete',
        label: { en: 'Mark as Complete', ar: 'وضع علامة مكتمل' },
        icon: 'CheckCircle',
        action: async (entity) => {
          // This would trigger an update
          console.log('Marking project as complete:', entity.id)
        },
        isVisible: (entity) => entity.project_status === 'active',
        isDisabled: (entity) => (entity.completion_percentage || 0) < 100,
      },
      {
        id: 'put_on_hold',
        label: { en: 'Put On Hold', ar: 'وضع قيد الانتظار' },
        icon: 'PauseCircle',
        action: async (entity) => {
          console.log('Putting project on hold:', entity.id)
        },
        isVisible: (entity) => entity.project_status === 'active',
      },
      {
        id: 'cancel',
        label: { en: 'Cancel Project', ar: 'إلغاء المشروع' },
        icon: 'XCircle',
        action: async (entity) => {
          console.log('Cancelling project:', entity.id)
        },
        isVisible: (entity) => !['completed', 'cancelled'].includes(entity.project_status),
        variant: 'destructive',
      },
    ],

    badges: [
      {
        id: 'priority',
        position: 'top-end',
        render: (entity) => {
          if (entity.priority === 'critical') {
            return createElement(
              'span',
              { className: 'px-2 py-1 text-xs bg-red-100 text-red-800 rounded' },
              'Critical',
            )
          }
          if (entity.priority === 'high') {
            return createElement(
              'span',
              { className: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded' },
              'High Priority',
            )
          }
          return null
        },
      },
      {
        id: 'overdue',
        position: 'bottom-start',
        render: (entity) => {
          if (
            entity.end_date &&
            new Date(entity.end_date) < new Date() &&
            entity.project_status === 'active'
          ) {
            return createElement(
              'span',
              { className: 'px-2 py-1 text-xs bg-red-100 text-red-800 rounded' },
              'Overdue',
            )
          }
          return null
        },
      },
    ],
  },

  // ============================================================================
  // Data Configuration
  // ============================================================================
  data: {
    endpoint: 'projects',
    searchParams: [
      enumField(
        'project_status',
        { en: 'Status', ar: 'الحالة' },
        Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        { uiHints: { filterable: true } },
      ),
      enumField(
        'priority',
        { en: 'Priority', ar: 'الأولوية' },
        Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
        { uiHints: { filterable: true } },
      ),
      enumField(
        'category',
        { en: 'Category', ar: 'الفئة' },
        Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
        { uiHints: { filterable: true } },
      ),
    ],
  },

  // ============================================================================
  // Lifecycle
  // ============================================================================
  lifecycle: {
    onRegister: () => {
      console.log('Project plugin registered')
    },
    onEnable: () => {
      console.log('Project plugin enabled')
    },
    onDisable: () => {
      console.log('Project plugin disabled')
    },
    onUnregister: () => {
      console.log('Project plugin unregistered')
    },
  },

  i18nNamespace: 'projects',
})

// Export types
export * from './types'

// Export the plugin as default
export default projectPlugin
