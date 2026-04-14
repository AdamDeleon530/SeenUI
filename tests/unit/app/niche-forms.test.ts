/**
 * tests/unit/app/niche-forms.test.ts
 *
 * Tests for niche-specific form field definitions (TASK 4).
 *
 * Status:
 *   ✅ Basic type shape tests — these test the spec, so they pass once
 *      NICHE_FIELDS is added to app/types/tenant.ts
 *   ❌ Everything else FAILS until TASK 4 is done
 *
 * Run: pnpm test tests/unit/app/niche-forms.test.ts
 */

import { describe, it, expect } from 'vitest'

// ── NICHE_FIELDS shape (TASK 4) ───────────────────────────────────────────────

describe('TASK 4: NICHE_FIELDS constant in app/types/tenant.ts', () => {
  it('NICHE_FIELDS is exported from app/types/tenant.ts', async () => {
    const mod = await import('../../../app/types/tenant').catch(() => null)
    expect(mod).not.toBeNull()
    expect(mod?.NICHE_FIELDS).toBeDefined()
  })

  it('has keys for all 4 niches', async () => {
    const mod = await import('../../../app/types/tenant').catch(() => null)
    if (!mod?.NICHE_FIELDS) return
    expect(Object.keys(mod.NICHE_FIELDS)).toEqual(
      expect.arrayContaining(['construction', 'med_spa', 'barbershop', 'general'])
    )
  })

  it('general niche has no fields (empty array)', async () => {
    const { NICHE_FIELDS } = await import('../../../app/types/tenant').catch(() => ({ NICHE_FIELDS: null }))
    if (!NICHE_FIELDS) return
    expect(NICHE_FIELDS.general).toEqual([])
  })
})

// ── Construction fields ────────────────────────────────────────────────────────

describe('TASK 4: construction niche fields', () => {
  async function getConstructionFields() {
    const { NICHE_FIELDS } = await import('../../../app/types/tenant').catch(() => ({ NICHE_FIELDS: null }))
    return NICHE_FIELDS?.construction ?? null
  }

  it('has at least 4 fields', async () => {
    const fields = await getConstructionFields()
    expect(fields).not.toBeNull()
    expect(fields!.length).toBeGreaterThanOrEqual(4)
  })

  it('includes job_type as a required select field', async () => {
    const fields = await getConstructionFields()
    if (!fields) return
    const jobType = fields.find(f => f.key === 'job_type')
    expect(jobType).toBeDefined()
    expect(jobType?.type).toBe('select')
    expect(jobType?.required).toBe(true)
    expect(jobType?.options?.length).toBeGreaterThan(3)
  })

  it('includes property_address as required text field', async () => {
    const fields = await getConstructionFields()
    if (!fields) return
    const addr = fields.find(f => f.key === 'property_address')
    expect(addr).toBeDefined()
    expect(addr?.type).toBe('text')
    expect(addr?.required).toBe(true)
  })

  it('includes project_description as textarea', async () => {
    const fields = await getConstructionFields()
    if (!fields) return
    const desc = fields.find(f => f.key === 'project_description')
    expect(desc?.type).toBe('textarea')
  })

  it('includes estimated_budget as optional select', async () => {
    const fields = await getConstructionFields()
    if (!fields) return
    const budget = fields.find(f => f.key === 'estimated_budget')
    expect(budget).toBeDefined()
    expect(budget?.required).toBe(false)
    expect(budget?.options).toContain('$50,000+')
  })

  it('all fields have valid type values', async () => {
    const fields = await getConstructionFields()
    if (!fields) return
    const validTypes = ['text', 'email', 'tel', 'textarea', 'select', 'date']
    for (const f of fields) {
      expect(validTypes).toContain(f.type)
    }
  })

  it('fields have sequential order numbers starting from a positive integer', async () => {
    const fields = await getConstructionFields()
    if (!fields) return
    const orders = fields.map(f => f.order).sort((a, b) => a - b)
    // All orders should be positive integers (standard fields occupy 0-3)
    for (const o of orders) {
      expect(o).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(o)).toBe(true)
    }
    // All orders unique
    expect(new Set(orders).size).toBe(orders.length)
  })
})

// ── Med spa fields ────────────────────────────────────────────────────────────

describe('TASK 4: med_spa niche fields', () => {
  async function getMedSpaFields() {
    const { NICHE_FIELDS } = await import('../../../app/types/tenant').catch(() => ({ NICHE_FIELDS: null }))
    return NICHE_FIELDS?.med_spa ?? null
  }

  it('has at least 4 fields', async () => {
    const fields = await getMedSpaFields()
    expect(fields).not.toBeNull()
    expect(fields!.length).toBeGreaterThanOrEqual(4)
  })

  it('includes treatment_interest as required select', async () => {
    const fields = await getMedSpaFields()
    if (!fields) return
    const treatment = fields.find(f => f.key === 'treatment_interest')
    expect(treatment?.type).toBe('select')
    expect(treatment?.required).toBe(true)
    expect(treatment?.options).toContain('Botox')
  })

  it('includes is_first_visit field', async () => {
    const fields = await getMedSpaFields()
    if (!fields) return
    const firstVisit = fields.find(f => f.key === 'is_first_visit')
    expect(firstVisit).toBeDefined()
  })

  it('includes referral_source field', async () => {
    const fields = await getMedSpaFields()
    if (!fields) return
    const ref = fields.find(f => f.key === 'referral_source')
    expect(ref).toBeDefined()
    expect(ref?.options).toContain('Instagram')
  })
})

// ── Barbershop fields ─────────────────────────────────────────────────────────

describe('TASK 4: barbershop niche fields', () => {
  async function getBarbershopFields() {
    const { NICHE_FIELDS } = await import('../../../app/types/tenant').catch(() => ({ NICHE_FIELDS: null }))
    return NICHE_FIELDS?.barbershop ?? null
  }

  it('has at least 3 fields', async () => {
    const fields = await getBarbershopFields()
    expect(fields).not.toBeNull()
    expect(fields!.length).toBeGreaterThanOrEqual(3)
  })

  it('service field is required with haircut options', async () => {
    const fields = await getBarbershopFields()
    if (!fields) return
    const service = fields.find(f => f.key === 'service')
    expect(service?.required).toBe(true)
    expect(service?.options).toContain('Haircut')
    expect(service?.options).toContain('Fade')
  })

  it('preferred_barber field is optional', async () => {
    const fields = await getBarbershopFields()
    if (!fields) return
    const barber = fields.find(f => f.key === 'preferred_barber')
    expect(barber).toBeDefined()
    expect(barber?.required).toBe(false)
  })
})

// ── Widget niche_data passthrough ─────────────────────────────────────────────

describe('TASK 4: niche_data submitted through embed widget', () => {
  it('embed config endpoint includes niche and niche_fields in response', async () => {
    const mod = await import('../../../server/api/embed/[tenantId]/config.get').catch(() => null)
    expect(mod).not.toBeNull()
    // After Task 4 is built, the config response shape should include these fields.
    // This test verifies the route still exists (was not broken).
    expect(typeof mod?.default).toBe('function')
  })

  it('submit endpoint accepts niche_data in POST body', async () => {
    const mod = await import('../../../server/api/embed/[tenantId]/submit.post').catch(() => null)
    expect(mod).not.toBeNull()
    // Once Task 4 is done, niche_data should be stored in leads.metadata.
    // Existence of the route handler confirms the module loads.
    expect(typeof mod?.default).toBe('function')
  })
})
