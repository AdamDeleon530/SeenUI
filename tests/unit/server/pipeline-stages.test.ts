/**
 * tests/unit/server/pipeline-stages.test.ts
 *
 * Tests pipeline stage logic — default stage seeding and CRUD rules.
 *
 * Status:
 *   ✅ DEFAULT_PIPELINE_STAGES shape tests — PASS immediately
 *   ❌ Stage CRUD API tests — FAIL until TASK 5 (pipeline customization) is built
 *
 * Run: pnpm test tests/unit/server/pipeline-stages.test.ts
 */

import { describe, it, expect, vi } from 'vitest'
import { DEFAULT_PIPELINE_STAGES } from '../../../app/types/pipeline'

// ── DEFAULT_PIPELINE_STAGES (existing code — should PASS) ───────────────────

describe('DEFAULT_PIPELINE_STAGES', () => {
  it('has exactly 6 default stages', () => {
    expect(DEFAULT_PIPELINE_STAGES).toHaveLength(6)
  })

  it('has exactly one default stage', () => {
    const defaults = DEFAULT_PIPELINE_STAGES.filter(s => s.is_default)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].name).toBe('New Lead')
  })

  it('has exactly two terminal stages (Won and Lost)', () => {
    const terminals = DEFAULT_PIPELINE_STAGES.filter(s => s.is_terminal)
    expect(terminals).toHaveLength(2)
    const names = terminals.map(s => s.name)
    expect(names).toContain('Won')
    expect(names).toContain('Lost')
  })

  it('stages are ordered 0 through 5', () => {
    const orders = DEFAULT_PIPELINE_STAGES.map(s => s.order).sort((a, b) => a - b)
    expect(orders).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('every stage has a hex color', () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/
    for (const stage of DEFAULT_PIPELINE_STAGES) {
      expect(stage.color).toMatch(hexPattern)
    }
  })

  it('non-terminal stages have is_terminal = false', () => {
    const nonTerminal = DEFAULT_PIPELINE_STAGES.filter(s => !s.is_terminal)
    for (const stage of nonTerminal) {
      expect(stage.is_terminal).toBe(false)
    }
  })

  it('stage names match expected pipeline flow', () => {
    const names = DEFAULT_PIPELINE_STAGES.map(s => s.name)
    expect(names).toContain('New Lead')
    expect(names).toContain('Contacted')
    expect(names).toContain('Consultation Scheduled')
    expect(names).toContain('Booked')
    expect(names).toContain('Won')
    expect(names).toContain('Lost')
  })
})

// ── Stage CRUD validation helpers ────────────────────────────────────────────
// These test the validation rules that TASK 5 must enforce in the new API routes.

function validateCreateStage(body: any): { valid: boolean; error?: string } {
  // TODO (TASK 5): Import this from the actual route once built.
  // For now, define expected behavior here so the test acts as a spec.
  if (!body.name?.trim()) return { valid: false, error: 'name is required' }
  if (body.name.trim().length > 50) return { valid: false, error: 'name must be 50 characters or fewer' }
  if (body.color && !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
    return { valid: false, error: 'color must be a valid hex color (e.g. #6172f3)' }
  }
  return { valid: true }
}

function validateReorderPayload(stages: any[]): { valid: boolean; error?: string } {
  // TODO (TASK 5): Import from actual route once built.
  if (!Array.isArray(stages) || stages.length === 0) {
    return { valid: false, error: 'stages array is required and must not be empty' }
  }
  for (const s of stages) {
    if (!s.id || typeof s.order !== 'number') {
      return { valid: false, error: 'each stage must have id (string) and order (number)' }
    }
  }
  return { valid: true }
}

describe('stage creation validation', () => {
  it('accepts a valid stage name', () => {
    expect(validateCreateStage({ name: 'Proposal Sent' }).valid).toBe(true)
  })

  it('rejects empty name', () => {
    const r = validateCreateStage({ name: '' })
    expect(r.valid).toBe(false)
    expect(r.error).toContain('required')
  })

  it('rejects whitespace-only name', () => {
    expect(validateCreateStage({ name: '   ' }).valid).toBe(false)
  })

  it('rejects name over 50 characters', () => {
    const r = validateCreateStage({ name: 'A'.repeat(51) })
    expect(r.valid).toBe(false)
    expect(r.error).toContain('50')
  })

  it('accepts valid hex color', () => {
    expect(validateCreateStage({ name: 'Test', color: '#6172f3' }).valid).toBe(true)
  })

  it('rejects invalid hex color', () => {
    const r = validateCreateStage({ name: 'Test', color: 'indigo' })
    expect(r.valid).toBe(false)
    expect(r.error).toContain('hex')
  })

  it('accepts stage without color (optional)', () => {
    expect(validateCreateStage({ name: 'Test Stage' }).valid).toBe(true)
  })
})

describe('stage reorder validation', () => {
  it('accepts a valid reorder payload', () => {
    const r = validateReorderPayload([
      { id: 'stage-1', order: 0 },
      { id: 'stage-2', order: 1 },
    ])
    expect(r.valid).toBe(true)
  })

  it('rejects empty array', () => {
    expect(validateReorderPayload([]).valid).toBe(false)
  })

  it('rejects non-array', () => {
    expect(validateReorderPayload('not-array' as any).valid).toBe(false)
  })

  it('rejects stage without id', () => {
    const r = validateReorderPayload([{ order: 0 }])
    expect(r.valid).toBe(false)
  })

  it('rejects stage with non-numeric order', () => {
    const r = validateReorderPayload([{ id: 'stage-1', order: 'first' }])
    expect(r.valid).toBe(false)
  })
})

// ── TASK 5 — Stage API Routes (WILL FAIL until Task 5 is built) ──────────────
// These tests import the actual route handlers. They will fail with
// "Cannot find module" until you create the files.

describe('TASK 5: Stage CRUD API routes', () => {
  it('POST /api/pipeline/stages — creates a new stage (FAIL until Task 5)', async () => {
    // This import will fail until server/api/pipeline/stages.post.ts exists
    const { default: handler } = await import('../../../server/api/pipeline/stages.post').catch(() => ({ default: null }))
    expect(handler).not.toBeNull()
  })

  it('PATCH /api/pipeline/stages/[id] — renames a stage (FAIL until Task 5)', async () => {
    const { default: handler } = await import('../../../server/api/pipeline/stages/[id].patch').catch(() => ({ default: null }))
    expect(handler).not.toBeNull()
  })

  it('DELETE /api/pipeline/stages/[id] — deletes a stage (FAIL until Task 5)', async () => {
    const { default: handler } = await import('../../../server/api/pipeline/stages/[id].delete').catch(() => ({ default: null }))
    expect(handler).not.toBeNull()
  })

  it('POST /api/pipeline/stages/reorder — reorders stages (FAIL until Task 5)', async () => {
    const { default: handler } = await import('../../../server/api/pipeline/stages/reorder.post').catch(() => ({ default: null }))
    expect(handler).not.toBeNull()
  })
})
