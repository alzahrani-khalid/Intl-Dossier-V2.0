-- Migration: Sample Data Templates for Empty Workspace Population
-- Date: 2026-01-13
-- Feature: One-click sample data population with themed templates

-- ============================================================================
-- SAMPLE DATA TEMPLATES TABLE
-- ============================================================================

-- Template definitions for sample data themes
CREATE TABLE sample_data_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name_en TEXT NOT NULL CHECK (length(name_en) <= 100),
  name_ar TEXT NOT NULL CHECK (length(name_ar) <= 100),
  description_en TEXT NOT NULL CHECK (length(description_en) <= 500),
  description_ar TEXT NOT NULL CHECK (length(description_ar) <= 500),

  -- Visual
  icon TEXT NOT NULL DEFAULT 'package', -- Lucide icon name
  color TEXT NOT NULL DEFAULT 'blue', -- Tailwind color name

  -- Template content (JSONB with dossiers, relationships, events, etc.)
  template_data JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SAMPLE DATA INSTANCES TABLE (tracks populated sample data per user)
-- ============================================================================

CREATE TABLE sample_data_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who populated the sample data
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template used
  template_id UUID NOT NULL REFERENCES sample_data_templates(id) ON DELETE CASCADE,

  -- IDs of created entities (for easy removal)
  created_dossier_ids UUID[] NOT NULL DEFAULT '{}',
  created_relationship_ids UUID[] NOT NULL DEFAULT '{}',
  created_event_ids UUID[] NOT NULL DEFAULT '{}',
  created_contact_ids UUID[] NOT NULL DEFAULT '{}',
  created_brief_ids UUID[] NOT NULL DEFAULT '{}',

  -- Metadata
  populated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE, -- NULL means still active

  -- Constraints
  CONSTRAINT unique_active_sample_per_user UNIQUE (user_id, template_id)
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_sample_templates_active ON sample_data_templates(is_active, sort_order);
CREATE INDEX idx_sample_instances_user ON sample_data_instances(user_id) WHERE removed_at IS NULL;
CREATE INDEX idx_sample_instances_template ON sample_data_instances(template_id);

-- Triggers
CREATE TRIGGER set_sample_templates_updated_at
  BEFORE UPDATE ON sample_data_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE sample_data_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_data_instances ENABLE ROW LEVEL SECURITY;

-- Templates: Everyone can read active templates
CREATE POLICY "view_active_templates"
ON sample_data_templates FOR SELECT
USING (is_active = true);

-- Instances: Users can only see their own instances
CREATE POLICY "view_own_sample_instances"
ON sample_data_instances FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Instances: Users can insert their own instances
CREATE POLICY "insert_own_sample_instances"
ON sample_data_instances FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Instances: Users can update their own instances (for removal)
CREATE POLICY "update_own_sample_instances"
ON sample_data_instances FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- SEED THEMED TEMPLATES
-- ============================================================================

INSERT INTO sample_data_templates (slug, name_en, name_ar, description_en, description_ar, icon, color, sort_order, template_data) VALUES

