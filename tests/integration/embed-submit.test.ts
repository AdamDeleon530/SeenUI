/**
 * tests/integration/embed-submit.test.ts
 *
 * Integration tests for POST /api/embed/:tenantId/submit
 * Mocks the Supabase admin client and email lib to test the full
 * handler logic without hitting the real DB or sending real emails.
 *
 * Status: Should PASS with existing code.
 *
 * Run: pnpm test tests/integration/embed-submit.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock Supabase admin client
const mockInsert = vi.fn().mockResolvedValue({ data: { id: 'lead-new-1' }, error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'stage-default' }, error: null })
const mockSelect = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockFrom = vi.fn()

vi.mock('../../server/lib/supabase', () => ({
  useSupabaseAdmin: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('../../server/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'email-1' }),
  interpolateTemplate: vi.fn((t: string) => t),
  buildLeadEmailVars: vi.fn(() => ({})),
  getTenantReviewUrl: vi.fn().mockResolvedValue('https://review.link'),
}))

// ── Helper: build a fake event ────────────────────────────────────────────────

function makeEvent(tenantId: string, body: Record<string, any>) {
  return {
    __tenantId: tenantId,
    __body: body,
  }
}

// ── Set up mock DB responses ──────────────────────────────────────────────────

function setupMockDb({
  tenantActive = true,
  plan = 'starter',
  leadCount = 0,
  insertError = null,
}: {
  tenantActive?: boolean
  plan?: string
  leadCount?: number
  insertError?: any
} = {}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'tenants') {
      return {
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'tenant-1',
                name: 'Test Business',
                notification_email: 'owner@test.com',
                status: tenantActive ? 'active' : 'suspended',
                plan,
                subscription_status: 'active',
                trial_ends_at: null,
                is_billing_exempt: false,
              },
              error: null,
            })
          })
        })
      }
    }
    if (table === 'tenant_settings') {
      return {
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      }
    }
    if (table === 'pipeline_stages') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: 'stage-default' }, error: null })
            })
          })
        })
      }
    }
    if (table === 'leads') {
      if (leadCount > 0) {
        // For plan limit check
        return {
          select: () => ({
            eq: () => ({
              gte: vi.fn().mockResolvedValue({ count: leadCount, error: null })
            })
          }),
          insert: () => ({
            select: () => ({
              single: vi.fn().mockResolvedValue(
                insertError
                  ? { data: null, error: insertError }
                  : { data: { id: 'lead-new-1', full_name: 'Jane Smith', email: 'jane@test.com' }, error: null }
              )
            })
          })
        }
      }
      return {
        select: () => ({ eq: () => ({ gte: vi.fn().mockResolvedValue({ count: 0 }) }) }),
        insert: () => ({
          select: () => ({
            single: vi.fn().mockResolvedValue(
              insertError
                ? { data: null, error: insertError }
                : { data: { id: 'lead-new-1', full_name: 'Jane Smith', email: 'jane@test.com' }, error: null }
            )
          })
        })
      }
    }
    if (table === 'lead_activities') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    if (table === 'email_templates') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
      }
    }
    if (table === 'email_sends') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), insert: vi.fn().mockResolvedValue({ error: null }) }
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/embed/:tenantId/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMockDb()
  })

  it('handler file exports a function', async () => {
    const mod = await import('../../server/api/embed/[tenantId]/submit.post')
    expect(typeof mod.default).toBe('function')
  })

  it('validates that full_name is required', async () => {
    const { default: handler } = await import('../../server/api/embed/[tenantId]/submit.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('tenant-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ email: 'jane@test.com' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('validates that email is required', async () => {
    const { default: handler } = await import('../../server/api/embed/[tenantId]/submit.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('tenant-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ full_name: 'Jane Smith' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('validates email format', async () => {
    const { default: handler } = await import('../../server/api/embed/[tenantId]/submit.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('tenant-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ full_name: 'Jane', email: 'not-an-email' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 404 for inactive/suspended tenant', async () => {
    setupMockDb({ tenantActive: false })
    const { default: handler } = await import('../../server/api/embed/[tenantId]/submit.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('tenant-inactive')
    vi.mocked(globalThis.readBody).mockResolvedValue({ full_name: 'Jane', email: 'jane@test.com' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 429 when trial lead limit is exceeded', async () => {
    setupMockDb({ plan: 'trial', leadCount: 26 })
    const { default: handler } = await import('../../server/api/embed/[tenantId]/submit.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('tenant-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ full_name: 'Jane', email: 'jane@test.com' })

    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('returns success message on valid submission', async () => {
    const { default: handler } = await import('../../server/api/embed/[tenantId]/submit.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('tenant-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ full_name: 'Jane Smith', email: 'jane@test.com' })

    const result = await handler({} as any)
    expect(result).toMatchObject({ success: true })
    expect(result.message).toBeTruthy()
  })

  it('does not expose internal lead ID in response', async () => {
    const { default: handler } = await import('../../server/api/embed/[tenantId]/submit.post')
    vi.mocked(globalThis.getRouterParam).mockReturnValue('tenant-1')
    vi.mocked(globalThis.readBody).mockResolvedValue({ full_name: 'Jane Smith', email: 'jane@test.com' })

    const result = await handler({} as any)
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('tenant_id')
  })
})
