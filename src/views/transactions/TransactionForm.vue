<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Number</ion-label>
            <ion-input v-model="form.transaction_number" placeholder="Transaction number" />
          </ion-item>
          <ion-item button detail @click="showTypePicker = true">
            <ion-label position="stacked">Type</ion-label>
            <ion-note slot="end">{{ typeText }}</ion-note>
          </ion-item>
          <ion-item v-if="form.type !== 'transfer'" button detail @click="showAccountPicker = true">
            <ion-label position="stacked">Account</ion-label>
            <ion-note slot="end">{{ accountText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item v-if="form.type === 'transfer'" button detail @click="showAccountPicker = true">
            <ion-label position="stacked">From</ion-label>
            <ion-note slot="end">{{ accountText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item v-if="form.type === 'transfer'" button detail @click="showToAccountPicker = true">
            <ion-label position="stacked">To</ion-label>
            <ion-note slot="end">{{ toAccountText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item v-if="form.type !== 'transfer'" button detail @click="showCategoryPicker = true">
            <ion-label position="stacked">Category</ion-label>
            <ion-note slot="end">{{ categoryText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Amount</ion-label>
            <ion-input v-model.number="form.amount" type="number" inputmode="decimal" placeholder="0.00" />
          </ion-item>
          <ion-item button detail @click="showCurrencyPicker = true">
            <ion-label position="stacked">Currency</ion-label>
            <ion-note slot="end">{{ currencyText }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" rows="2" />
          </ion-item>
        </ion-list>
        <ion-item-divider />
        <ion-list lines="inset">
          <ion-item button detail @click="showDatePicker = true">
            <ion-label position="stacked">Date</ion-label>
            <ion-note slot="end">{{ dateText }}</ion-note>
          </ion-item>
          <ion-item button detail @click="showStatusPicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ statusText }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <!-- Pickers as modals -->
      <ion-modal :is-open="showTypePicker" @didDismiss="showTypePicker = false">
        <ion-header><ion-toolbar><ion-title>Type</ion-title><ion-buttons slot="end"><ion-button @click="showTypePicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in typeCols" :key="c.value" button @click="form.type = c.value; showTypePicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showAccountPicker" @didDismiss="showAccountPicker = false">
        <ion-header><ion-toolbar><ion-title>Account</ion-title><ion-buttons slot="end"><ion-button @click="showAccountPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="a in accountCols" :key="a.value" button @click="form.account_id = a.value; showAccountPicker = false"><ion-label>{{ a.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showToAccountPicker" @didDismiss="showToAccountPicker = false">
        <ion-header><ion-toolbar><ion-title>To Account</ion-title><ion-buttons slot="end"><ion-button @click="showToAccountPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="a in toAccountCols" :key="a.value" button @click="form.to_account_id = a.value; showToAccountPicker = false"><ion-label>{{ a.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showCategoryPicker" @didDismiss="showCategoryPicker = false">
        <ion-header><ion-toolbar><ion-title>Category</ion-title><ion-buttons slot="end"><ion-button @click="showCategoryPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in categoryCols" :key="c.value" button @click="form.category_id = c.value; showCategoryPicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showCurrencyPicker" @didDismiss="showCurrencyPicker = false">
        <ion-header><ion-toolbar><ion-title>Currency</ion-title><ion-buttons slot="end"><ion-button @click="showCurrencyPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in currencyCols" :key="c.value" button @click="form.currency = c.value; showCurrencyPicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showDatePicker" @didDismiss="showDatePicker = false">
        <ion-header><ion-toolbar><ion-title>Date</ion-title><ion-buttons slot="end"><ion-button @click="showDatePicker = false">OK</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-datetime
            presentation="date"
            :value="form.transaction_date"
            @ionChange="(e) => { const v = e.detail.value; if (v) form.transaction_date = v.slice(0, 10) }"
          />
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showStatusPicker" @didDismiss="showStatusPicker = false">
        <ion-header><ion-toolbar><ion-title>Status</ion-title><ion-buttons slot="end"><ion-button @click="showStatusPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in statusCols" :key="c.value" button @click="form.status = c.value; showStatusPicker = false"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
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
  IonItemDivider,
  IonModal,
  IonDatetime
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createTransaction, updateTransaction, getTransactionById, getCategoryTree, getAccounts } from '@/api/accounting'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const isEdit = !!id

const form = reactive({
  transaction_number: '',
  type: 'income',
  account_id: null,
  to_account_id: null,
  category_id: null,
  amount: '',
  currency: 'USD',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0],
  status: 'completed'
})

const accountOptions = ref([])
const categoryOptions = ref([])
const currencyOptions = ref([{ value: 'USD', text: 'USD' }])
const saving = ref(false)

const showTypePicker = ref(false)
const showAccountPicker = ref(false)
const showToAccountPicker = ref(false)
const showCategoryPicker = ref(false)
const showCurrencyPicker = ref(false)
const showDatePicker = ref(false)
const showStatusPicker = ref(false)

const typeCols = [{ text: 'Income', value: 'income' }, { text: 'Expense', value: 'expense' }, { text: 'Transfer', value: 'transfer' }]
const statusCols = [{ text: 'Completed', value: 'completed' }, { text: 'Pending', value: 'pending' }, { text: 'Cancelled', value: 'cancelled' }]

const typeText = computed(() => typeCols.find(c => c.value === form.type)?.text || form.type)
const statusText = computed(() => statusCols.find(c => c.value === form.status)?.text || form.status)
const accountText = computed(() => accountOptions.value.find(a => a.id === form.account_id)?.name || '')
const toAccountText = computed(() => accountOptions.value.find(a => a.id === form.to_account_id)?.name || '')
const categoryText = computed(() => categoryOptions.value.find(c => c.value === form.category_id)?.text || '')
const currencyText = computed(() => currencyOptions.value.find(c => c.value === form.currency)?.text || form.currency)
const dateText = computed(() => form.transaction_date || '')

const accountCols = computed(() => accountOptions.value.map(a => ({ text: a.name, value: a.id })))
const toAccountCols = computed(() => accountOptions.value.filter(a => a.id !== form.account_id).map(a => ({ text: a.name, value: a.id })))
const categoryCols = computed(() => categoryOptions.value.map(c => ({ text: c.text, value: c.value })))
const currencyCols = computed(() => currencyOptions.value.map(c => ({ text: c.text, value: c.value })))

function flatten (arr, pre = '') {
  const out = []
  for (const c of arr || []) {
    const t = pre ? `${pre} > ${c.name}` : c.name
    out.push({ value: c.id, text: t })
    if (c.children?.length) out.push(...flatten(c.children, t))
  }
  return out
}

async function loadOptions () {
  try {
    const [accRes, curRes] = await Promise.all([
      getAccounts({ is_active: true }),
      getTenantCurrencies().catch(() => ({ data: { data: [{ code: 'USD', name: 'USD' }] } }))
    ])
    if (accRes?.data) accountOptions.value = accRes.data
    const cur = curRes?.data?.data ?? curRes?.data
    if (Array.isArray(cur) && cur.length) currencyOptions.value = cur.map(c => ({ value: c.code, text: `${c.code} - ${c.name || c.code}` }))
    const def = await getTenantDefaultCurrency().catch(() => null)
    const dc = def?.data?.data ?? def?.data
    if (dc?.code && !form.currency) form.currency = dc.code
  } catch (_) {}
}

async function loadCategories () {
  if (form.type === 'transfer') { categoryOptions.value = []; return }
  try {
    const r = await getCategoryTree(form.type)
    const data = r?.data || []
    categoryOptions.value = flatten(data)
  } catch (_) { categoryOptions.value = [] }
}

watch(() => form.type, () => { form.category_id = null; form.to_account_id = null; loadCategories() })

async function loadEdit () {
  if (!id) return
  try {
    const r = await getTransactionById(id)
    const t = r?.data || r
    if (t) {
      form.transaction_number = t.transaction_number || ''
      form.type = t.type || 'income'
      form.account_id = t.account_id ?? null
      form.to_account_id = t.to_account_id ?? null
      form.category_id = t.category_id ?? null
      form.amount = t.amount ?? ''
      form.currency = t.currency || 'USD'
      form.description = t.description || ''
      form.transaction_date = t.transaction_date ? new Date(t.transaction_date).toISOString().split('T')[0] : form.transaction_date
      form.status = t.status || 'completed'
      await loadCategories()
    }
  } catch (e) { showToast('Failed to load'); router.back() }
}

async function submit () {
  if (!form.transaction_number || !form.account_id || (form.type === 'transfer' ? !form.to_account_id : !form.category_id) || form.amount == null || form.amount === '') {
    showToast('Fill required fields')
    return
  }
  saving.value = true
  try {
    const body = {
      transaction_number: form.transaction_number,
      type: form.type,
      account_id: form.account_id,
      to_account_id: form.type === 'transfer' ? form.to_account_id : null,
      category_id: form.type !== 'transfer' ? form.category_id : null,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
      description: form.description || null,
      transaction_date: form.transaction_date,
      status: form.status
    }
    if (isEdit) await updateTransaction(id, body)
    else await createTransaction(body)
    showToast(isEdit ? 'Updated' : 'Created')
    router.back()
  } catch (e) { showToast(e?.message || 'Failed') } finally { saving.value = false }
}

onMounted(async () => {
  await loadOptions()
  if (isEdit) await loadEdit()
  else {
    form.transaction_number = `TXN-${Date.now()}`
    await loadCategories()
  }
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
</style>
