/**
 * tests/integration/sequence-enroll.test.ts
 *
 * Integration tests for POST /api/sequences/:id/enroll
 * Tests enrollment logic, activity logging, and immediate send for delay_days=0.
 *
 * Status: Should PASS with existing code.
 *
 * Run: pnpm test tests/integration/sequence-enroll.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../server/utils/tenant', () => ({
  requireTenantContext: vi.fn().mockResolvedValue({ userId: 'user-1', tenantId: 'tenant-1' }),
}))

vi.mock('../../../server/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'email-1' }),
  interpolateTemplate: vi.fn((t: string) => t),
  buildLeadEmailVars: vi.fn(() => ({ first_name: 'Jane' })),
  getTenantReviewUrl: vi.fn().mockResolvedValue(''),
}))

const mockUpsert = vi.fn().mockReturnThis()
const mockSelectChain = vi.fn().mockReturnThis()
const mockEqChain = vi.fn().mockReturnThis()
const mockSingleChain = vi.fn()
const mockInsertChain = vi.fn().mockResolvedValue({ error: null })
const mockFromFn = vi.fn()

vi.mock('../../../server/lib/supabase', () => ({
  useSupabaseAdmin: vi.fn(() => ({ from: mockFromFn })),
}))

function setupSequenceDb({
  sequenceExists = true,
  sequenceActive = true,
  leadExists = true,
  steps = [{ id: 'step-1', step_order: 0, delay_days: 1, subject: 'Hi', body_html: '<p>Hi</p>', body_text: 'Hi' }],
  upsertError = null,
}: any = {}) {
  mockFromFn.mockImplementation((table: string) => {
    if (table === 'email_sequences') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: sequenceExists
                  ? { id: 'seq-1', name: 'Test Sequence', is_active: sequenceActive, steps }
                  : null,
                error: null,
              })
            })
          })
        })
      }
    }
    if (table === 'leads') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: leadExists
                  ? { id: 'lead-1', email: 'jane@test.com', full_name: 'Jane Smith' }
                  : null,
                error: null,
              })
            })
          })
        })
      }
    }
    if (table === 'sequence_enrollments') {
      return {
        upsert: vi.fn(() => ({
          select: () => ({
            single: vi.fn().mockResolvedValue(
              upsertError
                ? { data: null, error: upsertError }
                : { data: { id: 'enrollment-1' }, error: null }
            )
          })
        }))
      }
    }
    if (table === 'lead_activities') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    if (table === 'tenants') {
      return { select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: { name: 'Test' } }) }) }) }
    }
    if (table === 'tenant_settings') {
      return { select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: null }) }) }) }
    }
    if (table === 'email_templates') {
      return { select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: null }) }) }) }
    }
    if (table === 'email_sends') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
  })
}

describe('POST /api/sequences/:id/enroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSequenceDb()
  })

  it('handler exports a function', async () => {
    const mod = await import('../../../server/api/sequences/[id]/enroll.post')
    expect(typeof mod.default).toBe('function')
  })

  it('rejects missing lead_id with 400', async () => {
    const { default: handler } = await import('../../../server/api/sequences/[id]/enroll.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('seq-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({}) // no lead_id

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 404 when sequence not found', async () => {
    setupSequenceDb({ sequenceExists: false })
    const { default: handler } = await import('../../../server/api/sequences/[id]/enroll.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('nonexistent')
    vi.mocked(globalThis.readBody).mockResolvedValue({ lead_id: 'lead-1' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 400 when sequence is not active', async () => {
    setupSequenceDb({ sequenceActive: false })
    const { default: handler } = await import('../../../server/api/sequences/[id]/enroll.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('seq-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ lead_id: 'lead-1' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 404 when lead not found', async () => {
    setupSequenceDb({ leadExists: false })
    const { default: handler } = await import('../../../server/api/sequences/[id]/enroll.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('seq-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ lead_id: 'lead-ghost' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns ok:true and enrollment_id on success', async () => {
    const { default: handler } = await import('../../../server/api/sequences/[id]/enroll.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('seq-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ lead_id: 'lead-1' })

    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true, enrollment_id: 'enrollment-1' })
  })

  it('returns next_send_at based on first step delay_days', async () => {
    setupSequenceDb({
      steps: [{ id: 'step-1', step_order: 0, delay_days: 3, subject: 'Hi', body_html: '<p>Hi</p>' }]
    })
    const { default: handler } = await import('../../../server/api/sequences/[id]/enroll.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('seq-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ lead_id: 'lead-1' })

    const before = Date.now()
    const result = await handler({} as any)
    const after = Date.now()

    expect(result.next_send_at).toBeTruthy()
    const nextSend = new Date(result.next_send_at).getTime()
    const expectedMin = before + 3 * 86400_000 - 1000
    const expectedMax = after + 3 * 86400_000 + 1000
    expect(nextSend).toBeGreaterThanOrEqual(expectedMin)
    expect(nextSend).toBeLessThanOrEqual(expectedMax)
  })

  it('sends email immediately when first step has delay_days = 0', async () => {
    const { sendEmail } = await import('../../../server/lib/email')
    setupSequenceDb({
      steps: [{ id: 'step-1', step_order: 0, delay_days: 0, subject: 'Welcome!', body_html: '<p>Welcome</p>', body_text: 'Welcome' }]
    })

    const { default: handler } = await import('../../../server/api/sequences/[id]/enroll.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('seq-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ lead_id: 'lead-1' })

    await handler({} as any)

    // Give non-blocking async a tick to run
    await new Promise(r => setTimeout(r, 50))
    expect(vi.mocked(sendEmail)).toHaveBeenCalled()
  })
})
