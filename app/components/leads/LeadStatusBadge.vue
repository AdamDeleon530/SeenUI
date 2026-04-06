<script setup lang="ts">
import type { LeadStatus } from '~/types/lead'

interface Props {
  status: LeadStatus
}

defineProps<Props>()

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const statusConfig: Record<LeadStatus, { label: string; variant: BadgeVariant }> = {
  new:                      { label: 'New Lead',               variant: 'info' },
  contacted:                { label: 'Contacted',              variant: 'warning' },
  consultation_scheduled:   { label: 'Consult Scheduled',      variant: 'purple' },
  booked:                   { label: 'Booked',                 variant: 'success' },
  no_show:                  { label: 'No Show',                variant: 'danger' },
  won:                      { label: 'Won',                    variant: 'success' },
  lost:                     { label: 'Lost',                   variant: 'danger' },
}
</script>

<template>
  <AppBadge :variant="statusConfig[status].variant" dot>
    {{ statusConfig[status].label }}
  </AppBadge>
</template>
