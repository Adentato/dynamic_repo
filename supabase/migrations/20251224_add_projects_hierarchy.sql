-- Migration: Add Projects (Table Spaces) hierarchy level
-- Date: 2025-12-24
-- Description: Introduces projects as intermediate level between workspace and tables
-- Workspace -> Project -> Tables (which can have relations)

-- ====== Clean up existing data (fresh start)
-- Delete all records first (cascading deletes will follow FKs)
DELETE FROM public.entity_records;
DELETE FROM public.entity_fields;
DELETE FROM public.entity_tables;

-- ====== Table: public.projects
-- Intermediate level between workspace and tables
-- A workspace contains multiple projects, each project contains related tables
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text, -- For UI: e.g., "red", "blue", "green" (for project badges/icons)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- Foreign key: workspace_id -> organizations(id)
ALTER TABLE public.projects
  ADD CONSTRAINT projects_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects (same logic as entity_tables)
-- Users can view projects from workspaces they are members of
CREATE POLICY "Users can view projects from their workspace" ON public.projects
  FOR SELECT TO public
  USING (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create projects in workspaces they are members of
CREATE POLICY "Users can create projects in their workspace" ON public.projects
  FOR INSERT TO public
  WITH CHECK (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can update projects in workspaces they are members of
CREATE POLICY "Users can update projects in their workspace" ON public.projects
  FOR UPDATE TO public
  USING (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete projects in workspaces they are members of
CREATE POLICY "Users can delete projects in their workspace" ON public.projects
  FOR DELETE TO public
  USING (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ====== Modify entity_tables to add project_id
-- Add the project_id column to link tables to projects
ALTER TABLE public.entity_tables
  ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add index for project_id lookups
CREATE INDEX IF NOT EXISTS idx_entity_tables_project_id ON public.entity_tables(project_id);

-- ====== Comments for documentation
COMMENT ON TABLE public.projects IS 'Project/Table Space: intermediate level containing related tables that can reference each other (like Grist Table Spaces)';
COMMENT ON COLUMN public.projects.workspace_id IS 'Reference to organization/workspace this project belongs to';
COMMENT ON COLUMN public.projects.name IS 'User-friendly name of the project (e.g., "User Research", "Product Management")';
COMMENT ON COLUMN public.projects.color IS 'Color for UI representation (red, blue, green, etc.)';
COMMENT ON COLUMN public.entity_tables.project_id IS 'Reference to project this table belongs to (nullable for backwards compatibility, but new tables should have project_id)';
