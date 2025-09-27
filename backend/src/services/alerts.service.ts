export interface AlertConfig {
  id: string;
  name: string;
  name_ar: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  is_active: boolean;
  acknowledged?: boolean;
  created_at: string;
  updated_at: string;
}

function rid() { return Math.random().toString(36).slice(2, 10); }

const store = new Map<string, AlertConfig>();

export class AlertsService {
  list(filter?: { severity?: string; is_active?: boolean }) {
    let items = Array.from(store.values());
    if (filter?.severity) items = items.filter(a => a.severity === filter.severity);
    if (typeof filter?.is_active === 'boolean') items = items.filter(a => a.is_active === filter.is_active);
    return items;
  }
  get(id: string) { return store.get(id); }
  create(input: Omit<AlertConfig, 'id' | 'created_at' | 'updated_at' | 'acknowledged'>): AlertConfig {
    const now = new Date().toISOString();
    const item: AlertConfig = { id: rid(), acknowledged: false, created_at: now, updated_at: now, ...input };
    store.set(item.id, item);
    return item;
  }
  update(id: string, patch: Partial<AlertConfig>): AlertConfig {
    const current = store.get(id);
    if (!current) throw Object.assign(new Error('Alert not found'), { code: 'ALERT_NOT_FOUND', status: 404 });
    const updated = { ...current, ...patch, id: current.id, updated_at: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  }
  delete(id: string) {
    if (!store.has(id)) throw Object.assign(new Error('Alert not found'), { code: 'ALERT_NOT_FOUND', status: 404 });
    store.delete(id);
  }
  acknowledge(id: string) {
    const current = store.get(id);
    if (!current) throw Object.assign(new Error('Alert not found'), { code: 'ALERT_NOT_FOUND', status: 404 });
    if (current.acknowledged) throw Object.assign(new Error('Already acknowledged'), { code: 'ALERT_ALREADY_ACKNOWLEDGED', status: 409 });
    current.acknowledged = true;
    current.updated_at = new Date().toISOString();
    store.set(id, current);
    return current;
  }
}

export const alertsService = new AlertsService();

