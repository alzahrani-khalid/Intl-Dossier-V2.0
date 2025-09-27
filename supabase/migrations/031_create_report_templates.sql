-- Migration: Create Report Templates table
-- Purpose: Report generation templates (FR-026 to FR-031)
-- Feature: 004-refine-specification-to Phase 3.4

-- Create report_templates table
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    
    -- Report types (FR-026, FR-027, FR-028)
    report_type TEXT NOT NULL CHECK (report_type IN ('executive', 'analytical', 'compliance')),
    
    -- Content configuration
    include_metrics BOOLEAN NOT NULL DEFAULT true,
    include_trends BOOLEAN NOT NULL DEFAULT true,
    include_charts BOOLEAN NOT NULL DEFAULT true,
    include_audit_trail BOOLEAN NOT NULL DEFAULT false,
    
    -- Export formats (FR-029)
    supported_formats TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(supported_formats, 1) > 0),
    
    -- Scheduling (FR-030)
    schedule_enabled BOOLEAN NOT NULL DEFAULT false,
    schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
    schedule_time TEXT, -- Cron expression
    
    -- Branding (FR-031)
    organization_branding JSONB DEFAULT '{}',
    
    -- Template content
    template_content TEXT NOT NULL,
    template_content_ar TEXT,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient lookups
CREATE INDEX idx_report_templates_type ON report_templates(report_type);
CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);
CREATE INDEX idx_report_templates_schedule ON report_templates(schedule_enabled, schedule_frequency) WHERE schedule_enabled = true;
CREATE INDEX idx_report_templates_formats ON report_templates USING gin(supported_formats);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_report_templates_updated_at();

-- Create function to validate supported formats
CREATE OR REPLACE FUNCTION validate_supported_formats()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if supported_formats contains valid values
    IF NOT (NEW.supported_formats <@ ARRAY['pdf', 'excel', 'csv', 'json']) THEN
        RAISE EXCEPTION 'supported_formats must contain only: pdf, excel, csv, json';
    END IF;
    
    -- Check if at least one format is supported
    IF array_length(NEW.supported_formats, 1) = 0 THEN
        RAISE EXCEPTION 'At least one supported format must be specified';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supported formats validation
CREATE TRIGGER trigger_validate_supported_formats
    BEFORE INSERT OR UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION validate_supported_formats();

-- Create function to validate schedule configuration
CREATE OR REPLACE FUNCTION validate_schedule_config()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.schedule_enabled = true THEN
        -- Check if schedule_frequency is provided
        IF NEW.schedule_frequency IS NULL THEN
            RAISE EXCEPTION 'schedule_frequency must be provided when schedule_enabled is true';
        END IF;
        
        -- Check if schedule_time is provided and valid cron expression
        IF NEW.schedule_time IS NULL THEN
            RAISE EXCEPTION 'schedule_time must be provided when schedule_enabled is true';
        END IF;
        
        -- Basic cron validation (5 fields: minute hour day month weekday)
        IF NOT (NEW.schedule_time ~ '^(\*|[0-5]?\d) (\*|[01]?\d|2[0-3]) (\*|[012]?\d|3[01]) (\*|[01]?\d) (\*|[0-6])$') THEN
            RAISE EXCEPTION 'schedule_time must be a valid cron expression (5 fields)';
        END IF;
    ELSE
        -- Clear schedule fields when disabled
        NEW.schedule_frequency = NULL;
        NEW.schedule_time = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for schedule validation
CREATE TRIGGER trigger_validate_schedule_config
    BEFORE INSERT OR UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION validate_schedule_config();

-- Create function to validate organization branding
CREATE OR REPLACE FUNCTION validate_organization_branding()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_branding IS NOT NULL THEN
        -- Check if organization_branding has valid structure
        IF NOT (NEW.organization_branding ? 'logo_url' OR NEW.organization_branding ? 'primary_color' OR NEW.organization_branding ? 'secondary_color' OR NEW.organization_branding ? 'font_family') THEN
            RAISE EXCEPTION 'organization_branding must contain at least one of: logo_url, primary_color, secondary_color, font_family';
        END IF;
        
        -- Validate color format if provided
        IF NEW.organization_branding ? 'primary_color' THEN
            IF NOT (NEW.organization_branding->>'primary_color' ~ '^#[0-9A-Fa-f]{6}$') THEN
                RAISE EXCEPTION 'primary_color must be a valid hex color (e.g., #FF0000)';
            END IF;
        END IF;
        
        IF NEW.organization_branding ? 'secondary_color' THEN
            IF NOT (NEW.organization_branding->>'secondary_color' ~ '^#[0-9A-Fa-f]{6}$') THEN
                RAISE EXCEPTION 'secondary_color must be a valid hex color (e.g., #FF0000)';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organization branding validation
CREATE TRIGGER trigger_validate_organization_branding
    BEFORE INSERT OR UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION validate_organization_branding();

-- Insert default report templates
INSERT INTO report_templates (name, name_ar, report_type, include_metrics, include_trends, include_charts, include_audit_trail, supported_formats, schedule_enabled, organization_branding, template_content, created_by) VALUES
('Executive Summary', 'الملخص التنفيذي', 'executive', true, true, true, false, ARRAY['pdf', 'excel'], false, '{"primary_color": "#1e40af", "secondary_color": "#3b82f6"}', 'Executive Summary Template Content', (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1)),
('Analytical Report', 'التقرير التحليلي', 'analytical', true, true, true, false, ARRAY['pdf', 'excel', 'csv'], false, '{"primary_color": "#1e40af", "secondary_color": "#3b82f6"}', 'Analytical Report Template Content', (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1)),
('Compliance Report', 'تقرير الامتثال', 'compliance', true, false, false, true, ARRAY['pdf', 'json'], false, '{"primary_color": "#1e40af", "secondary_color": "#3b82f6"}', 'Compliance Report Template Content', (SELECT id FROM users WHERE email = 'admin@gastat.gov.sa' LIMIT 1));

-- Add comments
COMMENT ON TABLE report_templates IS 'Report generation templates with scheduling and branding options';
COMMENT ON COLUMN report_templates.report_type IS 'Type of report: executive, analytical, or compliance';
COMMENT ON COLUMN report_templates.include_metrics IS 'Whether to include key metrics in the report';
COMMENT ON COLUMN report_templates.include_trends IS 'Whether to include trend analysis in the report';
COMMENT ON COLUMN report_templates.include_charts IS 'Whether to include visualizations in the report';
COMMENT ON COLUMN report_templates.include_audit_trail IS 'Whether to include audit trail for compliance reports';
COMMENT ON COLUMN report_templates.supported_formats IS 'Array of supported export formats: pdf, excel, csv, json';
COMMENT ON COLUMN report_templates.schedule_enabled IS 'Whether scheduled generation is enabled';
COMMENT ON COLUMN report_templates.schedule_frequency IS 'Frequency of scheduled generation: daily, weekly, monthly';
COMMENT ON COLUMN report_templates.schedule_time IS 'Cron expression for scheduled generation';
COMMENT ON COLUMN report_templates.organization_branding IS 'JSONB object with branding configuration';
COMMENT ON COLUMN report_templates.template_content IS 'Template markup/content for report generation';
COMMENT ON COLUMN report_templates.template_content_ar IS 'Arabic template content';
