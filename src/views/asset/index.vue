<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Assets</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/assets/create')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="summary-grid">
        <ion-grid>
          <ion-row>
            <ion-col size="4"><div class="sum-cell"><span class="sum-label">Total</span><span class="sum-val">{{ stats.total }}</span></div></ion-col>
            <ion-col size="4"><div class="sum-cell"><span class="sum-label">Available</span><span class="sum-val">{{ stats.available }}</span></div></ion-col>
            <ion-col size="4"><div class="sum-cell"><span class="sum-label">Assigned</span><span class="sum-val">{{ stats.assigned }}</span></div></ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <template v-if="loading && list.length === 0">
        <div v-for="i in 5" :key="'sk-' + i" class="list-skeleton">
          <ion-skeleton-text animated style="width: 60%; height: 16px" />
          <ion-skeleton-text animated style="width: 40%; height: 12px; margin-top: 8px" />
        </div>
      </template>
      <template v-else>
        <ion-list lines="inset">
          <ion-item-sliding v-for="row in list" :key="row.id">
            <ion-item button @click="$router.push(`/assets/${row.id}`)">
              <ion-label>
                <h2>{{ row.name }}</h2>
                <p>{{ (row.asset_number || '') + ' · ' + (row.category || '-') }}</p>
              </ion-label>
              <span slot="end">{{ formatCurrency(row.current_value) }}</span>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="primary" @click="$router.push(`/assets/${row.id}`)">Edit</ion-item-option>
              <ion-item-option v-if="row.status === 'available'" color="success" @click="$router.push(`/assets/${row.id}/assign`)">Assign</ion-item-option>
              <ion-item-option @click="$router.push(`/assets/${row.id}/history`)">History</ion-item-option>
              <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
        <ion-infinite-scroll v-if="!finished && list.length > 0" @ionInfinite="onLoad" threshold="100px">
          <ion-infinite-scroll-content loading-spinner="crescent" />
        </ion-infinite-scroll>
      </template>
      <div v-if="!loading && list.length === 0" class="empty-state">
        <ion-note>No assets</ion-note>
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
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getAssets, deleteAsset } from '@/api/asset'

const list = ref([])
const listQuery = ref({ limit: 30, offset: 0 })
const stats = ref({ total: 0, available: 0, assigned: 0 })
const loading = ref(false)
const finished = ref(false)

function formatCurrency (v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v || 0)
}

async function load () {
  loading.value = true
  try {
    const res = await getAssets(listQuery.value)
    const data = res?.data || []
    if (listQuery.value.offset === 0) list.value = data
    else list.value.push(...data)
    listQuery.value.offset += data.length
    finished.value = data.length < (listQuery.value.limit || 30)
    stats.value.total = list.value.length
    stats.value.available = list.value.filter(i => i.status === 'available').length
    stats.value.assigned = list.value.filter(i => i.status === 'assigned').length
  } catch (e) {
    showToast('Failed to load')
    finished.value = true
  } finally {
    loading.value = false
  }
}

async function onRefresh (ev) {
  listQuery.value.offset = 0
  finished.value = false
  await load()
  ev.target.complete()
}

async function onLoad (ev) {
  await load()
  ev.target.complete()
}

async function onDelete (row) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.name}"?` })
    const res = await deleteAsset(row.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Deleted')
    listQuery.value.offset = 0
    finished.value = false
    await load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

onMounted(() => {})
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.summary-grid { background: #f7f8fa; padding: 12px 8px; }
.sum-cell { display: flex; flex-direction: column; align-items: center; }
.sum-label { font-size: 11px; color: #969799; }
.sum-val { font-size: 13px; font-weight: 600; }
.list-skeleton { padding: 12px 16px; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
