export interface AnomalyPattern {
  id: string;
  entity_type: 'user' | 'system' | 'api';
  entity_id: string;
  anomaly_score: number; // 0..1
  sensitivity_level: 'low' | 'medium' | 'high' | 'custom';
  detected_at: string;
  reviewed_at: string | null;
}

function rid() { return Math.random().toString(36).slice(2, 10); }

const anomalies: AnomalyPattern[] = Array.from({ length: 30 }).map(() => ({
  id: rid(),
  entity_type: (['user', 'system', 'api'] as const)[Math.floor(Math.random() * 3)],
  entity_id: rid(),
  anomaly_score: Math.random(),
  sensitivity_level: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
  detected_at: new Date(Date.now() - Math.floor(Math.random() * 86_400_000)).toISOString(),
  reviewed_at: null,
}));

export class AnomalyDetectionService {
  list(params: { entity_type?: string; min_score?: number; unreviewed_only?: boolean; from?: string; to?: string; limit?: number; offset?: number }) {
    let items = anomalies.slice();
    if (params.entity_type) items = items.filter(a => a.entity_type === params.entity_type);
    if (typeof params.min_score === 'number') items = items.filter(a => a.anomaly_score >= params.min_score!);
    if (params.unreviewed_only) items = items.filter(a => a.reviewed_at === null);
    if (params.from) items = items.filter(a => new Date(a.detected_at) >= new Date(params.from!));
    if (params.to) items = items.filter(a => new Date(a.detected_at) <= new Date(params.to!));
    const start = params.offset || 0;
    const end = params.limit ? start + params.limit : undefined;
    return items.slice(start, end);
  }
  review(id: string, classification?: string, false_positive?: boolean) {
    const item = anomalies.find(a => a.id === id);
    if (!item) throw Object.assign(new Error('Anomaly not found'), { code: 'ANOMALY_NOT_FOUND', status: 404 });
    if (item.reviewed_at) throw Object.assign(new Error('Already reviewed'), { code: 'ANOMALY_ALREADY_REVIEWED', status: 409 });
    if (!classification) throw Object.assign(new Error('Missing classification'), { code: 'MISSING_CLASSIFICATION', status: 400 });
    if (typeof false_positive !== 'boolean') throw Object.assign(new Error('Missing false_positive'), { code: 'MISSING_FALSE_POSITIVE_FLAG', status: 400 });
    const valid = ['legitimate', 'suspicious', 'malicious'];
    if (!valid.includes(classification)) throw Object.assign(new Error('Invalid classification'), { code: 'INVALID_CLASSIFICATION', status: 400 });
    item.reviewed_at = new Date().toISOString();
    return { success: true };
  }
}

export const anomalyService = new AnomalyDetectionService();

