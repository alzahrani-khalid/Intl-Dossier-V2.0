/**
 * Dossier Export Pack Edge Function
 * Feature: dossier-export-pack
 *
 * Generates comprehensive briefing packets for dossiers in PDF or DOCX format.
 * Includes timeline, relationships, documents, commitments, positions, events, and contacts.
 * Supports bilingual output (EN/AR).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// =============================================================================
// Types
// =============================================================================

interface ExportSectionConfig {
  type: string;
  title_en: string;
  title_ar: string;
  enabled: boolean;
  order: number;
}

interface ExportConfig {
  format: 'pdf' | 'docx';
  language: 'en' | 'ar' | 'both';
  sections: ExportSectionConfig[];
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  dateRange?: { from: string; to: string };
  headerText?: string;
  footerText?: string;
}

interface ExportRequest {
  dossier_id: string;
  config: ExportConfig;
}

// =============================================================================
// HTML Generation
// =============================================================================

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateString: string | null, language: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function getStatusBadge(status: string, isRTL: boolean): string {
  const statusColors: Record<string, string> = {
    active: '#22c55e',
    completed: '#22c55e',
    pending: '#eab308',
    in_progress: '#3b82f6',
    overdue: '#ef4444',
    cancelled: '#6b7280',
  };
  const color = statusColors[status] || '#6b7280';
  return `<span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${status}</span>`;
}

function generateCoverPage(dossier: any, stats: any, config: ExportConfig, isRTL: boolean): string {
  const labels = {
    en: {
      briefingPack: 'Briefing Pack',
      generatedOn: 'Generated on',
      type: 'Type',
      status: 'Status',
      overview: 'Overview',
      relationships: 'Relationships',
      positions: 'Positions',
      mous: 'MoUs',
      commitments: 'Commitments',
      events: 'Events',
      contacts: 'Contacts',
    },
    ar: {
      briefingPack: 'حزمة الإحاطة',
      generatedOn: 'تم الإنشاء في',
      type: 'النوع',
      status: 'الحالة',
      overview: 'نظرة عامة',
      relationships: 'العلاقات',
      positions: 'المواقف',
      mous: 'مذكرات التفاهم',
      commitments: 'الالتزامات',
      events: 'الفعاليات',
      contacts: 'جهات الاتصال',
    },
  };

  const l = labels[isRTL ? 'ar' : 'en'];

  return `
    <div class="cover-page">
      <div class="cover-header">
        <h1>${l.briefingPack}</h1>
        <div class="cover-subtitle">GASTAT - International Dossier System</div>
      </div>

      <div class="cover-title">
        <h2>${escapeHtml(isRTL ? dossier.name_ar : dossier.name_en)}</h2>
        ${
          dossier.description_en || dossier.description_ar
            ? `<p class="cover-description">${escapeHtml(isRTL ? dossier.description_ar : dossier.description_en)}</p>`
            : ''
        }
      </div>

      <div class="cover-meta">
        <div class="meta-item">
          <strong>${l.type}:</strong>
          <span>${escapeHtml(dossier.type)}</span>
        </div>
        <div class="meta-item">
          <strong>${l.status}:</strong>
          ${getStatusBadge(dossier.status, isRTL)}
        </div>
      </div>

      <div class="cover-stats">
        <div class="stat-grid">
          <div class="stat-item">
            <div class="stat-value">${stats.relationships_count || 0}</div>
            <div class="stat-label">${l.relationships}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.positions_count || 0}</div>
            <div class="stat-label">${l.positions}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.mous_count || 0}</div>
            <div class="stat-label">${l.mous}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.commitments_count || 0}</div>
            <div class="stat-label">${l.commitments}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.events_count || 0}</div>
            <div class="stat-label">${l.events}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.contacts_count || 0}</div>
            <div class="stat-label">${l.contacts}</div>
          </div>
        </div>
      </div>

      <div class="cover-footer">
        <p>${l.generatedOn} ${formatDate(new Date().toISOString(), isRTL ? 'ar' : 'en')}</p>
      </div>
    </div>
    <div class="page-break"></div>
  `;
}

function generateTableOfContents(sections: ExportSectionConfig[], isRTL: boolean): string {
  const title = isRTL ? 'جدول المحتويات' : 'Table of Contents';

  const enabledSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  return `
    <div class="toc">
      <h2 class="toc-title">${title}</h2>
      <ul class="toc-list">
        ${enabledSections
          .map(
            (s, i) => `
          <li class="toc-item">
            <span class="toc-number">${i + 1}.</span>
            <span class="toc-text">${isRTL ? s.title_ar : s.title_en}</span>
          </li>
        `
          )
          .join('')}
      </ul>
    </div>
    <div class="page-break"></div>
  `;
}

function generateRelationshipsSection(relationships: any[], isRTL: boolean): string {
  const title = isRTL ? 'العلاقات' : 'Relationships';
  const noData = isRTL ? 'لا توجد علاقات' : 'No relationships found';

  if (!relationships || relationships.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isRTL ? 'الجهة' : 'Entity'}</th>
            <th>${isRTL ? 'النوع' : 'Type'}</th>
            <th>${isRTL ? 'نوع العلاقة' : 'Relationship Type'}</th>
            <th>${isRTL ? 'الملاحظات' : 'Notes'}</th>
          </tr>
        </thead>
        <tbody>
          ${relationships
            .map(
              (rel) => `
            <tr>
              <td>${escapeHtml(isRTL ? rel.name_ar : rel.name_en)}</td>
              <td>${escapeHtml(rel.type)}</td>
              <td>${escapeHtml(rel.relationship_type)}</td>
              <td>${escapeHtml(isRTL ? rel.notes_ar : rel.notes_en) || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generatePositionsSection(positions: any[], isRTL: boolean): string {
  const title = isRTL ? 'المواقف ونقاط النقاش' : 'Positions & Talking Points';
  const noData = isRTL ? 'لا توجد مواقف' : 'No positions found';

  if (!positions || positions.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      ${positions
        .map(
          (pos, i) => `
        <div class="content-card">
          <h3>${i + 1}. ${escapeHtml(isRTL ? pos.title_ar : pos.title_en)}</h3>
          <div class="card-meta">
            <span>${isRTL ? 'الحالة' : 'Status'}: ${getStatusBadge(pos.status, isRTL)}</span>
            ${pos.classification ? `<span>${isRTL ? 'التصنيف' : 'Classification'}: ${escapeHtml(pos.classification)}</span>` : ''}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function generateMousSection(mous: any[], isRTL: boolean): string {
  const title = isRTL ? 'مذكرات التفاهم' : 'MoU Agreements';
  const noData = isRTL ? 'لا توجد مذكرات تفاهم' : 'No MoU agreements found';

  if (!mous || mous.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isRTL ? 'العنوان' : 'Title'}</th>
            <th>${isRTL ? 'الحالة' : 'Status'}</th>
            <th>${isRTL ? 'تاريخ الإنشاء' : 'Created'}</th>
          </tr>
        </thead>
        <tbody>
          ${mous
            .map(
              (m) => `
            <tr>
              <td>${escapeHtml(isRTL ? m.title_ar : m.title_en)}</td>
              <td>${getStatusBadge(m.status, isRTL)}</td>
              <td>${formatDate(m.created_at, isRTL ? 'ar' : 'en')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateCommitmentsSection(commitments: any[], isRTL: boolean): string {
  const title = isRTL ? 'الالتزامات والمخرجات' : 'Commitments & Deliverables';
  const noData = isRTL ? 'لا توجد التزامات' : 'No commitments found';

  if (!commitments || commitments.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isRTL ? 'العنوان' : 'Title'}</th>
            <th>${isRTL ? 'الحالة' : 'Status'}</th>
            <th>${isRTL ? 'الأولوية' : 'Priority'}</th>
            <th>${isRTL ? 'الموعد النهائي' : 'Deadline'}</th>
            <th>${isRTL ? 'المسؤول' : 'Assignee'}</th>
          </tr>
        </thead>
        <tbody>
          ${commitments
            .map(
              (c) => `
            <tr>
              <td>${escapeHtml(isRTL ? c.title_ar : c.title_en)}</td>
              <td>${getStatusBadge(c.status, isRTL)}</td>
              <td>${escapeHtml(c.priority)}</td>
              <td>${formatDate(c.deadline, isRTL ? 'ar' : 'en')}</td>
              <td>${escapeHtml(c.assignee_name) || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateTimelineSection(activities: any[], isRTL: boolean): string {
  const title = isRTL ? 'الجدول الزمني للأنشطة' : 'Activity Timeline';
  const noData = isRTL ? 'لا توجد أنشطة' : 'No activities found';

  if (!activities || activities.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <div class="timeline">
        ${activities
          .slice(0, 20)
          .map(
            (a) => `
          <div class="timeline-item">
            <div class="timeline-date">${formatDate(a.timestamp, isRTL ? 'ar' : 'en')}</div>
            <div class="timeline-content">
              <strong>${escapeHtml(isRTL ? a.title_ar : a.title_en)}</strong>
              <span class="timeline-type">${escapeHtml(a.activity_type)}</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function generateEventsSection(events: any[], isRTL: boolean): string {
  const title = isRTL ? 'الفعاليات القادمة' : 'Upcoming Events';
  const noData = isRTL ? 'لا توجد فعاليات قادمة' : 'No upcoming events';

  if (!events || events.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isRTL ? 'الفعالية' : 'Event'}</th>
            <th>${isRTL ? 'النوع' : 'Type'}</th>
            <th>${isRTL ? 'التاريخ' : 'Date'}</th>
            <th>${isRTL ? 'الموقع' : 'Location'}</th>
          </tr>
        </thead>
        <tbody>
          ${events
            .map(
              (e) => `
            <tr>
              <td>${escapeHtml(isRTL ? e.title_ar : e.title_en)}</td>
              <td>${escapeHtml(e.event_type)}</td>
              <td>${formatDate(e.start_datetime, isRTL ? 'ar' : 'en')}</td>
              <td>${escapeHtml(isRTL ? e.location_ar : e.location_en) || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateContactsSection(contacts: any[], isRTL: boolean): string {
  const title = isRTL ? 'جهات الاتصال الرئيسية' : 'Key Contacts';
  const noData = isRTL ? 'لا توجد جهات اتصال' : 'No contacts found';

  if (!contacts || contacts.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <div class="contacts-grid">
        ${contacts
          .map(
            (c) => `
          <div class="contact-card">
            <h4>${escapeHtml(isRTL ? c.name_ar : c.name) || escapeHtml(c.name)}</h4>
            ${c.title_en || c.title_ar ? `<p class="contact-title">${escapeHtml(isRTL ? c.title_ar : c.title_en)}</p>` : ''}
            ${c.organization_en || c.organization_ar ? `<p class="contact-org">${escapeHtml(isRTL ? c.organization_ar : c.organization_en)}</p>` : ''}
            ${c.email ? `<p class="contact-email">${escapeHtml(c.email)}</p>` : ''}
            ${c.phone ? `<p class="contact-phone">${escapeHtml(c.phone)}</p>` : ''}
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function generateDocumentsSection(documents: any[], isRTL: boolean): string {
  const title = isRTL ? 'المستندات ذات الصلة' : 'Related Documents';
  const noData = isRTL ? 'لا توجد مستندات' : 'No documents found';

  if (!documents || documents.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">${title}</h2>
        <p class="no-data">${noData}</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>${isRTL ? 'الاسم' : 'Name'}</th>
            <th>${isRTL ? 'النوع' : 'Type'}</th>
            <th>${isRTL ? 'تاريخ الإنشاء' : 'Created'}</th>
          </tr>
        </thead>
        <tbody>
          ${documents
            .map(
              (d) => `
            <tr>
              <td>${escapeHtml(isRTL ? d.title_ar : d.title_en)}</td>
              <td>${escapeHtml(d.document_type)}</td>
              <td>${formatDate(d.created_at, isRTL ? 'ar' : 'en')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateHTMLDocument(dossier: any, data: any, config: ExportConfig): string {
  const isRTL = config.language === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';
  const fontFamily = isRTL ? "'Segoe UI', 'Arial', sans-serif" : "'Georgia', serif";

  const enabledSections = config.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  let content = '';

  // Cover page
  if (config.includeCoverPage) {
    content += generateCoverPage(dossier, data.stats, config, isRTL);
  }

  // Table of contents
  if (config.includeTableOfContents) {
    content += generateTableOfContents(config.sections, isRTL);
  }

  // Generate sections
  for (const section of enabledSections) {
    switch (section.type) {
      case 'overview':
        content += `
          <div class="section">
            <h2 class="section-title">${isRTL ? section.title_ar : section.title_en}</h2>
            <div class="overview-content">
              ${dossier.description_en || dossier.description_ar ? `<p>${escapeHtml(isRTL ? dossier.description_ar : dossier.description_en)}</p>` : ''}
            </div>
          </div>
        `;
        break;
      case 'relationships':
        content += generateRelationshipsSection(data.relationships, isRTL);
        break;
      case 'positions':
        content += generatePositionsSection(data.positions, isRTL);
        break;
      case 'mous':
        content += generateMousSection(data.mous, isRTL);
        break;
      case 'commitments':
        content += generateCommitmentsSection(data.commitments, isRTL);
        break;
      case 'timeline':
        content += generateTimelineSection(data.activities, isRTL);
        break;
      case 'events':
        content += generateEventsSection(data.events, isRTL);
        break;
      case 'contacts':
        content += generateContactsSection(data.contacts, isRTL);
        break;
      case 'documents':
        content += generateDocumentsSection(data.documents, isRTL);
        break;
    }
  }

  return `
<!DOCTYPE html>
<html dir="${direction}" lang="${config.language === 'both' ? 'en' : config.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Briefing Pack - ${escapeHtml(dossier.name_en)}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: ${fontFamily};
      direction: ${direction};
      text-align: ${isRTL ? 'right' : 'left'};
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      font-size: 12pt;
    }

    .page-break {
      page-break-after: always;
    }

    /* Cover Page Styles */
    .cover-page {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }

    .cover-header {
      padding: 40px 0;
      border-bottom: 4px solid #1e40af;
    }

    .cover-header h1 {
      color: #1e40af;
      font-size: 36pt;
      margin: 0 0 10px 0;
    }

    .cover-subtitle {
      color: #6b7280;
      font-size: 14pt;
    }

    .cover-title {
      padding: 40px 20px;
    }

    .cover-title h2 {
      font-size: 28pt;
      color: #111827;
      margin: 0 0 20px 0;
    }

    .cover-description {
      font-size: 14pt;
      color: #4b5563;
      max-width: 600px;
      margin: 0 auto;
    }

    .cover-meta {
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 20px;
    }

    .meta-item {
      font-size: 12pt;
    }

    .cover-stats {
      padding: 30px;
      background-color: #f9fafb;
      border-radius: 8px;
      margin: 20px 40px;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 24pt;
      font-weight: bold;
      color: #1e40af;
    }

    .stat-label {
      font-size: 10pt;
      color: #6b7280;
      text-transform: uppercase;
    }

    .cover-footer {
      padding: 20px;
      color: #9ca3af;
      font-size: 10pt;
    }

    /* Table of Contents */
    .toc {
      padding: 40px 20px;
    }

    .toc-title {
      font-size: 24pt;
      color: #1e40af;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .toc-list {
      list-style: none;
      padding: 0;
    }

    .toc-item {
      padding: 10px 0;
      border-bottom: 1px dotted #e5e7eb;
      font-size: 14pt;
    }

    .toc-number {
      color: #1e40af;
      font-weight: bold;
      margin-${isRTL ? 'left' : 'right'}: 10px;
    }

    /* Section Styles */
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 20pt;
      color: #1e40af;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .no-data {
      color: #9ca3af;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }

    /* Table Styles */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11pt;
    }

    .data-table th,
    .data-table td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      text-align: ${isRTL ? 'right' : 'left'};
    }

    .data-table th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }

    .data-table tr:nth-child(even) {
      background-color: #f9fafb;
    }

    /* Card Styles */
    .content-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }

    .content-card h3 {
      margin: 0 0 10px 0;
      color: #111827;
      font-size: 14pt;
    }

    .card-meta {
      display: flex;
      gap: 20px;
      font-size: 10pt;
      color: #6b7280;
    }

    /* Timeline Styles */
    .timeline {
      border-${isRTL ? 'right' : 'left'}: 3px solid #1e40af;
      padding-${isRTL ? 'right' : 'left'}: 20px;
      margin-${isRTL ? 'right' : 'left'}: 10px;
    }

    .timeline-item {
      margin-bottom: 20px;
      position: relative;
    }

    .timeline-item::before {
      content: '';
      width: 12px;
      height: 12px;
      background-color: #1e40af;
      border-radius: 50%;
      position: absolute;
      ${isRTL ? 'right' : 'left'}: -27px;
      top: 5px;
    }

    .timeline-date {
      font-size: 10pt;
      color: #6b7280;
    }

    .timeline-content {
      margin-top: 5px;
    }

    .timeline-type {
      display: inline-block;
      background-color: #e5e7eb;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10pt;
      margin-${isRTL ? 'right' : 'left'}: 10px;
    }

    /* Contacts Grid */
    .contacts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .contact-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
    }

    .contact-card h4 {
      margin: 0 0 5px 0;
      color: #111827;
    }

    .contact-title {
      margin: 0;
      font-size: 10pt;
      color: #4b5563;
    }

    .contact-org {
      margin: 5px 0;
      font-size: 10pt;
      color: #6b7280;
    }

    .contact-email,
    .contact-phone {
      margin: 3px 0;
      font-size: 10pt;
      color: #3b82f6;
    }

    /* Footer */
    .document-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
      color: #9ca3af;
      padding: 10px;
      border-top: 1px solid #e5e7eb;
    }

    @media print {
      .document-footer {
        position: fixed;
      }
    }
  </style>
