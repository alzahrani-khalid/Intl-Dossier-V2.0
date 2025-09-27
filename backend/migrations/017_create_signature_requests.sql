-- Create signature_requests table
CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mou_id UUID NOT NULL REFERENCES mous(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('docusign', 'pki')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'viewed', 'signed', 'completed', 'declined', 'expired')
  ),
  signatories JSONB NOT NULL DEFAULT '[]'::jsonb,
  workflow VARCHAR(20) NOT NULL DEFAULT 'parallel' CHECK (workflow IN ('parallel', 'sequential')),
  envelope_id VARCHAR(255),
  certificate TEXT,
  audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Ensure completion date is set when status is completed
  CONSTRAINT completion_consistency CHECK (
    (status != 'completed' AND completed_at IS NULL) OR
    (status = 'completed' AND completed_at IS NOT NULL)
  ),
  -- Ensure envelope_id for DocuSign
  CONSTRAINT docusign_envelope CHECK (
    provider != 'docusign' OR envelope_id IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_signature_requests_mou ON signature_requests(mou_id);
CREATE INDEX idx_signature_requests_document ON signature_requests(document_id);
CREATE INDEX idx_signature_requests_status ON signature_requests(status) WHERE status NOT IN ('completed', 'declined', 'expired');
CREATE INDEX idx_signature_requests_provider ON signature_requests(provider);
CREATE INDEX idx_signature_requests_expires ON signature_requests(expires_at) WHERE status NOT IN ('completed', 'declined', 'expired');
CREATE INDEX idx_signature_requests_signatories ON signature_requests USING gin(signatories);

-- Enable RLS
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY signature_requests_select ON signature_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mous
      WHERE mous.id = signature_requests.mou_id
      AND (
        -- User has access to the MoU
        EXISTS (
          SELECT 1 FROM mou_access_control
          WHERE mou_id = mous.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY signature_requests_insert ON signature_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mous
      WHERE mous.id = mou_id
      AND (
        -- User can manage the MoU
        EXISTS (
          SELECT 1 FROM mou_access_control
          WHERE mou_id = mous.id
          AND user_id = auth.uid()
          AND permission IN ('write', 'admin')
        )
      )
    )
  );

CREATE POLICY signature_requests_update ON signature_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mous
      WHERE mous.id = signature_requests.mou_id
      AND (
        -- User can manage the MoU
        EXISTS (
          SELECT 1 FROM mou_access_control
          WHERE mou_id = mous.id
          AND user_id = auth.uid()
          AND permission IN ('write', 'admin')
        )
      )
    )
  );

-- Function to update signature status
CREATE OR REPLACE FUNCTION update_signature_status(
  p_request_id UUID,
  p_signatory_id VARCHAR,
  p_status VARCHAR,
  p_signature_data TEXT DEFAULT NULL,
  p_ip_address VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_signatories JSONB;
  v_updated_signatories JSONB := '[]'::jsonb;
  v_signatory JSONB;
  v_all_signed BOOLEAN := TRUE;
BEGIN
  -- Get current signatories
  SELECT signatories INTO v_signatories
  FROM signature_requests
  WHERE id = p_request_id;
  
  -- Update the specific signatory
  FOR v_signatory IN SELECT * FROM jsonb_array_elements(v_signatories)
  LOOP
    IF v_signatory->>'contact_id' = p_signatory_id THEN
      v_signatory = v_signatory || jsonb_build_object(
        'status', p_status,
        'signed_at', NOW(),
        'ip_address', p_ip_address,
        'signature_data', p_signature_data
      );
    END IF;
    
    v_updated_signatories = v_updated_signatories || v_signatory;
    
    -- Check if all are signed
    IF v_signatory->>'status' != 'signed' THEN
      v_all_signed = FALSE;
    END IF;
  END LOOP;
  
  -- Update the request
  UPDATE signature_requests
  SET 
    signatories = v_updated_signatories,
    status = CASE 
      WHEN v_all_signed THEN 'completed'
      WHEN p_status = 'declined' THEN 'declined'
      ELSE status
    END,
    completed_at = CASE
      WHEN v_all_signed THEN NOW()
      ELSE completed_at
    END,
    audit_trail = audit_trail || jsonb_build_object(
      'event', 'signature_update',
      'timestamp', NOW(),
      'signatory_id', p_signatory_id,
      'status', p_status
    )
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if signature request is expired
CREATE OR REPLACE FUNCTION check_signature_expiry()
RETURNS VOID AS $$
BEGIN
  UPDATE signature_requests
  SET 
    status = 'expired',
    audit_trail = audit_trail || jsonb_build_object(
      'event', 'auto_expired',
      'timestamp', NOW()
    )
  WHERE status NOT IN ('completed', 'declined', 'expired')
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Scheduled job to check expiry (would be called by a cron job or scheduler)
-- SELECT check_signature_expiry();