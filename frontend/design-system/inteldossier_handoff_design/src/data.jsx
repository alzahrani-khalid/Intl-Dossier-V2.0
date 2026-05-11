// data.jsx — Seed data for the IntelDossier prototype.
// All in-memory. Feels real because it's specific.

const TODAY = new Date(2026, 3, 20); // April 20, 2026 (Mon)

// Arabic-Indic digit conversion
const _AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toArDigits(s) {
  return String(s).replace(/[0-9]/g, d => _AR_DIGITS[+d]);
}
// fmt(locale, en, ar) — returns correct string; auto-converts digits in ar string if it has Latin ones
function fmt(locale, en, ar) {
  if (locale === 'ar') return toArDigits(ar);
  return en;
}
// n(locale, num) — format a number for locale
function n(locale, num) {
  return locale === 'ar' ? toArDigits(num) : String(num);
}

const i18n = {
  en: {
    dir: 'ltr',
    appName: 'IntelDossier',
    workspace: 'GASTAT · International Partnerships',
    greeting: 'Good morning, Khalid',
    today: 'Monday, 20 April 2026',
    search: 'Search dossiers, people, commitments…',
    nav: {
      operations: 'Operations',
      dashboard: 'Situation',
      engagements: 'Engagements',
      afterActions: 'After-Actions',
      tasks: 'My Desk',
      calendar: 'Calendar',
      briefs: 'Briefs',
      activity: 'Activity',
      dossiers: 'Dossiers',
      countries: 'Countries',
      organizations: 'Organizations',
      persons: 'People',
      forums: 'Forums',
      topics: 'Topics',
      workingGroups: 'Working Groups',
      admin: 'Administration',
      settings: 'Settings',
      help: 'Help',
    },
    kpis: {
      activeEngagements: 'Active engagements',
      openCommitments: 'Open commitments',
      slaAtRisk: 'SLA at risk',
      weekAhead: 'This week',
    },
  },
  ar: {
    dir: 'rtl',
    appName: 'دوسييه',
    workspace: 'الهيئة العامة للإحصاء · الشراكات الدولية',
    greeting: 'صباح الخير، خالد',
    today: 'الإثنين ٢٠ أبريل ٢٠٢٦',
    search: 'ابحث في الملفات والأشخاص والالتزامات…',
    nav: {
      operations: 'العمليات',
      dashboard: 'الموقف',
      engagements: 'المشاركات',
      afterActions: 'ما بعد الإجراء',
      tasks: 'مكتبي',
      calendar: 'التقويم',
      briefs: 'الملخصات',
      activity: 'النشاط',
      dossiers: 'الدوسيهات',
      countries: 'الدول',
      organizations: 'المنظمات',
      persons: 'الأشخاص',
      forums: 'المنتديات',
      topics: 'المواضيع',
      workingGroups: 'مجموعات العمل',
      admin: 'الإدارة',
      settings: 'الإعدادات',
      help: 'المساعدة',
    },
    kpis: {
      activeEngagements: 'المشاركات النشطة',
      openCommitments: 'الالتزامات المفتوحة',
      slaAtRisk: 'مخاطر اتفاقية الخدمة',
      weekAhead: 'هذا الأسبوع',
    },
  },
};

