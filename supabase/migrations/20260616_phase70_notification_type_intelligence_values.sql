-- Phase 70: add intelligence notification types.
--
-- The intelligence in_app channel (in-app-adapter.ts) emits notifications with
-- type 'intelligence_alert' / 'intelligence_digest', but the notification_type
-- enum only had commitment/after-action/edit labels — so every in_app alert/digest
-- INSERT threw at the enum. Add the two intelligence labels.
--
-- Note: ALTER TYPE ... ADD VALUE is permanent (Postgres cannot drop an enum label).
-- This is intentional — these are durable, first-class notification types.
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'intelligence_alert';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'intelligence_digest';
