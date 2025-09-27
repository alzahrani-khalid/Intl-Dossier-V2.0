export interface SearchFilter {
  id: string;
  user_id: string;
  name: string;
  
  search_entities: ('dossier' | 'organization' | 'country' | 'project')[];
  full_text_query?: string;
  
  date_range?: { from: Date; to: Date };
  status_filter?: string[];
  priority_filter?: string[];
  custom_tags?: string[];
  filter_logic: 'AND' | 'OR';
  
  page_size: 10 | 25 | 50 | 100;
  
  timeout_behavior: 'partial' | 'fail' | 'cached';
  max_timeout_ms: number;
  
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SearchFilterInput {
  user_id: string;
  name: string;
  search_entities?: ('dossier' | 'organization' | 'country' | 'project')[];
  full_text_query?: string;
  date_range?: { from: Date; to: Date };
  status_filter?: string[];
  priority_filter?: string[];
  custom_tags?: string[];
  filter_logic?: 'AND' | 'OR';
  page_size?: 10 | 25 | 50 | 100;
  timeout_behavior?: 'partial' | 'fail' | 'cached';
  max_timeout_ms?: number;
  is_default?: boolean;
}

export interface SearchResult<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
  partial_results: boolean;
  failed_filters: string[];
  execution_time_ms: number;
}

export class SearchFilterModel {
  static readonly DEFAULT_PAGE_SIZE = 25;
  static readonly DEFAULT_MAX_TIMEOUT_MS = 2000;
  static readonly MAX_TIMEOUT_LIMIT_MS = 30000;
  static readonly VALID_PAGE_SIZES = [10, 25, 50, 100] as const;
  
  static validate(data: Partial<SearchFilterInput>): string[] {
    const errors: string[] = [];
    
    if (!data.name) {
      errors.push('Filter name is required');
    }
    
    if (!data.user_id) {
      errors.push('User ID is required');
    }
    
    if (data.page_size && !this.VALID_PAGE_SIZES.includes(data.page_size)) {
      errors.push(`Page size must be one of: ${this.VALID_PAGE_SIZES.join(', ')}`);
    }
    
    if (data.max_timeout_ms !== undefined) {
      if (data.max_timeout_ms <= 0) {
        errors.push('Timeout must be greater than 0');
      }
      if (data.max_timeout_ms > this.MAX_TIMEOUT_LIMIT_MS) {
        errors.push(`Timeout cannot exceed ${this.MAX_TIMEOUT_LIMIT_MS}ms`);
      }
    }
    
    if (data.date_range) {
      if (data.date_range.from >= data.date_range.to) {
        errors.push('Date range "from" must be before "to"');
      }
    }
    
    return errors;
  }
  
  static buildQuery(filter: SearchFilter): any {
    const conditions: any[] = [];
    
    if (filter.full_text_query) {
      conditions.push({ text_search: filter.full_text_query });
    }
    
    if (filter.date_range) {
      conditions.push({
        created_at: {
          gte: filter.date_range.from,
          lte: filter.date_range.to
        }
      });
    }
    
    if (filter.status_filter?.length) {
      conditions.push({ status: { in: filter.status_filter } });
    }
    
    if (filter.priority_filter?.length) {
      conditions.push({ priority: { in: filter.priority_filter } });
    }
    
    if (filter.custom_tags?.length) {
      conditions.push({ tags: { hasAny: filter.custom_tags } });
    }
    
    if (conditions.length === 0) {
      return {};
    }
    
    return filter.filter_logic === 'OR' 
      ? { OR: conditions }
      : { AND: conditions };
  }
  
  static async executeWithTimeout<T>(
    queryPromise: Promise<T>,
    timeoutMs: number,
    timeoutBehavior: SearchFilter['timeout_behavior']
  ): Promise<{ result?: T; timedOut: boolean; error?: string }> {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    );
    
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      return { result: result as T, timedOut: false };
    } catch (error) {
      if ((error as Error).message === 'Query timeout') {
        switch (timeoutBehavior) {
          case 'partial':
            return { result: undefined, timedOut: true };
          case 'cached':
            return { result: undefined, timedOut: true, error: 'Using cached results' };
          case 'fail':
          default:
            throw new Error(`Query exceeded timeout of ${timeoutMs}ms`);
        }
      }
      throw error;
    }
  }
  
  static async applyFiltersWithTimeout(
    filter: SearchFilter,
    queries: Record<string, Promise<any>>
  ): Promise<{
    results: Record<string, any>;
    partial: boolean;
    failed: string[];
  }> {
    const results: Record<string, any> = {};
    const failed: string[] = [];
    let partial = false;
    
    const queryPromises = Object.entries(queries).map(async ([key, queryPromise]) => {
      const { result, timedOut } = await this.executeWithTimeout(
        queryPromise,
        filter.max_timeout_ms,
        filter.timeout_behavior
      );
      
      if (timedOut) {
        partial = true;
        if (filter.timeout_behavior === 'fail') {
          failed.push(key);
        }
      } else {
        results[key] = result;
      }
    });
    
    await Promise.allSettled(queryPromises);
    
    return { results, partial, failed };
  }
  
  static paginate<T>(
    items: T[],
    page: number,
    pageSize: number
  ): { data: T[]; total_pages: number; has_next: boolean; has_previous: boolean } {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = items.slice(start, end);
    const total_pages = Math.ceil(items.length / pageSize);
    
    return {
      data,
      total_pages,
      has_next: page < total_pages,
      has_previous: page > 1
    };
  }
}