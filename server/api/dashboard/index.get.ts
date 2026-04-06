import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'
import type { DashboardData } from '~~/app/types/analytics'

// GET /api/dashboard — analytics for the current tenant
export default defineEventHandler(async (event): Promise<DashboardData> => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const query = getQuery(event)
  const period = (query.period as string) ?? '30d'

  // Calculate date range
  const now = new Date()
  let dateFrom: Date
  if (period === '7d') {
    dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (period === '90d') {
    dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  } else if (period === 'all') {
    dateFrom = new Date('2020-01-01')
  } else {
    // default 30d
    dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  const dateFromISO = (query.date_from as string) ?? dateFrom.toISOString()
  const dateToISO = (query.date_to as string) ?? now.toISOString()

  // Start of current month for monthly stats
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Parallel queries for performance
  const [
    totalLeadsRes,
    leadsThisMonthRes,
    bookedThisMonthRes,
    wonThisMonthRes,
    leadsBySourceRes,
    leadsByPageRes,
    leadsByStageRes,
    leadVolumeRes,
  ] = await Promise.all([
    // Total leads all time
    db.from('leads').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('is_archived', false),

    // Leads this month
    db.from('leads').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('is_archived', false)
      .gte('created_at', monthStart),

    // Booked this month
    db.from('leads').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'booked')
      .gte('created_at', monthStart),

    // Won this month
    db.from('leads').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'won')
      .gte('created_at', monthStart),

    // Leads by source in date range
    db.from('leads').select('source')
      .eq('tenant_id', tenantId).eq('is_archived', false)
      .gte('created_at', dateFromISO).lte('created_at', dateToISO),

    // Leads by source page in date range
    db.from('leads').select('source_page, status')
      .eq('tenant_id', tenantId).eq('is_archived', false)
      .gte('created_at', dateFromISO).lte('created_at', dateToISO),

    // Leads by stage (current snapshot)
    db.from('leads')
      .select('stage_id, pipeline_stages!stage_id(name, color)')
      .eq('tenant_id', tenantId).eq('is_archived', false),

    // Lead volume by day in date range
    db.from('leads').select('created_at')
      .eq('tenant_id', tenantId).eq('is_archived', false)
      .gte('created_at', dateFromISO).lte('created_at', dateToISO)
      .order('created_at', { ascending: true }),
  ])

  const totalLeads = totalLeadsRes.count ?? 0
  const leadsThisMonth = leadsThisMonthRes.count ?? 0
  const bookedThisMonth = bookedThisMonthRes.count ?? 0
  const wonThisMonth = wonThisMonthRes.count ?? 0
  const conversionRate = leadsThisMonth > 0
    ? Math.round((bookedThisMonth / leadsThisMonth) * 100 * 10) / 10
    : 0

  // Aggregate leads by source
  const sourceCounts: Record<string, number> = {}
  for (const row of leadsBySourceRes.data ?? []) {
    sourceCounts[row.source] = (sourceCounts[row.source] ?? 0) + 1
  }
  const sourceTotal = Object.values(sourceCounts).reduce((a, b) => a + b, 0)
  const leadsBySource = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: sourceTotal > 0 ? Math.round((count / sourceTotal) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Aggregate leads by source page
  const pageCounts: Record<string, { count: number; booked: number }> = {}
  for (const row of leadsByPageRes.data ?? []) {
    const page = row.source_page ?? '(direct)'
    if (!pageCounts[page]) pageCounts[page] = { count: 0, booked: 0 }
    pageCounts[page].count++
    if (row.status === 'booked' || row.status === 'won') pageCounts[page].booked++
  }
  const leadsByPage = Object.entries(pageCounts)
    .map(([source_page, { count, booked }]) => ({
      source_page,
      count,
      booked_count: booked,
      conversion_rate: count > 0 ? Math.round((booked / count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Aggregate leads by stage
  const stageCounts: Record<string, { name: string; color: string; count: number }> = {}
  for (const row of leadsByStageRes.data ?? []) {
    const stage = (row as any).pipeline_stages
    if (!stage) continue
    const key = stage.name
    if (!stageCounts[key]) stageCounts[key] = { name: stage.name, color: stage.color, count: 0 }
    stageCounts[key].count++
  }
  const leadsByStage = Object.values(stageCounts)
    .map(s => ({ stage_name: s.name, stage_color: s.color, count: s.count }))
    .sort((a, b) => b.count - a.count)

  // Aggregate lead volume by day
  const dayCounts: Record<string, number> = {}
  for (const row of leadVolumeRes.data ?? []) {
    const day = row.created_at.slice(0, 10) // YYYY-MM-DD
    dayCounts[day] = (dayCounts[day] ?? 0) + 1
  }
  const leadVolumeByDay = Object.entries(dayCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    stats: {
      total_leads: totalLeads,
      leads_this_month: leadsThisMonth,
      booked_this_month: bookedThisMonth,
      won_this_month: wonThisMonth,
      conversion_rate: conversionRate,
      avg_response_hours: null, // SCAFFOLD: compute from activities in v2
    },
    leads_by_source: leadsBySource,
    leads_by_page: leadsByPage,
    leads_by_stage: leadsByStage,
    lead_volume_by_day: leadVolumeByDay,
  }
})
