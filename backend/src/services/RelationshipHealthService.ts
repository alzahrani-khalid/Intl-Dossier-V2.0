import { supabaseAdmin } from '../config/supabase';
import { logInfo, logError } from '../utils/logger';

interface HealthMetrics {
  engagement_frequency: number;
  mou_performance: number;
  response_time: number;
  commitment_fulfillment: number;
  document_exchange: number;
}

export class RelationshipHealthService {
  calculateHealthScore(metrics: HealthMetrics): number {
    const weights = {
      engagement_frequency: 0.25,
      mou_performance: 0.30,
      response_time: 0.15,
      commitment_fulfillment: 0.20,
      document_exchange: 0.10
    };

    let score = 0;
    for (const [key, value] of Object.entries(metrics)) {
      score += value * weights[key as keyof HealthMetrics];
    }

    return Math.min(100, Math.max(0, score));
  }

  async getRelationshipHealth(entityType: string, entityId: string) {
    try {
      // Fetch metrics from various sources
      const metrics = await this.gatherMetrics(entityType, entityId);
      const score = this.calculateHealthScore(metrics);

      const health = {
        score,
        status: this.getHealthStatus(score),
        metrics,
        recommendations: this.generateRecommendations(score, metrics),
        calculated_at: new Date().toISOString()
      };

      logInfo(`Health calculated for ${entityType} ${entityId}: ${score}`);
      return health;
    } catch (error) {
      logError('Health calculation error', error as Error);
      throw error;
    }
  }

  private async gatherMetrics(entityType: string, entityId: string): Promise<HealthMetrics> {
    // Gather metrics from database
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq(`${entityType}_id`, entityId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: mous } = await supabaseAdmin
      .from('mous')
      .select('deliverables')
      .contains('parties', [{ [`${entityType}_id`]: entityId }]);

    const engagementFrequency = (events?.length || 0) * 10;
    const mouPerformance = this.calculateMouPerformance(mous || []);

    return {
      engagement_frequency: Math.min(100, engagementFrequency),
      mou_performance: mouPerformance,
      response_time: 85,
      commitment_fulfillment: 75,
      document_exchange: 60
    };
  }

  private calculateMouPerformance(mous: any[]): number {
    if (mous.length === 0) return 0;

    let totalScore = 0;
    for (const mou of mous) {
      const deliverables = mou.deliverables || [];
      const completed = deliverables.filter((d: any) => d.status === 'completed').length;
      const total = deliverables.length;
      if (total > 0) {
        totalScore += (completed / total) * 100;
      }
    }

    return totalScore / mous.length;
  }

  private getHealthStatus(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs_attention';
  }

  private generateRecommendations(score: number, metrics: HealthMetrics): string[] {
    const recommendations = [];

    if (metrics.engagement_frequency < 50) {
      recommendations.push('Increase engagement frequency through regular meetings or communications');
    }

    if (metrics.mou_performance < 60) {
      recommendations.push('Review and accelerate pending MoU deliverables');
    }

    if (metrics.commitment_fulfillment < 70) {
      recommendations.push('Focus on fulfilling outstanding commitments');
    }

    if (score < 60) {
      recommendations.push('Schedule strategic review meeting to improve relationship');
    }

    return recommendations;
  }

  // Missing method for API compatibility
  async getRecommendations(relationshipId: string): Promise<string[]> {
    try {
      // Get relationship health first
      const health = await this.getRelationshipHealth('relationship', relationshipId);
      return health.recommendations;
    } catch (error) {
      logError('Failed to get recommendations', error as Error);
      // Return default recommendations on error
      return [
        'Schedule regular review meetings',
        'Monitor commitment progress',
        'Maintain active communication channels'
      ];
    }
  }
}

export default RelationshipHealthService;
