/**
 * Dossier Template Types
 *
 * Pre-configured dossier templates for quick creation.
 * Templates provide structure examples for different use cases:
 * - Bilateral Relations
 * - Regional Analysis
 * - Thematic Brief
 */

import type { DossierType } from './dossier'

/**
 * Template section definition
 */
export interface TemplateSection {
  id: string
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  icon?: string
  required?: boolean
}

/**
 * Template category for grouping related templates
 */
export type TemplateCategory = 'bilateral' | 'regional' | 'thematic' | 'organizational'

/**
 * Dossier Template definition
 */
export interface DossierTemplate {
  id: string
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  category: TemplateCategory
  dossier_type: DossierType
  thumbnail_color: string
  icon: string
  sections: TemplateSection[]
  recommended_tags: string[]
  example_name_en?: string
  example_name_ar?: string
  use_cases_en: string[]
  use_cases_ar: string[]
}

/**
 * Pre-configured templates for the gallery
 */
export const DOSSIER_TEMPLATES: DossierTemplate[] = [
  // Bilateral Relations Template
  {
    id: 'bilateral-relations',
    name_en: 'Bilateral Relations',
    name_ar: 'العلاقات الثنائية',
    description_en:
      'Track and manage bilateral relationships with specific countries, including diplomatic ties, agreements, and key contacts.',
    description_ar:
      'تتبع وإدارة العلاقات الثنائية مع دول محددة، بما في ذلك الروابط الدبلوماسية والاتفاقيات وجهات الاتصال الرئيسية.',
    category: 'bilateral',
    dossier_type: 'country',
    thumbnail_color: 'from-blue-500 to-cyan-500',
    icon: 'Globe',
    sections: [
      {
        id: 'diplomatic-overview',
        title_en: 'Diplomatic Overview',
        title_ar: 'نظرة عامة دبلوماسية',
        description_en: 'Current state of diplomatic relations and embassy information',
        description_ar: 'الحالة الراهنة للعلاقات الدبلوماسية ومعلومات السفارة',
        required: true,
      },
      {
        id: 'bilateral-agreements',
        title_en: 'Bilateral Agreements',
        title_ar: 'الاتفاقيات الثنائية',
        description_en: 'Active MoUs, treaties, and cooperation frameworks',
        description_ar: 'مذكرات التفاهم والمعاهدات وأطر التعاون النشطة',
        required: true,
      },
      {
        id: 'key-officials',
        title_en: 'Key Officials',
        title_ar: 'المسؤولون الرئيسيون',
        description_en: 'Ambassadors, ministers, and primary contacts',
        description_ar: 'السفراء والوزراء وجهات الاتصال الرئيسية',
        required: true,
      },
      {
        id: 'engagement-history',
        title_en: 'Engagement History',
        title_ar: 'سجل المشاركات',
        description_en: 'Past meetings, visits, and diplomatic events',
        description_ar: 'الاجتماعات والزيارات والفعاليات الدبلوماسية السابقة',
      },
      {
        id: 'economic-relations',
        title_en: 'Economic Relations',
        title_ar: 'العلاقات الاقتصادية',
        description_en: 'Trade data, investments, and economic cooperation',
        description_ar: 'البيانات التجارية والاستثمارات والتعاون الاقتصادي',
      },
    ],
    recommended_tags: ['bilateral', 'diplomatic', 'relations'],
    example_name_en: 'France Bilateral Relations',
    example_name_ar: 'العلاقات الثنائية مع فرنسا',
    use_cases_en: [
      'Country desk officer preparing briefings',
      'Diplomatic mission planning',
      'Tracking bilateral cooperation progress',
      'VIP visit preparation',
    ],
    use_cases_ar: [
      'إعداد الإحاطات من قبل مسؤول مكتب الدولة',
      'تخطيط البعثات الدبلوماسية',
      'تتبع تقدم التعاون الثنائي',
      'التحضير لزيارات كبار الشخصيات',
    ],
  },
  // Regional Analysis Template
  {
    id: 'regional-analysis',
    name_en: 'Regional Analysis',
    name_ar: 'التحليل الإقليمي',
    description_en:
      'Comprehensive analysis of a geographic region, including multiple countries and multilateral dynamics.',
    description_ar:
      'تحليل شامل لمنطقة جغرافية، بما في ذلك العديد من الدول والديناميكيات متعددة الأطراف.',
    category: 'regional',
    dossier_type: 'theme',
    thumbnail_color: 'from-emerald-500 to-teal-500',
    icon: 'Map',
    sections: [
      {
        id: 'regional-overview',
        title_en: 'Regional Overview',
        title_ar: 'نظرة إقليمية عامة',
        description_en: 'Geographic scope and strategic importance',
        description_ar: 'النطاق الجغرافي والأهمية الاستراتيجية',
        required: true,
      },
      {
        id: 'member-countries',
        title_en: 'Member Countries',
        title_ar: 'الدول الأعضاء',
        description_en: 'Countries within the region and their profiles',
        description_ar: 'الدول داخل المنطقة وملفاتها التعريفية',
        required: true,
      },
      {
        id: 'regional-organizations',
        title_en: 'Regional Organizations',
        title_ar: 'المنظمات الإقليمية',
        description_en: 'Key regional bodies and multilateral forums',
        description_ar: 'الهيئات الإقليمية الرئيسية والمنتديات متعددة الأطراف',
      },
      {
        id: 'strategic-priorities',
        title_en: 'Strategic Priorities',
        title_ar: 'الأولويات الاستراتيجية',
        description_en: 'Key focus areas and policy objectives',
        description_ar: 'مجالات التركيز الرئيسية وأهداف السياسة',
        required: true,
      },
      {
        id: 'regional-dynamics',
        title_en: 'Regional Dynamics',
        title_ar: 'الديناميكيات الإقليمية',
        description_en: 'Geopolitical trends and emerging issues',
        description_ar: 'الاتجاهات الجيوسياسية والقضايا الناشئة',
      },
      {
        id: 'engagement-opportunities',
        title_en: 'Engagement Opportunities',
        title_ar: 'فرص المشاركة',
        description_en: 'Potential areas for cooperation and partnership',
        description_ar: 'المجالات المحتملة للتعاون والشراكة',
      },
    ],
    recommended_tags: ['regional', 'analysis', 'multilateral', 'strategy'],
    example_name_en: 'Gulf Cooperation Council Analysis',
    example_name_ar: 'تحليل مجلس التعاون الخليجي',
    use_cases_en: [
      'Regional policy development',
      'Multilateral engagement planning',
      'Strategic trend analysis',
      'Cross-border initiative coordination',
    ],
    use_cases_ar: [
      'تطوير السياسات الإقليمية',
      'تخطيط المشاركة متعددة الأطراف',
      'تحليل الاتجاهات الاستراتيجية',
      'تنسيق المبادرات العابرة للحدود',
    ],
  },
  // Thematic Brief Template
  {
    id: 'thematic-brief',
    name_en: 'Thematic Brief',
    name_ar: 'الإحاطة الموضوعية',
    description_en:
      'In-depth analysis of a specific policy topic or issue area with supporting documentation and recommendations.',
    description_ar: 'تحليل متعمق لموضوع سياسي محدد أو مجال قضية مع وثائق داعمة وتوصيات.',
    category: 'thematic',
    dossier_type: 'theme',
    thumbnail_color: 'from-purple-500 to-pink-500',
    icon: 'FileText',
    sections: [
      {
        id: 'executive-summary',
        title_en: 'Executive Summary',
        title_ar: 'الملخص التنفيذي',
        description_en: 'High-level overview and key takeaways',
        description_ar: 'نظرة عامة عالية المستوى والنقاط الرئيسية',
        required: true,
      },
      {
        id: 'background-context',
        title_en: 'Background & Context',
        title_ar: 'الخلفية والسياق',
        description_en: 'Historical context and current situation',
        description_ar: 'السياق التاريخي والوضع الحالي',
        required: true,
      },
      {
        id: 'key-stakeholders',
        title_en: 'Key Stakeholders',
        title_ar: 'أصحاب المصلحة الرئيسيون',
        description_en: 'Organizations and individuals involved',
        description_ar: 'المنظمات والأفراد المعنيون',
      },
      {
        id: 'policy-analysis',
        title_en: 'Policy Analysis',
        title_ar: 'تحليل السياسات',
        description_en: 'Detailed analysis of policy options and implications',
        description_ar: 'تحليل مفصل لخيارات السياسة وآثارها',
        required: true,
      },
      {
        id: 'recommendations',
        title_en: 'Recommendations',
        title_ar: 'التوصيات',
        description_en: 'Actionable recommendations and next steps',
        description_ar: 'توصيات قابلة للتنفيذ والخطوات التالية',
        required: true,
      },
      {
        id: 'supporting-documents',
        title_en: 'Supporting Documents',
        title_ar: 'الوثائق الداعمة',
        description_en: 'Reference materials and attachments',
        description_ar: 'المواد المرجعية والمرفقات',
      },
    ],
    recommended_tags: ['thematic', 'policy', 'analysis', 'brief'],
    example_name_en: 'Climate Diplomacy Initiative',
    example_name_ar: 'مبادرة الدبلوماسية المناخية',
    use_cases_en: [
      'Policy briefing preparation',
      'Issue-based research compilation',
      'Decision support documentation',
      'Cross-cutting theme tracking',
    ],
    use_cases_ar: [
      'إعداد إحاطات السياسات',
      'تجميع البحوث القائمة على القضايا',
      'توثيق دعم القرار',
      'تتبع المواضيع الشاملة',
    ],
  },
  // Organization Profile Template
  {
    id: 'organization-profile',
    name_en: 'Organization Profile',
    name_ar: 'ملف المنظمة',
    description_en:
      'Comprehensive profile of an international organization, including structure, mandate, and engagement history.',
    description_ar: 'ملف شامل لمنظمة دولية، بما في ذلك الهيكل والتفويض وسجل المشاركة.',
    category: 'organizational',
    dossier_type: 'organization',
    thumbnail_color: 'from-orange-500 to-amber-500',
    icon: 'Building2',
    sections: [
      {
        id: 'org-overview',
        title_en: 'Organization Overview',
        title_ar: 'نظرة عامة على المنظمة',
        description_en: 'Mission, mandate, and organizational structure',
        description_ar: 'المهمة والتفويض والهيكل التنظيمي',
        required: true,
      },
      {
        id: 'leadership',
        title_en: 'Leadership & Key Contacts',
        title_ar: 'القيادة وجهات الاتصال الرئيسية',
        description_en: 'Executive leadership and primary contacts',
        description_ar: 'القيادة التنفيذية وجهات الاتصال الأساسية',
        required: true,
      },
      {
        id: 'membership',
        title_en: 'Membership',
        title_ar: 'العضوية',
        description_en: 'Member states and participation status',
        description_ar: 'الدول الأعضاء وحالة المشاركة',
      },
      {
        id: 'active-agreements',
        title_en: 'Active Agreements',
        title_ar: 'الاتفاقيات النشطة',
        description_en: 'MoUs, partnerships, and cooperation frameworks',
        description_ar: 'مذكرات التفاهم والشراكات وأطر التعاون',
        required: true,
      },
      {
        id: 'engagement-calendar',
        title_en: 'Engagement Calendar',
        title_ar: 'جدول المشاركات',
        description_en: 'Upcoming meetings and events',
        description_ar: 'الاجتماعات والفعاليات القادمة',
      },
      {
        id: 'assessment',
        title_en: 'Relationship Assessment',
        title_ar: 'تقييم العلاقة',
        description_en: 'Current state and opportunities for engagement',
        description_ar: 'الوضع الراهن وفرص المشاركة',
      },
    ],
    recommended_tags: ['organization', 'international', 'profile'],
    example_name_en: 'United Nations Profile',
    example_name_ar: 'ملف الأمم المتحدة',
    use_cases_en: [
      'Institutional relationship management',
      'Pre-meeting preparation',
      'Membership engagement planning',
      'Partnership opportunity assessment',
    ],
    use_cases_ar: [
      'إدارة العلاقات المؤسسية',
      'التحضير لما قبل الاجتماع',
      'تخطيط مشاركة العضوية',
      'تقييم فرص الشراكة',
    ],
  },
  // Forum Dossier Template
  {
    id: 'forum-dossier',
    name_en: 'Forum Dossier',
    name_ar: 'ملف المنتدى',
    description_en:
      'Track multilateral forums, conferences, and summits with agenda items, outcomes, and follow-up actions.',
    description_ar:
      'تتبع المنتديات متعددة الأطراف والمؤتمرات والقمم مع بنود جدول الأعمال والنتائج وإجراءات المتابعة.',
    category: 'organizational',
    dossier_type: 'forum',
    thumbnail_color: 'from-indigo-500 to-blue-500',
    icon: 'Users',
    sections: [
      {
        id: 'forum-overview',
        title_en: 'Forum Overview',
        title_ar: 'نظرة عامة على المنتدى',
        description_en: 'Purpose, frequency, and participation scope',
        description_ar: 'الغرض والتكرار ونطاق المشاركة',
        required: true,
      },
      {
        id: 'participants',
        title_en: 'Participants',
        title_ar: 'المشاركون',
        description_en: 'Member states and observer organizations',
        description_ar: 'الدول الأعضاء والمنظمات المراقبة',
        required: true,
      },
      {
        id: 'agenda-priorities',
        title_en: 'Agenda & Priorities',
        title_ar: 'جدول الأعمال والأولويات',
        description_en: 'Current agenda items and key priorities',
        description_ar: 'بنود جدول الأعمال الحالية والأولويات الرئيسية',
        required: true,
      },
      {
        id: 'past-outcomes',
        title_en: 'Past Outcomes',
        title_ar: 'النتائج السابقة',
        description_en: 'Decisions and resolutions from past sessions',
        description_ar: 'القرارات والقرارات من الجلسات السابقة',
      },
      {
        id: 'commitments-tracker',
        title_en: 'Commitments Tracker',
        title_ar: 'متتبع الالتزامات',
        description_en: 'Follow-up on pledges and action items',
        description_ar: 'متابعة التعهدات وبنود العمل',
      },
      {
        id: 'next-session',
        title_en: 'Next Session Planning',
        title_ar: 'تخطيط الجلسة القادمة',
        description_en: 'Preparation for upcoming meetings',
        description_ar: 'التحضير للاجتماعات القادمة',
      },
    ],
    recommended_tags: ['forum', 'multilateral', 'conference', 'summit'],
    example_name_en: 'G20 Summit Dossier',
    example_name_ar: 'ملف قمة مجموعة العشرين',
    use_cases_en: [
      'Summit and conference preparation',
      'Multilateral engagement tracking',
      'Commitment monitoring',
      'Delegation briefing preparation',
    ],
    use_cases_ar: [
      'التحضير للقمم والمؤتمرات',
      'تتبع المشاركة متعددة الأطراف',
      'مراقبة الالتزامات',
      'إعداد إحاطات الوفود',
    ],
  },
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DossierTemplate | undefined {
  return DOSSIER_TEMPLATES.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): DossierTemplate[] {
  return DOSSIER_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get templates by dossier type
 */
export function getTemplatesByDossierType(type: DossierType): DossierTemplate[] {
  return DOSSIER_TEMPLATES.filter((t) => t.dossier_type === type)
}
