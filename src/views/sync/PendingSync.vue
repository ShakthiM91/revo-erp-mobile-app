<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard" />
        </ion-buttons>
        <ion-title>Pending Sync</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="syncing" @click="handleSyncNow">
            <ion-spinner v-if="syncing" name="crescent" />
            <span v-else>Sync now</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>
      <ion-list v-if="entries.length" lines="inset">
        <ion-item v-for="entry in entries" :key="entry.id">
          <ion-label>
            <h2>{{ labelFor(entry) }}</h2>
            <p>{{ entry.method }} {{ entry.url }}</p>
            <p v-if="entry.last_error" class="error-note">{{ entry.last_error }}</p>
            <p class="meta">{{ formatDate(entry.created_at) }} · {{ entry.status }}</p>
          </ion-label>
          <ion-badge :color="entry.status === 'failed' ? 'danger' : 'warning'" slot="end">
            {{ entry.status }}
          </ion-badge>
        </ion-item>
      </ion-list>
      <div v-else-if="!loading" class="empty-state">
        <ion-note>No pending items. All changes are synced.</ion-note>
      </div>
      <ion-spinner v-else name="crescent" class="spinner" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onIonViewDidEnter } from '@ionic/vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonNote
} from '@ionic/vue'
import { getPendingWrites } from '@/db/pendingWrites'
import { useSyncStore } from '@/store/sync'

const syncStore = useSyncStore()
const entries = ref([])
const loading = ref(false)
const syncing = ref(false)

function formatDate(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}

function labelFor(entry) {
  const u = entry.url || ''
  if (u.includes('/transactions')) return 'Transaction'
  if (u.includes('/accounts')) return 'Account'
  if (u.includes('/projects')) return 'Project'
  if (u.includes('/vendors')) return 'Vendor'
  if (u.includes('/members')) return 'Member'
  if (u.includes('/roles')) return 'Role'
  if (u.includes('/assets')) return 'Asset'
  if (u.includes('/events')) return 'Event'
  if (u.includes('/categories')) return 'Category'
  return entry.method + ' ' + u.split('/').filter(Boolean).pop()
}

async function load() {
  loading.value = true
  try {
    entries.value = await getPendingWrites()
  } finally {
    loading.value = false
  }
}

async function handleSyncNow() {
  syncing.value = true
  try {
    await syncStore.syncNow()
    await load()
  } finally {
    syncing.value = false
  }
}

async function onRefresh(ev) {
  await syncStore.refreshPendingCount()
  await load()
  ev.target.complete()
}

onMounted(() => load())
onIonViewDidEnter(() => load())
</script>

<style scoped>
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
.error-note { color: var(--ion-color-danger); font-size: 12px; }
.meta { font-size: 12px; color: var(--ion-color-medium); }
</style>
