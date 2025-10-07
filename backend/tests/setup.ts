import { beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../.env') });

export interface TestServer {
  request: (path: string, options?: RequestInit) => Promise<Response>;
  close: () => Promise<void>;
  url: string;
}

export async function createTestServer(): Promise<TestServer> {
  // Create a simple HTTP server for testing
  const server = createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Accept-Language');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Mock API responses based on path and method
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method;
    
    // Set default headers
    res.setHeader('Content-Type', 'application/json');
    
    // Mock responses for different endpoints
    if (path === '/api/intelligence-reports' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        data: [],
        pagination: {
          page: 1,
          page_size: 25,
          total_pages: 0,
          total_items: 0
        }
      }));
    } else if (path === '/api/intelligence-reports' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const response = {
            id: 'test-report-id-' + Date.now(),
            title: data.title,
            title_ar: data.title_ar,
            content: data.content,
            content_ar: data.content_ar,
            data_sources: data.data_sources,
            confidence_score: data.confidence_score,
            threat_indicators: data.threat_indicators || [],
            geospatial_tags: data.geospatial_tags || [],
            review_status: 'draft',
            embedding_status: 'pending',
            created_at: new Date().toISOString(),
            retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            archived_at: null
          };
          res.writeHead(201);
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON', details: {} }));
        }
      });
    } else if (path.startsWith('/api/intelligence-reports/') && method === 'GET') {
      const id = path.split('/')[3];
      res.writeHead(200);
      res.end(JSON.stringify({
        id: id,
        title: 'Test Report',
        title_ar: 'تقرير اختبار',
        content: 'Test content',
        content_ar: 'محتوى اختبار',
        data_sources: ['test-source'],
        confidence_score: 85,
        threat_indicators: [],
        geospatial_tags: [],
        review_status: 'draft',
        embedding_status: 'pending',
        created_at: new Date().toISOString(),
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        archived_at: null
      }));
    } else if (path.endsWith('/embedding') && method === 'POST') {
      res.writeHead(202);
      res.end(JSON.stringify({
        status: 'processing',
        message: 'Embedding generation started'
      }));
    } else if (path === '/api/intelligence-reports/search' && method === 'POST') {
      res.writeHead(200);
      res.end(JSON.stringify({
        results: [],
        partial_results: false,
        failed_filters: []
      }));
    } else if (path === '/api/rate-limits/policies' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        data: []
      }));
    } else if (path === '/api/rate-limits/policies' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const response = {
            id: 'test-policy-id-' + Date.now(),
            name: data.name,
            description: data.description,
            requests_per_minute: data.requests_per_minute,
            burst_capacity: data.burst_capacity,
            applies_to: data.applies_to,
            role_id: data.role_id,
            endpoint_type: data.endpoint_type,
            retry_after_seconds: data.retry_after_seconds || 60,
            enabled: data.enabled !== false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          res.writeHead(201);
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON', details: {} }));
        }
      });
    } else if (path.startsWith('/api/rate-limits/policies/') && method === 'PUT') {
      res.writeHead(200);
      res.end(JSON.stringify({
        id: 'test-policy-id',
        name: 'Updated Policy',
        description: 'Updated description',
        requests_per_minute: 200,
        burst_capacity: 25,
        applies_to: 'authenticated',
        endpoint_type: 'api',
        retry_after_seconds: 90,
        enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } else if (path === '/api/rate-limits/status' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        user_id: 'test-user-id',
        ip_address: '127.0.0.1',
        limits: [
          {
            endpoint_type: 'api',
            requests_used: 0,
            requests_limit: 300,
            reset_at: new Date(Date.now() + 60 * 1000).toISOString(),
            burst_remaining: 50
          }
        ]
      }));
    } else if (path === '/api/reports/templates' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        data: []
      }));
    } else if (path === '/api/reports/templates' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const response = {
            id: 'test-template-id-' + Date.now(),
            name: data.name,
            name_ar: data.name_ar,
            report_type: data.report_type,
            include_metrics: data.include_metrics || false,
            include_trends: data.include_trends || false,
            include_charts: data.include_charts || false,
            include_audit_trail: data.include_audit_trail || false,
            supported_formats: data.supported_formats,
            schedule_enabled: data.schedule_enabled || false,
            schedule_frequency: data.schedule_frequency,
            organization_branding: data.organization_branding,
            created_by: 'test-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          res.writeHead(201);
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON', details: {} }));
        }
      });
    } else if (path === '/api/reports/generate' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.format === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.writeHead(200);
            res.end(Buffer.from('PDF content'));
          } else if (data.format === 'excel') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.writeHead(200);
            res.end(Buffer.from('Excel content'));
          } else if (data.format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.writeHead(200);
            res.end('CSV content');
          } else if (data.format === 'json') {
            res.writeHead(200);
            res.end(JSON.stringify({ data: 'JSON report content' }));
          } else {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid format' }));
          }
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON', details: {} }));
        }
      });
    } else if (path === '/api/reports/schedule' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const response = {
            schedule_id: 'test-schedule-id-' + Date.now(),
            next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };
          res.writeHead(201);
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON', details: {} }));
        }
      });
    } else if (path === '/api/admin/archive-reports' && method === 'POST') {
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Archive job completed' }));
    } else if (path === '/api/admin/retention-policy' && method === 'PUT') {
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Retention policy updated' }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address() as AddressInfo;
      const url = `http://localhost:${address.port}`;
      
      resolve({
        request: async (path: string, options: RequestInit = {}) => {
          const fullUrl = `${url}${path}`;
          return fetch(fullUrl, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });
        },
        close: () => new Promise((resolve) => server.close(resolve)),
        url
      });
    });
  });
}