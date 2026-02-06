<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button @click="$router.back()" />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Account' : 'Add Account' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Account Name</ion-label>
            <ion-input v-model="form.name" placeholder="Enter account name" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Account Number</ion-label>
            <ion-input v-model="form.account_number" placeholder="Optional" />
          </ion-item>
          <ion-item button detail @click="showTypePicker = true">
            <ion-label position="stacked">Account Type</ion-label>
            <ion-note slot="end">{{ typeText }}</ion-note>
          </ion-item>
          <ion-item button detail @click="showCurrencyPicker = true">
            <ion-label position="stacked">Currency</ion-label>
            <ion-note slot="end">{{ form.currency || 'Select' }}</ion-note>
          </ion-item>
          <ion-item v-if="!isEdit">
            <ion-label position="stacked">Initial Balance</ion-label>
            <ion-input v-model.number="form.initial_balance" type="number" step="0.01" placeholder="0" />
          </ion-item>
          <ion-item v-if="form.type === 'credit_card' || form.type === 'loan'">
            <ion-label position="stacked">Credit Limit</ion-label>
            <ion-input v-model.number="form.credit_limit" type="number" step="0.01" placeholder="Optional" />
          </ion-item>
          <ion-item v-if="form.type === 'bank' || form.type === 'savings'">
            <ion-label position="stacked">Bank Name</ion-label>
            <ion-input v-model="form.bank_name" placeholder="Optional" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" :rows="2" />
          </ion-item>
          <ion-item v-if="isEdit" button detail @click="showStatusPicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ form.is_active ? 'Active' : 'Inactive' }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showTypePicker" @didDismiss="showTypePicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Account Type</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showTypePicker = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="t in typeOptions" :key="t.value" button @click="form.type = t.value; showTypePicker = false">
              <ion-label>{{ t.text }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="showCurrencyPicker" @didDismiss="showCurrencyPicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Currency</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCurrencyPicker = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in currencyOptions" :key="c.code" button @click="form.currency = c.code; showCurrencyPicker = false">
              <ion-label>
                <h2>{{ c.code }}</h2>
                <p>{{ c.name }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="showStatusPicker" @didDismiss="showStatusPicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Status</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showStatusPicker = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item button @click="form.is_active = true; showStatusPicker = false"><ion-label>Active</ion-label></ion-item>
            <ion-item button @click="form.is_active = false; showStatusPicker = false"><ion-label>Inactive</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createAccount, updateAccount, getAccountById } from '@/api/accounting'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const isEdit = computed(() => !!id)

const saving = ref(false)
const showTypePicker = ref(false)
const showCurrencyPicker = ref(false)
const showStatusPicker = ref(false)
const currencyOptions = ref([])

const typeOptions = [
  { text: 'Bank', value: 'bank' },
  { text: 'Cash', value: 'cash' },
  { text: 'Credit Card', value: 'credit_card' },
  { text: 'Loan', value: 'loan' },
  { text: 'Savings', value: 'savings' },
  { text: 'Investment', value: 'investment' },
  { text: 'Other', value: 'other' }
]

const form = reactive({
  name: '',
  account_number: '',
  type: 'bank',
  currency: 'USD',
  initial_balance: 0,
  credit_limit: null,
  bank_name: '',
  description: '',
  is_active: true
})

const typeText = computed(() => typeOptions.find(t => t.value === form.type)?.text || form.type)

function toBoolean(v) {
  if (v === null || v === undefined) return true
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return Boolean(v)
}

async function loadCurrencies() {
  try {
    const res = await getTenantCurrencies()
    const data = res?.data ?? res
    const list = Array.isArray(data) ? data : (data?.data || [])
    currencyOptions.value = list
    if (list.length && !form.currency) {
      try {
        const def = await getTenantDefaultCurrency()
        const d = def?.data ?? def
        const code = d?.code ?? d?.currency_code
        form.currency = code || list[0].code
      } catch (_) {
        form.currency = list[0].code
      }
    }
  } catch (_) {
    currencyOptions.value = [{ code: 'USD', name: 'US Dollar' }]
    if (!form.currency) form.currency = 'USD'
  }
}

async function loadAccount() {
  if (!id) return
  try {
    const res = await getAccountById(id)
    const acc = res?.data ?? res
    if (acc) {
      form.name = acc.name || ''
      form.account_number = acc.account_number || ''
      form.type = acc.type || 'bank'
      form.currency = acc.currency || 'USD'
      form.initial_balance = acc.initial_balance ?? 0
      form.credit_limit = acc.credit_limit ?? null
      form.bank_name = acc.bank_name || ''
      form.description = acc.description || ''
      form.is_active = toBoolean(acc.is_active)
    }
  } catch (e) {
    showToast('Failed to load')
    router.back()
  }
}

onMounted(async () => {
  await loadCurrencies()
  if (id) await loadAccount()
})

watch(() => route.params.id, (newId) => {
  if (newId) loadAccount()
})

async function submit() {
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter account name')
    return
  }
  if (name.length < 2 || name.length > 255) {
    showToast('Name should be 2–255 characters')
    return
  }
  saving.value = true
  try {
    const data = {
      name,
      account_number: form.account_number?.trim() || null,
      type: form.type,
      currency: form.currency || 'USD',
      credit_limit: (form.type === 'credit_card' || form.type === 'loan') ? (form.credit_limit ?? null) : null,
      bank_name: (form.type === 'bank' || form.type === 'savings') ? (form.bank_name?.trim() || null) : null,
      description: form.description?.trim() || null,
      is_active: form.is_active
    }
    if (!id) data.initial_balance = form.initial_balance ?? 0
    if (id) {
      await updateAccount(id, data)
    } else {
      await createAccount(data)
    }
    showToast(id ? 'Updated' : 'Created')
    router.back()
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
