<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>Accounts</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list v-if="list.length" lines="inset">
        <ion-item v-for="row in list" :key="row.id" button @click="goAccount(row)">
          <ion-label>
            <h2>{{ row.name }}</h2>
            <p>{{ (row.account_type || row.type || '') + (row.currency ? ' · ' + row.currency : '') }}</p>
          </ion-label>
          <span v-if="row.balance != null" slot="end">{{ formatCurrency(row.balance, row.currency) }}</span>
          <ion-badge v-else-if="row.is_active === false" color="medium" slot="end">Inactive</ion-badge>
        </ion-item>
      </ion-list>
      <div v-else-if="!loading" class="empty-state">
        <ion-note>No accounts</ion-note>
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
  IonBackButton,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getAccounts } from '@/api/accounting'

const router = useRouter()
const list = ref([])
const loading = ref(false)

function formatCurrency (v, code) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code || 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

function goAccount () {
  showToast('Account details in web admin')
}

async function load () {
  loading.value = true
  try {
    const res = await getAccounts()
    list.value = res?.data || []
  } catch (e) {
    showToast('Failed to load')
    list.value = []
  } finally {
    loading.value = false
  }
}

async function onRefresh (ev) {
  await load()
  ev.target.complete()
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
