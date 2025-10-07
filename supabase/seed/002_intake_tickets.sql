-- Seed data for intake_tickets
-- Creates sample tickets for testing the Front Door intake system

-- Get a sample user ID (you'll need to replace with actual auth.users ID)
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Try to get the first user, or use a placeholder UUID
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    IF sample_user_id IS NULL THEN
        sample_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;

    -- Insert sample engagement request tickets
    INSERT INTO intake_tickets (
        request_type,
        title,
        title_ar,
        description,
        description_ar,
        sensitivity,
        urgency,
        priority,
        status,
        created_by,
        updated_by,
        submitted_at,
        type_specific_fields
    ) VALUES
    (
        'engagement',
        'Ministry of Finance Budget Discussion',
        'مناقشة ميزانية وزارة المالية',
        'Request for engagement meeting to discuss the annual budget allocation and statistical data requirements for fiscal year 2025-2026.',
        'طلب اجتماع للمشاركة لمناقشة تخصيص الميزانية السنوية ومتطلبات البيانات الإحصائية للسنة المالية 2025-2026.',
        'internal',
        'high',
        'high',
        'submitted',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '2 hours',
        '{"preferred_date": "2025-10-15", "attendees_count": 8, "venue": "GASTAT Main Office"}'::jsonb
    ),
    (
        'engagement',
        'G20 Statistical Coordination Meeting',
        'اجتماع التنسيق الإحصائي لمجموعة العشرين',
        'International engagement for G20 statistical harmonization initiatives and data sharing protocols.',
        'مشاركة دولية لمبادرات التنسيق الإحصائي لمجموعة العشرين وبروتوكولات مشاركة البيانات.',
        'confidential',
        'medium',
        'high',
        'triaged',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '1 day',
        '{"preferred_date": "2025-11-20", "attendees_count": 15, "venue": "Virtual"}'::jsonb
    ),
    
    -- Insert sample position request tickets
    (
        'position',
        'Saudi Arabia Economic Outlook Q4 2025',
        'التوقعات الاقتصادية للمملكة العربية السعودية للربع الرابع 2025',
        'Position paper on economic indicators and projections for Q4 2025, including GDP growth, inflation, and employment statistics.',
        'ورقة موقف حول المؤشرات الاقتصادية والتوقعات للربع الرابع من عام 2025، بما في ذلك نمو الناتج المحلي الإجمالي والتضخم وإحصاءات التوظيف.',
        'internal',
        'medium',
        'medium',
        'assigned',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '3 days',
        '{"deadline": "2025-10-30", "target_audience": "Ministry of Economy", "page_count": 12}'::jsonb
    ),
    (
        'position',
        'Digital Transformation Impact Assessment',
        'تقييم أثر التحول الرقمي',
        'Analysis of digital transformation initiatives impact on national statistics collection and dissemination.',
        'تحليل تأثير مبادرات التحول الرقمي على جمع ونشر الإحصاءات الوطنية.',
        'internal',
        'low',
        'medium',
        'draft',
        sample_user_id,
        sample_user_id,
        NULL,
        '{"deadline": "2025-12-15", "target_audience": "Internal", "page_count": 8}'::jsonb
    ),
    
    -- Insert sample MOU/action request tickets
    (
        'mou_action',
        'Data Sharing Agreement with Central Bank',
        'اتفاقية تبادل البيانات مع البنك المركزي',
        'Review and update the existing MOU with the Central Bank regarding financial statistics data exchange protocols.',
        'مراجعة وتحديث مذكرة التفاهم الحالية مع البنك المركزي بخصوص بروتوكولات تبادل بيانات الإحصاءات المالية.',
        'confidential',
        'high',
        'high',
        'in_progress',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '5 days',
        '{"partner_organization": "Saudi Central Bank", "renewal_date": "2025-12-31", "data_categories": ["Financial", "Monetary"]}'::jsonb
    ),
    (
        'mou_action',
        'Technical Cooperation with UAE Statistics Center',
        'التعاون الفني مع مركز الإحصاء بالإمارات',
        'Establish new MOU for technical cooperation and capacity building initiatives with UAE Federal Competitiveness and Statistics Center.',
        'إنشاء مذكرة تفاهم جديدة للتعاون الفني ومبادرات بناء القدرات مع المركز الاتحادي للتنافسية والإحصاء بالإمارات.',
        'internal',
        'medium',
        'medium',
        'submitted',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '1 day',
        '{"partner_organization": "UAE FCSC", "cooperation_areas": ["Methodology", "Training"], "duration_years": 3}'::jsonb
    ),
    
    -- Insert sample foresight request tickets
    (
        'foresight',
        'AI Integration in Statistical Production',
        'دمج الذكاء الاصطناعي في الإنتاج الإحصائي',
        'Foresight analysis on artificial intelligence and machine learning applications in statistical data collection and analysis by 2030.',
        'تحليل استشرافي حول تطبيقات الذكاء الاصطناعي والتعلم الآلي في جمع وتحليل البيانات الإحصائية بحلول عام 2030.',
        'internal',
        'low',
        'low',
        'submitted',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '6 hours',
        '{"horizon_years": 5, "focus_areas": ["AI", "Automation", "Data Quality"], "stakeholders": ["IT Department", "Research Unit"]}'::jsonb
    ),
    (
        'foresight',
        'Population Trends and Census Methodology 2035',
        'اتجاهات السكان ومنهجية التعداد 2035',
        'Long-term foresight on population demographic shifts and census methodology evolution for Saudi Arabia.',
        'استشراف طويل الأمد حول التحولات الديموغرافية للسكان وتطور منهجية التعداد للمملكة العربية السعودية.',
        'confidential',
        'medium',
        'medium',
        'triaged',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '2 days',
        '{"horizon_years": 10, "focus_areas": ["Demographics", "Technology", "Methodology"], "stakeholders": ["Population Department", "Planning Unit"]}'::jsonb
    );

    -- Insert some closed/resolved tickets
    INSERT INTO intake_tickets (
        request_type,
        title,
        title_ar,
        description,
        description_ar,
        sensitivity,
        urgency,
        priority,
        status,
        created_by,
        updated_by,
        submitted_at,
        resolved_at,
        closed_at,
        resolution,
        resolution_ar,
        type_specific_fields
    ) VALUES
    (
        'engagement',
        'Q3 2025 Economic Indicators Briefing',
        'إحاطة مؤشرات اقتصادية للربع الثالث 2025',
        'Completed briefing session on Q3 economic indicators for senior management.',
        'جلسة إحاطة مكتملة حول مؤشرات اقتصادية للربع الثالث للإدارة العليا.',
        'internal',
        'high',
        'high',
        'closed',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '8 days',
        'Successfully conducted briefing session with all stakeholders. Presentation materials delivered and archived.',
        'تم إجراء جلسة الإحاطة بنجاح مع جميع أصحاب المصلحة. تم تسليم مواد العرض وأرشفتها.',
        '{"preferred_date": "2025-09-15", "attendees_count": 12, "venue": "GASTAT Conference Room A"}'::jsonb
    ),
    (
        'position',
        'Vision 2030 Statistical Framework',
        'الإطار الإحصائي لرؤية 2030',
        'Position paper on statistical indicators alignment with Vision 2030 goals - completed and delivered.',
        'ورقة موقف حول مواءمة المؤشرات الإحصائية مع أهداف رؤية 2030 - مكتملة ومسلمة.',
        'confidential',
        'high',
        'high',
        'closed',
        sample_user_id,
        sample_user_id,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '10 days',
        'Position paper finalized and submitted to the Council of Economic and Development Affairs.',
        'تم الانتهاء من ورقة الموقف وتقديمها لمجلس الشؤون الاقتصادية والتنمية.',
        '{"deadline": "2025-09-20", "target_audience": "CEDA", "page_count": 25}'::jsonb
    );

END $$;
