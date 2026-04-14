<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-toggle>
            <ion-button>
              <ion-icon :icon="menuOutline" />
            </ion-button>
          </ion-menu-toggle>
        </ion-buttons>
        <ion-title class="ion-text-center">
          <img :src="logoUrl" class="brand-logo" alt="" />
          <span>{{ appName || 'Revo ERP' }}</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <div class="dashboard">
        <ion-grid class="stat-grid">
          <ion-row>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/members')">
                <ion-icon :icon="peopleOutline" class="stat-icon" />
                <div class="grid-label">Total Members</div>
                <div class="grid-value">{{ statistics.totalMembers }}</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/members')">
                <ion-icon :icon="personOutline" class="stat-icon" />
                <div class="grid-label">Active Members</div>
                <div class="grid-value">{{ statistics.activeMembers }}</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/assets')">
                <ion-icon :icon="cubeOutline" class="stat-icon" />
                <div class="grid-label">Total Assets</div>
                <div class="grid-value">{{ statistics.totalAssets }}</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card" @click="$router.push('/schedule')">
                <ion-icon :icon="calendarOutline" class="stat-icon" />
                <div class="grid-label">Upcoming Events</div>
                <div class="grid-value">{{ statistics.upcomingEvents }}</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <section class="finance-section">
          <h2 class="section-title">Finance</h2>

          <div class="quick-actions">
            <button type="button" class="action-cell" @click="$router.push('/accounts')">
              <ion-icon :icon="walletOutline" class="action-icon" />
              <span class="action-label">Accounts</span>
            </button>
            <button type="button" class="action-cell" @click="$router.push('/accounts/create')">
              <ion-icon :icon="addCircleOutline" class="action-icon" />
              <span class="action-label">New account</span>
            </button>
            <button type="button" class="action-cell" @click="$router.push('/transactions')">
              <ion-icon :icon="receiptOutline" class="action-icon" />
              <span class="action-label">Transactions</span>
            </button>
            <button type="button" class="action-cell" @click="$router.push('/transactions/create')">
              <ion-icon :icon="addOutline" class="action-icon" />
              <span class="action-label">New txn</span>
            </button>
            <button type="button" class="action-cell" @click="$router.push('/reports/income-expense')">
              <ion-icon :icon="barChartOutline" class="action-icon" />
              <span class="action-label">Reports</span>
            </button>
            <button type="button" class="action-cell" @click="$router.push('/accounting/categories')">
              <ion-icon :icon="pricetagsOutline" class="action-icon" />
              <span class="action-label">Categories</span>
            </button>
            <button type="button" class="action-cell" @click="$router.push('/budgets')">
              <ion-icon :icon="calculatorOutline" class="action-icon" />
              <span class="action-label">Budgets</span>
            </button>
          </div>

          <ion-card v-if="financeLoading && !financeLoadedOnce" class="finance-card">
            <ion-card-content class="ion-text-center">
              <ion-spinner name="crescent" />
            </ion-card-content>
          </ion-card>

          <template v-else>
            <ion-card class="finance-card summary-card">
              <ion-card-header>
                <ion-card-title>Summary</ion-card-title>
                <ion-card-subtitle>All-time · {{ defaultCurrency.code || 'USD' }}</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <ion-grid class="summary-grid">
                  <ion-row>
                    <ion-col size="4">
                      <div class="sum-cell">
                        <span class="sum-label">Income</span>
                        <span class="sum-val income">{{ formatCurrency(accountingSummary.total_income) }}</span>
                      </div>
                    </ion-col>
                    <ion-col size="4">
                      <div class="sum-cell">
                        <span class="sum-label">Expense</span>
                        <span class="sum-val expense">{{ formatCurrency(accountingSummary.total_expense) }}</span>
                      </div>
                    </ion-col>
                    <ion-col size="4">
                      <div class="sum-cell">
                        <span class="sum-label">Net</span>
                        <span class="sum-val" :class="financeNet >= 0 ? 'income' : 'expense'">{{ formatCurrency(financeNet) }}</span>
                      </div>
                    </ion-col>
                  </ion-row>
                </ion-grid>
                <div class="txn-count">
                  <ion-note>{{ accountingSummary.total_transactions ?? 0 }} transactions recorded</ion-note>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card class="finance-card">
              <ion-card-header>
                <ion-card-title>Accounts</ion-card-title>
                <ion-card-subtitle>Active accounts</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="accounts-row">
                  <span class="accounts-label">Count</span>
                  <span class="accounts-value">{{ accountsSnapshot.count }}</span>
                </div>
                <template v-if="accountsSnapshot.mixed">
                  <div class="accounts-row">
                    <span class="accounts-label">Balance ({{ defaultCurrency.code || 'USD' }} only)</span>
                    <span class="accounts-value">{{ formatCurrency(accountsSnapshot.partialTotal) }}</span>
                  </div>
                  <ion-note class="multi-currency-note">Additional accounts use other currencies — open Accounts for per-account balances.</ion-note>
                </template>
                <div v-else class="accounts-row">
                  <span class="accounts-label">Combined balance</span>
                  <span class="accounts-value">{{ formatCurrency(accountsSnapshot.totalBalance) }}</span>
                </div>
              </ion-card-content>
            </ion-card>

            <FinanceCharts
              :currency-code="defaultCurrency.code || 'USD'"
              :summary-income="Number(accountingSummary.total_income) || 0"
              :summary-expense="Number(accountingSummary.total_expense) || 0"
              :daily-labels="dailyChart.labels"
              :daily-income="dailyChart.income"
              :daily-expense="dailyChart.expense"
              :show-daily-bar="dailyChartAvailable"
            />
          </template>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonMenuToggle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonNote
} from '@ionic/vue'
import {
  peopleOutline,
  personOutline,
  cubeOutline,
  calendarOutline,
  menuOutline,
  walletOutline,
  addCircleOutline,
  receiptOutline,
  addOutline,
  barChartOutline,
  pricetagsOutline,
  calculatorOutline
} from 'ionicons/icons'
import { showToast } from '@/utils/ionicFeedback'
import { useUserStore } from '@/store/user'
import { getTenant } from '@/api/tenant'
import { getMemberStatistics } from '@/api/member'
import { getAssets } from '@/api/asset'
import { getSummary, getAccounts, getReports } from '@/api/accounting'
import { getTenantDefaultCurrency } from '@/api/currency'
import FinanceCharts from '@/components/dashboard/FinanceCharts.vue'

