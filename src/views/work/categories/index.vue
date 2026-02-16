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
        <ion-title>Vendor Categories</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/work/categories/create')">
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
          <ion-item button @click="$router.push(`/work/categories/${row.id}`)">
            <ion-label>
              <h2>{{ row.name }}</h2>
              <p>{{ row.description || '-' }}</p>
            </ion-label>
            <ion-badge color="medium" slot="end">{{ row.vendor_count || 0 }} vendors</ion-badge>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option @click="$router.push(`/work/categories/${row.id}`)">Edit</ion-item-option>
            <ion-item-option color="danger" :disabled="(row.vendor_count || 0) > 0" @click="onDelete(row)">Delete</ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else class="empty-state">
        <ion-note>No categories</ion-note>
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
  IonSpinner
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getVendorCategories, deleteVendorCategory } from '@/api/work'

const list = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getVendorCategories()
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
  if ((row.vendor_count || 0) > 0) {
    showToast('Category has vendors')
    return
  }
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${row.name}"?` })
    const res = await deleteVendorCategory(row.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Deleted')
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
