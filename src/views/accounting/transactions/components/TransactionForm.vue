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
            <ion-label position="stacked">Transaction Number</ion-label>
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
            <ion-label position="stacked">From Account</ion-label>
            <ion-note slot="end">{{ accountText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item v-if="selectedAccount" class="balance-note">
            <ion-note>
              Balance: <strong :class="selectedAccount.current_balance >= 0 ? 'positive' : 'negative'">
                {{ formatCurrency(selectedAccount.current_balance, selectedAccount.currency) }}
              </strong>
              <span v-if="selectedAccount.credit_limit"> · Limit: {{ formatCurrency(selectedAccount.credit_limit, selectedAccount.currency) }}</span>
            </ion-note>
          </ion-item>
          <ion-item v-if="form.type === 'transfer'" button detail @click="showToAccountPicker = true">
            <ion-label position="stacked">To Account</ion-label>
            <ion-note slot="end">{{ toAccountText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item v-if="selectedToAccount && form.type === 'transfer'" class="balance-note">
            <ion-note>
              Balance: <strong :class="selectedToAccount.current_balance >= 0 ? 'positive' : 'negative'">
                {{ formatCurrency(selectedToAccount.current_balance, selectedToAccount.currency) }}
              </strong>
            </ion-note>
          </ion-item>
          <ion-item v-if="creditWarning" class="credit-warning">
            <ion-note color="warning">{{ creditWarning }}</ion-note>
          </ion-item>
          <ion-item v-if="form.type !== 'transfer'" button detail @click="showCategoryPicker = true">
            <ion-label position="stacked">Category</ion-label>
            <ion-note slot="end">{{ categoryText || 'Select' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Amount</ion-label>
            <ion-input
              v-model.number="form.amount"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
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
            <ion-label position="stacked">Transaction Date & Time</ion-label>
            <ion-note slot="end">{{ dateText }}</ion-note>
          </ion-item>
          <ion-item button detail @click="showStatusPicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ statusText }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showTypePicker" @didDismiss="showTypePicker = false">
        <ion-header><ion-toolbar><ion-title>Type</ion-title><ion-buttons slot="end"><ion-button @click="showTypePicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="c in typeCols" :key="c.value" button @click="selectType(c.value)"><ion-label>{{ c.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showAccountPicker" @didDismiss="showAccountPicker = false">
        <ion-header><ion-toolbar><ion-title>{{ form.type === 'transfer' ? 'From Account' : 'Account' }}</ion-title><ion-buttons slot="end"><ion-button @click="showAccountPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="a in accountCols" :key="a.value" button @click="selectAccount(a.value)"><ion-label>{{ a.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showToAccountPicker" @didDismiss="showToAccountPicker = false">
        <ion-header><ion-toolbar><ion-title>To Account</ion-title><ion-buttons slot="end"><ion-button @click="showToAccountPicker = false">Cancel</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="a in toAccountCols" :key="a.value" button @click="selectToAccount(a.value)"><ion-label>{{ a.text }}</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
      <!-- category picker -->
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
        <ion-header><ion-toolbar><ion-title>Date & Time</ion-title><ion-buttons slot="end"><ion-button @click="showDatePicker = false">OK</ion-button></ion-buttons></ion-toolbar></ion-header>
        <ion-content>
          <ion-datetime
            presentation="date-time"
            :value="dateTimeToIso(form.transaction_date)"
            @ionChange="onDateChange"
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
import { createTransaction, updateTransaction, getTransactionById, getCategoryTree, getAccounts, getPrimaryAccount } from '@/api/accounting'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const isEdit = !!id

// Same as tenant-admin: YYYY-MM-DD HH:mm:ss for API; ion-datetime uses ISO
const getCurrentDateTimeString = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const normalizeTransactionDateTime = (value) => {
  if (!value) return getCurrentDateTimeString()
  const s = String(value).trim()
  if (s.length === 10 && s.match(/^\d{4}-\d{2}-\d{2}$/)) return `${s} 00:00:00`
  const date = new Date(s)
  if (Number.isNaN(date.getTime())) return getCurrentDateTimeString()
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// ion-datetime value: ISO string (YYYY-MM-DDTHH:mm:ss)
const dateTimeToIso = (value) => {
  if (!value) return new Date().toISOString().slice(0, 19)
  const s = normalizeTransactionDateTime(value)
  return s.replace(' ', 'T')
}

const form = reactive({
  transaction_number: '',
  type: 'income',
  account_id: null,
  to_account_id: null,
  category_id: null,
  amount: 0,
  currency: 'USD',
  description: '',
  transaction_date: getCurrentDateTimeString(),
  status: 'completed'
})

const accountOptions = ref([])
const categoryOptions = ref([])
const currencyOptions = ref([{ value: 'USD', text: 'USD' }])
const saving = ref(false)
const creditWarning = ref(null)

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
const selectedAccount = computed(() => {
  if (form.account_id == null) return null
  const id = Number(form.account_id)
  return accountOptions.value.find(a => Number(a.id) === id) || null
})
const selectedToAccount = computed(() => {
  if (form.to_account_id == null) return null
  const id = Number(form.to_account_id)
  return accountOptions.value.find(a => Number(a.id) === id) || null
})
const accountText = computed(() => {
  const acc = selectedAccount.value
  if (!acc) return ''
  const bal = acc.current_balance ?? acc.balance ?? 0
  return `${acc.name} (${formatCurrency(bal, acc.currency)})`
})
const toAccountText = computed(() => {
  const acc = selectedToAccount.value
  if (!acc) return ''
  const bal = acc.current_balance ?? acc.balance ?? 0
  return `${acc.name} (${formatCurrency(bal, acc.currency)})`
})
const categoryText = computed(() => {
  if (form.category_id == null) return ''
  const id = Number(form.category_id)
  return categoryOptions.value.find(c => Number(c.value) === id)?.text || ''
})
const currencyText = computed(() => currencyOptions.value.find(c => c.value === form.currency)?.text || form.currency)
const dateText = computed(() => form.transaction_date || '')

function formatCurrency (amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount ?? 0)
}

const accountCols = computed(() =>
  accountOptions.value.map(a => ({
    text: `${a.name} (${formatCurrency(a.current_balance ?? a.balance, a.currency)})`,
    value: Number(a.id)
  }))
)
const toAccountCols = computed(() => {
  const fromId = form.account_id != null ? Number(form.account_id) : null
  return accountOptions.value
    .filter(a => Number(a.id) !== fromId)
    .map(a => ({ text: `${a.name} (${formatCurrency(a.current_balance ?? a.balance, a.currency)})`, value: Number(a.id) }))
})
const categoryCols = computed(() => categoryOptions.value.map(c => ({ text: c.text, value: c.value })))
const currencyCols = computed(() => currencyOptions.value.map(c => ({ text: c.text, value: c.value })))

function filterActiveCategories (categories) {
  return (categories || [])
    .filter(cat => cat.is_active !== false)
    .map(cat => ({
      ...cat,
      children: cat.children?.length ? filterActiveCategories(cat.children) : []
    }))
}

function flatten (arr, pre = '') {
  const out = []
  for (const c of arr || []) {
    const t = pre ? `${pre} > ${c.name}` : c.name
    out.push({ value: Number(c.id), text: t })
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
    if (Array.isArray(cur) && cur.length) {
      currencyOptions.value = cur.map(c => ({ value: c.code, text: `${c.code} - ${c.name || c.code}` }))
    }
    const def = await getTenantDefaultCurrency().catch(() => null)
    const dc = def?.data?.data ?? def?.data
    if (dc?.code) form.currency = dc.code
    else if (currencyOptions.value.length && !form.currency) form.currency = currencyOptions.value[0].value
  } catch (_) {
    if (!form.currency) form.currency = 'USD'
  }
}

async function loadCategories () {
  if (form.type === 'transfer') {
    categoryOptions.value = []
    return
  }
  try {
    const r = await getCategoryTree(form.type)
    const data = r?.data || r?.data?.data || []
    const filtered = filterActiveCategories(Array.isArray(data) ? data : [])
    categoryOptions.value = flatten(filtered)
  } catch (_) {
    categoryOptions.value = []
  }
}

function handleAccountChange () {
  creditWarning.value = null
  if (selectedAccount.value?.currency) {
    const code = selectedAccount.value.currency
    if (currencyOptions.value.some(c => c.value === code)) form.currency = code
  }
  checkCreditLimit()
}

function handleToAccountChange () {
  if (form.type === 'transfer' && selectedToAccount.value?.currency) {
    const code = selectedToAccount.value.currency
    if (currencyOptions.value.some(c => c.value === code)) form.currency = code
  }
}

function checkCreditLimit () {
  if (!selectedAccount.value || form.amount == null) {
    creditWarning.value = null
    return
  }
  const account = selectedAccount.value
  if ((account.type === 'credit_card' || account.type === 'loan') && account.credit_limit) {
    const newBalance = account.current_balance - Number(form.amount)
    if (newBalance < -account.credit_limit) {
      creditWarning.value = `May exceed credit limit. New balance: ${formatCurrency(newBalance, account.currency)}`
    } else {
      creditWarning.value = null
    }
  } else {
    creditWarning.value = null
  }
}

function selectType (value) {
  form.type = value
  showTypePicker.value = false
  if (value === 'transfer') {
    form.category_id = null
    // Keep account_id as From Account; only clear to_account_id when same as account_id
    if (form.to_account_id != null && form.to_account_id === form.account_id) {
      form.to_account_id = null
    }
  } else {
    form.category_id = null
    form.to_account_id = null
  }
  loadCategories()
}

function selectAccount (value) {
  form.account_id = value
  showAccountPicker.value = false
  handleAccountChange()
}

function selectToAccount (value) {
  form.to_account_id = value
  showToAccountPicker.value = false
  handleToAccountChange()
}

function onDateChange (e) {
  const v = e.detail.value
  if (v) form.transaction_date = normalizeTransactionDateTime(v)
}

watch(() => form.type, (newType, oldType) => {
  if (newType === oldType) return
  if (newType !== 'transfer') {
    loadCategories()
    form.category_id = null
    form.to_account_id = null
  } else {
    categoryOptions.value = []
    form.category_id = null
  }
})

watch([() => form.amount, () => form.account_id], () => checkCreditLimit())

async function loadEdit () {
  if (!id) return
  try {
    const r = await getTransactionById(id)
    const t = r?.data || r
    if (t) {
      const categoryId = t.category_id != null ? Number(t.category_id) : null
      const accountId = t.account_id != null ? Number(t.account_id) : null
      const toAccountId = t.to_account_id != null ? Number(t.to_account_id) : null
      form.transaction_number = t.transaction_number || ''
      form.type = t.type || 'income'
      form.amount = parseFloat(t.amount) || 0
      form.currency = t.currency || 'USD'
      form.description = t.description || ''
      form.transaction_date = normalizeTransactionDateTime(t.transaction_date)
      form.status = t.status || 'completed'
      await loadCategories()
      form.account_id = accountId
      form.to_account_id = toAccountId
      form.category_id = categoryId
    }
  } catch (e) {
    showToast('Failed to load')
    router.back()
  }
}

async function submit () {
  const amt = Number(form.amount)
  if (!form.transaction_number?.trim()) {
    showToast('Enter transaction number')
    return
  }
  if (!form.account_id) {
    showToast('Select an account')
    return
  }
  if (form.type === 'transfer' && !form.to_account_id) {
    showToast('Select to account')
    return
  }
  if (form.type !== 'transfer' && !form.category_id) {
    showToast('Select a category')
    return
  }
  if (amt < 0.01) {
    showToast('Amount must be greater than 0')
    return
  }
  saving.value = true
  try {
    const body = {
      transaction_number: form.transaction_number.trim(),
      type: form.type,
      account_id: form.account_id,
      to_account_id: form.type === 'transfer' ? form.to_account_id : null,
      category_id: form.type !== 'transfer' ? form.category_id : null,
      amount: amt,
      currency: form.currency,
      description: form.description?.trim() || null,
      transaction_date: normalizeTransactionDateTime(form.transaction_date),
      status: form.status
    }
    if (isEdit) await updateTransaction(id, body)
    else await createTransaction(body)
    showToast(isEdit ? 'Updated' : 'Created')
    router.back()
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

const validTypes = ['income', 'expense', 'transfer']
onMounted(async () => {
  await loadOptions()
  if (isEdit) {
    await loadEdit()
  } else {
    const queryType = route.query.type
    const queryAccountId = route.query.account_id
    if (queryType && validTypes.includes(queryType)) form.type = queryType
    form.transaction_number = `TXN-${Date.now()}`
    form.transaction_date = getCurrentDateTimeString()
    form.amount = 0
    await loadCategories()
    const accountId = queryAccountId != null ? Number(queryAccountId) : null
    if (accountId != null && accountOptions.value.some(a => Number(a.id) === accountId)) {
      form.account_id = accountId
      handleAccountChange()
    } else {
      try {
        const res = await getPrimaryAccount()
        const primaryId = res?.data?.account_id ?? null
        if (primaryId != null && accountOptions.value.some(a => a.id === primaryId)) {
          form.account_id = primaryId
          handleAccountChange()
        }
      } catch (_) {}
    }
  }
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.balance-note { --min-height: 32px; }
.balance-note ion-note { font-size: 12px; }
.positive { color: var(--ion-color-success); }
.negative { color: var(--ion-color-danger); }
.credit-warning ion-note { font-size: 12px; }
</style>
