# SeenUI CRM — Claude Code Build Spec

> **Context for Claude Code:** This is a multi-tenant CRM SaaS built in Nuxt 3 / Vue 3 / Supabase / Stripe.
> It has an embeddable booking widget and an admin portal. Target niches: Construction, Med Spa, Barbershop.
> Read this entire file before writing a single line of code.

---

## Project Overview

- **Frontend:** Nuxt 3 + Vue 3 + Pinia + Tailwind CSS (`app/` directory, Nuxt v4 layout)
- **Backend:** Nuxt server routes in `server/api/`
- **Database:** Supabase (Postgres + RLS + auth)
- **Billing:** Stripe (subscriptions, webhooks already wired in `server/api/billing/`)
- **Email:** Resend (abstracted in `server/lib/email.ts`)
- **Embed Widget:** Vanilla JS + Shadow DOM at `public/embed/widget.js`
- **Plans:** `trial` / `starter` / `pro` / `agency` — limits enforced in `server/lib/stripe.ts`

The app is **~58% complete**. The foundation (auth, multi-tenant, billing, pipeline, email sequences, embed widget) is production-grade. Your job is to build the **Priority 1 MVP features** listed below, add the **niche-specific form fields**, and make the **test suite green**.

---

## Running the Project

```bash
pnpm install
pnpm dev          # starts dev server on localhost:3000
pnpm test         # run all unit tests
pnpm test:watch   # watch mode
pnpm test:ui      # Vitest UI at localhost:51204
pnpm typecheck    # TypeScript check
```

