type Token = string;

export type ExportFormat = 'csv' | 'json' | 'excel';

export interface ExportRequest {
  id: string;
  owner: Token;
  resource_type: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  expires_at: string;
  file_size_bytes?: number;
  download_url?: string;
  error_message?: string;
}

const allowedResources = new Set(['users', 'organizations', 'events', 'mous']);

function rid() { return Math.random().toString(36).slice(2, 10); }

const exportsStore = new Map<string, ExportRequest>();

export class ExportService {
  create(owner: Token, resource_type: string, format: ExportFormat): ExportRequest {
    if (!resource_type) throw Object.assign(new Error('Missing resource_type'), { code: 'MISSING_RESOURCE_TYPE', status: 400 });
    if (!format) throw Object.assign(new Error('Missing format'), { code: 'MISSING_FORMAT', status: 400 });
    if (!['csv', 'json', 'excel'].includes(format)) throw Object.assign(new Error('Invalid format'), { code: 'INVALID_FORMAT', status: 400 });
    if (!allowedResources.has(resource_type)) throw Object.assign(new Error('Invalid resource_type'), { code: 'INVALID_RESOURCE_TYPE', status: 400 });

    const id = rid();
    const created_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const req: ExportRequest = { id, owner, resource_type, format, status: 'pending', progress: 0, created_at, expires_at };
    exportsStore.set(id, req);

    // Simulate async processing
    setTimeout(() => {
      const r = exportsStore.get(id);
      if (!r) return;
      r.status = 'processing';
      r.progress = 50;
      exportsStore.set(id, r);
      setTimeout(() => {
        const r2 = exportsStore.get(id);
        if (!r2) return;
        r2.status = 'completed';
        r2.progress = 100;
        r2.file_size_bytes = 1024;
        r2.download_url = `http://localhost:3001/export/${id}/download`;
        exportsStore.set(id, r2);
      }, 1000);
    }, 500);

    return req;
  }

  get(id: string) {
    return exportsStore.get(id);
  }

  list(owner: Token) {
    return Array.from(exportsStore.values()).filter(e => e.owner === owner);
  }
}

export const exportService = new ExportService();

