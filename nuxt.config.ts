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
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM || "noreply@localbookingengine.com",
    appUrl: process.env.APP_URL || "http://localhost:3000",

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
