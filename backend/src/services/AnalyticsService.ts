import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export class AnalyticsService {
  async getDashboardMetrics(userId: string) {
    try {
      const cacheKey = `analytics:dashboard:${userId}`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) return cached;

      const [countries, mous, events, documents] = await Promise.all([
        supabaseAdmin.from('countries').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('mous').select('id, status', { count: 'exact' }),
        supabaseAdmin.from('events').select('id, start_date'),
        supabaseAdmin.from('documents').select('id', { count: 'exact', head: true })
      ]);

      const metrics = {
        total_countries: countries.count || 0,
        total_mous: mous.count || 0,
        active_mous: mous.data?.filter((m: any) => m.status === 'active').length || 0,
        upcoming_events: events.data?.filter((e: any) => new Date(e.start_date) > new Date()).length || 0,
        total_documents: documents.count || 0,
        generated_at: new Date().toISOString()
      };

      await cacheHelpers.set(cacheKey, metrics, 600);
      return metrics;
    } catch (error) {
      logError('Analytics error', error as Error);
      throw error;
    }
  }

  async calculateROI(mouId: string) {
    const mou = await supabaseAdmin
      .from('mous')
      .select('*')
      .eq('id', mouId)
      .single();

    if (!mou.data) throw new Error('MoU not found');

    const completedDeliverables = mou.data.deliverables?.filter((d: any) => d.status === 'completed').length || 0;
    const totalDeliverables = mou.data.deliverables?.length || 0;

    return {
      completion_rate: totalDeliverables > 0 ? (completedDeliverables / totalDeliverables) * 100 : 0,
      estimated_value: mou.data.financial_implications?.estimated_value || 0,
      roi_score: completedDeliverables * 25
    };
  }
}

export default AnalyticsService;
