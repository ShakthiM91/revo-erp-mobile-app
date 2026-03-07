<template>
  <ion-modal :is-open="modelValue" @didDismiss="$emit('update:modelValue', false)">
    <ion-header>
      <ion-toolbar>
        <ion-title>Quote Details</ion-title>
        <ion-buttons slot="end"><ion-button @click="$emit('update:modelValue', false)">Close</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <ion-list v-else-if="quote" lines="inset">
        <ion-item-divider>Vendor</ion-item-divider>
        <ion-item>
          <ion-label>
            <h2>{{ quote.vendor_name }}</h2>
            <p v-if="quote.vendor_email">{{ quote.vendor_email }}</p>
            <p v-if="quote.vendor_phone">{{ quote.vendor_phone }}</p>
          </ion-label>
        </ion-item>
        <ion-item-divider>Quote</ion-item-divider>
        <ion-item>
          <ion-label>
            <h2>Amount</h2>
            <p>{{ formatCurrency(quote.quoted_amount, quote.currency) }}</p>
          </ion-label>
        </ion-item>
        <ion-item>
          <ion-label>
            <h2>Status</h2>
            <p>{{ formatStatus(quote.status) }}</p>
          </ion-label>
        </ion-item>
        <ion-item>
          <ion-label>
            <h2>Duration</h2>
            <p>{{ quote.estimated_duration_days ? `${quote.estimated_duration_days} days` : '-' }}</p>
          </ion-label>
        </ion-item>
        <ion-item>
          <ion-label>
            <h2>Valid Until</h2>
            <p>{{ formatDate(quote.validity_date) }}</p>
          </ion-label>
        </ion-item>
        <ion-item v-if="quote.notes">
          <ion-label>
            <h2>Notes</h2>
            <p>{{ quote.notes }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonItemDivider, IonLabel, IonSpinner } from '@ionic/vue'
import { getQuoteById } from '@/api/work'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true },
  quoteId: { type: [Number, String], default: null }
})

defineEmits(['update:modelValue'])

const loading = ref(false)
const quote = ref(null)

function formatCurrency(amount, currency = 'USD') {
  if (!amount && amount !== 0) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

function formatStatus(s) {
  if (!s) return ''
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function load() {
  if (!props.quoteId) return
  loading.value = true
  quote.value = null
  try {
    const res = await getQuoteById(props.projectId, props.quoteId)
    quote.value = res?.data ?? res
  } catch (_) {}
  finally {
    loading.value = false
  }
}

watch(() => [props.modelValue, props.quoteId], ([open, id]) => {
  if (open && id) load()
})
</script>

<style scoped>
.spinner { margin: 48px auto; display: block; }
</style>
