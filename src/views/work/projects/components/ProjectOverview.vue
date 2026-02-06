<template>
  <div class="project-overview">
    <ion-list lines="none" class="overview-cards">
      <ion-item>
        <ion-label>
          <h3>Budget Summary</h3>
          <p>Original: {{ formatCurrency(overview.budget?.original_budget || 0) }}</p>
          <p>Current: {{ formatCurrency(overview.budget?.current_budget || 0) }}</p>
          <p :class="varianceClass">Variance: {{ formatVariance(overview.budget?.variance || 0) }} ({{ (overview.budget?.variance_percentage || 0).toFixed(2) }}%)</p>
          <p v-if="overview.budget?.additional_work_amount > 0">Additional Work: {{ formatCurrency(overview.budget?.additional_work_amount || 0) }}</p>
        </ion-label>
      </ion-item>
      <ion-item>
        <ion-label>
          <h3>Stage Progress</h3>
          <ion-progress-bar :value="(overview.progress?.progress_percentage || 0) / 100" :color="progressColor" />
          <p>Completed: {{ overview.progress?.completed_stages || 0 }} / {{ overview.progress?.total_stages || 0 }}</p>
        </ion-label>
      </ion-item>
      <ion-item>
        <ion-label>
          <h3>Payment Status</h3>
          <ion-progress-bar :value="(overview.payments?.payment_percentage || 0) / 100" color="success" />
          <p>Paid: {{ formatCurrency(overview.payments?.total_paid || 0) }}</p>
          <p>Remaining: {{ formatCurrency(overview.payments?.remaining || 0) }}</p>
        </ion-label>
      </ion-item>
    </ion-list>
    <div class="quick-actions">
      <ion-button expand="block" @click="$emit('add-stage')">Add Stage</ion-button>
      <ion-button expand="block" fill="outline" @click="$emit('record-payment')">Record Payment</ion-button>
      <ion-button expand="block" fill="outline" @click="$emit('add-additional-work')">Add Additional Work</ion-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IonList, IonItem, IonLabel, IonProgressBar, IonButton } from '@ionic/vue'

const props = defineProps({
  overview: { type: Object, default: () => ({}) },
  currencyCode: { type: String, default: 'USD' }
})

defineEmits(['add-stage', 'record-payment', 'add-additional-work'])

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: props.currencyCode || 'USD' }).format(amount)
}

function formatVariance(amount) {
  const formatted = formatCurrency(Math.abs(amount))
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

const varianceClass = computed(() => {
  const v = props.overview.budget?.variance || 0
  if (v > 0) return 'variance-over'
  if (v < 0) return 'variance-under'
  return ''
})

const progressColor = computed(() => {
  const p = parseFloat(props.overview.progress?.progress_percentage || 0)
  if (p < 30) return 'danger'
  if (p < 70) return 'warning'
  return 'success'
})
</script>

<style scoped>
.project-overview { padding: 12px 0; }
.overview-cards ion-item { --background: transparent; }
.overview-cards h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.overview-cards p { font-size: 13px; margin: 2px 0; color: var(--ion-color-medium-shade); }
.variance-over { color: var(--ion-color-danger); }
.variance-under { color: var(--ion-color-success); }
.quick-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; padding: 0 16px; }
</style>
