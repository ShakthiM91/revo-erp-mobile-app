<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/work" />
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
  IonBackButton,
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
  IonBadge,
  IonNote,
  IonSpinner
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getProjects, deleteProject } from '@/api/work'
import { getTenantDefaultCurrency } from '@/api/currency'

const list = ref([])
const loading = ref(false)
const defaultCurrency = ref({ code: 'USD' })

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
    const res = await getProjects()
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
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