-- Trade Relations Template
('trade-relations',
 'Trade Relations',
 'العلاقات التجارية',
 'Sample data focused on bilateral trade agreements, economic partnerships, and commercial diplomacy with major trading partners.',
 'بيانات نموذجية تركز على اتفاقيات التجارة الثنائية والشراكات الاقتصادية والدبلوماسية التجارية مع الشركاء التجاريين الرئيسيين.',
 'trending-up',
 'emerald',
 1,
 '{
   "dossiers": [
     {
       "name_en": "China Trade Partnership",
       "name_ar": "الشراكة التجارية مع الصين",
       "type": "country",
       "status": "active",
       "sensitivity_level": "medium",
       "summary_en": "Strategic trade partnership with China covering energy, infrastructure, and technology sectors. Annual bilateral trade exceeds $50 billion with focus on Vision 2030 alignment.",
       "summary_ar": "شراكة تجارية استراتيجية مع الصين تشمل قطاعات الطاقة والبنية التحتية والتكنولوجيا. تتجاوز التجارة الثنائية السنوية 50 مليار دولار مع التركيز على التوافق مع رؤية 2030.",
       "tags": ["trade", "energy", "infrastructure", "strategic-partner"]
     },
     {
       "name_en": "Japan Economic Forum",
       "name_ar": "المنتدى الاقتصادي الياباني",
       "type": "forum",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Annual economic forum fostering Japanese investment in Saudi Arabia. Focus areas include automotive, renewable energy, and smart city technologies.",
       "summary_ar": "منتدى اقتصادي سنوي لتعزيز الاستثمار الياباني في المملكة العربية السعودية. تشمل مجالات التركيز السيارات والطاقة المتجددة وتقنيات المدن الذكية.",
       "tags": ["forum", "investment", "japan", "annual"]
     },
     {
       "name_en": "World Trade Organization",
       "name_ar": "منظمة التجارة العالمية",
       "type": "organization",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Multilateral engagement with WTO on trade policies, dispute resolution, and market access negotiations.",
       "summary_ar": "المشاركة متعددة الأطراف مع منظمة التجارة العالمية بشأن السياسات التجارية وحل النزاعات ومفاوضات الوصول إلى الأسواق.",
       "tags": ["multilateral", "trade-policy", "wto"]
     },
     {
       "name_en": "Korea Trade Mission",
       "name_ar": "البعثة التجارية الكورية",
       "type": "engagement",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Ongoing trade mission coordination with South Korea focusing on electronics, shipbuilding, and construction sectors.",
       "summary_ar": "تنسيق البعثة التجارية المستمرة مع كوريا الجنوبية مع التركيز على قطاعات الإلكترونيات وبناء السفن والبناء.",
       "tags": ["mission", "korea", "electronics", "construction"]
     }
   ],
   "relationships": [
     {"from_index": 0, "to_index": 2, "type": "member_of", "notes_en": "Active WTO member state", "notes_ar": "عضو نشط في منظمة التجارة العالمية"},
     {"from_index": 0, "to_index": 1, "type": "participates_in", "notes_en": "Key participant in annual forum", "notes_ar": "مشارك رئيسي في المنتدى السنوي"}
   ],
   "contacts": [
     {"name": "Dr. Wei Chen", "role": "Trade Counselor", "organization": "Chinese Embassy", "email": "wei.chen@example.com"},
     {"name": "Yamamoto Kenji", "role": "Investment Director", "organization": "JETRO", "email": "k.yamamoto@example.com"},
     {"name": "Park Min-jun", "role": "Commercial Attaché", "organization": "Korean Embassy", "email": "m.park@example.com"}
   ],
   "events": [
     {"title_en": "China-Saudi Trade Summit 2026", "title_ar": "قمة التجارة الصينية السعودية 2026", "date": "2026-03-15", "type": "summit"},
     {"title_en": "Japan Investment Forum Q2", "title_ar": "منتدى الاستثمار الياباني الربع الثاني", "date": "2026-04-20", "type": "forum"},
     {"title_en": "WTO Ministerial Review", "title_ar": "المراجعة الوزارية لمنظمة التجارة العالمية", "date": "2026-06-10", "type": "meeting"}
   ]
 }'::jsonb),

