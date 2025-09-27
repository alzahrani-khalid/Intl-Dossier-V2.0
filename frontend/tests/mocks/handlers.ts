import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock API endpoints
  http.get('/api/v1/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@gastat.gov.sa',
        name_en: 'Admin User',
        name_ar: 'مستخدم الإدارة',
        role: 'super_admin',
        department: 'IT',
        is_active: true,
        mfa_enabled: false
      },
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresIn: 3600
    });
  }),

  http.get('/api/v1/countries', () => {
    return HttpResponse.json({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name_en: 'Saudi Arabia',
          name_ar: 'المملكة العربية السعودية',
          iso_alpha2: 'SA',
          iso_alpha3: 'SAU',
          region: 'Asia',
          status: 'active'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  }),

  http.get('/api/v1/organizations', () => {
    return HttpResponse.json({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Ministry of Foreign Affairs',
          type: 'government',
          country_id: '11111111-1111-1111-1111-111111111111',
          status: 'active'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  }),

  http.get('/api/v1/mous', () => {
    return HttpResponse.json({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Bilateral Trade Agreement',
          version: 1,
          status: 'draft',
          organization_id: '11111111-1111-1111-1111-111111111111',
          country_id: '11111111-1111-1111-1111-111111111111'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  }),

  http.get('/api/v1/events', () => {
    return HttpResponse.json({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Bilateral Meeting',
          start_time: '2025-02-15T10:00:00Z',
          end_time: '2025-02-15T12:00:00Z',
          location: 'Riyadh, Saudi Arabia',
          event_type: 'meeting',
          status: 'scheduled'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  }),

  http.get('/api/v1/intelligence', () => {
    return HttpResponse.json({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Economic Analysis Report',
          content: 'Analysis of economic trends...',
          confidence_level: 'high',
          classification: 'internal',
          analysis_type: 'trend'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  }),

  http.get('/api/v1/data-library', () => {
    return HttpResponse.json({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Trade Statistics 2024',
          description: 'Annual trade data',
          file_size: 1024000,
          mime_type: 'application/pdf',
          access_level: 'internal'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  })
];
