export type ConflictType = 'contradiction' | 'ambiguity' | 'outdated';
export type ConflictSeverity = 'low' | 'medium' | 'high';
export type ReconciliationStatus = 'pending' | 'in-progress' | 'resolved';

export interface PositionConflict {
  position1_id: string;
  position2_id: string;
  conflict_type: ConflictType;
  description: string;
  severity: ConflictSeverity;
  detected_at: Date;
  suggested_resolution?: string;
}

export interface PositionConsistency {
  id: string;
  thematic_area_id: string;
  consistency_score: number;
  positions_analyzed: string[];
  conflicts: PositionConflict[];
  reconciliation_status: ReconciliationStatus;
  reconciled_by?: string;
  reconciliation_notes?: string;
  calculated_at: Date;
  updated_at: Date;
}

export interface CreatePositionConsistencyDto {
  thematic_area_id: string;
  positions_analyzed: string[];
}

export interface ReconcileConflictDto {
  conflict_index: number;
  resolution_notes: string;
  reconciled_by: string;
}

export interface ConsistencyAnalysisResult {
  consistency_score: number;
  conflicts: PositionConflict[];
  recommendations: string[];
  analysis_time_ms: number;
}

export class PositionConsistencyModel {
  static tableName = 'position_consistencies';

  static readonly CONSISTENCY_THRESHOLDS = {
    excellent: 90,
    good: 75,
    moderate: 60,
    poor: 40,
    critical: 0
  };

  static readonly SEVERITY_WEIGHTS: Record<ConflictSeverity, number> = {
    low: 0.2,
    medium: 0.5,
    high: 1.0
  };

  static validate(consistency: Partial<PositionConsistency>): boolean {
    if (!consistency.thematic_area_id) {
      return false;
    }

    if (!consistency.positions_analyzed || consistency.positions_analyzed.length < 2) {
      return false;
    }

    if (consistency.consistency_score !== undefined) {
      if (consistency.consistency_score < 0 || consistency.consistency_score > 100) {
        return false;
      }
    }

    return true;
  }

  static calculateConsistencyScore(
    totalPositions: number,
    conflicts: PositionConflict[]
  ): number {
    if (totalPositions === 0) {
      return 100;
    }

    let weightedConflicts = 0;
    conflicts.forEach(conflict => {
      weightedConflicts += this.SEVERITY_WEIGHTS[conflict.severity];
    });

    const maxPossibleConflicts = (totalPositions * (totalPositions - 1)) / 2;
    const conflictRatio = weightedConflicts / maxPossibleConflicts;
    const score = Math.max(0, Math.round(100 * (1 - conflictRatio)));

    return score;
  }

  static getConsistencyLevel(score: number): string {
    if (score >= this.CONSISTENCY_THRESHOLDS.excellent) {
      return 'excellent';
    } else if (score >= this.CONSISTENCY_THRESHOLDS.good) {
      return 'good';
    } else if (score >= this.CONSISTENCY_THRESHOLDS.moderate) {
      return 'moderate';
    } else if (score >= this.CONSISTENCY_THRESHOLDS.poor) {
      return 'poor';
    } else {
      return 'critical';
    }
  }

  static detectConflictType(position1: any, position2: any): ConflictType | null {
    // Simplified conflict detection logic
    // In real implementation, this would use NLP and semantic analysis
    
    const date1 = new Date(position1.effective_date);
    const date2 = new Date(position2.effective_date);
    const daysDifference = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDifference > 365) {
      return 'outdated';
    }

    // Check for direct contradictions (would use NLP in real implementation)
    if (this.hasContradiction(position1.content, position2.content)) {
      return 'contradiction';
    }

    // Check for ambiguity
    if (this.hasAmbiguity(position1.content, position2.content)) {
      return 'ambiguity';
    }

    return null;
  }

  static determineSeverity(conflictType: ConflictType): ConflictSeverity {
    switch (conflictType) {
      case 'contradiction':
        return 'high';
      case 'ambiguity':
        return 'medium';
      case 'outdated':
        return 'low';
      default:
        return 'low';
    }
  }

  static canReconcile(
    consistency: PositionConsistency,
    userId: string
  ): boolean {
    if (consistency.reconciliation_status === 'resolved') {
      return false;
    }

    if (consistency.conflicts.length === 0) {
      return false;
    }

    // Additional authorization checks would go here
    return true;
  }

  static markConflictResolved(
    consistency: PositionConsistency,
    conflictIndex: number,
    resolution: string
  ): boolean {
    if (conflictIndex < 0 || conflictIndex >= consistency.conflicts.length) {
      return false;
    }

    // In real implementation, this would update the conflict status
    consistency.conflicts[conflictIndex].suggested_resolution = resolution;

    // Check if all conflicts are resolved
    const allResolved = consistency.conflicts.every(c => c.suggested_resolution);
    if (allResolved) {
      consistency.reconciliation_status = 'resolved';
    }

    return true;
  }

  static generateRecommendations(conflicts: PositionConflict[]): string[] {
    const recommendations: string[] = [];

    const highSeverityCount = conflicts.filter(c => c.severity === 'high').length;
    if (highSeverityCount > 0) {
      recommendations.push(
        `Address ${highSeverityCount} high-severity conflicts immediately to maintain position consistency`
      );
    }

    const outdatedCount = conflicts.filter(c => c.conflict_type === 'outdated').length;
    if (outdatedCount > 0) {
      recommendations.push(
        `Update ${outdatedCount} outdated positions to reflect current policy`
      );
    }

    const ambiguityCount = conflicts.filter(c => c.conflict_type === 'ambiguity').length;
    if (ambiguityCount > 0) {
      recommendations.push(
        `Clarify ${ambiguityCount} ambiguous positions to improve clarity`
      );
    }

    if (conflicts.length === 0) {
      recommendations.push('Positions are consistent - maintain regular reviews');
    }

    return recommendations;
  }

  // Placeholder methods for conflict detection
  private static hasContradiction(content1: string, content2: string): boolean {
    // In real implementation, use NLP to detect contradictions
    return false;
  }

  private static hasAmbiguity(content1: string, content2: string): boolean {
    // In real implementation, use NLP to detect ambiguity
    return false;
  }
}

export default PositionConsistencyModel;