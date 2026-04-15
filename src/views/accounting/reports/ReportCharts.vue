<template>
  <div class="report-charts">
    <div v-if="reportType === 'monthly'" class="chart-wrap bar-wrap">
      <Bar :data="monthlyBarData" :options="monthlyBarOptions" />
    </div>
    <div v-else-if="reportType === 'daily'" class="chart-wrap bar-wrap">
      <Bar :data="dailyBarData" :options="dailyBarOptions" />
    </div>
    <div v-else-if="reportType === 'balance_growth'" class="chart-wrap line-wrap">
      <Line :data="balanceLineData" :options="balanceLineOptions" />
    </div>
    <div
      v-else-if="reportType === 'category_income' || reportType === 'category_expense'"
      class="chart-wrap category-wrap"
      :style="{ height: categoryChartHeightPx }"
    >
      <Bar :data="categoryBarData" :options="categoryBarOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController
)

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const INCOME_COLOR = '#2dd36f'
const EXPENSE_COLOR = '#eb445a'
const BALANCE_COLOR = '#3880ff'
const CATEGORY_INCOME = '#2dd36f'
const CATEGORY_EXPENSE = '#eb445a'

const props = defineProps({
  reportType: { type: String, required: true },
  reportData: { type: Array, default: () => [] },
  currencyCode: { type: String, default: 'USD' }
})

function formatTick (value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toFixed(0)
}

function formatMoney (num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currencyCode,
    maximumFractionDigits: 0
  }).format(Number(num) || 0)
}

function monthLabel (row) {
  const m = Number(row.month) || 1
  const label = MONTH_NAMES[m - 1] || `M${m}`
  const y = row.year
  return y != null && y !== '' ? `${label} ${y}` : label
}

function shortDate (d) {
  if (!d) return ''
  const s = String(d)
  const day = s.includes('T') ? s.slice(0, 10) : s.slice(0, 10)
  if (day.length >= 10) return `${day.slice(5, 7)}/${day.slice(8, 10)}`
  return day
}

const monthlyBarData = computed(() => ({
  labels: props.reportData.map(monthLabel),
  datasets: [
    {
      label: 'Income',
      data: props.reportData.map((r) => Number(r.income) || 0),
      backgroundColor: INCOME_COLOR,
      borderRadius: 4,
      maxBarThickness: 14
    },
    {
      label: 'Expense',
      data: props.reportData.map((r) => Number(r.expense) || 0),
      backgroundColor: EXPENSE_COLOR,
      borderRadius: 4,
      maxBarThickness: 14
    }
  ]
}))

const dailyBarData = computed(() => ({
  labels: props.reportData.map((r) => shortDate(r.date)),
  datasets: [
    {
      label: 'Income',
      data: props.reportData.map((r) => Number(r.income) || 0),
      backgroundColor: INCOME_COLOR,
      borderRadius: 3,
      maxBarThickness: 8
    },
    {
      label: 'Expense',
      data: props.reportData.map((r) => Number(r.expense) || 0),
      backgroundColor: EXPENSE_COLOR,
      borderRadius: 3,
      maxBarThickness: 8
    }
  ]
}))

const balanceLineData = computed(() => ({
  labels: props.reportData.map((r) => shortDate(r.date)),
  datasets: [
    {
      label: 'Balance',
      data: props.reportData.map((r) => Number(r.balance) || 0),
      borderColor: BALANCE_COLOR,
      backgroundColor: 'rgba(56, 128, 255, 0.12)',
      fill: true,
      tension: 0.25,
      pointRadius: 2,
      pointHoverRadius: 4
    }
  ]
}))

const categoryBarData = computed(() => {
  const rows = [...props.reportData].reverse()
  const color = props.reportType === 'category_income' ? CATEGORY_INCOME : CATEGORY_EXPENSE
  return {
    labels: rows.map((r) => {
      const name = r.category_name || 'Uncategorized'
      return name.length > 28 ? `${name.slice(0, 26)}…` : name
    }),
    datasets: [
      {
        label: props.reportType === 'category_income' ? 'Income' : 'Expense',
        data: rows.map((r) => Number(r.amount) || 0),
        backgroundColor: color,
        borderRadius: 4,
        maxBarThickness: 18
      }
    ]
  }
})

const categoryChartHeightPx = computed(() => {
  const n = props.reportData.length || 0
  return `${Math.min(560, Math.max(200, 24 + n * 36))}px`
})

const baseLegend = {
  position: 'bottom',
  labels: { boxWidth: 10, font: { size: 11 }, padding: 12 }
}

const monthlyBarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: baseLegend,
    tooltip: {
      callbacks: {
        label (ctx) {
          const num = typeof ctx.parsed?.y === 'number' ? ctx.parsed.y : 0
          return `${ctx.dataset.label}: ${formatMoney(num)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 45, minRotation: 0, font: { size: 10 } }
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

const dailyBarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: baseLegend,
    tooltip: {
      callbacks: {
        title (items) {
          const i = items[0]?.dataIndex
          if (i == null) return ''
          const raw = props.reportData[i]?.date
          return raw ? String(raw).slice(0, 10) : items[0].label
        },
        label (ctx) {
          const num = typeof ctx.parsed?.y === 'number' ? ctx.parsed.y : 0
          return `${ctx.dataset.label}: ${formatMoney(num)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        maxRotation: 60,
        minRotation: 0,
        font: { size: 9 },
        autoSkip: true,
        maxTicksLimit: 12
      }
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

const balanceLineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: baseLegend,
    tooltip: {
      callbacks: {
        title (items) {
          const i = items[0]?.dataIndex
          if (i == null) return ''
          const raw = props.reportData[i]?.date
          return raw ? String(raw).slice(0, 10) : items[0].label
        },
        label (ctx) {
          const num = typeof ctx.parsed?.y === 'number' ? ctx.parsed.y : 0
          return `${formatMoney(num)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        maxRotation: 60,
        font: { size: 9 },
        autoSkip: true,
        maxTicksLimit: 10
      }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: {
        font: { size: 10 },
        callback: (value) => formatTick(value)
      }
    }
  }
}))

const categoryBarOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title (items) {
          const i = items[0]?.dataIndex
          if (i == null) return ''
          const rows = [...props.reportData].reverse()
          return rows[i]?.category_name || 'Uncategorized'
        },
        label (ctx) {
          const num = typeof ctx.parsed?.x === 'number' ? ctx.parsed.x : 0
          return formatMoney(num)
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: {
        font: { size: 10 },
        callback: (value) => formatTick(value)
      }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}))
</script>

<style scoped>
.report-charts {
  width: 100%;
}
.chart-wrap {
  position: relative;
  width: 100%;
}
.bar-wrap,
.line-wrap {
  height: 260px;
}
.category-wrap {
  min-height: 200px;
}
</style>
