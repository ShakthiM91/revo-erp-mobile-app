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
        <ion-title>Projects</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/work/projects/create')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <div class="filters">
        <ion-item>
          <ion-label>Status</ion-label>
          <ion-select v-model="filters.status" placeholder="All" interface="action-sheet" @ionChange="load">
            <ion-select-option value="">All</ion-select-option>
            <ion-select-option value="draft">Draft</ion-select-option>
            <ion-select-option value="pending_quotes">Pending Quotes</ion-select-option>
            <ion-select-option value="quotes_received">Quotes Received</ion-select-option>
            <ion-select-option value="vendor_selected">Vendor Selected</ion-select-option>
            <ion-select-option value="in_progress">In Progress</ion-select-option>
            <ion-select-option value="completed">Completed</ion-select-option>
            <ion-select-option value="cancelled">Cancelled</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label>Priority</ion-label>
          <ion-select v-model="filters.priority" placeholder="All" interface="action-sheet" @ionChange="load">
            <ion-select-option value="">All</ion-select-option>
            <ion-select-option value="low">Low</ion-select-option>
            <ion-select-option value="medium">Medium</ion-select-option>
            <ion-select-option value="high">High</ion-select-option>
            <ion-select-option value="urgent">Urgent</ion-select-option>
          </ion-select>
        </ion-item>
      </div>
      <ion-spinner v-if="loading" name="crescent" class="spinner" />
      <ion-list v-else-if="list.length" lines="inset">
        <ion-item-sliding v-for="row in list" :key="row.id">
          <ion-item button @click="$router.push(`/work/projects/${row.id}`)">
            <ion-label>
              <h2>{{ row.project_number || row.work_number }}</h2>
              <p>{{ row.title }}</p>
              <p>{{ row.vendor_name || '-' }} · {{ formatStatus(row.status) }}</p>
            </ion-label>
            <ion-note slot="end">{{ formatCurrency(row.total_amount) }}</ion-note>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option @click="$router.push(`/work/projects/${row.id}/edit`)">Edit</ion-item-option>
            <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else class="empty-state">
        <ion-note>No projects</ion-note>
      </div>
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
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonNote,
  IonSpinner,
  IonSelect,
  IonSelectOption
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getProjects, deleteProject } from '@/api/work'
import { getTenantDefaultCurrency } from '@/api/currency'

const list = ref([])
const loading = ref(false)
const defaultCurrency = ref({ code: 'USD' })
const filters = ref({ status: '', priority: '' })

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: defaultCurrency.value?.code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

function formatStatus(s) {
  if (!s) return ''
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function statusColor(s) {
  const map = { draft: 'medium', in_progress: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] || 'medium'
}

async function load() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.priority) params.priority = filters.value.priority
    const res = await getProjects(params)
    const data = res?.data ?? res ?? []
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    showToast('Failed to load')
    list.value = []
  } finally {
    loading.value = false
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

async function onDelete(row) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.title}"?` })
    await deleteProject(row.id)
    showToast('Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

onMounted(async () => {
  await loadDefaultCurrency()
  await load()
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.filters { --background: transparent; padding: 8px 0; }
.filters ion-item { --min-height: 44px; }
.filters ion-select { max-width: 100%; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
