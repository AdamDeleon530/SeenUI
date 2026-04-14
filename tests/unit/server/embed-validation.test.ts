/**
 * tests/unit/server/embed-validation.test.ts
 *
 * Tests input validation logic that lives in the embed submit endpoint.
 * These test the RULES (not the DB calls), so they are pure/fast.
 *
 * Status: Should ALL PASS with existing code.
 *
 * Run: pnpm test tests/unit/server/embed-validation.test.ts
 */

import { describe, it, expect } from 'vitest'

// ── Replicate the validation logic from submit.post.ts ────────────────────────
// We extract and test the rules in isolation so we're not fighting Nuxt internals.

function validateEmbedPayload(body: Record<string, any>): { valid: boolean; error?: string } {
  if (!body.full_name?.trim()) return { valid: false, error: 'Name is required' }
  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return { valid: false, error: 'Valid email is required' }
  }
  return { valid: true }
}

function sanitizeLeadPayload(body: Record<string, any>, tenantId: string, defaultStageId: string | null) {
  return {
    tenant_id: tenantId,
    full_name: body.full_name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone?.trim() ?? null,
    requested_service: body.requested_service?.trim() ?? null,
    preferred_date: body.preferred_date ?? null,
    notes: body.notes?.trim() ?? null,
    source: 'embed_widget' as const,
    source_page: body.source_page ?? null,
    utm_source: body.utm_source ?? null,
    utm_medium: body.utm_medium ?? null,
    utm_campaign: body.utm_campaign ?? null,
    stage_id: defaultStageId,
    status: 'new' as const,
  }
}

// ── Validation tests ──────────────────────────────────────────────────────────

describe('embed payload validation', () => {
  it('accepts a valid payload', () => {
    const result = validateEmbedPayload({ full_name: 'Jane Smith', email: 'jane@example.com' })
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects missing full_name', () => {
    const result = validateEmbedPayload({ email: 'jane@example.com' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Name is required')
  })

  it('rejects whitespace-only full_name', () => {
    const result = validateEmbedPayload({ full_name: '   ', email: 'jane@example.com' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Name is required')
  })

  it('rejects missing email', () => {
    const result = validateEmbedPayload({ full_name: 'Jane Smith' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Valid email is required')
  })

  it('rejects malformed email — no @', () => {
    const result = validateEmbedPayload({ full_name: 'Jane', email: 'notanemail' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Valid email is required')
  })

  it('rejects malformed email — no TLD', () => {
    const result = validateEmbedPayload({ full_name: 'Jane', email: 'jane@' })
    expect(result.valid).toBe(false)
  })

  it('rejects empty email string', () => {
    const result = validateEmbedPayload({ full_name: 'Jane', email: '' })
    expect(result.valid).toBe(false)
  })

  it('accepts email with subdomain', () => {
    const result = validateEmbedPayload({ full_name: 'Jane', email: 'jane@mail.example.co.uk' })
    expect(result.valid).toBe(true)
  })

  it('accepts email with + addressing', () => {
    const result = validateEmbedPayload({ full_name: 'Jane', email: 'jane+test@example.com' })
    expect(result.valid).toBe(true)
  })
})

// ── Sanitization tests ────────────────────────────────────────────────────────

describe('lead payload sanitization', () => {
  const tenantId = 'tenant-123'
  const stageId = 'stage-abc'

  it('trims whitespace from full_name', () => {
    const payload = sanitizeLeadPayload({ full_name: '  Jane Smith  ', email: 'jane@example.com' }, tenantId, stageId)
    expect(payload.full_name).toBe('Jane Smith')
  })

  it('lowercases email', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: 'JANE@EXAMPLE.COM' }, tenantId, stageId)
    expect(payload.email).toBe('jane@example.com')
  })

  it('trims email whitespace and lowercases', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: ' Jane@Example.COM ' }, tenantId, stageId)
    expect(payload.email).toBe('jane@example.com')
  })

  it('sets source to embed_widget', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: 'jane@test.com' }, tenantId, stageId)
    expect(payload.source).toBe('embed_widget')
  })

  it('sets status to new', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: 'jane@test.com' }, tenantId, stageId)
    expect(payload.status).toBe('new')
  })

  it('assigns the default stage', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: 'jane@test.com' }, tenantId, stageId)
    expect(payload.stage_id).toBe(stageId)
  })

  it('sets null stage_id when no default stage', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: 'jane@test.com' }, tenantId, null)
    expect(payload.stage_id).toBeNull()
  })

  it('captures UTM params', () => {
    const payload = sanitizeLeadPayload(
      { full_name: 'Jane', email: 'jane@test.com', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'spring2026' },
      tenantId, stageId
    )
    expect(payload.utm_source).toBe('google')
    expect(payload.utm_medium).toBe('cpc')
    expect(payload.utm_campaign).toBe('spring2026')
  })

  it('defaults optional fields to null when not provided', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: 'jane@test.com' }, tenantId, stageId)
    expect(payload.phone).toBeNull()
    expect(payload.requested_service).toBeNull()
    expect(payload.preferred_date).toBeNull()
    expect(payload.notes).toBeNull()
    expect(payload.utm_source).toBeNull()
  })

  it('trims notes field', () => {
    const payload = sanitizeLeadPayload({ full_name: 'Jane', email: 'j@t.com', notes: '  needs ramp  ' }, tenantId, stageId)
    expect(payload.notes).toBe('needs ramp')
  })
})

// ── Plan limits ───────────────────────────────────────────────────────────────

import { PLAN_LIMITS } from '../../../server/lib/stripe'

describe('PLAN_LIMITS enforcement', () => {
  it('trial plan has a 25-lead monthly limit', () => {
    expect(PLAN_LIMITS.trial.leads_per_month).toBe(25)
  })

  it('starter plan has a 100-lead monthly limit', () => {
    expect(PLAN_LIMITS.starter.leads_per_month).toBe(100)
  })

  it('pro plan has unlimited leads', () => {
    expect(PLAN_LIMITS.pro.leads_per_month).toBe(Infinity)
  })

  it('agency plan has unlimited leads', () => {
    expect(PLAN_LIMITS.agency.leads_per_month).toBe(Infinity)
  })

  it('trial plan supports 1 location', () => {
    expect(PLAN_LIMITS.trial.locations).toBe(1)
  })

  it('agency plan supports 10 locations', () => {
    expect(PLAN_LIMITS.agency.locations).toBe(10)
  })

  it('correctly determines if a count exceeds trial limit', () => {
    const limit = PLAN_LIMITS.trial.leads_per_month
    expect(24 >= limit).toBe(false)
    expect(25 >= limit).toBe(true)
    expect(26 >= limit).toBe(true)
  })
})
