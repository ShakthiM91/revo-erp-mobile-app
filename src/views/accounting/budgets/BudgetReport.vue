<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>Budget Report: {{ planName }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <template v-else>
        <div v-if="planStart && planEnd" class="plan-period">
          Plan: {{ formatDateRange(planStart, planEnd) }}
          <ion-badge color="medium">{{ currency }}</ion-badge>
        </div>

        <ion-segment v-model="activeTab" @ionChange="onTabChange">
          <ion-segment-button value="full">
            <ion-label>Full Report</ion-label>
          </ion-segment-button>
          <ion-segment-button value="period">
            <ion-label>By Period</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Full Report -->
        <div v-if="activeTab === 'full' && fullReport" class="report-section">
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div class="stat-card">
                  <div class="stat-label">Total Budget</div>
                  <div class="stat-value">{{ formatCurrency(fullReport.summary?.total_budget) }}</div>
                </div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-card">
                  <div class="stat-label">Total Actual</div>
                  <div class="stat-value">{{ formatCurrency(fullReport.summary?.total_actual) }}</div>
                </div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-card">
                  <div class="stat-label">Variance</div>
                  <div class="stat-value" :class="(fullReport.summary?.variance || 0) >= 0 ? 'success' : 'danger'">
                    {{ formatCurrency(fullReport.summary?.variance) }}
                  </div>
                </div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-card">
                  <div class="stat-label">Within Budget</div>
                  <div class="stat-value">
                    <ion-badge :color="fullReport.summary?.within_overall_budget ? 'success' : 'danger'">
                      {{ fullReport.summary?.within_overall_budget ? 'Yes' : 'No' }}
                    </ion-badge>
                  </div>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
          <h4>Period Summary</h4>
          <ion-list lines="inset">
            <ion-item v-for="(p, i) in (fullReport.periods || [])" :key="i">
              <ion-label>
                <h3>{{ p.period_start }} to {{ p.period_end }}</h3>
              </ion-label>
              <ion-note slot="end">
                {{ formatCurrency(p.totalBudget) }} / {{ formatCurrency(p.totalActual) }}
                <span :class="(p.variance || 0) >= 0 ? 'success' : 'danger'">{{ formatCurrency(p.variance) }}</span>
              </ion-note>
            </ion-item>
          </ion-list>
        </div>

        <!-- By Period -->
        <div v-if="activeTab === 'period'">
          <ion-item>
            <ion-label>Select Period</ion-label>
            <ion-select v-model="selectedPeriodIndex" interface="action-sheet" @ionChange="loadPeriodReport">
              <ion-select-option v-for="(p, i) in periods" :key="i" :value="i">
                {{ p.periodStart }} to {{ p.periodEnd }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <div v-if="periodReport" class="report-section">
            <h4>Expense Categories to Watch</h4>
            <div class="period-label">{{ formatPeriodLabel(periodReport.period_start, periodReport.period_end) }}</div>
            <div class="period-stats">
              Budget: {{ formatCurrency(periodReport.totalBudget) }} | Actual: {{ formatCurrency(periodReport.totalActual) }} | Diff:
              <span :class="(periodReport.variance || 0) >= 0 ? 'success' : 'danger'">{{ formatCurrency(periodReport.variance) }}</span>
            </div>
            <ion-list lines="inset">
              <ion-item v-for="item in (periodReport.items || [])" :key="item.category_id">
                <ion-label>
                  <h2>{{ item.category_name }}</h2>
                  <p>
                    Actual: {{ formatCurrency(item.actual) }} | Budget: {{ formatCurrency(item.budget) }} | Diff:
                    <span :class="(item.variance || 0) >= 0 ? 'success' : 'danger'">{{ formatCurrency(item.variance) }}</span>
                  </p>
                  <div v-if="item.budget > 0" class="percent-row">
                    <ion-progress-bar
                      :value="Math.min(getPercentUsed(item) / 100, 1)"
                      :color="getPercentUsed(item) > 100 ? 'danger' : 'success'"
                    />
                    <span :class="['percent-text', getPercentUsed(item) > 100 ? 'danger' : 'success']">
                      {{ getPercentUsed(item).toFixed(1) }}%
                    </span>
                  </div>
                </ion-label>
                <ion-note slot="end">
                  <ion-badge v-if="item.is_divertable" color="medium">Divert</ion-badge>
                </ion-note>
              </ion-item>
            </ion-list>
            <ion-card v-if="periodReport.divertableContributors?.length && periodReport.overrunCategories?.length" class="divertable-summary">
              <ion-card-header>
                <ion-card-title>Divertable Allocation</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p class="divertable-desc">Unused amounts from divertable categories have been used to cover overruns:</p>
                <div class="divertable-row">
                  <strong>Surplus from:</strong>
                  <span v-for="(c, i) in periodReport.divertableContributors" :key="c.category_id">
                    {{ c.category_name }} ({{ formatCurrency(c.surplus) }})<span v-if="i < periodReport.divertableContributors.length - 1">, </span>
                  </span>
                  <span v-if="periodReport.divertablePool > 0"> — total {{ formatCurrency(periodReport.divertablePool) }}</span>
                </div>
                <div class="divertable-row">
                  <strong>Covering overruns in:</strong>
                  <span v-for="(c, i) in periodReport.overrunCategories" :key="c.category_id">
                    {{ c.category_name }} ({{ formatCurrency(c.overrun) }})<span v-if="i < periodReport.overrunCategories.length - 1">, </span>
                  </span>
                  <span v-if="periodReport.divertableUsage > 0"> — total {{ formatCurrency(periodReport.divertableUsage) }}</span>
                </div>
              </ion-card-content>
            </ion-card>
            <div class="period-context">
              <p>Report date: {{ reportDate }}</p>
              <p v-if="periodContext">{{ periodContext }}</p>
              <p v-if="overallPercentUsed != null">Overall: {{ overallPercentUsed.toFixed(1) }}% of budget used</p>
            </div>
          </div>
        </div>

        <!-- Income Statement -->
        <ion-accordion-group v-if="planStart && planEnd">
          <ion-accordion value="income">
            <ion-item slot="header">
              <ion-label>Income Statement</ion-label>
            </ion-item>
            <div slot="content" class="ion-padding">
              <div v-if="incomeLoading" class="ion-text-center">
                <ion-spinner />
              </div>
              <template v-else>
                <h5>Monthly Income Statement</h5>
                <ion-list v-if="monthlyIncomeData.length && monthlyColumns.length" lines="inset">
                  <ion-item>
                    <ion-label><strong>Description</strong></ion-label>
                    <ion-note slot="end">
                      <span v-for="m in monthlyColumns.slice(0, 4)" :key="m.key" class="col-head">{{ m.label }}</span>
                    </ion-note>
                  </ion-item>
                  <ion-item v-for="row in monthlyIncomeData" :key="row.label">
                    <ion-label>{{ row.label }}</ion-label>
                    <ion-note slot="end">
                      <span v-for="m in monthlyColumns.slice(0, 4)" :key="m.key" class="col-val" :class="(row[m.key] || 0) < 0 ? 'danger' : ''">
                        {{ formatCurrency(row[m.key]) }}
                      </span>
                    </ion-note>
                  </ion-item>
                </ion-list>
                <p v-else class="no-data">No monthly data for plan period</p>
                <h5>Yearly Income Statement</h5>
                <ion-list v-if="yearlyIncomeData.length && yearlyColumns.length" lines="inset">
                  <ion-item>
                    <ion-label><strong>Description</strong></ion-label>
                    <ion-note slot="end">
                      <span v-for="y in yearlyColumns" :key="y.key" class="col-head">{{ y.label }}</span>
                    </ion-note>
                  </ion-item>
                  <ion-item v-for="row in yearlyIncomeData" :key="row.label">
                    <ion-label>{{ row.label }}</ion-label>
                    <ion-note slot="end">
                      <span v-for="y in yearlyColumns" :key="y.key" class="col-val" :class="(row[y.key] || 0) < 0 ? 'danger' : ''">
                        {{ formatCurrency(row[y.key]) }}
                      </span>
                    </ion-note>
                  </ion-item>
                </ion-list>
                <p v-else class="no-data">No yearly data for plan period</p>
              </template>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatDateRange } from '@/utils/dateUtils'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonNote,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonAccordionGroup,
  IonAccordion,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getBudgetById, getBudgetFullReport, getBudgetPeriodReport, getBudgetPeriods } from '@/api/accounting'
