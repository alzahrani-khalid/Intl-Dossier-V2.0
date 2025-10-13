// Quick script to seed dossiers
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkrcjzdemdmwhearhfgg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dossiers = [
  {
    name_en: 'Japan Statistical Partnership',
    name_ar: 'شراكة إحصائية مع اليابان',
    type: 'country',
    status: 'active',
    sensitivity_level: 'low',
    summary_en: 'Strategic partnership with Japan Statistics Bureau for data exchange and capacity building',
    summary_ar: 'شراكة استراتيجية مع مكتب الإحصاءات الياباني لتبادل البيانات وبناء القدرات',
    tags: ['partnership', 'data-exchange', 'capacity-building']
  },
  {
    name_en: 'Germany Cooperation Initiative',
    name_ar: 'مبادرة التعاون مع ألمانيا',
    type: 'country',
    status: 'active',
    sensitivity_level: 'low',
    summary_en: 'Cooperation with German Federal Statistical Office on sustainable development indicators',
    summary_ar: 'التعاون مع المكتب الاتحادي الألماني للإحصاء حول مؤشرات التنمية المستدامة',
    tags: ['cooperation', 'sustainability', 'indicators']
  },
  {
    name_en: 'UN Statistics Division',
    name_ar: 'شعبة إحصاءات الأمم المتحدة',
    type: 'organization',
    status: 'active',
    sensitivity_level: 'low',
    summary_en: 'Partnership with UNSD for global statistical standards and methodologies',
    summary_ar: 'شراكة مع شعبة إحصاءات الأمم المتحدة للمعايير والمنهجيات الإحصائية العالمية',
    tags: ['international', 'standards', 'methodology']
  },
  {
    name_en: 'OECD Statistical Framework',
    name_ar: 'الإطار الإحصائي لمنظمة التعاون الاقتصادي والتنمية',
    type: 'organization',
    status: 'active',
    sensitivity_level: 'medium',
    summary_en: 'Collaboration on economic statistics and policy indicators with OECD',
    summary_ar: 'التعاون في الإحصاءات الاقتصادية ومؤشرات السياسات مع منظمة التعاون الاقتصادي والتنمية',
    tags: ['oecd', 'economic-stats', 'policy']
  },
  {
    name_en: 'World Bank Data Initiative',
    name_ar: 'مبادرة بيانات البنك الدولي',
    type: 'organization',
    status: 'active',
    sensitivity_level: 'medium',
    summary_en: 'Joint initiative with World Bank for development statistics and open data',
    summary_ar: 'مبادرة مشتركة مع البنك الدولي لإحصاءات التنمية والبيانات المفتوحة',
    tags: ['world-bank', 'development', 'open-data']
  },
  {
    name_en: 'GCC Statistical Forum',
    name_ar: 'المنتدى الإحصائي لدول مجلس التعاون الخليجي',
    type: 'forum',
    status: 'active',
    sensitivity_level: 'low',
    summary_en: 'Regular forum for GCC countries to harmonize statistical practices',
    summary_ar: 'منتدى منتظم لدول مجلس التعاون الخليجي لتنسيق الممارسات الإحصائية',
    tags: ['gcc', 'harmonization', 'regional']
  },
  {
    name_en: 'Digital Transformation Theme',
    name_ar: 'موضوع التحول الرقمي',
    type: 'theme',
    status: 'active',
    sensitivity_level: 'low',
    summary_en: 'Cross-cutting theme on digital transformation in statistical production',
    summary_ar: 'موضوع شامل حول التحول الرقمي في الإنتاج الإحصائي',
    tags: ['digital', 'transformation', 'innovation']
  }
];

async function seedDossiers() {
  console.log('Seeding dossiers...');

  const { data, error } = await supabase
    .from('dossiers')
    .insert(dossiers);

  if (error) {
    // If duplicate, that's okay
    if (error.code === '23505') {
      console.log('Dossiers already exist (duplicate key), skipping...');
    } else {
      console.error('Error seeding dossiers:', error);
      process.exit(1);
    }
  } else {
    console.log(`Successfully seeded ${dossiers.length} dossiers`);
  }

  // Verify
  const { count } = await supabase
    .from('dossiers')
    .select('*', { count: 'exact', head: true });

  console.log(`Total dossiers in database: ${count}`);
}

seedDossiers();
