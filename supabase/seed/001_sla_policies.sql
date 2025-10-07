-- Seed: 001_sla_policies
-- Description: Default SLA policies for intake tickets
-- Date: 2025-01-29

-- Clear existing policies (for reseeding)
TRUNCATE TABLE sla_policies CASCADE;

-- ============================================
-- High Priority / Critical SLA Policies
-- ============================================

-- Critical + Secret: Most urgent
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    NULL, -- Any request type
    'secret',
    'critical',
    'urgent',
    15, -- 15 minutes acknowledgment
    240, -- 4 hours resolution
    false, -- 24/7 support
    'Asia/Riyadh',
    true
);

-- High Priority: Urgent or Confidential
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    NULL,
    'confidential',
    NULL,
    'high',
    30, -- 30 minutes acknowledgment
    480, -- 8 hours resolution
    false, -- 24/7 support
    'Asia/Riyadh',
    true
);

INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    NULL,
    NULL,
    'high',
    'high',
    30, -- 30 minutes acknowledgment
    480, -- 8 hours resolution
    false, -- 24/7 support
    'Asia/Riyadh',
    true
);

-- ============================================
-- Medium Priority SLA Policies
-- ============================================

-- Medium Priority: Internal or Medium urgency
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    NULL,
    'internal',
    'medium',
    'medium',
    120, -- 2 hours acknowledgment
    1440, -- 24 hours resolution
    true, -- Business hours only
    'Asia/Riyadh',
    true
);

-- ============================================
-- Low Priority SLA Policies
-- ============================================

-- Low Priority: Public or Low urgency
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    NULL,
    'public',
    'low',
    'low',
    480, -- 8 hours acknowledgment
    2880, -- 48 hours resolution
    true, -- Business hours only
    'Asia/Riyadh',
    true
);

-- ============================================
-- Request Type Specific Policies
-- ============================================

-- Engagement Support - Higher priority by default
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    'engagement',
    NULL,
    NULL,
    NULL,
    60, -- 1 hour acknowledgment
    720, -- 12 hours resolution
    true,
    'Asia/Riyadh',
    true
);

-- Position Development - Standard priority
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    'position',
    NULL,
    NULL,
    NULL,
    240, -- 4 hours acknowledgment
    1440, -- 24 hours resolution
    true,
    'Asia/Riyadh',
    true
);

-- MoU Action Items - Quick turnaround
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    'mou_action',
    NULL,
    NULL,
    NULL,
    30, -- 30 minutes acknowledgment
    360, -- 6 hours resolution
    true,
    'Asia/Riyadh',
    true
);

-- Foresight Requests - Longer timeframe
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    'foresight',
    NULL,
    NULL,
    NULL,
    480, -- 8 hours acknowledgment
    4320, -- 72 hours resolution
    true,
    'Asia/Riyadh',
    true
);

-- ============================================
-- Default Fallback Policy
-- ============================================

-- Catch-all policy (lowest specificity)
INSERT INTO sla_policies (
    request_type,
    sensitivity,
    urgency,
    priority,
    acknowledgment_target,
    resolution_target,
    business_hours_only,
    timezone,
    is_active
) VALUES (
    NULL,
    NULL,
    NULL,
    NULL,
    240, -- 4 hours acknowledgment
    2880, -- 48 hours resolution
    true,
    'Asia/Riyadh',
    true
);

-- ============================================
-- Verification Query
-- ============================================

-- Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count FROM sla_policies WHERE is_active = true;
    
    IF policy_count < 10 THEN
        RAISE WARNING 'Expected at least 10 SLA policies, found %', policy_count;
    ELSE
        RAISE NOTICE 'Successfully created % SLA policies', policy_count;
    END IF;
END $$;

-- Show summary of created policies
SELECT 
    COALESCE(request_type::TEXT, 'Any') as request_type,
    COALESCE(sensitivity::TEXT, 'Any') as sensitivity,
    COALESCE(urgency::TEXT, 'Any') as urgency,
    COALESCE(priority::TEXT, 'Any') as priority,
    acknowledgment_target || ' min' as ack_target,
    resolution_target || ' min (' || (resolution_target / 60) || ' hrs)' as resolution_target,
    CASE WHEN business_hours_only THEN 'Business Hours' ELSE '24/7' END as support_hours
FROM sla_policies
WHERE is_active = true
ORDER BY 
    CASE 
        WHEN priority = 'urgent' THEN 1
        WHEN priority = 'high' THEN 2
        WHEN priority = 'medium' THEN 3
        WHEN priority = 'low' THEN 4
        ELSE 5
    END,
    acknowledgment_target;