import { getReports } from '@/api/accounting'

const route = useRoute()
const planId = computed(() => route.params.id)

const loading = ref(false)
const activeTab = ref('full')
const planName = ref('')
const planStart = ref('')
const planEnd = ref('')
const planPeriodType = ref('month')
const fullReport = ref(null)
const periodReport = ref(null)
const periods = ref([])
const selectedPeriodIndex = ref(0)
const currency = ref('USD')

const reportDate = computed(() =>
  new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
)
const periodContext = computed(() => {
  if (!periodReport.value?.period_end) return ''
  const end = new Date(periodReport.value.period_end)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  if (today > end) return 'Period ended'
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  return `${diff} full days left in period`
})
const overallPercentUsed = computed(() => {
  if (!periodReport.value?.totalBudget || periodReport.value.totalBudget <= 0) return null
  return (periodReport.value.totalActual / periodReport.value.totalBudget) * 100
})

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.value }).format(val || 0)

const formatPeriodLabel = (periodStart, periodEnd) => {
  if (!periodStart || !periodEnd) return ''
  const start = new Date(periodStart)
  if (planPeriodType.value === 'month') return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  if (planPeriodType.value === 'year') return String(start.getFullYear())
  return `${periodStart} to ${periodEnd}`
}

const getPercentUsed = (row) => {
  if (!row.budget || row.budget <= 0) return 0
  return (row.actual / row.budget) * 100
}

