import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Integration Test: Browser Compatibility', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should handle Chrome 90+ requests', async () => {
    const response = await server.request('/api/intelligence-reports', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer chrome-test-token',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle Firefox 88+ requests', async () => {
    const response = await server.request('/api/intelligence-reports', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer firefox-test-token',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle Safari 14+ requests', async () => {
    const response = await server.request('/api/intelligence-reports', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer safari-test-token',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle Edge 90+ requests', async () => {
    const response = await server.request('/api/intelligence-reports', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer edge-test-token',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 Edg/90.0.818.66'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle CORS headers for all supported browsers', async () => {
    const response = await server.request('/api/intelligence-reports', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });

    expect(response.status).toBe(200);
    
    // Check CORS headers
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
  });

  it('should handle different Accept headers from browsers', async () => {
    const acceptHeaders = [
      'application/json, text/plain, */*',
      'application/json, text/javascript, */*; q=0.01',
      'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
      'application/json, application/xml, text/xml, */*'
    ];

    for (const acceptHeader of acceptHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer accept-test-token',
          'Accept': acceptHeader
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    }
  });

  it('should handle different Content-Type headers from browsers', async () => {
    const reportData = {
      title: 'Browser Compatibility Test',
      content: 'Testing different content types',
      data_sources: ['browser-test-source'],
      confidence_score: 85
    };

    const contentTypes = [
      'application/json',
      'application/json; charset=utf-8',
      'application/json;charset=UTF-8'
    ];

    for (const contentType of contentTypes) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer content-type-test-token',
          'Content-Type': contentType
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }
  });

  it('should handle different Accept-Language headers', async () => {
    const languageHeaders = [
      'en-US,en;q=0.9',
      'ar-SA,ar;q=0.9,en;q=0.8',
      'en-GB,en;q=0.9,en-US;q=0.8',
      'ar,en;q=0.9'
    ];

    for (const languageHeader of languageHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer language-test-token',
          'Accept-Language': languageHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different Accept-Encoding headers', async () => {
    const encodingHeaders = [
      'gzip, deflate, br',
      'gzip, deflate',
      'gzip, deflate, br, identity',
      'deflate, gzip'
    ];

    for (const encodingHeader of encodingHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer encoding-test-token',
          'Accept-Encoding': encodingHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different Referer headers', async () => {
    const refererHeaders = [
      'https://example.com/dashboard',
      'https://example.com/reports',
      'https://example.com/search',
      'https://example.com/admin'
    ];

    for (const refererHeader of refererHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer referer-test-token',
          'Referer': refererHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different X-Forwarded-For headers', async () => {
    const forwardedForHeaders = [
      '192.168.1.100',
      '10.0.0.1, 192.168.1.100',
      '203.0.113.195, 70.41.3.18, 150.172.238.178',
      '203.0.113.195'
    ];

    for (const forwardedForHeader of forwardedForHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer forwarded-test-token',
          'X-Forwarded-For': forwardedForHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different X-Real-IP headers', async () => {
    const realIpHeaders = [
      '192.168.1.100',
      '10.0.0.1',
      '203.0.113.195',
      '2001:db8::1'
    ];

    for (const realIpHeader of realIpHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer real-ip-test-token',
          'X-Real-IP': realIpHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different X-Forwarded-Proto headers', async () => {
    const protoHeaders = ['http', 'https'];

    for (const protoHeader of protoHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer proto-test-token',
          'X-Forwarded-Proto': protoHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different X-Forwarded-Host headers', async () => {
    const hostHeaders = [
      'api.example.com',
      'api.example.com:443',
      'api.example.com:80',
      'localhost:3000'
    ];

    for (const hostHeader of hostHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer host-test-token',
          'X-Forwarded-Host': hostHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different X-Requested-With headers', async () => {
    const requestedWithHeaders = [
      'XMLHttpRequest',
      'fetch',
      'axios'
    ];

    for (const requestedWithHeader of requestedWithHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer requested-with-test-token',
          'X-Requested-With': requestedWithHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different Cache-Control headers', async () => {
    const cacheControlHeaders = [
      'no-cache',
      'no-store',
      'max-age=0',
      'max-age=3600'
    ];

    for (const cacheControlHeader of cacheControlHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer cache-test-token',
          'Cache-Control': cacheControlHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different If-None-Match headers', async () => {
    const ifNoneMatchHeaders = [
      '"abc123"',
      '"def456"',
      'W/"ghi789"',
      '*'
    ];

    for (const ifNoneMatchHeader of ifNoneMatchHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer etag-test-token',
          'If-None-Match': ifNoneMatchHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different If-Modified-Since headers', async () => {
    const ifModifiedSinceHeaders = [
      'Wed, 21 Oct 2015 07:28:00 GMT',
      'Thu, 22 Oct 2015 08:29:00 GMT',
      'Fri, 23 Oct 2015 09:30:00 GMT'
    ];

    for (const ifModifiedSinceHeader of ifModifiedSinceHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer modified-since-test-token',
          'If-Modified-Since': ifModifiedSinceHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different Range headers', async () => {
    const rangeHeaders = [
      'bytes=0-1023',
      'bytes=1024-2047',
      'bytes=0-',
      'bytes=-1024'
    ];

    for (const rangeHeader of rangeHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer range-test-token',
          'Range': rangeHeader
        }
      });

      // Should either support range requests or return 200
      expect([200, 206, 416]).toContain(response.status);
    }
  });

  it('should handle different Connection headers', async () => {
    const connectionHeaders = [
      'keep-alive',
      'close',
      'upgrade'
    ];

    for (const connectionHeader of connectionHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer connection-test-token',
          'Connection': connectionHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different Upgrade headers', async () => {
    const upgradeHeaders = [
      'websocket',
      'h2c',
      'h2'
    ];

    for (const upgradeHeader of upgradeHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer upgrade-test-token',
          'Upgrade': upgradeHeader
        }
      });

      // Should either support upgrade or return 200
      expect([200, 101, 426]).toContain(response.status);
    }
  });

  it('should handle different Sec-Fetch-* headers', async () => {
    const secFetchHeaders = [
      'cors',
      'navigate',
      'same-origin',
      'no-cors'
    ];

    for (const secFetchHeader of secFetchHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer sec-fetch-test-token',
          'Sec-Fetch-Mode': secFetchHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different DNT headers', async () => {
    const dntHeaders = ['1', '0'];

    for (const dntHeader of dntHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer dnt-test-token',
          'DNT': dntHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different TE headers', async () => {
    const teHeaders = [
      'trailers',
      'gzip, deflate, trailers',
      'gzip, deflate'
    ];

    for (const teHeader of teHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer te-test-token',
          'TE': teHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different Expect headers', async () => {
    const expectHeaders = [
      '100-continue',
      '100-continue, 100-continue'
    ];

    for (const expectHeader of expectHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer expect-test-token',
          'Expect': expectHeader
        }
      });

      // Should either support expect or return 200
      expect([200, 100, 417]).toContain(response.status);
    }
  });

  it('should handle different Authorization header formats', async () => {
    const authHeaders = [
      'Bearer test-token',
      'Bearer test-token ',
      'Bearer  test-token',
      'Bearer test-token\n'
    ];

    for (const authHeader of authHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });

  it('should handle different Content-Length headers', async () => {
    const reportData = {
      title: 'Content Length Test',
      content: 'Testing different content lengths',
      data_sources: ['content-length-source'],
      confidence_score: 85
    };

    const contentLengthHeaders = [
      '0',
      '100',
      '1000',
      '10000'
    ];

    for (const contentLengthHeader of contentLengthHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer content-length-test-token',
          'Content-Type': 'application/json',
          'Content-Length': contentLengthHeader
        },
        body: JSON.stringify(reportData),
      });

      // Should either succeed or return appropriate error
      expect([200, 201, 400, 411]).toContain(response.status);
    }
  });

  it('should handle different Transfer-Encoding headers', async () => {
    const transferEncodingHeaders = [
      'chunked',
      'gzip, chunked',
      'deflate, chunked'
    ];

    for (const transferEncodingHeader of transferEncodingHeaders) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer transfer-encoding-test-token',
          'Transfer-Encoding': transferEncodingHeader
        }
      });

      expect(response.status).toBe(200);
    }
  });
});
