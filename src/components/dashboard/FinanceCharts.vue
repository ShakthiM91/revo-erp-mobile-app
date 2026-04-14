<template>
  <div class="finance-charts">
    <ion-card v-if="showDailyBar && dailyLabels.length" class="chart-card">
      <ion-card-header>
        <ion-card-title>Recent activity</ion-card-title>
        <ion-card-subtitle>Income vs expense · last 14 days</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <div class="chart-wrap bar-wrap">
          <Bar :data="barData" :options="barOptions" />
        </div>
      </ion-card-content>
    </ion-card>

    <ion-card v-if="showMixChart" class="chart-card">
      <ion-card-header>
        <ion-card-title>All-time mix</ion-card-title>
        <ion-card-subtitle>Income vs expense (totals)</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <div class="chart-wrap doughnut-wrap">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </div>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const props = defineProps({
  currencyCode: { type: String, default: 'USD' },
  summaryIncome: { type: Number, default: 0 },
  summaryExpense: { type: Number, default: 0 },
  dailyLabels: { type: Array, default: () => [] },
  dailyIncome: { type: Array, default: () => [] },
  dailyExpense: { type: Array, default: () => [] },
  showDailyBar: { type: Boolean, default: false }
})

const INCOME_COLOR = '#2dd36f'
const EXPENSE_COLOR = '#eb445a'

function formatTick (value) {
  const n = Number(value)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toFixed(0)
}

const barData = computed(() => ({
  labels: props.dailyLabels,
  datasets: [
    {
      label: 'Income',
      data: props.dailyIncome,
      backgroundColor: INCOME_COLOR,
      borderRadius: 4,
      maxBarThickness: 10
    },
    {
      label: 'Expense',
      data: props.dailyExpense,
      backgroundColor: EXPENSE_COLOR,
      borderRadius: 4,
      maxBarThickness: 10
    }
  ]
}))

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 10, font: { size: 11 } }
    },
    tooltip: {
      callbacks: {
        label (ctx) {
          const num = typeof ctx.parsed?.y === 'number' ? ctx.parsed.y : 0
          return `${ctx.dataset.label}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: props.currencyCode, maximumFractionDigits: 0 }).format(num)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 45, minRotation: 0, font: { size: 9 } }
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: {
        font: { size: 10 },
        callback: (value) => formatTick(value)
      }
    }
  }
}))

const showMixChart = computed(() => {
  const inc = Number(props.summaryIncome) || 0
  const exp = Number(props.summaryExpense) || 0
  return inc > 0 || exp > 0
})

const doughnutData = computed(() => ({
  labels: ['Income', 'Expense'],
  datasets: [
    {
      data: [Math.max(0, props.summaryIncome || 0), Math.max(0, props.summaryExpense || 0)],
      backgroundColor: [INCOME_COLOR, EXPENSE_COLOR],
      borderWidth: 0
    }
  ]
}))

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '58%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 12, font: { size: 11 } }
    },
    tooltip: {
      callbacks: {
        label (ctx) {
          const raw = ctx.raw ?? 0
          return `${ctx.label}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: props.currencyCode }).format(raw)}`
        }
      }
    }
  }
}))
</script>

<style scoped>
.finance-charts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chart-card {
  margin: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.chart-wrap {
  position: relative;
  width: 100%;
}
.bar-wrap {
  height: 240px;
}
.doughnut-wrap {
  height: 220px;
  max-width: 280px;
  margin: 0 auto;
}
</style>
