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
        <ion-title>Budgets</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/budgets/create')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-item lines="none" class="filter-item">
          <ion-select
            :value="statusFilter"
            @ionChange="onStatusFilterChange($event)"
            label="Filter"
            label-placement="stacked"
            interface="action-sheet"
            placeholder="All statuses"
          >
            <ion-select-option value="">All</ion-select-option>
            <ion-select-option value="draft">Draft</ion-select-option>
            <ion-select-option value="active">Active</ion-select-option>
            <ion-select-option value="abandoned">Abandoned</ion-select-option>
            <ion-select-option value="completed">Completed</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list v-if="!loading && list.length > 0" lines="inset">
        <ion-item-sliding v-for="row in list" :key="row.id">
          <ion-item button @click="$router.push(`/budgets/${row.id}/report`)">
            <ion-label>
              <h2>{{ row.name }}</h2>
              <p>{{ formatDateRange(row.start_date, row.end_date) }} · {{ row.period_type }}</p>
            </ion-label>
            <ion-badge :color="statusColor(row.status)" slot="end">{{ row.status }}</ion-badge>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="primary" @click="goToReport(row)">Report</ion-item-option>
            <ion-item-option v-if="row.status === 'active' || row.status === 'draft'" color="primary" @click="goToEdit(row)">Edit</ion-item-option>
            <ion-item-option v-if="row.status === 'draft'" color="success" @click="onActivate(row)">Activate</ion-item-option>
            <ion-item-option v-if="row.status === 'active'" color="warning" @click="onAbandon(row)">Abandon</ion-item-option>
            <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-if="!loading && list.length === 0" class="empty-state">
        <ion-note>No budget plans</ion-note>
        <ion-button fill="outline" size="small" @click="$router.push('/budgets/create')">Create one</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonBadge,
  IonNote
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { formatDateRange } from '@/utils/dateUtils'
import { getBudgets, abandonBudget, activateBudget, deleteBudget } from '@/api/accounting'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const statusFilter = ref('')

function statusColor(s) {
  const t = { draft: 'medium', active: 'success', abandoned: 'warning', completed: 'medium' }
  return t[s] || 'medium'
}

function onStatusFilterChange(ev) {
  statusFilter.value = ev.detail.value || ''
  load()
}

async function load() {
  loading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const res = await getBudgets(params)
    list.value = res?.data || []
  } catch (e) {
    showToast('Failed to load budgets')
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

function goToReport(row) {
  router.push(`/budgets/${row.id}/report`)
}

function goToEdit(row) {
  router.push(`/budgets/${row.id}`)
}

async function onActivate(row) {
  try {
    await showConfirmDialog({
      title: 'Activate Budget Plan',
      message: `Activate "${row.name}"? This will make it the active budget plan and start tracking expenses.`,
      confirmText: 'Activate',
      cancelText: 'Cancel'
    })
    await activateBudget(row.id)
    showToast('Budget plan activated')
    await load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.response?.data?.error || 'Failed to activate')
  }
}

async function onAbandon(row) {
  try {
    await showConfirmDialog({
      title: 'Abandon Budget Plan',
      message: 'Are you sure you want to abandon this budget plan? You can create a new plan anytime.',
      confirmText: 'Abandon',
      cancelText: 'Cancel'
    })
    await abandonBudget(row.id)
    showToast('Budget plan abandoned')
    await load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.response?.data?.error || 'Failed to abandon')
  }
}

async function onDelete(row) {
  try {
    await showConfirmDialog({
      title: 'Delete Budget Plan',
      message: `Delete "${row.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
    await deleteBudget(row.id)
    showToast('Budget plan deleted')
    await load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.response?.data?.error || 'Failed to delete')
  }
}

onMounted(load)
</script>

<style scoped>
.filter-item {
  --background: transparent;
  --padding-start: 0;
  --inner-padding-end: 0;
}
.filter-item ion-select {
  max-width: 100%;
  width: 100%;
}
.empty-state {
  padding: 40px 20px;
  text-align: center;
}
.empty-state ion-note {
  display: block;
  margin-bottom: 16px;
}
</style>
