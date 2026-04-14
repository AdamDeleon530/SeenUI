<script setup lang="ts">
import AppButton from "~/components/ui/AppButton.vue";
import AppCard from "~/components/ui/AppCard.vue";
import TemplateTextarea from "~/components/ui/TemplateTextarea.vue";

definePageMeta({ middleware: ["auth", "tenant"] });

interface SequenceStep {
  id?: string;
  step_order: number;
  delay_days: number;
  template_id: string | null;
  subject: string;
  body_html: string;
  body_text: string;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  trigger_status: string | null;
  is_active: boolean;
  created_at: string;
  steps: SequenceStep[];
  enrollments: Array<{ id: string; status: string }>;
}

interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  is_enabled: boolean;
}

const TEMPLATE_LABELS: Record<string, string> = {
  lead_confirmation: "Booking Confirmation",
  lead_notification: "New Lead Alert",
  follow_up: "Follow-up",
  consultation_reminder: "Consultation Reminder",
  appointment_reminder: "Appointment Reminder",
  review_request: "Review Request",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "consultation_scheduled", label: "Consultation Scheduled" },
  { value: "booked", label: "Booked" },
  { value: "no_show", label: "No Show" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

// ─── State ────────────────────────────────────────────────────────────────────
const sequences = ref<Sequence[]>([]);
const templates = ref<EmailTemplate[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");

// Editor state
const showEditor = ref(false);
const editingId = ref<string | null>(null);

const form = reactive({
  name: "",
  description: "",
  trigger_status: "" as string | null,
  is_active: true,
  steps: [] as SequenceStep[],
});

// Delete confirm
const deletingId = ref<string | null>(null);

// ─── Load ────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [seqs, tpls] = await Promise.all([
      $fetch<Sequence[]>("/api/sequences"),
      $fetch<EmailTemplate[]>("/api/email-templates"),
    ]);
    sequences.value = seqs;
    templates.value = tpls;
  } catch (e: any) {
    error.value = e?.data?.message ?? "Failed to load sequences";
  } finally {
    loading.value = false;
  }
}

onMounted(load);

// ─── Editor helpers ───────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null;
  form.name = "";
  form.description = "";
  form.trigger_status = null;
  form.is_active = true;
  form.steps = [];
  showEditor.value = true;
}

function openEdit(seq: Sequence) {
  editingId.value = seq.id;
  form.name = seq.name;
  form.description = seq.description ?? "";
  form.trigger_status = seq.trigger_status ?? null;
  form.is_active = seq.is_active;
  form.steps = seq.steps
    .map((s) => ({ ...s }))
    .sort((a, b) => a.step_order - b.step_order);
  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false;
}

function addStep() {
  form.steps.push({
    step_order: form.steps.length,
    delay_days: form.steps.length === 0 ? 0 : 3,
    template_id: null,
    subject: "",
    body_html: "",
    body_text: "",
  });
}

function removeStep(index: number) {
  form.steps.splice(index, 1);
  form.steps.forEach((s, i) => {
    s.step_order = i;
  });
}

async function saveSequence() {
  if (!form.name.trim()) return;
  saving.value = true;
  error.value = "";
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      trigger_status: form.trigger_status || null,
      is_active: form.is_active,
      steps: form.steps.map((s, i) => ({
        step_order: i,
        delay_days: s.delay_days,
        template_id: s.template_id || null,
        subject: s.subject || null,
        body_html: s.body_html || null,
        body_text: s.body_text || null,
      })),
    };

    if (editingId.value) {
      await $fetch(`/api/sequences/${editingId.value}`, {
        method: "PATCH",
        body: payload,
      });
    } else {
      await $fetch("/api/sequences", { method: "POST", body: payload });
    }

    await load();
    closeEditor();
  } catch (e: any) {
    error.value = e?.data?.message ?? "Failed to save sequence";
  } finally {
    saving.value = false;
  }
}

async function toggleActive(seq: Sequence) {
  await $fetch(`/api/sequences/${seq.id}`, {
    method: "PATCH",
    body: { is_active: !seq.is_active },
  });
  seq.is_active = !seq.is_active;
}

async function confirmDelete() {
  if (!deletingId.value) return;
  await $fetch(`/api/sequences/${deletingId.value}`, { method: "DELETE" });
  deletingId.value = null;
  await load();
}

function enrollmentCount(seq: Sequence): number {
  return seq.enrollments?.filter((e) => e.status === "active").length ?? 0;
}

