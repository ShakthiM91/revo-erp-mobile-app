<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/transactions" />
        </ion-buttons>
        <ion-title>Reports</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" @click="fetchReports">Refresh</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="reportType" @ionChange="fetchReports">
          <ion-segment-button value="income-expense">Income vs Expense</ion-segment-button>
          <ion-segment-button value="assets" disabled>Assets</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar v-if="reportType === 'income-expense'">
        <ion-buttons slot="start">
          <ion-button @click="showYearPicker = true">{{ reportYear }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <template v-else-if="reportType === 'income-expense'">
        <div v-if="reportData.length" class="report-content">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Summary {{ reportYear }}</ion-card-title>
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
          <ion-list lines="inset">
            <ion-item-divider>By Month</ion-item-divider>
            <ion-item v-for="row in reportData" :key="row.month">
              <ion-label>
                <h2>{{ monthName(row.month) }}</h2>
                <p>Income: {{ formatCurrency(row.income) }} · Expense: {{ formatCurrency(row.expense) }}</p>
              </ion-label>
              <ion-note slot="end">{{ formatCurrency((row.income || 0) - (row.expense || 0)) }}</ion-note>
            </ion-item>
          </ion-list>
        </div>
        <div v-else class="empty-state">
          <ion-note>No data for {{ reportYear }}</ion-note>
        </div>
      </template>
      <div v-else class="empty-state">
        <ion-note>Assets summary coming soon</ion-note>
      </div>

      <ion-modal :is-open="showYearPicker" @didDismiss="showYearPicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Select Year</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showYearPicker = false">Done</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="y in yearOptions" :key="y" button @click="reportYear = y; showYearPicker = false">
              <ion-label>{{ y }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
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
  IonItem,
  IonItemDivider,
  IonLabel,
  IonNote,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getReports } from '@/api/accounting'

const reportType = ref('income-expense')
const reportYear = ref(new Date().getFullYear().toString())
const reportData = ref([])
const loading = ref(false)
const showYearPicker = ref(false)

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => (y - i).toString())
})

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function monthName(m) {
  return monthNames[(m || 1) - 1] || `Month ${m}`
}

const totalIncome = computed(() =>
  reportData.value.reduce((s, r) => s + (r.income || 0), 0)
)
const totalExpense = computed(() =>
  reportData.value.reduce((s, r) => s + (r.expense || 0), 0)
)
const net = computed(() => totalIncome.value - totalExpense.value)

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

async function fetchReports() {
  if (reportType.value !== 'income-expense') return
  loading.value = true
  try {
    const res = await getReports({ type: 'monthly', year: reportYear.value })
    const data = res?.data ?? (res?.success ? res?.data : []) ?? []
    reportData.value = Array.isArray(data) ? data : []
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

onMounted(() => fetchReports())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
.report-content { padding: 0 16px 16px; }
.summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
.summary-row.total { border-top: 1px solid var(--ion-color-light); margin-top: 8px; font-weight: 600; }
.summary-row .label { color: var(--ion-color-medium); }
.summary-row .value.income { color: var(--ion-color-success); }
.summary-row .value.expense { color: var(--ion-color-danger); }
</style>
