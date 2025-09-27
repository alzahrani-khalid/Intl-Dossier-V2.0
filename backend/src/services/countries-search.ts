import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

export interface CountrySearchFilters {
  name?: string;
  nameAr?: string;
  region?: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  subRegion?: string;
  isoCode?: string;
  status?: 'active' | 'inactive';
  populationMin?: number;
  populationMax?: number;
  areaMin?: number;
  areaMax?: number;
}

export interface CountrySearchOptions {
  filters: CountrySearchFilters;
  sortBy?: 'name_en' | 'name_ar' | 'population' | 'area_sq_km' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  language?: 'en' | 'ar';
}

export interface CountrySearchResult {
  data: Array<Database['public']['Tables']['countries']['Row']>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class CountrySearchService {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async search(options: CountrySearchOptions): Promise<CountrySearchResult> {
    const {
      filters,
      sortBy = 'name_en',
      sortOrder = 'asc',
      page = 1,
      pageSize = 20,
      language = 'en'
    } = options;

    let query = this.supabase
      .from('countries')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.name) {
      const searchTerm = `%${filters.name}%`;
      query = query.ilike('name_en', searchTerm);
    }

    if (filters.nameAr) {
      const searchTerm = `%${filters.nameAr}%`;
      query = query.ilike('name_ar', searchTerm);
    }

    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    if (filters.subRegion) {
      query = query.eq('sub_region', filters.subRegion);
    }

    if (filters.isoCode) {
      const upperCode = filters.isoCode.toUpperCase();
      query = query.or(`iso_code_2.eq.${upperCode},iso_code_3.eq.${upperCode}`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.populationMin !== undefined) {
      query = query.gte('population', filters.populationMin);
    }

    if (filters.populationMax !== undefined) {
      query = query.lte('population', filters.populationMax);
    }

    if (filters.areaMin !== undefined) {
      query = query.gte('area_sq_km', filters.areaMin);
    }

    if (filters.areaMax !== undefined) {
      query = query.lte('area_sq_km', filters.areaMax);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Country search failed: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: data || [],
      totalCount,
      page,
      pageSize,
      totalPages
    };
  }

  async searchByText(searchText: string, language: 'en' | 'ar' = 'en'): Promise<CountrySearchResult> {
    const filters: CountrySearchFilters = language === 'en' 
      ? { name: searchText }
      : { nameAr: searchText };

    return this.search({
      filters,
      sortBy: language === 'en' ? 'name_en' : 'name_ar',
      language
    });
  }

  async getByRegion(region: CountrySearchFilters['region']): Promise<CountrySearchResult> {
    return this.search({
      filters: { region, status: 'active' },
      sortBy: 'name_en'
    });
  }

  async getActiveCountries(options?: Partial<CountrySearchOptions>): Promise<CountrySearchResult> {
    return this.search({
      ...options,
      filters: {
        ...options?.filters,
        status: 'active'
      }
    });
  }

  async autocomplete(
    prefix: string, 
    language: 'en' | 'ar' = 'en',
    limit: number = 10
  ): Promise<Array<{ id: string; name: string; code: string }>> {
    const column = language === 'en' ? 'name_en' : 'name_ar';
    
    const { data, error } = await this.supabase
      .from('countries')
      .select(`id, ${column}, iso_code_2`)
      .ilike(column, `${prefix}%`)
      .eq('status', 'active')
      .order(column)
      .limit(limit);

    if (error) {
      throw new Error(`Autocomplete failed: ${error.message}`);
    }

    return (data || []).map(country => ({
      id: country.id,
      name: country[column],
      code: country.iso_code_2
    }));
  }

  async getCountriesWithStats(): Promise<Array<any>> {
    const { data: countries, error: countriesError } = await this.supabase
      .from('countries')
      .select('*')
      .eq('status', 'active');

    if (countriesError) {
      throw new Error(`Failed to fetch countries: ${countriesError.message}`);
    }

    // Get stats for each country
    const countriesWithStats = await Promise.all(
      (countries || []).map(async (country) => {
        // Count organizations
        const { count: orgCount } = await this.supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('country_id', country.id);

        // Count events
        const { count: eventCount } = await this.supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('country_id', country.id);

        // Count MoUs where country's organizations are involved
        const { data: orgIds } = await this.supabase
          .from('organizations')
          .select('id')
          .eq('country_id', country.id);

        let mouCount = 0;
        if (orgIds && orgIds.length > 0) {
          const ids = orgIds.map(o => o.id);
          const { count } = await this.supabase
            .from('mous')
            .select('*', { count: 'exact', head: true })
            .or(`primary_party_id.in.(${ids.join(',')}),secondary_party_id.in.(${ids.join(',')})`);
          mouCount = count || 0;
        }

        return {
          ...country,
          stats: {
            organizations: orgCount || 0,
            events: eventCount || 0,
            mous: mouCount
          }
        };
      })
    );

    return countriesWithStats;
  }

  async bulkSearch(isoCodes: string[]): Promise<Database['public']['Tables']['countries']['Row'][]> {
    const upperCodes = isoCodes.map(code => code.toUpperCase());
    
    const { data, error } = await this.supabase
      .from('countries')
      .select('*')
      .or(
        `iso_code_2.in.(${upperCodes.join(',')}),iso_code_3.in.(${upperCodes.join(',')})`
      );

    if (error) {
      throw new Error(`Bulk search failed: ${error.message}`);
    }

    return data || [];
  }
}

// Export a factory function for Edge Functions
export function createCountrySearchService(
  supabaseUrl: string,
  supabaseKey: string
): CountrySearchService {
  return new CountrySearchService(supabaseUrl, supabaseKey);
}