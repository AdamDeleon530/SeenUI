/**
 * Global Vitest setup — runs before every test file.
 * Stubs out Nuxt/H3 globals and runtime config so server-side
 * functions can be imported and tested without a running Nuxt server.
 */

import { vi, beforeAll, afterEach } from 'vitest'

// ── Nuxt H3 globals ──────────────────────────────────────────────────────────
// Server route files call these without importing them (Nuxt auto-imports).
// We need to provide them globally for tests.

globalThis.defineEventHandler = (fn: any) => fn
globalThis.readBody = vi.fn()
globalThis.getRouterParam = vi.fn()
globalThis.setResponseHeaders = vi.fn()
globalThis.createError = ({ statusCode, message }: { statusCode: number; message: string }) => {
  const err = new Error(message) as any
  err.statusCode = statusCode
  err.statusMessage = message
  return err
}

// ── Runtime config ───────────────────────────────────────────────────────────
globalThis.useRuntimeConfig = vi.fn(() => ({
  supabaseServiceKey: 'test-service-key',
  resendApiKey: 'test-resend-key',
  emailFrom: 'noreply@test.com',
  appUrl: 'http://localhost:3000',
  stripeSecretKey: 'sk_test_xxx',
  stripeWebhookSecret: 'whsec_test_xxx',
  stripePrices: {
    starter_monthly: 'price_starter_mo',
    starter_annual: 'price_starter_yr',
    pro_monthly: 'price_pro_mo',
    pro_annual: 'price_pro_yr',
    agency_monthly: 'price_agency_mo',
    agency_annual: 'price_agency_yr',
  },
  twilio: {
    accountSid: 'ACtest',
    authToken: 'test_auth',
    phoneNumber: '+15550000000',
  },
  public: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseKey: 'test-anon-key',
    appUrl: 'http://localhost:3000',
  },
}))

// ── Reset all mocks between tests ────────────────────────────────────────────
// clearAllMocks resets call records only (not implementations), so vi.fn()
// implementations created in vi.mock factories persist across tests within a
// file. restoreAllMocks would clear those implementations, causing tests that
// rely on hoisted module mocks to fail.
afterEach(() => {
  vi.clearAllMocks()
})