// ---------- Week-ahead engagements ----------
const WEEK_AHEAD = [
  {
    id: 'e1',
    day: 'MON', date: 20, month: 'APR',
    time: '09:00–10:30',
    title: 'Bilateral consultation — ESCWA',
    location: 'Riyadh · GASTAT HQ, Room 4C',
    counterpart: 'Rola Dashti',
    counterpartRole: 'Executive Secretary, UN ESCWA',
    dossier: 'UN ESCWA',
    dossierType: 'organization',
    flag: '🇺🇳',
    sensitivity: 'internal',
    status: 'confirmed',
    delegation: 4,
    brief: 'ready',
  },
  {
    id: 'e2',
    day: 'TUE', date: 21, month: 'APR',
    time: '14:00',
    title: 'Prep session — G20 Data Gaps Initiative',
    location: 'Virtual · Webex',
    counterpart: 'Working group · 12 members',
    counterpartRole: 'G20 DGI-3 track',
    dossier: 'G20 Data Gaps Initiative',
    dossierType: 'forum',
    flag: '🌐',
    sensitivity: 'internal',
    status: 'confirmed',
    delegation: 12,
    brief: 'draft',
  },
  {
    id: 'e3',
    day: 'WED', date: 22, month: 'APR',
    time: '08:30–17:00',
    title: 'Delegation visit — Indonesia BPS',
    location: 'Riyadh · Ritz-Carlton',
    counterpart: 'Amalia Adininggar Widyasanti',
    counterpartRole: 'Chief Statistician, BPS Indonesia',
    dossier: 'Indonesia',
    dossierType: 'country',
    flag: '🇮🇩',
    sensitivity: 'confidential',
    status: 'confirmed',
    delegation: 8,
    brief: 'ready',
  },
  {
    id: 'e4',
    day: 'THU', date: 23, month: 'APR',
    time: '10:00',
    title: 'MoU review — GCC-Stat',
    location: 'Muscat (travel · dep. WED 22:00)',
    counterpart: 'GCC-Stat secretariat',
    counterpartRole: 'Annual review',
    dossier: 'GCC Statistical Centre',
    dossierType: 'organization',
    flag: '🇦🇪',
    sensitivity: 'confidential',
    status: 'travel',
    delegation: 3,
    brief: 'ready',
  },
  {
    id: 'e5',
    day: 'FRI', date: 24, month: 'APR',
    time: '11:00',
    title: 'Debrief — Vision 2030 alignment',
    location: 'Riyadh · GASTAT HQ',
    counterpart: 'Minister\u2019s office',
    counterpartRole: 'Quarterly readout',
    dossier: 'Vision 2030 Alignment',
    dossierType: 'topic',
    flag: '🇸🇦',
    sensitivity: 'restricted',
    status: 'pending',
    delegation: 2,
    brief: 'draft',
  },
];

// ---------- Overdue commitments (grouped) ----------
const OVERDUE = [
  {
    dossier: 'China', flag: '🇨🇳', type: 'country',
    items: [
      { id: 'c1', title: 'Test commitment for China partnership', days: 147, owner: 'K. Alzahrani', severity: 'high' },
      { id: 'c2', title: 'Review Belt and Road participation terms', days: 62, owner: 'N. Al-Qahtani', severity: 'high' },
      { id: 'c3', title: 'Re-engage on post-Belt-and-Road trade note', days: 12, owner: 'K. Alzahrani', severity: 'med' },
    ],
  },
  {
    dossier: 'G20 Data Gaps Initiative', flag: '🌐', type: 'forum',
    items: [
      { id: 'c4', title: 'Finalize G20 cooperation agreement', days: 141, owner: 'K. Alzahrani', severity: 'high' },
      { id: 'c5', title: 'Submit DGI-3 country response', days: 9, owner: 'S. Al-Harbi', severity: 'med' },
    ],
  },
  {
    dossier: 'Vision 2030 Alignment', flag: '🇸🇦', type: 'topic',
    items: [
      { id: 'c6', title: 'Coordinate Vision 2030 alignment readout', days: 110, owner: 'K. Alzahrani', severity: 'med' },
      { id: 'c7', title: 'Draft quarterly commitments ledger', days: 4, owner: 'A. Badr', severity: 'low' },
    ],
  },
  {
    dossier: 'United Arab Emirates', flag: '🇦🇪', type: 'country',
    items: [
      { id: 'c8', title: 'Schedule next bilateral meeting', days: 125, owner: 'K. Alzahrani', severity: 'med' },
      { id: 'c9', title: 'Send follow-up documentation', days: 165, owner: 'N. Al-Qahtani', severity: 'high' },
    ],
  },
  {
    dossier: 'OECD', flag: '🇺🇳', type: 'organization',
    items: [
      { id: 'c10', title: 'Review trade agreement terms', days: 96, owner: 'S. Al-Harbi', severity: 'med' },
      { id: 'c11', title: 'Finalize defense-cooperation framework', days: 73, owner: 'K. Alzahrani', severity: 'high' },
    ],
  },
];

