/**
 * tests/unit/server/email.test.ts
 *
 * Tests for server/lib/email.ts — pure utility functions.
 * These should ALL PASS immediately. They test existing, working code.
 *
 * Run: pnpm test tests/unit/server/email.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test the pure utility functions directly without needing Nuxt
import { interpolateTemplate, buildLeadEmailVars } from '../../../server/lib/email'

// ── interpolateTemplate ──────────────────────────────────────────────────────

describe('interpolateTemplate', () => {
  it('replaces a single variable', () => {
    const result = interpolateTemplate('Hello {{first_name}}!', { first_name: 'Jane' })
    expect(result).toBe('Hello Jane!')
  })

  it('replaces multiple variables in one pass', () => {
    const result = interpolateTemplate(
      'Hi {{first_name}}, your {{requested_service}} appointment is on {{preferred_date}}.',
      { first_name: 'Jane', requested_service: 'Botox', preferred_date: '2026-05-01' }
    )
    expect(result).toBe('Hi Jane, your Botox appointment is on 2026-05-01.')
  })

  it('replaces the same variable multiple times', () => {
    const result = interpolateTemplate('{{first_name}} is {{first_name}}', { first_name: 'Jane' })
    expect(result).toBe('Jane is Jane')
  })

  it('replaces missing variables with empty string', () => {
    const result = interpolateTemplate('Hello {{first_name}}!', {})
    expect(result).toBe('Hello !')
  })

  it('replaces null variable with empty string', () => {
    const result = interpolateTemplate('Phone: {{lead_phone}}', { lead_phone: null })
    expect(result).toBe('Phone: ')
  })

  it('replaces undefined variable with empty string', () => {
    const result = interpolateTemplate('{{missing}}', { missing: undefined })
    expect(result).toBe('')
  })

  it('does not corrupt non-template content', () => {
    const html = '<p>Hello <strong>World</strong> &amp; Co.</p>'
    const result = interpolateTemplate(html, {})
    expect(result).toBe(html)
  })

  it('handles empty template string', () => {
    expect(interpolateTemplate('', { first_name: 'Jane' })).toBe('')
  })

  it('handles template with no variables', () => {
    const template = 'No variables here.'
    expect(interpolateTemplate(template, { first_name: 'Jane' })).toBe(template)
  })
})

// ── buildLeadEmailVars ───────────────────────────────────────────────────────

describe('buildLeadEmailVars', () => {
  const baseLead = {
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+15551234567',
    requested_service: 'Botox',
    preferred_date: '2026-05-01',
  }

  it('extracts first name correctly for single-word name', () => {
    const vars = buildLeadEmailVars({ ...baseLead, full_name: 'Jane' }, 'Test Spa', 'http://localhost:3000', 'lead-123')
    expect(vars.first_name).toBe('Jane')
  })

  it('extracts first name from full name', () => {
    const vars = buildLeadEmailVars(baseLead, 'Test Spa', 'http://localhost:3000', 'lead-123')
    expect(vars.first_name).toBe('Jane')
  })

  it('includes business_name', () => {
    const vars = buildLeadEmailVars(baseLead, 'Glow Med Spa', 'http://localhost:3000', 'lead-123')
    expect(vars.business_name).toBe('Glow Med Spa')
  })

  it('builds lead_url from appUrl and leadId', () => {
    const vars = buildLeadEmailVars(baseLead, 'Spa', 'https://app.seenui.com', 'lead-abc-123')
    expect(vars.lead_url).toBe('https://app.seenui.com/leads/lead-abc-123')
  })

  it('uses appUrl as lead_url when no leadId provided', () => {
    const vars = buildLeadEmailVars(baseLead, 'Spa', 'https://app.seenui.com')
    expect(vars.lead_url).toBe('https://app.seenui.com')
  })

  it('falls back to "Not provided" for missing phone', () => {
    const vars = buildLeadEmailVars({ ...baseLead, phone: null }, 'Spa', 'http://localhost:3000')
    expect(vars.lead_phone).toBe('Not provided')
  })

  it('falls back to "Not specified" for missing service', () => {
    const vars = buildLeadEmailVars({ ...baseLead, requested_service: null }, 'Spa', 'http://localhost:3000')
    expect(vars.requested_service).toBe('Not specified')
  })

  it('falls back to "Flexible" for missing preferred_date', () => {
    const vars = buildLeadEmailVars({ ...baseLead, preferred_date: null }, 'Spa', 'http://localhost:3000')
    expect(vars.preferred_date).toBe('Flexible')
  })

  it('includes review_url when provided', () => {
    const vars = buildLeadEmailVars(baseLead, 'Spa', 'http://localhost:3000', 'lead-1', 'https://g.page/r/review')
    expect(vars.review_url).toBe('https://g.page/r/review')
  })

  it('includes empty string for review_url when not provided', () => {
    const vars = buildLeadEmailVars(baseLead, 'Spa', 'http://localhost:3000', 'lead-1')
    expect(vars.review_url).toBe('')
  })

  it('produces vars that work end-to-end with interpolateTemplate', () => {
    const vars = buildLeadEmailVars(baseLead, 'Test Spa', 'https://app.seenui.com', 'lead-1', 'https://review.link')
    const template = 'Hi {{first_name}}, thanks for your interest in {{requested_service}} at {{business_name}}!'
    const result = interpolateTemplate(template, vars)
    expect(result).toBe('Hi Jane, thanks for your interest in Botox at Test Spa!')
  })
})
