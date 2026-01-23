/**
 * Briefing Books Edge Function
 * Feature: briefing-book-generator
 *
 * Handles CRUD operations for briefing books and generates PDF/DOCX documents.
 *
 * Endpoints:
 * - GET /briefing-books - List user's briefing books
 * - GET /briefing-books/:id - Get a specific briefing book
 * - POST /briefing-books - Create and generate a new briefing book
 * - DELETE /briefing-books/:id - Delete a briefing book
 * - GET /briefing-books/templates - List available templates
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface BriefingBookConfig {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  entities: Array<{
    id: string;
    type: 'country' | 'organization' | 'forum' | 'theme';
    name_en: string;
    name_ar: string;
    includedSections: string[];
  }>;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  topics?: string[];
  sections: Array<{
    type: string;
    title_en: string;
    title_ar: string;
    enabled: boolean;
    order: number;
    customContent?: { en: string; ar: string };
  }>;
  format: 'pdf' | 'docx' | 'html';
  primaryLanguage: 'en' | 'ar';
  includeBilingual: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeBookmarks: boolean;
  includeCoverPage: boolean;
  includeExecutiveSummary: boolean;
  maxSensitivityLevel?: 'low' | 'medium' | 'high';
  headerText?: string;
  footerText?: string;
}

interface EntityData {
  id: string;
  name_en: string;
  name_ar: string;
  type: string;
  summary_en?: string;
  summary_ar?: string;
  contacts?: Array<{
    name: string;
    role: string;
    email?: string;
    phone?: string;
  }>;
  engagements?: Array<{
    id: string;
    title: string;
    date: string;
    description?: string;
  }>;
  positions?: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
  }>;
  mous?: Array<{
    id: string;
    title: string;
    status: string;
    signing_date?: string;
  }>;
  commitments?: Array<{
    id: string;
    title: string;
    deadline?: string;
    status: string;
  }>;
}

// HTML template for PDF generation
function generateHTMLDocument(
  config: BriefingBookConfig,
  entitiesData: EntityData[],
  language: 'en' | 'ar'
): string {
  const isRTL = language === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  const labels = {
    en: {
      tableOfContents: 'Table of Contents',
      executiveSummary: 'Executive Summary',
      entityOverview: 'Entity Overview',
      keyContacts: 'Key Contacts',
      recentEngagements: 'Recent Engagements',
      positions: 'Positions & Talking Points',
      mouAgreements: 'MoU Agreements',
      commitments: 'Commitments & Deliverables',
      timeline: 'Timeline',
      documents: 'Related Documents',
      relationshipMap: 'Relationship Map',
      intelligence: 'Intelligence & Signals',
      generatedOn: 'Generated on',
      page: 'Page',
      name: 'Name',
      role: 'Role',
      email: 'Email',
      phone: 'Phone',
      date: 'Date',
      status: 'Status',
      deadline: 'Deadline',
      noData: 'No data available',
    },
    ar: {
      tableOfContents: 'جدول المحتويات',
      executiveSummary: 'الملخص التنفيذي',
      entityOverview: 'نظرة عامة على الجهة',
      keyContacts: 'جهات الاتصال الرئيسية',
      recentEngagements: 'التعاملات الأخيرة',
      positions: 'المواقف ونقاط النقاش',
      mouAgreements: 'مذكرات التفاهم',
      commitments: 'الالتزامات والمخرجات',
      timeline: 'الجدول الزمني',
      documents: 'المستندات ذات الصلة',
      relationshipMap: 'خريطة العلاقات',
      intelligence: 'المعلومات والإشارات',
      generatedOn: 'تم الإنشاء في',
      page: 'صفحة',
      name: 'الاسم',
      role: 'الدور',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      date: 'التاريخ',
      status: 'الحالة',
      deadline: 'الموعد النهائي',
      noData: 'لا توجد بيانات متاحة',
    },
  };

  const l = labels[language];
  const title = language === 'ar' ? config.title_ar : config.title_en;
  const enabledSections = config.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  // Generate table of contents
  let tocHTML = '';
  if (config.includeTableOfContents) {
    tocHTML = `
      <div class="toc" id="toc">
        <h2>${l.tableOfContents}</h2>
        <ul>
          ${enabledSections
            .map(
              (section, idx) => `
            <li><a href="#section-${idx}">${language === 'ar' ? section.title_ar : section.title_en}</a></li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;
  }

  // Generate cover page
  let coverPageHTML = '';
  if (config.includeCoverPage) {
    coverPageHTML = `
      <div class="cover-page">
        <div class="cover-content">
          <h1 class="cover-title">${title}</h1>
          ${config.description_en || config.description_ar ? `<p class="cover-description">${language === 'ar' ? config.description_ar : config.description_en}</p>` : ''}
          <div class="cover-entities">
            ${entitiesData.map((e) => `<span class="entity-badge">${language === 'ar' ? e.name_ar : e.name_en}</span>`).join('')}
          </div>
          <p class="cover-date">${l.generatedOn}: ${new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    `;
  }

  // Generate section content
  function generateSectionContent(sectionType: string, sectionIndex: number): string {
    const section = enabledSections.find((s) => s.type === sectionType);
    if (!section) return '';

    const sectionTitle = language === 'ar' ? section.title_ar : section.title_en;

    switch (sectionType) {
      case 'executive_summary':
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            ${entitiesData
              .map(
                (e) => `
              <div class="entity-summary">
                <h3>${language === 'ar' ? e.name_ar : e.name_en}</h3>
                <p>${language === 'ar' ? e.summary_ar || l.noData : e.summary_en || l.noData}</p>
              </div>
            `
              )
              .join('')}
          </section>
        `;

      case 'entity_overview':
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            ${entitiesData
              .map(
                (e) => `
              <div class="entity-overview">
                <h3>${language === 'ar' ? e.name_ar : e.name_en}</h3>
                <p class="entity-type">${e.type}</p>
                <p>${language === 'ar' ? e.summary_ar || l.noData : e.summary_en || l.noData}</p>
              </div>
            `
              )
              .join('')}
          </section>
        `;

      case 'key_contacts':
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            ${entitiesData
              .map(
                (e) => `
              <div class="contacts-section">
                <h3>${language === 'ar' ? e.name_ar : e.name_en}</h3>
                ${
                  e.contacts && e.contacts.length > 0
                    ? `
                  <table class="contacts-table">
                    <thead>
                      <tr>
                        <th>${l.name}</th>
                        <th>${l.role}</th>
                        <th>${l.email}</th>
                        <th>${l.phone}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${e.contacts
                        .map(
                          (c) => `
                        <tr>
                          <td>${c.name}</td>
                          <td>${c.role || '-'}</td>
                          <td>${c.email || '-'}</td>
                          <td>${c.phone || '-'}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `
                    : `<p class="no-data">${l.noData}</p>`
                }
              </div>
            `
              )
              .join('')}
          </section>
        `;

      case 'recent_engagements':
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            ${entitiesData
              .map(
                (e) => `
              <div class="engagements-section">
                <h3>${language === 'ar' ? e.name_ar : e.name_en}</h3>
                ${
                  e.engagements && e.engagements.length > 0
                    ? `
                  <div class="engagements-list">
                    ${e.engagements
                      .map(
                        (eng) => `
                      <div class="engagement-item">
                        <h4>${eng.title}</h4>
                        <p class="date">${l.date}: ${new Date(eng.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                        ${eng.description ? `<p>${eng.description}</p>` : ''}
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                `
                    : `<p class="no-data">${l.noData}</p>`
                }
              </div>
            `
              )
              .join('')}
          </section>
        `;

      case 'positions':
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            ${entitiesData
              .map(
                (e) => `
              <div class="positions-section">
                <h3>${language === 'ar' ? e.name_ar : e.name_en}</h3>
                ${
                  e.positions && e.positions.length > 0
                    ? `
                  <div class="positions-list">
                    ${e.positions
                      .map(
                        (pos) => `
                      <div class="position-item">
                        <h4>${pos.title}</h4>
                        <span class="position-type">${pos.type}</span>
                        <div class="position-content">${pos.content}</div>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                `
                    : `<p class="no-data">${l.noData}</p>`
                }
              </div>
            `
              )
              .join('')}
          </section>
        `;

      case 'mou_agreements':
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            ${entitiesData
              .map(
                (e) => `
              <div class="mous-section">
                <h3>${language === 'ar' ? e.name_ar : e.name_en}</h3>
                ${
                  e.mous && e.mous.length > 0
                    ? `
                  <table class="mous-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>${l.status}</th>
                        <th>${l.date}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${e.mous
                        .map(
                          (m) => `
                        <tr>
                          <td>${m.title}</td>
                          <td>${m.status}</td>
                          <td>${m.signing_date ? new Date(m.signing_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `
                    : `<p class="no-data">${l.noData}</p>`
                }
              </div>
            `
              )
              .join('')}
          </section>
        `;

      case 'commitments':
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            ${entitiesData
              .map(
                (e) => `
              <div class="commitments-section">
                <h3>${language === 'ar' ? e.name_ar : e.name_en}</h3>
                ${
                  e.commitments && e.commitments.length > 0
                    ? `
                  <table class="commitments-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>${l.deadline}</th>
                        <th>${l.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${e.commitments
                        .map(
                          (c) => `
                        <tr>
                          <td>${c.title}</td>
                          <td>${c.deadline ? new Date(c.deadline).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}</td>
                          <td>${c.status}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `
                    : `<p class="no-data">${l.noData}</p>`
                }
              </div>
            `
              )
              .join('')}
          </section>
        `;

      case 'custom':
        return section.customContent
          ? `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            <div class="custom-content">
              ${language === 'ar' ? section.customContent.ar : section.customContent.en}
            </div>
          </section>
        `
          : '';

      default:
        return `
          <section id="section-${sectionIndex}" class="section">
            <h2>${sectionTitle}</h2>
            <p class="no-data">${l.noData}</p>
          </section>
        `;
    }
  }

  // Generate all sections
  const sectionsHTML = enabledSections
    .map((section, idx) => generateSectionContent(section.type, idx))
    .join('');

  // Build the complete HTML document
  return `
    <!DOCTYPE html>
    <html dir="${direction}" lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
          @bottom-center {
            content: "${l.page} " counter(page);
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: ${isRTL ? 'Arial, Tahoma, sans-serif' : 'Georgia, Times, serif'};
          direction: ${direction};
          text-align: ${isRTL ? 'right' : 'left'};
          line-height: 1.6;
          color: #1f2937;
          font-size: 11pt;
          margin: 0;
          padding: 0;
        }

        /* Cover Page */
        .cover-page {
          page-break-after: always;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
        }

        .cover-content {
          padding: 40px;
        }

        .cover-title {
          font-size: 32pt;
          margin-bottom: 20px;
          font-weight: bold;
        }

        .cover-description {
          font-size: 14pt;
          margin-bottom: 30px;
          opacity: 0.9;
        }

        .cover-entities {
          margin: 30px 0;
        }

        .entity-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 8px 16px;
          margin: 4px;
          border-radius: 20px;
          font-size: 10pt;
        }

        .cover-date {
          margin-top: 40px;
          opacity: 0.8;
          font-size: 10pt;
        }

        /* Table of Contents */
        .toc {
          page-break-after: always;
          padding: 40px 0;
        }

        .toc h2 {
          color: #1e40af;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .toc ul {
          list-style: none;
          padding: 0;
        }

        .toc li {
          padding: 10px 0;
          border-bottom: 1px dotted #e5e7eb;
        }

        .toc a {
          color: #1f2937;
          text-decoration: none;
        }

        .toc a:hover {
          color: #1e40af;
        }

        /* Sections */
        .section {
          page-break-inside: avoid;
          margin-bottom: 30px;
          padding: 20px 0;
        }

        .section h2 {
          color: #1e40af;
          font-size: 18pt;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .section h3 {
          color: #374151;
          font-size: 14pt;
          margin-top: 20px;
          margin-bottom: 15px;
        }

        .section h4 {
          color: #4b5563;
          font-size: 12pt;
          margin-top: 15px;
          margin-bottom: 10px;
        }

        /* Entity Overview */
        .entity-overview,
        .entity-summary {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-${isRTL ? 'right' : 'left'}: 4px solid #3b82f6;
        }

        .entity-type {
          color: #6b7280;
          font-size: 10pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10pt;
        }

        th, td {
          padding: 12px;
          text-align: ${isRTL ? 'right' : 'left'};
          border-bottom: 1px solid #e5e7eb;
        }

        th {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }

        tr:hover {
          background: #f9fafb;
        }

        /* Items */
        .engagement-item,
        .position-item {
          background: #ffffff;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .position-type {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 9pt;
          margin-bottom: 10px;
        }

        .position-content {
          white-space: pre-wrap;
          line-height: 1.8;
        }

        .date {
          color: #6b7280;
          font-size: 10pt;
        }

        .no-data {
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }

        /* Header & Footer */
        ${
          config.headerText
            ? `
        @page {
          @top-center {
            content: "${config.headerText}";
            font-size: 9pt;
            color: #6b7280;
          }
        }
        `
            : ''
        }

        ${
          config.footerText
            ? `
        @page {
          @bottom-left {
            content: "${config.footerText}";
            font-size: 9pt;
            color: #6b7280;
          }
        }
        `
            : ''
        }

        /* Print optimizations */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .section {
            page-break-inside: avoid;
          }

          table {
            page-break-inside: avoid;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      ${coverPageHTML}
      ${tocHTML}
      ${sectionsHTML}
    </body>
    </html>
  `;
}

// Fetch entity data from database
async function fetchEntityData(
  supabase: ReturnType<typeof createClient>,
  entityId: string,
  entityType: string,
  dateRange?: { startDate: string; endDate: string },
  maxSensitivityLevel?: string
): Promise<EntityData | null> {
  // Fetch basic dossier info
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('id, name_en, name_ar, type, summary_en, summary_ar, sensitivity_level')
    .eq('id', entityId)
    .single();

  if (dossierError || !dossier) {
    console.error('Error fetching dossier:', dossierError);
    return null;
  }

  // Check sensitivity level
  const sensitivityOrder = { low: 1, medium: 2, high: 3 };
  if (
    maxSensitivityLevel &&
    sensitivityOrder[dossier.sensitivity_level as keyof typeof sensitivityOrder] >
      sensitivityOrder[maxSensitivityLevel as keyof typeof sensitivityOrder]
  ) {
    return null;
  }

  // Fetch contacts
  const { data: contacts } = await supabase
    .from('key_contacts')
    .select('name, role, email, phone')
    .eq('dossier_id', entityId)
    .limit(20);

  // Fetch engagements (with date filter if provided)
  let engagementsQuery = supabase
    .from('engagements')
    .select('id, title, date, description')
    .contains('dossier_ids', [entityId])
    .order('date', { ascending: false })
    .limit(10);

  if (dateRange) {
    engagementsQuery = engagementsQuery
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);
  }

  const { data: engagements } = await engagementsQuery;

  // Fetch positions
  let positionsQuery = supabase
    .from('positions')
    .select('id, title, content, type')
    .contains('dossier_ids', [entityId])
    .limit(20);

  if (dateRange) {
    positionsQuery = positionsQuery
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
  }

  const { data: positions } = await positionsQuery;

  // Fetch MOUs
  const { data: mous } = await supabase
    .from('mous')
    .select('id, title, status, signing_date')
    .eq('dossier_id', entityId)
    .limit(10);

  // Fetch commitments
  let commitmentsQuery = supabase
    .from('commitments')
    .select('id, title, deadline, status')
    .eq('dossier_id', entityId)
    .limit(20);

  if (dateRange) {
    commitmentsQuery = commitmentsQuery
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
  }

  const { data: commitments } = await commitmentsQuery;

  return {
    id: dossier.id,
    name_en: dossier.name_en,
    name_ar: dossier.name_ar,
    type: dossier.type,
    summary_en: dossier.summary_en,
    summary_ar: dossier.summary_ar,
    contacts: contacts || [],
    engagements: engagements || [],
    positions: positions || [],
    mous: mous || [],
    commitments: commitments || [],
  };
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // Initialize Supabase client with user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: GET /briefing-books/templates
    if (method === 'GET' && pathParts[1] === 'templates') {
      const { data: templates, error } = await supabase
        .from('briefing_book_templates')
        .select('id, name, description, sections, format_options, is_default, created_by, created_at, updated_at')
        .or(`is_default.eq.true,created_by.eq.${user.id}`)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: templates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: GET /briefing-books/:id
    if (method === 'GET' && pathParts[1]) {
      const bookId = pathParts[1];

      const { data: book, error } = await supabase
        .from('briefing_books')
        .select('id, title_en, title_ar, description_en, description_ar, entity_ids, date_range_start, date_range_end, topics, sections, format, primary_language, include_bilingual, include_table_of_contents, include_page_numbers, include_bookmarks, include_cover_page, include_executive_summary, max_sensitivity_level, header_text, footer_text, status, file_url, file_size_bytes, page_count, word_count, generated_at, expires_at, error_message, created_by, created_at, updated_at')
        .eq('id', bookId)
        .eq('created_by', user.id)
        .single();

      if (error || !book) {
        return new Response(JSON.stringify({ error: 'Briefing book not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: book }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: GET /briefing-books
    if (method === 'GET') {
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const cursor = url.searchParams.get('cursor');

      let query = supabase
        .from('briefing_books')
        .select('id, title_en, title_ar, description_en, description_ar, entity_ids, date_range_start, date_range_end, topics, sections, format, primary_language, include_bilingual, include_table_of_contents, include_page_numbers, include_bookmarks, include_cover_page, include_executive_summary, max_sensitivity_level, header_text, footer_text, status, file_url, file_size_bytes, page_count, word_count, generated_at, expires_at, error_message, created_by, created_at, updated_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data: books, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const hasMore = books && books.length > limit;
      const data = hasMore ? books.slice(0, limit) : books;

      return new Response(
        JSON.stringify({
          data,
          pagination: {
            hasMore,
            nextCursor: hasMore ? data[data.length - 1].created_at : null,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /briefing-books
    if (method === 'POST') {
      const body = await req.json();
      const config: BriefingBookConfig = body.config;

      if (!config || !config.entities || config.entities.length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid configuration: entities required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create briefing book record
      const { data: book, error: createError } = await supabase
        .from('briefing_books')
        .insert({
          title_en: config.title_en,
          title_ar: config.title_ar,
          description_en: config.description_en,
          description_ar: config.description_ar,
          entity_ids: config.entities.map((e) => e.id),
          date_range_start: config.dateRange?.startDate,
          date_range_end: config.dateRange?.endDate,
          topics: config.topics,
          sections: config.sections,
          format: config.format,
          primary_language: config.primaryLanguage,
          include_bilingual: config.includeBilingual,
          include_table_of_contents: config.includeTableOfContents,
          include_page_numbers: config.includePageNumbers,
          include_bookmarks: config.includeBookmarks,
          include_cover_page: config.includeCoverPage,
          include_executive_summary: config.includeExecutiveSummary,
          max_sensitivity_level: config.maxSensitivityLevel,
          header_text: config.headerText,
          footer_text: config.footerText,
          status: 'generating',
          created_by: user.id,
        })
        .select()
        .single();

      if (createError || !book) {
        return new Response(
          JSON.stringify({ error: createError?.message || 'Failed to create briefing book' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert entity junction records
      const entityRecords = config.entities.map((e, idx) => ({
        briefing_book_id: book.id,
        entity_id: e.id,
        entity_type: e.type,
        included_sections: e.includedSections,
        order: idx,
      }));

      await supabase.from('briefing_book_entities').insert(entityRecords);

      // Fetch data for all entities
      const entitiesData: EntityData[] = [];
      for (const entity of config.entities) {
        const entityData = await fetchEntityData(
          supabase,
          entity.id,
          entity.type,
          config.dateRange,
          config.maxSensitivityLevel
        );
        if (entityData) {
          entitiesData.push(entityData);
        }
      }

      if (entitiesData.length === 0) {
        await supabase
          .from('briefing_books')
          .update({ status: 'failed', error_message: 'No accessible entities found' })
          .eq('id', book.id);

        return new Response(JSON.stringify({ error: 'No accessible entities found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate HTML document
      const htmlContent = generateHTMLDocument(config, entitiesData, config.primaryLanguage);

      // Calculate estimated metrics
      const wordCount = htmlContent
        .replace(/<[^>]*>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
      const estimatedPages = Math.ceil(wordCount / 300); // ~300 words per page

      // Upload to storage
      const encoder = new TextEncoder();
      const fileContent = encoder.encode(htmlContent);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${user.id}/${book.id}-${timestamp}.html`;

      const { error: uploadError } = await supabase.storage
        .from('briefing-books')
        .upload(fileName, fileContent, {
          contentType: 'text/html',
          upsert: false,
        });

      if (uploadError) {
        await supabase
          .from('briefing_books')
          .update({ status: 'failed', error_message: uploadError.message })
          .eq('id', book.id);

        return new Response(JSON.stringify({ error: uploadError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get signed URL (24 hours)
      const { data: urlData } = await supabase.storage
        .from('briefing-books')
        .createSignedUrl(fileName, 86400);

      // Update book record with file info
      const { data: updatedBook, error: updateError } = await supabase
        .from('briefing_books')
        .update({
          status: 'ready',
          file_url: urlData?.signedUrl,
          file_size_bytes: fileContent.length,
          page_count: estimatedPages,
          word_count: wordCount,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400 * 1000).toISOString(),
        })
        .eq('id', book.id)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          briefingBook: updatedBook,
          estimatedTime: 0,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: DELETE /briefing-books/:id
    if (method === 'DELETE' && pathParts[1]) {
      const bookId = pathParts[1];

      // Get the book first to check ownership and get file path
      const { data: book, error: fetchError } = await supabase
        .from('briefing_books')
        .select('id, file_url, created_by')
        .eq('id', bookId)
        .eq('created_by', user.id)
        .single();

      if (fetchError || !book) {
        return new Response(JSON.stringify({ error: 'Briefing book not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete from storage if file exists
      if (book.file_url) {
        const filePath = book.file_url.split('/briefing-books/')[1]?.split('?')[0];
        if (filePath) {
          await supabase.storage.from('briefing-books').remove([filePath]);
        }
      }

      // Delete from database (cascade will handle junction table)
      const { error: deleteError } = await supabase
        .from('briefing_books')
        .delete()
        .eq('id', bookId)
        .eq('created_by', user.id);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route not found
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