const userStore = useUserStore()
const appName = ref('')
const logoUrl = ref(null)

const statistics = ref({
  totalMembers: 0,
  activeMembers: 0,
  totalAssets: 0,
  upcomingEvents: 0
})

const defaultCurrency = ref({ code: 'USD' })
const accountingSummary = ref({
  total_income: 0,
  total_expense: 0,
  total_transactions: 0
})
const accountsSnapshot = ref({
  count: 0,
  totalBalance: 0,
  mixed: false,
  partialTotal: 0
})
const dailyChart = ref({ labels: [], income: [], expense: [] })
const dailyChartAvailable = ref(false)
const financeLoading = ref(false)
const financeLoadedOnce = ref(false)

const financeNet = computed(
  () => (Number(accountingSummary.value.total_income) || 0) - (Number(accountingSummary.value.total_expense) || 0)
)

function formatCurrency (v) {
  const code = defaultCurrency.value?.code || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2
  }).format(Number(v) || 0)
}

function normalizeDateKey (d) {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  try {
    return new Date(d).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function buildDailyChartSeries (rows, startStr, endStr) {
  const map = new Map()
  for (const r of rows || []) {
    const key = normalizeDateKey(r.date)
    if (key) {
      map.set(key, {
        income: Number(r.income) || 0,
        expense: Number(r.expense) || 0
      })
    }
  }
  const labels = []
  const income = []
  const expense = []
  const start = new Date(startStr + 'T12:00:00')
  const end = new Date(endStr + 'T12:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const row = map.get(key) || { income: 0, expense: 0 }
    labels.push(
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    )
    income.push(row.income)
    expense.push(row.expense)
  }
  return { labels, income, expense }
}

function computeAccountsSnapshot (accounts, defaultCode) {
  const list = Array.isArray(accounts) ? accounts : []
  const def = (defaultCode || 'USD').toString().toUpperCase()
  const withBal = list.filter(
    (a) => a.current_balance != null || a.balance != null
  )
  const codes = new Set()
  for (const a of withBal) {
    codes.add((a.currency || def).toString().toUpperCase())
  }
  if (codes.size <= 1) {
    const sum = withBal.reduce(
      (s, a) => s + Number(a.current_balance ?? a.balance ?? 0),
      0
    )
    return { count: list.length, totalBalance: sum, mixed: false, partialTotal: 0 }
  }
  const sameDefault = withBal.filter(
    (a) => (a.currency || def).toString().toUpperCase() === def
  )
  const partialTotal = sameDefault.reduce(
    (s, a) => s + Number(a.current_balance ?? a.balance ?? 0),
    0
  )
  return {
    count: list.length,
    totalBalance: partialTotal,
    mixed: true,
    partialTotal
  }
}

async function loadBranding () {
  const tenantId = userStore.tenantId
  if (!tenantId) {
    appName.value = 'Revo ERP'
    logoUrl.value = null
    return
  }
  try {
    const res = await getTenant()
    const data = res?.data
    if (!data) return
    const settings = typeof data.settings === 'string' ? JSON.parse(data.settings || '{}') : (data.settings || {})
    appName.value = settings.app_name || data.name || 'Revo ERP'
    if (settings.logo_url) {
      logoUrl.value = settings.logo_url
    } else {
      const path = settings.logo_path
      if (path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
          logoUrl.value = path
        } else {
          const base = (data.attachment_base_url || '').replace(/\/$/, '')
          logoUrl.value = base ? `${base}/${path.replace(/^\//, '')}` : null
        }
      } else {
        logoUrl.value = null
      }
    }
  } catch (e) {
    appName.value = 'Revo ERP'
    logoUrl.value = null
  }
}

const fetchStatistics = async () => {
  try {
    const memberRes = await getMemberStatistics()
    if (memberRes?.success && memberRes?.data) {
      statistics.value.totalMembers = memberRes.data.total_members ?? 0
      statistics.value.activeMembers = memberRes.data.active_members ?? 0
    }
    try {
      const assetsRes = await getAssets({ limit: 500 })
      statistics.value.totalAssets = (assetsRes?.data || []).length
    } catch {
      statistics.value.totalAssets = 0
    }
    statistics.value.upcomingEvents = 0
  } catch (e) {
    console.error('Dashboard fetch error:', e)
    showToast('Failed to load dashboard')
  }
}

function endDateStr () {
  return new Date().toISOString().split('T')[0]
}

function startDateStrDaysAgo (days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

async function loadFinance () {
  financeLoading.value = true
  const startStr = startDateStrDaysAgo(13)
  const endStr = endDateStr()

  try {
    const [curRes, sumRes, accRes, repRes] = await Promise.all([
      getTenantDefaultCurrency().catch(() => null),
      getSummary().catch(() => null),
      getAccounts({ is_active: true }).catch(() => null),
      getReports(
        { type: 'daily', start_date: startStr, end_date: endStr },
        { silent403: true }
      ).catch(() => null)
    ])

    if (curRes) {
      const c = curRes?.data?.data ?? curRes?.data
      if (c?.code) defaultCurrency.value = c
    }

    const defCode = defaultCurrency.value?.code || 'USD'

    if (sumRes?.success && sumRes?.data) {
      accountingSummary.value = {
        total_income: sumRes.data.total_income ?? 0,
        total_expense: sumRes.data.total_expense ?? 0,
        total_transactions: sumRes.data.total_transactions ?? 0
      }
    }

    const accData = accRes?.data ?? accRes
    const accList = Array.isArray(accData) ? accData : []
    accountsSnapshot.value = computeAccountsSnapshot(accList, defCode)

    if (repRes?.success && Array.isArray(repRes.data)) {
      dailyChart.value = buildDailyChartSeries(repRes.data, startStr, endStr)
      dailyChartAvailable.value = true
    } else {
      dailyChart.value = buildDailyChartSeries([], startStr, endStr)
      dailyChartAvailable.value = false
    }

    financeLoadedOnce.value = true
  } catch (e) {
    console.error('Finance load error:', e)
    showToast('Failed to load finance section')
    financeLoadedOnce.value = true
  } finally {
    financeLoading.value = false
  }
}

const onRefresh = async (ev) => {
  await Promise.all([loadBranding(), fetchStatistics(), loadFinance()])
  ev.target.complete()
}

onMounted(() => {
  loadBranding()
  fetchStatistics()
  loadFinance()
})
</script>

<style scoped>
.brand-logo {
  max-height: 28px;
  width: auto;
  vertical-align: middle;
  object-fit: contain;
}
.dashboard {
  padding: 16px;
  padding-bottom: 32px;
  min-height: 100%;
  background: #f7f8fa;
}
.stat-grid ion-col {
  padding: 8px;
}
.stat-card {
  padding: 16px 8px;
  background: #fff;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.stat-icon {
  font-size: 28px;
  color: var(--ion-color-primary);
  margin-bottom: 8px;
}
.grid-label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}
.grid-value {
  font-size: 20px;
  font-weight: 700;
  color: #323233;
}

.finance-section {
  margin-top: 8px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px 4px;
}
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.action-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 6px;
  background: #fff;
  border: none;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.action-cell:active {
  opacity: 0.85;
}
.action-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
}
.action-label {
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  color: #646566;
}

.finance-card {
  margin: 0 0 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.summary-grid ion-col {
  padding: 4px;
}
.sum-cell {
  text-align: center;
}
.sum-label {
  display: block;
  font-size: 11px;
  color: #969799;
  margin-bottom: 4px;
}
.sum-val {
  font-size: 14px;
  font-weight: 700;
  word-break: break-word;
}
.sum-val.income {
  color: var(--ion-color-success, #2dd36f);
}
.sum-val.expense {
  color: var(--ion-color-danger, #eb445a);
}
.txn-count {
  margin-top: 8px;
  text-align: center;
}
.accounts-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-color-light, #eee);
}
.accounts-row:last-of-type {
  border-bottom: none;
}
.accounts-label {
  font-size: 14px;
  color: #646566;
}
.accounts-value {
  font-size: 16px;
  font-weight: 600;
}
.multi-currency-note {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
}
</style>
