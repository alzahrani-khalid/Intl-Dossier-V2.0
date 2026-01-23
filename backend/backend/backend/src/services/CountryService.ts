import { supabaseAdmin } from '../config/supabase';
import { logInfo, logError } from '../utils/logger';

export class CountryService {
  async getCountries(filters?: any) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('countries')
        .select('id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km, flag_url', { count: 'exact' })
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
        .select('id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km, flag_url')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError(`Failed to fetch country ${id}`, error as Error);
      throw error;
    }
  }

  async createCountry(countryData: any) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .insert(countryData)
        .select('id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km, flag_url')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('Failed to create country', error as Error);
      throw error;
    }
  }

  async updateCountry(id: string, updates: any) {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .update(updates)
        .eq('id', id)
        .select('id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km, flag_url')
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
  async findAll(filters?: any) {
    return this.getCountries(filters);
  }

  async findById(id: string) {
    return this.getCountryById(id);
  }

  async create(country: any) {
    return this.createCountry(country);
  }

  async update(id: string, updates: any) {
    return this.updateCountry(id, updates);
  }

  async delete(id: string) {
    return this.deleteCountry(id);
  }

  async getStatistics() {
    try {
      const { count } = await supabaseAdmin
        .from('countries')
        .select('id', { count: 'exact', head: true });

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
        .select('id, country_id, related_country_id, relationship_type, status, description, created_at, updated_at')
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
        .select('id, country_id, related_country_id, relationship_type, status, description, created_at, updated_at')
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
        .select('id, reference_number, title_en, title_ar, description_en, description_ar, workflow_state, primary_party_id, secondary_party_id, document_url, document_version, signing_date, effective_date, expiry_date, auto_renewal, renewal_period_months, owner_id, created_at, updated_at')
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
        .select('id, title_en, title_ar, description_en, description_ar, type, start_datetime, end_datetime, timezone, location_en, location_ar, venue_en, venue_ar, is_virtual, virtual_link, country_id, organizer_id, max_participants, registration_required, registration_deadline, status, created_by, created_at, updated_at')
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
        .select('id, name, email, phone, position, organization, country_id, created_at, updated_at')
        .eq('country_id', countryId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get contacts for country ${countryId}`, error as Error);
      throw error;
    }
  }

  async getDocuments(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('id, title, file_path, file_type, file_size, entity_type, entity_id, uploaded_by, created_at, updated_at')
        .eq('entity_type', 'country')
        .eq('entity_id', countryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get documents for country ${countryId}`, error as Error);
      throw error;
    }
  }

  async getPositions(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select('id, title, description, status, country_id, created_at, updated_at')
        .eq('country_id', countryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get positions for country ${countryId}`, error as Error);
      throw error;
    }
  }

  async getIntelligence(countryId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('intelligence')
        .select('id, title, content, source, country_id, created_at, updated_at')
        .eq('country_id', countryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Failed to get intelligence for country ${countryId}`, error as Error);
      throw error;
    }
  }
}

export default CountryService;