const onTabChange = async () => {
  if (activeTab.value === 'full') await loadFullReport()
  else {
    await loadPeriods()
    if (periods.value.length) {
      selectedPeriodIndex.value = 0
      await loadPeriodReport()
    }
  }
}

const loadFullReport = async () => {
  if (!planId.value) return
  loading.value = true
  try {
    const res = await getBudgetFullReport(planId.value)
    fullReport.value = res?.data || null
    periodReport.value = null
    if (fullReport.value?.plan?.currency) currency.value = fullReport.value.plan.currency
  } catch (e) {
    showToast('Failed to load report')
  } finally {
    loading.value = false
  }
}

const loadPeriods = async () => {
  if (!planId.value) return
  try {
    const res = await getBudgetPeriods(planId.value)
    periods.value = res?.data || []
  } catch (e) {
    periods.value = []
  }
}

const loadPeriodReport = async () => {
  if (!planId.value || selectedPeriodIndex.value == null) return
  loading.value = true
  try {
    const res = await getBudgetPeriodReport(planId.value, selectedPeriodIndex.value)
    periodReport.value = res?.data || null
    fullReport.value = null
    if (periodReport.value?.currency) currency.value = periodReport.value.currency
  } catch (e) {
    showToast('Failed to load period report')
  } finally {
    loading.value = false
  }
}

const loadPlan = async () => {
  if (!planId.value) return
  try {
    const res = await getBudgetById(planId.value)
    const data = res?.data
    if (data) {
      planName.value = data.name
      planStart.value = data.start_date || ''
      planEnd.value = data.end_date || ''
      planPeriodType.value = data.period_type || 'month'
      currency.value = data.currency || 'USD'
    }
  } catch (e) {}
}

// Income Statement
const incomeLoading = ref(false)
const monthlyIncomeData = ref([])
const yearlyIncomeData = ref([])
const monthlyColumns = ref([])
const yearlyColumns = ref([])

