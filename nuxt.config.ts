// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/supabase", "@pinia/nuxt"],

  supabase: {
    // Supabase config loaded from runtime config / env
    redirect: false, // We handle auth redirects manually
  },

  runtimeConfig: {
    // Private (server-side only)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM || "noreply@localbookingengine.com",
    appUrl: process.env.APP_URL || "http://localhost:3000",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePrices: {
      starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      starter_annual:  process.env.STRIPE_PRICE_STARTER_ANNUAL,
      pro_monthly:     process.env.STRIPE_PRICE_PRO_MONTHLY,
      pro_annual:      process.env.STRIPE_PRICE_PRO_ANNUAL,
      agency_monthly:  process.env.STRIPE_PRICE_AGENCY_MONTHLY,
      agency_annual:   process.env.STRIPE_PRICE_AGENCY_ANNUAL,
    },

    // Public (exposed to client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      appUrl: process.env.APP_URL || "http://localhost:3000",
    },
  },

  css: ["~/assets/css/main.css"],

  typescript: {
    strict: true,
    typeCheck: false, // Enable after initial setup
  },

  // Route rules
  routeRules: {
    // API routes - no SSR
    "/api/**": { cors: true },
    // Embed routes - public, no auth
    "/embed/**": { ssr: false, cors: true },
  },
});
