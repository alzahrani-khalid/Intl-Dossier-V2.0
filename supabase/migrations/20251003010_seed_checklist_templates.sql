-- Migration: Seed checklist templates
-- Feature: 014-full-assignment-detail
-- Task: T011

-- Insert common checklist templates with bilingual content

-- Template 1: Dossier Review
INSERT INTO assignment_checklist_templates (
  name_en,
  name_ar,
  description_en,
  description_ar,
  applicable_work_types,
  items_json
) VALUES (
  'Dossier Review',
  'مراجعة الملف',
  'Standard checklist for reviewing dossiers',
  'قائمة التحقق القياسية لمراجعة الملفات',
  ARRAY['dossier'],
  '[
    {
      "text_en": "Review all attached documents",
      "text_ar": "مراجعة جميع المستندات المرفقة",
      "sequence": 1
    },
    {
      "text_en": "Verify data accuracy and completeness",
      "text_ar": "التحقق من دقة واكتمال البيانات",
      "sequence": 2
    },
    {
      "text_en": "Check for missing information",
      "text_ar": "التحقق من المعلومات المفقودة",
      "sequence": 3
    },
    {
      "text_en": "Prepare initial brief/summary",
      "text_ar": "إعداد الملخص الأولي",
      "sequence": 4
    },
    {
      "text_en": "Request clarifications if needed",
      "text_ar": "طلب التوضيحات إذا لزم الأمر",
      "sequence": 5
    }
  ]'::JSONB
) ON CONFLICT DO NOTHING;

-- Template 2: Ticket Processing
INSERT INTO assignment_checklist_templates (
  name_en,
  name_ar,
  description_en,
  description_ar,
  applicable_work_types,
  items_json
) VALUES (
  'Ticket Processing',
  'معالجة التذكرة',
  'Standard workflow for intake ticket processing',
  'سير العمل القياسي لمعالجة تذاكر الاستقبال',
  ARRAY['ticket'],
  '[
    {
      "text_en": "Acknowledge receipt of request",
      "text_ar": "الإقرار باستلام الطلب",
      "sequence": 1
    },
    {
      "text_en": "Classify and prioritize ticket",
      "text_ar": "تصنيف التذكرة وتحديد الأولوية",
      "sequence": 2
    },
    {
      "text_en": "Gather required information",
      "text_ar": "جمع المعلومات المطلوبة",
      "sequence": 3
    },
    {
      "text_en": "Process/action the request",
      "text_ar": "معالجة/تنفيذ الطلب",
      "sequence": 4
    },
    {
      "text_en": "Notify requester of outcome",
      "text_ar": "إخطار مقدم الطلب بالنتيجة",
      "sequence": 5
    },
    {
      "text_en": "Close ticket and document resolution",
      "text_ar": "إغلاق التذكرة وتوثيق الحل",
      "sequence": 6
    }
  ]'::JSONB
) ON CONFLICT DO NOTHING;

-- Template 3: Engagement Task (for multi-task engagements)
INSERT INTO assignment_checklist_templates (
  name_en,
  name_ar,
  description_en,
  description_ar,
  applicable_work_types,
  items_json
) VALUES (
  'Engagement Task',
  'مهمة الارتباط',
  'Checklist for tasks within multi-step engagements',
  'قائمة التحقق للمهام ضمن الارتباطات متعددة الخطوات',
  ARRAY['dossier', 'ticket'],
  '[
    {
      "text_en": "Review engagement context and dependencies",
      "text_ar": "مراجعة سياق الارتباط والتبعيات",
      "sequence": 1
    },
    {
      "text_en": "Coordinate with other task assignees",
      "text_ar": "التنسيق مع المكلفين بالمهام الأخرى",
      "sequence": 2
    },
    {
      "text_en": "Complete assigned deliverables",
      "text_ar": "إكمال المخرجات المحددة",
      "sequence": 3
    },
    {
      "text_en": "Update engagement progress",
      "text_ar": "تحديث تقدم الارتباط",
      "sequence": 4
    }
  ]'::JSONB
) ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE assignment_checklist_templates IS
  'Seeded with 3 common templates: Dossier Review, Ticket Processing, Engagement Task';
