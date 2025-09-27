import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Integration Test: Bilingual RTL/LTR Support', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should create bilingual intelligence reports', async () => {
    const reportData = {
      title: 'Security Intelligence Report',
      title_ar: 'تقرير استخبارات الأمن',
      content: 'This is a comprehensive security analysis report covering various threat indicators and risk assessments.',
      content_ar: 'هذا تقرير تحليل أمني شامل يغطي مؤشرات التهديد المختلفة وتقييمات المخاطر.',
      data_sources: ['security-source-1', 'intelligence-source-2'],
      confidence_score: 90
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.title).toBe(reportData.title);
    expect(data.title_ar).toBe(reportData.title_ar);
    expect(data.content).toBe(reportData.content);
    expect(data.content_ar).toBe(reportData.content_ar);
    expect(data.data_sources).toEqual(reportData.data_sources);
    expect(data.confidence_score).toBe(reportData.confidence_score);
  });

  it('should search reports in Arabic language', async () => {
    // First create a bilingual report
    const reportData = {
      title: 'Threat Assessment Report',
      title_ar: 'تقرير تقييم التهديد',
      content: 'Threat assessment and risk analysis',
      content_ar: 'تقييم التهديد وتحليل المخاطر',
      data_sources: ['threat-source'],
      confidence_score: 85
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer arabic-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);

    // Search in Arabic
    const searchData = {
      query: 'تقييم التهديد',
      similarity_threshold: 0.8
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer arabic-search-token',
        'Content-Type': 'application/json',
        'Accept-Language': 'ar'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should search reports in English language', async () => {
    // First create a bilingual report
    const reportData = {
      title: 'Intelligence Briefing',
      title_ar: 'إحاطة استخباراتية',
      content: 'Intelligence briefing on current security situation',
      content_ar: 'إحاطة استخباراتية حول الوضع الأمني الحالي',
      data_sources: ['intelligence-source'],
      confidence_score: 88
    };

    const createResponse = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer english-search-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(createResponse.status).toBe(201);

    // Search in English
    const searchData = {
      query: 'intelligence briefing',
      similarity_threshold: 0.8
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer english-search-token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle bilingual threat indicators', async () => {
    const reportData = {
      title: 'Malware Analysis Report',
      title_ar: 'تقرير تحليل البرمجيات الخبيثة',
      content: 'Analysis of malware samples and threat indicators',
      content_ar: 'تحليل عينات البرمجيات الخبيثة ومؤشرات التهديد',
      data_sources: ['malware-source'],
      confidence_score: 92,
      threat_indicators: [
        {
          indicator_type: 'malware',
          severity: 'high',
          description: 'High severity malware detected in system',
          description_ar: 'تم اكتشاف برمجيات خبيثة عالية الخطورة في النظام',
          confidence: 90,
          source_reference: 'MAL-001'
        },
        {
          indicator_type: 'phishing',
          severity: 'medium',
          description: 'Phishing attempt targeting users',
          description_ar: 'محاولة تصيد احتيالي تستهدف المستخدمين',
          confidence: 75,
          source_reference: 'PHISH-002'
        }
      ]
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-threat-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.threat_indicators).toHaveLength(2);
    expect(data.threat_indicators[0].description).toBe('High severity malware detected in system');
    expect(data.threat_indicators[0].description_ar).toBe('تم اكتشاف برمجيات خبيثة عالية الخطورة في النظام');
    expect(data.threat_indicators[1].description).toBe('Phishing attempt targeting users');
    expect(data.threat_indicators[1].description_ar).toBe('محاولة تصيد احتيالي تستهدف المستخدمين');
  });

  it('should handle bilingual geospatial tags', async () => {
    const reportData = {
      title: 'Regional Security Report',
      title_ar: 'تقرير الأمن الإقليمي',
      content: 'Security analysis of regional threats and activities',
      content_ar: 'تحليل أمني للتهديدات والأنشطة الإقليمية',
      data_sources: ['regional-source'],
      confidence_score: 87,
      geospatial_tags: [
        {
          latitude: 24.7136,
          longitude: 46.6753,
          location_name: 'Riyadh',
          location_name_ar: 'الرياض',
          location_type: 'city',
          radius_km: 50
        },
        {
          latitude: 21.4858,
          longitude: 39.1925,
          location_name: 'Jeddah',
          location_name_ar: 'جدة',
          location_type: 'city',
          radius_km: 30
        }
      ]
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-geo-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.geospatial_tags).toHaveLength(2);
    expect(data.geospatial_tags[0].location_name).toBe('Riyadh');
    expect(data.geospatial_tags[0].location_name_ar).toBe('الرياض');
    expect(data.geospatial_tags[1].location_name).toBe('Jeddah');
    expect(data.geospatial_tags[1].location_name_ar).toBe('جدة');
  });

  it('should generate bilingual reports', async () => {
    // Create a bilingual report template
    const templateData = {
      name: 'Bilingual Executive Report',
      name_ar: 'التقرير التنفيذي ثنائي اللغة',
      report_type: 'executive',
      supported_formats: ['pdf', 'json'],
      template_content: '<h1>{{title}}</h1><p>{{content}}</p>',
      template_content_ar: '<h1>{{title_ar}}</h1><p>{{content_ar}}</p>',
      include_metrics: true,
      include_trends: true
    };

    const createResponse = await server.request('/api/reports/templates', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-template-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData),
    });

    expect(createResponse.status).toBe(201);
    const createdTemplate = await createResponse.json();
    const templateId = createdTemplate.id;

    // Generate report in Arabic
    const generateData = {
      template_id: templateId,
      format: 'json',
      language: 'ar'
    };

    const response = await server.request('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-template-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(typeof data).toBe('object');
  });

  it('should handle RTL text direction in responses', async () => {
    const reportData = {
      title: 'RTL Test Report',
      title_ar: 'تقرير اختبار النص من اليمين إلى اليسار',
      content: 'This is a test report for RTL text direction',
      content_ar: 'هذا تقرير اختبار لاتجاه النص من اليمين إلى اليسار',
      data_sources: ['rtl-test-source'],
      confidence_score: 80
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer rtl-test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.title_ar).toBe(reportData.title_ar);
    expect(data.content_ar).toBe(reportData.content_ar);
    
    // Verify Arabic text is properly encoded
    expect(data.title_ar).toContain('تقرير');
    expect(data.content_ar).toContain('اتجاه');
  });

  it('should handle mixed language content', async () => {
    const reportData = {
      title: 'Mixed Language Report',
      title_ar: 'تقرير مختلط اللغات',
      content: 'This report contains both English and Arabic content: تقرير مختلط',
      content_ar: 'هذا التقرير يحتوي على محتوى إنجليزي وعربي: Mixed content',
      data_sources: ['mixed-language-source'],
      confidence_score: 85
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mixed-language-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.content).toContain('English and Arabic');
    expect(data.content).toContain('تقرير مختلط');
    expect(data.content_ar).toContain('محتوى إنجليزي وعربي');
    expect(data.content_ar).toContain('Mixed content');
  });

  it('should handle Arabic numerals and dates', async () => {
    const reportData = {
      title: 'Arabic Numerals Report',
      title_ar: 'تقرير الأرقام العربية',
      content: 'Report with Arabic numerals: ١٢٣٤٥٦٧٨٩٠',
      content_ar: 'تقرير بالأرقام العربية: ١٢٣٤٥٦٧٨٩٠',
      data_sources: ['arabic-numerals-source'],
      confidence_score: 82
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer arabic-numerals-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.content).toContain('١٢٣٤٥٦٧٨٩٠');
    expect(data.content_ar).toContain('١٢٣٤٥٦٧٨٩٠');
  });

  it('should handle Arabic punctuation and symbols', async () => {
    const reportData = {
      title: 'Arabic Punctuation Report',
      title_ar: 'تقرير علامات الترقيم العربية',
      content: 'Report with Arabic punctuation: ؟،؛',
      content_ar: 'تقرير بعلامات الترقيم العربية: ؟،؛',
      data_sources: ['arabic-punctuation-source'],
      confidence_score: 83
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer arabic-punctuation-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.content).toContain('؟،؛');
    expect(data.content_ar).toContain('؟،؛');
  });

  it('should handle Arabic diacritics and special characters', async () => {
    const reportData = {
      title: 'Arabic Diacritics Report',
      title_ar: 'تقرير التشكيل العربي',
      content: 'Report with Arabic diacritics: مُشَكَّل',
      content_ar: 'تقرير بالتشكيل العربي: مُشَكَّل',
      data_sources: ['arabic-diacritics-source'],
      confidence_score: 84
    };

    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer arabic-diacritics-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.content).toContain('مُشَكَّل');
    expect(data.content_ar).toContain('مُشَكَّل');
  });

  it('should handle bilingual search with filters', async () => {
    // Create bilingual reports for search testing
    const reports = [
      {
        title: 'High Priority Report',
        title_ar: 'تقرير أولوية عالية',
        content: 'High priority security report',
        content_ar: 'تقرير أمني أولوية عالية',
        data_sources: ['high-priority-source'],
        confidence_score: 95
      },
      {
        title: 'Medium Priority Report',
        title_ar: 'تقرير أولوية متوسطة',
        content: 'Medium priority security report',
        content_ar: 'تقرير أمني أولوية متوسطة',
        data_sources: ['medium-priority-source'],
        confidence_score: 80
      }
    ];

    for (const reportData of reports) {
      const response = await server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bilingual-filter-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
    }

    // Search with Arabic query and filters
    const searchData = {
      query: 'أولوية عالية',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        priority: ['high']
      },
      similarity_threshold: 0.8
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-filter-token',
        'Content-Type': 'application/json',
        'Accept-Language': 'ar'
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle bilingual rate limiting messages', async () => {
    // This test will fail initially as rate limiting is not implemented
    const response = await server.request('/api/intelligence-reports', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer bilingual-rate-limit-token',
        'Accept-Language': 'ar'
      }
    });

    // Initially this will be 200, but should be 429 when rate limiting is implemented
    expect(response.status).toBe(429);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('retry_after');
    
    // Error message should be in Arabic when Accept-Language is ar
    expect(data.error).toContain('Rate limit exceeded');
  });

  it('should handle bilingual error messages', async () => {
    // Test validation error in Arabic
    const response = await server.request('/api/intelligence-reports', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer bilingual-error-token',
        'Content-Type': 'application/json',
        'Accept-Language': 'ar'
      },
      body: JSON.stringify({}), // Invalid data
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('details');
    
    // Error message should be in Arabic when Accept-Language is ar
    expect(data.error).toBeTruthy();
  });

  it('should handle bilingual pagination', async () => {
    const response = await server.request('/api/intelligence-reports?page=1&page_size=10', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer bilingual-pagination-token',
        'Accept-Language': 'ar'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);
    
    // Pagination should work regardless of language
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('page_size');
    expect(data.pagination).toHaveProperty('total_pages');
    expect(data.pagination).toHaveProperty('total_items');
  });
});