Required `.env` file (copy `.env.example` and fill in):
```
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com
APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_PRICE_AGENCY_MONTHLY=
STRIPE_PRICE_AGENCY_ANNUAL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## Architecture Rules (Read These First)

1. **All DB queries use `useSupabaseAdmin()`** from `server/lib/supabase.ts` — this is the service role client that bypasses RLS. Never use the public client in server routes.
2. **All protected routes call `requireTenantContext(event)`** at the top — this gets `{ userId, tenantId }` and throws 401/403 if not authorized.
3. **Tenant isolation is your responsibility in every query** — always `.eq('tenant_id', tenantId)` on every DB call. This is critical for multi-tenancy.
4. **Email sending is non-blocking** — always `.catch(console.error)` on email sends so a broken email config never crashes an API response.
5. **Public routes** (embed widget endpoints at `/api/embed/:tenantId/*`) do NOT use `requireTenantContext`. They validate the tenant ID from the URL param instead.
6. **Plan limits** are checked in `server/lib/stripe.ts` — `PLAN_LIMITS` object. Starter gets SMS; Pro gets two-way inbox + calendar; Agency gets white-label.
7. **Types live in `app/types/`** — add new types there, not inline in server files.
8. **Activity logging** — every significant lead change must log a `lead_activities` row. See existing `lead_created`, `status_changed` etc. patterns.
9. **Composables go in `app/composables/`** — name them `useXxx.ts`. They wrap `$fetch` calls to the API.
10. **Pinia stores go in `app/stores/`** — for state that lives across navigation (auth, tenant, leads).

---

## Priority 1 — Build These First (MVP Launch Blockers)

### TASK 1: SMS via Twilio

**Goal:** Business staff can send and receive SMS messages to/from leads directly from the lead drawer in the admin portal.

**Files to create:**
- `server/lib/twilio.ts` — Twilio client singleton, `sendSms(to, body, from?)` function
- `server/api/sms/send.post.ts` — `POST /api/sms/send` → sends SMS, logs to `sms_messages` table
- `server/api/sms/[leadId]/messages.get.ts` — `GET /api/sms/:leadId/messages` → returns SMS thread
- `server/api/sms/webhook.post.ts` — `POST /api/sms/webhook` (public, Twilio callback) → saves inbound SMS, marks as unread
- `app/composables/useSms.ts` — `sendSms(leadId, body)`, `fetchMessages(leadId)`
- `app/components/leads/SmsThread.vue` — SMS conversation UI shown in LeadDrawer

**DB table to add (Supabase migration):**
```sql
create table sms_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  lead_id uuid not null references leads(id),
  direction text not null check (direction in ('outbound', 'inbound')),
  body text not null,
  from_number text not null,
  to_number text not null,
  twilio_sid text,
  status text default 'sent',  -- sent | delivered | failed | received
  is_read boolean default false,
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);
create index on sms_messages(lead_id);
create index on sms_messages(tenant_id, is_read);
```

**Plan enforcement:** SMS sending only available on `starter` and above. Throw 402 if `tenant.plan === 'trial'`.

**Twilio webhook validation:** Validate `X-Twilio-Signature` header on the webhook endpoint. Use `twilio.validateRequest()`.

**Tests:** See `tests/unit/server/sms.test.ts` and `tests/integration/sms.test.ts`.

---

### TASK 2: Automated Review Request

**Goal:** When a lead's status changes to `'won'`, automatically send a review request email + SMS after a configurable delay.

**The plumbing partially exists:**
- `server/api/leads/[id].patch.ts` already calls `triggerStatusChangeEmails()` on status change
- `app/pages/settings/index.vue` has a `review_url` field
- `server/lib/email.ts` has `getTenantReviewUrl()`

**What to add:**
1. Add `review_request_delay_hours` (default: 24) and `review_request_sms_enabled` to `tenant_settings`
2. Create `server/api/review-requests/trigger.post.ts` — internal endpoint to schedule/send review requests
3. When status changes to `'won'` in `[id].patch.ts`, call a `scheduleReviewRequest(tenantId, lead)` function
4. `scheduleReviewRequest` should:
   - If `review_request_delay_hours === 0`: send immediately
   - Otherwise: insert a row into a `scheduled_jobs` table with `run_at = now() + delay_hours`
5. Add a `server/api/cron/process-jobs.post.ts` endpoint that processes due `scheduled_jobs` rows (call this from a Vercel Cron or external cron every 15 minutes)
6. Update the review request email template to include `{{review_url}}` prominently
7. Update `app/pages/settings/index.vue` to add the delay config UI

**DB table:**
```sql
create table scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  job_type text not null,  -- 'review_request' | 'appointment_reminder' | 'sequence_step'
  payload jsonb not null,
  run_at timestamptz not null,
  status text default 'pending',  -- pending | running | done | failed
  error text,
  created_at timestamptz default now()
);
create index on scheduled_jobs(status, run_at);
```

**Tests:** See `tests/unit/server/review-requests.test.ts`.

---

### TASK 3: Appointment Reminder Emails + SMS

**Goal:** Automatically send a reminder 24 hours before `lead.preferred_date`.

**Implementation:**
1. Reuse the `scheduled_jobs` table from Task 2
2. When a lead is created or `preferred_date` is updated, upsert a `scheduled_jobs` row with `job_type = 'appointment_reminder'` and `run_at = preferred_date - 24 hours`
3. The cron job processor in Task 2 handles sending
4. Send both email (if `confirmation_email_enabled`) and SMS (if `review_request_sms_enabled` and on starter+)

**Files to modify:**
- `server/api/leads/index.post.ts` — add `scheduleAppointmentReminder()` call after lead creation
- `server/api/leads/[id].patch.ts` — re-schedule reminder if `preferred_date` changes
- `server/api/cron/process-jobs.post.ts` — handle `appointment_reminder` job type

**Tests:** See `tests/unit/server/appointment-reminders.test.ts`.

---

### TASK 4: Niche-Specific Widget Forms

**Goal:** The embed widget shows different additional fields depending on which niche the tenant selected during setup.

**Changes to `tenant_settings` table:**
```sql
alter table tenant_settings
  add column niche text check (niche in ('construction', 'med_spa', 'barbershop', 'general')) default 'general',
  add column niche_fields jsonb default '[]'::jsonb;
```

**Niche field definitions — add to `app/types/tenant.ts`:**

```typescript
export const NICHE_FIELDS: Record<string, FormFieldConfig[]> = {
  construction: [
    { key: 'job_type', label: 'Job Type', type: 'select', required: true, enabled: true, order: 4,
      options: ['Roofing', 'Remodeling', 'Painting', 'Flooring', 'HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Other'] },
    { key: 'property_address', label: 'Property Address', type: 'text', required: true, enabled: true, order: 5, placeholder: '123 Main St, City, State' },
    { key: 'project_description', label: 'Project Description', type: 'textarea', required: true, enabled: true, order: 6, placeholder: 'Describe the work needed...' },
    { key: 'estimated_budget', label: 'Estimated Budget', type: 'select', required: false, enabled: true, order: 7,
      options: ['Under $2,000', '$2,000 – $10,000', '$10,000 – $50,000', '$50,000+', 'Not sure'] },
    { key: 'timeline', label: 'Timeline', type: 'select', required: false, enabled: true, order: 8,
      options: ['ASAP', 'Within 1 month', '1–3 months', 'Just exploring'] },
    { key: 'referral_source', label: 'How did you hear about us?', type: 'select', required: false, enabled: true, order: 9,
      options: ['Google', 'Nextdoor', 'Facebook', 'Referral', 'Truck/Sign', 'Other'] },
  ],
  med_spa: [
    { key: 'treatment_interest', label: 'Treatment of Interest', type: 'select', required: true, enabled: true, order: 4,
      options: ['Botox', 'Dermal Fillers', 'Laser Hair Removal', 'HydraFacial', 'Microneedling', 'Chemical Peel', 'Body Contouring', 'Other'] },
    { key: 'primary_concern', label: 'Primary Concern / Goal', type: 'select', required: false, enabled: true, order: 5,
      options: ['Anti-aging', 'Skin texture', 'Volume loss', 'Hyperpigmentation', 'Acne/Scarring', 'Hair removal', 'Other'] },
    { key: 'is_first_visit', label: 'First time visiting us?', type: 'select', required: false, enabled: true, order: 6,
      options: ['Yes, first time', 'No, returning client'] },
    { key: 'consultation_type', label: 'Preferred Consultation', type: 'select', required: false, enabled: true, order: 7,
      options: ['In-person', 'Virtual'] },
    { key: 'referral_source', label: 'How did you hear about us?', type: 'select', required: false, enabled: true, order: 8,
      options: ['Instagram', 'TikTok', 'Google', 'Friend/Referral', 'Other'] },
  ],
  barbershop: [
    { key: 'service', label: 'Service', type: 'select', required: true, enabled: true, order: 4,
      options: ['Haircut', 'Fade', 'Beard Trim', 'Shape-Up', 'Hair + Beard', 'Kid\'s Cut', 'Hair Color', 'Other'] },
    { key: 'preferred_barber', label: 'Preferred Barber', type: 'select', required: false, enabled: true, order: 5,
      options: ['No preference'] },  // populated dynamically from team members
    { key: 'is_first_visit', label: 'First time visiting us?', type: 'select', required: false, enabled: true, order: 6,
      options: ['Yes, first time', 'No, returning client'] },
    { key: 'referral_source', label: 'How did you hear about us?', type: 'select', required: false, enabled: true, order: 7,
      options: ['Instagram', 'TikTok', 'Google', 'Walk-by', 'Friend', 'Other'] },
  ],
  general: [],
}
```

**Widget changes (`public/embed/widget.js`):**
- The `/api/embed/:tenantId/config` endpoint already returns embed config. Add `niche` and `niche_fields` to the response.
- In `buildFormHTML()`, after the existing fields, iterate `config.niche_fields` and render each field using the existing `field()` / `textareaField()` helpers plus a new `selectField()` helper.
- Store extra niche field values in the form payload under their `key` names and pass them in `body.niche_data` as a JSON object to the submit endpoint.
- The submit endpoint should store `niche_data` in `leads.metadata` (jsonb column — add via migration).

**Files to modify:**
- `server/api/embed/[tenantId]/config.get.ts` — include `niche` and `niche_fields` in response
- `server/api/embed/[tenantId]/submit.post.ts` — accept and store `niche_data`
- `public/embed/widget.js` — render niche fields, capture + submit niche_data
- `app/pages/settings/embed.vue` — add niche selector dropdown
- `app/pages/setup.vue` — add niche selection step

**Tests:** See `tests/unit/app/niche-forms.test.ts`.

---

### TASK 5: Pipeline Stage Customization UI

**Goal:** Tenants can add, rename, reorder, and delete pipeline stages from the Settings page.

**Backend already exists:**
- `server/api/pipeline/stages.get.ts` — GET stages
- `server/api/pipeline/board.get.ts` — GET board with leads

**New server routes to add:**
- `server/api/pipeline/stages.post.ts` — create a new stage
- `server/api/pipeline/stages/[id].patch.ts` — rename a stage
- `server/api/pipeline/stages/[id].delete.ts` — delete a stage (move leads to default stage first)
- `server/api/pipeline/stages/reorder.post.ts` — update `order` on multiple stages at once

**New page:**
- `app/pages/settings/pipeline.vue` — drag-and-drop list of stages with add/edit/delete/reorder

**Tests:** See `tests/unit/server/pipeline-stages.test.ts`.

---

### TASK 6: Lead Assignment Notifications

**Goal:** When `lead.assigned_to` changes, email the newly assigned user.

**Implementation:**
- In `server/api/leads/[id].patch.ts`, after the DB update, if `body.assigned_to !== current.assigned_to`, call `sendAssignmentEmail(tenantId, updatedLead, body.assigned_to)`.
- `sendAssignmentEmail` fetches the assignee's email from `user_profiles`, then sends an email with a direct link to the lead.

---

## Priority 2 — Build After MVP Is Live

### TASK 7: Two-Way SMS Inbox

**Goal:** A dedicated `/inbox` page showing all SMS conversations, with real-time updates via Supabase Realtime.

- Use Supabase's `channel().on('postgres_changes', ...)` to subscribe to new `sms_messages` rows
- Group conversations by `lead_id`, sorted by most recent message
- Show unread count badge in the sidebar (`AppSidebar.vue`)
- Mark messages as read when conversation is opened

**New files:**
- `app/pages/inbox/index.vue`
- `app/components/inbox/ConversationList.vue`
- `app/components/inbox/MessageThread.vue`
- `app/stores/inbox.ts`

---

### TASK 8: Google Calendar Sync

**Goal:** When `booked_appointment_at` is set on a lead, create/update a Google Calendar event.

- OAuth flow in settings: `app/pages/settings/integrations.vue`
- Store `google_access_token` + `google_refresh_token` in `tenant_settings`
- `server/lib/google-calendar.ts` — Google Calendar API client
- `server/api/integrations/google/callback.get.ts` — OAuth callback
- `server/api/integrations/google/disconnect.post.ts`

---

### TASK 9: Lead CSV Import

**Goal:** Tenants can upload a CSV of existing contacts to bulk-create leads.

- `app/pages/leads/import.vue` — file upload with column mapping UI
- `server/api/leads/import.post.ts` — parse CSV, validate, batch insert, return summary

---

## Testing Requirements

### Setup

```bash
pnpm add -D vitest @vitest/ui happy-dom
```

Config is in `vitest.config.ts` at the project root.

### Running Tests

```bash
pnpm test              # run all tests once
pnpm test:watch        # watch mode
pnpm test:ui           # browser UI
pnpm test -- --reporter=verbose   # verbose output
```

### Test Philosophy

- **Unit tests** (`tests/unit/`) — test pure functions in isolation. Mock Supabase, Twilio, Resend. No network calls.
- **Integration tests** (`tests/integration/`) — test API route handler logic with mocked DB. Use `vi.mock()` to stub `server/lib/supabase.ts`.
- **A test must exist for every new feature before it's merged.** If you add a function, you write a test for it.

### Coverage Targets
- `server/lib/email.ts` → 100% (pure functions, no excuse)
- `server/lib/twilio.ts` → 100%
- `server/api/embed/[tenantId]/submit.post.ts` → validation logic 100%
- `server/api/leads/index.post.ts` → validation logic 100%
- `server/api/sms/send.post.ts` → 90%+
- Niche field definitions → 100%

### Key Test Files

All test files are in `tests/`. See each file for what passes (existing functionality) and what fails (new features to build). **A failing test = a feature you need to build.**

```
tests/
  unit/
    server/
      email.test.ts          ← email utility functions (should all pass now)
      embed-validation.test.ts ← embed submit validation (should pass now)
      lead-creation.test.ts  ← lead creation logic (should pass now)
      sms.test.ts            ← SMS feature (will FAIL until Task 1 is done)
      review-requests.test.ts ← review request scheduling (will FAIL until Task 2)
      appointment-reminders.test.ts ← reminders (will FAIL until Task 3)
      pipeline-stages.test.ts ← stage CRUD (partial — GET passes, mutations FAIL)
    app/
      niche-forms.test.ts    ← niche field definitions (will FAIL until Task 4)
      lead-filters.test.ts   ← filter/search logic (should pass now)
  integration/
    embed-submit.test.ts     ← full embed submit flow (should pass now)
    lead-api.test.ts         ← lead CRUD API (should pass now)
    sequence-enroll.test.ts  ← sequence enrollment (should pass now)
    sms-flow.test.ts         ← SMS send + webhook flow (will FAIL until Task 1)
```

---

## Code Style Rules

- TypeScript strict mode — no `any` unless unavoidable (use `unknown` + type guards)
- All new Vue components use `<script setup lang="ts">`
- Composables return plain functions/refs — no class instances
- All server routes use `defineEventHandler(async (event) => { ... })`
- Use `createError({ statusCode, message })` for error responses — never `throw new Error()`
- Never hard-code tenant IDs, user IDs, or secrets in source code
- All new DB interactions must include tenant_id in the where clause

## Commit Convention

```
feat(sms): add Twilio SMS send/receive for leads
feat(niche): add construction/med-spa/barbershop form fields
fix(embed): handle missing default stage gracefully
test(sms): add unit tests for SMS service
```

---

## Supabase Migration Notes

When you add new tables or columns, create a migration file at:
`supabase/migrations/YYYYMMDDHHMMSS_description.sql`

Run locally with: `npx supabase db push` (requires Supabase CLI).

**Tables already confirmed to exist:**
- `tenants`, `user_profiles`, `pipeline_stages`, `leads`, `lead_activities`, `lead_notes`, `tags`, `lead_tags`
- `email_templates`, `email_sequences`, `sequence_steps`, `sequence_enrollments`, `email_sends`
- `tenant_settings`, `services`

**Tables to add (via migrations):**
- `sms_messages` (Task 1)
- `scheduled_jobs` (Tasks 2 & 3)

---

## Questions? Check These Files First

| Question | File |
|---|---|
| How does auth work? | `app/middleware/auth.ts`, `app/composables/useAuth.ts` |
| How does tenant resolution work? | `server/utils/tenant.ts` |
| What plan limits exist? | `server/lib/stripe.ts` → `PLAN_LIMITS` |
| How do emails get sent? | `server/lib/email.ts` |
| What does the embed widget look like? | `public/embed/widget.js` |
| What lead statuses exist? | `app/types/lead.ts` → `LeadStatus` |
| How do sequences work? | `server/api/sequences/` + `server/api/sequences/[id]/enroll.post.ts` |