-- Cultural Exchange Template
('cultural-exchange',
 'Cultural Exchange',
 'التبادل الثقافي',
 'Sample data showcasing cultural diplomacy initiatives, educational partnerships, and heritage preservation projects.',
 'بيانات نموذجية تعرض مبادرات الدبلوماسية الثقافية والشراكات التعليمية ومشاريع الحفاظ على التراث.',
 'palette',
 'purple',
 2,
 '{
   "dossiers": [
     {
       "name_en": "UNESCO Cultural Heritage Program",
       "name_ar": "برنامج التراث الثقافي لليونسكو",
       "type": "organization",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Collaboration with UNESCO on World Heritage Site nominations, cultural preservation, and intangible heritage documentation.",
       "summary_ar": "التعاون مع اليونسكو في ترشيحات مواقع التراث العالمي والحفاظ على الثقافة وتوثيق التراث غير المادي.",
       "tags": ["unesco", "heritage", "preservation", "culture"]
     },
     {
       "name_en": "France Cultural Dialogue",
       "name_ar": "الحوار الثقافي الفرنسي",
       "type": "country",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Bilateral cultural exchange with France including museum partnerships, archaeological cooperation, and artistic exchanges.",
       "summary_ar": "التبادل الثقافي الثنائي مع فرنسا بما في ذلك شراكات المتاحف والتعاون الأثري والتبادلات الفنية.",
       "tags": ["france", "museums", "archaeology", "arts"]
     },
     {
       "name_en": "Education Exchange Forum",
       "name_ar": "منتدى التبادل التعليمي",
       "type": "forum",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Annual forum bringing together education ministries, universities, and cultural institutions for academic exchange programs.",
       "summary_ar": "منتدى سنوي يجمع وزارات التعليم والجامعات والمؤسسات الثقافية لبرامج التبادل الأكاديمي.",
       "tags": ["education", "universities", "exchange", "annual"]
     },
     {
       "name_en": "AlUla Development Authority",
       "name_ar": "هيئة تطوير العلا",
       "type": "organization",
       "status": "active",
       "sensitivity_level": "medium",
       "summary_en": "Strategic partnership for AlUla development including tourism, heritage preservation, and sustainable development.",
       "summary_ar": "شراكة استراتيجية لتطوير العلا بما في ذلك السياحة والحفاظ على التراث والتنمية المستدامة.",
       "tags": ["alula", "tourism", "development", "heritage"]
     }
   ],
   "relationships": [
     {"from_index": 0, "to_index": 3, "type": "partners_with", "notes_en": "UNESCO advisory role for AlUla", "notes_ar": "دور استشاري لليونسكو في العلا"},
     {"from_index": 1, "to_index": 3, "type": "collaborates_with", "notes_en": "French archaeological team collaboration", "notes_ar": "تعاون الفريق الأثري الفرنسي"}
   ],
   "contacts": [
     {"name": "Marie Dubois", "role": "Cultural Attaché", "organization": "French Embassy", "email": "m.dubois@example.com"},
     {"name": "Dr. Ahmed Al-Rashid", "role": "Heritage Director", "organization": "AlUla Authority", "email": "a.rashid@example.com"},
     {"name": "Prof. Elena Martinez", "role": "Academic Coordinator", "organization": "UNESCO", "email": "e.martinez@example.com"}
   ],
   "events": [
     {"title_en": "AlUla Arts Festival 2026", "title_ar": "مهرجان العلا للفنون 2026", "date": "2026-02-10", "type": "cultural"},
     {"title_en": "Saudi-French Cultural Week", "title_ar": "الأسبوع الثقافي السعودي الفرنسي", "date": "2026-05-01", "type": "cultural"},
     {"title_en": "UNESCO Heritage Committee", "title_ar": "لجنة التراث التابعة لليونسكو", "date": "2026-07-15", "type": "meeting"}
   ]
 }'::jsonb),

-- Security Cooperation Template
('security-cooperation',
 'Security Cooperation',
 'التعاون الأمني',
 'Sample data for security partnerships, defense agreements, and regional stability initiatives with allied nations.',
 'بيانات نموذجية للشراكات الأمنية واتفاقيات الدفاع ومبادرات الاستقرار الإقليمي مع الدول الحليفة.',
 'shield',
 'red',
 3,
 '{
   "dossiers": [
     {
       "name_en": "GCC Security Council",
       "name_ar": "مجلس الأمن الخليجي",
       "type": "organization",
       "status": "active",
       "sensitivity_level": "high",
       "summary_en": "Regional security coordination through the Gulf Cooperation Council including joint military exercises, intelligence sharing, and counter-terrorism cooperation.",
       "summary_ar": "التنسيق الأمني الإقليمي من خلال مجلس التعاون الخليجي بما في ذلك التدريبات العسكرية المشتركة وتبادل المعلومات الاستخباراتية ومكافحة الإرهاب.",
       "tags": ["gcc", "security", "military", "regional"]
     },
     {
       "name_en": "United States Defense Partnership",
       "name_ar": "شراكة الدفاع الأمريكية",
       "type": "country",
       "status": "active",
       "sensitivity_level": "high",
       "summary_en": "Strategic defense partnership with the United States covering military cooperation, arms agreements, and joint training programs.",
       "summary_ar": "شراكة دفاعية استراتيجية مع الولايات المتحدة تشمل التعاون العسكري واتفاقيات الأسلحة وبرامج التدريب المشتركة.",
       "tags": ["usa", "defense", "military", "strategic"]
     },
     {
       "name_en": "Counter-Terrorism Forum",
       "name_ar": "منتدى مكافحة الإرهاب",
       "type": "forum",
       "status": "active",
       "sensitivity_level": "high",
       "summary_en": "International forum for counter-terrorism strategies, intelligence sharing protocols, and joint operations coordination.",
       "summary_ar": "منتدى دولي لاستراتيجيات مكافحة الإرهاب وبروتوكولات تبادل المعلومات الاستخباراتية وتنسيق العمليات المشتركة.",
       "tags": ["counter-terrorism", "intelligence", "security"]
     },
     {
       "name_en": "UK Defense Consultations",
       "name_ar": "المشاورات الدفاعية البريطانية",
       "type": "engagement",
       "status": "active",
       "sensitivity_level": "medium",
       "summary_en": "Ongoing defense consultations with the United Kingdom on cybersecurity, naval cooperation, and defense industry partnerships.",
       "summary_ar": "مشاورات دفاعية مستمرة مع المملكة المتحدة حول الأمن السيبراني والتعاون البحري وشراكات صناعة الدفاع.",
       "tags": ["uk", "cybersecurity", "naval", "defense"]
     }
   ],
   "relationships": [
     {"from_index": 0, "to_index": 2, "type": "member_of", "notes_en": "GCC member participation in forum", "notes_ar": "مشاركة أعضاء مجلس التعاون الخليجي في المنتدى"},
     {"from_index": 1, "to_index": 0, "type": "partners_with", "notes_en": "US-GCC security framework", "notes_ar": "الإطار الأمني الأمريكي الخليجي"}
   ],
   "contacts": [
     {"name": "Gen. James Miller", "role": "Defense Attaché", "organization": "US Embassy", "email": "j.miller@example.com"},
     {"name": "Col. Richard Thompson", "role": "Military Liaison", "organization": "UK Embassy", "email": "r.thompson@example.com"},
     {"name": "Maj. Gen. Khalid Al-Otaibi", "role": "GCC Coordinator", "organization": "GCC Secretariat", "email": "k.otaibi@example.com"}
   ],
   "events": [
     {"title_en": "GCC Joint Military Exercise", "title_ar": "التمرين العسكري المشترك لدول الخليج", "date": "2026-04-01", "type": "military"},
     {"title_en": "US-Saudi Defense Talks", "title_ar": "المحادثات الدفاعية السعودية الأمريكية", "date": "2026-05-15", "type": "meeting"},
     {"title_en": "Counter-Terrorism Summit", "title_ar": "قمة مكافحة الإرهاب", "date": "2026-09-20", "type": "summit"}
   ]
 }'::jsonb),

