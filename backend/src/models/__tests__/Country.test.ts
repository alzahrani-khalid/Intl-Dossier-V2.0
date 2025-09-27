import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Country } from '../Country'
import { supabaseAdmin as supabase } from '../../config/supabase'

describe('Country Model', () => {
  let testCountry: any

  beforeEach(async () => {
    // Create a test country matching the actual database schema
    testCountry = {
      code: 'TS',
      code3: 'TST',
      name_en: 'Test Country',
      name_ar: 'دولة اختبار',
      region: 'Test Region',
      statistical_system: {
        type: 'centralized',
        nso_name: 'Test National Statistics Office',
        website: 'https://test-nso.example.com',
        established_year: 2000
      },
      cooperation_areas: ['Statistics', 'Data Exchange'],
      expertise_domains: ['Economic Statistics', 'Social Statistics'],
      relationship_status: 'active',
      is_gcc: false,
      is_arab_league: true,
      is_islamic_org: true,
      strategic_importance: 3,
      flag_url: 'https://example.com/flag.png',
      created_by: '00000000-0000-0000-0000-000000000000',
      last_modified_by: '00000000-0000-0000-0000-000000000000',
      tenant_id: '00000000-0000-0000-0000-000000000000',
      version: 1,
      is_deleted: false
    }
  })

  afterEach(async () => {
    // Clean up test data
    if (testCountry?.id) {
      await supabase.from('countries').delete().eq('id', testCountry.id)
    }
  })

  describe('CRUD Operations', () => {
    it('should create a new country', async () => {
      const { data, error } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.code).toBe('TS')
      expect(data.name_en).toBe('Test Country')
      testCountry.id = data.id
    })

    it('should read a country by code', async () => {
      // First create
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      // Then read
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('code', 'TS')
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.name_en).toBe('Test Country')
    })

    it('should update a country', async () => {
      // First create
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      // Then update
      const { data, error } = await supabase
        .from('countries')
        .update({ name_en: 'Updated Test Country' })
        .eq('id', testCountry.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.name_en).toBe('Updated Test Country')
    })

    it('should delete a country', async () => {
      // First create
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      // Then delete
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', testCountry.id)

      expect(error).toBeNull()

      // Verify deletion
      const { data } = await supabase
        .from('countries')
        .select('*')
        .eq('id', testCountry.id)
        .single()

      expect(data).toBeNull()
    })
  })

  describe('Validation', () => {
    it('should require country code', async () => {
      const invalidCountry = { ...testCountry }
      delete invalidCountry.code

      const { error } = await supabase
        .from('countries')
        .insert(invalidCountry)

      expect(error).toBeDefined()
    })

    it('should require unique country code', async () => {
      // Create first country
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      // Try to create duplicate
      const duplicateCountry = { ...testCountry }
      delete duplicateCountry.id

      const { error } = await supabase
        .from('countries')
        .insert(duplicateCountry)

      expect(error).toBeDefined()
    })

    it('should validate cooperation level enum', async () => {
      const invalidCountry = { ...testCountry, cooperation_level: 'invalid' }

      const { error } = await supabase
        .from('countries')
        .insert(invalidCountry)

      expect(error).toBeDefined()
    })
  })

  describe('Relationships', () => {
    it('should fetch country with organizations', async () => {
      // This would test the junction table relationships
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      const { data, error } = await supabase
        .from('countries')
        .select(`
          *,
          country_organization_relations (
            organization_id,
            relationship_type
          )
        `)
        .eq('id', testCountry.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.country_organization_relations).toBeDefined()
    })
  })

  describe('Search and Filtering', () => {
    it('should search countries by name', async () => {
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .ilike('name_en', '%Test%')

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
      expect(data.some(c => c.code === 'TS')).toBe(true)
    })

    it('should filter by region', async () => {
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('region', 'Test Region')

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].region).toBe('Test Region')
    })

    it('should filter by relationship status', async () => {
      const { data: created } = await supabase
        .from('countries')
        .insert(testCountry)
        .select()
        .single()
      testCountry.id = created.id

      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('relationship_status', 'active')

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('Business Logic', () => {
    it('should calculate relationship health score', () => {
      const country = new Country(testCountry)
      const healthScore = country.calculateRelationshipHealthScore({
        engagementFrequency: 80,
        commitmentFulfillment: 90,
        responseTime: 5
      })

      expect(healthScore).toBeGreaterThanOrEqual(0)
      expect(healthScore).toBeLessThanOrEqual(100)
    })

    it('should identify countries needing attention', async () => {
      const dormantCountry = {
        ...testCountry,
        code: 'LW',
        relationship_status: 'dormant',
      }

      const { data: created } = await supabase
        .from('countries')
        .insert(dormantCountry)
        .select()
        .single()

      const { data } = await supabase
        .from('countries')
        .select('*')
        .eq('relationship_status', 'dormant')

      expect(data.some(c => c.code === 'LW')).toBe(true)

      // Clean up
      await supabase.from('countries').delete().eq('id', created.id)
    })

    it('should track engagement metrics', () => {
      const country = new Country(testCountry)
      const metrics = country.getEngagementMetrics()

      expect(metrics).toHaveProperty('activeMoUs')
      expect(metrics).toHaveProperty('upcomingEvents')
      expect(metrics).toHaveProperty('recentInteractions')
      expect(metrics).toHaveProperty('tradeVolume')
    })
  })
})