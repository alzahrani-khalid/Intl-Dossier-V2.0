-- Keep the deprecated tasks.status compatibility column aligned from birth.
-- workflow_stage remains the lifecycle source of truth.

CREATE OR REPLACE FUNCTION public.sync_task_status_from_workflow_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- INSERT is unconditional: a caller-supplied status must not override the stage.
    CASE NEW.workflow_stage
      WHEN 'todo' THEN
        NEW.status := 'pending';
      WHEN 'in_progress' THEN
        NEW.status := 'in_progress';
      WHEN 'review' THEN
        NEW.status := 'review';
      WHEN 'done' THEN
        NEW.status := 'completed';
        IF NEW.completed_at IS NULL THEN
          NEW.completed_at := NOW();
        END IF;
      WHEN 'cancelled' THEN
        NEW.status := 'cancelled';
      ELSE
        NULL;
    END CASE;
  ELSIF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
    -- Preserve the existing UPDATE guard and mapping.
    CASE NEW.workflow_stage
      WHEN 'todo' THEN
        NEW.status := 'pending';
      WHEN 'in_progress' THEN
        NEW.status := 'in_progress';
      WHEN 'review' THEN
        NEW.status := 'review';
      WHEN 'done' THEN
        NEW.status := 'completed';
        IF NEW.completed_at IS NULL THEN
          NEW.completed_at := NOW();
        END IF;
      WHEN 'cancelled' THEN
        NEW.status := 'cancelled';
      ELSE
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_task_status ON public.tasks;

CREATE TRIGGER trg_sync_task_status
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_task_status_from_workflow_stage();
