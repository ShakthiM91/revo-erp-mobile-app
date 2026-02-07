<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>History: {{ assetName || 'Asset' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list v-if="history.length" lines="inset">
        <ion-item v-for="row in history" :key="row.assigned_date + (row.assigned_to || '')">
          <ion-label>
            <h2>{{ getMemberName(row.assigned_to) }}</h2>
            <p>{{ formatDate(row.assigned_date) }}{{ row.notes ? ' · ' + row.notes : '' }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
      <div v-else-if="!loading" class="empty-state">
        <ion-note>No history</ion-note>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
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
  IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getAssetHistory, getAssetById } from '@/api/asset'
import { getMemberById } from '@/api/member'

const route = useRoute()
const id = route.params.id
const assetName = ref('')
const history = ref([])
const memberNames = ref({})
const loading = ref(false)

function formatDate (s) {
  if (!s) return '-'
  return new Date(s).toLocaleString()
}

function getMemberName (memberId) {
  if (!memberId) return '-'
  return memberNames.value[memberId] || `Member #${memberId}`
}

async function load () {
  loading.value = true
  try {
    const [r, a] = await Promise.all([getAssetHistory(id), getAssetById(id).catch(() => null)])
    history.value = r?.data || r || []
    const an = a?.data || a
    if (an?.name) assetName.value = an.name
    const ids = [...new Set(history.value.map(h => h.assigned_to).filter(Boolean))]
    for (const mid of ids) {
      if (!memberNames.value[mid]) {
        try {
          const m = await getMemberById(mid)
          if (m?.data?.name) memberNames.value[mid] = m.data.name
        } catch (_) {}
      }
    }
  } catch (e) {
    showToast('Failed to load')
    history.value = []
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
