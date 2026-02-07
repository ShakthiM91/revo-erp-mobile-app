<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/assets" />
        </ion-buttons>
        <ion-title>Asset Categories</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openForm()">
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
      <ion-list v-else-if="categories.length" lines="inset">
        <template v-for="cat in categories" :key="cat.id">
          <AssetCategoryItem
            :category="cat"
            @edit="(c) => openForm(c)"
            @delete="(c) => onDelete(c)"
            @toggle-active="(c, a) => onToggleActive(c, a)"
            @add-child="(parentId) => openForm(null, parentId)"
          />
        </template>
      </ion-list>
      <div v-else class="empty-state">
        <ion-note>No categories</ion-note>
      </div>
    </ion-content>

    <AssetCategoryForm
      :is-open="formOpen"
      :category="currentCategory"
      @close="formOpen = false"
      @success="onFormSuccess"
    />
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
  IonSpinner,
  IonNote
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getAssetCategoryTree, deleteAssetCategory, toggleAssetCategoryActive } from '@/api/asset'
import AssetCategoryItem from './components/CategoryItem.vue'
import AssetCategoryForm from './components/CategoryForm.vue'

const loading = ref(false)
const categories = ref([])
const formOpen = ref(false)
const currentCategory = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await getAssetCategoryTree()
    const data = res?.data ?? (res?.success ? res?.data : []) ?? []
    categories.value = Array.isArray(data) ? data : []
  } catch (e) {
    showToast('Failed to load')
    categories.value = []
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

function openForm(category = null, parentId = null) {
  if (category) {
    if (category.is_default || category.tenant_id == null) {
      showToast('Default categories cannot be edited')
      return
    }
    currentCategory.value = { ...category }
  } else {
    currentCategory.value = {
      parent_id: parentId != null ? Number(parentId) : null
    }
  }
  formOpen.value = true
}

async function onDelete(cat) {
  if (cat.is_default || cat.tenant_id == null) {
    showToast('Default categories cannot be deleted')
    return
  }
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${cat.name}"?` })
    await deleteAssetCategory(cat.id)
    showToast('Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

async function onToggleActive(cat, isActive) {
  if (cat.is_default || cat.tenant_id == null) {
    showToast('Default categories cannot be toggled')
    return
  }
  try {
    await toggleAssetCategoryActive(cat.id, isActive)
    showToast(isActive ? 'Activated' : 'Deactivated')
    load()
  } catch (e) {
    showToast(e?.message || 'Failed')
  }
}

function onFormSuccess() {
  formOpen.value = false
  currentCategory.value = null
  load()
}

onMounted(() => load())
</script>

<style scoped>
ion-content { --background: #f7f8fa; }
.spinner { margin: 48px auto; display: block; }
.empty-state { padding: 48px 16px; text-align: center; }
</style>