const loadIncomeStatement = async () => {
  if (!planStart.value || !planEnd.value) return
  incomeLoading.value = true
  try {
    const res = await getReports({ type: 'monthly', start_date: planStart.value, end_date: planEnd.value })
    const rows = res?.data || []
    const byMonth = new Map()
    const byYear = new Map()
    for (const r of rows) {
      const y = r.year || new Date(planStart.value).getFullYear()
      const m = r.month || 1
      const key = `${y}-${String(m).padStart(2, '0')}`
      const inc = parseFloat(r.income || 0)
      const exp = parseFloat(r.expense || 0)
      byMonth.set(key, { key, month: m, year: y, income: inc, expense: exp })
      const yearKey = String(y)
      if (!byYear.has(yearKey)) byYear.set(yearKey, { key: yearKey, year: y, income: 0, expense: 0 })
      byYear.get(yearKey).income += inc
      byYear.get(yearKey).expense += exp
    }
    const monthKeys = Array.from(byMonth.keys()).sort()
    monthlyColumns.value = monthKeys.map((k) => ({
      key: k,
      label: new Date(byMonth.get(k).year, byMonth.get(k).month - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit'
      })
    }))
    const incomeRow = { label: 'Income' }
    const expenseRow = { label: 'Expenses' }
    const netRow = { label: 'Net' }
    for (const k of monthKeys) {
      const d = byMonth.get(k)
      incomeRow[k] = d.income
      expenseRow[k] = d.expense
      netRow[k] = d.income - d.expense
    }
    monthlyIncomeData.value = monthKeys.length ? [incomeRow, expenseRow, netRow] : []

    const yearKeys = Array.from(byYear.keys()).sort()
    yearlyColumns.value = yearKeys.map((k) => ({ key: k, label: k }))
    const yiRow = { label: 'Income' }
    const yeRow = { label: 'Expenses' }
    const ynRow = { label: 'Net' }
    for (const k of yearKeys) {
      const d = byYear.get(k)
      yiRow[k] = d.income
      yeRow[k] = d.expense
      ynRow[k] = d.income - d.expense
    }
    yearlyIncomeData.value = yearKeys.length ? [yiRow, yeRow, ynRow] : []
  } catch (e) {
  } finally {
    incomeLoading.value = false
  }
}

watch([planStart, planEnd], () => {
  if (planStart.value && planEnd.value) loadIncomeStatement()
})

onMounted(async () => {
  await loadPlan()
  if (activeTab.value === 'full') await loadFullReport()
  else {
    await loadPeriods()
    if (periods.value.length) await loadPeriodReport()
  }
  if (planStart.value && planEnd.value) loadIncomeStatement()
})
</script>

<style scoped>
.plan-period {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-bottom: 12px;
}
ion-segment {
  margin-bottom: 16px;
}
.report-section {
  margin-top: 16px;
}
.stat-card {
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  text-align: center;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.stat-value {
  font-size: 16px;
  font-weight: 600;
}
.success { color: var(--ion-color-success); }
.danger { color: var(--ion-color-danger); }
.period-label {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}
.period-stats {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-bottom: 12px;
}
.percent-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.percent-row ion-progress-bar {
  flex: 1;
  height: 8px;
}
.percent-text {
  font-size: 12px;
  min-width: 40px;
}
.period-context {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--ion-color-light-shade);
  font-size: 13px;
  color: var(--ion-color-medium);
}
.period-context p {
  margin: 4px 0;
}
.no-data {
  color: var(--ion-color-medium);
  font-size: 13px;
}
.col-head, .col-val {
  display: inline-block;
  min-width: 60px;
  margin-left: 4px;
  font-size: 12px;
}
.col-head {
  font-weight: 600;
}
.divertable-summary {
  margin-top: 16px;
  --background: var(--ion-color-light-tint);
}
.divertable-summary ion-card-title {
  font-size: 14px;
  color: var(--ion-color-primary);
}
.divertable-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--ion-text-color);
}
.divertable-row {
  font-size: 13px;
  margin-bottom: 8px;
}
.divertable-row:last-child {
  margin-bottom: 0;
}
.divertable-row strong {
  display: block;
  margin-bottom: 4px;
}
</style>
