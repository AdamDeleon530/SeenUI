<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await signIn(form.email, form.password)
    await router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message ?? 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppCard padding="lg">
    <h2 class="text-lg font-semibold text-surface-900 mb-1">Sign in to your account</h2>
    <p class="text-sm text-surface-500 mb-6">Enter your email and password below</p>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        required
        autocomplete="email"
      />
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
        autocomplete="current-password"
      />

      <div v-if="error" class="p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
        {{ error }}
      </div>

      <AppButton type="submit" :loading="loading" full-width size="lg">
        Sign in
      </AppButton>
    </form>

    <p class="text-center text-sm text-surface-500 mt-5">
      Don't have an account?
      <NuxtLink to="/register" class="text-brand-600 font-medium hover:text-brand-700">Sign up</NuxtLink>
    </p>
  </AppCard>
</template>
