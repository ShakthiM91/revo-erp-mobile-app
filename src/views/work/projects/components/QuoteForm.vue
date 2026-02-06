<template>
  <ion-modal :is-open="modelValue" @didDismiss="$emit('update:modelValue', false)">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button @click="$emit('update:modelValue', false)">Cancel</ion-button></ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Quote' : 'Add Quote' }}</ion-title>
        <ion-buttons slot="end"><ion-button :disabled="saving" @click="submit">Save</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="inset">
        <ion-item>
          <ion-label position="stacked">Vendor</ion-label>
          <ion-select v-model="form.vendor_id" placeholder="Select vendor" :disabled="isEdit" interface="action-sheet">
            <ion-select-option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Quoted Amount</ion-label>
          <ion-input v-model.number="form.quoted_amount" type="number" step="0.01" placeholder="0" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Currency</ion-label>
          <ion-select v-model="form.currency" placeholder="Select" interface="action-sheet">
            <ion-select-option v-for="c in currencyOptions" :key="c.code" :value="c.code">{{ c.code }} - {{ c.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Duration (days)</ion-label>
          <ion-input v-model.number="form.estimated_duration_days" type="number" placeholder="Days" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Valid Until</ion-label>
          <ion-input v-model="form.validity_date" type="date" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Notes</ion-label>
          <ion-textarea v-model="form.notes" :rows="3" placeholder="Optional" />
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea } from '@ionic/vue'
import { createQuote, updateQuote, getVendors } from '@/api/work'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'
import { showToast } from '@/utils/ionicFeedback'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projectId: { type: [Number, String], required: true },
  quote: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'success'])

const saving = ref(false)
const vendors = ref([])
const currencyOptions = ref([])

const form = ref({
  vendor_id: null,
  quoted_amount: 0,
  currency: '',
  estimated_duration_days: null,
  validity_date: '',
  notes: ''
})

const isEdit = computed(() => !!props.quote?.id)

async function loadVendors() {
  try {
    const res = await getVendors({ is_active: true })
    vendors.value = res?.data ?? res ?? []
  } catch (_) {
    vendors.value = []
  }
}

async function loadCurrencies() {
  try {
    const [listRes, defaultRes] = await Promise.all([getTenantCurrencies(), getTenantDefaultCurrency()])
    const list = listRes?.data ?? listRes ?? []
    currencyOptions.value = Array.isArray(list) ? list : []
    const dc = defaultRes?.data?.data ?? defaultRes?.data
    if (dc?.code && !form.value.currency) form.value.currency = dc.code
    if (currencyOptions.value.length && !form.value.currency) form.value.currency = currencyOptions.value[0]?.code ?? 'USD'
  } catch (_) {
    currencyOptions.value = []
  }
}

function resetForm() {
  if (props.quote?.id) {
    form.value = { ...props.quote }
  } else {
    form.value = { vendor_id: null, quoted_amount: 0, currency: '', estimated_duration_days: null, validity_date: '', notes: '' }
  }
}

async function submit() {
  if (!form.value.vendor_id || !form.value.quoted_amount) {
    showToast('Vendor and amount required')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateQuote(props.projectId, props.quote.id, form.value)
      showToast('Quote updated')
    } else {
      await createQuote(props.projectId, form.value)
      showToast('Quote added')
    }
    emit('success')
    emit('update:modelValue', false)
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    resetForm()
    loadVendors()
    loadCurrencies()
  }
})
</script>
