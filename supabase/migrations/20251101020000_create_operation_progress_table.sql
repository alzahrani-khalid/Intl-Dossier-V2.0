-- Create operation_progress table for tracking long-running operations
CREATE TABLE IF NOT EXISTS public.operation_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation_type text NOT NULL,
  total_items integer NOT NULL DEFAULT 0,
  processed_items integer NOT NULL DEFAULT 0,
  successful_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- Add indexes for efficient queries
CREATE INDEX idx_operation_progress_user_id ON public.operation_progress(user_id);
CREATE INDEX idx_operation_progress_status ON public.operation_progress(status);
CREATE INDEX idx_operation_progress_created_at ON public.operation_progress(created_at DESC);

-- Enable RLS
ALTER TABLE public.operation_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own progress
CREATE POLICY "Users can view their own operation progress"
  ON public.operation_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own operation progress"
  ON public.operation_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operation progress"
  ON public.operation_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role can manage all operation progress"
  ON public.operation_progress
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_operation_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operation_progress_updated_at
  BEFORE UPDATE ON public.operation_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_operation_progress_updated_at();

-- Add comment
COMMENT ON TABLE public.operation_progress IS 'Tracks progress of long-running administrative operations (e.g., bulk country data population)';

