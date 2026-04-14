import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// POST /api/sequences — create a new sequence with optional steps
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const body = await readBody<{
    name: string
    description?: string
    trigger_status?: string
    is_active?: boolean
    steps?: Array<{
      step_order: number
      delay_days: number
      template_id?: string
      subject?: string
      body_html?: string
      body_text?: string
    }>
  }>(event)

  if (!body.name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })

  const { data: sequence, error } = await db
    .from('email_sequences')
    .insert({
      tenant_id:      tenantId,
      name:           body.name.trim(),
      description:    body.description?.trim() ?? null,
      trigger_status: body.trigger_status ?? null,
      is_active:      body.is_active ?? true,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Insert steps if provided
  if (body.steps?.length) {
    const steps = body.steps.map((s, i) => ({
      sequence_id: sequence.id,
      step_order:  s.step_order ?? i,
      delay_days:  s.delay_days ?? 1,
      template_id: s.template_id ?? null,
      subject:     s.subject ?? null,
      body_html:   s.body_html ?? null,
      body_text:   s.body_text ?? null,
    }))
    await db.from('sequence_steps').insert(steps)
  }

  const { data: full } = await db
    .from('email_sequences')
    .select('*, steps:sequence_steps(*)')
    .eq('id', sequence.id)
    .single()

  return full
})
