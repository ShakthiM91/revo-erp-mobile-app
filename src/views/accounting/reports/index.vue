<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/transactions" />
        </ion-buttons>
        <ion-title>{{ reportTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" @click="fetchReports">Refresh</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <div class="filter-row">
          <ion-item lines="none" class="filter-item" button @click="showStartDatePicker = true">
            <ion-label position="stacked">From</ion-label>
            <ion-note slot="end">{{ startDate || 'Select' }}</ion-note>
          </ion-item>
          <ion-item lines="none" class="filter-item" button @click="showEndDatePicker = true">
            <ion-label position="stacked">To</ion-label>
            <ion-note slot="end">{{ endDate || 'Select' }}</ion-note>
          </ion-item>
          <ion-item lines="none" class="filter-item full-width">
            <ion-label position="stacked">Accounts</ion-label>
            <ion-select
              v-model="selectedAccountIds"
              multiple
              placeholder="All accounts"
              interface="action-sheet"
              @ionChange="fetchReports"
            >
              <ion-select-option
                v-for="account in accountOptions"
                :key="account.id"
                :value="account.id"
              >
                {{ account.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </div>
      </ion-toolbar>
      <ion-toolbar v-if="reportType === 'category_income' || reportType === 'category_expense'">
        <ion-segment v-model="categoryLevel" @ionChange="fetchReports">
          <ion-segment-button value="parent">Parent</ion-segment-button>
          <ion-segment-button value="leaf">Leaf</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar v-if="reportData.length" class="view-toolbar">
        <ion-segment v-model="viewMode" class="view-segment">
          <ion-segment-button value="chart">Chart</ion-segment-button>
          <ion-segment-button value="list">List</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <template v-else-if="reportData.length">
        <div class="report-content">
          <!-- Summary for monthly -->
          <ion-card v-if="reportType === 'monthly'" class="summary-card">
            <ion-card-header>
              <ion-card-title>Summary {{ dateRangeLabel }} ({{ defaultCurrency.code || 'USD' }})</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="summary-row">
                <span class="label">Total Income</span>
                <span class="value income">{{ formatCurrency(totalIncome) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Total Expenses</span>
                <span class="value expense">{{ formatCurrency(totalExpense) }}</span>
              </div>
              <div class="summary-row total">
                <span class="label">Net</span>
                <span class="value" :class="net >= 0 ? 'income' : 'expense'">{{ formatCurrency(net) }}</span>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Summary for daily -->
          <ion-card v-else-if="reportType === 'daily'" class="summary-card">
            <ion-card-header>
              <ion-card-title>Daily Summary ({{ defaultCurrency.code || 'USD' }})</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="summary-row">
                <span class="label">Total Income</span>
                <span class="value income">{{ formatCurrency(totalIncome) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Total Expense</span>
                <span class="value expense">{{ formatCurrency(totalExpense) }}</span>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Summary for balance growth -->
          <ion-card v-else-if="reportType === 'balance_growth'" class="summary-card">
            <ion-card-header>
              <ion-card-title>Balance Growth</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="summary-row total">
                <span class="label">Latest Balance</span>
                <span class="value" :class="latestBalance >= 0 ? 'income' : 'expense'">{{ formatCurrency(latestBalance) }}</span>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Summary for category reports -->
          <ion-card v-else-if="reportType === 'category_income' || reportType === 'category_expense'" class="summary-card">
            <ion-card-header>
              <ion-card-title>{{ reportType === 'category_income' ? 'Income' : 'Expense' }} by Category</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="summary-row total">
                <span class="label">Total</span>
                <span class="value" :class="reportType === 'category_income' ? 'income' : 'expense'">{{ formatCurrency(categoryTotal) }}</span>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Chart (default) -->
          <ion-card v-show="viewMode === 'chart'" class="chart-card">
            <ion-card-content class="chart-card-content">
              <ReportCharts
                :report-type="reportType"
                :report-data="reportData"
                :currency-code="defaultCurrency.code || 'USD'"
              />
            </ion-card-content>
          </ion-card>

          <!-- List views -->
          <ion-list
            v-show="viewMode === 'list'"
            v-if="reportType === 'monthly'"
            class="report-list"
            lines="full"
          >
            <ion-list-header>
              <ion-label>By month</ion-label>
            </ion-list-header>
            <ion-item v-for="row in reportData" :key="monthRowKey(row)" class="report-item">
              <ion-label class="report-item-label">
                <div class="report-item-title">{{ monthLabel(row) }}</div>
                <div class="report-item-meta">
                  <span class="meta-income">Income {{ formatCurrency(row.income) }}</span>
                  <span class="meta-sep">·</span>
                  <span class="meta-expense">Expense {{ formatCurrency(row.expense) }}</span>
                </div>
              </ion-label>
              <ion-note slot="end" class="report-item-end">{{ formatCurrency((row.income || 0) - (row.expense || 0)) }}</ion-note>
            </ion-item>
          </ion-list>

          <ion-list
            v-show="viewMode === 'list'"
            v-if="reportType === 'daily'"
            class="report-list"
            lines="full"
          >
            <ion-list-header>
              <ion-label>By date</ion-label>
            </ion-list-header>
            <ion-item v-for="row in reportData" :key="row.date" class="report-item">
              <ion-label class="report-item-label">
                <div class="report-item-title">{{ formatDateOnly(row.date) }}</div>
                <div class="report-item-meta">
                  <span class="meta-income">Income {{ formatCurrency(row.income) }}</span>
                  <span class="meta-sep">·</span>
                  <span class="meta-expense">Expense {{ formatCurrency(row.expense) }}</span>
                </div>
              </ion-label>
              <ion-note slot="end" class="report-item-end">{{ formatCurrency((row.income || 0) - (row.expense || 0)) }}</ion-note>
            </ion-item>
          </ion-list>

          <ion-list
            v-show="viewMode === 'list'"
            v-if="reportType === 'balance_growth'"
            class="report-list"
            lines="full"
          >
            <ion-list-header>
              <ion-label>By date</ion-label>
            </ion-list-header>
            <ion-item v-for="row in reportData" :key="row.date" class="report-item">
              <ion-label class="report-item-label">
                <div class="report-item-title">{{ formatDateOnly(row.date) }}</div>
              </ion-label>
              <ion-note slot="end" class="report-item-end">{{ formatCurrency(row.balance) }}</ion-note>
            </ion-item>
          </ion-list>

          <ion-list
            v-show="viewMode === 'list'"
            v-if="reportType === 'category_income' || reportType === 'category_expense'"
            class="report-list"
            lines="full"
          >
            <ion-list-header>
              <ion-label>By category</ion-label>
            </ion-list-header>
            <ion-item v-for="row in reportData" :key="row.category_id" class="report-item">
              <ion-label class="report-item-label">
                <div class="report-item-title">{{ row.category_name || 'Uncategorized' }}</div>
              </ion-label>
              <ion-note slot="end" class="report-item-end">{{ formatCurrency(row.amount) }}</ion-note>
            </ion-item>
          </ion-list>
        </div>
      </template>
      <div v-else class="empty-state">
        <ion-note>No data for selected period</ion-note>
      </div>

      <ion-modal :is-open="showStartDatePicker" @didDismiss="showStartDatePicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Start Date</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showStartDatePicker = false">OK</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-datetime
            presentation="date"
            :value="startDate || null"
            :max="endDate || undefined"
            @ionChange="onStartDateChange"
          />
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="showEndDatePicker" @didDismiss="showEndDatePicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>End Date</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showEndDatePicker = false">OK</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-datetime
            presentation="date"
            :value="endDate || null"
            :min="startDate || undefined"
            @ionChange="onEndDateChange"
          />
        </ion-content>
      </ion-modal>
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
  IonSegment,
  IonSegmentButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonModal,
  IonDatetime,
  IonSelect,
  IonSelectOption
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getReports, getAccounts } from '@/api/accounting'
import { getTenantDefaultCurrency } from '@/api/currency'
import ReportCharts from './ReportCharts.vue'

const ROUTE_TO_TYPE = {
  'income-expense': 'monthly',
  'daily-trends': 'daily',
  'balance-growth': 'balance_growth',
  'income-by-category': 'category_income',
  'expense-by-category': 'category_expense'
}

const route = useRoute()
const reportType = computed(() => {
  const lastSegment = route.path.split('/').pop()
  return ROUTE_TO_TYPE[lastSegment] || 'monthly'
})
const reportTitle = computed(() => {
  const titles = {
    monthly: 'Income vs Expense',
    daily: 'Daily Trends',
    balance_growth: 'Balance Growth',
    category_income: 'Income by Category',
    category_expense: 'Expense by Category'
  }
  return titles[reportType.value] || 'Report'
})
const categoryLevel = ref('leaf')
/** 'chart' is default; user can switch to 'list'. */
const viewMode = ref('chart')
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const startDate = ref('')
const endDate = ref('')
const selectedAccountIds = ref([])
const accountOptions = ref([])
const reportData = ref([])
const loading = ref(false)
const defaultCurrency = ref({ code: 'USD' })

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function monthLabel(row) {
  const m = Number(row.month) || 1
  const label = monthNames[m - 1] || `Month ${m}`
  const y = row.year
  return y != null && y !== '' ? `${label} ${y}` : label
}
function monthRowKey(row) {
  return `${row.year ?? ''}-${row.month}`
}

function initDateRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  startDate.value = start.toISOString().split('T')[0]
  endDate.value = end.toISOString().split('T')[0]
}

function onStartDateChange(e) {
  const v = e.detail.value
  if (v) {
    startDate.value = v.slice(0, 10)
    fetchReports()
  }
}

function onEndDateChange(e) {
  const v = e.detail.value
  if (v) {
    endDate.value = v.slice(0, 10)
    fetchReports()
  }
}

const dateRangeLabel = computed(() => {
  if (startDate.value && endDate.value) {
    return `${startDate.value} – ${endDate.value}`
  }
  return ''
})

const reportParams = computed(() => {
  const params = {
    type: reportType.value,
    year: new Date().getFullYear().toString()
  }
  if (startDate.value) params.start_date = startDate.value
  if (endDate.value) params.end_date = endDate.value
  if (selectedAccountIds.value && selectedAccountIds.value.length > 0) {
    params.account_ids = selectedAccountIds.value.join(',')
  }
  if (reportType.value === 'category_income' || reportType.value === 'category_expense') {
    params.category_level = categoryLevel.value
  }
  return params
})

const totalIncome = computed(() =>
  reportData.value.reduce((s, r) => s + (parseFloat(r.income) || 0), 0)
)
const totalExpense = computed(() =>
  reportData.value.reduce((s, r) => s + (parseFloat(r.expense) || 0), 0)
)
const net = computed(() => totalIncome.value - totalExpense.value)
const latestBalance = computed(() => {
  if (reportType.value !== 'balance_growth' || !reportData.value.length) return 0
  return parseFloat(reportData.value[reportData.value.length - 1]?.balance) || 0
})
const categoryTotal = computed(() =>
  reportData.value.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
)

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: defaultCurrency.value?.code || 'USD',
    minimumFractionDigits: 2
  }).format(parseFloat(v) || 0)
}

function formatDateOnly(v) {
  if (!v) return ''
  const s = String(v)
  return s.includes('T') ? s.slice(0, 10) : s
}

async function fetchReports() {
  loading.value = true
  try {
    const response = await getReports(reportParams.value)
    if (response && response.success) {
      reportData.value = response.data || []
    } else {
      reportData.value = []
    }
  } catch (e) {
    showToast('Failed to load')
    reportData.value = []
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await fetchReports()
  ev.target.complete()
}

async function loadAccounts() {
  try {
    const res = await getAccounts({ is_active: true })
    if (res?.success && res?.data) {
      accountOptions.value = res.data
    }
  } catch (e) {
    accountOptions.value = []
  }
}

watch(() => route.path, () => {
  viewMode.value = 'chart'
  fetchReports()
})

onMounted(async () => {
  initDateRange()
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
  await loadAccounts()
  await fetchReports()
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
.report-content { padding: 0 16px 16px; }
.summary-card {
  margin: 0 0 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.summary-card ion-card-title {
  font-size: 1rem;
}
.summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
.summary-row.total { border-top: 1px solid var(--ion-color-light); margin-top: 8px; font-weight: 600; }
.summary-row .label { color: var(--ion-color-medium); }
.summary-row .value.income { color: var(--ion-color-success); }
.summary-row .value.expense { color: var(--ion-color-danger); }
.filter-row { display: flex; flex-wrap: wrap; align-items: flex-start; padding: 0 8px; width: 100%; }
.filter-item { --padding-start: 8px; --inner-padding-end: 8px; flex: 1; min-width: 120px; }
.filter-item.full-width { flex: 1 1 100%; min-width: 100%; }
.filter-item ion-note { font-size: 14px; }
.filter-item ion-select { max-width: 100%; }
.view-toolbar {
  --min-height: 44px;
  --padding-start: 12px;
  --padding-end: 12px;
}
.view-segment {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}
.chart-card {
  margin: 0 0 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.chart-card-content {
  --padding-top: 8px;
  --padding-bottom: 12px;
  --padding-start: 8px;
  --padding-end: 8px;
}
.report-list {
  background: transparent;
  margin: 0;
  padding: 0 0 8px;
}
.report-list ion-list-header {
  --background: transparent;
  --color: var(--ion-color-medium);
  font-size: 13px;
  font-weight: 600;
  min-height: 36px;
  padding-top: 4px;
}
.report-item {
  --padding-start: 12px;
  --inner-padding-end: 12px;
  --min-height: 64px;
  border-radius: 10px;
  margin-bottom: 6px;
  --background: var(--ion-item-background, #fff);
}
.report-item-label {
  margin: 6px 0;
}
.report-item-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
  letter-spacing: -0.01em;
}
.report-item-meta {
  font-size: 13px;
  margin-top: 4px;
  color: var(--ion-color-medium);
}
.meta-income { color: var(--ion-color-success); }
.meta-expense { color: var(--ion-color-danger); }
.meta-sep { padding: 0 4px; opacity: 0.5; }
.report-item-end {
  font-size: 14px;
  font-weight: 600;
  align-self: center;
  max-width: 42%;
  text-align: end;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
