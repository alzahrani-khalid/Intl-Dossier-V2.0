import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  name_ar?: string;
  organization_id: string;
  country_id: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  mobile?: string;
  preferred_language: 'ar' | 'en';
  expertise_areas: string[];
  influence_score: number;
  communication_preferences: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  interaction_history: Array<{
    date: string;
    type: 'email' | 'meeting' | 'call' | 'event';
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateContactDto {
  first_name: string;
  last_name: string;
  name_ar?: string;
  organization_id: string;
  country_id: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  mobile?: string;
  preferred_language: 'ar' | 'en';
  expertise_areas: string[];
  communication_preferences: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
}

export interface UpdateContactDto extends Partial<CreateContactDto> {
  influence_score?: number;
  active?: boolean;
}

export interface ContactSearchParams {
  organization_id?: string;
  country_id?: string;
  position?: string;
  department?: string;
  expertise_areas?: string[];
  influence_score_min?: number;
  influence_score_max?: number;
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ContactService {
  private readonly cachePrefix = 'contact:';
  private readonly cacheTTL = 1800; // 30 minutes

  /**
   * Get all contacts with filters
   */
  async findAll(params: ContactSearchParams = {}): Promise<{ data: Contact[]; total: number }> {
    try {
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify(params)}`;
      const cached = await cacheHelpers.get<{ data: Contact[]; total: number }>(cacheKey);
      if (cached) return cached;

      let query = supabaseAdmin
        .from('contacts')
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `);

      // Apply filters
      if (params.organization_id) {
        query = query.eq('organization_id', params.organization_id);
      }
      if (params.country_id) {
        query = query.eq('country_id', params.country_id);
      }
      if (params.position) {
        query = query.ilike('position', `%${params.position}%`);
      }
      if (params.department) {
        query = query.ilike('department', `%${params.department}%`);
      }
      if (params.expertise_areas && params.expertise_areas.length > 0) {
        query = query.overlaps('expertise_areas', params.expertise_areas);
      }
      if (params.influence_score_min !== undefined) {
        query = query.gte('influence_score', params.influence_score_min);
      }
      if (params.influence_score_max !== undefined) {
        query = query.lte('influence_score', params.influence_score_max);
      }
      if (params.active !== undefined) {
        query = query.eq('active', params.active);
      }
      if (params.search) {
        query = query.or(`
          first_name.ilike.%${params.search}%,
          last_name.ilike.%${params.search}%,
          name_ar.ilike.%${params.search}%,
          position.ilike.%${params.search}%,
          department.ilike.%${params.search}%,
          email.ilike.%${params.search}%
        `);
      }

      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by influence score and name
      query = query.order('influence_score', { ascending: false })
        .order('first_name', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      const result = {
        data: data || [],
        total: count || 0
      };

      await cacheHelpers.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      logError('ContactService.findAll error', error as Error);
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async findById(id: string): Promise<Contact | null> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await cacheHelpers.get<Contact>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      return data;
    } catch (error) {
      logError('ContactService.findById error', error as Error);
      throw error;
    }
  }

  /**
   * Create new contact
   */
  async create(contactData: CreateContactDto, createdBy: string): Promise<Contact> {
    try {
      const contact = {
        ...contactData,
        influence_score: 50, // Default influence score
        interaction_history: [],
        active: true,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('contacts')
        .insert(contact)
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('Contact created', { contactId: data.id, createdBy });
      return data;
    } catch (error) {
      logError('ContactService.create error', error as Error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async update(id: string, updates: UpdateContactDto, updatedBy: string): Promise<Contact> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Contact updated', { contactId: id, updatedBy });
      return data;
    } catch (error) {
      logError('ContactService.update error', error as Error);
      throw error;
    }
  }

  /**
   * Delete contact (soft delete)
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('contacts')
        .update({
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Contact deleted', { contactId: id, deletedBy });
      return true;
    } catch (error) {
      logError('ContactService.delete error', error as Error);
      throw error;
    }
  }

  /**
   * Add interaction to contact history
   */
  async addInteraction(
    contactId: string,
    interaction: {
      type: 'email' | 'meeting' | 'call' | 'event';
      summary: string;
      sentiment: 'positive' | 'neutral' | 'negative';
    },
    addedBy: string
  ): Promise<Contact> {
    try {
      const contact = await this.findById(contactId);
      if (!contact) throw new Error('Contact not found');

      const newInteraction = {
        date: new Date().toISOString(),
        ...interaction
      };

      const updatedHistory = [...contact.interaction_history, newInteraction];

      // Update influence score based on interaction
      const influenceChange = this.calculateInfluenceChange(interaction);
      const newInfluenceScore = Math.min(100, Math.max(0, contact.influence_score + influenceChange));

      const { data, error } = await supabaseAdmin
        .from('contacts')
        .update({
          interaction_history: updatedHistory,
          influence_score: newInfluenceScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${contactId}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Interaction added to contact', { contactId, addedBy, type: interaction.type });
      return data;
    } catch (error) {
      logError('ContactService.addInteraction error', error as Error);
      throw error;
    }
  }

  /**
   * Get contacts by organization
   */
  async findByOrganization(organizationId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .eq('organization_id', organizationId)
        .eq('active', true)
        .order('influence_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('ContactService.findByOrganization error', error as Error);
      throw error;
    }
  }

  /**
   * Get contacts by country
   */
  async findByCountry(countryId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .eq('country_id', countryId)
        .eq('active', true)
        .order('influence_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('ContactService.findByCountry error', error as Error);
      throw error;
    }
  }

  /**
   * Get high-influence contacts
   */
  async getHighInfluenceContacts(threshold: number = 70): Promise<Contact[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .gte('influence_score', threshold)
        .eq('active', true)
        .order('influence_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('ContactService.getHighInfluenceContacts error', error as Error);
      throw error;
    }
  }

  /**
   * Search contacts by expertise
   */
  async findByExpertise(expertise: string[]): Promise<Contact[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          *,
          organization:organizations(name_en, name_ar),
          country:countries(name_en, name_ar, code)
        `)
        .overlaps('expertise_areas', expertise)
        .eq('active', true)
        .order('influence_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('ContactService.findByExpertise error', error as Error);
      throw error;
    }
  }

  /**
   * Calculate influence score change based on interaction
   */
  private calculateInfluenceChange(interaction: {
    type: 'email' | 'meeting' | 'call' | 'event';
    sentiment: 'positive' | 'neutral' | 'negative';
  }): number {
    const typeWeights = {
      email: 1,
      call: 2,
      meeting: 3,
      event: 4
    };

    const sentimentMultipliers = {
      positive: 1,
      neutral: 0,
      negative: -0.5
    };

    const baseChange = typeWeights[interaction.type] || 1;
    const multiplier = sentimentMultipliers[interaction.sentiment] || 0;

    return baseChange * multiplier;
  }

  /**
   * Get contact statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    by_organization: Record<string, number>;
    by_country: Record<string, number>;
    high_influence: number;
    average_influence_score: number;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('id, active, organization_id, country_id, influence_score');

      if (error) throw error;

      const contacts = data || [];
      const active = contacts.filter(c => c.active);
      const highInfluence = active.filter(c => c.influence_score >= 70);

      const byOrganization: Record<string, number> = {};
      const byCountry: Record<string, number> = {};

      active.forEach(contact => {
        byOrganization[contact.organization_id] = (byOrganization[contact.organization_id] || 0) + 1;
        byCountry[contact.country_id] = (byCountry[contact.country_id] || 0) + 1;
      });

      const averageInfluenceScore = active.length > 0
        ? active.reduce((sum, c) => sum + c.influence_score, 0) / active.length
        : 0;

      return {
        total: contacts.length,
        active: active.length,
        by_organization: byOrganization,
        by_country: byCountry,
        high_influence: highInfluence.length,
        average_influence_score: Math.round(averageInfluenceScore * 100) / 100
      };
    } catch (error) {
      logError('ContactService.getStatistics error', error as Error);
      throw error;
    }
  }
}

export default ContactService;
