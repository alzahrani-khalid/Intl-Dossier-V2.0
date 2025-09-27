import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

type IntelligenceReport = Database['public']['Tables']['intelligence_reports']['Row'];

export interface EmbeddingRequest {
  text: string;
  language?: 'en' | 'ar';
  model?: string;
}

export interface SearchRequest {
  query: string;
  topK?: number;
  threshold?: number;
  filters?: {
    confidence_level?: Array<'low' | 'medium' | 'high' | 'verified'>;
    classification?: Array<'public' | 'internal' | 'confidential' | 'restricted'>;
    analysis_type?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    countries?: string[];
    organizations?: string[];
  };
  language?: 'en' | 'ar';
}

export interface SearchResult {
  report: IntelligenceReport;
  similarity: number;
  relevantSections: {
    title: string;
    content: string;
    matchScore: number;
  }[];
}

export interface ClusterAnalysis {
  clusterId: string;
  centroid: number[];
  members: string[];
  topTerms: string[];
  summary: string;
}

export class IntelligenceEmbeddingService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private anythingLLMUrl: string;
  private anythingLLMKey: string;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    anythingLLMUrl: string,
    anythingLLMKey: string
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.anythingLLMUrl = anythingLLMUrl;
    this.anythingLLMKey = anythingLLMKey;
  }

  async generateEmbedding(request: EmbeddingRequest): Promise<number[]> {
    // Check cache first
    const cacheKey = `${request.text}-${request.language}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      // Call AnythingLLM embedding endpoint
      const response = await fetch(`${this.anythingLLMUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.anythingLLMKey}`
        },
        body: JSON.stringify({
          input: request.text,
          model: request.model || 'text-embedding-ada-002'
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);

      // Limit cache size
      if (this.embeddingCache.size > 1000) {
        const firstKey = this.embeddingCache.keys().next().value;
        this.embeddingCache.delete(firstKey);
      }

      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Fallback to simple TF-IDF based embedding
      return this.generateFallbackEmbedding(request.text);
    }
  }

  async processIntelligenceReport(reportId: string): Promise<void> {
    // Fetch the report
    const { data: report, error } = await this.supabase
      .from('intelligence_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    // Combine relevant text fields for embedding
    const textToEmbed = this.prepareTextForEmbedding(report);

    // Generate embeddings for both languages
    const [embeddingEn, embeddingAr] = await Promise.all([
      this.generateEmbedding({ text: textToEmbed.en, language: 'en' }),
      this.generateEmbedding({ text: textToEmbed.ar, language: 'ar' })
    ]);

    // Average the embeddings for multilingual support
    const combinedEmbedding = this.averageEmbeddings([embeddingEn, embeddingAr]);

    // Store the embedding in the database
    const { error: updateError } = await this.supabase
      .from('intelligence_reports')
      .update({
        vector_embedding: `[${combinedEmbedding.join(',')}]`
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Failed to update embedding: ${updateError.message}`);
    }

    // Index key findings separately for fine-grained search
    if (report.key_findings) {
      await this.indexKeyFindings(reportId, report.key_findings as any[]);
    }
  }

  async semanticSearch(request: SearchRequest): Promise<SearchResult[]> {
    const {
      query,
      topK = 10,
      threshold = 0.5,
      filters = {},
      language = 'en'
    } = request;

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding({ text: query, language });

    // Build the base query
    let baseQuery = this.supabase
      .from('intelligence_reports')
      .select('*');

    // Apply filters
    if (filters.confidence_level?.length) {
      baseQuery = baseQuery.in('confidence_level', filters.confidence_level);
    }

    if (filters.classification?.length) {
      baseQuery = baseQuery.in('classification', filters.classification);
    }

    if (filters.dateRange) {
      baseQuery = baseQuery
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    // Execute the query
    const { data: reports, error } = await baseQuery;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Calculate similarities and rank results
    const results: SearchResult[] = [];

    for (const report of reports || []) {
      if (!report.vector_embedding) continue;

      // Parse the stored embedding
      const reportEmbedding = this.parseEmbedding(report.vector_embedding);
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, reportEmbedding);

      if (similarity >= threshold) {
        // Extract relevant sections
        const relevantSections = this.extractRelevantSections(report, query, language);

        results.push({
          report,
          similarity,
          relevantSections
        });
      }
    }

    // Sort by similarity and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async findSimilarReports(
    reportId: string,
    topK: number = 5
  ): Promise<Array<{ report: IntelligenceReport; similarity: number }>> {
    // Get the source report
    const { data: sourceReport, error } = await this.supabase
      .from('intelligence_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !sourceReport || !sourceReport.vector_embedding) {
      throw new Error('Source report not found or has no embedding');
    }

    const sourceEmbedding = this.parseEmbedding(sourceReport.vector_embedding);

    // Get all other reports
    const { data: allReports } = await this.supabase
      .from('intelligence_reports')
      .select('*')
      .neq('id', reportId)
      .not('vector_embedding', 'is', null);

    const similar: Array<{ report: IntelligenceReport; similarity: number }> = [];

    for (const report of allReports || []) {
      const reportEmbedding = this.parseEmbedding(report.vector_embedding!);
      const similarity = this.cosineSimilarity(sourceEmbedding, reportEmbedding);
      
      similar.push({ report, similarity });
    }

    return similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async clusterReports(
    minClusterSize: number = 3,
    similarityThreshold: number = 0.7
  ): Promise<ClusterAnalysis[]> {
    // Fetch all reports with embeddings
    const { data: reports } = await this.supabase
      .from('intelligence_reports')
      .select('*')
      .not('vector_embedding', 'is', null);

    if (!reports || reports.length < minClusterSize) {
      return [];
    }

    // Simple clustering using similarity threshold
    const clusters: Map<string, Set<string>> = new Map();
    const assigned: Set<string> = new Set();

    for (let i = 0; i < reports.length; i++) {
      if (assigned.has(reports[i].id)) continue;

      const cluster = new Set<string>([reports[i].id]);
      const clusterEmbedding = this.parseEmbedding(reports[i].vector_embedding!);

      for (let j = i + 1; j < reports.length; j++) {
        if (assigned.has(reports[j].id)) continue;

        const embedding = this.parseEmbedding(reports[j].vector_embedding!);
        const similarity = this.cosineSimilarity(clusterEmbedding, embedding);

        if (similarity >= similarityThreshold) {
          cluster.add(reports[j].id);
        }
      }

      if (cluster.size >= minClusterSize) {
        const clusterId = `cluster_${clusters.size + 1}`;
        clusters.set(clusterId, cluster);
        cluster.forEach(id => assigned.add(id));
      }
    }

    // Analyze each cluster
    const clusterAnalyses: ClusterAnalysis[] = [];

    for (const [clusterId, memberIds] of clusters) {
      const members = reports.filter(r => memberIds.has(r.id));
      const centroid = this.calculateCentroid(
        members.map(m => this.parseEmbedding(m.vector_embedding!))
      );

      const topTerms = this.extractTopTerms(members);
      const summary = this.generateClusterSummary(members);

      clusterAnalyses.push({
        clusterId,
        centroid,
        members: Array.from(memberIds),
        topTerms,
        summary
      });
    }

    return clusterAnalyses;
  }

  async detectTrends(
    timeWindow: { start: Date; end: Date },
    minFrequency: number = 3
  ): Promise<Array<{
    term: string;
    frequency: number;
    growth: number;
    relatedReports: string[];
  }>> {
    // Fetch reports within time window
    const { data: reports } = await this.supabase
      .from('intelligence_reports')
      .select('*')
      .gte('created_at', timeWindow.start.toISOString())
      .lte('created_at', timeWindow.end.toISOString());

    if (!reports || reports.length === 0) {
      return [];
    }

    // Extract terms and calculate frequencies
    const termFrequencies = new Map<string, Set<string>>();

    for (const report of reports) {
      const terms = this.extractKeyTerms(report);
      terms.forEach(term => {
        if (!termFrequencies.has(term)) {
          termFrequencies.set(term, new Set());
        }
        termFrequencies.get(term)!.add(report.id);
      });
    }

    // Calculate growth rates
    const midPoint = new Date(
      (timeWindow.start.getTime() + timeWindow.end.getTime()) / 2
    );

    const trends: any[] = [];

    for (const [term, reportIds] of termFrequencies) {
      if (reportIds.size < minFrequency) continue;

      const reportsArray = Array.from(reportIds);
      const beforeMid = reports.filter(
        r => reportsArray.includes(r.id) && new Date(r.created_at) < midPoint
      ).length;
      const afterMid = reportIds.size - beforeMid;

      const growth = beforeMid > 0 ? (afterMid - beforeMid) / beforeMid : 1;

      trends.push({
        term,
        frequency: reportIds.size,
        growth,
        relatedReports: reportsArray
      });
    }

    return trends.sort((a, b) => b.growth - a.growth);
  }

  private prepareTextForEmbedding(report: IntelligenceReport): { en: string; ar: string } {
    const en = [
      report.title_en,
      report.executive_summary_en,
      report.analysis_en
    ].filter(Boolean).join(' ');

    const ar = [
      report.title_ar,
      report.executive_summary_ar,
      report.analysis_ar
    ].filter(Boolean).join(' ');

    return { en, ar };
  }

  private async indexKeyFindings(reportId: string, findings: any[]): Promise<void> {
    // Store each key finding as a separate searchable entity
    // This would typically go to a separate table for fine-grained search
    for (const finding of findings) {
      if (typeof finding === 'object' && finding.text) {
        const embedding = await this.generateEmbedding({
          text: finding.text,
          language: finding.language || 'en'
        });
        
        // In production, store this in a key_findings table
        console.log(`Indexed finding for report ${reportId}`);
      }
    }
  }

  private generateFallbackEmbedding(text: string): number[] {
    // Simple TF-IDF based embedding as fallback
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1536).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.hashString(word);
      const position = hash % 1536;
      embedding[position] += 1 / Math.sqrt(words.length);
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private parseEmbedding(embeddingStr: string): number[] {
    try {
      const parsed = JSON.parse(embeddingStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];
    
    const avgEmbedding = new Array(embeddings[0].length).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < embedding.length; i++) {
        avgEmbedding[i] += embedding[i];
      }
    }

    return avgEmbedding.map(val => val / embeddings.length);
  }

  private extractRelevantSections(
    report: IntelligenceReport,
    query: string,
    language: 'en' | 'ar'
  ): any[] {
    const sections = [];
    const queryTerms = query.toLowerCase().split(/\s+/);

    // Check title
    const title = language === 'en' ? report.title_en : report.title_ar;
    if (this.containsTerms(title, queryTerms)) {
      sections.push({
        title: 'Title',
        content: title,
        matchScore: this.calculateMatchScore(title, queryTerms)
      });
    }

    // Check executive summary
    const summary = language === 'en' ? report.executive_summary_en : report.executive_summary_ar;
    if (this.containsTerms(summary, queryTerms)) {
      sections.push({
        title: 'Executive Summary',
        content: this.extractSnippet(summary, queryTerms),
        matchScore: this.calculateMatchScore(summary, queryTerms)
      });
    }

    // Check analysis
    const analysis = language === 'en' ? report.analysis_en : report.analysis_ar;
    if (this.containsTerms(analysis, queryTerms)) {
      sections.push({
        title: 'Analysis',
        content: this.extractSnippet(analysis, queryTerms),
        matchScore: this.calculateMatchScore(analysis, queryTerms)
      });
    }

    return sections.sort((a, b) => b.matchScore - a.matchScore);
  }

  private containsTerms(text: string, terms: string[]): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return terms.some(term => lowerText.includes(term));
  }

  private calculateMatchScore(text: string, terms: string[]): number {
    if (!text) return 0;
    const lowerText = text.toLowerCase();
    return terms.reduce((score, term) => {
      const matches = (lowerText.match(new RegExp(term, 'g')) || []).length;
      return score + matches;
    }, 0) / terms.length;
  }

  private extractSnippet(text: string, terms: string[], maxLength: number = 200): string {
    if (!text || text.length <= maxLength) return text;

    const lowerText = text.toLowerCase();
    let bestStart = 0;
    let bestScore = 0;

    for (let i = 0; i < text.length - maxLength; i++) {
      const snippet = lowerText.substring(i, i + maxLength);
      const score = terms.reduce((s, term) => 
        s + (snippet.includes(term) ? 1 : 0), 0
      );

      if (score > bestScore) {
        bestScore = score;
        bestStart = i;
      }
    }

    return '...' + text.substring(bestStart, bestStart + maxLength) + '...';
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    return this.averageEmbeddings(embeddings);
  }

  private extractTopTerms(reports: IntelligenceReport[]): string[] {
    const termFreq = new Map<string, number>();

    reports.forEach(report => {
      const terms = this.extractKeyTerms(report);
      terms.forEach(term => {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      });
    });

    return Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }

  private extractKeyTerms(report: IntelligenceReport): string[] {
    const text = report.title_en + ' ' + report.executive_summary_en;
    // Simple term extraction - in production, use NLP library
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'for', 'with', 'from', 'about', 'this', 'that', 'which'];
    return stopWords.includes(word);
  }

  private generateClusterSummary(reports: IntelligenceReport[]): string {
    const topTerms = this.extractTopTerms(reports).slice(0, 5);
    return `Cluster of ${reports.length} reports focusing on: ${topTerms.join(', ')}`;
  }
}

// Export factory function
export function createIntelligenceEmbeddingService(
  supabaseUrl: string,
  supabaseKey: string,
  anythingLLMUrl: string,
  anythingLLMKey: string
): IntelligenceEmbeddingService {
  return new IntelligenceEmbeddingService(supabaseUrl, supabaseKey, anythingLLMUrl, anythingLLMKey);
}