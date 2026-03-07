<template>
  <ion-modal :is-open="modelValue" @didDismiss="$emit('update:modelValue', false)">
    <ion-header>
      <ion-toolbar>
        <ion-title>Compare Quotes</ion-title>
        <ion-buttons slot="end"><ion-button @click="$emit('update:modelValue', false)">Close</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <template v-else-if="comparisonData">
        <div class="summary-row">
          <span>Lowest: {{ formatCurrency(comparisonData.comparison?.lowest_amount) }}</span>
          <span>Highest: {{ formatCurrency(comparisonData.comparison?.highest_amount) }}</span>
        </div>
        <ion-list lines="inset">
          <ion-item v-for="q in (comparisonData.quotes || [])" :key="q.id">
            <ion-label>
              <h2>{{ q.vendor_name }}</h2>
              <p>{{ formatCurrency(q.quoted_amount, q.currency) }}</p>
              <p>{{ q.estimated_duration_days }} days · {{ formatDate(q.validity_date) }}</p>
            </ion-label>
            <ion-badge v-if="q.is_lowest" color="success" slot="end">Lowest</ion-badge>
            <ion-button v-if="q.status === 'pending'" slot="end" size="small" color="success" @click="handleAccept(q)">Accept</ion-button>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner } from '@ionic/vue'
import { compareQuotes, acceptQuote } from '@/api/work'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true },
  projectCurrency: { type: String, default: 'USD' }
})

const emit = defineEmits(['update:modelValue', 'quote-accepted'])

const loading = ref(false)
const comparisonData = ref(null)

function formatCurrency(amount, currency) {
  if (!amount && amount !== 0) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || props.projectCurrency || 'USD' }).format(amount)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

async function load() {
  loading.value = true
  comparisonData.value = null
  try {
    const res = await compareQuotes(props.projectId)
    comparisonData.value = res?.data ?? res
  } catch (_) {}
  finally {
    loading.value = false
  }
}

async function handleAccept(q) {
  try {
    await showConfirmDialog({ title: 'Accept Quote', message: `Accept quote from ${q.vendor_name} for ${formatCurrency(q.quoted_amount, q.currency)}?`, confirmText: 'Accept' })
    await acceptQuote(props.projectId, q.id)
    showToast('Quote accepted')
    emit('quote-accepted')
    emit('update:modelValue', false)
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

watch(() => props.modelValue, (open) => {
  if (open) load()
})
</script>

<style scoped>
.spinner { margin: 48px auto; display: block; }
.summary-row { display: flex; gap: 16px; padding: 16px; flex-wrap: wrap; }
</style>
