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
      <div class="filters">
        <ion-item>
          <ion-label>Category</ion-label>
          <ion-select v-model="filters.category_id" placeholder="All" interface="action-sheet" @ionChange="load">
            <ion-select-option value="">All</ion-select-option>
            <ion-select-option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label>Status</ion-label>
          <ion-select v-model="filters.is_active" placeholder="All" interface="action-sheet" @ionChange="load">
            <ion-select-option value="all">All</ion-select-option>
            <ion-select-option value="true">Active</ion-select-option>
            <ion-select-option value="false">Inactive</ion-select-option>
          </ion-select>
        </ion-item>
      </div>
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
  IonNote,
  IonSpinner,
  IonSelect,
  IonSelectOption
} from '@ionic/vue'
import { addOutline, menuOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getVendors, deleteVendor, getVendorCategories } from '@/api/work'

const list = ref([])
const categories = ref([])
const loading = ref(false)
const filters = ref({ category_id: '', is_active: 'all' })

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
    const params = {}
    if (filters.value.category_id) params.category_id = filters.value.category_id
    if (filters.value.is_active && filters.value.is_active !== 'all') params.is_active = filters.value.is_active
    const res = await getVendors(params)
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
    const res = await deleteVendor(row.id)
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
.filters { --background: transparent; padding: 8px 0; }
.filters ion-item { --min-height: 44px; }
.filters ion-select { max-width: 100%; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
