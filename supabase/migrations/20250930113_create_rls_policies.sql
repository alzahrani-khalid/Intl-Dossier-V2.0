-- Migration: Create RLS policies for hybrid permission model
-- Feature: 010-after-action-notes
-- Task: T014

-- Engagements: Users can access if assigned to parent dossier
CREATE POLICY "hybrid_access_engagements" ON engagements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dossier_owners
    WHERE dossier_id = engagements.dossier_id
    AND user_id = auth.uid()
  )
);

-- After-Action Records: Role-based + dossier assignment
CREATE POLICY "hybrid_access_after_actions" ON after_action_records
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dossier_owners
    WHERE dossier_id = after_action_records.dossier_id
    AND user_id = auth.uid()
  )
  AND
  CASE
    WHEN auth.jwt()->>'role' = 'admin' THEN true
    WHEN auth.jwt()->>'role' = 'supervisor' THEN true
    WHEN auth.jwt()->>'role' = 'staff'
      AND after_action_records.publication_status IN ('draft', 'edit_requested') THEN true
    ELSE false
  END
);

-- Decisions: Cascade from after-action access
CREATE POLICY "cascade_access_decisions" ON decisions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM after_action_records aa
    JOIN dossier_owners do ON do.dossier_id = aa.dossier_id
    WHERE aa.id = decisions.after_action_id
    AND do.user_id = auth.uid()
  )
);

-- Commitments: Dossier assignment OR user is owner
CREATE POLICY "hybrid_access_commitments" ON commitments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dossier_owners
    WHERE dossier_id = commitments.dossier_id
    AND user_id = auth.uid()
  )
  OR
  commitments.owner_user_id = auth.uid()
);

-- Risks: Cascade from after-action access
CREATE POLICY "cascade_access_risks" ON risks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM after_action_records aa
    JOIN dossier_owners do ON do.dossier_id = aa.dossier_id
    WHERE aa.id = risks.after_action_id
    AND do.user_id = auth.uid()
  )
);

-- Follow-up Actions: Cascade from after-action access
CREATE POLICY "cascade_access_follow_ups" ON follow_up_actions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM after_action_records aa
    JOIN dossier_owners do ON do.dossier_id = aa.dossier_id
    WHERE aa.id = follow_up_actions.after_action_id
    AND do.user_id = auth.uid()
  )
);

-- Attachments: Cascade from after-action access
CREATE POLICY "cascade_access_attachments" ON attachments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM after_action_records aa
    JOIN dossier_owners do ON do.dossier_id = aa.dossier_id
    WHERE aa.id = attachments.after_action_id
    AND do.user_id = auth.uid()
  )
);

-- After-Action Versions: Cascade from after-action access
CREATE POLICY "cascade_access_versions" ON after_action_versions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM after_action_records aa
    JOIN dossier_owners do ON do.dossier_id = aa.dossier_id
    WHERE aa.id = after_action_versions.after_action_id
    AND do.user_id = auth.uid()
  )
);

-- External Contacts: Accessible by all authenticated users (read-only for non-admins)
CREATE POLICY "read_external_contacts" ON external_contacts
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "modify_external_contacts" ON external_contacts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "update_external_contacts" ON external_contacts
FOR UPDATE USING (
  auth.jwt()->>'role' IN ('admin', 'supervisor')
);

-- User Notification Preferences: Users can only manage their own
CREATE POLICY "own_notification_prefs" ON user_notification_preferences
FOR ALL USING (user_id = auth.uid());

-- Notifications: Users can only see their own
CREATE POLICY "own_notifications" ON notifications
FOR ALL USING (user_id = auth.uid());
