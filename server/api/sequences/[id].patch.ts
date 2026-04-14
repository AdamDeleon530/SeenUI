import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// PATCH /api/sequences/:id — update sequence metadata + replace steps
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()

  const body = await readBody<{
    name?: string
    description?: string
    trigger_status?: string | null
    is_active?: boolean
    steps?: Array<{
      step_order: number
      delay_days: number
      template_id?: string | null
      subject?: string | null
      body_html?: string | null
      body_text?: string | null
    }>
  }>(event)

  // Verify ownership
  const { data: existing } = await db
    .from('email_sequences')
    .select('id')
    .eq('id', id!)
    .eq('tenant_id', tenantId)
    .single()
  if (!existing) throw createError({ statusCode: 404, message: 'Sequence not found' })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined)           updates.name           = body.name.trim()
  if (body.description !== undefined)    updates.description    = body.description?.trim() ?? null
  if (body.trigger_status !== undefined) updates.trigger_status = body.trigger_status
  if (body.is_active !== undefined)      updates.is_active      = body.is_active

  await db.from('email_sequences').update(updates).eq('id', id!)

  // Replace steps if provided
  if (body.steps !== undefined) {
    await db.from('sequence_steps').delete().eq('sequence_id', id!)
    if (body.steps.length) {
      const steps = body.steps.map((s, i) => ({
        sequence_id: id!,
        step_order:  s.step_order ?? i,
        delay_days:  s.delay_days ?? 1,
        template_id: s.template_id ?? null,
        subject:     s.subject ?? null,
        body_html:   s.body_html ?? null,
        body_text:   s.body_text ?? null,
      }))
      await db.from('sequence_steps').insert(steps)
    }
  }

  const { data: full } = await db
    .from('email_sequences')
    .select('*, steps:sequence_steps(*)')
    .eq('id', id!)
    .single()

  return full
})
