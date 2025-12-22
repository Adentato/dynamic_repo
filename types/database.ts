export type Profile = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export type OrganizationMember = {
  id: string
  organization_id: string
  user_id: string
  role: 'owner'
  created_at: string
}

// ====== Dynamic Tables System Types

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'email' | 'url' | 'richtext' | 'json'

export type FieldOptions = {
  choices?: string[]
  [key: string]: any
}

export type EntityTable = {
  id: string
  workspace_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type EntityField = {
  id: string
  table_id: string
  name: string
  type: FieldType
  options: FieldOptions
  order_index: number
  created_at: string
  updated_at: string
}

export type EntityRecord = {
  id: string
  table_id: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

// ====== Extended Types for API Responses

export type EntityTableWithFields = EntityTable & {
  fields: EntityField[]
}

export type EntityTableWithData = EntityTable & {
  fields: EntityField[]
  records: EntityRecord[]
}
