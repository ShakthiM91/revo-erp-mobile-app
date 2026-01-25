<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button />
        </ion-buttons>
        <ion-title>Events</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/schedule/events/create')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
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
            <ion-item button @click="$router.push(`/schedule/events/${row.id}`)">
              <ion-label>
                <h2>{{ row.title }}</h2>
                <p>{{ formatDate(row.start_time) }} · {{ row.type || '' }}</p>
              </ion-label>
              <ion-badge :color="statusColor(row.status)" slot="end">{{ row.status }}</ion-badge>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="primary" @click="$router.push(`/schedule/events/${row.id}`)">Edit</ion-item-option>
              <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
        <ion-infinite-scroll v-if="!finished && list.length > 0" @ionInfinite="onLoad" threshold="100px">
          <ion-infinite-scroll-content loading-spinner="crescent" />
        </ion-infinite-scroll>
      </template>
      <div v-if="!loading && list.length === 0" class="empty-state">
        <ion-note>No events</ion-note>
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
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getEvents, deleteEvent } from '@/api/schedule'

const list = ref([])
const listQuery = ref({ limit: 30, offset: 0 })
const loading = ref(false)
const finished = ref(false)

function formatDate (s) {
  if (!s) return '-'
  return new Date(s).toLocaleString()
}
function statusColor (s) {
  const t = { scheduled: 'success', completed: 'primary', cancelled: 'danger' }
  return t[s] || 'medium'
}

async function load () {
  loading.value = true
  try {
    const res = await getEvents(listQuery.value)
    const data = res?.data || []
    if (listQuery.value.offset === 0) list.value = data
    else list.value.push(...data)
    listQuery.value.offset += data.length
    finished.value = data.length < (listQuery.value.limit || 30)
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
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.title}"?` })
    await deleteEvent(row.id)
    showToast('Deleted')
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
.list-skeleton { padding: 12px 16px; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
