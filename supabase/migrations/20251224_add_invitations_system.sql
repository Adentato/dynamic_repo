-- Phase 2: User Invitations System
-- This migration adds the ability to invite users to organizations

-- 1. Create workspace_invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'member',
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP,
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Partial unique index: only one pending invitation per email per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_invite_per_email 
ON workspace_invitations(organization_id, email) 
WHERE accepted_by_user_id IS NULL;

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_org ON workspace_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_accepted_user ON workspace_invitations(accepted_by_user_id);

-- 4. Enable RLS on workspace_invitations
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Anyone can view pending invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email" ON workspace_invitations
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email OR
    auth.uid() = created_by_user_id
  );

-- 6. RLS Policy: Organization admins can create invitations
CREATE POLICY "Organization admins can create invitations" ON workspace_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = workspace_invitations.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 7. RLS Policy: Users can accept their own invitations
CREATE POLICY "Users can accept their own invitations" ON workspace_invitations
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = email AND accepted_at IS NULL
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = email AND
    accepted_by_user_id = auth.uid()
  );

-- 8. RLS Policy: Organization admins can delete invitations
CREATE POLICY "Organization admins can delete invitations" ON workspace_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = workspace_invitations.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Add comment for clarity
COMMENT ON TABLE workspace_invitations IS 
'User invitations to organizations. Users are invited via email with a unique token. They accept the invitation by clicking the token link.';

COMMENT ON COLUMN workspace_invitations.token IS
'Unique token used in invitation link: /invitations/{token}';

COMMENT ON COLUMN workspace_invitations.role IS
'Role the invited user will have: owner, admin, or member';

COMMENT ON COLUMN workspace_invitations.expires_at IS
'Invitation expires after 7 days by default. Null means never expires.';
