-- Migration: Create initial schema with authentication and multi-tenant tables
-- Date: 2025-12-22
-- Description: Sets up profiles, organizations, and organization_members tables with RLS policies

-- ====== Table: public.profiles
-- Stores user profile information synced from auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- Foreign key constraints referencing auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can only view and modify their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO public
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO public
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO public
  USING ((auth.uid() = id));

-- ====== Table: public.organizations
-- Stores organization/workspace information for multi-tenancy
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  PRIMARY KEY (id)
);

-- Foreign key: created_by -> auth.users(id)
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
-- Users can create their own organizations
CREATE POLICY "Users can create their own organizations" ON public.organizations
  FOR INSERT TO public
  WITH CHECK ((auth.uid() = created_by));

-- Users can view organizations they own or are members of
CREATE POLICY "Users can view organizations they own or are members of" ON public.organizations
  FOR SELECT TO public
  USING (
    (auth.uid() = created_by) OR
    (id IN (
      SELECT organization_members.organization_id
      FROM public.organization_members
      WHERE (organization_members.user_id = auth.uid())
    ))
  );

-- Organization owners can update their organizations
CREATE POLICY "Organization owners can update" ON public.organizations
  FOR UPDATE TO public
  USING (
    id IN (
      SELECT organization_members.organization_id
      FROM public.organization_members
      WHERE (organization_members.user_id = auth.uid() AND organization_members.role = 'owner'::text)
    )
  );

-- ====== Table: public.organization_members
-- Stores membership relationships between users and organizations
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner'::text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(organization_id, user_id)
);

-- Foreign keys
ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_members
-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships" ON public.organization_members
  FOR SELECT TO public
  USING ((auth.uid() = user_id));

-- Users can insert themselves as organization members
CREATE POLICY "Users can insert themselves as organization members" ON public.organization_members
  FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));

-- Owners can remove members from their organizations
CREATE POLICY "Owners can remove members" ON public.organization_members
  FOR DELETE TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations
      WHERE (organizations.id = organization_members.organization_id AND organizations.created_by = auth.uid())
    )
  );

-- ====== Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);
