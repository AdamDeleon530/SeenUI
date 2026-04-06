<script setup lang="ts">
import type { Lead } from '~/types/lead'
import KanbanColumn from '~/components/pipeline/KanbanColumn.vue'
import LeadDrawer from '~/components/leads/LeadDrawer.vue'
import AddLeadModal from '~/components/forms/AddLeadModal.vue'
import AppButton from '~/components/ui/AppButton.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

const pipeline = usePipeline()
const leadsStore = useLeadsStore()

// Load kanban board
await pipeline.fetchStagesWithLeads()

// Lead drawer state
const drawerOpen = ref(false)
const selectedLead = ref<Lead | null>(null)
const addLeadModalOpen = ref(false)

// Drag and drop state
const dragOverStageId = ref<string | null>(null)
const draggingLeadId = ref<string | null>(null)
const draggingFromStageId = ref<string | null>(null)

function openLead(lead: Lead) {
  selectedLead.value = lead
  drawerOpen.value = true
}

function onDragStart(leadId: string, stageId: string) {
  draggingLeadId.value = leadId
  draggingFromStageId.value = stageId
}

function onDragOver(stageId: string) {
  dragOverStageId.value = stageId
}

async function onDrop(toStageId: string) {
  if (!draggingLeadId.value || !draggingFromStageId.value) return
  if (draggingFromStageId.value === toStageId) {
    dragOverStageId.value = null
    return
  }

  // Optimistic update in UI
  pipeline.moveLeadOptimistic(draggingLeadId.value, draggingFromStageId.value, toStageId)
  dragOverStageId.value = null

  // Persist to server
  try {
    await pipeline.moveLeadToStage(draggingLeadId.value, toStageId)
  } catch {
    // Revert on failure by re-fetching
    await pipeline.fetchStagesWithLeads()
  } finally {
    draggingLeadId.value = null
    draggingFromStageId.value = null
  }
}

function onLeadUpdated(updated: Lead) {
  // Update the lead in the pipeline board
  for (const stage of pipeline.stages.value) {
    const idx = stage.leads?.findIndex(l => l.id === updated.id) ?? -1
    if (idx !== -1 && stage.leads) {
      stage.leads[idx] = { ...stage.leads[idx], ...updated }
    }
  }
}

async function onLeadCreated() {
  addLeadModalOpen.value = false
  await pipeline.fetchStagesWithLeads()
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- Page header -->
    <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-surface-100 flex-shrink-0">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Pipeline</h1>
        <p class="text-sm text-surface-500 mt-0.5">Drag leads between stages to update their status</p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink to="/settings/embed">
          <AppButton variant="secondary" size="sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Get embed code
          </AppButton>
        </NuxtLink>
        <AppButton size="sm" @click="addLeadModalOpen = true">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Lead
        </AppButton>
      </div>
    </div>

    <!-- Kanban board -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden">
      <div v-if="pipeline.loading.value" class="flex items-center justify-center h-full">
        <div class="text-sm text-surface-400 animate-pulse">Loading pipeline...</div>
      </div>
      <div
        v-else
        class="flex gap-4 p-6 h-full"
        style="min-width: max-content;"
      >
        <KanbanColumn
          v-for="stage in pipeline.stages.value"
          :key="stage.id"
          :stage="stage"
          :drag-over-stage-id="dragOverStageId"
          @lead-click="openLead"
          @drag-start="onDragStart"
          @drag-over="onDragOver"
          @drop="onDrop"
        />
      </div>
    </div>

    <!-- Lead detail drawer -->
    <LeadDrawer
      :open="drawerOpen"
      :lead="selectedLead"
      @close="drawerOpen = false"
      @updated="onLeadUpdated"
    />

    <!-- Add lead modal -->
    <AddLeadModal
      :open="addLeadModalOpen"
      @close="addLeadModalOpen = false"
      @created="onLeadCreated"
    />
  </div>
</template>
