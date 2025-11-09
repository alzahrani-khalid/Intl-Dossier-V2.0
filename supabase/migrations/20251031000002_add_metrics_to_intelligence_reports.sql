-- Migration: Add metrics column to intelligence_reports table
-- Feature 029: Dynamic Country Intelligence
-- Purpose: Store parsed key indicators (GDP, inflation, etc.) in structured JSONB format

-- Add metrics JSONB column to store structured key indicators
ALTER TABLE intelligence_reports
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT NULL;

-- Add comment explaining the metrics column structure
COMMENT ON COLUMN intelligence_reports.metrics IS
'Structured key indicators parsed from intelligence analysis. Format varies by intelligence_type:
- economic: {"gdp_growth": "X.X%", "inflation_rate": "X.X%", "trade_balance": "$XXB", "unemployment": "X.X%"}
- political: {"stability_index": "X/10", "government_effectiveness": "X/10", "policy_direction": "positive/neutral/negative", "diplomatic_stance": "text"}
- security: {"threat_level": "low/medium/high/critical", "travel_advisory": "level 1-4", "peace_index": "X/10", "crime_rate": "X per 100k"}
- bilateral: {"relationship_score": "X/10", "trade_volume": "$XXB", "active_agreements": "X", "cooperation_areas": "text"}';

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_intelligence_reports_metrics
ON intelligence_reports USING GIN (metrics);

-- Add helpful comment for developers
COMMENT ON INDEX idx_intelligence_reports_metrics IS
'GIN index for efficient querying of metrics JSONB data (e.g., metrics @> ''{"gdp_growth": "3.5%"}'')';
