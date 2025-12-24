-- Migration: Fix organization_members RLS policies
-- Date: 2025-12-24
-- Description: Add missing RLS policies to allow users to read their own organization memberships

-- Enable RLS on organization_members if not already enabled
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view organization members they have access to" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert organization memberships for themselves" ON public.organization_members;

-- RLS Policy: Users can view their own organization memberships
-- This is the ONLY policy needed to avoid infinite recursion
CREATE POLICY "Users can view their own organization memberships" ON public.organization_members
  FOR SELECT
  USING (user_id = auth.uid());

-- IMPORTANT: We do NOT create a second SELECT policy because it would cause infinite recursion
-- The app layer must verify workspace access instead of relying on a second RLS policy

-- RLS Policy: Allow service role to insert (for app actions)
-- Note: Since we're using service role in app actions, we need to allow inserts bypassing RLS
-- The check in the app layer (createOrganizationAction) already verifies the user is authenticated

COMMENT ON TABLE public.organization_members IS 'Links users to organizations with their role';
COMMENT ON COLUMN public.organization_members.organization_id IS 'Reference to the organization';
COMMENT ON COLUMN public.organization_members.user_id IS 'Reference to the user';
COMMENT ON COLUMN public.organization_members.role IS 'User role in this organization (e.g., owner, admin, member)';
