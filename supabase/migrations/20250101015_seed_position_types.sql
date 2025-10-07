-- Migration: Seed position types
-- Feature: 011-positions-talking-points
-- Task: T015

-- Insert Standard Position (3 approval stages)
INSERT INTO position_types (name_en, name_ar, approval_stages, default_chain_config)
VALUES (
  'Standard Position',
  'موقف قياسي',
  3,
  '{
    "stages": [
      {"order": 1, "role": "Section Chief"},
      {"order": 2, "role": "Department Director"},
      {"order": 3, "role": "Executive Committee"}
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert Critical Position (5 approval stages)
INSERT INTO position_types (name_en, name_ar, approval_stages, default_chain_config)
VALUES (
  'Critical Position',
  'موقف حرج',
  5,
  '{
    "stages": [
      {"order": 1, "role": "Section Chief"},
      {"order": 2, "role": "Department Director"},
      {"order": 3, "role": "Legal Review"},
      {"order": 4, "role": "Executive Committee"},
      {"order": 5, "role": "President/CEO"}
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT id, name_en, name_ar, approval_stages
FROM position_types
ORDER BY approval_stages;
