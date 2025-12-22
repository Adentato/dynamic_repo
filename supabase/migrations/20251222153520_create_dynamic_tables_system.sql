-- Migration: Create dynamic tables system for Grist/Airtable-like functionality
-- Date: 2025-12-22 15:35:20 UTC
-- Description: Sets up entity_tables, entity_fields, and entity_records with RLS policies

-- ====== Table: public.entity_tables
-- Stores user-created table definitions (like Airtable tables or Grist sheets)
CREATE TABLE IF NOT EXISTS public.entity_tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- Foreign key: workspace_id -> organizations(id)
ALTER TABLE public.entity_tables
  ADD CONSTRAINT entity_tables_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_tables_workspace_id ON public.entity_tables(workspace_id);
CREATE INDEX IF NOT EXISTS idx_entity_tables_created_at ON public.entity_tables(created_at);

-- Enable Row Level Security
ALTER TABLE public.entity_tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entity_tables
-- Users can view tables from workspaces they are members of
CREATE POLICY "Users can view entity_tables from their workspace" ON public.entity_tables
  FOR SELECT TO public
  USING (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create tables in workspaces they are members of
CREATE POLICY "Users can create entity_tables in their workspace" ON public.entity_tables
  FOR INSERT TO public
  WITH CHECK (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can update tables in workspaces they are members of
CREATE POLICY "Users can update entity_tables in their workspace" ON public.entity_tables
  FOR UPDATE TO public
  USING (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete tables in workspaces they are members of
CREATE POLICY "Users can delete entity_tables in their workspace" ON public.entity_tables
  FOR DELETE TO public
  USING (
    workspace_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ====== Table: public.entity_fields
-- Stores field/column definitions for each entity_table
-- Similar to Airtable's field configuration
CREATE TABLE IF NOT EXISTS public.entity_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'number', 'select', 'date', 'boolean', 'email', 'url', 'richtext', 'json')),
  options jsonb DEFAULT '{}'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(table_id, name)
);

-- Foreign key: table_id -> entity_tables(id)
ALTER TABLE public.entity_fields
  ADD CONSTRAINT entity_fields_table_id_fkey
  FOREIGN KEY (table_id) REFERENCES public.entity_tables(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_fields_table_id ON public.entity_fields(table_id);
CREATE INDEX IF NOT EXISTS idx_entity_fields_order_index ON public.entity_fields(table_id, order_index);

-- Enable Row Level Security
ALTER TABLE public.entity_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entity_fields
-- Users can view fields from tables in workspaces they are members of
CREATE POLICY "Users can view entity_fields from their workspace" ON public.entity_fields
  FOR SELECT TO public
  USING (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create fields in tables from workspaces they are members of
CREATE POLICY "Users can create entity_fields in their workspace" ON public.entity_fields
  FOR INSERT TO public
  WITH CHECK (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update fields in tables from workspaces they are members of
CREATE POLICY "Users can update entity_fields in their workspace" ON public.entity_fields
  FOR UPDATE TO public
  USING (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete fields in tables from workspaces they are members of
CREATE POLICY "Users can delete entity_fields in their workspace" ON public.entity_fields
  FOR DELETE TO public
  USING (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ====== Table: public.entity_records
-- Stores the actual data records for each table
-- Data is stored in JSONB format where keys are field IDs
-- Example: { "field-uuid-1": "John", "field-uuid-2": 25, "field-uuid-3": ["option1", "option2"] }
CREATE TABLE IF NOT EXISTS public.entity_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- Foreign key: table_id -> entity_tables(id)
ALTER TABLE public.entity_records
  ADD CONSTRAINT entity_records_table_id_fkey
  FOREIGN KEY (table_id) REFERENCES public.entity_tables(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_records_table_id ON public.entity_records(table_id);
CREATE INDEX IF NOT EXISTS idx_entity_records_created_at ON public.entity_records(created_at);
CREATE INDEX IF NOT EXISTS idx_entity_records_data ON public.entity_records USING GIN (data);

-- Enable Row Level Security
ALTER TABLE public.entity_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entity_records
-- Users can view records from tables in workspaces they are members of
CREATE POLICY "Users can view entity_records from their workspace" ON public.entity_records
  FOR SELECT TO public
  USING (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create records in tables from workspaces they are members of
CREATE POLICY "Users can create entity_records in their workspace" ON public.entity_records
  FOR INSERT TO public
  WITH CHECK (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update records in tables from workspaces they are members of
CREATE POLICY "Users can update entity_records in their workspace" ON public.entity_records
  FOR UPDATE TO public
  USING (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete records in tables from workspaces they are members of
CREATE POLICY "Users can delete entity_records in their workspace" ON public.entity_records
  FOR DELETE TO public
  USING (
    table_id IN (
      SELECT id
      FROM public.entity_tables
      WHERE workspace_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ====== Comments for documentation
COMMENT ON TABLE public.entity_tables IS 'User-created table definitions for dynamic schema (like Airtable or Grist tables)';
COMMENT ON COLUMN public.entity_tables.workspace_id IS 'Reference to organization this table belongs to';
COMMENT ON COLUMN public.entity_tables.name IS 'User-friendly name of the table';

COMMENT ON TABLE public.entity_fields IS 'Field/column definitions for each entity_table';
COMMENT ON COLUMN public.entity_fields.type IS 'Field type: text, number, select, date, boolean, email, url, richtext, json';
COMMENT ON COLUMN public.entity_fields.options IS 'JSONB configuration (e.g., {"choices": ["Option1", "Option2"]} for select fields)';
COMMENT ON COLUMN public.entity_fields.order_index IS 'Position of field in table (for ordering columns)';

COMMENT ON TABLE public.entity_records IS 'Actual data records stored as JSONB (keys are field IDs, values are field data)';
COMMENT ON COLUMN public.entity_records.data IS 'JSONB object where keys are entity_field.id and values are the record data';
