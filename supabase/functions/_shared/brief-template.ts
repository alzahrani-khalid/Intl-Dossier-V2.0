// Brief template generator for manual fallback

export interface BriefTemplate {
  sections: Array<{
    id: string;
    title_en: string;
    title_ar: string;
    placeholder_en: string;
    placeholder_ar: string;
    required: boolean;
  }>;
}

export interface DossierData {
  id: string;
  name_en: string;
  name_ar: string;
  type: string;
  summary_en?: string;
  summary_ar?: string;
  tags: string[];
}

export interface TimelineEvent {
  event_type: string;
  event_date: string;
  event_title_en: string;
  event_title_ar: string;
}

export function generateBriefTemplate(): BriefTemplate {
  return {
    sections: [
      {
        id: "summary",
        title_en: "Executive Summary",
        title_ar: "الملخص التنفيذي",
        placeholder_en: "Provide a high-level overview of the dossier and key developments...",
        placeholder_ar: "قدم نظرة عامة رفيعة المستوى عن الملف والتطورات الرئيسية...",
        required: true,
      },
      {
        id: "recent_activity",
        title_en: "Recent Activity",
        title_ar: "النشاط الأخير",
        placeholder_en: "Summarize recent engagements, meetings, and events...",
        placeholder_ar: "لخص الارتباطات والاجتماعات والأحداث الأخيرة...",
        required: true,
      },
      {
        id: "commitments",
        title_en: "Open Commitments",
        title_ar: "الالتزامات المفتوحة",
        placeholder_en: "List pending commitments and their status...",
        placeholder_ar: "قائمة الالتزامات المعلقة وحالتها...",
        required: false,
      },
      {
        id: "positions",
        title_en: "Key Positions",
        title_ar: "المواقف الرئيسية",
        placeholder_en: "Outline important positions and policy stances...",
        placeholder_ar: "حدد المواقف المهمة والمواقف السياسية...",
        required: false,
      },
      {
        id: "health",
        title_en: "Relationship Health",
        title_ar: "صحة العلاقة",
        placeholder_en: "Assess the current state of the relationship...",
        placeholder_ar: "قيم الحالة الحالية للعلاقة...",
        required: false,
      },
    ],
  };
}

export function prePopulateTemplate(
  dossier: DossierData,
  recentEvents: TimelineEvent[]
): Record<string, unknown> {
  return {
    dossier_name_en: dossier.name_en,
    dossier_name_ar: dossier.name_ar,
    dossier_type: dossier.type,
    dossier_tags: dossier.tags,
    summary_en: dossier.summary_en || "",
    summary_ar: dossier.summary_ar || "",
    recent_events_count: recentEvents.length,
    recent_events: recentEvents.slice(0, 10).map((e) => ({
      type: e.event_type,
      date: e.event_date,
      title_en: e.event_title_en,
      title_ar: e.event_title_ar,
    })),
  };
}