-- Diplomatic Relations Template
('diplomatic-relations',
 'Diplomatic Relations',
 'العلاقات الدبلوماسية',
 'Comprehensive diplomatic relations sample including embassies, consulates, bilateral agreements, and international organizations.',
 'عينة شاملة للعلاقات الدبلوماسية تشمل السفارات والقنصليات والاتفاقيات الثنائية والمنظمات الدولية.',
 'globe',
 'blue',
 4,
 '{
   "dossiers": [
     {
       "name_en": "United Nations General Assembly",
       "name_ar": "الجمعية العامة للأمم المتحدة",
       "type": "organization",
       "status": "active",
       "sensitivity_level": "medium",
       "summary_en": "Engagement with the UN General Assembly on global governance, sustainable development goals, and multilateral diplomacy.",
       "summary_ar": "المشاركة في الجمعية العامة للأمم المتحدة بشأن الحوكمة العالمية وأهداف التنمية المستدامة والدبلوماسية متعددة الأطراف.",
       "tags": ["un", "multilateral", "sdg", "global"]
     },
     {
       "name_en": "Germany Bilateral Relations",
       "name_ar": "العلاقات الثنائية مع ألمانيا",
       "type": "country",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Comprehensive bilateral relations with Germany covering trade, technology transfer, education, and renewable energy cooperation.",
       "summary_ar": "علاقات ثنائية شاملة مع ألمانيا تشمل التجارة ونقل التكنولوجيا والتعليم والتعاون في مجال الطاقة المتجددة.",
       "tags": ["germany", "bilateral", "technology", "energy"]
     },
     {
       "name_en": "Arab League Coordination",
       "name_ar": "تنسيق جامعة الدول العربية",
       "type": "organization",
       "status": "active",
       "sensitivity_level": "medium",
       "summary_en": "Regional coordination through the Arab League on political, economic, and social issues affecting the Arab world.",
       "summary_ar": "التنسيق الإقليمي من خلال جامعة الدول العربية بشأن القضايا السياسية والاقتصادية والاجتماعية التي تؤثر على العالم العربي.",
       "tags": ["arab-league", "regional", "coordination"]
     },
     {
       "name_en": "G20 Summit Preparations",
       "name_ar": "الاستعدادات لقمة العشرين",
       "type": "forum",
       "status": "active",
       "sensitivity_level": "medium",
       "summary_en": "Ongoing preparations and follow-up activities related to G20 summit participation and presidency responsibilities.",
       "summary_ar": "الاستعدادات المستمرة والأنشطة التتبعية المتعلقة بالمشاركة في قمة العشرين ومسؤوليات الرئاسة.",
       "tags": ["g20", "summit", "global-governance"]
     },
     {
       "name_en": "India Strategic Partnership",
       "name_ar": "الشراكة الاستراتيجية مع الهند",
       "type": "country",
       "status": "active",
       "sensitivity_level": "low",
       "summary_en": "Growing strategic partnership with India focusing on energy security, technology, labor mobility, and investment cooperation.",
       "summary_ar": "شراكة استراتيجية متنامية مع الهند تركز على أمن الطاقة والتكنولوجيا وتنقل العمالة والتعاون الاستثماري.",
       "tags": ["india", "strategic", "energy", "investment"]
     }
   ],
   "relationships": [
     {"from_index": 0, "to_index": 3, "type": "member_of", "notes_en": "G20 under UN framework", "notes_ar": "مجموعة العشرين ضمن إطار الأمم المتحدة"},
     {"from_index": 2, "to_index": 0, "type": "collaborates_with", "notes_en": "Arab League-UN coordination", "notes_ar": "تنسيق جامعة الدول العربية والأمم المتحدة"},
     {"from_index": 1, "to_index": 3, "type": "participates_in", "notes_en": "Germany G20 participation", "notes_ar": "مشاركة ألمانيا في مجموعة العشرين"}
   ],
   "contacts": [
     {"name": "Ambassador Hans Schmidt", "role": "Ambassador", "organization": "German Embassy", "email": "h.schmidt@example.com"},
     {"name": "Dr. Priya Sharma", "role": "Deputy Chief of Mission", "organization": "Indian Embassy", "email": "p.sharma@example.com"},
     {"name": "Dr. Ahmed Aboul Gheit", "role": "Secretary General", "organization": "Arab League", "email": "a.gheit@example.com"},
     {"name": "Maria Rodriguez", "role": "UN Liaison Officer", "organization": "UN Headquarters", "email": "m.rodriguez@example.com"}
   ],
   "events": [
     {"title_en": "UN General Assembly 81st Session", "title_ar": "الدورة 81 للجمعية العامة للأمم المتحدة", "date": "2026-09-15", "type": "assembly"},
     {"title_en": "G20 Finance Ministers Meeting", "title_ar": "اجتماع وزراء مالية مجموعة العشرين", "date": "2026-06-20", "type": "meeting"},
     {"title_en": "Arab League Summit", "title_ar": "القمة العربية", "date": "2026-03-22", "type": "summit"},
     {"title_en": "Saudi-German Economic Dialogue", "title_ar": "الحوار الاقتصادي السعودي الألماني", "date": "2026-04-10", "type": "dialogue"}
   ]
 }'::jsonb)

ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  description_en = EXCLUDED.description_en,
  description_ar = EXCLUDED.description_ar,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  template_data = EXCLUDED.template_data,
  updated_at = NOW();

