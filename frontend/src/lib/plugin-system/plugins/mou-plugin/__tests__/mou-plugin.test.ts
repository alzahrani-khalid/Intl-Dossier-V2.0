/**
 * MoU Plugin - Integration Tests
 *
 * Comprehensive test suite for the MoU plugin, covering:
 * - Plugin manifest and structure
 * - Field definitions and validation
 * - Validation hooks (beforeCreate, beforeUpdate, beforeDelete)
 * - Permission checks
 * - Relationship definitions
 * - UI configuration
 */

import { describe, it, expect } from 'vitest'
import { mouPlugin } from '../index'
import type { ValidationContext, PermissionContext, BaseDossier } from '../../../types/plugin.types'
import type { MouExtension, MouWorkflowState } from '../types'

// Helper function to create test MoU entity
const createTestMou = (overrides?: Partial<MouExtension>): BaseDossier & MouExtension => ({
  // Base dossier fields
  id: 'test-mou-id',
  type: 'mou',
  name_en: 'Test MoU',
  name_ar: 'مذكرة تفاهم تجريبية',
  description_en: 'Test MoU description',
  description_ar: 'وصف مذكرة التفاهم التجريبية',
  status: 'active',
  sensitivity_level: 'medium',
  tags: ['test'],
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),

  // MoU-specific fields
  reference_number: 'MOU-2024-0001',
  workflow_state: 'draft',
  primary_party_id: 'org-1',
  secondary_party_id: 'org-2',
  document_url: 'https://example.com/mou.pdf',
  document_version: 1,
  effective_date: '2024-01-01',
  owner_id: 'user-1',

  ...overrides,
})

// Helper function to create test validation context
const createValidationContext = (
  entity: BaseDossier & MouExtension,
  isCreate = true,
  previousVersion?: BaseDossier & MouExtension,
): ValidationContext<MouExtension> => ({
  entity,
  isCreate,
  previousVersion,
  user: {
    id: 'user-1',
    role: 'user',
    clearanceLevel: 3,
  },
})

// Helper function to create test permission context
const createPermissionContext = (
  action: 'view' | 'create' | 'update' | 'delete' | 'archive',
  entity?: BaseDossier & MouExtension,
  clearanceLevel = 3,
): PermissionContext<MouExtension> => ({
  action,
  entity,
  user: {
    id: 'user-1',
    role: 'user',
    clearanceLevel,
  },
})

