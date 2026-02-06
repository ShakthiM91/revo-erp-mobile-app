<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/work" />
        </ion-buttons>
        <ion-title>Vendors</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/work/vendors/create')">
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
          <ion-item button @click="$router.push(`/work/vendors/${row.id}`)">
            <ion-label>
              <h2>{{ row.name }}</h2>
              <p>{{ getCategoryName(row.category_id) }}</p>
              <p>{{ row.contact_person || '-' }} · {{ row.email || '-' }}</p>
            </ion-label>
            <ion-badge v-if="!row.is_active" color="medium" slot="end">Inactive</ion-badge>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option @click="$router.push(`/work/vendors/${row.id}`)">Edit</ion-item-option>
            <ion-item-option color="danger" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else class="empty-state">
        <ion-note>No vendors</ion-note>
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
import { getVendors, deleteVendor, getVendorCategories } from '@/api/work'

const list = ref([])
const categories = ref([])
const loading = ref(false)

function getCategoryName(categoryId) {
  const c = categories.value.find(x => x.id === categoryId)
  return c?.name || 'N/A'
}

async function loadCategories() {
  try {
    const res = await getVendorCategories({ is_active: true })
    const data = res?.data ?? res ?? []
    categories.value = Array.isArray(data) ? data : []
  } catch (_) {
    categories.value = []
  }
}

async function load() {
  loading.value = true
  try {
    await loadCategories()
    const res = await getVendors()
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

async function onDelete(row) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.name}"?` })
    await deleteVendor(row.id)
    showToast('Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed')
  }
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
