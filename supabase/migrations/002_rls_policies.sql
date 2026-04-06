-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================
-- Strategy:
--   - All tables enable RLS
--   - Authenticated users can only access rows belonging to their tenant_id
--   - Agency admins can access rows for any tenant in their agency
--   - The server-side service role key bypasses RLS for admin operations
--   - Public embed endpoints use service role key server-side (never client)
-- =============================================================================

-- Helper function: get current user's tenant_id from their profile
create or replace function public.get_my_tenant_id()
returns uuid language sql security definer stable as $$
  select tenant_id from public.user_profiles where id = auth.uid()
$$;

-- Helper function: get current user's role
create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role from public.user_profiles where id = auth.uid()
$$;

-- Helper function: get current user's agency_id
create or replace function public.get_my_agency_id()
returns uuid language sql security definer stable as $$
  select agency_id from public.user_profiles where id = auth.uid()
$$;

-- Helper function: check if current user's agency manages a given tenant
create or replace function public.agency_manages_tenant(p_tenant_id uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.agency_tenant_memberships atm
    join public.user_profiles up on up.agency_id = atm.agency_id
    where up.id = auth.uid()
    and atm.tenant_id = p_tenant_id
  )
$$;

-- =============================================================================
-- TENANTS
-- =============================================================================
alter table public.tenants enable row level security;

-- Users can read their own tenant
create policy "users_read_own_tenant" on public.tenants
  for select using (
    id = public.get_my_tenant_id()
    or public.agency_manages_tenant(id)
  );

-- Only business_owner can update their tenant
create policy "owner_update_tenant" on public.tenants
  for update using (
    id = public.get_my_tenant_id()
    and public.get_my_role() = 'business_owner'
  );

-- =============================================================================
-- TENANT SETTINGS
-- =============================================================================
alter table public.tenant_settings enable row level security;

create policy "users_read_own_tenant_settings" on public.tenant_settings
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

create policy "owner_manage_tenant_settings" on public.tenant_settings
  for all using (
    tenant_id = public.get_my_tenant_id()
    and public.get_my_role() in ('business_owner', 'agency_admin')
  );

-- =============================================================================
-- USER PROFILES
-- =============================================================================
alter table public.user_profiles enable row level security;

-- Users can always read their own profile
create policy "users_read_own_profile" on public.user_profiles
  for select using (id = auth.uid());

-- Users can read profiles in their tenant
create policy "users_read_tenant_profiles" on public.user_profiles
  for select using (tenant_id = public.get_my_tenant_id());

-- Users can update their own profile
create policy "users_update_own_profile" on public.user_profiles
  for update using (id = auth.uid());

-- =============================================================================
-- AGENCIES
-- =============================================================================
alter table public.agencies enable row level security;

create policy "agency_admins_read_own_agency" on public.agencies
  for select using (id = public.get_my_agency_id());

create policy "agency_owner_manage_agency" on public.agencies
  for all using (owner_user_id = auth.uid());

-- =============================================================================
-- AGENCY TENANT MEMBERSHIPS
-- =============================================================================
alter table public.agency_tenant_memberships enable row level security;

create policy "agency_admins_read_memberships" on public.agency_tenant_memberships
  for select using (agency_id = public.get_my_agency_id());

-- =============================================================================
-- SERVICES
-- =============================================================================
alter table public.services enable row level security;

create policy "tenant_users_read_services" on public.services
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

create policy "owner_manage_services" on public.services
  for all using (
    tenant_id = public.get_my_tenant_id()
    and public.get_my_role() in ('business_owner', 'agency_admin')
  );

-- =============================================================================
-- PIPELINE STAGES
-- =============================================================================
alter table public.pipeline_stages enable row level security;

create policy "tenant_users_read_stages" on public.pipeline_stages
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

create policy "owner_manage_stages" on public.pipeline_stages
  for all using (
    tenant_id = public.get_my_tenant_id()
    and public.get_my_role() in ('business_owner', 'agency_admin')
  );

-- =============================================================================
-- TAGS
-- =============================================================================
alter table public.tags enable row level security;

create policy "tenant_users_read_tags" on public.tags
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

create policy "tenant_staff_manage_tags" on public.tags
  for all using (
    tenant_id = public.get_my_tenant_id()
  );

-- =============================================================================
-- LEADS
-- =============================================================================
alter table public.leads enable row level security;

create policy "tenant_users_read_leads" on public.leads
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

create policy "tenant_staff_insert_leads" on public.leads
  for insert with check (tenant_id = public.get_my_tenant_id());

create policy "tenant_staff_update_leads" on public.leads
  for update using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

-- =============================================================================
-- LEAD TAGS
-- =============================================================================
alter table public.lead_tags enable row level security;

-- RLS via lead join — if user can see the lead, they can see its tags
create policy "tenant_users_manage_lead_tags" on public.lead_tags
  for all using (
    exists(
      select 1 from public.leads l
      where l.id = lead_id
      and (
        l.tenant_id = public.get_my_tenant_id()
        or public.agency_manages_tenant(l.tenant_id)
      )
    )
  );

-- =============================================================================
-- LEAD ACTIVITIES
-- =============================================================================
alter table public.lead_activities enable row level security;

create policy "tenant_users_read_activities" on public.lead_activities
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

-- Activities are insert-only from the app (no update/delete — immutable log)
create policy "tenant_staff_insert_activities" on public.lead_activities
  for insert with check (tenant_id = public.get_my_tenant_id());

-- =============================================================================
-- LEAD NOTES
-- =============================================================================
alter table public.lead_notes enable row level security;

create policy "tenant_users_read_notes" on public.lead_notes
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

create policy "tenant_staff_manage_notes" on public.lead_notes
  for all using (tenant_id = public.get_my_tenant_id());

-- =============================================================================
-- EMAIL TEMPLATES
-- =============================================================================
alter table public.email_templates enable row level security;

create policy "tenant_users_read_email_templates" on public.email_templates
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );

create policy "owner_manage_email_templates" on public.email_templates
  for all using (
    tenant_id = public.get_my_tenant_id()
    and public.get_my_role() in ('business_owner', 'agency_admin')
  );

-- =============================================================================
-- EMAIL SENDS
-- =============================================================================
alter table public.email_sends enable row level security;

create policy "tenant_users_read_email_sends" on public.email_sends
  for select using (
    tenant_id = public.get_my_tenant_id()
    or public.agency_manages_tenant(tenant_id)
  );
