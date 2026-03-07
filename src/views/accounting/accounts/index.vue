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
        <ion-title>Accounts</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/accounts/create">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list v-if="list.length" lines="inset">
        <ion-item-sliding v-for="row in list" :key="row.id">
          <ion-item button @click="goEdit(row)">
            <ion-label>
              <h2>{{ row.name }}</h2>
              <p>{{ formatType(row.type || row.account_type) + (row.currency ? ' · ' + row.currency : '') }}</p>
            </ion-label>
            <span v-if="row.current_balance != null || row.balance != null" slot="end">
              {{ formatCurrency(row.current_balance ?? row.balance ?? 0, row.currency) }}
            </span>
            <ion-badge v-else-if="row.is_active === false" color="medium" slot="end">Inactive</ion-badge>
          </ion-item>
          <ion-item-options side="start">
            <ion-item-option color="warning" @click="openReconcile(row)">Reconcile</ion-item-option>
            <ion-item-option color="tertiary" @click="goFlowLog(row)">Flow Log</ion-item-option>
          </ion-item-options>
          <ion-item-options side="end">
            <ion-item-option color="success" @click="goAddTransaction(row)">Add Transaction</ion-item-option>
            <ion-item-option @click="goEdit(row)">Edit</ion-item-option>
            <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else-if="!loading" class="empty-state">
        <ion-note>No accounts</ion-note>
      </div>

      <reconcile-modal
        :visible="reconcileVisible"
        :account="accountForReconcile"
        @close="reconcileVisible = false"
        @success="onReconcileSuccess"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onIonViewDidEnter } from '@ionic/vue'
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
  IonLabel,
  IonBadge,
  IonNote
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getAccounts, deleteAccount } from '@/api/accounting'
import { useSyncStore } from '@/store/sync'
import { refreshBootstrapCache } from '@/utils/bootstrapCache'
import ReconcileModal from './components/ReconcileModal.vue'

const router = useRouter()
const syncStore = useSyncStore()
const list = ref([])
const loading = ref(false)
const reconcileVisible = ref(false)
const accountForReconcile = ref(null)

function formatCurrency(v, code) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

function formatType(type) {
  const map = { bank: 'Bank', cash: 'Cash', credit_card: 'Credit Card', loan: 'Loan', savings: 'Savings', investment: 'Investment', other: 'Other' }
  return map[type] || type || ''
}

function goEdit(row) {
  router.push(`/accounts/${row.id}`)
}

function goAddTransaction(row) {
  router.push(`/transactions/create?account_id=${row.id}`)
}

function goFlowLog(row) {
  const name = encodeURIComponent(row.name || 'Account')
  const cur = encodeURIComponent(row.currency || 'USD')
  router.push(`/accounts/${row.id}/flow-log?name=${name}&currency=${cur}`)
}

function openReconcile(row) {
  accountForReconcile.value = { ...row }
  reconcileVisible.value = true
}

function onReconcileSuccess() {
  reconcileVisible.value = false
  accountForReconcile.value = null
  load()
}

async function onDelete(row) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.name}"?` })
    const res = await deleteAccount(row.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

async function load() {
  loading.value = true
  try {
    const res = await getAccounts()
    list.value = res?.data ?? res ?? []
    if (!Array.isArray(list.value)) list.value = []
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

onMounted(() => load())
onIonViewDidEnter(async () => {
  if (syncStore.invalidatedAccountIds?.size > 0) syncStore.clearAllInvalidated()
  await load()
  refreshBootstrapCache().catch(() => {})
})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
