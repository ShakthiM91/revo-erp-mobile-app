<template>
  <ion-modal :is-open="modelValue" @didDismiss="$emit('update:modelValue', false)">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button @click="$emit('update:modelValue', false)">Cancel</ion-button></ion-buttons>
        <ion-title>{{ paymentType === 'start' ? 'Start Payment' : 'End Payment' }}</ion-title>
        <ion-buttons slot="end"><ion-button :disabled="saving" @click="submit">Record</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="inset">
        <ion-item>
          <ion-label>
            <h2>Stage</h2>
            <p>{{ stage?.title || 'N/A' }}</p>
          </ion-label>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Amount</ion-label>
          <ion-input v-model.number="form.amount" type="number" step="0.01" min="0" placeholder="0" />
          <ion-note slot="end">Expected: {{ formatCurrency(expectedAmount) }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Currency</ion-label>
          <ion-select v-model="form.currency" placeholder="Select" interface="action-sheet">
            <ion-select-option v-for="c in currencyOptions" :key="c.code" :value="c.code">{{ c.code }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Payment Date</ion-label>
          <ion-input v-model="form.payment_date" type="date" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Account</ion-label>
          <ion-select v-model="form.account_id" placeholder="Select account" interface="action-sheet">
            <ion-select-option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Category</ion-label>
          <ion-select v-model="form.category_id" placeholder="Expense category" interface="action-sheet">
            <ion-select-option v-for="c in flatCategories" :key="c.id" :value="c.id">{{ c.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Payment Method</ion-label>
          <ion-select v-model="form.payment_method" placeholder="Select" interface="action-sheet">
            <ion-select-option value="Bank Transfer">Bank Transfer</ion-select-option>
            <ion-select-option value="Check">Check</ion-select-option>
            <ion-select-option value="Cash">Cash</ion-select-option>
            <ion-select-option value="Credit Card">Credit Card</ion-select-option>
            <ion-select-option value="Other">Other</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Reference Number</ion-label>
          <ion-input v-model="form.reference_number" placeholder="Optional" />
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonNote } from '@ionic/vue'
import { recordStageStartPayment, recordStageEndPayment } from '@/api/work'
import { getAccounts, getCategoryTree } from '@/api/accounting'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'
import { showToast } from '@/utils/ionicFeedback'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: [Number, String], required: true },
  stage: { type: Object, default: null },
  paymentType: { type: String, required: true, validator: (v) => ['start', 'end'].includes(v) }
})

const emit = defineEmits(['update:modelValue', 'success'])

const saving = ref(false)
const accounts = ref([])
const categoryOptions = ref([])
const currencyOptions = ref([])

const form = ref({
  amount: 0,
  currency: '',
  payment_date: '',
  account_id: null,
  category_id: null,
  payment_method: '',
  reference_number: ''
})

const expectedAmount = computed(() => {
  if (!props.stage) return 0
  return props.paymentType === 'start' ? (props.stage.start_payment_amount || 0) : (props.stage.end_payment_amount || 0)
})

function flattenCategories(cats, out = []) {
  for (const c of cats || []) {
    out.push({ id: c.id, name: c.name })
    if (c.children?.length) flattenCategories(c.children, out)
  }
  return out
}

const flatCategories = computed(() => flattenCategories(categoryOptions.value))

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: form.value.currency || 'USD' }).format(amount)
}

async function loadAccounts() {
  try {
    const res = await getAccounts({ is_active: true })
    accounts.value = res?.data ?? res ?? []
  } catch (_) {
    accounts.value = []
  }
}

async function loadCategories() {
  try {
    const res = await getCategoryTree('expense')
    const data = res?.data ?? res?.data?.data ?? []
    categoryOptions.value = Array.isArray(data) ? data : []
  } catch (_) {
    categoryOptions.value = []
  }
}

async function loadCurrencies() {
  try {
    const [listRes, defaultRes] = await Promise.all([getTenantCurrencies(), getTenantDefaultCurrency()])
    const list = listRes?.data ?? listRes ?? []
    currencyOptions.value = Array.isArray(list) ? list : []
    const dc = defaultRes?.data?.data ?? defaultRes?.data
    if (dc?.code) form.value.currency = dc.code
    else if (currencyOptions.value.length) form.value.currency = currencyOptions.value[0]?.code ?? 'USD'
  } catch (_) {
    currencyOptions.value = []
  }
}

async function submit() {
  if (!form.value.amount || form.value.amount <= 0) {
    showToast('Amount required')
    return
  }
  if (!form.value.payment_date) {
    showToast('Payment date required')
    return
  }
  if (!form.value.account_id) {
    showToast('Account required')
    return
  }
  saving.value = true
  try {
    const data = { ...form.value, stage_id: props.stage?.id, payment_type: props.paymentType }
    if (props.paymentType === 'start') {
      await recordStageStartPayment(props.projectId, props.stage.id, data)
      showToast('Start payment recorded')
    } else {
      await recordStageEndPayment(props.projectId, props.stage.id, data)
      showToast('End payment recorded')
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
    form.value.amount = expectedAmount.value
    form.value.payment_date = new Date().toISOString().split('T')[0]
    loadAccounts()
    loadCategories()
    loadCurrencies()
  }
})
</script>
