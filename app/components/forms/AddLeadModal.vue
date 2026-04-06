<script setup lang="ts">
import type { CreateLeadDto } from '~/types/lead'

interface Props {
  open: boolean
}

defineProps<Props>()
const emit = defineEmits<{ close: []; created: [] }>()

const { createLead } = useLeads()

const form = reactive<CreateLeadDto>({
  full_name: '',
  email: '',
  phone: '',
  requested_service: '',
  preferred_date: '',
  notes: '',
  source: 'manual',
})

const errors = reactive<Partial<Record<keyof CreateLeadDto, string>>>({})
const loading = ref(false)
const serverError = ref('')

function validate(): boolean {
  Object.keys(errors).forEach(k => delete (errors as any)[k])
  if (!form.full_name?.trim()) errors.full_name = 'Name is required'
  if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Valid email is required'
  }
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  serverError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await createLead(form)
    emit('created')
    resetForm()
  } catch (e: any) {
    serverError.value = e.data?.message ?? e.message ?? 'Failed to create lead'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.full_name = ''
  form.email = ''
  form.phone = ''
  form.requested_service = ''
  form.preferred_date = ''
  form.notes = ''
}

function handleClose() {
  resetForm()
  emit('close')
}
</script>

<template>
  <AppModal :open="open" title="Add New Lead" @close="handleClose">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <AppInput
            v-model="form.full_name"
            label="Full Name"
            placeholder="Jane Smith"
            required
            :error="errors.full_name"
          />
        </div>
        <AppInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="jane@example.com"
          required
          :error="errors.email"
        />
        <AppInput
          v-model="form.phone"
          label="Phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
        />
        <AppInput
          v-model="form.requested_service"
          label="Requested Service"
          placeholder="Botox, Facial, etc."
        />
        <AppInput
          v-model="form.preferred_date"
          label="Preferred Date"
          type="date"
        />
        <div class="col-span-2">
          <AppTextarea
            v-model="form.notes"
            label="Notes"
            placeholder="Any additional context..."
            :rows="2"
          />
        </div>
      </div>

      <div v-if="serverError" class="p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
        {{ serverError }}
      </div>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="handleClose">Cancel</AppButton>
      <AppButton :loading="loading" @click="handleSubmit">Create Lead</AppButton>
    </template>
  </AppModal>
</template>
