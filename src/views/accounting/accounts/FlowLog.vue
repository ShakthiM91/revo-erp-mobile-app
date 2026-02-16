<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/accounts" />
        </ion-buttons>
        <ion-title>Flow Log</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" @click="load">Refresh</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar v-if="accountName">
        <ion-title size="small">{{ accountName }}</ion-title>
      </ion-toolbar>
      <ion-toolbar v-if="summary">
        <div class="summary-row">
          <div class="summary-item">
            <span class="summary-label">Entries</span>
            <span class="summary-value">{{ summary.total_entries }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Income</span>
            <span class="summary-value income">{{ formatCurrency(summary.total_income, currency) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Expense</span>
            <span class="summary-value expense">{{ formatCurrency(summary.total_expense, currency) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Net</span>
            <span class="summary-value" :class="(summary.net_flow || 0) >= 0 ? 'income' : 'expense'">
              {{ formatCurrency(summary.net_flow, currency) }}
            </span>
          </div>
        </div>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment :value="flowTypeFilter" @ionChange="onFlowTypeChange">
          <ion-segment-button value="">All</ion-segment-button>
          <ion-segment-button value="income">Income</ion-segment-button>
          <ion-segment-button value="expense">Expense</ion-segment-button>
          <ion-segment-button value="transfer_in">In</ion-segment-button>
          <ion-segment-button value="transfer_out">Out</ion-segment-button>
          <ion-segment-button value="initial_balance">Initial</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-spinner v-if="loading && flowLog.length === 0" name="crescent" class="spinner" />
      <ion-list v-else-if="flowLog.length" lines="inset">
        <ion-item v-for="row in flowLog" :key="row.id">
          <ion-label>
            <h2>{{ formatFlowType(row.flow_type) }} · {{ formatDate(row.transaction_date) }}</h2>
            <p v-if="row.description">{{ row.description }}</p>
            <p v-if="row.category" class="category-note">{{ row.category }}</p>
          </ion-label>
          <div slot="end" class="flow-amounts">
            <span class="amount" :class="amountClass(row.flow_type)">{{ formatCurrency(row.amount, row.currency) }}</span>
            <span class="balance-after" :class="(row.balance_after || 0) >= 0 ? 'income' : 'expense'">
              Bal: {{ formatCurrency(row.balance_after, row.currency) }}
            </span>
          </div>
        </ion-item>
      </ion-list>
      <div v-else-if="!loading" class="empty-state">
        <ion-note>No flow log entries</ion-note>
      </div>
      <ion-infinite-scroll
        v-if="hasMore && flowLog.length > 0"
        :disabled="loadingMore"
        @ionInfinite="loadMore"
      >
        <ion-infinite-scroll-content loading-spinner="crescent" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getAccountFlowLog, getAccountFlowSummary } from '@/api/accounting'
import { useSyncStore } from '@/store/sync'

const route = useRoute()
const syncStore = useSyncStore()
const accountId = computed(() => route.params.id)

const accountName = ref('')
const currency = ref('USD')
const loading = ref(false)
const loadingMore = ref(false)
const flowLog = ref([])
const summary = ref(null)
const flowTypeFilter = ref('')
const currentPage = ref(1)
const pageSize = 20
const pagination = ref(null)

const hasMore = computed(() => {
  if (!pagination.value) return false
  const total = pagination.value.total || 0
  return flowLog.value.length < total
})

function formatCurrency(amount, cur = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cur || currency.value,
    minimumFractionDigits: 2
  }).format(amount ?? 0)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFlowType(type) {
  const map = {
    income: 'Income',
    expense: 'Expense',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    adjustment: 'Adjustment',
    initial_balance: 'Initial'
  }
  return map[type] || type || '-'
}

function amountClass(type) {
  if (type === 'income' || type === 'transfer_in') return 'income'
  if (type === 'expense' || type === 'transfer_out') return 'expense'
  return ''
}

async function fetchFlowLog(page = 1, append = false) {
  if (!accountId.value) return
  const isFirst = page === 1
  if (isFirst) loading.value = true
  else loadingMore.value = true
  try {
    const params = { page, limit: pageSize }
    if (flowTypeFilter.value) params.flow_type = flowTypeFilter.value
    const res = await getAccountFlowLog(accountId.value, params)
    const data = res?.data ?? []
    const pag = res?.pagination ?? null
    pagination.value = pag
    if (append) flowLog.value = [...flowLog.value, ...data]
    else flowLog.value = data
  } catch (e) {
    showToast('Failed to load flow log')
    if (!append) flowLog.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function fetchSummary() {
  if (!accountId.value) return
  try {
    const res = await getAccountFlowSummary(accountId.value, {})
    summary.value = res?.data ?? null
  } catch (_) {
    summary.value = null
  }
}

async function load() {
  currentPage.value = 1
  await Promise.all([fetchFlowLog(1), fetchSummary()])
}

async function loadMore(ev) {
  const next = currentPage.value + 1
  await fetchFlowLog(next, true)
  currentPage.value = next
  ev.target.complete()
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

function onFlowTypeChange(e) {
  flowTypeFilter.value = e.detail?.value ?? ''
  currentPage.value = 1
  fetchFlowLog(1)
}

async function refetchIfInvalidated() {
  const id = Number(accountId.value)
  if (id && syncStore.invalidatedAccountIds?.has(id)) {
    await load()
    syncStore.clearInvalidatedAccountId(id)
  }
}

onMounted(async () => {
  accountName.value = route.query.name || 'Account'
  currency.value = route.query.currency || 'USD'
  await load()
  await refetchIfInvalidated()
})

watch(accountId, () => refetchIfInvalidated())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
.summary-row { display: flex; justify-content: space-around; padding: 8px 0; flex-wrap: wrap; gap: 8px; }
.summary-item { display: flex; flex-direction: column; align-items: center; }
.summary-label { font-size: 11px; color: var(--ion-color-medium); }
.summary-value { font-weight: 600; font-size: 13px; }
.summary-value.income { color: var(--ion-color-success); }
.summary-value.expense { color: var(--ion-color-danger); }
.flow-amounts { display: flex; flex-direction: column; align-items: flex-end; }
.flow-amounts .amount { font-weight: 600; }
.flow-amounts .balance-after { font-size: 12px; color: var(--ion-color-medium); }
.flow-amounts .amount.income { color: var(--ion-color-success); }
.flow-amounts .amount.expense { color: var(--ion-color-danger); }
.category-note { font-size: 12px; color: var(--ion-color-medium); }
</style>
