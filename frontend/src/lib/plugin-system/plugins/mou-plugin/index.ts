/**
 * MoU Plugin - Main Definition
 *
 * Entity plugin for Memoranda of Understanding (MoU).
 * MoUs represent formal agreements between organizations with comprehensive workflow management.
 */

import { createElement } from 'react'
import {
  createPlugin,
  textField,
  enumField,
  dateField,
  numberField,
  booleanField,
  relationship,
} from '../../utils/createPlugin'
import type {
  EntityPlugin,
  ValidationContext,
  ValidationResult,
  PermissionContext,
  PermissionResult,
} from '../../types/plugin.types'
import type { MouExtension, MouWorkflowState } from './types'
import { MOU_WORKFLOW_STATE_LABELS } from './types'

// ============================================================================
// Plugin Definition
// ============================================================================

export const mouPlugin: EntityPlugin<MouExtension> = createPlugin<MouExtension>({
  id: 'mou',
  name: { en: 'Memorandum of Understanding', ar: 'مذكرة تفاهم' },
  description: {
    en: 'Manage formal agreements and memoranda of understanding with workflow tracking',
    ar: 'إدارة الاتفاقيات الرسمية ومذكرات التفاهم مع تتبع سير العمل',
  },
  entityType: 'mou',
  icon: 'FileSignature',
  color: 'purple',
  version: '1.0.0',

  // ============================================================================
  // Field Definitions
  // ============================================================================
  fields: [
    textField(
      'reference_number',
      { en: 'Reference Number', ar: 'الرقم المرجعي' },
      {
        required: true,
        validation: {
          pattern: '^MOU-\\d{4}-\\d{4}$',
          patternMessage: {
            en: 'Reference number must be in format: MOU-YYYY-NNNN (e.g., MOU-2024-0001)',
            ar: 'الرقم المرجعي يجب أن يكون بالتنسيق: MOU-YYYY-NNNN (مثال: MOU-2024-0001)',
          },
        },
        uiHints: {
          placeholder: { en: 'Auto-generated', ar: 'يتم إنشاؤه تلقائيًا' },
          helpText: {
            en: 'Automatically generated on creation',
            ar: 'يتم إنشاؤه تلقائيًا عند الإنشاء',
          },
          showInList: true,
          showInCard: true,
          sortable: true,
        },
      },
    ),

    enumField(
      'workflow_state',
      { en: 'Workflow State', ar: 'حالة سير العمل' },
      Object.entries(MOU_WORKFLOW_STATE_LABELS).map(([value, label]) => ({ value, label })),
      {
        required: true,
        default: 'draft',
        uiHints: {
          showInList: true,
          showInCard: true,
          filterable: true,
          sortable: true,
        },
      },
    ),

    textField(
      'primary_party_id',
      { en: 'Primary Party', ar: 'الطرف الأول' },
      {
        required: true,
        uiHints: {
          component: 'select',
          helpText: {
            en: 'The primary organization in this MoU',
            ar: 'المنظمة الأساسية في هذه المذكرة',
          },
          showInList: true,
          showInCard: true,
        },
      },
    ),

    textField(
      'secondary_party_id',
      { en: 'Secondary Party', ar: 'الطرف الثاني' },
      {
        required: true,
        uiHints: {
          component: 'select',
          helpText: {
            en: 'The secondary organization in this MoU',
            ar: 'المنظمة الثانوية في هذه المذكرة',
          },
          showInList: true,
          showInCard: true,
        },
      },
    ),

    textField(
      'document_url',
      { en: 'Document URL', ar: 'رابط الوثيقة' },
      {
        uiHints: {
          placeholder: { en: 'https://...', ar: 'https://...' },
          helpText: {
            en: 'Link to the MoU document',
            ar: 'رابط لوثيقة المذكرة',
          },
        },
      },
    ),

    numberField(
      'document_version',
      { en: 'Document Version', ar: 'إصدار الوثيقة' },
      {
        default: 1,
        validation: {
          min: 1,
        },
        uiHints: {
          helpText: {
            en: 'Current version number of the document',
            ar: 'رقم الإصدار الحالي للوثيقة',
          },
        },
      },
    ),

    dateField(
      'signing_date',
      { en: 'Signing Date', ar: 'تاريخ التوقيع' },
      {
        uiHints: {
          showInList: true,
          sortable: true,
          helpText: {
            en: 'Date when the MoU was signed',
            ar: 'تاريخ توقيع المذكرة',
          },
        },
      },
    ),

    dateField(
      'effective_date',
      { en: 'Effective Date', ar: 'تاريخ السريان' },
      {
        required: true,
        uiHints: {
          showInList: true,
          sortable: true,
          helpText: {
            en: 'Date when the MoU becomes effective',
            ar: 'تاريخ سريان المذكرة',
          },
        },
      },
    ),

    dateField(
      'expiry_date',
      { en: 'Expiry Date', ar: 'تاريخ الانتهاء' },
      {
        uiHints: {
          showInList: true,
          sortable: true,
          helpText: {
            en: 'Date when the MoU expires',
            ar: 'تاريخ انتهاء المذكرة',
          },
        },
      },
    ),

    booleanField(
      'auto_renewal',
      { en: 'Auto-Renewal', ar: 'التجديد التلقائي' },
      {
        default: false,
        uiHints: {
          component: 'switch',
          helpText: {
            en: 'Whether the MoU automatically renews upon expiration',
            ar: 'ما إذا كانت المذكرة تجدد تلقائيًا عند انتهاء صلاحيتها',
          },
          showInCard: true,
        },
      },
    ),

    numberField(
      'renewal_period_months',
      { en: 'Renewal Period (Months)', ar: 'فترة التجديد (أشهر)' },
      {
        validation: {
          min: 1,
        },
        uiHints: {
          helpText: {
            en: 'Number of months for each renewal period',
            ar: 'عدد الأشهر لكل فترة تجديد',
          },
        },
      },
    ),

    textField(
      'owner_id',
      { en: 'Owner', ar: 'المالك' },
      {
        required: true,
        uiHints: {
          component: 'select',
          helpText: {
            en: 'The person responsible for this MoU',
            ar: 'الشخص المسؤول عن هذه المذكرة',
          },
          showInList: true,
          filterable: true,
        },
      },
    ),
  ],

  // ============================================================================
  // Relationships
  // ============================================================================
  relationships: [
    relationship(
      'primary_party',
      { en: 'Primary Party', ar: 'الطرف الأول' },
      ['organization'],
      {
        cardinality: 'many-to-many',
        required: true,
      },
    ),
    relationship(
      'secondary_party',
      { en: 'Secondary Party', ar: 'الطرف الثاني' },
      ['organization'],
      {
        cardinality: 'many-to-many',
        required: true,
      },
    ),
    relationship(
      'related_engagement',
      { en: 'Related Engagement', ar: 'الارتباطات ذات الصلة' },
      ['engagement'],
      {
        cardinality: 'many-to-many',
      },
    ),
    relationship(
      'related_project',
      { en: 'Related Project', ar: 'المشاريع ذات الصلة' },
      ['project'],
      {
        cardinality: 'many-to-many',
      },
    ),
    relationship(
      'associated_country',
      { en: 'Associated Country', ar: 'الدولة المرتبطة' },
      ['country'],
      {
        cardinality: 'many-to-many',
      },
    ),
  ],

  // ============================================================================
  // Validation Hooks
  // ============================================================================
  validation: {
    beforeCreate: (context: ValidationContext<MouExtension>): ValidationResult => {
      const errors = []

      // Validate that primary and secondary parties are different
      if (
        context.entity.primary_party_id &&
        context.entity.secondary_party_id &&
        context.entity.primary_party_id === context.entity.secondary_party_id
      ) {
        errors.push({
          field: 'secondary_party_id',
          code: 'SAME_PARTIES',
          message: {
            en: 'Primary and secondary parties must be different organizations',
            ar: 'يجب أن يكون الطرف الأول والثاني منظمتين مختلفتين',
          },
        })
      }

      // Validate date logic
      if (context.entity.effective_date && context.entity.expiry_date) {
        const effectiveDate = new Date(context.entity.effective_date)
        const expiryDate = new Date(context.entity.expiry_date)

        if (expiryDate <= effectiveDate) {
          errors.push({
            field: 'expiry_date',
            code: 'INVALID_DATE_RANGE',
            message: {
              en: 'Expiry date must be after effective date',
              ar: 'يجب أن يكون تاريخ الانتهاء بعد تاريخ السريان',
            },
          })
        }
      }

      // Validate auto-renewal configuration
      if (context.entity.auto_renewal && !context.entity.renewal_period_months) {
        errors.push({
          field: 'renewal_period_months',
          code: 'MISSING_RENEWAL_PERIOD',
          message: {
            en: 'Renewal period is required when auto-renewal is enabled',
            ar: 'فترة التجديد مطلوبة عند تفعيل التجديد التلقائي',
          },
        })
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },

    beforeUpdate: (context: ValidationContext<MouExtension>): ValidationResult => {
      const errors = []

      // Reuse create validations
      const createValidation = mouPlugin.validation!.beforeCreate!(context)
      errors.push(...createValidation.errors)

      // Validate workflow state transitions
      if (context.previousVersion?.workflow_state !== context.entity.workflow_state) {
        const validTransitions: Record<MouWorkflowState, MouWorkflowState[]> = {
          draft: ['internal_review'],
          internal_review: ['external_review', 'draft'],
          external_review: ['negotiation', 'internal_review'],
          negotiation: ['signed', 'external_review'],
          signed: ['active'],
          active: ['renewed', 'expired'],
          renewed: ['active', 'expired'],
          expired: ['renewed'],
        }

        const fromState = context.previousVersion?.workflow_state as MouWorkflowState
        const toState = context.entity.workflow_state as MouWorkflowState
        const allowedTransitions = validTransitions[fromState] || []

        if (!allowedTransitions.includes(toState)) {
          errors.push({
            field: 'workflow_state',
            code: 'INVALID_WORKFLOW_TRANSITION',
            message: {
              en: `Cannot transition from ${fromState} to ${toState}`,
              ar: `لا يمكن الانتقال من ${MOU_WORKFLOW_STATE_LABELS[fromState]?.ar} إلى ${MOU_WORKFLOW_STATE_LABELS[toState]?.ar}`,
            },
          })
        }

        // Validate that signed/active states have required fields
        if (['signed', 'active'].includes(toState)) {
          if (!context.entity.signing_date) {
            errors.push({
              field: 'signing_date',
              code: 'MISSING_SIGNING_DATE',
              message: {
                en: 'Signing date is required for signed or active MoUs',
                ar: 'تاريخ التوقيع مطلوب للمذكرات الموقعة أو النشطة',
              },
            })
          }

          if (!context.entity.effective_date) {
            errors.push({
              field: 'effective_date',
              code: 'MISSING_EFFECTIVE_DATE',
              message: {
                en: 'Effective date is required for signed or active MoUs',
                ar: 'تاريخ السريان مطلوب للمذكرات الموقعة أو النشطة',
              },
            })
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },

    beforeDelete: (context: ValidationContext<MouExtension>): ValidationResult => {
      const errors = []

      // Prevent deletion of active or signed MoUs
      if (['active', 'signed'].includes(context.entity.workflow_state)) {
        errors.push({
          field: 'workflow_state',
          code: 'CANNOT_DELETE_ACTIVE',
          message: {
            en: 'Cannot delete active or signed MoUs. Archive them instead.',
            ar: 'لا يمكن حذف المذكرات النشطة أو الموقعة. قم بأرشفتها بدلاً من ذلك.',
          },
        })
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },

  // ============================================================================
  // Permission Hooks
  // ============================================================================
  permissions: {
    checkPermission: (context: PermissionContext<MouExtension>): PermissionResult => {
      const { action, entity, user } = context

      // Owner always has full access
      if (entity?.owner_id === user.id) {
        return { allowed: true }
      }

      // Role-based permissions
      switch (action) {
        case 'view':
          // All authenticated users can view
          return { allowed: true }

        case 'create':
          // Users with sufficient clearance can create
          return {
            allowed: user.clearanceLevel >= 2,
            reason: {
              en: 'Insufficient clearance level to create MoUs',
              ar: 'مستوى التصريح غير كافٍ لإنشاء المذكرات',
            },
          }

        case 'update':
          // Only owner or high clearance can update
          return {
            allowed: user.clearanceLevel >= 3,
            reason: {
              en: 'Insufficient clearance level to update MoUs',
              ar: 'مستوى التصريح غير كافٍ لتحديث المذكرات',
            },
          }

        case 'delete':
          // Only owner or admin can delete
          return {
            allowed: user.role === 'admin' || user.clearanceLevel >= 4,
            reason: {
              en: 'Only administrators can delete MoUs',
              ar: 'المسؤولون فقط يمكنهم حذف المذكرات',
            },
          }

        case 'archive':
          // Same as update
          return {
            allowed: user.clearanceLevel >= 3,
            reason: {
              en: 'Insufficient clearance level to archive MoUs',
              ar: 'مستوى التصريح غير كافٍ لأرشفة المذكرات',
            },
          }

        default:
          return { allowed: false }
      }
    },

    minViewClearance: 1,
    minEditClearance: 3,
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
        fields: ['name_en', 'name_ar', 'reference_number', 'workflow_state'],
      },
      {
        id: 'parties',
        title: { en: 'Parties', ar: 'الأطراف' },
        order: 1,
        fields: ['primary_party_id', 'secondary_party_id'],
      },
      {
        id: 'timeline',
        title: { en: 'Dates & Timeline', ar: 'التواريخ والجدول الزمني' },
        order: 2,
        fields: [
          'signing_date',
          'effective_date',
          'expiry_date',
          'auto_renewal',
          'renewal_period_months',
        ],
        collapsible: true,
      },
      {
        id: 'document',
        title: { en: 'Document', ar: 'الوثيقة' },
        order: 3,
        fields: ['document_url', 'document_version'],
        collapsible: true,
      },
      {
        id: 'management',
        title: { en: 'Management', ar: 'الإدارة' },
        order: 4,
        fields: ['owner_id', 'sensitivity_level', 'tags'],
        collapsible: true,
      },
      {
        id: 'details',
        title: { en: 'Details', ar: 'التفاصيل' },
        order: 5,
        fields: ['description_en', 'description_ar'],
        collapsible: true,
      },
    ],

    contextActions: [
      {
        id: 'submit_review',
        label: { en: 'Submit for Review', ar: 'تقديم للمراجعة' },
        icon: 'Send',
        action: async (entity) => {
          console.log('Submitting MoU for review:', entity.id)
        },
        isVisible: (entity) => entity.workflow_state === 'draft',
      },
      {
        id: 'approve',
        label: { en: 'Approve', ar: 'الموافقة' },
        icon: 'CheckCircle',
        action: async (entity) => {
          console.log('Approving MoU:', entity.id)
        },
        isVisible: (entity) =>
          entity.workflow_state === 'internal_review' || entity.workflow_state === 'external_review',
      },
      {
        id: 'sign',
        label: { en: 'Mark as Signed', ar: 'وضع علامة موقع' },
        icon: 'FileSignature',
        action: async (entity) => {
          console.log('Marking MoU as signed:', entity.id)
        },
        isVisible: (entity) => entity.workflow_state === 'negotiation',
        isDisabled: (entity) => !entity.signing_date,
      },
      {
        id: 'activate',
        label: { en: 'Activate', ar: 'تفعيل' },
        icon: 'Play',
        action: async (entity) => {
          console.log('Activating MoU:', entity.id)
        },
        isVisible: (entity) => entity.workflow_state === 'signed',
        isDisabled: (entity) => !entity.effective_date,
      },
      {
        id: 'renew',
        label: { en: 'Renew', ar: 'تجديد' },
        icon: 'RefreshCw',
        action: async (entity) => {
          console.log('Renewing MoU:', entity.id)
        },
        isVisible: (entity) => entity.workflow_state === 'active' || entity.workflow_state === 'expired',
      },
      {
        id: 'archive',
        label: { en: 'Archive', ar: 'أرشفة' },
        icon: 'Archive',
        action: async (entity) => {
          console.log('Archiving MoU:', entity.id)
        },
        isVisible: (entity) => entity.workflow_state === 'expired',
      },
    ],

    badges: [
      {
        id: 'workflow_state',
        position: 'top-end',
        render: (entity) => {
          const stateColors: Record<MouWorkflowState, string> = {
            draft: 'bg-gray-100 text-gray-800',
            internal_review: 'bg-blue-100 text-blue-800',
            external_review: 'bg-purple-100 text-purple-800',
            negotiation: 'bg-yellow-100 text-yellow-800',
            signed: 'bg-green-100 text-green-800',
            active: 'bg-emerald-100 text-emerald-800',
            renewed: 'bg-teal-100 text-teal-800',
            expired: 'bg-red-100 text-red-800',
          }

          const stateLabel = MOU_WORKFLOW_STATE_LABELS[entity.workflow_state as MouWorkflowState]
          const colorClass = stateColors[entity.workflow_state as MouWorkflowState]

          return createElement(
            'span',
            { className: `px-2 py-1 text-xs rounded ${colorClass}` },
            stateLabel?.en || entity.workflow_state,
          )
        },
      },
      {
        id: 'expiry_warning',
        position: 'bottom-start',
        render: (entity) => {
          if (!entity.expiry_date || entity.workflow_state === 'expired') {
            return null
          }

          const expiryDate = new Date(entity.expiry_date)
          const today = new Date()
          const daysUntilExpiry = Math.floor(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )

          // Show warning if expiring within 30 days
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            return createElement(
              'span',
              { className: 'px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded' },
              `Expires in ${daysUntilExpiry} days`,
            )
          }

          return null
        },
      },
      {
        id: 'auto_renewal',
        position: 'bottom-end',
        render: (entity) => {
          if (entity.auto_renewal) {
            return createElement(
              'span',
              { className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded' },
              'Auto-Renew',
            )
          }
          return null
        },
      },
    ],
  },

  // ============================================================================
  // Data Hooks
  // ============================================================================
  data: {
    endpoint: 'mous',
    transformForApi: (data) => {
      // Transform data for API (if needed)
      return data
    },
    transformFromApi: (data) => {
      // Transform data from API (if needed)
      return data as any
    },
  },

  // ============================================================================
  // i18n Namespace
  // ============================================================================
  i18nNamespace: 'mou',
})

// Export for registration
export default mouPlugin
