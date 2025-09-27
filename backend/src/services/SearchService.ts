import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export class SearchService {
  async globalSearch(query: string, filters: any = {}, limit = 50) {
    try {
      const cacheKey = `search:${JSON.stringify({ query, filters })}`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) return cached;

      const results = await Promise.all([
        this.searchCountries(query, limit),
        this.searchOrganizations(query, limit),
        this.searchMoUs(query, limit),
        this.searchDocuments(query, limit)
      ]);

      const combined = {
        countries: results[0],
        organizations: results[1],
        mous: results[2],
        documents: results[3],
        total: results.reduce((sum, r) => sum + r.length, 0)
      };

      await cacheHelpers.set(cacheKey, combined, 300);
      return combined;
    } catch (error) {
      logError('Search error', error as Error);
      throw error;
    }
  }

  private async searchCountries(query: string, limit: number) {
    const { data } = await supabaseAdmin
      .from('countries')
      .select('id, name_en, name_ar, code')
      .or(`name_en.ilike.%${query}%,name_ar.ilike.%${query}%`)
      .limit(limit);
    return data || [];
  }

  private async searchOrganizations(query: string, limit: number) {
    const { data } = await supabaseAdmin
      .from('organizations')
      .select('id, name_en, name_ar, type')
      .or(`name_en.ilike.%${query}%,name_ar.ilike.%${query}%`)
      .limit(limit);
    return data || [];
  }

  private async searchMoUs(query: string, limit: number) {
    const { data } = await supabaseAdmin
      .from('mous')
      .select('id, title_en, title_ar, reference_number, status')
      .or(`title_en.ilike.%${query}%,reference_number.ilike.%${query}%`)
      .limit(limit);
    return data || [];
  }

  private async searchDocuments(query: string, limit: number) {
    const { data } = await supabaseAdmin
      .from('documents')
      .select('id, title_en, title_ar, type')
      .or(`title_en.ilike.%${query}%,title_ar.ilike.%${query}%`)
      .limit(limit);
    return data || [];
  }

  // Missing methods for API compatibility
  async search(query: string, options?: any): Promise<any> {
    return this.globalSearch(query, options?.filters, options?.limit);
  }

  async getSuggestions(query: string, type?: string): Promise<string[]> {
    try {
      const suggestions: string[] = [];

      if (!type || type === 'all') {
        // Get suggestions from all entity types
        const [countries, orgs, mous] = await Promise.all([
          supabaseAdmin
            .from('countries')
            .select('name_en')
            .ilike('name_en', `${query}%`)
            .limit(5),
          supabaseAdmin
            .from('organizations')
            .select('name_en')
            .ilike('name_en', `${query}%`)
            .limit(5),
          supabaseAdmin
            .from('mous')
            .select('title_en')
            .ilike('title_en', `${query}%`)
            .limit(5)
        ]);

        if (countries.data) suggestions.push(...countries.data.map(c => c.name_en));
        if (orgs.data) suggestions.push(...orgs.data.map(o => o.name_en));
        if (mous.data) suggestions.push(...mous.data.map(m => m.title_en));
      } else {
        // Get suggestions for specific entity type
        let table = '';
        let field = '';

        switch (type) {
          case 'country':
            table = 'countries';
            field = 'name_en';
            break;
          case 'organization':
            table = 'organizations';
            field = 'name_en';
            break;
          case 'mou':
            table = 'mous';
            field = 'title_en';
            break;
          case 'document':
            table = 'documents';
            field = 'title_en';
            break;
          default:
            return [];
        }

        const { data } = await supabaseAdmin
          .from(table)
          .select(field)
          .ilike(field, `${query}%`)
          .limit(10);

        if (data) {
          suggestions.push(...data.map((item: any) => (item as any)[field]));
        }
      }

      // Remove duplicates and return
      return [...new Set(suggestions)];
    } catch (error) {
      logError('Failed to get suggestions', error as Error);
      throw error;
    }
  }
}

export default SearchService;