describe('MoU Plugin - Integration Tests', () => {
  // ============================================================================
  // Plugin Manifest Tests
  // ============================================================================
  describe('Plugin Manifest', () => {
    it('should have valid plugin metadata', () => {
      expect(mouPlugin.manifest.id).toBe('mou')
      expect(mouPlugin.manifest.entityType).toBe('mou')
      expect(mouPlugin.manifest.version).toBe('1.0.0')
      expect(mouPlugin.manifest.icon).toBe('FileSignature')
      expect(mouPlugin.manifest.color).toBe('purple')
    })

    it('should have bilingual name and description', () => {
      expect(mouPlugin.manifest.name.en).toBe('Memorandum of Understanding')
      expect(mouPlugin.manifest.name.ar).toBe('مذكرة تفاهم')
      expect(mouPlugin.manifest.description.en).toBeTruthy()
      expect(mouPlugin.manifest.description.ar).toBeTruthy()
    })

    it('should have extension schema with all required fields', () => {
      const fieldNames = mouPlugin.manifest.extensionSchema.fields.map((f) => f.name)

      expect(fieldNames).toContain('reference_number')
      expect(fieldNames).toContain('workflow_state')
      expect(fieldNames).toContain('primary_party_id')
      expect(fieldNames).toContain('secondary_party_id')
      expect(fieldNames).toContain('effective_date')
      expect(fieldNames).toContain('owner_id')
    })

    it('should mark required fields correctly', () => {
      const requiredFields = mouPlugin.manifest.extensionSchema.fields
        .filter((f) => f.required)
        .map((f) => f.name)

      expect(requiredFields).toContain('reference_number')
      expect(requiredFields).toContain('workflow_state')
      expect(requiredFields).toContain('primary_party_id')
      expect(requiredFields).toContain('secondary_party_id')
      expect(requiredFields).toContain('effective_date')
      expect(requiredFields).toContain('owner_id')
    })

    it('should have reference_number pattern validation', () => {
      const refNumberField = mouPlugin.manifest.extensionSchema.fields.find(
        (f) => f.name === 'reference_number',
      )

      expect(refNumberField).toBeDefined()
      expect(refNumberField?.validation?.pattern).toBe('^MOU-\\d{4}-\\d{4}$')
      expect(refNumberField?.validation?.patternMessage?.en).toBeTruthy()
      expect(refNumberField?.validation?.patternMessage?.ar).toBeTruthy()
    })
  })

  // ============================================================================
  // Validation Hooks - beforeCreate
  // ============================================================================
  describe('Validation Hooks - beforeCreate', () => {
    it('should pass validation for valid MoU', () => {
      const entity = createTestMou()
      const context = createValidationContext(entity, true)

      const result = mouPlugin.validation?.beforeCreate?.(context)

      expect(result?.valid).toBe(true)
      expect(result?.errors).toHaveLength(0)
    })

    it('should reject when primary and secondary parties are the same', () => {
      const entity = createTestMou({
        primary_party_id: 'org-1',
        secondary_party_id: 'org-1', // Same as primary
      })
      const context = createValidationContext(entity, true)

      const result = mouPlugin.validation?.beforeCreate?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors).toHaveLength(1)
      expect(result?.errors[0]?.code).toBe('SAME_PARTIES')
      expect(result?.errors[0]?.field).toBe('secondary_party_id')
    })

    it('should reject when expiry_date is before effective_date', () => {
      const entity = createTestMou({
        effective_date: '2024-12-31',
        expiry_date: '2024-01-01', // Before effective date
      })
      const context = createValidationContext(entity, true)

      const result = mouPlugin.validation?.beforeCreate?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors.length).toBeGreaterThan(0)
      expect(result?.errors.some((e) => e.code === 'INVALID_DATE_RANGE')).toBe(true)
    })

    it('should reject when auto_renewal is true but renewal_period_months is missing', () => {
      const entity = createTestMou({
        auto_renewal: true,
        renewal_period_months: undefined,
      })
      const context = createValidationContext(entity, true)

      const result = mouPlugin.validation?.beforeCreate?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors.length).toBeGreaterThan(0)
      expect(result?.errors.some((e) => e.code === 'MISSING_RENEWAL_PERIOD')).toBe(true)
    })

    it('should accept when auto_renewal is true with valid renewal_period_months', () => {
      const entity = createTestMou({
        auto_renewal: true,
        renewal_period_months: 12,
      })
      const context = createValidationContext(entity, true)

      const result = mouPlugin.validation?.beforeCreate?.(context)

      expect(result?.valid).toBe(true)
      expect(result?.errors).toHaveLength(0)
    })
  })

  // ============================================================================
  // Validation Hooks - beforeUpdate
  // ============================================================================
  describe('Validation Hooks - beforeUpdate', () => {
    it('should pass validation for valid update', () => {
      const previous = createTestMou({ workflow_state: 'draft' })
      const updated = createTestMou({ workflow_state: 'internal_review' })
      const context = createValidationContext(updated, false, previous)

      const result = mouPlugin.validation?.beforeUpdate?.(context)

      expect(result?.valid).toBe(true)
      expect(result?.errors).toHaveLength(0)
    })

    it('should allow draft -> internal_review transition', () => {
      const previous = createTestMou({ workflow_state: 'draft' })
      const updated = createTestMou({ workflow_state: 'internal_review' })
      const context = createValidationContext(updated, false, previous)

      const result = mouPlugin.validation?.beforeUpdate?.(context)

      expect(result?.valid).toBe(true)
    })

    it('should allow internal_review -> external_review transition', () => {
      const previous = createTestMou({ workflow_state: 'internal_review' })
      const updated = createTestMou({ workflow_state: 'external_review' })
      const context = createValidationContext(updated, false, previous)

      const result = mouPlugin.validation?.beforeUpdate?.(context)

      expect(result?.valid).toBe(true)
    })

    it('should reject invalid workflow transition (draft -> signed)', () => {
      const previous = createTestMou({ workflow_state: 'draft' })
      const updated = createTestMou({ workflow_state: 'signed' })
      const context = createValidationContext(updated, false, previous)

      const result = mouPlugin.validation?.beforeUpdate?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors.some((e) => e.code === 'INVALID_WORKFLOW_TRANSITION')).toBe(true)
    })

    it('should reject transition to signed without signing_date', () => {
      const previous = createTestMou({ workflow_state: 'negotiation' })
      const updated = createTestMou({
        workflow_state: 'signed',
        signing_date: undefined,
      })
      const context = createValidationContext(updated, false, previous)

      const result = mouPlugin.validation?.beforeUpdate?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors.some((e) => e.code === 'MISSING_SIGNING_DATE')).toBe(true)
    })

    it('should reject transition to active without effective_date', () => {
      const previous = createTestMou({
        workflow_state: 'signed',
        signing_date: '2024-01-01',
      })
      const updated = createTestMou({
        workflow_state: 'active',
        signing_date: '2024-01-01',
        effective_date: undefined,
      })
      const context = createValidationContext(updated, false, previous)

      const result = mouPlugin.validation?.beforeUpdate?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors.some((e) => e.code === 'MISSING_EFFECTIVE_DATE')).toBe(true)
    })

    it('should allow transition to signed with signing_date', () => {
      const previous = createTestMou({ workflow_state: 'negotiation' })
      const updated = createTestMou({
        workflow_state: 'signed',
        signing_date: '2024-01-01',
      })
      const context = createValidationContext(updated, false, previous)

      const result = mouPlugin.validation?.beforeUpdate?.(context)

      expect(result?.valid).toBe(true)
    })
  })

  // ============================================================================
  // Validation Hooks - beforeDelete
  // ============================================================================
  describe('Validation Hooks - beforeDelete', () => {
    it('should allow deletion of draft MoU', () => {
      const entity = createTestMou({ workflow_state: 'draft' })
      const context = createValidationContext(entity, false)

      const result = mouPlugin.validation?.beforeDelete?.(context)

      expect(result?.valid).toBe(true)
      expect(result?.errors).toHaveLength(0)
    })

    it('should allow deletion of expired MoU', () => {
      const entity = createTestMou({ workflow_state: 'expired' })
      const context = createValidationContext(entity, false)

      const result = mouPlugin.validation?.beforeDelete?.(context)

      expect(result?.valid).toBe(true)
    })

    it('should reject deletion of active MoU', () => {
      const entity = createTestMou({ workflow_state: 'active' })
      const context = createValidationContext(entity, false)

      const result = mouPlugin.validation?.beforeDelete?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors.some((e) => e.code === 'CANNOT_DELETE_ACTIVE')).toBe(true)
    })

    it('should reject deletion of signed MoU', () => {
      const entity = createTestMou({ workflow_state: 'signed' })
      const context = createValidationContext(entity, false)

      const result = mouPlugin.validation?.beforeDelete?.(context)

      expect(result?.valid).toBe(false)
      expect(result?.errors.some((e) => e.code === 'CANNOT_DELETE_ACTIVE')).toBe(true)
    })
  })

  // ============================================================================
  // Permission Hooks
  // ============================================================================
  describe('Permission Hooks', () => {
    it('should allow owner to view their MoU', () => {
      const entity = createTestMou({ owner_id: 'user-1' })
      const context = createPermissionContext('view', entity)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(true)
    })

    it('should allow any authenticated user to view MoU', () => {
      const entity = createTestMou({ owner_id: 'other-user' })
      const context = createPermissionContext('view', entity, 1)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(true)
    })

    it('should allow user with clearance level 2+ to create MoU', () => {
      const context = createPermissionContext('create', undefined, 2)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(true)
    })

    it('should reject user with clearance level 1 from creating MoU', () => {
      const context = createPermissionContext('create', undefined, 1)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(false)
      expect(result?.reason?.en).toBeTruthy()
    })

    it('should allow user with clearance level 3+ to update MoU', () => {
      const entity = createTestMou({ owner_id: 'other-user' })
      const context = createPermissionContext('update', entity, 3)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(true)
    })

    it('should reject user with clearance level 2 from updating MoU', () => {
      const entity = createTestMou({ owner_id: 'other-user' })
      const context = createPermissionContext('update', entity, 2)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(false)
    })

    it('should allow owner to update their MoU regardless of clearance', () => {
      const entity = createTestMou({ owner_id: 'user-1' })
      const context = createPermissionContext('update', entity, 1)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(true)
    })

    it('should allow admin to delete MoU', () => {
      const entity = createTestMou({ owner_id: 'other-user' })
      const context: PermissionContext<MouExtension> = {
        action: 'delete',
        entity,
        user: {
          id: 'admin-1',
          role: 'admin',
          clearanceLevel: 3,
        },
      }

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(true)
    })

    it('should allow user with clearance level 4+ to delete MoU', () => {
      const entity = createTestMou({ owner_id: 'other-user' })
      const context = createPermissionContext('delete', entity, 4)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(true)
    })

    it('should reject user with clearance level 3 from deleting MoU', () => {
      const entity = createTestMou({ owner_id: 'other-user' })
      const context = createPermissionContext('delete', entity, 3)

      const result = mouPlugin.permissions?.checkPermission?.(context)

      expect(result?.allowed).toBe(false)
    })

    it('should have minimum clearance levels defined', () => {
      expect(mouPlugin.permissions?.minViewClearance).toBe(1)
      expect(mouPlugin.permissions?.minEditClearance).toBe(3)
    })
  })

  // ============================================================================
  // Relationship Definitions
  // ============================================================================
  describe('Relationship Definitions', () => {
    it('should define primary_party relationship', () => {
      const primaryParty = mouPlugin.relationships?.definitions.find(
        (r) => r.type === 'primary_party',
      )

      expect(primaryParty).toBeDefined()
      expect(primaryParty?.targetEntityTypes).toContain('organization')
      expect(primaryParty?.cardinality).toBe('many-to-many')
      expect(primaryParty?.required).toBe(true)
    })

    it('should define secondary_party relationship', () => {
      const secondaryParty = mouPlugin.relationships?.definitions.find(
        (r) => r.type === 'secondary_party',
      )

      expect(secondaryParty).toBeDefined()
      expect(secondaryParty?.targetEntityTypes).toContain('organization')
      expect(secondaryParty?.cardinality).toBe('many-to-many')
      expect(secondaryParty?.required).toBe(true)
    })

    it('should define related_engagement relationship', () => {
      const relatedEngagement = mouPlugin.relationships?.definitions.find(
        (r) => r.type === 'related_engagement',
      )

      expect(relatedEngagement).toBeDefined()
      expect(relatedEngagement?.targetEntityTypes).toContain('engagement')
      expect(relatedEngagement?.cardinality).toBe('many-to-many')
      expect(relatedEngagement?.required).toBe(false)
    })

    it('should define related_project relationship', () => {
      const relatedProject = mouPlugin.relationships?.definitions.find(
        (r) => r.type === 'related_project',
      )

      expect(relatedProject).toBeDefined()
      expect(relatedProject?.targetEntityTypes).toContain('project')
      expect(relatedProject?.cardinality).toBe('many-to-many')
    })

    it('should define associated_country relationship', () => {
      const associatedCountry = mouPlugin.relationships?.definitions.find(
        (r) => r.type === 'associated_country',
      )

      expect(associatedCountry).toBeDefined()
      expect(associatedCountry?.targetEntityTypes).toContain('country')
      expect(associatedCountry?.cardinality).toBe('many-to-many')
    })

    it('should have bilingual labels for all relationships', () => {
      const allRelationships = mouPlugin.relationships?.definitions || []

      allRelationships.forEach((rel) => {
        expect(rel.label.en).toBeTruthy()
        expect(rel.label.ar).toBeTruthy()
      })
    })
  })

  // ============================================================================
  // UI Configuration
  // ============================================================================
  describe('UI Configuration', () => {
    it('should define form sections', () => {
      const formSections = mouPlugin.ui?.formSections || []

      expect(formSections.length).toBeGreaterThan(0)
      expect(formSections.some((s) => s.id === 'basic')).toBe(true)
      expect(formSections.some((s) => s.id === 'parties')).toBe(true)
      expect(formSections.some((s) => s.id === 'timeline')).toBe(true)
    })

    it('should have bilingual form section titles', () => {
      const formSections = mouPlugin.ui?.formSections || []

      formSections.forEach((section) => {
        expect(section.title.en).toBeTruthy()
        expect(section.title.ar).toBeTruthy()
      })
    })

    it('should define context actions', () => {
      const contextActions = mouPlugin.ui?.contextActions || []

      expect(contextActions.length).toBeGreaterThan(0)
      expect(contextActions.some((a) => a.id === 'submit_review')).toBe(true)
      expect(contextActions.some((a) => a.id === 'approve')).toBe(true)
      expect(contextActions.some((a) => a.id === 'sign')).toBe(true)
      expect(contextActions.some((a) => a.id === 'activate')).toBe(true)
      expect(contextActions.some((a) => a.id === 'renew')).toBe(true)
    })

    it('should have visibility rules for context actions', () => {
      const contextActions = mouPlugin.ui?.contextActions || []

      contextActions.forEach((action) => {
        expect(action.isVisible).toBeDefined()
      })
    })

    it('should define badges', () => {
      const badges = mouPlugin.ui?.badges || []

      expect(badges.length).toBeGreaterThan(0)
      expect(badges.some((b) => b.id === 'workflow_state')).toBe(true)
      expect(badges.some((b) => b.id === 'expiry_warning')).toBe(true)
      expect(badges.some((b) => b.id === 'auto_renewal')).toBe(true)
    })

    it('should render workflow_state badge', () => {
      const badge = mouPlugin.ui?.badges?.find((b) => b.id === 'workflow_state')
      const entity = createTestMou({ workflow_state: 'active' })

      const rendered = badge?.render(entity)

      expect(rendered).toBeTruthy()
    })

    it('should render expiry_warning badge for expiring MoU', () => {
      const badge = mouPlugin.ui?.badges?.find((b) => b.id === 'expiry_warning')
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 15) // 15 days from now
      const entity = createTestMou({
        workflow_state: 'active',
        expiry_date: futureDate.toISOString().split('T')[0],
      })

      const rendered = badge?.render(entity)

      expect(rendered).toBeTruthy()
    })

    it('should not render expiry_warning badge for non-expiring MoU', () => {
      const badge = mouPlugin.ui?.badges?.find((b) => b.id === 'expiry_warning')
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1) // 1 year from now
      const entity = createTestMou({
        workflow_state: 'active',
        expiry_date: futureDate.toISOString().split('T')[0],
      })

      const rendered = badge?.render(entity)

      expect(rendered).toBeNull()
    })

    it('should render auto_renewal badge when enabled', () => {
      const badge = mouPlugin.ui?.badges?.find((b) => b.id === 'auto_renewal')
      const entity = createTestMou({ auto_renewal: true })

      const rendered = badge?.render(entity)

      expect(rendered).toBeTruthy()
    })

    it('should not render auto_renewal badge when disabled', () => {
      const badge = mouPlugin.ui?.badges?.find((b) => b.id === 'auto_renewal')
      const entity = createTestMou({ auto_renewal: false })

      const rendered = badge?.render(entity)

      expect(rendered).toBeNull()
    })
  })

  // ============================================================================
  // Data Hooks
  // ============================================================================
  describe('Data Hooks', () => {
    it('should define endpoint', () => {
      expect(mouPlugin.data?.endpoint).toBe('mous')
    })

    it('should have transformForApi function', () => {
      expect(mouPlugin.data?.transformForApi).toBeDefined()
    })

    it('should have transformFromApi function', () => {
      expect(mouPlugin.data?.transformFromApi).toBeDefined()
    })
  })

  // ============================================================================
  // i18n Configuration
  // ============================================================================
  describe('i18n Configuration', () => {
    it('should define i18n namespace', () => {
      expect(mouPlugin.i18nNamespace).toBe('mou')
    })
  })
})
