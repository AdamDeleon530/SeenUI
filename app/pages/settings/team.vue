<script setup lang="ts">
import AppCard from '~/components/ui/AppCard.vue'
import AppButton from '~/components/ui/AppButton.vue'
import AppBadge from '~/components/ui/AppBadge.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

// SCAFFOLD: Team management page — UI shown but invite API is a future feature.
// The structure and form are real; the server route for invite is not yet implemented.

const tenantStore = useTenantStore()
const supabase = useSupabaseClient()

interface TeamMember {
  id: string
  full_name: string | null
  email: string | null
  role: string
  is_active: boolean
}

const members = ref<TeamMember[]>([])
const loading = ref(true)

onMounted(async () => {
  if (!tenantStore.tenant) return
  const { data } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role, is_active')
    .eq('tenant_id', tenantStore.tenant.id)
  members.value = (data ?? []) as TeamMember[]
  loading.value = false
})

const roleLabel: Record<string, string> = {
  agency_admin:   'Agency Admin',
  business_owner: 'Owner',
  staff:          'Staff',
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-xl font-bold text-surface-900">Settings</h1>
      <p class="text-sm text-surface-500 mt-0.5">Manage team members</p>
    </div>

    <!-- Settings nav tabs -->
    <div class="flex gap-1 border-b border-surface-200">
      <NuxtLink
        v-for="tab in [
          { label: 'General',  href: '/settings' },
          { label: 'Embed',    href: '/settings/embed' },
          { label: 'Services', href: '/settings/services' },
          { label: 'Team',     href: '/settings/team' },
        ]"
        :key="tab.href"
        :to="tab.href"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="$route.path === tab.href
          ? 'border-brand-500 text-brand-600'
          : 'border-transparent text-surface-500 hover:text-surface-700'"
      >
        {{ tab.label }}
      </NuxtLink>
    </div>

    <AppCard>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-surface-900">Team Members</h2>
        <!-- SCAFFOLD: Invite flow coming in v2 -->
        <AppButton size="sm" disabled title="Coming soon">
          Invite Member
        </AppButton>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 2" :key="i" class="h-10 bg-surface-100 rounded-xl animate-pulse" />
      </div>

      <div v-else class="divide-y divide-surface-50">
        <div
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-3 py-3"
        >
          <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-brand-600">
              {{ (member.full_name ?? member.email ?? '?')[0]?.toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-900 truncate">{{ member.full_name ?? '(No name)' }}</p>
            <p class="text-xs text-surface-500 truncate">{{ member.email }}</p>
          </div>
          <AppBadge :variant="member.role === 'business_owner' ? 'info' : 'default'" size="sm">
            {{ roleLabel[member.role] ?? member.role }}
          </AppBadge>
        </div>
        <div v-if="!members.length" class="py-8 text-center text-sm text-surface-400">
          No team members yet
        </div>
      </div>
    </AppCard>
  </div>
</template>
