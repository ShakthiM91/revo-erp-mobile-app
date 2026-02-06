<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/transactions" />
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
          <ion-item-options side="end">
            <ion-item-option @click="goEdit(row)">Edit</ion-item-option>
            <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else-if="!loading" class="empty-state">
        <ion-note>No accounts</ion-note>
      </div>
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
  IonNote
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getAccounts, deleteAccount } from '@/api/accounting'

const router = useRouter()
const list = ref([])
const loading = ref(false)

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

async function onDelete(row) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.name}"?` })
    await deleteAccount(row.id)
    showToast('Deleted')
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
onIonViewDidEnter(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
