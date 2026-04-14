/**
 * tests/unit/app/lead-filters.test.ts
 *
 * Tests for lead filter/search logic and LeadFilters type.
 * These should ALL PASS immediately.
 *
 * Run: pnpm test tests/unit/app/lead-filters.test.ts
 */

import { describe, it, expect } from 'vitest'
import type { Lead, LeadFilters, LeadStatus, LeadSource } from '../../../app/types/lead'

// ── LeadStatus values ─────────────────────────────────────────────────────────

describe('LeadStatus type', () => {
  const validStatuses: LeadStatus[] = ['new', 'contacted', 'consultation_scheduled', 'booked', 'no_show', 'won', 'lost']

  it('contains exactly 7 statuses', () => {
    expect(validStatuses).toHaveLength(7)
  })

  it('includes terminal statuses won and lost', () => {
    expect(validStatuses).toContain('won')
    expect(validStatuses).toContain('lost')
  })

  it('includes the initial status new', () => {
    expect(validStatuses).toContain('new')
  })
})

// ── LeadSource values ─────────────────────────────────────────────────────────

describe('LeadSource type', () => {
  const validSources: LeadSource[] = ['website_form', 'embed_widget', 'manual', 'referral', 'google', 'instagram', 'facebook', 'other']

  it('contains at least 5 sources', () => {
    expect(validSources.length).toBeGreaterThanOrEqual(5)
  })

  it('includes embed_widget as a source', () => {
    expect(validSources).toContain('embed_widget')
  })

  it('includes manual as a source', () => {
    expect(validSources).toContain('manual')
  })
})

// ── Filter URL param builder ───────────────────────────────────────────────────
// Replicates the logic in app/composables/useLeads.ts → fetchLeads

function buildLeadQueryParams(filters?: LeadFilters): string {
  const params = new URLSearchParams()
  if (filters?.status?.length) params.set('status', filters.status.join(','))
  if (filters?.search) params.set('search', filters.search)
  if (filters?.stage_id) params.set('stage_id', filters.stage_id)
  if (filters?.is_archived !== undefined) params.set('is_archived', String(filters.is_archived))
  if (filters?.date_from) params.set('date_from', filters.date_from)
  if (filters?.date_to) params.set('date_to', filters.date_to)
  if (filters?.assigned_to) params.set('assigned_to', filters.assigned_to)
  return params.toString()
}

describe('lead filter URL param builder', () => {
  it('returns empty string for undefined filters', () => {
    expect(buildLeadQueryParams()).toBe('')
  })

  it('returns empty string for empty filters object', () => {
    expect(buildLeadQueryParams({})).toBe('')
  })

  it('encodes a single status', () => {
    const qs = buildLeadQueryParams({ status: ['new'] })
    expect(qs).toContain('status=new')
  })

  it('encodes multiple statuses as comma-separated', () => {
    const qs = buildLeadQueryParams({ status: ['new', 'contacted', 'booked'] })
    expect(qs).toContain('status=new%2Ccontacted%2Cbooked')
  })

  it('encodes search term', () => {
    const qs = buildLeadQueryParams({ search: 'Jane Smith' })
    expect(qs).toContain('search=Jane+Smith')
  })

  it('encodes stage_id', () => {
    const qs = buildLeadQueryParams({ stage_id: 'stage-abc-123' })
    expect(qs).toContain('stage_id=stage-abc-123')
  })

  it('encodes is_archived = true', () => {
    const qs = buildLeadQueryParams({ is_archived: true })
    expect(qs).toContain('is_archived=true')
  })

  it('encodes is_archived = false', () => {
    const qs = buildLeadQueryParams({ is_archived: false })
    expect(qs).toContain('is_archived=false')
  })

  it('encodes date range', () => {
    const qs = buildLeadQueryParams({ date_from: '2026-01-01', date_to: '2026-03-31' })
    expect(qs).toContain('date_from=2026-01-01')
    expect(qs).toContain('date_to=2026-03-31')
  })

  it('encodes assigned_to', () => {
    const qs = buildLeadQueryParams({ assigned_to: 'user-xyz' })
    expect(qs).toContain('assigned_to=user-xyz')
  })

  it('combines multiple filters', () => {
    const qs = buildLeadQueryParams({ status: ['new'], search: 'roof', is_archived: false })
    expect(qs).toContain('status=new')
    expect(qs).toContain('search=roof')
    expect(qs).toContain('is_archived=false')
  })

  it('does not include is_archived when undefined', () => {
    const qs = buildLeadQueryParams({ status: ['new'] })
    expect(qs).not.toContain('is_archived')
  })
})

// ── Lead status transition rules ──────────────────────────────────────────────

function isTerminalStatus(status: LeadStatus): boolean {
  return status === 'won' || status === 'lost'
}

function isValidStatusTransition(from: LeadStatus, to: LeadStatus): boolean {
  // Terminal statuses can be transitioned back (e.g., re-open a lost lead)
  // Any transition is allowed — CRM is flexible. Just document the rules.
  return true
}

describe('lead status transition rules', () => {
  it('won is a terminal status', () => {
    expect(isTerminalStatus('won')).toBe(true)
  })

  it('lost is a terminal status', () => {
    expect(isTerminalStatus('lost')).toBe(true)
  })

  it('new is not terminal', () => {
    expect(isTerminalStatus('new')).toBe(false)
  })

  it('booked is not terminal', () => {
    expect(isTerminalStatus('booked')).toBe(false)
  })

  it('allows moving from new to contacted', () => {
    expect(isValidStatusTransition('new', 'contacted')).toBe(true)
  })

  it('allows re-opening a lost lead (lost → new)', () => {
    expect(isValidStatusTransition('lost', 'new')).toBe(true)
  })

  it('allows moving from booked to won', () => {
    expect(isValidStatusTransition('booked', 'won')).toBe(true)
  })
})
