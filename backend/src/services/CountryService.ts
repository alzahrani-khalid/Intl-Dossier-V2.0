import { supabaseAdmin } from '../config/supabase'
import { logInfo, logError } from '../utils/logger'
import { COLUMNS } from '../lib/query-columns'

export class CountryService {
  async getCountries(filters?: any) {
    try {
      const page = filters?.page || 1
      const limit = filters?.limit || 50
      const offset = (page - 1) * limit

      const { data, error, count } = await supabaseAdmin
        .from('countries')
        .select(COLUMNS.COUNTRIES.LIST, { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('name_en')

      if (error) throw error

      return {
        data: data || [],
        page,
        pages: Math.ceil((count || 0) / limit),
        total: count || 0,
      }
    } catch (error) {
      logError('Failed to fetch countries', error as Error)
      throw error
    }
  }

  async getCountryById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select(COLUMNS.COUNTRIES.DETAIL)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logError(`Failed to fetch country ${id}`, error as Error)
      throw error
    }
  }

  async createCountry(countryData: any) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .insert(countryData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logError('Failed to create country', error as Error)
      throw error
    }
  }

  async updateCountry(id: string, updates: any) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logError(`Failed to update country ${id}`, error as Error)
      throw error
    }
  }

  async deleteCountry(id: string) {
    try {
      const { error } = await supabaseAdmin.from('countries').delete().eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      logError(`Failed to delete country ${id}`, error as Error)
      throw error
    }
  }

  // Methods for API compatibility
  async findAll(filters?: any) {
    return this.getCountries(filters)
  }

  async findById(id: string) {
    return this.getCountryById(id)
  }

  async create(country: any) {
    return this.createCountry(country)
  }

  async update(id: string, updates: any) {
    return this.updateCountry(id, updates)
  }

  async delete(id: string) {
    return this.deleteCountry(id)
  }

  async getStatistics() {
    try {
      const { count } = await supabaseAdmin
        .from('countries')
        .select('*', { count: 'exact', head: true })

      return { total_countries: count || 0 }
    } catch (error) {
      logError('Failed to get country statistics', error as Error)
      throw error
    }
  }

  // Additional methods needed by API endpoints
  async getCountryRelationships(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('country_relationships')
        .select(COLUMNS.COUNTRY_RELATIONSHIPS.LIST)
        .eq('country_id', countryId)

      if (error) throw error
      return data || []
    } catch (error) {
      logError(`Failed to get relationships for country ${countryId}`, error as Error)
      throw error
    }
  }

  async updateRelationshipStatus(countryId: string, relationshipId: string, status: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('country_relationships')
        .update({ status })
        .eq('country_id', countryId)
        .eq('id', relationshipId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logError('Failed to update relationship status', error as Error)
      throw error
    }
  }

  async getMoUs(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('mous')
        .select(COLUMNS.MOUS.LIST)
        .contains('parties', [{ country_id: countryId }])

      if (error) throw error
      return data || []
    } catch (error) {
      logError(`Failed to get MoUs for country ${countryId}`, error as Error)
      throw error
    }
  }

  async getEvents(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select(COLUMNS.EVENTS.LIST)
        .eq('country_id', countryId)
        .order('start_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logError(`Failed to get events for country ${countryId}`, error as Error)
      throw error
    }
  }

  async getContacts(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select(COLUMNS.CONTACTS.LIST)
        .eq('country_id', countryId)

      if (error) throw error
      return data || []
    } catch (error) {
      logError(`Failed to get contacts for country ${countryId}`, error as Error)
      throw error
    }
  }

  async getTimeline(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('timeline_events')
        .select(COLUMNS.TIMELINE_EVENTS.LIST)
        .eq('country_id', countryId)
        .order('event_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logError(`Failed to get timeline for country ${countryId}`, error as Error)
      throw error
    }
  }

  async addTags(countryId: string, tags: string[]) {
    try {
      const { data: country, error: fetchError } = await supabaseAdmin
        .from('countries')
        .select('tags')
        .eq('id', countryId)
        .single()

      if (fetchError) throw fetchError

      const existingTags = country?.tags || []
      const newTags = [...new Set([...existingTags, ...tags])]

      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({ tags: newTags })
        .eq('id', countryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logError(`Failed to add tags to country ${countryId}`, error as Error)
      throw error
    }
  }

  async removeTags(countryId: string, tagsToRemove: string[]) {
    try {
      const { data: country, error: fetchError } = await supabaseAdmin
        .from('countries')
        .select('tags')
        .eq('id', countryId)
        .single()

      if (fetchError) throw fetchError

      const existingTags = country?.tags || []
      const newTags = existingTags.filter((tag: string) => !tagsToRemove.includes(tag))

      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({ tags: newTags })
        .eq('id', countryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logError(`Failed to remove tags from country ${countryId}`, error as Error)
      throw error
    }
  }
}

export default CountryService
