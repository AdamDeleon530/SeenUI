<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const { signOut } = useAuth()

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'grid' },
  { label: 'Pipeline',   href: '/leads',       icon: 'kanban' },
  { label: 'Settings',   href: '/settings',    icon: 'settings' },
]

const agencyItems = [
  { label: 'Agency',  href: '/agency',  icon: 'building' },
]

function isActive(href: string) {
  return route.path === href || route.path.startsWith(href + '/')
}

async function handleSignOut() {
  await signOut()
}
</script>

<template>
  <aside class="w-56 flex-shrink-0 flex flex-col bg-surface-950 min-h-screen">
    <!-- Logo / Brand -->
    <div class="px-5 py-5 border-b border-surface-800">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-white truncate">{{ tenantStore.tenant?.name ?? 'Local Booking' }}</p>
          <p class="text-xs text-surface-500 truncate">Booking Engine</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.href"
        :to="item.href"
        :class="[
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150',
          isActive(item.href)
            ? 'bg-brand-500/20 text-brand-300'
            : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
        ]"
      >
        <!-- Grid icon -->
        <svg v-if="item.icon === 'grid'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <!-- Kanban icon -->
        <svg v-else-if="item.icon === 'kanban'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <!-- Settings icon -->
        <svg v-else-if="item.icon === 'settings'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {{ item.label }}
      </NuxtLink>

      <!-- Agency section -->
      <template v-if="authStore.isAgencyAdmin">
        <div class="pt-4 pb-1 px-3">
          <p class="text-xs font-medium text-surface-600 uppercase tracking-wider">Agency</p>
        </div>
        <NuxtLink
          v-for="item in agencyItems"
          :key="item.href"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150',
            isActive(item.href)
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
          ]"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {{ item.label }}
        </NuxtLink>
      </template>
    </nav>

    <!-- User menu -->
    <div class="px-3 py-4 border-t border-surface-800">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
          <span class="text-xs font-semibold text-brand-300">
            {{ (authStore.profile?.full_name ?? authStore.profile?.email ?? '?')[0]?.toUpperCase() }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-surface-200 truncate">{{ authStore.profile?.full_name ?? 'User' }}</p>
          <p class="text-xs text-surface-500 truncate capitalize">{{ authStore.profile?.role?.replace('_', ' ') }}</p>
        </div>
        <button
          class="p-1 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors"
          title="Sign out"
          @click="handleSignOut"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
