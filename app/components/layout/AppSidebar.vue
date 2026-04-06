<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const { signOut } = useAuth()

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Pipeline',  href: '/leads',     icon: 'kanban' },
  { label: 'Settings',  href: '/settings',  icon: 'settings' },
]

const agencyItems = [
  { label: 'Agency', href: '/agency', icon: 'building' },
]

function isActive(href: string) {
  return route.path === href || route.path.startsWith(href + '/')
}

// Close drawer on route change (mobile)
watch(() => route.path, () => emit('close'))
</script>

<template>
  <!-- Mobile backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
      @click="emit('close')"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface-950 border-r border-surface-800/60',
      'transition-transform duration-300 ease-in-out',
      'lg:static lg:translate-x-0 lg:z-auto',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 px-5 border-b border-surface-800/60 flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30 flex-shrink-0">
        <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-white">{{ tenantStore.tenant?.name ?? 'Local Booking' }}</p>
        <p class="text-xs text-surface-500">Booking Engine</p>
      </div>
      <!-- Mobile close button -->
      <button
        class="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-surface-500 hover:bg-surface-800 hover:text-surface-300 transition-colors duration-150 lg:hidden"
        aria-label="Close navigation"
        @click="emit('close')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      <NuxtLink
        v-for="item in navItems"
        :key="item.href"
        :to="item.href"
        :class="[
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
          isActive(item.href)
            ? 'bg-brand-500/15 text-brand-300 shadow-[inset_0_0_0_1px_rgba(99,114,243,0.2)]'
            : 'text-surface-400 hover:bg-surface-800/70 hover:text-surface-200',
        ]"
      >
        <!-- Dashboard -->
        <svg v-if="item.icon === 'grid'" class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <!-- Pipeline -->
        <svg v-else-if="item.icon === 'kanban'" class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <!-- Settings -->
        <svg v-else-if="item.icon === 'settings'" class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>

        <span>{{ item.label }}</span>

        <!-- Active indicator dot -->
        <span
          v-if="isActive(item.href)"
          class="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400"
        />
      </NuxtLink>

      <!-- Agency section -->
      <template v-if="authStore.isAgencyAdmin">
        <div class="pt-5 pb-1.5 px-3">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-surface-600">Agency</p>
        </div>
        <NuxtLink
          v-for="item in agencyItems"
          :key="item.href"
          :to="item.href"
          :class="[
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
            isActive(item.href)
              ? 'bg-brand-500/15 text-brand-300 shadow-[inset_0_0_0_1px_rgba(99,114,243,0.2)]'
              : 'text-surface-400 hover:bg-surface-800/70 hover:text-surface-200',
          ]"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>{{ item.label }}</span>
          <span v-if="isActive(item.href)" class="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />
        </NuxtLink>
      </template>
    </nav>

    <!-- User footer -->
    <div class="flex-shrink-0 border-t border-surface-800/60 px-3 py-3">
      <div class="flex items-center gap-3 rounded-xl px-3 py-2.5">
        <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 ring-1 ring-brand-500/30">
          <span class="text-xs font-semibold text-brand-300">
            {{ (authStore.profile?.full_name ?? authStore.profile?.email ?? '?')[0]?.toUpperCase() }}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium text-surface-200">{{ authStore.profile?.full_name ?? 'User' }}</p>
          <p class="truncate text-[11px] text-surface-500 capitalize">{{ authStore.profile?.role?.replace('_', ' ') }}</p>
        </div>
        <button
          class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-surface-500 transition-colors duration-150 hover:bg-surface-800 hover:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          title="Sign out"
          aria-label="Sign out"
          @click="signOut"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
