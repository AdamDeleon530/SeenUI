export type UserRole = 'agency_admin' | 'business_owner' | 'staff'

export interface AppUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  tenant_id: string | null  // null for agency_admin before selecting tenant
  agency_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Agency {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_user_id: string
  created_at: string
  updated_at: string
}

export interface AgencyTenantMembership {
  id: string
  agency_id: string
  tenant_id: string
  created_at: string
}

// DTO
export interface InviteUserDto {
  email: string
  full_name: string
  role: UserRole
  tenant_id: string
}
