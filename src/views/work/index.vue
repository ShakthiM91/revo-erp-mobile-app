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
        <ion-title>Work</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list lines="none" class="work-links">
        <ion-item button detail @click="$router.push('/work/projects')">
          <ion-icon :icon="folderOutline" slot="start" />
          <ion-label>
            <h2>Projects</h2>
            <p>Manage work orders and projects</p>
          </ion-label>
        </ion-item>
        <ion-item button detail @click="$router.push('/work/vendors')">
          <ion-icon :icon="peopleOutline" slot="start" />
          <ion-label>
            <h2>Vendors</h2>
            <p>Vendor list and contacts</p>
          </ion-label>
        </ion-item>
        <ion-item button detail @click="$router.push('/work/categories')">
          <ion-icon :icon="pricetagOutline" slot="start" />
          <ion-label>
            <h2>Vendor Categories</h2>
            <p>Manage vendor categories</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-card v-if="Object.keys(stats).length" class="stats-card">
        <ion-card-header>
          <ion-card-title>Summary</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="stat-row">
            <span class="stat-label">Total Projects</span>
            <span class="stat-value">{{ stats.total_work_orders || 0 }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Active</span>
            <span class="stat-value">{{ stats.active_works || 0 }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Pending Approvals</span>
            <span class="stat-value">{{ stats.pending_approvals || 0 }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Total Value</span>
            <span class="stat-value">{{ formatCurrency(stats.total_value) }}</span>
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
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonIcon,
  IonNote,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/vue'
import { folderOutline, peopleOutline, pricetagOutline, menuOutline } from 'ionicons/icons'
import { getDashboardStats, getProjects } from '@/api/work'
import { getTenantDefaultCurrency } from '@/api/currency'

const stats = ref({})
const recentProjects = ref([])
const defaultCurrency = ref({ code: 'USD' })

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: defaultCurrency.value?.code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

function formatStatus(s) {
  if (!s) return ''
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function load() {
  try {
    const [statsRes, projectsRes] = await Promise.all([
      getDashboardStats(),
      getProjects({ limit: 10 })
    ])
    const statsData = statsRes?.data ?? statsRes
    stats.value = statsData?.totals ?? statsData ?? {}
    const list = projectsRes?.data ?? projectsRes ?? []
    recentProjects.value = Array.isArray(list) ? list : []
  } catch (_) {
    stats.value = {}
    recentProjects.value = []
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

async function loadDefaultCurrency() {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
}

onMounted(async () => {
  await loadDefaultCurrency()
  await load()
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.work-links { padding-top: 8px; }
.stats-card { margin: 16px; }
.stat-row { display: flex; justify-content: space-between; padding: 8px 0; }
.stat-label { color: var(--ion-color-medium); }
</style>
