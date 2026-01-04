-- AI Brief Generation Feature: Model Pricing Table
-- Migration: 20251205000002_ai_model_pricing.sql

CREATE TABLE IF NOT EXISTS ai_model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider ai_provider NOT NULL,
  model TEXT NOT NULL,
  
  input_price_per_1m_tokens DECIMAL(10, 6) NOT NULL,
  output_price_per_1m_tokens DECIMAL(10, 6) NOT NULL,
  
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (provider, model, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_pricing_provider_model 
  ON ai_model_pricing(provider, model, is_active);

COMMENT ON TABLE ai_model_pricing IS 'Model pricing for AI cost calculation';

-- Seed initial pricing data
INSERT INTO ai_model_pricing (provider, model, input_price_per_1m_tokens, output_price_per_1m_tokens)
VALUES
  -- OpenAI
  ('openai', 'gpt-4o', 2.50, 10.00),
  ('openai', 'gpt-4o-mini', 0.15, 0.60),
  ('openai', 'gpt-4-turbo', 10.00, 30.00),
  ('openai', 'text-embedding-3-small', 0.02, 0.00),
  ('openai', 'text-embedding-3-large', 0.13, 0.00),
  
  -- Anthropic
  ('anthropic', 'claude-3-5-sonnet-20241022', 3.00, 15.00),
  ('anthropic', 'claude-3-5-haiku-20241022', 1.00, 5.00),
  ('anthropic', 'claude-3-opus-20240229', 15.00, 75.00),
  
  -- Google
  ('google', 'gemini-1.5-pro', 1.25, 5.00),
  ('google', 'gemini-1.5-flash', 0.075, 0.30),
  
  -- Private (zero cost for self-hosted)
  ('vllm', 'llama-3.1-70b', 0.00, 0.00),
  ('ollama', 'llama3.1', 0.00, 0.00)
ON CONFLICT (provider, model, effective_date) DO NOTHING;
