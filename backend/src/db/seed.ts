import { Pool } from 'pg';
import { logInfo, logError } from '../utils/logger';

/**
 * Database seeding utility for GASTAT International Dossier System
 * Seeds the database with initial demo data
 */

// Database configuration
const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'intl_dossier',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'password',
};

/**
 * Seed the database with demo data
 */
export async function seedDatabase(): Promise<void> {
  const pool = new Pool(databaseConfig);

  try {
    logInfo('Starting database seeding...');

    const client = await pool.connect();

    // Add more countries
    await client.query(`
      INSERT INTO countries (code, name_en, name_ar, region, capital_en, capital_ar, population, gdp_usd) VALUES
      ('JPN', 'Japan', 'اليابان', 'East Asia', 'Tokyo', 'طوكيو', 125800000, 4937422000000),
      ('DEU', 'Germany', 'ألمانيا', 'Central Europe', 'Berlin', 'برلين', 83200000, 3846410000000),
      ('FRA', 'France', 'فرنسا', 'Western Europe', 'Paris', 'باريس', 67400000, 2630320000000),
      ('IND', 'India', 'الهند', 'South Asia', 'New Delhi', 'نيودلهي', 1380000000, 2875142000000),
      ('BRA', 'Brazil', 'البرازيل', 'South America', 'Brasília', 'برازيليا', 212600000, 1608980000000),
      ('RUS', 'Russia', 'روسيا', 'Eastern Europe', 'Moscow', 'موسكو', 144100000, 1483497000000),
      ('KOR', 'South Korea', 'كوريا الجنوبية', 'East Asia', 'Seoul', 'سول', 51780000, 1642380000000),
      ('CAN', 'Canada', 'كندا', 'North America', 'Ottawa', 'أوتاوا', 38000000, 1736426000000),
      ('AUS', 'Australia', 'أستراليا', 'Oceania', 'Canberra', 'كانبرا', 25700000, 1330900000000),
      ('TUR', 'Turkey', 'تركيا', 'Western Asia', 'Ankara', 'أنقرة', 84300000, 754420000000)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Backfill optional relationship flags and importance where present
    await client.query(`
      UPDATE countries SET
        is_gcc = CASE WHEN code IN ('SAU','ARE','KWT','QAT','BHR','OMN') THEN TRUE ELSE COALESCE(is_gcc, FALSE) END,
        is_arab_league = COALESCE(is_arab_league, TRUE),
        is_islamic_org = COALESCE(is_islamic_org, TRUE),
        strategic_importance = COALESCE(strategic_importance, 50),
        relationship_status = COALESCE(relationship_status, 'developing')::relationship_status
    `);

    // Add sample organizations
    await client.query(`
      INSERT INTO organizations (name_en, name_ar, type, description_en, description_ar, headquarters_country) VALUES
      ('General Authority for Statistics', 'الهيئة العامة للإحصاء', 'government', 'Saudi Arabia\'s official statistical agency', 'الوكالة الإحصائية الرسمية للمملكة العربية السعودية', (SELECT id FROM countries WHERE code = 'SAU')),
      ('United Nations Statistics Division', 'شعبة الإحصاءات في الأمم المتحدة', 'international', 'UN agency responsible for global statistical activities', 'وكالة الأمم المتحدة المسؤولة عن الأنشطة الإحصائية العالمية', (SELECT id FROM countries WHERE code = 'USA')),
      ('International Monetary Fund', 'صندوق النقد الدولي', 'international', 'International financial institution', 'مؤسسة مالية دولية', (SELECT id FROM countries WHERE code = 'USA')),
      ('World Bank Group', 'مجموعة البنك الدولي', 'international', 'International financial institution providing loans and grants', 'مؤسسة مالية دولية تقدم القروض والمنح', (SELECT id FROM countries WHERE code = 'USA')),
      ('Organization for Economic Cooperation and Development', 'منظمة التعاون الاقتصادي والتنمية', 'international', 'International organization promoting policies for economic and social well-being', 'منظمة دولية تعزز السياسات للرفاه الاقتصادي والاجتماعي', (SELECT id FROM countries WHERE code = 'FRA')),
      ('European Statistical Office', 'مكتب الإحصاءات الأوروبي', 'international', 'Statistical office of the European Union', 'المكتب الإحصائي للاتحاد الأوروبي', (SELECT id FROM countries WHERE code = 'DEU')),
      ('Japan Statistics Bureau', 'مكتب الإحصاءات الياباني', 'government', 'Japan\'s central statistical organization', 'المنظمة الإحصائية المركزية في اليابان', (SELECT id FROM countries WHERE code = 'JPN'))
      ON CONFLICT DO NOTHING;
    `);

    // Add sample MoUs
    await client.query(`
      INSERT INTO mous (title_en, title_ar, description_en, description_ar, status, signed_date, effective_date, expiry_date, classification) VALUES
      ('Statistical Cooperation Agreement with UN Statistics', 'اتفاقية التعاون الإحصائي مع إحصاءات الأمم المتحدة', 'Agreement for statistical data sharing and methodology harmonization', 'اتفاقية لتبادل البيانات الإحصائية وتوحيد المنهجيات', 'active', '2024-01-15', '2024-02-01', '2026-01-31', 'internal'),
      ('Data Exchange Protocol with World Bank', 'بروتوكول تبادل البيانات مع البنك الدولي', 'Protocol for sharing economic indicators and development statistics', 'بروتوكول لتبادل المؤشرات الاقتصادية وإحصاءات التنمية', 'active', '2024-03-10', '2024-04-01', '2025-03-31', 'internal'),
      ('Joint Research Initiative with OECD', 'مبادرة البحث المشترك مع منظمة التعاون الاقتصادي والتنمية', 'Collaborative research on sustainable development indicators', 'بحث تعاوني حول مؤشرات التنمية المستدامة', 'negotiation', NULL, NULL, NULL, 'confidential'),
      ('Capacity Building Program with Eurostat', 'برنامج بناء القدرات مع يوروستات', 'Training and knowledge transfer program for statistical methods', 'برنامج تدريب ونقل المعرفة للطرق الإحصائية', 'draft', NULL, NULL, NULL, 'internal')
      ON CONFLICT DO NOTHING;
    `);

    // Insert a sample event with attendees
    const { rows: eventRows } = await client.query(
      `INSERT INTO events (title, description, type, start_date, end_date, location, visibility)
       VALUES ($1,$2,'meeting', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', $3, 'internal')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['GASTAT – UNSD Coordination Meeting', 'Coordination on statistical data exchange', 'Riyadh']
    );

    const eventId = eventRows?.[0]?.id;
    if (eventId) {
      // Try to look up an organization and a country
      const {
        rows: [unsd]
      } = await client.query("SELECT id FROM organizations WHERE name_en = 'United Nations Statistics Division' LIMIT 1");
      const {
        rows: [jpn]
      } = await client.query("SELECT id FROM countries WHERE code = 'JPN' LIMIT 1");

      if (unsd?.id) {
        await client.query(
          `INSERT INTO attendees (event_id, type, entity_id, role, confirmed)
           VALUES ($1,'organization',$2,'host', TRUE)
           ON CONFLICT DO NOTHING`,
          [eventId, unsd.id]
        );
      }

      if (jpn?.id) {
        await client.query(
          `INSERT INTO attendees (event_id, type, entity_id, role, confirmed)
           VALUES ($1,'country',$2,'participant', FALSE)
           ON CONFLICT DO NOTHING`,
          [eventId, jpn.id]
        );
      }

      // Denormalized attendees array on events for quick filters
      await client.query(
        `UPDATE events SET attendees = (
            SELECT array_agg(entity_id) FROM attendees WHERE event_id = $1
         ) WHERE id = $1`,
        [eventId]
      );
    }

    // Add sample dossiers
    await client.query(`
      INSERT INTO dossiers (name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar, tags) VALUES
      ('Japan Statistical Partnership', 'شراكة إحصائية مع اليابان', 'country', 'active', 'low',
       'Strategic partnership with Japan Statistics Bureau for data exchange and capacity building',
       'شراكة استراتيجية مع مكتب الإحصاءات الياباني لتبادل البيانات وبناء القدرات',
       ARRAY['partnership', 'data-exchange', 'capacity-building']),
      ('Germany Cooperation Initiative', 'مبادرة التعاون مع ألمانيا', 'country', 'active', 'low',
       'Cooperation with German Federal Statistical Office on sustainable development indicators',
       'التعاون مع المكتب الاتحادي الألماني للإحصاء حول مؤشرات التنمية المستدامة',
       ARRAY['cooperation', 'sustainability', 'indicators']),
      ('UN Statistics Division', 'شعبة إحصاءات الأمم المتحدة', 'organization', 'active', 'low',
       'Partnership with UNSD for global statistical standards and methodologies',
       'شراكة مع شعبة إحصاءات الأمم المتحدة للمعايير والمنهجيات الإحصائية العالمية',
       ARRAY['international', 'standards', 'methodology']),
      ('OECD Statistical Framework', 'الإطار الإحصائي لمنظمة التعاون الاقتصادي والتنمية', 'organization', 'active', 'medium',
       'Collaboration on economic statistics and policy indicators with OECD',
       'التعاون في الإحصاءات الاقتصادية ومؤشرات السياسات مع منظمة التعاون الاقتصادي والتنمية',
       ARRAY['oecd', 'economic-stats', 'policy']),
      ('World Bank Data Initiative', 'مبادرة بيانات البنك الدولي', 'organization', 'active', 'medium',
       'Joint initiative with World Bank for development statistics and open data',
       'مبادرة مشتركة مع البنك الدولي لإحصاءات التنمية والبيانات المفتوحة',
       ARRAY['world-bank', 'development', 'open-data']),
      ('GCC Statistical Forum', 'المنتدى الإحصائي لدول مجلس التعاون الخليجي', 'forum', 'active', 'low',
       'Regular forum for GCC countries to harmonize statistical practices',
       'منتدى منتظم لدول مجلس التعاون الخليجي لتنسيق الممارسات الإحصائية',
       ARRAY['gcc', 'harmonization', 'regional']),
      ('Digital Transformation Theme', 'موضوع التحول الرقمي', 'theme', 'active', 'low',
       'Cross-cutting theme on digital transformation in statistical production',
       'موضوع شامل حول التحول الرقمي في الإنتاج الإحصائي',
       ARRAY['digital', 'transformation', 'innovation'])
      ON CONFLICT DO NOTHING;
    `);

    client.release();

    logInfo('Database seeding completed successfully');
  } catch (error) {
    logError('Database seeding failed:', error as Error);
    throw error;
  } finally {
    await pool.end();
  }
}

// CLI interface for seeding
if (require.main === module) {
  seedDatabase().catch((error) => {
    logError('Seeding command failed:', error as Error);
    process.exit(1);
  });
}
