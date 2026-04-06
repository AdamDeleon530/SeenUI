<script setup lang="ts">
import type { PipelineStage } from '~/types/pipeline'
import type { Lead } from '~/types/lead'

interface Props {
  stage: PipelineStage
  dragOverStageId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  leadClick: [lead: Lead]
  dragStart: [leadId: string, stageId: string]
  drop: [stageId: string]
  dragOver: [stageId: string]
}>()

const isDragOver = computed(() => props.dragOverStageId === props.stage.id)

function onDragStart(e: DragEvent, leadId: string) {
  e.dataTransfer!.setData('text/plain', JSON.stringify({ leadId, stageId: props.stage.id }))
  e.dataTransfer!.effectAllowed = 'move'
  emit('dragStart', leadId, props.stage.id)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  emit('dragOver', props.stage.id)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  emit('drop', props.stage.id)
}
</script>

<template>
  <div
    class="flex flex-col w-72 flex-shrink-0"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <!-- Column header -->
    <div class="flex items-center gap-2.5 px-1 mb-3">
      <div
        class="w-2.5 h-2.5 rounded-full flex-shrink-0"
        :style="{ backgroundColor: stage.color }"
      />
      <h3 class="text-sm font-semibold text-surface-800">{{ stage.name }}</h3>
      <span class="ml-auto text-xs font-medium text-surface-400 bg-surface-100 rounded-full px-2 py-0.5">
        {{ stage.lead_count ?? stage.leads?.length ?? 0 }}
      </span>
    </div>

    <!-- Drop zone -->
    <div
      :class="[
        'flex-1 rounded-2xl min-h-24 transition-colors duration-150 space-y-2 p-2',
        isDragOver ? 'bg-brand-50 border-2 border-dashed border-brand-300' : 'bg-surface-100/60',
      ]"
    >
      <div
        v-for="lead in (stage.leads ?? [])"
        :key="lead.id"
        draggable="true"
        @dragstart="onDragStart($event, lead.id)"
      >
        <KanbanCard
          :lead="lead"
          @click="emit('leadClick', lead)"
        />
      </div>

      <!-- Empty state -->
      <div
        v-if="!stage.leads?.length"
        class="flex items-center justify-center h-16 text-xs text-surface-400"
      >
        No leads
      </div>
    </div>
  </div>
</template>