// ---------- Recently updated dossiers ----------
const RECENT_DOSSIERS = [
  { name: 'Indonesia', type: 'country', flag: '🇮🇩', updated: '12 min ago', by: 'N. Al-Qahtani', change: 'Brief v3 approved', pulse: 8 },
  { name: 'UN ESCWA', type: 'organization', flag: '🇺🇳', updated: '1 h ago', by: 'K. Alzahrani', change: '2 commitments added', pulse: 12 },
  { name: 'G20 Data Gaps Initiative', type: 'forum', flag: '🌐', updated: '3 h ago', by: 'S. Al-Harbi', change: 'Position paper drafted', pulse: 15 },
  { name: 'Rola Dashti', type: 'person', flag: '👤', updated: '4 h ago', by: 'A. Badr', change: 'Bio refreshed', pulse: 3 },
  { name: 'Vision 2030 Alignment', type: 'topic', flag: '🇸🇦', updated: 'yesterday', by: 'K. Alzahrani', change: 'Linked 4 engagements', pulse: 9 },
  { name: 'GCC Statistical Centre', type: 'organization', flag: '🇦🇪', updated: 'yesterday', by: 'N. Al-Qahtani', change: 'MoU uploaded', pulse: 6 },
];

// ---------- SLA / Portfolio health ----------
const SLA_HEALTH = {
  onTrack: 62,
  atRisk: 9,
  breached: 4,
  total: 75,
  // 14-day sparkline of breach count
  trend: [4, 5, 5, 6, 6, 5, 4, 4, 5, 6, 7, 6, 5, 4],
};

// ---------- VIP visits ----------
const VIP_VISITS = [
  { who: 'Amalia Adininggar Widyasanti', role: 'Chief Statistician, BPS Indonesia', when: 'Wed 22 Apr', where: 'Riyadh', flag: '🇮🇩', clearance: 'confidential', days: 2 },
  { who: 'Rola Dashti', role: 'Executive Secretary, UN ESCWA', when: 'Mon 20 Apr', where: 'Riyadh', flag: '🇺🇳', clearance: 'internal', days: 0 },
  { who: 'Stefan Schweinfest', role: 'Director, UN Statistics Division', when: 'Tue 28 Apr', where: 'Geneva', flag: '🇺🇳', clearance: 'internal', days: 8 },
  { who: 'Álvaro Lario', role: 'President, IFAD', when: 'Mon 04 May', where: 'Rome', flag: '🇮🇹', clearance: 'confidential', days: 14 },
];

// ---------- My tasks ----------
const MY_TASKS = [
  { id: 't1', title: 'Approve Indonesia delegation brief v3', due: 'today', priority: 'high', type: 'approval', dossier: 'Indonesia', flag: '🇮🇩' },
  { id: 't2', title: 'Review ESCWA talking points', due: 'today', priority: 'high', type: 'review', dossier: 'UN ESCWA', flag: '🇺🇳' },
  { id: 't3', title: 'Sign travel authorisation — Muscat', due: 'tomorrow', priority: 'med', type: 'approval', dossier: 'GCC-Stat', flag: '🇦🇪' },
  { id: 't4', title: 'Draft after-action — G20 DGI call', due: 'Wed', priority: 'med', type: 'draft', dossier: 'G20 DGI', flag: '🌐' },
  { id: 't5', title: 'Respond to OECD data request', due: 'Thu', priority: 'med', type: 'response', dossier: 'OECD', flag: '🇺🇳' },
  { id: 't6', title: 'Quarterly readout — minister', due: 'Fri', priority: 'high', type: 'present', dossier: 'Vision 2030', flag: '🇸🇦' },
];

