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
        <ion-title>Work Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <template v-else>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total_work_orders || 0 }}</div>
            <div class="stat-label">Total Projects</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.active_works || 0 }}</div>
            <div class="stat-label">Active Works</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.pending_approvals || 0 }}</div>
            <div class="stat-label">Pending Approvals</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatCurrency(stats.total_value || 0) }}</div>
            <div class="stat-label">Total Value</div>
          </div>
        </div>

        <ion-card v-if="statusBreakdown.length" class="section-card">
          <ion-card-header>
            <ion-card-title>Projects by Status</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-for="item in statusBreakdown" :key="item.status" class="status-row">
              <ion-badge :color="getStatusColor(item.status)">{{ formatStatus(item.status) }}</ion-badge>
              <span class="status-count">{{ item.count }} orders</span>
              <span class="status-amount">{{ formatCurrency(item.total_amount || 0) }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title>Payments Due</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="payment-row">
              <span class="payment-label">Pending Payments</span>
              <span class="payment-value">{{ paymentsDue.count || 0 }} payments</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Total Amount Due</span>
              <span class="payment-value">{{ formatCurrency(paymentsDue.amount || 0) }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-list v-if="recentProjects.length" lines="inset">
          <ion-item-divider>Recent Projects</ion-item-divider>
          <ion-item v-for="p in recentProjects" :key="p.id" button @click="$router.push(`/work/projects/${p.id}`)">
            <ion-label>
              <h2>{{ p.project_number || p.work_number }}</h2>
              <p>{{ p.title }} · {{ formatStatus(p.status) }}</p>
            </ion-label>
            <ion-note slot="end">{{ formatCurrency(p.total_amount) }}</ion-note>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuToggle,
  IonTitle,
  IonButton,
  IonIcon,
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
  IonBadge
} from '@ionic/vue'
import { menuOutline } from 'ionicons/icons'
import { getDashboardStats, getProjects } from '@/api/work'
import { getTenantDefaultCurrency } from '@/api/currency'

const loading = ref(false)
const stats = ref({})
const statusBreakdown = ref([])
const paymentsDue = ref({})
const recentProjects = ref([])
const defaultCurrency = ref({ code: 'USD' })

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: defaultCurrency.value?.code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

function formatStatus(s) {
  if (!s) return ''
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getStatusColor(s) {
  const map = { draft: 'medium', pending_quotes: 'warning', quotes_received: 'warning', vendor_selected: 'primary', in_progress: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] || 'medium'
}

async function loadDefaultCurrency() {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
}

async function load() {
  loading.value = true
  try {
    const [statsRes, projectsRes] = await Promise.all([getDashboardStats(), getProjects({ limit: 10 })])
    const data = statsRes?.data ?? statsRes
    stats.value = data?.totals ?? data ?? {}
    statusBreakdown.value = data?.status_breakdown ?? []
    paymentsDue.value = data?.payments_due ?? {}
    const list = projectsRes?.data ?? projectsRes ?? []
    recentProjects.value = Array.isArray(list) ? list : []
  } catch (_) {
    stats.value = {}
    statusBreakdown.value = []
    paymentsDue.value = {}
    recentProjects.value = []
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await loadDefaultCurrency()
  await load()
  ev.target.complete()
}

onMounted(async () => {
  await loadDefaultCurrency()
  await load()
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; }
.stat-card { background: var(--ion-card-background); border-radius: 8px; padding: 16px; }
.stat-value { font-size: 20px; font-weight: 700; }
.stat-label { font-size: 12px; color: var(--ion-color-medium); }
.section-card { margin: 0 16px 16px; }
.status-row, .payment-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--ion-color-light); }
.status-row:last-child, .payment-row:last-child { border-bottom: none; }
.status-count { font-size: 13px; color: var(--ion-color-medium); }
.status-amount { font-weight: 600; }
.payment-label { font-size: 14px; color: var(--ion-color-medium); }
.payment-value { font-weight: 600; }
</style>
