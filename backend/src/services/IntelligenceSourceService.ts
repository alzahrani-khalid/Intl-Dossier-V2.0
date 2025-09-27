import { createClient } from '@supabase/supabase-js';
import {
  IntelligenceSource,
  CreateIntelligenceSourceDto,
  UpdateIntelligenceSourceDto,
  ScanResult,
  SourceType
} from '../models/IntelligenceSource';
import Parser from 'rss-parser';
import axios from 'axios';

export class IntelligenceSourceService {
  private supabase;
  private rssParser: Parser;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.rssParser = new Parser();
  }

  async createSource(
    dto: CreateIntelligenceSourceDto
  ): Promise<IntelligenceSource> {
    // Validate source configuration
    if (dto.type === 'api' && !dto.api_config) {
      throw new Error('API configuration required for API sources');
    }

    if (dto.type !== 'email' && !dto.url) {
      throw new Error('URL required for non-email sources');
    }

    const { data, error } = await this.supabase
      .from('intelligence_sources')
      .insert({
        name: dto.name,
        type: dto.type,
        url: dto.url,
        api_config: dto.api_config,
        scanning_frequency: dto.scanning_frequency,
        keywords: dto.keywords,
        categories: dto.categories,
        reliability_score: dto.reliability_score || 50,
        next_scan_at: this.calculateNextScanTime(dto.scanning_frequency),
        active: true,
        error_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create source: ${error.message}`);
    }

    return data;
  }

  async updateSource(
    sourceId: string,
    dto: UpdateIntelligenceSourceDto
  ): Promise<IntelligenceSource> {
    const { data, error } = await this.supabase
      .from('intelligence_sources')
      .update(dto)
      .eq('id', sourceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update source: ${error.message}`);
    }

    return data;
  }

  async scanSource(sourceId: string): Promise<ScanResult> {
    const startTime = Date.now();
    
    const { data: source, error } = await this.supabase
      .from('intelligence_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (error || !source) {
      throw new Error('Source not found');
    }

    if (!source.active) {
      throw new Error('Source is inactive');
    }

    try {
      let items: any[] = [];
      
      switch (source.type) {
        case 'rss':
          items = await this.scanRSSFeed(source);
          break;
        case 'api':
          items = await this.scanAPI(source);
          break;
        case 'web':
          items = await this.scanWebPage(source);
          break;
        case 'email':
          items = await this.scanEmail(source);
          break;
      }

      // Filter items by keywords and categories
      const relevantItems = this.filterRelevantItems(items, source);

      // Save intelligence items
      await this.saveIntelligenceItems(relevantItems, source);

      // Update source after successful scan
      await this.updateSourceAfterScan(source, true, items.length);

      // Update reliability score based on relevance
      const relevanceRate = items.length > 0 ? relevantItems.length / items.length : 0;
      await this.updateReliabilityScore(source, 1.0, relevanceRate);

      return {
        source_id: sourceId,
        items_found: items.length,
        relevant_items: relevantItems.length,
        errors: [],
        scan_duration_ms: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      // Update source after failed scan
      await this.updateSourceAfterScan(source, false, 0, error.message);
      
      throw error;
    }
  }

  async scanDueSources(): Promise<ScanResult[]> {
    const now = new Date().toISOString();

    const { data: sources, error } = await this.supabase
      .from('intelligence_sources')
      .select('id')
      .eq('active', true)
      .lt('error_count', 5)
      .lte('next_scan_at', now);

    if (error) {
      throw new Error(`Failed to fetch due sources: ${error.message}`);
    }

    const results: ScanResult[] = [];
    
    for (const source of sources || []) {
      try {
        const result = await this.scanSource(source.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to scan source ${source.id}:`, error);
      }
    }

    return results;
  }

  async getActiveSourcesSummary(): Promise<any> {
    const { data, error } = await this.supabase
      .from('intelligence_sources')
      .select('type, scanning_frequency, reliability_score')
      .eq('active', true);

    if (error) {
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }

    const summary = {
      total: data?.length || 0,
      by_type: {} as Record<SourceType, number>,
      average_reliability: 0,
      scan_frequencies: {} as Record<string, number>
    };

    if (data && data.length > 0) {
      data.forEach((source: any) => {
        const sourceType = source.type as keyof typeof summary.by_type;
        const scanFreq = source.scanning_frequency as keyof typeof summary.scan_frequencies;
        summary.by_type[sourceType] = (summary.by_type[sourceType] || 0) + 1;
        summary.scan_frequencies[scanFreq] = 
          (summary.scan_frequencies[scanFreq] || 0) + 1;
      });

      const totalReliability = data.reduce((sum, s) => sum + s.reliability_score, 0);
      summary.average_reliability = Math.round(totalReliability / data.length);
    }

    return summary;
  }

  private async scanRSSFeed(source: IntelligenceSource): Promise<any[]> {
    if (!source.url) {
      throw new Error('RSS URL not configured');
    }

    const feed = await this.rssParser.parseURL(source.url);
    
    return feed.items.map(item => ({
      title: item.title,
      content: item.contentSnippet || item.content,
      link: item.link,
      published: item.pubDate ? new Date(item.pubDate) : new Date(),
      categories: item.categories || [],
      source_type: 'rss'
    }));
  }

  private async scanAPI(source: IntelligenceSource): Promise<any[]> {
    if (!source.url || !source.api_config) {
      throw new Error('API configuration incomplete');
    }

    const headers = { ...source.api_config.headers };
    
    if (source.api_config.auth_type === 'bearer' && source.api_config.auth_token) {
      headers['Authorization'] = `Bearer ${source.api_config.auth_token}`;
    } else if (source.api_config.auth_type === 'api-key' && source.api_config.auth_token) {
      headers['X-API-Key'] = source.api_config.auth_token;
    }

    const response = await axios.get(source.url, {
      headers,
      timeout: 30000
    });

    // Parse response based on structure (would need customization per API)
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.items) {
      return response.data.items;
    } else if (response.data.results) {
      return response.data.results;
    }

    return [];
  }

  private async scanWebPage(source: IntelligenceSource): Promise<any[]> {
    if (!source.url) {
      throw new Error('Web URL not configured');
    }

    // Web scraping would be implemented here
    // This is a placeholder
    return [];
  }

  private async scanEmail(source: IntelligenceSource): Promise<any[]> {
    // Email scanning would integrate with email service
    // This is a placeholder
    return [];
  }

  private filterRelevantItems(items: any[], source: IntelligenceSource): any[] {
    return items.filter(item => {
      const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
      
      // Check keywords
      if (source.keywords.length > 0) {
        const hasKeyword = source.keywords.some(keyword => 
          text.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      // Check categories
      if (source.categories.length > 0 && item.categories) {
        const hasCategory = item.categories.some((cat: string) => 
          source.categories.includes(cat)
        );
        if (!hasCategory) return false;
      }

      return true;
    });
  }

  private async saveIntelligenceItems(
    items: any[],
    source: IntelligenceSource
  ): Promise<void> {
    const intelligenceItems = items.map(item => ({
      source_id: source.id,
      type: this.determineIntelligenceType(item),
      category: this.determineCategory(item, source),
      title: item.title || 'Untitled',
      content: item.content || item.description || '',
      relevance_score: this.calculateRelevance(item, source),
      entities_mentioned: this.extractEntities(item),
      recommended_actions: this.generateActions(item),
      priority: this.determinePriority(item),
      processed: false,
      created_at: new Date().toISOString(),
      expires_at: this.calculateExpiry(item)
    }));

    if (intelligenceItems.length > 0) {
      const { error } = await this.supabase
        .from('intelligence')
        .insert(intelligenceItems);

      if (error) {
        console.error('Failed to save intelligence items:', error);
      }
    }
  }

  private determineIntelligenceType(item: any): string {
    const content = (item.title + ' ' + item.content).toLowerCase();
    
    if (content.includes('trend') || content.includes('growth')) return 'trend';
    if (content.includes('opportunity') || content.includes('potential')) return 'opportunity';
    if (content.includes('risk') || content.includes('threat')) return 'risk';
    if (content.includes('update') || content.includes('change')) return 'update';
    if (content.includes('benchmark') || content.includes('comparison')) return 'benchmark';
    
    return 'update';
  }

  private determineCategory(item: any, source: IntelligenceSource): string {
    if (source.categories.length > 0) {
      return source.categories[0];
    }
    return 'general';
  }

  private calculateRelevance(item: any, source: IntelligenceSource): number {
    let score = 50; // Base score
    
    const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
    
    // Increase score for each matching keyword
    source.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });

    // Cap at 100
    return Math.min(100, score);
  }

  private extractEntities(item: any): any[] {
    // Placeholder for entity extraction
    // In production, would use NER (Named Entity Recognition)
    return [];
  }

  private generateActions(item: any): string[] {
    // Placeholder for action generation
    // In production, would use AI to generate recommendations
    return ['Review and assess impact', 'Monitor for developments'];
  }

  private determinePriority(item: any): string {
    const content = (item.title + ' ' + item.content).toLowerCase();
    
    if (content.includes('urgent') || content.includes('critical')) return 'high';
    if (content.includes('important') || content.includes('significant')) return 'medium';
    
    return 'low';
  }

  private calculateExpiry(item: any): string {
    // Default to 30 days expiry
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry.toISOString();
  }

  private calculateNextScanTime(frequency: string): string {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        now.setHours(now.getHours() + 1);
        break;
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
    }
    
    return now.toISOString();
  }

  private async updateSourceAfterScan(
    source: IntelligenceSource,
    success: boolean,
    itemsFound: number,
    errorMessage?: string
  ): Promise<void> {
    if (success) {
      await this.supabase
        .from('intelligence_sources')
        .update({
          last_scanned_at: new Date().toISOString(),
          next_scan_at: this.calculateNextScanTime(source.scanning_frequency),
          error_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', source.id);
    } else {
      const newErrorCount = source.error_count + 1;
      
      await this.supabase
        .from('intelligence_sources')
        .update({
          error_count: newErrorCount,
          active: newErrorCount >= 5 ? false : source.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', source.id);

      // Log error
      if (errorMessage) {
        await this.supabase
          .from('intelligence_source_errors')
          .insert({
            source_id: source.id,
            error_message: errorMessage,
            occurred_at: new Date().toISOString()
          });
      }
    }
  }

  private async updateReliabilityScore(
    source: IntelligenceSource,
    successRate: number,
    relevanceRate: number
  ): Promise<void> {
    const newScore = (successRate * 0.3) + (relevanceRate * 0.7);
    const smoothedScore = (source.reliability_score * 0.7) + (newScore * 0.3);
    const finalScore = Math.min(100, Math.max(0, Math.round(smoothedScore)));

    await this.supabase
      .from('intelligence_sources')
      .update({ 
        reliability_score: finalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', source.id);
  }
}

export default IntelligenceSourceService;