// ---------- Intelligence digest ----------
const DIGEST = [
  { tag: 'REGIONAL', headline: 'ESCWA finalises Arab SDG Monitor v2 — implications for GCC reporting', source: 'ESCWA briefing 19 Apr', priority: 'high' },
  { tag: 'G20', headline: 'G20 sherpas circulate DGI-3 phase-out timeline; KSA response due 24 Apr', source: 'G20 Sherpa track', priority: 'high' },
  { tag: 'BILATERAL', headline: 'Indonesia BPS signals interest in geospatial census partnership', source: 'Jakarta mission note', priority: 'med' },
  { tag: 'OECD', headline: 'OECD releases new AI-in-statistics guidance — 14 jurisdictions responding', source: 'OECD.stat wire', priority: 'med' },
  { tag: 'VISION 2030', headline: 'Ministry requests Q2 dashboard by 15 May', source: 'Internal memo', priority: 'high' },
];

// ---------- Forums / summits calendar ----------
const FORUMS = [
  { name: 'UN Statistical Commission', short: 'UNSC 57', when: '3–6 Mar 2026', status: 'closed', role: 'Delegate', dossier: 'UN Statistics Division' },
  { name: 'G20 DGI-3 Plenary', short: 'G20 DGI-3', when: '12–13 May 2026', status: 'upcoming', role: 'Co-chair', dossier: 'G20 Data Gaps Initiative' },
  { name: 'OECD World Forum on Statistics', short: 'OECD WFS', when: '9–11 Jun 2026', status: 'upcoming', role: 'Panelist', dossier: 'OECD' },
  { name: 'Arab Statistical Forum', short: 'ASF 2026', when: '21–23 Sep 2026', status: 'planned', role: 'Host', dossier: 'Arab Statistical Forum' },
  { name: 'ISI World Statistics Congress', short: 'ISI WSC', when: '4–9 Oct 2026', status: 'planned', role: 'Observer', dossier: 'ISI' },
];