-- ============================================================================
-- HELPER FUNCTION: Check if user has sample data
-- ============================================================================

CREATE OR REPLACE FUNCTION has_active_sample_data(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sample_data_instances
    WHERE user_id = p_user_id
    AND removed_at IS NULL
  );
$$;

-- ============================================================================
-- HELPER FUNCTION: Get user's active sample data info
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sample_data_info(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  instance_id UUID,
  template_slug TEXT,
  template_name_en TEXT,
  template_name_ar TEXT,
  populated_at TIMESTAMP WITH TIME ZONE,
  dossier_count INTEGER,
  relationship_count INTEGER,
  event_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    i.id AS instance_id,
    t.slug AS template_slug,
    t.name_en AS template_name_en,
    t.name_ar AS template_name_ar,
    i.populated_at,
    array_length(i.created_dossier_ids, 1) AS dossier_count,
    array_length(i.created_relationship_ids, 1) AS relationship_count,
    array_length(i.created_event_ids, 1) AS event_count
  FROM sample_data_instances i
  JOIN sample_data_templates t ON t.id = i.template_id
  WHERE i.user_id = p_user_id
  AND i.removed_at IS NULL;
$$;

-- Comments
COMMENT ON TABLE sample_data_templates IS 'Predefined templates for populating empty workspaces with sample data';
COMMENT ON TABLE sample_data_instances IS 'Tracks sample data created per user for easy removal';
COMMENT ON FUNCTION has_active_sample_data IS 'Check if user has any active sample data populated';
COMMENT ON FUNCTION get_sample_data_info IS 'Get information about user active sample data instances';
