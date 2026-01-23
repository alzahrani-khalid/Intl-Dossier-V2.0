import { supabaseAdmin } from '../config/supabase';
import { logInfo, logError } from '../utils/logger';
import { Database } from '../types/database.types';

type CountryRow = Database['public']['Tables']['countries']['Row'];
type CountryInsert = Database['public']['Tables']['countries']['Insert'];
type CountryUpdate = Database['public']['Tables']['countries']['Update'];

interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export class CountryService {
  async getCountries(filters?: PaginationFilters) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('countries')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('name_en');

      if (error) throw error;

      return {
        data: data || [],
        page,
        pages: Math.ceil((count || 0) / limit),
        total: count || 0
      };
    } catch (error) {
      logError('Failed to fetch countries', error as Error);
      throw error;
    }
  }

  async getCountryById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError(`Failed to fetch country ${id}`, error as Error);
      throw error;
    }
  }

  async createCountry(countryData: CountryInsert) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .insert(countryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('Failed to create country', error as Error);
      throw error;
    }
  }

  async updateCountry(id: string, updates: CountryUpdate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError(`Failed to update country ${id}`, error as Error);
      throw error;
    }
  }

  async deleteCountry(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('countries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logError(`Failed to delete country ${id}`, error as Error);
      throw error;
    }
  }

  // Methods for API compatibility
  async findAll(filters?: PaginationFilters) {
    return this.getCountries(filters);
  }

  async findById(id: string) {
    return this.getCountryById(id);
  }

  async create(country: CountryInsert) {
    return this.createCountry(country);
  }

  async update(id: string, updates: CountryUpdate) {
    return this.updateCountry(id, updates);
  }

  async delete(id: string) {
    return this.deleteCountry(id);
  }

  async getStatistics() {
    try {
      const { count } = await supabaseAdmin
        .from('countries')
        .select('*', { count: 'exact', head: true });

      return { total_countries: count || 0 };
    } catch (error) {
      logError('Failed to get country statistics', error as Error);
      throw error;
    }
  }

  // Additional methods needed by API endpoints
  async getCountryRelationships(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('country_relationships')
        .select('*')
        .eq('country_id', countryId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get relationships for country ${countryId}`, error as Error);
      throw error;
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
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('Failed to update relationship status', error as Error);
      throw error;
    }
  }

  async getMoUs(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('mous')
        .select('*')
        .contains('parties', [{ country_id: countryId }]);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get MoUs for country ${countryId}`, error as Error);
      throw error;
    }
  }

  async getEvents(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('country_id', countryId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get events for country ${countryId}`, error as Error);
      throw error;
    }
  }

  async getContacts(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('country_id', countryId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get contacts for country ${countryId}`, error as Error);
      throw error;
    }
  }

  async getTimeline(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('timeline_events')
        .select('*')
        .eq('country_id', countryId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get timeline for country ${countryId}`, error as Error);
      throw error;
    }
  }

  async addTags(countryId: string, tags: string[]) {
    try {
      const { data: country, error: fetchError } = await supabaseAdmin
        .from('countries')
        .select('tags')
        .eq('id', countryId)
        .single();

      if (fetchError) throw fetchError;

      const existingTags = country?.tags || [];
      const newTags = [...new Set([...existingTags, ...tags])];

      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({ tags: newTags })
        .eq('id', countryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError(`Failed to add tags to country ${countryId}`, error as Error);
      throw error;
    }
  }

  async removeTags(countryId: string, tagsToRemove: string[]) {
    try {
      const { data: country, error: fetchError } = await supabaseAdmin
        .from('countries')
        .select('tags')
        .eq('id', countryId)
        .single();

      if (fetchError) throw fetchError;

      const existingTags = country?.tags || [];
      const newTags = existingTags.filter((tag: string) => !tagsToRemove.includes(tag));

      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({ tags: newTags })
        .eq('id', countryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError(`Failed to remove tags from country ${countryId}`, error as Error);
      throw error;
    }
  }
}

export default CountryService;
