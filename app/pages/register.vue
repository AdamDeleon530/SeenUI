<script setup lang="ts">
import AppCard from "~/components/ui/AppCard.vue";
import AppInput from "~/components/ui/AppInput.vue";
import AppButton from "~/components/ui/AppButton.vue";
definePageMeta({ layout: "auth" });

const { signUp } = useAuth();
const router = useRouter();

const form = reactive({
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
});
const error = ref("");
const loading = ref(false);
const needsConfirmation = ref(false);

async function handleSubmit() {
  error.value = "";
  if (form.password !== form.confirm_password) {
    error.value = "Passwords do not match";
    return;
  }
  if (form.password.length < 8) {
    error.value = "Password must be at least 8 characters";
    return;
  }
  loading.value = true;
  try {
    const data = await signUp(form.email, form.password, form.full_name);
    if (data.session) {
      await router.push("/setup");
    } else {
      // Email confirmation required — session won't exist until confirmed
      needsConfirmation.value = true;
    }
  } catch (e: any) {
    error.value = e.message ?? "Failed to create account";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppCard padding="lg">
    <template v-if="needsConfirmation">
      <div class="text-center py-4">
        <div class="text-3xl mb-4">📬</div>
        <h2 class="text-lg font-semibold text-surface-900 mb-2">Check your email</h2>
        <p class="text-sm text-surface-500">
          We sent a confirmation link to <strong>{{ form.email }}</strong>. Click it to verify your account and continue setup.
        </p>
      </div>
    </template>

    <template v-else>
    <h2 class="text-lg font-semibold text-surface-900 mb-1">
      Create your account
    </h2>
    <p class="text-sm text-surface-500 mb-6">
      Get started in minutes — no credit card required
    </p>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <AppInput
        v-model="form.full_name"
        label="Full Name"
        placeholder="Jane Smith"
        required
        autocomplete="name"
      />
      <AppInput
        v-model="form.email"
        label="Work Email"
        type="email"
        placeholder="jane@yourmedspa.com"
        required
        autocomplete="email"
      />
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="Min. 8 characters"
        required
        autocomplete="new-password"
      />
      <AppInput
        v-model="form.confirm_password"
        label="Confirm Password"
        type="password"
        placeholder="Repeat password"
        required
        autocomplete="new-password"
      />

      <div
        v-if="error"
        class="p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700"
      >
        {{ error }}
      </div>

      <AppButton type="submit" :loading="loading" full-width size="lg">
        Create account
      </AppButton>
    </form>

    <p class="text-center text-sm text-surface-500 mt-5">
      Already have an account?
      <NuxtLink
        to="/login"
        class="text-brand-600 font-medium hover:text-brand-700"
        >Sign in</NuxtLink
      >
    </p>
    </template>
  </AppCard>
</template>