// ---------- Dossier lists ----------
const COUNTRIES = [
  { en: 'Egypt', ar: 'جمهورية مصر العربية', code: 'EG', status: 'active', sens: 'confidential', engagements: 14, lastTouch: '3 d', flag: '🇪🇬' },
  { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', code: 'SA', status: 'active', sens: 'restricted', engagements: 48, lastTouch: 'today', flag: '🇸🇦' },
  { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', code: 'AE', status: 'active', sens: 'confidential', engagements: 22, lastTouch: '1 d', flag: '🇦🇪' },
  { en: 'Indonesia', ar: 'جمهورية إندونيسيا', code: 'ID', status: 'active', sens: 'confidential', engagements: 9, lastTouch: 'today', flag: '🇮🇩' },
  { en: 'Qatar', ar: 'دولة قطر', code: 'QA', status: 'active', sens: 'confidential', engagements: 11, lastTouch: '4 d', flag: '🇶🇦' },
  { en: 'Jordan', ar: 'المملكة الأردنية الهاشمية', code: 'JO', status: 'active', sens: 'internal', engagements: 7, lastTouch: '6 d', flag: '🇯🇴' },
  { en: 'Bahrain', ar: 'مملكة البحرين', code: 'BH', status: 'active', sens: 'confidential', engagements: 10, lastTouch: '2 d', flag: '🇧🇭' },
  { en: 'Oman', ar: 'سلطنة عمان', code: 'OM', status: 'active', sens: 'confidential', engagements: 13, lastTouch: '1 d', flag: '🇴🇲' },
  { en: 'Kuwait', ar: 'دولة الكويت', code: 'KW', status: 'active', sens: 'confidential', engagements: 8, lastTouch: '5 d', flag: '🇰🇼' },
  { en: 'Pakistan', ar: 'جمهورية باكستان الإسلامية', code: 'PK', status: 'active', sens: 'confidential', engagements: 5, lastTouch: '9 d', flag: '🇵🇰' },
  { en: 'Morocco', ar: 'المملكة المغربية', code: 'MA', status: 'monitoring', sens: 'internal', engagements: 3, lastTouch: '14 d', flag: '🇲🇦' },
  { en: 'Türkiye', ar: 'تركيا', code: 'TR', status: 'active', sens: 'confidential', engagements: 6, lastTouch: '3 d', flag: '🇹🇷' },
];

const ORGANIZATIONS = [
  { en: 'UN ESCWA', ar: 'الإسكوا', type: 'UN body', status: 'active', sens: 'confidential', engagements: 18, lastTouch: 'today' },
  { en: 'GCC Statistical Centre', ar: 'المركز الإحصائي لدول مجلس التعاون', type: 'Regional', status: 'active', sens: 'restricted', engagements: 24, lastTouch: '1 d' },
  { en: 'Arab Institute for Training & Research in Statistics', ar: 'المعهد العربي للتدريب والبحوث الإحصائية', type: 'Regional', status: 'active', sens: 'internal', engagements: 7, lastTouch: '6 d' },
  { en: 'International Statistical Institute', ar: 'المعهد الإحصائي الدولي', type: 'Academic', status: 'active', sens: 'internal', engagements: 4, lastTouch: '11 d' },
  { en: 'OECD', ar: 'منظمة التعاون الاقتصادي والتنمية', type: 'IGO', status: 'active', sens: 'confidential', engagements: 15, lastTouch: '2 d' },
  { en: 'FAO Statistics Division', ar: 'شعبة الإحصاءات بمنظمة الأغذية والزراعة', type: 'UN body', status: 'active', sens: 'internal', engagements: 3, lastTouch: '22 d' },
  { en: 'World Bank Group', ar: 'مجموعة البنك الدولي', type: 'IGO', status: 'active', sens: 'confidential', engagements: 12, lastTouch: '3 d' },
  { en: 'International Monetary Fund', ar: 'صندوق النقد الدولي', type: 'IGO', status: 'active', sens: 'confidential', engagements: 9, lastTouch: '4 d' },
  { en: 'Eurostat', ar: 'يوروستات', type: 'Regional', status: 'active', sens: 'internal', engagements: 6, lastTouch: '8 d' },
  { en: 'UN Statistics Division', ar: 'شعبة الإحصاءات بالأمم المتحدة', type: 'UN body', status: 'active', sens: 'confidential', engagements: 20, lastTouch: '1 d' },
];

// ---------- Work-board items ----------
const BOARD_COLS = [
  {
    key: 'todo', title: 'To do', count: 12, color: 'slate',
    items: [
      { id: 'b1', kind: 'Commitment', priority: 'med', title: 'Update trade partnership MOU', due: '25 Apr', dossier: 'UAE', flag: '🇦🇪', owner: 'KA' },
      { id: 'b2', kind: 'Commitment', priority: 'high', title: 'Review Belt and Road participation', due: 'Overdue 62d', dossier: 'China', flag: '🇨🇳', owner: 'NQ', overdue: true },
      { id: 'b3', kind: 'Task', priority: 'med', title: 'Prepare ESCWA delegation bios', due: '21 Apr', dossier: 'UN ESCWA', flag: '🇺🇳', owner: 'AB' },
      { id: 'b4', kind: 'Commitment', priority: 'high', title: 'Test commitment for China partnership', due: 'Overdue 147d', dossier: 'China', flag: '🇨🇳', owner: 'KA', overdue: true },
      { id: 'b5', kind: 'Task', priority: 'low', title: 'Digitise 2019 Jordan mission archive', due: '30 Jun', dossier: 'Jordan', flag: '🇯🇴', owner: 'AB' },
    ],
  },
  {
    key: 'doing', title: 'In progress', count: 7, color: 'amber',
    items: [
      { id: 'b6', kind: 'Commitment', priority: 'high', title: 'Finalize G20 cooperation agreement', due: 'Overdue 141d', dossier: 'G20 DGI', flag: '🌐', owner: 'KA', overdue: true },
      { id: 'b7', kind: 'Commitment', priority: 'high', title: 'Finalize defense-cooperation framework', due: 'Overdue 73d', dossier: 'OECD', flag: '🇺🇳', owner: 'KA', overdue: true },
      { id: 'b8', kind: 'Task', priority: 'med', title: 'Coordinate tech partnership roadmap', due: '28 Apr', dossier: 'Indonesia', flag: '🇮🇩', owner: 'NQ' },
      { id: 'b9', kind: 'Commitment', priority: 'med', title: 'Coordinate Vision 2030 alignment readout', due: 'Overdue 110d', dossier: 'Vision 2030', flag: '🇸🇦', owner: 'KA', overdue: true },
    ],
  },
  {
    key: 'review', title: 'In review', count: 5, color: 'blue',
    items: [
      { id: 'b10', kind: 'Task', priority: 'high', title: 'Indonesia delegation brief v3', due: 'Today', dossier: 'Indonesia', flag: '🇮🇩', owner: 'KA' },
      { id: 'b11', kind: 'Task', priority: 'med', title: 'DGI-3 country response draft', due: '24 Apr', dossier: 'G20 DGI', flag: '🌐', owner: 'SH' },
      { id: 'b12', kind: 'Task', priority: 'med', title: 'Seed task #43 — preparation', due: '26 Apr', dossier: 'OECD', flag: '🇺🇳', owner: 'AB' },
    ],
  },
  {
    key: 'done', title: 'Done', count: 24, color: 'green',
    items: [
      { id: 'b13', kind: 'Task', priority: 'low', title: 'UNSC 57 post-meeting summary', due: '18 Mar', dossier: 'UNSD', flag: '🇺🇳', owner: 'KA', done: true },
      { id: 'b14', kind: 'Commitment', priority: 'med', title: 'Share GCC-Stat q1 figures', due: '15 Apr', dossier: 'GCC-Stat', flag: '🇦🇪', owner: 'NQ', done: true },
    ],
  },
];

// ---------- Activity feed ----------
const ACTIVITY = [
  { t: '09:42', who: 'N. Al-Qahtani', action: 'approved', what: 'Indonesia brief v3', where: 'Indonesia', type: 'approval' },
  { t: '09:18', who: 'K. Alzahrani', action: 'linked', what: 'G20 DGI-3 to Vision 2030', where: 'Vision 2030', type: 'link' },
  { t: '08:55', who: 'S. Al-Harbi', action: 'uploaded', what: 'ESCWA talking points v2.docx', where: 'UN ESCWA', type: 'file' },
  { t: '08:30', who: 'A. Badr', action: 'closed', what: 'Travel auth · Muscat', where: 'GCC-Stat', type: 'check' },
  { t: 'yday 17:10', who: 'System', action: 'flagged', what: '4 commitments breached SLA', where: 'Portfolio', type: 'alert' },
  { t: 'yday 15:22', who: 'K. Alzahrani', action: 'commented on', what: 'OECD data request', where: 'OECD', type: 'comment' },
];

Object.assign(window, {
  i18n, WEEK_AHEAD, OVERDUE, RECENT_DOSSIERS, SLA_HEALTH, VIP_VISITS,
  MY_TASKS, DIGEST, FORUMS, COUNTRIES, ORGANIZATIONS, BOARD_COLS, ACTIVITY, TODAY,
  toArDigits, fmt, n,
});