</head>
<body>
  ${content}

  ${
    config.includePageNumbers
      ? `
    <div class="document-footer">
      ${config.footerText || 'GASTAT - International Dossier System'} | ${formatDate(new Date().toISOString(), isRTL ? 'ar' : 'en')}
    </div>
  `
      : ''
  }
</body>
</html>
  `;
}

// =============================================================================
// Data Fetching
// =============================================================================

async function fetchDossierData(supabase: any, dossierId: string): Promise<any> {
  // Fetch dossier
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', dossierId)
    .single();

  if (dossierError) {
    throw new Error(`Failed to fetch dossier: ${dossierError.message}`);
  }

  // Fetch all related data in parallel
  const [
    relationshipsResult,
    positionsResult,
    mousResult,
    workItemsResult,
    eventsResult,
    contactsResult,
    activitiesResult,
    documentsResult,
  ] = await Promise.all([
    // Relationships
    Promise.all([
      supabase
        .from('dossier_relationships')
        .select('*, target_dossier:target_dossier_id(id, name_en, name_ar, type)')
        .eq('source_dossier_id', dossierId)
        .is('deleted_at', null),
      supabase
        .from('dossier_relationships')
        .select('*, source_dossier:source_dossier_id(id, name_en, name_ar, type)')
        .eq('target_dossier_id', dossierId)
        .is('deleted_at', null),
    ]).then(([outgoing, incoming]) => {
      const rels: any[] = [];
      (outgoing.data || []).forEach((r: any) => {
        if (r.target_dossier) {
          rels.push({
            ...r.target_dossier,
            relationship_type: r.relationship_type,
            notes_en: r.notes_en,
            notes_ar: r.notes_ar,
          });
        }
      });
      (incoming.data || []).forEach((r: any) => {
        if (r.source_dossier) {
          rels.push({
            ...r.source_dossier,
            relationship_type: r.relationship_type,
            notes_en: r.notes_en,
            notes_ar: r.notes_ar,
          });
        }
      });
      return rels;
    }),

    // Positions
    supabase
      .from('positions')
      .select('id, title_en, title_ar, status, classification, created_at')
      .contains('dossier_ids', [dossierId])
      .order('created_at', { ascending: false })
      .limit(20),

    // MOUs
    supabase
      .from('mous')
      .select('id, title_en, title_ar, status, created_at')
      .contains('dossier_ids', [dossierId])
      .order('created_at', { ascending: false })
      .limit(20),

    // Work items (commitments/tasks)
    supabase
      .from('work_item_dossiers')
      .select('work_item_type, work_item_id')
      .eq('dossier_id', dossierId)
      .is('deleted_at', null)
      .limit(50),

    // Calendar events
    supabase
      .from('calendar_entries')
      .select('*')
      .eq('dossier_id', dossierId)
      .gte('start_datetime', new Date().toISOString())
      .order('start_datetime', { ascending: true })
      .limit(10),

    // Key contacts
    supabase
      .from('key_contacts')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('name', { ascending: true })
      .limit(20),

    // Recent activities
    supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', dossierId)
      .order('created_at', { ascending: false })
      .limit(20),

    // Documents
    supabase
      .from('documents')
      .select('*')
      .eq('entity_type', 'dossier')
      .eq('entity_id', dossierId)
      .limit(20),
  ]);

  // Fetch commitments for work items
  const commitmentIds = (workItemsResult.data || [])
    .filter((w: any) => w.work_item_type === 'commitment')
    .map((w: any) => w.work_item_id);

  let commitments: any[] = [];
  if (commitmentIds.length > 0) {
    const { data } = await supabase
      .from('commitments')
      .select('*, assignee:responsible_user_id(full_name)')
      .in('id', commitmentIds);
    commitments = (data || []).map((c: any) => ({
      ...c,
      title_en: c.title_en || c.title,
      title_ar: c.title_ar,
      assignee_name: c.assignee?.full_name,
    }));
  }

  // Calculate stats
  const stats = {
    relationships_count: relationshipsResult.length,
    positions_count: positionsResult.data?.length || 0,
    mous_count: mousResult.data?.length || 0,
    commitments_count: commitments.length,
    events_count: eventsResult.data?.length || 0,
    contacts_count: contactsResult.data?.length || 0,
    documents_count: documentsResult.data?.length || 0,
  };

  // Transform activities
  const activities = (activitiesResult.data || []).map((a: any) => ({
    id: a.id,
    title_en: a.action || 'Activity',
    title_ar: a.action,
    activity_type: a.action,
    timestamp: a.created_at,
  }));

  return {
    dossier,
    stats,
    relationships: relationshipsResult,
    positions: positionsResult.data || [],
    mous: mousResult.data || [],
    commitments,
    events: eventsResult.data || [],
    contacts: contactsResult.data || [],
    activities,
    documents: (documentsResult.data || []).map((d: any) => ({
      ...d,
      title_en: d.file_name,
      title_ar: d.file_name,
      document_type: d.document_type || 'attachment',
    })),
  };
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message_en: 'Method not allowed',
          message_ar: 'الطريقة غير مسموح بها',
        },
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get user
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid user session',
            message_ar: 'جلسة مستخدم غير صالحة',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: ExportRequest = await req.json();
    const { dossier_id, config } = body;

    if (!dossier_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_DOSSIER_ID',
            message_en: 'Dossier ID is required',
            message_ar: 'معرف الملف مطلوب',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Generating export for dossier ${dossier_id}`);

    // Fetch all dossier data
    const data = await fetchDossierData(supabase, dossier_id);

    // Generate HTML document
    const html = generateHTMLDocument(data.dossier, data, config);

    // For now, we return HTML as base64 and let the client render/print
    // In production, integrate with a PDF generation service
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);
    const base64 = btoa(String.fromCharCode(...htmlBytes));

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dossierSlug = (data.dossier.name_en || 'dossier')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);
    const fileName = `briefing-pack-${dossierSlug}-${timestamp}.html`;

    // Upload to storage
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const storagePath = `exports/${user.id}/${fileName}`;
    const { error: uploadError } = await serviceClient.storage
      .from('briefing-packs')
      .upload(storagePath, htmlBytes, {
        contentType: 'text/html',
        upsert: true,
      });

    let downloadUrl: string | undefined;
    if (!uploadError) {
      const { data: urlData } = await serviceClient.storage
        .from('briefing-packs')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry
      downloadUrl = urlData?.signedUrl;
    }

    return new Response(
      JSON.stringify({
        success: true,
        download_url: downloadUrl,
        file_name: fileName,
        file_size: htmlBytes.length,
        page_count: Math.ceil(htmlBytes.length / 5000), // Rough estimate
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        // Also include base64 for direct client rendering
        content_base64: base64,
        content_type: 'text/html',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message_en: error instanceof Error ? error.message : 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
