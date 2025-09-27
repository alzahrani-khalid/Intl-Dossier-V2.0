-- Create intelligence_sources table
CREATE TABLE IF NOT EXISTS intelligence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('rss', 'api', 'web', 'email')),
  url TEXT,
  api_config JSONB,
  scanning_frequency VARCHAR(20) NOT NULL CHECK (scanning_frequency IN ('hourly', 'daily', 'weekly')),
  keywords TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  reliability_score INTEGER NOT NULL DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  last_scanned_at TIMESTAMPTZ,
  next_scan_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure URL is provided for non-email sources
  CONSTRAINT url_required CHECK (
    type = 'email' OR url IS NOT NULL
  ),
  -- Ensure API config for API sources
  CONSTRAINT api_config_required CHECK (
    type != 'api' OR api_config IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_intelligence_sources_type ON intelligence_sources(type) WHERE active = TRUE;
CREATE INDEX idx_intelligence_sources_next_scan ON intelligence_sources(next_scan_at) WHERE active = TRUE;
CREATE INDEX idx_intelligence_sources_keywords ON intelligence_sources USING gin(keywords);
CREATE INDEX idx_intelligence_sources_categories ON intelligence_sources USING gin(categories);
CREATE INDEX idx_intelligence_sources_reliability ON intelligence_sources(reliability_score DESC) WHERE active = TRUE;
CREATE INDEX idx_intelligence_sources_errors ON intelligence_sources(error_count) WHERE active = TRUE;

-- Enable RLS
ALTER TABLE intelligence_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY intelligence_sources_select ON intelligence_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'analyst', 'viewer')
    )
  );

CREATE POLICY intelligence_sources_insert ON intelligence_sources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY intelligence_sources_update ON intelligence_sources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY intelligence_sources_delete ON intelligence_sources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to calculate next scan time
CREATE OR REPLACE FUNCTION calculate_next_scan_time(
  p_frequency VARCHAR,
  p_last_scan TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'hourly' THEN p_last_scan + INTERVAL '1 hour'
    WHEN 'daily' THEN p_last_scan + INTERVAL '1 day'
    WHEN 'weekly' THEN p_last_scan + INTERVAL '1 week'
    ELSE p_last_scan + INTERVAL '1 day'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update source after scan
CREATE OR REPLACE FUNCTION update_source_after_scan(
  p_source_id UUID,
  p_success BOOLEAN,
  p_items_found INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_source intelligence_sources%ROWTYPE;
BEGIN
  SELECT * INTO v_source
  FROM intelligence_sources
  WHERE id = p_source_id;
  
  IF p_success THEN
    UPDATE intelligence_sources
    SET 
      last_scanned_at = NOW(),
      next_scan_at = calculate_next_scan_time(v_source.scanning_frequency, NOW()),
      error_count = 0,
      updated_at = NOW()
    WHERE id = p_source_id;
  ELSE
    UPDATE intelligence_sources
    SET 
      error_count = error_count + 1,
      active = CASE 
        WHEN error_count >= 4 THEN FALSE  -- Deactivate after 5 errors
        ELSE active
      END,
      updated_at = NOW()
    WHERE id = p_source_id;
    
    -- Log error
    INSERT INTO intelligence_source_errors (source_id, error_message, occurred_at)
    VALUES (p_source_id, p_error_message, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_intelligence_sources_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intelligence_sources_timestamp_trigger
  BEFORE UPDATE ON intelligence_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_sources_timestamp();

-- Error logging table
CREATE TABLE IF NOT EXISTS intelligence_source_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES intelligence_sources(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intelligence_source_errors_source ON intelligence_source_errors(source_id);
CREATE INDEX idx_intelligence_source_errors_time ON intelligence_source_errors(occurred_at DESC);