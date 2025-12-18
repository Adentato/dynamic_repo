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
