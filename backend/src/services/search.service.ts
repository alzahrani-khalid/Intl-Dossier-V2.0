import { createClient } from '@supabase/supabase-js';
import { SearchFilter, SearchFilterInput, SearchFilterModel, SearchResult } from '../models/search-filter.model';
import { IntelligenceReport } from '../models/intelligence-report.model';
import { VectorService } from './vector.service';

interface SearchOptions {
  query?: string;
  filters?: {
    date_range?: { from: Date; to: Date };
    status?: string[];
    priority?: string[];
    custom_tags?: string[];
    filter_logic?: 'AND' | 'OR';
  };
  similarity_threshold?: number;
  timeout_ms?: number;
  page?: number;
  page_size?: 10 | 25 | 50 | 100;
}

export class SearchService {
  private supabase: any;
  private vectorService: VectorService;
  private searchFilters: Map<string, SearchFilter> = new Map();
  
  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    vectorService: VectorService
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.vectorService = vectorService;
    this.loadSearchFilters();
  }
  
  private async loadSearchFilters(): Promise<void> {
    const { data, error } = await this.supabase
      .from('search_filters')
      .select('*');
    
    if (error) {
      console.error('Failed to load search filters:', error);
      return;
    }
    
    data.forEach((filter: SearchFilter) => {
      this.searchFilters.set(filter.id, filter);
    });
  }
  
  async search(options: SearchOptions): Promise<SearchResult<IntelligenceReport>> {
    const startTime = Date.now();
    const timeout = options.timeout_ms || SearchFilterModel.DEFAULT_MAX_TIMEOUT_MS;
    const pageSize = options.page_size || SearchFilterModel.DEFAULT_PAGE_SIZE;
    const page = options.page || 1;
    
    let results: IntelligenceReport[] = [];
    let partialResults = false;
    const failedFilters: string[] = [];
    
    try {
      if (options.query) {
        const embedding = await this.vectorService.generateEmbeddingFromText(options.query);
        
        if (embedding) {
          results = await this.searchWithVector(embedding, options);
        } else {
          results = await this.searchWithKeywords(options);
          partialResults = this.vectorService.isInFallbackMode();
          if (partialResults) {
            failedFilters.push('vector_search');
          }
        }
      } else {
        results = await this.searchWithFilters(options, timeout);
      }
      
      const { partial, failed } = await this.applyAdditionalFilters(
        results,
        options.filters,
        timeout - (Date.now() - startTime)
      );
      
      partialResults = partialResults || partial;
      failedFilters.push(...failed);
      
    } catch (error) {
      console.error('Search error:', error);
      partialResults = true;
      failedFilters.push('main_search');
    }
    
    const paginated = SearchFilterModel.paginate(results, page, pageSize);
    
    return {
      data: paginated.data,
      total_count: results.length,
      page,
      page_size: pageSize,
      partial_results: partialResults,
      failed_filters: failedFilters,
      execution_time_ms: Date.now() - startTime
    };
  }
  
  private async searchWithVector(
    embedding: number[],
    options: SearchOptions
  ): Promise<IntelligenceReport[]> {
    const searchResults = await this.vectorService.searchByVector({
      query_embedding: embedding,
      similarity_threshold: options.similarity_threshold,
      limit: 100,
      filter: this.buildSupabaseFilter(options.filters)
    });
    
    return searchResults.map(r => r.report);
  }
  
  private async searchWithKeywords(options: SearchOptions): Promise<IntelligenceReport[]> {
    let query = this.supabase
      .from('intelligence_reports')
      .select('*');
    
    if (options.query) {
      query = query.or(`title.ilike.%${options.query}%,content.ilike.%${options.query}%,title_ar.ilike.%${options.query}%,content_ar.ilike.%${options.query}%`);
    }
    
    const filter = this.buildSupabaseFilter(options.filters);
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Keyword search failed: ${error.message}`);
    }
    
    return data;
  }
  
  private async searchWithFilters(
    options: SearchOptions,
    timeout: number
  ): Promise<IntelligenceReport[]> {
    const filterQuery = this.buildComplexQuery(options.filters);
    
    const queryPromise = this.supabase
      .from('intelligence_reports')
      .select('*')
      .match(filterQuery);
    
    const { result, timedOut } = await SearchFilterModel.executeWithTimeout(
      queryPromise,
      timeout,
      'partial'
    );
    
    if (timedOut) {
      console.warn('Filter search timed out, returning partial results');
      return [];
    }
    
    const { data, error } = result as any;
    
    if (error) {
      throw new Error(`Filter search failed: ${error.message}`);
    }
    
    return data;
  }
  
  private buildSupabaseFilter(filters?: SearchOptions['filters']): Record<string, any> {
    const filter: Record<string, any> = {};
    
    if (filters?.status?.length) {
      filter.review_status = filters.status;
    }
    
    return filter;
  }
  
  private buildComplexQuery(filters?: SearchOptions['filters']): any {
    if (!filters) return {};
    
    const tempFilter: SearchFilter = {
      id: 'temp',
      user_id: 'temp',
      name: 'temp',
      search_entities: [],
      date_range: filters.date_range,
      status_filter: filters.status,
      priority_filter: filters.priority,
      custom_tags: filters.custom_tags,
      filter_logic: filters.filter_logic || 'AND',
      page_size: 25,
      timeout_behavior: 'partial',
      max_timeout_ms: 2000,
      is_default: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return SearchFilterModel.buildQuery(tempFilter);
  }
  
  private async applyAdditionalFilters(
    results: IntelligenceReport[],
    filters?: SearchOptions['filters'],
    remainingTimeout: number = 1000
  ): Promise<{ results: IntelligenceReport[]; partial: boolean; failed: string[] }> {
    if (!filters || remainingTimeout <= 0) {
      return { results, partial: false, failed: [] };
    }
    
    const filterPromises: Record<string, Promise<IntelligenceReport[]>> = {};
    
    if (filters.date_range) {
      filterPromises.date_range = Promise.resolve(
        results.filter(r => {
          const created = new Date(r.created_at);
          return created >= filters.date_range!.from && created <= filters.date_range!.to;
        })
      );
    }
    
    if (filters.priority?.length) {
      filterPromises.priority = this.filterByPriority(results, filters.priority);
    }
    
    if (filters.custom_tags?.length) {
      filterPromises.tags = this.filterByTags(results, filters.custom_tags);
    }
    
    const tempFilter: SearchFilter = {
      id: 'temp',
      user_id: 'temp',
      name: 'temp',
      search_entities: [],
      filter_logic: filters.filter_logic || 'AND',
      page_size: 25,
      timeout_behavior: 'partial',
      max_timeout_ms: remainingTimeout,
      is_default: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const filterResults = await SearchFilterModel.applyFiltersWithTimeout(
      tempFilter,
      filterPromises
    );
    
    let filteredResults = results;
    
    if (filters.filter_logic === 'OR') {
      const allFiltered = new Set<string>();
      Object.values(filterResults.results).forEach((filtered: IntelligenceReport[]) => {
        filtered.forEach(r => allFiltered.add(r.id));
      });
      filteredResults = results.filter(r => allFiltered.has(r.id));
    } else {
      Object.values(filterResults.results).forEach((filtered: IntelligenceReport[]) => {
        const filteredIds = new Set(filtered.map(r => r.id));
        filteredResults = filteredResults.filter(r => filteredIds.has(r.id));
      });
    }
    
    return {
      results: filteredResults,
      partial: filterResults.partial,
      failed: filterResults.failed
    };
  }
  
  private async filterByPriority(
    reports: IntelligenceReport[],
    priorities: string[]
  ): Promise<IntelligenceReport[]> {
    return reports.filter(r => {
      const highSeverityCount = r.threat_indicators?.filter(
        t => t.severity === 'high' || t.severity === 'critical'
      ).length || 0;
      
      if (priorities.includes('critical') && r.threat_indicators?.some(t => t.severity === 'critical')) {
        return true;
      }
      if (priorities.includes('high') && highSeverityCount > 0) {
        return true;
      }
      if (priorities.includes('medium') && r.threat_indicators?.some(t => t.severity === 'medium')) {
        return true;
      }
      if (priorities.includes('low') && r.threat_indicators?.some(t => t.severity === 'low')) {
        return true;
      }
      
      return false;
    });
  }
  
  private async filterByTags(
    reports: IntelligenceReport[],
    tags: string[]
  ): Promise<IntelligenceReport[]> {
    return reports.filter(r => {
      const reportTags = [
        ...r.threat_indicators?.map(t => t.indicator_type) || [],
        ...r.geospatial_tags?.map(g => g.location_name) || []
      ];
      
      return tags.some(tag => reportTags.includes(tag));
    });
  }
  
  async saveSearchFilter(input: SearchFilterInput): Promise<SearchFilter> {
    const validationErrors = SearchFilterModel.validate(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    if (input.is_default) {
      await this.supabase
        .from('search_filters')
        .update({ is_default: false })
        .eq('user_id', input.user_id);
    }
    
    const { data, error } = await this.supabase
      .from('search_filters')
      .insert({
        ...input,
        filter_logic: input.filter_logic || 'AND',
        page_size: input.page_size || SearchFilterModel.DEFAULT_PAGE_SIZE,
        timeout_behavior: input.timeout_behavior || 'partial',
        max_timeout_ms: input.max_timeout_ms || SearchFilterModel.DEFAULT_MAX_TIMEOUT_MS,
        is_default: input.is_default || false,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save search filter: ${error.message}`);
    }
    
    await this.loadSearchFilters();
    return data;
  }
  
  async getUserFilters(userId: string): Promise<SearchFilter[]> {
    const { data, error } = await this.supabase
      .from('search_filters')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Failed to get user filters: ${error.message}`);
    }
    
    return data;
  }
  
  async deleteSearchFilter(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('search_filters')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete search filter: ${error.message}`);
    }
    
    await this.loadSearchFilters();
  }
  
  async getSearchSuggestions(
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('intelligence_reports')
      .select('title, title_ar')
      .or(`title.ilike.%${query}%,title_ar.ilike.%${query}%`)
      .limit(limit);
    
    if (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
    
    const suggestions = new Set<string>();
    data.forEach((r: any) => {
      if (r.title?.includes(query)) suggestions.add(r.title);
      if (r.title_ar?.includes(query)) suggestions.add(r.title_ar);
    });
    
    return Array.from(suggestions).slice(0, limit);
  }
}