function templateLabel(id: string | null): string {
  if (!id) return "Custom email";
  const t = templates.value.find((t) => t.id === id);
  if (!t) return "Unknown template";
  return TEMPLATE_LABELS[t.type] ?? t.type;
}
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-surface-900">Email Sequences</h1>
        <p class="text-sm text-surface-500 mt-0.5">
          Drip campaigns that automatically follow up with leads over time.
        </p>
      </div>
      <AppButton @click="openCreate">New Sequence</AppButton>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 2"
        :key="i"
        class="h-24 bg-surface-100 rounded-2xl animate-pulse"
      />
    </div>

    <!-- Empty -->
    <AppCard v-else-if="!sequences.length" class="text-center py-12">
      <div
        class="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-6 h-6 text-brand-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-surface-700">No sequences yet</p>
      <p class="text-xs text-surface-400 mt-1">
        Create a drip campaign to automatically follow up with leads.
      </p>
      <AppButton class="mt-4" size="sm" @click="openCreate"
        >Create your first sequence</AppButton
      >
    </AppCard>

    <!-- Sequence list -->
    <div v-else class="space-y-3">
      <AppCard
        v-for="seq in sequences"
        :key="seq.id"
        class="p-0 overflow-hidden"
      >
        <div class="flex items-start gap-4 p-5">
          <!-- Active toggle -->
          <div class="pt-0.5 flex-shrink-0">
            <button
              class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              :class="seq.is_active ? 'bg-brand-500' : 'bg-surface-200'"
              :title="seq.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleActive(seq)"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
                :class="seq.is_active ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm font-semibold text-surface-900">
                {{ seq.name }}
              </h3>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                :class="
                  seq.is_active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-surface-100 text-surface-500'
                "
              >
                {{ seq.is_active ? "Active" : "Paused" }}
              </span>
              <span
                v-if="seq.trigger_status"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-600"
              >
                Auto:
                {{
                  STATUS_OPTIONS.find((o) => o.value === seq.trigger_status)
                    ?.label ?? seq.trigger_status
                }}
              </span>
            </div>
            <p
              v-if="seq.description"
              class="text-xs text-surface-500 mt-0.5 truncate"
            >
              {{ seq.description }}
            </p>

            <!-- Steps preview -->
            <div class="flex items-center gap-2 mt-3 flex-wrap">
              <template v-if="seq.steps?.length">
                <div
                  v-for="(step, idx) in seq.steps
                    .slice()
                    .sort((a, b) => a.step_order - b.step_order)"
                  :key="idx"
                  class="flex items-center gap-1.5"
                >
                  <div
                    class="flex items-center gap-1.5 bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1"
                  >
                    <span
                      class="text-[10px] font-semibold text-surface-500 uppercase"
                      >Day
                      {{ step.delay_days === 0 ? "0" : step.delay_days }}</span
                    >
                    <span
                      class="text-[11px] text-surface-700 truncate max-w-[120px]"
                      >{{ templateLabel(step.template_id) }}</span
                    >
                  </div>
                  <svg
                    v-if="idx < seq.steps.length - 1"
                    class="w-3 h-3 text-surface-300 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </template>
              <span v-else class="text-xs text-surface-400 italic"
                >No steps yet</span
              >
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-4 mt-3">
              <span class="text-xs text-surface-400">
                <span class="font-semibold text-surface-700">{{
                  enrollmentCount(seq)
                }}</span>
                active enrollments
              </span>
              <span class="text-xs text-surface-400">
                <span class="font-semibold text-surface-700">{{
                  seq.steps?.length ?? 0
                }}</span>
                steps
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              class="p-2 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors cursor-pointer"
              title="Edit"
              @click="openEdit(seq)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              class="p-2 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete"
              @click="deletingId = seq.id"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- ── Editor modal ──────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showEditor"
          class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-8"
            @click.stop
          >
            <!-- Modal header -->
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-surface-100"
            >
              <h2 class="text-base font-semibold text-surface-900">
                {{ editingId ? "Edit Sequence" : "New Sequence" }}
              </h2>
              <button
                class="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors cursor-pointer"
                @click="closeEditor"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="px-6 py-5 space-y-5">
              <!-- Name + Description -->
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label
                    class="block text-xs font-medium text-surface-700 mb-1.5"
                    >Sequence Name <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="e.g. New Lead Follow-up"
                    class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div class="col-span-2">
                  <label
                    class="block text-xs font-medium text-surface-700 mb-1.5"
                    >Description
                    <span class="text-surface-400 font-normal"
                      >(optional)</span
                    ></label
                  >
                  <input
                    v-model="form.description"
                    type="text"
                    placeholder="Briefly describe this sequence..."
                    class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <!-- Trigger + Active -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-xs font-medium text-surface-700 mb-1.5"
                    >Auto-enroll when lead becomes</label
                  >
                  <select
                    v-model="form.trigger_status"
                    class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option :value="null">Manual only</option>
                    <option
                      v-for="opt in STATUS_OPTIONS"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                  <p class="text-[11px] text-surface-400 mt-1">
                    Leads are automatically enrolled when their status changes.
                  </p>
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-surface-700 mb-1.5"
                    >Status</label
                  >
                  <label class="flex items-center gap-2.5 cursor-pointer mt-2">
                    <input
                      v-model="form.is_active"
                      type="checkbox"
                      class="accent-brand-500 w-4 h-4"
                    />
                    <span class="text-sm text-surface-700"
                      >Active (will send emails)</span
                    >
                  </label>
                </div>
              </div>

              <!-- Steps -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label
                    class="text-xs font-semibold text-surface-700 uppercase tracking-wider"
                    >Steps</label
                  >
                  <button
                    class="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
                    @click="addStep"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Step
                  </button>
                </div>

                <div
                  v-if="!form.steps.length"
                  class="text-center py-6 bg-surface-50 rounded-xl border border-dashed border-surface-300"
                >
                  <p class="text-sm text-surface-400">
                    No steps yet. Add a step to get started.
                  </p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="(step, idx) in form.steps"
                    :key="idx"
                    class="bg-surface-50 rounded-xl border border-surface-200 p-4 space-y-3"
                  >
                    <!-- Step header -->
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold text-surface-600"
                        >Step {{ idx + 1 }}</span
                      >
                      <button
                        class="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        @click="removeStep(idx)"
                      >
                        Remove
                      </button>
                    </div>

                    <!-- Delay -->
                    <div class="flex items-center gap-3">
                      <div class="flex-1">
                        <label
                          class="block text-xs font-medium text-surface-600 mb-1"
                          >Send after</label
                        >
                        <div class="flex items-center gap-2">
                          <input
                            v-model.number="step.delay_days"
                            type="number"
                            min="0"
                            max="365"
                            class="w-20 px-3 py-1.5 text-sm rounded-lg border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                          <span class="text-sm text-surface-600"
                            >{{ step.delay_days === 1 ? "day" : "days" }}
                            {{
                              idx === 0
                                ? "after enrollment"
                                : "after previous step"
                            }}</span
                          >
                        </div>
                      </div>
                    </div>

                    <!-- Template or custom -->
                    <div>
                      <label
                        class="block text-xs font-medium text-surface-600 mb-1"
                        >Email</label
                      >
                      <select
                        v-model="step.template_id"
                        class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-2"
                      >
                        <option :value="null">
                          Custom email (write below)
                        </option>
                        <option
                          v-for="t in templates"
                          :key="t.id"
                          :value="t.id"
                        >
                          {{ TEMPLATE_LABELS[t.type] ?? t.type }} —
                          {{ t.subject }}
                        </option>
                      </select>

                      <!-- Custom fields if no template -->
                      <div v-if="!step.template_id" class="space-y-2">
                        <input
                          v-model="step.subject"
                          type="text"
                          placeholder="Subject line..."
                          class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <TemplateTextarea
                          v-model="step.body_html"
                          :rows="3"
                          placeholder="Email body (HTML, use {{ to see variables)..."
                          :mono="true"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error -->
              <div
                v-if="error"
                class="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              >
                {{ error }}
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 bg-surface-50 rounded-b-2xl"
            >
              <button
                class="px-4 py-2 text-sm text-surface-600 hover:text-surface-800 cursor-pointer"
                @click="closeEditor"
              >
                Cancel
              </button>
              <AppButton
                :loading="saving"
                :disabled="!form.name.trim()"
                @click="saveSequence"
              >
                {{ editingId ? "Save Changes" : "Create Sequence" }}
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete confirm ─────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="deletingId"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div
            class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            @click.stop
          >
            <h3 class="text-base font-semibold text-surface-900 mb-2">
              Delete sequence?
            </h3>
            <p class="text-sm text-surface-600 mb-5">
              This will remove the sequence and cancel all active enrollments.
              This cannot be undone.
            </p>
            <div class="flex gap-3 justify-end">
              <button
                class="px-4 py-2 text-sm text-surface-600 hover:text-surface-800 cursor-pointer"
                @click="deletingId = null"
              >
                Cancel
              </button>
              <AppButton variant="danger" @click="confirmDelete"
                >Delete</AppButton
              >
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
