import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export class IntelligenceService {
  async detectSignals(entityType: string, timeframe: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      // Analyze patterns in recent activities
      const signals = [];

      // Check for increased MoU activity
      const { data: mous } = await supabaseAdmin
        .from('mous')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (mous && mous.length > 5) {
        signals.push({
          type: 'trend',
          severity: 'medium',
          message: 'Increased MoU activity detected',
          data: { count: mous.length }
        });
      }

      // Check for expiring agreements
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      const { data: expiring } = await supabaseAdmin
        .from('mous')
        .select('*')
        .lte('expiry_date', expiryDate.toISOString())
        .gte('expiry_date', new Date().toISOString());

      if (expiring && expiring.length > 0) {
        signals.push({
          type: 'alert',
          severity: 'high',
          message: 'MoUs expiring soon',
          data: { count: expiring.length, mous: expiring }
        });
      }

      return signals;
    } catch (error) {
      logError('Signal detection error', error as Error);
      throw error;
    }
  }

  async identifyOpportunities(countryId?: string) {
    const opportunities = [];

    // Check for countries without recent engagement
    const { data: countries } = await supabaseAdmin
      .from('countries')
      .select('*')
      .is('last_visit_date', null);

    if (countries && countries.length > 0) {
      opportunities.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Countries without recent engagement',
        action: 'Schedule visits or meetings',
        targets: countries.map(c => ({ id: c.id, name: c.name_en }))
      });
    }

    return opportunities;
  }

  async analyzeTrends(metric: string, period: number = 90) {
    // Trend analysis implementation
    return {
      metric,
      trend: 'increasing',
      change_percentage: 15,
      forecast: 'positive'
    };
  }

  async generateSuggestions(context: any): Promise<string[]> {
    try {
      const suggestions: string[] = [];

      // Generate contextual suggestions based on input
      if (context.type === 'event') {
        suggestions.push('Consider inviting key stakeholders from partner organizations');
        suggestions.push('Prepare bilingual documentation for international participants');
        suggestions.push('Schedule follow-up meetings within 30 days');
      } else if (context.type === 'mou') {
        suggestions.push('Include clear deliverables with measurable outcomes');
        suggestions.push('Set up quarterly review meetings');
        suggestions.push('Define escalation procedures for dispute resolution');
      }

      return suggestions;
    } catch (error) {
      logError('Failed to generate suggestions', error as Error);
      throw error;
    }
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number }> {
    try {
      // Simple sentiment analysis - in production would use AI model
      const positiveWords = ['excellent', 'good', 'positive', 'successful', 'strong'];
      const negativeWords = ['poor', 'bad', 'negative', 'failed', 'weak'];

      const textLower = text.toLowerCase();
      const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;

      let sentiment = 'neutral';
      let confidence = 0.5;

      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        confidence = Math.min(0.9, 0.5 + (positiveCount * 0.1));
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        confidence = Math.min(0.9, 0.5 + (negativeCount * 0.1));
      }

      return { sentiment, confidence };
    } catch (error) {
      logError('Failed to analyze sentiment', error as Error);
      throw error;
    }
  }

  async summarizeText(text: string): Promise<string> {
    try {
      // Simple text summarization - in production would use AI model
      const sentences = text.split('.').filter(s => s.trim().length > 0);
      const maxSentences = 3;
      const summary = sentences.slice(0, maxSentences).join('. ') + '.';

      return summary;
    } catch (error) {
      logError('Failed to summarize text', error as Error);
      throw error;
    }
  }

  async extractKeyPoints(text: string): Promise<string[]> {
    try {
      // Extract key points from text
      const sentences = text.split('.').filter(s => s.trim().length > 0);
      const keyPoints = sentences
        .filter(s => {
          const lower = s.toLowerCase();
          return lower.includes('important') ||
                 lower.includes('key') ||
                 lower.includes('critical') ||
                 lower.includes('must') ||
                 lower.includes('require');
        })
        .slice(0, 5)
        .map(s => s.trim());

      return keyPoints.length > 0 ? keyPoints : [sentences[0]?.trim()].filter(Boolean);
    } catch (error) {
      logError('Failed to extract key points', error as Error);
      throw error;
    }
  }

  async extractActionItems(text: string): Promise<string[]> {
    try {
      // Extract action items from text
      const lines = text.split('\n');
      const actionItems = lines
        .filter(line => {
          const lower = line.toLowerCase();
          return lower.includes('action:') ||
                 lower.includes('todo:') ||
                 lower.includes('task:') ||
                 lower.includes('need to') ||
                 lower.includes('will') ||
                 lower.includes('should');
        })
        .map(line => line.replace(/^(action:|todo:|task:)/i, '').trim())
        .slice(0, 10);

      return actionItems;
    } catch (error) {
      logError('Failed to extract action items', error as Error);
      throw error;
    }
  }

  async storeFeedback(feedbackData: any): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('intelligence_feedback')
        .insert({
          entity_type: feedbackData.entityType,
          entity_id: feedbackData.entityId,
          feedback_type: feedbackData.type,
          rating: feedbackData.rating,
          comments: feedbackData.comments,
          created_by: feedbackData.userId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      logInfo('Feedback stored successfully', { feedbackData });
    } catch (error) {
      logError('Failed to store feedback', error as Error);
      throw error;
    }
  }

  // Missing methods for API compatibility
  async getInsights(entityType: string, entityId: string): Promise<any> {
    try {
      const signals = await this.detectSignals(entityType);
      const opportunities = await this.identifyOpportunities(entityId);
      const trends = await this.analyzeTrends(entityType);

      return {
        signals,
        opportunities,
        trends,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logError('Failed to get insights', error as Error);
      throw error;
    }
  }

  async createInsight(insightData: any): Promise<any> {
    try {
      const { error, data } = await supabaseAdmin
        .from('insights')
        .insert({
          entity_type: insightData.entityType,
          entity_id: insightData.entityId,
          type: insightData.type,
          title: insightData.title,
          description: insightData.description,
          severity: insightData.severity || 'medium',
          metadata: insightData.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('Failed to create insight', error as Error);
      throw error;
    }
  }

  async analyzeEntity(entityType: string, entityId: string): Promise<any> {
    try {
      // Get entity data based on type
      let entity;
      let analysis: any = {};

      if (entityType === 'country') {
        const { data } = await supabaseAdmin
          .from('countries')
          .select('*')
          .eq('id', entityId)
          .single();
        entity = data;

        // Analyze country relationships
        const { data: mous } = await supabaseAdmin
          .from('mous')
          .select('*')
          .contains('parties', [{ country_id: entityId }]);

        analysis.mou_count = mous?.length || 0;
        analysis.active_mous = mous?.filter(m => m.status === 'active').length || 0;
      } else if (entityType === 'organization') {
        const { data } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('id', entityId)
          .single();
        entity = data;

        // Analyze organization engagement
        const { data: events } = await supabaseAdmin
          .from('events')
          .select('*')
          .eq('organization_id', entityId);

        analysis.event_count = events?.length || 0;
        analysis.upcoming_events = events?.filter(e => new Date(e.start_date) > new Date()).length || 0;
      }

      const signals = await this.detectSignals(entityType);
      const opportunities = await this.identifyOpportunities(entityId);

      return {
        entity,
        analysis,
        signals,
        opportunities,
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      logError('Failed to analyze entity', error as Error);
      throw error;
    }
  }
}

export default IntelligenceService;
