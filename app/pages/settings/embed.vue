<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'tenant'] })

const { data: embedData, refresh } = await useFetch('/api/settings/embed')

const copiedKey = ref<string | null>(null)
const activeTab = ref<'inline' | 'floating' | 'modal'>('inline')

async function copySnippet(key: string, text: string) {
  await navigator.clipboard.writeText(text)
  copiedKey.value = key
  setTimeout(() => { copiedKey.value = null }, 2000)
}

const tabs: Array<{ key: 'inline' | 'floating' | 'modal'; label: string; description: string }> = [
  {
    key: 'inline',
    label: 'Inline Form',
    description: 'Embed a full booking form directly on any page.',
  },
  {
    key: 'floating',
    label: 'Floating Button',
    description: 'A sticky CTA button that opens a modal form.',
  },
  {
    key: 'modal',
    label: 'Modal Trigger',
    description: 'Add data-lbe-trigger to any button to open the booking form.',
  },
]
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-xl font-bold text-surface-900">Settings</h1>
      <p class="text-sm text-surface-500 mt-0.5">Configure your booking embed</p>
    </div>

    <!-- Settings nav tabs -->
    <div class="flex gap-1 border-b border-surface-200">
      <NuxtLink
        v-for="tab in [
          { label: 'General',  href: '/settings' },
          { label: 'Embed',    href: '/settings/embed' },
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

    <!-- Tenant ID callout -->
    <AppCard>
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h2 class="text-sm font-semibold text-surface-900">Your Tenant ID</h2>
          <p class="text-xs text-surface-500 mt-0.5">Use this in your embed snippets or API calls</p>
          <code class="mt-2 block text-xs font-mono bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-surface-700 select-all">
            {{ embedData?.tenant_id }}
          </code>
        </div>
      </div>
    </AppCard>

    <!-- Embed snippets -->
    <AppCard>
      <h2 class="text-sm font-semibold text-surface-900 mb-1">Embed Code</h2>
      <p class="text-xs text-surface-500 mb-4">Copy and paste one of these snippets into your website's HTML</p>

      <!-- Tab switcher -->
      <div class="flex gap-1 p-1 bg-surface-100 rounded-xl mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            activeTab === tab.key ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <p class="text-xs text-surface-500 mb-3">
        {{ tabs.find(t => t.key === activeTab)?.description }}
      </p>

      <div class="relative">
        <pre class="text-xs font-mono bg-surface-950 text-surface-100 rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{{ embedData?.snippets?.[activeTab] }}</pre>
        <button
          :class="[
            'absolute top-3 right-3 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors',
            copiedKey === activeTab ? 'bg-success-500 text-white' : 'bg-surface-700 text-surface-200 hover:bg-surface-600',
          ]"
          @click="copySnippet(activeTab, embedData?.snippets?.[activeTab] ?? '')"
        >
          {{ copiedKey === activeTab ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </AppCard>

    <!-- API endpoint info -->
    <AppCard padding="sm">
      <div class="flex items-center gap-2 text-xs text-surface-500">
        <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Submit API endpoint: <code class="font-mono text-surface-700">{{ embedData?.api_url }}/submit</code></span>
      </div>
    </AppCard>
  </div>
</template>
