import { createClient } from '@supabase/supabase-js';
import {
  PositionConsistency,
  CreatePositionConsistencyDto,
  ReconcileConflictDto,
  ConsistencyAnalysisResult,
  PositionConflict,
  ConflictType,
  ConflictSeverity
} from '../models/PositionConsistency';

export class PositionConsistencyService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async analyzeConsistency(
    thematicAreaId: string
  ): Promise<ConsistencyAnalysisResult> {
    const startTime = Date.now();

    // Get all active positions for the thematic area
    const { data: positions, error } = await this.supabase
      .from('positions')
      .select('*')
      .eq('thematic_area_id', thematicAreaId)
      .eq('status', 'approved')
      .or('expiry_date.is.null,expiry_date.gt.now()');

    if (error) {
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }

    if (!positions || positions.length < 2) {
      throw new Error('Insufficient positions for consistency analysis');
    }

    // Analyze pairs for conflicts
    const conflicts = await this.detectConflicts(positions);
    const consistencyScore = this.calculateScore(positions.length, conflicts);
    const recommendations = this.generateRecommendations(conflicts);

    // Save analysis result
    await this.saveAnalysis({
      thematic_area_id: thematicAreaId,
      positions_analyzed: positions.map(p => p.id)
    }, conflicts, consistencyScore);

    return {
      consistency_score: consistencyScore,
      conflicts,
      recommendations,
      analysis_time_ms: Date.now() - startTime
    };
  }

  async reconcileConflict(
    consistencyId: string,
    dto: ReconcileConflictDto
  ): Promise<PositionConsistency> {
    const { data: consistency, error: fetchError } = await this.supabase
      .from('position_consistency')
      .select('*')
      .eq('id', consistencyId)
      .single();

    if (fetchError || !consistency) {
      throw new Error('Consistency analysis not found');
    }

    if (consistency.reconciliation_status === 'resolved') {
      throw new Error('All conflicts already resolved');
    }

    // Update specific conflict
    const conflicts = consistency.conflicts as PositionConflict[];
    if (dto.conflict_index >= 0 && dto.conflict_index < conflicts.length) {
      conflicts[dto.conflict_index] = {
        ...conflicts[dto.conflict_index],
        suggested_resolution: dto.resolution_notes
      };
    } else {
      throw new Error('Invalid conflict index');
    }

    // Check if all conflicts resolved
    const allResolved = conflicts.every(c => c.suggested_resolution);

    const { data, error } = await this.supabase
      .from('position_consistency')
      .update({
        conflicts,
        reconciliation_status: allResolved ? 'resolved' : 'in-progress',
        reconciled_by: allResolved ? dto.reconciled_by : consistency.reconciled_by,
        reconciliation_notes: dto.resolution_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', consistencyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update reconciliation: ${error.message}`);
    }

    return data;
  }

  async getConsistencyHistory(
    thematicAreaId: string,
    limit: number = 10
  ): Promise<PositionConsistency[]> {
    const { data, error } = await this.supabase
      .from('position_consistency')
      .select('*')
      .eq('thematic_area_id', thematicAreaId)
      .order('calculated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }

    return data || [];
  }

  async getUnresolvedConflicts(): Promise<PositionConsistency[]> {
    const { data, error } = await this.supabase
      .from('position_consistency')
      .select('*')
      .neq('reconciliation_status', 'resolved')
      .gt('jsonb_array_length(conflicts)', 0)
      .order('consistency_score', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch unresolved conflicts: ${error.message}`);
    }

    return data || [];
  }

  async getCriticalInconsistencies(): Promise<PositionConsistency[]> {
    const { data, error } = await this.supabase
      .from('position_consistency')
      .select('*')
      .lt('consistency_score', 40) // Critical threshold
      .neq('reconciliation_status', 'resolved')
      .order('consistency_score', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch critical inconsistencies: ${error.message}`);
    }

    return data || [];
  }

  private async detectConflicts(positions: any[]): Promise<PositionConflict[]> {
    const conflicts: PositionConflict[] = [];

    for (let i = 0; i < positions.length - 1; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const conflict = await this.analyzePositionPair(
          positions[i], 
          positions[j]
        );
        
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  private async analyzePositionPair(
    position1: any,
    position2: any
  ): Promise<PositionConflict | null> {
    // Check for outdated positions
    const date1 = new Date(position1.effective_date);
    const date2 = new Date(position2.effective_date);
    const daysDifference = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDifference > 365) {
      return {
        position1_id: position1.id,
        position2_id: position2.id,
        conflict_type: 'outdated',
        description: `Position versions differ by ${Math.floor(daysDifference)} days`,
        severity: 'low',
        detected_at: new Date()
      };
    }

    // Semantic analysis for contradictions and ambiguity
    const semanticConflict = await this.performSemanticAnalysis(
      position1.content,
      position2.content
    );

    if (semanticConflict) {
      return {
        position1_id: position1.id,
        position2_id: position2.id,
        conflict_type: semanticConflict.type,
        description: semanticConflict.description,
        severity: semanticConflict.severity,
        detected_at: new Date()
      };
    }

    return null;
  }

  private async performSemanticAnalysis(
    content1: string,
    content2: string
  ): Promise<{ type: ConflictType; description: string; severity: ConflictSeverity } | null> {
    // In production, this would use NLP/AI services
    // Placeholder implementation using simple heuristics
    
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    // Check for contradictory keywords
    const contradictoryPairs = [
      ['approve', 'reject'],
      ['allow', 'prohibit'],
      ['increase', 'decrease'],
      ['mandatory', 'optional']
    ];

    for (const [word1, word2] of contradictoryPairs) {
      if ((words1.has(word1) && words2.has(word2)) || 
          (words1.has(word2) && words2.has(word1))) {
        return {
          type: 'contradiction',
          description: `Contradictory terms detected: ${word1} vs ${word2}`,
          severity: 'high'
        };
      }
    }

    // Check for ambiguity (placeholder logic)
    const ambiguousTerms = ['may', 'might', 'could', 'possibly', 'sometimes'];
    const ambiguityCount1 = Array.from(words1).filter(w => ambiguousTerms.includes(w)).length;
    const ambiguityCount2 = Array.from(words2).filter(w => ambiguousTerms.includes(w)).length;

    if (ambiguityCount1 > 2 || ambiguityCount2 > 2) {
      return {
        type: 'ambiguity',
        description: 'Positions contain ambiguous language',
        severity: 'medium'
      };
    }

    return null;
  }

  private calculateScore(
    totalPositions: number,
    conflicts: PositionConflict[]
  ): number {
    if (totalPositions === 0) return 100;
    if (conflicts.length === 0) return 100;

    const severityWeights: Record<ConflictSeverity, number> = {
      low: 0.2,
      medium: 0.5,
      high: 1.0
    };

    let weightedConflicts = 0;
    conflicts.forEach(conflict => {
      weightedConflicts += severityWeights[conflict.severity];
    });

    const maxPossibleConflicts = (totalPositions * (totalPositions - 1)) / 2;
    const conflictRatio = weightedConflicts / maxPossibleConflicts;
    const score = Math.max(0, Math.round(100 * (1 - conflictRatio)));

    return score;
  }

  private generateRecommendations(conflicts: PositionConflict[]): string[] {
    const recommendations: string[] = [];

    const highSeverity = conflicts.filter(c => c.severity === 'high');
    const mediumSeverity = conflicts.filter(c => c.severity === 'medium');
    const lowSeverity = conflicts.filter(c => c.severity === 'low');

    if (highSeverity.length > 0) {
      recommendations.push(
        `Address ${highSeverity.length} high-severity conflicts immediately to maintain position integrity`
      );
    }

    if (mediumSeverity.length > 0) {
      recommendations.push(
        `Review ${mediumSeverity.length} medium-severity conflicts for potential clarification`
      );
    }

    const outdated = conflicts.filter(c => c.conflict_type === 'outdated');
    if (outdated.length > 0) {
      recommendations.push(
        `Update ${outdated.length} outdated positions to reflect current policy`
      );
    }

    if (conflicts.length === 0) {
      recommendations.push('Positions are fully consistent - maintain regular reviews');
    } else if (conflicts.length > 5) {
      recommendations.push('Consider comprehensive position review and alignment workshop');
    }

    return recommendations;
  }

  private async saveAnalysis(
    dto: CreatePositionConsistencyDto,
    conflicts: PositionConflict[],
    score: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('position_consistency')
      .insert({
        thematic_area_id: dto.thematic_area_id,
        consistency_score: score,
        positions_analyzed: dto.positions_analyzed,
        conflicts,
        reconciliation_status: conflicts.length === 0 ? 'resolved' : 'pending',
        calculated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save analysis:', error);
    }
  }
}

export default PositionConsistencyService;